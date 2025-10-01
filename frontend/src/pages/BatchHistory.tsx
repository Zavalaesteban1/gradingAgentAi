import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { gradingApi } from '../services/api';

const HistoryContainer = styled.div`
  padding: 2rem 0;
  max-width: 1200px;
  margin: 0 auto;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  
  h1 {
    font-size: 2rem;
    font-weight: 700;
    color: #1e293b;
    margin: 0;
  }
  
  .batch-count {
    color: #6b7280;
    font-size: 0.875rem;
  }
`;

const BatchGrid = styled.div`
  display: grid;
  gap: 1.5rem;
  grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
`;

const BatchCard = styled.div`
  background: white;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  padding: 1.5rem;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
    border-color: #3b82f6;
  }
  
  .batch-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 1rem;
    
    .assignment-name {
      font-size: 1.125rem;
      font-weight: 600;
      color: #1e293b;
      margin: 0 0 0.25rem 0;
    }
    
    .batch-id {
      font-size: 0.75rem;
      color: #6b7280;
      font-family: monospace;
    }
    
    .status-badge {
      padding: 0.25rem 0.75rem;
      border-radius: 9999px;
      font-size: 0.75rem;
      font-weight: 600;
      text-transform: uppercase;
    }
  }
  
  .batch-stats {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 1rem;
    margin-bottom: 1rem;
    
    .stat {
      text-align: center;
      
      .stat-number {
        font-size: 1.25rem;
        font-weight: 700;
        margin-bottom: 0.125rem;
      }
      
      .stat-label {
        font-size: 0.75rem;
        color: #6b7280;
        text-transform: uppercase;
        letter-spacing: 0.05em;
      }
    }
  }
  
  .batch-meta {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 0.875rem;
    color: #6b7280;
    padding-top: 1rem;
    border-top: 1px solid #f1f5f9;
    
    .date {
      display: flex;
      align-items: center;
      gap: 0.25rem;
    }
    
    .view-link {
      color: #3b82f6;
      font-weight: 500;
      text-decoration: none;
      
      &:hover {
        text-decoration: underline;
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

const EmptyState = styled.div`
  text-align: center;
  padding: 4rem 2rem;
  color: #6b7280;
  
  .empty-icon {
    font-size: 4rem;
    margin-bottom: 1rem;
    opacity: 0.5;
  }
  
  h3 {
    font-size: 1.25rem;
    font-weight: 600;
    color: #374151;
    margin-bottom: 0.5rem;
  }
  
  p {
    font-size: 0.875rem;
    margin-bottom: 1.5rem;
  }
  
  .create-batch-btn {
    background: #3b82f6;
    color: white;
    border: none;
    padding: 0.75rem 1.5rem;
    border-radius: 6px;
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
    text-decoration: none;
    display: inline-block;
    
    &:hover {
      background: #2563eb;
    }
  }
`;

interface BatchJob {
  id: string;
  assignment_name: string;
  status: string;
  total_files: number;
  processed_files: number;
  successful_grades: number;
  failed_grades: number;
  average_score?: number;
  created_at: string;
  completed_at?: string;
}

const BatchHistory: React.FC = () => {
  const navigate = useNavigate();
  const [batchJobs, setBatchJobs] = useState<BatchJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBatchJobs = async () => {
      try {
        const data = await gradingApi.getAllBatchJobs();
        setBatchJobs(data.results || data || []);
      } catch (err: any) {
        setError('Failed to load batch history');
        console.error('Error loading batch history:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchBatchJobs();
  }, []);

  if (loading) {
    return (
      <HistoryContainer>
        <LoadingSpinner>Loading batch history...</LoadingSpinner>
      </HistoryContainer>
    );
  }

  if (error) {
    return (
      <HistoryContainer>
        <ErrorMessage>{error}</ErrorMessage>
      </HistoryContainer>
    );
  }

  if (batchJobs.length === 0) {
    return (
      <HistoryContainer>
        <EmptyState>
          <div className="empty-icon">📁</div>
          <h3>No Batch Jobs Found</h3>
          <p>You haven't created any batch grading jobs yet.</p>
          <button 
            className="create-batch-btn"
            onClick={() => navigate('/batch-grading')}
          >
            Create Your First Batch
          </button>
        </EmptyState>
      </HistoryContainer>
    );
  }

  const getStatusStyle = (status: string) => {
    const styles: Record<string, any> = {
      pending: { background: '#fef3c7', color: '#92400e' },
      processing: { background: '#dbeafe', color: '#1d4ed8' },
      completed: { background: '#dcfce7', color: '#166534' },
      failed: { background: '#fecaca', color: '#991b1b' }
    };
    return styles[status] || { background: '#f3f4f6', color: '#374151' };
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleBatchClick = (batchId: string) => {
    navigate(`/batch-results/${batchId}`);
  };

  return (
    <HistoryContainer>
      <Header>
        <h1>Batch History</h1>
        <div className="batch-count">
          {batchJobs.length} batch job{batchJobs.length !== 1 ? 's' : ''}
        </div>
      </Header>

      <BatchGrid>
        {batchJobs.map((batch) => (
          <BatchCard key={batch.id} onClick={() => handleBatchClick(batch.id)}>
            <div className="batch-header">
              <div>
                <h3 className="assignment-name">{batch.assignment_name}</h3>
                <div className="batch-id">ID: {batch.id}</div>
              </div>
              <span 
                className="status-badge" 
                style={getStatusStyle(batch.status)}
              >
                {batch.status}
              </span>
            </div>

            <div className="batch-stats">
              <div className="stat">
                <div className="stat-number">{batch.total_files}</div>
                <div className="stat-label">Total</div>
              </div>
              <div className="stat">
                <div 
                  className="stat-number" 
                  style={{ color: '#059669' }}
                >
                  {batch.successful_grades}
                </div>
                <div className="stat-label">Graded</div>
              </div>
              <div className="stat">
                <div 
                  className="stat-number"
                  style={{ color: batch.failed_grades > 0 ? '#dc2626' : '#6b7280' }}
                >
                  {batch.failed_grades}
                </div>
                <div className="stat-label">Failed</div>
              </div>
              <div className="stat">
                <div className="stat-number">
                  {batch.average_score ? `${batch.average_score.toFixed(0)}%` : '-'}
                </div>
                <div className="stat-label">Avg</div>
              </div>
            </div>

            <div className="batch-meta">
              <div className="date">
                📅 {formatDate(batch.created_at)}
              </div>
              <div className="view-link">
                View Results →
              </div>
            </div>
          </BatchCard>
        ))}
      </BatchGrid>
    </HistoryContainer>
  );
};

export default BatchHistory;
