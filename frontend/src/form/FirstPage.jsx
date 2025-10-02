import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import LoginForm from "./LoginPage";
import RegisterForm from "./RegistrationPage";
import "./FirstPage.css";

import { auth ,db} from '../Firebase';
import { createUserWithEmailAndPassword ,signInWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';

// Logo Component
const AuthLogo = () => {
  return (
    <div className="auth-logo-container">
      
      <h1 className="auth-logo">Interview.ai</h1>
      <p className="auth-logo-subtitle">AI-Powered Interview Platform</p>
    </div>
  );
};

export default function FirstPage() {

  const [activeTab, setActiveTab] = useState("login"); // "login" | "register"
  const [form, setForm] = useState({
    username: "",
    email: "",
    usertype: "candidate",
    password: "",
    confirm_password: "",
  });
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // API: Register - CORRECTED FOR OTP FLOW
  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    if (form.password !== form.confirm_password) {
        setLoading(false);
        return alert("Passwords do not match.");
    }
    
    try {
      // 1. Create user in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, form.email, form.password);
      const user = userCredential.user;

      // 2. Store extra info in Firestore (Optional)
      await setDoc(doc(db, 'users', user.uid), {
        email: user.email,
        username: form.username,
        uid: user.uid,
        usertype: form.usertype,
      });

      // 3. Send data to backend to save to MongoDB and SEND OTP
      const response = await fetch('http://localhost:8000/api/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          uid: user.uid,
          email: form.email,
          username: form.username, 
          usertype: form.usertype,
        })
      });

      if (response.ok) {
        // Successful response
        const data = await response.json(); 
        
        // 4. Navigate to OTP verification page
        alert('Registration successful! Please check your email for the verification code.');
        navigate('/otp', { state: { email: form.email } });

      } else {
        // Handle non-200/201 responses
        try {
            const err = await response.json();
            alert('Registration failed: ' + (err.error || JSON.stringify(err)));
        } catch (e) {
            // Catches non-JSON error (like the 401 'Unauthorized' issue)
            alert(`Registration failed: Server returned non-JSON error (Status: ${response.status}). If the status is 401, check your main Express file for global authentication middleware.`);
        }
        
        // You may want to delete the Firebase user here if the MongoDB save/OTP send failed
        // await user.delete(); 
      }

    } catch (error) {
      console.error("Registration Error:", error);
      alert('Registration failed: ' + error.message);
    }
    setLoading(false);
  };


  // API: Login - CORRECTED TO CHECK FOR VERIFICATION STATUS
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const loginIdentifier = form.username; 
      
      if (!loginIdentifier.includes('@')) {
          throw new Error("Please enter your email address to sign in (must contain '@').");
      }

      const userCredential = await signInWithEmailAndPassword(auth, loginIdentifier, form.password);
      const user = userCredential.user;
      const idToken = await user.getIdToken();

      // 2. Call backend API to exchange token and check verification status
      const response = await fetch("http://localhost:8000/api/login", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${idToken}` // Pass the Firebase token
        },
        body: JSON.stringify({
          uid: user.uid,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        localStorage.setItem("token", data.token || "");
        alert("Login Successful!");
        navigate("/home");
      } else {
        // Handle login errors gracefully
        try {
            const err = await response.json();
             // Check for specific verification pending error (status 403)
            if (response.status === 403 && err.error && err.error.includes("Please verify your email")) {
                 alert(err.error + " Redirecting to OTP page.");
                 navigate('/otp', { state: { email: loginIdentifier } }); 
            } else {
                alert("Login failed: " + (err.error || JSON.stringify(err)));
            }
        } catch (e) {
            alert(`Login failed: Server returned non-JSON error (Status: ${response.status}). Check server logs for details.`);
        }
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Something went wrong during login: " + error.message);
    }
    setLoading(false);
  };

  return (
    <div className="auth-main-container">
      <div className="auth-card">
        {/* Logo Section */}
        <AuthLogo />

        {/* Toggle Buttons */}
        <div className="auth-tab-container">
          <button
            onClick={() => setActiveTab("login")}
            className={`auth-tab-button ${activeTab === "login" ? "active" : ""}`}
          >
            Login
          </button>
          <button
            onClick={() => setActiveTab("register")}
            className={`auth-tab-button ${activeTab === "register" ? "active" : ""}`}
          >
            Register
          </button>
        </div>

        {/* Render child components */}
        {activeTab === "login" ? (
          <LoginForm
            form={form}
            handleChange={handleChange}
            handleLogin={handleLogin}
          />
        ) : (
          <RegisterForm
            form={form}
            handleChange={handleChange}
            handleRegister={handleRegister}
          />
        )}

        {loading && <p className="status-text">Loading...</p>}
      </div>
    </div>
  );
}