// Resultados de la semana: cuántas van al bottom y qué etiqueta recibe cada reina.
// Es la misma regla para el modo historia y para el multijugador (antes cada uno tenía la suya y no coincidían).

/** Dinámicas de temporada. */
export type Twist = "normal" | "allstars" | "winners" | "repesca" | "suerte" | "corazon" | "moneda" | string;
export const asLike = (tw: Twist) => tw === "allstars" || tw === "winners";

/** Cuántas reinas van al bottom esta semana. */
export function bottomSize(o: { twist: Twist; n: number; repescaWeek?: boolean; lastGroupSize?: number }): number {
  // Temporada de la moneda: bottom de tres (luego decide la moneda)
  let nb = o.twist === "moneda" && o.n >= 6 ? 3 : 2;
  // Segunda Oportunidrag: bottom de tres y lip sync a tres bandas
  if (o.repescaWeek && o.n >= 5) nb = 3;
  // Reto por grupos: el bottom sale del último grupo
  if (o.lastGroupSize != null) nb = Math.max(1, Math.min(nb, o.lastGroupSize));
  // All Winners: no hay bottom
  if (o.twist === "winners") nb = 0;
  return nb;
}

export interface LabelRow {
  key: string;
  /** Salvada del bottom (reina de la suerte, corazón...): conserva la etiqueta de bottom. */
  protected?: boolean;
  /** Grupo del reto (0 = el mejor), si es por grupos. */
  group?: number;
}
export interface LabelCtx {
  twist: Twist;
  /** Tamaño del bottom (bottomSize). */
  nb: number;
  /** Claves de las que están en el bottom. */
  bottom: string[];
  /** Número de grupos si el reto es por grupos. */
  nGroups?: number;
  /** Reto por parejas (grupos de dos). */
  pairs?: boolean;
  /** Bloques que valora el jurado (grupos o equipos; el 0 es el ganador). */
  blocks?: string[][];
  /** All Winners: la reina bloqueada esta semana. */
  blocked?: string | null;
}

/**
 * Etiqueta de cada reina (filas ordenadas de mejor a peor):
 * WIN, TOP2 (All Stars y All Winners), BTOP (top bloqueada), HIGH, SAFE, LOW, BTM2 o BTM3.
 */
export function weekLabels(rows: LabelRow[], c: LabelCtx): string[] {
  const n = rows.length;
  const highTo = n <= 7 ? 1 : 2;
  const groups = c.nGroups != null && c.nGroups > 0 && rows.some((r) => r.group != null);
  return rows.map((r, k) => {
    let lab: string;
    if (asLike(c.twist) && k <= 1) lab = "TOP2";
    else if (k === 0) lab = "WIN";
    else if (c.bottom.includes(r.key) || r.protected) lab = `BTM${c.nb}`;
    else if (groups) lab = r.group === 0 ? (k <= highTo ? "HIGH" : "SAFE") : r.group === c.nGroups! - 1 ? "LOW" : "SAFE";
    else if (k <= highTo) lab = "HIGH";
    else if (k >= n - c.nb - 1) lab = "LOW";
    else lab = "SAFE";
    if (c.twist === "winners") {
      // Sin bottom ni críticas negativas
      if (lab === "LOW" || /^BTM/.test(lab)) lab = "SAFE";
      if (c.blocks && c.blocks.length) {
        // Reto en grupo o por equipos: arriba solo el bloque ganador; por parejas, también la segunda pareja
        const second = c.blocks.length > 1 && groups && c.pairs;
        lab = /TOP2|BTOP/.test(lab) ? lab : c.blocks[0].includes(r.key) || (second && c.blocks[1].includes(r.key)) ? "HIGH" : "SAFE";
      } else if (lab === "SAFE" && k >= 2 && k <= 3 && n >= 6) lab = "HIGH"; // las dos siguientes al top 2
      // La bloqueada puede quedar en el top, pero sin estrella
      if (lab === "TOP2" && c.blocked && c.blocked === r.key) lab = "BTOP";
    }
    return lab;
  });
}

/** Quién recibe críticas: con seis o menos, todas (salvo en All Winners, que nunca critica a las salvadas). */
export const allCritiqued = (n: number, twist: Twist) => n <= 6 && twist !== "winners";

/**
 * Orden de las reinas según el capítulo anterior (la ganadora primero), para elegir capitanas o quién reparte.
 * Devuelve null si no hay capítulo anterior con etiquetas.
 */
const PREV_ORDER = ["WIN", "BWIN", "TOP2", "BTOP", "HIGH", "RTRN", "SAFE", "MC", "LOW", "BTM2", "BTM3", "BTM4"];
export function previousRank(keys: string[], labelOf: (key: string) => string | undefined, rnd: () => number = Math.random): string[] | null {
  const at = (k: string) => { const i = PREV_ORDER.indexOf(labelOf(k) || ""); return i < 0 ? 99 : i; };
  if (!keys.some((k) => at(k) < 99)) return null;
  return keys.map((k) => ({ k, i: at(k), r: rnd() })).sort((a, b) => a.i - b.i || a.r - b.r).map((x) => x.k);
}
