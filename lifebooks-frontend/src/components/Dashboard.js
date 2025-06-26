import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Dashboard.css'; // Assuming you created a CSS file for styling

const Dashboard = ({ user, onLogout }) => {
    const [stories, setStories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const navigate = useNavigate(); // Initialize useNavigate

    useEffect(() => {
        fetchStories();
    }, []);

    const fetchStories = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get('https://lifebooks-ai-backend.onrender.com/api/stories', {
                headers: { Authorization: `Bearer ${token}` },
            });
            // Ensure stories is always an array
            setStories(response.data.stories || []);
        } catch (error) {
            setError('Failed to load stories');
            console.error('Error fetching stories:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="dashboard">
            <nav className="navbar-container">
                <Link to="/dashboard" className="navbar-brand">Lifebooks</Link>
                <div className="navbar-nav">
                    <span className="user-name">Welcome, {user.email}</span>
                    <button onClick={onLogout} className="btn btn-secondary logout-btn">Logout</button>
                </div>
            </nav>

            <div className="dashboard-content container">
                <div className="dashboard-header">
                    <h1 className="dashboard-title">Continue building your legacy.</h1>
                    <p className="dashboard-subtitle">Your stories, your life, beautifully preserved.</p>
                </div>

                {/* Section 1: Create a New Story */}
                <section className="section-create-new">
                    <h2>Create a New Story</h2>
                    <p>Start a fresh chapter in your life's narrative.</p>
                    <Link to="/create-story-type" className="btn btn-primary create-story-btn">
                        Start a New Story
                    </Link>
                </section>

                {/* Section 2: Continue Working on Projects */}
                <section className="section-ongoing-projects">
                    <h2>Continue Working on Your Projects</h2>
                    <p>Access and manage your ongoing life stories.</p>

                    {loading ? (
                        <div className="loading-state">
                            <div className="loading-spinner"></div>
                            <p>Loading your stories...</p>
                        </div>
                    ) : error ? (
                        <div className="error-state">
                            <p>{error}</p>
                            <button onClick={fetchStories} className="btn btn-secondary">Try Again</button>
                        </div>
                    ) : stories.length === 0 ? (
                        <div className="empty-state">
                            <p>You haven't started any stories yet.</p>
                            <Link to="/create-story-type" className="btn btn-primary">Create your First Story</Link>
                        </div>
                    ) : (
                        <div className="stories-grid">
                            {stories.map((story) => (
                                <div key={story.id} className="story-card">
                                    <h3 className="story-title">{story.title || 'Untitled Story'}</h3>
                                    <p className="story-content-preview">
                                        {story.content ? story.content.substring(0, 150) + '...' : 'No content yet. Click to start writing.'}
                                    </p>
                                    <div className="story-meta">
                                        <span>Last updated: {new Date(story.updated_at).toLocaleDateString()}</span>
                                    </div>
                                    <div className="story-actions">
                                        <Link to={`/story/${story.id}`} className="btn btn-sm btn-edit">Edit Story</Link>
                                        <Link to={`/covers?storyId=${story.id}`} className="btn btn-sm btn-action">Create Cover</Link>
                                        <button className="btn btn-sm btn-action" disabled title="Print functionality coming soon">Print</button>
                                        <Link to={`/publish?storyId=${story.id}`} className="btn btn-sm btn-action">Publish</Link>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </section>
            </div>
        </div>
    );
};

export default Dashboard;

