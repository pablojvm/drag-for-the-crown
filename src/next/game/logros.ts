// Logros del motor nuevo: los mismos que en el juego de siempre (se guardan en "dftc-achievements" y dan rudollars).
import { LOGROS } from "../../core/logros";
import { cantidad } from "../../core/monedas";
import { get, set } from "../store";
import { touch } from "./cuenta";

const read = <T,>(k: string, d: T): T => { try { const v = localStorage.getItem(k); return v === null ? d : JSON.parse(v); } catch { return d; } };
const write = (k: string, v: unknown) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* sin almacenamiento */ } };
let toastId = 0;

/** Avisos que salen arriba a la derecha y se van solos. */
export function toast(title: string, sub = "") {
  const id = ++toastId;
  set({ toasts: [...get().toasts, { id, title, sub }].slice(-4) });
  setTimeout(() => set({ toasts: get().toasts.filter((t) => t.id !== id) }), 4200);
}
/** Desbloquea los logros que falten (con su aviso y sus rudollars). */
export function unlock(ids: string[]) {
  const done = read<Record<string, string>>("dftc-achievements", {});
  ids.forEach((id) => {
    const l = LOGROS.find((x) => x.id === id);
    if (!l || done[id]) return;
    done[id] = new Date().toISOString();
    const c = read<{ money?: number; owned?: Record<string, number> }>("dftc-closet", { money: 0, owned: {} });
    write("dftc-closet", { ...c, owned: c.owned || {}, money: Math.max(0, Math.round((c.money || 0) + l.reward)) });
    toast(`${l.icon} Logro: ${l.name}`, `💵 +${cantidad(l.reward)}`);
  });
  write("dftc-achievements", done);
  touch();
}
export const logrosDone = () => read<Record<string, string>>("dftc-achievements", {});
/** Lipsticks: la moneda del multijugador. */
export const sequins = () => read<number>("dftc-sequins", 0);
/** Rudollars: la moneda del modo normal. */
export const rudollars = () => Math.round(read<{ money?: number }>("dftc-closet", {}).money || 0);
