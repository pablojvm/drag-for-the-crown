// Menú: escenario con focos, el logo que respira y las reinas bailando. Los botones son de React.
import Phaser from "phaser";
import { ARCADE_QUEENS } from "../data";
import { get } from "../../store";

export class Menu extends Phaser.Scene {
  private queens: Phaser.GameObjects.Image[] = [];
  constructor() { super("Menu"); }
  create() {
    const { width: W, height: H } = this.scale;
    const bg = this.add.image(W / 2, H / 2, "stage");
    bg.setScale(Math.max(W / bg.width, H / bg.height)).setAlpha(0.9);
    // Purpurina que cae
    this.add.particles(0, -10, "spark", { x: { min: 0, max: W }, lifespan: 6000, speedY: { min: 30, max: 80 }, speedX: { min: -15, max: 15 }, scale: { start: 0.5, end: 0 }, alpha: { start: 0.9, end: 0 }, tint: [0xffd84d, 0xff5fa2, 0xffffff], frequency: 120, blendMode: "ADD" });
    const logo = this.add.image(W / 2, H * 0.2, "logo");
    logo.setScale(Math.min((W * 0.5) / logo.width, (H * 0.28) / logo.height));
    this.tweens.add({ targets: logo, scale: logo.scale * 1.04, duration: 1400, yoyo: true, repeat: -1, ease: "Sine.easeInOut" });
    // Dos reinas a los lados del panel, bailando (la elegida a la izquierda)
    const mine = ARCADE_QUEENS.find((q) => q.id === get().queenId) || ARCADE_QUEENS[0];
    const other = ARCADE_QUEENS.find((q) => q !== mine)!;
    [mine, other].forEach((q, i) => {
      const x = W * (i === 0 ? 0.1 : 0.9), y = H * 0.98;
      const img = this.add.image(x, y, `q-${q.id}`).setOrigin(0.5, 1);
      img.setScale((H * 0.55) / img.height);
      if (i === 1) img.setFlipX(true);
      this.tweens.add({ targets: img, y: y - 12, angle: { from: -2, to: 2 }, duration: 520 + i * 110, yoyo: true, repeat: -1, ease: "Sine.easeInOut", delay: i * 180 });
      this.queens.push(img);
    });
    this.scale.on("resize", () => this.scene.restart());
  }
}
