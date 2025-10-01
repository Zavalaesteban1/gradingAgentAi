"""
Batch Grading Service
Handles processing multiple student submissions in bulk
"""
import threading
import time
import re
from typing import List
from django.utils import timezone
from django.core.files.base import ContentFile
from django.core.files.storage import default_storage

from submissions.models import StudentSubmission, Assignment
from .models import BatchGradingJob, GradingResult
from .services import GradingService


class BatchGradingService:
    def __init__(self):
        self.grading_service = GradingService()
    
    def create_batch_job(self, assignment_id: str, files: List, course_id: str = None) -> BatchGradingJob:
        """
        Create a new batch grading job and associated submissions
        """
        assignment = Assignment.objects.get(id=assignment_id)
        
        # Create the batch job
        batch_job = BatchGradingJob.objects.create(
            assignment=assignment,
            assignment_name=assignment.name,  # Explicitly set for easier querying
            total_files=len(files),
            status='pending'
        )
        
        print(f"📦 Created batch job {batch_job.id} for {len(files)} files")
        
        # Create submissions for each file
        for file in files:
            # Extract student name from filename (e.g., "johnDoelab1.cpp" -> "John Doe")
            student_name = self._extract_student_name(file.name)
            
            submission = StudentSubmission.objects.create(
                assignment=assignment,
                batch_job=batch_job,
                code_file=file,
                file_name=file.name,
                file_size=file.size,
                status='pending',
                legacy_student_name=student_name
            )
            
            print(f"  ✓ Created submission for {student_name}: {file.name}")
        
        return batch_job
    
    def start_batch_grading(self, batch_job_id: str) -> None:
        """
        Start processing a batch grading job in background
        """
        # Use threading to process in background
        thread = threading.Thread(
            target=self._process_batch_job,
            args=(batch_job_id,),
            daemon=True
        )
        thread.start()
        print(f"🚀 Started background processing for batch job {batch_job_id}")
    
    def _process_batch_job(self, batch_job_id: str) -> None:
        """
        Process all submissions in a batch job
        """
        try:
            batch_job = BatchGradingJob.objects.get(id=batch_job_id)
            batch_job.status = 'processing'
            batch_job.started_at = timezone.now()
            batch_job.save()
            
            print(f"\n🤖 BATCH GRADING STARTED")
            print(f"   📦 Batch Job: {batch_job.id}")
            print(f"   📝 Assignment: {batch_job.assignment.name}")
            print(f"   📊 Total Files: {batch_job.total_files}")
            print("=" * 70)
            
            submissions = batch_job.submissions.all()
            
            successful_count = 0
            failed_count = 0
            
            for i, submission in enumerate(submissions, 1):
                try:
                    print(f"\n⚡ Processing {i}/{batch_job.total_files}: {submission.legacy_student_name}")
                    
                    # Update submission status
                    submission.status = 'grading'
                    submission.save()
                    
                    # Refresh batch_job from database to avoid stale data
                    batch_job.refresh_from_db()
                    
                    # Perform AI grading
                    grading_result = self.grading_service.grade_submission(submission)
                    
                    # Update submission status
                    submission.status = 'graded'
                    submission.total_score = grading_result.total_score
                    submission.percentage = grading_result.percentage
                    submission.graded_at = grading_result.graded_at
                    submission.save()
                    
                    successful_count += 1
                    print(f"   ✅ Completed: {grading_result.percentage}%")
                    
                except Exception as e:
                    print(f"   ❌ Failed: {str(e)}")
                    
                    # Store error details
                    error_message = f"Grading failed: {str(e)}"
                    submission.status = 'error'
                    if hasattr(submission, 'error_details'):
                        submission.error_details = error_message
                    submission.save()
                    
                    failed_count += 1
                
                # Update batch job progress atomically
                BatchGradingJob.objects.filter(id=batch_job.id).update(
                    processed_files=i,
                    successful_grades=successful_count,
                    failed_grades=failed_count
                )
                
                # Refresh our local instance
                batch_job.refresh_from_db()
            
            # Complete the batch job
            batch_job.status = 'completed'
            batch_job.completed_at = timezone.now()
            batch_job.update_progress()  # Calculate final statistics
            
            print(f"\n🎯 BATCH GRADING COMPLETED")
            print(f"   📊 Final Stats:")
            print(f"     • Processed: {batch_job.processed_files}/{batch_job.total_files}")
            print(f"     • Successful: {batch_job.successful_grades}")
            print(f"     • Failed: {batch_job.failed_grades}")
            print(f"     • Average Score: {batch_job.average_score:.1f}%")
            print("=" * 70)
            
        except Exception as e:
            print(f"❌ Batch job failed: {str(e)}")
            batch_job.status = 'failed'
            batch_job.error_message = str(e)
            batch_job.completed_at = timezone.now()
            batch_job.save()
    
    def _extract_student_name(self, filename: str) -> str:
        """
        Extract student name from filename
        Examples: 
          - "johnDoelab1.cpp" -> "John Doe"
          - "maryCalderon_Lab01.cpp" -> "Mary Calderon"  
          - "alexisBravo-assignment1.cpp" -> "Alexis Bravo"
        """
        # Remove file extension
        name = filename.rsplit('.', 1)[0]
        
        # Remove common patterns like "lab1", "Lab01", "assignment1", etc.
        patterns_to_remove = [
            r'[_-]?lab\d*$',
            r'[_-]?Lab\d*$', 
            r'[_-]?assignment\d*$',
            r'[_-]?Assignment\d*$',
            r'[_-]?hw\d*$',
            r'[_-]?HW\d*$'
        ]
        
        for pattern in patterns_to_remove:
            name = re.sub(pattern, '', name, flags=re.IGNORECASE)
        
        # Handle camelCase (e.g., "johnDoe" -> "john Doe")
        name = re.sub(r'([a-z])([A-Z])', r'\1 \2', name)
        
        # Replace underscores and hyphens with spaces
        name = re.sub(r'[_-]', ' ', name)
        
        # Clean up multiple spaces and title case
        name = ' '.join(word.capitalize() for word in name.split())
        
        return name if name else "Unknown Student"
    
    def get_batch_status(self, batch_job_id: str) -> dict:
        """
        Get current status of a batch grading job
        """
        try:
            batch_job = BatchGradingJob.objects.get(id=batch_job_id)
            
            return {
                'id': str(batch_job.id),
                'status': batch_job.status,
                'assignment_name': batch_job.assignment_name or batch_job.assignment.name,
                'total_files': batch_job.total_files,
                'processed_files': batch_job.processed_files,
                'successful_grades': batch_job.successful_grades,
                'failed_grades': batch_job.failed_grades,
                'progress_percentage': batch_job.progress_percentage,
                'average_score': batch_job.average_score,
                'highest_score': batch_job.highest_score,
                'lowest_score': batch_job.lowest_score,
                'created_at': batch_job.created_at,
                'started_at': batch_job.started_at,
                'completed_at': batch_job.completed_at,
                'error_message': batch_job.error_message
            }
        except BatchGradingJob.DoesNotExist:
            return {'error': 'Batch job not found'}
    
    def get_batch_results(self, batch_job_id: str) -> dict:
        """
        Get detailed results for a completed batch job
        """
        try:
            batch_job = BatchGradingJob.objects.get(id=batch_job_id)
            submissions = batch_job.submissions.all().order_by('legacy_student_name')
            
            results = []
            for submission in submissions:
                result_data = {
                    'id': str(submission.id),
                    'student_name': submission.legacy_student_name,
                    'file_name': submission.file_name,
                    'status': submission.status,
                    'submitted_at': submission.submitted_at,
                    'graded_at': submission.graded_at,
                    'total_score': submission.total_score,
                    'percentage': float(submission.percentage) if submission.percentage else None
                }
                
                # Include grading details if available
                if hasattr(submission, 'grading_result'):
                    grading_result = submission.grading_result
                    result_data['grading_details'] = {
                        'correctness_score': grading_result.correctness_score,
                        'code_style_score': grading_result.code_style_score,
                        'efficiency_score': grading_result.efficiency_score,
                        'documentation_score': grading_result.documentation_score,
                        'overall_feedback': grading_result.overall_feedback[:200],  # Truncated
                        'processing_time': grading_result.processing_time
                    }
                
                results.append(result_data)
            
            return {
                'batch_job': self.get_batch_status(batch_job_id),
                'results': results
            }
            
        except BatchGradingJob.DoesNotExist:
            return {'error': 'Batch job not found'}
