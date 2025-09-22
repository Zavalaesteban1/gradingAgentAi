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
    
    def __str__(self):
        return f"Grade for {self.submission.student_name} - {self.submission.assignment.name}"
    
    class Meta:
        ordering = ['-graded_at']