"""Core playlist generation logic."""
import random
from config import (
    MOOD_CHARACTERISTICS,
    ACTIVITY_CHARACTERISTICS,
    TIME_OF_DAY_ADJUSTMENTS,
    PLAYLIST_SIZE,
)
from spotify_auth import SpotifyManager


class PlaylistGenerator:
    """Generates personalized playlists based on user preferences."""
    
    def __init__(self):
        self.spotify_manager = SpotifyManager()
        self.sp = self.spotify_manager.get_spotify_client()
    
    def get_playlist_params(self, mood, activity, time_of_day):
        """
        Combine mood, activity, and time parameters to create Spotify search params.
        """
        params = {
            'seed_genres': set(),
            'energy': 0.5,
            'danceability': 0.5,
            'valence': 0.5,
            'acousticness': 0.5,
        }
        
        # Apply mood characteristics
        if mood in MOOD_CHARACTERISTICS:
            mood_config = MOOD_CHARACTERISTICS[mood]
            params['energy'] = mood_config.get('energy', params['energy'])
            params['danceability'] = mood_config.get('danceability', params['danceability'])
            params['valence'] = mood_config.get('valence', params['valence'])
            params['seed_genres'].update(mood_config.get('seed_genres', []))
        
        # Apply activity characteristics
        if activity in ACTIVITY_CHARACTERISTICS:
            activity_config = ACTIVITY_CHARACTERISTICS[activity]
            params['energy'] = activity_config.get('energy', params['energy'])
            params['danceability'] = activity_config.get('danceability', params['danceability'])
            params['seed_genres'].update(activity_config.get('seed_genres', []))
        
        # Apply time of day adjustments
        if time_of_day in TIME_OF_DAY_ADJUSTMENTS:
            time_config = TIME_OF_DAY_ADJUSTMENTS[time_of_day]
            energy_boost = time_config.get('energy_boost', 0)
            params['energy'] = max(0, min(1, params['energy'] + energy_boost))
            params['seed_genres'].update(time_config.get('seed_genres', []))
        
        # Ensure we have genres
        params['seed_genres'] = list(params['seed_genres'])[:5]  # Spotify allows max 5 seed genres
        
        return params
    
    def generate_playlist(self, mood, activity, time_of_day, target_language=None):
        """
        Generate a playlist based on user preferences.
        
        Args:
            mood: User's mood (happy, sad, energetic, calm, party)
            activity: User's activity (workout, study, party, sleep)
            time_of_day: Time of day (morning, afternoon, evening, night)
            target_language: Optional language filter (e.g., 'en', 'es', 'fr')
        
        Returns:
            List of playlist tracks with metadata
        """
        try:
            params = self.get_playlist_params(mood, activity, time_of_day)
            
            # Recommendations API call
            recommendations = self.sp.recommendations(
                seed_genres=params['seed_genres'],
                target_energy=params['energy'],
                target_danceability=params['danceability'],
                target_valence=params['valence'],
                limit=PLAYLIST_SIZE,
            )
            
            # Extract and format track information
            playlist = []
            for track in recommendations['tracks']:
                playlist.append({
                    'name': track['name'],
                    'artist': ', '.join([artist['name'] for artist in track['artists']]),
                    'album': track['album']['name'],
                    'image': track['album']['images'][0]['url'] if track['album']['images'] else None,
                    'preview_url': track['preview_url'],
                    'external_urls': track['external_urls'],
                    'uri': track['uri'],
                    'id': track['id'],
                    'popularity': track['popularity'],
                    'duration_ms': track['duration_ms'],
                })
            
            return playlist
        
        except Exception as e:
            print(f"Error generating playlist: {str(e)}")
            return []
    
    def get_playlist_uri(self, tracks):
        """Generate a Spotify URI for the playlist."""
        if not tracks:
            return None
        
        track_uris = [track['uri'] for track in tracks]
        return f"spotify:tracks:{','.join([uri.split(':')[-1] for uri in track_uris])}"
