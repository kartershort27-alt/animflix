// ── PIN — change this to lock admin ──────────────────────────────────────────
const ADMIN_PIN = '1234';
let _pin = '';

function openPinModal() {
  _pin = '';
  _pinSync();
  document.getElementById('pinErr').textContent = '';
  document.getElementById('pinOverlay').classList.add('open');
}

function closePinModal() {
  document.getElementById('pinOverlay').classList.remove('open');
  _pin = '';
}

function pinKey(d) {
  if (_pin.length >= 4) return;
  _pin += d;
  _pinSync();
  if (_pin.length === 4) setTimeout(_pinCheck, 180);
}

function pinBack() {
  _pin = _pin.slice(0, -1);
  _pinSync();
}

function pinReset() {
  _pin = '';
  _pinSync();
}

function _pinSync() {
  for (let i = 0; i < 4; i++)
    document.getElementById('pd' + i).classList.toggle('on', i < _pin.length);
}

function _pinCheck() {
  if (_pin === ADMIN_PIN) {
    closePinModal();
    openAdmin();
  } else {
    document.getElementById('pinErr').textContent = 'Incorrect PIN. Try again.';
    _pin = '';
    _pinSync();
    const m = document.getElementById('pinModal');
    m.style.animation = 'pinShake 0.35s ease';
    setTimeout(() => m.style.animation = '', 400);
  }
}

// ── Panel open/close ──────────────────────────────────────────────────────────
function openAdmin() {
  document.getElementById('adminPanel').classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeAdmin() {
  document.getElementById('adminPanel').classList.remove('open');
  if (!document.getElementById('modal').classList.contains('open'))
    document.body.style.overflow = '';
}

// ── Sidebar tabs ──────────────────────────────────────────────────────────────
function adminTab(name, el) {
  document.querySelectorAll('.admin-tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.admin-nav-item').forEach(n => n.classList.remove('active'));
  document.getElementById('tab-' + name).classList.add('active');
  el.classList.add('active');
}

// ── Content table search ──────────────────────────────────────────────────────
function filterContent(val) {
  const term = val.toLowerCase();
  document.querySelectorAll('#contentTbody tr').forEach(row => {
    row.style.display = (row.dataset.title || '').includes(term) ? '' : 'none';
  });
}

// ── Delete row ────────────────────────────────────────────────────────────────
function deleteContentRow(btn) {
  const row = btn.closest('tr');
  const flexDiv = row.cells[0].querySelector('div');
  let name = '';
  flexDiv.childNodes.forEach(n => { if (n.nodeType === 3) name += n.textContent; });
  name = name.trim();
  if (!confirm(`Delete "${name}"?`)) return;

  // Remove from CUSTOM_SHOWS and DB
  if (CUSTOM_SHOWS[name]) {
    delete CUSTOM_SHOWS[name];
    dbDeleteShow(name);
  }

  // Revoke blob URLs and clear titleMedia
  const key = name.toLowerCase();
  if (titleMedia[key]) {
    const m = titleMedia[key];
    if (m.imageUrl) URL.revokeObjectURL(m.imageUrl);
    if (m.videoUrl) URL.revokeObjectURL(m.videoUrl);
    if (m.episodeImages) Object.values(m.episodeImages).forEach(u => URL.revokeObjectURL(u));
    if (m.episodeVideos) Object.values(m.episodeVideos).forEach(u => URL.revokeObjectURL(u));
    delete titleMedia[key];
  }

  // Remove home page cards
  document.querySelectorAll(`.card[data-title="${name}"]`).forEach(c => c.remove());

  row.style.transition = 'opacity 0.3s';
  row.style.opacity = '0';
  setTimeout(() => row.remove(), 300);
}

// ── Toggle active/inactive ────────────────────────────────────────────────────
function toggleFeature(btn) {
  const pill = btn.closest('tr').querySelector('td:nth-child(6) .pill');
  const on = pill.classList.contains('pill-green');
  pill.className = 'pill ' + (on ? 'pill-red' : 'pill-green');
  pill.textContent = on ? 'Inactive' : 'Active';
  btn.textContent  = on ? 'Activate' : 'Deactivate';
}

// ── Feature flag toggles ──────────────────────────────────────────────────────
function toggleFlag(el) {
  const on = el.style.background === 'rgb(70, 211, 105)';
  el.style.background = on ? '#333' : '#46d369';
  const knob = el.querySelector('div');
  knob.style.cssText = on
    ? 'position:absolute;left:2px;top:2px;width:18px;height:18px;background:#888;border-radius:50%'
    : 'position:absolute;right:2px;top:2px;width:18px;height:18px;background:#fff;border-radius:50%';
}

// ── Form state ────────────────────────────────────────────────────────────────
let _editRow      = null;
let _editOldTitle = null;
let _pendingImageUrl  = null;
let _pendingVideoUrl  = null;
let _pendingVideoName = null;
let _pendingVideoSize = null;
let _pendingEpVideos  = {};
let _pendingEpImages  = {};
let _pendingImageFile    = null;
let _pendingVideoFile    = null;
let _pendingEpVideoFiles = {};
let _pendingEpImageFiles = {};

function _resetPending() {
  _pendingImageUrl  = null;
  _pendingVideoUrl  = null;
  _pendingVideoName = null;
  _pendingVideoSize = null;
  _pendingEpVideos  = {};
  _pendingEpImages  = {};
  _pendingImageFile    = null;
  _pendingVideoFile    = null;
  _pendingEpVideoFiles = {};
  _pendingEpImageFiles = {};
}

// ── Episode rows in form ──────────────────────────────────────────────────────
let _epRowSeq = 0;

function addEpisodeRow(n, t, d, desc, hasVid, hasImg) {
  const rowId = 'epr' + (++_epRowSeq);
  const list = document.getElementById('formEpList');
  const row = document.createElement('div');
  row.className = 'form-ep-row';
  row.dataset.rowId = rowId;
  row.innerHTML = `
    <input class="form-input ep-n" type="number" value="${n != null ? n : ''}" placeholder="#" min="1" style="width:46px">
    <input class="form-input ep-t" value="${t || ''}" placeholder="Episode title" style="flex:1">
    <input class="form-input ep-d" value="${d || ''}" placeholder="Duration" style="width:72px">
    <button class="form-ep-img ${hasImg ? 'has-img' : ''}" type="button" title="${hasImg ? 'Image uploaded' : 'Add episode thumbnail'}" onclick="this.nextElementSibling.click()">🖼</button>
    <input type="file" accept="image/*" style="display:none" onchange="handleEpImage(this)">
    <button class="form-ep-vid ${hasVid ? 'has-vid' : ''}" type="button" title="${hasVid ? 'Video uploaded' : 'Add episode video'}" onclick="this.nextElementSibling.click()">▶</button>
    <input type="file" accept=".mkv,.mp4,.avi,.webm,.mov,video/*" style="display:none" onchange="handleEpVideo(this)">
    <button class="form-ep-del" type="button" onclick="this.closest('.form-ep-row').remove()">✕</button>`;
  list.appendChild(row);
}

function handleEpImage(input) {
  const file = input.files[0];
  if (!file) return;
  const row = input.closest('.form-ep-row');
  const rowId = row.dataset.rowId;
  if (_pendingEpImages[rowId]) URL.revokeObjectURL(_pendingEpImages[rowId]);
  _pendingEpImages[rowId] = URL.createObjectURL(file);
  _pendingEpImageFiles[rowId] = file;
  const btn = row.querySelector('.form-ep-img');
  btn.classList.add('has-img');
  btn.title = file.name;
}

function handleEpVideo(input) {
  const file = input.files[0];
  if (!file) return;
  const row = input.closest('.form-ep-row');
  const rowId = row.dataset.rowId;
  if (_pendingEpVideos[rowId]) URL.revokeObjectURL(_pendingEpVideos[rowId]);
  _pendingEpVideos[rowId] = URL.createObjectURL(file);
  _pendingEpVideoFiles[rowId] = file;
  const btn = row.querySelector('.form-ep-vid');
  btn.classList.add('has-vid');
  btn.title = file.name;
}

function _loadEpisodes(title) {
  document.getElementById('formEpList').innerHTML = '';
  if (!title) return;
  const s = SHOWS[title] || CUSTOM_SHOWS[title];
  if (!s || !s.episodes || !s.episodes[1]) return;
  const key = title.toLowerCase();
  const epVids = titleMedia[key] && titleMedia[key].episodeVideos;
  const epImgs = titleMedia[key] && titleMedia[key].episodeImages;
  s.episodes[1].forEach(ep => {
    const hasVid = !!(epVids && epVids['e' + ep.n]);
    const hasImg = !!(epImgs && epImgs['e' + ep.n]);
    addEpisodeRow(ep.n, ep.t, ep.d, ep.desc, hasVid, hasImg);
  });
}

function _collectEpisodes() {
  const rows = document.querySelectorAll('#formEpList .form-ep-row');
  const eps = [];
  rows.forEach(row => {
    const n = parseInt(row.querySelector('.ep-n').value) || eps.length + 1;
    const t = row.querySelector('.ep-t').value.trim();
    const d = row.querySelector('.ep-d').value.trim();
    if (t) eps.push({ n, t, d: d || '—', desc: '', rowId: row.dataset.rowId });
  });
  return eps;
}

// ── Open form ─────────────────────────────────────────────────────────────────
function _openForm(title, type, genre, rating, views, status, existingKey) {
  document.getElementById('formTitle').value  = title;
  document.getElementById('formType').value   = type;
  document.getElementById('formGenre').value  = genre;
  document.getElementById('formRating').value = rating;
  document.getElementById('formViews').value  = views;
  document.getElementById('formStatus').value = status;

  document.getElementById('formImage').value = '';
  document.getElementById('formVideo').value = '';

  const existing = existingKey ? titleMedia[existingKey] : null;
  if (existing && existing.imageUrl) {
    _showImagePreview(existing.imageUrl);
  } else {
    _clearImagePreview();
  }
  if (existing && existing.videoUrl) {
    _showVideoInfo(existing.videoName || 'video.mkv', existing.videoSize || '');
  } else {
    _clearVideoInfo();
  }

  _loadEpisodes(title);

  document.getElementById('formOverlay').classList.add('open');
  document.getElementById('formTitle').focus();
}

function closeForm() {
  document.getElementById('formOverlay').classList.remove('open');
  _resetPending();
  _editRow = null;
  _editOldTitle = null;
}

// ── Image preview helpers ─────────────────────────────────────────────────────
function _showImagePreview(url) {
  const img = document.getElementById('imgPreview');
  const ph  = document.getElementById('imgPlaceholder');
  img.src = url;
  img.style.display = 'block';
  ph.style.display  = 'none';
  document.getElementById('imgDropBox').style.border = '2px solid #46d369';
}

function _clearImagePreview() {
  const img = document.getElementById('imgPreview');
  const ph  = document.getElementById('imgPlaceholder');
  img.src = '';
  img.style.display = 'none';
  ph.style.display  = 'flex';
  document.getElementById('imgDropBox').style.border = '';
}

function _showVideoInfo(name, size) {
  document.getElementById('videoPlaceholder').style.display = 'none';
  document.getElementById('videoFileInfo').style.display    = 'block';
  document.getElementById('videoFileName').textContent = name;
  document.getElementById('videoFileSize').textContent = size;
  document.getElementById('videoDropBox').style.border = '2px solid #46d369';
}

function _clearVideoInfo() {
  document.getElementById('videoPlaceholder').style.display = 'flex';
  document.getElementById('videoFileInfo').style.display    = 'none';
  document.getElementById('videoDropBox').style.border = '';
}

// ── Image upload handler ──────────────────────────────────────────────────────
function handleImageUpload(input) {
  const file = input.files[0];
  if (!file) return;
  if (_pendingImageUrl) URL.revokeObjectURL(_pendingImageUrl);
  _pendingImageUrl  = URL.createObjectURL(file);
  _pendingImageFile = file;
  _showImagePreview(_pendingImageUrl);
}

function dropImage(event) {
  event.preventDefault();
  const file = event.dataTransfer.files[0];
  if (!file || !file.type.startsWith('image/')) return;
  if (_pendingImageUrl) URL.revokeObjectURL(_pendingImageUrl);
  _pendingImageUrl  = URL.createObjectURL(file);
  _pendingImageFile = file;
  _showImagePreview(_pendingImageUrl);
}

// ── Video upload handler ──────────────────────────────────────────────────────
function handleVideoUpload(input) {
  const file = input.files[0];
  if (!file) return;
  if (_pendingVideoUrl) URL.revokeObjectURL(_pendingVideoUrl);
  _pendingVideoUrl  = URL.createObjectURL(file);
  _pendingVideoName = file.name;
  _pendingVideoSize = _formatSize(file.size);
  _pendingVideoFile = file;
  _showVideoInfo(_pendingVideoName, _pendingVideoSize);
}

function dropVideo(event) {
  event.preventDefault();
  const file = event.dataTransfer.files[0];
  if (!file) return;
  if (_pendingVideoUrl) URL.revokeObjectURL(_pendingVideoUrl);
  _pendingVideoUrl  = URL.createObjectURL(file);
  _pendingVideoName = file.name;
  _pendingVideoSize = _formatSize(file.size);
  _pendingVideoFile = file;
  _showVideoInfo(_pendingVideoName, _pendingVideoSize);
}

function _formatSize(bytes) {
  if (bytes >= 1e9) return (bytes / 1e9).toFixed(1) + ' GB';
  if (bytes >= 1e6) return (bytes / 1e6).toFixed(1) + ' MB';
  return (bytes / 1e3).toFixed(0) + ' KB';
}

// ── Edit existing row ─────────────────────────────────────────────────────────
function editRow(btn) {
  _editRow = btn.closest('tr');
  const cells = _editRow.cells;
  const flexDiv = cells[0].querySelector('div');
  let title = '';
  flexDiv.childNodes.forEach(n => { if (n.nodeType === 3) title += n.textContent; });
  title = title.trim();
  _editOldTitle = title;
  const key = title.toLowerCase();
  document.getElementById('formModalHeading').textContent = 'Edit Title';
  _openForm(title, cells[1].innerText.trim(), cells[2].innerText.trim(),
            cells[3].innerText.trim(), cells[4].innerText.trim(),
            cells[5].querySelector('.pill').textContent.trim(), key);
}

// ── Add new row ───────────────────────────────────────────────────────────────
function openAddForm() {
  _editRow = null;
  document.getElementById('formModalHeading').textContent = 'Add Title';
  _openForm('', 'Series', '', 'TV-MA', '0', 'Active', null);
}

// ── Save ──────────────────────────────────────────────────────────────────────
function saveForm() {
  const title  = document.getElementById('formTitle').value.trim();
  const type   = document.getElementById('formType').value;
  const genre  = document.getElementById('formGenre').value.trim();
  const rating = document.getElementById('formRating').value;
  const views  = document.getElementById('formViews').value.trim();
  const status = document.getElementById('formStatus').value;

  if (!title) {
    const inp = document.getElementById('formTitle');
    inp.style.borderColor = '#E50914';
    inp.focus();
    setTimeout(() => inp.style.borderColor = '', 1500);
    return;
  }

  let key = title.toLowerCase();
  const episodes = _collectEpisodes();

  // Handle title rename: migrate media + show data to new key
  if (_editRow && _editOldTitle && _editOldTitle !== title) {
    const oldKey = _editOldTitle.toLowerCase();
    if (titleMedia[oldKey]) { titleMedia[key] = titleMedia[oldKey]; delete titleMedia[oldKey]; }
    if (CUSTOM_SHOWS[_editOldTitle]) {
      CUSTOM_SHOWS[title] = CUSTOM_SHOWS[_editOldTitle];
      delete CUSTOM_SHOWS[_editOldTitle];
    } else if (SHOWS[_editOldTitle]) {
      CUSTOM_SHOWS[title] = Object.assign({}, SHOWS[_editOldTitle]);
    }
    // Update any home-page cards with the old title
    document.querySelectorAll(`.card[data-title="${_editOldTitle}"]`).forEach(card => {
      card.dataset.title = title;
      const lbl = card.querySelector('.card-label');
      if (lbl) lbl.textContent = title;
      card.onclick = null;
      card.addEventListener('click', () => openModal(title));
    });
  }

  // Merge media
  if (!titleMedia[key]) titleMedia[key] = {};
  if (_pendingImageUrl) {
    if (titleMedia[key].imageUrl) URL.revokeObjectURL(titleMedia[key].imageUrl);
    titleMedia[key].imageUrl = _pendingImageUrl;
  }
  if (_pendingVideoUrl) {
    if (titleMedia[key].videoUrl) URL.revokeObjectURL(titleMedia[key].videoUrl);
    titleMedia[key].videoUrl  = _pendingVideoUrl;
    titleMedia[key].videoName = _pendingVideoName;
    titleMedia[key].videoSize = _pendingVideoSize;
  }

  // Save per-episode videos + images into titleMedia
  if (!titleMedia[key].episodeVideos) titleMedia[key].episodeVideos = {};
  if (!titleMedia[key].episodeImages) titleMedia[key].episodeImages = {};
  episodes.forEach(ep => {
    const epKey = 'e' + ep.n;
    if (ep.rowId && _pendingEpVideos[ep.rowId]) {
      if (titleMedia[key].episodeVideos[epKey]) URL.revokeObjectURL(titleMedia[key].episodeVideos[epKey]);
      titleMedia[key].episodeVideos[epKey] = _pendingEpVideos[ep.rowId];
    }
    if (ep.rowId && _pendingEpImages[ep.rowId]) {
      if (titleMedia[key].episodeImages[epKey]) URL.revokeObjectURL(titleMedia[key].episodeImages[epKey]);
      titleMedia[key].episodeImages[epKey] = _pendingEpImages[ep.rowId];
    }
  });

  // Save episodes into SHOWS or CUSTOM_SHOWS
  const showData = CUSTOM_SHOWS[title] || SHOWS[title];
  if (showData) {
    showData.episodes = showData.episodes || {};
    showData.episodes[1] = episodes;
    showData.genres = genre || showData.genres;
    showData.age    = rating;
  }

  const pillClass = { Active:'pill-green', Inactive:'pill-red', Pending:'pill-orange', New:'pill-blue' }[status] || 'pill-green';
  const hasImg = titleMedia[key] && titleMedia[key].imageUrl;
  const thumbStyle = hasImg
    ? `style="background-image:url('${titleMedia[key].imageUrl}');background-size:cover;background-position:center"`
    : '';

  if (_editRow) {
    const oldThumb = _editRow.cells[0].querySelector('.tbl-thumb');
    const gradClass = oldThumb ? (oldThumb.className.match(/g\d+/) || [''])[0] : '';
    _editRow.cells[0].innerHTML = `<div style="display:flex;align-items:center;gap:10px">
      <div class="tbl-thumb ${gradClass}" ${thumbStyle}>${hasImg ? '' : (oldThumb ? oldThumb.innerHTML : '🎬')}</div>${title}
    </div>`;
    _editRow.cells[1].textContent = type;
    _editRow.cells[2].textContent = genre;
    _editRow.cells[3].textContent = rating;
    _editRow.cells[4].textContent = views;
    _editRow.cells[5].innerHTML   = `<span class="pill ${pillClass}">${status}</span>`;
    _editRow.dataset.title = key;
  } else {
    // Register in CUSTOM_SHOWS so the modal and tooltip can read it
    CUSTOM_SHOWS[title] = {
      match: '98%',
      year: new Date().getFullYear().toString(),
      age: rating,
      seasons: type === 'Series' || type === 'Limited Series' ? '1 Season' : type,
      seasonCount: 1,
      bg: 'linear-gradient(135deg,#1a1a2e,#16213e,#0f3460)',
      art: '🎬',
      desc: '',
      cast: '',
      genres: genre,
      mood: '',
      episodes: { 1: episodes }
    };

    // Add card to "New on Netflix" home page row
    const homeRow = document.getElementById('newOnNetflixCards');
    if (homeRow) {
      const gradients = ['g2','g4','g6','g7','g9','g10','g12','g14','g15','g17','g18','g19'];
      const g = gradients[Math.floor(Math.random() * gradients.length)];
      const card = document.createElement('div');
      card.className = 'card';
      card.dataset.title = title;
      card.innerHTML = `<div class="card-thumb ${hasImg ? '' : g}" ${thumbStyle}><div class="n-badge">N</div><div class="card-label">${title}</div></div>`;
      card.addEventListener('click', () => openModal(title));
      homeRow.prepend(card);
      if (typeof attachCardHover === 'function') attachCardHover(card);
    }

    // Admin table row
    const tbody = document.getElementById('contentTbody');
    const tr = document.createElement('tr');
    tr.dataset.title = key;
    tr.innerHTML = `
      <td><div style="display:flex;align-items:center;gap:10px">
        <div class="tbl-thumb" ${thumbStyle}>${hasImg ? '' : '🎬'}</div>${title}
      </div></td>
      <td>${type}</td><td>${genre}</td><td>${rating}</td><td>${views}</td>
      <td><span class="pill ${pillClass}">${status}</span></td>
      <td>
        <button class="tbl-btn" onclick="editRow(this)">Edit</button>
        <button class="tbl-btn" onclick="toggleFeature(this)">Deactivate</button>
        <button class="tbl-btn del" onclick="deleteContentRow(this)">Delete</button>
      </td>`;
    tbody.appendChild(tr);
    tr.style.opacity = '0';
    tr.style.transition = 'opacity 0.4s';
    requestAnimationFrame(() => tr.style.opacity = '1');
  }

  if (hasImg) applyThumbnailToCards(title, titleMedia[key].imageUrl);

  // Persist to local DB — must happen before closeForm() resets pending state
  if (_editRow && _editOldTitle && _editOldTitle !== title) dbDeleteShow(_editOldTitle);
  if (!CUSTOM_SHOWS[title] && SHOWS[title]) CUSTOM_SHOWS[title] = Object.assign({}, SHOWS[title]);
  if (CUSTOM_SHOWS[title]) {
    const epImgFiles = {};
    const epVidFiles = {};
    episodes.forEach(ep => {
      const epKey = 'e' + ep.n;
      if (ep.rowId && _pendingEpImageFiles[ep.rowId]) epImgFiles[epKey] = _pendingEpImageFiles[ep.rowId];
      if (ep.rowId && _pendingEpVideoFiles[ep.rowId]) epVidFiles[epKey] = _pendingEpVideoFiles[ep.rowId];
    });
    dbSaveShow(title, CUSTOM_SHOWS[title], {
      imageFile: _pendingImageFile,
      videoFile: _pendingVideoFile
        ? { file: _pendingVideoFile, name: _pendingVideoName, size: _pendingVideoSize }
        : null,
      epImageFiles: epImgFiles,
      epVideoFiles: epVidFiles
    });
  }

  const msg = _editRow ? 'Changes saved' : `"${title}" added`;
  closeForm();
  showToast(msg);
  _editRow = null;
}

// ── Toast ─────────────────────────────────────────────────────────────────────
function showToast(msg) {
  const t = document.getElementById('adminToast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2200);
}
