// Cloudflare Turnstile: comprueba que quien entra es una persona antes de crear la invitada en Supabase.
// La site key es pública; la secreta va en Supabase (Authentication > Attack Protection > Turnstile).
// Si Turnstile no carga (sin red, bloqueado...), se sigue sin token: con la protección activada en Supabase, esa
// visita juega igual pero sin nube (IA, Hall of Fame mundial), como cuando no hay servidor.
const SITE_KEY = (import.meta.env.VITE_TURNSTILE_SITE_KEY as string | undefined) || "0x4AAAAAAF2gwbSYBEY5eGpg";
const SRC = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

let loading: Promise<any> | null = null;
function load(): Promise<any> {
  const w = window as any;
  if (w.turnstile) return Promise.resolve(w.turnstile);
  return (loading ||= new Promise((ok, ko) => {
    const s = document.createElement("script");
    s.src = SRC;
    s.async = true;
    s.onload = () => (w.turnstile ? ok(w.turnstile) : ko(new Error("turnstile")));
    s.onerror = () => { loading = null; ko(new Error("turnstile")); };
    document.head.appendChild(s);
  }));
}

/** Un token de Turnstile (o null si no se puede). Normalmente no se ve nada; si Cloudflare duda, sale la casilla. */
export async function turnstileToken(timeoutMs = 20000, visible = false): Promise<string | null> {
  if (!SITE_KEY || typeof document === "undefined") return null;
  // Las pruebas automáticas no pasan por Turnstile (en Supabase se puede dejar sin activar para ellas)
  if (navigator.webdriver) return null;
  let ts: any;
  try { ts = await load(); } catch { return null; }
  return new Promise((resolve) => {
    const box = document.createElement("div");
    box.className = "dftc-turnstile";
    box.style.cssText = "position:fixed;right:12px;bottom:12px;z-index:2147483000";
    document.body.appendChild(box);
    let id: string | undefined;
    const end = (t: string | null) => {
      clearTimeout(timer);
      try { if (id !== undefined) ts.remove(id); } catch { /* ya no está */ }
      box.remove();
      resolve(t);
    };
    const timer = setTimeout(() => end(null), timeoutMs);
    try {
      id = ts.render(box, {
        sitekey: SITE_KEY,
        appearance: visible ? "always" : "interaction-only",
        language: "es",
        callback: (t: string) => end(t),
        "error-callback": (code: string) => { console.warn("[turnstile] error", code); end(null); },
        "expired-callback": () => end(null),
      });
    } catch { end(null); }
  });
}
