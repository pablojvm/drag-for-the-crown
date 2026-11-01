// Cuenta, nube y Hall of Fame en el motor nuevo: los mismos que el juego de siempre (src/net/cloud.ts).
// Todo lo que el motor nuevo guarda empieza por "dftc-", así que viaja a la nube con el resto de tu progreso.
import { storyRank, type BoardEntry } from "../../core/track";
import { set } from "../store";

interface Net {
  readyPromise: Promise<void>;
  ready(): boolean;
  isGuest: boolean;
  email: string | null;
  googleOn: boolean;
  touch(): void;
  google(): Promise<void>;
  signOut(): Promise<void>;
  submitScore(e: Record<string, unknown>): Promise<void>;
  loadTop(force?: boolean): Promise<TopRow[]>;
}
export interface TopRow { id: string; name: string; queen: string; season: string; ppe: number; winsT: number; won: boolean; place: string | null; date: string }
export interface Acct { ready: boolean; google: boolean; name: string; email: string; googleOn: boolean }
const net = (): Net | undefined => (globalThis as any).DFTC_NET;

/** Avisa a la nube de que hay cambios (se suben a los pocos segundos). */
export const touch = () => { try { net()?.touch(); } catch { /* sin servidor */ } };

export function acctNow(): Acct {
  const n = net();
  const google = !!n && n.ready() && !n.isGuest;
  const email = (google && n!.email) || "";
  return { ready: !!n?.ready(), google, name: google ? email.split("@")[0] : "Invitada", email, googleOn: !!n?.googleOn };
}
export const refreshAcct = () => set({ acct: acctNow() });
net()?.readyPromise.then(refreshAcct).catch(() => {});

export const signIn = () => net()?.google();
export const signOut = () => net()?.signOut();

const read = <T,>(k: string, d: T): T => { try { const v = localStorage.getItem(k); return v === null ? d : JSON.parse(v); } catch { return d; } };
const write = (k: string, v: unknown) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* sin almacenamiento */ } touch(); };
export const playerName = () => read<string>("dftc-name", "") || (acctNow().google ? acctNow().name.slice(0, 12) : "") || "Anónima";
export const setPlayerName = (n: string) => write("dftc-name", n.trim().slice(0, 12));

/** Tu Hall of Fame (el mismo que el del juego de siempre: tus 20 mejores temporadas). */
export const localBoard = () => read<(BoardEntry & TopRow)[]>("dftc-story-board", []).slice().sort(storyRank);
/** Apunta una temporada terminada en tu Hall of Fame y en el mundial (si hay servidor). */
export function recordSeason(e: { queen: string; season: string; won: boolean; place: number | null; ppe: number; winsT: number; cast: number; lsWins: number }) {
  const entry = { id: `n${Date.now()}`, name: playerName(), queen: e.queen, season: e.season, won: e.won, place: e.place == null ? null : `${e.place}º`, cast: e.cast, wins: e.winsT, winsT: e.winsT, lipsyncs: e.lsWins, ppe: e.ppe, score: Math.round(e.ppe * 1000), date: new Date().toISOString() };
  const board = [...localBoard(), entry].sort(storyRank).slice(0, 20);
  write("dftc-story-board", board);
  const st = read("dftc-story-stats", { games: 0, crowns: 0, challengeWins: 0, lipsyncs: 0, total: 0 });
  write("dftc-story-stats", { ...st, games: st.games + 1, crowns: st.crowns + (e.won ? 1 : 0), challengeWins: st.challengeWins + e.winsT, lipsyncs: st.lipsyncs + e.lsWins, total: st.total + entry.score });
  void net()?.submitScore({ ...entry, place: entry.place });
}
export const worldTop = async (): Promise<TopRow[]> => { try { return (await net()?.loadTop(true)) || []; } catch { return []; } };
