const express = require('express');
const multer  = require('multer');
const cors    = require('cors');
const fs      = require('fs');
const path    = require('path');

// shell is only available when running inside Electron (main process)
let _shell;
try { _shell = require('electron').shell; } catch {}

const app  = express();
const PORT = process.env.PORT || 3001;

const DATA_DIR  = process.env.DATA_DIR || path.join(__dirname, 'data');
const DATA_FILE = path.join(DATA_DIR, 'shows.json');
const UPLOADS   = path.join(DATA_DIR, 'uploads');

fs.mkdirSync(DATA_DIR, { recursive: true });
fs.mkdirSync(UPLOADS, { recursive: true });
if (!fs.existsSync(DATA_FILE)) fs.writeFileSync(DATA_FILE, '{}');

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(cors({ origin: '*' }));
app.use(express.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname)));       // serve HTML/CSS/JS
// Serve uploaded files — set correct MIME types for all video formats
app.use('/uploads', (req, res, next) => {
  const ext = req.path.split('.').pop().toLowerCase();
  const mime = {
    mkv: 'video/x-matroska', avi: 'video/x-msvideo',
    mov: 'video/quicktime',  mp4: 'video/mp4',
    webm: 'video/webm',      m4v: 'video/mp4'
  }[ext];
  if (mime) res.setHeader('Content-Type', mime);
  next();
}, express.static(UPLOADS));

// ── SSE — real-time push to all connected browsers ───────────────────────────
const clients = new Set();

app.get('/api/events', (req, res) => {
  res.writeHead(200, {
    'Content-Type':  'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection':    'keep-alive',
  });
  res.write('\n');
  clients.add(res);

  // Send current shows immediately so new tabs load data without waiting
  res.write(`event:init\ndata:${JSON.stringify(_readAll())}\n\n`);

  req.on('close', () => clients.delete(res));
});

function _push(event, data) {
  const msg = `event:${event}\ndata:${JSON.stringify(data)}\n\n`;
  clients.forEach(c => c.write(msg));
}

// ── Data helpers ──────────────────────────────────────────────────────────────
function _read() {
  try { return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8')); }
  catch { return {}; }
}

function _write(shows) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(shows, null, 2));
}

// ── Shows API ─────────────────────────────────────────────────────────────────
app.get('/api/shows', (req, res) => res.json(_read()));

app.post('/api/shows', (req, res) => {
  const show = req.body;
  if (!show || !show.title) return res.status(400).json({ error: 'title required' });
  const shows = _read();
  shows[show.title] = show;
  _write(shows);
  _push('show_updated', show);
  res.json({ ok: true });
});

app.delete('/api/shows/:title', (req, res) => {
  const title  = decodeURIComponent(req.params.title);
  const shows  = _read();
  delete shows[title];
  _write(shows);
  _push('show_deleted', { title });
  // Delete any uploaded files for this show
  const dir = path.join(UPLOADS, _safeKey(title));
  fs.rmSync(dir, { recursive: true, force: true });
  res.json({ ok: true });
});

// ── File upload ───────────────────────────────────────────────────────────────
const storage = multer.diskStorage({
  destination(req, file, cb) {
    // dir param like "dark-horizon" or "dark-horizon/eps/e1"
    const dir = path.join(UPLOADS, _safePath(req.body.dir || 'misc'));
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename(req, file, cb) {
    const name = _safeKey(req.body.name || 'file');
    cb(null, name + path.extname(file.originalname).toLowerCase());
  }
});

const upload = multer({ storage, limits: { fileSize: 4 * 1024 * 1024 * 1024 } }); // 4 GB max

app.post('/api/upload', upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'no file received' });
  const url = '/uploads/' + _safePath(req.body.dir) + '/' + req.file.filename;
  res.json({ url });
});

// ── Library folders (series/ and movies/ under DATA_DIR) ─────────────────────
const SERIES_DIR = path.join(DATA_DIR, 'series');
const MOVIES_DIR = path.join(DATA_DIR, 'movies');
fs.mkdirSync(SERIES_DIR, { recursive: true });
fs.mkdirSync(MOVIES_DIR, { recursive: true });

// ── Open local file with OS default media player (VLC, MPC-HC, etc.) ─────────
app.post('/api/open-local', (req, res) => {
  const raw = (req.body && req.body.url) || '';
  if (!raw) return res.status(400).json({ error: 'url required' });
  const rel = raw.replace(/^https?:\/\/localhost:\d+/, '');
  let filePath;
  if      (rel.startsWith('/uploads/')) filePath = path.join(UPLOADS,    ...rel.slice('/uploads/'.length).split('/').map(decodeURIComponent));
  else if (rel.startsWith('/series/'))  filePath = path.join(SERIES_DIR, ...rel.slice('/series/'.length).split('/').map(decodeURIComponent));
  else if (rel.startsWith('/movies/'))  filePath = path.join(MOVIES_DIR, decodeURIComponent(rel.slice('/movies/'.length)));
  else return res.status(400).json({ error: 'non-local URL' });
  if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'file not found: ' + filePath });
  if (_shell) {
    _shell.openPath(filePath).then(() => res.json({ ok: true }));
  } else {
    require('child_process').exec('start "" "' + filePath + '"');
    res.json({ ok: true });
  }
});

const VIDEO_EXTS = new Set(['mp4','mkv','avi','webm','mov','m4v']);

function _fmtSize(b) {
  return b >= 1e9 ? (b/1e9).toFixed(1)+' GB' : b >= 1e6 ? (b/1e6).toFixed(1)+' MB' : Math.round(b/1e3)+' KB';
}

// Parse episode info out of a filename: S01E02 - Title.mkv, E3 - Title.mkv, 04 - Title.mkv
function _parseEp(name) {
  const base = name.replace(/\.[^.]+$/, '');
  let m = base.match(/[Ss](\d+)[Ee](\d+)(?:\s*[-–]\s*(.+))?/);
  if (m) return { season: +m[1], ep: +m[2], title: m[3] ? m[3].trim() : null };
  m = base.match(/[Ee](\d+)(?:\s*[-–]\s*(.+))?/);
  if (m) return { season: 1, ep: +m[1], title: m[2] ? m[2].trim() : null };
  m = base.match(/^(\d+)(?:\s*[-–.]\s*(.+))?/);
  if (m) return { season: 1, ep: +m[1], title: m[2] ? m[2].trim() : null };
  return null;
}

let _libShows = {};

function _scanLibrary() {
  const result = {};

  // Movies — each video file = one movie
  try {
    fs.readdirSync(MOVIES_DIR).forEach(f => {
      if (!VIDEO_EXTS.has(f.split('.').pop().toLowerCase())) return;
      const title = f.replace(/\.[^.]+$/, '').replace(/[-_.]+/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
      let sz = '';
      try { sz = _fmtSize(fs.statSync(path.join(MOVIES_DIR, f)).size); } catch {}
      result[title] = {
        title, type: 'Film', age: 'TV-MA', seasons: 'Film', seasonCount: 0,
        bg: 'linear-gradient(135deg,#1a1a2e,#16213e,#0f3460)', art: '🎬',
        desc: '', cast: '', genres: '', mood: '', episodes: {},
        videoUrl:  '/movies/' + encodeURIComponent(f),
        videoName: f, videoSize: sz
      };
    });
  } catch {}

  // Series — each subfolder = one show, files inside = episodes
  try {
    fs.readdirSync(SERIES_DIR).forEach(showName => {
      const showDir = path.join(SERIES_DIR, showName);
      try { if (!fs.statSync(showDir).isDirectory()) return; } catch { return; }

      const seasons = {};     // { 1: [{n,t,d}], 2: [...] }
      const epVideos = {};    // { 's1e1': url, 's2e3': url }

      try {
        fs.readdirSync(showDir).forEach(f => {
          if (!VIDEO_EXTS.has(f.split('.').pop().toLowerCase())) return;
          const p = _parseEp(f);
          if (!p) return;
          if (!seasons[p.season]) seasons[p.season] = [];
          seasons[p.season].push({ n: p.ep, t: p.title || ('Episode ' + p.ep), d: '—' });
          epVideos['s' + p.season + 'e' + p.ep] =
            '/series/' + encodeURIComponent(showName) + '/' + encodeURIComponent(f);
        });
      } catch {}

      Object.keys(seasons).forEach(s => seasons[s].sort((a, b) => a.n - b.n));
      const count = Object.keys(seasons).length;
      if (!count) return;

      const first = Math.min(...Object.keys(seasons).map(Number));
      const ep1   = seasons[first][0];

      result[showName] = {
        title: showName, type: 'Series', age: 'TV-MA',
        seasons: count + ' Season' + (count !== 1 ? 's' : ''), seasonCount: count,
        bg: 'linear-gradient(135deg,#1a1a2e,#16213e,#0f3460)', art: '🎬',
        desc: '', cast: '', genres: '', mood: '',
        episodes: seasons, episodeVideos: epVideos,
        videoUrl:  ep1 ? epVideos['s' + first + 'e' + ep1.n] : null,
        videoName: ep1 ? ep1.t : null
      };
    });
  } catch {}

  return result;
}

// ── library.json — fetched live from GitHub ───────────────────────────────────
const https = require('https');

const GH_OWNER = process.env.GH_OWNER || 'kartershort27-alt';
const GH_REPO  = process.env.GH_REPO  || 'animflix';
const GH_TOKEN = process.env.GH_TOKEN || '';

let _jsonLib     = {};
let _jsonLibHash = '';

function _parseLibrary({ series = [], movies = [] }) {
  const result = {};
  movies.forEach(m => {
    if (!m.title || !m.url) return;
    result[m.title] = {
      title: m.title, type: 'Film', age: m.age || 'TV-MA',
      seasons: 'Film', seasonCount: 0,
      bg: 'linear-gradient(135deg,#1a1a2e,#16213e,#0f3460)', art: '🎬',
      desc: m.desc || '', cast: m.cast || '', genres: m.genres || '',
      mood: m.mood || '', year: m.year || '',
      imageUrl: m.thumbnail || '', episodes: {},
      videoUrl: m.url, videoName: m.title + '.mp4'
    };
  });
  series.forEach(s => {
    if (!s.title || !s.seasons) return;
    const seasons = {};
    const epVideos = {};
    Object.entries(s.seasons).forEach(([sNum, eps]) => {
      seasons[sNum] = eps.map(e => ({ n: e.ep, t: e.title || ('Episode ' + e.ep), d: e.duration || '—' }));
      eps.forEach(e => { if (e.url) epVideos['s' + sNum + 'e' + e.ep] = e.url; });
    });
    Object.keys(seasons).forEach(n => seasons[n].sort((a, b) => a.n - b.n));
    const count = Object.keys(seasons).length;
    const first = Math.min(...Object.keys(seasons).map(Number));
    const ep1   = seasons[first] && seasons[first][0];
    result[s.title] = {
      title: s.title, type: 'Series', age: s.age || 'TV-MA',
      seasons: count + ' Season' + (count !== 1 ? 's' : ''), seasonCount: count,
      bg: 'linear-gradient(135deg,#1a1a2e,#16213e,#0f3460)', art: '🎬',
      desc: s.desc || '', cast: s.cast || '', genres: s.genres || '',
      mood: s.mood || '', year: s.year || '',
      imageUrl: s.thumbnail || '',
      episodes: seasons, episodeVideos: epVideos,
      videoUrl:  ep1 ? epVideos['s' + first + 'e' + ep1.n] : null,
      videoName: ep1 ? ep1.t : null
    };
  });
  return result;
}

// Fetch library.json from GitHub API. Falls back to local copy on error.
function _fetchGitHubLibrary() {
  return new Promise(resolve => {
    const headers = {
      'User-Agent':  'AniFlix-Server/1.0',
      'Accept':      'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28'
    };
    if (GH_TOKEN) headers['Authorization'] = 'Bearer ' + GH_TOKEN;

    const req = https.get(
      `https://api.github.com/repos/${GH_OWNER}/${GH_REPO}/contents/library.json`,
      { headers },
      res => {
        let body = '';
        res.on('data', d => body += d);
        res.on('end', () => {
          try {
            const json  = JSON.parse(body);
            const sha   = json.sha || '';
            const data  = JSON.parse(Buffer.from(json.content.replace(/\n/g, ''), 'base64').toString('utf8'));
            resolve({ data, sha });
          } catch { resolve(null); }
        });
      }
    );
    req.on('error', () => resolve(null));
    req.setTimeout(8000, () => { req.destroy(); resolve(null); });
  });
}

async function _loadJsonLibrary() {
  const result = await _fetchGitHubLibrary();
  if (result) {
    _jsonLibHash = result.sha;
    return _parseLibrary(result.data);
  }
  // Fall back to bundled library.json
  const libFile = path.join(__dirname, 'library.json');
  try { return _parseLibrary(JSON.parse(fs.readFileSync(libFile, 'utf8'))); } catch { return {}; }
}

// Poll GitHub every 60 s; push SSE if library changed
async function _watchGitHubLibrary() {
  const poll = async () => {
    const result = await _fetchGitHubLibrary();
    if (result && result.sha && result.sha !== _jsonLibHash) {
      _jsonLibHash = result.sha;
      const prev  = _jsonLib;
      _jsonLib    = _parseLibrary(result.data);
      const all   = _readAll();
      // Push added/changed shows
      Object.keys(_jsonLib).forEach(t => {
        if (JSON.stringify(prev[t]) !== JSON.stringify(_jsonLib[t])) _push('show_updated', all[t] || _jsonLib[t]);
      });
      // Push removed shows (only if not in local folders or admin overrides)
      Object.keys(prev).forEach(t => {
        if (!_jsonLib[t] && !_libShows[t] && !_read()[t]) _push('show_deleted', { title: t });
      });
      console.log('  library.json updated from GitHub →', Object.keys(_jsonLib).length, 'titles');
    }
  };
  setInterval(poll, 60_000);
}

// Merge all sources: library.json (GitHub) + folder scan (local) + shows.json (admin edits)
function _readAll() {
  const admin = _read();
  const out   = { ..._jsonLib, ..._libShows };
  Object.entries(admin).forEach(([title, show]) => {
    const base = out[title] || {};
    out[title] = {
      ...base, ...show,
      episodeVideos: { ...(base.episodeVideos || {}), ...(show.episodeVideos || {}) }
    };
  });
  return out;
}

// Watch library folders and push SSE on changes
function _watchLibrary() {
  let timer;
  const rescan = () => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      const prev = _libShows;
      _libShows = _scanLibrary();
      const all = _readAll();
      Object.values(_libShows).forEach(s => {
        if (JSON.stringify(prev[s.title]) !== JSON.stringify(s)) _push('show_updated', all[s.title] || s);
      });
      Object.keys(prev).forEach(t => {
        if (!_libShows[t] && !_read()[t]) _push('show_deleted', { title: t });
      });
    }, 800);
  };
  try { fs.watch(SERIES_DIR, { recursive: true }, rescan); } catch {}
  try { fs.watch(MOVIES_DIR, { recursive: true }, rescan); } catch {}
}

// Stream series/movies files with range-request support
function _streamFile(filePath, req, res) {
  let stat;
  try { stat = fs.statSync(filePath); } catch { return res.status(404).end(); }
  const ext  = filePath.split('.').pop().toLowerCase();
  const mime = { mkv:'video/x-matroska', avi:'video/x-msvideo', mov:'video/quicktime',
                 mp4:'video/mp4', webm:'video/webm', m4v:'video/mp4' }[ext] || 'video/mp4';
  const total = stat.size;
  const range = req.headers.range;
  if (range) {
    const [s, e] = range.replace(/bytes=/, '').split('-');
    const start = parseInt(s, 10), end = e ? parseInt(e, 10) : total - 1;
    res.writeHead(206, { 'Content-Range': `bytes ${start}-${end}/${total}`,
      'Accept-Ranges': 'bytes', 'Content-Length': end - start + 1, 'Content-Type': mime });
    fs.createReadStream(filePath, { start, end }).pipe(res);
  } else {
    res.writeHead(200, { 'Content-Length': total, 'Content-Type': mime, 'Accept-Ranges': 'bytes' });
    fs.createReadStream(filePath).pipe(res);
  }
}

app.get('/series/:show/:file', (req, res) =>
  _streamFile(path.join(SERIES_DIR, decodeURIComponent(req.params.show), decodeURIComponent(req.params.file)), req, res));

app.get('/movies/:file', (req, res) =>
  _streamFile(path.join(MOVIES_DIR, decodeURIComponent(req.params.file)), req, res));

// ── Helpers ───────────────────────────────────────────────────────────────────
function _safeKey(s) { return String(s).replace(/[^a-zA-Z0-9_.-]/g, '_'); }
function _safePath(s) { return String(s).replace(/\.\./g, '').replace(/[^a-zA-Z0-9_/.-]/g, '_'); }

// ── Start ─────────────────────────────────────────────────────────────────────
const _server = app.listen(PORT, async () => {
  _jsonLib  = await _loadJsonLibrary();
  _libShows = _scanLibrary();
  _watchLibrary();
  _watchGitHubLibrary();
  const j = Object.keys(_jsonLib).length;
  const f = Object.keys(_libShows).length;
  console.log(`\n  AniFlix server running → http://localhost:${PORT}`);
  console.log(`  library.json: ${j} title${j !== 1 ? 's' : ''} (GitHub: ${GH_OWNER}/${GH_REPO})`);
  console.log(`  Local folders: ${f} title${f !== 1 ? 's' : ''}\n`);
});
_server.on('error', err => {
  if (err.code === 'EADDRINUSE') console.log(`  Port ${PORT} already in use — skipping server start`);
  else console.error('Server error:', err);
});
