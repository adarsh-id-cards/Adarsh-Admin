from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta, date
import random

from core.models import Client, IDCardGroup, IDCardTable, IDCard


class Command(BaseCommand):
    help = 'Adds a table with maximum 20 fields (3 images + 17 text fields) to test full field display'

    def handle(self, *args, **options):
        self.stdout.write('Adding Maximum Fields Table...\n')

        # Get first active client
        client = Client.objects.filter(status='active').first()
        
        if not client:
            self.stdout.write(self.style.WARNING('No active clients found. Please create a client first.'))
            return

        self.stdout.write(f'Using client: {client.name}')

        # Get or create an ID Card Group
        group, _ = IDCardGroup.objects.get_or_create(
            client=client,
            name='Default Group',
            defaults={
                'description': f'Default ID Card Group for {client.name}',
                'is_active': True
            }
        )

        # Delete existing "Employee Full Details" table if exists (to recreate with fresh data)
        IDCardTable.objects.filter(group=group, name='Employee Full Details').delete()

        # ===== Create Table with Maximum 20 Fields (3 images + 17 text/other fields) =====
        max_fields = [
            {'name': 'Photo', 'type': 'image', 'order': 1},
            {'name': 'Full Name', 'type': 'text', 'order': 2},
            {'name': 'Employee ID', 'type': 'text', 'order': 3},
            {'name': 'Designation', 'type': 'text', 'order': 4},
            {'name': 'Department', 'type': 'text', 'order': 5},
            {'name': 'Date of Birth', 'type': 'date', 'order': 6},
            {'name': 'Date of Joining', 'type': 'date', 'order': 7},
            {'name': 'Email Address', 'type': 'email', 'order': 8},
            {'name': 'Phone Number', 'type': 'text', 'order': 9},
            {'name': 'Emergency Contact', 'type': 'text', 'order': 10},
            {'name': 'Blood Group', 'type': 'text', 'order': 11},
            {'name': 'Aadhar Number', 'type': 'number', 'order': 12},
            {'name': 'PAN Number', 'type': 'text', 'order': 13},
            {'name': 'Bank Account', 'type': 'text', 'order': 14},
            {'name': 'IFSC Code', 'type': 'text', 'order': 15},
            {'name': 'Permanent Address', 'type': 'textarea', 'order': 16},
            {'name': 'Current Address', 'type': 'textarea', 'order': 17},
            {'name': 'Signature', 'type': 'image', 'order': 18},
            {'name': 'QR Code', 'type': 'image', 'order': 19},
            {'name': 'Remarks', 'type': 'textarea', 'order': 20},
        ]
        
        max_table = IDCardTable.objects.create(
            group=group,
            name='Employee Full Details',
            fields=max_fields,
            is_active=True
        )
        self.stdout.write(self.style.SUCCESS(f'Created Table: Employee Full Details (20 fields)'))

        # Sample data
        employees = [
            {
                'Full Name': 'Rajendra Kumar Sharma',
                'Employee ID': 'EMP-2024-001',
                'Designation': 'Senior Software Engineer',
                'Department': 'Information Technology',
                'Date of Birth': '1985-06-15',
                'Date of Joining': '2020-03-10',
                'Email Address': 'rajendra.sharma@company.com',
                'Phone Number': '+91 98765 43210',
                'Emergency Contact': '+91 98765 43211',
                'Blood Group': 'B+',
                'Aadhar Number': '1234 5678 9012',
                'PAN Number': 'ABCDE1234F',
                'Bank Account': '1234567890123456',
                'IFSC Code': 'HDFC0001234',
                'Permanent Address': '123, Shanti Nagar, Near City Mall, Sector 15, Noida, UP - 201301',
                'Current Address': '456, Green Park Colony, Block A, Gurgaon, HR - 122001',
                'Remarks': 'Team Lead - Backend Development',
            },
            {
                'Full Name': 'Priya Anand Mehta',
                'Employee ID': 'EMP-2024-002',
                'Designation': 'Product Manager',
                'Department': 'Product Development',
                'Date of Birth': '1990-02-28',
                'Date of Joining': '2021-07-01',
                'Email Address': 'priya.mehta@company.com',
                'Phone Number': '+91 87654 32109',
                'Emergency Contact': '+91 87654 32110',
                'Blood Group': 'O+',
                'Aadhar Number': '9876 5432 1098',
                'PAN Number': 'FGHIJ5678K',
                'Bank Account': '9876543210987654',
                'IFSC Code': 'ICIC0005678',
                'Permanent Address': '789, Vasant Kunj, Near Metro Station, South Delhi - 110070',
                'Current Address': 'Same as Permanent Address',
                'Remarks': 'Mobile App Product Lead',
            },
            {
                'Full Name': 'Amit Vishwanath Patil',
                'Employee ID': 'EMP-2024-003',
                'Designation': 'Human Resources Manager',
                'Department': 'Human Resources',
                'Date of Birth': '1988-11-20',
                'Date of Joining': '2019-01-15',
                'Email Address': 'amit.patil@company.com',
                'Phone Number': '+91 76543 21098',
                'Emergency Contact': '+91 76543 21099',
                'Blood Group': 'A-',
                'Aadhar Number': '5678 9012 3456',
                'PAN Number': 'KLMNO9012P',
                'Bank Account': '5678901234567890',
                'IFSC Code': 'SBIN0009012',
                'Permanent Address': '321, Koramangala 4th Block, Bangalore, KA - 560034',
                'Current Address': '654, Indiranagar 100ft Road, Bangalore, KA - 560038',
                'Remarks': 'Handles recruitment and employee relations',
            },
            {
                'Full Name': 'Sneha Ramesh Iyer',
                'Employee ID': 'EMP-2024-004',
                'Designation': 'UI/UX Designer',
                'Department': 'Design',
                'Date of Birth': '1992-08-05',
                'Date of Joining': '2022-04-20',
                'Email Address': 'sneha.iyer@company.com',
                'Phone Number': '+91 65432 10987',
                'Emergency Contact': '+91 65432 10988',
                'Blood Group': 'AB+',
                'Aadhar Number': '3456 7890 1234',
                'PAN Number': 'QRSTU3456V',
                'Bank Account': '3456789012345678',
                'IFSC Code': 'AXIS0003456',
                'Permanent Address': '987, Anna Nagar West, Chennai, TN - 600040',
                'Current Address': '147, T Nagar, Near Pondy Bazaar, Chennai, TN - 600017',
                'Remarks': 'Specializes in mobile app design',
            },
            {
                'Full Name': 'Mohammed Farhan Khan',
                'Employee ID': 'EMP-2024-005',
                'Designation': 'Financial Analyst',
                'Department': 'Finance & Accounts',
                'Date of Birth': '1987-04-12',
                'Date of Joining': '2018-09-01',
                'Email Address': 'farhan.khan@company.com',
                'Phone Number': '+91 54321 09876',
                'Emergency Contact': '+91 54321 09877',
                'Blood Group': 'B-',
                'Aadhar Number': '7890 1234 5678',
                'PAN Number': 'WXYZA7890B',
                'Bank Account': '7890123456789012',
                'IFSC Code': 'UTIB0007890',
                'Permanent Address': '258, Banjara Hills Road No. 10, Hyderabad, TS - 500034',
                'Current Address': '369, Jubilee Hills, Near Film Nagar, Hyderabad, TS - 500033',
                'Remarks': 'Senior analyst - Quarterly Reports',
            },
            {
                'Full Name': 'Kavitha Subramaniam',
                'Employee ID': 'EMP-2024-006',
                'Designation': 'Quality Assurance Lead',
                'Department': 'Quality Assurance',
                'Date of Birth': '1989-12-25',
                'Date of Joining': '2020-11-16',
                'Email Address': 'kavitha.s@company.com',
                'Phone Number': '+91 43210 98765',
                'Emergency Contact': '+91 43210 98766',
                'Blood Group': 'O-',
                'Aadhar Number': '2345 6789 0123',
                'PAN Number': 'CDEFG2345H',
                'Bank Account': '2345678901234567',
                'IFSC Code': 'KKBK0002345',
                'Permanent Address': '741, MG Road, Near Brigade Road, Bangalore, KA - 560001',
                'Current Address': '852, Whitefield Main Road, Bangalore, KA - 560066',
                'Remarks': 'Automation testing expert',
            },
            {
                'Full Name': 'Arjun Krishnamurthy Nair',
                'Employee ID': 'EMP-2024-007',
                'Designation': 'DevOps Engineer',
                'Department': 'Infrastructure',
                'Date of Birth': '1991-07-08',
                'Date of Joining': '2021-02-28',
                'Email Address': 'arjun.nair@company.com',
                'Phone Number': '+91 32109 87654',
                'Emergency Contact': '+91 32109 87655',
                'Blood Group': 'A+',
                'Aadhar Number': '8901 2345 6789',
                'PAN Number': 'IJKLM8901N',
                'Bank Account': '8901234567890123',
                'IFSC Code': 'YESB0008901',
                'Permanent Address': '963, Marine Drive, Ernakulam, Kochi, KL - 682031',
                'Current Address': '174, Kakkanad IT Park Road, Kochi, KL - 682030',
                'Remarks': 'AWS certified solutions architect',
            },
            {
                'Full Name': 'Deepika Choudhary Singh',
                'Employee ID': 'EMP-2024-008',
                'Designation': 'Marketing Executive',
                'Department': 'Marketing',
                'Date of Birth': '1993-03-18',
                'Date of Joining': '2023-01-09',
                'Email Address': 'deepika.singh@company.com',
                'Phone Number': '+91 21098 76543',
                'Emergency Contact': '+91 21098 76544',
                'Blood Group': 'B+',
                'Aadhar Number': '4567 8901 2345',
                'PAN Number': 'OPQRS4567T',
                'Bank Account': '4567890123456789',
                'IFSC Code': 'PUNB0004567',
                'Permanent Address': '285, Rajouri Garden, West Delhi - 110027',
                'Current Address': '396, Dwarka Sector 21, New Delhi - 110077',
                'Remarks': 'Social media and digital marketing',
            },
        ]

        statuses = ['pending', 'verified', 'pool', 'approved', 'download']
        
        for emp_data in employees:
            IDCard.objects.create(
                table=max_table,
                field_data=emp_data,
                status=random.choice(statuses)
            )
        
        self.stdout.write(self.style.SUCCESS(f'Added {len(employees)} employee ID cards with 20 fields each'))

        # Summary
        self.stdout.write('\n' + '='*50)
        self.stdout.write(self.style.SUCCESS('MAXIMUM FIELDS TABLE CREATED!'))
        self.stdout.write('='*50)
        self.stdout.write(f'Table: Employee Full Details')
        self.stdout.write(f'Fields: 20 (3 image fields + 17 data fields)')
        self.stdout.write(f'ID Cards: {len(employees)}')
        self.stdout.write('='*50)
        self.stdout.write('\nImage Fields:')
        self.stdout.write('  1. Photo (main photo)')
        self.stdout.write('  2. Signature')
        self.stdout.write('  3. QR Code')
        self.stdout.write('='*50)
