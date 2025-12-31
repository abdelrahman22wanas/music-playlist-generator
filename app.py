"""
Flask application for the Music Playlist Generator.
"""
from flask import Flask, render_template, jsonify, request
from playlist_generator import PlaylistGenerator
from spotify_auth import SpotifyManager
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

app = Flask(__name__)
app.secret_key = os.getenv('SECRET_KEY', 'dev-secret-key')

# Initialize managers
playlist_generator = PlaylistGenerator()


@app.route('/')
def index():
    """Render the main page."""
    return render_template('index.html')


@app.route('/api/generate-playlist', methods=['POST'])
def generate_playlist():
    """API endpoint to generate a playlist."""
    try:
        data = request.json
        
        # Validate inputs
        mood = data.get('mood', '').lower()
        activity = data.get('activity', '').lower()
        time_of_day = data.get('time_of_day', '').lower()
        
        if not mood or not activity or not time_of_day:
            return jsonify({'error': 'Missing required parameters'}), 400
        
        # Generate playlist
        playlist = playlist_generator.generate_playlist(mood, activity, time_of_day)
        
        if not playlist:
            return jsonify({'error': 'Failed to generate playlist'}), 500
        
        return jsonify({
            'success': True,
            'playlist': playlist,
            'metadata': {
                'mood': mood,
                'activity': activity,
                'time_of_day': time_of_day,
                'total_tracks': len(playlist),
            }
        }), 200
    
    except Exception as e:
        print(f"Error in generate_playlist: {str(e)}")
        return jsonify({'error': str(e)}), 500


@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint."""
    try:
        # Test Spotify connection
        spotify_manager = SpotifyManager()
        is_connected = spotify_manager.test_connection()
        
        return jsonify({
            'status': 'healthy' if is_connected else 'disconnected',
            'spotify_connected': is_connected,
        }), 200
    except Exception as e:
        return jsonify({
            'status': 'error',
            'error': str(e),
        }), 500


@app.errorhandler(404)
def not_found(error):
    """Handle 404 errors."""
    return jsonify({'error': 'Not found'}), 404


@app.errorhandler(500)
def internal_error(error):
    """Handle 500 errors."""
    return jsonify({'error': 'Internal server error'}), 500


if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port)