// Captura de errores: cualquier fallo del juego se apunta (en la consola y, si hay servidor, en Supabase)
// y la jugadora ve un aviso amable en vez de una pantalla congelada sin explicación.
import { cloud } from "./cloud";

declare const __DFTC_VERSION__: string;
const VERSION = typeof __DFTC_VERSION__ === "string" ? __DFTC_VERSION__ : "dev";

let sent = 0;
let lastToast = 0;
const seen = new Set<string>();

/** Qué estaba haciendo la jugadora (pantalla y fase), sin datos personales. */
function context() {
  const w = window as any;
  const scr = document.querySelector(".screen.active, .screen:not([hidden])")?.id || "";
  const mp = w.__mpRoom?.state ? `mp:${w.__mpRoom.state.phase}:${w.__mpRoom.state.ep}` : "";
  return [scr, mp].filter(Boolean).join(" ").slice(0, 500);
}

export function report(err: unknown, where = "") {
  const e = err instanceof Error ? err : new Error(typeof err === "string" ? err : JSON.stringify(err));
  const message = `${where ? `[${where}] ` : ""}${e.message || "Error"}`.slice(0, 500);
  const key = message + (e.stack || "").split("\n")[1];
  console.error("[dftc]", e);
  if (seen.has(key)) return; // el mismo fallo una vez por sesión
  seen.add(key);
  // Aviso a la jugadora (como mucho uno por minuto)
  const now = Date.now();
  if (now - lastToast > 60_000) {
    lastToast = now;
    (window as any).Toast?.show?.("⚠️ Algo no ha ido bien", "Si se queda pillado, recarga la página: tu partida está guardada.");
  }
  // Al servidor, con tope por sesión
  if (sent >= 20 || !cloud.sb || !cloud.ready()) return;
  sent++;
  cloud.sb.from("client_errors").insert({ message, stack: (e.stack || "").slice(0, 4000), context: context(), version: VERSION, url: location.pathname.slice(0, 300) }).then(() => {}, () => {});
}

window.addEventListener("error", (ev) => {
  // Fallos de carga de imágenes o audio no son errores del juego
  if (!(ev as ErrorEvent).error && !(ev as ErrorEvent).message) return;
  report((ev as ErrorEvent).error || (ev as ErrorEvent).message, "error");
});
window.addEventListener("unhandledrejection", (ev) => {
  const r = (ev as PromiseRejectionEvent).reason;
  // Cortes de red (IA, nube) ya se gestionan donde ocurren
  if (r && /fetch|network|aborted|timeout/i.test(String(r.message || r))) return;
  report(r, "promesa");
});
(window as any).DFTC_REPORT = report;
