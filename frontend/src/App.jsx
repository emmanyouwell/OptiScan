import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Login from './components/Auth/Login'; // Adjust the path as needed
import Register from './components/Auth/Register';
// import Dashboard from './components/Dashboard';
import LandingPage from './LandingPage'; // Adjust the path as needed
import ColorblindTest from './components/Eye_Pages/ColorblindTest';
import EyeTracking from './components/Eye_Pages/Eye_Tracking';
import Dashboard from './components/Admin/Dashboard'; 
import Home from './Home';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
        {/* <Route path="/dashboard" element={<Dashboard />} /> */}
        <Route path="/" element={<LandingPage />} /> 
        <Route path="/home" element={<Home />} />
        <Route path="/eye-tracking" element={<EyeTracking />} />
        <Route path="/colorblind-test" element={<ColorblindTest />} />
        <Route path="/admin/dashboard" element={<Dashboard />} />

        <Route path="*" element={<div>404 Not Found</div>} />
      </Routes>
      
      {/* Add Toaster component for global toast notifications */}
      <Toaster
        position="top-right"
        reverseOrder={false}
        gutter={8}
        containerClassName=""
        containerStyle={{}}
        toastOptions={{
          // Define default options
          className: '',
          duration: 4000,
          style: {
            background: '#363636',
            color: '#fff',
            fontSize: '14px',
            borderRadius: '8px',
            padding: '12px 16px',
          },
          // Default options for specific types
          success: {
            duration: 3000,
            style: {
              background: '#10b981',
              color: '#ffffff',
            },
          },
          error: {
            duration: 5000,
            style: {
              background: '#ef4444',
              color: '#ffffff',
            },
          },
          loading: {
            style: {
              background: '#3b82f6',
              color: '#ffffff',
            },
          },
        }}
      />
    </Router>
  );
}

export default App;