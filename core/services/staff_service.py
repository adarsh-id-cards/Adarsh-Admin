"""
Staff Service Module
Contains: Staff CRUD operations, serialization
"""
from typing import Dict, Any, Optional, List

from django.shortcuts import get_object_or_404

from ..models import Staff, User
from ..utils import send_welcome_email
from .base import BaseService, ServiceResult


class StaffService(BaseService):
    """
    Service for Staff CRUD operations.
    
    Handles both admin_staff (under super_admin) and client_staff (under clients).
    """
    
    # Permission fields for Staff model
    PERMISSION_FIELDS = [
        'perm_staff_list', 'perm_staff_add', 'perm_staff_edit', 
        'perm_staff_delete', 'perm_staff_status',
        'perm_idcard_setting_list', 'perm_idcard_setting_add', 
        'perm_idcard_setting_edit', 'perm_idcard_setting_delete', 
        'perm_idcard_setting_status',
    ]
    
    @classmethod
    def serialize(cls, staff: Staff, include_permissions: bool = True) -> Dict[str, Any]:
        """Serialize Staff instance to dict"""
        user = staff.user
        data = {
            'id': staff.id,
            'name': user.get_full_name(),
            'email': user.email,
            'phone': user.phone or '',
            'address': staff.address or '',
            'department': staff.department or '',
            'designation': staff.designation or '',
            'staff_type': staff.staff_type,
            'status': 'active' if user.is_active else 'inactive',
            'profile_image_url': user.profile_image.url if user.profile_image else None,
            'created_at': staff.created_at.strftime('%d-%m-%Y %I:%M %p'),
            'updated_at': staff.updated_at.strftime('%d-%m-%Y %I:%M %p'),
        }
        
        if include_permissions:
            for perm in cls.PERMISSION_FIELDS:
                data[perm] = getattr(staff, perm, False)
        
        return data
    
    @classmethod
    def create(
        cls, 
        data: Dict[str, Any], 
        staff_type: str = 'admin_staff',
        client=None,
        request=None, 
        profile_image=None
    ) -> ServiceResult:
        """
        Create a new staff member.
        
        Args:
            data: Dict with staff data
            staff_type: 'admin_staff' or 'client_staff'
            client: Client instance (required for client_staff)
            request: HTTP request (for email context)
            profile_image: Uploaded profile image
        
        Returns:
            ServiceResult with staff data
        """
        try:
            email = data.get('email', '').strip().lower()
            if not email:
                return ServiceResult(success=False, message='Email is required')
            
            # Check for duplicate email
            if User.objects.filter(email__iexact=email).exists():
                return ServiceResult(
                    success=False, 
                    message='A user with this email already exists'
                )
            
            # Generate unique username
            username = email.split('@')[0].lower().replace('.', '_')
            base_username = username
            counter = 1
            while User.objects.filter(username=username).exists():
                username = f"{base_username}{counter}"
                counter += 1
            
            # Parse name
            name = data.get('name', '')
            name_parts = name.split() if name else []
            
            # Password from phone number
            phone = data.get('phone', '').strip()
            phone_clean = ''.join(filter(str.isdigit, phone))
            password = phone_clean if phone_clean else '123456'
            
            # Determine role
            role = 'admin_staff' if staff_type == 'admin_staff' else 'client_staff'
            
            # Create user
            is_active = cls.parse_bool(data.get('is_active', True))
            user = User.objects.create_user(
                username=username,
                email=email,
                first_name=name_parts[0] if name_parts else '',
                last_name=' '.join(name_parts[1:]) if len(name_parts) > 1 else '',
                phone=data.get('phone', ''),
                role=role,
                is_active=is_active,
            )
            user.set_password(password)
            
            if profile_image:
                user.profile_image = profile_image
            user.save()
            
            # Build staff kwargs
            staff_kwargs = {
                'user': user,
                'staff_type': staff_type,
                'address': data.get('address', ''),
                'department': data.get('department', ''),
                'designation': data.get('designation', ''),
            }
            
            # Add client for client_staff
            if staff_type == 'client_staff' and client:
                staff_kwargs['client'] = client
            
            # Add permissions
            for perm in cls.PERMISSION_FIELDS:
                if perm in data:
                    staff_kwargs[perm] = cls.parse_bool(data[perm])
            
            staff = Staff.objects.create(**staff_kwargs)
            
            # Send welcome email
            email_sent = False
            email_message = ''
            if email and request:
                email_sent, email_message = send_welcome_email(
                    name=name or user.get_full_name() or 'User',
                    email=email,
                    password=password,
                    role=role,
                    request=request
                )
            
            message = 'Staff created successfully!'
            if email_sent:
                message += ' Welcome email sent.'
            elif email_message:
                message += f' (Email not sent: {email_message})'
            
            return ServiceResult(
                success=True,
                message=message,
                data={
                    'staff': cls.serialize(staff, include_permissions=False),
                    'email_sent': email_sent,
                }
            )
            
        except Exception as e:
            return ServiceResult(success=False, message=str(e))
    
    @classmethod
    def get(cls, staff_id: int, include_permissions: bool = True) -> ServiceResult:
        """Get a staff member by ID"""
        try:
            staff = get_object_or_404(Staff, id=staff_id)
            return ServiceResult(
                success=True,
                data={'staff': cls.serialize(staff, include_permissions)}
            )
        except Exception as e:
            return ServiceResult(success=False, message=str(e))
    
    @classmethod
    def update(cls, staff_id: int, data: Dict[str, Any], profile_image=None) -> ServiceResult:
        """Update a staff member"""
        try:
            staff = get_object_or_404(Staff, id=staff_id)
            user = staff.user
            
            # Update user fields
            if data.get('email'):
                user.email = data['email']
            if data.get('phone'):
                user.phone = data['phone']
            if data.get('name'):
                name_parts = data['name'].split()
                user.first_name = name_parts[0] if name_parts else ''
                user.last_name = ' '.join(name_parts[1:]) if len(name_parts) > 1 else ''
            
            # Update password if provided
            password = data.get('password', '')
            if isinstance(password, str) and password.strip():
                user.set_password(password.strip())
            
            # Update status
            if 'is_active' in data:
                user.is_active = cls.parse_bool(data['is_active'])
            
            # Handle profile image
            if profile_image:
                user.profile_image = profile_image
            
            user.save()
            
            # Update staff fields
            for field in ['address', 'department', 'designation']:
                if field in data:
                    setattr(staff, field, data[field])
            
            # Update permissions
            for perm in cls.PERMISSION_FIELDS:
                if perm in data:
                    setattr(staff, perm, cls.parse_bool(data[perm]))
            
            staff.save()
            
            return ServiceResult(
                success=True,
                message='Staff updated successfully!',
                data={'staff': cls.serialize(staff, include_permissions=False)}
            )
            
        except Exception as e:
            return ServiceResult(success=False, message=str(e))
    
    @classmethod
    def delete(cls, staff_id: int) -> ServiceResult:
        """Delete a staff member and associated user"""
        try:
            staff = get_object_or_404(Staff, id=staff_id)
            user = staff.user
            staff_name = user.get_full_name()
            
            staff.delete()
            user.delete()
            
            return ServiceResult(
                success=True,
                message=f'Staff "{staff_name}" deleted successfully!'
            )
        except Exception as e:
            return ServiceResult(success=False, message=str(e))
    
    @classmethod
    def toggle_status(cls, staff_id: int) -> ServiceResult:
        """Toggle staff active/inactive status"""
        try:
            staff = get_object_or_404(Staff, id=staff_id)
            user = staff.user
            
            if user.is_active:
                user.is_active = False
                status = 'inactive'
                status_display = 'Inactive'
            else:
                user.is_active = True
                status = 'active'
                status_display = 'Active'
            
            user.save()
            
            return ServiceResult(
                success=True,
                message=f'Staff status changed to {status_display}!',
                data={
                    'status': status,
                    'status_display': status_display
                }
            )
        except Exception as e:
            return ServiceResult(success=False, message=str(e))
    
    @classmethod
    def list_admin_staff(cls) -> ServiceResult:
        """List all admin staff members"""
        try:
            queryset = Staff.objects.filter(staff_type='admin_staff').select_related('user')
            staff_list = [cls.serialize(s, include_permissions=False) for s in queryset]
            return ServiceResult(
                success=True,
                data={'staff': staff_list, 'total': len(staff_list)}
            )
        except Exception as e:
            return ServiceResult(success=False, message=str(e))
    
    @classmethod
    def list_client_staff(cls, client_id: int) -> ServiceResult:
        """List all staff members for a specific client"""
        try:
            queryset = Staff.objects.filter(
                staff_type='client_staff', 
                client_id=client_id
            ).select_related('user')
            
            staff_list = [cls.serialize(s, include_permissions=False) for s in queryset]
            return ServiceResult(
                success=True,
                data={'staff': staff_list, 'total': len(staff_list)}
            )
        except Exception as e:
            return ServiceResult(success=False, message=str(e))
