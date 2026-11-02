// Modo historia: el mismo de siempre (js/historia), dentro de la versión nueva. Se abre clasico.html?historia en un
// marco a pantalla completa: entra directa a la historia y, al salir, avisa para volver a esta portada.
// La partida, el armario, las coronas y el Hall of Fame se guardan en las mismas claves, así que todo se comparte.
import { get, set } from "../store";
import { send } from "../bridge";

export type HistoriaModo = "" | "nueva" | "seguir";
let modo: HistoriaModo = "";
export const historiaModo = () => modo;

/** Hay una temporada del modo historia a medias. */
export function hasHistoria(): boolean {
  try { return !!localStorage.getItem("dftc-story-save"); } catch { return false; }
}
export function openHistoria(m: HistoriaModo = "") {
  modo = m;
  set({ screen: "historia", back: null });
}
export function closeHistoria() {
  if (get().screen !== "historia") return;
  send({ type: "menu" });
}
