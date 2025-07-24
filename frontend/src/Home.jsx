import React, { useState, useEffect } from 'react';
import UserNavBar from './components/layouts/UserNavBar';
import axios from 'axios';
import BASE_URL from './common/baseURL';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

export default function Home() {
  // return (
  //   <UserNavBar />

  // )
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

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
          setUser(response.data.user);
        } catch (error) {
          localStorage.removeItem('access_token');
          localStorage.removeItem('user');
          toast.error('Session expired, please login again');
          navigate('/');
        }
      } else {
        navigate('/');
      }
      setLoading(false);
    };
    checkAuthStatus();
  }, [navigate]);

  if (loading) {
    return (
      <div className="loading">
        <div className="loader"></div>
      </div>
    );
  }

  return (
    <>
      <UserNavBar />
      {/* Add your Home page content here */}
      <div style={{ padding: '2rem', textAlign: 'center',  }}>
        <h1>Welcome back, {user?.username || 'User'}!</h1>
        <p>Start scanning or explore your dashboard.</p>
      </div>
    </>
  );
}
