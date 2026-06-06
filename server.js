const express = require('express');
const multer  = require('multer');
const cors    = require('cors');
const fs      = require('fs');
const path    = require('path');

const app  = express();
const PORT = process.env.PORT || 3001;

const DATA_FILE = path.join(__dirname, 'data', 'shows.json');
const UPLOADS   = path.join(__dirname, 'uploads');

fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
fs.mkdirSync(UPLOADS, { recursive: true });
if (!fs.existsSync(DATA_FILE)) fs.writeFileSync(DATA_FILE, '{}');

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(cors({ origin: '*' }));
app.use(express.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname)));       // serve HTML/CSS/JS
app.use('/uploads', express.static(UPLOADS));         // serve uploaded files

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
  res.write(`event:init\ndata:${JSON.stringify(_read())}\n\n`);

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

// ── Helpers ───────────────────────────────────────────────────────────────────
function _safeKey(s) { return String(s).replace(/[^a-zA-Z0-9_.-]/g, '_'); }
function _safePath(s) { return String(s).replace(/\.\./g, '').replace(/[^a-zA-Z0-9_/.-]/g, '_'); }

// ── Start ─────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n  AniFlix server running → http://localhost:${PORT}\n`);
});
