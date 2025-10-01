from django.db import models
from django.core.validators import FileExtensionValidator
import uuid

class Course(models.Model):
    """Represents a CS course/class like CSCI-1470-03-Fall 2025"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    course_code = models.CharField(max_length=20)  # e.g., "CSCI-1470"
    section = models.CharField(max_length=10)      # e.g., "03" or "02"
    semester = models.CharField(max_length=20)     # e.g., "Fall 2025"
    name = models.CharField(max_length=200)        # Full name like "Computer Science 1"
    instructor = models.CharField(max_length=100, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    @property
    def full_course_name(self):
        return f"{self.course_code}-{self.section}-{self.semester}"
    
    def __str__(self):
        return f"{self.name} ({self.full_course_name})"
    
    class Meta:
        ordering = ['course_code', 'section']
        unique_together = ['course_code', 'section', 'semester']

class Student(models.Model):
    """Represents a student enrolled in courses"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    first_name = models.CharField(max_length=50)
    last_name = models.CharField(max_length=50)
    email = models.EmailField(unique=True)  # Use email as unique identifier
    courses = models.ManyToManyField(Course, related_name='students')
    created_at = models.DateTimeField(auto_now_add=True)
    
    @property
    def full_name(self):
        return f"{self.first_name} {self.last_name}"
    
    def __str__(self):
        return f"{self.full_name} ({self.email})"
    
    class Meta:
        ordering = ['last_name', 'first_name']

class Assignment(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100)
    description = models.TextField()
    reference_file = models.FileField(
        upload_to='reference_answers/',
        validators=[FileExtensionValidator(allowed_extensions=['cpp', 'cc', 'cxx'])]
    )
    max_score = models.IntegerField(default=100)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return self.name
    
    class Meta:
        ordering = ['-created_at']

class StudentSubmission(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('grading', 'Grading'),
        ('graded', 'Graded'),
        ('error', 'Error'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='submissions', null=True, blank=True)
    assignment = models.ForeignKey(Assignment, on_delete=models.CASCADE, related_name='submissions')
    batch_job = models.ForeignKey('grading.BatchGradingJob', on_delete=models.CASCADE, null=True, blank=True, related_name='submissions')
    
    # Keep legacy fields for backward compatibility during migration  
    legacy_student_name = models.CharField(max_length=100, blank=True, null=True)
    legacy_student_id = models.CharField(max_length=50, blank=True, null=True)
    
    # File fields
    code_file = models.FileField(
        upload_to='submissions/',
        validators=[FileExtensionValidator(allowed_extensions=['cpp', 'cc', 'cxx'])]
    )
    file_name = models.CharField(max_length=255)
    file_size = models.IntegerField()  # in bytes
    
    # Status tracking
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    submitted_at = models.DateTimeField(auto_now_add=True)
    graded_at = models.DateTimeField(null=True, blank=True)
    
    # Grading results
    total_score = models.IntegerField(null=True, blank=True)
    percentage = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    
    def __str__(self):
        student_name = self.student.full_name if self.student else self.legacy_student_name
        return f"{student_name} - {self.assignment.name}"
    
    class Meta:
        ordering = ['-submitted_at']