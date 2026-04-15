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

const STORE = {
  theme: 'mpg_theme_v3',
  history: 'mpg_history_v3',
  pendingSave: 'mpg_pending_save_v1',
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
  auth: { authenticated: false, user: null, needsReauth: false, missingScopes: [] },
  mood: 'happy',
  activity: 'study',
  timeOfDay: 'evening',
  discoveryBias: 0,
  intensityBias: 0,
  playlist: [],
  meta: null,
  explain: null,
  history: [],
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
  document.body.dataset.theme = state.theme;
}

async function refreshAuth() {
  try {
    const res = await fetch('/api/auth/status');
    const data = await res.json();
    state.auth = {
      authenticated: !!data.authenticated,
      user: data.user || null,
      needsReauth: !!data.needs_reauth,
      missingScopes: data.missing_scopes || [],
    };
  } catch (error) {
    state.auth = { authenticated: false, user: null, needsReauth: false, missingScopes: [] };
  }
  render();
}

function getPendingSave() {
  const raw = localStorage.getItem(STORE.pendingSave);
  if (!raw) return null;

  try {
    return JSON.parse(raw);
  } catch (error) {
    console.warn(error);
    return null;
  }
}

function clearPendingSave() {
  localStorage.removeItem(STORE.pendingSave);
}

function setPendingSave(payload) {
  localStorage.setItem(STORE.pendingSave, JSON.stringify(payload));
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
    setToast('Playlist ready');
  } catch (error) {
    state.error = error.message || 'Unexpected error';
  } finally {
    state.isLoading = false;
    render();
  }
}

async function saveToSpotify(payload = null) {
  const playlist = payload?.playlist || state.playlist;
  const metadata = payload?.metadata || state.meta;

  if (!playlist.length) {
    setToast('Generate a playlist first');
    return;
  }

  if (!state.auth.authenticated) {
    setPendingSave({ playlist, metadata });
    setToast(state.auth.needsReauth ? 'Reconnecting Spotify to refresh playlist permissions' : 'Redirecting to Spotify sign-in');
    window.location.href = '/auth/spotify/login';
    return;
  }

  state.error = '';
  state.isLoading = true;
  render();

  try {
    const res = await fetch('/api/save-playlist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        playlist,
        metadata,
      }),
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      if (res.status === 401 && data.details) {
        setPendingSave({ playlist, metadata });
        setToast('Reconnecting Spotify to approve playlist saving');
        window.location.href = '/auth/spotify/login';
        return;
      }

      const message = data.details ? `${data.error || 'Could not save playlist.'} (${data.details})` : (data.error || 'Could not save playlist.');
      throw new Error(message);
    }

    const savedName = (data.playlist && data.playlist.name) || 'Spotify playlist';
    setToast(`Saved to Spotify: ${savedName}`);
    if (data.playlist && data.playlist.url) {
      state.spotifyPlaylistUrl = data.playlist.url;
    }
    clearPendingSave();
  } catch (error) {
    state.error = error.message || 'Unexpected error';
  } finally {
    state.isLoading = false;
    render();
  }
}

async function resumePendingSave() {
  const pendingSave = getPendingSave();
  if (!pendingSave) {
    return;
  }

  clearPendingSave();
  await refreshAuth();

  if (state.auth.authenticated) {
    await saveToSpotify(pendingSave);
    return;
  }

  setPendingSave(pendingSave);
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

  return `
    <div class="mpg3-track-list">
      ${state.playlist.map((track, index) => {
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
  `;
}

function historyMarkup() {
  if (!state.history.length) {
    return '';
  }

  return `
    <section class="mpg3-history">
      <h3>Recent Sessions</h3>
      <div class="mpg3-row">
        ${state.history.map(item => `
          <button type="button" class="mpg3-btn" data-action="history" data-value='${escapeHtml(JSON.stringify(item))}'>
            ${escapeHtml(cap(item.mood))} - ${escapeHtml(cap(item.activity))} - ${escapeHtml(cap(item.time_of_day))}
          </button>
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
            <span>${state.auth.authenticated ? `Signed in as ${escapeHtml((state.auth.user && state.auth.user.display_name) || 'Spotify User')}` : (state.auth.needsReauth ? 'Spotify permissions need to be refreshed' : 'Not signed in')}</span>
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
          <h3>Theme</h3>
          <div class="mpg3-row">
            ${THEMES.map(item => `<button type="button" class="mpg3-btn ${state.theme === item.key ? 'is-current' : ''}" data-action="set-theme" data-value="${item.key}">${escapeHtml(item.label)}</button>`).join('')}
          </div>
        </section>

        <div class="mpg3-row mpg3-actions">
          <button type="button" class="mpg3-btn mpg3-btn-primary" data-action="generate" ${state.isLoading ? 'disabled' : ''}>${state.isLoading ? 'Generating...' : 'Generate'}</button>
          <button type="button" class="mpg3-btn" data-action="surprise">Surprise</button>
          <button type="button" class="mpg3-btn" data-action="reset-hidden">Reset Hidden</button>
        </div>
      </aside>

      <main class="mpg3-right">
        <div class="mpg3-header-row">
          <h2>${escapeHtml(titleText())}</h2>
          <div class="mpg3-row">
            <button type="button" class="mpg3-btn mpg3-btn-spotify mpg3-btn-lg mpg3-btn-save" data-action="save" ${state.isLoading || !state.playlist.length ? 'disabled' : ''} aria-label="Save playlist to Spotify">
              <span class="mpg3-btn-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" role="img" focusable="false">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.57 14.36a.75.75 0 0 1-1.03.25c-2.82-1.72-6.38-2.11-10.58-1.16a.75.75 0 1 1-.33-1.47c4.55-1.02 8.48-.58 11.6 1.33.36.22.47.69.24 1.05zm1.46-3.25a.94.94 0 0 1-1.3.31c-3.26-2-8.24-2.58-12.11-1.4a.94.94 0 1 1-.55-1.8c4.42-1.34 9.91-.69 13.62 1.59.44.27.58.85.34 1.3zm.13-3.4C14.12 7.5 7.37 7.28 3.5 8.44a1.12 1.12 0 1 1-.64-2.14c4.45-1.34 11.75-1.08 16.43 1.69a1.12 1.12 0 0 1-1.17 1.92z"/>
                </svg>
              </span>
              <span>Save to Spotify</span>
            </button>
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

      ${state.toast ? `<div class="mpg3-toast">${escapeHtml(state.toast)}</div>` : ''}
    </div>
  `;
}

function handleRootEvent(event) {
  const target = event.target.closest('[data-action]');
  if (!target) return;

  const action = target.dataset.action;
  const value = target.dataset.value;

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

  if (action === 'save') {
    saveToSpotify();
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
  }
}

function handleKeydown(event) {
  if ((event.ctrlKey || event.metaKey) && event.key === 'Enter' && !state.isLoading) {
    event.preventDefault();
    generate();
  }
}

function init() {
  loadState();
  render();
  resumePendingSave();
  refreshAuth();

  const root = document.getElementById('appRoot');
  root.addEventListener('click', handleRootEvent);
  root.addEventListener('input', handleRootEvent);
  window.addEventListener('keydown', handleKeydown);
}

document.addEventListener('DOMContentLoaded', init);
