// Escena del lip sync: las dos reinas en el escenario reaccionan a cada movimiento. Los botones son de React.
import Phaser from "phaser";
import { store, get } from "../../store";

export class LipSync extends Phaser.Scene {
  private me!: Phaser.GameObjects.Image;
  private them!: Phaser.GameObjects.Image;
  private sparks!: Phaser.GameObjects.Particles.ParticleEmitter;
  constructor() { super("LipSync"); }
  create() {
    const { width: W, height: H } = this.scale;
    const ls = get().ls!;
    const bg = this.add.image(W / 2, H / 2, "stage");
    bg.setScale(Math.max(W / bg.width, H / bg.height));
    this.add.rectangle(W / 2, H / 2, W, H, 0x14031f, 0.25);
    this.me = this.add.image(W * 0.3, H * 0.92, `q-${get().queenId}`).setOrigin(0.5, 1);
    this.me.setScale((H * 0.58) / this.me.height);
    this.them = this.add.image(W * 0.7, H * 0.92, `q-${ls.rivalId}`).setOrigin(0.5, 1).setFlipX(true);
    this.them.setScale((H * 0.58) / this.them.height);
    [this.me, this.them].forEach((q, i) => this.tweens.add({ targets: q, y: q.y - 6, duration: 450 + i * 70, yoyo: true, repeat: -1, ease: "Sine.easeInOut" }));
    this.sparks = this.add.particles(0, 0, "spark", { lifespan: 700, speed: { min: 100, max: 320 }, scale: { start: 0.8, end: 0 }, tint: [0xffd84d, 0xff5fa2, 0xffffff], blendMode: "ADD", emitting: false });
    let lastAnim = ls.anim;
    const unsub = store.subscribe((s) => {
      if (!s.ls || s.ls.anim === lastAnim) return;
      lastAnim = s.ls.anim;
      this.move(this.me, s.ls.lastTag, true);
      this.move(this.them, ["Emote", "Cara", "Escenario"][s.ls.anim % 3], false);
      if (s.ls.done) this.time.delayedCall(900, () => this.cameras.main.flash(400, 255, 255, 255));
    });
    this.events.once("shutdown", unsub);
    this.scale.on("resize", () => this.scene.restart());
  }
  /** Animación de cada movimiento: truco (giro y purpurina), conexión (zoom) o escenario (vuelta por la pasarela). */
  private move(q: Phaser.GameObjects.Image, tag: string, mine: boolean) {
    const s0 = q.scale, x0 = q.x;
    if (tag === "Emote") {
      this.tweens.add({ targets: q, angle: mine ? 360 : -360, duration: 600, ease: "Cubic.easeOut", onComplete: () => q.setAngle(0) });
      this.sparks.explode(30, q.x, q.y - q.displayHeight * 0.6);
      if (mine) this.cameras.main.shake(200, 0.006);
    } else if (tag === "Cara") {
      this.tweens.add({ targets: q, scale: s0 * 1.08, duration: 250, yoyo: true, hold: 200 });
    } else if (tag === "Escenario") {
      this.tweens.add({ targets: q, x: x0 + (mine ? 1 : -1) * this.scale.width * 0.12, duration: 350, yoyo: true, ease: "Sine.easeInOut" });
    }
  }
}
