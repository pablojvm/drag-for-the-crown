// Montaje del lip sync («playback cinematográfico»): las decisiones de realización, sin Phaser ni pantalla.
// Qué plano toca en cada compás, qué cara pone cada reina, cuándo hay un número especial y cómo va el
// suspense antes del veredicto. La escena (src/next/game/scenes/LipSync.ts) solo pinta lo que sale de aquí,
// así que esto se prueba con tests y se ajusta tocando MONTAJE.

/** Las dos que bailan: tú (izquierda) y la rival (derecha). */
export type Actor = "me" | "them";
/** Planos de la realización. */
export type Plano = "general" | "me" | "them" | "duo" | "jurado";
/** Caras de cada reina (si hay imagen para esa cara, se usa; si no, se imita con la pose). */
export type Cara = "neutral" | "grito" | "sassy" | "tension";
/** Números especiales a mitad de canción. */
export type Numero = "reveal" | "dip" | "giro" | "foco";

export const MONTAJE = {
  /** Canción de fondo y su tempo (los cortes van a compás). Sin canción, se lleva el compás con un reloj. */
  cancion: { src: "./audio/Sissy That Walk.mp3", bpm: 123, offset: 0.35, volumen: 0.35 },
  /** Cada cuántos tiempos hay corte, según la parte de la canción (0 inicio · 1 puente · 2 clímax). */
  corteCada: [8, 4, 2] as const,
  /** Cuánto se acerca la cámara en cada plano (1 = sin zoom). */
  zoom: { general: 1, me: 1.55, them: 1.55, duo: 1.22, jurado: 1.35 } as Record<Plano, number>,
  /** Duración del «punch-in» (acercamiento rápido) y del rebote de la cara, en ms. */
  punchMs: 140,
  rebote: { ms: 200, escala: 1.06 },
  /** Un movimiento es «bueno» (y puede tener número especial) si conecta al menos tanto con el público. */
  buenImpacto: 14,
  /** Ventaja (en puntos de público) para que se note quién domina con la luz. */
  dominaPor: 6,
  /** Suspense antes del veredicto: cambios de foco entre las dos (cada vez más rápidos) y el corte al jurado. */
  suspense: { focos: [520, 420, 330, 260, 200, 170], jurado: 1400, final: 700 },
} as const;

/** Módulo que no da negativos (los tiempos antes de empezar la canción). */
const mod = (a: number, n: number) => ((a % n) + n) % n;

/** Parte de la canción por paso del lip sync (6 pasos: 2 de inicio, 2 de puente, 2 de clímax). */
export const parteDe = (step: number) => Math.min(2, Math.floor(step / 2));

/** ¿Toca corte en este tiempo? */
export const hayCorte = (beat: number, parte: number) => beat > 0 && beat % MONTAJE.corteCada[Math.max(0, Math.min(2, parte))] === 0;

/**
 * El plano del corte. Tras un movimiento, la cámara va a quien lo ha hecho (el «foco» del montaje); si no, alterna
 * entre las dos, el dúo y el general, con más planos cortos en el clímax. `rnd` de 0 a 1 (con semilla en los tests).
 */
export function planoDe(o: { beat: number; parte: number; foco?: Plano | null; anterior?: Plano; rnd: number }): Plano {
  if (o.foco) return o.foco;
  const ciclo: Plano[][] = [
    ["general", "me", "duo", "them"],
    ["me", "them", "duo", "me", "them", "general"],
    ["me", "them", "me", "them", "duo"],
  ];
  const c = ciclo[Math.max(0, Math.min(2, o.parte))];
  let p = c[mod(Math.floor(o.beat / MONTAJE.corteCada[o.parte]), c.length)];
  // Un poco de azar para que no se vea la plantilla, pero sin repetir el mismo plano dos veces seguidas
  if (o.rnd < 0.25) p = c[(c.indexOf(p) + 1) % c.length];
  if (p === o.anterior) p = c[(c.indexOf(p) + 1) % c.length];
  return p;
}

/**
 * La cara de cada reina en un tiempo: va cambiando con la letra (cada dos tiempos), más intensa en el clímax;
 * si acaba de fallar, tensión; si acaba de clavar un truco, grito.
 */
export function caraDe(o: { beat: number; parte: number; ultimo?: "bien" | "mal" | null; actor: Actor }): Cara {
  if (o.ultimo === "mal") return "tension";
  if (o.ultimo === "bien") return "grito";
  const letra: Cara[][] = [
    ["neutral", "sassy", "neutral", "grito"],
    ["sassy", "grito", "neutral", "sassy"],
    ["grito", "sassy", "grito", "tension"],
  ];
  const l = letra[Math.max(0, Math.min(2, o.parte))];
  // Cada una a su ritmo (desfasadas un tiempo), para que no parezcan sincronizadas
  return l[mod(Math.floor(o.beat / 2) + (o.actor === "them" ? 1 : 0), l.length)];
}

/** Quién domina ahora (con margen), o nadie. `mine` y `theirs` son el público que lleva cada una. */
export function domina(mine: number, theirs: number): Actor | null {
  if (mine - theirs >= MONTAJE.dominaPor) return "me";
  if (theirs - mine >= MONTAJE.dominaPor) return "them";
  return null;
}

/** El número especial de un movimiento bueno (null si no lo merece). */
export function numeroDe(o: { tag: string; ok: boolean; imp: number; parte: number }): Numero | null {
  if (!o.ok || o.imp < MONTAJE.buenImpacto) return null;
  if (o.tag === "Emote") return o.parte === 2 ? "reveal" : "dip";
  if (o.tag === "Escenario") return "giro";
  return "foco";
}

/** Lo que pasa antes del veredicto: los cambios de foco y, al final, el foco en la ganadora. */
export function suspense(ganadora: Actor): { foco: Actor; ms: number }[] {
  const f = MONTAJE.suspense.focos;
  // Termina en la que pierde, para que la luz final sobre la ganadora sea el golpe
  const fin: Actor = ganadora === "me" ? "them" : "me";
  return f.map((ms, i) => ({ foco: (f.length - 1 - i) % 2 === 0 ? fin : ganadora, ms }));
}
