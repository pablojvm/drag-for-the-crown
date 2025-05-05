//pantallas del juego
const pantallaInicioNode = document.querySelector("#pantalla-inicio");
const pantallaJuegoNode = document.querySelector("#pantalla-juego");
const pantallaFinalNode = document.querySelector("#pantalla-final");

// botones

const botonInicioNode = document.querySelector("#boton-inicio");

//caja de juego

const cajaJuegoNode = document.querySelector("#caja-juego");

//variables globales

let gameIntervalId = 1;
let enemigosIntervalId = 1;
let taconesProyectilId= 1;
let mainPersonaje = null;
let enemigosDrag = null;
let taconesProyectil= null;
let taconesArr= []


//funciones globales
function startGame() {
  pantallaInicioNode.style.display = "none";
  pantallaJuegoNode.style.display = "flex";

  mainPersonaje = new Personaje();
  enemigosDrag = new Enemigos();
  taconesProyectil= new Tacones();

  gameIntervalId = setInterval(() => {
    gameLoop();
  }, Math.round(1000 / 60));

  enemigosIntervalId = setInterval(() => {
    enemigosDrag.moverEnemigos();
  }, 30);

  taconesProyectilId= setInterval(() => {
    taconesProyectil.taconesVolando()
  }, 3);
}

function gameLoop() {
  enemigosDrag.checkColissionEnemigosWall();
  taconesProyectil.taconesVolando();
}

//event listener
botonInicioNode.addEventListener("click", () => {
  startGame();
});

document.addEventListener("keydown", (event) => {
  const maxX= cajaJuegoNode.offsetWidth - mainPersonaje.w
  const maxY= cajaJuegoNode.offsetHeight
  
  if (event.key === "ArrowLeft" && mainPersonaje.x > 0) {
    mainPersonaje.x -= mainPersonaje.speed;
    mainPersonaje.node.style.left = `${mainPersonaje.x}px`;
  } else if (event.key === "ArrowRight" && mainPersonaje.x < maxX) {
  mainPersonaje.x += mainPersonaje.speed;
    mainPersonaje.node.style.left = `${mainPersonaje.x}px`;
  }
  if (event.key === "ArrowUp" && mainPersonaje.y > maxY/2) {
    mainPersonaje.y -= mainPersonaje.speed;
    mainPersonaje.node.style.top = `${mainPersonaje.y}px`;
  } else if (event.key === "ArrowDown" && mainPersonaje.y < maxY - mainPersonaje.h) {
    mainPersonaje.y += mainPersonaje.speed;
    mainPersonaje.node.style.top = `${mainPersonaje.y}px`;
  } 

});
