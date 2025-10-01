import React, { useState, useCallback, useEffect } from 'react';
import styled from 'styled-components';
import { gradingApi } from '../services/api';

const BatchContainer = styled.div`
  padding: 2rem 0;
  max-width: 900px;
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

const UploadSection = styled.div`
  background: white;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  padding: 2rem;
  margin-bottom: 2rem;
`;

const DropZone = styled.div<{ isDragActive: boolean; hasFiles?: boolean }>`
  border: 2px dashed ${({ isDragActive, hasFiles }) => 
    hasFiles ? '#059669' :
    isDragActive ? '#667eea' : '#cbd5e1'};
  border-radius: 8px;
  padding: 3rem 2rem;
  text-align: center;
  transition: all 0.3s ease;
  background: ${({ isDragActive, hasFiles }) => 
    hasFiles ? '#f0fdf4' :
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

const AssignmentSelect = styled.div`
  margin-bottom: 2rem;
  
  label {
    display: block;
    font-weight: 500;
    color: #374151;
    margin-bottom: 0.5rem;
  }
  
  select {
    width: 100%;
    padding: 0.75rem 1rem;
    border: 1px solid #d1d5db;
    border-radius: 6px;
    font-size: 1rem;
    background: white;
    cursor: pointer;
    
    &:focus {
      outline: none;
      border-color: #667eea;
      box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
    }
  }
`;

const FileList = styled.div`
  background: #f8fafc;
  border-radius: 8px;
  padding: 1rem;
  margin-top: 1rem;
  max-height: 300px;
  overflow-y: auto;
  
  .file-count {
    font-weight: 600;
    color: #059669;
    margin-bottom: 1rem;
  }
  
  .file-item {
    display: flex;
    justify-content: between;
    align-items: center;
    padding: 0.5rem;
    margin-bottom: 0.25rem;
    background: white;
    border-radius: 4px;
    font-size: 0.9rem;
    
    .file-name {
      flex: 1;
      color: #374151;
    }
    
    .file-size {
      color: #6b7280;
      margin-left: 0.5rem;
    }
  }
`;

const ProcessingStatus = styled.div`
  background: white;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  padding: 2rem;
  margin-bottom: 2rem;
  
  .status-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1.5rem;
    
    h3 {
      font-size: 1.25rem;
      font-weight: 600;
      color: #1e293b;
      margin: 0;
    }
    
    .status-badge {
      padding: 0.25rem 0.75rem;
      border-radius: 9999px;
      font-size: 0.75rem;
      font-weight: 500;
      text-transform: uppercase;
    }
  }
  
  .progress-bar {
    width: 100%;
    height: 8px;
    background: #f1f5f9;
    border-radius: 4px;
    overflow: hidden;
    margin-bottom: 1rem;
    
    .progress-fill {
      height: 100%;
      background: linear-gradient(135deg, #059669 0%, #10b981 100%);
      transition: width 0.3s ease;
    }
  }
  
  .progress-stats {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
    gap: 1rem;
    
    .stat {
      text-align: center;
      
      .stat-number {
        font-size: 1.5rem;
        font-weight: 700;
        color: #059669;
      }
      
      .stat-label {
        font-size: 0.75rem;
        color: #6b7280;
        text-transform: uppercase;
        letter-spacing: 0.05em;
      }
    }
  }
`;

const ActionButton = styled.button<{ variant?: 'primary' | 'secondary' }>`
  background: ${({ variant }) => variant === 'secondary' ? '#6b7280' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'};
  color: white;
  border: none;
  padding: 1rem 2rem;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.3s ease, transform 0.2s ease;
  
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

interface Assignment {
  id: string;
  name: string;
  description: string;
  max_score: number;
}

interface BatchStatus {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  assignment_name: string;
  total_files: number;
  processed_files: number;
  successful_grades: number;
  failed_grades: number;
  progress_percentage: number;
  average_score?: number;
  created_at: string;
}

const BatchGrading: React.FC = () => {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [selectedAssignment, setSelectedAssignment] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);
  const [isDragActive, setIsDragActive] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [batchJobId, setBatchJobId] = useState<string | null>(null);
  const [batchStatus, setBatchStatus] = useState<BatchStatus | null>(null);
  const [alert, setAlert] = useState<{ type: 'success' | 'error' | 'warning'; message: string } | null>(null);

  // Load assignments on mount
  useEffect(() => {
    const loadAssignments = async () => {
      try {
        const assignmentList = await gradingApi.getAssignments();
        const assignments = Array.isArray(assignmentList) ? assignmentList : [];
        setAssignments(assignments);
        
        if (assignments.length > 0) {
          setSelectedAssignment(assignments[0].id);
        }
      } catch (error) {
        console.error('Failed to load assignments:', error);
        setAlert({
          type: 'error',
          message: 'Failed to load assignments. Please ensure the backend is running.'
        });
      }
    };

    loadAssignments();
  }, []);

  // Poll batch status when batch job exists and not completed
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (batchJobId && (!batchStatus || (batchStatus.status !== 'completed' && batchStatus.status !== 'failed'))) {
      // Start polling immediately
      const pollStatus = async () => {
        try {
          const status = await gradingApi.getBatchStatus(batchJobId);
          setBatchStatus(status);
          
          if (status.status === 'completed' || status.status === 'failed') {
            setIsUploading(false);
            if (interval) clearInterval(interval);
          }
        } catch (error) {
          console.error('Failed to get batch status:', error);
          setIsUploading(false);
          if (interval) clearInterval(interval);
        }
      };

      // Poll immediately
      pollStatus();
      
      // Then poll every 2 seconds
      interval = setInterval(pollStatus, 2000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [batchJobId]);

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
    
    if (e.dataTransfer.files) {
      setSelectedFiles(e.dataTransfer.files);
    }
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setSelectedFiles(e.target.files);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleUpload = async () => {
    if (!selectedFiles || !selectedAssignment) return;

    setIsUploading(true);
    setAlert(null);
    setBatchStatus(null); // Reset previous status

    try {
      const response = await gradingApi.batchUploadSubmissions(selectedFiles, selectedAssignment);
      setBatchJobId(response.batch_job_id);

      setAlert({
        type: 'success',
        message: `Batch job created! Starting to process ${response.valid_files} files...`
      });

      // Clear files
      setSelectedFiles(null);
      
      // Don't set isUploading to false here - let the polling handle it
    } catch (error: any) {
      setIsUploading(false); // Only set false on error
      setAlert({
        type: 'error',
        message: `Upload failed: ${error.response?.data?.error || error.message}`
      });
    }
  };

  const viewResults = () => {
    if (batchJobId) {
      window.open(`/batch-results/${batchJobId}`, '_blank');
    }
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, any> = {
      pending: { background: '#fef3c7', color: '#92400e' },
      processing: { background: '#dbeafe', color: '#1d4ed8' },
      completed: { background: '#dcfce7', color: '#166534' },
      failed: { background: '#fecaca', color: '#991b1b' }
    };

    return (
      <span className="status-badge" style={styles[status] || {}}>
        {status}
      </span>
    );
  };

  return (
    <BatchContainer>
      <PageHeader>
        <h1>Batch Grading</h1>
        <p>
          Upload multiple C++ files and let the AI grade all students automatically. 
          Perfect for processing entire classes of 250+ students.
        </p>
      </PageHeader>

      {alert && (
        <Alert type={alert.type}>
          {alert.message}
        </Alert>
      )}

      <UploadSection>
        <AssignmentSelect>
          <label htmlFor="assignment">Select Assignment</label>
          <select
            id="assignment"
            value={selectedAssignment}
            onChange={(e) => setSelectedAssignment(e.target.value)}
            disabled={isUploading}
          >
            <option value="">Choose an assignment...</option>
            {assignments.map((assignment) => (
              <option key={assignment.id} value={assignment.id}>
                {assignment.name}
              </option>
            ))}
          </select>
        </AssignmentSelect>

        <DropZone
          isDragActive={isDragActive}
          hasFiles={!!selectedFiles}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => document.getElementById('batch-file-input')?.click()}
        >
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>
            {selectedFiles ? '📁' : isDragActive ? '📂' : '📋'}
          </div>
          <h3 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '1rem' }}>
            {selectedFiles 
              ? `${selectedFiles.length} files selected`
              : isDragActive 
                ? 'Drop files here' 
                : 'Drop C++ files here or click to browse'
            }
          </h3>
          <p style={{ color: '#6b7280', marginBottom: '0.5rem' }}>
            {selectedFiles ? 'Click to add more files' : 'Select multiple .cpp files from your students'}
          </p>
          <div style={{ fontSize: '0.875rem', color: '#9ca3af' }}>
            Supported: .cpp files • Max: 100MB total
          </div>
        </DropZone>

        <FileInput
          id="batch-file-input"
          type="file"
          accept=".cpp"
          multiple
          onChange={handleFileSelect}
        />

        {selectedFiles && (
          <FileList>
            <div className="file-count">
              {selectedFiles.length} C++ files ready for batch grading
            </div>
            {Array.from(selectedFiles).slice(0, 10).map((file, index) => (
              <div key={index} className="file-item">
                <div className="file-name">{file.name}</div>
                <div className="file-size">{formatFileSize(file.size)}</div>
              </div>
            ))}
            {selectedFiles.length > 10 && (
              <div style={{ textAlign: 'center', color: '#6b7280', fontSize: '0.875rem', marginTop: '0.5rem' }}>
                ... and {selectedFiles.length - 10} more files
              </div>
            )}
          </FileList>
        )}

        <div style={{ marginTop: '2rem', textAlign: 'center' }}>
          <ActionButton
            onClick={handleUpload}
            disabled={!selectedFiles || !selectedAssignment || isUploading}
          >
            {isUploading ? 'Starting Batch Job...' : 'Start Batch Grading'}
          </ActionButton>
        </div>
      </UploadSection>

      {batchStatus && (
        <ProcessingStatus>
          <div className="status-header">
            <h3>Batch Job Progress</h3>
            {getStatusBadge(batchStatus.status)}
          </div>

          <div className="progress-bar">
            <div 
              className="progress-fill" 
              style={{ 
                width: `${batchStatus.progress_percentage}%`,
                background: batchStatus.status === 'failed' ? '#ef4444' : 
                           batchStatus.status === 'completed' ? '#10b981' : '#3b82f6'
              }}
            />
          </div>
          
          <div style={{ 
            textAlign: 'center', 
            marginBottom: '1rem',
            fontSize: '0.875rem',
            color: '#6b7280' 
          }}>
            {batchStatus.status === 'processing' ? (
              <>⏳ Processing submissions... (updates every 2 seconds)</>
            ) : batchStatus.status === 'pending' ? (
              <>📋 Preparing to start processing...</>
            ) : batchStatus.status === 'completed' ? (
              <>🎉 All submissions processed successfully!</>
            ) : batchStatus.status === 'failed' ? (
              <>⚠️ Some submissions failed to process</>
            ) : null}
          </div>

          <div className="progress-stats">
            <div className="stat">
              <div className="stat-number">{batchStatus.processed_files}</div>
              <div className="stat-label">Processed</div>
            </div>
            <div className="stat">
              <div className="stat-number">{batchStatus.total_files}</div>
              <div className="stat-label">Total Files</div>
            </div>
            <div className="stat">
              <div className="stat-number" style={{ color: '#10b981' }}>{batchStatus.successful_grades}</div>
              <div className="stat-label">✅ Successful</div>
            </div>
            <div className="stat">
              <div className="stat-number" style={{ 
                color: batchStatus.failed_grades > 0 ? '#ef4444' : '#6b7280' 
              }}>
                {batchStatus.failed_grades}
              </div>
              <div className="stat-label">❌ Failed</div>
            </div>
            {batchStatus.average_score && (
              <div className="stat">
                <div className="stat-number">{batchStatus.average_score.toFixed(1)}%</div>
                <div className="stat-label">Avg Score</div>
              </div>
            )}
          </div>

          {(batchStatus.status === 'completed' || batchStatus.status === 'failed') && (
            <div style={{ marginTop: '2rem', textAlign: 'center' }}>
              <ActionButton onClick={viewResults}>
                📊 View Batch Results
              </ActionButton>
              {batchStatus.status === 'completed' && batchStatus.failed_grades > 0 && (
                <div style={{ 
                  marginTop: '1rem', 
                  fontSize: '0.875rem', 
                  color: '#d97706',
                  textAlign: 'center'
                }}>
                  ⚠️ {batchStatus.failed_grades} submission{batchStatus.failed_grades !== 1 ? 's' : ''} failed - check detailed results for more info
                </div>
              )}
            </div>
          )}
        </ProcessingStatus>
      )}
    </BatchContainer>
  );
};

export default BatchGrading;
