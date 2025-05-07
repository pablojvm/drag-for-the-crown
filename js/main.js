//pantallas del juego
const pantallaInicioNode = document.querySelector("#pantalla-inicio");
const pantallaJuegoNode = document.querySelector("#pantalla-juego");
const pantallaFinalNode = document.querySelector("#pantalla-final");
const pantallaGameOverNode = document.querySelector("#pantalla-gameover");
const controlesNode = document.createElement("img")
controlesNode.src = "./images/controles.png"
controlesNode.style.position = 0
controlesNode.style.y = 0
controlesNode.style.width = 50
controlesNode.style.height = 50
pantallaInicioNode.append(controlesNode)

//pantalla de eleccion de personaje
const pantallaEleccionNode = document.querySelector("#pantalla-eleccion");
const cajaEleccionNode = document.querySelector("#caja-eleccion")
const btnJimboNode = document.querySelector("#btn-jimbo")
const btnTrinityNode = document.querySelector("#btn-trinity")
const btnMonetNode = document.querySelector("#btn-monet")
const btnSheaNode = document.querySelector("#btn-shea")
const btnPlastiqueNode = document.querySelector("#btn-plastique")
const btnAngeriaNode = document.querySelector("#btn-angeria")
let srcPersonajeSeleccionado = null;


// botones

const botonChooseNode = document.querySelector("#boton-choose");
const botonInicioNode = document.querySelector("#boton-inicio");
const botonReStartNode = document.querySelector("#boton-restart");
const botonReStart2Node = document.querySelector("#boton-restart2");

//cajas de juego

const cajaJuegoNode = document.querySelector("#caja-juego");
const cajaDeVidasNode = document.querySelector("#caja-vidas");

//variables globales

const audio1Node = document.createElement("audio");
audio1Node.src = "./audio/Sissy That Walk.mp3";
audio1Node.volume = 0.1;
const audio2Node = document.createElement("audio");
audio2Node.src = "./audio/Shantay.mp3";
audio2Node.volume = 0.1;
const audio3Node = document.createElement("audio");
audio3Node.src = "./audio/Sashay.mp3";
audio3Node.volume = 0.1;

let gameIntervalId = 1;
let enemigosIntervalId = 1;
let taconesProyectilId = 1;
let taconesEnemiesId = 1;
let mainPersonaje = null;
let enemigosDrag = null;
let lipstickArr = null;
let taconesArr = [];
let taconesEnemiesArr = [];
let enemiesSrc = [
  "./images/drags/trinity.png",
  "./images/drags/sheaCoulee.png",
  "./images/drags/plastiqueTiara.png",
  "./images/drags/monetXChange.png",
  "./images/drags/jimbo.png",
  "./images/drags/angeriaPVM.png",
];

let colisiones = 0;
const maxColisiones = 5;
let colisionesPersonaje = 0;
const colisionesPersonajeMax = 3;

//funciones globales

function startGame() {
  pantallaEleccionNode.style.display = "none";
  pantallaJuegoNode.style.display = "flex";
  cajaJuegoNode.style.visibility = "visible";

  audio1Node.play();

  mainPersonaje = new Personaje();
  enemigosDrag = new Enemigos();
  lipstickArr = [new Vidas(0, 0), new Vidas(100, 0), new Vidas(200, 0)];

  gameIntervalId = setInterval(() => {
    gameLoop();
  }, Math.round(1000 / 60));

  taconesProyectilId = setInterval(() => {
    taconesAppear();
  }, 2000);

  taconesEnemiesId = setInterval(() => {
    taconesEnemiesAppear();
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

function checkColissionPersonajeTacones() {
  taconesEnemiesArr.forEach((taconObj, i) => {
    if (
      mainPersonaje.x < taconObj.x + taconObj.w &&
      mainPersonaje.x + mainPersonaje.w > taconObj.x &&
      mainPersonaje.y < taconObj.y + taconObj.h &&
      mainPersonaje.y + mainPersonaje.h > taconObj.y
    ) {
      colisionesPersonaje++;
      taconObj.node.remove();
      taconesEnemiesArr.splice(i, 1);
      if (colisionesPersonaje >= colisionesPersonajeMax) {
        GameOver();
      } else if (colisionesPersonaje === 3) {
        lipstickArr[0].node.remove();
      } else if (colisionesPersonaje === 2) {
        lipstickArr[1].node.remove();
      } else if (colisionesPersonaje === 1) {
        lipstickArr[2].node.remove();
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
  taconesEnemiesArr.forEach((cadaTaconEnemigo) => {
    cadaTaconEnemigo.taconesEnemigosVolando();
  });
  checkColissionPersonajeTacones();
}

function taconesAppear() {
  let taconesObj = new Tacones(); //console.log(pollitoObj)
  taconesArr.push(taconesObj);
  //taconesDestroy();
}

function taconesEnemiesAppear() {
  let taconesObj = new TaconesEnemigos(); //console.log(pollitoObj)
  taconesEnemiesArr.push(taconesObj);
  //taconesDestroy();
}

function finishedGame() {
  pantallaJuegoNode.style.display = "none";
  pantallaFinalNode.style.display = "flex";
  audio1Node.pause();
  audio1Node.currentTime = 0;
  audio2Node.play();

  clearInterval(gameIntervalId);
  clearInterval(enemigosIntervalId);
  clearInterval(taconesEnemiesId);
  clearInterval(taconesProyectilId);
}

function GameOver() {
  clearInterval(gameIntervalId);
  clearInterval(enemigosIntervalId);
  clearInterval(taconesEnemiesId);
  clearInterval(taconesProyectilId);
  pantallaJuegoNode.style.display = "none";
  pantallaFinalNode.style.display = "none";
  pantallaGameOverNode.style.display = "flex";

  audio1Node.pause();
  audio1Node.currentTime = 0;
  audio3Node.play();
  // Detener los intervalos
}

function reStartGame() {
  pantallaFinalNode.style.display = "none";
  pantallaJuegoNode.style.display = "flex";

  mainPersonaje.x = 450;
  mainPersonaje.y = 600;
  enemigosDrag.x = 450;
  enemigosDrag.y = 10;

  colisiones = 0; // Reiniciar las variables al valor original y vaciar el dom y reiniciar el juego activando de nuevo starGame
  colisionesPersonaje = 0;
  enemiesSrc = [
    "./images/drags/trinity.png",
    "./images/drags/sheaCoulee.png",
    "./images/drags/plastiqueTiara.png",
    "./images/drags/monetXChange.png",
    "./images/drags/jimbo.png",
    "./images/drags/angeriaPVM.png",
  ];
  cajaJuegoNode.innerHTML = "";
  cajaDeVidasNode.innerHTML = "";
  startGame();
}
function reStartGameOver() {
  pantallaGameOverNode.style.display = "none";
  pantallaJuegoNode.style.display = "flex";

  mainPersonaje.x = 450;
  mainPersonaje.y = 600;
  enemigosDrag.x = 450;
  enemigosDrag.y = 10;

  colisiones = 0;
  colisionesPersonaje = 0;
  enemiesSrc = [
    "./images/drags/trinity.png",
    "./images/drags/sheaCoulee.png",
    "./images/drags/plastiqueTiara.png",
    "./images/drags/monetXChange.png",
    "./images/drags/jimbo.png",
    "./images/drags/angeriaPVM.png",
  ];
  cajaJuegoNode.innerHTML = "";
  startGame();
}

//event listener
botonChooseNode.addEventListener("click", () => {
  pantallaInicioNode.style.display = "none";
  pantallaEleccionNode.style.display = "flex";
});

btnJimboNode.addEventListener("click", () => {
  srcPersonajeSeleccionado = "./images/drags/jimbo.png"
})

btnTrinityNode.addEventListener("click", () => {
  srcPersonajeSeleccionado = "./images/drags/trinity.png"
})

btnMonetNode.addEventListener("click", () => {
  srcPersonajeSeleccionado = "./images/drags/monetXChange.png"
})

btnSheaNode.addEventListener("click", () => {
  srcPersonajeSeleccionado = "./images/drags/sheaCoulee.png"
})

btnPlastiqueNode.addEventListener("click", () => {
  srcPersonajeSeleccionado = "./images/drags/plastiqueTiara.png"
  
})

btnAngeriaNode.addEventListener("click", () => {
  srcPersonajeSeleccionado = "./images/drags/angeriaPVM.png"
})



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

botonReStart2Node.addEventListener("click", () => {
  reStartGameOver();
});

