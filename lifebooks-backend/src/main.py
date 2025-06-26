from flask import Flask, request, jsonify
from flask_cors import CORS
import jwt
import datetime
import os

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Use a strong, random key in production
app.config["SECRET_KEY"] = os.environ.get("SECRET_KEY", "your_super_secret_key")

# In-memory user store (for MVP purposes)
users = {}

@app.route("/api/register", methods=["POST"])
def register():
    data = request.get_json()
    email = data.get("email")
    password = data.get("password")

    if not email or not password:
        return jsonify({"message": "Email and password are required"}), 400

    if email in users:
        return jsonify({"message": "User already exists"}), 409

    users[email] = {"password": password}  # In real app, hash the password!
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
        "exp": datetime.datetime.utcnow() + datetime.timedelta(minutes=30)
    }, app.config["SECRET_KEY"], algorithm="HS256")

    return jsonify({
        "message": "Login successful",
        "token": token,
        "user": {"email": email}
    }), 200

@app.route("/api/protected", methods=["GET"])
def protected():
    token = request.headers.get("Authorization")
    if not token:
        return jsonify({"message": "Token is missing"}), 403

    try:
        token = token.split(" ")[1]  # Remove "Bearer " prefix
        data = jwt.decode(token, app.config["SECRET_KEY"], algorithms=["HS256"])
    except jwt.ExpiredSignatureError:
        return jsonify({"message": "Token has expired"}), 401
    except jwt.InvalidTokenError:
        return jsonify({"message": "Token is invalid"}), 401

    return jsonify({
        "message": f"Hello {data['user']}, you have access to protected data!"
    }), 200

# Placeholder routes for other future APIs

@app.route("/api/story", methods=["GET", "PUT", "DELETE"])
def story():
    return jsonify({"message": "Story API endpoint"})

@app.route("/api/voice", methods=["POST"])
def voice():
    return jsonify({"message": "Voice API endpoint"})

@app.route("/api/cover", methods=["POST"])
def cover():
    return jsonify({"message": "Cover API endpoint"})

@app.route("/api/publish", methods=["POST"])
def publish():
    return jsonify({"message": "Publish API endpoint"})

@app.route("/api/ai", methods=["POST"])
def ai():
    return jsonify({"message": "AI API endpoint"})

if __name__ == "__main__":
    app.run(debug=True)
