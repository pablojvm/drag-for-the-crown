// Lalaparuza: torneo de lip syncs con todo el reparto (cuadro con cabezas de serie y ronda previa).
// La nota de cada una sale de hasta dónde llega (regla compartida con el multijugador: lalaScore).
import { buildBracket } from "./bracket";
import { lalaScore } from "./finales";

export interface LzMatch { a: string | null; b: string | null; slot?: number; w?: string }
export interface Lala { rounds: LzMatch[][]; R: number; round: number; stop: number; reached: Record<string, number>; done?: boolean; champ?: string; top2?: string[] }

/** Monta el cuadro a partir de la clasificación (mejor primero). `toTop2`: en All Stars y All Winners se para en la semifinal. */
export function lalaStart(ranked: string[], toTop2 = false): Lala {
  const { P, R, slots, pre } = buildBracket(ranked);
  const rounds: LzMatch[][] = [pre.map((m) => ({ a: m.a, b: m.b, slot: m.slot }))];
  for (let r = 0; r < R; r++) rounds.push(Array.from({ length: P / 2 ** (r + 1) }, (_, i) => (r === 0 ? { a: slots[2 * i], b: slots[2 * i + 1] } : { a: null, b: null })));
  return { rounds, R, round: pre.length ? 0 : 1, stop: toTop2 ? R - 1 : R, reached: {} };
}
/** Duelos que faltan por resolver en la ronda actual. */
export const lalaPending = (L: Lala) => (L.done ? [] : L.rounds[L.round].filter((m) => m.a && m.b && !m.w));
/** Resuelve un duelo; si la ronda termina, avanza (y al final cierra el torneo). */
export function lalaResolve(L0: Lala, a: string, b: string, winner: string): Lala {
  const L: Lala = { ...L0, rounds: L0.rounds.map((rs) => rs.map((m) => ({ ...m }))), reached: { ...L0.reached } };
  const r = L.round;
  const i = L.rounds[r].findIndex((m) => m.a === a && m.b === b && !m.w);
  if (i < 0) return L0;
  const m = L.rounds[r][i];
  m.w = winner;
  L.reached[winner === a ? b : a] = r;
  if (r === 0) { const t = L.rounds[1][Math.floor(m.slot! / 2)]; if (m.slot! % 2 === 0) t.a = winner; else t.b = winner; }
  else if (r < L.R) { const nx = L.rounds[r + 1][Math.floor(i / 2)]; if (i % 2 === 0) nx.a = winner; else nx.b = winner; }
  if (lalaPending(L).length) return L;
  if (r < L.stop) return { ...L, round: r + 1 };
  const last = L.rounds[r].map((x) => x.w!).filter(Boolean);
  last.forEach((k) => (L.reached[k] = L.R + 1));
  return { ...L, done: true, champ: r === L.R ? last[0] : undefined, top2: r === L.R ? undefined : last };
}
/** Notas del torneo (la campeona arriba, las que caen pronto abajo). `tweak` de -50 a 50 matiza. */
export function lalaScores(L: Lala, keys: string[], tweak: (k: string) => number): Record<string, number> {
  return Object.fromEntries(keys.map((k) => [k, lalaScore({ reached: L.reached[k] ?? 0, R: L.R, champ: k === L.champ, top2: !!L.top2?.includes(k), tweak: tweak(k) * 0.08 })]));
}
