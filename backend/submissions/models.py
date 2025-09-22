from django.db import models
from django.core.validators import FileExtensionValidator
import uuid

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
    student_name = models.CharField(max_length=100)
    student_id = models.CharField(max_length=50)
    assignment = models.ForeignKey(Assignment, on_delete=models.CASCADE, related_name='submissions')
    
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
        return f"{self.student_name} - {self.assignment.name}"
    
    class Meta:
        ordering = ['-submitted_at']