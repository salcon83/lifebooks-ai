import os
import io
import datetime
import jwt
import openai
import stripe
import json
import tempfile
from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from werkzeug.utils import secure_filename
from werkzeug.security import generate_password_hash, check_password_hash

# Initialize Flask app
app = Flask(__name__)
CORS(app, 
     origins=["*"],
     methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
     allow_headers=["Content-Type", "Authorization"])

# Add OPTIONS handler for preflight requests
@app.before_request
def handle_preflight():
    if request.method == "OPTIONS":
        response = jsonify({})
        response.headers.add("Access-Control-Allow-Origin", "*")
        response.headers.add('Access-Control-Allow-Headers', "*")
        response.headers.add('Access-Control-Allow-Methods', "*")
        return response

# Configuration
app.config['SECRET_KEY'] = os.environ.get('JWT_SECRET_KEY', 'dev-secret-key-change-in-production')
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///lifebooks.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config["MAX_CONTENT_LENGTH"] = 50 * 1024 * 1024  # 50MB max file size

# Initialize database
db = SQLAlchemy(app)

# API Keys
openai.api_key = os.environ.get("OPENAI_API_KEY")
stripe.api_key = os.environ.get("STRIPE_SECRET_KEY")

# Subscription plans
SUBSCRIPTION_PLANS = {
    'trial': {
        'name': 'Free Trial',
        'price': 0,
        'ai_interviews': 5,
        'ai_enhancements': 10,
        'book_exports': 1,
        'voice_recordings': 5
    },
    'pro': {
        'name': 'Lifebooks Pro',
        'price': 10.00,  # €10/month
        'ai_interviews': -1,  # unlimited
        'ai_enhancements': -1,
        'book_exports': -1,
        'voice_recordings': -1
    }
}

# Database Models
class User(db.Model):
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(255), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(255), nullable=False)
    
    # Subscription details
    subscription_plan = db.Column(db.String(50), default='trial')
    subscription_status = db.Column(db.String(50), default='active')
    stripe_customer_id = db.Column(db.String(255))
    subscription_start = db.Column(db.DateTime, default=lambda: datetime.datetime.now(datetime.timezone.utc))
    subscription_end = db.Column(db.DateTime)
    
    # Usage tracking (resets monthly)
    monthly_ai_interviews = db.Column(db.Integer, default=0)
    monthly_ai_enhancements = db.Column(db.Integer, default=0)
    monthly_book_exports = db.Column(db.Integer, default=0)
    monthly_voice_recordings = db.Column(db.Integer, default=0)
    usage_reset_date = db.Column(db.DateTime, default=lambda: datetime.datetime.now(datetime.timezone.utc))
    
    # Metadata
    created_at = db.Column(db.DateTime, default=lambda: datetime.datetime.now(datetime.timezone.utc))
    updated_at = db.Column(db.DateTime, default=lambda: datetime.datetime.now(datetime.timezone.utc), onupdate=lambda: datetime.datetime.now(datetime.timezone.utc))
    last_login = db.Column(db.DateTime)
    
    def set_password(self, password):
        self.password_hash = generate_password_hash(password)
    
    def check_password(self, password):
        return check_password_hash(self.password_hash, password)
    
    def check_usage_limit(self, feature):
        # Reset monthly usage if needed
        now = datetime.datetime.now(datetime.timezone.utc)
        
        # Ensure usage_reset_date is timezone-aware
        if self.usage_reset_date is None:
            self.usage_reset_date = now
            db.session.commit()
        elif self.usage_reset_date.tzinfo is None:
            # Convert naive datetime to timezone-aware
            self.usage_reset_date = self.usage_reset_date.replace(tzinfo=datetime.timezone.utc)
            db.session.commit()
        
        if now >= self.usage_reset_date + datetime.timedelta(days=30):
            self.monthly_ai_interviews = 0
            self.monthly_ai_enhancements = 0
            self.monthly_book_exports = 0
            self.monthly_voice_recordings = 0
            self.usage_reset_date = now
            db.session.commit()
        
        plan = SUBSCRIPTION_PLANS.get(self.subscription_plan, SUBSCRIPTION_PLANS['trial'])
        limit = plan.get(feature, 0)
        
        if limit == -1:  # unlimited
            return True, "Unlimited usage"
        
        current_usage = getattr(self, f'monthly_{feature}', 0)
        if current_usage >= limit:
            return False, f"Monthly limit of {limit} {feature} reached. Upgrade to Pro for unlimited access."
        
        return True, f"Usage: {current_usage}/{limit}"
    
    def increment_usage(self, feature):
        current_value = getattr(self, f'monthly_{feature}', 0)
        setattr(self, f'monthly_{feature}', current_value + 1)
        db.session.commit()
    
    def to_dict(self):
        return {
            'id': self.id,
            'email': self.email,
            'subscription_plan': self.subscription_plan,
            'subscription_status': self.subscription_status,
            'created_at': self.created_at.isoformat(),
            'usage': {
                'ai_interviews': self.monthly_ai_interviews,
                'ai_enhancements': self.monthly_ai_enhancements,
                'book_exports': self.monthly_book_exports,
                'voice_recordings': self.monthly_voice_recordings
            }
        }

class Story(db.Model):
    __tablename__ = 'stories'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False, index=True)
    
    title = db.Column(db.String(500), nullable=False)
    content = db.Column(db.Text)
    summary = db.Column(db.Text)
    tags = db.Column(db.Text)  # JSON string
    word_count = db.Column(db.Integer, default=0)
    
    # Auto-save functionality
    auto_save_content = db.Column(db.Text)
    last_auto_save = db.Column(db.DateTime)
    
    # Metadata
    created_at = db.Column(db.DateTime, default=lambda: datetime.datetime.now(datetime.timezone.utc))
    updated_at = db.Column(db.DateTime, default=lambda: datetime.datetime.now(datetime.timezone.utc), onupdate=lambda: datetime.datetime.now(datetime.timezone.utc))
    
    def update_word_count(self):
        if self.content:
            self.word_count = len(self.content.split())
        else:
            self.word_count = 0
    
    def auto_save_content_func(self, content):
        self.auto_save_content = content
        self.last_auto_save = datetime.datetime.now(datetime.timezone.utc)
        db.session.commit()
    
    def get_tags_list(self):
        if self.tags:
            try:
                return json.loads(self.tags)
            except:
                return []
        return []
    
    def set_tags_list(self, tags_list):
        self.tags = json.dumps(tags_list)
    
    def to_dict(self):
        return {
            'id': self.id,
            'title': self.title,
            'content': self.content,
            'summary': self.summary,
            'tags': self.get_tags_list(),
            'word_count': self.word_count,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat(),
            'last_auto_save': self.last_auto_save.isoformat() if self.last_auto_save else None
        }

# Helper functions
def generate_jwt_token(user_id):
    payload = {
        'user_id': user_id,
        'exp': datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(days=7)
    }
    return jwt.encode(payload, app.config['SECRET_KEY'], algorithm='HS256')

def get_user_from_token(request):
    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        return None
    
    token = auth_header.split(' ')[1]
    
    # Allow demo access with specific demo token
    if token == 'demo-token':
        # Return demo user or create one if not exists
        demo_user = User.query.filter_by(email='demo@lifebooks.ai').first()
        if not demo_user:
            demo_user = User(
                email='demo@lifebooks.ai',
                password_hash='demo_hash',
                subscription_plan='pro',
                subscription_status='active'
            )
            db.session.add(demo_user)
            db.session.commit()
        return demo_user
    
    try:
        payload = jwt.decode(token, app.config['SECRET_KEY'], algorithms=['HS256'])
        user = User.query.get(payload['user_id'])
        return user
    except:
        return None

def allowed_audio_file(filename):
    ALLOWED_EXTENSIONS = {'mp3', 'wav', 'mp4', 'm4a', 'webm', 'flac'}
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

# API Routes
@app.route("/api/register", methods=["POST"])
def register():
    data = request.get_json()
    email = data.get("email", "").strip().lower()
    password = data.get("password", "")
    
    if not email or not password:
        return jsonify({"message": "Email and password are required"}), 400
    
    if len(password) < 6:
        return jsonify({"message": "Password must be at least 6 characters"}), 400
    
    # Check if user already exists
    existing_user = User.query.filter_by(email=email).first()
    if existing_user:
        return jsonify({"message": "User already exists"}), 400
    
    try:
        # Create new user
        user = User(email=email)
        user.set_password(password)
        
        db.session.add(user)
        db.session.commit()
        
        # Generate JWT token
        token = generate_jwt_token(user.id)
        
        return jsonify({
            "message": "Registration successful",
            "token": token,
            "user": user.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({
            "message": "Registration failed",
            "error": str(e)
        }), 500

@app.route("/api/login", methods=["POST"])
def login():
    data = request.get_json()
    email = data.get("email", "").strip().lower()
    password = data.get("password", "")
    
    if not email or not password:
        return jsonify({"message": "Email and password are required"}), 400
    
    user = User.query.filter_by(email=email).first()
    
    if not user or not user.check_password(password):
        return jsonify({"message": "Invalid email or password"}), 401
    
    try:
        # Update last login
        user.last_login = datetime.datetime.now(datetime.timezone.utc)
        db.session.commit()
        
        # Generate JWT token
        token = generate_jwt_token(user.id)
        
        return jsonify({
            "message": "Login successful",
            "token": token,
            "user": user.to_dict()
        }), 200
        
    except Exception as e:
        return jsonify({
            "message": "Login failed",
            "error": str(e)
        }), 500

@app.route("/api/user/profile", methods=["GET"])
def get_profile():
    user = get_user_from_token(request)
    if not user:
        return jsonify({"message": "Authentication required"}), 401
    
    return jsonify({"user": user.to_dict()}), 200

# Simple demo endpoints for testing
@app.route("/api/demo/interview", methods=["POST"])
def demo_interview():
    data = request.get_json()
    topic = data.get("topic", "your life")
    
    # Simple demo questions
    questions = [
        f"Tell me about a memorable moment related to {topic}.",
        f"How did {topic} make you feel?",
        f"What details do you remember most clearly?",
        f"What impact did {topic} have on your life?",
        f"What would you want others to know about {topic}?"
    ]
    
    return jsonify({
        "message": "Demo interview started",
        "questions": questions,
        "topic": topic
    }), 200

@app.route("/api/demo/pdf", methods=["POST"])
def demo_pdf():
    data = request.get_json()
    responses = data.get("responses", [])
    topic = data.get("topic", "Your Story")
    
    # Create simple PDF content
    from reportlab.lib.pagesizes import letter
    from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer
    from reportlab.lib.styles import getSampleStyleSheet
    
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=letter)
    styles = getSampleStyleSheet()
    
    story = []
    story.append(Paragraph(f"Your Life Story: {topic}", styles['Title']))
    story.append(Spacer(1, 20))
    
    for i, response in enumerate(responses, 1):
        story.append(Paragraph(f"Question {i}: {response}", styles['Normal']))
        story.append(Spacer(1, 10))
    
    doc.build(story)
    pdf_content = buffer.getvalue()
    buffer.close()
    
    return send_file(
        io.BytesIO(pdf_content),
        mimetype='application/pdf',
        as_attachment=True,
        download_name=f'lifebooks_demo_{topic.replace(" ", "_")}.pdf'
    )

# Health check
@app.route("/api/health", methods=["GET"])
def health_check():
    return jsonify({"status": "healthy", "timestamp": datetime.datetime.now(datetime.timezone.utc).isoformat()}), 200

# Simple test endpoint
@app.route("/api/test", methods=["GET", "POST"])
def test_endpoint():
    return jsonify({
        "message": "API is working!",
        "method": request.method,
        "timestamp": datetime.datetime.now(datetime.timezone.utc).isoformat()
    }), 200

# Initialize database tables
def init_db():
    with app.app_context():
        db.create_all()

# Initialize database on import
init_db()

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)



# Audio transcription endpoint using OpenAI Whisper
@app.route("/api/transcribe", methods=["POST"])
def transcribe_audio():
    user = get_user_from_token(request)
    if not user:
        return jsonify({"message": "Authentication required"}), 401
    
    # Skip usage limits for demo users to avoid datetime issues
    if user.email != 'demo@lifebooks.ai':
        # Check usage limits for regular users
        can_use, message = user.check_usage_limit('voice_recordings')
        if not can_use:
            return jsonify({"message": message}), 429
    
    # Check if audio file is present
    if 'audio' not in request.files:
        return jsonify({"message": "No audio file provided"}), 400
    
    audio_file = request.files['audio']
    if audio_file.filename == '':
        return jsonify({"message": "No audio file selected"}), 400
    
    if not allowed_audio_file(audio_file.filename):
        return jsonify({"message": "Invalid audio file format. Supported formats: mp3, wav, mp4, m4a, webm, flac"}), 400
    
    try:
        # Create a temporary file to save the audio
        with tempfile.NamedTemporaryFile(delete=False, suffix='.wav') as temp_file:
            audio_file.save(temp_file.name)
            
            # Use OpenAI Whisper API for transcription
            with open(temp_file.name, 'rb') as audio_data:
                transcript = openai.Audio.transcribe(
                    model="whisper-1",
                    file=audio_data,
                    response_format="text"
                )
            
            # Clean up temporary file
            os.unlink(temp_file.name)
            
            # Increment usage counter
            user.increment_usage('voice_recordings')
            
            return jsonify({
                "message": "Transcription successful",
                "transcription": transcript,
                "usage": f"Voice recordings used: {user.monthly_voice_recordings}"
            }), 200
            
    except Exception as e:
        # Clean up temporary file if it exists
        try:
            os.unlink(temp_file.name)
        except:
            pass
            
        return jsonify({
            "message": "Transcription failed",
            "error": str(e)
        }), 500

# Story generation endpoint using OpenAI GPT
@app.route("/api/generate-story", methods=["POST"])
def generate_story():
    user = get_user_from_token(request)
    if not user:
        return jsonify({"message": "Authentication required"}), 401
    
    # Check usage limits
    can_use, message = user.check_usage_limit('ai_enhancements')
    if not can_use:
        return jsonify({"message": message}), 429
    
    data = request.get_json()
    story_type = data.get("storyType", "")
    title = data.get("title", "")
    answers = data.get("answers", {})
    uploaded_files = data.get("uploadedFiles", [])
    
    if not title or not answers:
        return jsonify({"message": "Story title and answers are required"}), 400
    
    try:
        # Create a prompt for story generation
        prompt = f"""
        Create a compelling {story_type} story titled "{title}" based on the following interview responses:
        
        """
        
        for question_index, answer in answers.items():
            prompt += f"Q{int(question_index) + 1}: {answer}\n\n"
        
        prompt += """
        Please write this as a well-structured, engaging narrative that flows naturally. 
        Use descriptive language and maintain the authentic voice of the storyteller.
        Format the story with proper paragraphs and make it suitable for a book.
        """
        
        # Use OpenAI GPT to generate the story
        response = openai.ChatCompletion.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": "You are a professional ghostwriter specializing in personal narratives and life stories. Create engaging, well-structured stories that honor the authentic voice of the storyteller."},
                {"role": "user", "content": prompt}
            ],
            max_tokens=2000,
            temperature=0.7
        )
        
        generated_story = response.choices[0].message.content
        
        # Increment usage counter
        user.increment_usage('ai_enhancements')
        
        return jsonify({
            "message": "Story generated successfully",
            "story": generated_story,
            "usage": f"AI enhancements used: {user.monthly_ai_enhancements}"
        }), 200
        
    except Exception as e:
        return jsonify({
            "message": "Story generation failed",
            "error": str(e)
        }), 500


# Text enhancement endpoint
@app.route('/api/enhance-text', methods=['POST'])
def enhance_text():
    try:
        data = request.get_json()
        text = data.get('text', '')
        enhancement_type = data.get('enhancement_type', 'general')
        
        if not text:
            return jsonify({'error': 'No text provided'}), 400
        
        # Use OpenAI to enhance the text
        import openai
        openai.api_key = os.getenv('OPENAI_API_KEY')
        
        if enhancement_type == 'storytelling':
            prompt = f"""Please enhance the following text for storytelling purposes. Improve grammar, clarity, and narrative flow while preserving the authentic voice and meaning. Make it more engaging and well-structured for a life story:

Text to enhance: {text}

Enhanced version:"""
        else:
            prompt = f"""Please improve the following text for clarity, grammar, and readability while preserving the original meaning and voice:

Text to enhance: {text}

Improved version:"""
        
        response = openai.Completion.create(
            engine="text-davinci-003",
            prompt=prompt,
            max_tokens=500,
            temperature=0.7
        )
        
        enhanced_text = response.choices[0].text.strip()
        
        return jsonify({
            'enhanced_text': enhanced_text,
            'original_text': text,
            'enhancement_type': enhancement_type
        })
        
    except Exception as e:
        print(f"Enhancement error: {str(e)}")
        return jsonify({'error': 'Enhancement failed', 'details': str(e)}), 500



# AI Interviewer System Integration
import json
import uuid
from datetime import datetime

# In-memory storage for AI interview sessions (in production, use a database)
ai_sessions = {}

@app.route("/api/lifebooks-integration", methods=["POST"])
def lifebooks_integration():
    user = get_user_from_token(request)
    if not user:
        return jsonify({"message": "Authentication required"}), 401
    
    data = request.get_json()
    action = data.get("action")
    
    if action == "start_ai_interview":
        # Create new AI interview session
        session_id = str(uuid.uuid4())
        
        # Load the ghostwriter system prompt
        try:
            with open('/home/ubuntu/lifebooks_ai_system/prompts/ghostwriter_system_prompt.txt', 'r') as f:
                system_prompt = f.read()
        except FileNotFoundError:
            system_prompt = """You are a professional ghostwriter who specializes in helping people tell their most important stories. You conduct empathetic, caring interviews that feel like conversations with a trusted friend who happens to be an expert storyteller.

Your approach is warm, patient, and deeply curious about the human experience. You ask thoughtful follow-up questions, validate emotions, and help people discover the deeper meaning in their experiences."""
        
        # Initialize session
        ai_sessions[session_id] = {
            'user_id': user.id,
            'created_at': datetime.utcnow().isoformat(),
            'phase': 'discovery',
            'story_type': None,
            'themes': [],
            'messages': [],
            'system_prompt': system_prompt
        }
        
        # Generate initial greeting
        initial_message = """Hello! I'm so glad you're here. I'm a professional ghostwriter who specializes in helping people tell their most important stories.

I want you to know that this is a safe space where your story - whatever it is - will be honored and treated with the care it deserves. There are no wrong answers, no judgment, and we can go at whatever pace feels right for you.

My role is to be your guide and companion as we explore your experiences together. I'll ask thoughtful questions, listen deeply, and help you discover the beauty and meaning in your own story.

Let's begin with something simple: What brings you here today? What's calling you to tell a story?"""
        
        return jsonify({
            "success": True,
            "session_id": session_id,
            "initial_message": initial_message
        })
    
    return jsonify({"message": "Invalid action"}), 400

@app.route("/api/process-response", methods=["POST"])
def process_response():
    user = get_user_from_token(request)
    if not user:
        return jsonify({"message": "Authentication required"}), 401
    
    data = request.get_json()
    session_id = data.get("session_id")
    message = data.get("message")
    
    if not session_id or session_id not in ai_sessions:
        return jsonify({"message": "Invalid session"}), 400
    
    session = ai_sessions[session_id]
    
    # Add user message to session
    session['messages'].append({
        'role': 'user',
        'content': message,
        'timestamp': datetime.utcnow().isoformat()
    })
    
    try:
        # Use OpenAI to generate AI response
        import openai
        openai.api_key = os.getenv('OPENAI_API_KEY')
        
        # Build conversation context
        messages = [
            {"role": "system", "content": session['system_prompt']},
        ]
        
        # Add recent conversation history
        for msg in session['messages'][-10:]:  # Last 10 messages for context
            messages.append({
                "role": "user" if msg['role'] == 'user' else "assistant",
                "content": msg['content']
            })
        
        # Generate response
        response = openai.ChatCompletion.create(
            model="gpt-3.5-turbo",
            messages=messages,
            max_tokens=500,
            temperature=0.8
        )
        
        ai_response = response.choices[0].message.content.strip()
        
        # Add AI response to session
        session['messages'].append({
            'role': 'ai',
            'content': ai_response,
            'timestamp': datetime.utcnow().isoformat()
        })
        
        # Analyze response to update session state
        session = analyze_and_update_session(session, message, ai_response)
        
        return jsonify({
            "message": ai_response,
            "phase": session['phase'],
            "story_type": session['story_type'],
            "themes": session['themes']
        })
        
    except Exception as e:
        print(f"AI response error: {str(e)}")
        return jsonify({"message": "I'm having trouble processing your response right now. Could you please try again?"}), 500

def analyze_and_update_session(session, user_message, ai_response):
    """Analyze the conversation to update session state"""
    
    # Simple keyword-based analysis (in production, use more sophisticated NLP)
    user_lower = user_message.lower()
    
    # Detect story type
    if not session['story_type']:
        if any(word in user_lower for word in ['life story', 'autobiography', 'whole life', 'childhood']):
            session['story_type'] = 'autobiography'
        elif any(word in user_lower for word in ['memoir', 'experience', 'period', 'time when']):
            session['story_type'] = 'memoir'
        elif any(word in user_lower for word in ['family', 'heritage', 'ancestors', 'generations']):
            session['story_type'] = 'family_history'
        elif any(word in user_lower for word in ['travel', 'journey', 'trip', 'adventure']):
            session['story_type'] = 'travel_stories'
        elif any(word in user_lower for word in ['career', 'work', 'professional', 'job']):
            session['story_type'] = 'professional_journey'
    
    # Detect themes
    theme_keywords = {
        'resilience': ['overcome', 'challenge', 'difficult', 'struggle', 'persevere'],
        'love': ['love', 'relationship', 'family', 'marriage', 'children'],
        'growth': ['learn', 'grow', 'change', 'transform', 'discover'],
        'loss': ['loss', 'grief', 'death', 'goodbye', 'miss'],
        'achievement': ['success', 'accomplish', 'achieve', 'proud', 'goal'],
        'courage': ['brave', 'courage', 'fear', 'risk', 'bold']
    }
    
    for theme, keywords in theme_keywords.items():
        if any(keyword in user_lower for keyword in keywords) and theme not in session['themes']:
            session['themes'].append(theme)
    
    # Update phase based on conversation length and content
    message_count = len(session['messages'])
    if message_count < 6:
        session['phase'] = 'discovery'
    elif message_count < 12:
        session['phase'] = 'exploration'
    elif message_count < 18:
        session['phase'] = 'deepening'
    elif message_count < 24:
        session['phase'] = 'integration'
    else:
        session['phase'] = 'wisdom_extraction'
    
    return session

@app.route("/api/generate-outline", methods=["POST"])
def generate_outline():
    user = get_user_from_token(request)
    if not user:
        return jsonify({"message": "Authentication required"}), 401
    
    data = request.get_json()
    session_id = data.get("session_id")
    
    if not session_id or session_id not in ai_sessions:
        return jsonify({"message": "Invalid session"}), 400
    
    session = ai_sessions[session_id]
    
    try:
        # Extract user responses from conversation
        user_responses = [msg['content'] for msg in session['messages'] if msg['role'] == 'user']
        conversation_text = '\n\n'.join(user_responses)
        
        # Use OpenAI to generate book outline
        import openai
        openai.api_key = os.getenv('OPENAI_API_KEY')
        
        prompt = f"""Based on this interview conversation, create a detailed book outline:

Story Type: {session['story_type'] or 'Personal Story'}
Themes: {', '.join(session['themes'])}

Conversation Content:
{conversation_text}

Please create a book outline with:
1. A compelling title
2. Book type and estimated length
3. 6-8 chapter titles with brief descriptions
4. Key themes to explore

Format as JSON with this structure:
{{
    "title": "Book Title",
    "book_type": "memoir/autobiography/etc",
    "estimated_length": "pages/words",
    "themes": ["theme1", "theme2"],
    "chapters": [
        {{"title": "Chapter Title", "theme": "What this chapter explores"}}
    ]
}}"""
        
        response = openai.ChatCompletion.create(
            model="gpt-3.5-turbo",
            messages=[{"role": "user", "content": prompt}],
            max_tokens=1000,
            temperature=0.7
        )
        
        outline_text = response.choices[0].message.content.strip()
        
        # Try to parse as JSON, fallback to text if needed
        try:
            outline = json.loads(outline_text)
        except:
            # Fallback outline structure
            outline = {
                "title": f"My {session['story_type'] or 'Personal'} Story",
                "book_type": session['story_type'] or 'memoir',
                "estimated_length": "150-200 pages",
                "themes": session['themes'],
                "chapters": [
                    {"title": "The Beginning", "theme": "Setting the stage for your story"},
                    {"title": "The Journey", "theme": "Key experiences and turning points"},
                    {"title": "Lessons Learned", "theme": "Wisdom gained from your experiences"},
                    {"title": "Looking Forward", "theme": "How your story continues"}
                ]
            }
        
        return jsonify(outline)
        
    except Exception as e:
        print(f"Outline generation error: {str(e)}")
        return jsonify({"message": "Failed to generate outline"}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5001, debug=True)

