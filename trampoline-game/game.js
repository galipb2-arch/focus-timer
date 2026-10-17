(() => {
  // ---------- Layout ----------
  const CANVAS_W = 390;
  const CANVAS_H = 844;
  const CENTER_X = CANVAS_W / 2;

  const TRAMPOLINE_Y = 700; // world-y of trampoline surface
  const GROUND_Y = 760;
  const CHAR_RADIUS = 25;

  const GRAVITY = 0.5;
  const BASE_SPRING = 15;      // base auto-bounce magnitude (tier 0)
  const BASE_BOOST = 3.6;      // base tap-boost magnitude (tier 0)
  const SPRING_STEP = 1.8;     // added per spring upgrade tier
  const BOOST_STEP = 0.5;      // added per boost upgrade tier
  const MAX_BOOSTS_PER_CYCLE = 5;
  const BOOST_COOLDOWN_MS = 100;
  const MAX_TIER = 8;

  const CAMERA_FOLLOW_Y = 300; // once char rises above this, camera scrolls with it

  const UPGRADE_COSTS = [40, 90, 160, 260, 400, 600, 850, 1150]; // gold cost tier i -> i+1
  const GOLD_PER_COIN = 18; // bumped so denser coin trails pay out generously
  const LEVEL_FIRST_CLEAR_BONUS = 60;
  const STAGNATION_MS = 15000; // no new height record for this long -> nudge toward Yükseltmeler
  const SAVE_KEY = 'trampolineHero.v2';

  // ---------- Themes ----------
  const THEMES = {
    forest: {
      skyTop: [12, 58, 32], skyTopHigh: [135, 206, 250],
      skyBot: [22, 74, 43], skyBotHigh: [200, 235, 255],
      groundNear: '#0a2c17', groundFar: '#175c30',
      groundSpeckle: 'rgba(0,0,0,0.15)',
      sunColor: '#fff6d0', sunGlow: 'rgba(255, 246, 208, 0.30)',
      decor: 'trees',
      foliage: ['#12331f', '#1c5230', '#277440'],
      trunk: '#5b3a22',
      accent: '#3fae5b',
    },
    snow: {
      skyTop: [24, 42, 72], skyTopHigh: [178, 218, 255],
      skyBot: [56, 88, 128], skyBotHigh: [232, 246, 255],
      groundNear: '#c9dcea', groundFar: '#eef6fb',
      groundSpeckle: 'rgba(140,170,200,0.25)',
      sunColor: '#eaf6ff', sunGlow: 'rgba(200, 230, 255, 0.35)',
      decor: 'snowtrees',
      foliage: ['#20402f', '#2c5540', '#3a6e57'],
      trunk: '#4a3626',
      accent: '#7fd6ff',
    },
    desert: {
      skyTop: [64, 34, 58], skyTopHigh: [255, 205, 140],
      skyBot: [128, 66, 46], skyBotHigh: [255, 224, 176],
      groundNear: '#7a5326', groundFar: '#d9a35a',
      groundSpeckle: 'rgba(90,55,20,0.25)',
      sunColor: '#fff0c8', sunGlow: 'rgba(255, 210, 140, 0.4)',
      decor: 'cacti',
      foliage: ['#33633a', '#3f7a44', '#4d8f4f'],
      trunk: '#8a6a3a',
      accent: '#ff9b4a',
    },
    party: {
      skyTop: [58, 28, 104], skyTopHigh: [255, 190, 226],
      skyBot: [112, 58, 148], skyBotHigh: [255, 228, 242],
      groundNear: '#3d2260', groundFar: '#8d5fc4',
      groundSpeckle: 'rgba(30,10,60,0.22)',
      sunColor: '#fff0f8', sunGlow: 'rgba(255, 190, 235, 0.38)',
      decor: 'trees',
      foliage: ['#3a2a6e', '#58409a', '#7a5cc0'],
      trunk: '#5a3a6a',
      accent: '#ff6fae',
    },
    ocean: {
      skyTop: [30, 18, 74], skyTopHigh: [112, 72, 152],
      skyBot: [255, 112, 64], skyBotHigh: [255, 160, 112],
      groundNear: '#7a4a2a', groundFar: '#e9b47a',
      groundSpeckle: 'rgba(90,50,20,0.22)',
      sunColor: '#ffe0a8', sunGlow: 'rgba(255, 150, 80, 0.5)',
      decor: 'ocean',
      foliage: ['#3a2a6e', '#58409a', '#7a5cc0'],
      trunk: '#5a3a6a',
      accent: '#ff7a45',
    },
    lagoon: {
      skyTop: [22, 118, 196], skyTopHigh: [140, 212, 255],
      skyBot: [126, 214, 232], skyBotHigh: [214, 246, 255],
      groundNear: '#c9a96a', groundFar: '#f3dfa6',
      groundSpeckle: 'rgba(150,110,50,0.22)',
      sunColor: '#fffbe0', sunGlow: 'rgba(255, 250, 200, 0.45)',
      decor: 'lagoon',
      foliage: ['#2f7d4a', '#3f9b4a', '#58b85a'],
      trunk: '#7a5230',
      accent: '#18c8c0',
    },
    city: {
      skyTop: [16, 18, 60], skyTopHigh: [64, 104, 186],
      skyBot: [150, 74, 116], skyBotHigh: [244, 176, 150],
      groundNear: '#1d1d28', groundFar: '#3b3b4d',
      groundSpeckle: 'rgba(255,255,255,0.06)',
      sunColor: '#eef3ff', sunGlow: 'rgba(190, 210, 255, 0.35)',
      decor: 'city',
      foliage: ['#2b2f66', '#1d2150', '#12143a'],
      trunk: '#333',
      accent: '#ffb347',
    },
    stadium: {
      skyTop: [70, 130, 210], skyTopHigh: [160, 200, 255],
      skyBot: [130, 178, 228], skyBotHigh: [224, 238, 255],
      groundNear: '#2f7d32', groundFar: '#4fa255',
      groundSpeckle: 'rgba(10,60,10,0.12)',
      sunColor: '#fff6d0', sunGlow: 'rgba(255, 246, 208, 0.3)',
      decor: 'stadium',
      foliage: ['#3a3a3a', '#454545', '#525252'], // light-tower pole shading
      trunk: '#2a2a2a',
      accent: '#d1232a',
    },
    space: {
      skyTop: [3, 4, 16], skyTopHigh: [18, 14, 48],
      skyBot: [10, 8, 34], skyBotHigh: [46, 30, 90],
      groundNear: '#4a4a56', groundFar: '#7a7a8a',
      groundSpeckle: 'rgba(0,0,0,0.3)',
      sunColor: '#fff6d0', sunGlow: 'rgba(200, 200, 255, 0.25)',
      decor: 'space',
      foliage: ['#6b4fa0', '#3f7bbf', '#c75a8a'], // planet body color variants
      trunk: '#333',
      accent: '#8ab4ff',
    },
    aurora: {
      skyTop: [4, 10, 24], skyTopHigh: [20, 40, 72],
      skyBot: [8, 20, 40], skyBotHigh: [42, 72, 104],
      groundNear: '#c9dcea', groundFar: '#eef6fb',
      groundSpeckle: 'rgba(140,170,200,0.25)',
      sunColor: '#eaf6ff', sunGlow: 'rgba(200, 230, 255, 0.3)',
      decor: 'aurora',
      foliage: ['#bfefff', '#dff5ff', '#eafcff'], // ice-spike color variants
      trunk: '#333',
      accent: '#7fffd4',
    },
    volcano: {
      skyTop: [26, 8, 6], skyTopHigh: [90, 40, 24],
      skyBot: [70, 20, 10], skyBotHigh: [168, 78, 30],
      groundNear: '#1c1210', groundFar: '#3a241c',
      groundSpeckle: 'rgba(255,120,40,0.18)',
      sunColor: '#ffb366', sunGlow: 'rgba(255, 110, 40, 0.4)',
      decor: 'volcano',
      foliage: ['#2a1a16', '#3a2420', '#4a2e26'], // lava-rock color variants
      trunk: '#201512',
      accent: '#ff5a26',
    },
    deepsea: {
      skyTop: [2, 10, 28], skyTopHigh: [40, 140, 190],
      skyBot: [4, 24, 48], skyBotHigh: [90, 190, 220],
      groundNear: '#8a6a3a', groundFar: '#d9b870',
      groundSpeckle: 'rgba(60,40,10,0.2)',
      sunColor: '#eafbff', sunGlow: 'rgba(180, 240, 255, 0.35)',
      decor: 'deepsea',
      foliage: ['#1f6e5c', '#2c8f6a', '#3fae7a'], // coral/seaweed color variants
      trunk: '#8a5a3a',
      accent: '#3fd6c8',
    },
    cave: {
      skyTop: [10, 4, 22], skyTopHigh: [70, 20, 90],
      skyBot: [20, 8, 40], skyBotHigh: [140, 60, 170],
      groundNear: '#241a2c', groundFar: '#3a2a46',
      groundSpeckle: 'rgba(180,120,255,0.12)',
      sunColor: '#e8c8ff', sunGlow: 'rgba(200, 120, 255, 0.35)',
      decor: 'cave',
      foliage: ['#6a3fa0', '#8a4fc0', '#c060e0'], // crystal color variants
      trunk: '#333',
      accent: '#e060ff',
    },
    lantern: {
      skyTop: [10, 8, 30], skyTopHigh: [255, 170, 60],
      skyBot: [30, 16, 50], skyBotHigh: [255, 200, 120],
      groundNear: '#2a1f18', groundFar: '#4a3526',
      groundSpeckle: 'rgba(255,180,80,0.15)',
      sunColor: '#ffe0a0', sunGlow: 'rgba(255, 200, 120, 0.4)',
      decor: 'lantern',
      foliage: ['#c0392b', '#e67e22', '#f1c40f'], // lantern color variants
      trunk: '#5a3a20',
      accent: '#ffb347',
    },
    haunted: {
      skyTop: [8, 4, 14], skyTopHigh: [40, 20, 60],
      skyBot: [16, 8, 24], skyBotHigh: [80, 40, 110],
      groundNear: '#141018', groundFar: '#241c2c',
      groundSpeckle: 'rgba(120,255,160,0.1)',
      sunColor: '#c8ffe0', sunGlow: 'rgba(140, 255, 180, 0.3)',
      decor: 'haunted',
      foliage: ['#2a1f38', '#3a2a4a', '#4a3860'], // castle spire variants
      trunk: '#201828',
      accent: '#7fff9f',
    },
    candy: {
      skyTop: [255, 200, 230], skyTopHigh: [200, 240, 255],
      skyBot: [255, 220, 240], skyBotHigh: [230, 250, 255],
      groundNear: '#e85a8a', groundFar: '#ffb3cc',
      groundSpeckle: 'rgba(255,255,255,0.3)',
      sunColor: '#fff6fa', sunGlow: 'rgba(255, 220, 240, 0.5)',
      decor: 'candy',
      foliage: ['#ff6b9d', '#ffa6c9', '#ffd3e6'], // candy cane color variants
      trunk: '#c0392b',
      accent: '#ff4f9e',
    },
    temple: {
      skyTop: [20, 30, 16], skyTopHigh: [255, 220, 160],
      skyBot: [40, 54, 28], skyBotHigh: [255, 236, 200],
      groundNear: '#3a3024', groundFar: '#6a5a3e',
      groundSpeckle: 'rgba(40,60,20,0.2)',
      sunColor: '#fff4d0', sunGlow: 'rgba(255, 220, 140, 0.4)',
      decor: 'temple',
      foliage: ['#2f5a2a', '#3f7a3a', '#4f8f44'], // vine/jungle color variants
      trunk: '#6a5a3e',
      accent: '#e0b84a',
    },
    cloudkingdom: {
      skyTop: [40, 50, 110], skyTopHigh: [230, 220, 255],
      skyBot: [90, 100, 170], skyBotHigh: [255, 240, 255],
      groundNear: '#4a5590', groundFar: '#8a92c8',
      groundSpeckle: 'rgba(255,255,255,0.25)',
      sunColor: '#fff8ff', sunGlow: 'rgba(255, 240, 255, 0.45)',
      decor: 'cloudkingdom',
      foliage: ['#ffd6ec', '#d6e8ff', '#fff3c4'], // pastel cloud-puff tints
      trunk: '#ffffff',
      accent: '#ffb3e0',
    },
    flower: {
      skyTop: [60, 150, 110], skyTopHigh: [200, 250, 220],
      skyBot: [110, 200, 150], skyBotHigh: [235, 255, 235],
      groundNear: '#2f7a3a', groundFar: '#5fae5a',
      groundSpeckle: 'rgba(255,255,255,0.2)',
      sunColor: '#fff6d0', sunGlow: 'rgba(255, 246, 208, 0.35)',
      decor: 'flower',
      foliage: ['#ff6fae', '#ffb347', '#9b6fff'], // petal color variants
      trunk: '#2f5a2a',
      accent: '#ff4f9e',
    },
    pirate: {
      skyTop: [18, 60, 90], skyTopHigh: [135, 206, 235],
      skyBot: [30, 100, 130], skyBotHigh: [210, 240, 250],
      groundNear: '#c9a35a', groundFar: '#e4c488',
      groundSpeckle: 'rgba(120,80,30,0.2)',
      sunColor: '#fff6d0', sunGlow: 'rgba(255, 246, 208, 0.35)',
      decor: 'pirate',
      foliage: ['#1f6b3a', '#5a3a20', '#dcdcdc'], // palm / mast / sail variants
      trunk: '#5a3a20',
      accent: '#ffd24a',
    },
  };

  // ---------- Levels ----------
  const LEVELS = [
    { id: 0, name: 'Bölüm 1 · Yeşil Orman', icon: '🌲', theme: 'forest', coinHeights: [180,210,245,275,305,330,365,395,425,460,490,525,555,590,620] },
    { id: 1, name: 'Bölüm 2 · Kar Dağı', icon: '🏔️', theme: 'snow', coinHeights: [200,240,275,305,345,385,420,465,510,545,590,635,680,730,780] },
    { id: 2, name: 'Bölüm 3 · Çöl Vahası', icon: '🏜️', theme: 'desert', coinHeights: [240,285,330,375,425,475,520,575,635,690,750,810,885,965,1050] },
    { id: 3, name: 'Bölüm 4 · Balon Şenliği', icon: '🎈', theme: 'party', coinHeights: [220,270,325,375,420,465,520,570,620,665,710,755,800,850,900], balloons: 32 },
    { id: 4, name: 'Bölüm 5 · Slime Körfezi', icon: '🌅', theme: 'ocean', coinHeights: [300,390,480,570,660,750,840,925,1010,1100,1180,1260,1345,1425,1500], slimes: 16 },
    // A floating slingshot waits 560 up; a good launch from it carries the hero to the top coin.
    { id: 5, name: 'Bölüm 6 · Turkuaz Ada', icon: '🏝️', theme: 'lagoon', coinHeights: [260,325,395,480,620,765,890,1005,1115,1215,1325,1435,1585,1740,1900], slingshot: 560,
      specialBoost: 'aim', specialBoostCost: 20, specialBoostIcon: '🎯', specialBoostLabel: 'Mancınık Kuvveti',
      specialBoostDesc: 'Fırlatma metresinde yeşil bölge genişler — nişanı tutturmak kolaylaşır.' },
    // A helicopter hovers 600 up; boarding it carries the hero through cloud banks to the top coin.
    { id: 6, name: 'Bölüm 7 · Gökdelenler', icon: '🏙️', theme: 'city', coinHeights: [260,325,405,510,765,1030,1275,1500,1715,1930,2140,2355,2575,2790,3000], helicopter: 600,
      specialBoost: 'rotor', specialBoostCost: 25, specialBoostIcon: '🚁', specialBoostLabel: 'Pervane Gücü',
      specialBoostDesc: 'Helikopter daha hızlı tırmanır, bulutlar daha az yavaşlatır.' },
    // A web-slinger swings in 650 up and carries the hero skyward on a web line.
    { id: 7, name: 'Bölüm 8 · Örümcek Kulesi', icon: '🕸️', theme: 'city', coinHeights: [300,370,465,585,885,1205,1530,1850,2170,2495,2815,3135,3430,3715,4000], webswing: 650,
      specialBoost: 'web', specialBoostCost: 25, specialBoostIcon: '🕸️', specialBoostLabel: 'Ağ Gücü',
      specialBoostDesc: 'Her dokunuş ağa çok daha güçlü bir itiş verir.' },
    // A giant baseball stadium — collect sports balls instead of gold coins.
    { id: 8, name: 'Bölüm 9 · Beyzbol Stadyumu', icon: '⚾', theme: 'stadium', coinHeights: [220,280,335,395,465,540,620,715,815,930,1050,1175,1330,1490,1650], collectible: 'sport' },
    // Deep space — each comet collected speeds up every future bounce and tap for the rest of the run.
    { id: 9, name: 'Bölüm 10 · Uzay Yarışı', icon: '☄️', theme: 'space', coinHeights: [280,365,455,560,705,870,1050,1275,1525,1830,2170,2550,3075,3630,4200], collectible: 'comet' },
    // The Northern Lights ripple overhead — collect snowflakes instead of gold.
    { id: 10, name: 'Bölüm 11 · Kutup Işıkları', icon: '🌌', theme: 'aurora', coinHeights: [180,245,320,410,540,690,860,1075,1310,1580,1815,2030,2210,2365,2500], collectible: 'snowflake' },
    // A smoldering volcanic crater — collect glowing embers instead of gold.
    { id: 11, name: 'Bölüm 12 · Volkan Ağzı', icon: '🌋', theme: 'volcano', coinHeights: [230,315,410,520,685,875,1110,1380,1675,2015,2325,2605,2830,3025,3200], collectible: 'ember' },
    // Swimming up from the ocean floor toward the sunlit surface — collect pearls instead of gold.
    { id: 12, name: 'Bölüm 13 · Okyanus Derinliği', icon: '🫧', theme: 'deepsea', coinHeights: [260,355,465,585,770,990,1250,1555,1885,2270,2615,2930,3185,3405,3600], collectible: 'pearl' },
    // A glowing underground cavern — collect crystal gems instead of gold.
    { id: 13, name: 'Bölüm 14 · Kristal Mağara', icon: '💎', theme: 'cave', coinHeights: [270,365,475,605,795,1020,1290,1600,1940,2335,2690,3010,3275,3500,3700], collectible: 'crystal' },
    // A warm night market full of floating paper lanterns — collect lanterns instead of gold.
    { id: 14, name: 'Bölüm 15 · Fener Bayramı', icon: '🏮', theme: 'lantern', coinHeights: [270,375,485,615,805,1030,1310,1625,1970,2365,2725,3050,3320,3550,3750], collectible: 'lantern' },
    // A spooky haunted castle under a sickly green moon — collect friendly ghost lights instead of gold.
    { id: 15, name: 'Bölüm 16 · Hayalet Kale', icon: '👻', theme: 'haunted', coinHeights: [260,355,465,585,770,990,1250,1555,1885,2270,2615,2930,3185,3405,3600], collectible: 'ghost' },
    // A pastel candy kingdom — collect swirly lollipops instead of gold.
    { id: 16, name: 'Bölüm 17 · Şeker Diyarı', icon: '🍭', theme: 'candy', coinHeights: [270,365,475,605,795,1020,1290,1600,1940,2335,2690,3010,3275,3500,3700], collectible: 'candy' },
    // An overgrown jungle temple — collect ancient gold relics instead of gold coins.
    { id: 17, name: 'Bölüm 18 · Antik Tapınak', icon: '🗿', theme: 'temple', coinHeights: [270,365,475,605,795,1020,1290,1600,1940,2335,2690,3010,3275,3500,3700], collectible: 'relic' },
    // Floating islands drifting among pastel clouds — collect rainbows instead of gold.
    { id: 18, name: 'Bölüm 19 · Bulut Krallığı', icon: '☁️', theme: 'cloudkingdom', coinHeights: [270,365,475,605,795,1020,1290,1600,1940,2335,2690,3010,3275,3500,3700], collectible: 'rainbow' },
    // A sunlit garden of giant blossoms — collect butterflies instead of gold.
    { id: 19, name: 'Bölüm 20 · Çiçek Bahçesi', icon: '🌸', theme: 'flower', coinHeights: [200,250,305,365,435,510,590,685,785,895,1010,1135,1270,1410,1560], collectible: 'butterfly' },
    // A tropical island of palms and shipwrecks — collect pirate treasure instead of gold.
    { id: 20, name: 'Bölüm 21 · Korsan Adası', icon: '🏴‍☠️', theme: 'pirate', coinHeights: [260,355,465,585,770,990,1250,1555,1885,2270,2615,2930,3185,3405,3600], collectible: 'treasure' },
  ];

  const SPORT_BALL_TYPES = ['soccer', 'basketball', 'tennis'];

  const HELI_BASE = 6;
  const HELI_MAX = 15;
  const HELI_BURST_ADD = 3.2;
  const HELI_BURST_MAX = 8;
  const HELI_CLOUD_SLOW_BASE = 0.86;     // speed kept per cloud hit, no boost
  // Pervane Gücü: a one-time per-run purchase (not a general upgrade) that
  // gives the helicopter a flat speed boost and makes clouds slow it less.
  const HELI_ROTOR_BOOST = 5.6;
  const HELI_CLOUD_SLOW_BOOSTED = 0.956;

  // Bölüm 8's web-slinger rescue: unlike the helicopter's steady auto-climb,
  // the web swing has no baseline speed — it bleeds off fast between taps,
  // so the player has to keep tapping continuously to keep climbing at all.
  // Stop tapping and the hero starts sinking back down.
  const WEB_TAP_IMPULSE_BASE = 3.6;  // speed added per tap
  const WEB_DECAY = 0.935;           // multiplicative speed decay per frame-tick
  const WEB_MAX = 17;
  const WEB_MIN = -2;                // gentle sink when the player stops tapping
  const WEB_TAP_COOLDOWN_MS = 80;
  const WEB_SWING_SPEED = 0.045;
  const WEB_SWING_AMP = 70;
  // Ağ Gücü: a one-time per-run purchase adding extra impulse per tap.
  const WEB_BOOST_IMPULSE = 3.6;

  // Usta Nişancı (slingshot aim): a one-time per-run purchase that shrinks
  // the red/yellow zones so green starts earlier and covers more of the meter.
  const SLING_AIM_BOOST_SCALE = 0.6;

  // Slingshot launch meter: tension 0..1 → red below SLING_RED_MAX, green from SLING_GREEN_MIN.
  const SLING_RED_MAX = 0.35;
  const SLING_GREEN_MIN = 0.70;
  const SLING_V_MIN = 16;
  const SLING_V_RANGE = 30;
  const SLING_PULL = 70;

  // Bölüm 10's comet collectibles: each one collected permanently speeds up
  // every future trampoline bounce and tap boost for the rest of the run,
  // so the climb snowballs faster the more comets are gathered.
  const COMET_SPEED_STEP = 0.12;

  const SLIME_R = 20;

  const BALLOON_COLORS = ['#ff5d73', '#ffb400', '#4cd964', '#4aa8ff', '#c06bff', '#ff8a3d', '#27d3c3', '#ff6fae'];
  const BALLOON_R = 22;
  const BALLOON_SLOWDOWN = 0.988; // hero speed kept after pushing a balloon aside

  // minLevel: first level index (unlockedLevel) at which the upgrade is introduced.
  const UPGRADE_DEFS = [
    { key: 'spring', icon: '🌀', name: 'Yay Gücü', minLevel: 0, descFor: t => `Zıplama gücü +${(t * SPRING_STEP).toFixed(1)}` },
    { key: 'boost', icon: '🚀', name: 'Uçuş Takviyesi', minLevel: 0, descFor: t => `Dokunuş başına yükseklik +${(t * BOOST_STEP).toFixed(1)}` },
    { key: 'magnet', icon: '🧲', name: 'Altın Mıknatısı', minLevel: 1, descFor: t => `Altın toplama menzili +${t * 7}` },
    { key: 'gold', icon: '🪙', name: 'Altın Çarpanı', minLevel: 1, descFor: t => `Her altın %${100 + t * 20} değerinde` },
    { key: 'armor', icon: '🛡️', name: 'Zırh', minLevel: 3, descFor: t => `Balon ve slime direnci +%${t * 10}` },
  ];

  // Higher tiers open up as later levels are unlocked: 2 tiers at the start, +1 per level.
  function tierCap() { return Math.min(MAX_TIER, 2 + save.unlockedLevel); }

  // ---------- DOM ----------
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  const phoneFrame = document.getElementById('phoneFrame');

  const screens = {
    loading: document.getElementById('loadingScreen'),
    menu: document.getElementById('menuScreen'),
    howto: document.getElementById('howtoScreen'),
    shop: document.getElementById('shopScreen'),
    boost: document.getElementById('boostScreen'),
    complete: document.getElementById('completeScreen'),
  };
  const hud = document.getElementById('hud');
  const hudShopBtn = document.getElementById('hudShopBtn');
  const slimeWarn = document.getElementById('slimeWarn');
  const hudRestartBtn = document.getElementById('hudRestartBtn');
  const hudQuitBtn = document.getElementById('hudQuitBtn');
  const shopHint = document.getElementById('shopHint');
  const slingMeter = document.getElementById('slingMeter');
  const slingMarker = document.getElementById('slingMarker');
  const slingResult = document.getElementById('slingResult');
  const chipsLeft = document.getElementById('chipsLeft');
  const chipsRight = document.getElementById('chipsRight');
  const shopBackBtn = document.getElementById('shopBackBtn');
  const loadingFill = document.getElementById('loadingFill');
  const loadingLabel = document.getElementById('loadingLabel');

  const boostIcon = document.getElementById('boostIcon');
  const boostTitle = document.getElementById('boostTitle');
  const boostDesc = document.getElementById('boostDesc');
  const boostGoldAmount = document.getElementById('boostGoldAmount');
  const boostCostLabel = document.getElementById('boostCostLabel');
  const boostYesBtn = document.getElementById('boostYesBtn');
  const boostNoBtn = document.getElementById('boostNoBtn');
  const slingHoldBanner = document.getElementById('slingHoldBanner');
  const upgradeBanner = document.getElementById('upgradeBanner');
  const ingameUpgradeBanner = document.getElementById('ingameUpgradeBanner');
  const hudShopHint = document.getElementById('hudShopHint');

  const menuGoldAmount = document.getElementById('menuGoldAmount');
  const levelList = document.getElementById('levelList');

  const shopGoldAmount = document.getElementById('shopGoldAmount');
  const upgradeList = document.getElementById('upgradeList');

  const hudLevel = document.getElementById('hudLevel');
  const hudCoinIcon = document.getElementById('hudCoinIcon');
  const coinCountEl = document.getElementById('coinCount');
  const coinTotalEl = document.getElementById('coinTotal');
  const hudGoldAmount = document.getElementById('hudGoldAmount');
  const heightFill = document.getElementById('heightFill');

  const completeLevelName = document.getElementById('completeLevelName');
  const completeGoldEarned = document.getElementById('completeGoldEarned');
  const completeUnlockMsg = document.getElementById('completeUnlockMsg');
  const nextLevelBtn = document.getElementById('nextLevelBtn');
  const confettiLayer = document.getElementById('confettiLayer');

  function showScreen(name) {
    Object.values(screens).forEach(s => { s.hidden = true; });
    if (name && screens[name]) screens[name].hidden = false;
  }

  // ---------- Canvas backing resolution ----------
  function setupCanvas() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2.5);
    canvas.width = CANVAS_W * dpr;
    canvas.height = CANVAS_H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  setupCanvas();
  window.addEventListener('resize', setupCanvas);

  // ---------- Save / persistence ----------
  function loadSave() {
    let s = null;
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (raw) s = JSON.parse(raw);
    } catch {}
    const upgrades = {};
    UPGRADE_DEFS.forEach(d => { upgrades[d.key] = clampTier(s && s.upgrades && s.upgrades[d.key]); });
    const base = { gold: 0, unlockedLevel: 0, completedLevels: LEVELS.map(() => false), upgrades };
    if (!s) return base;
    const completedLevels = LEVELS.map((_, i) => !!(s.completedLevels && s.completedLevels[i]));
    let unlockedLevel = typeof s.unlockedLevel === 'number' ? Math.min(s.unlockedLevel, LEVELS.length - 1) : 0;
    // Migrate older saves: a level already marked complete must always
    // unlock the one after it, even if unlockedLevel was never bumped
    // past an earlier, shorter LEVELS list (e.g. before a new level existed).
    completedLevels.forEach((done, i) => {
      if (done) unlockedLevel = Math.max(unlockedLevel, Math.min(i + 1, LEVELS.length - 1));
    });
    return {
      gold: typeof s.gold === 'number' ? s.gold : 0,
      unlockedLevel,
      completedLevels,
      upgrades,
    };
  }
  function clampTier(v) {
    v = typeof v === 'number' ? v : 0;
    return Math.max(0, Math.min(MAX_TIER, Math.round(v)));
  }
  function persist() {
    try { localStorage.setItem(SAVE_KEY, JSON.stringify(save)); } catch {}
  }

  const save = loadSave();

  function currentBaseBounce() { return -(BASE_SPRING + save.upgrades.spring * SPRING_STEP); }
  function currentBoostImpulse() { return -(BASE_BOOST + save.upgrades.boost * BOOST_STEP); }
  function cometSpeedMultiplier() { return 1 + cometBoost; }

  // ---------- Audio (synthesized, no assets) ----------
  let actx = null;
  function audio() {
    if (!actx) {
      try { actx = new (window.AudioContext || window.webkitAudioContext)(); }
      catch { return null; }
    }
    if (actx.state === 'suspended') actx.resume();
    return actx;
  }

  function tone(ctxA, freq, startTime, duration, { type = 'sine', gain = 0.18, glideTo = null } = {}) {
    const osc = ctxA.createOscillator();
    const g = ctxA.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, startTime);
    if (glideTo) osc.frequency.exponentialRampToValueAtTime(glideTo, startTime + duration);
    g.gain.setValueAtTime(0, startTime);
    g.gain.linearRampToValueAtTime(gain, startTime + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);
    osc.connect(g).connect(ctxA.destination);
    osc.start(startTime);
    osc.stop(startTime + duration + 0.02);
  }

  function playBoing() {
    const a = audio();
    if (!a) return;
    tone(a, 180, a.currentTime, 0.16, { type: 'sine', gain: 0.16, glideTo: 90 });
  }

  function playBoost() {
    const a = audio();
    if (!a) return;
    tone(a, 520, a.currentTime, 0.08, { type: 'triangle', gain: 0.08, glideTo: 700 });
  }

  // "Altın ödül" sesi — parlak, yükselen mini arpej
  function playGoldChime() {
    const a = audio();
    if (!a) return;
    const t = a.currentTime;
    const notes = [1046.5, 1318.5, 1568.0]; // C6, E6, G6
    notes.forEach((freq, i) => {
      tone(a, freq, t + i * 0.055, 0.28, { type: 'sine', gain: 0.14 });
      tone(a, freq * 2, t + i * 0.055, 0.16, { type: 'sine', gain: 0.05 });
    });
  }

  function playFanfare() {
    const a = audio();
    if (!a) return;
    const t = a.currentTime;
    [784, 988, 1175, 1568].forEach((freq, i) => {
      tone(a, freq, t + i * 0.14, 0.5, { type: 'triangle', gain: 0.15 });
    });
  }

  function playBalloonBump() {
    const a = audio();
    if (!a) return;
    tone(a, 320, a.currentTime, 0.09, { type: 'sine', gain: 0.06, glideTo: 460 });
  }

  function playPop() {
    const a = audio();
    if (!a) return;
    tone(a, 700, a.currentTime, 0.1, { type: 'triangle', gain: 0.09, glideTo: 180 });
  }

  function playFling() {
    const a = audio();
    if (!a) return;
    tone(a, 200, a.currentTime, 0.28, { type: 'sawtooth', gain: 0.07, glideTo: 900 });
  }

  function playPurchase() {
    const a = audio();
    if (!a) return;
    const t = a.currentTime;
    [660, 990].forEach((freq, i) => tone(a, freq, t + i * 0.07, 0.18, { type: 'square', gain: 0.07 }));
  }

  // ---------- Game state ----------
  const STATE = { LOADING: 'loading', MENU: 'menu', HOWTO: 'howto', SHOP: 'shop', BOOST: 'boost', PAUSED: 'paused', PLAYING: 'playing', SLING: 'sling', HELI: 'heli', WEB: 'web', COMPLETE: 'complete' };
  let state = STATE.LOADING;
  let currentLevelIndex = 0;

  const player = {
    y: TRAMPOLINE_Y - CHAR_RADIUS,
    vy: 0,
    squash: 0,
    boostCount: 0,
    lastBoostAt: 0,
    maskOff: 0,
    tierGroup: 0,
  };

  let coins = [];
  let balloons = [];
  let slimes = [];
  let sling = null;               // { worldY, ready, tension, dir, holding } on slingshot levels
  let resumeState = 'playing';    // state to return to after the in-game upgrades panel
  let slingResultTimer = null;
  let runGold = 0;                // gold earned from coins in the current run
  let heli = null;                // { worldY, boarded, speed, burst, clouds } on helicopter levels
  let web = null;                 // { worldY, boarded, speed, burst, swingPhase, side } on web-swing levels
  let cometBoost = 0;             // accumulates on comet levels; multiplies bounce/boost speed
  // Per-run special boosts bought for a small amount of gold (Bölüm 6/7/8
  // specific), not part of the general Yükseltmeler shop. Reset every attempt.
  let runBoost = { aim: false, rotor: false, web: false };
  let showShopHint = false;       // nudges the player toward Yükseltmeler after an unfinished run
  let shopReturn = 'menu'; // where the upgrades screen returns to: 'menu' | 'game'
  let particles = [];
  let clouds = [];
  let cameraOffset = 0;
  let maxHeightReached = 0;
  let lastProgressAt = 0; // performance.now() of the last new personal-best height this run
  let collectedCount = 0;
  let lastTime = 0;

  function currentLevel() { return LEVELS[currentLevelIndex]; }
  function currentTheme() { return THEMES[currentLevel().theme]; }

  // Clouds live in a fixed screen-space band near the top (not the game
  // world) so they read as distant sky atmosphere instead of scrolling
  // through the forest canopy and cluttering the view.
  function initClouds() {
    clouds = Array.from({ length: 5 }, (_, i) => ({
      relX: Math.random(),
      baseY: 40 + i * 48 + Math.random() * 20,
      scale: 0.55 + Math.random() * 0.7,
      speed: 0.08 + Math.random() * 0.1,
      driftPx: Math.random() * CANVAS_W,
    }));
  }
  initClouds();

  function resetLevel(levelIndex) {
    currentLevelIndex = levelIndex;
    const level = currentLevel();
    player.y = TRAMPOLINE_Y - CHAR_RADIUS;
    player.vy = 0;
    player.squash = 0;
    player.boostCount = 0;
    player.maskOff = 0;
    coins = level.coinHeights.map((h, i) => ({
      worldY: TRAMPOLINE_Y - h,
      collected: false,
      wobble: Math.random() * Math.PI * 2,
      ballType: level.collectible === 'sport' ? SPORT_BALL_TYPES[i % SPORT_BALL_TYPES.length] : null,
      isComet: level.collectible === 'comet',
      isSnowflake: level.collectible === 'snowflake',
      isEmber: level.collectible === 'ember',
      isPearl: level.collectible === 'pearl',
      isCrystal: level.collectible === 'crystal',
      isLantern: level.collectible === 'lantern',
      isGhost: level.collectible === 'ghost',
      isCandy: level.collectible === 'candy',
      isRelic: level.collectible === 'relic',
      isRainbow: level.collectible === 'rainbow',
      isButterfly: level.collectible === 'butterfly',
      isTreasure: level.collectible === 'treasure',
    }));
    hudCoinIcon.textContent = level.collectible === 'sport' ? '⚽' : level.collectible === 'comet' ? '☄️' : level.collectible === 'snowflake' ? '❄️' : level.collectible === 'ember' ? '🔥' : level.collectible === 'pearl' ? '🫧' : level.collectible === 'crystal' ? '💎' : level.collectible === 'lantern' ? '🏮' : level.collectible === 'ghost' ? '👻' : level.collectible === 'candy' ? '🍭' : level.collectible === 'relic' ? '🗿' : level.collectible === 'rainbow' ? '🌈' : level.collectible === 'butterfly' ? '🦋' : level.collectible === 'treasure' ? '💰' : '🪙';
    cometBoost = 0;
    runBoost = { aim: false, rotor: false, web: false };
    particles = [];
    balloons = makeBalloons(level);
    slimes = makeSlimes(level);
    slimeWarn.hidden = true;
    sling = level.slingshot
      ? { worldY: TRAMPOLINE_Y - level.slingshot, ready: true, tension: 0, dir: 1, holding: false }
      : null;
    slingMeter.hidden = true;
    slingResult.hidden = true;
    clearTimeout(slingResultTimer);
    heli = level.helicopter ? makeHeli(level) : null;
    web = level.webswing ? makeWeb(level) : null;
    runGold = 0;
    renderUpgradeChips();
    cameraOffset = 0;
    maxHeightReached = 0;
    lastProgressAt = performance.now();
    clearTimeout(ingameHintTimer);
    ingameUpgradeBanner.hidden = true;
    hudShopHint.hidden = true;
    collectedCount = 0;
    coinCountEl.textContent = '0';
    coinTotalEl.textContent = String(level.coinHeights.length);
    hudLevel.textContent = level.name;
    hudGoldAmount.textContent = String(save.gold);
    heightFill.style.height = '0%';
  }

  // Dozens of balloons drift across the climb; the hero shoves them aside
  // on the way up and they slowly float back toward their home spots.
  function makeBalloons(level) {
    if (!level.balloons) return [];
    const top = level.coinHeights[level.coinHeights.length - 1];
    const minY = TRAMPOLINE_Y - 220;
    const maxY = TRAMPOLINE_Y - top - 140;
    return Array.from({ length: level.balloons }, (_, i) => {
      const homeX = 30 + Math.random() * (CANVAS_W - 60);
      return {
        x: homeX,
        homeX,
        y: minY + (maxY - minY) * ((i + Math.random() * 0.8) / level.balloons),
        vx: 0,
        phase: Math.random() * Math.PI * 2,
        bobPhase: Math.random() * Math.PI * 2,
        swayAmp: 10 + Math.random() * 18,
        color: BALLOON_COLORS[i % BALLOON_COLORS.length],
        side: Math.random() < 0.5 ? -1 : 1,
        touching: false,
      };
    });
  }

  // Slimes chase the hero, stick to it and weigh it down. Taps shake them
  // off (Flight Boost tier = more per tap); Spring tier lightens the load.
  function makeSlimes(level) {
    if (!level.slimes) return [];
    const top = level.coinHeights[level.coinHeights.length - 1];
    const minY = TRAMPOLINE_Y - 260;
    const maxY = TRAMPOLINE_Y - top - 80;
    return Array.from({ length: level.slimes }, (_, i) => ({
      x: 40 + Math.random() * (CANVAS_W - 80),
      y: minY + (maxY - minY) * ((i + Math.random() * 0.7) / level.slimes),
      vx: 0,
      phase: Math.random() * Math.PI * 2,
      wob: Math.random() * Math.PI * 2,
      stuck: false,
      offX: 0,
      offY: 0,
      cooldown: 0,
    }));
  }

  function slimeDrag() { return Math.max(0.02, 0.14 - save.upgrades.spring * 0.012 - save.upgrades.armor * 0.01); }

  function updateSlimes(dt) {
    if (!slimes.length) return;
    const heroY = player.y - 6;
    let stuckCount = 0;
    slimes.forEach(s => {
      s.wob += 0.12 * dt;
      if (s.stuck) { stuckCount++; return; }
      if (s.cooldown > 0) s.cooldown -= dt;
      s.phase += 0.02 * dt;
      const dy = s.y - heroY;
      if (Math.abs(dy) < 320 && s.cooldown <= 0) {
        s.vx += Math.sign(CENTER_X - s.x) * 0.05 * dt;
      } else {
        s.vx += Math.sin(s.phase) * 0.02 * dt;
      }
      s.vx *= Math.pow(0.99, dt);
      if (s.cooldown <= 0) s.vx = Math.max(-2.6, Math.min(2.6, s.vx));
      s.x += s.vx * dt;
      s.y += Math.sin(s.phase * 1.7) * 0.35 * dt;
      if (s.x < SLIME_R) { s.x = SLIME_R; s.vx = Math.abs(s.vx); }
      if (s.x > CANVAS_W - SLIME_R) { s.x = CANVAS_W - SLIME_R; s.vx = -Math.abs(s.vx); }

      if (s.cooldown <= 0 && Math.hypot(s.x - CENTER_X, dy) < 24 + SLIME_R) {
        s.stuck = true;
        s.offX = (Math.random() - 0.5) * 40;
        s.offY = (Math.random() - 0.5) * 44;
        player.vy *= Math.min(1, 0.92 + save.upgrades.armor * 0.008);
        stuckCount++;
        spawnParticles(CENTER_X + s.offX, s.y + cameraOffset, 6, '#6cf27a');
      }
    });

    if (stuckCount > 0) player.vy += slimeDrag() * stuckCount * dt;
    slimeWarn.hidden = stuckCount === 0;
    if (stuckCount > 0) slimeWarn.textContent = `🟢 Slime x${stuckCount} yapıştı — dokunarak silkele!`;
  }

  function shakeSlimes(amount) {
    let n = amount;
    const heroY = player.y - 6;
    let popped = 0;
    slimes.forEach(s => {
      if (n <= 0 || !s.stuck) return;
      // a shaken-off slime bursts for good instead of piling up near the trampoline
      s.popped = true;
      n--;
      popped++;
      spawnParticles(CENTER_X + s.offX, heroY + s.offY + cameraOffset, 16, '#6cf27a');
      spawnParticles(CENTER_X + s.offX, heroY + s.offY + cameraOffset, 6, '#d6ffd0');
    });
    if (popped) {
      slimes = slimes.filter(s => !s.popped);
      playPop();
    }
  }

  function getNextLevelIndex() {
    for (let i = 0; i <= save.unlockedLevel && i < LEVELS.length; i++) {
      if (!save.completedLevels[i]) return i;
    }
    return Math.min(save.unlockedLevel, LEVELS.length - 1);
  }

  function startLevel(index) {
    audio();
    resetLevel(index);
    const level = currentLevel();
    if (level.specialBoost) {
      showBoostPrompt(level);
    } else {
      beginPlaying();
    }
  }

  function beginPlaying() {
    state = STATE.PLAYING;
    screens.shop.classList.remove('shop-overlay');
    showScreen(null);
    hud.hidden = false;
  }

  // Bölüm 6/7/8's one-time per-run boost offer, shown right after the level
  // resets and before gameplay actually starts.
  function showBoostPrompt(level) {
    state = STATE.BOOST;
    boostIcon.textContent = level.specialBoostIcon;
    boostTitle.textContent = level.specialBoostLabel;
    boostDesc.textContent = level.specialBoostDesc;
    boostCostLabel.textContent = String(level.specialBoostCost);
    boostGoldAmount.textContent = String(save.gold);
    boostYesBtn.disabled = save.gold < level.specialBoostCost;
    showScreen('boost');
  }

  boostYesBtn.addEventListener('click', () => {
    const level = currentLevel();
    if (level.specialBoost && save.gold >= level.specialBoostCost) {
      save.gold -= level.specialBoostCost;
      persist();
      runBoost[level.specialBoost] = true;
    }
    beginPlaying();
  });
  boostNoBtn.addEventListener('click', () => {
    beginPlaying();
  });

  // Quit the current attempt without finishing it. If the level wasn't
  // completed, the main menu nudges the player toward Yükseltmeler next time.
  function endLevelEarly() {
    if (state !== STATE.PLAYING && state !== STATE.SLING && state !== STATE.HELI && state !== STATE.WEB) return;
    if (collectedCount < currentLevel().coinHeights.length) {
      showShopHint = true;
    }
    clearTimeout(slingResultTimer);
    state = STATE.MENU;
    hud.hidden = true;
    renderMenu();
    showScreen('menu');
    if (showShopHint) flashUpgradeBanner();
  }
  hudQuitBtn.addEventListener('click', endLevelEarly);

  // ---------- Input ----------
  function handleTap() {
    if (state !== STATE.PLAYING) return;
    const now = performance.now();
    const airborne = player.y < TRAMPOLINE_Y - CHAR_RADIUS - 1;
    if (airborne && player.boostCount < MAX_BOOSTS_PER_CYCLE && now - player.lastBoostAt > BOOST_COOLDOWN_MS) {
      player.vy += currentBoostImpulse() * cometSpeedMultiplier();
      player.boostCount += 1;
      player.lastBoostAt = now;
      playBoost();
      spawnParticles(CENTER_X, player.y + cameraOffset, 6, '#ffe28a');
      shakeSlimes(1 + save.upgrades.boost);
    }
  }

  phoneFrame.addEventListener('pointerdown', (e) => {
    if (e.target.closest('.screen, .hud-shop-btn')) return;
    if (state === STATE.HELI) {
      audio();
      heli.burst = Math.min(HELI_BURST_MAX, heli.burst + HELI_BURST_ADD);
      spawnParticles(CENTER_X, player.y - 60 + cameraOffset, 4, '#ffffff');
      playBoost();
      return;
    }
    if (state === STATE.WEB) {
      const now = performance.now();
      if (now - web.lastTapAt > WEB_TAP_COOLDOWN_MS) {
        audio();
        const impulse = WEB_TAP_IMPULSE_BASE + (runBoost.web ? WEB_BOOST_IMPULSE : 0);
        web.speed = Math.min(WEB_MAX, web.speed + impulse);
        web.lastTapAt = now;
        spawnParticles(CENTER_X, player.y - 60 + cameraOffset, 4, '#ffffff');
        playBoost();
      }
      return;
    }
    if (state === STATE.SLING) {
      audio();
      sling.holding = true;
      sling.dir = 1;
      sling.tension = 0;
      return;
    }
    handleTap();
  });
  window.addEventListener('pointerup', fireSling);
  window.addEventListener('pointercancel', fireSling);

  // ---------- Particles ----------
  function spawnParticles(x, y, count, color) {
    for (let i = 0; i < count; i++) {
      particles.push({
        x, y,
        vx: (Math.random() - 0.5) * 4,
        vy: (Math.random() - 0.8) * 4,
        life: 1,
        color,
        r: 2 + Math.random() * 2.5,
      });
    }
  }

  function updateParticles(dt) {
    particles.forEach(p => {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 0.15 * dt;
      p.life -= 0.03 * dt;
    });
    particles = particles.filter(p => p.life > 0);
  }

  // ---------- Physics ----------
  function updatePhysics(dt) {
    const prevY = player.y;
    player.vy += GRAVITY * dt;
    player.y += player.vy * dt;

    if (player.squash > 0) player.squash = Math.max(0, player.squash - 0.06 * dt);

    if (player.vy > 0 && player.y + CHAR_RADIUS >= TRAMPOLINE_Y) {
      player.y = TRAMPOLINE_Y - CHAR_RADIUS;
      player.vy = currentBaseBounce() * cometSpeedMultiplier();
      player.boostCount = 0;
      player.squash = 1;
      if (sling) sling.ready = true;
      playBoing();
      spawnParticles(CENTER_X, TRAMPOLINE_Y + cameraOffset - 6, 5, '#bfe8ff');
    }

    // rising through the helicopter's height boards it
    if (heli && !heli.boarded && player.vy < 0 && prevY > heli.worldY && player.y <= heli.worldY) {
      boardHeli();
      return;
    }

    // rising through the web-swing height calls in the web hero's rescue
    if (web && !web.boarded && player.vy < 0 && prevY > web.worldY && player.y <= web.worldY) {
      boardWeb();
      return;
    }

    // rising through the slingshot's height docks the hero in its pouch
    if (sling && sling.ready && player.vy < 0 && prevY > sling.worldY && player.y <= sling.worldY) {
      dockSling();
      return;
    }

    cameraOffset = Math.max(0, CAMERA_FOLLOW_Y - player.y);

    const heightAboveTrampoline = Math.max(0, TRAMPOLINE_Y - player.y);
    if (heightAboveTrampoline > maxHeightReached) {
      maxHeightReached = heightAboveTrampoline;
      lastProgressAt = performance.now();
    }

    // Stuck below the finish line for a while despite any upgrades already
    // bought? Nudge the player back toward Yükseltmeler, and keep nudging
    // every STAGNATION_MS as long as they're still stuck.
    const stagnationGoal = currentLevel().coinHeights[currentLevel().coinHeights.length - 1];
    if (maxHeightReached < stagnationGoal && performance.now() - lastProgressAt > STAGNATION_MS) {
      lastProgressAt = performance.now();
      flashIngameUpgradeHint();
    }

    collectCoins();

    updateBalloons(dt);
    updateSlimes(dt);

    const topGoal = currentLevel().coinHeights[currentLevel().coinHeights.length - 1];
    const pct = Math.min(100, (maxHeightReached / topGoal) * 100);
    heightFill.style.height = `${pct}%`;

    updateParticles(dt);
    updateClouds(dt);
  }

  // ---------- Coins ----------
  function collectCoins() {
    const reach = CHAR_RADIUS + 16 + save.upgrades.magnet * 7;
    const coinGold = Math.round(GOLD_PER_COIN * (1 + 0.2 * save.upgrades.gold));
    coins.forEach(coin => {
      if (coin.collected) return;
      if (Math.abs(coin.worldY - player.y) < reach) {
        coin.collected = true;
        collectedCount += 1;
        coinCountEl.textContent = String(collectedCount);
        save.gold += coinGold;
        runGold += coinGold;
        hudGoldAmount.textContent = String(save.gold);
        if (coin.isComet) cometBoost += COMET_SPEED_STEP;
        persist();
        playGoldChime();
        spawnParticles(CENTER_X, coin.worldY + cameraOffset, 14, coin.ballType ? '#ffffff' : coin.isComet ? '#9fd3ff' : coin.isSnowflake ? '#e8fbff' : coin.isEmber ? '#ff8a3d' : coin.isPearl ? '#eaf6ff' : coin.isCrystal ? '#c060e0' : coin.isLantern ? '#ffcf6a' : coin.isGhost ? '#9fffc0' : coin.isCandy ? '#ff6b9d' : coin.isRelic ? '#e0b84a' : coin.isRainbow ? '#ff9ad6' : coin.isButterfly ? '#9b6fff' : coin.isTreasure ? '#ffd24a' : '#ffd24a');
        if (collectedCount >= currentLevel().coinHeights.length) {
          triggerLevelComplete();
        }
      }
    });
  }

  // ---------- Helicopter ----------
  // The hero boards a hovering helicopter and flies to the summit on its own;
  // the rotor tears through cloud banks, each one slowing the climb a little.
  function makeHeli(level) {
    const worldY = TRAMPOLINE_Y - level.helicopter;
    const top = TRAMPOLINE_Y - level.coinHeights[level.coinHeights.length - 1];
    const count = 16;
    const clouds = Array.from({ length: count }, (_, i) => {
      const w = 150 + Math.random() * 80;
      const n = 7;
      const puffs = Array.from({ length: n }, (_, k) => {
        const dx = -w / 2 + (k + 0.5) * (w / n);
        return { dx, dy: (Math.random() - 0.5) * 10, r: (24 + Math.random() * 14) * (1 - Math.abs(dx) / w * 0.5) };
      });
      return {
        x: CENTER_X + (Math.random() - 0.5) * (i % 3 === 2 ? 260 : 90),
        y: worldY - 280 + (top - 40 - (worldY - 280)) * ((i + Math.random() * 0.7) / count),
        w, puffs, split: false, offL: 0, offR: 0, vL: 0, vR: 0,
      };
    });
    return { worldY, boarded: false, speed: 0, burst: 0, clouds };
  }

  function boardHeli() {
    heli.boarded = true;
    state = STATE.HELI;
    player.y = heli.worldY;
    player.vy = -2;
    player.squash = 0;
    player.boostCount = 0;
    heli.speed = 2;
    heli.burst = 0;
    cameraOffset = Math.max(0, CAMERA_FOLLOW_Y - player.y);
    slingResult.textContent = 'Helikopter! Dokunarak hızlan 🚁';
    slingResult.style.color = '#9be8ff';
    slingResult.hidden = false;
    clearTimeout(slingResultTimer);
    slingResultTimer = setTimeout(() => { slingResult.hidden = true; }, 2200);
    spawnParticles(CENTER_X, player.y + cameraOffset, 16, '#9be8ff');
    playFling();
  }

  function updateHeli(dt) {
    const base = Math.min(HELI_MAX, HELI_BASE + (runBoost.rotor ? HELI_ROTOR_BOOST : 0));
    heli.burst *= Math.pow(0.97, dt);
    const target = Math.min(HELI_MAX, base + heli.burst);
    heli.speed += (target - heli.speed) * Math.min(1, 0.06 * dt);
    player.y -= heli.speed * dt;
    player.vy = -heli.speed;
    cameraOffset = Math.max(0, CAMERA_FOLLOW_Y - player.y);

    const heightAboveTrampoline = Math.max(0, TRAMPOLINE_Y - player.y);
    if (heightAboveTrampoline > maxHeightReached) maxHeightReached = heightAboveTrampoline;

    const rotorY = player.y - 60;
    const slow = runBoost.rotor ? HELI_CLOUD_SLOW_BOOSTED : HELI_CLOUD_SLOW_BASE;
    heli.clouds.forEach(c => {
      if (!c.split && Math.abs(c.y - rotorY) < 34 && Math.abs(c.x - CENTER_X) < c.w / 2 + 20) {
        c.split = true;
        c.vL = -7;
        c.vR = 7;
        heli.speed = Math.max(2.5, heli.speed * slow);
        spawnParticles(CENTER_X, rotorY + cameraOffset, 12, '#ffffff');
        playBalloonBump();
      }
      if (c.split) {
        c.offL += c.vL * dt;
        c.offR += c.vR * dt;
        c.vL *= Math.pow(0.95, dt);
        c.vR *= Math.pow(0.95, dt);
      }
    });

    collectCoins();

    const topGoal = currentLevel().coinHeights[currentLevel().coinHeights.length - 1];
    heightFill.style.height = `${Math.min(100, (maxHeightReached / topGoal) * 100)}%`;
    updateParticles(dt);
    updateClouds(dt);
  }

  // ---------- Web-swing (Bölüm 8) ----------
  // An original web-slinging hero boards the hero at a fixed height. Unlike
  // the helicopter's steady auto-climb, speed decays fast every frame —
  // each tap pumps in a burst of upward speed, but stop tapping and the
  // hero sinks back down, so reaching the top takes continuous clicking.
  function makeWeb(level) {
    const worldY = TRAMPOLINE_Y - level.webswing;
    return { worldY, boarded: false, speed: 0, swingPhase: 0, side: Math.random() < 0.5 ? 1 : -1, lastTapAt: -1e9 };
  }

  function boardWeb() {
    web.boarded = true;
    state = STATE.WEB;
    player.y = web.worldY;
    player.vy = -2;
    player.squash = 0;
    player.boostCount = 0;
    web.speed = 3;
    web.swingPhase = 0;
    web.lastTapAt = -1e9;
    cameraOffset = Math.max(0, CAMERA_FOLLOW_Y - player.y);
    slingResult.textContent = 'Ağ atıldı! Sürekli dokunarak sallan 🕸️';
    slingResult.style.color = '#ff8a7a';
    slingResult.hidden = false;
    clearTimeout(slingResultTimer);
    slingResultTimer = setTimeout(() => { slingResult.hidden = true; }, 2200);
    spawnParticles(CENTER_X, player.y + cameraOffset, 16, '#ffffff');
    playFling();
  }

  function updateWeb(dt) {
    web.speed *= Math.pow(WEB_DECAY, dt);
    web.speed = Math.max(WEB_MIN, web.speed);
    player.y -= web.speed * dt;
    // a soft floor at the boarding height — stop tapping for too long and
    // the web hero's grip holds the hero here instead of letting go
    if (player.y > web.worldY) {
      player.y = web.worldY;
      web.speed = Math.max(web.speed, 0);
    }
    player.vy = -web.speed;
    web.swingPhase += WEB_SWING_SPEED * dt;
    cameraOffset = Math.max(0, CAMERA_FOLLOW_Y - player.y);

    const heightAboveTrampoline = Math.max(0, TRAMPOLINE_Y - player.y);
    if (heightAboveTrampoline > maxHeightReached) maxHeightReached = heightAboveTrampoline;

    collectCoins();

    const topGoal = currentLevel().coinHeights[currentLevel().coinHeights.length - 1];
    heightFill.style.height = `${Math.min(100, (maxHeightReached / topGoal) * 100)}%`;
    updateParticles(dt);
    updateClouds(dt);
  }

  // ---------- Slingshot ----------
  // Aim upgrade shrinks the red/yellow zones, so green starts earlier and covers more of the meter.
  function slingZoneScale() { return runBoost.aim ? SLING_AIM_BOOST_SCALE : 1; }

  function applySlingZones() {
    const f = slingZoneScale();
    const red = SLING_RED_MAX * f * 100;
    const yellow = (SLING_GREEN_MIN - SLING_RED_MAX) * f * 100;
    const green = 100 - red - yellow;
    const widths = [red, yellow, green];
    slingMeter.querySelectorAll('.sling-seg').forEach((el, i) => { el.style.width = `${widths[i]}%`; });
    slingMeter.querySelectorAll('.sling-meter-labels span').forEach((el, i) => { el.style.width = `${widths[i]}%`; });
  }

  function dockSling() {
    state = STATE.SLING;
    sling.ready = false;
    sling.tension = 0;
    sling.dir = 1;
    sling.holding = false;
    player.y = sling.worldY + 10;
    player.vy = 0;
    player.boostCount = 0;
    cameraOffset = Math.max(0, CAMERA_FOLLOW_Y - player.y);
    slingMarker.style.left = '0%';
    applySlingZones();
    slingResult.hidden = true;
    slingMeter.hidden = false;
    playBoost();
    flashSlingHoldBanner();
  }

  // A bold, WordArt-style "BASILI TUT!" banner that pops in and fades out
  // every time the hero docks on the slingshot, reinforcing the hold-to-launch gesture.
  let slingHoldBannerTimer = null;
  function flashSlingHoldBanner() {
    slingHoldBanner.hidden = true;
    void slingHoldBanner.offsetWidth; // restart the CSS animation from scratch
    slingHoldBanner.hidden = false;
    clearTimeout(slingHoldBannerTimer);
    slingHoldBannerTimer = setTimeout(() => { slingHoldBanner.hidden = true; }, 2200);
  }

  // Shown when a run ends without reaching the finish line: a big
  // WordArt-style "YÜKSELTMELER" banner pops in/out over the menu, drawing
  // the eye toward the small bouncing-arrow hint next to the shop button.
  let upgradeBannerTimer = null;
  function flashUpgradeBanner() {
    upgradeBanner.hidden = true;
    void upgradeBanner.offsetWidth;
    upgradeBanner.hidden = false;
    clearTimeout(upgradeBannerTimer);
    upgradeBannerTimer = setTimeout(() => { upgradeBanner.hidden = true; }, 2200);
  }

  // Shown mid-run when the player is stuck well below the finish line: the
  // same WordArt "YÜKSELTMELER" treatment plus a bouncing arrow over the HUD's
  // own Yükseltmeler button, so the suggestion appears without quitting the run.
  let ingameHintTimer = null;
  function flashIngameUpgradeHint() {
    ingameUpgradeBanner.hidden = true;
    void ingameUpgradeBanner.offsetWidth;
    ingameUpgradeBanner.hidden = false;
    hudShopHint.hidden = false;
    clearTimeout(ingameHintTimer);
    ingameHintTimer = setTimeout(() => {
      ingameUpgradeBanner.hidden = true;
      hudShopHint.hidden = true;
    }, 3200);
  }

  function updateSling(dt) {
    if (sling.holding) {
      sling.tension += sling.dir * 0.014 * dt;
      if (sling.tension >= 1) { sling.tension = 1; sling.dir = -1; }
      if (sling.tension <= 0) { sling.tension = 0; sling.dir = 1; }
    }
    player.y = sling.worldY + 10 + sling.tension * SLING_PULL;
    player.squash = sling.tension * 0.7;
    cameraOffset = Math.max(0, CAMERA_FOLLOW_Y - (sling.worldY + 10));
    slingMarker.style.left = `${sling.tension * 100}%`;
    updateParticles(dt);
    updateClouds(dt);
  }

  function fireSling() {
    if (state !== STATE.SLING || !sling.holding) return;
    sling.holding = false;
    const t = sling.tension;
    player.y = sling.worldY + 10;
    // the aim upgrade squeezes the zones toward 0, so a lighter pull already counts as full power
    player.vy = -(SLING_V_MIN + SLING_V_RANGE * Math.min(1, t / slingZoneScale()));
    player.squash = 0;
    player.boostCount = 0;
    sling.tension = 0;
    state = STATE.PLAYING;
    slingMeter.hidden = true;

    let label = 'Yetersiz gerilme!';
    let color = '#ff6b6e';
    if (t >= SLING_GREEN_MIN * slingZoneScale()) { label = 'Mükemmel fırlatma! 🎯'; color = '#3ddc84'; }
    else if (t >= SLING_RED_MAX * slingZoneScale()) { label = 'Orta güç'; color = '#ffd23f'; }
    slingResult.textContent = label;
    slingResult.style.color = color;
    slingResult.hidden = false;
    clearTimeout(slingResultTimer);
    slingResultTimer = setTimeout(() => { slingResult.hidden = true; }, 1400);

    spawnParticles(CENTER_X, player.y + cameraOffset, 14, color);
    playFling();
  }

  let lastBalloonSoundAt = 0;
  function updateBalloons(dt) {
    if (!balloons.length) return;
    const heroY = player.y - 6;
    const minDist = 24 + BALLOON_R;
    balloons.forEach(b => {
      b.phase += 0.02 * dt;
      b.bobPhase += 0.015 * dt;
      // float: sway around the home spot, spring back after being shoved
      const target = b.homeX + Math.sin(b.phase) * b.swayAmp;
      b.vx += (target - b.x) * 0.006 * dt;
      b.vx *= Math.pow(0.97, dt);
      b.x += b.vx * dt;
      b.y += Math.sin(b.bobPhase) * 0.25 * dt;
      if (b.x < BALLOON_R) { b.x = BALLOON_R; b.vx = Math.abs(b.vx) * 0.6; }
      if (b.x > CANVAS_W - BALLOON_R) { b.x = CANVAS_W - BALLOON_R; b.vx = -Math.abs(b.vx) * 0.6; }

      const dx = b.x - CENTER_X;
      const dy = b.y - heroY;
      const dist = Math.hypot(dx, dy);
      if (dist < minDist) {
        const dir = Math.abs(dx) < 4 ? b.side : Math.sign(dx);
        // shove it out of the hero's path, harder the faster the hero moves
        const clearX = Math.sqrt(Math.max(0, minDist * minDist - dy * dy));
        b.x = Math.max(BALLOON_R, Math.min(CANVAS_W - BALLOON_R, CENTER_X + dir * Math.max(Math.abs(dx), clearX)));
        b.vx = dir * (3.5 + Math.abs(player.vy) * 0.3);
        if (!b.touching) {
          b.touching = true;
          player.vy *= Math.min(0.999, BALLOON_SLOWDOWN + save.upgrades.armor * 0.003);
          spawnParticles(b.x, b.y + cameraOffset, 4, b.color);
          const now = performance.now();
          if (now - lastBalloonSoundAt > 60) { lastBalloonSoundAt = now; playBalloonBump(); }
        }
      } else if (dist > minDist + 8) {
        b.touching = false;
      }
    });
  }

  function updateClouds(dt) {
    clouds.forEach(c => {
      c.driftPx = (c.driftPx + c.speed * dt) % (CANVAS_W + 160);
    });
  }

  function triggerLevelComplete() {
    state = STATE.COMPLETE;
    showShopHint = false;
    playFanfare();

    const level = currentLevel();
    let bonus = 0;
    let unlockedNext = false;
    if (!save.completedLevels[level.id]) {
      bonus = LEVEL_FIRST_CLEAR_BONUS;
      save.gold += bonus;
      save.completedLevels[level.id] = true;
      const nextIndex = level.id + 1;
      if (nextIndex < LEVELS.length && save.unlockedLevel < nextIndex) {
        save.unlockedLevel = nextIndex;
        unlockedNext = true;
      }
      persist();
    }

    completeLevelName.textContent = `${level.name} Tamamlandı`;
    completeGoldEarned.textContent = `+${runGold + bonus} 🪙`;
    const nextIndex = level.id + 1;
    if (unlockedNext) {
      completeUnlockMsg.hidden = false;
      completeUnlockMsg.textContent = `${LEVELS[nextIndex].name} açıldı! 🎉`;
    } else {
      completeUnlockMsg.hidden = true;
    }
    nextLevelBtn.hidden = !(nextIndex < LEVELS.length && nextIndex <= save.unlockedLevel);

    const start = performance.now();
    function animateMask(now) {
      const t = Math.min(1, (now - start) / 900);
      player.maskOff = t;
      if (t < 1) {
        requestAnimationFrame(animateMask);
      } else {
        hud.hidden = true;
        showScreen('complete');
        spawnConfetti();
      }
    }
    requestAnimationFrame(animateMask);
  }

  function spawnConfetti() {
    confettiLayer.innerHTML = '';
    const colors = ['#ffcf3f', '#ffb400', '#7ee08a', '#6bc9ff', '#ffffff'];
    for (let i = 0; i < 40; i++) {
      const piece = document.createElement('div');
      piece.className = 'confetti-piece';
      piece.style.left = `${Math.random() * 100}%`;
      piece.style.background = colors[Math.floor(Math.random() * colors.length)];
      piece.style.animationDuration = `${1.4 + Math.random() * 1.4}s`;
      piece.style.animationDelay = `${Math.random() * 0.5}s`;
      confettiLayer.appendChild(piece);
      setTimeout(() => piece.remove(), 3200);
    }
  }

  // ---------- Drawing helpers ----------
  function lerpColor(a, b, t) {
    const r = Math.round(a[0] + (b[0] - a[0]) * t);
    const g = Math.round(a[1] + (b[1] - a[1]) * t);
    const bch = Math.round(a[2] + (b[2] - a[2]) * t);
    return `rgb(${r}, ${g}, ${bch})`;
  }

  function seededRand(n) {
    const x = Math.sin(n * 12.9898) * 43758.5453;
    return x - Math.floor(x);
  }

  // ---------- Drawing: background ----------
  function drawBackground(theme) {
    const climb = Math.min(1, cameraOffset / 500);
    const skyTop = lerpColor(theme.skyTop, theme.skyTopHigh, climb);
    const skyBot = lerpColor(theme.skyBot, theme.skyBotHigh, climb);
    const grad = ctx.createLinearGradient(0, 0, 0, CANVAS_H);
    grad.addColorStop(0, skyTop);
    grad.addColorStop(1, skyBot);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

    if (theme.decor === 'city') {
      drawSun(theme, climb);
      drawClouds(climb);
      drawCity();
      return;
    }

    if (theme.decor === 'lagoon') {
      drawSun(theme, climb);
      drawClouds(climb);
      drawLagoon();
      return;
    }

    if (theme.decor === 'ocean') {
      drawSunsetOcean(theme);
      drawClouds(climb);
      return;
    }

    if (theme.decor === 'space') {
      drawNebula();
      drawStarfield();
      drawDecorLayer(theme, 0.3, 560, theme.foliage[0], 1, 0.55);
      drawDecorLayer(theme, 0.55, 440, theme.foliage[1], 2, 0.75);
      return;
    }

    if (theme.decor === 'aurora') {
      drawStarfield();
      drawAuroraRibbons();
      drawDecorLayer(theme, 0.4, 460, theme.foliage[0], 1, 0.4);
      drawDecorLayer(theme, 0.65, 360, theme.foliage[1], 2, 0.55);
      return;
    }

    if (theme.decor === 'volcano') {
      drawSun(theme, climb);
      drawDecorLayer(theme, 0.35, 460, theme.foliage[0], 1, 0.6);
      drawDecorLayer(theme, 0.6, 360, theme.foliage[1], 2, 0.8);
      return;
    }

    if (theme.decor === 'deepsea') {
      drawBubbles();
      drawDecorLayer(theme, 0.35, 420, theme.foliage[0], 1, 0.55);
      drawDecorLayer(theme, 0.6, 320, theme.foliage[1], 2, 0.75);
      return;
    }

    if (theme.decor === 'cave') {
      drawStarfield();
      drawDecorLayer(theme, 0.35, 440, theme.foliage[0], 1, 0.55);
      drawDecorLayer(theme, 0.6, 340, theme.foliage[1], 2, 0.75);
      return;
    }

    if (theme.decor === 'lantern') {
      drawSun(theme, climb);
      drawDecorLayer(theme, 0.35, 420, theme.foliage[0], 1, 0.6);
      drawDecorLayer(theme, 0.6, 320, theme.foliage[1], 2, 0.8);
      return;
    }

    if (theme.decor === 'haunted') {
      drawStarfield();
      drawDecorLayer(theme, 0.35, 440, theme.foliage[0], 1, 0.65);
      drawDecorLayer(theme, 0.6, 340, theme.foliage[1], 2, 0.85);
      return;
    }

    if (theme.decor === 'candy') {
      drawSun(theme, climb);
      drawDecorLayer(theme, 0.35, 420, theme.foliage[0], 1, 0.6);
      drawDecorLayer(theme, 0.6, 320, theme.foliage[1], 2, 0.8);
      return;
    }

    if (theme.decor === 'temple') {
      drawSun(theme, climb);
      drawDecorLayer(theme, 0.35, 420, theme.foliage[0], 1, 0.6);
      drawDecorLayer(theme, 0.6, 320, theme.foliage[1], 2, 0.8);
      return;
    }

    drawSun(theme, climb);
    drawClouds(climb);

    // As the hero climbs above the tree line the canopy thins out,
    // revealing open sky — matches the sky color already brightening.
    const treeAlpha = 1 - climb * 0.85;
    const sparse = theme.decor === 'stadium';
    ctx.save();
    ctx.globalAlpha = treeAlpha;
    drawDecorLayer(theme, 0.35, sparse ? 420 : 150, theme.foliage[0], 1, sparse ? 0.8 : 0.62);
    drawDecorLayer(theme, 0.6, sparse ? 340 : 120, theme.foliage[1], 2, sparse ? 1.0 : 0.8);
    drawDecorLayer(theme, 1.0, sparse ? 280 : 95, theme.foliage[2], 3, sparse ? 1.2 : 1.0);
    ctx.restore();
  }

  // Sunset over the sea: the sun sits on the horizon and slips out of view
  // as the hero climbs; the sea shimmers and rolls in gentle waves.
  function drawSunsetOcean(theme) {
    const horizon = 470 + cameraOffset * 0.3;
    const sx = CANVAS_W * 0.5;
    const t = performance.now() / 1000;
    if (horizon > CANVAS_H + 120) return;

    const glow = ctx.createRadialGradient(sx, horizon, 6, sx, horizon, 260);
    glow.addColorStop(0, theme.sunGlow);
    glow.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = glow;
    ctx.fillRect(0, Math.max(0, horizon - 260), CANVAS_W, 260);

    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, CANVAS_W, horizon);
    ctx.clip();
    ctx.fillStyle = theme.sunColor;
    ctx.beginPath();
    ctx.arc(sx, horizon - 4, 56, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    if (horizon >= CANVAS_H) return;
    const sea = ctx.createLinearGradient(0, horizon, 0, CANVAS_H);
    sea.addColorStop(0, '#e0663f');
    sea.addColorStop(0.25, '#8a3560');
    sea.addColorStop(1, '#1b1445');
    ctx.fillStyle = sea;
    ctx.fillRect(0, horizon, CANVAS_W, CANVAS_H - horizon);

    // sun glitter on the water
    for (let i = 0; i < 10; i++) {
      const w = 110 - i * 8;
      const y = horizon + 8 + i * 15;
      ctx.fillStyle = `rgba(255, 215, 160, ${0.55 - i * 0.045})`;
      ctx.fillRect(sx - w / 2 + Math.sin(t * 2 + i) * 7, y, w, 4);
    }

    // rolling wave lines
    ctx.lineWidth = 1.6;
    for (let band = 0; band < 7; band++) {
      const y = horizon + 26 + band * 40;
      ctx.strokeStyle = `rgba(255, 190, 150, ${0.10 + band * 0.02})`;
      ctx.beginPath();
      for (let x = 0; x <= CANVAS_W; x += 10) {
        const yy = y + Math.sin(x * 0.03 + t * 1.2 + band * 1.7) * (2 + band * 0.5);
        if (x === 0) ctx.moveTo(x, yy); else ctx.lineTo(x, yy);
      }
      ctx.stroke();
    }
  }

  function drawSun(theme, climb) {
    const sx = CANVAS_W * 0.74;
    const sy = 130 + climb * -20;
    const glow = ctx.createRadialGradient(sx, sy, 4, sx, sy, 110);
    glow.addColorStop(0, theme.sunGlow);
    glow.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(sx, sy, 110, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = theme.sunColor;
    ctx.beginPath();
    ctx.arc(sx, sy, 26, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawClouds(climb) {
    // Fixed screen-space sky band: clouds drift horizontally and fade in
    // as the hero climbs, but never scroll down into the forest itself.
    const alpha = 0.3 + climb * 0.55;
    clouds.forEach(c => {
      const x = ((c.driftPx + c.relX * CANVAS_W) % (CANVAS_W + 160)) - 80;
      const y = c.baseY - climb * 30;
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = '#ffffff';
      ctx.translate(x, y);
      ctx.scale(c.scale, c.scale);
      [[-24, 0, 22], [0, -8, 28], [26, 0, 20], [10, 6, 18], [-10, 6, 16]].forEach(([dx, dy, r]) => {
        ctx.beginPath();
        ctx.arc(dx, dy, r, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.restore();
    });
  }

  // ---------- Drawing: decor (trees / snow-trees / cacti) ----------
  function drawDecorLayer(theme, parallax, spacing, color, seedOffset, scaleBase) {
    const scroll = cameraOffset * parallax;
    const rowStart = -1;
    const rowEnd = Math.ceil(CANVAS_H / spacing) + 2;
    for (let i = rowStart; i < rowEnd; i++) {
      const y = i * spacing - (scroll % spacing);
      const rowSeed = (i + seedOffset * 13) * 12.9898;
      const xJitter = (Math.sin(rowSeed) * 0.5 + 0.5) * 130;
      for (let x = -60; x < CANVAS_W + 60; x += 130) {
        const tx = ((x + xJitter) % (CANVAS_W + 120)) - 60;
        const itemSeed = rowSeed + x * 0.017;
        const scale = scaleBase * (0.85 + seededRand(itemSeed) * 0.35);
        if (theme.decor === 'trees') drawTree(tx, y, scale, color, theme.trunk, false);
        else if (theme.decor === 'snowtrees') drawTree(tx, y, scale, color, theme.trunk, true);
        else if (theme.decor === 'cacti') drawCactus(tx, y, scale, color, itemSeed);
        else if (theme.decor === 'stadium') drawLightTower(tx, y, scale, color, itemSeed);
        else if (theme.decor === 'space') drawPlanet(tx, y, scale, color, itemSeed);
        else if (theme.decor === 'aurora') drawIceSpike(tx, y, scale, color, itemSeed);
        else if (theme.decor === 'volcano') drawLavaRock(tx, y, scale, color, itemSeed);
        else if (theme.decor === 'deepsea') drawCoral(tx, y, scale, color, itemSeed);
        else if (theme.decor === 'cave') drawCrystalCluster(tx, y, scale, color, itemSeed);
        else if (theme.decor === 'lantern') drawLantern(tx, y, scale, color, itemSeed);
        else if (theme.decor === 'haunted') drawCastleSpire(tx, y, scale, color, itemSeed);
        else if (theme.decor === 'candy') drawCandyDecor(tx, y, scale, color, itemSeed);
        else if (theme.decor === 'temple') drawTemplePillar(tx, y, scale, color, itemSeed);
        else if (theme.decor === 'cloudkingdom') drawCloudTurret(tx, y, scale, color, itemSeed);
        else if (theme.decor === 'flower') drawGiantFlower(tx, y, scale, color, itemSeed);
        else if (theme.decor === 'pirate') drawPirateDecor(tx, y, scale, color, itemSeed);
      }
    }
  }

  function drawTree(x, y, scale, color, trunkColor, snowCap) {
    if (y < -140 || y > CANVAS_H + 140) return;
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);

    // ground contact shadow
    ctx.fillStyle = 'rgba(0,0,0,0.18)';
    ctx.beginPath();
    ctx.ellipse(0, 48, 28, 7, 0, 0, Math.PI * 2);
    ctx.fill();

    // trunk with subtle gradient
    const trunkGrad = ctx.createLinearGradient(-5, 0, 5, 0);
    trunkGrad.addColorStop(0, trunkColor);
    trunkGrad.addColorStop(1, '#2c1c11');
    ctx.fillStyle = trunkGrad;
    ctx.fillRect(-4, 8, 8, 32);

    // layered foliage "puffs" with light-direction shading
    const foliageGrad = ctx.createLinearGradient(-22, -60, 20, 20);
    foliageGrad.addColorStop(0, lighten(color, 18));
    foliageGrad.addColorStop(1, darken(color, 22));
    ctx.fillStyle = foliageGrad;
    [[0, 6, 30], [0, -14, 25], [0, -32, 19], [0, -47, 12]].forEach(([dx, dy, r]) => {
      ctx.beginPath();
      ctx.ellipse(dx, dy, r, r * 0.82, 0, 0, Math.PI * 2);
      ctx.fill();
    });

    if (snowCap) {
      ctx.fillStyle = 'rgba(255,255,255,0.92)';
      [[0, -6, 16, 6], [0, -24, 13, 5], [0, -40, 9, 4]].forEach(([dx, dy, r, ry]) => {
        ctx.beginPath();
        ctx.ellipse(dx, dy - r * 0.3, r, ry, 0, Math.PI, Math.PI * 2);
        ctx.fill();
      });
    }

    ctx.restore();
  }

  function drawCactus(x, y, scale, color, seed) {
    if (y < -120 || y > CANVAS_H + 120) return;
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);

    ctx.fillStyle = 'rgba(0,0,0,0.2)';
    ctx.beginPath();
    ctx.ellipse(0, 40, 20, 6, 0, 0, Math.PI * 2);
    ctx.fill();

    const bodyGrad = ctx.createLinearGradient(-12, 0, 12, 0);
    bodyGrad.addColorStop(0, lighten(color, 15));
    bodyGrad.addColorStop(1, darken(color, 18));
    ctx.fillStyle = bodyGrad;

    ctx.beginPath();
    ctx.roundRect(-9, -40, 18, 78, 9);
    ctx.fill();

    const hasArm = seededRand(seed) > 0.35;
    if (hasArm) {
      const side = seededRand(seed + 1) > 0.5 ? 1 : -1;
      const stubX = side > 0 ? 9 : -23;
      const armX = side > 0 ? 11 : -23;
      ctx.beginPath();
      ctx.roundRect(stubX, -4, 14, 12, 6);
      ctx.fill();
      ctx.beginPath();
      ctx.roundRect(armX, -34, 12, 32, 6);
      ctx.fill();
    }

    // spine texture
    ctx.strokeStyle = 'rgba(255,255,255,0.18)';
    ctx.lineWidth = 1;
    for (let i = -6; i <= 6; i += 6) {
      ctx.beginPath();
      ctx.moveTo(i, -38);
      ctx.lineTo(i, 34);
      ctx.stroke();
    }

    ctx.restore();
  }

  // A stadium light tower: tall pole with cross-braces and a cluster of
  // floodlights at the top. Towers tile sparsely up the stadium's height.
  function drawLightTower(x, y, scale, color, seed) {
    if (y < -220 || y > CANVAS_H + 220) return;
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);

    ctx.fillStyle = 'rgba(0,0,0,0.2)';
    ctx.beginPath();
    ctx.ellipse(0, 50, 11, 4, 0, 0, Math.PI * 2);
    ctx.fill();

    const poleGrad = ctx.createLinearGradient(-3, 0, 3, 0);
    poleGrad.addColorStop(0, lighten(color, 14));
    poleGrad.addColorStop(1, darken(color, 10));
    ctx.fillStyle = poleGrad;
    ctx.fillRect(-3, -150, 6, 200);

    ctx.strokeStyle = darken(color, 6);
    ctx.lineWidth = 1.4;
    for (let i = 0; i < 3; i++) {
      const yy = -30 - i * 36;
      ctx.beginPath();
      ctx.moveTo(-3, yy); ctx.lineTo(3, yy - 15);
      ctx.moveTo(3, yy); ctx.lineTo(-3, yy - 15);
      ctx.stroke();
    }

    ctx.fillStyle = '#242424';
    ctx.fillRect(-28, -168, 56, 11);
    for (let i = 0; i < 6; i++) {
      const lx = -23 + i * 9.2;
      ctx.fillStyle = seededRand(seed + i) > 0.3 ? '#fff6c8' : '#d8d8d8';
      ctx.beginPath();
      ctx.arc(lx, -162, 3.6, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  // Bölüm 10: a distant planet, sometimes ringed, tiled sparsely across
  // the starfield so it reads as deep space rather than a tiled pattern.
  function drawPlanet(x, y, scale, color, seed) {
    if (y < -160 || y > CANVAS_H + 160) return;
    if (seededRand(seed + 2) > 0.45) return; // thin out the grid so it reads as sparse, not tiled
    const r = 9 + seededRand(seed + 1) * 7;
    const hasRing = seededRand(seed) > 0.55;
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);

    if (hasRing) {
      ctx.save();
      ctx.rotate(-0.3);
      ctx.globalAlpha = 0.6;
      ctx.strokeStyle = lighten(color, 30);
      ctx.lineWidth = r * 0.22;
      ctx.beginPath();
      ctx.ellipse(0, 0, r * 1.7, r * 0.5, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.globalAlpha = 1;
      ctx.restore();
    }

    const bodyGrad = ctx.createRadialGradient(-r * 0.3, -r * 0.3, r * 0.2, 0, 0, r);
    bodyGrad.addColorStop(0, lighten(color, 25));
    bodyGrad.addColorStop(1, darken(color, 20));
    ctx.fillStyle = bodyGrad;
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = darken(color, 10);
    ctx.globalAlpha = 0.35;
    [[-0.2, 0.3, 0.55], [0.35, -0.2, 0.3]].forEach(([dx, dy, rr]) => {
      ctx.beginPath();
      ctx.arc(dx * r, dy * r, rr * r * 0.4, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1;

    ctx.restore();
  }

  // Soft fixed-position nebula glows behind the starfield.
  function drawNebula() {
    const blobs = [
      { x: CANVAS_W * 0.22, y: 130, r: 170, color: 'rgba(130, 70, 200, 0.22)' },
      { x: CANVAS_W * 0.8, y: 260, r: 150, color: 'rgba(60, 120, 220, 0.18)' },
      { x: CANVAS_W * 0.55, y: 60, r: 120, color: 'rgba(220, 90, 160, 0.14)' },
    ];
    blobs.forEach(b => {
      const g = ctx.createRadialGradient(b.x, b.y, 4, b.x, b.y, b.r);
      g.addColorStop(0, b.color);
      g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  // Three parallax layers of twinkling stars, tiled the same way as the
  // decor layers so they scroll smoothly with the camera.
  function drawStarfield() {
    drawStarLayer(0.15, 70, 11, 0.5, 0.55);
    drawStarLayer(0.32, 54, 23, 0.75, 0.85);
    drawStarLayer(0.55, 40, 37, 1.0, 1.2);
  }

  function drawStarLayer(parallax, spacing, seedOffset, baseAlpha, sizeScale) {
    const scroll = cameraOffset * parallax;
    const rowStart = -1;
    const rowEnd = Math.ceil(CANVAS_H / spacing) + 2;
    const t = performance.now() / 700;
    ctx.fillStyle = '#ffffff';
    for (let i = rowStart; i < rowEnd; i++) {
      const y = i * spacing - (scroll % spacing);
      const rowSeed = (i + seedOffset * 13) * 12.9898;
      for (let x = -20; x < CANVAS_W + 20; x += 38) {
        const starSeed = rowSeed + x * 0.021;
        const tx = x + (seededRand(starSeed) - 0.5) * 30;
        const twinkle = 0.5 + 0.5 * Math.sin(t + starSeed * 7);
        ctx.globalAlpha = baseAlpha * (0.5 + 0.5 * twinkle);
        ctx.beginPath();
        ctx.arc(tx, y, sizeScale * (0.6 + seededRand(starSeed + 1) * 0.8), 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.globalAlpha = 1;
  }

  // Bölüm 11: flowing aurora ribbons drifting across the night sky,
  // screen-space fixed with a slow vertical parallax drift.
  function drawAuroraRibbons() {
    const t = performance.now() / 1800;
    const bands = [
      { baseY: 90, amp: 34, color: 'rgba(90, 230, 170, 0.28)', speed: 1.0 },
      { baseY: 160, amp: 26, color: 'rgba(130, 120, 255, 0.22)', speed: 0.7 },
      { baseY: 230, amp: 30, color: 'rgba(90, 200, 255, 0.18)', speed: 1.3 },
    ];
    bands.forEach((b, bi) => {
      const scrollY = b.baseY - (cameraOffset * 0.1) % 400;
      ctx.beginPath();
      for (let x = -10; x <= CANVAS_W + 10; x += 12) {
        const yy = scrollY + Math.sin(x * 0.012 + t * b.speed + bi) * b.amp;
        if (x === -10) ctx.moveTo(x, yy); else ctx.lineTo(x, yy);
      }
      for (let x = CANVAS_W + 10; x >= -10; x -= 12) {
        const yy = scrollY + 40 + Math.sin(x * 0.012 + t * b.speed + bi) * b.amp;
        ctx.lineTo(x, yy);
      }
      ctx.closePath();
      ctx.fillStyle = b.color;
      ctx.fill();
    });
  }

  // A tall crystalline ice spike jutting up from below — tiled sparsely
  // alongside the aurora so the skyline reads as a frozen peak field.
  function drawIceSpike(x, y, scale, color, seed) {
    if (y < -160 || y > CANVAS_H + 160) return;
    if (seededRand(seed + 2) > 0.5) return; // thin out the grid to avoid a solid wall of spikes
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);

    ctx.fillStyle = 'rgba(0,0,0,0.15)';
    ctx.beginPath();
    ctx.ellipse(0, 46, 20, 6, 0, 0, Math.PI * 2);
    ctx.fill();

    const h = 60 + seededRand(seed + 1) * 30;
    const grad = ctx.createLinearGradient(-14, 0, 14, 0);
    grad.addColorStop(0, lighten(color, 10));
    grad.addColorStop(0.5, '#ffffff');
    grad.addColorStop(1, darken(color, 10));
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(0, -h);
    ctx.lineTo(14, 46);
    ctx.lineTo(-14, 46);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = 'rgba(140,190,220,0.5)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, -h);
    ctx.lineTo(0, 46);
    ctx.stroke();

    ctx.restore();
  }

  // Bölüm 12: a jagged volcanic rock spire with a glowing lava crack seam,
  // tiled sparsely up the slope.
  function drawLavaRock(x, y, scale, color, seed) {
    if (y < -160 || y > CANVAS_H + 160) return;
    if (seededRand(seed + 2) > 0.55) return; // thin out the grid
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);

    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.beginPath();
    ctx.ellipse(0, 46, 22, 7, 0, 0, Math.PI * 2);
    ctx.fill();

    const h = 50 + seededRand(seed + 1) * 34;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(0, -h);
    ctx.lineTo(8, -h * 0.6);
    ctx.lineTo(16, -h * 0.3);
    ctx.lineTo(12, 10);
    ctx.lineTo(18, 46);
    ctx.lineTo(-18, 46);
    ctx.lineTo(-12, 10);
    ctx.lineTo(-16, -h * 0.3);
    ctx.lineTo(-8, -h * 0.6);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = '#ff7a33';
    ctx.lineWidth = 2;
    ctx.globalAlpha = 0.8;
    ctx.beginPath();
    ctx.moveTo(0, -h * 0.8);
    ctx.lineTo(-4, -h * 0.3);
    ctx.lineTo(3, 0);
    ctx.lineTo(-2, 30);
    ctx.stroke();
    ctx.globalAlpha = 1;

    ctx.restore();
  }

  // Bölüm 12: a glowing lava pool at the base of the crater, drawn once
  // around the trampoline (same pattern as the baseball diamond).
  function drawVolcanoCrater() {
    const y = GROUND_Y + cameraOffset;
    if (y > CANVAS_H + 40 || y < -260) return;
    ctx.save();
    ctx.translate(CENTER_X, y - 20);

    const glow = ctx.createRadialGradient(0, 10, 10, 0, 10, 180);
    glow.addColorStop(0, 'rgba(255,140,40,0.5)');
    glow.addColorStop(1, 'rgba(255,140,40,0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.ellipse(0, 10, 180, 90, 0, 0, Math.PI * 2);
    ctx.fill();

    const lavaGrad = ctx.createRadialGradient(0, 20, 6, 0, 20, 110);
    lavaGrad.addColorStop(0, '#fff3b0');
    lavaGrad.addColorStop(0.4, '#ff9f2e');
    lavaGrad.addColorStop(1, '#8a2000');
    ctx.fillStyle = lavaGrad;
    ctx.beginPath();
    ctx.ellipse(0, 24, 110, 34, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = 'rgba(40,20,14,0.9)';
    ctx.lineWidth = 10;
    ctx.beginPath();
    ctx.ellipse(0, 20, 130, 42, 0, 0, Math.PI * 2);
    ctx.stroke();

    ctx.restore();
  }

  // Bölüm 13: a swaying coral/seaweed frond cluster, tiled sparsely along
  // the ascent through the water column.
  function drawCoral(x, y, scale, color, seed) {
    if (y < -160 || y > CANVAS_H + 160) return;
    if (seededRand(seed + 2) > 0.5) return; // thin out the grid
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);

    ctx.fillStyle = 'rgba(0,0,0,0.12)';
    ctx.beginPath();
    ctx.ellipse(0, 46, 20, 6, 0, 0, Math.PI * 2);
    ctx.fill();

    const sway = Math.sin(performance.now() / 1400 + seed) * 8;
    for (let i = 0; i < 3; i++) {
      const bx = (i - 1) * 10;
      const h = 50 + seededRand(seed + i) * 30;
      ctx.strokeStyle = i % 2 === 0 ? lighten(color, 15) : color;
      ctx.lineWidth = 7;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(bx, 46);
      ctx.quadraticCurveTo(bx + sway * 0.6, 46 - h * 0.5, bx + sway, 46 - h);
      ctx.stroke();
    }

    ctx.restore();
  }

  // Three parallax layers of rising bubbles, drifting upward over time
  // independent of the camera's own vertical scroll.
  function drawBubbles() {
    drawBubbleLayer(0.25, 130, 5, 0.35, 1.0);
    drawBubbleLayer(0.45, 100, 17, 0.5, 1.4);
    drawBubbleLayer(0.7, 80, 29, 0.65, 1.8);
  }

  function drawBubbleLayer(parallax, spacing, seedOffset, baseAlpha, sizeScale) {
    const drift = (performance.now() / 18) % spacing;
    const scroll = cameraOffset * parallax + drift;
    const rowStart = -1;
    const rowEnd = Math.ceil(CANVAS_H / spacing) + 2;
    ctx.strokeStyle = 'rgba(255,255,255,0.8)';
    ctx.lineWidth = 1;
    for (let i = rowStart; i < rowEnd; i++) {
      const y = i * spacing - (scroll % spacing);
      const rowSeed = (i + seedOffset * 13) * 12.9898;
      for (let x = -20; x < CANVAS_W + 20; x += 46) {
        const bSeed = rowSeed + x * 0.019;
        const tx = x + (seededRand(bSeed) - 0.5) * 34;
        const r = sizeScale * (1.2 + seededRand(bSeed + 1) * 2.2);
        ctx.globalAlpha = baseAlpha;
        ctx.beginPath();
        ctx.arc(tx, y, r, 0, Math.PI * 2);
        ctx.stroke();
      }
    }
    ctx.globalAlpha = 1;
  }

  // Bölüm 14: a glowing crystal cluster jutting from the cave wall, tiled
  // sparsely alongside the sparkle dust.
  function drawCrystalCluster(x, y, scale, color, seed) {
    if (y < -160 || y > CANVAS_H + 160) return;
    if (seededRand(seed + 2) > 0.5) return; // thin out the grid
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);

    ctx.fillStyle = 'rgba(0,0,0,0.2)';
    ctx.beginPath();
    ctx.ellipse(0, 46, 18, 6, 0, 0, Math.PI * 2);
    ctx.fill();

    const h = 46 + seededRand(seed + 1) * 28;
    const glow = ctx.createRadialGradient(0, -h * 0.4, 2, 0, -h * 0.4, 50);
    glow.addColorStop(0, 'rgba(255,255,255,0.35)');
    glow.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(0, -h * 0.4, 50, 0, Math.PI * 2);
    ctx.fill();

    const grad = ctx.createLinearGradient(-12, 0, 12, 0);
    grad.addColorStop(0, lighten(color, 30));
    grad.addColorStop(0.5, '#ffffff');
    grad.addColorStop(1, darken(color, 10));
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(0, -h);
    ctx.lineTo(11, -h * 0.5);
    ctx.lineTo(8, 46);
    ctx.lineTo(-8, 46);
    ctx.lineTo(-11, -h * 0.5);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = 'rgba(255,255,255,0.5)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, -h);
    ctx.lineTo(0, 46);
    ctx.stroke();

    ctx.restore();
  }

  // Bölüm 15: a warm floating paper lantern, tiled sparsely across the
  // night sky with a soft glow (no ground shadow — it hangs freely).
  function drawLantern(x, y, scale, color, seed) {
    if (y < -160 || y > CANVAS_H + 160) return;
    if (seededRand(seed + 2) > 0.5) return; // thin out the grid
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);

    const glow = ctx.createRadialGradient(0, 0, 2, 0, 0, 40);
    glow.addColorStop(0, 'rgba(255,200,120,0.4)');
    glow.addColorStop(1, 'rgba(255,200,120,0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(0, 0, 40, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = 'rgba(0,0,0,0.3)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(0, -36);
    ctx.lineTo(0, -20);
    ctx.stroke();

    const grad = ctx.createLinearGradient(-14, 0, 14, 0);
    grad.addColorStop(0, darken(color, 10));
    grad.addColorStop(0.5, lighten(color, 20));
    grad.addColorStop(1, darken(color, 10));
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(-6, -20);
    ctx.quadraticCurveTo(-16, -4, -6, 20);
    ctx.lineTo(6, 20);
    ctx.quadraticCurveTo(16, -4, 6, -20);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#3a2416';
    ctx.beginPath();
    ctx.ellipse(0, -20, 7, 2.5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(0, 20, 7, 2.5, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = 'rgba(0,0,0,0.25)';
    ctx.lineWidth = 1;
    [-7, 0, 7].forEach(dx => {
      ctx.beginPath();
      ctx.moveTo(dx * 0.9, -19);
      ctx.quadraticCurveTo(dx * 2.1, -4, dx * 0.9, 19);
      ctx.stroke();
    });

    ctx.restore();
  }

  // Bölüm 16: a dark gothic castle spire with a glowing window, tiled
  // sparsely across the haunted skyline.
  function drawCastleSpire(x, y, scale, color, seed) {
    if (y < -160 || y > CANVAS_H + 160) return;
    if (seededRand(seed + 2) > 0.5) return; // thin out the grid
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);

    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.beginPath();
    ctx.ellipse(0, 46, 16, 5, 0, 0, Math.PI * 2);
    ctx.fill();

    const h = 60 + seededRand(seed + 1) * 30;
    ctx.fillStyle = color;
    ctx.fillRect(-10, -h * 0.4, 20, h * 0.4 + 46);
    ctx.beginPath();
    ctx.moveTo(0, -h);
    ctx.lineTo(13, -h * 0.4);
    ctx.lineTo(-13, -h * 0.4);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = 'rgba(140,255,170,0.85)';
    ctx.beginPath();
    ctx.arc(0, -h * 0.15, 3.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  // Bölüm 17: a striped candy cane jutting up from the pastel ground,
  // tiled sparsely alongside the sunlit sky.
  function drawCandyDecor(x, y, scale, color, seed) {
    if (y < -160 || y > CANVAS_H + 160) return;
    if (seededRand(seed + 2) > 0.5) return; // thin out the grid
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);

    ctx.fillStyle = 'rgba(0,0,0,0.12)';
    ctx.beginPath();
    ctx.ellipse(0, 46, 14, 5, 0, 0, Math.PI * 2);
    ctx.fill();

    const h = 60 + seededRand(seed + 1) * 26;
    ctx.lineWidth = 9;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(0, 46);
    ctx.quadraticCurveTo(0, 46 - h * 0.7, 10, 46 - h);
    ctx.stroke();

    ctx.strokeStyle = color;
    ctx.setLineDash([8, 8]);
    ctx.beginPath();
    ctx.moveTo(0, 46);
    ctx.quadraticCurveTo(0, 46 - h * 0.7, 10, 46 - h);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.restore();
  }

  // Bölüm 18: a weathered stone pillar wrapped in jungle vines, tiled
  // sparsely among the ruins.
  function drawTemplePillar(x, y, scale, color, seed) {
    if (y < -160 || y > CANVAS_H + 160) return;
    if (seededRand(seed + 2) > 0.5) return; // thin out the grid
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);

    ctx.fillStyle = 'rgba(0,0,0,0.2)';
    ctx.beginPath();
    ctx.ellipse(0, 46, 18, 6, 0, 0, Math.PI * 2);
    ctx.fill();

    const h = 60 + seededRand(seed + 1) * 26;
    ctx.fillStyle = '#9a8a6a';
    ctx.fillRect(-11, -h, 22, h + 46);
    ctx.fillRect(-14, -h, 28, 8);
    ctx.fillRect(-14, 38, 28, 8);

    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    ctx.beginPath();
    for (let t = -h; t < 46; t += 10) {
      const vx = Math.sin(t * 0.25 + seed) * 10;
      if (t === -h) ctx.moveTo(vx, t); else ctx.lineTo(vx, t);
    }
    ctx.stroke();

    ctx.restore();
  }

  // Bölüm 19's decor: a small floating island with a cloud-puff base and a
  // tiny pastel turret on top, drifting through Bulut Krallığı's sky.
  function drawCloudTurret(x, y, scale, color, seed) {
    if (y < -160 || y > CANVAS_H + 160) return;
    if (seededRand(seed + 2) > 0.55) return; // thin out the grid
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);

    ctx.fillStyle = '#ffffff';
    ctx.globalAlpha = 0.95;
    [[-16, 6, 14], [0, -2, 18], [16, 6, 14], [0, 12, 16]].forEach(([dx, dy, r]) => {
      ctx.beginPath();
      ctx.arc(dx, dy, r, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1;

    ctx.fillStyle = color;
    ctx.fillRect(-6, -28, 12, 20);
    ctx.beginPath();
    ctx.moveTo(-8, -28);
    ctx.lineTo(0, -40);
    ctx.lineTo(8, -28);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = 'rgba(255,255,255,0.8)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, -40);
    ctx.lineTo(0, -48);
    ctx.stroke();
    ctx.fillStyle = lighten(color, 40);
    ctx.beginPath();
    ctx.moveTo(0, -48);
    ctx.lineTo(7, -44);
    ctx.lineTo(0, -40);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  }

  // Bölüm 20's decor: a giant stylized flower, petals tinted per depth layer.
  function drawGiantFlower(x, y, scale, color, seed) {
    if (y < -160 || y > CANVAS_H + 160) return;
    if (seededRand(seed + 2) > 0.55) return;
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);

    ctx.fillStyle = 'rgba(0,0,0,0.15)';
    ctx.beginPath();
    ctx.ellipse(0, 46, 14, 5, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#2f7a3a';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(0, 46);
    ctx.quadraticCurveTo(6, 10, 0, -6);
    ctx.stroke();

    ctx.fillStyle = color;
    const petals = 6;
    for (let i = 0; i < petals; i++) {
      const a = (i / petals) * Math.PI * 2 + seed;
      ctx.save();
      ctx.translate(Math.cos(a) * 11, -6 + Math.sin(a) * 11);
      ctx.rotate(a);
      ctx.beginPath();
      ctx.ellipse(0, 0, 9, 5.5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    ctx.fillStyle = '#ffd24a';
    ctx.beginPath();
    ctx.arc(0, -6, 7, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  // Bölüm 21's decor: a leaning palm tree, fronds tinted per depth layer.
  function drawPirateDecor(x, y, scale, color, seed) {
    if (y < -160 || y > CANVAS_H + 160) return;
    if (seededRand(seed + 2) > 0.55) return;
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);

    ctx.fillStyle = 'rgba(0,0,0,0.18)';
    ctx.beginPath();
    ctx.ellipse(4, 46, 16, 6, 0, 0, Math.PI * 2);
    ctx.fill();

    const lean = Math.sin(seed) * 10;
    ctx.strokeStyle = '#8a6a3a';
    ctx.lineWidth = 7;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(0, 46);
    ctx.quadraticCurveTo(lean * 0.6, 0, lean, -40);
    ctx.stroke();

    ctx.fillStyle = color;
    for (let i = 0; i < 5; i++) {
      const a = -Math.PI / 2 + (i - 2) * 0.5;
      ctx.save();
      ctx.translate(lean, -40);
      ctx.rotate(a);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.quadraticCurveTo(14, -4, 26, 4);
      ctx.quadraticCurveTo(14, 2, 0, 0);
      ctx.fill();
      ctx.restore();
    }
    ctx.restore();
  }

  function lighten(hex, amt) { return shade(hex, amt); }
  function darken(hex, amt) { return shade(hex, -amt); }
  function shade(hex, amt) {
    const c = hex.replace('#', '');
    const num = parseInt(c.length === 3 ? c.split('').map(ch => ch + ch).join('') : c, 16);
    let r = (num >> 16) + amt;
    let g = ((num >> 8) & 0xff) + amt;
    let b = (num & 0xff) + amt;
    r = Math.max(0, Math.min(255, r));
    g = Math.max(0, Math.min(255, g));
    b = Math.max(0, Math.min(255, b));
    return `rgb(${r}, ${g}, ${b})`;
  }

  // ---------- Drawing: ground ----------
  function drawGround(theme) {
    const y = GROUND_Y + cameraOffset;
    if (y > CANVAS_H + 40 || y < -40) return;
    const g = ctx.createLinearGradient(0, y, 0, CANVAS_H);
    g.addColorStop(0, theme.groundFar);
    g.addColorStop(1, theme.groundNear);
    ctx.fillStyle = g;
    ctx.fillRect(0, y, CANVAS_W, CANVAS_H - y + 200);

    ctx.fillStyle = theme.groundSpeckle;
    for (let i = 0; i < 26; i++) {
      const sx = (i * 53 + 17) % CANVAS_W;
      const sy = y + 10 + ((i * 29) % Math.max(20, CANVAS_H - y));
      const r = 6 + (i % 4) * 2;
      ctx.beginPath();
      ctx.ellipse(sx, sy, r, r * 0.4, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.fillStyle = theme.groundFar;
    ctx.fillRect(0, y, CANVAS_W, 5);
  }

  // Bölüm 9: the infield dirt diamond, base paths and home plate, drawn
  // once around the trampoline so it reads as "set up on the pitcher's
  // mound of a giant stadium" rather than tiled like the forest/cacti.
  function drawBaseballDiamond() {
    const y = GROUND_Y + cameraOffset;
    if (y > CANVAS_H + 40 || y < -260) return;
    ctx.save();
    ctx.translate(CENTER_X, y - 36);

    const dirtGrad = ctx.createRadialGradient(0, -20, 10, 0, -20, 170);
    dirtGrad.addColorStop(0, '#c48a4f');
    dirtGrad.addColorStop(1, '#a3692f');
    ctx.fillStyle = dirtGrad;
    ctx.beginPath();
    ctx.moveTo(0, 42);
    ctx.lineTo(-150, -108);
    ctx.quadraticCurveTo(0, -205, 150, -108);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = 'rgba(255,255,255,0.85)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, 42); ctx.lineTo(-95, -55);
    ctx.moveTo(0, 42); ctx.lineTo(95, -55);
    ctx.stroke();

    [[-95, -55], [0, -140], [95, -55]].forEach(([bx, by]) => {
      ctx.save();
      ctx.translate(bx, by);
      ctx.rotate(Math.PI / 4);
      ctx.fillStyle = '#fff';
      ctx.fillRect(-7, -7, 14, 14);
      ctx.restore();
    });

    ctx.fillStyle = '#b87b42';
    ctx.beginPath();
    ctx.ellipse(0, -46, 20, 8, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.ellipse(0, -46, 6, 2.6, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.moveTo(-8, 40); ctx.lineTo(8, 40); ctx.lineTo(8, 48); ctx.lineTo(0, 56); ctx.lineTo(-8, 48);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  }

  // ---------- Drawing: trampoline ----------
  function drawTrampoline(tierGroup) {
    const y = TRAMPOLINE_Y + cameraOffset;
    if (y > CANVAS_H + 60 || y < -60) return;
    const squashAmt = player.squash;
    const rx = 62 + squashAmt * 14;
    const ry = 16 - squashAmt * 6;

    const matSets = [
      ['#3a86ff', '#1b4bb0'],
      ['#d7dee8', '#8a94a3'],
      ['#ffe28a', '#c98d00'],
    ];
    const [matLight, matDark] = matSets[tierGroup] || matSets[0];

    ctx.save();
    ctx.translate(CENTER_X, y);

    ctx.fillStyle = 'rgba(0,0,0,0.28)';
    ctx.beginPath();
    ctx.ellipse(0, 30, rx * 0.9, 12, 0, 0, Math.PI * 2);
    ctx.fill();

    const legGrad = ctx.createLinearGradient(-4, 0, 4, 0);
    legGrad.addColorStop(0, '#4a4a4a');
    legGrad.addColorStop(1, '#1a1a1a');
    ctx.strokeStyle = legGrad;
    ctx.lineWidth = 5;
    [-40, 40].forEach(dx => {
      ctx.beginPath();
      ctx.moveTo(dx * 0.9, 4);
      ctx.lineTo(dx * 1.3, 34);
      ctx.stroke();
    });

    ctx.beginPath();
    ctx.ellipse(0, 0, rx + 8, ry + 8, 0, 0, Math.PI * 2);
    ctx.strokeStyle = '#1f1f1f';
    ctx.lineWidth = 6;
    ctx.stroke();

    ctx.strokeStyle = tierGroup >= 2 ? '#f2d98a' : '#8a8f98';
    ctx.lineWidth = 2;
    const springCount = 14;
    for (let i = 0; i < springCount; i++) {
      const a = (i / springCount) * Math.PI * 2;
      const x1 = Math.cos(a) * (rx + 7);
      const y1 = Math.sin(a) * (ry + 7);
      const x2 = Math.cos(a) * (rx - 4);
      const y2 = Math.sin(a) * (ry - 4);
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    }

    const matGrad = ctx.createRadialGradient(-rx * 0.25, -ry * 0.5, 4, 0, 0, rx * 1.1);
    matGrad.addColorStop(0, matLight);
    matGrad.addColorStop(1, matDark);
    ctx.beginPath();
    ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
    ctx.fillStyle = matGrad;
    ctx.fill();

    // weave lines for fabric texture
    ctx.strokeStyle = 'rgba(255,255,255,0.18)';
    ctx.lineWidth = 1;
    for (let i = -2; i <= 2; i++) {
      ctx.beginPath();
      ctx.moveTo(-rx * 0.85, i * (ry / 3.2));
      ctx.lineTo(rx * 0.85, i * (ry / 3.2));
      ctx.stroke();
    }

    ctx.restore();
  }

  // ---------- Drawing: character ----------
  function drawCharacter(theme) {
    const y = player.y + cameraOffset;

    // grounding shadow on the trampoline mat, fades with height
    const dist = Math.max(0, TRAMPOLINE_Y - player.y);
    const shadowAlpha = Math.max(0, 0.35 - dist / 500);
    if (shadowAlpha > 0.02) {
      ctx.save();
      ctx.globalAlpha = shadowAlpha;
      ctx.fillStyle = '#000814';
      ctx.beginPath();
      ctx.ellipse(CENTER_X, TRAMPOLINE_Y + cameraOffset, 26, 8, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    const squash = player.squash;
    const scaleX = 1 + squash * 0.18;
    const scaleY = 1 - squash * 0.22;

    ctx.save();
    ctx.translate(CENTER_X, y);
    ctx.scale(scaleX, scaleY);

    // legs
    const legGrad = ctx.createLinearGradient(0, 10, 0, 30);
    legGrad.addColorStop(0, '#274a8f');
    legGrad.addColorStop(1, '#152c5c');
    ctx.fillStyle = legGrad;
    ctx.beginPath();
    ctx.roundRect(-14, 10, 10, 20, 5);
    ctx.roundRect(4, 10, 10, 20, 5);
    ctx.fill();

    // body (jumpsuit) with highlight stripe for volume
    const bodyGrad = ctx.createLinearGradient(-16, -18, 16, 16);
    bodyGrad.addColorStop(0, '#4d8fe8');
    bodyGrad.addColorStop(0.55, '#3a7bd5');
    bodyGrad.addColorStop(1, '#1c4a92');
    ctx.fillStyle = bodyGrad;
    ctx.beginPath();
    ctx.roundRect(-16, -16, 32, 32, 14);
    ctx.fill();

    // theme accent collar stripe
    ctx.fillStyle = theme.accent;
    ctx.beginPath();
    ctx.roundRect(-16, -16, 32, 6, 8);
    ctx.fill();

    // arms
    const armGrad = ctx.createLinearGradient(0, -10, 0, 10);
    armGrad.addColorStop(0, '#2f5fb8');
    armGrad.addColorStop(1, '#1c4a92');
    ctx.fillStyle = armGrad;
    ctx.beginPath();
    ctx.roundRect(-24, -10, 9, 20, 4);
    ctx.roundRect(15, -10, 9, 20, 4);
    ctx.fill();

    // head with rounded shading
    const headGrad = ctx.createRadialGradient(-5, -31, 3, 0, -26, 17);
    headGrad.addColorStop(0, '#ffdcb0');
    headGrad.addColorStop(1, '#e0a877');
    ctx.fillStyle = headGrad;
    ctx.beginPath();
    ctx.arc(0, -26, 15, 0, Math.PI * 2);
    ctx.fill();

    const maskOff = player.maskOff;

    ctx.fillStyle = '#20140c';
    ctx.beginPath();
    ctx.arc(-5, -27, 1.8, 0, Math.PI * 2);
    ctx.arc(5, -27, 1.8, 0, Math.PI * 2);
    ctx.fill();

    if (maskOff > 0.15) {
      ctx.strokeStyle = '#8a4a2c';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.arc(0, -21, 5, 0.15 * Math.PI, 0.85 * Math.PI);
      ctx.stroke();
      // rosy cheeks once unmasked
      ctx.fillStyle = `rgba(230,110,90,${0.25 * maskOff})`;
      ctx.beginPath();
      ctx.arc(-9, -22, 3, 0, Math.PI * 2);
      ctx.arc(9, -22, 3, 0, Math.PI * 2);
      ctx.fill();
    }

    if (maskOff < 1) {
      ctx.save();
      ctx.globalAlpha = 1 - maskOff;
      ctx.translate(0, -maskOff * 30);
      const maskGrad = ctx.createLinearGradient(0, -34, 0, -22);
      maskGrad.addColorStop(0, '#2a2a2a');
      maskGrad.addColorStop(1, '#0e0e0e');
      ctx.fillStyle = maskGrad;
      ctx.beginPath();
      ctx.roundRect(-15.5, -31, 31, 11, 5);
      ctx.fill();
      ctx.fillStyle = '#151515';
      ctx.beginPath();
      ctx.ellipse(-5, -27, 3.4, 2.6, 0, 0, Math.PI * 2);
      ctx.ellipse(5, -27, 3.4, 2.6, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    if (maskOff > 0.6) {
      ctx.globalAlpha = Math.min(1, (maskOff - 0.6) / 0.4);
      ctx.fillStyle = '#3a2417';
      ctx.beginPath();
      ctx.arc(0, -39, 8, Math.PI, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    }

    ctx.restore();
  }

  // A checkered finish-line ribbon with two pennant flags, drawn at every
  // level's final (top) coin height — marks the actual summit of the course.
  function drawFinishLine(theme) {
    const level = currentLevel();
    const topHeight = level.coinHeights[level.coinHeights.length - 1];
    const y = TRAMPOLINE_Y - topHeight + cameraOffset;
    if (y > CANVAS_H + 80 || y < -80) return;

    const stripH = 16;
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, y - stripH / 2, CANVAS_W, stripH);
    ctx.clip();
    const squareSize = 14;
    const cols = Math.ceil(CANVAS_W / squareSize) + 1;
    for (let col = 0; col < cols; col++) {
      for (let row = 0; row < 2; row++) {
        const isDark = (row + col) % 2 === 0;
        ctx.fillStyle = isDark ? '#17181c' : '#f4f4f4';
        ctx.fillRect(col * squareSize, y - stripH / 2 + row * (stripH / 2), squareSize, stripH / 2);
      }
    }
    ctx.restore();
    ctx.strokeStyle = 'rgba(0,0,0,0.35)';
    ctx.lineWidth = 1;
    ctx.strokeRect(0, y - stripH / 2, CANVAS_W, stripH);

    [16, CANVAS_W - 16].forEach((px, i) => {
      ctx.strokeStyle = '#9a9a9a';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(px, y - stripH / 2 - 28);
      ctx.lineTo(px, y + 48);
      ctx.stroke();

      const dir = i === 0 ? 1 : -1;
      ctx.fillStyle = theme.accent;
      ctx.beginPath();
      ctx.moveTo(px, y - stripH / 2 - 26);
      ctx.lineTo(px + dir * 20, y - stripH / 2 - 16);
      ctx.lineTo(px, y - stripH / 2 - 6);
      ctx.closePath();
      ctx.fill();
    });
  }

  // ---------- Drawing: coins ----------
  function drawCoins() {
    coins.forEach(coin => {
      if (coin.collected) return;
      const y = coin.worldY + cameraOffset;
      if (y < -40 || y > CANVAS_H + 40) return;
      coin.wobble += 0.06;
      const bob = Math.sin(coin.wobble) * 5;

      ctx.save();
      ctx.globalAlpha = 0.5 + 0.3 * Math.sin(coin.wobble * 1.5);
      ctx.fillStyle = coin.ballType ? '#ffffff' : coin.isComet ? '#9fd3ff' : coin.isSnowflake ? '#e8fbff' : coin.isEmber ? '#ff8a3d' : coin.isPearl ? '#eaf6ff' : coin.isCrystal ? '#c060e0' : coin.isLantern ? '#ffcf6a' : coin.isGhost ? '#9fffc0' : coin.isCandy ? '#ff6b9d' : coin.isRelic ? '#e0b84a' : coin.isRainbow ? '#ff9ad6' : coin.isButterfly ? '#9b6fff' : coin.isTreasure ? '#ffd24a' : '#fff6d0';
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha *= 0.15;
      ctx.beginPath();
      ctx.arc(CENTER_X, y + bob, 22, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      ctx.save();
      ctx.translate(CENTER_X, y + bob);
      const spin = Math.sin(coin.wobble * 0.7);

      if (coin.isComet) {
        drawComet();
      } else if (coin.isSnowflake) {
        drawSnowflake();
      } else if (coin.isEmber) {
        drawEmber();
      } else if (coin.isPearl) {
        drawPearl();
      } else if (coin.isCrystal) {
        drawCrystalGem();
      } else if (coin.isLantern) {
        drawLanternPickup();
      } else if (coin.isGhost) {
        drawGhost();
      } else if (coin.isCandy) {
        drawCandyPickup();
      } else if (coin.isRelic) {
        drawRelic();
      } else if (coin.isRainbow) {
        drawRainbowPickup();
      } else if (coin.isButterfly) {
        drawButterfly(spin);
      } else if (coin.isTreasure) {
        drawTreasure();
      } else {
        ctx.scale(Math.max(0.25, Math.abs(spin)), 1);
        if (coin.ballType) {
          drawSportBall(coin.ballType);
        } else {
          const grad = ctx.createRadialGradient(-5, -5, 2, 0, 0, 16);
          grad.addColorStop(0, '#fff8d6');
          grad.addColorStop(0.45, '#ffd24a');
          grad.addColorStop(1, '#a86e00');
          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.arc(0, 0, 16, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = '#8a5a00';
          ctx.lineWidth = 2;
          ctx.stroke();

          ctx.strokeStyle = 'rgba(255,255,255,0.5)';
          ctx.lineWidth = 1.4;
          ctx.beginPath();
          ctx.arc(0, 0, 10, Math.PI * 1.1, Math.PI * 1.7);
          ctx.stroke();
        }
      }
      ctx.restore();
    });
  }

  // Bölüm 10's collectible: a glowing comet with a trailing icy tail.
  // Assumes the context is already translated to the comet's center.
  function drawComet() {
    ctx.save();
    ctx.rotate(-0.55);
    const tailGrad = ctx.createLinearGradient(0, 0, 0, 36);
    tailGrad.addColorStop(0, 'rgba(255,255,255,0.9)');
    tailGrad.addColorStop(0.55, 'rgba(150,200,255,0.35)');
    tailGrad.addColorStop(1, 'rgba(150,200,255,0)');
    ctx.fillStyle = tailGrad;
    ctx.beginPath();
    ctx.moveTo(-4, 0);
    ctx.quadraticCurveTo(-1.5, 18, -3, 36);
    ctx.quadraticCurveTo(0, 20, 3, 36);
    ctx.quadraticCurveTo(1.5, 18, 4, 0);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    const headGrad = ctx.createRadialGradient(-3, -3, 1, 0, 0, 13);
    headGrad.addColorStop(0, '#ffffff');
    headGrad.addColorStop(0.5, '#bfe0ff');
    headGrad.addColorStop(1, '#5a8fd6');
    ctx.fillStyle = headGrad;
    ctx.beginPath();
    ctx.arc(0, 0, 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.6)';
    ctx.lineWidth = 1.3;
    ctx.stroke();
  }

  // Bölüm 11's collectible: a glowing six-pointed snowflake in place of a
  // gold coin. Assumes the context is already translated to its center.
  function drawSnowflake() {
    ctx.save();
    ctx.rotate(performance.now() / 2000);
    ctx.strokeStyle = '#eafdff';
    ctx.lineWidth = 2.4;
    ctx.lineCap = 'round';
    for (let i = 0; i < 6; i++) {
      ctx.save();
      ctx.rotate((Math.PI / 3) * i);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(0, -13);
      ctx.moveTo(0, -5);
      ctx.lineTo(-4, -8);
      ctx.moveTo(0, -5);
      ctx.lineTo(4, -8);
      ctx.moveTo(0, -9);
      ctx.lineTo(-3.5, -11.5);
      ctx.moveTo(0, -9);
      ctx.lineTo(3.5, -11.5);
      ctx.stroke();
      ctx.restore();
    }
    ctx.restore();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(0, 0, 3, 0, Math.PI * 2);
    ctx.fill();
  }

  // Bölüm 12's collectible: a glowing ember with small flickering flame
  // tips. Assumes the context is already translated to its center.
  function drawEmber() {
    const flicker = 0.85 + 0.15 * Math.sin(performance.now() / 110);
    ctx.save();
    ctx.scale(flicker, flicker);
    const grad = ctx.createRadialGradient(-4, -4, 1, 0, 0, 14);
    grad.addColorStop(0, '#fff3c0');
    grad.addColorStop(0.4, '#ffb347');
    grad.addColorStop(0.75, '#ff5a26');
    grad.addColorStop(1, '#8a1f05');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(0, 0, 13, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = 'rgba(255, 220, 140, 0.8)';
    [[-1, -14], [5, -11], [-6, -10]].forEach(([fx, fy], i) => {
      ctx.save();
      ctx.translate(fx, fy);
      ctx.scale(1, 0.8 + 0.3 * Math.sin(performance.now() / 90 + i));
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.quadraticCurveTo(3, -5, 0, -9);
      ctx.quadraticCurveTo(-3, -5, 0, 0);
      ctx.fill();
      ctx.restore();
    });
    ctx.restore();
  }

  // Bölüm 13's collectible: an iridescent pearl in a small open half-shell.
  // Assumes the context is already translated to its center.
  function drawPearl() {
    ctx.fillStyle = '#c99a5a';
    ctx.beginPath();
    ctx.ellipse(0, 7, 14, 7, 0, 0, Math.PI);
    ctx.fill();
    ctx.strokeStyle = '#8a6a3a';
    ctx.lineWidth = 1;
    for (let i = -2; i <= 2; i++) {
      ctx.beginPath();
      ctx.moveTo(i * 5, 1);
      ctx.lineTo(i * 3, 7);
      ctx.stroke();
    }

    const grad = ctx.createRadialGradient(-4, -4, 1, 0, 0, 11);
    grad.addColorStop(0, '#ffffff');
    grad.addColorStop(0.55, '#eaf6ff');
    grad.addColorStop(0.85, '#c9ddea');
    grad.addColorStop(1, '#9fb8cc');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(0, -1, 10.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    ctx.beginPath();
    ctx.ellipse(-4, -5, 3, 2, -0.5, 0, Math.PI * 2);
    ctx.fill();
  }

  // Bölüm 14's collectible: a faceted crystal gem in place of a gold coin.
  // Assumes the context is already translated to its center.
  function drawCrystalGem() {
    const grad = ctx.createLinearGradient(-10, -13, 10, 12);
    grad.addColorStop(0, '#ffffff');
    grad.addColorStop(0.4, '#e9b8ff');
    grad.addColorStop(1, '#8a3fc0');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(0, -13);
    ctx.lineTo(9, -3);
    ctx.lineTo(6, 12);
    ctx.lineTo(-6, 12);
    ctx.lineTo(-9, -3);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.7)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(0, -13); ctx.lineTo(0, 12);
    ctx.moveTo(-9, -3); ctx.lineTo(9, -3);
    ctx.stroke();
  }

  // Bölüm 15's collectible: a small glowing paper lantern in place of a
  // gold coin. Assumes the context is already translated to its center.
  function drawLanternPickup() {
    const glow = ctx.createRadialGradient(0, 0, 1, 0, 0, 16);
    glow.addColorStop(0, 'rgba(255,220,150,0.9)');
    glow.addColorStop(1, 'rgba(255,220,150,0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(0, 0, 16, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = 'rgba(0,0,0,0.3)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, -13);
    ctx.lineTo(0, -9);
    ctx.stroke();

    const grad = ctx.createLinearGradient(-8, 0, 8, 0);
    grad.addColorStop(0, '#c0392b');
    grad.addColorStop(0.5, '#ffcf6a');
    grad.addColorStop(1, '#c0392b');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(-4, -9);
    ctx.quadraticCurveTo(-9, 0, -4, 10);
    ctx.lineTo(4, 10);
    ctx.quadraticCurveTo(9, 0, 4, -9);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#5a2a16';
    ctx.beginPath();
    ctx.ellipse(0, -9, 4, 1.6, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(0, 10, 4, 1.6, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  // Bölüm 16's collectible: a small friendly ghost light. Assumes the
  // context is already translated to its center.
  function drawGhost() {
    const bob = Math.sin(performance.now() / 300) * 1.5;
    const glow = ctx.createRadialGradient(0, bob, 1, 0, bob, 16);
    glow.addColorStop(0, 'rgba(180,255,200,0.6)');
    glow.addColorStop(1, 'rgba(180,255,200,0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(0, bob, 16, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = 'rgba(230,255,240,0.95)';
    ctx.beginPath();
    ctx.arc(0, bob - 2, 9, Math.PI, 0);
    ctx.lineTo(9, bob + 9);
    for (let i = 0; i < 3; i++) {
      const wx = 9 - i * 6;
      ctx.quadraticCurveTo(wx - 3, bob + 13, wx - 6, bob + 9);
    }
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#2a2a2a';
    ctx.beginPath(); ctx.arc(-3, bob - 2, 1.4, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(3, bob - 2, 1.4, 0, Math.PI * 2); ctx.fill();
  }

  // Bölüm 17's collectible: a swirly lollipop. Assumes the context is
  // already translated to its center.
  function drawCandyPickup() {
    ctx.strokeStyle = 'rgba(0,0,0,0.25)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, 9);
    ctx.lineTo(0, 16);
    ctx.stroke();

    const grad = ctx.createRadialGradient(-3, -3, 1, 0, 0, 11);
    grad.addColorStop(0, '#ffffff');
    grad.addColorStop(1, '#ff6b9d');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(0, 0, 11, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#ff2f7e';
    ctx.lineWidth = 2;
    ctx.save();
    ctx.beginPath();
    ctx.arc(0, 0, 11, 0, Math.PI * 2);
    ctx.clip();
    for (let i = -3; i <= 3; i++) {
      ctx.beginPath();
      ctx.arc(i * 5, 0, 11, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();
  }

  // Bölüm 18's collectible: a small golden idol mask. Assumes the context
  // is already translated to its center.
  function drawRelic() {
    const grad = ctx.createLinearGradient(-10, -12, 10, 12);
    grad.addColorStop(0, '#fff3c0');
    grad.addColorStop(0.5, '#e0b84a');
    grad.addColorStop(1, '#8a6a1a');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(0, -12);
    ctx.quadraticCurveTo(10, -10, 9, 2);
    ctx.quadraticCurveTo(8, 12, 0, 12);
    ctx.quadraticCurveTo(-8, 12, -9, 2);
    ctx.quadraticCurveTo(-10, -10, 0, -12);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#6a4a0a';
    ctx.lineWidth = 1.2;
    ctx.stroke();

    ctx.fillStyle = '#6a4a0a';
    ctx.beginPath(); ctx.arc(-4, -1, 1.6, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(4, -1, 1.6, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath();
    ctx.moveTo(-3, 6);
    ctx.quadraticCurveTo(0, 9, 3, 6);
    ctx.stroke();
  }

  // Bölüm 19's collectible: a small floating rainbow arc with a puff of
  // cloud at each end. Assumes the context is already translated to center.
  function drawRainbowPickup() {
    ctx.save();
    ctx.fillStyle = '#fff';
    ctx.globalAlpha = 0.9;
    ctx.beginPath(); ctx.arc(-11, 5, 5.5, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(11, 5, 5.5, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
    const bands = ['#ff5c5c', '#ffb347', '#ffe066', '#8fe88f', '#6fb4ff', '#b38cff'];
    bands.forEach((c, i) => {
      ctx.strokeStyle = c;
      ctx.lineWidth = 2.6;
      ctx.beginPath();
      ctx.arc(0, 8, 13 - i * 2.4, Math.PI, 0);
      ctx.stroke();
    });
  }

  // Bölüm 20's collectible: a fluttering butterfly, wings beating with the
  // same spin phase used for the default coin flip. Assumes the context is
  // already translated to the butterfly's center.
  function drawButterfly(spin) {
    const flap = Math.max(0.2, Math.abs(spin));
    ctx.save();
    ctx.scale(flap, 1);
    const wingGrad = ctx.createRadialGradient(0, 0, 1, 0, 0, 12);
    wingGrad.addColorStop(0, '#ffe0f6');
    wingGrad.addColorStop(1, '#9b6fff');
    ctx.fillStyle = wingGrad;
    [-1, 1].forEach(side => {
      ctx.beginPath();
      ctx.ellipse(side * 7, -5, 8, 6, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(side * 6, 5, 6, 5, 0, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.restore();
    ctx.fillStyle = '#3a2a4a';
    ctx.beginPath();
    ctx.ellipse(0, 0, 1.6, 9, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  // Bölüm 21's collectible: a small treasure gem catching the light.
  // Assumes the context is already translated to the gem's center.
  function drawTreasure() {
    const grad = ctx.createLinearGradient(-10, -10, 10, 10);
    grad.addColorStop(0, '#fff6c0');
    grad.addColorStop(0.5, '#ffd24a');
    grad.addColorStop(1, '#c98a10');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(0, -11);
    ctx.lineTo(9, -2);
    ctx.lineTo(5, 11);
    ctx.lineTo(-5, 11);
    ctx.lineTo(-9, -2);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#8a5a00';
    ctx.lineWidth = 1.2;
    ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,0.6)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, -11);
    ctx.lineTo(0, 11);
    ctx.stroke();
  }

  // Bölüm 9's collectibles: a soccer ball, basketball or tennis ball in
  // place of a gold coin. Assumes the context is already translated to
  // the ball's center.
  function drawSportBall(type) {
    const grad = ctx.createRadialGradient(-5, -5, 2, 0, 0, 15);
    if (type === 'basketball') {
      grad.addColorStop(0, '#ffab5c');
      grad.addColorStop(1, '#c9701f');
    } else if (type === 'tennis') {
      grad.addColorStop(0, '#f1ff8a');
      grad.addColorStop(1, '#b8d61e');
    } else {
      grad.addColorStop(0, '#ffffff');
      grad.addColorStop(1, '#d4d4d4');
    }
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(0, 0, 15, 0, Math.PI * 2);
    ctx.fill();

    if (type === 'basketball') {
      ctx.strokeStyle = '#3a1d08';
      ctx.lineWidth = 1.3;
      ctx.beginPath(); ctx.arc(0, 0, 15, 0, Math.PI * 2); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, -15); ctx.lineTo(0, 15); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-15, 0); ctx.lineTo(15, 0); ctx.stroke();
      ctx.beginPath(); ctx.ellipse(0, 0, 15, 6, 0, 0, Math.PI * 2); ctx.stroke();
    } else if (type === 'tennis') {
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(-6, 0, 13, -0.95, 0.95); ctx.stroke();
      ctx.beginPath(); ctx.arc(6, 0, 13, Math.PI - 0.95, Math.PI + 0.95); ctx.stroke();
    } else {
      ctx.strokeStyle = '#9a9a9a';
      ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.arc(0, 0, 15, 0, Math.PI * 2); ctx.stroke();
      ctx.fillStyle = '#242424';
      drawPentagon(0, -1, 5.5);
      [[-9, -6], [9, -6], [0, 10]].forEach(([px, py]) => drawPentagon(px, py, 3.8));
    }
  }

  function drawPentagon(cx, cy, r) {
    ctx.beginPath();
    for (let i = 0; i < 5; i++) {
      const a = -Math.PI / 2 + i * (Math.PI * 2 / 5);
      const px = cx + Math.cos(a) * r;
      const py = cy + Math.sin(a) * r;
      if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();
  }

  function drawBalloons() {
    balloons.forEach(b => {
      const y = b.y + cameraOffset;
      if (y < -60 || y > CANVAS_H + 60) return;
      const sway = Math.sin(b.phase * 1.3) * 3;
      ctx.save();
      ctx.translate(b.x, y);

      // string
      ctx.strokeStyle = 'rgba(255,255,255,0.55)';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(0, BALLOON_R * 1.15);
      ctx.quadraticCurveTo(sway * 2, BALLOON_R * 1.15 + 14, -sway, BALLOON_R * 1.15 + 30);
      ctx.stroke();

      // body
      const grad = ctx.createRadialGradient(-7, -9, 3, 0, 0, BALLOON_R * 1.2);
      grad.addColorStop(0, lighten(b.color, 70));
      grad.addColorStop(0.45, b.color);
      grad.addColorStop(1, darken(b.color, 45));
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.ellipse(0, 0, BALLOON_R * 0.86, BALLOON_R, 0, 0, Math.PI * 2);
      ctx.fill();

      // knot
      ctx.fillStyle = darken(b.color, 45);
      ctx.beginPath();
      ctx.moveTo(0, BALLOON_R - 1);
      ctx.lineTo(-4, BALLOON_R + 5);
      ctx.lineTo(4, BALLOON_R + 5);
      ctx.closePath();
      ctx.fill();

      // shine
      ctx.fillStyle = 'rgba(255,255,255,0.45)';
      ctx.beginPath();
      ctx.ellipse(-7, -9, 4, 6, -0.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });
  }

  function drawSlimes(stuckOnes) {
    slimes.forEach(s => {
      if (s.stuck !== stuckOnes) return;
      const x = s.stuck ? CENTER_X + s.offX : s.x;
      const y = (s.stuck ? player.y - 6 + s.offY : s.y) + cameraOffset;
      if (y < -50 || y > CANVAS_H + 50) return;
      const w = Math.sin(s.wob);
      const rx = SLIME_R * (1 + 0.09 * w);
      const ry = SLIME_R * (0.82 - 0.09 * w);
      ctx.save();
      ctx.translate(x, y);

      // body
      const grad = ctx.createRadialGradient(-6, -8, 3, 0, 0, SLIME_R * 1.3);
      grad.addColorStop(0, '#d6ffd0');
      grad.addColorStop(0.4, '#6cf27a');
      grad.addColorStop(1, '#1f9a3c');
      ctx.globalAlpha = 0.93;
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.ellipse(0, 0, rx, ry, 0, Math.PI, Math.PI * 2);
      ctx.lineTo(rx, ry * 0.55);
      ctx.quadraticCurveTo(rx * 0.5, ry * 0.9, 0, ry * 0.6);
      ctx.quadraticCurveTo(-rx * 0.5, ry * 0.95, -rx, ry * 0.55);
      ctx.closePath();
      ctx.fill();

      // drip when stuck
      if (s.stuck) {
        ctx.fillStyle = '#3fd25a';
        ctx.beginPath();
        ctx.ellipse(rx * 0.4, ry * 0.6 + 6 + Math.abs(w) * 3, 3, 6, 0, 0, Math.PI * 2);
        ctx.fill();
      }

      // eyes + mouth
      ctx.globalAlpha = 1;
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(-6, -3, 4.5, 0, Math.PI * 2);
      ctx.arc(6, -3, 4.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#0f2a14';
      ctx.beginPath();
      ctx.arc(-5, -2.5, 2.2, 0, Math.PI * 2);
      ctx.arc(7, -2.5, 2.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#0f2a14';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(0, 4, 4, 0.1 * Math.PI, 0.9 * Math.PI);
      ctx.stroke();
      ctx.restore();
    });
  }

  // Helicopter: back pass (tail, rotor, cabin interior) is drawn before the hero, front pass
  // (glass, lower fuselage, skids) after, so the hero sits inside the cabin.
  function drawHeli(front) {
    if (!heli) return;
    const wy = heli.boarded ? player.y : heli.worldY + Math.sin(performance.now() / 500) * 4;
    const y = wy + cameraOffset;
    if (y < -130 || y > CANVAS_H + 130) return;
    const t = performance.now() / 1000;
    ctx.save();
    ctx.translate(CENTER_X, y);
    ctx.lineCap = 'round';
    if (!front) {
      // tail boom, fin and spinning tail rotor
      ctx.strokeStyle = '#c9302c';
      ctx.lineWidth = 9;
      ctx.beginPath(); ctx.moveTo(26, -4); ctx.lineTo(92, -20); ctx.stroke();
      ctx.fillStyle = '#c9302c';
      ctx.beginPath(); ctx.moveTo(86, -20); ctx.lineTo(100, -40); ctx.lineTo(102, -16); ctx.closePath(); ctx.fill();
      const ta = t * 50;
      ctx.strokeStyle = 'rgba(40,40,40,0.8)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(98 + Math.cos(ta) * 12, -20 + Math.sin(ta) * 12);
      ctx.lineTo(98 - Math.cos(ta) * 12, -20 - Math.sin(ta) * 12);
      ctx.stroke();

      // mast and main rotor
      ctx.strokeStyle = '#555';
      ctx.lineWidth = 6;
      ctx.beginPath(); ctx.moveTo(0, -42); ctx.lineTo(0, -58); ctx.stroke();
      ctx.fillStyle = 'rgba(60,60,70,0.22)';
      ctx.beginPath(); ctx.ellipse(0, -60, 78, 6, 0, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#2b2b33';
      ctx.lineWidth = 5;
      const ra = t * 40;
      [0, Math.PI / 2].forEach(off => {
        const c = Math.cos(ra + off);
        ctx.beginPath(); ctx.moveTo(-74 * c, -60); ctx.lineTo(74 * c, -60); ctx.stroke();
      });

      // cabin interior
      ctx.fillStyle = 'rgba(30,44,70,0.55)';
      ctx.beginPath(); ctx.ellipse(0, -4, 42, 48, 0, 0, Math.PI * 2); ctx.fill();
    } else {
      // lower fuselage hides the hero's legs
      ctx.fillStyle = '#d9342b';
      ctx.beginPath(); ctx.roundRect(-46, 2, 92, 34, 14); ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(-40, 18, 80, 4);

      // glass dome
      ctx.fillStyle = 'rgba(170,220,255,0.18)';
      ctx.strokeStyle = 'rgba(200,235,255,0.9)';
      ctx.lineWidth = 3;
      ctx.beginPath(); ctx.ellipse(0, 2, 42, 48, 0, Math.PI, Math.PI * 2); ctx.closePath();
      ctx.fill(); ctx.stroke();
      ctx.strokeStyle = 'rgba(255,255,255,0.6)';
      ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(-4, 2, 34, Math.PI * 1.15, Math.PI * 1.45); ctx.stroke();

      // skids
      ctx.strokeStyle = '#2b2b33';
      ctx.lineWidth = 4;
      ctx.beginPath(); ctx.moveTo(-46, 50); ctx.lineTo(46, 50); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-26, 34); ctx.lineTo(-28, 50); ctx.moveTo(26, 34); ctx.lineTo(28, 50); ctx.stroke();
    }
    ctx.restore();
  }

  // Cloud banks the rotor tears apart: each splits into a left and a right half that drift away.
  function drawHeliClouds() {
    if (!heli) return;
    heli.clouds.forEach(c => {
      const y = c.y + cameraOffset;
      if (y < -90 || y > CANVAS_H + 90) return;
      ctx.save();
      ctx.translate(c.x, y);
      ctx.globalAlpha = 0.96;
      c.puffs.forEach(p => {
        const px = p.dx + (p.dx < 0 ? c.offL : c.offR);
        const g = ctx.createRadialGradient(px - 5, p.dy - 6, 2, px, p.dy, p.r);
        g.addColorStop(0, '#ffffff');
        g.addColorStop(1, '#cfd9ee');
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.arc(px, p.dy, p.r, 0, Math.PI * 2); ctx.fill();
      });
      ctx.restore();
    });
  }

  // City skyline: three parallax layers of lit-window towers, pre-rendered once.
  let cityLayers = null;
  function buildCityLayers() {
    const defs = [
      { parallax: 0.12, color: '#2b2f66', win: 0.25, minH: 180, maxH: 380 },
      { parallax: 0.25, color: '#1d2150', win: 0.4, minH: 220, maxH: 520 },
      { parallax: 0.45, color: '#12143a', win: 0.55, minH: 260, maxH: 640 },
    ];
    const sc = 2;
    cityLayers = defs.map((d, li) => {
      const H = d.maxH + 30;
      const c = document.createElement('canvas');
      c.width = CANVAS_W * sc;
      c.height = H * sc;
      const g = c.getContext('2d');
      g.scale(sc, sc);
      let x = -12 - li * 9;
      for (let b = 0; x < CANVAS_W + 20; b++) {
        const w = 46 + seededRand(li * 31 + b) * 50;
        const h = d.minH + seededRand(li * 17 + b * 3 + 1) * (d.maxH - d.minH);
        g.fillStyle = d.color;
        g.fillRect(x, H - h, w, h);
        if (seededRand(li * 7 + b * 5 + 2) > 0.6) g.fillRect(x + w / 2 - 1.5, H - h - 18, 3, 18); // antenna
        const cols = Math.floor((w - 10) / 10);
        const rows = Math.floor((h - 14) / 16);
        for (let r = 0; r < rows; r++) {
          for (let cc = 0; cc < cols; cc++) {
            const s = seededRand(li * 1000 + b * 100 + r * 10 + cc);
            if (s < d.win) {
              g.fillStyle = s < d.win * 0.2 ? '#9fe3ff' : '#ffd98a';
              g.fillRect(x + 7 + cc * 10, H - h + 10 + r * 16, 5, 8);
            }
          }
        }
        x += w + 2 + seededRand(b + li) * 6;
      }
      return { canvas: c, H, parallax: d.parallax };
    });
  }

  function drawCity() {
    if (!cityLayers) buildCityLayers();
    cityLayers.forEach(L => {
      const baseY = GROUND_Y + 6 + cameraOffset * L.parallax;
      if (baseY - L.H > CANVAS_H) return;
      ctx.drawImage(L.canvas, 0, baseY - L.H, CANVAS_W, L.H);
    });
  }

  // Slingshot on a floating rock; the rubber bands stretch down to the pouch the hero sits in.
  function drawSlingshot() {
    if (!sling) return;
    const baseY = sling.worldY + cameraOffset;
    if (baseY < -140 || baseY > CANVAS_H + 160) return;
    const rel = 10 + (state === STATE.SLING ? sling.tension * SLING_PULL : 0);
    ctx.save();
    ctx.translate(CENTER_X, baseY);
    ctx.lineCap = 'round';

    // floating rock with grass top
    ctx.fillStyle = '#6b4a2f';
    ctx.beginPath(); ctx.ellipse(0, 104, 66, 20, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(-26, 124, 11, 13, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(20, 128, 8, 10, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#3f9b4a';
    ctx.beginPath(); ctx.ellipse(0, 98, 64, 12, 0, 0, Math.PI * 2); ctx.fill();

    // wooden fork
    ctx.strokeStyle = '#8a5a30';
    ctx.lineWidth = 11;
    ctx.beginPath(); ctx.moveTo(0, 98); ctx.lineTo(0, 36); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, 38); ctx.lineTo(-32, -6); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, 38); ctx.lineTo(32, -6); ctx.stroke();
    ctx.fillStyle = '#5a3a1e';
    ctx.beginPath(); ctx.arc(-32, -6, 7, 0, Math.PI * 2); ctx.arc(32, -6, 7, 0, Math.PI * 2); ctx.fill();

    // rubber bands and pouch
    ctx.strokeStyle = '#e0392e';
    ctx.lineWidth = 4;
    ctx.beginPath(); ctx.moveTo(-32, -6); ctx.lineTo(-10, rel + 8); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(32, -6); ctx.lineTo(10, rel + 8); ctx.stroke();
    ctx.fillStyle = '#5b3a1f';
    ctx.beginPath(); ctx.ellipse(0, rel + 10, 17, 8, 0, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }

  // The web hero swings in pendulum arcs beside the rising hero, the web
  // line stretching taut between his hand and the hero's wrist.
  function drawWeb() {
    if (!web || !web.boarded) return;
    const baseY = player.y + cameraOffset;
    const swing = Math.sin(web.swingPhase);
    const heroX = CENTER_X + swing * WEB_SWING_AMP * web.side;
    const heroY = baseY - 80 - Math.abs(Math.cos(web.swingPhase)) * 24;

    const handX = heroX - swing * 10 * web.side;
    const handY = heroY + 18;
    const wristX = CENTER_X + 10;
    const wristY = baseY - 10;
    const midX = (handX + wristX) / 2;
    const midY = (handY + wristY) / 2 + 14;

    ctx.save();
    ctx.strokeStyle = 'rgba(255,255,255,0.85)';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(handX, handY);
    ctx.quadraticCurveTo(midX, midY, wristX, wristY);
    ctx.stroke();
    ctx.restore();

    ctx.save();
    ctx.translate(heroX, heroY);
    ctx.rotate(swing * web.side * 0.3);

    ctx.strokeStyle = '#1a1a1a';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(-4, 10); ctx.lineTo(-16, 26);
    ctx.moveTo(2, 10); ctx.lineTo(-10, 30);
    ctx.stroke();

    const bodyGrad = ctx.createLinearGradient(-10, -14, 10, 16);
    bodyGrad.addColorStop(0, '#c23a2e');
    bodyGrad.addColorStop(1, '#6e1a14');
    ctx.fillStyle = bodyGrad;
    ctx.beginPath();
    ctx.ellipse(0, 0, 11, 15, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = 'rgba(20,20,20,0.5)';
    ctx.lineWidth = 0.8;
    for (let i = -8; i <= 8; i += 4) {
      ctx.beginPath();
      ctx.moveTo(i, -12);
      ctx.lineTo(i * 0.4, 14);
      ctx.stroke();
    }

    ctx.strokeStyle = '#6e1a14';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(0, -6);
    ctx.lineTo(web.side * 16, 18);
    ctx.stroke();

    ctx.fillStyle = '#111';
    ctx.beginPath();
    ctx.arc(0, -16, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#f2f2f2';
    ctx.beginPath();
    ctx.ellipse(-3, -17, 3, 2.2, -0.3, 0, Math.PI * 2);
    ctx.ellipse(3, -17, 3, 2.2, 0.3, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  function drawPalm(x, y, s, lean) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(s, s);
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#7a5230';
    ctx.lineWidth = 5;
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(lean * 0.4, -22, lean, -44); ctx.stroke();
    ctx.strokeStyle = '#2f9e57';
    ctx.lineWidth = 4;
    [-170, -140, -110, -70, -40, -10].forEach(deg => {
      const a = deg * Math.PI / 180;
      const ex = lean + Math.cos(a) * 28;
      const ey = -44 + Math.sin(a) * 10 + 14;
      ctx.beginPath();
      ctx.moveTo(lean, -44);
      ctx.quadraticCurveTo(lean + Math.cos(a) * 16, -44 - 16, ex, ey);
      ctx.stroke();
    });
    ctx.restore();
  }

  // Turquoise lagoon: shimmering sea with a palm island and a smaller islet on the horizon.
  function drawLagoon() {
    const horizon = 470 + cameraOffset * 0.3;
    if (horizon > CANVAS_H + 60) return;
    const t = performance.now() / 1000;

    // islands sit on the horizon line
    ctx.fillStyle = '#f0d9a0';
    ctx.beginPath(); ctx.ellipse(110, horizon + 4, 92, 17, 0, Math.PI, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#2f9e57';
    ctx.beginPath(); ctx.ellipse(110, horizon + 2, 60, 14, 0, Math.PI, Math.PI * 2); ctx.fill();
    drawPalm(84, horizon, 0.9, -10);
    drawPalm(126, horizon, 1.1, 12);
    ctx.fillStyle = '#f0d9a0';
    ctx.beginPath(); ctx.ellipse(318, horizon + 3, 44, 9, 0, Math.PI, Math.PI * 2); ctx.fill();
    drawPalm(318, horizon, 0.6, 6);

    if (horizon >= CANVAS_H) return;
    const sea = ctx.createLinearGradient(0, horizon, 0, CANVAS_H);
    sea.addColorStop(0, '#5ee6dc');
    sea.addColorStop(0.35, '#1fc4c4');
    sea.addColorStop(1, '#0a7f95');
    ctx.fillStyle = sea;
    ctx.fillRect(0, horizon, CANVAS_W, CANVAS_H - horizon);

    // shoreline foam around the islands
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.fillRect(18, horizon + 5, 184, 2);
    ctx.fillRect(276, horizon + 4, 84, 2);

    ctx.lineWidth = 1.6;
    for (let band = 0; band < 8; band++) {
      const y = horizon + 24 + band * 36;
      ctx.strokeStyle = `rgba(255, 255, 255, ${0.14 + band * 0.015})`;
      ctx.beginPath();
      for (let x = 0; x <= CANVAS_W; x += 10) {
        const yy = y + Math.sin(x * 0.035 + t * 1.3 + band * 1.9) * (2 + band * 0.5);
        if (x === 0) ctx.moveTo(x, yy); else ctx.lineTo(x, yy);
      }
      ctx.stroke();
    }
  }

  function drawParticles() {
    particles.forEach(p => {
      ctx.save();
      ctx.globalAlpha = Math.max(0, p.life);
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });
  }

  function render() {
    const theme = currentTheme();
    const tierGroup = Math.min(2, Math.floor((save.upgrades.spring + save.upgrades.boost) / 4));
    drawBackground(theme);
    drawGround(theme);
    if (theme.decor === 'stadium') drawBaseballDiamond();
    if (theme.decor === 'volcano') drawVolcanoCrater();
    drawTrampoline(tierGroup);
    drawSlingshot();
    drawHeliClouds();
    drawHeli(false);
    drawBalloons();
    drawSlimes(false);
    drawFinishLine(theme);
    drawCoins();
    drawCharacter(theme);
    drawSlimes(true);
    drawHeli(true);
    drawWeb();
    drawParticles();
  }

  // ---------- Main loop ----------
  function loop(now) {
    const dt = lastTime ? Math.min(2.4, (now - lastTime) / (1000 / 60)) : 1;
    lastTime = now;

    if (state === STATE.PLAYING) {
      updatePhysics(dt);
      render();
    } else if (state === STATE.HELI) {
      updateHeli(dt);
      render();
    } else if (state === STATE.WEB) {
      updateWeb(dt);
      render();
    } else if (state === STATE.SLING) {
      updateSling(dt);
      render();
    } else if (state === STATE.PAUSED) {
      render();
    } else if (state === STATE.COMPLETE) {
      updateParticles(dt);
      updateClouds(dt);
      render();
    } else if (state === STATE.MENU || state === STATE.HOWTO || state === STATE.SHOP || state === STATE.BOOST) {
      idlePreview(dt);
      render();
    }

    requestAnimationFrame(loop);
  }

  function idlePreview(dt) {
    player.vy += GRAVITY * dt;
    player.y += player.vy * dt;
    if (player.squash > 0) player.squash = Math.max(0, player.squash - 0.06 * dt);
    if (player.vy > 0 && player.y + CHAR_RADIUS >= TRAMPOLINE_Y) {
      player.y = TRAMPOLINE_Y - CHAR_RADIUS;
      player.vy = currentBaseBounce() * 0.75;
      player.squash = 1;
    }
    cameraOffset = 0;
    updateClouds(dt);
  }

  // ---------- Loading sequence ----------
  function runLoadingSequence() {
    showScreen('loading');
    let pct = 0;
    const timer = setInterval(() => {
      pct += 6 + Math.random() * 10;
      if (pct >= 100) {
        pct = 100;
        clearInterval(timer);
        setTimeout(() => {
          state = STATE.MENU;
          renderMenu();
          showScreen('menu');
        }, 250);
      }
      loadingFill.style.width = `${pct}%`;
      loadingLabel.textContent = `Orman hazırlanıyor… ${Math.floor(pct)}%`;
    }, 140);
  }

  // ---------- Menu rendering ----------
  function renderMenu() {
    menuGoldAmount.textContent = String(save.gold);
    shopHint.hidden = !showShopHint;
    levelList.innerHTML = '';
    LEVELS.forEach((level, i) => {
      const locked = i > save.unlockedLevel;
      const completed = save.completedLevels[i];
      const isNext = i === getNextLevelIndex();

      const card = document.createElement('div');
      card.className = 'level-card' + (locked ? ' locked' : '') + (isNext && !locked ? ' current' : '');

      const icon = document.createElement('div');
      icon.className = 'level-card-icon';
      icon.textContent = locked ? '🔒' : level.icon;

      const info = document.createElement('div');
      info.className = 'level-card-info';
      const name = document.createElement('div');
      name.className = 'level-card-name';
      name.textContent = level.name;
      const status = document.createElement('div');
      status.className = 'level-card-status';
      status.textContent = locked ? 'Kilitli — önceki bölümü tamamla' : (completed ? 'Tamamlandı, tekrar oynanabilir' : 'Oynanabilir');
      info.append(name, status);

      card.append(icon, info);

      if (completed) {
        const check = document.createElement('div');
        check.className = 'level-card-check';
        check.textContent = '✅';
        card.appendChild(check);
      }

      if (!locked) {
        card.addEventListener('click', () => startLevel(i));
      }

      levelList.appendChild(card);
    });
  }

  // ---------- Shop rendering ----------
  function renderShop() {
    shopGoldAmount.textContent = String(save.gold);
    upgradeList.innerHTML = '';
    UPGRADE_DEFS.forEach(def => {
      const tier = save.upgrades[def.key];
      const maxed = tier >= MAX_TIER;
      const cost = maxed ? null : UPGRADE_COSTS[tier];
      const defLocked = save.unlockedLevel < def.minLevel; // upgrade not introduced yet
      const tierLocked = !maxed && tier >= tierCap();      // next tier waits for a later level

      const card = document.createElement('div');
      card.className = 'upgrade-card' + (defLocked ? ' locked' : '');

      const top = document.createElement('div');
      top.className = 'upgrade-card-top';
      const icon = document.createElement('span');
      icon.className = 'upgrade-icon';
      icon.textContent = def.icon;
      const name = document.createElement('span');
      name.className = 'upgrade-name';
      name.textContent = def.name;
      const dots = document.createElement('div');
      dots.className = 'upgrade-tier-dots';
      for (let i = 0; i < MAX_TIER; i++) {
        const dot = document.createElement('span');
        dot.className = 'dot' + (i < tier ? ' filled' : '');
        dots.appendChild(dot);
      }
      top.append(icon, name, dots);

      const desc = document.createElement('p');
      desc.className = 'upgrade-desc';
      desc.textContent = defLocked
        ? `Açılması için Bölüm ${def.minLevel + 1} gerekli.`
        : (maxed ? `${def.descFor(tier)} — en üst seviye!` : `${def.descFor(tier)} → ${def.descFor(tier + 1)}`);

      const buyRow = document.createElement('div');
      buyRow.className = 'upgrade-buy-row';
      const costEl = document.createElement('span');
      costEl.className = 'upgrade-cost';
      costEl.textContent = defLocked ? '🔒' : (maxed ? 'MAKS' : `${cost} 🪙`);
      const buyBtn = document.createElement('button');
      buyBtn.className = 'upgrade-buy-btn';
      buyBtn.textContent = defLocked ? 'KİLİTLİ' : (maxed ? 'TAMAM' : (tierLocked ? `🔒 Bölüm ${tier} gerekli` : 'YÜKSELT'));
      buyBtn.disabled = defLocked || maxed || tierLocked || save.gold < cost;
      buyBtn.addEventListener('click', () => {
        if (defLocked || maxed || tierLocked || save.gold < UPGRADE_COSTS[save.upgrades[def.key]]) return;
        save.gold -= UPGRADE_COSTS[save.upgrades[def.key]];
        save.upgrades[def.key] += 1;
        persist();
        playPurchase();
        if (shopReturn === 'game') applyUpgradeNow(def.key);
        renderShop();
        renderUpgradeChips();
        hudGoldAmount.textContent = String(save.gold);
      });
      buyRow.append(costEl, buyBtn);

      card.append(top, desc, buyRow);
      upgradeList.appendChild(card);
    });
  }

  // Upgrade levels live in fixed HUD chips at the bottom corners (they don't follow the hero).
  function renderUpgradeChips() {
    chipsLeft.innerHTML = '';
    chipsRight.innerHTML = '';
    UPGRADE_DEFS.forEach((def, i) => {
      const lvl = save.upgrades[def.key];
      if (lvl <= 0) return;
      const chip = document.createElement('div');
      chip.className = 'upgrade-chip' + (lvl >= MAX_TIER ? ' maxed' : '');
      chip.textContent = `${def.icon} Sv.${lvl}${lvl >= MAX_TIER ? '★' : ''}`;
      (i % 2 === 0 ? chipsLeft : chipsRight).appendChild(chip);
    });
  }

  // A purchase made mid-run kicks in right away instead of waiting for the
  // next bounce: spring adds an instant upward kick, boost refills the taps.
  function applyUpgradeNow(key) {
    if (key === 'spring') {
      player.vy -= SPRING_STEP;
    } else if (key === 'boost') {
      player.boostCount = 0;
      player.vy -= BOOST_STEP;
      shakeSlimes(1);
    }
  }

  function openShop(from) {
    shopReturn = from;
    shopBackBtn.textContent = from === 'game' ? 'DEVAM ET' : 'GERİ';
    screens.shop.classList.toggle('shop-overlay', from === 'game');
    renderShop();
    showScreen('shop');
  }

  function closeShop() {
    screens.shop.classList.remove('shop-overlay');
    if (shopReturn === 'game') {
      showScreen(null);
      state = resumeState;
    } else {
      state = STATE.MENU;
      renderMenu();
      showScreen('menu');
    }
  }

  // ---------- Button wiring ----------
  document.getElementById('startBtn').addEventListener('click', () => startLevel(getNextLevelIndex()));

  document.getElementById('howtoBtn').addEventListener('click', () => {
    state = STATE.HOWTO;
    showScreen('howto');
  });
  document.getElementById('howtoBackBtn').addEventListener('click', () => {
    state = STATE.MENU;
    renderMenu();
    showScreen('menu');
  });
  document.getElementById('howtoStartBtn').addEventListener('click', () => startLevel(getNextLevelIndex()));

  document.getElementById('shopBtn').addEventListener('click', () => {
    showShopHint = false;
    state = STATE.SHOP;
    openShop('menu');
  });
  hudShopBtn.addEventListener('click', () => {
    if (state !== STATE.PLAYING && state !== STATE.SLING && state !== STATE.HELI && state !== STATE.WEB) return;
    clearTimeout(ingameHintTimer);
    ingameUpgradeBanner.hidden = true;
    hudShopHint.hidden = true;
    resumeState = state;
    if (sling) sling.holding = false;
    state = STATE.PAUSED;
    openShop('game');
  });
  shopBackBtn.addEventListener('click', closeShop);

  // Restart needs a second tap within 2.5s so an accidental touch can't wipe a run.
  let restartTimer = null;
  function disarmRestart() {
    clearTimeout(restartTimer);
    restartTimer = null;
    hudRestartBtn.textContent = '🔄 Yeniden Başlat';
  }
  hudRestartBtn.addEventListener('click', () => {
    if (state !== STATE.PLAYING && state !== STATE.SLING && state !== STATE.HELI && state !== STATE.WEB) return;
    if (restartTimer === null) {
      hudRestartBtn.textContent = '❓ Emin misin?';
      restartTimer = setTimeout(disarmRestart, 2500);
      return;
    }
    disarmRestart();
    startLevel(currentLevelIndex);
  });

  document.getElementById('replayBtn').addEventListener('click', () => startLevel(currentLevelIndex));
  document.getElementById('nextLevelBtn').addEventListener('click', () => startLevel(currentLevelIndex + 1));
  document.getElementById('menuBtn').addEventListener('click', () => {
    state = STATE.MENU;
    renderMenu();
    showScreen('menu');
  });

  // ---------- Boot ----------
  resetLevel(0);
  runLoadingSequence();
  requestAnimationFrame(loop);
})();
