import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function ForgotPasswordPage() {
  const [form, setForm] = useState({
    email: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    if (form.newPassword !== form.confirmPassword) {
      setLoading(false);
      return alert("New passwords do not match.");
    }

    try {
      //  Call backend route to initiate password reset (generate OTP)
      const response = await fetch(`${process.env.REACT_APP_API_BASE_URL}/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: form.email,
          newPassword: form.newPassword,
        }),
      });

      if (response.ok) {
        alert("Password reset initiated. Please check your email for the verification code.");
        
        // Redirect to OTP page, passing the email and a flag indicating a reset flow
        navigate('/otp', { 
            state: { 
                email: form.email, 
                isPasswordReset: true 
            } 
        });
      } else {
        const errorData = await response.json();
        alert("Reset failed: " + (errorData.error || JSON.stringify(errorData)));
      }
    } catch (error) {
      console.error("Error initiating reset:", error);
      alert("Something went wrong while initiating password reset.");
    }
    setLoading(false);
  };

  return (
    <div className="auth-main-container">
      <div className="auth-card">
        <h2 className="auth-form-title">Reset Password</h2>
        <p className="auth-subtitle">Enter your email and new password. We will send an OTP to verify.</p>
        
        <form onSubmit={handleSubmit} className="auth-form">
          
          <input
            type="email"
            name="email"
            placeholder="Email Address"
            value={form.email}
            onChange={handleChange}
            className="auth-input"
            required
          />

          <input
            type="password"
            name="newPassword"
            placeholder="New Password"
            value={form.newPassword}
            onChange={handleChange}
            className="auth-input"
            required
          />
          
          <input
            type="password"
            name="confirmPassword"
            placeholder="Confirm New Password"
            value={form.confirmPassword}
            onChange={handleChange}
            className="auth-input"
            required
          />
          
          <button
            type="submit"
            className="auth-submit-btn"
            disabled={loading}
          >
            {loading ? "Sending OTP..." : "Reset Password"}
          </button>
        </form>
      </div>
    </div>
  );
}