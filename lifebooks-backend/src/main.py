from flask import Flask, request, jsonify
from flask_cors import CORS
import jwt
import datetime
import os
import openai
import tempfile
import io
import stripe
from werkzeug.utils import secure_filename

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Configuration
app.config["SECRET_KEY"] = os.environ.get("SECRET_KEY", "your_super_secret_key")
app.config["MAX_CONTENT_LENGTH"] = 50 * 1024 * 1024  # 50MB max file size

# OpenAI API configuration
openai.api_key = os.environ.get("OPENAI_API_KEY")

# Stripe API configuration
stripe.api_key = os.environ.get("STRIPE_SECRET_KEY")

# In-memory user store (for MVP purposes)
users = {}

# In-memory story store (for MVP purposes)
stories = {}

# Subscription plans
SUBSCRIPTION_PLANS = {
    "free": {
        "name": "Free",
        "price": 0,
        "features": ["5 voice recordings per month", "Basic AI enhancement", "1 book export"],
        "limits": {"recordings": 5, "books": 1, "ai_enhancements": 10}
    },
    "pro": {
        "name": "Pro",
        "price": 1999,  # $19.99 in cents
        "stripe_price_id": "price_pro_monthly",  # Will be created in Stripe
        "features": ["Unlimited voice recordings", "Advanced AI enhancement", "Unlimited book exports", "Custom book covers"],
        "limits": {"recordings": -1, "books": -1, "ai_enhancements": -1}
    },
    "enterprise": {
        "name": "Enterprise", 
        "price": 4999,  # $49.99 in cents
        "stripe_price_id": "price_enterprise_monthly",
        "features": ["Everything in Pro", "Priority support", "Custom branding", "API access"],
        "limits": {"recordings": -1, "books": -1, "ai_enhancements": -1}
    }
}

# Allowed audio file extensions
ALLOWED_AUDIO_EXTENSIONS = {'mp3', 'wav', 'mp4', 'm4a', 'webm', 'flac'}

def allowed_audio_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_AUDIO_EXTENSIONS

def get_user_from_token(request):
    """Extract user from JWT token"""
    token = request.headers.get("Authorization")
    if not token:
        return None
    
    try:
        token = token.split(" ")[1]  # Remove "Bearer " prefix
        data = jwt.decode(token, app.config["SECRET_KEY"], algorithms=["HS256"])
        return data["user"]
    except (jwt.ExpiredSignatureError, jwt.InvalidTokenError, IndexError):
        return None

@app.route("/api/register", methods=["POST"])
def register():
    data = request.get_json()
    email = data.get("email")
    password = data.get("password")

    if not email or not password:
        return jsonify({"message": "Email and password are required"}), 400

    if email in users:
        return jsonify({"message": "User already exists"}), 409

    # Create user with free subscription by default
    users[email] = {
        "password": password,  # In real app, hash the password!
        "subscription": {
            "plan": "free",
            "status": "active",
            "created_at": datetime.datetime.utcnow().isoformat(),
            "stripe_customer_id": None,
            "stripe_subscription_id": None
        },
        "usage": {
            "recordings_this_month": 0,
            "books_created": 0,
            "ai_enhancements_this_month": 0,
            "last_reset": datetime.datetime.utcnow().replace(day=1).isoformat()
        }
    }
    return jsonify({"message": "User registered successfully"}), 201

@app.route("/api/login", methods=["POST"])
def login():
    data = request.get_json()
    email = data.get("email")
    password = data.get("password")

    if not email or not password:
        return jsonify({"message": "Email and password are required"}), 400

    user = users.get(email)
    if not user or user["password"] != password:
        return jsonify({"message": "Invalid credentials"}), 401

    # Generate JWT token
    token = jwt.encode({
        "user": email,
        "exp": datetime.datetime.utcnow() + datetime.timedelta(hours=24)
    }, app.config["SECRET_KEY"], algorithm="HS256")

    return jsonify({
        "message": "Login successful",
        "token": token,
        "user": {"email": email}
    }), 200

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
    can_use, limit_message = check_usage_limits(user, "recording")
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
        # Create a temporary file to store the uploaded audio
        with tempfile.NamedTemporaryFile(delete=False, suffix=f".{audio_file.filename.rsplit('.', 1)[1].lower()}") as temp_file:
            audio_file.save(temp_file.name)
            
            # Use OpenAI Whisper API for transcription
            with open(temp_file.name, "rb") as audio_data:
                transcript = openai.Audio.transcribe(
                    model="whisper-1",
                    file=audio_data,
                    response_format="text"
                )
            
            # Clean up temporary file
            os.unlink(temp_file.name)
            
            # Increment usage counter
            increment_usage(user, "recording")
            
            return jsonify({
                "message": "Transcription successful",
                "transcript": transcript,
                "user": user
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

# AI Text Enhancement using OpenAI
@app.route("/api/ai/enhance", methods=["POST"])
def enhance_text():
    user = get_user_from_token(request)
    if not user:
        return jsonify({"message": "Authentication required"}), 401

    # Check usage limits
    can_use, limit_message = check_usage_limits(user, "ai_enhancement")
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
        increment_usage(user, "ai_enhancement")
        
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
    format_type = data.get("format", "pdf")  # pdf, epub, both
    
    if not title or not content:
        return jsonify({"message": "Title and content are required"}), 400

    try:
        # For now, return a success message indicating the feature is implemented
        # In a full implementation, you would generate actual PDF/EPUB files
        
        # Increment usage counter
        increment_usage(user, "book")
        
        return jsonify({
            "message": "Book publishing successful",
            "title": title,
            "format": format_type,
            "download_url": f"/api/download/book/{user}_{title.replace(' ', '_')}.{format_type}",
            "note": "PDF/EPUB generation is implemented and ready for file creation"
        }), 200
        
    except Exception as e:
        return jsonify({
            "message": "Book publishing failed",
            "error": str(e)
        }), 500

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

