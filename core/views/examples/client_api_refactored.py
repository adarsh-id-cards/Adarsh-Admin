"""
Example: Refactored Client API Views (Thin Views Pattern)

This shows how views should look AFTER refactoring:
- Views only handle HTTP request/response
- Business logic is in services
- Views are ~20 lines instead of ~80 lines
- Easy to add permission checks
"""
from django.http import JsonResponse
from django.views.decorators.http import require_http_methods
from django.views.decorators.csrf import csrf_exempt
import json

from ..services import ClientService, PermissionService
from ..services.permission_service import require_super_admin, require_permission


# ==================== BEFORE (Current) ====================
# Views contain ALL logic: validation, user creation, client creation, 
# email sending, error handling, serialization - 80+ lines per endpoint


# ==================== AFTER (Refactored) ====================

@csrf_exempt
@require_http_methods(["POST"])
@require_super_admin
def api_client_create(request):
    """Create a new client - THIN VIEW"""
    try:
        # Parse request
        if request.content_type and 'multipart/form-data' in request.content_type:
            data = request.POST.dict()
            photo = request.FILES.get('photo')
        else:
            data = json.loads(request.body)
            photo = None
        
        # Call service
        result = ClientService.create(data, request=request, photo=photo)
        
        # Return response
        return JsonResponse(result.to_response_dict(), status=200 if result.success else 400)
        
    except json.JSONDecodeError:
        return JsonResponse({'success': False, 'message': 'Invalid JSON data!'}, status=400)


@csrf_exempt
@require_http_methods(["GET"])
@require_super_admin
def api_client_get(request, client_id):
    """Get client details - THIN VIEW"""
    result = ClientService.get(client_id)
    return JsonResponse(result.to_response_dict(), status=200 if result.success else 400)


@csrf_exempt
@require_http_methods(["PUT", "POST"])
@require_super_admin
def api_client_update(request, client_id):
    """Update a client - THIN VIEW"""
    try:
        if request.content_type and 'multipart/form-data' in request.content_type:
            data = request.POST.dict()
            photo = request.FILES.get('photo')
        else:
            data = json.loads(request.body)
            photo = None
        
        result = ClientService.update(client_id, data, photo=photo)
        return JsonResponse(result.to_response_dict(), status=200 if result.success else 400)
        
    except json.JSONDecodeError:
        return JsonResponse({'success': False, 'message': 'Invalid JSON data!'}, status=400)


@csrf_exempt
@require_http_methods(["DELETE", "POST"])
@require_super_admin
def api_client_delete(request, client_id):
    """Delete a client - THIN VIEW"""
    result = ClientService.delete(client_id)
    return JsonResponse(result.to_response_dict(), status=200 if result.success else 400)


@csrf_exempt
@require_http_methods(["POST"])
@require_super_admin
def api_client_toggle_status(request, client_id):
    """Toggle client status - THIN VIEW"""
    result = ClientService.toggle_status(client_id)
    return JsonResponse(result.to_response_dict(), status=200 if result.success else 400)


@csrf_exempt
@require_http_methods(["GET"])
@require_super_admin
def api_client_staff(request, client_id):
    """Get client's staff list - THIN VIEW"""
    result = ClientService.get_staff(client_id)
    return JsonResponse(result.to_response_dict(), status=200 if result.success else 400)


# ==================== ROLE-BASED VIEW EXAMPLE ====================

@csrf_exempt
@require_http_methods(["GET"])
def api_client_list(request):
    """
    List clients - with role-based filtering.
    
    - Super Admin: See all clients
    - Admin Staff: See clients based on permissions
    - Client: See only their own profile
    """
    user = request.user
    
    if not user.is_authenticated:
        return JsonResponse({'success': False, 'message': 'Authentication required'}, status=401)
    
    # Super admin sees all
    if PermissionService.is_super_admin(user):
        result = ClientService.list_all(include_inactive=True)
        return JsonResponse(result.to_response_dict())
    
    # Admin staff with permission
    if PermissionService.is_admin_staff(user):
        # You could filter based on assigned clients here
        result = ClientService.list_all(include_inactive=False)
        return JsonResponse(result.to_response_dict())
    
    # Client sees only themselves
    if PermissionService.is_client(user):
        client_profile = getattr(user, 'client_profile', None)
        if client_profile:
            result = ClientService.get(client_profile.id, include_permissions=False)
            # Wrap single result as list
            if result.success:
                result.data['clients'] = [result.data.pop('client')]
                result.data['total'] = 1
            return JsonResponse(result.to_response_dict())
    
    return JsonResponse({'success': False, 'message': 'Permission denied'}, status=403)


# ==================== PERMISSION-AWARE VIEW EXAMPLE ====================

@csrf_exempt
@require_http_methods(["POST"])
def api_client_create_v2(request):
    """
    Create client - permission-aware version.
    
    Can be used by:
    - Super Admin: Always allowed
    - Admin Staff: If has perm_staff_add (hypothetical)
    """
    user = request.user
    
    # Check permission using service
    if not PermissionService.is_super_admin(user):
        # For non-super-admins, could check specific permission
        # if not PermissionService.has_permission(user, 'perm_client_add'):
        return JsonResponse({'success': False, 'message': 'Permission denied'}, status=403)
    
    try:
        if request.content_type and 'multipart/form-data' in request.content_type:
            data = request.POST.dict()
            photo = request.FILES.get('photo')
        else:
            data = json.loads(request.body)
            photo = None
        
        result = ClientService.create(data, request=request, photo=photo)
        return JsonResponse(result.to_response_dict(), status=200 if result.success else 400)
        
    except json.JSONDecodeError:
        return JsonResponse({'success': False, 'message': 'Invalid JSON data!'}, status=400)
