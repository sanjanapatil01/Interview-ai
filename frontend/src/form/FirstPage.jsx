import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import LoginForm from "./LoginPage";
import RegisterForm from "./RegistrationPage";
import "./FirstPage.css";

import { auth ,db} from '../Firebase';
import { createUserWithEmailAndPassword ,signInWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';



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



// Logo Component
const AuthLogo = () => {
  return (
    <div className="auth-logo-container">
      
      <h1 className="auth-logo">Interview.ai</h1>
      <p className="auth-logo-subtitle">AI-Powered Interview Platform</p>
    </div>
  );
};


  // API: Register 
  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);

    if (form.password !== form.confirm_password) {
        alert("Passwords do not match!");
        setLoading(false);
        return;
    }

    try {
        // 1. Create User in Firebase Authentication (Uses email and password)
        const userCredential = await createUserWithEmailAndPassword(
            auth,
            form.email,
            form.password
        );
        const user = userCredential.user;
        
        // 2. [Optional Firestore Save]
        // You are using both MongoDB and Firestore. Ensure you save to Firestore if needed.
        await setDoc(doc(db, 'users', user.uid), { 
            email: user.email, 
            username: form.username, 
            uid: user.uid, 
            usertype: form.usertype, 
        });

        // 3. Send data (including Firebase UID) to your backend (MongoDB/OTP)
        const response = await fetch("http://localhost:8000/api/register", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                // CRITICAL: Ensure all fields required by MongoDB User model are sent
                username: form.username,
                email: form.email,
                password: form.password, 
                usertype: form.usertype,
                uid: user.uid, // <-- This is the most likely missing field causing the 400
            }),
        });

        if (response.ok) {
            alert("Registration successful! An OTP has been sent to your email.");
            // Redirect to OTP page, passing the email via state
            navigate("/otp", { state: { email: form.email } }); 
        } else {
            const err = await response.json();
            alert("Registration failed on server: " + (err.error || JSON.stringify(err)));
            
            // If server registration fails (e.g., duplicate username), delete the user from Firebase 
            // to prevent orphaned accounts.
            await user.delete();
        }

    } catch (error) {
        // Handle Firebase errors (e.g., email already in use, weak password)
        console.error("Firebase Registration Error:", error);
        let errorMessage = "Registration failed. ";
        if (error.code === 'auth/email-already-in-use') {
            errorMessage = "That email is already in use.";
        } else if (error.code === 'auth/weak-password') {
            errorMessage = "Password should be at least 6 characters.";
        } else {
            errorMessage += error.message;
        }
        alert(errorMessage);
    }
    setLoading(false);
  };

 

  // API: Login - 


const handleLogin = async (e) => {
  e.preventDefault();
  setLoading(true);

  // NOTE: Assuming the 'username' form field is being used to enter the email
  const loginIdentifier = form.email || form.username; 

  try {
    // 1. Authenticate with Firebase using email and password
    const userCredential = await signInWithEmailAndPassword(
      auth, 
      loginIdentifier, 
      form.password
    );
    const user = userCredential.user; // Get the authenticated Firebase user object

    // 2. CRITICAL STEP: Get the Firebase ID Token
    // This token proves the user is authenticated via Firebase.
    const firebaseToken = await user.getIdToken();

    // 3. Send the Firebase ID Token to the backend /api/login for session creation
    const response = await fetch("http://localhost:8000/api/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // This MUST be the Firebase ID Token for the backend's 'authenticate' middleware
        "Authorization": `Bearer ${firebaseToken}`, 
      },
      body: JSON.stringify({ 
          uid: user.uid, // Send UID for server-side MongoDB lookup validation
      }), 
    });

    if (response.ok) {
      const data = await response.json();
      // The backend returns the custom JWT for *your application's* session management
      localStorage.setItem("token", data.token);
      localStorage.setItem("userId", data.userId); // Store userId for later use

      alert("Login Successful!");
      navigate("/home"); // Redirect to the dashboard
    } else {
      // Handles errors from the backend's /api/login route (e.g., User not found in MongoDB)
      const err = await response.json();
      alert("Login failed: " + (err.error || JSON.stringify(err)));
    }
  } catch (error) {
    // Handles errors from Firebase (e.g., wrong password, user not found)
    console.error("Login Error:", error);
    alert("Login failed: " + error.message);
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