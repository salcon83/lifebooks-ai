import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const Publishing = ({ user }) => {
  const navigate = useNavigate();
  const [publishingData, setPublishingData] = useState({
    storyId: '',
    title: '',
    description: '',
    category: 'biography',
    price: '9.99'
  });
  const [publishing, setPublishing] = useState(false);
  const [published, setPublished] = useState(false);

  const handlePublish = async () => {
    setPublishing(true);
    try {
      // Simulate publishing process
      await new Promise(resolve => setTimeout(resolve, 3000));
      setPublished(true);
    } catch (error) {
      console.error('Publishing failed:', error);
    } finally {
      setPublishing(false);
    }
  };

  return (
    <div className="publishing">
      <div className="publishing-header">
        <button onClick={() => navigate('/dashboard')} className="btn btn-secondary">
          ← Back to Dashboard
        </button>
        <h1>Publish to Amazon</h1>
      </div>

      <div className="publishing-content">
        {!published ? (
          <div className="publishing-form">
            <div className="form-section">
              <h2>Book Details</h2>
              
              <div className="form-group">
                <label className="form-label">Book Title</label>
                <input
                  type="text"
                  value={publishingData.title}
                  onChange={(e) => setPublishingData({ ...publishingData, title: e.target.value })}
                  className="form-input"
                  placeholder="Enter your book title"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea
                  value={publishingData.description}
                  onChange={(e) => setPublishingData({ ...publishingData, description: e.target.value })}
                  className="form-textarea"
                  placeholder="Write a compelling description for your book"
                  rows="4"
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Category</label>
                  <select
                    value={publishingData.category}
                    onChange={(e) => setPublishingData({ ...publishingData, category: e.target.value })}
                    className="form-input"
                  >
                    <option value="biography">Biography & Memoir</option>
                    <option value="family">Family & Relationships</option>
                    <option value="history">History</option>
                    <option value="self-help">Self-Help</option>
                    <option value="fiction">Fiction</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Price (USD)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={publishingData.price}
                    onChange={(e) => setPublishingData({ ...publishingData, price: e.target.value })}
                    className="form-input"
                    placeholder="9.99"
                  />
                </div>
              </div>
            </div>

            <div className="publishing-info">
              <h3>What happens next?</h3>
              <ul className="info-list">
                <li>✓ Your book will be submitted to Amazon KDP</li>
                <li>✓ Amazon will review your content (24-48 hours)</li>
                <li>✓ Once approved, your book will be available worldwide</li>
                <li>✓ You'll receive royalties from sales</li>
                <li>✓ We'll send you updates on the publishing status</li>
              </ul>
            </div>

            <div className="publishing-actions">
              <button
                onClick={handlePublish}
                className="btn btn-primary btn-lg"
                disabled={publishing || !publishingData.title}
              >
                {publishing ? 'Publishing to Amazon...' : 'Publish to Amazon KDP'}
              </button>
            </div>
          </div>
        ) : (
          <div className="publishing-success">
            <div className="success-icon">🎉</div>
            <h2>Successfully Submitted!</h2>
            <p>Your book "{publishingData.title}" has been submitted to Amazon KDP for review.</p>
            
            <div className="success-details">
              <div className="detail-item">
                <strong>Submission ID:</strong> AMZ-{Date.now()}
              </div>
              <div className="detail-item">
                <strong>Expected Review Time:</strong> 24-48 hours
              </div>
              <div className="detail-item">
                <strong>Status:</strong> Under Review
              </div>
            </div>

            <div className="success-actions">
              <button onClick={() => navigate('/dashboard')} className="btn btn-primary">
                Return to Dashboard
              </button>
              <button onClick={() => setPublished(false)} className="btn btn-secondary">
                Publish Another Book
              </button>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        .publishing {
          min-height: 100vh;
          background: #f8fafc;
          padding: 20px;
        }

        .publishing-header {
          display: flex;
          align-items: center;
          gap: 20px;
          margin-bottom: 40px;
          max-width: 800px;
          margin-left: auto;
          margin-right: auto;
        }

        .publishing-header h1 {
          font-size: 2rem;
          font-weight: 700;
          color: #1f2937;
        }

        .publishing-content {
          max-width: 800px;
          margin: 0 auto;
        }

        .publishing-form {
          background: white;
          border-radius: 12px;
          padding: 40px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
        }

        .form-section {
          margin-bottom: 40px;
        }

        .form-section h2 {
          font-size: 1.5rem;
          font-weight: 600;
          color: #1f2937;
          margin-bottom: 24px;
          padding-bottom: 12px;
          border-bottom: 2px solid #e5e7eb;
        }

        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
        }

        .publishing-info {
          background: #f0f9ff;
          border: 1px solid #bae6fd;
          border-radius: 8px;
          padding: 24px;
          margin-bottom: 30px;
        }

        .publishing-info h3 {
          font-size: 1.25rem;
          font-weight: 600;
          color: #0369a1;
          margin-bottom: 16px;
        }

        .info-list {
          list-style: none;
          padding: 0;
        }

        .info-list li {
          padding: 8px 0;
          color: #0c4a6e;
          font-size: 14px;
        }

        .publishing-actions {
          text-align: center;
        }

        .btn-lg {
          padding: 16px 32px;
          font-size: 18px;
        }

        .publishing-success {
          background: white;
          border-radius: 12px;
          padding: 60px 40px;
          text-align: center;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
        }

        .success-icon {
          font-size: 4rem;
          margin-bottom: 24px;
        }

        .publishing-success h2 {
          font-size: 2rem;
          font-weight: 700;
          color: #059669;
          margin-bottom: 16px;
        }

        .publishing-success p {
          font-size: 1.125rem;
          color: #374151;
          margin-bottom: 40px;
        }

        .success-details {
          background: #f0fdf4;
          border: 1px solid #bbf7d0;
          border-radius: 8px;
          padding: 24px;
          margin-bottom: 40px;
          text-align: left;
        }

        .detail-item {
          padding: 8px 0;
          border-bottom: 1px solid #dcfce7;
        }

        .detail-item:last-child {
          border-bottom: none;
        }

        .detail-item strong {
          color: #065f46;
          margin-right: 12px;
        }

        .success-actions {
          display: flex;
          gap: 16px;
          justify-content: center;
        }

        @media (max-width: 768px) {
          .form-row {
            grid-template-columns: 1fr;
          }

          .success-actions {
            flex-direction: column;
          }
        }
      `}</style>
    </div>
  );
};

export default Publishing;

