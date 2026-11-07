// Una reina en el escenario del lip sync: su imagen, su cara (imagen o pose), su rebote a compás y sus números.
import Phaser from "phaser";
import type { Cara, Numero } from "../../../core/montaje";
import { MONTAJE } from "../../../core/montaje";
import { caraKey, revealKey } from "./assets";

/** Poses para imitar cada cara cuando no hay imagen: estirar (boca abierta), ladear (sassy), encoger y enfriar (tensión). */
const POSE: Record<Cara, { sx: number; sy: number; angle: number; dy: number; tint?: number }> = {
  neutral: { sx: 1, sy: 1, angle: 0, dy: 0 },
  grito: { sx: 0.97, sy: 1.05, angle: -2, dy: -8 },
  sassy: { sx: 1.03, sy: 0.99, angle: 5, dy: 0 },
  tension: { sx: 1.03, sy: 0.96, angle: 0, dy: 4, tint: 0xd9ccff },
};

export class Performer {
  readonly img: Phaser.GameObjects.Image;
  /** La reina va en un contenedor: el contenedor rebota y se mueve; la imagen pone la cara (pose). */
  readonly box: Phaser.GameObjects.Container;
  private base: { x: number; y: number; s: number };
  private cara: Cara = "neutral";
  private revealed = false;
  private pose?: Phaser.Tweens.Tween;
  constructor(private scene: Phaser.Scene, readonly id: string, x: number, y: number, h: number, private flip: boolean) {
    this.img = scene.add.image(0, 0, `q-${id}`).setOrigin(0.5, 1).setFlipX(flip);
    const s = h / this.img.height;
    this.img.setScale(s);
    this.box = scene.add.container(x, y, [this.img]).setDepth(10);
    this.base = { x, y, s };
  }
  /** Punto donde mirar para un primer plano (la cara, más o menos). */
  get face() { return { x: this.box.x, y: this.box.y - this.img.displayHeight * 0.72 }; }
  get body() { return { x: this.box.x, y: this.box.y - this.img.displayHeight * 0.5 }; }
  private dir() { return this.flip ? -1 : 1; }

  /** Cambia de cara: con su imagen si la hay; si no, con la pose. */
  setCara(c: Cara) {
    if (c === this.cara) return;
    this.cara = c;
    const key = caraKey(this.id, c);
    if (!this.revealed) this.img.setTexture(this.scene.textures.exists(key) ? key : `q-${this.id}`);
    const p = POSE[this.scene.textures.exists(key) ? "neutral" : c];
    this.pose?.stop();
    this.img.clearTint();
    if (p.tint) this.img.setTint(p.tint);
    this.pose = this.scene.tweens.add({ targets: this.img, scaleX: this.base.s * p.sx, scaleY: this.base.s * p.sy, angle: p.angle * this.dir(), y: p.dy, duration: 120, ease: "Quad.easeOut" });
  }
  /** El latido del compás: un rebote corto (0,2 s). */
  rebote(fuerte = false) {
    const k = fuerte ? MONTAJE.rebote.escala + 0.03 : MONTAJE.rebote.escala;
    this.box.setScale(1);
    this.scene.tweens.add({ targets: this.box, scaleY: k, scaleX: 1 + (k - 1) * 0.4, duration: MONTAJE.rebote.ms / 2, yoyo: true, ease: "Sine.easeOut" });
  }
  /** Luz: la que domina, a todo color; la otra, en penumbra. */
  luz(on: boolean) {
    if (this.cara === "tension") return;
    if (on) this.img.clearTint(); else this.img.setTint(0x9a8aa8);
  }
  /** Un número especial (reveal, death drop, vuelta, foco). Devuelve cuánto dura, en ms. */
  numero(n: Numero, sparks: Phaser.GameObjects.Particles.ParticleEmitter): number {
    const sc = this.scene, img = this.img, box = this.box, b = this.base;
    if (n === "reveal") {
      sc.cameras.main.flash(260, 255, 255, 255);
      const key = revealKey(this.id);
      if (sc.textures.exists(key)) { img.setTexture(key); this.revealed = true; }
      else { img.setTint(0xffe08a); sc.time.delayedCall(700, () => img.clearTint()); }
      sparks.explode(70, this.face.x, this.face.y);
      this.cartel("¡REVEAL!");
      return 900;
    }
    if (n === "dip") {
      sc.tweens.chain({ targets: box, tweens: [
        { y: b.y + img.displayHeight * 0.12, angle: 14 * this.dir(), duration: 180, ease: "Quad.easeIn" },
        { y: b.y, angle: 0, duration: 380, delay: 260, ease: "Back.easeOut" },
      ] });
      sc.time.delayedCall(170, () => sc.cameras.main.shake(180, 0.008));
      sparks.explode(25, box.x, b.y - 10);
      this.cartel("¡DEATH DROP!");
      return 850;
    }
    if (n === "giro") {
      sc.tweens.add({ targets: box, angle: 360 * this.dir(), x: b.x + this.dir() * sc.scale.width * 0.08, duration: 520, ease: "Cubic.easeOut", onComplete: () => { box.setAngle(0); sc.tweens.add({ targets: box, x: b.x, duration: 300 }); } });
      sparks.explode(30, this.body.x, this.body.y);
      return 820;
    }
    sparks.explode(18, this.face.x, this.face.y);
    sc.tweens.add({ targets: box, scale: 1.08, duration: 220, yoyo: true, hold: 160 });
    return 600;
  }
  /** Un rótulo grande que aparece y se va (como en la tele). */
  cartel(t: string) {
    const sc = this.scene;
    const txt = sc.add.text(this.face.x, this.face.y - 40, t, { fontFamily: "Bungee, sans-serif", fontSize: `${Math.round(sc.scale.height * 0.06)}px`, color: "#ffd84d", stroke: "#2b1238", strokeThickness: 8 }).setOrigin(0.5).setScale(0.4).setDepth(30);
    sc.tweens.chain({ targets: txt, tweens: [{ scale: 1, duration: 220, ease: "Back.easeOut" }, { alpha: 0, y: txt.y - 40, duration: 380, delay: 500 }], onComplete: () => txt.destroy() });
  }
}
