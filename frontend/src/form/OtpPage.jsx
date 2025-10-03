import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

export default function OtpPage() {
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  // Read email and the new flag from state
  const email = location.state?.email || "unknown email";
  const isPasswordReset = location.state?.isPasswordReset || false; 

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await fetch("http://localhost:8000/api/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // Send the isPasswordReset flag to the backend
        body: JSON.stringify({ email, otp, isPasswordReset }), 
      });

      if (response.ok) {
        const data = await response.json();
        
        alert(data.message); // Display success message

        // Logic for successful verification
        if (isPasswordReset) {
            // Password reset is complete, force user back to login
            navigate("/"); 
        } else {
            // Regular registration verification
            if (data.token) {
              localStorage.setItem("token", data.token);
            }
            navigate("/home"); 
        }
        
      } else {
        const errorData = await response.json();
        alert("Verification failed: " + (errorData.error || JSON.stringify(errorData)));
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Something went wrong during verification!");
    }
    setLoading(false);
  };

  return (
    <div className="otp-container">
      <form onSubmit={handleSubmit} className="otp-card">
        <div className="auth-logo-icon">🔐</div>
        <h2 className="otp-title">Verify Your Identity</h2>
        <p className="otp-subtitle">
          We've sent a verification code to:<br />
          <span className="otp-email">{email}</span>
        </p>
        
        <input
          type="text"
          placeholder="Enter OTP"
          value={otp}
          onChange={(e) => setOtp(e.target.value)}
          className="otp-input"
          maxLength="6"
          required
        />
        
        <button
          type="submit"
          className="auth-submit-btn"
          disabled={loading}
        >
          {loading ? "Verifying..." : "Verify Code"}
        </button>
        
        <p className="otp-resend-prompt">
          Didn't receive the code? <a href="#" className="otp-resend-link">Resend</a>
        </p>
      </form>
    </div>
  );
}