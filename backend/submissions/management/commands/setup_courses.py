from django.core.management.base import BaseCommand
from submissions.models import Course

class Command(BaseCommand):
    help = 'Set up initial CS courses'

    def handle(self, *args, **options):
        courses_data = [
            {
                'course_code': 'CSCI-1470',
                'section': '03',
                'semester': 'Fall 2025',
                'name': 'Computer Science 1',
                'instructor': 'Prof. Instructor'
            },
            {
                'course_code': 'CSCI-1470',
                'section': '02', 
                'semester': 'Fall 2025',
                'name': 'Computer Science 1',
                'instructor': 'Prof. Instructor'
            }
        ]
        
        for course_data in courses_data:
            course, created = Course.objects.get_or_create(
                course_code=course_data['course_code'],
                section=course_data['section'],
                semester=course_data['semester'],
                defaults={
                    'name': course_data['name'],
                    'instructor': course_data['instructor']
                }
            )
            
            if created:
                self.stdout.write(
                    self.style.SUCCESS(f'Created course: {course.full_course_name}')
                )
            else:
                self.stdout.write(
                    self.style.WARNING(f'Course already exists: {course.full_course_name}')
                )
