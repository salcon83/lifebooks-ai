import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

const Dashboard = ({ user, onLogout }) => {
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchStories();
  }, []);

  const fetchStories = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/stories', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStories(response.data.stories);
    } catch (error) {
      setError('Failed to load stories');
    } finally {
      setLoading(false);
    }
  };

  const createNewStory = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post('/api/stories', 
        { title: 'New Story' },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setStories([response.data.story, ...stories]);
    } catch (error) {
      setError('Failed to create story');
    }
  };

  return (
    <div className="dashboard">
      {/* Navigation */}
      <nav className="navbar">
        <div className="navbar-container">
          <Link to="/dashboard" className="navbar-brand">
            Lifebooks
          </Link>
          <div className="navbar-nav">
            <span className="nav-user">Welcome, {user.name || user.email}</span>
            <button onClick={onLogout} className="btn btn-secondary">
              Logout
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="dashboard-content">
        <div className="container">
          {/* Header */}
          <div className="dashboard-header">
            <h1>Your Stories</h1>
            <p>Create, edit, and publish your life stories</p>
          </div>

          {/* Quick Actions */}
          <div className="quick-actions">
            <div className="grid grid-2">
              <div className="action-card" onClick={createNewStory}>
                <div className="action-icon">📝</div>
                <h3>Create New Story</h3>
                <p>Start writing your next chapter</p>
              </div>
              <Link to="/voice" className="action-card">
                <div className="action-icon">🎤</div>
                <h3>Voice Recording</h3>
                <p>Record and transcribe your stories</p>
              </Link>
              <Link to="/covers" className="action-card">
                <div className="action-icon">🎨</div>
                <h3>Create Book Cover</h3>
                <p>Design beautiful covers with AI</p>
              </Link>
              <Link to="/publish" className="action-card">
                <div className="action-icon">📚</div>
                <h3>Publish to Amazon</h3>
                <p>Share your stories with the world</p>
              </Link>
            </div>
          </div>

          {/* Stories List */}
          <div className="stories-section">
            <div className="section-header">
              <h2>Recent Stories</h2>
              <button onClick={createNewStory} className="btn btn-primary">
                New Story
              </button>
            </div>

            {loading ? (
              <div className="loading-state">
                <div className="loading-spinner"></div>
                <p>Loading your stories...</p>
              </div>
            ) : error ? (
              <div className="error-state">
                <p>{error}</p>
                <button onClick={fetchStories} className="btn btn-secondary">
                  Try Again
                </button>
              </div>
            ) : stories.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">📖</div>
                <h3>No stories yet</h3>
                <p>Create your first story to get started</p>
                <button onClick={createNewStory} className="btn btn-primary">
                  Create Your First Story
                </button>
              </div>
            ) : (
              <div className="stories-grid">
                {stories.map((story) => (
                  <Link
                    key={story.id}
                    to={`/story/${story.id}`}
                    className="story-card"
                  >
                    <h3>{story.title}</h3>
                    <p className="story-preview">
                      {story.content ? 
                        story.content.substring(0, 150) + '...' : 
                        'No content yet. Click to start writing.'
                      }
                    </p>
                    <div className="story-meta">
                      <span>Last updated: {new Date(story.updated_at).toLocaleDateString()}</span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <style jsx>{`
        .dashboard {
          min-height: 100vh;
          background: #f8fafc;
        }

        .dashboard-content {
          padding: 40px 0;
        }

        .dashboard-header {
          text-align: center;
          margin-bottom: 60px;
        }

        .dashboard-header h1 {
          font-size: 3rem;
          font-weight: 700;
          color: #1f2937;
          margin-bottom: 16px;
        }

        .dashboard-header p {
          font-size: 1.25rem;
          color: #6b7280;
        }

        .nav-user {
          color: #475569;
          margin-right: 20px;
        }

        .quick-actions {
          margin-bottom: 60px;
        }

        .action-card {
          background: white;
          padding: 30px;
          border-radius: 12px;
          text-align: center;
          cursor: pointer;
          transition: all 0.3s ease;
          border: 2px solid #e5e7eb;
          text-decoration: none;
          color: inherit;
          display: block;
        }

        .action-card:hover {
          transform: translateY(-5px);
          border-color: #667eea;
          box-shadow: 0 10px 25px rgba(102, 126, 234, 0.15);
        }

        .action-icon {
          font-size: 3rem;
          margin-bottom: 20px;
        }

        .action-card h3 {
          font-size: 1.5rem;
          font-weight: 600;
          margin-bottom: 12px;
          color: #1f2937;
        }

        .action-card p {
          color: #6b7280;
          line-height: 1.5;
        }

        .stories-section {
          margin-top: 60px;
        }

        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 30px;
        }

        .section-header h2 {
          font-size: 2rem;
          font-weight: 600;
          color: #1f2937;
        }

        .loading-state,
        .error-state,
        .empty-state {
          text-align: center;
          padding: 60px 20px;
          background: white;
          border-radius: 12px;
          border: 2px dashed #e5e7eb;
        }

        .empty-icon {
          font-size: 4rem;
          margin-bottom: 20px;
        }

        .empty-state h3 {
          font-size: 1.5rem;
          font-weight: 600;
          color: #1f2937;
          margin-bottom: 12px;
        }

        .empty-state p {
          color: #6b7280;
          margin-bottom: 30px;
        }

        .stories-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 24px;
        }

        .story-card {
          background: white;
          padding: 24px;
          border-radius: 12px;
          border: 1px solid #e5e7eb;
          transition: all 0.3s ease;
          text-decoration: none;
          color: inherit;
          display: block;
        }

        .story-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
          border-color: #667eea;
        }

        .story-card h3 {
          font-size: 1.25rem;
          font-weight: 600;
          color: #1f2937;
          margin-bottom: 12px;
        }

        .story-preview {
          color: #6b7280;
          line-height: 1.6;
          margin-bottom: 16px;
        }

        .story-meta {
          font-size: 14px;
          color: #9ca3af;
          border-top: 1px solid #f3f4f6;
          padding-top: 16px;
        }

        @media (max-width: 768px) {
          .dashboard-header h1 {
            font-size: 2.5rem;
          }

          .section-header {
            flex-direction: column;
            gap: 20px;
            align-items: stretch;
          }

          .stories-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};

export default Dashboard;

