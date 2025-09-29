import React, { useState } from "react";
import "./Home.css";

const GenerateLink = ({ interviewDate, setInterviewDate, startTime, setStartTime, endTime, setEndTime }) => {
  const [generatedLink, setGeneratedLink] = useState("");

  const handleGenerate = () => {
    // In real app: fetch from backend instead of random link
    const link = `http://localhost:3000/interview/${Date.now()}`;
    setGeneratedLink(link);
  };

  const handleCopy = () => {
    if (generatedLink) {
      navigator.clipboard.writeText(generatedLink);
      alert("Link copied to clipboard!");
    }
  };

  return (
    <div className="generate-link-wrapper">
      <h1 className="generate-link-title">Generate Interview Link</h1>
      <div className="form-fields-container">
        <div className="form-field">
          <label className="field-label">Interview Date</label>
          <input
            type="date"
            value={interviewDate}
            onChange={(e) => setInterviewDate(e.target.value)}
            className="date-input"
          />
        </div>
        <div className="form-field">
          <label className="field-label">Start Time</label>
          <input
            type="time"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            className="time-input"
          />
        </div>
        <div className="form-field">
          <label className="field-label">End Time</label>
          <input
            type="time"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
            className="time-input"
          />
        </div>
      </div>

      {/* Generate button */}
      <button
        onClick={handleGenerate}
        className="generate-btn"
      >
        Generate Link
      </button>

      {/* Show generated link */}
      {generatedLink && (
        <div className="generated-link-container">
          <span className="generated-link-text">{generatedLink}</span>
          <button
            onClick={handleCopy}
            className="copy-link-btn"
          >
            Copy
          </button>
        </div>
      )}
    </div>
  );
};

export default GenerateLink;