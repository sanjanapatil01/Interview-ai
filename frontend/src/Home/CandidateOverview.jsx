import React, { useState, useMemo, useEffect } from "react";
import * as XLSX from "xlsx";
import "./Home.css";

const CandidateOverview = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [candidates, setCandidates] = useState([]);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedCandidates, setSelectedCandidates] = useState([]);

  // Derived display values for selected candidate
  const decidedByDisplay = (() => {
    const db = selectedCandidate?.decided_by;
    if (!db) return 'N/A';
    if (typeof db === 'string') return db;
    if (db.name) return db.name;
    if (db.email) return db.email;
    if (db._id) return String(db._id);
    try { return JSON.stringify(db); } catch (e) { return String(db); }
  })();

  const decisionStatus = selectedCandidate?.decision_status || selectedCandidate?.final_recommendation?.decision || null;
  const isDecisionPending = !decisionStatus || decisionStatus === 'pending';

  // Filter candidates based on searchQuery and statusFilter
  const filteredCandidates = useMemo(() => {
    let filtered = candidates;
    if (statusFilter !== 'all') {
      filtered = filtered.filter((c) => {
        if (statusFilter === 'pending') {
          return !c.decision_status || c.decision_status === 'pending';
        }
        return c.decision_status === statusFilter;
      });
    }
    if (searchQuery) {
      filtered = filtered.filter((c) =>
        (c.candidate_overview?.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (c.candidate_overview?.email || "").toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    return filtered;
  }, [candidates, searchQuery, statusFilter]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const userId = localStorage.getItem('userId');
        if (!userId) {
          setError('No user ID found. Please log in again.');
          setLoading(false);
          return;
        }

        console.log('Fetching candidates for userId:', userId);

        const response = await fetch(`${process.env.REACT_APP_API_BASE_URL}/candidates/${userId}`);
        
        console.log('Response status:', response.status);

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        console.log('Candidates fetched (raw):', data);
        
        const candidatesArray = Array.isArray(data) ? data : (data?.candidates || []);
        console.log('Setting candidates state:', candidatesArray);
        console.log('Candidates count:', candidatesArray.length);
        
        setCandidates(candidatesArray);
      } catch (error) {
        console.error('Error fetching candidates:', error);
        setError(error.message || 'Failed to fetch candidates');
        setCandidates([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Handle Select/Reject Action
  const handleCandidateAction = async (action) => {
    if (!selectedCandidate) return;

    if (!companyName.trim()) {
      setActionMessage('⚠️ Please enter company name');
      return;
    }

    try {
      setActionLoading(true);
      setActionMessage('');

      const payload = {
        candidateId: selectedCandidate._id,
        candidateEmail: selectedCandidate.candidate_overview?.email,
        candidateName: selectedCandidate.candidate_overview?.name,
        action: action, // 'selected' or 'rejected'
        companyName: companyName,
        interviewerId: localStorage.getItem('userId')
      };

      const response = await fetch(`${process.env.REACT_APP_API_BASE_URL}/candidate-action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: Failed to process action`);
      }

      const result = await response.json();
      setActionMessage(`✅ ${result.message || `Candidate ${action} successfully`}`);
      setCompanyName('');

      // Use updated report from server when available, otherwise do an optimistic update
      const updatedReport = result.updatedReport || result.report || result.data || null;

      let updatedCandidate;
      if (updatedReport) {
        updatedCandidate = { ...selectedCandidate, ...updatedReport };
      } else {
        const decidedByName = localStorage.getItem('userName') || null;
        updatedCandidate = {
          ...selectedCandidate,
          decision_status: action === 'selected' ? 'selected' : 'rejected',
          company_name: companyName,
          decision_date: new Date().toISOString(),
          decided_by: decidedByName ? { _id: localStorage.getItem('userId'), name: decidedByName } : localStorage.getItem('userId')
        };
      }

      setSelectedCandidate(updatedCandidate);
      setCandidates(prev => prev.map(c => c._id === updatedCandidate._id ? updatedCandidate : c));
    } catch (error) {
      console.error('Error processing action:', error);
      setActionMessage(`❌ Error: ${error.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  // Handle individual candidate selection
  const handleCandidateSelection = (candidateId) => {
    setSelectedCandidates(prev => 
      prev.includes(candidateId) 
        ? prev.filter(id => id !== candidateId)
        : [...prev, candidateId]
    );
  };

  // Handle select all candidates
  const handleSelectAll = () => {
    if (selectedCandidates.length === filteredCandidates.length) {
      setSelectedCandidates([]);
    } else {
      setSelectedCandidates(filteredCandidates.map(c => c._id));
    }
  };

  // Export selected candidates to XLS
  const exportToXLS = () => {
    if (selectedCandidates.length === 0) {
      alert("Please select at least one candidate to export.");
      return;
    }

    const selectedData = candidates.filter(c => selectedCandidates.includes(c._id));
    
    const exportData = selectedData.map(candidate => ({
      "Name": candidate.candidate_overview?.name || "N/A",
      "Email": candidate.candidate_overview?.email || "N/A",
      "Preferred Domain": candidate.candidate_overview?.preferredDomain || "N/A",
      "Year of Study": candidate.candidate_overview?.yearOfStudy || "N/A",
      "Overall Score": candidate.overall_performance?.score || "N/A",
      "Decision": candidate.decision_status || candidate.final_recommendation?.decision || "pending",
      "Company": candidate.company_name || "N/A"
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Candidates");
    XLSX.writeFile(wb, `candidates_export_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  return (
    <div className="overview-container" style={{ padding: '20px' }}>
      <h1 className="overview-title">Candidate Overview</h1>

      {/* Status Filter Buttons */}
      <div style={{ marginBottom: '20px', display: 'flex', gap: '10px', justifyContent: 'center' }}>
        <button
          onClick={() => setStatusFilter('all')}
          style={{
            padding: '10px 20px',
            backgroundColor: statusFilter === 'all' ? '#007bff' : '#f8f9fa',
            color: statusFilter === 'all' ? 'white' : '#333',
            border: '1px solid #ddd',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: 'bold'
          }}
        >
          All
        </button>
        <button
          onClick={() => setStatusFilter('selected')}
          style={{
            padding: '10px 20px',
            backgroundColor: statusFilter === 'selected' ? '#28a745' : '#f8f9fa',
            color: statusFilter === 'selected' ? 'white' : '#333',
            border: '1px solid #ddd',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: 'bold'
          }}
        >
          Selected
        </button>
        <button
          onClick={() => setStatusFilter('rejected')}
          style={{
            padding: '10px 20px',
            backgroundColor: statusFilter === 'rejected' ? '#dc3545' : '#f8f9fa',
            color: statusFilter === 'rejected' ? 'white' : '#333',
            border: '1px solid #ddd',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: 'bold'
          }}
        >
          Rejected
        </button>
        <button
          onClick={() => setStatusFilter('pending')}
          style={{
            padding: '10px 20px',
            backgroundColor: statusFilter === 'pending' ? '#ffc107' : '#f8f9fa',
            color: statusFilter === 'pending' ? 'white' : '#333',
            border: '1px solid #ddd',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: 'bold'
          }}
        >
          Pending
        </button>
      </div>

      {/* Search Bar */}
      <div style={{ marginBottom: '20px' }}>
        <input
          type="text"
          placeholder="Search candidates by name or email..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{ 
            padding: '10px 12px', 
            width: '100%', 
            maxWidth: '400px', 
            borderRadius: '4px', 
            border: '1px solid #ccc',
            fontSize: '14px'
          }}
        />
      </div>

      {/* Error Message */}
      {error && (
        <div style={{ 
          padding: '12px', 
          marginBottom: '20px', 
          backgroundColor: '#ffebee', 
          border: '1px solid #f44336', 
          borderRadius: '4px',
          color: '#c62828'
        }}>
          Error: {error}
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div style={{ 
          textAlign: 'center', 
          padding: '40px',
          color: '#0f0d0dff'
        }}>
          <p>Loading candidates...</p>
        </div>
      )}

      {/* Candidates List */}
      {!loading && (
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 1fr) minmax(300px, 1fr)', gap: '20px', minHeight: '500px' }}>
          {/* Left: Candidates List */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <h3>Candidates ({filteredCandidates.length})</h3>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '14px' ,color: '#333',borderColor: 'none'}}>
                  <input
                    type="checkbox"
                    checked={selectedCandidates.length === filteredCandidates.length && filteredCandidates.length > 0}
                    onChange={handleSelectAll}
                  />
                  Select All
                </label>
                <button
                  onClick={exportToXLS}
                  disabled={selectedCandidates.length === 0}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: selectedCandidates.length === 0 ? '#ccc' : '#007bff',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: selectedCandidates.length === 0 ? 'not-allowed' : 'pointer',
                    fontSize: '14px',
                    fontWeight: 'bold'
                  }}
                >
                 Download XLS ({selectedCandidates.length})
                </button>
              </div>
            </div>
            <div style={{ 
              maxHeight: '600px', 
              overflowY: 'auto', 
              border: '1px solid #ddd', 
              borderRadius: '4px',
              backgroundColor: '#fafafa'
            }}>
              {filteredCandidates.length > 0 ? (
                filteredCandidates.map((candidate) => (
                  <div
                    key={candidate._id}
                    style={{
                      padding: '12px',
                      borderBottom: '1px solid #eee',
                      backgroundColor: selectedCandidate?._id === candidate._id ? '#e3f2fd' : 'transparent',
                      transition: 'background-color 0.2s',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <input
                        type="checkbox"
                        checked={selectedCandidates.includes(candidate._id)}
                        onChange={() => handleCandidateSelection(candidate._id)}
                        style={{ margin: 0 }}
                      />
                      <div 
                        onClick={() => setSelectedCandidate(candidate)}
                        style={{ 
                          cursor: 'pointer',
                          flex: 1
                        }}
                      >
                        <p style={{ margin: '0', fontWeight: 'bold', color: '#333' }}>
                          {candidate.candidate_overview?.name || 'N/A'}
                        </p>
                        <p style={{ margin: '4px 0 0 0', fontSize: '0.9em', color: '#130a0aff' }}>
                          {candidate.candidate_overview?.email || 'N/A'}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p style={{ padding: '12px', color: '#0d0b0bff', textAlign: 'center' }}>
                  {candidates.length === 0 ? 'No candidates found' : 'No matches'}
                </p>
              )}
            </div>
          </div>

          {/* Right: Candidate Details */}
          <div>
            {selectedCandidate ? (
              <div style={{ 
                border: '1px solid #ddd', 
                borderRadius: '4px', 
                padding: '20px', 
                maxHeight: '600px', 
                overflowY: 'auto',
                backgroundColor: '#fff',
                color: 'black'
              }}>
                <h3 style={{ marginTop: 0 }}>{selectedCandidate.candidate_overview?.name || 'N/A'}</h3>
                <p><strong>Email:</strong> {selectedCandidate.candidate_overview?.email || 'N/A'}</p>
                <p><strong>Preferred Domain:</strong> {selectedCandidate.candidate_overview?.preferredDomain || 'N/A'}</p>
                <p><strong>Year of Study:</strong> {selectedCandidate.candidate_overview?.yearOfStudy || 'N/A'}</p>

                {/* Candidate Overview Summary */}
                {selectedCandidate.candidate_overview?.summary && (
                  <div style={{ marginTop: '16px', padding: '12px', backgroundColor: '#f5f5f5', borderRadius: '4px' }}>
                    <h4 style={{ marginTop: 0 }}>Candidate Summary</h4>
                    <p>{selectedCandidate.candidate_overview.summary}</p>
                  </div>
                )}

                {/* Overall Performance */}
                {selectedCandidate.overall_performance && (
                  <div style={{ marginTop: '16px', padding: '12px', backgroundColor: '#f5f5f5', borderRadius: '4px' }}>
                    <h4 style={{ marginTop: 0 }}>Overall Performance</h4>
                    <p><strong>Score:</strong> {selectedCandidate.overall_performance.score || 'N/A'}/10</p>
                    <p><strong>Level:</strong> {selectedCandidate.overall_performance.performance_level || 'N/A'}</p>
                    {selectedCandidate.overall_performance.summary && (
                      <p><strong>Summary:</strong> {selectedCandidate.overall_performance.summary}</p>
                    )}
                  </div>
                )}

                {/* Section Wise Evaluation */}
                {selectedCandidate.section_wise_evaluation && (
                  <div style={{ marginTop: '16px', padding: '12px', backgroundColor: '#f5f5f5', borderRadius: '4px' }}>
                    <h4 style={{ marginTop: 0 }}>Section Wise Evaluation</h4>
                    
                    {selectedCandidate.section_wise_evaluation.general && (
                      <div style={{ marginBottom: '12px', paddingBottom: '12px', borderBottom: '1px solid #ddd' }}>
                        <p><strong>General:</strong> {selectedCandidate.section_wise_evaluation.general.score || 'N/A'}/10</p>
                        {selectedCandidate.section_wise_evaluation.general.feedback && (
                          <p style={{ fontSize: '0.9em', color: '#070606ff', marginTop: '4px' }}>
                            <em>{selectedCandidate.section_wise_evaluation.general.feedback}</em>
                          </p>
                        )}
                      </div>
                    )}

                    {selectedCandidate.section_wise_evaluation.technical && (
                      <div style={{ marginBottom: '12px', paddingBottom: '12px', borderBottom: '1px solid #ddd' }}>
                        <p><strong>Technical:</strong> {selectedCandidate.section_wise_evaluation.technical.score || 'N/A'}/10</p>
                        {selectedCandidate.section_wise_evaluation.technical.feedback && (
                          <p style={{ fontSize: '0.9em', color: '#160f0fff', marginTop: '4px' }}>
                            <em>{selectedCandidate.section_wise_evaluation.technical.feedback}</em>
                          </p>
                        )}
                      </div>
                    )}

                    {selectedCandidate.section_wise_evaluation.hr && (
                      <div style={{ marginBottom: '12px' }}>
                        <p><strong>HR:</strong> {selectedCandidate.section_wise_evaluation.hr.score || 'N/A'}/10</p>
                        {selectedCandidate.section_wise_evaluation.hr.feedback && (
                          <p style={{ fontSize: '0.9em', color: '#0e0a0aff', marginTop: '4px' }}>
                            <em>{selectedCandidate.section_wise_evaluation.hr.feedback}</em>
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Strengths & Weaknesses */}
                <div style={{ marginTop: '16px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  {selectedCandidate.strengths && selectedCandidate.strengths.length > 0 && (
                    <div style={{ padding: '12px', backgroundColor: '#e8f5e9', borderRadius: '4px' }}>
                      <h5 style={{ marginTop: 0, color: '#2e7d32' }}>Strengths</h5>
                      <ul style={{ margin: '8px 0', paddingLeft: '20px', fontSize: '0.9em' }}>
                        {selectedCandidate.strengths.map((s, i) => (
                          <li key={i}>{s}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {selectedCandidate.weaknesses && selectedCandidate.weaknesses.length > 0 && (
                    <div style={{ padding: '12px', backgroundColor: '#ffebee', borderRadius: '4px' }}>
                      <h5 style={{ marginTop: 0, color: '#c62828' }}>Weaknesses</h5>
                      <ul style={{ margin: '8px 0', paddingLeft: '20px', fontSize: '0.9em' }}>
                        {selectedCandidate.weaknesses.map((w, i) => (
                          <li key={i}>{w}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                {/* Final Recommendation */}
                {selectedCandidate.final_recommendation && (
                  <div style={{ marginTop: '16px', padding: '12px', backgroundColor: '#fff3e0', borderRadius: '4px', border: '1px solid #ffb74d' }}>
                    <h4 style={{ marginTop: 0 }}>Final Recommendation</h4>
                    <p><strong>Decision:</strong> <span style={{ color: '#e65100', fontWeight: 'bold' }}>{selectedCandidate.final_recommendation.decision || 'N/A'}</span></p>
                    {selectedCandidate.final_recommendation.justification && (
                      <p><strong>Justification:</strong> {selectedCandidate.final_recommendation.justification}</p>
                    )}
                  </div>
                )}

                {/* Company Name Input & Action Buttons OR Decision Details */}
                {isDecisionPending ? (
                  <div style={{ marginTop: '20px', padding: '16px', backgroundColor: '#f0f0f0', borderRadius: '4px' }}>
                    <p style={{ marginTop: 0 }}>
                      <strong>Company Name:</strong>
                    </p>
                    <input
                      type="text"
                      placeholder="Enter company name..."
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '10px',
                        marginBottom: '12px',
                        borderRadius: '4px',
                        border: '1px solid #ccc',
                        fontSize: '14px',
                        boxSizing: 'border-box'
                      }}
                    />


                    {/* Select/Reject Buttons */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                      <button
                        onClick={() => handleCandidateAction('selected')}
                        disabled={actionLoading}
                        style={{
                          padding: '10px',
                          backgroundColor: '#4CAF50',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: actionLoading ? 'not-allowed' : 'pointer',
                          fontSize: '14px',
                          fontWeight: 'bold',
                          opacity: actionLoading ? 0.6 : 1,
                          transition: 'opacity 0.2s'
                        }}
                      >
                        {actionLoading ? 'Processing...' : '✅ Select'}
                      </button>
                      <button
                        onClick={() => handleCandidateAction('rejected')}
                        disabled={actionLoading}
                        style={{
                          padding: '10px',
                          backgroundColor: '#f44336',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: actionLoading ? 'not-allowed' : 'pointer',
                          fontSize: '14px',
                          fontWeight: 'bold',
                          opacity: actionLoading ? 0.6 : 1,
                          transition: 'opacity 0.2s'
                        }}
                      >
                        {actionLoading ? 'Processing...' : '❌ Reject'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div style={{ marginTop: '20px', padding: '16px', backgroundColor: '#fff8e1', borderRadius: '4px', border: '1px solid #ffecb3' }}>
                    <h4 style={{ marginTop: 0 }}>Decision Details</h4>
                    <p><strong>Status:</strong> {decisionStatus || 'N/A'}</p>
                    <p><strong>Company:</strong> {selectedCandidate.company_name || 'N/A'}</p>
                    <p><strong>Date:</strong> {selectedCandidate.decision_date ? new Date(selectedCandidate.decision_date).toLocaleString() : 'N/A'}</p>
                    <p><strong>Decided By:</strong> {decidedByDisplay}</p>
                  </div>
                )}
              </div>
            ) : (
              <div style={{ 
                padding: '40px', 
                color: '#999', 
                textAlign: 'center',
                border: '1px solid #ddd',
                borderRadius: '4px',
                backgroundColor: '#fafafa'
              }}>
                <p>Select a candidate to view details</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CandidateOverview;