// ---------------------------------------------------------------------------
// Modo historia: juegas la temporada como concursante.
// Cada episodio = un reto (minijuego) + resultados. Si quedas entre las dos
// peores, te toca lip sync (el juego de tacones contra una sola rival).
// Las rivales se van en el orden real de expulsión de la temporada.
// ---------------------------------------------------------------------------
const Story = (() => {
  const $ = (s) => document.querySelector(s);
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
  const body = () => $("#story-body");
  const rnd = (a, b) => a + Math.random() * (b - a);
  const shuffle = (arr) => arr.map((v) => [Math.random(), v]).sort((a, b) => a[0] - b[0]).map((x) => x[1]);

  let S = null; // estado de la partida
  let cleanup = null; // quita listeners/timers del minijuego activo

  const photo = (q) => lookOf(q, S && S.season.id).portrait || q.portrait;
  const sprite = (q) => lookOf(q, S && S.season.id).sprite || q.sprite;

  // ------------------------------ Retos ------------------------------------
  const CATEGORIAS = [
    "Rojo pasión", "Brilla, brilla", "Realeza", "Animal print", "Años 80", "Futurista",
    "Flores y más flores", "Blanco y negro", "Look de gala", "Folclore reinventado",
  ];
  const RETOS = {
    pasarela: {
      titulo: () => `Reto de pasarela: «${CATEGORIAS[Math.floor(Math.random() * CATEGORIAS.length)]}»`,
      desc: "Desfila y clava cada pose justo cuando el foco pase por la zona dorada.",
      ctrl: "Espacio, clic o toca el botón ¡POSE!",
      run: runPasarela,
    },
    baile: {
      titulo: () => "Reto de coreografía",
      desc: "Mira los pasos que marca la coreógrafa y repítelos en el mismo orden.",
      ctrl: "Flechas del teclado o toca las flechas",
      run: runBaile,
    },
    snatch: {
      titulo: () => "Snatch Game",
      desc: "Estás en el plató en personaje. Elige la respuesta más graciosa antes de que se acabe el tiempo.",
      ctrl: "Clic o teclas 1, 2 y 3",
      run: runSnatch,
    },
  };
  const ORDEN_RETOS = ["pasarela", "snatch", "baile"];

  // --------------------------- Flujo principal -----------------------------
  function start(queen, season) {
    const rivals = season.cast.filter((id) => id !== queen.id).map((id) => QUEENS.find((q) => q.id === id)).filter(Boolean);
    S = { queen, season, rivals, out: [], ep: 0, wins: 0, bottoms: 0 };
    UI.show("story");
    Sound.stopAll();
    nextEpisode();
  }

  function abandon() {
    if (cleanup) cleanup();
    cleanup = null;
    S = null;
  }

  const isFinal = () => S.rivals.length <= 2;

  function header() {
    $("#story-season").textContent = `Modo historia · ${S.season.franchise.name} · ${S.season.name}`;
    $("#story-ep").textContent = isFinal() ? "Gran final" : `Episodio ${S.ep}`;
    const all = [S.queen, ...S.rivals];
    $("#story-cast").innerHTML =
      all.map((q) => `<i title="${esc(q.name)}" class="${q === S.queen ? "me" : ""}" style="background-image:url('${photo(q)}')"></i>`).join("") +
      S.out.map((q) => `<i title="${esc(q.name)}" class="out" style="background-image:url('${photo(q)}')"></i>`).join("");
  }

  function nextEpisode() {
    S.ep++;
    const tipo = isFinal() ? "pasarela" : ORDEN_RETOS[(S.ep - 1) % ORDEN_RETOS.length];
    const reto = RETOS[tipo];
    const titulo = isFinal() ? "La pasarela de coronación" : reto.titulo();
    header();
    body().innerHTML = `
      <div class="story-card intro">
        <img class="story-queen" src="${sprite(S.queen)}" alt="">
        <div>
          <p class="eyebrow">${isFinal() ? "Top 3 · la última prueba" : `Quedan ${S.rivals.length + 1} reinas`}</p>
          <h3>${esc(titulo)}</h3>
          <p>${reto.desc}</p>
          <p class="muted">🎮 ${reto.ctrl}</p>
          ${isFinal() ? `<p class="gold">Después, lip sync por la corona contra <b>${esc(S.rivals[S.rivals.length - 1].name)}</b>.</p>` : ""}
          <button class="btn btn-primary" id="story-go">¡Empezar!</button>
        </div>
      </div>`;
    $("#story-go").addEventListener("click", () => {
      body().innerHTML = `<div id="story-play"></div>`;
      reto.run($("#story-play"), (score) => {
        cleanup = null;
        isFinal() ? finalLipSync(score) : results(Math.round(score), titulo);
      });
    });
  }

  // Puntuaciones de las rivales: la que se va esta semana (rivals[0]) queda la última
  function rivalScores() {
    const n = S.rivals.length;
    return S.rivals.map((q, i) => {
      if (i === 0) return rnd(28, 44);
      if (i === 1) return rnd(46, 57);
      return Math.min(97, 60 + (i / Math.max(1, n - 1)) * 28 + rnd(-8, 8));
    });
  }

  function results(myScore, titulo) {
    const scores = rivalScores();
    const rows = [{ q: S.queen, s: myScore, me: true }, ...S.rivals.map((q, i) => ({ q, s: scores[i], i }))].sort((a, b) => b.s - a.s);
    const n = rows.length;
    const myPos = rows.findIndex((r) => r.me);
    const bottom = myPos >= n - 2;
    if (myPos === 0) S.wins++;
    if (bottom) S.bottoms++;
    const badge = (k) =>
      k === 0 ? `<b class="tag win">Ganadora del reto</b>` : k >= n - 2 ? `<b class="tag btm">Bottom 2</b>` : `<b class="tag safe">A salvo</b>`;
    body().innerHTML = `
      <div class="story-card">
        <p class="eyebrow">${esc(titulo)} · resultados</p>
        <h3>${myPos === 0 ? "¡Has ganado el reto! 👑" : bottom ? "Estás en el bottom 2..." : "Estás a salvo"}</h3>
        <p class="muted">Tu puntuación: <b>${myScore}</b>/100</p>
        <ol class="ranking">${rows
          .map((r, k) => `<li class="${r.me ? "me" : ""}"><i style="background-image:url('${photo(r.q)}')"></i><span>${esc(r.q.name)}</span>${badge(k)}<em>${Math.round(r.s)}</em></li>`)
          .join("")}</ol>
        <button class="btn btn-primary" id="story-next">${bottom ? "Lip sync for your life" : "Continuar"}</button>
      </div>`;
    const loser = S.rivals[0];
    $("#story-next").addEventListener("click", () => {
      if (bottom) return lipSync(loser, false);
      // Tú a salvo: se van las otras dos al lip sync y cae la que toca
      const other = S.rivals[1];
      body().innerHTML = `
        <div class="story-card">
          <p class="eyebrow">Lip sync</p>
          <h3>${esc(other.name)} vs ${esc(loser.name)}</h3>
          <div class="vs"><img src="${photo(other)}"><span>VS</span><img class="gone" src="${photo(loser)}"></div>
          <p><b>${esc(other.name)}</b>, shantay you stay. <b>${esc(loser.name)}</b>, sashay away.</p>
          <button class="btn btn-primary" id="story-next">Siguiente episodio</button>
        </div>`;
      eliminate(loser);
      header();
      $("#story-next").addEventListener("click", nextEpisode);
    });
  }

  function eliminate(q) {
    S.rivals = S.rivals.filter((r) => r !== q);
    S.out.unshift(q);
  }

  function lipSync(rival, forCrown) {
    body().innerHTML = `
      <div class="story-card">
        <p class="eyebrow">${forCrown ? "Lip sync por la corona" : "Lip sync for your life"}</p>
        <h3>${esc(S.queen.name)} vs ${esc(rival.name)}</h3>
        <div class="vs"><img src="${photo(S.queen)}"><span>VS</span><img src="${photo(rival)}"></div>
        <p>${forCrown ? "Una ronda, una corona." : "Gana el duelo de tacones o te vas a casa."}</p>
        <button class="btn btn-primary" id="story-ls">¡A la pasarela!</button>
      </div>`;
    $("#story-ls").addEventListener("click", () => {
      UI.show("game");
      Game.start(S.queen, S.season, (res) => {
        UI.show("story");
        header();
        if (!res.won) return theEnd(false, rival, forCrown);
        if (forCrown) return theEnd(true);
        eliminate(rival);
        header();
        body().innerHTML = `
          <div class="story-card">
            <p class="eyebrow">Shantay, you stay</p>
            <h3>¡Sigues en la competición!</h3>
            <div class="vs"><img src="${photo(S.queen)}"><span>VS</span><img class="gone" src="${photo(rival)}"></div>
            <p><b>${esc(rival.name)}</b>, sashay away.</p>
            <button class="btn btn-primary" id="story-next">Siguiente episodio</button>
          </div>`;
        $("#story-next").addEventListener("click", nextEpisode);
      }, { rivals: [rival], story: true });
    });
  }

  function finalLipSync(score) {
    const third = S.rivals[0];
    const rival = S.rivals[S.rivals.length - 1];
    body().innerHTML = `
      <div class="story-card">
        <p class="eyebrow">Pasarela final · ${Math.round(score)}/100</p>
        <h3>${esc(third.name)} termina en tercer lugar</h3>
        <p>Solo quedáis dos. La corona se decide en un lip sync.</p>
        <button class="btn btn-primary" id="story-next">Lip sync por la corona</button>
      </div>`;
    $("#story-next").addEventListener("click", () => {
      eliminate(third);
      lipSync(rival, true);
    });
  }

  function theEnd(won, rival, forCrown) {
    const place = won ? 1 : forCrown ? 2 : S.rivals.length + 1;
    if (won) {
      const w = store.get("dftc-story-wins", []);
      if (!w.includes(S.season.id)) store.set("dftc-story-wins", [...w, S.season.id]);
      Sound.win();
    }
    body().innerHTML = `
      <div class="story-card end ${won ? "won" : ""}">
        <img class="story-queen" src="${sprite(S.queen)}" alt="">
        <div>
          <p class="eyebrow">${esc(S.season.name)} · resultado final</p>
          <h3>${won ? `¡${esc(S.queen.name)}, eres la ganadora! 👑` : `Sashay away... puesto ${place}º`}</h3>
          <p>${won ? "La corona es tuya. Condragulations." : `${esc(rival.name)} te ha ganado el lip sync.`}</p>
          <p class="muted">Retos ganados: ${S.wins} · Veces en el bottom: ${S.bottoms}</p>
          <div class="row">
            <button class="btn btn-ghost" id="story-menu">Menú</button>
            <button class="btn btn-primary" id="story-again">Otra vez</button>
          </div>
        </div>
      </div>`;
    const q = S.queen, s = S.season;
    $("#story-menu").addEventListener("click", () => { abandon(); UI.show("menu"); });
    $("#story-again").addEventListener("click", () => start(q, s));
  }

  // ------------------------- Minijuego: pasarela ---------------------------
  function runPasarela(el, done) {
    const POSES = 8;
    el.innerHTML = `
      <div class="mg pasarela">
        <p class="mg-info">Pose <b id="pz-n">1</b>/${POSES} · <span id="pz-msg">¡Prepárate!</span></p>
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
      $("#pz-msg").textContent = `${msg} (+${pts})`;
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
      document.removeEventListener("keydown", onKey);
    }
    $("#pz-btn").addEventListener("click", hit);
    document.addEventListener("keydown", onKey);
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
      document.removeEventListener("keydown", onKey);
    }
    Object.entries(pads).forEach(([d, b]) => b.addEventListener("click", () => input(d)));
    document.addEventListener("keydown", onKey);
    cleanup = stop;
    play();
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
  function runSnatch(el, done) {
    const N = 5, TIME = 9;
    const qs = shuffle(PREGUNTAS).slice(0, N);
    let i = 0, total = 0, t0 = 0, raf = 0, answered = false, opts = [];
    el.innerHTML = `
      <div class="mg snatch">
        <p class="mg-info">Pregunta <b id="sg-n">1</b>/${N}</p>
        <div class="sg-host"><span>🎤 La presentadora</span><p id="sg-q"></p></div>
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
      document.removeEventListener("keydown", onKey);
    }
    document.addEventListener("keydown", onKey);
    cleanup = stop;
    ask();
    raf = requestAnimationFrame(tick);
  }

  return { start, abandon };
})();
