// titleMedia[key] = { imageUrl, videoUrl, videoName, videoSize, episodeVideos: { e1: url, e2: url, ... } }
const titleMedia = {};

let _currentPlayerTitle = null;

function openPlayer(title, epKey) {
  _currentPlayerTitle = title;
  const key = title.toLowerCase();
  const media = titleMedia[key];

  // Episode-specific video takes priority over the show-level video
  const url = (epKey && media && media.episodeVideos && media.episodeVideos[epKey])
              || (media && media.videoUrl)
              || null;

  // epKey is either 's1e3' (library) or 'e3' (admin-uploaded)
  const seasonMatch = epKey && epKey.match(/^s(\d+)e(\d+)$/);
  const epLabel = seasonMatch
    ? `S${seasonMatch[1]}:E${seasonMatch[2]}`
    : epKey ? `Episode ${epKey.replace('e', '')}` : null;
  document.getElementById('vpTitleText').textContent =
    epLabel ? `${title}  —  ${epLabel}` : title;

  const video = document.getElementById('vpVideo');
  const noVideo = document.getElementById('vpNoVideo');

  if (url) {
    video.src = url;
    video.style.display = 'block';
    noVideo.style.display = 'none';
    video.load();
    video.play().catch(() => {});
    video.onerror = () => {
      // Browser can't play the format (e.g. MKV/H.265) — open with system player instead
      video.style.display = 'none';
      const msgEl = noVideo.querySelector('.vp-no-video-msg');
      const hintEl = noVideo.querySelector('.vp-no-video-hint');
      msgEl.textContent = 'Opening in your media player…';
      hintEl.textContent = '';
      noVideo.style.display = 'flex';
      fetch('/api/open-local', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url })
      })
      .then(r => r.json())
      .then(json => {
        if (json.ok) {
          msgEl.textContent = 'Playing in your default media player.';
        } else {
          msgEl.textContent = 'Cannot play this format. Error: ' + (json.error || 'unknown');
          hintEl.textContent = 'Try converting the file to MP4.';
        }
      })
      .catch(() => {
        msgEl.textContent = 'Format not supported by browser.';
        hintEl.textContent = 'Convert the file to MP4/H.264 for in-app playback.';
      });
    };
  } else {
    video.src = '';
    video.style.display = 'none';
    noVideo.style.display = 'flex';
  }

  document.getElementById('vpOverlay').classList.add('open');
  document.body.style.overflow = 'hidden';
}

function playEpisode(title, epKey) {
  closeModal();
  openPlayer(title, epKey);
}

function closePlayer() {
  const video = document.getElementById('vpVideo');
  video.pause();
  video.src = '';
  document.getElementById('vpOverlay').classList.remove('open');
  document.body.style.overflow = '';
  _currentPlayerTitle = null;
}

// Called by modal Play button
function playCurrentTitle() {
  const title = document.getElementById('modalTitle').textContent;
  if (title) {
    closeModal();
    openPlayer(title);
  }
}

// Modal My List button
function toggleMyListFromModal() {
  const title = document.getElementById('modalTitle').textContent;
  if (!title) return;
  const btn = document.getElementById('modalMyListBtn');
  if (myList.has(title)) {
    myList.delete(title);
    btn.textContent = '+ My List';
  } else {
    myList.add(title);
    btn.textContent = '✓ My List';
  }
  updateMyListRow();
}

// Keyboard shortcut — Escape closes player
document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && document.getElementById('vpOverlay').classList.contains('open')) {
    closePlayer();
  }
});

// ── Card thumbnail helpers (called by admin.js after save) ───────────────────
function applyThumbnailToCards(titleKey, imageUrl) {
  document.querySelectorAll(`.card[data-title="${titleKey}"] .card-thumb`).forEach(thumb => {
    thumb.style.backgroundImage = `url('${imageUrl}')`;
    thumb.style.backgroundSize = 'cover';
    thumb.style.backgroundPosition = 'center';
    // Remove old gradient class so image shows through
    thumb.className = 'card-thumb';
  });
}

function applyThumbnailToTableRow(row, imageUrl) {
  const thumb = row.querySelector('.tbl-thumb');
  if (!thumb) return;
  thumb.style.backgroundImage = `url('${imageUrl}')`;
  thumb.style.backgroundSize = 'cover';
  thumb.style.backgroundPosition = 'center';
  thumb.textContent = '';
}
