let userState = loadProgress() || {
  credits: 500,
  username: "SapphicCollector",
  unlockedCards: [], 
  favoriteCardId: null, 
  avatarImg: null,      
  lastFreeClaim: 0,
  lastMemoryPlayed: "",
  lastWheelPlayed: "",
  lastDailyLogin: "",
  streakDays: 0,
  lastStreakClaimDate: ""
};

let pendingPurchaseCardId = null;

// DATABASE COLLEZIONI
const collectionsDatabase = [
  {
    id: "blackpink",
    title: "BLACKPINK Collection 🖤🩷",
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

let currentCollectionId = null;
let currentShopCategory = null;

let albumState = {
  currentPage: 1,
  cardsPerPage: 16
};

/* --- POP-UP PERSONALIZZATO --- */
function showPopup(title, message, iconClass = "fa-solid fa-sparkles") {
  const modal = document.getElementById('custom-alert-modal');
  const titleEl = document.getElementById('custom-alert-title');
  const msgEl = document.getElementById('custom-alert-message');
  const iconEl = document.getElementById('custom-alert-icon');

  if (titleEl) titleEl.innerText = title;
  if (msgEl) msgEl.innerText = message;
  if (iconEl) iconEl.innerHTML = `<i class="${iconClass}"></i>`;

  if (modal) modal.classList.remove('hidden');
}

function closeCustomAlert() {
  const modal = document.getElementById('custom-alert-modal');
  if (modal) modal.classList.add('hidden');
}

function saveProgress() {
  localStorage.setItem('crush_cards_userstate', JSON.stringify(userState));
}

function loadProgress() {
  const saved = localStorage.getItem('crush_cards_userstate');
  return saved ? JSON.parse(saved) : null;
}

function resetGameProgress() {
  if (confirm("Sei sicura di voler resettare tutti i tuoi progressi? L'operazione non può essere annullata.")) {
    localStorage.removeItem('crush_cards_userstate');
    location.reload();
  }
}

function switchTab(screenId, element) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(btn => btn.classList.remove('active'));

  document.getElementById(screenId).classList.add('active');
  element.classList.add('active');

  if (screenId === 'sec-album') {
    renderCollections();
  } else if (screenId === 'sec-shop') {
    renderShop();
  }
}

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

function renderCollections() {
  const container = document.getElementById('collections-list');
  if (!container) return;
  container.innerHTML = '';

  collectionsDatabase.forEach(col => {
    const colCards = cardsDatabase.filter(c => c.collectionId === col.id);
    const unlocked = colCards.filter(c => userState.unlockedCards.includes(c.id)).length;
    const progressPercent = colCards.length > 0 ? (unlocked / colCards.length) * 100 : 0;

    container.innerHTML += `
      <div class="collection-card-item" onclick="openCollection('${col.id}')">
        <div class="col-cover" style="background-image: url('${col.coverImg}')">
          <div class="col-overlay">
            <h4>${col.title}</h4>
            <p>${unlocked} / ${colCards.length} sbloccate</p>
            <div class="col-progress-bar">
              <div class="col-progress-fill" style="width: ${progressPercent}%"></div>
            </div>
          </div>
        </div>
      </div>
    `;
  });
}

function openCollection(collectionId) {
  currentCollectionId = collectionId;
  albumState.currentPage = 1;
  
  document.getElementById('album-collections-view').classList.add('hidden');
  document.getElementById('album-cards-view').classList.remove('hidden');

  renderAlbum();
}

function closeCollection() {
  currentCollectionId = null;
  document.getElementById('album-cards-view').classList.add('hidden');
  document.getElementById('album-collections-view').classList.remove('hidden');
  renderCollections();
}

function renderAlbum() {
  if (!currentCollectionId) return;

  const grid = document.getElementById('album-grid');
  if (!grid) return;
  grid.innerHTML = '';

  const activeCollection = collectionsDatabase.find(c => c.id === currentCollectionId);
  const filteredCards = cardsDatabase.filter(c => c.collectionId === currentCollectionId);

  const totalPages = Math.max(1, Math.ceil(filteredCards.length / albumState.cardsPerPage));
  if (albumState.currentPage > totalPages) albumState.currentPage = totalPages;

  const categoryTitleEl = document.getElementById('album-category-title');
  const pageFooterEl = document.getElementById('page-number-footer');

  if (categoryTitleEl && activeCollection) {
    categoryTitleEl.innerText = activeCollection.title;
  }
  if (pageFooterEl) {
    pageFooterEl.innerText = `Pagina ${albumState.currentPage} di ${totalPages}`;
  }

  const start = (albumState.currentPage - 1) * albumState.cardsPerPage;
  const end = start + albumState.cardsPerPage;
  const currentCards = filteredCards.slice(start, end);

  currentCards.forEach(card => {
    const isUnlocked = userState.unlockedCards.includes(card.id);

    if (isUnlocked) {
      grid.innerHTML += `
        <div onclick="openZoomCard(${card.id})" style="cursor: pointer;">
          ${createCardHTML(card)}
        </div>
      `;
    } else {
      grid.innerHTML += `
        <div class="collectible-card locked">
          <div class="lock-circle"><i class="fa-solid fa-lock"></i></div>
          <div class="locked-name">${card.name}</div>
        </div>
      `;
    }
  });

  updateUI();
}

function nextPage() {
  if (!currentCollectionId) return;
  const filteredCards = cardsDatabase.filter(c => c.collectionId === currentCollectionId);
  const totalPages = Math.ceil(filteredCards.length / albumState.cardsPerPage);

  if (albumState.currentPage < totalPages) {
    animatePageTurn(() => {
      albumState.currentPage++;
      renderAlbum();
    });
  }
}

function prevPage() {
  if (albumState.currentPage > 1) {
    animatePageTurn(() => {
      albumState.currentPage--;
      renderAlbum();
    });
  }
}

function animatePageTurn(callback) {
  const grid = document.getElementById('album-grid');
  if (grid) {
    grid.classList.add('turn-page');
    setTimeout(() => {
      callback();
      grid.classList.remove('turn-page');
    }, 300);
  } else {
    callback();
  }
}

/* --- ZOOM, FLIP E INCLINAZIONE 3D AL TOCCO --- */
function openZoomCard(cardId) {
  const card = cardsDatabase.find(c => c.id === cardId);
  if (card) {
    const container = document.getElementById('zoom-card-inner');
    if(container) {
      container.classList.remove('flipped');
      container.style.transform = 'rotateX(0deg) rotateY(0deg)';
    }
    
    container.innerHTML = `
      <div class="zoom-card-face zoom-card-front">
        ${createCardHTML(card)}
      </div>
      <div class="zoom-card-face zoom-card-back">
        <div class="zoom-card-back-pattern">
          <i class="fa-solid fa-sparkles"></i>
          <h3>CRUSH CARDS</h3>
          <p>Official Collection</p>
        </div>
      </div>
    `;
    
    document.getElementById('zoom-modal').classList.remove('hidden');
    initTiltEffect();
  }
}

function toggleCardFlip() {
  const container = document.getElementById('zoom-card-inner');
  if (container) {
    container.classList.toggle('flipped');
  }
}

function initTiltEffect() {
  const container = document.getElementById('zoom-card-inner');
  const wrapper = document.querySelector('.tilt-card-container');
  if (!container || !wrapper) return;

  function handleTouchMove(e) {
    const rect = wrapper.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;

    const x = clientX - rect.left;
    const y = clientY - rect.top;
    
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rotateX = -((y - centerY) / centerY) * 20;
    const rotateY = ((x - centerX) / centerX) * 20;

    if (!container.classList.contains('flipped')) {
      container.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
    }
  }

  function resetTilt() {
    container.style.transition = 'transform 0.5s ease';
    if (!container.classList.contains('flipped')) {
      container.style.transform = 'rotateX(0deg) rotateY(0deg)';
    }
    setTimeout(() => {
      container.style.transition = 'transform 0.1s ease-out';
    }, 500);
  }

  wrapper.onmousemove = handleTouchMove;
  wrapper.onmouseleave = resetTilt;

  wrapper.ontouchmove = handleTouchMove;
  wrapper.ontouchend = resetTilt;
}

function closeZoomModal() {
  document.getElementById('zoom-modal').classList.add('hidden');
}

/* --- SHOP MODERNO --- */
function renderShop() {
  const container = document.getElementById('shop-categories-list');
  if (!container) return;
  container.innerHTML = '';

  collectionsDatabase.forEach(col => {
    const colCards = cardsDatabase.filter(c => c.collectionId === col.id);
    if (colCards.length === 0) return;

    const categoriesMap = {};
    colCards.forEach(card => {
      let catKey = card.name;
      if (!categoriesMap[catKey]) {
        const catCards = colCards.filter(c => c.name === catKey);
        const unlockedCardInCat = catCards.find(c => userState.unlockedCards.includes(c.id));
        let displayCard = unlockedCardInCat ? unlockedCardInCat : catCards[0];

        categoriesMap[catKey] = {
          name: catKey,
          previewCard: displayCard,
          cards: catCards
        };
      }
    });

    const categories = Object.values(categoriesMap);

    let albumHTML = `
      <div class="shop-album-group">
        <h3 class="shop-album-title">${col.title}</h3>
        <div class="horizontal-shop-row">
    `;

    categories.forEach(cat => {
      const unlocked = cat.cards.filter(c => userState.unlockedCards.includes(c.id)).length;
      const total = cat.cards.length;

      if (unlocked > 0) {
        albumHTML += `
          <div class="shop-category-card-item" onclick="openShopCategory('${cat.name}')">
            <div class="shop-card-preview-box">
              ${createCardHTML(cat.previewCard)}
            </div>
            <div class="shop-cat-info">
              <h4>${cat.name}</h4>
              <p>${unlocked} / ${total} sbloccate</p>
            </div>
          </div>
        `;
      } else {
        albumHTML += `
          <div class="shop-category-card-item" onclick="openShopCategory('${cat.name}')">
            <div class="shop-card-preview-box">
              <div class="collectible-card locked" style="width:100%; height:100%;">
                <div class="lock-circle"><i class="fa-solid fa-lock"></i></div>
                <div class="locked-name">${cat.name}</div>
              </div>
            </div>
            <div class="shop-cat-info">
              <h4>${cat.name}</h4>
              <p>0 / ${total} sbloccate</p>
            </div>
          </div>
        `;
      }
    });

    albumHTML += `
        </div>
      </div>
    `;

    container.innerHTML += albumHTML;
  });
}

function openShopCategory(categoryName) {
  currentShopCategory = categoryName;
  
  const shopCatView = document.getElementById('shop-categories-view');
  const shopCardsView = document.getElementById('shop-cards-view');
  const shopTitle = document.getElementById('shop-category-title');

  if (shopCatView) shopCatView.classList.add('hidden');
  if (shopCardsView) shopCardsView.classList.remove('hidden');
  if (shopTitle) shopTitle.innerText = categoryName;

  renderShopCategoryGrid();
}

function closeShopCategory() {
  currentShopCategory = null;
  const shopCatView = document.getElementById('shop-categories-view');
  const shopCardsView = document.getElementById('shop-cards-view');

  if (shopCardsView) shopCardsView.classList.add('hidden');
  if (shopCatView) shopCatView.classList.remove('hidden');
  renderShop();
}

function renderShopCategoryGrid() {
  if (!currentShopCategory) return;
  const grid = document.getElementById('shop-grid');
  if (!grid) return;
  grid.innerHTML = '';

  const categoryCards = cardsDatabase.filter(c => c.name === currentShopCategory);

  categoryCards.forEach(card => {
    const isUnlocked = userState.unlockedCards.includes(card.id);

    if (isUnlocked) {
      grid.innerHTML += `
        <div class="shop-card-item-box" onclick="openZoomCard(${card.id})" style="cursor: pointer;">
          <div class="shop-card-preview">
            ${createCardHTML(card)}
            <div class="card-badge-overlay unlocked">
              <i class="fa-solid fa-check"></i>
            </div>
          </div>
        </div>
      `;
    } else {
      grid.innerHTML += `
        <div class="shop-card-item-box" onclick="promptBuyCard(${card.id})" style="cursor: pointer;">
          <div class="shop-card-preview">
            <div class="collectible-card locked" style="width:100%; height:100%;">
              <div class="lock-circle"><i class="fa-solid fa-lock"></i></div>
              <div class="locked-name">${card.rarity}</div>
            </div>
            <div class="card-badge-overlay price">
              <i class="fa-solid fa-coins"></i> ${card.price}
            </div>
          </div>
        </div>
      `;
    }
  });
}

/* --- CONFERMA ACQUISTO CARD TRAMITE POP-UP --- */
function promptBuyCard(cardId) {
  const card = cardsDatabase.find(c => c.id === cardId);
  if (!card) return;

  pendingPurchaseCardId = cardId;

  const modal = document.getElementById('confirm-buy-modal');
  const titleEl = document.getElementById('confirm-buy-title');
  const msgEl = document.getElementById('confirm-buy-message');

  if (titleEl) titleEl.innerText = `Acquista ${card.name}`;
  if (msgEl) msgEl.innerText = `Vuoi acquistare questa card ${card.rarity} per ${card.price} crediti?`;

  if (modal) modal.classList.remove('hidden');
}

function cancelBuyCard() {
  pendingPurchaseCardId = null;
  const modal = document.getElementById('confirm-buy-modal');
  if (modal) modal.classList.add('hidden');
}

function confirmBuyCard() {
  if (!pendingPurchaseCardId) return;
  const cardId = pendingPurchaseCardId;
  pendingPurchaseCardId = null;

  cancelBuyCard();

  const card = cardsDatabase.find(c => c.id === cardId);
  if (!card) return;

  if (userState.credits >= card.price) {
    userState.credits -= card.price;
    userState.unlockedCards.push(card.id);
    
    saveProgress();
    updateUI();
    showReward(card);

    if (currentCollectionId) renderAlbum();
    if (currentShopCategory) renderShopCategoryGrid();
    renderCollections();
    renderShop();
  } else {
    showPopup("Crediti Insufficienti! 💸", "Non hai abbastanza crediti per acquistare questa card. Gioca al Memory o attendi la Free Card!", "fa-solid fa-coins");
  }
}

function claimFreeCardAnimation() {
  const now = Date.now();
  const threeDays = 3 * 24 * 60 * 60 * 1000;

  if (now - userState.lastFreeClaim >= threeDays) {
    const lockedCards = cardsDatabase.filter(c => !userState.unlockedCards.includes(c.id));

    if (lockedCards.length === 0) {
      showPopup("Incredibile! 👑", "Complimenti! Hai già sbloccato TUTTE le card dell'album!", "fa-solid fa-crown");
      return;
    }

    const rand = Math.random();
    let selectedRarity = "COMUNE";

    if (rand < 0.05) {
      selectedRarity = "LEGGENDARIA";
    } else if (rand < 0.20) {
      selectedRarity = "RARA";
    } else {
      selectedRarity = "COMUNE";
    }

    let pool = lockedCards.filter(c => c.rarity === selectedRarity);
    if (pool.length === 0) pool = lockedCards;

    const randomCard = pool[Math.floor(Math.random() * pool.length)];
    userState.unlockedCards.push(randomCard.id);
    userState.lastFreeClaim = now;

    saveProgress();
    updateUI();
    showReward(randomCard);

    if (currentCollectionId) renderAlbum();
    if (currentShopCategory) renderShopCategoryGrid();
    renderCollections();
    renderShop();
    updateTimer();
  }
}

/* --- FUNZIONE SCRATCH CARD (GRATTA E VINCI) --- */
function setupScratchCanvas() {
  const canvas = document.getElementById('scratch-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  
  canvas.style.display = 'block';
  
  canvas.width = 200;
  canvas.height = 290;

  ctx.globalCompositeOperation = 'source-over';
  
  const grad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
  grad.addColorStop(0, '#D4AF37');
  grad.addColorStop(0.5, '#FFFDD0');
  grad.addColorStop(1, '#AA771C');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  ctx.fillStyle = "#3A2329";
  ctx.font = "bold 15px sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("✨ GRATTA QUI ✨", canvas.width / 2, canvas.height / 2);

  let isScratching = false;

  function scratch(e) {
    if (!isScratching) return;
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (clientX - rect.left) * scaleX;
    const y = (clientY - rect.top) * scaleY;

    ctx.globalCompositeOperation = 'destination-out';
    ctx.beginPath();
    ctx.arc(x, y, 22, 0, Math.PI * 2);
    ctx.fill();

    checkScratchPercent();
  }

  function checkScratchPercent() {
    const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    let clearCount = 0;
    for (let i = 3; i < pixels.length; i += 4) {
      if (pixels[i] === 0) clearCount++;
    }
    const percent = (clearCount / (pixels.length / 4)) * 100;
    
    if (percent > 40) {
      canvas.style.display = 'none';
      const closeBtn = document.getElementById('btn-close-reward');
      if (closeBtn) closeBtn.style.display = 'block';
    }
  }

  canvas.onmousedown = (e) => { isScratching = true; scratch(e); };
  canvas.onmousemove = scratch;
  canvas.onmouseup = () => { isScratching = false; };

  canvas.ontouchstart = (e) => { isScratching = true; scratch(e); };
  canvas.ontouchmove = scratch;
  canvas.ontouchend = () => { isScratching = false; };
}

function showReward(card) {
  document.getElementById('modal-card-front').innerHTML = createCardHTML(card);
  
  const closeBtn = document.getElementById('btn-close-reward');
  if (closeBtn) closeBtn.style.display = 'none';

  document.getElementById('reward-modal').classList.remove('hidden');
  setupScratchCanvas();
}

function updateTimer() {
  const now = Date.now();
  const threeDays = 3 * 24 * 60 * 60 * 1000;
  const diff = threeDays - (now - userState.lastFreeClaim);

  const cardBox = document.getElementById('card-flip-box');
  const countdownEl = document.getElementById('countdown');

  if (diff <= 0) {
    if (cardBox) cardBox.style.pointerEvents = 'auto';
    if (countdownEl) countdownEl.innerText = "PRONTO DA RISCATTARE!";
  } else {
    if (cardBox) cardBox.style.pointerEvents = 'none';
    if (countdownEl) {
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      countdownEl.innerText = `${hours}h ${mins}m rimanenti`;
    }
  }
}

function closeModal(modalId) {
  document.getElementById(modalId).classList.add('hidden');
}

function updateUI() {
  const creditHeader = document.getElementById('user-credits-header');
  const creditProfile = document.getElementById('user-credits-profile');
  const completionRate = document.getElementById('completion-rate');

  if (creditHeader) creditHeader.innerText = userState.credits;
  if (creditProfile) creditProfile.innerText = userState.credits;
  if (completionRate) completionRate.innerText = `${userState.unlockedCards.length} / ${cardsDatabase.length}`;

  const progressFill = document.getElementById('progress-bar-fill');
  if (progressFill) {
    const percentage = (userState.unlockedCards.length / cardsDatabase.length) * 100;
    progressFill.style.width = `${percentage}%`;
  }

  const usernameInput = document.getElementById('username-input');
  if (usernameInput) usernameInput.value = userState.username;

  const unlockedObjList = cardsDatabase.filter(c => userState.unlockedCards.includes(c.id));
  const comuneCount = unlockedObjList.filter(c => c.rarity === 'COMUNE').length;
  const raraCount = unlockedObjList.filter(c => c.rarity === 'RARA').length;
  const leggendariaCount = unlockedObjList.filter(c => c.rarity === 'LEGGENDARIA').length;

  if (document.getElementById('stat-comune')) document.getElementById('stat-comune').innerText = comuneCount;
  if (document.getElementById('stat-rara')) document.getElementById('stat-rara').innerText = raraCount;
  if (document.getElementById('stat-leggendaria')) document.getElementById('stat-leggendaria').innerText = leggendariaCount;

  updateRankBadge(userState.unlockedCards.length);
  updateStreakUI();

  const avatarDisplay = document.getElementById('profile-avatar-display');
  if (avatarDisplay) {
    if (userState.avatarImg) {
      avatarDisplay.style.backgroundImage = `url('${userState.avatarImg}')`;
      avatarDisplay.innerHTML = '';
    } else {
      avatarDisplay.style.backgroundImage = 'none';
      avatarDisplay.innerHTML = '<i class="fa-solid fa-user-astronaut"></i>';
    }
  }

  const favSlot = document.getElementById('favorite-card-slot');
  if (favSlot) {
    if (userState.favoriteCardId) {
      const favCard = cardsDatabase.find(c => c.id === userState.favoriteCardId);
      if (favCard) {
        favSlot.innerHTML = createCardHTML(favCard);
      }
    } else {
      favSlot.innerHTML = `<p class="empty-fav-text">+ Tocca per scegliere la tua preferita</p>`;
    }
  }
}

function updateRankBadge(unlockedCount) {
  const rankTitleText = document.getElementById('rank-title-text');
  if (!rankTitleText) return;

  const total = cardsDatabase.length;
  const ratio = unlockedCount / total;

  let rank = "Novizia 🌸";
  if (ratio >= 1.0) {
    rank = "Sapphic Legend 👑";
  } else if (ratio >= 0.75) {
    rank = "Crush Queen ✨";
  } else if (ratio >= 0.50) {
    rank = "Super Fanatic ⭐";
  } else if (ratio >= 0.25) {
    rank = "Fan Affezionata 💖";
  }

  rankTitleText.innerText = rank;
}

function saveUsername() {
  const val = document.getElementById('username-input').value;
  userState.username = val;
  saveProgress();
  showPopup("Profilo Aggiornato 🌸", "Il tuo username è stato salvato con successo!", "fa-solid fa-user-check");
}

// Funzione mancante precedentemente implementata per gestire la selezione dell'avatar
function selectAvatar(imgUrl) {
  userState.avatarImg = imgUrl;
  saveProgress();
  updateUI();
  closeModal('selection-modal');
  showPopup("Avatar Aggiornato! 🌸", "Il tuo nuovo avatar è stato impostato.", "fa-solid fa-user-astronaut");
}

function openAvatarSelector() {
  const title = document.getElementById('selection-modal-title');
  const grid = document.getElementById('selection-grid');
  const actionBox = document.getElementById('avatar-action-box');
  
  if (title) title.innerText = "Scegli il tuo Avatar";
  if (grid) grid.innerHTML = '';
  
  if (actionBox) {
    actionBox.innerHTML = `
      <button class="btn-upload-avatar" onclick="document.getElementById('user-avatar-input').click()">
        <i class="fa-solid fa-upload"></i> Carica dalla Galleria
      </button>
    `;
  }

  const unlockedObjList = cardsDatabase.filter(c => userState.unlockedCards.includes(c.id));

  if (unlockedObjList.length === 0) {
    grid.innerHTML = '<p style="grid-column: span 3; font-size:11px; color:var(--text-muted); text-align:center; padding:15px;">Nessuna card sbloccata ancora!</p>';
  } else {
    unlockedObjList.forEach(card => {
      grid.innerHTML += `
        <div class="selection-item" style="background-image: url('${card.img}')" onclick="selectAvatar('${card.img}')">
          <span>${card.name}</span>
        </div>
      `;
    });
  }

  document.getElementById('selection-modal').classList.remove('hidden');
}

function openFavoriteSelector() {
  const title = document.getElementById('selection-modal-title');
  const grid = document.getElementById('selection-grid');
  const actionBox = document.getElementById('avatar-action-box');
  
  if (title) title.innerText = "Scegli la tua Preferita";
  if (actionBox) actionBox.innerHTML = '';
  if (grid) grid.innerHTML = '';

  const unlockedObjList = cardsDatabase.filter(c => userState.unlockedCards.includes(c.id));

  if (unlockedObjList.length === 0) {
    grid.innerHTML = '<p style="grid-column: span 3; font-size:11px; color:var(--text-muted); text-align:center; padding:15px;">Nessuna card sbloccata!</p>';
  } else {
    unlockedObjList.forEach(card => {
      grid.innerHTML += `
        <div class="selection-item" style="background-image: url('${card.img}')" onclick="selectFavoriteCard(${card.id})">
          <span>${card.name}</span>
        </div>
      `;
    });
  }

  document.getElementById('selection-modal').classList.remove('hidden');
}

function handleCustomAvatarUpload(event) {
  const file = event.target.files[0];
  if (!file) return;

  if (file.size > 5 * 1024 * 1024) {
    showPopup("Attenzione ⚠️", "L'immagine è troppo grande. Scegli una foto sotto i 5MB.", "fa-solid fa-triangle-exclamation");
    return;
  }

  const reader = new FileReader();
  reader.onload = function(e) {
    const base64Image = e.target.result;
    selectAvatar(base64Image);
  };

  reader.readAsDataURL(file);
}

function selectFavoriteCard(cardId) {
  userState.favoriteCardId = cardId;
  saveProgress();
  updateUI();
  closeModal('selection-modal');
}

const emojis = ['🌸', '👑', '💎', '🎀', '⭐', '🎬', '🎤', '💖'];
let memoryCards = [...emojis, ...emojis];
let flippedCards = [];
let matchedPairs = 0;

function openMemoryModal() {
  const today = new Date().toDateString();

  if (userState.lastMemoryPlayed === today) {
    showPopup("Memory Già Giocato 🧠", "Hai già completato il Memory per oggi! Torna domani dopo mezzanotte per vincere altri +25 crediti.", "fa-solid fa-calendar-check");
    return;
  }

  document.getElementById('memory-modal').classList.remove('hidden');
  initMemoryGame();
}

function initMemoryGame() {
  const grid = document.getElementById('memory-grid');
  if (!grid) return;
  grid.innerHTML = '';
  flippedCards = [];
  matchedPairs = 0;

  memoryCards.sort(() => 0.5 - Math.random());

  memoryCards.forEach((emoji, index) => {
    grid.innerHTML += `<div class="memory-card" data-index="${index}" onclick="flipMemoryCard(this, '${emoji}')">?</div>`;
  });
}

function flipMemoryCard(cardEl, emoji) {
  if (flippedCards.length < 2 && !cardEl.classList.contains('flipped')) {
    cardEl.classList.add('flipped');
    cardEl.innerText = emoji;
    flippedCards.push({ element: cardEl, emoji: emoji });

    if (flippedCards.length === 2) {
      checkMemoryMatch();
    }
  }
}

function checkMemoryMatch() {
  const [card1, card2] = flippedCards;

  if (card1.emoji === card2.emoji) {
    matchedPairs++;
    flippedCards = [];

    if (matchedPairs === 8) {
      setTimeout(() => {
        userState.credits += 25;
        userState.lastMemoryPlayed = new Date().toDateString();
        saveProgress();
        closeModal('memory-modal');
        updateUI();
        showPopup("Memory Completato! 🎉", "Complimenti! Hai trovato tutte le coppie e vinto +25 Crediti!", "fa-solid fa-trophy");
      }, 500);
    }
  } else {
    setTimeout(() => {
      card1.element.classList.remove('flipped');
      card2.element.classList.remove('flipped');
      card1.element.innerText = '?';
      card2.element.innerText = '?';
      flippedCards = [];
    }, 800);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  renderCollections();
  renderShop();
  updateTimer();
  updateUI();
  updateStreakUI();
  setInterval(updateTimer, 60000);
});

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js')
      .then(() => console.log('Service Worker registrato con successo!'))
      .catch(err => console.log('Errore registrazione Service Worker:', err));
  });
}

/* --- LOGICA STREAK GIORNALIERA --- */
function claimDailyStreak() {
  const today = new Date().toDateString();

  if (userState.lastStreakClaimDate === today) {
    showPopup("Bonus già riscosso! ✨", "Hai già ritirato il bonus della streak di oggi. Torna domani!", "fa-solid fa-calendar-check");
    return;
  }

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toDateString();

  if (userState.lastStreakClaimDate === yesterdayStr) {
    userState.streakDays = (userState.streakDays || 0) + 1;
  } else if (!userState.lastStreakClaimDate) {
    userState.streakDays = 1;
  } else {
    userState.streakDays = 1;
  }

  userState.lastStreakClaimDate = today;

  let earnedCredits = userState.streakDays * 5;
  let message = `Hai riscosso il giorno ${userState.streakDays} della tua streak e vinto +${earnedCredits} Crediti!`;

  if (userState.streakDays % 7 === 0) {
    earnedCredits += 50;
    message = `🎉 SETTIMANA COMPLETATA! Giorno ${userState.streakDays}: Hai vinto +${earnedCredits - 50} base + 50 Crediti bonus extra!`;
  }

  userState.credits += earnedCredits;
  saveProgress();
  updateUI();

  showPopup("Streak Giornaliera! 🔥", message, "fa-solid fa-fire");
  updateStreakUI();
}

function updateStreakUI() {
  const today = new Date().toDateString();
  const streakBtn = document.getElementById('btn-claim-streak');
  const streakText = document.getElementById('streak-info-text');
  
  const currentStreak = userState.streakDays || 0;
  const nextDay = currentStreak + 1;
  const nextReward = nextDay * 5 + (nextDay % 7 === 0 ? 50 : 0);

  if (streakText) {
    streakText.innerText = `Giorno ${currentStreak} consecutivo 🔥 (Domani: +${nextReward} crediti)`;
  }

  if (streakBtn) {
    if (userState.lastStreakClaimDate === today) {
      streakBtn.innerText = "RISCOSSTO OGGI ✅";
      streakBtn.style.opacity = "0.6";
      streakBtn.style.pointerEvents = "none";
    } else {
      streakBtn.innerText = `RISCATTA GIORNO ${nextDay} 🎁`;
      streakBtn.style.opacity = "1";
      streakBtn.style.pointerEvents = "auto";
    }
  }
}

/* --- LOGICA RUOTA DELLA FORTUNA --- */
const wheelPrizes = [
  { id: '10c', label: "10 Crediti", credits: 10, type: 'credits', color: "#9B59B6", weight: 35 },
  { id: '15c', label: "15 Crediti", credits: 15, type: 'credits', color: "#3498DB", weight: 25 },
  { id: '20c', label: "20 Crediti", credits: 20, type: 'credits', color: "#FF69B4", weight: 20 },
  { id: '25c', label: "25 Crediti", credits: 25, type: 'credits', color: "#2ECC71", weight: 12 },
  { id: '50c', label: "50 Crediti", credits: 50, type: 'credits', color: "#E74C3C", weight: 6 },
  { id: 'card', label: "CARD RARA 🌟", type: 'card', color: "#F1C40F", weight: 2 }
];

let isWheelSpinning = false;
let currentWheelRotation = 0;

function openWheelModal() {
  const today = new Date().toDateString();
  const spinBtn = document.getElementById('btn-spin-wheel');

  document.getElementById('wheel-modal').classList.remove('hidden');
  drawWheel();

  if (userState.lastWheelPlayed === today) {
    if (spinBtn) {
      spinBtn.innerText = "GIÀ GIRATO OGGI ✅";
      spinBtn.style.opacity = "0.6";
      spinBtn.style.pointerEvents = "none";
    }
  } else {
    if (spinBtn) {
      spinBtn.innerText = "GIRA LA RUOTA 🎯";
      spinBtn.style.opacity = "1";
      spinBtn.style.pointerEvents = "auto";
    }
  }
}

function drawWheel() {
  const canvas = document.getElementById('wheel-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const numSegments = wheelPrizes.length;
  const arcSize = (2 * Math.PI) / numSegments;
  const radius = canvas.width / 2;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  for (let i = 0; i < numSegments; i++) {
    const angle = i * arcSize;
    ctx.beginPath();
    ctx.fillStyle = wheelPrizes[i].color;
    ctx.moveTo(radius, radius);
    ctx.arc(radius, radius, radius - 5, angle, angle + arcSize);
    ctx.lineTo(radius, radius);
    ctx.fill();

    ctx.strokeStyle = "rgba(255, 255, 255, 0.4)";
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.save();
    ctx.translate(radius, radius);
    ctx.rotate(angle + arcSize / 2);
    ctx.textAlign = "right";
    ctx.fillStyle = "#FFFFFF";
    ctx.font = "bold 11px sans-serif";
    ctx.shadowColor = "rgba(0,0,0,0.5)";
    ctx.shadowBlur = 4;
    ctx.fillText(wheelPrizes[i].label, radius - 15, 4);
    ctx.restore();
  }

  ctx.beginPath();
  ctx.arc(radius, radius, 25, 0, 2 * Math.PI);
  ctx.fillStyle = "#120A18";
  ctx.fill();
  ctx.strokeStyle = "var(--primary)";
  ctx.lineWidth = 3;
  ctx.stroke();
}

function getRandomPrizeIndexByWeight() {
  const totalWeight = wheelPrizes.reduce((sum, p) => sum + p.weight, 0);
  let randomVal = Math.random() * totalWeight;

  for (let i = 0; i < wheelPrizes.length; i++) {
    if (randomVal < wheelPrizes[i].weight) {
      return i;
    }
    randomVal -= wheelPrizes[i].weight;
  }
  return 0;
}

function spinWheel() {
  const today = new Date().toDateString();

  if (userState.lastWheelPlayed === today) {
    showPopup("Ruota Già Girata 🎡", "Hai già tentato la fortuna oggi! Torna domani per girare di nuovo.", "fa-solid fa-calendar-check");
    return;
  }

  if (isWheelSpinning) return;
  isWheelSpinning = true;

  const spinBtn = document.getElementById('btn-spin-wheel');
  if (spinBtn) spinBtn.style.pointerEvents = 'none';

  const prizeIndex = getRandomPrizeIndexByWeight();
  const selectedPrize = wheelPrizes[prizeIndex];

  const numSegments = wheelPrizes.length;
  const arcDegree = 360 / numSegments;
  const segmentCenterDegree = (prizeIndex + 0.5) * arcDegree;
  
  let targetRotation = 270 - segmentCenterDegree;
  if (targetRotation < 0) targetRotation += 360;

  const spins = 5 * 360;
  const currentBase = Math.floor(currentWheelRotation / 360) * 360;
  let nextRotation = currentBase + spins + targetRotation;
  if (nextRotation <= currentWheelRotation) {
    nextRotation += 360;
  }
  
  currentWheelRotation = nextRotation;

  const wheelContainer = document.getElementById('wheel-container');
  if (wheelContainer) {
    wheelContainer.style.transition = 'transform 4s cubic-bezier(0.15, 0.9, 0.25, 1)';
    wheelContainer.style.transform = `rotate(${currentWheelRotation}deg)`;
  }

  setTimeout(() => {
    isWheelSpinning = false;
    userState.lastWheelPlayed = today;

    if (selectedPrize.type === 'credits') {
      userState.credits += selectedPrize.credits;
      saveProgress();
      updateUI();
      showPopup("Premio Vinto! 🎉", `La ruota si è fermata su ${selectedPrize.label}! Hai guadagnato +${selectedPrize.credits} Crediti!`, "fa-solid fa-gift");
    } else if (selectedPrize.type === 'card') {
      const lockedCards = cardsDatabase.filter(c => !userState.unlockedCards.includes(c.id));
      if (lockedCards.length > 0) {
        let rarePool = lockedCards.filter(c => c.rarity === "RARA" || c.rarity === "LEGGENDARIA");
        if (rarePool.length === 0) rarePool = lockedCards;
        
        const wonCard = rarePool[Math.floor(Math.random() * rarePool.length)];
        userState.unlockedCards.push(wonCard.id);
        saveProgress();
        updateUI();
        showReward(wonCard);
      } else {
        userState.credits += 200;
        saveProgress();
        updateUI();
        showPopup("SUPER PREMIO! 👑", "Hai già tutte le card! Per te un bonus speciale di +200 Crediti!", "fa-solid fa-crown");
      }
    }

    if (spinBtn) {
      spinBtn.innerText = "GIÀ GIRATO OGGI ✅";
      spinBtn.style.opacity = "0.6";
      spinBtn.style.pointerEvents = "none";
    }
  }, 4200);
}