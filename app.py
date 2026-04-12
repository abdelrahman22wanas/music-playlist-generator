"""
Flask application for the Music Playlist Generator.
"""
from flask import Flask, render_template, jsonify, request, session, redirect, url_for
from playlist_generator import PlaylistGenerator
from spotify_auth import (
    SpotifyManager,
    get_spotify_oauth,
    get_user_spotify_client,
    get_loaded_env_path,
)
import os
import sys
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables
load_dotenv()


def _get_asset_root():
    """Resolve template/static location for source and packaged (PyInstaller) runs."""
    if getattr(sys, 'frozen', False) and hasattr(sys, '_MEIPASS'):
        return Path(sys._MEIPASS)
    return Path(__file__).resolve().parent


ASSET_ROOT = _get_asset_root()

app = Flask(
    __name__,
    template_folder=str(ASSET_ROOT / 'templates'),
    static_folder=str(ASSET_ROOT / 'static'),
)
app.secret_key = os.getenv('SECRET_KEY', 'dev-secret-key')


def _clamp(value, low, high):
    return max(low, min(high, value))


def _safe_float(value, default=0.0):
    try:
        return float(value)
    except (TypeError, ValueError):
        return default


def _build_explanation(playlist, mood, activity, time_of_day, discovery_bias, intensity_bias):
    """Build a human-readable explanation for generated playlist choices."""
    if not playlist:
        return {}

    unique_artists = set()
    popularity_values = []
    total_duration_ms = 0
    for track in playlist:
        artist_names = [a.strip() for a in (track.get('artist') or '').split(',') if a.strip()]
        unique_artists.update(artist_names)
        popularity_values.append(track.get('popularity', 0) or 0)
        total_duration_ms += track.get('duration_ms', 0) or 0

    avg_popularity = round(sum(popularity_values) / len(popularity_values), 1)
    avg_duration_min = round((total_duration_ms / max(1, len(playlist))) / 60000, 2)

    discovery_text = 'discovery-leaning' if discovery_bias > 0.2 else 'mainstream-leaning' if discovery_bias < -0.2 else 'balanced popularity'
    intensity_text = 'high intensity' if intensity_bias > 0.2 else 'low intensity' if intensity_bias < -0.2 else 'moderate intensity'

    return {
        'summary': (
            f'This mix is tuned for {mood} + {activity} in the {time_of_day}, '
            f'with {discovery_text} and {intensity_text} settings.'
        ),
        'avg_popularity': avg_popularity,
        'avg_duration_min': avg_duration_min,
        'unique_artists': len(unique_artists),
        'total_tracks': len(playlist),
    }


def _build_runtime_redirect_uri():
    """Build callback URL on the same host the user is currently using."""
    return f"{request.host_url.rstrip('/')}{url_for('spotify_callback')}"

def main():
    """Run the Flask app for local and production entry points."""
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port)


@app.route('/')
def index():
    """Render the main page."""
    return render_template('index.html')


@app.route('/auth/spotify/login', methods=['GET'])
def spotify_login():
    """Start Spotify OAuth login flow."""
    try:
        # Ensure fresh OAuth token with latest requested scopes.
        session.pop('spotify_token_info', None)
        runtime_redirect_uri = _build_runtime_redirect_uri()
        session['spotify_redirect_uri'] = runtime_redirect_uri
        oauth = get_spotify_oauth(redirect_uri_override=runtime_redirect_uri)
        auth_url = oauth.get_authorize_url()
        return redirect(auth_url)
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/auth/spotify/callback', methods=['GET'])
def spotify_callback():
    """Handle Spotify OAuth callback and store session token."""
    code = request.args.get('code')
    if not code:
        return redirect(url_for('index'))

    try:
        runtime_redirect_uri = session.get('spotify_redirect_uri') or _build_runtime_redirect_uri()
        oauth = get_spotify_oauth(redirect_uri_override=runtime_redirect_uri)
        token_info = oauth.get_access_token(code, as_dict=True)
        session['spotify_token_info'] = token_info
    except Exception as e:
        print(f"Spotify callback error: {str(e)}")

    return redirect(url_for('index'))


@app.route('/auth/spotify/logout', methods=['GET'])
def spotify_logout():
    """Clear Spotify OAuth session."""
    session.pop('spotify_token_info', None)
    session.pop('spotify_redirect_uri', None)
    return redirect(url_for('index'))


@app.route('/api/auth/status', methods=['GET'])
def auth_status():
    """Return current Spotify auth status for frontend UI."""
    token_info = session.get('spotify_token_info')
    runtime_redirect_uri = session.get('spotify_redirect_uri')
    sp, refreshed_token = get_user_spotify_client(
        token_info,
        redirect_uri_override=runtime_redirect_uri,
    )
    if not sp:
        return jsonify({'authenticated': False}), 200

    if refreshed_token:
        session['spotify_token_info'] = refreshed_token

    try:
        profile = sp.current_user()
        return jsonify({
            'authenticated': True,
            'user': {
                'id': profile.get('id'),
                'display_name': profile.get('display_name') or profile.get('id'),
                'email': profile.get('email'),
            },
        }), 200
    except Exception:
        session.pop('spotify_token_info', None)
        return jsonify({'authenticated': False}), 200


@app.route('/api/generate-playlist', methods=['POST'])
def generate_playlist():
    """API endpoint to generate a playlist."""
    try:
        data = request.json or {}
        
        # Validate inputs
        mood = data.get('mood', '').lower()
        activity = data.get('activity', '').lower()
        time_of_day = data.get('time_of_day', '').lower()
        
        if not mood or not activity or not time_of_day:
            return jsonify({'error': 'Missing required parameters'}), 400

        valid_moods = {'happy', 'sad', 'energetic', 'calm', 'party'}
        valid_activities = {'workout', 'study', 'party', 'sleep'}
        valid_times = {'morning', 'afternoon', 'evening', 'night'}

        if mood not in valid_moods:
            return jsonify({'error': 'Invalid mood value'}), 400
        if activity not in valid_activities:
            return jsonify({'error': 'Invalid activity value'}), 400
        if time_of_day not in valid_times:
            return jsonify({'error': 'Invalid time_of_day value'}), 400

        discovery_bias = _clamp(_safe_float(data.get('discovery_bias', 0.0), 0.0), -1.0, 1.0)
        intensity_bias = _clamp(_safe_float(data.get('intensity_bias', 0.0), 0.0), -1.0, 1.0)
        exclude_track_ids = [str(x).strip() for x in (data.get('exclude_track_ids') or []) if str(x).strip()]
        exclude_artist_names = [str(x).strip() for x in (data.get('exclude_artist_names') or []) if str(x).strip()]

        # Lazily initialize Spotify-dependent components to keep app boot resilient.
        playlist_generator = PlaylistGenerator()
        
        # Generate playlist
        playlist = playlist_generator.generate_playlist(
            mood,
            activity,
            time_of_day,
            discovery_bias=discovery_bias,
            intensity_bias=intensity_bias,
            exclude_track_ids=exclude_track_ids,
            exclude_artist_names=exclude_artist_names,
        )
        
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
            },
            'explanation': _build_explanation(
                playlist,
                mood,
                activity,
                time_of_day,
                discovery_bias,
                intensity_bias,
            ),
        }), 200
    
    except Exception as e:
        print(f"Error in generate_playlist: {str(e)}")
        return jsonify({'error': 'Unable to generate playlist. Check Spotify credentials.'}), 500


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
            'env_path': get_loaded_env_path(),
        }), 200
    except Exception as e:
        return jsonify({
            'status': 'error',
            'error': str(e),
        }), 500


@app.errorhandler(404)
def not_found(error):
    """Handle 404 errors."""
    if request.path.startswith('/api/'):
        return jsonify({'error': 'Not found'}), 404

    return render_template(
        'error.html',
        title='Page Not Found',
        message='The page you are looking for does not exist or may have been moved.',
    ), 404


@app.errorhandler(405)
def method_not_allowed(error):
    """Handle 405 errors."""
    if request.path.startswith('/api/'):
        return jsonify({'error': 'Method not allowed'}), 405

    return render_template(
        'error.html',
        title='Method Not Allowed',
        message='This action is not supported for the requested page.',
    ), 405


@app.errorhandler(500)
def internal_error(error):
    """Handle 500 errors."""
    if request.path.startswith('/api/'):
        return jsonify({'error': 'Internal server error'}), 500

    return render_template(
        'error.html',
        title='Something Went Wrong',
        message='An unexpected error occurred. Please try again in a moment.',
    ), 500


if __name__ == '__main__':
    main()