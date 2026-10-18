// Conexión con el servidor (Supabase): IA con cuota, partida en la nube, Hall of Fame mundial y memoria larga.
// Si no hay VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY el juego funciona igual que antes, solo en este navegador.
import { createClient, type SupabaseClient, type Session } from "@supabase/supabase-js";

// La URL y la clave publishable son públicas (acaban en el navegador); las variables VITE_* solo las sustituyen
const URL = (import.meta.env.VITE_SUPABASE_URL as string | undefined) || "https://dfrpawqeganamczjjafi.supabase.co";
const ANON = (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined) || "sb_publishable_VadA8dMEtciBROMEjPGZwQ_MfB8Qtzn";

// Claves de localStorage que viajan a la nube (todo el progreso salvo las claves de IA locales)
const SKIP = new Set(["dftc-claves", "dftc-sync-at", "dftc-sync-local"]);
const syncKeys = () => Object.keys(localStorage).filter((k) => k.startsWith("dftc-") && !SKIP.has(k) && (localStorage.getItem(k) || "").length < 400_000);

export interface TopEntry { name: string; queen: string; season: string; ppe: number; winsT: number; won: boolean; place: string | null; date: string; score: number; id: string }

class Cloud {
  sb: SupabaseClient | null = null;
  session: Session | null = null;
  private pushTimer = 0;
  private top: TopEntry[] = [];
  private topAt = 0;
  private mem: { season: string; queen: string; summary: string }[] = [];
  readyPromise: Promise<void>;

  constructor() {
    this.readyPromise = URL && ANON ? this.init() : Promise.resolve();
  }
  get enabled() { return !!this.sb; }
  ready() { return !!this.session; }
  get isGuest() { return !!this.session?.user?.is_anonymous; }
  get email() { return this.session?.user?.email || null; }
  /** ¿Está activado el login con Google en Supabase? (si no, el botón no se enseña) */
  googleOn = false;

  private async init() {
    this.sb = createClient(URL!, ANON!, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true, storageKey: "sb-dftc-auth" } });
    try {
      const { data } = await this.sb.auth.getSession();
      this.session = data.session;
      if (!this.session) {
        const r = await this.sb.auth.signInAnonymously();
        this.session = r.data.session;
      }
      this.sb.auth.onAuthStateChange((_e, s) => { this.session = s; });
      try {
        const st = await fetch(`${URL}/auth/v1/settings`, { headers: { apikey: ANON! } }).then((r) => r.json());
        this.googleOn = !!st?.external?.google;
      } catch { this.googleOn = false; }
      await this.pull();
      this.loadMemories();
    } catch (e) {
      console.warn("[nube] sin conexión", e);
    }
  }

  // ---------- IA ----------
  async chat(system: string, user: string, o: { max?: number; temp?: number; json?: boolean; timeout?: number } = {}): Promise<string> {
    if (!this.sb || !this.session) throw { status: 0 };
    const { data, error } = await this.sb.functions.invoke("ai", { body: { system, user, max: o.max, temp: o.temp, json: o.json } });
    if (error) {
      const status = (error as any).context?.status || 0;
      throw { status };
    }
    return String((data as any)?.text || "");
  }

  // ---------- Progreso en la nube ----------
  /** Marca que hay cambios locales: se suben a los pocos segundos. */
  touch() {
    if (!this.enabled) return;
    localStorage.setItem("dftc-sync-local", String(Date.now()));
    clearTimeout(this.pushTimer);
    this.pushTimer = window.setTimeout(() => this.push(), 4000);
  }
  async push() {
    if (!this.sb || !this.session) return;
    const data: Record<string, string> = {};
    syncKeys().forEach((k) => (data[k] = localStorage.getItem(k) as string));
    const at = new Date().toISOString();
    const { error } = await this.sb.from("saves").upsert({ user_id: this.session.user.id, data, updated_at: at });
    if (!error) localStorage.setItem("dftc-sync-at", at);
  }
  /** Al abrir el juego: si la nube tiene algo más nuevo que este navegador, se trae y se recarga. */
  async pull() {
    if (!this.sb || !this.session) return;
    const { data } = await this.sb.from("saves").select("data, updated_at").eq("user_id", this.session.user.id).maybeSingle();
    const localAt = Number(localStorage.getItem("dftc-sync-local") || 0);
    const syncedAt = Date.parse(localStorage.getItem("dftc-sync-at") || "") || 0;
    if (!data) { if (syncKeys().length) this.push(); return; }
    const remoteAt = Date.parse(data.updated_at);
    if (remoteAt > syncedAt && remoteAt > localAt) {
      Object.entries(data.data as Record<string, string>).forEach(([k, v]) => localStorage.setItem(k, v));
      localStorage.setItem("dftc-sync-at", data.updated_at);
      localStorage.setItem("dftc-sync-local", String(remoteAt));
      if (!sessionStorage.getItem("dftc-pulled")) { sessionStorage.setItem("dftc-pulled", "1"); location.reload(); }
    } else if (localAt > remoteAt) this.push();
  }

  // ---------- Cuenta ----------
  /** Guarda el progreso con Google: si eres anónima se enlaza a tu cuenta (no pierdes nada). */
  async google() {
    if (!this.sb || !this.googleOn) return;
    const redirectTo = location.href.split("#")[0];
    if (this.session && this.isGuest) {
      const { error } = await this.sb.auth.linkIdentity({ provider: "google", options: { redirectTo } });
      if (!error) return;
    }
    await this.sb.auth.signInWithOAuth({ provider: "google", options: { redirectTo } });
  }
  async signOut() {
    if (!this.sb) return;
    await this.push();
    await this.sb.auth.signOut();
    location.reload();
  }

  // ---------- Hall of Fame mundial ----------
  async submitScore(e: { name?: string; queen: string; season: string; ppe?: number; winsT?: number; won?: boolean; place?: unknown }) {
    if (!this.sb || !this.session) return;
    const name = String(e.name || "Anónima").slice(0, 16) || "Anónima";
    await this.sb.from("board").insert({
      user_id: this.session.user.id, name, queen: String(e.queen).slice(0, 60), season: String(e.season).slice(0, 40),
      ppe: Math.max(0, Math.min(5, Number(e.ppe) || 0)), wins: Math.max(0, Math.min(20, Number(e.winsT) || 0)), won: !!e.won,
      place: e.place == null ? null : String(e.place).slice(0, 12),
    });
    this.topAt = 0;
  }
  cachedTop() { return this.top; }
  async loadTop(force = false) {
    if (!this.sb || (!force && Date.now() - this.topAt < 60_000)) return this.top;
    const { data } = await this.sb.from("board").select("id, name, queen, season, ppe, wins, won, place, created_at").order("ppe", { ascending: false }).order("wins", { ascending: false }).order("won", { ascending: false }).limit(50);
    this.top = (data || []).map((r: any) => ({ id: "w" + r.id, name: r.name, queen: r.queen, season: r.season, ppe: Number(r.ppe), winsT: r.wins, won: r.won, place: r.place, date: r.created_at, score: 0 }));
    this.topAt = Date.now();
    return this.top;
  }

  // ---------- Memoria larga ----------
  async loadMemories() {
    if (!this.sb || !this.session) return;
    const { data } = await this.sb.from("memories").select("season, queen, summary").order("created_at", { ascending: false }).limit(6);
    this.mem = data || [];
  }
  /** Resumen de temporadas anteriores para que las reinas las recuerden (texto para la IA). */
  pastMemories(): string {
    if (!this.mem.length) return "";
    return "Temporadas anteriores de esta jugadora (las reinas que coincidan pueden recordarlo):\n" + this.mem.map((m) => `- ${m.season}, con ${m.queen}: ${m.summary}`).join("\n");
  }
  async addMemory(season: string, queen: string, summary: string) {
    if (!this.sb || !this.session || !summary) return;
    await this.sb.from("memories").insert({ user_id: this.session.user.id, season, queen, summary: summary.slice(0, 3900) });
    this.loadMemories();
  }
}

export const cloud = new Cloud();
(window as any).DFTC_NET = cloud;
