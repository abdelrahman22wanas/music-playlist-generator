# 🎵 Music Playlist Generator

A personalized playlist generator powered by Spotify API that creates custom playlists based on your mood, activity, and time of day.

## Features

✨ **Mood-Based Selection**
- Happy, Sad, Energetic, Calm, Party moods
- Each mood maps to specific audio characteristics

🎯 **Activity Selection**
- Workout, Study, Party, Sleep activities
- Customized recommendations based on activity type

⏰ **Time-Aware Recommendations**
- Morning, Afternoon, Evening, Night
- Adjusts energy levels based on time of day

🎵 **25-Track Playlists**
- Curated from Spotify's recommendations API
- High-quality track information with album art
- Preview functionality for each track

🎨 **Beautiful UI**
- Modern dark theme with Spotify green accents
- Responsive design for all devices
- Smooth animations and transitions
- Emoji-based interface

## Tech Stack

- **Backend**: Flask (Python web framework)
- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **Music API**: Spotify Web API
- **Python Libraries**:
  - `spotipy` - Spotify Python client
  - `flask` - Web framework
  - `python-dotenv` - Environment variable management

## Project Structure

```
music-playlist-generator/
├── app.py                    # Flask application entry point
├── spotify_auth.py           # Spotify API authentication
├── playlist_generator.py      # Core playlist generation logic
├── config.py                 # Configuration & music characteristics mappings
├── requirements.txt          # Python dependencies
├── .env                      # Environment variables (API credentials)
├── .gitignore                # Git ignore file
├── README.md                 # This file
├── templates/
│   └── index.html            # Main HTML template
└── static/
    ├── css/
    │   └── style.css         # Styling
    └── js/
        └── script.js         # Frontend functionality
```

## Setup Instructions

### 1. Prerequisites

- Python 3.8 or higher
- pip (Python package manager)
- Spotify Developer Account

### 2. Create Spotify Application

1. Go to [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. Log in or create a Spotify account
3. Create a new application
4. Accept the terms and create
5. Copy your **Client ID** and **Client Secret**

### 3. Clone/Download Project

```bash
cd "d:\Important\Music Playlist Generator"
```

### 4. Create Virtual Environment (Recommended)

```bash
# On Windows
python -m venv venv
venv\Scripts\activate

# On macOS/Linux
python3 -m venv venv
source venv/bin/activate
```

### 5. Install Dependencies

```bash
pip install -r requirements.txt
```

### 6. Configure Environment Variables

1. Open `.env` file in the root directory
2. Replace placeholders with your Spotify credentials:

```env
SPOTIFY_CLIENT_ID=your_client_id_here
SPOTIFY_CLIENT_SECRET=your_client_secret_here
FLASK_ENV=development
FLASK_DEBUG=True
SECRET_KEY=your_secret_key_here
```

### 7. Run the Application

```bash
# Make sure virtual environment is activated
python app.py
```

The application will start on `http://localhost:5000`

Open your browser and navigate to the URL.

## How to Use

1. **Select Your Mood**: Click one of the mood buttons (Happy, Sad, Energetic, Calm, Party)
2. **Choose Activity**: Select what you'll be doing (Workout, Study, Party, Sleep)
3. **Pick Time of Day**: Choose the current time (Morning, Afternoon, Evening, Night)
4. **Generate Playlist**: Click "Generate Playlist 🎵" button
5. **Explore Results**: 
   - View 25 personalized tracks
   - See album art for each track
   - Preview tracks (if available)
   - Click track names to open on Spotify

## Configuration Details

### Mood Characteristics

Each mood influences these Spotify audio features:

- **Happy**: High valence, high danceability, energetic
- **Sad**: Low valence, low energy, melancholic
- **Energetic**: High energy, fast tempo, high danceability
- **Calm**: Low energy, smooth, relaxing
- **Party**: High energy, high danceability, upbeat

### Activity Mappings

- **Workout**: High energy, fast-paced, energetic genres
- **Study**: Medium energy, low danceability, focused genres
- **Party**: Very high energy, maximum danceability
- **Sleep**: Very low energy, calm, ambient genres

### Time of Day Adjustments

- **Morning**: Slight energy boost to wake up
- **Afternoon**: Neutral energy levels
- **Evening**: Slight energy reduction
- **Night**: Significant energy reduction for relaxation

## API Endpoints

### `GET /`
Returns the main HTML interface.

### `POST /api/generate-playlist`
Generates a personalized playlist.

**Request Body**:
```json
{
  "mood": "happy",
  "activity": "workout",
  "time_of_day": "morning"
}
```

**Response**:
```json
{
  "success": true,
  "playlist": [
    {
      "name": "Track Name",
      "artist": "Artist Name",
      "album": "Album Name",
      "image": "album_art_url",
      "preview_url": "preview_audio_url",
      "duration_ms": 240000,
      "popularity": 75,
      "uri": "spotify:track:..."
    }
  ],
  "metadata": {
    "mood": "happy",
    "activity": "workout",
    "time_of_day": "morning",
    "total_tracks": 25
  }
}
```

### `GET /api/health`
Health check endpoint to verify Spotify connection.

**Response**:
```json
{
  "status": "healthy",
  "spotify_connected": true
}
```

## Troubleshooting

### "Failed to initialize Spotify" Error
- Check that your `SPOTIFY_CLIENT_ID` and `SPOTIFY_CLIENT_SECRET` are correct
- Ensure `.env` file is in the root directory
- Verify your Spotify app credentials in the developer dashboard

### "Missing required parameters" Error
- Make sure you select all three options: mood, activity, and time of day
- Check that the generate button is enabled

### Preview Not Available
- Some tracks don't have preview URLs available on Spotify
- This is a limitation of the Spotify API

### CORS Errors
- These errors are usually related to browser security
- Ensure you're accessing the app through `http://localhost:5000`

### Port Already in Use
If port 5000 is already in use, modify `app.py`:
```python
if __name__ == '__main__':
    app.run(debug=True, port=5001)  # Change to different port
```

## Customization

### Adding New Moods or Activities

1. Edit `config.py`
2. Add new entries to `MOOD_CHARACTERISTICS` or `ACTIVITY_CHARACTERISTICS`
3. Update HTML buttons in `templates/index.html`
4. Add corresponding CSS styling in `static/css/style.css`

### Changing Playlist Size

In `config.py`, modify:
```python
PLAYLIST_SIZE = 50  # Default is 25
```

### Modifying Audio Features

Edit the values in `config.py` (0 to 1 scale):
- `energy`: Intensity and activity
- `danceability`: Rhythm suitability
- `valence`: Happiness/positivity
- `acousticness`: Acoustic vs electronic

## Performance Tips

- Playlists are generated on-demand using Spotify's recommendations API
- Response time typically 1-3 seconds depending on API latency
- Consider caching frequently requested combinations for faster response

## API Rate Limiting

Spotify API has rate limits. The current implementation uses Client Credentials flow which is suitable for personal use. For production, consider:
- Implementing rate limiting
- Adding caching layer (Redis)
- Using authorization code flow for user-specific recommendations

## Future Enhancements

- [ ] User authentication for personalized history
- [ ] Save playlists to Spotify account
- [ ] Share playlists via link
- [ ] Machine learning recommendations based on listening history
- [ ] Genre-based filtering
- [ ] Playlist export (Spotify, Apple Music, etc.)
- [ ] Mobile app version
- [ ] Dark/Light theme toggle

## License

This project is open source and available under the MIT License.

## Contributing

Contributions are welcome! Feel free to:
1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## Support

For issues or questions:
1. Check the Troubleshooting section
2. Review Spotify API documentation: https://developer.spotify.com/documentation/web-api
3. Open an issue with detailed information

## Credits

- Built with [Spotify Web API](https://developer.spotify.com/documentation/web-api/)
- UI inspired by modern music streaming services
- Made with ❤️ for music lovers

---

**Happy Listening! 🎵**
