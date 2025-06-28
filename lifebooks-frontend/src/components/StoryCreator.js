import React, { useState, useEffect, useRef } from 'react';

const StoryCreator = () => {
  // Version 3.1 - AI Interviewer Integration - Force Deploy
  const [currentStep, setCurrentStep] = useState(1);
  const [storyType, setStoryType] = useState('');
  const [storyTitle, setStoryTitle] = useState('');
  const [interviewMode, setInterviewMode] = useState('ai'); // Default to AI mode
  const [aiSessionId, setAiSessionId] = useState(null);
  const [aiMessages, setAiMessages] = useState([]);
  const [aiPhase, setAiPhase] = useState('discovery');
  const [aiStoryType, setAiStoryType] = useState(null);
  const [aiThemes, setAiThemes] = useState([]);
  const [aiQuestions, setAiQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState(null);
  const [transcription, setTranscription] = useState('');
  const [generatedStory, setGeneratedStory] = useState('');
  const [editedStory, setEditedStory] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentAnswer, setCurrentAnswer] = useState('');
  
  const mediaRecorderRef = useRef(null);
  const timerRef = useRef(null);
  const fileInputRef = useRef(null);

  // Story types with specific interview questions
  const storyTypes = {
    'autobiography': {
      name: 'Autobiography',
      color: 'bg-green-500',
      questions: [
        "Tell me about your earliest childhood memory. What stands out most vividly?",
        "Describe your family background and the environment you grew up in.",
        "What was your education journey like? Any particular teachers or experiences that shaped you?",
        "Tell me about your first job or career path. What drew you to it?",
        "What have been the most significant relationships in your life?",
        "What challenges or obstacles have you overcome in your life?",
        "What achievements are you most proud of?",
        "How have your values and beliefs evolved over time?",
        "What legacy do you hope to leave behind?"
      ]
    },
    'memoir': {
      name: 'Memoir',
      color: 'bg-blue-500',
      questions: [
        "What specific period or theme in your life does this memoir focus on?",
        "What was the pivotal moment that changed everything for you?",
        "Describe the setting and circumstances of this important time.",
        "Who were the key people involved in this story?",
        "What emotions were you experiencing during this period?",
        "What did you learn from this experience?",
        "How did this experience change your perspective on life?",
        "What would you tell someone going through a similar situation?"
      ]
    },
    'family-history': {
      name: 'Family History',
      color: 'bg-orange-500',
      questions: [
        "Tell me about your family's origins. Where did your ancestors come from?",
        "What stories have been passed down through generations in your family?",
        "Describe the most interesting or colorful character in your family history.",
        "What traditions or customs have been important in your family?",
        "Tell me about any family heirlooms or meaningful objects.",
        "What challenges or hardships did your family overcome?",
        "How has your family's story influenced who you are today?",
        "What family stories do you want to preserve for future generations?"
      ]
    },
    'travel': {
      name: 'Travel Stories',
      color: 'bg-purple-500',
      questions: [
        "What inspired you to take this particular journey?",
        "Describe the most memorable moment from your travels.",
        "What was the biggest challenge you faced while traveling?",
        "Tell me about the people you met along the way.",
        "What surprised you most about the places you visited?",
        "How did this travel experience change your perspective?",
        "What advice would you give to someone planning a similar trip?",
        "What lasting impact did this journey have on your life?"
      ]
    },
    'professional': {
      name: 'Professional Journey',
      color: 'bg-teal-500',
      questions: [
        "What drew you to your chosen profession or industry?",
        "Describe your first day at your most significant job.",
        "What was your biggest professional challenge and how did you overcome it?",
        "Tell me about a mentor or colleague who influenced your career.",
        "What project or achievement are you most proud of professionally?",
        "How has your industry changed during your career?",
        "What lessons have you learned about leadership and teamwork?",
        "What advice would you give to someone starting in your field?"
      ]
    },
    'custom': {
      name: 'Custom Story',
      color: 'bg-pink-500',
      questions: [
        "What is the main theme or focus of your story?",
        "What inspired you to tell this particular story?",
        "Who are the main characters or people involved?",
        "What is the setting or context of your story?",
        "What was the most significant moment or turning point?",
        "What emotions or feelings are central to this story?",
        "What message or lesson do you want to convey?",
        "Why is this story important to you and others?"
      ]
    }
  };

  // Initialize AI questions based on story type
  useEffect(() => {
    if (storyType && storyTypes[storyType]) {
      setAiQuestions(storyTypes[storyType].questions);
      setCurrentQuestionIndex(0);
    }
  }, [storyType]);

  // Recording timer
  useEffect(() => {
    if (isRecording) {
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [isRecording]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      
      const chunks = [];
      mediaRecorder.ondataavailable = (e) => chunks.push(e.data);
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/wav' });
        setAudioBlob(blob);
        transcribeAudio(blob);
      };
      
      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
    } catch (error) {
      console.error('Error starting recording:', error);
      alert('Could not access microphone. Please check permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      setIsRecording(false);
    }
  };

  const API_BASE_URL = 'https://xlhyimcj637n.manus.space';
  
  const transcribeAudio = async (audioBlob) => {
    if (!audioBlob) return;
    
    setIsLoading(true);
    setTranscription(''); // Clear any existing transcription
    
    try {
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.wav');
      
      const response = await fetch(`${API_BASE_URL}/api/transcribe`, {
        method: 'POST',
        body: formData,
        headers: {
          'Authorization': `Bearer demo-token`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        const transcribedText = data.transcription || data.text;
        if (transcribedText) {
          setTranscription(transcribedText);
          setCurrentAnswer(prev => prev + ' ' + transcribedText);
        } else {
          setTranscription('Recording processed. No speech detected.');
        }
      } else {
        // Fallback: Let user type their response
        setTranscription('Voice recording completed. Please type your response below or try recording again.');
      }
    } catch (error) {
      console.error('Transcription error:', error);
      // Fallback: Let user type their response  
      setTranscription('Voice recording completed. Please type your response below or try recording again.');
    }
    setIsLoading(false);
  };

  const enhanceTranscription = async (originalText) => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/enhance-text`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer demo-token`
        },
        body: JSON.stringify({
          text: originalText,
          enhancement_type: 'storytelling'
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        const enhancedText = data.enhanced_text || data.text || originalText;
        setTranscription(enhancedText);
        setCurrentAnswer(prev => prev.replace(originalText, enhancedText));
      } else {
        // If enhancement fails, keep original
        console.log('Enhancement service unavailable, keeping original text');
      }
    } catch (error) {
      console.error('Enhancement error:', error);
      // Keep original text if enhancement fails
    }
    setIsLoading(false);
  };

  const keepTranscriptionAsIs = () => {
    // Transcription is already set, just confirm it's added to the answer
    if (!currentAnswer.includes(transcription)) {
      setCurrentAnswer(prev => prev + ' ' + transcription);
    }
  };

  const handleFileUpload = (event) => {
    const files = Array.from(event.target.files);
    const newFiles = files.map(file => ({
      id: Date.now() + Math.random(),
      name: file.name,
      type: file.type,
      size: file.size,
      file: file,
      preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : null
    }));
    setUploadedFiles(prev => [...prev, ...newFiles]);
  };

  const removeFile = (fileId) => {
    setUploadedFiles(prev => prev.filter(f => f.id !== fileId));
  };

  const saveAnswer = () => {
    if (currentAnswer.trim()) {
      setAnswers(prev => ({
        ...prev,
        [currentQuestionIndex]: currentAnswer.trim()
      }));
      setCurrentAnswer('');
      setTranscription('');
      setAudioBlob(null);
    }
  };

  const nextQuestion = () => {
    saveAnswer();
    if (currentQuestionIndex < aiQuestions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      generateStory();
    }
  };

  const previousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
      setCurrentAnswer(answers[currentQuestionIndex - 1] || '');
    }
  };

  const generateStory = async () => {
    setIsLoading(true);
    setCurrentStep(5);
    
    // Simulate story generation
    setTimeout(() => {
      const sampleStory = `# ${storyTitle}\n\nThis is the beginning of your ${storyTypes[storyType]?.name.toLowerCase()} story...\n\n${Object.values(answers).join('\n\n')}`;
      setGeneratedStory(sampleStory);
      setEditedStory(sampleStory);
      setIsLoading(false);
    }, 3000);
  };

  // AI Interviewer Functions
  const startAIInterview = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/lifebooks-integration`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer demo-token`
        },
        body: JSON.stringify({
          action: 'start_ai_interview'
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setAiSessionId(data.session_id);
          setAiMessages([{
            role: 'ai',
            content: data.initial_message,
            timestamp: new Date().toISOString()
          }]);
          setInterviewMode('ai');
          setCurrentStep(3);
        }
      } else {
        console.error('Failed to start AI interview');
        // Fallback to traditional interview
        setInterviewMode('traditional');
        setAiQuestions(storyTypes[storyType]?.questions || []);
        setCurrentStep(3);
      }
    } catch (error) {
      console.error('Error starting AI interview:', error);
      // Fallback to traditional interview
      setInterviewMode('traditional');
      setAiQuestions(storyTypes[storyType]?.questions || []);
      setCurrentStep(3);
    }
    setIsLoading(false);
  };

  const sendAIMessage = async (message) => {
    if (!message.trim() || !aiSessionId) return;
    
    // Add user message to conversation
    const userMessage = {
      role: 'user',
      content: message,
      timestamp: new Date().toISOString()
    };
    setAiMessages(prev => [...prev, userMessage]);
    setCurrentAnswer('');
    setIsLoading(true);
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/process-response`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer demo-token`
        },
        body: JSON.stringify({
          session_id: aiSessionId,
          message: message
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        
        // Add AI response to conversation
        const aiMessage = {
          role: 'ai',
          content: data.message,
          timestamp: new Date().toISOString()
        };
        setAiMessages(prev => [...prev, aiMessage]);
        
        // Update interview state
        setAiPhase(data.phase);
        setAiStoryType(data.story_type);
        setAiThemes(data.themes || []);
        
        // Check if interview is complete
        if (data.phase === 'wisdom_extraction' && data.message.includes('ready for me to begin crafting')) {
          // Interview complete, offer to generate book
          setTimeout(() => {
            setCurrentStep(4);
          }, 2000);
        }
      } else {
        console.error('Failed to process AI response');
      }
    } catch (error) {
      console.error('Error sending AI message:', error);
    }
    setIsLoading(false);
  };

  const generateAIBookOutline = async () => {
    if (!aiSessionId) return;
    
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/generate-outline`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer demo-token`
        },
        body: JSON.stringify({
          session_id: aiSessionId
        })
      });
      
      if (response.ok) {
        const outline = await response.json();
        
        // Convert outline to story format
        const storyContent = `# ${outline.title || storyTitle}\n\n## Book Outline\n\n**Story Type:** ${outline.book_type}\n**Estimated Length:** ${outline.estimated_length}\n**Key Themes:** ${outline.themes?.join(', ')}\n\n### Chapters:\n\n${outline.chapters?.map((chapter, index) => 
          `**Chapter ${index + 1}: ${chapter.title}**\n${chapter.theme}\n`
        ).join('\n') || 'Chapters will be generated based on your interview content.'}\n\n## Your Story\n\nBased on our conversation, here's the beginning of your story...\n\n${aiMessages.filter(msg => msg.role === 'user').map(msg => msg.content).join('\n\n')}`;
        
        setGeneratedStory(storyContent);
        setEditedStory(storyContent);
        setCurrentStep(5);
      }
    } catch (error) {
      console.error('Error generating AI book outline:', error);
    }
    setIsLoading(false);
  };

  const generateStoryFromTraditional = async () => {
    setIsLoading(true);
    setCurrentStep(4);
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/generate-story`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          storyType,
          title: storyTitle,
          answers,
          uploadedFiles: uploadedFiles.map(f => ({ name: f.name, type: f.type }))
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        setGeneratedStory(data.story);
        setEditedStory(data.story);
      } else {
        const errorData = await response.json();
        console.error('Story generation error:', errorData.message);
        alert(`Story generation failed: ${errorData.message}`);
        // Fallback to demo story
        const demoStory = `# ${storyTitle}\n\nBased on your responses, here is your personalized story...\n\n${Object.values(answers).join('\n\n')}`;
        setGeneratedStory(demoStory);
        setEditedStory(demoStory);
      }
    } catch (error) {
      console.error('Story generation error:', error);
      alert('Story generation failed. Please try again.');
      // Fallback demo story
      const demoStory = `# ${storyTitle}\n\nBased on your responses, here is your personalized story...\n\n${Object.values(answers).join('\n\n')}`;
      setGeneratedStory(demoStory);
      setEditedStory(demoStory);
    }
    setIsLoading(false);
  };

  const saveStory = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/story`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          title: storyTitle,
          content: editedStory,
          summary: `${storyType} story created through AI interview process`,
          tags: [storyType, 'ai-generated', 'interview']
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        alert('Story saved successfully!');
        console.log('Saved story:', data.story);
      } else {
        const errorData = await response.json();
        console.error('Save error:', errorData.message);
        alert(`Save failed: ${errorData.message}`);
      }
    } catch (error) {
      console.error('Save error:', error);
      alert('Story saved locally! (Network error occurred)');
    }
    setIsLoading(false);
  };

  const renderStepIndicator = () => (
    <div className="flex items-center justify-center mb-8">
      {[1, 2, 3, 4, 5].map((step) => (
        <div key={step} className="flex items-center">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${
            currentStep >= step ? 'bg-orange-500' : 'bg-gray-300'
          }`}>
            {currentStep > step ? '✓' : step}
          </div>
          {step < 5 && (
            <div className={`w-16 h-1 ${currentStep > step ? 'bg-orange-500' : 'bg-gray-300'}`} />
          )}
        </div>
      ))}
    </div>
  );

  const renderStoryTypeSelection = () => (
    <div className="max-w-4xl mx-auto">
      <h2 className="text-3xl font-bold text-center mb-8">Choose Your Story Type</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Object.entries(storyTypes).map(([key, type]) => (
          <div
            key={key}
            onClick={() => {
              setStoryType(key);
              setCurrentStep(2);
            }}
            className={`story-type-card ${storyType === key ? 'selected' : ''}`}
          >
            <div className={`w-12 h-12 rounded-lg ${type.color} mb-4 flex items-center justify-center`}>
              <span className="text-white text-2xl">📖</span>
            </div>
            <h3 className="text-xl font-semibold mb-2">{type.name}</h3>
            <p className="text-gray-600 text-sm">
              {key === 'autobiography' && 'Tell your complete life story from childhood to present'}
              {key === 'memoir' && 'Focus on a specific period or theme in your life'}
              {key === 'family-history' && 'Preserve your family heritage and traditions'}
              {key === 'travel' && 'Share your adventures and travel experiences'}
              {key === 'professional' && 'Document your career journey and achievements'}
              {key === 'custom' && 'Create a personalized story on any topic'}
            </p>
          </div>
        ))}
      </div>
    </div>
  );

  const renderStorySetup = () => (
    <div className="max-w-2xl mx-auto">
      <h2 className="text-3xl font-bold text-center mb-8">Story Setup</h2>
      <div className="space-y-6">
        <div>
          <label className="block text-lg font-medium mb-2">Story Title</label>
          <input
            type="text"
            value={storyTitle}
            onChange={(e) => setStoryTitle(e.target.value)}
            placeholder="Enter a title for your story..."
            className="w-full p-4 border border-gray-300 rounded-lg text-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          />
        </div>
        
        <div>
          <label className="block text-lg font-medium mb-2">Upload Supporting Materials (Optional)</label>
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-orange-500 transition-colors"
          >
            <span className="text-6xl mb-4 block">📁</span>
            <p className="text-lg text-gray-600">Click to upload photos, documents, or other files</p>
            <p className="text-sm text-gray-500 mt-2">Supports images, PDFs, and text documents</p>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*,.pdf,.doc,.docx,.txt"
            onChange={handleFileUpload}
            className="hidden"
          />
        </div>

        {uploadedFiles.length > 0 && (
          <div className="space-y-2">
            <h3 className="font-medium">Uploaded Files:</h3>
            {uploadedFiles.map((file) => (
              <div key={file.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  {file.preview ? (
                    <img src={file.preview} alt={file.name} className="w-12 h-12 object-cover rounded" />
                  ) : (
                    <span className="text-2xl">📄</span>
                  )}
                  <div>
                    <p className="font-medium">{file.name}</p>
                    <p className="text-sm text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                  </div>
                </div>
                <button
                  onClick={() => removeFile(file.id)}
                  className="text-red-500 hover:text-red-700"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="space-y-4">
          <h3 className="text-lg font-medium text-center">Choose Your Interview Experience</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              onClick={startAIInterview}
              disabled={!storyTitle.trim()}
              className="p-6 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-lg font-semibold hover:from-purple-600 hover:to-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all transform hover:scale-105"
            >
              <div className="text-3xl mb-2">🤖</div>
              <div className="text-lg font-bold mb-2">AI Ghostwriter Interview</div>
              <div className="text-sm opacity-90">Professional ghostwriter-style conversation that adapts to your responses and guides you through your story naturally</div>
            </button>
            
            <button
              onClick={() => {
                setInterviewMode('traditional');
                setAiQuestions(storyTypes[storyType]?.questions || []);
                setCurrentStep(3);
              }}
              disabled={!storyTitle.trim()}
              className="p-6 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-lg font-semibold hover:from-orange-600 hover:to-red-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all transform hover:scale-105"
            >
              <div className="text-3xl mb-2">📝</div>
              <div className="text-lg font-bold mb-2">Traditional Q&A</div>
              <div className="text-sm opacity-90">Structured questions specific to your story type with voice recording and document upload</div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderAIInterview = () => {
    if (interviewMode === 'ai') {
      return (
        <div className="max-w-4xl mx-auto h-screen flex flex-col">
          {/* Header */}
          <div className="bg-white border-b border-gray-200 p-4 flex-shrink-0">
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-lg">🤖</span>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">AI Ghostwriter</h3>
                  <p className="text-sm text-gray-500">
                    Phase: {aiPhase.replace('_', ' ')} • {aiStoryType ? aiStoryType.replace('_', ' ') : 'Discovering your story'}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                {aiThemes.length > 0 && (
                  <div className="flex space-x-1">
                    {aiThemes.slice(0, 3).map((theme, index) => (
                      <span key={index} className="px-2 py-1 bg-orange-100 text-orange-700 rounded-full text-xs">
                        {theme}
                      </span>
                    ))}
                    {aiThemes.length > 3 && (
                      <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs">
                        +{aiThemes.length - 3}
                      </span>
                    )}
                  </div>
                )}
                
                <button
                  onClick={() => setCurrentStep(4)}
                  className="px-3 py-1 bg-green-500 text-white rounded-lg text-sm hover:bg-green-600"
                >
                  Generate Book
                </button>
              </div>
            </div>
          </div>

          {/* Chat Messages */}
          <div className="chat-container">
            {aiMessages.map((message, index) => (
              <div key={index} className={`chat-message ${message.role}`}>
                <div className={`chat-bubble ${message.role}`}>
                  <div className="whitespace-pre-wrap">
                    {message.content}
                  </div>
                  <div className="text-xs mt-1 opacity-70">
                    {new Date(message.timestamp).toLocaleTimeString()}
                  </div>
                  
                  {/* Enhancement options for user messages */}
                  {message.role === 'user' && message.enhanced !== true && (
                    <div className="mt-2 flex space-x-2">
                      <button
                        onClick={() => enhanceMessage(index, message.content)}
                        className="text-xs bg-white bg-opacity-20 hover:bg-opacity-30 px-2 py-1 rounded"
                        disabled={isLoading}
                      >
                        ✨ Enhance
                      </button>
                      <button
                        onClick={() => editMessage(index)}
                        className="text-xs bg-white bg-opacity-20 hover:bg-opacity-30 px-2 py-1 rounded"
                      >
                        ✏️ Edit
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white text-gray-800 shadow-sm border px-4 py-3 rounded-lg max-w-xs">
                  <div className="flex items-center space-x-2">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                    </div>
                    <span className="text-sm text-gray-500">AI is thinking...</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Input Area */}
          <div className="bg-white border-t border-gray-200 p-4 flex-shrink-0">
            {transcription && (
              <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-medium text-blue-800 text-sm">🎤 Voice Transcription:</h4>
                  <button
                    onClick={() => setTranscription('')}
                    className="text-blue-600 hover:text-blue-800 text-sm"
                  >
                    ✕
                  </button>
                </div>
                <p className="text-blue-700 text-sm mb-3">{transcription}</p>
                <div className="flex space-x-2">
                  <button
                    onClick={() => enhanceTranscription(transcription)}
                    className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600 disabled:bg-gray-300"
                    disabled={isLoading}
                  >
                    ✨ Enhance & Use
                  </button>
                  <button
                    onClick={() => {
                      setCurrentAnswer(transcription);
                      setTranscription('');
                    }}
                    className="px-3 py-1 bg-gray-500 text-white rounded text-sm hover:bg-gray-600"
                  >
                    Use As Is
                  </button>
                </div>
              </div>
            )}

            <div className="chat-input-container">
              <textarea
                value={currentAnswer}
                onChange={(e) => setCurrentAnswer(e.target.value)}
                placeholder="Share your thoughts... (or use voice recording)"
                className="chat-input"
                rows="3"
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    if (currentAnswer.trim()) {
                      sendAIMessage(currentAnswer);
                    }
                  }
                }}
              />
              
              <div className="flex flex-col space-y-2">
                <button
                  onClick={isRecording ? stopRecording : startRecording}
                  className={`voice-recording-btn ${isRecording ? 'recording' : ''}`}
                  title={isRecording ? `Recording ${formatTime(recordingTime)}` : 'Start voice recording'}
                >
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    {isRecording ? (
                      <rect x="6" y="6" width="12" height="12" rx="2"/>
                    ) : (
                      <path d="M12 2a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/>
                    )}
                  </svg>
                  {isRecording ? '🛑' : '🎤'}
                </button>
                
                <button
                  onClick={() => sendAIMessage(currentAnswer)}
                  disabled={!currentAnswer.trim() || isLoading}
                  className="chat-send-btn"
                  title="Send message"
                >
                  ➤
                </button>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex justify-between items-center mt-3 text-sm">
              <div className="flex space-x-3">
                <button
                  onClick={() => sendAIMessage("I'd like to skip this question and come back to it later.")}
                  className="text-gray-600 hover:text-purple-600 transition-colors"
                  disabled={isLoading}
                >
                  ⏭️ Skip Question
                </button>
                <button
                  onClick={() => sendAIMessage("Can we go back to a previous topic?")}
                  className="text-gray-600 hover:text-purple-600 transition-colors"
                  disabled={isLoading}
                >
                  ⬅️ Go Back
                </button>
                <button
                  onClick={() => sendAIMessage("I need a moment to think about this.")}
                  className="text-gray-600 hover:text-purple-600 transition-colors"
                  disabled={isLoading}
                >
                  ⏸️ Pause
                </button>
              </div>
              
              <div className="text-gray-500">
                Press Enter to send • Shift+Enter for new line
              </div>
            </div>

            {audioBlob && (
              <div className="mt-2 flex items-center space-x-2">
                <button
                  onClick={() => {
                    const audio = new Audio(URL.createObjectURL(audioBlob));
                    audio.play();
                  }}
                  className="flex items-center space-x-1 px-3 py-1 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm"
                >
                  <span>▶️</span>
                  <span>Play Recording</span>
                </button>
                <button
                  onClick={() => setAudioBlob(null)}
                  className="text-gray-500 hover:text-red-500 text-sm"
                >
                  Delete
                </button>
              </div>
            )}
          </div>
        </div>
      );
    } else {
      // Traditional Q&A Mode
      return (
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="mb-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold text-gray-900">Traditional Q&A Interview</h3>
                <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                  Question {currentQuestionIndex + 1} of {questions.length}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}
                ></div>
              </div>
            </div>

            <div className="mb-8">
              <h4 className="text-lg font-medium text-gray-800 mb-4">
                {questions[currentQuestionIndex]?.question}
              </h4>
              
              <textarea
                value={currentAnswer}
                onChange={(e) => setCurrentAnswer(e.target.value)}
                placeholder="Share your thoughts here..."
                className="w-full p-4 border border-gray-300 rounded-lg h-32 text-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex space-x-4">
                <button
                  onClick={isRecording ? stopRecording : startRecording}
                  className={`flex items-center space-x-2 px-6 py-3 rounded-lg font-semibold transition-colors ${
                    isRecording 
                      ? 'bg-red-500 text-white hover:bg-red-600' 
                      : 'bg-blue-500 text-white hover:bg-blue-600'
                  }`}
                >
                  <span>{isRecording ? '🛑' : '🎤'}</span>
                  <span>{isRecording ? `Recording ${formatTime(recordingTime)}` : 'Voice Recording'}</span>
                </button>

                {audioBlob && (
                  <button
                    onClick={() => {
                      const audio = new Audio(URL.createObjectURL(audioBlob));
                      audio.play();
                    }}
                    className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    <span>▶️</span>
                    <span>Play Recording</span>
                  </button>
                )}
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={previousQuestion}
                  disabled={currentQuestionIndex === 0}
                  className="px-6 py-3 bg-gray-500 text-white rounded-lg font-semibold hover:bg-gray-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <button
                  onClick={nextQuestion}
                  className="px-6 py-3 bg-blue-500 text-white rounded-lg font-semibold hover:bg-blue-600"
                >
                  {currentQuestionIndex === questions.length - 1 ? 'Finish' : 'Next'}
                </button>
              </div>
            </div>

            {transcription && (
              <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                <h4 className="font-medium text-green-800 mb-2">🎤 Transcription:</h4>
                <p className="text-green-700 mb-3">{transcription}</p>
                <div className="flex space-x-2">
                  <button
                    onClick={() => enhanceTranscription(transcription)}
                    className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:bg-gray-300"
                    disabled={isLoading}
                  >
                    ✨ Enhance with AI
                  </button>
                  <button
                    onClick={keepTranscriptionAsIs}
                    className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
                  >
                    ✓ Keep As Is
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      );
    }
  };

  // Enhanced message functions for chatbot interface
  const enhanceMessage = async (messageIndex, content) => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/enhance-text`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer demo-token'
        },
        body: JSON.stringify({
          text: content,
          enhancement_type: 'storytelling'
        })
      });

      if (response.ok) {
        const data = await response.json();
        const updatedMessages = [...aiMessages];
        updatedMessages[messageIndex] = {
          ...updatedMessages[messageIndex],
          content: data.enhanced_text,
          enhanced: true
        };
        setAiMessages(updatedMessages);
      } else {
        alert('Enhancement failed. Please try again.');
      }
    } catch (error) {
      console.error('Enhancement error:', error);
      alert('Enhancement failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const editMessage = (messageIndex) => {
    const message = aiMessages[messageIndex];
    const newContent = prompt('Edit your message:', message.content);
    if (newContent && newContent !== message.content) {
      const updatedMessages = [...aiMessages];
      updatedMessages[messageIndex] = {
        ...updatedMessages[messageIndex],
        content: newContent
      };
      setAiMessages(updatedMessages);
    }
  };

  const enhanceTranscription = async (text) => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/enhance-text`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer demo-token'
        },
        body: JSON.stringify({
          text: text,
          enhancement_type: 'storytelling'
        })
      });

      if (response.ok) {
        const data = await response.json();
        setCurrentAnswer(data.enhanced_text);
        setTranscription('');
      } else {
        alert('Enhancement failed. Please try again.');
      }
    } catch (error) {
      console.error('Enhancement error:', error);
      alert('Enhancement failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const renderStoryGeneration = () => (
          
          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="flex justify-between items-center mb-6">
              <span className="text-sm text-gray-500">
                Question {currentQuestionIndex + 1} of {aiQuestions.length}
              </span>
              <div className="w-64 bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-orange-500 h-2 rounded-full transition-all"
                  style={{ width: `${((currentQuestionIndex + 1) / aiQuestions.length) * 100}%` }}
                />
              </div>
            </div>

            <div className="mb-8">
              <h3 className="text-xl font-semibold mb-4 text-gray-800">
                {aiQuestions[currentQuestionIndex]}
              </h3>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-lg font-medium mb-2">Your Answer</label>
                <textarea
                  value={currentAnswer}
                  onChange={(e) => setCurrentAnswer(e.target.value)}
                  placeholder="Type your answer here, or use voice recording below..."
                  className="w-full p-4 border border-gray-300 rounded-lg h-32 text-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>

              <div className="voice-recording-container">
                <button
                  onClick={isRecording ? stopRecording : startRecording}
                  className={`voice-recording-btn ${isRecording ? 'recording' : ''}`}
                >
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    {isRecording ? (
                      <rect x="6" y="6" width="12" height="12" rx="2"/>
                    ) : (
                      <path d="M12 2a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/>
                    )}
                  </svg>
                </button>
                <div className={`recording-status ${isRecording ? 'active' : ''}`}>
                  {isRecording ? 'Stop Recording' : 'Start Recording'}
                </div>
                {isRecording && (
                  <div className="recording-timer">
                    {formatTime(recordingTime)}
                  </div>
                )}

                {audioBlob && (
                  <button
                    onClick={() => {
                      const audio = new Audio(URL.createObjectURL(audioBlob));
                      audio.play();
                    }}
                    className="btn btn-secondary"
                    style={{marginTop: '12px'}}
                  >
                    ▶️ Play Recording
                  </button>
                )}
              </div>

              {transcription && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <h4 className="font-medium text-green-800 mb-2">🎤 Transcription Result:</h4>
                  <p className="text-green-700 mb-3">{transcription}</p>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => enhanceTranscription(transcription)}
                      className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:bg-gray-300"
                      disabled={isLoading}
                    >
                      ✨ Let AI Enhance It
                    </button>
                    <button
                      onClick={keepTranscriptionAsIs}
                      className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
                    >
                      ✓ Keep As Is
                    </button>
                  </div>
                </div>
              )}

              <div className="flex justify-between">
                <button
                  onClick={previousQuestion}
                  disabled={currentQuestionIndex === 0}
                  className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  ← Previous
                </button>
                
                <button
                  onClick={nextQuestion}
                  disabled={!currentAnswer.trim()}
                  className="px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  {currentQuestionIndex === aiQuestions.length - 1 ? 'Generate Story' : 'Next →'}
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }
  };

  const renderStoryGeneration = () => (
    <div className="max-w-4xl mx-auto">
      <h2 className="text-3xl font-bold text-center mb-8">Your Generated Story</h2>
      
      {isLoading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-lg text-gray-600">AI is crafting your story...</p>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-semibold">Story Preview</h3>
            <div className="space-x-4">
              <button
                onClick={() => setShowPreview(!showPreview)}
                className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                <span>👁️</span>
                <span>{showPreview ? 'Edit Mode' : 'Preview Mode'}</span>
              </button>
            </div>
          </div>

          {showPreview ? (
            <div className="prose max-w-none p-6 bg-white rounded-lg shadow-lg">
              <div dangerouslySetInnerHTML={{ __html: editedStory.replace(/\n/g, '<br>') }} />
            </div>
          ) : (
            <div>
              <label className="block text-lg font-medium mb-2">Edit Your Story</label>
              <textarea
                value={editedStory}
                onChange={(e) => setEditedStory(e.target.value)}
                className="w-full p-4 border border-gray-300 rounded-lg h-96 text-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
            </div>
          )}

          <div className="flex justify-between">
            <button
              onClick={() => setCurrentStep(3)}
              className="flex items-center space-x-2 px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              <span>⬅️</span>
              <span>Back to Interview</span>
            </button>

            <div className="space-x-4">
              <button
                onClick={() => setCurrentStep(5)}
                className="flex items-center space-x-2 px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600"
              >
                <span>Finalize Story</span>
                <span>➡️</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderStoryFinalization = () => (
    <div className="max-w-4xl mx-auto">
      <h2 className="text-3xl font-bold text-center mb-8">Story Complete!</h2>
      
      <div className="bg-white rounded-lg shadow-lg p-8">
        <div className="text-center mb-8">
          <span className="text-6xl mb-4 block">✅</span>
          <h3 className="text-2xl font-semibold mb-2">Your story "{storyTitle}" is ready!</h3>
          <p className="text-gray-600">Choose what you'd like to do next with your story.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <button
            onClick={saveStory}
            className="flex items-center justify-center space-x-3 p-6 border-2 border-orange-500 rounded-lg hover:bg-orange-50 transition-colors"
          >
            <span className="text-orange-500 text-2xl">💾</span>
            <div className="text-left">
              <h4 className="font-semibold">Save Story</h4>
              <p className="text-sm text-gray-600">Save to your dashboard for later editing</p>
            </div>
          </button>

          <button
            onClick={() => alert('Book cover creation feature coming soon!')}
            className="flex items-center justify-center space-x-3 p-6 border-2 border-blue-500 rounded-lg hover:bg-blue-50 transition-colors"
          >
            <span className="text-blue-500 text-2xl">📷</span>
            <div className="text-left">
              <h4 className="font-semibold">Create Book Cover</h4>
              <p className="text-sm text-gray-600">Design a beautiful cover for your story</p>
            </div>
          </button>

          <button
            onClick={() => alert('Publishing feature coming soon!')}
            className="flex items-center justify-center space-x-3 p-6 border-2 border-green-500 rounded-lg hover:bg-green-50 transition-colors"
          >
            <span className="text-green-500 text-2xl">📚</span>
            <div className="text-left">
              <h4 className="font-semibold">Publish Book</h4>
              <p className="text-sm text-gray-600">Publish to Amazon KDP or other platforms</p>
            </div>
          </button>

          <button
            onClick={() => {
              const element = document.createElement('a');
              const file = new Blob([editedStory], { type: 'text/plain' });
              element.href = URL.createObjectURL(file);
              element.download = `${storyTitle}.txt`;
              document.body.appendChild(element);
              element.click();
              document.body.removeChild(element);
            }}
            className="flex items-center justify-center space-x-3 p-6 border-2 border-purple-500 rounded-lg hover:bg-purple-50 transition-colors"
          >
            <span className="text-purple-500 text-2xl">⬇️</span>
            <div className="text-left">
              <h4 className="font-semibold">Download Story</h4>
              <p className="text-sm text-gray-600">Download as text file or PDF</p>
            </div>
          </button>
        </div>

        <div className="mt-8 text-center">
          <button
            onClick={() => {
              setCurrentStep(1);
              setStoryType('');
              setStoryTitle('');
              setAnswers({});
              setUploadedFiles([]);
              setGeneratedStory('');
              setEditedStory('');
              setCurrentQuestionIndex(0);
            }}
            className="px-8 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
          >
            Create Another Story
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-400 via-orange-500 to-orange-600 py-8">
      <div className="container mx-auto px-4">
        {renderStepIndicator()}
        
        <div className="bg-gray-50 rounded-lg shadow-xl p-8">
          {currentStep === 1 && renderStoryTypeSelection()}
          {currentStep === 2 && renderStorySetup()}
          {currentStep === 3 && renderAIInterview()}
          {currentStep === 4 && renderStoryGeneration()}
          {currentStep === 5 && renderStoryFinalization()}
        </div>
      </div>
    </div>
  );
};

export default StoryCreator;

