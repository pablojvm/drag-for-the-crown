class Vidas {
    constructor(x, y) {
        this.node = document.createElement("img")
        this.node.src= "./images/lipstick.png"
        cajaDeVidasNode.append(this.node);

        this.x= x;
        this.y= y;
        this.w= 100;
        this.h= 100;
        this.node.style.width = `${this.w}px`;
        this.node.style.height = `${this.h}px`;

        
        this.node.style.position = "absolute";
        this.node.style.top = `${this.y}px`;
        this.node.style.left = `${this.x}px`;
    }

}