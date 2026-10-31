// Modo temporada del motor nuevo: lleva la partida (reglas en src/core/temporada.ts y src/core/maxi.ts)
// y la pasa a la pantalla. Se guarda en este navegador después de cada fase.
import * as T from "../../core/temporada";
import { MAXI, newSteps, applyPick, stepsScore, type Maxi, type Step, type StepsState } from "../../core/maxi";
import { nextRandom, newSeed } from "../../core/rng";
import { get, set } from "../store";
import { send } from "../bridge";
import { setLookSeason, queenOf } from "./queens";
import { startRunway } from "./runway";
import { startLipSync } from "./lipsync";
import { juradoListo } from "./jurado";

export interface MaxiView { title: string; icon: string; n: number; q?: string; sub?: string; opts: { t: string; d?: string }[]; msg: string; picked: number | null; focus: number | null; note: string }
export interface TsView {
  view: "elige" | "reina" | "juego";
  seasonId?: string;
  s: T.Season | null;
  maxi: MaxiView | null;
  /** Lo que dice el jurado en los resultados (por reina). */
  crit: Record<string, string[]>;
  /** Lo que ha pasado en los lip syncs que no juegas tú. */
  news: string[];
  bg: "werkroom" | "stage";
}
const KEY = "dftc-next-temporada";

let S: T.Season | null = null;
let maxi: Maxi | null = null;
let st: StepsState = newSteps();
let stepIdx = 0;
let cur: Step | null = null;
let timer: ReturnType<typeof setTimeout> | undefined;
/** Pausa entre una decisión y la siguiente (las pruebas la acortan). */
export const timing = { next: 1300 };

/** Azar con semilla: avanza con la partida y se guarda con ella. */
const rnd = () => {
  const [v, n] = nextRandom(S!.seed);
  S!.seed = n;
  return v;
};
const pick = <U,>(a: U[]) => a[Math.floor(rnd() * a.length)];
const view = () => get().ts!;
const show = (p: Partial<TsView>) => set({ ts: { ...view(), s: S ? { ...S } : null, ...p } });
const save = () => { try { if (S && S.phase !== "fin") localStorage.setItem(KEY, JSON.stringify(S)); else localStorage.removeItem(KEY); } catch { /* sin almacenamiento */ } };
const toPlato = (bg: TsView["bg"] = "werkroom") => {
  set({ screen: "temporada", back: null, queenId: S ? S.queen : get().queenId });
  show({ view: "juego", bg });
  send({ type: "scene", key: "Plato" });
};

export function hasSaved(): boolean {
  try { return !!localStorage.getItem(KEY); } catch { return false; }
}
/** Abre el modo temporada: elegir temporada (o seguir la guardada). */
export function openSeasons() {
  S = null;
  set({ screen: "temporada", back: null, ts: { view: "elige", s: null, maxi: null, crit: {}, news: [], bg: "werkroom" } });
  send({ type: "scene", key: "Plato" });
}
export function chooseSeason(id: string) {
  show({ view: "reina", seasonId: id });
}
export function chooseQueen(id: string, seed = newSeed()) {
  const seasonId = view().seasonId!;
  S = { ...T.newSeason(seasonId, id, seed, Math.random), seed };
  setLookSeason(seasonId);
  S = T.nextWeek(S, rnd);
  save();
  toPlato();
}
export function resume() {
  try {
    const d = JSON.parse(localStorage.getItem(KEY) || "null");
    if (!d || d.v !== 1) return openSeasons();
    S = d;
  } catch { return openSeasons(); }
  setLookSeason(S!.seasonId);
  set({ ts: { view: "juego", s: null, maxi: null, crit: {}, news: [], bg: "werkroom" } });
  // Si se cerró a mitad de reto o de pasarela, se repite esa fase
  if (S!.phase === "reto") S!.phase = "anuncio";
  if (S!.phase === "pasarela") return goRunway();
  if (S!.phase === "lipsync") {
    if (!S!.final) return goLipSync();
    S!.phase = "final";
  }
  toPlato(S!.phase === "anuncio" ? "werkroom" : "stage");
}

// ---------- El reto ----------
export function goReto() {
  if (!S || S.phase !== "anuncio" || !S.week) return;
  const mates = S.alive.filter((k) => k !== T.ME).map((key) => ({ key, name: T.nameOf(S!, key) }));
  maxi = MAXI[S.week.tipo].make({ attrs: T.attrsOf(S, T.ME), rnd, mates });
  st = newSteps();
  stepIdx = 0;
  S.phase = "reto";
  nextStep();
}
function nextStep() {
  clearTimeout(timer);
  if (!maxi || !S) return;
  while (stepIdx < maxi.steps.length) {
    cur = maxi.steps[stepIdx++](st);
    if (cur) break;
  }
  if (!cur) return endReto();
  const n = Math.min(stepIdx, maxi.steps.length);
  show({ maxi: { title: maxi.title, icon: maxi.icon, n, q: cur.q, sub: cur.sub, opts: cur.opts.map((o) => ({ t: o.t, d: o.d })), msg: "", picked: null, focus: maxi.meters ? Math.round(st.focus) : null, note: st.note || "" } });
  st.note = "";
}
export function pickOption(k: number) {
  const m = view().maxi;
  if (!S || !maxi || !cur || !m || m.picked !== null || !cur.opts[k]) return;
  const r = cur.opts[k].go(st) || {};
  applyPick(st, r);
  if (r.rel) S.rel[r.rel.key] = Math.max(-3, Math.min(3, (S.rel[r.rel.key] || 0) + r.rel.d));
  cur = null;
  show({ maxi: { ...m, picked: k, msg: r.msg || "", focus: maxi.meters ? Math.round(Math.max(0, Math.min(100, st.focus))) : null } });
  timer = setTimeout(nextStep, r.msg ? timing.next : Math.min(450, timing.next));
}
function endReto() {
  S!.week!.reto = Math.round(stepsScore(st));
  maxi = null;
  S!.phase = "pasarela";
  save();
  goRunway();
}

// ---------- La pasarela ----------
function goRunway() {
  const s = S!;
  set({ back: "Ir a los resultados", queenId: s.queen });
  startRunway(s.queen, rnd, juradoListo() ? "concepto" : "clasica", s.week!.tema);
  send({ type: "scene", key: "Runway" });
}
/** El botón de volver de la pasarela o del lip sync. */
export function backFromScene() {
  if (!S) return;
  if (S.phase === "pasarela") {
    const rw = get().rw;
    if (!rw?.done) return;
    S.week!.runway = rw.score ?? 50;
    S = T.scoreWeek(S, rnd);
    const crit: Record<string, string[]> = {};
    const w = S.week!;
    // Críticas: la ganadora, las de abajo y tú
    [w.rows![0].key, ...w.bottom!, T.ME].forEach((k) => (crit[k] = T.critique(S!, k, pick)));
    save();
    toPlato("stage");
    return show({ crit, news: [] });
  }
  if (S.phase === "lipsync") {
    const ls = get().ls;
    if (!ls?.done) return;
    const won = ls.mine >= ls.rival;
    if (S.final) return finalResult(won, ls.rivalId);
    const other = S.week!.bottom!.find((k) => k !== T.ME)!;
    S = won ? T.settleWeek(S, T.ME, other) : T.settleWeek(S, other, T.ME);
    save();
    toPlato("stage");
    show({ news: [won ? `¡Shantay, you stay! ${T.nameOf(S, other)}, sashay away.` : `${T.nameOf(S, other)} se queda. Tú, sashay away.`] });
  }
}

// ---------- Lip sync y veredicto ----------
export function goLipSync() {
  if (!S || !S.week?.bottom) return;
  const [a, b] = S.week.bottom;
  if (a === T.ME || b === T.ME) {
    S.phase = "lipsync";
    save();
    const rival = a === T.ME ? b : a;
    set({ back: "Ver el veredicto", queenId: S.queen });
    startLipSync(S.queen, rnd, { rivalId: rival, form: S.form[rival] || 0 });
    return send({ type: "scene", key: "LipSync" });
  }
  // Lip sync entre otras dos: se resuelve en el escenario
  const [win, lose] = T.simLipSync(S, a, b, rnd);
  S = T.settleWeek(S, win, lose);
  save();
  show({ news: [`${T.nameOf(S, win)} gana el lip sync. ${T.nameOf(S, lose)}, sashay away.`] });
}
export function nextEpisode() {
  if (!S || S.phase !== "veredicto") return;
  S = T.nextWeek(S, rnd);
  save();
  toPlato(S.phase === "final" ? "stage" : "werkroom");
  show({ crit: {}, news: [] });
}

// ---------- La final: dos lip syncs y la corona ----------
/** Siguiente duelo de la final. Si es tuyo, lo bailas; si no, se resuelve en el escenario. */
export function finalNext() {
  if (!S || S.phase !== "final" || !S.final) return;
  const f = S.final;
  const duel: [string, string] = f.semis.length < 2 ? f.pairs[f.semis.length] : [f.semis[0], f.semis[1]];
  if (duel.includes(T.ME)) {
    S.phase = "lipsync";
    save();
    const rival = duel[0] === T.ME ? duel[1] : duel[0];
    set({ back: "Continuar", queenId: S.queen });
    startLipSync(S.queen, rnd, { rivalId: rival, form: S.form[rival] || 0 });
    return send({ type: "scene", key: "LipSync" });
  }
  const [win, lose] = T.simLipSync(S, duel[0], duel[1], rnd);
  applyFinal(win, lose);
}
function finalResult(won: boolean, rival: string) {
  S!.phase = "final";
  applyFinal(won ? T.ME : rival, won ? rival : T.ME);
}
function applyFinal(win: string, lose: string) {
  const s = S!;
  const crownDuel = s.final!.semis.length >= 2;
  const n = (k: string) => T.nameOf(s, k);
  const line = crownDuel
    ? win === T.ME ? "👑 ¡Ganas la corona!" : `👑 ${n(win)} gana la corona.`
    : win === T.ME ? `Le ganas el lip sync a ${n(lose)} y pasas al duelo por la corona.` : lose === T.ME ? `${n(win)} te gana el lip sync y pasa al duelo por la corona.` : `${n(win)} le gana a ${n(lose)} y pasa al duelo por la corona.`;
  S = crownDuel ? T.crown(s, win) : T.settleSemi(s, win);
  if (!crownDuel && lose === T.ME) S = { ...S, place: 3 };
  save();
  toPlato("stage");
  show({ news: [...(view().news || []), line] });
}

export function leave() {
  clearTimeout(timer);
  S = null;
  maxi = null;
  set({ ts: null, back: null });
  send({ type: "menu" });
}
/** Para las pruebas: la partida en curso. */
export const current = () => S;
export const queenName = (id: string) => queenOf(id).name;
(globalThis as any).__dftcTemporada = { timing, current }; // para las pruebas en navegador
