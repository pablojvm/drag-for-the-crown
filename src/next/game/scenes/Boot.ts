// Carga de recursos con barra de progreso (la barra la pinta React a partir de `loading`).
import Phaser from "phaser";
import { ARCADE_QUEENS } from "../data";
import { set } from "../../store";

export class Boot extends Phaser.Scene {
  constructor() { super("Boot"); }
  preload() {
    this.load.setPath("./");
    this.load.image("stage", "images/sets/stage.jpg");
    this.load.image("werkroom", "images/sets/werkroom.jpg");
    this.load.image("logo", "images/logo-menu.png");
    this.load.image("heel", "images/tacon.png");
    this.load.image("lipstick", "images/lipstick.png");
    ARCADE_QUEENS.forEach((q) => this.load.image(`q-${q.id}`, q.sprite));
    this.load.on("progress", (p: number) => set({ loading: p }));
  }
  create() {
    // Texturas hechas en código: brillo para partículas y foco
    const g = this.make.graphics({ x: 0, y: 0 }, false);
    g.fillStyle(0xffffff, 1).fillCircle(6, 6, 6).generateTexture("spark", 12, 12).clear();
    g.fillStyle(0xff3d9a, 1).fillCircle(5, 5, 5).generateTexture("dot", 10, 10).destroy();
    set({ loading: 1, screen: "menu" });
    this.scene.start("Menu");
  }
}
