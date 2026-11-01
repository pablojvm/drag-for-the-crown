// Sala de Colyseus: el servidor lleva el reloj y aplica las reglas (src/mp/model.ts); las jugadoras solo piden.
// La «anfitriona» sigue existiendo: es quien pasa las pantallas que se miran y empieza la temporada.
import { Room, matchMaker, type Client } from "@colyseus/core";
import { newRoom, tick, resumeRoom, type RoomState, type Ritmo, type Formato } from "../../src/mp/model";
import { applyOp, handOver, type Op } from "../../src/mp/ops";
import { coreEngine, cleanContent, type Content } from "../../src/mp/engine-core";

const ABC = "ABCDEFGHJKLMNPQRSTUVWXYZ";
const newCode = () => Array.from({ length: 5 }, () => ABC[Math.floor(Math.random() * ABC.length)]).join("");
const RITMOS: Ritmo[] = ["normal", "rapido", "libre"];
const FMTS: Formato[] = ["normal", "allstars", "winners", "repesca", "suerte", "corazon", "moneda"];
const str = (v: unknown, n: number) => String(v ?? "").slice(0, n);
const okId = (v: unknown) => typeof v === "string" && /^[a-z0-9]{4,20}$/i.test(v);

export interface JoinOpts { id: string; secret: string; name: string; joined?: number; create?: { season: string; ritmo: Ritmo; fmt?: Formato; ia?: boolean; custom?: RoomState["custom"]; content?: Content }; resume?: RoomState; code?: string }

export class Sala extends Room {
  maxClients = 16;
  s: RoomState | null = null;
  content: Content = {};
  engine = coreEngine(() => this.content);
  /** sessionId de Colyseus → id de jugadora. */
  who = new Map<string, string>();
  secrets = new Map<string, string>();
  hostGone = 0;
  /** Escala de tiempos (solo pruebas: MP_FAST=4 divide todos los relojes entre 4). */
  fast = Number(process.env.MP_FAST || 1);

  async onCreate(o: JoinOpts) {
    let code = o.resume?.code && /^[A-Z]{5}$/.test(o.resume.code) ? o.resume.code : newCode();
    for (let i = 0; i < 20 && (await matchMaker.query({ roomId: code })).length; i++) code = newCode();
    this.roomId = code;
    this.content = cleanContent(o.create?.content);
    this.onMessage("op", (c, op: Op) => this.apply(c, op));
    this.onMessage("chat", (c, m: { name?: string; text?: string }) => {
      const from = this.who.get(c.sessionId);
      if (!from || !m) return;
      this.broadcast("chat", { from, name: str(m.name, 12), text: str(m.text, 200) });
    });
    this.onMessage("hello", (c) => this.sendState(c));
    this.clock.setInterval(() => this.beat(), 500);
  }

  onAuth(_c: Client, o: JoinOpts) {
    if (!o || !okId(o.id) || typeof o.secret !== "string" || o.secret.length < 8) throw new Error("datos de jugadora no válidos");
    const known = this.secrets.get(o.id);
    if (known && known !== o.secret) throw new Error("esa jugadora ya está en la sala");
    return true;
  }

  onJoin(c: Client, o: JoinOpts) {
    this.secrets.set(o.id, o.secret);
    this.who.set(c.sessionId, o.id);
    const now = Date.now();
    if (!this.s) {
      if (o.resume) this.s = resumeRoom({ ...o.resume, code: this.roomId }, o.id, now);
      else {
        const cr = o.create!;
        const ritmo = RITMOS.includes(cr?.ritmo) ? cr.ritmo : "normal";
        const fmt = FMTS.includes(cr?.fmt as Formato) ? cr.fmt : "normal";
        this.s = newRoom(this.roomId, { id: o.id, name: str(o.name, 12) || "Reina", queen: null, joined: Number(o.joined) || now, alive: false }, str(cr?.season, 30), ritmo, { fmt, ia: !!cr?.ia });
        if (cr?.custom) this.s = { ...this.s, custom: cr.custom };
      }
    } else this.set(applyOp(this.s, o.id, { t: "join", name: o.name, joined: o.joined }, now, this.engine));
    this.sendState(c);
  }

  async onDrop(c: Client) {
    // Se ha cortado sin querer: se le guarda el sitio un rato
    try { await this.allowReconnection(c, 60); } catch { this.gone(c); }
  }
  onLeave(c: Client) { this.gone(c); }
  private gone(c: Client) {
    const id = this.who.get(c.sessionId);
    this.who.delete(c.sessionId);
    if (id && this.s && this.s.phase === "lobby" && ![...this.who.values()].includes(id)) this.set(applyOp(this.s, id, { t: "leave" }, Date.now(), this.engine));
  }

  private present() { return new Set(this.who.values()); }
  private apply(c: Client, op: Op) {
    const from = this.who.get(c.sessionId);
    if (!from || !this.s) return;
    if (op && op.t === "start") this.content = { ...this.content, names: { ...this.content.names, ...cleanContent({ names: op.names }).names } };
    this.set(applyOp(this.s, from, op, Date.now(), this.engine));
  }
  private set(n: RoomState) {
    if (!this.s || n === this.s) return;
    this.s = n;
    this.broadcast("state", { s: n, now: Date.now() });
  }
  private sendState(c: Client) { if (this.s) c.send("state", { s: this.s, now: Date.now() }); }

  private beat() {
    if (!this.s) return;
    const now = Date.now();
    // Relevo de anfitriona: si lleva 9 s fuera, pasa a la siguiente que entró
    if (!this.present().has(this.s.host)) {
      if (!this.hostGone) this.hostGone = now;
      else if (now - this.hostGone > 9000) { this.set(handOver(this.s, this.present(), now)); this.hostGone = 0; }
    } else this.hostGone = 0;
    this.set(tick(this.s, now, this.engine));
  }
}
