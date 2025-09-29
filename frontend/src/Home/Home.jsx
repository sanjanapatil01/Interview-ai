import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import GenerateLink from "./GenerateLink.jsx";
import CandidateOverview from "./CandidateOverview.jsx";
import CandidateDetail from "./CandidateDetail.jsx";
import EditProfile from "./EditProfile.jsx";
import homeimg from "../assets/image/home.jpg"


const Home = () => {
  const [activePage, setActivePage] = useState("home");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  const [interviewDate, setInterviewDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");

  const [candidates, setCandidates] = useState([
    { id: 1, name: "Alice Johnson", date: "2025-09-01", status: "Completed", score: 85, transcript: "Alice interview...", pdfLink: "#" },
    { id: 2, name: "Bob Smith", date: "2025-09-02", status: "Pending", score: "N/A", transcript: "Interview not yet conducted.", pdfLink: "#" },
    { id: 3, name: "Charlie Brown", date: "2025-08-30", status: "Selected", score: 92, transcript: "Charlie interview...", pdfLink: "#" },
    { id: 4, name: "Diana Miller", date: "2025-09-01", status: "Completed", score: 78, transcript: "Diana interview...", pdfLink: "#" },
  ]);

  const navigate = useNavigate();
  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  useEffect(() => {
    // Dummy fetch example (if needed)
  }, []);

  const handleSelect = (id) => {
    setCandidates(
      candidates.map((c) => (c.id === id ? { ...c, status: "Selected" } : c))
    );
  };

  const handleReject = (id) => {
    setCandidates(
      candidates.map((c) => (c.id === id ? { ...c, status: "Rejected" } : c))
    );
  };

  const filteredCandidates = candidates.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.status.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const PageContent = () => {
    switch (activePage) {
      case "home":
        return (
          <div className="home-content">
            <section className="hero-section">
              <div className="hero-text-content">
                <h1 className="hero-title">Revolutionize Your Hiring with AI</h1>
                <p className="hero-subtitle">
                  "Experience the future of hiring with intelligent interview automation, real-time candidate analysis, and comprehensive reporting"
                </p>
                <div className="cta-buttons">
                  <button className="cta-primary" onClick={() => setActivePage("generate-link")}>
                    Get Started Now
                  </button>
                  <button className="cta-secondary" onClick={() => setActivePage("candidate-overview")}>
                    Explore Dashboard
                  </button>
                </div>
              </div>
              <div className="hero-image-container">
                {/* Changed to a cartoon-like image URL */}
                <img src={homeimg} alt="AI Interview Platform Cartoon" className="hero-image"/>
              </div>
            </section>

            {/* Services Section */}
            <section className="services-section">
              <h2 className="section-heading">Our Powerful Features</h2>
              <p className="section-subheading">
                Transform your hiring process with cutting-edge AI technology designed for efficiency and accuracy.
              </p>
              <div className="features-grid">
                <div className="feature-card">
                  <div className="feature-icon">🔗</div>
                  <h3 className="feature-title">Generate Interview Links</h3>
                  <p className="feature-description">
                    Create unique, time-bound interview links with custom scheduling. Perfect for managing multiple interview sessions efficiently.
                  </p>
                </div>
                <div className="feature-card">
                  <div className="feature-icon">👥</div>
                  <h3 className="feature-title">Candidate Management</h3>
                  <p className="feature-description">
                    Track all your candidates in one centralized dashboard. View progress, scores, and make hiring decisions with ease.
                  </p>
                </div>
                <div className="feature-card">
                  <div className="feature-icon">📊</div>
                  <h3 className="feature-title">AI-Powered Analytics</h3>
                  <p className="feature-description">
                    Get detailed insights and scoring powered by advanced AI. Make data-driven hiring decisions with comprehensive reports.
                  </p>
                </div>
                <div className="feature-card">
                  <div className="feature-icon">📝</div>
                  <h3 className="feature-title">Interview Transcripts</h3>
                  <p className="feature-description">
                    Access complete interview transcripts with AI-generated summaries. Never miss important details from candidate conversations.
                  </p>
                </div>
                <div className="feature-card">
                  <div className="feature-icon">⚡</div>
                  <h3 className="feature-title">Real-time Processing</h3>
                  <p className="feature-description">
                    Experience lightning-fast interview processing and instant results. Get immediate feedback and scoring after each interview.
                  </p>
                </div>
                <div className="feature-card">
                  <div className="feature-icon">🔒</div>
                  <h3 className="feature-title">Secure & Private</h3>
                  <p className="feature-description">
                    Enterprise-grade security ensures all interview data is protected. GDPR compliant with end-to-end encryption.
                  </p>
                </div>
              </div>
            </section>

            {/* Stats Section */}
            <section className="stats-section">
              <h2 className="section-heading">Dashboard at a Glance</h2>
              <p className="section-subheading">
                See the impact of your hiring efforts with real-time statistics.
              </p>
              <div className="stats-grid">
                <div className="stat-card">
                  <span className="stat-number">{candidates.length}</span>
                  <span className="stat-label">Total Candidates</span>
                </div>
                <div className="stat-card">
                  <span className="stat-number">{candidates.filter(c => c.status === "Completed").length}</span>
                  <span className="stat-label">Interviews Completed</span>
                </div>
                <div className="stat-card">
                  <span className="stat-number">{candidates.filter(c => c.status === "Selected").length}</span>
                  <span className="stat-label">Candidates Selected</span>
                </div>
                <div className="stat-card">
                  <span className="stat-number">{candidates.filter(c => c.status === "Pending").length}</span>
                  <span className="stat-label">Pending Interviews</span>
                </div>
              </div>
            </section>

            {/* Testimonials Section */}
            <section className="testimonials-section">
              <h2 className="section-heading">What Our Users Say</h2>
              <div className="testimonials-grid">
                <div className="testimonial-card">
                  <p className="testimonial-text">"Interview.ai has transformed our recruitment process. The insights are incredibly accurate and save our team countless hours."</p>
                  <p className="testimonial-author">- Jane Doe, HR Manager at TechCorp</p>
                </div>
                <div className="testimonial-card">
                  <p className="testimonial-text">"The dashboard is intuitive and powerful. We've reduced our time-to-hire by 40% since implementing this platform."</p>
                  <p className="testimonial-author">- John Smith, CEO of Innovate Solutions</p>
                </div>
                <div className="testimonial-card">
                  <p className="testimonial-text">"I was amazed by the detailed candidate reports. It provides a level of detail we could never achieve with traditional interviews."</p>
                  <p className="testimonial-author">- Emily Chen, Senior Recruiter</p>
                </div>
              </div>
            </section>
          </div>
        );
      case "generate-link":
        return (
          <GenerateLink
            interviewDate={interviewDate}
            setInterviewDate={setInterviewDate}
            startTime={startTime}
            setStartTime={setStartTime}
            endTime={endTime}
            setEndTime={setEndTime}
          />
        );
      case "candidate-overview":
        return (
          <CandidateOverview
            candidates={filteredCandidates}
            onSelect={setSelectedCandidate}
            handleSelect={handleSelect}
            handleReject={handleReject}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
          />
        );
      case "candidate-detail":
        return (
          <CandidateDetail
            candidate={selectedCandidate}
            handleSelect={handleSelect}
            handleReject={handleReject}
            goBack={() => setActivePage("candidate-overview")}
          />
        );
      case "edit-profile":
        return <EditProfile />;
      default:
        return null;
    }
  };

  return (
    <div className="flex-container">
      {/* Navbar */}
      <nav className="navbar">
        <div className="navbar-left">
          <button onClick={toggleSidebar} className="menu-button">
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M4 6H20M4 12H20M4 18H20"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
          <span className="site-title">Interview.ai</span>
        </div>
        <div className="navbar-right">
          <span className="user-greeting">Hello, vtuLogin</span>
          <button
            onClick={() => setActivePage("generate-link")}
            className="generate-link-button"
          >
            Generate Link
          </button>
        </div>
      </nav>

      {/* Sidebar */}
      <div className={`sidebar ${isSidebarOpen ? "open" : ""}`}>
        <div className="sidebar-content">
          <button onClick={toggleSidebar} className="close-sidebar-button">
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M6 18L18 6M6 6L18 18"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
          <button
            onClick={() => {
              setActivePage("home");
              toggleSidebar();
            }}
            className={`sidebar-link ${activePage === "home" && "active-link"}`}
          >
            Home
          </button>
          <button
            onClick={() => {
              setActivePage("generate-link");
              toggleSidebar();
            }}
            className={`sidebar-link ${activePage === "generate-link" && "active-link"}`}
          >
            Generate Link
          </button>
          <button
            onClick={() => {
              setActivePage("candidate-overview");
              toggleSidebar();
            }}
            className={`sidebar-link ${activePage === "candidate-overview" && "active-link"}`}
          >
            Candidate Overview
          </button>
          <button
            onClick={() => {
              setActivePage("edit-profile");
              toggleSidebar();
            }}
            className={`sidebar-link ${activePage === "edit-profile" && "active-link"}`}
          >
            Edit Profile
          </button>
          <button
            onClick={() => {
              navigate("/");
              toggleSidebar();
            }}
            className="sidebar-link logout-link"
          >
            Logout
          </button>
        </div>
      </div>

      {/* Main Content */}
      <main className="main-content">
        <div className="content-container">
          <PageContent />
        </div>
      </main>

      {/* Footer */}
      <footer className="footer">
        <p className="footer-text">
          © {new Date().getFullYear()} <span className="footer-highlight">Interview.ai</span>. All rights reserved.
        </p>
        <p className="footer-subtext">
          Built to simplify AI-driven interviews • Improve hiring decisions • Save time & effort
        </p>
      </footer>
    </div>
  );
};

export default Home;