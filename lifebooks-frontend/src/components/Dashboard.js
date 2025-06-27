import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const Dashboard = ({ user, onLogout }) => {
  const navigate = useNavigate();
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showNewStoryModal, setShowNewStoryModal] = useState(false);

  useEffect(() => {
    fetchStories();
  }, []);

  const fetchStories = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/stories', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStories(response.data.stories || []);
    } catch (error) {
      console.error('Failed to load stories:', error);
    } finally {
      setLoading(false);
    }
  };

  const createNewStory = async (storyType) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post('/api/stories', 
        { 
          title: `New ${storyType} Story`,
          story_type: storyType 
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setShowNewStoryModal(false);
      navigate(`/story/${response.data.story.id}`);
    } catch (error) {
      console.error('Failed to create story:', error);
    }
  };

  const getStoryProgress = (story) => {
    if (!story.content || story.content.length < 100) return { stage: 'Starting', progress: 10 };
    if (story.content.length < 1000) return { stage: 'Writing', progress: 30 };
    if (story.content.length < 5000) return { stage: 'Developing', progress: 60 };
    if (!story.cover_generated) return { stage: 'Ready for Cover', progress: 80 };
    return { stage: 'Ready to Publish', progress: 100 };
  };

  const storyTypes = [
    { id: 'autobiography', name: 'Autobiography', description: 'Your complete life story' },
    { id: 'memoir', name: 'Memoir', description: 'Specific memories or experiences' },
    { id: 'family_history', name: 'Family History', description: 'Stories about your family' },
    { id: 'travel', name: 'Travel Stories', description: 'Adventures and journeys' },
    { id: 'professional', name: 'Professional Journey', description: 'Career and work experiences' },
    { id: 'custom', name: 'Custom Story', description: 'Your own unique story type' }
  ];

  return (
    <div className="dashboard">
      <div className="dashboard-container">
        {/* Welcome Message - From Wireframe */}
        <div className="welcome-message">
          Welcome back, {user.name || user.email.split('@')[0]}!
        </div>

        {/* Main Heading - From Wireframe */}
        <h1 className="dashboard-title">Welcome to Dashboard!</h1>
        
        {/* Success Message - From Wireframe */}
        <p className="success-message">Authentication successful!</p>

        {/* Ongoing Stories Section */}
        {!loading && stories.length > 0 && (
          <div className="ongoing-stories">
            <h2>Your Ongoing Stories</h2>
            <div className="stories-grid">
              {stories.map((story) => {
                const { stage, progress } = getStoryProgress(story);
                return (
                  <div key={story.id} className="story-card">
                    <div className="story-header">
                      <h3>{story.title}</h3>
                      <span className={`story-stage stage-${stage.toLowerCase().replace(/\s+/g, '-')}`}>
                        {stage}
                      </span>
                    </div>
                    
                    <div className="progress-section">
                      <div className="progress-bar">
                        <div 
                          className="progress-fill" 
                          style={{ width: `${progress}%` }}
                        ></div>
                      </div>
                      <span className="progress-text">{progress}% Complete</span>
                    </div>

                    <p className="story-preview">
                      {story.content ? 
                        story.content.substring(0, 120) + '...' : 
                        'Click to start writing your story'
                      }
                    </p>

                    <div className="story-actions">
                      <button 
                        className="btn btn-primary"
                        onClick={() => navigate(`/story/${story.id}`)}
                      >
                        Continue Writing
                      </button>
                      
                      {progress >= 80 && (
                        <div className="completion-actions">
                          <button 
                            className="btn btn-secondary"
                            onClick={() => navigate(`/covers?story=${story.id}`)}
                          >
                            Create Cover
                          </button>
                          <button 
                            className="btn btn-success"
                            onClick={() => navigate(`/publish?story=${story.id}`)}
                          >
                            Publish
                          </button>
                          <button 
                            className="btn btn-outline"
                            onClick={() => window.open(`/api/stories/${story.id}/pdf`, '_blank')}
                          >
                            Export PDF
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="story-meta">
                      <span>Last updated: {new Date(story.updated_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Action Buttons - From Wireframe */}
        <div className="action-buttons">
          <button 
            className="action-btn create-story-btn"
            onClick={() => setShowNewStoryModal(true)}
          >
            Create New Story
          </button>
          
          <button 
            className="action-btn create-cover-btn"
            onClick={() => navigate('/covers')}
          >
            Create Book Cover
          </button>
          
          <button 
            className="action-btn publish-btn"
            onClick={() => navigate('/publish')}
          >
            Publish to Amazon
          </button>
          
          <button 
            className="action-btn logout-btn"
            onClick={onLogout}
          >
            Logout
          </button>
        </div>

        {/* Empty State */}
        {!loading && stories.length === 0 && (
          <div className="empty-state">
            <div className="empty-icon">📖</div>
            <h3>No stories yet</h3>
            <p>Start your storytelling journey by creating your first story</p>
          </div>
        )}
      </div>

      {/* New Story Modal */}
      {showNewStoryModal && (
        <div className="modal-overlay" onClick={() => setShowNewStoryModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Choose Your Story Type</h2>
              <button 
                className="modal-close"
                onClick={() => setShowNewStoryModal(false)}
              >
                ×
              </button>
            </div>
            <div className="story-types-grid">
              {storyTypes.map((type) => (
                <div 
                  key={type.id}
                  className="story-type-card"
                  onClick={() => createNewStory(type.id)}
                >
                  <h3>{type.name}</h3>
                  <p>{type.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .dashboard {
          min-height: 100vh;
          background: #f8fafc;
          padding: 20px;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }

        .dashboard-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 40px 20px;
        }

        .welcome-message {
          background: #d1fae5;
          color: #065f46;
          padding: 12px 20px;
          border-radius: 8px;
          margin-bottom: 30px;
          font-weight: 500;
          text-align: center;
        }

        .dashboard-title {
          font-size: 2.5rem;
          font-weight: 700;
          color: #1f2937;
          text-align: center;
          margin-bottom: 20px;
        }

        .success-message {
          text-align: center;
          color: #6b7280;
          font-size: 1.1rem;
          margin-bottom: 40px;
        }

        .ongoing-stories {
          margin-bottom: 50px;
        }

        .ongoing-stories h2 {
          font-size: 1.8rem;
          font-weight: 600;
          color: #1f2937;
          margin-bottom: 30px;
        }

        .stories-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
          gap: 24px;
          margin-bottom: 40px;
        }

        .story-card {
          background: white;
          padding: 24px;
          border-radius: 12px;
          border: 1px solid #e5e7eb;
          transition: all 0.3s ease;
        }

        .story-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
          border-color: #3b82f6;
        }

        .story-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 16px;
        }

        .story-header h3 {
          font-size: 1.25rem;
          font-weight: 600;
          color: #1f2937;
          margin: 0;
          flex: 1;
        }

        .story-stage {
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 0.75rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .stage-starting { background: #fef3c7; color: #92400e; }
        .stage-writing { background: #dbeafe; color: #1e40af; }
        .stage-developing { background: #e0e7ff; color: #5b21b6; }
        .stage-ready-for-cover { background: #fed7aa; color: #c2410c; }
        .stage-ready-to-publish { background: #dcfce7; color: #166534; }

        .progress-section {
          margin-bottom: 16px;
        }

        .progress-bar {
          width: 100%;
          height: 8px;
          background: #f3f4f6;
          border-radius: 4px;
          overflow: hidden;
          margin-bottom: 8px;
        }

        .progress-fill {
          height: 100%;
          background: linear-gradient(90deg, #3b82f6, #1d4ed8);
          transition: width 0.3s ease;
        }

        .progress-text {
          font-size: 0.875rem;
          color: #6b7280;
          font-weight: 500;
        }

        .story-preview {
          color: #6b7280;
          line-height: 1.6;
          margin-bottom: 20px;
        }

        .story-actions {
          margin-bottom: 16px;
        }

        .completion-actions {
          display: flex;
          gap: 8px;
          margin-top: 12px;
          flex-wrap: wrap;
        }

        .story-meta {
          font-size: 0.875rem;
          color: #9ca3af;
          border-top: 1px solid #f3f4f6;
          padding-top: 16px;
        }

        .action-buttons {
          display: flex;
          flex-direction: column;
          gap: 16px;
          max-width: 600px;
          margin: 0 auto;
        }

        .action-btn {
          width: 100%;
          padding: 16px 24px;
          border: none;
          border-radius: 8px;
          font-size: 1.1rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          text-align: center;
        }

        .create-story-btn {
          background: #3b82f6;
          color: white;
        }

        .create-story-btn:hover {
          background: #2563eb;
          transform: translateY(-1px);
        }

        .create-cover-btn {
          background: #f97316;
          color: white;
        }

        .create-cover-btn:hover {
          background: #ea580c;
          transform: translateY(-1px);
        }

        .publish-btn {
          background: #dc2626;
          color: white;
        }

        .publish-btn:hover {
          background: #b91c1c;
          transform: translateY(-1px);
        }

        .logout-btn {
          background: #6b7280;
          color: white;
        }

        .logout-btn:hover {
          background: #4b5563;
          transform: translateY(-1px);
        }

        .empty-state {
          text-align: center;
          padding: 60px 20px;
          margin-bottom: 40px;
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
        }

        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }

        .modal-content {
          background: white;
          border-radius: 12px;
          padding: 32px;
          max-width: 600px;
          width: 90%;
          max-height: 80vh;
          overflow-y: auto;
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
        }

        .modal-header h2 {
          font-size: 1.5rem;
          font-weight: 600;
          color: #1f2937;
          margin: 0;
        }

        .modal-close {
          background: none;
          border: none;
          font-size: 1.5rem;
          cursor: pointer;
          color: #6b7280;
          padding: 4px;
        }

        .story-types-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 16px;
        }

        .story-type-card {
          padding: 20px;
          border: 2px solid #e5e7eb;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .story-type-card:hover {
          border-color: #3b82f6;
          background: #f8fafc;
        }

        .story-type-card h3 {
          font-size: 1.1rem;
          font-weight: 600;
          color: #1f2937;
          margin-bottom: 8px;
        }

        .story-type-card p {
          color: #6b7280;
          font-size: 0.9rem;
          margin: 0;
        }

        .btn {
          padding: 8px 16px;
          border-radius: 6px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
          border: none;
          font-size: 0.875rem;
        }

        .btn-primary {
          background: #3b82f6;
          color: white;
        }

        .btn-primary:hover {
          background: #2563eb;
        }

        .btn-secondary {
          background: #6b7280;
          color: white;
        }

        .btn-secondary:hover {
          background: #4b5563;
        }

        .btn-success {
          background: #10b981;
          color: white;
        }

        .btn-success:hover {
          background: #059669;
        }

        .btn-outline {
          background: transparent;
          color: #3b82f6;
          border: 1px solid #3b82f6;
        }

        .btn-outline:hover {
          background: #3b82f6;
          color: white;
        }

        @media (max-width: 768px) {
          .dashboard-title {
            font-size: 2rem;
          }
          
          .action-btn {
            font-size: 1rem;
          }

          .stories-grid {
            grid-template-columns: 1fr;
          }

          .completion-actions {
            flex-direction: column;
          }

          .story-types-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};

export default Dashboard;

// Force deployment Fri Jun 27 11:39:38 EDT 2025
