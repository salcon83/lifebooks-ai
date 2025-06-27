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

  // Password protection - NO HINT SHOWN
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

  // Site password protection screen - NO PASSWORD HINT
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
              
              <h2>6. Data Privacy</h2>
              <p>We implement industry-standard security measures to protect your personal information and stories. Your data is never shared with third parties without explicit consent.</p>
              
              <h2>7. Service Availability</h2>
              <p>We strive to maintain 99.9% uptime but cannot guarantee uninterrupted service. Scheduled maintenance will be announced in advance.</p>
              
              <h2>8. Payment Terms</h2>
              <p>Subscription fees are billed monthly or annually as selected. Refunds are available within 30 days of purchase for unused services.</p>
              
              <h2>9. Limitation of Liability</h2>
              <p>Our liability is limited to the amount paid for services. We are not responsible for indirect or consequential damages.</p>
              
              <h2>10. Termination</h2>
              <p>Either party may terminate this agreement at any time. Upon termination, you retain access to your created content for download.</p>
            </div>
          </div>
        );
      case 'privacy':
        return (
          <div className="legal-page">
            <h1>Privacy Policy</h1>
            <div className="legal-content">
              <h2>1. Information We Collect</h2>
              <p>We collect audio recordings, personal stories, account information, and usage data to provide our AI processing services and create your personalized books.</p>
              
              <h2>2. How We Use Your Information</h2>
              <p>Your information is used solely to provide our AI processing services, create your personalized books, improve our services, and communicate with you about your account.</p>
              
              <h2>3. Data Security</h2>
              <p>We implement industry-standard security measures including encryption, secure servers, and regular security audits to protect your personal information and stories.</p>
              
              <h2>4. Data Sharing</h2>
              <p>We do not share your personal stories or content with third parties without your explicit consent. We may share aggregated, anonymized data for research purposes.</p>
              
              <h2>5. Your Rights</h2>
              <p>You have the right to access, modify, or delete your personal information at any time. You can also request a copy of all data we have about you.</p>
              
              <h2>6. Cookies and Tracking</h2>
              <p>We use cookies to improve your experience and remember your preferences. You can disable cookies in your browser settings.</p>
              
              <h2>7. Third-Party Services</h2>
              <p>We use trusted third-party services for payment processing and hosting. These services have their own privacy policies and security measures.</p>
              
              <h2>8. Data Retention</h2>
              <p>We retain your data for as long as your account is active or as needed to provide services. You can request deletion at any time.</p>
              
              <h2>9. International Transfers</h2>
              <p>Your data may be processed in countries other than your own. We ensure appropriate safeguards are in place for international transfers.</p>
              
              <h2>10. Contact Us</h2>
              <p>If you have questions about this privacy policy, please contact us at privacy@lifebooks.ai or through our support system.</p>
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
                <h3>🎤 Voice Recordings</h3>
                <p>0 hours recorded</p>
                <button>Start Recording</button>
              </div>
              <div className="dashboard-card">
                <h3>📄 Document Uploads</h3>
                <p>0 documents uploaded</p>
                <button>Upload Documents</button>
              </div>
              <div className="dashboard-card">
                <h3>🎨 Book Covers</h3>
                <p>0 covers generated</p>
                <button>Create Cover</button>
              </div>
              <div className="dashboard-card">
                <h3>📖 Published Books</h3>
                <p>0 books published</p>
                <button>View Gallery</button>
              </div>
              <div className="dashboard-card">
                <h3>🚀 Amazon KDP</h3>
                <p>Ready to publish</p>
                <button>Connect KDP</button>
              </div>
            </div>
          </div>
        );
      case 'story':
        return (
          <div className="story-page">
            <h1>Your Story</h1>
            <div className="story-content">
              <div className="story-section">
                <h2>📝 Story Builder</h2>
                <p>Create your life story using voice recordings, written documents, or direct text input.</p>
                <div className="story-tools">
                  <button className="tool-button">🎤 Voice Recording</button>
                  <button className="tool-button">📄 Upload Documents</button>
                  <button className="tool-button">✏️ Write Directly</button>
                </div>
              </div>
              <div className="story-section">
                <h2>🤖 AI Enhancement</h2>
                <p>Our AI will help enhance your story with professional writing and formatting.</p>
                <div className="ai-features">
                  <div className="feature-item">✨ Grammar & Style Enhancement</div>
                  <div className="feature-item">📖 Chapter Organization</div>
                  <div className="feature-item">🎯 Narrative Flow Improvement</div>
                </div>
              </div>
              <div className="story-section">
                <h2>🎨 Book Creation</h2>
                <p>Transform your story into a beautiful book ready for publishing.</p>
                <div className="book-options">
                  <button className="book-button">Create Book Cover</button>
                  <button className="book-button">Format for Print</button>
                  <button className="book-button">Export to PDF</button>
                  <button className="book-button">Publish to Kindle</button>
                </div>
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
                <p>Share your memories through voice recordings, document uploads, and direct writing. Watch as our AI crafts them into professionally formatted books, ready for publishing on Amazon KDP.</p>
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
                  <p>Simply speak your memories and experiences. Our Whisper AI technology captures every detail of your personal journey with perfect transcription.</p>
                </div>
                <div className="feature">
                  <div className="feature-icon">📄</div>
                  <h3>Document Upload</h3>
                  <p>Upload existing documents, letters, journals, or any written materials to incorporate into your story seamlessly.</p>
                </div>
                <div className="feature">
                  <div className="feature-icon">🤖</div>
                  <h3>AI Enhancement</h3>
                  <p>Advanced AI technology transforms your content into beautifully written, coherent narratives with professional formatting.</p>
                </div>
                <div className="feature">
                  <div className="feature-icon">🎨</div>
                  <h3>Book Cover Creation</h3>
                  <p>AI-generated book covers that perfectly capture the essence of your story, created before you export or publish.</p>
                </div>
                <div className="feature">
                  <div className="feature-icon">📖</div>
                  <h3>Professional Formatting</h3>
                  <p>Your stories are formatted into professional book layouts, ready for printing, PDF export, or digital publishing.</p>
                </div>
                <div className="feature">
                  <div className="feature-icon">🚀</div>
                  <h3>Amazon KDP Integration</h3>
                  <p>Seamlessly publish your completed book on Amazon Kindle Direct Publishing and share your story with the world.</p>
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
                    <li>✓ Up to 5 hours of voice recordings</li>
                    <li>✓ Basic AI processing & enhancement</li>
                    <li>✓ Document upload capability</li>
                    <li>✓ PDF export functionality</li>
                    <li>✓ Basic book cover generation</li>
                    <li>✓ Email support</li>
                  </ul>
                  <button onClick={() => setShowSignup(true)}>Get Started</button>
                </div>
                <div className="pricing-card featured">
                  <h3>Professional</h3>
                  <div className="price">$79/month</div>
                  <div className="badge">Most Popular</div>
                  <ul>
                    <li>✓ Up to 20 hours of voice recordings</li>
                    <li>✓ Advanced AI processing & enhancement</li>
                    <li>✓ Unlimited document uploads</li>
                    <li>✓ Professional book formatting</li>
                    <li>✓ Premium book cover generation</li>
                    <li>✓ Amazon KDP integration</li>
                    <li>✓ Priority support</li>
                  </ul>
                  <button onClick={() => setShowSignup(true)}>Get Started</button>
                </div>
                <div className="pricing-card">
                  <h3>Enterprise</h3>
                  <div className="price">$199/month</div>
                  <ul>
                    <li>✓ Unlimited voice recordings</li>
                    <li>✓ Premium AI processing & enhancement</li>
                    <li>✓ Unlimited document uploads</li>
                    <li>✓ Custom book formatting options</li>
                    <li>✓ Custom book cover designs</li>
                    <li>✓ Full publishing support</li>
                    <li>✓ Dedicated account manager</li>
                    <li>✓ API access for integrations</li>
                  </ul>
                  <button onClick={() => setShowSignup(true)}>Contact Sales</button>
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
            className={currentPage === 'story' ? 'active' : ''} 
            onClick={() => setCurrentPage('story')}
          >
            Your Story
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

