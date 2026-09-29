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
  RETOS.diseno = {
    titulo: () => "Reto de diseño: materiales inesperados",
    desc: "Recoge lentejuelas, telas, plumas y cristales para tu look. ¡Esquiva las tijeras rotas y la cinta aislante!",
    ctrl: "Flechas ← → o A/D, arrastra el ratón o toca los lados",
    run: runDiseno,
  };
  RETOS.rusical = {
    titulo: () => "El Rusical",
    desc: "Canta y baila a ritmo: pulsa cada nota justo cuando llegue a la línea.",
    ctrl: "Teclas D F J K (o flechas ← ↓ ↑ →) o toca los carriles",
    run: runRusical,
  };
  RETOS.maquillaje = {
    titulo: () => "Reto de maquillaje: copia el look",
    desc: "Memoriza la carta de maquillaje de la jueza y reprodúcela zona por zona.",
    ctrl: "Clic o toca los colores",
    run: runMaquillaje,
  };
  RETOS.lectura = {
    titulo: () => "La biblioteca está abierta",
    desc: "Es hora de leer. Elige la lectura más afilada (y con cariño) para cada compañera.",
    ctrl: "Clic o teclas 1, 2 y 3",
    run: (el, done) => runSnatch(el, done, LECTURAS, "📚 La biblioteca", "Lectura"),
  };
  RETOS.equipos = {
    titulo: () => "Reto por equipos: girl groups",
    desc: "Formáis dos equipos. Elige tu papel en el grupo y dalo todo en la actuación: si tu equipo gana, sumas un extra.",
    ctrl: "Eliges papel y luego pulsas las notas (D F J K o toca los carriles)",
    run: runEquipos,
  };
  const ORDEN_RETOS = ["pasarela", "snatch", "equipos", "diseno", "lectura", "rusical", "baile", "maquillaje"];

  // --------------------------- Flujo principal -----------------------------
  const SAVE_KEY = "dftc-story-save";
  const qById = (id) => QUEENS.find((q) => q.id === id);

  function start(queen, season) {
    const rivals = season.cast.filter((id) => id !== queen.id).map(qById).filter(Boolean);
    S = { queen, season, rivals, out: [], ep: 0, wins: 0, bottoms: 0, points: 0, lipsyncs: 0, rel: {}, streak: 0, returned: false, dshantay: false, dsashay: false };
    Achievements.unlock("debut");
    UI.show("story");
    Sound.stopAll();
    nextEpisode();
  }

  // Guardado: se guarda al empezar cada episodio (si sales a mitad de un reto, lo repites)
  function save() {
    store.set(SAVE_KEY, {
      queen: S.queen.id, season: S.season.id, rivals: S.rivals.map((q) => q.id), out: S.out.map((q) => q.id),
      ep: S.ep, wins: S.wins, bottoms: S.bottoms, points: S.points, lipsyncs: S.lipsyncs, rel: S.rel, streak: S.streak,
      returned: S.returned, dshantay: S.dshantay, dsashay: S.dsashay, date: new Date().toISOString(),
    });
  }
  const saved = () => {
    const d = store.get(SAVE_KEY, null);
    return d && qById(d.queen) && seasonById(d.season) ? d : null;
  };
  function resume() {
    const d = saved();
    if (!d) return;
    S = {
      queen: qById(d.queen), season: seasonById(d.season), rivals: d.rivals.map(qById).filter(Boolean), out: d.out.map(qById).filter(Boolean),
      ep: d.ep, wins: d.wins, bottoms: d.bottoms, points: d.points, lipsyncs: d.lipsyncs,
      rel: d.rel || {}, streak: d.streak || 0, returned: !!d.returned, dshantay: !!d.dshantay, dsashay: !!d.dsashay,
    };
    UI.show("story");
    Sound.stopAll();
    nextEpisode();
  }

  // Pantalla al pulsar "Modo historia": continuar la guardada o empezar otra
  function menu(onNew) {
    const d = saved();
    if (!d) return onNew();
    const q = qById(d.queen), se = seasonById(d.season);
    UI.show("story");
    $("#story-season").textContent = "Modo historia";
    $("#story-ep").textContent = "Partida guardada";
    $("#story-exit").textContent = "← Volver";
    $("#story-cast").innerHTML = "";
    body().innerHTML = `
      <div class="story-card intro">
        <img class="story-queen" src="${lookOf(q, se.id).sprite || q.sprite}" alt="">
        <div>
          <p class="eyebrow">${esc(se.franchise.name)} · ${esc(se.name)}</p>
          <h3>${esc(q.name)}</h3>
          <p>Vas por el episodio ${d.ep + 1}. Quedan ${d.rivals.length + 1} reinas en la competición.</p>
          <p class="muted">${Math.round(d.points).toLocaleString("es-ES")} puntos · ${d.wins} retos ganados</p>
          <div class="row">
            <button class="btn btn-ghost" id="story-new">Nueva historia</button>
            <button class="btn btn-primary" id="story-continue">Continuar</button>
          </div>
          <p class="muted small">Si empiezas una nueva, la partida guardada se borrará al comenzar.</p>
        </div>
      </div>`;
    $("#story-continue").addEventListener("click", resume);
    $("#story-new").addEventListener("click", onNew);
  }

  // Salir sin perder la partida (queda guardada desde el inicio del episodio)
  function abandon() {
    if (cleanup) cleanup();
    cleanup = null;
    S = null;
  }
  function exitToMenu() {
    abandon();
    Sound.stopAll();
    UI.show("menu");
  }

  // --------------------------- Diálogos ------------------------------------
  function fill(txt, ctx) {
    return txt.replace(/\{(\w+)\}/g, (m, k) => (ctx[k] !== undefined ? ctx[k] : m));
  }
  function who(key, ctx) {
    if (PRESENTADORAS[key]) return { ...PRESENTADORAS[key], side: "left" };
    if (key === "me") return { name: S.queen.name, role: "Tú", img: sprite(S.queen), side: "right" };
    const q = ctx.q[key];
    return { name: q.name, role: "Concursante", img: sprite(q), side: "right" };
  }
  // lines: [[speaker, text]]; choices: opcional, se muestran al final
  function dialog(lines, ctx, then, choices) {
    let i = 0;
    const scene = document.createElement("div");
    scene.className = "dlg";
    body().innerHTML = "";
    body().append(scene);
    function showLine() {
      if (i >= lines.length) {
        if (choices) return showChoices();
        return finish();
      }
      const [k, t] = lines[i];
      const w = who(k, ctx);
      scene.innerHTML = `
        <img class="dlg-char ${w.side}" src="${w.img}" alt="">
        <div class="dlg-box">
          <p class="dlg-name">${esc(w.name)} <small>${esc(w.role)}</small></p>
          <p class="dlg-text"></p>
          <p class="dlg-hint">Clic, Espacio o Enter para continuar ▸</p>
        </div>
        <button class="btn btn-ghost dlg-skip" id="dlg-skip">Saltar</button>`;
      typeText(scene.querySelector(".dlg-text"), fill(t, ctx));
      scene.querySelector("#dlg-skip").addEventListener("click", (e) => {
        e.stopPropagation();
        i = lines.length;
        showLine();
      });
    }
    function showChoices() {
      scene.innerHTML = `
        <img class="dlg-char right" src="${sprite(S.queen)}" alt="">
        <div class="dlg-box">
          <p class="dlg-name">${esc(S.queen.name)} <small>Tú</small></p>
          <div class="dlg-choices">${choices.map((c, k) => `<button class="btn btn-ghost" data-k="${k}"><b>${k + 1}</b> ${esc(c.txt)}</button>`).join("")}</div>
        </div>`;
      scene.querySelectorAll(".dlg-choices button").forEach((b) => b.addEventListener("click", (e) => {
        e.stopPropagation();
        pickChoice(+b.dataset.k);
      }));
    }
    function pickChoice(k) {
      const c = choices[k];
      if (!c) return;
      S.points += c.bonus || 0;
      Object.entries(c.rel || {}).forEach(([key, d]) => changeRel(ctx.q[key], d));
      choices = null;
      lines = [["me", c.txt], c.reply];
      i = 0;
      showLine();
    }
    function finish() {
      stop();
      then();
    }
    let typing = null;
    function typeText(el, full) {
      clearInterval(typing);
      let n = 0;
      el.innerHTML = `<span></span><i class="caret"></i>`;
      const span = el.firstChild;
      typing = setInterval(() => {
        n += 2;
        span.textContent = full.slice(0, n);
        if (n >= full.length) {
          clearInterval(typing);
          typing = null;
        }
      }, 22);
      el.dataset.full = full;
    }
    const next = () => {
      const tx = scene.querySelector(".dlg-text");
      if (typing && tx) {
        // Primer toque: termina la frase de golpe
        clearInterval(typing);
        typing = null;
        tx.firstChild.textContent = tx.dataset.full;
        return;
      }
      if (!scene.querySelector(".dlg-choices")) {
        i++;
        showLine();
      }
    };
    const onKey = (e) => {
      if (scene.querySelector(".dlg-choices")) {
        const k = { Digit1: 0, Digit2: 1, Digit3: 2 }[e.code];
        if (k !== undefined) pickChoice(k);
        return;
      }
      if (e.code === "Space" || e.code === "Enter") {
        e.preventDefault();
        next();
      }
    };
    function stop() {
      clearInterval(typing);
      document.removeEventListener("keydown", onKey);
    }
    Music.play(lines === DIALOGOS.critica.bottom ? "tension" : "taller");
    scene.addEventListener("click", next);
    document.addEventListener("keydown", onKey);
    cleanup = stop;
    showLine();
  }
  function ctxFor(titulo) {
    const pool = shuffle(S.rivals);
    const r1 = pool[0], r2 = pool[1] || pool[0];
    return {
      yo: S.queen.name, r1: r1 && r1.name, r2: r2 && r2.name, fuera: S.out[0] && S.out[0].name,
      reto: titulo, temporada: S.season.name, q: { r1, r2 },
    };
  }

  const isFinal = () => S.rivals.length <= 2;

  // --------------------------- Relaciones ----------------------------------
  // -3 (enemiga) ... +3 (aliada). Aliada >= 2, rival <= -2
  const relOf = (q) => (q && S.rel[q.id]) || 0;
  const allies = () => S.rivals.filter((q) => relOf(q) >= 2);
  const enemies = () => S.rivals.filter((q) => relOf(q) <= -2);
  function changeRel(q, d) {
    if (!q || !d) return;
    const before = relOf(q);
    const after = Math.max(-3, Math.min(3, before + d));
    S.rel[q.id] = after;
    if (after >= 2 && before < 2) Toast.show(`💞 ${q.name} es tu aliada`, "Te echará un cable en los retos");
    if (after <= -2 && before > -2) Toast.show(`🗡️ ${q.name} va a por ti`, "Cuidado con ella en los retos");
    if (allies().length >= 3) Achievements.unlock("aliadas");
    if (after <= -2) Achievements.unlock("enemiga");
  }
  function relBonus() {
    return Math.max(-10, Math.min(12, allies().length * 4 - enemies().length * 4));
  }

  function header() {
    $("#story-season").textContent = `Modo historia · ${S.season.franchise.name} · ${S.season.name}`;
    $("#story-ep").textContent = isFinal() ? "Gran final" : `Episodio ${S.ep}`;
    $("#story-exit").textContent = "💾 Guardar y salir";
    const all = [S.queen, ...S.rivals];
    $("#story-cast").innerHTML =
      all
        .map((q) => {
          const r = q === S.queen ? "me" : relOf(q) >= 2 ? "ally" : relOf(q) <= -2 ? "enemy" : "";
          return `<i title="${esc(q.name)}" class="${r}" style="background-image:url('${photo(q)}')"></i>`;
        })
        .join("") +
      S.out.map((q) => `<i title="${esc(q.name)}" class="out" style="background-image:url('${photo(q)}')"></i>`).join("");
  }

  function nextEpisode() {
    save();
    Curtain.run(() => episode(), isFinal() ? "GRAN FINAL" : `EPISODIO ${S.ep + 1}`);
  }
  function episode() {
    S.ep++;
    const tipo = isFinal() ? "pasarela" : ORDEN_RETOS[(S.ep - 1) % ORDEN_RETOS.length];
    const reto = RETOS[tipo];
    const titulo = isFinal() ? "La pasarela de coronación" : reto.titulo();
    header();
    const ctx = ctxFor(titulo);
    let lines;
    if (isFinal()) lines = [...DIALOGOS.final, ...DIALOGOS.anuncio.slice(0, 1)];
    else if (S.ep === 1) lines = [...DIALOGOS.bienvenida, ...DIALOGOS.tallerPrimerDia];
    else lines = DIALOGOS.tallerTrasExpulsion;
    const choices = !isFinal() && ctx.q.r1 ? DIALOGOS.respuestas : null;
    const go = () =>
      dialog(lines, ctx, () => {
        if (isFinal()) return challengeIntro(reto, titulo, tipo);
        dialog(DIALOGOS.anuncio, ctx, () => challengeIntro(reto, titulo, tipo));
      }, choices);
    // Momento especial: vuelve una reina eliminada (una vez por temporada)
    if (!isFinal() && !S.returned && S.out.length >= 2 && S.rivals.length >= 4 && Math.random() < 0.3) {
      S.returned = true;
      const back = S.out[Math.floor(Math.random() * S.out.length)];
      S.out = S.out.filter((q) => q !== back);
      S.rivals.splice(Math.min(1, S.rivals.length), 0, back);
      header();
      return dialog(DIALOGOS.regreso, { ...ctx, r1: back.name, q: { ...ctx.q, r1: back } }, go);
    }
    go();
  }

  function challengeIntro(reto, titulo, tipo) {
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
      Music.play("reto");
      S.team = null;
      reto.run($("#story-play"), (raw) => {
        cleanup = null;
        Music.stop();
        if (raw >= 95) Achievements.unlock("perfecta");
        const bonus = relBonus();
        const score = Math.max(0, Math.min(100, raw + bonus));
        S.lastBonus = bonus;
        if (isFinal()) S.points += Math.round(score) * 10;
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
    let teamLine = "";
    const teamOf = {};
    if (S.team) {
      // Reto por equipos: el equipo ganador suma un extra a su nota individual
      const A = [S.queen, ...S.team], B = S.rivals.filter((q) => !S.team.includes(q));
      const sc = (q) => (q === S.queen ? myScore : scores[S.rivals.indexOf(q)]);
      const avg = (T) => T.reduce((a, q) => a + sc(q), 0) / Math.max(1, T.length);
      const aWins = avg(A) >= avg(B);
      A.forEach((q) => (teamOf[q.id] = "rosa"));
      B.forEach((q) => (teamOf[q.id] = "oro"));
      if (aWins) myScore = Math.min(100, myScore + 8);
      teamLine = `<p class="gold">${aWins ? "🏆 ¡Tu equipo (Rosa) gana el reto por equipos! +8" : "El equipo Oro gana el reto por equipos."}</p>`;
    }
    const rows = [{ q: S.queen, s: myScore, me: true }, ...S.rivals.map((q, i) => ({ q, s: scores[i], i }))].sort((a, b) => b.s - a.s);
    const n = rows.length;
    const myPos = rows.findIndex((r) => r.me);
    const bottom = myPos >= n - 2;
    S.points += myScore * 10 + (myPos === 0 ? 500 : 0);
    if (myPos === 0) S.wins++;
    if (bottom) S.bottoms++;
    S.streak = myPos === 0 ? S.streak + 1 : 0;
    if (S.streak >= 3) Achievements.unlock("racha");
    const b = S.lastBonus || 0;
    const bonusLine = b ? `<p class="${b > 0 ? "gold" : "muted"}">${b > 0 ? `💞 Tus aliadas te han echado un cable: +${b}` : `🗡️ Tus enemigas te lo han puesto difícil: ${b}`}</p>` : "";
    const badge = (k) =>
      k === 0 ? `<b class="tag win">Ganadora del reto</b>` : k >= n - 2 ? `<b class="tag btm">Bottom 2</b>` : `<b class="tag safe">A salvo</b>`;
    body().innerHTML = `
      <div class="story-card">
        <p class="eyebrow">${esc(titulo)} · resultados</p>
        <h3>${myPos === 0 ? "¡Has ganado el reto! 👑" : bottom ? "Estás en el bottom 2..." : "Estás a salvo"}</h3>
        <p class="muted">Tu puntuación: <b>${myScore}</b>/100</p>
        ${bonusLine}${teamLine}
        <ol class="ranking">${rows
          .map((r, k) => `<li style="--i:${k}" class="${r.me ? "me" : ""}"><i style="background-image:url('${photo(r.q)}')"></i><span>${esc(r.q.name)}${teamOf[r.q.id] ? ` <small class="team ${teamOf[r.q.id]}">${teamOf[r.q.id] === "rosa" ? "Rosa" : "Oro"}</small>` : ""}</span>${badge(k)}<em>${Math.round(r.s)}</em></li>`)
          .join("")}</ol>
        <button class="btn btn-primary" id="story-next">${bottom ? "Lip sync for your life" : "Continuar"}</button>
      </div>`;
    const loser = S.rivals[0];
    $("#story-next").addEventListener("click", () => {
      const crit = DIALOGOS.critica[myPos === 0 ? "win" : bottom ? "bottom" : "safe"];
      dialog(crit, ctxFor(titulo), () => untucked(afterCritique));
    });
    const afterCritique = () => {
      if (bottom) return lipSync(loser, false);
      // Tú a salvo: se van las otras dos al lip sync y cae la que toca
      const other = S.rivals[1];
      // Momento especial: doble sashay (se van las dos)
      if (!S.dsashay && S.rivals.length >= 7 && Math.random() < 0.12) {
        S.dsashay = true;
        body().innerHTML = `
        <div class="story-card">
          <p class="eyebrow">¡Momento histórico!</p>
          <h3>Doble sashay away</h3>
          <div class="vs"><img class="gone" src="${photo(other)}"><span>✖</span><img class="gone" src="${photo(loser)}"></div>
          <p>Ninguna ha convencido. <b>${esc(other.name)}</b> y <b>${esc(loser.name)}</b> se van las dos a casa.</p>
          <button class="btn btn-primary" id="story-next">Siguiente episodio</button>
        </div>`;
        eliminate(loser);
        eliminate(other);
        header();
        return $("#story-next").addEventListener("click", nextEpisode);
      }
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
    };
  }

  // Untucked: tras la crítica, una compañera viene a hablar contigo
  function untucked(then) {
    if (isFinal() || S.rivals.length < 3) return then();
    const pool = S.rivals.slice(1);
    const withRel = pool.filter((q) => relOf(q) !== 0);
    const src = withRel.length && Math.random() < 0.6 ? withRel : pool;
    const q = src[Math.floor(Math.random() * src.length)];
    const mood = relOf(q) <= -1 ? "tenso" : relOf(q) >= 1 ? "amiga" : "neutral";
    const U = DIALOGOS.untucked[mood];
    dialog(U.lines, { yo: S.queen.name, r1: q.name, q: { r1: q } }, then, U.choices);
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
    Music.play("tension");
    $("#story-ls").addEventListener("click", () => Curtain.run(() => {
      Music.stop();
      UI.show("game");
      Game.start(Wardrobe.boosted(S.queen), S.season, (res) => {
        UI.show("story");
        header();
        S.points += Math.round(res.score || 0);
        if (res.won) {
          S.lipsyncs++;
          S.points += forCrown ? 5000 : 1000;
          if (S.lipsyncs >= 3) Achievements.unlock("superviviente");
        }
        if (!res.won && !forCrown && !S.dshantay && Math.random() < 0.2) {
          // Momento especial: doble shantay, os quedáis las dos
          S.dshantay = true;
          Achievements.unlock("doble-shantay");
          body().innerHTML = `
          <div class="story-card">
            <p class="eyebrow">¡Momento histórico!</p>
            <h3>¡Doble shantay!</h3>
            <div class="vs"><img src="${photo(S.queen)}"><span>💖</span><img src="${photo(rival)}"></div>
            <p>Las dos lo habéis dado todo. <b>${esc(S.queen.name)}</b> y <b>${esc(rival.name)}</b>, shantay, you both stay.</p>
            <button class="btn btn-primary" id="story-next">Siguiente episodio</button>
          </div>`;
          Confetti.burst(2500);
          return $("#story-next").addEventListener("click", nextEpisode);
        }
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
    }, forCrown ? "LIP SYNC POR LA CORONA" : "LIP SYNC FOR YOUR LIFE"));
  }

  function finalLipSync(score) {
    if (S.bottoms === 0) Achievements.unlock("sin-bottom");
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
    const entry = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      name: store.get("dftc-name", ""),
      queen: S.queen.id,
      season: S.season.id,
      won,
      place,
      cast: S.season.cast.length,
      wins: S.wins,
      lipsyncs: S.lipsyncs,
      score: Math.round(S.points),
      date: new Date().toISOString(),
    };
    const pos = StoryBoard.record(entry);
    store.set(SAVE_KEY, null);
    Story.lastEntryId = pos >= 0 ? entry.id : null;
    if (won) {
      const w = store.get("dftc-story-wins", []);
      if (!w.includes(S.season.id)) store.set("dftc-story-wins", [...w, S.season.id]);
      Sound.win();
      Confetti.burst(5000);
      Music.play("corona");
      Achievements.unlock("corona-historia");
      const crowns = store.get("dftc-story-wins", []);
      if (FRANCHISES.find((f) => f.id === "es").seasons.filter((x) => !x.enEmision).every((x) => crowns.includes(x.id))) Achievements.unlock("espana");
    } else Music.stop();
    const earned = Wallet.add(S.points / 40);
    body().innerHTML = `
      <div class="story-card end ${won ? "won" : ""}">
        <img class="story-queen" src="${sprite(S.queen)}" alt="">
        <div>
          <p class="eyebrow">${esc(S.season.name)} · resultado final</p>
          <h3>${won ? `¡${esc(S.queen.name)}, eres la ganadora! 👑` : `Sashay away... puesto ${place}º`}</h3>
          <p>${won ? "La corona es tuya. Condragulations." : `${esc(rival.name)} te ha ganado el lip sync.`}</p>
          <p class="story-pts">${entry.score.toLocaleString("es-ES")} puntos · +${earned} ✨</p>
          <p class="muted">Retos ganados: ${S.wins} · Veces en el bottom: ${S.bottoms} · Lip syncs ganados: ${S.lipsyncs}</p>
          ${pos >= 0 ? `<label class="name-entry active story-name">Puesto ${pos + 1} del Top 10 de historia. Tu nombre:
            <input id="story-name" maxlength="12" autocomplete="off" spellcheck="false" placeholder="Tu nombre" value="${esc(entry.name)}"></label>` : ""}
          <div class="row">
            <button class="btn btn-ghost" id="story-menu">Menú</button>
            <button class="btn btn-ghost" id="story-scores">🏆</button>
            <button class="btn btn-primary" id="story-again">Otra vez</button>
          </div>
        </div>
      </div>`;
    const q = S.queen, s = S.season;
    const nameInput = $("#story-name");
    if (nameInput) {
      if (!entry.name) StoryBoard.rename(entry.id, "Anónima");
      nameInput.addEventListener("input", () => {
        const nm = nameInput.value.trim().slice(0, 12) || "Anónima";
        store.set("dftc-name", nameInput.value.trim().slice(0, 12));
        StoryBoard.rename(entry.id, nm);
      });
    }
    $("#story-menu").addEventListener("click", () => { abandon(); UI.show("menu"); });
    $("#story-again").addEventListener("click", () => start(q, s));
    $("#story-scores").addEventListener("click", () => { UI.scoresTab("story"); UI.show("scores"); });
  }

  // ------------------------- Reto por equipos ------------------------------
  function runEquipos(el, done) {
    // Tu equipo: la mitad del reparto, con preferencia por tus aliadas.
    // La que se va esta semana (rivals[0]) y la otra del bottom van al equipo Oro.
    const size = Math.max(1, Math.floor((S.rivals.length + 1) / 2) - 1);
    const pool = S.rivals.slice(2).sort((a, b) => relOf(b) - relOf(a) || Math.random() - 0.5);
    S.team = pool.slice(0, size);
    const ROLES = [
      { id: "solista", name: "🎤 Solista", desc: "Más riesgo, más premio: x1.2 si lo haces bien (60+), -10 si no.", f: (s) => (s >= 60 ? s * 1.2 : s - 10) },
      { id: "coros", name: "🎶 Coros", desc: "Equilibrada: tu nota tal cual.", f: (s) => s },
      { id: "fondo", name: "💃 Bailarina de fondo", desc: "Segura pero discreta: x0.9 con un mínimo de 45.", f: (s) => Math.max(45, s * 0.9) },
    ];
    el.innerHTML = `
      <div class="story-card">
        <p class="eyebrow">Equipo Rosa (el tuyo)</p>
        <div class="team-row">${[S.queen, ...S.team].map((q) => `<span><i style="background-image:url('${photo(q)}')"></i>${esc(q.name)}</span>`).join("")}</div>
        <h3>¿Qué papel quieres en el grupo?</h3>
        <div class="role-list">${ROLES.map((r, k) => `<button class="btn btn-ghost role" data-k="${k}"><b>${r.name}</b><small>${r.desc}</small></button>`).join("")}</div>
      </div>`;
    el.querySelectorAll(".role").forEach((b) =>
      b.addEventListener("click", () => {
        const role = ROLES[+b.dataset.k];
        el.innerHTML = "";
        runRusical(el, (s) => done(Math.max(0, Math.min(100, role.f(s)))));
      }),
    );
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
  function runSnatch(el, done, bank = PREGUNTAS, host = "🎤 La presentadora", label = "Pregunta") {
    const N = 5, TIME = 9;
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
      document.removeEventListener("keydown", onKey);
    }
    document.addEventListener("keydown", onKey);
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
  function runDiseno(el, done) {
    const W = 1000, H = 560, DUR = 25;
    el.innerHTML = `
      <div class="mg diseno">
        <p class="mg-info">Tiempo <b id="ds-t">${DUR}</b> s · Materiales <b id="ds-p">0</b></p>
        <canvas id="ds-c" width="${W}" height="${H}"></canvas>
        <div class="ds-touch"><button class="btn btn-ghost" id="ds-l">◀</button><button class="btn btn-ghost" id="ds-r">▶</button></div>
      </div>`;
    const cv = $("#ds-c"), ctx = cv.getContext("2d");
    const img = new Image();
    img.src = sprite(S.queen);
    const GOOD = [["✨", 10], ["🧵", 10], ["🪶", 12], ["💎", 18], ["🎀", 10]];
    const BAD = [["✂️", -15], ["🩹", -10]];
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
        return done(Math.min(100, (pts / 300) * 100));
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
      document.removeEventListener("keydown", kd);
      document.removeEventListener("keyup", ku);
    }
    document.addEventListener("keydown", kd);
    document.addEventListener("keyup", ku);
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
    function tick() {
      const t = now();
      ctx.clearRect(0, 0, W, H);
      for (let i = 0; i < LANES; i++) {
        ctx.fillStyle = flash[i] > 0 ? "rgba(255,255,255,.12)" : i % 2 ? "rgba(255,255,255,.04)" : "rgba(255,255,255,.07)";
        ctx.fillRect(i * lw, 0, lw, H);
        flash[i] = Math.max(0, flash[i] - 1 / 60);
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
      document.removeEventListener("keydown", kd);
    }
    document.addEventListener("keydown", kd);
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

  // Solo para pruebas automatizadas: lanza un reto concreto
  const _test = (tipo, cb) => {
    if (cleanup) cleanup();
    body().innerHTML = `<div id="story-play"></div>`;
    RETOS[tipo].run($("#story-play"), (sc) => { cleanup = null; cb && cb(sc); window.__lastScore = sc; });
  };
  return { start, abandon, menu, exitToMenu, _test, lastEntryId: null };
})();
