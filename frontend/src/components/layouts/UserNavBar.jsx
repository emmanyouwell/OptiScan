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

                    setUser(response.data.user);
                } catch (error) {
                    console.error('Error fetching user:', error);
                    localStorage.removeItem('access_token');
                    localStorage.removeItem('user');
                    toast.error('Session expired, please login again');
                }
            }

            setLoading(false);
        };

        checkAuthStatus();
    }, []);

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
                    
                    <div className="dropdown">
                        <button className="dropbtn">Eye Test</button>
                        <div className="dropdown-content">
                            <a href="/eye-tracking">Eye Tracking</a>
                            <a href="/colorblind-test">Color Blind</a>
                        </div>
                    </div>
                    <span></span>
                    
                    <div className="dropdown clinic-dropdown">
                        <button className="dropbtn">Clinics</button>
                        <div className="dropdown-content clinic-dropdown-content">
                            <div className="clinic-item">
                                <div className="clinic-image">
                                    <img src="/api/placeholder/60/60" alt="REC Clinic" />
                                </div>
                                <div className="clinic-details">
                                    <h4>Roque Eye Clinic (REC)</h4>
                                    <p>St. Luke's Medical Center, Global City</p>
                                    <a href="https://eye.com.ph/contact-us/book/" target="_blank" rel="noopener noreferrer">
                                        Visit Website
                                    </a>
                                </div>
                            </div>

                            <div className="clinic-item">
                                <div className="clinic-image">
                                    <img src="/api/placeholder/60/60" alt="Martinez Eye Clinic" />
                                </div>
                                <div className="clinic-details">
                                    <h4>Martinez Eye Clinic</h4>
                                    <p>BGC, Taguig</p>
                                    <a href="https://www.stlukes.com.ph/health-specialties-and-services/institutes-departments-centers-and-services/eye-institute" target="_blank" rel="noopener noreferrer">
                                        Visit Website
                                    </a>
                                </div>
                            </div>

                            <div className="clinic-item">
                                <div className="clinic-image">
                                    <img src="/api/placeholder/60/60" alt="Medical Center Taguig" />
                                </div>
                                <div className="clinic-details">
                                    <h4>Medical Center Taguig</h4>
                                    <p>Ophthalmology Department (Public)</p>
                                    <a href="https://medicalcentertaguig.com/speciality/ophthalmology/" target="_blank" rel="noopener noreferrer">
                                        Visit Website
                                    </a>
                                </div>
                            </div>

                            <div className="clinic-item">
                                <div className="clinic-image">
                                    <img src="/api/placeholder/60/60" alt="Asian Eye Institute" />
                                </div>
                                <div className="clinic-details">
                                    <h4>Asian Eye Institute</h4>
                                    <p>Rockwell, Makati City</p>
                                    <a href="https://asianeyeinstitute.com/" target="_blank" rel="noopener noreferrer">
                                        Visit Website
                                    </a>
                                </div>
                            </div>

                            <div className="clinic-item">
                                <div className="clinic-image">
                                    <img src="/api/placeholder/60/60" alt="American Eye Center" />
                                </div>
                                <div className="clinic-details">
                                    <h4>The American Eye Center</h4>
                                    <p>Shangri‑La Plaza, Ortigas/Mandaluyong</p>
                                    <a href="https://americaneye.com.ph/index.php/contact-us/#" target="_blank" rel="noopener noreferrer">
                                        Visit Website
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>
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