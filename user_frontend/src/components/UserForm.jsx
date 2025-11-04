// import React, { useState, useEffect } from 'react';
// import { useNavigate } from 'react-router-dom';
// import { useParams } from 'react-router-dom';




// // New Core Color Palette
// const colors = {
//   primary: '#3498db',
//   secondary: '#2980b9',
//   text: '#2c3e50',
//   secondaryText: '#7f8c8d',
//   backgroundLight: '#f8f9fa',
//   backgroundWhite: '#ffffff',
//   border: '#e9ecef',
//   active: '#27ae60',
//   destructive: '#e74c3c',
//   inactive: '#bdc3c7',
// };

// // CSS styles for the form.
// const styles = `
//   @keyframes fadeIn {
//     from {
//       opacity: 0;
//       transform: translateY(20px);
//     }
//     to {
//       opacity: 1;
//       transform: translateY(0);
//     }
//   }

//   @keyframes pulse {
//     0%, 100% {
//       transform: scale(1);
//     }
//     50% {
//       transform: scale(1.02);
//     }
//   }

//   body {
//     background: ${colors.backgroundWhite};
//     font-family: 'Inter', sans-serif;
//   }

//   .main-container {
//     background: ${colors.backgroundWhite};
//     min-height: 100vh;
//     display: flex;
//     flex-direction: column;
//     align-items: center;
//     justify-content: space-between;
//     padding: 20px;
//   }

//   .header {
//     width: 100%;
//     padding: 20px;
//     display: flex;
//     justify-content: center;
//     animation: fadeIn 0.8s ease-out;
//   }

//   .logo {
//     font-size: 2.5rem;
//     font-weight: bold;
//     background: linear-gradient(135deg, ${colors.primary}, ${colors.secondary});
//     -webkit-background-clip: text;
//     -webkit-text-fill-color: transparent;
//   }

//   .auth-form-container {
//     background: ${colors.backgroundWhite};
//     border-radius: 1rem;
//     padding: 2.5rem;
//     box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
//     max-width: 500px;
//     width: 100%;
//     text-align: center;
//     animation: fadeIn 0.8s ease-out;
//   }

//   .form-title {
//     font-size: 1.75rem;
//     font-weight: 600;
//     color: ${colors.text};
//     margin-bottom: 0.5rem;
//   }

//   .form-description {
//     font-size: 1rem;
//     color: ${colors.secondaryText};
//     margin-bottom: 1.5rem;
//   }

//   .form-group {
//     text-align: left;
//     margin-bottom: 1.5rem;
//   }

//   .form-label {
//     display: block;
//     font-size: 0.9rem;
//     font-weight: 500;
//     color: ${colors.text};
//     margin-bottom: 0.5rem;
//   }

//   .form-input-style {
//     width: 100%;
//     padding: 1rem;
//     border: 1px solid ${colors.border};
//     border-radius: 0.5rem;
//     font-size: 1rem;
//     color: ${colors.text};
//     background: ${colors.backgroundLight};
//     transition: all 0.3s ease;
//   }

//   .form-input-style:focus {
//     outline: none;
//     border-color: ${colors.primary};
//     box-shadow: 0 0 0 3px rgba(52, 152, 219, 0.2);
//   }

//   .file-input-style {
//     width: 100%;
//     padding: 1rem;
//     border: 1px solid ${colors.border};
//     border-radius: 0.5rem;
//     font-size: 1rem;
//     color: ${colors.text};
//     background: ${colors.backgroundLight};
//   }
  
//   .file-input-style::file-selector-button {
//     background: ${colors.primary};
//     color: ${colors.backgroundWhite};
//     border: none;
//     padding: 0.5rem 1rem;
//     border-radius: 0.25rem;
//     cursor: pointer;
//     transition: background-color 0.3s ease;
//   }

//   .file-input-style::file-selector-button:hover {
//     background: ${colors.secondary};
//   }

//   .error-message {
//     color: ${colors.destructive};
//     font-size: 0.9rem;
//     margin-top: 0.5rem;
//     padding: 0.75rem;
//     background: #fbecec;
//     border-radius: 0.5rem;
//     border: 1px solid ${colors.destructive};
//   }

//   .submit-button {
//     width: 100%;
//     padding: 1rem;
//     border: none;
//     border-radius: 0.5rem;
//     font-size: 1.1rem;
//     font-weight: bold;
//     cursor: pointer;
//     background: linear-gradient(135deg, ${colors.primary}, ${colors.secondary});
//     color: ${colors.backgroundWhite};
//     transition: all 0.3s ease;
//     box-shadow: 0 4px 15px rgba(52, 152, 219, 0.3);
//   }

//   .submit-button:hover:not(:disabled) {
//     background: linear-gradient(135deg, ${colors.secondary}, ${colors.primary});
//     box-shadow: 0 6px 20px rgba(52, 152, 219, 0.4);
//     animation: pulse 0.5s infinite alternate;
//   }

//   .submit-button:disabled {
//     opacity: 0.6;
//     cursor: not-allowed;
//     background: ${colors.inactive};
//     box-shadow: none;
//   }

//   .footer {
//     width: 100%;
//     text-align: center;
//     padding: 1rem;
//     color: ${colors.secondaryText};
//     font-size: 0.8rem;
//     border-top: 1px solid ${colors.border};
//     margin-top: 2rem;
//   }

//   .footer-text {
//     margin: 0;
//   }

//   .footer-highlight {
//     color: ${colors.primary};
//     font-weight: bold;
//   }
// `;

// // Helper function to insert the style block into the document head.
// const injectStyles = () => {
//   const styleTag = document.createElement('style');
//   styleTag.textContent = styles;
//   document.head.appendChild(styleTag);
// };


// const UserForm = () => {
//    const { id: sessionId } = useParams();
//     useEffect(() => {
//         injectStyles();
//         console.log("Fetched user ID from URL:", sessionId);
//     }, [sessionId]);

//     const [form, setForm] = useState({
       
//         username: '',
//         email: '',
//         resume: null,
//     });
//     const [isLoading, setIsLoading] = useState(false);
//     const [error, setError] = useState(null);
//     // Note: useNavigate is assumed to be available from react-router-dom
//     // If you are not using a router, you can remove this and the import.
//     const navigate = useNavigate();

//     const handleChange = (e) => {
//         setForm({ ...form, [e.target.name]: e.target.value });
//     };

//     // ...existing code...

// const allowedTypes = [
//   'application/pdf',
//   'application/msword', // .doc
//   'application/vnd.openxmlformats-officedocument.wordprocessingml.document' // .docx
// ];

// const handleFileChange = (e) => {
//     const file = e.target.files[0];
//     if (file && allowedTypes.includes(file.type)) {
//         setForm({ ...form, resume: file });
//         setError(null);
//     } else if (file) {
//         setForm({ ...form, resume: null });
//         setError('Unsupported file type. Please upload a PDF or Word document.');
//     } else {
//         setForm({ ...form, resume: null });
//     }
// };
// const checkEmailExists = async () => {
   
//   if (!form.resume) {
//     setError('Please upload a valid resume file.');
//     return;
//   }
  

//     if (!form.email.trim()) return setError("Please enter your email!");

//     setError(null);
   

//     try {
//       const res = await fetch(`http://localhost:8000/api/check_session/${sessionId}/${form.email}`);
//       const data = await res.json();

//       if (data.emailExists) {
//         handleSubmit();
//       } else {
//         console.warn("Email does not exist in the system.");
//         setError("Email not found. Please register first.");
//       }
//     } catch (error) {
//       console.error(error);
//       setError("Server error while checking email!");
//     }

    
//   };
// const handleSubmit = async (e) => {
//   e.preventDefault();
//   setError(null);
//   setIsLoading(true);
//   const formData = new FormData();
  
//   formData.append('resume', form.resume);
//   formData.append('name', form.username);
//   formData.append('email', form.email);
//   try {
//     const response = await fetch('http://127.0.0.1:5000/api/flask/upload_resume', {
//       method: 'POST',
//       body: formData,  // ✅ Correct: send FormData directly
//       // ❌ DO NOT set Content-Type manually — the browser does this automatically
//     });

//     if (!response.ok) {
//       let errorMessage = response.statusText;
//       try {
//         const errorData = await response.json();
//         if (errorData.message) {
//           errorMessage = errorData.message;
//         }
//       } catch (e) {
//         console.error("Could not parse error JSON:", e);
//       }
//       throw new Error(`Failed to upload resume (Status: ${response.status}): ${errorMessage}`);
//     }

//    const result = await response.json();
// console.log('Resume uploaded successfully:', result);

// // ✅ Extract user_id from backend response (adjust key name if different)
// const userId = result.user_id || result.id || result.userId;

// // ✅ Navigate with userId as state or param
// if (userId) {
//   navigate('/startinterview', { state: { userId } });
// } else {
//   console.warn("No user_id returned from API. Check backend response keys:", result);
//   setError("Something went wrong. User ID not received from server.");
// }
//   } catch (err) {
//     console.error('Submission error:', err);
//     setError(err.message || 'An unexpected error occurred. Please try again.');
//   } finally {
//     setIsLoading(false);
//   }
// };

                
        

// // ...existing code...
//     return (
//         <div className="main-container">
//             <header className="header">
//                 <h1 className="logo">Interview.ai</h1>
//             </header>
            
//             <main>
//                 <div className="auth-form-container">
//                     <h2 className="form-title">Ready for Your Interview?</h2>
//                     <p className="form-description">
//                         Please fill out the form below and upload your resume to get started.
//                     </p>
//                     <form onSubmit={checkEmailExists}>
//                         <div className="form-group">
//                             <label className="form-label">Username</label>
//                             <input
//                                 type="text"
//                                 name="username"
//                                 value={form.username}
//                                 onChange={handleChange}
//                                 required
//                                 className="form-input-style"
//                             />
//                         </div>
//                         <div className="form-group">
//                             <label className="form-label">Email</label>
//                             <input
//                                 type="email"
//                                 name="email"
//                                 value={form.email}
//                                 onChange={handleChange}
//                                 required
//                                 className="form-input-style"
//                             />
//                         </div>
//                         <div className="form-group">
//                             <label className="form-label">Upload Your Resume (.pdf, .doc, .docx)</label>
//                             <input
//                                 type="file"
//                                 name="resume"
//                                 accept=".pdf,.doc,.docx"
//                                 onChange={handleFileChange}
//                                 required
//                                 className="file-input-style"
//                             />
//                         </div>
//                         {/* Display error message if there is one */}
//                         {error && (
//                             <p className="error-message">Error: {error}</p>
//                         )}
//                         {/* Next Button */}
//                         <div>
//                             <button
//                                 type="submit"
//                                 className="submit-button"
//                                 disabled={isLoading || !form.username || !form.email || !form.resume}
//                             >
//                                 {isLoading ? 'Submitting...' : 'Submit'}
//                             </button>
//                         </div>
//                     </form>
//                 </div>
//             </main>
            
//             <footer className="footer">
//                 <p className="footer-text">&copy; 2025 <span className="footer-highlight">Interview.ai</span>. All rights reserved.</p>
//             </footer>
//         </div>
//     );
// };

// export default UserForm;
import React, { useState, useEffect } from 'react';
import { data, useNavigate, useParams } from 'react-router-dom';

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
  destructive: '#e74c3c',
  inactive: '#bdc3c7',
};

// CSS Styles
const styles = `
  @keyframes fadeIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
  @keyframes pulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.02); } }

  body { background: ${colors.backgroundWhite}; font-family: 'Inter', sans-serif; }

  .main-container { background: ${colors.backgroundWhite}; min-height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: space-between; padding: 20px; }

  .header { width: 100%; padding: 20px; display: flex; justify-content: center; animation: fadeIn 0.8s ease-out; }
  .logo { font-size: 2.5rem; font-weight: bold; background: linear-gradient(135deg, ${colors.primary}, ${colors.secondary}); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }

  .auth-form-container { background: ${colors.backgroundWhite}; border-radius: 1rem; padding: 2.5rem; box-shadow: 0 10px 30px rgba(0,0,0,0.1); max-width: 500px; width: 100%; text-align: center; animation: fadeIn 0.8s ease-out; }

  .form-title { font-size: 1.75rem; font-weight: 600; color: ${colors.text}; margin-bottom: 0.5rem; }
  .form-description { font-size: 1rem; color: ${colors.secondaryText}; margin-bottom: 1.5rem; }

  .form-group { text-align: left; margin-bottom: 1.5rem; }
  .form-label { display: block; font-size: 0.9rem; font-weight: 500; color: ${colors.text}; margin-bottom: 0.5rem; }

  .form-input-style, .file-input-style {
    width: 100%; padding: 1rem; border: 1px solid ${colors.border};
    border-radius: 0.5rem; font-size: 1rem; color: ${colors.text};
    background: ${colors.backgroundLight}; transition: all 0.3s ease;
  }

  .form-input-style:focus { outline: none; border-color: ${colors.primary}; box-shadow: 0 0 0 3px rgba(52,152,219,0.2); }

  .file-input-style::file-selector-button {
    background: ${colors.primary}; color: ${colors.backgroundWhite}; border: none;
    padding: 0.5rem 1rem; border-radius: 0.25rem; cursor: pointer;
  }

  .file-input-style::file-selector-button:hover { background: ${colors.secondary}; }

  .error-message {
    color: ${colors.destructive}; font-size: 0.9rem; margin-top: 0.5rem;
    padding: 0.75rem; background: #fbecec; border-radius: 0.5rem;
    border: 1px solid ${colors.destructive};
  }

  .submit-button {
    width: 100%; padding: 1rem; border: none; border-radius: 0.5rem;
    font-size: 1.1rem; font-weight: bold; cursor: pointer;
    background: linear-gradient(135deg, ${colors.primary}, ${colors.secondary});
    color: ${colors.backgroundWhite}; transition: all 0.3s ease;
    box-shadow: 0 4px 15px rgba(52,152,219,0.3);
  }

  .submit-button:hover:not(:disabled) {
    background: linear-gradient(135deg, ${colors.secondary}, ${colors.primary});
    box-shadow: 0 6px 20px rgba(52,152,219,0.4);
    animation: pulse 0.5s infinite alternate;
  }

  .submit-button:disabled { opacity: 0.6; cursor: not-allowed; background: ${colors.inactive}; }

  .footer { width: 100%; text-align: center; padding: 1rem; color: ${colors.secondaryText}; font-size: 0.8rem; border-top: 1px solid ${colors.border}; }
`;

const injectStyles = () => {
  const styleTag = document.createElement('style');
  styleTag.textContent = styles;
  document.head.appendChild(styleTag);
};

const UserForm = () => {
  const { id: sessionId } = useParams();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    username: '',
    email: '',
    resume: null,
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [interviewerId, setInterviewerId] = useState(null);
  const [time, setTime] = useState(null);
  const [date, setDate] = useState(null);

  useEffect(() => { injectStyles(); }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const allowedTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ];

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!allowedTypes.includes(file.type)) {
      setError('Unsupported file type. Please upload a PDF or Word document.');
      setForm({ ...form, resume: null });
    } else {
      setError(null);
      setForm({ ...form, resume: file });
    }
  };
  const createReport = async (sessionId, userId, resumeUrl, email, username) => {
  try {
    const response = await fetch("http://localhost:8000/api/create-report", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sessionId,
        interviewerId: interviewerId, // ✅ replace with actual interviewer ID if available
        userId,
        email,
        name: username,
        resumeUrl
      }),
    });

    const data = await response.json();
    if (!data.success) throw new Error("Report creation failed");
    localStorage.setItem("reportId", data.reportId);
    console.log("✅ Report created with ID:", data.reportId);
    return true;
  } catch (err) {
    console.error("❌ Report creation failed:", err);
    return false;
  }
};


  const uploadResume = async () => {
    const formData = new FormData();
    formData.append('resume', form.resume);
    formData.append('name', form.username);
    formData.append('email', form.email);

    const response = await fetch('http://127.0.0.1:5000/api/flask/upload_resume', {
      method: 'POST',
      body: formData,
    });

    const result = await response.json();

    if (!response.ok) throw new Error(result.message || 'Upload failed');

    const userId = result.user_id || result.id || result.userId;
    console.log('Resume uploaded, userId:', userId);
    const resumeUrl = result.resumeUrl;
    console.log('Resume URL:', resumeUrl);

  // ✅ Now call createReport BEFORE navigate
  const reportStatus = await createReport(
    sessionId,
    userId,
    resumeUrl,
    form.email,
    form.username
  );

  if (!reportStatus) {
    setError("Report creation failed. Try again!");
  
    return;
  }

  

    navigate('/startinterview', { state: { userId } });
  };

  const checkEmailExists = async (e) => {
    e.preventDefault();
    setError(null);

    if (!form.resume) return setError("Upload your resume!");
    if (!form.email.trim()) return setError("Enter your email!");

    setIsLoading(true);

    try {
      const res = await fetch(`http://localhost:8000/api/check_session/${sessionId}/${form.email}`);
      const data = await res.json();

      if (!data.emailExists) return setError("Email not found. Register first.");
      setInterviewerId(data.interviewerId || null);
      setTime(data.startTime || null);
      setDate(data.scheduledDate|| null)

      await uploadResume();

    } catch (err) {
      setError(err.message || 'Server error');
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
          <p className="form-description">Upload your details and resume to start!</p>

          <form onSubmit={checkEmailExists}>
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
              <label className="form-label">Upload Resume (.pdf, .doc, .docx)</label>
              <input
                type="file"
                name="resume"
                accept=".pdf,.doc,.docx"
                onChange={handleFileChange}
                required
                className="file-input-style"
              />
            </div>

            {error && <p className="error-message">⚠ {error}</p>}

            <button
              type="submit"
              className="submit-button"
              disabled={isLoading}
            >
              {isLoading ? 'Checking…' : 'Submit'}
            </button>
          </form>
        </div>
      </main>

      <footer className="footer">
        <p>&copy; 2025 <span className="footer-highlight">Interview.ai</span>. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default UserForm;
