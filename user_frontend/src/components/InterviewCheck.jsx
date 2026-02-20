import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

const BACKEND_BASE = process.env.REACT_APP_API_BASE_URL; // Update if deployed

const styles = {
  container: { textAlign: "center", marginTop: "0vh", padding: 20 },
  card: {
    margin: "18px auto",
    width: "min(820px, 92%)",
    background: "#f8f9fa",
    padding: 24,
    borderRadius: 12,
    textAlign: "left",
    boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
  },
  input: {
    width: "100%",
    padding: "12px 14px",
    fontSize: 16,
    borderRadius: 8,
    border: "1px solid #dfe6ee",
    marginTop: 8,
  },
  btn: {
    padding: "12px 20px",
    background: "#3498db",
    color: "#fff",
    border: "none",
    borderRadius: 8,
    cursor: "pointer",
    fontSize: 16,
    fontWeight: "600",
  },
  warn: {
    background: "#fff3cd",
    padding: 14,
    borderRadius: 8,
    border: "1px solid #ffeeba",
    color: "#856404",
    marginTop: 14,
  },
  quote: {
    textAlign: "center",
    marginTop: 20,
    fontStyle: "italic",
    color: "#2c3e50",
  },
  footer: {
    marginTop: 0,
    padding: 0,
    
  },
  footerText: {
    color: "#7f8c8d",
    fontSize: 14,
    textAlign: "center",
  },
};

export default function InterviewCheck() {
  const { sessionId } = useParams();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("idle");
  const [scheduledStart, setScheduledStart] = useState(null);
  const [scheduledEnd, setScheduledEnd] = useState(null);
  const [countdown, setCountdown] = useState("");
  const [error, setError] = useState(null);
  const [interviewerId, setInterviewerId] = useState(null);

  const fmt = (ms) => {
    if (ms <= 0) return "00:00:00";
    const h = String(Math.floor(ms / 3600000)).padStart(2, "0");
    const m = String(Math.floor((ms % 3600000) / 60000)).padStart(2, "0");
    const s = String(Math.floor((ms % 60000) / 1000)).padStart(2, "0");
    return `${h}:${m}:${s}`;
  };

  useEffect(() => {
    if (!scheduledStart || !scheduledEnd) return;
    const timer = setInterval(() => {
      const now = new Date();
      if (status === "waiting") {
        const left = scheduledStart - now;
        setCountdown(fmt(left));
        if (left <= 0) setStatus("ready");
      } else if (status === "ready") {
        const left = scheduledEnd - now;
        setCountdown(fmt(left));
        if (left <= 0) setStatus("expired");
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [scheduledStart, scheduledEnd, status]);

  const handleVerify = async (e) => {
    e.preventDefault();
    setError(null);

    if (!email.includes("@")) {
      setError("Please enter a valid email address.");
      return;
    }

    setStatus("checking");
    try {
      const url = `${BACKEND_BASE}/check_session/${sessionId}/${email}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("Network response not ok");

      const data = await res.json();

      if (!data.emailExists) {
        setError("This email is not registered for the interview.");
        setStatus("invalid");
        return;
      }

      const { scheduledDate: scheduledDateRaw, startTime: startTimeRaw } = data;
      if (!scheduledDateRaw || !startTimeRaw) {
        setError("Server did not return valid schedule info.");
        setStatus("error");
        return;
      }

      const dateObj = new Date(scheduledDateRaw);
      const year = dateObj.getFullYear();
      const month = dateObj.getMonth(); // 0-indexed
      const day = dateObj.getDate();
      const [hour, minute] = startTimeRaw.split(":").map(Number);

      const start = new Date(year, month, day, hour, minute, 0);
      if (isNaN(start.getTime())) {
        setError("Invalid schedule time from server.");
        setStatus("error");
        return;
      }

      const end = new Date(start.getTime() + 30 * 60000);
      setScheduledStart(start);
      setScheduledEnd(end);
      setInterviewerId(data.interviewerId || null);

      const now = new Date();
      if (now < start) setStatus("waiting");
      else if (now >= start && now <= end) setStatus("ready");
      else setStatus("expired");
    } catch (err) {
      console.error("Fetch error:", err);
      setError("⚠ Server error. Try again later.");
      setStatus("error");
    }
  };

  const handleStart = () => {
    navigate(`/userform/${sessionId}`, {
      state: { email: email.toLowerCase(), interviewerId },
    });
  };

  return (
    <div style={styles.container}>
      <h1 style={{ fontSize: 28 }}> Welcome to <span style={{ color: "#3498db" }}>Interview.ai</span></h1>
      <p style={{ fontSize: 16, color: "#333" }}>
        Prepare to showcase your best self — stay calm, confident, and professional.
      </p>

      <div style={styles.card}>
        <form onSubmit={handleVerify}>
          <label style={{ fontWeight: 600 }}>Enter your registered email address:</label>
          <input
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={styles.input}
            required
          />

          {error && <div style={{ color: "#d9534f", marginTop: 10 }}>{error}</div>}

          <div style={{ marginTop: 14 }}>
            <button type="submit" style={styles.btn}>
              Verify & Continue
            </button>
          </div>
        </form>

        <h3 style={{ marginTop: 28 }}> <i>Interview Instructions & Guidelines</i></h3>

        <div style={styles.warn}>
          <strong>⚠ Interview Access Rule:</strong> You must begin your interview{" "}
          <strong>within 30 minutes</strong> of the scheduled start time. Access will be locked
          once this time window expires.
        </div>

        <ul style={{ marginTop: 14, lineHeight: 1.6 }}>
          <li>Ensure your camera and microphone are properly connected.</li>
          <li>Join from a quiet, well-lit environment with minimal background noise.</li>
          <li>Maintain eye contact and speak with clarity and confidence.</li>
          <li>Review your resume beforehand — be ready to discuss your projects and achievements.</li>
          <li>Maintain a professional posture and dress appropriately.</li>
        </ul>

        {/*  Motivation message outside list */}
        <p style={styles.quote}>
          “Every interview is an opportunity — believe in yourself and let your confidence speak for you.”
        </p>

        <hr style={{ margin: "18px 0" }} />

        <div style={{ marginTop: 18 }}>
          {status === "checking" && <p>🔎 Verifying your interview slot...</p>}

          {status === "waiting" && scheduledStart && (
            <>
              <h4> Waiting for your scheduled time!!</h4>
              <p>
                Interview starts at: <strong>{scheduledStart.toLocaleString()}</strong>
              </p>
              <p>
                Time until start: <strong>{countdown}</strong>
              </p>
            </>
          )}

          {status === "ready" && (
            <>
              <h4 style={{ color: "#2d8659" }}> Interview window is now open</h4>
              <p>
                Start time: <strong>{scheduledStart?.toLocaleString()}</strong>
              </p>
              <p>
                Access closes at: <strong>{scheduledEnd?.toLocaleString()}</strong>
              </p>
              <p>
                Time remaining: <strong>{countdown}</strong>
              </p>

              <div style={{ marginTop: 14 }}>
                <button onClick={handleStart} style={styles.btn}>
                  Proceed to Interview ...
                </button>
              </div>
            </>
          )}

          {status === "expired" && (
            <div style={{ color: "#c0392b", marginTop: 12 }}>
              The 30-minute window to begin your interview has expired. Please contact your HR
              representative for rescheduling.
            </div>
          )}

          {status === "invalid" && (
            <div style={{ color: "#c0392b", marginTop: 12 }}>
               This email is not registered for this interview session.
            </div>
          )}

          {status === "error" && (
            <div style={{ color: "#c0392b", marginTop: 12 }}>
              ⚠ A server error occurred. Please try again later.
            </div>
          )}
           <footer className="footer" style={styles.footer}>
        <p className="footer-text" style={styles.footerText}>
          &copy; 2025 <span className="footer-highlight">Interview.ai</span>. All rights reserved.
        </p>
      </footer>
        </div>
      </div>
    </div>
  );
}
