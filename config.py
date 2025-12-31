"""Configuration and mappings for playlist generation."""

# Mood to Spotify track characteristics mapping
MOOD_CHARACTERISTICS = {
    'happy': {
        'seed_genres': ['pop', 'dance', 'feel-good'],
        'energy': 0.7,
        'danceability': 0.7,
        'valence': 0.85,
    },
    'sad': {
        'seed_genres': ['indie', 'alternative', 'soul'],
        'energy': 0.3,
        'danceability': 0.3,
        'valence': 0.2,
    },
    'energetic': {
        'seed_genres': ['edm', 'electronic', 'hip-hop'],
        'energy': 0.9,
        'danceability': 0.8,
        'valence': 0.6,
    },
    'calm': {
        'seed_genres': ['ambient', 'acoustic', 'indie'],
        'energy': 0.2,
        'danceability': 0.2,
        'valence': 0.5,
    },
    'party': {
        'seed_genres': ['dance', 'electronic', 'pop'],
        'energy': 0.85,
        'danceability': 0.85,
        'valence': 0.75,
    },
}

# Activity to Spotify characteristics mapping
ACTIVITY_CHARACTERISTICS = {
    'workout': {
        'energy': 0.8,
        'tempo_min': 120,
        'seed_genres': ['electronic', 'hip-hop', 'pop'],
    },
    'study': {
        'energy': 0.4,
        'danceability': 0.3,
        'seed_genres': ['lo-fi', 'ambient', 'indie'],
    },
    'party': {
        'energy': 0.85,
        'danceability': 0.85,
        'seed_genres': ['dance', 'electronic', 'hip-hop'],
    },
    'sleep': {
        'energy': 0.1,
        'danceability': 0.1,
        'valence': 0.3,
        'seed_genres': ['ambient', 'acoustic', 'classical'],
    },
}

# Time of day adjustments
TIME_OF_DAY_ADJUSTMENTS = {
    'morning': {
        'energy_boost': 0.1,
        'seed_genres': ['indie', 'pop', 'acoustic'],
    },
    'afternoon': {
        'energy_boost': 0.0,
        'seed_genres': ['pop', 'rock', 'indie'],
    },
    'evening': {
        'energy_boost': -0.1,
        'seed_genres': ['soul', 'indie', 'alternative'],
    },
    'night': {
        'energy_boost': -0.2,
        'seed_genres': ['ambient', 'electronic', 'indie'],
    },
}

# Spotify API limits
PLAYLIST_SIZE = 25
SEARCH_LIMIT = 10
