import React, { useState } from "react";
import "./Home.css"; // Assuming this is where your styles are
import Papa from "papaparse";
import './generatelink.css'

const GenerateLink = ({ interviewDate, setInterviewDate, startTime, setStartTime }) => {
  const [generatedLink, setGeneratedLink] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [data, setData] = useState([]);

  const API_URL = `${process.env.REACT_APP_API_BASE_URL}/generate`;

  const handleGenerate = async () => {
    if (!interviewDate || !startTime) {
      setError("Please fill in all date and time fields.");
      return;
    }

    setIsLoading(true);
    setError(null);
    setGeneratedLink("");

    const interviewerId = localStorage.getItem('userId');

    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          interviewerId,
          interviewDate,
          startTime,
          data,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to generate link on the server.");
      }

      const responseData = await response.json();
      const newLink = `${process.env.REACT_APP_USER_URL}interviewcheck/${responseData.sessionId}`;
      setGeneratedLink(newLink);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = () => {
    if (generatedLink) {
      navigator.clipboard.writeText(generatedLink);
      alert("Link copied to clipboard!");
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        setData(results.data);
        console.log(results.data);
      },
    });
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
          <input type="file" accept=".csv" onChange={handleFileChange} />
          {data.length > 0 && (
            <div className="data-preview-container">
              <div className="data-preview-header">
                <span>Uploaded Data Preview</span>
                <span className="data-count">{data.length} entries</span>
              </div>
              <div className="data-table-wrapper">
                <table className="data-table">
                  <thead>
                    <tr>
                      {Object.keys(data[0]).map((key) => (
                        <th key={key}>{key}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {data.map((row, index) => (
                      <tr key={index}>
                        {Object.values(row).map((value, i) => (
                          <td key={i}>{value}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
      {error && <p className="error-message">{error}</p>}
      <button
        onClick={handleGenerate}
        className="generate-btn"
        disabled={isLoading}
      >
        {isLoading ? "Generating..." : "Generate Link"}
      </button>
      {generatedLink && (
        <div className="generated-link-container">
          <p className="generated-link-text">{generatedLink}</p>
          <button onClick={handleCopy} className="copy-link-btn">
            Copy
          </button>
        </div>
      )}
    </div>
  );
};

export default GenerateLink;