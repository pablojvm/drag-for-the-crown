import { BALANCE } from "./balance";

export const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));

/** Probabilidades (en %) de brillante, buena, normal, floja y desastre para un atributo de 0 a 10. */
export function dadoProbs(attr: number, dado = BALANCE.dado): number[] {
  const t = clamp((attr - 2.5) / 7, 0, 1);
  const [A, B, u] = t < 0.5 ? [dado.low, dado.mid, t / 0.5] : [dado.mid, dado.high, (t - 0.5) / 0.5];
  return A.map((x, i) => x + (B[i] - x) * u);
}
/** Tira el dado: 0 = brillante ... 4 = desastre. */
export function tirarDado(attr: number, rnd: () => number = Math.random): number {
  const p = dadoProbs(attr);
  let r = rnd() * p.reduce((x, y) => x + y, 0);
  let i = 0;
  for (; i < 4; i++) {
    r -= p[i];
    if (r < 0) break;
  }
  return i;
}
/** Nota de 0 a 100 dentro de la franja de una categoría del dado. */
export function notaDe(cat: number, pos: number, notas = BALANCE.notas): number {
  const [lo, hi] = notas[clamp(cat, 0, 4)];
  return Math.round(lo + (hi - lo) * clamp(pos, 0, 1));
}
/** Escalones que mueve tu juego en el reto (positivo = mejor categoría). */
export function pasosDeJuego(played: number, rnd: () => number = Math.random, J = BALANCE.tuJuego): number {
  return played >= J.borda ? (rnd() < J.probDosEscalones ? 2 : 1) : played >= J.bien ? 1 : played >= J.normal ? 0 : played >= J.mal ? -1 : -2;
}

/** Tu nota del reto: lo que has jugado manda y el dado de tus atributos solo la matiza (como mucho −8 / +6),
 * para que la nota cuadre con lo que has visto («te sale», «¡corten, toma buena!»...). */
export function notaTuJuego(played: number, attr: number, rnd: () => number = Math.random, J = BALANCE.tuJuego): number {
  const steps = pasosDeJuego(played, rnd, J);
  const cat = clamp(tirarDado(attr, rnd) - steps, 0, 4);
  const d = notaDe(cat, 0.35 + clamp((played - 40) / 60, 0, 1) * 0.65);
  const p = Math.round(clamp(played, 0, 100));
  return clamp(d, Math.max(0, p - J.margenAbajo), Math.min(100, p + J.margenArriba));
}
