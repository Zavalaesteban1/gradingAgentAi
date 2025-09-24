from rest_framework import status, generics
from rest_framework.decorators import api_view, parser_classes
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.conf import settings
import os
import time
import uuid

from .models import Assignment, StudentSubmission, Course, Student
from .serializers import (
    AssignmentSerializer, 
    StudentSubmissionSerializer, 
    FileUploadSerializer,
    GradingResultSerializer,
    CourseSerializer,
    StudentSerializer,
    StudentBulkUploadSerializer
)
from grading.services import GradingService

class AssignmentListCreateView(generics.ListCreateAPIView):
    queryset = Assignment.objects.all()
    serializer_class = AssignmentSerializer
    
    def perform_create(self, serializer):
        # Handle file upload and save assignment
        serializer.save()

class StudentSubmissionListView(generics.ListAPIView):
    queryset = StudentSubmission.objects.all()
    serializer_class = StudentSubmissionSerializer

@api_view(['POST'])
@parser_classes([MultiPartParser, FormParser])
def upload_submission(request):
    """
    Upload a student's C++ code submission
    """
    serializer = FileUploadSerializer(data=request.data)
    
    if not serializer.is_valid():
        return Response(
            {'error': 'Invalid data', 'details': serializer.errors}, 
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        # Get validated data
        file = serializer.validated_data['file']
        student_id = serializer.validated_data.get('student_id')
        assignment_id = serializer.validated_data['assignment_id']
        
        # Get assignment
        assignment = get_object_or_404(Assignment, id=assignment_id)
        
        # Get student (prefer student_id, fall back to manual entry)
        student = None
        if student_id:
            student = get_object_or_404(Student, id=student_id)
        
        # Create submission record
        submission = StudentSubmission.objects.create(
            student=student,
            assignment=assignment,
            code_file=file,
            file_name=file.name,
            file_size=file.size,
            status='pending',
            # Legacy fields for backward compatibility (store when no student is linked)
            legacy_student_name=serializer.validated_data.get('manual_student_name', '') if not student else '',
            legacy_student_id=serializer.validated_data.get('manual_student_email', '') if not student else ''  # Store email in legacy field
        )
        
        # Serialize response
        response_serializer = StudentSubmissionSerializer(submission)
        
        return Response({
            'message': 'File uploaded successfully',
            'submission': response_serializer.data
        }, status=status.HTTP_201_CREATED)
        
    except (Assignment.DoesNotExist, Student.DoesNotExist) as e:
        return Response(
            {'error': f'{e.__class__.__name__}: Object not found'}, 
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        return Response(
            {'error': 'Upload failed', 'details': str(e)}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['POST'])
def grade_submission(request, submission_id):
    """
    Grade a specific submission using AI
    """
    try:
        submission = get_object_or_404(StudentSubmission, id=submission_id)
        
        # Check if already graded
        if submission.status == 'graded':
            return Response({
                'message': 'Submission already graded',
                'grading_result': GradingResultSerializer(submission.grading_result).data
            })
        
        # Update status to grading
        submission.status = 'grading'
        submission.save()
        
        # Initialize grading service
        grading_service = GradingService()
        
        # Perform AI grading
        grading_result = grading_service.grade_submission(submission)
        
        # Update submission status
        submission.status = 'graded'
        submission.total_score = grading_result.total_score
        submission.percentage = grading_result.percentage
        submission.graded_at = grading_result.graded_at
        submission.save()
        
        return Response({
            'message': 'Submission graded successfully',
            'grading_result': GradingResultSerializer(grading_result).data
        }, status=status.HTTP_200_OK)
        
    except StudentSubmission.DoesNotExist:
        return Response(
            {'error': 'Submission not found'}, 
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        # Mark submission as error
        submission.status = 'error'
        submission.save()
        
        return Response(
            {'error': 'Grading failed', 'details': str(e)}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['GET'])
def submission_detail(request, submission_id):
    """
    Get detailed information about a submission including grading results
    """
    try:
        submission = get_object_or_404(StudentSubmission, id=submission_id)
        submission_data = StudentSubmissionSerializer(submission).data
        
        # Include grading result if available
        if hasattr(submission, 'grading_result'):
            submission_data['grading_result'] = GradingResultSerializer(submission.grading_result).data
        
        return Response(submission_data)
        
    except StudentSubmission.DoesNotExist:
        return Response(
            {'error': 'Submission not found'}, 
            status=status.HTTP_404_NOT_FOUND
        )

# Course Management Views
class CourseListCreateView(generics.ListCreateAPIView):
    queryset = Course.objects.all()
    serializer_class = CourseSerializer

class CourseDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Course.objects.all()
    serializer_class = CourseSerializer

# Student Management Views
class StudentListCreateView(generics.ListCreateAPIView):
    queryset = Student.objects.all()
    serializer_class = StudentSerializer
    
    def get_queryset(self):
        queryset = Student.objects.all()
        course_id = self.request.query_params.get('course_id', None)
        if course_id:
            queryset = queryset.filter(courses__id=course_id)
        return queryset

class StudentDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Student.objects.all()
    serializer_class = StudentSerializer

@api_view(['POST'])
@parser_classes([MultiPartParser, FormParser])
def bulk_upload_students(request):
    """
    Bulk upload students from CSV file
    """
    serializer = StudentBulkUploadSerializer(data=request.data)
    
    if not serializer.is_valid():
        return Response(
            {'error': 'Invalid data', 'details': serializer.errors}, 
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        result = serializer.save()
        return Response({
            'message': f"Bulk upload completed for {result['course']}",
            'students_processed': len(result['students_created']),
            'students_created': result['students_created'],
            'errors': result['errors']
        }, status=status.HTTP_201_CREATED)
        
    except Exception as e:
        import traceback
        error_traceback = traceback.format_exc()
        print(f"Bulk upload error: {e}")
        print(f"Full traceback: {error_traceback}")
        return Response(
            {'error': 'Bulk upload failed', 'details': str(e), 'traceback': error_traceback}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['GET'])
def students_by_course(request, course_id):
    """
    Get all students enrolled in a specific course
    """
    try:
        course = get_object_or_404(Course, id=course_id)
        students = course.students.all()
        serializer = StudentSerializer(students, many=True)
        
        return Response({
            'course': CourseSerializer(course).data,
            'students': serializer.data
        })
        
    except Course.DoesNotExist:
        return Response(
            {'error': 'Course not found'}, 
            status=status.HTTP_404_NOT_FOUND
        )