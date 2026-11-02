// Track record de una temporada del motor nuevo, ya calculado (orden, puestos, etiquetas y colores).
// Se pinta en la temporada y se guarda tal cual en el Hall of Fame para verlo después.
import * as T from "../../core/temporada";
import { queenImg } from "../../core/reinas";
import { PPE_VALOR } from "../../core/track";

export interface TrackCell { t: string; c: string }
export interface TrackRow { key: string; img: string; name: string; me: boolean; out: boolean; place: string; cells: TrackCell[]; extra?: string; ppe: string }
export interface TrackSnap { eps: number; epNames: string[]; extra?: "⭐" | "❤️"; rows: TrackRow[] }

const ORDER: Record<string, number> = { WINNER: 0, WIN: 1, BWIN: 1, "RUNNER-UP": 2, TOP2: 3, BTOP: 3, HIGH: 4, "3ª/4ª": 5, SAFE: 6, MC: 6, RTRN: 6.5, LOW: 7, BTM2: 8, BTM3: 8, OUT: 8.5, ELIM: 9 };
const CLS: Record<string, string> = { WIN: "t-win", BWIN: "t-win", WINNER: "t-win", TOP2: "t-top2", BTOP: "t-top2", HIGH: "t-high", SAFE: "t-safe", LOW: "t-low", BTM2: "t-btm", BTM3: "t-btm", ELIM: "t-elim", OUT: "t-elim", "RUNNER-UP": "t-runner", "3ª/4ª": "t-third", RTRN: "t-rtrn", MC: "t-mc" };
const TXT: Record<string, string> = { WINNER: "GANADORA", OUT: "ELIM" };

export function trackSnap(s: T.Season): TrackSnap {
  const keys = [...new Set([...s.alive, ...s.out])];
  const eps = Math.max(s.ep, ...keys.map((k) => (s.track[k] || []).length));
  const crowned = !!s.final?.crown;
  const four = crowned ? s.final!.pairs.flat() : [];
  // En la final, las que caen en semifinales son 3ª/4ª
  const lab = (k: string, i: number) => { const l = (s.track[k] || [])[i] || ""; return crowned && i === eps - 1 && l === "ELIM" ? "3ª/4ª" : l; };
  const lastEp = (k: string) => { const r = s.track[k] || []; for (let i = r.length - 1; i >= 0; i--) if (r[i]) return i; return -1; };
  const lastScored = [...Array(eps).keys()].reverse().find((i) => keys.some((k) => ORDER[lab(k, i)] !== undefined));
  const rank = (k: string) => (lastScored == null ? 7.5 : ORDER[lab(k, lastScored)] ?? 7.5);
  const count = (k: string, re: RegExp) => (s.track[k] || []).filter((l) => re.test(l)).length;
  const out = (k: string) => (k === T.ME ? s.meOut : s.out.includes(k)) && !four.includes(k);
  const order = keys.slice().sort((a, b) => {
    if (crowned) { const P = (k: string) => (k === s.final!.crown ? 0 : k === s.final!.runnerUp ? 1 : four.includes(k) ? 2 : 3); if (P(a) !== P(b)) return P(a) - P(b); }
    return Number(out(a)) - Number(out(b)) || (out(a) ? lastEp(b) - lastEp(a) : 0) || rank(a) - rank(b) || count(b, /WIN/) - count(a, /WIN/) || count(b, /HIGH|TOP2|BTOP/) - count(a, /HIGH|TOP2|BTOP/) || count(a, /BTM/) - count(b, /BTM/);
  });
  const ppe = (k: string) => { const v = (s.track[k] || []).map((l) => PPE_VALOR[l]).filter((x) => x !== undefined); return v.length ? (v.reduce((a, b) => a + b, 0) / v.length).toFixed(2) : "–"; };
  const extra = s.twist === "winners" ? "⭐" : s.twist === "corazon" ? "❤️" : undefined;
  const rows = order.map((k, i): TrackRow => {
    const gone = out(k), le = lastEp(k);
    const h = s.hearts[k] || 0;
    return {
      key: k, img: queenImg(T.idOf(s, k), s.seasonId, true), name: T.nameOf(s, k), me: k === T.ME, out: gone,
      place: crowned && four.includes(k) && i >= 2 ? "3º/4º" : `${i + 1}º`,
      cells: Array.from({ length: eps }, (_, e) => { const l = lab(k, e); return { t: l ? TXT[l] || l : "", c: l ? CLS[l] || "t-safe" : gone && e > le ? "t-gone" : "t-none" }; }),
      extra: extra === "⭐" ? String(s.stars[k] || 0) : extra === "❤️" ? (gone ? "–" : "❤️".repeat(Math.floor(h / 2)) + (h % 2 ? "💔" : "") || "–") : undefined,
      ppe: ppe(k),
    };
  });
  return { eps, epNames: s.epNames || [], extra, rows };
}
