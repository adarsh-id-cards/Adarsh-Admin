"""
ID Card API Views
Contains: All ID Card Table and ID Card related API endpoints
Including: CRUD, bulk operations, search, status changes, bulk upload
"""
from django.shortcuts import get_object_or_404
from django.http import JsonResponse
from django.views.decorators.http import require_http_methods
from django.views.decorators.csrf import csrf_exempt
import json
from ..models import IDCardGroup, IDCard, IDCardTable


# ==================== ID CARD TABLE API ENDPOINTS ====================

@csrf_exempt
@require_http_methods(["POST"])
def api_idcard_table_create(request, group_id):
    """API endpoint to create a new ID Card Table"""
    try:
        group = get_object_or_404(IDCardGroup, id=group_id)
        data = json.loads(request.body)
        
        name = data.get('name', '').strip()
        if not name:
            return JsonResponse({'success': False, 'message': 'Table name is required!'}, status=400)
        
        fields = data.get('fields', [])
        if len(fields) > 20:
            return JsonResponse({'success': False, 'message': 'Maximum 20 fields allowed!'}, status=400)
        
        # Validate fields structure
        validated_fields = []
        for idx, field in enumerate(fields):
            field_name = field.get('name', '').strip()
            field_type = field.get('type', 'text')
            if not field_name:
                return JsonResponse({'success': False, 'message': f'Field {idx+1} name is required!'}, status=400)
            
            if field_type not in ['text', 'number', 'date', 'email', 'image', 'textarea']:
                field_type = 'text'
            
            validated_fields.append({
                'name': field_name,
                'type': field_type,
                'order': idx
            })
        
        table = IDCardTable.objects.create(
            group=group,
            name=name,
            fields=validated_fields,
            is_active=True
        )
        
        return JsonResponse({
            'success': True,
            'message': 'Table created successfully!',
            'table': {
                'id': table.id,
                'name': table.name,
                'fields': table.fields,
                'is_active': table.is_active,
                'created_at': table.created_at.strftime('%d-%b-%Y %I:%M %p'),
                'updated_at': table.updated_at.strftime('%d-%b-%Y %I:%M %p'),
            }
        })
    except json.JSONDecodeError:
        return JsonResponse({'success': False, 'message': 'Invalid JSON data!'}, status=400)
    except Exception as e:
        return JsonResponse({'success': False, 'message': str(e)}, status=400)


@csrf_exempt
@require_http_methods(["GET"])
def api_idcard_table_get(request, table_id):
    """API endpoint to get a single ID Card Table"""
    try:
        table = get_object_or_404(IDCardTable, id=table_id)
        
        return JsonResponse({
            'success': True,
            'table': {
                'id': table.id,
                'name': table.name,
                'fields': table.fields,
                'is_active': table.is_active,
                'created_at': table.created_at.strftime('%d-%b-%Y %I:%M %p'),
                'updated_at': table.updated_at.strftime('%d-%b-%Y %I:%M %p'),
            }
        })
    except Exception as e:
        return JsonResponse({'success': False, 'message': str(e)}, status=400)


@csrf_exempt
@require_http_methods(["POST", "PUT"])
def api_idcard_table_update(request, table_id):
    """API endpoint to update an ID Card Table"""
    try:
        table = get_object_or_404(IDCardTable, id=table_id)
        data = json.loads(request.body)
        
        name = data.get('name', '').strip()
        if not name:
            return JsonResponse({'success': False, 'message': 'Table name is required!'}, status=400)
        
        fields = data.get('fields', [])
        if len(fields) > 20:
            return JsonResponse({'success': False, 'message': 'Maximum 20 fields allowed!'}, status=400)
        
        # Validate fields structure
        validated_fields = []
        for idx, field in enumerate(fields):
            field_name = field.get('name', '').strip()
            field_type = field.get('type', 'text')
            if not field_name:
                return JsonResponse({'success': False, 'message': f'Field {idx+1} name is required!'}, status=400)
            
            if field_type not in ['text', 'number', 'date', 'email', 'image', 'textarea']:
                field_type = 'text'
            
            validated_fields.append({
                'name': field_name,
                'type': field_type,
                'order': idx
            })
        
        table.name = name
        table.fields = validated_fields
        table.save()
        
        return JsonResponse({
            'success': True,
            'message': 'Table updated successfully!',
            'table': {
                'id': table.id,
                'name': table.name,
                'fields': table.fields,
                'is_active': table.is_active,
                'created_at': table.created_at.strftime('%d-%b-%Y %I:%M %p'),
                'updated_at': table.updated_at.strftime('%d-%b-%Y %I:%M %p'),
            }
        })
    except json.JSONDecodeError:
        return JsonResponse({'success': False, 'message': 'Invalid JSON data!'}, status=400)
    except Exception as e:
        return JsonResponse({'success': False, 'message': str(e)}, status=400)


@csrf_exempt
@require_http_methods(["DELETE", "POST"])
def api_idcard_table_delete(request, table_id):
    """API endpoint to delete an ID Card Table"""
    try:
        table = get_object_or_404(IDCardTable, id=table_id)
        table_name = table.name
        table.delete()
        
        return JsonResponse({
            'success': True,
            'message': f'Table "{table_name}" deleted successfully!'
        })
    except Exception as e:
        return JsonResponse({'success': False, 'message': str(e)}, status=400)


@csrf_exempt
@require_http_methods(["POST"])
def api_idcard_table_toggle_status(request, table_id):
    """API endpoint to toggle ID Card Table active/inactive status"""
    try:
        table = get_object_or_404(IDCardTable, id=table_id)
        
        if table.is_active:
            table.is_active = False
            status = 'inactive'
            status_display = 'Inactive'
        else:
            table.is_active = True
            status = 'active'
            status_display = 'Active'
        
        table.save()
        
        return JsonResponse({
            'success': True,
            'message': f'Table status changed to {status_display}!',
            'status': status,
            'status_display': status_display
        })
    except Exception as e:
        return JsonResponse({'success': False, 'message': str(e)}, status=400)


@csrf_exempt
@require_http_methods(["GET"])
def api_idcard_table_list(request, group_id):
    """API endpoint to list all ID Card Tables for a group"""
    try:
        group = get_object_or_404(IDCardGroup, id=group_id)
        tables = IDCardTable.objects.filter(group=group)
        
        table_list = []
        for table in tables:
            table_list.append({
                'id': table.id,
                'name': table.name,
                'fields': table.fields,
                'field_count': len(table.fields),
                'is_active': table.is_active,
                'created_at': table.created_at.strftime('%d-%b-%Y %I:%M %p'),
                'updated_at': table.updated_at.strftime('%d-%b-%Y %I:%M %p'),
            })
        
        return JsonResponse({
            'success': True,
            'tables': table_list
        })
    except Exception as e:
        return JsonResponse({'success': False, 'message': str(e)}, status=400)


# ==================== ID CARD API ENDPOINTS ====================

@csrf_exempt
@require_http_methods(["GET"])
def api_idcard_list(request, table_id):
    """API endpoint to list all ID Cards for a table, optionally filtered by status"""
    try:
        table = get_object_or_404(IDCardTable, id=table_id)
        status_filter = request.GET.get('status', None)
        
        cards = IDCard.objects.filter(table=table)
        if status_filter and status_filter in ['pending', 'verified', 'pool', 'approved', 'download', 'reprint']:
            cards = cards.filter(status=status_filter)
        
        card_list = []
        for card in cards:
            card_list.append({
                'id': card.id,
                'field_data': card.field_data,
                'photo': card.photo.url if card.photo else None,
                'status': card.status,
                'status_display': card.get_status_display(),
                'created_at': card.created_at.strftime('%d-%b-%Y %I:%M %p'),
                'updated_at': card.updated_at.strftime('%d-%b-%Y %I:%M %p'),
            })
        
        # Get status counts
        status_counts = {
            'pending': IDCard.objects.filter(table=table, status='pending').count(),
            'verified': IDCard.objects.filter(table=table, status='verified').count(),
            'pool': IDCard.objects.filter(table=table, status='pool').count(),
            'approved': IDCard.objects.filter(table=table, status='approved').count(),
            'download': IDCard.objects.filter(table=table, status='download').count(),
            'reprint': IDCard.objects.filter(table=table, status='reprint').count(),
            'total': IDCard.objects.filter(table=table).count(),
        }
        
        return JsonResponse({
            'success': True,
            'cards': card_list,
            'status_counts': status_counts,
            'table': {
                'id': table.id,
                'name': table.name,
                'fields': table.fields,
            }
        })
    except Exception as e:
        return JsonResponse({'success': False, 'message': str(e)}, status=400)


@csrf_exempt
@require_http_methods(["POST"])
def api_idcard_create(request, table_id):
    """API endpoint to create a new ID Card with file upload support"""
    try:
        table = get_object_or_404(IDCardTable, id=table_id)
        
        # Helper function to convert string values to uppercase
        def uppercase_field_data(data):
            result = {}
            for key, value in data.items():
                if isinstance(value, str):
                    result[key] = value.upper()
                else:
                    result[key] = value
            return result
        
        # Handle both JSON and FormData
        if request.content_type and 'multipart/form-data' in request.content_type:
            # FormData submission (with files)
            field_data_str = request.POST.get('field_data', '{}')
            field_data = json.loads(field_data_str)
            field_data = uppercase_field_data(field_data)
            
            # Handle image fields from table configuration
            for field in table.fields:
                if field['type'] == 'image':
                    field_name = field['name']
                    file_key = f"image_{field_name}"
                    if file_key in request.FILES:
                        # Save the image and store path in field_data
                        uploaded_file = request.FILES[file_key]
                        from django.core.files.storage import default_storage
                        file_path = f"id_card_images/{table_id}/{uploaded_file.name}"
                        saved_path = default_storage.save(file_path, uploaded_file)
                        field_data[field_name] = saved_path
            
            # Create the card
            card = IDCard.objects.create(
                table=table,
                field_data=field_data,
                status='pending'
            )
            
            # Handle main photo
            if 'photo' in request.FILES:
                card.photo = request.FILES['photo']
                card.save()
        else:
            # JSON submission (no files)
            data = json.loads(request.body)
            field_data = data.get('field_data', {})
            field_data = uppercase_field_data(field_data)
            
            card = IDCard.objects.create(
                table=table,
                field_data=field_data,
                status='pending'
            )
        
        return JsonResponse({
            'success': True,
            'message': 'ID Card created successfully!',
            'card': {
                'id': card.id,
                'field_data': card.field_data,
                'photo': card.photo.url if card.photo else None,
                'status': card.status,
                'created_at': card.created_at.strftime('%d-%b-%Y %I:%M %p'),
            }
        })
    except json.JSONDecodeError:
        return JsonResponse({'success': False, 'message': 'Invalid JSON data!'}, status=400)
    except Exception as e:
        return JsonResponse({'success': False, 'message': str(e)}, status=400)


@csrf_exempt
@require_http_methods(["GET"])
def api_idcard_get(request, card_id):
    """API endpoint to get a single ID Card"""
    try:
        card = get_object_or_404(IDCard, id=card_id)
        
        return JsonResponse({
            'success': True,
            'card': {
                'id': card.id,
                'table_id': card.table.id,
                'table_name': card.table.name,
                'field_data': card.field_data,
                'photo': card.photo.url if card.photo else None,
                'status': card.status,
                'status_display': card.get_status_display(),
                'created_at': card.created_at.strftime('%d-%b-%Y %I:%M %p'),
                'updated_at': card.updated_at.strftime('%d-%b-%Y %I:%M %p'),
            }
        })
    except Exception as e:
        return JsonResponse({'success': False, 'message': str(e)}, status=400)


@csrf_exempt
@require_http_methods(["POST", "PUT"])
def api_idcard_update(request, card_id):
    """API endpoint to update an ID Card with file upload support"""
    try:
        card = get_object_or_404(IDCard, id=card_id)
        table = card.table
        
        # Helper function to convert string values to uppercase
        def uppercase_field_data(data):
            result = {}
            for key, value in data.items():
                if isinstance(value, str):
                    result[key] = value.upper()
                else:
                    result[key] = value
            return result
        
        # Handle both JSON and FormData
        if request.content_type and 'multipart/form-data' in request.content_type:
            # FormData submission (with files)
            field_data_str = request.POST.get('field_data', '{}')
            new_field_data = json.loads(field_data_str)
            new_field_data = uppercase_field_data(new_field_data)
            
            # Merge with existing field_data to preserve existing image paths
            existing_field_data = card.field_data or {}
            existing_field_data.update(new_field_data)
            
            # Handle image fields from table configuration
            for field in table.fields:
                if field['type'] == 'image':
                    field_name = field['name']
                    file_key = f"image_{field_name}"
                    if file_key in request.FILES:
                        # Save the image and store path in field_data
                        uploaded_file = request.FILES[file_key]
                        from django.core.files.storage import default_storage
                        file_path = f"id_card_images/{table.id}/{uploaded_file.name}"
                        saved_path = default_storage.save(file_path, uploaded_file)
                        existing_field_data[field_name] = saved_path
            
            card.field_data = existing_field_data
            
            # Handle main photo
            if 'photo' in request.FILES:
                card.photo = request.FILES['photo']
            
            card.save()
        else:
            # JSON submission (no files)
            data = json.loads(request.body)
            
            if 'field_data' in data:
                # Merge with existing field_data to preserve image paths and other fields
                existing_field_data = card.field_data or {}
                new_field_data = uppercase_field_data(data['field_data'])
                existing_field_data.update(new_field_data)
                card.field_data = existing_field_data
            if 'status' in data and data['status'] in ['pending', 'verified', 'pool', 'approved', 'download', 'reprint']:
                card.status = data['status']
            
            card.save()
        
        return JsonResponse({
            'success': True,
            'message': 'ID Card updated successfully!',
            'card': {
                'id': card.id,
                'field_data': card.field_data,
                'photo': card.photo.url if card.photo else None,
                'status': card.status,
                'status_display': card.get_status_display(),
            }
        })
    except json.JSONDecodeError:
        return JsonResponse({'success': False, 'message': 'Invalid JSON data!'}, status=400)
    except Exception as e:
        return JsonResponse({'success': False, 'message': str(e)}, status=400)


@csrf_exempt
@require_http_methods(["DELETE", "POST"])
def api_idcard_delete(request, card_id):
    """API endpoint to delete an ID Card"""
    try:
        card = get_object_or_404(IDCard, id=card_id)
        card.delete()
        
        return JsonResponse({
            'success': True,
            'message': 'ID Card deleted successfully!'
        })
    except Exception as e:
        return JsonResponse({'success': False, 'message': str(e)}, status=400)


@csrf_exempt
@require_http_methods(["POST"])
def api_idcard_change_status(request, card_id):
    """API endpoint to change an ID Card's status"""
    try:
        card = get_object_or_404(IDCard, id=card_id)
        data = json.loads(request.body)
        
        new_status = data.get('status')
        if new_status not in ['pending', 'verified', 'pool', 'approved', 'download', 'reprint']:
            return JsonResponse({'success': False, 'message': 'Invalid status!'}, status=400)
        
        card.status = new_status
        card.save()
        
        return JsonResponse({
            'success': True,
            'message': f'Card status changed to {card.get_status_display()}!',
            'status': card.status,
            'status_display': card.get_status_display()
        })
    except json.JSONDecodeError:
        return JsonResponse({'success': False, 'message': 'Invalid JSON data!'}, status=400)
    except Exception as e:
        return JsonResponse({'success': False, 'message': str(e)}, status=400)


@csrf_exempt
@require_http_methods(["POST"])
def api_idcard_bulk_status(request, table_id):
    """API endpoint to change status of multiple ID Cards"""
    try:
        table = get_object_or_404(IDCardTable, id=table_id)
        data = json.loads(request.body)
        
        card_ids = data.get('card_ids', [])
        new_status = data.get('status')
        
        if new_status not in ['pending', 'verified', 'pool', 'approved', 'download', 'reprint']:
            return JsonResponse({'success': False, 'message': 'Invalid status!'}, status=400)
        
        updated_count = IDCard.objects.filter(table=table, id__in=card_ids).update(status=new_status)
        
        return JsonResponse({
            'success': True,
            'message': f'{updated_count} cards updated to {new_status}!',
            'updated_count': updated_count
        })
    except json.JSONDecodeError:
        return JsonResponse({'success': False, 'message': 'Invalid JSON data!'}, status=400)
    except Exception as e:
        return JsonResponse({'success': False, 'message': str(e)}, status=400)


@csrf_exempt
@require_http_methods(["POST"])
def api_idcard_bulk_delete(request, table_id):
    """API endpoint to delete multiple ID Cards"""
    try:
        table = get_object_or_404(IDCardTable, id=table_id)
        data = json.loads(request.body)
        
        card_ids = data.get('card_ids', [])
        delete_all = data.get('delete_all', False)
        
        if delete_all:
            deleted_count, _ = IDCard.objects.filter(table=table).delete()
        else:
            deleted_count, _ = IDCard.objects.filter(table=table, id__in=card_ids).delete()
        
        return JsonResponse({
            'success': True,
            'message': f'{deleted_count} cards deleted successfully!',
            'deleted_count': deleted_count
        })
    except json.JSONDecodeError:
        return JsonResponse({'success': False, 'message': 'Invalid JSON data!'}, status=400)
    except Exception as e:
        return JsonResponse({'success': False, 'message': str(e)}, status=400)


@csrf_exempt
@require_http_methods(["GET"])
def api_idcard_search(request, table_id):
    """API endpoint to search ID Cards across all statuses"""
    try:
        table = get_object_or_404(IDCardTable, id=table_id)
        query = request.GET.get('q', '').strip().upper()
        
        if not query or len(query) < 2:
            return JsonResponse({
                'success': True,
                'results': [],
                'message': 'Please enter at least 2 characters to search'
            })
        
        # Get all cards for this table
        cards = IDCard.objects.filter(table=table)
        
        results = []
        for card in cards:
            # Search in field_data
            field_data = card.field_data or {}
            match_found = False
            matched_field = ''
            matched_value = ''
            
            for field_name, field_value in field_data.items():
                if field_value and query in str(field_value).upper():
                    match_found = True
                    matched_field = field_name
                    matched_value = str(field_value)
                    break
            
            if match_found:
                # Get the first text field as display name
                display_name = ''
                for field in table.fields:
                    if field.get('type') in ['text', 'textarea'] and field.get('name') in field_data:
                        display_name = field_data.get(field.get('name'), '')
                        break
                
                results.append({
                    'id': card.id,
                    'display_name': display_name or f'Card #{card.id}',
                    'status': card.status,
                    'status_display': card.get_status_display(),
                    'matched_field': matched_field,
                    'matched_value': matched_value,
                    'photo': card.photo.url if card.photo else None,
                    'field_data': card.field_data,
                })
        
        return JsonResponse({
            'success': True,
            'results': results,
            'count': len(results),
            'query': query
        })
    except Exception as e:
        return JsonResponse({'success': False, 'message': str(e)}, status=400)


@csrf_exempt
@require_http_methods(["GET"])
def api_table_status_counts(request, table_id):
    """API endpoint to get status counts for a table"""
    try:
        table = get_object_or_404(IDCardTable, id=table_id)
        
        status_counts = {
            'pending': IDCard.objects.filter(table=table, status='pending').count(),
            'verified': IDCard.objects.filter(table=table, status='verified').count(),
            'pool': IDCard.objects.filter(table=table, status='pool').count(),
            'approved': IDCard.objects.filter(table=table, status='approved').count(),
            'download': IDCard.objects.filter(table=table, status='download').count(),
            'reprint': IDCard.objects.filter(table=table, status='reprint').count(),
            'total': IDCard.objects.filter(table=table).count(),
        }
        
        return JsonResponse({
            'success': True,
            'status_counts': status_counts
        })
    except Exception as e:
        return JsonResponse({'success': False, 'message': str(e)}, status=400)


@csrf_exempt
@require_http_methods(["POST"])
def api_idcard_bulk_upload(request, table_id):
    """API endpoint to bulk upload ID Cards from XLSX/CSV file with fuzzy matching and optional ZIP photo upload"""
    try:
        import openpyxl
        from io import BytesIO
        import re
        import zipfile
        import os
        from django.core.files.storage import default_storage
        from django.core.files.base import ContentFile
        
        table = get_object_or_404(IDCardTable, id=table_id)
        
        if 'file' not in request.FILES:
            return JsonResponse({'success': False, 'message': 'No file uploaded!'}, status=400)
        
        uploaded_file = request.FILES['file']
        file_name = uploaded_file.name.lower()
        file_size = uploaded_file.size
        
        # Check if ZIP file with photos is also uploaded
        photos_zip_file = request.FILES.get('photos_zip', None)
        zip_photos = {}  # Dictionary to map filename (without extension) to image bytes
        
        if photos_zip_file:
            try:
                zip_content = photos_zip_file.read()
                with zipfile.ZipFile(BytesIO(zip_content), 'r') as zf:
                    for zip_info in zf.infolist():
                        # Skip directories
                        if zip_info.is_dir():
                            continue
                        
                        file_in_zip = zip_info.filename
                        # Get filename without path and extension
                        base_name = os.path.basename(file_in_zip)
                        name_without_ext = os.path.splitext(base_name)[0].upper()  # Uppercase for case-insensitive matching
                        ext = os.path.splitext(base_name)[1].lower()
                        
                        # Only process image files
                        if ext in ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp']:
                            image_bytes = zf.read(zip_info.filename)
                            zip_photos[name_without_ext] = {
                                'bytes': image_bytes,
                                'ext': ext
                            }
            except Exception as zip_error:
                # Continue without photos - don't fail the entire upload
                pass
        
        # Get all table fields (text fields for matching, image fields to include with empty values)
        all_table_fields = table.fields
        table_fields = [f['name'] for f in all_table_fields if f.get('type') != 'image']
        image_fields = [f['name'] for f in all_table_fields if f.get('type') == 'image']
        
        # Also check if there's a PHOTO field (even if not marked as image type)
        # This allows matching ZIP photos to a PHOTO column
        photo_field_name = None
        for f in all_table_fields:
            if f['name'].upper() == 'PHOTO':
                photo_field_name = f['name']
                if photo_field_name not in image_fields:
                    image_fields.append(photo_field_name)
                # Remove from table_fields if present (we'll handle it as image)
                if photo_field_name in table_fields:
                    table_fields.remove(photo_field_name)
                break
        
        # Helper function to normalize field names for comparison
        def normalize_name(name):
            # Remove spaces, underscores, hyphens, dots and lowercase
            return re.sub(r'[^a-z0-9]', '', name.lower())
        
        # Levenshtein distance for fuzzy matching
        def levenshtein_distance(s1, s2):
            if len(s1) < len(s2):
                return levenshtein_distance(s2, s1)
            if len(s2) == 0:
                return len(s1)
            
            previous_row = range(len(s2) + 1)
            for i, c1 in enumerate(s1):
                current_row = [i + 1]
                for j, c2 in enumerate(s2):
                    insertions = previous_row[j + 1] + 1
                    deletions = current_row[j] + 1
                    substitutions = previous_row[j] + (c1 != c2)
                    current_row.append(min(insertions, deletions, substitutions))
                previous_row = current_row
            return previous_row[-1]
        
        # Find best match for a header using fuzzy matching
        def find_best_match(header, available_fields):
            normalized_header = normalize_name(header)
            
            # First try exact match
            for field in available_fields:
                if normalize_name(field) == normalized_header:
                    return field
            
            # Then try fuzzy match
            best_match = None
            best_distance = float('inf')
            
            for field in available_fields:
                normalized_field = normalize_name(field)
                distance = levenshtein_distance(normalized_header, normalized_field)
                
                # Allow up to 2 char differences, but for short strings allow only 1
                max_distance = 1 if len(normalized_field) < 5 else 2
                
                if distance <= max_distance and distance < best_distance:
                    best_distance = distance
                    best_match = field
            
            return best_match
        
        cards_created = 0
        total_photos_matched = 0
        errors = []
        matched_field_names = []
        
        if file_name.endswith('.xlsx') or file_name.endswith('.xls'):
            # Process Excel file
            try:
                file_content = uploaded_file.read()
                
                # Check file magic bytes to detect actual format
                if len(file_content) < 4:
                    return JsonResponse({
                        'success': False, 
                        'message': 'File is too small or empty.'
                    }, status=400)
                
                magic_bytes = file_content[:4]
                is_zip = magic_bytes[:2] == b'PK'
                is_old_xls = (magic_bytes[0] == 0xD0 and magic_bytes[1] == 0xCF)
                
                headers = []
                rows_data = []
                
                if is_zip or file_name.endswith('.xlsx'):
                    # New .xlsx format - use openpyxl
                    try:
                        wb = openpyxl.load_workbook(BytesIO(file_content))
                        ws = wb.active
                        
                        # Get header row (first row)
                        for cell in ws[1]:
                            if cell.value:
                                headers.append(str(cell.value).strip())
                        
                        # Get data rows
                        for row in ws.iter_rows(min_row=2, values_only=True):
                            rows_data.append(row)
                    except Exception as xlsx_error:
                        # Maybe it's actually an old xls file with wrong extension
                        if not is_zip:
                            is_old_xls = True
                        else:
                            raise xlsx_error
                
                if is_old_xls or (file_name.endswith('.xls') and not file_name.endswith('.xlsx') and not headers):
                    # Old .xls format - use xlrd
                    try:
                        import xlrd
                        wb = xlrd.open_workbook(file_contents=file_content)
                        ws = wb.sheet_by_index(0)
                        
                        # Get header row (first row)
                        headers = []
                        for col_idx in range(ws.ncols):
                            cell_value = ws.cell_value(0, col_idx)
                            if cell_value:
                                headers.append(str(cell_value).strip())
                        
                        # Get data rows
                        rows_data = []
                        for row_idx in range(1, ws.nrows):
                            row = []
                            for col_idx in range(ws.ncols):
                                row.append(ws.cell_value(row_idx, col_idx))
                            rows_data.append(tuple(row))
                    except ImportError:
                        return JsonResponse({
                            'success': False, 
                            'message': 'xlrd library not installed. Please install it to support .xls files.'
                        }, status=400)
                    except Exception as xls_error:
                        return JsonResponse({
                            'success': False, 
                            'message': f'Error reading .xls file: {str(xls_error)}'
                        }, status=400)
                
                if not headers:
                    return JsonResponse({
                        'success': False, 
                        'message': 'Could not read headers from Excel file. Please check the file format.'
                    }, status=400)
                    
            except Exception as excel_error:
                return JsonResponse({
                    'success': False, 
                    'message': f'Error reading Excel file: {str(excel_error)}'
                }, status=400)
            
            # Map headers to table fields using fuzzy matching
            # Skip any headers that match image field names (those are for ZIP matching only)
            header_to_field = {}
            available_fields = table_fields.copy()
            image_field_names_upper = [f.upper() for f in image_fields]
            
            # Track which column indices contain image reference values (like PHOTO column)
            image_ref_columns = {}
            photo_column_idx = None  # Track the generic PHOTO column for any image field
            
            for idx, header in enumerate(headers):
                header_upper = header.upper() if header else ''
                
                # Check if this is a PHOTO column (generic image reference)
                if header_upper == 'PHOTO':
                    photo_column_idx = idx
                    # Assign PHOTO column to first image field if not already assigned
                    if image_fields and image_fields[0] not in image_ref_columns:
                        image_ref_columns[image_fields[0]] = idx
                    continue  # Skip text field matching for PHOTO column
                
                # Check if this column matches any image field name exactly
                is_image_ref = False
                for img_field in image_fields:
                    if header_upper == img_field.upper():
                        image_ref_columns[img_field] = idx
                        is_image_ref = True
                        break
                
                # Skip this column for text field matching if it's an image reference column
                if is_image_ref:
                    continue
                    
                match = find_best_match(header, available_fields)
                if match:
                    header_to_field[idx] = match
                    available_fields.remove(match)  # Don't match same field twice
                    matched_field_names.append(match)
            
            if not header_to_field:
                return JsonResponse({
                    'success': False, 
                    'message': f'No matching columns found! Expected columns: {", ".join(table_fields)}'
                }, status=400)
            
            # Process data rows using rows_data collected earlier
            for row_num, row in enumerate(rows_data, start=2):
                try:
                    # Skip empty rows
                    if all(cell is None or str(cell).strip() == '' for cell in row):
                        continue
                    
                    field_data = {}
                    for col_idx, field_name in header_to_field.items():
                        if col_idx < len(row):
                            value = row[col_idx]
                            if value is not None:
                                # Convert to string, handle dates and numbers
                                if hasattr(value, 'strftime'):
                                    # Already a datetime object
                                    value = value.strftime('%d-%m-%Y')
                                elif isinstance(value, float):
                                    # Check if it's an Excel date serial number (typically between 1 and 60000)
                                    # Excel dates start from 1900-01-01 (serial 1)
                                    if 1 < value < 60000 and ('date' in field_name.lower() or 'dob' in field_name.lower() or 'birth' in field_name.lower()):
                                        # Convert Excel serial date to actual date
                                        from datetime import datetime, timedelta
                                        # Excel's epoch is December 30, 1899
                                        excel_epoch = datetime(1899, 12, 30)
                                        actual_date = excel_epoch + timedelta(days=int(value))
                                        value = actual_date.strftime('%d-%m-%Y')
                                    elif value == int(value):
                                        # It's actually an integer (no decimal part)
                                        value = str(int(value)).upper()
                                    else:
                                        value = str(value).upper()
                                elif isinstance(value, int):
                                    # Check if it might be an Excel date serial for integer values
                                    if 1 < value < 60000 and ('date' in field_name.lower() or 'dob' in field_name.lower() or 'birth' in field_name.lower()):
                                        from datetime import datetime, timedelta
                                        excel_epoch = datetime(1899, 12, 30)
                                        actual_date = excel_epoch + timedelta(days=value)
                                        value = actual_date.strftime('%d-%m-%Y')
                                    else:
                                        value = str(value).upper()
                                else:
                                    value = str(value).strip().upper()  # Convert to uppercase
                                field_data[field_name] = value
                            else:
                                field_data[field_name] = ''
                        else:
                            field_data[field_name] = ''
                    
                    # Process image fields - try to match with ZIP photos
                    photos_matched = 0
                    for img_field in image_fields:
                        # Get the photo reference value from the tracked column
                        photo_column_value = None
                        
                        # Use the tracked image reference column if available
                        if img_field in image_ref_columns:
                            col_idx = image_ref_columns[img_field]
                            if col_idx < len(row):
                                cell_value = row[col_idx]
                                if cell_value is not None:
                                    # Handle numeric values - convert float 1.0 to "1"
                                    if isinstance(cell_value, float) and cell_value == int(cell_value):
                                        photo_column_value = str(int(cell_value)).upper()
                                    elif isinstance(cell_value, int):
                                        photo_column_value = str(cell_value).upper()
                                    else:
                                        photo_column_value = str(cell_value).strip().upper()
                        else:
                            # Fallback: look for column named PHOTO or use photo_column_idx
                            ref_col_idx = photo_column_idx if photo_column_idx is not None else None
                            if ref_col_idx is None:
                                # Search for PHOTO column
                                for col_idx in range(len(headers)):
                                    if headers[col_idx] and headers[col_idx].upper() == 'PHOTO':
                                        ref_col_idx = col_idx
                                        break
                            
                            if ref_col_idx is not None and ref_col_idx < len(row):
                                cell_value = row[ref_col_idx]
                                if cell_value is not None:
                                    # Handle numeric values
                                    if isinstance(cell_value, float) and cell_value == int(cell_value):
                                        photo_column_value = str(int(cell_value)).upper()
                                    elif isinstance(cell_value, int):
                                        photo_column_value = str(cell_value).upper()
                                    else:
                                        photo_column_value = str(cell_value).strip().upper()
                        
                        # Try to match photo from ZIP - ONLY set if matched, otherwise empty for placeholder
                        if photo_column_value and zip_photos and photo_column_value in zip_photos:
                            try:
                                photo_info = zip_photos[photo_column_value]
                                # Keep original filename from ZIP (the matched name + extension)
                                original_filename = f"{photo_column_value}{photo_info['ext']}"
                                
                                # Simple path: id_card_images/{table_id}/
                                folder_path = f"id_card_images/{table_id}"
                                file_path = f"{folder_path}/{original_filename}"
                                
                                # Save the image
                                saved_path = default_storage.save(file_path, ContentFile(photo_info['bytes']))
                                field_data[img_field] = saved_path
                                photos_matched += 1
                                total_photos_matched += 1
                            except Exception as photo_error:
                                field_data[img_field] = 'NOT_FOUND'  # Value given but save failed
                        elif photo_column_value:
                            # Value given but image not found in ZIP
                            field_data[img_field] = 'NOT_FOUND'
                        else:
                            # No value given at all - show colorful placeholder
                            field_data[img_field] = ''
                    
                    # Create the card
                    IDCard.objects.create(
                        table=table,
                        field_data=field_data,
                        status='pending'
                    )
                    cards_created += 1
                    
                except Exception as e:
                    errors.append(f'Row {row_num}: {str(e)}')
        
        elif file_name.endswith('.csv'):
            import csv
            from io import StringIO
            
            # Read CSV
            content = uploaded_file.read().decode('utf-8-sig')
            reader = csv.DictReader(StringIO(content))
            
            # Map CSV headers to table fields using fuzzy matching
            csv_headers = reader.fieldnames or []
            header_to_field = {}
            available_fields = table_fields.copy()
            
            # Track image reference columns for CSV
            csv_image_ref_columns = {}
            csv_photo_column = None  # Track the generic PHOTO column
            
            for header in csv_headers:
                header_upper = header.upper() if header else ''
                
                # Check if this is a PHOTO column
                if header_upper == 'PHOTO':
                    csv_photo_column = header
                    # Assign to first image field if not already assigned
                    if image_fields and image_fields[0] not in csv_image_ref_columns:
                        csv_image_ref_columns[image_fields[0]] = header
                    continue
                
                # Check if this column matches any image field name exactly
                is_image_ref = False
                for img_field in image_fields:
                    if header_upper == img_field.upper():
                        csv_image_ref_columns[img_field] = header
                        is_image_ref = True
                        break
                
                # Skip this column for text field matching if it's an image reference column
                if is_image_ref:
                    continue
                    
                match = find_best_match(header.strip(), available_fields)
                if match:
                    header_to_field[header] = match
                    available_fields.remove(match)
                    matched_field_names.append(match)
            
            if not header_to_field:
                return JsonResponse({
                    'success': False, 
                    'message': f'No matching columns found! Expected columns: {", ".join(table_fields)}'
                }, status=400)
            
            for row_num, row in enumerate(reader, start=2):
                try:
                    # Skip empty rows
                    if all(not v or str(v).strip() == '' for v in row.values()):
                        continue
                    
                    field_data = {}
                    for csv_header, field_name in header_to_field.items():
                        value = row.get(csv_header, '')
                        field_data[field_name] = str(value).strip().upper() if value else ''  # Convert to uppercase
                    
                    # Process image fields - try to match with ZIP photos
                    photos_matched = 0
                    for img_field in image_fields:
                        # Get the photo reference value from the tracked column
                        photo_column_value = None
                        
                        # Use tracked image reference column if available
                        if img_field in csv_image_ref_columns:
                            csv_header = csv_image_ref_columns[img_field]
                            cell_value = row.get(csv_header, '')
                            if cell_value and str(cell_value).strip():
                                photo_column_value = str(cell_value).strip().upper()
                        else:
                            # Fallback: look for column named PHOTO or matching image field name
                            for csv_header, cell_value in row.items():
                                header_upper = csv_header.upper() if csv_header else ''
                                if header_upper == 'PHOTO' or header_upper == img_field.upper():
                                    if cell_value and str(cell_value).strip():
                                        photo_column_value = str(cell_value).strip().upper()
                                    break
                        
                        # Try to match photo from ZIP - ONLY set if matched, otherwise empty for placeholder
                        if photo_column_value and zip_photos and photo_column_value in zip_photos:
                            try:
                                photo_info = zip_photos[photo_column_value]
                                # Keep original filename from ZIP
                                original_filename = f"{photo_column_value}{photo_info['ext']}"
                                
                                # Simple path: id_card_images/{table_id}/
                                folder_path = f"id_card_images/{table_id}"
                                file_path = f"{folder_path}/{original_filename}"
                                
                                # Save the image
                                saved_path = default_storage.save(file_path, ContentFile(photo_info['bytes']))
                                field_data[img_field] = saved_path
                                photos_matched += 1
                                total_photos_matched += 1
                            except Exception as photo_error:
                                field_data[img_field] = 'NOT_FOUND'  # Value given but save failed
                        elif photo_column_value:
                            # Value given but image not found in ZIP
                            field_data[img_field] = 'NOT_FOUND'
                        else:
                            # No value given at all - show colorful placeholder
                            field_data[img_field] = ''
                    
                    IDCard.objects.create(
                        table=table,
                        field_data=field_data,
                        status='pending'
                    )
                    cards_created += 1
                    
                except Exception as e:
                    errors.append(f'Row {row_num}: {str(e)}')
        
        else:
            return JsonResponse({
                'success': False, 
                'message': 'Invalid file format! Please upload .xlsx, .xls, or .csv file.'
            }, status=400)
        
        # Return result
        photo_msg = f" with {total_photos_matched} photos matched" if total_photos_matched > 0 else ""
        result = {
            'success': True,
            'message': f'Successfully created {cards_created} ID cards{photo_msg}!',
            'cards_created': cards_created,
            'photos_matched': total_photos_matched,
            'matched_fields': matched_field_names,
        }
        
        if errors:
            result['errors'] = errors[:10]  # Return first 10 errors only
            result['error_count'] = len(errors)
        
        return JsonResponse(result)
        
    except ImportError:
        return JsonResponse({
            'success': False, 
            'message': 'openpyxl library not installed. Run: pip install openpyxl'
        }, status=500)
    except Exception as e:
        return JsonResponse({'success': False, 'message': str(e)}, status=400)


@csrf_exempt
@require_http_methods(["POST"])
def api_idcard_download_images(request, table_id):
    """API endpoint to download images as ZIP for selected cards"""
    try:
        import zipfile
        import os
        from io import BytesIO
        from datetime import datetime
        from django.http import HttpResponse
        from django.core.files.storage import default_storage
        
        table = get_object_or_404(IDCardTable, id=table_id)
        data = json.loads(request.body)
        
        card_ids = data.get('card_ids', [])
        if not card_ids:
            return JsonResponse({'success': False, 'message': 'No cards selected!'}, status=400)
        
        # Get selected cards
        cards = IDCard.objects.filter(table=table, id__in=card_ids)
        if not cards.exists():
            return JsonResponse({'success': False, 'message': 'No cards found!'}, status=400)
        
        # Generate timestamp for filenames (format: YYYYMMDD_HHMMSS)
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        
        # Get image field names from table config
        image_fields = [f['name'] for f in table.fields if f.get('type') == 'image']
        
        # Also check for PHOTO field
        for f in table.fields:
            if f['name'].upper() == 'PHOTO' and f['name'] not in image_fields:
                image_fields.append(f['name'])
        
        # Create ZIP file in memory
        zip_buffer = BytesIO()
        images_added = 0
        
        with zipfile.ZipFile(zip_buffer, 'w', zipfile.ZIP_DEFLATED) as zf:
            sr_no = 1
            for card in cards:
                field_data = card.field_data or {}
                
                # Check all image fields
                for img_field in image_fields:
                    img_path = field_data.get(img_field, '')
                    
                    if img_path and img_path != 'NOT_FOUND' and img_path.strip():
                        try:
                            # Get file from storage
                            if default_storage.exists(img_path):
                                with default_storage.open(img_path, 'rb') as img_file:
                                    img_data = img_file.read()
                                    
                                    # Get original extension
                                    _, ext = os.path.splitext(img_path)
                                    if not ext:
                                        ext = '.jpg'
                                    
                                    # Create new filename: timestamp_SRNO.ext (e.g., 20260202_143052_001.jpg)
                                    new_filename = f"{timestamp}_{str(sr_no).zfill(3)}{ext}"
                                    
                                    # Add to ZIP
                                    zf.writestr(new_filename, img_data)
                                    images_added += 1
                        except Exception as e:
                            # Skip this image if error
                            continue
                
                sr_no += 1
        
        if images_added == 0:
            return JsonResponse({'success': False, 'message': 'No images found for selected cards!'}, status=400)
        
        # Create response with ZIP file
        zip_buffer.seek(0)
        
        # Create ZIP filename with table name and timestamp
        zip_filename = f"{table.name}_{timestamp}_images.zip"
        
        response = HttpResponse(zip_buffer.getvalue(), content_type='application/zip')
        response['Content-Disposition'] = f'attachment; filename="{zip_filename}"'
        response['Content-Length'] = len(zip_buffer.getvalue())
        
        return response
        
    except json.JSONDecodeError:
        return JsonResponse({'success': False, 'message': 'Invalid JSON data!'}, status=400)
    except Exception as e:
        return JsonResponse({'success': False, 'message': str(e)}, status=400)
