// ---------------------------------------------------------------------------
// Entidades: jugadora, rival, tacones y power-ups
// ---------------------------------------------------------------------------

// Dibuja un sprite manteniendo su proporción a partir de una altura
function spriteSize(img, height) {
  const ratio = img && img.naturalWidth ? img.naturalWidth / img.naturalHeight : 0.8;
  return { w: height * ratio, h: height };
}

class Player {
  constructor(queen, img) {
    this.queen = queen;
    this.img = img;
    const s = spriteSize(img, PLAYER.height);
    this.w = s.w;
    this.h = s.h;
    this.x = W / 2 - this.w / 2;
    this.y = H - this.h - 30;
    this.cooldown = 0;
    this.invUntil = 0;
    this.doubleUntil = 0;
    this.tilt = 0;
    // Estadísticas propias de cada reina
    this.speed = PLAYER.speed * statSpeed(queen.stats.speed);
    this.shotCooldown = statCooldown(queen.stats.rate);
    this.damage = statDamage(queen.stats.power);
    // Efectos de poderes especiales (marcas de tiempo)
    this.shieldUntil = 0;
    this.tripleUntil = 0;
    this.homingUntil = 0;
    this.clonesUntil = 0;
  }

  get cx() {
    return this.x + this.w / 2;
  }
  get cy() {
    return this.y + this.h / 2;
  }

  // Caja de colisión algo más pequeña que el sprite (se siente más justo)
  get hitbox() {
    return { x: this.x + this.w * 0.28, y: this.y + this.h * 0.18, w: this.w * 0.44, h: this.h * 0.7 };
  }

  update(dt, input) {
    let dx = 0;
    let dy = 0;
    if (input.left) dx -= 1;
    if (input.right) dx += 1;
    if (input.up) dy -= 1;
    if (input.down) dy += 1;
    if (dx && dy) {
      dx *= Math.SQRT1_2;
      dy *= Math.SQRT1_2;
    }
    this.x = clamp(this.x + dx * this.speed * dt, 0, W - this.w);
    this.y = clamp(this.y + dy * this.speed * dt, PLAYER_MIN_Y, H - this.h - 6);
    this.tilt += (dx * 0.12 - this.tilt) * Math.min(1, dt * 10);
    this.cooldown -= dt;
  }

  draw(ctx, now) {
    // Clones holográficos
    if (now < this.clonesUntil) {
      [-1, 1].forEach((side) => {
        ctx.save();
        ctx.globalAlpha = 0.35 + Math.sin(now * 12 + side) * 0.1;
        ctx.shadowColor = COLORS.cyan;
        ctx.shadowBlur = 20;
        ctx.drawImage(this.img, this.x + side * this.w * 0.9, this.y + 10, this.w * 0.85, this.h * 0.85);
        ctx.restore();
      });
    }
    // Escudo
    if (now < this.shieldUntil) {
      ctx.save();
      const r = Math.max(this.w, this.h) * 0.62;
      const g = ctx.createRadialGradient(this.cx, this.cy, r * 0.6, this.cx, this.cy, r);
      g.addColorStop(0, "rgba(255,155,233,0)");
      g.addColorStop(1, `rgba(255,155,233,${0.45 + Math.sin(now * 10) * 0.15})`);
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(this.cx, this.cy, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    const invulnerable = now < this.invUntil && now >= this.shieldUntil;
    if (invulnerable && Math.floor(now * 14) % 2 === 0) return; // parpadeo
    // Sombra en la pasarela
    ctx.fillStyle = "rgba(0,0,0,0.35)";
    ctx.beginPath();
    ctx.ellipse(this.cx, this.y + this.h - 4, this.w * 0.38, 10, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.save();
    ctx.translate(this.cx, this.y + this.h);
    ctx.rotate(this.tilt);
    if (now < this.doubleUntil || now < this.tripleUntil || now < this.homingUntil) {
      ctx.shadowColor = COLORS.gold;
      ctx.shadowBlur = 25;
    }
    ctx.drawImage(this.img, -this.w / 2, -this.h, this.w, this.h);
    ctx.restore();
  }
}

class Rival {
  constructor(queen, img, round, index) {
    this.queen = queen;
    this.img = img;
    this.cfg = round;
    this.index = index;
    const s = spriteSize(img, round.boss ? 230 : 190);
    this.w = s.w;
    this.h = s.h;
    this.maxHp = round.hp;
    this.hp = round.hp;
    this.x = W / 2 - this.w / 2;
    this.y = -this.h; // entra desde arriba
    this.targetY = HUD_H + 40;
    this.entering = true;
    this.t = 0;
    this.vx = round.speed * (Math.random() > 0.5 ? 1 : -1);
    this.vy = round.speed * 0.55;
    this.fireTimer = 1.2;
    this.burstLeft = 0;
    this.burstTimer = 0;
    this.bossToggle = false;
    this.hurt = 0;
    this.dashTarget = this.x;
    this.dashTimer = 0;
  }

  get cx() {
    return this.x + this.w / 2;
  }
  get cy() {
    return this.y + this.h / 2;
  }
  get hitbox() {
    return { x: this.x + this.w * 0.2, y: this.y + this.h * 0.08, w: this.w * 0.6, h: this.h * 0.84 };
  }

  update(dt, player, spawn) {
    this.hurt = Math.max(0, this.hurt - dt);
    if (this.entering) {
      this.y += (this.targetY - this.y) * Math.min(1, dt * 3);
      if (Math.abs(this.targetY - this.y) < 2) this.entering = false;
      return;
    }
    this.t += dt;
    const top = HUD_H + 10;
    const bottom = H * 0.46 - this.h;

    switch (this.cfg.move) {
      case "bounce":
        this.x += this.vx * dt;
        this.y += this.vy * dt;
        if (this.x <= 0 || this.x >= W - this.w) this.vx *= -1;
        if (this.y <= top || this.y >= bottom) this.vy *= -1;
        this.x = clamp(this.x, 0, W - this.w);
        this.y = clamp(this.y, top, bottom);
        break;
      case "sine":
        this.x = W / 2 - this.w / 2 + Math.sin(this.t * 1.1) * (W / 2 - this.w / 2 - 20);
        this.y = top + 40 + (Math.sin(this.t * 2.2) + 1) * ((bottom - top - 40) / 2);
        break;
      case "dash":
        this.dashTimer -= dt;
        if (this.dashTimer <= 0) {
          this.dashTarget = clamp(player.cx - this.w / 2 + rand(-120, 120), 0, W - this.w);
          this.dashTimer = rand(0.9, 1.6);
        }
        this.x += (this.dashTarget - this.x) * Math.min(1, dt * 4);
        this.y = top + 30 + Math.abs(Math.sin(this.t * 1.7)) * (bottom - top - 30);
        break;
      case "figure8":
        this.x = W / 2 - this.w / 2 + Math.sin(this.t * 0.8) * (W / 2 - this.w / 2 - 20);
        this.y = top + 20 + (Math.sin(this.t * 1.6) + 1) * ((bottom - top - 20) / 2);
        break;
    }

    // Ataques
    if (this.burstLeft > 0) {
      this.burstTimer -= dt;
      if (this.burstTimer <= 0) {
        this.shootAimed(player, spawn, 0);
        this.burstLeft--;
        this.burstTimer = 0.14;
      }
    }
    this.fireTimer -= dt;
    if (this.fireTimer <= 0) {
      this.fireTimer = this.cfg.every * rand(0.85, 1.15);
      this.attack(player, spawn);
    }
  }

  shootAngle(angle, spawn) {
    const v = this.cfg.bullet;
    spawn(new Heel(this.cx, this.y + this.h * 0.8, Math.cos(angle) * v, Math.sin(angle) * v, "enemy"));
  }

  shootAimed(player, spawn, spread) {
    const a = Math.atan2(player.cy - this.cy, player.cx - this.cx) + spread;
    this.shootAngle(a, spawn);
  }

  attack(player, spawn) {
    const down = Math.PI / 2;
    Sound.enemyShoot();
    switch (this.cfg.fire) {
      case "single":
        this.shootAngle(down, spawn);
        break;
      case "aimed":
        this.shootAimed(player, spawn, 0);
        break;
      case "spread3":
        [-0.32, 0, 0.32].forEach((o) => this.shootAngle(down + o, spawn));
        break;
      case "burst":
        this.burstLeft = 3;
        this.burstTimer = 0;
        break;
      case "boss":
        this.bossToggle = !this.bossToggle;
        if (this.bossToggle) [-0.6, -0.3, 0, 0.3, 0.6].forEach((o) => this.shootAngle(down + o, spawn));
        else {
          this.burstLeft = 3;
          this.burstTimer = 0;
        }
        // Con poca vida, el jefe se enfada: dispara más rápido
        if (this.hp <= this.maxHp / 2) this.fireTimer *= 0.75;
        break;
    }
  }

  draw(ctx) {
    ctx.save();
    if (this.cfg.boss) {
      ctx.shadowColor = COLORS.pink;
      ctx.shadowBlur = 30 + Math.sin(this.t * 6) * 10;
    }
    if (this.hurt > 0) {
      ctx.shadowColor = "#ffffff";
      ctx.shadowBlur = 40;
      ctx.globalAlpha = 0.6 + Math.sin(this.hurt * 60) * 0.4;
    }
    const wobble = this.hurt > 0 ? Math.sin(this.hurt * 80) * 0.08 : 0;
    ctx.translate(this.cx, this.y + this.h);
    ctx.rotate(wobble);
    ctx.drawImage(this.img, -this.w / 2, -this.h, this.w, this.h);
    ctx.restore();
    ctx.globalAlpha = 1;
  }
}

class Heel {
  constructor(x, y, vx, vy, owner) {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.owner = owner;
    this.r = owner === "player" ? 18 : 16;
    this.rot = rand(0, Math.PI * 2);
    this.spin = owner === "player" ? 14 : -10;
    this.trail = [];
  }

  update(dt, target) {
    this.trail.push({ x: this.x, y: this.y });
    if (this.trail.length > 6) this.trail.shift();
    // Tacones teledirigidos: giran poco a poco hacia la rival
    if (this.homing && target && !target.entering) {
      const speed = Math.hypot(this.vx, this.vy);
      const want = Math.atan2(target.cy - this.y, target.cx - this.x);
      const cur = Math.atan2(this.vy, this.vx);
      let diff = want - cur;
      while (diff > Math.PI) diff -= Math.PI * 2;
      while (diff < -Math.PI) diff += Math.PI * 2;
      const a = cur + clamp(diff, -6 * dt, 6 * dt);
      this.vx = Math.cos(a) * speed;
      this.vy = Math.sin(a) * speed;
    }
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.rot += this.spin * dt;
  }

  get offscreen() {
    return this.y < -60 || this.y > H + 60 || this.x < -60 || this.x > W + 60;
  }

  draw(ctx, img) {
    const color = this.owner === "player" ? "255,216,77" : "255,59,107";
    this.trail.forEach((p, i) => {
      ctx.fillStyle = `rgba(${color},${(i / this.trail.length) * 0.35})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, this.r * (i / this.trail.length), 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rot);
    ctx.shadowColor = `rgb(${color})`;
    ctx.shadowBlur = 16;
    const s = this.r * 3;
    ctx.drawImage(img, -s / 2, -s / 2, s, s);
    ctx.restore();
  }
}

class PowerUp {
  constructor(x, y, type) {
    this.x = x;
    this.y = y;
    this.type = type; // "life" | "double"
    this.vy = 150;
    this.t = 0;
    this.r = 26;
  }

  update(dt) {
    this.t += dt;
    this.y += this.vy * dt;
  }

  get offscreen() {
    return this.y > H + 40;
  }

  draw(ctx, lipstickImg) {
    const bob = Math.sin(this.t * 6) * 4;
    ctx.save();
    ctx.translate(this.x, this.y + bob);
    // Halo
    const g = ctx.createRadialGradient(0, 0, 4, 0, 0, this.r * 1.6);
    g.addColorStop(0, this.type === "life" ? "rgba(255,79,216,0.6)" : "rgba(255,216,77,0.6)");
    g.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(0, 0, this.r * 1.6, 0, Math.PI * 2);
    ctx.fill();
    if (this.type === "life") {
      ctx.drawImage(lipstickImg, -18, -22, 36, 44);
    } else {
      ctx.font = "40px serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("👑", 0, 2);
    }
    ctx.restore();
  }
}

function rectsOverlap(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

function circleInRect(c, r) {
  const nx = clamp(c.x, r.x, r.x + r.w);
  const ny = clamp(c.y, r.y, r.y + r.h);
  return (c.x - nx) ** 2 + (c.y - ny) ** 2 < c.r * c.r;
}
