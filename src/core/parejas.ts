// All Stars por parejas: parejas fijas toda la temporada (regla compartida por el modo historia y el multijugador).
// - Cada semana se juzga a la pareja (la media de las dos) y la peor pareja va al bottom.
// - Duelo fratricida: las dos de la peor pareja hacen lip sync entre ellas y se va la que pierde.
// - Si una se queda sin pareja, sigue sola; cuando hay dos solas, forman pareja nueva.
// - Una vez por temporada, doble eliminación: las dos peores parejas, lip sync 2 contra 2, y la que pierde se va entera.
// - Con cuatro o menos, se acaban las parejas: cada una por su cuenta hasta la final.

export interface Pareja { k: string[]; name: string }
export const NOMBRES_PAREJA = ["Rosa", "Oro", "Turquesa", "Lila", "Coral", "Esmeralda", "Plata", "Rubí"];
/** Con cuántas (o menos) se acaban las parejas. */
export const PAREJAS_FIN = 4;

/** Forma las parejas (la primera vez) o las pone al día: fuera las eliminadas y las solas se juntan. */
export function parejasAlDia(prev: Pareja[] | undefined, alive: string[], rnd: () => number): { parejas: Pareja[]; nuevas: string[][] } {
  const vivas = new Set(alive);
  if (!prev || !prev.length) {
    const all = alive.map((k) => [rnd(), k] as const).sort((a, b) => a[0] - b[0]).map((x) => x[1]);
    const parejas: Pareja[] = [];
    for (let i = 0; i < all.length; i += 2) parejas.push({ k: all.slice(i, i + 2), name: NOMBRES_PAREJA[parejas.length % NOMBRES_PAREJA.length] });
    return { parejas, nuevas: parejas.map((p) => p.k) };
  }
  let parejas = prev.map((p) => ({ ...p, k: p.k.filter((k) => vivas.has(k)) })).filter((p) => p.k.length);
  const solas = parejas.filter((p) => p.k.length === 1);
  const nuevas: string[][] = [];
  for (let i = 0; i + 1 < solas.length; i += 2) {
    solas[i].k = [solas[i].k[0], solas[i + 1].k[0]];
    solas[i + 1].k = [];
    nuevas.push(solas[i].k);
  }
  parejas = parejas.filter((p) => p.k.length);
  return { parejas, nuevas };
}
/** ¿Siguen las parejas con tantas en competición? */
export const parejasSiguen = (n: number) => n > PAREJAS_FIN;
/** Tamaño del último grupo para el bottom: si la peor «pareja» es una sola, el bottom es ella y la peor de la pareja anterior. */
export const ultimoGrupoParejas = (lastGroupSize?: number) => (lastGroupSize === 1 ? undefined : lastGroupSize);
/**
 * ¿Toca esta semana la doble eliminación (las dos peores parejas, 2 contra 2)? Una vez por temporada, con 6 a 10 en
 * competición (con 7 o menos, si no se ha hecho, toca seguro). Necesita que las dos peores sean parejas completas.
 */
export function dobleToca(o: { ep: number; n: number; hecha?: number; ultimas: number[]; rnd: () => number }): boolean {
  if (o.hecha) return o.hecha === o.ep;
  if (o.ep < 3 || o.n < 6 || o.n > 10) return false;
  if (o.ultimas.length < 2 || o.ultimas.some((x) => x !== 2)) return false;
  return o.n <= 7 || o.rnd() < 0.4;
}
/** Química de una pareja (de -4 a 4), estable para cada pareja. */
export function quimica(k: string[]): number {
  let h = 0;
  for (const ch of k.slice().sort().join("|")) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return (h % 9) - 4;
}
/** Doble eliminación: gana la pareja que gana más duelos; si empatan, la que suma más en el lip sync. */
export function dobleGanadora(a: string[], b: string[], duelos: { w: string }[], nota: (k: string) => number): "a" | "b" {
  const wa = duelos.filter((d) => a.includes(d.w)).length, wb = duelos.filter((d) => b.includes(d.w)).length;
  if (wa !== wb) return wa > wb ? "a" : "b";
  const sum = (x: string[]) => x.reduce((t, k) => t + nota(k), 0);
  return sum(a) >= sum(b) ? "a" : "b";
}
