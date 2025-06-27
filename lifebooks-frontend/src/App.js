import React, { useState, useEffect } from 'react';
import './App.css';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');

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
          <p style={{marginTop: '20px', fontSize: '0.9rem', color: '#666'}}>
            Hint: The password is "lifebooks2024"
          </p>
        </div>
      </div>
    );
  }

  // Main website content (simplified version)
  return (
    <div className="App">
      <nav className="navbar">
        <div className="nav-brand">
          <h2>Lifebooks AI</h2>
        </div>
        <div className="nav-links">
          <button onClick={handleLogout} className="logout-btn">🔒 Logout</button>
        </div>
      </nav>

      <main>
        <section className="hero">
          <div className="hero-content">
            <h1>Transform Your Life Stories into Beautiful Books with AI</h1>
            <p>Share your memories through voice recordings and watch as our AI crafts them into professionally formatted books, ready for publishing on Amazon KDP.</p>
            <div className="hero-buttons">
              <button className="cta-button">Start Your Story</button>
              <button className="secondary-button">Learn More</button>
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
              <h3>AI Processing</h3>
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
      </main>
    </div>
  );
}

export default App;

