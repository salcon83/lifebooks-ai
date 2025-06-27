import React, { useState, useEffect } from 'react';
import './App.css';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentPage, setCurrentPage] = useState('home');
  const [user, setUser] = useState(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showSignupModal, setShowSignupModal] = useState(false);
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [signupForm, setSignupForm] = useState({ name: '', email: '', password: '' });

  // Check if user is logged in on component mount
  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    if (token && userData) {
      setIsLoggedIn(true);
      setUser(JSON.parse(userData));
    }
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('https://lifebooks-backend.onrender.com/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(loginForm),
      });
      
      if (response.ok) {
        const data = await response.json();
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        setIsLoggedIn(true);
        setUser(data.user);
        setShowLoginModal(false);
        setLoginForm({ email: '', password: '' });
      } else {
        alert('Login failed. Please check your credentials.');
      }
    } catch (error) {
      console.error('Login error:', error);
      alert('Login failed. Please try again.');
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('https://lifebooks-backend.onrender.com/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(signupForm),
      });
      
      if (response.ok) {
        const data = await response.json();
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        setIsLoggedIn(true);
        setUser(data.user);
        setShowSignupModal(false);
        setSignupForm({ name: '', email: '', password: '' });
      } else {
        alert('Signup failed. Please try again.');
      }
    } catch (error) {
      console.error('Signup error:', error);
      alert('Signup failed. Please try again.');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setIsLoggedIn(false);
    setUser(null);
    setCurrentPage('home');
  };

  const renderNavigation = () => (
    <nav className="navbar">
      <div className="nav-container">
        <div className="nav-logo" onClick={() => setCurrentPage('home')}>
          <h2>Lifebooks AI</h2>
        </div>
        <div className="nav-menu">
          <button 
            className={`nav-link ${currentPage === 'home' ? 'active' : ''}`}
            onClick={() => setCurrentPage('home')}
          >
            Home
          </button>
          {isLoggedIn && (
            <>
              <button 
                className={`nav-link ${currentPage === 'dashboard' ? 'active' : ''}`}
                onClick={() => setCurrentPage('dashboard')}
              >
                Dashboard
              </button>
              <button 
                className={`nav-link ${currentPage === 'your-story' ? 'active' : ''}`}
                onClick={() => setCurrentPage('your-story')}
              >
                Your Story
              </button>
            </>
          )}
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
          {!isLoggedIn ? (
            <div className="auth-buttons">
              <button className="btn-secondary" onClick={() => setShowLoginModal(true)}>
                Login
              </button>
              <button className="btn-primary" onClick={() => setShowSignupModal(true)}>
                Sign Up
              </button>
            </div>
          ) : (
            <div className="user-menu">
              <span className="user-name">Welcome, {user?.name}</span>
              <button className="btn-secondary" onClick={handleLogout}>
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );

  const renderHomePage = () => (
    <div className="home-page">
      {/* Hero Section */}
      <section className="hero">
        <div className="hero-content">
          <h1 className="hero-title">
            Transform Your Life Stories into Beautiful Books with AI
          </h1>
          <p className="hero-subtitle">
            Share your memories through voice recordings and watch as our AI crafts them into professionally formatted books, ready for publishing on Amazon KDP.
          </p>
          <div className="hero-buttons">
            {!isLoggedIn ? (
              <>
                <button className="btn-primary large" onClick={() => setShowSignupModal(true)}>
                  Start Your Story
                </button>
                <button className="btn-secondary large" onClick={() => setShowLoginModal(true)}>
                  Login
                </button>
              </>
            ) : (
              <button className="btn-primary large" onClick={() => setCurrentPage('your-story')}>
                Continue Your Story
              </button>
            )}
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

      {/* Features Section */}
      <section className="features">
        <div className="container">
          <h2 className="section-title">How It Works</h2>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">🎤</div>
              <h3>Record Your Stories</h3>
              <p>Simply speak your memories and experiences. Our platform captures every detail of your personal journey.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🤖</div>
              <h3>AI Processing</h3>
              <p>Advanced AI technology transforms your recordings into beautifully written, coherent narratives.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">📖</div>
              <h3>Professional Formatting</h3>
              <p>Your stories are formatted into a professional book layout, ready for printing and publishing.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🚀</div>
              <h3>Amazon KDP Publishing</h3>
              <p>Seamlessly publish your book on Amazon Kindle Direct Publishing and share with the world.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="pricing">
        <div className="container">
          <h2 className="section-title">Choose Your Plan</h2>
          <div className="pricing-grid">
            <div className="pricing-card">
              <h3>Starter</h3>
              <div className="price">$29<span>/month</span></div>
              <ul className="features-list">
                <li>✓ Up to 5 hours of recordings</li>
                <li>✓ Basic AI processing</li>
                <li>✓ PDF download</li>
                <li>✓ Email support</li>
              </ul>
              <button className="btn-primary" onClick={() => setShowSignupModal(true)}>
                Get Started
              </button>
            </div>
            <div className="pricing-card featured">
              <h3>Professional</h3>
              <div className="price">$79<span>/month</span></div>
              <ul className="features-list">
                <li>✓ Up to 20 hours of recordings</li>
                <li>✓ Advanced AI processing</li>
                <li>✓ Professional formatting</li>
                <li>✓ Amazon KDP integration</li>
                <li>✓ Priority support</li>
              </ul>
              <button className="btn-primary" onClick={() => setShowSignupModal(true)}>
                Most Popular
              </button>
            </div>
            <div className="pricing-card">
              <h3>Enterprise</h3>
              <div className="price">$199<span>/month</span></div>
              <ul className="features-list">
                <li>✓ Unlimited recordings</li>
                <li>✓ Premium AI processing</li>
                <li>✓ Custom formatting</li>
                <li>✓ Full publishing support</li>
                <li>✓ Dedicated account manager</li>
              </ul>
              <button className="btn-primary" onClick={() => setShowSignupModal(true)}>
                Contact Sales
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );

  const renderDashboard = () => (
    <div className="dashboard">
      <div className="container">
        <h1>Welcome to Your Dashboard</h1>
        <div className="dashboard-grid">
          <div className="dashboard-card">
            <h3>Your Stories</h3>
            <p>You have 0 stories in progress</p>
            <button className="btn-primary" onClick={() => setCurrentPage('your-story')}>
              Start New Story
            </button>
          </div>
          <div className="dashboard-card">
            <h3>Published Books</h3>
            <p>You have 0 published books</p>
            <button className="btn-secondary">View Library</button>
          </div>
          <div className="dashboard-card">
            <h3>Account Settings</h3>
            <p>Manage your account preferences</p>
            <button className="btn-secondary">Settings</button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderYourStory = () => (
    <div className="your-story">
      <div className="container">
        <h1>Your Story</h1>
        <div className="story-interface">
          <div className="recording-section">
            <h2>Record Your Story</h2>
            <div className="recording-controls">
              <button className="btn-record">🎤 Start Recording</button>
              <button className="btn-secondary">📁 Upload Audio</button>
            </div>
            <div className="recording-status">
              <p>Ready to record your story...</p>
            </div>
          </div>
          <div className="story-preview">
            <h2>Story Preview</h2>
            <div className="preview-content">
              <p>Your AI-generated story will appear here as you record...</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderTerms = () => (
    <div className="legal-page">
      <div className="container">
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
          
          <h2>6. Payment Terms</h2>
          <p>Subscription fees are billed monthly or annually as selected. All payments are processed securely through Stripe.</p>
          
          <h2>7. Privacy and Data Protection</h2>
          <p>Your privacy is important to us. Please review our Privacy Policy for details on how we handle your data.</p>
          
          <h2>8. Limitation of Liability</h2>
          <p>Lifebooks AI shall not be liable for any indirect, incidental, special, consequential, or punitive damages.</p>
          
          <h2>9. Termination</h2>
          <p>Either party may terminate this agreement at any time. Upon termination, you retain access to your content and completed books.</p>
          
          <h2>10. Contact Information</h2>
          <p>For questions about these terms, please contact us at legal@lifebooks-ai.com</p>
        </div>
      </div>
    </div>
  );

  const renderPrivacy = () => (
    <div className="legal-page">
      <div className="container">
        <h1>Privacy Policy</h1>
        <div className="legal-content">
          <h2>1. Information We Collect</h2>
          <p>We collect personal information you provide, including name, email, and audio recordings of your stories.</p>
          
          <h2>2. How We Use Your Information</h2>
          <p>We use your information to provide AI processing services, create your books, and improve our platform.</p>
          
          <h2>3. Audio Recording Processing</h2>
          <p>Your audio recordings are processed using OpenAI's Whisper API for transcription and our AI models for story generation.</p>
          
          <h2>4. Data Storage and Security</h2>
          <p>Your data is stored securely using industry-standard encryption and security measures.</p>
          
          <h2>5. Third-Party Services</h2>
          <p>We integrate with OpenAI for AI processing, Stripe for payments, and Amazon KDP for publishing.</p>
          
          <h2>6. Data Sharing</h2>
          <p>We do not sell or share your personal stories with third parties except as necessary to provide our services.</p>
          
          <h2>7. Your Rights</h2>
          <p>You have the right to access, update, or delete your personal information at any time.</p>
          
          <h2>8. GDPR Compliance</h2>
          <p>For EU residents, we comply with GDPR requirements for data protection and privacy rights.</p>
          
          <h2>9. CCPA Compliance</h2>
          <p>For California residents, we comply with CCPA requirements for data privacy and consumer rights.</p>
          
          <h2>10. Contact Us</h2>
          <p>For privacy questions, contact us at privacy@lifebooks-ai.com</p>
        </div>
      </div>
    </div>
  );

  const renderLoginModal = () => (
    showLoginModal && (
      <div className="modal-overlay" onClick={() => setShowLoginModal(false)}>
        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <h2>Login to Lifebooks AI</h2>
            <button className="modal-close" onClick={() => setShowLoginModal(false)}>×</button>
          </div>
          <form onSubmit={handleLogin} className="auth-form">
            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                value={loginForm.email}
                onChange={(e) => setLoginForm({...loginForm, email: e.target.value})}
                required
              />
            </div>
            <div className="form-group">
              <label>Password</label>
              <input
                type="password"
                value={loginForm.password}
                onChange={(e) => setLoginForm({...loginForm, password: e.target.value})}
                required
              />
            </div>
            <button type="submit" className="btn-primary full-width">Login</button>
          </form>
          <p className="auth-switch">
            Don't have an account? 
            <button 
              className="link-button" 
              onClick={() => {
                setShowLoginModal(false);
                setShowSignupModal(true);
              }}
            >
              Sign up here
            </button>
          </p>
        </div>
      </div>
    )
  );

  const renderSignupModal = () => (
    showSignupModal && (
      <div className="modal-overlay" onClick={() => setShowSignupModal(false)}>
        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <h2>Sign Up for Lifebooks AI</h2>
            <button className="modal-close" onClick={() => setShowSignupModal(false)}>×</button>
          </div>
          <form onSubmit={handleSignup} className="auth-form">
            <div className="form-group">
              <label>Full Name</label>
              <input
                type="text"
                value={signupForm.name}
                onChange={(e) => setSignupForm({...signupForm, name: e.target.value})}
                required
              />
            </div>
            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                value={signupForm.email}
                onChange={(e) => setSignupForm({...signupForm, email: e.target.value})}
                required
              />
            </div>
            <div className="form-group">
              <label>Password</label>
              <input
                type="password"
                value={signupForm.password}
                onChange={(e) => setSignupForm({...signupForm, password: e.target.value})}
                required
              />
            </div>
            <button type="submit" className="btn-primary full-width">Sign Up</button>
          </form>
          <p className="auth-switch">
            Already have an account? 
            <button 
              className="link-button" 
              onClick={() => {
                setShowSignupModal(false);
                setShowLoginModal(true);
              }}
            >
              Login here
            </button>
          </p>
        </div>
      </div>
    )
  );

  const renderCurrentPage = () => {
    switch (currentPage) {
      case 'home':
        return renderHomePage();
      case 'dashboard':
        return renderDashboard();
      case 'your-story':
        return renderYourStory();
      case 'terms':
        return renderTerms();
      case 'privacy':
        return renderPrivacy();
      default:
        return renderHomePage();
    }
  };

  return (
    <div className="App">
      {renderNavigation()}
      <main className="main-content">
        {renderCurrentPage()}
      </main>
      {renderLoginModal()}
      {renderSignupModal()}
      <footer className="footer">
        <div className="container">
          <div className="footer-content">
            <div className="footer-section">
              <h3>Lifebooks AI</h3>
              <p>Transform your life stories into beautiful books with AI</p>
            </div>
            <div className="footer-section">
              <h4>Product</h4>
              <ul>
                <li><button className="link-button" onClick={() => setCurrentPage('home')}>Features</button></li>
                <li><button className="link-button" onClick={() => setCurrentPage('home')}>Pricing</button></li>
                <li><button className="link-button" onClick={() => setCurrentPage('your-story')}>Your Story</button></li>
              </ul>
            </div>
            <div className="footer-section">
              <h4>Legal</h4>
              <ul>
                <li><button className="link-button" onClick={() => setCurrentPage('terms')}>Terms & Conditions</button></li>
                <li><button className="link-button" onClick={() => setCurrentPage('privacy')}>Privacy Policy</button></li>
              </ul>
            </div>
            <div className="footer-section">
              <h4>Support</h4>
              <ul>
                <li><a href="mailto:support@lifebooks-ai.com">Contact Us</a></li>
                <li><a href="mailto:help@lifebooks-ai.com">Help Center</a></li>
              </ul>
            </div>
          </div>
          <div className="footer-bottom">
            <p>&copy; 2024 Lifebooks AI. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;

