import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

const StoryEditor = ({ user }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [story, setStory] = useState({ title: '', content: '' });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (id) {
      // Load existing story
      // For now, we'll just set a placeholder
      setStory({ title: 'My Story', content: 'Start writing your story here...' });
    }
  }, [id]);

  const handleSave = async () => {
    setSaving(true);
    try {
      // Save story logic here
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate save
    } catch (error) {
      console.error('Save failed:', error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="story-editor">
      <div className="editor-header">
        <button onClick={() => navigate('/dashboard')} className="btn btn-secondary">
          ← Back to Dashboard
        </button>
        <button onClick={handleSave} className="btn btn-primary" disabled={saving}>
          {saving ? 'Saving...' : 'Save Story'}
        </button>
      </div>
      
      <div className="editor-content">
        <input
          type="text"
          value={story.title}
          onChange={(e) => setStory({ ...story, title: e.target.value })}
          className="title-input"
          placeholder="Story Title"
        />
        <textarea
          value={story.content}
          onChange={(e) => setStory({ ...story, content: e.target.value })}
          className="content-textarea"
          placeholder="Start writing your story..."
        />
      </div>

      <style jsx>{`
        .story-editor {
          min-height: 100vh;
          background: #f8fafc;
          padding: 20px;
        }

        .editor-header {
          display: flex;
          justify-content: space-between;
          margin-bottom: 30px;
          max-width: 800px;
          margin-left: auto;
          margin-right: auto;
        }

        .editor-content {
          max-width: 800px;
          margin: 0 auto;
          background: white;
          border-radius: 12px;
          padding: 40px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
        }

        .title-input {
          width: 100%;
          border: none;
          font-size: 2rem;
          font-weight: 700;
          margin-bottom: 30px;
          padding: 0;
          background: transparent;
        }

        .title-input:focus {
          outline: none;
        }

        .content-textarea {
          width: 100%;
          min-height: 500px;
          border: none;
          font-size: 16px;
          line-height: 1.6;
          resize: vertical;
          background: transparent;
        }

        .content-textarea:focus {
          outline: none;
        }
      `}</style>
    </div>
  );
};

export default StoryEditor;

