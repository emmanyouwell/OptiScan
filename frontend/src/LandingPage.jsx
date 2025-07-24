import React, { useEffect, useState } from 'react';
import './CSS/LandingPage.css';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import BASE_URL from './common/baseURL';

function LandingPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (token) {
      // If user is logged in, redirect to /home
      navigate('/home', { replace: true });
    }
  }, [navigate]);



  useEffect(() => {
    const checkAuthStatus = async () => {
      const token = localStorage.getItem('access_token');

      if (token) {
        try {
          const response = await axios.get(`${BASE_URL}/api/users/me`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });

          // console.log('User data received:', response.data);
          setUser(response.data.user);
        } catch (error) {
          console.error('Error fetching user:', error);
          // Token might be expired or invalid
          localStorage.removeItem('access_token');
          localStorage.removeItem('user');
          toast.error('Session expired, please login again');
        }
      }

      setLoading(false);
    };

    checkAuthStatus();
  }, []);



  if (loading) {
    return (
      <div className="loading">
        <div className="loader"></div>
      </div>
    );
  }



  return (


    <div className="landing">
      <header className="header">

        <div className="container">
          <div className="logo">
            <h2>OptiScan</h2>
            <span>Eye Detection</span>
          </div>

          <nav className="nav">
            <a href="/">Home</a>
            <span></span>
            <a href="/eye-conditions">Eye Conditions</a>
            <span></span>
            <a href="/about">About</a>
            <span></span>
            <a href="/contact">Contact</a>
          </nav>

          <div className="auth">
            {user ? (
              <div className="user-menu">
                <span className="welcome">Hi, {user.username}</span>
                <button onClick={handleLogout} className="btn-logout" style={{ margin: '0 20px' }}>
                  Logout
                </button>
              </div>
            ) : (
              <div className="auth-buttons">
                <a href="/login" className="btn-login">Login</a>
                <span></span>
                <a href="/register" className="btn-register">Register</a>
              </div>
            )}
          </div>

        </div>

      </header>

      {/* Hero Section */}
      <section className="hero">
        <div className="container">
          <div className="hero-content">
            <h1>
              Advanced Eye Detection System
            </h1>
            <p>
              With real-time tracking and intelligent analysis powered by computer vision, we’re here to help you stay on top of your eye health every step of the way.
            </p>
            <div className="hero-buttons">
              <button className="btn-primary">Try Demo</button>
              <button className="btn-secondary">Learn More</button>
            </div>
          </div>
          <div className="hero-visual">
            <div className="eye-scanner">
              <div className="scanner-box">
                <div className="eye-icon">👁</div>
                <div className="scan-lines">
                  <div className="line"></div>
                  <div className="line"></div>
                  <div className="line"></div>
                </div>
              </div>
              <div className="status">
                <span className="indicator"></span>
                <span>Ready to scan</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="features">
        <div className="container">
          <h2>Key Features</h2>
          <div className="features-grid">
            <div className="feature">
              <div className="feature-icon">🎯</div>
              <h3>Real-time Detection</h3>
              <p>Instant eye tracking and analysis</p>
            </div>
            <div className="feature">
              <div className="feature-icon">📊</div>
              <h3>Health Analytics</h3>
              <p>Comprehensive health insights</p>
            </div>
            <div className="feature">
              <div className="feature-icon">🔒</div>
              <h3>Secure & Private</h3>
              <p>Your data stays protected</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="cta">
        <div className="container">
          <h2>Ready to get started?</h2>
          <p>Experience the future of eye health monitoring</p>
          <a href="/register" className="btn-cta">
            Start Your Journey
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="container">
          <div className="footer-content">
            <div className="footer-brand">
              <h3>OptiScan</h3>
              <p>Advanced eye detection technology</p>
            </div>
            <div className="footer-links">
              <a href="/privacy">Privacy</a>
              <a href="/terms">Terms</a>
              <a href="/support">Support</a>
            </div>
          </div>
          <div className="footer-bottom">
            <p>&copy; 2025 OptiScan. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default LandingPage;