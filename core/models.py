from django.contrib.auth.models import AbstractUser
from django.db import models

class User(AbstractUser):
    """
    Custom user model for future extensibility
    """
    phone = models.CharField(max_length=15, blank=True, null=True)
    is_client = models.BooleanField(default=False)

    def __str__(self):
        return self.username
