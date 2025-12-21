import React, { useEffect, useState,useParams } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

// Core Color Palette
const colors = {
  primary: '#3498db',
  secondary: '#2980b9',
  text: '#2c3e50',
  secondaryText: '#7f8c8d',
  backgroundLight: '#f8f9fa',
  backgroundWhite: '#ffffff',
  border: '#e9ecef',
  active: '#27ae60',
  destructive: '#e74c3c',
  inactive: '#bdc3c7',
};

// Styles
const styles = `
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
  }
  body { background: ${colors.backgroundLight}; font-family: 'Inter', sans-serif; }
  .main-container {
    background: ${colors.backgroundLight};
    min-height: 100vh;
    display: flex; flex-direction: column;
    align-items: center; justify-content: center;
    padding: 20px;
  }
  .header {
    width: 100%;
    padding: 20px;
    display: flex; justify-content: center;
    animation: fadeIn 0.8s ease-out;
  }
  .logo {
    font-size: 2.5rem; font-weight: bold;
    background: linear-gradient(135deg, ${colors.primary}, ${colors.secondary});
    -webkit-background-clip: text; -webkit-text-fill-color: transparent;
    position: absolute; top: 20px;
  }
  .instructions-card {
    background: ${colors.backgroundWhite};
    border-radius: 1rem;
    padding: 3rem;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
    max-width: 800px; width: 95%;
    text-align: left;
    animation: fadeIn 0.8s ease-out;
    margin-top: 50px;
  }
  .card-title {
    font-size: 1.8rem; font-weight: 700;
    color: ${colors.primary}; margin-bottom: 0.5rem;
    text-align: center;
  }
  .card-description {
    font-size: 1rem; color: ${colors.text};
    margin-bottom: 2rem; text-align: center;
    border-bottom: 1px solid ${colors.border};
    padding-bottom: 1rem;
  }
  .instruction-list { list-style: none; padding: 0; margin-bottom: 2.5rem; }
  .instruction-item {
    display: flex; align-items: flex-start;
    margin-bottom: 1.5rem; font-size: 0.95rem;
    line-height: 1.6; color: ${colors.text};
  }
  .instruction-icon {
    color: ${colors.active}; margin-right: 1rem;
    font-size: 1.4rem; min-width: 1.4rem;
    margin-top: 3px;
  }
  .motivation-message {
    text-align: center;
    font-size: 1.1rem; font-weight: 600;
    color: ${colors.secondary};
    margin-bottom: 1.5rem; margin-top: 0.5rem;
  }
  .start-button {
    width: 100%; padding: 1.1rem;
    border: none; border-radius: 0.75rem;
    font-size: 1.2rem; font-weight: bold;
    cursor: pointer;
    background: linear-gradient(135deg, ${colors.active}, #1e8449);
    color: ${colors.backgroundWhite};
    transition: all 0.3s ease;
    box-shadow: 0 6px 20px rgba(39, 174, 96, 0.4);
    display: flex; justify-content: center; align-items: center;
  }
  .start-button:hover {
    background: linear-gradient(135deg, #1e8449, ${colors.active});
    box-shadow: 0 8px 25px rgba(39, 174, 96, 0.5);
  }
  .footer {
    width: 100%; text-align: center; padding: 1rem;
    color: ${colors.secondaryText}; font-size: 0.8rem; margin-top: 2rem;
  }
  .footer-highlight { color: ${colors.primary}; font-weight: bold; }
  .error-message {
    color: ${colors.destructive};
    background: #fbecec;
    padding: 0.75rem; border-radius: 0.5rem;
    border: 1px solid ${colors.destructive};
    margin-bottom: 1rem;
    text-align: center;
  }
`;

const injectStyles = () => {
  const styleTag = document.createElement('style');
  styleTag.textContent = styles;
  document.head.appendChild(styleTag);
};

// ✅ Icons
const CheckIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
    <polyline points="22 4 12 14.01 9 11.01" />
  </svg>
);

const StartInterview = () => {
  useEffect(() => {
    injectStyles();
  }, []);

  const navigate = useNavigate();
  const location = useLocation();
  const userId = location.state?.userId;
  const reportId  = location.state?.reportId;

  console.log('reportId in StartInterview:', reportId);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleStartInterview = async () => {
    if (!userId) {
      setError("User ID not found. Please go back and re-upload your resume.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Ask for camera & mic permissions
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
      stream.getTracks().forEach(track => track.stop()); // stop preview immediately

      //  Proceed with backend API call
      const response = await fetch('http://127.0.0.1:5000/api/flask/start_interview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || `Failed to start interview (Status: ${response.status})`);
      }

      const data = await response.json();
      console.log("Start Interview API Response:", data);

      navigate('/interviewroom', {
        state: {
          sessionId: data.session_id,
          firstQuestion: data.first_question,
          userId: userId,
          reportId: reportId,
        },
      });

    } catch (err) {
      console.error("Error starting interview:", err);

      if (err.name === "NotAllowedError" || err.name === "NotFoundError") {
        setError(
          "Microphone or camera access is blocked. Please manually enable them in your browser settings, then reload this page."
        );
      } else if (err.message.includes("permissions") || err.message.includes("device")) {
        setError(
          "Microphone or camera issue detected. Please check your device connections and allow access."
        );
      } else {
        setError(err.message || "An unexpected error occurred.");
      }

    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="main-container">
      <header className="header">
        <h1 className="logo">Interview.ai</h1>
      </header>

      <main>
        <div className="instructions-card">
          <h2 className="card-title">Interview Preparation Checklist</h2>
          <p className="card-description">
            Before you start, please review these key instructions to ensure a successful session.
          </p>

          <ul className="instruction-list">
            <li className="instruction-item">
              <span className="instruction-icon"><CheckIcon /></span>
              <div><strong>Environment Check:</strong> Ensure your microphone and camera are working properly.</div>
            </li>
            <li className="instruction-item">
              <span className="instruction-icon"><CheckIcon /></span>
              <div><strong>Focus:</strong> Minimize distractions and respond naturally.</div>
            </li>
            <li className="instruction-item">
              <span className="instruction-icon"><CheckIcon /></span>
              <div><strong>No Pausing:</strong> Once started, the interview cannot be paused.</div>
            </li>
          </ul>

          {error && <p className="error-message">⚠️ {error}</p>}

          <p className="motivation-message">
            You've prepared for this moment — trust yourself and do your best!
          </p>

          <div>
            <button
              type="button"
              onClick={handleStartInterview}
              className="start-button"
              disabled={loading}
            >
              {loading ? "Starting..." : "Start Interview"}
            </button>
          </div>
        </div>
      </main>

      <footer className="footer">
        <p className="footer-text">
          &copy; 2025 <span className="footer-highlight">Interview.ai</span>. All rights reserved.
        </p>
      </footer>
    </div>
  );
};

export default StartInterview;
