// Controlador de la sala: la anfitriona lleva el reloj y aplica las reglas; todas reciben el mismo estado.
// Si la anfitriona se cae, la siguiente que entró toma el relevo con el último estado.
import { newRoom, startSeason, tick, advance, applySubmit, setScript, hostNext, proposePause, votePause, resumeRoom, type RoomState, type Engine, type Ritmo, type Formato, type Phase, type Sub, type Player } from "./model";
import { LocalBus, OnlineBus, type Bus } from "./bus";

const myId = () => {
  let id = sessionStorage.getItem("dftc-mp-id");
  if (!id) { id = Math.random().toString(36).slice(2, 10); sessionStorage.setItem("dftc-mp-id", id); }
  return id;
};
const newCode = () => Array.from({ length: 5 }, () => "ABCDEFGHJKLMNPQRSTUVWXYZ"[Math.floor(Math.random() * 24)]).join("");

export class Room {
  me = myId();
  state: RoomState | null = null;
  bus: Bus | null = null;
  private loop = 0;
  private beats = 0;
  private offset = 0; // reloj de la anfitriona menos el mío
  private lastHost = Date.now();
  private joinedAt = Date.now();
  onChange: (s: RoomState) => void = () => {};
  onChat: (m: { from: string; name: string; text: string }) => void = () => {};

  constructor(private engine: () => Engine, private castOf: (season: string) => string[]) {}

  get isHost() { return !!this.state && this.state.host === this.me; }
  now() { return Date.now() + this.offset; }

  private connect(code: string) {
    const net = (window as any).DFTC_NET;
    this.bus = net && net.enabled && net.sb ? new OnlineBus(code, this.me, net.sb) : new LocalBus(code, this.me);
    this.bus.on("state", (d: { s: RoomState; now: number }, from) => {
      if (!d || !d.s) return;
      if (this.state && d.s.v <= this.state.v && this.state.code === d.s.code) return;
      if (d.s.host === from) this.offset = d.now - Date.now();
      this.lastHost = Date.now(); // cualquier estado nuevo cuenta como señal de vida de la sala
      this.state = d.s;
      this.onChange(d.s);
    });
    this.bus.on("join", (p: Player) => this.hostDo((s) => (s.players.some((x) => x.id === p.id) ? s : { ...s, players: [...s.players, { ...p, queen: null, alive: false }], v: s.v + 1 })));
    this.bus.on("pick", (d: { id: string; queen: string }) => this.hostDo((s) => (s.phase !== "lobby" || s.players.some((x) => x.queen === d.queen) ? s : { ...s, players: s.players.map((x) => (x.id === d.id ? { ...x, queen: d.queen } : x)), v: s.v + 1 })));
    this.bus.on("leave", (d: { id: string }) => this.hostDo((s) => (s.phase === "lobby" ? { ...s, players: s.players.filter((x) => x.id !== d.id), v: s.v + 1 } : s)));
    this.bus.on("submit", (d: { id: string; ep: number; phase: Phase; data: Sub }) => this.hostDo((s) => applySubmit(s, d.id, d.ep, d.phase, d.data)));
    this.bus.on("chat", (m) => this.onChat(m));
    this.bus.on("pausa", (d: { id: string }) => this.hostDo((s) => proposePause(s, d.id, Date.now())));
    this.bus.on("voto", (d: { id: string; yes: boolean }) => this.hostDo((s) => votePause(s, d.id, d.yes, Date.now())));
    this.bus.on("hello", () => this.isHost && this.broadcast());
    this.loop = window.setInterval(() => this.heartbeat(), 500);
  }

  private hostDo(f: (s: RoomState) => RoomState) {
    if (!this.isHost || !this.state) return;
    const n = f(this.state);
    if (n !== this.state) { this.state = n; this.broadcast(); this.onChange(n); }
  }
  /** La anfitriona pone el guion de la pantalla que se mira. */
  script(key: string, lines: [string, string][]) { this.hostDo((s) => setScript(s, key, lines)); }
  /** La anfitriona pasa la línea o la pantalla (todas ven lo mismo). */
  next() { this.hostDo((s) => hostNext(s, Date.now(), this.engine())); }
  /** Propone pausar y guardar (hace falta el sí de todas). */
  pause() {
    if (this.isHost) this.hostDo((s) => proposePause(s, this.me, Date.now()));
    else this.bus?.send("pausa", { id: this.me });
  }
  vote(yes: boolean) {
    if (this.isHost) this.hostDo((s) => votePause(s, this.me, yes, Date.now()));
    else this.bus?.send("voto", { id: this.me, yes });
  }
  /** Reabre una partida guardada con su código; quien la abre lleva la sala. */
  resume(saved: RoomState, myOldId: string) {
    this.me = myOldId;
    sessionStorage.setItem("dftc-mp-id", myOldId);
    this.connect(saved.code);
    this.state = resumeRoom(saved, this.me, Date.now());
    this.onChange(this.state);
    this.broadcast();
  }
  /** Volver a una sala guardada que ha reabierto otra: se entra con la misma jugadora de antes. */
  rejoin(code: string, name: string, myOldId: string) {
    this.me = myOldId;
    sessionStorage.setItem("dftc-mp-id", myOldId);
    this.join(code, name);
  }
  /** Sin límite de tiempo: la anfitriona puede seguir sin esperar a las que faltan. */
  skip() { this.hostDo((s) => (s.phase === "lobby" || s.phase === "corona" ? s : advance(s, Date.now(), this.engine()))); }
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
      const present = new Set(this.bus.peers());
      if (present.has(this.state.host)) return; // sigue conectada: solo va lenta
      const candidates = this.state.players.filter((p) => p.id !== this.state!.host && present.has(p.id)).sort((a, b) => a.joined - b.joined);
      if (candidates[0] && candidates[0].id === this.me) {
        const extra = this.state.phase === "lobby" || !this.state.deadline ? 0 : 10000;
        this.state = { ...this.state, host: this.me, deadline: this.state.deadline + extra, v: this.state.v + 1 };
        this.offset = 0;
        this.onChange(this.state);
        this.broadcast();
      }
    }
  }

  create(name: string, season: string, ritmo: Ritmo, opts: { fmt?: Formato; ia?: boolean; custom?: RoomState["custom"] } = {}) {
    const code = newCode();
    this.connect(code);
    this.state = newRoom(code, { id: this.me, name, queen: null, joined: this.joinedAt, alive: false }, season, ritmo, opts);
    if (opts.custom) this.state = { ...this.state, custom: opts.custom };
    this.onChange(this.state);
    this.broadcast();
    return code;
  }
  join(code: string, name: string) {
    this.connect(code.toUpperCase());
    const p: Player = { id: this.me, name, queen: null, joined: this.joinedAt, alive: false };
    const hello = () => { this.bus!.send("join", p); this.bus!.send("hello", {}); };
    hello();
    // Hasta recibir la sala, se insiste (en Supabase el canal tarda un momento en abrir)
    const t = window.setInterval(() => (this.state ? clearInterval(t) : hello()), 1500);
  }
  pick(queen: string) {
    if (this.isHost) this.hostDo((s) => (s.players.some((x) => x.queen === queen) ? s : { ...s, players: s.players.map((x) => (x.id === this.me ? { ...x, queen } : x)), v: s.v + 1 }));
    else this.bus?.send("pick", { id: this.me, queen });
  }
  /** Empieza la temporada (en la personalizada, con el reparto que se ha montado en la sala). */
  start(cast?: string[]) {
    this.hostDo((s) => startSeason(s, cast || this.castOf(s.season), Date.now(), this.engine()));
  }
  /** Partida personalizada: la anfitriona cambia cómo se eligen las rivales o cuáles. */
  setCustom(c: NonNullable<RoomState["custom"]>) { this.hostDo((s) => (s.phase === "lobby" ? { ...s, custom: c, v: s.v + 1 } : s)); }
  submit(data: Sub) {
    if (!this.state) return;
    const d = { id: this.me, ep: this.state.ep, phase: this.state.phase, data };
    if (this.isHost) this.hostDo((s) => applySubmit(s, d.id, d.ep, d.phase, d.data));
    else this.bus?.send("submit", d);
  }
  chat(name: string, text: string) {
    const m = { from: this.me, name, text: text.slice(0, 200) };
    this.bus?.send("chat", m);
    this.onChat(m);
  }
  leave() {
    this.bus?.send("leave", { id: this.me });
    clearInterval(this.loop);
    this.bus?.close();
    this.bus = null;
    this.state = null;
  }
}
