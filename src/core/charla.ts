// Charla libre con una compañera (con el jurado en directo): escribes lo que quieras y te contesta en personaje.
// Lo que dices cuenta: cada respuesta trae cuánto cambia vuestra relación.
export interface CharlaCtx {
  reina: string;
  yo: string;
  donde: string;
  /** Cómo os lleváis (-3 a 3) y su papel detrás de cámaras, si lo sabes. */
  rel: number;
  rol?: { name: string; desc: string } | null;
  nemesis?: boolean;
  /** Lo que ha pasado esta semana (reto, críticas...). */
  semana?: string;
}
export interface Msg { me: boolean; t: string }
const relTxt = (r: number) => (r >= 2 ? "sois aliadas" : r >= 1 ? "os lleváis bien" : r <= -2 ? "no os soportáis" : r <= -1 ? "hay tensión entre vosotras" : "no tenéis mucha relación");
/** Máximo de mensajes tuyos en una charla. */
export const CHARLA_TURNOS = 4;

export function charlaPrompt(c: CharlaCtx, hist: Msg[]) {
  return {
    system: `Hablas SOLO como ${c.reina}, concursante de Drag Race España (personaje de ficción de un videojuego), en ${c.donde}. Con ${c.yo} ${relTxt(c.rel)}.${c.nemesis ? ` ${c.yo} es tu némesis de la temporada.` : ""}${c.rol ? ` Tu forma de ser: ${c.rol.name.toLowerCase()} (${c.rol.desc})` : ""}${c.semana ? ` Esta semana: ${c.semana}` : ""} Responde en JSON con "respuesta" (lo que dices, máximo 35 palabras, en personaje, sin comillas) y "relacion" (número entero de -2 a 2: cuánto mejora o empeora vuestra relación por lo último que te ha dicho ${c.yo}; un insulto resta, un gesto bonito suma, una charla normal es 0).`,
    user: `Conversación hasta ahora:\n${hist.map((m) => `${m.me ? c.yo : c.reina}: ${m.t}`).join("\n")}\nResponde como ${c.reina}.`,
    opts: { json: true as const, max: 160, temp: 0.9 },
  };
}
/** Lee la respuesta: el texto y el cambio de relación (acotado). Sin respuesta, una frase de salida. */
export function parseCharla(r: any, clean: (t: string) => string, rnd: () => number = Math.random): { text: string; rel: number; ok: boolean } {
  const t = r && typeof r.respuesta === "string" ? clean(r.respuesta) : "";
  if (!t) return { text: ["Ahora no tengo la cabeza para esto.", "Mira, luego hablamos, que tengo que acabar el look.", "Mmm... déjame pensarlo."][Math.floor(rnd() * 3)], rel: 0, ok: false };
  const d = Math.round(Number(r.relacion) || 0);
  return { text: t, rel: Math.max(-2, Math.min(2, d)), ok: true };
}
