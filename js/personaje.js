class Personaje {
    constructor() {
        this.node = document.createElement("img")
        this.node.src= "./images/jimbo.png"
        cajaJuegoNode.append(this.node);

        this.x= 450;
        this.y= 600;
        this.w= 150;
        this.h= 150;
        this.node.style.width = `${this.w}px`;
        this.node.style.height = `${this.h}px`;

        
        this.node.style.position = "absolute";
        this.node.style.top = `${this.y}px`;
        this.node.style.left = `${this.x}px`;

        this.speed= 10;
    }

}