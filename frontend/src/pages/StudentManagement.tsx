import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { gradingApi } from '../services/api';

const ManagementContainer = styled.div`
  padding: 2rem 0;
  max-width: 1200px;
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
    max-width: 800px;
    margin: 0 auto;
  }
`;

const TabContainer = styled.div`
  display: flex;
  border-bottom: 1px solid #e2e8f0;
  margin-bottom: 2rem;
`;

const Tab = styled.button<{ active: boolean }>`
  padding: 1rem 1.5rem;
  border: none;
  background: ${({ active }) => active ? '#667eea' : 'transparent'};
  color: ${({ active }) => active ? 'white' : '#64748b'};
  font-weight: 500;
  border-radius: 8px 8px 0 0;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover {
    background: ${({ active }) => active ? '#667eea' : '#f1f5f9'};
  }
`;

const Card = styled.div`
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  border: 1px solid #e2e8f0;
  padding: 2rem;
  margin-bottom: 2rem;
`;

const CourseGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
`;

const CourseCard = styled.div`
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  
  h3 {
    font-size: 1.25rem;
    font-weight: 600;
    color: #1e293b;
    margin-bottom: 0.5rem;
  }
  
  .course-code {
    font-size: 0.875rem;
    color: #667eea;
    font-weight: 500;
    margin-bottom: 1rem;
  }
  
  .student-count {
    color: #059669;
    font-weight: 500;
  }
`;

const UploadSection = styled.div`
  border: 2px dashed #cbd5e1;
  border-radius: 8px;
  padding: 2rem;
  text-align: center;
  margin-top: 1rem;
  
  &:hover {
    border-color: #667eea;
    background: #f8fafc;
  }
`;

const FileInput = styled.input`
  display: none;
`;

const Button = styled.button<{ variant?: 'primary' | 'secondary' }>`
  background: ${({ variant }) => variant === 'secondary' ? 'white' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'};
  color: ${({ variant }) => variant === 'secondary' ? '#374151' : 'white'};
  border: ${({ variant }) => variant === 'secondary' ? '1px solid #d1d5db' : 'none'};
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
  }
`;

const Select = styled.select`
  width: 100%;
  max-width: 300px;
  padding: 0.75rem 1rem;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 1rem;
  background: white;
  cursor: pointer;
`;

const Alert = styled.div<{ type: 'success' | 'error' | 'warning' }>`
  padding: 1rem;
  border-radius: 6px;
  margin-bottom: 1rem;
  background: ${({ type }) => 
    type === 'success' ? '#dcfce7' : 
    type === 'error' ? '#fecaca' : '#fef3c7'};
  color: ${({ type }) => 
    type === 'success' ? '#166534' : 
    type === 'error' ? '#991b1b' : '#92400e'};
  border: 1px solid ${({ type }) => 
    type === 'success' ? '#bbf7d0' : 
    type === 'error' ? '#fca5a5' : '#fbbf24'};
`;

const StudentList = styled.div`
  max-height: 400px;
  overflow-y: auto;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  
  .student-item {
    padding: 1rem;
    border-bottom: 1px solid #f1f5f9;
    display: flex;
    justify-content: space-between;
    align-items: center;
    
    &:last-child {
      border-bottom: none;
    }
    
    .student-info {
      h4 {
        font-weight: 500;
        color: #374151;
        margin-bottom: 0.25rem;
      }
      
      .student-id {
        font-size: 0.875rem;
        color: #6b7280;
      }
    }
    
    .student-email {
      font-size: 0.875rem;
      color: #6b7280;
    }
  }
`;

const ProgressBar = styled.div`
  background: #f1f5f9;
  border-radius: 4px;
  height: 8px;
  margin: 1rem 0;
  overflow: hidden;
  
  .progress {
    height: 100%;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    transition: width 0.3s ease;
  }
`;

// Types
interface Course {
  id: string;
  name: string;
  course_code: string;
  section: string;
  semester: string;
  full_course_name: string;
  student_count: number;
}

interface Student {
  id: string;
  first_name: string;
  last_name: string;
  full_name: string;
  email: string;
}

interface UploadResult {
  students_processed: number;
  students_created: any[];
  errors: string[];
}

const StudentManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState('courses');
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<string>('');
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [alert, setAlert] = useState<{ type: 'success' | 'error' | 'warning'; message: string } | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Load courses on component mount
  useEffect(() => {
    fetchCourses();
  }, []);

  // Load students when course is selected
  useEffect(() => {
    if (selectedCourse && activeTab === 'students') {
      fetchStudentsByCourse(selectedCourse);
    }
  }, [selectedCourse, activeTab]);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      setAlert(null);
      
      // Using the courses endpoint
      const response = await fetch('http://localhost:8000/api/submissions/courses/');
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const coursesData = await response.json();
      
      console.log('Courses API Response:', coursesData);
      console.log('Is array?', Array.isArray(coursesData));
      
      // Ensure coursesData is always an array
      let courses: Course[] = [];
      
      if (Array.isArray(coursesData)) {
        courses = coursesData;
      } else if (coursesData && Array.isArray(coursesData.results)) {
        // Handle paginated response
        courses = coursesData.results;
      } else if (coursesData && coursesData.data && Array.isArray(coursesData.data)) {
        // Handle wrapped response
        courses = coursesData.data;
      } else {
        console.warn('Unexpected API response format:', coursesData);
        courses = [];
      }
      
      setCourses(courses);
      
      // Auto-select first course
      if (courses.length > 0) {
        setSelectedCourse(courses[0].id);
      } else {
        setAlert({
          type: 'warning',
          message: 'No courses found. Courses will be created automatically when you first use the system.'
        });
      }
      
    } catch (error: any) {
      console.error('Failed to load courses:', error);
      setCourses([]); // Ensure courses is always an array
      setAlert({
        type: 'error',
        message: `Failed to load courses: ${error.message || 'Make sure the backend is running.'}`
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchStudentsByCourse = async (courseId: string) => {
    try {
      setLoading(true);
      
      const response = await fetch(`http://localhost:8000/api/submissions/courses/${courseId}/students/`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Students API Response:', data);
      
      // Ensure students is always an array
      const students = Array.isArray(data.students) ? data.students : [];
      setStudents(students);
      
    } catch (error: any) {
      console.error('Failed to load students:', error);
      setStudents([]); // Ensure students is always an array
      setAlert({
        type: 'error',
        message: `Failed to load students: ${error.message || 'Unknown error'}`
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.type === 'text/csv' || file.name.endsWith('.csv')) {
        setSelectedFile(file);
        setAlert(null);
      } else {
        setAlert({
          type: 'error',
          message: 'Please select a CSV file.'
        });
      }
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !selectedCourse) {
      setAlert({
        type: 'warning',
        message: 'Please select both a course and a CSV file.'
      });
      return;
    }

    setUploading(true);
    setUploadProgress(0);
    setAlert(null);

    let progressInterval: NodeJS.Timeout | undefined;
    let timeoutId: NodeJS.Timeout | undefined;
    let controller: AbortController | undefined;

    try {
      const formData = new FormData();
      formData.append('csv_file', selectedFile);
      formData.append('course_id', selectedCourse);

      // Simulate progress for better UX
      progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90));
      }, 100);

      // Create timeout controller for better error handling
      controller = new AbortController();
      timeoutId = setTimeout(() => controller!.abort(), 60000); // 60 second timeout

      const response = await fetch('http://localhost:8000/api/submissions/students/bulk-upload/', {
        method: 'POST',
        body: formData,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      clearInterval(progressInterval);
      setUploadProgress(100);

      const result = await response.json();

      if (response.ok) {
        setAlert({
          type: 'success',
          message: `Successfully processed ${result.students_processed} students! ${result.errors.length > 0 ? `(${result.errors.length} errors)` : ''}`
        });
        
        // Refresh courses and students
        fetchCourses();
        if (selectedCourse) {
          fetchStudentsByCourse(selectedCourse);
        }
        
        // Reset file
        setSelectedFile(null);
      } else {
        throw new Error(result.error || 'Upload failed');
      }

    } catch (error: any) {
      console.error('Upload error:', error);
      let errorMessage = 'Failed to upload students. Please try again.';
      
      if (error.name === 'AbortError') {
        errorMessage = 'Upload timed out (60s). Your file might be too large or there may be network issues. Try with a smaller file or check your connection.';
      } else if (error.message?.includes('Failed to fetch')) {
        errorMessage = 'Network error: Cannot connect to server. Make sure the backend is running on http://localhost:8000';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setAlert({
        type: 'error',
        message: errorMessage
      });
    } finally {
      // Clean up intervals and timeouts
      if (progressInterval) clearInterval(progressInterval);
      if (timeoutId) clearTimeout(timeoutId);
      
      setUploading(false);
      setTimeout(() => setUploadProgress(0), 2000);
    }
  };

  const downloadSampleCSV = () => {
    const csvContent = `first_name,last_name,email
John,Doe,john.doe@university.edu
Jane,Smith,jane.smith@university.edu
Alice,Johnson,alice.johnson@university.edu`;
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'students_sample.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <ManagementContainer>
      <PageHeader>
        <h1>Student Management</h1>
        <p>
          Manage your CS classes and bulk upload students. Create your class rosters once, 
          then use them for easy assignment submissions without typing student info every time.
        </p>
      </PageHeader>

      {alert && (
        <Alert type={alert.type}>
          {alert.message}
        </Alert>
      )}

      <TabContainer>
        <Tab 
          active={activeTab === 'courses'} 
          onClick={() => setActiveTab('courses')}
        >
          📚 Courses
        </Tab>
        <Tab 
          active={activeTab === 'upload'} 
          onClick={() => setActiveTab('upload')}
        >
          📤 Upload Students
        </Tab>
        <Tab 
          active={activeTab === 'students'} 
          onClick={() => setActiveTab('students')}
        >
          👥 View Students
        </Tab>
      </TabContainer>

      {activeTab === 'courses' && (
        <Card>
          <h2 style={{ marginBottom: '1.5rem', color: '#1e293b' }}>Your CS Courses</h2>
          {loading ? (
            <p>Loading courses...</p>
          ) : (!Array.isArray(courses) || courses.length === 0) ? (
            <p style={{ color: '#6b7280', textAlign: 'center', padding: '2rem' }}>
              No courses found. Courses will be created automatically.
            </p>
          ) : (
            <CourseGrid>
              {Array.isArray(courses) && courses.map((course) => (
                <CourseCard key={course.id}>
                  <h3>{course.name}</h3>
                  <div className="course-code">{course.full_course_name}</div>
                  <div className="student-count">
                    {course.student_count} students enrolled
                  </div>
                </CourseCard>
              ))}
            </CourseGrid>
          )}
        </Card>
      )}

      {activeTab === 'upload' && (
        <Card>
          <h2 style={{ marginBottom: '1.5rem', color: '#1e293b' }}>Bulk Upload Students</h2>
          
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', fontWeight: '500', marginBottom: '0.5rem' }}>
              Select Course:
            </label>
            <Select 
              value={selectedCourse} 
              onChange={(e) => setSelectedCourse(e.target.value)}
            >
              <option value="">Choose a course</option>
              {Array.isArray(courses) && courses.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.full_course_name} - {course.name}
                </option>
              ))}
            </Select>
          </div>

          <UploadSection>
            <div style={{ marginBottom: '1rem' }}>
              <h3>Upload Student CSV</h3>
              <p style={{ color: '#6b7280', marginBottom: '1rem' }}>
                Upload a CSV file with student information. Required columns: first_name, last_name, email
              </p>
              
              <Button 
                variant="secondary" 
                onClick={downloadSampleCSV}
                style={{ marginRight: '1rem' }}
              >
                📥 Download Sample CSV
              </Button>
              
              <Button 
                variant="secondary"
                onClick={() => document.getElementById('csv-input')?.click()}
              >
                📁 Choose CSV File
              </Button>
              
              <FileInput
                id="csv-input"
                type="file"
                accept=".csv"
                onChange={handleFileSelect}
              />
            </div>

            {selectedFile && (
              <div style={{ 
                background: '#f8fafc', 
                padding: '1rem', 
                borderRadius: '6px', 
                marginBottom: '1rem',
                border: '1px solid #e2e8f0'
              }}>
                <strong>Selected file:</strong> {selectedFile.name}
              </div>
            )}

            {uploading && (
              <div>
                <p>Uploading students...</p>
                <ProgressBar>
                  <div className="progress" style={{ width: `${uploadProgress}%` }}></div>
                </ProgressBar>
              </div>
            )}

            <Button 
              onClick={handleUpload}
              disabled={!selectedFile || !selectedCourse || uploading}
            >
              {uploading ? 'Uploading...' : '🚀 Upload Students'}
            </Button>
          </UploadSection>
        </Card>
      )}

      {activeTab === 'students' && (
        <Card>
          <h2 style={{ marginBottom: '1.5rem', color: '#1e293b' }}>View Students</h2>
          
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', fontWeight: '500', marginBottom: '0.5rem' }}>
              Select Course:
            </label>
            <Select 
              value={selectedCourse} 
              onChange={(e) => setSelectedCourse(e.target.value)}
            >
              <option value="">Choose a course</option>
              {Array.isArray(courses) && courses.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.full_course_name} - {course.name} ({course.student_count} students)
                </option>
              ))}
            </Select>
          </div>

          {selectedCourse && (
            <>
              <h3 style={{ marginBottom: '1rem', color: '#374151' }}>
                Enrolled Students ({Array.isArray(students) ? students.length : 0})
              </h3>
              
              {loading ? (
                <p>Loading students...</p>
              ) : (!Array.isArray(students) || students.length === 0) ? (
                <p style={{ color: '#6b7280', textAlign: 'center', padding: '2rem' }}>
                  No students found for this course. Upload some students to get started!
                </p>
              ) : (
                <StudentList>
                  {Array.isArray(students) && students.map((student) => (
                    <div key={student.id} className="student-item">
                      <div className="student-info">
                        <h4>{student.full_name}</h4>
                        <div className="student-email">{student.email}</div>
                      </div>
                    </div>
                  ))}
                </StudentList>
              )}
            </>
          )}
        </Card>
      )}
    </ManagementContainer>
  );
};

export default StudentManagement;
