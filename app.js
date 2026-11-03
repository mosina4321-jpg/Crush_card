/* ==========================================================================
   app.js — logica completa di Crush Cards

   Va caricato DOPO script.js, che contiene solo i DATI e lo STATO:
   userState, collectionsDatabase, packsDatabase, cardsDatabase,
   pendingPurchaseCardId, pendingPurchasePackId, activePackCards,
   currentCollectionId, albumState, currentQuizCard, loadProgress().
   ========================================================================== */

/* ---------- COSTANTI ---------- */
const RARITY_LABEL = { COMUNE: 'Comune', RARA: 'Rara', LEGGENDARIA: 'Leggendaria' };
const RARITY_ORDER = { LEGGENDARIA: 0, RARA: 1, COMUNE: 2 };
const PACK_ODDS = { COMUNE: 70, RARA: 25, LEGGENDARIA: 5 };
const FREE_CARD_ODDS = { COMUNE: 80, RARA: 15, LEGGENDARIA: 5 };
const FREE_CARD_COOLDOWN = 3 * 24 * 60 * 60 * 1000; // 3 giorni
const QUIZ_REWARD = 30;
const STREAK_STEP = 5;          // crediti in più per ogni giorno di streak...
const STREAK_MAX_STEPS = 10;    // ...fino a questo giorno (poi resta fisso: 10 x 5 = 50)
const STREAK_WEEKLY_BONUS = 50; // bonus ogni 7 giorni consecutivi
const QUIZ_CATEGORIES = ['Cantante', 'Attrice', 'Pop Star', 'Attrice GL']; // solo persone, niente "Met Gala" o "Ship"
const AVATAR_SIZE = 256;

const WHEEL_PRIZES = [
  { label: '10', credits: 10, type: 'credits', color: '#9b59ff', weight: 35 },
  { label: '15', credits: 15, type: 'credits', color: '#3da5ff', weight: 25 },
  { label: '20', credits: 20, type: 'credits', color: '#ff5fa8', weight: 20 },
  { label: '25', credits: 25, type: 'credits', color: '#2ecc71', weight: 12 },
  { label: '50', credits: 50, type: 'credits', color: '#e74c3c', weight: 6 },
  { label: 'FREE CARD🌟', type: 'card', color: '#f1c40f', weight: 2 }
];

/* ---------- STATO LOCALE DELL'APP ---------- */
let appFreeClaimBusy = false;
let appWheelSpinning = false;
let appWheelRotation = 0;
let appLastCredits = null;
let appScratchRevealed = false;
let appStorageWarned = false;

/* Aggiunge al salvataggio i campi mancanti (utile se arrivi da una versione vecchia) */
(function migrateUserState() {
  const defaults = {
    credits: 500,
    username: 'SapphicCollector',
    unlockedCards: [],
    favoriteCardId: null,
    avatarImg: null,
    lastFreeClaim: 0,
    lastQuizPlayed: '',
    lastWheelPlayed: '',
    streakDays: 0,
    lastStreakClaimDate: '',
    quizDate: '',
    quizCardId: null,
    quizOptions: null,
    showcaseCardIds: [null, null, null],
    pageRewards: [],
    albumRewards: [],
    wishlist: []
  };
  Object.keys(defaults).forEach(key => {
    if (userState[key] === undefined) userState[key] = defaults[key];
  });
  // vecchio nome del campo (quando il gioco era il Memory)
  if (userState.lastMemoryPlayed) {
    if (!userState.lastQuizPlayed) userState.lastQuizPlayed = userState.lastMemoryPlayed;
    delete userState.lastMemoryPlayed;
  }
  if (!Array.isArray(userState.unlockedCards)) userState.unlockedCards = [];
  // niente doppioni e niente id di card che non esistono più
  userState.unlockedCards = userState.unlockedCards.filter((id, i, arr) =>
    arr.indexOf(id) === i && cardsDatabase.some(c => c.id === id)
  );

  // vetrina: 3 posti. Se arrivi dalla vecchia "crush preferita", finisce nel primo posto
  if (!Array.isArray(userState.showcaseCardIds)) userState.showcaseCardIds = [null, null, null];
  while (userState.showcaseCardIds.length < 3) userState.showcaseCardIds.push(null);
  userState.showcaseCardIds = userState.showcaseCardIds.slice(0, 3);
  if (userState.favoriteCardId && userState.showcaseCardIds.every(id => !id)) {
    userState.showcaseCardIds[0] = userState.favoriteCardId;
  }
  userState.showcaseCardIds = userState.showcaseCardIds.map(id =>
    id && userState.unlockedCards.includes(id) ? id : null
  );

  if (!Array.isArray(userState.pageRewards)) userState.pageRewards = [];
  if (!Array.isArray(userState.albumRewards)) userState.albumRewards = [];

  // lista desideri: solo card che esistono e che non hai ancora
  if (!Array.isArray(userState.wishlist)) userState.wishlist = [];
  userState.wishlist = userState.wishlist.filter((id, i, arr) =>
    arr.indexOf(id) === i && cardsDatabase.some(c => c.id === id) && !userState.unlockedCards.includes(id)
  );
})();

/* ---------- UTILITÀ ---------- */
function byId(id) { return document.getElementById(id); }
function todayKey() { return new Date().toDateString(); }
function yesterdayKey() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toDateString();
}
function randomItem(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
function isUnlocked(cardId) { return userState.unlockedCards.includes(cardId); }
function unlockCard(cardId) {
  if (isUnlocked(cardId)) return false;
  userState.unlockedCards.push(cardId);
  // se era nei desideri, ora non serve più
  userState.wishlist = userState.wishlist.filter(id => id !== cardId);
  checkPageRewards(cardsDatabase.find(c => c.id === cardId).collectionId);
  return true;
}
/* Sceglie una rarità in base ai pesi, es. { COMUNE: 70, RARA: 25, LEGGENDARIA: 5 } */
function rollRarity(odds) {
  const keys = Object.keys(odds);
  const total = keys.reduce((sum, k) => sum + odds[k], 0);
  let r = Math.random() * total;
  for (const key of keys) {
    if (r < odds[key]) return key;
    r -= odds[key];
  }
  return keys[0];
}

/* ==========================================================================
   EVENTI A TEMPO + LISTA DESIDERI
   ========================================================================== */
/* eventsDatabase sta in script.js. Se non c'è ancora, l'app funziona lo stesso (nessun evento). */
const EVENTS = (typeof eventsDatabase !== 'undefined') ? eventsDatabase : [];

function parseEventDate(str, endOfDay) {
  const [y, m, d] = String(str).split('-').map(Number);
  return endOfDay ? new Date(y, m - 1, d, 23, 59, 59, 999) : new Date(y, m - 1, d, 0, 0, 0, 0);
}
function eventStatus(ev) {
  const now = Date.now();
  if (now < parseEventDate(ev.start, false).getTime()) return 'upcoming';
  if (now > parseEventDate(ev.end, true).getTime()) return 'ended';
  return 'active';
}
function eventOfCollection(collectionId) { return EVENTS.find(e => e.collectionId === collectionId) || null; }
function eventOfCard(card) { return eventOfCollection(card.collectionId); }
function eventOfPack(pack) { return EVENTS.find(e => e.packId === pack.id) || null; }

/* una card di evento si può ottenere solo mentre l'evento è in corso */
function isObtainable(card) {
  const ev = eventOfCard(card);
  return !ev || eventStatus(ev) === 'active';
}

function formatEventLeft(ev) {
  const ms = Math.max(0, parseEventDate(ev.end, true).getTime() - Date.now());
  const days = Math.floor(ms / 86400000);
  const hours = Math.floor((ms % 86400000) / 3600000);
  const mins = Math.floor((ms % 3600000) / 60000);
  if (days >= 1) return `${days}g ${hours}h`;
  if (hours >= 1) return `${hours}h ${mins}m`;
  return `${Math.max(mins, 1)}m`;
}

/* un album di un evento concluso resta visibile solo se hai almeno una delle sue card */
function isCollectionVisible(col) {
  const ev = eventOfCollection(col.id);
  if (!ev) return true;
  const status = eventStatus(ev);
  if (status === 'active') return true;
  if (status === 'ended') return cardsDatabase.some(c => c.collectionId === col.id && isUnlocked(c.id));
  return false;
}

/* le card di eventi conclusi non fanno abbassare la percentuale di completamento */
function completionTotal() {
  return cardsDatabase.filter(c => !eventOfCard(c) || isUnlocked(c.id)).length;
}

function renderEventBanner() {
  const box = byId('event-banner');
  if (!box) return;

  const active = EVENTS.filter(e => eventStatus(e) === 'active');
  let html = active.map(ev => `
    <div class="event-banner active" onclick="openEventShop()">
      <div class="event-banner-icon"><i class="fa-solid fa-hourglass-half"></i></div>
      <div class="event-banner-text">
        <strong>${ev.title}</strong>
        <span>Evento a tempo · finisce tra ${formatEventLeft(ev)}</span>
      </div>
      <i class="fa-solid fa-chevron-right"></i>
    </div>
  `).join('');

  if (!active.length) {
    const soon = EVENTS
      .filter(e => eventStatus(e) === 'upcoming')
      .map(e => ({ ev: e, days: Math.ceil((parseEventDate(e.start, false).getTime() - Date.now()) / 86400000) }))
      .filter(x => x.days <= 7)
      .sort((a, b) => a.days - b.days)[0];
    if (soon) {
      html = `
        <div class="event-banner soon">
          <div class="event-banner-icon"><i class="fa-solid fa-gift"></i></div>
          <div class="event-banner-text">
            <strong>${soon.ev.title}</strong>
            <span>In arrivo ${soon.days <= 1 ? 'domani' : `tra ${soon.days} giorni`}!</span>
          </div>
        </div>
      `;
    }
  }

  box.innerHTML = html;
  box.classList.toggle('hidden', !html);
}

function openEventShop() {
  const navBtn = document.querySelector(".nav-item[onclick*='sec-shop']");
  switchTab('sec-shop', navBtn);
  switchShopTab('packs');
}

/* ---------- LISTA DESIDERI ---------- */
function isWished(cardId) { return userState.wishlist.includes(cardId); }

function toggleWishlist(cardId) {
  const card = cardsDatabase.find(c => c.id === cardId);
  if (!card || isUnlocked(cardId) || !isObtainable(card)) return;

  const index = userState.wishlist.indexOf(cardId);
  if (index >= 0) userState.wishlist.splice(index, 1);
  else userState.wishlist.push(cardId);
  saveProgress();

  if (currentCollectionId) renderAlbum();
  renderSinglesShop();
  if (index < 0) missionEvent('wish');
}

function refreshAllViews() {
  renderCollections();
  renderShop();
  if (currentCollectionId) renderAlbum();
  updateUI();
}

/* ---------- SALVATAGGIO ---------- */
function saveProgress() {
  try {
    localStorage.setItem('crush_cards_userstate', JSON.stringify(userState));
  } catch (err) {
    console.warn('Salvataggio non riuscito:', err);
    if (!appStorageWarned) {
      appStorageWarned = true;
      showPopup('Salvataggio non riuscito ⚠️', 'Lo spazio del browser è pieno: i tuoi progressi potrebbero non essere salvati.', 'fa-solid fa-triangle-exclamation');
    }
  }
}

function resetGameProgress() {
  if (confirm("Sei sicura di voler resettare tutti i tuoi progressi? L'operazione non può essere annullata.")) {
    localStorage.removeItem('crush_cards_userstate');
    location.reload();
  }
}

/* ---------- POP-UP ---------- */
function showPopup(title, message, iconClass = 'fa-solid fa-wand-magic-sparkles') {
  const titleEl = byId('custom-alert-title');
  const msgEl = byId('custom-alert-message');
  const iconEl = byId('custom-alert-icon');
  if (titleEl) titleEl.innerText = title;
  if (msgEl) msgEl.innerText = message;
  if (iconEl) iconEl.innerHTML = `<i class="${iconClass}"></i>`;
  byId('custom-alert-modal').classList.remove('hidden');
}

function closeCustomAlert() { byId('custom-alert-modal').classList.add('hidden'); }

function closeModal(modalId) {
  const modal = byId(modalId);
  if (modal) modal.classList.add('hidden');

  if (modalId === 'reward-modal') {
    const flipper = byId('card-flipper');
    if (flipper) flipper.classList.remove('flipped');
    refreshAllViews();
    updateTimer();
  }
}

/* ---------- NAVIGAZIONE ---------- */
function switchTab(screenId, element) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(btn => btn.classList.remove('active'));

  byId(screenId).classList.add('active');
  if (element) element.classList.add('active');
  window.scrollTo(0, 0);

  if (screenId === 'sec-album') renderCollections();
  if (screenId === 'sec-shop') renderShop();
  if (screenId === 'sec-profile') updateUI();
  if (screenId === 'sec-shop') {
    userState.offerSeen = todayKey();
    saveProgress();
    renderDailyOffer();
    updateReadyDots();
  }
}

/* ---------- CARD ---------- */
function createCardHTML(card) {
  const eventTag = eventOfCard(card) ? '<span class="card-event-tag"><i class="fa-solid fa-star"></i></span>' : '';
  return `
    <div class="collectible-card ${card.rarity}" style="background-image: url('${card.img}')">
      ${eventTag}
      <div class="card-info-overlay">
        <div class="card-title-name">${card.name}</div>
        <div class="card-subtitle">${card.category}</div>
      </div>
    </div>
  `;
}

function createLockedCardHTML(card, label) {
  return `
    <div class="collectible-card locked ${card.rarity}">
      <div class="lock-circle"><i class="fa-solid fa-lock"></i></div>
      <div class="locked-name">${label}</div>
    </div>
  `;
}

/* ==========================================================================
   ALBUM
   ========================================================================== */
function renderCollections() {
  const container = byId('collections-list');
  if (!container) return;

  container.innerHTML = collectionsDatabase.filter(isCollectionVisible).map((col, i) => {
    const colCards = cardsDatabase.filter(c => c.collectionId === col.id);
    const unlocked = colCards.filter(c => isUnlocked(c.id)).length;
    const total = colCards.length;
    const percent = total > 0 ? Math.round((unlocked / total) * 100) : 0;
    const complete = total > 0 && unlocked === total;
    const hue = (i * 47 + 320) % 360; // colore di riserva se la foto non carica

    const ev = eventOfCollection(col.id);
    const ribbon = ev
      ? `<span class="album-book-ribbon ${eventStatus(ev)}">${eventStatus(ev) === 'active' ? '⏳ ' + formatEventLeft(ev) : 'ARCHIVIO'}</span>`
      : '';

    return `
      <button class="album-book ${complete ? 'complete' : ''} ${ev ? 'event' : ''}" style="--i:${i}; --hue:${hue}" onclick="openCollection('${col.id}')">
        <span class="album-book-pages"></span>
        <span class="album-book-cover" style="background-image: url('${col.coverImg}')">
          <span class="album-book-spine"></span>
          ${ribbon}
          <span class="album-book-badge">${complete ? '<i class="fa-solid fa-crown"></i>' : percent + '%'}</span>
          <span class="album-book-info">
            <span class="album-book-title">${col.title}</span>
            <span class="album-book-count">${unlocked} / ${total} card</span>
            <span class="col-progress-bar"><span class="col-progress-fill" style="width: ${percent}%"></span></span>
          </span>
        </span>
      </button>
    `;
  }).join('');
}

function openCollection(collectionId) {
  currentCollectionId = collectionId;
  albumState.currentPage = 1;
  byId('album-collections-view').classList.add('hidden');
  byId('album-cards-view').classList.remove('hidden');
  renderAlbum();
  missionEvent('album');
}

function closeCollection() {
  currentCollectionId = null;
  byId('album-cards-view').classList.add('hidden');
  byId('album-collections-view').classList.remove('hidden');
  renderCollections();
}

function renderAlbum() {
  if (!currentCollectionId) return;
  const grid = byId('album-grid');
  if (!grid) return;

  const activeCollection = collectionsDatabase.find(c => c.id === currentCollectionId);
  const cards = cardsDatabase.filter(c => c.collectionId === currentCollectionId);

  const totalPages = Math.max(1, Math.ceil(cards.length / albumState.cardsPerPage));
  if (albumState.currentPage > totalPages) albumState.currentPage = totalPages;

  const titleEl = byId('album-category-title');
  const footerEl = byId('page-number-footer');
  if (titleEl && activeCollection) titleEl.innerText = activeCollection.title;
  if (footerEl) footerEl.innerText = `Pagina ${albumState.currentPage} di ${totalPages}`;

  const start = (albumState.currentPage - 1) * albumState.cardsPerPage;
  const pageCards = cards.slice(start, start + albumState.cardsPerPage);

  grid.innerHTML = pageCards.map(card => {
    if (isUnlocked(card.id)) {
      return `<div onclick="openZoomCard(${card.id})">${createCardHTML(card)}</div>`;
    }
    if (!isObtainable(card)) {
      return `<div class="wish-slot gone">${createLockedCardHTML(card, card.name)}</div>`;
    }
    const wished = isWished(card.id);
    return `
      <div class="wish-slot ${wished ? 'wished' : ''}" onclick="toggleWishlist(${card.id})">
        ${createLockedCardHTML(card, card.name)}
        <span class="wish-heart"><i class="${wished ? 'fa-solid' : 'fa-regular'} fa-heart"></i></span>
      </div>
    `;
  }).join('');
}

function animatePageTurn(callback) {
  const grid = byId('album-grid');
  if (!grid) { callback(); return; }
  grid.classList.add('turn-page');
  setTimeout(() => {
    callback();
    grid.classList.remove('turn-page');
  }, 250);
}

function nextPage() {
  if (!currentCollectionId) return;
  const cards = cardsDatabase.filter(c => c.collectionId === currentCollectionId);
  const totalPages = Math.ceil(cards.length / albumState.cardsPerPage);
  if (albumState.currentPage < totalPages) {
    animatePageTurn(() => { albumState.currentPage++; renderAlbum(); });
  }
}

function prevPage() {
  if (albumState.currentPage > 1) {
    animatePageTurn(() => { albumState.currentPage--; renderAlbum(); });
  }
}

/* Retro della card: colore della rarità + nome, categoria, collezione e numero */
const RARITY_ICON = { COMUNE: 'fa-star', RARA: 'fa-gem', LEGGENDARIA: 'fa-crown' };

function createCardBackHTML(card) {
  const collection = collectionsDatabase.find(c => c.id === card.collectionId);
  const inCollection = cardsDatabase.filter(c => c.collectionId === card.collectionId);
  const number = inCollection.findIndex(c => c.id === card.id) + 1;
  const len = card.name.length;
  const nameSize = len > 12 ? 17 : (len > 8 ? 21 : 26); // i nomi lunghi si rimpiccioliscono

  return `
    <div class="zoom-card-face zoom-card-back ${card.rarity}">
      <div class="back-frame">
        <div class="back-brand">CRUSH CARDS</div>
        <div class="back-emblem"><i class="fa-solid ${RARITY_ICON[card.rarity] || 'fa-star'}"></i></div>
        <div class="back-name" style="font-size: ${nameSize}px">${card.name}</div>
        <div class="back-category">${card.category}</div>
        <div class="back-divider"></div>
        <div class="back-rarity">${RARITY_LABEL[card.rarity] || card.rarity}</div>
        ${eventOfCard(card) ? '<div class="back-event"><i class="fa-solid fa-star"></i> EDIZIONE LIMITATA</div>' : ''}
        <div class="back-collection">${collection ? collection.title : ''}</div>
        <div class="back-number">N° ${String(number).padStart(2, '0')} / ${inCollection.length}</div>
      </div>
    </div>
  `;
}

/* ---------- ZOOM CARD (flip + inclinazione 3D) ---------- */
function openZoomCard(cardId) {
  const card = cardsDatabase.find(c => c.id === cardId);
  const container = byId('zoom-card-inner');
  if (!card || !container) return;

  container.classList.remove('flipped');
  container.style.transform = '';
  container.innerHTML = `
    <div class="zoom-card-face zoom-card-front">${createCardHTML(card)}</div>
    ${createCardBackHTML(card)}
  `;

  byId('zoom-modal').classList.remove('hidden');
  initTiltEffect();
}

function toggleCardFlip() {
  const container = byId('zoom-card-inner');
  if (!container) return;
  // l'inclinazione è impostata come stile inline: la tolgo, altrimenti blocca il flip
  container.style.transform = '';
  container.classList.toggle('flipped');
}

function initTiltEffect() {
  const container = byId('zoom-card-inner');
  const wrapper = document.querySelector('.tilt-card-container');
  if (!container || !wrapper) return;

  function handleMove(e) {
    if (container.classList.contains('flipped')) return;
    const point = e.touches ? e.touches[0] : e;
    const rect = wrapper.getBoundingClientRect();
    const x = point.clientX - rect.left;
    const y = point.clientY - rect.top;
    const rotateX = -((y - rect.height / 2) / (rect.height / 2)) * 18;
    const rotateY = ((x - rect.width / 2) / (rect.width / 2)) * 18;
    container.style.transition = 'transform 0.1s ease-out';
    container.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
  }

  function resetTilt() {
    if (container.classList.contains('flipped')) return;
    container.style.transition = 'transform 0.5s ease';
    container.style.transform = '';
  }

  wrapper.onmousemove = handleMove;
  wrapper.onmouseleave = resetTilt;
  wrapper.ontouchmove = handleMove;
  wrapper.ontouchend = resetTilt;
}

function closeZoomModal() { byId('zoom-modal').classList.add('hidden'); }

/* ==========================================================================
   SHOP: BUSTE + CARD SINGOLE
   ========================================================================== */
function switchShopTab(tab) {
  const packsBtn = byId('tab-btn-packs');
  const singlesBtn = byId('tab-btn-singles');
  const showPacks = tab === 'packs';

  packsBtn.classList.toggle('active', showPacks);
  singlesBtn.classList.toggle('active', !showPacks);
  byId('shop-packs-view').classList.toggle('hidden', !showPacks);
  byId('shop-singles-view').classList.toggle('hidden', showPacks);
}

function renderShop() {
  renderPacks();
  renderSinglesShop();
}

function renderPacks() {
  const container = byId('packs-grid');
  if (!container) return;

  // le buste di un evento si vedono solo mentre l'evento è in corso, e vanno per prime
  const visible = packsDatabase
    .filter(pack => { const ev = eventOfPack(pack); return !ev || eventStatus(ev) === 'active'; })
    .sort((a, b) => (eventOfPack(b) ? 1 : 0) - (eventOfPack(a) ? 1 : 0));

  container.innerHTML = visible.map(pack => {
    const ev = eventOfPack(pack);
    const canAfford = userState.credits >= pack.price;
    const left = lockedCardsOfPack(pack).length;
    const done = left === 0;
    const countLabel = done ? 'Completa ✓' : (left < pack.cardCount ? `${left} card` : `${pack.cardCount} card`);
    return `
      <div class="pack-card ${done ? 'pack-done' : ''} ${ev ? 'pack-event' : ''}" onclick="promptBuyPack('${pack.id}')">
        <div class="pack-art" style="--pack-cover: url('${pack.cover}')">
          ${ev ? `<span class="pack-event-tag">⏳ ${formatEventLeft(ev)}</span>` : ''}
          <span class="pack-count">${countLabel}</span>
        </div>
        <h4>${pack.name}</h4>
        <div class="pack-price ${canAfford && !done ? '' : 'cant-afford'}">
          ${done ? 'Collezione completata' : `<i class="fa-solid fa-coins"></i> ${pack.price}`}
        </div>
      </div>
    `;
  }).join('');
}

/*
  Divide le card di una collezione in gruppi (una riga ciascuno):
  - categorie con pochi personaggi e molte card ciascuno (Jisoo, Jennie...) → una riga per personaggio;
  - categorie con 1-2 card a testa (attrici, coppie GL...) → una sola riga per categoria.
*/
function buildShopGroups(colCards) {
  const byCategory = {};
  colCards.forEach(card => {
    (byCategory[card.category] = byCategory[card.category] || []).push(card);
  });

  const groups = [];
  Object.keys(byCategory).forEach(category => {
    const cards = byCategory[category];
    const names = [...new Set(cards.map(c => c.name))];
    if (cards.length / names.length >= 3) {
      names.forEach(name => groups.push({ label: name, cards: cards.filter(c => c.name === name) }));
    } else {
      groups.push({ label: category, cards: cards });
    }
  });
  return groups;
}

function createShopItemHTML(card) {
  if (isUnlocked(card.id)) {
    return `
      <div class="shop-category-card-item" onclick="openZoomCard(${card.id})">
        <div class="shop-card-preview-box">
          ${createCardHTML(card)}
          <div class="card-badge-overlay unlocked"><i class="fa-solid fa-check"></i></div>
        </div>
        <div class="shop-cat-info">
          <h4>${card.name}</h4>
          <p class="owned">Posseduta</p>
        </div>
      </div>
    `;
  }

  const canAfford = userState.credits >= card.price;
  const wished = isWished(card.id);
  return `
    <div class="shop-category-card-item ${wished ? 'wished' : ''}" onclick="promptBuyCard(${card.id})">
      <div class="shop-card-preview-box">
        ${createLockedCardHTML(card, RARITY_LABEL[card.rarity] || card.rarity)}
        <button class="wish-btn ${wished ? 'on' : ''}" aria-label="Aggiungi ai desideri"
                onclick="event.stopPropagation(); toggleWishlist(${card.id})">
          <i class="${wished ? 'fa-solid' : 'fa-regular'} fa-heart"></i>
        </button>
        <div class="card-badge-overlay price ${canAfford ? '' : 'cant-afford'}">
          <i class="fa-solid fa-coins"></i> ${card.price}
        </div>
      </div>
      <div class="shop-cat-info">
        <h4>${card.name}</h4>
        <p class="${card.rarity}">${RARITY_LABEL[card.rarity] || card.rarity}</p>
      </div>
    </div>
  `;
}

let appShopFilter = 'all'; // 'all' = tutte le card · 'wish' = solo i desideri

function setShopFilter(filter) {
  appShopFilter = filter;
  renderSinglesShop();
}

function renderShopFilter() {
  const box = byId('shop-filter');
  if (!box) return;
  const wishCount = userState.wishlist.filter(id => {
    const card = cardsDatabase.find(c => c.id === id);
    return card && isObtainable(card);
  }).length;
  box.innerHTML = `
    <button class="shop-filter-btn ${appShopFilter === 'all' ? 'active' : ''}" onclick="setShopFilter('all')">Tutte</button>
    <button class="shop-filter-btn ${appShopFilter === 'wish' ? 'active' : ''}" onclick="setShopFilter('wish')">
      <i class="fa-solid fa-heart"></i> Desideri (${wishCount})
    </button>
  `;
}

function renderSinglesShop() {
  const container = byId('shop-categories-list');
  if (!container) return;
  renderShopFilter();

  // ricordo lo scroll, così dopo un acquisto la pagina non "salta"
  const shopScreen = byId('sec-shop');
  const shopVisible = shopScreen && shopScreen.classList.contains('active');
  const prevScrollY = window.scrollY;
  const prevRowScroll = {};
  container.querySelectorAll('.horizontal-shop-row').forEach(row => {
    prevRowScroll[row.dataset.key] = row.scrollLeft;
  });

  let html = '';

  if (appShopFilter === 'wish') {
    const wished = userState.wishlist
      .map(id => cardsDatabase.find(c => c.id === id))
      .filter(c => c && !isUnlocked(c.id) && isObtainable(c))
      .sort((a, b) => RARITY_ORDER[a.rarity] - RARITY_ORDER[b.rarity] || a.id - b.id);
    html = wished.length
      ? `<div class="shop-wish-grid">${wished.map(createShopItemHTML).join('')}</div>`
      : '<p class="shop-empty">Nessun desiderio ancora. Tocca il cuore sulle card che ti mancano, nell\'album o qui nello shop!</p>';
  } else {
    collectionsDatabase.forEach(col => {
      const ev = eventOfCollection(col.id);
      if (ev && eventStatus(ev) !== 'active') return; // gli eventi conclusi non si comprano più

      const allColCards = cardsDatabase.filter(
  c => c.collectionId === col.id
);

const colOwned = allColCards.filter(
  c => isUnlocked(c.id)
).length;

const colCards = allColCards.filter(
  c => !isUnlocked(c.id) && isObtainable(c)
);

if (colCards.length === 0) return;

      html += `
        <div class="shop-album-group">
          <h3 class="shop-album-title">
            <span>${col.title}${ev ? ` <em class="event-chip">⏳ ${formatEventLeft(ev)}</em>` : ''}</span>
            <small>${colOwned} / ${allColCards.length}</small>
          </h3>
      `;

      buildShopGroups(colCards).forEach((group, index) => {
        const cards = group.cards.slice().sort((a, b) =>
          RARITY_ORDER[a.rarity] - RARITY_ORDER[b.rarity] || a.id - b.id
        );

        html += `
          <div class="shop-subgroup">
            <div class="shop-subgroup-head">
              <span>${group.label}</span>
              <span class="shop-subgroup-count">${cards.length} da ottenere</span>
            </div>
            <div class="horizontal-shop-row" data-key="${col.id}-${index}">
              ${cards.map(createShopItemHTML).join('')}
            </div>
          </div>
        `;
      });

      html += '</div>';
    });
  }

  container.innerHTML = html ||   '<p class="shop-empty">Hai già tutte le card attualmente acquistabili! 💖</p>';

  container.querySelectorAll('.horizontal-shop-row').forEach(row => {
    if (prevRowScroll[row.dataset.key]) row.scrollLeft = prevRowScroll[row.dataset.key];
  });
  if (shopVisible) window.scrollTo(0, prevScrollY);
}

/* ---------- ACQUISTI ---------- */
function openConfirmBuy(title, message) {
  byId('confirm-buy-title').innerText = title;
  byId('confirm-buy-message').innerText = message;
  byId('confirm-buy-modal').classList.remove('hidden');
}

function promptBuyPack(packId) {
  const pack = packsDatabase.find(p => p.id === packId);
  if (!pack) return;

  const packEvent = eventOfPack(pack);
  if (packEvent && eventStatus(packEvent) !== 'active') {
    showPopup('Evento concluso ⌛', 'Questa busta non è più disponibile: aspetta il prossimo evento!', 'fa-solid fa-hourglass-end');
    renderPacks();
    return;
  }

  const left = lockedCardsOfPack(pack).length;
  if (left === 0) {
    showPopup('Collezione completa! 👑', 'Hai già tutte le card di questa collezione: non ci sono più card da scoprire in questa busta.', 'fa-solid fa-crown');
    return;
  }
  if (userState.credits < pack.price) {
    showPopup('Crediti insufficienti! 💸', 'Gioca a Trova la Coppia, gira la ruota o riscatta la streak per ottenere altri crediti!', 'fa-solid fa-coins');
    return;
  }
  pendingPurchaseCardId = null;
  pendingPurchasePackId = packId;
  const price = packPrice(pack);
  const msg = left < pack.cardCount
    ? `Ti mancano solo ${left} card di questa collezione: la busta ne conterrà ${left} e pagherai ${price} crediti.`
    : `Vuoi acquistare questa busta con ${pack.cardCount} card per ${price} crediti? Dentro ci saranno solo card che non hai ancora.`;
  openConfirmBuy(`Acquista ${pack.name}`, msg);
}

function promptBuyCard(cardId) {
  const card = cardsDatabase.find(c => c.id === cardId);
  if (!card || isUnlocked(cardId)) return;

  if (!isObtainable(card)) {
    showPopup('Evento concluso ⌛', 'Questa card era disponibile solo per un periodo limitato.', 'fa-solid fa-hourglass-end');
    renderSinglesShop();
    return;
  }
  if (userState.credits < card.price) {
    showPopup('Crediti insufficienti! 💸', 'Ottieni altri crediti con i mini-giochi, la ruota o la streak!', 'fa-solid fa-coins');
    return;
  }
  pendingPurchasePackId = null;
  pendingPurchaseCardId = cardId;
  openConfirmBuy(`Acquista ${card.name}`, `Vuoi acquistare questa card ${RARITY_LABEL[card.rarity] || card.rarity} per ${card.price} crediti?`);
}

function cancelBuyCard() {
  offerPurchasePending = false;
  pendingPurchaseCardId = null;
  pendingPurchasePackId = null;
  byId('confirm-buy-modal').classList.add('hidden');
}

function confirmBuyCard() {
  const packId = pendingPurchasePackId;
  const cardId = pendingPurchaseCardId;
  const discounted = offerPurchasePending;
  cancelBuyCard();

  if (packId) {
    const pack = packsDatabase.find(p => p.id === packId);
    if (!pack || lockedCardsOfPack(pack).length === 0) return;
    const price = packPrice(pack);
    if (userState.credits < price) return;
    userState.credits -= price;
    saveProgress();
    updateUI();
    openPackSequence(pack, price);
    return;
  }

  const card = cardsDatabase.find(c => c.id === cardId);
  if (!card || isUnlocked(card.id) || !isObtainable(card)) return;
  if (discounted && (!offerAvailable() || ensureDailyOffer().cardId !== card.id)) return;
  const price = discounted ? offerPrice(card) : card.price;
  if (userState.credits < price) return;

  userState.credits -= price;
  unlockCard(card.id);
  if (discounted) userState.dailyOffer.bought = true;
  saveProgress();
  showReward(card);
  missionEvent('buy');
  refreshAllViews();
}

/* ---------- APERTURA BUSTE ---------- */
// card della collezione che l'utente NON ha ancora (le buste non danno mai doppioni)
// se mancano meno card di quelle della busta, il prezzo scende in proporzione
function packPrice(pack) {
  const left = lockedCardsOfPack(pack).length;
  if (left >= pack.cardCount) return pack.price;
  return Math.max(1, Math.round(pack.price * left / pack.cardCount));
}

function lockedCardsOfPack(pack) {
  // una busta può pescare da una collezione (collectionId) o da più collezioni (collectionIds)
  const ids = pack.collectionIds || [pack.collectionId];
  return cardsDatabase.filter(c => ids.includes(c.collectionId) && !isUnlocked(c.id) && isObtainable(c));
}

function pickPackCards(pack) {
  const pool = lockedCardsOfPack(pack);
  const picked = [];

  while (picked.length < pack.cardCount && picked.length < pool.length) {
    const rarity = rollRarity(PACK_ODDS);
    let candidates = pool.filter(c => c.rarity === rarity && !picked.includes(c));
    if (candidates.length === 0) candidates = pool.filter(c => !picked.includes(c));
    picked.push(randomItem(candidates));
  }
  return picked;
}

function openPackSequence(pack, paid) {
  const cards = pickPackCards(pack);
  if (cards.length === 0) {
    userState.credits += (paid || pack.price); // rimborso, non dovrebbe mai succedere
    saveProgress();
    updateUI();
    showPopup('Errore busta ⚠️', 'Nessuna card trovata in questa collezione: ti ho rimborsato i crediti.', 'fa-solid fa-triangle-exclamation');
    return;
  }

  // segno quali sono nuove PRIMA di sbloccarle, poi le salvo subito
  activePackCards = cards.map(card => ({ card: card, isNew: !isUnlocked(card.id) }));
  cards.forEach(card => unlockCard(card.id));
  saveProgress();

  const packEl = byId('pack-3d-element');
  packEl.style.setProperty('--pack-cover', `url('${pack.cover}')`);
  byId('pack-modal-title').innerText = pack.name;
  packEl.classList.remove('hidden');
  byId('pack-revealed-cards').classList.add('hidden');
  byId('pack-revealed-cards').innerHTML = '';
  byId('btn-collect-pack').classList.add('hidden');
  byId('pack-opening-modal').classList.remove('hidden');
  missionEvent('pack');
}

function unpackSequence() {
  byId('pack-3d-element').classList.add('hidden');
  const container = byId('pack-revealed-cards');

  container.innerHTML = activePackCards.map((entry, i) => `
    <div class="pack-reveal-item" style="--i: ${i}">
      <div class="pack-card-wrap">${createCardHTML(entry.card)}</div>
      <span class="pack-tag ${entry.isNew ? 'new' : 'dupe'}">${entry.isNew ? '✨ NUOVA' : 'GIÀ TUA'}</span>
    </div>
  `).join('');

  container.classList.remove('hidden');
  byId('btn-collect-pack').classList.remove('hidden');
  if (hasLegendary(activePackCards.map(entry => entry.card))) legendaryEffect();
}

function closePackModal() {
  byId('pack-opening-modal').classList.add('hidden');
  activePackCards = [];
  refreshAllViews();
}

/* ==========================================================================
   FREE CARD + GRATTA E VINCI
   ========================================================================== */
function formatRemaining(ms) {
  const hours = Math.floor(ms / (1000 * 60 * 60));
  const mins = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
  return `${hours}h ${mins}m`;
}

function claimFreeCardAnimation() {
  if (appFreeClaimBusy) return;

  const remaining = FREE_CARD_COOLDOWN - (Date.now() - userState.lastFreeClaim);
  if (remaining > 0) {
    showPopup('Ancora un attimo ⏳', `La tua card gratuita sarà pronta tra ${formatRemaining(remaining)}.`, 'fa-solid fa-clock');
    return;
  }

  const lockedCards = cardsDatabase.filter(c => !isUnlocked(c.id) && isObtainable(c));
  if (lockedCards.length === 0) {
    showPopup('Incredibile! 👑', 'Hai già sbloccato TUTTE le card dell\'album!', 'fa-solid fa-crown');
    return;
  }

  const rarity = rollRarity(FREE_CARD_ODDS);
  let pool = lockedCards.filter(c => c.rarity === rarity);
  if (pool.length === 0) pool = lockedCards;
  const card = randomItem(pool);

  appFreeClaimBusy = true;
  unlockCard(card.id);
  userState.lastFreeClaim = Date.now();
  saveProgress();

  // la card NON viene mostrata qui: si scopre solo grattando (showReward).
  // Qui il dorso trema un attimo, poi si apre il gratta e scopri.
  const box = byId('card-flip-box');
  if (box) box.classList.add('claiming');

  setTimeout(() => {
    appFreeClaimBusy = false;
    if (box) box.classList.remove('claiming');
    showReward(card);
    updateUI();
    updateTimer();
  }, 650);
}

function showReward(card) {
  legendaryShown = false;
  byId('modal-card-front').innerHTML = createCardHTML(card);
  const closeBtn = byId('btn-close-reward');
  if (closeBtn) closeBtn.style.display = 'none';
  byId('reward-modal').classList.remove('hidden');
  setupScratchCanvas();
}

function revealScratchCard() {
  if (appScratchRevealed) return;
  appScratchRevealed = true;
  const canvas = byId('scratch-canvas');
  if (canvas) canvas.style.display = 'none';
  const closeBtn = byId('btn-close-reward');
  if (closeBtn) closeBtn.style.display = 'block';
  const front = byId('modal-card-front');
  if (!legendaryShown && front && front.querySelector('.collectible-card.LEGGENDARIA')) {
    legendaryShown = true;
    legendaryEffect();
  }
}

function setupScratchCanvas() {
  const canvas = byId('scratch-canvas');
  if (!canvas) return;

  appScratchRevealed = false;
  canvas.style.display = 'block';
  canvas.width = 200;
  canvas.height = 280;

  const ctx = canvas.getContext ? canvas.getContext('2d') : null;
  if (!ctx) { revealScratchCard(); return; }

  ctx.globalCompositeOperation = 'source-over';
  const grad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
  grad.addColorStop(0, '#D4AF37');
  grad.addColorStop(0.5, '#FFF3B0');
  grad.addColorStop(1, '#AA771C');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = '#3A2329';
  ctx.font = 'bold 16px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('✨ GRATTA QUI ✨', canvas.width / 2, canvas.height / 2);

  let scratching = false;
  let moves = 0;

  function clearedPercent() {
    const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    let cleared = 0;
    for (let i = 3; i < pixels.length; i += 4) {
      if (pixels[i] === 0) cleared++;
    }
    return (cleared / (pixels.length / 4)) * 100;
  }

  function scratch(e) {
    if (!scratching) return;
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (canvas.width / rect.width);
    const y = (e.clientY - rect.top) * (canvas.height / rect.height);

    ctx.globalCompositeOperation = 'destination-out';
    ctx.beginPath();
    ctx.arc(x, y, 22, 0, Math.PI * 2);
    ctx.fill();

    moves++;
    if (moves % 6 === 0 && clearedPercent() > 50) revealScratchCard();
  }

  canvas.onpointerdown = (e) => { scratching = true; scratch(e); };
  canvas.onpointermove = scratch;
  canvas.onpointerup = () => { scratching = false; if (clearedPercent() > 50) revealScratchCard(); };
  canvas.onpointercancel = () => { scratching = false; };
  canvas.onpointerleave = () => { scratching = false; };
}

function updateTimer() {
  renderEventBanner();
  const remaining = FREE_CARD_COOLDOWN - (Date.now() - userState.lastFreeClaim);
   const cardBackText = document.querySelector(
  '#card-flip-box .card-back-pattern span'
);

if (cardBackText) {
  cardBackText.textContent =
    remaining <= 0 ? 'TOCCA PER RISCATTARE' : 'TORNA PRESTO';
}
  const box = byId('card-flip-box');
  const countdown = byId('countdown');
  const timerText = byId('timer-text');

  if (box) box.classList.toggle('cooldown', remaining > 0 && !appFreeClaimBusy);

  if (remaining <= 0) {
    if (countdown) countdown.innerText = 'PRONTA DA RISCATTARE!';
    if (timerText) timerText.innerText = 'La tua card gratuita ti aspetta';
  } else {
    if (countdown) countdown.innerText = `${formatRemaining(remaining)} rimanenti`;
    if (timerText) timerText.innerText = 'Disponibile ogni 3 giorni';
  }
  renderDailyOffer();
  updateReadyDots();
}

/* ==========================================================================
   STREAK GIORNALIERA
   ========================================================================== */
function streakBase(day) { return Math.min(day, STREAK_MAX_STEPS) * STREAK_STEP; }
function streakReward(day) { return streakBase(day) + (day % 7 === 0 ? STREAK_WEEKLY_BONUS : 0); }

function currentStreakValue() {
  // se ieri non hai riscattato (e oggi nemmeno), la streak è persa
  const last = userState.lastStreakClaimDate;
  if (last === todayKey() || last === yesterdayKey()) return userState.streakDays;
  return 0;
}

function claimDailyStreak() {
  if (userState.lastStreakClaimDate === todayKey()) {
    showPopup('Bonus già riscosso! ✨', 'Hai già ritirato il bonus di oggi. Torna domani!', 'fa-solid fa-calendar-check');
    return;
  }

  userState.streakDays = currentStreakValue() + 1;
  userState.lastStreakClaimDate = todayKey();

  const earned = streakReward(userState.streakDays);
  userState.credits += earned;
  saveProgress();
  updateUI();

  const weekly = userState.streakDays % 7 === 0;
  const message = weekly
    ? `🎉 Settimana completata! Giorno ${userState.streakDays}: +${streakBase(userState.streakDays)} crediti più ${STREAK_WEEKLY_BONUS} di bonus!`
    : `Giorno ${userState.streakDays} della tua streak: hai vinto +${earned} crediti!`;
  showToast(
  'Streak giornaliera!',
  message,
  'fa-solid fa-fire'
);
  missionEvent('streak');
}

function updateStreakUI() {
  const btn = byId('btn-claim-streak');
  const text = byId('streak-info-text');
  const claimedToday = userState.lastStreakClaimDate === todayKey();
  const streak = currentStreakValue();
  const nextDay = streak + 1;

  if (text) {
    text.innerText = claimedToday
      ? `Giorno ${streak} consecutivo 🔥 Domani: +${streakReward(nextDay)} crediti`
      : `Giorno ${streak} consecutivo 🔥 Oggi: +${streakReward(nextDay)} crediti`;
  }
  if (btn) {
    btn.disabled = claimedToday;
    btn.innerText = claimedToday ? 'RISCOSSO OGGI ✅' : `RISCATTA GIORNO ${nextDay} 🎁`;
  }
}

/* ---------- MINIGIOCO: TROVA LA COPPIA ---------- */

const MEMORY_REWARDS = {
  6: 20,
  8: 30,
  12: 40
};

const MEMORY_BONUS = 10;

let memoryPairs = [];
let memoryFlipped = [];
let memoryLock = false;
let memoryFound = 0;
let memoryErrors = 0;
let memoryTotalPairs = 6;

function openMemoryGame() {
  if (userState.lastQuizPlayed === todayKey()) {
    showPopup(
      'Già giocata!',
      'Hai già giocato a Trova la Coppia oggi. Torna domani!',
      'fa-solid fa-heart'
    );
    return;
  }

  showMemoryDifficulty();
  byId('quiz-modal').classList.remove('hidden');
}

function showMemoryDifficulty() {
  byId('memory-difficulty-view').classList.remove('hidden');
  byId('memory-game-view').classList.add('hidden');
  byId('memory-result-view').classList.add('hidden');
}

function startMemoryGame(pairs) {
  if (userState.lastQuizPlayed === todayKey()) {
    showPopup(
      'Già giocata!',
      'Hai già giocato a Trova la Coppia oggi. Torna domani!',
      'fa-solid fa-heart'
    );
    return;
  }

  const availableCards = cardsDatabase.filter(card =>
    isObtainable(card)
  );

  if (availableCards.length < pairs) {
    showPopup(
      'Non abbastanza card',
      'Al momento non ci sono abbastanza card disponibili per questa difficoltà.',
      'fa-solid fa-triangle-exclamation'
    );
    return;
  }

  memoryTotalPairs = pairs;
  memoryFound = 0;
  memoryErrors = 0;
  memoryFlipped = [];
  memoryLock = false;

  const chosen = shuffle(availableCards).slice(0, pairs);

  memoryPairs = shuffle(
  chosen.flatMap(card => [
    { cardId: card.id, card: card },
    { cardId: card.id, card: card }
  ])
);

  byId('memory-difficulty-view').classList.add('hidden');
  byId('memory-result-view').classList.add('hidden');
  byId('memory-game-view').classList.remove('hidden');

  renderMemoryGrid();
  updateMemoryStatus();
}

function renderMemoryGrid() {
  const grid = byId('memory-grid');
  if (!grid) return;

  grid.innerHTML = memoryPairs.map((item, index) => `
    <button
      class="memory-card"
      data-index="${index}"
      data-card-id="${item.cardId}"
      onclick="flipMemoryCard(${index})"
    >
      <span class="memory-card-inner">
        <span class="memory-card-back">
          <i class="fa-solid fa-heart"></i>
        </span>
        <span
          class="memory-card-front"
          style="background-image:url('${item.card.img}')"
        ></span>
      </span>
    </button>
  `).join('');
}

function flipMemoryCard(index) {
  if (memoryLock) return;

  const cardEl = document.querySelector(
    `.memory-card[data-index="${index}"]`
  );

  if (!cardEl) return;
  if (cardEl.classList.contains('matched')) return;
  if (memoryFlipped.some(item => item.index === index)) return;
  if (memoryFlipped.length >= 2) return;

  cardEl.classList.add('flipped');
  memoryFlipped.push({
    index,
    cardId: memoryPairs[index].cardId,
    element: cardEl
  });

  if (memoryFlipped.length === 2) {
    memoryLock = true;
    setTimeout(checkMemoryMatch, 700);
  }
}

function checkMemoryMatch() {
  const [first, second] = memoryFlipped;

  if (first.cardId === second.cardId) {
    first.element.classList.add('matched');
    second.element.classList.add('matched');
    memoryFound++;
  } else {
    memoryErrors++;

    first.element.classList.add('wrong');
    second.element.classList.add('wrong');

    setTimeout(() => {
      first.element.classList.remove('flipped', 'wrong');
      second.element.classList.remove('flipped', 'wrong');
    }, 550);
  }

  memoryFlipped = [];
  memoryLock = false;

  updateMemoryStatus();

  if (memoryFound === memoryTotalPairs) {
    finishMemoryGame();
  }
}

function updateMemoryStatus() {
  byId('memory-pairs-found').innerText =
    `Coppie: ${memoryFound}/${memoryTotalPairs}`;

  byId('memory-errors').innerText =
    `Errori: ${memoryErrors}`;
}

function finishMemoryGame() {
  userState.lastQuizPlayed = todayKey();

  const baseReward = MEMORY_REWARDS[memoryTotalPairs];
  const noMistakeBonus = memoryErrors === 0 ? MEMORY_BONUS : 0;
  const totalReward = baseReward + noMistakeBonus;

  userState.credits += totalReward;

  saveProgress();
  updateUI();
  missionEvent('quiz');

  byId('memory-game-view').classList.add('hidden');
  byId('memory-result-view').classList.remove('hidden');

  byId('memory-result-title').innerText = 'Hai trovato tutte le coppie!';
  byId('memory-result-text').innerText =
    memoryErrors === 0
      ? 'Perfetto: nessun errore!'
      : `Hai completato il gioco con ${memoryErrors} errori.`;

  byId('memory-reward-text').innerText =
    memoryErrors === 0
      ? `+${baseReward} crediti\nBonus senza errori: +${MEMORY_BONUS} crediti\nTotale: +${totalReward} crediti`
      : `+${totalReward} crediti`;
}

/* ==========================================================================
   RUOTA DELLA FORTUNA
   ========================================================================== */
function updateWheelButton() {
  const btn = byId('btn-spin-wheel');
  if (!btn) return;
  const playedToday = userState.lastWheelPlayed === todayKey();
  btn.disabled = playedToday || appWheelSpinning;
  btn.innerText = playedToday ? 'GIÀ GIRATO OGGI ✅' : 'GIRA LA RUOTA 🎯';
}

function openWheelModal() {
  byId('wheel-modal').classList.remove('hidden');
  drawWheel();
  updateWheelButton();
}

function drawWheel() {
  const canvas = byId('wheel-canvas');
  if (!canvas || !canvas.getContext) return;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return;

  const count = WHEEL_PRIZES.length;
  const arc = (2 * Math.PI) / count;
  const size = canvas.width;
  const cx = size / 2, cy = size / 2;
  const raggio = size / 2 - 14;

  ctx.clearRect(0, 0, size, size);

  // Segmenti con sfumatura radiale
  WHEEL_PRIZES.forEach((prize, i) => {
    const inizio = i * arc;
    const fine = inizio + arc;
    const grad = ctx.createRadialGradient(cx, cy, 20, cx, cy, raggio);
    grad.addColorStop(0, prize.color + 'cc');
    grad.addColorStop(1, prize.color);
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, raggio, inizio, fine);
    ctx.closePath();
    ctx.fillStyle = grad;
    ctx.fill();
    ctx.strokeStyle = 'rgba(15,8,22,0.55)';
    ctx.lineWidth = 3;
    ctx.stroke();
  });

  // Bordo dorato esterno
  ctx.beginPath();
  ctx.arc(cx, cy, raggio + 6, 0, 2 * Math.PI);
  ctx.lineWidth = 8;
  const bordo = ctx.createLinearGradient(0, 0, size, size);
  bordo.addColorStop(0, '#ffd84d');
  bordo.addColorStop(0.5, '#fff3b0');
  bordo.addColorStop(1, '#d4a017');
  ctx.strokeStyle = bordo;
  ctx.shadowColor = 'rgba(255,216,77,0.6)';
  ctx.shadowBlur = 18;
  ctx.stroke();
  ctx.shadowBlur = 0;

  // Lucine sul bordo
  for (let i = 0; i < 16; i++) {
    const ang = (i / 16) * 2 * Math.PI;
    const lx = cx + Math.cos(ang) * (raggio + 6);
    const ly = cy + Math.sin(ang) * (raggio + 6);
    ctx.beginPath();
    ctx.arc(lx, ly, 3.5, 0, 2 * Math.PI);
    ctx.fillStyle = i % 2 === 0 ? '#fff' : '#ffd84d';
    ctx.shadowColor = '#ffd84d';
    ctx.shadowBlur = 8;
    ctx.fill();
  }
  ctx.shadowBlur = 0;

    // Testi dei premi
  WHEEL_PRIZES.forEach((prize, i) => {
    const ang = i * arc + arc / 2;
    const isCard = prize.type === 'card';

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(ang);

    const posizioneTesto = (30 + raggio) / 2 + 5;
    const spazioTesto = raggio - 30 - 24;

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = 'rgba(30, 8, 45, 0.65)';
    ctx.shadowBlur = 3;

    if (isCard) {
      let dimensione = 13;
      ctx.font = 'bold ' + dimensione + 'px Outfit, sans-serif';

      while (
        ctx.measureText('FREE CARD').width > spazioTesto &&
        dimensione > 9
      ) {
        dimensione--;
        ctx.font = 'bold ' + dimensione + 'px Outfit, sans-serif';
      }

      ctx.fillText('FREE CARD', posizioneTesto, 0);
    } else {
      ctx.font = 'bold 15px Outfit, sans-serif';
      ctx.fillText(prize.label, posizioneTesto, 0);
    }

    ctx.restore();
  });

  // Mozzo centrale
  ctx.beginPath();
  ctx.arc(cx, cy, 30, 0, 2 * Math.PI);
  const mozzo = ctx.createRadialGradient(cx, cy - 8, 4, cx, cy, 30);
  mozzo.addColorStop(0, '#3a1f4d');
  mozzo.addColorStop(1, '#120a18');
  ctx.fillStyle = mozzo;
  ctx.fill();
  ctx.lineWidth = 4;
  ctx.strokeStyle = '#ff5fa8';
  ctx.shadowColor = 'rgba(255,95,168,0.6)';
  ctx.shadowBlur = 14;
  ctx.stroke();
  ctx.shadowBlur = 0;

  // Cuore al centro
  ctx.fillStyle = '#ff5fa8';
  ctx.font = '18px "Font Awesome 6 Free"';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('\uf004', cx, cy + 1);
}

function pickWheelPrizeIndex() {
  const total = WHEEL_PRIZES.reduce((sum, p) => sum + p.weight, 0);
  let r = Math.random() * total;
  for (let i = 0; i < WHEEL_PRIZES.length; i++) {
    if (r < WHEEL_PRIZES[i].weight) return i;
    r -= WHEEL_PRIZES[i].weight;
  }
  return 0;
}

function spinWheel() {
  if (appWheelSpinning) return;
  if (userState.lastWheelPlayed === todayKey()) {
    showPopup('Ruota già girata 🎡', 'Hai già tentato la fortuna oggi! Torna domani.', 'fa-solid fa-dharmachakra');
    return;
  }

  const prizeIndex = pickWheelPrizeIndex();
  const prize = WHEEL_PRIZES[prizeIndex];

  // il premio viene deciso e salvato subito: chiudere la pagina durante il giro non fa perdere nulla
  let wonCard = null;
  let bonusCredits = 0;
  userState.lastWheelPlayed = todayKey();

  if (prize.type === 'credits') {
    userState.credits += prize.credits;
  } else {
    let pool = cardsDatabase.filter(c => !isUnlocked(c.id) && isObtainable(c) && (c.rarity === 'RARA' || c.rarity === 'LEGGENDARIA'));
    if (pool.length === 0) pool = cardsDatabase.filter(c => !isUnlocked(c.id) && isObtainable(c));
    if (pool.length > 0) {
      wonCard = randomItem(pool);
      unlockCard(wonCard.id);
    } else {
      bonusCredits = 200;
      userState.credits += bonusCredits;
    }
  }
  missionEvent('wheel');
  saveProgress();

  appWheelSpinning = true;
  updateWheelButton();

  // i segmenti partono da 0° (ore 3) in senso orario, il puntatore sta in alto (270°)
  const center = (prizeIndex + 0.5) * (360 / WHEEL_PRIZES.length);
  let target = (270 - center) % 360;
  if (target < 0) target += 360;
  const base = Math.floor(appWheelRotation / 360) * 360;
  let next = base + 5 * 360 + target;
  if (next <= appWheelRotation) next += 360;
  appWheelRotation = next;

  const wheel = byId('wheel-container');
  wheel.style.transition = 'transform 4s cubic-bezier(0.15, 0.9, 0.25, 1)';
  wheel.style.transform = `rotate(${appWheelRotation}deg)`;

  setTimeout(() => {
    appWheelSpinning = false;
    updateWheelButton();
    updateUI();

    if (prize.type === 'credits') {
      showPopup('Premio vinto! 🎉', `La ruota si è fermata su ${prize.label}! Hai guadagnato +${prize.credits} crediti!`, 'fa-solid fa-gift');
    } else if (wonCard) {
      showReward(wonCard);
    } else {
      showPopup('SUPER PREMIO! 👑', `Hai già tutte le card! Per te un bonus speciale di +${bonusCredits} crediti!`, 'fa-solid fa-crown');
    }
  }, 4200);
}

/* ==========================================================================
   PROFILO
   ========================================================================== */
function updateRankBadge() {
  const rankEl = byId('rank-title-text');
  if (!rankEl) return;
  const totalCards = completionTotal();
  const ratio = totalCards > 0 ? userState.unlockedCards.length / totalCards : 0;

  let rank = 'Novizia 🌸';
  if (ratio >= 1) rank = 'Sapphic Legend 👑';
  else if (ratio >= 0.75) rank = 'Crush Queen ✨';
  else if (ratio >= 0.5) rank = 'Super Fanatic ⭐';
  else if (ratio >= 0.25) rank = 'Fan Affezionata 💖';
  rankEl.innerText = rank;
}

function updateUI() {
  const total = completionTotal();
  const unlockedCount = userState.unlockedCards.length;

  // crediti (con piccolo effetto quando cambiano)
  const headerCredits = byId('user-credits-header');
  if (headerCredits) headerCredits.innerText = userState.credits;
  const profileCredits = byId('user-credits-profile');
  if (profileCredits) profileCredits.innerText = userState.credits;
  if (appLastCredits !== null && appLastCredits !== userState.credits) {
    const badge = document.querySelector('.credits-badge');
    if (badge) {
      badge.classList.remove('bump');
      void badge.offsetWidth; // riavvia l'animazione
      badge.classList.add('bump');
    }
  }
  appLastCredits = userState.credits;

  // completamento
  const completion = byId('completion-rate');
  if (completion) completion.innerText = `${unlockedCount} / ${total}`;
  const progressFill = byId('progress-bar-fill');
  if (progressFill) progressFill.style.width = `${total > 0 ? (unlockedCount / total) * 100 : 0}%`;

  // rarità
  const owned = cardsDatabase.filter(c => isUnlocked(c.id));
  [['COMUNE', 'stat-comune'], ['RARA', 'stat-rara'], ['LEGGENDARIA', 'stat-leggendaria']].forEach(([rarity, id]) => {
    const el = byId(id);
    if (el) el.innerText = owned.filter(c => c.rarity === rarity).length;
  });

  updateRankBadge();
  updateStreakUI();

  // nome (non sovrascrivo mentre la stai scrivendo)
  const nameInput = byId('username-input');
  if (nameInput && document.activeElement !== nameInput) nameInput.value = userState.username;

  // avatar
  const avatar = byId('profile-avatar-display');
  if (avatar) {
    if (userState.avatarImg) {
      avatar.style.backgroundImage = `url('${userState.avatarImg}')`;
      avatar.innerHTML = '';
    } else {
      avatar.style.backgroundImage = 'none';
      avatar.innerHTML = '<i class="fa-solid fa-user-astronaut"></i>';
    }
  }

  renderShowcase();
  renderHomeBar();
  renderDailyOffer();
  updateReadyDots();
}

function saveUsername() {
  const input = byId('username-input');
  const value = input.value.trim();
  if (!value) {
    input.value = userState.username;
    showPopup('Nome vuoto ✏️', 'Scrivi un nome da mostrare nel profilo!', 'fa-solid fa-triangle-exclamation');
    return;
  }
  userState.username = value;
  saveProgress();
  showPopup('Profilo aggiornato 🌸', 'Il tuo username è stato salvato!', 'fa-solid fa-user-check');
}

function selectAvatar(imgUrl) {
  userState.avatarImg = imgUrl;
  saveProgress();
  updateUI();
  closeModal('selection-modal');
  showPopup('Avatar aggiornato! 🌸', imgUrl ? 'Il tuo nuovo avatar è stato impostato.' : 'Hai rimosso il tuo avatar.', 'fa-solid fa-user-astronaut');
}

function openAvatarSelector() {
  byId('selection-modal-title').innerText = 'Scegli il tuo avatar';

  byId('avatar-action-box').innerHTML = `
    <div class="avatar-actions">
      <button class="btn-upload-avatar" onclick="document.getElementById('user-avatar-input').click()">
        <i class="fa-solid fa-upload"></i> Carica dalla galleria
      </button>
      ${userState.avatarImg ? '<button class="btn-primary btn-ghost" onclick="selectAvatar(null)">Rimuovi avatar</button>' : ''}
    </div>
  `;

  const grid = byId('selection-grid');
  const owned = cardsDatabase.filter(c => isUnlocked(c.id));
  grid.innerHTML = owned.length === 0
    ? '<p class="selection-empty">Nessuna card sbloccata ancora!</p>'
    : owned.map(card => `
        <div class="selection-item" style="background-image: url('${card.img}')" onclick="selectAvatar('${card.img}')">
          <span>${card.name}</span>
        </div>
      `).join('');

  byId('selection-modal').classList.remove('hidden');
}

/* ---------- VETRINA (3 card preferite) ---------- */
function renderShowcase() {
  const row = byId('showcase-row');
  if (!row) return;
  row.innerHTML = userState.showcaseCardIds.map((id, slot) => {
    const card = id ? cardsDatabase.find(c => c.id === id) : null;
    return `
      <div class="showcase-slot ${card ? 'filled' : ''}" onclick="openShowcaseSelector(${slot})">
        ${card ? createCardHTML(card) : '<span class="showcase-plus"><i class="fa-solid fa-plus"></i></span>'}
      </div>
    `;
  }).join('');
}

function openShowcaseSelector(slot) {
  byId('selection-modal-title').innerText = `Vetrina · posto ${slot + 1}`;
  const current = userState.showcaseCardIds[slot];

  byId('avatar-action-box').innerHTML = current
    ? `<div class="avatar-actions"><button class="btn-primary btn-ghost" onclick="setShowcaseCard(${slot}, null)">Svuota questo posto</button></div>`
    : '';

  // le card già messe negli altri posti non si ripetono
  const usedElsewhere = userState.showcaseCardIds.filter((id, i) => id && i !== slot);
  const owned = cardsDatabase.filter(c => isUnlocked(c.id) && !usedElsewhere.includes(c.id));

  const grid = byId('selection-grid');
  grid.innerHTML = owned.length === 0
    ? '<p class="selection-empty">Sblocca prima qualche card per metterla in vetrina!</p>'
    : owned.map(card => `
        <div class="selection-item" style="background-image: url('${card.img}')" onclick="setShowcaseCard(${slot}, ${card.id})">
          <span>${card.name}</span>
        </div>
      `).join('');

  byId('selection-modal').classList.remove('hidden');
}

function setShowcaseCard(slot, cardId) {
  userState.showcaseCardIds[slot] = cardId;
  saveProgress();
  updateUI();
  closeModal('selection-modal');
}

/* Ridimensiona la foto a un quadrato piccolo: una foto intera da galleria
   riempirebbe lo spazio del browser e il salvataggio smetterebbe di funzionare. */
function resizeImageFile(file, size) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error);
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('Immagine non valida'));
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        const side = Math.min(img.width, img.height);
        const sx = (img.width - side) / 2;
        const sy = (img.height - side) / 2;
        ctx.drawImage(img, sx, sy, side, side, 0, 0, size, size);
        resolve(canvas.toDataURL('image/jpeg', 0.82));
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

async function handleCustomAvatarUpload(event) {
  const input = event.target;
  const file = input.files && input.files[0];
  if (!file) return;

  if (!file.type.startsWith('image/')) {
    showPopup('Attenzione ⚠️', 'Scegli un file immagine (JPG, PNG...).', 'fa-solid fa-triangle-exclamation');
    input.value = '';
    return;
  }

  try {
    const dataUrl = await resizeImageFile(file, AVATAR_SIZE);
    selectAvatar(dataUrl);
  } catch (err) {
    console.warn(err);
    showPopup('Attenzione ⚠️', 'Non sono riuscita a leggere questa immagine, prova con un\'altra.', 'fa-solid fa-triangle-exclamation');
  }
  input.value = '';
}

/* ==========================================================================
   AVVIO
   ========================================================================== */
function initApp() {
  ensureHomeSheet();
  ensureMissions();
  ensureDailyOffer();
  renderCollections();
  renderShop();
  updateTimer();
  updateUI();
}

document.addEventListener('DOMContentLoaded', () => {
  initApp();
  setInterval(updateTimer, 30000);
});

// se lasci l'app aperta oltre la mezzanotte, al ritorno streak e timer si aggiornano
document.addEventListener('visibilitychange', () => {
  if (!document.hidden) {
    updateTimer();
    updateUI();
  }
});

// ---------- PALLINI "PRONTO!" SULLA BARRA IN BASSO ----------
function setNavDot(screenId, show, extraClass) {
  const btn = document.querySelector('.nav-item[onclick*="' + screenId + '"]');
  if (!btn) return;
  let dot = btn.querySelector('.nav-dot');
  if (!dot) {
    dot = document.createElement('span');
    dot.className = 'nav-dot';
    btn.appendChild(dot);
  }
  dot.classList.toggle('gold', !!extraClass);
  dot.classList.toggle('hidden', !show);
}

function updateReadyDots() {
  const oggi = todayKey();
  const streakPronta = userState.lastStreakClaimDate !== oggi;
  const ruotaPronta  = userState.lastWheelPlayed !== oggi;
  const quizPronto   = userState.lastQuizPlayed !== oggi;
  const freePronta   = (Date.now() - userState.lastFreeClaim) >= FREE_CARD_COOLDOWN;

  setNavDot('sec-home', streakPronta || ruotaPronta || quizPronto || freePronta, false);

  const eventoAttivo = EVENTS.some(e => eventStatus(e) === 'active');
  setNavDot('sec-shop', eventoAttivo, true);
  if (missionsPending()) setNavDot('sec-home', true, false);
  if (offerAvailable() && userState.offerSeen !== todayKey()) setNavDot('sec-shop', true, true);
}

// ---------- MISSIONI GIORNALIERE v2 ----------
const MISSION_REWARD = 15;
const MISSION_BONUS = 40;
const MISSION_POOL = [
  { type: 'pack',   text: 'Apri una busta',                 target: 1 },
  { type: 'wheel',  text: 'Gira la ruota della fortuna',    target: 1 },
  { type: 'quiz', text: 'Gioca a Trova la Coppia', target: 1 },
  { type: 'streak', text: 'Riscatta la streak di oggi',     target: 1 },
  { type: 'album',  text: 'Sfoglia un album',               target: 1 },
  { type: 'buy',    text: 'Compra una card nello shop',     target: 1 },
  { type: 'wish',   text: 'Aggiungi una card ai desideri',  target: 1 }
];

function ensureMissions() {
  const oggi = todayKey();
  if (!userState.missions || userState.missions.date !== oggi || userState.missions.v !== 2) {
    userState.missions = {
      v: 2,
      date: oggi,
      bonusGiven: false,
      list: shuffle(MISSION_POOL).slice(0, 3).map(m => ({
        type: m.type, text: m.text, target: m.target, progress: 0, done: false
      }))
    };
    saveProgress();
  }
  return userState.missions;
}

function missionsPending() {
  return ensureMissions().list.some(m => !m.done);
}

// ----- Notifica in alto -----
function showToast(title, text, icon) {
  let wrap = byId('toast-wrap');
  if (!wrap) {
    wrap = document.createElement('div');
    wrap.id = 'toast-wrap';
    document.body.appendChild(wrap);
  }
  const t = document.createElement('div');
  t.className = 'toast';
  t.innerHTML = '<i class="' + icon + '"></i><div><strong>' + title + '</strong><span>' + text + '</span></div>';
  wrap.appendChild(t);
  setTimeout(function () {
    t.classList.add('out');
    setTimeout(function () { t.remove(); }, 400);
  }, 3200);
}

// ----- Avanzamento missioni (accredito automatico) -----
function missionEvent(type) {
  const s = ensureMissions();
  const completate = [];
  s.list.forEach(function (m) {
    if (m.type === type && !m.done) {
      m.progress++;
      if (m.progress >= m.target) { m.done = true; completate.push(m); }
    }
  });
  if (!completate.length) { renderHomeBar(); return; }

  userState.credits += MISSION_REWARD * completate.length;
  let bonus = false;
  if (!s.bonusGiven && s.list.every(function (m) { return m.done; })) {
    s.bonusGiven = true;
    userState.credits += MISSION_BONUS;
    bonus = true;
  }
  saveProgress();
  updateUI();

  completate.forEach(function (m) {
    showToast('Missione completata!', m.text + ' (+' + MISSION_REWARD + ' crediti)', 'fa-solid fa-circle-check');
  });
  if (bonus) {
    setTimeout(function () {
      showToast('Tutte le missioni completate!', 'Bonus +' + MISSION_BONUS + ' crediti', 'fa-solid fa-trophy');
    }, 900);
  }
  updateReadyDots();
}

// ----- Barra con le due icone in alto nella Home -----
function ensureHomeBar() {
  let bar = byId('home-quick-bar');
  if (bar) return bar;
  const home = byId('sec-home');
  if (!home) return null;
  bar = document.createElement('div');
  bar.id = 'home-quick-bar';
  bar.innerHTML =
    '<button class="quick-btn" id="quick-streak" onclick="openHomeSheet(\'streak\')"></button>' +
    '<button class="quick-btn" id="quick-missions" onclick="openHomeSheet(\'missions\')"></button>';
  home.insertBefore(bar, home.firstChild);
  return bar;
}

function renderHomeBar() {
  if (!ensureHomeBar()) return;
  const daRiscattare = userState.lastStreakClaimDate !== todayKey();
  byId('quick-streak').innerHTML =
    '<i class="fa-solid fa-fire-flame-curved"></i><b>' + currentStreakValue() + '</b>' +
    (daRiscattare ? '<span class="quick-dot"></span>' : '');

  const s = ensureMissions();
  const fatte = s.list.filter(function (m) { return m.done; }).length;
  byId('quick-missions').innerHTML =
    '<i class="fa-solid fa-bullseye"></i><b>' + fatte + '/' + s.list.length + '</b>' +
    (fatte < s.list.length ? '<span class="quick-dot"></span>' : '');

  const sheet = byId('home-sheet');
  if (sheet && !sheet.classList.contains('hidden')) renderSheet();
}

// ----- Pannello che si apre -----
function ensureHomeSheet() {
  let sheet = byId('home-sheet');
  if (sheet) return sheet;
  sheet = document.createElement('div');
  sheet.id = 'home-sheet';
  sheet.className = 'modal hidden';
  sheet.innerHTML =
    '<div class="modal-content sheet-content">' +
      '<button class="close-btn sheet-close" onclick="closeHomeSheet()">&times;</button>' +
      '<div id="sheet-streak"><div id="streak-week"></div></div>' +
      '<div id="sheet-missions"></div>' +
    '</div>';
  sheet.addEventListener('click', function (e) { if (e.target === sheet) closeHomeSheet(); });
  document.body.appendChild(sheet);

  // il box streak originale va dentro al pannello (i suoi pulsanti continuano a funzionare)
  const vecchio = document.querySelector('.streak-box');
  const cont = byId('sheet-streak');
  if (vecchio) {
    cont.appendChild(vecchio);
  } else {
    cont.insertAdjacentHTML('beforeend',
      '<p id="streak-info-text"></p>' +
      '<button id="btn-claim-streak" class="btn-primary" onclick="claimDailyStreak()">RISCATTA</button>');
  }
  return sheet;
}

function openHomeSheet(vista) {
  const sheet = ensureHomeSheet();
  sheet.dataset.view = vista;

  // Aggiorna testo e pulsante usando i dati attuali
  updateStreakUI();
  updateStreakUI();
  renderSheet();

  sheet.classList.remove('hidden');
}

function closeHomeSheet() {
  const sheet = byId('home-sheet');
  if (sheet) sheet.classList.add('hidden');
}

function renderSheet() {
  const sheet = byId('home-sheet');
  if (!sheet) return;
  const v = sheet.dataset.view;
  byId('sheet-streak').style.display = v === 'streak' ? 'block' : 'none';
  byId('sheet-missions').style.display = v === 'missions' ? 'block' : 'none';
  if (v === 'streak') renderStreakWeek(); else renderMissionsList();
}

function renderStreakWeek() {
  const box = byId('streak-week');
  if (!box) return;
  const streak = currentStreakValue();
  const oggiRiscosso = userState.lastStreakClaimDate === todayKey();
  let fatti = streak % 7;
  if (oggiRiscosso && streak > 0 && streak % 7 === 0) fatti = 7;
  let pallini = '';
  for (let i = 1; i <= 7; i++) {
    pallini += '<span class="week-dot' + (i <= fatti ? ' on' : '') + (i === 7 ? ' last' : '') + '">' +
               (i === 7 ? '<i class="fa-solid fa-gift"></i>' : i) + '</span>';
  }
  box.innerHTML =
    '<h4 class="sheet-title"><i class="fa-solid fa-fire-flame-curved"></i> La tua streak</h4>' +
    '<div class="week-row">' + pallini + '</div>' +
    '<p class="week-hint">Al settimo giorno ricevi un bonus di crediti</p>';
}

function renderMissionsList() {
  const box = byId('sheet-missions');
  if (!box) return;
  const s = ensureMissions();
  const righe = s.list.map(function (m) {
    return '<div class="mission-row' + (m.done ? ' done' : '') + '">' +
             '<span class="mission-text">' + m.text + '</span>' +
             (m.done
               ? '<span class="mission-check"><i class="fa-solid fa-check"></i></span>'
               : '<span class="mission-progress">+' + MISSION_REWARD + '</span>') +
           '</div>';
  }).join('');
  const tutte = s.list.every(function (m) { return m.done; });
  box.innerHTML =
    '<h4 class="sheet-title"><i class="fa-solid fa-bullseye"></i> Missioni di oggi</h4>' +
    righe +
    '<div class="mission-bonus' + (tutte ? ' done' : '') + '">' +
      (tutte ? 'Bonus ricevuto: +' + MISSION_BONUS + ' crediti' : 'Completa tutte e 3: +' + MISSION_BONUS + ' crediti extra') +
    '</div>';
}

// ---------- OFFERTA DEL GIORNO ----------
const OFFER_DISCOUNT = 0.3;
const OFFER_LEGENDARY_CHANCE = 0.3;
const OFFER_LABELS = { RARA: 'Rara', LEGGENDARIA: 'Leggendaria' };
let offerPurchasePending = false;

function offerPrice(card) {
  return Math.max(1, Math.round(card.price * (1 - OFFER_DISCOUNT)));
}

function ensureDailyOffer() {
  const oggi = todayKey();
  const o = userState.dailyOffer;
  if (o && o.date === oggi) return o;

  const pool = cardsDatabase.filter(function (c) {
    return (c.rarity === 'RARA' || c.rarity === 'LEGGENDARIA') && !isUnlocked(c.id) && isObtainable(c);
  });
  let cardId = null;
  if (pool.length) {
    const leg = pool.filter(function (c) { return c.rarity === 'LEGGENDARIA'; });
    const rare = pool.filter(function (c) { return c.rarity === 'RARA'; });
    const scegliLeg = leg.length && (!rare.length || Math.random() < OFFER_LEGENDARY_CHANCE);
    cardId = randomItem(scegliLeg ? leg : rare).id;
  }
  userState.dailyOffer = { date: oggi, cardId: cardId, bought: false };
  saveProgress();
  return userState.dailyOffer;
}

function getOfferCard() {
  const o = ensureDailyOffer();
  if (!o.cardId) return null;
  return cardsDatabase.find(function (c) { return c.id === o.cardId; }) || null;
}

function offerAvailable() {
  const o = ensureDailyOffer();
  const card = getOfferCard();
  return !!card && !o.bought && !isUnlocked(card.id) && isObtainable(card);
}

function getOfferBox() {
  let box = byId('daily-offer');
  if (box) return box;
  box = document.createElement('div');
  box.id = 'daily-offer';
  box.className = 'daily-offer';
  const tabs = document.querySelector('.shop-tabs');
  const shop = byId('sec-shop');
  if (tabs && tabs.parentNode) tabs.parentNode.insertBefore(box, tabs.nextSibling);
  else if (shop) shop.insertBefore(box, shop.firstChild);
  else return null;
  return box;
}

function renderDailyOffer() {
  const box = getOfferBox();
  if (!box) return;
  const card = getOfferCard();
  if (!card) { box.classList.add('hidden'); return; }
  box.classList.remove('hidden');

  if (!offerAvailable()) {
    box.innerHTML =
      '<div class="offer-done"><i class="fa-solid fa-tag"></i> ' +
      'Offerta di oggi esaurita. Torna domani per una nuova!</div>';
    return;
  }

  const mezzanotte = new Date();
  mezzanotte.setHours(24, 0, 0, 0);
  const timer = formatRemaining(mezzanotte.getTime() - Date.now());
  const nuovo = offerPrice(card);

  box.innerHTML =
    '<div class="offer-head">' +
      '<span class="offer-title"><i class="fa-solid fa-tag"></i> Offerta del giorno</span>' +
      '<span class="offer-chip">-' + Math.round(OFFER_DISCOUNT * 100) + '%</span>' +
    '</div>' +
    '<div class="offer-body">' +
            '<div class="offer-card">' + createLockedCardHTML(card, OFFER_LABELS[card.rarity]) + '</div>' +
      '<div class="offer-info">' +
        '<div class="offer-name">Card misteriosa</div>' +
        '<div class="offer-hint">Categoria: ' + card.category + '</div>' +
        '<div class="offer-rarity ' + card.rarity + '">' + OFFER_LABELS[card.rarity] + '</div>' +
        '<div class="offer-prices">' +
          '<span class="offer-old"><i class="fa-solid fa-coins"></i> ' + card.price + '</span>' +
          '<span class="offer-new"><i class="fa-solid fa-coins"></i> ' + nuovo + '</span>' +
        '</div>' +
        '<div class="offer-timer"><i class="fa-regular fa-clock"></i> Scade tra ' + timer + '</div>' +
        '<button class="btn-primary offer-btn" onclick="buyDailyOffer()">ACQUISTA</button>' +
      '</div>' +
    '</div>';
}

function buyDailyOffer() {
  if (!offerAvailable()) return;
  const card = getOfferCard();
  const prezzo = offerPrice(card);
  if (userState.credits < prezzo) {
    showPopup('Crediti insufficienti!',
      'Ti servono ' + prezzo + ' crediti per questa offerta. Gira la ruota o completa le missioni!',
      'fa-solid fa-coins');
    return;
  }
  offerPurchasePending = true;
  pendingPurchasePackId = null;
  pendingPurchaseCardId = card.id;
    openConfirmBuy('Offerta del giorno',
    'Vuoi acquistare questa card ' + OFFER_LABELS[card.rarity] + ' a prezzo scontato: ' +
    prezzo + ' crediti invece di ' + card.price + '? La scoprirai subito dopo l\'acquisto!');
}

// ---------- PREMI PAGINA E ALBUM COMPLETATI ----------
const PAGE_REWARD = 100;
const ALBUM_REWARD = 500;

function pageKey(collectionId, page) {
  return collectionId + ':' + page;
}

function checkPageRewards(collectionId) {
  const cards = cardsDatabase.filter(function (c) { return c.collectionId === collectionId; });
  if (!cards.length) return;
  const totalePagine = Math.ceil(cards.length / albumState.cardsPerPage);
  const pagineFatte = [];
  let albumCompleto = true;
  let changed = false;

  for (let p = 1; p <= totalePagine; p++) {
    const start = (p - 1) * albumState.cardsPerPage;
    const pagina = cards.slice(start, start + albumState.cardsPerPage);
    const completa = pagina.length && pagina.every(function (c) { return isUnlocked(c.id); });
    if (completa) pagineFatte.push(p);
    else albumCompleto = false;
  }

  // Premi per ogni pagina completata
  pagineFatte.forEach(function (p) {
    const key = pageKey(collectionId, p);
    if (!Array.isArray(userState.pageRewards)) userState.pageRewards = [];
    if (userState.pageRewards.includes(key)) return;
    userState.pageRewards.push(key);
    changed = true;
    userState.credits += PAGE_REWARD;
    showToast('Pagina ' + p + ' completata!', '+' + PAGE_REWARD + ' crediti', 'fa-solid fa-book-open');
  });

  // Premio per l'album intero
  if (!Array.isArray(userState.albumRewards)) userState.albumRewards = [];
  if (albumCompleto && !userState.albumRewards.includes(collectionId)) {
    userState.albumRewards.push(collectionId);
    changed = true;
    userState.credits += ALBUM_REWARD;
    showToast('Album completato!', '+' + ALBUM_REWARD + ' crediti', 'fa-solid fa-crown');
  }

  if (changed) {
    saveProgress();
    updateUI();
  }
}

// ---------- EFFETTI PER LE LEGGENDARIE ----------
function legendaryEffect() {
  // Vibrazione (Android e alcuni browser mobile; su iPhone non è supportata)
  if (navigator.vibrate) {
    try { navigator.vibrate([80, 60, 120]); } catch (e) {}
  }
  // Lampo dorato
  let flash = byId('legendary-flash');
  if (!flash) {
    flash = document.createElement('div');
    flash.id = 'legendary-flash';
    document.body.appendChild(flash);
  }
  flash.classList.remove('run');
  void flash.offsetWidth; // riavvia l'animazione
  flash.classList.add('run');

  // Coriandoli
  let confetti = byId('legendary-confetti');
  if (!confetti) {
    confetti = document.createElement('div');
    confetti.id = 'legendary-confetti';
    document.body.appendChild(confetti);
  }
  confetti.innerHTML = '';
  for (let i = 0; i < 40; i++) {
    const p = document.createElement('span');
    p.className = 'confetti-piece';
    p.style.left = Math.random() * 100 + '%';
    p.style.animationDelay = (Math.random() * 0.6) + 's';
    p.style.animationDuration = (1.6 + Math.random() * 1.2) + 's';
    const colori = ['#ffd84d', '#ff5fa8', '#9b59ff', '#fff'];
    p.style.background = colori[Math.floor(Math.random() * colori.length)];
    confetti.appendChild(p);
  }
  setTimeout(function () { confetti.innerHTML = ''; }, 3000);
}

function hasLegendary(cards) {
  return cards.some(function (c) { return c.rarity === 'LEGGENDARIA'; });
}

let legendaryShown = false;
