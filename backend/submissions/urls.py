from django.urls import path
from . import views

app_name = 'submissions'

urlpatterns = [
    # Assignment URLs
    path('assignments/', views.AssignmentListCreateView.as_view(), name='assignment-list-create'),
    
    # Submission URLs
    path('', views.StudentSubmissionListView.as_view(), name='submission-list'),
    path('upload/', views.upload_submission, name='upload-submission'),
    path('<uuid:submission_id>/', views.submission_detail, name='submission-detail'),
    path('<uuid:submission_id>/grade/', views.grade_submission, name='grade-submission'),
    
    # Course Management URLs
    path('courses/', views.CourseListCreateView.as_view(), name='course-list-create'),
    path('courses/<uuid:pk>/', views.CourseDetailView.as_view(), name='course-detail'),
    path('courses/<uuid:course_id>/students/', views.students_by_course, name='students-by-course'),
    
    # Student Management URLs
    path('students/', views.StudentListCreateView.as_view(), name='student-list-create'),
    path('students/<uuid:pk>/', views.StudentDetailView.as_view(), name='student-detail'),
    path('students/bulk-upload/', views.bulk_upload_students, name='student-bulk-upload'),
    
    # Batch Grading URLs
    path('batch/', views.batch_list, name='batch-list'),
    path('batch-upload/', views.batch_upload_submissions, name='batch-upload'),
    path('batch/<uuid:batch_job_id>/status/', views.batch_status, name='batch-status'),
    path('batch/<uuid:batch_job_id>/results/', views.batch_results, name='batch-results'),
]
