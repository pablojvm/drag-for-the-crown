// Estado compartido entre Phaser (el juego) y React (la interfaz). Phaser escribe, React pinta.
import { createStore } from "zustand/vanilla";
import { useStore } from "zustand";

import type { RunwayState } from "./game/runway";
export type Screen = "boot" | "menu" | "arcade" | "result" | "lipsync" | "runway" | "historia";
export interface LipSyncState {
  rivalId: string;
  step: number;
  energy: number;
  lastTag: string;
  mine: number;
  rival: number; // fuerza total de la rival (se va viendo según avanza la canción)
  emote: number; // truco que toca en este paso
  last: { me: string; them: string } | null;
  anim: number; // cambia en cada movimiento: Phaser anima a las dos reinas
  done: boolean;
  /** Tu último movimiento: si salió y cuánto conectó (para el montaje de la escena). */
  lastOk?: boolean;
  lastImp?: number;
  /** Ya se ha dicho el veredicto (tras el suspense de la escena). */
  reveal?: boolean;
  /** Atributos de tu reina si vienen del modo historia (con lo que ha crecido en la temporada). */
  attrs?: import("../core/lipsync").LsAttrs;
}
export interface GameState {
  screen: Screen;
  loading: number;
  queenId: string;
  lives: number;
  score: number;
  combo: number;
  round: number;
  rivalName: string;
  rivalHp: number;
  rivalMax: number;
  paused: boolean;
  /** Carga del poder especial (0 a 1) y qué poder hay activo ahora (con su fin, en ms del juego). */
  special: number;
  powerName: string;
  activePower: string | null;
  doubleOn: boolean;
  muted: boolean;
  result: { won: boolean; score: number; round: number } | null;
  ls: LipSyncState | null;
  rw: RunwayState | null;
  best: number;
  /** Modo historia (el de siempre, en un marco): el decorado del plató y si hay alguien hablando delante. */
  hist: { bg: "werkroom" | "stage"; busy: boolean; scene: null | "lipsync" | "runway" };
  /** Si el lip sync o la pasarela son parte de la temporada: texto del botón para volver. */
  back: string | null;
  /** Avisos (logros) que se ven un momento. */
  toasts: { id: number; title: string; sub: string }[];
  /** Tu cuenta (invitada o con Google). */
  acct: { ready: boolean; google: boolean; name: string; email: string; googleOn: boolean };
}

const readBest = () => { try { return Number(localStorage.getItem("dftc-next-best")) || 0; } catch { return 0; } };

export const store = createStore<GameState>(() => ({
  screen: "boot", loading: 0, queenId: "jimbo", lives: 3, score: 0, combo: 0, round: 1,
  rivalName: "", rivalHp: 1, rivalMax: 1, paused: false, special: 0, powerName: "", activePower: null, doubleOn: false, muted: false, result: null, ls: null, rw: null, best: readBest(), hist: { bg: "werkroom", busy: true, scene: null }, back: null, toasts: [], acct: { ready: false, google: false, name: "Invitada", email: "", googleOn: false },
}));

export const set = (p: Partial<GameState>) => store.setState(p);
const readMuted = () => { try { return localStorage.getItem("dftc-next-muted") === "1"; } catch { return false; } };
store.setState({ muted: readMuted() });
/** Silenciar o no (se recuerda en este navegador). */
export function setMuted(on: boolean) {
  set({ muted: on });
  try { localStorage.setItem("dftc-next-muted", on ? "1" : "0"); } catch { /* sin almacenamiento */ }
}
(globalThis as any).__dftcNext = store; // para las pruebas en navegador
export const get = () => store.getState();
export const useGame = <T,>(sel: (s: GameState) => T) => useStore(store, sel);

/** Guarda el récord (por navegador). */
export function saveBest(score: number) {
  if (score <= get().best) return;
  set({ best: score });
  try { localStorage.setItem("dftc-next-best", String(score)); } catch { /* sin almacenamiento: no pasa nada */ }
}
