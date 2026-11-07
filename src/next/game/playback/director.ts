// Realización del lip sync: reloj de compás (con la canción si suena), cortes de cámara, luces, números y el
// suspense del veredicto. Las decisiones salen de src/core/montaje.ts; aquí solo se ejecutan en la escena.
import Phaser from "phaser";
import { MONTAJE, parteDe, hayCorte, planoDe, caraDe, domina, numeroDe, suspense, type Actor, type Plano } from "../../../core/montaje";
import { get } from "../../store";
import { rivalSoFar, revealLipSync } from "../lipsync";
import { isMusicOn } from "../music";
import { Performer } from "./performer";
import { JURADO } from "./assets";

const REACCIONES = ["¡Esto está reñidísimo!", "¡Qué nivel, reinas!", "No sé con quién quedarme...", "¡Me muero!", "Las dos lo están dando todo."];
const TAGS = ["Emote", "Cara", "Escenario"];

export class Director {
  private beat = -1;
  private t0 = 0;
  private audio: HTMLAudioElement | null = null;
  private plano: Plano = "general";
  /** Tras un movimiento, el siguiente corte va a quien lo ha hecho. */
  private foco: Plano | null = null;
  private ultimo: Record<Actor, { v: "bien" | "mal"; hasta: number } | null> = { me: null, them: null };
  private suspenseOn = false;
  private calma: boolean;
  private luces: Record<Actor, Phaser.GameObjects.Image>;
  private oscuro: Phaser.GameObjects.Rectangle;
  private sparks: Phaser.GameObjects.Particles.ParticleEmitter;

  constructor(private sc: Phaser.Scene, private p: Record<Actor, Performer>) {
    const { width: W, height: H } = sc.scale;
    const cam = sc.cameras.main;
    cam.setBounds(0, 0, W, H);
    // Sin movimientos bruscos para quien lo pide en su sistema: se quedan las luces, sin cortes ni zooms
    this.calma = typeof matchMedia !== "undefined" && matchMedia("(prefers-reduced-motion: reduce)").matches;
    this.oscuro = sc.add.rectangle(W / 2, H / 2, W, H, 0x0b0112, 0).setDepth(5);
    // Focos: un cono de luz encima de cada una (textura hecha en código)
    if (!sc.textures.exists("cono")) {
      const g = sc.make.graphics({ x: 0, y: 0 }, false);
      for (let i = 0; i < 24; i++) { g.fillStyle(0xfff3c4, 0.035); g.fillTriangle(128, 0, 128 - 30 - i * 4, 512, 128 + 30 + i * 4, 512); }
      g.generateTexture("cono", 256, 512).destroy();
    }
    const cono = (x: number) => sc.add.image(x, 0, "cono").setOrigin(0.5, 0).setDisplaySize(W * 0.42, H * 0.98).setBlendMode(Phaser.BlendModes.ADD).setAlpha(0.35).setDepth(6);
    this.luces = { me: cono(p.me.box.x), them: cono(p.them.box.x) };
    this.sparks = sc.add.particles(0, 0, "spark", { lifespan: 800, speed: { min: 120, max: 360 }, scale: { start: 0.9, end: 0 }, tint: [0xffd84d, 0xff5fa2, 0xffffff], blendMode: "ADD", emitting: false }).setDepth(25);
    // La canción (si la música está encendida); el compás se lleva con su tiempo. Si no suena, con el reloj.
    const C = MONTAJE.cancion;
    if (C.src && isMusicOn() && !get().muted && typeof Audio !== "undefined") {
      const a = new Audio(C.src);
      a.volume = C.volumen;
      a.play().then(() => { this.audio = a; }).catch(() => {});
      sc.events.once("shutdown", () => { a.pause(); a.src = ""; });
    }
    this.t0 = sc.time.now;
  }

  /** Tiempo actual de la canción (en tiempos de compás). */
  private now() {
    const C = MONTAJE.cancion;
    const secs = this.audio && !this.audio.paused ? this.audio.currentTime - C.offset : (this.sc.time.now - this.t0) / 1000;
    return Math.max(0, Math.floor((secs * C.bpm) / 60));
  }
  /** Se llama en cada fotograma desde la escena. */
  update() {
    const b = this.now();
    if (b === this.beat || this.suspenseOn) return;
    this.beat = b;
    this.onBeat(b);
  }
  private onBeat(b: number) {
    const ls = get().ls;
    if (!ls || ls.done) return;
    const parte = parteDe(ls.step);
    (["me", "them"] as Actor[]).forEach((a) => {
      const u = this.ultimo[a] && this.ultimo[a]!.hasta > b ? this.ultimo[a]!.v : null;
      this.p[a].setCara(caraDe({ beat: b, parte, ultimo: u, actor: a }));
      this.p[a].rebote(parte === 2 && b % 2 === 0);
    });
    // Clímax: la luz late con el golpe
    if (parte === 2) this.sc.tweens.add({ targets: [this.luces.me, this.luces.them], alpha: "+=0.15", duration: 90, yoyo: true });
    if (hayCorte(b, parte)) {
      this.cortar(planoDe({ beat: b, parte, foco: this.foco, anterior: this.plano, rnd: Math.random() }), false);
      this.foco = null;
    }
  }

  /** Corte de plano (seco) o «punch-in» (acercamiento rápido). */
  cortar(pl: Plano, punch: boolean) {
    this.plano = pl;
    if (this.calma) return;
    const cam = this.sc.cameras.main;
    const { width: W, height: H } = this.sc.scale;
    const z = MONTAJE.zoom[pl];
    const at = pl === "me" ? this.p.me.face : pl === "them" ? this.p.them.face : pl === "duo" ? { x: W / 2, y: this.p.me.face.y + H * 0.1 } : { x: W / 2, y: H / 2 };
    if (punch) { cam.zoomTo(z, MONTAJE.punchMs, "Quad.easeOut", true); cam.pan(at.x, at.y, MONTAJE.punchMs, "Quad.easeOut", true); }
    else { cam.setZoom(z); cam.centerOn(at.x, at.y); }
  }

  /** Un movimiento resuelto (lo dice la escena cuando cambia el estado del lip sync). */
  movimiento() {
    const ls = get().ls;
    if (!ls) return;
    const parte = parteDe(Math.max(0, ls.step - 1));
    const b = Math.max(0, this.beat);
    // Tú: si ha salido bien o mal, se te nota en la cara un par de compases; y la cámara va a ti
    this.ultimo.me = { v: ls.lastOk === false ? "mal" : "bien", hasta: b + 4 };
    this.cortar("me", true);
    const n = numeroDe({ tag: ls.lastTag, ok: ls.lastOk !== false, imp: ls.lastImp ?? 0, parte });
    let dur = 0;
    if (n) dur = this.p.me.numero(n, this.sparks);
    else this.p.me.rebote(true);
    if (n && !this.calma) this.sc.cameras.main.shake(140, 0.004);
    // La rival contesta un momento después (su movimiento lo cuenta el texto de abajo)
    this.sc.time.delayedCall(Math.max(700, dur), () => {
      if (this.suspenseOn) return;
      const tag = TAGS[ls.anim % 3];
      this.cortar("them", true);
      this.ultimo.them = { v: "bien", hasta: b + 4 };
      // En el clímax, la rival también se marca su número (si va fuerte)
      if (parte === 2 && rivalSoFar(ls) >= ls.mine * 0.9) this.p.them.numero(tag === "Emote" ? "dip" : tag === "Escenario" ? "giro" : "foco", this.sparks);
      else this.p.them.rebote(true);
      this.foco = "duo"; // el siguiente corte, a las dos
      this.iluminar();
      if (ls.done) this.sc.time.delayedCall(900, () => this.veredicto());
    });
    this.iluminar();
  }

  /** La que domina, con más luz; la otra, en penumbra. */
  private iluminar() {
    const ls = get().ls;
    if (!ls) return;
    const d = domina(ls.mine, rivalSoFar(ls));
    (["me", "them"] as Actor[]).forEach((a) => {
      const on = !d || d === a;
      this.sc.tweens.add({ targets: this.luces[a], alpha: d === a ? 0.6 : on ? 0.35 : 0.12, duration: 300 });
      this.p[a].luz(on);
    });
  }

  /** Antes del veredicto: se apaga el plató, el foco va de una a otra cada vez más rápido, corte al jurado y golpe final. */
  veredicto() {
    if (this.suspenseOn) return;
    this.suspenseOn = true;
    const ls = get().ls!;
    const gana: Actor = ls.mine >= ls.rival ? "me" : "them";
    const sc = this.sc;
    if (this.audio) sc.tweens.addCounter({ from: this.audio.volume, to: 0.08, duration: 800, onUpdate: (t) => { if (this.audio) this.audio.volume = t.getValue() ?? 0; } });
    this.cortar("general", true);
    sc.tweens.add({ targets: this.oscuro, fillAlpha: 0.55, duration: 500 });
    let t = 500;
    for (const f of suspense(gana)) {
      sc.time.delayedCall(t, () => this.focoSolo(f.foco));
      t += f.ms;
    }
    sc.time.delayedCall(t, () => this.jurado());
    t += MONTAJE.suspense.jurado;
    sc.time.delayedCall(t, () => {
      this.focoSolo(gana);
      this.cortar(gana, true);
      sc.cameras.main.flash(380, 255, 255, 255);
      this.sparks.explode(90, this.p[gana].face.x, this.p[gana].face.y);
      this.p[gana].setCara("grito");
      this.p[gana === "me" ? "them" : "me"].setCara("tension");
      if (this.audio) this.audio.pause();
      revealLipSync();
    });
  }
  private focoSolo(a: Actor) {
    const o: Actor = a === "me" ? "them" : "me";
    this.luces[a].setAlpha(0.75);
    this.luces[o].setAlpha(0.04);
    this.p[a].luz(true);
    this.p[o].luz(false);
  }
  /** Corte de reacción del jurado: una de ellas, en un recuadro, con su frase. */
  private jurado() {
    const sc = this.sc;
    const { width: W, height: H } = sc.scale;
    this.cortar("general", false);
    const j = JURADO[Math.floor(Math.random() * JURADO.length)];
    if (!sc.textures.exists(j.key)) return;
    const w = Math.min(W * 0.34, 340), h = H * 0.42;
    const x = W * 0.06 + w / 2, y = H * 0.12 + h / 2;
    const marco = sc.add.rectangle(x, y, w, h, 0x2b1238, 0.92).setStrokeStyle(4, 0xff3d9a).setDepth(40);
    const img = sc.add.image(x, y + h / 2 - 6, j.key).setOrigin(0.5, 1).setDepth(41);
    img.setScale(Math.min((h * 0.92) / img.height, (w * 0.9) / img.width));
    const txt = sc.add.text(x, y + h / 2 + 14, `${j.name}: «${REACCIONES[Math.floor(Math.random() * REACCIONES.length)]}»`, { fontFamily: "Poppins, sans-serif", fontSize: `${Math.max(14, Math.round(H * 0.024))}px`, color: "#ffffff", backgroundColor: "#2b1238", padding: { x: 10, y: 6 }, wordWrap: { width: w } }).setOrigin(0.5, 0).setDepth(41);
    const all = [marco, img, txt];
    all.forEach((o) => { o.setAlpha(0); (o as any).x -= 40; });
    sc.tweens.add({ targets: all, alpha: 1, x: "+=40", duration: 220, ease: "Quad.easeOut" });
    sc.time.delayedCall(MONTAJE.suspense.jurado - 250, () => sc.tweens.add({ targets: all, alpha: 0, duration: 200, onComplete: () => all.forEach((o) => o.destroy()) }));
  }
}
