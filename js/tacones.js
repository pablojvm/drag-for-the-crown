class Tacones {
  constructor() {
    this.node = document.createElement("img");
    this.node.src = "./images/tacon.png";
    cajaJuegoNode.append(this.node);

    this.x = mainPersonaje.x;
    this.y = mainPersonaje.y;
    this.w = 50;
    this.h = 50;
    this.node.style.width = `${this.w}px`;
    this.node.style.height = `${this.h}px`;

    this.node.style.position = "absolute";
    this.node.style.top = `${this.y}px`;
    this.node.style.left = `${this.x}px`;

    this.speed = 15;
  }

  taconesVolando() {
    this.y -= 10;
    this.node.style.top = `${this.y}px`;
  }

  taconesDestroy() {
    if (taconesArr.length > 0 && taconesArr[0].x + taconesArr[0].w <= 0) {
      taconesArr[0].node.remove();
      taconesArr.shift();
    }
  }


}
