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
    id: "blackpink",
    title: "BLACKPINK Collection 🖤",
    description: "Jennie, Rosé, Lisa, Jisoo & Ships",
    coverImg: "https://i.pinimg.com/1200x/c9/82/b7/c982b7a1a68d674cfeec108b47f250e3.jpg"
  },
  {
    id: "special-popstar",
    title: "Pop Queens & Icons 🎤",
    description: "Dua Lipa, Rosalía & Special Edition",
    coverImg: "https://i.pinimg.com/1200x/48/b3/28/48b328850078158308a7b0cf36ab8732.jpg"
  },
  {
    id: "special-actress",
    title: "Hollywood Star",
    description: "MilkLove, LMSY & Iconic Duos",
    coverImg: "https://i.pinimg.com/1200x/26/a5/16/26a5165595adceb6faa1fe6b0e43dcf0.jpg"
  },
  {
    id: "special-ships",
    title: "GL & Special Ships 💖",
    description: "MilkLove, LMSY & Iconic Duos",
    coverImg: "https://i.pinimg.com/1200x/28/18/24/28182402004fb8b7710e28452a2dcafc.jpg"
  }
];

// DATABASE BUSTE / PACKS GACHA
const packsDatabase = [
  {
    id: "pack-bp-debut",
    name: "BLACKPINK Pack 🖤",
    price: 150,
    cover: "https://i.pinimg.com/736x/af/cf/4a/afcf4a0a45a884ae79b2f6008277490d.jpg",
    collectionId: "blackpink",
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
    name: "GL Series & Ships Pack 💖",
    price: 220,
    cover: "https://i.pinimg.com/736x/15/e8/48/15e8486359bb03f44a94d967f0bfa266.jpg",
    collectionId: "special-ships",
    cardCount: 3
  }
];

// DATABASE CARD
const cardsDatabase = [
  // --- BLACKPINK COLLECTION ---
  { id: 1, collectionId: "blackpink", name: "BLACKPINK", category: "Group", rarity: "COMUNE", price: 50, img: "https://i.pinimg.com/736x/a3/04/70/a30470eeb1a1bedb3394bfe66a3233fd.jpg" },
  { id: 2, collectionId: "blackpink", name: "BLACKPINK", category: "Group", rarity: "COMUNE", price: 50, img: "https://i.pinimg.com/1200x/e9/67/a8/e967a888fb8aaa9feb88a7b1214abf1d.jpg" },
  { id: 3, collectionId: "blackpink", name: "BLACKPINK", category: "Group", rarity: "COMUNE", price: 50, img: "https://i.pinimg.com/1200x/4d/53/c8/4d53c8fcbf423a434020e4a8bd571227.jpg" },
  { id: 4, collectionId: "blackpink", name: "BLACKPINK", category: "Group", rarity: "COMUNE", price: 50, img: "https://i.pinimg.com/736x/35/28/aa/3528aaa14fe9372277928a20de3e6fea.jpg" },
  { id: 5, collectionId: "blackpink", name: "BLACKPINK", category: "Group", rarity: "COMUNE", price: 50, img: "https://i.pinimg.com/736x/cb/6d/d9/cb6dd9cee94a31e2ac280c28e006c583.jpg" },
  { id: 6, collectionId: "blackpink", name: "BLACKPINK", category: "Group", rarity: "COMUNE", price: 50, img: "https://i.pinimg.com/736x/42/a1/3b/42a13b6e9d1e6c44f66931ac564c67f2.jpg" },
  { id: 7, collectionId: "blackpink", name: "BLACKPINK", category: "Group", rarity: "COMUNE", price: 50, img: "https://i.pinimg.com/1200x/47/58/a1/4758a12f18375060a3b43cc075e805b8.jpg" },
  { id: 8, collectionId: "blackpink", name: "BLACKPINK", category: "Group", rarity: "COMUNE", price: 50, img: "https://i.pinimg.com/736x/2e/65/2c/2e652c4189262795f8f2a2b567c1ac04.jpg" },
  { id: 9, collectionId: "blackpink", name: "BLACKPINK", category: "Group", rarity: "COMUNE", price: 50, img: "https://i.pinimg.com/736x/5f/1f/3c/5f1f3c4e6d5efe46a4e848c9dab2d0e5.jpg" },
  { id: 10, collectionId: "blackpink", name: "BLACKPINK", category: "Group", rarity: "COMUNE", price: 50, img: "https://i.pinimg.com/736x/29/8e/4c/298e4c840d3130a22c19cb7b8535f9bb.jpg" },
  { id: 11, collectionId: "blackpink", name: "BLACKPINK", category: "Group", rarity: "RARA", price: 150, img: "https://i.pinimg.com/736x/14/f6/d7/14f6d7f326e044142d5fd87929fc3aea.jpg" },
  { id: 12, collectionId: "blackpink", name: "BLACKPINK", category: "Group", rarity: "RARA", price: 150, img: "https://i.pinimg.com/1200x/66/66/3a/66663abafc26eb88fe45e3341d240e55.jpg" },
  { id: 13, collectionId: "blackpink", name: "BLACKPINK", category: "Group", rarity: "RARA", price: 150, img: "https://i.pinimg.com/736x/bd/ac/18/bdac18b06efd4f06a95316c32180c903.jpg" },
  { id: 14, collectionId: "blackpink", name: "BLACKPINK", category: "Group", rarity: "RARA", price: 150, img: "https://i.pinimg.com/1200x/52/41/7f/52417f7006e0dd66d96b367636a75a96.jpg" },
  { id: 15, collectionId: "blackpink", name: "BLACKPINK", category: "Group", rarity: "LEGGENDARIA", price: 500, img: "https://i.pinimg.com/736x/37/dd/20/37dd2067640b87d6dfad9ace697e7b8e.jpg" },
  { id: 16, collectionId: "blackpink", name: "BLACKPINK", category: "Group", rarity: "LEGGENDARIA", price: 500, img: "https://i.pinimg.com/736x/52/ab/9e/52ab9ef54d0622a3cbfb2f8b0bd335cd.jpg" },
  // --- JISOO ---
  { id: 17, collectionId: "blackpink", name: "Jisoo", category: "Cantante", rarity: "COMUNE", price: 50, img: "https://i.pinimg.com/736x/2f/07/4d/2f074dca8392180ccfc9d6432d45a0c0.jpg" },
  { id: 18, collectionId: "blackpink", name: "Jisoo", category: "Cantante", rarity: "COMUNE", price: 50, img: "https://i.pinimg.com/736x/bc/02/ab/bc02abb2fafc38d7e1fdf8cb4801a99a.jpg" },
  { id: 19, collectionId: "blackpink", name: "Jisoo", category: "Cantante", rarity: "COMUNE", price: 50, img: "https://i.pinimg.com/736x/af/ac/23/afac23553e4b0571dcbf295f8484b48d.jpg" },
  { id: 20, collectionId: "blackpink", name: "Jisoo", category: "Cantante", rarity: "COMUNE", price: 50, img: "https://i.pinimg.com/736x/89/42/8b/89428b3e055e1f520f598c9159904b1a.jpg" },
  { id: 21, collectionId: "blackpink", name: "Jisoo", category: "Cantante", rarity: "COMUNE", price: 50, img: "https://i.pinimg.com/1200x/4a/61/bf/4a61bf32663f8c09875008692f87f082.jpg" },
  { id: 22, collectionId: "blackpink", name: "Jisoo", category: "Cantante", rarity: "COMUNE", price: 50, img: "https://i.pinimg.com/736x/00/49/65/0049656b784a3ded58f15f0013364b89.jpg" },
  { id: 23, collectionId: "blackpink", name: "Jisoo", category: "Cantante", rarity: "COMUNE", price: 50, img: "https://i.pinimg.com/1200x/34/00/eb/3400ebde571231097d608de658a6e96e.jpg" },
  { id: 24, collectionId: "blackpink", name: "Jisoo", category: "Cantante", rarity: "COMUNE", price: 50, img: "https://i.pinimg.com/736x/0a/ee/a5/0aeea5042e3b76b45c1d4b5dd5ee8603.jpg" },
  { id: 25, collectionId: "blackpink", name: "Jisoo", category: "Cantante", rarity: "COMUNE", price: 50, img: "https://i.pinimg.com/1200x/d7/a6/42/d7a6421cce73276662b24db770e81154.jpg" },
  { id: 26, collectionId: "blackpink", name: "Jisoo", category: "Cantante", rarity: "COMUNE", price: 50, img: "https://i.pinimg.com/736x/13/8c/76/138c76e2193c76f4d9dd02be1bf3290c.jpg" },
  { id: 27, collectionId: "blackpink", name: "Jisoo", category: "Cantante", rarity: "RARA", price: 150, img: "https://i.pinimg.com/736x/0b/fe/40/0bfe404b0180095b2d3dcc9723fc2305.jpg"},
  { id: 28, collectionId: "blackpink", name: "Jisoo", category: "Cantante", rarity: "RARA", price: 150, img: "https://i.pinimg.com/736x/f1/6c/91/f16c912c111915014c6aa8deab1e4dab.jpg" },
  { id: 29, collectionId: "blackpink", name: "Jisoo", category: "Cantante", rarity: "RARA", price: 150, img: "https://i.pinimg.com/736x/d3/32/1b/d3321b9aa3b38e0eeeed6479ef8c6f4a.jpg" },
  { id: 30, collectionId: "blackpink", name: "Jisoo", category: "Cantante", rarity: "RARA", price: 150, img: "https://i.pinimg.com/1200x/67/cc/5d/67cc5de028c8de09ec0f1a94b1785066.jpg" },
  { id: 31, collectionId: "blackpink", name: "Jisoo", category: "Cantante", rarity: "LEGGENDARIA", price: 500, img: "https://i.pinimg.com/736x/84/93/49/8493491ef55bc85496aa4a153775fbf6.jpg" },
  { id: 32, collectionId: "blackpink", name: "Jisoo", category: "Cantante", rarity: "LEGGENDARIA", price: 500, img: "https://i.pinimg.com/1200x/ec/74/46/ec74468dc5454f8c1a7b18cc9b2c37eb.jpg" },
  // --- JENNIE ---
  { id: 33, collectionId: "blackpink", name: "Jennie", category: "Cantante", rarity: "COMUNE", price: 50, img: "https://i.pinimg.com/736x/a2/04/69/a2046902c6396b2e195764768263d532.jpg" },
  { id: 34, collectionId: "blackpink", name: "Jennie", category: "Cantante", rarity: "COMUNE", price: 50, img: "https://i.pinimg.com/1200x/4c/2b/be/4c2bbeed599eb1b6a33ede2d0094c502.jpg" }, 
  { id: 35, collectionId: "blackpink", name: "Jennie", category: "Cantante", rarity: "COMUNE", price: 50, img: "https://i.pinimg.com/736x/78/7f/02/787f023735f674e53ce4d62c7fbc041f.jpg" }, 
  { id: 36, collectionId: "blackpink", name: "Jennie", category: "Cantante", rarity: "COMUNE", price: 50, img: "https://i.pinimg.com/736x/2a/ea/95/2aea95abd066674d28856c120a7fd4cc.jpg" }, 
  { id: 37, collectionId: "blackpink", name: "Jennie", category: "Cantante", rarity: "COMUNE", price: 50, img: "https://i.pinimg.com/736x/1f/a2/f0/1fa2f0a71fb305bc36877c042ffd236e.jpg" },
  { id: 38, collectionId: "blackpink", name: "Jennie", category: "Cantante", rarity: "COMUNE", price: 50, img: "https://i.pinimg.com/736x/e9/5f/6a/e95f6af968e8d4db634ab497d381be97.jpg" },
  { id: 39, collectionId: "blackpink", name: "Jennie", category: "Cantante", rarity: "COMUNE", price: 50, img: "https://i.pinimg.com/736x/09/ae/11/09ae113baa6189c641d5bc4eacec99e4.jpg" },
  { id: 40, collectionId: "blackpink", name: "Jennie", category: "Cantante", rarity: "RARA", price: 150, img: "https://i.pinimg.com/1200x/22/2a/ae/222aae385deb49daeb252120c9b9fcb5.jpg" },
  { id: 41, collectionId: "blackpink", name: "Jennie", category: "Cantante", rarity: "RARA", price: 150, img: "https://i.pinimg.com/736x/14/0d/61/140d61733e340cf91993d42106d0525f.jpg" },
  { id: 42, collectionId: "blackpink", name: "Jennie", category: "Cantante", rarity: "RARA", price: 150, img: "https://i.pinimg.com/736x/71/16/63/71166352fec922e40f63b447ab020a24.jpg" },
  { id: 43, collectionId: "blackpink", name: "Jennie", category: "Cantante", rarity: "RARA", price: 150, img: "https://i.pinimg.com/1200x/8c/c1/b7/8cc1b785868ba337457e2831c270db0a.jpg" },
  { id: 44, collectionId: "blackpink", name: "Jennie", category: "Cantante", rarity: "LEGGENDARIA", price: 500, img: "https://i.pinimg.com/736x/3f/34/fd/3f34fd8783c4b27b1fe484d93aff3e22.jpg" },
  { id: 45, collectionId: "blackpink", name: "Jennie", category: "Cantante", rarity: "RARA", price: 150, img: "https://i.pinimg.com/736x/b8/cc/b4/b8ccb45063c04bb00859d17f5cae677e.jpg" },
  { id: 46, collectionId: "blackpink", name: "Jennie", category: "Cantante", rarity: "RARA", price: 150, img: "https://i.pinimg.com/736x/2d/34/7b/2d347b131aeb1c1713f400d914cb0232.jpg" },
  { id: 47, collectionId: "blackpink", name: "Jennie", category: "Cantante", rarity: "RARA", price: 150, img: "https://i.pinimg.com/736x/ea/22/3e/ea223eb3f9a795bfd011dced3821ab94.jpg" }, 
  { id: 48, collectionId: "blackpink", name: "Jennie", category: "Cantante", rarity: "LEGGENDARIA", price: 500, img: "https://i.pinimg.com/736x/5c/51/6d/5c516d563c6d19230343fe9d01440fdd.jpg" },
  // --- LISA ---
  { id: 49, collectionId: "blackpink", name: "Lisa", category: "Cantante", rarity: "COMUNE", price: 50, img:"https://i.pinimg.com/736x/75/62/1c/75621ca37ac11aaaee5a57952ad364e8.jpg" },
  { id: 50, collectionId: "blackpink", name: "Lisa", category: "Cantante", rarity: "COMUNE", price: 50, img:"https://i.pinimg.com/736x/db/c6/2d/dbc62de8d28b8219be5bd4c151be0cd5.jpg" },
  { id: 51, collectionId: "blackpink", name: "Lisa", category: "Cantante", rarity: "COMUNE", price: 50, img:"https://i.pinimg.com/736x/89/88/95/8988950e95ba3cde918c15093d7b8032.jpg" },
  { id: 52, collectionId: "blackpink", name: "Lisa", category: "Cantante", rarity: "COMUNE", price: 50, img:"https://i.pinimg.com/736x/dd/3d/35/dd3d351895071fc236fb006393b38849.jpg" },
  { id: 53, collectionId: "blackpink", name: "Lisa", category: "Cantante", rarity: "COMUNE", price: 50, img:"https://i.pinimg.com/736x/b2/de/3f/b2de3ffafcc6602091ab3982352f0044.jpg" },
  { id: 54, collectionId: "blackpink", name: "Lisa", category: "Cantante", rarity: "COMUNE", price: 50, img: "https://i.pinimg.com/1200x/98/be/e9/98bee974d9537df66c7646c90e244bef.jpg" },
  { id: 55, collectionId: "blackpink", name: "Lisa", category: "Cantante", rarity: "COMUNE", price: 50, img: "https://i.pinimg.com/736x/c1/9c/5e/c19c5ec42af7fb2c580912720ac8083e.jpg" }, 
  { id: 56, collectionId: "blackpink", name: "Lisa", category: "Cantante", rarity: "COMUNE", price: 50, img: "https://i.pinimg.com/736x/87/45/0f/87450fd87c903bb61b10e7fa730520c4.jpg" },
  { id: 57, collectionId: "blackpink", name: "Lisa", category: "Cantante", rarity: "COMUNE", price: 50, img: "https://i.pinimg.com/736x/96/a5/89/96a589a4211d6046d046bfa9e182d59a.jpg" },
  { id: 58, collectionId: "blackpink", name: "Lisa", category: "Cantante", rarity: "RARA", price: 150, img:"https://i.pinimg.com/736x/dc/47/4c/dc474c27d8ad198a84e8d46eee9c3fa5.jpg" }, 
  { id: 59, collectionId: "blackpink", name: "Lisa", category: "Cantante", rarity: "RARA", price: 150, img:"https://i.pinimg.com/736x/67/d9/98/67d998a4fabc1530e4894f5ae44839fb.jpg" },
  { id: 60, collectionId: "blackpink", name: "Lisa", category: "Cantante", rarity: "LEGGENDARIA", price: 500, img: "https://i.pinimg.com/1200x/50/63/d6/5063d621048ca7e7e09f2c839e7b7adc.jpg" },
  { id: 61, collectionId: "blackpink", name: "Lisa", category: "Cantante", rarity: "RARA", price: 150, img: "https://i.pinimg.com/736x/f4/90/9a/f4909a3a703b5ea202780f6589768dc3.jpg" },
  { id: 62, collectionId: "blackpink", name: "Lisa", category: "Cantante", rarity: "RARA", price: 150, img:"https://i.pinimg.com/736x/00/fc/e3/00fce3cb102ffae52f3966f75bd14266.jpg" },
  { id: 63, collectionId: "blackpink", name: "Lisa", category: "Cantante", rarity: "RARA", price: 150, img: "https://i.pinimg.com/1200x/06/a8/a9/06a8a94b01e1d7cb082321a3ba82d590.jpg" },
  { id: 64, collectionId: "blackpink", name: "Lisa", category: "Cantante", rarity: "LEGGENDARIA", price: 500, img: "https://i.pinimg.com/736x/8e/dc/2c/8edc2c7a86eab5a04457b4fe422a2e7b.jpg" }, 
  // --- ROSE ---
  { id: 65, collectionId: "blackpink", name: "Rosé", category: "Cantante", rarity:"COMUNE", price: 50, img: "https://i.pinimg.com/1200x/2c/a9/ac/2ca9acdba6aa68f9d7f4b092fd7fd657.jpg"},
  { id: 66, collectionId: "blackpink", name: "Rosé", category: "Cantante", rarity:"COMUNE", price: 50, img: "https://i.pinimg.com/736x/ed/ed/68/eded6892b1014ef6cc093d50e3128b16.jpg" },
  { id: 67, collectionId: "blackpink", name: "Rosé", category: "Cantante", rarity:"COMUNE", price: 50, img: "https://i.pinimg.com/736x/23/e2/f9/23e2f976d3ccef591790649d01edb653.jpg" },
  { id: 68, collectionId: "blackpink", name: "Rosé", category: "Cantante", rarity:"COMUNE", price: 50, img: "https://i.pinimg.com/736x/0b/5f/3a/0b5f3a5d2a83d4726b29670e8a537b86.jpg"},
  { id: 69, collectionId: "blackpink", name: "Rosé", category: "Cantante", rarity:"COMUNE", price: 50, img: "https://i.pinimg.com/1200x/f5/a5/13/f5a513ff1cc36df5b1c60b68eb6ab0c0.jpg"},
  { id: 70, collectionId: "blackpink", name: "Rosé", category: "Cantante", rarity:"COMUNE", price: 50, img: "https://i.pinimg.com/736x/c0/13/c3/c013c36e7989318d312aac7c5065aac5.jpg"},
  { id: 71, collectionId: "blackpink", name: "Rosé", category: "Cantante", rarity:"COMUNE", price: 50, img: "https://i.pinimg.com/736x/a4/e7/9e/a4e79e567a4e22a72432b7b940842352.jpg"},
  { id: 72, collectionId: "blackpink", name: "Rosé", category: "Cantante", rarity:"COMUNE", price: 50, img: "https://i.pinimg.com/1200x/8b/3a/f9/8b3af963653be0df1bf1107a84cb3382.jpg" },
  { id: 73, collectionId: "blackpink", name: "Rosé", category: "Cantante", rarity:"COMUNE", price: 50, img: "https://i.pinimg.com/736x/52/b1/58/52b158320b7368ba1542d167d5d0c0b1.jpg"},
  { id: 74, collectionId: "blackpink", name: "Rosé", category: "Cantante", rarity:"COMUNE", price: 50, img: "https://i.pinimg.com/1200x/e4/72/cd/e472cd52aa7461358cd3f810de88c6dd.jpg"},
  { id: 75, collectionId: "blackpink", name: "Rosé", category: "Cantante", rarity:"RARA", price: 150, img: "https://i.pinimg.com/736x/03/10/c8/0310c8406531b313566379467218e35b.jpg"},
  { id: 76, collectionId: "blackpink", name: "Rosé", category: "Cantante", rarity:"LEGGENDARIA", price: 500, img: "https://i.pinimg.com/736x/5c/af/fe/5caffe894ff351e37e94314efde32d66.jpg"},
  { id: 77, collectionId: "blackpink", name: "Rosé", category: "Cantante", rarity:"RARA", price: 150, img: "https://i.pinimg.com/736x/7b/27/09/7b2709983a6b04106d01e81fc2fd7e6a.jpg"},
  { id: 78, collectionId: "blackpink", name: "Rosé", category: "Cantante", rarity:"RARA", price: 150, img: "https://i.pinimg.com/736x/68/4a/9a/684a9ac0ecffe3e8521f35559169e635.jpg"},
  { id: 79, collectionId: "blackpink", name: "Rosé", category: "Cantante", rarity:"RARA", price: 150, img: "https://i.pinimg.com/736x/15/fb/69/15fb698a586cc294ee9ce83a6181eae7.jpg"},
  { id: 80, collectionId: "blackpink", name: "Rosé", category: "Cantante", rarity:"LEGGENDARIA", price: 500, img: "https://i.pinimg.com/1200x/4e/14/1e/4e141e0654f60b090b72632fd4e8ea07.jpg"},

  // --- BLACKPINK MOMENTS & SHIPS ---
  { id: 81, collectionId: "blackpink", name: "Backstage", category: "Moments", rarity: "COMUNE", price: 50, img: "https://i.pinimg.com/736x/31/11/ae/3111aec6991fd522725538c6f8fea2c7.jpg" },
  { id: 82, collectionId: "blackpink", name: "Met Gala", category: "Moments", rarity: "COMUNE", price: 50, img: "https://i.pinimg.com/736x/17/be/25/17be25b66c5759803d6d7954e3f678c7.jpg" },
  { id: 83, collectionId: "blackpink", name: "Coachella", category: "Moments", rarity: "RARA", price: 150, img: "https://i.pinimg.com/736x/1f/ff/ba/1fffbabe8dd9b2e07b7f3bffd54f2d48.jpg" },
  { id: 84, collectionId: "blackpink", name: "Met Gala", category: "Moments", rarity: "LEGGENDARIA", price: 500, img: "https://i.pinimg.com/1200x/2a/aa/cd/2aaacd9093ff75216136dd377f85ff1a.jpg" },
  { id: 85, collectionId: "blackpink", name: "Jenlisa", category: "Ship", rarity: "COMUNE", price: 50, img: "https://i.pinimg.com/736x/f3/21/f5/f321f596c72934fcbf4df254f045524e.jpg" },
  { id: 86, collectionId: "blackpink", name: "Jensoo", category: "Ship", rarity: "COMUNE", price: 50, img: "https://i.pinimg.com/1200x/64/91/05/6491055ddfc182c32300f3918a9256c9.jpg" },
  { id: 87, collectionId: "blackpink", name: "Lisoo", category: "Ship", rarity: "COMUNE", price: 50, img: "https://i.pinimg.com/736x/28/58/98/285898412e863fbf082051b4134ddfb7.jpg" },
  { id: 88, collectionId: "blackpink", name: "Lisoo", category: "Ship", rarity: "COMUNE", price: 50, img: "https://i.pinimg.com/736x/df/57/fb/df57fb6dfb8a214147a08108ef588cb5.jpg" },
  { id: 89, collectionId: "blackpink", name: "Chaennie", category: "Ship", rarity: "COMUNE", price: 50, img: "https://i.pinimg.com/736x/20/c4/b2/20c4b23082e23ddeb046d213905b5186.jpg" },
  { id: 90, collectionId: "blackpink", name: "Chaesoo", category: "Ship", rarity: "COMUNE", price: 50, img: "https://i.pinimg.com/736x/8b/2f/66/8b2f664770174e32905ba0ec7df27375.jpg" },
  { id: 91, collectionId: "blackpink", name: "Chaelisa", category: "Ship", rarity: "COMUNE", price: 50, img: "https://i.pinimg.com/736x/6b/90/1b/6b901b3647f54542e44a8b653bd15024.jpg" },
  { id: 92, collectionId: "blackpink", name: "Chaesoo", category: "Ship", rarity: "COMUNE", price: 50, img: "https://i.pinimg.com/736x/2e/c8/c5/2ec8c5636062e8ba0e7aa02221d3b02b.jpg" },
  { id: 93, collectionId: "blackpink", name: "Jensoo", category: "Ship", rarity: "RARA", price: 150, img: "https://i.pinimg.com/736x/11/6d/17/116d17070745a74ec5adb58d456753a8.jpg" },
  { id: 94, collectionId: "blackpink", name: "Jenlisa", category: "Ship", rarity: "RARA", price: 150, img: "https://i.pinimg.com/1200x/16/c8/b7/16c8b7021490d2a746840204b1d1b448.jpg" },
  { id: 95, collectionId: "blackpink", name: "Chaelisa", category: "Ship", rarity: "LEGGENDARIA", price: 500, img: "https://i.pinimg.com/736x/7a/46/0b/7a460bf5a89bec40a9c25082990c82ff.jpg" },
  { id: 96, collectionId: "blackpink", name: "Chaennie", category: "Ship", rarity: "LEGGENDARIA", price: 500, img: "https://i.pinimg.com/736x/c7/77/91/c77791b4b13302714bc8e1318e21a7d7.jpg" },

  // --- HOLLYWOOD STAR / ATTRICI COLLECTION ---
  { id: 97, collectionId: "special-actress", name: "Jenna Ortega", category: "Attrice", rarity: "RARA", price: 150, img: "https://i.pinimg.com/736x/6c/e6/a0/6ce6a018cdc0db12557122597697d93e.jpg" },
  { id: 98, collectionId: "special-actress", name: "Naya Rivera", category: "Attrice", rarity: "LEGGENDARIA", price: 500, img: "https://i.pinimg.com/1200x/f3/1b/b6/f31bb6d1e06fa91f7f95803cae0469a0.jpg" },
  { id: 99, collectionId: "special-actress", name: "Zendaya", category: "Attrice", rarity: "LEGGENDARIA", price: 500, img: "https://i.pinimg.com/736x/83/58/f7/8358f7d794f2258e0185d923bd3ffe23.jpg" },
  { id: 100, collectionId: "special-actress", name: "Hannah Dodd", category: "Attrice", rarity: "COMUNE", price: 50, img: "https://i.pinimg.com/736x/99/4d/a0/994da0fcc79ebf48a478ba4977f3f42a.jpg" },
  { id: 101, collectionId: "special-actress", name: "Sadie Sink", category: "Attrice", rarity: "RARA", price: 150, img: "https://i.pinimg.com/736x/c3/d3/46/c3d3461f4ca41524e0f49544ef49fc69.jpg" },
  { id: 102, collectionId: "special-actress", name: "Elizabeth Olsen", category: "Attrice", rarity: "LEGGENDARIA", price: 500, img: "https://i.pinimg.com/736x/69/b7/f6/69b7f6d0e81207d2de5f75b31b44ca35.jpg" },
  { id: 103, collectionId: "special-actress", name: "Stefania Spampinato", category: "Attrice", rarity: "COMUNE", price: 50, img: "https://i.pinimg.com/736x/99/5d/6c/995d6c35006589980fab34aa3a4e9a5e.jpg" },
  { id: 104, collectionId: "special-actress", name: "Megan Fox", category: "Attrice", rarity: "RARA", price: 150, img: "https://i.pinimg.com/1200x/e9/4b/14/e94b14fcb75463ad0ccb304997144e79.jpg" },
  { id: 105, collectionId: "special-actress", name: "Fivel Stewart", category: "Attrice", rarity: "COMUNE", price: 50, img: "https://i.pinimg.com/1200x/4a/db/bf/4adbbf8f89f8ab671c960d813e2e950b.jpg" },
  { id: 106, collectionId: "special-actress", name: "Alba Baptista", category: "Attrice", rarity: "COMUNE", price: 50, img: "https://i.pinimg.com/1200x/53/c3/e9/53c3e95e9df9556b3d154cad472eeef0.jpg" },
  { id: 107, collectionId: "special-actress", name: "Myra", category: "Attrice", rarity: "COMUNE", price: 50, img: "https://i.pinimg.com/736x/c1/21/49/c12149031b63719870db978578977586.jpg" },
  { id: 108, collectionId: "special-actress", name: "Begoña Vargas", category: "Attrice", rarity: "COMUNE", price: 50, img: "https://i.pinimg.com/1200x/40/2f/1b/402f1bbbe3009bc3cf0acc9b4437a808.jpg" },
  { id: 109, collectionId: "special-actress", name: "Stephanie Nur", category: "Attrice", rarity: "COMUNE", price: 50, img: "https://i.pinimg.com/1200x/c6/f7/a9/c6f7a92cbe859ab03d6d0c3d84b427b6.jpg" },
  { id: 110, collectionId: "special-actress", name: "Anne Hathaway", category: "Attrice", rarity: "LEGGENDARIA", price: 500, img: "https://i.pinimg.com/736x/4b/52/b0/4b52b070f08f5e6e59da0784f7d50577.jpg" },
  { id: 111, collectionId: "special-actress", name: "Hailee Steinfeld", category: "Attrice", rarity: "RARA", price: 150, img: "https://i.pinimg.com/736x/90/5d/59/905d598232f950c3a972a763e4e29f7e.jpg" },
  { id: 112, collectionId: "special-actress", name: "Dakota Johnson", category: "Attrice", rarity: "RARA", price: 150, img: "https://i.pinimg.com/736x/e0/2e/a7/e02ea70a9c771606b8621292c211eec1.jpg" },
  { id: 113, collectionId: "special-actress", name: "Naomi Scott", category: "Attrice", rarity: "COMUNE", price: 50, img: "https://i.pinimg.com/1200x/2d/1b/03/2d1b032749aaeb2ae4240a5497c05a30.jpg" },
  { id: 114, collectionId: "special-actress", name: "Talia Ryder", category: "Attrice", rarity: "COMUNE", price: 50, img: "https://i.pinimg.com/736x/a3/25/a7/a325a703b78485639817deddef1ddc48.jpg" },
  { id: 115, collectionId: "special-actress", name: "Arienne Mandi", category: "Attrice", rarity: "RARA", price: 150, img: "https://i.pinimg.com/1200x/4c/12/82/4c1282c57e20b1b9e12b46e0316e6da0.jpg" },
  { id: 116, collectionId: "special-actress", name: "Angelina Jolie", category: "Attrice", rarity: "LEGGENDARIA", price: 500, img: "https://i.pinimg.com/1200x/a1/06/d9/a106d966d8b10bd359e2e5be6613eff8.jpg" },
  { id: 117, collectionId: "special-actress", name: "Maya Reficco", category: "Attrice", rarity: "COMUNE", price: 50, img: "https://i.pinimg.com/1200x/ed/b8/98/edb898623367a097b7cfab33e7358ebe.jpg" },
  { id: 118, collectionId: "special-actress", name: "Camila Mendes", category: "Attrice", rarity: "RARA", price: 150, img: "https://i.pinimg.com/736x/48/68/24/486824acf47ab29f3340aca46e0c19db.jpg" },
  { id: 119, collectionId: "special-actress", name: "Aubrey Plaza", category: "Attrice", rarity: "RARA", price: 150, img: "https://i.pinimg.com/736x/ec/76/91/ec7691cc4be6ff5665505ca2352b53fa.jpg" },
  { id: 120, collectionId: "special-actress", name: "Lily-Rose Depp", category: "Attrice", rarity: "COMUNE", price: 50, img: "https://i.pinimg.com/736x/e7/a1/b2/e7a1b25da5fcb7d93c97f5ae43d13604.jpg" },
  { id: 121, collectionId: "special-actress", name: "Ester Expósito", category: "Attrice", rarity: "RARA", price: 150, img: "https://i.pinimg.com/736x/5a/4a/e2/5a4ae21590a546efdf00b254a945a029.jpg" },
  { id: 122, collectionId: "special-actress", name: "Winona Ryder", category: "Attrice", rarity: "LEGGENDARIA", price: 500, img: "https://i.pinimg.com/1200x/2e/47/73/2e477303c6b846dea1151bbe85baaa96.jpg" },
  { id: 123, collectionId: "special-actress", name: "Shay Mitchell", category: "Attrice", rarity: "RARA", price: 150, img: "https://i.pinimg.com/1200x/a4/b4/a4/a4b4a41ffeba3e368c66e7791774ef50.jpg" },
  { id: 124, collectionId: "special-actress", name: "Phoebe Tonkin", category: "Attrice", rarity: "RARA", price: 150, img: "https://i.pinimg.com/736x/34/56/36/3456362b12a681af934b93f4cbe42d9d.jpg" },
  { id: 125, collectionId: "special-actress", name: "Ella Rubin", category: "Attrice", rarity: "COMUNE", price: 50, img: "https://i.pinimg.com/736x/d4/53/1a/d4531a6c49759c19efa18231743c6e03.jpg" },
  { id: 126, collectionId: "special-actress", name: "Bo Bragason", category: "Attrice", rarity: "COMUNE", price: 50, img: "https://i.pinimg.com/736x/c9/24/9e/c9249e9c9a7033cc552a61f42901ee74.jpg" },
  { id: 127, collectionId: "special-actress", name: "Ella Hunt", category: "Attrice", rarity: "RARA", price: 150, img: "https://i.pinimg.com/736x/2f/be/9a/2fbe9a844eea087e2520cdbfbe894825.jpg" },
  { id: 128, collectionId: "special-actress", name: "Barbara Lopez", category: "Attrice", rarity: "RARA", price: 150, img: "https://i.pinimg.com/1200x/79/4d/d6/794dd623ebc58cf376a5539598ad6f10.jpg" },

  // --- POP STAR & ICON COLLECTION ---
  { id: 129, collectionId: "special-popstar", name: "Dua Lipa", category: "Pop Star", rarity: "LEGGENDARIA", price: 500, img: "https://i.pinimg.com/736x/17/2c/34/172c34440b1b1b39dde99cc9aa966968.jpg" },
  { id: 130, collectionId: "special-popstar", name: "Dua Lipa", category: "Pop Star", rarity: "RARA", price: 150, img: "https://i.pinimg.com/1200x/ce/28/56/ce28560835cf9b317995f596c8b90c03.jpg" },
  { id: 131, collectionId: "special-popstar", name: "Olivia Rodrigo", category: "Pop Star", rarity: "LEGGENDARIA", price: 500, img: "https://i.pinimg.com/736x/43/b9/96/43b9964bb7ec0d26d3f77631391e535a.jpg" },
  { id: 132, collectionId: "special-popstar", name: "Olivia Rodrigo", category: "Pop Star", rarity: "RARA", price: 150, img: "https://i.pinimg.com/736x/ee/97/1a/ee971affe8e394185cacaf5efaf6375b.jpg" },
  { id: 133, collectionId: "special-popstar", name: "Billie Eilish", category: "Pop Star", rarity: "LEGGENDARIA", price: 500, img: "https://i.pinimg.com/736x/16/63/a6/1663a62e8a3698a48fa7e389cc41679d.jpg" },
  { id: 134, collectionId: "special-popstar", name: "Billie Eilish", category: "Pop Star", rarity: "RARA", price: 150, img: "https://i.pinimg.com/1200x/97/4c/4b/974c4bcc0e4973243905407e77c18a7a.jpg" },
  { id: 135, collectionId: "special-popstar", name: "Gracie Abrams", category: "Pop Star", rarity: "LEGGENDARIA", price: 500, img: "https://i.pinimg.com/736x/44/84/9a/44849ad6781754c3908fe49cb6cc47a0.jpg" },
  { id: 136, collectionId: "special-popstar", name: "Gracie Abrams", category: "Pop Star", rarity: "RARA", price: 150, img: "https://i.pinimg.com/1200x/b4/20/af/b420afa70dd635f58ec28f6b92bc55bd.jpg" },
  { id: 137, collectionId: "special-popstar", name: "Tate McRae", category: "Pop Star", rarity: "RARA", price: 150, img: "https://i.pinimg.com/736x/b3/6d/e1/b36de15aa0c283c06eadeecd226d7a16.jpg" },
  { id: 138, collectionId: "special-popstar", name: "Lauren Jauregui", category: "Pop Star", rarity: "COMUNE", price: 50, img: "https://i.pinimg.com/1200x/02/3b/89/023b89d50a592112b09584e0d9026f8b.jpg" },
  { id: 139, collectionId: "special-popstar", name: "Camila Cabello", category: "Pop Star", rarity: "RARA", price: 150, img: "https://i.pinimg.com/1200x/45/e4/9f/45e49f7bb98e9fe3cbc2a531a61f2686.jpg" },
  { id: 140, collectionId: "special-popstar", name: "Chappell Roan", category: "Pop Star", rarity: "LEGGENDARIA", price: 500, img: "https://i.pinimg.com/1200x/62/be/c4/62bec434c2af42d91d59c5a8de2599f1.jpg" },
  { id: 141, collectionId: "special-popstar", name: "Halsey", category: "Pop Star", rarity: "RARA", price: 150, img: "https://i.pinimg.com/1200x/a0/80/b5/a080b53da59657b8d6171a3ad1f3e3aa.jpg" },
  { id: 142, collectionId: "special-popstar", name: "Sienna Spiro", category: "Pop Star", rarity: "COMUNE", price: 50, img: "https://i.pinimg.com/736x/0d/2c/81/0d2c818f31361541680842432cda7fd2.jpg" },
  { id: 143, collectionId: "special-popstar", name: "Adele", category: "Pop Star", rarity: "LEGGENDARIA", price: 500, img: "https://i.pinimg.com/736x/6d/30/35/6d303529d5f68ff1676b9af0fc579103.jpg" },
  { id: 144, collectionId: "special-popstar", name: "Adela", category: "Pop Star", rarity: "COMUNE", price: 50, img: "https://i.pinimg.com/1200x/a9/a2/d0/a9a2d0fa1bffa0d21e720297532615d1.jpg" },
  { id: 145, collectionId: "special-popstar", name: "Olivia Dean", category: "Pop Star", rarity: "COMUNE", price: 50, img: "https://i.pinimg.com/736x/05/5c/5d/055c5df4c47ca429dc755ff626e67502.jpg" },
  { id: 146, collectionId: "special-popstar", name: "Sabrina Carpenter", category: "Pop Star", rarity: "LEGGENDARIA", price: 500, img: "https://i.pinimg.com/1200x/00/41/12/00411237a6264e5cdf6951b4fb445883.jpg" },
  { id: 147, collectionId: "special-popstar", name: "Ariana Grande", category: "Pop Star", rarity: "LEGGENDARIA", price: 500, img: "https://i.pinimg.com/736x/17/e8/a9/17e8a9fe6b7db387396862ba107674dd.jpg" },
  { id: 148, collectionId: "special-popstar", name: "Sophia (KATSEYE)", category: "Pop Star", rarity: "COMUNE", price: 50, img: "https://i.pinimg.com/736x/09/aa/9b/09aa9b25ce58469ba5e9148e47ca2c19.jpg" },
  { id: 149, collectionId: "special-popstar", name: "Daniela (KATSEYE)", category: "Pop Star", rarity: "COMUNE", price: 50, img: "https://i.pinimg.com/736x/5b/e5/57/5be557045c46bd5875835c0454ff7554.jpg" },
  { id: 150, collectionId: "special-popstar", name: "Lara (KATSEYE)", category: "Pop Star", rarity: "COMUNE", price: 50, img: "https://i.pinimg.com/736x/33/8c/b0/338cb0af8876f8d47bb86d2a60bc9c8e.jpg" },
  { id: 151, collectionId: "special-popstar", name: "Manon (KATSEYE)", category: "Pop Star", rarity: "RARA", price: 150, img: "https://i.pinimg.com/736x/d4/07/12/d40712e510c8d46dbe81b0c7153301fa.jpg" },
  { id: 152, collectionId: "special-popstar", name: "Megan (KATSEYE)", category: "Pop Star", rarity: "COMUNE", price: 50, img: "https://i.pinimg.com/736x/1aad4c98449f8319df1c1e3c6ec0c631.jpg" },
  { id: 153, collectionId: "special-popstar", name: "Yoonchae (KATSEYE)", category: "Pop Star", rarity: "RARA", price: 150, img: "https://i.pinimg.com/736x/4c/75/20/4c75206d1452667f4c5f472e9919ea00.jpg" },
  { id: 154, collectionId: "special-popstar", name: "Dua Lipa", category: "Pop Star", rarity: "RARA", price: 150, img: "https://i.pinimg.com/736x/2f/64/78/2f6478ab724ad761bef59cee7fa7faea.jpg" },
  { id: 155, collectionId: "special-popstar", name: "Olivia Rodrigo", category: "Pop Star", rarity: "RARA", price: 150, img: "https://i.pinimg.com/736x/29/e2/a7/29e2a7143243ce0161434de7e564b1e6.jpg" },
  { id: 156, collectionId: "special-popstar", name: "Billie Eilish", category: "Pop Star", rarity: "RARA", price: 150, img: "https://i.pinimg.com/736x/6d/5b/be/6d5bbe01dd90df7e9eef50b9bb9637ad.jpg" },
  { id: 157, collectionId: "special-popstar", name: "Gracie Abrams", category: "Pop Star", rarity: "RARA", price: 150, img: "https://i.pinimg.com/736x/ef/6e/56/ef6e5667fea39d215769f1d127565d84.jpg" },
  { id: 158, collectionId: "special-popstar", name: "Rihanna", category: "Pop Star", rarity: "LEGGENDARIA", price: 500, img: "https://i.pinimg.com/736x/c6/ab/d8/c6abd8c2a070c4e68b60d2db389da4b5.jpg" },
  { id: 159, collectionId: "special-popstar", name: "Lady Gaga", category: "Pop Star", rarity: "LEGGENDARIA", price: 500, img: "https://i.pinimg.com/736x/b9/15/9e/b9159e5056d407cecf7058db8e40af56.jpg" },
  { id: 160, collectionId: "special-popstar", name: "Dua Lipa", category: "Pop Star", rarity: "LEGGENDARIA", price: 500, img: "https://i.pinimg.com/736x/29/b0/78/29b0781694060d16d4b7ed7f72e9068d.jpg" },
  
  // --- GL THAI & SPECIAL SHIPS COLLECTION ---
  { id: 161, collectionId: "special-ships", name: "Englot", category: "Couple GL", rarity: "RARA", price: 150, img: "https://i.pinimg.com/736x/03/59/50/03595044a4977fccb5a35e77978f2db3.jpg" },
  { id: 162, collectionId: "special-ships", name: "Freenbecky", category: "Couple GL", rarity: "LEGGENDARIA", price: 500, img: "https://i.pinimg.com/1200x/86/a5/fe/86a5fe1325dcd68f289929011927065e.jpg" },
  { id: 163, collectionId: "special-ships", name: "GinJ", category: "Couple GL", rarity: "COMUNE", price: 50, img: "https://i.pinimg.com/736x/7c/8c/88/7c8c887e493cd8208418f9402078494b.jpg" },
  { id: 164, collectionId: "special-ships", name: "JanJingJing", category: "Couple GL", rarity: "COMUNE", price: 50, img: "https://i.pinimg.com/736x/94/ed/f4/94edf483dcc0347f2d75043afc16090e.jpg" },
  { id: 165, collectionId: "special-ships", name: "KaoJane", category: "Couple GL", rarity: "RARA", price: 150, img: "https://i.pinimg.com/736x/85/36/9d/85369d593e029b40191a2f1e075de9f3.jpg" },
  { id: 166, collectionId: "special-ships", name: "KapookCiize", category: "Couple GL", rarity: "COMUNE", price: 50, img: "https://i.pinimg.com/736x/ca/db/ec/cadbec241cfe3a825870bbcbc6e223ae.jpg" },
  { id: 167, collectionId: "special-ships", name: "LenaMiu", category: "Couple GL", rarity: "RARA", price: 150, img: "https://i.pinimg.com/736x/69/2f/96/692f96e4d91e159763d55db3b82845b6.jpg" },
  { id: 168, collectionId: "special-ships", name: "LingOrm", category: "Couple GL", rarity: "LEGGENDARIA", price: 500, img: "https://i.pinimg.com/736x/3b/ba/63/3bba6387bf9a89cafd33151224bc2081.jpg" },
  { id: 169, collectionId: "special-ships", name: "LMSY", category: "Couple GL", rarity: "LEGGENDARIA", price: 500, img: "https://i.pinimg.com/736x/0d/3f/3d/0d3f3d03534a6fc7ed2cc1eeda9b1276.jpg" },
  { id: 170, collectionId: "special-ships", name: "MieAya", category: "Couple GL", rarity: "COMUNE", price: 50, img: "https://i.pinimg.com/736x/aa/2c/db/aa2cdbca1cd96711d8b1a28f990fc779.jpg" },
  { id: 171, collectionId: "special-ships", name: "MilkLove", category: "Couple GL", rarity: "LEGGENDARIA", price: 500, img: "https://i.pinimg.com/736x/3b/99/09/3b99097dc1942434876a86aa46e37774.jpg" },
  { id: 172, collectionId: "special-ships", name: "NamtanFilm", category: "Couple GL", rarity: "RARA", price: 150, img: "https://i.pinimg.com/736x/1e/90/e2/1e90e22225982c5cffb18e84b0969c05.jpg" },
  { id: 173, collectionId: "special-ships", name: "OomBam", category: "Couple GL", rarity: "COMUNE", price: 50, img: "https://i.pinimg.com/736x/30/a5/03/30a503c741929b83cb91900e8ad9f86f.jpg" },
  { id: 174, collectionId: "special-ships", name: "PuifayPloy", category: "Couple GL", rarity: "COMUNE", price: 50, img: "https://i.pinimg.com/736x/c7/c8/1d/c7c81d9ec28b1420ca70a3aa5c600671.jpg" },
  { id: 175, collectionId: "special-ships", name: "TKNur", category: "Couple GL", rarity: "COMUNE", price: 50, img: "https://i.pinimg.com/736x/5b/48/f3/5b48f36b3d87ad86e6625f0768046646.jpg" },
  { id: 176, collectionId: "special-ships", name: "PuinoonBint", category: "Couple GL", rarity: "COMUNE", price: 50, img: "https://i.pinimg.com/736x/a5/7c/d9/a57cd9138e6f8f69de1a28e036ca2f8b.jpg" },

  // --- ATTRICI SINGOLE GL THAI ---
  { id: 177, collectionId: "special-ships", name: "Angelina", category: "Attrice GL", rarity: "COMUNE", price: 50, img: "https://i.pinimg.com/736x/c7/d3/02/c7d302d8de8834f0f758e98bbcf40ed1.jpg" },
  { id: 178, collectionId: "special-ships", name: "Aya", category: "Attrice GL", rarity: "COMUNE", price: 50, img: "https://i.pinimg.com/736x/5d/68/d4/5d68d420d0cf6fde38ad42f7afc6e106.jpg" },
  { id: 179, collectionId: "special-ships", name: "Bam", category: "Attrice GL", rarity: "COMUNE", price: 50, img: "https://i.pinimg.com/1200x/90/2f/e0/902fe0047e77e026ad3fea2a912b0edc.jpg" },
  { id: 180, collectionId: "special-ships", name: "Becky", category: "Attrice GL", rarity: "RARA", price: 150, img: "https://i.pinimg.com/736x/05/5f/b0/055fb003bc093bce92be4a212a1b59aa.jpg" },
  { id: 181, collectionId: "special-ships", name: "Charlotte", category: "Attrice GL", rarity: "RARA", price: 150, img: "https://i.pinimg.com/736x/f7/e1/d4/f7e1d480e05e7f15b4364b6dd6b4a353.jpg" },
  { id: 182, collectionId: "special-ships", name: "Ciize", category: "Attrice GL", rarity: "COMUNE", price: 50, img: "https://i.pinimg.com/1200x/65/b0/ac/65b0acddbd5ef3470c2f8221236501bc.jpg" },
  { id: 183, collectionId: "special-ships", name: "Engfa", category: "Attrice GL", rarity: "RARA", price: 150, img: "https://i.pinimg.com/736x/af/3b/6a/af3b6a3ac1eaadd63f22cbcc1a027f1b.jpg" },
  { id: 184, collectionId: "special-ships", name: "Film", category: "Attrice GL", rarity: "COMUNE", price: 50, img: "https://i.pinimg.com/736x/cd/2f/57/cd2f57bcc03615936532a602de408636.jpg" },
  { id: 185, collectionId: "special-ships", name: "Freen", category: "Attrice GL", rarity: "RARA", price: 150, img: "https://i.pinimg.com/736x/f4/0c/1d/f40c1d233328b6f82c9e777855b7ccad.jpg" },
  { id: 186, collectionId: "special-ships", name: "Ginny", category: "Attrice GL", rarity: "COMUNE", price: 50, img: "https://i.pinimg.com/736x/99/4a/80/994a80b326255dd126a8a3254d064a9a.jpg" },
  { id: 187, collectionId: "special-ships", name: "Jan", category: "Attrice GL", rarity: "COMUNE", price: 50, img: "https://i.pinimg.com/736x/84/a8/8a/84a88a96d216d3d7745e9929f705d7d9.jpg" },
  { id: 188, collectionId: "special-ships", name: "Jane", category: "Attrice GL", rarity: "COMUNE", price: 50, img: "https://i.pinimg.com/736x/b6/8c/c3/b68cc3f40391d90efad81aaafb2e4609.jpg" },
  { id: 189, collectionId: "special-ships", name: "Nepjune", category: "Attrice GL", rarity:"COMUNE", price: 50, img: "https://i.pinimg.com/736x/cc/28/d8/cc28d8f2145a36e9a4a6d68bed0bf46f.jpg" },
  { id: 190, collectionId: "special-ships", name: "JingJing", category: "Attrice GL", rarity: "COMUNE", price: 50, img: "https://i.pinimg.com/736x/54/b9/29/54b9296e5c2790039d1db2eae78467ed.jpg" },
  { id: 191, collectionId: "special-ships", name: "Kao", category: "Attrice GL", rarity: "LEGGENDARIA", price: 500, img: "https://i.pinimg.com/736x/15/e9/b3/15e9b3bd069a7288db5c66180fe0aca7.jpg" },
  { id: 192, collectionId: "special-ships", name: "Kapook", category: "Attrice GL", rarity: "COMUNE", price: 50, img: "https://i.pinimg.com/736x/d3/be/76/d3be76c336a570bec872c6b55b6df74c.jpg" },
  { id: 193, collectionId: "special-ships", name: "Lena", category: "Attrice GL", rarity: "COMUNE", price: 50, img: "https://i.pinimg.com/736x/6c/7e/a2/6c7ea29d5890bc1c50ca857d3ebc6a2e.jpg" },
  { id: 194, collectionId: "special-ships", name: "Lingling", category: "Attrice GL", rarity: "LEGGENDARIA", price: 500, img: "https://i.pinimg.com/736x/c1/73/9e/c1739e31f8f6d5c17675528ca4d45a39.jpg" },
  { id: 195, collectionId: "special-ships", name: "Lookmhee", category: "Attrice GL", rarity: "LEGGENDARIA", price: 500, img: "https://i.pinimg.com/736x/6f/85/f1/6f85f166055db4a04e032a1d4ebefbb9.jpg" },
  { id: 196, collectionId: "special-ships", name: "Love", category: "Attrice GL", rarity: "RARA", price: 150, img: "https://i.pinimg.com/736x/0d/5f/71/0d5f7149581a8b607be9b2a217e21379.jpg" },
  { id: 197, collectionId: "special-ships", name: "Mie", category: "Attrice GL", rarity: "COMUNE", price: 50, img: "https://i.pinimg.com/736x/02/e3/42/02e342df189c52d271d221551b0c80ee.jpg" },
  { id: 198, collectionId: "special-ships", name: "Milk", category: "Attrice GL", rarity: "RARA", price: 150, img: "https://i.pinimg.com/736x/d6/eb/6b/d6eb6bf61134dae606706d96d043f60a.jpg" },
  { id: 199, collectionId: "special-ships", name: "Miu", category: "Attrice GL", rarity: "COMUNE", price: 50, img: "https://i.pinimg.com/736x/e1/f0/73/e1f0730d8b94bc5d9dd62b2ba4d49e79.jpg" },
  { id: 200, collectionId: "special-ships", name: "Namtan", category: "Attrice GL", rarity: "COMUNE", price: 50, img: "https://i.pinimg.com/1200x/e7/28/d7/e728d7fc1df236a62230a68ec3612652.jpg" },
  { id: 201, collectionId: "special-ships", name: "Nur", category: "Attrice GL", rarity: "COMUNE", price: 50, img: "https://i.pinimg.com/736x/54/d9/5b/54d95b13488701d67afd2956732d8717.jpg" },
  { id: 202, collectionId: "special-ships", name: "Oom", category: "Attrice GL", rarity: "COMUNE", price: 50, img: "https://i.pinimg.com/736x/06/56/5c/06565ca6b268a5533849a2b9bc2cc934.jpg" },
  { id: 203, collectionId: "special-ships", name: "Orm", category: "Attrice GL", rarity: "LEGGENDARIA", price: 500, img: "https://i.pinimg.com/736x/9d/55/86/9d55864468f62fe8059cefbf36087a3b.jpg" },
  { id: 204, collectionId: "special-ships", name: "Piploy", category: "Attrice GL", rarity: "RARA", price: 150, img: "https://i.pinimg.com/1200x/c1/48/a4/c148a4f4b0ddd7f3ba0e4ac40f17971c.jpg" },
  { id: 205, collectionId: "special-ships", name: "Ploy", category: "Attrice GL", rarity: "COMUNE", price: 50, img: "https://i.pinimg.com/736x/3b/d7/8d/3bd78df3053cb3f349965669dba89e23.jpg" },
  { id: 206, collectionId: "special-ships", name: "Puifay", category: "Attrice GL", rarity: "COMUNE", price: 50, img: "https://i.pinimg.com/736x/de/b2/00/deb20053dd1761489a6a0d68fd47b503.jpg" },
  { id: 207, collectionId: "special-ships", name: "Sonya", category: "Attrice GL", rarity: "LEGGENDARIA", price: 500, img: "https://i.pinimg.com/736x/f6/06/db/f606dbaf9ff2034b8db836035ee7aa3b.jpg" },
  { id: 208, collectionId: "special-ships", name: "TK", category: "Attrice GL", rarity: "COMUNE", price: 50, img: "https://i.pinimg.com/1200x/14/a5/22/14a5229fa2f1c9e5027fc82f062bbf69.jpg" },
  { id: 209, collectionId: "special-ships", name: "Tu Tontawan", category: "Attrice GL", rarity: "RARA", price: 150, img: "https://i.pinimg.com/736x/3c/b8/17/3cb81709c66e463555f8e101920d062e.jpg" },
  { id: 210, collectionId: "special-ships", name: "Ming", category: "Attrice GL", rarity: "COMUNE", price: 50, img: "https://i.pinimg.com/736x/71/65/22/7165226763417e8acf308d1f14861172.jpg" },
];
