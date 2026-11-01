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
  { label: '10 🪙', credits: 10, type: 'credits', color: '#9b59ff', weight: 35 },
  { label: '15 🪙', credits: 15, type: 'credits', color: '#3da5ff', weight: 25 },
  { label: '20 🪙', credits: 20, type: 'credits', color: '#ff5fa8', weight: 20 },
  { label: '25 🪙', credits: 25, type: 'credits', color: '#2ecc71', weight: 12 },
  { label: '50 🪙', credits: 50, type: 'credits', color: '#e74c3c', weight: 6 },
  { label: 'CARD 🌟', type: 'card', color: '#f1c40f', weight: 2 }
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
    quizOptions: null
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
}

/* ---------- CARD ---------- */
function createCardHTML(card) {
  return `
    <div class="collectible-card ${card.rarity}" style="background-image: url('${card.img}')">
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

  container.innerHTML = collectionsDatabase.map(col => {
    const colCards = cardsDatabase.filter(c => c.collectionId === col.id);
    const unlocked = colCards.filter(c => isUnlocked(c.id)).length;
    const percent = colCards.length > 0 ? (unlocked / colCards.length) * 100 : 0;

    return `
      <div class="collection-card-item" onclick="openCollection('${col.id}')">
        <div class="col-cover" style="background-image: url('${col.coverImg}')">
          <div class="col-overlay">
            <h4>${col.title}</h4>
            <p>${unlocked} / ${colCards.length} sbloccate</p>
            <div class="col-progress-bar">
              <div class="col-progress-fill" style="width: ${percent}%"></div>
            </div>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

function openCollection(collectionId) {
  currentCollectionId = collectionId;
  albumState.currentPage = 1;
  byId('album-collections-view').classList.add('hidden');
  byId('album-cards-view').classList.remove('hidden');
  renderAlbum();
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
    return createLockedCardHTML(card, card.name);
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

/* ---------- ZOOM CARD (flip + inclinazione 3D) ---------- */
function openZoomCard(cardId) {
  const card = cardsDatabase.find(c => c.id === cardId);
  const container = byId('zoom-card-inner');
  if (!card || !container) return;

  container.classList.remove('flipped');
  container.style.transform = '';
  container.innerHTML = `
    <div class="zoom-card-face zoom-card-front">${createCardHTML(card)}</div>
    <div class="zoom-card-face zoom-card-back">
      <i class="fa-solid fa-wand-magic-sparkles"></i>
      <h3>CRUSH CARDS</h3>
      <p>Official Collection</p>
    </div>
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

  container.innerHTML = packsDatabase.map(pack => {
    const canAfford = userState.credits >= pack.price;
    return `
      <div class="pack-card" onclick="promptBuyPack('${pack.id}')">
        <div class="pack-art" style="--pack-cover: url('${pack.cover}')">
          <span class="pack-count">${pack.cardCount} card</span>
        </div>
        <h4>${pack.name}</h4>
        <div class="pack-price ${canAfford ? '' : 'cant-afford'}">
          <i class="fa-solid fa-coins"></i> ${pack.price}
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
  return `
    <div class="shop-category-card-item" onclick="promptBuyCard(${card.id})">
      <div class="shop-card-preview-box">
        ${createLockedCardHTML(card, RARITY_LABEL[card.rarity] || card.rarity)}
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

function renderSinglesShop() {
  const container = byId('shop-categories-list');
  if (!container) return;

  // ricordo lo scroll, così dopo un acquisto la pagina non "salta"
  const shopScreen = byId('sec-shop');
  const shopVisible = shopScreen && shopScreen.classList.contains('active');
  const prevScrollY = window.scrollY;
  const prevRowScroll = {};
  container.querySelectorAll('.horizontal-shop-row').forEach(row => {
    prevRowScroll[row.dataset.key] = row.scrollLeft;
  });

  let html = '';
  collectionsDatabase.forEach(col => {
    const colCards = cardsDatabase.filter(c => c.collectionId === col.id);
    if (colCards.length === 0) return;
    const colOwned = colCards.filter(c => isUnlocked(c.id)).length;

    html += `
      <div class="shop-album-group">
        <h3 class="shop-album-title">
          <span>${col.title}</span>
          <small>${colOwned} / ${colCards.length}</small>
        </h3>
    `;

    buildShopGroups(colCards).forEach((group, index) => {
      const cards = group.cards.slice().sort((a, b) =>
        RARITY_ORDER[a.rarity] - RARITY_ORDER[b.rarity] || a.id - b.id
      );
      const owned = cards.filter(c => isUnlocked(c.id)).length;

      html += `
        <div class="shop-subgroup">
          <div class="shop-subgroup-head">
            <span>${group.label}</span>
            <span class="shop-subgroup-count">${owned} / ${cards.length}</span>
          </div>
          <div class="horizontal-shop-row" data-key="${col.id}-${index}">
            ${cards.map(createShopItemHTML).join('')}
          </div>
        </div>
      `;
    });

    html += '</div>';
  });

  container.innerHTML = html;

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

  if (userState.credits < pack.price) {
    showPopup('Crediti insufficienti! 💸', 'Gioca a Indovina la Crush, gira la ruota o riscatta la streak per ottenere altri crediti!', 'fa-solid fa-coins');
    return;
  }
  pendingPurchaseCardId = null;
  pendingPurchasePackId = packId;
  openConfirmBuy(`Acquista ${pack.name}`, `Vuoi acquistare questa busta con ${pack.cardCount} card per ${pack.price} crediti?`);
}

function promptBuyCard(cardId) {
  const card = cardsDatabase.find(c => c.id === cardId);
  if (!card || isUnlocked(cardId)) return;

  if (userState.credits < card.price) {
    showPopup('Crediti insufficienti! 💸', 'Ottieni altri crediti con i mini-giochi, la ruota o la streak!', 'fa-solid fa-coins');
    return;
  }
  pendingPurchasePackId = null;
  pendingPurchaseCardId = cardId;
  openConfirmBuy(`Acquista ${card.name}`, `Vuoi acquistare questa card ${RARITY_LABEL[card.rarity] || card.rarity} per ${card.price} crediti?`);
}

function cancelBuyCard() {
  pendingPurchaseCardId = null;
  pendingPurchasePackId = null;
  byId('confirm-buy-modal').classList.add('hidden');
}

function confirmBuyCard() {
  const packId = pendingPurchasePackId;
  const cardId = pendingPurchaseCardId;
  cancelBuyCard();

  if (packId) {
    const pack = packsDatabase.find(p => p.id === packId);
    if (!pack || userState.credits < pack.price) return;
    userState.credits -= pack.price;
    saveProgress();
    updateUI();
    openPackSequence(pack);
    return;
  }

  if (cardId) {
    const card = cardsDatabase.find(c => c.id === cardId);
    if (!card || isUnlocked(cardId) || userState.credits < card.price) return;
    userState.credits -= card.price;
    unlockCard(card.id);
    saveProgress();
    showReward(card);
    refreshAllViews();
  }
}

/* ---------- APERTURA BUSTE ---------- */
function pickPackCards(pack) {
  const pool = cardsDatabase.filter(c => c.collectionId === pack.collectionId);
  const picked = [];

  while (picked.length < pack.cardCount && picked.length < pool.length) {
    const rarity = rollRarity(PACK_ODDS);
    let candidates = pool.filter(c => c.rarity === rarity && !picked.includes(c));
    if (candidates.length === 0) candidates = pool.filter(c => !picked.includes(c));
    picked.push(randomItem(candidates));
  }
  return picked;
}

function openPackSequence(pack) {
  const cards = pickPackCards(pack);
  if (cards.length === 0) {
    userState.credits += pack.price; // rimborso, non dovrebbe mai succedere
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

  const lockedCards = cardsDatabase.filter(c => !isUnlocked(c.id));
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
    if (moves % 6 === 0 && clearedPercent() > 40) revealScratchCard();
  }

  canvas.onpointerdown = (e) => { scratching = true; scratch(e); };
  canvas.onpointermove = scratch;
  canvas.onpointerup = () => { scratching = false; if (clearedPercent() > 40) revealScratchCard(); };
  canvas.onpointercancel = () => { scratching = false; };
  canvas.onpointerleave = () => { scratching = false; };
}

function updateTimer() {
  const remaining = FREE_CARD_COOLDOWN - (Date.now() - userState.lastFreeClaim);
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
  showPopup('Streak giornaliera! 🔥', message, 'fa-solid fa-fire');
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

/* ==========================================================================
   MINI-GIOCO: INDOVINA LA CRUSH
   ========================================================================== */
/* La card del giorno viene salvata: chiudere e riaprire il gioco non permette di "ritirare" */
function getDailyQuiz() {
  if (userState.quizDate === todayKey() && userState.quizCardId && Array.isArray(userState.quizOptions)) {
    const saved = cardsDatabase.find(c => c.id === userState.quizCardId);
    if (saved) return { card: saved, options: userState.quizOptions };
  }

  const pool = cardsDatabase.filter(c => QUIZ_CATEGORIES.includes(c.category));
  if (pool.length === 0) return null;

  const card = randomItem(pool);
  const otherNames = [...new Set(pool.map(c => c.name))].filter(n => n !== card.name);
  const options = shuffle([card.name, ...shuffle(otherNames).slice(0, 3)]);

  userState.quizDate = todayKey();
  userState.quizCardId = card.id;
  userState.quizOptions = options;
  saveProgress();
  return { card: card, options: options };
}

function openQuizModal() {
  if (userState.lastQuizPlayed === todayKey()) {
    showPopup('Già giocato! 🕵️', 'Hai già giocato a Indovina la Crush oggi. Torna domani per una nuova sfida!', 'fa-solid fa-user-secret');
    return;
  }

  const quiz = getDailyQuiz();
  if (!quiz) return;
  currentQuizCard = quiz.card;

  const body = byId('quiz-body');
  body.innerHTML = `
    <div class="quiz-photo-wrap">
      <div id="quiz-photo" class="quiz-photo" style="background-image: url('${quiz.card.img}')"></div>
    </div>
    <p class="quiz-question">Chi si nasconde dietro questa foto sfocata?</p>
    <div id="quiz-options" class="quiz-options"></div>
  `;

  const optionsBox = byId('quiz-options');
  quiz.options.forEach(name => {
    const btn = document.createElement('button');
    btn.className = 'quiz-option';
    btn.textContent = name;
    btn.addEventListener('click', () => answerQuiz(name, btn));
    optionsBox.appendChild(btn);
  });

  byId('quiz-modal').classList.remove('hidden');
}

function answerQuiz(selectedName, btn) {
  if (!currentQuizCard || userState.lastQuizPlayed === todayKey()) return;

  const correct = selectedName === currentQuizCard.name;
  userState.lastQuizPlayed = todayKey();
  if (correct) userState.credits += QUIZ_REWARD;
  saveProgress();
  updateUI();

  byId('quiz-photo').classList.add('revealed');
  byId('quiz-options').querySelectorAll('.quiz-option').forEach(option => {
    option.disabled = true;
    if (option.textContent === currentQuizCard.name) option.classList.add('correct');
  });
  if (!correct) btn.classList.add('wrong');

  setTimeout(() => {
    closeModal('quiz-modal');
    if (correct) {
      showPopup('Risposta esatta! 🎉', `Complimenti! Hai indovinato la Crush e vinto +${QUIZ_REWARD} crediti!`, 'fa-solid fa-trophy');
    } else {
      showPopup('Peccato! 😢', `La risposta giusta era ${currentQuizCard.name}. Riprova domani!`, 'fa-solid fa-circle-xmark');
    }
  }, 1800);
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
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const count = WHEEL_PRIZES.length;
  const arc = (2 * Math.PI) / count;
  const radius = canvas.width / 2;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  WHEEL_PRIZES.forEach((prize, i) => {
    const angle = i * arc;
    ctx.beginPath();
    ctx.fillStyle = prize.color;
    ctx.moveTo(radius, radius);
    ctx.arc(radius, radius, radius - 5, angle, angle + arc);
    ctx.lineTo(radius, radius);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.save();
    ctx.translate(radius, radius);
    ctx.rotate(angle + arc / 2);
    ctx.textAlign = 'right';
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 15px sans-serif';
    ctx.shadowColor = 'rgba(0,0,0,0.55)';
    ctx.shadowBlur = 4;
    ctx.fillText(prize.label, radius - 18, 5);
    ctx.restore();
  });

  ctx.beginPath();
  ctx.arc(radius, radius, 24, 0, 2 * Math.PI);
  ctx.fillStyle = '#120A18';
  ctx.fill();
  ctx.strokeStyle = '#ff5fa8'; // il canvas non legge le variabili CSS
  ctx.lineWidth = 3;
  ctx.stroke();
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
    let pool = cardsDatabase.filter(c => !isUnlocked(c.id) && (c.rarity === 'RARA' || c.rarity === 'LEGGENDARIA'));
    if (pool.length === 0) pool = cardsDatabase.filter(c => !isUnlocked(c.id));
    if (pool.length > 0) {
      wonCard = randomItem(pool);
      unlockCard(wonCard.id);
    } else {
      bonusCredits = 200;
      userState.credits += bonusCredits;
    }
  }
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
  const ratio = cardsDatabase.length > 0 ? userState.unlockedCards.length / cardsDatabase.length : 0;

  let rank = 'Novizia 🌸';
  if (ratio >= 1) rank = 'Sapphic Legend 👑';
  else if (ratio >= 0.75) rank = 'Crush Queen ✨';
  else if (ratio >= 0.5) rank = 'Super Fanatic ⭐';
  else if (ratio >= 0.25) rank = 'Fan Affezionata 💖';
  rankEl.innerText = rank;
}

function updateUI() {
  const total = cardsDatabase.length;
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

  // preferita
  const favSlot = byId('favorite-card-slot');
  if (favSlot) {
    const favCard = userState.favoriteCardId ? cardsDatabase.find(c => c.id === userState.favoriteCardId) : null;
    favSlot.innerHTML = favCard
      ? createCardHTML(favCard)
      : '<p class="empty-fav-text">+ Tocca per scegliere la tua preferita</p>';
  }
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

function openFavoriteSelector() {
  byId('selection-modal-title').innerText = 'Scegli la tua preferita';
  byId('avatar-action-box').innerHTML = '';

  const grid = byId('selection-grid');
  const owned = cardsDatabase.filter(c => isUnlocked(c.id));
  grid.innerHTML = owned.length === 0
    ? '<p class="selection-empty">Sblocca prima qualche card per sceglierne una preferita!</p>'
    : owned.map(card => `
        <div class="selection-item" style="background-image: url('${card.img}')" onclick="selectFavoriteCard(${card.id})">
          <span>${card.name}</span>
        </div>
      `).join('');

  byId('selection-modal').classList.remove('hidden');
}

function selectFavoriteCard(cardId) {
  userState.favoriteCardId = cardId;
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