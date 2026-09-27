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

// Estadísticas de 1 a 5. Cada reina tiene un poder especial que se carga golpeando.
const QUEENS = [
  {
    id: "jimbo", name: "Jimbo", sprite: "./images/drags/jimbo.png", portrait: "./images/jimbo.jpeg", voice: "./audio/audioJimbo.mp3",
    stats: { speed: 2, rate: 3, power: 3, lives: 5 },
    power: { id: "shield", name: "Abrigo de peluche", desc: "Escudo de pelo rosa durante 5 s: los tacones rebotan y no te hacen daño." },
    unlock: 0,
  },
  {
    id: "trinity", name: "Trinity The Tuck", sprite: "./images/drags/trinity.png", portrait: "./images/trinity.jpeg", voice: "./audio/audioTrinity.mp3",
    stats: { speed: 4, rate: 4, power: 3, lives: 2 },
    power: { id: "fan", name: "Tuck & Roll", desc: "Lanza dos abanicos de 11 tacones de golpe." },
    unlock: 0,
  },
  {
    id: "monet", name: "Monet X Change", sprite: "./images/drags/monetXChange.png", portrait: "./images/Monet.jpeg", voice: "./audio/audioMonet.mp3",
    stats: { speed: 3, rate: 3, power: 2, lives: 4 },
    power: { id: "sponge", name: "¡Esponja!", desc: "Absorbe todos los tacones rivales de la pantalla, suma puntos y recupera 1 vida." },
    unlock: 0,
  },
  {
    id: "shea", name: "Shea Coulee", sprite: "./images/drags/sheaCoulee.png", portrait: "./images/shea.jpeg", voice: "./audio/audioShea.mp3",
    stats: { speed: 4, rate: 3, power: 4, lives: 2 },
    power: { id: "slowmo", name: "Categoría: tiempo", desc: "Ralentiza a la rival y sus tacones durante 5 s." },
    unlock: 0,
  },
  {
    id: "plastique", name: "Plastique Tiara", sprite: "./images/drags/plastiqueTiara.png", portrait: "./images/plastique.jpeg", voice: "./audio/audioPlastique.mp3",
    stats: { speed: 5, rate: 4, power: 2, lives: 2 },
    power: { id: "triple", name: "Muñeca de porcelana", desc: "Triple tacón durante 6 s." },
    unlock: 0,
  },
  {
    id: "angeria", name: "Angeria Paris VanMichael", sprite: "./images/drags/angeriaPVM.png", portrait: "./images/angeria.jpeg", voice: "./audio/audioAngeria.mp3",
    stats: { speed: 3, rate: 2, power: 5, lives: 3 },
    power: { id: "homing", name: "Alas de ángel", desc: "Tus tacones persiguen a la rival durante 6 s." },
    unlock: 0,
  },
  {
    id: "jujubee", name: "Jujubee", sprite: "./images/drags/jujubee.png", portrait: "./images/portraits/jujubee_portrait.jpg",
    stats: { speed: 3, rate: 3, power: 4, lives: 3 },
    power: { id: "bomb", name: "Ola gigante", desc: "Una ola que quita 2 de vida a la rival y arrastra todos sus tacones." },
    unlock: 10000,
  },
  {
    id: "crystal", name: "Crystal Methyd", sprite: "./images/drags/crystal.png", portrait: "./images/portraits/crystal_portrait.jpg",
    stats: { speed: 5, rate: 5, power: 2, lives: 2 },
    power: { id: "zap", name: "Estrella fugaz", desc: "Un rayo de estrellas que quita 3 de vida a la rival al instante." },
    unlock: 25000,
  },
  {
    id: "esmeralda", name: "Dafne Mugler", sprite: "./images/drags/esmeralda.png", portrait: "./images/portraits/esmeralda_portrait.jpg",
    stats: { speed: 4, rate: 4, power: 3, lives: 3 },
    power: { id: "clones", name: "Volantes de tul", desc: "Dos clones de tul disparan contigo durante 6 s." },
    unlock: 45000,
  },
  {
    id: "folk", name: "Trixie Mattel", sprite: "./images/drags/folk.png", portrait: "./images/portraits/folk_portrait.jpg",
    stats: { speed: 3, rate: 4, power: 3, lives: 3 },
    power: { id: "magnet", name: "Balada country", desc: "Puntos dobles durante 8 s y un power-up garantizado." },
    unlock: 70000,
  },
  {
    id: "denebola", name: "Denebola Murnau", sprite: "./images/drags/denebola.png", portrait: "./images/portraits/denebola_portrait.jpg",
    stats: { speed: 3, rate: 3, power: 4, lives: 3 },
    power: { id: "reflect", name: "Sombra de Nosferatu", desc: "Durante 5 s los tacones rivales que te alcanzan rebotan y vuelven contra ella." },
    unlock: 85000,
  },
  {
    id: "carmesi", name: "Brooke Lynn Hytes", sprite: "./images/drags/carmesi.png", portrait: "./images/portraits/carmesi_portrait.jpg",
    stats: { speed: 4, rate: 5, power: 4, lives: 4 },
    power: { id: "divine", name: "Plumas de fuego", desc: "6 s invencible con triple tacón teledirigido." },
    unlock: 100000,
  },
];

const STAT_LABELS = { speed: "Velocidad", rate: "Cadencia", power: "Potencia", lives: "Resistencia" };

// Traducción de estadísticas (1-5) a valores de juego
const statSpeed = (s) => 0.75 + s * 0.1; // multiplicador de velocidad
const statCooldown = (s) => 0.34 - s * 0.035; // segundos entre tacones
const statDamage = (s) => 0.6 + s * 0.2; // vida que quita cada tacón
const statLives = (s) => 2 + Math.floor(s / 2); // vidas iniciales (2 a 4)

const SPECIAL_PER_HIT = 0.125; // 8 impactos llenan el poder

// ------------------------------ Progreso guardado ----------------------------
const Progress = {
  get total() {
    return store.get("dftc-total", 0);
  },
  addTotal(points) {
    const before = this.total;
    store.set("dftc-total", before + points);
    return QUEENS.filter((q) => q.unlock > before && q.unlock <= before + points);
  },
  isUnlocked(q) {
    return this.total >= q.unlock;
  },
  get stats() {
    return store.get("dftc-stats", { games: 0, wins: 0, bestCombo: 0, played: {} });
  },
  recordGame(entry) {
    const s = this.stats;
    s.games++;
    if (entry.won) s.wins++;
    s.bestCombo = Math.max(s.bestCombo, entry.maxCombo);
    s.played[entry.queen] = (s.played[entry.queen] || 0) + 1;
    store.set("dftc-stats", s);

    const board = this.board;
    board.push(entry);
    board.sort((a, b) => b.score - a.score);
    store.set("dftc-board", board.slice(0, 10));
    return board.slice(0, 10).findIndex((e) => e.id === entry.id);
  },
  get board() {
    return store.get("dftc-board", []);
  },
  rename(id, name) {
    const board = this.board;
    const e = board.find((x) => x.id === id);
    if (e) {
      e.name = name;
      store.set("dftc-board", board);
    }
  },
};

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
