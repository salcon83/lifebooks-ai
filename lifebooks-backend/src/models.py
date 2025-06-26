from flask_sqlalchemy import SQLAlchemy
from datetime import datetime, timezone
import bcrypt
import json

db = SQLAlchemy()

class User(db.Model):
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(255), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(255), nullable=False)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
    last_login = db.Column(db.DateTime)
    is_active = db.Column(db.Boolean, default=True)
    
    # Subscription information
    subscription_plan = db.Column(db.String(50), default='free')
    subscription_status = db.Column(db.String(50), default='active')
    stripe_customer_id = db.Column(db.String(255))
    stripe_subscription_id = db.Column(db.String(255))
    subscription_created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    subscription_updated_at = db.Column(db.DateTime)
    
    # Usage tracking
    recordings_this_month = db.Column(db.Integer, default=0)
    ai_enhancements_this_month = db.Column(db.Integer, default=0)
    books_created = db.Column(db.Integer, default=0)
    usage_reset_date = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc).replace(day=1))
    
    # Relationships
    stories = db.relationship('Story', backref='user', lazy=True, cascade='all, delete-orphan')
    voice_recordings = db.relationship('VoiceRecording', backref='user', lazy=True, cascade='all, delete-orphan')
    
    def set_password(self, password):
        """Hash and set password"""
        self.password_hash = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    
    def check_password(self, password):
        """Check if provided password matches hash"""
        return bcrypt.checkpw(password.encode('utf-8'), self.password_hash.encode('utf-8'))
    
    def reset_monthly_usage_if_needed(self):
        """Reset monthly usage counters if it's a new month"""
        now = datetime.now(timezone.utc)
        current_month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        
        if self.usage_reset_date < current_month_start:
            self.recordings_this_month = 0
            self.ai_enhancements_this_month = 0
            self.usage_reset_date = current_month_start
            db.session.commit()
    
    def increment_usage(self, usage_type):
        """Increment usage counter"""
        self.reset_monthly_usage_if_needed()
        
        if usage_type == 'recording':
            self.recordings_this_month += 1
        elif usage_type == 'ai_enhancement':
            self.ai_enhancements_this_month += 1
        elif usage_type == 'book':
            self.books_created += 1
        
        db.session.commit()
    
    def get_usage_limits(self):
        """Get usage limits based on subscription plan"""
        limits = {
            'free': {'recordings': 5, 'ai_enhancements': 10, 'books': 1},
            'pro': {'recordings': -1, 'ai_enhancements': -1, 'books': -1},
            'enterprise': {'recordings': -1, 'ai_enhancements': -1, 'books': -1}
        }
        return limits.get(self.subscription_plan, limits['free'])
    
    def check_usage_limit(self, usage_type):
        """Check if user has reached usage limit"""
        self.reset_monthly_usage_if_needed()
        limits = self.get_usage_limits()
        
        if usage_type == 'recording':
            limit = limits['recordings']
            current = self.recordings_this_month
        elif usage_type == 'ai_enhancement':
            limit = limits['ai_enhancements']
            current = self.ai_enhancements_this_month
        elif usage_type == 'book':
            limit = limits['books']
            current = self.books_created
        else:
            return True, None
        
        if limit == -1:  # Unlimited
            return True, None
        
        if current >= limit:
            return False, f"Monthly {usage_type} limit reached ({limit}). Upgrade to Pro for unlimited access."
        
        return True, None
    
    def to_dict(self):
        """Convert user to dictionary"""
        return {
            'id': self.id,
            'email': self.email,
            'created_at': self.created_at.isoformat(),
            'subscription_plan': self.subscription_plan,
            'subscription_status': self.subscription_status,
            'usage': {
                'recordings_this_month': self.recordings_this_month,
                'ai_enhancements_this_month': self.ai_enhancements_this_month,
                'books_created': self.books_created
            }
        }

class Story(db.Model):
    __tablename__ = 'stories'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False, index=True)
    title = db.Column(db.String(500), nullable=False)
    content = db.Column(db.Text)
    summary = db.Column(db.Text)
    tags = db.Column(db.Text)  # JSON string of tags
    
    # Metadata
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
    last_auto_save = db.Column(db.DateTime)
    
    # Status and settings
    is_published = db.Column(db.Boolean, default=False)
    is_draft = db.Column(db.Boolean, default=True)
    word_count = db.Column(db.Integer, default=0)
    
    # Book generation
    cover_image_url = db.Column(db.String(1000))
    book_format_preferences = db.Column(db.Text)  # JSON string
    
    # Relationships
    voice_recordings = db.relationship('VoiceRecording', backref='story', lazy=True, cascade='all, delete-orphan')
    auto_saves = db.relationship('AutoSave', backref='story', lazy=True, cascade='all, delete-orphan')
    
    def update_word_count(self):
        """Update word count based on content"""
        if self.content:
            self.word_count = len(self.content.split())
        else:
            self.word_count = 0
    
    def get_tags_list(self):
        """Get tags as a list"""
        if self.tags:
            try:
                return json.loads(self.tags)
            except:
                return []
        return []
    
    def set_tags_list(self, tags_list):
        """Set tags from a list"""
        self.tags = json.dumps(tags_list)
    
    def auto_save_content(self, content):
        """Auto-save content with timestamp"""
        self.content = content
        self.update_word_count()
        self.last_auto_save = datetime.now(timezone.utc)
        
        # Create auto-save record
        auto_save = AutoSave(
            story_id=self.id,
            content=content,
            word_count=self.word_count
        )
        db.session.add(auto_save)
        db.session.commit()
    
    def to_dict(self):
        """Convert story to dictionary"""
        return {
            'id': self.id,
            'title': self.title,
            'content': self.content,
            'summary': self.summary,
            'tags': self.get_tags_list(),
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat(),
            'last_auto_save': self.last_auto_save.isoformat() if self.last_auto_save else None,
            'is_published': self.is_published,
            'is_draft': self.is_draft,
            'word_count': self.word_count,
            'cover_image_url': self.cover_image_url
        }

class VoiceRecording(db.Model):
    __tablename__ = 'voice_recordings'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False, index=True)
    story_id = db.Column(db.Integer, db.ForeignKey('stories.id'), nullable=True, index=True)
    
    # Recording details
    filename = db.Column(db.String(500), nullable=False)
    file_path = db.Column(db.String(1000))
    file_size = db.Column(db.Integer)
    duration = db.Column(db.Float)  # Duration in seconds
    format = db.Column(db.String(10))  # mp3, wav, etc.
    
    # Transcription
    transcript = db.Column(db.Text)
    transcript_confidence = db.Column(db.Float)
    processing_status = db.Column(db.String(50), default='pending')  # pending, processing, completed, failed
    
    # Metadata
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    processed_at = db.Column(db.DateTime)
    
    def to_dict(self):
        """Convert recording to dictionary"""
        return {
            'id': self.id,
            'filename': self.filename,
            'duration': self.duration,
            'format': self.format,
            'transcript': self.transcript,
            'processing_status': self.processing_status,
            'created_at': self.created_at.isoformat(),
            'processed_at': self.processed_at.isoformat() if self.processed_at else None
        }

class AutoSave(db.Model):
    __tablename__ = 'auto_saves'
    
    id = db.Column(db.Integer, primary_key=True)
    story_id = db.Column(db.Integer, db.ForeignKey('stories.id'), nullable=False, index=True)
    
    # Content snapshot
    content = db.Column(db.Text)
    word_count = db.Column(db.Integer, default=0)
    
    # Metadata
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    
    def to_dict(self):
        """Convert auto-save to dictionary"""
        return {
            'id': self.id,
            'content': self.content,
            'word_count': self.word_count,
            'created_at': self.created_at.isoformat()
        }

class DataBackup(db.Model):
    __tablename__ = 'data_backups'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False, index=True)
    
    # Backup details
    backup_type = db.Column(db.String(50), nullable=False)  # full, incremental
    file_path = db.Column(db.String(1000))
    file_size = db.Column(db.Integer)
    status = db.Column(db.String(50), default='pending')  # pending, completed, failed
    
    # Metadata
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    completed_at = db.Column(db.DateTime)
    
    def to_dict(self):
        """Convert backup to dictionary"""
        return {
            'id': self.id,
            'backup_type': self.backup_type,
            'file_size': self.file_size,
            'status': self.status,
            'created_at': self.created_at.isoformat(),
            'completed_at': self.completed_at.isoformat() if self.completed_at else None
        }

