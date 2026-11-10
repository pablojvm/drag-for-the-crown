// Conexión con el servidor (Supabase): IA con cuota, partida en la nube, Hall of Fame mundial y memoria larga.
// Si no hay VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY el juego funciona igual que antes, solo en este navegador.
import { createClient, type SupabaseClient, type Session } from "@supabase/supabase-js";
import { turnstileToken } from "./turnstile";

// La URL y la clave publishable son públicas (acaban en el navegador); las variables VITE_* solo las sustituyen
const URL = (import.meta.env.VITE_SUPABASE_URL as string | undefined) || "https://dfrpawqeganamczjjafi.supabase.co";
const ANON = (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined) || "sb_publishable_VadA8dMEtciBROMEjPGZwQ_MfB8Qtzn";

// Claves de localStorage que viajan a la nube (todo el progreso salvo las claves de IA locales)
const SKIP = new Set(["dftc-claves", "dftc-sync-at", "dftc-sync-local", "dftc-sync-user", "dftc-sync-guest"]);
const syncKeys = () => Object.keys(localStorage).filter((k) => k.startsWith("dftc-") && !SKIP.has(k) && (localStorage.getItem(k) || "").length < 400_000);

/** Borra de este navegador la partida (todo dftc-* salvo los ajustes de sonido y las claves de IA). */
const KEEP = /^dftc-(claves|ia-|muted|next-muted|next-music)/;
function clearProgress() {
  Object.keys(localStorage).filter((k) => k.startsWith("dftc-") && !KEEP.test(k)).forEach((k) => localStorage.removeItem(k));
}

// Cuánto progreso hay en un conjunto de datos (para no pisar una partida grande con una vacía al cambiar de cuenta)
const progressOf = (get: (k: string) => string | null) => {
  const arr = (k: string) => { try { const v = JSON.parse(get(k) || "[]"); return Array.isArray(v) ? v.length : 0; } catch { return 0; } };
  const num = (k: string) => { const n = Number(get(k)); return Number.isFinite(n) ? n : 0; };
  return arr("dftc-story-wins") * 1000 + arr("dftc-story-board") * 20 + (get("dftc-story-save") && get("dftc-story-save") !== "null" ? 5 : 0) + Math.min(num("dftc-sequins"), 9999) / 10000;
};

// La URL con la que se abrió la página (antes de que Supabase la limpie): trae los errores de vuelta de Google
const URL_AT_LOAD = typeof location !== "undefined" ? location.hash + location.search : "";

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
        // Antes de crear la invitada, Cloudflare Turnstile comprueba que es una persona (src/net/turnstile.ts)
        const captchaToken = await turnstileToken();
        let r = await this.sb.auth.signInAnonymously(captchaToken ? { options: { captchaToken } } : undefined);
        // Si Supabase no da por buena la comprobación, otra vez con la casilla a la vista (y se avisa en la consola)
        if (!r.data.session && !navigator.webdriver) {
          console.warn("[nube] no se ha podido entrar como invitada", r.error?.message || "", captchaToken ? "(con token)" : "(sin token de Turnstile)");
          const t2 = await turnstileToken(60000, true);
          if (t2) r = await this.sb.auth.signInAnonymously({ options: { captchaToken: t2 } });
          if (!r.data.session) console.warn("[nube] sigue sin entrar", r.error?.message || "");
        }
        this.session = r.data.session;
      }
      this.sb.auth.onAuthStateChange((_e, s) => { this.session = s; });
      // Si al enlazar Google resulta que esa cuenta ya existía (la creaste en otro dispositivo), se entra en ella
      if (/identity_already_exists/.test(URL_AT_LOAD)) {
        history.replaceState(null, "", location.pathname);
        await this.sb.auth.signInWithOAuth({ provider: "google", options: { redirectTo: location.href.split("#")[0] } });
        return;
      }
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
  /** Hasta que no se ha mirado la nube de esta cuenta, no se sube nada (podría ser la partida de otra persona). */
  private pulled = false;
  async push() {
    if (!this.sb || !this.session || !this.pulled) return;
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
    const uid = this.session.user.id;
    const lastUser = localStorage.getItem("dftc-sync-user");
    // ¿La partida de este navegador era de una invitada? (si no se sabe, se trata como de otra cuenta)
    const lastGuest = localStorage.getItem("dftc-sync-guest") === "1";
    const mark = () => { localStorage.setItem("dftc-sync-user", uid); localStorage.setItem("dftc-sync-guest", this.isGuest ? "1" : "0"); };
    mark();
    // Este navegador tenía la partida de OTRA cuenta (no de una invitada): no es de esta persona.
    // Se borra y se trae lo de esta cuenta (o se empieza de cero si no tiene nada). Nunca se sube lo de la otra.
    if (lastUser && lastUser !== uid && !lastGuest) {
      clearProgress();
      mark();
      this.pulled = true;
      if (data) return this.apply(data.data as Record<string, string>, data.updated_at);
      if (!sessionStorage.getItem("dftc-pulled")) { sessionStorage.setItem("dftc-pulled", "1"); location.reload(); }
      return;
    }
    this.pulled = true;
    if (!data) { if (syncKeys().length) this.push(); return; }
    const remoteAt = Date.parse(data.updated_at);
    // Cambio de cuenta (p. ej. entras con Google en un dispositivo que ya tenía partida): gana la que tenga más progreso
    if (lastUser && lastUser !== uid) {
      const remote = data.data as Record<string, string>;
      const mine = progressOf((k) => localStorage.getItem(k));
      const theirs = progressOf((k) => (k in remote ? remote[k] : null));
      if (mine > theirs) { await this.push(); return; }
      // La cuenta tiene más: se trae entera aunque este dispositivo haya tocado algo hace poco
      return this.apply(data.data as Record<string, string>, data.updated_at);
    }
    if (remoteAt > syncedAt && remoteAt > localAt) this.apply(data.data as Record<string, string>, data.updated_at);
    else if (localAt > remoteAt) this.push();
  }
  /** Copia en este navegador la partida de la nube y recarga una vez. */
  private apply(remote: Record<string, string>, at: string) {
    Object.entries(remote).forEach(([k, v]) => localStorage.setItem(k, v));
    localStorage.setItem("dftc-sync-at", at);
    localStorage.setItem("dftc-sync-local", String(Date.parse(at)));
    if (!sessionStorage.getItem("dftc-pulled")) { sessionStorage.setItem("dftc-pulled", "1"); location.reload(); }
  }

  // ---------- Cuenta ----------
  /** Guarda el progreso con Google: si eres anónima se enlaza a tu cuenta (no pierdes nada). */
  async google() {
    if (!this.sb || !this.googleOn) return;
    const redirectTo = location.href.split("#")[0];
    // Invitada con progreso: se enlaza Google a esta partida. Invitada sin progreso (p. ej. un móvil nuevo): se entra directamente en la cuenta
    const hasProgress = progressOf((k) => localStorage.getItem(k)) >= 1000;
    if (this.session && this.isGuest && hasProgress) {
      const { error } = await this.sb.auth.linkIdentity({ provider: "google", options: { redirectTo, queryParams: { prompt: "select_account" } } });
      if (!error) return;
    }
    // Google pregunta siempre con qué cuenta entrar (si no, entra sola con la última)
    await this.sb.auth.signInWithOAuth({ provider: "google", options: { redirectTo, queryParams: { prompt: "select_account" } } });
  }
  async signOut() {
    if (!this.sb) return;
    await this.push();
    await this.sb.auth.signOut();
    // Lo de esa cuenta queda en la nube; este navegador vuelve a empezar como invitada (se guardan solo los ajustes)
    clearProgress();
    Object.keys(localStorage).filter((k) => k.startsWith("sb-dftc-auth")).forEach((k) => localStorage.removeItem(k));
    sessionStorage.removeItem("dftc-pulled");
    location.reload();
  }

  // ---------- Hall of Fame mundial ----------
  async submitScore(e: { name?: string; queen: string; season: string; ppe?: number; winsT?: number; won?: boolean; place?: unknown; labels?: unknown }) {
    if (!this.sb || !this.session) return;
    // El servidor calcula el PPE, los retos ganados y la corona con el track record (sin él no lo apunta)
    const track = Array.isArray(e.labels) ? e.labels.filter((l): l is string => typeof l === "string").map((l) => l.slice(0, 12)).slice(0, 20) : [];
    if (!track.length) return;
    const name = String(e.name || "Anónima").slice(0, 16) || "Anónima";
    await this.sb.from("board").insert({
      user_id: this.session.user.id, name, queen: String(e.queen).slice(0, 60), season: String(e.season).slice(0, 40),
      ppe: Math.max(0, Math.min(5, Number(e.ppe) || 0)), wins: Math.max(0, Math.min(20, Number(e.winsT) || 0)), won: !!e.won,
      place: e.place == null ? null : String(e.place).slice(0, 12), track,
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
