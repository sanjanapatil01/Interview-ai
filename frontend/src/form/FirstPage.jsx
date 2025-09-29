import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import LoginForm from "./LoginPage";
import RegisterForm from "./RegistrationPage";
import "./FirstPage.css";
import firebase from "../Firebase";

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
  const ref=firebase.firestore().collection("")
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

  // API: Register
  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await fetch("http://localhost:8000/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (response.ok) {
        alert("Registered Successfully! Please check your email for OTP.");
        navigate("/otp", { state: { email: form.email } });
      } else {
        const err = await response.json();
        alert("Registration failed: " + (err.error || JSON.stringify(err)));
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Something went wrong during registration.");
    }
    setLoading(false);
  };

  // API: Login
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await fetch("http://localhost:8000/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: form.username,
          password: form.password,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        localStorage.setItem("token", data.token || "");
        alert("Login Successful!");
        navigate("/home");
      } else {
        const err = await response.json();
        alert("Login failed: " + (err.error || JSON.stringify(err)));
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Something went wrong during login.");
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
