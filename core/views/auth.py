"""
Authentication Views
Contains: Login, Logout, Forgot Password, OTP Verification, Password Reset
"""
from django.shortcuts import render, redirect
from django.http import JsonResponse
from django.views.decorators.http import require_http_methods
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.decorators import login_required
from django.core.mail import send_mail
from django.conf import settings
from django.utils import timezone
import json
import random
import string
from ..models import User, Client, Staff


# Store OTPs temporarily (in production, use cache/redis)
otp_storage = {}


def generate_otp():
    """Generate a 6-digit OTP"""
    return ''.join(random.choices(string.digits, k=6))


def login_view(request):
    """Multi-step login page"""
    if request.user.is_authenticated:
        return redirect_to_dashboard(request.user)
    return render(request, 'auth/login.html')


@csrf_exempt
@require_http_methods(["POST"])
def api_check_email(request):
    """API to check if email exists for the selected role"""
    try:
        data = json.loads(request.body)
        email = data.get('email', '').strip().lower()
        role = data.get('role', '')
        
        if not email:
            return JsonResponse({'success': False, 'message': 'Email is required'})
        
        if not role:
            return JsonResponse({'success': False, 'message': 'Role is required'})
        
        # Check user exists with this email and role
        user = User.objects.filter(email__iexact=email, role=role).first()
        
        # FALLBACK: If no user found and role is super_admin, check for Django superuser
        # This handles cases where superuser was created but role wasn't set properly
        if not user and role == 'super_admin':
            user = User.objects.filter(email__iexact=email, is_superuser=True).first()
            if user:
                # Auto-heal: Set the role to match their superuser status
                user.role = 'super_admin'
                user.save(update_fields=['role'])
        
        if not user:
            return JsonResponse({
                'success': False, 
                'message': f'No {role.replace("_", " ").title()} account found with this email'
            })
        
        if not user.is_active:
            return JsonResponse({
                'success': False, 
                'message': 'This account is inactive. Please contact administrator.'
            })
        
        return JsonResponse({
            'success': True,
            'message': 'Email verified',
            'user_name': user.get_full_name() or user.username
        })
        
    except Exception as e:
        return JsonResponse({'success': False, 'message': str(e)}, status=400)


@csrf_exempt
@require_http_methods(["POST"])
def api_login(request):
    """API to authenticate user"""
    try:
        data = json.loads(request.body)
        email = data.get('email', '').strip().lower()
        password = data.get('password', '')
        role = data.get('role', '')
        
        if not email or not password:
            return JsonResponse({'success': False, 'message': 'Email and password are required'})
        
        # Find user by email and role
        user = User.objects.filter(email__iexact=email, role=role).first()
        
        # FALLBACK: If no user found and role is super_admin, check for Django superuser
        if not user and role == 'super_admin':
            user = User.objects.filter(email__iexact=email, is_superuser=True).first()
            if user:
                # Auto-heal: Ensure role is set correctly
                user.role = 'super_admin'
                user.save(update_fields=['role'])
        
        if not user:
            return JsonResponse({'success': False, 'message': 'Invalid credentials'})
        
        # Check password
        if not user.check_password(password):
            return JsonResponse({'success': False, 'message': 'Invalid password'})
        
        if not user.is_active:
            return JsonResponse({'success': False, 'message': 'Account is inactive'})
        
        # Login the user
        login(request, user)
        
        # Determine redirect URL based on role
        redirect_url = get_dashboard_url(user)
        
        return JsonResponse({
            'success': True,
            'message': 'Login successful',
            'redirect_url': redirect_url
        })
        
    except Exception as e:
        return JsonResponse({'success': False, 'message': str(e)}, status=400)


@csrf_exempt
@require_http_methods(["POST"])
def api_forgot_password(request):
    """API to send OTP for password reset"""
    try:
        data = json.loads(request.body)
        email = data.get('email', '').strip().lower()
        role = data.get('role', '')
        
        if not email:
            return JsonResponse({'success': False, 'message': 'Email is required'})
        
        # Find user
        user = User.objects.filter(email__iexact=email, role=role).first()
        
        # FALLBACK: If no user found and role is super_admin, check for Django superuser
        if not user and role == 'super_admin':
            user = User.objects.filter(email__iexact=email, is_superuser=True).first()
        
        if not user:
            # Don't reveal if email exists for security
            return JsonResponse({
                'success': True, 
                'message': 'If an account exists with this email, OTP has been sent.'
            })
        
        # Generate OTP
        otp = generate_otp()
        otp_storage[email] = {
            'otp': otp,
            'user_id': user.id,
            'created_at': timezone.now(),
            'attempts': 0
        }
        
        # Send OTP via email
        email_sent = False
        try:
            # Check if email settings are configured
            if settings.EMAIL_HOST_USER:
                send_mail(
                    subject='Password Reset OTP - Adarsh Admin',
                    message=f'''Hello {user.get_full_name() or user.username},

You have requested to reset your password for Adarsh Admin.

Your OTP is: {otp}

This OTP is valid for 10 minutes. Do not share this code with anyone.

If you did not request this, please ignore this email.

Regards,
Adarsh Admin Team''',
                    from_email=settings.DEFAULT_FROM_EMAIL,
                    recipient_list=[email],
                    fail_silently=False,
                )
                email_sent = True
        except Exception as e:
            print(f"[EMAIL ERROR] Failed to send OTP to {email}: {e}")
        
        # For development - print OTP to console
        print(f"[DEV] OTP for {email}: {otp}")
        
        return JsonResponse({
            'success': True,
            'message': 'OTP has been sent to your email.',
            'dev_otp': otp if settings.DEBUG else None  # Only in debug mode
        })
        
    except Exception as e:
        return JsonResponse({'success': False, 'message': str(e)}, status=400)


@csrf_exempt
@require_http_methods(["POST"])
def api_verify_otp(request):
    """API to verify OTP"""
    try:
        data = json.loads(request.body)
        email = data.get('email', '').strip().lower()
        otp = data.get('otp', '').strip()
        
        if not email or not otp:
            return JsonResponse({'success': False, 'message': 'Email and OTP are required'})
        
        stored = otp_storage.get(email)
        
        if not stored:
            return JsonResponse({'success': False, 'message': 'OTP expired or not found. Please request a new one.'})
        
        # Check attempts
        if stored['attempts'] >= 3:
            del otp_storage[email]
            return JsonResponse({'success': False, 'message': 'Too many attempts. Please request a new OTP.'})
        
        # Check expiry (10 minutes)
        if (timezone.now() - stored['created_at']).seconds > 600:
            del otp_storage[email]
            return JsonResponse({'success': False, 'message': 'OTP expired. Please request a new one.'})
        
        if stored['otp'] != otp:
            stored['attempts'] += 1
            return JsonResponse({'success': False, 'message': 'Invalid OTP'})
        
        # OTP verified - generate reset token
        reset_token = ''.join(random.choices(string.ascii_letters + string.digits, k=32))
        stored['reset_token'] = reset_token
        stored['otp_verified'] = True
        
        return JsonResponse({
            'success': True,
            'message': 'OTP verified successfully',
            'reset_token': reset_token
        })
        
    except Exception as e:
        return JsonResponse({'success': False, 'message': str(e)}, status=400)


@csrf_exempt
@require_http_methods(["POST"])
def api_reset_password(request):
    """API to reset password after OTP verification"""
    try:
        data = json.loads(request.body)
        email = data.get('email', '').strip().lower()
        reset_token = data.get('reset_token', '')
        new_password = data.get('new_password', '')
        confirm_password = data.get('confirm_password', '')
        
        if not all([email, reset_token, new_password, confirm_password]):
            return JsonResponse({'success': False, 'message': 'All fields are required'})
        
        if new_password != confirm_password:
            return JsonResponse({'success': False, 'message': 'Passwords do not match'})
        
        if len(new_password) < 6:
            return JsonResponse({'success': False, 'message': 'Password must be at least 6 characters'})
        
        stored = otp_storage.get(email)
        
        if not stored or not stored.get('otp_verified'):
            return JsonResponse({'success': False, 'message': 'Invalid or expired session. Please start over.'})
        
        if stored.get('reset_token') != reset_token:
            return JsonResponse({'success': False, 'message': 'Invalid reset token'})
        
        # Reset password
        user = User.objects.get(id=stored['user_id'])
        user.set_password(new_password)
        user.save()
        
        # Clear OTP storage
        del otp_storage[email]
        
        return JsonResponse({
            'success': True,
            'message': 'Password reset successfully. You can now login with your new password.'
        })
        
    except User.DoesNotExist:
        return JsonResponse({'success': False, 'message': 'User not found'}, status=400)
    except Exception as e:
        return JsonResponse({'success': False, 'message': str(e)}, status=400)


def logout_view(request):
    """Logout and redirect to login"""
    logout(request)
    return redirect('login')


def get_dashboard_url(user):
    """Get the appropriate dashboard URL based on user role"""
    if user.role == 'super_admin':
        return '/'
    elif user.role == 'admin_staff':
        return '/admin-staff-dashboard/'
    elif user.role == 'client':
        return '/client-dashboard/'
    elif user.role == 'client_staff':
        return '/client-staff-dashboard/'
    return '/'


def redirect_to_dashboard(user):
    """Redirect user to their appropriate dashboard"""
    url = get_dashboard_url(user)
    return redirect(url)


# Role-specific dashboards
@login_required
def admin_staff_dashboard(request):
    """Dashboard for Admin Staff"""
    if request.user.role != 'admin_staff':
        return redirect_to_dashboard(request.user)
    
    context = {
        'active_page': 'dashboard',
        'user_role': request.user.get_role_display(),
        'user_name': request.user.get_full_name() or request.user.username,
    }
    return render(request, 'dashboards/role-dashboard.html', context)


@login_required
def client_dashboard(request):
    """Dashboard for Clients"""
    if request.user.role != 'client':
        return redirect_to_dashboard(request.user)
    
    context = {
        'active_page': 'dashboard',
        'user_role': request.user.get_role_display(),
        'user_name': request.user.get_full_name() or request.user.username,
    }
    return render(request, 'dashboards/role-dashboard.html', context)


@login_required
def client_staff_dashboard(request):
    """Dashboard for Client Staff"""
    if request.user.role != 'client_staff':
        return redirect_to_dashboard(request.user)
    
    context = {
        'active_page': 'dashboard',
        'user_role': request.user.get_role_display(),
        'user_name': request.user.get_full_name() or request.user.username,
    }
    return render(request, 'dashboards/role-dashboard.html', context)
