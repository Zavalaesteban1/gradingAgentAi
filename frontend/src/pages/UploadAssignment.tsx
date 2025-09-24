import React, { useState, useCallback, useEffect } from 'react';
import styled from 'styled-components';
import { gradingApi, Course, Student } from '../services/api';

const UploadContainer = styled.div`
  padding: 2rem 0;
  max-width: 800px;
  margin: 0 auto;
`;

const PageHeader = styled.div`
  text-align: center;
  margin-bottom: 3rem;
  
  h1 {
    font-size: 2.5rem;
    font-weight: 700;
    color: #1e293b;
    margin-bottom: 1rem;
  }
  
  p {
    font-size: 1.2rem;
    color: #64748b;
    max-width: 600px;
    margin: 0 auto;
  }
`;

const UploadCard = styled.div`
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  border: 1px solid #e2e8f0;
  padding: 2rem;
  margin-bottom: 2rem;
`;

const DropZone = styled.div<{ isDragActive: boolean; hasError?: boolean }>`
  border: 2px dashed ${({ isDragActive, hasError }) => 
    hasError ? '#ef4444' : 
    isDragActive ? '#667eea' : '#cbd5e1'};
  border-radius: 8px;
  padding: 3rem 2rem;
  text-align: center;
  transition: all 0.3s ease;
  background: ${({ isDragActive }) => 
    isDragActive ? '#f8fafc' : 'transparent'};
  cursor: pointer;
  
  &:hover {
    border-color: #667eea;
    background: #f8fafc;
  }
`;

const FileInput = styled.input`
  display: none;
`;

const DropZoneContent = styled.div`
  h3 {
    font-size: 1.5rem;
    font-weight: 600;
    color: #374151;
    margin-bottom: 1rem;
  }
  
  p {
    color: #6b7280;
    margin-bottom: 1rem;
    font-size: 1rem;
  }
  
  .file-types {
    font-size: 0.875rem;
    color: #9ca3af;
  }
`;

const UploadIcon = styled.div`
  font-size: 3rem;
  margin-bottom: 1rem;
  color: #9ca3af;
`;

const StudentInfoForm = styled.div`
  margin-bottom: 2rem;
  
  h3 {
    font-size: 1.25rem;
    font-weight: 600;
    color: #374151;
    margin-bottom: 1rem;
  }
`;

const FormRow = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  margin-bottom: 1rem;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const FormGroup = styled.div`
  margin-bottom: 1rem;
`;

const Label = styled.label`
  display: block;
  font-weight: 500;
  color: #374151;
  margin-bottom: 0.5rem;
  font-size: 0.875rem;
`;

const Input = styled.input<{ hasError?: boolean }>`
  width: 100%;
  padding: 0.75rem 1rem;
  border: 1px solid ${({ hasError }) => hasError ? '#ef4444' : '#d1d5db'};
  border-radius: 6px;
  font-size: 1rem;
  transition: border-color 0.3s ease;
  
  &:focus {
    outline: none;
    border-color: #667eea;
    box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
  }
  
  &::placeholder {
    color: #9ca3af;
  }
`;

const Select = styled.select<{ hasError?: boolean }>`
  width: 100%;
  padding: 0.75rem 1rem;
  border: 1px solid ${({ hasError }) => hasError ? '#ef4444' : '#d1d5db'};
  border-radius: 6px;
  font-size: 1rem;
  background: white;
  cursor: pointer;
  transition: border-color 0.3s ease;
  
  &:focus {
    outline: none;
    border-color: #667eea;
    box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
  }
`;

const ErrorText = styled.span`
  color: #ef4444;
  font-size: 0.875rem;
  margin-top: 0.25rem;
  display: block;
`;

const SelectedFile = styled.div`
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  padding: 1rem;
  margin-top: 1rem;
  
  .file-info {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  
  .file-name {
    font-weight: 500;
    color: #374151;
  }
  
  .file-size {
    color: #6b7280;
    font-size: 0.875rem;
  }
  
  .remove-file {
    background: none;
    border: none;
    color: #ef4444;
    cursor: pointer;
    font-size: 0.875rem;
    padding: 0.25rem 0.5rem;
    
    &:hover {
      text-decoration: underline;
    }
  }
`;

const SubmitButton = styled.button<{ $loading?: boolean }>`
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  padding: 1rem 2rem;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: ${({ $loading }) => $loading ? 'not-allowed' : 'pointer'};
  opacity: ${({ $loading }) => $loading ? 0.7 : 1};
  transition: opacity 0.3s ease, transform 0.2s ease;
  width: 100%;
  
  &:hover:not(:disabled) {
    transform: translateY(-1px);
  }
  
  &:disabled {
    cursor: not-allowed;
    opacity: 0.5;
  }
`;

const Alert = styled.div<{ type: 'success' | 'error' | 'warning' }>`
  padding: 1rem;
  border-radius: 6px;
  margin-bottom: 1rem;
  background: ${({ type }) => 
    type === 'success' ? '#dcfce7' : 
    type === 'warning' ? '#fef3c7' : '#fecaca'};
  color: ${({ type }) => 
    type === 'success' ? '#166534' : 
    type === 'warning' ? '#92400e' : '#991b1b'};
  border: 1px solid ${({ type }) => 
    type === 'success' ? '#bbf7d0' : 
    type === 'warning' ? '#fbbf24' : '#fca5a5'};
`;

interface FormData {
  courseId: string;
  studentId: string;
  assignmentId: string;
  // Fallback for manual entry
  manualStudentName?: string;
  manualStudentEmail?: string;
}

interface Assignment {
  id: string;
  name: string;
  description: string;
  max_score: number;
}

interface FormErrors {
  courseId?: string;
  studentId?: string;
  assignmentId?: string;
  manualStudentName?: string;
  manualStudentEmail?: string;
  file?: string;
}

const UploadAssignment: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragActive, setIsDragActive] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [useManualEntry, setUseManualEntry] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    courseId: '',
    studentId: '',
    assignmentId: '',
    manualStudentName: '',
    manualStudentEmail: ''
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [alert, setAlert] = useState<{ type: 'success' | 'error' | 'warning'; message: string } | null>(null);

  // Load data on component mount
  useEffect(() => {
    const loadData = async () => {
      try {
        // Load assignments and courses in parallel
        const [assignmentList, courseList] = await Promise.all([
          gradingApi.getAssignments(),
          gradingApi.getCourses()
        ]);
        
        // Ensure we always have arrays
        const assignments = Array.isArray(assignmentList) ? assignmentList : [];
        const courses = Array.isArray(courseList) ? courseList : [];
        
        setAssignments(assignments);
        setCourses(courses);
        
        // Auto-select first assignment if available
        if (assignments.length > 0) {
          setFormData(prev => ({ ...prev, assignmentId: assignments[0].id }));
        } else {
          setAlert({
            type: 'error',
            message: 'No assignments found. Please create an assignment first using "Upload Answer Keys".'
          });
        }

        // Auto-select first course if available
        if (courses.length > 0) {
          setFormData(prev => ({ ...prev, courseId: courses[0].id }));
        } else {
          // No courses found, default to manual entry
          setUseManualEntry(true);
          setAlert({
            type: 'warning',
            message: 'No courses found. You can still upload assignments using manual student entry, or go to "Manage Students" to set up your courses.'
          });
        }

      } catch (error) {
        console.error('Failed to load data:', error);
        setAssignments([]);
        setCourses([]);
        setUseManualEntry(true);
        setAlert({
          type: 'error',
          message: 'Failed to load data. Make sure the backend is running. Using manual entry mode.'
        });
      }
    };

    loadData();
  }, []);

  // Load students when course changes
  useEffect(() => {
    const loadStudents = async () => {
      if (formData.courseId && !useManualEntry) {
        try {
          const response = await gradingApi.getStudentsByCourse(formData.courseId);
          setStudents(response.students || []);
          
          // Auto-select first student if available
          if (response.students && response.students.length > 0) {
            setFormData(prev => ({ ...prev, studentId: response.students[0].id }));
          } else {
            setAlert({
              type: 'warning',
              message: 'No students found for this course. Go to "Manage Students" to upload student lists, or use manual entry below.'
            });
          }
        } catch (error) {
          console.error('Failed to load students:', error);
          setStudents([]);
        }
      }
    };

    loadStudents();
  }, [formData.courseId, useManualEntry]);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};
    
    if (useManualEntry) {
      // Manual entry validation
      if (!formData.manualStudentName?.trim()) {
        newErrors.manualStudentName = 'Student name is required';
      }
      
      if (!formData.manualStudentEmail?.trim()) {
        newErrors.manualStudentEmail = 'Student email is required';
      } else if (!formData.manualStudentEmail.includes('@')) {
        newErrors.manualStudentEmail = 'Please enter a valid email address';
      }
    } else {
      // Dropdown validation
      if (!formData.courseId) {
        newErrors.courseId = 'Please select a course';
      }
      
      if (!formData.studentId) {
        newErrors.studentId = 'Please select a student';
      }
    }
    
    if (!formData.assignmentId) {
      newErrors.assignmentId = 'Please select an assignment';
    }
    
    if (!selectedFile) {
      newErrors.file = 'Please select a C++ file to upload';
    } else if (!selectedFile.name.endsWith('.cpp')) {
      newErrors.file = 'Please upload a C++ file (.cpp extension)';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setIsDragActive(true);
    } else if (e.type === 'dragleave') {
      setIsDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.name.endsWith('.cpp')) {
        setSelectedFile(file);
        setErrors(prev => ({ ...prev, file: undefined }));
      } else {
        setErrors(prev => ({ ...prev, file: 'Please upload a C++ file (.cpp extension)' }));
      }
    }
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.name.endsWith('.cpp')) {
        setSelectedFile(file);
        setErrors(prev => ({ ...prev, file: undefined }));
      } else {
        setErrors(prev => ({ ...prev, file: 'Please upload a C++ file (.cpp extension)' }));
      }
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    if (errors[name as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm() || !selectedFile) return;
    
    setIsLoading(true);
    setAlert(null);
    
    try {
      let response;
      
      if (useManualEntry) {
        // Use legacy API for manual entry with email
        const formData_api = new FormData();
        formData_api.append('file', selectedFile);
        formData_api.append('manual_student_name', formData.manualStudentName!);
        formData_api.append('manual_student_email', formData.manualStudentEmail!);
        formData_api.append('assignment_id', formData.assignmentId);
        
        const api_response = await fetch('http://localhost:8000/api/submissions/upload/', {
          method: 'POST',
          body: formData_api
        });
        
        if (!api_response.ok) {
          throw new Error(`Upload failed: ${api_response.status}`);
        }
        
        response = await api_response.json();
      } else {
        // Use new student-based API
        response = await gradingApi.uploadSubmissionWithStudent(selectedFile, {
          studentId: formData.studentId,
          assignmentId: formData.assignmentId
        });
      }
      
      const submissionId = response.submission.id;
      
      setAlert({
        type: 'success',
        message: `Assignment uploaded successfully! Submission ID: ${submissionId}. The AI will begin grading shortly.`
      });

      // Automatically start grading
      setTimeout(async () => {
        try {
          setAlert({
            type: 'success',
            message: 'Starting AI grading process...'
          });
          
          const gradingResult = await gradingApi.gradeSubmission(submissionId);
          
          setAlert({
            type: 'success',
            message: (
              <div>
                ✅ Grading complete! Score: {gradingResult.grading_result.total_score}/{gradingResult.grading_result.max_score} ({gradingResult.grading_result.percentage}%)
                <br />
                <a 
                  href={`/results/${submissionId}`}
                  style={{ 
                    color: '#166534', 
                    fontWeight: 'bold', 
                    textDecoration: 'underline',
                    marginTop: '0.5rem',
                    display: 'inline-block'
                  }}
                >
                  👁️ View Detailed Results & AI Feedback
                </a>
              </div>
            ) as any
          });
          
        } catch (gradingError) {
          console.error('Grading failed:', gradingError);
          setAlert({
            type: 'error',
            message: 'Upload successful, but grading failed. Please check your Claude API key.'
          });
        }
      }, 1000);
      
      // Reset form
      setSelectedFile(null);
      setFormData({
        courseId: (courses && courses.length > 0) ? courses[0].id : '',
        studentId: (students && students.length > 0) ? students[0].id : '',
        assignmentId: (assignments && assignments.length > 0) ? assignments[0].id : '',
        manualStudentName: '',
        manualStudentEmail: ''
      });
      setErrors({});
      
    } catch (error: any) {
      console.error('Upload error:', error);
      setAlert({
        type: 'error',
        message: error.response?.data?.message || 'Failed to upload assignment. Please try again.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <UploadContainer>
      <PageHeader>
        <h1>Grade Student Submissions</h1>
        <p>
          As a Teaching Assistant, upload student C++ assignments to be graded against your answer keys. 
          The AI will compare each submission and provide detailed feedback.
        </p>
        {assignments.length === 0 && !alert && (
          <div style={{ 
            background: '#fef3c7', 
            color: '#92400e', 
            padding: '1rem', 
            borderRadius: '6px',
            border: '1px solid #fbbf24',
            marginTop: '1rem'
          }}>
            📝 No assignments found. Please create an assignment first by going to "Upload Answer Keys".
          </div>
        )}
      </PageHeader>

      {alert && (
        <Alert type={alert.type}>
          {alert.message}
        </Alert>
      )}

      <form onSubmit={handleSubmit}>
        <UploadCard>
          <StudentInfoForm>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3>Student Information</h3>
              <button
                type="button"
                onClick={() => setUseManualEntry(!useManualEntry)}
                style={{
                  background: 'none',
                  border: '1px solid #667eea',
                  color: '#667eea',
                  padding: '0.5rem 1rem',
                  borderRadius: '6px',
                  fontSize: '0.875rem',
                  cursor: 'pointer'
                }}
              >
                {useManualEntry ? '📚 Use Course Lists' : '✏️ Manual Entry'}
              </button>
            </div>

            {!useManualEntry ? (
              // Course and Student Dropdowns
              <>
                <FormRow>
                  <FormGroup>
                    <Label htmlFor="courseId">Course *</Label>
                    <Select
                      id="courseId"
                      name="courseId"
                      value={formData.courseId}
                      onChange={handleInputChange}
                      hasError={!!errors.courseId}
                    >
                      <option value="">Select a course</option>
                      {courses.map((course) => (
                        <option key={course.id} value={course.id}>
                          {course.full_course_name} - {course.name}
                        </option>
                      ))}
                    </Select>
                    {errors.courseId && <ErrorText>{errors.courseId}</ErrorText>}
                  </FormGroup>
                  
                  <FormGroup>
                    <Label htmlFor="studentId">Student *</Label>
                    <Select
                      id="studentId"
                      name="studentId"
                      value={formData.studentId}
                      onChange={handleInputChange}
                      hasError={!!errors.studentId}
                      disabled={!formData.courseId}
                    >
                      <option value="">
                        {!formData.courseId ? 'Select a course first' : 'Select a student'}
                      </option>
                      {students.map((student) => (
                        <option key={student.id} value={student.id}>
                          {student.full_name} ({student.email})
                        </option>
                      ))}
                    </Select>
                    {errors.studentId && <ErrorText>{errors.studentId}</ErrorText>}
                  </FormGroup>
                </FormRow>
                
                {students.length === 0 && formData.courseId && (
                  <div style={{ 
                    background: '#fef3c7', 
                    color: '#92400e', 
                    padding: '0.75rem', 
                    borderRadius: '6px',
                    fontSize: '0.875rem',
                    marginBottom: '1rem'
                  }}>
                    📋 No students found for this course. <a 
                      href="/students" 
                      style={{ color: '#92400e', fontWeight: 'bold' }}
                    >
                      Go to "Manage Students"
                    </a> to upload student lists.
                  </div>
                )}
              </>
            ) : (
              // Manual Entry Fields
              <FormRow>
                <FormGroup>
                  <Label htmlFor="manualStudentName">Student Name *</Label>
                  <Input
                    id="manualStudentName"
                    name="manualStudentName"
                    type="text"
                    value={formData.manualStudentName || ''}
                    onChange={handleInputChange}
                    placeholder="Enter student's full name"
                    hasError={!!errors.manualStudentName}
                  />
                  {errors.manualStudentName && <ErrorText>{errors.manualStudentName}</ErrorText>}
                </FormGroup>
                
                <FormGroup>
                  <Label htmlFor="manualStudentEmail">Email *</Label>
                  <Input
                    id="manualStudentEmail"
                    name="manualStudentEmail"
                    type="email"
                    value={formData.manualStudentEmail || ''}
                    onChange={handleInputChange}
                    placeholder="Enter student email"
                    hasError={!!errors.manualStudentEmail}
                  />
                  {errors.manualStudentEmail && <ErrorText>{errors.manualStudentEmail}</ErrorText>}
                </FormGroup>
              </FormRow>
            )}
            
            <FormGroup>
              <Label htmlFor="assignmentId">Assignment *</Label>
              <Select
                id="assignmentId"
                name="assignmentId"
                value={formData.assignmentId}
                onChange={handleInputChange}
                hasError={!!errors.assignmentId}
              >
                <option value="">Select an assignment</option>
                {assignments && assignments.length > 0 ? (
                  assignments.map((assignment) => (
                    <option key={assignment.id} value={assignment.id}>
                      {assignment.name}
                    </option>
                  ))
                ) : (
                  <option disabled>No assignments available</option>
                )}
              </Select>
              {errors.assignmentId && <ErrorText>{errors.assignmentId}</ErrorText>}
            </FormGroup>
          </StudentInfoForm>

          <div>
            <Label>C++ Source File *</Label>
            <DropZone
              isDragActive={isDragActive}
              hasError={!!errors.file}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => document.getElementById('file-input')?.click()}
            >
              <DropZoneContent>
                <UploadIcon>📁</UploadIcon>
                <h3>
                  {isDragActive ? 'Drop the file here' : 'Drag & drop your C++ file here'}
                </h3>
                <p>or click to browse</p>
                <div className="file-types">
                  Supported formats: .cpp files (Max size: 5MB)
                </div>
              </DropZoneContent>
            </DropZone>
            
            <FileInput
              id="file-input"
              type="file"
              accept=".cpp"
              onChange={handleFileSelect}
            />
            
            {errors.file && <ErrorText>{errors.file}</ErrorText>}
            
            {selectedFile && (
              <SelectedFile>
                <div className="file-info">
                  <div>
                    <div className="file-name">{selectedFile.name}</div>
                    <div className="file-size">{formatFileSize(selectedFile.size)}</div>
                  </div>
                  <button
                    type="button"
                    className="remove-file"
                    onClick={() => {
                      setSelectedFile(null);
                      setErrors(prev => ({ ...prev, file: undefined }));
                    }}
                  >
                    Remove
                  </button>
                </div>
              </SelectedFile>
            )}
          </div>
        </UploadCard>

        <SubmitButton
          type="submit"
          $loading={isLoading}
          disabled={isLoading}
        >
          {isLoading ? 'Uploading & Processing...' : 'Submit Assignment for Grading'}
        </SubmitButton>
      </form>
    </UploadContainer>
  );
};

export default UploadAssignment;
