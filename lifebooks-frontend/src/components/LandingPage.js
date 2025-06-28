import React from 'react';

const LandingPage = ({ onNavigate }) => {
  return (
    <div className="landing-page">
      <div className="hero-section">
        <div className="hero-content">
          <div className="hero-text">
            <h1>Transform Your Life Stories into Beautiful Books with AI</h1>
            <p>
              Share your memories through voice recordings, document uploads, and direct writing. 
              Watch as our AI crafts them into professionally formatted books, ready for publishing on Amazon KDP.
            </p>
            <div className="hero-buttons">
              <button 
                className="cta-button primary"
                onClick={() => onNavigate('create-story')}
              >
                Start Your Story
              </button>
              <button 
                className="cta-button secondary"
                onClick={() => onNavigate('login')}
              >
                Login
              </button>
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
        </div>
      </div>

      <div className="features-section">
        <div className="container">
          <h2>How It Works</h2>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">🎤</div>
              <h3>Voice Recording</h3>
              <p>Simply speak your memories and experiences. Our Whisper AI technology captures every detail of your personal journey with perfect transcription.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">📄</div>
              <h3>Document Upload</h3>
              <p>Upload existing documents, letters, journals, or any written materials to incorporate into your story seamlessly.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🤖</div>
              <h3>AI Enhancement</h3>
              <p>Advanced AI technology transforms your content into beautifully written, coherent narratives with professional formatting.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🎨</div>
              <h3>Book Cover Creation</h3>
              <p>AI-generated book covers that perfectly capture the essence of your story, created before you export or publish.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">📖</div>
              <h3>Professional Formatting</h3>
              <p>Your stories are formatted into professional book layouts, ready for printing, PDF export, or digital publishing.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🚀</div>
              <h3>Amazon KDP Publishing</h3>
              <p>Seamlessly publish your completed book on Amazon Kindle Direct Publishing and share your story with the world.</p>
            </div>
          </div>
        </div>
      </div>

      <div className="pricing-section">
        <div className="container">
          <h2>Choose Your Plan</h2>
          <div className="pricing-grid">
            <div className="pricing-card">
              <h3>Basic</h3>
              <div className="price">$29/month</div>
              <ul>
                <li>✓ Up to 5 hours of voice recordings</li>
                <li>✓ Basic AI processing & enhancement</li>
                <li>✓ Document upload capability</li>
                <li>✓ PDF export functionality</li>
                <li>✓ Basic book cover generation</li>
                <li>✓ Email support</li>
              </ul>
              <button className="pricing-button">Get Started</button>
            </div>
            <div className="pricing-card featured">
              <div className="popular-badge">Most Popular</div>
              <h3>Pro</h3>
              <div className="price">$79/month</div>
              <ul>
                <li>✓ Up to 20 hours of voice recordings</li>
                <li>✓ Advanced AI processing & enhancement</li>
                <li>✓ Unlimited document uploads</li>
                <li>✓ Professional book formatting</li>
                <li>✓ Premium book cover generation</li>
                <li>✓ Amazon KDP integration</li>
                <li>✓ Priority support</li>
              </ul>
              <button className="pricing-button">Get Started</button>
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
              <button className="pricing-button">Contact Sales</button>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .landing-page {
          min-height: 100vh;
          background: linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%);
        }

        .hero-section {
          padding: 80px 20px;
          min-height: 80vh;
          display: flex;
          align-items: center;
        }

        .hero-content {
          max-width: 1200px;
          margin: 0 auto;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 60px;
          align-items: center;
        }

        .hero-text h1 {
          font-size: 3.5rem;
          font-weight: 700;
          color: white;
          margin-bottom: 24px;
          line-height: 1.2;
        }

        .hero-text p {
          font-size: 1.25rem;
          color: rgba(255, 255, 255, 0.9);
          margin-bottom: 40px;
          line-height: 1.6;
        }

        .hero-buttons {
          display: flex;
          gap: 20px;
        }

        .cta-button {
          padding: 16px 32px;
          border: none;
          border-radius: 8px;
          font-size: 1.1rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .cta-button.primary {
          background: white;
          color: #4F46E5;
        }

        .cta-button.primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
        }

        .cta-button.secondary {
          background: transparent;
          color: white;
          border: 2px solid white;
        }

        .cta-button.secondary:hover {
          background: white;
          color: #4F46E5;
        }

        .hero-image {
          display: flex;
          justify-content: center;
          align-items: center;
        }

        .book-mockup {
          perspective: 1000px;
        }

        .book-cover {
          width: 300px;
          height: 400px;
          background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%);
          border-radius: 8px;
          padding: 40px 30px;
          color: white;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          text-align: center;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
          transform: rotateY(-15deg) rotateX(5deg);
          transition: transform 0.3s ease;
        }

        .book-cover:hover {
          transform: rotateY(-10deg) rotateX(2deg);
        }

        .book-cover h3 {
          font-size: 2rem;
          font-weight: 700;
          margin-bottom: 20px;
        }

        .book-cover p {
          font-size: 1.2rem;
          opacity: 0.8;
        }

        .features-section {
          background: white;
          padding: 100px 20px;
        }

        .container {
          max-width: 1200px;
          margin: 0 auto;
        }

        .features-section h2 {
          text-align: center;
          font-size: 2.5rem;
          font-weight: 700;
          color: #1f2937;
          margin-bottom: 60px;
        }

        .features-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
          gap: 40px;
        }

        .feature-card {
          text-align: center;
          padding: 40px 20px;
        }

        .feature-icon {
          font-size: 3rem;
          margin-bottom: 20px;
        }

        .feature-card h3 {
          font-size: 1.5rem;
          font-weight: 600;
          color: #1f2937;
          margin-bottom: 16px;
        }

        .feature-card p {
          color: #6b7280;
          line-height: 1.6;
        }

        .pricing-section {
          background: #f8fafc;
          padding: 100px 20px;
        }

        .pricing-section h2 {
          text-align: center;
          font-size: 2.5rem;
          font-weight: 700;
          color: #1f2937;
          margin-bottom: 60px;
        }

        .pricing-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 30px;
          max-width: 1000px;
          margin: 0 auto;
        }

        .pricing-card {
          background: white;
          border-radius: 12px;
          padding: 40px 30px;
          text-align: center;
          border: 2px solid #e5e7eb;
          position: relative;
          transition: all 0.3s ease;
        }

        .pricing-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
        }

        .pricing-card.featured {
          border-color: #3b82f6;
          transform: scale(1.05);
        }

        .popular-badge {
          position: absolute;
          top: -12px;
          left: 50%;
          transform: translateX(-50%);
          background: #3b82f6;
          color: white;
          padding: 6px 20px;
          border-radius: 20px;
          font-size: 0.875rem;
          font-weight: 600;
        }

        .pricing-card h3 {
          font-size: 1.5rem;
          font-weight: 600;
          color: #1f2937;
          margin-bottom: 16px;
        }

        .price {
          font-size: 2.5rem;
          font-weight: 700;
          color: #3b82f6;
          margin-bottom: 30px;
        }

        .pricing-card ul {
          list-style: none;
          padding: 0;
          margin-bottom: 40px;
        }

        .pricing-card li {
          padding: 8px 0;
          color: #6b7280;
        }

        .pricing-button {
          width: 100%;
          padding: 16px;
          background: #3b82f6;
          color: white;
          border: none;
          border-radius: 8px;
          font-size: 1.1rem;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.3s ease;
        }

        .pricing-button:hover {
          background: #2563eb;
        }

        @media (max-width: 768px) {
          .hero-content {
            grid-template-columns: 1fr;
            text-align: center;
          }

          .hero-text h1 {
            font-size: 2.5rem;
          }

          .hero-buttons {
            justify-content: center;
          }

          .features-grid {
            grid-template-columns: 1fr;
          }

          .pricing-card.featured {
            transform: none;
          }
        }
      `}</style>
    </div>
  );
};

export default LandingPage;

