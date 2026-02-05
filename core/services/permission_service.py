"""
Permission Service Module
Contains: Role-based permission checking for all user types
"""
from typing import Optional, List, Dict, Any
from functools import wraps

from django.http import JsonResponse
from django.shortcuts import redirect

from .base import ServiceResult


class PermissionService:
    """
    Service for handling role-based permissions.
    
    User Roles:
    - super_admin: Full access to everything
    - admin_staff: Access based on Staff permissions
    - client: Access to their own data + based on Client permissions
    - client_staff: Access based on their client's Staff permissions
    
    Usage in views:
        # Check permission
        if not PermissionService.can_view_staff_list(request.user):
            return JsonResponse({'success': False, 'message': 'Permission denied'}, status=403)
        
        # Get context for templates
        context = PermissionService.get_permission_context(request.user)
    """
    
    # Permission categories
    STAFF_PERMISSIONS = [
        'perm_staff_list', 'perm_staff_add', 'perm_staff_edit', 
        'perm_staff_delete', 'perm_staff_status'
    ]
    
    IDCARD_SETTING_PERMISSIONS = [
        'perm_idcard_setting_list', 'perm_idcard_setting_add', 
        'perm_idcard_setting_edit', 'perm_idcard_setting_delete', 
        'perm_idcard_setting_status'
    ]
    
    IDCARD_LIST_PERMISSIONS = [
        'perm_idcard_pending_list', 'perm_idcard_verified_list', 
        'perm_idcard_pool_list', 'perm_idcard_approved_list', 
        'perm_idcard_download_list', 'perm_idcard_reprint_list'
    ]
    
    IDCARD_ACTION_PERMISSIONS = [
        'perm_idcard_add', 'perm_idcard_edit', 'perm_idcard_delete',
        'perm_idcard_info', 'perm_idcard_approve', 'perm_idcard_verify',
        'perm_idcard_bulk_upload', 'perm_idcard_bulk_download',
        'perm_idcard_created_at', 'perm_idcard_updated_at',
        'perm_idcard_delete_from_pool', 'perm_delete_all_idcard',
        'perm_reupload_idcard_image', 'perm_idcard_retrieve'
    ]
    
    @staticmethod
    def is_super_admin(user) -> bool:
        """
        Check if user is super admin.
        Accepts EITHER Django is_superuser=True OR business role='super_admin'
        for consistency with auth decorators.
        """
        return user.is_authenticated and (user.is_superuser or user.role == 'super_admin')
    
    @staticmethod
    def is_admin_staff(user) -> bool:
        """Check if user is admin staff"""
        return user.is_authenticated and user.role == 'admin_staff'
    
    @staticmethod
    def is_client(user) -> bool:
        """Check if user is a client"""
        return user.is_authenticated and user.role == 'client'
    
    @staticmethod
    def is_client_staff(user) -> bool:
        """Check if user is client staff"""
        return user.is_authenticated and user.role == 'client_staff'
    
    @classmethod
    def get_profile(cls, user):
        """
        Get the permission profile for a user.
        Returns Staff or Client object that has permission fields.
        """
        if cls.is_super_admin(user):
            return None  # Super admin has all permissions
        
        if cls.is_admin_staff(user):
            return getattr(user, 'staff_profile', None)
        
        if cls.is_client(user):
            return getattr(user, 'client_profile', None)
        
        if cls.is_client_staff(user):
            staff = getattr(user, 'staff_profile', None)
            if staff and staff.client:
                return staff.client  # Use client's permissions
            return staff
        
        return None
    
    @classmethod
    def has_permission(cls, user, permission_name: str) -> bool:
        """
        Check if user has a specific permission.
        
        Args:
            user: User instance
            permission_name: Name of permission (e.g., 'perm_staff_add')
        
        Returns:
            True if user has permission, False otherwise
        """
        # Super admin has all permissions
        if cls.is_super_admin(user):
            return True
        
        profile = cls.get_profile(user)
        if profile is None:
            return False
        
        return getattr(profile, permission_name, False)
    
    @classmethod
    def get_permission_context(cls, user) -> Dict[str, bool]:
        """
        Get all permissions as a dict for template context.
        
        Returns:
            Dict with all permission names as keys and bool values
        """
        all_permissions = (
            cls.STAFF_PERMISSIONS + 
            cls.IDCARD_SETTING_PERMISSIONS + 
            cls.IDCARD_LIST_PERMISSIONS + 
            cls.IDCARD_ACTION_PERMISSIONS
        )
        
        context = {
            'is_super_admin': cls.is_super_admin(user),
            'is_admin_staff': cls.is_admin_staff(user),
            'is_client': cls.is_client(user),
            'is_client_staff': cls.is_client_staff(user),
            'user_role': user.role if user.is_authenticated else None,
        }
        
        # Add all individual permissions
        for perm in all_permissions:
            context[perm] = cls.has_permission(user, perm)
        
        return context
    
    # ==================== Convenience Methods ====================
    
    @classmethod
    def can_view_staff_list(cls, user) -> bool:
        return cls.has_permission(user, 'perm_staff_list')
    
    @classmethod
    def can_add_staff(cls, user) -> bool:
        return cls.has_permission(user, 'perm_staff_add')
    
    @classmethod
    def can_edit_staff(cls, user) -> bool:
        return cls.has_permission(user, 'perm_staff_edit')
    
    @classmethod
    def can_delete_staff(cls, user) -> bool:
        return cls.has_permission(user, 'perm_staff_delete')
    
    @classmethod
    def can_view_idcard_settings(cls, user) -> bool:
        return cls.has_permission(user, 'perm_idcard_setting_list')
    
    @classmethod
    def can_add_idcard(cls, user) -> bool:
        return cls.has_permission(user, 'perm_idcard_add')
    
    @classmethod
    def can_edit_idcard(cls, user) -> bool:
        return cls.has_permission(user, 'perm_idcard_edit')
    
    @classmethod
    def can_delete_idcard(cls, user) -> bool:
        return cls.has_permission(user, 'perm_idcard_delete')
    
    @classmethod
    def can_bulk_upload(cls, user) -> bool:
        return cls.has_permission(user, 'perm_idcard_bulk_upload')
    
    @classmethod
    def can_bulk_download(cls, user) -> bool:
        return cls.has_permission(user, 'perm_idcard_bulk_download')
    
    @classmethod
    def can_approve_idcard(cls, user) -> bool:
        return cls.has_permission(user, 'perm_idcard_approve')
    
    @classmethod
    def can_verify_idcard(cls, user) -> bool:
        return cls.has_permission(user, 'perm_idcard_verify')
    
    @classmethod
    def can_view_status(cls, user, status: str) -> bool:
        """Check if user can view cards with specific status"""
        status_perm_map = {
            'pending': 'perm_idcard_pending_list',
            'verified': 'perm_idcard_verified_list',
            'pool': 'perm_idcard_pool_list',
            'approved': 'perm_idcard_approved_list',
            'download': 'perm_idcard_download_list',
            'reprint': 'perm_idcard_reprint_list',
        }
        perm = status_perm_map.get(status)
        if perm:
            return cls.has_permission(user, perm)
        return False


# ==================== Decorators ====================

def require_permission(permission_name: str, redirect_url: str = None):
    """
    Decorator to require a specific permission.
    
    Usage:
        @require_permission('perm_staff_add')
        def add_staff_view(request):
            ...
    """
    def decorator(view_func):
        @wraps(view_func)
        def wrapper(request, *args, **kwargs):
            if not PermissionService.has_permission(request.user, permission_name):
                if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
                    return JsonResponse({
                        'success': False, 
                        'message': 'Permission denied'
                    }, status=403)
                if redirect_url:
                    return redirect(redirect_url)
                return JsonResponse({
                    'success': False, 
                    'message': 'Permission denied'
                }, status=403)
            return view_func(request, *args, **kwargs)
        return wrapper
    return decorator


def require_super_admin(view_func):
    """Decorator to require super admin role"""
    @wraps(view_func)
    def wrapper(request, *args, **kwargs):
        if not PermissionService.is_super_admin(request.user):
            if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
                return JsonResponse({
                    'success': False, 
                    'message': 'Super admin access required'
                }, status=403)
            return redirect('login')
        return view_func(request, *args, **kwargs)
    return wrapper


def require_any_admin(view_func):
    """Decorator to require super admin or admin staff role"""
    @wraps(view_func)
    def wrapper(request, *args, **kwargs):
        user = request.user
        if not (PermissionService.is_super_admin(user) or PermissionService.is_admin_staff(user)):
            if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
                return JsonResponse({
                    'success': False, 
                    'message': 'Admin access required'
                }, status=403)
            return redirect('login')
        return view_func(request, *args, **kwargs)
    return wrapper
