import React, { useRef, useState, useEffect } from 'react';
import Webcam from 'react-webcam';
import axios from 'axios';
import toast from 'react-hot-toast';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import '../../CSS/Eye_Tracking.css';
import UserNavBar from '../layouts/UserNavBar';
import {
  analyzeLighting,
  analyzeDistance,
  validateEnvironment,
  getEnvironmentStatusColor,
  getStatusColor,
  validateTestConditions,
  generateEyeTrackingPDF
} from '../utils/Eye_Track';

export default function EyeTrackingAnalysis() {
  const webcamRef = useRef(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  const [sessionId, setSessionId] = useState(null);
  const [progress, setProgress] = useState(0);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [authToken, setAuthToken] = useState(null);
  const [isCreatingSession, setIsCreatingSession] = useState(false);

  // Environment validation states
  const [environmentCheck, setEnvironmentCheck] = useState({
    distance: { status: 'unknown', value: 0, message: '' },
    lighting: { status: 'unknown', value: 0, message: '' },
    faceDetected: false,
    isValidEnvironment: false
  });

  // Test results storage
  const [testResults, setTestResults] = useState({
    earDetection: null,
    pupilDilation: null,
    blinkCount: null
  });

  // Current metrics display
  const [currentMetrics, setCurrentMetrics] = useState({
    left_ear_score: 0,
    right_ear_score: 0,
    left_pupil_mm: 0,
    right_pupil_mm: 0,
    face_detected: false,
    total_blinks: 0,
    distance_cm: 0
  });

  // Final analysis results
  const [finalAnalysis, setFinalAnalysis] = useState(null);

  const API_BASE_URL = 'http://localhost:8000/api/eye-tracking';

  const testSteps = [
    { id: 0, name: 'Setup', description: 'Position yourself for optimal analysis' },
    { id: 1, name: 'Ear Detection', description: 'Analyzing facial positioning' },
    { id: 2, name: 'Pupil Analysis', description: 'Measuring pupil response' },
    { id: 3, name: 'Blink Detection', description: 'Monitoring eye movement patterns' },
    { id: 4, name: 'Results', description: 'Analysis complete' }
  ];

  // Get authentication token on component mount
  useEffect(() => {
    getAuthToken();
  }, []);

  // Real-time environment monitoring (less intrusive)
  useEffect(() => {
    let intervalId;
    if (currentStep === 0 && webcamRef.current) {
      intervalId = setInterval(() => {
        checkEnvironmentConditions();
      }, 2000);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [currentStep]);

  // Get authentication token from localStorage
  const getAuthToken = () => {
    try {
      // First, try to get from your login response structure
      const loginData = localStorage.getItem('loginData');
      if (loginData) {
        try {
          const parsed = JSON.parse(loginData);
          if (parsed.access_token) {
            setAuthToken(parsed.access_token);
            console.log('Auth token retrieved from loginData:', parsed.access_token.substring(0, 20) + '...');
            return;
          }
        } catch (parseError) {
          console.log('Error parsing loginData:', parseError);
        }
      }

      // Try multiple possible token storage locations
      const token = localStorage.getItem('access_token') ||
        localStorage.getItem('token') ||
        localStorage.getItem('authToken') ||
        localStorage.getItem('accessToken') ||
        sessionStorage.getItem('access_token') ||
        sessionStorage.getItem('token') ||
        sessionStorage.getItem('authToken');

      if (token) {
        setAuthToken(token);
        console.log('Auth token retrieved successfully:', token.substring(0, 20) + '...');
      } else {
        setError('Authentication required. Please log in.');
        toast.error('Please log in to continue', { duration: 3000 });
      }
    } catch (error) {
      console.error('Error getting auth token:', error);
      setError('Authentication error. Please log in again.');
    }
  };

  // Create axios instance with authorization headers
  const createAuthenticatedAxios = () => {
    if (!authToken) {
      throw new Error('No authentication token available');
    }

    return axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      },
      timeout: 30000
    });
  };

  // Subtle environment validation
  const checkEnvironmentConditions = async () => {
    if (!webcamRef.current) return;

    try {
      const screenshot = webcamRef.current.getScreenshot();
      if (!screenshot) return;

      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

        const lightingResult = analyzeLighting(imageData);
        const distanceResult = analyzeDistance(imageData, canvas.width, canvas.height);
        const environmentResult = validateEnvironment(lightingResult, distanceResult);

        const prevCheck = environmentCheck;

        if (!prevCheck.isValidEnvironment && environmentResult.isValidEnvironment) {
          toast.success('Environment ready', {
            duration: 2000,
            position: 'top-right',
            style: {
              background: '#10b981',
              color: 'white',
              fontSize: '14px',
              borderRadius: '8px'
            }
          });
        }

        setEnvironmentCheck(environmentResult);
      };
      img.src = screenshot;

    } catch (error) {
      console.error('Error checking environment:', error);
    }
  };

  // Modified createSession function - only called when user wants to start
  const createSession = async () => {
    if (!authToken) {
      setError('Authentication required');
      return false;
    }

    setIsCreatingSession(true);

    try {
      const authenticatedAxios = createAuthenticatedAxios();
      const response = await authenticatedAxios.post('/session/create');

      setSessionId(response.data.session_id);
      console.log('Session created:', response.data.session_id);
      console.log('User ID:', response.data.user_id);

      // Clear any previous errors
      setError('');
      toast.success('Session created successfully!', { duration: 2000 });
      return true;

    } catch (error) {
      console.error('Error creating session:', error);

      if (error.response?.status === 401) {
        setError('Authentication expired. Please log in again.');
        toast.error('Please log in again', { duration: 3000 });
        // Clear invalid token
        localStorage.removeItem('token');
        sessionStorage.removeItem('token');
        setAuthToken(null);
      } else {
        setError('Failed to create test session');
        toast.error('Failed to create session', { duration: 3000 });
      }
      return false;
    } finally {
      setIsCreatingSession(false);
    }
  };

  // Force environment ready function
  const forceEnvironmentReady = () => {
    console.log('🚀 Forcing environment to ready state');
    setEnvironmentCheck({
      distance: { status: 'optimal', value: 80, message: 'Position OK' },
      lighting: { status: 'optimal', value: 75, message: 'Lighting OK' },
      faceDetected: true,
      isValidEnvironment: true
    });
    toast.success('Environment set to ready!', { duration: 2000 });
  };

  // Modified startAnalysis function
  const startAnalysis = async () => {
    if (!authToken) {
      toast.error('Authentication required', { duration: 2000 });
      return;
    }

    if (!environmentCheck.isValidEnvironment) {
      toast.error('Please adjust environment first', { duration: 2000 });
      return;
    }

    // Create session only when user clicks Begin Analysis
    if (!sessionId) {
      const sessionCreated = await createSession();
      if (!sessionCreated) {
        return; // Don't proceed if session creation failed
      }
    }

    // Now move to step 1
    setCurrentStep(1);
  };

  // Enhanced capture with progress tracking and authentication
  const captureAndAnalyze = async (testType, duration = 5000) => {
    if (!authToken) {
      toast.error('Authentication required', { duration: 3000 });
      return null;
    }

    if (!webcamRef.current) {
      toast.error('Camera not available', { duration: 3000 });
      return null;
    }

    const validation = validateTestConditions(environmentCheck);
    if (!validation.isValid) {
      toast.error(validation.errors[0], { duration: 3000 });
      return null;
    }

    setIsProcessing(true);
    setError('');
    setProgress(0);

    try {
      const frames = [];
      const captureInterval = 100;
      const totalFrames = duration / captureInterval;

      for (let i = 0; i < totalFrames; i++) {
        const screenshot = webcamRef.current.getScreenshot();
        if (screenshot) {
          frames.push({
            image: screenshot,
            timestamp: Date.now(),
            frame_number: i
          });
        }

        await new Promise(resolve => setTimeout(resolve, captureInterval));

        const currentProgress = ((i + 1) / totalFrames) * 100;
        setProgress(currentProgress);
      }

      setProgress(100);

      const authenticatedAxios = createAuthenticatedAxios();
      const response = await authenticatedAxios.post(`/test/${testType}`, {
        frames: frames,
        test_type: testType,
        duration: duration
      });

      console.log(`${testType} test completed for user:`, response.data.user_id);
      return response.data;

    } catch (error) {
      console.error(`Error in ${testType} test:`, error);

      if (error.response?.status === 401) {
        toast.error('Authentication expired. Please log in again.', { duration: 3000 });
        setAuthToken(null);
      } else {
        toast.error(`${testType} test failed`, { duration: 3000 });
      }
      return null;
    } finally {
      setIsProcessing(false);
      setProgress(0);
    }
  };

  // Test methods with authentication
  const runEarDetectionTest = async () => {
    const result = await captureAndAnalyze('ear-detection', 3000);

    if (result) {
      setTestResults(prev => ({ ...prev, earDetection: result }));
      setCurrentMetrics(prev => ({
        ...prev,
        left_ear_score: result.left_ear_score || 0,
        right_ear_score: result.right_ear_score || 0,
        face_detected: result.face_detected || false,
        distance_cm: 60.0
      }));

      if (sessionId) {
        await updateSessionEarResults(result);
      }

      setCurrentStep(2);
    }
  };

  const runPupilDilationTest = async () => {
    const result = await captureAndAnalyze('pupil-dilation', 5000);

    if (result) {
      setTestResults(prev => ({ ...prev, pupilDilation: result }));
      setCurrentMetrics(prev => ({
        ...prev,
        left_pupil_mm: result.left_pupil_mm || 0,
        right_pupil_mm: result.right_pupil_mm || 0
      }));

      if (sessionId) {
        await updateSessionPupilResults(result);
      }

      setCurrentStep(3);
    }
  };

  const runBlinkCountTest = async () => {
    const result = await captureAndAnalyze('blink-count', 10000);

    if (result) {
      setTestResults(prev => ({ ...prev, blinkCount: result }));
      setCurrentMetrics(prev => ({
        ...prev,
        total_blinks: result.total_blinks || 0
      }));

      if (sessionId) {
        await updateSessionBlinkResults(result);
      }

      await finalizeSession();
      setCurrentStep(4);
    }
  };

  // Session update methods with authentication
  const updateSessionEarResults = async (earData) => {
    if (!authToken) return;

    try {
      const authenticatedAxios = createAuthenticatedAxios();
      await authenticatedAxios.post(`/session/${sessionId}/update-ear`, earData);
      console.log('Ear results updated for authenticated user');
    } catch (error) {
      console.error('Error updating ear results:', error);
      if (error.response?.status === 401) {
        setAuthToken(null);
        toast.error('Session expired. Please log in again.', { duration: 3000 });
      }
    }
  };

  const updateSessionPupilResults = async (pupilData) => {
    if (!authToken) return;

    try {
      const authenticatedAxios = createAuthenticatedAxios();
      await authenticatedAxios.post(`/session/${sessionId}/update-pupil`, pupilData);
      console.log('Pupil results updated for authenticated user');
    } catch (error) {
      console.error('Error updating pupil results:', error);
      if (error.response?.status === 401) {
        setAuthToken(null);
        toast.error('Session expired. Please log in again.', { duration: 3000 });
      }
    }
  };

  const updateSessionBlinkResults = async (blinkData) => {
    if (!authToken) return;

    try {
      const authenticatedAxios = createAuthenticatedAxios();
      await authenticatedAxios.post(`/session/${sessionId}/update-blink`, blinkData);
      console.log('Blink results updated for authenticated user');
    } catch (error) {
      console.error('Error updating blink results:', error);
      if (error.response?.status === 401) {
        setAuthToken(null);
        toast.error('Session expired. Please log in again.', { duration: 3000 });
      }
    }
  };

  // Finalize session with authentication
  const finalizeSession = async () => {
    if (!authToken) return;

    try {
      const authenticatedAxios = createAuthenticatedAxios();
      const response = await authenticatedAxios.post(`/session/${sessionId}/finalize`);

      setFinalAnalysis(response.data);
      console.log('Session finalized for user:', response.data.user_id);
      toast.success('Analysis complete', { duration: 2000 });
    } catch (error) {
      console.error('Error finalizing session:', error);
      if (error.response?.status === 401) {
        setAuthToken(null);
        toast.error('Session expired. Please log in again.', { duration: 3000 });
      } else {
        setError('Failed to generate final analysis');
      }
    }
  };

  // Simple Data Report Generation Function
  const generateSimpleDataReport = (reportData) => {
    const {
      sessionId,
      testResults,
      finalAnalysis,
      currentMetrics,
      environmentCheck
    } = reportData;

    const timestamp = new Date().toLocaleString();
    const sessionShort = sessionId ? sessionId.slice(-8) : 'Unknown';

    let report = `
╔══════════════════════════════════════════════════════════════════════════════╗
║                        OPTISCAN EYE ANALYSIS REPORT                         ║
╚══════════════════════════════════════════════════════════════════════════════╝

📊 SESSION INFORMATION
═══════════════════════════════════════════════════════════════════════════════
Session ID: ${sessionShort}
Generated: ${timestamp}
Status: Authenticated Session
Environment: ${environmentCheck?.isValidEnvironment ? 'Optimal' : 'Suboptimal'}

📈 LIVE METRICS
═══════════════════════════════════════════════════════════════════════════════
Left Ear:        ${(currentMetrics.left_ear_score * 100).toFixed(0)}%
Right Ear:       ${(currentMetrics.right_ear_score * 100).toFixed(0)}%
Left Pupil:      ${currentMetrics.left_pupil_mm.toFixed(1)}mm
Right Pupil:     ${currentMetrics.right_pupil_mm.toFixed(1)}mm
Blinks:          ${currentMetrics.total_blinks}
Face Detection:  ${currentMetrics.face_detected ? '✓ Detected' : '✗ Not Detected'}

🧪 TEST RESULTS
═══════════════════════════════════════════════════════════════════════════════
`;

    // Ear Detection Results
    if (testResults.earDetection) {
      report += `
┌─ EAR DETECTION ANALYSIS ─────────────────────────────────────────────────────┐
│ Status: ✓ Completed                                                          │
│ Left Ear Score:  ${(testResults.earDetection.left_ear_score * 100).toFixed(1)}%                                           │
│ Right Ear Score: ${(testResults.earDetection.right_ear_score * 100).toFixed(1)}%                                           │
│ Result: ${testResults.earDetection.result || 'High EAR - Possible stimulant use'}                     │
└───────────────────────────────────────────────────────────────────────────────┘
`;
    } else {
      report += `
┌─ EAR DETECTION ANALYSIS ─────────────────────────────────────────────────────┐
│ Status: ✗ Not Performed                                                      │
└───────────────────────────────────────────────────────────────────────────────┘
`;
    }

    // Pupil Analysis Results
    if (testResults.pupilDilation) {
      report += `
┌─ PUPIL ANALYSIS ─────────────────────────────────────────────────────────────┐
│ Status: ✓ Completed                                                          │
│ Left Pupil:  ${testResults.pupilDilation.left_pupil_mm?.toFixed(2) || 'N/A'}mm                                             │
│ Right Pupil: ${testResults.pupilDilation.right_pupil_mm?.toFixed(2) || 'N/A'}mm                                             │
│ Result: ${testResults.pupilDilation.result || 'Normal pupil size'}                           │
└───────────────────────────────────────────────────────────────────────────────┘
`;
    } else {
      report += `
┌─ PUPIL ANALYSIS ─────────────────────────────────────────────────────────────┐
│ Status: ✗ Not Performed                                                      │
└───────────────────────────────────────────────────────────────────────────────┘
`;
    }

    // Blink Analysis Results
    if (testResults.blinkCount) {
      report += `
┌─ BLINK ANALYSIS ─────────────────────────────────────────────────────────────┐
│ Status: ✓ Completed                                                          │
│ Total Blinks: ${testResults.blinkCount.total_blinks || 'N/A'}                                                │
│ Blink Rate:   ${testResults.blinkCount.blinks_per_minute?.toFixed(1) || 'N/A'} bpm                                        │
│ Result: ${testResults.blinkCount.result || 'High blink rate - Possible stimulant use'}          │
└───────────────────────────────────────────────────────────────────────────────┘
`;
    } else {
      report += `
┌─ BLINK ANALYSIS ─────────────────────────────────────────────────────────────┐
│ Status: ✗ Not Performed                                                      │
└───────────────────────────────────────────────────────────────────────────────┘
`;
    }

    // Clinical Summary
    if (finalAnalysis) {
      report += `
🏥 CLINICAL SUMMARY
═══════════════════════════════════════════════════════════════════════════════
Overall Status: ${finalAnalysis.final_status || 'Unknown'}
Confidence Level: ${finalAnalysis.confidence?.toFixed(0) || 'N/A'}%

📋 FINAL ASSESSMENT:
${finalAnalysis.summary || 'Analysis complete. Results show potential indicators requiring medical evaluation.'}

🎯 KEY FINDINGS:
• Ear Detection: ${testResults.earDetection ? (testResults.earDetection.result || 'High EAR - Possible stimulant use') : 'Not completed'}
• Pupil Size: ${testResults.pupilDilation ? (testResults.pupilDilation.result || 'Normal pupil size') : 'Not completed'}
• Blink Rate: ${testResults.blinkCount ? (testResults.blinkCount.result || 'High blink rate - Possible stimulant use') : 'Not completed'}

💡 RECOMMENDATIONS:
`;

      if (finalAnalysis.recommendations && finalAnalysis.recommendations.length > 0) {
        finalAnalysis.recommendations.forEach((rec, index) => {
          report += `${index + 1}. ${rec}\n`;
        });
      } else {
        report += `1. Seek medical evaluation\n2. Signs suggest possible stimulant use\n`;
      }
    } else {
      report += `
🏥 CLINICAL SUMMARY
═══════════════════════════════════════════════════════════════════════════════
Status: Analysis Incomplete
Please complete all test phases to generate a comprehensive clinical summary.
`;
    }

    report += `
═══════════════════════════════════════════════════════════════════════════════
Report generated by OptiScan Eye Analysis System
Confidential Medical Report • ${timestamp}
═══════════════════════════════════════════════════════════════════════════════
`;

    return report;
  };

  // Download Simple Text Report
  const downloadSimpleReport = () => {
    try {
      const reportData = {
        sessionId,
        testResults,
        finalAnalysis,
        environmentCheck,
        authToken,
        currentMetrics
      };

      const reportText = generateSimpleDataReport(reportData);
      const sessionShort = sessionId ? sessionId.slice(-8) : Date.now();
      const timestamp = new Date().toISOString().split('T')[0];
      const timeString = new Date().toTimeString().split(' ')[0].replace(/:/g, '-');

      const blob = new Blob([reportText], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');

      a.href = url;
      a.download = `OptiScan_SimpleReport_${sessionShort}_${timestamp}_${timeString}.txt`;
      a.style.display = 'none';

      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success('Simple report downloaded successfully!', { duration: 3000 });

    } catch (error) {
      console.error('Simple report generation failed:', error);
      toast.error(`Failed to generate simple report: ${error.message}`, { duration: 3000 });
    }
  };

  // PDF Generation
  const generatePDFReport = async () => {
    setIsGeneratingPDF(true);

    const reportData = {
      sessionId,
      testResults,
      finalAnalysis,
      environmentCheck,
      authToken,
      currentMetrics
    };

    const handleProgress = (message) => {
      console.log('📄 PDF Progress:', message);
    };

    const handleSuccess = (message) => {
      setIsGeneratingPDF(false);
      toast.success(message, {
        duration: 3000,
        style: {
          background: '#10b981',
          color: 'white'
        }
      });
    };

    const handleError = (message, type = 'error') => {
      setIsGeneratingPDF(false);
      if (type === 'warning') {
        toast.error(message, {
          duration: 5000,
          style: {
            background: '#f59e0b',
            color: 'white'
          }
        });
      } else {
        toast.error(message, {
          duration: 6000,
          style: {
            background: '#ef4444',
            color: 'white'
          }
        });
      }
    };

    const loadingToast = toast.loading('Generating PDF report...', {
      style: { background: '#3b82f6', color: 'white' }
    });

    try {
      await generateEyeTrackingPDF(reportData, handleProgress, handleSuccess, handleError);
    } finally {
      toast.dismiss(loadingToast);
    }
  };

  // Reset functionality - now clears session properly
  const resetAllTests = () => {
    setCurrentStep(0);
    setTestResults({ earDetection: null, pupilDilation: null, blinkCount: null });
    setCurrentMetrics({
      left_ear_score: 0, right_ear_score: 0, left_pupil_mm: 0,
      right_pupil_mm: 0, face_detected: false, total_blinks: 0, distance_cm: 0
    });
    setFinalAnalysis(null);
    setError('');
    setIsGeneratingPDF(false);
    setSessionId(null); // Clear session ID
    setIsCreatingSession(false);
    setEnvironmentCheck({
      distance: { status: 'unknown', value: 0, message: '' },
      lighting: { status: 'unknown', value: 0, message: '' },
      faceDetected: false, isValidEnvironment: false
    });

    // Don't automatically create a new session
    toast.success('Ready for new analysis', { duration: 2000 });
  };

  const startCurrentTest = () => {
    if (!authToken) {
      toast.error('Authentication required', { duration: 3000 });
      return;
    }

    switch (currentStep) {
      case 1: runEarDetectionTest(); break;
      case 2: runPupilDilationTest(); break;
      case 3: runBlinkCountTest(); break;
      default: break;
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'optimal': return '✓';
      case 'too_dark': case 'too_bright': case 'too_close': case 'too_far': return '!';
      default: return '·';
    }
  };

  // Show authentication error if no token
  if (!authToken && !error) {
    return (
      <div className="eye-tracking-container">
        <div className="auth-required-message">
          <h2>Authentication Required</h2>
          <p>Please log in to access the eye analysis system.</p>
          <button onClick={getAuthToken} className="btn-primary">
            Check Authentication
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <UserNavBar />
      <div className="eye-tracking-container">
        {/* Header */}
        <div className="header-section">
          <div className="title-area">
            <h1>Eye Analysis</h1>
            <p>Professional eye tracking assessment</p>
            {authToken && (
              <span className="auth-status">🔒 Authenticated Session</span>
            )}
          </div>

          {sessionId && (
            <div className="session-badge">
              Session: {sessionId.slice(-8)}
            </div>
          )}
        </div>

        {/* Progress Indicator */}
        <div className="progress-section">
          <div className="step-indicators">
            {testSteps.map((step, index) => (
              <div
                key={step.id}
                className={`step-indicator ${currentStep === index ? 'active' :
                  currentStep > index ? 'completed' : 'pending'
                  }`}
              >
                <div className="step-circle">
                  <span>{currentStep > index ? '✓' : index + 1}</span>
                </div>
                <div className="step-info">
                  <span className="step-title">{step.name}</span>
                  <span className="step-desc">{step.description}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Main Content */}
        <div className="main-section">

          {/* Camera Section */}
          <div className="camera-section">
            <div className="camera-container">
              <div className="camera-wrapper">
                <Webcam
                  ref={webcamRef}
                  audio={false}
                  screenshotFormat="image/jpeg"
                  videoConstraints={{
                    width: 640,
                    height: 480,
                    facingMode: "user"
                  }}
                  className="camera-feed"
                />

                {/* Overlay for processing */}
                {isProcessing && (
                  <div className="processing-overlay">
                    <div className="processing-content">
                      <div className="processing-spinner"></div>
                      <div className="processing-text">
                        <span>Analyzing {testSteps[currentStep]?.name}</span>
                        <div className="progress-bar">
                          <div
                            className="progress-fill"
                            style={{ width: `${progress}%` }}
                          ></div>
                        </div>
                        <span className="progress-text">{progress.toFixed(0)}%</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Environment Status - Only show during setup */}
              {currentStep === 0 && (
                <div className="environment-status">
                  <div className="status-grid">
                    <div className={`status-item ${environmentCheck.lighting.status}`}>
                      <span className="status-icon">
                        {getStatusIcon(environmentCheck.lighting.status)}
                      </span>
                      <div className="status-info">
                        <span className="status-label">Lighting</span>
                        <span className="status-value">
                          {environmentCheck.lighting.value.toFixed(0)}
                        </span>
                      </div>
                    </div>

                    <div className={`status-item ${environmentCheck.distance.status}`}>
                      <span className="status-icon">
                        {getStatusIcon(environmentCheck.distance.status)}
                      </span>
                      <div className="status-info">
                        <span className="status-label">Position</span>
                        <span className="status-value">
                          {environmentCheck.distance.value.toFixed(0)}%
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className={`ready-indicator ${environmentCheck.isValidEnvironment ? 'ready' : 'not-ready'}`}>
                    {environmentCheck.isValidEnvironment ? (
                      <span>✓ Ready to begin</span>
                    ) : (
                      <span>Adjust position and lighting</span>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Controls */}
            <div className="controls-section">
              {currentStep === 0 && (
                <div style={{ display: 'flex', gap: '10px', flexDirection: 'column', alignItems: 'center' }}>
                  <button
                    onClick={startAnalysis}
                    className={`btn-primary ${!environmentCheck.isValidEnvironment || !authToken || isCreatingSession ? 'disabled' : ''}`}
                    disabled={!environmentCheck.isValidEnvironment || !authToken || isCreatingSession}
                  >
                    {isCreatingSession ? (
                      <>
                        <span className="btn-spinner"></span>
                        Creating Session...
                      </>
                    ) : (
                      'Begin Analysis'
                    )}
                  </button>

                  {/* Debug button to force environment ready */}
                  {!environmentCheck.isValidEnvironment && (
                    <button
                      onClick={forceEnvironmentReady}
                      className="btn-outline"
                      style={{
                        padding: '8px 16px',
                        fontSize: '14px',
                        backgroundColor: '#f59e0b',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer'
                      }}
                    >
                      🔧 Force Environment Ready
                    </button>
                  )}

                  {/* Show session status */}
                  {!sessionId && (
                    <p style={{ fontSize: '14px', color: '#666', margin: '10px 0' }}>
                      No active session - Click "Begin Analysis" to start
                    </p>
                  )}
                </div>
              )}

              {currentStep > 0 && currentStep < 4 && (
                <button
                  onClick={startCurrentTest}
                  disabled={isProcessing || !authToken || !sessionId}
                  className="btn-primary"
                >
                  {isProcessing ? 'Processing...' : `Start ${testSteps[currentStep]?.name}`}
                </button>
              )}

              {currentStep === 4 && (
                <div className="result-controls">
                  <button
                    onClick={generatePDFReport}
                    className="btn-success"
                    disabled={isGeneratingPDF || !authToken}
                  >
                    {isGeneratingPDF ? (
                      <>
                        <span className="btn-spinner"></span>
                        Generating...
                      </>
                    ) : (
                      '📄 PDF Report'
                    )}
                  </button>

                  {/* Simple Report Button */}
                  <button
                    onClick={downloadSimpleReport}
                    className="btn-outline"
                    disabled={isGeneratingPDF || !authToken}
                    style={{
                      backgroundColor: '#3b82f6',
                      color: 'white',
                      border: '1px solid #3b82f6'
                    }}
                  >
                    📋 Simple Report
                  </button>

                  <button
                    onClick={resetAllTests}
                    className="btn-outline"
                    disabled={isGeneratingPDF}
                  >
                    New Analysis
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Results Section */}
          <div className="results-section">

            {/* Current Metrics */}
            {currentStep > 0 && (
              <div className="metrics-panel">
                <h3>Live Metrics</h3>
                <div className="metrics-grid">
                  <div className="metric-item">
                    <span className="metric-label">Left Ear</span>
                    <span className="metric-value">
                      {(currentMetrics.left_ear_score * 100).toFixed(0)}%
                    </span>
                  </div>
                  <div className="metric-item">
                    <span className="metric-label">Right Ear</span>
                    <span className="metric-value">
                      {(currentMetrics.right_ear_score * 100).toFixed(0)}%
                    </span>
                  </div>
                  <div className="metric-item">
                    <span className="metric-label">Left Pupil</span>
                    <span className="metric-value">
                      {currentMetrics.left_pupil_mm.toFixed(1)}mm
                    </span>
                  </div>
                  <div className="metric-item">
                    <span className="metric-label">Right Pupil</span>
                    <span className="metric-value">
                      {currentMetrics.right_pupil_mm.toFixed(1)}mm
                    </span>
                  </div>
                  <div className="metric-item">
                    <span className="metric-label">Blinks</span>
                    <span className="metric-value">{currentMetrics.total_blinks}</span>
                  </div>
                  <div className="metric-item">
                    <span className="metric-label">Face Detection</span>
                    <span className="metric-value">
                      {currentMetrics.face_detected ? '✓' : '·'}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Test Results Summary */}
            <div className="results-panel">
              <h3>Test Results</h3>

              <div className="test-cards">
                {/* Ear Detection Card */}
                <div className={`test-card ${testResults.earDetection ? 'completed' : 'pending'}`}>
                  <div className="test-header">
                    <h4>Ear Detection</h4>
                    <span className="test-status">
                      {testResults.earDetection ? '✓' : '·'}
                    </span>
                  </div>
                  {testResults.earDetection && (
                    <div className="test-details">
                      <div className="detail-row">
                        <span>Left: {(testResults.earDetection.left_ear_score * 100).toFixed(1)}%</span>
                        <span>Right: {(testResults.earDetection.right_ear_score * 100).toFixed(1)}%</span>
                      </div>
                      <div className="detail-status">
                        {testResults.earDetection.result || 'Analyzed'}
                      </div>
                    </div>
                  )}
                </div>

                {/* Pupil Analysis Card */}
                <div className={`test-card ${testResults.pupilDilation ? 'completed' : 'pending'}`}>
                  <div className="test-header">
                    <h4>Pupil Analysis</h4>
                    <span className="test-status">
                      {testResults.pupilDilation ? '✓' : '·'}
                    </span>
                  </div>
                  {testResults.pupilDilation && (
                    <div className="test-details">
                      <div className="detail-row">
                        <span>Left: {testResults.pupilDilation.left_pupil_mm?.toFixed(2) || 'N/A'}mm</span>
                        <span>Right: {testResults.pupilDilation.right_pupil_mm?.toFixed(2) || 'N/A'}mm</span>
                      </div>
                      <div className="detail-status">
                        {testResults.pupilDilation.result || 'Analyzed'}
                      </div>
                    </div>
                  )}
                </div>

                {/* Blink Analysis Card */}
                <div className={`test-card ${testResults.blinkCount ? 'completed' : 'pending'}`}>
                  <div className="test-header">
                    <h4>Blink Analysis</h4>
                    <span className="test-status">
                      {testResults.blinkCount ? '✓' : '·'}
                    </span>
                  </div>
                  {testResults.blinkCount && (
                    <div className="test-details">
                      <div className="detail-row">
                        <span>Total: {testResults.blinkCount.total_blinks}</span>
                        <span>Rate: {testResults.blinkCount.blinks_per_minute?.toFixed(1) || 'N/A'} bpm</span>
                      </div>
                      <div className="detail-status">
                        {testResults.blinkCount.result || 'Analyzed'}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Final Analysis */}
            {finalAnalysis && (
              <div className="analysis-panel">
                <h3>Clinical Summary</h3>
                <div className={`analysis-card ${finalAnalysis.final_status?.toLowerCase()}`}>
                  <div className="analysis-header">
                    <h4>{finalAnalysis.final_status || 'Unknown'}</h4>
                    <span className="confidence">
                      {finalAnalysis.confidence?.toFixed(0) || 'N/A'}% confidence
                    </span>
                  </div>

                  {finalAnalysis.summary && (
                    <div className="analysis-summary">
                      <p>{finalAnalysis.summary}</p>
                    </div>
                  )}

                  {finalAnalysis.recommendations && finalAnalysis.recommendations.length > 0 && (
                    <div className="recommendations">
                      <h5>Recommendations:</h5>
                      <ul>
                        {finalAnalysis.recommendations.map((rec, index) => (
                          <li key={index}>{rec}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="error-banner">
            <span>⚠ {error}</span>
            <button onClick={() => setError('')}>×</button>
          </div>
        )}
      </div>
    </>
  );
}