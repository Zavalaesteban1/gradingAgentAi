from django.db import models
from submissions.models import StudentSubmission
import uuid

class GradingResult(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    submission = models.OneToOneField(StudentSubmission, on_delete=models.CASCADE, related_name='grading_result')
    
    # Overall scores
    total_score = models.IntegerField()
    max_score = models.IntegerField()
    percentage = models.DecimalField(max_digits=5, decimal_places=2)
    
    # Individual criteria scores
    correctness_score = models.IntegerField()
    correctness_max = models.IntegerField(default=40)
    correctness_feedback = models.TextField()
    
    code_style_score = models.IntegerField()
    code_style_max = models.IntegerField(default=25)
    code_style_feedback = models.TextField()
    
    efficiency_score = models.IntegerField()
    efficiency_max = models.IntegerField(default=20)
    efficiency_feedback = models.TextField()
    
    documentation_score = models.IntegerField()
    documentation_max = models.IntegerField(default=15)
    documentation_feedback = models.TextField()
    
    # Overall feedback
    overall_feedback = models.TextField()
    suggestions = models.TextField(blank=True)
    
    # AI processing details
    ai_model_used = models.CharField(max_length=50, default='claude-3-sonnet')
    processing_time = models.FloatField()  # seconds
    graded_at = models.DateTimeField(auto_now_add=True)
    
    # Tool analysis results (JSON fields to store tool outputs)
    compilation_result = models.JSONField(null=True, blank=True)  # Compilation results
    test_results = models.JSONField(null=True, blank=True)       # Test execution results
    style_analysis = models.JSONField(null=True, blank=True)     # Style analysis results
    custom_rubric = models.JSONField(null=True, blank=True)      # Custom rubric extracted from reference code
    
    def __str__(self):
        return f"Grade for {self.submission.student_name} - {self.submission.assignment.name}"
    
    class Meta:
        ordering = ['-graded_at']

class BatchGradingJob(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('processing', 'Processing'),
        ('completed', 'Completed'),
        ('failed', 'Failed'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    assignment = models.ForeignKey('submissions.Assignment', on_delete=models.CASCADE)
    assignment_name = models.CharField(max_length=255, blank=True)  # Cache assignment name for easier queries
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    
    # Progress tracking
    total_files = models.IntegerField(default=0)
    processed_files = models.IntegerField(default=0)
    successful_grades = models.IntegerField(default=0)
    failed_grades = models.IntegerField(default=0)
    
    # Timing
    created_at = models.DateTimeField(auto_now_add=True)
    started_at = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    
    # Results summary
    average_score = models.FloatField(null=True, blank=True)
    highest_score = models.FloatField(null=True, blank=True)
    lowest_score = models.FloatField(null=True, blank=True)
    
    # Error tracking
    error_message = models.TextField(blank=True)
    
    def __str__(self):
        return f"Batch Job {self.id} - {self.assignment.name} ({self.status})"
    
    @property
    def progress_percentage(self):
        if self.total_files == 0:
            return 0
        return (self.processed_files / self.total_files) * 100
    
    def update_progress(self):
        """Update progress and calculate summary statistics"""
        from .models import GradingResult
        
        # Get all grading results for submissions in this batch
        results = GradingResult.objects.filter(
            submission__batch_job=self
        )
        
        if results.exists():
            scores = [r.percentage for r in results]
            self.average_score = sum(scores) / len(scores)
            self.highest_score = max(scores)
            self.lowest_score = min(scores)
            self.successful_grades = len(scores)
        
        self.save()
    
    class Meta:
        ordering = ['-created_at']