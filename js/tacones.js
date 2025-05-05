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

    this.speed = 10;
  }

  taconesVolando() {
    this.y--;
    this.node.style.top = `${this.y}px`;
  }

  taconesAppear() {

    let taconesObj = new Tacones(); //console.log(pollitoObj)
    tuberiasArr.push(taconesObj);
    tuberiasDestroy();
  }

  taconesDestroy() {
    if (taconesArr.length > 0 && taconesArr[0].x + taconesArr[0].w <= 0) {
      taconesArr[0].node.remove();
      taconesArr.shift();
    }
  }
}
