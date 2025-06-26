import React from 'react';
import { Link } from 'react-router-dom';

const StoryTypeSelector = () => {
    return (
        <div className="story-type-selector-page">
            <h1>Choose Your Story Type</h1>
            <p>This is where you will select the type of story you want to create.</p>

            {/* Example options - you can expand this later */}
            <div className="story-type-options">
                <Link to="/story/new" className="btn btn-primary">Start Blank Story</Link>
                {/* Add more options here later, e.g., "Guided Interview", "Photo-based Story" */}
            </div>

            <Link to="/dashboard" className="btn btn-secondary">Back to Dashboard</Link>
        </div>
    );
};

export default StoryTypeSelector;
