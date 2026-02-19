import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

export default function OtpPage() {
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const email = location.state?.email;
  const isPasswordReset = location.state?.isPasswordReset || false;

  // If no email passed, redirect to login
  if (!email) {
    navigate("/");
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await fetch(
        `${process.env.REACT_APP_API_BASE_URL}/verify-otp`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, otp, isPasswordReset }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        alert(data.message);

        if (isPasswordReset) {
          navigate("/");
        } else {
          if (data.token) {
            localStorage.setItem("token", data.token);
          }
          navigate("/home");
        }
      } else {
        const errorData = await response.json();
        alert(
          "Verification failed: " +
            (errorData.error || JSON.stringify(errorData))
        );
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Something went wrong during verification!");
    }
    setLoading(false);
  };

  const handleResend = async () => {
    try {
      const response = await fetch(
        `${process.env.REACT_APP_API_BASE_URL}/resend-otp`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        }
      );
      const data = await response.json();
      alert(data.message || "OTP resent successfully!");
    } catch (error) {
      console.error("Resend error:", error);
      alert("Failed to resend OTP.");
    }
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
          Didn't receive the code?{" "}
          <button
            type="button"
            onClick={handleResend}
            className="otp-resend-link"
          >
            Resend
          </button>
        </p>
      </form>
    </div>
  );
}