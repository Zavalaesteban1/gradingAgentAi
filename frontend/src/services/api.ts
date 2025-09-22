import axios from 'axios';

// API Base Configuration
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for auth tokens
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('authToken');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Type Definitions
export interface StudentSubmission {
  id: string;
  studentName: string;
  studentId: string;
  fileName: string;
  code: string;
  submittedAt: string;
  status: 'pending' | 'graded' | 'error';
  grade?: GradingResult;
}

export interface GradingResult {
  totalScore: number;
  maxScore: number;
  percentage: number;
  feedback: {
    correctness: GradingCriteria;
    codeStyle: GradingCriteria;
    efficiency: GradingCriteria;
    documentation: GradingCriteria;
    overallFeedback: string;
  };
  gradedAt: string;
}

export interface GradingCriteria {
  score: number;
  maxScore: number;
  feedback: string;
  suggestions: string[];
}

export interface RubricTemplate {
  id: string;
  name: string;
  description: string;
  criteria: {
    correctness: { weight: number; maxScore: number; description: string };
    codeStyle: { weight: number; maxScore: number; description: string };
    efficiency: { weight: number; maxScore: number; description: string };
    documentation: { weight: number; maxScore: number; description: string };
  };
  createdAt: string;
}

export interface AnalyticsData {
  totalSubmissions: number;
  averageScore: number;
  gradedSubmissions: number;
  pendingSubmissions: number;
  scoreDistribution: { range: string; count: number }[];
  commonIssues: { issue: string; frequency: number }[];
  timeToGrade: number; // average in minutes
}

// API Service Functions
export const gradingApi = {
  // Submission Management
  async uploadSubmission(file: File, metadata: { studentName: string; studentId: string; assignmentId: string }): Promise<{ message: string; submission: StudentSubmission }> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('student_name', metadata.studentName);
    formData.append('student_id', metadata.studentId);
    formData.append('assignment_id', metadata.assignmentId);
    
    const response = await api.post('/submissions/upload/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  },

  async batchUploadSubmissions(files: File[], assignmentId: string): Promise<StudentSubmission[]> {
    const formData = new FormData();
    files.forEach(file => formData.append('files', file));
    formData.append('assignmentId', assignmentId);
    
    const response = await api.post('/submissions/batch-upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  },

  async getSubmissions(filters?: { status?: string; studentId?: string; dateRange?: [string, string] }): Promise<StudentSubmission[]> {
    const response = await api.get('/submissions', { params: filters });
    return response.data;
  },

  async getSubmission(id: string): Promise<StudentSubmission> {
    const response = await api.get(`/submissions/${id}`);
    return response.data;
  },

  // Grading Operations
  async gradeSubmission(submissionId: string): Promise<any> {
    const response = await api.post(`/submissions/${submissionId}/grade/`);
    return response.data;
  },

  async getAssignments(): Promise<any[]> {
    const response = await api.get('/submissions/assignments/');
    console.log('API Response:', response.data); // Debug log
    
    // Ensure we return an array
    if (Array.isArray(response.data)) {
      return response.data;
    } else if (response.data && Array.isArray(response.data.results)) {
      // Handle paginated response
      return response.data.results;
    } else {
      console.warn('Unexpected API response format:', response.data);
      return [];
    }
  },

  async getSubmissionDetails(submissionId: string): Promise<any> {
    const response = await api.get(`/submissions/${submissionId}/`);
    return response.data;
  },

  async createAssignmentWithAnswer(file: File, name: string, description: string, maxScore: number): Promise<any> {
    const formData = new FormData();
    formData.append('reference_file', file);
    formData.append('name', name);
    formData.append('description', description);
    formData.append('max_score', maxScore.toString());
    
    const response = await api.post('/submissions/assignments/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  },

  async batchGradeSubmissions(submissionIds: string[], rubricId?: string): Promise<GradingResult[]> {
    const response = await api.post('/submissions/batch-grade', { 
      submissionIds, 
      rubricId 
    });
    return response.data;
  },

  async updateGrade(submissionId: string, updatedGrade: Partial<GradingResult>): Promise<GradingResult> {
    const response = await api.put(`/submissions/${submissionId}/grade`, updatedGrade);
    return response.data;
  },

  // Rubric Management
  async getRubrics(): Promise<RubricTemplate[]> {
    const response = await api.get('/rubrics');
    return response.data;
  },

  async createRubric(rubric: Omit<RubricTemplate, 'id' | 'createdAt'>): Promise<RubricTemplate> {
    const response = await api.post('/rubrics', rubric);
    return response.data;
  },

  async updateRubric(id: string, rubric: Partial<RubricTemplate>): Promise<RubricTemplate> {
    const response = await api.put(`/rubrics/${id}`, rubric);
    return response.data;
  },

  async deleteRubric(id: string): Promise<void> {
    await api.delete(`/rubrics/${id}`);
  },

  // Analytics
  async getAnalytics(filters?: { dateRange?: [string, string]; assignmentId?: string }): Promise<AnalyticsData> {
    const response = await api.get('/analytics', { params: filters });
    return response.data;
  },

  // Export Functions
  async exportResults(format: 'csv' | 'json' | 'xlsx', filters?: any): Promise<Blob> {
    const response = await api.get('/export', {
      params: { format, ...filters },
      responseType: 'blob'
    });
    return response.data;
  }
};

export default api;
