from django.urls import path
from . import views

app_name = 'submissions'

urlpatterns = [
    path('assignments/', views.AssignmentListCreateView.as_view(), name='assignment-list-create'),
    path('', views.StudentSubmissionListView.as_view(), name='submission-list'),
    path('upload/', views.upload_submission, name='upload-submission'),
    path('<uuid:submission_id>/', views.submission_detail, name='submission-detail'),
    path('<uuid:submission_id>/grade/', views.grade_submission, name='grade-submission'),
]
