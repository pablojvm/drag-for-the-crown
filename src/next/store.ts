// Estado compartido entre Phaser (el juego) y React (la interfaz). Phaser escribe, React pinta.
import { createStore } from "zustand/vanilla";
import { useStore } from "zustand";

export type Screen = "boot" | "menu" | "arcade" | "result";
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
  muted: boolean;
  result: { won: boolean; score: number; round: number } | null;
  best: number;
}

const readBest = () => { try { return Number(localStorage.getItem("dftc-next-best")) || 0; } catch { return 0; } };

export const store = createStore<GameState>(() => ({
  screen: "boot", loading: 0, queenId: "jimbo", lives: 3, score: 0, combo: 0, round: 1,
  rivalName: "", rivalHp: 1, rivalMax: 1, paused: false, muted: false, result: null, best: readBest(),
}));

export const set = (p: Partial<GameState>) => store.setState(p);
(globalThis as any).__dftcNext = store; // para las pruebas en navegador
export const get = () => store.getState();
export const useGame = <T,>(sel: (s: GameState) => T) => useStore(store, sel);

/** Guarda el récord (por navegador). */
export function saveBest(score: number) {
  if (score <= get().best) return;
  set({ best: score });
  try { localStorage.setItem("dftc-next-best", String(score)); } catch { /* sin almacenamiento: no pasa nada */ }
}
