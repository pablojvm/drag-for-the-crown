// Controlador de la sala. Dos maneras de jugar, con las mismas reglas (model.ts) y las mismas peticiones (ops.ts):
//  · Servidor (Colyseus en Fly.io): el servidor lleva el reloj y aplica las reglas; nadie puede hacer trampas.
//  · Sin servidor (Supabase Realtime o pestañas del mismo navegador): la anfitriona lleva el reloj y reparte el estado.
//    Si la anfitriona se cae, la siguiente que entró toma el relevo con el último estado.
import { newRoom, tick, resumeRoom, type RoomState, type Engine, type Ritmo, type Formato, type Sub, type Player } from "./model";
import { applyOp, handOver, type Op } from "./ops";
import { LocalBus, OnlineBus, type Bus } from "./bus";

const rid = () => Math.random().toString(36).slice(2, 10);
const myId = () => {
  let id = sessionStorage.getItem("dftc-mp-id");
  if (!id) { id = rid(); sessionStorage.setItem("dftc-mp-id", id); }
  return id;
};
/** Contraseña de cada jugadora en el servidor (para que nadie entre con su id); se guarda en este dispositivo. */
const secretOf = (id: string) => {
  const k = `dftc-mp-secret-${id}`;
  let v = "";
  try { v = localStorage.getItem(k) || ""; if (!v) { v = rid() + rid(); localStorage.setItem(k, v); } } catch { v = v || rid() + rid(); }
  return v;
};
const newCode = () => Array.from({ length: 5 }, () => "ABCDEFGHJKLMNPQRSTUVWXYZ"[Math.floor(Math.random() * 24)]).join("");

/** Dirección del servidor de salas: ?mpserver=... (pruebas), VITE_MP_URL o el de Fly.io. Vacía = sin servidor. */
const MP_URL: string = (() => {
  const q = typeof location !== "undefined" ? new URLSearchParams(location.search).get("mpserver") : null;
  if (q != null) return q;
  return (import.meta.env.VITE_MP_URL as string | undefined) ?? "wss://dftc-salas.fly.dev";
})();
let alive: Promise<boolean> | null = null;
/** ¿Responde el servidor? Si no (aún no está desplegado o se ha caído), se juega como antes, sin servidor. */
export const serverUp = () =>
  (alive ||= !MP_URL
    ? Promise.resolve(false)
    : fetch(MP_URL.replace(/^ws/, "http").replace(/\/$/, "") + "/salud", { signal: AbortSignal.timeout(6000) }).then((r) => r.ok, () => false));

interface SRoom { send(t: string, d?: unknown): void; onMessage(t: string, cb: (d: any) => void): unknown; leave(consented?: boolean): Promise<unknown>; roomId: string; onLeave(cb: (code: number) => void): unknown }

export class Room {
  me = myId();
  state: RoomState | null = null;
  bus: Bus | null = null;
  /** Sala en el servidor (si se juega con servidor). */
  srv: SRoom | null = null;
  private loop = 0;
  private beats = 0;
  private offset = 0; // reloj de quien manda menos el mío
  private lastHost = Date.now();
  private joinedAt = Date.now();
  onChange: (s: RoomState) => void = () => {};
  onChat: (m: { from: string; name: string; text: string }) => void = () => {};
  /** No se ha podido entrar o se ha perdido la sala del servidor. */
  onFail: (msg: string) => void = () => {};

  constructor(private engine: () => Engine, private castOf: (season: string) => string[]) {}

  get isHost() { return !!this.state && this.state.host === this.me; }
  get online() { return !!this.srv; }
  now() { return Date.now() + this.offset; }

  // ------------------------------ Con servidor ------------------------------
  private async serverJoin(opts: Record<string, unknown>, code?: string) {
    const { Client } = await import("@colyseus/sdk");
    const c = new Client(MP_URL);
    const o = { id: this.me, secret: secretOf(this.me), joined: this.joinedAt, ...opts };
    const r = (code ? await c.joinById(code, o) : await c.create("dftc", o)) as unknown as SRoom;
    this.srv = r;
    r.onMessage("state", (d: { s: RoomState; now: number }) => {
      if (!d || !d.s || (this.state && this.state.code === d.s.code && d.s.v <= this.state.v)) return;
      this.offset = d.now - Date.now();
      this.state = d.s;
      this.onChange(d.s);
    });
    r.onMessage("chat", (m) => m && m.from !== this.me && this.onChat(m));
    r.onLeave((code: number) => { if (this.srv === r && code !== 1000 && code !== 4000) { this.srv = null; this.onFail("Se ha perdido la conexión con la sala."); } });
    r.send("hello");
    return r.roomId;
  }
  private fail(e: unknown) {
    const m = String((e as Error)?.message || e || "");
    this.onFail(/ya está/.test(m) ? "Esa jugadora ya está en la sala." : /not found|no rooms|locked|full/i.test(m) ? "No existe esa sala o está llena." : "No se ha podido conectar con la sala.");
  }

  // ------------------------------ Sin servidor ------------------------------
  private connect(code: string) {
    const net = (window as any).DFTC_NET;
    this.bus = net && net.enabled && net.sb ? new OnlineBus(code, this.me, net.sb) : new LocalBus(code, this.me);
    this.bus.on("state", (d: { s: RoomState; now: number }, from) => {
      if (!d || !d.s) return;
      // Solo manda la anfitriona: un estado vale si lo envía quien dice ser la anfitriona. Si ya hay sala, cambiar de
      // anfitriona solo se acepta cuando la anterior ya no está (el relevo) o cuando lo envía la misma de siempre.
      if (d.s.host !== from) return;
      if (this.state && this.state.code !== d.s.code) return;
      if (this.state && this.state.host !== from && this.bus && this.bus.peers().includes(this.state.host)) return;
      if (this.state && d.s.v <= this.state.v) return;
      this.offset = d.now - Date.now();
      this.lastHost = Date.now(); // cualquier estado nuevo cuenta como señal de vida de la sala
      this.state = d.s;
      this.onChange(d.s);
    });
    // Peticiones de las demás: las aplica la anfitriona con las mismas reglas que el servidor
    this.bus.on("op", (op: Op, from) => this.hostDo((s) => applyOp(s, from, op, Date.now(), this.engine())));
    this.bus.on("chat", (m, from) => m && m.from === from && this.onChat({ from, name: String(m.name || "").slice(0, 12), text: String(m.text || "").slice(0, 200) }));
    this.bus.on("hello", () => this.isHost && this.broadcast());
    this.loop = window.setInterval(() => this.heartbeat(), 500);
  }
  /** Sin servidor, la anfitriona cambia el estado y lo reparte (también lo usan las pruebas). */
  hostDo(f: (s: RoomState) => RoomState) {
    if (!this.isHost || !this.state || this.srv) return;
    const n = f(this.state);
    if (n !== this.state) { this.state = n; this.broadcast(); this.onChange(n); }
  }
  private broadcast() { if (this.state && this.bus) this.bus.send("state", { s: this.state, now: Date.now() }); }
  private heartbeat() {
    if (!this.state) return;
    if (this.isHost) {
      const n = tick(this.state, Date.now(), this.engine());
      if (n !== this.state) { this.state = n; this.onChange(n); this.broadcast(); }
      else if (++this.beats % 6 === 0) this.broadcast(); // cada 3 s, por si alguien llega tarde
      return;
    }
    // Relevo: si la anfitriona lleva un rato sin dar señales, la siguiente en llegar coge el mando
    if (Date.now() - this.lastHost > 9000 && this.bus) {
      const n = handOver(this.state, new Set(this.bus.peers()), Date.now());
      if (n.host === this.me && n !== this.state) { this.state = n; this.offset = 0; this.onChange(n); this.broadcast(); }
    }
  }

  // ------------------------------ Lo que hace cada jugadora ------------------------------
  /** Pide algo a la sala: al servidor, o a la anfitriona (si soy yo, lo aplico). */
  private do(op: Op) {
    if (!this.state) return;
    if (this.srv) return this.srv.send("op", op);
    if (this.isHost) this.hostDo((s) => applyOp(s, this.me, op, Date.now(), this.engine()));
    else this.bus?.send("op", op);
  }
  /** La anfitriona pone el guion de la pantalla que se mira. */
  script(key: string, lines: [string, string][]) { if (this.isHost && this.state?.script?.key !== key) this.do({ t: "script", key, lines }); }
  /** La anfitriona pasa la línea o la pantalla (todas ven lo mismo). */
  next() { if (this.isHost) this.do({ t: "next" }); }
  /** Sin límite de tiempo: la anfitriona puede seguir sin esperar a las que faltan. */
  skip() { if (this.isHost) this.do({ t: "skip" }); }
  /** Propone pausar y guardar (hace falta el sí de todas). */
  pause() { this.do({ t: "pausa" }); }
  vote(yes: boolean) { this.do({ t: "voto", yes }); }
  pick(queen: string) { this.do({ t: "pick", queen }); }
  /** Partida personalizada: la anfitriona cambia cómo se eligen las rivales o cuáles. */
  setCustom(c: NonNullable<RoomState["custom"]>) { this.do({ t: "custom", c }); }
  submit(data: Sub) { if (this.state) this.do({ t: "submit", ep: this.state.ep, phase: this.state.phase, data }); }
  /** Empieza la temporada (en la personalizada, con el reparto que se ha montado en la sala). */
  start(cast?: string[]) {
    if (!this.state) return;
    const c = cast || this.castOf(this.state.season);
    const e = this.engine();
    this.do({ t: "start", cast: c, names: Object.fromEntries(c.map((q) => [q, e.queenName(q)])) });
  }
  chat(name: string, text: string) {
    const m = { from: this.me, name, text: text.slice(0, 200) };
    if (this.srv) this.srv.send("chat", m);
    else this.bus?.send("chat", m);
    this.onChat(m);
  }

  // ------------------------------ Entrar y salir ------------------------------
  /** Lo que el servidor necesita para montar la temporada (los mismos retos y pasarelas que ve quien crea la sala). */
  private content() {
    const e = this.engine();
    return { retos: e.retos(), categorias: e.categorias(), repesca: e.repesca?.() };
  }
  create(name: string, season: string, ritmo: Ritmo, opts: { fmt?: Formato; ia?: boolean; custom?: RoomState["custom"] } = {}): Promise<string> {
    return serverUp().then((up) => {
      if (up) return this.serverJoin({ name, create: { season, ritmo, fmt: opts.fmt, ia: opts.ia, custom: opts.custom, content: this.content() } }).catch((e) => (this.fail(e), ""));
      const code = newCode();
      this.connect(code);
      this.state = newRoom(code, { id: this.me, name, queen: null, joined: this.joinedAt, alive: false }, season, ritmo, opts);
      if (opts.custom) this.state = { ...this.state, custom: opts.custom };
      this.onChange(this.state);
      this.broadcast();
      return code;
    });
  }
  join(code: string, name: string): Promise<void> {
    code = code.toUpperCase();
    return serverUp().then(async (up) => {
      if (up) {
        try { await this.serverJoin({ name }, code); return; } catch (e) {
          // Puede ser una sala sin servidor (la creó alguien cuando el servidor no respondía): se prueba también así
          if (!/not found|no rooms|not exist/i.test(String((e as Error)?.message))) return this.fail(e);
        }
      }
      this.connect(code);
      const p: Player = { id: this.me, name, queen: null, joined: this.joinedAt, alive: false };
      const hello = () => { this.bus?.send("op", { t: "join", name: p.name, joined: p.joined }); this.bus?.send("hello", {}); };
      hello();
      // Hasta recibir la sala, se insiste (en Supabase el canal tarda un momento en abrir)
      const t = window.setInterval(() => (this.state || !this.bus ? clearInterval(t) : hello()), 1500);
    });
  }
  /** Reabre una partida guardada con su código; quien la abre lleva la sala. */
  resume(saved: RoomState, myOldId: string): Promise<void> {
    this.me = myOldId;
    sessionStorage.setItem("dftc-mp-id", myOldId);
    return serverUp().then((up) => {
      if (up) return void this.serverJoin({ name: saved.players.find((p) => p.id === myOldId)?.name || "Reina", resume: saved, create: { season: saved.season, ritmo: saved.ritmo, content: this.content() } }).catch((e) => this.fail(e));
      this.connect(saved.code);
      this.state = resumeRoom(saved, this.me, Date.now());
      this.onChange(this.state);
      this.broadcast();
    });
  }
  /** Volver a una sala guardada que ha reabierto otra: se entra con la misma jugadora de antes. */
  rejoin(code: string, name: string, myOldId: string) {
    this.me = myOldId;
    sessionStorage.setItem("dftc-mp-id", myOldId);
    return this.join(code, name);
  }
  leave() {
    if (this.srv) { const r = this.srv; this.srv = null; r.leave(true).catch(() => {}); }
    else this.bus?.send("op", { t: "leave" });
    clearInterval(this.loop);
    this.bus?.close();
    this.bus = null;
    this.state = null;
  }
}
