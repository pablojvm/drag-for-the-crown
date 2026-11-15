// All Stars por brackets (como el All Stars 10 y 11) con alianzas por parejas dentro de cada bracket.
// Regla compartida por el modo historia y el multijugador.
// - Tres brackets que compiten por separado. Nadie se va: el top 2 de cada semana hace lip sync por la victoria
//   y cada resultado da puntos (WIN 10, TOP2 9, HIGH 8, SAFE 5, LOW 2).
// - Dentro de cada bracket, las reinas se alían por parejas, mejor si se complementan (lo que a una le falta, a la
//   otra le sobra). Se valora en pareja (la nota de las dos se acerca a la media), salvo que una haya hundido a la
//   otra: entonces se juzga a cada una por separado.
// - Las alianzas pueden cambiar cada semana, por interés.
// - Al acabar los brackets pasan las dos con más puntos de cada uno y vuelve la mejor de las demás. Desde ahí,
//   cada una por su cuenta, con las reglas de siempre.

export const BRACKET_PTS: Record<string, number> = { WIN: 10, TOP2: 9, HIGH: 8, SAFE: 5, LOW: 2, BTM2: 1, ELIM: 0 };
export const BRACKET_NOMBRES = ["Rosa", "Naranja", "Morado"];
/** Semanas que compite cada bracket. */
export const BRACKET_SEMANAS = 3;
/** Diferencia de nota a partir de la cual una ha hundido a su pareja y se juzga por separado. */
export const HUNDIDA = 15;

/** Reparte en tres brackets (lo más iguales posible). La primera clave va siempre al primero. */
export function repartirBrackets(keys: string[], rnd: () => number, primera?: string): string[][] {
  const rest = keys.filter((k) => k !== primera).map((k) => [rnd(), k] as const).sort((a, b) => a[0] - b[0]).map((x) => x[1]);
  const all = primera ? [primera, ...rest] : rest;
  const n = all.length, base = Math.floor(n / 3), extra = n % 3;
  const out: string[][] = [];
  let i = 0;
  for (let g = 0; g < 3; g++) { const size = base + (g < extra ? 1 : 0); out.push(all.slice(i, i + size)); i += size; }
  return out;
}
/** Puntos de una reina en unas semanas, según su track record. */
export const puntos = (track: Record<number, string> | undefined, eps: number[]) => eps.reduce((t, e) => t + (BRACKET_PTS[(track || {})[e]] || 0), 0);
/** Clasificación de un bracket: más puntos; si empatan, más victorias; si no, al azar. */
export function clasificacion(keys: string[], trackOf: (k: string) => Record<number, string> | undefined, eps: number[], rnd: () => number) {
  const wins = (k: string) => eps.filter((e) => /WIN/.test((trackOf(k) || {})[e] || "")).length;
  return keys.map((k) => ({ k, p: puntos(trackOf(k), eps), w: wins(k), r: rnd() })).sort((a, b) => b.p - a.p || b.w - a.w || a.r - b.r);
}

/** Lo bien que se complementan dos reinas: en cada atributo cuenta la mejor de las dos (y resta si flojean en lo mismo). */
export function complemento(a: Record<string, number>, b: Record<string, number>): number {
  const ks = Object.keys(a);
  if (!ks.length) return 0;
  return ks.reduce((t, k) => t + Math.max(a[k] || 0, b[k] || 0) - (Math.min(a[k] || 0, b[k] || 0) < 4 && Math.max(a[k] || 0, b[k] || 0) < 6 ? 1 : 0), 0) / ks.length;
}
/** Forma alianzas por parejas: primero las que más se complementan (y se llevan bien). Si son impares, una queda sola. */
export function formarAlianzas(keys: string[], valor: (a: string, b: string) => number, fijas: string[][] = []): string[][] {
  const used = new Set(fijas.flat());
  const libres = keys.filter((k) => !used.has(k));
  const cands: { a: string; b: string; v: number }[] = [];
  for (let i = 0; i < libres.length; i++) for (let j = i + 1; j < libres.length; j++) cands.push({ a: libres[i], b: libres[j], v: valor(libres[i], libres[j]) });
  cands.sort((x, y) => y.v - x.v);
  const out = fijas.map((p) => p.slice());
  for (const c of cands) if (!used.has(c.a) && !used.has(c.b)) { out.push([c.a, c.b]); used.add(c.a); used.add(c.b); }
  libres.filter((k) => !used.has(k)).forEach((k) => out.push([k]));
  return out;
}
/**
 * Nota valorada en pareja: si van parejas, las dos se acercan a la media (se las juzga juntas); si una ha hundido a la
 * otra (más de HUNDIDA puntos de diferencia), cada una con la suya. Devuelve las dos notas y si se las separó.
 */
export function notaEnPareja(a: number, b: number): { a: number; b: number; separadas: boolean } {
  if (Math.abs(a - b) > HUNDIDA) return { a, b, separadas: true };
  const m = (a + b) / 2;
  return { a: Math.round(m * 0.7 + a * 0.3), b: Math.round(m * 0.7 + b * 0.3), separadas: false };
}
/** Lo que te ayuda tu aliada en el reto de la semana: si ella es mejor en lo que pide, te echa una mano (hasta +5). */
export const ayudaAliada = (mio: number, suyo: number) => Math.max(0, Math.min(5, Math.round((suyo - mio) * 1.2)));
/**
 * ¿Rompe una reina del juego su alianza esta semana? Por interés: si su aliada quedó mal la semana pasada y ella
 * bien, si se llevan mal o, de vez en cuando, porque sí.
 */
export function rompe(o: { suya: string | undefined; deEllaAntes: string | undefined; rel: number; rnd: () => number }): boolean {
  const mala = (l?: string) => l === "LOW" || l === "SAFE";
  const buena = (l?: string) => l === "WIN" || l === "TOP2" || l === "HIGH";
  let p = 0.08;
  if (mala(o.suya) && buena(o.deEllaAntes)) p += 0.3;
  if (o.rel < 0) p += 0.2;
  return o.rnd() < p;
}
