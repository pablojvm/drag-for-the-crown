// Pasarela del motor nuevo: las reglas son las del núcleo (src/core/runway.ts); aquí solo se lleva la partida.
import { CAT_TAG, TAGS, WALKS, VOICEOVERS, VOICE_OFF, walkPoints, momentPoints, voicePoints, runwayScore, revealSucceeds, WALK_OF_TAG, type Tag, type Walk, type Moment, type Voice } from "../../core/runway";
import { ARCADE_QUEENS } from "./data";
import { lsAttrs } from "./lipsync";
import { get, set } from "../store";

export interface RunwayState {
  cat: string;
  catTag: Tag;
  look: Tag | null;
  lookOpts: Tag[];
  step: number; // 0 look · 1 paso · 2 momento final · 3 voz en off · 4 terminado
  points: number[];
  msg: string;
  good: boolean | null;
  anim: string; // lo que tiene que hacer la reina en la escena: "walk", "pose", "comedia", "reveal", "stuck", "voice"
  animN: number;
  voices: { k: Voice; t: string }[];
  score: number | null;
}

const shuffle = <T,>(a: T[], rnd: () => number) => a.map((v) => [rnd(), v] as const).sort((x, y) => x[0] - y[0]).map((x) => x[1]);

export function startRunway(queenId: string, rnd: () => number = Math.random) {
  const cats = Object.keys(CAT_TAG);
  const cat = cats[Math.floor(rnd() * cats.length)];
  const catTag = CAT_TAG[cat];
  const others = shuffle(TAGS.filter((t) => t !== catTag), rnd).slice(0, 2);
  const otherTag = shuffle(TAGS.filter((t) => t !== catTag), rnd)[0];
  const voices = shuffle<{ k: Voice; t: string }>([
    { k: "buena", t: VOICEOVERS[catTag][Math.floor(rnd() * 2)] },
    { k: "otra", t: VOICEOVERS[otherTag][Math.floor(rnd() * 2)] },
    { k: "mala", t: VOICE_OFF[Math.floor(rnd() * VOICE_OFF.length)] },
  ], rnd);
  set({ screen: "runway", queenId, rw: { cat, catTag, look: null, lookOpts: shuffle([catTag, ...others], rnd), step: 0, points: [], msg: "", good: null, anim: "", animN: 0, voices, score: null } });
}

const next = (p: Partial<RunwayState>) => { const rw = get().rw!; set({ rw: { ...rw, ...p, animN: rw.animN + 1 } }); };

export function chooseLook(tag: Tag) {
  const rw = get().rw;
  if (!rw || rw.step !== 0) return;
  // El look cuenta en la nota: el estilo que pide la categoría es lo que el jurado espera
  const fits = tag === rw.catTag;
  next({ look: tag, step: 1, points: [fits ? 90 : 55], msg: fits ? "✨ El look es justo lo que pedía la categoría" : "Bonito... pero no es lo que pedía la categoría", good: fits, anim: "walk" });
}
export function chooseWalk(w: Walk) {
  const rw = get().rw;
  if (!rw || rw.step !== 1 || !rw.look) return;
  const pts = walkPoints(w, rw.look);
  const ok = w === WALK_OF_TAG[rw.look];
  next({ step: 2, points: [...rw.points, pts], msg: ok ? "✨ El paso y el look van de la mano" : "Bien caminado... pero no pega con lo que llevas", good: ok, anim: "walk" });
}
export function chooseMoment(m: Moment, rnd: () => number = Math.random) {
  const rw = get().rw;
  if (!rw || rw.step !== 2 || !rw.look) return;
  const q = ARCADE_QUEENS.find((x) => x.id === get().queenId)!;
  const a = lsAttrs(q);
  const revealOk = m === "reveal" ? revealSucceeds({ performance: a.performance, carisma: a.carisma, roll: rnd() }) : undefined;
  const pts = momentPoints({ moment: m, cat: rw.cat, look: rw.look, revealOk });
  const msg = m === "reveal" ? (revealOk ? "🎁 ¡REVEAL! El público se viene arriba" : "😱 ¡Traje atascado! El reveal no se abre...") : m === "pose" ? "📸 Pose limpia. El fotógrafo, contento." : pts >= 90 ? "😂 ¡Carcajada en el jurado!" : "El gesto no casaba con el look...";
  next({ step: 3, points: [...rw.points, pts], msg, good: pts >= 80, anim: m === "reveal" && !revealOk ? "stuck" : m });
}
export function chooseVoice(v: Voice) {
  const rw = get().rw;
  if (!rw || rw.step !== 3) return;
  const points = [...rw.points, voicePoints(v)];
  next({ step: 4, points, msg: v === "buena" ? "El jurado asiente: esa frase lo resume todo" : v === "otra" ? "Bonita frase... para otra categoría" : "Silencio en la mesa del jurado", good: v === "buena", anim: "voice", score: Math.round(runwayScore(points)) });
}

export const WALK_OPTS = WALKS;
