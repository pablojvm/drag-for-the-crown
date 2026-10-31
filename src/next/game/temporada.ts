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
export interface UtView { opts: T.UtOption[]; scene: (T.UtScene & { key: string; answered?: number }) | null; talked: string[] }
export interface TsView {
  view: "elige" | "reina" | "juego";
  seasonId?: string;
  s: T.Season | null;
  maxi: MaxiView | null;
  /** Lo que dice el jurado en los resultados (por reina). */
  crit: Record<string, string[]>;
  ut: UtView | null;
  /** Segunda Oportunidrag: las dos que bailan por volver. */
  pair: [string, string] | null;
  bg: "werkroom" | "stage";
}
const KEY = "dftc-next-temporada";
/** Cuántas conversaciones caben en un Untucked. */
export const UT_TALKS = 2;

let S: T.Season | null = null;
let maxi: Maxi | null = null;
let st: StepsState = newSteps();
let stepIdx = 0;
let cur: Step | null = null;
let timer: ReturnType<typeof setTimeout> | undefined;
/** Pausa entre una decisión y la siguiente (las pruebas la acortan). `meLast` es solo para las pruebas: tu nota, la peor. */
export const timing = { next: 1300, meLast: false };

/** Azar con semilla: avanza con la partida y se guarda con ella. */
const rnd = () => {
  const [v, n] = nextRandom(S!.seed);
  S!.seed = n;
  return v;
};
const pick = <U,>(a: U[]) => a[Math.floor(rnd() * a.length)];
const view = () => get().ts!;
const show = (p: Partial<TsView> = {}) => set({ ts: { ...view(), s: S ? { ...S } : null, ...p } });
const save = () => {
  try {
    if (S && S.phase !== "fin") localStorage.setItem(KEY, JSON.stringify(S));
    else localStorage.removeItem(KEY);
  } catch { /* sin almacenamiento */ }
};
const toPlato = (bg: TsView["bg"] = "werkroom", p: Partial<TsView> = {}) => {
  set({ screen: "temporada", back: null, queenId: S ? S.queen : get().queenId });
  show({ view: "juego", bg, ...p });
  send({ type: "scene", key: "Plato" });
};
const commit = (bg: TsView["bg"], p: Partial<TsView> = {}) => {
  save();
  toPlato(bg, p);
};

export function hasSaved(): boolean {
  try { return !!localStorage.getItem(KEY); } catch { return false; }
}
/** Abre el modo temporada: elegir temporada (o seguir la guardada). */
export function openSeasons() {
  S = null;
  set({ screen: "temporada", back: null, ts: { view: "elige", s: null, maxi: null, crit: {}, ut: null, pair: null, bg: "werkroom" } });
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
  if (S.twist === "suerte") S.news = [S.luck === T.ME ? "🍀 Abres tu cajita... ¡tienes la reina de la suerte! Nadie más lo sabe." : "🍀 Abres tu cajita... vacía. Alguna compañera tiene la reina de la suerte."];
  commit("werkroom");
}
export function resume() {
  try {
    const d = JSON.parse(localStorage.getItem(KEY) || "null");
    if (!d || d.v !== 2) return openSeasons();
    S = d;
  } catch { return openSeasons(); }
  setLookSeason(S!.seasonId);
  set({ ts: { view: "juego", s: null, maxi: null, crit: {}, ut: null, pair: null, bg: "werkroom" } });
  // Si se cerró a mitad de algo, se retoma en el punto seguro más cercano
  if (S!.phase === "reto") S!.phase = "anuncio";
  if (S!.phase === "pasarela") return goRunway();
  if (S!.phase === "untucked") S!.phase = "resultados";
  if (S!.phase === "lipsync") {
    if (S!.final) S!.phase = "final";
    else if (S!.week?.rows) return toLipSync();
    else S!.phase = "regreso";
  }
  toPlato(S!.phase === "anuncio" ? "werkroom" : "stage", { crit: critsOf(S!) });
}
const critsOf = (s: T.Season) => {
  const w = s.week;
  if (!w?.rows) return {};
  const crit: Record<string, string[]> = {};
  [w.rows[0].key, ...w.rows.slice(-2).map((r) => r.key), ...(s.alive.includes(T.ME) ? [T.ME] : [])].forEach((k) => (crit[k] = T.critique(s, k, pick)));
  return crit;
};

// ---------- El reto ----------
export function goReto() {
  if (!S || S.phase !== "anuncio" || !S.week) return;
  const w = S.week;
  const mate = (key: string) => ({ key, name: T.nameOf(S!, key) });
  const mates = S.alive.filter((k) => k !== T.ME).map(mate);
  const prevWin = S.alive.find((k) => (S!.track[k] || [])[S!.ep - 2] === "WIN");
  maxi = MAXI[w.tipo].make({
    attrs: T.attrsOf(S, T.ME), rnd, mates,
    team: w.teams ? w.teams[0].filter((k) => k !== T.ME).map(mate) : undefined,
    giver: prevWin && prevWin !== T.ME ? { ...mate(prevWin), rel: S.rel[prevWin] || 0 } : null,
  });
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
  show({ maxi: { title: maxi.title, icon: maxi.icon, n: Math.min(stepIdx, maxi.steps.length), q: cur.q, sub: cur.sub, opts: cur.opts.map((o) => ({ t: o.t, d: o.d })), msg: "", picked: null, focus: maxi.meters ? Math.round(st.focus) : null, note: st.note || "" } });
  st.note = "";
}
export function pickOption(k: number) {
  const m = view().maxi;
  if (!S || !maxi || !cur || !m || m.picked !== null || !cur.opts[k]) return;
  const r = cur.opts[k].go(st) || {};
  applyPick(st, r);
  if (r.rel) S = T.changeRel(S, r.rel.key, r.rel.d);
  cur = null;
  show({ maxi: { ...m, picked: k, msg: r.msg || "", focus: maxi.meters ? Math.round(Math.max(0, Math.min(100, st.focus))) : null } });
  timer = setTimeout(nextStep, r.msg ? timing.next : Math.min(450, timing.next));
}
function endReto() {
  S!.week!.reto = Math.round(stepsScore(st, maxi!));
  const noRunway = MAXI[S!.week!.tipo].noRunway;
  maxi = null;
  if (noRunway) return toResults();
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
function toResults() {
  S = T.scoreWeek(S!, rnd, timing.meLast ? { [T.ME]: 1 } : {});
  commit("stage", { crit: critsOf(S), maxi: null });
}
/** El botón de volver de la pasarela o del lip sync. */
export function backFromScene() {
  if (!S) return;
  if (S.phase === "pasarela") {
    const rw = get().rw;
    if (!rw?.done) return;
    S.week!.runway = rw.score ?? 50;
    return toResults();
  }
  if (S.phase === "lipsync") {
    const ls = get().ls;
    if (!ls?.done) return;
    const won = ls.mine >= ls.rival;
    const [win, lose] = won ? [T.ME, ls.rivalId] : [ls.rivalId, T.ME];
    if (S.final) { S.phase = "final"; return applyFinal(win, lose); }
    if (!S.week?.rows) { S.phase = "regreso"; return afterRepesca(win); }
    afterLipSync(win, lose);
  }
}

// ---------- Untucked ----------
export function goUntucked() {
  if (!S || S.phase !== "resultados") return;
  S.phase = "untucked";
  show({ ut: { opts: T.untuckedOptions(S, rnd), scene: null, talked: [] } });
}
export function talkTo(key: string) {
  const ut = view().ut;
  if (!S || !ut || ut.scene || ut.talked.length >= UT_TALKS || ut.talked.includes(key)) return;
  const o = ut.opts.find((x) => x.key === key)!;
  const sc = T.untuckedScene(S, o, rnd);
  if (!sc.choices) S = T.changeRel(S, key, sc.rel);
  show({ ut: { ...ut, scene: { ...sc, key }, talked: [...ut.talked, key] } });
}
export function answerUt(i: number) {
  const ut = view().ut;
  const c = ut?.scene?.choices?.[i];
  if (!S || !ut?.scene || !c || ut.scene.answered !== undefined) return;
  S = T.changeRel(S, ut.scene.key, c.rel);
  show({ ut: { ...ut, scene: { ...ut.scene, answered: i, lines: [...ut.scene.lines, [T.nameOf(S, T.ME), c.txt], c.reply] } } });
}
export function closeTalk() {
  const ut = view().ut;
  if (ut) show({ ut: { ...ut, scene: null } });
}
/** Se acaba el Untucked: antes del lip sync, las dinámicas de la temporada. */
export function endUntucked() {
  if (!S || S.phase !== "untucked") return;
  S = T.rivalsDecide(S, rnd);
  if (T.myDecision(S)) {
    S.phase = "decision";
    return commit("stage", { ut: null });
  }
  show({ ut: null });
  toLipSync();
}

// ---------- Suerte, corazón y moneda ----------
/** Reina de la suerte o corazón: salvar a una del bottom (o null para guardarla). */
export function useSave(key: string | null) {
  if (!S || S.phase !== "decision") return;
  const how = T.myDecision(S);
  if (key && (how === "suerte" || how === "corazon")) S = T.saveFromBottom(S, key, T.ME, how);
  toLipSync();
}
/** La moneda: tu voto (si estás a salvo) y el resultado. */
export function coin(vote?: string) {
  if (!S || S.phase !== "decision" || S.week?.coin) return;
  S = T.flipCoin(S, rnd, vote);
  commit("stage");
}
export function toLipSync() {
  if (!S || !S.week?.bottom) return;
  const dancers = S.week.bottom;
  if (T.myLipSync(S)) {
    S.phase = "lipsync";
    save();
    return playLipSync(dancers.find((k) => k !== T.ME)!, "Ver el veredicto");
  }
  const [win, lose] = T.simLipSync(S, dancers[0], dancers[1], rnd);
  afterLipSync(win, lose);
}
function playLipSync(rival: string, back: string) {
  set({ back, queenId: S!.queen });
  startLipSync(S!.queen, rnd, { rivalId: rival, form: (S!.form[rival] || 0) + (S!.nemesis === rival ? 3 : 0) });
  send({ type: "scene", key: "LipSync" });
}
function afterLipSync(win: string, lose: string) {
  S = T.lipSyncResult(S!, win, lose, rnd);
  // Corazones: la eliminada (si es una rival) deja su medio corazón al momento
  if (S.heartFrom && S.heartFrom !== T.ME) S = T.giveHeart(S, S.heartFrom, null, rnd);
  commit("stage");
}
/** All Stars: a quién mandas a casa con el pintalabios. */
export function chooseLipstick(key: string) {
  if (!S || S.phase !== "pintalabios") return;
  S = T.lipstick(S, key);
  if (S.heartFrom && S.heartFrom !== T.ME) S = T.giveHeart(S, S.heartFrom, null, rnd);
  commit("stage");
}
/** All Winners: a quién bloqueas. */
export function chooseBlock(key: string) {
  if (!S || S.phase !== "bloqueo") return;
  S = T.block(S, key);
  commit("stage");
}
/** Corazones: te vas y dejas tu medio corazón. */
export function giveMyHeart(key: string) {
  if (!S || S.heartFrom !== T.ME) return;
  S = T.giveHeart(S, T.ME, key, rnd);
  commit("stage");
}

// ---------- Siguiente episodio ----------
export function nextEpisode() {
  if (!S || S.phase !== "veredicto") return;
  S = T.nextWeek(S, rnd);
  if (S.phase === "fuera") return watchWeek();
  commit(S.phase === "anuncio" ? "werkroom" : "stage", { crit: {}, ut: null, pair: S.phase === "regreso" ? T.repescaPair(S, rnd) : null });
}
/** Fuera de la competición: la semana siguiente se ve desde casa (todo se resuelve solo). */
export function watchWeek() {
  if (!S || !S.meOut || S.phase === "fin" || S.heartFrom === T.ME) return;
  // Semana nueva (salvo que ya esté empezada y sin jugar)
  if (!(S.phase === "fuera" && S.week && !S.week.rows)) S = T.nextWeek(S, rnd);
  if (S.phase === "final") return commit("stage", { crit: {} });
  if (S.phase === "regreso") return commit("stage", { pair: T.repescaPair(S, rnd) });
  S = T.scoreWeek(S, rnd);
  S = T.rivalsDecide(S, rnd);
  if (S.twist === "moneda" && S.week!.bottom!.length === 3) S = T.flipCoin(S, rnd);
  const [a, b] = S.week!.bottom!;
  const [win, lose] = T.simLipSync(S, a, b, rnd);
  S = T.lipSyncResult(S, win, lose, rnd);
  if (S.heartFrom) S = T.giveHeart(S, S.heartFrom, null, rnd);
  S.phase = "fuera";
  commit("stage", { crit: critsOf(S) });
}
/** Terminar la temporada aquí (cuando ya estás fuera). */
export function endSeason() {
  if (!S) return;
  S = { ...S, phase: "fin" };
  commit("stage");
}

// ---------- Segunda Oportunidrag ----------
export function goRepesca() {
  if (!S || S.phase !== "regreso") return;
  const pair = view().pair || T.repescaPair(S, rnd);
  if (pair.includes(T.ME)) {
    S.phase = "lipsync";
    save();
    return playLipSync(pair.find((k) => k !== T.ME)!, "Continuar");
  }
  const [win] = T.simLipSync(S, pair[0], pair[1], rnd);
  afterRepesca(win);
}
function afterRepesca(win: string) {
  S = T.repescaResult(S!, win);
  if (S.meOut) S.phase = "fuera";
  commit("stage", { pair: null });
}

// ---------- La final: dos lip syncs y la corona ----------
export function finalNext() {
  if (!S || S.phase !== "final" || !S.final) return;
  const f = S.final;
  const duel: [string, string] = f.semis.length < 2 ? f.pairs[f.semis.length] : [f.semis[0], f.semis[1]];
  if (duel.includes(T.ME)) {
    S.phase = "lipsync";
    save();
    return playLipSync(duel[0] === T.ME ? duel[1] : duel[0], "Continuar");
  }
  const [win, lose] = T.simLipSync(S, duel[0], duel[1], rnd);
  applyFinal(win, lose);
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
  S.news = [...s.news, line];
  commit("stage");
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
