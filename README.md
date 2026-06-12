# 🏛️ HeartBridge

<div align="center">
  <p><strong>Bridging generations, preserving memories, and caring for our elders.</strong></p>
  
  [![FastAPI](https://img.shields.io/badge/FastAPI-005571?style=for-the-badge&logo=fastapi)](https://fastapi.tiangolo.com/)
  [![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
  [![Vite](https://img.shields.io/badge/Vite-B73BFE?style=for-the-badge&logo=vite&logoColor=FFD62E)](https://vitejs.dev/)
  [![Gemini AI](https://img.shields.io/badge/Gemini_AI-4285F4?style=for-the-badge&logo=google&logoColor=white)](https://deepmind.google/technologies/gemini/)
</div>

<br />

**HeartBridge** is an intuitive, family-centric platform designed specifically to connect younger generations with their elders. By combining modern AI (Google Gemini) with accessible design, HeartBridge makes it easy to preserve family history, manage daily health routines, and foster meaningful connections across borders and languages.

---

## ✨ Key Features

- 🎙️ **AI-Powered Memory Recording**
  - Elders can record audio stories (in languages like English or Gujarati).
  - Gemini AI automatically transcribes the audio, generates descriptive tags, and creates engaging follow-up prompts to keep the conversation flowing.
- 💊 **Health & Medicine Management**
  - Schedule and track daily medication.
  - Visual color-coded pill reminders with easy one-tap logging.
- 🖼️ **Smart Photo Albums**
  - Upload photos and let AI automatically categorize them by event (e.g., "Diwali Celebrations", "Family Dinner").
  - Add voice-recorded captions to photos to preserve the stories behind the moments.
- 🌍 **Worldwide Circles**
  - Community feeds for sharing wisdom, such as *"Grandma's Kitchen"*, *"Tales from Our Roots"*, and *"Handmade & Heirlooms"*.
- 🗣️ **Seamless Translation**
  - Built-in English/Gujarati translation to bridge language barriers between generations.
- 🚨 **Family Nudges & Alerts**
  - Send gentle reminders, check-ins, or emergency medical alerts instantly to the family group.

---

## 🛠️ Technology Stack

- **Backend:** Python, FastAPI, SQLModel (SQLite), Uvicorn
- **Frontend:** React, Vite, TailwindCSS
- **AI Integration:** Google Gemini 1.5 Flash (Transcription, Tagging, Translation, Medical Summaries)

---

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (for the frontend)
- [Python 3.10+](https://www.python.org/) (for the backend)
- A Google Gemini API Key (optional, but required for AI features)

### Quick Start (Windows)

We've included a convenient batch script to start both the frontend and backend simultaneously.

1. **Clone the repository** (if you haven't already).
2. **Set up your API Key:**
   - Create a `.env` file in the `backend` directory.
   - Add your Gemini API key: `GEMINI_API_KEY=your_api_key_here`
3. **Run the Application:**
   - Double-click the `run.bat` file in the root directory.
   - *The script will automatically start the backend on port 8000 and the frontend on port 3000, and open them in your browser.*

### Manual Installation

If you prefer to run the services manually:

#### 1. Backend Setup
```bash
cd backend
python -m venv .venv
# Activate virtual environment
# Windows: .venv\Scripts\activate
# Mac/Linux: source .venv/bin/activate

pip install -r requirements.txt
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

#### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev -- --port 3000
```

---

## 📱 Application Structure

- `http://localhost:3000` - Main User Interface (Elder / Family view)
- `http://localhost:8000/docs` - FastAPI Interactive API Documentation (Swagger UI)

---

## 🤝 Contributing

Contributions are welcome! Whether it's adding support for new regional languages, improving the accessibility of the UI, or adding new features to the family feed.

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

<div align="center">
  <i>Built with ❤️ for families everywhere.</i>
</div>
