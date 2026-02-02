from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta
import random

from core.models import User, Client, Staff, IDCardGroup, IDCard, WebsiteSettings, SystemSettings


class Command(BaseCommand):
    help = 'Populates the database with dummy data'

    def handle(self, *args, **options):
        self.stdout.write('Creating dummy data...\n')

        # Create Super Admin
        super_admin, created = User.objects.get_or_create(
            username='superadmin',
            defaults={
                'email': 'superadmin@adarshidcards.com',
                'first_name': 'Super',
                'last_name': 'Admin',
                'phone': '+91 9876543210',
                'role': 'super_admin',
                'is_staff': True,
                'is_superuser': True,
            }
        )
        if created:
            super_admin.set_password('admin123')
            super_admin.save()
            self.stdout.write(self.style.SUCCESS(f'Created Super Admin: {super_admin.username}'))
        else:
            self.stdout.write(f'Super Admin already exists: {super_admin.username}')

        # Create Admin Staff
        admin_staff_data = [
            {'username': 'rajesh_kumar', 'first_name': 'Rajesh', 'last_name': 'Kumar', 'email': 'rajesh@adarshidcards.com', 'phone': '+91 9876543211'},
            {'username': 'priya_sharma', 'first_name': 'Priya', 'last_name': 'Sharma', 'email': 'priya@adarshidcards.com', 'phone': '+91 9876543212'},
            {'username': 'amit_verma', 'first_name': 'Amit', 'last_name': 'Verma', 'email': 'amit@adarshidcards.com', 'phone': '+91 9876543213'},
        ]

        for staff_data in admin_staff_data:
            user, created = User.objects.get_or_create(
                username=staff_data['username'],
                defaults={
                    'email': staff_data['email'],
                    'first_name': staff_data['first_name'],
                    'last_name': staff_data['last_name'],
                    'phone': staff_data['phone'],
                    'role': 'admin_staff',
                    'is_staff': True,
                }
            )
            if created:
                user.set_password('staff123')
                user.save()
                Staff.objects.create(
                    user=user,
                    staff_type='admin_staff',
                    department='Operations',
                    designation='Admin Executive'
                )
                self.stdout.write(self.style.SUCCESS(f'Created Admin Staff: {user.get_full_name()}'))

        # Create Clients
        clients_data = [
            {
                'username': 'client1',
                'name': 'John Anderson',
                'email': 'john.anderson@email.com',
                'phone': '+91 9811111111',
                'first_name': 'John',
                'last_name': 'Anderson',
                'address': '123 Main Street, Downtown Area',
            },
            {
                'username': 'client2',
                'name': 'Sarah Mitchell',
                'email': 'sarah.mitchell@email.com',
                'phone': '+91 9822222222',
                'first_name': 'Sarah',
                'last_name': 'Mitchell',
                'address': '45 Park Avenue, Business District',
            },
            {
                'username': 'client3',
                'name': 'Michael Davis',
                'email': 'michael.davis@email.com',
                'phone': '+91 9833333333',
                'first_name': 'Michael',
                'last_name': 'Davis',
                'address': '78 Oak Road, Industrial Zone',
            },
            {
                'username': 'client4',
                'name': 'Emily Thompson',
                'email': 'emily.thompson@email.com',
                'phone': '+91 9844444444',
                'first_name': 'Emily',
                'last_name': 'Thompson',
                'address': '200 Elm Street, Residential Area',
            },
            {
                'username': 'client5',
                'name': 'Robert Wilson',
                'email': 'robert.wilson@email.com',
                'phone': '+91 9855555555',
                'first_name': 'Robert',
                'last_name': 'Wilson',
                'address': '15 Cedar Lane, Suburb',
            },
        ]

        clients = []
        for client_data in clients_data:
            user, created = User.objects.get_or_create(
                username=client_data['username'],
                defaults={
                    'email': client_data['email'],
                    'first_name': client_data['first_name'],
                    'last_name': client_data['last_name'],
                    'phone': client_data['phone'],
                    'role': 'client',
                }
            )
            if created:
                user.set_password('client123')
                user.save()
                client = Client.objects.create(
                    user=user,
                    name=client_data['name'],
                    address=client_data['address'],
                    status='active',
                    # All permissions enabled by default
                    perm_staff_list=True,
                    perm_staff_add=True,
                    perm_staff_edit=True,
                    perm_staff_delete=True,
                    perm_staff_status=True,
                    perm_idcard_setting_list=True,
                    perm_idcard_setting_add=True,
                    perm_idcard_setting_edit=True,
                    perm_idcard_setting_delete=True,
                    perm_idcard_setting_status=True,
                    perm_idcard_pending_list=True,
                    perm_idcard_verified_list=True,
                    perm_idcard_pool_list=True,
                    perm_idcard_approved_list=True,
                    perm_idcard_download_list=True,
                    perm_idcard_reprint_list=True,
                    perm_idcard_add=True,
                    perm_idcard_edit=True,
                    perm_idcard_delete=True,
                    perm_idcard_info=True,
                    perm_idcard_approve=True,
                    perm_idcard_verify=True,
                    perm_idcard_bulk_upload=True,
                    perm_idcard_bulk_download=True,
                    perm_idcard_created_at=True,
                    perm_idcard_updated_at=True,
                    perm_idcard_delete_from_pool=True,
                    perm_delete_all_idcard=True,
                    perm_reupload_idcard_image=True,
                    perm_idcard_retrieve=True,
                )
                clients.append(client)
                self.stdout.write(self.style.SUCCESS(f'Created Client: {client.name}'))
            else:
                try:
                    clients.append(user.client_profile)
                except:
                    pass

        # Get all clients for creating groups
        all_clients = Client.objects.all()

        # Create ID Card Groups for each client
        group_templates = [
            {'name': 'Employee ID Cards', 'description': 'Standard employee identification cards'},
            {'name': 'Visitor Passes', 'description': 'Temporary visitor identification passes'},
            {'name': 'VIP Access Cards', 'description': 'Special access cards for VIP personnel'},
            {'name': 'Student ID Cards', 'description': 'Student identification cards'},
            {'name': 'Staff ID Cards', 'description': 'Staff identification cards'},
        ]

        id_groups = []
        for client in all_clients:
            # Each client gets 2-3 random groups
            selected_groups = random.sample(group_templates, k=random.randint(2, 3))
            for group_data in selected_groups:
                group, created = IDCardGroup.objects.get_or_create(
                    client=client,
                    name=group_data['name'],
                    defaults={
                        'description': group_data['description'],
                        'is_active': True
                    }
                )
                if created:
                    id_groups.append(group)
                    self.stdout.write(self.style.SUCCESS(f'Created ID Group: {group.name} for {client.name}'))

        # Get all groups
        all_groups = IDCardGroup.objects.all()

        # Create ID Cards
        employee_names = [
            'Arun Patel', 'Neha Gupta', 'Sanjay Kumar', 'Meera Shah', 'Rohit Joshi',
            'Anjali Verma', 'Deepak Singh', 'Kavita Nair', 'Manish Tiwari', 'Pooja Reddy',
            'Suresh Menon', 'Divya Sharma', 'Karthik Iyer', 'Rekha Pillai', 'Vivek Agarwal',
            'Ananya Das', 'Nikhil Saxena', 'Shreya Chatterjee', 'Arjun Malhotra', 'Priyanka Jain',
            'Gaurav Bose', 'Swati Kapoor', 'Ravi Shankar', 'Nandini Rao', 'Ajay Khanna',
            'Sneha Mishra', 'Varun Desai', 'Isha Bansal', 'Ashwin Hegde', 'Ritika Sinha',
        ]

        designations = [
            'Software Engineer', 'Senior Developer', 'Project Manager', 'HR Executive',
            'Accountant', 'Marketing Manager', 'Sales Executive', 'Technical Lead',
            'Business Analyst', 'Quality Analyst', 'DevOps Engineer', 'UI/UX Designer',
            'Teacher', 'Nurse', 'Doctor', 'Administrative Officer', 'Receptionist',
        ]

        departments = [
            'Engineering', 'Human Resources', 'Finance', 'Marketing', 'Sales',
            'Operations', 'IT', 'Administration', 'Research', 'Customer Support',
        ]

        blood_groups = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-']
        statuses = ['pending', 'approved', 'printed', 'delivered']

        for group in all_groups:
            # Each group gets 5-10 ID cards
            num_cards = random.randint(5, 10)
            selected_names = random.sample(employee_names, k=min(num_cards, len(employee_names)))
            
            for i, name in enumerate(selected_names):
                emp_id = f"EMP{group.client.id:02d}{group.id:02d}{i+1:03d}"
                
                card, created = IDCard.objects.get_or_create(
                    group=group,
                    employee_id=emp_id,
                    defaults={
                        'employee_name': name,
                        'designation': random.choice(designations),
                        'department': random.choice(departments),
                        'blood_group': random.choice(blood_groups),
                        'phone': f'+91 98{random.randint(10000000, 99999999)}',
                        'email': f"{name.lower().replace(' ', '.')}@{group.client.user.username}.com",
                        'status': random.choice(statuses),
                        'valid_from': timezone.now().date(),
                        'valid_until': (timezone.now() + timedelta(days=365)).date(),
                    }
                )
                if created:
                    self.stdout.write(f'Created ID Card: {name} ({emp_id})')

        # Create Client Staff
        client_staff_data = [
            {'first_name': 'Ajay', 'last_name': 'Thakur'},
            {'first_name': 'Nisha', 'last_name': 'Goel'},
            {'first_name': 'Prakash', 'last_name': 'Yadav'},
            {'first_name': 'Sunanda', 'last_name': 'Bhat'},
            {'first_name': 'Vinod', 'last_name': 'Pillai'},
        ]

        for i, client in enumerate(all_clients[:5]):
            staff_info = client_staff_data[i % len(client_staff_data)]
            username = f"{staff_info['first_name'].lower()}_{client.user.username}"
            
            user, created = User.objects.get_or_create(
                username=username,
                defaults={
                    'email': f"{staff_info['first_name'].lower()}@{client.user.username}.com",
                    'first_name': staff_info['first_name'],
                    'last_name': staff_info['last_name'],
                    'phone': f'+91 97{random.randint(10000000, 99999999)}',
                    'role': 'client_staff',
                }
            )
            if created:
                user.set_password('clientstaff123')
                user.save()
                Staff.objects.create(
                    user=user,
                    staff_type='client_staff',
                    client=client,
                    department='Card Management',
                    designation='ID Card Coordinator'
                )
                self.stdout.write(self.style.SUCCESS(f'Created Client Staff: {user.get_full_name()} for {client.name}'))

        # Create Website Settings
        WebsiteSettings.objects.get_or_create(
            id=1,
            defaults={
                'site_name': 'Adarsh ID Cards',
                'contact_email': 'info@adarshidcards.com',
                'contact_phone': '+91 9876543210',
                'address': '123 Business Park, Sector 15, Noida, Uttar Pradesh - 201301',
                'about_text': 'Professional ID Card Solutions for businesses and organizations.',
                'facebook_url': 'https://facebook.com/adarshidcards',
                'twitter_url': 'https://twitter.com/adarshidcards',
                'instagram_url': 'https://instagram.com/adarshidcards',
                'linkedin_url': 'https://linkedin.com/company/adarshidcards',
            }
        )
        self.stdout.write(self.style.SUCCESS('Created Website Settings'))

        # Create System Settings
        system_settings = [
            {'key': 'maintenance_mode', 'value': 'false', 'description': 'Enable/disable maintenance mode'},
            {'key': 'allow_registration', 'value': 'true', 'description': 'Allow new user registrations'},
            {'key': 'default_card_validity_days', 'value': '365', 'description': 'Default validity period for ID cards'},
            {'key': 'max_cards_per_group', 'value': '500', 'description': 'Maximum cards allowed per group'},
            {'key': 'enable_email_notifications', 'value': 'true', 'description': 'Enable email notifications'},
            {'key': 'enable_sms_notifications', 'value': 'false', 'description': 'Enable SMS notifications'},
        ]
        for setting in system_settings:
            SystemSettings.objects.get_or_create(
                key=setting['key'],
                defaults={'value': setting['value'], 'description': setting['description']}
            )
        self.stdout.write(self.style.SUCCESS('Created System Settings'))

        # Summary
        self.stdout.write('\n' + '='*50)
        self.stdout.write(self.style.SUCCESS('DUMMY DATA CREATION COMPLETE!'))
        self.stdout.write('='*50)
        self.stdout.write(f'Users: {User.objects.count()}')
        self.stdout.write(f'Clients: {Client.objects.count()}')
        self.stdout.write(f'Staff: {Staff.objects.count()}')
        self.stdout.write(f'ID Card Groups: {IDCardGroup.objects.count()}')
        self.stdout.write(f'ID Cards: {IDCard.objects.count()}')
        self.stdout.write('='*50)
        self.stdout.write('\nLogin Credentials:')
        self.stdout.write('  Super Admin: superadmin / admin123')
        self.stdout.write('  Admin Staff: rajesh_kumar / staff123')
        self.stdout.write('  Client: techcorp / client123')
        self.stdout.write('='*50)
