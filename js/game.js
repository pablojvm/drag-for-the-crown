// ---------------------------------------------------------------------------
// Motor del juego: bucle, estados, rondas, puntuación y HUD
// ---------------------------------------------------------------------------
const Game = (() => {
  const canvas = document.getElementById("game");
  const ctx = canvas.getContext("2d");
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  canvas.width = W * dpr;
  canvas.height = H * dpr;
  canvas.style.width = `${W}px`;
  canvas.style.height = `${H}px`;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  // ----------------------------- Recursos --------------------------------
  const images = {};
  function loadImage(key, src) {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve((images[key] = img));
      img.onerror = () => resolve((images[key] = img)); // no bloquear si falta una imagen
      img.src = src;
    });
  }
  const ready = Promise.all([
    loadImage("heel", "./images/tacon.png"),
    loadImage("lipstick", "./images/lipstick.png"),
    ...QUEENS.map((q) => loadImage(q.id, q.sprite)),
  ]);

  // ------------------------------ Entrada --------------------------------
  const input = { left: false, right: false, up: false, down: false, fire: false };
  const KEYMAP = {
    ArrowLeft: "left",
    KeyA: "left",
    ArrowRight: "right",
    KeyD: "right",
    ArrowUp: "up",
    KeyW: "up",
    ArrowDown: "down",
    KeyS: "down",
    Space: "fire",
    KeyJ: "fire",
  };
  const clearInput = () => Object.keys(input).forEach((k) => (input[k] = false));

  // ------------------------------- Estado --------------------------------
  let state = "idle"; // idle | intro | playing | cleared | paused | over
  let pausedFrom = null;
  let player = null;
  let rival = null;
  let heels = [];
  let powerups = [];
  let rivalsQueue = [];
  let roundIndex = 0;
  let stateTime = 0;
  let clock = 0; // tiempo total de animación
  let playTime = 0; // tiempo jugado de verdad
  let lives = START_LIVES;
  let score = 0;
  let displayScore = 0;
  let combo = 0;
  let maxCombo = 0;
  let shots = 0;
  let hits = 0;
  let tookDamageThisRound = false;
  let lastCount = null;
  let rafId = null;
  let lastTs = 0;
  let onEnd = () => {};

  function start(queen, endCallback) {
    onEnd = endCallback;
    player = new Player(queen, images[queen.id]);
    rivalsQueue = QUEENS.filter((q) => q.id !== queen.id).sort(() => Math.random() - 0.5);
    roundIndex = 0;
    lives = START_LIVES;
    score = displayScore = combo = maxCombo = shots = hits = 0;
    playTime = 0;
    heels = [];
    powerups = [];
    FX.reset();
    clearInput();
    Sound.stopAll();
    Sound.music();
    beginRound();
    cancelAnimationFrame(rafId);
    lastTs = performance.now();
    rafId = requestAnimationFrame(loop);
  }

  function beginRound() {
    const q = rivalsQueue[roundIndex];
    rival = new Rival(q, images[q.id], ROUNDS[roundIndex], roundIndex);
    heels = [];
    powerups = [];
    tookDamageThisRound = false;
    lastCount = null;
    setState("intro");
  }

  function setState(s) {
    state = s;
    stateTime = 0;
  }

  // ------------------------------- Bucle ---------------------------------
  function loop(ts) {
    const dt = Math.min(0.05, (ts - lastTs) / 1000);
    lastTs = ts;
    if (state !== "paused") update(dt);
    render();
    if (state !== "over" && state !== "idle") rafId = requestAnimationFrame(loop);
  }

  function update(dt) {
    clock += dt;
    stateTime += dt;
    FX.update(dt);
    displayScore += (score - displayScore) * Math.min(1, dt * 10);

    if (state === "intro") {
      rival.update(dt, player, () => {});
      player.update(dt, input);
      // Cuenta atrás 3, 2, 1
      const count = introCount();
      if (count !== lastCount) {
        if (count !== null) Sound.countdown(count === 0);
        lastCount = count;
      }
      if (stateTime >= 3.2) setState("playing");
      return;
    }

    if (state === "cleared") {
      player.update(dt, input);
      heels.forEach((h) => h.update(dt));
      if (stateTime >= 2) {
        roundIndex++;
        if (roundIndex >= ROUNDS.length) finish(true);
        else beginRound();
      }
      return;
    }

    if (state !== "playing") return;
    playTime += dt;

    player.update(dt, input);
    if (input.fire && player.cooldown <= 0) shoot();
    rival.update(dt, player, (h) => heels.push(h));

    heels.forEach((h) => h.update(dt));
    powerups.forEach((p) => p.update(dt));

    collisions();

    heels = heels.filter((h) => {
      if (h.dead) return false;
      if (h.offscreen) {
        if (h.owner === "player") combo = 0; // tacón fallado rompe el combo
        return false;
      }
      return true;
    });
    powerups = powerups.filter((p) => !p.dead && !p.offscreen);
  }

  function shoot() {
    player.cooldown = PLAYER.shotCooldown;
    const y = player.y + 10;
    const double = clock < player.doubleUntil;
    const origins = double ? [player.cx - 22, player.cx + 22] : [player.cx];
    origins.forEach((x) => heels.push(new Heel(x, y, 0, -PLAYER.shotSpeed, "player")));
    shots += origins.length;
    Sound.shoot();
  }

  function collisions() {
    const rivalBox = rival.hitbox;
    const playerBox = player.hitbox;
    const invulnerable = clock < player.invUntil;

    for (const h of heels) {
      if (h.dead) continue;
      if (h.owner === "player" && !rival.entering && circleInRect(h, rivalBox)) {
        h.dead = true;
        hitRival(h);
        if (state !== "playing") return;
      } else if (h.owner === "enemy" && !invulnerable && circleInRect(h, playerBox)) {
        h.dead = true;
        hitPlayer();
        if (state !== "playing") return;
        break; // un impacto por frame
      }
    }

    for (const p of powerups) {
      if (!p.dead && circleInRect(p, playerBox)) {
        p.dead = true;
        collect(p);
      }
    }
  }

  function hitRival(h) {
    hits++;
    combo++;
    maxCombo = Math.max(maxCombo, combo);
    const mult = Math.min(combo, 8);
    const points = 50 * mult;
    score += points;
    rival.hp--;
    rival.hurt = 0.25;
    Sound.impact();
    FX.burst(h.x, h.y, 18, [COLORS.gold, COLORS.pink, COLORS.white], 280);
    FX.text(h.x, h.y - 20, combo >= 3 ? `${pick(HIT_QUIPS)} x${mult}` : `+${points}`, combo >= 3 ? COLORS.gold : COLORS.white, combo >= 3 ? 30 : 24);
    FX.shake(3);

    if (Math.random() < POWERUP_CHANCE) {
      const type = lives < MAX_LIVES && Math.random() < 0.5 ? "life" : "double";
      powerups.push(new PowerUp(rival.cx, rival.cy, type));
    }

    if (rival.hp <= 0) eliminateRival();
  }

  function eliminateRival() {
    const bonus = 500 * (roundIndex + 1) + (tookDamageThisRound ? 0 : 1000);
    score += bonus;
    Sound.hit();
    FX.burst(rival.cx, rival.cy, 90, [COLORS.gold, COLORS.pink, COLORS.cyan, COLORS.white], 520, [3, 8]);
    FX.shake(14);
    FX.text(W / 2, H * 0.42, `+${bonus}`, COLORS.gold, 44);
    if (!tookDamageThisRound) FX.text(W / 2, H * 0.5, "¡FLAWLESS!", COLORS.cyan, 32);
    // Los tacones enemigos en vuelo se convierten en purpurina
    heels.forEach((h) => {
      if (h.owner === "enemy") {
        FX.burst(h.x, h.y, 6, [COLORS.pinkSoft], 120);
        h.dead = true;
      }
    });
    setState("cleared");
  }

  function hitPlayer() {
    lives--;
    combo = 0;
    tookDamageThisRound = true;
    player.invUntil = clock + PLAYER.invulnerable;
    Sound.hit();
    FX.flash();
    FX.shake(12);
    FX.burst(player.cx, player.cy, 30, [COLORS.danger, COLORS.pinkSoft], 300);
    FX.text(player.cx, player.y - 10, pick(OUCH_QUIPS), COLORS.danger, 30);
    if (lives <= 0) finish(false);
  }

  function collect(p) {
    Sound.powerup();
    FX.burst(p.x, p.y, 24, [COLORS.gold, COLORS.white], 220);
    if (p.type === "life") {
      lives = Math.min(MAX_LIVES, lives + 1);
      FX.text(p.x, p.y - 20, "+1 VIDA", COLORS.pink, 28);
    } else {
      player.doubleUntil = clock + DOUBLE_SHOT_TIME;
      FX.text(p.x, p.y - 20, "DOBLE TACÓN", COLORS.gold, 28);
    }
  }

  function finish(won) {
    setState("over");
    clearInput();
    Sound.stopAll();
    won ? Sound.win() : Sound.lose();
    if (won) score += lives * 750; // bonus por vidas restantes
    const best = store.get("dftc-best", 0);
    const isRecord = score > best;
    if (isRecord) store.set("dftc-best", score);
    render();
    setTimeout(() => {
      onEnd({
        won,
        score,
        best: Math.max(best, score),
        isRecord,
        rounds: won ? ROUNDS.length : roundIndex,
        accuracy: shots ? Math.round((hits / shots) * 100) : 0,
        maxCombo,
        time: playTime,
      });
    }, won ? 400 : 700);
  }

  // ------------------------------- Dibujo --------------------------------
  function introCount() {
    // 0-0.8s: título; luego 3, 2, 1 y "¡A LA PASARELA!"
    if (stateTime < 0.8) return null;
    const n = 3 - Math.floor((stateTime - 0.8) / 0.6);
    return n > 0 ? n : 0;
  }

  function render() {
    const off = FX.shakeOffset;
    ctx.save();
    ctx.translate(off.x, off.y);
    FX.drawBackground(ctx, clock);

    powerups.forEach((p) => p.draw(ctx, images.lipstick));
    if (rival && state !== "cleared") rival.draw(ctx);
    if (player) player.draw(ctx, clock);
    heels.forEach((h) => h.draw(ctx, images.heel));
    FX.drawParticles(ctx);
    FX.drawTexts(ctx);
    ctx.restore();

    FX.drawFlash(ctx);
    drawHud();

    if (state === "intro") drawIntro();
    if (state === "cleared") drawCleared();
  }

  function drawHud() {
    if (!player) return;
    const g = ctx.createLinearGradient(0, 0, 0, HUD_H);
    g.addColorStop(0, "rgba(10,0,20,0.9)");
    g.addColorStop(1, "rgba(10,0,20,0.35)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, HUD_H);
    ctx.fillStyle = "rgba(255,79,216,0.5)";
    ctx.fillRect(0, HUD_H - 2, W, 2);

    // Vidas
    for (let i = 0; i < MAX_LIVES; i++) {
      ctx.globalAlpha = i < lives ? 1 : 0.15;
      ctx.drawImage(images.lipstick, 24 + i * 34, 20, 28, 44);
    }
    ctx.globalAlpha = 1;

    // Ronda + rival + vida del rival
    ctx.textAlign = "center";
    ctx.textBaseline = "alphabetic";
    ctx.fillStyle = COLORS.pinkSoft;
    ctx.font = "14px Poppins, sans-serif";
    const r = ROUNDS[Math.min(roundIndex, ROUNDS.length - 1)];
    ctx.fillText(
      r.boss ? "RONDA FINAL · LIP SYNC FOR YOUR LIFE" : `RONDA ${roundIndex + 1}/${ROUNDS.length}`,
      W / 2,
      26,
    );
    if (rival) {
      ctx.fillStyle = COLORS.white;
      ctx.font = "20px Bungee, Poppins, sans-serif";
      ctx.fillText(rival.queen.name.toUpperCase(), W / 2, 50);
      const bw = 300;
      const bx = W / 2 - bw / 2;
      ctx.fillStyle = "rgba(255,255,255,0.12)";
      roundRect(bx, 60, bw, 10, 5);
      ctx.fill();
      const pct = Math.max(0, rival.hp / rival.maxHp);
      const hg = ctx.createLinearGradient(bx, 0, bx + bw, 0);
      hg.addColorStop(0, COLORS.pink);
      hg.addColorStop(1, COLORS.gold);
      ctx.fillStyle = hg;
      roundRect(bx, 60, bw * pct, 10, 5);
      ctx.fill();
    }

    // Puntos y combo
    ctx.textAlign = "right";
    ctx.fillStyle = COLORS.white;
    ctx.font = "30px Bungee, Poppins, sans-serif";
    ctx.fillText(Math.round(displayScore).toLocaleString("es-ES"), W - 24, 46);
    if (combo >= 2) {
      ctx.fillStyle = COLORS.gold;
      ctx.font = "16px Bungee, Poppins, sans-serif";
      ctx.fillText(`COMBO x${Math.min(combo, 8)}`, W - 24, 70);
    }
    if (clock < player.doubleUntil) {
      ctx.textAlign = "left";
      ctx.fillStyle = COLORS.gold;
      ctx.font = "13px Poppins, sans-serif";
      ctx.fillText(`👑 DOBLE TACÓN ${Math.ceil(player.doubleUntil - clock)}s`, 24, HUD_H + 22);
    }
  }

  function drawBanner(title, subtitle, color = COLORS.pink) {
    ctx.fillStyle = "rgba(10,0,20,0.55)";
    ctx.fillRect(0, H / 2 - 90, W, 180);
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = "56px Bungee, Poppins, sans-serif";
    ctx.lineWidth = 8;
    ctx.strokeStyle = "rgba(20,3,31,0.9)";
    ctx.strokeText(title, W / 2, H / 2 - 18);
    ctx.fillStyle = color;
    ctx.fillText(title, W / 2, H / 2 - 18);
    if (subtitle) {
      ctx.font = "22px Poppins, sans-serif";
      ctx.fillStyle = COLORS.white;
      ctx.fillText(subtitle, W / 2, H / 2 + 40);
    }
  }

  function drawIntro() {
    const r = ROUNDS[roundIndex];
    const count = introCount();
    if (count === null) {
      drawBanner(r.boss ? "LIP SYNC" : `RONDA ${roundIndex + 1}`, `contra ${rival.queen.name}`, r.boss ? COLORS.gold : COLORS.pink);
    } else {
      const local = ((stateTime - 0.8) % 0.6) / 0.6;
      ctx.save();
      ctx.globalAlpha = 1 - local * 0.6;
      drawBanner(count > 0 ? String(count) : "¡A LA PASARELA!", null, count > 0 ? COLORS.white : COLORS.gold);
      ctx.restore();
    }
  }

  function drawCleared() {
    const last = roundIndex >= ROUNDS.length - 1;
    drawBanner(last ? "¡LA CORONA ES TUYA!" : "SASHAY AWAY", last ? null : `${rival.queen.name} queda eliminada`, COLORS.gold);
  }

  function roundRect(x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  // ----------------------------- Pausa y teclas --------------------------
  function pause() {
    if (!["intro", "playing", "cleared"].includes(state)) return false;
    pausedFrom = state;
    state = "paused";
    clearInput();
    Sound.pauseMusic();
    return true;
  }
  function resume() {
    if (state !== "paused") return;
    state = pausedFrom;
    lastTs = performance.now();
    Sound.resumeMusic();
  }
  function quit() {
    state = "idle";
    cancelAnimationFrame(rafId);
    Sound.stopAll();
    clearInput();
  }

  document.addEventListener("keydown", (e) => {
    const k = KEYMAP[e.code];
    if (k && ["intro", "playing", "cleared"].includes(state)) {
      e.preventDefault();
      input[k] = true;
    }
  });
  document.addEventListener("keyup", (e) => {
    const k = KEYMAP[e.code];
    if (k) input[k] = false;
  });
  window.addEventListener("blur", () => {
    clearInput();
    if (pause()) UI.showPause(true);
  });
  document.addEventListener("visibilitychange", () => {
    if (document.hidden && pause()) UI.showPause(true);
  });

  return {
    ready,
    start,
    pause,
    resume,
    quit,
    input,
    get state() {
      return state;
    },
    // Solo para pruebas automatizadas
    _debug: () => ({ state, lives, score, roundIndex, combo, shots, hits, heels: heels.length, rival, player }),
  };
})();
