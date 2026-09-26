class Personaje {
  constructor(src) {
    this.node = document.createElement("img");
    this.node.src = src;
    this.node.alt = "";
    cajaJuegoNode.append(this.node);

    this.w = 150;
    this.h = 150;
    this.x = (GAME_W - this.w) / 2;
    this.y = GAME_H - this.h - 20;
    this.speed = 7; // px por frame

    this.node.style.width = `${this.w}px`;
    this.node.style.height = `${this.h}px`;
    this.node.style.position = "absolute";
    this.render();
  }

  mover(teclas) {
    if (teclas.has("ArrowLeft")) this.x -= this.speed;
    if (teclas.has("ArrowRight")) this.x += this.speed;
    if (teclas.has("ArrowUp")) this.y -= this.speed;
    if (teclas.has("ArrowDown")) this.y += this.speed;

    // Límites: solo la mitad inferior del escenario
    this.x = Math.max(0, Math.min(GAME_W - this.w, this.x));
    this.y = Math.max(GAME_H / 2, Math.min(GAME_H - this.h, this.y));
    this.render();
  }

  render() {
    this.node.style.left = `${this.x}px`;
    this.node.style.top = `${this.y}px`;
  }
}
