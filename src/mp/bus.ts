// Canal de la sala: Supabase Realtime en producción; BroadcastChannel (pestañas del mismo navegador) para probar sin servidor.
import type { SupabaseClient, RealtimeChannel } from "@supabase/supabase-js";

export type Handler = (data: any, from: string) => void;
export interface Bus {
  readonly kind: "online" | "local";
  send(ev: string, data: unknown): void;
  on(ev: string, cb: Handler): void;
  /** Quién está conectada ahora mismo (incluida yo). */
  peers(): string[];
  close(): void;
}

abstract class Base {
  protected handlers = new Map<string, Handler[]>();
  on(ev: string, cb: Handler) { this.handlers.set(ev, [...(this.handlers.get(ev) || []), cb]); }
  protected emit(ev: string, data: unknown, from: string) { (this.handlers.get(ev) || []).forEach((h) => h(data, from)); }
}

export class LocalBus extends Base implements Bus {
  readonly kind = "local" as const;
  private ch: BroadcastChannel;
  private seen = new Map<string, number>();
  private hb: number;
  constructor(code: string, private me: string) {
    super();
    this.ch = new BroadcastChannel(`dftc-mp-${code}`);
    this.ch.onmessage = (m) => {
      const { ev, data, from } = m.data || {};
      if (!ev || from === this.me) return;
      this.seen.set(from, Date.now());
      if (ev !== "hb") this.emit(ev, data, from);
    };
    this.hb = window.setInterval(() => this.ch.postMessage({ ev: "hb", from: this.me }), 2000);
    this.ch.postMessage({ ev: "hb", from: this.me });
  }
  send(ev: string, data: unknown) { this.ch.postMessage({ ev, data, from: this.me }); }
  peers() { const t = Date.now(); return [this.me, ...[...this.seen].filter(([, at]) => t - at < 7000).map(([id]) => id)]; }
  close() { clearInterval(this.hb); this.ch.close(); }
}

export class OnlineBus extends Base implements Bus {
  readonly kind = "online" as const;
  private ch: RealtimeChannel;
  private present: string[] = [];
  ready: Promise<void>;
  constructor(code: string, private me: string, sb: SupabaseClient) {
    super();
    this.ch = sb.channel(`dftc-mp-${code}`, { config: { broadcast: { self: false }, presence: { key: me } } });
    this.ch.on("broadcast", { event: "msg" }, ({ payload }) => { if (payload && payload.from !== this.me) this.emit(payload.ev, payload.data, payload.from); });
    this.ch.on("presence", { event: "sync" }, () => { this.present = Object.keys(this.ch.presenceState()); });
    this.ready = new Promise((res) => this.ch.subscribe((st) => { if (st === "SUBSCRIBED") { this.ch.track({ at: Date.now() }); res(); } }));
  }
  send(ev: string, data: unknown) { this.ch.send({ type: "broadcast", event: "msg", payload: { ev, data, from: this.me } }); }
  peers() { return this.present.includes(this.me) ? this.present : [this.me, ...this.present]; }
  close() { this.ch.untrack(); this.ch.unsubscribe(); }
}
