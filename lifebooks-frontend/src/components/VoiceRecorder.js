import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const VoiceRecorder = ({ user }) => {
  const navigate = useNavigate();
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [loading, setLoading] = useState(false);

  const startRecording = () => {
    setIsRecording(true);
    // Recording logic would go here
  };

  const stopRecording = async () => {
    setIsRecording(false);
    setLoading(true);
    
    try {
      // Simulate transcription
      await new Promise(resolve => setTimeout(resolve, 2000));
      setTranscript("This is a sample transcription of your voice recording. The AI has converted your speech to text and enhanced it for better readability.");
    } catch (error) {
      console.error('Transcription failed:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="voice-recorder">
      <div className="recorder-header">
        <button onClick={() => navigate('/dashboard')} className="btn btn-secondary">
          ← Back to Dashboard
        </button>
        <h1>Voice Recorder</h1>
      </div>

      <div className="recorder-content">
        <div className="recorder-controls">
          <div className="record-button-container">
            {!isRecording ? (
              <button onClick={startRecording} className="record-button">
                <span className="record-icon">🎤</span>
                Start Recording
              </button>
            ) : (
              <button onClick={stopRecording} className="record-button recording">
                <span className="record-icon">⏹️</span>
                Stop Recording
              </button>
            )}
          </div>
          
          {isRecording && (
            <div className="recording-indicator">
              <div className="pulse"></div>
              Recording in progress...
            </div>
          )}
        </div>

        {loading && (
          <div className="transcription-loading">
            <div className="loading-spinner"></div>
            <p>Transcribing your recording...</p>
          </div>
        )}

        {transcript && (
          <div className="transcript-section">
            <h3>Transcript</h3>
            <div className="transcript-content">
              {transcript}
            </div>
            <div className="transcript-actions">
              <button className="btn btn-primary">
                Save to Story
              </button>
              <button className="btn btn-secondary">
                Enhance with AI
              </button>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        .voice-recorder {
          min-height: 100vh;
          background: #f8fafc;
          padding: 20px;
        }

        .recorder-header {
          display: flex;
          align-items: center;
          gap: 20px;
          margin-bottom: 40px;
          max-width: 800px;
          margin-left: auto;
          margin-right: auto;
        }

        .recorder-header h1 {
          font-size: 2rem;
          font-weight: 700;
          color: #1f2937;
        }

        .recorder-content {
          max-width: 800px;
          margin: 0 auto;
        }

        .recorder-controls {
          background: white;
          border-radius: 12px;
          padding: 60px 40px;
          text-align: center;
          margin-bottom: 30px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
        }

        .record-button-container {
          margin-bottom: 30px;
        }

        .record-button {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border: none;
          border-radius: 50%;
          width: 120px;
          height: 120px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }

        .record-button:hover {
          transform: scale(1.05);
        }

        .record-button.recording {
          background: #ef4444;
          animation: pulse 2s infinite;
        }

        .record-icon {
          font-size: 2rem;
        }

        .recording-indicator {
          color: #ef4444;
          font-weight: 600;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
        }

        .pulse {
          width: 12px;
          height: 12px;
          background: #ef4444;
          border-radius: 50%;
          animation: pulse 1s infinite;
        }

        @keyframes pulse {
          0% {
            transform: scale(1);
            opacity: 1;
          }
          50% {
            transform: scale(1.2);
            opacity: 0.7;
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }

        .transcription-loading {
          background: white;
          border-radius: 12px;
          padding: 40px;
          text-align: center;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
        }

        .transcript-section {
          background: white;
          border-radius: 12px;
          padding: 30px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
        }

        .transcript-section h3 {
          font-size: 1.5rem;
          font-weight: 600;
          margin-bottom: 20px;
          color: #1f2937;
        }

        .transcript-content {
          background: #f8fafc;
          border-radius: 8px;
          padding: 20px;
          margin-bottom: 20px;
          line-height: 1.6;
          color: #374151;
        }

        .transcript-actions {
          display: flex;
          gap: 12px;
        }

        @media (max-width: 768px) {
          .transcript-actions {
            flex-direction: column;
          }
        }
      `}</style>
    </div>
  );
};

export default VoiceRecorder;

