(() => {
  const CANVAS_W = 390;
  const CANVAS_H = 844;
  const CENTER_X = CANVAS_W / 2;

  const TRAMPOLINE_Y = 700; // world-y of trampoline surface
  const GROUND_Y = 760;
  const CHAR_RADIUS = 25;

  const GRAVITY = 0.5;
  const BASE_BOUNCE = -15;
  const BOOST_IMPULSE = -3.6;
  const MAX_BOOSTS_PER_CYCLE = 5;
  const BOOST_COOLDOWN_MS = 100;

  const CAMERA_FOLLOW_Y = 300; // once char rises above this, camera scrolls with it

  const COIN_HEIGHTS = [180, 270, 350, 440, 530, 620]; // above trampoline surface, increasing difficulty
  const TOTAL_COINS = COIN_HEIGHTS.length;

  // ---------- DOM ----------
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  const phoneFrame = document.getElementById('phoneFrame');

  const screens = {
    loading: document.getElementById('loadingScreen'),
    menu: document.getElementById('menuScreen'),
    howto: document.getElementById('howtoScreen'),
    complete: document.getElementById('completeScreen'),
  };
  const hud = document.getElementById('hud');
  const loadingFill = document.getElementById('loadingFill');
  const loadingLabel = document.getElementById('loadingLabel');
  const coinCountEl = document.getElementById('coinCount');
  const coinTotalEl = document.getElementById('coinTotal');
  const heightFill = document.getElementById('heightFill');
  const confettiLayer = document.getElementById('confettiLayer');

  coinTotalEl.textContent = TOTAL_COINS;

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
    const t = a.currentTime;
    tone(a, 180, t, 0.16, { type: 'sine', gain: 0.16, glideTo: 90 });
  }

  function playBoost() {
    const a = audio();
    if (!a) return;
    const t = a.currentTime;
    tone(a, 520, t, 0.08, { type: 'triangle', gain: 0.08, glideTo: 700 });
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
    const melody = [784, 988, 1175, 1568];
    melody.forEach((freq, i) => {
      tone(a, freq, t + i * 0.14, 0.5, { type: 'triangle', gain: 0.15 });
    });
  }

  // ---------- Game state ----------
  const STATE = { LOADING: 'loading', MENU: 'menu', HOWTO: 'howto', PLAYING: 'playing', COMPLETE: 'complete' };
  let state = STATE.LOADING;

  const player = {
    y: TRAMPOLINE_Y - CHAR_RADIUS,
    vy: 0,
    squash: 0,       // 0..1 landing squash animation
    boostCount: 0,
    lastBoostAt: 0,
    maskOff: 0,       // 0 = masked, 1 = fully unmasked
    facing: 1,
  };

  let coins = [];
  let particles = [];
  let cameraOffset = 0;
  let maxHeightReached = 0;
  let collectedCount = 0;
  let animFrame = null;
  let lastTime = 0;

  function resetLevel() {
    player.y = TRAMPOLINE_Y - CHAR_RADIUS;
    player.vy = 0;
    player.squash = 0;
    player.boostCount = 0;
    player.maskOff = 0;
    coins = COIN_HEIGHTS.map(h => ({ worldY: TRAMPOLINE_Y - h, collected: false, wobble: Math.random() * Math.PI * 2 }));
    particles = [];
    cameraOffset = 0;
    maxHeightReached = 0;
    collectedCount = 0;
    coinCountEl.textContent = '0';
    heightFill.style.height = '0%';
  }

  // ---------- Input ----------
  function handleTap() {
    if (state !== STATE.PLAYING) return;
    const now = performance.now();
    const airborne = player.y < TRAMPOLINE_Y - CHAR_RADIUS - 1;
    if (airborne && player.boostCount < MAX_BOOSTS_PER_CYCLE && now - player.lastBoostAt > BOOST_COOLDOWN_MS) {
      player.vy += BOOST_IMPULSE;
      player.boostCount += 1;
      player.lastBoostAt = now;
      playBoost();
      spawnParticles(CENTER_X, player.y + cameraOffset, 6, '#ffe28a');
    }
  }

  phoneFrame.addEventListener('pointerdown', (e) => {
    // Ignore taps on DOM buttons (they have their own handlers)
    if (e.target.closest('.screen')) return;
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

    // Trampoline collision
    if (player.vy > 0 && player.y + CHAR_RADIUS >= TRAMPOLINE_Y) {
      player.y = TRAMPOLINE_Y - CHAR_RADIUS;
      player.vy = BASE_BOUNCE;
      player.boostCount = 0;
      player.squash = 1;
      playBoing();
      spawnParticles(CENTER_X, TRAMPOLINE_Y + cameraOffset - 6, 5, '#bfe8ff');
    }

    // Camera follows upward climbs
    cameraOffset = Math.max(0, CAMERA_FOLLOW_Y - player.y);

    const heightAboveTrampoline = Math.max(0, TRAMPOLINE_Y - player.y);
    if (heightAboveTrampoline > maxHeightReached) maxHeightReached = heightAboveTrampoline;

    // Coin collection
    coins.forEach(coin => {
      if (coin.collected) return;
      const d = Math.abs(coin.worldY - player.y);
      if (d < CHAR_RADIUS + 16) {
        coin.collected = true;
        collectedCount += 1;
        coinCountEl.textContent = String(collectedCount);
        playGoldChime();
        spawnParticles(CENTER_X, coin.worldY + cameraOffset, 14, '#ffd24a');
        if (collectedCount >= TOTAL_COINS) {
          triggerLevelComplete();
        }
      }
    });

    // HUD height bar (progress toward the highest coin)
    const topGoal = COIN_HEIGHTS[COIN_HEIGHTS.length - 1];
    const pct = Math.min(100, (maxHeightReached / topGoal) * 100);
    heightFill.style.height = `${pct}%`;

    updateParticles(dt);
  }

  function triggerLevelComplete() {
    state = STATE.COMPLETE;
    playFanfare();
    // animate mask coming off over ~900ms, then show overlay
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

  // ---------- Drawing ----------
  function drawBackground() {
    // Sky gradient shifts lighter/bluer the higher the camera has scrolled
    const climb = Math.min(1, cameraOffset / 500);
    const skyTop = lerpColor([12, 58, 32], [135, 206, 250], climb);
    const skyBot = lerpColor([22, 74, 43], [200, 235, 255], climb);
    const grad = ctx.createLinearGradient(0, 0, 0, CANVAS_H);
    grad.addColorStop(0, skyTop);
    grad.addColorStop(1, skyBot);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

    drawTreeLayer(0.35, 150, '#0f3d22', 1);
    drawTreeLayer(0.6, 120, '#155a2e', 2);
    drawTreeLayer(1.0, 95, '#1c7a3c', 3);
  }

  function lerpColor(a, b, t) {
    const r = Math.round(a[0] + (b[0] - a[0]) * t);
    const g = Math.round(a[1] + (b[1] - a[1]) * t);
    const bch = Math.round(a[2] + (b[2] - a[2]) * t);
    return `rgb(${r}, ${g}, ${bch})`;
  }

  function drawTreeLayer(parallax, spacing, color, seedOffset) {
    // Infinite vertical tiling: as the camera scrolls, rows cycle through
    // one "spacing" period so trees always fill the screen while climbing.
    const scroll = cameraOffset * parallax;
    const rowStart = -1;
    const rowEnd = Math.ceil(CANVAS_H / spacing) + 2;
    ctx.fillStyle = color;
    for (let i = rowStart; i < rowEnd; i++) {
      const y = i * spacing - (scroll % spacing);
      const seed = (i + seedOffset * 13) * 12.9898;
      const xJitter = (Math.sin(seed) * 0.5 + 0.5) * 130;
      for (let x = -60; x < CANVAS_W + 60; x += 130) {
        const tx = ((x + xJitter) % (CANVAS_W + 120)) - 60;
        drawTree(tx, y, 0.7 + parallax * 0.6);
      }
    }
  }

  function drawTree(x, y, scale) {
    if (y < -120 || y > CANVAS_H + 120) return;
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);
    ctx.fillStyle = 'rgba(0,0,0,0.15)';
    ctx.beginPath();
    ctx.ellipse(0, 46, 30, 8, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#5b3a22';
    ctx.fillRect(-5, 10, 10, 30);
    ctx.beginPath();
    ctx.moveTo(0, -60);
    ctx.lineTo(34, 18);
    ctx.lineTo(-34, 18);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(0, -38);
    ctx.lineTo(26, 2);
    ctx.lineTo(-26, 2);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  function drawGround() {
    const y = GROUND_Y + cameraOffset;
    if (y > CANVAS_H + 40 || y < -40) return;
    ctx.fillStyle = '#0a2c17';
    ctx.fillRect(0, y, CANVAS_W, CANVAS_H - y + 200);
    ctx.fillStyle = '#175c30';
    ctx.fillRect(0, y, CANVAS_W, 14);
  }

  function drawTrampoline() {
    const y = TRAMPOLINE_Y + cameraOffset;
    if (y > CANVAS_H + 60 || y < -60) return;
    const squashAmt = player.squash;
    const rx = 62 + squashAmt * 14;
    const ry = 16 - squashAmt * 6;

    ctx.save();
    ctx.translate(CENTER_X, y);

    // legs
    ctx.strokeStyle = '#2b2b2b';
    ctx.lineWidth = 5;
    [-40, 40].forEach(dx => {
      ctx.beginPath();
      ctx.moveTo(dx * 0.9, 4);
      ctx.lineTo(dx * 1.3, 34);
      ctx.stroke();
    });

    // frame ring
    ctx.beginPath();
    ctx.ellipse(0, 0, rx + 8, ry + 8, 0, 0, Math.PI * 2);
    ctx.strokeStyle = '#1f1f1f';
    ctx.lineWidth = 6;
    ctx.stroke();

    // springs
    ctx.strokeStyle = '#8a8f98';
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

    // mat
    const matGrad = ctx.createRadialGradient(0, -ry * 0.3, 4, 0, 0, rx);
    matGrad.addColorStop(0, '#2f6fe0');
    matGrad.addColorStop(1, '#1b4bb0');
    ctx.beginPath();
    ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
    ctx.fillStyle = matGrad;
    ctx.fill();

    ctx.restore();
  }

  function drawCharacter() {
    const y = player.y + cameraOffset;
    const squash = player.squash;
    const scaleX = 1 + squash * 0.18;
    const scaleY = 1 - squash * 0.22;

    ctx.save();
    ctx.translate(CENTER_X, y);
    ctx.scale(scaleX, scaleY);

    // shadow handled by trampoline; draw legs
    ctx.fillStyle = '#1c3f7a';
    ctx.beginPath();
    ctx.roundRect(-14, 10, 10, 20, 5);
    ctx.roundRect(4, 10, 10, 20, 5);
    ctx.fill();

    // body (jumpsuit)
    const bodyGrad = ctx.createLinearGradient(0, -18, 0, 16);
    bodyGrad.addColorStop(0, '#3a7bd5');
    bodyGrad.addColorStop(1, '#215aa8');
    ctx.fillStyle = bodyGrad;
    ctx.beginPath();
    ctx.roundRect(-16, -16, 32, 32, 14);
    ctx.fill();

    // arms
    ctx.fillStyle = '#215aa8';
    ctx.beginPath();
    ctx.roundRect(-24, -10, 9, 20, 4);
    ctx.roundRect(15, -10, 9, 20, 4);
    ctx.fill();

    // head
    const skinColor = '#f2c199';
    ctx.fillStyle = skinColor;
    ctx.beginPath();
    ctx.arc(0, -26, 15, 0, Math.PI * 2);
    ctx.fill();

    const maskOff = player.maskOff; // 0 masked -> 1 fully revealed

    // eyes (always drawn; mask covers them when maskOff is low)
    ctx.fillStyle = '#20140c';
    ctx.beginPath();
    ctx.arc(-5, -27, 1.8, 0, Math.PI * 2);
    ctx.arc(5, -27, 1.8, 0, Math.PI * 2);
    ctx.fill();

    // smile appears as mask comes off
    if (maskOff > 0.15) {
      ctx.strokeStyle = '#8a4a2c';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.arc(0, -21, 5, 0.15 * Math.PI, 0.85 * Math.PI);
      ctx.stroke();
    }

    // black mask band, slides off upward and fades out
    if (maskOff < 1) {
      ctx.save();
      ctx.globalAlpha = 1 - maskOff;
      ctx.translate(0, -maskOff * 30);
      ctx.fillStyle = '#151515';
      ctx.beginPath();
      ctx.roundRect(-15.5, -31, 31, 11, 5);
      ctx.fill();
      // eye slits
      ctx.fillStyle = '#151515';
      ctx.beginPath();
      ctx.ellipse(-5, -27, 3.4, 2.6, 0, 0, Math.PI * 2);
      ctx.ellipse(5, -27, 3.4, 2.6, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // little hair tuft once unmasked
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

  function drawCoins() {
    coins.forEach(coin => {
      if (coin.collected) return;
      const y = coin.worldY + cameraOffset;
      if (y < -40 || y > CANVAS_H + 40) return;
      coin.wobble += 0.06;
      const bob = Math.sin(coin.wobble) * 5;

      ctx.save();
      ctx.translate(CENTER_X, y + bob);
      const spin = Math.sin(coin.wobble * 0.7);
      ctx.scale(Math.max(0.25, Math.abs(spin)), 1);

      const grad = ctx.createRadialGradient(-4, -4, 2, 0, 0, 16);
      grad.addColorStop(0, '#fff3b0');
      grad.addColorStop(0.5, '#ffd24a');
      grad.addColorStop(1, '#c98d00');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(0, 0, 16, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#a86e00';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.restore();

      // sparkle glow
      ctx.save();
      ctx.globalAlpha = 0.5 + 0.3 * Math.sin(coin.wobble * 1.5);
      ctx.fillStyle = '#fff6d0';
      ctx.beginPath();
      ctx.arc(CENTER_X, y + bob, 22, 0, Math.PI * 2);
      ctx.filter = 'blur(6px)';
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha *= 0.15;
      ctx.fill();
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

  function render() {
    drawBackground();
    drawGround();
    drawTrampoline();
    drawCoins();
    drawCharacter();
    drawParticles();
  }

  // ---------- Main loop ----------
  function loop(now) {
    const dt = lastTime ? Math.min(2.4, (now - lastTime) / (1000 / 60)) : 1;
    lastTime = now;

    if (state === STATE.PLAYING || state === STATE.COMPLETE) {
      if (state === STATE.PLAYING) updatePhysics(dt);
      else {
        // gentle drift down during the mask-off celebration
        updateParticles(dt);
      }
      render();
    } else if (state === STATE.MENU || state === STATE.HOWTO) {
      // idle bounce preview behind the menu screens
      idlePreview(dt);
      render();
    }

    animFrame = requestAnimationFrame(loop);
  }

  function idlePreview(dt) {
    // Simple pre-scripted bounce loop for background flavor (no scoring)
    player.vy += GRAVITY * dt;
    player.y += player.vy * dt;
    if (player.squash > 0) player.squash = Math.max(0, player.squash - 0.06 * dt);
    if (player.vy > 0 && player.y + CHAR_RADIUS >= TRAMPOLINE_Y) {
      player.y = TRAMPOLINE_Y - CHAR_RADIUS;
      player.vy = BASE_BOUNCE * 0.75;
      player.squash = 1;
    }
    cameraOffset = 0;
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
          showScreen('menu');
        }, 250);
      }
      loadingFill.style.width = `${pct}%`;
      loadingLabel.textContent = `Orman hazırlanıyor… ${Math.floor(pct)}%`;
    }, 140);
  }

  // ---------- Button wiring ----------
  document.getElementById('startBtn').addEventListener('click', () => {
    audio(); // unlock audio on user gesture
    resetLevel();
    state = STATE.PLAYING;
    showScreen(null);
    hud.hidden = false;
  });

  document.getElementById('howtoBtn').addEventListener('click', () => {
    state = STATE.HOWTO;
    showScreen('howto');
  });

  document.getElementById('howtoBackBtn').addEventListener('click', () => {
    state = STATE.MENU;
    showScreen('menu');
  });

  document.getElementById('howtoStartBtn').addEventListener('click', () => {
    audio();
    resetLevel();
    state = STATE.PLAYING;
    showScreen(null);
    hud.hidden = false;
  });

  document.getElementById('replayBtn').addEventListener('click', () => {
    resetLevel();
    state = STATE.PLAYING;
    showScreen(null);
    hud.hidden = false;
  });

  document.getElementById('menuBtn').addEventListener('click', () => {
    state = STATE.MENU;
    showScreen('menu');
  });

  // ---------- Boot ----------
  resetLevel();
  runLoadingSequence();
  animFrame = requestAnimationFrame(loop);
})();
