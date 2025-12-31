# 🎵 Music Playlist Generator

Generate **personalized Spotify playlists** based on your **mood**, **activity**, and **time of day**. A beautiful, intuitive web app powered by the Spotify API.

[![GitHub](https://img.shields.io/badge/GitHub-abdelrahman22wanas-blue?logo=github)](https://github.com/abdelrahman22wanas/music-playlist-generator)
[![Python](https://img.shields.io/badge/Python-3.8%2B-blue?logo=python)](https://www.python.org/)
[![Flask](https://img.shields.io/badge/Flask-2.3.3-green?logo=flask)](https://flask.palletsprojects.com/)
[![License](https://img.shields.io/badge/License-MIT-green)](LICENSE)
[![PayPal](https://img.shields.io/badge/Donate-PayPal-003087?style=flat&logo=paypal&logoColor=white)]([https://www.paypal.me/YOUR_USERNAME](https://paypal.me/abdelrahman22wanas))
[![Buy Me a Coffee](https://img.shields.io/badge/Buy%20Me%20a%20Coffee-FFDD00?style=flat&logo=buy-me-a-coffee&logoColor=black)](https://buymeacoffee.com/abdelrahman22wanas)


## ⚡ Quick Start

### 🚀 Option 1: Automated Setup (Recommended)
```bash
python install.py
```

### 🐳 Option 2: Docker
```bash
docker-compose up
```

### 📖 Option 3: Manual Setup
```bash
python -m venv venv
venv\Scripts\activate  # Windows
# or: source venv/bin/activate  # macOS/Linux

pip install -r requirements.txt

# Add Spotify credentials to .env file

python app.py
```

Then open: **http://localhost:5000** 🎉

---

## ✨ Features

| Feature | Details |
|---------|---------|
| 🎭 **5 Moods** | Happy, Sad, Energetic, Calm, Party |
| 🏃 **4 Activities** | Workout, Study, Party, Sleep |
| ⏰ **4 Time Slots** | Morning, Afternoon, Evening, Night |
| 🎵 **25 Tracks** | Personalized playlist every time |
| 🔊 **Audio Preview** | Listen to 30-second samples |
| 📱 **Responsive** | Desktop, tablet, and mobile friendly |
| 🎨 **Beautiful UI** | Dark theme with Spotify green accents |
| ⚡ **Fast** | Generates playlists in 1-3 seconds |

## Tech Stack

| Component | Technology |
|-----------|------------|
| Backend | Flask 2.3.3 |
| API | Spotify Web API |
| Frontend | HTML5, CSS3, Vanilla JavaScript |
| Auth | OAuth 2.0 (Client Credentials) |
| Python Client | Spotipy 2.22.1 |
| Server | Gunicorn |
| Containerization | Docker |

---

## 📋 Setup Instructions

### Prerequisites
- Python 3.8 or higher
- Pip package manager
- Spotify Developer Account (free)

### Step 1: Get Spotify Credentials
1. Visit [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. Log in or create a free Spotify account
3. Create a new application
4. Copy your **Client ID** and **Client Secret**

### Step 2: Clone Repository
```bash
git clone https://github.com/abdelrahman22wanas/music-playlist-generator.git
cd music-playlist-generator
```

### Step 3: Run Setup
```bash
python install.py
```

### Step 4: Configure Credentials
Edit `.env` file and add your Spotify credentials:
```env
SPOTIFY_CLIENT_ID=your_client_id_here
SPOTIFY_CLIENT_SECRET=your_client_secret_here
```

### Step 5: Start Application
```bash
venv\Scripts\activate  # Windows
python app.py
```

Visit: **http://localhost:5000**

---

## 🐳 Docker Deployment

### Using Docker Compose
```bash
docker-compose up
```

### Build Manually
```bash
docker build -t music-playlist-generator .
docker run -p 5000:5000 \
  -e SPOTIFY_CLIENT_ID=your_id \
  -e SPOTIFY_CLIENT_SECRET=your_secret \
  music-playlist-generator
```

---

## 🚀 Deployment Options

### Render (Recommended)
1. Push to GitHub
2. Connect repo to [Render.com](https://render.com)
3. Add environment variables
4. Deploy! 🎉

### Heroku
```bash
heroku login
heroku create your-app-name
heroku config:set SPOTIFY_CLIENT_ID=your_id
heroku config:set SPOTIFY_CLIENT_SECRET=your_secret
git push heroku main
```

### Other Platforms
- PythonAnywhere
- Railway
- AWS/GCP/Azure
- DigitalOcean

See [DEVELOPMENT.md](DEVELOPMENT.md) for detailed deployment guides.

---

## 📁 Project Structure

```
music-playlist-generator/
├── app.py                       # Flask server & API
├── playlist_generator.py         # Core logic
├── spotify_auth.py              # Spotify authentication
├── config.py                    # Configurations & mappings
├── install.py                   # Automated setup script
├── requirements.txt             # Python dependencies
├── setup.py                     # Python package setup
├── Dockerfile                   # Container configuration
├── docker-compose.yml           # Multi-container setup
├── .env                         # API credentials (template)
├── .gitignore                   # Git configuration
├── templates/
│   └── index.html               # Web interface
├── static/
│   ├── css/style.css            # Styling
│   └── js/script.js             # Frontend logic
└── Documentation/
    ├── README.md                # This file
    ├── QUICKSTART.md            # Setup guide
    ├── DEVELOPMENT.md           # Developer guide
    └── TROUBLESHOOTING.md       # Issue resolution
```

---

## 🎯 How It Works

### 1. User Input
Select mood → activity → time of day

### 2. Parameter Mapping
App converts selections into Spotify audio characteristics:
- Energy levels
- Danceability
- Valence (happiness)
- Seed genres
- Tempo adjustments

### 3. Spotify API
Generates 25 recommendations using Spotify's algorithm

### 4. Display Results
Shows personalized playlist with album art, previews, and Spotify links

---

## 📚 Documentation

- **[QUICKSTART.md](QUICKSTART.md)** - 5-minute setup guide
- **[DEVELOPMENT.md](DEVELOPMENT.md)** - Developer guide & architecture
- **[TROUBLESHOOTING.md](TROUBLESHOOTING.md)** - Common issues & solutions
- **[PROJECT_SUMMARY.md](PROJECT_SUMMARY.md)** - Technical overview
- **[EXAMPLES.md](EXAMPLES.md)** - Playlist combination examples

---

## 🔒 Security

✅ Environment variables for credentials (not in repo)  
✅ `.env` file protected by .gitignore  
✅ Input validation on all requests  
✅ No hardcoded secrets  
✅ CORS protection  

**Important**: Never commit `.env` to version control!

---

## 🤝 Contributing

Contributions are welcome! Feel free to:
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

---

## 📊 Browser Support

| Browser | Status |
|---------|--------|
| Chrome | ✅ Full Support |
| Firefox | ✅ Full Support |
| Safari | ✅ Full Support |
| Edge | ✅ Full Support |
| Opera | ✅ Full Support |
| IE 11 | ❌ Not Supported |

---

## 📱 Mobile Support

✅ Fully responsive  
✅ Touch-friendly interface  
✅ Works on iOS & Android  
✅ Optimized for all screen sizes  

---

## 🆘 Troubleshooting

### "Invalid Spotify Credentials"
- Visit [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
- Verify your Client ID and Secret
- Update `.env` file

### "Port 5000 Already in Use"
```bash
# Use different port in app.py
app.run(debug=True, port=5001)
```

### More Issues?
See [TROUBLESHOOTING.md](TROUBLESHOOTING.md) for detailed solutions.

---

## 💡 Monetization Ideas

- Freemium subscription model
- Spotify affiliate program
- Display advertising
- B2B licensing for gyms/cafes
- Premium playlist curation
- API access for developers

See [MONETIZATION.md](MONETIZATION.md) for details.

---

## 📈 Performance

- Playlist Generation: 1-3 seconds
- Page Load: <2 seconds
- API Response: ~1.5 seconds
- Memory Usage: <100MB
- Database: None (stateless)
