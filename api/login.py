from flask import Flask, request, jsonify
import json
import jwt
import datetime

app = Flask(__name__)

def handler(request):
    if request.method != 'POST':
        return jsonify({"error": "Method not allowed"}), 405
    
    try:
        data = request.get_json()
        email = data.get('email')
        password = data.get('password')
        
        if not email or not password:
            return jsonify({"error": "Email and password required"}), 400
        
        # For demo purposes, accept any valid email/password
        # In production, this would verify against database
        if '@' in email and len(password) >= 6:
            token = jwt.encode({
                'email': email,
                'exp': datetime.datetime.utcnow() + datetime.timedelta(days=30)
            }, 'demo-secret-key', algorithm='HS256')
            
            return jsonify({
                "message": "Login successful",
                "token": token,
                "user": {"email": email}
            }), 200
        else:
            return jsonify({"error": "Invalid credentials"}), 401
            
    except Exception as e:
        return jsonify({"error": str(e)}), 500

