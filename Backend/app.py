import os
from flask import Flask, jsonify, request
from google import genai 
from flask_cors import CORS
import tempfile
import requests
import base64
import hashlib

# Load environment variables safely
try:
    from dotenv import load_dotenv
    load_dotenv()
    load_dotenv(os.path.join(os.path.dirname(__file__), '..', '.env'))
except ImportError:
    print("Warning: python-dotenv package not found. Using system environment variables.")

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
MURF_API_KEY = os.getenv("MURF_API_KEY")
MONGO_URI = os.getenv("MONGO_URI")

app = Flask(__name__)
CORS(app)

# --- MongoDB Setup ---
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

def get_genai_client():
    key = os.getenv("GEMINI_API_KEY")
    return genai.Client(api_key=key) if key else genai.Client()

FALLBACK_DESCRIPTIONS = {
    "taj mahal": "The Taj Mahal is an iconic ivory-white marble mausoleum on the right bank of the Yamuna River in Agra, Uttar Pradesh, India. Commissioned in 1631 by Mughal emperor Shah Jahan to house the tomb of his favourite wife Mumtaz Mahal, it also houses Shah Jahan's own tomb. It is widely considered one of the finest architectural masterworks in human history and a UNESCO World Heritage site.",
    "colosseum": "The Colosseum, also known as the Flavian Amphitheatre, is an oval amphitheatre in the centre of the city of Rome, Italy. Built of travertine limestone, tuff, and brick-faced concrete, it was the largest amphitheatre ever built at the time and held up to 80,000 spectators for gladiatorial contests and public spectacles.",
    "eiffel tower": "The Eiffel Tower is a wrought-iron lattice tower on the Champ de Mars in Paris, France. Named after engineer Gustave Eiffel, whose company designed and built the tower, it was constructed between 1887 and 1889 for the 1889 World's Fair and has become a global cultural icon of France.",
    "machu picchu": "Machu Picchu is a 15th-century Inca citadel located in the Eastern Cordillera of southern Peru on a 2,430-meter mountain ridge. Set against a dramatic tropical mountain forest, it is one of the most famous archaeological sites in the Americas and a Wonder of the World.",
    "great wall of china": "The Great Wall of China is a series of fortifications built along the historical northern borders of ancient Chinese states and Imperial China as protection against nomadic groups. Spanning thousands of kilometers, it is an extraordinary monument to human endurance and military engineering.",
    "pyramids of giza": "The Pyramids of Giza, situated on the Giza Plateau near Cairo, Egypt, are ancient monumental tombs built during Egypt's Old Kingdom. The Great Pyramid, built for Pharaoh Khufu around 2560 BC, is the oldest and only surviving Wonder of the Ancient World, flanked by the Sphinx and the pyramids of Khafre and Menkaure.",
    "pyramid of giza": "The Great Pyramid of Giza is the oldest and largest of the three pyramids in the Giza pyramid complex bordering present-day Giza in Greater Cairo, Egypt. Built for the Fourth Dynasty pharaoh Khufu, it stands as an eternal masterpiece of ancient engineering and human ambition.",
    "sagrada familia": "The Basílica de la Sagrada Família in Barcelona, Spain, is an exceptional Roman Catholic church designed by the Catalan architect Antoni Gaudí. Combining Gothic and curvilinear Art Nouveau forms, its intricate facades and soaring forest-like interior columns make it one of the most recognizable monuments in the world.",
    "sagrada família": "The Basílica de la Sagrada Família in Barcelona, Spain, is an exceptional Roman Catholic church designed by the Catalan architect Antoni Gaudí. Combining Gothic and curvilinear Art Nouveau forms, its intricate facades and soaring forest-like interior columns make it one of the most recognizable monuments in the world.",
    "statue of liberty": "The Statue of Liberty is a colossal neoclassical sculpture on Liberty Island in New York Harbor, USA. Designed by French sculptor Frédéric-Auguste Bartholdi and dedicated in 1886, it was a gift from the people of France celebrating American independence and welcoming immigrants arriving by sea.",
    "petra": "Petra is a historic and archaeological city in southern Jordan, famous for its rock-cut architecture and water conduit system. Established around 300 BC as the capital of the Nabataean Kingdom, its rose-red sandstone cliffs and grand Treasury ('Al-Khazneh') have earned it a spot among the New Seven Wonders of the World.",
    "sydney opera house": "The Sydney Opera House is a multi-venue performing arts centre in Sydney, Australia. Designed by Danish architect Jørn Utzon and opened in 1973, its iconic sail-like roof structure gracing Sydney Harbour is widely regarded as one of the definitive architectural masterpieces of the 20th century.",
    "mount fuji": "Mount Fuji is an active stratovolcano and Japan's highest peak at 3,776 meters. Renowned for its nearly symmetrical snow-capped cone, Mount Fuji is a sacred Shinto symbol, a celebrated subject in traditional Japanese art, and an internationally cherished natural wonder.",
    "christ the redeemer": "Christ the Redeemer is an Art Deco statue of Jesus Christ created by French sculptor Paul Landowski in Rio de Janeiro, Brazil. Standing 30 meters tall atop the 700-meter Corcovado mountain, the statue with outstretched arms is an indelible global symbol of Brazilian culture and faith.",
    "santorini": "Santorini is a crescent-shaped volcanic island in the southern Aegean Sea, Greece. Famed for its cliffhanging whitewashed cubic houses, cobalt-blue domed churches, dramatic volcanic caldera vistas, and spectacular sunsets in Oia, it remains one of the most celebrated island destinations on Earth.",
    "grand canyon": "The Grand Canyon is a steep-sided canyon carved by the Colorado River in Arizona, United States. Measuring 446 kilometers long, up to 29 kilometers wide, and over a mile deep, its exposed layers of red rock reveal nearly two billion years of Earth's geological history in breathtaking grandeur.",
    "angkor wat": "Angkor Wat is a magnificent temple complex located in Siem Reap, Cambodia, built by the Khmer King Suryavarman II in the early 12th century. Originally dedicated to the Hindu deity Vishnu and later transformed into a Buddhist temple, it is the largest religious monument in the world.",
    "big ben": "Big Ben is the nickname for the Great Bell of the Great Clock of Westminster, located at the north end of the Palace of Westminster in London, England. Rising 96 meters high, this Neo-Gothic clock tower has sounded across the British capital since 1859 and serves as a quintessential British icon.",
    "burj khalifa": "The Burj Khalifa in Dubai, United Arab Emirates, is the tallest human-made structure and building in the world, soaring to an astonishing height of 828 meters. Designed by Adrian Smith, this modern engineering triumph features observation decks, luxury residences, and breathtaking views over the Arabian Gulf.",
    "victoria falls": "Victoria Falls, located on the border between Zambia and Zimbabwe on the Zambezi River, is one of the world's greatest waterfalls. Known locally as 'Mosi-oa-Tunya' ('The Smoke That Thunders'), it forms the largest sheet of falling water on the planet, with deafening roar and towering rainbow-lit mists.",
    "chichen itza": "Chichen Itza was a large pre-Columbian city built by the Maya civilization in Yucatán, Mexico. Its centerpiece is the Temple of Kukulcan (El Castillo), a step pyramid engineered with astronomical precision where shadows during equinoxes create the illusion of a feathered serpent descending the pyramid steps.",
    "milford sound": "Milford Sound is a breathtaking fjord in the southwest of New Zealand's South Island, carved by glacial activity. Flanked by sheer rock faces rising over 1,200 meters, dramatic cascading waterfalls, and home to seal colonies and penguins, it was praised by Rudyard Kipling as the eighth wonder of the world.",
    "matterhorn": "The Matterhorn is a legendary pyramid-shaped mountain peak in the Pennine Alps, situated on the border between Switzerland and Italy. Towering at 4,478 meters above Zermatt, its sheer faceted rock faces and iconic summit silhouette have made it the universal symbol of the Swiss Alps.",
    "serengeti national park": "The Serengeti National Park in northern Tanzania is world-famous for the Great Migration, where over 1.5 million wildebeest, hundreds of thousands of zebras, and gazelles travel across vast grasslands in search of fresh pasture, closely pursued by apex predators like lions and cheetahs.",
    "serengeti": "The Serengeti in northern Tanzania is world-famous for the Great Migration, where over 1.5 million wildebeest, hundreds of thousands of zebras, and gazelles travel across vast grasslands in search of fresh pasture, closely pursued by apex predators like lions and cheetahs.",
    "red fort": "The Red Fort is a historic fortified palace in New Delhi, India, built by Mughal Emperor Shah Jahan in 1638 when he decided to shift his capital from Agra to Delhi. Constructed of vibrant red sandstone, it served as the ceremonial and political center of the Mughal Empire for nearly 200 years.",
    "golden temple": "The Golden Temple, or Sri Harmandir Sahib, is the preeminent spiritual site of Sikhism, situated in Amritsar, Punjab, India. Gilded with 500 kilograms of pure gold foil, the shrine sits in the middle of a sacred pool called the Amrit Sarovar, welcoming visitors of all faiths to its famed 24/7 free community kitchen (Langar).",
    "gateway of india": "The Gateway of India is an imposing 26-meter arch monument built in the early 20th century in Mumbai, Maharashtra, India. Erected to commemorate the landing of King George V and Queen Mary in 1911, this basalt Indo-Saracenic structure stands as Mumbai's most iconic maritime landmark on the Arabian Sea.",
    "hawa mahal": "The Hawa Mahal, or 'Palace of Winds', is an extraordinary five-story palace in Jaipur, Rajasthan, India, built in 1799 by Maharaja Sawai Pratap Singh. Its unique honeycomb exterior features 953 small windows (jharokhas) with intricate latticework, designed so royal women could observe street festivities unseen.",
    "mysore palace": "Mysore Palace is a grand historical palace and the official residence of the Wadiyar dynasty in Mysuru, Karnataka, India. An Indo-Saracenic masterpiece blending Hindu, Mughal, Rajput, and Gothic styles, it is famed worldwide for its opulent Durbar Hall and its illumination by nearly 100,000 light bulbs during the Dasara festival.",
    "great barrier reef": "The Great Barrier Reef off the coast of Queensland, Australia, is the world's most extensive coral reef system, stretching over 2,300 kilometers and comprising nearly 3,000 individual reefs. Visible from space, it is a UNESCO World Heritage site harboring thousands of species of colorful marine life."
}

def generate_speech(text, voice_id, locale):
    try:
        temp_audio = tempfile.NamedTemporaryFile(
            suffix=".mp3",
            delete=False
        )
        url = "https://global.api.murf.ai/v1/speech/stream"
        murf_key = os.getenv("MURF_API_KEY", "")
        headers = {
            "api-key": murf_key,
            "Content-Type": "application/json"
        }
        data = {
            "voice_id": voice_id,
            "text": text[:500],
            "locale": locale,
            "model": "FALCON",
            "format": "MP3",
            "sampleRate": 24000,
            "channelType": "MONO"
        }

        response = requests.post(
            url,
            headers=headers,
            json=data,
            timeout=8
        )
        if response.status_code == 200:
            with open(temp_audio.name, "wb") as f:
                for chunk in response.iter_content(chunk_size=1024):
                    if chunk:
                        f.write(chunk)
            return temp_audio
        else:
            print(f"Murf API Warning ({response.status_code}): {response.text}")
            return None
    except Exception as e:
        print(f"Murf API exception (offline/timeout fallback): {e}")
        return None

def generate_description(place, answer_type, language):
    client = get_genai_client()
    prompt = PROMPTS[answer_type].format(place=place, language=language)
    models_to_try = ["gemini-3.1-flash-lite", "gemini-2.5-flash", "gemini-1.5-flash"]
    
    for model_name in models_to_try:
        try:
            response = client.models.generate_content(
                model=model_name,
                contents=prompt
            )
            if response and hasattr(response, 'text') and response.text:
                return response.text
        except Exception as e:
            print(f"Model {model_name} failed/timed out: {e}")
            continue

    # Fallback to curated guide if API call fails due to network TCP/DNS timeout
    place_key = place.strip().lower()
    if place_key in FALLBACK_DESCRIPTIONS:
        return FALLBACK_DESCRIPTIONS[place_key]
    
    # Partial matching (e.g., handles "Eiffel Tower, Paris" or "Pyramid")
    for key, desc in FALLBACK_DESCRIPTIONS.items():
        if key in place_key or (len(place_key) >= 4 and place_key in key):
            return desc
    
    return f"{place} is a world-renowned landmark rich in cultural heritage, historical significance, and impressive architectural beauty. Visitors from all around the globe come to experience its unique atmosphere and captivating history."

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
    try:
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
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/login", methods=["POST"])
def login():
    try:
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
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# --- Audio Guide Route ---
@app.route("/generate-audio-guide", methods=["POST"])
def generate_audio_guide():
    try:
        data = request.json or {}
        place = data.get("place", "Taj Mahal")
        answer_type = data.get("answerType", "Summary")
        language = data.get("language", "English")
        voice_id = data.get("voiceId", "Matthew")
        locale = data.get("locale", "en-US")
        user_email = data.get("userEmail")

        text_description = generate_description(place, answer_type, language)
        audio_file = generate_speech(text_description, voice_id, locale)

        encoded_audio = None
        if audio_file:
            audio_bytes = open(audio_file.name, "rb").read()
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

        return jsonify({
            "description": text_description,
            "audioBase64": encoded_audio
        }), 200
    except Exception as e:
        print(f"Error in generate_audio_guide: {e}")
        return jsonify({"error": f"Failed to generate guide: {str(e)}"}), 500

if __name__ == "__main__":
    port = int(os.getenv("PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=True)