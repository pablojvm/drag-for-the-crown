// Temporada del motor nuevo: reglas puras de una temporada regular (reto, pasarela, resultados, lip sync, final).
// Usa las mismas piezas que el modo historia: el dado, las etiquetas de la semana, el track record y el lip sync simulado.
import { BALANCE } from "./balance";
import { tirarDado, notaDe, pasosDeJuego, clamp } from "./dado";
import { bottomSize, weekLabels } from "./week";
import { ppe } from "./track";
import { TEMPORADAS_ES, REINAS_ES, queenStats, baseAttrs, type Attrs, type QAttr } from "./reinas";
import { TEMAS_PASARELA } from "./temas";
import { MAXI } from "./maxi";
import { JURADO } from "./textos";

export const ME = "me";
export type Phase = "anuncio" | "reto" | "pasarela" | "resultados" | "lipsync" | "veredicto" | "final" | "fin";
export interface Week {
  tipo: string;
  titulo: string;
  tema: string;
  reto?: number;
  runway?: number;
  /** Clasificación de la semana (de mejor a peor) con la nota de cada una. */
  rows?: { key: string; s: number }[];
  labels?: Record<string, string>;
  bottom?: string[];
  /** Quién gana el lip sync y quién se va. */
  saved?: string;
  out?: string;
}
export interface FinalState { pairs: [string, string][]; semis: string[]; crown?: string; runnerUp?: string }
export interface Season {
  v: 1;
  seasonId: string;
  queen: string;
  seed: number;
  ep: number;
  phase: Phase;
  /** Las que siguen en competición (claves: "me" para la jugadora, el id para las demás). */
  alive: string[];
  out: string[];
  track: Record<string, string[]>;
  record: Record<string, number>;
  form: Record<string, number>;
  rel: Record<string, number>;
  plan: string[];
  temas: string[];
  week: Week | null;
  final: FinalState | null;
  /** Puesto final de la jugadora (1 = ganadora). */
  place?: number;
}

const shuffle = <T,>(a: T[], rnd: () => number) => a.map((v) => [rnd(), v] as const).sort((x, y) => x[0] - y[0]).map((x) => x[1]);
export const FINAL_AT = 4;

export const seasonById = (id: string) => TEMPORADAS_ES.find((t) => t.id === id) || null;
/** Temporadas regulares que se pueden jugar en el motor nuevo. */
export const playableSeasons = () => TEMPORADAS_ES.filter((t) => t.franchise === "es" && t.cast.length >= FINAL_AT + 2);
export const nameOf = (s: Season, key: string) => REINAS_ES[key === ME ? s.queen : key]?.name || key;
export const idOf = (s: Season, key: string) => (key === ME ? s.queen : key);
export const attrsOf = (s: Season, key: string): Attrs => baseAttrs(idOf(s, key), queenStats(idOf(s, key)));
const seasonIndex = (s: Season) => Math.max(0, TEMPORADAS_ES.findIndex((t) => t.id === s.seasonId));
const seasonBoost = (s: Season) => Math.min(BALANCE.temporada.subidaMax, seasonIndex(s) * BALANCE.temporada.subidaPorTemporada);

export function newSeason(seasonId: string, queen: string, seed: number, rnd: () => number): Season {
  const t = seasonById(seasonId)!;
  const rivals = t.cast.filter((id) => id !== queen);
  const plan = shuffle(Object.keys(MAXI), rnd);
  const temas = shuffle(TEMAS_PASARELA.filter((x) => !x.rv).map((x) => x.n), rnd);
  return { v: 1, seasonId, queen, seed, ep: 0, phase: "anuncio", alive: [ME, ...rivals], out: [], track: {}, record: {}, form: {}, rel: {}, plan, temas, week: null, final: null };
}

/** Empieza la semana siguiente (o la final si quedan cuatro). */
export function nextWeek(s: Season, rnd: () => number): Season {
  const ep = s.ep + 1;
  if (s.alive.length <= FINAL_AT) {
    const order = shuffle(s.alive, rnd);
    return { ...s, ep, phase: "final", week: null, final: { pairs: [[order[0], order[1]], [order[2], order[3]]], semis: [] } };
  }
  const tipo = s.plan[(ep - 1) % s.plan.length];
  return { ...s, ep, phase: "anuncio", week: { tipo, titulo: MAXI[tipo].titulo, tema: s.temas[(ep - 1) % s.temas.length] } };
}

/** Lo que cuenta en el reto: los atributos que pide, con el estilo por la pasarela. */
export function retoAttr(a: Attrs, keys: QAttr[]) {
  const v = keys.reduce((t, k) => t + a[k], 0) / keys.length;
  return v * 0.7 + a.estilo * 0.3;
}
/** Nota de una rival: su dado de la semana. */
export function rivalScore(s: Season, key: string, rnd: () => number) {
  const extra = seasonBoost(s) / 5 + clamp(s.form[key] || 0, -8, 8) / 6;
  return clamp(notaDe(tirarDado(retoAttr(attrsOf(s, key), MAXI[s.week!.tipo].attrs) + extra, rnd), rnd()), 5, 99);
}
/** Tu nota: reto (65 %) y pasarela (35 %); tu juego mueve tu dado, pero no lo asegura. */
export function myScore(s: Season, rnd: () => number) {
  const w = s.week!;
  const played = clamp((w.reto ?? 50) * 0.65 + (w.runway ?? 50) * 0.35 + relBonus(s), 0, 100);
  const steps = pasosDeJuego(played, rnd);
  const a = retoAttr(attrsOf(s, ME), MAXI[w.tipo].attrs) + seasonBoost(s) / 10;
  const cat = clamp(tirarDado(a, rnd) - steps, 0, 4);
  return notaDe(cat, 0.35 + clamp((played - 40) / 60, 0, 1) * 0.65);
}
/** Aliadas suman y enemigas restan (como en el modo historia). */
export const relBonus = (s: Season) => {
  const v = Object.values(s.rel);
  return clamp(v.filter((x) => x >= 2).length * 4 - v.filter((x) => x <= -2).length * 4, -10, 12);
};

/** Resultados de la semana: clasificación, etiquetas y bottom. */
export function scoreWeek(s: Season, rnd: () => number): Season {
  const w = s.week!;
  const rows = s.alive.map((key) => ({ key, s: key === ME ? myScore(s, rnd) : rivalScore(s, key, rnd) })).sort((a, b) => b.s - a.s);
  const nb = bottomSize({ twist: "normal", n: rows.length });
  const bottom = rows.slice(rows.length - nb).map((r) => r.key);
  const labs = weekLabels(rows.map((r) => ({ key: r.key })), { twist: "normal", nb, bottom });
  const labels = Object.fromEntries(rows.map((r, i) => [r.key, labs[i]]));
  const record = { ...s.record }, form = { ...s.form };
  rows.forEach((r, i) => {
    record[r.key] = (record[r.key] || 0) + (i === 0 ? 3 : bottom.includes(r.key) ? 0 : 1);
    if (r.key !== ME) form[r.key] = clamp(Math.round((form[r.key] || 0) * 0.8) + (i === 0 ? 2 : bottom.includes(r.key) ? -1 : 0) + Math.floor(rnd() * 3) - 1, -8, 8);
  });
  return { ...s, phase: "resultados", record, form, week: { ...w, rows, labels, bottom } };
}

/** Fuerza en un lip sync simulado: nivel, racha y track record. */
export function lsPower(s: Season, key: string) {
  const L = BALANCE.lipSync;
  const st = queenStats(idOf(s, key));
  return 40 + (st.speed + st.rate + st.power + st.lives) * 2 + (s.record[key] || 0) * L.porRecord + (s.form[key] || 0);
}
/** Lip sync entre dos (devuelve [gana, pierde]). */
export function simLipSync(s: Season, a: string, b: string, rnd: () => number): [string, string] {
  const L = BALANCE.lipSync;
  return rnd() < clamp(0.5 + (lsPower(s, a) - lsPower(s, b)) / L.escala, L.min, L.max) ? [a, b] : [b, a];
}

/** Cierra la semana con el resultado del lip sync. */
export function settleWeek(s: Season, saved: string, out: string): Season {
  const w = s.week!;
  const track = { ...s.track };
  s.alive.forEach((k) => (track[k] = [...(track[k] || []), k === out ? "ELIM" : w.labels![k]]));
  const alive = s.alive.filter((k) => k !== out);
  const place = out === ME ? alive.length + 1 : s.place;
  return { ...s, phase: out === ME ? "fin" : "veredicto", alive, out: [...s.out, out], track, place, week: { ...w, saved, out } };
}

/** Final: dos lip syncs y las ganadoras se enfrentan por la corona. */
export function settleSemi(s: Season, winner: string): Season {
  const f = s.final!;
  const semis = [...f.semis, winner];
  return { ...s, final: { ...f, semis } };
}
export function crown(s: Season, winner: string): Season {
  const f = s.final!;
  const runnerUp = f.semis.find((k) => k !== winner)!;
  const track = { ...s.track };
  s.alive.forEach((k) => (track[k] = [...(track[k] || []), k === winner ? "WINNER" : k === runnerUp ? "RUNNER-UP" : "ELIM"]));
  const place = winner === ME ? 1 : runnerUp === ME ? 2 : s.place ?? 3;
  return { ...s, phase: "fin", track, place, final: { ...f, crown: winner, runnerUp } };
}

/** Críticas del jurado para una reina, según su resultado. */
export function critique(s: Season, key: string, pick: <T>(a: T[]) => T): string[] {
  const w = s.week!;
  const lab = w.labels![key];
  const nivel = lab === "WIN" || lab === "HIGH" ? "top" : lab === "LOW" || /^BTM/.test(lab) ? "low" : "mid";
  const R = JURADO.reto as Record<string, Record<string, string[]>>;
  const yo = key === ME ? nameOf(s, ME) : nameOf(s, key);
  const reto = (R[w.tipo] || R.pasarela)[nivel];
  return [pick(reto), pick(JURADO.pasarela[nivel as "top"])].map((t) => t.replace(/\{yo\}/g, yo));
}

/** PPE de la jugadora en la temporada. */
export const myPpe = (s: Season) => ppe((s.track[ME] || []).filter((l) => l !== "RUNNER-UP" && l !== "WINNER"));
