// Lalaparuza, como en el programa: duelos de lip sync con todo el reparto. La que GANA su duelo queda a salvo
// y se va al camerino; las que pierden siguen luchando entre ellas ronda tras ronda. Las dos últimas que quedan
// son el bottom y se juegan la permanencia en el lip sync de eliminación (el de siempre, después de las críticas).
// Regla compartida por el modo historia, el multijugador y el motor nuevo.

export interface LzMatch { a: string | null; b: string | null; slot?: number; w?: string }
export interface Lala {
  /** Duelos de cada ronda (la ronda 1 es rounds[0]). */
  rounds: LzMatch[][];
  /** Ronda en juego (índice en `rounds`). */
  round: number;
  /** Quiénes siguen en peligro, de mejor a peor cabeza de serie. */
  pool: string[];
  /** La que descansa esta ronda (si son impares): sigue en peligro. */
  bye?: string;
  /** Ronda (1, 2...) en la que se salvó cada una. */
  saved: Record<string, number>;
  done?: boolean;
  /** Las dos que pierden todo: al lip sync de eliminación. */
  bottom?: string[];
  /** Ronda en la que se salvó cada una (0 = bottom). */
  reached: Record<string, number>;
  /** Número de rondas jugadas (al terminar). */
  R: number;
}

/** Cruces de una ronda: la mejor contra la peor que quedan; si son impares, descansa la del medio. */
export function lalaPairs(pool: string[]): { pairs: LzMatch[]; bye?: string } {
  const n = pool.length;
  const bye = n % 2 ? pool[(n - 1) / 2] : undefined;
  const rest = pool.filter((k) => k !== bye);
  const pairs: LzMatch[] = [];
  for (let i = 0; i < rest.length / 2; i++) pairs.push({ a: rest[i], b: rest[rest.length - 1 - i] });
  return { pairs, bye };
}

/** Empieza el torneo a partir de la clasificación (mejor primero). */
export function lalaStart(ranked: string[]): Lala {
  const { pairs, bye } = lalaPairs(ranked);
  return { rounds: [pairs], round: 0, pool: ranked.slice(), bye, saved: {}, reached: {}, R: 0 };
}
/** Duelos que faltan por resolver en la ronda actual. */
export const lalaPending = (L: Lala) => (L.done ? [] : L.rounds[L.round].filter((m) => m.a && m.b && !m.w));
/** Resuelve un duelo; si la ronda termina, pasa a la siguiente (o cierra con las dos del bottom). */
export function lalaResolve(L0: Lala, a: string, b: string, winner: string): Lala {
  const L: Lala = { ...L0, rounds: L0.rounds.map((rs) => rs.map((m) => ({ ...m }))), saved: { ...L0.saved }, reached: { ...L0.reached } };
  const i = L.rounds[L.round].findIndex((m) => m.a === a && m.b === b && !m.w);
  if (i < 0) return L0;
  L.rounds[L.round][i].w = winner;
  L.saved[winner] = L.round + 1;
  if (lalaPending(L).length) return L;
  return lalaEndRound(L);
}
/** Cierra la ronda: las ganadoras salen del peligro; si quedan dos o menos, son el bottom. */
export function lalaEndRound(L: Lala): Lala {
  const pool = L.pool.filter((k) => !L.saved[k]);
  if (pool.length <= 2) {
    const reached = { ...L.reached };
    Object.entries(L.saved).forEach(([k, r]) => (reached[k] = r));
    pool.forEach((k) => (reached[k] = 0));
    return { ...L, pool, bye: undefined, done: true, bottom: pool, reached, R: L.rounds.length };
  }
  const { pairs, bye } = lalaPairs(pool);
  return { ...L, pool, bye, rounds: [...L.rounds, pairs], round: L.round + 1 };
}
/** Nota: las que se salvan antes, arriba; las dos del bottom, abajo. `tweak` (-50 a 50) ordena dentro de cada ronda. */
export function lalaScoreDe(saved: number | undefined, tweak: number): number {
  const t = Math.max(-4, Math.min(4, tweak * 0.08));
  const base = saved ? 92 - (saved - 1) * 12 : 30;
  return Math.round(Math.max(0, Math.min(99, base + t)));
}
export function lalaScores(L: Lala, keys: string[], tweak: (k: string) => number): Record<string, number> {
  return Object.fromEntries(keys.map((k) => [k, lalaScoreDe(L.saved[k], tweak(k))]));
}
