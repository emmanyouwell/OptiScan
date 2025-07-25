import React, { useState, useEffect } from 'react';
import axios from 'axios';
import UserNavBar from '../layouts/UserNavBar';
import '../../CSS/ColorBlindTest.css'; // Import the existing CSS file

const ColorBlindResult = () => {
  const [testResult, setTestResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showDetailedResults, setShowDetailedResults] = useState(false);

  useEffect(() => {
    fetchLatestTestResult();
  }, []);

  const fetchLatestTestResult = async () => {
    try {
      // Get user ID from localStorage
      let userId = null;
      try {
        const userData = localStorage.getItem("user");
        if (userData) {
          const userObj = JSON.parse(userData);
          userId = userObj?.id || null;
        }
      } catch (error) {
        console.error("Error parsing user data:", error);
        setError("Error retrieving user data. Please login again.");
        setLoading(false);
        return;
      }

      if (!userId) {
        setError("User ID not found. Please login again.");
        setLoading(false);
        return;
      }

      // Fetch the latest test result
      const response = await axios.get(`http://localhost:8000/api/colorblindness/results/${userId}`);
      setTestResult(response.data);
      setLoading(false);
    } catch (err) {
      console.error("Error fetching test results:", err);
      setError("Error loading test results. Please try again later.");
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      timeZoneName: 'short'
    });
  };

  const getTypeColor = (type) => {
    switch (type.toLowerCase()) {
      case 'normal':
        return '#28a745';
      case 'protanopia':
        return '#dc3545';
      case 'deuteranopia':
        return '#fd7e14';
      case 'tritanopia':
        return '#6f42c1';
      default:
        return '#007bff';
    }
  };

  const getConfidenceColor = (confidence) => {
    if (confidence >= 80) return '#28a745';
    if (confidence >= 60) return '#ffc107';
    return '#dc3545';
  };

  if (loading) {
    return (
      <>
        <UserNavBar />
        <div className="colorblind-loading">Loading test results...</div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <UserNavBar />
        <div className="colorblind-analysis-container">
          <div className="colorblind-analysis-card">
            <h2 className="colorblind-analysis-title" style={{ color: '#dc3545' }}>Error</h2>
            <p style={{ fontSize: '1.2em', color: '#666' }}>{error}</p>
          </div>
        </div>
      </>
    );
  }

  if (!testResult) {
    return (
      <>
        <UserNavBar />
        <div className="colorblind-analysis-container">
          <div className="colorblind-analysis-card">
            <h2 className="colorblind-analysis-title">No Results Found</h2>
            <p style={{ fontSize: '1.2em', color: '#666' }}>
              No test results found. Please take the test first.
            </p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <UserNavBar />
      <div className="colorblind-analysis-container">
        <div className="colorblind-analysis-card" style={{ maxWidth: '800px' }}>
          <h2 className="colorblind-analysis-title">Test Complete!</h2>
          
          {/* Main Results Summary */}
          <div className="colorblind-analysis-content">
            <div className="colorblind-analysis-item">
              <span className="colorblind-analysis-label">Suspected Type:</span>{' '}
              <span 
                className="colorblind-analysis-value"
                style={{ color: getTypeColor(testResult.suspected_type) }}
              >
                {testResult.suspected_type}
              </span>
            </div>
            <div className="colorblind-analysis-item">
              <span className="colorblind-analysis-label">Confidence:</span>{' '}
              <span 
                className="colorblind-analysis-value"
                style={{ color: getConfidenceColor(testResult.confidence) }}
              >
                {testResult.confidence}%
              </span>
            </div>
            <div className="colorblind-analysis-item">
              <span className="colorblind-analysis-label">Correct:</span>{' '}
              <span className="colorblind-analysis-value">
                {testResult.plates?.filter(plate => plate.is_correct).length || 0} / {testResult.plates?.length || 14}
              </span>
            </div>
            <div className="colorblind-analysis-item">
              <span className="colorblind-analysis-label">Incorrect:</span>{' '}
              <span className="colorblind-analysis-value">
                {testResult.plates?.filter(plate => !plate.is_correct).length || 0}
              </span>
            </div>
          </div>

          {/* Test Date */}
          <div style={{ marginTop: '32px', padding: '16px', backgroundColor: '#f8f9fa', borderRadius: '12px' }}>
            <div className="colorblind-analysis-item">
              <span className="colorblind-analysis-label">Test Date:</span>{' '}
              <span className="colorblind-analysis-value" style={{ fontSize: '0.9em' }}>
                {formatDate(testResult.test_date)}
              </span>
            </div>
          </div>

          {/* Toggle Detailed Results Button */}
          <div style={{ marginTop: '24px' }}>
            <button
              onClick={() => setShowDetailedResults(!showDetailedResults)}
              className="colorblind-btn colorblind-btn-submit"
              style={{ fontSize: '1.1em', padding: '12px 24px' }}
            >
              {showDetailedResults ? 'Hide Detailed Results' : 'Show Detailed Results'}
            </button>
          </div>

          {/* Detailed Results */}
          {showDetailedResults && (
            <div style={{ marginTop: '32px' }}>
              <h3 style={{ color: '#333', marginBottom: '20px', fontSize: '1.5em' }}>
                Detailed Plate Results
              </h3>
              
              <div style={{ 
                display: 'grid', 
                gap: '16px', 
                maxHeight: '400px', 
                overflowY: 'auto',
                padding: '16px',
                backgroundColor: '#f8f9fa',
                borderRadius: '12px'
              }}>
                {testResult.plates?.map((plate, index) => (
                  <div
                    key={index}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '12px 16px',
                      backgroundColor: plate.is_correct ? '#d4edda' : '#f8d7da',
                      borderRadius: '8px',
                      border: `2px solid ${plate.is_correct ? '#c3e6cb' : '#f5c6cb'}`,
                      fontSize: '1em'
                    }}
                  >
                    <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                      <span style={{ fontWeight: '600' }}>Plate {plate.plate_number}</span>
                      <span>Correct: <strong>{plate.correct_answer}</strong></span>
                      <span>Your Answer: <strong>{plate.user_answer || 'No Answer'}</strong></span>
                    </div>
                    <div style={{
                      padding: '4px 12px',
                      borderRadius: '16px',
                      backgroundColor: plate.is_correct ? '#28a745' : '#dc3545',
                      color: 'white',
                      fontSize: '0.85em',
                      fontWeight: '600'
                    }}>
                      {plate.is_correct ? 'CORRECT' : 'INCORRECT'}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Additional Information */}
          <div style={{ 
            marginTop: '32px', 
            padding: '20px', 
            backgroundColor: '#e3f2fd', 
            borderRadius: '12px',
            textAlign: 'left'
          }}>
            <h4 style={{ color: '#1976d2', marginBottom: '12px' }}>What do these results mean?</h4>
            <div style={{ fontSize: '0.95em', color: '#555', lineHeight: '1.6' }}>
              {testResult.suspected_type === 'normal' ? (
                <p>Your results suggest normal color vision. You were able to correctly identify most or all of the numbers in the Ishihara color plates.</p>
              ) : (
                <div>
                  <p><strong>{testResult.suspected_type.charAt(0).toUpperCase() + testResult.suspected_type.slice(1)}</strong> is a type of color vision deficiency where certain colors may appear similar or difficult to distinguish.</p>
                  <p style={{ marginTop: '8px', fontSize: '0.9em', fontStyle: 'italic' }}>
                    Note: This is a screening test only. For a definitive diagnosis, please consult with an eye care professional.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ marginTop: '32px', display: 'flex', gap: '16px', justifyContent: 'center' }}>
            <button
              onClick={() => window.location.href = '/color-blind-test'}
              className="colorblind-btn colorblind-btn-clear"
            >
              Retake Test
            </button>
            <button
              onClick={() => window.print()}
              className="colorblind-btn colorblind-btn-submit"
            >
              Print Results
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default ColorBlindResult;