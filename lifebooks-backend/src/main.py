from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
import jwt
import datetime
import os
import openai
import tempfile
import io
import stripe
from werkzeug.utils import secure_filename
from models import db, User, Story, VoiceRecording, AutoSave, DataBackup
import json
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Configuration
app.config["SECRET_KEY"] = os.environ.get("SECRET_KEY", "your_super_secret_key")
app.config["MAX_CONTENT_LENGTH"] = 50 * 1024 * 1024  # 50MB max file size

# Database configuration
database_url = os.environ.get("DATABASE_URL")
if database_url and database_url.startswith("postgres://"):
    database_url = database_url.replace("postgres://", "postgresql://", 1)

app.config["SQLALCHEMY_DATABASE_URI"] = database_url or "postgresql://localhost/lifebooks_db"
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

# Initialize database
db.init_app(app)
migrate = Migrate(app, db)

# OpenAI API configuration
openai.api_key = os.environ.get("OPENAI_API_KEY")

# Stripe API configuration
stripe.api_key = os.environ.get("STRIPE_SECRET_KEY")

# Subscription plans
SUBSCRIPTION_PLANS = {
    "trial": {
        "name": "Free Trial",
        "price": 0,
        "features": ["5 AI interview questions", "Sample PDF generation", "Preview experience"],
        "limits": {"interviews": 5, "recordings": 0, "ai_enhancements": 0, "books": 1}
    },
    "pro": {
        "name": "Lifebooks Pro",
        "price": 1000,  # €10.00 in cents
        "stripe_price_id": "price_pro_monthly",
        "features": ["Unlimited AI interviews", "Unlimited voice recordings", "Unlimited AI enhancement", "Basic PDF/EPUB export", "Cloud storage & auto-save"],
        "limits": {"interviews": -1, "recordings": -1, "ai_enhancements": -1, "books": -1}
    }
}

# Pay-per-service add-ons
ADDON_SERVICES = {
    "professional_printing": {
        "name": "Professional Printing",
        "base_price": 1500,  # €15.00 base price
        "price_tiers": {
            "basic": {"price": 1500, "description": "Standard paperback (100-200 pages)"},
            "premium": {"price": 3000, "description": "Hardcover with dust jacket (100-300 pages)"},
            "deluxe": {"price": 5000, "description": "Premium hardcover with photo inserts (unlimited pages)"}
        }
    },
    "amazon_publishing": {
        "name": "Amazon KDP Publishing Service",
        "price": 2500,  # €25.00
        "description": "Professional formatting, cover optimization, and upload assistance"
    },
    "premium_covers": {
        "name": "Premium AI Book Covers",
        "price": 1000,  # €10.00 per cover
        "description": "Custom AI-generated covers with multiple revisions"
    },
    "family_sharing": {
        "name": "Family Sharing",
        "price": 500,  # €5.00 per month
        "description": "Multiple family members can contribute to stories"
    }
}

# Allowed audio file extensions
ALLOWED_AUDIO_EXTENSIONS = {'mp3', 'wav', 'mp4', 'm4a', 'webm', 'flac'}

def allowed_audio_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_AUDIO_EXTENSIONS

def get_user_from_token(request):
    """Extract and validate user from JWT token"""
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        return None

    token = auth_header.split(" ")[1]
    try:
        data = jwt.decode(token, app.config["SECRET_KEY"], algorithms=["HS256"])
        email = data["user"]
        user = User.query.filter_by(email=email, is_active=True).first()
        return user
    except (jwt.ExpiredSignatureError, jwt.InvalidTokenError, IndexError):
        return None

@app.route("/api/register", methods=["POST"])
def register():
    data = request.get_json()
    email = data.get("email")
    password = data.get("password")

    if not email or not password:
        return jsonify({"message": "Email and password are required"}), 400

    if len(password) < 6:
        return jsonify({"message": "Password must be at least 6 characters long"}), 400

    # Check if user already exists
    existing_user = User.query.filter_by(email=email).first()
    if existing_user:
        return jsonify({"message": "User already exists"}), 409

    try:
        # Create new user with trial subscription
        user = User(
            email=email,
            subscription_plan='trial',
            subscription_status='active'
        )
        user.set_password(password)
        
        db.session.add(user)
        db.session.commit()
        
        return jsonify({"message": "User registered successfully"}), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"message": "Registration failed", "error": str(e)}), 500

@app.route("/api/login", methods=["POST"])
def login():
    data = request.get_json()
    email = data.get("email")
    password = data.get("password")

    if not email or not password:
        return jsonify({"message": "Email and password are required"}), 400

    try:
        # Find user in database
        user = User.query.filter_by(email=email).first()
        
        if not user or not user.check_password(password):
            return jsonify({"message": "Invalid email or password"}), 401

        if not user.is_active:
            return jsonify({"message": "Account is deactivated"}), 401

        # Update last login
        user.last_login = datetime.datetime.now(datetime.timezone.utc)
        db.session.commit()

        # Generate JWT token
        token = jwt.encode({
            "user": email,
            "exp": datetime.datetime.utcnow() + datetime.timedelta(hours=24)
        }, app.config["SECRET_KEY"], algorithm="HS256")

        return jsonify({
            "message": "Login successful",
            "token": token,
            "user": user.to_dict()
        }), 200
        
    except Exception as e:
        return jsonify({"message": "Login failed", "error": str(e)}), 500

@app.route("/api/protected", methods=["GET"])
def protected():
    user = get_user_from_token(request)
    if not user:
        return jsonify({"message": "Authentication required"}), 401

    return jsonify({
        "message": f"Hello {user}, you have access to protected data!"
    }), 200

# Real Whisper API Integration for Voice Transcription
@app.route("/api/voice/transcribe", methods=["POST"])
def transcribe_voice():
    user = get_user_from_token(request)
    if not user:
        return jsonify({"message": "Authentication required"}), 401

    # Check usage limits
    can_use, limit_message = user.check_usage_limit("recording")
    if not can_use:
        return jsonify({"message": limit_message}), 403

    # Check if audio file is present
    if 'audio' not in request.files:
        return jsonify({"message": "No audio file provided"}), 400
    
    audio_file = request.files['audio']
    
    if audio_file.filename == '':
        return jsonify({"message": "No audio file selected"}), 400
    
    if not allowed_audio_file(audio_file.filename):
        return jsonify({"message": "Invalid audio file format. Supported: mp3, wav, mp4, m4a, webm, flac"}), 400

    try:
        # Create voice recording record
        recording = VoiceRecording(
            user_id=user.id,
            filename=secure_filename(audio_file.filename),
            format=audio_file.filename.rsplit('.', 1)[1].lower(),
            processing_status='processing'
        )
        db.session.add(recording)
        db.session.commit()

        # Create a temporary file to store the uploaded audio
        with tempfile.NamedTemporaryFile(delete=False, suffix=f".{recording.format}") as temp_file:
            audio_file.save(temp_file.name)
            recording.file_path = temp_file.name
            
            # Use OpenAI Whisper API for transcription
            with open(temp_file.name, "rb") as audio_data:
                transcript = openai.Audio.transcribe(
                    model="whisper-1",
                    file=audio_data,
                    response_format="text"
                )
            
            # Update recording with transcript
            recording.transcript = transcript
            recording.processing_status = 'completed'
            recording.processed_at = datetime.datetime.now(datetime.timezone.utc)
            
            # Clean up temporary file
            os.unlink(temp_file.name)
            
            # Increment usage counter
            user.increment_usage("recording")
            
            db.session.commit()
            
            return jsonify({
                "message": "Transcription successful",
                "transcript": transcript,
                "recording_id": recording.id,
                "user": user.email
            }), 200
            
    except Exception as e:
        # Clean up and mark as failed
        if 'recording' in locals():
            recording.processing_status = 'failed'
            db.session.commit()
        
        # Clean up temporary file if it exists
        try:
            if 'temp_file' in locals():
                os.unlink(temp_file.name)
        except:
            pass
            
        return jsonify({
            "message": "Transcription failed",
            "error": str(e)
        }), 500

# AI Text Enhancement using OpenAI
@app.route("/api/ai/enhance", methods=["POST"])
def enhance_text():
    user = get_user_from_token(request)
    if not user:
        return jsonify({"message": "Authentication required"}), 401

    # Check usage limits
    can_use, limit_message = user.check_usage_limit("ai_enhancement")
    if not can_use:
        return jsonify({"message": limit_message}), 403

    data = request.get_json()
    text = data.get("text", "")
    enhancement_type = data.get("type", "general")  # general, grammar, style, narrative
    
    if not text:
        return jsonify({"message": "No text provided for enhancement"}), 400

    try:
        # Define enhancement prompts based on type
        prompts = {
            "general": "Improve the following text for clarity, grammar, and readability while maintaining the original voice and meaning:",
            "grammar": "Fix grammar, spelling, and punctuation errors in the following text while preserving the original meaning:",
            "style": "Enhance the writing style of the following text to make it more engaging and polished:",
            "narrative": "Improve the narrative flow and storytelling elements of the following text:"
        }
        
        prompt = prompts.get(enhancement_type, prompts["general"])
        
        response = openai.ChatCompletion.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": "You are a professional editor helping to improve personal stories and memoirs. Maintain the author's voice and personal style while making improvements."},
                {"role": "user", "content": f"{prompt}\n\n{text}"}
            ],
            max_tokens=2000,
            temperature=0.3
        )
        
        enhanced_text = response.choices[0].message.content.strip()
        
        # Increment usage counter
        user.increment_usage("ai_enhancement")
        
        return jsonify({
            "message": "Text enhancement successful",
            "original_text": text,
            "enhanced_text": enhanced_text,
            "enhancement_type": enhancement_type
        }), 200
        
    except Exception as e:
        return jsonify({
            "message": "Text enhancement failed",
            "error": str(e)
        }), 500

# Story Management
@app.route("/api/story", methods=["POST"])
def create_story():
    user = get_user_from_token(request)
    if not user:
        return jsonify({"message": "Authentication required"}), 401

    data = request.get_json()
    title = data.get("title", "")
    content = data.get("content", "")
    
    if not title:
        return jsonify({"message": "Story title is required"}), 400

    story_id = f"{user}_{len(stories.get(user, []))}"
    
    if user not in stories:
        stories[user] = []
    
    story = {
        "id": story_id,
        "title": title,
        "content": content,
        "created_at": datetime.datetime.utcnow().isoformat(),
        "updated_at": datetime.datetime.utcnow().isoformat()
    }
    
    stories[user].append(story)
    
    return jsonify({
        "message": "Story created successfully",
        "story": story
    }), 201

@app.route("/api/story", methods=["GET"])
def get_stories():
    user = get_user_from_token(request)
    if not user:
        return jsonify({"message": "Authentication required"}), 401

    user_stories = stories.get(user, [])
    
    return jsonify({
        "message": "Stories retrieved successfully",
        "stories": user_stories
    }), 200

@app.route("/api/story/<story_id>", methods=["PUT"])
def update_story(story_id):
    user = get_user_from_token(request)
    if not user:
        return jsonify({"message": "Authentication required"}), 401

    data = request.get_json()
    
    user_stories = stories.get(user, [])
    story = next((s for s in user_stories if s["id"] == story_id), None)
    
    if not story:
        return jsonify({"message": "Story not found"}), 404
    
    # Update story fields
    if "title" in data:
        story["title"] = data["title"]
    if "content" in data:
        story["content"] = data["content"]
    
    story["updated_at"] = datetime.datetime.utcnow().isoformat()
    
    return jsonify({
        "message": "Story updated successfully",
        "story": story
    }), 200

@app.route("/api/story/<story_id>", methods=["DELETE"])
def delete_story(story_id):
    user = get_user_from_token(request)
    if not user:
        return jsonify({"message": "Authentication required"}), 401

    user_stories = stories.get(user, [])
    story = next((s for s in user_stories if s["id"] == story_id), None)
    
    if not story:
        return jsonify({"message": "Story not found"}), 404
    
    stories[user].remove(story)
    
    return jsonify({
        "message": "Story deleted successfully"
    }), 200

# AI Book Cover Generation using DALL-E
@app.route("/api/cover/generate", methods=["POST"])
def generate_cover():
    user = get_user_from_token(request)
    if not user:
        return jsonify({"message": "Authentication required"}), 401

    data = request.get_json()
    title = data.get("title", "")
    description = data.get("description", "")
    style = data.get("style", "realistic")  # realistic, artistic, vintage, modern
    
    if not title:
        return jsonify({"message": "Book title is required"}), 400

    try:
        # Create a detailed prompt for book cover generation
        prompt = f"Professional book cover design for '{title}'. {description}. Style: {style}. High quality, commercial book cover, typography space for title, professional publishing standard."
        
        response = openai.Image.create(
            prompt=prompt,
            n=1,
            size="1024x1024"
        )
        
        image_url = response['data'][0]['url']
        
        return jsonify({
            "message": "Book cover generated successfully",
            "image_url": image_url,
            "title": title,
            "style": style
        }), 200
        
    except Exception as e:
        return jsonify({
            "message": "Cover generation failed",
            "error": str(e)
        }), 500

# PDF/EPUB Publishing
@app.route("/api/publish", methods=["POST"])
def publish_book():
    user = get_user_from_token(request)
    if not user:
        return jsonify({"message": "Authentication required"}), 401

    # Check usage limits
    can_use, limit_message = check_usage_limits(user, "book")
    if not can_use:
        return jsonify({"message": limit_message}), 403

    data = request.get_json()
    title = data.get("title", "")
    content = data.get("content", "")
    author = data.get("author", user)
    format_type = data.get("format", "pdf")  # pdf, epub, both
    cover_image_url = data.get("cover_image_url", "")
    
    if not title or not content:
        return jsonify({"message": "Title and content are required"}), 400

    try:
        from reportlab.lib.pagesizes import letter, A4
        from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, PageBreak, Image
        from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
        from reportlab.lib.units import inch
        from reportlab.lib.enums import TA_CENTER, TA_JUSTIFY
        import requests
        from io import BytesIO
        
        # Create a temporary directory for the book files
        book_dir = tempfile.mkdtemp()
        
        if format_type in ["pdf", "both"]:
            # Generate PDF
            pdf_filename = f"{title.replace(' ', '_')}.pdf"
            pdf_path = os.path.join(book_dir, pdf_filename)
            
            # Create PDF document
            doc = SimpleDocTemplate(pdf_path, pagesize=A4,
                                  rightMargin=72, leftMargin=72,
                                  topMargin=72, bottomMargin=18)
            
            # Get styles
            styles = getSampleStyleSheet()
            
            # Create custom styles
            title_style = ParagraphStyle(
                'CustomTitle',
                parent=styles['Heading1'],
                fontSize=24,
                spaceAfter=30,
                alignment=TA_CENTER,
                textColor='#2c3e50'
            )
            
            author_style = ParagraphStyle(
                'CustomAuthor',
                parent=styles['Normal'],
                fontSize=14,
                spaceAfter=30,
                alignment=TA_CENTER,
                textColor='#7f8c8d'
            )
            
            content_style = ParagraphStyle(
                'CustomContent',
                parent=styles['Normal'],
                fontSize=12,
                spaceAfter=12,
                alignment=TA_JUSTIFY,
                leftIndent=0,
                rightIndent=0
            )
            
            # Build PDF content
            story = []
            
            # Add cover image if provided
            if cover_image_url:
                try:
                    response = requests.get(cover_image_url)
                    img_data = BytesIO(response.content)
                    img = Image(img_data, width=4*inch, height=6*inch)
                    img.hAlign = 'CENTER'
                    story.append(img)
                    story.append(Spacer(1, 0.5*inch))
                except:
                    pass  # Skip if image can't be loaded
            
            # Add title and author
            story.append(Paragraph(title, title_style))
            story.append(Paragraph(f"by {author}", author_style))
            story.append(PageBreak())
            
            # Add content (split by paragraphs)
            paragraphs = content.split('\n\n')
            for para in paragraphs:
                if para.strip():
                    story.append(Paragraph(para.strip(), content_style))
                    story.append(Spacer(1, 12))
            
            # Build PDF
            doc.build(story)
        
        if format_type in ["epub", "both"]:
            # Generate EPUB (simplified version)
            epub_filename = f"{title.replace(' ', '_')}.epub"
            epub_path = os.path.join(book_dir, epub_filename)
            
            # Create a simple EPUB structure
            import zipfile
            
            with zipfile.ZipFile(epub_path, 'w', zipfile.ZIP_DEFLATED) as epub:
                # Add mimetype
                epub.writestr('mimetype', 'application/epub+zip')
                
                # Add META-INF/container.xml
                container_xml = '''<?xml version="1.0"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
  <rootfiles>
    <rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/>
  </rootfiles>
</container>'''
                epub.writestr('META-INF/container.xml', container_xml)
                
                # Add content.opf
                content_opf = f'''<?xml version="1.0" encoding="UTF-8"?>
<package xmlns="http://www.idpf.org/2007/opf" unique-identifier="BookId" version="2.0">
  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:opf="http://www.idpf.org/2007/opf">
    <dc:title>{title}</dc:title>
    <dc:creator>{author}</dc:creator>
    <dc:identifier id="BookId">lifebooks-{user}-{title.replace(' ', '-').lower()}</dc:identifier>
    <dc:language>en</dc:language>
  </metadata>
  <manifest>
    <item id="ncx" href="toc.ncx" media-type="application/x-dtbncx+xml"/>
    <item id="content" href="content.html" media-type="application/xhtml+xml"/>
  </manifest>
  <spine toc="ncx">
    <itemref idref="content"/>
  </spine>
</package>'''
                epub.writestr('OEBPS/content.opf', content_opf)
                
                # Add toc.ncx
                toc_ncx = f'''<?xml version="1.0" encoding="UTF-8"?>
<ncx xmlns="http://www.daisy.org/z3986/2005/ncx/" version="2005-1">
  <head>
    <meta name="dtb:uid" content="lifebooks-{user}-{title.replace(' ', '-').lower()}"/>
  </head>
  <docTitle>
    <text>{title}</text>
  </docTitle>
  <navMap>
    <navPoint id="navpoint-1" playOrder="1">
      <navLabel>
        <text>{title}</text>
      </navLabel>
      <content src="content.html"/>
    </navPoint>
  </navMap>
</ncx>'''
                epub.writestr('OEBPS/toc.ncx', toc_ncx)
                
                # Add content.html
                content_html = f'''<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.1//EN" "http://www.w3.org/TR/xhtml11/DTD/xhtml11.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
  <title>{title}</title>
  <style type="text/css">
    body {{ font-family: serif; margin: 1em; line-height: 1.6; }}
    h1 {{ text-align: center; color: #2c3e50; }}
    .author {{ text-align: center; color: #7f8c8d; font-style: italic; margin-bottom: 2em; }}
    p {{ text-align: justify; margin-bottom: 1em; }}
  </style>
</head>
<body>
  <h1>{title}</h1>
  <p class="author">by {author}</p>
'''
                
                # Add content paragraphs
                paragraphs = content.split('\n\n')
                for para in paragraphs:
                    if para.strip():
                        content_html += f'  <p>{para.strip()}</p>\n'
                
                content_html += '''</body>
</html>'''
                epub.writestr('OEBPS/content.html', content_html)
        
        # Increment usage counter
        increment_usage(user, "book")
        
        # In a real implementation, you would upload these files to cloud storage
        # For now, we'll return success with file paths
        result = {
            "message": "Book publishing successful",
            "title": title,
            "author": author,
            "format": format_type,
            "files_created": []
        }
        
        if format_type in ["pdf", "both"]:
            result["files_created"].append({
                "type": "pdf",
                "filename": pdf_filename,
                "path": pdf_path,
                "download_url": f"/api/download/book/{pdf_filename}"
            })
        
        if format_type in ["epub", "both"]:
            result["files_created"].append({
                "type": "epub", 
                "filename": epub_filename,
                "path": epub_path,
                "download_url": f"/api/download/book/{epub_filename}"
            })
        
        return jsonify(result), 200
        
    except Exception as e:
        return jsonify({
            "message": "Book publishing failed",
            "error": str(e)
        }), 500

@app.route("/api/download/book/<filename>", methods=["GET"])
def download_book(filename):
    """Download generated book files"""
    user = get_user_from_token(request)
    if not user:
        return jsonify({"message": "Authentication required"}), 401
    
    # In a real implementation, you would retrieve the file from cloud storage
    # For now, return a placeholder response
    return jsonify({
        "message": "File download ready",
        "filename": filename,
        "note": "In production, this would serve the actual file from cloud storage"
    }), 200

# Stripe Payment Integration

@app.route("/api/subscription/plans", methods=["GET"])
def get_subscription_plans():
    """Get available subscription plans"""
    return jsonify({
        "message": "Subscription plans retrieved successfully",
        "plans": SUBSCRIPTION_PLANS
    }), 200

@app.route("/api/subscription/create-checkout-session", methods=["POST"])
def create_checkout_session():
    """Create Stripe checkout session for subscription"""
    user = get_user_from_token(request)
    if not user:
        return jsonify({"message": "Authentication required"}), 401

    data = request.get_json()
    plan = data.get("plan")
    
    if plan not in SUBSCRIPTION_PLANS:
        return jsonify({"message": "Invalid subscription plan"}), 400
    
    if plan == "free":
        return jsonify({"message": "Free plan doesn't require payment"}), 400

    try:
        # Create or get Stripe customer
        user_data = users.get(user)
        stripe_customer_id = user_data.get("subscription", {}).get("stripe_customer_id")
        
        if not stripe_customer_id:
            customer = stripe.Customer.create(
                email=user,
                metadata={"lifebooks_user": user}
            )
            stripe_customer_id = customer.id
            users[user]["subscription"]["stripe_customer_id"] = stripe_customer_id

        # Create checkout session
        checkout_session = stripe.checkout.Session.create(
            customer=stripe_customer_id,
            payment_method_types=['card'],
            line_items=[{
                'price_data': {
                    'currency': 'usd',
                    'product_data': {
                        'name': f'Lifebooks {SUBSCRIPTION_PLANS[plan]["name"]} Plan',
                        'description': ', '.join(SUBSCRIPTION_PLANS[plan]["features"])
                    },
                    'unit_amount': SUBSCRIPTION_PLANS[plan]["price"],
                    'recurring': {
                        'interval': 'month'
                    }
                },
                'quantity': 1,
            }],
            mode='subscription',
            success_url=request.host_url + 'subscription/success?session_id={CHECKOUT_SESSION_ID}',
            cancel_url=request.host_url + 'subscription/cancel',
            metadata={
                'user_email': user,
                'plan': plan
            }
        )

        return jsonify({
            "message": "Checkout session created successfully",
            "checkout_url": checkout_session.url,
            "session_id": checkout_session.id
        }), 200

    except Exception as e:
        return jsonify({
            "message": "Failed to create checkout session",
            "error": str(e)
        }), 500

@app.route("/api/subscription/webhook", methods=["POST"])
def stripe_webhook():
    """Handle Stripe webhooks"""
    payload = request.get_data()
    sig_header = request.headers.get('Stripe-Signature')
    
    # In production, use your webhook secret
    endpoint_secret = os.environ.get('STRIPE_WEBHOOK_SECRET', 'whsec_test_secret')

    try:
        event = stripe.Webhook.construct_event(
            payload, sig_header, endpoint_secret
        )
    except ValueError:
        return jsonify({"error": "Invalid payload"}), 400
    except stripe.error.SignatureVerificationError:
        return jsonify({"error": "Invalid signature"}), 400

    # Handle the event
    if event['type'] == 'checkout.session.completed':
        session = event['data']['object']
        user_email = session['metadata']['user_email']
        plan = session['metadata']['plan']
        
        # Update user subscription
        if user_email in users:
            users[user_email]["subscription"].update({
                "plan": plan,
                "status": "active",
                "stripe_subscription_id": session.get('subscription'),
                "updated_at": datetime.datetime.utcnow().isoformat()
            })

    elif event['type'] == 'customer.subscription.deleted':
        subscription = event['data']['object']
        customer_id = subscription['customer']
        
        # Find user by customer ID and downgrade to free
        for email, user_data in users.items():
            if user_data.get("subscription", {}).get("stripe_customer_id") == customer_id:
                users[email]["subscription"].update({
                    "plan": "free",
                    "status": "active",
                    "stripe_subscription_id": None,
                    "updated_at": datetime.datetime.utcnow().isoformat()
                })
                break

    return jsonify({"status": "success"}), 200

@app.route("/api/subscription/status", methods=["GET"])
def get_subscription_status():
    """Get current user's subscription status"""
    user = get_user_from_token(request)
    if not user:
        return jsonify({"message": "Authentication required"}), 401

    user_data = users.get(user, {})
    subscription = user_data.get("subscription", {})
    usage = user_data.get("usage", {})
    
    # Reset monthly usage if needed
    last_reset = datetime.datetime.fromisoformat(usage.get("last_reset", datetime.datetime.utcnow().isoformat()))
    current_month = datetime.datetime.utcnow().replace(day=1)
    
    if last_reset < current_month:
        usage.update({
            "recordings_this_month": 0,
            "ai_enhancements_this_month": 0,
            "last_reset": current_month.isoformat()
        })
        users[user]["usage"] = usage

    plan_name = subscription.get("plan", "free")
    plan_info = SUBSCRIPTION_PLANS.get(plan_name, SUBSCRIPTION_PLANS["free"])

    return jsonify({
        "message": "Subscription status retrieved successfully",
        "subscription": subscription,
        "usage": usage,
        "plan_info": plan_info,
        "limits_reached": {
            "recordings": plan_info["limits"]["recordings"] != -1 and usage["recordings_this_month"] >= plan_info["limits"]["recordings"],
            "ai_enhancements": plan_info["limits"]["ai_enhancements"] != -1 and usage["ai_enhancements_this_month"] >= plan_info["limits"]["ai_enhancements"],
            "books": plan_info["limits"]["books"] != -1 and usage["books_created"] >= plan_info["limits"]["books"]
        }
    }), 200

@app.route("/api/subscription/cancel", methods=["POST"])
def cancel_subscription():
    """Cancel user's subscription"""
    user = get_user_from_token(request)
    if not user:
        return jsonify({"message": "Authentication required"}), 401

    user_data = users.get(user, {})
    subscription_id = user_data.get("subscription", {}).get("stripe_subscription_id")
    
    if not subscription_id:
        return jsonify({"message": "No active subscription found"}), 400

    try:
        # Cancel the subscription in Stripe
        stripe.Subscription.delete(subscription_id)
        
        # Update user data
        users[user]["subscription"].update({
            "plan": "free",
            "status": "cancelled",
            "stripe_subscription_id": None,
            "updated_at": datetime.datetime.utcnow().isoformat()
        })

        return jsonify({
            "message": "Subscription cancelled successfully"
        }), 200

    except Exception as e:
        return jsonify({
            "message": "Failed to cancel subscription",
            "error": str(e)
        }), 500

def check_usage_limits(user, action_type):
    """Check if user has reached usage limits for their plan"""
    user_data = users.get(user, {})
    subscription = user_data.get("subscription", {})
    usage = user_data.get("usage", {})
    
    plan_name = subscription.get("plan", "free")
    plan_info = SUBSCRIPTION_PLANS.get(plan_name, SUBSCRIPTION_PLANS["free"])
    
    limits = plan_info["limits"]
    
    if action_type == "recording":
        if limits["recordings"] != -1 and usage.get("recordings_this_month", 0) >= limits["recordings"]:
            return False, f"Monthly recording limit reached ({limits['recordings']}). Upgrade to Pro for unlimited recordings."
    
    elif action_type == "ai_enhancement":
        if limits["ai_enhancements"] != -1 and usage.get("ai_enhancements_this_month", 0) >= limits["ai_enhancements"]:
            return False, f"Monthly AI enhancement limit reached ({limits['ai_enhancements']}). Upgrade to Pro for unlimited enhancements."
    
    elif action_type == "book":
        if limits["books"] != -1 and usage.get("books_created", 0) >= limits["books"]:
            return False, f"Book creation limit reached ({limits['books']}). Upgrade to Pro for unlimited books."
    
    return True, None

def increment_usage(user, action_type):
    """Increment usage counter for user"""
    if user not in users:
        return
    
    usage = users[user].get("usage", {})
    
    if action_type == "recording":
        usage["recordings_this_month"] = usage.get("recordings_this_month", 0) + 1
    elif action_type == "ai_enhancement":
        usage["ai_enhancements_this_month"] = usage.get("ai_enhancements_this_month", 0) + 1
    elif action_type == "book":
        usage["books_created"] = usage.get("books_created", 0) + 1
    
    users[user]["usage"] = usage

if __name__ == "__main__":
    app.run(debug=True)


# Story Management
@app.route("/api/story", methods=["POST"])
def create_story():
    user = get_user_from_token(request)
    if not user:
        return jsonify({"message": "Authentication required"}), 401

    data = request.get_json()
    title = data.get("title", "")
    content = data.get("content", "")
    
    if not title:
        return jsonify({"message": "Story title is required"}), 400

    try:
        story = Story(
            user_id=user.id,
            title=title,
            content=content
        )
        story.update_word_count()
        
        db.session.add(story)
        db.session.commit()
        
        return jsonify({
            "message": "Story created successfully",
            "story": story.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({
            "message": "Story creation failed",
            "error": str(e)
        }), 500

@app.route("/api/story/<int:story_id>", methods=["GET"])
def get_story(story_id):
    user = get_user_from_token(request)
    if not user:
        return jsonify({"message": "Authentication required"}), 401

    story = Story.query.filter_by(id=story_id, user_id=user.id).first()
    if not story:
        return jsonify({"message": "Story not found"}), 404

    return jsonify({"story": story.to_dict()}), 200

@app.route("/api/story/<int:story_id>", methods=["PUT"])
def update_story(story_id):
    user = get_user_from_token(request)
    if not user:
        return jsonify({"message": "Authentication required"}), 401

    story = Story.query.filter_by(id=story_id, user_id=user.id).first()
    if not story:
        return jsonify({"message": "Story not found"}), 404

    data = request.get_json()
    
    try:
        if "title" in data:
            story.title = data["title"]
        if "content" in data:
            story.content = data["content"]
            story.update_word_count()
        if "summary" in data:
            story.summary = data["summary"]
        if "tags" in data:
            story.set_tags_list(data["tags"])
        
        story.updated_at = datetime.datetime.now(datetime.timezone.utc)
        db.session.commit()
        
        return jsonify({
            "message": "Story updated successfully",
            "story": story.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({
            "message": "Story update failed",
            "error": str(e)
        }), 500

@app.route("/api/story/<int:story_id>/auto-save", methods=["POST"])
def auto_save_story(story_id):
    user = get_user_from_token(request)
    if not user:
        return jsonify({"message": "Authentication required"}), 401

    story = Story.query.filter_by(id=story_id, user_id=user.id).first()
    if not story:
        return jsonify({"message": "Story not found"}), 404

    data = request.get_json()
    content = data.get("content", "")
    
    try:
        story.auto_save_content(content)
        
        return jsonify({
            "message": "Auto-save successful",
            "last_auto_save": story.last_auto_save.isoformat()
        }), 200
        
    except Exception as e:
        return jsonify({
            "message": "Auto-save failed",
            "error": str(e)
        }), 500

@app.route("/api/stories", methods=["GET"])
def get_user_stories():
    user = get_user_from_token(request)
    if not user:
        return jsonify({"message": "Authentication required"}), 401

    stories = Story.query.filter_by(user_id=user.id).order_by(Story.updated_at.desc()).all()
    
    return jsonify({
        "stories": [story.to_dict() for story in stories]
    }), 200

# Database initialization
@app.before_first_request
def create_tables():
    db.create_all()

if __name__ == "__main__":
    with app.app_context():
        db.create_all()
    app.run(host="0.0.0.0", port=5000, debug=True)

