// Temporada en directo: estado de la sala y reglas (puro, sin DOM ni red; con tests).
// La anfitriona aplica estas funciones y reparte el estado; el resto lo pinta.

import { ppe } from "../core/track";
import { nivelNota } from "../core/dado";
import { lookRival } from "../core/reinas";
import { familiaPasarela } from "../core/temas";
import { bottomSize, weekLabels, allCritiqued } from "../core/week";
import { BANDAS, COLORES_GRUPO, grupoCritica, NOMBRE_JURADO } from "../core/criticas";
import { allWinnersCut, allWinnersBottom } from "../core/finales";
import { lalaStart, lalaPending, lalaResolve, lalaScoreDe, type Lala } from "../core/lala";
import { rescueFromBottom, coinResult, lipstickKind, addHalfHearts } from "../core/dinamicas";
import { repartirBrackets, clasificacion, formarAlianzas, notaEnPareja, rompe, puntos, BRACKET_NOMBRES, BRACKET_SEMANAS, BRACKETS_FINAL } from "../core/alianzas";

export type Phase = "lobby" | "maletas" | "cajas" | "lalaparuza" | "anuncio" | "mini" | "equipos" | "reto" | "pasarela" | "resultados" | "untucked" | "veredicto" | "decision" | "comodin" | "sorpresa" | "lipsync" | "pintalabios" | "track" | "reencuentro" | "finalistas" | "votacion" | "final" | "corona";
export type Ritmo = "normal" | "rapido" | "libre";
/** Formato de la temporada: normal (las dos peores hacen lip sync) o All Stars (lip sync del top 2 y la ganadora elimina). */
export type Formato = "normal" | "allstars" | "winners" | "repesca" | "suerte" | "corazon" | "moneda" | "brackets";
/** Nombre y explicación de cada dinámica (para elegirla en la partida personalizada). */
export const FORMATOS: Record<Formato, { n: string; icon: string; d: string }> = {
  normal: { n: "Clásica", icon: "👑", d: "Las dos peores hacen lip sync y se va la que pierde." },
  allstars: { n: "All Stars", icon: "💄", d: "Las dos mejores hacen lip sync y la que gana saca su pintalabios." },
  winners: { n: "All Winners", icon: "⭐", d: "Nadie se va: el top 2 gana estrellas, la del lip sync bloquea a una rival. Las 4 con más estrellas van a la final." },
  repesca: { n: "Segunda Oportunidrag", icon: "🔁", d: "Cuando quedan siete, las eliminadas vuelven en parejas y una regresa. Lip sync a tres bandas." },
  suerte: { n: "Reina de la suerte", icon: "🍀", d: "Una reina tiene en secreto la reina de la suerte: puede salvar a quien quiera del lip sync una vez." },
  corazon: { n: "Temporada del corazón", icon: "❤️", d: "Cada eliminada deja medio corazón. Con uno entero salvas a alguien del bottom." },
  moneda: { n: "Temporada de la moneda", icon: "🪙", d: "Bottom de tres y moneda al aire: cara, las salvadas votan a quién salvar; cruz, a quién condenar." },
  brackets: { n: "All Stars por brackets", icon: "🏆", d: "Como el All Stars 10: tres brackets con alianzas, se suman puntos y pasa la mitad de cada uno. Con siete, vuelve una y Lalaparuza final. Siempre con 18 reinas." },
};
// Formas de la gran final: compartidas con el modo historia (src/core/finales.ts)
import type { FinalFmt } from "../core/finales";
export { FINALES, type FinalFmt } from "../core/finales";
/** Cuándo llega la Segunda Oportunidrag (reinas en competición). */
export const REPESCA_AT = 7;

/** Segundos por fase. La suma de un episodio es el tope de tiempo del episodio. */
const CAJAS_VER = 3500;
// Lip syncs con margen: el minijuego tiene presentación, telón y seis movimientos, y nadie debe perder por leer despacio
export const DURACION: Record<Ritmo, Record<Exclude<Phase, "lobby" | "corona">, number>> = {
  // Las pantallas que se miran (anuncio, críticas, Untucked, veredicto, pintalabios, track) no tienen reloj:
  // las pasa la anfitriona, y todas ven lo mismo que ella. El reloj es solo para lo que se juega.
  normal: { lalaparuza: 180, cajas: 60, maletas: 600, anuncio: 0, mini: 120, equipos: 0, reto: 240, pasarela: 150, resultados: 0, untucked: 0, veredicto: 0, lipsync: 180, decision: 45, comodin: 45, sorpresa: 0, pintalabios: 0, track: 0, reencuentro: 0, finalistas: 0, votacion: 60, final: 180 },
  rapido: { lalaparuza: 150, cajas: 40, maletas: 420, anuncio: 0, mini: 90, equipos: 0, reto: 170, pasarela: 110, resultados: 0, untucked: 0, veredicto: 0, lipsync: 150, decision: 30, comodin: 30, sorpresa: 0, pintalabios: 0, track: 0, reencuentro: 0, finalistas: 0, votacion: 45, final: 150 },
  libre: { lalaparuza: 0, cajas: 0, maletas: 0, anuncio: 0, mini: 0, equipos: 0, reto: 0, pasarela: 0, resultados: 0, untucked: 0, veredicto: 0, lipsync: 0, decision: 0, comodin: 0, sorpresa: 0, pintalabios: 0, track: 0, reencuentro: 0, finalistas: 0, votacion: 0, final: 0 },
};
/** Pantallas que lleva la anfitriona (diálogo sincronizado y botón de seguir). */
export const WATCH: Phase[] = ["anuncio", "resultados", "untucked", "veredicto", "sorpresa", "pintalabios", "track", "reencuentro", "finalistas", "corona"];
export const isWatch = (p: Phase) => WATCH.includes(p);
/** Con IA (frases escritas) el reto dura más: escribir lleva tiempo. */
export const IA_EXTRA = 1.75;
/** Segundos que se tarda en leer las críticas de cada reina. */
export const POR_CRITICA = 7;
/** Momento tope de una fase; 0 = sin tope (se espera a que entreguen todas). */
export const limite = (now: number, secs: number) => (secs > 0 ? now + secs * 1000 : 0);
/** Tope de juego de un episodio (lo que corre con reloj: reto, pasarela y lip sync). */
export const topeEpisodio = (r: Ritmo) => {
  const d = DURACION[r];
  return d.reto + d.pasarela + d.lipsync;
};
/** Duración de una fase en esta sala (con IA el reto se alarga; sin límite sigue siendo 0). */
const dur = (s: Pick<RoomState, "ritmo" | "ia">, phase: Exclude<Phase, "lobby" | "corona">) => {
  const d = DURACION[s.ritmo][phase];
  return phase === "reto" && s.ia && d > 0 ? Math.round(d * IA_EXTRA) : d;
};
/** Nota de quien no entrega a tiempo. */
export const NO_PRESENTO = 30;

export interface Player { id: string; name: string; queen: string | null; joined: number; alive: boolean }
export interface Row { key: string; score: number; label: string }
export interface Pair { a: string; b: string; winner?: string }
/** Lip sync entre dos jugadoras: cada paso lo eligen las dos a la vez y no se pasa al siguiente hasta que han elegido ambas. */
export interface DuelMove { tag: string; imp: number; msg: string; energy?: number; at?: number; auto?: boolean }
export const DUEL_STEPS = 6;
export const DUEL_STEP_MS = 25000;
export interface Sub { mini?: number; walk?: number; reto?: number; final?: number; ls?: { won: boolean; score: number }; elim?: string; jury?: string; ready?: boolean; pick?: string; box?: number; heart?: string; duel?: DuelMove[]; duelMove?: DuelMove; duelStep?: number }
/** Momento de un giro en el que alguien decide (comodín): la suerte, el corazón, la moneda o el bloqueo del All Winners. */
export interface Twist {
  kind: "suerte" | "corazon" | "moneda" | "bloqueo" | "corte";
  /** All Winners, empate en el corte del top 4: cuántas elige y las que ya están dentro. */
  need?: number;
  sure?: string[];
  by: string[];
  options: string[];
  picks: Record<string, string>;
  cara?: boolean;
  /** All Winners: las del top que se llevan estrella esta semana. */
  starred?: string[];
}
/** Lo que pasó en el giro, para enseñarlo (pantalla «sorpresa», la lleva la anfitriona). */
/** Medio corazón que deja una eliminada (se destapa con su grabación la semana siguiente). */
export interface Gift { from: string; to: string; ep?: number; chosen?: boolean }
export interface TwistResult {
  kind: "suerte" | "corazon" | "corazones" | "moneda" | "bloqueo" | "repesca";
  by?: string;
  saved?: string[];
  entered?: string[];
  gifts?: Gift[];
  full?: string[];
  votes?: Record<string, string[]>;
  chosen?: string;
  cara?: boolean;
  tie?: boolean;
  target?: string;
  stars?: string[];
  back?: string;
  pairs?: { c: string; o: string | null; score: number }[];
}
/** Guion de una pantalla que se mira: líneas [quién, texto] y por cuál va (la anfitriona lo avanza). */
export interface Script { key: string; lines: [string, string][]; i: number }
/** Propuesta de pausa: hace falta el sí de todas. */
export interface Pause { by: string; votes: Record<string, boolean>; at: number }
/** Plan de la temporada: reto y pasarela de cada episodio (se sabe al empezar para preparar las maletas). */
export interface PlanEp { tipo: string; cat?: { n: string; d: string } }
/** All Stars: antes del lip sync las dos del top eligen pintalabios (picks); la ganadora (by) saca el suyo (go). */
export interface Decision { top: string[]; options: string[]; picks: Record<string, string>; by?: string; go?: string; kind?: "semana" | "trayectoria" | "jugarreta" }
/** El pintalabios de la que perdió el lip sync, que se enseña al empezar el episodio siguiente. */
export interface Reveal { ep: number; by: string; go: string; went: string }
export interface LzMatch { a: string | null; b: string | null; w?: string; slot?: number }
/** Lalaparuza: sin taller ni pasarela, eliminatorias de lip sync con todo el reparto (como en el modo historia). */
export const LALA: Reto = { tipo: "lalaparuza", titulo: "Lalaparuza: el torneo de lip syncs", desc: "Sin taller: duelos de lip sync con todo el reparto. La que gana su duelo se salva y se va al camerino; las que pierden siguen luchando entre ellas. Las dos que pierdan todos sus duelos van al lip sync de eliminación.", noRunway: true };
export interface Reto { tipo: string; titulo: string; desc: string; noRunway: boolean; cat?: { n: string; d: string }; /** Reto por grupos: de cuántas (2 = parejas). */ groups?: number }
export interface MiniDef { id: string; titulo: string; desc: string }
export interface RoomState {
  v: number;
  code: string;
  host: string;
  season: string;
  ritmo: Ritmo;
  fmt?: Formato;
  ia?: boolean;
  players: Player[];
  npcs: string[];
  out: { key: string; ep: number; place: string }[];
  ep: number;
  phase: Phase;
  deadline: number;
  reto?: Reto;
  used: string[];
  subs: Record<string, Sub>;
  rows?: Row[];
  crit?: { key: string; lines: [string, string][] }[];
  pairs?: Pair[];
  decision?: Decision;
  reveal?: Reveal;
  plan?: PlanEp[];
  /** Reinas de la partida (partida personalizada) y cómo se eligen las rivales. */
  cast?: string[];
  custom?: { pick: "elegidas" | "azar"; size: number; rivals: string[] };
  /** En peligro esta semana (los comodines pueden cambiarlo). */
  bottom?: string[];
  protectedKeys?: string[];
  twist?: Twist;
  twistResult?: TwistResult;
  stage?: number;
  triple?: string[];
  luck?: string | null;
  /** Lip sync entre jugadoras: cuándo empezó la fase (para el tope de cada paso). */
  duelAt?: number;
  duelKey?: string;
  /** Reina de la suerte: las cajitas del primer día (en una está la suerte). */
  boxes?: { n: number; win: number; owners?: Record<number, string> };
  hearts?: Record<string, number>;
  pendingHearts?: Gift[];
  stars?: Record<string, number>;
  block?: { ep: number; id: string; by: string };
  weeks?: number;
  /** All Winners: semana de la Lalaparuza. */
  lzEp?: number;
  /** Lalaparuza: el cuadro de lip syncs (rondas; la 0 es la ronda previa) y hasta dónde llega cada una. */
  lala?: Lala & { ls: Record<string, number>; champ?: string; top2?: string[]; score?: Record<string, number>; show?: boolean };
  /** Segunda Oportunidrag: parejas del monólogo y la maestra de ceremonias (la ganadora del reto anterior, que no compite). */
  rp?: { ep: number; pairs: { c: string; o: string | null }[]; mc?: string };
  rpDone?: boolean;
  /** All Stars por brackets: los tres grupos, desde qué episodio y cuántas semanas compiten; al acabar, done. */
  br?: { groups: string[][]; start: number; per: number; done?: boolean; back?: string; final?: boolean };
  /** Alianzas por parejas de la semana (dentro de cada bracket) y el top 2 de cada bracket. */
  al?: { ep: number; pairs: string[][] };
  brTop?: string[][];
  /** Minirreto de la semana: cuál es y, al acabar, la nota de cada una y el orden (la primera, la ganadora). */
  mini?: MiniDef & { ep: number; scores?: Record<string, number>; rank?: string[] };
  /** Reto por grupos: las capitanas (las mejores del minirreto) eligen por turnos. members[i][0] es la capitana. */
  groups?: { ep: number; size: number; names: string[]; members: string[][]; turn: number; at: number; done?: boolean };
  /** Lo que dice el jurado de cada grupo (de mejor a peor). */
  gcrit?: { name: string; keys: string[]; lines: [string, string][] }[];
  /** Segunda Oportunidrag: la ganadora del minirreto elige a su eliminada; el resto, a sorteo. */
  draft?: { ep: number; by?: string; options: string[]; at: number; pick?: string; done?: boolean };
  planShift?: number;
  script?: Script;
  pause?: Pause;
  paused?: boolean;
  finalStage?: number;
  /** Giros de final de temporada: pase directo a la final (con cinco) y primera finalista (con seis, inmune la semana siguiente). */
  paseEp?: number;
  pase?: string;
  finalistaEp?: number;
  immune?: { key: string; ep: number };
  /** Doble shantay o doble sashay (como mucho uno de cada por temporada). */
  doubles?: { shantay?: number; sashay?: number };
  /** Gran final: la forma que ha tocado, Miss Simpatía (del reencuentro) y lo de cada forma. */
  finalFmt?: FinalFmt;
  reunionDone?: boolean;
  miss?: { key: string; votes: Record<string, number> };
  /** Reto final en marcha (el episodio de la final con reto y pasarela). */
  finalRun?: boolean;
  /** Lip sync a cuatro (o a tres): las que bailan a la vez. */
  quad?: string[];
  /** Cómo se resolvió: en orden (de la cuarta a la primera), una fuera y dos subcampeonas, o solo la ganadora. Orden de la mejor a la peor. */
  quadResult?: { mode: "orden" | "unaFuera" | "ganadora"; order: string[] };
  /** La reina de la pista: las que esperan su turno (en orden). */
  chain?: string[];
  /** Votan las eliminadas: las dos de la final y, al acabar, los votos. */
  vote?: { a: string; b: string; tally?: Record<string, number> };
  /** All Winners: eliminatoria de lip syncs (primero la QoSDADHH y luego la corona). */
  bracket?: { kind: "qosd" | "corona"; seeds: string[]; alive: string[]; round: number; bye?: string };
  awFinal?: { top: string[]; bottom: string[]; tierB: string; tierQ?: string; qosd?: string };
  track: Record<string, Record<number, string>>;
  epNames: Record<number, string>;
  champion?: string;
  note?: string;
}

/** Lo que el motor del juego presta a la sala (en los tests se sustituye por uno falso). */
export interface Engine {
  retos(): Reto[];
  categorias(): { n: string; d: string }[];
  rivalScore(queenId: string, tipo: string): number;
  simLS(aQueen: string, bQueen: string): string;
  /** Críticas: `level` es la del reto y `look` la de la pasarela (van por separado). */
  critique(tipo: string, level: "top" | "mid" | "low", name: string, look?: "top" | "mid" | "low", extra?: { cat?: string; antes?: string[] }): [string, string][];
  queenName(id: string): string;
  rnd(): number;
  /** Reto de la Segunda Oportunidrag (stand-up en parejas). */
  repesca?(): Reto;
  /** Minirretos (sin ellos, no hay minirreto). */
  minis?(): MiniDef[];
  /** Nota de una reina del juego en el minirreto. */
  miniScore?(queenId: string, miniId: string): number;
}

export const pkey = (pid: string) => "p:" + pid;
export const nkey = (qid: string) => "n:" + qid;
export const isP = (k: string) => k.startsWith("p:");
export const idOf = (k: string) => k.slice(2);

export function newRoom(code: string, host: Player, season: string, ritmo: Ritmo, opts: { fmt?: Formato; ia?: boolean } = {}): RoomState {
  return { v: 1, code, host: host.id, season, ritmo, fmt: opts.fmt || "normal", ia: !!opts.ia, players: [host], npcs: [], out: [], ep: 0, phase: "lobby", deadline: 0, used: [], subs: {}, track: {}, epNames: {} };
}
const isAS = (s: Pick<RoomState, "fmt">) => s.fmt === "allstars";
/** All Stars por brackets: ¿estamos en la fase de grupos? */
export const brPhase = (s: Pick<RoomState, "fmt" | "br">) => s.fmt === "brackets" && !!s.br && !s.br.done;
/** La regla de la semana: en los brackets, la suya; después, la de siempre. */
const twistOf = (s: Pick<RoomState, "fmt" | "br">) => (s.fmt === "brackets" ? (brPhase(s) ? "brackets" : "normal") : s.fmt || "normal");
const isAW = (s: Pick<RoomState, "fmt">) => s.fmt === "winners";
/** Semanas del All Winners (como en el modo historia: una menos que reinas, entre 4 y 8). */
export const winnersWeeks = (n: number) => Math.max(4, Math.min(8, n - 1));
const shuffleWith = <T,>(a: T[], e: Pick<Engine, "rnd">) => { const b = a.slice(); for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(e.rnd() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b; };
const pickWith = <T,>(a: T[], e: Pick<Engine, "rnd">) => a[Math.floor(e.rnd() * a.length)];
/** Jugadoras eliminadas que vuelven a jugar en la Segunda Oportunidrag (en pareja con una en competición). */
/** Maestra de ceremonias de esta semana (Segunda Oportunidrag): presenta y no compite. */
export const mcOf = (s: Pick<RoomState, "rp" | "ep">) => (s.rp && s.rp.ep === s.ep ? s.rp.mc : undefined);
const rpPlayers = (s: RoomState) => (s.rp && s.rp.ep === s.ep ? s.rp.pairs.map((p) => p.o).filter((k): k is string => !!k && isP(k)).map(idOf) : []);

export const alivePlayers = (s: RoomState) => s.players.filter((p) => p.alive && p.queen);
export const aliveKeys = (s: RoomState) => [...alivePlayers(s).map((p) => pkey(p.id)), ...s.npcs.map(nkey)];
const queenOfKey = (s: RoomState, k: string) => (isP(k) ? s.players.find((p) => p.id === idOf(k))?.queen || "" : idOf(k));
export const nameOfKey = (s: RoomState, k: string, e: Pick<Engine, "queenName">) => {
  if (!isP(k)) return e.queenName(idOf(k));
  const p = s.players.find((x) => x.id === idOf(k));
  return p ? `${e.queenName(p.queen || "")} (${p.name})` : "?";
};

/** Empieza la temporada: las reinas que nadie ha cogido juegan como rivales del juego. */
export function startSeason(s: RoomState, cast: string[], now: number, e: Engine): RoomState {
  const taken = new Set(s.players.map((p) => p.queen).filter(Boolean) as string[]);
  const players = s.players.map((p) => ({ ...p, alive: !!p.queen }));
  // Se sabe desde el principio qué reto y qué pasarela tiene cada episodio (hasta quedar 4)
  const weeks = isAW(s) ? winnersWeeks(cast.length) : undefined;
  const plan = makePlan(Math.max(1, weeks || cast.length - 4), e);
  // Lalaparuza: en All Winners una semana al azar; con 8 reinas o menos, al principio (nunca llegan a quedar 8 tras el primero)
  const lzEp = weeks ? Math.min(weeks, 3 + Math.floor(e.rnd() * 3)) : cast.length <= 8 && cast.length >= 6 ? 2 + (cast.length >= 7 ? Math.floor(e.rnd() * 2) : 0) : undefined;
  const base: RoomState = { ...s, players, cast, npcs: cast.filter((q) => !taken.has(q)), ep: 0, plan, weeks, lzEp, subs: {}, hearts: {}, pendingHearts: [], stars: {}, phase: "maletas", deadline: limite(now, DURACION[s.ritmo].maletas), v: s.v + 1 };
  // Reina de la suerte: una de las cajitas la tiene (en secreto)
  if (s.fmt === "suerte") { const all = aliveKeys(base); base.luck = all[Math.floor(e.rnd() * all.length)]; }
  return base;
}
/** Reparto de retos (sin repetir hasta agotarlos) y una pasarela distinta para cada uno que la tenga. */
export function makePlan(n: number, e: Pick<Engine, "retos" | "categorias" | "rnd">): PlanEp[] {
  const all = e.retos();
  const cats = e.categorias().slice();
  const out: PlanEp[] = [];
  const fams = new Set<string>();
  let pool: typeof all = [];
  for (let i = 0; i < n; i++) {
    if (!pool.length) pool = all.slice();
    const r = pool.splice(Math.floor(e.rnd() * pool.length), 1)[0];
    const ep: PlanEp = { tipo: r.tipo };
    if (!r.noRunway) {
      // Ni repetida ni parecida a otra de la temporada (mientras queden)
      const ok = cats.filter((c) => !fams.has(familiaPasarela(c.n)));
      const from = ok.length ? ok : cats;
      const c = from.length ? from[Math.floor(e.rnd() * from.length)] : e.categorias()[Math.floor(e.rnd() * e.categorias().length)];
      if (cats.includes(c)) cats.splice(cats.indexOf(c), 1);
      fams.add(familiaPasarela(c.n));
      ep.cat = c;
    }
    out.push(ep);
  }
  return out;
}
/** Categorías de pasarela del plan (lo que hay que llevar en la maleta). */
export const planCats = (s: Pick<RoomState, "plan">) => (s.plan || []).map((p) => p.cat?.n).filter(Boolean) as string[];

function nextEpisode(s0: RoomState, now: number, e: Engine): RoomState {
  const s: RoomState = { ...s0, mini: undefined, groups: undefined, draft: undefined };
  const all = e.retos();
  const ep = s.ep + 1;
  // Segunda Oportunidrag: cuando quedan siete, vuelven las eliminadas en parejas
  if (s.fmt === "repesca" && !s.rpDone && aliveKeys(s).length <= REPESCA_AT && s.out.length && e.repesca) {
    const r = e.repesca();
    // Como en el modo historia: la ganadora del reto anterior es la maestra de ceremonias y no compite
    const mc = aliveKeys(s).find((k) => ["WIN", "BWIN"].includes((s.track[k] || {})[s.ep]));
    const comps = shuffleWith(aliveKeys(s).filter((k) => k !== mc), e), outs = shuffleWith(s.out.map((o) => o.key), e);
    const rp = { ep, pairs: comps.map((c, i) => ({ c, o: outs[i] || null })), ...(mc ? { mc } : {}) };
    return { ...s, ep, reto: r, used: [...s.used, r.tipo], subs: {}, rows: undefined, crit: undefined, pairs: undefined, decision: undefined, twist: undefined, twistResult: undefined, bottom: undefined, triple: undefined, note: undefined, script: undefined, rp, rpDone: true, lala: undefined, planShift: (s.planShift || 0) + 1, epNames: { ...s.epNames, [ep]: r.titulo }, phase: "anuncio", deadline: 0, v: s.v + 1 };
  }
  // All Stars por brackets: el primer episodio se reparten los tres grupos (hacen falta al menos nueve)
  if (s.fmt === "brackets" && !s.br) {
    const alive = aliveKeys(s);
    s.br = alive.length >= 9 ? { groups: repartirBrackets(alive, e.rnd), start: ep, per: BRACKET_SEMANAS } : { groups: [], start: ep, per: 0, done: true };
  }
  // Lalaparuza: cuando quedan 8 (o 16), como en la historia; en All Winners, una semana al azar
  const n = aliveKeys(s).length;
  if (s.fmt !== "brackets" && !s.used.includes(LALA.tipo) && (s.lzEp ? ep === s.lzEp && n >= 5 : ep >= 2 && (n === 8 || n === 16))) {
    return { ...s, ep, reto: { ...LALA }, used: [...s.used, LALA.tipo], subs: {}, rows: undefined, crit: undefined, pairs: undefined, decision: undefined, twist: undefined, twistResult: undefined, bottom: undefined, triple: undefined, protectedKeys: undefined, rp: undefined, lala: undefined, note: undefined, script: undefined, reveal: s.reveal && s.reveal.ep === s.ep ? s.reveal : undefined, planShift: (s.planShift || 0) + 1, epNames: { ...s.epNames, [ep]: LALA.titulo }, phase: "anuncio", deadline: 0, v: s.v + 1 };
  }
  // A veces, con seis, la ganadora será la primera finalista; con cinco, la ganadora tiene el pase directo a la final
  const giros = !isAS(s) && !isAW(s);
  if (giros && n === 6 && s.finalistaEp == null && e.rnd() < 0.4) s.finalistaEp = ep;
  else if (giros && n === 5 && s.paseEp == null && !s.pase && e.rnd() < 0.4) s.paseEp = ep;
  const planned = (s.plan || [])[ep - 1 - (s.planShift || 0)];
  let r: Reto;
  if (planned && all.some((x) => x.tipo === planned.tipo)) {
    r = { ...all.find((x) => x.tipo === planned.tipo)! };
    if (!r.noRunway) r.cat = planned.cat || e.categorias()[0];
  } else {
    let pool = all.filter((x) => !s.used.includes(x.tipo));
    if (!pool.length) pool = all;
    r = { ...pool[Math.floor(e.rnd() * pool.length)] };
    if (!r.noRunway) { const cats = e.categorias(); r.cat = cats[Math.floor(e.rnd() * cats.length)]; }
  }
  const secs = dur(s, "anuncio");
  return { ...s, ep, reto: r, used: [...s.used, r.tipo], subs: {}, rows: undefined, crit: undefined, pairs: undefined, decision: undefined, twist: undefined, twistResult: undefined, bottom: undefined, triple: undefined, protectedKeys: undefined, rp: undefined, lala: undefined, note: undefined, script: undefined, reveal: s.reveal && s.reveal.ep === s.ep ? s.reveal : undefined, epNames: { ...s.epNames, [ep]: r.titulo }, phase: "anuncio", deadline: limite(now, secs), v: s.v + 1 };
}

/** ¿Han entregado ya todas las que tienen que entregar en esta fase? (para no esperar al tope) */
export function allIn(s: RoomState): boolean {
  const ps = alivePlayers(s).filter((p) => pkey(p.id) !== mcOf(s));
  if (s.phase === "maletas") return ps.every((p) => s.subs[p.id]?.ready);
  if (s.phase === "cajas") return false; // se espera un momento para que cada una vea su caja (ver tick)
  if (s.phase === "mini") return ps.every((p) => s.subs[p.id]?.mini != null);
  if (s.phase === "equipos") return false; // lo lleva el reloj de la elección (ver tick)
  const extra = rpPlayers(s);
  if (s.phase === "reto") return ps.every((p) => s.subs[p.id]?.reto != null || s.subs[p.id]?.final != null) && extra.every((id) => s.subs[id]?.reto != null || s.subs[id]?.final != null);
  if (s.phase === "pasarela") return ps.every((p) => s.subs[p.id]?.final != null);
  if (s.phase === "comodin") {
    const t = s.twist;
    const pls = (t?.by || []).filter(isP);
    if (!t || !pls.length) return false; // si deciden reinas del juego, se ve el momento hasta el tope
    return pls.every((k) => s.subs[idOf(k)]?.pick != null);
  }
  if (s.phase === "decision") {
    const d = s.decision;
    const ps = (d?.top || []).filter(isP);
    if (!d || !ps.length) return false; // si eligen reinas del juego, se espera al tope (se ve el momento)
    return ps.every((k) => s.subs[idOf(k)]?.elim != null);
  }
  if (s.phase === "votacion") {
    const vs = finalVoters(s).filter(isP).map(idOf);
    return vs.length > 0 && vs.every((id) => s.subs[id]?.pick != null);
  }
  if (s.phase === "lalaparuza" && s.lala?.show) return false;
  if (s.phase === "lipsync" || s.phase === "final" || s.phase === "lalaparuza") {
    const inPairs = [...(s.pairs || []).filter((x) => !x.winner).flatMap((x) => [x.a, x.b]), ...(s.triple || []), ...(s.quad || [])].filter(isP).map(idOf);
    // Si solo bailan reinas del juego, se deja verlo hasta el tope
    if (!inPairs.length) return false;
    return inPairs.every((id) => s.subs[id]?.ls != null);
  }
  return false;
}

// ------------------------------ Minirreto, grupos y parejas ------------------------------
/** Ventaja en el reto para la ganadora del minirreto (si no hay grupos). */
export const MINI_VENTAJA = 5;
/** Tiempo de cada jugadora para elegir (grupos o pareja) y pausa entre las elecciones del juego. */
export const PICK_MS = 25000;
export const NPC_PICK_MS = 1400;
/** Tiempo para ver cómo han quedado los grupos o el sorteo de las parejas antes del reto. */
export const VER_EQUIPOS = 7000;
export const VER_SORTEO = 16000;
const miniKeys = (s: RoomState) => aliveKeys(s).filter((k) => k !== mcOf(s));
function startMini(s: RoomState, now: number, e: Engine): RoomState | null {
  const list = e.minis?.() || [];
  if (!list.length) return null;
  const m = list[(s.ep - 1 + s.code.charCodeAt(0)) % list.length];
  return { ...s, mini: { id: m.id, titulo: m.titulo, desc: m.desc, ep: s.ep }, phase: "mini", deadline: limite(now, DURACION[s.ritmo].mini), v: s.v + 1 };
}
function endMini(s: RoomState, e: Engine): RoomState {
  const m = s.mini!;
  const scores: Record<string, number> = {};
  miniKeys(s).forEach((k) => (scores[k] = isP(k) ? Math.max(0, Math.min(100, Math.round(s.subs[idOf(k)]?.mini ?? 20))) : Math.round(e.miniScore ? e.miniScore(idOf(k), m.id) : e.rivalScore(idOf(k), m.id))));
  const rank = Object.keys(scores).sort((a, b) => scores[b] - scores[a] || (e.rnd() < 0.5 ? -1 : 1));
  return { ...s, mini: { ...m, scores, rank } };
}
const shuffleBy = <T,>(a: T[], e: Pick<Engine, "rnd">) => a.map((x) => [e.rnd(), x] as const).sort((x, y) => x[0] - y[0]).map((x) => x[1]);
/** Tras el minirreto: la Segunda Oportunidrag (pareja), un reto por grupos (las capitanas eligen) o directo al reto. */
function afterMini(s: RoomState, now: number, e: Engine): RoomState {
  const rank = s.mini?.rank || [];
  if (s.rp && s.rp.ep === s.ep) {
    const w = rank[0];
    const options = s.out.map((o) => o.key);
    const by = w && isP(w) && s.rp.pairs.some((p) => p.c === w) && options.length >= 2 ? w : undefined;
    return { ...s, draft: { ep: s.ep, by, options, at: now, done: !by }, phase: "equipos", deadline: by ? (s.ritmo === "libre" ? 0 : now + PICK_MS) : now + VER_SORTEO, v: s.v + 1 };
  }
  const al = alianzasStep(s, now, e);
  if (al) return al;
  const size = s.reto?.groups || 0;
  const ks = aliveKeys(s);
  if (size >= 2 && ks.length >= size * 2) {
    const nG = Math.floor(ks.length / size);
    const caps = rank.slice(0, nG);
    const names = s.reto!.tipo === "equipos" ? shuffleBy(BANDAS, e).slice(0, nG).map((b) => `«${b}»`) : caps.map((_, i) => `${size === 2 ? "Pareja" : "Grupo"} ${COLORES_GRUPO[i % COLORES_GRUPO.length]}`);
    return { ...s, groups: { ep: s.ep, size, names, members: caps.map((c) => [c]), turn: 0, at: now }, phase: "equipos", deadline: 0, v: s.v + 1 };
  }
  return { ...s, phase: "reto", deadline: limite(now, dur(s, "reto")), v: s.v + 1 };
}
/** All Stars por brackets: las alianzas de la semana dentro de cada bracket (se mantienen salvo que alguna rompa). */
function alianzasStep(s: RoomState, now: number, e: Engine): RoomState | null {
  if (!brPhase(s) || s.finalRun || !s.reto || s.reto.tipo === LALA.tipo) return null;
  const alive = new Set(aliveKeys(s));
  const prev = (s.al?.pairs || []).filter((p) => p.length === 2 && p.every((k) => alive.has(k)));
  const lab = (k: string) => (s.track[k] || {})[s.ep - 1];
  const breaks = (x: string, y: string) => !isP(x) && rompe({ suya: lab(y), deEllaAntes: lab(x), rel: 0, rnd: e.rnd });
  const kept = prev.filter(([a, b]) => !breaks(a, b) && !breaks(b, a));
  const members: string[][] = [], names: string[] = [];
  s.br!.groups.forEach((g, gi) => {
    const ks = g.filter((k) => alive.has(k));
    formarAlianzas(ks, () => e.rnd(), kept.filter((p) => ks.includes(p[0]))).forEach((p) => { members.push(p); names.push(`Bracket ${BRACKET_NOMBRES[gi]}`); });
  });
  return { ...s, al: { ep: s.ep, pairs: members.filter((p) => p.length === 2) }, groups: { ep: s.ep, size: 2, names, members, turn: members.length, at: now, done: true }, phase: "equipos", deadline: now + VER_EQUIPOS, v: s.v + 1 };
}
/** La capitana a la que le toca elegir. */
export const capOf = (s: RoomState) => { const g = s.groups!; return g.members[g.turn % g.members.length][0]; };
/** Las que quedan por elegir. */
export const draftPool = (s: RoomState) => { const g = s.groups; const taken = new Set((g?.members || []).flat()); return aliveKeys(s).filter((k) => !taken.has(k)); };
/** Lo que elegiría el juego: la más fuerte para el reto que queda (con un poco de azar). */
function autoPick(s: RoomState, e: Engine): string {
  const pool = draftPool(s);
  const tipo = s.reto?.tipo || "";
  const val = (k: string) => e.rivalScore(isP(k) ? queenOfKey(s, k) : idOf(k), tipo);
  return pool.map((k) => [val(k), k] as const).sort((a, b) => b[0] - a[0])[0]?.[1] || pool[0];
}
function draftPick(s: RoomState, cap: string, pick: string, now: number): RoomState {
  const g = s.groups;
  if (!g || g.done || cap !== capOf(s)) return s;
  const pool = draftPool(s);
  if (!pool.includes(pick)) return s;
  const i = g.turn % g.members.length;
  const members = g.members.map((m, j) => (j === i ? [...m, pick] : m));
  const done = pool.length <= 1;
  return { ...s, groups: { ...g, members, turn: g.turn + 1, at: now, done }, deadline: done ? now + VER_EQUIPOS : 0, v: s.v + 1 };
}
/** La pareja de la Segunda Oportunidrag: la elegida pasa a ir con quien la ha elegido (y su antigua pareja, con la otra). */
function pairPick(s: RoomState, by: string, pick: string, now: number, auto = false): RoomState {
  const d = s.draft;
  if (!d || d.done || (!auto && by !== d.by) || !d.options.includes(pick) || !s.rp) return s;
  let pairs = s.rp.pairs;
  const mine = pairs.find((p) => p.c === by);
  if (mine) {
    const had = mine.o;
    pairs = pairs.map((p) => (p === mine ? { ...p, o: pick } : p.o === pick ? { ...p, o: had } : p));
  }
  return { ...s, rp: { ...s.rp, pairs }, draft: { ...d, pick, done: true }, deadline: now + VER_SORTEO, v: s.v + 1 };
}

/** Notas, etiquetas y críticas de la semana. */
export function scoreWeek(s: RoomState, e: Engine): RoomState {
  const tipo = s.reto!.tipo;
  const lz = s.lala && s.lala.done ? s.lala.score : null;
  const own = (k: string) => (lz && lz[k] != null ? lz[k] : isP(k) ? s.subs[idOf(k)]?.final ?? s.subs[idOf(k)]?.reto ?? NO_PRESENTO : e.rivalScore(idOf(k), tipo));
  // Segunda Oportunidrag: la nota es de la pareja (60 % la que compite, 40 % la eliminada)
  const pairOf = (k: string) => (s.rp && s.rp.ep === s.ep ? s.rp.pairs.find((p) => p.c === k) : undefined);
  // Reto por grupos (y sin grupos, la ganadora del minirreto lleva ventaja)
  const G = !brPhase(s) && s.groups && s.groups.ep === s.ep && s.groups.done ? s.groups : null;
  const miniWin = !G && s.mini && s.mini.ep === s.ep ? s.mini.rank?.[0] : undefined;
  let rows: Row[] = aliveKeys(s).filter((k) => k !== mcOf(s)).map((k) => { const pr = pairOf(k); const sc = Math.min(100, own(k) + (k === miniWin ? MINI_VENTAJA : 0)); return { key: k, score: pr && pr.o ? Math.round(sc * 0.6 + own(pr.o) * 0.4) : sc, label: "" }; });
  // All Stars por brackets: las aliadas se valoran en pareja (salvo que una haya hundido a la otra)
  if (brPhase(s) && s.al && s.al.ep === s.ep) s.al.pairs.forEach(([a, b]) => {
    const ra = rows.find((r) => r.key === a), rb = rows.find((r) => r.key === b);
    if (!ra || !rb) return;
    const r = notaEnPareja(ra.score, rb.score);
    ra.score = r.a; rb.score = r.b;
  });
  rows.sort((a, b) => b.score - a.score || (e.rnd() < 0.5 ? -1 : 1));
  // Por grupos: se ordenan los grupos por su media y, dentro de cada uno, por la nota de cada una (como en la historia)
  let groupOf: Record<string, number> | null = null;
  let order: number[] = [];
  if (G) {
    const avg = G.members.map((m) => { const r = rows.filter((x) => m.includes(x.key)); return r.reduce((t, x) => t + x.score, 0) / Math.max(1, r.length); });
    order = G.members.map((_, i) => i).sort((a, b) => avg[b] - avg[a]);
    rows = order.flatMap((gi) => rows.filter((r) => G.members[gi].includes(r.key)));
    groupOf = {};
    order.forEach((gi, pos) => G.members[gi].forEach((k) => (groupOf![k] = pos)));
  }
  const n = rows.length;
  // Primera finalista: esta semana no puede caer al bottom (se sube justo por encima)
  const imm = s.immune && s.immune.ep === s.ep ? s.immune.key : null;
  if (imm && !G && !brPhase(s)) {
    const nbGuess = bottomSize({ twist: s.fmt || "normal", n, repescaWeek: !!(s.rp && s.rp.ep === s.ep) });
    const i = rows.findIndex((r) => r.key === imm);
    if (i >= n - nbGuess && n - nbGuess - 1 >= 0) { const [r] = rows.splice(i, 1); rows.splice(n - nbGuess - 1, 0, r); }
  }
  // Bottom de tres en la moneda (con seis o más) y en la Segunda Oportunidrag (lip sync a tres bandas)
  // Las mismas reglas que el modo historia (src/core/week.ts)
  const twist = twistOf(s);
  const lastGroupSize = G ? rows.filter((r) => groupOf![r.key] === order.length - 1).length : undefined;
  const nb = bottomSize({ twist, n, repescaWeek: !!(s.rp && s.rp.ep === s.ep), lastGroupSize });
  const blocked = s.block && s.block.ep === s.ep ? s.block.id : null;
  let brTop: string[][] | undefined;
  if (brPhase(s)) {
    // Cada bracket por su lado: top 2 al lip sync por la victoria, sin bottom
    const LORD: Record<string, number> = { TOP2: 0, HIGH: 1, SAFE: 2, LOW: 3 };
    brTop = [];
    s.br!.groups.forEach((g) => {
      const R = rows.filter((r) => g.includes(r.key));
      weekLabels(R.map((r) => ({ key: r.key })), { twist: "brackets", nb: 0, bottom: [] }).forEach((l, i) => (R[i].label = l));
      if (R.length >= 2) brTop!.push([R[0].key, R[1].key]);
    });
    rows = rows.slice().sort((a, b) => (LORD[a.label] ?? 2) - (LORD[b.label] ?? 2) || b.score - a.score);
  } else {
    const labels = weekLabels(rows.map((r) => ({ key: r.key, group: groupOf ? groupOf[r.key] : undefined })), { twist, nb, bottom: rows.slice(n - nb).map((r) => r.key), blocked, nGroups: G ? order.length : undefined });
    rows.forEach((r, i) => (r.label = labels[i]));
  }
  // Doble victoria: si las dos mejores van casi empatadas, a veces ganan las dos
  if (!G && !isAS(s) && !isAW(s) && n >= 5 && rows[0]?.label === "WIN" && rows[1]?.label === "HIGH" && rows[0].score - rows[1].score <= 1 && e.rnd() < 0.5) rows[1].label = "WIN";
  const allCrit = allCritiqued(n, twist);
  const crit = rows
    .filter((r) => allCrit || r.label !== "SAFE")
    .map((r) => {
      const level = /WIN|TOP2|BTOP|HIGH/.test(r.label) ? "top" : r.label === "SAFE" ? "mid" : "low";
      const nm = isP(r.key) ? e.queenName(queenOfKey(s, r.key)) : e.queenName(idOf(r.key));
      // El look va aparte: la pasarela de la jugadora, o la de la rival esa semana
      const qid = isP(r.key) ? queenOfKey(s, r.key) : idOf(r.key);
      const walk = isP(r.key) ? s.subs[idOf(r.key)]?.walk : undefined;
      const antes = Object.keys(s.track[r.key] || {}).map(Number).filter((ep) => ep < s.ep).sort((a, b) => a - b).map((ep) => s.track[r.key][ep]);
      // All Winners: solo se valora a las mejores de la semana, y todo en positivo (también el look)
      const lookLvl = isAW(s) ? "top" : nivelNota(walk ?? lookRival(qid, s.ep));
      const lines = e.critique(tipo, isAW(s) ? "top" : level, nm, lookLvl, { cat: s.reto?.cat?.n, antes: isAW(s) ? [] : antes });
      // Reto en directo: Supremme le dice lo que el jurado apuntó mientras lo hacía
      const jury = isP(r.key) ? (s.subs[idOf(r.key)]?.jury || "").trim() : "";
      if (jury && lines[1]) lines[1] = [lines[1][0], `${nm}, ${jury.length > 240 ? jury.slice(0, 240).replace(/\s+\S*$/, "") + "..." : jury}`];
      return { key: r.key, lines };
    })
    .sort(() => e.rnd() - 0.5) // desordenadas: que el orden no delate posiciones
    // Supremme: «Hablamos con» a la primera y «Ahora hablamos con» a las demás
    .map((c, i) => (c.lines[0] && /^(Ahora h|H)ablamos con /.test(c.lines[0][1]) ? { ...c, lines: [[c.lines[0][0], c.lines[0][1].replace(/^(Ahora h|H)ablamos con /, i ? "Ahora hablamos con " : "Hablamos con ")] as [string, string], ...c.lines.slice(1)] } : c));
  // Por grupos: antes de las críticas una a una, el jurado valora cada grupo por su nombre
  const gcrit = G ? (isAW(s) ? order.slice(0, 1) : order).map((gi, pos) => ({ name: G.names[gi], keys: G.members[gi], lines: grupoCritica(G.names[gi], pos === 0 ? "top" : pos === order.length - 1 ? "low" : "mid", e.rnd).map(([k, t]) => [NOMBRE_JURADO[k], t] as [string, string]) })) : undefined;
  return { ...s, rows, crit, gcrit, brTop };
}

const writeTrack = (s: RoomState, rows: Row[]) => {
  const track = { ...s.track };
  rows.forEach((r) => (track[r.key] = { ...(track[r.key] || {}), [s.ep]: r.label }));
  const mc = mcOf(s);
  if (mc) track[mc] = { ...(track[mc] || {}), [s.ep]: "MC" };
  return track;
};

/** Resuelve los lip syncs pendientes: entre rivales del juego decide la simulación; si hay jugadoras, sus resultados. */
export function resolvePairs(s: RoomState, e: Engine): Pair[] {
  return (s.pairs || []).map((p) => {
    if (p.winner) return p;
    const qa = queenOfKey(s, p.a), qb = queenOfKey(s, p.b);
    const la = isP(p.a) ? s.subs[idOf(p.a)]?.ls : undefined, lb = isP(p.b) ? s.subs[idOf(p.b)]?.ls : undefined;
    let w: string;
    if (isP(p.a) && isP(p.b)) {
      const sa = la ? la.score : -1, sb = lb ? lb.score : -1;
      w = sa === sb ? (e.simLS(qa, qb) === qa ? p.a : p.b) : sa > sb ? p.a : p.b;
    } else if (isP(p.a)) w = la?.won ? p.a : p.b;
    else if (isP(p.b)) w = lb?.won ? p.b : p.a;
    else w = e.simLS(qa, qb) === qa ? p.a : p.b;
    return { ...p, winner: w };
  });
}

function eliminate(s: RoomState, key: string, place: string, label = "ELIM", e?: Pick<Engine, "rnd">): RoomState {
  const players = s.players.map((p) => (pkey(p.id) === key ? { ...p, alive: false } : p));
  const npcs = s.npcs.filter((q) => nkey(q) !== key);
  const track = { ...s.track, [key]: { ...(s.track[key] || {}), [s.ep]: label } };
  const t: RoomState = { ...s, players, npcs, track, out: [...s.out, { key, ep: s.ep, place }] };
  // Si se va la que tenía la reina de la suerte, se pierde
  if (t.luck === key) t.luck = null;
  // Temporada del corazón: la que se va deja medio corazón a una compañera (se sabrá la semana que viene)
  if (t.fmt === "corazon" && e) {
    const left = aliveKeys(t);
    if (left.length > 1) t.pendingHearts = [...(t.pendingHearts || []), { from: key, to: pickWith(left, e), ep: s.ep }];
  }
  return t;
}
/** Vuelve a la competición (Segunda Oportunidrag). */
function revive(s: RoomState, key: string): RoomState {
  const players = s.players.map((p) => (pkey(p.id) === key ? { ...p, alive: true } : p));
  const npcs = isP(key) ? s.npcs : [...s.npcs, idOf(key)];
  const track = { ...s.track, [key]: { ...(s.track[key] || {}), [s.ep]: "RTRN" } };
  return { ...s, players, npcs, track, out: s.out.filter((o) => o.key !== key) };
}

// ------------------------------ All Stars por brackets ------------------------------
/** Tras los lip syncs por la victoria: WIN para las ganadoras y, la última semana de los brackets, el corte. */
function bracketLipsync(s: RoomState, now: number, e: Engine): RoomState {
  const pairs = resolvePairs(s, e);
  const track = { ...s.track };
  pairs.forEach((p) => p.winner && (track[p.winner] = { ...(track[p.winner] || {}), [s.ep]: "WIN" }));
  let t: RoomState = { ...s, pairs, track };
  const nm = (k: string) => nameOfKey(t, k, e);
  const B = s.br!;
  const wonTxt = pairs.filter((p) => p.winner).map((p) => nm(p.winner!)).join(", ");
  const D = DURACION[s.ritmo];
  if (s.ep < B.start + B.per - 1) return { ...t, note: `Ganan el lip sync por la victoria: ${wonTxt}. Nadie se va a casa: se suman los puntos.`, phase: "track", deadline: limite(now, D.track), v: s.v + 1 };
  // El corte: pasa la mitad de cada bracket (las de más puntos); las demás, a casa
  const eps = Array.from({ length: B.per }, (_, i) => B.start + i);
  const alive = new Set(aliveKeys(t));
  const gone: string[] = [];
  const adv: string[] = [];
  B.groups.forEach((g) => {
    const cl = clasificacion(g.filter((k) => alive.has(k)), (k) => t.track[k], eps, e.rnd);
    const n = Math.ceil(g.length / 2);
    adv.push(...cl.slice(0, n).map((x) => x.k));
    gone.push(...cl.slice(n).map((x) => x.k));
  });
  const A = alive.size - gone.length;
  const place = gone.length > 1 ? `${A + 1}º/${A + gone.length}º` : `${A + 1}º`;
  gone.forEach((k) => (t = eliminate(t, k, place, "ELIM", e)));
  const note = `Ganan el lip sync por la victoria: ${wonTxt}. Fin de los brackets: pasan ${adv.map(nm).join(", ")}. Desde ahora, cada una por su cuenta.`;
  return { ...t, br: { ...B, done: true }, al: undefined, brTop: undefined, note, phase: "track", deadline: limite(now, D.track), v: s.v + 1 };
}
/** ¿Toca ya la final del All Stars por brackets? Con siete (o menos) tras los brackets. */
const brFinalToca = (s: RoomState) => s.fmt === "brackets" && !!s.br?.done && !s.br.final && aliveKeys(s).length <= BRACKETS_FINAL;
/**
 * Final del All Stars por brackets: vuelve una eliminada (la mejor de cada bracket se juega volver en lip syncs) y
 * Lalaparuza por eliminatorias entre todas: las que pierden en la 1ª ronda, fuera; en la 2ª, fuera; y la última, la corona.
 */
function brFinalStart(s: RoomState, now: number, e: Engine): RoomState {
  const B = s.br!;
  const ep = s.ep + 1;
  const nm = (k: string) => nameOfKey(s, k, e);
  const outK = new Set(s.out.map((o) => o.key));
  const eps = Array.from({ length: B.per }, (_, i) => B.start + i);
  const val = (k: string) => puntos(s.track[k], eps) + ppeOf(s, k);
  const cands = B.groups.map((g) => g.filter((k) => outK.has(k)).sort((a, b) => val(b) - val(a))[0]).filter(Boolean).sort((a, b) => val(a) - val(b));
  let back = cands[0];
  cands.slice(1).forEach((c) => { const qa = queenOfKey(s, back), qc = queenOfKey(s, c); back = e.simLS(qa, qc) === qa ? back : c; });
  // Vuelve (RTRN en la última semana, como en el programa) y empieza el episodio de la Lalaparuza
  const base = back ? revive(s, back) : s;
  let t: RoomState = { ...base, ep, epNames: { ...base.epNames, [ep]: "Lalaparuza" }, reto: undefined, rows: undefined, crit: undefined, subs: {}, pairs: undefined, bottom: undefined, br: { ...B, final: true } };
  const sd = seeds(t);
  const note = `${cands.length > 1 ? `Lip sync de las eliminadas (${cands.map(nm).join(", ")}): vuelve ${nm(back)}. ` : back ? `Vuelve ${nm(back)}. ` : ""}Y ahora, la Lalaparuza: eliminatorias de lip sync. La que pierde, a casa.`;
  t = { ...t, awFinal: { top: sd, bottom: [], tierB: "", tierQ: "" } };
  return bracketRound({ ...t, bracket: { kind: "corona", seeds: sd, alive: sd, round: 1 } }, now, e, note);
}

// ------------------------------ Track record ------------------------------
const labelsOf = (s: RoomState, k: string) => Object.values(s.track[k] || {});
export const ppeOf = (s: RoomState, k: string) => ppe(labelsOf(s, k));
export const winsOf = (s: RoomState, k: string) => labelsOf(s, k).filter((l) => l === "WIN" || l === "BWIN" || l === "WINNER").length;
/** Orden del último episodio con resultados (como en el modo historia). */
const ORDER: Record<string, number> = { WINNER: 0, WIN: 1, BWIN: 1, "RUNNER-UP": 2, TOP2: 3, BTOP: 3, HIGH: 4, "3ª": 5, QOSD: 5.5, LOST2: 5.6, LOST1: 5.9, SAFE: 6, MC: 6, RTRN: 6.5, LOW: 7, BTM2: 8, BTM3: 8, ELIMF: 8.5, ELIM: 9 };
/** Clasificación para el track record: arriba las que siguen (por su última semana y su temporada); debajo las eliminadas, de la última a la primera. */
export function standings(s: RoomState): { key: string; place: string; out: boolean }[] {
  const eps = Object.keys(s.epNames).map(Number).sort((a, b) => a - b);
  const outKeys = s.out.map((o) => o.key);
  const alive = aliveKeys(s).filter((k) => !outKeys.includes(k));
  const lastScored = [...eps].reverse().find((e) => alive.some((k) => ORDER[(s.track[k] || {})[e]] !== undefined));
  const last = (k: string) => { const l = lastScored != null ? (s.track[k] || {})[lastScored] : undefined; return l && ORDER[l] !== undefined ? ORDER[l] : 7.5; };
  const count = (k: string, re: RegExp) => labelsOf(s, k).filter((l) => re.test(l)).length;
  const stars = (k: string) => (s.fmt === "winners" ? s.stars?.[k] || 0 : 0);
  const top = alive.slice().sort((a, b) => (s.champion === b ? 1 : 0) - (s.champion === a ? 1 : 0) || stars(b) - stars(a) || last(a) - last(b) || ppeOf(s, b) - ppeOf(s, a) || count(b, /^WIN/) - count(a, /^WIN/) || count(a, /^BTM/) - count(b, /^BTM/));
  const gone = s.out.map((o, i) => ({ ...o, i })).sort((a, b) => b.ep - a.ep || b.i - a.i);
  return [
    ...top.map((key, i) => ({ key, place: `${i + 1}º`, out: false })),
    ...gone.map((o) => ({ key: o.key, place: o.place, out: true })),
  ];
}

// ------------------------------ All Stars: la ganadora del lip sync elige ------------------------------
/** Cómo se lee la decisión: la peor de la semana (justa), la de peor temporada (trayectoria) o quitarse a una rival fuerte (jugarreta). */
export function decisionKind(s: RoomState, go: string, stay: string): "semana" | "trayectoria" | "jugarreta" {
  const sc = (k: string) => (s.rows || []).find((r) => r.key === k)?.score ?? 0;
  return lipstickKind(go, stay, sc, (k) => ppeOf(s, k));
}
/** Decisión de una reina del juego: mira la semana y la temporada; a veces, estrategia. */
export function autoDecide(s: RoomState, options: string[], e: Pick<Engine, "rnd">): string {
  if (options.length < 2) return options[0];
  const sc = (k: string) => (s.rows || []).find((r) => r.key === k)?.score ?? 0;
  const wT = 4 + e.rnd() * 8;
  const merit = (k: string) => sc(k) + ppeOf(s, k) * wT;
  const deserved = options.slice().sort((a, b) => merit(a) - merit(b))[0];
  const strength = (k: string) => ppeOf(s, k) * 2 + labelsOf(s, k).filter((l) => l === "WIN" || l === "TOP2").length;
  const strong = options.slice().sort((a, b) => strength(b) - strength(a))[0];
  return e.rnd() < 0.22 && strong !== deserved ? strong : deserved;
}

// ------------------------------ Giros de cada temporada ------------------------------
const STAGES = ["corazon", "suerte", "moneda"] as const;
/** Salvar a una del bottom: entra la siguiente con peor nota (que no sea la ganadora ni esté ya salvada). */
export function saveFromBottom(s: RoomState, key: string): { s: RoomState; entered?: string } {
  const bottom = s.bottom || [];
  const rows = s.rows || [];
  const alive = new Set(aliveKeys(s));
  const r = rescueFromBottom({ order: rows.map((x) => x.key), bottom, save: key, protectedKeys: s.protectedKeys, winner: rows[0]?.key, eligible: (k) => alive.has(k) });
  if (!r) return { s };
  const track = { ...s.track, [r.entered]: { ...(s.track[r.entered] || {}), [s.ep]: `BTM${bottom.length}` } };
  return { s: { ...s, bottom: r.bottom, protectedKeys: r.protectedKeys, track }, entered: r.entered };
}
/** Lo que deciden las reinas del juego en cada giro. */
function npcPicks(s: RoomState, by: string[], kind: Twist["kind"], options: string[], e: Pick<Engine, "rnd">): Record<string, string> {
  const out: Record<string, string> = {};
  const late = aliveKeys(s).length <= 6;
  by.filter((k) => !isP(k)).forEach((k) => {
    if (kind === "moneda") out[k] = pickWith(options, e);
    else if (kind === "bloqueo") out[k] = options.slice().sort((a, b) => (s.stars?.[b] || 0) - (s.stars?.[a] || 0) || e.rnd() - 0.5)[0];
    else if (options.includes(k)) out[k] = k; // si está en el bottom, se salva a sí misma
    else out[k] = e.rnd() < (kind === "corazon" ? 0.4 : late ? 0.35 : 0.15) ? pickWith(options, e) : "keep";
  });
  return out;
}
function toComodin(s: RoomState, tw: Twist, stage: number, now: number): RoomState {
  const anyP = tw.by.some(isP);
  const subs = Object.fromEntries(Object.entries(s.subs).map(([k, v]) => [k, { ...v, pick: undefined }]));
  return { ...s, twist: tw, stage, subs, phase: "comodin", deadline: anyP ? limite(now, DURACION[s.ritmo].comodin) : now + 7000, v: s.v + 1 };
}
function startStage(s: RoomState, i: number, now: number, e: Engine): RoomState | null {
  const st = STAGES[i];
  const bottom = s.bottom || [];
  if (st === "corazon") {
    if (s.fmt !== "corazon" || !(s.pendingHearts || []).length) return null;
    const alive = new Set(aliveKeys(s));
    const gifts = (s.pendingHearts || []).filter((g) => alive.has(g.to));
    const { hearts, full } = addHalfHearts(s.hearts || {}, gifts, (k) => alive.has(k));
    const base: RoomState = { ...s, hearts, pendingHearts: [], stage: i, twist: undefined };
    if (full.length && bottom.length) base.twist = { kind: "corazon", by: full, options: bottom, picks: npcPicks(base, full, "corazon", bottom, e) };
    if (!gifts.length && !base.twist) return null;
    return { ...base, twistResult: { kind: "corazones", gifts, full }, phase: "sorpresa", deadline: 0, v: s.v + 1 };
  }
  if (st === "suerte") {
    if (s.fmt !== "suerte" || !s.luck || !aliveKeys(s).includes(s.luck) || aliveKeys(s).length < 4 || !bottom.length) return null;
    const by = [s.luck];
    return toComodin(s, { kind: "suerte", by, options: bottom, picks: npcPicks(s, by, "suerte", bottom, e) }, i, now);
  }
  if (s.fmt !== "moneda" || bottom.length !== 3) return null;
  const voters = aliveKeys(s).filter((k) => !bottom.includes(k));
  return toComodin(s, { kind: "moneda", by: voters, options: bottom, cara: e.rnd() < 0.5, picks: npcPicks(s, voters, "moneda", bottom, e) }, i, now);
}
/** Sigue con los giros que falten esta semana y, al final, el lip sync. */
function continueChain(s: RoomState, from: number, now: number, e: Engine): RoomState {
  for (let i = from; i < STAGES.length; i++) {
    const r = startStage(s, i, now, e);
    if (r) return r;
  }
  return toLipsync(s, now);
}
function toLipsync(s: RoomState, now: number): RoomState {
  const b = s.bottom || [];
  const subs = Object.fromEntries(Object.entries(s.subs).map(([k, v]) => [k, { ...v, ls: undefined }]));
  const triple = b.length === 3 ? b : undefined;
  // All Stars por brackets: un lip sync por la victoria en cada bracket
  const brP: Pair[] | null = brPhase(s) && s.brTop ? s.brTop.map(([a, x]) => ({ a, b: x })) : null;
  const pairs: Pair[] = brP || (!triple && b.length === 2 ? [{ a: b[0], b: b[1] }] : []);
  const anyP = [...b, ...pairs.flatMap((p) => [p.a, p.b])].some(isP);
  return { ...s, subs, pairs, triple, twist: undefined, twistResult: undefined, phase: "lipsync", deadline: anyP ? limite(now, DURACION[s.ritmo].lipsync) : now + 6000, v: s.v + 1 };
}
/** Resuelve un comodín: aplica lo que decidió cada una (o lo decide el juego si no llegó a tiempo). */
function resolveTwist(s: RoomState, now: number, e: Engine): RoomState {
  const t = s.twist!;
  if (t.kind === "corte") {
    // La que más estrellas tiene elige quién pasa el corte; si no llega a tiempo, pasan las de mejor PPE
    const by = t.by[0], need = t.need || 1;
    const raw = (isP(by) ? s.subs[idOf(by)]?.pick : "") || "";
    let picked = [...new Set(raw.split(","))].filter((k) => t.options.includes(k)).slice(0, need);
    if (picked.length < need) picked = [...picked, ...t.options.filter((k) => !picked.includes(k)).sort((a, b) => ppeOf(s, b) - ppeOf(s, a))].slice(0, need);
    return awStart({ ...s, twist: undefined }, [...(t.sure || []), ...picked], now, e, { chooser: by, picked, tied: t.options });
  }
  const picks = { ...t.picks };
  t.by.forEach((k) => {
    if (picks[k]) return;
    const pk = isP(k) ? s.subs[idOf(k)]?.pick : undefined;
    if (pk && (pk === "keep" || t.options.includes(pk))) picks[k] = pk;
    else picks[k] = t.kind === "moneda" ? pickWith(t.options, e) : t.kind === "bloqueo" ? npcPicks(s, [nkey("x")], "bloqueo", t.options, e)[nkey("x")] : "keep";
  });
  let r: RoomState = { ...s, twist: { ...t, picks } };
  let res: TwistResult;
  if (t.kind === "suerte" || t.kind === "corazon") {
    const saved: string[] = [], entered: string[] = [];
    const hearts = { ...(r.hearts || {}) };
    t.by.forEach((k) => {
      if (t.kind === "corazon") hearts[k] = 0; // el corazón entero se usa ahora o se pierde
      const pk = picks[k];
      if (pk === "keep") return;
      const o = saveFromBottom(r, pk);
      if (o.entered) { r = o.s; saved.push(pk); entered.push(o.entered); if (t.kind === "suerte") r.luck = null; }
    });
    if (t.kind === "corazon") r.hearts = hearts;
    res = { kind: t.kind, by: t.by.find((k) => picks[k] !== "keep") || t.by[0], saved, entered };
  } else if (t.kind === "moneda") {
    // Empate: desempata la ganadora de la semana (su voto, si está entre las empatadas)
    const win = (s.rows || [])[0]?.key;
    const sc = (k: string) => (s.rows || []).find((x) => x.key === k)?.score ?? 0;
    const c = coinResult({ cara: !!t.cara, options: t.options, picks: Object.fromEntries(t.by.map((k) => [k, picks[k]])), scoreOf: sc, breakTie: (tied) => (win && tied.includes(picks[win]) ? picks[win] : pickWith(tied, e)) });
    r.bottom = c.pair;
    res = { kind: "moneda", votes: c.votes, chosen: c.chosen, cara: t.cara, tie: c.tie };
  } else {
    const by = t.by[0];
    r.block = { ep: s.ep + 1, id: picks[by], by };
    res = { kind: "bloqueo", by, target: picks[by], stars: t.starred || [] };
  }
  return { ...r, twistResult: res, phase: "sorpresa", deadline: 0, v: s.v + 1 };
}
/** Lip sync a tres bandas: se salva una (la jugadora que gane con más nota; si ninguna gana, la mejor del juego). */
function resolveTriple(s: RoomState, e: Engine): string {
  const T = s.triple || [];
  const ls = (k: string) => s.subs[idOf(k)]?.ls;
  const winners = T.filter((k) => isP(k) && ls(k)?.won).sort((a, b) => (ls(b)?.score || 0) - (ls(a)?.score || 0));
  if (winners.length) return winners[0];
  const npcs = T.filter((k) => !isP(k));
  if (!npcs.length) return T.slice().sort((a, b) => (ls(b)?.score || 0) - (ls(a)?.score || 0))[0];
  return npcs.slice(1).reduce((best, k) => (e.simLS(queenOfKey(s, best), queenOfKey(s, k)) === queenOfKey(s, best) ? best : k), npcs[0]);
}

/** Siembra de la final por PPE (1 contra 4, 2 contra 3). */
// ------------------------------ Lalaparuza ------------------------------
// Como en el programa (src/core/lala.ts): la que gana su duelo se salva; las que pierden siguen luchando entre ellas
// y las dos que lo pierden todo son el bottom (van al lip sync de eliminación de siempre). Cruces por la temporada (PPE).
function lzStart(s: RoomState, now: number, e: Engine): RoomState {
  const ranked = aliveKeys(s).sort((a, b) => ppeOf(s, b) - ppeOf(s, a) || winsOf(s, b) - winsOf(s, a) || e.rnd() - 0.5);
  return lzRound({ ...s, lala: { ...lalaStart(ranked), ls: {} } }, now);
}
function lzRound(s: RoomState, now: number): RoomState {
  const L = s.lala!;
  const pairs: Pair[] = lalaPending(L).map((m) => ({ a: m.a!, b: m.b! }));
  const anyP = pairs.some((p) => isP(p.a) || isP(p.b));
  const subs = Object.fromEntries(Object.entries(s.subs).map(([k, v]) => [k, { ...v, ls: undefined }]));
  // Antes de cada ronda se ve cómo va (quién está a salvo y quién se enfrenta a quién); luego empiezan los lip syncs
  return { ...s, lala: { ...L, show: true }, subs, pairs, finalStage: 300 + L.round, phase: "lalaparuza", deadline: now + (anyP ? LZ_VER : LZ_VER_NPC), v: s.v + 1 };
}
/** Cuánto se ve el cuadro antes de cada ronda, y cuánto dura una ronda que solo bailan reinas del juego. */
export const LZ_VER = 9000, LZ_VER_NPC = 8000, LZ_NPC = 9000;
function lzGo(s: RoomState, now: number): RoomState {
  const anyP = (s.pairs || []).some((p) => isP(p.a) || isP(p.b));
  return { ...s, lala: { ...s.lala!, show: false }, duelKey: undefined, phase: "lalaparuza", deadline: anyP ? limite(now, DURACION[s.ritmo].lalaparuza) : now + LZ_NPC, v: s.v + 1 };
}
function lzNext(s: RoomState, now: number, e: Engine): RoomState {
  const L0 = s.lala!;
  const pairs = resolvePairs(s, e);
  const ls = { ...L0.ls };
  let L: Lala = L0;
  pairs.forEach((p) => {
    L = lalaResolve(L, p.a, p.b, p.winner!);
    [p.a, p.b].forEach((k) => { if (isP(k)) { const sc = s.subs[idOf(k)]?.ls?.score; if (sc != null) ls[k] = sc; } });
  });
  let t: RoomState = { ...s, pairs, lala: { ...L0, ...L, ls } };
  if (!L.done) return lzRound(t, now);
  // Fin: las que se salvan antes, arriba; las dos del bottom, abajo (tu lip sync matiza dentro de cada ronda)
  const score: Record<string, number> = {};
  aliveKeys(s).forEach((k) => {
    const tweak = isP(k) ? (ls[k] ?? 50) - 50 : e.rivalScore(idOf(k), LALA.tipo) - 55;
    score[k] = lalaScoreDe(L.saved[k], tweak);
  });
  const best = Object.keys(score).sort((a, b) => score[b] - score[a]);
  t = { ...t, lala: { ...t.lala!, done: true, score, champ: best[0], top2: best.slice(0, 2) } };
  // Sin pasarela: directas a las críticas
  return advanceRaw({ ...t, phase: "pasarela", finalStage: undefined, pairs: undefined }, now, e);
}
// ------------------------------ Gran final de All Winners ------------------------------
// Igual que en el modo historia: las 4 con más estrellas van por la corona (si hay empate en el corte, decide la que más tiene);
// las demás se juegan la Queen of She Done Already Done Had Herses. Las dos son eliminatorias de lip syncs (1ª-4ª, 2ª-3ª; la mejor descansa si sois impares).
function awCut(s: RoomState, now: number, e: Engine): RoomState {
  const ranked = seeds(s);
  const { sure, tied, tie, need, chooser, direct } = allWinnersCut(ranked, (k) => s.stars?.[k] || 0);
  const ep = s.ep + 1;
  const base: RoomState = { ...s, ep, epNames: { ...s.epNames, [ep]: "Gran final" }, reto: undefined, rows: undefined, crit: undefined, subs: {} };
  if (tie) {
    if (isP(chooser) && !tied.includes(chooser)) return toComodin(base, { kind: "corte", by: [chooser], options: tied, picks: {}, need, sure }, -1, now);
    const picked = [...(tied.includes(chooser) ? [chooser] : []), ...tied.filter((k) => k !== chooser).sort((a, b) => ppeOf(s, b) - ppeOf(s, a))].slice(0, need);
    return awStart(base, [...sure, ...picked], now, e, { chooser, picked, tied });
  }
  return awStart(base, direct, now, e);
}
function awStart(s: RoomState, top: string[], now: number, e: Engine, cut?: { chooser: string; picked: string[]; tied: string[] }): RoomState {
  const ranked = seeds(s);
  const topS = ranked.filter((k) => top.includes(k)), bottom = ranked.filter((k) => !top.includes(k));
  const { qosd: tierQ, rest: tierB } = allWinnersBottom(topS.length, bottom.length);
  const nm = (k: string) => nameOfKey(s, k, e);
  const list = (ks: string[]) => ks.map(nm).join(", ").replace(/, ([^,]*)$/, " y $1");
  const stars4 = cut ? s.stars?.[cut.tied[0]] || 0 : 0;
  const left = cut ? cut.tied.filter((k) => !cut.picked.includes(k)) : [];
  const note = [
    cut ? `Empate a ${stars4} ${stars4 === 1 ? "estrella" : "estrellas"} entre ${list(cut.tied)}: decide ${nm(cut.chooser)}, la que más estrellas tiene, y elige a ${list(cut.picked)}.${left.length ? ` ${list(left)}, os jugáis el otro título.` : ""}` : "",
    `${list(topS)}: sois las ${topS.length} con más estrellas. Os jugáis la corona de Reina de reinas.`,
    bottom.length ? `${list(bottom)}: os jugáis el título de Queen of She Done Already Done Had Herses. Porque ya lo habíais hecho todo.` : "",
  ].filter(Boolean).join(" ");
  let t: RoomState = { ...s, awFinal: { top: topS, bottom, tierB, tierQ } };
  if (bottom.length === 1) t = { ...eliminate(t, bottom[0], tierQ, "QOSD"), awFinal: { top: topS, bottom, tierB, tierQ, qosd: bottom[0] } };
  const br = bottom.length >= 2 ? { kind: "qosd" as const, seeds: bottom, alive: bottom, round: 1 } : { kind: "corona" as const, seeds: topS, alive: topS, round: 1 };
  return bracketRound({ ...t, bracket: br }, now, e, note);
}
function bracketRound(s: RoomState, now: number, e: Engine, note: string): RoomState {
  const b = s.bracket!;
  const al = b.seeds.filter((k) => b.alive.includes(k));
  const bye = al.length % 2 ? al[0] : undefined;
  const pool = al.filter((k) => k !== bye);
  const pairs: Pair[] = [];
  for (let i = 0; i < pool.length / 2; i++) pairs.push({ a: pool[i], b: pool[pool.length - 1 - i] });
  const anyP = pairs.some((p) => isP(p.a) || isP(p.b));
  const rest = bye ? `${nameOfKey(s, bye, e)} descansa esta ronda.` : "";
  return { ...s, bracket: { ...b, alive: al, bye }, pairs, finalStage: (b.kind === "qosd" ? 100 : 200) + b.round, subs: {}, note: [note, rest].filter(Boolean).join(" "), phase: "final", deadline: anyP ? limite(now, DURACION[s.ritmo].final) : now + 8000, v: s.v + 1 };
}
function bracketNext(s: RoomState, now: number, e: Engine): RoomState {
  const b = s.bracket!, af = s.awFinal!;
  const pairs = resolvePairs(s, e);
  let t: RoomState = { ...s, pairs };
  const winners = pairs.map((p) => p.winner!);
  const losers = pairs.map((p) => (p.winner === p.a ? p.b : p.a));
  const alive = [...(b.bye ? [b.bye] : []), ...winners];
  const nm = (k: string) => nameOfKey(t, k, e);
  const list = (ks: string[]) => ks.map(nm).join(", ").replace(/, ([^,]*)$/, " y $1");
  const duels = pairs.map((p) => `${nm(p.winner!)} gana a ${nm(p.winner === p.a ? p.b : p.a)}.`).join(" ");
  if (b.kind === "qosd") {
    losers.forEach((l) => (t = eliminate(t, l, af.tierB, "ELIMF")));
    if (alive.length > 1) return bracketRound({ ...t, bracket: { ...b, alive, round: b.round + 1 } }, now, e, duels);
    t = { ...eliminate(t, alive[0], af.tierQ || af.tierB, "QOSD"), awFinal: { ...af, qosd: alive[0] } };
    return bracketRound({ ...t, bracket: { kind: "corona", seeds: af.top, alive: af.top, round: 1 } }, now, e, `${duels} 💅 ${nm(alive[0])} se lleva el título de QoSDADHH. Ahora, la final por la corona: ${list(af.top)}.`);
  }
  if (alive.length > 1 && s.fmt === "brackets") {
    // Lalaparuza final del All Stars por brackets: pierde en la 1ª ronda o en la 2ª (las dos de la semifinal)
    const lab = alive.length > 2 ? "LOST1" : "LOST2";
    const place = losers.length > 1 ? `${alive.length + 1}º/${alive.length + losers.length}º` : `${alive.length + 1}º`;
    losers.forEach((l) => (t = eliminate(t, l, place, lab)));
    return bracketRound({ ...t, bracket: { ...b, alive, round: b.round + 1 } }, now, e, duels);
  }
  if (alive.length > 1) {
    losers.forEach((l) => (t = eliminate(t, l, af.top.length > 3 ? "3º/4º" : "3º", "3ª")));
    return bracketRound({ ...t, bracket: { ...b, alive, round: b.round + 1 } }, now, e, duels);
  }
  t = eliminate(t, losers[0], "2º", "RUNNER-UP");
  t = { ...t, track: { ...t.track, [alive[0]]: { ...(t.track[alive[0]] || {}), [s.ep]: "WINNER" } } };
  return { ...t, champion: alive[0], phase: "corona", deadline: 0, v: s.v + 1 };
}
// ------------------------------ Reencuentro y gran final ------------------------------
/** El reencuentro: vuelven las eliminadas, se vota Miss Simpatía y se sortea cómo será la final. */
function reunion(s: RoomState, e: Engine): RoomState {
  const n = aliveKeys(s).length;
  const opts: FinalFmt[] = n >= 3 ? ["torneo", "reto", "track", "votan", "cuatro", "cadena"] : ["torneo", "reto", "track", "votan"];
  const finalFmt = opts[Math.floor(e.rnd() * opts.length)];
  return { ...s, reunionDone: true, finalFmt, subs: {}, note: undefined, script: undefined, phase: "reencuentro", deadline: 0, v: s.v + 1 };
}
/** Miss Simpatía: votan todas (las jugadoras eligen; las reinas del juego, al azar). Nadie se vota a sí misma. */
function missSimpatia(s: RoomState, e: Engine): { key: string; votes: Record<string, number> } {
  const all = [...aliveKeys(s), ...s.out.map((o) => o.key)];
  const votes: Record<string, number> = {};
  all.forEach((v) => {
    const own = isP(v) ? s.subs[idOf(v)]?.pick : undefined;
    const others = all.filter((k) => k !== v);
    const pick = own && others.includes(own) ? own : others[Math.floor(e.rnd() * others.length)];
    if (pick) votes[pick] = (votes[pick] || 0) + 1;
  });
  const key = Object.keys(votes).sort((a, b) => votes[b] - votes[a] || e.rnd() - 0.5)[0] || all[0];
  return { key, votes };
}
/** Empieza la gran final con la forma que ha tocado. */
function startFinal(s0: RoomState, now: number, e: Engine): RoomState {
  const D = DURACION[s0.ritmo];
  const sd = seeds(s0);
  const ep = s0.ep + 1;
  const fmt: FinalFmt = sd.length < 3 && (s0.finalFmt === "cuatro" || s0.finalFmt === "cadena") ? "torneo" : s0.finalFmt || "torneo";
  const s: RoomState = { ...s0, ep, finalFmt: fmt, epNames: { ...s0.epNames, [ep]: "Gran final" }, reto: undefined, rows: undefined, crit: undefined, subs: {}, note: undefined, script: undefined, pairs: undefined, triple: undefined, bottom: undefined, twist: undefined, twistResult: undefined };
  const go = (t: RoomState, pairs: Pair[], finalStage: number, extra: Partial<RoomState> = {}): RoomState => {
    const anyP = pairs.some((p) => isP(p.a) || isP(p.b)) || (extra.quad || []).some(isP);
    return { ...t, ...extra, pairs, finalStage, phase: "final", deadline: anyP ? limite(now, D.final) : now + 8000, v: s0.v + 1 };
  };
  const nm = (k: string) => nameOfKey(s, k, e);
  // Pase directo: la que lo tiene espera en la final; las demás se juegan el otro puesto
  const pase = s0.pase && sd.includes(s0.pase) && sd.length >= 3 ? s0.pase : undefined;
  const rest0 = pase ? sd.filter((k) => k !== pase) : sd;
  if (pase && fmt !== "reto") {
    if (fmt === "track") {
      let t = s;
      rest0.slice(1).forEach((k) => (t = eliminate(t, k, rest0.length > 2 ? `3ª/${rest0.length + 1}ª` : "3ª", "3ª")));
      return go(t, [{ a: rest0[0], b: pase }], 2, { note: `${nm(pase)} tiene el pase directo. ${nm(rest0[0])}, la mejor del resto de la temporada, se la juega con ella.` });
    }
    if (fmt === "cuatro") return go(s, [], 5, { quad: rest0.slice(), note: `${nm(pase)} tiene el pase directo y espera en la final.` });
    // Súper Lalaparuza, la reina de la pista y votan las eliminadas: lip syncs en cadena entre las demás
    const order = rest0.slice().reverse();
    const queue = fmt === "votan" ? order.slice(2) : [...order.slice(2), pase];
    return go(s, [{ a: order[0], b: order[1] }], 4, { chain: queue, note: `${nm(pase)} tiene el pase directo: espera ${fmt === "votan" ? "a la ganadora, y la corona la votan las eliminadas" : "a la que gane la cadena de lip syncs"}.` });
  }
  if (fmt === "reto") {
    // Un último reto con pasarela (sin grupos ni Lalaparuza): lo que no se haya hecho aún, si queda
    const all = e.retos().filter((r) => !r.groups && r.tipo !== LALA.tipo && !r.noRunway);
    const pool = all.filter((r) => !s.used.includes(r.tipo));
    const src = pool.length ? pool : all.length ? all : e.retos();
    const r: Reto = { ...src[Math.floor(e.rnd() * src.length)] };
    if (!r.noRunway) { const cats = e.categorias(); r.cat = cats[Math.floor(e.rnd() * cats.length)]; }
    return { ...s, reto: r, used: [...s.used, r.tipo], finalRun: true, epNames: { ...s.epNames, [ep]: `Gran final · ${r.titulo}` }, phase: "anuncio", deadline: 0, v: s0.v + 1 };
  }
  if (fmt === "track") {
    let t = s;
    const rest = sd.slice(2);
    rest.forEach((k) => (t = eliminate(t, k, rest.length > 1 ? `3ª/${2 + rest.length}ª` : "3ª", "3ª")));
    return go(t, [{ a: sd[0], b: sd[1] }], 2, { note: `${nm(sd[0])} y ${nm(sd[1])}, las dos mejores de la temporada, se juegan la corona.` });
  }
  if (fmt === "cuatro") return go(s, [], 5, { quad: sd.slice() });
  if (fmt === "cadena") {
    const order = sd.slice().reverse(); // empieza la de peor temporada
    return go(s, [{ a: order[0], b: order[1] }], 4, { chain: order.slice(2), note: `${nm(order[0])} y ${nm(order[1])} abren la pista.` });
  }
  // Súper Lalaparuza y Votan las eliminadas: semifinales (con tres, la mejor pasa directa)
  if (sd.length === 2) return fmt === "votan" ? toVote(s, sd[0], sd[1], "", now) : go(s, [{ a: sd[0], b: sd[1] }], 2);
  const pairs: Pair[] = sd.length >= 4 ? [{ a: sd[0], b: sd[3] }, { a: sd[1], b: sd[2] }] : [{ a: sd[1], b: sd[2] }];
  const bye = sd.length === 3 ? sd[0] : undefined;
  return go(s, pairs, 1, { note: bye ? `${nm(bye)} pasa directa a la final.` : undefined });
}
/** Lip sync a cuatro (o a tres): las jugadoras bailan su lip sync; las del juego, por su temporada y un poco de suerte.
 *  Del mismo lip sync sale la ganadora. El jurado, a veces, las ordena de la cuarta a la primera; otras deja a una fuera
 *  y hay dos subcampeonas; y otras dice solo la ganadora (las demás, ELIM). Con pase directo, la mejor se la juega con ella. */
function quadNext(s: RoomState, now: number, e: Engine): RoomState {
  const Q = s.quad || [];
  const score = (k: string) => {
    const ls = isP(k) ? s.subs[idOf(k)]?.ls : undefined;
    if (ls) return ls.score + (ls.won ? 6 : 0);
    if (isP(k)) return 20; // no ha bailado
    return Math.max(0, Math.min(100, 52 + ppeOf(s, k) * 6 + (e.rnd() - 0.5) * 34));
  };
  const sc = Object.fromEntries(Q.map((k) => [k, score(k)]));
  const ranked = Q.slice().sort((a, b) => sc[b] - sc[a]);
  const pase = s.pase && aliveKeys(s).includes(s.pase) && !Q.includes(s.pase) ? s.pase : undefined;
  let t: RoomState = { ...s, quad: undefined, subs: {} };
  if (pase) {
    ranked.slice(1).forEach((k) => (t = eliminate(t, k, ranked.length > 2 ? `3ª/${ranked.length + 1}ª` : "3ª", "3ª")));
    const anyP = isP(ranked[0]) || isP(pase);
    return { ...t, pairs: [{ a: ranked[0], b: pase }], finalStage: 2, note: `${nameOfKey(t, ranked[0], e)} gana el lip sync y se juega la corona con ${nameOfKey(t, pase, e)}, que tenía el pase directo.`, phase: "final", deadline: anyP ? limite(now, DURACION[s.ritmo].final) : now + 8000, v: s.v + 1 };
  }
  const r = e.rnd();
  const mode: "orden" | "unaFuera" | "ganadora" = r < 0.45 ? "orden" : r < 0.75 ? "unaFuera" : "ganadora";
  const [win, ...rest] = ranked;
  const n = ranked.length;
  if (mode === "orden") {
    // De la cuarta a la segunda: cada una con su puesto
    rest.slice().reverse().forEach((k, i) => {
      const pos = n - i;
      t = eliminate(t, k, `${pos}ª`, pos === 2 ? "RUNNER-UP" : `P${pos}`);
    });
  } else if (mode === "unaFuera") {
    // Se va la última (ELIM) y las demás son subcampeonas
    const last = rest[rest.length - 1];
    rest.slice(0, -1).forEach((k) => (t = eliminate(t, k, rest.length > 2 ? `2ª/${n - 1}ª` : "2ª", "RUNNER-UP")));
    if (last) t = eliminate(t, last, `${n}ª`, "ELIM");
  } else rest.forEach((k) => (t = eliminate(t, k, `2ª/${n}ª`, "ELIM")));
  t = { ...t, track: { ...t.track, [win]: { ...(t.track[win] || {}), [s.ep]: "WINNER" } } };
  return { ...t, quadResult: { mode, order: ranked }, champion: win, phase: "corona", deadline: 0, v: s.v + 1 };
}
/** La reina de la pista: la que pierde se va; la que gana espera a la siguiente. La última que queda, gana. */
function chainNext(t0: RoomState, now: number, e: Engine): RoomState {
  const p = (t0.pairs || [])[0];
  if (!p || !p.winner) return t0;
  const loser = p.winner === p.a ? p.b : p.a;
  const queue = t0.chain || [];
  let t = t0;
  if (!queue.length && t0.finalFmt === "votan" && t0.pase && aliveKeys(t0).includes(t0.pase) && p.winner !== t0.pase) {
    t = eliminate(t, loser, "3ª", "3ª");
    return toVote({ ...t, chain: undefined }, p.winner, t0.pase, `${nameOfKey(t, p.winner, e)} se gana el sitio en la final con ${nameOfKey(t, t0.pase, e)}.`, now);
  }
  if (!queue.length) {
    t = eliminate(t, loser, "2ª", "RUNNER-UP");
    t = { ...t, chain: undefined, track: { ...t.track, [p.winner]: { ...(t.track[p.winner] || {}), [t0.ep]: "WINNER" } } };
    return { ...t, champion: p.winner, phase: "corona", deadline: 0, v: t0.v + 1 };
  }
  const n = aliveKeys(t).length;
  t = eliminate(t, loser, `${n}ª`, "3ª");
  const next = queue[0];
  const pair: Pair = { a: p.winner, b: next };
  const anyP = isP(pair.a) || isP(pair.b);
  return { ...t, chain: queue.slice(1), pairs: [pair], subs: {}, note: `${nameOfKey(t, p.winner, e)} gana a ${nameOfKey(t, loser, e)} y sigue en la pista. Ahora llega ${nameOfKey(t, next, e)}.`, phase: "final", deadline: anyP ? limite(now, DURACION[t.ritmo].final) : now + 8000, v: t0.v + 1 };
}
/** Quiénes votan en la final: todas las eliminadas (jugadoras y reinas del juego). */
export const finalVoters = (s: RoomState) => s.out.map((o) => o.key).filter((k) => !s.vote || (k !== s.vote.a && k !== s.vote.b));
function toVote(s: RoomState, a: string, b: string, note: string, now: number): RoomState {
  const t: RoomState = { ...s, vote: { a, b }, pairs: undefined, subs: {} };
  const anyP = finalVoters(t).some(isP);
  return { ...t, note: note || undefined, finalStage: 3, phase: "votacion", deadline: anyP ? limite(now, DURACION[s.ritmo].votacion) : now + 8000, v: s.v + 1 };
}
/** Recuento: las jugadoras votan; las reinas del juego, un poco por la temporada de cada una y otro poco por el corazón. */
function countVotes(s: RoomState, now: number, e: Engine): RoomState {
  const v = s.vote!;
  const tally: Record<string, number> = { [v.a]: 0, [v.b]: 0 };
  finalVoters(s).forEach((k) => {
    const own = isP(k) ? s.subs[idOf(k)]?.pick : undefined;
    if (own === v.a || own === v.b) { tally[own]++; return; }
    const pa = Math.max(0.2, Math.min(0.8, 0.5 + (ppeOf(s, v.a) - ppeOf(s, v.b)) * 0.15));
    tally[e.rnd() < pa ? v.a : v.b]++;
  });
  const champ = tally[v.a] !== tally[v.b] ? (tally[v.a] > tally[v.b] ? v.a : v.b) : ppeOf(s, v.a) >= ppeOf(s, v.b) ? v.a : v.b;
  const loser = champ === v.a ? v.b : v.a;
  let t: RoomState = { ...s, vote: { ...v, tally } };
  t = eliminate(t, loser, "2ª", "RUNNER-UP");
  t = { ...t, track: { ...t.track, [champ]: { ...(t.track[champ] || {}), [s.ep]: "WINNER" } } };
  return { ...t, champion: champ, phase: "corona", deadline: 0, v: s.v + 1 };
}
function seeds(s: RoomState): string[] {
  // All Winners: por estrellas
  if (isAW(s)) return aliveKeys(s).sort((a, b) => (s.stars?.[b] || 0) - (s.stars?.[a] || 0) || ppeOf(s, b) - ppeOf(s, a));
  return aliveKeys(s).sort((a, b) => ppeOf(s, b) - ppeOf(s, a) || winsOf(s, b) - winsOf(s, a));
}

/** Pasa a la siguiente fase (al cambiar de pantalla se borra el guion de la anterior). */
export function advance(s: RoomState, now: number, e: Engine): RoomState {
  const n = advanceRaw(s, now, e);
  return n !== s && (n.phase !== s.phase || n.ep !== s.ep || n.finalStage !== s.finalStage) ? { ...n, script: undefined } : n;
}
function advanceRaw(s: RoomState, now: number, e: Engine): RoomState {
  const D = DURACION[s.ritmo];
  const at = (phase: Phase, secs: number, extra: Partial<RoomState> = {}): RoomState => ({ ...s, script: undefined, ...extra, phase, deadline: limite(now, secs), v: s.v + 1 });
  switch (s.phase) {
    case "maletas":
      // Reina de la suerte: antes del primer episodio, cada una elige su cajita (como en el modo historia)
      if (s.fmt === "suerte" && !s.boxes) {
        const n = aliveKeys(s).length;
        return { ...s, subs: {}, boxes: { n, win: Math.floor(e.rnd() * n) }, phase: "cajas", deadline: limite(now, D.cajas), v: s.v + 1 };
      }
      return nextEpisode({ ...s, subs: {} }, now, e);
    case "cajas": {
      // Las que no han elegido y las reinas del juego se quedan con las cajas que sobran
      const b = s.boxes!;
      const owners: Record<number, string> = {};
      alivePlayers(s).forEach((p) => { const x = s.subs[p.id]?.box; if (x != null && x >= 0 && x < b.n && !owners[x]) owners[x] = pkey(p.id); });
      const rest = aliveKeys(s).filter((k) => !Object.values(owners).includes(k));
      const free = Array.from({ length: b.n }, (_, i) => i).filter((i) => !owners[i]);
      rest.forEach((k) => { const j = Math.floor(e.rnd() * free.length); owners[free.splice(j, 1)[0]] = k; });
      return nextEpisode({ ...s, subs: {}, boxes: { ...b, owners }, luck: owners[b.win] || s.luck }, now, e);
    }
    case "anuncio":
      if (s.reto?.tipo === LALA.tipo) return lzStart(s, now, e);
      if (s.finalRun) return at("reto", dur(s, "reto"));
      return startMini(s, now, e) || alianzasStep(s, now, e) || at("reto", dur(s, "reto"));
    case "mini":
      return afterMini(endMini(s, e), now, e);
    case "equipos": {
      // Si no ha terminado la elección (se acabó el tiempo o la anfitriona sigue), se completa sola
      const g = s.groups && s.groups.ep === s.ep ? s.groups : null;
      if (g && !g.done) { let t = s; while (t.groups && !t.groups.done) t = draftPick(t, capOf(t), autoPick(t, e), now); return t; }
      const d = s.draft && s.draft.ep === s.ep ? s.draft : null;
      if (d && !d.done) return pairPick(s, d.by || "", d.options[Math.floor(e.rnd() * d.options.length)], now, true);
      return at("reto", dur(s, "reto"));
    }
    case "lalaparuza":
      if (s.lala?.show) return lzGo(s, now);
      return lzNext(s, now, e);
    case "reto":
      if (!s.reto!.noRunway) return at("pasarela", D.pasarela);
    // falls through: sin pasarela aparte, directo a resultados
    case "pasarela": {
      let scored = scoreWeek(s, e);
      // Reto final: las dos mejores, al lip sync por la corona; el resto, terceras
      if (s.finalRun) {
        const pase = s.pase;
        const best = (scored.rows || []).find((r) => r.key !== pase)?.key;
        const topK = pase ? [pase, best] : (scored.rows || []).slice(0, 2).map((r) => r.key);
        scored = { ...scored, rows: (scored.rows || []).map((r) => ({ ...r, label: topK.includes(r.key) ? "TOP2" : "3ª" })) };
      }
      // Que dé tiempo a escuchar las críticas de todas
      const secs = D.resultados > 0 ? Math.max(D.resultados, 8 + (scored.crit || []).length * POR_CRITICA) : 0;
      return { ...scored, phase: "resultados", deadline: limite(now, secs), v: s.v + 1 };
    }
    case "resultados":
      return at("untucked", D.untucked);
    case "untucked":
      return at("veredicto", D.veredicto, { track: writeTrack(s, s.rows || []) });
    case "veredicto": {
      const rows = s.rows || [];
      // Pase directo / primera finalista: se lo lleva la ganadora del reto
      const winK = rows.find((r) => r.label === "WIN")?.key;
      if (winK && s.paseEp === s.ep && !s.pase) s = { ...s, pase: winK };
      if (winK && s.finalistaEp === s.ep && !s.immune) s = { ...s, immune: { key: winK, ep: s.ep + 1 } };
      if (s.finalRun) {
        const pase = s.pase && rows.some((r) => r.key === s.pase) ? s.pase : undefined;
        const top = pase ? [rows.find((r) => r.key !== pase)!.key, pase] : rows.slice(0, 2).map((r) => r.key);
        let t: RoomState = { ...s, finalRun: false, subs: {} };
        const rest = rows.map((r) => r.key).filter((k) => !top.includes(k));
        rest.forEach((k) => (t = eliminate(t, k, rest.length > 1 ? `3ª/${2 + rest.length}ª` : "3ª", "3ª")));
        const pairs: Pair[] = [{ a: top[0], b: top[1] }];
        const anyP = top.some(isP);
        return { ...t, pairs, finalStage: 2, note: `${top.map((k) => nameOfKey(t, k, e)).join(" y ")} se juegan la corona.`, phase: "final", deadline: anyP ? limite(now, D.final) : now + 8000, v: s.v + 1 };
      }
      if (!isAS(s) && !isAW(s)) {
        // Normal y temporadas con giro: el bottom, los comodines (corazón, suerte, moneda) y el lip sync
        const subs = Object.fromEntries(Object.entries(s.subs).map(([k, v]) => [k, { ...v, ls: undefined, pick: undefined }]));
        let t: RoomState = { ...s, subs, bottom: rows.filter((r) => /^BTM/.test(r.label)).map((r) => r.key), protectedKeys: [], stage: undefined, twist: undefined, twistResult: undefined };
        // Segunda Oportunidrag: vuelve la eliminada de la pareja ganadora (o de la mejor pareja que tenga una)
        if (s.rp && s.rp.ep === s.ep) {
          const pr = rows.map((r) => s.rp!.pairs.find((p) => p.c === r.key)).find((p) => p && p.o);
          const back = pr?.o || undefined;
          if (back) t = revive(t, back);
          const pairs = s.rp.pairs.map((p) => ({ ...p, score: rows.find((r) => r.key === p.c)?.score ?? 0 })).sort((a, b) => b.score - a.score);
          return { ...t, twistResult: { kind: "repesca", back, pairs }, phase: "sorpresa", deadline: 0, v: s.v + 1 };
        }
        return continueChain(t, 0, now, e);
      }
      // All Stars y All Winners: lip sync del top 2
      const who = rows.filter((r) => /^(TOP2|BTOP)$/.test(r.label)).map((r) => r.key);
      const pairs: Pair[] = who.length === 2 ? [{ a: who[0], b: who[1] }] : [];
      const next = { ...s, pairs, subs: Object.fromEntries(Object.entries(s.subs).map(([k, v]) => [k, { ...v, ls: undefined, elim: undefined }])) };
      // All Stars: antes del lip sync, cada una del top elige en secreto su pintalabios
      if (isAS(s) && who.length === 2) {
        const options = rows.filter((r) => r.label === "BTM2").map((r) => r.key);
        const picks: Record<string, string> = {};
        who.filter((k) => !isP(k)).forEach((k) => (picks[k] = autoDecide(next, options, e)));
        const anyP = who.some(isP);
        return { ...next, decision: { top: who, options, picks }, phase: "decision", deadline: anyP ? limite(now, D.decision) : now + 8000, v: s.v + 1 };
      }
      // Si no hay jugadoras en el lip sync, se resuelve solo
      if (!pairs.some((p) => isP(p.a) || isP(p.b))) return { ...next, phase: "lipsync", deadline: now + 6000, v: s.v + 1 };
      return { ...next, phase: "lipsync", deadline: limite(now, D.lipsync), v: s.v + 1 };
    }
    case "lipsync": {
      if (brPhase(s)) return bracketLipsync(s, now, e);
      // Lip sync a tres bandas: se salva una y se van dos
      if (s.triple && s.triple.length === 3) {
        const stay = resolveTriple(s, e);
        const n = aliveKeys(s).length;
        let t: RoomState = { ...s };
        const gone = s.triple.filter((k) => k !== stay);
        gone.forEach((k) => (t = eliminate(t, k, `${n - 1}º/${n}º`, "ELIM", e)));
        const nm = (k: string) => nameOfKey(t, k, e);
        return { ...t, triple: undefined, note: `${nm(stay)} se salva en el lip sync a tres bandas. ${gone.map(nm).join(" y ")} se van a casa.`, phase: "track", deadline: limite(now, D.track), v: s.v + 1 };
      }
      const pairs = resolvePairs(s, e);
      if (isAW(s)) {
        // All Winners: la del lip sync se lleva la Legendary Legend Star y bloquea a una rival
        const p = pairs[0];
        if (!p || !p.winner) return at("track", D.track, { pairs });
        const blocked = s.block && s.block.ep === s.ep ? s.block.id : null;
        const last = s.ep >= (s.weeks || 0);
        const stars = { ...(s.stars || {}) };
        const starred = [p.a, p.b].filter((k) => k !== blocked);
        starred.forEach((k) => (stars[k] = (stars[k] || 0) + (last ? 3 : 1)));
        const track = { ...s.track, [p.winner]: { ...(s.track[p.winner] || {}), [s.ep]: p.winner === blocked ? "BWIN" : "WIN" } };
        const options = aliveKeys(s).filter((k) => k !== p.winner && k !== blocked);
        const base: RoomState = { ...s, pairs, stars, track };
        // La última semana ya no hay bloqueo: después viene la final
        if (last || !options.length) return { ...base, twistResult: { kind: "bloqueo", by: p.winner, stars: starred }, phase: "sorpresa", deadline: 0, v: s.v + 1 };
        return toComodin(base, { kind: "bloqueo", by: [p.winner], options, picks: npcPicks(base, [p.winner], "bloqueo", options, e), starred }, -1, now);
      }
      if (isAS(s) && s.decision) {
        // La ganadora del lip sync gana el reto y saca su pintalabios: se va la que eligió
        const p = pairs[0];
        const d = s.decision;
        if (!p || !p.winner) return at("track", D.track, { pairs });
        const loser = p.winner === p.a ? p.b : p.a;
        const go = d.picks[p.winner] || autoDecide(s, d.options, e);
        const stay = d.options.find((k) => k !== go) || go;
        const kind = decisionKind(s, go, stay);
        let t: RoomState = { ...s, pairs, track: { ...s.track, [p.winner]: { ...(s.track[p.winner] || {}), [s.ep]: "WIN" } } };
        t = eliminate(t, go, `${aliveKeys(t).length}º`, "ELIM", e);
        const nm = (k: string) => nameOfKey(t, k, e);
        const why = kind === "semana" ? "la peor de la semana" : kind === "trayectoria" ? "ha mirado toda la temporada" : "jugarreta: se quita a una rival fuerte";
        const reveal: Reveal | undefined = d.picks[loser] ? { ep: s.ep, by: loser, go: d.picks[loser], went: go } : undefined;
        return { ...t, decision: { ...d, by: p.winner, go, kind }, reveal, note: `${nm(p.winner)} saca su pintalabios: ${nm(go)} se va a casa (${why}). ${nm(stay)} se queda.`, phase: "pintalabios", deadline: limite(now, D.pintalabios), v: s.v + 1 };
      }
      let t: RoomState = { ...s, pairs };
      const nm = (k: string) => nameOfKey(t, k, e);
      // Muy de vez en cuando: doble shantay (las dos lo han bordado) o doble sashay (las dos, fatal)
      const p0 = pairs.length === 1 ? pairs[0] : null;
      if (p0) {
        // En el duelo entre jugadoras la nota es la suma de los seis movimientos: se lleva a 0-100
        const duelo = isP(p0.a) && isP(p0.b);
        const lsOf = (k: string) => (isP(k) ? Math.min(100, (s.subs[idOf(k)]?.ls?.score ?? 0) / (duelo ? 1.3 : 1)) : Math.max(0, Math.min(100, 50 + ppeOf(s, k) * 6 + (e.rnd() - 0.5) * 40)));
        const sa = lsOf(p0.a), sb = lsOf(p0.b);
        const d = s.doubles || {};
        const n = aliveKeys(s).length;
        if (!d.shantay && Math.min(sa, sb) >= 82 && n > 5 && e.rnd() < 0.35)
          return { ...t, doubles: { ...d, shantay: s.ep }, note: `¡Doble shantay! ${nm(p0.a)} y ${nm(p0.b)} lo han dado todo: las dos os quedáis.`, phase: "track", deadline: limite(now, D.track), v: s.v + 1 };
        if (!d.sashay && Math.max(sa, sb) <= 30 && n >= 7 && e.rnd() < 0.35) {
          [p0.a, p0.b].forEach((k) => (t = eliminate(t, k, `${n - 1}º/${n}º`, "ELIM", e)));
          return { ...t, doubles: { ...d, sashay: s.ep }, note: `Doble sashay: ni ${nm(p0.a)} ni ${nm(p0.b)} se lo han ganado. Las dos os vais a casa.`, phase: "track", deadline: limite(now, D.track), v: s.v + 1 };
        }
      }
      pairs.forEach((p) => {
        const loser = p.winner === p.a ? p.b : p.a;
        t = eliminate(t, loser, `${aliveKeys(t).length}º`, "ELIM", e);
      });
      const note = pairs.map((p) => `${nm(p.winner!)} se queda. ${nm(p.winner === p.a ? p.b : p.a)} se va a casa.`).join(" ");
      return { ...t, note, phase: "track", deadline: limite(now, D.track), v: s.v + 1 };
    }
    case "decision": {
      // Las que no han elegido a tiempo: elige el juego por ellas
      const d = s.decision!;
      const picks = { ...d.picks };
      d.top.forEach((k) => {
        const pick = isP(k) ? s.subs[idOf(k)]?.elim : undefined;
        if (!picks[k]) picks[k] = pick && d.options.includes(pick) ? pick : autoDecide(s, d.options, e);
      });
      const anyP = (s.pairs || []).some((p) => isP(p.a) || isP(p.b));
      return { ...s, decision: { ...d, picks }, phase: "lipsync", deadline: anyP ? limite(now, D.lipsync) : now + 6000, v: s.v + 1 };
    }
    case "pintalabios":
      return at("track", D.track);
    case "comodin":
      return resolveTwist(s, now, e);
    case "sorpresa": {
      const k = s.twistResult?.kind;
      // Corazones destapados: si alguna tiene uno entero, decide ahora
      if (k === "corazones" && s.twist && s.twist.kind === "corazon") return toComodin({ ...s, twistResult: undefined }, s.twist, s.stage ?? 0, now);
      if (k === "bloqueo") return at("track", D.track, { twist: undefined, twistResult: undefined });
      const from = k === "repesca" ? 0 : (s.stage ?? -1) + 1;
      return continueChain({ ...s, twist: undefined, twistResult: undefined }, from, now, e);
    }
    case "track": {
      if (brFinalToca(s)) return brFinalStart(s, now, e);
      if (isAW(s) ? s.ep < (s.weeks || 0) : aliveKeys(s).length > 4) return nextEpisode(s, now, e);
      // All Winners: como en el All Stars 7 (corte del top 4 por estrellas, QoSDADHH y corona)
      if (isAW(s)) return awCut(s, now, e);
      // Antes de la final, el reencuentro (vuelven las eliminadas, Miss Simpatía) y se anuncia la forma de la final
      if (!s.reunionDone) return reunion(s, e);
      return startFinal(s, now, e);
    }
    case "reencuentro":
      return { ...s, miss: missSimpatia(s, e), subs: {}, script: undefined, phase: "finalistas", deadline: 0, v: s.v + 1 };
    case "finalistas":
      return startFinal({ ...s, subs: {} }, now, e);
    case "votacion":
      return countVotes(s, now, e);
    case "final": {
      if (s.bracket) return bracketNext(s, now, e);
      if (s.quad) return quadNext(s, now, e);
      const pairs = resolvePairs(s, e);
      let t: RoomState = { ...s, pairs };
      if (s.finalStage === 4) return chainNext(t, now, e);
      if (s.finalStage === 1) {
        const winners = pairs.map((p) => p.winner!);
        const losers = pairs.map((p) => (p.winner === p.a ? p.b : p.a));
        const place = losers.length === 2 ? "3ª/4ª" : "3ª";
        losers.forEach((l) => (t = eliminate(t, l, place, "3ª")));
        const fin = aliveKeys(t).filter((k) => !winners.includes(k)).concat(winners);
        // Votan las eliminadas: entre las dos que quedan, la corona la deciden ellas
        if (s.finalFmt === "votan") return toVote(t, fin[0], fin[1], `${winners.map((k) => nameOfKey(t, k, e)).join(" y ")} ${winners.length > 1 ? "ganan sus" : "gana su"} lip sync.`, now);
        const pair: Pair = { a: fin[0], b: fin[1] };
        const anyP = isP(pair.a) || isP(pair.b);
        return { ...t, pairs: [pair], finalStage: 2, subs: {}, note: `${winners.map((k) => nameOfKey(t, k, e)).join(" y ")} pasan a la final.`, phase: "final", deadline: anyP ? limite(now, D.final) : now + 8000, v: s.v + 1 };
      }
      const p = pairs[0];
      const loser = p.winner === p.a ? p.b : p.a;
      t = eliminate(t, loser, "2ª", "RUNNER-UP");
      t = { ...t, track: { ...t.track, [p.winner!]: { ...(t.track[p.winner!] || {}), [s.ep]: "WINNER" } } };
      return { ...t, champion: p.winner, phase: "corona", deadline: 0, v: s.v + 1 };
    }
    default:
      return s;
  }
}

/** Una vuelta del reloj de la anfitriona: avanza si se acabó el tiempo o ya han entregado todas. */
export function tick(s: RoomState, now: number, e: Engine): RoomState {
  if (s.phase === "lobby" || s.phase === "corona" || s.pause || s.paused) return s;
  // Cajitas: cuando todas han elegido, unos segundos para ver lo que hay en la tuya
  if (s.phase === "cajas" && alivePlayers(s).every((p) => s.subs[p.id]?.box != null) && (!s.deadline || s.deadline > now + CAJAS_VER)) return { ...s, deadline: now + CAJAS_VER, v: s.v + 1 };
  // Elección de grupos: las capitanas del juego eligen solas (con una pausa para verlo); las jugadoras tienen su tiempo
  if (s.phase === "equipos" && s.groups && s.groups.ep === s.ep && !s.groups.done) {
    const cap = capOf(s);
    const wait = isP(cap) ? (s.ritmo === "libre" ? Infinity : PICK_MS) : NPC_PICK_MS;
    return now - s.groups.at >= wait ? draftPick(s, cap, autoPick(s, e), now) : s;
  }
  // Duelos entre jugadoras: el reloj de la fase no corta a nadie a mitad; cada paso tiene su propio tope
  const duels = (s.pairs || []).filter((p) => !p.winner && isP(p.a) && isP(p.b) && ["lipsync", "final", "lalaparuza"].includes(s.phase) && !(s.phase === "lalaparuza" && s.lala?.show));
  if (duels.length) {
    const key = `${s.ep}:${s.phase}:${s.finalStage || 0}`;
    if (s.duelKey !== key) return { ...s, duelKey: key, duelAt: now, v: s.v + 1 };
    const t = s.ritmo === "libre" ? s : duelTimeouts(s, now);
    if (t !== s) return t;
    const open = duels.some((p) => (s.subs[idOf(p.a)]?.duel || []).length < DUEL_STEPS || (s.subs[idOf(p.b)]?.duel || []).length < DUEL_STEPS);
    if (open && s.deadline > 0 && s.deadline - now < DUEL_STEP_MS) return { ...s, deadline: now + DUEL_STEP_MS + 5000, v: s.v + 1 };
  }
  if ((s.deadline > 0 && now >= s.deadline) || allIn(s)) return advance(s, now, e);
  return s;
}

/** Aplica una entrega de una jugadora (solo cuenta la de la fase y episodio actuales). */
/** La pareja de lip sync de una jugadora si su rival también es jugadora (duelo sincronizado). */
export function duelOf(s: RoomState, key: string): Pair | undefined {
  if (!["lipsync", "final", "lalaparuza"].includes(s.phase)) return undefined;
  return (s.pairs || []).find((p) => !p.winner && (p.a === key || p.b === key) && isP(p.a) && isP(p.b));
}
const movesOf = (s: RoomState, key: string) => s.subs[idOf(key)]?.duel || [];
/** Apunta un movimiento del duelo (solo el del paso que toca y solo si la rival ya ha hecho el anterior). */
function addDuelMove(s: RoomState, key: string, step: number, mv: DuelMove): RoomState {
  const p = duelOf(s, key);
  if (!p) return s;
  const other = p.a === key ? p.b : p.a;
  const mine = movesOf(s, key), theirs = movesOf(s, other);
  if (step !== mine.length || mine.length >= DUEL_STEPS || theirs.length < mine.length) return s;
  const move: DuelMove = { tag: String(mv.tag).slice(0, 20), imp: Math.max(0, Math.min(90, Number(mv.imp) || 0)), msg: String(mv.msg || "").slice(0, 200), energy: Math.max(0, Math.min(100, Number(mv.energy ?? mine.at(-1)?.energy ?? 100))), at: mv.at, auto: mv.auto };
  const subs = { ...s.subs, [idOf(key)]: { ...(s.subs[idOf(key)] || {}), duel: [...mine, move] } };
  let t: RoomState = { ...s, subs, v: s.v + 1 };
  // Las dos han terminado: gana la que más ha conectado con el público
  const ma = movesOf(t, p.a), mb = movesOf(t, p.b);
  if (ma.length >= DUEL_STEPS && mb.length >= DUEL_STEPS) {
    const sa = Math.round(ma.reduce((x, m) => x + m.imp, 0)), sb = Math.round(mb.reduce((x, m) => x + m.imp, 0));
    t = { ...t, subs: { ...t.subs, [idOf(p.a)]: { ...t.subs[idOf(p.a)], ls: { won: sa > sb, score: sa } }, [idOf(p.b)]: { ...t.subs[idOf(p.b)], ls: { won: sb > sa, score: sb } } } };
  }
  return t;
}
/** Si una de las dos no elige a tiempo, se queda quieta en ese paso (y el duelo sigue). */
export function duelTimeouts(s: RoomState, now: number): RoomState {
  let t = s;
  for (const p of s.pairs || []) {
    if (p.winner || !isP(p.a) || !isP(p.b) || !["lipsync", "final", "lalaparuza"].includes(s.phase)) continue;
    const ma = movesOf(t, p.a), mb = movesOf(t, p.b);
    if (ma.length >= DUEL_STEPS && mb.length >= DUEL_STEPS) continue;
    const last = Math.max(0, ...[...ma, ...mb].map((m) => m.at || 0)) || t.duelAt || now;
    if (now - last < DUEL_STEP_MS) continue;
    const idle: DuelMove = { tag: "Quieta", imp: 2, msg: "Se queda quieta: no le ha dado tiempo a elegir.", at: now, auto: true };
    // La que va por detrás (o las dos, si ninguna ha elegido) se queda quieta en ese paso
    if (ma.length <= mb.length) t = addDuelMove(t, p.a, ma.length, idle);
    if (mb.length <= ma.length) t = addDuelMove(t, p.b, mb.length, idle);
  }
  return t;
}
export function applySubmit(s: RoomState, pid: string, ep: number, phase: Phase, data: Sub, now: number = Date.now()): RoomState {
  // Temporada del corazón: la jugadora eliminada elige a quién deja su medio corazón (hasta que se destapa)
  if (data.heart) {
    const k = pkey(pid);
    const ph = s.pendingHearts || [];
    const i = ph.findIndex((g) => g.from === k && !g.chosen);
    if (i < 0 || data.heart === k || !aliveKeys(s).includes(data.heart)) return s;
    return { ...s, pendingHearts: ph.map((g, j) => (j === i ? { ...g, to: data.heart!, chosen: true } : g)), v: s.v + 1 };
  }
  if (ep !== s.ep || phase !== s.phase) return s;
  if (data.duelMove) return addDuelMove(s, pkey(pid), data.duelStep ?? -1, data.duelMove);
  // Elección de grupos (la capitana a la que le toca) o de la pareja de la Segunda Oportunidrag
  if (phase === "equipos" && data.pick) {
    if (s.groups && s.groups.ep === s.ep && !s.groups.done) return draftPick(s, pkey(pid), String(data.pick), now);
    if (s.draft && s.draft.ep === s.ep && !s.draft.done && s.draft.by === pkey(pid)) return pairPick(s, pkey(pid), String(data.pick), now);
    return s;
  }
  const p = s.players.find((x) => x.id === pid);
  // Votos del reencuentro (Miss Simpatía) y de la final: votan todas, también las eliminadas
  if (p && (phase === "reencuentro" || phase === "votacion")) {
    const pick = String(data.pick || "");
    const ok = phase === "reencuentro" ? pick !== pkey(pid) && [...aliveKeys(s), ...s.out.map((o) => o.key)].includes(pick) : !!s.vote && finalVoters(s).includes(pkey(pid)) && (pick === s.vote.a || pick === s.vote.b);
    return ok ? { ...s, subs: { ...s.subs, [pid]: { ...(s.subs[pid] || {}), pick } }, v: s.v + 1 } : s;
  }
  // Las eliminadas solo juegan su monólogo de la Segunda Oportunidrag
  if (!p || (!p.alive && !(rpPlayers(s).includes(pid) && (phase === "reto" || phase === "pasarela")))) return s;
  if (pkey(pid) === mcOf(s) && (phase === "reto" || phase === "pasarela")) return s;
  // Cajitas: cada caja es de una sola (gana la primera que la coge) y no se cambia
  const clean = cleanSub(data);
  // En un duelo entre jugadoras el resultado sale de los pasos de las dos, no de lo que diga una
  if (clean.ls && duelOf(s, pkey(pid))) delete clean.ls;
  if (!Object.keys(clean).length) return s;
  if (phase === "cajas" && clean.box != null && (s.subs[pid]?.box != null || Object.values(s.subs).some((x) => x.box === clean.box))) return s;
  return { ...s, subs: { ...s.subs, [pid]: { ...(s.subs[pid] || {}), ...clean } }, v: s.v + 1 };
}
const numIn = (v: unknown, lo: number, hi: number) => { const n = Number(v); return Number.isFinite(n) ? Math.max(lo, Math.min(hi, n)) : undefined; };
/** Lo que manda una jugadora, limpio: solo los campos que puede rellenar, notas dentro de rango y textos cortos. */
export function cleanSub(d: Sub): Sub {
  const o: Sub = {};
  if (!d || typeof d !== "object") return o;
  (["mini", "walk", "reto", "final"] as const).forEach((k) => { const n = d[k] != null ? numIn(d[k], 0, 100) : undefined; if (n != null) o[k] = n; });
  if (d.ls && typeof d.ls === "object") { const sc = numIn(d.ls.score, 0, 1000); if (sc != null) o.ls = { won: !!d.ls.won, score: sc }; }
  if (typeof d.elim === "string") o.elim = d.elim.slice(0, 60);
  if (typeof d.jury === "string") o.jury = d.jury.slice(0, 600);
  if (typeof d.pick === "string") o.pick = d.pick.slice(0, 300);
  if (d.ready != null) o.ready = !!d.ready;
  if (d.box != null) { const b = numIn(d.box, 0, 99); if (b != null) o.box = Math.round(b); }
  return o;
}

// ------------------------------ Pantallas que lleva la anfitriona ------------------------------
/** Pone el guion de la pantalla actual (si ya lo tiene, no lo toca). */
export function setScript(s: RoomState, key: string, lines: [string, string][]): RoomState {
  if (s.script && s.script.key === key) return s;
  return { ...s, script: { key, lines, i: 0 }, v: s.v + 1 };
}
/** La anfitriona pulsa «seguir»: siguiente línea; al acabar el guion, la tarjeta; desde la tarjeta, la fase siguiente. */
export function hostNext(s: RoomState, now: number, e: Engine): RoomState {
  if (!isWatch(s.phase)) return s;
  if (s.script && s.script.i < s.script.lines.length) return { ...s, script: { ...s.script, i: s.script.i + 1 }, v: s.v + 1 };
  // La corona es la última pantalla: se leen las frases, pero no hay fase siguiente
  if (s.phase === "corona") return s;
  return advance(s, now, e);
}

// ------------------------------ Pausa con acuerdo de todas ------------------------------
/** Quiénes tienen que votar: todas las de la sala (también las eliminadas, que siguen mirando). */
export const voters = (s: RoomState) => s.players.map((p) => p.id);
export function proposePause(s: RoomState, by: string, now: number): RoomState {
  if (s.phase === "lobby" || s.phase === "corona" || s.pause || s.paused) return s;
  return { ...s, pause: { by, votes: { [by]: true }, at: now }, v: s.v + 1 };
}
/** Voto: con un no se cancela; con el sí de todas, la partida queda pausada (cada una la guarda y sale). */
export function votePause(s: RoomState, id: string, yes: boolean, now: number): RoomState {
  if (!s.pause) return s;
  if (!yes) return { ...s, pause: undefined, deadline: s.deadline ? s.deadline + (now - s.pause.at) : 0, note: s.note, v: s.v + 1 };
  const votes = { ...s.pause.votes, [id]: true };
  if (voters(s).every((p) => votes[p])) return { ...s, pause: undefined, paused: true, deadline: s.deadline ? s.deadline - s.pause.at : 0, v: s.v + 1 };
  return { ...s, pause: { ...s.pause, votes }, v: s.v + 1 };
}
/** Reanudar una partida guardada: quien la abre lleva la sala; el reloj de la fase se recoloca. */
export function resumeRoom(s: RoomState, host: string, now: number): RoomState {
  // Al pausar se guardó lo que le quedaba a la fase (en ms); si no tenía reloj, sigue sin él
  const left = s.deadline > 0 ? Math.max(15000, s.deadline) : 0;
  return { ...s, host, paused: false, pause: undefined, deadline: left ? now + left : 0, v: s.v + 1 };
}
