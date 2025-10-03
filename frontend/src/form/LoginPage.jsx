import React from "react";

export default function LoginPage({ form={}, handleChange, handleLogin }) {
  return (
    <form onSubmit={handleLogin} className="auth-form">
      <h2 className="auth-form-title">Welcome Back</h2>
      
      <input
        type="text"
        name="username"
        // **CORRECTION: Update placeholder for clarity**
        placeholder="Email Address" 
        value={form.username}
        onChange={handleChange}
        className="auth-input"
        required
      />
      
      <input
        type="password"
        name="password"
        placeholder="Password"
        value={form.password}
        onChange={handleChange}
        className="auth-input"
        required
      />

      <div className="auth-form-extras">
        <label className="auth-checkbox-container">
          <input type="checkbox" className="auth-checkbox" /> 
          Remember me
        </label>
        <a href="/forgot" className="auth-forgot-link">
          Forgot password?
        </a>
      </div>

      <button
        type="submit"
        className="auth-submit-btn"
      >
        Sign In
      </button>
    </form>
  );
}