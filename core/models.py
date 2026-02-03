from django.contrib.auth.models import AbstractUser
from django.db import models
import uuid


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
    profile_image = models.ImageField(upload_to='profiles/', blank=True, null=True)
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
    
    # Basic Information
    name = models.CharField(max_length=200)
    photo = models.ImageField(upload_to='client_photos/', blank=True, null=True)
    
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
