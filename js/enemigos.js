class Enemigos {
  constructor() {
    this.node = document.createElement("img");
    let randIndex= Math.floor(Math.random() * enemiesSrc.length)
    this.node.src= enemiesSrc[randIndex]
    enemiesSrc.splice(randIndex, 1)
    // if (randNumber === 1) {
    //  this.node.src = "./images/drags/trinity.png";
    // } else if (randNumber === 2) {
    //   this.node.src = "./images/drags/sheaCoulee.png";
    // } else if (randNumber === 3) {
    //   this.node.src = "./images/drags/plastiqueTiara.png";
    // } else if (randNumber === 4) {
    //   this.node.src = "./images/drags/monetXChange.png";
    // } else if (randNumber === 5) {
    //   this.node.src = "./images/drags/jimbo.png";
    // } else if (randNumber === 6) {
    //   this.node.src = "./images/drags/angeriaPVM.png";
    // } console.log(randNumber)
    cajaJuegoNode.append(this.node);

    this.x = 450;
    this.y = 10;
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
