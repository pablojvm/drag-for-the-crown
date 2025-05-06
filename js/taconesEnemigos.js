class TaconesEnemigos {
    constructor() {
      this.node = document.createElement("img");
      this.node.src = "./images/tacon.png";
      cajaJuegoNode.append(this.node);
  
      this.x = enemigosDrag.x;
      this.y = enemigosDrag.y;
      this.w = 50;
      this.h = 50;
      this.node.style.width = `${this.w}px`;
      this.node.style.height = `${this.h}px`;
  
      this.node.style.position = "absolute";
      this.node.style.top = `${this.y}px`;
      this.node.style.left = `${this.x}px`;
  
      this.speed = 15;
    }
  
    taconesEnemigosVolando() {
      this.y += 6;
      this.node.style.top = `${this.y}px`;
    }
  
    taconesDestroy() {
      if (taconesEnemiesArr.length > 0 && taconesEnemiesArr[0].x + taconesEnemiesArr[0].w >= 1000) {
        taconesEnemiesArr[0].node.remove();
        taconesEnemiesArr.shift();
      }
    }
  
  
  }