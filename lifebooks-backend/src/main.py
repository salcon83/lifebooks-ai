from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import os
import sqlite3
import hashlib
import jwt
import datetime
from functools import wraps
import openai
from werkzeug.utils import secure_filename
import json

app = Flask(__name__, static_folder='static')
CORS(app)

# Configuration
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'lifebooks_secret_2024_secure')
app.config['UPLOAD_FOLDER'] = 'uploads'
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max file size

# OpenAI configuration
openai.api_key = os.environ.get('OPENAI_API_KEY')

# Database initialization
def init_db():
    conn = sqlite3.connect('lifebooks.db')
    cursor = conn.cursor()
    
    # Users table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            name TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # Stories table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS stories (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            title TEXT NOT NULL,
            content TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id)
        )
    ''')
    
    # Audio files table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS audio_files (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            story_id INTEGER,
            filename TEXT NOT NULL,
            transcript TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id),
            FOREIGN KEY (story_id) REFERENCES stories (id)
        )
    ''')
    
    # Book covers table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS book_covers (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            story_id INTEGER,
            cover_url TEXT,
            style TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id),
            FOREIGN KEY (story_id) REFERENCES stories (id)
        )
    ''')
    
    conn.commit()
    conn.close()

# Authentication decorator
def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = request.headers.get('Authorization')
        if not token:
            return jsonify({'message': 'Token is missing'}), 401
        
        try:
            if token.startswith('Bearer '):
                token = token[7:]
            data = jwt.decode(token, app.config['SECRET_KEY'], algorithms=['HS256'])
            current_user_id = data['user_id']
        except:
            return jsonify({'message': 'Token is invalid'}), 401
        
        return f(current_user_id, *args, **kwargs)
    return decorated

# Routes
@app.route('/')
def serve_frontend():
    return send_from_directory(app.static_folder, 'index.html')

@app.route('/<path:path>')
def serve_static(path):
    return send_from_directory(app.static_folder, path)

@app.route('/api/register', methods=['POST'])
def register():
    try:
        data = request.get_json()
        email = data.get('email')
        password = data.get('password')
        name = data.get('name', '')
        
        if not email or not password:
            return jsonify({'message': 'Email and password are required'}), 400
        
        # Hash password
        password_hash = hashlib.sha256(password.encode()).hexdigest()
        
        conn = sqlite3.connect('lifebooks.db')
        cursor = conn.cursor()
        
        try:
            cursor.execute('INSERT INTO users (email, password_hash, name) VALUES (?, ?, ?)',
                         (email, password_hash, name))
            conn.commit()
            user_id = cursor.lastrowid
            
            # Generate JWT token
            token = jwt.encode({
                'user_id': user_id,
                'exp': datetime.datetime.utcnow() + datetime.timedelta(days=30)
            }, app.config['SECRET_KEY'], algorithm='HS256')
            
            return jsonify({
                'message': 'User registered successfully',
                'token': token,
                'user': {'id': user_id, 'email': email, 'name': name}
            }), 201
            
        except sqlite3.IntegrityError:
            return jsonify({'message': 'Email already exists'}), 400
        finally:
            conn.close()
            
    except Exception as e:
        return jsonify({'message': 'Registration failed', 'error': str(e)}), 500

@app.route('/api/login', methods=['POST'])
def login():
    try:
        data = request.get_json()
        email = data.get('email')
        password = data.get('password')
        
        if not email or not password:
            return jsonify({'message': 'Email and password are required'}), 400
        
        password_hash = hashlib.sha256(password.encode()).hexdigest()
        
        conn = sqlite3.connect('lifebooks.db')
        cursor = conn.cursor()
        
        cursor.execute('SELECT id, email, name FROM users WHERE email = ? AND password_hash = ?',
                      (email, password_hash))
        user = cursor.fetchone()
        conn.close()
        
        if user:
            token = jwt.encode({
                'user_id': user[0],
                'exp': datetime.datetime.utcnow() + datetime.timedelta(days=30)
            }, app.config['SECRET_KEY'], algorithm='HS256')
            
            return jsonify({
                'message': 'Login successful',
                'token': token,
                'user': {'id': user[0], 'email': user[1], 'name': user[2]}
            }), 200
        else:
            return jsonify({'message': 'Invalid credentials'}), 401
            
    except Exception as e:
        return jsonify({'message': 'Login failed', 'error': str(e)}), 500

@app.route('/api/stories', methods=['GET'])
@token_required
def get_stories(current_user_id):
    try:
        conn = sqlite3.connect('lifebooks.db')
        cursor = conn.cursor()
        
        cursor.execute('''
            SELECT id, title, content, created_at, updated_at 
            FROM stories 
            WHERE user_id = ? 
            ORDER BY updated_at DESC
        ''', (current_user_id,))
        
        stories = []
        for row in cursor.fetchall():
            stories.append({
                'id': row[0],
                'title': row[1],
                'content': row[2],
                'created_at': row[3],
                'updated_at': row[4]
            })
        
        conn.close()
        return jsonify({'stories': stories}), 200
        
    except Exception as e:
        return jsonify({'message': 'Failed to fetch stories', 'error': str(e)}), 500

@app.route('/api/stories', methods=['POST'])
@token_required
def create_story(current_user_id):
    try:
        data = request.get_json()
        title = data.get('title', 'Untitled Story')
        content = data.get('content', '')
        
        conn = sqlite3.connect('lifebooks.db')
        cursor = conn.cursor()
        
        cursor.execute('''
            INSERT INTO stories (user_id, title, content) 
            VALUES (?, ?, ?)
        ''', (current_user_id, title, content))
        
        story_id = cursor.lastrowid
        conn.commit()
        conn.close()
        
        return jsonify({
            'message': 'Story created successfully',
            'story': {
                'id': story_id,
                'title': title,
                'content': content
            }
        }), 201
        
    except Exception as e:
        return jsonify({'message': 'Failed to create story', 'error': str(e)}), 500

@app.route('/api/transcribe', methods=['POST'])
@token_required
def transcribe_audio(current_user_id):
    try:
        if 'audio' not in request.files:
            return jsonify({'message': 'No audio file provided'}), 400
        
        audio_file = request.files['audio']
        if audio_file.filename == '':
            return jsonify({'message': 'No file selected'}), 400
        
        # Save the uploaded file
        filename = secure_filename(audio_file.filename)
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
        audio_file.save(filepath)
        
        # Transcribe using OpenAI Whisper
        if openai.api_key:
            with open(filepath, 'rb') as audio:
                transcript = openai.Audio.transcribe("whisper-1", audio)
            transcript_text = transcript['text']
        else:
            transcript_text = "OpenAI API key not configured. This is a placeholder transcript."
        
        # Clean up the temporary file
        os.remove(filepath)
        
        return jsonify({
            'message': 'Audio transcribed successfully',
            'transcript': transcript_text
        }), 200
        
    except Exception as e:
        return jsonify({'message': 'Transcription failed', 'error': str(e)}), 500

@app.route('/api/covers/generate', methods=['POST'])
@token_required
def generate_cover(current_user_id):
    try:
        data = request.get_json()
        title = data.get('title', 'My Story')
        style = data.get('style', 'modern')
        
        # Simulate cover generation (replace with actual AI generation)
        cover_data = {
            'cover_url': f'/api/covers/placeholder/{style}',
            'style': style,
            'title': title
        }
        
        return jsonify({
            'message': 'Cover generated successfully',
            'cover': cover_data
        }), 200
        
    except Exception as e:
        return jsonify({'message': 'Cover generation failed', 'error': str(e)}), 500

@app.route('/api/publish/amazon', methods=['POST'])
@token_required
def publish_to_amazon(current_user_id):
    try:
        data = request.get_json()
        story_id = data.get('story_id')
        
        # Simulate Amazon publishing (replace with actual KDP integration)
        publication_data = {
            'publication_id': f'amz_{story_id}_{current_user_id}',
            'status': 'submitted',
            'estimated_review_time': '24-48 hours'
        }
        
        return jsonify({
            'message': 'Story submitted to Amazon KDP successfully',
            'publication': publication_data
        }), 200
        
    except Exception as e:
        return jsonify({'message': 'Amazon publishing failed', 'error': str(e)}), 500

if __name__ == '__main__':
    init_db()
    app.run(debug=True, host='0.0.0.0', port=5001)

