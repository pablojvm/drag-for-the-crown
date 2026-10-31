// Lip sync del motor nuevo: las reglas son las del núcleo (src/core/lipsync.ts); aquí solo se lleva la partida.
import { lsMove, rivalStrength, LS_STEPS, EMOTES, type LsKind, type LsAttrs } from "../../core/lipsync";
import { ARCADE_QUEENS, type ArcadeQueen } from "./data";
import { queenOf } from "./queens";
import { get, set } from "../store";

/** Atributos de lip sync (1 a 10) a partir de las estadísticas del arcade (1 a 5). */
export const lsAttrs = (q: ArcadeQueen): LsAttrs => ({ performance: q.stats.speed * 2, carisma: Math.min(10, q.stats.lives * 2), estilo: q.stats.power * 2 });

const RIVAL_LINES = [
  ["{r} arranca muy segura, mirando a cámara.", "{r} empieza con calma, guardándose algo."],
  ["{r} se marca unas vueltas por todo el escenario.", "{r} baja al suelo y el público grita."],
  ["¡{r} se tira un death drop!", "{r} se quita la peluca y la lanza al aire."],
];

/** Los textos del núcleo van en tercera persona; para ti, en segunda. */
const YOU: Record<string, string> = {
  "¡Uf! Se le va el truco.": "¡Uf! Se te va el truco.",
  "Cada palabra la siente. Se le ve en los ojos.": "Cada palabra la sientes. Se te ve en los ojos.",
  "Se come el escenario de punta a punta.": "Te comes el escenario de punta a punta.",
  "Repite movimiento... el público ya lo ha visto.": "Repites movimiento... el público ya lo ha visto.",
  "Sin energía: ni se mueve.": "Sin energía: ni te mueves.",
};
const toYou = (msg: string) => YOU[msg] || msg;

/** Empieza un lip sync. Sin rival, una del arcade al azar; `form` es la racha de la rival en la temporada. */
export function startLipSync(queenId: string, rnd: () => number = Math.random, o: { rivalId?: string; form?: number } = {}) {
  const others = ARCADE_QUEENS.filter((q) => q.id !== queenId);
  const rivalId = o.rivalId || others[Math.floor(rnd() * others.length)].id;
  set({ screen: "lipsync", queenId, result: null, ls: { rivalId, step: 0, energy: 100, lastTag: "", mine: 0, rival: rivalStrength(queenOf(rivalId).ls, { noise: rnd() * 24 - 12, form: o.form || 0 }), emote: Math.floor(rnd() * EMOTES.length), last: null, anim: 0, done: false } });
}

export function lipSyncMove(kind: LsKind, rnd: () => number = Math.random) {
  const ls = get().ls;
  if (!ls || ls.done) return;
  const me = queenOf(get().queenId);
  const rv = queenOf(ls.rivalId);
  const clim = ls.step >= 4;
  const m = lsMove({ kind, emote: ls.emote, clim, energy: ls.energy, lastTag: ls.lastTag, attrs: me.ls, roll: rnd() });
  const pi = Math.min(2, Math.floor(ls.step / 2));
  const them = RIVAL_LINES[pi][Math.floor(rnd() * 2)].replace("{r}", rv.name);
  const step = ls.step + 1;
  const done = step >= LS_STEPS;
  set({ ls: { ...ls, step, energy: m.energy, lastTag: m.tag, mine: ls.mine + m.imp, emote: Math.floor(rnd() * EMOTES.length), last: { me: toYou(m.msg), them }, anim: ls.anim + 1, done } });
}

/** El público de la rival crece con la canción: al final, su fuerza completa. */
export const rivalSoFar = (ls: { rival: number; step: number }) => ls.rival * (ls.step / LS_STEPS);
