"""
Client API Views
Contains: All client-related API endpoints (CRUD, toggle status, get staff)
"""
from django.shortcuts import get_object_or_404
from django.http import JsonResponse
from django.views.decorators.http import require_http_methods
from django.views.decorators.csrf import csrf_exempt
import json
from ..models import Client, Staff, User
from .base import api_super_admin_required
from ..utils import send_welcome_email


def parse_bool(value):
    """Parse boolean from string or bool"""
    if isinstance(value, bool):
        return value
    if isinstance(value, str):
        return value.lower() in ('true', '1', 'yes', 'on')
    return bool(value)


@csrf_exempt
@require_http_methods(["POST"])
@api_super_admin_required
def api_client_create(request):
    """API endpoint to create a new client"""
    try:
        # Check if it's a multipart form (file upload) or JSON
        if request.content_type and 'multipart/form-data' in request.content_type:
            data = request.POST
            photo = request.FILES.get('photo')
        else:
            data = json.loads(request.body)
            photo = None
        
        # Get and validate email
        email = data.get('email', '').strip().lower()
        if not email:
            return JsonResponse({'success': False, 'message': 'Email is required'})
        
        # Check for duplicate email
        if User.objects.filter(email__iexact=email).exists():
            return JsonResponse({
                'success': False, 
                'message': 'A user with this email already exists'
            })
        
        # Create the user first
        username = email.split('@')[0].lower().replace('.', '_') if email else 'user'
        # Make username unique
        base_username = username
        counter = 1
        while User.objects.filter(username=username).exists():
            username = f"{base_username}{counter}"
            counter += 1
        
        # Name for user
        name = data.get('name', '')
        name_parts = name.split() if name else []
        
        # Get phone number and use it as password
        phone = data.get('phone', '').strip()
        # Clean phone number - remove spaces, dashes, etc.
        phone_clean = ''.join(filter(str.isdigit, phone))
        # Use phone number as password (or fallback to default if no phone)
        password = phone_clean if phone_clean else '123456'
        
        user = User.objects.create_user(
            username=username,
            email=email,
            first_name=name_parts[0] if name_parts else '',
            last_name=' '.join(name_parts[1:]) if len(name_parts) > 1 else '',
            phone=data.get('phone', ''),
            role='client',
        )
        user.set_password(password)
        user.save()
        
        # Create the client profile
        client = Client.objects.create(
            user=user,
            name=data.get('name', ''),
            address=data.get('address', ''),
            city=data.get('city', ''),
            state=data.get('state', ''),
            pincode=data.get('pincode', ''),
            # Staff Permissions
            perm_staff_list=parse_bool(data.get('perm_staff_list', False)),
            perm_staff_add=parse_bool(data.get('perm_staff_add', False)),
            perm_staff_edit=parse_bool(data.get('perm_staff_edit', False)),
            perm_staff_delete=parse_bool(data.get('perm_staff_delete', False)),
            perm_staff_status=parse_bool(data.get('perm_staff_status', False)),
            # ID Card Setting Permissions
            perm_idcard_setting_list=parse_bool(data.get('perm_idcard_setting_list', False)),
            perm_idcard_setting_add=parse_bool(data.get('perm_idcard_setting_add', False)),
            perm_idcard_setting_edit=parse_bool(data.get('perm_idcard_setting_edit', False)),
            perm_idcard_setting_delete=parse_bool(data.get('perm_idcard_setting_delete', False)),
            perm_idcard_setting_status=parse_bool(data.get('perm_idcard_setting_status', False)),
            # ID Card List Permissions
            perm_idcard_pending_list=parse_bool(data.get('perm_idcard_pending_list', False)),
            perm_idcard_verified_list=parse_bool(data.get('perm_idcard_verified_list', False)),
            perm_idcard_pool_list=parse_bool(data.get('perm_idcard_pool_list', False)),
            perm_idcard_approved_list=parse_bool(data.get('perm_idcard_approved_list', False)),
            perm_idcard_download_list=parse_bool(data.get('perm_idcard_download_list', False)),
            perm_idcard_reprint_list=parse_bool(data.get('perm_idcard_reprint_list', False)),
            # ID Card Action Permissions
            perm_idcard_add=parse_bool(data.get('perm_idcard_add', False)),
            perm_idcard_edit=parse_bool(data.get('perm_idcard_edit', False)),
            perm_idcard_delete=parse_bool(data.get('perm_idcard_delete', False)),
            perm_idcard_info=parse_bool(data.get('perm_idcard_info', False)),
            perm_idcard_approve=parse_bool(data.get('perm_idcard_approve', False)),
            perm_idcard_verify=parse_bool(data.get('perm_idcard_verify', False)),
            perm_idcard_bulk_upload=parse_bool(data.get('perm_idcard_bulk_upload', False)),
            perm_idcard_bulk_download=parse_bool(data.get('perm_idcard_bulk_download', False)),
            perm_idcard_created_at=parse_bool(data.get('perm_idcard_created_at', False)),
            perm_idcard_updated_at=parse_bool(data.get('perm_idcard_updated_at', False)),
            perm_idcard_delete_from_pool=parse_bool(data.get('perm_idcard_delete_from_pool', False)),
            perm_delete_all_idcard=parse_bool(data.get('perm_delete_all_idcard', False)),
            perm_reupload_idcard_image=parse_bool(data.get('perm_reupload_idcard_image', False)),
            perm_idcard_retrieve=parse_bool(data.get('perm_idcard_retrieve', False)),
            status='active'
        )
        
        # Handle photo upload
        if photo:
            client.photo = photo
            client.save()
        
        # Send welcome email with credentials
        email_sent = False
        email_message = ''
        if email:
            email_sent, email_message = send_welcome_email(
                name=name or 'Client',
                email=email,
                password=password,
                role='client',
                request=request
            )
        
        return JsonResponse({
            'success': True,
            'message': 'Client created successfully!' + (' Welcome email sent.' if email_sent else ' (Email not sent: ' + email_message + ')'),
            'email_sent': email_sent,
            'client': {
                'id': client.id,
                'name': client.name,
                'email': user.email,
                'phone': user.phone,
                'status': client.status,
                'photo_url': client.photo.url if client.photo else None,
            }
        })
    except Exception as e:
        return JsonResponse({'success': False, 'message': str(e)}, status=400)


@csrf_exempt
@require_http_methods(["GET"])
@api_super_admin_required
def api_client_get(request, client_id):
    """API endpoint to get a client's details"""
    try:
        client = get_object_or_404(Client, id=client_id)
        return JsonResponse({
            'success': True,
            'client': {
                'id': client.id,
                'name': client.name,
                'email': client.user.email,
                'phone': client.user.phone or '',
                'address': client.address or '',
                'city': client.city or '',
                'state': client.state or '',
                'pincode': client.pincode or '',
                # Staff Permissions
                'perm_staff_list': client.perm_staff_list,
                'perm_staff_add': client.perm_staff_add,
                'perm_staff_edit': client.perm_staff_edit,
                'perm_staff_delete': client.perm_staff_delete,
                'perm_staff_status': client.perm_staff_status,
                # ID Card Setting Permissions
                'perm_idcard_setting_list': client.perm_idcard_setting_list,
                'perm_idcard_setting_add': client.perm_idcard_setting_add,
                'perm_idcard_setting_edit': client.perm_idcard_setting_edit,
                'perm_idcard_setting_delete': client.perm_idcard_setting_delete,
                'perm_idcard_setting_status': client.perm_idcard_setting_status,
                # ID Card List Permissions
                'perm_idcard_pending_list': client.perm_idcard_pending_list,
                'perm_idcard_verified_list': client.perm_idcard_verified_list,
                'perm_idcard_pool_list': client.perm_idcard_pool_list,
                'perm_idcard_approved_list': client.perm_idcard_approved_list,
                'perm_idcard_download_list': client.perm_idcard_download_list,
                'perm_idcard_reprint_list': client.perm_idcard_reprint_list,
                # ID Card Action Permissions
                'perm_idcard_add': client.perm_idcard_add,
                'perm_idcard_edit': client.perm_idcard_edit,
                'perm_idcard_delete': client.perm_idcard_delete,
                'perm_idcard_info': client.perm_idcard_info,
                'perm_idcard_approve': client.perm_idcard_approve,
                'perm_idcard_verify': client.perm_idcard_verify,
                'perm_idcard_bulk_upload': client.perm_idcard_bulk_upload,
                'perm_idcard_bulk_download': client.perm_idcard_bulk_download,
                'perm_idcard_created_at': client.perm_idcard_created_at,
                'perm_idcard_updated_at': client.perm_idcard_updated_at,
                'perm_idcard_delete_from_pool': client.perm_idcard_delete_from_pool,
                'perm_delete_all_idcard': client.perm_delete_all_idcard,
                'perm_reupload_idcard_image': client.perm_reupload_idcard_image,
                'perm_idcard_retrieve': client.perm_idcard_retrieve,
                'status': client.status,
                'photo_url': client.photo.url if client.photo else None,
                'created_at': client.created_at.strftime('%d-%m-%Y %I:%M %p'),
                'updated_at': client.updated_at.strftime('%d-%m-%Y %I:%M %p'),
            }
        })
    except Exception as e:
        return JsonResponse({'success': False, 'message': str(e)}, status=400)


@csrf_exempt
@require_http_methods(["PUT", "POST"])
@api_super_admin_required
def api_client_update(request, client_id):
    """API endpoint to update a client"""
    try:
        client = get_object_or_404(Client, id=client_id)
        
        # Check if it's a multipart form (file upload) or JSON
        if request.content_type and 'multipart/form-data' in request.content_type:
            data = request.POST
            photo = request.FILES.get('photo')
        else:
            data = json.loads(request.body)
            photo = None
        
        # Update user details
        user = client.user
        if data.get('email'):
            user.email = data['email']
        if data.get('phone'):
            user.phone = data['phone']
        if data.get('name'):
            name_parts = data['name'].split()
            user.first_name = name_parts[0] if name_parts else ''
            user.last_name = ' '.join(name_parts[1:]) if len(name_parts) > 1 else ''
        user.save()
        
        # Update client details
        if data.get('name'):
            client.name = data['name']
        if 'address' in data:
            client.address = data['address']
        if 'city' in data:
            client.city = data['city']
        if 'state' in data:
            client.state = data['state']
        if 'pincode' in data:
            client.pincode = data['pincode']
        
        # Handle photo upload
        if photo:
            client.photo = photo
        
        # Update Staff Permissions
        for perm in ['perm_staff_list', 'perm_staff_add', 'perm_staff_edit', 'perm_staff_delete', 'perm_staff_status']:
            if perm in data:
                setattr(client, perm, parse_bool(data[perm]))
        
        # Update ID Card Setting Permissions
        for perm in ['perm_idcard_setting_list', 'perm_idcard_setting_add', 'perm_idcard_setting_edit', 
                     'perm_idcard_setting_delete', 'perm_idcard_setting_status']:
            if perm in data:
                setattr(client, perm, parse_bool(data[perm]))
        
        # Update ID Card List Permissions
        for perm in ['perm_idcard_pending_list', 'perm_idcard_verified_list', 'perm_idcard_pool_list',
                     'perm_idcard_approved_list', 'perm_idcard_download_list', 'perm_idcard_reprint_list']:
            if perm in data:
                setattr(client, perm, parse_bool(data[perm]))
        
        # Update ID Card Action Permissions
        for perm in ['perm_idcard_add', 'perm_idcard_edit', 'perm_idcard_delete', 'perm_idcard_info',
                     'perm_idcard_approve', 'perm_idcard_verify', 'perm_idcard_bulk_upload', 
                     'perm_idcard_bulk_download', 'perm_idcard_created_at', 'perm_idcard_updated_at',
                     'perm_idcard_delete_from_pool', 'perm_delete_all_idcard', 'perm_reupload_idcard_image',
                     'perm_idcard_retrieve']:
            if perm in data:
                setattr(client, perm, parse_bool(data[perm]))
            
        client.save()
        
        return JsonResponse({
            'success': True,
            'message': 'Client updated successfully!',
            'client': {
                'id': client.id,
                'name': client.name,
                'email': user.email,
                'phone': user.phone or '',
                'status': client.status,
                'photo_url': client.photo.url if client.photo else None,
            }
        })
    except Exception as e:
        return JsonResponse({'success': False, 'message': str(e)}, status=400)


@csrf_exempt
@require_http_methods(["DELETE", "POST"])
@api_super_admin_required
def api_client_delete(request, client_id):
    """API endpoint to delete a client"""
    try:
        client = get_object_or_404(Client, id=client_id)
        user = client.user
        client_name = client.name
        
        # Delete the client (this will cascade)
        client.delete()
        # Delete the associated user
        user.delete()
        
        return JsonResponse({
            'success': True,
            'message': f'Client "{client_name}" deleted successfully!'
        })
    except Exception as e:
        return JsonResponse({'success': False, 'message': str(e)}, status=400)


@csrf_exempt
@require_http_methods(["POST"])
@api_super_admin_required
def api_client_toggle_status(request, client_id):
    """API endpoint to toggle client active/inactive status"""
    try:
        client = get_object_or_404(Client, id=client_id)
        
        # Toggle status
        if client.status == 'active':
            client.status = 'inactive'
            client.user.is_active = False
        else:
            client.status = 'active'
            client.user.is_active = True
        
        client.user.save()
        client.save()
        
        return JsonResponse({
            'success': True,
            'message': f'Client status changed to {client.get_status_display()}!',
            'status': client.status,
            'status_display': client.get_status_display()
        })
    except Exception as e:
        return JsonResponse({'success': False, 'message': str(e)}, status=400)


@csrf_exempt
@require_http_methods(["GET"])
@api_super_admin_required
def api_client_staff(request, client_id):
    """API endpoint to get all staff members for a specific client"""
    try:
        client = get_object_or_404(Client, id=client_id)
        staff_members = Staff.objects.filter(client=client, staff_type='client_staff').select_related('user')
        
        staff_list = []
        active_count = 0
        inactive_count = 0
        
        for staff in staff_members:
            is_active = staff.user.is_active
            if is_active:
                active_count += 1
            else:
                inactive_count += 1
            
            staff_list.append({
                'id': staff.id,
                'name': staff.user.get_full_name() or staff.user.username,
                'email': staff.user.email or '',
                'phone': staff.user.phone or '',
                'department': staff.department or '',
                'designation': staff.designation or '',
                'address': staff.address or '',
                'is_active': is_active,
                'created_at': staff.created_at.strftime('%d-%m-%Y'),
                # Staff Permissions
                'perm_staff_list': staff.perm_staff_list,
                'perm_staff_add': staff.perm_staff_add,
                'perm_staff_edit': staff.perm_staff_edit,
                'perm_staff_delete': staff.perm_staff_delete,
                'perm_staff_status': staff.perm_staff_status,
                # ID Card Setting Permissions
                'perm_idcard_setting_list': staff.perm_idcard_setting_list,
                'perm_idcard_setting_add': staff.perm_idcard_setting_add,
                'perm_idcard_setting_edit': staff.perm_idcard_setting_edit,
                'perm_idcard_setting_delete': staff.perm_idcard_setting_delete,
                'perm_idcard_setting_status': staff.perm_idcard_setting_status,
            })
        
        return JsonResponse({
            'success': True,
            'client_name': client.name,
            'staff': staff_list,
            'total': len(staff_list),
            'active': active_count,
            'inactive': inactive_count
        })
    except Exception as e:
        return JsonResponse({'success': False, 'message': str(e)}, status=400)
