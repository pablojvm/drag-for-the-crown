// Menú: carrusel de modos (Historia, Arcade, Multijugador)
import { carousel } from "./carousel";

const modes = document.querySelector<HTMLElement>("#modes");
if (modes) {
  const c = carousel(modes, { storageKey: "dftc-menu-mode", keys: () => !!document.querySelector("#screen-menu.active") });
  // Al volver al menú se recoloca en el modo elegido
  new MutationObserver(() => { if (document.querySelector("#screen-menu.active")) requestAnimationFrame(c.recenter); })
    .observe(document.querySelector("#screen-menu")!, { attributes: true, attributeFilter: ["class"] });
}

// Arcade: los controles se enseñan unos segundos al empezar (ya no están en el menú)
const game = document.querySelector<HTMLElement>("#screen-game");
const help = document.querySelector<HTMLElement>("#game-help");
if (game && help) {
  let t = 0;
  new MutationObserver(() => {
    const on = game.classList.contains("active");
    clearTimeout(t);
    help.classList.toggle("show", on);
    if (on) t = window.setTimeout(() => help.classList.remove("show"), 6000);
  }).observe(game, { attributes: true, attributeFilter: ["class"] });
}
