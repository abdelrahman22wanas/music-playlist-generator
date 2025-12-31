"""Spotify authentication and session management."""
import os
from dotenv import load_dotenv
import spotipy
from spotipy.oauth2 import SpotifyClientCredentials

# Load environment variables
load_dotenv()

SPOTIFY_CLIENT_ID = os.getenv('SPOTIFY_CLIENT_ID')
SPOTIFY_CLIENT_SECRET = os.getenv('SPOTIFY_CLIENT_SECRET')


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
                auth_manager = SpotifyClientCredentials(
                    client_id=SPOTIFY_CLIENT_ID,
                    client_secret=SPOTIFY_CLIENT_SECRET
                )
                self.sp = spotipy.Spotify(auth_manager=auth_manager)
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
