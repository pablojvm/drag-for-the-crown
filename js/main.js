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
let taconesProyectilId = 1;
let mainPersonaje = null;
let enemigosDrag = null;
let taconesArr = [];
let enemigoDeTurno = 0;

//funciones globales
function startGame() {
  pantallaInicioNode.style.display = "none";
  pantallaJuegoNode.style.display = "flex";

  

  mainPersonaje = new Personaje();
  enemigosDrag = new Enemigos();

  gameIntervalId = setInterval(() => {
    gameLoop();
  }, Math.round(1000 / 60));

  taconesProyectilId = setInterval(() => {
    taconesAppear();
  }, 2000);
}

function checkColissionEnemigosTacones() {
  taconesArr.forEach((taconObj, i) => {
    if (
      enemigosDrag.x < taconObj.x + taconObj.w &&
      enemigosDrag.x + enemigosDrag.w > taconObj.x &&
      enemigosDrag.y < taconObj.y + taconObj.h &&
      enemigosDrag.y + enemigosDrag.h > taconObj.y
    ) {
      console.log("estan chocando");
      //taconObj.dissappearTacon()
      //enemigosDrag.dissappearEnemigo()
      //enemigosDrag.appearEnemigo()
      enemigosDrag.node.remove();
      enemigosDrag = new Enemigos();
      taconObj.node.remove();
      taconesArr.splice(i, 1);
    }
  });
}

function gameLoop() {
  enemigosDrag.checkColissionEnemigosWall();
  enemigosDrag.moverEnemigos();
  taconesArr.forEach((cadaTacon) => {
    cadaTacon.taconesVolando();
  });
  checkColissionEnemigosTacones();
}

function taconesAppear() {
  let taconesObj = new Tacones(); //console.log(pollitoObj)
  taconesArr.push(taconesObj);
  //taconesDestroy();
}

//function gameOver() {
  pantallaJuegoNode.style.display = "none";
  pantallaFinalNode.style.display = "flex";
//}
//event listener
botonInicioNode.addEventListener("click", () => {
  startGame();
});

document.addEventListener("keydown", (event) => {
  const maxX = cajaJuegoNode.offsetWidth - mainPersonaje.w;
  const maxY = cajaJuegoNode.offsetHeight;

  if (event.key === "ArrowLeft" && mainPersonaje.x > 0) {
    mainPersonaje.x -= mainPersonaje.speed;
    mainPersonaje.node.style.left = `${mainPersonaje.x}px`;
  } else if (event.key === "ArrowRight" && mainPersonaje.x < maxX) {
    mainPersonaje.x += mainPersonaje.speed;
    mainPersonaje.node.style.left = `${mainPersonaje.x}px`;
  }
  if (event.key === "ArrowUp" && mainPersonaje.y > maxY / 2) {
    mainPersonaje.y -= mainPersonaje.speed;
    mainPersonaje.node.style.top = `${mainPersonaje.y}px`;
  } else if (
    event.key === "ArrowDown" &&
    mainPersonaje.y < maxY - mainPersonaje.h
  ) {
    mainPersonaje.y += mainPersonaje.speed;
    mainPersonaje.node.style.top = `${mainPersonaje.y}px`;
  }
});
