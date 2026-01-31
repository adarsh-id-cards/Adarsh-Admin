from django.core.management.base import BaseCommand
from django.contrib.auth.models import Group, Permission

class Command(BaseCommand):
    help = "Create default roles"

    def handle(self, *args, **kwargs):
        roles = [
            'Super Admin',
            'Admin Staff',
            'Client',
            'Client Staff'
        ]

        for role in roles:
            Group.objects.get_or_create(name=role)

        self.stdout.write(self.style.SUCCESS("Roles created successfully"))
