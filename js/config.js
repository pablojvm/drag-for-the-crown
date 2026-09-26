// ---------------------------------------------------------------------------
// Configuración general del juego
// ---------------------------------------------------------------------------

// Escenario de diseño (se escala para caber en cualquier pantalla)
const STAGE_W = 1440;
const STAGE_H = 1000;

// Zona de juego (canvas), en píxeles lógicos
const W = 1100;
const H = 820;
const HUD_H = 84; // franja superior reservada al marcador
const PLAYER_MIN_Y = H * 0.52; // la jugadora solo se mueve por la mitad inferior

const START_LIVES = 3;
const MAX_LIVES = 5;

const QUEENS = [
  { id: "jimbo", name: "Jimbo", sprite: "./images/drags/jimbo.png", portrait: "./images/jimbo.jpeg", voice: "./audio/audioJimbo.mp3" },
  { id: "trinity", name: "Trinity The Tuck", sprite: "./images/drags/trinity.png", portrait: "./images/trinity.jpeg", voice: "./audio/audioTrinity.mp3" },
  { id: "monet", name: "Monet X Change", sprite: "./images/drags/monetXChange.png", portrait: "./images/Monet.jpeg", voice: "./audio/audioMonet.mp3" },
  { id: "shea", name: "Shea Coulee", sprite: "./images/drags/sheaCoulee.png", portrait: "./images/shea.jpeg", voice: "./audio/audioShea.mp3" },
  { id: "plastique", name: "Plastique Tiara", sprite: "./images/drags/plastiqueTiara.png", portrait: "./images/plastique.jpeg", voice: "./audio/audioPlastique.mp3" },
  { id: "angeria", name: "Angeria Paris VanMichael", sprite: "./images/drags/angeriaPVM.png", portrait: "./images/angeria.jpeg", voice: "./audio/audioAngeria.mp3" },
];

// Cada ronda es una rival con su vida, movimiento y patrón de ataque.
// La última es el jefe final: "Lip sync for your life".
const ROUNDS = [
  { hp: 4, speed: 170, move: "bounce", fire: "single", every: 1.25, bullet: 330 },
  { hp: 5, speed: 190, move: "sine", fire: "aimed", every: 1.05, bullet: 360 },
  { hp: 6, speed: 220, move: "bounce", fire: "spread3", every: 1.25, bullet: 340 },
  { hp: 7, speed: 260, move: "dash", fire: "burst", every: 1.35, bullet: 400 },
  { hp: 10, speed: 0, move: "figure8", fire: "boss", every: 0.95, bullet: 380, boss: true },
];

const PLAYER = {
  height: 175,
  speed: 430, // px/s
  shotCooldown: 0.22, // s
  shotSpeed: 720,
  invulnerable: 1.4, // s tras recibir un tacón
};

const POWERUP_CHANCE = 0.16;
const DOUBLE_SHOT_TIME = 7; // s

const HIT_QUIPS = ["YAS!", "WERK!", "SLAY!", "OKURRR", "¡TOMA!", "SERVE!"];
const OUCH_QUIPS = ["GURL...", "OUCH!", "HONEY, NO", "¡AY!"];

const COLORS = {
  pink: "#ff4fd8",
  pinkSoft: "#ff9be9",
  gold: "#ffd84d",
  cyan: "#53f2ff",
  white: "#ffffff",
  danger: "#ff3b6b",
};

// localStorage envuelto: puede fallar en modo privado y no debe romper el juego
const store = {
  get(key, fallback) {
    try {
      const v = localStorage.getItem(key);
      return v === null ? fallback : JSON.parse(v);
    } catch {
      return fallback;
    }
  },
  set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      /* sin almacenamiento disponible */
    }
  },
};

const rand = (min, max) => Math.random() * (max - min) + min;
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
