import React, { useRef, useState, useEffect } from 'react';
import Webcam from 'react-webcam';
import * as faceapi from 'face-api.js';

export default function EyeTrackingAnalysis() {
  const webcamRef = useRef(null);
  const [isModelLoading, setIsModelLoading] = useState(true);
  const [currentTest, setCurrentTest] = useState('leftEAR'); // leftEAR, rightEAR, pupils, blinkRate, analysis
  const [testResults, setTestResults] = useState({
    leftEAR: [],
    rightEAR: [],
    leftPupil: [],
    rightPupil: [],
    blinkRate: 0
  });
  const [currentMetrics, setCurrentMetrics] = useState({
    leftEAR: 0,
    rightEAR: 0,
    leftPupil: 0,
    rightPupil: 0
  });
  const [isTesting, setIsTesting] = useState(false);
  const [testDuration, setTestDuration] = useState(10); // seconds per test
  const [timeRemaining, setTimeRemaining] = useState(testDuration);

  // Load face-api.js models
  useEffect(() => {
    const loadModels = async () => {
      await faceapi.nets.tinyFaceDetector.loadFromUri('/models');
      await faceapi.nets.faceLandmark68Net.loadFromUri('/models');
      setIsModelLoading(false);
    };
    loadModels();
  }, []);

  // Handle test timer
  useEffect(() => {
    let timer;
    if (isTesting && timeRemaining > 0) {
      timer = setInterval(() => {
        setTimeRemaining(prev => prev - 1);
      }, 1000);
    } else if (timeRemaining === 0) {
      finishTest();
    }
    return () => clearInterval(timer);
  }, [isTesting, timeRemaining]);

  // Process each frame during tests
  useEffect(() => {
    let interval;
    if (isTesting && !isModelLoading) {
      interval = setInterval(async () => {
        if (webcamRef.current) {
          const image = webcamRef.current.getScreenshot();
          const img = await faceapi.fetchImage(image);
          const detections = await faceapi.detectAllFaces(img, new faceapi.TinyFaceDetectorOptions())
            .withFaceLandmarks();
          
          if (detections.length > 0) {
            const landmarks = detections[0].landmarks;
            const leftEye = landmarks.getLeftEye();
            const rightEye = landmarks.getRightEye();
            
            const leftEAR = calculateEAR(leftEye);
            const rightEAR = calculateEAR(rightEye);
            const leftPupil = estimatePupilSize(leftEye);
            const rightPupil = estimatePupilSize(rightEye);
            
            setCurrentMetrics({
              leftEAR,
              rightEAR,
              leftPupil,
              rightPupil
            });

            // Record metrics based on current test
            if (currentTest === 'leftEAR') {
              setTestResults(prev => ({
                ...prev,
                leftEAR: [...prev.leftEAR, leftEAR]
              }));
            } else if (currentTest === 'rightEAR') {
              setTestResults(prev => ({
                ...prev,
                rightEAR: [...prev.rightEAR, rightEAR]
              }));
            } else if (currentTest === 'pupils') {
              setTestResults(prev => ({
                ...prev,
                leftPupil: [...prev.leftPupil, leftPupil],
                rightPupil: [...prev.rightPupil, rightPupil]
              }));
            }
          }
        }
      }, 200); // Process every 200ms
    }
    return () => clearInterval(interval);
  }, [isTesting, isModelLoading, currentTest]);

  const calculateEAR = (eye) => {
    const A = faceapi.euclideanDistance(eye[1], eye[5]);
    const B = faceapi.euclideanDistance(eye[2], eye[4]);
    const C = faceapi.euclideanDistance(eye[0], eye[3]);
    return (A + B) / (2 * C);
  };

  const estimatePupilSize = (eye) => {
    const eyeWidth = faceapi.euclideanDistance(eye[0], eye[3]);
    return eyeWidth * 0.3;
  };

  const startTest = (testType) => {
    setCurrentTest(testType);
    setIsTesting(true);
    setTimeRemaining(testDuration);
  };

  const finishTest = () => {
    setIsTesting(false);
    setTimeRemaining(testDuration);
    
    // Auto-advance to next test or analysis
    if (currentTest === 'leftEAR') {
      setCurrentTest('rightEAR');
    } else if (currentTest === 'rightEAR') {
      setCurrentTest('pupils');
    } else if (currentTest === 'pupils') {
      setCurrentTest('blinkRate');
    } else {
      setCurrentTest('analysis');
    }
  };

  const renderTestControls = () => {
    if (currentTest === 'analysis') {
      return <AnalysisResults results={testResults} />;
    }

    return (
      <div className="test-controls">
        <h2>{getTestTitle(currentTest)} Test</h2>
        {isTesting ? (
          <>
            <p>Testing in progress... {timeRemaining}s remaining</p>
            <button onClick={() => setIsTesting(false)}>Stop Test</button>
          </>
        ) : (
          <button onClick={() => startTest(currentTest)}>Start {getTestTitle(currentTest)} Test</button>
        )}
      </div>
    );
  };

  const getTestTitle = (test) => {
    switch(test) {
      case 'leftEAR': return 'Left EAR';
      case 'rightEAR': return 'Right EAR';
      case 'pupils': return 'Pupil Dilation';
      case 'blinkRate': return 'Blink Rate';
      default: return 'Analysis';
    }
  };

  return (
    <div className="eye-tracking-analysis">
      <h1>Eye Tracking Analysis</h1>
      
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
        />
      </div>
      
      {isModelLoading ? (
        <div>Loading face detection models...</div>
      ) : (
        <>
          <div className="current-metrics">
            <h3>Current Measurements</h3>
            <p>Left EAR: {currentMetrics.leftEAR.toFixed(3)}</p>
            <p>Right EAR: {currentMetrics.rightEAR.toFixed(3)}</p>
            <p>Left Pupil: {currentMetrics.leftPupil.toFixed(1)}px</p>
            <p>Right Pupil: {currentMetrics.rightPupil.toFixed(1)}px</p>
          </div>
          
          {renderTestControls()}
          
          <div className="test-progress">
            <h3>Test Sequence</h3>
            <div className="progress-steps">
              {['leftEAR', 'rightEAR', 'pupils', 'blinkRate', 'analysis'].map((step) => (
                <div 
                  key={step}
                  className={`step ${currentTest === step ? 'active' : ''}`}
                >
                  {getTestTitle(step)}
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function AnalysisResults({ results }) {
  // Calculate averages
  const avgLeftEAR = results.leftEAR.reduce((a, b) => a + b, 0) / results.leftEAR.length;
  const avgRightEAR = results.rightEAR.reduce((a, b) => a + b, 0) / results.rightEAR.length;
  const avgLeftPupil = results.leftPupil.reduce((a, b) => a + b, 0) / results.leftPupil.length;
  const avgRightPupil = results.rightPupil.reduce((a, b) => a + b, 0) / results.rightPupil.length;
  
  // Determine status based on your criteria
  const getStatus = () => {
    const earDiff = Math.abs(avgLeftEAR - avgRightEAR);
    const pupilDiff = Math.abs(avgLeftPupil - avgRightPupil);
    
    if (earDiff > 0.1) return 'Possible neurological asymmetry';
    if (avgLeftPupil < 10 || avgRightPupil < 10) return 'Possible opioid effect';
    if (avgLeftPupil > 25 || avgRightPupil > 25) return 'Possible stimulant effect';
    return 'Normal eye metrics';
  };

  return (
    <div className="analysis-results">
      <h2>Analysis Results</h2>
      
      <div className="metrics-summary">
        <h3>Average Measurements</h3>
        <p>Left EAR: {avgLeftEAR.toFixed(3)}</p>
        <p>Right EAR: {avgRightEAR.toFixed(3)}</p>
        <p>Left Pupil Size: {avgLeftPupil.toFixed(1)}px</p>
        <p>Right Pupil Size: {avgRightPupil.toFixed(1)}px</p>
      </div>
      
      <div className="status-determination">
        <h3>Analysis</h3>
        <p className="status">{getStatus()}</p>
      </div>
      
      <button onClick={() => window.location.reload()}>Start New Test</button>
    </div>
  );
}