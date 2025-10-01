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
from grading.batch_service import BatchGradingService

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

# Batch Grading Views
@api_view(['GET'])
def batch_list(request):
    """
    Get list of all batch grading jobs
    """
    try:
        from grading.models import BatchGradingJob
        
        # Get all batch jobs ordered by creation date (newest first)
        batch_jobs = BatchGradingJob.objects.all().order_by('-created_at')
        
        results = []
        for batch_job in batch_jobs:
            # Calculate statistics
            submissions = batch_job.submissions.all()
            total_files = submissions.count()
            graded_submissions = submissions.filter(grading_results__isnull=False)
            successful_grades = graded_submissions.count()
            failed_grades = total_files - successful_grades
            
            # Calculate average score
            average_score = None
            if successful_grades > 0:
                from django.db.models import Avg
                avg_result = graded_submissions.aggregate(
                    avg_score=Avg('grading_results__percentage')
                )
                average_score = avg_result['avg_score']
            
            results.append({
                'id': str(batch_job.id),
                'assignment_name': batch_job.assignment_name,
                'status': batch_job.status,
                'total_files': total_files,
                'processed_files': successful_grades + failed_grades,
                'successful_grades': successful_grades,
                'failed_grades': failed_grades,
                'average_score': average_score,
                'created_at': batch_job.created_at,
                'completed_at': batch_job.completed_at
            })
        
        return Response({'results': results})
        
    except Exception as e:
        return Response(
            {'error': 'Failed to get batch list', 'details': str(e)}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['POST'])
@parser_classes([MultiPartParser, FormParser])
def batch_upload_submissions(request):
    """
    Upload multiple student submissions for batch grading
    """
    try:
        assignment_id = request.data.get('assignment_id')
        files = request.FILES.getlist('files')
        
        if not assignment_id:
            return Response(
                {'error': 'Assignment ID is required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if not files:
            return Response(
                {'error': 'No files provided'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Validate file types
        valid_files = []
        invalid_files = []
        
        for file in files:
            if file.name.lower().endswith('.cpp'):
                valid_files.append(file)
            else:
                invalid_files.append(file.name)
        
        if not valid_files:
            return Response(
                {'error': 'No valid C++ files found'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Create batch job
        batch_service = BatchGradingService()
        batch_job = batch_service.create_batch_job(assignment_id, valid_files)
        
        # Start processing in background
        batch_service.start_batch_grading(str(batch_job.id))
        
        return Response({
            'message': f'Batch job created with {len(valid_files)} files',
            'batch_job_id': str(batch_job.id),
            'valid_files': len(valid_files),
            'invalid_files': invalid_files if invalid_files else None
        }, status=status.HTTP_201_CREATED)
        
    except Assignment.DoesNotExist:
        return Response(
            {'error': 'Assignment not found'}, 
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        return Response(
            {'error': 'Batch upload failed', 'details': str(e)}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['GET'])
def batch_status(request, batch_job_id):
    """
    Get status of a batch grading job
    """
    try:
        batch_service = BatchGradingService()
        status_data = batch_service.get_batch_status(batch_job_id)
        
        if 'error' in status_data:
            return Response(status_data, status=status.HTTP_404_NOT_FOUND)
        
        return Response(status_data)
        
    except Exception as e:
        return Response(
            {'error': 'Failed to get batch status', 'details': str(e)}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['GET'])
def batch_results(request, batch_job_id):
    """
    Get detailed results for a batch grading job
    """
    try:
        batch_service = BatchGradingService()
        results_data = batch_service.get_batch_results(batch_job_id)
        
        if 'error' in results_data:
            return Response(results_data, status=status.HTTP_404_NOT_FOUND)
        
        return Response(results_data)
        
    except Exception as e:
        return Response(
            {'error': 'Failed to get batch results', 'details': str(e)}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )