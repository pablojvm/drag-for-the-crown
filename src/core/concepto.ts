// Pasarela con concepto: la reina escribe la idea de su look, elige tres momentos de desfile,
// responde a la pregunta de Ana y el jurado valora concepto, coherencia y desfile.
// Lo usan el modo historia y el motor nuevo; aquí están las instrucciones, cómo se leen las respuestas y la nota.

export type MomentKey = "entrada" | "detalle" | "final";
export const MOMENT_KEYS: MomentKey[] = ["entrada", "detalle", "final"];
export const MOMENT_NAMES: Record<MomentKey, string> = { entrada: "🚶 La entrada", detalle: "✨ A mitad de pasarela", final: "📸 En la marca" };
/** Momentos de siempre por si la respuesta no trae los suyos. */
export const MOMENT_DEFAULTS: Record<MomentKey, string[]> = {
  entrada: ["Paso firme y mirada a cámara", "Entrada lenta y misteriosa", "Salgo bailando"],
  detalle: ["Giro para enseñar la espalda", "Juego con el accesorio", "Me toco la peluca con descaro"],
  final: ["Pose congelada", "Guiño al jurado", "Me tiro al suelo con drama"],
};
export const REVEAL_OPT = "🎁 ¡Hacer el reveal!";

export interface ConceptCtx { cat: string; theme?: string; ballCtx?: string; pieces: string[] }
type Prompt = { system: string; user: string; opts: { json: true; max: number; temp: number } };

const catLine = (c: ConceptCtx) => `Categoría: «${c.cat}»${c.theme ? ` (${c.theme})` : ""}.${c.ballCtx ? ` ${c.ballCtx}` : ""}`;

/** Momentos de desfile y la pregunta de Ana, a partir del concepto. */
export const momentsPrompt = (c: ConceptCtx & { concept: string }): Prompt => ({
  system: "Eres coreógrafa de pasarela de Drag Race España. Propones momentos de desfile concretos y visuales, coherentes con el concepto y las piezas.",
  user: `${catLine(c)} Piezas: ${c.pieces.join(", ")}. Concepto de la reina: «${c.concept}».
Propón 3 opciones para cada momento del desfile: "entrada" (cómo sale), "detalle" (qué enseña a mitad de pasarela) y "final" (cómo remata en la marca). Cada opción en máximo 10 palabras; una de las tres debe encajar mucho mejor con el concepto que las otras.
Añade "pregunta": lo que le pregunta Ana Locking sobre una pieza concreta de su look (tejido, construcción, silueta o elección), máximo 15 palabras, y "respuestas": 3 respuestas posibles de la reina (máximo 18 palabras cada una), una con argumento de moda sólido ("buena"), una emocional pero algo vaga ("regular") y una vacía o que se contradice ("mala").
Devuelve JSON {"entrada":["...","...","..."],"detalle":["...","...","..."],"final":["...","...","..."],"pregunta":"...","respuestas":[{"t":"...","calidad":"buena|regular|mala"}]}`,
  opts: { json: true, max: 800, temp: 0.9 },
});

export interface AnaQA { q: string; a: { t: string; k: string }[] }
export interface ConceptMoments { moments: { k: MomentKey; opts: string[] }[]; qa: AnaQA | null }

/** Texto de una respuesta: a veces llega como objeto ({t}, {texto} o {text}). */
export const str = (x: any): string => (typeof x === "string" ? x : x && typeof x === "object" ? x.t || x.texto || x.text || "" : x == null ? "" : String(x));
const asQuestion = (t: string) => (/^¿/.test(t) ? t : `¿${t.replace(/[?.]*$/, "")}?`);

/** Lee la respuesta de los momentos (o null si no llegó) y deja siempre tres momentos jugables. */
export function parseMoments(r: any, o: { clean: (t: string) => string; shuffle: <T>(a: T[]) => T[]; reveal?: boolean }): ConceptMoments {
  const answers = r && Array.isArray(r.respuestas) ? r.respuestas.filter((x: any) => x && str(x.t)) : [];
  const qa: AnaQA | null =
    r && str(r.pregunta) && answers.length >= 3
      ? { q: asQuestion(o.clean(str(r.pregunta))), a: o.shuffle(answers.slice(0, 3)).map((x: any) => ({ t: o.clean(str(x.t)).slice(0, 140), k: str(x.calidad) })) }
      : null;
  const moments = MOMENT_KEYS.map((k) => ({ k, opts: (r && Array.isArray(r[k]) && r[k].length >= 2 ? r[k].map(str) : MOMENT_DEFAULTS[k]).slice(0, 3).map(o.clean) }));
  if (o.reveal) moments[2].opts.push(REVEAL_OPT);
  return { moments, qa };
}

/** Defender bien la moda delante de Ana suma; una respuesta vacía resta. */
export const anaBonus = (calidad: string) => (/buena/.test(calidad) ? 6 : /mala/.test(calidad) ? -6 : 0);

/** Lo que valora el jurado. */
export const judgePrompt = (c: ConceptCtx & { concept: string; picks: string[]; reveal?: boolean; anaAnswer?: string }): Prompt => ({
  system:
    "Eres el jurado de Drag Race España valorando una pasarela: Supremme de Luxe (espectáculo y actitud) y Ana Locking (moda, construcción y coherencia). Sois exigentes: un concepto genérico o que no tiene nada que ver con lo que lleva puntúa bajo. Pero la temática es un punto de partida, no una lista de requisitos: cada reina la interpreta a su manera.",
  user: `${catLine(c)} Lo que lleva: ${c.pieces.join(", ")}. Concepto que defiende: «${c.concept}». Su desfile: ${c.picks.join("; ")}.${c.reveal ? " Hace un reveal." : ""}${c.anaAnswer ? ` ${c.anaAnswer} Tenlo en cuenta en la coherencia y en lo que dice Ana.` : ""}
La temática está abierta a interpretaciones: cualquier lectura vale si el concepto la justifica y el look la cuenta. No penalices por no usar los ejemplos de la descripción; premia las interpretaciones propias y bien defendidas.
Valora de 0 a 100: "concepto" (originalidad y fuerza de la idea), "coherencia" (si el concepto es una interpretación defendible de la temática y si lo que lleva lo cuenta) y "desfile" (si los momentos elegidos cuentan esa historia). Añade "supreme" y "ana": una frase de cada una, máximo 25 palabras, dirigida a la reina.
Devuelve JSON {"concepto":0,"coherencia":0,"desfile":0,"supreme":"...","ana":"..."}`,
  opts: { json: true, max: 400, temp: 0.6 },
});

export interface Verdict { concepto: number; coherencia: number; desfile: number; supreme: string; ana: string; ok: boolean }
const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
const n100 = (v: unknown, d: number) => clamp(Math.round(v != null && Number.isFinite(+(v as any)) ? +(v as any) : d), 0, 100);

/** Lee el veredicto; sin respuesta, un 55 en todo y sin frases. */
export const parseVerdict = (r: any): Verdict => ({
  concepto: n100(r && r.concepto, 55),
  coherencia: n100(r && r.coherencia, 55),
  desfile: n100(r && r.desfile, 55),
  supreme: r ? str(r.supreme) : "",
  ana: r ? str(r.ana) : "",
  ok: !!r,
});

/** Nota de la pasarela con concepto. `moda` y `carisma` van de 1 a 10. */
export function conceptScore(o: { v: Pick<Verdict, "concepto" | "coherencia" | "desfile">; moda: number; carisma: number; reveal?: boolean; cat: string; ana?: number }) {
  let s = o.v.concepto * 0.35 + o.v.coherencia * 0.4 + o.v.desfile * 0.25 + (o.moda - 5) + (o.carisma - 5) * 0.5;
  if (o.reveal && /reveal/i.test(o.cat)) s += 6;
  s += o.ana || 0;
  return clamp(Math.round(s), 0, 100);
}
