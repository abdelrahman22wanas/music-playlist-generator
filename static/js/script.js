const MOODS = [
  { key: 'happy', label: 'Happy', icon: '😊' },
  { key: 'sad', label: 'Sad', icon: '😔' },
  { key: 'energetic', label: 'Energetic', icon: '⚡' },
  { key: 'calm', label: 'Calm', icon: '😌' },
  { key: 'party', label: 'Party', icon: '🎉' },
];

const ACTIVITIES = [
  { key: 'workout', label: 'Workout', icon: '🏃' },
  { key: 'study', label: 'Study', icon: '📚' },
  { key: 'party', label: 'Party', icon: '🪩' },
  { key: 'sleep', label: 'Sleep', icon: '💤' },
];

const TIMES = [
  { key: 'morning', label: 'Morning', icon: '🌅' },
  { key: 'afternoon', label: 'Afternoon', icon: '☀️' },
  { key: 'evening', label: 'Evening', icon: '🌇' },
  { key: 'night', label: 'Night', icon: '🌙' },
];

const THEMES = [
  { key: 'ocean', label: 'Ocean' },
  { key: 'ember', label: 'Ember' },
  { key: 'graphite', label: 'Graphite' },
];

const SORT_OPTIONS = [
  { key: 'added', label: 'Recently Added' },
  { key: 'popularity', label: 'Popularity' },
  { key: 'artist', label: 'Artist' },
  { key: 'duration', label: 'Duration' },
];

const SMART_PRESETS = [
  { 
    key: 'workout',
    label: '🏃 Workout',
    description: 'High energy, danceable tracks',
    targetDuration: 45,
    energyMin: 0.7,
    energyMax: 1,
    danceabilityMin: 0.6,
    danceabilityMax: 1,
    acousticnessMin: 0,
    acousticnessMax: 0.3,
  },
  { 
    key: 'study',
    label: '📚 Study',
    description: 'Low energy, acoustic focus',
    targetDuration: 60,
    energyMin: 0,
    energyMax: 0.4,
    danceabilityMin: 0,
    danceabilityMax: 0.5,
    acousticnessMin: 0.4,
    acousticnessMax: 1,
  },
  { 
    key: 'party',
    label: '🎉 Party',
    description: 'Very high energy, super danceable',
    targetDuration: 90,
    energyMin: 0.8,
    energyMax: 1,
    danceabilityMin: 0.7,
    danceabilityMax: 1,
    acousticnessMin: 0,
    acousticnessMax: 0.2,
  },
];

const STORE = {
  theme: 'mpg_theme_v3',
  history: 'mpg_history_v3',
  favorites: 'mpg_favorites_v1',
};

function cap(text) {
  return text ? text.charAt(0).toUpperCase() + text.slice(1) : '';
}

function mmss(ms) {
  const s = Math.floor((Number(ms) || 0) / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

function download(name, body, type) {
  const blob = new Blob([body], { type });
  const href = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = href;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(href);
}

function escapeHtml(value) {
  return String(value == null ? '' : value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

const state = {
  theme: 'ocean',
  auth: { authenticated: false, user: null },
  mood: 'happy',
  activity: 'study',
  timeOfDay: 'evening',
  discoveryBias: 0,
  intensityBias: 0,
  playlist: [],
  playlistName: '',
  meta: null,
  explain: null,
  history: [],
  favorites: [],
  searchQuery: '',
  sortBy: 'added',
  targetDuration: 0,
  energyMin: 0,
  energyMax: 1,
  danceabilityMin: 0,
  danceabilityMax: 1,
  acousticnessMin: 0,
  acousticnessMax: 1,
  showHistoryStats: false,
  showKeyboardHelp: false,
  showColorPicker: false,
  showShareModal: false,
  autoPlayPreview: true,
  isLoading: false,
  error: '',
  hiddenTracks: new Set(),
  hiddenArtists: new Set(),
  toast: '',
  audio: null,
};

function titleText() {
  if (!state.meta) {
    return 'Choose your vibe and generate.';
  }
  return `${cap(state.meta.mood)} ${cap(state.meta.activity)} - ${cap(state.meta.time_of_day)}`;
}

function setToast(message) {
  state.toast = message;
  render();
  window.clearTimeout(state.toastTimer);
  state.toastTimer = window.setTimeout(() => {
    state.toast = '';
    render();
  }, 2200);
}

// Phase 1: Favorites, Search/Filter, Sorting, Shuffle, Stats
function saveFavorites() {
  localStorage.setItem(STORE.favorites, JSON.stringify(state.favorites));
}

function loadFavorites() {
  const saved = localStorage.getItem(STORE.favorites);
  if (saved) {
    try {
      state.favorites = JSON.parse(saved) || [];
    } catch (error) {
      console.warn(error);
      state.favorites = [];
    }
  }
}

function saveFavorite() {
  if (!state.playlist.length || !state.meta) {
    setToast('Nothing to save');
    return;
  }
  
  const favorite = {
    name: state.playlistName || `${cap(state.meta.mood)} ${cap(state.meta.activity)}`,
    playlist: [...state.playlist],
    meta: state.meta,
    createdAt: Date.now(),
  };
  
  state.favorites = state.favorites.filter(fav => 
    !(fav.meta.mood === state.meta.mood &&
      fav.meta.activity === state.meta.activity &&
      fav.meta.time_of_day === state.meta.time_of_day)
  );
  
  state.favorites.unshift(favorite);
  state.favorites = state.favorites.slice(0, 20);
  saveFavorites();
  setToast('Playlist saved to favorites');
  render();
}

function removeFavorite(index) {
  state.favorites.splice(index, 1);
  saveFavorites();
  setToast('Favorite removed');
  render();
}

function loadFavorite(index) {
  const favorite = state.favorites[index];
  if (!favorite) return;
  
  state.playlist = [...favorite.playlist];
  state.meta = favorite.meta;
  state.playlistName = favorite.name;
  state.mood = favorite.meta.mood;
  state.activity = favorite.meta.activity;
  state.timeOfDay = favorite.meta.time_of_day;
  state.searchQuery = '';
  setToast(`Loaded: ${favorite.name}`);
  render();
}

function calculatePlaylistStats() {
  const displayed = getFilteredAndSortedPlaylist();
  if (!displayed.length) {
    return { tracks: 0, duration: 0, avgPopularity: 0 };
  }
  
  const stats = displayed.reduce((acc, track) => ({
    tracks: acc.tracks + 1,
    duration: acc.duration + (track.duration_ms || 0),
    popularity: acc.popularity + (track.popularity || 0),
  }), { tracks: 0, duration: 0, popularity: 0 });
  
  return {
    tracks: stats.tracks,
    duration: mmss(stats.duration),
    avgPopularity: Math.round(stats.popularity / stats.tracks),
  };
}

function getFilteredAndSortedPlaylist() {
  let filtered = state.playlist;
  
  if (state.searchQuery.trim()) {
    const query = state.searchQuery.toLowerCase();
    filtered = filtered.filter(track => 
      (track.name || '').toLowerCase().includes(query) ||
      (track.artist || '').toLowerCase().includes(query) ||
      (track.album || '').toLowerCase().includes(query)
    );
  }

  // Apply audio feature filters
  filtered = filtered.filter(track => {
    const energy = (track.audio_features && track.audio_features.energy) || 0.5;
    const danceability = (track.audio_features && track.audio_features.danceability) || 0.5;
    const acousticness = (track.audio_features && track.audio_features.acousticness) || 0.5;
    
    return (
      energy >= state.energyMin && energy <= state.energyMax &&
      danceability >= state.danceabilityMin && danceability <= state.danceabilityMax &&
      acousticness >= state.acousticnessMin && acousticness <= state.acousticnessMax
    );
  });
  
  // Apply duration filter if set
  if (state.targetDuration > 0) {
    const targetMs = state.targetDuration * 60 * 1000;
    const tolerance = targetMs * 0.2; // 20% tolerance
    filtered = filtered.filter(track => {
      const duration = track.duration_ms || 0;
      return duration >= (targetMs - tolerance) && duration <= (targetMs + tolerance);
    });
  }
  
  const sorted = [...filtered];
  if (state.sortBy === 'popularity') {
    sorted.sort((a, b) => (b.popularity || 0) - (a.popularity || 0));
  } else if (state.sortBy === 'artist') {
    sorted.sort((a, b) => (a.artist || '').localeCompare(b.artist || ''));
  } else if (state.sortBy === 'duration') {
    sorted.sort((a, b) => (a.duration_ms || 0) - (b.duration_ms || 0));
  }
  
  return sorted;
}

function shufflePlaylist() {
  const shuffled = [...state.playlist];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  state.playlist = shuffled;
  state.searchQuery = '';
  state.sortBy = 'added';
  setToast('Playlist shuffled');
  render();
}

function setPlaylistName(name) {
  state.playlistName = name.trim().slice(0, 50);
  render();
}

function applyPreset(presetKey) {
  const preset = SMART_PRESETS.find(p => p.key === presetKey);
  if (!preset) return;
  
  state.targetDuration = preset.targetDuration;
  state.energyMin = preset.energyMin;
  state.energyMax = preset.energyMax;
  state.danceabilityMin = preset.danceabilityMin;
  state.danceabilityMax = preset.danceabilityMax;
  state.acousticnessMin = preset.acousticnessMin;
  state.acousticnessMax = preset.acousticnessMax;
  
  setToast(`Applied ${preset.label.split(' ')[1]} preset`);
  render();
}

function resetFilters() {
  state.targetDuration = 0;
  state.energyMin = 0;
  state.energyMax = 1;
  state.danceabilityMin = 0;
  state.danceabilityMax = 1;
  state.acousticnessMin = 0;
  state.acousticnessMax = 1;
  state.searchQuery = '';
  state.sortBy = 'added';
  setToast('All filters reset');
  render();
}

// Phase 3: Keyboard Shortcuts, History Stats
function calculateHistoryStats() {
  if (!state.history.length) {
    return { moodCounts: {}, activityCounts: {}, timeCounts: {}, total: 0 };
  }

  const moodCounts = {};
  const activityCounts = {};
  const timeCounts = {};

  state.history.forEach(item => {
    const m = item.mood || 'unknown';
    const a = item.activity || 'unknown';
    const t = item.time_of_day || 'unknown';
    
    moodCounts[m] = (moodCounts[m] || 0) + 1;
    activityCounts[a] = (activityCounts[a] || 0) + 1;
    timeCounts[t] = (timeCounts[t] || 0) + 1;
  });

  return {
    moodCounts,
    activityCounts,
    timeCounts,
    total: state.history.length,
  };
}

function getMostCommon(counts) {
  let max = 0;
  let maxKey = '';
  Object.entries(counts).forEach(([key, value]) => {
    if (value > max) {
      max = value;
      maxKey = key;
    }
  });
  return { key: maxKey, count: max };
}

function historyStatsMarkup() {
  const stats = calculateHistoryStats();
  if (stats.total === 0) {
    return '<div class="mpg3-empty">No history yet. Generate playlists to see patterns!</div>';
  }

  const topMood = getMostCommon(stats.moodCounts);
  const topActivity = getMostCommon(stats.activityCounts);
  const topTime = getMostCommon(stats.timeCounts);

  const renderCategory = (counts) => Object.entries(counts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 4)
    .map(([key, count]) => `<div class="mpg3-stat-row"><span>${escapeHtml(cap(key))}</span><span class="mpg3-stat-bar" style="width: ${(count / stats.total) * 100}%">${count}</span></div>`)
    .join('');

  return `
    <div class="mpg3-stats-grid">
      <div class="mpg3-stat-box">
        <h4>Top Mood</h4>
        <div class="mpg3-stat-highlight">${escapeHtml(cap(topMood.key))} (${topMood.count})</div>
        ${renderCategory(stats.moodCounts)}
      </div>
      <div class="mpg3-stat-box">
        <h4>Top Activity</h4>
        <div class="mpg3-stat-highlight">${escapeHtml(cap(topActivity.key))} (${topActivity.count})</div>
        ${renderCategory(stats.activityCounts)}
      </div>
      <div class="mpg3-stat-box">
        <h4>Top Time</h4>
        <div class="mpg3-stat-highlight">${escapeHtml(cap(topTime.key))} (${topTime.count})</div>
        ${renderCategory(stats.timeCounts)}
      </div>
    </div>
  `;
}

function keyboardHelpMarkup() {
  return `
    <div class="mpg3-modal-backdrop" data-action="close-help">
      <div class="mpg3-modal">
        <div class="mpg3-modal-header">
          <h3>⌨️ Keyboard Shortcuts</h3>
          <button class="mpg3-modal-close" data-action="close-help">×</button>
        </div>
        <div class="mpg3-modal-content">
          <table class="mpg3-shortcuts-table">
            <tr><td class="mpg3-key">G</td><td>Generate playlist</td></tr>
            <tr><td class="mpg3-key">R</td><td>Reset all filters</td></tr>
            <tr><td class="mpg3-key">S</td><td>Focus search box</td></tr>
            <tr><td class="mpg3-key">?</td><td>Show this help</td></tr>
            <tr><td class="mpg3-key">Ctrl/Cmd + Enter</td><td>Generate playlist</td></tr>
          </table>
        </div>
      </div>
    </div>
  `;
}

// Phase 4: Color Picker, Auto-Play, Shareable Links
function generateShareLink() {
  if (!state.playlist.length) {
    setToast('Generate a playlist first');
    return;
  }

  const trackIds = state.playlist.map(t => t.id).filter(Boolean).join(',');
  const baseUrl = window.location.origin + window.location.pathname;
  const shareUrl = `${baseUrl}?share=${encodeURIComponent(btoa(JSON.stringify({
    playlistName: state.playlistName || 'Shared Playlist',
    tracks: state.playlist,
    meta: state.meta,
  })))}`;
  
  return shareUrl;
}

function copyShareLink() {
  const link = generateShareLink();
  if (!link) return;
  
  navigator.clipboard.writeText(link).then(() => {
    setToast('Link copied to clipboard! 📋');
  }).catch(() => {
    setToast('Failed to copy link');
  });
}

function shareMarkup() {
  const link = generateShareLink();
  
  return `
    <div class="mpg3-modal-backdrop" data-action="close-share">
      <div class="mpg3-modal" data-action="noop">
        <div class="mpg3-modal-header">
          <h3>🔗 Share Your Playlist</h3>
          <button type="button" class="mpg3-modal-close" data-action="close-share">×</button>
        </div>
        <div class="mpg3-modal-content">
          <div style="background: var(--bg); padding: 0.8rem; border-radius: 8px; margin-bottom: 1rem;">
            <div style="font-size: 0.9rem; color: var(--ink); margin-bottom: 0.3rem;"><strong>Playlist:</strong> ${escapeHtml(state.playlistName || 'Unnamed')}</div>
            <div style="font-size: 0.85rem; color: var(--muted);">${state.playlist.length} ${state.playlist.length === 1 ? 'track' : 'tracks'}</div>
          </div>
          
          <p style="color: var(--muted); font-size: 0.9rem; margin: 0.5rem 0;">Share this link with friends to let them view your playlist:</p>
          
          <div class="mpg3-share-input-group">
            <input type="text" readonly value="${escapeHtml(link)}" class="mpg3-share-input" onclick="this.select()" />
            <button type="button" class="mpg3-btn mpg3-btn-primary" data-action="copy-share-link" title="Copy to clipboard">Copy</button>
          </div>
          
          <div style="margin-top: 1rem; padding-top: 1rem; border-top: 1px solid var(--line);">
            <button type="button" class="mpg3-btn mpg3-btn-block" data-action="close-share">Close</button>
          </div>
        </div>
      </div>
    </div>
  `;
}

function colorPickerMarkup() {
  const brand1 = getComputedStyle(document.documentElement).getPropertyValue('--brand-1').trim();
  const brand2 = getComputedStyle(document.documentElement).getPropertyValue('--brand-2').trim();
  
  return `
    <div class="mpg3-modal-backdrop" data-action="close-colors">
      <div class="mpg3-modal" data-action="noop">
        <div class="mpg3-modal-header">
          <h3>🎨 Custom Theme Colors</h3>
          <button type="button" class="mpg3-modal-close" data-action="close-colors">×</button>
        </div>
        <div class="mpg3-modal-content">
          <div class="mpg3-color-row">
            <div class="mpg3-color-label">Primary Brand Color</div>
            <div class="mpg3-color-input-group">
              <input type="color" class="mpg3-color-input" data-action="set-brand1" value="${brand1}" />
              <div class="mpg3-color-swatch" style="background-color: ${escapeHtml(brand1)};"></div>
            </div>
            <small style="color: var(--muted); margin-top: 0.2rem;">${escapeHtml(brand1)}</small>
          </div>
          
          <div class="mpg3-color-row">
            <div class="mpg3-color-label">Secondary Brand Color</div>
            <div class="mpg3-color-input-group">
              <input type="color" class="mpg3-color-input" data-action="set-brand2" value="${brand2}" />
              <div class="mpg3-color-swatch" style="background-color: ${escapeHtml(brand2)};"></div>
            </div>
            <small style="color: var(--muted); margin-top: 0.2rem;">${escapeHtml(brand2)}</small>
          </div>
          
          <div class="mpg3-modal-actions">
            <button type="button" class="mpg3-btn" data-action="close-colors">Done</button>
            <button type="button" class="mpg3-btn" data-action="reset-colors">Reset</button>
          </div>
        </div>
      </div>
    </div>
  `;
}

function setCustomColor(variable, color) {
  document.documentElement.style.setProperty(variable, color);
  localStorage.setItem(`mpg_${variable}`, color);
  render();
}

function resetCustomColors() {
  document.documentElement.style.removeProperty('--brand-1');
  document.documentElement.style.removeProperty('--brand-2');
  localStorage.removeItem('mpg_--brand-1');
  localStorage.removeItem('mpg_--brand-2');
  setToast('Colors reset to default');
  render();
}

function loadCustomColors() {
  const brand1 = localStorage.getItem('mpg_--brand-1');
  const brand2 = localStorage.getItem('mpg_--brand-2');
  if (brand1) document.documentElement.style.setProperty('--brand-1', brand1);
  if (brand2) document.documentElement.style.setProperty('--brand-2', brand2);
}

function saveHistory() {
  localStorage.setItem(STORE.history, JSON.stringify(state.history));
}

function loadState() {
  const savedTheme = localStorage.getItem(STORE.theme);
  const savedHistory = localStorage.getItem(STORE.history);
  if (savedTheme) {
    state.theme = savedTheme;
  }
  if (savedHistory) {
    try {
      state.history = JSON.parse(savedHistory) || [];
    } catch (error) {
      console.warn(error);
    }
  }
  loadFavorites();
  loadCustomColors();
  document.body.dataset.theme = state.theme;
}

async function refreshAuth() {
  try {
    const res = await fetch('/api/auth/status');
    const data = await res.json();
    state.auth = { authenticated: !!data.authenticated, user: data.user || null };
  } catch (error) {
    state.auth = { authenticated: false, user: null };
  }
  render();
}

function userAvatarMarkup() {
  const user = state.auth.user || {};
  const name = user.display_name || user.id || 'Spotify User';
  const initial = name.charAt(0).toUpperCase();
  const profileUrl = user.profile_url || '';
  const avatarTitle = `${name}${profileUrl ? ' - open Spotify profile' : ''}`;

  if (user.image_url) {
    const avatar = `<img class="mpg3-avatar" src="${escapeHtml(user.image_url)}" alt="${escapeHtml(name)} profile photo">`;
    return profileUrl
      ? `<a class="mpg3-avatar-link" href="${escapeHtml(profileUrl)}" target="_blank" rel="noreferrer noopener" title="${escapeHtml(avatarTitle)}">${avatar}</a>`
      : `<span class="mpg3-avatar-link" title="${escapeHtml(avatarTitle)}">${avatar}</span>`;
  }

  const fallback = `<div class="mpg3-avatar mpg3-avatar-fallback" aria-hidden="true">${escapeHtml(initial)}</div>`;
  return profileUrl
    ? `<a class="mpg3-avatar-link" href="${escapeHtml(profileUrl)}" target="_blank" rel="noreferrer noopener" title="${escapeHtml(avatarTitle)}">${fallback}</a>`
    : `<span class="mpg3-avatar-link" title="${escapeHtml(avatarTitle)}">${fallback}</span>`;
}

async function generate(payload = null) {
  state.error = '';
  state.isLoading = true;
  render();

  const requestPayload = payload || {
    mood: state.mood,
    activity: state.activity,
    time_of_day: state.timeOfDay,
    discovery_bias: Number(state.discoveryBias),
    intensity_bias: Number(state.intensityBias),
    exclude_track_ids: Array.from(state.hiddenTracks),
    exclude_artist_names: Array.from(state.hiddenArtists),
  };

  try {
    const res = await fetch('/api/generate-playlist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestPayload),
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Could not generate playlist.');
    }

    state.playlist = (data.playlist || []).filter(track => !state.hiddenTracks.has(track.id));
    state.meta = data.metadata || null;
    state.explain = data.explanation || null;
    state.history = [{
      mood: requestPayload.mood,
      activity: requestPayload.activity,
      time_of_day: requestPayload.time_of_day,
      discovery_bias: requestPayload.discovery_bias,
      intensity_bias: requestPayload.intensity_bias,
      ts: Date.now(),
    }, ...state.history].slice(0, 8);
    saveHistory();
    
    // Auto-play first track preview if enabled
    if (state.autoPlayPreview && state.playlist.length > 0 && state.playlist[0].preview_url) {
      preview(state.playlist[0].preview_url);
    }
    
    setToast('Playlist ready');
  } catch (error) {
    state.error = error.message || 'Unexpected error';
  } finally {
    state.isLoading = false;
    render();
  }
}


function quickSurprise() {
  const pick = (items) => items[Math.floor(Math.random() * items.length)].key;
  const next = {
    mood: pick(MOODS),
    activity: pick(ACTIVITIES),
    time_of_day: pick(TIMES),
    discovery_bias: Number(state.discoveryBias),
    intensity_bias: Number(state.intensityBias),
    exclude_track_ids: Array.from(state.hiddenTracks),
    exclude_artist_names: Array.from(state.hiddenArtists),
  };
  state.mood = next.mood;
  state.activity = next.activity;
  state.timeOfDay = next.time_of_day;
  generate(next);
}

function hideTrack(trackId) {
  if (!trackId) return;
  state.hiddenTracks.add(trackId);
  state.playlist = state.playlist.filter(track => track.id !== trackId);
  setToast('Track hidden');
  render();
}

function hideArtist(name) {
  if (!name) return;
  const key = name.toLowerCase();
  state.hiddenArtists.add(key);
  state.playlist = state.playlist.filter(track => !(track.artist || '').toLowerCase().includes(key));
  setToast('Artist hidden');
  render();
}

function preview(url) {
  if (!url) {
    setToast('No preview available');
    return;
  }
  if (state.audio) {
    state.audio.pause();
  }
  state.audio = new Audio(url);
  state.audio.play().catch(() => setToast('Preview failed'));
}

function exportAs(format) {
  if (!state.playlist.length) {
    setToast('Generate first');
    return;
  }

  const base = `${state.mood}-${state.activity}-${Date.now()}`;
  if (format === 'json') {
    download(`${base}.json`, JSON.stringify(state.playlist, null, 2), 'application/json');
    return;
  }

  if (format === 'csv') {
    const header = 'name,artist,album,duration_ms,popularity,spotify_url';
    const rows = state.playlist.map(track => [
      track.name,
      track.artist,
      track.album,
      track.duration_ms,
      track.popularity,
      (track.external_urls && track.external_urls.spotify) || '',
    ].map(value => `"${String(value || '').replace(/"/g, '""')}"`).join(','));
    download(`${base}.csv`, [header, ...rows].join('\n'), 'text/csv');
    return;
  }

  const txt = state.playlist.map((track, index) => `${index + 1}. ${track.name} - ${track.artist}`).join('\n');
  download(`${base}.txt`, txt, 'text/plain');
}

function cardButtons(items, selectedKey, action) {
  return items.map(item => `
    <button type="button" class="mpg3-pill ${selectedKey === item.key ? 'is-active' : ''}" data-action="${action}" data-value="${item.key}">
      <span class="mpg3-pill-icon">${escapeHtml(item.icon)}</span>
      <span>${escapeHtml(item.label)}</span>
    </button>
  `).join('');
}

function playlistMarkup() {
  if (state.isLoading) {
    return `
      <div class="mpg3-track-list">
        ${Array.from({ length: 6 }).map(() => `
          <div class="mpg3-track mpg3-skeleton">
            <div class="mpg3-cover"></div>
            <div class="mpg3-lines"><span></span><span></span><span></span></div>
          </div>
        `).join('')}
      </div>
    `;
  }

  if (!state.playlist.length) {
    return '<div class="mpg3-empty">No tracks yet. Hit Generate to build your playlist.</div>';
  }

  const displayedTracks = getFilteredAndSortedPlaylist();
  const stats = calculatePlaylistStats();
  const hasCustomName = state.playlistName.length > 0;
  const isFaved = state.favorites.some(fav => 
    fav.meta.mood === state.meta.mood &&
    fav.meta.activity === state.meta.activity &&
    fav.meta.time_of_day === state.meta.time_of_day
  );

  return `
    <div class="mpg3-controls">
      <div class="mpg3-row mpg3-control-row">
        <input type="text" class="mpg3-search" placeholder="Search tracks..." data-action="set-search" value="${escapeHtml(state.searchQuery)}" />
        <select class="mpg3-select" data-action="set-sort">
          ${SORT_OPTIONS.map(opt => `<option value="${opt.key}" ${state.sortBy === opt.key ? 'selected' : ''}>${escapeHtml(opt.label)}</option>`).join('')}
        </select>
        <button type="button" class="mpg3-btn" data-action="shuffle-btn">🔀 Shuffle</button>
      </div>

      <div class="mpg3-stats">
        <span>${escapeHtml(stats.tracks)} tracks</span>
        <span>${escapeHtml(stats.duration)}</span>
        <span>💯${escapeHtml(stats.avgPopularity)}</span>
      </div>

      <div class="mpg3-playlist-actions">
        <input type="text" class="mpg3-playlist-name" placeholder="Playlist name..." data-action="set-playlist-name" value="${escapeHtml(state.playlistName)}" maxlength="50" />
        <button type="button" class="mpg3-btn ${isFaved ? 'is-faved' : ''}" data-action="save-favorite">⭐ ${isFaved ? 'Saved' : 'Save'}</button>
      </div>
    </div>

    <div class="mpg3-track-list">
      ${displayedTracks.map((track, index) => {
        const firstArtist = (track.artist || '').split(',')[0].trim();
        return `
          <article class="mpg3-track">
            <img class="mpg3-cover" src="${escapeHtml(track.image || 'https://via.placeholder.com/72')}" alt="${escapeHtml(track.name)}">
            <div class="mpg3-meta">
              <strong>${index + 1}. ${escapeHtml(track.name)}</strong>
              <span>${escapeHtml(track.artist)}</span>
              <small>${escapeHtml(track.album)}</small>
              <div class="mpg3-row">
                <button type="button" class="mpg3-chip" data-action="hide-track" data-value="${escapeHtml(track.id || '')}">Hide Track</button>
                <button type="button" class="mpg3-chip" data-action="hide-artist" data-value="${escapeHtml(firstArtist)}">Hide Artist</button>
              </div>
            </div>
            <div class="mpg3-side">
              <span>${mmss(track.duration_ms)}</span>
              ${track.preview_url ? `<button type="button" class="mpg3-btn mpg3-btn-play" data-action="preview" data-value="${escapeHtml(track.preview_url)}">Play</button>` : ''}
            </div>
          </article>
        `;
      }).join('')}
    </div>

    ${displayedTracks.length === 0 && state.searchQuery ? '<div class="mpg3-empty">No matches found.</div>' : ''}
  `;
}

function historyMarkup() {
  if (!state.history.length) {
    return '';
  }

  return `
    <section class="mpg3-history">
      <div class="mpg3-history-header">
        <h3>Recent Sessions</h3>
        <button type="button" class="mpg3-btn-small" data-action="toggle-stats" title="View stats">📊</button>
      </div>
      ${state.showHistoryStats ? historyStatsMarkup() : `
        <div class="mpg3-row">
          ${state.history.map(item => `
            <button type="button" class="mpg3-btn" data-action="history" data-value='${escapeHtml(JSON.stringify(item))}'>
              ${escapeHtml(cap(item.mood))} - ${escapeHtml(cap(item.activity))} - ${escapeHtml(cap(item.time_of_day))}
            </button>
          `).join('')}
        </div>
      `}
    </section>
  `;
}

function favoritesMarkup() {
  if (!state.favorites.length) {
    return '';
  }

  return `
    <section class="mpg3-card">
      <h3>⭐ Favorites</h3>
      <div class="mpg3-favorites-list">
        ${state.favorites.map((fav, index) => `
          <div class="mpg3-favorite-item">
            <button type="button" class="mpg3-favorite-name" data-action="load-favorite" data-value="${index}" title="${escapeHtml(fav.name)}">${escapeHtml(fav.name)}</button>
            <button type="button" class="mpg3-favorite-remove" data-action="remove-favorite" data-value="${index}" title="Remove">×</button>
          </div>
        `).join('')}
      </div>
    </section>
  `;
}

function render() {
  const root = document.getElementById('appRoot');
  if (!root) return;

  document.body.dataset.theme = state.theme;
  root.innerHTML = `
    <div class="mpg3-shell">
      <aside class="mpg3-left">
        <div class="mpg3-brand">
          <p class="mpg3-tag">Vanilla JS UI</p>
          <h1>Mood Playlist Generator</h1>
          <p>Create focused, stylish playlists from your current context.</p>
          <div class="mpg3-auth">
            ${state.auth.authenticated ? userAvatarMarkup() : ''}
            <span>${state.auth.authenticated ? `Signed in as ${escapeHtml((state.auth.user && state.auth.user.display_name) || 'Spotify User')}` : 'Not signed in'}</span>
            ${state.auth.authenticated ? '<a class="mpg3-btn" href="/auth/spotify/logout">Sign out</a>' : '<a class="mpg3-btn mpg3-btn-primary" href="/auth/spotify/login">Sign in with Spotify</a>'}
          </div>
        </div>

        <section class="mpg3-card">
          <h3>Mood</h3>
          <div class="mpg3-grid">${cardButtons(MOODS, state.mood, 'set-mood')}</div>
        </section>

        <section class="mpg3-card">
          <h3>Activity</h3>
          <div class="mpg3-grid">${cardButtons(ACTIVITIES, state.activity, 'set-activity')}</div>
        </section>

        <section class="mpg3-card">
          <h3>Time</h3>
          <div class="mpg3-grid">${cardButtons(TIMES, state.timeOfDay, 'set-time')}</div>
        </section>

        <section class="mpg3-card">
          <h3>Refine</h3>
          <label for="discoveryBias">Mainstream to Discovery</label>
          <input id="discoveryBias" class="mpg3-slider" data-action="set-discovery" type="range" min="-1" max="1" step="0.1" value="${escapeHtml(state.discoveryBias)}">
          <label for="intensityBias">Calm to Intense</label>
          <input id="intensityBias" class="mpg3-slider" data-action="set-intensity" type="range" min="-1" max="1" step="0.1" value="${escapeHtml(state.intensityBias)}">
        </section>

        <section class="mpg3-card">
          <h3>🎯 Smart Presets</h3>
          <div class="mpg3-presets">
            ${SMART_PRESETS.map(p => `
              <button type="button" class="mpg3-preset-btn" data-action="apply-preset" data-value="${p.key}" title="${escapeHtml(p.description)}">
                ${escapeHtml(p.label)}
              </button>
            `).join('')}
          </div>
        </section>

        <section class="mpg3-card">
          <h3>🎛️ Advanced Filters</h3>
          <label>Duration (minutes): ${state.targetDuration || 'Any'}</label>
          <input class="mpg3-slider" data-action="set-duration" type="range" min="0" max="180" step="5" value="${escapeHtml(state.targetDuration)}">
          
          <label>Energy: ${(state.energyMin).toFixed(1)} - ${(state.energyMax).toFixed(1)}</label>
          <div class="mpg3-range-slider">
            <input class="mpg3-slider" data-action="set-energy-min" type="range" min="0" max="1" step="0.1" value="${escapeHtml(state.energyMin)}">
            <input class="mpg3-slider" data-action="set-energy-max" type="range" min="0" max="1" step="0.1" value="${escapeHtml(state.energyMax)}">
          </div>

          <label>Danceability: ${(state.danceabilityMin).toFixed(1)} - ${(state.danceabilityMax).toFixed(1)}</label>
          <div class="mpg3-range-slider">
            <input class="mpg3-slider" data-action="set-dance-min" type="range" min="0" max="1" step="0.1" value="${escapeHtml(state.danceabilityMin)}">
            <input class="mpg3-slider" data-action="set-dance-max" type="range" min="0" max="1" step="0.1" value="${escapeHtml(state.danceabilityMax)}">
          </div>

          <label>Acousticness: ${(state.acousticnessMin).toFixed(1)} - ${(state.acousticnessMax).toFixed(1)}</label>
          <div class="mpg3-range-slider">
            <input class="mpg3-slider" data-action="set-acoustic-min" type="range" min="0" max="1" step="0.1" value="${escapeHtml(state.acousticnessMin)}">
            <input class="mpg3-slider" data-action="set-acoustic-max" type="range" min="0" max="1" step="0.1" value="${escapeHtml(state.acousticnessMax)}">
          </div>

          <button type="button" class="mpg3-btn mpg3-btn-block" data-action="reset-filters">Reset All Filters</button>
        </section>

        <section class="mpg3-card">
          <h3>Theme</h3>
          <div class="mpg3-row">
            ${THEMES.map(item => `<button type="button" class="mpg3-btn ${state.theme === item.key ? 'is-current' : ''}" data-action="set-theme" data-value="${item.key}">${escapeHtml(item.label)}</button>`).join('')}
          </div>
        </section>

        ${favoritesMarkup()}

        <div class="mpg3-row mpg3-actions">
          <button type="button" class="mpg3-btn mpg3-btn-primary" data-action="generate" ${state.isLoading ? 'disabled' : ''}>${state.isLoading ? 'Generating...' : 'Generate'}</button>
          <button type="button" class="mpg3-btn" data-action="surprise">Surprise</button>
          <button type="button" class="mpg3-btn" data-action="reset-hidden">Reset Hidden</button>
          <button type="button" class="mpg3-btn" data-action="toggle-colors" title="Custom color theme">🎨 Colors</button>
          <button type="button" class="mpg3-btn ${state.autoPlayPreview ? 'is-current' : ''}" data-action="toggle-autoplay" title="Auto-play first preview">
            ${state.autoPlayPreview ? '🔊 Auto-play On' : '🔈 Auto-play Off'}
          </button>
          <button type="button" class="mpg3-btn" data-action="share-btn" title="Share this playlist">🔗 Share</button>
        </div>
      </aside>

      <main class="mpg3-right">
        <section class="mpg3-banner">
          <div class="mpg3-banner-copy">
            <p class="mpg3-banner-kicker">Playlist Workspace</p>
            <h2>Curated mix ready to shape</h2>
            <p>Refine your mood, preview tracks, and export without leaving the page.</p>
          </div>
          <div class="mpg3-banner-meta">
            <span>${escapeHtml(state.auth.authenticated ? 'Spotify connected' : 'Not signed in')}</span>
            <span>${escapeHtml(state.playlist.length ? `${state.playlist.length} tracks loaded` : 'Ready to generate')}</span>
            <span>${escapeHtml(state.autoPlayPreview ? 'Auto preview on' : 'Auto preview off')}</span>
          </div>
        </section>

        <div class="mpg3-header-row">
          <h2>${escapeHtml(titleText())}</h2>
          <div class="mpg3-row">
            <button type="button" class="mpg3-btn" data-action="export" data-value="json">JSON</button>
            <button type="button" class="mpg3-btn" data-action="export" data-value="csv">CSV</button>
            <button type="button" class="mpg3-btn" data-action="export" data-value="txt">Text</button>
          </div>
        </div>

        <div class="mpg3-explain">${escapeHtml(state.explain ? state.explain.summary : 'Generate a playlist to see explanation details.')}</div>
        ${state.error ? `<div class="mpg3-error">${escapeHtml(state.error)}</div>` : ''}
        ${playlistMarkup()}
        ${historyMarkup()}
      </main>

      ${state.showKeyboardHelp ? keyboardHelpMarkup() : ''}
      ${state.showColorPicker ? colorPickerMarkup() : ''}
      ${state.showShareModal ? shareMarkup() : ''}
      ${state.toast ? `<div class="mpg3-toast">${escapeHtml(state.toast)}</div>` : ''}
    </div>
  `;
}

function handleRootEvent(event) {
  const target = event.target.closest('[data-action]');
  if (!target) return;

  const action = target.dataset.action;
  const value = target.dataset.value;

  // Native <select> opens on click; re-rendering on click collapses the menu.
  // Handle these on input/change only.
  if (event.type === 'click' && action === 'set-sort') {
    return;
  }

  if (action === 'noop') {
    return;
  }

  if (action === 'set-mood') {
    state.mood = value;
    render();
    return;
  }

  if (action === 'set-activity') {
    state.activity = value;
    render();
    return;
  }

  if (action === 'set-time') {
    state.timeOfDay = value;
    render();
    return;
  }

  if (action === 'set-theme') {
    state.theme = value;
    localStorage.setItem(STORE.theme, value);
    render();
    return;
  }

  if (action === 'set-discovery') {
    state.discoveryBias = Number(target.value);
    render();
    return;
  }

  if (action === 'set-intensity') {
    state.intensityBias = Number(target.value);
    render();
    return;
  }

  if (action === 'generate') {
    generate();
    return;
  }

  if (action === 'surprise') {
    quickSurprise();
    return;
  }

  if (action === 'reset-hidden') {
    state.hiddenTracks = new Set();
    state.hiddenArtists = new Set();
    setToast('Hidden filters reset');
    render();
    return;
  }

  // Phase 2 handlers
  if (action === 'apply-preset') {
    applyPreset(value);
    return;
  }

  if (action === 'reset-filters') {
    resetFilters();
    return;
  }

  if (action === 'set-duration') {
    state.targetDuration = Number(target.value);
    render();
    return;
  }

  if (action === 'set-energy-min') {
    state.energyMin = parseFloat(target.value);
    if (state.energyMin > state.energyMax) state.energyMax = state.energyMin;
    render();
    return;
  }

  if (action === 'set-energy-max') {
    state.energyMax = parseFloat(target.value);
    if (state.energyMax < state.energyMin) state.energyMin = state.energyMax;
    render();
    return;
  }

  if (action === 'set-dance-min') {
    state.danceabilityMin = parseFloat(target.value);
    if (state.danceabilityMin > state.danceabilityMax) state.danceabilityMax = state.danceabilityMin;
    render();
    return;
  }

  if (action === 'set-dance-max') {
    state.danceabilityMax = parseFloat(target.value);
    if (state.danceabilityMax < state.danceabilityMin) state.danceabilityMin = state.danceabilityMax;
    render();
    return;
  }

  if (action === 'set-acoustic-min') {
    state.acousticnessMin = parseFloat(target.value);
    if (state.acousticnessMin > state.acousticnessMax) state.acousticnessMax = state.acousticnessMin;
    render();
    return;
  }

  if (action === 'set-acoustic-max') {
    state.acousticnessMax = parseFloat(target.value);
    if (state.acousticnessMax < state.acousticnessMin) state.acousticnessMin = state.acousticnessMax;
    render();
    return;
  }

  if (action === 'export') {
    exportAs(value);
    return;
  }

  if (action === 'hide-track') {
    hideTrack(value);
    return;
  }

  if (action === 'hide-artist') {
    hideArtist(value);
    return;
  }

  if (action === 'preview') {
    preview(value);
    return;
  }

  if (action === 'history') {
    try {
      const item = JSON.parse(value);
      state.mood = item.mood;
      state.activity = item.activity;
      state.timeOfDay = item.time_of_day;
      state.discoveryBias = Number(item.discovery_bias || 0);
      state.intensityBias = Number(item.intensity_bias || 0);
      render();
      generate({
        mood: item.mood,
        activity: item.activity,
        time_of_day: item.time_of_day,
        discovery_bias: Number(item.discovery_bias || 0),
        intensity_bias: Number(item.intensity_bias || 0),
        exclude_track_ids: Array.from(state.hiddenTracks),
        exclude_artist_names: Array.from(state.hiddenArtists),
      });
    } catch (error) {
      console.warn(error);
    }
    return;
  }

  // Phase 1 handlers
  if (action === 'set-search') {
    state.searchQuery = target.value;
    render();
    return;
  }

  if (action === 'set-sort') {
    state.sortBy = target.value;
    render();
    return;
  }

  if (action === 'shuffle-btn') {
    shufflePlaylist();
    return;
  }

  if (action === 'set-playlist-name') {
    setPlaylistName(target.value);
    return;
  }

  if (action === 'save-favorite') {
    saveFavorite();
    return;
  }

  if (action === 'load-favorite') {
    loadFavorite(Number(value));
    return;
  }

  if (action === 'remove-favorite') {
    removeFavorite(Number(value));
    return;
  }

  // Phase 3 handlers
  if (action === 'toggle-stats') {
    state.showHistoryStats = !state.showHistoryStats;
    render();
    return;
  }

  if (action === 'close-help') {
    state.showKeyboardHelp = false;
    render();
    return;
  }

  // Phase 4 handlers
  if (action === 'toggle-colors') {
    state.showColorPicker = !state.showColorPicker;
    render();
    return;
  }

  if (action === 'set-brand1') {
    setCustomColor('--brand-1', target.value);
    return;
  }

  if (action === 'set-brand2') {
    setCustomColor('--brand-2', target.value);
    return;
  }

  if (action === 'reset-colors') {
    resetCustomColors();
    return;
  }

  if (action === 'close-colors') {
    state.showColorPicker = false;
    render();
    return;
  }

  if (action === 'share-btn') {
    state.showShareModal = !state.showShareModal;
    render();
    return;
  }

  if (action === 'copy-share-link') {
    copyShareLink();
    return;
  }

  if (action === 'close-share') {
    state.showShareModal = false;
    render();
    return;
  }

  if (action === 'toggle-autoplay') {
    state.autoPlayPreview = !state.autoPlayPreview;
    render();
    return;
  }

}

function handleKeydown(event) {
  // Don't interfere with typing in inputs
  const isInputFocused = ['INPUT', 'TEXTAREA', 'SELECT'].includes(event.target.tagName);
  
  // Ctrl/Cmd + Enter to generate
  if ((event.ctrlKey || event.metaKey) && event.key === 'Enter' && !state.isLoading) {
    event.preventDefault();
    generate();
    return;
  }

  // Only handle single key shortcuts if not typing
  if (isInputFocused) return;

  // G - Generate
  if (event.key.toLowerCase() === 'g' && !event.ctrlKey && !event.metaKey) {
    generate();
    return;
  }

  // R - Reset filters
  if (event.key.toLowerCase() === 'r' && !event.ctrlKey && !event.metaKey) {
    resetFilters();
    return;
  }

  // S - Focus search
  if (event.key.toLowerCase() === 's' && !event.ctrlKey && !event.metaKey) {
    const searchInput = document.querySelector('.mpg3-search');
    if (searchInput) {
      event.preventDefault();
      searchInput.focus();
    }
    return;
  }

  // ? or / - Show keyboard help
  if ((event.key === '?' || event.key === '/') && !event.ctrlKey && !event.metaKey) {
    state.showKeyboardHelp = !state.showKeyboardHelp;
    render();
    return;
  }
}

function init() {
  loadState();
  render();
  refreshAuth();

  const root = document.getElementById('appRoot');
  root.addEventListener('click', handleRootEvent);
  root.addEventListener('input', handleRootEvent);
  root.addEventListener('change', handleRootEvent);
  window.addEventListener('keydown', handleKeydown);
}

document.addEventListener('DOMContentLoaded', init);
