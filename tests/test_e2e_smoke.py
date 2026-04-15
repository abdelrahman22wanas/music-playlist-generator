from pathlib import Path
import sys

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

import app as app_module


def _sample_track(track_id='track-1', artist='Artist One'):
    return {
        'id': track_id,
        'name': 'Sample Track',
        'artist': artist,
        'album': 'Sample Album',
        'duration_ms': 210000,
        'popularity': 77,
        'preview_url': None,
        'image': None,
        'external_urls': {},
    }


def test_index_page_renders():
    client = app_module.app.test_client()
    response = client.get('/')
    assert response.status_code == 200


def test_generate_playlist_requires_required_fields():
    client = app_module.app.test_client()
    response = client.post('/api/generate-playlist', json={})
    assert response.status_code == 400
    assert response.get_json()['error'] == 'Missing required parameters'


def test_generate_playlist_success_with_mocked_generator(monkeypatch):
    class DummyGenerator:
        def generate_playlist(self, *args, **kwargs):
            return [_sample_track('track-1', 'Artist One')]

    monkeypatch.setattr(app_module, 'PlaylistGenerator', DummyGenerator)

    client = app_module.app.test_client()
    response = client.post(
        '/api/generate-playlist',
        json={
            'mood': 'happy',
            'activity': 'study',
            'time_of_day': 'evening',
            'discovery_bias': 0.2,
            'intensity_bias': -0.1,
        },
    )

    assert response.status_code == 200
    payload = response.get_json()
    assert payload['success'] is True
    assert payload['metadata']['total_tracks'] == 1
    assert payload['playlist'][0]['id'] == 'track-1'


def test_generate_playlist_forwards_trending_and_artist_preferences(monkeypatch):
    captured = {}

    class DummyGenerator:
        def generate_playlist(self, *args, **kwargs):
            captured['kwargs'] = kwargs
            return [_sample_track('track-2', 'Artist Two')]

    monkeypatch.setattr(app_module, 'PlaylistGenerator', DummyGenerator)
    monkeypatch.setattr(
        app_module,
        '_get_user_music_insights',
        lambda top_tracks_limit=20, top_artists_limit=20: {
            'top_tracks': [{'id': 'pref-1', 'name': 'Pref Track', 'artist': 'Pref Artist'}],
            'top_artists': [{'id': 'artist-1', 'name': 'Pref Artist'}],
        },
    )

    client = app_module.app.test_client()
    response = client.post(
        '/api/generate-playlist',
        json={
            'mood': 'party',
            'activity': 'party',
            'time_of_day': 'night',
            'use_trending': True,
            'top_artist_filter': 'The Weeknd',
        },
    )

    assert response.status_code == 200
    forwarded = captured['kwargs']
    assert forwarded['preferred_track_ids'] == ['pref-1']
    assert forwarded['preferred_artist_name'] == 'The Weeknd'


def test_user_insights_returns_unauthenticated_when_no_session():
    client = app_module.app.test_client()
    response = client.get('/api/user-insights')

    assert response.status_code == 200
    payload = response.get_json()
    assert payload['authenticated'] is False
    assert payload['top_tracks'] == []
    assert payload['top_artists'] == []
