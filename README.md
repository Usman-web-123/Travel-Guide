# 🧭 Travel Guide - AI Audio Companion

[![License: MIT](https://img.shields.io/badge/License-MIT-orange.svg)](https://opensource.org/licenses/MIT)
[![Python](https://img.shields.io/badge/Python-3.10%2B-blue.svg)](https://www.python.org/)
[![Flask](https://img.shields.io/badge/Flask-3.0%2B-green.svg)](https://flask.palletsprojects.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-brightgreen.svg)](https://www.mongodb.com/)
[![Vercel](https://img.shields.io/badge/Frontend-Vercel-black.svg)](https://vercel.com/)
[![Render](https://img.shields.io/badge/Backend-Render-informational.svg)](https://render.com/)

An AI-powered, multilingual travel companion that generates instant, immersive audio guides and historical narratives for iconic Indian landmarks in **English, Hindi, Tamil, and Telugu**.

---

## 📌 Problem Statement

Travelers visiting historical monuments and world heritage sites often face several challenges:
- **Language Barriers**: Information plaques and local human tour guides are rarely available in native regional languages.
- **Reading Distraction**: Reading lengthy articles or guidebooks while exploring distracts visitors from experiencing the beauty of the destination.
- **Fixed & Expensive Guided Tours**: Traditional audio guides or human tour guides are expensive, rigid, and lack customization based on individual interest or available time.

### 💡 The Solution
**Travel Guide** solves this problem by serving as an intelligent, hands-free AI audio companion. It utilizes **Google Gemini 3.1** to craft tailored historical narratives and **Murf AI (Falcon TTS Engine)** to synthesize natural, human-like voice guides across multiple regional languages and duration options.

---

## 🌐 Live Demo

- 🖥️ **Live Web Application (Vercel)**: [https://travel-guide-kappa-two.vercel.app](https://travel-guide-kappa-two.vercel.app)
- ⚡ **Backend API Server (Render)**: [https://travel-guide-0jho.onrender.com](https://travel-guide-0jho.onrender.com)
- 📁 **GitHub Repository**: [https://github.com/Usman-web-123/Travel-Guide](https://github.com/Usman-web-123/Travel-Guide)

---

## 📸 Screenshots

### 1. Hero Landing Page
![Hero Landing Page](https://s3.ap-south-1.amazonaws.com/new-assets.ccbp.in/frontend/loading-data/niat-course-projects/Taj_Mahal_%28Edited%29.jpeg)
*Immersive AI Travel Companion Landing Page with 4 Native Languages highlight.*

---

### 2. User Authentication (Login & Signup Modals)
| Sign Up Modal | Log In Modal & Authentication Success |
|:---:|:---:|
| ![Create Account Modal](https://s3.ap-south-1.amazonaws.com/new-assets.ccbp.in/frontend/loading-data/niat-course-projects/Delhi_fort.jpg) | ![Welcome Back Modal](https://s3.ap-south-1.amazonaws.com/new-assets.ccbp.in/frontend/loading-data/niat-course-projects/Mumbai_03-2016_30_Gateway_of_India.jpg) |

---

### 3. Landmark Audio Guide & Transcript Player
![Audio Guide Experience](https://s3.ap-south-1.amazonaws.com/new-assets.ccbp.in/frontend/loading-data/niat-course-projects/The_Golden_Temple_of_Amrithsar_7.jpg)
*Taj Mahal Audio Guide with Male/Female voice selection, real-time playback, and expandable historical transcript.*

---

## 🛠️ Tech Stack

### **Frontend**
- **HTML5 & Vanilla JavaScript (ES6+)**: Modular scripting, state management, and async fetch.
- **Tailwind CSS**: Modern, responsive glassmorphism UI styling.
- **Google Fonts**: Inter & Playfair Display typography.

### **Backend**
- **Python (Flask)**: Lightweight RESTful API server with error-handling middleware.
- **Gunicorn**: Production WSGI HTTP Server (`--bind 0.0.0.0:$PORT`).
- **Flask-CORS**: Cross-Origin Resource Sharing enablement.

### **AI & Voice Services**
- **Google GenAI (Gemini 3.1 Flash-Lite)**: Generates structured, engaging historical narratives.
- **Murf AI (Falcon Engine)**: Converts generated text into realistic voice audio streams.

### **Database & Cloud Hosting**
- **MongoDB Atlas**: Cloud database storing user credentials & guide generation history.
- **Vercel**: Global CDN hosting for static frontend assets (`travel-guide-kappa-two.vercel.app`).
- **Render**: Cloud web service hosting the Python Flask backend (`travel-guide-0jho.onrender.com`).

---

## ✨ Key Features

1. **🎙️ Multilingual Text-to-Speech**:
   - Supports 4 major languages: **English, Hindi, Tamil, Telugu**.
   - Choice of **Male** and **Female** voice accents for each language.

2. **⏱️ Flexible Guide Lengths**:
   - **Summarized (~1 min)**: Concise overview focusing on key highlights.
   - **Detailed (~3 min)**: Comprehensive historical timeline and storytelling.

3. **📜 Synced Text Transcripts**:
   - Interactive dropdown transcript allowing users to read along while listening.

4. **👤 User Authentication & MongoDB Integration**:
   - Sign up and Log in functionality backed by **MongoDB Atlas** cloud database.

5. **⬅️ Top-Left Back Button Navigation**:
   - Dynamic top-left back button enabling seamless screen transition.

---

## 🚀 Getting Started Locally

### 1. Prerequisites
- Python 3.10 or higher
- Git

### 2. Clone the Repository
```bash
git clone https://github.com/Usman-web-123/Travel-Guide.git
cd Travel-Guide
```

### 3. Install Backend Dependencies
```bash
pip install -r requirements.txt
```

### 4. Setup Environment Variables
Create a `.env` file in the root directory:
```env
GEMINI_API_KEY=your_gemini_api_key_here
MURF_API_KEY=your_murf_api_key_here
MONGO_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/travel_guide?retryWrites=true&w=majority
PORT=5000
```

### 5. Run the Backend Server
```bash
python Backend/app.py
```
The backend API will run on `http://127.0.0.1:5000`.

### 6. Launch the Frontend
Open `Frontend/index.html` in your browser.

---

## 📜 Deployment Guide

For full step-by-step setup details on **MongoDB Atlas**, **Render**, and **Vercel**, view [DEPLOYMENT_AND_DATABASE_GUIDE.md](./DEPLOYMENT_AND_DATABASE_GUIDE.md).

---

## 📝 License

Distributed under the MIT License. See `LICENSE` for more information.

---

## 👨‍💻 Author

Developed with ❤️ by **[Usman-web-123](https://github.com/Usman-web-123)**.
