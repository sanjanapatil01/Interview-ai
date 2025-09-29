import React, { useState, useMemo } from "react";
import "./Home.css";

const CandidateOverview = ({ candidates, onSelect, handleSelect, handleReject }) => {
  const [searchQuery, setSearchQuery] = useState("");

  // Filter candidates based on searchQuery
  const filteredCandidates = useMemo(() => {
    if (!searchQuery) return candidates;
    return candidates.filter((c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [candidates, searchQuery]);

  return (
    <div className="overview-container">
      <h1 className="overview-title">Candidate Overview</h1>

      {/* Search Bar */}
      <div className="search-container">
        <input
          type="text"
          placeholder="Search candidates..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="search-input"
        />
       
      </div>

      {/* Candidate Table */}
      <div className="table-container">
        <table className="candidates-table">
          <thead className="table-head">
            <tr>
              <th className="table-header">Candidate Name</th>
              <th className="table-header">Date</th>
              <th className="table-header">Status</th>
              <th className="table-header">Score</th>
              <th className="table-header">Actions</th>
              <th className="table-header">Report</th>
            </tr>
          </thead>
          <tbody className="table-body">
            {filteredCandidates.length > 0 ? (
              filteredCandidates.map((c) => (
                <tr key={c.id}>
                  <td onClick={() => onSelect(c)} className="candidate-name-cell">{c.name}</td>
                  <td className="table-cell">{c.date}</td>
                  <td className="table-cell">
                    <span className={`status-badge status-${c.status.toLowerCase()}`}>
                      {c.status}
                    </span>
                  </td>
                  <td className="table-cell">{c.score}</td>
                  <td className="actions-cell">
                    <button onClick={() => handleSelect(c.id)} className="select-action-btn">Select</button>
                    <button onClick={() => handleReject(c.id)} className="reject-action-btn">Reject</button>
                  </td>
                  <td className="report-cell">
                    <a href={c.pdfLink} className="view-report-link">View Report</a>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" className="no-candidates-cell">
                  No candidates found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CandidateOverview;