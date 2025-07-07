import React, { useRef, useState, useEffect } from 'react';
import Webcam from 'react-webcam';
import '../../CSS/Eye_Tracking.css'; 

export default function EyeTrackingAnalysis() {
  const webcamRef = useRef(null);
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [currentMetrics, setCurrentMetrics] = useState({
    left_ear: 0,
    right_ear: 0,
    left_pupil: 0,
    right_pupil: 0,
    detected: false
  });
  const [analysis, setAnalysis] = useState('Normal');
  const [isTracking, setIsTracking] = useState(false);
  const [metricsHistory, setMetricsHistory] = useState([]);
  const [sessionStats, setSessionStats] = useState({
    totalFrames: 0,
    detectionRate: 0,
    avgLeftEAR: 0,
    avgRightEAR: 0,
    avgLeftPupil: 0,
    avgRightPupil: 0
  });
  const [error, setError] = useState('');

  // Initialize WebSocket connection
  useEffect(() => {
    const connectWebSocket = () => {
      try {
        const ws = new WebSocket('ws://localhost:8000/api/mediapipe/ws/eye-tracking');
        
        ws.onopen = () => {
          console.log('Connected to MediaPipe eye tracking service');
          setSocket(ws);
          setIsConnected(true);
          setError('');
        };
        
        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            setCurrentMetrics(data.current_metrics);
            setAnalysis(data.analysis);
            
            // Update metrics history for local display
            if (data.current_metrics.detected) {
              setMetricsHistory(prev => {
                const newHistory = [...prev, data.current_metrics].slice(-100); // Keep last 100
                updateSessionStats(newHistory);
                return newHistory;
              });
            }
          } catch (err) {
            console.error('Error parsing WebSocket message:', err);
          }
        };
        
        ws.onclose = () => {
          console.log('Disconnected from eye tracking service');
          setSocket(null);
          setIsConnected(false);
          
          // Try to reconnect after 3 seconds
          setTimeout(connectWebSocket, 3000);
        };
        
        ws.onerror = (error) => {
          console.error('WebSocket error:', error);
          setError('Connection error. Please check if the backend is running.');
        };
        
        setSocket(ws);
      } catch (err) {
        console.error('Failed to create WebSocket connection:', err);
        setError('Failed to connect to backend service.');
      }
    };
    
    connectWebSocket();
    
    return () => {
      if (socket) {
        socket.close();
      }
    };
  }, []);

  // Send frames to MediaPipe backend
  useEffect(() => {
    let interval;
    
    if (isTracking && socket && isConnected && webcamRef.current) {
      interval = setInterval(() => {
        try {
          const screenshot = webcamRef.current.getScreenshot();
          if (screenshot && socket.readyState === WebSocket.OPEN) {
            socket.send(JSON.stringify({
              image: screenshot,
              timestamp: Date.now()
            }));
          }
        } catch (err) {
          console.error('Error sending frame:', err);
        }
      }, 100); // Send frame every 100ms (10 FPS)
    }
    
    return () => clearInterval(interval);
  }, [isTracking, socket, isConnected]);

  const updateSessionStats = (history) => {
    const validMetrics = history.filter(m => m.detected);
    
    if (validMetrics.length > 0) {
      setSessionStats({
        totalFrames: history.length,
        detectionRate: (validMetrics.length / history.length) * 100,
        avgLeftEAR: validMetrics.reduce((sum, m) => sum + m.left_ear, 0) / validMetrics.length,
        avgRightEAR: validMetrics.reduce((sum, m) => sum + m.right_ear, 0) / validMetrics.length,
        avgLeftPupil: validMetrics.reduce((sum, m) => sum + m.left_pupil, 0) / validMetrics.length,
        avgRightPupil: validMetrics.reduce((sum, m) => sum + m.right_pupil, 0) / validMetrics.length,
      });
    }
  };

  const startTracking = () => {
    if (!isConnected) {
      setError('Not connected to backend service');
      return;
    }
    setIsTracking(true);
    setMetricsHistory([]);
    setError('');
  };

  const stopTracking = () => {
    setIsTracking(false);
  };

  const resetSession = () => {
    setMetricsHistory([]);
    setCurrentMetrics({
      left_ear: 0,
      right_ear: 0,
      left_pupil: 0,
      right_pupil: 0,
      detected: false
    });
    setAnalysis('Normal');
    setSessionStats({
      totalFrames: 0,
      detectionRate: 0,
      avgLeftEAR: 0,
      avgRightEAR: 0,
      avgLeftPupil: 0,
      avgRightPupil: 0
    });
  };

  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case 'normal': return '#4CAF50';
      case 'opioid': return '#FF9800';
      case 'stimulant': return '#F44336';
      case 'neurological': return '#9C27B0';
      default: return '#757575';
    }
  };

  const downloadResults = () => {
    const results = {
      session_stats: sessionStats,
      current_analysis: analysis,
      metrics_history: metricsHistory,
      timestamp: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(results, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `eye_tracking_results_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="eye-tracking-analysis">
      <div className="header">
        <h1>MediaPipe Eye Tracking Analysis</h1>
        <div className="connection-status">
          <span className={`status-indicator ${isConnected ? 'connected' : 'disconnected'}`}>
            {isConnected ? '🟢 Connected' : '🔴 Disconnected'}
          </span>
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
              {!currentMetrics.detected && isTracking && (
                <div className="no-detection">No face detected</div>
              )}
            </div>
          </div>
          
          <div className="controls">
            {!isTracking ? (
              <button 
                onClick={startTracking} 
                disabled={!isConnected}
                className="btn btn-primary"
              >
                Start Tracking
              </button>
            ) : (
              <button onClick={stopTracking} className="btn btn-secondary">
                Stop Tracking
              </button>
            )}
            <button onClick={resetSession} className="btn btn-outline">
              Reset Session
            </button>
            {metricsHistory.length > 0 && (
              <button onClick={downloadResults} className="btn btn-outline">
                Download Results
              </button>
            )}
          </div>
        </div>
        
        <div className="metrics-section">
          <div className="real-time-metrics">
            <h3>Real-time Metrics</h3>
            {currentMetrics.detected ? (
              <div className="metrics-grid">
                <div className="metric">
                  <label>Left EAR:</label>
                  <span>{currentMetrics.left_ear.toFixed(3)}</span>
                </div>
                <div className="metric">
                  <label>Right EAR:</label>
                  <span>{currentMetrics.right_ear.toFixed(3)}</span>
                </div>
                <div className="metric">
                  <label>Left Pupil:</label>
                  <span>{currentMetrics.left_pupil.toFixed(3)}</span>
                </div>
                <div className="metric">
                  <label>Right Pupil:</label>
                  <span>{currentMetrics.right_pupil.toFixed(3)}</span>
                </div>
              </div>
            ) : (
              <p className="no-data">No face detected</p>
            )}
          </div>
          
          <div className="analysis-section">
            <h3>Analysis</h3>
            <div 
              className="status-display"
              style={{ borderColor: getStatusColor(analysis) }}
            >
              <span 
                className="status-text"
                style={{ color: getStatusColor(analysis) }}
              >
                {analysis}
              </span>
            </div>
          </div>
          
          <div className="session-stats">
            <h3>Session Statistics</h3>
            <div className="stats-grid">
              <div className="stat">
                <label>Total Frames:</label>
                <span>{sessionStats.totalFrames}</span>
              </div>
              <div className="stat">
                <label>Detection Rate:</label>
                <span>{sessionStats.detectionRate.toFixed(1)}%</span>
              </div>
              <div className="stat">
                <label>Avg Left EAR:</label>
                <span>{sessionStats.avgLeftEAR.toFixed(3)}</span>
              </div>
              <div className="stat">
                <label>Avg Right EAR:</label>
                <span>{sessionStats.avgRightEAR.toFixed(3)}</span>
              </div>
              <div className="stat">
                <label>Avg Left Pupil:</label>
                <span>{sessionStats.avgLeftPupil.toFixed(3)}</span>
              </div>
              <div className="stat">
                <label>Avg Right Pupil:</label>
                <span>{sessionStats.avgRightPupil.toFixed(3)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}