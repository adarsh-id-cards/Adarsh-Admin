from django import template
import json

register = template.Library()

# Image field types
IMAGE_FIELD_TYPES = ['photo', 'mother_photo', 'father_photo', 'barcode', 'qr_code', 'signature', 'image']

# Image field name patterns - fields with these words in their name are treated as image fields
IMAGE_FIELD_NAME_PATTERNS = ['photo', 'sign', 'signature', 'barcode', 'qr']


def is_image_field_by_name(field_name):
    """
    Check if a field name contains any image-related patterns.
    This helps detect fields like 'PHOTO', 'F PHOTO', 'M PHOTO', 'SIGN', etc.
    """
    if not field_name:
        return False
    name_lower = field_name.lower()
    for pattern in IMAGE_FIELD_NAME_PATTERNS:
        if pattern in name_lower:
            return True
    return False


@register.filter
def get_field(field_data, key):
    """
    Get a value from a dictionary by key.
    Usage: {{ card.field_data|get_field:field.key }}
    """
    if field_data is None:
        return ''
    if isinstance(field_data, str):
        try:
            field_data = json.loads(field_data)
        except (json.JSONDecodeError, TypeError):
            return ''
    if isinstance(field_data, dict):
        return field_data.get(key, '')
    return ''

@register.filter
def json_encode(value):
    """
    Convert a Python object to JSON string.
    Usage: {{ table.fields|json_encode }}
    """
    import json
    if value is None:
        return '[]'
    return json.dumps(value)

@register.filter
def is_image_field(field_type):
    """
    Check if a field type is an image field.
    Usage: {% if field.type|is_image_field %}
    """
    return field_type in IMAGE_FIELD_TYPES


@register.filter
def is_image_field_or_name(field):
    """
    Check if a field is an image field by type OR by name pattern.
    Accepts a field dict with 'type' and 'name' keys.
    Usage: {% if field|is_image_field_or_name %}
    """
    if isinstance(field, dict):
        field_type = field.get('type', '')
        field_name = field.get('name', '')
        return field_type in IMAGE_FIELD_TYPES or is_image_field_by_name(field_name)
    return False


@register.simple_tag
def is_image_type(field_type):
    """
    Check if a field type is an image field (for use in templates).
    Usage: {% is_image_type field.type as is_img %}
    """
    return field_type in IMAGE_FIELD_TYPES


@register.filter
def get_image_class(field_name):
    """
    Get CSS class based on field name for different image types.
    Returns: 'photo-type', 'signature-type', 'qr-type', 'barcode-type'
    Usage: {{ field.name|get_image_class }}
    """
    if not field_name:
        return 'photo-type'
    name_lower = field_name.lower()
    if 'sign' in name_lower:
        return 'signature-type'
    elif 'qr' in name_lower:
        return 'qr-type'
    elif 'barcode' in name_lower:
        return 'barcode-type'
    else:
        return 'photo-type'


@register.filter
def expand_field_name(field_name):
    """
    Expand short field names to full descriptive names.
    E.g., 'F PHOTO' -> 'FATHER PHOTO', 'M PHOTO' -> 'MOTHER PHOTO'
    Usage: {{ field.name|expand_field_name }}
    """
    if not field_name:
        return field_name
    
    name_upper = field_name.upper().strip()
    
    # Map of short names to full names
    expansions = {
        'F PHOTO': 'FATHER PHOTO',
        'M PHOTO': 'MOTHER PHOTO',
        'F_PHOTO': 'FATHER PHOTO',
        'M_PHOTO': 'MOTHER PHOTO',
        'FPHOTO': 'FATHER PHOTO',
        'MPHOTO': 'MOTHER PHOTO',
        'F SIGN': 'FATHER SIGN',
        'M SIGN': 'MOTHER SIGN',
        'SIGN': 'SIGNATURE',
    }
    
    return expansions.get(name_upper, field_name)


@register.simple_tag
def check_image_field(field_type, field_name):
    """
    Check if a field is an image field by type OR by name pattern.
    Usage: {% check_image_field field.type field.name as is_img %}
    """
    return field_type in IMAGE_FIELD_TYPES or is_image_field_by_name(field_name)


@register.filter
def get_thumbnail_path(image_path):
    """
    Convert an image path to its thumbnail path.
    Follows the server naming convention: {filename}_thumb.{ext}
    
    Usage: {{ field.value|get_thumbnail_path }}
    
    Example:
        Input:  'adarshimg/ABCDE12345/14325123456101.jpg'
        Output: 'adarshimg/ABCDE12345/14325123456101_thumb.jpg'
    
    Returns original path if conversion fails (fallback safe).
    """
    import os
    
    if not image_path or image_path == '' or image_path == 'NOT_FOUND':
        return image_path
    
    # Handle PENDING: prefix - return as-is (no thumbnail for pending)
    if isinstance(image_path, str) and image_path.startswith('PENDING:'):
        return image_path
    
    # Split into base and extension
    try:
        base, ext = os.path.splitext(image_path)
        if base and ext:
            return f"{base}_thumb{ext}"
    except Exception:
        pass
    
    # Fallback to original path
    return image_path


@register.simple_tag
def cache_bust():
    """
    Generate a cache-busting timestamp for image URLs.
    Usage: {% cache_bust as cb %}
           <img src="/media/{{ path }}?t={{ cb }}">
    """
    import time
    return int(time.time())
