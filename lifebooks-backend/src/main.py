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
    
    # Check usage limits
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

