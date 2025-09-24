import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import styled from 'styled-components';
import { gradingApi } from '../services/api';
import ToolAnalysisResults from '../components/ToolAnalysisResults';

const ResultsContainer = styled.div`
  padding: 2rem 0;
  max-width: 1000px;
  margin: 0 auto;
`;

const Header = styled.div`
  text-align: center;
  margin-bottom: 2rem;
  
  h1 {
    font-size: 2.5rem;
    font-weight: 700;
    color: #1e293b;
    margin-bottom: 0.5rem;
  }
  
  .subtitle {
    font-size: 1.1rem;
    color: #64748b;
  }
`;

const ScoreCard = styled.div`
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 2rem;
  border-radius: 12px;
  text-align: center;
  margin-bottom: 2rem;
  
  .main-score {
    font-size: 4rem;
    font-weight: 700;
    margin-bottom: 0.5rem;
  }
  
  .score-details {
    font-size: 1.2rem;
    opacity: 0.9;
  }
`;

const CriteriaGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
`;

const CriteriaCard = styled.div<{ score: number; maxScore: number }>`
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  border: 1px solid #e2e8f0;
  overflow: hidden;
  
  .header {
    background: ${({ score, maxScore }) => {
      const percentage = (score / maxScore) * 100;
      if (percentage >= 90) return '#059669';
      if (percentage >= 80) return '#d97706';
      if (percentage >= 70) return '#dc2626';
      return '#7c2d12';
    }};
    color: white;
    padding: 1rem 1.5rem;
    
    .title {
      font-size: 1.25rem;
      font-weight: 600;
      margin-bottom: 0.5rem;
    }
    
    .score {
      font-size: 2rem;
      font-weight: 700;
    }
  }
  
  .content {
    padding: 1.5rem;
    
    .feedback {
      color: #374151;
      line-height: 1.6;
    }
  }
`;

const OverallSection = styled.div`
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  border: 1px solid #e2e8f0;
  padding: 2rem;
  margin-bottom: 1.5rem;
  
  h3 {
    font-size: 1.5rem;
    font-weight: 600;
    color: #1e293b;
    margin-bottom: 1rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
  
  .feedback {
    color: #374151;
    line-height: 1.7;
    font-size: 1.1rem;
  }
`;

const SuggestionsSection = styled.div`
  background: #f8fafc;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  padding: 2rem;
  
  h3 {
    font-size: 1.5rem;
    font-weight: 600;
    color: #1e293b;
    margin-bottom: 1rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
  
  .suggestions {
    color: #374151;
    line-height: 1.7;
    font-size: 1.1rem;
  }
`;

const MetaInfo = styled.div`
  background: white;
  border-radius: 8px;
  padding: 1rem;
  margin-bottom: 2rem;
  border: 1px solid #e2e8f0;
  
  .meta-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1rem;
    font-size: 0.9rem;
    color: #64748b;
  }
  
  .meta-item {
    display: flex;
    justify-content: space-between;
  }
  
  .meta-label {
    font-weight: 500;
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
}

const GradingResults: React.FC = () => {
  const { submissionId } = useParams<{ submissionId: string }>();
  const [gradingData, setGradingData] = useState<GradingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  const getCriteriaData = () => [
    {
      title: 'Correctness',
      icon: '✓',
      score: gradingData.correctness_score,
      maxScore: gradingData.correctness_max,
      feedback: gradingData.correctness_feedback
    },
    {
      title: 'Code Style',
      icon: '🎨',
      score: gradingData.code_style_score,
      maxScore: gradingData.code_style_max,
      feedback: gradingData.code_style_feedback
    },
    {
      title: 'Efficiency',
      icon: '⚡',
      score: gradingData.efficiency_score,
      maxScore: gradingData.efficiency_max,
      feedback: gradingData.efficiency_feedback
    },
    {
      title: 'Documentation',
      icon: '📝',
      score: gradingData.documentation_score,
      maxScore: gradingData.documentation_max,
      feedback: gradingData.documentation_feedback
    }
  ];

  return (
    <ResultsContainer>
      <BackButton onClick={() => window.history.back()}>
        ← Back to Grade Students
      </BackButton>
      
      <Header>
        <h1>Detailed Grading Results</h1>
        <div className="subtitle">
          {gradingData.submission.student_name} • {gradingData.submission.assignment_name}
        </div>
      </Header>

      <MetaInfo>
        <div className="meta-grid">
          <div className="meta-item">
            <span className="meta-label">Student:</span>
            <span>{gradingData.submission.student_name}</span>
          </div>
          <div className="meta-item">
            <span className="meta-label">Email:</span>
            <span>{gradingData.submission.student_email}</span>
          </div>
          <div className="meta-item">
            <span className="meta-label">File:</span>
            <span>{gradingData.submission.file_name}</span>
          </div>
          <div className="meta-item">
            <span className="meta-label">Submitted:</span>
            <span>{formatDate(gradingData.submission.submitted_at)}</span>
          </div>
          <div className="meta-item">
            <span className="meta-label">Graded:</span>
            <span>{formatDate(gradingData.graded_at)}</span>
          </div>
          <div className="meta-item">
            <span className="meta-label">Processing Time:</span>
            <span>{gradingData.processing_time.toFixed(2)}s</span>
          </div>
          <div className="meta-item">
            <span className="meta-label">AI Model:</span>
            <span>{gradingData.ai_model_used}</span>
          </div>
        </div>
      </MetaInfo>

      <ScoreCard>
        <div className="main-score">{gradingData.percentage}%</div>
        <div className="score-details">
          {gradingData.total_score} out of {gradingData.max_score} points
        </div>
      </ScoreCard>

      <ToolAnalysisResults
        compilation={gradingData.compilation_result}
        testResults={gradingData.test_results}
        styleAnalysis={gradingData.style_analysis}
      />

      <CriteriaGrid>
        {getCriteriaData().map((criteria, index) => (
          <CriteriaCard key={index} score={criteria.score} maxScore={criteria.maxScore}>
            <div className="header">
              <div className="title">
                {criteria.icon} {criteria.title}
              </div>
              <div className="score">
                {criteria.score}/{criteria.maxScore}
              </div>
            </div>
            <div className="content">
              <div className="feedback">{criteria.feedback}</div>
            </div>
          </CriteriaCard>
        ))}
      </CriteriaGrid>

      <OverallSection>
        <h3>
          📊 Overall Assessment
        </h3>
        <div className="feedback">{gradingData.overall_feedback}</div>
      </OverallSection>

      <SuggestionsSection>
        <h3>
          💡 Suggestions for Improvement
        </h3>
        <div className="suggestions">{gradingData.suggestions}</div>
      </SuggestionsSection>
    </ResultsContainer>
  );
};

export default GradingResults;
