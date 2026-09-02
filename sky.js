(() => {
  const canvas = document.getElementById('sky');
  const ctx = canvas.getContext('2d');
  let width, height, stars, shootingStars = [];

  function resize() {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
    const starCount = Math.floor((width * height) / 1800);
    stars = Array.from({ length: starCount }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      r: Math.random() * 1.3 + 0.2,
      baseAlpha: Math.random() * 0.6 + 0.3,
      twinkleSpeed: Math.random() * 0.02 + 0.005,
      phase: Math.random() * Math.PI * 2,
    }));
  }

  function maybeSpawnShootingStar() {
    if (Math.random() < 0.004 && shootingStars.length < 2) {
      const startX = Math.random() * width * 0.6 + width * 0.2;
      shootingStars.push({
        x: startX,
        y: -10,
        vx: -4 - Math.random() * 3,
        vy: 5 + Math.random() * 3,
        life: 1,
      });
    }
  }

  function draw() {
    ctx.fillStyle = '#04030a';
    ctx.fillRect(0, 0, width, height);

    const bgGrad = ctx.createRadialGradient(
      width * 0.5, height * 0.4, 0,
      width * 0.5, height * 0.4, Math.max(width, height) * 0.8
    );
    bgGrad.addColorStop(0, '#0c0a1e');
    bgGrad.addColorStop(0.5, '#070512');
    bgGrad.addColorStop(1, '#020104');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    const t = Date.now() * 0.001;
    for (const s of stars) {
      const alpha = s.baseAlpha + Math.sin(t * s.twinkleSpeed * 40 + s.phase) * 0.25;
      ctx.beginPath();
      ctx.fillStyle = `rgba(255, 255, 255, ${Math.max(0, Math.min(1, alpha))})`;
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    }

    maybeSpawnShootingStar();
    shootingStars.forEach(star => {
      ctx.save();
      const grad = ctx.createLinearGradient(star.x, star.y, star.x - star.vx * 8, star.y - star.vy * 8);
      grad.addColorStop(0, `rgba(255, 245, 220, ${star.life})`);
      grad.addColorStop(1, 'rgba(255, 245, 220, 0)');
      ctx.strokeStyle = grad;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(star.x, star.y);
      ctx.lineTo(star.x - star.vx * 8, star.y - star.vy * 8);
      ctx.stroke();
      ctx.restore();
      star.x += star.vx;
      star.y += star.vy;
      star.life -= 0.02;
    });
    shootingStars = shootingStars.filter(s => s.life > 0 && s.y < height + 20);

    requestAnimationFrame(draw);
  }

  window.addEventListener('resize', resize);
  resize();
  draw();
})();
