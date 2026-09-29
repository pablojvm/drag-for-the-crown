// ---------------------------------------------------------------------------
// Extras: lentejuelas (moneda), armario (mejoras de estadísticas), logros,
// avisos, confeti, telón y música sintetizada propia.
// ---------------------------------------------------------------------------

// ------------------------------ Lentejuelas --------------------------------
const Wallet = {
  get balance() {
    return store.get("dftc-sequins", 0);
  },
  add(n) {
    n = Math.max(0, Math.round(n));
    if (!n) return 0;
    store.set("dftc-sequins", this.balance + n);
    Wallet.refresh();
    return n;
  },
  spend(n) {
    if (this.balance < n) return false;
    store.set("dftc-sequins", this.balance - n);
    Wallet.refresh();
    return true;
  },
  refresh() {
    document.querySelectorAll(".sequins").forEach((el) => (el.textContent = this.balance.toLocaleString("es-ES")));
  },
};

// ------------------------------- Armario -----------------------------------
// Mejoras por reina: +1 por estadística (hasta 5). El coste sube con el nivel.
const Wardrobe = {
  all() {
    return store.get("dftc-upgrades", {});
  },
  of(id) {
    return this.all()[id] || {};
  },
  statsOf(q) {
    const up = this.of(q.id);
    const s = {};
    Object.keys(q.stats).forEach((k) => (s[k] = Math.min(5, q.stats[k] + (up[k] || 0))));
    return s;
  },
  cost(q, k) {
    return 120 + this.statsOf(q)[k] * 80;
  },
  canUpgrade(q, k) {
    return this.statsOf(q)[k] < 5;
  },
  upgrade(q, k) {
    if (!this.canUpgrade(q, k)) return false;
    if (!Wallet.spend(this.cost(q, k))) return false;
    const all = this.all();
    all[q.id] = { ...(all[q.id] || {}), [k]: ((all[q.id] || {})[k] || 0) + 1 };
    store.set("dftc-upgrades", all);
    Achievements.unlock("armario");
    if (this.statsOf(q)[k] >= 5) Achievements.unlock("stat5");
    return true;
  },
  // Copia de la reina con las mejoras aplicadas (para jugar)
  boosted(q) {
    return { ...q, stats: this.statsOf(q) };
  },
};

// -------------------------------- Logros -----------------------------------
const LOGROS = [
  { id: "debut", icon: "🎬", name: "Debut", desc: "Juega tu primera partida", reward: 50 },
  { id: "corona-arcade", icon: "👠", name: "Reina del arcade", desc: "Gana una temporada en arcade", reward: 200 },
  { id: "corona-historia", icon: "👑", name: "Condragulations", desc: "Corónate en el modo historia", reward: 400 },
  { id: "racha", icon: "🔥", name: "Imparable", desc: "Gana 3 retos seguidos en una temporada", reward: 250 },
  { id: "sin-bottom", icon: "🛡️", name: "Intocable", desc: "Llega a la final sin pisar el bottom", reward: 300 },
  { id: "superviviente", icon: "💃", name: "Asesina del lip sync", desc: "Gana 3 lip syncs en una misma temporada", reward: 300 },
  { id: "perfecta", icon: "💎", name: "Perfección", desc: "Saca 95 o más en un reto", reward: 150 },
  { id: "combo", icon: "⚡", name: "Combo loco", desc: "Consigue un combo x20 en arcade", reward: 150 },
  { id: "aliadas", icon: "💞", name: "Hermandad", desc: "Ten 3 aliadas a la vez", reward: 150 },
  { id: "enemiga", icon: "🗡️", name: "Villana de la temporada", desc: "Gánate una enemiga declarada", reward: 100 },
  { id: "armario", icon: "🧵", name: "De compras", desc: "Mejora una estadística en el armario", reward: 50 },
  { id: "stat5", icon: "🌟", name: "Al máximo", desc: "Sube una estadística a 5", reward: 150 },
  { id: "doble-shantay", icon: "🍀", name: "Salvada por la campana", desc: "Vive un doble shantay", reward: 100 },
  { id: "miss-simpatia", icon: "💐", name: "Miss Simpatía", desc: "Gana Miss Simpatía en el reencuentro", reward: 250 },
  { id: "espana", icon: "🇪🇸", name: "Leyenda de España", desc: "Corónate en todas las temporadas de España en historia", reward: 1000 },
];
const Achievements = {
  get done() {
    return store.get("dftc-achievements", {});
  },
  has(id) {
    return !!this.done[id];
  },
  unlock(id) {
    const l = LOGROS.find((x) => x.id === id);
    if (!l || this.has(id)) return;
    store.set("dftc-achievements", { ...this.done, [id]: new Date().toISOString() });
    Wallet.add(l.reward);
    Toast.show(`${l.icon} Logro: ${l.name}`, `+${l.reward} lentejuelas`);
    Music.sfx("achievement");
  },
};

// -------------------------------- Avisos -----------------------------------
const Toast = {
  show(title, sub = "") {
    let box = document.querySelector("#toasts");
    if (!box) {
      box = document.createElement("div");
      box.id = "toasts";
      document.body.append(box);
    }
    const t = document.createElement("div");
    t.className = "toast";
    t.innerHTML = `<b></b><span></span>`;
    t.querySelector("b").textContent = title;
    t.querySelector("span").textContent = sub;
    box.append(t);
    setTimeout(() => t.classList.add("out"), 3200);
    setTimeout(() => t.remove(), 3700);
  },
};

// ------------------------------- Confeti -----------------------------------
const Confetti = {
  burst(ms = 4000) {
    const cv = document.createElement("canvas");
    cv.className = "confetti";
    cv.width = innerWidth;
    cv.height = innerHeight;
    document.body.append(cv);
    const ctx = cv.getContext("2d");
    const cols = ["#ff4fd8", "#ffd84d", "#4fd8ff", "#9dff4f", "#ffffff", "#b23cff"];
    const ps = Array.from({ length: 220 }, () => ({
      x: Math.random() * cv.width,
      y: -20 - Math.random() * cv.height * 0.6,
      vx: (Math.random() - 0.5) * 3,
      vy: 2 + Math.random() * 4,
      r: Math.random() * Math.PI,
      vr: (Math.random() - 0.5) * 0.3,
      s: 6 + Math.random() * 8,
      c: cols[Math.floor(Math.random() * cols.length)],
    }));
    const t0 = performance.now();
    (function tick(t) {
      ctx.clearRect(0, 0, cv.width, cv.height);
      ps.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.r += p.vr;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.r);
        ctx.fillStyle = p.c;
        ctx.fillRect(-p.s / 2, -p.s / 4, p.s, p.s / 2);
        ctx.restore();
      });
      if (t - t0 < ms) requestAnimationFrame(tick);
      else cv.remove();
    })(t0);
  },
};

// -------------------------------- Telón ------------------------------------
// Cierra el telón, ejecuta fn (cambio de pantalla) y lo vuelve a abrir
const Curtain = {
  run(fn, label = "") {
    let c = document.querySelector("#curtain");
    if (!c) {
      c = document.createElement("div");
      c.id = "curtain";
      c.innerHTML = `<i class="l"></i><i class="r"></i><b></b>`;
      document.body.append(c);
    }
    c.querySelector("b").textContent = label;
    c.classList.add("closed");
    Music.sfx("whoosh");
    setTimeout(() => {
      fn();
      setTimeout(() => c.classList.remove("closed"), label ? 900 : 350);
    }, 650);
  },
};

// ------------------------- Música propia (sintetizada) ---------------------
// Bucles sencillos generados con WebAudio: sin archivos ni derechos de autor.
const Music = (() => {
  let ctx = null, master = null, timer = null, step = 0, nextT = 0, current = null;
  const THEMES = {
    // bpm, progresión de acordes (notas MIDI de la raíz), estilo
    taller: { bpm: 104, chords: [57, 53, 60, 55], bass: true, arp: [0, 7, 12, 7], lead: [12, 14, 16, 19, 16, 14, 12, 7] },
    reto: { bpm: 128, chords: [50, 53, 55, 57], bass: true, arp: [0, 12, 7, 12], lead: [19, 17, 16, 14, 16, 17, 19, 21] },
    tension: { bpm: 90, chords: [52, 52, 53, 51], bass: true, arp: [0, 3, 7, 3], lead: null },
    corona: { bpm: 118, chords: [60, 55, 57, 53], bass: true, arp: [0, 4, 7, 12], lead: [24, 23, 21, 19, 21, 23, 24, 28] },
  };
  const hz = (m) => 440 * Math.pow(2, (m - 69) / 12);
  function ensure() {
    if (!ctx) {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
      master = ctx.createGain();
      master.gain.value = 0.08;
      master.connect(ctx.destination);
    }
    if (ctx.state === "suspended") ctx.resume();
  }
  function note(m, t, dur, type, gain) {
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(hz(m), t);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(gain, t + 0.015);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(master);
    o.start(t);
    o.stop(t + dur + 0.02);
  }
  function kick(t) {
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.frequency.setValueAtTime(140, t);
    o.frequency.exponentialRampToValueAtTime(45, t + 0.12);
    g.gain.setValueAtTime(0.9, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
    o.connect(g).connect(master);
    o.start(t);
    o.stop(t + 0.2);
  }
  function hat(t) {
    const b = ctx.createBuffer(1, 2205, 44100), d = b.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length);
    const s = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
    f.type = "highpass";
    f.frequency.value = 7000;
    g.gain.value = 0.25;
    s.buffer = b;
    s.connect(f).connect(g).connect(master);
    s.start(t);
  }
  function schedule() {
    const th = THEMES[current];
    const sixteenth = 60 / th.bpm / 4;
    while (nextT < ctx.currentTime + 0.2) {
      const bar = Math.floor(step / 16) % th.chords.length, s = step % 16, root = th.chords[bar];
      if (s % 4 === 0) kick(nextT);
      if (s % 4 === 2) hat(nextT);
      if (th.bass && s % 4 === 0) note(root - 12, nextT, sixteenth * 3, "triangle", 0.5);
      if (s % 2 === 0) note(root + th.arp[(s / 2) % th.arp.length], nextT, sixteenth * 1.6, "square", 0.12);
      if (th.lead && s % 4 === 0 && bar % 2 === 1) note(root + th.lead[(s / 4 + bar * 4) % th.lead.length], nextT, sixteenth * 3.5, "sawtooth", 0.07);
      nextT += sixteenth;
      step++;
    }
  }
  return {
    play(name) {
      if (Sound.muted || !THEMES[name]) return this.stop();
      if (current === name && timer) return;
      try {
        ensure();
        this.stop();
        current = name;
        step = 0;
        nextT = ctx.currentTime + 0.05;
        timer = setInterval(schedule, 50);
      } catch {
        /* WebAudio no disponible */
      }
    },
    stop() {
      clearInterval(timer);
      timer = null;
      current = null;
    },
    sfx(kind) {
      if (Sound.muted) return;
      try {
        ensure();
        const t = ctx.currentTime;
        if (kind === "achievement") [72, 76, 79, 84].forEach((m, i) => note(m, t + i * 0.08, 0.25, "square", 0.25));
        if (kind === "whoosh") {
          const o = ctx.createOscillator(), g = ctx.createGain();
          o.type = "sawtooth";
          o.frequency.setValueAtTime(900, t);
          o.frequency.exponentialRampToValueAtTime(120, t + 0.5);
          g.gain.setValueAtTime(0.12, t);
          g.gain.exponentialRampToValueAtTime(0.001, t + 0.5);
          o.connect(g).connect(master);
          o.start(t);
          o.stop(t + 0.55);
        }
        if (kind === "coin") [88, 93].forEach((m, i) => note(m, t + i * 0.07, 0.15, "square", 0.2));
      } catch {
        /* nada */
      }
    },
  };
})();
