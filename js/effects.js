// ---------------------------------------------------------------------------
// Efectos visuales: partículas, textos flotantes, temblor de cámara y fondo
// ---------------------------------------------------------------------------
const FX = (() => {
  let particles = [];
  let texts = [];
  let shake = 0;
  let flash = 0; // destello rojo al recibir daño
  let bolts = [];

  const stars = Array.from({ length: 90 }, () => ({
    x: rand(0, W),
    y: rand(0, H),
    s: rand(0.6, 2.2),
    v: rand(20, 70),
    tw: rand(0, Math.PI * 2),
  }));

  function burst(x, y, count, colors, speed = 260, size = [2, 5]) {
    for (let i = 0; i < count; i++) {
      const a = rand(0, Math.PI * 2);
      const v = rand(speed * 0.3, speed);
      particles.push({
        x,
        y,
        vx: Math.cos(a) * v,
        vy: Math.sin(a) * v,
        life: rand(0.4, 0.9),
        max: 0.9,
        size: rand(size[0], size[1]),
        color: pick(colors),
        spin: rand(-6, 6),
        rot: rand(0, Math.PI),
      });
    }
  }

  function text(x, y, str, color = COLORS.gold, size = 34) {
    texts.push({ x, y, str, color, size, life: 1, vy: -70 });
  }

  function update(dt) {
    particles = particles.filter((p) => {
      p.life -= dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 320 * dt; // gravedad suave, como purpurina cayendo
      p.vx *= 0.98;
      p.rot += p.spin * dt;
      return p.life > 0;
    });
    texts = texts.filter((t) => {
      t.life -= dt * 0.9;
      t.y += t.vy * dt;
      return t.life > 0;
    });
    bolts = bolts.filter((b) => (b.life -= dt) > 0);
    shake = Math.max(0, shake - dt * 30);
    flash = Math.max(0, flash - dt * 2.2);
    stars.forEach((s) => {
      s.y += s.v * dt;
      s.tw += dt * 3;
      if (s.y > H) {
        s.y = -4;
        s.x = rand(0, W);
      }
    });
  }

  function drawBackground(ctx, t) {
    // Degradado base
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, "#14031f");
    g.addColorStop(0.55, "#2b0647");
    g.addColorStop(1, "#4a0b5e");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);

    // Focos que barren el escenario
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    [
      { x: W * 0.2, c: "rgba(255,79,216,0.10)", s: 0.6, o: 0 },
      { x: W * 0.8, c: "rgba(83,242,255,0.09)", s: 0.5, o: 2 },
      { x: W * 0.5, c: "rgba(255,216,77,0.07)", s: 0.35, o: 4 },
    ].forEach((l) => {
      const ang = Math.sin(t * l.s + l.o) * 0.45;
      ctx.save();
      ctx.translate(l.x, -20);
      ctx.rotate(ang);
      const lg = ctx.createLinearGradient(0, 0, 0, H);
      lg.addColorStop(0, l.c);
      lg.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = lg;
      ctx.beginPath();
      ctx.moveTo(-20, 0);
      ctx.lineTo(20, 0);
      ctx.lineTo(220, H + 40);
      ctx.lineTo(-220, H + 40);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    });
    ctx.restore();

    // Purpurina de fondo
    stars.forEach((s) => {
      ctx.globalAlpha = 0.35 + Math.sin(s.tw) * 0.25;
      ctx.fillStyle = s.s > 1.6 ? COLORS.pinkSoft : "#ffffff";
      ctx.fillRect(s.x, s.y, s.s, s.s);
    });
    ctx.globalAlpha = 1;

    // Pasarela en perspectiva
    const horizon = H * 0.5;
    ctx.save();
    ctx.strokeStyle = "rgba(255,79,216,0.22)";
    ctx.lineWidth = 2;
    for (let i = -8; i <= 8; i++) {
      ctx.beginPath();
      ctx.moveTo(W / 2 + i * 26, horizon);
      ctx.lineTo(W / 2 + i * 150, H);
      ctx.stroke();
    }
    const offset = (t * 60) % 40;
    for (let y = 0; y < 12; y++) {
      const p = (y * 40 + offset) / 480;
      const yy = horizon + p * p * (H - horizon);
      ctx.globalAlpha = Math.min(1, p * 1.4) * 0.5;
      ctx.beginPath();
      ctx.moveTo(0, yy);
      ctx.lineTo(W, yy);
      ctx.stroke();
    }
    ctx.restore();
    ctx.globalAlpha = 1;
  }

  function drawParticles(ctx) {
    drawBolts(ctx);
    particles.forEach((p) => {
      ctx.globalAlpha = Math.max(0, p.life / p.max);
      ctx.fillStyle = p.color;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
      ctx.restore();
    });
    ctx.globalAlpha = 1;
  }

  function bolt(x1, y1, x2, y2) {
    const pts = [];
    const n = 12;
    for (let i = 0; i <= n; i++) {
      const t = i / n;
      pts.push({ x: x1 + (x2 - x1) * t + (i && i < n ? rand(-26, 26) : 0), y: y1 + (y2 - y1) * t });
    }
    bolts.push({ pts, life: 0.5 });
  }

  function drawBolts(ctx) {
    bolts.forEach((b) => {
      ctx.save();
      ctx.globalAlpha = Math.min(1, b.life * 3);
      ctx.strokeStyle = COLORS.cyan;
      ctx.shadowColor = COLORS.cyan;
      ctx.shadowBlur = 25;
      ctx.lineWidth = 6;
      ctx.beginPath();
      b.pts.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)));
      ctx.stroke();
      ctx.strokeStyle = "#fff";
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.restore();
    });
  }

  function drawTexts(ctx) {
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    texts.forEach((t) => {
      const scale = 1 + (1 - t.life) * 0.25;
      ctx.globalAlpha = Math.min(1, t.life * 1.6);
      ctx.font = `${Math.round(t.size * scale)}px Bungee, Poppins, sans-serif`;
      ctx.lineWidth = 6;
      ctx.strokeStyle = "rgba(20,3,31,0.85)";
      ctx.strokeText(t.str, t.x, t.y);
      ctx.fillStyle = t.color;
      ctx.fillText(t.str, t.x, t.y);
    });
    ctx.globalAlpha = 1;
  }

  function drawFlash(ctx) {
    if (flash <= 0) return;
    const g = ctx.createRadialGradient(W / 2, H / 2, H * 0.25, W / 2, H / 2, H * 0.8);
    g.addColorStop(0, "rgba(255,59,107,0)");
    g.addColorStop(1, `rgba(255,59,107,${0.45 * flash})`);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
  }

  return {
    burst,
    bolt,
    text,
    update,
    drawBackground,
    drawParticles,
    drawTexts,
    drawFlash,
    shake: (amount) => (shake = Math.max(shake, amount)),
    flash: () => (flash = 1),
    get shakeOffset() {
      return shake > 0 ? { x: rand(-shake, shake), y: rand(-shake, shake) } : { x: 0, y: 0 };
    },
    reset() {
      particles = [];
      texts = [];
      bolts = [];
      shake = 0;
      flash = 0;
    },
  };
})();
