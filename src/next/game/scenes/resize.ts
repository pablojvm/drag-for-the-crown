// Volver a montar una escena cuando cambia el tamaño de la ventana, sin los fallos de antes:
// - el aviso se quita al cerrar la escena (antes se acumulaban y una escena ya cerrada, como el menú,
//   volvía a arrancar encima de la pasarela);
// - mientras escribes (el teclado del iPad o del móvil cambia el tamaño) no se reinicia nada;
// - si llegan varios seguidos (girar el móvil, la barra del navegador), se espera a que paren.
import type Phaser from "phaser";

export function onResizeRestart(scene: Phaser.Scene, ms = 250) {
  let t = 0;
  const writing = () => { const a = document.activeElement as HTMLElement | null; return !!a && (a.tagName === "INPUT" || a.tagName === "TEXTAREA" || a.isContentEditable); };
  const onResize = () => {
    clearTimeout(t);
    t = window.setTimeout(() => {
      if (!scene.scene.isActive() || writing()) return;
      scene.scene.restart();
    }, ms);
  };
  scene.scale.on("resize", onResize);
  scene.events.once("shutdown", () => { clearTimeout(t); scene.scale.off("resize", onResize); });
}
