"""
ID Card Service Module
Contains: ID Card and ID Card Table CRUD, status management, search
"""
from typing import Dict, Any, Optional, List
import json

from django.shortcuts import get_object_or_404
from django.db.models import Count

from ..models import IDCardGroup, IDCardTable, IDCard
from .base import BaseService, ServiceResult
from .image_service import ImageService


class IDCardService(BaseService):
    """
    Service for ID Card and ID Card Table operations.
    
    This is the core service handling:
    - ID Card Table CRUD (schema definition)
    - ID Card CRUD (individual records)
    - Status management (pending → verified → pool → approved → download → reprint)
    - Search across cards
    - Bulk operations
    """
    
    MAX_FIELDS_PER_TABLE = 20
    VALID_FIELD_TYPES = ['text', 'number', 'date', 'email', 'image', 'textarea']
    VALID_STATUSES = ['pending', 'verified', 'pool', 'approved', 'download', 'reprint']
    
    # ==================== ID Card Table Operations ====================
    
    @classmethod
    def serialize_table(cls, table: IDCardTable) -> Dict[str, Any]:
        """Serialize IDCardTable to dict"""
        return {
            'id': table.id,
            'name': table.name,
            'fields': table.fields,
            'field_count': len(table.fields) if table.fields else 0,
            'is_active': table.is_active,
            'created_at': table.created_at.strftime('%d-%b-%Y %I:%M %p'),
            'updated_at': table.updated_at.strftime('%d-%b-%Y %I:%M %p'),
        }
    
    @classmethod
    def create_table(cls, group_id: int, data: Dict[str, Any]) -> ServiceResult:
        """Create a new ID Card Table"""
        try:
            group = get_object_or_404(IDCardGroup, id=group_id)
            
            name = data.get('name', '').strip().upper()
            if not name:
                return ServiceResult(success=False, message='Table name is required!')
            
            fields = data.get('fields', [])
            if len(fields) > cls.MAX_FIELDS_PER_TABLE:
                return ServiceResult(
                    success=False, 
                    message=f'Maximum {cls.MAX_FIELDS_PER_TABLE} fields allowed!'
                )
            
            # Validate and normalize fields
            validated_fields = []
            for idx, field in enumerate(fields):
                field_name = field.get('name', '').strip().upper()
                field_type = field.get('type', 'text')
                
                if not field_name:
                    return ServiceResult(
                        success=False, 
                        message=f'Field {idx+1} name is required!'
                    )
                
                if field_type not in cls.VALID_FIELD_TYPES:
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
            
            return ServiceResult(
                success=True,
                message='Table created successfully!',
                data={'table': cls.serialize_table(table)}
            )
            
        except Exception as e:
            return ServiceResult(success=False, message=str(e))
    
    @classmethod
    def get_table(cls, table_id: int) -> ServiceResult:
        """Get a single ID Card Table"""
        try:
            table = get_object_or_404(IDCardTable, id=table_id)
            return ServiceResult(
                success=True,
                data={'table': cls.serialize_table(table)}
            )
        except Exception as e:
            return ServiceResult(success=False, message=str(e))
    
    @classmethod
    def update_table(cls, table_id: int, data: Dict[str, Any]) -> ServiceResult:
        """Update an ID Card Table"""
        try:
            table = get_object_or_404(IDCardTable, id=table_id)
            
            name = data.get('name', '').strip().upper()
            if not name:
                return ServiceResult(success=False, message='Table name is required!')
            
            fields = data.get('fields', [])
            if len(fields) > cls.MAX_FIELDS_PER_TABLE:
                return ServiceResult(
                    success=False, 
                    message=f'Maximum {cls.MAX_FIELDS_PER_TABLE} fields allowed!'
                )
            
            # Validate fields
            validated_fields = []
            for idx, field in enumerate(fields):
                field_name = field.get('name', '').strip().upper()
                field_type = field.get('type', 'text')
                
                if not field_name:
                    return ServiceResult(
                        success=False, 
                        message=f'Field {idx+1} name is required!'
                    )
                
                if field_type not in cls.VALID_FIELD_TYPES:
                    field_type = 'text'
                
                validated_fields.append({
                    'name': field_name,
                    'type': field_type,
                    'order': idx
                })
            
            table.name = name
            table.fields = validated_fields
            table.save()
            
            return ServiceResult(
                success=True,
                message='Table updated successfully!',
                data={'table': cls.serialize_table(table)}
            )
            
        except Exception as e:
            return ServiceResult(success=False, message=str(e))
    
    @classmethod
    def delete_table(cls, table_id: int) -> ServiceResult:
        """Delete an ID Card Table"""
        try:
            table = get_object_or_404(IDCardTable, id=table_id)
            table_name = table.name
            table.delete()
            
            return ServiceResult(
                success=True,
                message=f'Table "{table_name}" deleted successfully!'
            )
        except Exception as e:
            return ServiceResult(success=False, message=str(e))
    
    @classmethod
    def toggle_table_status(cls, table_id: int) -> ServiceResult:
        """Toggle ID Card Table active/inactive status"""
        try:
            table = get_object_or_404(IDCardTable, id=table_id)
            
            table.is_active = not table.is_active
            status = 'active' if table.is_active else 'inactive'
            status_display = 'Active' if table.is_active else 'Inactive'
            table.save()
            
            return ServiceResult(
                success=True,
                message=f'Table status changed to {status_display}!',
                data={'status': status, 'status_display': status_display}
            )
        except Exception as e:
            return ServiceResult(success=False, message=str(e))
    
    @classmethod
    def list_tables(cls, group_id: int) -> ServiceResult:
        """List all ID Card Tables for a group"""
        try:
            group = get_object_or_404(IDCardGroup, id=group_id)
            tables = IDCardTable.objects.filter(group=group)
            
            return ServiceResult(
                success=True,
                data={'tables': [cls.serialize_table(t) for t in tables]}
            )
        except Exception as e:
            return ServiceResult(success=False, message=str(e))
    
    # ==================== ID Card Operations ====================
    
    @classmethod
    def serialize_card(cls, card: IDCard, sr_no: int = None, table_fields: List[dict] = None) -> Dict[str, Any]:
        """Serialize IDCard to dict"""
        data = {
            'id': card.id,
            'table_id': card.table_id,
            'field_data': card.field_data,
            'photo': card.photo.url if card.photo else None,
            'status': card.status,
            'status_display': card.get_status_display(),
            'created_at': card.created_at.strftime('%d-%b-%Y %I:%M %p'),
            'updated_at': card.updated_at.strftime('%d-%b-%Y %I:%M %p'),
        }
        
        if sr_no is not None:
            data['sr_no'] = sr_no
        
        # Add ordered_fields if table_fields provided
        if table_fields:
            ordered_fields = []
            field_data = card.field_data or {}
            
            # Create case-insensitive lookup
            field_data_normalized = {k.upper(): v for k, v in field_data.items()}
            
            for field in table_fields:
                field_name = field['name']
                field_type = field.get('type', 'text')
                
                # Check if it's an image field
                if cls.is_image_field(field):
                    field_type = 'image'
                
                # Get value (case-insensitive)
                field_value = field_data.get(field_name, '') or field_data_normalized.get(field_name.upper(), '')
                
                ordered_fields.append({
                    'name': field_name,
                    'type': field_type,
                    'value': field_value,
                })
            
            data['ordered_fields'] = ordered_fields
        
        return data
    
    @classmethod
    def list_cards(
        cls, 
        table_id: int, 
        status_filter: str = None,
        offset: int = 0,
        limit: int = 100
    ) -> ServiceResult:
        """List ID Cards for a table with pagination"""
        try:
            table = get_object_or_404(IDCardTable, id=table_id)
            
            # Base queryset
            cards_query = IDCard.objects.filter(table=table).order_by('id')
            
            if status_filter and status_filter in cls.VALID_STATUSES:
                cards_query = cards_query.filter(status=status_filter)
            
            total_count = cards_query.count()
            cards = cards_query[offset:offset + limit]
            
            # Serialize cards
            card_list = []
            for idx, card in enumerate(cards):
                card_list.append(cls.serialize_card(
                    card, 
                    sr_no=offset + idx + 1,
                    table_fields=table.fields
                ))
            
            # Get status counts
            status_counts = cls.get_status_counts(table)
            
            return ServiceResult(
                success=True,
                data={
                    'cards': card_list,
                    'total_count': total_count,
                    'offset': offset,
                    'limit': limit,
                    'has_more': offset + limit < total_count,
                    'status_counts': status_counts,
                    'table': cls.serialize_table(table),
                }
            )
            
        except Exception as e:
            return ServiceResult(success=False, message=str(e))
    
    @classmethod
    def get_status_counts(cls, table: IDCardTable) -> Dict[str, int]:
        """Get count of cards by status for a table"""
        counts = {status: 0 for status in cls.VALID_STATUSES}
        counts['total'] = 0
        
        # Efficient aggregation
        status_agg = IDCard.objects.filter(table=table).values('status').annotate(count=Count('id'))
        
        for item in status_agg:
            counts[item['status']] = item['count']
            counts['total'] += item['count']
        
        return counts
    
    @classmethod
    def get_all_card_ids(cls, table_id: int, status_filter: str = None) -> ServiceResult:
        """Get all card IDs for a table (for Select All)"""
        try:
            table = get_object_or_404(IDCardTable, id=table_id)
            
            cards_query = IDCard.objects.filter(table=table)
            if status_filter and status_filter in cls.VALID_STATUSES:
                cards_query = cards_query.filter(status=status_filter)
            
            card_ids = list(cards_query.values_list('id', flat=True))
            
            return ServiceResult(
                success=True,
                data={'card_ids': card_ids, 'total_count': len(card_ids)}
            )
        except Exception as e:
            return ServiceResult(success=False, message=str(e))
    
    @classmethod
    def create_card(
        cls, 
        table_id: int, 
        field_data: Dict[str, Any],
        image_files: Dict[str, Any] = None
    ) -> ServiceResult:
        """Create a new ID Card"""
        try:
            table = get_object_or_404(IDCardTable, id=table_id)
            client = table.group.client
            
            # Uppercase all string values
            field_data = cls.uppercase_dict_values(field_data)
            
            # Handle image uploads if provided
            if image_files:
                image_counter = 0
                for field in table.fields:
                    if cls.is_image_field(field):
                        field_name = field['name']
                        file_key = f"image_{field_name}"
                        
                        if file_key in image_files:
                            image_counter += 1
                            result = ImageService.save_image(
                                image_files[file_key],
                                client,
                                batch_counter=image_counter
                            )
                            if result.success:
                                field_data[field_name] = result.data['path']
            
            card = IDCard.objects.create(
                table=table,
                field_data=field_data,
                status='pending'
            )
            
            return ServiceResult(
                success=True,
                message='ID Card created successfully!',
                data={'card': cls.serialize_card(card)}
            )
            
        except Exception as e:
            return ServiceResult(success=False, message=str(e))
    
    @classmethod
    def get_card(cls, card_id: int) -> ServiceResult:
        """Get a single ID Card"""
        try:
            card = get_object_or_404(IDCard, id=card_id)
            
            data = cls.serialize_card(card)
            data['table_name'] = card.table.name
            
            return ServiceResult(success=True, data={'card': data})
        except Exception as e:
            return ServiceResult(success=False, message=str(e))
    
    @classmethod
    def update_card(
        cls, 
        card_id: int, 
        field_data: Dict[str, Any] = None,
        status: str = None,
        image_files: Dict[str, Any] = None
    ) -> ServiceResult:
        """Update an ID Card"""
        try:
            card = get_object_or_404(IDCard, id=card_id)
            table = card.table
            client = table.group.client
            
            # Merge with existing field_data
            existing_data = card.field_data or {}
            
            if field_data:
                field_data = cls.uppercase_dict_values(field_data)
                existing_data.update(field_data)
            
            # Handle image uploads
            if image_files:
                image_counter = 0
                for field in table.fields:
                    if cls.is_image_field(field):
                        field_name = field['name']
                        file_key = f"image_{field_name}"
                        
                        if file_key in image_files:
                            existing_path = existing_data.get(field_name, '')
                            image_counter += 1
                            
                            result = ImageService.save_image(
                                image_files[file_key],
                                client,
                                existing_path=existing_path,
                                batch_counter=image_counter
                            )
                            if result.success:
                                existing_data[field_name] = result.data['path']
            
            card.field_data = existing_data
            
            if status and status in cls.VALID_STATUSES:
                card.status = status
            
            card.save()
            
            return ServiceResult(
                success=True,
                message='ID Card updated successfully!',
                data={'card': cls.serialize_card(card)}
            )
            
        except Exception as e:
            return ServiceResult(success=False, message=str(e))
    
    @classmethod
    def update_single_field(cls, card_id: int, field: str, value: Any) -> ServiceResult:
        """Update a single field on an ID Card (for inline editing)"""
        try:
            card = get_object_or_404(IDCard, id=card_id)
            
            if not field:
                return ServiceResult(success=False, message='Field name is required!')
            
            field_data = card.field_data or {}
            
            if isinstance(value, str):
                field_data[field] = value.upper()
            else:
                field_data[field] = value
            
            card.field_data = field_data
            card.save()
            
            return ServiceResult(
                success=True,
                message='Field updated successfully!',
                data={'field': field, 'value': field_data[field]}
            )
            
        except Exception as e:
            return ServiceResult(success=False, message=str(e))
    
    @classmethod
    def delete_card(cls, card_id: int) -> ServiceResult:
        """Delete an ID Card"""
        try:
            card = get_object_or_404(IDCard, id=card_id)
            card.delete()
            
            return ServiceResult(
                success=True,
                message='ID Card deleted successfully!'
            )
        except Exception as e:
            return ServiceResult(success=False, message=str(e))
    
    @classmethod
    def change_status(cls, card_id: int, new_status: str) -> ServiceResult:
        """Change an ID Card's status"""
        try:
            if new_status not in cls.VALID_STATUSES:
                return ServiceResult(success=False, message='Invalid status!')
            
            card = get_object_or_404(IDCard, id=card_id)
            card.status = new_status
            card.save()
            
            return ServiceResult(
                success=True,
                message=f'Card status changed to {card.get_status_display()}!',
                data={
                    'status': card.status,
                    'status_display': card.get_status_display()
                }
            )
        except Exception as e:
            return ServiceResult(success=False, message=str(e))
    
    @classmethod
    def bulk_change_status(
        cls, 
        table_id: int, 
        card_ids: List[int], 
        new_status: str
    ) -> ServiceResult:
        """Change status of multiple ID Cards"""
        try:
            if new_status not in cls.VALID_STATUSES:
                return ServiceResult(success=False, message='Invalid status!')
            
            table = get_object_or_404(IDCardTable, id=table_id)
            updated_count = IDCard.objects.filter(
                table=table, 
                id__in=card_ids
            ).update(status=new_status)
            
            return ServiceResult(
                success=True,
                message=f'{updated_count} cards updated to {new_status}!',
                data={'updated_count': updated_count}
            )
        except Exception as e:
            return ServiceResult(success=False, message=str(e))
    
    @classmethod
    def bulk_delete(
        cls, 
        table_id: int, 
        card_ids: List[int] = None, 
        delete_all: bool = False
    ) -> ServiceResult:
        """Delete multiple ID Cards"""
        try:
            table = get_object_or_404(IDCardTable, id=table_id)
            
            if delete_all:
                deleted_count, _ = IDCard.objects.filter(table=table).delete()
            else:
                deleted_count, _ = IDCard.objects.filter(
                    table=table, 
                    id__in=card_ids or []
                ).delete()
            
            return ServiceResult(
                success=True,
                message=f'{deleted_count} cards deleted successfully!',
                data={'deleted_count': deleted_count}
            )
        except Exception as e:
            return ServiceResult(success=False, message=str(e))
    
    @classmethod
    def search_cards(cls, table_id: int, query: str) -> ServiceResult:
        """Search ID Cards across all statuses"""
        try:
            if not query or len(query) < 2:
                return ServiceResult(
                    success=True,
                    data={'results': [], 'count': 0},
                    message='Please enter at least 2 characters to search'
                )
            
            table = get_object_or_404(IDCardTable, id=table_id)
            query_upper = query.strip().upper()
            
            cards = IDCard.objects.filter(table=table)
            
            results = []
            for card in cards:
                field_data = card.field_data or {}
                match_found = False
                matched_field = ''
                matched_value = ''
                
                for field_name, field_value in field_data.items():
                    if field_value and query_upper in str(field_value).upper():
                        match_found = True
                        matched_field = field_name
                        matched_value = str(field_value)
                        break
                
                if match_found:
                    # Get display name from first text field
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
            
            return ServiceResult(
                success=True,
                data={
                    'results': results,
                    'count': len(results),
                    'query': query
                }
            )
            
        except Exception as e:
            return ServiceResult(success=False, message=str(e))
