/* ==========================================================================
   script.js — DATI e STATO di Crush Cards

   Qui ci sono solo le collezioni, le buste, le card e lo stato iniziale.
   Tutta la logica (schermate, giochi, shop, salvataggio) sta in app.js,
   che va caricato DOPO questo file.
   Per aggiungere una card: copia una riga di cardsDatabase, cambia id (unico!),
   collectionId, name, category, rarity (COMUNE / RARA / LEGGENDARIA), price e img.
   ========================================================================== */

/* ---------- SALVATAGGIO (LocalStorage) ---------- */
function loadProgress() {
  try {
    const saved = localStorage.getItem('crush_cards_userstate');
    const parsed = saved ? JSON.parse(saved) : null;
    return parsed && typeof parsed === 'object' ? parsed : null;
  } catch (err) {
    // salvataggio rovinato: riparto da zero invece di bloccare l'app
    console.warn('Salvataggio non leggibile, riparto da zero:', err);
    return null;
  }
}

/* ---------- STATO UTENTE ---------- */
let userState = loadProgress() || {
  credits: 500,
  username: "SapphicCollector",
  unlockedCards: [],
  favoriteCardId: null,
  avatarImg: null,
  lastFreeClaim: 0,
  lastQuizPlayed: "",
  lastWheelPlayed: "",
  streakDays: 0,
  lastStreakClaimDate: "",
  quizDate: "",
  quizCardId: null,
  quizOptions: null
};

/* ---------- STATO TEMPORANEO (non salvato) ---------- */
let pendingPurchaseCardId = null;
let pendingPurchasePackId = null;
let activePackCards = [];
let currentCollectionId = null;
let currentQuizCard = null;
let albumState = {
  currentPage: 1,
  cardsPerPage: 16
};

// DATABASE COLLEZIONI
const collectionsDatabase = [
  {
    id: "rose-special",
    title: "Rosé Collection 🌹",
    description: "Rosie",
    coverImg: "https://i.pinimg.com/736x/f2/63/f3/f263f32988235a3e323bc0aaab72f1ae.jpg"
  },
  {
    id: "lisa-special",
    title: "Lisa Collection ✨",
    description: "LaLisa",
    coverImg: "https://i.pinimg.com/736x/08/8d/ae/088daefe328d5f8798d653a1ad6fef8d.jpg"
  },
  {
    id: "jennie-special",
    title: "Jennie Collection 🖤",
    description: "Jennie",
    coverImg: "https://i.pinimg.com/736x/12/0d/19/120d19a6e8183cff604483171d29d90b.jpg"
  },
  {
    id: "jisoo-special",
    title: "Jisoo Collection 💜",
    description: "Jisoo",
    coverImg: "https://i.pinimg.com/736x/fb/f5/e7/fbf5e7bf4ca7257479c196ee444fc4b2.jpg"
  },
  {
    id: "blackpink",
    title: "BLACKPINK Collection 🎼",
    description: "Jennie, Rosé, Lisa, Jisoo & Ships",
    coverImg: "https://i.pinimg.com/736x/af/cf/4a/afcf4a0a45a884ae79b2f6008277490d.jpg"
  },
  {
    id: "special-popstar",
    title: "Pop Queens & Icons 🎤",
    description: "Dua Lipa, Rosalía & Special Edition",
    coverImg: "https://i.pinimg.com/736x/60/15/1e/60151ef9c3ea65f3deaa9541c3afca60.jpg"
  },
  {
    id: "special-actress",
    title: "Hollywood Star 🎞",
    description: "MilkLove, LMSY & Iconic Duos",
    coverImg: "https://i.pinimg.com/1200x/27/48/23/274823e7d3332903bfb1a1436fe2607c.jpg"
  },
  {
    id: "special-ships",
    title: "GL Actresses 💖",
    description: "Fav GL Thai Actresses",
    coverImg: "https://i.pinimg.com/1200x/f6/d2/64/f6d264e794b84f6cd06e2a9ded9ba276.jpg"
  },
  {
     id: "gl-ships",
     title: "GL Thai Ships 👩🏻‍🤝‍👩🏻",
     description: "Le coppie GL più amate",
     coverImg: "https://i.pinimg.com/736x/39/fd/54/39fd54a2ad48238460e021f8296eaeee.jpg"
  },
  {
    id: 'xmas-2026',
    title: 'Natale 2026 🎄',
    description: 'Edizione limitata',
    coverImg: 'INCOLLA-QUI-URL-COPERTINA'
  }
];

// DATABASE BUSTE / PACKS GACHA
const packsDatabase = [
  {
  id: "pack-bp-debut",
  name: "BLACKPINK Pack 🖤🩷",
  price: 150,
  cover: "https://i.pinimg.com/736x/af/cf/4a/afcf4a0a45a884ae79b2f6008277490d.jpg",
  collectionIds: ["blackpink", "rose-special", "lisa-special", "jennie-special", "jisoo-special"],
  cardCount: 3
},
  {
    id: "pack-pop-icon",
    name: "Pop Queens Album Pack 🎤",
    price: 200,
    cover: "https://i.pinimg.com/736x/60/15/1e/60151ef9c3ea65f3deaa9541c3afca60.jpg",
    collectionId: "special-popstar",
    cardCount: 3
  },
  {
    id: "pack-movies",
    name: "Hollywood Stars Pack 🎬",
    price: 180,
    cover: "https://i.pinimg.com/1200x/27/48/23/274823e7d3332903bfb1a1436fe2607c.jpg",
    collectionId: "special-actress",
    cardCount: 3
  },
  {
    id: "pack-gl-ships",
    name: "GL Actresses & Ships Pack 💖",
    price: 220,
    cover: "https://i.pinimg.com/736x/39/fd/54/39fd54a2ad48238460e021f8296eaeee.jpg",
       collectionIds: ["special-ships", "gl-ships"],
    cardCount: 3
  },
  {
    id: 'pack-xmas',
    name: 'Busta di Natale',
    price: 200,
    cover: 'INCOLLA-QUI-URL-BUSTA',
    collectionId: 'xmas-2026',
    cardCount: 3
  }
];

// DATABASE CARD
const cardsDatabase = [
  // --- BLACKPINK COLLECTION ---
  { id: 1, collectionId: "blackpink", name: "BLACKPINK", category: "Group", rarity: "COMUNE", price: 50, img: "https://i.pinimg.com/1200x/66/66/3a/66663abafc26eb88fe45e3341d240e55.jpg" },
  { id: 2, collectionId: "blackpink", name: "BLACKPINK", category: "Group", rarity: "COMUNE", price: 50, img: "https://i.pinimg.com/736x/76/ea/ed/76eaede86a855c4ecff823d0833ac0b7.jpg" },
  { id: 3, collectionId: "blackpink", name: "BLACKPINK", category: "Group", rarity: "COMUNE", price: 50, img: "https://i.pinimg.com/1200x/4d/53/c8/4d53c8fcbf423a434020e4a8bd571227.jpg" },
  { id: 4, collectionId: "blackpink", name: "BLACKPINK", category: "Group", rarity: "COMUNE", price: 50, img: "https://i.pinimg.com/1200x/71/d7/e6/71d7e6611c999e3701167743b64cad2e.jpg" },
  { id: 5, collectionId: "blackpink", name: "BLACKPINK", category: "Group", rarity: "COMUNE", price: 50, img: "https://i.pinimg.com/736x/cb/6d/d9/cb6dd9cee94a31e2ac280c28e006c583.jpg" },
  { id: 6, collectionId: "blackpink", name: "BLACKPINK", category: "Group", rarity: "COMUNE", price: 50, img: "https://i.pinimg.com/736x/42/a1/3b/42a13b6e9d1e6c44f66931ac564c67f2.jpg" },
  { id: 7, collectionId: "blackpink", name: "BLACKPINK", category: "Group", rarity: "COMUNE", price: 50, img: "https://i.pinimg.com/736x/90/0d/03/900d03a5834a87335dcb542e617ededd.jpg" },
  { id: 8, collectionId: "blackpink", name: "BLACKPINK", category: "Group", rarity: "COMUNE", price: 50, img: "https://i.pinimg.com/736x/2e/65/2c/2e652c4189262795f8f2a2b567c1ac04.jpg" },
  { id: 9, collectionId: "blackpink", name: "BLACKPINK", category: "Group", rarity: "COMUNE", price: 50, img: "https://i.pinimg.com/1200x/bc/da/e5/bcdae525ab8d5889a3a7b0481329c00e.jpg" },
  { id: 10, collectionId: "blackpink", name: "BLACKPINK", category: "Group", rarity: "COMUNE", price: 50, img: "https://i.pinimg.com/736x/38/e2/75/38e27581a5b69eaa3e3350a0a45dc18b.jpg" },
  { id: 11, collectionId: "blackpink", name: "BLACKPINK", category: "Group", rarity: "COMUNE", price: 50, img: "https://i.pinimg.com/736x/e5/72/87/e572878d215adeb1eff4c77dc33ba2c0.jpg" },
  { id: 12, collectionId: "blackpink", name: "BLACKPINK", category: "Group", rarity: "COMUNE", price: 50, img: "https://i.pinimg.com/736x/62/96/a9/6296a91a5ac35f77b58ee5f92354fd34.jpg" },
  { id: 13, collectionId: "blackpink", name: "BLACKPINK", category: "Group", rarity: "COMUNE", price: 50, img: "https://i.pinimg.com/736x/c3/77/04/c37704506beb9d9af5d5860511122070.jpg" },
  { id: 14, collectionId: "blackpink", name: "BLACKPINK", category: "Group", rarity: "COMUNE", price: 50, img: "https://i.pinimg.com/736x/ad/b4/a9/adb4a99c25410020ae7c93cb27638d95.jpg" },
  { id: 15, collectionId: "blackpink", name: "BLACKPINK", category: "Group", rarity: "COMUNE", price: 50, img: "https://i.pinimg.com/1200x/c7/7b/7e/c77b7e0aa06d5b02e0fb79096f69580b.jpg" },
  { id: 16, collectionId: "blackpink", name: "BLACKPINK", category: "Group", rarity: "COMUNE", price: 50, img: "https://i.pinimg.com/736x/7b/55/f2/7b55f212d44cedb20fc24b5e96b76ab2.jpg" },
  { id: 17, collectionId: "blackpink", name: "BLACKPINK", category: "Group", rarity: "RARA", price: 150, img:"https://i.pinimg.com/736x/8c/6a/25/8c6a25bf9ef90d5ae1dd1ad355e1b51f.jpg"},
  { id: 18, collectionId: "blackpink", name: "BLACKPINK", category: "Group", rarity: "RARA", price: 150, img:"https://i.pinimg.com/736x/35/28/aa/3528aaa14fe9372277928a20de3e6fea.jpg"},
  { id: 19, collectionId: "blackpink", name: "BLACKPINK", category: "Group", rarity: "RARA", price: 150, img:"https://i.pinimg.com/736x/29/8e/4c/298e4c840d3130a22c19cb7b8535f9bb.jpg"},
  { id: 20, collectionId: "blackpink", name: "BLACKPINK", category: "Group", rarity: "RARA", price: 150, img:"https://i.pinimg.com/736x/c5/00/73/c500732abd5f43a3785af30c63b9a3ca.jpg"},
  { id: 21, collectionId: "blackpink", name: "BLACKPINK", category: "Group", rarity: "RARA", price: 150, img:"https://i.pinimg.com/736x/6f/17/a6/6f17a655b1407d668a5cce14f9fc5372.jpg"},
  { id: 22, collectionId: "blackpink", name: "BLACKPINK", category: "Group", rarity: "RARA", price: 150, img:"https://i.pinimg.com/1200x/81/7a/3b/817a3b285080cc19b2acd6677a4375cd.jpg"},
  { id: 23, collectionId: "blackpink", name: "BLACKPINK", category: "Group", rarity: "RARA", price: 150, img:"https://i.pinimg.com/1200x/52/41/7f/52417f7006e0dd66d96b367636a75a96.jpg"},
  { id: 24, collectionId: "blackpink", name: "BLACKPINK", category: "Group", rarity: "RARA", price: 150, img:"https://i.pinimg.com/736x/5f/1f/3c/5f1f3c4e6d5efe46a4e848c9dab2d0e5.jpg"},
  { id: 25, collectionId: "blackpink", name: "BLACKPINK", category: "Group", rarity: "RARA", price: 150, img: "https://i.pinimg.com/1200x/e9/67/a8/e967a888fb8aaa9feb88a7b1214abf1d.jpg" },
  { id: 26, collectionId: "blackpink", name: "BLACKPINK", category: "Group", rarity: "RARA", price: 150, img: "https://i.pinimg.com/736x/a3/04/70/a30470eeb1a1bedb3394bfe66a3233fd.jpg" },
  { id: 27, collectionId: "blackpink", name: "BLACKPINK", category: "Group", rarity: "RARA", price: 150, img: "https://i.pinimg.com/736x/bd/ac/18/bdac18b06efd4f06a95316c32180c903.jpg" },
  { id: 28, collectionId: "blackpink", name: "BLACKPINK", category: "Group", rarity: "RARA", price: 150, img: "https://i.pinimg.com/1200x/c7/a8/e6/c7a8e6d1c6f957c857986aed871f16e7.jpg" },
  { id: 29, collectionId: "blackpink", name: "BLACKPINK", category: "Group", rarity: "LEGGENDARIA", price: 500, img: "https://i.pinimg.com/736x/37/dd/20/37dd2067640b87d6dfad9ace697e7b8e.jpg" },
  { id: 30, collectionId: "blackpink", name: "BLACKPINK", category: "Group", rarity: "LEGGENDARIA", price: 500, img: "https://i.pinimg.com/736x/15/57/51/15575178a3f78fa7aa62bef86a3da741.jpg" },
  { id: 31, collectionId: "blackpink", name: "BLACKPINK", category: "Group", rarity: "LEGGENDARIA", price: 500, img: "https://i.pinimg.com/1200x/47/58/a1/4758a12f18375060a3b43cc075e805b8.jpg" },
  { id: 32, collectionId: "blackpink", name: "BLACKPINK", category: "Group", rarity: "LEGGENDARIA", price: 500, img: "https://i.pinimg.com/736x/0a/d0/74/0ad07411224d74851fd845a89335bb4b.jpg" },
  // --- BLACKPINK MOMENTS & SHIPS ---
  { id: 33, collectionId: "blackpink", name: "Jensoo", category: "Ship", rarity: "COMUNE", price: 50, img: "https://i.pinimg.com/1200x/64/91/05/6491055ddfc182c32300f3918a9256c9.jpg" },
  { id: 34, collectionId: "blackpink", name: "Jensoo", category: "Ship", rarity: "COMUNE", price: 50, img: "https://i.pinimg.com/736x/ff/5a/8a/ff5a8af48cf49dfdbe0a7599759dfff5.jpg" },
  { id: 35, collectionId: "blackpink", name: "Jensoo", category: "Ship", rarity: "COMUNE", price: 50, img: "https://i.pinimg.com/736x/11/6d/17/116d17070745a74ec5adb58d456753a8.jpg" },
  { id: 36, collectionId: "blackpink", name: "Jensoo", category: "Ship", rarity: "COMUNE", price: 50, img: "https://i.pinimg.com/736x/0e/af/9e/0eaf9e829cf2f4d8355b83a704999a38.jpg" },
  { id: 37, collectionId: "blackpink", name: "Chaelisa", category: "Ship", rarity: "COMUNE", price: 50, img: "https://i.pinimg.com/736x/6b/90/1b/6b901b3647f54542e44a8b653bd15024.jpg" },
  { id: 38, collectionId: "blackpink", name: "Chaelisa", category: "Ship", rarity: "COMUNE", price: 50, img: "https://i.pinimg.com/736x/7a/46/0b/7a460bf5a89bec40a9c25082990c82ff.jpg" },
  { id: 39, collectionId: "blackpink", name: "Chaelisa", category: "Ship", rarity: "COMUNE", price: 50, img: "https://i.pinimg.com/736x/03/1c/12/031c12291d20b038470ae89e48885269.jpg" },
  { id: 40, collectionId: "blackpink", name: "Chaelisa", category: "Ship", rarity: "COMUNE", price: 50, img: "https://i.pinimg.com/736x/1a/05/e8/1a05e8bb5689b7cd75b5ff2d5f330357.jpg" },
  { id: 41, collectionId: "blackpink", name: "Jenlisa", category: "Ship", rarity: "COMUNE", price: 50, img: "https://i.pinimg.com/1200x/16/c8/b7/16c8b7021490d2a746840204b1d1b448.jpg" },
  { id: 42, collectionId: "blackpink", name: "Jenlisa", category: "Ship", rarity: "COMUNE", price: 50, img: "https://i.pinimg.com/736x/f3/21/f5/f321f596c72934fcbf4df254f045524e.jpg"},
  { id: 43, collectionId: "blackpink", name: "Jenlisa", category: "Ship", rarity: "COMUNE", price: 50, img: "https://i.pinimg.com/736x/30/de/cf/30decfe6d509b11cabbde1faf2765465.jpg" },
  { id: 44, collectionId: "blackpink", name: "Jenlisa", category: "Ship", rarity: "COMUNE", price: 50, img: "https://i.pinimg.com/736x/06/8f/d9/068fd9b1ba3f0ecab771c3d6f794abb0.jpg" },
  { id: 45, collectionId: "blackpink", name: "Chaesoo", category: "Ship", rarity: "COMUNE", price: 50, img: "https://i.pinimg.com/736x/8b/2f/66/8b2f664770174e32905ba0ec7df27375.jpg" },
  { id: 46, collectionId: "blackpink", name: "Chaesoo", category: "Ship", rarity: "COMUNE", price: 50, img: "https://i.pinimg.com/736x/2e/c8/c5/2ec8c5636062e8ba0e7aa02221d3b02b.jpg" },
  { id: 47, collectionId: "blackpink", name: "Chaesoo", category: "Ship", rarity: "COMUNE", price: 50, img: "https://i.pinimg.com/736x/aa/5f/73/aa5f73a05acffa54e2bf1dfa0c9e193b.jpg" },
  { id: 48, collectionId: "blackpink", name: "Chaesoo", category: "Ship", rarity: "COMUNE", price: 50, img: "https://i.pinimg.com/736x/c6/cd/fd/c6cdfd086b4376d1740180baf240733a.jpg" },
  { id: 49, collectionId: "blackpink", name: "Chaennie", category: "Ship", rarity: "COMUNE", price: 50, img: "https://i.pinimg.com/736x/12/81/a2/1281a2c031ec3684f142d6113ffa1e20.jpg" },
  { id: 50, collectionId: "blackpink", name: "Chaennie", category: "Ship", rarity: "COMUNE", price: 50, img: "https://i.pinimg.com/736x/ba/e4/01/bae401b341552abd3a405a8662ad06b3.jpg" },
  { id: 51, collectionId: "blackpink", name: "Chaennie", category: "Ship", rarity: "COMUNE", price: 50, img: "https://i.pinimg.com/736x/20/c4/b2/20c4b23082e23ddeb046d213905b5186.jpg" },
  { id: 52, collectionId: "blackpink", name: "Chaennie", category: "Ship", rarity: "COMUNE", price: 50, img: "https://i.pinimg.com/736x/66/bf/1e/66bf1edddfa94199596888296a218047.jpg" },
  { id: 53, collectionId: "blackpink", name: "Lisoo", category: "Ship", rarity: "COMUNE", price: 50, img: "https://i.pinimg.com/736x/df/57/fb/df57fb6dfb8a214147a08108ef588cb5.jpg" },
  { id: 54, collectionId: "blackpink", name: "Lisoo", category: "Ship", rarity: "COMUNE", price: 50, img: "https://i.pinimg.com/736x/e7/bc/e4/e7bce4761f71c37428d715db5b85aa09.jpg" },
  { id: 55, collectionId: "blackpink", name: "Lisoo", category: "Ship", rarity: "COMUNE", price: 50, img: "https://i.pinimg.com/736x/28/58/98/285898412e863fbf082051b4134ddfb7.jpg" },
  { id: 56, collectionId: "blackpink", name: "Lisoo", category: "Ship", rarity: "COMUNE", price: 50, img: "https://i.pinimg.com/736x/09/eb/81/09eb81ef619752029478c51686b56f59.jpg" },
  { id: 57, collectionId: "blackpink", name: "Backstage", category: "Moments", rarity: "RARA", price: 150, img: "https://i.pinimg.com/736x/31/11/ae/3111aec6991fd522725538c6f8fea2c7.jpg" }, 
  { id: 58, collectionId: "blackpink", name: "Met Gala", category: "Moments", rarity: "RARA", price: 150, img: "https://i.pinimg.com/736x/17/be/25/17be25b66c5759803d6d7954e3f678c7.jpg" }, 
  { id: 59, collectionId: "blackpink", name: "Coachella", category: "Moments", rarity: "RARA", price: 150, img: "https://i.pinimg.com/736x/1f/ff/ba/1fffbabe8dd9b2e07b7f3bffd54f2d48.jpg" }, 
  { id: 60, collectionId: "blackpink", name: "Met Gala", category: "Moments", rarity: "RARA", price: 150, img: "https://i.pinimg.com/1200x/2a/aa/cd/2aaacd9093ff75216136dd377f85ff1a.jpg" },
  { id: 61, collectionId: "blackpink", name: "Event", category: "Moments", rarity: "RARA", price: 150, img: "https://i.pinimg.com/736x/63/a9/d3/63a9d31df13d531fb86498c6e3af1547.jpg" },
  { id: 62, collectionId: "blackpink", name: "Tour", category: "Moments", rarity: "RARA", price: 150, img: "https://i.pinimg.com/736x/39/44/33/394433696f70386a60d84e22366008e0.jpg" },
  { id: 63, collectionId: "blackpink", name: "Backstage", category: "Moments", rarity: "RARA", price: 150, img: "https://i.pinimg.com/736x/a2/17/c7/a217c7c87d08b27a31a78151b456b169.jpg" },
  { id: 64, collectionId: "blackpink", name: "Home", category: "Moments", rarity: "RARA", price: 150, img: "https://i.pinimg.com/736x/e5/c2/ac/e5c2ac2a90cb13e221f4819ce9b7ea6b.jpg" },
  // --- JISOO ---
  { id: 65, collectionId: "jisoo-special", name: "Jisoo", category: "Cantante", rarity: "COMUNE", price: 50, img: "https://i.pinimg.com/1200x/65/cb/c8/65cbc8f310a265b8c76a8d0979ec3659.jpg" },
  { id: 66, collectionId: "jisoo-special", name: "Jisoo", category: "Cantante", rarity: "COMUNE", price: 50, img: "https://i.pinimg.com/736x/bc/02/ab/bc02abb2fafc38d7e1fdf8cb4801a99a.jpg" },
  { id: 67, collectionId: "jisoo-special", name: "Jisoo", category: "Cantante", rarity: "COMUNE", price: 50, img: "https://i.pinimg.com/736x/af/ac/23/afac23553e4b0571dcbf295f8484b48d.jpg" },
  { id: 68, collectionId: "jisoo-special", name: "Jisoo", category: "Cantante", rarity: "COMUNE", price: 50, img: "https://i.pinimg.com/736x/89/42/8b/89428b3e055e1f520f598c9159904b1a.jpg" },
  { id: 69, collectionId: "jisoo-special", name: "Jisoo", category: "Cantante", rarity: "COMUNE", price: 50, img: "https://i.pinimg.com/1200x/4a/61/bf/4a61bf32663f8c09875008692f87f082.jpg" },
  { id: 70, collectionId: "jisoo-special", name: "Jisoo", category: "Cantante", rarity: "COMUNE", price: 50, img: "https://i.pinimg.com/736x/00/49/65/0049656b784a3ded58f15f0013364b89.jpg" },
  { id: 71, collectionId: "jisoo-special", name: "Jisoo", category: "Cantante", rarity: "COMUNE", price: 50, img: "https://i.pinimg.com/1200x/34/00/eb/3400ebde571231097d608de658a6e96e.jpg" },
  { id: 72, collectionId: "jisoo-special", name: "Jisoo", category: "Cantante", rarity: "COMUNE", price: 50, img: "https://i.pinimg.com/736x/79/ab/71/79ab713fb87a64b90347dde66b7ad7ba.jpg" },
  { id: 73, collectionId: "jisoo-special", name: "Jisoo", category: "Cantante", rarity: "COMUNE", price: 50, img: "https://i.pinimg.com/1200x/d7/a6/42/d7a6421cce73276662b24db770e81154.jpg" },
  { id: 74, collectionId: "jisoo-special", name: "Jisoo", category: "Cantante", rarity: "COMUNE", price: 50, img: "https://i.pinimg.com/736x/09/c8/2d/09c82d256536613a6a433dc5d2e729a9.jpg" },
  { id: 75, collectionId: "jisoo-special", name: "Jisoo", category: "Cantante", rarity: "COMUNE", price: 50, img: "https://i.pinimg.com/736x/00/a0/d7/00a0d733b442e7105738bf29e1b360a7.jpg" },
  { id: 76, collectionId: "jisoo-special", name: "Jisoo", category: "Cantante", rarity: "COMUNE", price: 50, img: "https://i.pinimg.com/736x/c7/97/e8/c797e8ec40cde500c23b9ed1f65d75c1.jpg" },
  { id: 77, collectionId: "jisoo-special", name: "Jisoo", category: "Cantante", rarity: "COMUNE", price: 50, img: "https://i.pinimg.com/736x/75/bb/b1/75bbb1eb00fd88953fc902f84d01b543.jpg" },
  { id: 78, collectionId: "jisoo-special", name: "Jisoo", category: "Cantante", rarity: "COMUNE", price: 50, img: "https://i.pinimg.com/736x/07/a3/c9/07a3c92908851d25b308ac7b83d0ac64.jpg" },
  { id: 79, collectionId: "jisoo-special", name: "Jisoo", category: "Cantante", rarity: "COMUNE", price: 50, img: "https://i.pinimg.com/736x/ac/4e/50/ac4e508a9ae18ef0f69176ca4de06fba.jpg" },
  { id: 80, collectionId: "jisoo-special", name: "Jisoo", category: "Cantante", rarity: "COMUNE", price: 50, img: "https://i.pinimg.com/736x/eb/b3/c8/ebb3c82323de9c8b5cbf489d39966adf.jpg" },
  { id: 81, collectionId: "jisoo-special", name: "Jisoo", category: "Cantante", rarity: "RARA", price: 150, img: "https://i.pinimg.com/736x/13/8c/76/138c76e2193c76f4d9dd02be1bf3290c.jpg" },
  { id: 82, collectionId: "jisoo-special", name: "Jisoo", category: "Cantante", rarity: "RARA", price: 150, img: "https://i.pinimg.com/736x/0b/fe/40/0bfe404b0180095b2d3dcc9723fc2305.jpg"},
  { id: 83, collectionId: "jisoo-special", name: "Jisoo", category: "Cantante", rarity: "RARA", price: 150, img: "https://i.pinimg.com/736x/f1/6c/91/f16c912c111915014c6aa8deab1e4dab.jpg" },
  { id: 84, collectionId: "jisoo-special", name: "Jisoo", category: "Cantante", rarity: "RARA", price: 150, img: "https://i.pinimg.com/736x/d3/32/1b/d3321b9aa3b38e0eeeed6479ef8c6f4a.jpg" },
  { id: 85, collectionId: "jisoo-special", name: "Jisoo", category: "Cantante", rarity: "RARA", price: 150, img: "https://i.pinimg.com/1200x/67/cc/5d/67cc5de028c8de09ec0f1a94b1785066.jpg" },
  { id: 86, collectionId: "jisoo-special", name: "Jisoo", category: "Cantante", rarity: "RARA", price: 150, img: "https://i.pinimg.com/736x/ae/4e/15/ae4e15b6723db29ba27c31c2ef9e0844.jpg" },
  { id: 87, collectionId: "jisoo-special", name: "Jisoo", category: "Cantante", rarity: "RARA", price: 150, img: "https://i.pinimg.com/736x/46/ef/8c/46ef8cab78357af4bf5fd07022968f6c.jpg" },
  { id: 88, collectionId: "jisoo-special", name: "Jisoo", category: "Cantante", rarity: "RARA", price: 150, img: "https://i.pinimg.com/736x/db/f2/6c/dbf26c9992a737717e3fb10e1a3a9027.jpg" },
  { id: 89, collectionId: "jisoo-special", name: "Jisoo", category: "Cantante", rarity: "RARA", price: 150, img: "https://i.pinimg.com/1200x/b5/c3/ff/b5c3ff80b36c802e46945c1deda70be2.jpg" },
  { id: 90, collectionId: "jisoo-special", name: "Jisoo", category: "Cantante", rarity: "RARA", price: 150, img: "https://i.pinimg.com/736x/e0/5e/b4/e05eb409ae98f4495b5980a007576eef.jpg" },
  { id: 91, collectionId: "jisoo-special", name: "Jisoo", category: "Cantante", rarity: "RARA", price: 150, img: "https://i.pinimg.com/736x/a2/7c/5a/a27c5a4c88ef4985c764e737086b8fc7.jpg" },
  { id: 92, collectionId: "jisoo-special", name: "Jisoo", category: "Cantante", rarity: "RARA", price: 150, img: "https://i.pinimg.com/1200x/11/64/9b/11649bdae963431708f247c351c02606.jpg" },
  { id: 93, collectionId: "jisoo-special", name: "Jisoo", category: "Cantante", rarity: "LEGGENDARIA", price: 500, img: "https://i.pinimg.com/736x/b7/17/f6/b717f693ba733d33503c4e2c188e436e.jpg" },
  { id: 94, collectionId: "jisoo-special", name: "Jisoo", category: "Cantante", rarity: "LEGGENDARIA", price: 500, img: "https://i.pinimg.com/736x/c6/56/c2/c656c2c76d71608f6e141ee8420f3df6.jpg" },
  { id: 95, collectionId: "jisoo-special", name: "Jisoo", category: "Cantante", rarity: "LEGGENDARIA", price: 500, img: "https://i.pinimg.com/736x/84/93/49/8493491ef55bc85496aa4a153775fbf6.jpg" },
  { id: 96, collectionId: "jisoo-special", name: "Jisoo", category: "Cantante", rarity: "LEGGENDARIA", price: 500, img: "https://i.pinimg.com/1200x/ec/74/46/ec74468dc5454f8c1a7b18cc9b2c37eb.jpg" },
  // --- JENNIE ---
  { id: 97, collectionId: "jennie-special", name: "Jennie", category: "Cantante", rarity: "COMUNE", price: 50, img: "https://i.pinimg.com/736x/a2/04/69/a2046902c6396b2e195764768263d532.jpg" },
  { id: 98, collectionId: "jennie-special", name: "Jennie", category: "Cantante", rarity: "COMUNE", price: 50, img: "https://i.pinimg.com/736x/da/09/9a/da099a53a0a527d37fa60495b11aa13e.jpg" },
  { id: 99, collectionId: "jennie-special", name: "Jennie", category: "Cantante", rarity: "COMUNE", price: 50, img: "https://i.pinimg.com/736x/fc/81/dd/fc81ddaa6b0228375920a641b265ce99.jpg" },
  { id: 100, collectionId: "jennie-special", name: "Jennie", category: "Cantante", rarity: "COMUNE", price: 50, img: "https://i.pinimg.com/1200x/4c/2b/be/4c2bbeed599eb1b6a33ede2d0094c502.jpg" }, 
  { id: 101, collectionId: "jennie-special", name: "Jennie", category: "Cantante", rarity: "COMUNE", price: 50, img: "https://i.pinimg.com/736x/78/7f/02/787f023735f674e53ce4d62c7fbc041f.jpg" }, 
  { id: 102, collectionId: "jennie-special", name: "Jennie", category: "Cantante", rarity: "COMUNE", price: 50, img: "https://i.pinimg.com/736x/2a/ea/95/2aea95abd066674d28856c120a7fd4cc.jpg" }, 
  { id: 103, collectionId: "jennie-special", name: "Jennie", category: "Cantante", rarity: "COMUNE", price: 50, img: "https://i.pinimg.com/736x/1f/a2/f0/1fa2f0a71fb305bc36877c042ffd236e.jpg" },
  { id: 104, collectionId: "jennie-special", name: "Jennie", category: "Cantante", rarity: "COMUNE", price: 50, img: "https://i.pinimg.com/736x/e9/5f/6a/e95f6af968e8d4db634ab497d381be97.jpg" },
  { id: 105, collectionId: "jennie-special", name: "Jennie", category: "Cantante", rarity: "COMUNE", price: 50, img: "https://i.pinimg.com/736x/09/ae/11/09ae113baa6189c641d5bc4eacec99e4.jpg" },
  { id: 106, collectionId: "jennie-special", name: "Jennie", category: "Cantante", rarity: "COMUNE", price: 50, img: "https://i.pinimg.com/736x/f6/e9/9f/f6e99fa838909f4897e5dacb07c9f084.jpg"},
  { id: 107, collectionId: "jennie-special", name: "Jennie", category: "Cantante", rarity: "COMUNE", price: 50, img: "https://i.pinimg.com/736x/4f/40/6c/4f406c7fc207afeb6d6c2f7becf08d87.jpg"},
  { id: 108, collectionId: "jennie-special", name: "Jennie", category: "Cantante", rarity: "COMUNE", price: 50, img: "https://i.pinimg.com/1200x/8c/c1/b7/8cc1b785868ba337457e2831c270db0a.jpg"},
  { id: 109, collectionId: "jennie-special", name: "Jennie", category: "Cantante", rarity: "COMUNE", price: 50, img: "https://i.pinimg.com/736x/0d/07/9d/0d079d4b6ef7f3801fe4c6359a61c626.jpg"},
  { id: 110, collectionId: "jennie-special", name: "Jennie", category: "Cantante", rarity: "COMUNE", price: 50, img: "https://i.pinimg.com/736x/00/b8/09/00b809e5dfd059fab29f1026349ac3e7.jpg"},
  { id: 111, collectionId: "jennie-special", name: "Jennie", category: "Cantante", rarity: "COMUNE", price: 50, img: "https://i.pinimg.com/736x/3f/bb/ff/3fbbff571b2c1ed688c69571105928f7.jpg"},
  { id: 112, collectionId: "jennie-special", name: "Jennie", category: "Cantante", rarity: "COMUNE", price: 50, img: "https://i.pinimg.com/1200x/47/b7/ef/47b7ef3359937e07b8ad07ba01756f64.jpg"},
  { id: 113, collectionId: "jennie-special", name: "Jennie", category: "Cantante", rarity: "RARA", price: 150, img: "https://i.pinimg.com/736x/67/a0/3b/67a03b617244d258321c872393ae1c11.jpg" },
  { id: 114, collectionId: "jennie-special", name: "Jennie", category: "Cantante", rarity: "RARA", price: 150, img: "https://i.pinimg.com/1200x/c5/8f/07/c58f072b54ca6060c68ae8ee084d9483.jpg" },
  { id: 115, collectionId: "jennie-special", name: "Jennie", category: "Cantante", rarity: "RARA", price: 150, img: "https://i.pinimg.com/1200x/24/13/23/241323b08533bc8cbdfda6b705aa7dfb.jpg" },
  { id: 116, collectionId: "jennie-special", name: "Jennie", category: "Cantante", rarity: "RARA", price: 150, img: "https://i.pinimg.com/736x/1e/d8/83/1ed883b40d2595a3b9237d7bf5769b65.jpg" },
  { id: 117, collectionId: "jennie-special", name: "Jennie", category: "Cantante", rarity: "RARA", price: 150, img: "https://i.pinimg.com/736x/76/61/15/76611577c7bcdc7e9a4bb74dd0ceb5e8.jpg" },
  { id: 118, collectionId: "jennie-special", name: "Jennie", category: "Cantante", rarity: "RARA", price: 150, img: "https://i.pinimg.com/1200x/22/2a/ae/222aae385deb49daeb252120c9b9fcb5.jpg" },
  { id: 119, collectionId: "jennie-special", name: "Jennie", category: "Cantante", rarity: "RARA", price: 150, img: "https://i.pinimg.com/736x/b8/cc/b4/b8ccb45063c04bb00859d17f5cae677e.jpg"},
  { id: 120, collectionId: "jennie-special", name: "Jennie", category: "Cantante", rarity: "RARA", price: 150, img: "https://www.pap-magazine.com/_vercel/image?url=https%3A%2F%2Figcazquhkwxtqsaqpznx.supabase.co%2Fstorage%2Fv1%2Fobject%2Fpublic%2Fmedia%2Fig-articles%2F17900278533655582%2F8.jpg&w=960&q=75"},
  { id: 121, collectionId: "jennie-special", name: "Jennie", category: "Cantante", rarity: "RARA", price: 150, img: "https://i.pinimg.com/736x/14/0d/61/140d61733e340cf91993d42106d0525f.jpg"},
  { id: 122, collectionId: "jennie-special", name: "Jennie", category: "Cantante", rarity: "RARA", price: 150, img: "https://i.pinimg.com/736x/3f/34/fd/3f34fd8783c4b27b1fe484d93aff3e22.jpg"},
  { id: 123, collectionId: "jennie-special", name: "Jennie", category: "Cantante", rarity: "RARA", price: 150, img: "https://i.pinimg.com/736x/2d/34/7b/2d347b131aeb1c1713f400d914cb0232.jpg" },
  { id: 124, collectionId: "jennie-special", name: "Jennie", category: "Cantante", rarity: "RARA", price: 150, img: "https://i.pinimg.com/736x/ea/22/3e/ea223eb3f9a795bfd011dced3821ab94.jpg" }, 
  { id: 125, collectionId: "jennie-special", name: "Jennie", category: "Cantante", rarity: "LEGGENDARIA", price: 500, img: "https://i.pinimg.com/736x/0d/e3/f3/0de3f33dfb2fbfb8ceb2986a6a7dc6bb.jpg" },
  { id: 126, collectionId: "jennie-special", name: "Jennie", category: "Cantante", rarity: "LEGGENDARIA", price: 500, img: "https://i.pinimg.com/1200x/ba/96/5b/ba965b3aa8af1f9c86cf3c792d33582a.jpg" },
  { id: 127, collectionId: "jennie-special", name: "Jennie", category: "Cantante", rarity: "LEGGENDARIA", price: 500, img: "https://i.pinimg.com/1200x/f3/11/37/f311375f619ee6560e692cdc3ab5b0e9.jpg" },
  { id: 128, collectionId: "jennie-special", name: "Jennie", category: "Cantante", rarity: "LEGGENDARIA", price: 500, img: "https://i.pinimg.com/736x/5c/51/6d/5c516d563c6d19230343fe9d01440fdd.jpg" },
  // --- LISA ---
  { id: 129, collectionId: "lisa-special", name: "Lisa", category: "Cantante", rarity: "COMUNE", price: 50, img:"https://i.pinimg.com/736x/41/b4/0a/41b40a1b2749bc472ef7100f5e1f2386.jpg" },
  { id: 130, collectionId: "lisa-special", name: "Lisa", category: "Cantante", rarity: "COMUNE", price: 50, img:"https://i.pinimg.com/736x/75/62/1c/75621ca37ac11aaaee5a57952ad364e8.jpg" },
  { id: 131, collectionId: "lisa-special", name: "Lisa", category: "Cantante", rarity: "COMUNE", price: 50, img:"https://i.pinimg.com/736x/db/c6/2d/dbc62de8d28b8219be5bd4c151be0cd5.jpg" },
  { id: 132, collectionId: "lisa-special", name: "Lisa", category: "Cantante", rarity: "COMUNE", price: 50, img:"https://i.pinimg.com/736x/89/88/95/8988950e95ba3cde918c15093d7b8032.jpg" },
  { id: 133, collectionId: "lisa-special", name: "Lisa", category: "Cantante", rarity: "COMUNE", price: 50, img:"https://i.pinimg.com/736x/dd/3d/35/dd3d351895071fc236fb006393b38849.jpg" },
  { id: 134, collectionId: "lisa-special", name: "Lisa", category: "Cantante", rarity: "COMUNE", price: 50, img:"https://i.pinimg.com/736x/b2/de/3f/b2de3ffafcc6602091ab3982352f0044.jpg" },
  { id: 135, collectionId: "lisa-special", name: "Lisa", category: "Cantante", rarity: "COMUNE", price: 50, img: "https://i.pinimg.com/1200x/98/be/e9/98bee974d9537df66c7646c90e244bef.jpg" },
  { id: 136, collectionId: "lisa-special", name: "Lisa", category: "Cantante", rarity: "COMUNE", price: 50, img: "https://i.pinimg.com/736x/00/fc/e3/00fce3cb102ffae52f3966f75bd14266.jpg" },
  { id: 137, collectionId: "lisa-special", name: "Lisa", category: "Cantante", rarity: "COMUNE", price: 50, img: "https://i.pinimg.com/736x/87/45/0f/87450fd87c903bb61b10e7fa730520c4.jpg" },
  { id: 138, collectionId: "lisa-special", name: "Lisa", category: "Cantante", rarity: "COMUNE", price: 50, img: "https://i.pinimg.com/736x/90/ab/de/90abde13232dfe11c9e28baa3683bd7d.jpg" },
  { id: 139, collectionId: "lisa-special", name: "Lisa", category: "Cantante", rarity: "COMUNE", price: 50, img: "https://i.pinimg.com/736x/8f/f9/10/8ff9108be2ad8f5799943dfb437b79c5.jpg" },
  { id: 140, collectionId: "lisa-special", name: "Lisa", category: "Cantante", rarity: "COMUNE", price: 50, img: "https://i.pinimg.com/736x/3f/6a/f8/3f6af8aed04bf82e1d4f69cafc07bcf1.jpg" },
  { id: 141, collectionId: "lisa-special", name: "Lisa", category: "Cantante", rarity: "COMUNE", price: 50, img: "https://i.pinimg.com/1200x/98/14/19/9814197d9f570cf2379eeb645b895517.jpg" },
  { id: 142, collectionId: "lisa-special", name: "Lisa", category: "Cantante", rarity: "COMUNE", price: 50, img: "https://i.pinimg.com/736x/77/7d/d4/777dd4c574c4aa3f4834bd67916f0b14.jpg" },
  { id: 143, collectionId: "lisa-special", name: "Lisa", category: "Cantante", rarity: "COMUNE", price: 50, img: "https://i.pinimg.com/736x/33/c2/80/33c280e2cecd902cbb1ef77321468d77.jpg" },
  { id: 144, collectionId: "lisa-special", name: "Lisa", category: "Cantante", rarity: "COMUNE", price: 50, img: "https://i.pinimg.com/736x/fc/5e/b5/fc5eb50eb8fd111bf3c0e5d8c0ca1ecd.jpg" },
  { id: 145, collectionId: "lisa-special", name: "Lisa", category: "Cantante", rarity: "RARA", price: 150, img: "https://i.pinimg.com/1200x/86/1b/f0/861bf0c5a95e3c1a77eb8a56a5e50b58.jpg" },
  { id: 146, collectionId: "lisa-special", name: "Lisa", category: "Cantante", rarity: "RARA", price: 150, img: "https://i.pinimg.com/736x/dc/47/4c/dc474c27d8ad198a84e8d46eee9c3fa5.jpg" },
  { id: 147, collectionId: "lisa-special", name: "Lisa", category: "Cantante", rarity: "RARA", price: 150, img: "https://i.pinimg.com/736x/f4/90/9a/f4909a3a703b5ea202780f6589768dc3.jpg" },
  { id: 148, collectionId: "lisa-special", name: "Lisa", category: "Cantante", rarity: "RARA", price: 150, img: "https://i.pinimg.com/1200x/06/a8/a9/06a8a94b01e1d7cb082321a3ba82d590.jpg" },
  { id: 149, collectionId: "lisa-special", name: "Lisa", category: "Cantante", rarity: "RARA", price: 150, img: "https://i.pinimg.com/736x/c6/75/0c/c6750cac690abc3626c049acb8d531f7.jpg" },
  { id: 150, collectionId: "lisa-special", name: "Lisa", category: "Cantante", rarity: "RARA", price: 150, img: "https://i.pinimg.com/736x/a3/e9/ee/a3e9ee1c01c40c2d7b22bf3da40b6099.jpg" },
  { id: 151, collectionId: "lisa-special", name: "Lisa", category: "Cantante", rarity: "RARA", price: 150, img: "https://i.pinimg.com/736x/c1/9c/5e/c19c5ec42af7fb2c580912720ac8083e.jpg" },
  { id: 152, collectionId: "lisa-special", name: "Lisa", category: "Cantante", rarity: "RARA", price: 150, img: "https://i.pinimg.com/736x/86/01/58/8601587d441ab9c54ff55a8c7f2a8b9d.jpg" },
  { id: 153, collectionId: "lisa-special", name: "Lisa", category: "Cantante", rarity: "RARA", price: 150, img: "https://i.pinimg.com/1200x/da/48/6f/da486f20219a0ac9e30c901939dbf096.jpg" },
  { id: 154, collectionId: "lisa-special", name: "Lisa", category: "Cantante", rarity: "RARA", price: 150, img: "https://i.pinimg.com/736x/6e/3b/1a/6e3b1aa0b21d366f8a44527a4d22b17c.jpg" },
  { id: 155, collectionId: "lisa-special", name: "Lisa", category: "Cantante", rarity: "RARA", price: 150, img: "https://i.pinimg.com/736x/d8/b8/6a/d8b86a763c76b82e86c3f118c3228d70.jpg" },
  { id: 156, collectionId: "lisa-special", name: "Lisa", category: "Cantante", rarity: "RARA", price: 150, img: "https://i.pinimg.com/736x/17/39/c7/1739c77cd63ffa1c4451e5bbfb9713b1.jpg" },
  { id: 157, collectionId: "lisa-special", name: "Lisa", category: "Cantante", rarity: "LEGGENDARIA", price: 500, img: "https://i.pinimg.com/736x/7d/38/2c/7d382c2c99384ec5b5e2b4b1fe7b4310.jpg" },
  { id: 158, collectionId: "lisa-special", name: "Lisa", category: "Cantante", rarity: "LEGGENDARIA", price: 500, img: "https://i.pinimg.com/1200x/3e/73/85/3e73857f99b9d1cdd1ee7a7608759a80.jpg" },
  { id: 159, collectionId: "lisa-special", name: "Lisa", category: "Cantante", rarity: "LEGGENDARIA", price: 500, img: "https://i.pinimg.com/736x/61/8d/5c/618d5c58caef3b98a35babc783400b57.jpg" },
  { id: 160, collectionId: "lisa-special", name: "Lisa", category: "Cantante", rarity: "LEGGENDARIA", price: 500, img: "https://i.pinimg.com/1200x/50/63/d6/5063d621048ca7e7e09f2c839e7b7adc.jpg" },
  // --- ROSE ---
  { id: 161, collectionId: "rose-special", name: "Rosé", category: "Cantante", rarity:"COMUNE", price: 50, img: "https://i.pinimg.com/1200x/2c/a9/ac/2ca9acdba6aa68f9d7f4b092fd7fd657.jpg"},
  { id: 162, collectionId: "rose-special", name: "Rosé", category: "Cantante", rarity:"COMUNE", price: 50, img: "https://i.pinimg.com/736x/ed/ed/68/eded6892b1014ef6cc093d50e3128b16.jpg" },
  { id: 163, collectionId: "rose-special", name: "Rosé", category: "Cantante", rarity:"COMUNE", price: 50, img: "https://i.pinimg.com/736x/f0/8b/99/f08b9913caecd53805bc6725f30add0a.jpg" },
  { id: 164, collectionId: "rose-special", name: "Rosé", category: "Cantante", rarity:"COMUNE", price: 50, img: "https://i.pinimg.com/736x/2e/63/77/2e63776db7d504d66f2e14eebe9481ea.jpg"},
  { id: 165, collectionId: "rose-special", name: "Rosé", category: "Cantante", rarity:"COMUNE", price: 50, img: "https://i.pinimg.com/1200x/f5/a5/13/f5a513ff1cc36df5b1c60b68eb6ab0c0.jpg"},
  { id: 166, collectionId: "rose-special", name: "Rosé", category: "Cantante", rarity:"COMUNE", price: 50, img: "https://i.pinimg.com/736x/cd/89/23/cd8923a502d253917388b2e41481529c.jpg"},
  { id: 167, collectionId: "rose-special", name: "Rosé", category: "Cantante", rarity:"COMUNE", price: 50, img: "https://i.pinimg.com/736x/a4/e7/9e/a4e79e567a4e22a72432b7b940842352.jpg"},
  { id: 168, collectionId: "rose-special", name: "Rosé", category: "Cantante", rarity:"COMUNE", price: 50, img: "https://i.pinimg.com/1200x/8b/3a/f9/8b3af963653be0df1bf1107a84cb3382.jpg" },
  { id: 169, collectionId: "rose-special", name: "Rosé", category: "Cantante", rarity:"COMUNE", price: 50, img: "https://i.pinimg.com/736x/b6/04/2d/b6042da382dcdbdc6967a6bfd12b5ec1.jpg"},
  { id: 170, collectionId: "rose-special", name: "Rosé", category: "Cantante", rarity:"COMUNE", price: 50, img: "https://i.pinimg.com/736x/fc/fd/37/fcfd373e0a9c04b8e225bffeda28d6a1.jpg"},
  { id: 171, collectionId: "rose-special", name: "Rosé", category: "Cantante", rarity:"COMUNE", price: 50, img: "https://i.pinimg.com/736x/fd/f8/ae/fdf8ae3f5300d6193c2acf762e4b04fa.jpg" },
  { id: 172, collectionId: "rose-special", name: "Rosé", category: "Cantante", rarity:"COMUNE", price: 50, img: "https://i.pinimg.com/736x/01/08/e1/0108e115cec4cebd9ce600886733af6e.jpg" },
  { id: 173, collectionId: "rose-special", name: "Rosé", category: "Cantante", rarity:"COMUNE", price: 50, img: "https://i.pinimg.com/736x/08/0d/70/080d70902fc0beb78741a6ed7c9e7024.jpg" }, 
  { id: 174, collectionId: "rose-special", name: "Rosé", category: "Cantante", rarity:"COMUNE", price: 50, img: "https://i.pinimg.com/1200x/57/32/87/573287f450fe4ccd0b0e8b2939b6e1f9.jpg" },
  { id: 175, collectionId: "rose-special", name: "Rosé", category: "Cantante", rarity:"COMUNE", price: 50, img: "https://i.pinimg.com/736x/6d/28/ac/6d28acf3ece3ae462ed2761e1eafa66c.jpg" },
  { id: 176, collectionId: "rose-special", name: "Rosé", category: "Cantante", rarity:"COMUNE", price: 50, img: "https://i.pinimg.com/736x/29/23/d4/2923d4cb145d5204f056100251b454e2.jpg" },
  { id: 177, collectionId: "rose-special", name: "Rosé", category: "Cantante", rarity:"RARA", price: 150, img: "https://i.pinimg.com/1200x/9a/95/79/9a9579a261e310dc0922d33ea8cc3960.jpg"},
  { id: 178, collectionId: "rose-special", name: "Rosé", category: "Cantante", rarity:"RARA", price: 150, img: "https://i.pinimg.com/736x/23/e2/f9/23e2f976d3ccef591790649d01edb653.jpg" },
  { id: 179, collectionId: "rose-special", name: "Rosé", category: "Cantante", rarity:"RARA", price: 150, img: "https://i.pinimg.com/736x/c0/13/c3/c013c36e7989318d312aac7c5065aac5.jpg" },
  { id: 180, collectionId: "rose-special", name: "Rosé", category: "Cantante", rarity:"RARA", price: 150, img: "https://i.pinimg.com/736x/d8/a2/27/d8a2271671b5f6af827ac82857e4d11a.jpg" },
  { id: 181, collectionId: "rose-special", name: "Rosé", category: "Cantante", rarity:"RARA", price: 150, img: "https://i.pinimg.com/1200x/09/5d/3a/095d3a48eaa3514f0e6976547cf7379a.jpg" },
  { id: 182, collectionId: "rose-special", name: "Rosé", category: "Cantante", rarity:"RARA", price: 150, img: "https://i.pinimg.com/1200x/19/09/f8/1909f81df7354ea94b66c8a32e08e381.jpg" },
  { id: 183, collectionId: "rose-special", name: "Rosé", category: "Cantante", rarity:"RARA", price: 150, img: "https://i.pinimg.com/1200x/43/71/66/4371664f572074bf15bd5cde692e33ef.jpg" },
  { id: 184, collectionId: "rose-special", name: "Rosé", category: "Cantante", rarity:"RARA", price: 150, img: "https://i.pinimg.com/1200x/2f/13/d7/2f13d7171ec1a4393129a6bb9d4cb655.jpg"},
  { id: 185, collectionId: "rose-special", name: "Rosé", category: "Cantante", rarity:"RARA", price: 150, img: "https://i.pinimg.com/736x/d2/db/5a/d2db5a0cc472fe9311c89b343dd4016f.jpg"},
  { id: 186, collectionId: "rose-special", name: "Rosé", category: "Cantante", rarity:"RARA", price: 150, img: "https://i.pinimg.com/736x/68/4a/9a/684a9ac0ecffe3e8521f35559169e635.jpg"},
  { id: 187, collectionId: "rose-special", name: "Rosé", category: "Cantante", rarity:"RARA", price: 150, img: "https://i.pinimg.com/736x/03/10/c8/0310c8406531b313566379467218e35b.jpg"},
  { id: 188, collectionId: "rose-special", name: "Rosé", category: "Cantante", rarity:"RARA", price: 150, img: "https://i.pinimg.com/1200x/b7/b0/8e/b7b08e76c833cedc50f02f87874a20e4.jpg" },
  { id: 189, collectionId: "rose-special", name: "Rosé", category: "Cantante", rarity:"LEGGENDARIA", price: 500, img: "https://i.pinimg.com/736x/7b/27/09/7b2709983a6b04106d01e81fc2fd7e6a.jpg" },
  { id: 190, collectionId: "rose-special", name: "Rosé", category: "Cantante", rarity:"LEGGENDARIA", price: 500, img: "https://i.pinimg.com/736x/36/40/0d/36400dfaf16230cf33cd9299e864989e.jpg" },
  { id: 191, collectionId: "rose-special", name: "Rosé", category: "Cantante", rarity:"LEGGENDARIA", price: 500, img: "https://i.pinimg.com/736x/5c/af/fe/5caffe894ff351e37e94314efde32d66.jpg"},
  { id: 192, collectionId: "rose-special", name: "Rosé", category: "Cantante", rarity:"LEGGENDARIA", price: 500, img: "https://i.pinimg.com/1200x/4e/14/1e/4e141e0654f60b090b72632fd4e8ea07.jpg"},

  // --- HOLLYWOOD STAR / ATTRICI COLLECTION ---
  { id: 193, collectionId: "special-actress", name: "Alba Baptista", category: "Attrice", rarity: "COMUNE", price: 50, img: "https://i.pinimg.com/1200x/53/c3/e9/53c3e95e9df9556b3d154cad472eeef0.jpg" },
  { id: 194, collectionId: "special-actress", name: "Arienne Mandi", category: "Attrice", rarity: "COMUNE", price: 50, img: "https://i.pinimg.com/1200x/4c/12/82/4c1282c57e20b1b9e12b46e0316e6da0.jpg" },
  { id: 195, collectionId: "special-actress", name: "Begoña Vargas", category: "Attrice", rarity: "COMUNE", price: 50, img: "https://i.pinimg.com/1200x/40/2f/1b/402f1bbbe3009bc3cf0acc9b4437a808.jpg" },
  { id: 196, collectionId: "special-actress", name: "Bo Bragason", category: "Attrice", rarity: "COMUNE", price: 50, img: "https://i.pinimg.com/736x/c9/24/9e/c9249e9c9a7033cc552a61f42901ee74.jpg" },
  { id: 197, collectionId: "special-actress", name: "Camila Mendes", category: "Attrice", rarity: "COMUNE", price: 50, img: "https://i.pinimg.com/736x/48/68/24/486824acf47ab29f3340aca46e0c19db.jpg" },
  { id: 198, collectionId: "special-actress", name: "Ella Hunt", category: "Attrice", rarity: "COMUNE", price: 50, img: "https://i.pinimg.com/736x/2f/be/9a/2fbe9a844eea087e2520cdbfbe894825.jpg" },
  { id: 199, collectionId: "special-actress", name: "Ella Rubin", category: "Attrice", rarity: "COMUNE", price: 50, img: "https://i.pinimg.com/736x/d4/53/1a/d4531a6c49759c19efa18231743c6e03.jpg" },
  { id: 200, collectionId: "special-actress", name: "Ester Expósito", category: "Attrice", rarity: "COMUNE", price: 50, img: "https://i.pinimg.com/736x/5a/4a/e2/5a4ae21590a546efdf00b254a945a029.jpg" },
  { id: 201, collectionId: "special-actress", name: "Fivel Stewart", category: "Attrice", rarity: "COMUNE", price: 50, img: "https://i.pinimg.com/1200x/4a/db/bf/4adbbf8f89f8ab671c960d813e2e950b.jpg" },
  { id: 202, collectionId: "special-actress", name: "Lily-Rose Depp", category: "Attrice", rarity: "COMUNE", price: 50, img: "https://i.pinimg.com/736x/e7/a1/b2/e7a1b25da5fcb7d93c97f5ae43d13604.jpg" },
  { id: 203, collectionId: "special-actress", name: "Maya Reficco", category: "Attrice", rarity: "COMUNE", price: 50, img: "https://i.pinimg.com/1200x/ed/b8/98/edb898623367a097b7cfab33e7358ebe.jpg" },
  { id: 204, collectionId: "special-actress", name: "Myra", category: "Attrice", rarity: "COMUNE", price: 50, img: "https://i.pinimg.com/736x/c1/21/49/c12149031b63719870db978578977586.jpg" },
  { id: 205, collectionId: "special-actress", name: "Stefania Spampinato", category: "Attrice", rarity: "COMUNE", price: 50, img: "https://i.pinimg.com/736x/99/5d/6c/995d6c35006589980fab34aa3a4e9a5e.jpg" },
  { id: 206, collectionId: "special-actress", name: "Stephanie Nur", category: "Attrice", rarity: "COMUNE", price: 50, img: "https://i.pinimg.com/1200x/c6/f7/a9/c6f7a92cbe859ab03d6d0c3d84b427b6.jpg" },
  { id: 207, collectionId: "special-actress", name: "Talia Ryder", category: "Attrice", rarity: "COMUNE", price: 50, img: "https://i.pinimg.com/736x/a3/25/a7/a325a703b78485639817deddef1ddc48.jpg" },
  { id: 208, collectionId: "special-actress", name: "Barbara Lopez", category: "Attrice", rarity: "COMUNE", price: 50, img: "https://i.pinimg.com/1200x/79/4d/d6/794dd623ebc58cf376a5539598ad6f10.jpg" },
  { id: 209, collectionId: "special-actress", name: "Aubrey Plaza", category: "Attrice", rarity: "RARA", price: 150, img: "https://i.pinimg.com/736x/ec/76/91/ec7691cc4be6ff5665505ca2352b53fa.jpg" },
  { id: 210, collectionId: "special-actress", name: "Hailee Steinfeld", category: "Attrice", rarity: "RARA", price: 150, img: "https://i.pinimg.com/736x/90/5d/59/905d598232f950c3a972a763e4e29f7e.jpg" },
  { id: 211, collectionId: "special-actress", name: "Hannah Dodd", category: "Attrice", rarity: "RARA", price: 150, img: "https://i.pinimg.com/736x/99/4d/a0/994da0fcc79ebf48a478ba4977f3f42a.jpg" },
  { id: 212, collectionId: "special-actress", name: "Jenna Ortega", category: "Attrice", rarity: "RARA", price: 150, img: "https://i.pinimg.com/736x/6c/e6/a0/6ce6a018cdc0db12557122597697d93e.jpg" },
  { id: 213, collectionId: "special-actress", name: "Naomi Scott", category: "Attrice", rarity: "RARA", price: 150, img: "https://i.pinimg.com/1200x/2d/1b/03/2d1b032749aaeb2ae4240a5497c05a30.jpg" },
  { id: 214, collectionId: "special-actress", name: "Phoebe Tonkin", category: "Attrice", rarity: "RARA", price: 150, img: "https://i.pinimg.com/736x/34/56/36/3456362b12a681af934b93f4cbe42d9d.jpg" },
  { id: 215, collectionId: "special-actress", name: "Sadie Sink", category: "Attrice", rarity: "RARA", price: 150, img: "https://i.pinimg.com/736x/c3/d3/46/c3d3461f4ca41524e0f49544ef49fc69.jpg" },
  { id: 216, collectionId: "special-actress", name: "Shay Mitchell", category: "Attrice", rarity: "RARA", price: 150, img: "https://i.pinimg.com/1200x/a4/b4/a4/a4b4a41ffeba3e368c66e7791774ef50.jpg" },
  { id: 217, collectionId: "special-actress", name: "Elizabeth Olsen", category: "Attrice", rarity: "LEGGENDARIA", price: 500, img: "https://i.pinimg.com/736x/69/b7/f6/69b7f6d0e81207d2de5f75b31b44ca35.jpg" },
  { id: 218, collectionId: "special-actress", name: "Dakota Johnson", category: "Attrice", rarity: "LEGGENDARIA", price: 500, img: "https://i.pinimg.com/736x/e0/2e/a7/e02ea70a9c771606b8621292c211eec1.jpg" },
  { id: 219, collectionId: "special-actress", name: "Megan Fox", category: "Attrice", rarity: "LEGGENDARIA", price: 500, img: "https://i.pinimg.com/1200x/e9/4b/14/e94b14fcb75463ad0ccb304997144e79.jpg" },
  { id: 220, collectionId: "special-actress", name: "Naya Rivera", category: "Attrice", rarity: "LEGGENDARIA", price: 500, img: "https://i.pinimg.com/1200x/f3/1b/b6/f31bb6d1e06fa91f7f95803cae0469a0.jpg" },
  { id: 221, collectionId: "special-actress", name: "Anne Hathaway", category: "Attrice", rarity: "LEGGENDARIA", price: 500, img: "https://i.pinimg.com/736x/4b/52/b0/4b52b070f08f5e6e59da0784f7d50577.jpg" },
  { id: 222, collectionId: "special-actress", name: "Angelina Jolie", category: "Attrice", rarity: "LEGGENDARIA", price: 500, img: "https://i.pinimg.com/1200x/a1/06/d9/a106d966d8b10bd359e2e5be6613eff8.jpg" },
  { id: 223, collectionId: "special-actress", name: "Winona Ryder", category: "Attrice", rarity: "LEGGENDARIA", price: 500, img: "https://i.pinimg.com/1200x/2e/47/73/2e477303c6b846dea1151bbe85baaa96.jpg" },
  { id: 224, collectionId: "special-actress", name: "Zendaya", category: "Attrice", rarity: "LEGGENDARIA", price: 500, img: "https://i.pinimg.com/736x/83/58/f7/8358f7d794f2258e0185d923bd3ffe23.jpg" },

  // --- POP STAR & ICON COLLECTION ---
  { id: 225, collectionId: "special-popstar", name: "Adela", category: "Pop Star", rarity: "COMUNE", price: 50, img: "https://i.pinimg.com/1200x/a9/a2/d0/a9a2d0fa1bffa0d21e720297532615d1.jpg" },
  { id: 226, collectionId: "special-popstar", name: "Billie Eilish", category: "Pop Star", rarity: "COMUNE", price: 50, img: "https://i.pinimg.com/736x/6d/5b/be/6d5bbe01dd90df7e9eef50b9bb9637ad.jpg" },
  { id: 227, collectionId: "special-popstar", name: "Chappell Roan", category: "Pop Star", rarity: "COMUNE", price: 50, img: "https://i.pinimg.com/1200x/62/be/c4/62bec434c2af42d91d59c5a8de2599f1.jpg" },
  { id: 228, collectionId: "special-popstar", name: "Daniela (KATSEYE)", category: "Pop Star", rarity: "COMUNE", price: 50, img: "https://i.pinimg.com/736x/5b/e5/57/5be557045c46bd5875835c0454ff7554.jpg" },
  { id: 229, collectionId: "special-popstar", name: "Lara (KATSEYE)", category: "Pop Star", rarity: "COMUNE", price: 50, img: "https://i.pinimg.com/736x/33/8c/b0/338cb0af8876f8d47bb86d2a60bc9c8e.jpg" },
  { id: 230, collectionId: "special-popstar", name: "Manon (KATSEYE)", category: "Pop Star", rarity: "COMUNE", price: 50, img: "https://i.pinimg.com/736x/d4/07/12/d40712e510c8d46dbe81b0c7153301fa.jpg" },
  { id: 231, collectionId: "special-popstar", name: "Megan (KATSEYE)", category: "Pop Star", rarity: "COMUNE", price: 50, img: "https://i.pinimg.com/736x/1a/ad/4c/1aad4c98449f8319df1c1e3c6ec0c631.jpg" },
  { id: 232, collectionId: "special-popstar", name: "Olivia Dean", category: "Pop Star", rarity: "COMUNE", price: 50, img: "https://i.pinimg.com/736x/05/5c/5d/055c5df4c47ca429dc755ff626e67502.jpg" },
  { id: 233, collectionId: "special-popstar", name: "Sienna Spiro", category: "Pop Star", rarity: "COMUNE", price: 50, img: "https://i.pinimg.com/736x/0d/2c/81/0d2c818f31361541680842432cda7fd2.jpg" },
  { id: 234, collectionId: "special-popstar", name: "Sophia (KATSEYE)", category: "Pop Star", rarity: "COMUNE", price: 50, img: "https://i.pinimg.com/736x/09/aa/9b/09aa9b25ce58469ba5e9148e47ca2c19.jpg" },
  { id: 235, collectionId: "special-popstar", name: "Tate McRae", category: "Pop Star", rarity: "COMUNE", price: 50, img: "https://i.pinimg.com/736x/b3/6d/e1/b36de15aa0c283c06eadeecd226d7a16.jpg" },
  { id: 236, collectionId: "special-popstar", name: "Yoonchae (KATSEYE)", category: "Pop Star", rarity: "COMUNE", price: 50, img: "https://i.pinimg.com/736x/4c/75/20/4c75206d1452667f4c5f472e9919ea00.jpg" },
  { id: 237, collectionId: "special-popstar", name: "Camila Cabello", category: "Pop Star", rarity: "RARA", price: 150, img: "https://i.pinimg.com/1200x/45/e4/9f/45e49f7bb98e9fe3cbc2a531a61f2686.jpg" },
  { id: 238, collectionId: "special-popstar", name: "Halsey", category: "Pop Star", rarity: "RARA", price: 150, img: "https://i.pinimg.com/736x/71/4a/94/714a94ba1af04cf58fb8e0f37efb5dc1.jpg" },
  { id: 239, collectionId: "special-popstar", name: "Lauren Jauregui", category: "Pop Star", rarity: "RARA", price: 150, img: "https://i.pinimg.com/1200x/02/3b/89/023b89d50a592112b09584e0d9026f8b.jpg" },
  { id: 240, collectionId: "special-popstar", name: "Sabrina Carpenter", category: "Pop Star", rarity: "RARA", price: 150, img: "https://i.pinimg.com/1200x/00/41/12/00411237a6264e5cdf6951b4fb445883.jpg" },
  { id: 241, collectionId: "special-popstar", name: "Gracie Abrams", category: "Pop Star", rarity: "RARA", price: 150, img: "https://i.pinimg.com/1200x/b4/20/af/b420afa70dd635f58ec28f6b92bc55bd.jpg" },
  { id: 242, collectionId: "special-popstar", name: "Billie Eilish", category: "Pop Star", rarity: "RARA", price: 150, img: "https://i.pinimg.com/1200x/97/4c/4b/974c4bcc0e4973243905407e77c18a7a.jpg" },
  { id: 243, collectionId: "special-popstar", name: "Dua Lipa", category: "Pop Star", rarity: "RARA", price: 150, img: "https://i.pinimg.com/1200x/ce/28/56/ce28560835cf9b317995f596c8b90c03.jpg" },
  { id: 244, collectionId: "special-popstar", name: "Olivia Rodrigo", category: "Pop Star", rarity: "RARA", price: 150, img: "https://i.pinimg.com/736x/29/e2/a7/29e2a7143243ce0161434de7e564b1e6.jpg" },
  { id: 245, collectionId: "special-popstar", name: "Rosalia", category: "Pop Star", rarity: "RARA", price: 150, img: "https://i.pinimg.com/736x/58/44/79/5844796261936646b083cd2d393bf4f9.jpg" },
  { id: 246, collectionId: "special-popstar", name: "Olivia Rodrigo", category: "Pop Star", rarity: "RARA", price: 150, img: "https://i.pinimg.com/736x/ee/97/1a/ee971affe8e394185cacaf5efaf6375b.jpg" },
  { id: 247, collectionId: "special-popstar", name: "Charli XCX", category: "Pop Star", rarity: "RARA", price: 150, img: "https://i.pinimg.com/736x/c2/3b/d0/c23bd0eb45a019bc25a0209f548ffe72.jpg" },
  { id: 248, collectionId: "special-popstar", name: "Tate McRae", category: "Pop Star", rarity: "RARA", price: 150, img: "https://i.pinimg.com/736x/69/48/2a/69482a7204b1a0a46017ec1621710339.jpg" },
  { id: 249, collectionId: "special-popstar", name: "Billie Eilish", category: "Pop Star", rarity: "LEGGENDARIA", price: 500, img: "https://i.pinimg.com/736x/16/63/a6/1663a62e8a3698a48fa7e389cc41679d.jpg" },
  { id: 250, collectionId: "special-popstar", name: "Olivia Rodrigo", category: "Pop Star", rarity: "LEGGENDARIA", price: 500, img: "https://i.pinimg.com/736x/7a/7e/c2/7a7ec212b04e66bd39b8637c5191bad2.jpg" },
  { id: 251, collectionId: "special-popstar", name: "Dua Lipa", category: "Pop Star", rarity: "LEGGENDARIA", price: 500, img: "https://i.pinimg.com/736x/29/b0/78/29b0781694060d16d4b7ed7f72e9068d.jpg" },
  { id: 252, collectionId: "special-popstar", name: "Rosalia", category: "Pop Star", rarity: "LEGGENDARIA", price: 500, img: "https://i.pinimg.com/1200x/60/2a/91/602a9194bd6226df67924cb4dd9b2acb.jpg" },
  { id: 253, collectionId: "special-popstar", name: "Adele", category: "Pop Star", rarity: "LEGGENDARIA", price: 500, img: "https://i.pinimg.com/736x/6d/30/35/6d303529d5f68ff1676b9af0fc579103.jpg" },
  { id: 254, collectionId: "special-popstar", name: "Ariana Grande", category: "Pop Star", rarity: "LEGGENDARIA", price: 500, img: "https://i.pinimg.com/736x/17/e8/a9/17e8a9fe6b7db387396862ba107674dd.jpg" },
  { id: 255, collectionId: "special-popstar", name: "Lady Gaga", category: "Pop Star", rarity: "LEGGENDARIA", price: 500, img: "https://i.pinimg.com/736x/b9/15/9e/b9159e5056d407cecf7058db8e40af56.jpg" },
  { id: 256, collectionId: "special-popstar", name: "Rihanna", category: "Pop Star", rarity: "LEGGENDARIA", price: 500, img: "https://i.pinimg.com/736x/c6/ab/d8/c6abd8c2a070c4e68b60d2db389da4b5.jpg" },
  
  // --- GL SHIPS: PAGINA 1 (16 COMUNE) ---
  { id: 257, collectionId: "gl-ships", name: "FreenBecky", category: "Couple GL", rarity: "COMUNE", price: 50, img: "https://i.pinimg.com/1200x/86/a5/fe/86a5fe1325dcd68f289929011927065e.jpg" },
  { id: 258, collectionId: "gl-ships", name: "MilkLove", category: "Couple GL", rarity: "COMUNE", price: 50, img: "https://i.pinimg.com/736x/14/15/7b/14157bfdeae8fc01fe3e41820e0d4bd4.jpg" },
  { id: 259, collectionId: "gl-ships", name: "Englot", category: "Couple GL", rarity: "COMUNE", price: 50, img: "https://i.pinimg.com/736x/20/b6/b2/20b6b2f255634f35a297227960a1b957.jpg" },
  { id: 260, collectionId: "gl-ships", name: "LingOrm", category: "Couple GL", rarity: "COMUNE", price: 50, img: "https://i.pinimg.com/736x/3b/ba/63/3bba6387bf9a89cafd33151224bc2081.jpg" },
  { id: 261, collectionId: "gl-ships", name: "LMSY", category: "Couple GL", rarity: "COMUNE", price: 50, img: "https://i.pinimg.com/736x/60/c2/91/60c291764ee80d8478f8556aef316321.jpg" },
  { id: 262, collectionId: "gl-ships", name: "NamtanFilm", category: "Couple GL", rarity: "COMUNE", price: 50, img: "https://i.pinimg.com/736x/1e/90/e2/1e90e22225982c5cffb18e84b0969c05.jpg" },
  { id: 263, collectionId: "gl-ships", name: "LenaMiu", category: "Couple GL", rarity: "COMUNE", price: 50, img: "https://i.pinimg.com/736x/89/48/20/89482064638495348388c414649f669c.jpg" },
  { id: 264, collectionId: "gl-ships", name: "KaoJane", category: "Couple GL", rarity: "COMUNE", price: 50, img: "https://i.pinimg.com/736x/8a/b2/f6/8ab2f62e22c3301d5858f3ca23ad4868.jpg" },
  { id: 265, collectionId: "gl-ships", name: "GinJay", category: "Couple GL", rarity: "COMUNE", price: 50, img: "https://i.pinimg.com/736x/7c/8c/88/7c8c887e493cd8208418f9402078494b.jpg" },
  { id: 266, collectionId: "gl-ships", name: "TkNur", category: "Couple GL", rarity: "COMUNE", price: 50, img: "https://i.pinimg.com/736x/3c/a0/ca/3ca0ca0bc55e1123bea6644fe06d5857.jpg" },
  { id: 267, collectionId: "gl-ships", name: "JanJingjing", category: "Couple GL", rarity: "COMUNE", price: 50, img: "https://i.pinimg.com/736x/94/ed/f4/94edf483dcc0347f2d75043afc16090e.jpg" },
  { id: 268, collectionId: "gl-ships", name: "OomBam", category: "Couple GL", rarity: "COMUNE", price: 50, img: "https://i.pinimg.com/736x/30/a5/03/30a503c741929b83cb91900e8ad9f86f.jpg" },
  { id: 269, collectionId: "gl-ships", name: "MieAya", category: "Couple GL", rarity: "COMUNE", price: 50, img: "https://i.pinimg.com/736x/aa/2c/db/aa2cdbca1cd96711d8b1a28f990fc779.jpg" },
  { id: 270, collectionId: "gl-ships", name: "PufayPloy", category: "Couple GL", rarity: "COMUNE", price: 50, img: "https://i.pinimg.com/736x/c7/c8/1d/c7c81d9ec28b1420ca70a3aa5c600671.jpg" },
  { id: 271, collectionId: "gl-ships", name: "MyyuChanya", category: "Couple GL", rarity: "COMUNE", price: 50, img: "https://i.pinimg.com/736x/1f/84/9f/1f849fd00338fc95694d614f8f434243.jpg" },
  { id: 272, collectionId: "gl-ships", name: "GarnMie", category: "Couple GL", rarity: "COMUNE", price: 50, img: "https://i.pinimg.com/736x/c2/f1/79/c2f1791a5b4bc96d7dcd5e20d78818d2.jpg" },
  // --- GL SHIPS: PAGINA 2 (12 RARA + 4 LEGGENDARIA) ---
  { id: 273, collectionId: "gl-ships", name: "LingOrm", category: "Couple GL", rarity: "RARA", price: 150, img: "https://i.pinimg.com/736x/ab/1a/cf/ab1acf492c963e3b4a60377fb26ab5f5.jpg" },
  { id: 274, collectionId: "gl-ships", name: "NamtanFilm", category: "Couple GL", rarity: "RARA", price: 150, img: "https://i.pinimg.com/736x/8d/04/b7/8d04b7edd245d0ba43543e1370650e67.jpg" },
  { id: 275, collectionId: "gl-ships", name: "LenaMiu", category: "Couple GL", rarity: "RARA", price: 150, img: "https://i.pinimg.com/736x/69/2f/96/692f96e4d91e159763d55db3b82845b6.jpg" },
  { id: 276, collectionId: "gl-ships", name: "KaoJane", category: "Couple GL", rarity: "RARA", price: 150, img: "https://i.pinimg.com/736x/85/36/9d/85369d593e029b40191a2f1e075de9f3.jpg" },
  { id: 277, collectionId: "gl-ships", name: "GinJay", category: "Couple GL", rarity: "RARA", price: 150, img: "https://i.pinimg.com/1200x/14/19/a7/1419a70bfd404c25003d8faf7ccd6258.jpg" },
  { id: 278, collectionId: "gl-ships", name: "TkNur", category: "Couple GL", rarity: "RARA", price: 150, img: "https://i.pinimg.com/736x/37/54/23/37542361a6be009d356bb48307769596.jpg" },
  { id: 279, collectionId: "gl-ships", name: "JanJingjing", category: "Couple GL", rarity: "RARA", price: 150, img: "https://i.pinimg.com/736x/72/ee/62/72ee6272292e7b3c6d1eb943648bd09c.jpg" },
  { id: 280, collectionId: "gl-ships", name: "OomBam", category: "Couple GL", rarity: "RARA", price: 150, img: "https://i.pinimg.com/736x/4d/3b/1b/4d3b1b58cfd28d4ce5c095dfb7ef4dc8.jpg" },
  { id: 281, collectionId: "gl-ships", name: "MieAya", category: "Couple GL", rarity: "RARA", price: 150, img: "https://i.pinimg.com/736x/61/f0/f0/61f0f026edfeb5dc710562224d2c5214.jpg" },
  { id: 282, collectionId: "gl-ships", name: "PufayPloy", category: "Couple GL", rarity: "RARA", price: 150, img: "https://i.pinimg.com/736x/76/a1/47/76a14755cc1443db73ce326148ac75c0.jpg" },
  { id: 283, collectionId: "gl-ships", name: "KapookCiize", category: "Couple GL", rarity: "RARA", price: 150, img: "https://i.pinimg.com/736x/ca/db/ec/cadbec241cfe3a825870bbcbc6e223ae.jpg" },
  { id: 284, collectionId: "gl-ships", name: "MingmingNepjune", category: "Couple GL", rarity: "RARA", price: 150, img: "https://i.pinimg.com/736x/f4/57/dd/f457dd597364428c62fa255f7f5ed91e.jpg" },
  { id: 285, collectionId: "gl-ships", name: "FreenBecky", category: "Couple GL", rarity: "LEGGENDARIA", price: 500, img: "https://i.pinimg.com/1200x/8d/34/ec/8d34ecb2e74b3b538c07561da0c7547f.jpg" },
  { id: 286, collectionId: "gl-ships", name: "MilkLove", category: "Couple GL", rarity: "LEGGENDARIA", price: 500, img: "https://i.pinimg.com/736x/3f/95/15/3f951516f5ea0d09f10b0a83a149f7a4.jpg" },
  { id: 287, collectionId: "gl-ships", name: "Englot", category: "Couple GL", rarity: "LEGGENDARIA", price: 500, img: "https://i.pinimg.com/736x/56/86/c3/5686c3b8d50aeb7ac1eaa4810dd4f04b.jpg" },
  { id: 288, collectionId: "gl-ships", name: "LMSY", category: "Couple GL", rarity: "LEGGENDARIA", price: 500, img: "https://i.pinimg.com/736x/fc/48/0d/fc480d3c060fa23eb8487ea0e0ec73bb.jpg" },
  
  // --- ATTRICI GL THAI - PAGINE 1-2: 32 COMUNE (ordine alfabetico) ---
  { id: 289, collectionId: "special-ships", name: "Angelina", category: "Attrice GL", rarity: "COMUNE", price: 50, img: "https://i.pinimg.com/736x/c7/d3/02/c7d302d8de8834f0f758e98bbcf40ed1.jpg" },
  { id: 290, collectionId: "special-ships", name: "Aya", category: "Attrice GL", rarity: "COMUNE", price: 50, img: "https://i.pinimg.com/736x/5d/68/d4/5d68d420d0cf6fde38ad42f7afc6e106.jpg" },
  { id: 291, collectionId: "special-ships", name: "Bam", category: "Attrice GL", rarity: "COMUNE", price: 50, img: "https://i.pinimg.com/1200x/90/2f/e0/902fe0047e77e026ad3fea2a912b0edc.jpg" },
  { id: 292, collectionId: "special-ships", name: "Ciize", category: "Attrice GL", rarity: "COMUNE", price: 50, img: "https://i.pinimg.com/1200x/65/b0/ac/65b0acddbd5ef3470c2f8221236501bc.jpg" },
  { id: 293, collectionId: "special-ships", name: "Film", category: "Attrice GL", rarity: "COMUNE", price: 50, img: "https://i.pinimg.com/736x/cd/2f/57/cd2f57bcc03615936532a602de408636.jpg" },
  { id: 294, collectionId: "special-ships", name: "Garn", category: "Attrice GL", rarity: "COMUNE", price: 50, img: "https://i.pinimg.com/736x/cb/1f/4c/cb1f4c2c7c7404750b2e6690259140e1.jpg" },
  { id: 295, collectionId: "special-ships", name: "Ginny", category: "Attrice GL", rarity: "COMUNE", price: 50, img: "https://i.pinimg.com/736x/99/4a/80/994a80b326255dd126a8a3254d064a9a.jpg" },
  { id: 296, collectionId: "special-ships", name: "Jan", category: "Attrice GL", rarity: "COMUNE", price: 50, img: "https://i.pinimg.com/736x/84/a8/8a/84a88a96d216d3d7745e9929f705d7d9.jpg" },
  { id: 297, collectionId: "special-ships", name: "Jane", category: "Attrice GL", rarity: "COMUNE", price: 50, img: "https://i.pinimg.com/736x/b6/8c/c3/b68cc3f40391d90efad81aaafb2e4609.jpg" },
  { id: 298, collectionId: "special-ships", name: "JingJing", category: "Attrice GL", rarity: "COMUNE", price: 50, img: "https://i.pinimg.com/736x/54/b9/29/54b9296e5c2790039d1db2eae78467ed.jpg" },
  { id: 299, collectionId: "special-ships", name: "Kapook", category: "Attrice GL", rarity: "COMUNE", price: 50, img: "https://i.pinimg.com/736x/d3/be/76/d3be76c336a570bec872c6b55b6df74c.jpg" },
  { id: 300, collectionId: "special-ships", name: "Lena", category: "Attrice GL", rarity: "COMUNE", price: 50, img: "https://i.pinimg.com/736x/2b/a0/ba/2ba0bac79cb224cdea57e871b614c7f4.jpg" },
  { id: 301, collectionId: "special-ships", name: "Lingling", category: "Attrice GL", rarity: "COMUNE", price: 50, img: "https://i.pinimg.com/736x/26/ad/e2/26ade25a3196c3512878f57fcf474cd9.jpg" },
  { id: 302, collectionId: "special-ships", name: "Lookmhee", category: "Attrice GL", rarity: "COMUNE", price: 50, img: "https://i.pinimg.com/736x/6f/85/f1/6f85f166055db4a04e032a1d4ebefbb9.jpg" },
  { id: 303, collectionId: "special-ships", name: "Love", category: "Attrice GL", rarity: "COMUNE", price: 50, img: "https://i.pinimg.com/736x/0d/5f/71/0d5f7149581a8b607be9b2a217e21379.jpg" },
  { id: 304, collectionId: "special-ships", name: "Mie", category: "Attrice GL", rarity: "COMUNE", price: 50, img: "https://i.pinimg.com/736x/02/e3/42/02e342df189c52d271d221551b0c80ee.jpg" },
  { id: 305, collectionId: "special-ships", name: "Milk", category: "Attrice GL", rarity: "COMUNE", price: 50, img: "https://i.pinimg.com/736x/d6/eb/6b/d6eb6bf61134dae606706d96d043f60a.jpg" },
  { id: 306, collectionId: "special-ships", name: "Mimie", category: "Attrice GL", rarity: "COMUNE", price: 50, img: "https://i.pinimg.com/736x/68/a7/2c/68a72c3b73d8d4ce5f4a84a725da7a99.jpg" },
  { id: 307, collectionId: "special-ships", name: "Ming", category: "Attrice GL", rarity: "COMUNE", price: 50, img: "https://i.pinimg.com/736x/d3/0d/7f/d30d7faa9c6b78e7994a8f800e2bd6c0.jpg" },
  { id: 308, collectionId: "special-ships", name: "Miu", category: "Attrice GL", rarity: "COMUNE", price: 50, img: "https://i.pinimg.com/736x/50/2e/b8/502eb8dc0ebd99de90827f7903b5c05c.jpg" },
  { id: 309, collectionId: "special-ships", name: "Namtan", category: "Attrice GL", rarity: "COMUNE", price: 50, img: "https://i.pinimg.com/1200x/84/03/88/84038899e28cfdff8c1bd775a9276086.jpg" },
  { id: 310, collectionId: "special-ships", name: "Nepjune", category: "Attrice GL", rarity: "COMUNE", price: 50, img: "https://i.pinimg.com/736x/cc/28/d8/cc28d8f2145a36e9a4a6d68bed0bf46f.jpg" },
  { id: 311, collectionId: "special-ships", name: "Nur", category: "Attrice GL", rarity: "COMUNE", price: 50, img: "https://i.pinimg.com/736x/54/d9/5b/54d95b13488701d67afd2956732d8717.jpg" },
  { id: 312, collectionId: "special-ships", name: "Oom", category: "Attrice GL", rarity: "COMUNE", price: 50, img: "https://i.pinimg.com/736x/06/56/5c/06565ca6b268a5533849a2b9bc2cc934.jpg" },
  { id: 313, collectionId: "special-ships", name: "Pangjie", category: "Attrice GL", rarity: "COMUNE", price: 50, img: "https://i.pinimg.com/1200x/e5/f0/e7/e5f0e701b8c0bd60349f3960c09b3526.jpg" },
  { id: 314, collectionId: "special-ships", name: "Piploy", category: "Attrice GL", rarity: "COMUNE", price: 50, img: "https://i.pinimg.com/1200x/68/13/3e/68133e84d8c097409be544bc31622371.jpg" },
  { id: 315, collectionId: "special-ships", name: "Ploy", category: "Attrice GL", rarity: "COMUNE", price: 50, img: "https://i.pinimg.com/736x/f7/70/bd/f770bdffeee9ae25604a7a4eeec51d45.jpg" },
  { id: 316, collectionId: "special-ships", name: "Puifay", category: "Attrice GL", rarity: "COMUNE", price: 50, img: "https://i.pinimg.com/736x/de/b2/00/deb20053dd1761489a6a0d68fd47b503.jpg" },
  { id: 317, collectionId: "special-ships", name: "Sonya", category: "Attrice GL", rarity: "COMUNE", price: 50, img: "https://i.pinimg.com/736x/85/4d/71/854d71e133b70e61aa12cb53044a3351.jpg" },
  { id: 318, collectionId: "special-ships", name: "Lookmhee", category: "Attrice GL", rarity: "COMUNE", price: 50, img: "https://i.pinimg.com/736x/4d/12/fb/4d12fb70cc2d04bd44cb9cf8f97e3e90.jpg" },
  { id: 319, collectionId: "special-ships", name: "TK", category: "Attrice GL", rarity: "COMUNE", price: 50, img: "https://i.pinimg.com/1200x/14/a5/22/14a5229fa2f1c9e5027fc82f062bbf69.jpg" },
  { id: 320, collectionId: "special-ships", name: "Tu Tontawan", category: "Attrice GL", rarity: "COMUNE", price: 50, img: "https://i.pinimg.com/736x/3c/b8/17/3cb81709c66e463555f8e101920d062e.jpg" },
  // --- ATTRICI GL THAI - PAGINA 3: 16 RARE (ordine alfabetico) ---
  { id: 321, collectionId: "special-ships", name: "Ciize", category: "Attrice GL", rarity: "RARA", price: 150, img: "https://i.pinimg.com/736x/2b/83/28/2b832808de521c6aabafe1f1345a606a.jpg" },
  { id: 322, collectionId: "special-ships", name: "Film", category: "Attrice GL", rarity: "RARA", price: 150, img: "https://i.pinimg.com/736x/2e/f2/df/2ef2dfbdfeb7b3f78096a99b5195fc38.jpg" },
  { id: 323, collectionId: "special-ships", name: "Jane", category: "Attrice GL", rarity: "RARA", price: 150, img: "https://i.pinimg.com/736x/7a/97/c9/7a97c9e2f160837504646f8c71de1066.jpg" },
  { id: 324, collectionId: "special-ships", name: "Kao", category: "Attrice GL", rarity: "RARA", price: 150, img: "https://i.pinimg.com/736x/a0/96/4f/a0964f8c5a0205dbd90b4249097d2abb.jpg" },
  { id: 325, collectionId: "special-ships", name: "Lena", category: "Attrice GL", rarity: "RARA", price: 150, img: "https://i.pinimg.com/736x/fe/91/3f/fe913f518da21a22d80e8ffae305d9f2.jpg" },
  { id: 326, collectionId: "special-ships", name: "Lingling", category: "Attrice GL", rarity: "RARA", price: 150, img: "https://i.pinimg.com/736x/c1/73/9e/c1739e31f8f6d5c17675528ca4d45a39.jpg" },
  { id: 327, collectionId: "special-ships", name: "Lookmhee", category: "Attrice GL", rarity: "RARA", price: 150, img: "https://i.pinimg.com/1200x/dd/24/11/dd2411b85b0838ab7c68f2ba66b4e610.jpg" },
  { id: 328, collectionId: "special-ships", name: "Love", category: "Attrice GL", rarity: "RARA", price: 150, img: "https://i.pinimg.com/736x/9e/94/85/9e948510e3cb7636ffd37725b23c6ce2.jpg" },
  { id: 329, collectionId: "special-ships", name: "Milk", category: "Attrice GL", rarity: "RARA", price: 150, img: "https://i.pinimg.com/1200x/2a/41/59/2a41598e614c22aeaff1662172109568.jpg" },
  { id: 330, collectionId: "special-ships", name: "Miu", category: "Attrice GL", rarity: "RARA", price: 150, img: "https://i.pinimg.com/1200x/e1/2a/e9/e12ae92e9110aaf337dad2c93b774197.jpg" },
  { id: 331, collectionId: "special-ships", name: "Namtan", category: "Attrice GL", rarity: "RARA", price: 150, img: "https://i.pinimg.com/1200x/e7/28/d7/e728d7fc1df236a62230a68ec3612652.jpg" },
  { id: 332, collectionId: "special-ships", name: "Piploy", category: "Attrice GL", rarity: "RARA", price: 150, img: "https://i.pinimg.com/736x/0e/ca/81/0eca81ae586053700d35a450c859287f.jpg" },
  { id: 333, collectionId: "special-ships", name: "Ploy", category: "Attrice GL", rarity: "RARA", price: 150, img: "https://i.pinimg.com/736x/be/34/7e/be347ea5cf9c81964620f512cbdc7394.jpg" },
  { id: 334, collectionId: "special-ships", name: "Puifay", category: "Attrice GL", rarity: "RARA", price: 150, img: "https://i.pinimg.com/736x/3b/58/5f/3b585faf32a5dfaed9c6e9c5e9036704.jpg" },
  { id: 335, collectionId: "special-ships", name: "Sonya", category: "Attrice GL", rarity: "RARA", price: 150, img: "https://i.pinimg.com/736x/5b/75/9e/5b759e03c1cfbb9e0f943f1a225f2cda.jpg" },
  { id: 336, collectionId: "special-ships", name: "Tu Tontawan", category: "Attrice GL", rarity: "RARA", price: 150, img: "https://i.pinimg.com/1200x/3b/e8/35/3be835624338ed62bba20ade873be15c.jpg" },
  // --- ATTRICI GL THAI - PAGINA 4: 16 LEGGENDARIE (ordine alfabetico) ---
  { id: 337, collectionId: "special-ships", name: "Becky", category: "Attrice GL", rarity: "LEGGENDARIA", price: 500, img: "https://i.pinimg.com/736x/05/5f/b0/055fb003bc093bce92be4a212a1b59aa.jpg" },
  { id: 338, collectionId: "special-ships", name: "Charlotte", category: "Attrice GL", rarity: "LEGGENDARIA", price: 500, img: "https://i.pinimg.com/736x/f7/e1/d4/f7e1d480e05e7f15b4364b6dd6b4a353.jpg" },
  { id: 339, collectionId: "special-ships", name: "Engfa", category: "Attrice GL", rarity: "LEGGENDARIA", price: 500, img: "https://i.pinimg.com/736x/af/3b/6a/af3b6a3ac1eaadd63f22cbcc1a027f1b.jpg" },
  { id: 340, collectionId: "special-ships", name: "Freen", category: "Attrice GL", rarity: "LEGGENDARIA", price: 500, img: "https://i.pinimg.com/736x/f4/0c/1d/f40c1d233328b6f82c9e777855b7ccad.jpg" },
  { id: 341, collectionId: "special-ships", name: "Kao", category: "Attrice GL", rarity: "LEGGENDARIA", price: 500, img: "https://i.pinimg.com/736x/15/e9/b3/15e9b3bd069a7288db5c66180fe0aca7.jpg" },
  { id: 342, collectionId: "special-ships", name: "Lena", category: "Attrice GL", rarity: "LEGGENDARIA", price: 500, img: "https://i.pinimg.com/1200x/98/bc/fe/98bcfe5d61abae20e123bbf80493f048.jpg" },
  { id: 343, collectionId: "special-ships", name: "Lingling", category: "Attrice GL", rarity: "LEGGENDARIA", price: 500, img: "https://i.pinimg.com/736x/07/cb/3d/07cb3d308472b83c6d87f18992776b9f.jpg" },
  { id: 344, collectionId: "special-ships", name: "Lookmhee", category: "Attrice GL", rarity: "LEGGENDARIA", price: 500, img: "https://i.pinimg.com/736x/02/c1/81/02c181967f0fb961fe79e938ba536491.jpg" },
  { id: 345, collectionId: "special-ships", name: "Love", category: "Attrice GL", rarity: "LEGGENDARIA", price: 500, img: "https://i.pinimg.com/736x/ba/65/d8/ba65d88cfd6787c89e81d243acee64a4.jpg" },
  { id: 346, collectionId: "special-ships", name: "Milk", category: "Attrice GL", rarity: "LEGGENDARIA", price: 500, img: "https://i.pinimg.com/736x/ee/bc/21/eebc21020c7e70740790a0c9d3e8e23b.jpg" },
  { id: 347, collectionId: "special-ships", name: "Miu", category: "Attrice GL", rarity: "LEGGENDARIA", price: 500, img: "https://i.pinimg.com/736x/e1/f0/73/e1f0730d8b94bc5d9dd62b2ba4d49e79.jpg" },
  { id: 348, collectionId: "special-ships", name: "Orm", category: "Attrice GL", rarity: "LEGGENDARIA", price: 500, img: "https://i.pinimg.com/736x/9d/55/86/9d55864468f62fe8059cefbf36087a3b.jpg" },
  { id: 349, collectionId: "special-ships", name: "Piploy", category: "Attrice GL", rarity: "LEGGENDARIA", price: 500, img: "https://i.pinimg.com/1200x/c1/48/a4/c148a4f4b0ddd7f3ba0e4ac40f17971c.jpg" },
  { id: 350, collectionId: "special-ships", name: "Ploy", category: "Attrice GL", rarity: "LEGGENDARIA", price: 500, img: "https://i.pinimg.com/736x/3b/d7/8d/3bd78df3053cb3f349965669dba89e23.jpg" },
  { id: 351, collectionId: "special-ships", name: "Sonya", category: "Attrice GL", rarity: "LEGGENDARIA", price: 500, img: "https://i.pinimg.com/736x/62/cb/ac/62cbac995c84031e1ce8c30715a92f62.jpg" },
  { id: 352, collectionId: "special-ships", name: "Lookmhee", category: "Attrice GL", rarity: "LEGGENDARIA", price: 500, img: "https://i.pinimg.com/736x/0e/14/98/0e1498b3ccf781e76c08155f709fc905.jpg" },
];

// ---------- NATALE 2026 (card a tempo) ----------
// Per ogni card scrivi: nome, rarità e URL. Gli id partono da 353.
[
  ['Nome 1',  'COMUNE',       'URL-1'],
  ['Nome 2',  'COMUNE',       'URL-2'],
  ['Nome 3',  'COMUNE',       'URL-3'],
  ['Nome 4',  'COMUNE',       'URL-4'],
  ['Nome 5',  'COMUNE',       'URL-5'],
  ['Nome 6',  'COMUNE',       'URL-6'],
  ['Nome 7',  'RARA',         'URL-7'],
  ['Nome 8',  'RARA',         'URL-8'],
  ['Nome 9',  'RARA',         'URL-9'],
  ['Nome 10', 'LEGGENDARIA',  'URL-10']
].forEach((c, i) => {
  const prezzi = { COMUNE: 50, RARA: 150, LEGGENDARIA: 500 };
  cardsDatabase.push({
    id: 353 + i,
    collectionId: 'xmas-2026',
    name: c[0],
    category: 'Natale',
    rarity: c[1],
    price: prezzi[c[1]],
    img: c[2]
  });
});

// ---------- EVENTI A TEMPO ----------
const eventsDatabase = [
  {
    id: 'xmas-2026',
    title: 'Happy Holidays 🎁',
    start: '2026-12-01',
    end: '2026-12-26',
    collectionId: 'xmas-2026',
    packId: 'pack-xmas'
  }
];
