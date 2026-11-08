// Escena del lip sync: las dos reinas en el escenario y la realización de tele (cortes a compás, caras, focos,
// números y suspense del veredicto). Las decisiones viven en src/core/montaje.ts y la realización en
// ../playback/director.ts; los botones son de React.
import Phaser from "phaser";
import { store, get } from "../../store";
import { loadQueens } from "../queens";
import { loadPlayback } from "../playback/assets";
import { Performer } from "../playback/performer";
import { Director } from "../playback/director";
import { onResizeRestart } from "./resize";

export class LipSync extends Phaser.Scene {
  private dir?: Director;
  constructor() { super("LipSync"); }
  preload() {
    const ls = get().ls;
    const ids = [get().queenId, ls?.rivalId].filter(Boolean) as string[];
    loadQueens(this, ids);
    loadPlayback(this, ids);
  }
  create() {
    const { width: W, height: H } = this.scale;
    const ls = get().ls!;
    const bg = this.add.image(W / 2, H / 2, "stage");
    bg.setScale(Math.max(W / bg.width, H / bg.height));
    this.add.rectangle(W / 2, H / 2, W, H, 0x14031f, 0.25);
    const h = H * 0.58;
    const me = new Performer(this, get().queenId, W * 0.3, H * 0.92, h, false);
    const them = new Performer(this, ls.rivalId, W * 0.7, H * 0.92, h, true);
    this.dir = new Director(this, { me, them });
    // Si se ha reiniciado la escena (cambio de tamaño) con la canción ya acabada, directo al veredicto
    if (ls.done && !ls.reveal) this.dir.veredicto();
    // Cada movimiento resuelto: la realización reacciona
    let lastAnim = ls.anim;
    const unsub = store.subscribe((s) => {
      if (!s.ls || s.ls.anim === lastAnim) return;
      lastAnim = s.ls.anim;
      this.dir?.movimiento();
    });
    this.events.once("shutdown", () => { unsub(); this.dir = undefined; });
    onResizeRestart(this);
  }
  update() { this.dir?.update(); }
}
