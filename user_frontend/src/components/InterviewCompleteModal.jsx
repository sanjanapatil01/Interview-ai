import React from 'react';

const InterviewCompleteModal = ({ onClose }) => {
  return (
    <>
      <style>
        {`
          .modal-overlay {
            position: fixed;
            top: 0; left: 0;
            width: 100%; height: 100%;
            background: rgba(0, 0, 0, 0.6);
            display: flex; justify-content: center; align-items: center;
            z-index: 1000;
            background: #ffffff;
          }

          .modal-box {
            background: #ffffff;
            padding: 2rem;
            border-radius: 12px;
            text-align: center;
            max-width: 480px;
            box-shadow: 0 8px 20px rgba(0,0,0,0.2);
            font-family: 'Segoe UI', sans-serif;
          }

          .modal-title {
            font-size: 1.8rem;
            color: #2c3e50;
            margin-bottom: 1rem;
          }

          .modal-message {
            font-size: 1.2rem;
            color: #34495e;
            margin-bottom: 0.5rem;
          }

          .modal-subtext {
            font-size: 1rem;
            color: #7f8c8d;
            margin-bottom: 1.5rem;
          }

          .modal-button {
            background-color: #007bff;
            color: white;
            border: none;
            padding: 0.6rem 1.2rem;
            border-radius: 6px;
            font-size: 1rem;
            cursor: pointer;
            transition: background 0.3s ease;
          }

          .modal-button:hover {
            background-color: #0056b3;
          }
        `}
      </style>

      <div className="modal-overlay">
        <div className="modal-box">
          <h2 className="modal-title">🎉 Interview Complete!</h2>
          <p className="modal-message">Thank you for your time, and well done!</p>
          <p className="modal-subtext">
            Your responses have been submitted successfully.<br />
            📩 If selected, you'll receive an email with next steps.
          </p>
          
        </div>
      </div>
    </>
  );
};

export default InterviewCompleteModal;