const { useEffect, useMemo, useRef, useState } = React;

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

function Segments({ title, items, value, onChange }) {
  return (
    <section className="mpg3-card">
      <h3>{title}</h3>
      <div className="mpg3-grid">
        {items.map(item => (
          <button
            key={item.key}
            type="button"
            onClick={() => onChange(item.key)}
            className={`mpg3-pill ${value === item.key ? 'is-active' : ''}`}
          >
            <span className="mpg3-pill-icon">{item.icon}</span>
            <span>{item.label}</span>
          </button>
        ))}
      </div>
    </section>
  );
}

function App() {
  const [theme, setTheme] = useState('ocean');
  const [auth, setAuth] = useState({ authenticated: false, user: null });

  const [mood, setMood] = useState('happy');
  const [activity, setActivity] = useState('study');
  const [timeOfDay, setTimeOfDay] = useState('evening');
  const [discoveryBias, setDiscoveryBias] = useState(0);
  const [intensityBias, setIntensityBias] = useState(0);

  const [playlist, setPlaylist] = useState([]);
  const [meta, setMeta] = useState(null);
  const [explain, setExplain] = useState(null);
  const [history, setHistory] = useState([]);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const [hiddenTracks, setHiddenTracks] = useState(new Set());
  const [hiddenArtists, setHiddenArtists] = useState(new Set());

  const [toast, setToast] = useState('');
  const audioRef = useRef(null);

  const title = useMemo(() => {
    if (!meta) return 'Choose your vibe and generate.';
    return `${cap(meta.mood)} ${cap(meta.activity)} - ${cap(meta.time_of_day)}`;
  }, [meta]);

  useEffect(() => {
    const savedTheme = localStorage.getItem(STORE.theme);
    const savedHistory = localStorage.getItem(STORE.history);
    if (savedTheme) setTheme(savedTheme);
    if (savedHistory) {
      try {
        setHistory(JSON.parse(savedHistory));
      } catch (e) {
        console.warn(e);
      }
    }
    refreshAuth();
  }, []);

  useEffect(() => {
    document.body.dataset.theme = theme;
    localStorage.setItem(STORE.theme, theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem(STORE.history, JSON.stringify(history));
  }, [history]);

  useEffect(() => {
    if (!toast) return undefined;
    const t = setTimeout(() => setToast(''), 2200);
    return () => clearTimeout(t);
  }, [toast]);

  useEffect(() => {
    function onKey(ev) {
      if ((ev.ctrlKey || ev.metaKey) && ev.key === 'Enter' && !isLoading) {
        ev.preventDefault();
        generate();
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [mood, activity, timeOfDay, discoveryBias, intensityBias, hiddenTracks, hiddenArtists, isLoading]);

  async function refreshAuth() {
    try {
      const res = await fetch('/api/auth/status');
      const data = await res.json();
      setAuth({ authenticated: !!data.authenticated, user: data.user || null });
    } catch (_) {
      setAuth({ authenticated: false, user: null });
    }
  }

  async function generate(payload = null) {
    setError('');
    setIsLoading(true);

    const requestPayload = payload || {
      mood,
      activity,
      time_of_day: timeOfDay,
      discovery_bias: Number(discoveryBias),
      intensity_bias: Number(intensityBias),
      exclude_track_ids: Array.from(hiddenTracks),
      exclude_artist_names: Array.from(hiddenArtists),
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
      const filtered = (data.playlist || []).filter(track => !hiddenTracks.has(track.id));
      setPlaylist(filtered);
      setMeta(data.metadata || null);
      setExplain(data.explanation || null);
      setHistory(prev => [{
        mood: requestPayload.mood,
        activity: requestPayload.activity,
        time_of_day: requestPayload.time_of_day,
        discovery_bias: requestPayload.discovery_bias,
        intensity_bias: requestPayload.intensity_bias,
        ts: Date.now(),
      }, ...prev].slice(0, 8));
      setToast('Playlist ready');
    } catch (e) {
      setError(e.message || 'Unexpected error');
    } finally {
      setIsLoading(false);
    }
  }

  function quickSurprise() {
    const pick = (arr) => arr[Math.floor(Math.random() * arr.length)].key;
    const next = {
      mood: pick(MOODS),
      activity: pick(ACTIVITIES),
      time_of_day: pick(TIMES),
      discovery_bias: Number(discoveryBias),
      intensity_bias: Number(intensityBias),
      exclude_track_ids: Array.from(hiddenTracks),
      exclude_artist_names: Array.from(hiddenArtists),
    };
    setMood(next.mood);
    setActivity(next.activity);
    setTimeOfDay(next.time_of_day);
    generate(next);
  }

  function hideTrack(trackId) {
    if (!trackId) return;
    setHiddenTracks(prev => new Set(prev).add(trackId));
    setPlaylist(prev => prev.filter(t => t.id !== trackId));
  }

  function hideArtist(name) {
    if (!name) return;
    const key = name.toLowerCase();
    setHiddenArtists(prev => new Set(prev).add(key));
    setPlaylist(prev => prev.filter(t => !(t.artist || '').toLowerCase().includes(key)));
  }

  function preview(url) {
    if (!url) {
      setToast('No preview available');
      return;
    }
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    const audio = new Audio(url);
    audioRef.current = audio;
    audio.play().catch(() => setToast('Preview failed'));
  }

  function exportAs(fmt) {
    if (!playlist.length) {
      setToast('Generate first');
      return;
    }
    const base = `${mood}-${activity}-${Date.now()}`;
    if (fmt === 'json') {
      download(`${base}.json`, JSON.stringify(playlist, null, 2), 'application/json');
      return;
    }
    if (fmt === 'csv') {
      const header = 'name,artist,album,duration_ms,popularity,spotify_url';
      const rows = playlist.map(t => [
        t.name,
        t.artist,
        t.album,
        t.duration_ms,
        t.popularity,
        (t.external_urls && t.external_urls.spotify) || '',
      ].map(v => `"${String(v || '').replace(/"/g, '""')}"`).join(','));
      download(`${base}.csv`, [header, ...rows].join('\n'), 'text/csv');
      return;
    }
    const txt = playlist.map((t, i) => `${i + 1}. ${t.name} - ${t.artist}`).join('\n');
    download(`${base}.txt`, txt, 'text/plain');
  }

  return (
    <div className="mpg3-shell">
      <aside className="mpg3-left">
        <div className="mpg3-brand">
          <p className="mpg3-tag">React UI v3</p>
          <h1>Mood Playlist Generator</h1>
          <p>Create focused, stylish playlists from your current context.</p>
          <div className="mpg3-auth">
            <span>{auth.authenticated ? `Signed in as ${(auth.user && auth.user.display_name) || 'Spotify User'}` : 'Not signed in'}</span>
            {!auth.authenticated ? (
              <a className="mpg3-btn mpg3-btn-primary" href="/auth/spotify/login">Sign in with Spotify</a>
            ) : (
              <a className="mpg3-btn" href="/auth/spotify/logout">Sign out</a>
            )}
          </div>
        </div>

        <Segments title="Mood" items={MOODS} value={mood} onChange={setMood} />
        <Segments title="Activity" items={ACTIVITIES} value={activity} onChange={setActivity} />
        <Segments title="Time" items={TIMES} value={timeOfDay} onChange={setTimeOfDay} />

        <section className="mpg3-card">
          <h3>Refine</h3>
          <label>Mainstream to Discovery</label>
          <input className="mpg3-slider" type="range" min="-1" max="1" step="0.1" value={discoveryBias} onChange={(e) => setDiscoveryBias(Number(e.target.value))} />
          <label>Calm to Intense</label>
          <input className="mpg3-slider" type="range" min="-1" max="1" step="0.1" value={intensityBias} onChange={(e) => setIntensityBias(Number(e.target.value))} />
        </section>

        <section className="mpg3-card">
          <h3>Theme</h3>
          <div className="mpg3-row">
            {THEMES.map(t => (
              <button key={t.key} type="button" className={`mpg3-btn ${theme === t.key ? 'is-current' : ''}`} onClick={() => setTheme(t.key)}>{t.label}</button>
            ))}
          </div>
        </section>

        <div className="mpg3-row mpg3-actions">
          <button type="button" className="mpg3-btn mpg3-btn-primary" disabled={isLoading} onClick={() => generate()}>
            {isLoading ? 'Generating...' : 'Generate'}
          </button>
          <button type="button" className="mpg3-btn" onClick={quickSurprise}>Surprise</button>
          <button type="button" className="mpg3-btn" onClick={() => { setHiddenTracks(new Set()); setHiddenArtists(new Set()); setToast('Hidden filters reset'); }}>Reset Hidden</button>
        </div>
      </aside>

      <main className="mpg3-right">
        <div className="mpg3-header-row">
          <h2>{title}</h2>
          <div className="mpg3-row">
            <button type="button" className="mpg3-btn" onClick={() => exportAs('json')}>JSON</button>
            <button type="button" className="mpg3-btn" onClick={() => exportAs('csv')}>CSV</button>
            <button type="button" className="mpg3-btn" onClick={() => exportAs('txt')}>Text</button>
          </div>
        </div>

        <div className="mpg3-explain">
          {explain ? explain.summary : 'Generate a playlist to see explanation details.'}
        </div>

        {error && <div className="mpg3-error">{error}</div>}

        {isLoading && (
          <div className="mpg3-track-list">
            {Array.from({ length: 6 }).map((_, i) => (
              <div className="mpg3-track mpg3-skeleton" key={`sk-${i}`}>
                <div className="mpg3-cover" />
                <div className="mpg3-lines">
                  <span />
                  <span />
                  <span />
                </div>
              </div>
            ))}
          </div>
        )}

        {!isLoading && playlist.length === 0 && (
          <div className="mpg3-empty">No tracks yet. Hit Generate to build your playlist.</div>
        )}

        {!isLoading && playlist.length > 0 && (
          <div className="mpg3-track-list">
            {playlist.map((t, idx) => {
              const firstArtist = (t.artist || '').split(',')[0]?.trim();
              return (
                <article className="mpg3-track" key={`${t.id || t.name}-${idx}`}>
                  <img className="mpg3-cover" src={t.image || 'https://via.placeholder.com/72'} alt={t.name} />
                  <div className="mpg3-meta">
                    <strong>{idx + 1}. {t.name}</strong>
                    <span>{t.artist}</span>
                    <small>{t.album}</small>
                    <div className="mpg3-row">
                      <button type="button" className="mpg3-chip" onClick={() => hideTrack(t.id)}>Hide Track</button>
                      <button type="button" className="mpg3-chip" onClick={() => hideArtist(firstArtist)}>Hide Artist</button>
                    </div>
                  </div>
                  <div className="mpg3-side">
                    <span>{mmss(t.duration_ms)}</span>
                    {t.preview_url && <button type="button" className="mpg3-btn mpg3-btn-play" onClick={() => preview(t.preview_url)}>Play</button>}
                  </div>
                </article>
              );
            })}
          </div>
        )}

        {history.length > 0 && (
          <section className="mpg3-history">
            <h3>Recent Sessions</h3>
            <div className="mpg3-row">
              {history.map(item => (
                <button
                  key={item.ts}
                  type="button"
                  className="mpg3-btn"
                  onClick={() => {
                    setMood(item.mood);
                    setActivity(item.activity);
                    setTimeOfDay(item.time_of_day);
                    setDiscoveryBias(Number(item.discovery_bias || 0));
                    setIntensityBias(Number(item.intensity_bias || 0));
                    generate({
                      mood: item.mood,
                      activity: item.activity,
                      time_of_day: item.time_of_day,
                      discovery_bias: Number(item.discovery_bias || 0),
                      intensity_bias: Number(item.intensity_bias || 0),
                      exclude_track_ids: Array.from(hiddenTracks),
                      exclude_artist_names: Array.from(hiddenArtists),
                    });
                  }}
                >
                  {cap(item.mood)} - {cap(item.activity)} - {cap(item.time_of_day)}
                </button>
              ))}
            </div>
          </section>
        )}
      </main>

      {toast && <div className="mpg3-toast">{toast}</div>}
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('appRoot')).render(<App />);
