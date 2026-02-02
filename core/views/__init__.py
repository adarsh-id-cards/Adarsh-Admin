# Views Package - Split for better organization and debugging
# Import all views from sub-modules to maintain backward compatibility

from .base import (
    get_user_role,
    dashboard,
    api_global_search,
    manage_staff,
    manage_clients,
    active_clients,
    idcard_group,
    idcard_actions,
    group_settings,
    manage_website,
    settings,
)

from .client_api import (
    api_client_create,
    api_client_get,
    api_client_update,
    api_client_delete,
    api_client_toggle_status,
    api_client_staff,
)

from .staff_api import (
    api_staff_create,
    api_staff_get,
    api_staff_update,
    api_staff_delete,
    api_staff_toggle_status,
)

from .idcard_api import (
    api_idcard_table_create,
    api_idcard_table_get,
    api_idcard_table_update,
    api_idcard_table_delete,
    api_idcard_table_toggle_status,
    api_idcard_table_list,
    api_idcard_list,
    api_idcard_create,
    api_idcard_get,
    api_idcard_update,
    api_idcard_delete,
    api_idcard_change_status,
    api_idcard_bulk_status,
    api_idcard_bulk_delete,
    api_idcard_search,
    api_table_status_counts,
    api_idcard_bulk_upload,
    api_idcard_download_images,
)
