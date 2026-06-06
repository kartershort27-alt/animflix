function openModal(title) {
  const s = CUSTOM_SHOWS[title] || SHOWS[title];
  if (!s) return;

  document.getElementById('modalTitle').textContent = title;
  document.getElementById('modalMatch').textContent = s.match + ' Match';
  document.getElementById('modalYear').textContent = s.year;
  document.getElementById('modalAge').textContent = s.age;
  document.getElementById('modalSeasons').textContent = s.seasons || '';
  document.getElementById('modalDesc').textContent = s.desc || '';
  document.getElementById('modalBg').style.background = s.bg;
  document.getElementById('modalArt').textContent = s.art || '🎬';
  document.getElementById('modalSide').innerHTML =
    `<div><span>Cast: </span>${s.cast || '—'}</div>
     <div><span>Genres: </span>${s.genres || '—'}</div>
     ${s.mood ? `<div><span>This show is: </span>${s.mood}</div>` : ''}`;

  // Build season tabs
  const tabsEl = document.getElementById('seasonTabs');
  tabsEl.innerHTML = '';
  const count = s.seasonCount || 1;
  for (let i = 1; i <= count; i++) {
    const btn = document.createElement('button');
    btn.className = 'season-tab' + (i === 1 ? ' active' : '');
    btn.textContent = 'Season ' + i;
    btn.dataset.season = i;
    btn.addEventListener('click', () => {
      tabsEl.querySelectorAll('.season-tab').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      renderEpisodes(title, i);
    });
    tabsEl.appendChild(btn);
  }

  renderEpisodes(title, 1);

  document.getElementById('modal').classList.add('open');
  document.body.style.overflow = 'hidden';
}

function renderEpisodes(title, season) {
  const s = CUSTOM_SHOWS[title] || SHOWS[title];
  if (!s) return;
  const eps = (s.episodes && s.episodes[season]) || [];
  if (!eps.length) {
    document.getElementById('epList').innerHTML =
      '<div style="padding:20px;color:#555;font-size:13px">No episodes added yet.</div>';
    return;
  }
  const key = title.toLowerCase();
  const media = titleMedia[key];
  const epVids = media && media.episodeVideos;
  const epImgs = media && media.episodeImages;
  const safeTitle = title.replace(/\\/g,'\\\\').replace(/'/g,"\\'");
  document.getElementById('epList').innerHTML = eps.map(ep => {
    const epKey = 'e' + ep.n;
    const hasVid = !!(epVids && epVids[epKey]);
    const imgUrl = epImgs && epImgs[epKey];
    const thumbStyle = imgUrl
      ? `background-image:url('${imgUrl}');background-size:cover;background-position:center;`
      : '';
    return `
    <div class="ep-item" onclick="playEpisode('${safeTitle}','${epKey}')">
      <div class="ep-num">${ep.n}</div>
      <div class="ep-thumb" style="${thumbStyle}">
        ${imgUrl ? '' : `<span>${s.art || '🎬'}</span>`}
        <div class="ep-play">▶</div>
      </div>
      <div class="ep-info">
        <div class="ep-header">
          <span class="ep-name">${ep.t}</span>
          <span class="ep-dur">${ep.d}${hasVid ? ' <span class="ep-vid-dot">▶</span>' : ''}</span>
        </div>
        <div class="ep-desc">${ep.desc || ''}</div>
      </div>
    </div>`;
  }).join('');
}

function closeModal() {
  document.getElementById('modal').classList.remove('open');
  document.body.style.overflow = '';
}

function closeOnBg(e) {
  if (e.target === document.getElementById('modal')) closeModal();
}

document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    closeModal();
    closeAdmin();
  }
});
