// Temporada en directo: estado de la sala y reglas (puro, sin DOM ni red; con tests).
// La anfitriona aplica estas funciones y reparte el estado; el resto lo pinta.

import { ppe } from "../core/track";

export type Phase = "lobby" | "maletas" | "anuncio" | "reto" | "pasarela" | "resultados" | "untucked" | "veredicto" | "decision" | "comodin" | "sorpresa" | "lipsync" | "pintalabios" | "track" | "final" | "corona";
export type Ritmo = "normal" | "rapido" | "libre";
/** Formato de la temporada: normal (las dos peores hacen lip sync) o All Stars (lip sync del top 2 y la ganadora elimina). */
export type Formato = "normal" | "allstars" | "winners" | "repesca" | "suerte" | "corazon" | "moneda";
/** Nombre y explicación de cada dinámica (para elegirla en la partida personalizada). */
export const FORMATOS: Record<Formato, { n: string; icon: string; d: string }> = {
  normal: { n: "Clásica", icon: "👑", d: "Las dos peores hacen lip sync y se va la que pierde." },
  allstars: { n: "All Stars", icon: "💄", d: "Las dos mejores hacen lip sync y la que gana saca su pintalabios." },
  winners: { n: "All Winners", icon: "⭐", d: "Nadie se va: el top 2 gana estrellas, la del lip sync bloquea a una rival. Las 4 con más estrellas van a la final." },
  repesca: { n: "Segunda Oportunidrag", icon: "🔁", d: "Cuando quedan siete, las eliminadas vuelven en parejas y una regresa. Lip sync a tres bandas." },
  suerte: { n: "Reina de la suerte", icon: "🍀", d: "Una reina tiene en secreto la reina de la suerte: puede salvar a quien quiera del lip sync una vez." },
  corazon: { n: "Temporada del corazón", icon: "❤️", d: "Cada eliminada deja medio corazón. Con uno entero salvas a alguien del bottom." },
  moneda: { n: "Temporada de la moneda", icon: "🪙", d: "Bottom de tres y moneda al aire: cara, las salvadas votan a quién salvar; cruz, a quién condenar." },
};
/** Cuándo llega la Segunda Oportunidrag (reinas en competición). */
export const REPESCA_AT = 7;

/** Segundos por fase. La suma de un episodio es el tope de tiempo del episodio. */
export const DURACION: Record<Ritmo, Record<Exclude<Phase, "lobby" | "corona">, number>> = {
  // Las pantallas que se miran (anuncio, críticas, Untucked, veredicto, pintalabios, track) no tienen reloj:
  // las pasa la anfitriona, y todas ven lo mismo que ella. El reloj es solo para lo que se juega.
  normal: { maletas: 600, anuncio: 0, reto: 240, pasarela: 150, resultados: 0, untucked: 0, veredicto: 0, lipsync: 120, decision: 45, comodin: 45, sorpresa: 0, pintalabios: 0, track: 0, final: 120 },
  rapido: { maletas: 420, anuncio: 0, reto: 170, pasarela: 110, resultados: 0, untucked: 0, veredicto: 0, lipsync: 90, decision: 30, comodin: 30, sorpresa: 0, pintalabios: 0, track: 0, final: 90 },
  libre: { maletas: 0, anuncio: 0, reto: 0, pasarela: 0, resultados: 0, untucked: 0, veredicto: 0, lipsync: 0, decision: 0, comodin: 0, sorpresa: 0, pintalabios: 0, track: 0, final: 0 },
};
/** Pantallas que lleva la anfitriona (diálogo sincronizado y botón de seguir). */
export const WATCH: Phase[] = ["anuncio", "resultados", "untucked", "veredicto", "sorpresa", "pintalabios", "track", "corona"];
export const isWatch = (p: Phase) => WATCH.includes(p);
/** Con IA (frases escritas) el reto dura más: escribir lleva tiempo. */
export const IA_EXTRA = 1.75;
/** Segundos que se tarda en leer las críticas de cada reina. */
export const POR_CRITICA = 7;
/** Momento tope de una fase; 0 = sin tope (se espera a que entreguen todas). */
export const limite = (now: number, secs: number) => (secs > 0 ? now + secs * 1000 : 0);
/** Tope de juego de un episodio (lo que corre con reloj: reto, pasarela y lip sync). */
export const topeEpisodio = (r: Ritmo) => {
  const d = DURACION[r];
  return d.reto + d.pasarela + d.lipsync;
};
/** Duración de una fase en esta sala (con IA el reto se alarga; sin límite sigue siendo 0). */
const dur = (s: Pick<RoomState, "ritmo" | "ia">, phase: Exclude<Phase, "lobby" | "corona">) => {
  const d = DURACION[s.ritmo][phase];
  return phase === "reto" && s.ia && d > 0 ? Math.round(d * IA_EXTRA) : d;
};
/** Nota de quien no entrega a tiempo. */
export const NO_PRESENTO = 30;

export interface Player { id: string; name: string; queen: string | null; joined: number; alive: boolean }
export interface Row { key: string; score: number; label: string }
export interface Pair { a: string; b: string; winner?: string }
export interface Sub { reto?: number; final?: number; ls?: { won: boolean; score: number }; elim?: string; jury?: string; ready?: boolean; pick?: string }
/** Momento de un giro en el que alguien decide (comodín): la suerte, el corazón, la moneda o el bloqueo del All Winners. */
export interface Twist {
  kind: "suerte" | "corazon" | "moneda" | "bloqueo" | "corte";
  /** All Winners, empate en el corte del top 4: cuántas elige y las que ya están dentro. */
  need?: number;
  sure?: string[];
  by: string[];
  options: string[];
  picks: Record<string, string>;
  cara?: boolean;
  /** All Winners: las del top que se llevan estrella esta semana. */
  starred?: string[];
}
/** Lo que pasó en el giro, para enseñarlo (pantalla «sorpresa», la lleva la anfitriona). */
export interface TwistResult {
  kind: "suerte" | "corazon" | "corazones" | "moneda" | "bloqueo" | "repesca";
  by?: string;
  saved?: string[];
  entered?: string[];
  gifts?: { from: string; to: string }[];
  full?: string[];
  votes?: Record<string, string[]>;
  chosen?: string;
  cara?: boolean;
  tie?: boolean;
  target?: string;
  stars?: string[];
  back?: string;
  pairs?: { c: string; o: string | null; score: number }[];
}
/** Guion de una pantalla que se mira: líneas [quién, texto] y por cuál va (la anfitriona lo avanza). */
export interface Script { key: string; lines: [string, string][]; i: number }
/** Propuesta de pausa: hace falta el sí de todas. */
export interface Pause { by: string; votes: Record<string, boolean>; at: number }
/** Plan de la temporada: reto y pasarela de cada episodio (se sabe al empezar para preparar las maletas). */
export interface PlanEp { tipo: string; cat?: { n: string; d: string } }
/** All Stars: antes del lip sync las dos del top eligen pintalabios (picks); la ganadora (by) saca el suyo (go). */
export interface Decision { top: string[]; options: string[]; picks: Record<string, string>; by?: string; go?: string; kind?: "semana" | "trayectoria" | "jugarreta" }
/** El pintalabios de la que perdió el lip sync, que se enseña al empezar el episodio siguiente. */
export interface Reveal { ep: number; by: string; go: string; went: string }
export interface Reto { tipo: string; titulo: string; desc: string; noRunway: boolean; cat?: { n: string; d: string } }
export interface RoomState {
  v: number;
  code: string;
  host: string;
  season: string;
  ritmo: Ritmo;
  fmt?: Formato;
  ia?: boolean;
  players: Player[];
  npcs: string[];
  out: { key: string; ep: number; place: string }[];
  ep: number;
  phase: Phase;
  deadline: number;
  reto?: Reto;
  used: string[];
  subs: Record<string, Sub>;
  rows?: Row[];
  crit?: { key: string; lines: [string, string][] }[];
  pairs?: Pair[];
  decision?: Decision;
  reveal?: Reveal;
  plan?: PlanEp[];
  /** Reinas de la partida (partida personalizada) y cómo se eligen las rivales. */
  cast?: string[];
  custom?: { pick: "elegidas" | "azar"; size: number; rivals: string[] };
  /** En peligro esta semana (los comodines pueden cambiarlo). */
  bottom?: string[];
  protectedKeys?: string[];
  twist?: Twist;
  twistResult?: TwistResult;
  stage?: number;
  triple?: string[];
  luck?: string | null;
  hearts?: Record<string, number>;
  pendingHearts?: { from: string; to: string }[];
  stars?: Record<string, number>;
  block?: { ep: number; id: string; by: string };
  weeks?: number;
  rp?: { ep: number; pairs: { c: string; o: string | null }[] };
  rpDone?: boolean;
  planShift?: number;
  script?: Script;
  pause?: Pause;
  paused?: boolean;
  finalStage?: number;
  /** All Winners: eliminatoria de lip syncs (primero la QoSDADHH y luego la corona). */
  bracket?: { kind: "qosd" | "corona"; seeds: string[]; alive: string[]; round: number; bye?: string };
  awFinal?: { top: string[]; bottom: string[]; tierB: string; qosd?: string };
  track: Record<string, Record<number, string>>;
  epNames: Record<number, string>;
  champion?: string;
  note?: string;
}

/** Lo que el motor del juego presta a la sala (en los tests se sustituye por uno falso). */
export interface Engine {
  retos(): Reto[];
  categorias(): { n: string; d: string }[];
  rivalScore(queenId: string, tipo: string): number;
  simLS(aQueen: string, bQueen: string): string;
  critique(tipo: string, level: "top" | "mid" | "low", name: string): [string, string][];
  queenName(id: string): string;
  rnd(): number;
  /** Reto de la Segunda Oportunidrag (stand-up en parejas). */
  repesca?(): Reto;
}

export const pkey = (pid: string) => "p:" + pid;
export const nkey = (qid: string) => "n:" + qid;
export const isP = (k: string) => k.startsWith("p:");
export const idOf = (k: string) => k.slice(2);

export function newRoom(code: string, host: Player, season: string, ritmo: Ritmo, opts: { fmt?: Formato; ia?: boolean } = {}): RoomState {
  return { v: 1, code, host: host.id, season, ritmo, fmt: opts.fmt || "normal", ia: !!opts.ia, players: [host], npcs: [], out: [], ep: 0, phase: "lobby", deadline: 0, used: [], subs: {}, track: {}, epNames: {} };
}
const isAS = (s: Pick<RoomState, "fmt">) => s.fmt === "allstars";
const isAW = (s: Pick<RoomState, "fmt">) => s.fmt === "winners";
/** Semanas del All Winners (como en el modo historia: una menos que reinas, entre 4 y 8). */
export const winnersWeeks = (n: number) => Math.max(4, Math.min(8, n - 1));
const shuffleWith = <T,>(a: T[], e: Pick<Engine, "rnd">) => { const b = a.slice(); for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(e.rnd() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b; };
const pickWith = <T,>(a: T[], e: Pick<Engine, "rnd">) => a[Math.floor(e.rnd() * a.length)];
/** Jugadoras eliminadas que vuelven a jugar en la Segunda Oportunidrag (en pareja con una en competición). */
const rpPlayers = (s: RoomState) => (s.rp && s.rp.ep === s.ep ? s.rp.pairs.map((p) => p.o).filter((k): k is string => !!k && isP(k)).map(idOf) : []);

export const alivePlayers = (s: RoomState) => s.players.filter((p) => p.alive && p.queen);
export const aliveKeys = (s: RoomState) => [...alivePlayers(s).map((p) => pkey(p.id)), ...s.npcs.map(nkey)];
const queenOfKey = (s: RoomState, k: string) => (isP(k) ? s.players.find((p) => p.id === idOf(k))?.queen || "" : idOf(k));
export const nameOfKey = (s: RoomState, k: string, e: Pick<Engine, "queenName">) => {
  if (!isP(k)) return e.queenName(idOf(k));
  const p = s.players.find((x) => x.id === idOf(k));
  return p ? `${e.queenName(p.queen || "")} (${p.name})` : "?";
};

/** Empieza la temporada: las reinas que nadie ha cogido juegan como rivales del juego. */
export function startSeason(s: RoomState, cast: string[], now: number, e: Engine): RoomState {
  const taken = new Set(s.players.map((p) => p.queen).filter(Boolean) as string[]);
  const players = s.players.map((p) => ({ ...p, alive: !!p.queen }));
  // Se sabe desde el principio qué reto y qué pasarela tiene cada episodio (hasta quedar 4)
  const weeks = isAW(s) ? winnersWeeks(cast.length) : undefined;
  const plan = makePlan(Math.max(1, weeks || cast.length - 4), e);
  const base: RoomState = { ...s, players, cast, npcs: cast.filter((q) => !taken.has(q)), ep: 0, plan, weeks, subs: {}, hearts: {}, pendingHearts: [], stars: {}, phase: "maletas", deadline: limite(now, DURACION[s.ritmo].maletas), v: s.v + 1 };
  // Reina de la suerte: una de las cajitas la tiene (en secreto)
  if (s.fmt === "suerte") { const all = aliveKeys(base); base.luck = all[Math.floor(e.rnd() * all.length)]; }
  return base;
}
/** Reparto de retos (sin repetir hasta agotarlos) y una pasarela distinta para cada uno que la tenga. */
export function makePlan(n: number, e: Pick<Engine, "retos" | "categorias" | "rnd">): PlanEp[] {
  const all = e.retos();
  const cats = e.categorias().slice();
  const out: PlanEp[] = [];
  let pool: typeof all = [];
  for (let i = 0; i < n; i++) {
    if (!pool.length) pool = all.slice();
    const r = pool.splice(Math.floor(e.rnd() * pool.length), 1)[0];
    const ep: PlanEp = { tipo: r.tipo };
    if (!r.noRunway) {
      const k = cats.length ? Math.floor(e.rnd() * cats.length) : -1;
      ep.cat = k >= 0 ? cats.splice(k, 1)[0] : e.categorias()[Math.floor(e.rnd() * e.categorias().length)];
    }
    out.push(ep);
  }
  return out;
}
/** Categorías de pasarela del plan (lo que hay que llevar en la maleta). */
export const planCats = (s: Pick<RoomState, "plan">) => (s.plan || []).map((p) => p.cat?.n).filter(Boolean) as string[];

function nextEpisode(s: RoomState, now: number, e: Engine): RoomState {
  const all = e.retos();
  const ep = s.ep + 1;
  // Segunda Oportunidrag: cuando quedan siete, vuelven las eliminadas en parejas
  if (s.fmt === "repesca" && !s.rpDone && aliveKeys(s).length <= REPESCA_AT && s.out.length && e.repesca) {
    const r = e.repesca();
    const comps = shuffleWith(aliveKeys(s), e), outs = shuffleWith(s.out.map((o) => o.key), e);
    const rp = { ep, pairs: comps.map((c, i) => ({ c, o: outs[i] || null })) };
    return { ...s, ep, reto: r, used: [...s.used, r.tipo], subs: {}, rows: undefined, crit: undefined, pairs: undefined, decision: undefined, twist: undefined, twistResult: undefined, bottom: undefined, triple: undefined, note: undefined, script: undefined, rp, rpDone: true, planShift: (s.planShift || 0) + 1, epNames: { ...s.epNames, [ep]: r.titulo }, phase: "anuncio", deadline: 0, v: s.v + 1 };
  }
  const planned = (s.plan || [])[ep - 1 - (s.planShift || 0)];
  let r: Reto;
  if (planned && all.some((x) => x.tipo === planned.tipo)) {
    r = { ...all.find((x) => x.tipo === planned.tipo)! };
    if (!r.noRunway) r.cat = planned.cat || e.categorias()[0];
  } else {
    let pool = all.filter((x) => !s.used.includes(x.tipo));
    if (!pool.length) pool = all;
    r = { ...pool[Math.floor(e.rnd() * pool.length)] };
    if (!r.noRunway) { const cats = e.categorias(); r.cat = cats[Math.floor(e.rnd() * cats.length)]; }
  }
  const secs = dur(s, "anuncio");
  return { ...s, ep, reto: r, used: [...s.used, r.tipo], subs: {}, rows: undefined, crit: undefined, pairs: undefined, decision: undefined, twist: undefined, twistResult: undefined, bottom: undefined, triple: undefined, protectedKeys: undefined, rp: undefined, note: undefined, script: undefined, reveal: s.reveal && s.reveal.ep === s.ep ? s.reveal : undefined, epNames: { ...s.epNames, [ep]: r.titulo }, phase: "anuncio", deadline: limite(now, secs), v: s.v + 1 };
}

/** ¿Han entregado ya todas las que tienen que entregar en esta fase? (para no esperar al tope) */
export function allIn(s: RoomState): boolean {
  const ps = alivePlayers(s);
  if (s.phase === "maletas") return ps.every((p) => s.subs[p.id]?.ready);
  const extra = rpPlayers(s);
  if (s.phase === "reto") return ps.every((p) => s.subs[p.id]?.reto != null || s.subs[p.id]?.final != null) && extra.every((id) => s.subs[id]?.reto != null || s.subs[id]?.final != null);
  if (s.phase === "pasarela") return ps.every((p) => s.subs[p.id]?.final != null);
  if (s.phase === "comodin") {
    const t = s.twist;
    const pls = (t?.by || []).filter(isP);
    if (!t || !pls.length) return false; // si deciden reinas del juego, se ve el momento hasta el tope
    return pls.every((k) => s.subs[idOf(k)]?.pick != null);
  }
  if (s.phase === "decision") {
    const d = s.decision;
    const ps = (d?.top || []).filter(isP);
    if (!d || !ps.length) return false; // si eligen reinas del juego, se espera al tope (se ve el momento)
    return ps.every((k) => s.subs[idOf(k)]?.elim != null);
  }
  if (s.phase === "lipsync" || s.phase === "final") {
    const inPairs = [...(s.pairs || []).filter((x) => !x.winner).flatMap((x) => [x.a, x.b]), ...(s.triple || [])].filter(isP).map(idOf);
    // Si solo bailan reinas del juego, se deja verlo hasta el tope
    if (!inPairs.length) return false;
    return inPairs.every((id) => s.subs[id]?.ls != null);
  }
  return false;
}

/** Notas, etiquetas y críticas de la semana. */
export function scoreWeek(s: RoomState, e: Engine): RoomState {
  const tipo = s.reto!.tipo;
  const own = (k: string) => (isP(k) ? s.subs[idOf(k)]?.final ?? s.subs[idOf(k)]?.reto ?? NO_PRESENTO : e.rivalScore(idOf(k), tipo));
  // Segunda Oportunidrag: la nota es de la pareja (60 % la que compite, 40 % la eliminada)
  const pairOf = (k: string) => (s.rp && s.rp.ep === s.ep ? s.rp.pairs.find((p) => p.c === k) : undefined);
  const rows: Row[] = aliveKeys(s).map((k) => { const pr = pairOf(k); const sc = own(k); return { key: k, score: pr && pr.o ? Math.round(sc * 0.6 + own(pr.o) * 0.4) : sc, label: "" }; });
  rows.sort((a, b) => b.score - a.score || (e.rnd() < 0.5 ? -1 : 1));
  const n = rows.length;
  // Bottom de tres en la moneda (con seis o más) y en la Segunda Oportunidrag (lip sync a tres bandas)
  const nb = isAW(s) ? 0 : (s.fmt === "moneda" && n >= 6) || (s.rp && s.rp.ep === s.ep && n >= 5) ? 3 : 2;
  const blocked = s.block && s.block.ep === s.ep ? s.block.id : null;
  rows.forEach((r, i) => {
    // All Stars y All Winners: las dos mejores van al top 2; la ganadora sale de ese lip sync
    // Como en la historia: las dos siguientes al top 2 reciben críticas especialmente buenas (con seis o más)
    if (isAW(s)) r.label = i <= 1 ? (r.key === blocked ? "BTOP" : "TOP2") : (i <= 3 && n >= 6) || (i === 2 && n > 7) ? "HIGH" : "SAFE";
    else if (isAS(s)) r.label = i <= 1 ? "TOP2" : i >= n - 2 ? "BTM2" : i <= (n <= 7 ? 2 : 3) ? "HIGH" : i >= n - 3 ? "LOW" : "SAFE";
    else r.label = i === 0 ? "WIN" : i >= n - nb ? `BTM${nb}` : i <= (n <= 7 ? 1 : 2) ? "HIGH" : i >= n - nb - 1 ? "LOW" : "SAFE";
  });
  // All Winners: solo críticas para las de arriba (nada de críticas negativas)
  const allCrit = n <= 6 && !isAW(s);
  const crit = rows
    .filter((r) => allCrit || r.label !== "SAFE")
    .map((r) => {
      const level = /WIN|TOP2|BTOP|HIGH/.test(r.label) ? "top" : r.label === "SAFE" ? "mid" : "low";
      const nm = isP(r.key) ? e.queenName(queenOfKey(s, r.key)) : e.queenName(idOf(r.key));
      const lines = e.critique(tipo, level, nm);
      // Reto en directo: Supremme le dice lo que el jurado apuntó mientras lo hacía
      const jury = isP(r.key) ? (s.subs[idOf(r.key)]?.jury || "").trim() : "";
      if (jury && lines[0]) lines[0] = [lines[0][0], `${nm}, ${jury.length > 240 ? jury.slice(0, 240).replace(/\s+\S*$/, "") + "..." : jury}`];
      return { key: r.key, lines };
    })
    .sort(() => e.rnd() - 0.5); // desordenadas: que el orden no delate posiciones
  return { ...s, rows, crit };
}

const writeTrack = (s: RoomState, rows: Row[]) => {
  const track = { ...s.track };
  rows.forEach((r) => (track[r.key] = { ...(track[r.key] || {}), [s.ep]: r.label }));
  return track;
};

/** Resuelve los lip syncs pendientes: entre rivales del juego decide la simulación; si hay jugadoras, sus resultados. */
export function resolvePairs(s: RoomState, e: Engine): Pair[] {
  return (s.pairs || []).map((p) => {
    if (p.winner) return p;
    const qa = queenOfKey(s, p.a), qb = queenOfKey(s, p.b);
    const la = isP(p.a) ? s.subs[idOf(p.a)]?.ls : undefined, lb = isP(p.b) ? s.subs[idOf(p.b)]?.ls : undefined;
    let w: string;
    if (isP(p.a) && isP(p.b)) {
      const sa = la ? la.score : -1, sb = lb ? lb.score : -1;
      w = sa === sb ? (e.simLS(qa, qb) === qa ? p.a : p.b) : sa > sb ? p.a : p.b;
    } else if (isP(p.a)) w = la?.won ? p.a : p.b;
    else if (isP(p.b)) w = lb?.won ? p.b : p.a;
    else w = e.simLS(qa, qb) === qa ? p.a : p.b;
    return { ...p, winner: w };
  });
}

function eliminate(s: RoomState, key: string, place: string, label = "ELIM", e?: Pick<Engine, "rnd">): RoomState {
  const players = s.players.map((p) => (pkey(p.id) === key ? { ...p, alive: false } : p));
  const npcs = s.npcs.filter((q) => nkey(q) !== key);
  const track = { ...s.track, [key]: { ...(s.track[key] || {}), [s.ep]: label } };
  const t: RoomState = { ...s, players, npcs, track, out: [...s.out, { key, ep: s.ep, place }] };
  // Si se va la que tenía la reina de la suerte, se pierde
  if (t.luck === key) t.luck = null;
  // Temporada del corazón: la que se va deja medio corazón a una compañera (se sabrá la semana que viene)
  if (t.fmt === "corazon" && e) {
    const left = aliveKeys(t);
    if (left.length > 1) t.pendingHearts = [...(t.pendingHearts || []), { from: key, to: pickWith(left, e) }];
  }
  return t;
}
/** Vuelve a la competición (Segunda Oportunidrag). */
function revive(s: RoomState, key: string): RoomState {
  const players = s.players.map((p) => (pkey(p.id) === key ? { ...p, alive: true } : p));
  const npcs = isP(key) ? s.npcs : [...s.npcs, idOf(key)];
  const track = { ...s.track, [key]: { ...(s.track[key] || {}), [s.ep]: "RTRN" } };
  return { ...s, players, npcs, track, out: s.out.filter((o) => o.key !== key) };
}

// ------------------------------ Track record ------------------------------
const labelsOf = (s: RoomState, k: string) => Object.values(s.track[k] || {});
export const ppeOf = (s: RoomState, k: string) => ppe(labelsOf(s, k));
export const winsOf = (s: RoomState, k: string) => labelsOf(s, k).filter((l) => l === "WIN" || l === "BWIN" || l === "WINNER").length;
/** Orden del último episodio con resultados (como en el modo historia). */
const ORDER: Record<string, number> = { WINNER: 0, WIN: 1, BWIN: 1, "RUNNER-UP": 2, TOP2: 3, BTOP: 3, HIGH: 4, "3ª": 5, QOSD: 5.5, SAFE: 6, RTRN: 6.5, LOW: 7, BTM2: 8, BTM3: 8, ELIMF: 8.5, ELIM: 9 };
/** Clasificación para el track record: arriba las que siguen (por su última semana y su temporada); debajo las eliminadas, de la última a la primera. */
export function standings(s: RoomState): { key: string; place: string; out: boolean }[] {
  const eps = Object.keys(s.epNames).map(Number).sort((a, b) => a - b);
  const outKeys = s.out.map((o) => o.key);
  const alive = aliveKeys(s).filter((k) => !outKeys.includes(k));
  const lastScored = [...eps].reverse().find((e) => alive.some((k) => ORDER[(s.track[k] || {})[e]] !== undefined));
  const last = (k: string) => { const l = lastScored != null ? (s.track[k] || {})[lastScored] : undefined; return l && ORDER[l] !== undefined ? ORDER[l] : 7.5; };
  const count = (k: string, re: RegExp) => labelsOf(s, k).filter((l) => re.test(l)).length;
  const stars = (k: string) => (s.fmt === "winners" ? s.stars?.[k] || 0 : 0);
  const top = alive.slice().sort((a, b) => (s.champion === b ? 1 : 0) - (s.champion === a ? 1 : 0) || stars(b) - stars(a) || last(a) - last(b) || ppeOf(s, b) - ppeOf(s, a) || count(b, /^WIN/) - count(a, /^WIN/) || count(a, /^BTM/) - count(b, /^BTM/));
  const gone = s.out.map((o, i) => ({ ...o, i })).sort((a, b) => b.ep - a.ep || b.i - a.i);
  return [
    ...top.map((key, i) => ({ key, place: `${i + 1}º`, out: false })),
    ...gone.map((o) => ({ key: o.key, place: o.place, out: true })),
  ];
}

// ------------------------------ All Stars: la ganadora del lip sync elige ------------------------------
/** Cómo se lee la decisión: la peor de la semana (justa), la de peor temporada (trayectoria) o quitarse a una rival fuerte (jugarreta). */
export function decisionKind(s: RoomState, go: string, stay: string): "semana" | "trayectoria" | "jugarreta" {
  const sc = (k: string) => (s.rows || []).find((r) => r.key === k)?.score ?? 0;
  if (sc(go) <= sc(stay)) return "semana";
  return ppeOf(s, go) < ppeOf(s, stay) - 0.25 ? "trayectoria" : "jugarreta";
}
/** Decisión de una reina del juego: mira la semana y la temporada; a veces, estrategia. */
export function autoDecide(s: RoomState, options: string[], e: Pick<Engine, "rnd">): string {
  if (options.length < 2) return options[0];
  const sc = (k: string) => (s.rows || []).find((r) => r.key === k)?.score ?? 0;
  const wT = 4 + e.rnd() * 8;
  const merit = (k: string) => sc(k) + ppeOf(s, k) * wT;
  const deserved = options.slice().sort((a, b) => merit(a) - merit(b))[0];
  const strength = (k: string) => ppeOf(s, k) * 2 + labelsOf(s, k).filter((l) => l === "WIN" || l === "TOP2").length;
  const strong = options.slice().sort((a, b) => strength(b) - strength(a))[0];
  return e.rnd() < 0.22 && strong !== deserved ? strong : deserved;
}

// ------------------------------ Giros de cada temporada ------------------------------
const STAGES = ["corazon", "suerte", "moneda"] as const;
/** Salvar a una del bottom: entra la siguiente con peor nota (que no sea la ganadora ni esté ya salvada). */
export function saveFromBottom(s: RoomState, key: string): { s: RoomState; entered?: string } {
  const bottom = s.bottom || [];
  if (!bottom.includes(key)) return { s };
  const rows = s.rows || [];
  const prot = new Set([...(s.protectedKeys || []), key]);
  const top = rows[0]?.key;
  const alive = new Set(aliveKeys(s));
  const cand = rows.slice().reverse().find((r) => !bottom.includes(r.key) && r.key !== top && !prot.has(r.key) && alive.has(r.key));
  if (!cand) return { s };
  const track = { ...s.track, [cand.key]: { ...(s.track[cand.key] || {}), [s.ep]: `BTM${bottom.length}` } };
  return { s: { ...s, bottom: bottom.map((k) => (k === key ? cand.key : k)), protectedKeys: [...prot], track }, entered: cand.key };
}
/** Lo que deciden las reinas del juego en cada giro. */
function npcPicks(s: RoomState, by: string[], kind: Twist["kind"], options: string[], e: Pick<Engine, "rnd">): Record<string, string> {
  const out: Record<string, string> = {};
  const late = aliveKeys(s).length <= 6;
  by.filter((k) => !isP(k)).forEach((k) => {
    if (kind === "moneda") out[k] = pickWith(options, e);
    else if (kind === "bloqueo") out[k] = options.slice().sort((a, b) => (s.stars?.[b] || 0) - (s.stars?.[a] || 0) || e.rnd() - 0.5)[0];
    else if (options.includes(k)) out[k] = k; // si está en el bottom, se salva a sí misma
    else out[k] = e.rnd() < (kind === "corazon" ? 0.4 : late ? 0.35 : 0.15) ? pickWith(options, e) : "keep";
  });
  return out;
}
function toComodin(s: RoomState, tw: Twist, stage: number, now: number): RoomState {
  const anyP = tw.by.some(isP);
  const subs = Object.fromEntries(Object.entries(s.subs).map(([k, v]) => [k, { ...v, pick: undefined }]));
  return { ...s, twist: tw, stage, subs, phase: "comodin", deadline: anyP ? limite(now, DURACION[s.ritmo].comodin) : now + 7000, v: s.v + 1 };
}
function startStage(s: RoomState, i: number, now: number, e: Engine): RoomState | null {
  const st = STAGES[i];
  const bottom = s.bottom || [];
  if (st === "corazon") {
    if (s.fmt !== "corazon" || !(s.pendingHearts || []).length) return null;
    const alive = new Set(aliveKeys(s));
    const gifts = (s.pendingHearts || []).filter((g) => alive.has(g.to));
    const hearts = { ...(s.hearts || {}) };
    gifts.forEach((g) => (hearts[g.to] = (hearts[g.to] || 0) + 1));
    const full = Object.keys(hearts).filter((k) => alive.has(k) && hearts[k] >= 2);
    const base: RoomState = { ...s, hearts, pendingHearts: [], stage: i, twist: undefined };
    if (full.length && bottom.length) base.twist = { kind: "corazon", by: full, options: bottom, picks: npcPicks(base, full, "corazon", bottom, e) };
    if (!gifts.length && !base.twist) return null;
    return { ...base, twistResult: { kind: "corazones", gifts, full }, phase: "sorpresa", deadline: 0, v: s.v + 1 };
  }
  if (st === "suerte") {
    if (s.fmt !== "suerte" || !s.luck || !aliveKeys(s).includes(s.luck) || aliveKeys(s).length < 4 || !bottom.length) return null;
    const by = [s.luck];
    return toComodin(s, { kind: "suerte", by, options: bottom, picks: npcPicks(s, by, "suerte", bottom, e) }, i, now);
  }
  if (s.fmt !== "moneda" || bottom.length !== 3) return null;
  const voters = aliveKeys(s).filter((k) => !bottom.includes(k));
  return toComodin(s, { kind: "moneda", by: voters, options: bottom, cara: e.rnd() < 0.5, picks: npcPicks(s, voters, "moneda", bottom, e) }, i, now);
}
/** Sigue con los giros que falten esta semana y, al final, el lip sync. */
function continueChain(s: RoomState, from: number, now: number, e: Engine): RoomState {
  for (let i = from; i < STAGES.length; i++) {
    const r = startStage(s, i, now, e);
    if (r) return r;
  }
  return toLipsync(s, now);
}
function toLipsync(s: RoomState, now: number): RoomState {
  const b = s.bottom || [];
  const subs = Object.fromEntries(Object.entries(s.subs).map(([k, v]) => [k, { ...v, ls: undefined }]));
  const triple = b.length === 3 ? b : undefined;
  const pairs: Pair[] = !triple && b.length === 2 ? [{ a: b[0], b: b[1] }] : [];
  const anyP = [...b].some(isP);
  return { ...s, subs, pairs, triple, twist: undefined, twistResult: undefined, phase: "lipsync", deadline: anyP ? limite(now, DURACION[s.ritmo].lipsync) : now + 6000, v: s.v + 1 };
}
/** Resuelve un comodín: aplica lo que decidió cada una (o lo decide el juego si no llegó a tiempo). */
function resolveTwist(s: RoomState, now: number, e: Engine): RoomState {
  const t = s.twist!;
  if (t.kind === "corte") {
    // La que más estrellas tiene elige quién pasa el corte; si no llega a tiempo, pasan las de mejor PPE
    const by = t.by[0], need = t.need || 1;
    const raw = (isP(by) ? s.subs[idOf(by)]?.pick : "") || "";
    let picked = [...new Set(raw.split(","))].filter((k) => t.options.includes(k)).slice(0, need);
    if (picked.length < need) picked = [...picked, ...t.options.filter((k) => !picked.includes(k)).sort((a, b) => ppeOf(s, b) - ppeOf(s, a))].slice(0, need);
    return awStart({ ...s, twist: undefined }, [...(t.sure || []), ...picked], now, e, { chooser: by, picked, tied: t.options });
  }
  const picks = { ...t.picks };
  t.by.forEach((k) => {
    if (picks[k]) return;
    const pk = isP(k) ? s.subs[idOf(k)]?.pick : undefined;
    if (pk && (pk === "keep" || t.options.includes(pk))) picks[k] = pk;
    else picks[k] = t.kind === "moneda" ? pickWith(t.options, e) : t.kind === "bloqueo" ? npcPicks(s, [nkey("x")], "bloqueo", t.options, e)[nkey("x")] : "keep";
  });
  let r: RoomState = { ...s, twist: { ...t, picks } };
  let res: TwistResult;
  if (t.kind === "suerte" || t.kind === "corazon") {
    const saved: string[] = [], entered: string[] = [];
    const hearts = { ...(r.hearts || {}) };
    t.by.forEach((k) => {
      if (t.kind === "corazon") hearts[k] = 0; // el corazón entero se usa ahora o se pierde
      const pk = picks[k];
      if (pk === "keep") return;
      const o = saveFromBottom(r, pk);
      if (o.entered) { r = o.s; saved.push(pk); entered.push(o.entered); if (t.kind === "suerte") r.luck = null; }
    });
    if (t.kind === "corazon") r.hearts = hearts;
    res = { kind: t.kind, by: t.by.find((k) => picks[k] !== "keep") || t.by[0], saved, entered };
  } else if (t.kind === "moneda") {
    const votes: Record<string, string[]> = Object.fromEntries(t.options.map((o) => [o, [] as string[]]));
    t.by.forEach((k) => votes[picks[k]]?.push(k));
    const max = Math.max(...t.options.map((o) => votes[o].length));
    const tied = t.options.filter((o) => votes[o].length === max);
    // Empate: desempata la ganadora de la semana (su voto, si está entre las empatadas)
    const win = (s.rows || [])[0]?.key;
    const chosen = tied.length === 1 ? tied[0] : win && tied.includes(picks[win]) ? picks[win] : pickWith(tied, e);
    const sc = (k: string) => (s.rows || []).find((x) => x.key === k)?.score ?? 0;
    const rest = t.options.filter((o) => o !== chosen);
    r.bottom = t.cara ? rest : [chosen, rest.sort((a, b) => sc(a) - sc(b))[0]];
    res = { kind: "moneda", votes, chosen, cara: t.cara, tie: tied.length > 1 };
  } else {
    const by = t.by[0];
    r.block = { ep: s.ep + 1, id: picks[by], by };
    res = { kind: "bloqueo", by, target: picks[by], stars: t.starred || [] };
  }
  return { ...r, twistResult: res, phase: "sorpresa", deadline: 0, v: s.v + 1 };
}
/** Lip sync a tres bandas: se salva una (la jugadora que gane con más nota; si ninguna gana, la mejor del juego). */
function resolveTriple(s: RoomState, e: Engine): string {
  const T = s.triple || [];
  const ls = (k: string) => s.subs[idOf(k)]?.ls;
  const winners = T.filter((k) => isP(k) && ls(k)?.won).sort((a, b) => (ls(b)?.score || 0) - (ls(a)?.score || 0));
  if (winners.length) return winners[0];
  const npcs = T.filter((k) => !isP(k));
  if (!npcs.length) return T.slice().sort((a, b) => (ls(b)?.score || 0) - (ls(a)?.score || 0))[0];
  return npcs.slice(1).reduce((best, k) => (e.simLS(queenOfKey(s, best), queenOfKey(s, k)) === queenOfKey(s, best) ? best : k), npcs[0]);
}

/** Siembra de la final por PPE (1 contra 4, 2 contra 3). */
// ------------------------------ Gran final de All Winners ------------------------------
// Igual que en el modo historia: las 4 con más estrellas van por la corona (si hay empate en el corte, decide la que más tiene);
// las demás se juegan la Queen of She Done Already Done Had Herses. Las dos son eliminatorias de lip syncs (1ª-4ª, 2ª-3ª; la mejor descansa si sois impares).
function awCut(s: RoomState, now: number, e: Engine): RoomState {
  const ranked = seeds(s);
  const st = (k: string) => s.stars?.[k] || 0;
  const TOP = Math.min(4, ranked.length);
  const stars4 = ranked.length > TOP ? st(ranked[TOP - 1]) : -1;
  const sure = ranked.filter((k) => st(k) > stars4).slice(0, TOP);
  const tied = ranked.filter((k) => st(k) === stars4);
  const ep = s.ep + 1;
  const base: RoomState = { ...s, ep, epNames: { ...s.epNames, [ep]: "Gran final" }, reto: undefined, rows: undefined, crit: undefined, subs: {} };
  if (stars4 >= 0 && sure.length < TOP && tied.length > TOP - sure.length) {
    const need = TOP - sure.length, chooser = ranked[0];
    if (isP(chooser) && !tied.includes(chooser)) return toComodin(base, { kind: "corte", by: [chooser], options: tied, picks: {}, need, sure }, -1, now);
    const picked = [...(tied.includes(chooser) ? [chooser] : []), ...tied.filter((k) => k !== chooser).sort((a, b) => ppeOf(s, b) - ppeOf(s, a))].slice(0, need);
    return awStart(base, [...sure, ...picked], now, e, { chooser, picked, tied });
  }
  return awStart(base, ranked.slice(0, TOP), now, e);
}
function awStart(s: RoomState, top: string[], now: number, e: Engine, cut?: { chooser: string; picked: string[]; tied: string[] }): RoomState {
  const ranked = seeds(s);
  const topS = ranked.filter((k) => top.includes(k)), bottom = ranked.filter((k) => !top.includes(k));
  const tierB = bottom.length > 1 ? `${topS.length + 1}º/${topS.length + bottom.length}º` : `${topS.length + 1}º`;
  const nm = (k: string) => nameOfKey(s, k, e);
  const list = (ks: string[]) => ks.map(nm).join(", ").replace(/, ([^,]*)$/, " y $1");
  const stars4 = cut ? s.stars?.[cut.tied[0]] || 0 : 0;
  const left = cut ? cut.tied.filter((k) => !cut.picked.includes(k)) : [];
  const note = [
    cut ? `Empate a ${stars4} ${stars4 === 1 ? "estrella" : "estrellas"} entre ${list(cut.tied)}: decide ${nm(cut.chooser)}, la que más estrellas tiene, y elige a ${list(cut.picked)}.${left.length ? ` ${list(left)}, os jugáis el otro título.` : ""}` : "",
    `${list(topS)}: sois las ${topS.length} con más estrellas. Os jugáis la corona de Reina de reinas.`,
    bottom.length ? `${list(bottom)}: os jugáis el título de Queen of She Done Already Done Had Herses. Porque ya lo habíais hecho todo.` : "",
  ].filter(Boolean).join(" ");
  let t: RoomState = { ...s, awFinal: { top: topS, bottom, tierB } };
  if (bottom.length === 1) t = { ...eliminate(t, bottom[0], tierB, "QOSD"), awFinal: { top: topS, bottom, tierB, qosd: bottom[0] } };
  const br = bottom.length >= 2 ? { kind: "qosd" as const, seeds: bottom, alive: bottom, round: 1 } : { kind: "corona" as const, seeds: topS, alive: topS, round: 1 };
  return bracketRound({ ...t, bracket: br }, now, e, note);
}
function bracketRound(s: RoomState, now: number, e: Engine, note: string): RoomState {
  const b = s.bracket!;
  const al = b.seeds.filter((k) => b.alive.includes(k));
  const bye = al.length % 2 ? al[0] : undefined;
  const pool = al.filter((k) => k !== bye);
  const pairs: Pair[] = [];
  for (let i = 0; i < pool.length / 2; i++) pairs.push({ a: pool[i], b: pool[pool.length - 1 - i] });
  const anyP = pairs.some((p) => isP(p.a) || isP(p.b));
  const rest = bye ? `${nameOfKey(s, bye, e)} descansa esta ronda.` : "";
  return { ...s, bracket: { ...b, alive: al, bye }, pairs, finalStage: (b.kind === "qosd" ? 100 : 200) + b.round, subs: {}, note: [note, rest].filter(Boolean).join(" "), phase: "final", deadline: anyP ? limite(now, DURACION[s.ritmo].final) : now + 8000, v: s.v + 1 };
}
function bracketNext(s: RoomState, now: number, e: Engine): RoomState {
  const b = s.bracket!, af = s.awFinal!;
  const pairs = resolvePairs(s, e);
  let t: RoomState = { ...s, pairs };
  const winners = pairs.map((p) => p.winner!);
  const losers = pairs.map((p) => (p.winner === p.a ? p.b : p.a));
  const alive = [...(b.bye ? [b.bye] : []), ...winners];
  const nm = (k: string) => nameOfKey(t, k, e);
  const list = (ks: string[]) => ks.map(nm).join(", ").replace(/, ([^,]*)$/, " y $1");
  const duels = pairs.map((p) => `${nm(p.winner!)} gana a ${nm(p.winner === p.a ? p.b : p.a)}.`).join(" ");
  if (b.kind === "qosd") {
    losers.forEach((l) => (t = eliminate(t, l, af.tierB, "ELIMF")));
    if (alive.length > 1) return bracketRound({ ...t, bracket: { ...b, alive, round: b.round + 1 } }, now, e, duels);
    t = { ...eliminate(t, alive[0], af.tierB, "QOSD"), awFinal: { ...af, qosd: alive[0] } };
    return bracketRound({ ...t, bracket: { kind: "corona", seeds: af.top, alive: af.top, round: 1 } }, now, e, `${duels} 💅 ${nm(alive[0])} se lleva el título de QoSDADHH. Ahora, la final por la corona: ${list(af.top)}.`);
  }
  if (alive.length > 1) {
    losers.forEach((l) => (t = eliminate(t, l, af.top.length > 3 ? "3º/4º" : "3º", "3ª")));
    return bracketRound({ ...t, bracket: { ...b, alive, round: b.round + 1 } }, now, e, duels);
  }
  t = eliminate(t, losers[0], "2º", "RUNNER-UP");
  t = { ...t, track: { ...t.track, [alive[0]]: { ...(t.track[alive[0]] || {}), [s.ep]: "WINNER" } } };
  return { ...t, champion: alive[0], phase: "corona", deadline: 0, v: s.v + 1 };
}
function seeds(s: RoomState): string[] {
  // All Winners: por estrellas
  if (isAW(s)) return aliveKeys(s).sort((a, b) => (s.stars?.[b] || 0) - (s.stars?.[a] || 0) || ppeOf(s, b) - ppeOf(s, a));
  return aliveKeys(s).sort((a, b) => ppeOf(s, b) - ppeOf(s, a) || winsOf(s, b) - winsOf(s, a));
}

/** Pasa a la siguiente fase (al cambiar de pantalla se borra el guion de la anterior). */
export function advance(s: RoomState, now: number, e: Engine): RoomState {
  const n = advanceRaw(s, now, e);
  return n !== s && (n.phase !== s.phase || n.ep !== s.ep || n.finalStage !== s.finalStage) ? { ...n, script: undefined } : n;
}
function advanceRaw(s: RoomState, now: number, e: Engine): RoomState {
  const D = DURACION[s.ritmo];
  const at = (phase: Phase, secs: number, extra: Partial<RoomState> = {}): RoomState => ({ ...s, script: undefined, ...extra, phase, deadline: limite(now, secs), v: s.v + 1 });
  switch (s.phase) {
    case "maletas":
      return nextEpisode({ ...s, subs: {} }, now, e);
    case "anuncio":
      return at("reto", dur(s, "reto"));
    case "reto":
      if (!s.reto!.noRunway) return at("pasarela", D.pasarela);
    // falls through: sin pasarela aparte, directo a resultados
    case "pasarela": {
      const scored = scoreWeek(s, e);
      // Que dé tiempo a escuchar las críticas de todas
      const secs = D.resultados > 0 ? Math.max(D.resultados, 8 + (scored.crit || []).length * POR_CRITICA) : 0;
      return { ...scored, phase: "resultados", deadline: limite(now, secs), v: s.v + 1 };
    }
    case "resultados":
      return at("untucked", D.untucked);
    case "untucked":
      return at("veredicto", D.veredicto, { track: writeTrack(s, s.rows || []) });
    case "veredicto": {
      const rows = s.rows || [];
      if (!isAS(s) && !isAW(s)) {
        // Normal y temporadas con giro: el bottom, los comodines (corazón, suerte, moneda) y el lip sync
        const subs = Object.fromEntries(Object.entries(s.subs).map(([k, v]) => [k, { ...v, ls: undefined, pick: undefined }]));
        let t: RoomState = { ...s, subs, bottom: rows.filter((r) => /^BTM/.test(r.label)).map((r) => r.key), protectedKeys: [], stage: undefined, twist: undefined, twistResult: undefined };
        // Segunda Oportunidrag: vuelve la eliminada de la pareja ganadora (o de la mejor pareja que tenga una)
        if (s.rp && s.rp.ep === s.ep) {
          const pr = rows.map((r) => s.rp!.pairs.find((p) => p.c === r.key)).find((p) => p && p.o);
          const back = pr?.o || undefined;
          if (back) t = revive(t, back);
          const pairs = s.rp.pairs.map((p) => ({ ...p, score: rows.find((r) => r.key === p.c)?.score ?? 0 })).sort((a, b) => b.score - a.score);
          return { ...t, twistResult: { kind: "repesca", back, pairs }, phase: "sorpresa", deadline: 0, v: s.v + 1 };
        }
        return continueChain(t, 0, now, e);
      }
      // All Stars y All Winners: lip sync del top 2
      const who = rows.filter((r) => /^(TOP2|BTOP)$/.test(r.label)).map((r) => r.key);
      const pairs: Pair[] = who.length === 2 ? [{ a: who[0], b: who[1] }] : [];
      const next = { ...s, pairs, subs: Object.fromEntries(Object.entries(s.subs).map(([k, v]) => [k, { ...v, ls: undefined, elim: undefined }])) };
      // All Stars: antes del lip sync, cada una del top elige en secreto su pintalabios
      if (isAS(s) && who.length === 2) {
        const options = rows.filter((r) => r.label === "BTM2").map((r) => r.key);
        const picks: Record<string, string> = {};
        who.filter((k) => !isP(k)).forEach((k) => (picks[k] = autoDecide(next, options, e)));
        const anyP = who.some(isP);
        return { ...next, decision: { top: who, options, picks }, phase: "decision", deadline: anyP ? limite(now, D.decision) : now + 8000, v: s.v + 1 };
      }
      // Si no hay jugadoras en el lip sync, se resuelve solo
      if (!pairs.some((p) => isP(p.a) || isP(p.b))) return { ...next, phase: "lipsync", deadline: now + 6000, v: s.v + 1 };
      return { ...next, phase: "lipsync", deadline: limite(now, D.lipsync), v: s.v + 1 };
    }
    case "lipsync": {
      // Lip sync a tres bandas: se salva una y se van dos
      if (s.triple && s.triple.length === 3) {
        const stay = resolveTriple(s, e);
        const n = aliveKeys(s).length;
        let t: RoomState = { ...s };
        const gone = s.triple.filter((k) => k !== stay);
        gone.forEach((k) => (t = eliminate(t, k, `${n - 1}º/${n}º`, "ELIM", e)));
        const nm = (k: string) => nameOfKey(t, k, e);
        return { ...t, triple: undefined, note: `${nm(stay)} se salva en el lip sync a tres bandas. ${gone.map(nm).join(" y ")} se van a casa.`, phase: "track", deadline: limite(now, D.track), v: s.v + 1 };
      }
      const pairs = resolvePairs(s, e);
      if (isAW(s)) {
        // All Winners: la del lip sync se lleva la Legendary Legend Star y bloquea a una rival
        const p = pairs[0];
        if (!p || !p.winner) return at("track", D.track, { pairs });
        const blocked = s.block && s.block.ep === s.ep ? s.block.id : null;
        const last = s.ep >= (s.weeks || 0);
        const stars = { ...(s.stars || {}) };
        const starred = [p.a, p.b].filter((k) => k !== blocked);
        starred.forEach((k) => (stars[k] = (stars[k] || 0) + (last ? 3 : 1)));
        const track = { ...s.track, [p.winner]: { ...(s.track[p.winner] || {}), [s.ep]: p.winner === blocked ? "BWIN" : "WIN" } };
        const options = aliveKeys(s).filter((k) => k !== p.winner && k !== blocked);
        const base: RoomState = { ...s, pairs, stars, track };
        // La última semana ya no hay bloqueo: después viene la final
        if (last || !options.length) return { ...base, twistResult: { kind: "bloqueo", by: p.winner, stars: starred }, phase: "sorpresa", deadline: 0, v: s.v + 1 };
        return toComodin(base, { kind: "bloqueo", by: [p.winner], options, picks: npcPicks(base, [p.winner], "bloqueo", options, e), starred }, -1, now);
      }
      if (isAS(s) && s.decision) {
        // La ganadora del lip sync gana el reto y saca su pintalabios: se va la que eligió
        const p = pairs[0];
        const d = s.decision;
        if (!p || !p.winner) return at("track", D.track, { pairs });
        const loser = p.winner === p.a ? p.b : p.a;
        const go = d.picks[p.winner] || autoDecide(s, d.options, e);
        const stay = d.options.find((k) => k !== go) || go;
        const kind = decisionKind(s, go, stay);
        let t: RoomState = { ...s, pairs, track: { ...s.track, [p.winner]: { ...(s.track[p.winner] || {}), [s.ep]: "WIN" } } };
        t = eliminate(t, go, `${aliveKeys(t).length}º`, "ELIM", e);
        const nm = (k: string) => nameOfKey(t, k, e);
        const why = kind === "semana" ? "la peor de la semana" : kind === "trayectoria" ? "ha mirado toda la temporada" : "jugarreta: se quita a una rival fuerte";
        const reveal: Reveal | undefined = d.picks[loser] ? { ep: s.ep, by: loser, go: d.picks[loser], went: go } : undefined;
        return { ...t, decision: { ...d, by: p.winner, go, kind }, reveal, note: `${nm(p.winner)} saca su pintalabios: ${nm(go)} se va a casa (${why}). ${nm(stay)} se queda.`, phase: "pintalabios", deadline: limite(now, D.pintalabios), v: s.v + 1 };
      }
      let t: RoomState = { ...s, pairs };
      pairs.forEach((p) => {
        const loser = p.winner === p.a ? p.b : p.a;
        t = eliminate(t, loser, `${aliveKeys(t).length}º`, "ELIM", e);
      });
      const nm = (k: string) => nameOfKey(t, k, e);
      const note = pairs.map((p) => `${nm(p.winner!)} se queda. ${nm(p.winner === p.a ? p.b : p.a)} se va a casa.`).join(" ");
      return { ...t, note, phase: "track", deadline: limite(now, D.track), v: s.v + 1 };
    }
    case "decision": {
      // Las que no han elegido a tiempo: elige el juego por ellas
      const d = s.decision!;
      const picks = { ...d.picks };
      d.top.forEach((k) => {
        const pick = isP(k) ? s.subs[idOf(k)]?.elim : undefined;
        if (!picks[k]) picks[k] = pick && d.options.includes(pick) ? pick : autoDecide(s, d.options, e);
      });
      const anyP = (s.pairs || []).some((p) => isP(p.a) || isP(p.b));
      return { ...s, decision: { ...d, picks }, phase: "lipsync", deadline: anyP ? limite(now, D.lipsync) : now + 6000, v: s.v + 1 };
    }
    case "pintalabios":
      return at("track", D.track);
    case "comodin":
      return resolveTwist(s, now, e);
    case "sorpresa": {
      const k = s.twistResult?.kind;
      // Corazones destapados: si alguna tiene uno entero, decide ahora
      if (k === "corazones" && s.twist && s.twist.kind === "corazon") return toComodin({ ...s, twistResult: undefined }, s.twist, s.stage ?? 0, now);
      if (k === "bloqueo") return at("track", D.track, { twist: undefined, twistResult: undefined });
      const from = k === "repesca" ? 0 : (s.stage ?? -1) + 1;
      return continueChain({ ...s, twist: undefined, twistResult: undefined }, from, now, e);
    }
    case "track": {
      if (isAW(s) ? s.ep < (s.weeks || 0) : aliveKeys(s).length > 4) return nextEpisode(s, now, e);
      // All Winners: como en el All Stars 7 (corte del top 4 por estrellas, QoSDADHH y corona)
      if (isAW(s)) return awCut(s, now, e);
      // Gran final: lip syncs eliminatorios entre las cuatro (o tres) últimas
      const sd = seeds(s);
      const ep = s.ep + 1;
      const pairs: Pair[] = sd.length >= 4 ? [{ a: sd[0], b: sd[3] }, { a: sd[1], b: sd[2] }] : sd.length === 3 ? [{ a: sd[1], b: sd[2] }] : [{ a: sd[0], b: sd[1] }];
      const bye = sd.length === 3 ? sd[0] : undefined;
      const anyP = pairs.some((p) => isP(p.a) || isP(p.b));
      return { ...s, ep, epNames: { ...s.epNames, [ep]: "Gran final" }, reto: undefined, rows: undefined, crit: undefined, pairs, finalStage: sd.length === 2 ? 2 : 1, note: bye ? `${nameOfKey(s, bye, e)} pasa directa a la final.` : undefined, subs: {}, phase: "final", deadline: anyP ? limite(now, D.final) : now + 8000, v: s.v + 1 };
    }
    case "final": {
      if (s.bracket) return bracketNext(s, now, e);
      const pairs = resolvePairs(s, e);
      let t: RoomState = { ...s, pairs };
      if (s.finalStage === 1) {
        const winners = pairs.map((p) => p.winner!);
        const losers = pairs.map((p) => (p.winner === p.a ? p.b : p.a));
        const place = losers.length === 2 ? "3ª/4ª" : "3ª";
        losers.forEach((l) => (t = eliminate(t, l, place, "3ª")));
        const fin = aliveKeys(t).filter((k) => !winners.includes(k)).concat(winners);
        const pair: Pair = { a: fin[0], b: fin[1] };
        const anyP = isP(pair.a) || isP(pair.b);
        return { ...t, pairs: [pair], finalStage: 2, subs: {}, note: `${winners.map((k) => nameOfKey(t, k, e)).join(" y ")} pasan a la final.`, phase: "final", deadline: anyP ? limite(now, D.final) : now + 8000, v: s.v + 1 };
      }
      const p = pairs[0];
      const loser = p.winner === p.a ? p.b : p.a;
      t = eliminate(t, loser, "2ª", "RUNNER-UP");
      t = { ...t, track: { ...t.track, [p.winner!]: { ...(t.track[p.winner!] || {}), [s.ep]: "WINNER" } } };
      return { ...t, champion: p.winner, phase: "corona", deadline: 0, v: s.v + 1 };
    }
    default:
      return s;
  }
}

/** Una vuelta del reloj de la anfitriona: avanza si se acabó el tiempo o ya han entregado todas. */
export function tick(s: RoomState, now: number, e: Engine): RoomState {
  if (s.phase === "lobby" || s.phase === "corona" || s.pause || s.paused) return s;
  if ((s.deadline > 0 && now >= s.deadline) || allIn(s)) return advance(s, now, e);
  return s;
}

/** Aplica una entrega de una jugadora (solo cuenta la de la fase y episodio actuales). */
export function applySubmit(s: RoomState, pid: string, ep: number, phase: Phase, data: Sub): RoomState {
  if (ep !== s.ep || phase !== s.phase) return s;
  const p = s.players.find((x) => x.id === pid);
  // Las eliminadas solo juegan su monólogo de la Segunda Oportunidrag
  if (!p || (!p.alive && !(rpPlayers(s).includes(pid) && (phase === "reto" || phase === "pasarela")))) return s;
  return { ...s, subs: { ...s.subs, [pid]: { ...(s.subs[pid] || {}), ...data } }, v: s.v + 1 };
}

// ------------------------------ Pantallas que lleva la anfitriona ------------------------------
/** Pone el guion de la pantalla actual (si ya lo tiene, no lo toca). */
export function setScript(s: RoomState, key: string, lines: [string, string][]): RoomState {
  if (s.script && s.script.key === key) return s;
  return { ...s, script: { key, lines, i: 0 }, v: s.v + 1 };
}
/** La anfitriona pulsa «seguir»: siguiente línea; al acabar el guion, la tarjeta; desde la tarjeta, la fase siguiente. */
export function hostNext(s: RoomState, now: number, e: Engine): RoomState {
  if (!isWatch(s.phase)) return s;
  if (s.script && s.script.i < s.script.lines.length) return { ...s, script: { ...s.script, i: s.script.i + 1 }, v: s.v + 1 };
  // La corona es la última pantalla: se leen las frases, pero no hay fase siguiente
  if (s.phase === "corona") return s;
  return advance(s, now, e);
}

// ------------------------------ Pausa con acuerdo de todas ------------------------------
/** Quiénes tienen que votar: todas las de la sala (también las eliminadas, que siguen mirando). */
export const voters = (s: RoomState) => s.players.map((p) => p.id);
export function proposePause(s: RoomState, by: string, now: number): RoomState {
  if (s.phase === "lobby" || s.phase === "corona" || s.pause || s.paused) return s;
  return { ...s, pause: { by, votes: { [by]: true }, at: now }, v: s.v + 1 };
}
/** Voto: con un no se cancela; con el sí de todas, la partida queda pausada (cada una la guarda y sale). */
export function votePause(s: RoomState, id: string, yes: boolean, now: number): RoomState {
  if (!s.pause) return s;
  if (!yes) return { ...s, pause: undefined, deadline: s.deadline ? s.deadline + (now - s.pause.at) : 0, note: s.note, v: s.v + 1 };
  const votes = { ...s.pause.votes, [id]: true };
  if (voters(s).every((p) => votes[p])) return { ...s, pause: undefined, paused: true, deadline: s.deadline ? s.deadline - s.pause.at : 0, v: s.v + 1 };
  return { ...s, pause: { ...s.pause, votes }, v: s.v + 1 };
}
/** Reanudar una partida guardada: quien la abre lleva la sala; el reloj de la fase se recoloca. */
export function resumeRoom(s: RoomState, host: string, now: number): RoomState {
  // Al pausar se guardó lo que le quedaba a la fase (en ms); si no tenía reloj, sigue sin él
  const left = s.deadline > 0 ? Math.max(15000, s.deadline) : 0;
  return { ...s, host, paused: false, pause: undefined, deadline: left ? now + left : 0, v: s.v + 1 };
}
