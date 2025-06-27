import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LandingPage from './components/LandingPage';
import Login from './components/Login';
import Register from './components/Register';
import Dashboard from './components/Dashboard';
import StoryEditor from './components/StoryEditor';
import StoryCreator from './components/StoryCreator';
import VoiceRecorder from './components/VoiceRecorder';
import BookCoverCreator from './components/BookCoverCreator';
import Publishing from './components/Publishing';
import TermsAndConditions from './components/TermsAndConditions';
import PrivacyPolicy from './components/PrivacyPolicy';
import './App.css';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState('home');

  useEffect(() => {
    // Check for password authentication
    const isPasswordAuthenticated = localStorage.getItem('passwordAuthenticated');
    if (isPasswordAuthenticated === 'true') {
      setIsAuthenticated(true);
    }

    // Check for user login
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (token && userData) {
      try {
        setUser(JSON.parse(userData));
      } catch (error) {
        console.error('Error parsing user data:', error);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
    setLoading(false);
  }, []);

  const handlePasswordSubmit = (password) => {
    if (password === 'lifebooks2024') {
      setIsAuthenticated(true);
      localStorage.setItem('passwordAuthenticated', 'true');
    } else {
      alert('Incorrect password');
    }
  };

  const handleLogin = (userData, token) => {
    setUser(userData);
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setCurrentPage('home');
  };

  const handlePasswordLogout = () => {
    setIsAuthenticated(false);
    setUser(null);
    localStorage.removeItem('passwordAuthenticated');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setCurrentPage('home');
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading Lifebooks...</p>
      </div>
    );
  }

  // Password Protection Screen
  if (!isAuthenticated) {
    return (
      <div className="password-protection">
        <div className="password-container">
          <div className="password-card">
            <h1>🔒 Private Access</h1>
            <p>This website is password protected</p>
            <form onSubmit={(e) => {
              e.preventDefault();
              const password = e.target.password.value;
              handlePasswordSubmit(password);
            }}>
              <input
                type="password"
                name="password"
                placeholder="Enter password"
                className="password-input"
                required
              />
              <button type="submit" className="password-button">
                Access Website
              </button>
            </form>
          </div>
        </div>
        <style jsx>{`
          .password-protection {
            min-height: 100vh;
            background: linear-gradient(135deg, #ff7e5f 0%, #feb47b 100%);
            display: flex;
            align-items: center;
            justify-content: center;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          }
          .password-container {
            max-width: 400px;
            width: 90%;
          }
          .password-card {
            background: white;
            padding: 40px;
            border-radius: 16px;
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
            text-align: center;
          }
          .password-card h1 {
            font-size: 2rem;
            margin-bottom: 16px;
            color: #1f2937;
          }
          .password-card p {
            color: #6b7280;
            margin-bottom: 32px;
            font-size: 1.1rem;
          }
          .password-input {
            width: 100%;
            padding: 16px;
            border: 2px solid #e5e7eb;
            border-radius: 8px;
            font-size: 1rem;
            margin-bottom: 20px;
            box-sizing: border-box;
          }
          .password-input:focus {
            outline: none;
            border-color: #3b82f6;
          }
          .password-button {
            width: 100%;
            padding: 16px;
            background: linear-gradient(135deg, #3b82f6, #1d4ed8);
            color: white;
            border: none;
            border-radius: 8px;
            font-size: 1.1rem;
            font-weight: 600;
            cursor: pointer;
            transition: transform 0.2s ease;
          }
          .password-button:hover {
            transform: translateY(-2px);
          }
        `}</style>
      </div>
    );
  }

  // Main Application
  return (
    <div className="App">
      {/* Compact Navigation */}
      <nav className="navbar">
        <div className="navbar-container">
          <div className="navbar-brand">
            <h1>Lifebooks AI</h1>
          </div>
          <div className="navbar-nav">
            <button 
              className={`nav-button ${currentPage === 'home' ? 'active' : ''}`}
              onClick={() => setCurrentPage('home')}
            >
              Home
            </button>
            <button 
              className={`nav-button ${currentPage === 'story' ? 'active' : ''}`}
              onClick={() => setCurrentPage('story')}
            >
              Your Story
            </button>
            <button 
              className={`nav-button ${currentPage === 'create-story' ? 'active' : ''}`}
              onClick={() => setCurrentPage('create-story')}
            >
              Create Story
            </button>
            {!user ? (
              <>
                <button 
                  className="nav-button login-btn"
                  onClick={() => setCurrentPage('login')}
                >
                  Login
                </button>
                <button 
                  className="nav-button signup-btn"
                  onClick={() => setCurrentPage('register')}
                >
                  Sign Up
                </button>
              </>
            ) : (
              <button 
                className="nav-button dashboard-btn"
                onClick={() => setCurrentPage('dashboard')}
              >
                Dashboard
              </button>
            )}
            <button 
              className="nav-button logout-btn"
              onClick={handlePasswordLogout}
            >
              🔒 Logout
            </button>
          </div>
        </div>
      </nav>

      {/* Page Content */}
      <main className="main-content">
        {currentPage === 'home' && !user && <LandingPage onNavigate={setCurrentPage} />}
        {currentPage === 'home' && user && <Dashboard user={user} onLogout={handleLogout} />}
        {currentPage === 'story' && user && <Dashboard user={user} onLogout={handleLogout} />}
        {currentPage === 'create-story' && <StoryCreator user={user} />}
        {currentPage === 'login' && <Login onLogin={handleLogin} onNavigate={setCurrentPage} />}
        {currentPage === 'register' && <Register onLogin={handleLogin} onNavigate={setCurrentPage} />}
        {currentPage === 'terms' && <TermsAndConditions />}
        {currentPage === 'privacy' && <PrivacyPolicy />}
        {user && currentPage === 'dashboard' && <Dashboard user={user} onLogout={handleLogout} />}
        </main>

      {/* Footer */}
      <footer className="footer">
        <div className="footer-container">
          <div className="footer-links">
            <button 
              className="footer-link"
              onClick={() => setCurrentPage('terms')}
            >
              Terms & Conditions
            </button>
            <button 
              className="footer-link"
              onClick={() => setCurrentPage('privacy')}
            >
              Privacy Policy
            </button>
          </div>
          <div className="footer-text">
            <p>&copy; 2024 Lifebooks AI. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;

