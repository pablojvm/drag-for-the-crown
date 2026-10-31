// Lip sync por energía (las reglas del modo historia): seis movimientos en tres partes de la canción.
// Lo usan el modo historia, el duelo del multijugador y la escena del motor nuevo.

export type Attr = "performance" | "carisma" | "estilo";
export type LsAttrs = Record<Attr, number>; // de 1 a 10

/** Trucos: [clave, nombre, atributo, dificultad, impacto en el clímax]. */
export const EMOTES: [string, string, Attr, number, number][] = [
  ["revelacion", "🎁 Revelación", "estilo", 52, 66],
  ["caida", "💥 La caída (death drop)", "performance", 56, 76],
  ["split", "🤸 Split", "performance", 46, 60],
];
/** Repetir el mismo movimiento aburre al público. */
export const REPITE = 0.65;
export const LS_PHASES = ["Inicio", "Puente", "Clímax"];
export const LS_STEPS = 6;

/** Probabilidad de que salga un truco según el atributo (1 a 10) y la dificultad. */
export const checkChance = (attr: number, diff: number) => Math.min(0.95, Math.max(0.08, 0.5 + (attr * 10 - diff) / 70));

export type LsKind = "Emote" | "Cara" | "Escenario";
export interface LsMove { tag: LsKind; imp: number; energy: number; ok: boolean; msg: string }

/**
 * Resultado de un movimiento. `clim` = estamos en el clímax. `roll` = número al azar de 0 a 1 para el truco.
 * Devuelve cuánto conecta con el público (`imp`) y la energía que queda.
 */
export function lsMove(o: { kind: LsKind; emote: number; clim: boolean; energy: number; lastTag: string; attrs: LsAttrs; roll: number }): LsMove {
  if (o.kind === "Emote") {
    const [, , at, dif, top] = EMOTES[o.emote % EMOTES.length];
    if (o.energy < 45) return { tag: "Emote", imp: 4, energy: Math.max(0, o.energy - 10), ok: false, msg: "Sin fuelle: el truco se queda a medias." };
    const ok = o.roll < checkChance(o.attrs[at], o.clim ? dif : dif + 8);
    return { tag: "Emote", imp: ok ? (o.clim ? top : 24) : 6, energy: o.energy - 45, ok, msg: ok ? (o.clim ? "¡El público se levanta!" : "Impresiona... aunque era pronto.") : "¡Uf! Se le va el truco." };
  }
  const cara = o.kind === "Cara";
  const cost = cara ? 10 : 15, rep = o.lastTag === o.kind;
  if (o.energy < cost) return { tag: o.kind, imp: 2, energy: o.energy, ok: false, msg: "Sin energía: ni se mueve." };
  const imp = (cara ? 8 + o.attrs.carisma * 1.6 : 12 + o.attrs.performance * 2) * (rep ? REPITE : 1);
  return { tag: o.kind, imp: Math.round(imp * 10) / 10, energy: o.energy - cost, ok: true, msg: rep ? "Repite movimiento... el público ya lo ha visto." : cara ? "Cada palabra la siente. Se le ve en los ojos." : "Se come el escenario de punta a punta." };
}

/** Fuerza de la rival en el lip sync (lo que hay que superar). `form` y `boost` vienen de la temporada. */
export const rivalStrength = (a: LsAttrs, o: { form?: number; boost?: number; noise: number }) =>
  Math.min(175, Math.max(45, 35 + (a.performance + a.carisma) * 6.5 + Math.max(-6, Math.min(6, o.form || 0)) + (o.boost || 0) * 0.5 + o.noise));
