// Temporada en directo: estado de la sala y reglas (puro, sin DOM ni red; con tests).
// La anfitriona aplica estas funciones y reparte el estado; el resto lo pinta.

import { ppe } from "../core/track";

export type Phase = "lobby" | "anuncio" | "reto" | "pasarela" | "resultados" | "untucked" | "veredicto" | "decision" | "lipsync" | "pintalabios" | "track" | "final" | "corona";
export type Ritmo = "normal" | "rapido" | "libre";
/** Formato de la temporada: normal (las dos peores hacen lip sync) o All Stars (lip sync del top 2 y la ganadora elimina). */
export type Formato = "normal" | "allstars";

/** Segundos por fase. La suma de un episodio es el tope de tiempo del episodio. */
export const DURACION: Record<Ritmo, Record<Exclude<Phase, "lobby" | "corona">, number>> = {
  normal: { anuncio: 25, reto: 240, pasarela: 150, resultados: 30, untucked: 60, veredicto: 20, lipsync: 120, decision: 45, pintalabios: 14, track: 20, final: 120 },
  rapido: { anuncio: 18, reto: 170, pasarela: 110, resultados: 20, untucked: 40, veredicto: 16, lipsync: 90, decision: 30, pintalabios: 12, track: 14, final: 90 },
  // Sin límite: lo que se juega (reto, pasarela, lip syncs, decidir) espera a que entreguen todas; lo que se mira sigue solo
  libre: { anuncio: 25, reto: 0, pasarela: 0, resultados: 30, untucked: 60, veredicto: 20, lipsync: 0, decision: 0, pintalabios: 14, track: 20, final: 0 },
};
/** Con IA (frases escritas) el reto dura más: escribir lleva tiempo. */
export const IA_EXTRA = 1.75;
/** Segundos que se tarda en leer las críticas de cada reina. */
export const POR_CRITICA = 7;
/** Momento tope de una fase; 0 = sin tope (se espera a que entreguen todas). */
export const limite = (now: number, secs: number) => (secs > 0 ? now + secs * 1000 : 0);
export const topeEpisodio = (r: Ritmo) => {
  const d = DURACION[r];
  return d.anuncio + d.reto + d.pasarela + d.resultados + d.untucked + d.veredicto + d.lipsync + d.track;
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
export interface Sub { reto?: number; final?: number; ls?: { won: boolean; score: number }; elim?: string; jury?: string }
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
  finalStage?: number;
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
}

export const pkey = (pid: string) => "p:" + pid;
export const nkey = (qid: string) => "n:" + qid;
export const isP = (k: string) => k.startsWith("p:");
export const idOf = (k: string) => k.slice(2);

export function newRoom(code: string, host: Player, season: string, ritmo: Ritmo, opts: { fmt?: Formato; ia?: boolean } = {}): RoomState {
  return { v: 1, code, host: host.id, season, ritmo, fmt: opts.fmt || "normal", ia: !!opts.ia, players: [host], npcs: [], out: [], ep: 0, phase: "lobby", deadline: 0, used: [], subs: {}, track: {}, epNames: {} };
}
const isAS = (s: Pick<RoomState, "fmt">) => s.fmt === "allstars";

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
  return nextEpisode({ ...s, players, npcs: cast.filter((q) => !taken.has(q)), ep: 0 }, now, e);
}

function nextEpisode(s: RoomState, now: number, e: Engine): RoomState {
  const all = e.retos();
  let pool = all.filter((r) => !s.used.includes(r.tipo));
  if (!pool.length) pool = all;
  const r = { ...pool[Math.floor(e.rnd() * pool.length)] };
  if (!r.noRunway) { const cats = e.categorias(); r.cat = cats[Math.floor(e.rnd() * cats.length)]; }
  const ep = s.ep + 1;
  // El primer día se presenta la temporada: un poco más de tiempo para leerlo
  const secs = dur(s, "anuncio") + (ep === 1 ? 12 : 0);
  return { ...s, ep, reto: r, used: [...s.used, r.tipo], subs: {}, rows: undefined, crit: undefined, pairs: undefined, decision: undefined, note: undefined, reveal: s.reveal && s.reveal.ep === s.ep ? s.reveal : undefined, epNames: { ...s.epNames, [ep]: r.titulo }, phase: "anuncio", deadline: limite(now, secs), v: s.v + 1 };
}

/** ¿Han entregado ya todas las que tienen que entregar en esta fase? (para no esperar al tope) */
export function allIn(s: RoomState): boolean {
  const ps = alivePlayers(s);
  if (s.phase === "reto") return ps.every((p) => s.subs[p.id]?.reto != null || s.subs[p.id]?.final != null);
  if (s.phase === "pasarela") return ps.every((p) => s.subs[p.id]?.final != null);
  if (s.phase === "decision") {
    const d = s.decision;
    const ps = (d?.top || []).filter(isP);
    if (!d || !ps.length) return false; // si eligen reinas del juego, se espera al tope (se ve el momento)
    return ps.every((k) => s.subs[idOf(k)]?.elim != null);
  }
  if (s.phase === "lipsync" || s.phase === "final") {
    const inPairs = (s.pairs || []).flatMap((x) => [x.a, x.b]).filter(isP).map(idOf);
    return inPairs.every((id) => s.subs[id]?.ls != null);
  }
  return false;
}

/** Notas, etiquetas y críticas de la semana. */
export function scoreWeek(s: RoomState, e: Engine): RoomState {
  const tipo = s.reto!.tipo;
  const rows: Row[] = aliveKeys(s).map((k) => ({ key: k, score: isP(k) ? s.subs[idOf(k)]?.final ?? NO_PRESENTO : e.rivalScore(idOf(k), tipo), label: "" }));
  rows.sort((a, b) => b.score - a.score || (e.rnd() < 0.5 ? -1 : 1));
  const n = rows.length;
  rows.forEach((r, i) => {
    // All Stars: las dos mejores van al top 2 (lip sync por el poder); la ganadora sale de ese lip sync
    if (isAS(s)) r.label = i <= 1 ? "TOP2" : i >= n - 2 ? "BTM2" : i <= (n <= 7 ? 2 : 3) ? "HIGH" : i >= n - 3 ? "LOW" : "SAFE";
    else r.label = i === 0 ? "WIN" : i >= n - 2 ? "BTM2" : i <= (n <= 7 ? 1 : 2) ? "HIGH" : i >= n - 3 ? "LOW" : "SAFE";
  });
  const allCrit = n <= 6;
  const crit = rows
    .filter((r) => allCrit || r.label !== "SAFE")
    .map((r) => {
      const level = r.label === "WIN" || r.label === "TOP2" || r.label === "HIGH" ? "top" : r.label === "SAFE" ? "mid" : "low";
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

function eliminate(s: RoomState, key: string, place: string, label = "ELIM"): RoomState {
  const players = s.players.map((p) => (pkey(p.id) === key ? { ...p, alive: false } : p));
  const npcs = s.npcs.filter((q) => nkey(q) !== key);
  const track = { ...s.track, [key]: { ...(s.track[key] || {}), [s.ep]: label } };
  return { ...s, players, npcs, track, out: [...s.out, { key, ep: s.ep, place }] };
}

// ------------------------------ Track record ------------------------------
const labelsOf = (s: RoomState, k: string) => Object.values(s.track[k] || {});
export const ppeOf = (s: RoomState, k: string) => ppe(labelsOf(s, k));
export const winsOf = (s: RoomState, k: string) => labelsOf(s, k).filter((l) => l === "WIN" || l === "WINNER").length;
/** Orden del último episodio con resultados (como en el modo historia). */
const ORDER: Record<string, number> = { WINNER: 0, WIN: 1, "RUNNER-UP": 2, TOP2: 3, HIGH: 4, "3ª": 5, SAFE: 6, LOW: 7, BTM2: 8, ELIM: 9 };
/** Clasificación para el track record: arriba las que siguen (por su última semana y su temporada); debajo las eliminadas, de la última a la primera. */
export function standings(s: RoomState): { key: string; place: string; out: boolean }[] {
  const eps = Object.keys(s.epNames).map(Number).sort((a, b) => a - b);
  const outKeys = s.out.map((o) => o.key);
  const alive = aliveKeys(s).filter((k) => !outKeys.includes(k));
  const lastScored = [...eps].reverse().find((e) => alive.some((k) => ORDER[(s.track[k] || {})[e]] !== undefined));
  const last = (k: string) => { const l = lastScored != null ? (s.track[k] || {})[lastScored] : undefined; return l && ORDER[l] !== undefined ? ORDER[l] : 7.5; };
  const count = (k: string, re: RegExp) => labelsOf(s, k).filter((l) => re.test(l)).length;
  const top = alive.slice().sort((a, b) => (s.champion === b ? 1 : 0) - (s.champion === a ? 1 : 0) || last(a) - last(b) || ppeOf(s, b) - ppeOf(s, a) || count(b, /^WIN/) - count(a, /^WIN/) || count(a, /^BTM/) - count(b, /^BTM/));
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

/** Siembra de la final por PPE (1 contra 4, 2 contra 3). */
function seeds(s: RoomState): string[] {
  return aliveKeys(s).sort((a, b) => ppeOf(s, b) - ppeOf(s, a) || winsOf(s, b) - winsOf(s, a));
}

/** Pasa a la siguiente fase. */
export function advance(s: RoomState, now: number, e: Engine): RoomState {
  const D = DURACION[s.ritmo];
  const at = (phase: Phase, secs: number, extra: Partial<RoomState> = {}): RoomState => ({ ...s, ...extra, phase, deadline: limite(now, secs), v: s.v + 1 });
  switch (s.phase) {
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
      // All Stars: lip sync del top 2 (por el poder); normal: las dos peores, por quedarse
      const who = rows.filter((r) => r.label === (isAS(s) ? "TOP2" : "BTM2")).map((r) => r.key);
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
      const pairs = resolvePairs(s, e);
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
        t = eliminate(t, go, `${aliveKeys(t).length}º`);
        const nm = (k: string) => nameOfKey(t, k, e);
        const why = kind === "semana" ? "la peor de la semana" : kind === "trayectoria" ? "ha mirado toda la temporada" : "jugarreta: se quita a una rival fuerte";
        const reveal: Reveal | undefined = d.picks[loser] ? { ep: s.ep, by: loser, go: d.picks[loser], went: go } : undefined;
        return { ...t, decision: { ...d, by: p.winner, go, kind }, reveal, note: `${nm(p.winner)} saca su pintalabios: ${nm(go)} se va a casa (${why}). ${nm(stay)} se queda.`, phase: "pintalabios", deadline: now + D.pintalabios * 1000, v: s.v + 1 };
      }
      let t: RoomState = { ...s, pairs };
      pairs.forEach((p) => {
        const loser = p.winner === p.a ? p.b : p.a;
        t = eliminate(t, loser, `${aliveKeys(t).length}º`);
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
    case "track": {
      if (aliveKeys(s).length > 4) return nextEpisode(s, now, e);
      // Gran final: lip syncs eliminatorios entre las cuatro (o tres) últimas
      const sd = seeds(s);
      const ep = s.ep + 1;
      const pairs: Pair[] = sd.length >= 4 ? [{ a: sd[0], b: sd[3] }, { a: sd[1], b: sd[2] }] : sd.length === 3 ? [{ a: sd[1], b: sd[2] }] : [{ a: sd[0], b: sd[1] }];
      const bye = sd.length === 3 ? sd[0] : undefined;
      return { ...s, ep, epNames: { ...s.epNames, [ep]: "Gran final" }, reto: undefined, rows: undefined, crit: undefined, pairs, finalStage: sd.length === 2 ? 2 : 1, note: bye ? `${nameOfKey(s, bye, e)} pasa directa a la final.` : undefined, subs: {}, phase: "final", deadline: limite(now, D.final), v: s.v + 1 };
    }
    case "final": {
      const pairs = resolvePairs(s, e);
      let t: RoomState = { ...s, pairs };
      if (s.finalStage === 1) {
        const winners = pairs.map((p) => p.winner!);
        const losers = pairs.map((p) => (p.winner === p.a ? p.b : p.a));
        const place = losers.length === 2 ? "3ª/4ª" : "3ª";
        losers.forEach((l) => (t = eliminate(t, l, place, "3ª")));
        const fin = aliveKeys(t).filter((k) => !winners.includes(k)).concat(winners);
        const pair: Pair = { a: fin[0], b: fin[1] };
        return { ...t, pairs: [pair], finalStage: 2, subs: {}, note: `${winners.map((k) => nameOfKey(t, k, e)).join(" y ")} pasan a la final.`, phase: "final", deadline: limite(now, D.final), v: s.v + 1 };
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
  if (s.phase === "lobby" || s.phase === "corona") return s;
  if ((s.deadline > 0 && now >= s.deadline) || allIn(s)) return advance(s, now, e);
  return s;
}

/** Aplica una entrega de una jugadora (solo cuenta la de la fase y episodio actuales). */
export function applySubmit(s: RoomState, pid: string, ep: number, phase: Phase, data: Sub): RoomState {
  if (ep !== s.ep || phase !== s.phase) return s;
  const p = s.players.find((x) => x.id === pid);
  if (!p || !p.alive) return s;
  return { ...s, subs: { ...s.subs, [pid]: { ...(s.subs[pid] || {}), ...data } }, v: s.v + 1 };
}
