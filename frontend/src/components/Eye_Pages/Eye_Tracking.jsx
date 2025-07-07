import React, { useRef, useState, useEffect } from 'react';
import Webcam from 'react-webcam';
import axios from 'axios';
import '../../CSS/Eye_Tracking.css';
import { 
  analyzeLighting, 
  analyzeDistance, 
  validateEnvironment,
  getEnvironmentStatusColor,
  getStatusColor,
  validateTestConditions
} from '../utils/Eye_Track';

export default function EyeTrackingAnalysis() {
  const webcamRef = useRef(null);
  const [currentStep, setCurrentStep] = useState(0); // 0: setup, 1: ear detection, 2: pupil dilation, 3: blink count, 4: results
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  const [sessionId, setSessionId] = useState(null);
  
  // Environment validation states
  const [environmentCheck, setEnvironmentCheck] = useState({
    distance: { status: 'unknown', value: 0, message: '' }, // too_close, too_far, optimal
    lighting: { status: 'unknown', value: 0, message: '' }, // too_dark, too_bright, optimal
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
    { id: 0, name: 'Setup', description: 'Position yourself close to the camera with bright background' },
    { id: 1, name: 'Ear Detection', description: 'Detecting left and right ears for facial positioning (3 seconds)' },
    { id: 2, name: 'Pupil Dilation', description: 'Measuring pupil size changes (5 seconds)' },
    { id: 3, name: 'Blink Count', description: 'Counting eye blinks over 10 seconds' },
    { id: 4, name: 'Results', description: 'Analysis complete - view your results' }
  ];

  // Create session when component mounts
  useEffect(() => {
    createSession();
  }, []);

  // Start environment monitoring when on setup step
  useEffect(() => {
    let intervalId;
    if (currentStep === 0 && webcamRef.current) {
      intervalId = setInterval(() => {
        checkEnvironmentConditions();
      }, 1000); // Check every second
    }
    
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [currentStep]);

  // Environment validation functions - now using utilities
  const checkEnvironmentConditions = async () => {
    if (!webcamRef.current) return;
    
    try {
      const screenshot = webcamRef.current.getScreenshot();
      if (!screenshot) return;
      
      // Convert base64 to image for analysis
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
        
        // Get image data for analysis
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        
        // Use utility functions for analysis
        const lightingResult = analyzeLighting(imageData);
        const distanceResult = analyzeDistance(imageData, canvas.width, canvas.height);
        
        // Validate environment using utility
        const environmentResult = validateEnvironment(lightingResult, distanceResult);
        setEnvironmentCheck(environmentResult);
      };
      img.src = screenshot;
      
    } catch (error) {
      console.error('Error checking environment:', error);
    }
  };

  // Create a new test session
  const createSession = async () => {
    try {
      const response = await axios.post(`${API_BASE_URL}/session/create`);
      setSessionId(response.data.session_id);
      console.log('Session created:', response.data.session_id);
    } catch (error) {
      console.error('Error creating session:', error);
      setError('Failed to create test session');
    }
  };

  // Capture and send frame for processing - updated to use validation utility
  const captureAndAnalyze = async (testType, duration = 5000) => {
    if (!webcamRef.current) {
      setError('Camera not available');
      return null;
    }

    // Use validation utility for test conditions
    const validation = validateTestConditions(environmentCheck);
    if (!validation.isValid) {
      setError(validation.errors[0]); // Show first error
      return null;
    }

    setIsProcessing(true);
    setError('');
    
    try {
      const frames = [];
      const captureInterval = 100; // Capture every 100ms
      const totalFrames = duration / captureInterval;
      
      // Capture frames over the specified duration
      for (let i = 0; i < totalFrames; i++) {
        const screenshot = webcamRef.current.getScreenshot();
        if (screenshot) {
          frames.push({
            image: screenshot,
            timestamp: Date.now(),
            frame_number: i
          });
        }
        
        // Wait before next capture
        await new Promise(resolve => setTimeout(resolve, captureInterval));
        
        // Update progress
        const progress = ((i + 1) / totalFrames) * 100;
        console.log(`Capturing ${testType}: ${progress.toFixed(1)}%`);
      }
      
      // Send to correct endpoint based on test type
      const endpoint = `${API_BASE_URL}/test/${testType}`;
      
      const response = await axios.post(endpoint, {
        frames: frames,
        test_type: testType,
        duration: duration
      }, {
        timeout: 30000,
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      return response.data;
      
    } catch (error) {
      console.error(`Error in ${testType} test:`, error);
      setError(`Failed to complete ${testType} test: ${error.message}`);
      return null;
    } finally {
      setIsProcessing(false);
    }
  };

  // Step 1: Ear Detection Test
  const runEarDetectionTest = async () => {
    console.log('Starting ear detection test...');
    const result = await captureAndAnalyze('ear-detection', 3000);
    
    if (result) {
      setTestResults(prev => ({
        ...prev,
        earDetection: result
      }));
      
      // Update current metrics
      setCurrentMetrics(prev => ({
        ...prev,
        left_ear_score: result.left_ear_score || 0,
        right_ear_score: result.right_ear_score || 0,
        face_detected: result.face_detected || false,
        distance_cm: 60.0 // Mock distance from backend
      }));
      
      // Update session with ear test results
      if (sessionId) {
        await updateSessionEarResults(result);
      }
      
      // Move to next step
      setCurrentStep(2);
    }
  };

  // Step 2: Pupil Dilation Test
  const runPupilDilationTest = async () => {
    console.log('Starting pupil dilation test...');
    const result = await captureAndAnalyze('pupil-dilation', 5000);
    
    if (result) {
      setTestResults(prev => ({
        ...prev,
        pupilDilation: result
      }));
      
      // Update current metrics
      setCurrentMetrics(prev => ({
        ...prev,
        left_pupil_mm: result.left_pupil_mm || 0,
        right_pupil_mm: result.right_pupil_mm || 0
      }));
      
      // Update session with pupil test results
      if (sessionId) {
        await updateSessionPupilResults(result);
      }
      
      // Move to next step
      setCurrentStep(3);
    }
  };

  // Step 3: Blink Count Test
  const runBlinkCountTest = async () => {
    console.log('Starting blink count test...');
    const result = await captureAndAnalyze('blink-count', 10000);
    
    if (result) {
      setTestResults(prev => ({
        ...prev,
        blinkCount: result
      }));
      
      // Update current metrics
      setCurrentMetrics(prev => ({
        ...prev,
        total_blinks: result.total_blinks || 0
      }));
      
      // Update session with blink test results
      if (sessionId) {
        await updateSessionBlinkResults(result);
      }
      
      // Finalize session and get analysis
      await finalizeSession();
      
      // Move to results step
      setCurrentStep(4);
    }
  };

  // Update session with ear test results
  const updateSessionEarResults = async (earData) => {
    try {
      await axios.post(`${API_BASE_URL}/session/${sessionId}/update-ear`, earData);
    } catch (error) {
      console.error('Error updating ear results:', error);
    }
  };

  // Update session with pupil test results
  const updateSessionPupilResults = async (pupilData) => {
    try {
      await axios.post(`${API_BASE_URL}/session/${sessionId}/update-pupil`, pupilData);
    } catch (error) {
      console.error('Error updating pupil results:', error);
    }
  };

  // Update session with blink test results
  const updateSessionBlinkResults = async (blinkData) => {
    try {
      await axios.post(`${API_BASE_URL}/session/${sessionId}/update-blink`, blinkData);
    } catch (error) {
      console.error('Error updating blink results:', error);
    }
  };

  // Finalize session and get final analysis
  const finalizeSession = async () => {
    try {
      const response = await axios.post(`${API_BASE_URL}/session/${sessionId}/finalize`);
      setFinalAnalysis(response.data);
    } catch (error) {
      console.error('Error finalizing session:', error);
      setError('Failed to generate final analysis');
    }
  };

  // Start the appropriate test based on current step
  const startCurrentTest = () => {
    switch (currentStep) {
      case 1:
        runEarDetectionTest();
        break;
      case 2:
        runPupilDilationTest();
        break;
      case 3:
        runBlinkCountTest();
        break;
      default:
        break;
    }
  };

  // Reset all tests
  const resetAllTests = () => {
    setCurrentStep(0);
    setTestResults({
      earDetection: null,
      pupilDilation: null,
      blinkCount: null
    });
    setCurrentMetrics({
      left_ear_score: 0,
      right_ear_score: 0,
      left_pupil_mm: 0,
      right_pupil_mm: 0,
      face_detected: false,
      total_blinks: 0,
      distance_cm: 0
    });
    setFinalAnalysis(null);
    setError('');
    setEnvironmentCheck({
      distance: { status: 'unknown', value: 0, message: '' },
      lighting: { status: 'unknown', value: 0, message: '' },
      faceDetected: false,
      isValidEnvironment: false
    });
    
    // Create new session
    createSession();
  };

  // Download results
  const downloadResults = () => {
    const results = {
      sessionId,
      testResults,
      finalAnalysis,
      environmentConditions: environmentCheck,
      timestamp: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(results, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `eye_tracking_analysis_${sessionId || Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="eye-tracking-analysis">
      <div className="header">
        <h1>Eye Tracking Analysis</h1>
        {sessionId && (
          <div className="session-info">
            <small>Session ID: {sessionId}</small>
          </div>
        )}
        <div className="test-progress">
          {testSteps.map((step, index) => (
            <div 
              key={step.id} 
              className={`step ${currentStep === index ? 'active' : currentStep > index ? 'completed' : ''}`}
            >
              <span className="step-number">{index + 1}</span>
              <span className="step-name">{step.name}</span>
            </div>
          ))}
        </div>
      </div>
      
      {error && (
        <div className="error-message">
          ⚠️ {error}
        </div>
      )}
      
      <div className="main-content">
        <div className="webcam-section">
          <div className="webcam-container">
            <Webcam
              ref={webcamRef}
              audio={false}
              screenshotFormat="image/jpeg"
              videoConstraints={{
                width: 640,
                height: 480,
                facingMode: "user"
              }}
              className="webcam"
            />
            <div className="webcam-overlay">
              {isProcessing && (
                <div className="processing-indicator">
                  <div className="spinner"></div>
                  <span>Processing {testSteps[currentStep]?.name}...</span>
                </div>
              )}
            </div>
          </div>

          {/* Environment Validation Panel */}
          {currentStep === 0 && (
            <div className="environment-validation">
              <h4>Environment Check</h4>
              <div className="validation-grid">
                <div className="validation-item">
                  <div 
                    className="validation-status"
                    style={{ color: getEnvironmentStatusColor(environmentCheck.lighting.status) }}
                  >
                    💡 Lighting: {environmentCheck.lighting.status}
                  </div>
                  <div className="validation-message">
                    {environmentCheck.lighting.message}
                  </div>
                  <div className="validation-value">
                    Brightness: {environmentCheck.lighting.value.toFixed(1)}
                  </div>
                </div>
                
                <div className="validation-item">
                  <div 
                    className="validation-status"
                    style={{ color: getEnvironmentStatusColor(environmentCheck.distance.status) }}
                  >
                    📏 Distance: {environmentCheck.distance.status}
                  </div>
                  <div className="validation-message">
                    {environmentCheck.distance.message}
                  </div>
                  <div className="validation-value">
                    Face coverage: {environmentCheck.distance.value.toFixed(1)}%
                  </div>
                </div>
              </div>
              
              <div className="overall-status">
                <div 
                  className={`status-indicator ${environmentCheck.isValidEnvironment ? 'ready' : 'not-ready'}`}
                >
                  {environmentCheck.isValidEnvironment ? (
                    <>✅ Ready for Analysis</>
                  ) : (
                    <>⚠️ Adjust Environment</>
                  )}
                </div>
              </div>
            </div>
          )}
          
          <div className="current-test-info">
            <h3>{testSteps[currentStep]?.name}</h3>
            <p>{testSteps[currentStep]?.description}</p>
            
            {/* Real-time metrics display */}
            {currentStep > 0 && (
              <div className="current-metrics">
                <h4>Current Metrics:</h4>
                <div className="metrics-grid">
                  <div className="metric">
                    <span>Left Ear Score:</span>
                    <span>{(currentMetrics.left_ear_score * 100).toFixed(1)}%</span>
                  </div>
                  <div className="metric">
                    <span>Right Ear Score:</span>
                    <span>{(currentMetrics.right_ear_score * 100).toFixed(1)}%</span>
                  </div>
                  <div className="metric">
                    <span>Left Pupil:</span>
                    <span>{currentMetrics.left_pupil_mm.toFixed(2)} mm</span>
                  </div>
                  <div className="metric">
                    <span>Right Pupil:</span>
                    <span>{currentMetrics.right_pupil_mm.toFixed(2)} mm</span>
                  </div>
                  <div className="metric">
                    <span>Blinks:</span>
                    <span>{currentMetrics.total_blinks}</span>
                  </div>
                  <div className="metric">
                    <span>Face Detected:</span>
                    <span>{currentMetrics.face_detected ? '✅' : '❌'}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          <div className="controls">
            {currentStep === 0 && (
              <button 
                onClick={() => setCurrentStep(1)} 
                className="btn btn-primary"
                disabled={!sessionId || !environmentCheck.isValidEnvironment}
              >
                {environmentCheck.isValidEnvironment ? 'Begin Analysis' : 'Adjust Environment First'}
              </button>
            )}
            
            {currentStep > 0 && currentStep < 4 && (
              <button 
                onClick={startCurrentTest} 
                disabled={isProcessing}
                className="btn btn-primary"
              >
                {isProcessing ? 'Processing...' : `Start ${testSteps[currentStep]?.name}`}
              </button>
            )}
            
            <button onClick={resetAllTests} className="btn btn-outline">
              Reset All Tests
            </button>
            
            {currentStep === 4 && finalAnalysis && (
              <button onClick={downloadResults} className="btn btn-success">
                Download Results
              </button>
            )}
          </div>
        </div>
        
        <div className="results-section">
          {/* Test Results Display */}
          <div className="test-results">
            <h3>Test Results</h3>
            
            {/* Ear Detection Results */}
            <div className={`test-result ${testResults.earDetection ? 'completed' : 'pending'}`}>
              <h4>1. Ear Detection</h4>
              {testResults.earDetection ? (
                <div className="result-details">
                  <p><strong>Status:</strong> {testResults.earDetection.status}</p>
                  <p><strong>Left Ear Score:</strong> {(testResults.earDetection.left_ear_score * 100).toFixed(1)}%</p>
                  <p><strong>Right Ear Score:</strong> {(testResults.earDetection.right_ear_score * 100).toFixed(1)}%</p>
                  <p><strong>Face Detected:</strong> {testResults.earDetection.face_detected ? 'Yes' : 'No'}</p>
                  <p><strong>Result:</strong> {testResults.earDetection.result}</p>
                  <p><strong>Frames Processed:</strong> {testResults.earDetection.total_frames}</p>
                </div>
              ) : (
                <p className="pending">Pending...</p>
              )}
            </div>
            
            {/* Pupil Dilation Results */}
            <div className={`test-result ${testResults.pupilDilation ? 'completed' : 'pending'}`}>
              <h4>2. Pupil Dilation</h4>
              {testResults.pupilDilation ? (
                <div className="result-details">
                  <p><strong>Status:</strong> {testResults.pupilDilation.status}</p>
                  <p><strong>Left Pupil:</strong> {testResults.pupilDilation.left_pupil_mm?.toFixed(2)} mm</p>
                  <p><strong>Right Pupil:</strong> {testResults.pupilDilation.right_pupil_mm?.toFixed(2)} mm</p>
                  <p><strong>Result:</strong> {testResults.pupilDilation.result}</p>
                  <p><strong>Frames Processed:</strong> {testResults.pupilDilation.total_frames}</p>
                </div>
              ) : (
                <p className="pending">Pending...</p>
              )}
            </div>
            
            {/* Blink Count Results */}
            <div className={`test-result ${testResults.blinkCount ? 'completed' : 'pending'}`}>
              <h4>3. Blink Count</h4>
              {testResults.blinkCount ? (
                <div className="result-details">
                  <p><strong>Status:</strong> {testResults.blinkCount.status}</p>
                  <p><strong>Total Blinks:</strong> {testResults.blinkCount.total_blinks}</p>
                  <p><strong>Blinks per Minute:</strong> {testResults.blinkCount.blinks_per_minute?.toFixed(1)}</p>
                  <p><strong>Result:</strong> {testResults.blinkCount.result}</p>
                  <p><strong>Frames Processed:</strong> {testResults.blinkCount.total_frames}</p>
                </div>
              ) : (
                <p className="pending">Pending...</p>
              )}
            </div>
          </div>
          
          {/* Final Analysis */}
          {finalAnalysis && (
            <div className="final-analysis">
              <h3>Final Analysis</h3>
              <div 
                className="analysis-result"
                style={{ borderColor: getStatusColor(finalAnalysis.final_status) }}
              >
                <h4 style={{ color: getStatusColor(finalAnalysis.final_status) }}>
                  {finalAnalysis.final_status || 'Unknown'}
                </h4>
                <p><strong>Confidence:</strong> {finalAnalysis.confidence?.toFixed(1) || 'N/A'}%</p>
                <div className="summary">
                  <h5>Summary:</h5>
                  <pre>{finalAnalysis.summary || 'No summary available'}</pre>
                </div>
                
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
    </div>
  );
}