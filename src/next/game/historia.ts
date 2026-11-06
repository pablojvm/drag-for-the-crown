// Modo historia: el mismo de siempre (js/historia), dentro de la versión nueva. Se abre clasico.html?historia en un
// marco transparente a pantalla completa: la historia (textos, pantallas, orden y reglas) es la de siempre, y detrás se
// ve el plató del motor nuevo (Phaser). La pasarela y los lip syncs se juegan en las escenas del motor nuevo: la
// historia los pide, el marco se aparta y, al volver, se le devuelve el resultado.
// La partida, el armario, las coronas y el Hall of Fame se guardan en las mismas claves, así que todo se comparte.
import { get, set } from "../store";
import { send } from "../bridge";
import { setLookSeason } from "./queens";
import { startLipSync } from "./lipsync";
import { startRunway } from "./runway";
import { juradoListo } from "./jurado";
import type { LsAttrs } from "../../core/lipsync";
import type { Tag } from "../../core/runway";

export type HistoriaModo = "" | "nueva" | "seguir" | "mp";
let modo: HistoriaModo = "";
let frame: Window | null = null;
export const historiaModo = () => modo;
export const setHistoriaFrame = (w: Window | null) => { frame = w; };

/** Hay una temporada del modo historia a medias. */
export function hasHistoria(): boolean {
  try { return !!localStorage.getItem("dftc-story-save"); } catch { return false; }
}
export function openHistoria(m: HistoriaModo = "") {
  modo = m;
  set({ screen: "historia", back: null, hist: { bg: "werkroom", busy: true, scene: null } });
  send({ type: "scene", key: "Plato" });
}
export function closeHistoria() {
  if (get().screen !== "historia") return;
  set({ hist: { ...get().hist, scene: null } });
  send({ type: "menu" });
}
/** Está abierta la historia (aunque ahora se esté jugando una escena del motor nuevo). */
export const historiaOn = () => get().screen === "historia" || !!get().hist.scene;

interface Msg {
  ev?: string; name?: string; queen?: string; season?: string; on?: boolean;
  rival?: string; strength?: number; attrs?: LsAttrs; cat?: string; tag?: string; pieces?: string[]; concept?: boolean;
}
/** Lo que cuenta el modo historia desde el marco. */
export function onHistoria(d: Msg) {
  if (!historiaOn()) return;
  if (d.ev === "set") {
    if (d.season) setLookSeason(d.season);
    set({ hist: { ...get().hist, bg: d.name === "stage" || d.name === "panel" ? "stage" : "werkroom" }, ...(d.queen ? { queenId: d.queen } : {}) });
  }
  if (d.ev === "busy") set({ hist: { ...get().hist, busy: !!d.on } });
  if (d.ev === "cancel" && get().hist.scene) {
    set({ screen: "historia", back: null, hist: { ...get().hist, scene: null } });
    send({ type: "scene", key: "Plato" });
  }
  if (d.queen && d.queen !== get().queenId && (d.ev === "lipsync" || d.ev === "runway")) set({ queenId: d.queen });
  if (d.ev === "lipsync" && d.rival) {
    set({ hist: { ...get().hist, scene: "lipsync" } });
    startLipSync(get().queenId, Math.random, { rivalId: d.rival, attrs: d.attrs, strength: d.strength });
    set({ back: "Volver a la historia" });
    send({ type: "scene", key: "LipSync" });
  }
  if (d.ev === "runway" && d.cat) {
    set({ hist: { ...get().hist, scene: "runway" } });
    startRunway(get().queenId, Math.random, d.concept && juradoListo() ? "concepto" : "clasica", d.cat, { look: (d.tag || "Glamour") as Tag, pieces: d.pieces || [], attrs: d.attrs });
    set({ back: "Volver a la historia" });
    send({ type: "scene", key: "Runway" });
  }
}
const reply = (data: Record<string, unknown>) => { try { frame?.postMessage({ type: "dftc-historia-res", ...data }, location.origin); } catch { /* marco cerrado */ } };

/** El botón de volver de la pasarela o del lip sync (cuando los ha pedido la historia o el multijugador). */
export function backFromScene() { historiaBack(); }
/** El botón de volver de la pasarela o del lip sync, si los pidió la historia. true si era suyo. */
export function historiaBack(): boolean {
  const sc = get().hist.scene;
  if (!sc) return false;
  if (sc === "lipsync") {
    const ls = get().ls;
    if (!ls?.done) return true;
    reply({ kind: "lipsync", mine: ls.mine, rival: ls.rival });
  } else {
    const rw = get().rw;
    if (!rw?.done) return true;
    reply({ kind: "runway", score: rw.score ?? 50, concept: rw.mode === "concepto" ? rw.concept : null, reveal: !!rw.reveal || rw.picks.some((p) => /reveal/i.test(p)), critica: rw.lines ? `${rw.lines.supreme} ${rw.lines.ana}` : null, voiceGood: rw.mode === "clasica" && rw.good === true });
  }
  set({ screen: "historia", back: null, hist: { ...get().hist, scene: null } });
  send({ type: "scene", key: "Plato" });
  return true;
}
