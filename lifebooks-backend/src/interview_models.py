from models import db
from datetime import datetime, timezone
import json

class InterviewSession(db.Model):
    __tablename__ = 'interview_sessions'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False, index=True)
    
    # Session details
    topic = db.Column(db.String(500))  # What the user wants to talk about
    session_type = db.Column(db.String(50), default='trial')  # trial, full
    status = db.Column(db.String(50), default='active')  # active, completed, paused
    
    # Progress tracking
    current_question = db.Column(db.Integer, default=0)
    total_questions = db.Column(db.Integer, default=5)
    questions_completed = db.Column(db.Integer, default=0)
    
    # Metadata
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
    completed_at = db.Column(db.DateTime)
    
    # Relationships
    questions = db.relationship('InterviewQuestion', backref='session', lazy=True, cascade='all, delete-orphan')
    responses = db.relationship('InterviewResponse', backref='session', lazy=True, cascade='all, delete-orphan')
    
    def to_dict(self):
        return {
            'id': self.id,
            'topic': self.topic,
            'session_type': self.session_type,
            'status': self.status,
            'current_question': self.current_question,
            'total_questions': self.total_questions,
            'questions_completed': self.questions_completed,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat(),
            'completed_at': self.completed_at.isoformat() if self.completed_at else None
        }

class InterviewQuestion(db.Model):
    __tablename__ = 'interview_questions'
    
    id = db.Column(db.Integer, primary_key=True)
    session_id = db.Column(db.Integer, db.ForeignKey('interview_sessions.id'), nullable=False, index=True)
    
    # Question details
    question_number = db.Column(db.Integer, nullable=False)
    question_text = db.Column(db.Text, nullable=False)
    question_type = db.Column(db.String(50), default='open')  # open, follow_up, clarifying
    context = db.Column(db.Text)  # Context from previous answers
    
    # AI generation details
    generated_by = db.Column(db.String(50), default='ai')
    generation_prompt = db.Column(db.Text)
    
    # Metadata
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    asked_at = db.Column(db.DateTime)
    
    def to_dict(self):
        return {
            'id': self.id,
            'question_number': self.question_number,
            'question_text': self.question_text,
            'question_type': self.question_type,
            'context': self.context,
            'created_at': self.created_at.isoformat(),
            'asked_at': self.asked_at.isoformat() if self.asked_at else None
        }

class InterviewResponse(db.Model):
    __tablename__ = 'interview_responses'
    
    id = db.Column(db.Integer, primary_key=True)
    session_id = db.Column(db.Integer, db.ForeignKey('interview_sessions.id'), nullable=False, index=True)
    question_id = db.Column(db.Integer, db.ForeignKey('interview_questions.id'), nullable=False, index=True)
    
    # Response details
    response_text = db.Column(db.Text)
    response_type = db.Column(db.String(50), default='text')  # text, voice, mixed
    word_count = db.Column(db.Integer, default=0)
    
    # Voice recording details (if applicable)
    voice_recording_id = db.Column(db.Integer, db.ForeignKey('voice_recordings.id'), nullable=True)
    
    # AI analysis
    sentiment = db.Column(db.String(50))  # positive, neutral, negative
    key_themes = db.Column(db.Text)  # JSON string of themes
    follow_up_suggestions = db.Column(db.Text)  # JSON string of follow-up questions
    
    # Metadata
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
    
    def update_word_count(self):
        if self.response_text:
            self.word_count = len(self.response_text.split())
        else:
            self.word_count = 0
    
    def get_key_themes(self):
        if self.key_themes:
            try:
                return json.loads(self.key_themes)
            except:
                return []
        return []
    
    def set_key_themes(self, themes_list):
        self.key_themes = json.dumps(themes_list)
    
    def get_follow_up_suggestions(self):
        if self.follow_up_suggestions:
            try:
                return json.loads(self.follow_up_suggestions)
            except:
                return []
        return []
    
    def set_follow_up_suggestions(self, suggestions_list):
        self.follow_up_suggestions = json.dumps(suggestions_list)
    
    def to_dict(self):
        return {
            'id': self.id,
            'response_text': self.response_text,
            'response_type': self.response_type,
            'word_count': self.word_count,
            'sentiment': self.sentiment,
            'key_themes': self.get_key_themes(),
            'follow_up_suggestions': self.get_follow_up_suggestions(),
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat()
        }

