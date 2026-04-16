"""Spotify authentication and session management."""
import os
from pathlib import Path
from dotenv import load_dotenv
import spotipy
from spotipy.oauth2 import SpotifyClientCredentials, SpotifyOAuth

APP_CONFIG_FOLDER = 'MusicPlaylistGenerator'


def _clean_env_value(value):
    """Normalize env values by trimming whitespace and surrounding quotes."""
    if value is None:
        return ''
    cleaned = str(value).strip()
    if len(cleaned) >= 2 and cleaned[0] == cleaned[-1] and cleaned[0] in {'"', "'"}:
        cleaned = cleaned[1:-1].strip()
    return cleaned


def _get_env_candidates():
    """Return candidate .env locations ordered by priority."""
    candidates = []

    explicit_env = os.getenv('MUSIC_PLAYLIST_ENV_PATH')
    if explicit_env:
        candidates.append(Path(explicit_env).expanduser())

    appdata = os.getenv('APPDATA')
    appdata_env = Path(appdata) / APP_CONFIG_FOLDER / '.env' if appdata else None

    cwd_env = Path.cwd() / '.env'
    repo_env = Path(__file__).resolve().parent / '.env'

    # Development should prefer local project env files over global AppData values.
    ordered = [cwd_env, repo_env, appdata_env]

    for candidate in ordered:
        if candidate:
            candidates.append(candidate)

    return candidates


def _load_env_file():
    """Load first available .env file and return the resolved path."""
    for env_path in _get_env_candidates():
        if env_path.exists():
            load_dotenv(dotenv_path=str(env_path), override=True)
            return str(env_path)
    return None


LOADED_ENV_PATH = _load_env_file()


def get_loaded_env_path():
    """Return resolved .env path for diagnostics."""
    return LOADED_ENV_PATH


def _get_oauth_config(redirect_uri_override=None):
    """Resolve OAuth settings from environment."""
    redirect_uri = (
        redirect_uri_override
        or os.getenv('SPOTIFY_REDIRECT_URI')
        or os.getenv('SPOTIPY_REDIRECT_URI')
        or 'http://127.0.0.1:5000/auth/spotify/callback'
    )

    client_id = _clean_env_value(
        os.getenv('SPOTIFY_CLIENT_ID')
        or os.getenv('SPOTIPY_CLIENT_ID')
        or ''
    )
    client_secret = _clean_env_value(
        os.getenv('SPOTIFY_CLIENT_SECRET')
        or os.getenv('SPOTIPY_CLIENT_SECRET')
        or ''
    )

    if not client_id or not client_secret:
        raise ValueError(
            'Missing Spotify credentials. Set SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET in .env'
        )

    return {
        'client_id': client_id,
        'client_secret': client_secret,
        'redirect_uri': redirect_uri,
    }


def get_spotify_oauth(redirect_uri_override=None):
    """Create OAuth manager for user sign-in."""
    cfg = _get_oauth_config(redirect_uri_override=redirect_uri_override)
    return SpotifyOAuth(
        client_id=cfg['client_id'],
        client_secret=cfg['client_secret'],
        redirect_uri=cfg['redirect_uri'],
        scope='user-read-email user-read-private user-top-read',
        cache_path=None,
        show_dialog=True,
    )


def get_user_spotify_client(token_info, redirect_uri_override=None):
    """Return authenticated user client and refreshed token info if available."""
    if not token_info:
        return None, None

    oauth = get_spotify_oauth(redirect_uri_override=redirect_uri_override)

    if oauth.is_token_expired(token_info):
        refresh_token = token_info.get('refresh_token')
        if not refresh_token:
            return None, None
        token_info = oauth.refresh_access_token(refresh_token)

    access_token = token_info.get('access_token')
    if not access_token:
        return None, None

    return spotipy.Spotify(
        auth=access_token,
        requests_timeout=15,
        retries=3,
        status_retries=3,
        backoff_factor=0.3,
    ), token_info


class SpotifyManager:
    """Manages Spotify API connections."""
    
    _instance = None
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(SpotifyManager, cls).__new__(cls)
            cls._instance._initialized = False
        return cls._instance
    
    def __init__(self):
        if not self._initialized:
            try:
                spotify_client_id = _clean_env_value(
                    os.getenv('SPOTIFY_CLIENT_ID') or os.getenv('SPOTIPY_CLIENT_ID') or ''
                )
                spotify_client_secret = _clean_env_value(
                    os.getenv('SPOTIFY_CLIENT_SECRET') or os.getenv('SPOTIPY_CLIENT_SECRET') or ''
                )

                if not spotify_client_id or not spotify_client_secret:
                    raise ValueError(
                        "Missing Spotify credentials. Set SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET in .env"
                    )

                auth_manager = SpotifyClientCredentials(
                    client_id=spotify_client_id,
                    client_secret=spotify_client_secret
                )
                self.sp = spotipy.Spotify(
                    auth_manager=auth_manager,
                    requests_timeout=15,
                    retries=3,
                    status_retries=3,
                    backoff_factor=0.3,
                )
                self._initialized = True
            except Exception as e:
                raise Exception(f"Failed to initialize Spotify: {str(e)}")
    
    def get_spotify_client(self):
        """Return the Spotify client."""
        return self.sp
    
    def test_connection(self):
        """Test if Spotify connection is working."""
        try:
            self.sp.search(q='track:test', limit=1)
            return True
        except Exception as e:
            print(f"Spotify connection test failed: {str(e)}")
            return False
