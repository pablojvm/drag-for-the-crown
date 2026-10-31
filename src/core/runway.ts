// Pasarela (la versión clásica del modo historia): estilo del look, forma de caminar, el momento final y la voz en off.
// Lo usan el modo historia y el motor nuevo.
import { checkChance } from "./lipsync";

export const TAGS = ["Glamour", "Camp", "Edgy", "Folclórico", "Futurista"] as const;
export type Tag = (typeof TAGS)[number];
export type Walk = "fuerte" | "flotado" | "comico" | "provocador";
export const WALKS: [Walk, string, string][] = [["fuerte", "💥", "Fuerte"], ["flotado", "🕊️", "Flotado"], ["comico", "🤪", "Cómico"], ["provocador", "🔥", "Provocador"]];
/** Cómo se camina cada estilo. */
export const WALK_OF_TAG: Record<Tag, Walk> = { Glamour: "flotado", Camp: "comico", Edgy: "fuerte", Futurista: "fuerte", Folclórico: "provocador" };
/** Categorías de pasarela y el estilo que piden. */
export const CAT_TAG: Record<string, Tag> = {
  "Rojo pasión": "Glamour", "Brilla, brilla": "Glamour", "Realeza": "Glamour", "Animal print": "Edgy", "Años 80": "Camp",
  "Futurista": "Futurista", "Flores y más flores": "Folclórico", "Blanco y negro": "Edgy", "Look de gala": "Glamour", "Folclore reinventado": "Folclórico",
  "Camp absoluto": "Camp", "Comida basura de lujo": "Camp", "Cuero y tachuelas": "Edgy", "Galaxia lejana": "Futurista", "Verbena de pueblo": "Folclórico",
};
export const VOICEOVERS: Record<Tag, string[]> = {
  Glamour: ["«Nací brillando y pienso morir brillando»", "«No es un vestido, es una declaración de intenciones»"],
  Camp: ["«Si no te ríes, es que no lo has entendido»", "«Más es más, y hoy es muchísimo más»"],
  Edgy: ["«Que me teman un poquito, que así me respetan»", "«Las normas me las como con el desayuno»"],
  Futurista: ["«Vengo de dentro de trescientos años a salvar la moda»", "«Aterrizaje confirmado: la diva ha llegado»"],
  Folclórico: ["«De mi pueblo al mundo, con volantes y a mucha honra»", "«La tradición también sabe hacer drag»"],
};
export const VOICE_OFF = ["«Hola, soy yo y esto es un vestido»", "«Pues nada, aquí estamos»", "«Me lo he puesto porque estaba limpio»", "«¿Esto ya está grabando?»"];

const isReveal = (cat: string) => /reveal/i.test(cat);

/** Salida a la pasarela: acertar el paso con el look puntúa mucho más. `walkMov` (1 a 5) es la movilidad del look. */
export const walkPoints = (walk: Walk, look: Tag, walkMov = 3) => (walk === WALK_OF_TAG[look] ? 92 : 52) + Math.round((walkMov - 3) * 4);

export type Moment = "pose" | "comedia" | "reveal";
/** Final de pasarela. Un reveal sale según performance y carisma (o casi seguro si la categoría es de reveal y hay look de reveal). */
export function momentPoints(o: { moment: Moment; cat: string; look: Tag; revealOk?: boolean }): number {
  const rv = isReveal(o.cat);
  if (o.moment === "pose") return rv ? 35 : o.look === "Glamour" || o.look === "Edgy" ? 82 : 68;
  if (o.moment === "comedia") return o.look === "Camp" && !rv ? 94 : rv ? 35 : 48;
  return o.revealOk ? 100 : 15;
}
export const revealSucceeds = (o: { performance: number; carisma: number; roll: number }) => o.roll < checkChance((o.performance + o.carisma) / 2, 60);

export type Voice = "buena" | "otra" | "mala";
export const voicePoints = (v: Voice) => (v === "buena" ? 96 : v === "otra" ? 55 : 25);

/** Nota de la pasarela: la media de los momentos. */
export const runwayScore = (points: number[]) => (points.length ? points.reduce((a, b) => a + b, 0) / points.length : 0);
