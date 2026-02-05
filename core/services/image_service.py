"""
Image Service Module
Contains: Image filename generation, validation, saving, and folder management
"""
import os
import uuid
from datetime import datetime
from typing import Tuple, Optional
from io import BytesIO

from django.conf import settings
from django.core.files.storage import default_storage
from django.core.files.base import ContentFile

from .base import BaseService, ServiceResult


class ImageService(BaseService):
    """
    Service for handling all image operations.
    
    Responsibilities:
    - Generate unique filenames for images
    - Validate image data
    - Save images to client folders
    - Delete old images when updating
    """
    
    @staticmethod
    def generate_filename(batch_counter: int = 1, original_ext: str = '.jpg') -> str:
        """
        Generate a unique filename for NEW uploaded images.
        Format: {HHMMSSmmmuuuCC}.ext (14 digits total)
        
        Args:
            batch_counter: Sequential number within current upload batch (starts from 1)
            original_ext: Original file extension
        
        Returns:
            New filename string (14 digits + extension)
            
        Note:
            Counter uses 00-99 (2 digits) for 100 unique slots per microsecond,
            preventing filename collisions in high-throughput batch uploads.
        """
        try:
            ext = original_ext.lower() if original_ext else '.jpg'
            if not ext.startswith('.'):
                ext = '.' + ext
            
            if ext not in BaseService.VALID_IMAGE_EXTENSIONS:
                ext = '.jpg'
            
            now = datetime.now()
            time_part = now.strftime('%H%M%S')
            
            microseconds = now.microsecond
            milliseconds = microseconds // 1000
            micros = microseconds % 1000
            
            mmm = str(milliseconds).zfill(3)
            uuu = str(micros).zfill(3)
            # 2-digit counter (00-99) for 100 unique slots per microsecond
            counter = batch_counter % 100
            
            filename = f"{time_part}{mmm}{uuu}{counter:02d}{ext}"
            return filename
            
        except Exception:
            return f"img{uuid.uuid4().hex[:10]}{original_ext or '.jpg'}"
    
    @staticmethod
    def generate_updated_filename(existing_path: str, new_ext: Optional[str] = None) -> str:
        """
        Generate updated filename for EXISTING images (update/reupload).
        Keeps the ORIGINAL 14-digit timestamp and adds underscore + 6-digit HHMMSS.
        
        Example:
        - First upload: 14325123456101.jpg (14 digits)
        - First update: 14325123456101_163045.jpg (21 digits)
        
        Args:
            existing_path: Current file path or filename
            new_ext: Optional new extension
        
        Returns:
            New filename string (21 digits + extension)
            
        Note:
            Also handles legacy 13-digit filenames from before the upgrade.
        """
        try:
            if existing_path and existing_path not in ['NOT_FOUND', '', 'PENDING']:
                filename = os.path.basename(existing_path)
            else:
                return ImageService.generate_filename(1, new_ext or '.jpg')
            
            base_name, current_ext = os.path.splitext(filename)
            
            ext = new_ext.lower() if new_ext else current_ext.lower()
            if not ext.startswith('.'):
                ext = '.' + ext
            
            if ext not in BaseService.VALID_IMAGE_EXTENSIONS:
                ext = '.jpg'
            
            # Extract original 14-digit timestamp (or legacy 13-digit)
            if '_' in base_name:
                original_base = base_name.split('_')[0]
            else:
                original_base = base_name
            
            # Accept both 14-digit (new) and 13-digit (legacy) formats
            if (len(original_base) == 14 or len(original_base) == 13) and original_base.isdigit():
                time_suffix = datetime.now().strftime('%H%M%S')
                return f"{original_base}_{time_suffix}{ext}"
            else:
                return ImageService.generate_filename(1, ext)
                
        except Exception:
            return f"updated_{uuid.uuid4().hex[:12]}{new_ext or '.jpg'}"
    
    @staticmethod
    def validate_image_bytes(image_bytes: bytes) -> Tuple[bool, Optional[str]]:
        """
        Validate that image bytes represent a valid image.
        
        Returns:
            Tuple of (is_valid, error_message)
        """
        try:
            if not image_bytes or len(image_bytes) < 100:
                return False, "Image data is empty or too small"
            
            from PIL import Image
            
            img = Image.open(BytesIO(image_bytes))
            img.verify()
            
            # Re-open to check it's actually readable
            img = Image.open(BytesIO(image_bytes))
            img.load()
            
            return True, None
        except Exception as e:
            return False, str(e)
    
    @staticmethod
    def get_client_image_folder(client) -> str:
        """
        Get the folder path for storing client images.
        Creates the folder if it doesn't exist.
        
        Returns:
            Folder path relative to MEDIA_ROOT like 'adarshimg/{ABCDE12345}/'
        """
        if not client.image_folder_code:
            client.generate_folder_code()
            client.save(update_fields=['image_folder_code', 'image_folder_suffix'])
        
        folder_path = f"adarshimg/{client.image_folder_code}"
        
        full_path = os.path.join(settings.MEDIA_ROOT, folder_path)
        os.makedirs(full_path, exist_ok=True)
        
        return folder_path
    
    @classmethod
    def save_image(
        cls,
        file_content,
        client,
        existing_path: Optional[str] = None,
        batch_counter: int = 1
    ) -> ServiceResult:
        """
        Save an image to the client's folder.
        
        Args:
            file_content: Django uploaded file or ContentFile
            client: Client model instance
            existing_path: Path of existing image (for updates)
            batch_counter: Counter for batch uploads
        
        Returns:
            ServiceResult with saved path in data['path']
        """
        try:
            folder = cls.get_client_image_folder(client)
            
            # Get extension
            if hasattr(file_content, 'name'):
                original_ext = os.path.splitext(file_content.name)[1].lower() or '.jpg'
            else:
                original_ext = '.jpg'
            
            # Generate filename
            if existing_path and existing_path not in ['NOT_FOUND', '', 'PENDING']:
                new_filename = cls.generate_updated_filename(existing_path, original_ext)
                
                # Delete old image
                try:
                    if default_storage.exists(existing_path):
                        default_storage.delete(existing_path)
                except Exception as del_err:
                    pass  # Continue even if delete fails
            else:
                new_filename = cls.generate_filename(batch_counter, original_ext)
            
            file_path = f"{folder}/{new_filename}"
            
            # Save the image
            saved_path = default_storage.save(file_path, file_content)
            
            return ServiceResult(
                success=True,
                message='Image saved successfully',
                data={'path': saved_path, 'filename': new_filename}
            )
            
        except Exception as e:
            # Try fallback name
            try:
                import time
                fallback_name = f"fallback_{int(time.time())}.jpg"
                fallback_path = f"{folder}/{fallback_name}"
                saved_path = default_storage.save(fallback_path, file_content)
                
                return ServiceResult(
                    success=True,
                    message='Image saved with fallback name',
                    data={'path': saved_path, 'filename': fallback_name}
                )
            except Exception:
                return ServiceResult(
                    success=False,
                    message=f'Failed to save image: {str(e)}'
                )
    
    @classmethod
    def delete_image(cls, image_path: str) -> ServiceResult:
        """Delete an image from storage (including its thumbnail if exists)"""
        try:
            if image_path and default_storage.exists(image_path):
                default_storage.delete(image_path)
                
                # Also delete thumbnail if exists
                thumb_path = cls.get_thumbnail_path(image_path)
                if thumb_path and default_storage.exists(thumb_path):
                    default_storage.delete(thumb_path)
                    
                return ServiceResult(success=True, message='Image deleted')
            return ServiceResult(success=True, message='Image not found, nothing to delete')
        except Exception as e:
            return ServiceResult(success=False, message=f'Failed to delete image: {str(e)}')
    
    # ==================== THUMBNAIL OPERATIONS ====================
    
    THUMBNAIL_SIZE = (150, 150)  # Max width x height (maintains aspect ratio)
    THUMBNAIL_SUFFIX = '_thumb'
    
    @classmethod
    def get_thumbnail_path(cls, original_path: str) -> Optional[str]:
        """
        Get the thumbnail path for an original image path.
        
        Args:
            original_path: Path to original image (e.g., 'adarshimg/ABCDE12345/14325123456101.jpg')
            
        Returns:
            Thumbnail path (e.g., 'adarshimg/ABCDE12345/14325123456101_thumb.jpg')
            or None if original_path is invalid
        """
        if not original_path or original_path in ['NOT_FOUND', '', 'PENDING']:
            return None
        
        # Handle PENDING: prefix
        if original_path.startswith('PENDING:'):
            return None
            
        base_name, ext = os.path.splitext(original_path)
        return f"{base_name}{cls.THUMBNAIL_SUFFIX}{ext}"
    
    @classmethod
    def generate_thumbnail(cls, image_bytes: bytes, max_size: tuple = None) -> Optional[bytes]:
        """
        Generate a thumbnail from image bytes.
        
        Args:
            image_bytes: Original image data
            max_size: Optional tuple (width, height) for thumbnail, defaults to THUMBNAIL_SIZE
            
        Returns:
            Thumbnail bytes or None if generation failed
        """
        try:
            from PIL import Image
            
            if not max_size:
                max_size = cls.THUMBNAIL_SIZE
            
            # Open the image
            img = Image.open(BytesIO(image_bytes))
            
            # Convert to RGB if necessary (handles RGBA, palette images)
            if img.mode in ('RGBA', 'LA', 'P'):
                # Create white background for transparent images
                background = Image.new('RGB', img.size, (255, 255, 255))
                if img.mode == 'P':
                    img = img.convert('RGBA')
                background.paste(img, mask=img.split()[-1] if img.mode == 'RGBA' else None)
                img = background
            elif img.mode != 'RGB':
                img = img.convert('RGB')
            
            # Create thumbnail (maintains aspect ratio)
            img.thumbnail(max_size, Image.Resampling.LANCZOS)
            
            # Save to bytes
            output = BytesIO()
            img.save(output, format='JPEG', quality=85, optimize=True)
            output.seek(0)
            
            return output.read()
            
        except Exception as e:
            # Thumbnail generation is non-critical, return None on failure
            return None
    
    @classmethod
    def save_image_with_thumbnail(
        cls,
        image_bytes: bytes,
        client,
        existing_path: Optional[str] = None,
        batch_counter: int = 1,
        original_ext: str = '.jpg'
    ) -> ServiceResult:
        """
        Save an image AND its thumbnail to the client's folder.
        
        This is the preferred method for saving images as it generates
        thumbnails automatically for better frontend performance.
        
        Args:
            image_bytes: Raw image data
            client: Client model instance
            existing_path: Path of existing image (for updates)
            batch_counter: Counter for batch uploads
            original_ext: Original file extension
        
        Returns:
            ServiceResult with saved paths in data:
            - 'path': main image path
            - 'thumb_path': thumbnail path (may be None if thumb generation failed)
            - 'filename': main image filename
        """
        try:
            folder = cls.get_client_image_folder(client)
            
            # Validate extension
            ext = original_ext.lower() if original_ext else '.jpg'
            if not ext.startswith('.'):
                ext = '.' + ext
            if ext not in BaseService.VALID_IMAGE_EXTENSIONS:
                ext = '.jpg'
            
            # Generate filename
            if existing_path and existing_path not in ['NOT_FOUND', '', 'PENDING']:
                new_filename = cls.generate_updated_filename(existing_path, ext)
                
                # Delete old image and its thumbnail
                try:
                    if default_storage.exists(existing_path):
                        default_storage.delete(existing_path)
                    old_thumb = cls.get_thumbnail_path(existing_path)
                    if old_thumb and default_storage.exists(old_thumb):
                        default_storage.delete(old_thumb)
                except Exception:
                    pass  # Continue even if delete fails
            else:
                new_filename = cls.generate_filename(batch_counter, ext)
            
            file_path = f"{folder}/{new_filename}"
            thumb_path = None
            
            # Save main image
            saved_path = default_storage.save(file_path, ContentFile(image_bytes))
            
            # Generate and save thumbnail
            thumb_bytes = cls.generate_thumbnail(image_bytes)
            if thumb_bytes:
                thumb_filename = cls.get_thumbnail_path(new_filename)
                if thumb_filename:
                    thumb_file_path = f"{folder}/{thumb_filename}"
                    thumb_path = default_storage.save(thumb_file_path, ContentFile(thumb_bytes))
            
            return ServiceResult(
                success=True,
                message='Image saved successfully',
                data={
                    'path': saved_path,
                    'thumb_path': thumb_path,
                    'filename': new_filename
                }
            )
            
        except Exception as e:
            # Try fallback name
            try:
                import time as time_module
                fallback_name = f"fallback_{int(time_module.time())}.jpg"
                fallback_path = f"{folder}/{fallback_name}"
                saved_path = default_storage.save(fallback_path, ContentFile(image_bytes))
                
                return ServiceResult(
                    success=True,
                    message='Image saved with fallback name',
                    data={'path': saved_path, 'thumb_path': None, 'filename': fallback_name}
                )
            except Exception:
                return ServiceResult(
                    success=False,
                    message=f'Failed to save image: {str(e)}'
                )
    
    @classmethod
    def ensure_thumbnail_exists(cls, image_path: str) -> Optional[str]:
        """
        Ensure a thumbnail exists for an image. Generate one if missing.
        
        Args:
            image_path: Path to the original image
            
        Returns:
            Thumbnail path or None if unavailable
        """
        if not image_path or image_path in ['NOT_FOUND', '', 'PENDING']:
            return None
        
        if image_path.startswith('PENDING:'):
            return None
            
        thumb_path = cls.get_thumbnail_path(image_path)
        if not thumb_path:
            return None
            
        # Check if thumbnail already exists
        if default_storage.exists(thumb_path):
            return thumb_path
        
        # Try to generate thumbnail from original
        try:
            if default_storage.exists(image_path):
                with default_storage.open(image_path, 'rb') as f:
                    image_bytes = f.read()
                
                thumb_bytes = cls.generate_thumbnail(image_bytes)
                if thumb_bytes:
                    saved_thumb = default_storage.save(thumb_path, ContentFile(thumb_bytes))
                    return saved_thumb
        except Exception:
            pass
        
        return None
