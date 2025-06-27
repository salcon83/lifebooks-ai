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
      {/* Navigation */}
      <nav className="main-nav">
        <div className="nav-container">
          <div className="nav-brand">
            <h1>Lifebooks AI</h1>
          </div>
          <div className="nav-links">
            <button 
              className={`nav-link ${currentPage === 'home' ? 'active' : ''}`}
              onClick={() => setCurrentPage('home')}
            >
              Home
            </button>
            <button 
              className={`nav-link ${currentPage === 'story' ? 'active' : ''}`}
              onClick={() => setCurrentPage('story')}
            >
              Your Story
            </button>
            <button 
              className={`nav-link ${currentPage === 'create-story' ? 'active' : ''}`}
              onClick={() => setCurrentPage('create-story')}
            >
              Create Story
            </button>
            <button 
              className={`nav-link ${currentPage === 'terms' ? 'active' : ''}`}
              onClick={() => setCurrentPage('terms')}
            >
              Terms & Conditions
            </button>
            <button 
              className={`nav-link ${currentPage === 'privacy' ? 'active' : ''}`}
              onClick={() => setCurrentPage('privacy')}
            >
              Privacy Policy
            </button>
            {!user ? (
              <>
                <button 
                  className="nav-link login-btn"
                  onClick={() => setCurrentPage('login')}
                >
                  Login
                </button>
                <button 
                  className="nav-link signup-btn"
                  onClick={() => setCurrentPage('register')}
                >
                  Sign Up
                </button>
              </>
            ) : (
              <button 
                className="nav-link logout-btn"
                onClick={handleLogout}
              >
                Dashboard
              </button>
            )}
            <button 
              className="nav-link password-logout-btn"
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

      <style jsx>{`
        .App {
          min-height: 100vh;
          background: linear-gradient(135deg, #ff7e5f 0%, #feb47b 100%);
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }

        .main-nav {
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(10px);
          border-bottom: 1px solid rgba(255, 255, 255, 0.2);
          padding: 0;
        }

        .nav-container {
          max-width: 1200px;
          margin: 0 auto;
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px 20px;
        }

        .nav-brand h1 {
          color: white;
          margin: 0;
          font-size: 1.5rem;
          font-weight: 700;
        }

        .nav-links {
          display: flex;
          gap: 8px;
          align-items: center;
        }

        .nav-link {
          background: none;
          border: none;
          color: white;
          padding: 8px 16px;
          border-radius: 6px;
          cursor: pointer;
          font-weight: 500;
          transition: all 0.2s ease;
          text-decoration: none;
        }

        .nav-link:hover {
          background: rgba(255, 255, 255, 0.1);
        }

        .nav-link.active {
          background: rgba(255, 255, 255, 0.2);
        }

        .login-btn {
          background: rgba(59, 130, 246, 0.8) !important;
        }

        .signup-btn {
          background: rgba(236, 72, 153, 0.8) !important;
        }

        .password-logout-btn {
          background: rgba(220, 38, 38, 0.8) !important;
          margin-left: 8px;
        }

        .main-content {
          min-height: calc(100vh - 80px);
        }

        .loading-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 100vh;
          background: linear-gradient(135deg, #ff7e5f 0%, #feb47b 100%);
          color: white;
        }

        .loading-spinner {
          width: 40px;
          height: 40px;
          border: 4px solid rgba(255, 255, 255, 0.3);
          border-top: 4px solid white;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin-bottom: 20px;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        @media (max-width: 768px) {
          .nav-container {
            flex-direction: column;
            gap: 16px;
          }
          
          .nav-links {
            flex-wrap: wrap;
            justify-content: center;
          }
        }
      `}</style>
    </div>
  );
}

export default App;

