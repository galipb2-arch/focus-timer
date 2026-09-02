(() => {
  const DURATIONS = { focus: 25 * 60, short: 5 * 60, long: 15 * 60 };
  const POMOS_BEFORE_LONG_BREAK = 4;
  const STORAGE_KEY = 'focusTimer.v1';

  const GROWTH_WINDOW = 24 * 60;
  const RIPEN_WINDOW = DURATIONS.focus - GROWTH_WINDOW;
  const GROUND_Y = 102;
  const MAX_STEM_HEIGHT = 60;
  let isFalling = false;
  let fallResetHandle = null;

  const state = load() ?? {
    mode: 'focus',
    tasks: [],
    activeTaskId: null,
    pomosCompleted: 0,
    streak: { count: 0, lastCompletedDate: null },
  };

  let secondsLeft = DURATIONS[state.mode];
  let running = false;
  let endTimestamp = null;
  let tickHandle = null;

  const els = {
    body: document.body,
    modeBtns: document.querySelectorAll('.mode-btn'),
    ringProgress: document.getElementById('ringProgress'),
    timeLeft: document.getElementById('timeLeft'),
    activeTaskLabel: document.getElementById('activeTaskLabel'),
    startPauseBtn: document.getElementById('startPauseBtn'),
    resetBtn: document.getElementById('resetBtn'),
    skipBtn: document.getElementById('skipBtn'),
    pomoDots: document.getElementById('pomoDots'),
    taskForm: document.getElementById('taskForm'),
    taskInput: document.getElementById('taskInput'),
    taskList: document.getElementById('taskList'),
    streakCount: document.getElementById('streakCount'),
    timerCard: document.getElementById('timerCard'),
    celebrate: document.getElementById('celebrate'),
    sprout: document.getElementById('sprout'),
    stem: document.getElementById('stem'),
    leaf1: document.getElementById('leaf1'),
    leaf2: document.getElementById('leaf2'),
    tomatoAnchor: document.getElementById('tomatoAnchor'),
    tomatoGroup: document.getElementById('tomatoGroup'),
    tomato: document.getElementById('tomato'),
    gardenCaption: document.getElementById('gardenCaption'),
  };

  const RING_CIRCUMFERENCE = 2 * Math.PI * 100;
  els.ringProgress.style.strokeDasharray = `${RING_CIRCUMFERENCE}`;

  function load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  function save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {}
  }

  function formatTime(totalSeconds) {
    const m = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
    const s = Math.floor(totalSeconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  }

  function setMode(mode, resetTime = true) {
    state.mode = mode;
    els.body.dataset.mode = mode;
    els.modeBtns.forEach(btn => btn.classList.toggle('active', btn.dataset.mode === mode));
    if (resetTime) {
      stopTicking();
      secondsLeft = DURATIONS[mode];
      running = false;
      updateStartPauseBtn();
      renderRing();
      renderTime();
      resetGarden();
    }
    save();
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function lerpColor(from, to, t) {
    const r = Math.round(from[0] + (to[0] - from[0]) * t);
    const g = Math.round(from[1] + (to[1] - from[1]) * t);
    const b = Math.round(from[2] + (to[2] - from[2]) * t);
    return `rgb(${r}, ${g}, ${b})`;
  }

  function getGardenMetrics() {
    const total = DURATIONS.focus;
    const elapsed = clamp(total - secondsLeft, 0, total);
    const growth = clamp(elapsed / GROWTH_WINDOW, 0, 1);
    const ripeness = clamp((elapsed - GROWTH_WINDOW) / RIPEN_WINDOW, 0, 1);
    return { elapsed, growth, ripeness };
  }

  function renderGarden() {
    if (state.mode !== 'focus' || isFalling) return;
    const { elapsed, growth, ripeness } = getGardenMetrics();

    els.sprout.style.opacity = elapsed <= 0 ? 0 : clamp(1 - growth / 0.15, 0, 1);

    const stemHeight = MAX_STEM_HEIGHT * growth;
    els.stem.style.transform = `scaleY(${growth})`;

    const leaf1Scale = clamp((growth - 0.25) / 0.15, 0, 1);
    const leaf1Y = GROUND_Y - stemHeight * 0.45;
    els.leaf1.style.transform = `translate(100px, ${leaf1Y}px) scale(${leaf1Scale})`;

    const leaf2Scale = clamp((growth - 0.5) / 0.15, 0, 1);
    const leaf2Y = GROUND_Y - stemHeight * 0.72;
    els.leaf2.style.transform = `translate(100px, ${leaf2Y}px) scale(${leaf2Scale})`;

    const tomatoScale = clamp((growth - 0.4) / 0.6, 0, 1);
    const tomatoY = GROUND_Y - stemHeight - 6;
    els.tomatoAnchor.style.transform = `translate(100px, ${tomatoY}px)`;
    els.tomatoGroup.style.transform = `scale(${tomatoScale})`;

    els.tomato.style.fill = lerpColor([91, 191, 90], [230, 60, 48], ripeness);
    els.tomato.style.filter = ripeness > 0.02
      ? `drop-shadow(0 0 ${4 + 8 * ripeness}px rgba(255, 70, 50, ${0.3 + 0.4 * ripeness}))`
      : 'drop-shadow(0 0 4px rgba(110, 220, 110, 0.35))';

    if (els.gardenCaption) {
      els.gardenCaption.textContent =
        growth < 0.04 ? 'Tohum ekildi 🌱' :
        growth < 0.15 ? 'Filizleniyor…' :
        ripeness >= 1 ? 'Olgunlaştı! 🍅' :
        ripeness > 0 ? 'Kızarıyor…' :
        'Büyüyor 🌿';
    }
  }

  function resetGarden() {
    els.sprout.style.opacity = 0;
    els.stem.style.transform = 'scaleY(0)';
    els.leaf1.style.transform = 'translate(100px, 102px) scale(0)';
    els.leaf2.style.transform = 'translate(100px, 102px) scale(0)';
    if (!isFalling) {
      els.tomatoAnchor.style.transform = `translate(100px, ${GROUND_Y - 6}px)`;
      els.tomatoGroup.style.transform = 'scale(0)';
      els.tomato.style.fill = '#5bbf5a';
      els.tomato.style.filter = 'none';
    }
    if (els.gardenCaption) els.gardenCaption.textContent = 'Tohum ekildi 🌱';
  }

  function triggerFall() {
    isFalling = true;
    const dir = Math.random() < 0.5 ? -1 : 1;
    els.tomatoAnchor.classList.add('falling');
    els.tomatoAnchor.style.transform = `translate(${100 + dir * 7}px, ${GROUND_Y}px) rotate(${dir * 220}deg) scale(0.9)`;
    clearTimeout(fallResetHandle);
    fallResetHandle = setTimeout(() => {
      els.tomatoAnchor.classList.remove('falling');
      isFalling = false;
      resetGarden();
    }, 700);
  }

  function renderRing() {
    const total = DURATIONS[state.mode];
    const fraction = secondsLeft / total;
    els.ringProgress.style.strokeDashoffset = `${RING_CIRCUMFERENCE * (1 - fraction)}`;
  }

  function renderTime() {
    els.timeLeft.textContent = formatTime(secondsLeft);
    document.title = running ? `${formatTime(secondsLeft)} · Uzay Domatesi` : 'Uzay Domatesi';
  }

  function updateStartPauseBtn() {
    els.startPauseBtn.textContent = running ? 'Pause' : 'Start';
  }

  function tick() {
    const now = Date.now();
    secondsLeft = Math.max(0, Math.round((endTimestamp - now) / 1000));
    renderTime();
    renderRing();
    renderGarden();
    if (secondsLeft <= 0) {
      completeSession();
    }
  }

  function startTicking() {
    endTimestamp = Date.now() + secondsLeft * 1000;
    tickHandle = setInterval(tick, 250);
  }

  function stopTicking() {
    if (tickHandle) {
      clearInterval(tickHandle);
      tickHandle = null;
    }
  }

  function toggleStartPause() {
    running = !running;
    if (running) {
      if (secondsLeft <= 0) secondsLeft = DURATIONS[state.mode];
      startTicking();
    } else {
      stopTicking();
      endTimestamp = null;
    }
    updateStartPauseBtn();
  }

  function resetTimer() {
    stopTicking();
    running = false;
    secondsLeft = DURATIONS[state.mode];
    updateStartPauseBtn();
    renderRing();
    renderTime();
    clearTimeout(fallResetHandle);
    isFalling = false;
    els.tomatoAnchor.classList.remove('falling');
    resetGarden();
  }

  function skipTimer() {
    stopTicking();
    running = false;
    completeSession(true);
  }

  function completeSession(skipped = false) {
    stopTicking();
    running = false;
    updateStartPauseBtn();

    const finishedMode = state.mode;

    if (finishedMode === 'focus') {
      if (!skipped) {
        state.pomosCompleted += 1;
        bumpStreak();
        if (state.activeTaskId) {
          const task = state.tasks.find(t => t.id === state.activeTaskId);
          if (task) task.pomos = (task.pomos || 0) + 1;
        }
        playChime();
        celebrate();
      }
      triggerFall();
      const nextMode = state.pomosCompleted % POMOS_BEFORE_LONG_BREAK === 0 ? 'long' : 'short';
      setMode(nextMode);
    } else {
      if (!skipped) playChime();
      setMode('focus');
    }

    renderAll();
  }

  function bumpStreak() {
    const today = new Date().toDateString();
    if (state.streak.lastCompletedDate === today) return;
    const yesterday = new Date(Date.now() - 86400000).toDateString();
    if (state.streak.lastCompletedDate === yesterday) {
      state.streak.count += 1;
    } else {
      state.streak.count = 1;
    }
    state.streak.lastCompletedDate = today;
  }

  function playChime() {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const notes = [523.25, 659.25, 783.99];
      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0, ctx.currentTime + i * 0.12);
        gain.gain.linearRampToValueAtTime(0.15, ctx.currentTime + i * 0.12 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.12 + 0.4);
        osc.connect(gain).connect(ctx.destination);
        osc.start(ctx.currentTime + i * 0.12);
        osc.stop(ctx.currentTime + i * 0.12 + 0.4);
      });
    } catch {}
  }

  function celebrate() {
    els.timerCard.classList.remove('pulse');
    void els.timerCard.offsetWidth;
    els.timerCard.classList.add('pulse');

    const colors = ['#e2583e', '#f2b134', '#3e8ee2', '#4caf7d'];
    for (let i = 0; i < 30; i++) {
      const piece = document.createElement('div');
      piece.className = 'confetti';
      piece.style.left = `${Math.random() * 100}vw`;
      piece.style.background = colors[Math.floor(Math.random() * colors.length)];
      piece.style.animationDuration = `${1.2 + Math.random() * 1.2}s`;
      piece.style.animationDelay = `${Math.random() * 0.3}s`;
      els.celebrate.appendChild(piece);
      setTimeout(() => piece.remove(), 3000);
    }
  }

  function renderPomoDots() {
    els.pomoDots.innerHTML = '';
    const filled = state.pomosCompleted % POMOS_BEFORE_LONG_BREAK;
    for (let i = 0; i < POMOS_BEFORE_LONG_BREAK; i++) {
      const dot = document.createElement('span');
      dot.className = 'dot' + (i < filled ? ' filled' : '');
      els.pomoDots.appendChild(dot);
    }
  }

  function renderStreak() {
    els.streakCount.textContent = state.streak.count;
  }

  function renderActiveTaskLabel() {
    const task = state.tasks.find(t => t.id === state.activeTaskId);
    els.activeTaskLabel.textContent = task ? task.text : 'No task selected';
  }

  function renderTasks() {
    els.taskList.innerHTML = '';
    if (state.tasks.length === 0) {
      const empty = document.createElement('li');
      empty.className = 'empty-state';
      empty.textContent = 'No tasks yet. Add one to focus on.';
      els.taskList.appendChild(empty);
      return;
    }
    state.tasks.forEach(task => {
      const li = document.createElement('li');
      li.className = 'task-item' + (task.done ? ' done' : '') + (task.id === state.activeTaskId ? ' selected' : '');

      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.checked = task.done;
      checkbox.addEventListener('click', e => e.stopPropagation());
      checkbox.addEventListener('change', () => {
        task.done = checkbox.checked;
        save();
        renderTasks();
      });

      const text = document.createElement('span');
      text.className = 'task-text';
      text.textContent = task.text;

      const pomoCount = document.createElement('span');
      pomoCount.className = 'pomo-count';
      pomoCount.textContent = task.pomos ? `🍅 ${task.pomos}` : '';

      const removeBtn = document.createElement('button');
      removeBtn.className = 'remove-btn';
      removeBtn.textContent = '✕';
      removeBtn.addEventListener('click', e => {
        e.stopPropagation();
        state.tasks = state.tasks.filter(t => t.id !== task.id);
        if (state.activeTaskId === task.id) state.activeTaskId = null;
        save();
        renderAll();
      });

      li.addEventListener('click', () => {
        state.activeTaskId = task.id === state.activeTaskId ? null : task.id;
        save();
        renderTasks();
        renderActiveTaskLabel();
      });

      li.append(checkbox, text, pomoCount, removeBtn);
      els.taskList.appendChild(li);
    });
  }

  function renderAll() {
    renderRing();
    renderTime();
    renderGarden();
    renderPomoDots();
    renderStreak();
    renderActiveTaskLabel();
    renderTasks();
    updateStartPauseBtn();
  }

  els.modeBtns.forEach(btn => {
    btn.addEventListener('click', () => setMode(btn.dataset.mode));
  });

  els.startPauseBtn.addEventListener('click', toggleStartPause);
  els.resetBtn.addEventListener('click', resetTimer);
  els.skipBtn.addEventListener('click', skipTimer);

  els.taskForm.addEventListener('submit', e => {
    e.preventDefault();
    const text = els.taskInput.value.trim();
    if (!text) return;
    const task = { id: crypto.randomUUID(), text, done: false, pomos: 0 };
    state.tasks.push(task);
    if (!state.activeTaskId) state.activeTaskId = task.id;
    els.taskInput.value = '';
    save();
    renderTasks();
    renderActiveTaskLabel();
  });

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && running && endTimestamp) {
      tick();
    }
  });

  els.body.dataset.mode = state.mode;
  els.modeBtns.forEach(btn => btn.classList.toggle('active', btn.dataset.mode === state.mode));
  secondsLeft = DURATIONS[state.mode];
  renderAll();
})();
