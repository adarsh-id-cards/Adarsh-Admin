from django.core.management.base import BaseCommand
from core.models import IDCardTable, IDCardGroup


class Command(BaseCommand):
    help = 'Create sample ID Card Tables for testing'

    def handle(self, *args, **options):
        # Get first 10 groups
        groups = IDCardGroup.objects.all()[:10]
        
        created_count = 0
        for group in groups:
            # Check if tables already exist for this group
            if IDCardTable.objects.filter(group=group).exists():
                self.stdout.write(f'Skipping {group.name} - already has tables')
                continue
            
            # Create 2 tables per group
            for j in range(2):
                fields = [
                    {'name': 'Student Name', 'type': 'text', 'order': 0},
                    {'name': 'Roll Number', 'type': 'text', 'order': 1},
                    {'name': 'Class', 'type': 'text', 'order': 2},
                    {'name': 'Date of Birth', 'type': 'date', 'order': 3},
                    {'name': 'Photo', 'type': 'image', 'order': 4},
                ]
                table = IDCardTable.objects.create(
                    group=group,
                    name=f'{group.name} - Layout {j+1}',
                    fields=fields,
                    is_active=(j == 0)
                )
                created_count += 1
                self.stdout.write(f'Created: {table.name}')
        
        self.stdout.write(self.style.SUCCESS(f'Created {created_count} tables. Total: {IDCardTable.objects.count()}'))
