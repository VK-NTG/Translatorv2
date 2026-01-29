#!/usr/bin/env python3
"""
Simple mock server for testing the language selector locally
without database dependencies
"""

from flask import Flask, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

# Mock languages data
MOCK_LANGUAGES = [
    {
        "code": "en-US",
        "english_name": "English",
        "native_name": "English",
        "region": "United States"
    },
    {
        "code": "ar",
        "english_name": "Arabic",
        "native_name": "العربية",
        "region": "Saudi Arabia"
    },
    {
        "code": "uk",
        "english_name": "Ukrainian",
        "native_name": "Українська",
        "region": "Ukraine"
    },
    {
        "code": "so",
        "english_name": "Somali",
        "native_name": "Soomaali",
        "region": "Somalia"
    },
    {
        "code": "es",
        "english_name": "Spanish",
        "native_name": "Español",
        "region": "Spain"
    },
    {
        "code": "fr",
        "english_name": "French",
        "native_name": "Français",
        "region": "France"
    }
]

@app.route('/api/v1/sessions/available-languages', methods=['GET'])
def available_languages():
    """Mock endpoint for available languages"""
    return jsonify(MOCK_LANGUAGES)

@app.route('/api/v1/sessions/start-session', methods=['POST'])
def start_session():
    """Mock endpoint for starting a session"""
    return jsonify({"session_id": "mock-session-123"})

@app.route('/api/v1/sessions/select-language', methods=['POST'])
def select_language():
    """Mock endpoint for selecting language"""
    return jsonify({
        "session_id": "mock-session-123",
        "status": "language_set",
        "language_a": "en-US",
        "language_b": "da-DK"
    })

@app.route('/health')
def health():
    return jsonify({"status": "ok", "message": "Mock server running"})

if __name__ == '__main__':
    print("🎭 Starting mock server for KK-AI-Translator testing...")
    print("Available endpoints:")
    print("  GET  /api/v1/sessions/available-languages")
    print("  POST /api/v1/sessions/start-session")
    print("  POST /api/v1/sessions/select-language")
    print("  GET  /health")
    print("\n🌐 Server running on http://localhost:5001")
    app.run(host='0.0.0.0', port=5001, debug=True)