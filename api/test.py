from flask import Flask, jsonify
import datetime

app = Flask(__name__)

def handler(request):
    return jsonify({
        "message": "API is working!",
        "method": request.method,
        "timestamp": datetime.datetime.now(datetime.timezone.utc).isoformat()
    }), 200

