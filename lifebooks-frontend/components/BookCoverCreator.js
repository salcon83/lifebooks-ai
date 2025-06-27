import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const BookCoverCreator = ({ user }) => {
  const navigate = useNavigate();
  const [coverData, setCoverData] = useState({
    title: '',
    author: user.name || '',
    style: 'modern'
  });
  const [generatedCover, setGeneratedCover] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    setLoading(true);
    try {
      // Simulate cover generation
      await new Promise(resolve => setTimeout(resolve, 3000));
      setGeneratedCover({
        url: '/api/placeholder-cover.jpg',
        style: coverData.style,
        title: coverData.title
      });
    } catch (error) {
      console.error('Cover generation failed:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="cover-creator">
      <div className="creator-header">
        <button onClick={() => navigate('/dashboard')} className="btn btn-secondary">
          ← Back to Dashboard
        </button>
        <h1>Book Cover Creator</h1>
      </div>

      <div className="creator-content">
        <div className="creator-form">
          <div className="form-group">
            <label className="form-label">Book Title</label>
            <input
              type="text"
              value={coverData.title}
              onChange={(e) => setCoverData({ ...coverData, title: e.target.value })}
              className="form-input"
              placeholder="Enter your book title"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Author Name</label>
            <input
              type="text"
              value={coverData.author}
              onChange={(e) => setCoverData({ ...coverData, author: e.target.value })}
              className="form-input"
              placeholder="Enter author name"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Cover Style</label>
            <select
              value={coverData.style}
              onChange={(e) => setCoverData({ ...coverData, style: e.target.value })}
              className="form-input"
            >
              <option value="modern">Modern</option>
              <option value="classic">Classic</option>
              <option value="minimalist">Minimalist</option>
              <option value="vintage">Vintage</option>
              <option value="artistic">Artistic</option>
            </select>
          </div>

          <button
            onClick={handleGenerate}
            className="btn btn-primary btn-full"
            disabled={loading || !coverData.title}
          >
            {loading ? 'Generating Cover...' : 'Generate Cover'}
          </button>
        </div>

        <div className="cover-preview">
          {loading ? (
            <div className="preview-loading">
              <div className="loading-spinner"></div>
              <p>Creating your book cover...</p>
              <p className="loading-detail">This may take a few moments</p>
            </div>
          ) : generatedCover ? (
            <div className="preview-result">
              <div className="cover-mockup">
                <div className="cover-placeholder">
                  <h3>{coverData.title}</h3>
                  <p>by {coverData.author}</p>
                  <div className="style-indicator">{coverData.style} style</div>
                </div>
              </div>
              <div className="cover-actions">
                <button className="btn btn-primary">Download Cover</button>
                <button className="btn btn-secondary">Generate Another</button>
              </div>
            </div>
          ) : (
            <div className="preview-placeholder">
              <div className="placeholder-icon">🎨</div>
              <h3>Your Cover Preview</h3>
              <p>Fill in the details and click "Generate Cover" to see your book cover</p>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        .cover-creator {
          min-height: 100vh;
          background: #f8fafc;
          padding: 20px;
        }

        .creator-header {
          display: flex;
          align-items: center;
          gap: 20px;
          margin-bottom: 40px;
          max-width: 1000px;
          margin-left: auto;
          margin-right: auto;
        }

        .creator-header h1 {
          font-size: 2rem;
          font-weight: 700;
          color: #1f2937;
        }

        .creator-content {
          max-width: 1000px;
          margin: 0 auto;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 40px;
        }

        .creator-form {
          background: white;
          border-radius: 12px;
          padding: 30px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
          height: fit-content;
        }

        .cover-preview {
          background: white;
          border-radius: 12px;
          padding: 30px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 400px;
        }

        .preview-placeholder {
          text-align: center;
          color: #6b7280;
        }

        .placeholder-icon {
          font-size: 4rem;
          margin-bottom: 20px;
        }

        .preview-placeholder h3 {
          font-size: 1.5rem;
          font-weight: 600;
          margin-bottom: 12px;
          color: #374151;
        }

        .preview-loading {
          text-align: center;
        }

        .loading-detail {
          font-size: 14px;
          color: #6b7280;
          margin-top: 8px;
        }

        .preview-result {
          text-align: center;
          width: 100%;
        }

        .cover-mockup {
          margin-bottom: 30px;
        }

        .cover-placeholder {
          width: 200px;
          height: 300px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border-radius: 8px;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          text-align: center;
          padding: 20px;
          margin: 0 auto;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
        }

        .cover-placeholder h3 {
          font-size: 1.25rem;
          font-weight: 700;
          margin-bottom: 20px;
          line-height: 1.2;
        }

        .cover-placeholder p {
          font-size: 14px;
          margin-bottom: 20px;
          opacity: 0.9;
        }

        .style-indicator {
          font-size: 12px;
          background: rgba(255, 255, 255, 0.2);
          padding: 4px 8px;
          border-radius: 4px;
          text-transform: capitalize;
        }

        .cover-actions {
          display: flex;
          gap: 12px;
          justify-content: center;
        }

        @media (max-width: 768px) {
          .creator-content {
            grid-template-columns: 1fr;
            gap: 30px;
          }

          .cover-actions {
            flex-direction: column;
          }
        }
      `}</style>
    </div>
  );
};

export default BookCoverCreator;

