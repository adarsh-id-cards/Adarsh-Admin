# =============================================================================
# ADARSH ADMIN - SERVICE LAYER
# =============================================================================
# 
# Services contain reusable business logic separated from views.
# Views should be thin - only handling HTTP request/response.
# 
# FOLDER STRUCTURE:
# services/
#     __init__.py          - Exports all services
#     base.py              - Base service class, common utilities
#     client_service.py    - Client CRUD operations
#     staff_service.py     - Staff CRUD operations
#     idcard_service.py    - ID Card CRUD, status management
#     image_service.py     - Image upload, processing, filename generation
#     export_service.py    - DOCX, XLSX, ZIP export operations
#     import_service.py    - Bulk upload from Excel/CSV with photos
#     permission_service.py - Permission checking utilities
# =============================================================================

from .base import ServiceResult, BaseService
from .image_service import ImageService
from .client_service import ClientService
from .staff_service import StaffService
from .idcard_service import IDCardService
from .export_service import ExportService
from .import_service import ImportService
from .permission_service import PermissionService
from .base import StreamingZipIndex

__all__ = [
    'ServiceResult',
    'BaseService',
    'StreamingZipIndex',
    'ImageService',
    'ClientService',
    'StaffService',
    'IDCardService',
    'ExportService',
    'ImportService',
    'PermissionService',
]
