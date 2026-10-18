// Temporada en directo: estado de la sala y reglas (puro, sin DOM ni red; con tests).
// La anfitriona aplica estas funciones y reparte el estado; el resto lo pinta.

export type Phase = "lobby" | "anuncio" | "reto" | "pasarela" | "resultados" | "untucked" | "veredicto" | "lipsync" | "track" | "final" | "corona";
export type Ritmo = "normal" | "rapido" | "libre";

/** Segundos por fase. La suma de un episodio es el tope de tiempo del episodio. */
export const DURACION: Record<Ritmo, Record<Exclude<Phase, "lobby" | "corona">, number>> = {
  normal: { anuncio: 10, reto: 240, pasarela: 150, resultados: 30, untucked: 60, veredicto: 12, lipsync: 120, track: 15, final: 120 },
  rapido: { anuncio: 8, reto: 170, pasarela: 110, resultados: 20, untucked: 40, veredicto: 10, lipsync: 90, track: 10, final: 90 },
  // Sin límite: lo que se juega (reto, pasarela, lip syncs) espera a que entreguen todas; lo que se mira sigue solo
  libre: { anuncio: 10, reto: 0, pasarela: 0, resultados: 30, untucked: 60, veredicto: 12, lipsync: 0, track: 15, final: 0 },
};
/** Momento tope de una fase; 0 = sin tope (se espera a que entreguen todas). */
export const limite = (now: number, secs: number) => (secs > 0 ? now + secs * 1000 : 0);
export const topeEpisodio = (r: Ritmo) => {
  const d = DURACION[r];
  return d.anuncio + d.reto + d.pasarela + d.resultados + d.untucked + d.veredicto + d.lipsync + d.track;
};
/** Nota de quien no entrega a tiempo. */
export const NO_PRESENTO = 30;

export interface Player { id: string; name: string; queen: string | null; joined: number; alive: boolean }
export interface Row { key: string; score: number; label: string }
export interface Pair { a: string; b: string; winner?: string }
export interface Sub { reto?: number; final?: number; ls?: { won: boolean; score: number } }
export interface Reto { tipo: string; titulo: string; desc: string; noRunway: boolean; cat?: { n: string; d: string } }
export interface RoomState {
  v: number;
  code: string;
  host: string;
  season: string;
  ritmo: Ritmo;
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

export function newRoom(code: string, host: Player, season: string, ritmo: Ritmo): RoomState {
  return { v: 1, code, host: host.id, season, ritmo, players: [host], npcs: [], out: [], ep: 0, phase: "lobby", deadline: 0, used: [], subs: {}, track: {}, epNames: {} };
}

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
  return { ...s, ep, reto: r, used: [...s.used, r.tipo], subs: {}, rows: undefined, crit: undefined, pairs: undefined, note: undefined, epNames: { ...s.epNames, [ep]: r.titulo }, phase: "anuncio", deadline: limite(now, DURACION[s.ritmo].anuncio), v: s.v + 1 };
}

/** ¿Han entregado ya todas las que tienen que entregar en esta fase? (para no esperar al tope) */
export function allIn(s: RoomState): boolean {
  const ps = alivePlayers(s);
  if (s.phase === "reto") return ps.every((p) => s.subs[p.id]?.reto != null || s.subs[p.id]?.final != null);
  if (s.phase === "pasarela") return ps.every((p) => s.subs[p.id]?.final != null);
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
    r.label = i === 0 ? "WIN" : i >= n - 2 ? "BTM2" : i <= (n <= 7 ? 1 : 2) ? "HIGH" : i >= n - 3 ? "LOW" : "SAFE";
  });
  const allCrit = n <= 6;
  const crit = rows
    .filter((r) => allCrit || r.label !== "SAFE")
    .map((r) => {
      const level = r.label === "WIN" || r.label === "HIGH" ? "top" : r.label === "SAFE" ? "mid" : "low";
      const nm = isP(r.key) ? e.queenName(queenOfKey(s, r.key)) : e.queenName(idOf(r.key));
      return { key: r.key, lines: e.critique(tipo, level, nm) };
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

/** Siembra de la final por PPE (1 contra 4, 2 contra 3). */
function seeds(s: RoomState): string[] {
  const V: Record<string, number> = { WIN: 5, HIGH: 4, SAFE: 3, LOW: 2, BTM2: 1 };
  const ppe = (k: string) => { const v = Object.values(s.track[k] || {}).map((l) => V[l]).filter((x) => x != null); return v.length ? v.reduce((a, b) => a + b, 0) / v.length : 0; };
  return aliveKeys(s).sort((a, b) => ppe(b) - ppe(a));
}

/** Pasa a la siguiente fase. */
export function advance(s: RoomState, now: number, e: Engine): RoomState {
  const D = DURACION[s.ritmo];
  const at = (phase: Phase, secs: number, extra: Partial<RoomState> = {}): RoomState => ({ ...s, ...extra, phase, deadline: limite(now, secs), v: s.v + 1 });
  switch (s.phase) {
    case "anuncio":
      return at("reto", D.reto);
    case "reto":
      if (!s.reto!.noRunway) return at("pasarela", D.pasarela);
    // falls through: sin pasarela aparte, directo a resultados
    case "pasarela": {
      const scored = scoreWeek(s, e);
      return { ...scored, phase: "resultados", deadline: limite(now, D.resultados), v: s.v + 1 };
    }
    case "resultados":
      return at("untucked", D.untucked);
    case "untucked":
      return at("veredicto", D.veredicto, { track: writeTrack(s, s.rows || []) });
    case "veredicto": {
      const rows = s.rows || [];
      const btm = rows.filter((r) => r.label === "BTM2").map((r) => r.key);
      const pairs: Pair[] = btm.length === 2 ? [{ a: btm[0], b: btm[1] }] : [];
      const next = { ...s, pairs, subs: Object.fromEntries(Object.entries(s.subs).map(([k, v]) => [k, { ...v, ls: undefined }])) };
      // Si no hay jugadoras en el lip sync, se resuelve solo
      if (!pairs.some((p) => isP(p.a) || isP(p.b))) return { ...next, phase: "lipsync", deadline: now + 6000, v: s.v + 1 };
      return { ...next, phase: "lipsync", deadline: limite(now, D.lipsync), v: s.v + 1 };
    }
    case "lipsync": {
      const pairs = resolvePairs(s, e);
      let t: RoomState = { ...s, pairs };
      pairs.forEach((p) => {
        const loser = p.winner === p.a ? p.b : p.a;
        t = eliminate(t, loser, `${aliveKeys(t).length}º`);
      });
      const nm = (k: string) => nameOfKey(t, k, e);
      const note = pairs.map((p) => `${nm(p.winner!)} se queda. ${nm(p.winner === p.a ? p.b : p.a)} se va a casa.`).join(" ");
      return { ...t, note, phase: "track", deadline: limite(now, D.track), v: s.v + 1 };
    }
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
