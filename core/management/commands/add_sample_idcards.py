from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta, date
import random

from core.models import Client, IDCardGroup, IDCardTable, IDCard


class Command(BaseCommand):
    help = 'Adds sample ID Card Tables and ID Cards with data for active clients'

    def handle(self, *args, **options):
        self.stdout.write('Adding sample ID Card data...\n')

        # Get all active clients
        active_clients = Client.objects.filter(status='active')
        
        if not active_clients.exists():
            self.stdout.write(self.style.WARNING('No active clients found. Please create some clients first.'))
            return

        # Sample data for Student List
        student_names = [
            'Aarav Sharma', 'Vivaan Patel', 'Aditya Kumar', 'Vihaan Singh', 'Arjun Gupta',
            'Reyansh Verma', 'Ayaan Reddy', 'Atharva Joshi', 'Krishna Nair', 'Ishaan Menon',
            'Ananya Desai', 'Diya Iyer', 'Priya Bose', 'Aadhya Rao', 'Kavya Pillai',
            'Saanvi Das', 'Myra Saxena', 'Aanya Tiwari', 'Pari Agarwal', 'Sara Khan',
            'Rudra Chauhan', 'Kabir Mishra', 'Shaurya Dubey', 'Dhruv Pandey', 'Harsh Yadav',
        ]

        student_classes = ['Class 1', 'Class 2', 'Class 3', 'Class 4', 'Class 5', 
                          'Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10',
                          'Class 11 Science', 'Class 11 Commerce', 'Class 12 Science', 'Class 12 Commerce']
        
        sections = ['A', 'B', 'C', 'D']
        blood_groups = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-']
        
        # Sample data for Staff List
        staff_names = [
            'Dr. Ramesh Kumar', 'Sunita Sharma', 'Anil Kapoor', 'Meena Devi', 'Rajendra Singh',
            'Kavita Joshi', 'Suresh Nair', 'Geeta Verma', 'Prakash Gupta', 'Anjali Reddy',
            'Vinod Patel', 'Rekha Iyer', 'Sanjay Tiwari', 'Padma Rao', 'Ashok Menon',
        ]
        
        designations = [
            'Principal', 'Vice Principal', 'Class Teacher', 'Subject Teacher', 'Lab Assistant',
            'Librarian', 'Physical Education Teacher', 'Art Teacher', 'Music Teacher',
            'Administrative Officer', 'Accountant', 'Receptionist', 'Security Guard', 'Peon'
        ]
        
        departments = [
            'Administration', 'Science', 'Mathematics', 'English', 'Hindi', 
            'Social Studies', 'Computer Science', 'Library', 'Sports', 'Finance'
        ]

        # Status distribution for cards
        statuses = ['pending', 'verified', 'pool', 'approved', 'download']

        for client in active_clients:
            self.stdout.write(f'\nProcessing client: {client.name}')
            
            # Get or create an ID Card Group for this client
            group, group_created = IDCardGroup.objects.get_or_create(
                client=client,
                name='Default Group',
                defaults={
                    'description': f'Default ID Card Group for {client.name}',
                    'is_active': True
                }
            )
            if group_created:
                self.stdout.write(self.style.SUCCESS(f'  Created ID Card Group: {group.name}'))
            else:
                self.stdout.write(f'  Using existing group: {group.name}')

            # ===== Create Student List Table =====
            student_fields = [
                {'name': 'Student Name', 'type': 'text', 'order': 1},
                {'name': 'Roll No', 'type': 'number', 'order': 2},
                {'name': 'Class', 'type': 'text', 'order': 3},
                {'name': 'Section', 'type': 'text', 'order': 4},
                {'name': 'Date of Birth', 'type': 'date', 'order': 5},
                {'name': 'Father Name', 'type': 'text', 'order': 6},
                {'name': 'Mother Name', 'type': 'text', 'order': 7},
                {'name': 'Blood Group', 'type': 'text', 'order': 8},
                {'name': 'Phone', 'type': 'text', 'order': 9},
                {'name': 'Address', 'type': 'textarea', 'order': 10},
            ]
            
            student_table, table_created = IDCardTable.objects.get_or_create(
                group=group,
                name='Student List',
                defaults={
                    'fields': student_fields,
                    'is_active': True
                }
            )
            
            if table_created:
                self.stdout.write(self.style.SUCCESS(f'  Created Table: Student List'))
                
                # Add 15 sample students
                selected_students = random.sample(student_names, k=min(15, len(student_names)))
                for i, name in enumerate(selected_students):
                    roll_no = 1001 + i
                    student_class = random.choice(student_classes)
                    section = random.choice(sections)
                    
                    # Generate realistic dates
                    birth_year = random.randint(2008, 2018)
                    birth_month = random.randint(1, 12)
                    birth_day = random.randint(1, 28)
                    
                    field_data = {
                        'Student Name': name,
                        'Roll No': str(roll_no),
                        'Class': student_class,
                        'Section': section,
                        'Date of Birth': f'{birth_year}-{birth_month:02d}-{birth_day:02d}',
                        'Father Name': f'Mr. {name.split()[0]} Sr.',
                        'Mother Name': f'Mrs. {name.split()[0]}',
                        'Blood Group': random.choice(blood_groups),
                        'Phone': f'+91 98{random.randint(10000000, 99999999)}',
                        'Address': f'{random.randint(1, 500)}, {random.choice(["Sector", "Block", "Colony"])} {random.randint(1, 50)}, {random.choice(["Delhi", "Noida", "Gurgaon", "Ghaziabad"])}',
                    }
                    
                    IDCard.objects.create(
                        table=student_table,
                        field_data=field_data,
                        status=random.choice(statuses)
                    )
                self.stdout.write(self.style.SUCCESS(f'    Added 15 student ID cards'))
            else:
                self.stdout.write(f'  Table already exists: Student List ({student_table.id_cards.count()} cards)')

            # ===== Create Staff List Table =====
            staff_fields = [
                {'name': 'Staff Name', 'type': 'text', 'order': 1},
                {'name': 'Employee ID', 'type': 'text', 'order': 2},
                {'name': 'Designation', 'type': 'text', 'order': 3},
                {'name': 'Department', 'type': 'text', 'order': 4},
                {'name': 'Date of Joining', 'type': 'date', 'order': 5},
                {'name': 'Email', 'type': 'email', 'order': 6},
                {'name': 'Phone', 'type': 'text', 'order': 7},
                {'name': 'Blood Group', 'type': 'text', 'order': 8},
                {'name': 'Emergency Contact', 'type': 'text', 'order': 9},
                {'name': 'Address', 'type': 'textarea', 'order': 10},
            ]
            
            staff_table, table_created = IDCardTable.objects.get_or_create(
                group=group,
                name='Staff List',
                defaults={
                    'fields': staff_fields,
                    'is_active': True
                }
            )
            
            if table_created:
                self.stdout.write(self.style.SUCCESS(f'  Created Table: Staff List'))
                
                # Add 10 sample staff
                selected_staff = random.sample(staff_names, k=min(10, len(staff_names)))
                for i, name in enumerate(selected_staff):
                    emp_id = f'EMP{client.id:02d}{(i+1):04d}'
                    designation = random.choice(designations)
                    department = random.choice(departments)
                    
                    # Generate realistic joining dates
                    join_year = random.randint(2015, 2024)
                    join_month = random.randint(1, 12)
                    join_day = random.randint(1, 28)
                    
                    email_name = name.lower().replace(' ', '.').replace('dr.', '').strip('.')
                    
                    field_data = {
                        'Staff Name': name,
                        'Employee ID': emp_id,
                        'Designation': designation,
                        'Department': department,
                        'Date of Joining': f'{join_year}-{join_month:02d}-{join_day:02d}',
                        'Email': f'{email_name}@school.edu.in',
                        'Phone': f'+91 99{random.randint(10000000, 99999999)}',
                        'Blood Group': random.choice(blood_groups),
                        'Emergency Contact': f'+91 98{random.randint(10000000, 99999999)}',
                        'Address': f'{random.randint(1, 200)}, {random.choice(["MG Road", "Station Road", "Gandhi Nagar", "Civil Lines"])}, {random.choice(["Delhi", "Noida", "Gurgaon", "Faridabad"])}',
                    }
                    
                    IDCard.objects.create(
                        table=staff_table,
                        field_data=field_data,
                        status=random.choice(statuses)
                    )
                self.stdout.write(self.style.SUCCESS(f'    Added 10 staff ID cards'))
            else:
                self.stdout.write(f'  Table already exists: Staff List ({staff_table.id_cards.count()} cards)')

            # ===== Create Visitor Pass Table =====
            visitor_fields = [
                {'name': 'Visitor Name', 'type': 'text', 'order': 1},
                {'name': 'Purpose', 'type': 'text', 'order': 2},
                {'name': 'Company', 'type': 'text', 'order': 3},
                {'name': 'Phone', 'type': 'text', 'order': 4},
                {'name': 'Visit Date', 'type': 'date', 'order': 5},
                {'name': 'Meeting With', 'type': 'text', 'order': 6},
            ]
            
            visitor_table, table_created = IDCardTable.objects.get_or_create(
                group=group,
                name='Visitor Pass',
                defaults={
                    'fields': visitor_fields,
                    'is_active': True
                }
            )
            
            if table_created:
                self.stdout.write(self.style.SUCCESS(f'  Created Table: Visitor Pass'))
                
                # Add 5 sample visitors
                visitor_names = ['Rahul Mehta', 'Sonia Kapoor', 'Manoj Tiwari', 'Neeta Sharma', 'Vikram Seth']
                purposes = ['Meeting', 'Interview', 'Delivery', 'Inspection', 'Parent Meeting']
                companies = ['ABC Corp', 'XYZ Ltd', 'Tech Solutions', 'Global Services', 'Self']
                
                for i, name in enumerate(visitor_names):
                    field_data = {
                        'Visitor Name': name,
                        'Purpose': purposes[i],
                        'Company': companies[i],
                        'Phone': f'+91 97{random.randint(10000000, 99999999)}',
                        'Visit Date': str(date.today() - timedelta(days=random.randint(0, 30))),
                        'Meeting With': random.choice(staff_names),
                    }
                    
                    IDCard.objects.create(
                        table=visitor_table,
                        field_data=field_data,
                        status=random.choice(['pending', 'verified', 'approved'])
                    )
                self.stdout.write(self.style.SUCCESS(f'    Added 5 visitor pass cards'))
            else:
                self.stdout.write(f'  Table already exists: Visitor Pass ({visitor_table.id_cards.count()} cards)')

        # Summary
        self.stdout.write('\n' + '='*50)
        self.stdout.write(self.style.SUCCESS('SAMPLE ID CARD DATA ADDED!'))
        self.stdout.write('='*50)
        self.stdout.write(f'Active Clients: {active_clients.count()}')
        self.stdout.write(f'ID Card Groups: {IDCardGroup.objects.count()}')
        self.stdout.write(f'ID Card Tables: {IDCardTable.objects.count()}')
        self.stdout.write(f'ID Cards: {IDCard.objects.count()}')
        self.stdout.write('='*50)
        
        # Show breakdown by status
        self.stdout.write('\nID Cards by Status:')
        for status, label in IDCard.STATUS_CHOICES:
            count = IDCard.objects.filter(status=status).count()
            self.stdout.write(f'  {label}: {count}')
        self.stdout.write('='*50)
