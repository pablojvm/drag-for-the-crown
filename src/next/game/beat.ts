// Música del lip sync, hecha en el navegador con Web Audio (sin canciones con derechos).
// Cada lip sync suena una «canción» inventada que va de menos a más: estrofa, estribillo y clímax.
import { get, store } from "../store";
import { isMusicOn } from "./music";

interface Song { titulo: string; bpm: number; root: number; scale: number[]; bass: number[]; chords: number[][] }
// Grados de la escala (semitonos sobre la tónica) para el bajo y los acordes de cada compás
const SONGS: Song[] = [
  { titulo: "Tacones de neón", bpm: 124, root: 55, scale: [0, 3, 5, 7, 10], bass: [0, 0, 8, 7], chords: [[0, 3, 7], [0, 3, 7], [8, 12, 15], [7, 10, 14]] },
  { titulo: "Purpurina en la sangre", bpm: 120, root: 49, scale: [0, 2, 4, 7, 9], bass: [0, 5, 9, 7], chords: [[0, 4, 7], [5, 9, 12], [9, 12, 16], [7, 11, 14]] },
  { titulo: "Reina de la noche", bpm: 128, root: 58.27, scale: [0, 3, 5, 7, 10], bass: [0, 10, 8, 7], chords: [[0, 3, 7], [10, 14, 17], [8, 12, 15], [7, 10, 14]] },
  { titulo: "Sashay al amanecer", bpm: 118, root: 46.25, scale: [0, 2, 4, 7, 9], bass: [0, 7, 9, 5], chords: [[0, 4, 7], [7, 11, 14], [9, 12, 16], [5, 9, 12]] },
];
const hz = (root: number, semis: number) => root * Math.pow(2, semis / 12);

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let noise: AudioBuffer | null = null;
let timer = 0;
let song: Song | null = null;
let level = 0;
let next = 0;
let tick = 0;
let key = "";

function audio(): AudioContext | null {
  if (ctx) return ctx;
  const AC = typeof window !== "undefined" ? window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext : undefined;
  if (!AC) return null;
  ctx = new AC();
  master = ctx.createGain();
  master.gain.value = 0;
  master.connect(ctx.destination);
  noise = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
  const d = noise.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  return ctx;
}
const env = (g: GainNode, t: number, peak: number, dur: number) => { g.gain.setValueAtTime(peak, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur); };

function kick(t: number) {
  const c = ctx!, o = c.createOscillator(), g = c.createGain();
  o.frequency.setValueAtTime(150, t);
  o.frequency.exponentialRampToValueAtTime(45, t + 0.12);
  env(g, t, 0.9, 0.22);
  o.connect(g).connect(master!);
  o.start(t); o.stop(t + 0.25);
}
function hiss(t: number, freq: number, type: BiquadFilterType, peak: number, dur: number) {
  const c = ctx!, s = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain();
  s.buffer = noise; f.type = type; f.frequency.value = freq;
  env(g, t, peak, dur);
  s.connect(f).connect(g).connect(master!);
  s.start(t); s.stop(t + dur + 0.02);
}
function tone(t: number, f: number, type: OscillatorType, peak: number, dur: number, cut = 1800) {
  const c = ctx!, o = c.createOscillator(), lp = c.createBiquadFilter(), g = c.createGain();
  o.type = type; o.frequency.value = f; lp.type = "lowpass"; lp.frequency.value = cut;
  env(g, t, peak, dur);
  o.connect(lp).connect(g).connect(master!);
  o.start(t); o.stop(t + dur + 0.02);
}

/** Un semicorchea: lo que suena depende de la intensidad (0 estrofa, 1-2 estribillo, 3 clímax). */
function step(t: number, n: number) {
  const s = song!, beat = n % 16, bar = Math.floor(n / 16) % 4, sixteenth = 60 / s.bpm / 4;
  if (beat % 4 === 0) kick(t);
  if (level >= 1 && beat % 4 === 2) hiss(t, 8000, "highpass", 0.18, 0.05);
  if (level >= 3 && beat % 2 === 1) hiss(t, 9500, "highpass", 0.08, 0.03);
  if (level >= 2 && (beat === 4 || beat === 12)) { hiss(t, 1600, "bandpass", 0.5, 0.14); hiss(t + 0.012, 1600, "bandpass", 0.3, 0.1); }
  // Bajo en las corcheas a contratiempo
  if (level >= 1 && beat % 4 === 2) tone(t, hz(s.root, s.bass[bar]), "sawtooth", 0.22, sixteenth * 1.8, 500 + level * 200);
  // Acordes: un colchón en la estrofa, golpes en el estribillo
  const ch = s.chords[bar];
  if (beat === 0 && level === 0) ch.forEach((x) => tone(t, hz(s.root * 4, x), "triangle", 0.05, sixteenth * 15, 1200));
  if (level >= 2 && (beat === 3 || beat === 6 || beat === 10 || beat === 14)) ch.forEach((x) => tone(t, hz(s.root * 4, x), "square", 0.035, sixteenth * 1.2, 2200));
  // Clímax: arpegio arriba
  if (level >= 3) tone(t, hz(s.root * 8, s.scale[(n * 3) % s.scale.length] + (beat >= 8 ? 12 : 0)), "triangle", 0.05, sixteenth * 0.9, 4000);
}

function schedule() {
  if (!ctx || !song) return;
  const sixteenth = 60 / song.bpm / 4;
  while (next < ctx.currentTime + 0.12) { step(next, tick); next += sixteenth; tick++; }
}
function volume() {
  if (!ctx || !master) return;
  const s = get();
  const on = !s.muted && isMusicOn();
  master.gain.setTargetAtTime(on ? 0.32 : 0, ctx.currentTime, 0.08);
}

/** El título de lo que suena ahora (para enseñarlo en el lip sync). */
export const currentSong = () => song?.titulo || "";

function start(seed: number) {
  const c = audio();
  if (!c) return;
  if (c.state === "suspended") void c.resume();
  song = SONGS[seed % SONGS.length];
  level = 0; tick = 0; next = c.currentTime + 0.05;
  volume();
  clearInterval(timer);
  timer = window.setInterval(schedule, 25);
}
/** Final: golpe de platillo y se apaga. */
function finish() {
  if (!ctx || !song) return;
  clearInterval(timer);
  timer = 0;
  hiss(ctx.currentTime + 0.02, 5000, "highpass", 0.35, 1.4);
  kick(ctx.currentTime + 0.02);
  song = null;
}
function stop() {
  clearInterval(timer);
  timer = 0;
  song = null;
  if (ctx && master) master.gain.setTargetAtTime(0, ctx.currentTime, 0.05);
}

let seq = 0;
// Sigue al lip sync: empieza con él, sube con cada paso y se para con el veredicto o al salir
store.subscribe(() => {
  const s = get();
  const ls = s.ls;
  const on = !!ls && (s.screen === "lipsync" || s.hist.scene === "lipsync");
  if (!on) { if (song || timer) stop(); key = ""; return; }
  const k = `${ls!.rivalId}:${ls!.rival}`;
  if (ls!.done) { if (song) finish(); return; }
  if (k !== key) { key = k; start(seq++ + Math.floor(Math.random() * SONGS.length)); }
  level = ls!.step >= 4 ? 3 : ls!.step >= 2 ? 2 : ls!.step >= 1 ? 1 : 0;
  volume();
});
