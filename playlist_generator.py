"""Core playlist generation logic."""
import random
from collections import deque
from config import (
    MOOD_CHARACTERISTICS,
    ACTIVITY_CHARACTERISTICS,
    TIME_OF_DAY_ADJUSTMENTS,
    PLAYLIST_SIZE,
    SEARCH_LIMIT,
    RECENT_TRACK_WINDOW,
)
from spotify_auth import SpotifyManager


class PlaylistGenerator:
    """Generates personalized playlists based on user preferences."""
    _recent_track_ids = deque(maxlen=RECENT_TRACK_WINDOW)
    _last_successful_tracks = []
    
    def __init__(self):
        self.spotify_manager = SpotifyManager()
        self.sp = self.spotify_manager.get_spotify_client()

    @staticmethod
    def _clamp(value, low=0.0, high=1.0):
        return max(low, min(high, value))
    
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
    
    def generate_playlist(
        self,
        mood,
        activity,
        time_of_day,
        target_language=None,
        discovery_bias=0.0,
        intensity_bias=0.0,
        exclude_track_ids=None,
        exclude_artist_names=None,
    ):
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
            exclude_track_ids = {str(track_id).strip() for track_id in (exclude_track_ids or []) if str(track_id).strip()}
            exclude_artist_names = {str(name).strip().lower() for name in (exclude_artist_names or []) if str(name).strip()}

            # Apply user tuning controls.
            params['energy'] = self._clamp(params['energy'] + (float(intensity_bias) * 0.25))
            params['danceability'] = self._clamp(params['danceability'] + (float(intensity_bias) * 0.15))
            target_popularity = int(max(0, min(100, 65 - (float(discovery_bias) * 35))))

            try:
                recommendations = self.sp.recommendations(
                    seed_genres=params['seed_genres'],
                    target_energy=params['energy'],
                    target_danceability=params['danceability'],
                    target_valence=params['valence'],
                    target_popularity=target_popularity,
                    limit=PLAYLIST_SIZE,
                )
                source_tracks = recommendations.get('tracks', [])
            except Exception as rec_error:
                print(f"Recommendations endpoint unavailable, using search fallback: {str(rec_error)}")
                source_tracks = self._search_fallback_tracks(params['seed_genres'], discovery_bias=float(discovery_bias))

            source_tracks = self._pick_diverse_tracks(
                source_tracks,
                PLAYLIST_SIZE,
                avoid_recent=True,
                exclude_track_ids=exclude_track_ids,
                exclude_artist_names=exclude_artist_names,
            )

            # If anti-repeat filters make the set too small, top it up from fallback candidates.
            if len(source_tracks) < PLAYLIST_SIZE:
                fallback_tracks = self._search_fallback_tracks(params['seed_genres'], discovery_bias=float(discovery_bias))
                existing_ids = {track.get('id') for track in source_tracks if track.get('id')}
                for track in fallback_tracks:
                    track_id = track.get('id')
                    if track_id and track_id not in existing_ids:
                        source_tracks.append(track)
                        existing_ids.add(track_id)
                source_tracks = self._pick_diverse_tracks(
                    source_tracks,
                    PLAYLIST_SIZE,
                    avoid_recent=True,
                    exclude_track_ids=exclude_track_ids,
                    exclude_artist_names=exclude_artist_names,
                )

            self._remember_tracks(source_tracks)

            if source_tracks:
                self._last_successful_tracks = source_tracks[:]

            playlist = [self._format_track(track) for track in source_tracks][:PLAYLIST_SIZE]
            return playlist

        except Exception as e:
            print(f"Error generating playlist: {str(e)}")
            if self._last_successful_tracks:
                print("Using last successful playlist cache as emergency fallback")
                cached_tracks = self._last_successful_tracks[:]
                random.shuffle(cached_tracks)
                return [self._format_track(track) for track in cached_tracks][:PLAYLIST_SIZE]
            return []

    def _search_fallback_tracks(self, seed_genres, discovery_bias=0.0):
        """Fallback when recommendations API is unavailable."""
        candidates = []
        seen_ids = set()
        genres = list(seed_genres)
        random.shuffle(genres)
        decade_ranges = [
            (1970, 1979),
            (1980, 1989),
            (1990, 1999),
            (2000, 2009),
            (2010, 2019),
            (2020, 2026),
        ]

        # Use multiple randomized windows per genre to avoid always returning the same top tracks.
        for genre in genres:
            for _ in range(2):
                # Discovery bias nudges search offset deeper into catalog when positive.
                base_offset = 100 if discovery_bias > 0.2 else 0
                max_offset = 1000 if discovery_bias > 0.2 else 700
                offset = random.randint(base_offset, max_offset)
                start_year, end_year = random.choice(decade_ranges)
                try:
                    results = self.sp.search(
                        q=f"genre:{genre} year:{start_year}-{end_year}",
                        type='track',
                        limit=SEARCH_LIMIT,
                        offset=offset,
                    )
                except Exception as search_error:
                    print(f"Fallback search failed for genre '{genre}': {str(search_error)}")
                    continue

                for track in results.get('tracks', {}).get('items', []):
                    track_id = track.get('id')
                    if track_id and track_id not in seen_ids:
                        seen_ids.add(track_id)
                        candidates.append(track)

        # Final broad query for low-connectivity or strict-seed scenarios.
        if len(candidates) < max(8, PLAYLIST_SIZE // 3):
            try:
                broad_results = self.sp.search(
                    q='year:2015-2026',
                    type='track',
                    limit=max(SEARCH_LIMIT, 20),
                    offset=random.randint(0, 500),
                )
                for track in broad_results.get('tracks', {}).get('items', []):
                    track_id = track.get('id')
                    if track_id and track_id not in seen_ids:
                        seen_ids.add(track_id)
                        candidates.append(track)
            except Exception as broad_error:
                print(f"Broad fallback search failed: {str(broad_error)}")

        if not candidates:
            return []

        return candidates

    def _pick_diverse_tracks(
        self,
        candidates,
        limit,
        avoid_recent=False,
        exclude_track_ids=None,
        exclude_artist_names=None,
    ):
        """Select tracks with better artist variety before filling the rest."""
        random.shuffle(candidates)

        selected = []
        used_track_ids = set()
        used_artists = set()
        recent_ids = set(self._recent_track_ids) if avoid_recent else set()
        excluded_track_ids = set(exclude_track_ids or set())
        excluded_artist_names = set(exclude_artist_names or set())

        # Pass 1: prefer one track per primary artist.
        for track in candidates:
            track_id = track.get('id')
            artists = track.get('artists') or []
            primary_artist = artists[0].get('id') if artists and artists[0].get('id') else None

            if not track_id or track_id in used_track_ids:
                continue
            if track_id in excluded_track_ids:
                continue
            if track_id in recent_ids:
                continue
            artist_names = {a.get('name', '').strip().lower() for a in artists if a.get('name')}
            if artist_names & excluded_artist_names:
                continue
            if primary_artist and primary_artist in used_artists:
                continue

            selected.append(track)
            used_track_ids.add(track_id)
            if primary_artist:
                used_artists.add(primary_artist)

            if len(selected) >= limit:
                return selected

        # Pass 2: still avoid recent tracks but relax artist uniqueness.
        for track in candidates:
            track_id = track.get('id')
            if not track_id or track_id in used_track_ids:
                continue
            if track_id in excluded_track_ids:
                continue
            if track_id in recent_ids:
                continue
            artist_names = {a.get('name', '').strip().lower() for a in (track.get('artists') or []) if a.get('name')}
            if artist_names & excluded_artist_names:
                continue

            selected.append(track)
            used_track_ids.add(track_id)

            if len(selected) >= limit:
                break

        # Pass 3: if needed, allow recent tracks to avoid returning too few tracks.
        if len(selected) < limit:
            for track in candidates:
                track_id = track.get('id')
                if not track_id or track_id in used_track_ids:
                    continue
                if track_id in excluded_track_ids:
                    continue
                artist_names = {a.get('name', '').strip().lower() for a in (track.get('artists') or []) if a.get('name')}
                if artist_names & excluded_artist_names:
                    continue

                selected.append(track)
                used_track_ids.add(track_id)

                if len(selected) >= limit:
                    break

        return selected

    def _remember_tracks(self, tracks):
        """Store recently served track IDs to reduce repetition in subsequent playlists."""
        for track in tracks:
            track_id = track.get('id')
            if track_id:
                self._recent_track_ids.append(track_id)

    def _format_track(self, track):
        """Normalize Spotify track object for API responses."""
        album = track.get('album') or {}
        artists = track.get('artists') or []
        images = album.get('images') or []
        return {
            'name': track.get('name'),
            'artist': ', '.join([artist.get('name', 'Unknown Artist') for artist in artists]) or 'Unknown Artist',
            'album': album.get('name'),
            'image': images[0].get('url') if images else None,
            'preview_url': track.get('preview_url'),
            'external_urls': track.get('external_urls', {}),
            'uri': track.get('uri'),
            'id': track.get('id'),
            'popularity': track.get('popularity', 0),
            'duration_ms': track.get('duration_ms', 0),
        }
    
    def get_playlist_uri(self, tracks):
        """Generate a Spotify URI for the playlist."""
        if not tracks:
            return None
        
        track_uris = [track['uri'] for track in tracks]
        return f"spotify:tracks:{','.join([uri.split(':')[-1] for uri in track_uris])}"
