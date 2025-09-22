import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { gradingApi } from '../services/api';

const DashboardContainer = styled.div`
  padding: 2rem 0;
`;

const WelcomeSection = styled.div`
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

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
  margin-bottom: 3rem;
`;

const StatCard = styled.div`
  background: white;
  padding: 2rem;
  border-radius: 12px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  text-align: center;
  border: 1px solid #e2e8f0;
  
  h3 {
    font-size: 2rem;
    font-weight: 700;
    color: #667eea;
    margin-bottom: 0.5rem;
  }
  
  p {
    color: #64748b;
    font-size: 0.9rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }
`;

const RecentSubmissions = styled.div`
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  border: 1px solid #e2e8f0;
  overflow: hidden;
`;

const SectionHeader = styled.div`
  padding: 1.5rem 2rem;
  border-bottom: 1px solid #e2e8f0;
  
  h2 {
    font-size: 1.5rem;
    font-weight: 600;
    color: #1e293b;
    margin: 0;
  }
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
`;

const TableHeader = styled.th`
  text-align: left;
  padding: 1rem 2rem;
  background: #f8fafc;
  font-weight: 600;
  color: #374151;
  font-size: 0.875rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
`;

const TableCell = styled.td`
  padding: 1rem 2rem;
  border-bottom: 1px solid #f1f5f9;
  color: #64748b;
`;

const StatusBadge = styled.span<{ status: string }>`
  display: inline-block;
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  
  ${({ status }) => {
    switch (status) {
      case 'graded':
        return `
          background: #dcfce7;
          color: #166534;
        `;
      case 'pending':
        return `
          background: #fef3c7;
          color: #92400e;
        `;
      case 'grading':
        return `
          background: #dbeafe;
          color: #1d4ed8;
        `;
      case 'error':
        return `
          background: #fecaca;
          color: #991b1b;
        `;
      default:
        return `
          background: #f1f5f9;
          color: #64748b;
        `;
    }
  }}
`;

const ScoreBadge = styled.span`
  font-weight: 600;
  color: #059669;
`;

// Types for our data
interface SubmissionData {
  id: string;
  student: string;
  fileName: string;
  submittedAt: string;
  status: 'pending' | 'grading' | 'graded' | 'error';
  score: string;
  assignmentName?: string;
}

interface Stats {
  value: string;
  label: string;
}

const HomePage: React.FC = () => {
  const [submissions, setSubmissions] = useState<SubmissionData[]>([]);
  const [stats, setStats] = useState<Stats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Format date for display
  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 60) {
      return `${diffMins} ${diffMins === 1 ? 'minute' : 'minutes'} ago`;
    } else if (diffHours < 24) {
      return `${diffHours} ${diffHours === 1 ? 'hour' : 'hours'} ago`;
    } else {
      return `${diffDays} ${diffDays === 1 ? 'day' : 'days'} ago`;
    }
  };

  // Fetch submissions and calculate stats
  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const submissionsData = await gradingApi.getSubmissions();
      
      // Handle different response formats
      let submissions: any[] = [];
      
      if (Array.isArray(submissionsData)) {
        submissions = submissionsData;
      } else if (submissionsData && Array.isArray((submissionsData as any).results)) {
        // Handle paginated response
        submissions = (submissionsData as any).results;
      } else if (submissionsData && (submissionsData as any).data && Array.isArray((submissionsData as any).data)) {
        // Handle wrapped response
        submissions = (submissionsData as any).data;
      } else {
        console.warn('Unexpected API response format:', submissionsData);
        submissions = [];
      }
      
      // Handle empty submissions array
      if (submissions.length === 0) {
        setSubmissions([]);
        setStats([
          { value: '0', label: 'Total Submissions' },
          { value: '0', label: 'Graded' },
          { value: '0', label: 'Pending' },
          { value: '0%', label: 'Average Score' }
        ]);
        return;
      }
      
      // Process submissions data
      const processedSubmissions: SubmissionData[] = submissions.map((sub: any) => ({
        id: sub.id,
        student: sub.student_name || 'Unknown Student',
        fileName: sub.file_name || 'Unknown File',
        submittedAt: formatTimeAgo(sub.submitted_at || ''),  // Use correct field name
        status: sub.status as 'pending' | 'grading' | 'graded' | 'error',
        score: sub.total_score && sub.percentage ? 
          `${sub.total_score}/100 (${Math.round(sub.percentage)}%)` : 
          '-',
        assignmentName: sub.assignment_name || 'Unknown Assignment'  // Use correct field name
      }));

      // Sort by submitted date (most recent first)
      processedSubmissions.sort((a, b) => {
        const submissionA = submissions.find((s: any) => s.id === a.id);
        const submissionB = submissions.find((s: any) => s.id === b.id);
        const dateA = submissionA?.submitted_at || '';  // Use correct field name
        const dateB = submissionB?.submitted_at || '';  // Use correct field name
        return new Date(dateB).getTime() - new Date(dateA).getTime();
      });

      // Take only the most recent 10 submissions
      setSubmissions(processedSubmissions.slice(0, 10));

      // Calculate stats
      const totalSubmissions = submissions.length;
      const gradedSubmissions = submissions.filter((s: any) => s.status === 'graded').length;
      const pendingSubmissions = submissions.filter((s: any) => s.status === 'pending' || s.status === 'grading').length;
      
      // Calculate average score
      const gradedScores = submissions
        .filter((s: any) => s.status === 'graded' && s.percentage)
        .map((s: any) => s.percentage);
      const averageScore = gradedScores.length > 0 
        ? (gradedScores.reduce((sum, score) => sum + score, 0) / gradedScores.length).toFixed(1)
        : '0';

      setStats([
        { value: totalSubmissions.toString(), label: 'Total Submissions' },
        { value: gradedSubmissions.toString(), label: 'Graded' },
        { value: pendingSubmissions.toString(), label: 'Pending' },
        { value: `${averageScore}%`, label: 'Average Score' }
      ]);

    } catch (err: any) {
      console.error('Error fetching data:', err);
      console.error('Error details:', err.response?.data || err.message);
      
      // Set fallback empty state
      setSubmissions([]);
      setStats([
        { value: '0', label: 'Total Submissions' },
        { value: '0', label: 'Graded' },
        { value: '0', label: 'Pending' },
        { value: '0%', label: 'Average Score' }
      ]);
      
      if (err.response?.status === 404) {
        setError('API endpoint not found. Make sure the backend is running and the API is properly configured.');
      } else if (err.response?.status >= 500) {
        setError('Server error. Please try again later.');
      } else if (err.name === 'NetworkError' || err.message.includes('Network Error')) {
        setError('Cannot connect to backend. Make sure the backend server is running on http://localhost:8000');
      } else {
        setError(`Failed to load submissions: ${err.message || 'Unknown error'}`);
      }
    } finally {
      setLoading(false);
    }
  };

  // Fetch data on component mount
  useEffect(() => {
    fetchData();
    
    // Set up auto-refresh every 30 seconds to show new submissions
    const interval = setInterval(fetchData, 30000);
    
    return () => clearInterval(interval);
  }, []);

  // Add loading and error states
  if (loading) {
    return (
      <DashboardContainer>
        <WelcomeSection>
          <h1>Loading...</h1>
          <p>Fetching the latest submission data...</p>
        </WelcomeSection>
      </DashboardContainer>
    );
  }

  if (error) {
    return (
      <DashboardContainer>
        <WelcomeSection>
          <h1>Error</h1>
          <p style={{ color: '#ef4444' }}>{error}</p>
          <button 
            onClick={fetchData}
            style={{
              background: '#667eea',
              color: 'white',
              border: 'none',
              padding: '0.5rem 1rem',
              borderRadius: '6px',
              cursor: 'pointer',
              marginTop: '1rem'
            }}
          >
            Retry
          </button>
        </WelcomeSection>
      </DashboardContainer>
    );
  }

  return (
    <DashboardContainer>
      <WelcomeSection>
        <h1>Welcome to C++ Grading AI</h1>
        <p>
          Automate your C++ code grading with intelligent AI feedback. 
          Manage {stats[0]?.value || '0'} assignments efficiently with consistent, detailed analysis.
        </p>
        <button 
          onClick={fetchData}
          style={{
            background: '#667eea',
            color: 'white',
            border: 'none',
            padding: '0.5rem 1rem',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '0.875rem',
            marginTop: '0.5rem'
          }}
        >
          🔄 Refresh Data
        </button>
      </WelcomeSection>

      <StatsGrid>
        {stats.map((stat, index) => (
          <StatCard key={index}>
            <h3>{stat.value}</h3>
            <p>{stat.label}</p>
          </StatCard>
        ))}
      </StatsGrid>

      <RecentSubmissions>
        <SectionHeader>
          <h2>Recent Submissions</h2>
        </SectionHeader>
        <Table>
          <thead>
            <tr>
              <TableHeader>Student</TableHeader>
              <TableHeader>File</TableHeader>
              <TableHeader>Submitted</TableHeader>
              <TableHeader>Status</TableHeader>
              <TableHeader>Score</TableHeader>
            </tr>
          </thead>
          <tbody>
            {submissions.length === 0 ? (
              <tr>
                <TableCell colSpan={5} style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>
                  No submissions found. Upload some student assignments to see them here!
                </TableCell>
              </tr>
            ) : (
              submissions.map((submission) => (
                <tr key={submission.id}>
                  <TableCell>
                    <div>
                      <div style={{ fontWeight: '500' }}>{submission.student}</div>
                      {submission.assignmentName && (
                        <div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.25rem' }}>
                          {submission.assignmentName}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <code>{submission.fileName}</code>
                  </TableCell>
                  <TableCell>{submission.submittedAt}</TableCell>
                  <TableCell>
                    <StatusBadge status={submission.status}>
                      {submission.status}
                    </StatusBadge>
                  </TableCell>
                  <TableCell>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      {submission.score !== '-' ? (
                        <>
                          <ScoreBadge>{submission.score}</ScoreBadge>
                          {submission.status === 'graded' && (
                            <a 
                              href={`/results/${submission.id}`}
                              style={{
                                color: '#667eea',
                                textDecoration: 'none',
                                fontSize: '0.75rem',
                                padding: '0.25rem 0.5rem',
                                borderRadius: '4px',
                                background: '#f1f5f9',
                                border: '1px solid #e2e8f0'
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.background = '#e2e8f0';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.background = '#f1f5f9';
                              }}
                            >
                              👁️ View
                            </a>
                          )}
                        </>
                      ) : (
                        <span style={{ color: '#6b7280' }}>-</span>
                      )}
                    </div>
                  </TableCell>
                </tr>
              ))
            )}
          </tbody>
        </Table>
      </RecentSubmissions>
    </DashboardContainer>
  );
};

export default HomePage;
