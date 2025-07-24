import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import BASE_URL from '../../common/baseURL';
import '../../CSS/LandingPage.css';
import { useNavigate } from 'react-router-dom'; 
export default function UserNavBar() {

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

    // Logout function
    const handleLogout = () => {
        localStorage.removeItem('access_token');
        localStorage.removeItem('user');
        setUser(null);
        toast.success('Logged out successfully');
         navigate('/');
    };

    if (loading) {
        return (
            <div className="loading">
                <div className="loader"></div>
            </div>
        );
    }
    return (
        <header className="header">

            <div className="container">
                <div className="logo">
                    <h2>OptiScan</h2>
                    <span>Eye Detection</span>
                </div>

                <nav className="nav">
                    <a href="/home">Home</a>
                    <span></span>
                    <a href="/eye-conditions">Eye Conditions</a>
                    <span></span>
                    <a href="/about">Eye Test</a>
                    <span></span>
                    <a href="/about">Clinics</a>
                    <span></span>
                    <a href="/contact">History</a>
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
    )
}
