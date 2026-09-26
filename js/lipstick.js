class Vidas {
  constructor(x) {
    this.node = document.createElement("img");
    this.node.src = "./images/lipstick.png";
    this.node.alt = "";
    cajaDeVidasNode.append(this.node);

    this.w = 100;
    this.h = 100;
    this.node.style.width = `${this.w}px`;
    this.node.style.height = `${this.h}px`;
    this.node.style.position = "absolute";
    this.node.style.top = "0px";
    this.node.style.left = `${x}px`;
  }

  destroy() {
    this.node.remove();
  }
}
