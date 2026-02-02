"""
Staff API Views
Contains: All staff-related API endpoints (CRUD, toggle status)
"""
from django.shortcuts import get_object_or_404
from django.http import JsonResponse
from django.views.decorators.http import require_http_methods
from django.views.decorators.csrf import csrf_exempt
import json
from ..models import Staff, User


@csrf_exempt
@require_http_methods(["POST"])
def api_staff_create(request):
    """API endpoint to create a new admin staff"""
    try:
        data = json.loads(request.body)
        
        # Create the user first
        email = data.get('email', '')
        username = email.split('@')[0].lower().replace('.', '_') if email else 'staff'
        # Make username unique
        base_username = username
        counter = 1
        while User.objects.filter(username=username).exists():
            username = f"{base_username}{counter}"
            counter += 1
        
        # Name for user
        name = data.get('name', '')
        name_parts = name.split() if name else []
        
        user = User.objects.create_user(
            username=username,
            email=email,
            first_name=name_parts[0] if name_parts else '',
            last_name=' '.join(name_parts[1:]) if len(name_parts) > 1 else '',
            phone=data.get('phone', ''),
            role='admin_staff',
        )
        user.set_password('staff123')  # Default password
        user.save()
        
        # Create the staff profile
        staff = Staff.objects.create(
            user=user,
            staff_type='admin_staff',
            address=data.get('address', ''),
            department=data.get('department', ''),
            designation=data.get('designation', ''),
            # Staff Permissions
            perm_staff_list=data.get('perm_staff_list', False),
            perm_staff_add=data.get('perm_staff_add', False),
            perm_staff_edit=data.get('perm_staff_edit', False),
            perm_staff_delete=data.get('perm_staff_delete', False),
            perm_staff_status=data.get('perm_staff_status', False),
            # ID Card Setting Permissions
            perm_idcard_setting_list=data.get('perm_idcard_setting_list', False),
            perm_idcard_setting_add=data.get('perm_idcard_setting_add', False),
            perm_idcard_setting_edit=data.get('perm_idcard_setting_edit', False),
            perm_idcard_setting_delete=data.get('perm_idcard_setting_delete', False),
            perm_idcard_setting_status=data.get('perm_idcard_setting_status', False),
        )
        
        return JsonResponse({
            'success': True,
            'message': 'Staff created successfully!',
            'staff': {
                'id': staff.id,
                'name': user.get_full_name(),
                'email': user.email,
                'phone': user.phone,
                'status': 'active' if user.is_active else 'inactive',
            }
        })
    except Exception as e:
        return JsonResponse({'success': False, 'message': str(e)}, status=400)


@csrf_exempt
@require_http_methods(["GET"])
def api_staff_get(request, staff_id):
    """API endpoint to get a staff's details"""
    try:
        staff = get_object_or_404(Staff, id=staff_id)
        user = staff.user
        return JsonResponse({
            'success': True,
            'staff': {
                'id': staff.id,
                'name': user.get_full_name(),
                'email': user.email,
                'phone': user.phone or '',
                'address': staff.address or '',
                'department': staff.department or '',
                'designation': staff.designation or '',
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
                'status': 'active' if user.is_active else 'inactive',
                'created_at': staff.created_at.strftime('%d-%m-%Y %I:%M %p'),
                'updated_at': staff.updated_at.strftime('%d-%m-%Y %I:%M %p'),
            }
        })
    except Exception as e:
        return JsonResponse({'success': False, 'message': str(e)}, status=400)


@csrf_exempt
@require_http_methods(["PUT", "POST"])
def api_staff_update(request, staff_id):
    """API endpoint to update a staff"""
    try:
        staff = get_object_or_404(Staff, id=staff_id)
        data = json.loads(request.body)
        
        # Update user details
        user = staff.user
        if data.get('email'):
            user.email = data['email']
        if data.get('phone'):
            user.phone = data['phone']
        if data.get('name'):
            name_parts = data['name'].split()
            user.first_name = name_parts[0] if name_parts else ''
            user.last_name = ' '.join(name_parts[1:]) if len(name_parts) > 1 else ''
        user.save()
        
        # Update staff details
        if 'address' in data:
            staff.address = data['address']
        if 'department' in data:
            staff.department = data['department']
        if 'designation' in data:
            staff.designation = data['designation']
        
        # Update Staff Permissions
        for perm in ['perm_staff_list', 'perm_staff_add', 'perm_staff_edit', 'perm_staff_delete', 'perm_staff_status']:
            if perm in data:
                setattr(staff, perm, data[perm])
        
        # Update ID Card Setting Permissions
        for perm in ['perm_idcard_setting_list', 'perm_idcard_setting_add', 'perm_idcard_setting_edit', 
                     'perm_idcard_setting_delete', 'perm_idcard_setting_status']:
            if perm in data:
                setattr(staff, perm, data[perm])
            
        staff.save()
        
        return JsonResponse({
            'success': True,
            'message': 'Staff updated successfully!',
            'staff': {
                'id': staff.id,
                'name': user.get_full_name(),
                'email': user.email,
                'phone': user.phone or '',
                'status': 'active' if user.is_active else 'inactive',
            }
        })
    except Exception as e:
        return JsonResponse({'success': False, 'message': str(e)}, status=400)


@csrf_exempt
@require_http_methods(["DELETE", "POST"])
def api_staff_delete(request, staff_id):
    """API endpoint to delete a staff"""
    try:
        staff = get_object_or_404(Staff, id=staff_id)
        user = staff.user
        staff_name = user.get_full_name()
        
        # Delete the staff profile
        staff.delete()
        # Delete the associated user
        user.delete()
        
        return JsonResponse({
            'success': True,
            'message': f'Staff "{staff_name}" deleted successfully!'
        })
    except Exception as e:
        return JsonResponse({'success': False, 'message': str(e)}, status=400)


@csrf_exempt
@require_http_methods(["POST"])
def api_staff_toggle_status(request, staff_id):
    """API endpoint to toggle staff active/inactive status"""
    try:
        staff = get_object_or_404(Staff, id=staff_id)
        user = staff.user
        
        # Toggle status
        if user.is_active:
            user.is_active = False
            status = 'inactive'
            status_display = 'Inactive'
        else:
            user.is_active = True
            status = 'active'
            status_display = 'Active'
        
        user.save()
        
        return JsonResponse({
            'success': True,
            'message': f'Staff status changed to {status_display}!',
            'status': status,
            'status_display': status_display
        })
    except Exception as e:
        return JsonResponse({'success': False, 'message': str(e)}, status=400)
