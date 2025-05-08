class Enemigos {
  constructor() {
    this.node = document.createElement("img");
    let randIndex= Math.floor(Math.random() * enemiesSrc.length)
    this.node.src= enemiesSrc[randIndex]
    enemiesSrc.splice(randIndex, 1)
    cajaJuegoNode.append(this.node);

    this.x = Math.floor(Math.random() * 750);
    this.y = Math.floor(Math.random() * 350);
    this.w = 150;
    this.h = 150;
    this.node.style.width = `${this.w}px`;
    this.node.style.height = `${this.h}px`;

    this.node.style.position = "absolute";
    this.node.style.top = `${this.y}px`;
    this.node.style.left = `${this.x}px`;

    this.speed = 3;
    this.isMovingRight = true;
    this.isMovingDown = true;
  }

  moverEnemigos() {
    if (this.isMovingRight === true) {
      this.x += this.speed;
      this.node.style.left = `${this.x}px`;
    } else {
      this.x -= this.speed;
      this.node.style.left = `${this.x}px`;
    }

    if (this.isMovingDown === true) {
      this.y += this.speed;
      this.node.style.top = `${this.y}px`;
    } else {
      this.y -= this.speed;
      this.node.style.top = `${this.y}px`;
    }
  }

  checkColissionEnemigosWall() {
    if (this.x > cajaJuegoNode.offsetWidth - this.w) {
      this.isMovingRight = false;
    }
    if (this.x <= 0) {
      this.isMovingRight = true;
    }
    if (this.y > cajaJuegoNode.offsetHeight / 2 - this.h) {
      this.isMovingDown = false;
    }
    if (this.y <= 0) {
      this.isMovingDown = true;
    }
  }
}
