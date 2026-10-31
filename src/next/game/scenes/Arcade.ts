// Arcade en Phaser: esquiva los tacones de la rival y lanza los tuyos. Cinco rondas; la última, la jefa.
// Las reglas (vidas, daño, dificultad, puntos) viven en ../rules.ts y tienen tests.
import Phaser from "phaser";
import { ARCADE_QUEENS } from "../data";
import { rivalFor, rivalsOf, moveSpeed, fireDelay, heelDamage, startLives, hitPoints, roundBonus, ROUNDS, MAX_LIVES, SPECIAL_PER_HIT, POWERUP_CHANCE, powerupType, POWER_MS, DOUBLE_MS, SPONGE_POINTS } from "../rules";
import { sfx } from "../sfx";
import { get, set, saveBest } from "../../store";
import { listen } from "../../bridge";

type Img = Phaser.Types.Physics.Arcade.ImageWithDynamicBody;

export class Arcade extends Phaser.Scene {
  private player!: Img;
  private rival!: Img;
  private mine!: Phaser.Physics.Arcade.Group;
  private theirs!: Phaser.Physics.Arcade.Group;
  private drops!: Phaser.Physics.Arcade.Group;
  private shield!: Phaser.GameObjects.Arc;
  private powerUntil = 0;
  private doubleUntil = 0;
  private keys!: Record<string, Phaser.Input.Keyboard.Key>;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private sparks!: Phaser.GameObjects.Particles.ParticleEmitter;
  private nextFire = 0;
  private nextRival = 0;
  private invulnUntil = 0;
  private flawless = true;
  private rv = rivalFor(1, ARCADE_QUEENS);
  private t0 = 0;
  private pointerX: number | null = null;
  private firing = false;
  private over = false;

  constructor() { super("Arcade"); }

  create() {
    const { width: W, height: H } = this.scale;
    const me = ARCADE_QUEENS.find((q) => q.id === get().queenId)!;
    const bg = this.add.image(W / 2, H / 2, "stage");
    bg.setScale(Math.max(W / bg.width, H / bg.height)).setTint(0x6a4a7a);
    // Velo oscuro para que se lean bien las reinas y los tacones
    this.add.rectangle(W / 2, H / 2, W, H, 0x14031f, 0.35);
    this.physics.world.setBounds(0, 0, W, H);
    this.mine = this.physics.add.group({ allowGravity: false });
    this.theirs = this.physics.add.group({ allowGravity: false });
    this.drops = this.physics.add.group({ allowGravity: false });
    this.player = this.physics.add.image(W / 2, H * 0.86, `q-${me.id}`) as Img;
    this.player.setScale((H * 0.2) / this.player.height).setCollideWorldBounds(true);
    this.player.body.setSize(this.player.width * 0.5, this.player.height * 0.8);
    this.rival = this.physics.add.image(W / 2, H * 0.18, "q-trinity") as Img;
    this.sparks = this.add.particles(0, 0, "spark", { lifespan: 500, speed: { min: 80, max: 260 }, scale: { start: 0.7, end: 0 }, tint: [0xffd84d, 0xff5fa2], blendMode: "ADD", emitting: false });
    this.cursors = this.input.keyboard!.createCursorKeys();
    this.keys = this.input.keyboard!.addKeys("W,A,S,D,SPACE,P,ESC,E,SHIFT") as Record<string, Phaser.Input.Keyboard.Key>;
    this.keys.E.on("down", () => this.special());
    this.keys.SHIFT.on("down", () => this.special());
    this.shield = this.add.circle(0, 0, 10, 0xff5fa2, 0.25).setStrokeStyle(3, 0xffd84d, 0.9).setVisible(false);
    this.keys.P.on("down", () => this.togglePause());
    this.keys.ESC.on("down", () => this.togglePause());
    // Táctil: la reina sigue al dedo y dispara mientras toca
    this.input.on("pointerdown", (p: Phaser.Input.Pointer) => { this.pointerX = p.x; this.firing = true; });
    this.input.on("pointermove", (p: Phaser.Input.Pointer) => { if (p.isDown) this.pointerX = p.x; });
    this.input.on("pointerup", () => { this.pointerX = null; this.firing = false; });
    this.physics.add.overlap(this.mine, this.rival, (_r, h) => this.hitRival(h as Img));
    this.physics.add.overlap(this.theirs, this.player, (_p, h) => this.hitMe(h as Img));
    this.physics.add.overlap(this.drops, this.player, (_p, d) => this.pickup(d as Img));
    const off = listen((c) => { if (c.type === "pause") this.setPaused(c.on); if (c.type === "special") this.special(); });
    this.events.once("shutdown", off);
    set({ screen: "arcade", lives: startLives(me), score: 0, combo: 0, round: 1, paused: false, result: null, special: 0, powerName: me.power.name, activePower: null, doubleOn: false });
    this.powerUntil = 0;
    this.doubleUntil = 0;
    this.over = false;
    this.startRound(1);
  }

  private startRound(round: number) {
    const { width: W, height: H } = this.scale;
    this.rv = rivalFor(round, rivalsOf(get().queenId));
    this.rival.setTexture(`q-${this.rv.queen.id}`).setPosition(W / 2, -H * 0.2).setAlpha(1);
    this.rival.setScale((H * (this.rv.boss ? 0.26 : 0.2)) / this.rival.height);
    this.rival.body.setSize(this.rival.width * 0.5, this.rival.height * 0.8);
    this.tweens.add({ targets: this.rival, y: H * 0.17, duration: 700, ease: "Back.easeOut" });
    this.flawless = true;
    this.t0 = this.time.now;
    this.nextRival = this.time.now + 1500;
    set({ round, rivalName: this.rv.queen.name, rivalHp: this.rv.hp, rivalMax: this.rv.hp });
    const label = this.add.text(W / 2, H / 2, this.rv.boss ? "¡LIP SYNC FINAL!" : `RONDA ${round}`, { fontFamily: "Bungee, sans-serif", fontSize: `${Math.round(H * 0.08)}px`, color: "#ffd84d", stroke: "#3b0d4f", strokeThickness: 8 }).setOrigin(0.5).setScale(0.4);
    this.tweens.add({ targets: label, scale: 1, duration: 450, ease: "Back.easeOut", yoyo: true, hold: 600, onComplete: () => label.destroy() });
  }

  private heel(group: Phaser.Physics.Arcade.Group, x: number, y: number, vx: number, vy: number, tint?: number) {
    const h = group.create(x, y, "heel") as Img;
    h.setScale((this.scale.height * 0.05) / h.height).setVelocity(vx, vy).setAngularVelocity(vy > 0 ? 400 : -400);
    if (tint) h.setTint(tint);
    return h;
  }

  update(time: number, delta: number) {
    if (this.over || get().paused) return;
    const me = ARCADE_QUEENS.find((q) => q.id === get().queenId)!;
    const sp = moveSpeed(me);
    const left = this.cursors.left.isDown || this.keys.A.isDown, right = this.cursors.right.isDown || this.keys.D.isDown;
    const up = this.cursors.up.isDown || this.keys.W.isDown, down = this.cursors.down.isDown || this.keys.S.isDown;
    let vx = (right ? 1 : 0) - (left ? 1 : 0);
    const vy = (down ? 1 : 0) - (up ? 1 : 0);
    if (this.pointerX != null) vx = Math.abs(this.pointerX - this.player.x) > 8 ? Math.sign(this.pointerX - this.player.x) : 0;
    this.player.setVelocity(vx * sp, vy * sp * 0.7);
    // Solo la mitad de abajo de la pasarela
    const H = this.scale.height;
    if (this.player.y < H * 0.55) this.player.y = H * 0.55;
    if ((this.keys.SPACE.isDown || this.firing) && time > this.nextFire) {
      const y0 = this.player.y - this.player.displayHeight * 0.5;
      const triple = this.powerActive("triple"), double = time < this.doubleUntil;
      const spread = triple ? [-160, 0, 160] : double ? [-60, 60] : [0];
      spread.forEach((vx0) => this.heel(this.mine, this.player.x + vx0 * 0.1, y0, vx0, -620, 0xffd84d));
      sfx.shoot();
      this.nextFire = time + fireDelay(me);
    }
    // Poderes con duración: escudo, tacones que persiguen, se acaba el tiempo
    this.shield.setVisible(this.powerActive("shield")).setPosition(this.player.x, this.player.y - this.player.displayHeight * 0.45).setRadius(this.player.displayHeight * 0.55);
    if (this.powerActive("homing")) this.mine.getChildren().forEach((o) => { const h = o as Img; const a = Phaser.Math.Angle.Between(h.x, h.y, this.rival.x, this.rival.y); h.setVelocity(Math.cos(a) * 620, Math.sin(a) * 620); });
    if (get().activePower && time > this.powerUntil) set({ activePower: null });
    if (get().doubleOn && time > this.doubleUntil) set({ doubleOn: false });
    // La rival se mueve de lado a lado (más rápida en cada ronda) y dispara según su patrón
    const W = this.scale.width, t = (time - this.t0) / 1000;
    const slow = this.powerActive("slowmo") ? 0.4 : 1;
    const k = (this.rv.speed / 100) * slow;
    this.rival.x = W / 2 + Math.sin(t * k) * W * 0.36 * (this.rv.pattern === "rafaga" ? Math.cos(t * 0.7) : 1);
    if (time > this.nextRival) this.rivalFire(time);
    // Fuera de pantalla, fuera
    [...this.mine.getChildren(), ...this.theirs.getChildren(), ...this.drops.getChildren()].forEach((o) => { const h = o as Img; if (h.y < -60 || h.y > H + 60 || h.x < -60 || h.x > W + 60) h.destroy(); });
    void delta;
  }

  private rivalFire(time: number) {
    const x = this.rival.x, y = this.rival.y + this.rival.displayHeight * 0.4;
    const v = (260 + this.rv.speed) * (this.powerActive("slowmo") ? 0.4 : 1);
    const aim = Phaser.Math.Angle.Between(x, y, this.player.x, this.player.y);
    const shot = (ang: number) => this.heel(this.theirs, x, y, Math.cos(ang) * v, Math.sin(ang) * v, 0xff8fc8);
    const p = this.rv.pattern === "todo" ? (["recto", "dirigido", "abanico", "rafaga"] as const)[Math.floor(Math.random() * 4)] : this.rv.pattern;
    if (p === "recto") shot(Math.PI / 2);
    else if (p === "dirigido") shot(aim);
    else if (p === "abanico") [-0.35, 0, 0.35].forEach((d) => shot(Math.PI / 2 + d));
    else [0, 140, 280].forEach((ms) => this.time.delayedCall(ms, () => !this.over && shot(Phaser.Math.Angle.Between(this.rival.x, y, this.player.x, this.player.y))));
    this.nextRival = time + this.rv.fireEvery / (this.powerActive("slowmo") ? 0.5 : 1);
  }

  private hitRival(h: Img) {
    h.destroy();
    if (this.over) return;
    const me = ARCADE_QUEENS.find((q) => q.id === get().queenId)!;
    const s = get();
    const combo = s.combo + 1;
    const hp = Math.max(0, s.rivalHp - heelDamage(me));
    set({ combo, score: s.score + hitPoints(combo), rivalHp: hp });
    this.sparks.explode(10, this.rival.x, this.rival.y);
    sfx.hit();
    set({ special: Math.min(1, get().special + SPECIAL_PER_HIT) });
    // A veces cae un power-up
    if (Math.random() < POWERUP_CHANCE) this.drop(powerupType(get().lives, Math.random()));
    this.rival.setTint(0xffffff).setTintMode(Phaser.TintModes.FILL);
    this.time.delayedCall(80, () => this.rival.clearTint().setTintMode(Phaser.TintModes.MULTIPLY));
    if (hp <= 0) this.rivalDown();
  }

  private rivalDown() {
    const s = get();
    set({ score: s.score + roundBonus({ round: s.round, flawless: this.flawless, lives: s.lives }) });
    this.theirs.clear(true, true);
    this.cameras.main.shake(250, 0.01);
    this.sparks.explode(40, this.rival.x, this.rival.y);
    sfx.down();
    this.tweens.add({ targets: this.rival, alpha: 0, y: this.rival.y - 40, angle: 20, duration: 500 });
    if (s.round >= ROUNDS) return this.finish(true);
    this.time.delayedCall(900, () => { this.rival.setAngle(0); this.startRound(s.round + 1); });
  }

  private hitMe(h: Img) {
    h.destroy();
    if (this.over || this.time.now < this.invulnUntil) return;
    if (this.powerActive("shield")) { this.sparks.explode(6, h.x, h.y); return; }
    sfx.hurt();
    const lives = get().lives - 1;
    this.flawless = false;
    set({ lives, combo: 0 });
    this.invulnUntil = this.time.now + 1200;
    this.cameras.main.shake(180, 0.008);
    this.tweens.add({ targets: this.player, alpha: 0.3, duration: 100, yoyo: true, repeat: 5 });
    if (lives <= 0) this.finish(false);
  }

  private finish(won: boolean) {
    this.over = true;
    this.physics.pause();
    const s = get();
    saveBest(s.score);
    if (won) sfx.win(); else sfx.lose();
    this.time.delayedCall(700, () => set({ screen: "result", result: { won, score: s.score, round: s.round } }));
  }

  private powerActive(id: string) {
    return get().activePower === id && this.time.now < this.powerUntil;
  }

  /** Poder especial de la reina (con la barra llena). */
  private special() {
    if (this.over || get().paused || get().special < 1) return;
    const me = ARCADE_QUEENS.find((q) => q.id === get().queenId)!;
    const p = me.power;
    set({ special: 0 });
    sfx.power();
    this.cameras.main.flash(250, 255, 216, 77);
    this.sparks.explode(40, this.player.x, this.player.y - 40);
    const { width: W, height: H } = this.scale;
    const label = this.add.text(W / 2, H * 0.6, p.name.toUpperCase(), { fontFamily: "Bungee, sans-serif", fontSize: `${Math.round(H * 0.05)}px`, color: "#ffd84d", stroke: "#3b0d4f", strokeThickness: 6 }).setOrigin(0.5);
    this.tweens.add({ targets: label, y: label.y - 40, alpha: 0, duration: 1400, onComplete: () => label.destroy() });
    if (POWER_MS[p.id]) { this.powerUntil = this.time.now + POWER_MS[p.id]; set({ activePower: p.id }); }
    if (p.id === "fan") {
      const fan = () => { for (let i = 0; i < 11; i++) { const a = -Math.PI / 2 + (i - 5) * 0.14; this.heel(this.mine, this.player.x, this.player.y - this.player.displayHeight * 0.5, Math.cos(a) * 620, Math.sin(a) * 620, 0xffd84d); } };
      fan();
      this.time.delayedCall(300, fan);
    }
    if (p.id === "sponge") {
      const n = this.theirs.getLength();
      this.theirs.getChildren().forEach((o) => this.sparks.explode(4, (o as Img).x, (o as Img).y));
      this.theirs.clear(true, true);
      set({ score: get().score + n * SPONGE_POINTS, lives: Math.min(MAX_LIVES, get().lives + 1) });
    }
  }

  /** Power-up que cae: pintalabios (+1 vida) o estrella (doble tacón). */
  private drop(type: "life" | "double") {
    const d = this.drops.create(this.rival.x, this.rival.y, "lipstick") as Img;
    d.setScale((this.scale.height * 0.07) / d.height).setVelocity(0, 170).setData("type", type);
    if (type === "double") d.setTint(0xffd84d);
    this.tweens.add({ targets: d, angle: { from: -12, to: 12 }, duration: 300, yoyo: true, repeat: -1 });
  }
  private pickup(d: Img) {
    const type = d.getData("type");
    d.destroy();
    sfx.pickup();
    if (type === "life") set({ lives: Math.min(MAX_LIVES, get().lives + 1) });
    else { this.doubleUntil = this.time.now + DOUBLE_MS; set({ doubleOn: true }); }
  }

  private setPaused(on: boolean) {
    set({ paused: on });
    if (on) this.physics.pause(); else this.physics.resume();
    this.tweens.timeScale = on ? 0 : 1;
    this.time.paused = on; // los poderes y la invulnerabilidad no se gastan en pausa
  }
  private togglePause() { if (!this.over) this.setPaused(!get().paused); }
}
