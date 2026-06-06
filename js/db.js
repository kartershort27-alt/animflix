const API_BASE  = '';
const GH_OWNER  = 'kartershort27-alt';
const GH_REPO   = 'animflix';
const IS_LOCAL  = location.hostname === 'localhost' || location.hostname === '127.0.0.1';

// ── Normalise shows read from the server (arrays stay arrays) ────────────────
function _normalizeShow(s) {
  if (s && s.episodes) {
    Object.keys(s.episodes).forEach(season => {
      const eps = s.episodes[season];
      if (eps && typeof eps === 'object' && !Array.isArray(eps)) {
        s.episodes[season] = Object.values(eps);
      }
    });
  }
  return s;
}

// ── Convert library.json format → show objects (mirrors server.js _parseLibrary) ──
function _parseLibrary({ series = [], movies = [] }) {
  const out = {};
  movies.forEach(m => {
    if (!m.title) return;
    out[m.title] = {
      title: m.title, type: 'Film', age: m.age || 'TV-MA',
      seasons: 'Film', seasonCount: 0, match: '98',
      bg: 'linear-gradient(135deg,#1a1a2e,#16213e,#0f3460)', art: '🎬',
      desc: m.desc || '', cast: m.cast || '', genres: m.genres || '',
      mood: m.mood || '', year: m.year || '',
      imageUrl: m.thumbnail || '', episodes: {},
      videoUrl: m.url || null, videoName: m.title
    };
  });
  series.forEach(s => {
    if (!s.title || !s.seasons) return;
    const seasons = {}, epVideos = {};
    Object.entries(s.seasons).forEach(([sNum, eps]) => {
      seasons[sNum] = (eps || []).map(e => ({ n: e.ep, t: e.title || ('Episode ' + e.ep), d: e.duration || '—' }));
      (eps || []).forEach(e => { if (e.url) epVideos['s' + sNum + 'e' + e.ep] = e.url; });
    });
    Object.keys(seasons).forEach(n => seasons[n].sort((a, b) => a.n - b.n));
    const count = Object.keys(seasons).length;
    const first = count ? Math.min(...Object.keys(seasons).map(Number)) : 1;
    const ep1   = seasons[first] && seasons[first][0];
    out[s.title] = {
      title: s.title, type: 'Series', age: s.age || 'TV-MA', match: '98',
      seasons: count + ' Season' + (count !== 1 ? 's' : ''), seasonCount: count,
      bg: 'linear-gradient(135deg,#1a1a2e,#16213e,#0f3460)', art: '🎬',
      desc: s.desc || '', cast: s.cast || '', genres: s.genres || '',
      mood: s.mood || '', year: s.year || '',
      imageUrl: s.thumbnail || '',
      episodes: seasons, episodeVideos: epVideos,
      videoUrl:  ep1 ? (epVideos['s' + first + 'e' + ep1.n] || null) : null,
      videoName: ep1 ? ep1.t : null
    };
  });
  return out;
}

// ── Init ─────────────────────────────────────────────────────────────────────
function dbInit() {
  if (IS_LOCAL) {
    _initSSE();
  } else {
    _initGitHubPolling();
    // Hide server-only controls (admin panel, etc.) on the public site
    document.querySelectorAll('.admin-only').forEach(el => el.style.display = 'none');
  }
}

// ── Local mode: SSE stream ────────────────────────────────────────────────────
function _initSSE() {
  const es = new EventSource(API_BASE + '/api/events');

  es.addEventListener('init', e => {
    const shows = JSON.parse(e.data);
    Object.values(shows).forEach(s => {
      s = _normalizeShow(s);
      CUSTOM_SHOWS[s.title] = s;
      _loadMedia(s);
      _renderCard(s.title);
      _renderAdminRow(s.title);
    });
  });

  es.addEventListener('show_updated', e => {
    const s = _normalizeShow(JSON.parse(e.data));
    CUSTOM_SHOWS[s.title] = s;
    _loadMedia(s);
    _renderCard(s.title);
    _renderAdminRow(s.title);
    const key = s.title.toLowerCase();
    if (titleMedia[key] && titleMedia[key].imageUrl) {
      applyThumbnailToCards(s.title, titleMedia[key].imageUrl);
    }
  });

  es.addEventListener('show_deleted', e => {
    const { title } = JSON.parse(e.data);
    delete CUSTOM_SHOWS[title];
    delete titleMedia[title.toLowerCase()];
    document.querySelectorAll(`.card[data-title="${title}"]`).forEach(c => c.remove());
    const tr = document.querySelector(`#contentTbody tr[data-title="${title.toLowerCase()}"]`);
    if (tr) tr.remove();
  });

  es.onerror = () => {};
}

// ── GitHub Pages mode: poll raw library.json every 60 s ──────────────────────
const _RAW_LIB = `https://raw.githubusercontent.com/${GH_OWNER}/${GH_REPO}/main/library.json`;
let _knownTitles = new Set();

async function _initGitHubPolling() {
  await _pollLibrary();
  setInterval(_pollLibrary, 60_000);
}

async function _pollLibrary() {
  try {
    const r = await fetch(_RAW_LIB + '?_=' + Date.now());
    if (!r.ok) return;
    const lib   = await r.json();
    const shows = _parseLibrary(lib);

    // Remove titles that disappeared
    _knownTitles.forEach(t => {
      if (!shows[t]) {
        delete CUSTOM_SHOWS[t];
        delete titleMedia[t.toLowerCase()];
        document.querySelectorAll(`.card[data-title="${t}"]`).forEach(c => c.remove());
      }
    });
    _knownTitles = new Set(Object.keys(shows));

    // Add / refresh shows
    Object.values(shows).forEach(s => {
      s = _normalizeShow(s);
      CUSTOM_SHOWS[s.title] = s;
      _loadMedia(s);
      _renderCard(s.title);
    });
  } catch {}
}

// ── Populate titleMedia from a show object ───────────────────────────────────
function _loadMedia(s) {
  const key = s.title.toLowerCase();
  if (!titleMedia[key]) titleMedia[key] = {};
  if (s.imageUrl)      titleMedia[key].imageUrl      = API_BASE + s.imageUrl;
  if (s.videoUrl)      {
    titleMedia[key].videoUrl  = API_BASE + s.videoUrl;
    titleMedia[key].videoName = s.videoName;
    titleMedia[key].videoSize = s.videoSize;
  }
  if (s.episodeImages) {
    titleMedia[key].episodeImages = {};
    Object.entries(s.episodeImages).forEach(([k, v]) => {
      titleMedia[key].episodeImages[k] = API_BASE + v;
    });
  }
  if (s.episodeVideos) {
    titleMedia[key].episodeVideos = {};
    Object.entries(s.episodeVideos).forEach(([k, v]) => {
      titleMedia[key].episodeVideos[k] = API_BASE + v;
    });
  }
}

// ── Render helpers ───────────────────────────────────────────────────────────
function _renderCard(title) {
  if (document.querySelector(`.card[data-title="${title}"]`)) return;
  const homeRow = document.getElementById('newOnNetflixCards');
  if (!homeRow) return;
  const key    = title.toLowerCase();
  const media  = titleMedia[key];
  const hasImg = media && media.imageUrl;
  const gs     = ['g2','g4','g6','g7','g9','g10','g12','g14','g15','g17','g18','g19'];
  const g      = gs[Math.floor(Math.random() * gs.length)];
  const ts     = hasImg ? `style="background-image:url('${media.imageUrl}');background-size:cover;background-position:center"` : '';
  const card   = document.createElement('div');
  card.className    = 'card';
  card.dataset.title = title;
  card.innerHTML    = `<div class="card-thumb ${hasImg ? '' : g}" ${ts}><div class="n-badge">N</div><div class="card-label">${title}</div></div>`;
  card.addEventListener('click', () => openModal(title));
  homeRow.prepend(card);
  if (typeof attachCardHover === 'function') attachCardHover(card);
}

function _renderAdminRow(title) {
  const tbody = document.getElementById('contentTbody');
  if (!tbody || tbody.querySelector(`tr[data-title="${title.toLowerCase()}"]`)) return;
  const key    = title.toLowerCase();
  const s      = CUSTOM_SHOWS[title];
  const media  = titleMedia[key];
  const hasImg = media && media.imageUrl;
  const ts     = hasImg ? `style="background-image:url('${media.imageUrl}');background-size:cover;background-position:center"` : '';
  const tr     = document.createElement('tr');
  tr.dataset.title = key;
  tr.innerHTML = `
    <td><div style="display:flex;align-items:center;gap:10px">
      <div class="tbl-thumb" ${ts}>${hasImg ? '' : '🎬'}</div>${title}
    </div></td>
    <td>Series</td>
    <td>${s ? (s.genres || '—') : '—'}</td>
    <td>${s ? (s.age    || 'TV-MA') : 'TV-MA'}</td>
    <td>—</td>
    <td><span class="pill pill-green">Active</span></td>
    <td>
      <button class="tbl-btn" onclick="editRow(this)">Edit</button>
      <button class="tbl-btn" onclick="toggleFeature(this)">Deactivate</button>
      <button class="tbl-btn del" onclick="deleteContentRow(this)">Delete</button>
    </td>`;
  tbody.appendChild(tr);
}

// ── Upload a file, return its server URL ─────────────────────────────────────
async function _upload(file, dir, name) {
  const fd = new FormData();
  fd.append('file', file);
  fd.append('dir',  dir);
  fd.append('name', name);
  const r = await fetch(API_BASE + '/api/upload', { method: 'POST', body: fd });
  const j = await r.json();
  return j.url; // e.g. /uploads/dark-horizon/thumbnail.jpg
}

// ── Save show + upload any new media files ───────────────────────────────────
async function dbSaveShow(title, showData, mediaFiles) {
  const key = title.toLowerCase().replace(/[^a-z0-9_-]/g, '-');
  if (!titleMedia[title.toLowerCase()]) titleMedia[title.toLowerCase()] = {};
  const tm = titleMedia[title.toLowerCase()];

  // Upload new files and collect their server URLs
  if (mediaFiles.imageFile) {
    const url = await _upload(mediaFiles.imageFile, key, 'thumbnail');
    tm.imageUrl = API_BASE + url;
    applyThumbnailToCards(title, tm.imageUrl);
  }
  if (mediaFiles.videoFile) {
    const url = await _upload(mediaFiles.videoFile.file, key, 'video');
    tm.videoUrl  = API_BASE + url;
    tm.videoName = mediaFiles.videoFile.name;
    tm.videoSize = mediaFiles.videoFile.size;
  }
  for (const [epKey, file] of Object.entries(mediaFiles.epImageFiles || {})) {
    const url = await _upload(file, key + '/eps/' + epKey, 'thumb');
    if (!tm.episodeImages) tm.episodeImages = {};
    tm.episodeImages[epKey] = API_BASE + url;
  }
  for (const [epKey, file] of Object.entries(mediaFiles.epVideoFiles || {})) {
    const url = await _upload(file, key + '/eps/' + epKey, 'video');
    if (!tm.episodeVideos) tm.episodeVideos = {};
    tm.episodeVideos[epKey] = API_BASE + url;
  }

  // Build the show record with all current media URLs (relative, no API_BASE prefix)
  const entry = { ...showData, title };
  const strip = u => (u && u.startsWith(API_BASE) ? u.slice(API_BASE.length) : u);
  if (tm.imageUrl)      entry.imageUrl      = strip(tm.imageUrl);
  if (tm.videoUrl)      { entry.videoUrl = strip(tm.videoUrl); entry.videoName = tm.videoName; entry.videoSize = tm.videoSize; }
  if (tm.episodeImages) {
    entry.episodeImages = {};
    Object.entries(tm.episodeImages).forEach(([k, v]) => { entry.episodeImages[k] = strip(v); });
  }
  if (tm.episodeVideos) {
    entry.episodeVideos = {};
    Object.entries(tm.episodeVideos).forEach(([k, v]) => { entry.episodeVideos[k] = strip(v); });
  }

  await fetch(API_BASE + '/api/shows', {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(entry)
  });
}

// ── Delete show + its uploaded files ────────────────────────────────────────
async function dbDeleteShow(title) {
  await fetch(API_BASE + '/api/shows/' + encodeURIComponent(title), { method: 'DELETE' });
}
