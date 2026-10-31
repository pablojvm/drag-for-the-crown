// Arranque de Phaser: escala a la ventana, física arcade y las escenas del juego nuevo.
import Phaser from "phaser";
import { Boot } from "./scenes/Boot";
import { Menu } from "./scenes/Menu";
import { Arcade } from "./scenes/Arcade";
import { listen, send } from "../bridge";
import { set } from "../store";

export function startGame(parent: HTMLElement) {
  const game = new Phaser.Game({
    type: Phaser.AUTO,
    parent,
    backgroundColor: "#14031f",
    scale: { mode: Phaser.Scale.RESIZE, width: parent.clientWidth, height: parent.clientHeight },
    physics: { default: "arcade", arcade: { debug: false } },
    scene: [Boot, Menu, Arcade],
  });
  const off = listen((c) => {
    if (c.type === "start") { set({ queenId: c.queenId }); game.scene.getScenes(true).forEach((s) => s.scene.stop()); game.scene.start("Arcade"); }
    if (c.type === "menu") { game.scene.getScenes(true).forEach((s) => s.scene.stop()); set({ screen: "menu", paused: false }); game.scene.start("Menu"); }
    if (c.type === "mute") game.sound.mute = c.on;
  });
  // Al perder el foco, pausa (como el juego de siempre)
  const vis = () => { if (document.hidden) send({ type: "pause", on: true }); };
  document.addEventListener("visibilitychange", vis);
  (window as any).__phaser = game; // para depurar y para las pruebas
  return () => { off(); document.removeEventListener("visibilitychange", vis); game.destroy(true); };
}
