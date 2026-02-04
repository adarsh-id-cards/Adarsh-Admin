from django.contrib.auth.models import AbstractUser
from django.db import models
import uuid
import random
import string
import re
import os
import shutil


def generate_folder_code_from_name(name):
    """
    Generate a 5-character code from client name:
    - If 3+ words: use first char of each word (up to 5)
    - If 2 or fewer words: use first 2-3 chars of each word
    Always returns exactly 5 uppercase characters (padded with X if needed)
    """
    if not name:
        return 'XXXXX'
    
    # Remove special characters and split into words
    words = re.sub(r'[^a-zA-Z0-9\s]', '', name).split()
    words = [w for w in words if w]  # Remove empty strings
    
    if not words:
        return 'XXXXX'
    
    code = ''
    if len(words) >= 3:
        # 3+ words: use first char of each word
        for word in words[:5]:
            if word:
                code += word[0].upper()
    elif len(words) == 2:
        # 2 words: use first 2-3 chars of each
        code = words[0][:3].upper() + words[1][:2].upper()
    else:
        # 1 word: use first 5 chars
        code = words[0][:5].upper()
    
    # Ensure exactly 5 characters
    code = code[:5].ljust(5, 'X')
    return code


def generate_unique_suffix():
    """Generate 5 random alphanumeric characters"""
    return ''.join(random.choices(string.ascii_uppercase + string.digits, k=5))


class User(AbstractUser):
    """
    Custom user model with role support
    """
    ROLE_CHOICES = [
        ('super_admin', 'Super Admin'),
        ('admin_staff', 'Admin Staff'),
        ('client', 'Client'),
        ('client_staff', 'Client Staff'),
    ]
    
    phone = models.CharField(max_length=15, blank=True, null=True)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='client')
    profile_image = models.ImageField(upload_to='staff_imgs/', blank=True, null=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.username} ({self.get_role_display()})"
    
    @property
    def is_super_admin(self):
        return self.role == 'super_admin'
    
    @property
    def is_admin_staff(self):
        return self.role == 'admin_staff'
    
    @property
    def is_client(self):
        return self.role == 'client'
    
    @property
    def is_client_staff(self):
        return self.role == 'client_staff'


class Client(models.Model):
    """
    Client model - managed by principals/management
    """
    STATUS_CHOICES = [
        ('active', 'Active'),
        ('inactive', 'Inactive'),
        ('suspended', 'Suspended'),
    ]
    
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='client_profile')
    
    # Unique folder ID for storing images (never changes even if client name changes)
    image_folder_uuid = models.UUIDField(default=uuid.uuid4, editable=False)
    
    # Image folder code: 5 chars from name + 5 unique chars = 10 chars max
    # Format: {ABCDE}{12345} where ABCDE is from client name, 12345 is unique suffix
    image_folder_code = models.CharField(max_length=10, blank=True, null=True, unique=True)
    # Store the unique suffix separately (never changes)
    image_folder_suffix = models.CharField(max_length=5, blank=True, null=True)
    
    # Basic Information
    name = models.CharField(max_length=200)
    photo = models.ImageField(upload_to='clients_imgs/', blank=True, null=True)
    
    # Address
    address = models.TextField(blank=True, null=True)
    city = models.CharField(max_length=100, blank=True, null=True)
    state = models.CharField(max_length=100, blank=True, null=True)
    pincode = models.CharField(max_length=10, blank=True, null=True)
    
    # Staff Permissions (all default to False)
    perm_staff_list = models.BooleanField(default=False)
    perm_staff_add = models.BooleanField(default=False)
    perm_staff_edit = models.BooleanField(default=False)
    perm_staff_delete = models.BooleanField(default=False)
    perm_staff_status = models.BooleanField(default=False)
    
    # ID Card Setting Permissions (all default to False)
    perm_idcard_setting_list = models.BooleanField(default=False)
    perm_idcard_setting_add = models.BooleanField(default=False)
    perm_idcard_setting_edit = models.BooleanField(default=False)
    perm_idcard_setting_delete = models.BooleanField(default=False)
    perm_idcard_setting_status = models.BooleanField(default=False)
    
    # ID Card List Permissions (all default to False)
    perm_idcard_pending_list = models.BooleanField(default=False)
    perm_idcard_verified_list = models.BooleanField(default=False)
    perm_idcard_pool_list = models.BooleanField(default=False)
    perm_idcard_approved_list = models.BooleanField(default=False)
    perm_idcard_download_list = models.BooleanField(default=False)
    perm_idcard_reprint_list = models.BooleanField(default=False)
    
    # ID Card Action Permissions (all default to False)
    perm_idcard_add = models.BooleanField(default=False)
    perm_idcard_edit = models.BooleanField(default=False)
    perm_idcard_delete = models.BooleanField(default=False)
    perm_idcard_info = models.BooleanField(default=False)
    perm_idcard_approve = models.BooleanField(default=False)
    perm_idcard_verify = models.BooleanField(default=False)
    perm_idcard_bulk_upload = models.BooleanField(default=False)
    perm_idcard_bulk_download = models.BooleanField(default=False)
    perm_idcard_created_at = models.BooleanField(default=False)
    perm_idcard_updated_at = models.BooleanField(default=False)
    perm_idcard_delete_from_pool = models.BooleanField(default=False)
    perm_delete_all_idcard = models.BooleanField(default=False)
    perm_reupload_idcard_image = models.BooleanField(default=False)
    perm_idcard_retrieve = models.BooleanField(default=False)
    
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name
    
    def generate_folder_code(self):
        """Generate and set the image folder code based on client name"""
        name_part = generate_folder_code_from_name(self.name)
        
        # Generate unique suffix if not already set
        if not self.image_folder_suffix:
            self.image_folder_suffix = generate_unique_suffix()
        
        self.image_folder_code = f"{name_part}{self.image_folder_suffix}"
        return self.image_folder_code
    
    def get_image_folder_path(self):
        """Get the full folder path for this client's images"""
        if not self.image_folder_code:
            self.generate_folder_code()
            self.save(update_fields=['image_folder_code', 'image_folder_suffix'])
        return f"adarshimg/{self.image_folder_code}"
    
    def ensure_image_folder_exists(self):
        """Create the image folder if it doesn't exist"""
        from django.conf import settings
        folder_path = os.path.join(settings.MEDIA_ROOT, self.get_image_folder_path())
        os.makedirs(folder_path, exist_ok=True)
        return folder_path
    
    def rename_image_folder(self, old_name):
        """
        Rename the image folder when client name changes.
        Only updates the first 5 chars (name part), suffix stays same.
        """
        from django.conf import settings
        
        if not self.image_folder_suffix:
            # No folder exists yet
            return
        
        old_code = self.image_folder_code
        old_folder_path = os.path.join(settings.MEDIA_ROOT, f"adarshimg/{old_code}")
        
        # Generate new code with updated name
        new_name_part = generate_folder_code_from_name(self.name)
        new_code = f"{new_name_part}{self.image_folder_suffix}"
        new_folder_path = os.path.join(settings.MEDIA_ROOT, f"adarshimg/{new_code}")
        
        # Rename folder if it exists and codes are different
        if old_code != new_code and os.path.exists(old_folder_path):
            try:
                os.rename(old_folder_path, new_folder_path)
                print(f"Renamed folder: {old_code} -> {new_code}")
            except Exception as e:
                print(f"Warning: Could not rename folder {old_code} to {new_code}: {e}")
        
        self.image_folder_code = new_code
    
    def delete_image_folder(self):
        """Delete the entire image folder and all contents"""
        from django.conf import settings
        
        if not self.image_folder_code:
            return
        
        folder_path = os.path.join(settings.MEDIA_ROOT, f"adarshimg/{self.image_folder_code}")
        if os.path.exists(folder_path):
            try:
                shutil.rmtree(folder_path)
                print(f"Deleted folder: {self.image_folder_code}")
            except Exception as e:
                print(f"Warning: Could not delete folder {self.image_folder_code}: {e}")
    
    def save(self, *args, **kwargs):
        # Check if this is an update and name changed
        if self.pk:
            try:
                old_instance = Client.objects.get(pk=self.pk)
                if old_instance.name != self.name and old_instance.image_folder_code:
                    self.rename_image_folder(old_instance.name)
            except Client.DoesNotExist:
                pass
        
        # Generate folder code if not set
        if not self.image_folder_code:
            self.generate_folder_code()
        
        super().save(*args, **kwargs)
    
    def delete(self, *args, **kwargs):
        # Delete image folder when client is deleted
        self.delete_image_folder()
        super().delete(*args, **kwargs)
    
    class Meta:
        ordering = ['-created_at']


class Staff(models.Model):
    """
    Staff model - can be admin staff or client staff
    """
    STAFF_TYPE_CHOICES = [
        ('admin_staff', 'Admin Staff'),
        ('client_staff', 'Client Staff'),
    ]
    
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='staff_profile')
    staff_type = models.CharField(max_length=20, choices=STAFF_TYPE_CHOICES)
    client = models.ForeignKey(Client, on_delete=models.CASCADE, null=True, blank=True, related_name='staff_members')
    address = models.TextField(blank=True, null=True)
    department = models.CharField(max_length=100, blank=True, null=True)
    designation = models.CharField(max_length=100, blank=True, null=True)
    
    # Staff Permissions
    perm_staff_list = models.BooleanField(default=False)
    perm_staff_add = models.BooleanField(default=False)
    perm_staff_edit = models.BooleanField(default=False)
    perm_staff_delete = models.BooleanField(default=False)
    perm_staff_status = models.BooleanField(default=False)
    
    # ID Card Setting Permissions
    perm_idcard_setting_list = models.BooleanField(default=False)
    perm_idcard_setting_add = models.BooleanField(default=False)
    perm_idcard_setting_edit = models.BooleanField(default=False)
    perm_idcard_setting_delete = models.BooleanField(default=False)
    perm_idcard_setting_status = models.BooleanField(default=False)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.user.get_full_name()} - {self.get_staff_type_display()}"
    
    class Meta:
        verbose_name_plural = "Staff"
        ordering = ['-created_at']


class IDCardGroup(models.Model):
    """
    ID Card Group/Template for a client
    """
    client = models.ForeignKey(Client, on_delete=models.CASCADE, related_name='id_card_groups')
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True, null=True)
    template_front = models.ImageField(upload_to='id_templates/', blank=True, null=True)
    template_back = models.ImageField(upload_to='id_templates/', blank=True, null=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.name} - {self.client.name}"
    
    def delete_all_table_images(self):
        """Delete all images from all tables in this group"""
        for table in self.tables.all():
            table.delete_all_card_images()
    
    def delete(self, *args, **kwargs):
        # Delete all images before deleting group
        self.delete_all_table_images()
        super().delete(*args, **kwargs)
    
    class Meta:
        ordering = ['-created_at']


class IDCardTable(models.Model):
    """
    ID Card Table - stores field configuration for a group
    Client can have max 20 fields of any type
    """
    FIELD_TYPE_CHOICES = [
        ('text', 'Text'),
        ('number', 'Number'),
        ('date', 'Date'),
        ('email', 'Email'),
        ('image', 'Image'),
        ('textarea', 'Textarea'),
    ]
    
    group = models.ForeignKey(IDCardGroup, on_delete=models.CASCADE, related_name='tables')
    name = models.CharField(max_length=200)
    fields = models.JSONField(default=list, help_text='List of field configurations: [{name, type, order}]')
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.name} - {self.group.name}"
    
    def has_image_fields(self):
        """Check if this table has any image fields"""
        return any(f.get('type') == 'image' or f.get('name', '').upper() == 'PHOTO' for f in self.fields)
    
    def delete_all_card_images(self):
        """Delete all images associated with cards in this table"""
        from django.core.files.storage import default_storage
        
        for card in self.id_cards.all():
            card.delete_images()
    
    def delete(self, *args, **kwargs):
        # Delete all card images before deleting table
        self.delete_all_card_images()
        super().delete(*args, **kwargs)
    
    class Meta:
        ordering = ['-created_at']
    
    def clean(self):
        from django.core.exceptions import ValidationError
        if len(self.fields) > 20:
            raise ValidationError('Maximum 20 fields allowed per table.')


class IDCard(models.Model):
    """
    Individual ID Card - linked to a specific table within a group
    """
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('verified', 'Verified'),
        ('pool', 'In Pool'),
        ('approved', 'Approved'),
        ('download', 'Downloaded'),
        ('reprint', 'Reprint'),
    ]
    
    table = models.ForeignKey(IDCardTable, on_delete=models.CASCADE, related_name='id_cards')
    # Dynamic field data stored as JSON (based on table's field configuration)
    field_data = models.JSONField(default=dict, help_text='Dynamic field values based on table fields')
    # Common fields
    photo = models.ImageField(upload_to='id_photos/', blank=True, null=True)
    # Original photo name from Excel (for matching during image reupload)
    original_photo_name = models.CharField(max_length=255, blank=True, null=True, help_text='Original photo name from Excel for matching')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        # Try to get a name field from field_data
        name = self.field_data.get('name', self.field_data.get('Name', f'Card #{self.id}'))
        return f"{name} - {self.table.name}"
    
    @property
    def group(self):
        """Get the group this card belongs to via table"""
        return self.table.group
    
    @property
    def client(self):
        """Get the client this card belongs to via table -> group"""
        return self.table.group.client
    
    def delete_images(self):
        """Delete all image files associated with this card"""
        from django.core.files.storage import default_storage
        
        # Delete images from field_data
        if self.field_data:
            for field_name, value in self.field_data.items():
                if value and isinstance(value, str) and value not in ['NOT_FOUND', '']:
                    # Check if it looks like an image path
                    if 'adarshimg/' in value or 'id_card_images/' in value:
                        try:
                            if default_storage.exists(value):
                                default_storage.delete(value)
                                print(f"Deleted image: {value}")
                        except Exception as e:
                            print(f"Warning: Could not delete image {value}: {e}")
        
        # Delete legacy photo field if exists
        if self.photo:
            try:
                if default_storage.exists(self.photo.name):
                    default_storage.delete(self.photo.name)
                    print(f"Deleted photo: {self.photo.name}")
            except Exception as e:
                print(f"Warning: Could not delete photo: {e}")
    
    def delete(self, *args, **kwargs):
        # Delete images before deleting card
        self.delete_images()
        super().delete(*args, **kwargs)
    
    class Meta:
        ordering = ['-created_at']


class WebsiteSettings(models.Model):
    """
    Website/CMS Settings
    """
    site_name = models.CharField(max_length=200, default='Adarsh ID Cards')
    site_logo = models.ImageField(upload_to='site/', blank=True, null=True)
    site_favicon = models.ImageField(upload_to='site/', blank=True, null=True)
    contact_email = models.EmailField(blank=True, null=True)
    contact_phone = models.CharField(max_length=15, blank=True, null=True)
    address = models.TextField(blank=True, null=True)
    about_text = models.TextField(blank=True, null=True)
    facebook_url = models.URLField(blank=True, null=True)
    twitter_url = models.URLField(blank=True, null=True)
    instagram_url = models.URLField(blank=True, null=True)
    linkedin_url = models.URLField(blank=True, null=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.site_name
    
    class Meta:
        verbose_name = "Website Settings"
        verbose_name_plural = "Website Settings"


class SystemSettings(models.Model):
    """
    System/Application Settings
    """
    key = models.CharField(max_length=100, unique=True)
    value = models.TextField()
    description = models.CharField(max_length=255, blank=True, null=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.key
    
    class Meta:
        verbose_name = "System Setting"
        verbose_name_plural = "System Settings"
