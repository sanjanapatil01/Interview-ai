// export default UserForm;
import React, { useState } from 'react';
import {  useNavigate, useParams } from 'react-router-dom';
import './userForm.css';





const UserForm = () => {
  const { id: sessionId } = useParams();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    username: '',
    email: '',
    resume: null,
    preferredDomain: '',
    yearOfStudy: '',
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const [reportId, setReportId] = useState(null);


  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };
// useEffect(() => {
//     console.log("Fetched session ID from URL:", sessionId);
//     const interviewerid=fetch(`${process.env.REACT_APP_API_BASE_URL}/check_session/${sessionId}`)
//     .then(response => response.json())
//     .then(data => {
//         setInterviewerId(data.interviewerId);
//         console.log("Fetched interviewer ID:", data.interviewerId);
//     })
//     .catch(error => {
//         console.error("Error fetching interviewer ID:", error);
//     });
// }, [sessionId]);

  const allowedTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ];

  const preferredDomainOptions = [
    'JAVA FullStack Developer',
    'AI-ML Engineer',
    'UI-UX Designer',
    'Graphics Designer',
    'Video Editor',
    'MERN Stack Developer',
    'Marketing Intern',
    'R&D Analyst',
    'Others'
  ];

  const yearOfStudyOptions = [
    '1st Year',
    '2nd Year',
    '3rd Year',
    'Final Year',
    'Graduated'
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

const createReport = async (sessionId, userId, email, username) => {
  try {
    const response = await fetch(`${process.env.REACT_APP_API_BASE_URL}/create-report`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sessionId,
        interviewerId: interviewerId, //  use state variable
        userId, // ADD THIS — was missing
        email,
        name: username,
        preferredDomain: form.preferredDomain,
        yearOfStudy: form.yearOfStudy,
      }),
    });

    if (!response.ok) {
      const body = await response.text().catch(() => response.statusText);
      throw new Error(body || `Create report failed (${response.status})`);
    }

    const data = await response.json();
    setReportId(data.reportId);
    console.log("✅ Report created with ID:", data.reportId);
    return { success: true, data };
  } catch (err) {
    console.error("❌ Report creation failed:", err);
    return { success: false, error: err.message || String(err) };
  }
};

const uploadResume = async () => {
  setIsLoading(true);
  try {
    const formData = new FormData();
    formData.append('file', form.resume);
    formData.append('name', form.username);
    formData.append('email', form.email);
    

    const response = await fetch(`${process.env.REACT_APP_FLASK_API_BASE_URL}/api/resumes/upload`, {
      method: 'POST',
      headers:{'X-API-KEY':process.env.REACT_APP_FLASK_API_KEY},
      body: formData,
    });

    const result = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(result.message || `Upload failed (${response.status})`);
    }

   const userIdFromUpload = result.candidate_id;

    //  NOW call createReport with userId
    const reportResult = await createReport(sessionId, result.candidate_id, form.email, form.username);
    if (reportResult.success) {
      navigate('/startinterview', { state: { candidateId: result.candidate_id,resumeId:result.resume_id,reportId:reportResult.data.reportId ,role:form.preferredDomain} });
      return;
    }
    console.log('reportResult',reportResult.data.reportId);

    // If createReport failed, attempt recovery
    try {
      const checkRes = await fetch(`${process.env.REACT_APP_API_BASE_URL}/check_session/${sessionId}/${form.email}`);
      const checkData = await checkRes.json();
      if (checkRes.ok && checkData && (checkData.userId || checkData.user_id)) {
        const existingUserId = checkData.userId || checkData.user_id || userIdFromUpload;
        console.log('Using existing user id:', existingUserId);

        const retryReport = await createReport(sessionId, existingUserId, form.email, form.username);
        if (retryReport.success) {
          navigate('/startinterview', { state: { userId: existingUserId,reportId:reportId } });
          return;
        } else {
          throw new Error(`Report retry failed: ${retryReport.error}`);
        }
      } else {
        throw new Error(`Report creation failed: ${reportResult.error}`);
      }
    } catch (retryErr) {
      console.error('Report creation recovery failed:', retryErr);
      throw retryErr;
    }
  } finally {
    setIsLoading(false);
  }
};

const checkEmailExists = async (e) => {
  e.preventDefault();
  setError(null);

  if (!form.resume) return setError("Upload your resume!");
  if (!form.email.trim()) return setError("Enter your email!");

  setIsLoading(true);

  try {
    const res = await fetch(`${process.env.REACT_APP_API_BASE_URL}/check_session/${sessionId}/${form.email}`);
    const data = await res.json();

    if (!data.emailExists) return setError("Email not found. Register first.");
    
    // SET interviewerId BEFORE uploadResume
    // setTime(data.startTime || null);
    // setDate(data.scheduledDate || null);

    if (data.interviewerId !== null) {
      //  Now uploadResume will use the interviewerId from state
      await uploadResume();
    } else {
      setError("Interviewer ID not found for this session.");
    }
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
              <label className="form-label">Preferred Domain</label>
              <select
                name="preferredDomain"
                value={form.preferredDomain}
                onChange={handleChange}
                required
                className="form-input-style"
              >
                <option value="">Select your preferred domain</option>
                {preferredDomainOptions.map((option, index) => (
                  <option key={index} value={option}>{option}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Year of Study</label>
              <select
                name="yearOfStudy"
                value={form.yearOfStudy}
                onChange={handleChange}
                required
                className="form-input-style"
              >
                <option value="">Select your year of study</option>
                {yearOfStudyOptions.map((option, index) => (
                  <option key={index} value={option}>{option}</option>
                ))}
              </select>
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
