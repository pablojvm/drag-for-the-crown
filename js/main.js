//pantallas del juego
const pantallaInicioNode = document.querySelector("#pantalla-inicio");
const pantallaJuegoNode = document.querySelector("#pantalla-juego");
const pantallaFinalNode = document.querySelector("#pantalla-final");
const pantallaGameOverNode = document.querySelector("#pantalla-gameover");
const controlesNode = document.createElement("img");
controlesNode.src = "./images/controles.png";
controlesNode.style.position = "absolute";
controlesNode.style.top = "320px";
controlesNode.style.left = "365px";
controlesNode.style.width = "150px";
controlesNode.style.height = "150px";
pantallaInicioNode.append(controlesNode);
const logo3Node = document.createElement("img");
logo3Node.src = "./images/logo3.png";
logo3Node.style.position = "absolute";
logo3Node.style.top = "300px";
logo3Node.style.left = "120px";
logo3Node.style.width = "200px";
logo3Node.style.height = "200px";
pantallaInicioNode.append(logo3Node);
const instruccionesNode = document.createElement("img");
instruccionesNode.src = "./images/instrucciones.png";
instruccionesNode.style.position = "absolute";
instruccionesNode.style.top = "300px";
instruccionesNode.style.left = "1300px";
instruccionesNode.style.width = "300px";
instruccionesNode.style.height = "400px";
pantallaInicioNode.append(instruccionesNode);
const logo5Node = document.createElement("img");
logo5Node.src = "./images/logo5.png";
logo5Node.style.position = "absolute";
logo5Node.style.top = "500px";
logo5Node.style.left = "120px";
logo5Node.style.width = "200px";
logo5Node.style.height = "200px";
pantallaInicioNode.append(logo5Node);
const spaceNode = document.createElement("img");
spaceNode.src = "./images/spaceBar.png";
spaceNode.style.position = "absolute";
spaceNode.style.top = "500px";
spaceNode.style.left = "340px";
spaceNode.style.width = "200px";
spaceNode.style.height = "200px";
pantallaInicioNode.append(spaceNode);

//pantalla de eleccion de personaje
const pantallaEleccionNode = document.querySelector("#pantalla-eleccion");
const cajaEleccionNode = document.querySelector("#caja-eleccion");
const btnJimboNode = document.querySelector("#btn-jimbo");
const btnTrinityNode = document.querySelector("#btn-trinity");
const btnMonetNode = document.querySelector("#btn-monet");
const btnSheaNode = document.querySelector("#btn-shea");
const btnPlastiqueNode = document.querySelector("#btn-plastique");
const btnAngeriaNode = document.querySelector("#btn-angeria");


// botones

const botonChooseNode = document.querySelector("#boton-choose");
const botonInicioNode = document.querySelector("#boton-inicio");
const botonReStartNode = document.querySelector("#boton-restart");
const botonReStart2Node = document.querySelector("#boton-restart2");

//cajas de juego

const cajaJuegoNode = document.querySelector("#caja-juego");
const cajaDeVidasNode = document.querySelector("#caja-vidas");
const contadorCajaNode = document.querySelector("#contador");
const contadorNode = document.createElement("span");
contadorNode.innerText = "0/5";
contadorNode.style.display = "flex";
contadorNode.style.justifyContent = "center";
contadorNode.style.fontSize = "90px";
(contadorNode.style.fontFamily = "Londrina Outline"), "sans-serif;";
contadorNode.style.textShadow = "2px 2px 4px rgb(255, 255, 255)";
contadorNode.style.color = "rgb(241, 154, 239)";
contadorCajaNode.append(contadorNode);

// Variables de Sonido

const audio1Node = document.createElement("audio");
audio1Node.src = "./audio/Sissy That Walk.mp3";
audio1Node.volume = 0.1;
const audio2Node = document.createElement("audio");
audio2Node.src = "./audio/Shantay.mp3";
audio2Node.volume = 0.1;
const audio3Node = document.createElement("audio");
audio3Node.src = "./audio/Sashay.mp3";
audio3Node.volume = 0.1;
const audioMonetNode = document.createElement("audio");
audioMonetNode.src = "./audio/audioMonet.mp3";
audioMonetNode.volume = 0.1;
const audioTrinityNode = document.createElement("audio");
audioTrinityNode.src = "./audio/audioTrinity.mp3";
audioTrinityNode.volume = 0.1;
const audioSheaNode = document.createElement("audio");
audioSheaNode.src = "./audio/audioShea.mp3";
audioSheaNode.volume = 0.1;
const audioPlastiqueNode = document.createElement("audio");
audioPlastiqueNode.src = "./audio/audioPlastique.mp3";
audioPlastiqueNode.volume = 0.1;
const audioAngeriaNode = document.createElement("audio");
audioAngeriaNode.src = "./audio/audioAngeria.mp3";
audioAngeriaNode.volume = 0.1;
const audioJimboNode = document.createElement("audio");
audioJimboNode.src = "./audio/audioJimbo.mp3";
audioJimboNode.volume = 0.1;
const audioGurlNode = document.createElement("audio");
audioGurlNode.src = "./audio/gurl.mp3";
audioGurlNode.volume = 0.1;
const audioHoneyNode = document.createElement("audio");
audioHoneyNode.src = "./audio/honey.mp3";
audioHoneyNode.volume = 0.15;
const audioSecurityNode = document.createElement("audio");
audioSecurityNode.src = "./audio/security.mp3";
audioSecurityNode.volume = 0.1;


//variables globales

let gameIntervalId = 1;
let enemigosIntervalId = 1;
let taconesProyectilId = 1;
let taconesEnemiesId = 1;
let mainPersonaje = null;
let enemigosDrag = null;
let lipstickArr = null;
let srcPersonajeSeleccionado = null;
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

  // taconesProyectilId = setInterval(() => {
  //   taconesAppear();
  // }, 2000);

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
      let randAudioIndex= Math.floor(Math.random() * 3 + 1)
      if(randAudioIndex === 1) {
        audioGurlNode.play()
      } else if ( randAudioIndex === 2) {
        audioHoneyNode.play()
      } else if ( randAudioIndex === 3) {
        audioSecurityNode.play()
      }
      enemigosDrag.node.remove();
      enemigosDrag = new Enemigos();
      colisiones++;
      taconesArr.forEach((eachTacon, i) => {
        eachTacon.node.remove();
      });
      taconesEnemiesArr.forEach((eachTacon, i) => {
        eachTacon.node.remove();
      });
      taconesArr = [];
      taconesEnemiesArr = [];
      //taconObj.node.remove();
      //taconesArr.splice(i, 1);
      if (colisiones >= maxColisiones) {
        finishedGame();
      } else if (colisiones === 1) {
        contadorNode.innerText = "1/5";
        enemigosDrag.speed += 1;
      } else if (colisiones === 2) {
        contadorNode.innerText = "2/5";
        enemigosDrag.speed += 2;
      } else if (colisiones === 3) {
        contadorNode.innerText = "3/5";
        enemigosDrag.speed += 3;
      } else if (colisiones === 4) {
        contadorNode.innerText = "4/5";
        enemigosDrag.speed += 4;
      } else if (colisiones === 5) {
        contadorNode.innerText = "5/5";
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
      let randAudioIndex= Math.floor(Math.random() * 3 + 1)
      if(randAudioIndex === 1) {
        audioGurlNode.play()
      } else if ( randAudioIndex === 2) {
        audioHoneyNode.play()
      } else if ( randAudioIndex === 3) {
        audioSecurityNode.play()
      }
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
  contadorNode.innerHTML = "0/5";
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
  cajaDeVidasNode.innerHTML = "";
  contadorNode.innerText = "0/5";
  startGame();
}

//event listener
botonChooseNode.addEventListener("click", () => {
  pantallaInicioNode.style.display = "none";
  pantallaEleccionNode.style.display = "flex";
});

btnJimboNode.addEventListener("click", () => {
  srcPersonajeSeleccionado = "./images/drags/jimbo.png";
  audioJimboNode.play();
});

btnTrinityNode.addEventListener("click", () => {
  srcPersonajeSeleccionado = "./images/drags/trinity.png";
  audioTrinityNode.play();
});

btnMonetNode.addEventListener("click", () => {
  srcPersonajeSeleccionado = "./images/drags/monetXChange.png";
  audioMonetNode.play();
});

btnSheaNode.addEventListener("click", () => {
  srcPersonajeSeleccionado = "./images/drags/sheaCoulee.png";
  audioSheaNode.play();
});

btnPlastiqueNode.addEventListener("click", () => {
  srcPersonajeSeleccionado = "./images/drags/plastiqueTiara.png";
  audioPlastiqueNode.play();
});

btnAngeriaNode.addEventListener("click", () => {
  srcPersonajeSeleccionado = "./images/drags/angeriaPVM.png";
  audioAngeriaNode.play();
});

botonInicioNode.addEventListener("click", () => {
  let randIndex = Math.floor(Math.random() * enemiesSrc.length)
  if(srcPersonajeSeleccionado === null) {
    srcPersonajeSeleccionado = enemiesSrc[randIndex]
  }
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

document.addEventListener("keydown", (event) => {
  if (event.code === "Space") {
    taconesAppear();
    taconesVolando();
  }
});

botonReStartNode.addEventListener("click", () => {
  reStartGame();
});

botonReStart2Node.addEventListener("click", () => {
  reStartGameOver();
});
