from flask import Flask, request, jsonify
import json
import bcrypt
import jwt
import datetime
import os

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
        
        # For demo purposes, just return success
        # In production, this would save to database
        token = jwt.encode({
            'email': email,
            'exp': datetime.datetime.utcnow() + datetime.timedelta(days=30)
        }, 'demo-secret-key', algorithm='HS256')
        
        return jsonify({
            "message": "Registration successful",
            "token": token,
            "user": {"email": email}
        }), 201
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

