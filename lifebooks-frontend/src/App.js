import React, { useState, useEffect } from 'react';
import './App.css';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [showLogin, setShowLogin] = useState(false);
  const [showSignup, setShowSignup] = useState(false);
  const [currentPage, setCurrentPage] = useState('home');
  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [signupData, setSignupData] = useState({ name: '', email: '', password: '' });

  // Simple password protection - you can change this password
  const SITE_PASSWORD = 'lifebooks2024';

  useEffect(() => {
    // Check if user is already authenticated
    const authenticated = localStorage.getItem('lifebooks_authenticated');
    if (authenticated === 'true') {
      setIsAuthenticated(true);
    }
  }, []);

  const handleSiteLogin = (e) => {
    e.preventDefault();
    if (password === SITE_PASSWORD) {
      setIsAuthenticated(true);
      localStorage.setItem('lifebooks_authenticated', 'true');
    } else {
      alert('Incorrect password. Please try again.');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('lifebooks_authenticated');
    setCurrentPage('home');
  };

  // Site password protection screen
  if (!isAuthenticated) {
    return (
      <div className="password-protection">
        <div className="password-container">
          <h1>🔒 Private Access</h1>
          <p>This website is password protected</p>
          <form onSubmit={handleSiteLogin}>
            <input
              type="password"
              placeholder="Enter password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button type="submit">Access Website</button>
          </form>
        </div>
      </div>
    );
  }

  const handleLogin = async (e) => {
    e.preventDefault();
    // Mock login for demo - replace with real authentication
    alert('Login functionality will be connected to backend');
    setShowLogin(false);
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    // Mock signup for demo - replace with real authentication
    alert('Signup functionality will be connected to backend');
    setShowSignup(false);
  };

  const renderPage = () => {
    switch(currentPage) {
      case 'terms':
        return (
          <div className="legal-page">
            <h1>Terms and Conditions</h1>
            <div className="legal-content">
              <h2>1. Acceptance of Terms</h2>
              <p>By accessing and using Lifebooks AI, you accept and agree to be bound by the terms and provision of this agreement.</p>
              
              <h2>2. Service Description</h2>
              <p>Lifebooks AI provides AI-powered personal storytelling services that convert audio recordings into formatted books for publishing.</p>
              
              <h2>3. User Content</h2>
              <p>You retain ownership of your personal stories and content. We use your content solely to provide our AI processing services.</p>
              
              <h2>4. AI Services</h2>
              <p>Our AI technology processes your recordings to create written narratives. While we strive for accuracy, AI-generated content may require review and editing.</p>
              
              <h2>5. Publishing Rights</h2>
              <p>You retain all rights to publish your completed books through Amazon KDP or other platforms.</p>
            </div>
          </div>
        );
      case 'privacy':
        return (
          <div className="legal-page">
            <h1>Privacy Policy</h1>
            <div className="legal-content">
              <h2>1. Information We Collect</h2>
              <p>We collect audio recordings, personal stories, and account information you provide to create your books.</p>
              
              <h2>2. How We Use Your Information</h2>
              <p>Your information is used solely to provide our AI processing services and create your personalized books.</p>
              
              <h2>3. Data Security</h2>
              <p>We implement industry-standard security measures to protect your personal information and stories.</p>
              
              <h2>4. Data Sharing</h2>
              <p>We do not share your personal stories or content with third parties without your explicit consent.</p>
              
              <h2>5. Your Rights</h2>
              <p>You have the right to access, modify, or delete your personal information at any time.</p>
            </div>
          </div>
        );
      case 'dashboard':
        return (
          <div className="dashboard">
            <h1>Your Dashboard</h1>
            <div className="dashboard-content">
              <div className="dashboard-card">
                <h3>📚 Your Stories</h3>
                <p>0 stories created</p>
                <button>Start New Story</button>
              </div>
              <div className="dashboard-card">
                <h3>🎤 Recordings</h3>
                <p>0 hours recorded</p>
                <button>Start Recording</button>
              </div>
              <div className="dashboard-card">
                <h3>📖 Published Books</h3>
                <p>0 books published</p>
                <button>View Gallery</button>
              </div>
            </div>
          </div>
        );
      default:
        return (
          <>
            <section className="hero">
              <div className="hero-content">
                <h1>Transform Your Life Stories into Beautiful Books with AI</h1>
                <p>Share your memories through voice recordings and watch as our AI crafts them into professionally formatted books, ready for publishing on Amazon KDP.</p>
                <div className="hero-buttons">
                  <button className="cta-button" onClick={() => setCurrentPage('dashboard')}>Start Your Story</button>
                  <button className="secondary-button" onClick={() => setShowLogin(true)}>Login</button>
                </div>
              </div>
              <div className="hero-image">
                <div className="book-mockup">
                  <div className="book-cover">
                    <h3>Your Life Story</h3>
                    <p>A Beautiful Book</p>
                  </div>
                </div>
              </div>
            </section>

            <section className="features">
              <h2>How It Works</h2>
              <div className="features-grid">
                <div className="feature">
                  <div className="feature-icon">🎤</div>
                  <h3>Voice Recording</h3>
                  <p>Simply speak your memories and experiences. Our platform captures every detail of your personal journey.</p>
                </div>
                <div className="feature">
                  <div className="feature-icon">🤖</div>
                  <h3>AI Book Covers</h3>
                  <p>Advanced AI technology transforms your recordings into beautifully written, coherent narratives.</p>
                </div>
                <div className="feature">
                  <div className="feature-icon">📖</div>
                  <h3>Professional Formatting</h3>
                  <p>Your stories are formatted into a professional book layout, ready for printing and publishing.</p>
                </div>
                <div className="feature">
                  <div className="feature-icon">🚀</div>
                  <h3>Amazon Publishing</h3>
                  <p>Seamlessly publish your book on Amazon Kindle Direct Publishing and share with the world.</p>
                </div>
              </div>
            </section>

            <section className="pricing">
              <h2>Choose Your Plan</h2>
              <div className="pricing-grid">
                <div className="pricing-card">
                  <h3>Starter</h3>
                  <div className="price">$29/month</div>
                  <ul>
                    <li>✓ Up to 5 hours of recordings</li>
                    <li>✓ Basic AI processing</li>
                    <li>✓ PDF download</li>
                    <li>✓ Email support</li>
                  </ul>
                  <button>Get Started</button>
                </div>
                <div className="pricing-card featured">
                  <h3>Professional</h3>
                  <div className="price">$79/month</div>
                  <div className="badge">Most Popular</div>
                  <ul>
                    <li>✓ Up to 20 hours of recordings</li>
                    <li>✓ Advanced AI processing</li>
                    <li>✓ Professional formatting</li>
                    <li>✓ Amazon KDP integration</li>
                    <li>✓ Priority support</li>
                  </ul>
                  <button>Get Started</button>
                </div>
                <div className="pricing-card">
                  <h3>Enterprise</h3>
                  <div className="price">$199/month</div>
                  <ul>
                    <li>✓ Unlimited recordings</li>
                    <li>✓ Premium AI processing</li>
                    <li>✓ Custom formatting</li>
                    <li>✓ Full publishing support</li>
                    <li>✓ Dedicated account manager</li>
                  </ul>
                  <button>Contact Sales</button>
                </div>
              </div>
            </section>
          </>
        );
    }
  };

  return (
    <div className="App">
      <nav className="navbar">
        <div className="nav-brand">
          <h2>Lifebooks AI</h2>
        </div>
        <div className="nav-links">
          <button 
            className={currentPage === 'home' ? 'active' : ''} 
            onClick={() => setCurrentPage('home')}
          >
            Home
          </button>
          <button 
            className={currentPage === 'terms' ? 'active' : ''} 
            onClick={() => setCurrentPage('terms')}
          >
            Terms & Conditions
          </button>
          <button 
            className={currentPage === 'privacy' ? 'active' : ''} 
            onClick={() => setCurrentPage('privacy')}
          >
            Privacy Policy
          </button>
          <button onClick={() => setShowLogin(true)}>Login</button>
          <button onClick={() => setShowSignup(true)}>Sign Up</button>
          <button onClick={handleLogout} className="logout-btn">🔒 Logout</button>
        </div>
      </nav>

      <main>
        {renderPage()}
      </main>

      {/* Login Modal */}
      {showLogin && (
        <div className="modal-overlay">
          <div className="modal">
            <button className="modal-close" onClick={() => setShowLogin(false)}>×</button>
            <h2>Login to Lifebooks AI</h2>
            <form onSubmit={handleLogin}>
              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  value={loginData.email}
                  onChange={(e) => setLoginData({...loginData, email: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>Password</label>
                <input
                  type="password"
                  value={loginData.password}
                  onChange={(e) => setLoginData({...loginData, password: e.target.value})}
                  required
                />
              </div>
              <button type="submit" className="modal-button">Login</button>
            </form>
            <p>Don't have an account? <button onClick={() => {setShowLogin(false); setShowSignup(true);}}>Sign up here</button></p>
          </div>
        </div>
      )}

      {/* Signup Modal */}
      {showSignup && (
        <div className="modal-overlay">
          <div className="modal">
            <button className="modal-close" onClick={() => setShowSignup(false)}>×</button>
            <h2>Sign Up for Lifebooks AI</h2>
            <form onSubmit={handleSignup}>
              <div className="form-group">
                <label>Full Name</label>
                <input
                  type="text"
                  value={signupData.name}
                  onChange={(e) => setSignupData({...signupData, name: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  value={signupData.email}
                  onChange={(e) => setSignupData({...signupData, email: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>Password</label>
                <input
                  type="password"
                  value={signupData.password}
                  onChange={(e) => setSignupData({...signupData, password: e.target.value})}
                  required
                />
              </div>
              <button type="submit" className="modal-button">Sign Up</button>
            </form>
            <p>Already have an account? <button onClick={() => {setShowSignup(false); setShowLogin(true);}}>Login here</button></p>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;

