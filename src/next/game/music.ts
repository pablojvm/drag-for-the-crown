// Música del motor nuevo (la misma que el juego de siempre) y los golpes de Shantay / Sashay.
import { get, store } from "../store";

const mk = (src: string, vol: number, loop = false) => {
  if (typeof Audio === "undefined") return null;
  const a = new Audio(src);
  a.preload = "none";
  a.volume = vol;
  a.loop = loop;
  return a;
};
const theme = mk("./audio/Sissy That Walk.mp3", 0.12, true);
const shantay = mk("./audio/Shantay.mp3", 0.3);
const sashay = mk("./audio/Sashay.mp3", 0.3);
const read = () => { try { return localStorage.getItem("dftc-next-music") !== "0"; } catch { return true; } };
let musicOn = read();
let unlocked = false;

export const isMusicOn = () => musicOn;
export function setMusic(on: boolean) {
  musicOn = on;
  try { localStorage.setItem("dftc-next-music", on ? "1" : "0"); } catch { /* sin almacenamiento */ }
  sync();
}
/** Suena en el menú y en el modo historia; se calla en el arcade, el lip sync y la pasarela (tienen su ritmo). */
function sync() {
  if (!theme) return;
  const s = get();
  const want = unlocked && musicOn && !s.muted && s.screen === "menu";
  if (want && theme.paused) theme.play().catch(() => {});
  if (!want && !theme.paused) theme.pause();
}
export function unlockMusic() { unlocked = true; sync(); }
store.subscribe(sync);
/** Al acabar un lip sync. */
export function verdictSound(won: boolean) {
  const a = won ? shantay : sashay;
  if (!a || get().muted) return;
  a.currentTime = 0;
  a.play().catch(() => {});
}
