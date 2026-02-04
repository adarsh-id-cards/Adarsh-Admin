"""
Settings API Views
Contains: Profile update, Password change, Profile picture upload
Works for all user roles
"""
import os
import uuid
from django.http import JsonResponse
from django.views.decorators.http import require_http_methods
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth.decorators import login_required
from django.contrib.auth import update_session_auth_hash
from django.conf import settings
import json
from ..models import User


@csrf_exempt
@require_http_methods(["GET"])
@login_required
def api_get_profile(request):
    """Get current user's profile data"""
    user = request.user
    
    # Get profile image URL
    profile_image_url = None
    if user.profile_image:
        profile_image_url = user.profile_image.url
    
    # Calculate member since
    from django.utils import timezone
    now = timezone.now()
    diff = now - user.created_at
    years = diff.days // 365
    months = (diff.days % 365) // 30
    
    if years > 0:
        member_since = f"{years} year{'s' if years > 1 else ''}"
    elif months > 0:
        member_since = f"{months} month{'s' if months > 1 else ''}"
    else:
        member_since = f"{diff.days} day{'s' if diff.days != 1 else ''}"
    
    return JsonResponse({
        'success': True,
        'profile': {
            'id': user.id,
            'username': user.username,
            'email': user.email,
            'first_name': user.first_name,
            'last_name': user.last_name,
            'full_name': user.get_full_name() or user.username,
            'phone': user.phone or '',
            'role': user.role,
            'role_display': user.get_role_display(),
            'profile_image': profile_image_url,
            'member_since': member_since,
            'created_at': user.created_at.isoformat(),
            'is_active': user.is_active,
        }
    })


@csrf_exempt
@require_http_methods(["POST"])
@login_required
def api_update_profile(request):
    """Update current user's profile information"""
    try:
        data = json.loads(request.body)
        user = request.user
        
        # Update allowed fields
        if 'first_name' in data:
            user.first_name = data['first_name'].strip()
        if 'last_name' in data:
            user.last_name = data['last_name'].strip()
        if 'phone' in data:
            user.phone = data['phone'].strip()
        
        # Username can be updated only if not taken
        if 'username' in data:
            new_username = data['username'].strip()
            if new_username and new_username != user.username:
                if User.objects.filter(username__iexact=new_username).exclude(id=user.id).exists():
                    return JsonResponse({
                        'success': False,
                        'message': 'Username is already taken'
                    })
                user.username = new_username
        
        # Email can be updated only if not taken
        if 'email' in data:
            new_email = data['email'].strip().lower()
            if new_email and new_email != user.email:
                if User.objects.filter(email__iexact=new_email).exclude(id=user.id).exists():
                    return JsonResponse({
                        'success': False,
                        'message': 'Email is already in use'
                    })
                user.email = new_email
        
        user.save()
        
        return JsonResponse({
            'success': True,
            'message': 'Profile updated successfully',
            'profile': {
                'username': user.username,
                'email': user.email,
                'first_name': user.first_name,
                'last_name': user.last_name,
                'full_name': user.get_full_name() or user.username,
                'phone': user.phone or '',
            }
        })
        
    except json.JSONDecodeError:
        return JsonResponse({'success': False, 'message': 'Invalid JSON data'}, status=400)
    except Exception as e:
        return JsonResponse({'success': False, 'message': str(e)}, status=400)


@csrf_exempt
@require_http_methods(["POST"])
@login_required
def api_change_password(request):
    """Change current user's password"""
    try:
        data = json.loads(request.body)
        user = request.user
        
        current_password = data.get('current_password', '')
        new_password = data.get('new_password', '')
        confirm_password = data.get('confirm_password', '')
        
        # Validate current password
        if not user.check_password(current_password):
            return JsonResponse({
                'success': False,
                'message': 'Current password is incorrect'
            })
        
        # Validate new password
        if not new_password:
            return JsonResponse({
                'success': False,
                'message': 'New password is required'
            })
        
        if len(new_password) < 6:
            return JsonResponse({
                'success': False,
                'message': 'Password must be at least 6 characters long'
            })
        
        if new_password != confirm_password:
            return JsonResponse({
                'success': False,
                'message': 'New passwords do not match'
            })
        
        # Update password
        user.set_password(new_password)
        user.save()
        
        # Keep user logged in after password change
        update_session_auth_hash(request, user)
        
        return JsonResponse({
            'success': True,
            'message': 'Password changed successfully'
        })
        
    except json.JSONDecodeError:
        return JsonResponse({'success': False, 'message': 'Invalid JSON data'}, status=400)
    except Exception as e:
        return JsonResponse({'success': False, 'message': str(e)}, status=400)


@csrf_exempt
@require_http_methods(["POST"])
@login_required
def api_upload_profile_image(request):
    """Upload profile image for current user"""
    try:
        if 'profile_image' not in request.FILES:
            return JsonResponse({
                'success': False,
                'message': 'No image file provided'
            })
        
        image = request.FILES['profile_image']
        user = request.user
        
        # Validate file type
        allowed_types = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
        if image.content_type not in allowed_types:
            return JsonResponse({
                'success': False,
                'message': 'Invalid file type. Allowed: JPEG, PNG, GIF, WebP'
            })
        
        # Validate file size (max 5MB)
        max_size = 5 * 1024 * 1024  # 5MB
        if image.size > max_size:
            return JsonResponse({
                'success': False,
                'message': 'File size too large. Maximum 5MB allowed.'
            })
        
        # Delete old profile image if exists
        if user.profile_image:
            old_path = user.profile_image.path
            if os.path.exists(old_path):
                os.remove(old_path)
        
        # Generate unique filename
        ext = os.path.splitext(image.name)[1].lower()
        filename = f"profile_{user.id}_{uuid.uuid4().hex[:8]}{ext}"
        
        # Save new image
        user.profile_image.save(filename, image)
        user.save()
        
        return JsonResponse({
            'success': True,
            'message': 'Profile image updated successfully',
            'image_url': user.profile_image.url
        })
        
    except Exception as e:
        return JsonResponse({'success': False, 'message': str(e)}, status=400)


@csrf_exempt
@require_http_methods(["POST"])
@login_required
def api_remove_profile_image(request):
    """Remove profile image for current user"""
    try:
        user = request.user
        
        if user.profile_image:
            # Delete the file
            old_path = user.profile_image.path
            if os.path.exists(old_path):
                os.remove(old_path)
            
            # Clear the field
            user.profile_image = None
            user.save()
        
        return JsonResponse({
            'success': True,
            'message': 'Profile image removed successfully'
        })
        
    except Exception as e:
        return JsonResponse({'success': False, 'message': str(e)}, status=400)
