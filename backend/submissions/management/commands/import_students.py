from django.core.management.base import BaseCommand
from django.core.exceptions import ValidationError
from submissions.models import Course, Student
import csv
import os

class Command(BaseCommand):
    help = 'Import students from a CSV file'

    def add_arguments(self, parser):
        parser.add_argument('csv_file', type=str, help='Path to the CSV file')
        parser.add_argument('--course-id', type=str, required=True, help='Course ID (UUID)')
        parser.add_argument('--dry-run', action='store_true', help='Show what would be imported without actually doing it')

    def handle(self, *args, **options):
        csv_file_path = options['csv_file']
        course_id = options['course_id']
        dry_run = options['dry_run']

        # Check if file exists
        if not os.path.exists(csv_file_path):
            self.stdout.write(self.style.ERROR(f'File not found: {csv_file_path}'))
            return

        # Check if course exists
        try:
            course = Course.objects.get(id=course_id)
            self.stdout.write(f'Target course: {course.full_course_name}')
        except Course.DoesNotExist:
            self.stdout.write(self.style.ERROR(f'Course not found: {course_id}'))
            # List available courses
            self.stdout.write('\nAvailable courses:')
            for c in Course.objects.all():
                self.stdout.write(f'  - {c.id}: {c.full_course_name}')
            return

        # Process CSV file
        students_created = []
        students_updated = []
        errors = []

        try:
            with open(csv_file_path, 'r', encoding='utf-8') as file:
                csv_reader = csv.DictReader(file)
                
                # Check headers
                expected_headers = {'first_name', 'last_name', 'email'}
                if not expected_headers.issubset(set(csv_reader.fieldnames or [])):
                    self.stdout.write(self.style.ERROR(f'Invalid headers. Expected: {expected_headers}'))
                    self.stdout.write(f'Found: {csv_reader.fieldnames}')
                    return

                for row_num, row in enumerate(csv_reader, start=2):
                    first_name = row.get('first_name', '').strip()
                    last_name = row.get('last_name', '').strip()
                    email = row.get('email', '').strip()

                    # Validate required fields
                    if not first_name or not last_name or not email:
                        error_msg = f"Row {row_num}: Missing required fields"
                        errors.append(error_msg)
                        continue

                    # Validate email format
                    if '@' not in email:
                        error_msg = f"Row {row_num}: Invalid email format: {email}"
                        errors.append(error_msg)
                        continue

                    if dry_run:
                        # Just show what would be done
                        self.stdout.write(f"Would process: {first_name} {last_name} ({email})")
                        continue

                    try:
                        # Create or update student
                        student, created = Student.objects.get_or_create(
                            email=email,
                            defaults={
                                'first_name': first_name,
                                'last_name': last_name
                            }
                        )

                        if not created:
                            # Update existing student
                            student.first_name = first_name
                            student.last_name = last_name
                            student.save()
                            students_updated.append(student)
                        else:
                            students_created.append(student)

                        # Add to course
                        student.courses.add(course)
                        
                        self.stdout.write(f"{'Created' if created else 'Updated'}: {student.full_name} ({student.email})")

                    except Exception as e:
                        error_msg = f"Row {row_num}: {str(e)}"
                        errors.append(error_msg)

        except UnicodeDecodeError:
            self.stdout.write(self.style.ERROR('File encoding error. Please save your CSV as UTF-8.'))
            return
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'Error reading file: {str(e)}'))
            return

        # Summary
        if dry_run:
            self.stdout.write(f'\n--- DRY RUN COMPLETE ---')
            self.stdout.write(f'Would process {len(students_created) + len(students_updated)} students')
        else:
            self.stdout.write(f'\n--- IMPORT COMPLETE ---')
            self.stdout.write(self.style.SUCCESS(f'Created: {len(students_created)} students'))
            self.stdout.write(self.style.SUCCESS(f'Updated: {len(students_updated)} students'))
            self.stdout.write(f'Course: {course.full_course_name}')
        
        if errors:
            self.stdout.write(self.style.ERROR(f'Errors: {len(errors)}'))
            for error in errors:
                self.stdout.write(self.style.ERROR(f'  - {error}'))
