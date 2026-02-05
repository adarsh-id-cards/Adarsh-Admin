"""
Example: Refactored ID Card API Views (Thin Views Pattern)

Shows how the large idcard_api.py (~2900 lines) can be reduced 
to thin views that delegate to services.
"""
from django.http import JsonResponse, HttpResponse
from django.views.decorators.http import require_http_methods
from django.views.decorators.csrf import csrf_exempt
import json

from ..services import IDCardService, ImportService, ExportService, PermissionService
from ..services.permission_service import require_super_admin, require_permission


# ==================== ID Card Table Endpoints ====================

@csrf_exempt
@require_http_methods(["POST"])
@require_super_admin
def api_idcard_table_create(request, group_id):
    """Create a new ID Card Table"""
    try:
        data = json.loads(request.body)
        result = IDCardService.create_table(group_id, data)
        return JsonResponse(result.to_response_dict(), status=200 if result.success else 400)
    except json.JSONDecodeError:
        return JsonResponse({'success': False, 'message': 'Invalid JSON!'}, status=400)


@csrf_exempt
@require_http_methods(["GET"])
@require_super_admin
def api_idcard_table_get(request, table_id):
    """Get ID Card Table details"""
    result = IDCardService.get_table(table_id)
    return JsonResponse(result.to_response_dict(), status=200 if result.success else 400)


@csrf_exempt
@require_http_methods(["POST", "PUT"])
@require_super_admin
def api_idcard_table_update(request, table_id):
    """Update ID Card Table"""
    try:
        data = json.loads(request.body)
        result = IDCardService.update_table(table_id, data)
        return JsonResponse(result.to_response_dict(), status=200 if result.success else 400)
    except json.JSONDecodeError:
        return JsonResponse({'success': False, 'message': 'Invalid JSON!'}, status=400)


@csrf_exempt
@require_http_methods(["DELETE", "POST"])
@require_super_admin
def api_idcard_table_delete(request, table_id):
    """Delete ID Card Table"""
    result = IDCardService.delete_table(table_id)
    return JsonResponse(result.to_response_dict(), status=200 if result.success else 400)


@csrf_exempt
@require_http_methods(["POST"])
@require_super_admin
def api_idcard_table_toggle_status(request, table_id):
    """Toggle ID Card Table status"""
    result = IDCardService.toggle_table_status(table_id)
    return JsonResponse(result.to_response_dict(), status=200 if result.success else 400)


@csrf_exempt
@require_http_methods(["GET"])
@require_super_admin
def api_idcard_table_list(request, group_id):
    """List all tables for a group"""
    result = IDCardService.list_tables(group_id)
    return JsonResponse(result.to_response_dict(), status=200 if result.success else 400)


# ==================== ID Card CRUD Endpoints ====================

@csrf_exempt
@require_http_methods(["GET"])
@require_super_admin
def api_idcard_list(request, table_id):
    """List ID Cards with pagination"""
    status_filter = request.GET.get('status')
    offset = int(request.GET.get('offset', 0))
    limit = int(request.GET.get('limit', 100))
    
    result = IDCardService.list_cards(table_id, status_filter, offset, limit)
    return JsonResponse(result.to_response_dict(), status=200 if result.success else 400)


@csrf_exempt
@require_http_methods(["GET"])
@require_super_admin
def api_idcard_all_ids(request, table_id):
    """Get all card IDs (for Select All)"""
    status_filter = request.GET.get('status')
    result = IDCardService.get_all_card_ids(table_id, status_filter)
    return JsonResponse(result.to_response_dict(), status=200 if result.success else 400)


@csrf_exempt
@require_http_methods(["POST"])
@require_super_admin
def api_idcard_create(request, table_id):
    """Create a new ID Card"""
    try:
        if request.content_type and 'multipart/form-data' in request.content_type:
            field_data = json.loads(request.POST.get('field_data', '{}'))
            image_files = {k: v for k, v in request.FILES.items() if k.startswith('image_')}
        else:
            data = json.loads(request.body)
            field_data = data.get('field_data', {})
            image_files = None
        
        result = IDCardService.create_card(table_id, field_data, image_files)
        return JsonResponse(result.to_response_dict(), status=200 if result.success else 400)
        
    except json.JSONDecodeError:
        return JsonResponse({'success': False, 'message': 'Invalid JSON!'}, status=400)


@csrf_exempt
@require_http_methods(["GET"])
@require_super_admin
def api_idcard_get(request, card_id):
    """Get ID Card details"""
    result = IDCardService.get_card(card_id)
    return JsonResponse(result.to_response_dict(), status=200 if result.success else 400)


@csrf_exempt
@require_http_methods(["POST", "PUT"])
@require_super_admin
def api_idcard_update(request, card_id):
    """Update ID Card"""
    try:
        if request.content_type and 'multipart/form-data' in request.content_type:
            field_data = json.loads(request.POST.get('field_data', '{}'))
            image_files = {k: v for k, v in request.FILES.items() if k.startswith('image_')}
        else:
            data = json.loads(request.body)
            field_data = data.get('field_data')
            image_files = None
        
        status = data.get('status') if 'data' in dir() else None
        result = IDCardService.update_card(card_id, field_data, status, image_files)
        return JsonResponse(result.to_response_dict(), status=200 if result.success else 400)
        
    except json.JSONDecodeError:
        return JsonResponse({'success': False, 'message': 'Invalid JSON!'}, status=400)


@csrf_exempt
@require_http_methods(["DELETE", "POST"])
@require_super_admin
def api_idcard_delete(request, card_id):
    """Delete ID Card"""
    result = IDCardService.delete_card(card_id)
    return JsonResponse(result.to_response_dict(), status=200 if result.success else 400)


@csrf_exempt
@require_http_methods(["POST"])
@require_super_admin
def api_idcard_update_field(request, card_id):
    """Update single field (inline editing)"""
    try:
        data = json.loads(request.body)
        result = IDCardService.update_single_field(
            card_id, 
            data.get('field'), 
            data.get('value', '')
        )
        return JsonResponse(result.to_response_dict(), status=200 if result.success else 400)
    except json.JSONDecodeError:
        return JsonResponse({'success': False, 'message': 'Invalid JSON!'}, status=400)


# ==================== Status Management ====================

@csrf_exempt
@require_http_methods(["POST"])
@require_super_admin
def api_idcard_change_status(request, card_id):
    """Change single card status"""
    try:
        data = json.loads(request.body)
        result = IDCardService.change_status(card_id, data.get('status'))
        return JsonResponse(result.to_response_dict(), status=200 if result.success else 400)
    except json.JSONDecodeError:
        return JsonResponse({'success': False, 'message': 'Invalid JSON!'}, status=400)


@csrf_exempt
@require_http_methods(["POST"])
@require_super_admin
def api_idcard_bulk_status(request, table_id):
    """Change status of multiple cards"""
    try:
        data = json.loads(request.body)
        result = IDCardService.bulk_change_status(
            table_id,
            data.get('card_ids', []),
            data.get('status')
        )
        return JsonResponse(result.to_response_dict(), status=200 if result.success else 400)
    except json.JSONDecodeError:
        return JsonResponse({'success': False, 'message': 'Invalid JSON!'}, status=400)


@csrf_exempt
@require_http_methods(["POST"])
@require_super_admin
def api_idcard_bulk_delete(request, table_id):
    """Delete multiple cards"""
    try:
        data = json.loads(request.body)
        result = IDCardService.bulk_delete(
            table_id,
            data.get('card_ids', []),
            data.get('delete_all', False)
        )
        return JsonResponse(result.to_response_dict(), status=200 if result.success else 400)
    except json.JSONDecodeError:
        return JsonResponse({'success': False, 'message': 'Invalid JSON!'}, status=400)


# ==================== Search ====================

@csrf_exempt
@require_http_methods(["GET"])
@require_super_admin
def api_idcard_search(request, table_id):
    """Search ID Cards"""
    query = request.GET.get('q', '')
    result = IDCardService.search_cards(table_id, query)
    return JsonResponse(result.to_response_dict(), status=200 if result.success else 400)


@csrf_exempt
@require_http_methods(["GET"])
@require_super_admin
def api_table_status_counts(request, table_id):
    """Get status counts for table"""
    from ..models import IDCardTable
    from django.shortcuts import get_object_or_404
    
    table = get_object_or_404(IDCardTable, id=table_id)
    counts = IDCardService.get_status_counts(table)
    return JsonResponse({'success': True, 'status_counts': counts})


# ==================== Import/Export ====================

@csrf_exempt
@require_http_methods(["POST"])
@require_super_admin
def api_idcard_bulk_upload(request, table_id):
    """Bulk upload ID Cards from Excel/CSV"""
    if 'file' not in request.FILES:
        return JsonResponse({'success': False, 'message': 'No file uploaded!'}, status=400)
    
    # Parse ZIP field names
    zip_field_names = []
    try:
        zip_field_names = json.loads(request.POST.get('zip_field_names', '[]'))
    except:
        pass
    
    # Collect ZIP files
    zip_files = {}
    for key in request.FILES:
        if key.startswith('photos_zip_'):
            zip_files[key] = request.FILES[key]
    
    result = ImportService.bulk_upload(
        table_id,
        request.FILES['file'],
        zip_files=zip_files,
        zip_field_names=zip_field_names
    )
    return JsonResponse(result.to_response_dict(), status=200 if result.success else 400)


@csrf_exempt
@require_http_methods(["POST"])
@require_super_admin
def api_idcard_download_xlsx(request, table_id):
    """Download cards as Excel"""
    try:
        data = json.loads(request.body)
        result = ExportService.export_xlsx(table_id, data.get('card_ids', []))
        
        if result.success:
            return result.data['response']
        return JsonResponse(result.to_response_dict(), status=400)
        
    except json.JSONDecodeError:
        return JsonResponse({'success': False, 'message': 'Invalid JSON!'}, status=400)


@csrf_exempt
@require_http_methods(["POST"])
@require_super_admin
def api_idcard_download_images(request, table_id):
    """Download images as ZIP files"""
    try:
        data = json.loads(request.body)
        result = ExportService.export_images_zip(table_id, data.get('card_ids', []))
        return JsonResponse(result.to_response_dict(), status=200 if result.success else 400)
    except json.JSONDecodeError:
        return JsonResponse({'success': False, 'message': 'Invalid JSON!'}, status=400)


@csrf_exempt
@require_http_methods(["POST"])
@require_super_admin
def api_idcard_reupload_images(request, table_id):
    """Reupload images from ZIP"""
    if 'zip_file' not in request.FILES:
        return JsonResponse({'success': False, 'message': 'No ZIP file!'}, status=400)
    
    card_ids = []
    try:
        card_ids = json.loads(request.POST.get('card_ids', '[]'))
    except:
        pass
    
    result = ImportService.reupload_images(
        table_id,
        request.FILES['zip_file'],
        card_ids
    )
    return JsonResponse(result.to_response_dict(), status=200 if result.success else 400)


# ==================== ROLE-BASED EXAMPLE ====================

@csrf_exempt
@require_http_methods(["GET"])
def api_idcard_list_v2(request, table_id):
    """
    List ID Cards - with role-based filtering.
    
    Different users see different data:
    - Super Admin: All cards, all statuses
    - Admin Staff: Based on permissions
    - Client: Only their own group's cards
    - Client Staff: Based on client's permissions
    """
    user = request.user
    
    if not user.is_authenticated:
        return JsonResponse({'success': False, 'message': 'Auth required'}, status=401)
    
    status_filter = request.GET.get('status')
    
    # Check if user can view this status
    if status_filter and not PermissionService.is_super_admin(user):
        if not PermissionService.can_view_status(user, status_filter):
            return JsonResponse({
                'success': False, 
                'message': f'No permission to view {status_filter} cards'
            }, status=403)
    
    # TODO: Add ownership check - ensure table belongs to user's client
    # if PermissionService.is_client(user):
    #     table = get_object_or_404(IDCardTable, id=table_id)
    #     if table.group.client != user.client_profile:
    #         return JsonResponse({'success': False, 'message': 'Access denied'}, status=403)
    
    offset = int(request.GET.get('offset', 0))
    limit = int(request.GET.get('limit', 100))
    
    result = IDCardService.list_cards(table_id, status_filter, offset, limit)
    return JsonResponse(result.to_response_dict(), status=200 if result.success else 400)
