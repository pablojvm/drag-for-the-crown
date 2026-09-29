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
  // Si la foto de una reina no existe todavía, se usa su silueta provisional
  function loadImage(key, src, fallback) {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve((images[key] = img));
      img.onerror = () => {
        if (fallback && img.src !== fallback) img.src = fallback;
        else resolve((images[key] = img)); // no bloquear si falta una imagen
      };
      img.src = src;
    });
  }
  const ready = Promise.all([
    loadImage("heel", "./images/tacon.png"),
    loadImage("lipstick", "./images/lipstick.png"),
    ...QUEENS.map((q) => loadImage(q.id, q.sprite, placeholderSVG(q.name, false))),
    ...Object.entries(typeof LOOKS !== "undefined" ? LOOKS : {}).flatMap(([sid, ids]) =>
      ids.map((id) => loadImage(`${sid}:${id}`, `./images/queens/${sid}/${id}.png`, `./images/queens/${id}.png`))
    ),
  ]);

  // ------------------------------ Entrada --------------------------------
  const input = { left: false, right: false, up: false, down: false, fire: false, special: false };
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
    KeyE: "special",
    KeyK: "special",
    ShiftLeft: "special",
    ShiftRight: "special",
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
  let special = 0; // carga del poder especial (0 a 1)
  let slowUntil = 0;
  let doublePointsUntil = 0;
  let pendingFans = [];
  let queen = null;
  let season = null;
  let difficulty = 1;
  let opts = {}; // modo historia: { rivals: [reina], story: true }

  // Rivales: el resto del reparto de la temporada en orden de expulsión.
  // La última es la ganadora (si juegas con la ganadora, la jefa final es la finalista).
  function buildRivals() {
    if (opts.rivals) return opts.rivals;
    return season.cast
      .filter((id) => id !== queen.id)
      .map((id) => QUEENS.find((q) => q.id === id))
      .filter(Boolean);
  }
  const totalRounds = () => rivalsQueue.length;
  const isFinalRound = () => roundIndex >= totalRounds() - 1;

  // Dificultad de cada ronda: va de la plantilla fácil a la del jefe final
  function roundConfig(i) {
    const n = totalRounds();
    const t = n > 1 ? i / (n - 1) : 1;
    const last = i === n - 1;
    const base = last ? ROUNDS[ROUNDS.length - 1] : ROUNDS[Math.min(ROUNDS.length - 2, Math.floor(t * (ROUNDS.length - 1)))];
    // Con muchas rondas, cada rival tiene algo menos de vida para que la partida no se alargue
    const hpScale = last ? 1 : Math.max(0.55, Math.min(1, 6 / n));
    return {
      ...base,
      hp: Math.max(2, Math.round(base.hp * hpScale * difficulty)),
      speed: base.speed * (0.9 + t * 0.2) * difficulty,
      every: base.every / difficulty,
      bullet: base.bullet * Math.min(1.3, difficulty),
    };
  }
  let lastCount = null;
  let rafId = null;
  let lastTs = 0;
  let onEnd = () => {};

  function start(selectedQueen, selectedSeason, endCallback, options = {}) {
    onEnd = endCallback;
    opts = options;
    queen = selectedQueen;
    season = selectedSeason;
    difficulty = seasonDifficulty(season);
    player = new Player(queen, images[`${season.id}:${queen.id}`] || images[queen.id]);
    rivalsQueue = buildRivals();
    roundIndex = 0;
    lives = statLives(queen.stats.lives);
    special = 0;
    slowUntil = doublePointsUntil = 0;
    pendingFans = [];
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
    rival = new Rival(q, images[`${season.id}:${q.id}`] || images[q.id] || images.__fallback, roundConfig(roundIndex), roundIndex);
    heels = [];
    // Los premios que aún caen se mantienen entre rondas para poder recogerlos
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
      updatePowerups(dt);
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
      updatePowerups(dt);
      if (stateTime >= 2) {
        roundIndex++;
        if (roundIndex >= totalRounds()) finish(true);
        else beginRound();
      }
      return;
    }

    if (state !== "playing") return;
    playTime += dt;

    player.update(dt, input);
    if (input.fire && player.cooldown <= 0) shoot();
    if (input.special) {
      input.special = false;
      if (special >= 1) activateSpecial();
    }
    pendingFans = pendingFans.filter((f) => {
      if (clock < f.at) return true;
      fan(11);
      return false;
    });

    const slow = clock < slowUntil ? 0.35 : 1;
    rival.update(dt * slow, player, (h) => heels.push(h));

    heels.forEach((h) => h.update(h.owner === "enemy" ? dt * slow : dt, rival));
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

  // Premios fuera de la partida activa (entre rondas): siguen cayendo y se pueden recoger
  function updatePowerups(dt) {
    const box = player.hitbox;
    powerups.forEach((p) => {
      p.update(dt);
      if (!p.dead && circleInRect(p, box)) {
        p.dead = true;
        collect(p);
      }
    });
    powerups = powerups.filter((p) => !p.dead && !p.offscreen);
  }

  function shoot() {
    player.cooldown = player.shotCooldown;
    const y = player.y + 10;
    const triple = clock < player.tripleUntil;
    const double = clock < player.doubleUntil;
    const homing = clock < player.homingUntil;
    const v = PLAYER.shotSpeed;
    const shotsNow = [];
    if (triple) {
      [-0.18, 0, 0.18].forEach((a) => shotsNow.push([player.cx, Math.sin(a) * v, -Math.cos(a) * v]));
    } else if (double) {
      shotsNow.push([player.cx - 22, 0, -v], [player.cx + 22, 0, -v]);
    } else {
      shotsNow.push([player.cx, 0, -v]);
    }
    if (clock < player.clonesUntil) {
      [-1, 1].forEach((side) => shotsNow.push([player.cx + side * player.w * 0.9, 0, -v]));
    }
    shotsNow.forEach(([x, vx, vy]) => {
      const h = new Heel(x, y, vx, vy, "player");
      h.homing = homing;
      heels.push(h);
    });
    shots += shotsNow.length;
    Sound.shoot();
  }

  function fan(count) {
    const v = PLAYER.shotSpeed;
    for (let i = 0; i < count; i++) {
      const a = -0.7 + (1.4 * i) / (count - 1);
      heels.push(new Heel(player.cx, player.y + 10, Math.sin(a) * v, -Math.cos(a) * v, "player"));
    }
    shots += count;
    Sound.shoot();
  }

  // ------------------------------ Poderes --------------------------------
  function activateSpecial() {
    special = 0;
    const p = queen.power;
    Sound.powerup();
    FX.shake(6);
    FX.burst(player.cx, player.cy, 50, [COLORS.gold, COLORS.pink, COLORS.cyan], 380);
    FX.text(W / 2, H * 0.62, p.name.toUpperCase(), COLORS.gold, 38);
    switch (p.id) {
      case "shield":
        player.shieldUntil = clock + 5;
        break;
      case "fan":
        fan(11);
        pendingFans.push({ at: clock + 0.3 });
        break;
      case "sponge": {
        let absorbed = 0;
        heels.forEach((h) => {
          if (h.owner === "enemy" && !h.dead) {
            h.dead = true;
            absorbed++;
            FX.burst(h.x, h.y, 8, [COLORS.pinkSoft, COLORS.white], 160);
          }
        });
        score += absorbed * 75;
        lives = Math.min(MAX_LIVES, lives + 1);
        FX.text(player.cx, player.y - 20, `+1 VIDA · ${absorbed} ABSORBIDOS`, COLORS.pink, 24);
        break;
      }
      case "slowmo":
        slowUntil = clock + 5;
        break;
      case "triple":
        player.tripleUntil = clock + 6;
        break;
      case "homing":
        player.homingUntil = clock + 6;
        break;
      case "zap":
        FX.bolt(player.cx, player.y, rival.cx, rival.cy);
        damageRival(3, rival.cx, rival.cy, true);
        break;
      case "bomb":
        heels.forEach((h) => {
          if (h.owner === "enemy") h.dead = true;
        });
        FX.burst(W / 2, H / 2, 160, [COLORS.gold, COLORS.pink, COLORS.cyan, COLORS.white], 700, [3, 9]);
        FX.shake(18);
        damageRival(2, rival.cx, rival.cy, true);
        break;
      case "magnet":
        doublePointsUntil = clock + 8;
        powerups.push(new PowerUp(player.cx, HUD_H + 60, lives < MAX_LIVES ? "life" : "double"));
        break;
      case "clones":
        player.clonesUntil = clock + 6;
        break;
      case "reflect":
        player.reflectUntil = clock + 5;
        break;
      case "divine":
        player.invUntil = Math.max(player.invUntil, clock + 6);
        player.shieldUntil = clock + 6;
        player.tripleUntil = clock + 6;
        player.homingUntil = clock + 6;
        break;
    }
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
      } else if (h.owner === "enemy" && clock < player.reflectUntil && circleInRect(h, { x: player.x - 30, y: player.y - 30, w: player.w + 60, h: player.h + 60 })) {
        // El tacón rebota y pasa a ser de la jugadora, dirigido a la rival
        h.owner = "player";
        h.homing = true;
        const a = Math.atan2(rival.cy - h.y, rival.cx - h.x);
        const v = PLAYER.shotSpeed * 0.9;
        h.vx = Math.cos(a) * v;
        h.vy = Math.sin(a) * v;
        h.trail = [];
        FX.burst(h.x, h.y, 10, [COLORS.cyan, COLORS.white], 200);
      } else if (h.owner === "enemy" && clock < player.shieldUntil && circleInRect(h, { x: player.x - 20, y: player.y - 20, w: player.w + 40, h: player.h + 40 })) {
        h.dead = true;
        FX.burst(h.x, h.y, 10, [COLORS.pinkSoft, COLORS.white], 200);
        score += 25;
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
    special = Math.min(1, special + SPECIAL_PER_HIT);
    if (special >= 1 && special - SPECIAL_PER_HIT < 1) FX.text(W / 2, H * 0.66, "¡PODER LISTO! [E]", COLORS.cyan, 26);
    damageRival(player.damage, h.x, h.y, false);
  }

  function damageRival(amount, x, y, isSpecial) {
    const mult = Math.min(Math.max(combo, 1), 8);
    const points = Math.round((isSpecial ? 300 : 50 * mult) * (clock < doublePointsUntil ? 2 : 1));
    score += points;
    rival.hp -= amount;
    rival.hurt = 0.25;
    Sound.impact();
    FX.burst(x, y, isSpecial ? 50 : 18, [COLORS.gold, COLORS.pink, COLORS.white], isSpecial ? 420 : 280);
    const big = combo >= 3 || isSpecial;
    FX.text(x, y - 20, big && !isSpecial ? `${pick(HIT_QUIPS)} x${mult}` : `+${points}`, big ? COLORS.gold : COLORS.white, big ? 30 : 24);
    FX.shake(isSpecial ? 10 : 3);

    if (!isSpecial && Math.random() < POWERUP_CHANCE) {
      const type = lives < MAX_LIVES && Math.random() < 0.5 ? "life" : "double";
      powerups.push(new PowerUp(rival.cx, rival.cy, type));
    }

    if (rival.hp <= 0.001) eliminateRival();
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
    score = Math.round(score);
    if (opts.story) {
      render();
      setTimeout(() => onEnd({ won, score, story: true }), won ? 900 : 1100);
      return;
    }
    const best = store.get("dftc-best", 0);
    const isRecord = score > best;
    if (isRecord) store.set("dftc-best", score);
    const stats = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      name: store.get("dftc-name", ""),
      queen: queen.id,
      season: season.id,
      won,
      score,
      rounds: won ? totalRounds() : roundIndex,
      totalRounds: totalRounds(),
      accuracy: shots ? Math.round((Math.min(hits, shots) / shots) * 100) : 0,
      maxCombo,
      time: playTime,
      date: new Date().toISOString(),
    };
    const boardPos = Progress.recordGame(stats);
    Progress.addTotal(score);
    const unlockedSeason = won ? Progress.winSeason(season) : null;
    render();
    setTimeout(() => {
      onEnd({ ...stats, best: Math.max(best, score), isRecord, boardPos, unlockedSeason, seasonObj: season });
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
      ctx.drawImage(images.lipstick, 24 + i * 30, 12, 24, 38);
    }
    ctx.globalAlpha = 1;

    // Barra del poder especial
    const sx = 24;
    const sy = 58;
    const sw = 150;
    ctx.fillStyle = "rgba(255,255,255,0.12)";
    roundRect(sx, sy, sw, 12, 6);
    ctx.fill();
    const full = special >= 1;
    const sg = ctx.createLinearGradient(sx, 0, sx + sw, 0);
    sg.addColorStop(0, COLORS.cyan);
    sg.addColorStop(1, full ? COLORS.gold : COLORS.pink);
    ctx.fillStyle = sg;
    if (full) {
      ctx.shadowColor = COLORS.gold;
      ctx.shadowBlur = 12 + Math.sin(clock * 8) * 8;
    }
    roundRect(sx, sy, sw * special, 12, 6);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.font = "12px Poppins, sans-serif";
    ctx.fillStyle = full ? COLORS.gold : "rgba(255,255,255,0.7)";
    ctx.fillText(full ? `✨ ${queen.power.name.toUpperCase()} · [E]` : "✨ PODER", sx + sw + 10, sy + 6);
    ctx.textBaseline = "alphabetic";

    // Ronda + rival + vida del rival
    ctx.textAlign = "center";
    ctx.textBaseline = "alphabetic";
    ctx.fillStyle = COLORS.pinkSoft;
    ctx.font = "14px Poppins, sans-serif";
    const r = { boss: isFinalRound() };
    ctx.fillText(
      `${season ? season.name.toUpperCase() + " · " : ""}${r.boss ? "RONDA FINAL · LIP SYNC FOR YOUR LIFE" : `RONDA ${roundIndex + 1}/${totalRounds()}`}`,
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
    // Efectos activos
    const active = [];
    if (clock < player.doubleUntil) active.push(`👑 DOBLE TACÓN ${Math.ceil(player.doubleUntil - clock)}s`);
    const powerEnd = Math.max(player.shieldUntil, player.tripleUntil, player.homingUntil, player.clonesUntil, player.reflectUntil, slowUntil, doublePointsUntil);
    if (clock < powerEnd) active.push(`✨ ${queen.power.name.toUpperCase()} ${Math.ceil(powerEnd - clock)}s`);
    ctx.textAlign = "left";
    ctx.fillStyle = COLORS.gold;
    ctx.font = "13px Poppins, sans-serif";
    active.forEach((t, i) => ctx.fillText(t, 24, HUD_H + 22 + i * 18));
    if (clock < slowUntil) {
      ctx.fillStyle = "rgba(83,242,255,0.08)";
      ctx.fillRect(0, HUD_H, W, H - HUD_H);
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
    const r = { boss: isFinalRound() };
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
    const last = isFinalRound();
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
      if (k === "special" && e.repeat) return;
      input[k] = true;
    }
  });
  document.addEventListener("keyup", (e) => {
    const k = KEYMAP[e.code];
    if (k && k !== "special") input[k] = false;
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
    _debug: () => ({ win: () => state === "playing" && finish(true), lose: () => state === "playing" && finish(false), state, lives, score, roundIndex, combo, shots, hits, heels: heels.length, rival, player, special, setSpecial: (v) => (special = v) }),
  };
})();
