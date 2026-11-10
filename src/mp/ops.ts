// Lo que puede pedir cada jugadora a la sala, como datos. Lo aplican igual la anfitriona (sala entre navegadores)
// y el servidor (Colyseus): así las reglas viven en un solo sitio (model.ts) y el servidor no se fía de nadie.
import { startSeason, applySubmit, setScript, hostNext, proposePause, votePause, advance, type RoomState, type Engine, type Phase, type Sub, type Player } from "./model";

export type Op =
  | { t: "join"; name: string; joined?: number }
  | { t: "pick"; queen: string }
  | { t: "leave" }
  | { t: "submit"; ep: number; phase: Phase; data: Sub }
  | { t: "pausa" }
  | { t: "voto"; yes: boolean }
  // Solo la anfitriona (quien lleva la sala: pasa pantallas, empieza, cambia la partida personalizada)
  | { t: "script"; key: string; lines: [string, string][] }
  | { t: "next" }
  | { t: "skip" }
  | { t: "start"; cast: string[]; names?: Record<string, string> }
  | { t: "custom"; c: NonNullable<RoomState["custom"]> };

export const HOST_OPS: Op["t"][] = ["script", "next", "skip", "start", "custom"];
const str = (v: unknown, n: number) => String(v ?? "").slice(0, n);

// La hora de cada movimiento del duelo la pone quien aplica (su reloj es el que cuenta para los topes)
const stamp = (d: Sub, now: number): Sub => (d && d.duelMove ? { ...d, duelMove: { ...d.duelMove, at: now, auto: false } } : d);

/** Aplica la petición de `from`. Devuelve el mismo objeto si no cambia nada (o si no está permitida). */
export function applyOp(s: RoomState, from: string, op: Op, now: number, e: Engine): RoomState {
  if (!op || typeof op !== "object") return s;
  if (HOST_OPS.includes(op.t) && s.host !== from) return s;
  const known = s.players.some((p) => p.id === from);
  if (op.t !== "join" && !known) return s;
  switch (op.t) {
    case "join": {
      if (known) return s;
      if (s.players.length >= 16) return s;
      const p: Player = { id: from, name: str(op.name, 12) || "Reina", queen: null, joined: Number(op.joined) || now, alive: false };
      return { ...s, players: [...s.players, p], v: s.v + 1 };
    }
    case "pick": {
      const q = str(op.queen, 40);
      if (s.phase !== "lobby" || !q || s.players.some((x) => x.queen === q)) return s;
      return { ...s, players: s.players.map((x) => (x.id === from ? { ...x, queen: q } : x)), v: s.v + 1 };
    }
    case "leave":
      return s.phase === "lobby" ? { ...s, players: s.players.filter((x) => x.id !== from), v: s.v + 1 } : s;
    case "submit":
      return applySubmit(s, from, Number(op.ep), op.phase, stamp(op.data || {}, now), now);
    case "pausa":
      return proposePause(s, from, now);
    case "voto":
      return votePause(s, from, !!op.yes, now);
    case "script":
      return Array.isArray(op.lines) ? setScript(s, str(op.key, 80), op.lines.slice(0, 60).map(([w, t]) => [str(w, 40), str(t, 600)] as [string, string])) : s;
    case "next":
      return hostNext(s, now, e);
    case "skip":
      return s.phase === "lobby" || s.phase === "corona" ? s : advance(s, now, e);
    case "start": {
      if (s.phase !== "lobby" || !Array.isArray(op.cast)) return s;
      const cast = [...new Set(op.cast.map((x) => str(x, 40)).filter(Boolean))].slice(0, 20);
      return cast.length >= 3 ? startSeason(s, cast, now, e) : s;
    }
    case "custom": {
      const c = cleanCustom(op.c);
      return s.phase === "lobby" && c ? { ...s, custom: c, v: s.v + 1 } : s;
    }
  }
  return s;
}

/** Partida personalizada: cómo se eligen las rivales, cuántas y cuáles (limpio, por si llega cualquier cosa). */
export function cleanCustom(c: unknown): RoomState["custom"] | undefined {
  if (!c || typeof c !== "object") return undefined;
  const o = c as Record<string, unknown>;
  const size = Math.max(3, Math.min(16, Math.round(Number(o.size)) || 8));
  const rivals = Array.isArray(o.rivals) ? [...new Set(o.rivals.map((x) => str(x, 40)).filter(Boolean))].slice(0, 20) : [];
  return { pick: o.pick === "elegidas" ? "elegidas" : "azar", size, rivals };
}

/** El mismo texto aunque el estado haya ido y vuelto por la red (claves ordenadas, sin vacíos). */
export function canon(v: unknown): string {
  if (Array.isArray(v)) return `[${v.map((x) => (x === undefined ? "null" : canon(x))).join(",")}]`;
  if (v && typeof v === "object") return `{${Object.keys(v).sort().filter((k) => (v as Record<string, unknown>)[k] != null).map((k) => `${JSON.stringify(k)}:${canon((v as Record<string, unknown>)[k])}`).join(",")}}`;
  return JSON.stringify(v ?? null);
}

/** Relevo: si la anfitriona se ha ido, lleva la sala la siguiente que entró y sigue conectada. */
export function handOver(s: RoomState, present: Set<string>, now: number): RoomState {
  if (present.has(s.host)) return s;
  const next = s.players.filter((p) => present.has(p.id)).sort((a, b) => a.joined - b.joined)[0];
  if (!next) return s;
  const extra = s.phase === "lobby" || !s.deadline ? 0 : 10000;
  return { ...s, host: next.id, deadline: s.deadline ? Math.max(s.deadline, now) + extra : 0, v: s.v + 1 };
}
