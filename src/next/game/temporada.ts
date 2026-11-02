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
import { juradoListo, ask } from "./jurado";
import { cleanLine } from "../../core/guion";
import { aiMaxiPrompt, maxiFromAI } from "../../core/maxi";
import { charlaPrompt, parseCharla, CHARLA_TURNOS, type Msg } from "../../core/charla";
import { roleInfo } from "../../core/taller";
import { unlock } from "./logros";
import { touch, recordSeason, storyWins } from "./cuenta";
import { trackSnap } from "./track";
import { addMoney, buy } from "./closet";
import { outfitScore, prendaById, slotOf, TAG_OF_STYLE, SLOTS, type Slot } from "../../core/armario";
import { TEMAS_PASARELA } from "../../core/temas";
import type { Tag } from "../../core/runway";

export interface MaxiView { title: string; icon: string; n: number; q?: string; sub?: string; opts: { t: string; d?: string }[]; msg: string; picked: number | null; focus: number | null; note: string; game?: { kind: "ritmo" | "costura"; label: string; hard: number; played?: boolean } }
export interface UtView { opts: T.UtOption[]; scene: (T.UtScene & { key: string; answered?: number }) | null; talked: string[] }
export interface ReunionView { intro: [string, string][]; talks: T.ReunionTalk[]; talk: (T.ReunionTalk & { answered?: number }) | null; talked: string[]; drama: [string, string][] | null }
export interface FreeView { key: string; where: "untucked" | "taller"; hist: Msg[]; waiting: boolean }
export interface TsView {
  view: "elige" | "custom" | "reina" | "juego";
  /** All Stars a tu gusto: las reinas elegidas. */
  custom?: string[];
  /** Charla libre con una compañera. */
  free?: FreeView | null;
  seasonId?: string;
  s: T.Season | null;
  maxi: MaxiView | null;
  /** Lo que dice el jurado en los resultados (por reina). */
  crit: Record<string, [string, string][]>;
  ut: UtView | null;
  /** Segunda Oportunidrag: las dos que bailan por volver. */
  pair: [string, string] | null;
  bg: "werkroom" | "stage";
  reunion?: ReunionView | null;
  /** Mientras se escribe el reto en directo. */
  writing?: boolean;
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
/** Pausa entre una decisión y la siguiente (las pruebas la acortan). `myScore` y `autoGame` son solo para las pruebas: tu nota de la semana y la de los minijuegos. */
export const timing = { next: 1300, myScore: null as number | null, autoGame: null as number | null };

/** Azar con semilla: avanza con la partida y se guarda con ella. */
const rnd = () => {
  const [v, n] = nextRandom(S!.seed);
  S!.seed = n;
  return v;
};
const view = () => get().ts!;
const show = (p: Partial<TsView> = {}) => set({ ts: { ...view(), s: S ? { ...S } : null, ...p } });
const save = () => {
  try {
    if (S && S.phase !== "fin") localStorage.setItem(KEY, JSON.stringify(S));
    else localStorage.removeItem(KEY);
  } catch { /* sin almacenamiento */ }
  touch();
};
const toPlato = (bg: TsView["bg"] = "werkroom", p: Partial<TsView> = {}) => {
  set({ screen: "temporada", back: null, queenId: S ? S.queen : get().queenId });
  show({ view: "juego", bg, ...p });
  send({ type: "scene", key: "Plato" });
};
const commit = (bg: TsView["bg"], p: Partial<TsView> = {}) => {
  save();
  toPlato(bg, p);
  if (S) unlock(T.logrosNow(S));
  // Temporada terminada: a tu Hall of Fame (y al mundial)
  if (S && S.phase === "fin" && !recorded.has(S.seed)) {
    recorded.add(S.seed);
    recordSeason({ queen: S.queen, season: S.seasonId, won: S.place === 1, place: S.place ?? null, ppe: T.myPpe(S), winsT: (S.track[T.ME] || []).filter((l) => l === "WIN").length, cast: S.cast.length, lsWins: S.lsWins || 0, trackData: trackSnap(S) });
  }
};
const recorded = new Set<number>();

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
  // Bloqueada hasta ganar la anterior (la interfaz ya lo avisa; esto es por si acaso)
  if (!T.desbloqueo(id, storyWins()).ok) return;
  if (id === T.CUSTOM.id) return show({ view: "custom", seasonId: id, custom: view().custom || [] });
  show({ view: "reina", seasonId: id });
}
// ---------- All Stars a tu gusto ----------
export function toggleCustom(id: string) {
  const c = view().custom || [];
  show({ custom: c.includes(id) ? c.filter((x) => x !== id) : c.length >= T.CUSTOM.max ? c : [...c, id] });
}
export function randomCustom(n = 10) {
  const pool = T.customPool().map((id) => [Math.random(), id] as const).sort((a, b) => a[0] - b[0]).map((x) => x[1]);
  show({ custom: pool.slice(0, n) });
}
export function confirmCustom() {
  const c = view().custom || [];
  if (c.length < T.CUSTOM.min) return;
  show({ view: "reina" });
}
export function chooseQueen(id: string, seed = newSeed()) {
  const seasonId = view().seasonId!;
  const cast = seasonId === T.CUSTOM.id ? view().custom : undefined;
  S = { ...T.newSeason(seasonId, id, seed, Math.random, cast), seed };
  setLookSeason(seasonId);
  S = T.nextWeek(S, rnd);
  addMoney(400);
  unlock(["debut"]);
  S.news = ["💶 Producción te da 400 € para el armario de esta temporada."];
  if (S.twist === "suerte") S.news = [...S.news,S.luck === T.ME ? "🍀 Abres tu cajita... ¡tienes la reina de la suerte! Nadie más lo sabe." : "🍀 Abres tu cajita... vacía. Alguna compañera tiene la reina de la suerte."];
  commit("werkroom");
}
export function resume() {
  try {
    const d = JSON.parse(localStorage.getItem(KEY) || "null");
    if (!d || d.v !== 2) return openSeasons();
    // Partidas de antes de los roles, el armario y los logros
    S = { seenRoles: {}, lsWins: 0, fairLipstick: 0, lzDone: false, reunionDone: false, ...d, roles: d.roles || {} };
  } catch { return openSeasons(); }
  setLookSeason(S!.seasonId);
  set({ ts: { view: "juego", s: null, maxi: null, crit: {}, ut: null, pair: null, bg: "werkroom" } });
  // Si se cerró a mitad de algo, se retoma en el punto seguro más cercano
  if (S!.phase === "reto") S!.phase = "taller";
  if (S!.phase === "mini") S!.phase = "anuncio";
  if (S!.phase === "pasarela") return goRunway();
  if (S!.phase === "untucked") S!.phase = "resultados";
  if (S!.phase === "reencuentro") return toPlato("stage", { reunion: reunionView() });
  if (S!.phase === "lipsync") {
    if (S!.final) S!.phase = "final";
    else if (S!.week?.lala && !S!.week.lala.done) S!.phase = "lalaparuza";
    else if (S!.week?.rows) return toLipSync();
    else S!.phase = "regreso";
  }
  toPlato(S!.phase === "anuncio" ? "werkroom" : "stage", { crit: critsOf(S!) });
}
const critsOf = (s: T.Season) => {
  const w = s.week;
  if (!w?.rows) return {};
  const crit: Record<string, [string, string][]> = {};
  [w.rows[0].key, ...w.rows.slice(-2).map((r) => r.key), ...(s.alive.includes(T.ME) ? [T.ME] : [])].forEach((k) => (crit[k] = T.critique(s, k, rnd)));
  return crit;
};

// ---------- El reto ----------
// ---------- Minirreto y taller ----------
export function goMini() {
  if (!S || S.phase !== "anuncio" || !S.week) return;
  S.phase = "mini";
  show();
  if (timing.autoGame != null) miniDone(timing.autoGame);
}
export function miniDone(score: number) {
  if (!S || S.phase !== "mini") return;
  S = T.playMini(S, score, rnd);
  S.week!.scene = T.sceneOf(S, rnd);
  commit("werkroom");
}
export function answerScene(i: number) {
  if (!S || S.phase !== "taller" || !S.week?.scene || S.week.scene.answered !== undefined) return;
  const sc = S.week.scene;
  S = T.applyScene(S, sc, i, rnd);
  const c = sc.choices[i];
  if (c?.bonus) { addMoney(Math.round(c.bonus / 2)); S.news = [...S.news, `💶 +${Math.round(c.bonus / 2)} € por dar que hablar en el taller`]; }
  commit("werkroom");
}

export function goReto() {
  if (!S || S.phase !== "taller" || !S.week || (S.week.scene && S.week.scene.answered === undefined && S.week.scene.choices.length)) return;
  const w = S.week;
  if (w.lala) {
    S.phase = "lalaparuza";
    return commit("stage");
  }
  const mate = (key: string) => ({ key, name: T.nameOf(S!, key) });
  const mates = S.alive.filter((k) => k !== T.ME).map(mate);
  const prevWin = S.alive.find((k) => (S!.track[k] || [])[S!.ep - 2] === "WIN");
  const ctx = {
    attrs: T.attrsOf(S, T.ME), rnd, mates,
    team: w.teams ? w.teams[0].filter((k) => k !== T.ME).map(mate) : undefined,
    giver: prevWin && prevWin !== T.ME ? { ...mate(prevWin), rel: S.rel[prevWin] || 0 } : null,
  };
  const def = MAXI[w.tipo];
  const classic = maxi = def.make(ctx);
  st = newSteps();
  stepIdx = 0;
  S.phase = "reto";
  // Con conexión, el reto (los que son de decisiones) lo escriben en directo; si no llega, el de siempre
  if (juradoListo() && !def.team && !def.noRunway && !classic.steps.some((f) => f(newSteps())?.game)) {
    show({ writing: true, maxi: null });
    const s0 = S;
    const P = aiMaxiPrompt({ titulo: w.titulo, attrs: def.attrs, reina: T.nameOf(S, T.ME), companeras: mates.map((m) => m.name) });
    void ask(P.system, P.user, P.opts).then((r) => {
      if (S !== s0 || S.phase !== "reto") return;
      maxi = maxiFromAI(r, { tipo: w.tipo, title: classic.title, icon: classic.icon, attrs: def.attrs }, ctx, cleanLine) || classic;
      show({ writing: false });
      nextStep();
    });
    return;
  }
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
  const game = cur.game ? { kind: cur.game.kind, label: cur.game.label, hard: cur.game.hard || 0 } : undefined;
  show({ maxi: { title: maxi.title, icon: maxi.icon, n: Math.min(stepIdx, maxi.steps.length), q: cur.q, sub: cur.sub, opts: cur.opts.map((o) => ({ t: o.t, d: o.d })), msg: "", picked: null, focus: maxi.meters ? Math.round(st.focus) : null, note: st.note || "", game } });
  st.note = "";
  if (game && timing.autoGame != null) gameDone(timing.autoGame);
}
export function pickOption(k: number) {
  const m = view().maxi;
  if (!S || !maxi || !cur || !m || m.picked !== null || !cur.opts[k]) return;
  const r = cur.opts[k].go(st) || {};
  applyPick(st, r);
  if (r.rel) S = T.changeRel(S, r.rel.key, r.rel.d, rnd);
  cur = null;
  show({ maxi: { ...m, picked: k, msg: r.msg || "", focus: maxi.meters ? Math.round(Math.max(0, Math.min(100, st.focus))) : null } });
  timer = setTimeout(nextStep, r.msg ? timing.next : Math.min(450, timing.next));
}
/** Termina el minijuego de un paso del reto. */
export function gameDone(score: number) {
  const m = view().maxi;
  if (!S || !maxi || !cur?.game || !m || m.game?.played) return;
  const r = cur.game.go(Math.max(0, Math.min(100, score)), st) || {};
  applyPick(st, r);
  cur = null;
  show({ maxi: { ...m, picked: 0, msg: r.msg || "", game: { ...m.game!, played: true } } });
  timer = setTimeout(nextStep, timing.next);
}
function endReto() {
  S!.week!.reto = Math.round(stepsScore(st, maxi!));
  const noRunway = MAXI[S!.week!.tipo].noRunway;
  maxi = null;
  if (noRunway) return toResults();
  S!.phase = "probador";
  // Propuesta de partida: lo que mejor encaja de tu armario (o nada, y te prestan un básico)
  commit("werkroom", { maxi: null });
}

// ---------- El probador y la tienda ----------
export function setOutfit(slot: Slot, id: string | null) {
  if (!S || S.phase !== "probador") return;
  const o = { ...(S.week!.outfit || {}) };
  if (id) o[slot] = id;
  else delete o[slot];
  S.week = { ...S.week!, outfit: o };
  show();
}
/** Compra en la tienda; si ese hueco del look está vacío, te la pones. */
export function buyItem(id: string) {
  if (!S || S.phase !== "probador" || !buy(id)) return false;
  const slot = slotOf(id);
  if (slot && !(S.week!.outfit || {})[slot]) S.week = { ...S.week!, outfit: { ...(S.week!.outfit || {}), [slot]: id } };
  show();
  return true;
}
export function goPasarela() {
  if (!S || S.phase !== "probador") return;
  S.week!.look = outfitScore(S.week!.outfit || {}, S.week!.tema);
  S.phase = "pasarela";
  save();
  goRunway();
}

// ---------- La pasarela ----------
function goRunway() {
  const s = S!;
  set({ back: "Ir a los resultados", queenId: s.queen });
  const o = s.week!.outfit || {};
  const look = o.look ? prendaById(o.look) : null;
  const tema = TEMAS_PASARELA.find((t) => t.n === s.week!.tema);
  const tag = ((look && TAG_OF_STYLE[look.s]) || tema?.tag || "Glamour") as Tag;
  const pieces = SLOTS.map((k) => (o[k] ? prendaById(o[k]!)?.n : null)).filter(Boolean) as string[];
  startRunway(s.queen, rnd, juradoListo() ? "concepto" : "clasica", s.week!.tema, { look: tag, pieces: pieces.length ? pieces : ["un básico prestado del armario"] });
  send({ type: "scene", key: "Runway" });
}
function toResults() {
  S = T.scoreWeek(S!, rnd, timing.myScore != null ? { [T.ME]: timing.myScore } : {});
  for (const e of T.earnings(S)) { addMoney(e.money); S.news = [...S.news, `💶 +${e.money} €: ${e.why}`]; }
  commit("stage", { crit: critsOf(S), maxi: null });
  liveCritique();
}
/** Con el jurado en directo, tus críticas las escriben Supremme y Ana para esta semana (si no, las de siempre). */
async function liveCritique() {
  if (!S || !juradoListo() || !S.week?.labels) return;
  const s = S, w = s.week!;
  const lab = w.labels![T.ME];
  const nivel = /WIN|TOP2|HIGH/.test(lab) ? "de las mejores" : /BTM|LOW/.test(lab) ? "de las peores" : "del montón";
  // El look va aparte: Ana lo valora por su pasarela, no por el reto
  const look = w.runway == null ? "" : w.runway >= 75 ? "La pasarela le ha salido muy bien." : w.runway >= 50 ? "La pasarela, correcta sin más." : "La pasarela le ha salido mal.";
  const pieces = SLOTS.map((k) => (w.outfit?.[k] ? prendaById(w.outfit[k]!)?.n : null)).filter(Boolean).join(", ") || "un básico prestado";
  const r = await ask(
    "Eres el jurado de Drag Race España: Supremme de Luxe (espectáculo y actitud) y Ana Locking (moda y construcción). Das críticas concretas, con humor y sin crueldad.",
    `La reina ${T.nameOf(s, T.ME)} ha hecho el reto «${w.titulo}» y esta semana ha quedado ${nivel}. ${MAXI[w.tipo].noRunway ? "" : `En la pasarela «${w.tema}» llevaba: ${pieces}. ${look}`} Escribe una crítica de cada una, máximo 25 palabras, dirigida a ella: la de Supremme, coherente con el reto; la de Ana, solo sobre el look y la pasarela. Devuelve JSON {"supreme":"...","ana":"..."}`,
    { json: true, max: 300, temp: 0.8 },
  );
  if (!r || S !== s || S.phase !== "resultados") return;
  const lines = ([["host", cleanLine(r.supreme)], ["judge", cleanLine(r.ana)]] as [string, string][]).filter(([, t]) => t);
  if (lines.length) show({ crit: { ...view().crit, [T.ME]: lines } });
}
/** El botón de volver de la pasarela o del lip sync. */
export function backFromScene() {
  if (!S) return;
  if (S.phase === "pasarela") {
    const rw = get().rw;
    if (!rw?.done) return;
    // La pasarela: lo que haces (70 %) y lo que llevas (30 %)
    S.week!.runway = Math.round((rw.score ?? 50) * 0.7 + (S.week!.look ?? 50) * 0.3);
    return toResults();
  }
  if (S.phase === "lipsync") {
    const ls = get().ls;
    if (!ls?.done) return;
    const won = ls.mine >= ls.rival;
    const [win, lose] = won ? [T.ME, ls.rivalId] : [ls.rivalId, T.ME];
    if (won) S.lsWins = (S.lsWins || 0) + 1;
    if (S.week?.lala && !S.week.lala.done) {
      lalaMine = Math.max(lalaMine, Math.round(Math.min(100, (ls.mine / Math.max(1, ls.rival)) * 60)));
      S.phase = "lalaparuza";
      S = T.lalaDuel(S, ...lalaPair(win, lose), win);
      return afterLala();
    }
    if (S.final) { S.phase = "final"; return applyFinal(win, lose); }
    if (!S.week?.rows) { S.phase = "regreso"; return afterRepesca(win); }
    afterLipSync(win, lose);
  }
}

// ---------- Lalaparuza ----------
let lalaMine = 50;
const lalaPair = (x: string, y: string): [string, string] => {
  const m = T.lalaNext(S!);
  return m && m.a === y ? [y, x] : [x, y];
};
/** Siguiente duelo del torneo: el tuyo lo bailas; los demás se resuelven en el escenario. */
export function lalaStep() {
  if (!S || S.phase !== "lalaparuza") return;
  const m = T.lalaNext(S);
  if (!m) return afterLala();
  if (m.a === T.ME || m.b === T.ME) {
    S.phase = "lipsync";
    save();
    return playLipSync(m.a === T.ME ? m.b! : m.a!, "Continuar");
  }
  const [win, lose] = T.simLipSync(S, m.a!, m.b!, rnd);
  S = T.lalaDuel(S, m.a!, m.b!, win);
  S.news = [...S.news.slice(-3), `${T.nameOf(S, win)} le gana a ${T.nameOf(S, lose)}.`];
  afterLala();
}
function afterLala() {
  if (S!.week!.lala!.done) {
    S = T.lalaFinish(S!, lalaMine, rnd);
    lalaMine = 50;
    return commit("stage", { crit: critsOf(S) });
  }
  commit("stage");
}

// ---------- Reencuentro ----------
export function reunionView(): ReunionView {
  return { intro: T.reunionIntro(rnd), talks: T.reunionTalks(S!, rnd), talk: null, talked: [], drama: null };
}
export function reunionTalk(key: string) {
  const r = view().reunion;
  if (!S || S.phase !== "reencuentro" || !r || r.talk || r.talked.length >= 2 || r.talked.includes(key)) return;
  const t = r.talks.find((x) => x.key === key)!;
  if (!t.choices) S = T.changeRel(S, key, 1, rnd);
  show({ reunion: { ...r, talk: { ...t }, talked: [...r.talked, key] } });
}
export function reunionAnswer(i: number) {
  const r = view().reunion;
  const c = r?.talk?.choices?.[i];
  if (!S || !r?.talk || !c || r.talk.answered !== undefined) return;
  S = T.changeRel(S, r.talk.key, c.rel, rnd);
  if (c.bonus) addMoney(Math.round(c.bonus / 2));
  show({ reunion: { ...r, talk: { ...r.talk, answered: i, lines: [...r.talk.lines, ["me", c.txt], c.reply] } } });
}
export function reunionClose() {
  const r = view().reunion;
  if (r) show({ reunion: { ...r, talk: null } });
}
/** El drama del reencuentro y Miss Simpatía. */
export function reunionMiss() {
  const r = view().reunion;
  if (!S || S.phase !== "reencuentro" || !r || r.drama) return;
  S = T.missSimpatia(S, rnd);
  commit("stage", { reunion: { ...r, talk: null, drama: T.reunionDrama(rnd) } });
}
export function toFinal() {
  if (!S || S.phase !== "reencuentro") return;
  S = T.startFinal({ ...S, news: [] }, rnd);
  commit("stage", { reunion: null });
}

// ---------- Charla libre (con el jurado en directo) ----------
export const canChat = () => juradoListo();
export function startFree(key: string, where: FreeView["where"]) {
  if (!S || !juradoListo()) return;
  if (where === "untucked") {
    const ut = view().ut;
    if (!ut || ut.scene || ut.talked.length >= UT_TALKS || ut.talked.includes(key)) return;
    show({ ut: { ...ut, talked: [...ut.talked, key] }, free: { key, where, hist: [], waiting: false } });
  } else {
    if (S.phase !== "taller" || S.week?.freeUsed) return;
    S.week = { ...S.week!, freeUsed: true };
    show({ free: { key, where, hist: [], waiting: false } });
  }
}
export async function sendFree(text: string) {
  const f = view().free;
  const t = text.trim().slice(0, 200);
  if (!S || !f || f.waiting || !t || f.hist.filter((m) => m.me).length >= CHARLA_TURNOS) return;
  const hist = [...f.hist, { me: true, t }];
  show({ free: { ...f, hist, waiting: true } });
  const s0 = S;
  const w = S.week;
  const P = charlaPrompt({
    reina: T.nameOf(S, f.key), yo: T.nameOf(S, T.ME), donde: f.where === "untucked" ? "el Untucked, mientras el jurado delibera" : "el taller, mientras preparáis el reto",
    rel: S.rel[f.key] || 0, rol: S.roles[f.key] ? roleInfo(S.roles[f.key]) : null, nemesis: S.nemesis === f.key,
    semana: w ? `el reto es «${w.titulo}»${w.labels ? `; en las críticas a ${T.nameOf(S, f.key)} le ha ido ${/WIN|TOP2|HIGH/.test(w.labels[f.key] || "") ? "bien" : /BTM|LOW/.test(w.labels[f.key] || "") ? "mal" : "regular"}` : ""}.` : "",
  }, hist);
  const r = parseCharla(await ask(P.system, P.user, P.opts), cleanLine, rnd);
  if (S !== s0 || view().free?.key !== f.key) return;
  if (r.rel) S = T.changeRel(S, f.key, r.rel, rnd);
  save();
  show({ free: { ...view().free!, hist: [...hist, { me: false, t: r.text }], waiting: false } });
}
export function endFree() {
  if (view().free) show({ free: null });
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
  if (!sc.choices) S = T.changeRel(S, key, sc.rel, rnd);
  show({ ut: { ...ut, scene: { ...sc, key }, talked: [...ut.talked, key] } });
}
export function answerUt(i: number) {
  const ut = view().ut;
  const c = ut?.scene?.choices?.[i];
  if (!S || !ut?.scene || !c || ut.scene.answered !== undefined) return;
  S = T.changeRel(S, ut.scene.key, c.rel, rnd);
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
  if (S.phase === "veredicto") S = T.pickConfesionario(S, rnd);
  // Corazones: la eliminada (si es una rival) deja su medio corazón al momento
  if (S.heartFrom && S.heartFrom !== T.ME) S = T.giveHeart(S, S.heartFrom, null, rnd);
  commit("stage");
}
/** All Stars: a quién mandas a casa con el pintalabios. */
export function chooseLipstick(key: string) {
  if (!S || S.phase !== "pintalabios") return;
  S = T.lipstick(S, key);
  if (S.week?.lipstick === "semana") S.fairLipstick = (S.fairLipstick || 0) + 1;
  if (S.phase === "veredicto") S = T.pickConfesionario(S, rnd);
  if (S.heartFrom && S.heartFrom !== T.ME) S = T.giveHeart(S, S.heartFrom, null, rnd);
  commit("stage");
}
/** All Winners: a quién bloqueas. */
export function chooseBlock(key: string) {
  if (!S || S.phase !== "bloqueo") return;
  S = T.block(S, key);
  S = T.pickConfesionario(S, rnd);
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
  commit(S.phase === "anuncio" ? "werkroom" : "stage", { crit: {}, ut: null, pair: S.phase === "regreso" ? T.repescaPair(S, rnd) : null, reunion: S.phase === "reencuentro" ? reunionView() : null });
}
/** Fuera de la competición: la semana siguiente se ve desde casa (todo se resuelve solo). */
export function watchWeek() {
  if (!S || !S.meOut || S.phase === "fin" || S.heartFrom === T.ME) return;
  // Semana nueva (salvo que ya esté empezada y sin jugar)
  if (!(S.phase === "fuera" && S.week && !S.week.rows)) S = T.nextWeek(S, rnd);
  if (S.phase === "final") return commit("stage", { crit: {} });
  if (S.phase === "regreso") return commit("stage", { pair: T.repescaPair(S, rnd) });
  if (S.phase === "reencuentro") return commit("stage", { reunion: reunionView() });
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
(globalThis as any).__dftcTemporada = { timing, current, open: openSeasons, resume }; // para las pruebas en navegador
