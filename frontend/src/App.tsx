import React from 'react';
import { Routes, Route, Link } from 'react-router-dom';
import './app.css';
import HomePage from './pages/HomePage';
import UploadAssignment from './pages/UploadAssignment';
import UploadAnswerKey from './pages/UploadAnswerKey';
import GradingResults from './pages/GradingResults';

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
              <li><Link to="/answer-keys">Upload Answer Keys</Link></li>
              <li><Link to="/grade-students">Grade Students</Link></li>
            </ul>
          </div>
        </div>
      </nav>
      
      <main className="main-content">
        <div className="container">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/answer-keys" element={<UploadAnswerKey />} />
            <Route path="/grade-students" element={<UploadAssignment />} />
            <Route path="/results/:submissionId" element={<GradingResults />} />
          </Routes>
        </div>
      </main>
    </div>
  );
}

export default App;
