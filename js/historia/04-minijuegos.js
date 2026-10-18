  // ------------------------- Minijuego: pasarela ---------------------------
  function runPasarela(el, done, POSES = 8, label = "") {
    el.innerHTML = `
      <div class="mg pasarela">
        <p class="mg-info">${label ? `${esc(label)} · ` : ""}Pose <b id="pz-n">1</b>/${POSES} · <span id="pz-msg">¡Prepárate!</span></p>
        <img class="mg-queen" id="pz-queen" src="${sprite(S.queen)}" alt="">
        <div class="pz-track"><div class="pz-zone" id="pz-zone"></div><div class="pz-cursor" id="pz-cursor"></div></div>
        <button class="btn btn-primary big" id="pz-btn">¡POSE!</button>
      </div>`;
    const W = 900, zone = $("#pz-zone"), cursor = $("#pz-cursor");
    let pose = 0, total = 0, x = 0, dir = 1, speed = 520, zw = 150, zx = 0, raf = 0, last = performance.now(), locked = false;
    function newZone() {
      zw = 150 - pose * 11;
      zx = rnd(40, W - zw - 40);
      zone.style.left = zx + "px";
      zone.style.width = zw + "px";
      speed = 520 + pose * 70;
    }
    function tick(t) {
      const dt = Math.min(0.05, (t - last) / 1000);
      last = t;
      if (!locked) {
        x += dir * speed * dt;
        if (x < 0) (x = 0), (dir = 1);
        if (x > W) (x = W), (dir = -1);
        cursor.style.left = x + "px";
      }
      raf = requestAnimationFrame(tick);
    }
    function hit() {
      if (locked) return;
      locked = true;
      const center = zx + zw / 2;
      const d = Math.abs(x - center);
      let pts = 0, msg = "Fallo...";
      if (x >= zx && x <= zx + zw) {
        pts = Math.round(100 - (d / (zw / 2)) * 40);
        msg = pts > 90 ? "¡FIERCE! ✨" : pts > 75 ? "¡Bien!" : "Justito";
        Sound.powerup && Sound.powerup();
        const q = $("#pz-queen");
        q.classList.remove("flash");
        void q.offsetWidth;
        q.classList.add("flash");
      } else Sound.impact();
      total += pts;
      $("#pz-msg").textContent = msg;
      pose++;
      setTimeout(() => {
        if (pose >= POSES) return end();
        $("#pz-n").textContent = pose + 1;
        newZone();
        locked = false;
      }, 550);
    }
    const onKey = (e) => {
      if (e.code === "Space" || e.code === "Enter") {
        e.preventDefault();
        hit();
      }
    };
    function end() {
      stop();
      done(total / POSES);
    }
    function stop() {
      cancelAnimationFrame(raf);
      docOff("keydown", onKey);
    }
    $("#pz-btn").addEventListener("click", hit);
    docOn("keydown", onKey);
    cleanup = stop;
    newZone();
    raf = requestAnimationFrame(tick);
  }

  // ------------------------- Minijuego: coreografía ------------------------
  function runBaile(el, done) {
    const DIRS = ["left", "up", "down", "right"];
    const ICON = { left: "◀", up: "▲", down: "▼", right: "▶" };
    const KEYS = { ArrowLeft: "left", ArrowUp: "up", ArrowDown: "down", ArrowRight: "right", KeyA: "left", KeyW: "up", KeyS: "down", KeyD: "right" };
    const LENS = [3, 4, 5, 6, 7];
    el.innerHTML = `
      <div class="mg baile">
        <p class="mg-info">Ronda <b id="bl-n">1</b>/${LENS.length} · <span id="bl-msg">Mira bien...</span></p>
        <div class="bl-pads">${DIRS.map((d) => `<button class="bl-pad" data-d="${d}">${ICON[d]}</button>`).join("")}</div>
        <div class="bl-steps" id="bl-steps"></div>
        <img class="mg-queen" id="bl-queen" src="${sprite(S.queen)}" alt="">
      </div>`;
    const pads = Object.fromEntries([...el.querySelectorAll(".bl-pad")].map((b) => [b.dataset.d, b]));
    let round = 0, seq = [], pos = 0, listening = false, correct = 0, totalSteps = LENS.reduce((a, b) => a + b, 0);
    const timers = [];
    const later = (fn, ms) => timers.push(setTimeout(fn, ms));
    function light(d, ms = 380) {
      pads[d].classList.add("on");
      Sound.countdown(false);
      later(() => pads[d].classList.remove("on"), ms);
    }
    function play() {
      listening = false;
      pos = 0;
      seq = Array.from({ length: LENS[round] }, () => DIRS[Math.floor(Math.random() * 4)]);
      $("#bl-n").textContent = round + 1;
      $("#bl-msg").textContent = "Mira bien...";
      $("#bl-steps").innerHTML = seq.map(() => `<i></i>`).join("");
      const gap = Math.max(420, 640 - round * 50);
      seq.forEach((d, i) => later(() => light(d, gap * 0.7), 600 + i * gap));
      later(() => {
        listening = true;
        $("#bl-msg").textContent = "¡Tu turno!";
      }, 600 + seq.length * gap);
    }
    function input(d) {
      if (!listening) return;
      light(d, 200);
      const steps = $("#bl-steps").children;
      if (d === seq[pos]) {
        steps[pos].className = "ok";
        correct++;
        const bq = $("#bl-queen");
        bq.classList.remove("bounce");
        void bq.offsetWidth;
        bq.classList.add("bounce");
        pos++;
        if (pos >= seq.length) {
          listening = false;
          $("#bl-msg").textContent = "¡Perfecto! 💃";
          later(next, 800);
        }
      } else {
        steps[pos].className = "ko";
        listening = false;
        Sound.impact();
        $("#bl-msg").textContent = "¡Te has perdido!";
        later(next, 900);
      }
    }
    function next() {
      round++;
      if (round >= LENS.length) {
        stop();
        return done((correct / totalSteps) * 100);
      }
      play();
    }
    const onKey = (e) => {
      const d = KEYS[e.code];
      if (d) {
        e.preventDefault();
        if (!e.repeat) input(d);
      }
    };
    function stop() {
      timers.forEach(clearTimeout);
      docOff("keydown", onKey);
    }
    Object.entries(pads).forEach(([d, b]) => b.addEventListener("click", () => input(d)));
    docOn("keydown", onKey);
    cleanup = stop;
    play();
  }

  // ------------------ Minijuego: Snatch Game (con personaje) ----------------
  function runSnatchGame(el, done) {
    const N = 6;
    el.innerHTML = `
      <div class="mg snatch">
        <p class="mg-info">🎭 Elige tu personaje para el Snatch Game</p>
        <div class="sg-chars">${shuffle(SNATCH_PERSONAJES).slice(0, 4)
          .map((c) => `<button class="btn btn-ghost role sg-char" data-id="${c.id}"><b>${c.icon} ${esc(c.name)}</b><small>Tono ${esc(c.tono)}</small></button>`)
          .join("")}</div>
      </div>`;
    el.querySelectorAll(".sg-char").forEach((b) => b.addEventListener("click", () => play(SNATCH_PERSONAJES.find((c) => c.id === b.dataset.id))));
    function play(me) {
      const others = SNATCH_PERSONAJES.filter((c) => c !== me);
      const mine = shuffle(me.frases);
      const qs = shuffle(SNATCH_PREGUNTAS).slice(0, N);
      let i = 0, total = 0, streak = 0, t0 = 0, raf = 0, answered = false, opts = [], laugh = 0;
      const TIME = 8;
      el.innerHTML = `
        <div class="mg snatch">
          <p class="mg-info">${me.icon} Eres <b>${esc(me.name)}</b> · Pregunta <b id="sg-n">1</b>/${N} · Racha <b id="sg-st">0</b></p>
          <div class="sg-host"><span>🎤 Supremme pregunta</span><p id="sg-q"></p></div>
          <div class="sg-bar"><div id="sg-time"></div></div>
          <div class="sg-opts" id="sg-opts"></div>
          <div class="sg-laugh"><span>😂 Risas del público</span><div><i id="sg-lg"></i></div></div>
          <p class="mg-info" id="sg-msg">Responde como ${esc(me.name)}: ¡que se note el personaje!</p>
        </div>`;
      function ask() {
        answered = false;
        const other = pick1(others);
        opts = shuffle([
          { t: mine[i % mine.length], v: "in", },
          { t: pick1(other.frases), v: "out", from: other },
          { t: pick1(SNATCH_PLANAS), v: "flat" },
        ]);
        $("#sg-n").textContent = i + 1;
        $("#sg-q").textContent = qs[i];
        $("#sg-opts").innerHTML = opts.map((o, k) => `<button class="btn btn-ghost sg-opt" data-k="${k}"><b>${k + 1}</b> ${esc(o.t)}</button>`).join("");
        el.querySelectorAll(".sg-opt").forEach((b) => b.addEventListener("click", () => choose(+b.dataset.k)));
        t0 = performance.now();
      }
      function choose(k) {
        if (answered) return;
        answered = true;
        const o = opts[k];
        const left = Math.max(0, 1 - (performance.now() - t0) / 1000 / TIME);
        let pts = 0, msg;
        if (!o) { msg = "Te has quedado en blanco. Silencio incómodo... 😶"; streak = 0; }
        else if (o.v === "in") { streak++; pts = 70 + left * 30 + Math.min(20, (streak - 1) * 7); msg = streak >= 3 ? `¡Estás on fire! El plató se cae de risa 🔥 (racha x${streak})` : "¡Carcajada! Eso es puro personaje 😂"; }
        else if (o.v === "out") { streak = 0; pts = 35; msg = `Tiene gracia... pero eso lo diría ${o.from.name}, no tú. 😬`; }
        else { streak = 0; pts = 8; msg = "Uf. Se te ha ido el personaje. Grillos. 🦗"; }
        pts = Math.min(100, pts);
        total += pts;
        laugh = Math.min(100, laugh * 0.5 + pts * 0.7);
        $("#sg-lg").style.width = laugh + "%";
        $("#sg-st").textContent = streak;
        $("#sg-msg").textContent = msg;
        el.querySelectorAll(".sg-opt").forEach((b, j) => b.classList.add(opts[j].v === "in" ? "best" : "dim"));
        pts >= 70 ? Sound.powerup && Sound.powerup() : Sound.impact();
        setTimeout(() => {
          i++;
          if (i >= N) { stop(); return done(Math.min(100, total / N)); }
          ask();
        }, 1400);
      }
      function tick(t) {
        const left = Math.max(0, 1 - (t - t0) / 1000 / TIME);
        const bar = $("#sg-time");
        if (bar && !answered) bar.style.width = left * 100 + "%";
        if (left <= 0 && !answered) choose(-1);
        raf = requestAnimationFrame(tick);
      }
      const onKey = (e) => { const k = { Digit1: 0, Digit2: 1, Digit3: 2, Numpad1: 0, Numpad2: 1, Numpad3: 2 }[e.code]; if (k !== undefined) choose(k); };
      function stop() { cancelAnimationFrame(raf); docOff("keydown", onKey); }
      docOn("keydown", onKey);
      cleanup = stop;
      ask();
      raf = requestAnimationFrame(tick);
    }
  }

  // ------------------------- Minijuego: Snatch Game ------------------------
  const PREGUNTAS = [
    ["¿Cuál es tu secreto de belleza?", ["Dormir ocho horas... repartidas en tres semanas", "Beber mucha agua y usar crema", "No sé, la verdad"]],
    ["¿Qué te llevarías a una isla desierta?", ["Un espejo, para tener con quién hablar de algo interesante", "Protector solar", "Comida, supongo"]],
    ["Cuéntanos algo que nadie sepa de ti", ["Mi peluca tiene más seguidores que yo", "Que me encanta cocinar", "Nada, soy muy normal"]],
    ["¿Cómo te preparas para un lip sync?", ["Rezo, estiro y le pido perdón a mis rodillas", "Ensayo mucho la canción", "Me pongo muy nerviosa"]],
    ["¿Qué harías con un millón de euros?", ["Pestañas. Un millón de euros en pestañas", "Comprarme una casa", "Ahorrarlo"]],
    ["¿Quién es tu mayor rival aquí dentro?", ["El espejo del camerino: siempre me gana en reflejos", "Todas son muy buenas", "No tengo rivales"]],
    ["Describe tu estilo en tres palabras", ["Caro, brillante y sin devolución", "Elegante y divertido", "Normal, supongo"]],
    ["¿Qué le dirías a tu yo de hace diez años?", ["Guapa, invierte en lentejuelas", "Que siga sus sueños", "Nada en especial"]],
    ["¿Cuál es tu plato favorito?", ["El de las joyas, cariño, el de la cena ya si eso", "La tortilla de patatas", "No tengo"]],
    ["¿Qué opinas del gimnasio?", ["Lo visito cada año, para ver si sigue ahí", "Voy tres veces por semana", "Está bien"]],
  ];
  function runSnatch(el, done, bank = PREGUNTAS, host = "🎤 La presentadora", label = "Pregunta", N = 5) {
    const TIME = 9;
    const qs = shuffle(bank).slice(0, N);
    let i = 0, total = 0, t0 = 0, raf = 0, answered = false, opts = [];
    el.innerHTML = `
      <div class="mg snatch">
        <p class="mg-info">${label} <b id="sg-n">1</b>/${N}</p>
        <div class="sg-host"><span>${host}</span><p id="sg-q"></p></div>
        <div class="sg-bar"><div id="sg-time"></div></div>
        <div class="sg-opts" id="sg-opts"></div>
        <p class="mg-info" id="sg-msg"></p>
      </div>`;
    function ask() {
      answered = false;
      const [q, [best, mid, flat]] = qs[i];
      opts = shuffle([[best, 100, "¡Carcajada general! 😂"], [mid, 55, "Risas tímidas..."], [flat, 15, "Silencio en el plató 😬"]]);
      $("#sg-n").textContent = i + 1;
      $("#sg-q").textContent = q;
      $("#sg-msg").textContent = "";
      $("#sg-opts").innerHTML = opts.map((o, k) => `<button class="btn btn-ghost sg-opt" data-k="${k}"><b>${k + 1}</b> ${esc(o[0])}</button>`).join("");
      el.querySelectorAll(".sg-opt").forEach((b) => b.addEventListener("click", () => choose(+b.dataset.k)));
      t0 = performance.now();
    }
    function choose(k) {
      if (answered) return;
      answered = true;
      const o = opts[k];
      const pts = o ? o[1] : 0;
      total += pts;
      $("#sg-msg").textContent = o ? o[2] : "¡Se te acabó el tiempo! 😶";
      el.querySelectorAll(".sg-opt").forEach((b, j) => b.classList.add(opts[j][1] === 100 ? "best" : "dim"));
      pts === 100 ? Sound.powerup && Sound.powerup() : Sound.impact();
      setTimeout(() => {
        i++;
        if (i >= N) {
          stop();
          return done(total / N);
        }
        ask();
      }, 1300);
    }
    function tick(t) {
      const left = Math.max(0, 1 - (t - t0) / 1000 / TIME);
      const bar = $("#sg-time");
      if (bar && !answered) bar.style.width = left * 100 + "%";
      if (left <= 0 && !answered) choose(-1);
      raf = requestAnimationFrame(tick);
    }
    const onKey = (e) => {
      const k = { Digit1: 0, Digit2: 1, Digit3: 2, Numpad1: 0, Numpad2: 1, Numpad3: 2 }[e.code];
      if (k !== undefined) choose(k);
    };
    function stop() {
      cancelAnimationFrame(raf);
      docOff("keydown", onKey);
    }
    docOn("keydown", onKey);
    cleanup = stop;
    ask();
    raf = requestAnimationFrame(tick);
  }

  const LECTURAS = [
    ["Lee a la compañera que siempre llega tarde", ["Cariño, tú no llegas tarde: llegas en otro huso horario", "Siempre llegas tarde, eh", "Llegas tarde"]],
    ["Lee a la reina de la peluca más grande", ["Tu peluca tiene código postal propio", "Qué peluca tan grande", "Bonita peluca"]],
    ["Lee a la que se maquilla en cinco minutos", ["Se nota, reina, se nota. Pero con mucha seguridad", "Te maquillas rápido", "Vas guapa"]],
    ["Lee a la que cose fatal", ["Tu vestido tiene más grapas que costuras", "No sabes coser mucho", "Bueno, coses regular"]],
    ["Lee a la que siempre habla de sí misma", ["Tu espejo ya pidió vacaciones", "Hablas mucho de ti", "Eres muy tú"]],
    ["Lee a la más pija del grupo", ["Su bolso tiene más estudios que yo", "Eres un poco pija", "Te gusta lo caro"]],
    ["Lee a la que siempre llora en el taller", ["Trae el rímel resistente, que hoy toca episodio", "Lloras mucho", "Eres sensible"]],
    ["Lee a la que baila como un pato", ["Tu coreografía tiene fans en el estanque del Retiro", "No bailas muy bien", "Bailas distinto"]],
    ["Lee a la que se cree la favorita", ["Ya ha ensayado el discurso de la corona... de la de Burger", "Te crees favorita", "Tienes confianza"]],
  ];

  // ------------------------- Minijuego: diseño -----------------------------
  function runDiseno(el, done, theme = null, DUR = 25) {
    const W = 1000, H = 560;
    el.innerHTML = `
      <div class="mg diseno">
        <p class="mg-info">Tiempo <b id="ds-t">${DUR}</b> s · Materiales <b id="ds-p">0</b></p>
        <canvas id="ds-c" width="${W}" height="${H}"></canvas>
        <div class="ds-touch"><button class="btn btn-ghost" id="ds-l">◀</button><button class="btn btn-ghost" id="ds-r">▶</button></div>
      </div>`;
    const cv = $("#ds-c"), ctx = cv.getContext("2d");
    const img = new Image();
    img.src = sprite(S.queen);
    const GOOD = (theme && theme.good) || [["✨", 10], ["🧵", 10], ["🪶", 12], ["💎", 18], ["🎀", 10]];
    const BAD = (theme && theme.bad) || [["✂️", -15], ["🩹", -10]];
    let x = W / 2, vx = 0, keys = { l: false, r: false }, items = [], t = 0, spawn = 0, pts = 0, raf = 0, last = performance.now(), mouseX = null;
    function tick(now) {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      t += dt;
      const dir = (keys.r ? 1 : 0) - (keys.l ? 1 : 0);
      if (dir) x += dir * 620 * dt;
      else if (mouseX !== null) x += (mouseX - x) * Math.min(1, dt * 12);
      x = Math.max(60, Math.min(W - 60, x));
      spawn -= dt;
      if (spawn <= 0) {
        spawn = Math.max(0.28, 0.7 - t * 0.015);
        const bad = Math.random() < 0.25 + t * 0.006;
        const [e, v] = bad ? BAD[Math.floor(Math.random() * BAD.length)] : GOOD[Math.floor(Math.random() * GOOD.length)];
        items.push({ x: rnd(40, W - 40), y: -30, vy: rnd(200, 300) + t * 9, e, v });
      }
      ctx.clearRect(0, 0, W, H);
      ctx.font = "40px serif";
      ctx.textAlign = "center";
      items = items.filter((it) => {
        it.y += it.vy * dt;
        if (it.y > H - 150 && it.y < H - 40 && Math.abs(it.x - x) < 70) {
          pts = Math.max(0, pts + it.v);
          it.v > 0 ? Sound.powerup && Sound.powerup() : Sound.impact();
          return false;
        }
        ctx.fillText(it.e, it.x, it.y);
        return it.y < H + 40;
      });
      const h = 150, w = img.naturalWidth ? (img.naturalWidth / img.naturalHeight) * h : 70;
      if (img.complete) ctx.drawImage(img, x - w / 2, H - h - 6, w, h);
      $("#ds-t").textContent = Math.max(0, Math.ceil(DUR - t));
      $("#ds-p").textContent = pts;
      if (t >= DUR) {
        stop();
        return done(Math.min(100, (pts / ((300 * DUR) / 25)) * 100));
      }
      raf = requestAnimationFrame(tick);
    }
    const KEYS = { ArrowLeft: "l", KeyA: "l", ArrowRight: "r", KeyD: "r" };
    const kd = (e) => { const k = KEYS[e.code]; if (k) { e.preventDefault(); keys[k] = true; mouseX = null; } };
    const ku = (e) => { const k = KEYS[e.code]; if (k) keys[k] = false; };
    const mm = (e) => { const r = cv.getBoundingClientRect(); mouseX = ((e.clientX - r.left) / r.width) * W; };
    cv.addEventListener("pointermove", mm);
    const hold = (id, k) => {
      const b = $(id);
      b.addEventListener("pointerdown", () => (keys[k] = true));
      ["pointerup", "pointerleave", "pointercancel"].forEach((ev) => b.addEventListener(ev, () => (keys[k] = false)));
    };
    hold("#ds-l", "l");
    hold("#ds-r", "r");
    function stop() {
      cancelAnimationFrame(raf);
      docOff("keydown", kd);
      docOff("keyup", ku);
    }
    docOn("keydown", kd);
    docOn("keyup", ku);
    cleanup = stop;
    raf = requestAnimationFrame(tick);
  }

  // ------------------------- Minijuego: Rusical ----------------------------
  function runRusical(el, done) {
    const W = 760, H = 560, LANES = 4, LINE = H - 80, SPEED = 380;
    const COLORS = ["#ff4fd8", "#ffd84d", "#4fd8ff", "#9dff4f"];
    const KEYS = { KeyD: 0, KeyF: 1, KeyJ: 2, KeyK: 3, ArrowLeft: 0, ArrowDown: 1, ArrowUp: 2, ArrowRight: 3 };
    el.innerHTML = `
      <div class="mg rusical">
        <p class="mg-info"><span id="rs-msg">¡Que empiece el número!</span> · Combo <b id="rs-c">0</b></p>
        <canvas id="rs-cv" width="${W}" height="${H}"></canvas>
        <p class="muted">D · F · J · K</p>
      </div>`;
    const cv = $("#rs-cv"), ctx = cv.getContext("2d"), lw = W / LANES;
    // Partitura: ~36 notas a 120 bpm con algún acorde
    const notes = [];
    let tt = 1.5;
    while (tt < 21) {
      const lane = Math.floor(Math.random() * LANES);
      notes.push({ t: tt, lane, hit: null });
      if (Math.random() < 0.15) notes.push({ t: tt, lane: (lane + 2) % LANES, hit: null });
      tt += [0.5, 0.5, 0.25, 0.75, 1][Math.floor(Math.random() * 5)];
    }
    let t0 = performance.now(), raf = 0, combo = 0, score = 0, flash = [0, 0, 0, 0];
    const now = () => (performance.now() - t0) / 1000;
    function press(lane) {
      const t = now();
      flash[lane] = 0.15;
      let best = null;
      notes.forEach((n) => { if (n.lane === lane && n.hit === null && Math.abs(n.t - t) < 0.2 && (!best || Math.abs(n.t - t) < Math.abs(best.t - t))) best = n; });
      if (!best) return;
      const d = Math.abs(best.t - t);
      best.hit = d < 0.08 ? 1 : 0.6;
      score += best.hit;
      combo++;
      $("#rs-msg").textContent = best.hit === 1 ? "¡Perfecto!" : "¡Bien!";
      $("#rs-c").textContent = combo;
      Sound.countdown(false);
    }
    let lastTick = 0;
    function tick() {
      const t = now();
      const dtS = lastTick ? Math.min(0.05, Math.max(0, (t - lastTick) / 1000)) : 1 / 60;
      lastTick = t;
      ctx.clearRect(0, 0, W, H);
      for (let i = 0; i < LANES; i++) {
        ctx.fillStyle = flash[i] > 0 ? "rgba(255,255,255,.12)" : i % 2 ? "rgba(255,255,255,.04)" : "rgba(255,255,255,.07)";
        ctx.fillRect(i * lw, 0, lw, H);
        flash[i] = Math.max(0, flash[i] - dtS);
        ctx.strokeStyle = COLORS[i];
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(i * lw + lw / 2, LINE, 30, 0, Math.PI * 2);
        ctx.stroke();
      }
      notes.forEach((n) => {
        if (n.hit === null && t - n.t > 0.2) {
          n.hit = 0;
          combo = 0;
          $("#rs-c").textContent = 0;
          $("#rs-msg").textContent = "¡Fallo!";
        }
        if (n.hit !== null && n.hit > 0) return;
        const y = LINE - (n.t - t) * SPEED;
        if (y < -40 || y > H + 40) return;
        ctx.fillStyle = COLORS[n.lane];
        ctx.globalAlpha = n.hit === 0 ? 0.3 : 1;
        ctx.beginPath();
        ctx.arc(n.lane * lw + lw / 2, y, 26, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
      });
      if (t > notes[notes.length - 1].t + 1) {
        stop();
        return done((score / notes.length) * 100);
      }
      raf = requestAnimationFrame(tick);
    }
    const kd = (e) => { const l = KEYS[e.code]; if (l !== undefined) { e.preventDefault(); if (!e.repeat) press(l); } };
    cv.addEventListener("pointerdown", (e) => {
      const r = cv.getBoundingClientRect();
      press(Math.min(LANES - 1, Math.floor(((e.clientX - r.left) / r.width) * LANES)));
    });
    function stop() {
      cancelAnimationFrame(raf);
      docOff("keydown", kd);
    }
    docOn("keydown", kd);
    cleanup = stop;
    raf = requestAnimationFrame(tick);
  }

  // ------------------------- Minijuego: maquillaje -------------------------
  function runMaquillaje(el, done) {
    const ZONAS = ["Sombra", "Delineado", "Colorete", "Labios"];
    const PALETA = ["#ff4fd8", "#ffd84d", "#4fd8ff", "#ff3b3b", "#9d4fff", "#1b1b1b", "#ff9a3d", "#3dff9a"];
    const ROUNDS = 4;
    el.innerHTML = `
      <div class="mg maquillaje">
        <p class="mg-info">Look <b id="mq-n">1</b>/${ROUNDS} · <span id="mq-msg"></span></p>
        <div class="mq-chart" id="mq-chart"></div>
        <div class="mq-pal" id="mq-pal"></div>
      </div>`;
    let round = 0, ok = 0, target = [], pick = [], zone = 0, timers = [];
    const later = (f, ms) => timers.push(setTimeout(f, ms));
    function chart(cols, active = -1) {
      $("#mq-chart").innerHTML = ZONAS.map((z, i) => `<div class="mq-z ${i === active ? "act" : ""}"><i style="background:${cols[i] || "transparent"}"></i><span>${z}</span></div>`).join("");
    }
    function play() {
      target = ZONAS.map(() => PALETA[Math.floor(Math.random() * PALETA.length)]);
      pick = [];
      zone = 0;
      $("#mq-n").textContent = round + 1;
      $("#mq-msg").textContent = "Memoriza la carta...";
      $("#mq-pal").innerHTML = "";
      chart(target);
      later(() => {
        $("#mq-msg").textContent = `Elige el color de: ${ZONAS[0]}`;
        chart([], 0);
        $("#mq-pal").innerHTML = PALETA.map((c) => `<button class="mq-c" style="background:${c}" data-c="${c}"></button>`).join("");
        el.querySelectorAll(".mq-c").forEach((b) => b.addEventListener("click", () => choose(b.dataset.c)));
      }, 2600 - round * 350);
    }
    function choose(c) {
      if (zone >= ZONAS.length) return;
      pick.push(c);
      if (c === target[zone]) ok++;
      zone++;
      chart(pick, zone);
      if (zone < ZONAS.length) return ($("#mq-msg").textContent = `Elige el color de: ${ZONAS[zone]}`);
      const good = pick.filter((p, i) => p === target[i]).length;
      $("#mq-msg").textContent = good === 4 ? "¡Idéntico! 💄" : `${good}/4 zonas bien`;
      good === 4 ? Sound.powerup && Sound.powerup() : Sound.impact();
      $("#mq-chart").innerHTML += `<p class="mq-sol">Carta original: ${target.map((c) => `<i style="background:${c}"></i>`).join("")}</p>`;
      later(() => {
        round++;
        if (round >= ROUNDS) {
          stop();
          return done((ok / (ROUNDS * ZONAS.length)) * 100);
        }
        play();
      }, 1500);
    }
    function stop() {
      timers.forEach(clearTimeout);
    }
    cleanup = stop;
    play();
  }

  // ------------------------- Pasarela: estilismo + desfile --------------------
  function runEstilismo(el, cat, done, poses = 3, prefix = "") {
    const SLOTS = ["peluca", "look", "zapatos", "accesorio"], TIME = 30;
    const good = ESTILO_CATS[cat] || ["glam"];
    const fitOf = (it) => (it.t.includes(cat) ? 25 : good.includes(it.s) ? 12 : 2);
    // Tres opciones por pieza: una que encaja, una a medias y otra que no pega
    const opts = SLOTS.map((k) => {
      const all = ESTILO_PIEZAS[k].items;
      const full = shuffle(all.filter((i) => i.t.includes(cat)));
      const half = shuffle(all.filter((i) => !i.t.includes(cat) && good.includes(i.s)));
      const off = shuffle(all.filter((i) => !i.t.includes(cat) && !good.includes(i.s)));
      const pickSet = [full[0] || half[1], half[0] || off[1], off[0]].filter(Boolean);
      while (pickSet.length < 3) pickSet.push(pick1(all.filter((i) => !pickSet.includes(i))));
      return shuffle(pickSet);
    });
    const chosen = [];
    let slot = 0, t0 = performance.now(), iv = 0, over = false;
    el.innerHTML = `
      <div class="mg estilo">
        <p class="mg-info">${esc(prefix)}👠 Estilismo · «${esc(cat)}» · <b id="es-t">${TIME}</b> s</p>
        <div class="es-look" id="es-look">${SLOTS.map((k) => `<span class="es-slot" data-k="${k}"><em>${ESTILO_PIEZAS[k].icon}</em><small>${ESTILO_PIEZAS[k].name}</small></span>`).join("")}</div>
        <h4 id="es-q"></h4>
        <div class="es-opts" id="es-opts"></div>
      </div>`;
    function show() {
      const k = SLOTS[slot];
      $("#es-q").textContent = `Elige ${ESTILO_PIEZAS[k].name.toLowerCase()} (${slot + 1}/4)`;
      $("#es-opts").innerHTML = opts[slot]
        .map((it, i) => `<button class="es-opt" data-i="${i}" style="--c:${it.c}"><i>${ESTILO_PIEZAS[k].icon}</i><b>${i + 1}</b><span>${esc(it.n)}</span><small>${ESTILO_NOMBRES[it.s]}</small></button>`)
        .join("");
      el.querySelectorAll(".es-opt").forEach((b) => b.addEventListener("click", () => choose(+b.dataset.i)));
    }
    function choose(i) {
      if (over) return;
      const it = opts[slot][i];
      if (!it) return;
      chosen.push(it);
      const sl = el.querySelector(`.es-slot[data-k="${SLOTS[slot]}"]`);
      sl.classList.add("on");
      sl.style.setProperty("--c", it.c);
      sl.querySelector("small").textContent = it.n;
      Sound.countdown(false);
      slot++;
      if (slot >= SLOTS.length) return finishLook();
      show();
    }
    function finishLook() {
      over = true;
      clearInterval(iv);
      docOff("keydown", onKey);
      const left = Math.max(0, 1 - (performance.now() - t0) / 1000 / TIME);
      const fit = chosen.reduce((a, it) => a + fitOf(it), 0); // 0..100
      const counts = {};
      chosen.forEach((it) => (counts[it.s] = (counts[it.s] || 0) + 1));
      const same = Math.max(...Object.values(counts));
      const combo = same >= 4 ? 15 : same === 3 ? 10 : same === 2 ? 4 : 0;
      const styling = clamp(fit * 0.8 + combo + left * 10, 0, 100);
      const sorted = chosen.slice().sort((a, b) => fitOf(b) - fitOf(a));
      S.lastLook = { cat, best: sorted[0].n, worst: sorted[sorted.length - 1].n, pieces: chosen.map((x) => x.n) };
      const stars = (v, max) => "★".repeat(Math.round((v / max) * 4)) + "☆".repeat(4 - Math.round((v / max) * 4));
      el.querySelector("#es-q").textContent = "¡Look listo!";
      el.querySelector("#es-opts").innerHTML = `
        <div class="es-score">
          <span>Categoría <b>${stars(fit, 100)}</b></span>
          <span>Combinación <b>${stars(combo, 15)}</b></span>
          <span>Rapidez <b>${stars(left, 1)}</b></span>
        </div>`;
      styling >= 70 ? Sound.powerup && Sound.powerup() : Sound.impact();
      const tm = setTimeout(() => {
        el.innerHTML = "";
        runPasarela(el, (walk) => done(styling * 0.6 + walk * 0.4), poses, `${prefix}«${cat}»: ${chosen.map((x) => x.n).join(" · ")}`);
      }, 1800);
      cleanup = () => clearTimeout(tm);
    }
    const onKey = (e) => { const k = { Digit1: 0, Digit2: 1, Digit3: 2, Numpad1: 0, Numpad2: 1, Numpad3: 2 }[e.code]; if (k !== undefined) choose(k); };
    docOn("keydown", onKey);
    iv = setInterval(() => {
      const left = Math.max(0, TIME - (performance.now() - t0) / 1000);
      const tEl = $("#es-t");
      if (tEl) tEl.textContent = Math.ceil(left);
      // Se acaba el tiempo: lo que falte se elige al azar
      if (left <= 0 && !over) while (!over) choose(Math.floor(Math.random() * 3));
    }, 200);
    cleanup = () => { clearInterval(iv); docOff("keydown", onKey); };
    show();
  }

  // ------------------------- Minijuego: el Ball -----------------------------
  function runBall(el, done) {
    const cats = shuffle(CATEGORIAS).slice(0, 3), scores = [];
    let timer = 0;
    function next() {
      const k = scores.length;
      if (k >= 3) return done(scores[0] * 0.3 + scores[1] * 0.3 + scores[2] * 0.4);
      const made = k === 2;
      el.innerHTML = `<div class="mg"><p class="eyebrow">Look ${k + 1} de 3 · ${made ? "hecho en el taller" : "traído de casa"}</p><h3 class="ball-cat">«${esc(cats[k])}»</h3>${made ? `<p class="muted">Primero cóselo con lo que caiga del cielo... y luego a desfilarlo.</p>` : ""}</div>`;
      cleanup = () => clearTimeout(timer);
      timer = setTimeout(() => {
        if (!made) return runEstilismo(el, cats[k], (sc) => { scores.push(sc); next(); }, 2, `Look ${k + 1}/3 · `);
        runDiseno(el, (build) => {
          el.innerHTML = "";
          runPasarela(el, (walk) => { scores.push(build * 0.6 + walk * 0.4); next(); }, 3, `Look 3/3 · ${cats[k]} (hecho aquí)`);
        }, MATERIALES_RAROS, 15);
      }, 1300);
    }
    next();
  }

  // ------------------------- Minijuego: guion (actuación) -------------------
  function runGuion(el, done) {
    ensureTeam();
    const N = 6, TIME = 7;
    const lines = shuffle(GUION).slice(0, N);
    let i = 0, total = 0, t0 = 0, raf = 0, timer = 0, answered = true, opts = [];
    el.innerHTML = `
      <div class="mg snatch guion">
        <p class="mg-info">🎬 Toma <b id="gn-n">1</b>/${N} · <span id="gn-msg">Memoriza tu frase...</span></p>
        <div class="sg-host"><span>🎞️ Guion</span><p id="gn-line"></p></div>
        <div class="sg-bar"><div id="sg-time"></div></div>
        <div class="sg-opts" id="sg-opts"></div>
      </div>`;
    function show() {
      const [txt, word] = lines[i];
      answered = true;
      $("#gn-n").textContent = i + 1;
      $("#gn-msg").textContent = "Memoriza tu frase...";
      $("#gn-line").innerHTML = esc(txt).replace("___", `<mark>${esc(word)}</mark>`);
      $("#sg-opts").innerHTML = "";
      $("#sg-time").style.width = "100%";
      timer = setTimeout(ask, 2300);
    }
    function ask() {
      const [txt, word, wrong] = lines[i];
      $("#gn-msg").textContent = "¡Acción! ¿Qué palabra era?";
      $("#gn-line").innerHTML = esc(txt).replace("___", "<mark>______</mark>");
      opts = shuffle([{ t: word, ok: true }, ...wrong.map((t) => ({ t, ok: false }))]);
      $("#sg-opts").innerHTML = opts.map((o, k) => `<button class="btn btn-ghost sg-opt" data-k="${k}"><b>${k + 1}</b> ${esc(o.t)}</button>`).join("");
      el.querySelectorAll(".sg-opt").forEach((b) => b.addEventListener("click", () => choose(+b.dataset.k)));
      answered = false;
      t0 = performance.now();
    }
    function choose(k) {
      if (answered) return;
      answered = true;
      const o = opts[k];
      const left = Math.max(0, 1 - (performance.now() - t0) / 1000 / TIME);
      const pts = !o ? 0 : o.ok ? 70 + left * 30 : 12;
      total += pts;
      $("#gn-msg").textContent = !o ? "¡Corten! Te has quedado en blanco 😶" : o.ok ? "¡Corten! Toma buena 🎬" : "¡Corten! Esa no era tu frase 😬";
      el.querySelectorAll(".sg-opt").forEach((b, j) => b.classList.add(opts[j].ok ? "best" : "dim"));
      o && o.ok ? Sound.powerup && Sound.powerup() : Sound.impact();
      timer = setTimeout(() => {
        i++;
        if (i >= N) { stop(); return done(total / N); }
        show();
      }, 1200);
    }
    function tick(t) {
      const bar = $("#sg-time");
      if (!answered) {
        const left = Math.max(0, 1 - (t - t0) / 1000 / TIME);
        if (bar) bar.style.width = left * 100 + "%";
        if (left <= 0) choose(-1);
      }
      raf = requestAnimationFrame(tick);
    }
    const onKey = (e) => { const k = { Digit1: 0, Digit2: 1, Digit3: 2, Numpad1: 0, Numpad2: 1, Numpad3: 2 }[e.code]; if (k !== undefined) choose(k); };
    function stop() { cancelAnimationFrame(raf); clearTimeout(timer); docOff("keydown", onKey); }
    docOn("keydown", onKey);
    cleanup = stop;
    show();
    raf = requestAnimationFrame(tick);
  }

  // ------------------------- Minijuego: makeover (parejas) ------------------
  function runMemoria(el, done, ICONS = ["👠", "💄", "👛", "💍", "🪭", "🎀"], DUR = 45, hint = "Empareja los accesorios") {
    const cards = shuffle([...ICONS, ...ICONS]);
    let open = [], found = 0, misses = 0, t0 = performance.now(), iv = 0, busy = false, over = false;
    el.innerHTML = `
      <div class="mg memoria">
        <p class="mg-info">Tiempo <b id="mm-t">${DUR}</b> s · Parejas <b id="mm-p">0</b>/${ICONS.length} · <span id="mm-msg">${esc(hint)}</span></p>
        <div class="mem-grid">${cards.map((c, k) => `<button class="mem-card" data-k="${k}"><span>${c}</span></button>`).join("")}</div>
      </div>`;
    const btns = [...el.querySelectorAll(".mem-card")];
    btns.forEach((b) => b.addEventListener("click", () => flip(+b.dataset.k)));
    function flip(k) {
      const b = btns[k];
      if (busy || over || b.classList.contains("open") || b.classList.contains("done")) return;
      b.classList.add("open");
      open.push(k);
      if (open.length < 2) return;
      const [a, c] = open;
      open = [];
      if (cards[a] === cards[c]) {
        btns[a].classList.add("done");
        btns[c].classList.add("done");
        found++;
        $("#mm-p").textContent = found;
        $("#mm-msg").textContent = "¡A juego! 💖";
        Sound.powerup && Sound.powerup();
        if (found === ICONS.length) end();
      } else {
        misses++;
        busy = true;
        $("#mm-msg").textContent = "No pegan...";
        setTimeout(() => { btns[a].classList.remove("open"); btns[c].classList.remove("open"); busy = false; }, 650);
      }
    }
    function end() {
      if (over) return;
      over = true;
      stop();
      const left = Math.max(0, 1 - (performance.now() - t0) / 1000 / DUR);
      done(clamp((found / ICONS.length) * 75 + (found === ICONS.length ? 25 * left + 10 : 0) - Math.max(0, misses - 5) * 2, 0, 100));
    }
    iv = setInterval(() => {
      const left = Math.max(0, DUR - (performance.now() - t0) / 1000);
      const t = $("#mm-t");
      if (t) t.textContent = Math.ceil(left);
      if (left <= 0) end();
    }, 200);
    function stop() { clearInterval(iv); }
    cleanup = stop;
  }

  // ------------------------- Minijuego: sesión de fotos --------------------
  function runFotos(el, done, BADICON = "📸", DUR = 20, BADMSG = "¡Era el paparazzi! 😱") {
    el.innerHTML = `
      <div class="mg fotos">
        <p class="mg-info">Tiempo <b id="ft-t">${DUR}</b> s · Fotos <b id="ft-p">0</b> · <span id="ft-msg">¡Atenta al flash!</span></p>
        <div class="ft-grid">${Array.from({ length: 9 }, (_, k) => `<button class="ft-cell" data-k="${k}"></button>`).join("")}</div>
      </div>`;
    const cells = [...el.querySelectorAll(".ft-cell")];
    let t0 = performance.now(), spawnT = 0, shown = 0, hits = 0, bad = 0, timers = [], over = false;
    function spawn() {
      if (over) return;
      const t = (performance.now() - t0) / 1000;
      if (t >= DUR) return end();
      const free = cells.filter((c) => !c.classList.contains("on"));
      const c = pick1(free);
      const pap = Math.random() < 0.22;
      if (!pap) shown++;
      c.className = `ft-cell on ${pap ? "pap" : "me"}`;
      c.innerHTML = pap ? BADICON : `<i style="background-image:url('${photo(S.queen)}')"></i>`;
      const life = Math.max(620, 1050 - t * 20);
      timers.push(setTimeout(() => { if (c.classList.contains("on")) { c.className = "ft-cell"; c.innerHTML = ""; } }, life));
      timers.push(setTimeout(spawn, Math.max(420, 820 - t * 16)));
    }
    cells.forEach((c) => c.addEventListener("click", () => {
      if (!c.classList.contains("on")) return;
      if (c.classList.contains("me")) { hits++; $("#ft-msg").textContent = "¡Click! Preciosa 📷"; Sound.powerup && Sound.powerup(); }
      else { bad++; $("#ft-msg").textContent = BADMSG; Sound.impact(); }
      c.className = "ft-cell";
      c.innerHTML = "";
      $("#ft-p").textContent = hits;
    }));
    const iv = setInterval(() => { const t = $("#ft-t"); if (t) t.textContent = Math.max(0, Math.ceil(DUR - (performance.now() - t0) / 1000)); }, 250);
    function end() {
      if (over) return;
      over = true;
      stop();
      done(clamp((hits / Math.max(1, shown)) * 105 - bad * 8, 0, 100));
    }
    function stop() { timers.forEach(clearTimeout); clearInterval(iv); }
    cleanup = stop;
    timers.push(setTimeout(spawn, 700));
  }

  // ------------------------- Minirreto: flash (capitanas) --------------------
  function runMiniFlash(el, title, done) {
    const ROUNDS = 3;
    let round = 0, total = 0, state = "wait", tGo = 0, timer = 0;
    el.innerHTML = `
      <div class="mg mini">
        <p class="eyebrow">Minirreto · ${esc(title)}</p>
        <p class="mg-info">Ronda <b id="mn-n">1</b>/${ROUNDS} · <span id="mn-msg">Pulsa en cuanto salte el flash (no antes)</span></p>
        <button class="mini-btn" id="mini-btn">Espera...</button>
      </div>`;
    const btn = $("#mini-btn");
    function arm() {
      state = "wait";
      btn.className = "mini-btn";
      btn.textContent = "Espera...";
      $("#mn-n").textContent = round + 1;
      timer = setTimeout(() => {
        state = "go";
        btn.className = "mini-btn go";
        btn.textContent = "¡FLASH! 📸";
        tGo = performance.now();
      }, 900 + Math.random() * 1500);
    }
    function press() {
      if (state === "done") return;
      let pts;
      if (state === "wait") {
        clearTimeout(timer);
        pts = 0;
        $("#mn-msg").textContent = "¡Te has adelantado!";
        Sound.impact();
      } else {
        const ms = performance.now() - tGo;
        pts = clamp(100 - (ms - 200) / 5, 10, 100);
        $("#mn-msg").textContent = `${pts > 85 ? "¡Rapidísima! ⚡" : pts > 55 ? "¡Bien!" : "Un poco lenta..."}`;
        Sound.powerup && Sound.powerup();
      }
      total += pts;
      state = "done";
      btn.className = "mini-btn";
      round++;
      timer = setTimeout(() => (round >= ROUNDS ? (stop(), done(total / ROUNDS)) : arm()), 900);
    }
    const onKey = (e) => { if (e.code === "Space" || e.code === "Enter") { e.preventDefault(); if (!e.repeat) press(); } };
    function stop() { clearTimeout(timer); docOff("keydown", onKey); }
    btn.addEventListener("click", press);
    docOn("keydown", onKey);
    cleanup = stop;
    arm();
  }

  // ===========================================================================
  //  ATRIBUTOS, MOTOR DE DECISIONES, MAXI RETOS, PASARELA Y LIP SYNC
  // ===========================================================================
  const ATTR_NAMES = { comedia: "Comedia", carisma: "Carisma", estilo: "Estilo", performance: "Performance", maquillaje: "Maquillaje" };
  const hashN = (str, k) => {
    let h = 7;
    for (const c of str + k) h = (h * 31 + c.charCodeAt(0)) >>> 0;
    return h % 4;
  };
  // Atributos (1-10): salen de las estadísticas de la reina, con su toque propio
  function baseAttrs(q, st) {
    const f = (v, k) => clamp(Math.round(v * 1.5 + hashN(q.id, k) - 0.5), 2, 10);
    return { comedia: f(st.rate, "c"), carisma: f(st.lives, "k"), estilo: f(st.power, "e"), performance: f(st.speed, "p"), maquillaje: f((st.power + st.rate) / 2, "m") };
  }
  // Ficha de modo historia para la pantalla de elegir reina
  function preview(q) {
    const t = traitsOf(q);
    return { attrs: baseAttrs(q, Wardrobe.statsOf(q)), names: ATTR_NAMES, car: RASGOS.car[t.car], fort: RASGOS.fort[t.fort], titles: Nem.titles(q.id) };
  }
  function attrsOf(q) {
    const up = q === S.queen ? Wardrobe.statsOf(q) : q.stats;
    const st = q === S.queen ? Object.fromEntries(Object.keys(q.stats).map((k) => [k, Math.min(up[k], q.stats[k] + 1)])) : q.stats;
    const a = baseAttrs(q, st);
    if (q === S.queen) Object.entries(S.attrGrowth || {}).forEach(([k, v]) => (a[k] = clamp(a[k] + v, 1, 10)));
    return a;
  }
  const A = (k) => attrsOf(S.queen)[k];
  function check(keys, diff) {
    const v = (keys.reduce((a, k) => a + A(k), 0) / keys.length) * 10;
    const p = clamp(0.5 + (v - diff) / 70, 0.08, 0.95);
    const ok = Math.random() < p;
    return { ok, txt: `🎲 ${keys.map((k) => ATTR_NAMES[k]).join(" + ")} → ${ok ? "✅ te sale" : "❌ no te sale"}` };
  }
  const attrChips = (keys) => keys.map((k) => `<span class="attr-chip">${ATTR_NAMES[k]} <b>${A(k)}</b></span>`).join("");
  function growAttr(k) {
    if (!k) return;
    S.attrGrowth = S.attrGrowth || {};
    if (A(k) >= 10) return;
    S.attrGrowth[k] = (S.attrGrowth[k] || 0) + 1;
    Toast.show(`📈 +1 en ${ATTR_NAMES[k]}`, `Ahora tienes ${A(k)}`);
  }

  // Motor genérico: una secuencia de decisiones con medidores y chequeos
  // cfg: { title, icon, meters: ["focus"|"energy"], init, steps: [(st) => step|null], finish(st, base) }
  // step: { q (html), sub, opts: [{ t, d, tag, go(st) => { pts, w, msg } }] }
  function runSteps(el, cfg, done) {
    const st = { total: 0, wsum: 0, focus: 50, energy: 100, log: [], ...(cfg.init || {}) };
    let i = 0, busy = false, timer = 0, cur = null;
    // Todo dentro de su propio contenedor: si otra pantalla ya ha sustituido a esta, este minijuego se apaga solo
    const $l = (s) => el.querySelector(s);
    const gone = () => !document.body.contains(el) || !$l("#dc-o");
    el.innerHTML = `
      <div class="mg dc">
        <p class="mg-info">${cfg.icon || "🎬"} ${esc(cfg.title)}</p>
        <div class="dc-top" id="dc-top"></div>
        <div class="dc-meters" id="dc-m"></div>
        <div class="dc-scene" id="dc-s"></div>
        <div class="dc-opts" id="dc-o"></div>
        <p class="dc-msg" id="dc-msg"></p>
      </div>`;
    const meterHTML = () =>
      (cfg.meters || [])
        .map((m) => {
          const v = clamp(Math.round(st[m]), 0, 100);
          const lab = m === "focus" ? "🔦 Foco" : m === "energy" ? "⚡ Energía" : m;
          const warn = m === "focus" ? (v > 80 ? "hot" : v < 30 ? "cold" : "") : v < 25 ? "cold" : "";
          return `<div class="dc-meter ${warn}"><span>${lab}</span><div><i style="width:${v}%"></i>${m === "focus" ? `<em style="left:30%"></em><em style="left:80%"></em>` : ""}</div></div>`;
        })
        .join("");
    function next() {
      if (gone()) return stop();
      busy = false;
      if (i >= cfg.steps.length) return end();
      const s = cfg.steps[i++](st);
      if (!s) return next();
      cur = s;
      $l("#dc-m").innerHTML = meterHTML();
      $l("#dc-s").innerHTML = `${s.q ? `<h4>${s.q}</h4>` : ""}${s.sub ? `<p>${s.sub}</p>` : ""}`;
      $l("#dc-msg").textContent = "";
      if (cfg.top) $l("#dc-top").innerHTML = cfg.top(st);
      const EMO = /^((?:\p{Extended_Pictographic}|\uFE0F|\u200D)+)\s*/u;
      $l("#dc-o").innerHTML = s.opts
        .map((o, k) => {
          const m = typeof o.t === "string" && o.t.match(EMO);
          const icon = m ? m[1] : "";
          const txt = m ? o.t.slice(m[0].length) : o.t;
          return `<button class="dc-opt ${icon ? "has-ico" : ""}" data-k="${k}" style="--i:${k}"><b>${k + 1}</b>${icon ? `<i class="dc-ico">${icon}</i>` : ""}<span>${txt}</span>${o.d ? `<small>${o.d}</small>` : ""}${o.tag ? `<em>${o.tag}</em>` : ""}</button>`;
        })
        .join("");
      el.querySelectorAll(".dc-opt").forEach((b) => b.addEventListener("click", () => pick(+b.dataset.k)));
    }
    function pick(k) {
      if (gone()) return stop();
      if (busy || !cur || !cur.opts[k]) return;
      busy = true;
      const r = cur.opts[k].go(st) || {};
      if (cfg.onPick) cfg.onPick(st, cur.opts[k], r);
      if (typeof r.pts === "number") {
        const w = r.w === undefined ? 1 : r.w;
        st.total += clamp(r.pts, 0, 100) * w;
        st.wsum += w;
      }
      el.querySelectorAll(".dc-opt").forEach((b, j) => b.classList.add(j === k ? "picked" : "dim"));
      $l("#dc-m").innerHTML = meterHTML();
      $l("#dc-msg").innerHTML = r.msg || "";
      if (r.pts !== undefined) (r.pts >= 70 ? Sound.powerup && Sound.powerup() : r.pts < 40 ? Sound.impact() : Sound.countdown(false));
      timer = setTimeout(next, r.msg ? 1500 : 450);
    }
    const onKey = (e) => {
      const k = { Digit1: 0, Digit2: 1, Digit3: 2, Digit4: 3, Numpad1: 0, Numpad2: 1, Numpad3: 2, Numpad4: 3 }[e.code];
      if (k !== undefined) pick(k);
    };
    function stop() {
      clearTimeout(timer);
      docOff("keydown", onKey);
    }
    function end() {
      stop();
      const base = st.wsum ? st.total / st.wsum : 50;
      done(clamp(cfg.finish ? cfg.finish(st, base) : base, 0, 100), st);
    }
    docOn("keydown", onKey);
    cleanup = stop;
    next();
  }
  // Resultado de un chequeo como paso con puntos
  const res = (c, okPts, koPts, okMsg, koMsg) => ({ pts: c.ok ? okPts : koPts, msg: `${c.txt}<br>${c.ok ? okMsg : koMsg}` });

