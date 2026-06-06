// Nav scroll
window.addEventListener('scroll', () => {
  document.getElementById('navbar').classList.toggle('scrolled', window.scrollY > 50);
});

// Search toggle + /admin trigger
function toggleSearch() {
  const bar = document.getElementById('searchBar');
  bar.classList.toggle('open');
  if (bar.classList.contains('open')) document.getElementById('searchInput').focus();
}

document.getElementById('searchInput').addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    document.getElementById('searchBar').classList.remove('open');
    e.target.value = '';
  }
});

// Triple-click logo → admin PIN
let _logoClicks = 0, _logoTimer = null;
document.getElementById('logoBtn').addEventListener('click', e => {
  e.preventDefault();
  _logoClicks++;
  clearTimeout(_logoTimer);
  _logoTimer = setTimeout(() => { _logoClicks = 0; }, 700);
  if (_logoClicks >= 3) {
    _logoClicks = 0;
    openPinModal();
  }
});

// Keyboard shortcut: type the PIN digits on the PIN modal
document.addEventListener('keydown', e => {
  if (document.getElementById('pinOverlay').classList.contains('open')) {
    if (e.key >= '0' && e.key <= '9') pinKey(e.key);
    else if (e.key === 'Backspace') pinBack();
    else if (e.key === 'Escape') closePinModal();
  }
});

// Row scroll
function scrollRow(btn, dir) {
  const cards = btn.closest('.cards-wrap').querySelector('.cards');
  cards.scrollBy({ left: dir * 620, behavior: 'smooth' });
}

// My List state
const myList = new Set(['Dark Horizon', 'Echo Chamber', 'Glass City', 'Void Walker']);

// ─── CARD HOVER TOOLTIP ────────────────────────────────────────────────────
const tooltip = document.getElementById('card-tooltip');
let tooltipTimer = null;
let hideTimer = null;

function positionTooltip(card) {
  const rect = card.getBoundingClientRect();
  const scale = 1.42;
  const scaledW = rect.width * scale;
  const scaledH = rect.height * scale;
  const extraX = (scaledW - rect.width) / 2;
  const extraY = (scaledH - rect.height) / 2;

  let left = rect.left - extraX;
  const top = rect.top + scaledH - extraY + window.scrollY + 4;

  // Clamp horizontally
  const tooltipW = scaledW;
  if (left + tooltipW > window.innerWidth - 10) left = window.innerWidth - tooltipW - 10;
  if (left < 10) left = 10;

  tooltip.style.width = tooltipW + 'px';
  tooltip.style.left = left + 'px';
  tooltip.style.top = top + 'px';
}

function attachCardHover(card) {
  card.addEventListener('mouseenter', () => {
    clearTimeout(hideTimer);
    tooltipTimer = setTimeout(() => showTooltip(card), 350);
  });
  card.addEventListener('mouseleave', () => {
    clearTimeout(tooltipTimer);
    hideTimer = setTimeout(hideTooltip, 180);
  });
}

function showTooltip(card) {
  const title = card.dataset.title;
  const s = title && (CUSTOM_SHOWS[title] || SHOWS[title]);
  if (!s) return;
  const inList = myList.has(title);

  tooltip.innerHTML = `
    <div class="tt-btns">
      <button class="tt-circ tt-play" onclick="openModal('${title}')">▶</button>
      <button class="tt-circ tt-add ${inList ? 'in-list' : ''}" onclick="toggleMyList(this,'${title}')">${inList ? '✓' : '+'}</button>
      <button class="tt-circ">👍</button>
      <button class="tt-circ tt-right" onclick="openModal('${title}')">⌄</button>
    </div>
    <div class="tt-meta">
      <span class="tt-match">${s.match} Match</span>
      <span class="tt-age">${s.age}</span>
      <span>${s.seasons || s.year}</span>
    </div>
    <div class="tt-tags">${(s.genres||'').split(',').filter(g=>g.trim()).map(g => `<span>${g.trim()}</span>`).join('')}</div>
  `;

  positionTooltip(card);
  tooltip.classList.add('visible');
}

function hideTooltip() {
  tooltip.classList.remove('visible');
}

document.querySelectorAll('.card[data-title]').forEach(card => {
  card.addEventListener('mouseenter', () => {
    clearTimeout(hideTimer);
    tooltipTimer = setTimeout(() => showTooltip(card), 350);
  });
  card.addEventListener('mouseleave', () => {
    clearTimeout(tooltipTimer);
    hideTimer = setTimeout(hideTooltip, 180);
  });
});

tooltip.addEventListener('mouseenter', () => clearTimeout(hideTimer));
tooltip.addEventListener('mouseleave', () => {
  hideTimer = setTimeout(hideTooltip, 180);
});

// Toggle My List
function toggleMyList(btn, title) {
  if (myList.has(title)) {
    myList.delete(title);
    btn.textContent = '+';
    btn.classList.remove('in-list');
  } else {
    myList.add(title);
    btn.textContent = '✓';
    btn.classList.add('in-list');
  }
  updateMyListRow();
}

// Load persisted custom shows from IndexedDB
dbInit();

function updateMyListRow() {
  const container = document.getElementById('myListCards');
  if (!container) return;
  const gradMap = {
    'Dark Horizon':'g1','Nexus Protocol':'g3','Crimson Isle':'g5',
    'Echo Chamber':'g8','Storm Protocol':'g11','Void Walker':'g13',
    'Glass City':'g16','Ember Falls':'g20'
  };
  container.innerHTML = [...myList].map(title => {
    const g = gradMap[title] || 'g1';
    return `<div class="card" data-title="${title}">
      <div class="card-thumb ${g}">
        <div class="n-badge">N</div>
        <div class="card-label">${title}</div>
      </div>
    </div>`;
  }).join('');
  // Re-attach hover listeners for newly created cards
  container.querySelectorAll('.card[data-title]').forEach(card => {
    card.addEventListener('mouseenter', () => {
      clearTimeout(hideTimer);
      tooltipTimer = setTimeout(() => showTooltip(card), 350);
    });
    card.addEventListener('mouseleave', () => {
      clearTimeout(tooltipTimer);
      hideTimer = setTimeout(hideTooltip, 180);
    });
  });
}
