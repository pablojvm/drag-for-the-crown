// Escena de la pasarela: la reina sale del fondo, avanza por la pasarela y remata con pose, comedia o reveal.
import Phaser from "phaser";
import { store, get } from "../../store";

export class Runway extends Phaser.Scene {
  private q!: Phaser.GameObjects.Image;
  private sparks!: Phaser.GameObjects.Particles.ParticleEmitter;
  private baseScale = 1;
  constructor() { super("Runway"); }
  create() {
    const { width: W, height: H } = this.scale;
    const bg = this.add.image(W / 2, H / 2, "stage");
    bg.setScale(Math.max(W / bg.width, H / bg.height)).setTint(0xb090c0);
    // Pasarela en perspectiva y focos
    const g = this.add.graphics();
    const p = (x: number, y: number) => new Phaser.Math.Vector2(x, y);
    g.fillStyle(0x2b1238, 0.85).fillPoints([p(W * 0.44, H * 0.38), p(W * 0.56, H * 0.38), p(W * 0.8, H), p(W * 0.2, H)], true);
    g.lineStyle(3, 0xff5fa2, 0.9).lineBetween(W * 0.44, H * 0.38, W * 0.2, H).lineBetween(W * 0.56, H * 0.38, W * 0.8, H);
    for (let i = 0; i < 7; i++) {
      const l = this.add.circle(W * (0.22 + i * 0.093), H * 0.97, 6, 0xffd84d, 0.9);
      this.tweens.add({ targets: l, alpha: 0.3, duration: 400, yoyo: true, repeat: -1, delay: i * 90 });
    }
    this.q = this.add.image(W / 2, H * 0.42, `q-${get().queenId}`).setOrigin(0.5, 1);
    this.baseScale = (H * 0.2) / this.q.height;
    this.q.setScale(this.baseScale).setAlpha(0);
    this.tweens.add({ targets: this.q, alpha: 1, duration: 500 });
    this.sparks = this.add.particles(0, 0, "spark", { lifespan: 900, speed: { min: 120, max: 380 }, scale: { start: 0.9, end: 0 }, tint: [0xffd84d, 0xff5fa2, 0x6ee7ff], blendMode: "ADD", emitting: false });
    let n = get().rw?.animN ?? 0;
    const unsub = store.subscribe((s) => { if (!s.rw || s.rw.animN === n) return; n = s.rw.animN; this.act(s.rw.anim, s.rw.pos); });
    this.events.once("shutdown", unsub);
    this.scale.on("resize", () => this.scene.restart());
  }
  private act(anim: string, step: number) {
    if (!anim) return;
    const H = this.scale.height;
    // Cada paso la acerca: del fondo (pequeña) a primer plano (grande)
    const target = [0.42, 0.54, 0.66, 0.7, 0.7][Math.min(4, step)]; // por encima del panel de opciones
    const sc = this.baseScale * [1, 1.5, 2.1, 2.3, 2.3][Math.min(4, step)];
    if (anim === "walk") this.tweens.add({ targets: this.q, y: H * target, scale: sc, duration: 900, ease: "Sine.easeInOut" });
    if (anim === "pose") { this.cameras.main.flash(180, 255, 255, 255); this.tweens.add({ targets: this.q, y: H * target, scale: sc, duration: 600 }); }
    if (anim === "comedia") this.tweens.add({ targets: this.q, angle: { from: -8, to: 8 }, y: H * target, scale: sc, duration: 160, yoyo: true, repeat: 3, onComplete: () => this.q.setAngle(0) });
    if (anim === "reveal") {
      this.tweens.add({ targets: this.q, y: H * target, scale: sc, duration: 500 });
      this.tweens.add({ targets: this.q, scaleX: { from: sc, to: -sc }, duration: 260, yoyo: true, repeat: 1, delay: 500, onComplete: () => this.q.setScale(sc) });
      this.time.delayedCall(900, () => { this.sparks.explode(70, this.q.x, this.q.y - this.q.displayHeight * 0.5); this.cameras.main.flash(300, 255, 216, 77); });
    }
    if (anim === "detalle") {
      // Giro para enseñar el detalle del look
      this.tweens.add({ targets: this.q, y: H * target, duration: 600 });
      this.tweens.add({ targets: this.q, scaleX: { from: sc, to: -sc }, scaleY: sc, duration: 320, yoyo: true, delay: 200, onComplete: () => this.q.setScale(sc) });
    }
    if (anim === "stuck") { this.tweens.add({ targets: this.q, y: H * target, scale: sc, duration: 500 }); this.time.delayedCall(500, () => this.cameras.main.shake(350, 0.012)); }
    if (anim === "voice") this.tweens.add({ targets: this.q, y: this.q.y - 10, duration: 300, yoyo: true, repeat: 2 });
  }
}
