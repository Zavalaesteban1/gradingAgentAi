import React from 'react';
import styled from 'styled-components';

const ToolsSection = styled.div`
  background: #f8fafc;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  margin-bottom: 2rem;
  overflow: hidden;
`;

const ToolsHeader = styled.div`
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 1.5rem;
  
  h3 {
    margin: 0;
    font-size: 1.25rem;
    font-weight: 600;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
  
  .subtitle {
    margin-top: 0.5rem;
    opacity: 0.9;
    font-size: 0.9rem;
  }
`;

const ToolGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
  padding: 1.5rem;
`;

const ToolCard = styled.div<{ status: 'success' | 'warning' | 'error' }>`
  background: white;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
  overflow: hidden;
  
  .tool-header {
    background: ${({ status }) => {
      switch (status) {
        case 'success': return '#059669';
        case 'warning': return '#d97706';
        case 'error': return '#dc2626';
        default: return '#6b7280';
      }
    }};
    color: white;
    padding: 1rem;
    font-weight: 600;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
  
  .tool-content {
    padding: 1rem;
    
    .detail-item {
      margin-bottom: 0.5rem;
      font-size: 0.9rem;
      
      .label {
        font-weight: 500;
        color: #374151;
        margin-right: 0.5rem;
      }
      
      .value {
        color: #6b7280;
      }
    }
    
    .issues-list {
      margin-top: 0.5rem;
      
      .issue {
        color: #dc2626;
        font-size: 0.85rem;
        margin: 0.25rem 0;
      }
    }
    
    .test-cases {
      margin-top: 0.5rem;
      
      .test-case {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        font-size: 0.85rem;
        margin: 0.25rem 0;
      }
    }
  }
`;

interface ToolAnalysisProps {
  compilation?: any;
  testResults?: any;
  styleAnalysis?: any;
}

const ToolAnalysisResults: React.FC<ToolAnalysisProps> = ({
  compilation,
  testResults,
  styleAnalysis
}) => {
  if (!compilation && !testResults && !styleAnalysis) {
    return null; // Don't show if no tool data
  }

  const getCompilationStatus = () => {
    if (!compilation) return 'warning';
    return compilation.success ? 'success' : 'error';
  };

  const getTestStatus = () => {
    if (!testResults || !testResults.test_results) return 'warning';
    const passed = testResults.tests_passed || 0;
    const total = testResults.total_tests || 1;
    const percentage = (passed / total) * 100;
    
    if (percentage === 100) return 'success';
    if (percentage >= 70) return 'warning';
    return 'error';
  };

  const getStyleStatus = () => {
    if (!styleAnalysis) return 'warning';
    const score = styleAnalysis.style_score || 0;
    
    if (score >= 22) return 'success';
    if (score >= 18) return 'warning';
    return 'error';
  };

  return (
    <ToolsSection>
      <ToolsHeader>
        <h3>
          🤖 AI Agent Tool Analysis
        </h3>
        <div className="subtitle">
          Automated analysis performed by development tools
        </div>
      </ToolsHeader>
      
      <ToolGrid>
        {compilation && (
          <ToolCard status={getCompilationStatus()}>
            <div className="tool-header">
              🔨 Code Compilation
            </div>
            <div className="tool-content">
              <div className="detail-item">
                <span className="label">Status:</span>
                <span className="value">
                  {compilation.success ? '✅ Compiled Successfully' : '❌ Compilation Failed'}
                </span>
              </div>
              
              {compilation.warnings && (
                <div className="detail-item">
                  <span className="label">Warnings:</span>
                  <div className="issues-list">
                    <div className="issue">⚠️ {compilation.warnings}</div>
                  </div>
                </div>
              )}
              
              {compilation.errors && (
                <div className="detail-item">
                  <span className="label">Errors:</span>
                  <div className="issues-list">
                    <div className="issue">❌ {compilation.errors}</div>
                  </div>
                </div>
              )}
            </div>
          </ToolCard>
        )}

        {testResults && testResults.test_results && (
          <ToolCard status={getTestStatus()}>
            <div className="tool-header">
              🧪 Automated Testing
            </div>
            <div className="tool-content">
              <div className="detail-item">
                <span className="label">Tests Passed:</span>
                <span className="value">
                  {testResults.tests_passed}/{testResults.total_tests}
                </span>
              </div>
              
              <div className="detail-item">
                <span className="label">Correctness Score:</span>
                <span className="value">
                  {testResults.overall_correctness?.toFixed(1) || 0}/40 points
                </span>
              </div>
              
              <div className="test-cases">
                {testResults.test_results.slice(0, 3).map((test: any, index: number) => (
                  <div key={index} className="test-case">
                    <span>{test.passed ? '✅' : '❌'}</span>
                    <span>{test.test_name}</span>
                  </div>
                ))}
                {testResults.test_results.length > 3 && (
                  <div className="test-case">
                    <span>...</span>
                    <span>{testResults.test_results.length - 3} more tests</span>
                  </div>
                )}
              </div>
            </div>
          </ToolCard>
        )}

        {styleAnalysis && (
          <ToolCard status={getStyleStatus()}>
            <div className="tool-header">
              🎨 Style Analysis
            </div>
            <div className="tool-content">
              <div className="detail-item">
                <span className="label">Style Score:</span>
                <span className="value">{styleAnalysis.style_score}/25 points</span>
              </div>
              
              <div className="detail-item">
                <span className="label">Issues Found:</span>
                <span className="value">{styleAnalysis.style_issues?.length || 0}</span>
              </div>
              
              {styleAnalysis.style_issues && styleAnalysis.style_issues.length > 0 && (
                <div className="issues-list">
                  {styleAnalysis.style_issues.slice(0, 3).map((issue: string, index: number) => (
                    <div key={index} className="issue">• {issue}</div>
                  ))}
                  {styleAnalysis.style_issues.length > 3 && (
                    <div className="issue">... {styleAnalysis.style_issues.length - 3} more issues</div>
                  )}
                </div>
              )}
              
              {styleAnalysis.suggestions && styleAnalysis.suggestions.length > 0 && (
                <div className="detail-item">
                  <span className="label">Suggestions:</span>
                  <div className="issues-list">
                    {styleAnalysis.suggestions.slice(0, 2).map((suggestion: string, index: number) => (
                      <div key={index} className="issue">💡 {suggestion}</div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </ToolCard>
        )}
      </ToolGrid>
    </ToolsSection>
  );
};

export default ToolAnalysisResults;
