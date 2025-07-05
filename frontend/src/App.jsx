import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Login from './components/Auth/Login'; // Adjust the path as needed
import Register from './components/Auth/Register';
// import Dashboard from './components/Dashboard';
import Home from './LandingPage'; // Adjust the path as needed

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
        {/* <Route path="/dashboard" element={<Dashboard />} /> */}
        <Route path="/" element={<Home />} /> 


        <Route path="/colorblind-test" element={<div>404 Not Found</div>} />
      </Routes>
    </Router>
  );
}

export default App;