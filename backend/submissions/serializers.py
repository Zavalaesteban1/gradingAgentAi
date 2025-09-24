from rest_framework import serializers
from .models import Assignment, StudentSubmission, Course, Student
from grading.models import GradingResult
import csv
from io import StringIO

class CourseSerializer(serializers.ModelSerializer):
    full_course_name = serializers.ReadOnlyField()
    student_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Course
        fields = ['id', 'course_code', 'section', 'semester', 'name', 'instructor', 
                 'full_course_name', 'student_count', 'created_at']
        read_only_fields = ['id', 'created_at']
    
    def get_student_count(self, obj):
        return obj.students.count()

class StudentSerializer(serializers.ModelSerializer):
    full_name = serializers.ReadOnlyField()
    course_names = serializers.SerializerMethodField()
    
    class Meta:
        model = Student
        fields = ['id', 'first_name', 'last_name', 'email', 
                 'full_name', 'courses', 'course_names', 'created_at']
        read_only_fields = ['id', 'created_at']
    
    def get_course_names(self, obj):
        return [course.full_course_name for course in obj.courses.all()]

class StudentBulkUploadSerializer(serializers.Serializer):
    """Handle bulk upload of students via CSV"""
    csv_file = serializers.FileField()
    course_id = serializers.UUIDField()
    
    def validate_csv_file(self, value):
        if not value.name.lower().endswith('.csv'):
            raise serializers.ValidationError("File must be a CSV file.")
        
        if value.size > 2 * 1024 * 1024:  # 2MB limit
            raise serializers.ValidationError("File size must be less than 2MB.")
        
        return value
    
    def validate_course_id(self, value):
        try:
            Course.objects.get(id=value)
        except Course.DoesNotExist:
            raise serializers.ValidationError("Course not found.")
        return value
    
    def create(self, validated_data):
        csv_file = validated_data['csv_file']
        course_id = validated_data['course_id']
        course = Course.objects.get(id=course_id)
        
        # Read CSV content
        try:
            csv_content = csv_file.read().decode('utf-8')
        except UnicodeDecodeError as e:
            raise serializers.ValidationError(f"File encoding error: {str(e)}. Please save your CSV as UTF-8.")
        
        csv_reader = csv.DictReader(StringIO(csv_content))
        
        students_created = []
        errors = []
        
        for row_num, row in enumerate(csv_reader, start=2):  # Start from 2 (header is 1)
            try:
                # Expected CSV format: first_name, last_name, email
                first_name = row.get('first_name', '').strip()
                last_name = row.get('last_name', '').strip()
                email = row.get('email', '').strip()
                
                if not first_name or not last_name or not email:
                    errors.append(f"Row {row_num}: Missing required fields (first_name, last_name, email)")
                    continue
                
                # Validate email format
                if '@' not in email:
                    errors.append(f"Row {row_num}: Invalid email format")
                    continue
                
                # Create or get student (using email as unique identifier)
                student, created = Student.objects.get_or_create(
                    email=email,
                    defaults={
                        'first_name': first_name,
                        'last_name': last_name
                    }
                )
                
                # Update names if student already exists but names might be different
                if not created:
                    student.first_name = first_name
                    student.last_name = last_name
                    student.save()
                
                # Add to course
                student.courses.add(course)
                students_created.append({
                    'email': student.email,
                    'name': student.full_name,
                    'created': created
                })
                
            except Exception as e:
                errors.append(f"Row {row_num}: {str(e)}")
        
        return {
            'students_created': students_created,
            'errors': errors,
            'course': course.full_course_name
        }

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
    student_name = serializers.SerializerMethodField()
    student_email = serializers.SerializerMethodField()
    
    class Meta:
        model = StudentSubmission
        fields = [
            'id', 'student', 'student_name', 'student_email', 'assignment', 'assignment_name',
            'file_name', 'file_size', 'status', 'submitted_at', 'graded_at',
            'total_score', 'percentage'
        ]
        read_only_fields = ['id', 'submitted_at', 'graded_at', 'status', 'file_size', 
                           'student_name', 'student_email', 'assignment_name']
    
    def get_student_name(self, obj):
        """Get student name with fallback to legacy data"""
        if obj.student:
            return obj.student.full_name
        elif obj.legacy_student_name:
            return obj.legacy_student_name
        else:
            return 'Unknown Student'
    
    def get_student_email(self, obj):
        """Get student email with fallback to legacy data"""
        if obj.student:
            return obj.student.email
        elif obj.legacy_student_id:  # In the upload view, email is stored in legacy_student_id
            return obj.legacy_student_id
        else:
            return None

class FileUploadSerializer(serializers.Serializer):
    file = serializers.FileField()
    student_id = serializers.UUIDField(required=False, allow_null=True)  # Reference to Student model
    assignment_id = serializers.UUIDField()  # Reference to Assignment model
    
    # Legacy support for manual entry (optional)
    manual_student_name = serializers.CharField(max_length=100, required=False, allow_blank=True)
    manual_student_email = serializers.EmailField(required=False, allow_blank=True)
    
    def validate_file(self, value):
        # Check file extension
        if not value.name.lower().endswith(('.cpp', '.cc', '.cxx')):
            raise serializers.ValidationError("Only C++ files (.cpp, .cc, .cxx) are allowed.")
        
        # Check file size (5MB limit)
        if value.size > 5 * 1024 * 1024:
            raise serializers.ValidationError("File size must be less than 5MB.")
        
        return value
    
    def validate(self, data):
        """
        Check that either student_id is provided OR manual student info is provided
        """
        student_id = data.get('student_id')
        manual_name = data.get('manual_student_name', '').strip()
        manual_email = data.get('manual_student_email', '').strip()
        
        if not student_id and not (manual_name and manual_email):
            raise serializers.ValidationError(
                "Either select a student from the dropdown or provide manual student name and email."
            )
        
        return data

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
