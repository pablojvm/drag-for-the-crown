//pantallas de juego
const pantallaInicioNode = document.querySelector("#pantalla-inicio");
const pantallaJuegoNode = document.querySelector("#pantalla-juego");
const pantallaFinalNode = document.querySelector("#pantalla-final");

// botones

const botonInicioNode = document.querySelector("#boton-inicio");

//caja de juego

const cajaDeJuego = document.querySelector("#caja-juego");

//variables globales

let gameIntervalId = 1;

//funciones globales
function startGame() {
  pantallaInicioNode.style.display = "none";
  pantallaJuegoNode.style.display = "flex";

  gameIntervalId = setInterval(() => {
    gameLoop();
  }, Math.round(1000 / 60));
}

function gameLoop() {}

//event listener
botonInicioNode.addEventListener("click", () => {
  startGame();
});
