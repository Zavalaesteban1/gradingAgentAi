from rest_framework import serializers
from .models import Assignment, StudentSubmission
from grading.models import GradingResult

class AssignmentSerializer(serializers.ModelSerializer):
    reference_file = serializers.FileField(required=True)
    
    class Meta:
        model = Assignment
        fields = ['id', 'name', 'description', 'reference_file', 'max_score', 'created_at']
    
    def validate_reference_file(self, value):
        if not value.name.lower().endswith('.cpp'):
            raise serializers.ValidationError("Reference file must be a C++ file (.cpp extension).")
        
        if value.size > 5 * 1024 * 1024:  # 5MB limit
            raise serializers.ValidationError("Reference file size must be less than 5MB.")
        
        return value

class StudentSubmissionSerializer(serializers.ModelSerializer):
    assignment_name = serializers.CharField(source='assignment.name', read_only=True)
    
    class Meta:
        model = StudentSubmission
        fields = [
            'id', 'student_name', 'student_id', 'assignment', 'assignment_name',
            'file_name', 'file_size', 'status', 'submitted_at', 'graded_at',
            'total_score', 'percentage'
        ]
        read_only_fields = ['id', 'submitted_at', 'graded_at', 'status', 'file_size']

class FileUploadSerializer(serializers.Serializer):
    file = serializers.FileField()
    student_name = serializers.CharField(max_length=100)
    student_id = serializers.CharField(max_length=50)
    assignment_id = serializers.CharField()  # Will be converted to UUID
    
    def validate_file(self, value):
        # Check file extension
        if not value.name.lower().endswith(('.cpp', '.cc', '.cxx')):
            raise serializers.ValidationError("Only C++ files (.cpp, .cc, .cxx) are allowed.")
        
        # Check file size (5MB limit)
        if value.size > 5 * 1024 * 1024:
            raise serializers.ValidationError("File size must be less than 5MB.")
        
        return value

class GradingResultSerializer(serializers.ModelSerializer):
    submission = StudentSubmissionSerializer(read_only=True)
    
    class Meta:
        model = GradingResult
        fields = [
            'id', 'submission', 'total_score', 'max_score', 'percentage',
            'correctness_score', 'correctness_max', 'correctness_feedback',
            'code_style_score', 'code_style_max', 'code_style_feedback',
            'efficiency_score', 'efficiency_max', 'efficiency_feedback',
            'documentation_score', 'documentation_max', 'documentation_feedback',
            'overall_feedback', 'suggestions', 'ai_model_used', 
            'processing_time', 'graded_at'
        ]
