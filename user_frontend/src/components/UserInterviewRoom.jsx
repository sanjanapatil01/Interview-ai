import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { Clock } from 'lucide-react';
import InterviewCompleteModal from './InterviewCompleteModal';
import './userRoom.css';

const UserInterviewRoom = () => {
  const location = useLocation();

  const [isInterviewStarted, setIsInterviewStarted] = useState(false);
  const [timer, setTimer] = useState(0);
  const [statusMessage, setStatusMessage] = useState("Preparing your interview...");
  const [aiQuestion, setAiQuestion] = useState('');
  const [userAnswer, setUserAnswer] = useState('');
  const [sessionId, setSessionId] = useState(null);
  const [userId, setUserId] = useState(null);
  const [micError, setMicError] = useState(false);
  const [cameraError, setCameraError] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [interviewEnded, setInterviewEnded] = useState(false);
  const [showCompleteModal, setShowCompleteModal] = useState(false);

  const userVideoRef = useRef(null);
  const recognitionRef = useRef(null);

  // Extract from navigation
  useEffect(() => {
    if (location?.state) {
      const { sessionId, userId, firstQuestion } = location.state;
      setSessionId(sessionId);
      setUserId(userId);
      if (firstQuestion) setAiQuestion(firstQuestion);
    }
  }, [location]);

  // Enable camera
  useEffect(() => {
    const initCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        if (userVideoRef.current) userVideoRef.current.srcObject = stream;
        setStatusMessage("Camera & Mic ON. Starting interview...");
        startInterview();
      } catch (err) {
        console.error("Camera/Mic error:", err);
        setStatusMessage("Please allow camera & mic access to continue.");
        if (err.name === "NotAllowedError") setMicError(true);
        if (err.name === "NotFoundError") setCameraError(true);
      }
    };
    initCamera();
  }, []);

  // Timer
  useEffect(() => {
    let interval;
    if (isInterviewStarted) {
      interval = setInterval(() => setTimer((t) => t + 1), 1000);
    }
    return () => clearInterval(interval);
  }, [isInterviewStarted]);

  const formatTime = (s) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  };

  // Start Interview
  const startInterview = () => {
    setIsInterviewStarted(true);
    setTimer(0);
    setStatusMessage("Interview started! Speak your answers clearly.");
  };

  // const speakThenListen = (text) => {
  // const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  // if (!SpeechRecognition || !window.speechSynthesis) {
  //   setStatusMessage("Speech APIs not supported in this browser.");
  //   return;
  // }

  // const synth = window.speechSynthesis;
  // const utterance = new SpeechSynthesisUtterance(text);
  // utterance.lang = 'en-US';
  // utterance.rate = 1;

  // let finalTranscript = '';
  // let recognition;
  // let recognitionTimeout;

  // const startRecognition = () => {
  //   recognition = new SpeechRecognition();
  //   recognitionRef.current = recognition;
  //   recognition.lang = 'en-US';
  //   recognition.interimResults = true;
  //   recognition.continuous = false;
  //   recognition.maxAlternatives = 3;

  //   recognition.onstart = () => {
  //     setIsListening(true);
  //     setStatusMessage("🎙️ Listening... Speak now.");
  //     recognitionTimeout = setTimeout(() => {
  //       recognition.stop(); // Stop after 200s
  //     }, 200000);
  //   };

  //   recognition.onresult = (event) => {
  //     let interim = '';
  //     for (let i = event.resultIndex; i < event.results.length; i++) {
  //       const transcript = event.results[i][0].transcript;
  //       if (event.results[i].isFinal) {
  //         finalTranscript += transcript + ' ';
  //       } else {
  //         interim += transcript;
  //       }
  //     }
  //     setUserAnswer(finalTranscript + interim);
  //   };

  //   recognition.onerror = (event) => {
  //     console.error("Recognition error:", event.error);
  //     setStatusMessage("Speech recognition error.");
  //     setIsListening(false);
  //     clearTimeout(recognitionTimeout);
  //   };

  //   recognition.onend = () => {
  //     setIsListening(false);
  //     clearTimeout(recognitionTimeout);
  //     const cleaned = finalTranscript.trim();
  //     if (cleaned) {
  //       setUserAnswer(cleaned);
  //       setStatusMessage("✅ Answer received.");
  //       submitAnswer(cleaned);
  //     } else {
  //       setStatusMessage("No speech detected. Please try again.");
  //     }
  //   };

  //   recognition.start();
  // };

  // synth.cancel();
  // synth.speak(utterance);
  // setStatusMessage("🔊 Speaking question...");

  // utterance.onend = () => {
  //   startRecognition();
  // };


const finalTranscriptRef = useRef('');

const speakThenListen = (text) => {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition || !window.speechSynthesis) {
    setStatusMessage("Speech APIs not supported in this browser.");
    return;
  }

  const synth = window.speechSynthesis;
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'en-US';
  utterance.rate = 1;

  let recognition;
  let recognitionTimeout;

  const startRecognition = () => {
    recognition = new SpeechRecognition();
    recognitionRef.current = recognition;
    recognition.lang = 'en-US';
    recognition.interimResults = true;
    recognition.continuous = true;
    recognition.maxAlternatives = 3;

    finalTranscriptRef.current = ''; // Reset for each question

    recognition.onstart = () => {
      setIsListening(true);
      setStatusMessage("🎙️ Listening... Speak now.");
      recognitionTimeout = setTimeout(() => {
        recognition.stop(); // Stop after 2 minutes
      }, 60000);
    };

    recognition.onresult = (event) => {
      let interim = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscriptRef.current += transcript + ' ';
        } else {
          interim += transcript;
        }
      }

      setUserAnswer(finalTranscriptRef.current + interim);
    };

    recognition.onerror = (event) => {
      console.error("Recognition error:", event.error);
      setStatusMessage("Speech recognition error.");
      setIsListening(false);
      clearTimeout(recognitionTimeout);
    };

    recognition.onend = () => {
      setIsListening(false);
      clearTimeout(recognitionTimeout);

      const cleaned = finalTranscriptRef.current.trim();
      if (cleaned) {
        setUserAnswer(cleaned);
        setStatusMessage("✅ Answer received.");
        submitAnswer(cleaned);
      } else {
        setStatusMessage("No speech detected. Please try again.");
      }

      finalTranscriptRef.current = ''; // Reset for next question
    };

    // Delay start to ensure mic is ready
    setTimeout(() => {
      try {
        recognition.start();
      } catch (err) {
        console.error("Recognition start failed:", err);
      }
    }, 500);
  };

  // Speak question
  synth.cancel();
  synth.speak(utterance);
  setStatusMessage("🔊 Speaking question...");

  utterance.onend = () => {
    startRecognition();
  };
};

  // Trigger TTS + STT when question changes
  useEffect(() => {
    if (aiQuestion && isInterviewStarted) {
      speakThenListen(aiQuestion);
    }
  }, [aiQuestion, isInterviewStarted]);

  // Submit Answer
  // const submitAnswer = async (answer) => {
  //   try {
  //     const res = await fetch("http://127.0.0.1:5000/api/flask/submit_answer", {
  //       method: "POST",
  //       headers: { "Content-Type": "application/json" },
  //       body: JSON.stringify({ session_id: sessionId, answer }),
  //     });

  //     const data = await res.json();
  //     if (data.final_report) {
  //       setInterviewEnded(true);
  //       setIsInterviewStarted(false);
  //       setShowCompleteModal(true);
  //       speakThenListen("Interview finished! Thank you.");
  //     } else if (data.next_question) {
  //       setAiQuestion(data.next_question);
  //       setUserAnswer('');
  //     } else {
  //       setAiQuestion("Waiting for next question...");
  //     }
  //   } catch (err) {
  //     console.error("Submit error:", err);
  //     setStatusMessage("Error submitting your answer. Check connection.");
  //   }
  // };
  const mockQuestions = [
  "Tell me about yourself.",
  "Why do you want this role?",
  "Describe a challenge you overcame.",
  "How do you handle feedback?",
  "Where do you see yourself in 5 years?"
];

const questionIndexRef = useRef(0); // 👈 Persistent across renders

const submitAnswer = async (answer) => {
  console.log("📝 Mock submit:", answer);

  setStatusMessage("⏳ Processing your answer...");
  await new Promise((res) => setTimeout(res, 1000));

  questionIndexRef.current += 1;

  if (questionIndexRef.current >= mockQuestions.length) {
    setInterviewEnded(true);
    setIsInterviewStarted(false);
    setShowCompleteModal(true);
    speakThenListen("Interview finished! Thank you.");
  } else {
    setAiQuestion(mockQuestions[questionIndexRef.current]);
    setUserAnswer('');
    setStatusMessage("Next question coming up...");
  }
};

  return (
    <div className="interview-container">
      <div className="interview-wrapper">
        <div className="interview-header">
          <div>
            <h1 className="interview-title">Interview.ai</h1>
            <p className="interview-subtitle">AI-Powered Interview Platform</p>
          </div>
          <div className="interview-badges">
            <div className="interview-badge"><Clock /> {formatTime(timer)}</div>
            <div className={`interview-badge ${isInterviewStarted ? 'active' : ''}`}>
              {isInterviewStarted ? "Interview Active" : "Ready"}
            </div>
            <div className={`interview-badge ${isListening ? 'active' : ''}`}>
              {isListening ? "🎤 Listening..." : "🔇 Idle"}
            </div>
          </div>
        </div>

        <div className="interview-card">
          <div className="interview-card-header">
            <h2 className="interview-card-title">Status</h2>
          </div>
          <div className="interview-card-content">
            <p className="status-text">{statusMessage}</p>
            {micError && <p style={{ color: 'red' }}>Microphone access denied.</p>}
            {cameraError && <p style={{ color: 'red' }}>Camera access denied.</p>}
          </div>
        </div>

        <div className="video-grid">
          <div className="interview-card">
            <div className="interview-card-header"><h2>Your Video</h2></div>
            <div className="interview-card-content">
              <video ref={userVideoRef} autoPlay muted playsInline className="video-element" />
            </div>
          </div>

          <div className="interview-card">
            <div className="interview-card-header"><h2>AI Interaction</h2></div>
            <div className="interview-card-content">
              <p className="caption-label">AI Question:</p>
              <div className="caption-text">{aiQuestion}</div>

              <p className="caption-label">Your Response:</p>
              <div className="caption-text">
                {userAnswer || <span className="caption-placeholder">Speak your answer...</span>}
              </div>
            </div>
          </div>
        </div>
      </div>
      {showCompleteModal && <InterviewCompleteModal />}
    </div>
  );
};

export default UserInterviewRoom;