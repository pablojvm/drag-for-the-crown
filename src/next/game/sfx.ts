// Efectos de sonido sintetizados (Web Audio): sin archivos que descargar ni derechos de autor.
// El audio solo arranca tras un gesto de la jugadora (los navegadores lo exigen).
import { get } from "../store";

let ctx: AudioContext | null = null;
let master: GainNode | null = null;

/** Llamar en un clic o una tecla: crea o reanuda el audio. */
export function unlockAudio() {
  try {
    if (!ctx) {
      const AC = window.AudioContext || (window as any).webkitAudioContext;
      if (!AC) return;
      ctx = new AC();
      master = ctx.createGain();
      master.gain.value = 0.35;
      master.connect(ctx.destination);
    }
    if (ctx.state === "suspended") void ctx.resume();
  } catch { ctx = null; }
}

function tone(freq: number, dur: number, o: { type?: OscillatorType; to?: number; vol?: number; delay?: number } = {}) {
  if (!ctx || !master || get().muted) return;
  const t = ctx.currentTime + (o.delay || 0);
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = o.type || "square";
  osc.frequency.setValueAtTime(freq, t);
  if (o.to) osc.frequency.exponentialRampToValueAtTime(o.to, t + dur);
  g.gain.setValueAtTime(o.vol ?? 0.3, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + dur);
  osc.connect(g).connect(master);
  osc.start(t);
  osc.stop(t + dur + 0.02);
}

export const sfx = {
  shoot: () => tone(880, 0.06, { type: "triangle", to: 1320, vol: 0.12 }),
  hit: () => tone(320, 0.09, { type: "square", to: 180, vol: 0.2 }),
  hurt: () => { tone(220, 0.25, { type: "sawtooth", to: 80, vol: 0.3 }); tone(110, 0.3, { type: "square", vol: 0.15 }); },
  pickup: () => [660, 880, 1320].forEach((f, i) => tone(f, 0.08, { type: "triangle", delay: i * 0.06, vol: 0.2 })),
  power: () => [523, 659, 784, 1047, 1319].forEach((f, i) => tone(f, 0.12, { type: "square", delay: i * 0.05, vol: 0.18 })),
  down: () => [784, 659, 523, 392].forEach((f, i) => tone(f, 0.14, { type: "triangle", delay: i * 0.08, vol: 0.22 })),
  win: () => [523, 659, 784, 1047, 784, 1047].forEach((f, i) => tone(f, 0.16, { type: "square", delay: i * 0.12, vol: 0.2 })),
  lose: () => [392, 330, 262, 196].forEach((f, i) => tone(f, 0.22, { type: "sawtooth", delay: i * 0.16, vol: 0.18 })),
};
