// Plató de la temporada: el taller o el escenario de fondo y tu reina a un lado. La interfaz (React) va encima.
import Phaser from "phaser";
import { store, get } from "../../store";
import { loadQueens } from "../queens";

export class Plato extends Phaser.Scene {
  constructor() { super("Plato"); }
  preload() {
    loadQueens(this, [get().queenId]);
  }
  create() {
    const { width: W, height: H } = this.scale;
    const draw = () => {
      this.children.removeAll(true);
      const bgKey = get().ts?.bg === "stage" ? "stage" : "werkroom";
      const bg = this.add.image(W / 2, H / 2, bgKey);
      bg.setScale(Math.max(W / bg.width, H / bg.height));
      this.add.rectangle(W / 2, H / 2, W, H, 0x14031f, 0.35);
      // Tu reina, a la izquierda, respirando (en pantallas estrechas se esconde para dejar sitio)
      if (W >= 760 && this.textures.exists(`q-${get().queenId}`)) {
        const q = this.add.image(W * 0.12, H * 0.98, `q-${get().queenId}`).setOrigin(0.5, 1);
        q.setScale((H * 0.62) / q.height);
        this.tweens.add({ targets: q, y: q.y - 8, duration: 900, yoyo: true, repeat: -1, ease: "Sine.easeInOut" });
      }
    };
    draw();
    let bg = get().ts?.bg;
    const unsub = store.subscribe((s) => { if (s.ts?.bg !== bg) { bg = s.ts?.bg; draw(); } });
    this.events.once("shutdown", unsub);
    this.scale.on("resize", () => this.scene.restart());
  }
}
