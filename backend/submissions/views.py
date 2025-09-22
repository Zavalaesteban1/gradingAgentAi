from rest_framework import status, generics
from rest_framework.decorators import api_view, parser_classes
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.conf import settings
import os
import time
import uuid

from .models import Assignment, StudentSubmission
from .serializers import (
    AssignmentSerializer, 
    StudentSubmissionSerializer, 
    FileUploadSerializer,
    GradingResultSerializer
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
        student_name = serializer.validated_data['student_name']
        student_id = serializer.validated_data['student_id']
        assignment_id = serializer.validated_data['assignment_id']
        
        # Get assignment
        assignment = get_object_or_404(Assignment, id=assignment_id)
        
        # Create submission record
        submission = StudentSubmission.objects.create(
            student_name=student_name,
            student_id=student_id,
            assignment=assignment,
            code_file=file,
            file_name=file.name,
            file_size=file.size,
            status='pending'
        )
        
        # Serialize response
        response_serializer = StudentSubmissionSerializer(submission)
        
        return Response({
            'message': 'File uploaded successfully',
            'submission': response_serializer.data
        }, status=status.HTTP_201_CREATED)
        
    except Assignment.DoesNotExist:
        return Response(
            {'error': 'Assignment not found'}, 
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