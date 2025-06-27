import React, { useState, useEffect } from 'react';
import axios from 'axios'; // Used for fetching markdown
import ReactMarkdown from 'react-markdown'; // Make sure to install: npm install react-markdown

const PrivacyPolicy = () => {
    const [content, setContent] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchContent = async () => {
            try {
                const response = await axios.get('/privacy-policy.md'); // Assumes the markdown file is in your public folder
                setContent(response.data);
            } catch (err) {
                console.error('Error fetching privacy policy:', err);
                setError('Failed to load privacy policy. Please try again later.');
            } finally {
                setLoading(false);
            }
        };

        fetchContent();
    }, []);

    if (loading) {
        return <div className="legal-page-container">Loading Privacy Policy...</div>;
    }

    if (error) {
        return <div className="legal-page-container error-message">{error}</div>;
    }

    return (
        <div className="legal-page-container">
            <h1>Privacy Policy</h1>
            <ReactMarkdown>{content}</ReactMarkdown>
        </div>
    );
};

export default PrivacyPolicy;
