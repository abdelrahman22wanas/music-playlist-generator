# Music Playlist Generator

Generate personalized Spotify playlists based on mood, activity, and time of day.

## Use It Locally

1. Create and activate a virtual environment.
2. Install dependencies from requirements.txt.
3. Configure Spotify credentials in .env.
4. Run the app with python app.py.
5. Open http://localhost:5000.

## Make It Public (for everyone)

### Option 1: Render (recommended)

1. Push this repository to GitHub.
2. Sign in to Render and choose New + > Blueprint.
3. Select this repository. Render will use render.yaml automatically.
4. Set these required environment variables in Render:
	- SPOTIFY_CLIENT_ID
	- SPOTIFY_CLIENT_SECRET
5. Deploy and share the generated public URL.

### Option 2: Railway/Heroku-style platforms

This repo includes Procfile and runtime.txt, so most Python hosts can run it directly.

## Production Checklist

1. Set a strong SECRET_KEY in host environment variables.
2. Keep FLASK_ENV=production and FLASK_DEBUG=False.
3. Rotate Spotify credentials if they were ever committed by mistake.
4. Test public health endpoint: /api/health.

## Full Docs

See DOCS/README.md for full documentation and examples.
