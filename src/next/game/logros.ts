// Logros del motor nuevo: los mismos que en el juego de siempre (se guardan en "dftc-achievements" y dan lentejuelas).
import { LOGROS } from "../../core/logros";
import { get, set } from "../store";

const read = <T,>(k: string, d: T): T => { try { const v = localStorage.getItem(k); return v === null ? d : JSON.parse(v); } catch { return d; } };
const write = (k: string, v: unknown) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* sin almacenamiento */ } };
let toastId = 0;

/** Avisos que salen arriba a la derecha y se van solos. */
export function toast(title: string, sub = "") {
  const id = ++toastId;
  set({ toasts: [...get().toasts, { id, title, sub }].slice(-4) });
  setTimeout(() => set({ toasts: get().toasts.filter((t) => t.id !== id) }), 4200);
}
/** Desbloquea los logros que falten (con su aviso y sus lentejuelas). */
export function unlock(ids: string[]) {
  const done = read<Record<string, string>>("dftc-achievements", {});
  ids.forEach((id) => {
    const l = LOGROS.find((x) => x.id === id);
    if (!l || done[id]) return;
    done[id] = new Date().toISOString();
    write("dftc-sequins", read<number>("dftc-sequins", 0) + l.reward);
    toast(`${l.icon} Logro: ${l.name}`, `+${l.reward} lentejuelas`);
  });
  write("dftc-achievements", done);
}
