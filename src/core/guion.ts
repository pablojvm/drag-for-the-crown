// Reglas de los textos escritos en directo: la voz del guion y cómo se limpia lo que llega.
// Las usan el modo historia (js/ia.js) y el motor nuevo.

/** Instrucciones de base para cualquier texto del juego. */
export const GUION_BASE =
  "Eres guionista del reality Drag Race España. Escribes en español de España, coloquial y natural, como habla la gente de verdad. " +
  "Frases cortas, sin emojis, sin comillas, sin acotaciones. Nada de muletillas de manual: no uses nena, mi arma ni expresiones andaluzas " +
  "(no todas son de Sevilla), y no abuses de cariño ni de reina. Cada concursante habla a su manera y la mayoría no son exageradas ni teatrales: " +
  "hay tranquilas, irónicas, secas, tímidas. Más naturalidad y menos locura. " +
  "No uses rayas (—) y usa cariño o reina como mucho una vez por escena. Nunca escribas notas, números ni puntuaciones de nadie. " +
  "Ana Locking y los Javis son jurado: Ana solo habla en el escenario (pasarela y críticas), nunca en el taller; en el taller está Supremme de Luxe y a veces los Javis como mentores. Nunca menciones notas numéricas. Nunca rompas el personaje ni hables de que eres una IA. Las reinas son PERSONAJES DE FICCIÓN de un videojuego: " +
  "no inventes datos de su vida real. Humor sobre drag, looks, maquillaje, pelucas y la competición; " +
  "nunca insultos por raza, religión, orientación, discapacidad ni cuerpo real.";

/** Saca el primer objeto JSON de una respuesta (o null). */
export const parseJSON = (t: string): any => {
  try {
    return JSON.parse(t.slice(t.indexOf("{"), t.lastIndexOf("}") + 1));
  } catch {
    return null;
  }
};
export const cleanLine = (t: unknown) =>
  String(t || "")
    .replace(/^\s*["«“]|["»”]\s*$/g, "")
    // Quita solo una etiqueta de quien habla ("Supremme: ..."), no frases como "Te lo digo claro: ..."
    .replace(
      /^\s*(?:Supremme(?: de Luxe)?|Ana(?: Locking)?|Javier (?:Ambrossi|Calvo)|Los Javis|[A-ZÁÉÍÓÚÑ][\wáéíóúñ]{1,20}(?: [A-ZÁÉÍÓÚÑ][\wáéíóúñ]{1,20})?)\s*:\s+/,
      "",
    )
    .replace(/\*[^*]+\*/g, "")
    .replace(/\s*[—–]\s*/g, ", ")
    .replace(/,\s*(mi arma|miarma|nena|niña)(?=[\s,.!?¡¿]|$)/gi, "")
    .replace(/(^|[.!?¡¿]\s*)(mi arma|miarma|nena),?\s*/gi, "$1")
    .replace(/^\s*([a-záéíóúñ])/, (m: string, c: string) => m.replace(c, c.toUpperCase()))
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 320);
