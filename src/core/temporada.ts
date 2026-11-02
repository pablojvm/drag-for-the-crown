// Temporada del motor nuevo: reglas puras de una temporada completa, con las dinámicas de cada una
// (All Stars y el pintalabios, All Winners y las estrellas, reina de la suerte, corazones, moneda y Segunda Oportunidrag),
// retos en equipo, Untucked y relaciones. Usa las mismas piezas que el modo historia: el dado, las etiquetas de la semana,
// el track record, el rescate del bottom, la moneda y el lip sync simulado.
import { BALANCE } from "./balance";
import { tirarDado, notaDe, notaTuJuego, nivelNota, clamp } from "./dado";
import { bottomSize, weekLabels, previousRank, asLike } from "./week";
import { ppe } from "./track";
import { TEMPORADAS_ES, REINAS_ES, queenStats, baseAttrs, lookRival, type Attrs, type QAttr, type Temporada } from "./reinas";
import { TEMAS_PASARELA } from "./temas";
import { MAXI } from "./maxi";
import { JURADO, bancoReto } from "./textos";
import { HISTORIA, TEMPORADAS_HISTORIA } from "./historia";
import { rescueFromBottom, coinResult, lipstickKind } from "./dinamicas";
import { allWinnersCut } from "./finales";
import { assignRoles, tallerScene, confesionario, fillText, nemesisBirth, nemesisUntucked, MINIS, miniRival, type Scene } from "./taller";
import type { Outfit } from "./armario";
import { lalaStart, lalaPending, lalaResolve, lalaScores, type Lala } from "./lala";
import { REENCUENTRO, NEMESIS } from "./historia";

export const ME = "me";
export type Twist = "normal" | "allstars" | "winners" | "suerte" | "corazon" | "moneda" | "repesca";
export type Phase =
  | "anuncio" // el reto de la semana
  | "mini" // el minirreto
  | "taller" // una escena en el taller
  | "reto"
  | "probador" // eliges el look para la pasarela
  | "pasarela"
  | "resultados" // críticas
  | "untucked"
  | "decision" // suerte, corazón o moneda (antes del lip sync)
  | "lipsync" // el tuyo, en el escenario
  | "pintalabios" // All Stars: la ganadora del lip sync elige a quién manda a casa
  | "bloqueo" // All Winners: la ganadora del lip sync bloquea a una
  | "veredicto"
  | "regreso" // Segunda Oportunidrag
  | "lalaparuza" // torneo de lip syncs (en lugar del reto)
  | "reencuentro" // antes de la final: vuelven las eliminadas
  | "final"
  | "fuera" // te han eliminado: puedes seguir viendo la temporada
  | "fin";
export interface Week {
  tipo: string;
  titulo: string;
  tema: string;
  reto?: number;
  runway?: number;
  /** Ventaja para el reto (minirreto ganado, decisiones en el taller). */
  adv?: number;
  /** Minirreto de la semana: cuál, tu nota, la ganadora y las notas de todas. */
  mini?: { id: string; me?: number; winner?: string; scores?: Record<string, number> };
  /** Escena del taller de esta semana (y lo que elegiste). */
  scene?: Scene & { answered?: number };
  /** Lo que llevas en la pasarela y su nota de estilismo. */
  outfit?: Outfit;
  look?: number;
  /** Lalaparuza: el cuadro del torneo. */
  lala?: Lala;
  /** Ya has charlado libremente en el taller esta semana. */
  freeUsed?: boolean;
  /** Lo que dice una compañera de ti en el confesionario. */
  conf?: { key: string; text: string };
  /** Retos en equipo: los dos equipos (el primero, el tuyo) y quién capitanea cada uno. */
  teams?: [string[], string[]];
  captains?: [string, string];
  winTeam?: 0 | 1;
  rows?: { key: string; s: number }[];
  labels?: Record<string, string>;
  /** Las que bailan para quedarse (o, en All Stars y All Winners, las del top que bailan por la victoria). */
  bottom?: string[];
  /** Salvadas antes del lip sync (suerte, corazón o moneda) y por quién. */
  saves?: { key: string; by: string; how: "suerte" | "corazon" | "moneda" }[];
  coin?: { cara: boolean; options: string[]; votes: Record<string, string[]>; chosen: string; pair: string[]; myVote?: string };
  /** Ganadora del lip sync. */
  lsWin?: string;
  saved?: string;
  out?: string | null;
  /** All Stars: cómo se juzga la decisión del pintalabios. */
  lipstick?: "semana" | "trayectoria" | "jugarreta";
  /** Quién ha hablado contigo en el Untucked. */
  talked?: string[];
}
export interface FinalState { pairs: [string, string][]; semis: string[]; crown?: string; runnerUp?: string }
export interface Season {
  v: 2;
  seasonId: string;
  twist: Twist;
  queen: string;
  cast: string[];
  seed: number;
  ep: number;
  phase: Phase;
  alive: string[];
  out: string[];
  meOut: boolean;
  track: Record<string, string[]>;
  record: Record<string, number>;
  form: Record<string, number>;
  rel: Record<string, number>;
  nemesis: string | null;
  plan: string[];
  temas: string[];
  week: Week | null;
  final: FinalState | null;
  stars: Record<string, number>;
  /** All Winners: la bloqueada (no puede ganar estrella esta semana). */
  blocked: string | null;
  /** Reina de la suerte: quién la tiene (null si ya se usó). */
  luck: string | null;
  hearts: Record<string, number>;
  /** Corazones: la eliminada que tiene que dejar su medio corazón. */
  heartFrom: string | null;
  repescaDone: boolean;
  /** Roles detrás de cámaras de las rivales y cuántas escenas suyas has visto. */
  roles: Record<string, string>;
  seenRoles: Record<string, number>;
  /** Para los logros: lip syncs que has ganado y veces que has sacado el pintalabios con justicia. */
  lsWins: number;
  fairLipstick: number;
  lzDone: boolean;
  reunionDone: boolean;
  miss?: string;
  /** Nombre corto de cada episodio (para la cabecera del track record). */
  epNames?: string[];
  news: string[];
  place?: number;
}

const shuffle = <T,>(a: T[], rnd: () => number) => a.map((v) => [rnd(), v] as const).sort((x, y) => x[0] - y[0]).map((x) => x[1]);
const pickR = <T,>(a: T[], rnd: () => number) => a[Math.floor(rnd() * a.length)];
export const FINAL_AT = 4;
/** Apunta la etiqueta de una reina en el episodio `ep` (el track record va por columnas de episodio). */
function mark(track: Record<string, string[]>, k: string, ep: number, lab: string) {
  const row = (track[k] || []).slice();
  while (row.length < ep - 1) row.push("");
  row[ep - 1] = lab;
  track[k] = row;
}

// ---------- Temporadas y reparto ----------
/** All Winners: las ganadoras de las temporadas ya emitidas (si una repite, entra su finalista). */
export function allWinnersCast(): string[] {
  const used = new Set<string>();
  TEMPORADAS_ES.filter((t) => !t.enEmision && t.cast.length > 1).forEach((t) => {
    const w = t.cast[t.cast.length - 1], r = t.cast[t.cast.length - 2];
    const id = !used.has(w) ? w : !used.has(r) ? r : null;
    if (id) used.add(id);
  });
  return [...used];
}
/** All Stars a tu gusto: tú eliges el reparto (de 8 a 12 reinas de todas las temporadas). */
export const CUSTOM = { id: "escustom", min: 8, max: 12 };
/** Reinas que se pueden elegir para el All Stars a tu gusto (todas las que han pasado por una temporada). */
export const customPool = () => [...new Set(TEMPORADAS_ES.flatMap((t) => t.cast))].filter((id) => REINAS_ES[id]);
export function seasonById(id: string): Temporada | null {
  if (id === "esaw") return { franchise: "esaw", id, name: "All Winners", year: 2026, cast: allWinnersCast() };
  if (id === CUSTOM.id) return { franchise: "esas", id, name: "All Stars a tu gusto", year: 2026, cast: customPool() };
  return TEMPORADAS_ES.find((t) => t.id === id) || null;
}
export const twistOf = (id: string): Twist => (TEMPORADAS_HISTORIA[id]?.twist as Twist) || "normal";
export const lemaOf = (id: string) => TEMPORADAS_HISTORIA[id]?.lema || "";
/** Temporadas que se pueden jugar en el motor nuevo. */
export const playableSeasons = () => [...TEMPORADAS_ES.filter((t) => t.cast.length >= FINAL_AT + 2), seasonById("esaw")!, seasonById(CUSTOM.id)!].filter((t) => t.cast.length >= FINAL_AT + 2);
export const nameOf = (s: Season, key: string) => REINAS_ES[key === ME ? s.queen : key]?.name || key;
export const idOf = (s: Season, key: string) => (key === ME ? s.queen : key);
export const attrsOf = (s: Season, key: string): Attrs => baseAttrs(idOf(s, key), queenStats(idOf(s, key)));
const seasonIndex = (s: Season) => Math.max(0, TEMPORADAS_ES.findIndex((t) => t.id === s.seasonId));
const seasonBoost = (s: Season) => Math.min(BALANCE.temporada.subidaMax, seasonIndex(s) * BALANCE.temporada.subidaPorTemporada);
const inGame = (s: Season) => s.alive.includes(ME);
const relOf = (s: Season, k: string) => s.rel[k] || 0;
/** Semanas de All Winners antes de la final. */
export const winnersWeeks = (s: Season) => clamp(s.cast.length - 1, 4, 8);

export function newSeason(seasonId: string, queen: string, seed: number, rnd: () => number, castIds?: string[]): Season {
  const t = seasonById(seasonId)!;
  const rivals = (castIds || t.cast).filter((id) => id !== queen);
  const twist = twistOf(seasonId);
  // Retos: el de la primera semana, individual y con pasarela
  const plan = shuffle(Object.keys(MAXI).filter((k) => !MAXI[k].special), rnd);
  const first = plan.findIndex((k) => !MAXI[k].team && !MAXI[k].noRunway);
  plan.unshift(...plan.splice(first, 1));
  const temas = shuffle(TEMAS_PASARELA.filter((x) => !x.rv).map((x) => x.n), rnd);
  const s: Season = {
    v: 2, seasonId, twist, queen, cast: [ME, ...rivals], seed, ep: 0, phase: "anuncio", alive: [ME, ...rivals], out: [], meOut: false,
    track: {}, record: {}, form: {}, rel: {}, nemesis: null, plan, temas, week: null, final: null,
    stars: {}, blocked: null, luck: null, hearts: {}, heartFrom: null, repescaDone: false, news: [],
    roles: assignRoles(rivals, rnd), seenRoles: {}, lsWins: 0, fairLipstick: 0, lzDone: false, reunionDone: false,
  };
  // Reina de la suerte: está en una de las cajitas (la tuya se abre al empezar)
  if (twist === "suerte") s.luck = pickR(s.alive, rnd);
  return s;
}

// ---------- La semana ----------
/** Empieza la semana siguiente: Segunda Oportunidrag, final o un reto. */
/** Nombre corto del episodio para el track record (lo que va antes de los dos puntos del título). */
export function epShort(n: Season): string {
  if (n.phase === "regreso") return "Segunda Oportunidrag";
  if (n.phase === "reencuentro") return "Reencuentro";
  if (n.phase === "final") return "Gran final";
  const t = n.week?.titulo || "";
  const c = t.split(":")[0].replace(/^Reto de /, "").trim();
  return c.charAt(0).toUpperCase() + c.slice(1);
}
export function nextWeek(s: Season, rnd: () => number): Season {
  const n = nextWeekRaw(s, rnd);
  const names = (s.epNames || []).slice();
  names[n.ep - 1] = epShort(n);
  return { ...n, epNames: names };
}
function nextWeekRaw(s: Season, rnd: () => number): Season {
  const ep = s.ep + 1;
  const base = { ...s, ep, news: [] as string[], week: null };
  if (s.twist === "repesca" && !s.repescaDone && s.alive.length <= BALANCE.repescaCuando && s.out.length >= 2) return { ...base, phase: "regreso" };
  // (la Segunda Oportunidrag es un episodio propio: tiene su columna en el track record)
  const finalNow = s.twist === "winners" ? s.ep >= winnersWeeks(s) : s.alive.length <= FINAL_AT;
  if (finalNow && !s.reunionDone && s.twist !== "winners" && s.out.length >= 2) return { ...base, phase: "reencuentro", reunionDone: true };
  if (finalNow) return startFinal(base, rnd);
  // Lalaparuza: una vez por temporada, cuando quedan siete (o en la tercera semana de All Winners)
  if (!s.lzDone && (s.twist === "winners" ? ep === 3 : s.alive.length === 7)) {
    const ranked = s.alive.slice().sort((a, b) => ppe(s.track[b] || []) - ppe(s.track[a] || []) || (s.record[b] || 0) - (s.record[a] || 0) || rnd() - 0.5);
    const week: Week = { tipo: "lalaparuza", titulo: MAXI.lalaparuza.titulo, tema: "", adv: 0, mini: { id: MINIS[(ep - 1) % MINIS.length].id }, lala: lalaStart(ranked, asLike(s.twist)) };
    return { ...base, lzDone: true, phase: inGame(s) ? "anuncio" : "fuera", week };
  }
  const tipo = s.plan[(ep - 1) % s.plan.length];
  const week: Week = { tipo, titulo: MAXI[tipo].titulo, tema: s.temas[(ep - 1) % s.temas.length], adv: 0, mini: { id: MINIS[(ep - 1) % MINIS.length].id } };
  if (MAXI[tipo].team) {
    // Capitanas: las mejores del capítulo anterior. Eligen por turnos (cada una tira de sus aliadas y de las fuertes)
    const prev = previousRank(s.alive, (k) => (s.track[k] || [])[s.ep - 1], rnd) || shuffle(s.alive, rnd);
    const caps: [string, string] = [prev[0], prev[1]];
    const T: [string[], string[]] = [[caps[0]], [caps[1]]];
    let pool = s.alive.filter((k) => !caps.includes(k));
    let turn = 0;
    while (pool.length) {
      const cap = caps[turn % 2];
      const score = (k: string) => (cap === ME ? relOf(s, k) * 3 : k === ME ? relOf(s, cap) * 3 : 0) + lsPower(s, k) / 10 + rnd() * 2;
      const k = pool.slice().sort((a, b) => score(b) - score(a))[0];
      T[turn % 2].push(k);
      pool = pool.filter((x) => x !== k);
      turn++;
    }
    // El primer equipo es el tuyo
    const mine = T[1].includes(ME) ? 1 : 0;
    week.teams = mine ? [T[1], T[0]] : T;
    week.captains = mine ? [caps[1], caps[0]] : caps;
  }
  return { ...base, phase: inGame(s) ? "anuncio" : "fuera", week };
}

/** Lo que cuenta en el reto: los atributos que pide, con el estilo por la pasarela. */
export function retoAttr(a: Attrs, keys: QAttr[], noRunway = false) {
  const v = keys.reduce((t, k) => t + a[k], 0) / keys.length;
  return noRunway ? v : v * 0.7 + a.estilo * 0.3;
}
export function rivalScore(s: Season, key: string, rnd: () => number, tipo = s.week!.tipo) {
  const extra = seasonBoost(s) / 5 + clamp(s.form[key] || 0, -8, 8) / 6;
  return clamp(notaDe(tirarDado(retoAttr(attrsOf(s, key), MAXI[tipo].attrs, MAXI[tipo].noRunway) + extra, rnd), rnd()), 5, 99);
}
/** Aliadas suman y enemigas restan (como en el modo historia). */
export const relBonus = (s: Season) => {
  const v = Object.values(s.rel);
  return clamp(v.filter((x) => x >= 2).length * 4 - v.filter((x) => x <= -2).length * 4, -10, 12);
};
/** Tu nota: reto (65 %) y pasarela (35 %); tu juego mueve tu dado, pero no lo asegura. */
export function myScore(s: Season, rnd: () => number) {
  const w = s.week!;
  const def = MAXI[w.tipo];
  const reto = Math.min(100, (w.reto ?? 50) + (w.adv || 0));
  const raw = w.runway == null || def.noRunway ? reto : reto * 0.65 + w.runway * 0.35;
  const played = clamp(raw + relBonus(s), 0, 100);
  return notaTuJuego(played, retoAttr(attrsOf(s, ME), def.attrs, def.noRunway) + seasonBoost(s) / 10, rnd);
}

/** Resultados de la semana: clasificación, etiquetas y bottom (o top 2 en All Stars y All Winners). */
export function scoreWeek(s: Season, rnd: () => number, fixed: Record<string, number> = {}): Season {
  const w = s.week!;
  const sc: Record<string, number> = {};
  s.alive.forEach((k) => (sc[k] = fixed[k] ?? (k === ME ? myScore(s, rnd) : rivalScore(s, k, rnd))));
  let rows = s.alive.map((key) => ({ key, s: sc[key] }));
  let winTeam: 0 | 1 | undefined;
  if (w.teams) {
    const avg = (T: string[]) => T.reduce((a, k) => a + sc[k], 0) / T.length;
    winTeam = avg(w.teams[0]) >= avg(w.teams[1]) ? 0 : 1;
    rows.forEach((r) => { if (w.teams![winTeam!].includes(r.key)) r.s = Math.min(r.key === ME ? 100 : 99, r.s + 8); });
  }
  const inWin = (k: string) => (w.teams && winTeam !== undefined ? (w.teams[winTeam].includes(k) ? 1 : 0) : 0);
  rows = rows.sort((a, b) => inWin(b.key) - inWin(a.key) || b.s - a.s);
  const n = rows.length;
  const nb = bottomSize({ twist: s.twist, n });
  const bottomOf = (rs: typeof rows) => rs.slice(rs.length - (s.twist === "winners" ? 0 : s.twist === "allstars" ? 2 : nb)).map((r) => r.key);
  const bottom = s.twist === "winners" ? [] : bottomOf(rows);
  const blocks = w.teams && winTeam !== undefined ? [w.teams[winTeam], w.teams[1 - winTeam]] : undefined;
  const labs = weekLabels(rows.map((r) => ({ key: r.key })), { twist: s.twist, nb: s.twist === "allstars" ? 2 : nb, bottom, blocks, blocked: s.blocked });
  const labels = Object.fromEntries(rows.map((r, i) => [r.key, labs[i]]));
  // En All Stars y All Winners bailan las dos del top; en las demás, las del bottom
  const dancers = asLike(s.twist) ? rows.slice(0, 2).map((r) => r.key) : bottom;
  const record = { ...s.record }, form = { ...s.form };
  rows.forEach((r, i) => {
    record[r.key] = (record[r.key] || 0) + (i === 0 ? 3 : bottom.includes(r.key) ? 0 : 1);
    if (r.key !== ME) form[r.key] = clamp(Math.round((form[r.key] || 0) * 0.8) + (i === 0 ? 2 : bottom.includes(r.key) ? -1 : 0) + Math.floor(rnd() * 3) - 1, -8, 8);
  });
  return { ...s, phase: inGame(s) ? "resultados" : "fuera", record, form, week: { ...w, rows, labels, bottom: dancers, winTeam, saves: [] } };
}

// ---------- Untucked ----------
export interface UtOption { key: string; kind: "ganadoraPre" | "bottomPre" | "charlaPre" | "aliada" | "enemiga" | "nemesis"; label: string }
/** Con quién puedes hablar en el Untucked (antes del veredicto nadie sabe quién gana). */
export function untuckedOptions(s: Season, rnd: () => number): UtOption[] {
  const w = s.week!;
  const out: UtOption[] = [];
  const add = (key: string | undefined, kind: UtOption["kind"], label: string) => { if (key && key !== ME && s.alive.includes(key) && !out.some((o) => o.key === key)) out.push({ key, kind, label }); };
  const lab = (k: string) => w.labels![k] || "";
  if (s.nemesis && s.alive.includes(s.nemesis)) add(s.nemesis, "nemesis", "⚔️ Tu némesis quiere hablar contigo");
  const enemy = s.alive.find((k) => k !== ME && relOf(s, k) <= -2);
  add(enemy, "enemiga", "😒 Arreglarlo (o no) con tu enemiga");
  const ally = s.alive.find((k) => k !== ME && relOf(s, k) >= 2);
  add(ally, "aliada", "💞 Hablar con tu aliada");
  shuffle(s.alive.filter((k) => k !== ME), rnd).slice(0, 3).forEach((k) => add(k, /WIN|TOP2|HIGH/.test(lab(k)) ? "ganadoraPre" : /BTM|LOW/.test(lab(k)) ? "bottomPre" : "charlaPre", "💬 Comentar las críticas"));
  return out.slice(0, 4);
}
export interface UtScene { lines: [string, string][]; choices?: { txt: string; rel: number; reply: [string, string] }[]; rel: number }
/** La conversación: líneas (quién habla y qué dice) y, con tu enemiga, la elección. */
export function untuckedScene(s: Season, o: UtOption, rnd: () => number): UtScene {
  const U = HISTORIA.untucked;
  const fill = (t: string) => t.replace(/\{r1\}/g, nameOf(s, o.key)).replace(/\{yo\}/g, nameOf(s, ME));
  const who = (k: string) => (k === "me" ? nameOf(s, ME) : k === "r1" ? nameOf(s, o.key) : k);
  const lines = (src: [string, string][]): [string, string][] => src.map(([k, t]) => [who(k), fill(t)]);
  if (o.kind === "nemesis") {
    const lab = s.week!.labels![ME] || "";
    return {
      lines: lines(nemesisUntucked(/BTM|LOW/.test(lab), /WIN|TOP2|HIGH/.test(lab))),
      choices: [
        { txt: "Plantarle cara: «Nos vemos en la final»", rel: -1, reply: [nameOf(s, o.key), "Allí te espero. Si llegas."] },
        { txt: "Proponerle una tregua", rel: 2, reply: [nameOf(s, o.key), "Vale. Tregua. Pero no te acostumbres."] },
      ],
      rel: 0,
    };
  }
  if (o.kind === "enemiga") return { lines: lines(U.enemiga[0]), choices: U.enemigaChoices.map((c: any) => ({ txt: fill(c.txt), rel: c.rel?.r1 || 0, reply: [who(c.reply[0]), fill(c.reply[1])] as [string, string] })), rel: 0 };
  return { lines: lines(pickR(U[o.kind] as [string, string][][], rnd)), rel: o.kind === "bottomPre" ? 2 : 1 };
}
/** Cambia la relación con una compañera (de -3 a 3). La primera enemiga de verdad se vuelve tu némesis. */
export function changeRel(s: Season, key: string, d: number, rnd: () => number = Math.random): Season {
  const v = clamp(relOf(s, key) + d, -3, 3);
  const born = !s.nemesis && v <= -2 && s.alive.includes(key);
  const nemesis = s.nemesis || (born ? key : null);
  const news = born ? [...s.news, `⚔️ ${nameOf(s, key)} es tu némesis. ${fillText(nemesisBirth(rnd)[1], { yo: nameOf(s, ME) })}`] : s.news;
  return { ...s, rel: { ...s.rel, [key]: v }, nemesis, news };
}

// ---------- Minirreto, taller y confesionario ----------
export const miniOf = (s: Season) => MINIS.find((m) => m.id === s.week?.mini?.id) || MINIS[0];
/** Resultado del minirreto: la ganadora tiene ventaja en el reto (y reparte papeles o capitanea). */
export function playMini(s: Season, me: number, rnd: () => number): Season {
  const w = s.week!;
  const m = miniOf(s);
  const scores: Record<string, number> = { [ME]: Math.round(me) };
  s.alive.filter((k) => k !== ME).forEach((k) => (scores[k] = miniRival(attrsOf(s, k)[m.attr], rnd)));
  const winner = Object.keys(scores).sort((a, b) => scores[b] - scores[a])[0];
  const adv = (w.adv || 0) + (winner === ME ? 4 : 0);
  return { ...s, phase: "taller", week: { ...w, adv, mini: { id: m.id, me: scores[ME], winner, scores } }, news: [...s.news, winner === ME ? "🏅 ¡Ganas el minirreto! Tienes ventaja en el reto." : `🏅 ${nameOf(s, winner)} gana el minirreto.`] };
}
/** La escena del taller de esta semana. */
export function sceneOf(s: Season, rnd: () => number): Scene {
  return tallerScene({ rivals: s.alive.filter((k) => k !== ME), roles: s.roles, nemesis: s.nemesis, seenRoles: s.seenRoles, rnd });
}
/** Lo que eliges en la escena: cambia relaciones y, a veces, tu ventaja en el reto. */
export function applyScene(s: Season, sc: Scene, i: number, rnd: () => number): Season {
  const c = sc.choices[i];
  let t: Season = s;
  if (c) Object.entries(c.rel).forEach(([k, d]) => { if (s.alive.includes(k)) t = changeRel(t, k, d, rnd); });
  const seenRoles = sc.kind === "rol" ? { ...t.seenRoles, [sc.r1]: (t.seenRoles[sc.r1] || 0) + 1 } : t.seenRoles;
  const adv = (t.week!.adv || 0) + (c ? Math.round(c.adv * 1.5) : 0);
  return { ...t, seenRoles, week: { ...t.week!, adv, scene: { ...sc, answered: i } } };
}
/** Una compañera habla de ti en el confesionario. */
export function pickConfesionario(s: Season, rnd: () => number): Season {
  if (!s.week || !s.alive.includes(ME)) return s;
  const who = s.alive.filter((k) => k !== ME && s.roles[k]);
  if (!who.length) return s;
  const key = who[Math.floor(rnd() * who.length)];
  const text = confesionario({ key, role: s.roles[key], rel: relOf(s, key), rnd });
  return text ? { ...s, week: { ...s.week, conf: { key, text: fillText(text, { yo: nameOf(s, ME) }) } } } : s;
}
/** Lo que ganas esta semana (euros para el armario). */
export function earnings(s: Season): { money: number; why: string }[] {
  const w = s.week;
  if (!w?.labels || !s.alive.includes(ME) && !s.out.includes(ME)) return [];
  const out: { money: number; why: string }[] = [];
  const lab = w.labels[ME];
  if (lab === "WIN") out.push({ money: 300, why: "Ganas el reto de la semana" });
  else if (lab === "TOP2" || lab === "HIGH") out.push({ money: 80, why: "Entre las mejores de la semana" });
  if (w.mini?.winner === ME) out.push({ money: 150, why: "Ganas el minirreto" });
  return out;
}

// ---------- Antes del lip sync: suerte, corazón y moneda ----------
/** ¿Tienes algo que decidir antes del lip sync? (la moneda se decide siempre en pantalla, votes o no). */
export function myDecision(s: Season): "moneda" | "suerte" | "corazon" | null {
  const w = s.week!;
  if (s.twist === "moneda" && (w.bottom!.length === 3 || w.coin)) return "moneda";
  if (!inGame(s)) return null;
  if (s.twist === "suerte" && s.luck === ME) return "suerte";
  if (s.twist === "corazon" && w.bottom!.includes(ME) && (s.hearts[ME] || 0) >= 2) return "corazon";
  return null;
}
/** Salva a una del bottom: entra la siguiente peor (regla compartida con el multijugador). */
export function saveFromBottom(s: Season, key: string, by: string, how: "suerte" | "corazon"): Season {
  const w = s.week!;
  const order = w.rows!.map((r) => r.key);
  const R = rescueFromBottom({ order, bottom: w.bottom!, save: key, protectedKeys: (w.saves || []).map((x) => x.key), winner: order[0] });
  if (!R) return s;
  const labels = { ...w.labels!, [R.entered]: w.labels![key] };
  const out: Season = { ...s, week: { ...w, bottom: R.bottom, labels, saves: [...(w.saves || []), { key, by, how }] } };
  if (how === "suerte") out.luck = null;
  if (how === "corazon") out.hearts = { ...s.hearts, [key]: (s.hearts[key] || 0) - 2 };
  out.news = [...s.news, `${how === "suerte" ? "🍀" : "❤️"} ${nameOf(s, by)} ${by === key ? "se salva" : `salva a ${nameOf(s, key)}`} y ${nameOf(s, R.entered)} entra en el bottom.`];
  return out;
}
/** Lo que deciden las rivales: la de la suerte se salva a sí misma si está en el bottom; con corazón entero, se usa. */
export function rivalsDecide(s: Season, rnd: () => number): Season {
  let t = s;
  if (t.twist === "suerte" && t.luck && t.luck !== ME && t.week!.bottom!.includes(t.luck) && rnd() < 0.85) t = saveFromBottom(t, t.luck, t.luck, "suerte");
  if (t.twist === "corazon") t.week!.bottom!.filter((k) => k !== ME && (t.hearts[k] || 0) >= 2).forEach((k) => { if (t.week!.bottom!.includes(k)) t = saveFromBottom(t, k, k, "corazon"); });
  return t;
}
/** La moneda: cara se vota a quién salvar del bottom de tres, cruz a quién condenar. */
export function flipCoin(s: Season, rnd: () => number, myVote?: string): Season {
  const w = s.week!;
  const options = w.bottom!;
  const cara = w.coin ? w.coin.cara : rnd() < 0.5;
  const voters = s.alive.filter((k) => !options.includes(k));
  const sc = (k: string) => w.rows!.find((r) => r.key === k)!.s;
  const picks: Record<string, string> = {};
  voters.forEach((v) => {
    if (v === ME) { if (myVote) picks[v] = myVote; return; }
    // Cada una vota según su relación contigo (si estás en juego) y la nota de la semana
    const pref = (k: string) => (k === ME ? relOf(s, v) * 8 : 0) + sc(k) + rnd() * 18;
    picks[v] = options.slice().sort((a, b) => (cara ? pref(b) - pref(a) : pref(a) - pref(b)))[0];
  });
  const winner = w.rows![0].key;
  const r = coinResult({ cara, options, picks, scoreOf: sc, breakTie: (tied) => (tied.includes(winner) ? winner : tied.slice().sort((a, b) => (cara ? sc(b) - sc(a) : sc(a) - sc(b)))[0]) });
  const safe = options.find((k) => !r.pair.includes(k))!;
  const labels = { ...w.labels!, [safe]: w.labels![safe] };
  return { ...s, week: { ...w, coin: { cara, options, votes: r.votes, chosen: r.chosen, pair: r.pair, myVote }, bottom: r.pair, labels, saves: [...(w.saves || []), { key: safe, by: "moneda", how: "moneda" }] }, news: [...s.news, `🪙 Sale ${cara ? "cara: se vota a quién salvar" : "cruz: se vota a quién condenar"}. ${nameOf(s, safe)} se libra del lip sync.`] };
}

// ---------- Lip sync y veredicto ----------
export function lsPower(s: Season, key: string) {
  const L = BALANCE.lipSync;
  const st = queenStats(idOf(s, key));
  return 40 + (st.speed + st.rate + st.power + st.lives) * 2 + (s.record[key] || 0) * L.porRecord + (s.form[key] || 0);
}
export function simLipSync(s: Season, a: string, b: string, rnd: () => number): [string, string] {
  const L = BALANCE.lipSync;
  return rnd() < clamp(0.5 + (lsPower(s, a) - lsPower(s, b)) / L.escala, L.min, L.max) ? [a, b] : [b, a];
}
/** ¿Juegas tú el lip sync de esta semana? */
export const myLipSync = (s: Season) => inGame(s) && !!s.week?.bottom?.includes(ME);

/** Resultado del lip sync de la semana. En All Stars sigue el pintalabios; en All Winners, estrella y bloqueo. */
export function lipSyncResult(s: Season, win: string, lose: string, rnd: () => number): Season {
  const w = { ...s.week!, lsWin: win };
  if (s.twist === "allstars") {
    const t = { ...s, week: w, phase: "pintalabios" as Phase };
    // Si gana una rival, decide ella: normalmente la peor de la semana (y si no te soporta, quizá tú)
    return win === ME ? t : lipstick(t, rivalLipstick(t, win, rnd));
  }
  if (s.twist === "winners") {
    const stars = { ...s.stars };
    const last = s.ep >= winnersWeeks(s);
    [win, lose].forEach((k) => { if (k !== s.blocked) stars[k] = (stars[k] || 0) + (last ? 3 : 1); });
    const labels = { ...w.labels!, [win]: "WIN", [lose]: lose === s.blocked ? "BTOP" : "TOP2" };
    const t: Season = { ...s, stars, week: { ...w, labels }, news: [...s.news, `⭐ ${nameOf(s, win)} gana el lip sync${lose === s.blocked ? ` (${nameOf(s, lose)} estaba bloqueada y se queda sin estrella)` : ` y las dos del top suman ${last ? "tres estrellas" : "estrella"}`}.`] };
    if (win === ME) return { ...t, phase: "bloqueo" };
    // La rival bloquea a la que más estrellas tiene (que no sea ella)
    const target = t.alive.filter((k) => k !== win).sort((a, b) => (stars[b] || 0) - (stars[a] || 0) || rnd() - 0.5)[0];
    return block(t, target);
  }
  return settleWeek({ ...s, week: w }, win, lose);
}
function rivalLipstick(s: Season, by: string, rnd: () => number) {
  const w = s.week!;
  const bottom = w.rows!.filter((r) => /^BTM/.test(w.labels![r.key])).map((r) => r.key);
  const sc = (k: string) => w.rows!.find((r) => r.key === k)!.s - (k === ME && relOf(s, by) <= -2 ? 30 : 0) + rnd() * 6;
  return bottom.slice().sort((a, b) => sc(a) - sc(b))[0];
}
/** All Stars: la ganadora del lip sync manda a casa a una del bottom. */
export function lipstick(s: Season, goes: string): Season {
  const w = s.week!;
  const bottom = w.rows!.filter((r) => /^BTM/.test(w.labels![r.key])).map((r) => r.key);
  const stay = bottom.find((k) => k !== goes) || goes;
  const sc = (k: string) => w.rows!.find((r) => r.key === k)!.s;
  const kind = lipstickKind(goes, stay, sc, (k) => ppe(s.track[k] || []));
  const labels = { ...w.labels!, [w.lsWin!]: "WIN", [w.bottom!.find((k) => k !== w.lsWin)!]: "TOP2" };
  const t = { ...s, week: { ...w, labels, lipstick: kind } };
  return settleWeek(t, stay, goes, `💄 ${nameOf(s, w.lsWin!)} saca el pintalabios: ${nameOf(s, goes)}${goes === ME ? " (tú)" : ""}.`);
}
/** All Winners: la ganadora bloquea a una (la semana que viene no puede ganar estrella). */
export function block(s: Season, key: string): Season {
  const w = s.week!;
  const track = { ...s.track };
  s.alive.forEach((k) => mark(track, k, s.ep, w.labels![k]));
  return { ...s, blocked: key, track, phase: inGame(s) ? "veredicto" : "fuera", news: [...s.news, `🚫 ${nameOf(s, w.lsWin!)} bloquea a ${nameOf(s, key)}.`], week: { ...w, out: null } };
}

/** Cierra la semana: se va `out` (si hay corazones, deja su medio corazón). */
export function settleWeek(s: Season, saved: string, out: string, line?: string): Season {
  const w = s.week!;
  const track = { ...s.track };
  s.alive.forEach((k) => mark(track, k, s.ep, k === out ? "ELIM" : w.labels![k]));
  const alive = s.alive.filter((k) => k !== out);
  const meOut = s.meOut || out === ME;
  const place = out === ME ? alive.length + 1 : s.place;
  const news = [...s.news, line || `${nameOf(s, saved)} se queda. ${out === ME ? "Tú" : nameOf(s, out)}, sashay away.`];
  return { ...s, phase: meOut ? "fuera" : "veredicto", alive, out: [...s.out, out], meOut, track, place, news, heartFrom: s.twist === "corazon" ? out : null, week: { ...w, saved, out } };
}
/** Corazones: la eliminada deja su medio corazón. Si es una rival, elige ella (a su aliada o a la que mejor le cae). */
export function giveHeart(s: Season, from: string, to: string | null, rnd: () => number): Season {
  if (!from) return s;
  // Una rival te lo deja si os lleváis bien; si no, a una compañera cualquiera
  const others = s.alive.filter((k) => k !== ME);
  const dest = to || (s.alive.includes(ME) && relOf(s, from) >= 1 && rnd() < 0.6 ? ME : pickR(others.length ? others : s.alive, rnd));
  return { ...s, heartFrom: null, hearts: { ...s.hearts, [dest]: (s.hearts[dest] || 0) + 1 }, news: [...s.news, `📼 ${from === ME ? "Dejas" : `${nameOf(s, from)} deja`} medio corazón a ${dest === ME ? "ti" : nameOf(s, dest)}.`] };
}

// ---------- Segunda Oportunidrag ----------
/** Las eliminadas compiten por volver: las dos mejores hacen lip sync y la ganadora vuelve. */
export function repescaPair(s: Season, rnd: () => number): [string, string] {
  const sc = Object.fromEntries(s.out.map((k) => [k, rivalScore(s, k, rnd, "snatch") + (s.record[k] || 0)]));
  const top = s.out.slice().sort((a, b) => sc[b] - sc[a]);
  return [top[0], top[1]];
}
export function repescaResult(s: Season, win: string): Season {
  const track = { ...s.track };
  mark(track, win, s.ep, "RTRN");
  const back = win === ME;
  return { ...s, repescaDone: true, track, alive: [...s.alive, win], out: s.out.filter((k) => k !== win), meOut: back ? false : s.meOut, place: back ? undefined : s.place, phase: "veredicto", news: [...s.news, `🔁 ${win === ME ? "¡Vuelves a la competición!" : `${nameOf(s, win)} vuelve a la competición.`}`] };
}

// ---------- La final ----------
export function startFinal(s: Season, rnd: () => number): Season {
  let four = s.alive;
  if (s.twist === "winners") {
    const ranked = s.alive.slice().sort((a, b) => (s.stars[b] || 0) - (s.stars[a] || 0) || (s.record[b] || 0) - (s.record[a] || 0));
    four = allWinnersCut(ranked, (k) => s.stars[k] || 0).direct;
  }
  const order = shuffle(four, rnd);
  const outOfFinal = s.alive.filter((k) => !four.includes(k));
  const track = { ...s.track };
  outOfFinal.forEach((k) => mark(track, k, s.ep, "OUT"));
  const meCut = outOfFinal.includes(ME);
  return { ...s, phase: "final", track, meOut: s.meOut || meCut, place: meCut ? FINAL_AT + 1 : s.place, week: null, final: { pairs: [[order[0], order[1]], [order[2], order[3]]], semis: [] }, news: s.twist === "winners" ? [`⭐ A la final, las cuatro con más estrellas: ${four.map((k) => nameOf(s, k)).join(", ")}.`] : [] };
}
export function settleSemi(s: Season, winner: string): Season {
  const f = s.final!;
  return { ...s, final: { ...f, semis: [...f.semis, winner] } };
}
export function crown(s: Season, winner: string): Season {
  const f = s.final!;
  const runnerUp = f.semis.find((k) => k !== winner)!;
  const four = f.pairs.flat();
  const track = { ...s.track };
  four.forEach((k) => mark(track, k, s.ep, k === winner ? "WINNER" : k === runnerUp ? "RUNNER-UP" : "ELIM"));
  const place = winner === ME ? 1 : runnerUp === ME ? 2 : four.includes(ME) ? 3 : s.place;
  return { ...s, phase: "fin", track, place, final: { ...f, crown: winner, runnerUp } };
}

// ---------- Críticas ----------
export function critique(s: Season, key: string, pick: <T>(a: T[]) => T): string[] {
  const w = s.week!;
  const lab = w.labels![key];
  const nivel = /WIN|TOP2|BTOP|HIGH/.test(lab) ? "top" : lab === "LOW" || /^BTM/.test(lab) ? "low" : "mid";
  const yo = nameOf(s, key);
  const reto = bancoReto(w.tipo)[nivel as "top"];
  const lines = [pick(reto)];
  // El look se critica aparte: tu nota de pasarela, o la de la rival esa semana
  if (!MAXI[w.tipo].noRunway) lines.push(pick(JURADO.pasarela[nivelNota(key === ME && w.runway != null ? w.runway : lookRival(idOf(s, key), s.ep))]));
  return lines.map((t) => t.replace(/\{yo\}/g, yo));
}

/** PPE de la jugadora en la temporada. */
export const myPpe = (s: Season) => ppe((s.track[ME] || []).filter((l) => !["RUNNER-UP", "WINNER", "RTRN", "OUT"].includes(l)));

// ---------- Lalaparuza ----------
/** El siguiente duelo del torneo (o null si ya ha terminado). */
export const lalaNext = (s: Season) => (s.week?.lala ? lalaPending(s.week.lala)[0] || null : null);
export function lalaDuel(s: Season, a: string, b: string, winner: string): Season {
  return { ...s, week: { ...s.week!, lala: lalaResolve(s.week!.lala!, a, b, winner) } };
}
/** Fin del torneo: la nota de cada una sale del cuadro (y tu lip sync matiza la tuya). */
export function lalaFinish(s: Season, myLs: number, rnd: () => number): Season {
  const L = s.week!.lala!;
  const sc = lalaScores(L, s.alive, (k) => (k === ME ? myLs : rivalScore(s, k, rnd)) - 55);
  const champ = L.champ ? `👑 ${nameOf(s, L.champ)} gana la Lalaparuza.` : `Llegan a la final del torneo: ${(L.top2 || []).map((k) => nameOf(s, k)).join(" y ")}.`;
  return { ...scoreWeek(s, rnd, sc), news: [...s.news, champ] };
}

// ---------- Reencuentro ----------
export interface ReunionTalk { key: string; kind: "buena" | "neutra" | "mala"; lines: [string, string][]; choices?: { txt: string; rel: number; bonus: number; reply: [string, string] }[] }
/** Antes de la final vuelven las eliminadas: con quién puedes hablar y cómo te recibe cada una. */
export function reunionTalks(s: Season, rnd: () => number): ReunionTalk[] {
  return s.out.filter((k) => k !== ME).slice(-4).map((key) => {
    const r = relOf(s, key);
    const kind = r >= 1 ? "buena" : r <= -1 || key === s.nemesis ? "mala" : "neutra";
    const src: [string, string][] = key === s.nemesis ? NEMESIS.reencuentro : (REENCUENTRO[kind] as [string, string][][])[Math.floor(rnd() * REENCUENTRO[kind].length)];
    const choices = kind === "mala" ? (key === s.nemesis ? NEMESIS.reencuentroChoices : REENCUENTRO.choicesMala).map((c: any) => ({ txt: c.txt, rel: c.rel?.r1 || 0, bonus: c.bonus || 0, reply: c.reply })) : undefined;
    return { key, kind, lines: src, choices };
  });
}
/** Miss Simpatía: votan las eliminadas (a ti, según lo que te quieran; si no, a una compañera). */
export function missSimpatia(s: Season, rnd: () => number): Season {
  const voters = s.out.filter((k) => k !== ME);
  const cands = [...s.alive, ...s.out];
  const votes: Record<string, number> = {};
  voters.forEach((v) => {
    const toMe = cands.includes(ME) && rnd() < 0.15 + Math.max(0, relOf(s, v)) * 0.2;
    const k = toMe ? ME : cands.filter((x) => x !== v && x !== ME)[Math.floor(rnd() * Math.max(1, cands.length - 2))] || ME;
    votes[k] = (votes[k] || 0) + 1;
  });
  const miss = Object.keys(votes).sort((a, b) => votes[b] - votes[a] || (a === ME ? -1 : 1))[0] || s.alive[0];
  return { ...s, miss, news: [...s.news, `💐 Miss Simpatía: ${miss === ME ? "¡tú!" : nameOf(s, miss)}`] };
}
export const reunionIntro = (rnd: () => number): [string, string][] => REENCUENTRO.intro[Math.floor(rnd() * REENCUENTRO.intro.length)];
export const reunionDrama = (rnd: () => number): [string, string][] => REENCUENTRO.drama[Math.floor(rnd() * REENCUENTRO.drama.length)];

// ---------- Logros ----------
/** Los logros que ya se cumplen con lo que ha pasado en la temporada (los mismos ids que el juego de siempre). */
export function logrosNow(s: Season): string[] {
  const t = (s.track[ME] || []).filter(Boolean);
  const out: string[] = ["debut"];
  const w = s.week;
  if (s.phase === "fin" && s.place === 1) out.push(s.twist === "winners" ? "all-winners" : "corona-historia");
  for (let i = 2; i < t.length; i++) if (t[i] === "WIN" && t[i - 1] === "WIN" && t[i - 2] === "WIN") out.push("racha");
  for (let i = 1; i < t.length; i++) if (t[i] === "WIN" && /^BTM/.test(t[i - 1])) out.push("remontada");
  if (s.final && s.final.pairs.flat().includes(ME) && !t.some((l) => /^BTM/.test(l))) out.push("sin-bottom");
  if (s.lsWins >= 3) out.push("superviviente");
  if (w?.reto != null && w.reto >= 95) out.push("perfecta");
  if (Object.values(s.rel).filter((v) => v >= 2).length >= 3) out.push("aliadas");
  if (Object.values(s.rel).some((v) => v <= -2)) out.push("enemiga");
  if (w?.tipo === "snatch" && w.labels?.[ME] === "WIN") out.push("snatch");
  if (t.includes("RTRN")) out.push("segunda");
  if (w?.lipstick === "jugarreta" && w.lsWin === ME) out.push("villana-as");
  if (s.fairLipstick >= 3) out.push("juez-justa");
  if (s.miss === ME) out.push("miss-simpatia");
  return [...new Set(out)];
}
