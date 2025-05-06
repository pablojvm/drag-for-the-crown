//pantallas del juego
const pantallaInicioNode = document.querySelector("#pantalla-inicio");
const pantallaJuegoNode = document.querySelector("#pantalla-juego");
const pantallaFinalNode = document.querySelector("#pantalla-final");

// botones

const botonInicioNode = document.querySelector("#boton-inicio");
const botonReStartNode = document.querySelector("#boton-restart");

//caja de juego

const cajaJuegoNode = document.querySelector("#caja-juego");

//variables globales

const audio1Node = document.createElement("audio");
audio1Node.src = "./audio/Sissy That Walk.mp3";
audio1Node.volume = 0.1;
const audio2Node = document.createElement("audio");
audio2Node.src = "./audio/Shantay.mp3"
audio2Node.volume= 0.1
const audio3Node = document.createElement("audio");
audio3Node.src = "./audio/Sashay.mp3"
audio3Node.volume= 0.1

let gameIntervalId = 1;
let enemigosIntervalId = 1;
let taconesProyectilId = 1;
let mainPersonaje = null;
let enemigosDrag = null;
let taconesArr = [];
let colisiones = 0;
const maxColisiones = 5;
let enemiesSrc = [
  "./images/drags/trinity.png",
  "./images/drags/sheaCoulee.png",
  "./images/drags/plastiqueTiara.png",
  "./images/drags/monetXChange.png",
  "./images/drags/jimbo.png",
  "./images/drags/angeriaPVM.png",
];

//funciones globales

function startGame() {
  pantallaInicioNode.style.display = "none";
  pantallaJuegoNode.style.display = "flex";

  audio1Node.play()

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
      colisiones++;
      taconObj.node.remove();
      taconesArr.splice(i, 1);
      if (colisiones >= maxColisiones) {
        finishedGame();
      }
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

function finishedGame() {
  pantallaJuegoNode.style.display = "none";
  pantallaFinalNode.style.display = "flex";
  audio1Node.pause()
  audio2Node.play()

}

function reStartGame() {
  pantallaFinalNode.style.display = "none";
  pantallaJuegoNode.style.display = "flex";
  colisiones = 0;
  enemiesSrc = [
    "./images/drags/trinity.png",
    "./images/drags/sheaCoulee.png",
    "./images/drags/plastiqueTiara.png",
    "./images/drags/monetXChange.png",
    "./images/drags/jimbo.png",
    "./images/drags/angeriaPVM.png",
  ];
  audio1Node.play()
}

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

botonReStartNode.addEventListener("click", () => {
  reStartGame();
});
