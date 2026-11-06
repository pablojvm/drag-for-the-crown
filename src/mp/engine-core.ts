// Motor de la sala hecho solo con el núcleo (sin navegador): lo usa el servidor de Colyseus.
// Los textos de los retos los puede traer quien crea la sala (los mismos que ve en su juego); si no, salen del núcleo.
import type { Engine, Reto, MiniDef } from "./model";
import { MINIS, miniRival } from "../core/taller";
import { MAXI } from "../core/maxi";
import { criticaJurado, NOMBRE_JURADO } from "../core/criticas";
import { TEMAS_PASARELA } from "../core/temas";
import { REINAS_ES, queenStats, baseAttrs, type QAttr } from "../core/reinas";
import { tirarDado, notaDe, clamp } from "../core/dado";
import { BALANCE } from "../core/balance";

export interface Content { retos?: (Reto & { attrs?: QAttr[] })[]; categorias?: { n: string; d: string }[]; repesca?: Reto; names?: Record<string, string>; minis?: MiniDef[] }

const MP_RETOS = ["snatch", "roast", "rusical", "actuacion", "diseno", "makeover", "impro"];
/** Retos por grupos (de cuántas): los mismos que en el modo historia. */
const GRUPOS: Record<string, number> = { equipos: 3, impro: 3, publicidad: 2 };
const ATTRS: Record<string, QAttr[]> = { diseno: ["estilo"], repescaStand: ["comedia", "carisma"] };
const QA: QAttr[] = ["comedia", "carisma", "estilo", "performance", "maquillaje"];
const s = (v: unknown, n: number) => String(v ?? "").slice(0, n);

/** Limpia lo que manda el cliente (tamaños y tipos), para no guardar cualquier cosa en la sala. */
export function cleanContent(c: unknown): Content {
  const o = (c && typeof c === "object" ? c : {}) as Record<string, any>;
  const reto = (r: any): (Reto & { attrs?: QAttr[] }) | null =>
    r && typeof r.tipo === "string" ? { tipo: s(r.tipo, 30), titulo: s(r.titulo, 120), desc: s(r.desc, 600), noRunway: !!r.noRunway, ...(Array.isArray(r.attrs) ? { attrs: r.attrs.filter((a: string) => QA.includes(a as QAttr)).slice(0, 3) } : {}), ...(Number(r.groups) >= 2 && Number(r.groups) <= 4 ? { groups: Math.round(Number(r.groups)) } : {}) } : null;
  const retos = Array.isArray(o.retos) ? o.retos.slice(0, 20).map(reto).filter(Boolean) as Content["retos"] : undefined;
  const categorias = Array.isArray(o.categorias) ? o.categorias.slice(0, 40).filter((x: any) => x && typeof x.n === "string").map((x: any) => ({ n: s(x.n, 60), d: s(x.d, 200) })) : undefined;
  const names = o.names && typeof o.names === "object" ? Object.fromEntries(Object.entries(o.names).slice(0, 40).map(([k, v]) => [s(k, 40), s(v, 40)])) : undefined;
  const minis = Array.isArray(o.minis) ? o.minis.slice(0, 30).filter((x: any) => x && typeof x.id === "string").map((x: any) => ({ id: s(x.id, 30), titulo: s(x.titulo, 120), desc: s(x.desc, 300) })) : undefined;
  return { retos: retos?.length ? retos : undefined, categorias: categorias?.length ? categorias : undefined, repesca: reto(o.repesca) || undefined, names, minis: minis?.length ? minis : undefined };
}

const defaultRetos = (): Reto[] =>
  MP_RETOS.map((k) => ({ tipo: k, titulo: MAXI[k]?.titulo || (k === "diseno" ? "Reto de diseño" : k), desc: "", noRunway: !!MAXI[k]?.noRunway, ...(GRUPOS[k] ? { groups: GRUPOS[k] } : {}) }));

export function coreEngine(content: () => Content, rnd: () => number = Math.random): Engine {
  const attrsOfTipo = (tipo: string): QAttr[] => content().retos?.find((r) => r.tipo === tipo)?.attrs || MAXI[tipo]?.attrs || ATTRS[tipo] || ["carisma"];
  const name = (id: string) => content().names?.[id] || REINAS_ES[id]?.name || id;
  const power = (id: string) => { const st = queenStats(id); return 40 + (st.speed + st.rate + st.power + st.lives) * 2; };
  return {
    retos: () => content().retos || defaultRetos(),
    categorias: () => content().categorias || TEMAS_PASARELA.filter((t) => !t.rv).map((t) => ({ n: t.n, d: t.d })),
    rivalScore: (q, tipo) => {
      const a = baseAttrs(q, queenStats(q));
      const keys = attrsOfTipo(tipo);
      const v = keys.reduce((t, k) => t + a[k], 0) / keys.length;
      const noRunway = !!(MAXI[tipo]?.noRunway || content().retos?.find((r) => r.tipo === tipo)?.noRunway);
      return clamp(notaDe(tirarDado(noRunway ? v : v * 0.7 + a.estilo * 0.3, rnd), rnd()), 5, 99);
    },
    simLS: (a, b) => {
      const L = BALANCE.lipSync;
      return rnd() < clamp(0.5 + (power(a) - power(b)) / L.escala, L.min, L.max) ? a : b;
    },
    critique: (tipo, level, nm, look, extra = {}) => {
      const noRunway = !!(MAXI[tipo]?.noRunway || content().retos?.find((r) => r.tipo === tipo)?.noRunway);
      return criticaJurado({ tipo, nivel: level, look, nombre: nm, noRunway, cat: extra.cat, antes: extra.antes, rnd }).map(([k, t]) => [NOMBRE_JURADO[k], t] as [string, string]);
    },
    queenName: name,
    minis: () => content().minis || MINIS.map((m) => ({ id: m.id, titulo: m.titulo, desc: m.desc })),
    miniScore: (q, id) => {
      const a = baseAttrs(q, queenStats(q));
      const m = MINIS.find((x) => x.id === id);
      return miniRival(m ? a[m.attr] : (a.carisma + a.performance + a.estilo) / 3, rnd);
    },
    rnd,
    repesca: () => content().repesca || { tipo: "repescaStand", titulo: "Segunda Oportunidrag: stand-up en parejas", desc: "Las eliminadas vuelven al taller y hacen un monólogo a dúo con una reina en competición.", noRunway: true },
  };
}
