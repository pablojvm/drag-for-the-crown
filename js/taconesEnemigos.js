// Tacón lanzado por la drag enemiga (baja)
class TaconesEnemigos {
  constructor(origen, speed) {
    this.node = document.createElement("img");
    this.node.src = "./images/tacon.png";
    this.node.alt = "";
    this.node.style.transform = "rotate(180deg)";
    cajaJuegoNode.append(this.node);

    this.w = 50;
    this.h = 50;
    this.x = origen.x + origen.w / 2 - this.w / 2;
    this.y = origen.y + origen.h - this.h / 2;
    this.speed = speed;

    this.node.style.width = `${this.w}px`;
    this.node.style.height = `${this.h}px`;
    this.node.style.position = "absolute";
    this.render();
  }

  taconesEnemigosVolando() {
    this.y += this.speed;
    this.render();
  }

  fueraDePantalla() {
    return this.y > GAME_H;
  }

  render() {
    this.node.style.left = `${this.x}px`;
    this.node.style.top = `${this.y}px`;
  }

  destroy() {
    this.node.remove();
  }
}
