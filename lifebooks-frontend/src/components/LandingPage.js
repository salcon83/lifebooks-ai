import React from 'react';
import { Link } from 'react-router-dom';

const LandingPage = () => {
  return (
    <div className="landing-page">
      {/* Navigation */}
      <nav className="navbar">
        <div className="navbar-container">
          <Link to="/" className="navbar-brand">
            Lifebooks
          </Link>
          <div className="navbar-nav">
            <Link to="/login" className="nav-link">Login</Link>
            <Link to="/register" className="btn btn-primary">Get Started Free</Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="hero">
        <div className="container text-center">
          <h1 className="hero-title">
            Transform Your Life Stories into Beautiful Books
          </h1>
          <p className="hero-subtitle">
            AI-powered personal storytelling platform that turns your voice recordings, 
            documents, and memories into professionally published books.
          </p>
          <div className="hero-actions">
            <Link to="/register" className="btn btn-primary btn-lg">
              Start Your Story Today
            </Link>
            <Link to="/login" className="btn btn-secondary btn-lg">
              Sign In
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features">
        <div className="container">
          <h2 className="section-title text-center">
            Everything You Need to Create Your Book
          </h2>
          <div className="grid grid-3">
            <div className="feature-card">
              <div className="feature-icon">🎤</div>
              <h3>Voice Recording</h3>
              <p>Record your stories naturally. Our AI transcribes and enhances your spoken words into polished text.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🎨</div>
              <h3>AI Book Covers</h3>
              <p>Generate stunning, professional book covers that perfectly capture the essence of your story.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">📚</div>
              <h3>Amazon Publishing</h3>
              <p>Publish directly to Amazon Kindle and print-on-demand with our integrated publishing workflow.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">📄</div>
              <h3>Document Upload</h3>
              <p>Import existing documents, photos, and text to build comprehensive life stories.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">✨</div>
              <h3>AI Enhancement</h3>
              <p>Improve your writing with AI-powered suggestions for style, grammar, and narrative flow.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">💾</div>
              <h3>PDF Export</h3>
              <p>Download your completed books as high-quality PDFs for printing or digital sharing.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="pricing">
        <div className="container">
          <h2 className="section-title text-center">
            Choose Your Plan
          </h2>
          <div className="grid grid-3">
            <div className="pricing-card">
              <h3>Free</h3>
              <div className="price">$0<span>/month</span></div>
              <ul className="features-list">
                <li>✓ 1 Story</li>
                <li>✓ Basic Voice Recording</li>
                <li>✓ Simple Text Editor</li>
                <li>✓ PDF Export</li>
                <li>✗ AI Enhancement</li>
                <li>✗ Book Covers</li>
                <li>✗ Amazon Publishing</li>
              </ul>
              <Link to="/register" className="btn btn-secondary btn-full">
                Get Started
              </Link>
            </div>
            <div className="pricing-card featured">
              <div className="popular-badge">Most Popular</div>
              <h3>Pro</h3>
              <div className="price">$19<span>/month</span></div>
              <ul className="features-list">
                <li>✓ Unlimited Stories</li>
                <li>✓ Advanced Voice Recording</li>
                <li>✓ AI Text Enhancement</li>
                <li>✓ AI Book Cover Generation</li>
                <li>✓ Amazon KDP Publishing</li>
                <li>✓ PDF & Kindle Export</li>
                <li>✓ Priority Support</li>
              </ul>
              <Link to="/register" className="btn btn-primary btn-full">
                Start Pro Trial
              </Link>
            </div>
            <div className="pricing-card">
              <h3>Enterprise</h3>
              <div className="price">$99<span>/month</span></div>
              <ul className="features-list">
                <li>✓ Everything in Pro</li>
                <li>✓ Team Collaboration</li>
                <li>✓ Custom Branding</li>
                <li>✓ API Access</li>
                <li>✓ Dedicated Support</li>
                <li>✓ Custom Integrations</li>
                <li>✓ White-label Solution</li>
              </ul>
              <Link to="/register" className="btn btn-secondary btn-full">
                Contact Sales
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="testimonials">
        <div className="container">
          <h2 className="section-title text-center">
            What Our Authors Say
          </h2>
          <div className="grid grid-2">
            <div className="testimonial-card">
              <p>"Lifebooks helped me turn 40 years of family stories into a beautiful book that my grandchildren will treasure forever."</p>
              <div className="testimonial-author">
                <strong>Sarah Johnson</strong>
                <span>Family Historian</span>
              </div>
            </div>
            <div className="testimonial-card">
              <p>"The AI transcription is incredibly accurate, and the book cover generator created something better than I could have imagined."</p>
              <div className="testimonial-author">
                <strong>Michael Chen</strong>
                <span>Memoir Author</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="container">
          <div className="footer-content">
            <div className="footer-brand">
              <h3>Lifebooks</h3>
              <p>Transform your stories into beautiful books with AI-powered tools.</p>
            </div>
            <div className="footer-links">
              <div className="footer-column">
                <h4>Product</h4>
                <a href="#features">Features</a>
                <a href="#pricing">Pricing</a>
                <a href="#support">Support</a>
              </div>
              <div className="footer-column">
                <h4>Company</h4>
                <a href="#about">About</a>
                <a href="#contact">Contact</a>
                <a href="#privacy">Privacy</a>
              </div>
            </div>
          </div>
          <div className="footer-bottom">
            <p>&copy; 2024 Lifebooks. All rights reserved.</p>
          </div>
        </div>
      </footer>

      <style jsx>{`
        .landing-page {
          min-height: 100vh;
        }

        .hero {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 100px 0;
          text-align: center;
        }

        .hero-title {
          font-size: 3.5rem;
          font-weight: 700;
          margin-bottom: 24px;
          line-height: 1.2;
        }

        .hero-subtitle {
          font-size: 1.25rem;
          margin-bottom: 40px;
          opacity: 0.9;
          max-width: 600px;
          margin-left: auto;
          margin-right: auto;
        }

        .hero-actions {
          display: flex;
          gap: 20px;
          justify-content: center;
          flex-wrap: wrap;
        }

        .btn-lg {
          padding: 16px 32px;
          font-size: 18px;
        }

        .features {
          padding: 100px 0;
          background: #f8fafc;
        }

        .section-title {
          font-size: 2.5rem;
          font-weight: 700;
          margin-bottom: 60px;
          color: #1f2937;
        }

        .feature-card {
          background: white;
          padding: 40px 30px;
          border-radius: 12px;
          text-align: center;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
          transition: transform 0.3s ease;
        }

        .feature-card:hover {
          transform: translateY(-5px);
        }

        .feature-icon {
          font-size: 3rem;
          margin-bottom: 20px;
        }

        .feature-card h3 {
          font-size: 1.5rem;
          font-weight: 600;
          margin-bottom: 16px;
          color: #1f2937;
        }

        .feature-card p {
          color: #6b7280;
          line-height: 1.6;
        }

        .pricing {
          padding: 100px 0;
          background: white;
        }

        .pricing-card {
          background: #f8fafc;
          padding: 40px 30px;
          border-radius: 12px;
          text-align: center;
          position: relative;
          border: 2px solid #e5e7eb;
          transition: transform 0.3s ease;
        }

        .pricing-card:hover {
          transform: translateY(-5px);
        }

        .pricing-card.featured {
          background: white;
          border-color: #667eea;
          transform: scale(1.05);
        }

        .popular-badge {
          position: absolute;
          top: -12px;
          left: 50%;
          transform: translateX(-50%);
          background: #667eea;
          color: white;
          padding: 6px 20px;
          border-radius: 20px;
          font-size: 14px;
          font-weight: 600;
        }

        .pricing-card h3 {
          font-size: 1.5rem;
          font-weight: 600;
          margin-bottom: 16px;
          color: #1f2937;
        }

        .price {
          font-size: 3rem;
          font-weight: 700;
          color: #667eea;
          margin-bottom: 30px;
        }

        .price span {
          font-size: 1rem;
          color: #6b7280;
        }

        .features-list {
          list-style: none;
          margin-bottom: 30px;
          text-align: left;
        }

        .features-list li {
          padding: 8px 0;
          color: #374151;
        }

        .btn-full {
          width: 100%;
        }

        .testimonials {
          padding: 100px 0;
          background: #f8fafc;
        }

        .testimonial-card {
          background: white;
          padding: 40px;
          border-radius: 12px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
        }

        .testimonial-card p {
          font-size: 1.125rem;
          line-height: 1.6;
          margin-bottom: 24px;
          color: #374151;
          font-style: italic;
        }

        .testimonial-author strong {
          display: block;
          color: #1f2937;
          margin-bottom: 4px;
        }

        .testimonial-author span {
          color: #6b7280;
          font-size: 14px;
        }

        .footer {
          background: #1f2937;
          color: white;
          padding: 60px 0 20px;
        }

        .footer-content {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 60px;
          margin-bottom: 40px;
        }

        .footer-brand h3 {
          font-size: 1.5rem;
          margin-bottom: 16px;
          color: #667eea;
        }

        .footer-brand p {
          color: #9ca3af;
          line-height: 1.6;
        }

        .footer-links {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 40px;
        }

        .footer-column h4 {
          margin-bottom: 16px;
          color: white;
        }

        .footer-column a {
          display: block;
          color: #9ca3af;
          text-decoration: none;
          margin-bottom: 8px;
          transition: color 0.3s ease;
        }

        .footer-column a:hover {
          color: #667eea;
        }

        .footer-bottom {
          border-top: 1px solid #374151;
          padding-top: 20px;
          text-align: center;
          color: #9ca3af;
        }

        @media (max-width: 768px) {
          .hero-title {
            font-size: 2.5rem;
          }

          .hero-actions {
            flex-direction: column;
            align-items: center;
          }

          .footer-content {
            grid-template-columns: 1fr;
            gap: 40px;
          }

          .footer-links {
            grid-template-columns: 1fr;
            gap: 30px;
          }
        }
      `}</style>
    </div>
  );
};

export default LandingPage;

