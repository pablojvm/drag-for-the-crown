// Botón de cuenta en el menú: guardar en la nube con Google (las partidas anónimas ya se guardan solas)
import { cloud } from "./cloud";

function render() {
  const b = document.querySelector<HTMLButtonElement>("#btn-cloud");
  if (!b) return;
  // Sin Google activado en Supabase el botón no sirve (la partida anónima ya se guarda sola)
  if (!cloud.enabled || (!cloud.googleOn && !(cloud.ready() && !cloud.isGuest))) { b.hidden = true; return; }
  b.hidden = false;
  b.textContent = cloud.ready() && !cloud.isGuest ? `☁️ ${cloud.email || "Cuenta conectada"}` : "☁️ Guardar con Google";
  b.title = cloud.ready() && !cloud.isGuest ? "Tu progreso se guarda en tu cuenta. Pulsa para cerrar sesión." : "Entra con Google para seguir tu partida en cualquier dispositivo";
}
document.addEventListener("click", (e) => {
  const b = (e.target as HTMLElement).closest?.("#btn-cloud");
  if (!b) return;
  if (cloud.ready() && !cloud.isGuest) { if (confirm("¿Cerrar sesión? Tu progreso queda guardado en tu cuenta.")) cloud.signOut(); }
  else cloud.google();
});
cloud.readyPromise.then(render);
window.addEventListener("DOMContentLoaded", render);
