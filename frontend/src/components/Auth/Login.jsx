import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import '../../CSS/Login.css'; 
import axios from 'axios';
import BASE_URL from '../../common/baseURL';


function LoginPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!formData.email || !formData.password) {
      setError('Please enter both email and password');
      toast.error('Please enter both email and password');
      return;
    }
    
    const loadingToast = toast.loading('Logging in...');
    
    try {
      const formDataToSend = new FormData();
      formDataToSend.append('email', formData.email);
      formDataToSend.append('password', formData.password);

      const response = await axios.post(`${BASE_URL}/api/users/login`, formDataToSend, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      toast.dismiss(loadingToast);
      

      toast.success('Login successful! Welcome back!', {
        duration: 2000,
        style: {
          background: '#10b981',
          color: '#ffffff',
        },
      });
      
      // Store token and user data
      localStorage.setItem('access_token', response.data.access_token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      
      console.log('Login response:', response.data);
      
      // Navigate to LandingPage after a brief delay to show the toast
      setTimeout(() => {
        navigate('/home');
      }, 1500);
      
    } catch (err) {
      // Dismiss loading toast
      toast.dismiss(loadingToast);
      
      const errorMessage = err.response?.data?.detail || 'Login failed';
      setError(errorMessage);
      
      // Show error toast
      toast.error(errorMessage, {
        duration: 4000,
        style: {
          background: '#ef4444',
          color: '#ffffff',
        },
      });
    }
  };

  return (
    <div className="login-container">

      <div className="login-form-wrapper">
        <h1>Login</h1>
        
        {/* {error && <div className="error-message">{error}</div>} */}
        
        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="text"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Enter your email"
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Enter your password"
            />
          </div>
          
          <button type="submit" className="login-button">Login</button>
        </form>
        
        <div className="additional-options">
          <a href="/forgot-password">Forgot password?</a>
          <p>Don't have an account? <a href="/register">Register</a></p>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;