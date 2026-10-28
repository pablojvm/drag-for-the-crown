import { ask } from "../ui/confirm";
// Ficha de jugadora en la esquina del menú: quién juega y dónde se guarda la partida
import { cloud } from "./cloud";

const $ = <T extends HTMLElement = HTMLElement>(s: string) => document.querySelector<T>(s);

function render() {
  const chip = $("#user-chip");
  if (!chip) return;
  const google = cloud.ready() && !cloud.isGuest;
  const email = cloud.email || "";
  const name = google ? email.split("@")[0] : "Invitada";
  $("#user-name")!.textContent = name;
  $("#user-av")!.textContent = google ? name.charAt(0).toUpperCase() : "👤";
  chip.classList.toggle("on", google);
  $("#user-sub")!.textContent = google ? "Guardado en tu cuenta" : cloud.ready() ? "Guardado en la nube" : "Partida en este dispositivo";
  $("#user-pop-title")!.textContent = google ? email : "Juegas como invitada";
  $("#user-pop-txt")!.textContent = google
    ? "Tu progreso te sigue en cualquier dispositivo donde entres con esta cuenta."
    : cloud.ready()
      ? cloud.googleOn
        ? "Tu progreso se guarda en la nube desde este navegador. Entra con Google para llevártelo a cualquier dispositivo."
        : "Tu progreso se guarda en la nube desde este navegador."
      : "Tu progreso se guarda solo en este navegador.";
  $("#btn-cloud")!.hidden = google || !cloud.ready() || !cloud.googleOn;
  $("#btn-signout")!.hidden = !google;
}

function open(on: boolean) {
  const pop = $("#user-pop"), chip = $("#user-chip");
  if (!pop || !chip) return;
  pop.hidden = !on;
  chip.setAttribute("aria-expanded", String(on));
  if (on) render();
}

document.addEventListener("click", (e) => {
  const t = e.target as HTMLElement;
  if (t.closest?.("#user-chip")) return open($("#user-pop")!.hidden);
  if (t.closest?.("#btn-cloud")) { cloud.google(); return; }
  if (t.closest?.("#btn-signout")) { ask("Tu progreso queda guardado en tu cuenta.", { title: "¿Cerrar sesión?", ok: "Cerrar sesión", icon: "👋" }).then((y) => { if (y) cloud.signOut(); }); return; }
  if (!t.closest?.("#user-pop")) open(false);
});
document.addEventListener("keydown", (e) => { if (e.key === "Escape") open(false); });
cloud.readyPromise.then(render);
render();
