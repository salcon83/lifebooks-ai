import React from 'react';
import './App.css';

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <nav style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '1rem 2rem',
          backgroundColor: '#fff',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <div style={{
            fontSize: '1.5rem',
            fontWeight: 'bold',
            color: '#6366f1'
          }}>
            Lifebooks
          </div>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <a href="#" style={{ textDecoration: 'none', color: '#374151' }}>Home</a>
            <a href="/terms" style={{ textDecoration: 'none', color: '#374151' }}>Terms & Conditions</a>
            <a href="/privacy" style={{ textDecoration: 'none', color: '#374151' }}>Privacy Policy</a>
            <button style={{
              backgroundColor: '#6366f1',
              color: 'white',
              border: 'none',
              padding: '0.5rem 1rem',
              borderRadius: '0.375rem',
              cursor: 'pointer'
            }}>
              Get Started Free
            </button>
          </div>
        </nav>
      </header>

      <main>
        {/* Hero Section */}
        <section style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          padding: '4rem 2rem',
          textAlign: 'center'
        }}>
          <h1 style={{
            fontSize: '3rem',
            fontWeight: 'bold',
            marginBottom: '1rem',
            lineHeight: '1.2'
          }}>
            Transform Your Life Stories into Beautiful Books
          </h1>
          <p style={{
            fontSize: '1.25rem',
            marginBottom: '2rem',
            maxWidth: '600px',
            margin: '0 auto 2rem'
          }}>
            AI-powered personal storytelling platform that turns your voice recordings, 
            documents, and memories into professionally published books.
          </p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
            <button style={{
              backgroundColor: 'rgba(255,255,255,0.2)',
              color: 'white',
              border: '2px solid white',
              padding: '0.75rem 2rem',
              borderRadius: '0.375rem',
              fontSize: '1.1rem',
              cursor: 'pointer'
            }}>
              Start Your Story Today
            </button>
            <button style={{
              backgroundColor: 'white',
              color: '#6366f1',
              border: 'none',
              padding: '0.75rem 2rem',
              borderRadius: '0.375rem',
              fontSize: '1.1rem',
              cursor: 'pointer'
            }}>
              Sign In
            </button>
          </div>
        </section>

        {/* Features Section */}
        <section style={{ padding: '4rem 2rem', backgroundColor: '#f9fafb' }}>
          <h2 style={{
            fontSize: '2.5rem',
            textAlign: 'center',
            marginBottom: '3rem',
            color: '#1f2937'
          }}>
            Everything You Need to Create Your Book
          </h2>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '2rem',
            maxWidth: '1200px',
            margin: '0 auto'
          }}>
            <div style={{
              backgroundColor: 'white',
              padding: '2rem',
              borderRadius: '0.5rem',
              boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>ðŸŽ¤</div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1rem' }}>
                Voice Recording
              </h3>
              <p style={{ color: '#6b7280' }}>
                Record your stories naturally. Our AI transcribes and enhances your spoken words into polished text.
              </p>
            </div>

            <div style={{
              backgroundColor: 'white',
              padding: '2rem',
              borderRadius: '0.5rem',
              boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>ðŸŽ¨</div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1rem' }}>
                AI Book Covers
              </h3>
              <p style={{ color: '#6b7280' }}>
                Generate stunning, professional book covers that perfectly capture the essence of your story.
              </p>
            </div>

            <div style={{
              backgroundColor: 'white',
              padding: '2rem',
              borderRadius: '0.5rem',
              boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>ðŸ“š</div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1rem' }}>
                Amazon Publishing
              </h3>
              <p style={{ color: '#6b7280' }}>
                Publish directly to Amazon Kindle and print-on-demand with our integrated publishing workflow.
              </p>
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section style={{ padding: '4rem 2rem' }}>
          <h2 style={{
            fontSize: '2.5rem',
            textAlign: 'center',
            marginBottom: '3rem',
            color: '#1f2937'
          }}>
            Choose Your Plan
          </h2>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '2rem',
            maxWidth: '1000px',
            margin: '0 auto'
          }}>
            {/* Free Plan */}
            <div style={{
              backgroundColor: 'white',
              padding: '2rem',
              borderRadius: '0.5rem',
              boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
              border: '1px solid #e5e7eb'
            }}>
              <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem' }}>Free</h3>
              <div style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '1rem' }}>$0/month</div>
              <ul style={{ listStyle: 'none', padding: 0, marginBottom: '2rem' }}>
                <li style={{ marginBottom: '0.5rem' }}>âœ“ 1 Story</li>
                <li style={{ marginBottom: '0.5rem' }}>âœ“ Basic Voice Recording</li>
                <li style={{ marginBottom: '0.5rem' }}>âœ“ Simple Text Editor</li>
                <li style={{ marginBottom: '0.5rem' }}>âœ“ PDF Export</li>
              </ul>
              <button style={{
                width: '100%',
                backgroundColor: '#6366f1',
                color: 'white',
                border: 'none',
                padding: '0.75rem',
                borderRadius: '0.375rem',
                cursor: 'pointer'
              }}>
                Get Started
              </button>
            </div>

            {/* Pro Plan */}
            <div style={{
              backgroundColor: 'white',
              padding: '2rem',
              borderRadius: '0.5rem',
              boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
              border: '2px solid #6366f1',
              position: 'relative'
            }}>
              <div style={{
                position: 'absolute',
                top: '-10px',
                left: '50%',
                transform: 'translateX(-50%)',
                backgroundColor: '#6366f1',
                color: 'white',
                padding: '0.25rem 1rem',
                borderRadius: '1rem',
                fontSize: '0.875rem'
              }}>
                Most Popular
              </div>
              <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem' }}>Pro</h3>
              <div style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '1rem' }}>$19/month</div>
              <ul style={{ listStyle: 'none', padding: 0, marginBottom: '2rem' }}>
                <li style={{ marginBottom: '0.5rem' }}>âœ“ Unlimited Stories</li>
                <li style={{ marginBottom: '0.5rem' }}>âœ“ Advanced Voice Recording</li>
                <li style={{ marginBottom: '0.5rem' }}>âœ“ AI Text Enhancement</li>
                <li style={{ marginBottom: '0.5rem' }}>âœ“ AI Book Cover Generation</li>
                <li style={{ marginBottom: '0.5rem' }}>âœ“ Amazon KDP Publishing</li>
              </ul>
              <button style={{
                width: '100%',
                backgroundColor: '#6366f1',
                color: 'white',
                border: 'none',
                padding: '0.75rem',
                borderRadius: '0.375rem',
                cursor: 'pointer'
              }}>
                Start Pro Trial
              </button>
            </div>

            {/* Enterprise Plan */}
            <div style={{
              backgroundColor: 'white',
              padding: '2rem',
              borderRadius: '0.5rem',
              boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
              border: '1px solid #e5e7eb'
            }}>
              <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem' }}>Enterprise</h3>
              <div style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '1rem' }}>$99/month</div>
              <ul style={{ listStyle: 'none', padding: 0, marginBottom: '2rem' }}>
                <li style={{ marginBottom: '0.5rem' }}>âœ“ Everything in Pro</li>
                <li style={{ marginBottom: '0.5rem' }}>âœ“ Team Collaboration</li>
                <li style={{ marginBottom: '0.5rem' }}>âœ“ Custom Branding</li>
                <li style={{ marginBottom: '0.5rem' }}>âœ“ API Access</li>
                <li style={{ marginBottom: '0.5rem' }}>âœ“ Dedicated Support</li>
              </ul>
              <button style={{
                width: '100%',
                backgroundColor: '#6366f1',
                color: 'white',
                border: 'none',
                padding: '0.75rem',
                borderRadius: '0.375rem',
                cursor: 'pointer'
              }}>
                Contact Sales
              </button>
            </div>
          </div>
        </section>
      </main>

      <footer style={{
        backgroundColor: '#1f2937',
        color: 'white',
        padding: '2rem',
        textAlign: 'center'
      }}>
        <div style={{ marginBottom: '1rem' }}>
          <a href="/terms" style={{ color: '#9ca3af', textDecoration: 'none', marginRight: '2rem' }}>
            Terms & Conditions
          </a>
          <a href="/privacy" style={{ color: '#9ca3af', textDecoration: 'none' }}>
            Privacy Policy
          </a>
        </div>
        <p style={{ color: '#9ca3af' }}>
          Â© 2024 Lifebooks. All rights reserved.
        </p>
      </footer>
    </div>
  );
}

export default App;
