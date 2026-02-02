from django import template
import json

register = template.Library()

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
