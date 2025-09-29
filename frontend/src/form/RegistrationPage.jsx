import React from "react";

export default function RegistrationPage({ form={}, handleChange, handleRegister }) {
  return (
    <form onSubmit={handleRegister} className="auth-form">
      <h2 className="auth-form-title">Create Account</h2>
      
      <input
        type="text"
        name="username"
        placeholder="Username"
        value={form.username}
        onChange={handleChange}
        className="auth-input"
        required
      />
      
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
        name="password"
        placeholder="Password"
        value={form.password}
        onChange={handleChange}
        className="auth-input"
        required
      />
      
      <input
        type="password"
        name="confirm_password"
        placeholder="Confirm Password"
        value={form.confirm_password}
        onChange={handleChange}
        className="auth-input"
        required
      />

      <button
        type="submit"
        className="auth-submit-btn register"
      >
        Create Account
      </button>
    </form>
  );
}