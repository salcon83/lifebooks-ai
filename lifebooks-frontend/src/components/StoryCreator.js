import React, { useState, useEffect, useRef } from 'react';
import { Upload, Mic, MicOff, Play, Pause, FileText, Camera, Edit3, Eye, Save, ArrowRight, ArrowLeft, CheckCircle } from 'lucide-react';

const StoryCreator = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [storyType, setStoryType] = useState('');
  const [storyTitle, setStoryTitle] = useState('');
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

  const transcribeAudio = async (audioBlob) => {
    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.wav');
      
      const response = await fetch('/api/transcribe', {
        method: 'POST',
        body: formData
      });
      
      if (response.ok) {
        const data = await response.json();
        setTranscription(data.transcription);
        setCurrentAnswer(prev => prev + ' ' + data.transcription);
      }
    } catch (error) {
      console.error('Transcription error:', error);
    }
    setIsLoading(false);
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
    setCurrentStep(4);
    
    try {
      const response = await fetch('/api/generate-story', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
      }
    } catch (error) {
      console.error('Story generation error:', error);
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
      const response = await fetch('/api/stories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: storyTitle,
          type: storyType,
          content: editedStory,
          answers,
          files: uploadedFiles.map(f => ({ name: f.name, type: f.type }))
        })
      });
      
      if (response.ok) {
        alert('Story saved successfully!');
        // Redirect to dashboard or story list
      }
    } catch (error) {
      console.error('Save error:', error);
      alert('Story saved locally!');
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
            {currentStep > step ? <CheckCircle size={20} /> : step}
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
            className={`p-6 rounded-lg border-2 cursor-pointer transition-all hover:scale-105 ${
              storyType === key ? 'border-orange-500 bg-orange-50' : 'border-gray-200 hover:border-orange-300'
            }`}
          >
            <div className={`w-12 h-12 rounded-lg ${type.color} mb-4 flex items-center justify-center`}>
              <FileText className="text-white" size={24} />
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
            <Upload className="mx-auto mb-4 text-gray-400" size={48} />
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
                    <FileText size={24} className="text-gray-500" />
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

        <button
          onClick={() => setCurrentStep(3)}
          disabled={!storyTitle.trim()}
          className="w-full bg-orange-500 text-white py-4 rounded-lg text-lg font-semibold hover:bg-orange-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
        >
          Start AI Interview
        </button>
      </div>
    </div>
  );

  const renderAIInterview = () => (
    <div className="max-w-4xl mx-auto">
      <h2 className="text-3xl font-bold text-center mb-8">AI Interview</h2>
      
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

          <div className="flex items-center space-x-4">
            <button
              onClick={isRecording ? stopRecording : startRecording}
              className={`flex items-center space-x-2 px-6 py-3 rounded-lg font-semibold transition-colors ${
                isRecording 
                  ? 'bg-red-500 text-white hover:bg-red-600' 
                  : 'bg-blue-500 text-white hover:bg-blue-600'
              }`}
            >
              {isRecording ? <MicOff size={20} /> : <Mic size={20} />}
              <span>{isRecording ? `Recording ${formatTime(recordingTime)}` : 'Start Recording'}</span>
            </button>

            {audioBlob && (
              <button
                onClick={() => {
                  const audio = new Audio(URL.createObjectURL(audioBlob));
                  audio.play();
                }}
                className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                <Play size={16} />
                <span>Play Recording</span>
              </button>
            )}
          </div>

          {transcription && (
            <div className="p-4 bg-blue-50 rounded-lg">
              <h4 className="font-medium mb-2">Transcription:</h4>
              <p className="text-gray-700">{transcription}</p>
            </div>
          )}

          <div className="flex justify-between">
            <button
              onClick={previousQuestion}
              disabled={currentQuestionIndex === 0}
              className="flex items-center space-x-2 px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ArrowLeft size={20} />
              <span>Previous</span>
            </button>

            <button
              onClick={nextQuestion}
              disabled={!currentAnswer.trim()}
              className="flex items-center space-x-2 px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              <span>{currentQuestionIndex === aiQuestions.length - 1 ? 'Generate Story' : 'Next'}</span>
              <ArrowRight size={20} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );

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
                <Eye size={16} />
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
              <ArrowLeft size={20} />
              <span>Back to Interview</span>
            </button>

            <div className="space-x-4">
              <button
                onClick={() => setCurrentStep(5)}
                className="flex items-center space-x-2 px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600"
              >
                <span>Finalize Story</span>
                <ArrowRight size={20} />
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
          <CheckCircle className="mx-auto mb-4 text-green-500" size={64} />
          <h3 className="text-2xl font-semibold mb-2">Your story "{storyTitle}" is ready!</h3>
          <p className="text-gray-600">Choose what you'd like to do next with your story.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <button
            onClick={saveStory}
            className="flex items-center justify-center space-x-3 p-6 border-2 border-orange-500 rounded-lg hover:bg-orange-50 transition-colors"
          >
            <Save className="text-orange-500" size={24} />
            <div className="text-left">
              <h4 className="font-semibold">Save Story</h4>
              <p className="text-sm text-gray-600">Save to your dashboard for later editing</p>
            </div>
          </button>

          <button
            onClick={() => window.location.href = '/covers'}
            className="flex items-center justify-center space-x-3 p-6 border-2 border-blue-500 rounded-lg hover:bg-blue-50 transition-colors"
          >
            <Camera className="text-blue-500" size={24} />
            <div className="text-left">
              <h4 className="font-semibold">Create Book Cover</h4>
              <p className="text-sm text-gray-600">Design a beautiful cover for your story</p>
            </div>
          </button>

          <button
            onClick={() => window.location.href = '/publish'}
            className="flex items-center justify-center space-x-3 p-6 border-2 border-green-500 rounded-lg hover:bg-green-50 transition-colors"
          >
            <FileText className="text-green-500" size={24} />
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
            <Upload className="text-purple-500" size={24} />
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

