/**
 * Music Playlist Generator - Frontend JavaScript
 */

// State management
const state = {
    mood: null,
    activity: null,
    time_of_day: null,
    playlist: [],
};

// DOM Elements
const moodButtons = document.querySelectorAll('.mood-btn');
const activityButtons = document.querySelectorAll('.activity-btn');
const timeButtons = document.querySelectorAll('.time-btn');
const generateBtn = document.getElementById('generateBtn');
const loadingEl = document.getElementById('loading');
const errorEl = document.getElementById('error');
const playlistContainer = document.getElementById('playlistContainer');
const tracksList = document.getElementById('tracksList');
const playlistTitle = document.getElementById('playlistTitle');

/**
 * Initialize event listeners
 */
function initializeEventListeners() {
    // Mood buttons
    moodButtons.forEach(btn => {
        btn.addEventListener('click', handleMoodSelection);
    });

    // Activity buttons
    activityButtons.forEach(btn => {
        btn.addEventListener('click', handleActivitySelection);
    });

    // Time buttons
    timeButtons.forEach(btn => {
        btn.addEventListener('click', handleTimeSelection);
    });

    // Generate button
    generateBtn.addEventListener('click', handleGeneratePlaylist);
}

/**
 * Handle mood selection
 */
function handleMoodSelection(e) {
    const btn = e.currentTarget;
    const mood = btn.dataset.mood;

    // Remove active class from all mood buttons
    moodButtons.forEach(b => b.classList.remove('active'));

    // Add active class to clicked button
    btn.classList.add('active');

    // Update state
    state.mood = mood;

    // Check if we can enable generate button
    updateGenerateButtonState();
}

/**
 * Handle activity selection
 */
function handleActivitySelection(e) {
    const btn = e.currentTarget;
    const activity = btn.dataset.activity;

    // Remove active class from all activity buttons
    activityButtons.forEach(b => b.classList.remove('active'));

    // Add active class to clicked button
    btn.classList.add('active');

    // Update state
    state.activity = activity;

    // Check if we can enable generate button
    updateGenerateButtonState();
}

/**
 * Handle time of day selection
 */
function handleTimeSelection(e) {
    const btn = e.currentTarget;
    const time = btn.dataset.time;

    // Remove active class from all time buttons
    timeButtons.forEach(b => b.classList.remove('active'));

    // Add active class to clicked button
    btn.classList.add('active');

    // Update state
    state.time_of_day = time;

    // Check if we can enable generate button
    updateGenerateButtonState();
}

/**
 * Update generate button state
 */
function updateGenerateButtonState() {
    const isEnabled = state.mood && state.activity && state.time_of_day;
    generateBtn.disabled = !isEnabled;
}

/**
 * Handle playlist generation
 */
async function handleGeneratePlaylist() {
    // Show loading, hide errors
    showLoading();
    hideError();
    hidePlaylist();

    try {
        const response = await fetch('/api/generate-playlist', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                mood: state.mood,
                activity: state.activity,
                time_of_day: state.time_of_day,
            }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to generate playlist');
        }

        const data = await response.json();

        if (data.success && data.playlist.length > 0) {
            state.playlist = data.playlist;
            displayPlaylist(data);
        } else {
            throw new Error('No tracks found for your selection');
        }
    } catch (error) {
        console.error('Error:', error);
        showError(error.message || 'An error occurred while generating the playlist');
    } finally {
        hideLoading();
    }
}

/**
 * Display playlist
 */
function displayPlaylist(data) {
    const { playlist, metadata } = data;

    // Update playlist title
    playlistTitle.textContent = `${capitalizeString(metadata.mood)} ${capitalizeString(metadata.activity)} • ${capitalizeString(metadata.time_of_day)}`;

    // Clear tracks list
    tracksList.innerHTML = '';

    // Add tracks to the list
    playlist.forEach((track, index) => {
        const trackElement = createTrackElement(track, index + 1);
        tracksList.appendChild(trackElement);
    });

    // Show playlist container
    showPlaylist();
}

/**
 * Create track element
 */
function createTrackElement(track, index) {
    const duration = formatDuration(track.duration_ms);

    const trackDiv = document.createElement('div');
    trackDiv.className = 'track-item';
    trackDiv.innerHTML = `
        <img src="${track.image || 'https://via.placeholder.com/80'}" alt="${track.name}" class="track-image">
        <div class="track-info">
            <div class="track-name">${index}. ${escapeHtml(track.name)}</div>
            <div class="track-artist">${escapeHtml(track.artist)}</div>
            <div class="track-album">${escapeHtml(track.album)}</div>
        </div>
        <div class="track-duration">
            ${duration}
            ${track.preview_url ? `<button class="play-btn" title="Preview" data-preview-url="${track.preview_url}">▶</button>` : ''}
        </div>
    `;

    // Add preview functionality
    const playBtn = trackDiv.querySelector('.play-btn');
    if (playBtn) {
        playBtn.addEventListener('click', handlePreview);
    }

    return trackDiv;
}

/**
 * Handle preview playback
 */
let currentAudio = null;

function handlePreview(e) {
    e.stopPropagation();
    const btn = e.currentTarget;
    const previewUrl = btn.dataset.previewUrl;

    if (!previewUrl) {
        alert('Preview not available for this track');
        return;
    }

    // Stop current audio if playing
    if (currentAudio) {
        currentAudio.pause();
        currentAudio = null;
    }

    // Play preview
    currentAudio = new Audio(previewUrl);
    currentAudio.play().catch(err => {
        console.error('Preview playback error:', err);
        alert('Could not play preview');
    });

    currentAudio.addEventListener('ended', () => {
        currentAudio = null;
    });
}

/**
 * Utility: Format duration (ms to mm:ss)
 */
function formatDuration(ms) {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

/**
 * Utility: Capitalize string
 */
function capitalizeString(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Utility: Escape HTML
 */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * UI Helpers
 */
function showLoading() {
    loadingEl.classList.remove('hidden');
}

function hideLoading() {
    loadingEl.classList.add('hidden');
}

function showError(message) {
    errorEl.textContent = message;
    errorEl.classList.remove('hidden');
}

function hideError() {
    errorEl.classList.add('hidden');
}

function showPlaylist() {
    playlistContainer.classList.remove('hidden');
    // Scroll to playlist
    playlistContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function hidePlaylist() {
    playlistContainer.classList.add('hidden');
}

/**
 * Initialize on page load
 */
document.addEventListener('DOMContentLoaded', () => {
    initializeEventListeners();
    
    // Check API health (optional)
    fetch('/api/health')
        .then(res => res.json())
        .then(data => {
            if (!data.spotify_connected) {
                showError('⚠️ Spotify connection issue. Please check your API credentials.');
            }
        })
        .catch(err => console.error('Health check failed:', err));
});
