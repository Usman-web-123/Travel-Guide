# 🚀 Deployment & MongoDB Atlas Setup Guide

This guide provides step-by-step instructions to connect your **Travel Guide** application to **MongoDB Atlas**, deploy the **Backend on Render**, and deploy the **Frontend on Vercel**.

---

## 🍃 Part 1: How to Setup MongoDB Atlas Database

### Step 1: Create a Free MongoDB Atlas Account
1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register) and sign up for a free account.
2. Click **Create a Deployment** and select the **M0 Free Cluster**.

### Step 2: Create Database User Credentials
1. In the left sidebar under **Security**, click **Database Access**.
2. Click **+ Add New Database User**.
3. Set **Authentication Method** to `Password`.
4. Enter a Username (e.g. `travel_admin`) and a secure Password.
5. Under **Database User Privileges**, choose `Read and write to any database`.
6. Click **Add User**.

### Step 3: Configure IP Network Access
1. In the left sidebar, click **Network Access**.
2. Click **+ Add IP Address**.
3. Click **ALLOW ACCESS FROM ANYWHERE** (`0.0.0.0/0`) so your Render backend can connect.
4. Click **Confirm**.

### Step 4: Get Your Connection String (`MONGO_URI`)
1. Go to **Database** in the sidebar and click **Connect** on your cluster.
2. Select **Drivers** (Node.js/Python).
3. Copy the connection string. It looks like:
   ```env
   mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/travel_guide?retryWrites=true&w=majority
   ```
4. Replace `<username>` and `<password>` with your actual database credentials.

---

## ⚙️ Part 2: Deploying the Backend on Render

### Step 1: Sign Up on Render
1. Go to [Render.com](https://render.com/) and log in using your GitHub account (`Usman-web-123`).

### Step 2: Create a New Web Service
1. Click **New +** button -> **Web Service**.
2. Connect your GitHub repository: `Usman-web-123/Travel-Guide`.
3. Configure the settings:
   - **Name**: `travel-guide-backend`
   - **Region**: Choose the closest location (e.g. Singapore or Frankfurt)
   - **Branch**: `main`
   - **Root Directory**: *(Leave blank)*
   - **Runtime**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `gunicorn Backend.app:app`

### Step 3: Add Environment Variables on Render
Scroll down to **Environment Variables** and add the following keys:

| Key | Value |
|---|---|
| `GEMINI_API_KEY` | Your Google Gemini API Key |
| `MURF_API_KEY` | Your Murf AI API Key |
| `MONGO_URI` | Your MongoDB Atlas Connection String |
| `PORT` | `5000` |

4. Click **Create Web Service**. Render will automatically build and deploy your backend.
5. Copy your live Render URL (e.g., `https://travel-guide-backend.onrender.com`).

---

## 🌐 Part 3: Deploying the Frontend on Vercel

### Step 1: Import Project to Vercel
1. Go to [Vercel.com](https://vercel.com/) and log in with GitHub.
2. Click **Add New...** -> **Project**.
3. Import your GitHub repository: `Usman-web-123/Travel-Guide`.

### Step 2: Configure Project Settings
- **Framework Preset**: `Other` (Static HTML/JS)
- **Root Directory**: `./` (Root)
- **Build Command**: *(Leave empty)*
- **Output Directory**: `Frontend`

### Step 3: Deploy
1. Click **Deploy**. Vercel will build and publish your website instantly.
2. Copy your live Vercel URL (e.g., `https://travel-guide-xyz.vercel.app`).

---

## 🔗 Part 4: Connecting Frontend to Render Backend

In `Frontend/index.js`, update `API_BASE_URL` to point to your live Render backend URL:

```javascript
const API_BASE_URL = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1" 
  ? "http://127.0.0.1:5000" 
  : "https://travel-guide-backend.onrender.com"; // 👈 Paste your Render Backend URL here
```

Commit and push to GitHub (`git add . ; git commit -m "Update API URL" ; git push origin main`), and Vercel will automatically redeploy your live website! 🎉
