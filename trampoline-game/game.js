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
  const MAX_TIER = 5;

  const CAMERA_FOLLOW_Y = 300; // once char rises above this, camera scrolls with it

  const WEB_ASSIST_BOOST = -16;   // one-time extra lift on the first bounce of a web-assist level
  const WEB_ASSIST_DURATION = 650; // ms the web-swing visual stays on screen

  const UPGRADE_COSTS = [40, 90, 160, 260, 400]; // gold cost tier i -> i+1
  const GOLD_PER_COIN = 15;
  const LEVEL_FIRST_CLEAR_BONUS = 60;
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
    city: {
      skyTop: [8, 8, 28], skyTopHigh: [110, 150, 210],
      skyBot: [32, 18, 50], skyBotHigh: [205, 185, 215],
      groundNear: '#17171f', groundFar: '#33333f',
      groundSpeckle: 'rgba(255,255,255,0.08)',
      sunColor: '#eef1ff', sunGlow: 'rgba(200, 210, 255, 0.28)',
      decor: 'buildings',
      foliage: ['#1d1f2b', '#262a3a', '#33384d'],
      trunk: '#111118',
      accent: '#ff3b3b',
    },
  };

  // ---------- Levels ----------
  const LEVELS = [
    { id: 0, name: 'Bölüm 1 · Yeşil Orman', icon: '🌲', theme: 'forest', coinHeights: [180, 270, 350, 440, 530, 620] },
    { id: 1, name: 'Bölüm 2 · Kar Dağı', icon: '🏔️', theme: 'snow', coinHeights: [200, 300, 410, 520, 640, 780] },
    { id: 2, name: 'Bölüm 3 · Çöl Vahası', icon: '🏜️', theme: 'desert', coinHeights: [240, 370, 500, 650, 820, 1050] },
    { id: 3, name: 'Bölüm 4 · Örümcek Şehri', icon: '🕸️', theme: 'city', coinHeights: [280, 430, 580, 750, 950, 1200], webAssist: true },
  ];

  const UPGRADE_DEFS = [
    { key: 'spring', icon: '🌀', name: 'Yay Gücü', unit: 'tier', descFor: t => `Trambolinin otomatik zıplama gücü +${(t * SPRING_STEP).toFixed(1)}` },
    { key: 'boost', icon: '🚀', name: 'Uçuş Takviyesi', unit: 'tier', descFor: t => `Havada dokunuş başına ekstra yükseklik +${(t * BOOST_STEP).toFixed(1)}` },
  ];

  // ---------- DOM ----------
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  const phoneFrame = document.getElementById('phoneFrame');

  const screens = {
    loading: document.getElementById('loadingScreen'),
    menu: document.getElementById('menuScreen'),
    howto: document.getElementById('howtoScreen'),
    shop: document.getElementById('shopScreen'),
    complete: document.getElementById('completeScreen'),
  };
  const hud = document.getElementById('hud');
  const loadingFill = document.getElementById('loadingFill');
  const loadingLabel = document.getElementById('loadingLabel');

  const menuGoldAmount = document.getElementById('menuGoldAmount');
  const levelList = document.getElementById('levelList');
  const shopHint = document.getElementById('shopHint');

  const shopGoldAmount = document.getElementById('shopGoldAmount');
  const upgradeList = document.getElementById('upgradeList');

  const hudLevel = document.getElementById('hudLevel');
  const coinCountEl = document.getElementById('coinCount');
  const coinTotalEl = document.getElementById('coinTotal');
  const hudGoldAmount = document.getElementById('hudGoldAmount');
  const heightFill = document.getElementById('heightFill');
  const hudExitBtn = document.getElementById('hudExitBtn');

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
    const base = { gold: 0, unlockedLevel: 0, completedLevels: LEVELS.map(() => false), upgrades: { spring: 0, boost: 0 } };
    if (!s) return base;
    return {
      gold: typeof s.gold === 'number' ? s.gold : 0,
      unlockedLevel: typeof s.unlockedLevel === 'number' ? s.unlockedLevel : 0,
      completedLevels: LEVELS.map((_, i) => !!(s.completedLevels && s.completedLevels[i])),
      upgrades: {
        spring: clampTier(s.upgrades && s.upgrades.spring),
        boost: clampTier(s.upgrades && s.upgrades.boost),
      },
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

  function playPurchase() {
    const a = audio();
    if (!a) return;
    const t = a.currentTime;
    [660, 990].forEach((freq, i) => tone(a, freq, t + i * 0.07, 0.18, { type: 'square', gain: 0.07 }));
  }

  // Web-shooter "thwip" — a fast descending blip
  function playWebThwip() {
    const a = audio();
    if (!a) return;
    tone(a, 1500, a.currentTime, 0.14, { type: 'square', gain: 0.09, glideTo: 280 });
  }

  // ---------- Game state ----------
  const STATE = { LOADING: 'loading', MENU: 'menu', HOWTO: 'howto', SHOP: 'shop', PLAYING: 'playing', COMPLETE: 'complete' };
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
  let particles = [];
  let clouds = [];
  let cameraOffset = 0;
  let maxHeightReached = 0;
  let collectedCount = 0;
  let lastTime = 0;
  let bounceCountThisLevel = 0;
  let showShopHint = false;
  const webAssist = { active: false, used: false, startTime: 0, heroSide: 1 };

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
    coins = level.coinHeights.map(h => ({ worldY: TRAMPOLINE_Y - h, collected: false, wobble: Math.random() * Math.PI * 2 }));
    particles = [];
    cameraOffset = 0;
    maxHeightReached = 0;
    collectedCount = 0;
    coinCountEl.textContent = '0';
    coinTotalEl.textContent = String(level.coinHeights.length);
    hudLevel.textContent = level.name;
    hudGoldAmount.textContent = String(save.gold);
    heightFill.style.height = '0%';
    bounceCountThisLevel = 0;
    webAssist.active = false;
    webAssist.used = false;
    webAssist.heroSide = Math.random() < 0.5 ? 1 : -1;
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
    state = STATE.PLAYING;
    showScreen(null);
    hud.hidden = false;
  }

  // Quit the current attempt without finishing it. If the level wasn't
  // completed, surface the upgrade hint next time the menu is shown.
  function endLevelEarly() {
    if (state !== STATE.PLAYING) return;
    const level = currentLevel();
    if (collectedCount < level.coinHeights.length) {
      showShopHint = true;
    }
    state = STATE.MENU;
    hud.hidden = true;
    renderMenu();
    showScreen('menu');
  }
  hudExitBtn.addEventListener('click', endLevelEarly);

  // ---------- Input ----------
  function handleTap() {
    if (state !== STATE.PLAYING) return;
    const now = performance.now();
    const airborne = player.y < TRAMPOLINE_Y - CHAR_RADIUS - 1;
    if (airborne && player.boostCount < MAX_BOOSTS_PER_CYCLE && now - player.lastBoostAt > BOOST_COOLDOWN_MS) {
      player.vy += currentBoostImpulse();
      player.boostCount += 1;
      player.lastBoostAt = now;
      playBoost();
      spawnParticles(CENTER_X, player.y + cameraOffset, 6, '#ffe28a');
    }
  }

  phoneFrame.addEventListener('pointerdown', (e) => {
    if (e.target.closest('.screen') || e.target.closest('button')) return;
    handleTap();
  });

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
    player.vy += GRAVITY * dt;
    player.y += player.vy * dt;

    if (player.squash > 0) player.squash = Math.max(0, player.squash - 0.06 * dt);

    if (player.vy > 0 && player.y + CHAR_RADIUS >= TRAMPOLINE_Y) {
      player.y = TRAMPOLINE_Y - CHAR_RADIUS;
      player.vy = currentBaseBounce();
      player.boostCount = 0;
      player.squash = 1;
      playBoing();
      spawnParticles(CENTER_X, TRAMPOLINE_Y + cameraOffset - 6, 5, '#bfe8ff');
      bounceCountThisLevel += 1;

      // Bölüm 4: on the very first bounce, the web hero swings in and
      // carries the player up with a one-time extra lift.
      if (currentLevel().webAssist && bounceCountThisLevel === 1 && !webAssist.used) {
        webAssist.used = true;
        webAssist.active = true;
        webAssist.startTime = performance.now();
        player.vy += WEB_ASSIST_BOOST;
        playWebThwip();
        spawnParticles(CENTER_X, player.y + cameraOffset, 10, '#ffffff');
      }
    }

    cameraOffset = Math.max(0, CAMERA_FOLLOW_Y - player.y);

    const heightAboveTrampoline = Math.max(0, TRAMPOLINE_Y - player.y);
    if (heightAboveTrampoline > maxHeightReached) maxHeightReached = heightAboveTrampoline;

    coins.forEach(coin => {
      if (coin.collected) return;
      const d = Math.abs(coin.worldY - player.y);
      if (d < CHAR_RADIUS + 16) {
        coin.collected = true;
        collectedCount += 1;
        coinCountEl.textContent = String(collectedCount);
        save.gold += GOLD_PER_COIN;
        hudGoldAmount.textContent = String(save.gold);
        persist();
        playGoldChime();
        spawnParticles(CENTER_X, coin.worldY + cameraOffset, 14, '#ffd24a');
        if (collectedCount >= currentLevel().coinHeights.length) {
          triggerLevelComplete();
        }
      }
    });

    const topGoal = currentLevel().coinHeights[currentLevel().coinHeights.length - 1];
    const pct = Math.min(100, (maxHeightReached / topGoal) * 100);
    heightFill.style.height = `${pct}%`;

    updateParticles(dt);
    updateClouds(dt);
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
    const runGold = collectedCount * GOLD_PER_COIN;
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

    drawSun(theme, climb);
    drawClouds(climb);

    // As the hero climbs above the tree line the canopy thins out,
    // revealing open sky — matches the sky color already brightening.
    const treeAlpha = 1 - climb * 0.85;
    ctx.save();
    ctx.globalAlpha = treeAlpha;
    drawDecorLayer(theme, 0.35, 150, theme.foliage[0], 1, 0.62);
    drawDecorLayer(theme, 0.6, 120, theme.foliage[1], 2, 0.8);
    drawDecorLayer(theme, 1.0, 95, theme.foliage[2], 3, 1.0);
    ctx.restore();
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
        else if (theme.decor === 'buildings') drawBuilding(tx, y, scale, color, itemSeed);
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

  function drawBuilding(x, y, scale, color, seed) {
    if (y < -160 || y > CANVAS_H + 160) return;
    const h = 70 + seededRand(seed) * 55;
    const w = 34 + seededRand(seed + 2) * 14;
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);

    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.beginPath();
    ctx.ellipse(0, 46, w * 0.65, 7, 0, 0, Math.PI * 2);
    ctx.fill();

    const bodyGrad = ctx.createLinearGradient(-w / 2, 0, w / 2, 0);
    bodyGrad.addColorStop(0, lighten(color, 10));
    bodyGrad.addColorStop(1, darken(color, 16));
    ctx.fillStyle = bodyGrad;
    ctx.fillRect(-w / 2, 46 - h, w, h);

    // rooftop tank / antenna for silhouette variety
    if (seededRand(seed + 4) > 0.5) {
      ctx.fillStyle = darken(color, 20);
      ctx.fillRect(-4, 46 - h - 14, 8, 14);
    }

    // lit windows in a grid, some randomly dark
    const cols = Math.max(2, Math.floor(w / 9));
    const rows = Math.max(3, Math.floor(h / 12));
    for (let cy = 0; cy < rows; cy++) {
      for (let cx = 0; cx < cols; cx++) {
        const wSeed = seed + cy * 7.3 + cx * 3.1;
        if (seededRand(wSeed) < 0.32) continue; // unlit window
        const wx = -w / 2 + 5 + cx * (w - 10) / Math.max(1, cols - 1 || 1);
        const wy = 46 - h + 8 + cy * (h - 16) / Math.max(1, rows - 1 || 1);
        ctx.fillStyle = seededRand(wSeed + 1) > 0.15 ? 'rgba(255, 221, 140, 0.85)' : 'rgba(150, 210, 255, 0.7)';
        ctx.fillRect(wx, wy, 3, 4);
      }
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
      ctx.fillStyle = '#fff6d0';
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha *= 0.15;
      ctx.beginPath();
      ctx.arc(CENTER_X, y + bob, 22, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      ctx.save();
      ctx.translate(CENTER_X, y + bob);
      const spin = Math.sin(coin.wobble * 0.7);
      ctx.scale(Math.max(0.25, Math.abs(spin)), 1);

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
      ctx.restore();
    });
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

  // Bölüm 4's one-time "web hero" swing assist: an original web-slinging
  // ally swoops in on the first bounce, grabs the player with a web line,
  // and carries them up before swinging off-screen.
  function drawWebAssist() {
    const t = Math.min(1, (performance.now() - webAssist.startTime) / WEB_ASSIST_DURATION);
    const side = webAssist.heroSide;
    const startX = CENTER_X + side * -260;
    const endX = CENTER_X + side * 260;
    const heroX = startX + (endX - startX) * t;
    const px = CENTER_X;
    const py = player.y + cameraOffset;
    const heroY = py - 70 - Math.sin(t * Math.PI) * 55;

    const handX = heroX + side * 16;
    const handY = heroY + 18;
    const wristX = px + 10;
    const wristY = py - 10;
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
    ctx.rotate(side * -0.25);

    ctx.strokeStyle = '#1a1a1a';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(-side * 4, 10);
    ctx.lineTo(-side * 16, 26);
    ctx.moveTo(side * 2, 10);
    ctx.lineTo(-side * 10, 30);
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
    ctx.lineTo(side * 16, 18);
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

  function render() {
    const theme = currentTheme();
    const tierGroup = Math.min(2, Math.floor((save.upgrades.spring + save.upgrades.boost) / 4));
    if (webAssist.active && performance.now() - webAssist.startTime > WEB_ASSIST_DURATION) {
      webAssist.active = false;
    }
    drawBackground(theme);
    drawGround(theme);
    drawTrampoline(tierGroup);
    drawCoins();
    drawCharacter(theme);
    if (currentLevel().webAssist && webAssist.active) drawWebAssist();
    drawParticles();
  }

  // ---------- Main loop ----------
  function loop(now) {
    const dt = lastTime ? Math.min(2.4, (now - lastTime) / (1000 / 60)) : 1;
    lastTime = now;

    if (state === STATE.PLAYING) {
      updatePhysics(dt);
      render();
    } else if (state === STATE.COMPLETE) {
      updateParticles(dt);
      updateClouds(dt);
      render();
    } else if (state === STATE.MENU || state === STATE.HOWTO || state === STATE.SHOP) {
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

      const card = document.createElement('div');
      card.className = 'upgrade-card';

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
      desc.textContent = maxed ? `${def.descFor(tier)} — en üst seviyeye ulaştı!` : `${def.descFor(tier)} → +${def.key === 'spring' ? SPRING_STEP.toFixed(1) : BOOST_STEP.toFixed(1)} sonraki seviyede`;

      const buyRow = document.createElement('div');
      buyRow.className = 'upgrade-buy-row';
      const costEl = document.createElement('span');
      costEl.className = 'upgrade-cost';
      costEl.textContent = maxed ? 'MAKS' : `${cost} 🪙`;
      const buyBtn = document.createElement('button');
      buyBtn.className = 'upgrade-buy-btn';
      buyBtn.textContent = maxed ? 'TAMAM' : 'YÜKSELT';
      buyBtn.disabled = maxed || save.gold < cost;
      buyBtn.addEventListener('click', () => {
        if (maxed || save.gold < UPGRADE_COSTS[save.upgrades[def.key]]) return;
        save.gold -= UPGRADE_COSTS[save.upgrades[def.key]];
        save.upgrades[def.key] += 1;
        persist();
        playPurchase();
        renderShop();
      });
      buyRow.append(costEl, buyBtn);

      card.append(top, desc, buyRow);
      upgradeList.appendChild(card);
    });
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
    renderShop();
    showScreen('shop');
  });
  document.getElementById('shopBackBtn').addEventListener('click', () => {
    state = STATE.MENU;
    renderMenu();
    showScreen('menu');
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
