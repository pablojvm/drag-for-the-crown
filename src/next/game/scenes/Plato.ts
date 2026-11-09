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
    let me: Phaser.GameObjects.Image | null = null;
    // En móviles y tabletas el plató es un fondo quieto: se pinta y el bucle de Phaser se duerme hasta que
    // cambie algo (decorado, reina, tamaño). Así la historia y el multijugador, que van encima, van fluidos.
    const quieto = typeof matchMedia !== "undefined" && (matchMedia("(pointer: coarse)").matches || matchMedia("(prefers-reduced-motion: reduce)").matches);
    const loop = this.game.loop;
    let idle = 0;
    const poke = () => {
      if (!quieto) return;
      loop.wake();
      clearTimeout(idle);
      idle = window.setTimeout(() => {
        // Solo se duerme si el plató es lo único que hay y no hay nada pendiente (otra escena a punto de arrancar, cargas...)
        const sm = this.game.scene as unknown as { getScenes(a: boolean): Phaser.Scene[]; _queue?: unknown[]; _start?: unknown[]; _pending?: unknown[] };
        const quiet = sm.getScenes(true).length === 1 && !(sm._queue?.length || sm._start?.length || sm._pending?.length) && Date.now() >= (this.game.registry.get("noSleepUntil") || 0);
        if (this.scene.isActive() && !this.load.isLoading() && quiet) loop.sleep(); else poke();
      }, 500);
    };
    this.events.once("shutdown", () => { clearTimeout(idle); loop.wake(); });
    // Mientras hay una conversación, la reina que habla sale en grande: la del plató se aparta
    const onDlg = () => { const v = !document.querySelector(".nx-dlg") && !(get().screen === "historia" && get().hist.busy); if (me && me.visible !== v) { me.setVisible(v); poke(); } };
    addEventListener("nx-dlg", onDlg);
    this.events.once("shutdown", () => removeEventListener("nx-dlg", onDlg));
    const draw = () => {
      const { width: W, height: H } = this.scale;
      this.tweens.killAll();
      this.children.removeAll(true);
      me = null;
      const bgKey = get().hist.bg === "stage" ? "stage" : "werkroom";
      const bg = this.add.image(W / 2, H / 2, bgKey);
      bg.setScale(Math.max(W / bg.width, H / bg.height));
      this.add.rectangle(W / 2, H / 2, W, H, 0x14031f, 0.35);
      // Tu reina, a la izquierda, respirando (en pantallas estrechas se esconde para dejar sitio)
      if (W >= 760 && this.textures.exists(`q-${get().queenId}`)) {
        const q = this.add.image(W * 0.12, H * 0.98, `q-${get().queenId}`).setOrigin(0.5, 1);
        q.setScale((H * 0.62) / q.height);
        me = q;
        onDlg();
        if (!quieto) this.tweens.add({ targets: q, y: q.y - 8, duration: 900, yoyo: true, repeat: -1, ease: "Sine.easeInOut" });
      }
      poke();
    };
    draw();
    const bgOf = () => get().hist.bg;
    let bg = bgOf();
    // Si cambia tu reina (la eliges o llega de la historia), se carga su imagen sin reiniciar la escena
    let queen = get().queenId;
    const unsub = store.subscribe((s) => {
      if (s.queenId !== queen) {
        queen = s.queenId;
        const key = `q-${queen}`;
        if (this.textures.exists(key)) draw();
        else {
          this.textures.once(`addtexture-${key}`, () => { if (this.scene.isActive()) draw(); });
          poke();
          loadQueens(this, [queen]);
          if (!this.load.isLoading()) this.load.start();
        }
        return;
      }
      if (bgOf() !== bg) { bg = bgOf(); draw(); }
      onDlg();
    });
    this.events.once("shutdown", unsub);
    // Al cambiar de tamaño (en el móvil pasa a menudo: la barra del navegador, girarlo) se vuelve a pintar, sin reiniciar
    const onResize = () => draw();
    this.scale.on("resize", onResize);
    // Con el bucle dormido Phaser no ve el cambio de tamaño: se le despierta
    addEventListener("resize", poke);
    this.events.once("shutdown", () => { this.scale.off("resize", onResize); removeEventListener("resize", poke); });
  }
}
