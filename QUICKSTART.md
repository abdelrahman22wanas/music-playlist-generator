# 🚀 Quick Start Guide

## Step-by-Step Setup for Windows

### Step 1: Get Spotify API Credentials (2 minutes)

1. Open https://developer.spotify.com/dashboard in your browser
2. Click **Log In** or create a new account
3. Agree to the terms and click **Continue**
4. Fill in the form and click **Agree** to create your account
5. Go to **Dashboard** (you should see a green button)
6. Click **Create an App**
7. Name it "Music Playlist Generator"
8. Accept terms and click **Create**
9. You'll see your **Client ID** and **Client Secret** - copy both

### Step 2: Prepare Your Computer

Make sure you have Python installed:

```powershell
python --version
```

If not installed, download from https://www.python.org/downloads/

### Step 3: Set Up the Project

1. Open PowerShell or Command Prompt
2. Navigate to the project folder:
   ```powershell
   cd "d:\Important\Music Playlist Generator"
   ```

3. Create a virtual environment:
   ```powershell
   python -m venv venv
   ```

4. Activate the virtual environment:
   ```powershell
   venv\Scripts\activate
   ```

5. Install dependencies:
   ```powershell
   pip install -r requirements.txt
   ```

### Step 4: Configure API Credentials

1. Open the `.env` file in your text editor
2. Replace the placeholders:
   ```
   SPOTIFY_CLIENT_ID=paste_your_client_id_here
   SPOTIFY_CLIENT_SECRET=paste_your_client_secret_here
   ```
3. Save the file

### Step 5: Run the App

```powershell
python app.py
```

You should see:
```
 * Running on http://127.0.0.1:5000
 * Debug mode: on
```

### Step 6: Access the App

1. Open your browser
2. Go to http://localhost:5000
3. Start creating playlists! 🎵

---

## Troubleshooting

### "venv is not recognized"
Make sure you're in the correct directory and try:
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```
Then activate again: `venv\Scripts\activate`

### "ModuleNotFoundError: No module named 'flask'"
Make sure the virtual environment is activated (you should see `(venv)` in your terminal)

### "Spotify connection error"
Double-check:
- Your Client ID and Secret are correct
- The `.env` file is in the root project directory
- No extra spaces in the `.env` file values

### Port 5000 is already in use
Edit `app.py` and change the port:
```python
app.run(debug=True, port=5001)
```

---

## File Locations

After setup, your folder should look like:

```
d:\Important\Music Playlist Generator\
├── venv\                    # Created virtual environment
├── static\
│   ├── css\
│   │   └── style.css
│   └── js\
│       └── script.js
├── templates\
│   └── index.html
├── app.py
├── config.py
├── playlist_generator.py
├── spotify_auth.py
├── requirements.txt
├── .env                     # Your API credentials (keep secret!)
├── .gitignore
└── README.md
```

---

## First Run Checklist

- [ ] Python 3.8+ installed
- [ ] Spotify API credentials obtained
- [ ] `.env` file configured with credentials
- [ ] Virtual environment created and activated
- [ ] Dependencies installed (`pip install -r requirements.txt`)
- [ ] App running (`python app.py`)
- [ ] Accessed http://localhost:5000

---

## How to Use

1. **Select Your Mood**: Click one emoji button
2. **Pick Activity**: Click one activity button
3. **Choose Time**: Click one time button
4. **Generate**: Click the purple button
5. **Explore**: Scroll through your personalized playlist
6. **Preview**: Click the ▶ button to hear samples

---

## Stopping the App

Press `Ctrl + C` in the terminal

---

## Deactivating Virtual Environment

When done, run:
```powershell
deactivate
```

---

Need help? Check the main README.md for more details!
