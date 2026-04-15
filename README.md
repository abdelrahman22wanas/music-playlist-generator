# Music Playlist Generator

Generate personalized Spotify playlists based on mood, activity, and time of day.

## Features

- Playlist generation from mood, activity, and time inputs
- Spotify user sign-in support for personalized actions
- Save generated playlists to your Spotify account
- Flask API backend with HTML/CSS/JavaScript frontend
- Health endpoint for deployment checks
- Docker, Render, and Windows desktop packaging support

## Saving Playlists to Spotify

The app follows the Spotify Web API playlist flow:

1. Authenticate with Spotify using the Authorization Code Flow.
2. Request these scopes:
   - `playlist-modify-public`
   - `playlist-modify-private`
   - `user-read-email`
   - `user-read-private`
3. Read the current user profile with `GET /me` to get the user id.
4. Create a playlist with `POST /me/playlists`.
5. Add the generated track URIs to that playlist in batches of up to 100 items.

The app saves playlists as private by default.

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

Open <http://localhost:5000>

## Run with Docker

```powershell
docker-compose up --build
```

The app will be available at <http://localhost:5000>.

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

### Option 3: Vercel

This project supports Vercel serverless deployment via `vercel.json` and `api/index.py`.

1. Install Vercel CLI and login:

```powershell
npm i -g vercel
vercel login
```

1. Deploy from project root:

```powershell
vercel
```

1. Set required environment variables in Vercel Project Settings:

- `SPOTIFY_CLIENT_ID`
- `SPOTIFY_CLIENT_SECRET`
- `SECRET_KEY`
- `SPOTIFY_REDIRECT_URI=https://<your-vercel-domain>/auth/spotify/callback`

1. Redeploy after env vars are set:

```powershell
vercel --prod
```

## Spotify Redirect URI Setup

Use matching callback URLs in both your environment and Spotify Developer Dashboard.

- Local: `http://127.0.0.1:5000/auth/spotify/callback`
- Production example: `https://your-domain/auth/spotify/callback`

## Build Windows EXE and Installer

1. Build desktop EXE:

```powershell
.\build_exe.ps1
```

1. Output EXE:

- `dist\MusicPlaylistGenerator.exe`

1. Build installer with Inno Setup using:

- `installer.iss`

1. Installer output:

- `dist\MusicPlaylistGeneratorSetup.exe`

## Production Checklist

1. Set a strong `SECRET_KEY` in deployment environment variables.
2. Keep `FLASK_ENV=production` and `FLASK_DEBUG=False`.
3. Ensure `SPOTIFY_REDIRECT_URI` matches your deployed domain callback.
4. Verify health endpoint: `/api/health`.
5. Rotate Spotify credentials if they were ever exposed.

## Documentation

See `DOCS/README.md` for full documentation and examples.
