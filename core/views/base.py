"""
Base views - Helper functions and Page views
Contains: Dashboard, Staff Management, Client Management pages, etc.
"""
from functools import wraps
from django.shortcuts import render, get_object_or_404, redirect
from django.http import JsonResponse
from django.views.decorators.http import require_http_methods
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth.decorators import login_required
from django.db.models import Count, Q
from ..models import Client, Staff, IDCardGroup, IDCard, IDCardTable, WebsiteSettings

def get_user_role(user):
    """Helper function to get user role display name"""
    return user.get_role_display()


def super_admin_required(view_func):
    """Decorator to ensure only super_admin can access the view"""
    @wraps(view_func)
    def wrapper(request, *args, **kwargs):
        if not request.user.is_authenticated:
            return redirect('login')
        if request.user.role != 'super_admin':
            # Redirect to appropriate dashboard
            if request.user.role == 'admin_staff':
                return redirect('admin_staff_dashboard')
            elif request.user.role == 'client':
                return redirect('client_dashboard')
            elif request.user.role == 'client_staff':
                return redirect('client_staff_dashboard')
            return redirect('login')
        return view_func(request, *args, **kwargs)
    return wrapper


def api_login_required(view_func):
    """Decorator to ensure API endpoints require authentication"""
    @wraps(view_func)
    def wrapper(request, *args, **kwargs):
        if not request.user.is_authenticated:
            return JsonResponse({
                'success': False,
                'message': 'Authentication required',
                'redirect': '/login/'
            }, status=401)
        return view_func(request, *args, **kwargs)
    return wrapper


def api_super_admin_required(view_func):
    """Decorator to ensure API endpoints require super_admin role"""
    @wraps(view_func)
    def wrapper(request, *args, **kwargs):
        if not request.user.is_authenticated:
            return JsonResponse({
                'success': False,
                'message': 'Authentication required',
                'redirect': '/login/'
            }, status=401)
        if request.user.role != 'super_admin':
            return JsonResponse({
                'success': False,
                'message': 'Access denied. Super Admin privileges required.'
            }, status=403)
        return view_func(request, *args, **kwargs)
    return wrapper


# Dashboard
@super_admin_required
def dashboard(request):
    """Main dashboard view - Super Admin only"""
    context = {
        'active_page': 'dashboard',
        'user_role': get_user_role(request.user),
        'total_clients': Client.objects.count(),
        'total_staff': Staff.objects.count(),
        'total_id_cards': IDCard.objects.count(),
        'active_clients': Client.objects.filter(status='active').count(),
        'pending_cards': IDCard.objects.filter(status='pending').count(),
    }
    return render(request, 'index.html', context)


@csrf_exempt
@require_http_methods(["GET"])
@api_super_admin_required
def api_recent_client_updates(request):
    """API endpoint to get recent clients with their ID card status counts"""
    try:
        limit = int(request.GET.get('limit', 5))
        
        # Get recent active clients
        clients = Client.objects.filter(status='active').order_by('-updated_at')[:limit]
        
        results = []
        for client in clients:
            # Get all ID card tables for this client through groups
            tables = IDCardTable.objects.filter(group__client=client)
            
            # Get first table ID for linking (if exists)
            first_table = tables.first()
            first_table_id = first_table.id if first_table else None
            
            # Count cards by status across all tables
            pending_count = IDCard.objects.filter(table__in=tables, status='pending').count()
            verified_count = IDCard.objects.filter(table__in=tables, status='verified').count()
            approved_count = IDCard.objects.filter(table__in=tables, status='approved').count()
            downloaded_count = IDCard.objects.filter(table__in=tables, status='downloaded').count()
            
            results.append({
                'id': client.id,
                'name': client.name,
                'initial': client.name[0].upper() if client.name else 'C',
                'first_table_id': first_table_id,
                'pending': pending_count,
                'verified': verified_count,
                'approved': approved_count,
                'downloaded': downloaded_count,
            })
        
        return JsonResponse({
            'success': True,
            'clients': results
        })
    except Exception as e:
        return JsonResponse({
            'success': False,
            'error': str(e)
        }, status=500)


@csrf_exempt
@require_http_methods(["GET"])
@api_super_admin_required
def api_global_search(request):
    """API endpoint for global search across all ID cards within clients"""
    try:
        query = request.GET.get('q', '').strip()
        filter_type = request.GET.get('filter', 'all')
        
        if not query or len(query) < 2:
            return JsonResponse({
                'success': True,
                'results': [],
                'message': 'Please enter at least 2 characters to search'
            })
        
        results = []
        query_upper = query.upper()
        
        # Use database-level search with field_data JSON contains (case-insensitive via icontains)
        # This is much faster than loading all records into Python
        cards = IDCard.objects.select_related(
            'table', 'table__group', 'table__group__client'
        ).filter(
            field_data__icontains=query
        )[:100]  # Limit at database level for speed
        
        for card in cards:
            field_data = card.field_data or {}
            matched_field = ''
            matched_value = ''
            
            # Find which field matched
            for field_name, field_value in field_data.items():
                if not field_value:
                    continue
                    
                field_name_upper = field_name.upper()
                field_value_str = str(field_value).upper()
                
                # Apply filter
                if filter_type != 'all':
                    if filter_type == 'name' and 'NAME' not in field_name_upper:
                        continue
                    elif filter_type == 'address' and 'ADDRESS' not in field_name_upper:
                        continue
                    elif filter_type == 'mobile' and 'MOBILE' not in field_name_upper and 'PHONE' not in field_name_upper and 'MOB' not in field_name_upper:
                        continue
                
                if query_upper in field_value_str:
                    matched_field = field_name
                    matched_value = str(field_value)
                    break
            
            # Skip if filter was applied but no matching field found
            if filter_type != 'all' and not matched_field:
                continue
                
            # Get display name from first text field
            display_name = ''
            if card.table and card.table.fields:
                for field in card.table.fields:
                    if field.get('type') in ['text', 'textarea'] and field.get('name') in field_data:
                        display_name = field_data.get(field.get('name'), '')
                        break
            
            client_name = card.table.group.client.name if card.table and card.table.group else 'Unknown'
            table_name = card.table.name if card.table else 'Unknown'
            
            results.append({
                'type': 'idcard',
                'id': card.id,
                'title': display_name or f'Card #{card.id}',
                'subtitle': f'{client_name} • {table_name} • {card.get_status_display()}',
                'matched_field': matched_field or 'Field',
                'matched_value': matched_value or query,
                'url': f'/table/{card.table.id}/cards/?status={card.status}&highlight={card.id}' if card.table else '#',
                'icon': 'fa-id-card',
                'status': card.status,
                'photo': card.photo.url if card.photo else None
            })
            
            # Stop after 50 results for speed
            if len(results) >= 50:
                break
        
        # Sort by title
        results.sort(key=lambda x: x['title'])
        
        return JsonResponse({
            'success': True,
            'results': results,
            'count': len(results),
            'query': query
        })
    except Exception as e:
        return JsonResponse({'success': False, 'message': str(e)}, status=400)


# Staff Management
@super_admin_required
def manage_staff(request):
    """View to manage admin staff"""
    staff_list = Staff.objects.filter(staff_type='admin_staff').select_related('user')
    context = {
        'active_page': 'manage_staff',
        'user_role': get_user_role(request.user),
        'staff_list': staff_list,
    }
    return render(request, 'manage-staff.html', context)


# Client Management
@super_admin_required
def manage_clients(request):
    """View to manage all clients"""
    clients = Client.objects.all().select_related('user')
    context = {
        'active_page': 'manage_clients',
        'user_role': get_user_role(request.user),
        'clients': clients,
    }
    return render(request, 'manage-client.html', context)


# Active Clients (ID Card Management)
@super_admin_required
def active_clients(request):
    """View active clients for ID card management"""
    clients = Client.objects.filter(status='active').select_related('user')
    context = {
        'active_page': 'active_clients',
        'user_role': get_user_role(request.user),
        'clients': clients,
    }
    return render(request, 'active-client.html', context)


# ID Card Group
@super_admin_required
def idcard_group(request, client_id):
    """View ID card groups/tables for a specific client with status counts"""
    client = get_object_or_404(Client, id=client_id)
    
    # Get all tables for this client's groups with status counts
    tables = IDCardTable.objects.filter(group__client=client).select_related('group').annotate(
        pending_count=Count('id_cards', filter=Q(id_cards__status='pending')),
        verified_count=Count('id_cards', filter=Q(id_cards__status='verified')),
        pool_count=Count('id_cards', filter=Q(id_cards__status='pool')),
        approved_count=Count('id_cards', filter=Q(id_cards__status='approved')),
        download_count=Count('id_cards', filter=Q(id_cards__status='download')),
        reprint_count=Count('id_cards', filter=Q(id_cards__status='reprint')),
        total_cards=Count('id_cards')
    )
    
    context = {
        'active_page': 'active_clients',
        'user_role': get_user_role(request.user),
        'client': client,
        'tables': tables,
    }
    return render(request, 'idcard-group.html', context)


# ID Card Actions
@super_admin_required
def idcard_actions(request, table_id):
    """View and manage ID cards in a table, optionally filtered by status"""
    table = get_object_or_404(IDCardTable, id=table_id)
    status_filter = request.GET.get('status', None)
    
    # Initial load limit for lazy loading (first 100 records)
    INITIAL_LOAD_LIMIT = 100
    
    # Order by id ascending to maintain upload order (first uploaded = first shown)
    id_cards_query = IDCard.objects.filter(table=table).order_by('id')
    if status_filter and status_filter in ['pending', 'verified', 'pool', 'approved', 'download', 'reprint']:
        id_cards_query = id_cards_query.filter(status=status_filter)
    
    # Get total count for this status
    total_count = id_cards_query.count()
    
    # Only load first batch for initial page render
    id_cards = id_cards_query[:INITIAL_LOAD_LIMIT]
    
    # Get counts for all statuses
    status_counts = {
        'pending': IDCard.objects.filter(table=table, status='pending').count(),
        'verified': IDCard.objects.filter(table=table, status='verified').count(),
        'pool': IDCard.objects.filter(table=table, status='pool').count(),
        'approved': IDCard.objects.filter(table=table, status='approved').count(),
        'download': IDCard.objects.filter(table=table, status='download').count(),
        'reprint': IDCard.objects.filter(table=table, status='reprint').count(),
        'total': IDCard.objects.filter(table=table).count(),
    }
    
    # Create a field type lookup from table.fields
    field_types = {field['name']: field['type'] for field in table.fields}
    
    # Enrich each card with ordered field values matching table.fields
    enriched_cards = []
    for idx, card in enumerate(id_cards):
        ordered_fields = []
        field_data = card.field_data or {}
        
        # Create case-insensitive lookup for field_data
        # This handles cases where table fields might have different case than stored data
        field_data_normalized = {}
        for key, value in field_data.items():
            # Store with uppercase key for case-insensitive lookup
            field_data_normalized[key.upper()] = value
        
        for field in table.fields:
            field_name = field['name']
            field_type = field['type']
            # Try exact match first, then case-insensitive match
            field_value = field_data.get(field_name, '')
            if not field_value:
                # Try case-insensitive lookup
                field_value = field_data_normalized.get(field_name.upper(), '')
            ordered_fields.append({
                'name': field_name,
                'type': field_type,
                'value': field_value,
            })
        enriched_cards.append({
            'id': card.id,
            'sr_no': idx + 1,
            'photo': card.photo,
            'status': card.status,
            'get_status_display': card.get_status_display(),
            'updated_at': card.updated_at,
            'ordered_fields': ordered_fields,
        })
    
    context = {
        'active_page': 'active_clients',
        'user_role': get_user_role(request.user),
        'table': table,
        'group': table.group,
        'client': table.group.client,
        'id_cards': enriched_cards,
        'current_status': status_filter,
        'status_counts': status_counts,
        'total_count': total_count,
        'initial_load_limit': INITIAL_LOAD_LIMIT,
        'has_more': total_count > INITIAL_LOAD_LIMIT,
    }
    return render(request, 'idcard-actions.html', context)


# Group Settings
@super_admin_required
def group_settings(request, client_id):
    """Settings for a specific client - manage their groups and tables"""
    client = get_object_or_404(Client, id=client_id)
    # Get the first group for client, or create one if none exists
    group = IDCardGroup.objects.filter(client=client).first()
    if not group:
        group = IDCardGroup.objects.create(
            client=client,
            name=f"{client.name} - Default Group",
            is_active=True
        )
    tables = IDCardTable.objects.filter(group=group).annotate(
        total_cards=Count('id_cards')
    )
    context = {
        'active_page': 'active_clients',
        'user_role': get_user_role(request.user),
        'client': client,
        'group': group,
        'tables': tables,
    }
    return render(request, 'group-setting.html', context)


# Website Management
@super_admin_required
def manage_website(request):
    """Manage website/CMS settings"""
    website_settings, created = WebsiteSettings.objects.get_or_create(id=1)
    context = {
        'active_page': 'manage_website',
        'user_role': get_user_role(request.user),
        'website_settings': website_settings,
    }
    return render(request, 'manage-website.html', context)


# System Settings - Available to all logged in users
@login_required
def settings(request):
    """User settings/profile view - accessible by all user types"""
    context = {
        'active_page': 'settings',
        'user_role': get_user_role(request.user),
    }
    return render(request, 'settings.html', context)
