// Pasarela del motor nuevo: las reglas son las del núcleo (src/core/runway.ts y src/core/concepto.ts); aquí solo se lleva la partida.
// Con el jurado en directo: look, concepto, tres momentos de desfile, la pregunta de Ana y el veredicto.
// Sin él: la clásica (look, paso, momento final y voz en off).
import type { LsAttrs } from "../../core/lipsync";
import { TAGS, WALKS, VOICEOVERS, VOICE_OFF, walkPoints, momentPoints, voicePoints, runwayScore, revealSucceeds, WALK_OF_TAG, type Tag, type Walk, type Moment, type Voice } from "../../core/runway";
import { momentsPrompt, parseMoments, judgePrompt, parseVerdict, conceptScore, anaBonus, REVEAL_OPT, type AnaQA, type MomentKey } from "../../core/concepto";
import { cleanLine } from "../../core/guion";
import { TEMAS_PASARELA } from "../../core/temas";
import { LOOK_PIECES } from "./data";
import { queenOf } from "./queens";
import { ask, juradoListo } from "./jurado";
import { get, set } from "../store";

export interface RunwayState {
  id: number;
  mode: "clasica" | "concepto";
  cat: string;
  theme: string;
  catTag: Tag;
  look: Tag | null;
  lookOpts: Tag[];
  /** Clásica: 0 look · 1 paso · 2 momento final · 3 voz en off. Con concepto: 0 look · 1 concepto · 2 a 4 momentos · 5 Ana. */
  step: number;
  /** Lo cerca que está la reina (0 al fondo, 4 en primer plano). */
  pos: number;
  done: boolean;
  waiting: boolean;
  points: number[];
  msg: string;
  good: boolean | null;
  anim: string; // lo que tiene que hacer la reina en la escena: "walk", "pose", "comedia", "detalle", "reveal", "stuck", "voice"
  animN: number;
  voices: { k: Voice; t: string }[];
  concept: string;
  moments: { k: MomentKey; opts: string[] }[];
  picks: string[];
  qa: AnaQA | null;
  ana: number;
  anaAnswer: string;
  reveal: boolean;
  lines: { supreme: string; ana: string } | null;
  score: number | null;
  /** Lo que lleva (si viene del probador del modo historia). */
  pieces?: string[];
  /** Atributos de tu reina si vienen del modo historia. */
  attrs?: LsAttrs;
}

const shuffle = <T,>(a: T[], rnd: () => number = Math.random) => a.map((v) => [rnd(), v] as const).sort((x, y) => x[0] - y[0]).map((x) => x[1]);
let seq = 0;

/** `preset`: el look ya viene del probador (su estilo y las piezas que lleva); se salta el paso de elegir look. */
export function startRunway(queenId: string, rnd: () => number = Math.random, mode: RunwayState["mode"] = juradoListo() ? "concepto" : "clasica", temaName?: string, preset?: { look: Tag; pieces: string[]; attrs?: LsAttrs }) {
  const temas = TEMAS_PASARELA.filter((t) => !t.rv);
  const tema = temas.find((t) => t.n === temaName) || temas[Math.floor(rnd() * temas.length)];
  const catTag = tema.tag;
  const others = shuffle(TAGS.filter((t) => t !== catTag), rnd).slice(0, 2);
  const otherTag = shuffle(TAGS.filter((t) => t !== catTag), rnd)[0];
  const voices = shuffle<{ k: Voice; t: string }>([
    { k: "buena", t: VOICEOVERS[catTag][Math.floor(rnd() * 2)] },
    { k: "otra", t: VOICEOVERS[otherTag][Math.floor(rnd() * 2)] },
    { k: "mala", t: VOICE_OFF[Math.floor(rnd() * VOICE_OFF.length)] },
  ], rnd);
  set({
    screen: "runway",
    queenId,
    rw: { id: ++seq, mode, cat: tema.n, theme: tema.d, catTag, look: null, lookOpts: shuffle([catTag, ...others], rnd), step: 0, pos: 0, done: false, waiting: false, points: [], msg: "", good: null, anim: "", animN: 0, voices, concept: "", moments: [], picks: [], qa: null, ana: 0, anaAnswer: "", reveal: false, lines: null, score: null, pieces: preset?.pieces, attrs: preset?.attrs },
  });
  if (preset) chooseLook(preset.look);
}

const next = (p: Partial<RunwayState>) => { const rw = get().rw!; set({ rw: { ...rw, ...p, animN: rw.animN + 1 } }); };
/** Cambia el estado sin mover a la reina (esperas, textos). */
const patch = (p: Partial<RunwayState>) => set({ rw: { ...get().rw!, ...p } });
const still = (id: number) => get().rw?.id === id;
const attrs = () => get().rw?.attrs || queenOf(get().queenId).ls;

export function chooseLook(tag: Tag) {
  const rw = get().rw;
  if (!rw || rw.step !== 0) return;
  if (rw.mode === "concepto") return patch({ look: tag, step: 1, msg: "", good: null });
  // El look cuenta en la nota: el estilo que pide la categoría es lo que el jurado espera
  const fits = tag === rw.catTag;
  next({ look: tag, step: 1, pos: 1, points: [fits ? 90 : 55], msg: fits ? "✨ El look es justo lo que pedía la categoría" : "Bonito... pero no es lo que pedía la categoría", good: fits, anim: "walk" });
}

// ---------- Clásica ----------
export function chooseWalk(w: Walk) {
  const rw = get().rw;
  if (!rw || rw.mode !== "clasica" || rw.step !== 1 || !rw.look) return;
  const pts = walkPoints(w, rw.look);
  const ok = w === WALK_OF_TAG[rw.look];
  next({ step: 2, pos: 2, points: [...rw.points, pts], msg: ok ? "✨ El paso y el look van de la mano" : "Bien caminado... pero no pega con lo que llevas", good: ok, anim: "walk" });
}
export function chooseMoment(m: Moment, rnd: () => number = Math.random) {
  const rw = get().rw;
  if (!rw || rw.mode !== "clasica" || rw.step !== 2 || !rw.look) return;
  const a = attrs();
  const revealOk = m === "reveal" ? revealSucceeds({ performance: a.performance, carisma: a.carisma, roll: rnd() }) : undefined;
  const pts = momentPoints({ moment: m, cat: rw.cat, look: rw.look, revealOk });
  const msg = m === "reveal" ? (revealOk ? "🎁 ¡REVEAL! El público se viene arriba" : "😱 ¡Traje atascado! El reveal no se abre...") : m === "pose" ? "📸 Pose limpia. El fotógrafo, contento." : pts >= 90 ? "😂 ¡Carcajada en el jurado!" : "El gesto no casaba con el look...";
  next({ step: 3, pos: 3, points: [...rw.points, pts], msg, good: pts >= 80, anim: m === "reveal" && !revealOk ? "stuck" : m });
}
export function chooseVoice(v: Voice) {
  const rw = get().rw;
  if (!rw || rw.mode !== "clasica" || rw.step !== 3) return;
  const points = [...rw.points, voicePoints(v)];
  next({ step: 4, pos: 4, done: true, points, msg: v === "buena" ? "El jurado asiente: esa frase lo resume todo" : v === "otra" ? "Bonita frase... para otra categoría" : "Silencio en la mesa del jurado", good: v === "buena", anim: "voice", score: Math.round(runwayScore(points)) });
}

// ---------- Con concepto ----------
const ctxOf = (rw: RunwayState) => ({ cat: rw.cat, theme: rw.theme, pieces: rw.pieces?.length ? rw.pieces : LOOK_PIECES[rw.look || rw.catTag] || [] });

/** La reina cuenta la idea de su look; llegan los momentos de desfile y la pregunta de Ana. */
export async function submitConcept(text: string, rnd: () => number = Math.random) {
  const rw = get().rw;
  const concept = text.trim().slice(0, 140);
  if (!rw || rw.mode !== "concepto" || rw.step !== 1 || rw.waiting || !concept) return;
  patch({ concept, waiting: true });
  const P = momentsPrompt({ ...ctxOf(rw), concept });
  const r = await ask(P.system, P.user, P.opts);
  if (!still(rw.id)) return;
  if (!r) {
    // Sin respuesta: sale con la pasarela clásica, desde el paso
    const fits = rw.look === rw.catTag;
    return next({ mode: "clasica", waiting: false, step: 1, pos: 1, points: [fits ? 90 : 55], msg: "Sales a la pasarela con tu paso de siempre", good: null, anim: "walk" });
  }
  const got = parseMoments(r, { clean: cleanLine, shuffle: (a) => shuffle(a, rnd), reveal: true });
  next({ waiting: false, step: 2, pos: 1, moments: got.moments, qa: got.qa, msg: "", good: null, anim: "walk" });
}

/** Elige un momento del desfile (entrada, detalle y final). */
export function chooseConceptMoment(j: number, rnd: () => number = Math.random) {
  const rw = get().rw;
  if (!rw || rw.mode !== "concepto" || rw.step < 2 || rw.step > 4 || rw.waiting) return;
  const m = rw.moments[rw.step - 2];
  const o = m && m.opts[j];
  if (!o) return;
  const isReveal = o === REVEAL_OPT;
  let anim = rw.step === 2 ? "walk" : rw.step === 3 ? "detalle" : "pose";
  let msg = o;
  let reveal = rw.reveal;
  if (isReveal) {
    const a = attrs();
    reveal = revealSucceeds({ performance: a.performance, carisma: a.carisma, roll: rnd() });
    anim = reveal ? "reveal" : "stuck";
    msg = reveal ? "🎁 ¡REVEAL! El público se viene arriba" : "😱 ¡Traje atascado! El reveal no se abre...";
  }
  const pick = `${m.k}: ${isReveal ? (reveal ? "hace un reveal" : "intenta un reveal pero el traje se atasca") : o}`;
  const picks = [...rw.picks, pick];
  const step = rw.step + 1;
  next({ step, pos: Math.min(3, rw.step), picks, reveal, msg, good: isReveal ? reveal : null, anim });
  if (step === 5 && !rw.qa) void judge();
}

/** Responde a Ana: defender bien la moda suma. */
export function answerAna(j: number) {
  const rw = get().rw;
  const x = rw?.qa?.a[j];
  if (!rw || rw.mode !== "concepto" || rw.step !== 5 || rw.waiting || !x) return;
  patch({ ana: anaBonus(x.k), anaAnswer: `Ana le preguntó «${rw.qa!.q}» y respondió: «${x.t}».`, msg: x.t });
  void judge();
}

async function judge() {
  const rw = get().rw!;
  patch({ waiting: true });
  const P = judgePrompt({ ...ctxOf(rw), concept: rw.concept, picks: rw.picks, reveal: rw.reveal, anaAnswer: rw.anaAnswer });
  const r = await ask(P.system, P.user, P.opts);
  if (!still(rw.id)) return;
  const v = parseVerdict(r);
  const a = attrs();
  const score = conceptScore({ v, estilo: a.estilo, performance: a.performance, reveal: rw.reveal, cat: rw.cat, ana: get().rw!.ana });
  const lines = v.ok ? { supreme: cleanLine(v.supreme), ana: cleanLine(v.ana) } : null;
  next({ waiting: false, done: true, step: 6, pos: 4, score, lines, msg: `Tu concepto: «${rw.concept}»`, good: score >= 70, anim: "voice" });
}

export const WALK_OPTS = WALKS;
