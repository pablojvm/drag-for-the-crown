// Monedas del juego y mejoras de las reinas.
// Rudollars: la moneda del modo normal (historia): armario, tienda, taller, logros y mejoras de reina.
//   Se guardan en "dftc-closet" (campo money), como antes los euros.
// Lipsticks: la moneda del multijugador (su armario aparte). Se guardan en "dftc-sequins", donde iban las lentejuelas.

export const MONEDA = {
  normal: { n: "rudollars", uno: "rudollar", ic: "💵" },
  mp: { n: "lipsticks", uno: "lipstick", ic: "💄" },
} as const;
export type Modo = keyof typeof MONEDA;

/** «1.200 rudollars» / «1 lipstick». */
export function cantidad(n: number, modo: Modo = "normal") {
  const v = Math.round(n);
  const m = MONEDA[modo];
  return `${v.toLocaleString("es-ES")} ${Math.abs(v) === 1 ? m.uno : m.n}`;
}

/** Mejoras de reina (modo historia): +1 a un atributo, hasta MEJORA.max por atributo. */
export const MEJORA = { max: 2, base: 400, paso: 350 } as const;
export type Mejoras = Record<string, Record<string, number>>;
/** Precio de la siguiente mejora de ese atributo (sube con las que ya lleva y con lo alto que esté). */
export const costeMejora = (lleva: number, valor: number) => MEJORA.base + lleva * MEJORA.paso + Math.max(0, valor - 5) * 60;
/** ¿Se puede subir? (no pasa de 10 ni de MEJORA.max mejoras). */
export const puedeMejorar = (lleva: number, valor: number) => lleva < MEJORA.max && valor < 10;
/** Los atributos con las mejoras puestas. */
export function conMejoras<T extends Record<string, number>>(attrs: T, up: Record<string, number> | undefined): T {
  const out = { ...attrs };
  Object.entries(up || {}).forEach(([k, v]) => { if (k in out) (out as Record<string, number>)[k] = Math.min(10, out[k] + Math.max(0, Math.min(MEJORA.max, v))); });
  return out;
}
