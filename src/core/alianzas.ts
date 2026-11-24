// All Stars por brackets (como el All Stars 10 y 11) con alianzas por parejas dentro de cada bracket.
// Regla compartida por el modo historia y el multijugador.
// - Tres brackets que compiten por separado. Nadie se va: las dos ganadoras del reto se llevan 2 puntos cada una y
//   hacen lip sync por la victoria (la que gana suma 1 más). Las otras cuatro dan cada una su punto MVQ a la
//   compañera del bracket que quieran (como en el All Stars 10).
// - Dentro de cada bracket, las reinas se alían por parejas, mejor si se complementan (lo que a una le falta, a la
//   otra le sobra). Se valora en pareja (la nota de las dos se acerca a la media), salvo que una haya hundido a la
//   otra: entonces se juzga a cada una por separado.
// - Las alianzas pueden cambiar cada semana, por interés.
// - Al acabar cada bracket pasa la mitad (las de más puntos). Desde ahí, cada una por su cuenta, con las reglas
//   de siempre, hasta que quedan siete.
// - Final (como el All Stars 10): la mejor eliminada de cada bracket se juega volver en lip sync, y Lalaparuza
//   por eliminatorias: las que pierden en la 1ª ronda y en la 2ª, fuera; las dos últimas, por la corona.

export const BRACKET_PTS: Record<string, number> = { WIN: 3, TOP2: 2 };
/** Votos MVQ: en cada episodio, quién da su punto a quién. */
export type Mvq = Record<number, Record<string, string>>;
export const BRACKET_NOMBRES = ["Rosa", "Naranja", "Morado"];
/** Semanas que compite cada bracket. */
export const BRACKET_SEMANAS = 3;
/** Con cuántas en competición (o menos) llega la final: vuelve una eliminada y Lalaparuza por eliminatorias. */
export const BRACKETS_FINAL = 7;
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
/** Puntos MVQ que ha recibido una reina en unas semanas. */
export const mvqDe = (mvq: Mvq | undefined, k: string, eps: number[]) => eps.reduce((t, e) => t + Object.values((mvq || {})[e] || {}).filter((x) => x === k).length, 0);
/** Puntos de una reina en unas semanas: los del jurado (su track record) y los votos MVQ de sus compañeras. */
export const puntos = (track: Record<number, string> | undefined, eps: number[], mvq?: Mvq, k?: string) =>
  eps.reduce((t, e) => t + (BRACKET_PTS[(track || {})[e]] || 0), 0) + (mvq && k ? mvqDe(mvq, k, eps) : 0);
/** Clasificación de un bracket: más puntos; si empatan, más victorias; si no, al azar. */
export function clasificacion(keys: string[], trackOf: (k: string) => Record<number, string> | undefined, eps: number[], rnd: () => number, mvq?: Mvq) {
  const wins = (k: string) => eps.filter((e) => /WIN/.test((trackOf(k) || {})[e] || "")).length;
  return keys.map((k) => ({ k, p: puntos(trackOf(k), eps, mvq, k), w: wins(k), r: rnd() })).sort((a, b) => b.p - a.p || b.w - a.w || a.r - b.r);
}
/** Quién da punto MVQ esta semana: todas menos las dos que han hecho lip sync por la victoria. */
export const votanMvq = (keys: string[], top2: string[]) => keys.filter((k) => !top2.includes(k));
/**
 * A quién da su punto MVQ una reina del juego: a su aliada, a quien aprecia... y, por estrategia, mejor no a las
 * que van primeras (una rival menos para el corte). Nunca a sí misma.
 */
export function eligeMvq(o: { yo: string; cands: string[]; aliada?: string | null; rel: (k: string) => number; pts: (k: string) => number; rnd: () => number }): string {
  const cs = o.cands.filter((k) => k !== o.yo);
  return cs.map((k) => ({ k, v: (k === o.aliada ? 5 : 0) + o.rel(k) * 1.2 - o.pts(k) * 0.4 + o.rnd() * 3 })).sort((a, b) => b.v - a.v)[0]?.k || cs[0];
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

// ------------------------------ All Stars en parejas ------------------------------
/** Mezcla dos nombres de reina en uno, como en el primer All Stars (Raven + Jujubee → Rujubee). */
export function nombrePareja(a: string, b: string): string {
  const word = (n: string) => { const w = n.replace(/[^\p{L}\s-]/gu, "").split(/[\s-]+/).filter((x) => x && !/^(la|el|las|los|drag|miss|von|der|de|del|di)$/i.test(x)); return (w[0] || n).toLowerCase(); };
  const A = word(a), B = word(b);
  const onset = (w: string) => (w.match(/^[^aeiouáéíóú]*/i) || [""])[0];
  const firstSyl = (w: string) => (w.match(/^[^aeiouáéíóú]*[aeiouáéíóú]+[^aeiouáéíóú]?/i) || [w])[0];
  const tailFrom = (w: string) => { const i = w.slice(1).search(/[aeiouáéíóú]/i); return i < 0 ? w : w.slice(i + 1); };
  const cands = [onset(A) + B.slice(onset(B).length), firstSyl(A) + tailFrom(B), firstSyl(B) + tailFrom(A), onset(B) + A.slice(onset(A).length)]
    .filter((c) => c.length >= 4 && c.length <= 10 && c !== A && c !== B);
  const n = cands[0] || A.slice(0, 3) + B.slice(-4);
  return n.charAt(0).toUpperCase() + n.slice(1);
}
/** Etiquetas de una semana por parejas (filas ya ordenadas por pareja): gana una pareja entera y las dos peores, al lip sync. */
export function etiquetasParejas(groupPos: number[], nGroups: number): string[] {
  return groupPos.map((g) => (g === 0 ? "WIN" : nGroups >= 3 && g >= nGroups - 2 ? "BTM2" : g === 1 && nGroups >= 5 ? "HIGH" : g === nGroups - 3 && nGroups >= 5 ? "LOW" : "SAFE"));
}

/**
 * All Stars en parejas, corona doble: la pareja ganadora se corona entera si las dos han ido parejas toda la
 * temporada; si una ha estado claramente por encima, la corona es solo para ella. Un poco de azar en el corte.
 * Devuelve a quién se corona: "ambas", "a" o "b".
 */
export function coronaPareja(a: number[], b: number[], rnd: () => number): "ambas" | "a" | "b" {
  const med = (x: number[]) => (x.length ? x.reduce((t, v) => t + v, 0) / x.length : 0);
  const ma = med(a), mb = med(b);
  const corte = 4 + rnd() * 5; // entre 4 y 9 puntos de diferencia media
  if (Math.abs(ma - mb) <= corte) return "ambas";
  return ma > mb ? "a" : "b";
}
