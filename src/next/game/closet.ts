// Tu armario y tus rudollars: los mismos que los del modo historia (se guardan en "dftc-closet" en este navegador).
// También las mejoras de las reinas del arcade ("dftc-upgrades"), que se pagan con rudollars.
import { priceOf, prendaById } from "../../core/armario";
import { cantidad } from "../../core/monedas";
import type { ArcadeQueen } from "./data";
import { touch } from "./cuenta";

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
const put = (c: Closet) => { try { localStorage.setItem(KEY, JSON.stringify(c)); } catch { /* sin almacenamiento */ } touch(); };
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
export const euros = (n: number) => cantidad(n);
export const rudollars = () => getCloset().money;

type Stat = keyof ArcadeQueen["stats"];
const UP = "dftc-upgrades";
const ups = (): Record<string, Partial<Record<Stat, number>>> => { try { return JSON.parse(localStorage.getItem(UP) || "{}") || {}; } catch { return {}; } };
/** Las estadísticas de la reina con sus mejoras (hasta 5). */
export function boosted(q: ArcadeQueen): ArcadeQueen {
  const u = ups()[q.id] || {};
  const st = { ...q.stats };
  (Object.keys(st) as Stat[]).forEach((k) => (st[k] = Math.min(5, st[k] + (u[k] || 0))));
  return { ...q, stats: st };
}
export const upgradeCost = (q: ArcadeQueen, k: Stat) => 120 + boosted(q).stats[k] * 80;
export const canUpgrade = (q: ArcadeQueen, k: Stat) => boosted(q).stats[k] < 5;
/** +1 a una estadística, con rudollars (false si no llega o ya está al máximo). */
export function upgrade(q: ArcadeQueen, k: Stat): boolean {
  if (!canUpgrade(q, k)) return false;
  const p = upgradeCost(q, k);
  const c = getCloset();
  if (c.money < p) return false;
  c.money -= p;
  put(c);
  const all = ups();
  all[q.id] = { ...(all[q.id] || {}), [k]: ((all[q.id] || {})[k] || 0) + 1 };
  try { localStorage.setItem(UP, JSON.stringify(all)); } catch { /* sin almacenamiento */ }
  return true;
}
