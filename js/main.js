// ---------------------------------------------------------------------------
// Drag for the Crown
// ---------------------------------------------------------------------------

// Tamaño del escenario "de diseño". Todo se escala para caber en la ventana.
const STAGE_W = 1440;
const STAGE_H = 1000;
const GAME_W = 1000;
const GAME_H = 800;

const ENEMIGOS_PARA_GANAR = 5;
const VIDAS_INICIALES = 3;
const COOLDOWN_DISPARO_MS = 350;

// ----------------------------- Nodos del DOM --------------------------------
const stageNode = document.querySelector("#stage");
const pantallaInicioNode = document.querySelector("#pantalla-inicio");
const pantallaEleccionNode = document.querySelector("#pantalla-eleccion");
const pantallaJuegoNode = document.querySelector("#pantalla-juego");
const pantallaFinalNode = document.querySelector("#pantalla-final");
const pantallaGameOverNode = document.querySelector("#pantalla-gameover");
const pantallas = [
  pantallaInicioNode,
  pantallaEleccionNode,
  pantallaJuegoNode,
  pantallaFinalNode,
  pantallaGameOverNode,
];

const botonChooseNode = document.querySelector("#boton-choose");
const botonInicioNode = document.querySelector("#boton-inicio");
const botonReStartNode = document.querySelector("#boton-restart");
const botonReStart2Node = document.querySelector("#boton-restart2");
const botonesQueen = document.querySelectorAll(".btn-queen");

const cajaJuegoNode = document.querySelector("#caja-juego");
const cajaDeVidasNode = document.querySelector("#caja-vidas");
const contadorCajaNode = document.querySelector("#contador");
const cajaCoronaNode = document.querySelector("#caja-corona");
const controlesTouchNode = document.querySelector("#controles-touch");

// Imágenes decorativas de la pantalla de inicio
function addDecoracion(src, top, left, w, h) {
  const img = document.createElement("img");
  img.src = src;
  img.alt = "";
  img.className = "decoracion";
  Object.assign(img.style, {
    top: `${top}px`,
    left: `${left}px`,
    width: `${w}px`,
    height: `${h}px`,
  });
  pantallaInicioNode.append(img);
}
addDecoracion("./images/controles.png", 320, 280, 150, 150);
addDecoracion("./images/logo3.png", 300, 70, 200, 200);
addDecoracion("./images/instrucciones.png", 280, 1100, 300, 400);
addDecoracion("./images/logo5.png", 500, 70, 200, 200);
addDecoracion("./images/spaceBar.png", 500, 270, 200, 200);

// Corona de la pantalla final
const logo10Node = document.createElement("img");
logo10Node.src = "./images/logo10.png";
logo10Node.alt = "";
logo10Node.style.width = "200px";
logo10Node.style.height = "200px";
const coronaGifNode = document.createElement("img");
coronaGifNode.src = "./images/tiara.gif";
coronaGifNode.alt = "";
coronaGifNode.style.width = "400px";
coronaGifNode.style.height = "400px";
cajaCoronaNode.append(logo10Node, coronaGifNode);

// Contador de enemigas eliminadas
const contadorNode = document.createElement("span");
contadorNode.id = "contador-texto";
contadorCajaNode.append(contadorNode);

// ------------------------------- Audio --------------------------------------
function crearAudio(src, volume = 0.1, loop = false) {
  const audio = new Audio(src);
  audio.volume = volume;
  audio.loop = loop;
  return audio;
}
const musicaJuego = crearAudio("./audio/Sissy That Walk.mp3", 0.1, true);
const musicaVictoria = crearAudio("./audio/Shantay.mp3");
const musicaDerrota = crearAudio("./audio/Sashay.mp3");
const audiosQueen = {
  jimbo: crearAudio("./audio/audioJimbo.mp3"),
  trinity: crearAudio("./audio/audioTrinity.mp3"),
  monet: crearAudio("./audio/audioMonet.mp3"),
  shea: crearAudio("./audio/audioShea.mp3"),
  plastique: crearAudio("./audio/audioPlastique.mp3"),
  angeria: crearAudio("./audio/audioAngeria.mp3"),
};
const audiosImpacto = [
  crearAudio("./audio/gurl.mp3"),
  crearAudio("./audio/honey.mp3", 0.15),
  crearAudio("./audio/security.mp3"),
];
const todosLosAudios = [
  musicaJuego,
  musicaVictoria,
  musicaDerrota,
  ...Object.values(audiosQueen),
  ...audiosImpacto,
];

function play(audio) {
  audio.currentTime = 0;
  // El navegador puede bloquear el audio; no debe romper el juego
  audio.play().catch(() => {});
}
function pararAudios(excepto = []) {
  todosLosAudios.forEach((a) => {
    if (excepto.includes(a)) return;
    a.pause();
    a.currentTime = 0;
  });
}
function audioImpactoAleatorio() {
  play(audiosImpacto[Math.floor(Math.random() * audiosImpacto.length)]);
}

// ---------------------------- Estado del juego ------------------------------
const TODAS_LAS_QUEENS = Array.from(botonesQueen).map((b) => b.dataset.src);

let srcPersonajeSeleccionado = null;
let mainPersonaje = null;
let enemigosDrag = null;
let enemiesSrc = [];
let lipstickArr = [];
let taconesArr = [];
let taconesEnemiesArr = [];
let colisiones = 0;
let vidas = VIDAS_INICIALES;
let isPlaying = false;
let rafId = null;
let ultimoDisparo = 0;
let ultimoDisparoEnemigo = 0;
const teclas = new Set();

function mostrarPantalla(pantalla) {
  pantallas.forEach((p) => (p.style.display = p === pantalla ? "flex" : "none"));
  controlesTouchNode.classList.toggle("activo", pantalla === pantallaJuegoNode);
}

function velocidadEnemiga() {
  return 3 + colisiones; // la dificultad sube con cada drag eliminada
}
function intervaloDisparoEnemigo() {
  return Math.max(900, 2000 - colisiones * 250);
}

function nuevaEnemiga() {
  const i = Math.floor(Math.random() * enemiesSrc.length);
  const src = enemiesSrc.splice(i, 1)[0];
  return new Enemigos(src, velocidadEnemiga());
}

function actualizarContador() {
  contadorNode.innerText = `${colisiones}/${ENEMIGOS_PARA_GANAR}`;
}

function limpiarTablero() {
  taconesArr.forEach((t) => t.destroy());
  taconesEnemiesArr.forEach((t) => t.destroy());
  taconesArr = [];
  taconesEnemiesArr = [];
}

// ------------------------------- Partida ------------------------------------
function startGame() {
  // Si no ha elegido, se asigna una queen aleatoria
  if (!srcPersonajeSeleccionado) {
    srcPersonajeSeleccionado =
      TODAS_LAS_QUEENS[Math.floor(Math.random() * TODAS_LAS_QUEENS.length)];
  }

  // Estado limpio
  cajaJuegoNode.innerHTML = "";
  cajaDeVidasNode.innerHTML = "";
  taconesArr = [];
  taconesEnemiesArr = [];
  teclas.clear();
  colisiones = 0;
  vidas = VIDAS_INICIALES;
  // La queen elegida nunca aparece como enemiga
  enemiesSrc = TODAS_LAS_QUEENS.filter((s) => s !== srcPersonajeSeleccionado);
  actualizarContador();

  mostrarPantalla(pantallaJuegoNode);
  pararAudios();
  play(musicaJuego);

  mainPersonaje = new Personaje(srcPersonajeSeleccionado);
  enemigosDrag = nuevaEnemiga();
  lipstickArr = Array.from({ length: VIDAS_INICIALES }, (_, i) => new Vidas(i * 100));

  ultimoDisparo = 0;
  ultimoDisparoEnemigo = performance.now();
  isPlaying = true;
  cancelAnimationFrame(rafId);
  rafId = requestAnimationFrame(gameLoop);
}

function gameLoop(now) {
  if (!isPlaying) return;

  mainPersonaje.mover(teclas);
  if (teclas.has("Space")) disparar(now);

  enemigosDrag.checkColissionEnemigosWall();
  enemigosDrag.moverEnemigos();

  if (now - ultimoDisparoEnemigo >= intervaloDisparoEnemigo()) {
    taconesEnemiesArr.push(new TaconesEnemigos(enemigosDrag, 5 + colisiones * 0.5));
    ultimoDisparoEnemigo = now;
  }

  for (let i = taconesArr.length - 1; i >= 0; i--) {
    const t = taconesArr[i];
    t.taconesVolando();
    if (t.fueraDePantalla()) {
      t.destroy();
      taconesArr.splice(i, 1);
    }
  }
  for (let i = taconesEnemiesArr.length - 1; i >= 0; i--) {
    const t = taconesEnemiesArr[i];
    t.taconesEnemigosVolando();
    if (t.fueraDePantalla()) {
      t.destroy();
      taconesEnemiesArr.splice(i, 1);
    }
  }

  checkColissionEnemigosTacones();
  if (isPlaying) checkColissionPersonajeTacones();
  if (isPlaying) rafId = requestAnimationFrame(gameLoop);
}

function disparar(now) {
  if (!isPlaying || now - ultimoDisparo < COOLDOWN_DISPARO_MS) return;
  taconesArr.push(new Tacones(mainPersonaje));
  ultimoDisparo = now;
}

function hayColision(a, b, margen = 15) {
  // Pequeño margen para que las colisiones no se sientan injustas
  return (
    a.x + margen < b.x + b.w &&
    a.x + a.w - margen > b.x &&
    a.y + margen < b.y + b.h &&
    a.y + a.h - margen > b.y
  );
}

function checkColissionEnemigosTacones() {
  const impacto = taconesArr.some((t) => hayColision(enemigosDrag, t));
  if (!impacto) return;

  audioImpactoAleatorio();
  colisiones++;
  actualizarContador();
  enemigosDrag.destroy();
  limpiarTablero();

  if (colisiones >= ENEMIGOS_PARA_GANAR) {
    finishedGame();
  } else {
    enemigosDrag = nuevaEnemiga();
    ultimoDisparoEnemigo = performance.now();
  }
}

function checkColissionPersonajeTacones() {
  for (let i = taconesEnemiesArr.length - 1; i >= 0; i--) {
    const t = taconesEnemiesArr[i];
    if (!hayColision(mainPersonaje, t)) continue;

    audioImpactoAleatorio();
    t.destroy();
    taconesEnemiesArr.splice(i, 1);
    vidas--;
    const vida = lipstickArr.pop();
    if (vida) vida.destroy();

    if (vidas <= 0) {
      GameOver();
      return;
    }
  }
}

function pararPartida() {
  isPlaying = false;
  cancelAnimationFrame(rafId);
  teclas.clear();
}

function finishedGame() {
  pararPartida();
  mostrarPantalla(pantallaFinalNode);
  pararAudios();
  play(musicaVictoria);
}

function GameOver() {
  pararPartida();
  mostrarPantalla(pantallaGameOverNode);
  pararAudios();
  play(musicaDerrota);
}

// ------------------------------ Controles -----------------------------------
const TECLAS_JUEGO = ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Space"];

document.addEventListener("keydown", (event) => {
  if (!isPlaying || !TECLAS_JUEGO.includes(event.code)) return;
  event.preventDefault(); // evita que la página haga scroll
  teclas.add(event.code);
});
document.addEventListener("keyup", (event) => {
  teclas.delete(event.code);
});
window.addEventListener("blur", () => teclas.clear());

// Controles táctiles
controlesTouchNode.querySelectorAll("button").forEach((btn) => {
  const key = btn.dataset.key;
  const soltar = () => teclas.delete(key);
  btn.addEventListener("pointerdown", (e) => {
    e.preventDefault();
    if (isPlaying) teclas.add(key);
  });
  btn.addEventListener("pointerup", soltar);
  btn.addEventListener("pointerleave", soltar);
  btn.addEventListener("pointercancel", soltar);
});

// Pausa automática si la pestaña pierde el foco
document.addEventListener("visibilitychange", () => {
  if (!mainPersonaje || pantallaJuegoNode.style.display !== "flex") return;
  if (document.hidden && isPlaying) {
    pararPartida();
    musicaJuego.pause();
  } else if (!document.hidden && !isPlaying) {
    isPlaying = true;
    ultimoDisparoEnemigo = performance.now();
    musicaJuego.play().catch(() => {});
    rafId = requestAnimationFrame(gameLoop);
  }
});

botonChooseNode.addEventListener("click", () => mostrarPantalla(pantallaEleccionNode));

botonesQueen.forEach((btn) => {
  btn.addEventListener("click", () => {
    srcPersonajeSeleccionado = btn.dataset.src;
    botonesQueen.forEach((b) => b.classList.toggle("selected", b === btn));
    pararAudios();
    play(audiosQueen[btn.dataset.audio]);
  });
});

botonInicioNode.addEventListener("click", startGame);
botonReStartNode.addEventListener("click", startGame);
botonReStart2Node.addEventListener("click", startGame);

// --------------------- Escalado para cualquier pantalla ---------------------
function ajustarEscala() {
  const escala = Math.min(window.innerWidth / STAGE_W, window.innerHeight / STAGE_H);
  stageNode.style.transform = `translate(-50%, -50%) scale(${escala})`;
}
window.addEventListener("resize", ajustarEscala);
ajustarEscala();
mostrarPantalla(pantallaInicioNode);
