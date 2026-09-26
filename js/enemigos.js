class Enemigos {
  constructor(src, speed) {
    this.node = document.createElement("img");
    this.node.src = src;
    this.node.alt = "";
    cajaJuegoNode.append(this.node);

    this.w = 150;
    this.h = 150;
    this.x = Math.floor(Math.random() * (GAME_W - this.w));
    this.y = Math.floor(Math.random() * (GAME_H / 2 - this.h));
    this.speed = speed;
    this.isMovingRight = Math.random() > 0.5;
    this.isMovingDown = Math.random() > 0.5;

    this.node.style.width = `${this.w}px`;
    this.node.style.height = `${this.h}px`;
    this.node.style.position = "absolute";
    this.render();
  }

  moverEnemigos() {
    this.x += this.isMovingRight ? this.speed : -this.speed;
    this.y += this.isMovingDown ? this.speed : -this.speed;
    this.render();
  }

  checkColissionEnemigosWall() {
    if (this.x >= GAME_W - this.w) this.isMovingRight = false;
    if (this.x <= 0) this.isMovingRight = true;
    if (this.y >= GAME_H / 2 - this.h) this.isMovingDown = false;
    if (this.y <= 0) this.isMovingDown = true;
  }

  render() {
    this.node.style.left = `${this.x}px`;
    this.node.style.top = `${this.y}px`;
  }

  destroy() {
    this.node.remove();
  }
}
