// Tacón lanzado por la jugadora (sube)
class Tacones {
  constructor(origen) {
    this.node = document.createElement("img");
    this.node.src = "./images/tacon.png";
    this.node.alt = "";
    cajaJuegoNode.append(this.node);

    this.w = 50;
    this.h = 50;
    this.x = origen.x + origen.w / 2 - this.w / 2;
    this.y = origen.y - this.h / 2;
    this.speed = 10;

    this.node.style.width = `${this.w}px`;
    this.node.style.height = `${this.h}px`;
    this.node.style.position = "absolute";
    this.render();
  }

  taconesVolando() {
    this.y -= this.speed;
    this.render();
  }

  fueraDePantalla() {
    return this.y + this.h < 0;
  }

  render() {
    this.node.style.left = `${this.x}px`;
    this.node.style.top = `${this.y}px`;
  }

  destroy() {
    this.node.remove();
  }
}
