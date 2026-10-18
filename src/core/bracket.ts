// Cuadro de eliminatorias (Lalaparuza): cabezas de serie y ronda previa
/** Orden clásico de cabezas de serie: la 1 contra la última, y la 1 y la 2 en lados distintos. */
export function seedOrder(n: number): number[] {
  let o = [1];
  while (o.length < n) {
    const m = o.length * 2 + 1;
    o = o.flatMap((s) => [s, m - s]);
  }
  return o;
}

export interface PreMatch<T> { a: T; b: T; slot: number }
export interface Bracket<T> { P: number; R: number; direct: T[]; preQ: T[]; slots: (T | null)[]; pre: PreMatch<T>[] }

/**
 * Monta el cuadro a partir de una clasificación (mejor primero, p. ej. el minirreto).
 * Cuadro principal de P plazas (potencia de 2). Las que sobran juegan una ronda previa:
 * la mejor de las no clasificadas contra la peor, y la ganadora ocupa la plaza de cabeza de serie más baja.
 */
export function buildBracket<T>(ranked: T[]): Bracket<T> {
  const n = ranked.length;
  if (n < 2) throw new Error("Hacen falta al menos dos reinas");
  const P = 2 ** Math.floor(Math.log2(n));
  const R = Math.log2(P);
  const nPre = n - P;
  const direct = ranked.slice(0, P - nPre);
  const preQ = ranked.slice(P - nPre);
  const SO = seedOrder(P);
  const slots = SO.map((s) => (s <= direct.length ? direct[s - 1] : null));
  const pre = Array.from({ length: nPre }, (_, k) => ({ a: preQ[k], b: preQ[preQ.length - 1 - k], slot: SO.indexOf(direct.length + 1 + k) }));
  return { P, R, direct, preQ, slots, pre };
}
