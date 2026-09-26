// ---------------------------------------------------------------------------
// Audio: música, voces y efectos. Todo tolera que el navegador bloquee el play.
// ---------------------------------------------------------------------------
const Sound = (() => {
  const make = (src, volume = 0.25, loop = false) => {
    const a = new Audio(src);
    a.preload = "auto";
    a.volume = volume;
    a.loop = loop;
    a.dataset.baseVolume = volume;
    return a;
  };

  const music = make("./audio/Sissy That Walk.mp3", 0.12, true);
  const win = make("./audio/Shantay.mp3", 0.3);
  const lose = make("./audio/Sashay.mp3", 0.3);
  const hits = [make("./audio/gurl.mp3", 0.3), make("./audio/honey.mp3", 0.35), make("./audio/security.mp3", 0.3)];
  const voices = Object.fromEntries(QUEENS.filter((q) => q.voice).map((q) => [q.id, make(q.voice, 0.3)]));
  const all = [music, win, lose, ...hits, ...Object.values(voices)];

  let muted = store.get("dftc-muted", false);

  // Pequeños efectos sintetizados (disparo, impacto, power-up) con WebAudio
  let ctx = null;
  function blip(freq, duration, type = "square", gain = 0.04, slide = 0) {
    if (muted) return;
    try {
      ctx = ctx || new (window.AudioContext || window.webkitAudioContext)();
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = type;
      o.frequency.setValueAtTime(freq, ctx.currentTime);
      if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(40, freq + slide), ctx.currentTime + duration);
      g.gain.setValueAtTime(gain, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);
      o.connect(g).connect(ctx.destination);
      o.start();
      o.stop(ctx.currentTime + duration);
    } catch {
      /* WebAudio no disponible */
    }
  }

  function play(a) {
    if (muted) return;
    a.currentTime = 0;
    a.play().catch(() => {});
  }

  return {
    get muted() {
      return muted;
    },
    toggleMute() {
      muted = !muted;
      store.set("dftc-muted", muted);
      all.forEach((a) => (a.muted = muted));
      if (!muted && Game.state === "playing") music.play().catch(() => {});
      return muted;
    },
    init() {
      all.forEach((a) => (a.muted = muted));
    },
    music: () => play(music),
    pauseMusic: () => music.pause(),
    resumeMusic: () => !muted && music.play().catch(() => {}),
    stopAll: () =>
      all.forEach((a) => {
        a.pause();
        a.currentTime = 0;
      }),
    win: () => play(win),
    lose: () => play(lose),
    voice: (id) => voices[id] && play(voices[id]),
    hit: () => play(pick(hits)),
    shoot: () => blip(880, 0.07, "square", 0.025, 400),
    enemyShoot: () => blip(300, 0.09, "triangle", 0.03, -120),
    impact: () => blip(180, 0.12, "sawtooth", 0.04, -120),
    powerup: () => {
      blip(660, 0.08, "sine", 0.05, 200);
      setTimeout(() => blip(990, 0.12, "sine", 0.05, 300), 80);
    },
    countdown: (last) => blip(last ? 880 : 520, last ? 0.35 : 0.12, "sine", 0.06),
  };
})();
