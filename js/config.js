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
  },
  {
    id: "trinity", name: "Trinity The Tuck", sprite: "./images/drags/trinity.png", portrait: "./images/trinity.jpeg", voice: "./audio/audioTrinity.mp3",
    stats: { speed: 4, rate: 4, power: 3, lives: 2 },
    power: { id: "fan", name: "Tuck & Roll", desc: "Lanza dos abanicos de 11 tacones de golpe." },
  },
  {
    id: "monet", name: "Monet X Change", sprite: "./images/drags/monetXChange.png", portrait: "./images/Monet.jpeg", voice: "./audio/audioMonet.mp3",
    stats: { speed: 3, rate: 3, power: 2, lives: 4 },
    power: { id: "sponge", name: "¡Esponja!", desc: "Absorbe todos los tacones rivales de la pantalla, suma puntos y recupera 1 vida." },
  },
  {
    id: "shea", name: "Shea Coulee", sprite: "./images/drags/sheaCoulee.png", portrait: "./images/shea.jpeg", voice: "./audio/audioShea.mp3",
    stats: { speed: 4, rate: 3, power: 4, lives: 2 },
    power: { id: "slowmo", name: "Categoría: tiempo", desc: "Ralentiza a la rival y sus tacones durante 5 s." },
  },
  {
    id: "plastique", name: "Plastique Tiara", sprite: "./images/drags/plastiqueTiara.png", portrait: "./images/plastique.jpeg", voice: "./audio/audioPlastique.mp3",
    stats: { speed: 5, rate: 4, power: 2, lives: 2 },
    power: { id: "triple", name: "Muñeca de porcelana", desc: "Triple tacón durante 6 s." },
  },
  {
    id: "angeria", name: "Angeria Paris VanMichael", sprite: "./images/drags/angeriaPVM.png", portrait: "./images/angeria.jpeg", voice: "./audio/audioAngeria.mp3",
    stats: { speed: 3, rate: 2, power: 5, lives: 3 },
    power: { id: "homing", name: "Alas de ángel", desc: "Tus tacones persiguen a la rival durante 6 s." },
  },
  {
    id: "jujubee", name: "Jujubee", sprite: "./images/drags/jujubee.png", portrait: "./images/portraits/jujubee_portrait.jpg",
    stats: { speed: 3, rate: 3, power: 4, lives: 3 },
    power: { id: "bomb", name: "Ola gigante", desc: "Una ola que quita 2 de vida a la rival y arrastra todos sus tacones." },
  },
  {
    id: "crystal", name: "Crystal Methyd", sprite: "./images/drags/crystal.png", portrait: "./images/portraits/crystal_portrait.jpg",
    stats: { speed: 5, rate: 5, power: 2, lives: 2 },
    power: { id: "zap", name: "Estrella fugaz", desc: "Un rayo de estrellas que quita 3 de vida a la rival al instante." },
  },
  {
    id: "folk", name: "Trixie Mattel", sprite: "./images/drags/folk.png", portrait: "./images/portraits/folk_portrait.jpg",
    stats: { speed: 3, rate: 4, power: 3, lives: 3 },
    power: { id: "magnet", name: "Balada country", desc: "Puntos dobles durante 8 s y un power-up garantizado." },
  },
  {
    id: "carmesi", name: "Brooke Lynn Hytes", sprite: "./images/drags/carmesi.png", portrait: "./images/portraits/carmesi_portrait.jpg",
    stats: { speed: 4, rate: 5, power: 4, lives: 4 },
    power: { id: "divine", name: "Plumas de fuego", desc: "6 s invencible con triple tacón teledirigido." },
  },
];

// ------------------------------ Poderes ------------------------------------
const POWERS = {
  shield: { id: "shield", name: "Escudo de lentejuelas", desc: "Escudo durante 5 s: los tacones rebotan y no te hacen daño." },
  fan: { id: "fan", name: "Abanico", desc: "Lanza dos abanicos de 11 tacones de golpe." },
  sponge: { id: "sponge", name: "¡Esponja!", desc: "Absorbe los tacones rivales de la pantalla, suma puntos y recupera 1 vida." },
  slowmo: { id: "slowmo", name: "Cámara lenta", desc: "Ralentiza a la rival y sus tacones durante 5 s." },
  triple: { id: "triple", name: "Triple tacón", desc: "Triple tacón durante 6 s." },
  homing: { id: "homing", name: "Tacones teledirigidos", desc: "Tus tacones persiguen a la rival durante 6 s." },
  zap: { id: "zap", name: "Rayo", desc: "Un rayo que quita 3 de vida a la rival al instante." },
  bomb: { id: "bomb", name: "Bomba de purpurina", desc: "Quita 2 de vida a la rival y borra todos sus tacones." },
  magnet: { id: "magnet", name: "Puntos dobles", desc: "Puntos dobles durante 8 s y un power-up garantizado." },
  clones: { id: "clones", name: "Clones", desc: "Dos clones disparan contigo durante 6 s." },
  reflect: { id: "reflect", name: "Espejo", desc: "Durante 5 s los tacones rivales rebotan y vuelven contra ella." },
  divine: { id: "divine", name: "Corona divina", desc: "6 s invencible con triple tacón teledirigido." },
};
const POWER_POOL = ["shield", "fan", "sponge", "slowmo", "triple", "homing", "zap", "bomb", "magnet", "clones", "reflect"];

// Poderes personalizados de algunas reinas
const CUSTOM_POWERS = {
  "dafne-mugler": { ...POWERS.clones, name: "Volantes de tul", desc: "Dos clones de tul disparan contigo durante 6 s." },
  "denebola-murnau": { ...POWERS.reflect, name: "Sombra de Nosferatu", desc: "Durante 5 s los tacones rivales que te alcanzan rebotan y vuelven contra ella." },
};

const hashStr = (str) => [...str].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7);

// Silueta provisional para las reinas que aún no tienen foto
function placeholderSVG(name, portrait) {
  const hues = [320, 280, 200, 170, 20, 45, 350, 260];
  const h = hues[hashStr(name) % hues.length];
  const c1 = `hsl(${h} 85% 62%)`;
  const c2 = `hsl(${(h + 40) % 360} 70% 35%)`;
  const initials = name.split(/\s+/).filter((w) => /^[A-ZÁÉÍÓÚÑ]/i.test(w)).slice(0, 2).map((w) => w[0].toUpperCase()).join("");
  const body = `<defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${c1}"/><stop offset="1" stop-color="${c2}"/></linearGradient></defs>
<g fill="url(#g)"><circle cx="200" cy="96" r="70"/><circle cx="148" cy="130" r="44"/><circle cx="252" cy="130" r="44"/>
<ellipse cx="200" cy="120" rx="40" ry="48"/><rect x="186" y="160" width="28" height="30"/>
<path d="M146 186 Q200 172 254 186 L236 262 Q200 272 164 262 Z"/><path d="M164 258 Q200 270 236 258 L318 480 Q200 500 82 480 Z"/>
<path d="M150 192 Q126 250 146 300" stroke="${c1}" stroke-width="16" fill="none" stroke-linecap="round"/>
<path d="M250 192 Q274 250 254 300" stroke="${c1}" stroke-width="16" fill="none" stroke-linecap="round"/></g>`;
  const svg = portrait
    ? `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="480" viewBox="0 0 400 480"><rect width="400" height="480" fill="#1b0529"/>${body}<text x="200" y="360" text-anchor="middle" font-family="Arial, sans-serif" font-weight="900" font-size="110" fill="#fff" opacity=".9">${initials}</text></svg>`
    : `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="500" viewBox="0 0 400 500">${body}</svg>`;
  return "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
}

// ------------------------------ Franquicias ----------------------------------
// Reinas de España a partir de js/reinas.js. Sus estadísticas dependen de su
// mejor puesto en el programa (las ganadoras son más fuertes).
(function buildSpanishQueens() {
  const bestPlacement = {};
  TEMPORADAS_ES.forEach((t) =>
    t.cast.forEach((id, i) => {
      const p = t.cast.length > 1 ? i / (t.cast.length - 1) : 1;
      bestPlacement[id] = Math.max(bestPlacement[id] || 0, p);
    }),
  );
  Object.entries(REINAS_ES).forEach(([id, r]) => {
    const p = bestPlacement[id] || 0;
    const h = hashStr(id);
    // Reparte entre 11 y 16 puntos de estadística, de 1 a 5 cada una
    const total = 11 + Math.round(p * 5);
    const stats = { speed: 1, rate: 1, power: 1, lives: 1 };
    const keys = Object.keys(stats);
    let left = total - 4;
    let k = h;
    while (left > 0) {
      const key = keys[(k >>> 16) % 4];
      if (stats[key] < 5) {
        stats[key]++;
        left--;
      }
      k = (Math.imul(k, 1103515245) + 12345) >>> 0;
    }
    const isWinner = TEMPORADAS_ES.some((t) => !t.enEmision && t.cast[t.cast.length - 1] === id);
    QUEENS.push({
      id,
      name: r.name,
      sprite: r.sprite || (r.foto ? `./images/queens/${id}.png` : placeholderSVG(r.name, false)),
      portrait: r.portrait || (r.retrato ? `./images/queens/${id}_retrato.jpg` : r.foto ? `./images/queens/${id}.png` : placeholderSVG(r.name, true)),
      voice: r.audio ? `./audio/queens/${id}.mp3` : null,
      quote: r.frase || "",
      stats,
      power: CUSTOM_POWERS[id] || (isWinner ? POWERS.divine : POWERS[POWER_POOL[h % POWER_POOL.length]]),
      placeholder: !r.foto && !r.sprite,
    });
  });
})();

const FRANCHISES = [
  {
    id: "es",
    name: "Drag Race España",
    tag: "ES",
    color: "#ff3b3b",
    seasons: TEMPORADAS_ES.filter((t) => t.franchise === "es"),
  },
  {
    id: "esas",
    name: "Drag Race España All Stars",
    tag: "AS",
    color: "#ffd84d",
    seasons: TEMPORADAS_ES.filter((t) => t.franchise === "esas"),
  },
  { id: "us", name: "RuPaul's Drag Race", tag: "US", color: "#ff4fd8", comingSoon: true, seasons: [] },
  { id: "as", name: "RuPaul's Drag Race All Stars", tag: "AS", color: "#b36bff", comingSoon: true, seasons: [] },
  { id: "uk", name: "Drag Race UK", tag: "UK", color: "#53f2ff", comingSoon: true, seasons: [] },
];

// ---- Temporadas especiales del modo historia (se calculan con tu progreso)
// All Winners: las reinas con las que has ganado cada temporada. All Stars a tu gusto: hasta 14 reinas elegidas por ti
const REGULAR_ES = () => TEMPORADAS_ES.filter((t) => t.franchise === "es");
const PLAYABLE_AS = () => TEMPORADAS_ES.filter((t) => t.franchise === "esas" && t.cast && t.cast.length);
function storyCrown(sid) {
  const C = store.get("dftc-story-crowns", {});
  if (C[sid]) return C[sid];
  const R = store.get("dftc-reinantes", {})[sid];
  return R && R.mine ? { queen: R.queen, runner: null } : null;
}
function allWinnersCast() {
  const used = new Set(), cast = [];
  [...REGULAR_ES(), ...PLAYABLE_AS()].forEach((t) => {
    const c = storyCrown(t.id);
    if (!c) return;
    // Si la ganadora ya está (p. ej. ganó también una temporada normal), entra su runner-up
    const pickId = !used.has(c.queen) ? c.queen : c.runner && !used.has(c.runner) ? c.runner : null;
    if (pickId) { used.add(pickId); cast.push(pickId); }
  });
  return cast;
}
const ALL_QUEEN_IDS = () => [...new Set(TEMPORADAS_ES.flatMap((t) => t.cast || []))];
function specialSeasons() {
  const custom = (store.get("dftc-custom-cast", []) || []).filter((id) => ALL_QUEEN_IDS().includes(id)).slice(0, 14);
  return [
    { franchise: "esas", id: "escustom", name: "All Stars a tu gusto", year: "Tú eliges", cast: custom, special: "custom", index: 2 },
    { franchise: "esas", id: "esaw", name: "All Winners", year: "Solo ganadoras", cast: allWinnersCast(), special: "winners", index: 5 },
  ];
}
// Qué temporadas tienes abiertas en el modo historia y qué te falta para abrir las demás
function storyUnlock(s) {
  const wins = store.get("dftc-story-wins", []);
  const reg = REGULAR_ES();
  const nameOf = (id) => (TEMPORADAS_ES.find((t) => t.id === id) || {}).name || id;
  if (s.franchise && (s.franchise.id || s.franchise) === "es") {
    const i = reg.findIndex((t) => t.id === s.id);
    if (i <= 0) return { ok: true };
    return wins.includes(reg[i - 1].id) ? { ok: true } : { ok: false, why: `Gana la ${nameOf(reg[i - 1].id)}` };
  }
  const need = { esas1: ["es3"], esas2: ["es5"] }[s.id];
  if (need) return need.every((x) => wins.includes(x)) ? { ok: true } : { ok: false, why: `Gana la ${nameOf(need[0])}` };
  if (s.id === "escustom") return reg.every((t) => wins.includes(t.id)) ? { ok: true } : { ok: false, why: "Gana todas las temporadas" };
  if (s.id === "esaw") return [...reg, ...PLAYABLE_AS()].every((t) => wins.includes(t.id)) ? { ok: true } : { ok: false, why: "Gana todas las temporadas y los All Stars" };
  return { ok: true };
}
const allSeasons = () => [
  ...FRANCHISES.flatMap((f) => f.seasons.map((s, i) => ({ ...s, franchise: f, index: i, winner: s.cast[s.cast.length - 1] }))),
  ...(typeof store !== "undefined" ? specialSeasons() : []).map((s) => ({ ...s, franchise: FRANCHISES.find((f) => f.id === s.franchise), winner: s.cast[s.cast.length - 1] })),
];
const seasonById = (id) => allSeasons().find((s) => s.id === id);
// Cada temporada es algo más difícil que la anterior dentro de su franquicia
const seasonDifficulty = (season) => 1 + season.index * 0.1;

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
    store.set("dftc-total", this.total + points);
  },
  get seasonsWon() {
    return store.get("dftc-seasons", []);
  },
  hasWon(seasonId) {
    return this.seasonsWon.includes(seasonId);
  },
  // La primera temporada de cada franquicia está abierta; las demás se abren al ganar la anterior
  isSeasonUnlocked(season) {
    return season.index === 0 || this.hasWon(season.franchise.seasons[season.index - 1].id);
  },
  // Devuelve la temporada que se desbloquea al ganar esta (si la hay)
  winSeason(season) {
    if (this.hasWon(season.id)) return null;
    store.set("dftc-seasons", [...this.seasonsWon, season.id]);
    return season.franchise.seasons[season.index + 1] || null;
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

// Foto de una reina en una temporada concreta (si tiene look propio en esa temporada)
function lookOf(q, seasonId) {
  if (q && seasonId && typeof LOOKS !== "undefined" && (LOOKS[seasonId] || []).includes(q.id))
    return { sprite: `./images/queens/${seasonId}/${q.id}.png`, portrait: `./images/queens/${seasonId}/${q.id}_retrato.jpg` };
  return { sprite: q && q.sprite, portrait: q && q.portrait };
}

// Puntuaciones del modo historia (tabla y carrera aparte del arcade)
const StoryBoard = {
  get board() {
    return store.get("dftc-story-board", []);
  },
  get stats() {
    return store.get("dftc-story-stats", { games: 0, crowns: 0, challengeWins: 0, lipsyncs: 0, total: 0 });
  },
  record(entry) {
    const s = this.stats;
    s.games++;
    if (entry.won) s.crowns++;
    s.challengeWins += entry.wins || 0;
    s.lipsyncs += entry.lipsyncs || 0;
    s.total += entry.score;
    store.set("dftc-story-stats", s);
    const board = this.board;
    board.push(entry);
    board.sort((a, b) => b.score - a.score);
    store.set("dftc-story-board", board.slice(0, 10));
    return board.slice(0, 10).findIndex((e) => e.id === entry.id);
  },
  rename(id, name) {
    const board = this.board;
    const e = board.find((x) => x.id === id);
    if (e) {
      e.name = name;
      store.set("dftc-story-board", board);
    }
  },
};
