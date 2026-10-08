import os
from flask import Flask, jsonify, request
from google import genai 
from flask_cors import CORS
import tempfile
import requests
import base64
import hashlib
from dotenv import load_dotenv

# Load environment variables
load_dotenv()
load_dotenv(os.path.join(os.path.dirname(__file__), '..', '.env'))

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
MURF_API_KEY = os.getenv("MURF_API_KEY")
MONGO_URI = os.getenv("MONGO_URI")

app = Flask(__name__)
CORS(app)

# --- MongoDB Setup (Optional / Atlas Connection) ---
db = None
users_collection = None
history_collection = None

if MONGO_URI:
    try:
        from pymongo import MongoClient
        mongo_client = MongoClient(MONGO_URI, serverSelectionTimeoutMS=5000)
        db = mongo_client["travel_guide_db"]
        users_collection = db["users"]
        history_collection = db["history"]
        print("Connected to MongoDB Atlas successfully.")
    except Exception as e:
        print(f"MongoDB connection warning: {e}")

# Helper for simple password hashing
def hash_password(password):
    return hashlib.sha256(password.encode('utf-8')).hexdigest()

PROMPTS = {
    "Summary": """
You are a professional tourist guide.
Provide a high-level overview of "{place}" in {language}.

Focus on:
- The historical significance
- Why the place is famous
- Key architectural or cultural highlights

Keep the explanation concise, engaging, and easy to follow.
Avoid excessive details and dates.
Limit the response to around 200 words.

Respond ONLY in {language}.""",
    "Detailed": """
You are a professional tourist guide.
Provide a detailed and immersive explanation of "{place}" in {language}.

Cover:
- Historical background and timeline
- Architectural design and unique features
- Cultural importance and notable events
- Interesting facts and visitor insights

Explain concepts clearly and in a storytelling manner.
Include relevant details and examples to create a rich experience.
Limit the response to around 400 words.

Respond ONLY in {language}.
"""
}

client = genai.Client(api_key=GEMINI_API_KEY) if GEMINI_API_KEY else genai.Client()

def generate_speech(text, voice_id, locale):
    temp_audio = tempfile.NamedTemporaryFile(
        suffix=".mp3",
        delete=False
    )
    url = "https://global.api.murf.ai/v1/speech/stream"
    headers = {
        "api-key": MURF_API_KEY or "",
        "Content-Type": "application/json"
    }
    data = {
        "voice_id": voice_id,
        "text": text,
        "locale": locale,
        "model": "FALCON",
        "format": "MP3",
        "sampleRate": 24000,
        "channelType": "MONO"
    }

    response = requests.post(
        url,
        headers=headers,
        json=data
    )
    if response.status_code == 200:
        with open(temp_audio.name, "wb") as f:
            for chunk in response.iter_content(chunk_size=1024):
                if chunk:
                    f.write(chunk)
    else:
        print(f"Error: {response.status_code}")

    return temp_audio

def generate_description(place, answer_type, language):
    prompt = PROMPTS[answer_type].format(place=place, language=language)
    response = client.models.generate_content(
        model="gemini-3.1-flash-lite",
        contents=prompt
    )
    return response.text

@app.route("/", methods=["GET"])
def health_check():
    return jsonify({
        "status": "online",
        "service": "Travel Guide Backend API",
        "mongo_connected": db is not None
    })

# --- Authentication Routes ---
@app.route("/api/signup", methods=["POST"])
def signup():
    data = request.json or {}
    name = data.get("name", "").strip()
    email = data.get("email", "").strip().lower()
    password = data.get("password", "")

    if not name or not email or not password:
        return jsonify({"error": "Please provide name, email, and password."}), 400

    if users_collection is not None:
        existing_user = users_collection.find_one({"email": email})
        if existing_user:
            return jsonify({"error": "Email is already registered."}), 409
        
        user_doc = {
            "name": name,
            "email": email,
            "password": hash_password(password)
        }
        users_collection.insert_one(user_doc)

    return jsonify({
        "message": "User registered successfully!",
        "user": {"name": name, "email": email}
    }), 201

@app.route("/api/login", methods=["POST"])
def login():
    data = request.json or {}
    email = data.get("email", "").strip().lower()
    password = data.get("password", "")

    if not email or not password:
        return jsonify({"error": "Please enter email and password."}), 400

    if users_collection is not None:
        user = users_collection.find_one({"email": email, "password": hash_password(password)})
        if not user:
            return jsonify({"error": "Invalid email or password."}), 401
        
        user_name = user.get("name", email.split("@")[0])
    else:
        user_name = email.split("@")[0]

    return jsonify({
        "message": "Login successful!",
        "user": {"name": user_name, "email": email}
    }), 200

# --- Audio Guide Route ---
@app.route("/generate-audio-guide", methods=["POST"])
def generate_audio_guide():
    data = request.json
    place = data["place"]
    answer_type = data["answerType"]
    language = data["language"]
    voice_id = data["voiceId"]
    locale = data["locale"]
    user_email = data.get("userEmail")

    text_description = generate_description(place, answer_type, language)
    audio_path = generate_speech(text_description, voice_id, locale)

    audio_bytes = open(audio_path.name, "rb").read()
    encoded_audio = base64.b64encode(audio_bytes).decode("utf-8")

    # Save to MongoDB history if available
    if history_collection is not None and user_email:
        try:
            history_collection.insert_one({
                "userEmail": user_email,
                "place": place,
                "language": language,
                "description": text_description
            })
        except Exception as e:
            print("History save error:", e)

    return {
        "description": text_description,
        "audioBase64": encoded_audio
    }

if __name__ == "__main__":
    port = int(os.getenv("PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=True)