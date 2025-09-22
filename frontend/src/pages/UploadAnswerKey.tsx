import React, { useState, useCallback } from 'react';
import styled from 'styled-components';
import { gradingApi } from '../services/api';

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

const AssignmentInfoForm = styled.div`
  margin-bottom: 2rem;
  
  h3 {
    font-size: 1.25rem;
    font-weight: 600;
    color: #374151;
    margin-bottom: 1rem;
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

const TextArea = styled.textarea<{ hasError?: boolean }>`
  width: 100%;
  padding: 0.75rem 1rem;
  border: 1px solid ${({ hasError }) => hasError ? '#ef4444' : '#d1d5db'};
  border-radius: 6px;
  font-size: 1rem;
  resize: vertical;
  min-height: 100px;
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
  background: linear-gradient(135deg, #059669 0%, #047857 100%);
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

const Alert = styled.div<{ type: 'success' | 'error' }>`
  padding: 1rem;
  border-radius: 6px;
  margin-bottom: 1rem;
  background: ${({ type }) => type === 'success' ? '#dcfce7' : '#fecaca'};
  color: ${({ type }) => type === 'success' ? '#166534' : '#991b1b'};
  border: 1px solid ${({ type }) => type === 'success' ? '#bbf7d0' : '#fca5a5'};
`;

interface FormData {
  assignmentName: string;
  assignmentDescription: string;
  maxScore: number;
}

interface FormErrors {
  assignmentName?: string;
  assignmentDescription?: string;
  maxScore?: string;
  file?: string;
}

const UploadAnswerKey: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragActive, setIsDragActive] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    assignmentName: '',
    assignmentDescription: '',
    maxScore: 100
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};
    
    if (!formData.assignmentName.trim()) {
      newErrors.assignmentName = 'Assignment name is required';
    }
    
    if (!formData.assignmentDescription.trim()) {
      newErrors.assignmentDescription = 'Assignment description is required';
    }
    
    if (!formData.maxScore || formData.maxScore <= 0) {
      newErrors.maxScore = 'Max score must be greater than 0';
    }
    
    if (!selectedFile) {
      newErrors.file = 'Please select a C++ answer key file';
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    if (name === 'maxScore') {
      setFormData(prev => ({ ...prev, [name]: parseInt(value) || 0 }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
    
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
      // Create assignment with answer key
      const response = await gradingApi.createAssignmentWithAnswer(
        selectedFile,
        formData.assignmentName,
        formData.assignmentDescription,
        formData.maxScore
      );
      
      setAlert({
        type: 'success',
        message: `✅ Answer key uploaded successfully! Assignment "${formData.assignmentName}" is ready for student submissions.`
      });
      
      // Reset form
      setSelectedFile(null);
      setFormData({
        assignmentName: '',
        assignmentDescription: '',
        maxScore: 100
      });
      setErrors({});
      
    } catch (error: any) {
      console.error('Upload error:', error);
      setAlert({
        type: 'error',
        message: error.response?.data?.message || 'Failed to upload answer key. Please try again.'
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
        <h1>Upload Answer Key</h1>
        <p>
          As a Teaching Assistant, upload the correct C++ solution for an assignment. 
          This will be used as the reference to grade student submissions.
        </p>
      </PageHeader>

      {alert && (
        <Alert type={alert.type}>
          {alert.message}
        </Alert>
      )}

      <form onSubmit={handleSubmit}>
        <UploadCard>
          <AssignmentInfoForm>
            <h3>Assignment Details</h3>
            
            <FormGroup>
              <Label htmlFor="assignmentName">Assignment Name *</Label>
              <Input
                id="assignmentName"
                name="assignmentName"
                type="text"
                value={formData.assignmentName}
                onChange={handleInputChange}
                placeholder="e.g., Assignment 1 - Basic C++ Programming"
                hasError={!!errors.assignmentName}
              />
              {errors.assignmentName && <ErrorText>{errors.assignmentName}</ErrorText>}
            </FormGroup>
            
            <FormGroup>
              <Label htmlFor="assignmentDescription">Description *</Label>
              <TextArea
                id="assignmentDescription"
                name="assignmentDescription"
                value={formData.assignmentDescription}
                onChange={handleInputChange}
                placeholder="Describe what the assignment should accomplish..."
                hasError={!!errors.assignmentDescription}
              />
              {errors.assignmentDescription && <ErrorText>{errors.assignmentDescription}</ErrorText>}
            </FormGroup>
            
            <FormGroup>
              <Label htmlFor="maxScore">Maximum Score *</Label>
              <Input
                id="maxScore"
                name="maxScore"
                type="number"
                value={formData.maxScore}
                onChange={handleInputChange}
                placeholder="100"
                min="1"
                max="1000"
                hasError={!!errors.maxScore}
              />
              {errors.maxScore && <ErrorText>{errors.maxScore}</ErrorText>}
            </FormGroup>
          </AssignmentInfoForm>

          <div>
            <Label>Answer Key C++ File *</Label>
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
                <UploadIcon>🔑</UploadIcon>
                <h3>
                  {isDragActive ? 'Drop the answer key here' : 'Upload your C++ answer key'}
                </h3>
                <p>or click to browse</p>
                <div className="file-types">
                  Accepted: .cpp files (Max size: 5MB)
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
          {isLoading ? 'Creating Assignment...' : 'Create Assignment with Answer Key'}
        </SubmitButton>
      </form>
    </UploadContainer>
  );
};

export default UploadAnswerKey;
