import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const Dashboard = ({ user, onLogout }) => {
  const navigate = useNavigate();
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);

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

  const createNewStory = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post('/api/stories', 
        { title: 'New Story' },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      navigate(`/story/${response.data.story.id}`);
    } catch (error) {
      console.error('Failed to create story:', error);
    }
  };

  return (
    <div className="dashboard">
      <div className="dashboard-container">
        {/* Welcome Message */}
        <div className="welcome-message">
          Welcome back, {user.name || user.email.split('@')[0]}!
        </div>

        {/* Main Heading */}
        <h1 className="dashboard-title">Welcome to Dashboard!</h1>
        
        {/* Success Message */}
        <p className="success-message">Authentication successful!</p>

        {/* Action Buttons - Exactly as in wireframe */}
        <div className="action-buttons">
          <button 
            className="action-btn create-story-btn"
            onClick={createNewStory}
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

        {/* Stories Section - Show existing stories */}
        {!loading && stories.length > 0 && (
          <div className="stories-section">
            <h2>Your Stories</h2>
            <div className="stories-list">
              {stories.map((story) => (
                <div 
                  key={story.id} 
                  className="story-item"
                  onClick={() => navigate(`/story/${story.id}`)}
                >
                  <h3>{story.title}</h3>
                  <p>{story.content ? story.content.substring(0, 100) + '...' : 'No content yet'}</p>
                  <span className="story-date">
                    {new Date(story.updated_at).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        .dashboard {
          min-height: 100vh;
          background: #f8fafc;
          padding: 20px;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }

        .dashboard-container {
          max-width: 600px;
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

        .action-buttons {
          display: flex;
          flex-direction: column;
          gap: 16px;
          margin-bottom: 50px;
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

        .stories-section {
          margin-top: 40px;
        }

        .stories-section h2 {
          font-size: 1.8rem;
          font-weight: 600;
          color: #1f2937;
          margin-bottom: 20px;
          text-align: center;
        }

        .stories-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .story-item {
          background: white;
          padding: 20px;
          border-radius: 8px;
          border: 1px solid #e5e7eb;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .story-item:hover {
          border-color: #3b82f6;
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(59, 130, 246, 0.15);
        }

        .story-item h3 {
          font-size: 1.2rem;
          font-weight: 600;
          color: #1f2937;
          margin-bottom: 8px;
        }

        .story-item p {
          color: #6b7280;
          line-height: 1.5;
          margin-bottom: 8px;
        }

        .story-date {
          font-size: 0.875rem;
          color: #9ca3af;
        }

        @media (max-width: 768px) {
          .dashboard-title {
            font-size: 2rem;
          }
          
          .action-btn {
            font-size: 1rem;
          }
        }
      `}</style>
    </div>
  );
};

export default Dashboard;

