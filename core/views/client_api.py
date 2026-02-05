"""
Client API Views
Contains: All client-related API endpoints (CRUD, toggle status, get staff)
"""
from django.http import JsonResponse
from django.views.decorators.http import require_http_methods
from django.views.decorators.csrf import csrf_exempt
import json
from .base import api_super_admin_required
from ..services import ClientService


@csrf_exempt
@require_http_methods(["POST"])
@api_super_admin_required
def api_client_create(request):
    """API endpoint to create a new client"""
    try:
        # Check if it's a multipart form (file upload) or JSON
        if request.content_type and 'multipart/form-data' in request.content_type:
            data = dict(request.POST)
            # Convert QueryDict lists to single values
            data = {k: v[0] if isinstance(v, list) and len(v) == 1 else v for k, v in data.items()}
            photo = request.FILES.get('photo')
        else:
            data = json.loads(request.body)
            photo = None
        
        result = ClientService.create(data, request=request, photo=photo)
        
        response_data = result.to_response_dict()
        # Add email_sent at top level for JS compatibility
        if result.success and 'email_sent' in result.data:
            response_data['email_sent'] = result.data['email_sent']
        
        return JsonResponse(response_data, status=200 if result.success else 400)
    except json.JSONDecodeError:
        return JsonResponse({'success': False, 'message': 'Invalid JSON data'}, status=400)
    except Exception as e:
        return JsonResponse({'success': False, 'message': str(e)}, status=400)


@csrf_exempt
@require_http_methods(["GET"])
@api_super_admin_required
def api_client_get(request, client_id):
    """API endpoint to get a client's details"""
    result = ClientService.get(client_id, include_permissions=True)
    return JsonResponse(result.to_response_dict(), status=200 if result.success else 400)


@csrf_exempt
@require_http_methods(["PUT", "POST"])
@api_super_admin_required
def api_client_update(request, client_id):
    """API endpoint to update a client"""
    try:
        # Check if it's a multipart form (file upload) or JSON
        if request.content_type and 'multipart/form-data' in request.content_type:
            data = dict(request.POST)
            # Convert QueryDict lists to single values
            data = {k: v[0] if isinstance(v, list) and len(v) == 1 else v for k, v in data.items()}
            photo = request.FILES.get('photo')
        else:
            data = json.loads(request.body)
            photo = None
        
        result = ClientService.update(client_id, data, photo=photo)
        return JsonResponse(result.to_response_dict(), status=200 if result.success else 400)
    except json.JSONDecodeError:
        return JsonResponse({'success': False, 'message': 'Invalid JSON data'}, status=400)
    except Exception as e:
        return JsonResponse({'success': False, 'message': str(e)}, status=400)


@csrf_exempt
@require_http_methods(["DELETE", "POST"])
@api_super_admin_required
def api_client_delete(request, client_id):
    """API endpoint to delete a client"""
    result = ClientService.delete(client_id)
    return JsonResponse(result.to_response_dict(), status=200 if result.success else 400)


@csrf_exempt
@require_http_methods(["POST"])
@api_super_admin_required
def api_client_toggle_status(request, client_id):
    """API endpoint to toggle client active/inactive status"""
    result = ClientService.toggle_status(client_id)
    return JsonResponse(result.to_response_dict(), status=200 if result.success else 400)


@csrf_exempt
@require_http_methods(["GET"])
@api_super_admin_required
def api_client_staff(request, client_id):
    """API endpoint to get all staff members for a specific client"""
    result = ClientService.get_staff(client_id)
    return JsonResponse(result.to_response_dict(), status=200 if result.success else 400)
