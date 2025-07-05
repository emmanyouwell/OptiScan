import React from 'react';
import './CSS/LandingPage.css';

function LandingPage() {
  return (
    <div className="LandingPage-container">
      {/* Navigation Header */}
      <header className="navbar">
        <div className="nav-content">
          <div className="logo">
            <h2>OptiScan</h2>
          </div>
          <nav className="nav-links">
            <a href="/">LandingPage</a>
            <a href="/about">About</a>
            <a href="/services">Services</a>
            <a href="/contact">Contact</a>
          </nav>
          <div className="auth-buttons">
            <a href="/login" className="login-btn">Login</a>
            <a href="/register" className="register-btn">Register</a>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content">
          <h1>Welcome to MyApp</h1>
          <p>Your solution for modern web applications</p>
          <button className="cta-button">Get Started</button>
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section">
        <div className="container">
          <h2>Our Features</h2>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">🚀</div>
              <h3>Fast Performance</h3>
              <p>Lightning-fast loading times and smooth user experience</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🔒</div>
              <h3>Secure</h3>
              <p>Advanced security measures to protect your data</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">📱</div>
              <h3>Responsive</h3>
              <p>Works perfectly on all devices and screen sizes</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">⚡</div>
              <h3>Easy to Use</h3>
              <p>Intuitive interface designed for simplicity</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="footer-content">
          <p>&copy; 2025 MyApp. All rights reserved.</p>
          <div className="footer-links">
            <a href="/privacy">Privacy Policy</a>
            <a href="/terms">Terms of Service</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default LandingPage;