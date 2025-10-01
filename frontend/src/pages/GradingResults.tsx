import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { gradingApi } from '../services/api';

const ResultsContainer = styled.div`
  padding: 1rem 0;
  max-width: 800px;
  margin: 0 auto;
`;

const Header = styled.div`
  background: white;
  padding: 1.5rem;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
  margin-bottom: 1.5rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  
  .student-info {
    h2 {
      font-size: 1.5rem;
      font-weight: 600;
      color: #1e293b;
      margin: 0;
    }
    
    .assignment {
      color: #64748b;
      font-size: 0.9rem;
      margin-top: 0.25rem;
    }
  }
  
  .score-display {
    text-align: right;
    
    .score {
      font-size: 2rem;
      font-weight: 700;
      color: #059669;
    }
    
    .points {
      font-size: 0.9rem;
      color: #64748b;
    }
  }
`;


const QuickSummary = styled.div`
  background: white;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
  
  .summary-title {
    font-size: 1.1rem;
    font-weight: 600;
    color: #1e293b;
    margin-bottom: 1rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
  
  .criteria-row {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
    gap: 1rem;
    margin-bottom: 0.75rem;
    
    .criteria-item {
      text-align: center;
      padding: 0.75rem;
      background: #f8fafc;
      border-radius: 6px;
      
      .criteria-name {
        font-size: 0.75rem;
        color: #64748b;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        margin-bottom: 0.25rem;
      }
      
      .criteria-score {
        font-size: 1.25rem;
        font-weight: 600;
        color: #1e293b;
      }
    }
  }
`;

const KeyFeedback = styled.div`
  background: white;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
  padding: 1.5rem;
  margin-bottom: 1rem;
  
  .feedback-title {
    font-size: 1rem;
    font-weight: 600;
    color: #1e293b;
    margin-bottom: 0.75rem;
  }
  
  .feedback-text {
    color: #374151;
    font-size: 0.9rem;
    line-height: 1.5;
    max-height: 100px;
    overflow-y: auto;
  }
`;

const StatusBadge = styled.span<{ type: 'custom' | 'default' }>`
  display: inline-block;
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 500;
  background: ${({ type }) => type === 'custom' ? '#dcfce7' : '#f1f5f9'};
  color: ${({ type }) => type === 'custom' ? '#166534' : '#64748b'};
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

const BackButton = styled.button`
  background: #6b7280;
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 6px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.3s ease;
  margin-bottom: 2rem;
  
  &:hover {
    background: #4b5563;
  }
`;

const BatchBanner = styled.div`
  background: linear-gradient(90deg, #dbeafe 0%, #e0f2fe 100%);
  border: 1px solid #0284c7;
  border-radius: 8px;
  padding: 1rem 1.5rem;
  margin-bottom: 1.5rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  
  .banner-content {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    
    .batch-icon {
      font-size: 1.25rem;
    }
    
    .batch-info {
      .batch-title {
        font-size: 0.875rem;
        font-weight: 600;
        color: #0c4a6e;
        margin-bottom: 0.25rem;
      }
      
      .batch-subtitle {
        font-size: 0.75rem;
        color: #075985;
      }
    }
  }
  
  .back-to-batch {
    background: #0284c7;
    color: white;
    border: none;
    padding: 0.5rem 1rem;
    border-radius: 4px;
    font-size: 0.75rem;
    cursor: pointer;
    transition: background 0.2s ease;
    
    &:hover {
      background: #0369a1;
    }
  }
`;

interface GradingData {
  id: string;
  submission: {
    student_name: string;
    student_email: string;
    assignment_name: string;
    file_name: string;
    submitted_at: string;
  };
  total_score: number;
  max_score: number;
  percentage: number;
  correctness_score: number;
  correctness_max: number;
  correctness_feedback: string;
  code_style_score: number;
  code_style_max: number;
  code_style_feedback: string;
  efficiency_score: number;
  efficiency_max: number;
  efficiency_feedback: string;
  documentation_score: number;
  documentation_max: number;
  documentation_feedback: string;
  overall_feedback: string;
  suggestions: string;
  ai_model_used: string;
  processing_time: number;
  graded_at: string;
  compilation_result?: any;
  test_results?: any;
  style_analysis?: any;
  custom_rubric?: {
    has_custom_rubric: boolean;
    assignment_name: string;
    total_possible_points: number;
    criteria: Array<{
      name: string;
      max_points: number;
      description: string;
      subcriteria?: string[];
    }>;
  };
}

const GradingResults: React.FC = () => {
  const { submissionId } = useParams<{ submissionId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [gradingData, setGradingData] = useState<GradingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check if coming from batch results
  const fromBatch = searchParams.get('from') === 'batch';
  const batchId = searchParams.get('batchId');

  useEffect(() => {
    const fetchGradingResults = async () => {
      if (!submissionId) return;
      
      try {
        const data = await gradingApi.getSubmissionDetails(submissionId);
        
        if (data.grading_result) {
          setGradingData(data.grading_result);
        } else {
          setError('No grading results found for this submission');
        }
      } catch (err: any) {
        setError('Failed to load grading results');
        console.error('Error loading grading results:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchGradingResults();
  }, [submissionId]);

  if (loading) {
    return (
      <ResultsContainer>
        <LoadingSpinner>Loading grading results...</LoadingSpinner>
      </ResultsContainer>
    );
  }

  if (error || !gradingData) {
    return (
      <ResultsContainer>
        <ErrorMessage>{error || 'No grading data available'}</ErrorMessage>
      </ResultsContainer>
    );
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getCriteriaData = () => {
    // Always use the standard 4-category system for consistent display
    return [
      {
        name: 'Correctness',
        score: gradingData.correctness_score,
        maxScore: gradingData.correctness_max,
      },
      {
        name: 'Style',
        score: gradingData.code_style_score,
        maxScore: gradingData.code_style_max,
      },
      {
        name: 'Efficiency',
        score: gradingData.efficiency_score,
        maxScore: gradingData.efficiency_max,
      },
      {
        name: 'Docs',
        score: gradingData.documentation_score,
        maxScore: gradingData.documentation_max,
      }
    ];
  };

  const handleBackToBatch = () => {
    if (batchId) {
      navigate(`/batch-results/${batchId}`);
    }
  };

  return (
    <ResultsContainer>
      <BackButton onClick={() => window.history.back()}>
        ← Back
      </BackButton>
      
      {fromBatch && batchId && (
        <BatchBanner>
          <div className="banner-content">
            <span className="batch-icon">📊</span>
            <div className="batch-info">
              <div className="batch-title">Batch Results View</div>
              <div className="batch-subtitle">
                This result is from batch grading • Assignment: {gradingData.submission.assignment_name}
              </div>
            </div>
          </div>
          <button className="back-to-batch" onClick={handleBackToBatch}>
            ← Back to Batch
          </button>
        </BatchBanner>
      )}
      
      <Header>
        <div className="student-info">
          <h2>{gradingData.submission.student_name}</h2>
          <div className="assignment">
            {gradingData.submission.assignment_name} • {gradingData.submission.file_name}
            {gradingData.custom_rubric?.has_custom_rubric && (
              <StatusBadge type="custom" style={{ marginLeft: '0.5rem' }}>
                Custom Rubric
              </StatusBadge>
            )}
          </div>
        </div>
        <div className="score-display">
          <div className="score">{gradingData.percentage}%</div>
          <div className="points">{gradingData.total_score}/{gradingData.max_score} pts</div>
        </div>
      </Header>

      <QuickSummary>
        <div className="summary-title">📊 Score Breakdown</div>
        <div className="criteria-row">
          {getCriteriaData().map((criteria, index) => (
            <div key={index} className="criteria-item">
              <div className="criteria-name">{criteria.name}</div>
              <div className="criteria-score">{criteria.score}/{criteria.maxScore}</div>
            </div>
          ))}
        </div>
      </QuickSummary>

      <KeyFeedback>
        <div className="feedback-title">💬 Key Feedback</div>
        <div className="feedback-text">
          {gradingData.overall_feedback.length > 300 
            ? gradingData.overall_feedback.substring(0, 300) + '...'
            : gradingData.overall_feedback
          }
        </div>
      </KeyFeedback>

      {gradingData.suggestions && (
        <KeyFeedback>
          <div className="feedback-title">💡 Suggestions</div>
          <div className="feedback-text">
            {gradingData.suggestions.length > 200 
              ? gradingData.suggestions.substring(0, 200) + '...'
              : gradingData.suggestions
            }
          </div>
        </KeyFeedback>
      )}
    </ResultsContainer>
  );
};

export default GradingResults;
