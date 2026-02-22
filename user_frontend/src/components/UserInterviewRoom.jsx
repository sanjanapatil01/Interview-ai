
import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { Clock } from 'lucide-react';
import InterviewCompleteModal from './InterviewCompleteModal';
import './userRoom.css';

const UserInterviewRoom = () => {
  const location = useLocation();
 

  const [isInterviewStarted, setIsInterviewStarted] = useState(false);
  const [timer, setTimer] = useState(0);
  const [statusMessage, setStatusMessage] = useState('Preparing your interview...');
  const [aiQuestion, setAiQuestion] = useState('');
  const [, setUserAnswer] = useState('');
  const [interviewId, setInterviewId] = useState(null);
  const [, setCandidateId] = useState(null);
  const [, setResumeId] = useState(null);
  const [reportId, setReportId] = useState(null);
  const [micError, setMicError] = useState(false);
  const [cameraError, setCameraError] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [, setInterviewEnded] = useState(false);
  const [showCompleteModal, setShowCompleteModal] = useState(false);

  // timers & refs
  
  const [thinkTimeLeft, setThinkTimeLeft] = useState(0);
  const [, setAnswerTimeLeft] = useState(0);
  const thinkIntervalRef = useRef(null);
  const answerIntervalRef = useRef(null); // total-answer interval ref

  const userVideoRef = useRef(null);
  const recognitionRef = useRef(null);
  const finalTranscriptRef = useRef(''); // accumulates across short recognition sessions
  const totalAnswerElapsedRef = useRef(0); // seconds elapsed since answer session started
  const restartAttemptsRef = useRef(0);
  const inactivityTimeoutRef = useRef(null);
  const firstQuestionAskedRef = useRef(false); // prevent first question from being asked multiple times

  const MAX_RESTARTS = 6;
  const MAX_ANSWER_SECONDS = 120; // 2 minutes hard cap
  const INACTIVITY_MS = 15000; // 15s of silence triggers finalize

  // extract navigation state
  useEffect(() => {
    if (location?.state) {
      const { candidateId, interviewId, firstQuestion, resumeId, reportId } = location.state;
      setInterviewId(interviewId || null);
      setCandidateId(candidateId || null);
      setResumeId(resumeId || null);
      setReportId(reportId || null);
      if (firstQuestion) setAiQuestion(firstQuestion);
    }
  }, [location]);

  // camera + mic init
  useEffect(() => {
    const initCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        if (userVideoRef.current) userVideoRef.current.srcObject = stream;
        setStatusMessage('Camera & Mic ON. Starting interview...');
        startInterview();
      } catch (err) {
        console.error('Camera/Mic error:', err);
        setStatusMessage('Please allow camera & mic access to continue.');
        if (err.name === 'NotAllowedError') setMicError(true);
        if (err.name === 'NotFoundError') setCameraError(true);
      }
    };
    initCamera();
  }, []);

  // global interview timer
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

  const startInterview = () => {
    setIsInterviewStarted(true);
    setTimer(0);
    setStatusMessage('Interview started! Speak your answers clearly.');
  };

  // when aiQuestion updates, speak question immediately then listen for answer
  useEffect(() => {
    if (aiQuestion && isInterviewStarted && !firstQuestionAskedRef.current) {
      firstQuestionAskedRef.current = true;
      finalTranscriptRef.current = '';
      totalAnswerElapsedRef.current = 0;
      setAnswerTimeLeft(MAX_ANSWER_SECONDS);
      speakThenListen(aiQuestion, MAX_ANSWER_SECONDS);
    }
    return () => {
      clearThinkInterval();
      clearTotalAnswerInterval();
      clearInactivityTimeout();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aiQuestion, isInterviewStarted]);

  // Reset the ref when a NEW question arrives (different from current)
  useEffect(() => {
    firstQuestionAskedRef.current = false;
  }, [aiQuestion]);

  const clearThinkInterval = () => {
    if (thinkIntervalRef.current) {
      clearInterval(thinkIntervalRef.current);
      thinkIntervalRef.current = null;
    }
  };
  const clearTotalAnswerInterval = () => {
    if (answerIntervalRef.current) {
      clearInterval(answerIntervalRef.current);
      answerIntervalRef.current = null;
    }
  };
  const clearInactivityTimeout = () => {
    if (inactivityTimeoutRef.current) {
      clearTimeout(inactivityTimeoutRef.current);
      inactivityTimeoutRef.current = null;
    }
  };

  const speakThenListen = (text, answerSeconds = MAX_ANSWER_SECONDS) => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition || !window.speechSynthesis) {
      setStatusMessage('Speech APIs not supported in this browser.');
      return;
    }

    const synth = window.speechSynthesis;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    utterance.rate = 1;

    // stop any current recognition before speaking
    try {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.onend = null;
          recognitionRef.current.onerror = null;
          recognitionRef.current.stop();
        } catch (e) { /* ignore */ }
        recognitionRef.current = null;
      }
    } catch (e) { /* ignore */ }

    synth.cancel();
    setStatusMessage('🔊 Speaking question...');

    const speakNow = () => {
      try {
        synth.speak(utterance);
      } catch (e) {
        console.error('speak failed:', e);
      }
    };
    if (window.speechSynthesis.getVoices().length === 0) {
      window.speechSynthesis.onvoiceschanged = speakNow;
      speakNow();
    } else {
      speakNow();
    }

    utterance.onend = () => startRecognitionForAnswer(answerSeconds);
    utterance.onerror = () => startRecognitionForAnswer(answerSeconds);
  };

  // start recognition with inactivity-based finalization
  const startRecognitionForAnswer = (answerSeconds = MAX_ANSWER_SECONDS) => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setStatusMessage('Speech recognition not supported.');
      return;
    }

    // stop previous recognition and prevent auto restart
    try {
      if (recognitionRef.current) {
        recognitionRef.current._autoRestart = false;
        try { recognitionRef.current.onend = null; recognitionRef.current.onerror = null; recognitionRef.current.stop(); } catch (e) { /* ignore */ }
        recognitionRef.current = null;
      }
    } catch (e) { /* ignore */ }

    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;
    recognition._autoRestart = true;
    recognition._isAborted = false;

    recognition.lang = 'en-US';
    recognition.interimResults = true;
    recognition.continuous = true; // short sessions, restart manually
    recognition.maxAlternatives = 5;

    recognition.onstart = () => {
      console.log('🎤 Recognition started');
      setIsListening(true);
      setStatusMessage('🎙️ Listening... Speak now.');

      // start total-answer timer if not already running
      if (!answerIntervalRef.current) {
        totalAnswerElapsedRef.current = totalAnswerElapsedRef.current || 0;
        answerIntervalRef.current = setInterval(() => {
          totalAnswerElapsedRef.current += 1;
          const remaining = Math.max(0, MAX_ANSWER_SECONDS - totalAnswerElapsedRef.current);
          setAnswerTimeLeft(remaining);
          if (totalAnswerElapsedRef.current >= MAX_ANSWER_SECONDS) {
            clearTotalAnswerInterval();
            finalizeAnswer();
          }
        }, 1000);
      }

      // reset inactivity timer when recognition starts
      if (inactivityTimeoutRef.current) {
        clearTimeout(inactivityTimeoutRef.current);
        inactivityTimeoutRef.current = null;
      }
    };

    recognition.onresult = (event) => {
      // mark active listening whenever we get any result (interim or final)
      setIsListening(true);
      setStatusMessage('🎙️ Listening... Speak now.');

      let interim = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscriptRef.current += transcript + ' ';
          restartAttemptsRef.current = 0; // reset restarts when we got real speech
        } else {
          interim += transcript;
        }
      }
      setUserAnswer(finalTranscriptRef.current + interim);

      // Reset inactivity timeout every time we receive speech (interim or final)
      if (inactivityTimeoutRef.current) clearTimeout(inactivityTimeoutRef.current);
      inactivityTimeoutRef.current = setTimeout(() => {
        // no speech for INACTIVITY_MS -> finalize answer
        finalizeAnswer();
      }, INACTIVITY_MS);
    };

    recognition.onerror = (event) => {
      console.warn('Recognition error:', event.error);
      if (event.error === 'aborted') {
        recognition._isAborted = true;
        recognition._autoRestart = false;
        setStatusMessage('Recognition aborted. Please retry or press "Retry Listening".');
        setIsListening(false);
        return;
      }
      // transient errors: don't flip UI to idle; keep listening indicator during retry/backoff
      setStatusMessage(`Recognition error: ${event.error}`);
    };

    recognition.onend = () => {
      console.log('🛑 Recognition ended; autoRestart=', recognition._autoRestart, 'isAborted=', recognition._isAborted, 'elapsed=', totalAnswerElapsedRef.current);

      if (recognition._isAborted) {
        console.log('Recognition was aborted, not restarting.');
        setIsListening(false);
        return;
      }

      // If inactivity timer pending, wait for it to finalize; otherwise, try restart
      if (inactivityTimeoutRef.current) {
        console.log('Recognition ended but inactivity timeout pending; not restarting now.');
        return;
      }

      // Try restart if still within max answer time
      if (totalAnswerElapsedRef.current < MAX_ANSWER_SECONDS) {
        restartAttemptsRef.current = (restartAttemptsRef.current || 0) + 1;
        if (restartAttemptsRef.current <= MAX_RESTARTS) {
          setTimeout(() => {
            try {
              startRecognitionForAnswer(MAX_ANSWER_SECONDS - totalAnswerElapsedRef.current);
            } catch (err) {
              console.error('Recognition restart failed:', err);
            }
          }, 500 + restartAttemptsRef.current * 150);
          return;
        } else {
          setStatusMessage('Speech recognition unstable. Use "Retry Listening" or press "Submit Answer" when ready.');
          console.warn('Max recognition restart attempts reached');
          return;
        }
      }

      // If max time reached, finalize
      if (totalAnswerElapsedRef.current >= MAX_ANSWER_SECONDS) {
        finalizeAnswer();
      }
    };

    // small delay to stabilize mic then start
    setTimeout(() => {
      try {
        recognition.start();
      } catch (err) {
        console.error('Recognition start failed:', err);
        setStatusMessage('Recognition start failed. Please retry.');
      }
    }, 300);
  };

  // finalizeAnswer: stop recognition, stop timers, submit accumulated transcript
  const finalizeAnswer = () => {
    clearInactivityTimeout();
    clearTotalAnswerInterval();

    // update UI to reflect we're no longer actively listening
    setIsListening(false);

    try {
      if (recognitionRef.current) {
        recognitionRef.current._autoRestart = false;
        recognitionRef.current.onend = null;
        recognitionRef.current.onerror = null;
        recognitionRef.current.stop();
      }
    } catch (e) { /* ignore */ }

    const cleaned = (finalTranscriptRef.current || '').trim();
    if (cleaned) {
      setUserAnswer(cleaned);
      setStatusMessage('✅ Answer captured. Sending to server...');
      submitAnswer(cleaned);
    } else {
      setStatusMessage('No speech detected. Nothing to submit.');
    }
    finalTranscriptRef.current = '';
    totalAnswerElapsedRef.current = 0;
  };

 

 
  const startAnswerNow = () => {
    clearThinkInterval();
    setThinkTimeLeft(0);
    setStatusMessage('Skipping thinking. Speaking question now...');
    speakThenListen(aiQuestion, MAX_ANSWER_SECONDS);
  };

  // submit to backend
  const submitAnswer = async (answer) => {
    try {
      const payload = {interview_id:interviewId,answer:answer };
      const res = await fetch(`${process.env.REACT_APP_FLASK_API_BASE_URL}/api/interviews/handle`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-API-KEY': process.env.REACT_APP_FLASK_API_KEY },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errText = await res.text().catch(() => res.statusText);
        throw new Error(`Server returned ${res.status}: ${errText}`);
      }

      const data = await res.json();
      if (data.stop===true) {
        setInterviewEnded(true);
        setIsInterviewStarted(false);
        setShowCompleteModal(true);
        const report=await fetch(`${process.env.REACT_APP_FLASK_API_BASE_URL}/api/reports/${interviewId}`,{
          method:'GET',
        });
        const data=await report.json();
        console.log('Report data from Flask API:', data);
         const final_report=data.report;
         console.log('Final report from Flask API:', final_report);
         const add=await fetch(`${process.env.REACT_APP_API_BASE_URL}/update-report/${reportId}`,{
          method:'PUT',
          headers:{'Content-Type':'application/json'},
          body:JSON.stringify({final_report:final_report})
         });
          const addData=await add.json();
          console.log('Report update response:', addData);
          

        speakThenListen('Interview finished! Thank you.');
      }
      // } else if (data.question) {
      else{
        setAiQuestion(data.next_question);
        setUserAnswer('');
        finalTranscriptRef.current = ''; // reset for new question
        restartAttemptsRef.current = 0;
      } 
    } catch (err) {
      console.error('Submit error:', err);
      setStatusMessage(`Error submitting your answer: ${err.message}`);
    }
  };

  // cleanup on unmount
  useEffect(() => {
    return () => {
      clearThinkInterval();
      clearTotalAnswerInterval();
      clearInactivityTimeout();
      try { if (recognitionRef.current) recognitionRef.current.stop(); } catch (e) { /* ignore */ }
      if (window.speechSynthesis) window.speechSynthesis.cancel();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="interview-container">
      <div className="interview-layout">
        {/* Left Panel */}
        <div className="left-panel">
          <div className="interview-header">
            <div>
              <h1 className="interview-title">Interview.ai</h1>
              <p className="interview-subtitle">AI-Powered Interview Platform</p>
            </div>
          </div>
          <div className="interview-badges-vertical">
            <div className="interview-badge"><Clock /> {formatTime(timer)}</div>
            <div className={`interview-badge ${isInterviewStarted ? 'active' : ''}`}>{isInterviewStarted ? 'Interview Active' : 'Ready'}</div>
            <div className={`interview-badge ${isListening ? 'active' : ''}`}>{isListening ? '🎤 Listening...' : '🔇 Idle'}</div>
          </div>
          <div className="interview-card status-card">
            <div className="interview-card-header"><h2 className="interview-card-title">Status</h2></div>
            <div className="interview-card-content">
              <p className="status-text">{statusMessage}</p>
              {micError && <p style={{ color: 'red' }}>Microphone access denied.</p>}
              {cameraError && <p style={{ color: 'red' }}>Camera access denied.</p>}

              {thinkTimeLeft > 0 && (
                <div style={{ marginTop: 8 }}>
                  <strong>Thinking time:</strong> {thinkTimeLeft}s
                  <button onClick={startAnswerNow} style={{ marginLeft: 10 }}>Start Answer Now</button>
                </div>
              )}
            </div>
            <div className="ai-question-section">
              <h3 className="interview-card-subtitle">AI Question:</h3>
              <p className="ai-question-text">{aiQuestion || 'Waiting for question...'}</p>
            </div>
          </div>
        </div>

        {/* Center Video */}
        <div className="center-video">
          <video ref={userVideoRef} autoPlay muted playsInline className="full-video-element" />
        </div>
      </div>

      {showCompleteModal && <InterviewCompleteModal />}
    </div>
  );
};

export default UserInterviewRoom;
// ...existing code...