import React, { useState, useEffect } from "react";
import { updatePassword } from "firebase/auth";
import { auth } from "../Firebase"; // Assuming your Firebase config is in "../Firebase"
import "./Home.css";

const EditProfile = () => {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    newPassword: "", // Changed to newPassword to match handleSave logic
    confirmPassword: "",
    uid: "", // Store UID for reference
  });
  const [loading, setLoading] = useState(false);
  const [initialEmail, setInitialEmail] = useState(""); // Used for security check

  // --- Fetch Current Profile Data on Load ---
  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem("token");
        const response = await fetch(`${process.env.REACT_APP_API_BASE_URL}/profile`, {
          method: "GET",
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        if (response.ok) {
          const data = await response.json();
          setFormData({
            ...formData,
            username: data.username,
            email: data.email,
            uid: data.uid,
          });
          setInitialEmail(data.email); // Store initial email for change detection
        } else {
          alert("Failed to fetch current profile data.");
        }
      } catch (error) {
        console.error("Fetch profile error:", error);
        alert("An error occurred while loading profile.");
      }
      setLoading(false);
    };

    fetchProfile();
  }, []);
  // ------------------------------------------

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (formData.newPassword !== formData.confirmPassword) {
      alert("Passwords do not match!");
      return;
    }
    setLoading(true);

    try {
      const token = localStorage.getItem("token");
      
      const payload = {
        username: formData.username,
        email: formData.email,
        // Only send the newPassword if the user entered one
        newPassword: formData.newPassword || undefined,
      };

      // 1. Send Update Request to Backend (MongoDB & Firebase Password Update)
      const response = await fetch("http://localhost:8000/api/profile", {
        method: "PUT",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        // Clear password fields on success
        setFormData((prev) => ({
          ...prev,
          newPassword: "",
          confirmPassword: "",
        }));
        
        // If username was updated, refresh the Home page state (handled by useEffect there)
        alert("Profile updated successfully!");
        // Optional: Force a page refresh to update the username on the Home page instantly
        window.location.reload(); 
      } else {
        const errorData = await response.json();
        alert("Update failed: " + (errorData.error || "Server error."));
      }
    } catch (error) {
      console.error("Profile update error:", error);
      alert("An unexpected error occurred during update.");
    }

    setLoading(false);
  };

  if (loading && !formData.uid) {
    return <div className="profile-page-container">Loading Profile...</div>;
  }

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
            required
          />

          {/* Email */}
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="Email"
            className="profile-input"
            required
          />

          {/* Password - Changed name to newPassword */}
          <input
            type="password"
            name="newPassword" 
            value={formData.newPassword}
            onChange={handleChange}
            placeholder="New Password (leave blank to keep current)"
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
            disabled={loading}
          >
            {loading ? "Saving..." : "Save Changes"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default EditProfile;