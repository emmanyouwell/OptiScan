import React from 'react';
import './CSS/LandingPage.css';

function LandingPage() {
  return (
    <div className="LandingPage-container">
      {/* Navigation Header */}
      <header className="navbar">
        <div className="nav-content">
          <div className="logo">
            <div className="logo-icon">👁️</div>
            <h2>OptiScan</h2>
            <span className="logo-tagline">Eye Detection System</span>
          </div>
          <nav className="nav-links">
            <a href="/">Home</a>
            <a href="/about">About</a>
            <a href="/services">Services</a>
            <a href="/contact">Contact</a>
          </nav>
          <div className="auth-buttons">
            <a href="/login" className="login-btn">Login</a>
            <a href="/register" className="register-btn">Start Scanning</a>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content">
          <div className="hero-text">
            <h1>Advanced Eye Detection & Health Analysis</h1>
            <p className="hero-subtitle">
              Cutting-edge computer vision technology for real-time eye tracking, 
              pupil analysis, and health monitoring through your camera
            </p>
            <div className="hero-features">
              <div className="hero-feature">
                <span className="feature-icon">🎯</span>
                <span>Real-time Detection</span>
              </div>
              <div className="hero-feature">
                <span className="feature-icon">📊</span>
                <span>Health Analytics</span>
              </div>
              <div className="hero-feature">
                <span className="feature-icon">🔬</span>
                <span>Medical Grade</span>
              </div>
            </div>
            <div className="cta-buttons">
              <button className="cta-primary">Start Eye Scan</button>
              <button className="cta-secondary">View Demo</button>
            </div>
          </div>
          <div className="hero-visual">
            <div className="eye-scanner-demo">
              <div className="scanner-frame">
                <div className="eye-icon">👁️</div>
                <div className="scanning-lines">
                  <div className="scan-line scan-line-1"></div>
                  <div className="scan-line scan-line-2"></div>
                  <div className="scan-line scan-line-3"></div>
                </div>
                <div className="scanner-corners">
                  <div className="corner corner-tl"></div>
                  <div className="corner corner-tr"></div>
                  <div className="corner corner-bl"></div>
                  <div className="corner corner-br"></div>
                </div>
              </div>
              <div className="scanner-data">
                <div className="data-point">
                  <span className="label">Pupil Size:</span>
                  <span className="value">3.2mm</span>
                </div>
                <div className="data-point">
                  <span className="label">Blink Rate:</span>
                  <span className="value">16/min</span>
                </div>
                <div className="data-point">
                  <span className="label">Status:</span>
                  <span className="value status-normal">Normal</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section">
        <div className="container">
          <div className="section-header">
            <h2>Advanced Eye Detection Capabilities</h2>
            <p>Comprehensive analysis powered by computer vision and medical algorithms</p>
          </div>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon eye-feature">👁️‍🗨️</div>
              <h3>Pupil Dilation Analysis</h3>
              <p>Real-time measurement of pupil size and response to detect neurological conditions and substance use</p>
              <div className="feature-stats">
                <span className="stat">±0.1mm accuracy</span>
              </div>
            </div>
            <div className="feature-card">
              <div className="feature-icon eye-feature">👀</div>
              <h3>Blink Pattern Detection</h3>
              <p>Monitor blink frequency and patterns to identify fatigue, neurological issues, and cognitive state</p>
              <div className="feature-stats">
                <span className="stat">95% accuracy</span>
              </div>
            </div>
            <div className="feature-card">
              <div className="feature-icon eye-feature">🎯</div>
              <h3>Eye Tracking & Movement</h3>
              <p>Precise tracking of eye position and movement patterns for comprehensive behavioral analysis</p>
              <div className="feature-stats">
                <span className="stat">Real-time tracking</span>
              </div>
            </div>
            <div className="feature-card">
              <div className="feature-icon eye-feature">📈</div>
              <h3>Health Insights</h3>
              <p>Generate detailed reports and health recommendations based on comprehensive eye analysis</p>
              <div className="feature-stats">
                <span className="stat">Medical grade</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Technology Section */}
      <section className="technology-section">
        <div className="container">
          <div className="tech-content">
            <div className="tech-text">
              <h2>Powered by Advanced Computer Vision</h2>
              <p>Our proprietary algorithms combine multiple detection methods:</p>
              <div className="tech-features">
                <div className="tech-feature">
                  <span className="tech-icon">🧠</span>
                  <div className="tech-details">
                    <h4>MediaPipe Integration</h4>
                    <p>Google's machine learning framework for precise facial landmark detection</p>
                  </div>
                </div>
                <div className="tech-feature">
                  <span className="tech-icon">🔬</span>
                  <div className="tech-details">
                    <h4>Clinical Algorithms</h4>
                    <p>Medical-grade analysis based on established clinical research and thresholds</p>
                  </div>
                </div>
                <div className="tech-feature">
                  <span className="tech-icon">⚡</span>
                  <div className="tech-details">
                    <h4>Real-time Processing</h4>
                    <p>Instant analysis with sub-second response times for immediate results</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="tech-visual">
              <div className="analysis-dashboard">
                <div className="dashboard-header">
                  <h4>Live Analysis</h4>
                  <div className="status-indicator active"></div>
                </div>
                <div className="metrics-grid">
                  <div className="metric">
                    <label>Left Pupil</label>
                    <div className="metric-value">3.4mm</div>
                    <div className="metric-bar">
                      <div className="bar-fill" style={{width: '68%'}}></div>
                    </div>
                  </div>
                  <div className="metric">
                    <label>Right Pupil</label>
                    <div className="metric-value">3.2mm</div>
                    <div className="metric-bar">
                      <div className="bar-fill" style={{width: '64%'}}></div>
                    </div>
                  </div>
                  <div className="metric">
                    <label>Blink Rate</label>
                    <div className="metric-value">16/min</div>
                    <div className="metric-bar">
                      <div className="bar-fill" style={{width: '80%'}}></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="container">
          <div className="cta-content">
            <h2>Ready to Experience Advanced Eye Detection?</h2>
            <p>Join thousands of users who trust OptiScan for their eye health monitoring</p>
            <div className="cta-stats">
              <div className="stat-item">
                <div className="stat-number">10,000+</div>
                <div className="stat-label">Scans Completed</div>
              </div>
              <div className="stat-item">
                <div className="stat-number">95%</div>
                <div className="stat-label">Accuracy Rate</div>
              </div>
              <div className="stat-item">
                <div className="stat-number">24/7</div>
                <div className="stat-label">Available</div>
              </div>
            </div>
            <button className="cta-final">Start Your Eye Scan Now</button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="footer-content">
          <div className="footer-main">
            <div className="footer-brand">
              <div className="footer-logo">
                <span className="footer-icon">👁️</span>
                <h3>OptiScan</h3>
              </div>
              <p>Advanced eye detection and health monitoring technology for everyone.</p>
            </div>
            <div className="footer-links">
              <div className="link-group">
                <h4>Product</h4>
                <a href="/features">Features</a>
                <a href="/pricing">Pricing</a>
                <a href="/demo">Demo</a>
              </div>
              <div className="link-group">
                <h4>Support</h4>
                <a href="/help">Help Center</a>
                <a href="/contact">Contact</a>
                <a href="/api">API Docs</a>
              </div>
              <div className="link-group">
                <h4>Legal</h4>
                <a href="/privacy">Privacy Policy</a>
                <a href="/terms">Terms of Service</a>
                <a href="/medical">Medical Disclaimer</a>
              </div>
            </div>
          </div>
          <div className="footer-bottom">
            <p>&copy; 2025 OptiScan. All rights reserved.</p>
            <div className="footer-badges">
              <span className="badge">Medical Grade</span>
              <span className="badge">HIPAA Compliant</span>
              <span className="badge">FDA Cleared</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default LandingPage;