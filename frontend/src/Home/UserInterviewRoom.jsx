import React, { useState, useEffect, useRef } from 'react';
import { Camera, CameraOff, Mic, MicOff, Monitor, MonitorOff, Play, Square, Clock } from 'lucide-react';
import './userRoom.css';

// Global variables for the canvas environment.
const appId = "interview-ai-app";
const initialAuthToken = null;

// The main application component for the AI interview room.
const UserInterviewRoom = () => {
  // State management for interview-related variables.
  const [isInterviewStarted, setIsInterviewStarted] = useState(false);
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [isMicOn, setIsMicOn] = useState(false);
  const [isScreenShared, setIsScreenShared] = useState(false);
  const [timer, setTimer] = useState(0);
  const [userStream, setUserStream] = useState(null);
  const [screenStream, setScreenStream] = useState(null);
  const [statusMessage, setStatusMessage] = useState("Click 'Start Interview' to begin.");
  const [aiCaptions, setAiCaptions] = useState('');
  const [userCaptions, setUserCaptions] = useState('');
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [userId, setUserId] = useState(null);

  // State for AI-related functionality
  const [aiIsSpeaking, setAiIsSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const audioContextRef = useRef(null);
  const audioSourceRef = useRef(null);
  const recognitionRef = useRef(null);

  const userVideoRef = useRef(null);
  const screenVideoRef = useRef(null);

  // Effect hook for initialization.
  useEffect(() => {
    setUserId('demo-user');
    setIsAuthReady(true);
  }, []);

  // Timer effect
  useEffect(() => {
    let interval;
    if (isInterviewStarted) {
      interval = setInterval(() => {
        setTimer((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isInterviewStarted]);

  // Initialize speech recognition
  useEffect(() => {
    if (typeof window !== 'undefined' && (window.SpeechRecognition || window.webkitSpeechRecognition)) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = (event) => {
        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          }
        }
        if (finalTranscript) {
          setUserCaptions(finalTranscript);
          handleUserSpeech(finalTranscript);
        }
      };

      recognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
      };
    }
  }, []);

  // Video stream effects
  useEffect(() => {
    if (userStream && userVideoRef.current) {
      userVideoRef.current.srcObject = userStream;
    }
  }, [userStream]);

  useEffect(() => {
    if (screenStream && screenVideoRef.current) {
      screenVideoRef.current.srcObject = screenStream;
    }
  }, [screenStream]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleUserSpeech = async (transcript) => {
    if (!transcript.trim() || aiIsSpeaking) return;
    
    // Mock AI response for demo
    setTimeout(() => {
      const responses = [
        "That's an interesting point. Can you elaborate on that?",
        "Thank you for sharing. What challenges did you face in that situation?",
        "I see. How did you handle that particular scenario?",
        "Great example. What would you do differently next time?"
      ];
      const randomResponse = responses[Math.floor(Math.random() * responses.length)];
      setAiCaptions(randomResponse);
      
      setTimeout(() => {
        setAiCaptions('');
      }, 4000);
    }, 1000);
  };

  const startInterview = async () => {
    if (!userStream) {
      setStatusMessage("Please enable your camera and microphone first.");
      return;
    }

    setIsInterviewStarted(true);
    setStatusMessage("Interview started! Answer the questions ..All the Best");
    setTimer(0);

    if (recognitionRef.current) {
      recognitionRef.current.start();
      setIsListening(true);
    }

    // Start with a welcome message
    setTimeout(() => {
      setAiCaptions("Welcome to your AI interview!");
    }, 2000);
  };

  const stopInterview = () => {
    setIsInterviewStarted(false);
    setStatusMessage("Interview ended. Thank you for your time!");
    setAiCaptions('');
    setUserCaptions('');

    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  };

  const toggleCamera = async () => {
    if (!userStream) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        setUserStream(stream);
        setIsCameraOn(true);
        setIsMicOn(true);
        setStatusMessage("Camera and Microphone are now ON. Click 'Start Interview' to begin.");
      } catch (err) {
        console.error("Error accessing camera:", err);
        setStatusMessage("Could not access camera. Please ensure permissions are granted.");
      }
      return;
    }

    const videoTrack = userStream.getVideoTracks()[0];
    if (videoTrack) {
      videoTrack.enabled = !isCameraOn;
      setIsCameraOn(!isCameraOn);
      setStatusMessage(`Camera is now ${!isCameraOn ? 'ON' : 'OFF'}.`);
    }
  };

  const toggleMicrophone = async () => {
    if (!userStream) {
      await toggleCamera();
      return;
    }

    const audioTrack = userStream.getAudioTracks()[0];
    if (audioTrack) {
      audioTrack.enabled = !isMicOn;
      setIsMicOn(!isMicOn);
      setStatusMessage(`Microphone is now ${!isMicOn ? 'ON' : 'OFF'}.`);
    }
  };

  const toggleScreenShare = async () => {
    if (!isScreenShared) {
      try {
        const stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
        setScreenStream(stream);
        setIsScreenShared(true);
        setStatusMessage("Screen sharing started.");
        
        stream.getVideoTracks()[0].onended = () => {
          setIsScreenShared(false);
          setScreenStream(null);
          setStatusMessage("Screen sharing stopped.");
        };
      } catch (err) {
        console.error("Error accessing screen:", err);
        setStatusMessage("Could not start screen sharing.");
      }
    } else {
      if (screenStream) {
        screenStream.getTracks().forEach(track => track.stop());
        setScreenStream(null);
      }
      setIsScreenShared(false);
      setStatusMessage("Screen sharing stopped.");
    }
  };

  return (
    <div className="interview-container">
      <div className="interview-wrapper">
        {/* Header */}
        <div className="interview-header">
          <div className="interview-title-section">
            <h1 className="interview-title">Interview.ai</h1>
            <p className="interview-subtitle">AI-Powered Interview Platform</p>
          </div>
          <div className="interview-badges">
            <div className="interview-badge">
              <Clock />
              {formatTime(timer)}
            </div>
            <div className={`interview-badge ${isInterviewStarted ? 'active' : ''}`}>
              {isInterviewStarted ? "Interview Active" : "Ready to Start"}
            </div>
          </div>
        </div>

        {/* Control Panel */}
        <div className="interview-card">
          <div className="interview-card-header">
            <h2 className="interview-card-title">Interview Controls</h2>
          </div>
          <div className="interview-card-content">
            <div className="controls-wrapper">
              <button
                onClick={toggleCamera}
                className={`interview-button ${isCameraOn ? 'active' : 'secondary'}`}
              >
                {isCameraOn ? <Camera /> : <CameraOff />}
                Camera
              </button>
              
              <button
                onClick={toggleMicrophone}
                className={`interview-button ${isMicOn ? 'active' : 'secondary'}`}
              >
                {isMicOn ? <Mic /> : <MicOff />}
                Microphone
              </button>
              
              <button
                onClick={toggleScreenShare}
                className={`interview-button ${isScreenShared ? 'active' : 'secondary'}`}
              >
                {isScreenShared ? <Monitor /> : <MonitorOff />}
                Screen Share
              </button>
              
              <div className="controls-separator"></div>
              
              {!isInterviewStarted ? (
                <button
                  onClick={startInterview}
                  className="interview-button primary"
                  disabled={!isCameraOn || !isMicOn}
                >
                  <Play />
                  Start Interview
                </button>
              ) : (
                <button
                  onClick={stopInterview}
                  className="interview-button destructive"
                >
                  <Square />
                  Stop Interview
                </button>
              )}
            </div>
            
            <div className="status-container">
              <p className="status-label">Status:</p>
              <p className="status-text">{statusMessage}</p>
            </div>
          </div>
        </div>

        {/* Video Layout */}
        <div className="video-grid">
          {/* User Video */}
          <div className="interview-card">
            <div className="interview-card-header">
              <h2 className="interview-card-title">Your Video</h2>
            </div>
            <div className="interview-card-content">
              <div className="video-container">
                {userStream ? (
                  <video
                    ref={userVideoRef}
                    autoPlay
                    muted
                    playsInline
                    className="video-element"
                  />
                ) : (
                  <div className="video-placeholder">
                    <Camera />
                    <p>Click "Camera" to enable video</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Screen Share */}
          <div className="interview-card">
            <div className="interview-card-header">
              <h2 className="interview-card-title">Screen Share</h2>
            </div>
            <div className="interview-card-content">
              <div className="video-container">
                {screenStream ? (
                  <video
                    ref={screenVideoRef}
                    autoPlay
                    muted
                    playsInline
                    className="video-element"
                  />
                ) : (
                  <div className="video-placeholder">
                    <Monitor />
                    <p>Click "Screen Share" to share your screen</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* AI Interaction */}
          <div className="interview-card">
            <div className="interview-card-header">
              <h2 className="interview-card-title">AI Interviewer</h2>
            </div>
            <div className="interview-card-content">
              <div className="ai-interaction">
                <div className="caption-container">
                  <p className="caption-label">AI Question/Feedback:</p>
                  <div className="caption-text">
                    {aiCaptions || (
                      <span className="caption-placeholder">
                        Start the interview to see AI questions here...
                      </span>
                    )}
                  </div>
                </div>
                
                <div className="caption-container">
                  <p className="caption-label">Your Response:</p>
                  <div className="caption-text">
                    {userCaptions || (
                      <span className="caption-placeholder">
                        {isListening ? "Listening..." : "Your speech will appear here..."}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        
      </div>
    </div>
  );
};

export default UserInterviewRoom;
