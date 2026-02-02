"""
Base views - Helper functions and Page views
Contains: Dashboard, Staff Management, Client Management pages, etc.
"""
from django.shortcuts import render, get_object_or_404
from django.http import JsonResponse
from django.views.decorators.http import require_http_methods
from django.views.decorators.csrf import csrf_exempt
from django.db.models import Count, Q
from ..models import Client, Staff, IDCardGroup, IDCard, IDCardTable, WebsiteSettings


def get_user_role(user):
    """Helper function to get user role display name"""
    if user.is_authenticated:
        return user.get_role_display()
    return "Guest"


# Dashboard
def dashboard(request):
    """Main dashboard view"""
    context = {
        'active_page': 'dashboard',
        'user_role': get_user_role(request.user) if request.user.is_authenticated else 'Guest',
        'total_clients': Client.objects.count(),
        'total_staff': Staff.objects.count(),
        'total_id_cards': IDCard.objects.count(),
        'active_clients': Client.objects.filter(status='active').count(),
        'pending_cards': IDCard.objects.filter(status='pending').count(),
    }
    return render(request, 'index.html', context)


@csrf_exempt
@require_http_methods(["GET"])
def api_global_search(request):
    """API endpoint for global search across all clients and ID cards"""
    try:
        query = request.GET.get('q', '').strip().upper()
        filter_type = request.GET.get('filter', 'all')
        
        if not query or len(query) < 2:
            return JsonResponse({
                'success': True,
                'results': [],
                'message': 'Please enter at least 2 characters to search'
            })
        
        results = []
        
        # Search in Clients
        clients = Client.objects.all()
        for client in clients:
            if query in client.name.upper():
                results.append({
                    'type': 'client',
                    'id': client.id,
                    'title': client.name,
                    'subtitle': f'Client • {client.status.title()}',
                    'matched_field': 'Name',
                    'matched_value': client.name,
                    'url': f'/client/{client.id}/groups/',
                    'icon': 'fa-building',
                    'status': client.status
                })
        
        # Search in ID Cards
        cards = IDCard.objects.select_related('table', 'table__group').all()
        
        for card in cards:
            field_data = card.field_data or {}
            match_found = False
            matched_field = ''
            matched_value = ''
            
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
                
                if query in field_value_str:
                    match_found = True
                    matched_field = field_name
                    matched_value = str(field_value)
                    break
            
            if match_found:
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
                    'matched_field': matched_field,
                    'matched_value': matched_value,
                    'url': f'/table/{card.table.id}/cards/?status={card.status}&highlight={card.id}' if card.table else '#',
                    'icon': 'fa-id-card',
                    'status': card.status,
                    'photo': card.photo.url if card.photo else None
                })
        
        # Sort by type (clients first, then cards)
        results.sort(key=lambda x: (0 if x['type'] == 'client' else 1, x['title']))
        
        # Limit results
        results = results[:50]
        
        return JsonResponse({
            'success': True,
            'results': results,
            'count': len(results),
            'query': query
        })
    except Exception as e:
        return JsonResponse({'success': False, 'message': str(e)}, status=400)


# Staff Management
def manage_staff(request):
    """View to manage admin staff"""
    staff_list = Staff.objects.filter(staff_type='admin_staff').select_related('user')
    context = {
        'active_page': 'manage_staff',
        'user_role': get_user_role(request.user) if request.user.is_authenticated else 'Guest',
        'staff_list': staff_list,
    }
    return render(request, 'manage-staff.html', context)


# Client Management
def manage_clients(request):
    """View to manage all clients"""
    clients = Client.objects.all().select_related('user')
    context = {
        'active_page': 'manage_clients',
        'user_role': get_user_role(request.user) if request.user.is_authenticated else 'Guest',
        'clients': clients,
    }
    return render(request, 'manage-client.html', context)


# Active Clients (ID Card Management)
def active_clients(request):
    """View active clients for ID card management"""
    clients = Client.objects.filter(status='active').select_related('user')
    context = {
        'active_page': 'active_clients',
        'user_role': get_user_role(request.user) if request.user.is_authenticated else 'Guest',
        'clients': clients,
    }
    return render(request, 'active-client.html', context)


# ID Card Group
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
        'user_role': get_user_role(request.user) if request.user.is_authenticated else 'Guest',
        'client': client,
        'tables': tables,
    }
    return render(request, 'idcard-group.html', context)


# ID Card Actions
def idcard_actions(request, table_id):
    """View and manage ID cards in a table, optionally filtered by status"""
    table = get_object_or_404(IDCardTable, id=table_id)
    status_filter = request.GET.get('status', None)
    
    # Order by id ascending to maintain upload order (first uploaded = first shown)
    id_cards = IDCard.objects.filter(table=table).order_by('id')
    if status_filter and status_filter in ['pending', 'verified', 'pool', 'approved', 'download', 'reprint']:
        id_cards = id_cards.filter(status=status_filter)
    
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
    for card in id_cards:
        ordered_fields = []
        for field in table.fields:
            field_name = field['name']
            field_type = field['type']
            field_value = card.field_data.get(field_name, '')
            ordered_fields.append({
                'name': field_name,
                'type': field_type,
                'value': field_value,
            })
        enriched_cards.append({
            'id': card.id,
            'photo': card.photo,
            'status': card.status,
            'get_status_display': card.get_status_display(),
            'updated_at': card.updated_at,
            'ordered_fields': ordered_fields,
        })
    
    context = {
        'active_page': 'active_clients',
        'user_role': get_user_role(request.user) if request.user.is_authenticated else 'Guest',
        'table': table,
        'group': table.group,
        'client': table.group.client,
        'id_cards': enriched_cards,
        'current_status': status_filter,
        'status_counts': status_counts,
    }
    return render(request, 'idcard-actions.html', context)


# Group Settings
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
        'user_role': get_user_role(request.user) if request.user.is_authenticated else 'Guest',
        'client': client,
        'group': group,
        'tables': tables,
    }
    return render(request, 'group-setting.html', context)


# Website Management
def manage_website(request):
    """Manage website/CMS settings"""
    website_settings, created = WebsiteSettings.objects.get_or_create(id=1)
    context = {
        'active_page': 'manage_website',
        'user_role': get_user_role(request.user) if request.user.is_authenticated else 'Guest',
        'website_settings': website_settings,
    }
    return render(request, 'manage-website.html', context)


# System Settings
def settings(request):
    """System settings view"""
    context = {
        'active_page': 'settings',
        'user_role': get_user_role(request.user) if request.user.is_authenticated else 'Guest',
    }
    return render(request, 'settings.html', context)
