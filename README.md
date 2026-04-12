# Music Playlist Generator

Generate personalized Spotify playlists based on mood, activity, and time of day.

## Features

- Playlist generation from mood, activity, and time inputs
- Spotify user sign-in support for personalized actions
- Flask API backend with HTML/CSS/JavaScript frontend
- Health endpoint for deployment checks
- Docker, Render, and Windows desktop packaging support

## Quick Start (Local)

### 1. Create and activate a virtual environment

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
```

### 2. Install dependencies

```powershell
pip install -r requirements.txt
```

### 3. Configure environment

Copy `.env.example` to `.env`, then set at minimum:

- `SPOTIFY_CLIENT_ID`
- `SPOTIFY_CLIENT_SECRET`
- `SECRET_KEY`

For Spotify sign-in, also set:

- `SPOTIFY_REDIRECT_URI=http://127.0.0.1:5000/auth/spotify/callback`

### 4. Run the app

```powershell
python app.py
```

Open http://localhost:5000

## Run with Docker

```powershell
docker-compose up --build
```

The app will be available at http://localhost:5000.

## Deploy Publicly

### Option 1: Render (Recommended)

1. Push the repository to GitHub.
2. In Render, create a new Blueprint service.
3. Select this repository; Render will use `render.yaml`.
4. Set required environment variables:
   - `SPOTIFY_CLIENT_ID`
   - `SPOTIFY_CLIENT_SECRET`
   - `SPOTIFY_REDIRECT_URI` (your deployed callback URL)
5. Deploy and verify `/api/health`.

### Option 2: Procfile-based hosts

This repository includes `Procfile` and `runtime.txt` for hosts that support this runtime model.

## Spotify Redirect URI Setup

Use matching callback URLs in both your environment and Spotify Developer Dashboard.

- Local: `http://127.0.0.1:5000/auth/spotify/callback`
- Production example: `https://your-domain/auth/spotify/callback`

## Build Windows EXE and Installer

1. Build desktop EXE:

```powershell
.\build_exe.ps1
```

2. Output EXE:

- `dist\MusicPlaylistGenerator.exe`

3. Build installer with Inno Setup using:

- `installer.iss`

4. Installer output:

- `dist\MusicPlaylistGeneratorSetup.exe`

## Production Checklist

1. Set a strong `SECRET_KEY` in deployment environment variables.
2. Keep `FLASK_ENV=production` and `FLASK_DEBUG=False`.
3. Ensure `SPOTIFY_REDIRECT_URI` matches your deployed domain callback.
4. Verify health endpoint: `/api/health`.
5. Rotate Spotify credentials if they were ever exposed.

## Documentation

See `DOCS/README.md` for full documentation and examples.
