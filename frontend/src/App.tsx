import React from 'react';
import { Routes, Route, Link } from 'react-router-dom';
import './app.css';
import HomePage from './pages/HomePage';
import UploadAssignment from './pages/UploadAssignment';
import UploadAnswerKey from './pages/UploadAnswerKey';
import GradingResults from './pages/GradingResults';
import StudentManagement from './pages/StudentManagement';
import BatchGrading from './pages/BatchGrading';
import BatchResults from './pages/BatchResults';
import BatchHistory from './pages/BatchHistory';

function App() {
  return (
    <div className="App">
      <nav className="navbar">
        <div className="container">
          <div className="nav-content">
            <Link to="/" className="nav-brand">
              C++ Grading AI
            </Link>
            <ul className="nav-links">
              <li><Link to="/">Dashboard</Link></li>
              <li><Link to="/students">Manage Students</Link></li>
              <li><Link to="/answer-keys">Upload Answer Keys</Link></li>
              <li><Link to="/grade-students">Grade Students</Link></li>
              <li><Link to="/batch-grading">Batch Grading</Link></li>
              <li><Link to="/batch-history">View Batches</Link></li>
            </ul>
          </div>
        </div>
      </nav>
      
      <main className="main-content">
        <div className="container">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/students" element={<StudentManagement />} />
            <Route path="/answer-keys" element={<UploadAnswerKey />} />
            <Route path="/grade-students" element={<UploadAssignment />} />
            <Route path="/batch-grading" element={<BatchGrading />} />
            <Route path="/batch-history" element={<BatchHistory />} />
            <Route path="/results/:submissionId" element={<GradingResults />} />
            <Route path="/batch-results/:batchJobId" element={<BatchResults />} />
          </Routes>
        </div>
      </main>
    </div>
  );
}

export default App;
