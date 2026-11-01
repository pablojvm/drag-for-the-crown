// Tu armario y tu dinero: el mismo que el del modo historia de siempre (se guarda en "dftc-closet" en este navegador).
import { priceOf, prendaById } from "../../core/armario";

export interface Closet { money: number; owned: Record<string, number> }
const KEY = "dftc-closet";
export function getCloset(): Closet {
  try {
    const c = JSON.parse(localStorage.getItem(KEY) || "null");
    return c && typeof c.money === "number" ? { money: c.money, owned: c.owned || {} } : { money: 0, owned: {} };
  } catch {
    return { money: 0, owned: {} };
  }
}
const put = (c: Closet) => { try { localStorage.setItem(KEY, JSON.stringify(c)); } catch { /* sin almacenamiento */ } };
export function addMoney(n: number) {
  const c = getCloset();
  c.money = Math.max(0, Math.round(c.money + n));
  put(c);
  return c;
}
export const owns = (id: string) => !!getCloset().owned[id];
/** Compra una prenda (false si no llega el dinero o ya es tuya). */
export function buy(id: string): boolean {
  const it = prendaById(id);
  const c = getCloset();
  if (!it || c.owned[id]) return false;
  const p = priceOf(it);
  if (c.money < p) return false;
  c.money -= p;
  c.owned[id] = 1;
  put(c);
  return true;
}
export const euros = (n: number) => `${Math.round(n).toLocaleString("es-ES")} €`;
