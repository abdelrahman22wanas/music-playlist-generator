# 📚 Developer Documentation

## Project Architecture

### Backend Architecture

```
┌─────────────────────────────────────────────┐
│           Flask Web Application             │
├─────────────────────────────────────────────┤
│                                             │
│  app.py (Routes & API Endpoints)            │
│      ↓                                      │
│  playlist_generator.py (Core Logic)         │
│      ↓                                      │
│  spotify_auth.py (API Authentication)       │
│      ↓                                      │
│  Spotify Web API                            │
│                                             │
└─────────────────────────────────────────────┘
```

### Frontend Architecture

```
┌──────────────────────────────────────────┐
│        HTML Template (index.html)         │
│  - Form inputs (mood, activity, time)    │
│  - Results container                     │
│  - Track display                         │
├──────────────────────────────────────────┤
│   CSS Styling (style.css)                │
│  - Modern dark theme                     │
│  - Responsive grid layout                │
│  - Animation effects                     │
├──────────────────────────────────────────┤
│  JavaScript Logic (script.js)            │
│  - Event handling                        │
│  - API calls                             │
│  - DOM manipulation                      │
└──────────────────────────────────────────┘
```

## Code Flow

### Playlist Generation Flow

```
1. User Selection (Frontend)
   ├── Select mood
   ├── Select activity
   └── Select time of day
         ↓
2. API Request (JavaScript)
   ├── Validate selections
   ├── Send POST to /api/generate-playlist
   └── Show loading indicator
         ↓
3. Backend Processing (Flask)
   ├── Receive request parameters
   ├── Validate inputs
   └── Call PlaylistGenerator
         ↓
4. Spotify Integration
   ├── Build audio characteristics
   ├── Call Spotify recommendations API
   └── Format track data
         ↓
5. Response (JSON)
   ├── Return playlist array
   └── Include metadata
         ↓
6. Frontend Rendering
   ├── Hide loading indicator
   ├── Parse response
   ├── Create track elements
   └── Display playlist
         ↓
7. User Interaction
   ├── Preview tracks
   └── Open on Spotify
```

## Module Breakdown

### app.py
**Purpose**: Flask application entry point

**Key Functions**:
- `index()` - Serves main HTML
- `generate_playlist()` - POST endpoint for playlist generation
- `health_check()` - Verifies Spotify connection

**Dependencies**:
- Flask, playlist_generator, spotify_auth

### spotify_auth.py
**Purpose**: Handle Spotify API authentication

**Key Classes**:
- `SpotifyManager` - Singleton for Spotify client management

**Key Methods**:
- `get_spotify_client()` - Returns authenticated Spotipy client
- `test_connection()` - Verifies API access

**Features**:
- Singleton pattern (single instance)
- Client Credentials OAuth flow
- Error handling

### playlist_generator.py
**Purpose**: Core playlist generation logic

**Key Classes**:
- `PlaylistGenerator` - Main generator class

**Key Methods**:
- `get_playlist_params()` - Combines mood/activity/time into Spotify params
- `generate_playlist()` - Creates 25-track playlist
- `get_playlist_uri()` - Generates shareable URI

**Algorithm**:
1. Parse user selections (mood, activity, time)
2. Map to Spotify audio characteristics
3. Build seed genres list
4. Call Spotify recommendations API
5. Format and return tracks

### config.py
**Purpose**: Configuration and mappings

**Key Constants**:
- `MOOD_CHARACTERISTICS` - Audio features for each mood
- `ACTIVITY_CHARACTERISTICS` - Features for activities
- `TIME_OF_DAY_ADJUSTMENTS` - Time-based modifications
- `PLAYLIST_SIZE` - Number of tracks (25)

**Audio Features** (0.0 to 1.0 scale):
- `energy` - Intensity/activity level
- `danceability` - How danceable
- `valence` - Musical positivity
- `acousticness` - Acoustic vs electronic

## API Endpoints

### POST /api/generate-playlist
Generates a personalized playlist.

**Request**:
```json
{
  "mood": "happy",
  "activity": "workout",
  "time_of_day": "morning"
}
```

**Processing**:
1. Validate parameters
2. Create PlaylistGenerator instance
3. Call generate_playlist() method
4. Format response

**Response**:
```json
{
  "success": true,
  "playlist": [...],
  "metadata": {...}
}
```

**Status Codes**:
- 200: Success
- 400: Missing parameters
- 500: Server error

### GET /api/health
Checks Spotify API connection.

**Response**:
```json
{
  "status": "healthy",
  "spotify_connected": true
}
```

## Frontend Components

### HTML Elements
- **Mood Buttons**: 5 options with emoji
- **Activity Buttons**: 4 options with emoji
- **Time Buttons**: 4 options with emoji
- **Generate Button**: Disabled until all selections made
- **Loading Indicator**: Spinner animation
- **Playlist Container**: Displays 25 tracks
- **Track Items**: Album art, title, artist, preview button

### CSS Features
- **Dark Theme**: Background gradient with accent colors
- **Responsive**: Grid layout, mobile-friendly
- **Animations**: Smooth transitions, hover effects
- **Accessibility**: Good contrast ratios, clear labels

### JavaScript Features
- **State Management**: Tracks user selections
- **Event Listeners**: Button clicks, API responses
- **Audio Preview**: HTML5 Audio API integration
- **Error Handling**: User-friendly error messages
- **DOM Manipulation**: Dynamic content rendering

## Customization Guide

### Adding a New Mood

1. **Update config.py**:
```python
MOOD_CHARACTERISTICS = {
    'romantic': {
        'seed_genres': ['indie', 'soul', 'acoustic'],
        'energy': 0.5,
        'danceability': 0.4,
        'valence': 0.7,
    },
    # ... existing moods
}
```

2. **Update HTML**:
```html
<button class="mood-btn" data-mood="romantic">
    <span class="emoji">💕</span>
    <span class="label">Romantic</span>
</button>
```

3. **Add CSS** (if needed):
```css
.mood-btn[data-mood="romantic"]:hover {
    /* custom hover styles */
}
```

### Changing Audio Characteristics

Edit values in `config.py` (0.0 to 1.0):

```python
'happy': {
    'energy': 0.8,      # More energetic
    'valence': 0.9,     # Very happy
    'danceability': 0.75,
}
```

### Modifying Genres

Update the `seed_genres` lists:

```python
'workout': {
    'seed_genres': ['electronic', 'hip-hop', 'dance'],
}
```

## Performance Optimization

### Current Performance
- Cold start: ~2-3 seconds
- Playlist generation: 1-2 seconds per request
- Frontend rendering: <500ms

### Optimization Strategies

1. **Caching**:
```python
from functools import lru_cache

@lru_cache(maxsize=128)
def get_playlist_params(mood, activity, time):
    # Cached calculations
```

2. **Database Caching**:
```python
# Cache popular combinations
cache = {
    ('happy', 'workout', 'morning'): playlist_data
}
```

3. **Image Optimization**:
- Use CDN for album art
- Lazy load images
- Use WebP format

### Scaling Considerations

For production deployment:
- Use production WSGI server (Gunicorn)
- Add Redis for caching
- Database for playlist history
- Rate limiting (Flask-Limiter)
- Load balancing

## Testing

### Manual Testing Checklist

- [ ] Test all mood combinations
- [ ] Verify API credentials work
- [ ] Test with different times of day
- [ ] Preview functionality
- [ ] Mobile responsiveness
- [ ] Error handling (invalid inputs)
- [ ] Health check endpoint
- [ ] Loading/error states

### Unit Testing Example

```python
import unittest
from playlist_generator import PlaylistGenerator

class TestPlaylistGenerator(unittest.TestCase):
    def setUp(self):
        self.generator = PlaylistGenerator()
    
    def test_get_playlist_params(self):
        params = self.generator.get_playlist_params('happy', 'workout', 'morning')
        self.assertEqual(params['energy'], 0.9)  # Example assertion
    
    def test_generate_playlist_returns_25_tracks(self):
        playlist = self.generator.generate_playlist('happy', 'workout', 'morning')
        self.assertEqual(len(playlist), 25)
```

## Deployment

### Heroku Deployment

1. Install Heroku CLI
2. Create Procfile:
```
web: gunicorn app:app
```

3. Deploy:
```bash
heroku login
heroku create app-name
git push heroku main
heroku config:set SPOTIFY_CLIENT_ID=xxx
heroku config:set SPOTIFY_CLIENT_SECRET=xxx
```

### Docker Deployment

Create `Dockerfile`:
```dockerfile
FROM python:3.9-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
CMD ["gunicorn", "app:app"]
```

## Debugging Tips

### Enable Debug Logging

In `app.py`:
```python
import logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

@app.route('/api/generate-playlist', methods=['POST'])
def generate_playlist():
    logger.debug(f"Request data: {request.json}")
    # ... rest of code
```

### Browser DevTools

1. Open Developer Tools (F12)
2. Check Console for JavaScript errors
3. Check Network tab for API responses
4. Inspect HTML elements

### Spotify API Debugging

Check Spotify Dashboard:
- API request rate limits
- Error logs
- Usage analytics

## Environment Variables

| Variable | Purpose | Example |
|----------|---------|---------|
| SPOTIFY_CLIENT_ID | API authentication | abc123xyz |
| SPOTIFY_CLIENT_SECRET | API authentication | secret123 |
| FLASK_ENV | Environment mode | development |
| FLASK_DEBUG | Debug mode | True |
| SECRET_KEY | Flask sessions | random_string |

## Common Issues & Solutions

### Issue: "Recommendations not found"
- **Cause**: Invalid seed genres
- **Solution**: Check `config.py` genre list validity

### Issue: "Rate limited by Spotify"
- **Cause**: Too many API calls
- **Solution**: Implement caching, add delays

### Issue: "Preview URL not working"
- **Cause**: Spotify preview not available
- **Solution**: Add fallback UI message

---

## Resources

- [Spotify Web API Docs](https://developer.spotify.com/documentation/web-api/)
- [Spotipy Documentation](https://spotipy.readthedocs.io/)
- [Flask Documentation](https://flask.palletsprojects.com/)
- [Audio Features Guide](https://developer.spotify.com/documentation/web-api/reference/#/operations/get-audio-features)

---

**Happy coding! 🎵**
