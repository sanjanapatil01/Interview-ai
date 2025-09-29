import React, { useState } from "react";
import "./Home.css";

const EditProfile = () => {
  const [formData, setFormData] = useState({
    username: "vtuLogin",
    email: "user@example.com",
    password: "",
    confirmPassword: "",
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      alert("Passwords do not match!");
      return;
    }
    console.log("Profile updated:", formData);
    alert("Profile updated successfully!");
  };

  return (
    <div className="profile-page-container">
      <div className="profile-form-container">
        <h2 className="profile-form-title">
          Edit Profile
        </h2>

        <form onSubmit={handleSave} className="profile-form">
          {/* Username */}
          <input
            type="text"
            name="username"
            value={formData.username}
            onChange={handleChange}
            placeholder="Username"
            className="profile-input"
          />

          {/* Email */}
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="Email"
            className="profile-input"
          />

          {/* Password */}
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            placeholder="New Password"
            className="profile-input"
          />

          {/* Confirm Password */}
          <input
            type="password"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange}
            placeholder="Confirm Password"
            className="profile-input"
          />

          {/* Save Button */}
          <button
            type="submit"
            className="profile-save-btn"
          >
            Save Changes
          </button>
        </form>
      </div>
    </div>
  );
};

export default EditProfile;