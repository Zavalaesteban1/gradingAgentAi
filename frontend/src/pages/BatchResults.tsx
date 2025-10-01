import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { gradingApi } from '../services/api';

const ResultsContainer = styled.div`
  padding: 2rem 0;
  max-width: 1200px;
  margin: 0 auto;
`;

const Header = styled.div`
  background: white;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  padding: 2rem;
  margin-bottom: 2rem;
  
  .header-content {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1.5rem;
    
    h1 {
      font-size: 2rem;
      font-weight: 700;
      color: #1e293b;
      margin: 0;
    }
    
    .status-badge {
      padding: 0.5rem 1rem;
      border-radius: 9999px;
      font-size: 0.875rem;
      font-weight: 600;
      text-transform: uppercase;
    }
  }
  
  .stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: 1.5rem;
    
    .stat-item {
      text-align: center;
      
      .stat-number {
        font-size: 2rem;
        font-weight: 700;
        color: #059669;
        margin-bottom: 0.25rem;
      }
      
      .stat-label {
        font-size: 0.875rem;
        color: #6b7280;
        text-transform: uppercase;
        letter-spacing: 0.05em;
      }
    }
  }
`;

const ResultsTable = styled.div`
  background: white;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  overflow: hidden;
  
  .table-header {
    background: #f8fafc;
    padding: 1rem 2rem;
    border-bottom: 1px solid #e2e8f0;
    display: grid;
    grid-template-columns: 2fr 1fr 100px 100px 100px 100px 80px;
    gap: 1rem;
    font-size: 0.875rem;
    font-weight: 600;
    color: #374151;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }
  
  .table-body {
    max-height: 600px;
    overflow-y: auto;
  }
  
  .result-row {
    padding: 1rem 2rem;
    border-bottom: 1px solid #f1f5f9;
    display: grid;
    grid-template-columns: 2fr 1fr 100px 100px 100px 100px 80px;
    gap: 1rem;
    align-items: center;
    transition: all 0.2s ease;
    cursor: pointer;
    
    &:hover {
      background: #f8fafc;
      transform: translateX(2px);
    }
    
    &.clickable:hover {
      background: #e0f2fe;
      border-left: 3px solid #0284c7;
    }
    
    &:last-child {
      border-bottom: none;
    }
  }
  
  .student-info {
    .student-name {
      font-weight: 600;
      color: #1e293b;
      margin-bottom: 0.25rem;
    }
    
    .file-name {
      font-size: 0.875rem;
      color: #6b7280;
    }
  }
  
  .score {
    font-weight: 600;
    text-align: center;
  }
  
  .status-indicator {
    display: inline-block;
    width: 8px;
    height: 8px;
    border-radius: 50%;
    margin: 0 auto;
  }
`;

const AnalyticsSection = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
  margin-bottom: 2rem;
  
  .analytics-card {
    background: white;
    border-radius: 12px;
    border: 1px solid #e2e8f0;
    padding: 1.5rem;
    
    h3 {
      font-size: 1.125rem;
      font-weight: 600;
      color: #1e293b;
      margin: 0 0 1rem 0;
    }
  }
  
  .grade-distribution {
    .grade-bars {
      display: flex;
      align-items: end;
      gap: 0.5rem;
      height: 120px;
      margin-bottom: 1rem;
    }
    
    .grade-bar {
      flex: 1;
      background: linear-gradient(to top, #3b82f6, #60a5fa);
      border-radius: 4px 4px 0 0;
      min-height: 4px;
      display: flex;
      align-items: end;
      justify-content: center;
      color: white;
      font-size: 0.75rem;
      font-weight: 600;
      padding-bottom: 4px;
      
      &.grade-a { background: linear-gradient(to top, #059669, #10b981); }
      &.grade-b { background: linear-gradient(to top, #0891b2, #06b6d4); }
      &.grade-c { background: linear-gradient(to top, #d97706, #f59e0b); }
      &.grade-d { background: linear-gradient(to top, #dc2626, #ef4444); }
      &.grade-f { background: linear-gradient(to top, #7c2d12, #dc2626); }
    }
    
    .grade-labels {
      display: flex;
      justify-content: space-between;
      font-size: 0.875rem;
      color: #6b7280;
      font-weight: 500;
    }
  }
  
  .error-analysis {
    .error-item {
      background: #fef2f2;
      border-left: 3px solid #ef4444;
      padding: 0.75rem;
      margin-bottom: 0.5rem;
      border-radius: 0 4px 4px 0;
      
      .error-type {
        font-weight: 600;
        color: #dc2626;
        font-size: 0.875rem;
      }
      
      .error-count {
        color: #6b7280;
        font-size: 0.75rem;
      }
    }
    
    .no-errors {
      text-align: center;
      color: #059669;
      font-size: 0.875rem;
      padding: 1rem;
      background: #f0fdf4;
      border-radius: 6px;
      border: 1px solid #bbf7d0;
    }
  }
`;

const FilterBar = styled.div`
  background: white;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
  padding: 1rem 2rem;
  margin-bottom: 2rem;
  display: flex;
  gap: 1rem;
  align-items: center;
  flex-wrap: wrap;
  
  .filter-group {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    
    label {
      font-size: 0.875rem;
      font-weight: 500;
      color: #374151;
    }
    
    select, input {
      padding: 0.5rem 0.75rem;
      border: 1px solid #d1d5db;
      border-radius: 4px;
      font-size: 0.875rem;
      
      &:focus {
        outline: none;
        border-color: #667eea;
        box-shadow: 0 0 0 2px rgba(102, 126, 234, 0.1);
      }
    }
  }
  
  .actions-group {
    display: flex;
    gap: 0.5rem;
    margin-left: auto;
  }
  
  .action-btn {
    background: #6b7280;
    color: white;
    border: none;
    padding: 0.5rem 1rem;
    border-radius: 4px;
    font-size: 0.875rem;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 0.25rem;
    
    &:hover {
      background: #4b5563;
    }
    
    &.primary {
      background: #3b82f6;
      
      &:hover {
        background: #2563eb;
      }
    }
    
    &.danger {
      background: #dc2626;
      
      &:hover {
        background: #b91c1c;
      }
    }
  }
`;

const LoadingSpinner = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 400px;
  font-size: 1.2rem;
  color: #64748b;
`;

const ErrorMessage = styled.div`
  background: #fecaca;
  color: #991b1b;
  padding: 1rem;
  border-radius: 6px;
  text-align: center;
  margin: 2rem 0;
`;

interface BatchResult {
  id: string;
  student_name: string;
  file_name: string;
  status: 'pending' | 'grading' | 'graded' | 'error';
  submitted_at: string;
  graded_at?: string;
  total_score?: number;
  percentage?: number;
  error_message?: string;
  compilation_status?: 'success' | 'error' | 'warning';
  grading_details?: {
    correctness_score: number;
    code_style_score: number;
    efficiency_score: number;
    documentation_score: number;
    overall_feedback: string;
    processing_time: number;
    compilation_errors?: string[];
    style_warnings?: string[];
    suggestions?: string;
  };
}

interface BatchData {
  batch_job: {
    id: string;
    status: string;
    assignment_name: string;
    total_files: number;
    processed_files: number;
    successful_grades: number;
    failed_grades: number;
    average_score?: number;
    highest_score?: number;
    lowest_score?: number;
    median_score?: number;
    processing_time_total?: number;
    compilation_success_rate?: number;
    created_at: string;
    completed_at?: string;
  };
  results: BatchResult[];
  error_summary?: {
    json_parse_errors: number;
    compilation_errors: number;
    timeout_errors: number;
    other_errors: number;
  };
}

const BatchResults: React.FC = () => {
  const { batchJobId } = useParams<{ batchJobId: string }>();
  const navigate = useNavigate();
  const [batchData, setBatchData] = useState<BatchData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortField, setSortField] = useState<'name' | 'score' | 'status'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showErrorDetails, setShowErrorDetails] = useState(false);
  const [selectedGradeRange, setSelectedGradeRange] = useState('all');

  useEffect(() => {
    const fetchBatchResults = async () => {
      if (!batchJobId) return;
      
      try {
        const data = await gradingApi.getBatchResults(batchJobId);
        setBatchData(data);
      } catch (err: any) {
        setError('Failed to load batch results');
        console.error('Error loading batch results:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchBatchResults();
  }, [batchJobId]);

  if (loading) {
    return (
      <ResultsContainer>
        <LoadingSpinner>Loading batch results...</LoadingSpinner>
      </ResultsContainer>
    );
  }

  if (error || !batchData) {
    return (
      <ResultsContainer>
        <ErrorMessage>{error || 'No batch data available'}</ErrorMessage>
      </ResultsContainer>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'graded': return '#059669';
      case 'grading': return '#d97706';
      case 'error': return '#dc2626';
      default: return '#6b7280';
    }
  };

  const getStatusBadgeStyle = (status: string) => {
    const styles: Record<string, any> = {
      pending: { background: '#fef3c7', color: '#92400e' },
      processing: { background: '#dbeafe', color: '#1d4ed8' },
      completed: { background: '#dcfce7', color: '#166534' },
      failed: { background: '#fecaca', color: '#991b1b' }
    };
    return styles[status] || {};
  };

  const filteredAndSortedResults = batchData.results
    .filter(result => {
      const matchesSearch = result.student_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           result.file_name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = filterStatus === 'all' || result.status === filterStatus;
      
      let matchesGradeRange = true;
      if (selectedGradeRange !== 'all' && result.percentage !== undefined) {
        switch (selectedGradeRange) {
          case 'A': matchesGradeRange = result.percentage >= 90; break;
          case 'B': matchesGradeRange = result.percentage >= 80 && result.percentage < 90; break;
          case 'C': matchesGradeRange = result.percentage >= 70 && result.percentage < 80; break;
          case 'D': matchesGradeRange = result.percentage >= 60 && result.percentage < 70; break;
          case 'F': matchesGradeRange = result.percentage < 60; break;
        }
      }
      
      return matchesSearch && matchesStatus && matchesGradeRange;
    })
    .sort((a, b) => {
      let comparison = 0;
      
      switch (sortField) {
        case 'name':
          comparison = a.student_name.localeCompare(b.student_name);
          break;
        case 'score':
          comparison = (a.percentage || 0) - (b.percentage || 0);
          break;
        case 'status':
          comparison = a.status.localeCompare(b.status);
          break;
      }
      
      return sortOrder === 'asc' ? comparison : -comparison;
    });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getGradeDistribution = () => {
    const gradedResults = batchData?.results.filter(r => r.status === 'graded' && r.percentage) || [];
    const distribution = { A: 0, B: 0, C: 0, D: 0, F: 0 };
    
    gradedResults.forEach(result => {
      const percentage = result.percentage || 0;
      if (percentage >= 90) distribution.A++;
      else if (percentage >= 80) distribution.B++;
      else if (percentage >= 70) distribution.C++;
      else if (percentage >= 60) distribution.D++;
      else distribution.F++;
    });
    
    return distribution;
  };
  
  const getErrorAnalysis = () => {
    const errorResults = batchData?.results.filter(r => r.status === 'error') || [];
    const errorTypes: Record<string, number> = {};
    
    errorResults.forEach(result => {
      const message = result.error_message || 'Unknown error';
      if (message.includes('JSON') || message.includes('parse')) {
        errorTypes['JSON Parsing Error'] = (errorTypes['JSON Parsing Error'] || 0) + 1;
      } else if (message.includes('compilation') || message.includes('compile')) {
        errorTypes['Compilation Error'] = (errorTypes['Compilation Error'] || 0) + 1;
      } else if (message.includes('timeout')) {
        errorTypes['Processing Timeout'] = (errorTypes['Processing Timeout'] || 0) + 1;
      } else {
        errorTypes['Other Error'] = (errorTypes['Other Error'] || 0) + 1;
      }
    });
    
    return errorTypes;
  };

  const exportResults = (format: 'csv' | 'detailed') => {
    if (format === 'csv') {
      const headers = ['Student Name', 'File Name', 'Status', 'Score', 'Percentage', 'Submitted At', 'Graded At'];
      const csvContent = [
        headers.join(','),
        ...filteredAndSortedResults.map(result => [
          `"${result.student_name}"`,
          `"${result.file_name}"`,
          result.status,
          result.total_score || '',
          result.percentage || '',
          formatDate(result.submitted_at),
          result.graded_at ? formatDate(result.graded_at) : ''
        ].join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `batch-results-${batchJobId}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
    } else {
      // Detailed export with feedback
      const headers = [
        'Student Name', 'File Name', 'Status', 'Total Score', 'Percentage',
        'Correctness', 'Style', 'Efficiency', 'Documentation',
        'Overall Feedback', 'Suggestions', 'Error Message', 'Processing Time'
      ];
      const csvContent = [
        headers.join(','),
        ...filteredAndSortedResults.map(result => [
          `"${result.student_name}"`,
          `"${result.file_name}"`,
          result.status,
          result.total_score || '',
          result.percentage || '',
          result.grading_details?.correctness_score || '',
          result.grading_details?.code_style_score || '',
          result.grading_details?.efficiency_score || '',
          result.grading_details?.documentation_score || '',
          `"${(result.grading_details?.overall_feedback || '').replace(/"/g, '""')}"`,
          `"${(result.grading_details?.suggestions || '').replace(/"/g, '""')}"`,
          `"${(result.error_message || '').replace(/"/g, '""')}"`,
          `"${result.grading_details?.processing_time || ''}s"`
        ].join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `batch-results-detailed-${batchJobId}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
    }
  };
  
  const retryFailedGradings = async () => {
    if (!batchJobId) return;
    try {
      // This would need to be implemented in the backend
      console.log('Retrying failed gradings...');
      alert('Retry functionality would be implemented here');
    } catch (error) {
      console.error('Error retrying failed gradings:', error);
    }
  };

  const handleResultClick = (result: BatchResult) => {
    if (result.status === 'graded' && result.id) {
      // Navigate to grading results with batch context
      navigate(`/submissions/${result.id}/results?from=batch&batchId=${batchJobId}`);
    }
  };

  return (
    <ResultsContainer>
      <Header>
        <div className="header-content">
          <h1>Batch Results: {batchData.batch_job.assignment_name}</h1>
          <span 
            className="status-badge" 
            style={getStatusBadgeStyle(batchData.batch_job.status)}
          >
            {batchData.batch_job.status}
          </span>
        </div>
        
        <div className="stats-grid">
          <div className="stat-item">
            <div className="stat-number">{batchData.batch_job.total_files}</div>
            <div className="stat-label">Total Files</div>
          </div>
          <div className="stat-item">
            <div className="stat-number" style={{ color: '#059669' }}>
              {batchData.batch_job.successful_grades}
            </div>
            <div className="stat-label">Graded</div>
          </div>
          <div className="stat-item">
            <div className="stat-number" style={{ color: batchData.batch_job.failed_grades > 0 ? '#dc2626' : '#059669' }}>
              {batchData.batch_job.failed_grades}
            </div>
            <div className="stat-label">Failed</div>
          </div>
          <div className="stat-item">
            <div className="stat-number">
              {batchData.batch_job.average_score?.toFixed(1) || '0'}%
            </div>
            <div className="stat-label">Average</div>
          </div>
          <div className="stat-item">
            <div className="stat-number">
              {batchData.batch_job.median_score?.toFixed(1) || '0'}%
            </div>
            <div className="stat-label">Median</div>
          </div>
          <div className="stat-item">
            <div className="stat-number">
              {batchData.batch_job.highest_score?.toFixed(1) || '0'}%
            </div>
            <div className="stat-label">Highest</div>
          </div>
          <div className="stat-item">
            <div className="stat-number">
              {batchData.batch_job.processing_time_total ? 
                `${Math.round(batchData.batch_job.processing_time_total / 60)}m` : '0m'}
            </div>
            <div className="stat-label">Total Time</div>
          </div>
          <div className="stat-item">
            <div className="stat-number">
              {batchData.batch_job.compilation_success_rate?.toFixed(0) || '0'}%
            </div>
            <div className="stat-label">Compiled</div>
          </div>
        </div>
      </Header>

      <AnalyticsSection>
        <div className="analytics-card">
          <h3>📊 Grade Distribution</h3>
          <div className="grade-distribution">
            <div className="grade-bars">
              {Object.entries(getGradeDistribution()).map(([grade, count]) => {
                const maxCount = Math.max(...Object.values(getGradeDistribution()));
                const height = maxCount > 0 ? (count / maxCount) * 100 : 0;
                return (
                  <div 
                    key={grade}
                    className={`grade-bar grade-${grade.toLowerCase()}`}
                    style={{ height: `${height}%` }}
                    title={`${grade}: ${count} students`}
                  >
                    {count > 0 && count}
                  </div>
                );
              })}
            </div>
            <div className="grade-labels">
              <span>A (90-100%)</span>
              <span>B (80-89%)</span>
              <span>C (70-79%)</span>
              <span>D (60-69%)</span>
              <span>F (&lt;60%)</span>
            </div>
          </div>
        </div>
        
        <div className="analytics-card">
          <h3>⚠️ Error Analysis</h3>
          <div className="error-analysis">
            {Object.keys(getErrorAnalysis()).length === 0 ? (
              <div className="no-errors">
                ✅ No errors detected in this batch
              </div>
            ) : (
              Object.entries(getErrorAnalysis()).map(([errorType, count]) => (
                <div key={errorType} className="error-item">
                  <div className="error-type">{errorType}</div>
                  <div className="error-count">{count} occurrence{count !== 1 ? 's' : ''}</div>
                </div>
              ))
            )}
          </div>
        </div>
      </AnalyticsSection>

      <AnalyticsSection>
        <div className="analytics-card">
          <h3>💬 Feedback Summary</h3>
          <div className="feedback-summary">
            {batchData && (() => {
              const gradedResults = batchData.results.filter(r => r.status === 'graded' && r.grading_details);
              const commonIssues = [];
              
              // Analyze common issues
              let compilationIssues = 0;
              let styleIssues = 0;
              let logicIssues = 0;
              let docIssues = 0;
              
              gradedResults.forEach(result => {
                const details = result.grading_details;
                if (details) {
                  if (details.correctness_score < 15) logicIssues++;
                  if (details.code_style_score < 15) styleIssues++;
                  if (details.documentation_score < 8) docIssues++;
                }
              });
              
              const totalGraded = gradedResults.length;
              
              return (
                <div style={{ fontSize: '0.875rem', lineHeight: '1.5' }}>
                  {totalGraded === 0 ? (
                    <div style={{ color: '#6b7280', textAlign: 'center', padding: '1rem' }}>
                      No graded submissions to analyze
                    </div>
                  ) : (
                    <>
                      <div style={{ marginBottom: '0.75rem' }}>
                        <strong>Common Areas for Improvement:</strong>
                      </div>
                      {logicIssues > totalGraded * 0.3 && (
                        <div style={{ background: '#fef3c7', padding: '0.5rem', borderRadius: '4px', marginBottom: '0.5rem' }}>
                          🔍 <strong>{Math.round((logicIssues/totalGraded)*100)}%</strong> need algorithm/logic improvements
                        </div>
                      )}
                      {styleIssues > totalGraded * 0.3 && (
                        <div style={{ background: '#ddd6fe', padding: '0.5rem', borderRadius: '4px', marginBottom: '0.5rem' }}>
                          🎨 <strong>{Math.round((styleIssues/totalGraded)*100)}%</strong> need code style improvements
                        </div>
                      )}
                      {docIssues > totalGraded * 0.3 && (
                        <div style={{ background: '#fecaca', padding: '0.5rem', borderRadius: '4px', marginBottom: '0.5rem' }}>
                          📝 <strong>{Math.round((docIssues/totalGraded)*100)}%</strong> need better documentation
                        </div>
                      )}
                      {logicIssues <= totalGraded * 0.3 && styleIssues <= totalGraded * 0.3 && docIssues <= totalGraded * 0.3 && (
                        <div style={{ background: '#dcfce7', padding: '0.5rem', borderRadius: '4px', color: '#166534' }}>
                          ✨ Overall strong performance across all areas!
                        </div>
                      )}
                    </>
                  )}
                </div>
              );
            })()}
          </div>
        </div>
        
        <div className="analytics-card">
          <h3>⏱️ Processing Insights</h3>
          <div className="processing-insights">
            {batchData && (() => {
              const gradedResults = batchData.results.filter(r => r.status === 'graded' && r.grading_details?.processing_time);
              const avgProcessingTime = gradedResults.length > 0 
                ? gradedResults.reduce((sum, r) => sum + (r.grading_details?.processing_time || 0), 0) / gradedResults.length 
                : 0;
              
              const successRate = batchData.batch_job.total_files > 0 
                ? (batchData.batch_job.successful_grades / batchData.batch_job.total_files) * 100 
                : 0;
                
              return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: '#6b7280', fontSize: '0.875rem' }}>Average Processing Time:</span>
                    <span style={{ fontWeight: '600', color: '#1e293b' }}>
                      {avgProcessingTime.toFixed(1)}s
                    </span>
                  </div>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: '#6b7280', fontSize: '0.875rem' }}>Success Rate:</span>
                    <span style={{ 
                      fontWeight: '600', 
                      color: successRate >= 90 ? '#059669' : successRate >= 75 ? '#d97706' : '#dc2626' 
                    }}>
                      {successRate.toFixed(1)}%
                    </span>
                  </div>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: '#6b7280', fontSize: '0.875rem' }}>Batch Completed:</span>
                    <span style={{ fontWeight: '600', color: '#1e293b' }}>
                      {batchData.batch_job.completed_at ? formatDate(batchData.batch_job.completed_at) : 'In Progress'}
                    </span>
                  </div>
                  
                  {batchData.batch_job.compilation_success_rate !== undefined && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ color: '#6b7280', fontSize: '0.875rem' }}>Compilation Rate:</span>
                      <span style={{ 
                        fontWeight: '600', 
                        color: batchData.batch_job.compilation_success_rate >= 90 ? '#059669' : '#dc2626' 
                      }}>
                        {batchData.batch_job.compilation_success_rate.toFixed(1)}%
                      </span>
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        </div>
      </AnalyticsSection>

      <FilterBar>
        <div className="filter-group">
          <label>Search:</label>
          <input
            type="text"
            placeholder="Student name or file..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="filter-group">
          <label>Status:</label>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="all">All</option>
            <option value="graded">Graded</option>
            <option value="error">Error</option>
            <option value="pending">Pending</option>
          </select>
        </div>
        
        <div className="filter-group">
          <label>Grade:</label>
          <select
            value={selectedGradeRange}
            onChange={(e) => setSelectedGradeRange(e.target.value)}
          >
            <option value="all">All Grades</option>
            <option value="A">A (90-100%)</option>
            <option value="B">B (80-89%)</option>
            <option value="C">C (70-79%)</option>
            <option value="D">D (60-69%)</option>
            <option value="F">F (&lt;60%)</option>
          </select>
        </div>
        
        <div className="filter-group">
          <label>Sort by:</label>
          <select
            value={`${sortField}-${sortOrder}`}
            onChange={(e) => {
              const [field, order] = e.target.value.split('-');
              setSortField(field as 'name' | 'score' | 'status');
              setSortOrder(order as 'asc' | 'desc');
            }}
          >
            <option value="name-asc">Name A-Z</option>
            <option value="name-desc">Name Z-A</option>
            <option value="score-desc">Score High-Low</option>
            <option value="score-asc">Score Low-High</option>
            <option value="status-asc">Status</option>
          </select>
        </div>
        
        <div className="actions-group">
          <button className="action-btn" onClick={() => exportResults('csv')}>
            📊 Export CSV
          </button>
          <button className="action-btn" onClick={() => exportResults('detailed')}>
            📋 Detailed Export
          </button>
          {batchData && batchData.batch_job.failed_grades > 0 && (
            <button className="action-btn danger" onClick={retryFailedGradings}>
              🔄 Retry Failed
            </button>
          )}
        </div>
      </FilterBar>

      <ResultsTable>
        <div className="table-header">
          <div>Student</div>
          <div>File</div>
          <div>Score</div>
          <div>Style</div>
          <div>Efficiency</div>
          <div>Docs</div>
          <div>Status</div>
        </div>
        
        <div className="table-body">
          {filteredAndSortedResults.map((result) => (
            <div 
              key={result.id} 
              className={`result-row ${result.status === 'graded' ? 'clickable' : ''}`}
              onClick={() => handleResultClick(result)}
              title={result.status === 'graded' ? 'Click to view detailed results' : undefined}
            >
              <div className="student-info">
                <div className="student-name">{result.student_name}</div>
                <div className="file-name">{result.file_name}</div>
              </div>
              
              <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                {result.graded_at ? formatDate(result.graded_at) : '-'}
              </div>
              
              <div className="score" style={{ color: result.percentage ? '#059669' : '#6b7280' }}>
                {result.percentage ? `${result.percentage.toFixed(0)}%` : '-'}
              </div>
              
              <div className="score" style={{ fontSize: '0.875rem' }}>
                {result.grading_details?.code_style_score || '-'}
              </div>
              
              <div className="score" style={{ fontSize: '0.875rem' }}>
                {result.grading_details?.efficiency_score || '-'}
              </div>
              
              <div className="score" style={{ fontSize: '0.875rem' }}>
                {result.grading_details?.documentation_score || '-'}
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.25rem' }}>
                <div 
                  className="status-indicator"
                  style={{ backgroundColor: getStatusColor(result.status) }}
                  title={result.status}
                />
                {result.status === 'graded' && (
                  <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>→</span>
                )}
              </div>
            </div>
          ))}
          
          {filteredAndSortedResults.length === 0 && (
            <div style={{ 
              padding: '2rem', 
              textAlign: 'center', 
              color: '#6b7280',
              fontSize: '0.875rem' 
            }}>
              No results match your filters
            </div>
          )}
        </div>
      </ResultsTable>
    </ResultsContainer>
  );
};

export default BatchResults;
