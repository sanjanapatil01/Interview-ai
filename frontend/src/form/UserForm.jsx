import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

// IMPORTANT: FOR LOCAL USE, PASTE YOUR FIREBASE CONFIGURATION HERE.
// You must replace the placeholder values with your project's credentials.
/*
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithCustomToken, signInAnonymously } from 'firebase/auth';
import { getFirestore, collection, addDoc, serverTimestamp } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};
*/

// Global variables for the canvas environment.
// eslint-disable-next-line no-undef
const appId = typeof __app_id !== 'undefined' ? __app_id : "your-app-id-placeholder";
// eslint-disable-next-line no-undef
const initialAuthToken = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : null;

// New Core Color Palette
const colors = {
  primary: '#3498db',
  secondary: '#2980b9',
  text: '#2c3e50',
  secondaryText: '#7f8c8d',
  backgroundLight: '#f8f9fa',
  backgroundWhite: '#ffffff',
  border: '#e9ecef',
  active: '#27ae60',
  destructive: '#e74c3c'
};

// CSS styles for the form.
const styles = `
  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @keyframes pulse {
    0%, 100% {
      transform: scale(1);
    }
    50% {
      transform: scale(1.02);
    }
  }

  body {
    background: ${colors.backgroundWhite};
    font-family: 'Inter', sans-serif;
  }

  .main-container {
    background: ${colors.backgroundWhite};
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: space-between;
    padding: 20px;
  }

  .header {
    width: 100%;
    padding: 20px;
    display: flex;
    justify-content: center;
    animation: fadeIn 0.8s ease-out;
  }

  .logo {
    font-size: 2.5rem;
    font-weight: bold;
    background: linear-gradient(135deg, ${colors.primary}, ${colors.secondary});
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }

  .auth-form-container {
    background: ${colors.backgroundWhite};
    border-radius: 1rem;
    padding: 2.5rem;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
    max-width: 500px;
    width: 100%;
    text-align: center;
    animation: fadeIn 0.8s ease-out;
  }

  .form-title {
    font-size: 1.75rem;
    font-weight: 600;
    color: ${colors.text};
    margin-bottom: 0.5rem;
  }

  .form-description {
    font-size: 1rem;
    color: ${colors.secondaryText};
    margin-bottom: 1.5rem;
  }

  .form-group {
    text-align: left;
    margin-bottom: 1.5rem;
  }

  .form-label {
    display: block;
    font-size: 0.9rem;
    font-weight: 500;
    color: ${colors.text};
    margin-bottom: 0.5rem;
  }

  .form-input-style {
    width: 100%;
    padding: 1rem;
    border: 1px solid ${colors.border};
    border-radius: 0.5rem;
    font-size: 1rem;
    color: ${colors.text};
    background: ${colors.backgroundLight};
    transition: all 0.3s ease;
  }

  .form-input-style:focus {
    outline: none;
    border-color: ${colors.primary};
    box-shadow: 0 0 0 3px rgba(52, 152, 219, 0.2);
  }

  .file-input-style {
    width: 100%;
    padding: 1rem;
    border: 1px solid ${colors.border};
    border-radius: 0.5rem;
    font-size: 1rem;
    color: ${colors.text};
    background: ${colors.backgroundLight};
  }
  
  .file-input-style::file-selector-button {
    background: ${colors.primary};
    color: ${colors.backgroundWhite};
    border: none;
    padding: 0.5rem 1rem;
    border-radius: 0.25rem;
    cursor: pointer;
    transition: background-color 0.3s ease;
  }

  .file-input-style::file-selector-button:hover {
    background: ${colors.secondary};
  }

  .error-message {
    color: ${colors.destructive};
    font-size: 0.9rem;
    margin-top: 0.5rem;
  }

  .submit-button {
    width: 100%;
    padding: 1rem;
    border: none;
    border-radius: 0.5rem;
    font-size: 1.1rem;
    font-weight: bold;
    cursor: pointer;
    background: linear-gradient(135deg, ${colors.primary}, ${colors.secondary});
    color: ${colors.backgroundWhite};
    transition: all 0.3s ease;
    box-shadow: 0 4px 15px rgba(52, 152, 219, 0.3);
  }

  .submit-button:hover:not(:disabled) {
    background: linear-gradient(135deg, ${colors.secondary}, ${colors.primary});
    box-shadow: 0 6px 20px rgba(52, 152, 219, 0.4);
    animation: pulse 0.5s infinite alternate;
  }

  .submit-button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    background: ${colors.inactive};
    box-shadow: none;
  }

  .footer {
    width: 100%;
    text-align: center;
    padding: 1rem;
    color: ${colors.secondaryText};
    font-size: 0.8rem;
    border-top: 1px solid ${colors.border};
    margin-top: 2rem;
  }

  .footer-text {
    margin: 0;
  }

  .footer-highlight {
    color: ${colors.primary};
    font-weight: bold;
  }
`;

// Helper function to insert the style block into the document head.
const injectStyles = () => {
  const styleTag = document.createElement('style');
  styleTag.textContent = styles;
  document.head.appendChild(styleTag);
};


const UserForm = () => {
    useEffect(() => {
        injectStyles();
    }, []);

    const [form, setForm] = useState({
        username: '',
        email: '',
        resume: null,
    });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleFileChange = (e) => {
        setForm({ ...form, resume: e.target.files[0] });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);

        const formData = new FormData();
        formData.append('username', form.username);
        formData.append('email', form.email);
        formData.append('resume', form.resume);

        try {
            // const response = await fetch('/api/submit-user-form', {
            //     method: 'POST',
            //     body: formData,
            // });

            // if (!response.ok) {
            //     throw new Error('Failed to submit form.');
            // }

            // const result = await response.json();
            // console.log('Form submitted successfully:', result);

            // Temporarily navigate to the interview room on successful mock submission
            navigate('/interviewroom');

        } catch (err) {
            console.error('Submission error:', err);
            setError('An error occurred. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="main-container">
            <header className="header">
                <h1 className="logo">Interview.ai</h1>
            </header>
            
            <main>
                <div className="auth-form-container">
                    <h2 className="form-title">Ready for Your Interview?</h2>
                    <p className="form-description">
                        Please fill out the form below to get started.
                    </p>
                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label className="form-label">Username</label>
                            <input
                                type="text"
                                name="username"
                                value={form.username}
                                onChange={handleChange}
                                required
                                className="form-input-style"
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Email</label>
                            <input
                                type="email"
                                name="email"
                                value={form.email}
                                onChange={handleChange}
                                required
                                className="form-input-style"
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Upload Your Resume</label>
                            <input
                                type="file"
                                name="resume"
                                accept=".pdf,.doc,.docx"
                                onChange={handleFileChange}
                                required
                                className="file-input-style"
                            />
                        </div>
                        {/* Display error message if there is one */}
                        {error && (
                            <p className="error-message">{error}</p>
                        )}
                        {/* Next Button */}
                        <div>
                            <button
                                type="submit"
                                className="submit-button"
                                disabled={isLoading}
                            >
                                {isLoading ? 'Submitting...' : 'Next'}
                            </button>
                        </div>
                    </form>
                </div>
            </main>
            
            <footer className="footer">
                <p className="footer-text">&copy; 2025 <span className="footer-highlight">Interview.ai</span>. All rights reserved.</p>
            </footer>
        </div>
    );
};

export default UserForm;