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

  // Elige una variante evitando repetir las usadas recientemente en esta partida
  const recent = [];
  const pickFresh = (arr) => {
    const fresh = arr.filter((x) => !recent.includes(x));
    const v = pick1(fresh.length ? fresh : arr);
    recent.push(v);
    if (recent.length > 60) recent.shift();
    return v;
  };
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
      desc: "Elige un personaje e interprétalo en el plató. Cada respuesta tiene que sonar a TU personaje, y rápido: el público premia el ritmo.",
      ctrl: "Clic o teclas 1, 2 y 3",
      run: runSnatchGame,
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
  // La historia NO sigue el orden real de expulsión: cada partida se decide
  // por cómo juegas, tus relaciones y el azar. (El orden real es solo del arcade.)
  const SAVE_KEY = "dftc-story-save";
  const qById = (id) => QUEENS.find((q) => q.id === id);
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const seasonInfo = () => TEMPORADAS_HISTORIA[S.season.id] || { lema: "", intro: [] };
  const twistOf = () => seasonInfo().twist || null;
  const keyOf = (q) => (q === S.queen ? "me" : q.id);
  const nameOfKey = (k) => (k === "me" ? S.queen.name : (qById(k) || {}).name || "");

  function blankState(queen, season, rivals) {
    return {
      queen, season, rivals, out: [], ep: 0, wins: 0, bottoms: 0, points: 0, lipsyncs: 0, rel: {}, streak: 0,
      record: {}, form: {}, hearts: {}, memories: [], track: {}, epNames: {}, luck: undefined, flags: {}, advice: 0, helped: false, meOut: false,
    };
  }
  function start(queen, season) {
    const rivals = shuffle(season.cast.filter((id) => id !== queen.id).map(qById).filter(Boolean));
    S = blankState(queen, season, rivals);
    Achievements.unlock("debut");
    UI.show("story");
    Sound.stopAll();
    nextEpisode();
  }

  // Guardado: se guarda al empezar cada episodio (si sales a mitad de un reto, lo repites)
  const PLAIN = ["memories", "track", "epNames", "ep", "wins", "bottoms", "points", "lipsyncs", "rel", "streak", "record", "form", "hearts", "luck", "flags", "meOut"];
  function save() {
    const d = { queen: S.queen.id, season: S.season.id, rivals: S.rivals.map((q) => q.id), out: S.out.map((q) => q.id), date: new Date().toISOString(), v: 2 };
    PLAIN.forEach((k) => (d[k] = S[k]));
    store.set(SAVE_KEY, d);
  }
  const saved = () => {
    const d = store.get(SAVE_KEY, null);
    return d && d.v === 2 && qById(d.queen) && seasonById(d.season) ? d : null;
  };
  function resume() {
    const d = saved();
    if (!d) return;
    S = blankState(qById(d.queen), seasonById(d.season), d.rivals.map(qById).filter(Boolean));
    S.out = d.out.map(qById).filter(Boolean);
    PLAIN.forEach((k) => d[k] !== undefined && (S[k] = d[k]));
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
          <p>Vas por el episodio ${d.ep + 1}. Quedan ${d.rivals.length + (d.meOut ? 0 : 1)} reinas en la competición.</p>
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
    const q = ctx.q[key] || S.rivals[0];
    return { name: q.name, role: relLabel(q), img: sprite(q), side: key === "r2" || key === "r3" ? "left" : "right" };
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
          <div class="dlg-choices">${choices.map((c, k) => `<button class="btn btn-ghost" data-k="${k}"><b>${k + 1}</b> ${esc(fill(c.txt, ctx))}</button>`).join("")}</div>
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
      if (c.effect === "ayuda") S.helped = true;
      choices = null;
      lines = [["me", c.txt], ...(c.reply ? [c.reply] : [])];
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
    Music.play(ctx.tension ? "tension" : "taller");
    scene.addEventListener("click", next);
    document.addEventListener("keydown", onKey);
    cleanup = stop;
    showLine();
  }
  // Contexto con compañeras concretas (r1 principal, r2/r3 secundarias)
  function ctxWith(r1, extra = {}) {
    const others = shuffle(S.rivals.filter((q) => q !== r1));
    const r2 = extra.r2 || others[0] || r1, r3 = extra.r3 || others.find((q) => q !== r2) || r2;
    return {
      yo: S.queen.name, r1: r1 && r1.name, r2: r2 && r2.name, r3: r3 && r3.name,
      fuera: S.out[0] && S.out[0].name, temporada: S.season.name, reto: extra.reto || "", tension: extra.tension,
      q: { r1, r2, r3 },
    };
  }
  const ctxFor = (titulo) => ctxWith(pick1(S.rivals), { reto: titulo });

  const isFinal = () => !S.meOut && S.rivals.length <= 2;

  // --------------------------- Relaciones ----------------------------------
  // -3 (enemiga) ... +3 (aliada). Aliada >= 2, enemiga <= -2
  const relOf = (q) => (q && S.rel[q.id]) || 0;
  const relLabel = (q) => { const r = relOf(q); return r >= 2 ? "💞 Aliada" : r >= 1 ? "Buena relación" : r <= -2 ? "🗡️ Enemiga" : r <= -1 ? "Tensión" : "Neutral"; };
  const allies = () => S.rivals.filter((q) => relOf(q) >= 2);
  const enemies = () => S.rivals.filter((q) => relOf(q) <= -2);
  function changeRel(q, d) {
    if (!q || !d || q === S.queen) return;
    const before = relOf(q);
    const after = clamp(before + d, -3, 3);
    S.rel[q.id] = after;
    if (after >= 2 && before < 2) Toast.show(`💞 ${q.name} es tu aliada`, "Te echará un cable en los retos");
    else if (after <= -2 && before > -2) Toast.show(`🗡️ ${q.name} va a por ti`, "Cuidado con ella");
    else if (after > before) Toast.show(`💗 ${q.name}`, "Os lleváis un poco mejor");
    else if (after < before) Toast.show(`💢 ${q.name}`, "Se ha enfriado la cosa");
    if (allies().length >= 3) Achievements.unlock("aliadas");
    if (after <= -2) Achievements.unlock("enemiga");
  }
  function relBonus() {
    return clamp(allies().length * 4 - enemies().length * 4, -10, 12);
  }
  // Nivel de cada rival: sale de sus estadísticas, su racha y el azar del día
  const skillOf = (q) => 48 + Object.values(q.stats).reduce((a, b) => a + b, 0) * 2.2;
  const rivalScore = (q) => clamp(skillOf(q) + (S.form[q.id] || 0) + rnd(-22, 14), 5, 99);

  function header() {
    $("#story-season").textContent = `Modo historia · ${S.season.name} · ${seasonInfo().lema || S.season.franchise.name}`;
    let chip = "";
    const tw = twistOf();
    if (tw === "moneda") chip = "🪙 Bottom de 3 y moneda al aire";
    if (tw === "corazon") chip = `❤️ Tienes ${((S.hearts.me || 0) / 2).toString().replace(".", ",")} corazones`;
    if (tw === "suerte") chip = S.luck === undefined ? "🍀 Cajitas por abrir" : S.luck === "me" ? "🍀 ¡La tienes tú! (en secreto)" : S.luck ? "🍀 ¿Quién la tendrá?" : "🍀 Ya se ha usado";
    if (tw === "repesca") chip = S.flags.repesca ? "🔁 Repesca hecha" : "🔁 Repesca pendiente";
    if (tw === "allstars") chip = "💄 Decide la ganadora";
    $("#story-ep").textContent = S.meOut ? "Fuera de la competición" : isFinal() ? "Gran final" : `Episodio ${S.ep}`;
    if (chip) $("#story-season").innerHTML += ` <span class="twist-chip">${esc(chip)}</span>`;
    $("#story-exit").textContent = "💾 Guardar y salir";
    const all = S.meOut ? S.rivals : [S.queen, ...S.rivals];
    $("#story-cast").innerHTML =
      all
        .map((q) => {
          const r = q === S.queen ? "me" : relOf(q) >= 2 ? "ally" : relOf(q) <= -2 ? "enemy" : "";
          return `<i title="${esc(q.name)} · ${esc(q === S.queen ? "Tú" : relLabel(q))}" class="${r}" style="background-image:url('${photo(q)}')"></i>`;
        })
        .join("") +
      S.out.map((q) => `<i title="${esc(q.name)}" class="out" style="background-image:url('${photo(q)}')"></i>`).join("");
  }

  // --------------------------- Críticas del jurado --------------------------
  function buildCritique(score, verdict) {
    const nivel = score >= 75 ? "top" : score >= 50 ? "mid" : "low";
    const bank = (JURADO.reto[S.curTipo] || JURADO.reto.pasarela)[nivel];
    // El look de pasarela no siempre va a la par que el reto
    const lookN = Math.random() < 0.65 ? nivel : pick1(["top", "mid", "low"]);
    const judgeFirst = Math.random() < 0.5;
    const lines = [];
    lines.push(["host", pickFresh(JURADO.aperturaSupreme)]);
    const a = ["judge", `${pickFresh(JURADO.aperturaAna)} ${pickFresh(bank)}`];
    const b = [judgeFirst ? "host" : "judge", pickFresh(JURADO.pasarela[lookN])];
    lines.push(a, b);
    if (score >= 90 && verdict === "win") lines.push(["judge", "Hoy has puesto el listón altísimo para las demás."]);
    if (score < 30) lines.push(["host", "Tienes que despertar, {yo}. Esto se acaba."]);
    lines.push(["host", pickFresh(JURADO.veredicto[verdict])]);
    return lines;
  }

  // ------------------------------ Memoria -----------------------------------
  // Las compañeras recuerdan si las salvaste o las condenaste (y si era justo)
  function remember(q, kind, fair) {
    if (!q || q === S.queen) return;
    S.memories.push({ id: q.id, kind, fair, ep: S.ep });
  }
  function memoryTalk(then) {
    const pend = S.memories.filter((m) => m.ep < S.ep);
    S.memories = S.memories.filter((m) => m.ep >= S.ep);
    const m = pend.reverse().find((x) => S.rivals.some((r) => r.id === x.id));
    if (!m) return then();
    const q = qById(m.id);
    const bank = m.kind === "salvada" ? (m.fair ? MEMORIA.gracias.justa : MEMORIA.gracias.peor) : m.fair ? MEMORIA.rencor.justo : MEMORIA.rencor.injusto;
    const v = pickFresh(bank);
    dialog(v.lines, { ...ctxWith(q), q: { r1: q }, r1: q.name, tension: m.kind !== "salvada" }, () => {
      if (v.after) changeRel(q, v.after);
      then();
    }, v.choices);
  }

  // ----------------------------- Track record -----------------------------
  const EP_SHORT = { pasarela: "Pasarela", snatch: "Snatch Game", baile: "Coreografía", diseno: "Diseño", lectura: "Biblioteca", rusical: "Rusical", maquillaje: "Maquillaje", equipos: "Girl Groups" };
  function mark(q, lab) {
    const k = keyOf(q);
    (S.track[k] = S.track[k] || {})[S.ep] = lab;
  }
  const TRACK_CLASS = (l) =>
    l === "WIN" || l === "WINNER" ? "t-win" : l === "TOP2" ? "t-top2" : l === "HIGH" ? "t-high" : l === "SAFE" ? "t-safe" : l === "LOW" ? "t-low" : /^BTM/.test(l) ? "t-btm" : l === "ELIM" ? "t-elim" : l === "RUNNER-UP" ? "t-runner" : l === "FINAL" ? "t-final" : l === "3ª" ? "t-third" : "t-none";
  const LAB_ES = { WIN: "WIN", HIGH: "HIGH", SAFE: "SAFE", LOW: "LOW", BTM2: "BTM2", BTM3: "BTM3", ELIM: "ELIM", TOP2: "TOP2", WINNER: "GANADORA", "RUNNER-UP": "FINALISTA", FINAL: "FINAL", "3ª": "3ª" };
  function trackHTML() {
    const eps = Object.keys(S.epNames).map(Number).sort((a, b) => a - b);
    const everyone = [S.queen, ...S.rivals, ...S.out];
    const count = (k, test) => eps.filter((e) => test((S.track[k] || {})[e] || "")).length;
    const lastEp = (k) => Math.max(0, ...eps.filter((e) => (S.track[k] || {})[e]));
    const isOut = (q) => (q === S.queen ? S.meOut || !!S.finished && !S.wonAll : S.out.includes(q));
    const rows = everyone
      .filter((q, i, a) => a.indexOf(q) === i)
      .map((q) => {
        const k = keyOf(q);
        return {
          q, k, out: isOut(q), last: lastEp(k),
          w: count(k, (l) => l === "WIN" || l === "WINNER"), h: count(k, (l) => l === "HIGH" || l === "TOP2"),
          s: count(k, (l) => l === "SAFE"), lo: count(k, (l) => l === "LOW"), b: count(k, (l) => /^BTM/.test(l)),
        };
      })
      .sort((a, b) => a.out - b.out || (a.out ? b.last - a.last : 0) || b.w - a.w || b.h - a.h || b.s - a.s || a.lo - b.lo || a.b - b.b);
    const ppe = (k) => {
      const V = { WIN: 5, WINNER: 5, TOP2: 4.5, HIGH: 4, SAFE: 3, LOW: 2, BTM2: 1, BTM3: 1, ELIM: 0 };
      const v = eps.map((e) => V[(S.track[k] || {})[e]]).filter((x) => x !== undefined);
      return v.length ? (v.reduce((a, b) => a + b, 0) / v.length).toFixed(2) : "–";
    };
    return `
      <div class="track-wrap"><table class="track">
        <thead><tr><th>#</th><th>Reina</th>${eps.map((e) => `<th>Ep. ${e}<small>${esc(S.epNames[e])}</small></th>`).join("")}<th>PPE</th></tr></thead>
        <tbody>${rows
          .map((r, i) => `<tr class="${r.q === S.queen ? "me" : ""} ${r.out ? "out" : ""}" style="--i:${i}"><td class="rk">${i + 1}º</td>
            <td class="qn"><i style="background-image:url('${photo(r.q)}')"></i><span>${esc(r.q.name)}${r.q === S.queen ? " <b>(tú)</b>" : ""}</span></td>
            ${eps.map((e) => { const l = (S.track[r.k] || {})[e]; return `<td class="${l ? TRACK_CLASS(l) : r.last && e > r.last ? "t-gone" : "t-none"}">${l ? LAB_ES[l] || l : ""}</td>`; }).join("")}
            <td class="ppe">${ppe(r.k)}</td></tr>`)
          .join("")}</tbody>
      </table></div>`;
  }
  function showTrack(then, label = "Siguiente episodio") {
    header();
    body().innerHTML = `
      <div class="story-card track-card">
        <p class="eyebrow">Fin del episodio ${S.ep}</p>
        <h3>Track record</h3>
        ${trackHTML()}
        <button class="btn btn-primary" id="track-next">${label}</button>
      </div>`;
    $("#track-next").addEventListener("click", then);
  }

  // El episodio ha terminado: se guarda YA (antes de ver el track record o salir)
  function endEpisodeBtn() {
    save();
    const b = $("#story-next");
    if (b) b.addEventListener("click", nextEpisode);
  }
  function nextEpisode() {
    save();
    if (S.ep > 0 && S.trackShown !== S.ep && Object.keys(S.epNames).length) {
      S.trackShown = S.ep;
      return showTrack(nextEpisode);
    }
    save();
    Curtain.run(() => episode(), isFinal() ? "GRAN FINAL" : `EPISODIO ${S.ep + 1}`);
  }
  function episode() {
    S.ep++;
    S.advice = 0;
    S.helped = false;
    header();
    if (isFinal()) return finale();
    const tw = twistOf();
    if (tw === "repesca" && !S.flags.repesca && S.out.length >= 2 && S.rivals.length + 1 <= Math.ceil(S.season.cast.length / 2)) {
      return repesca(() => workroom());
    }
    workroom();
  }

  // ------------------------------ Taller -----------------------------------
  function workroom() {
    const ctx = ctxWith(pick1(S.rivals));
    let lines;
    const go = () => memoryTalk(() => maybeEvent(() => hub(() => announce())));
    if (S.ep === 1 && twistOf() === "suerte" && S.luck === undefined) {
      return dialog(seasonInfo().intro, ctx, () => pickLuckBox(() => dialog(pickFresh(HISTORIA.tallerPrimerDia), ctxWith(pick1(S.rivals)), go)));
    }
    if (S.ep === 1) lines = [...seasonInfo().intro, ...pickFresh(HISTORIA.tallerPrimerDia)];
    else lines = [...pickFresh(HISTORIA.tallerHost), ...(S.out.length ? pickFresh(HISTORIA.tallerTrasExpulsion) : [])];
    dialog(lines, ctx, go);
  }
  // Evento aleatorio del taller: varias reinas y tú eliges bando
  function maybeEvent(then) {
    if (S.rivals.length < 3 || Math.random() < 0.35) return then();
    const ev = pickFresh(HISTORIA.eventos);
    const ctx = ctxWith(pick1(S.rivals));
    dialog(ev.lines, ctx, then, ev.choices);
  }
  // Tiempo libre: eliges con quién hablar y cómo
  function hub(then) {
    header();
    body().innerHTML = `
      <div class="story-card">
        <p class="eyebrow">Taller · tiempo libre</p>
        <h3>¿Con quién quieres hablar?</h3>
        <p class="muted">Solo te da tiempo a una conversación antes del reto.</p>
        <div class="hub-grid">${S.rivals
          .map((q, i) => `<button class="hub-q ${relOf(q) >= 2 ? "ally" : relOf(q) <= -2 ? "enemy" : ""}" style="--i:${i}" data-id="${q.id}"><i style="background-image:url('${photo(q)}')"></i><span>${esc(q.name)}</span><small>${relLabel(q)}</small></button>`)
          .join("")}</div>
        <button class="btn btn-ghost" id="hub-skip">🎯 Concentrarme en mi reto</button>
      </div>`;
    body().querySelectorAll(".hub-q").forEach((b) => b.addEventListener("click", () => approach(qById(b.dataset.id), then)));
    $("#hub-skip").addEventListener("click", () => {
      S.advice += 3;
      Toast.show("🎯 Concentrada", "+3 en el próximo reto");
      then();
    });
  }
  function approach(q, then) {
    body().innerHTML = `
      <div class="story-card intro">
        <img class="story-queen" src="${sprite(q)}" alt="">
        <div>
          <p class="eyebrow">${esc(relLabel(q))}</p>
          <h3>${esc(q.name)}</h3>
          <p>¿Qué quieres hacer?</p>
          <div class="approach-list">${HISTORIA.enfoques
            .map((a) => `<button class="btn btn-ghost role" data-a="${a.id}"><b>${a.icon} ${a.txt}</b><small>${a.desc}</small></button>`)
            .join("")}</div>
          <button class="btn btn-ghost small-btn" id="ap-back">← Elegir a otra</button>
        </div>
      </div>`;
    body().querySelectorAll("[data-a]").forEach((b) => b.addEventListener("click", () => talk(q, b.dataset.a, then)));
    $("#ap-back").addEventListener("click", () => hub(then));
  }
  function talk(q, kind, then) {
    const r = relOf(q);
    const ctx = ctxWith(q);
    const other = ctx.q.r2;
    let lines, after = () => {};
    if (kind === "pina") {
      const mood = r >= 1 ? "buena" : r <= -1 ? "mala" : "neutra";
      lines = pickFresh(HISTORIA.pina[mood]);
      const ok = Math.random() < (mood === "mala" ? 0.5 : 0.85);
      after = () => changeRel(q, ok ? (mood === "buena" ? 1 : 1) : 0);
    } else if (kind === "cotilleo") {
      lines = [...pickFresh(HISTORIA.cotilleo)];
      const caught = other && other !== q && Math.random() < 0.3;
      if (caught) lines.push(...HISTORIA.cotilleoPillada);
      after = () => {
        changeRel(q, 1);
        if (caught) changeRel(other, -2);
      };
    } else if (kind === "consejo") {
      const ok = r >= 0 && Math.random() < 0.8;
      lines = pickFresh(HISTORIA.consejo[ok ? "si" : "no"]);
      after = () => {
        if (ok) {
          S.advice += 6;
          Toast.show("💡 Buen consejo", "+6 en el próximo reto");
        }
      };
    } else {
      lines = pickFresh(HISTORIA.pinchar);
      after = () => {
        changeRel(q, -1);
        S.points += 150;
        S.form[q.id] = (S.form[q.id] || 0) - 3; // la pone nerviosa
      };
    }
    dialog(lines, ctx, () => {
      after();
      then();
    });
  }

  // ------------------------------- Reto ------------------------------------
  function pickReto() {
    return ORDEN_RETOS[(S.ep - 1 + (S.season.id.charCodeAt(2) || 0)) % ORDEN_RETOS.length];
  }
  function announce() {
    const tipo = pickReto();
    const reto = RETOS[tipo];
    const titulo = reto.titulo();
    S.epNames[S.ep] = EP_SHORT[tipo] || "Reto";
    S.curTipo = tipo;
    dialog(pickFresh(HISTORIA.anuncio), ctxWith(pick1(S.rivals), { reto: titulo }), () => challengeIntro(reto, titulo, tipo));
  }

  function challengeIntro(reto, titulo, tipo, onScore) {
    body().innerHTML = `
      <div class="story-card intro">
        <img class="story-queen" src="${sprite(S.queen)}" alt="">
        <div>
          <p class="eyebrow">${isFinal() ? "Top 3 · la última prueba" : `Quedan ${S.rivals.length + 1} reinas`}</p>
          <h3>${esc(titulo)}</h3>
          <p>${reto.desc}</p>
          <p class="muted">🎮 ${reto.ctrl}</p>
          <button class="btn btn-primary" id="story-go">¡Empezar!</button>
        </div>
      </div>`;
    $("#story-go").addEventListener("click", () => {
      body().innerHTML = `<div id="story-play"></div>`;
      Music.play("reto");
      S.team = null;
      reto.run($("#story-play"), (raw) => {
        cleanup = null;
        if (typeof window.__forceScore === "number") raw = window.__forceScore; // solo pruebas
        Music.stop();
        if (raw >= 95) Achievements.unlock("perfecta");
        const bonus = relBonus() + S.advice - (S.helped ? 4 : 0);
        const score = Math.round(clamp(raw + bonus, 0, 100));
        S.lastBonus = bonus;
        (onScore || results)(score, titulo);
      });
    });
  }

  // Resultado de la semana: todo sale de las notas del día (nada predefinido)
  function results(myScore, titulo) {
    const sc = {};
    S.rivals.forEach((q) => (sc[q.id] = rivalScore(q)));
    let teamLine = "";
    const teamOf = {};
    if (S.team) {
      const A = [S.queen, ...S.team], B = S.rivals.filter((q) => !S.team.includes(q));
      const val = (q) => (q === S.queen ? myScore : sc[q.id]);
      const avg = (T) => T.reduce((a, q) => a + val(q), 0) / Math.max(1, T.length);
      const aWins = avg(A) >= avg(B);
      A.forEach((q) => (teamOf[q.id] = "rosa"));
      B.forEach((q) => (teamOf[q.id] = "oro"));
      (aWins ? A : B).forEach((q) => (q === S.queen ? (myScore = Math.min(100, myScore + 8)) : (sc[q.id] = Math.min(99, sc[q.id] + 8))));
      teamLine = `<p class="gold">${aWins ? "🏆 ¡Tu equipo (Rosa) gana el reto por equipos! +8" : "El equipo Oro gana el reto por equipos."}</p>`;
    }
    const rows = [{ q: S.queen, s: myScore, me: true }, ...S.rivals.map((q) => ({ q, s: sc[q.id] }))].sort((a, b) => b.s - a.s);
    const n = rows.length;
    const winner = rows[0];
    const tw = twistOf();
    // T6: bottom de tres (luego decide la moneda)
    const nb = tw === "moneda" && n >= 6 ? 3 : 2;
    let bottomRows = rows.slice(n - nb);
    const notes = [];
    // Salvar a una del bottom: entra la siguiente peor que no esté ya dentro
    const saveRow = (row, how) => {
      const next = rows.slice(0, n - 1).reverse().find((r) => !bottomRows.includes(r) && r !== winner && !r.protected);
      if (!next) return false;
      row.protected = true;
      bottomRows = bottomRows.map((b) => (b === row ? next : b));
      notes.push(`${how} <b>${esc(row.q.name)}</b> se salva y <b>${esc(next.q.name)}</b> entra en el bottom.`);
      return true;
    };
    // Las rivales usan sus comodines solas
    if (tw === "suerte" && S.luck && S.luck !== "me") {
      const holder = qById(S.luck);
      const row = bottomRows.find((r) => r.q === holder);
      if (row && Math.random() < 0.75 && saveRow(row, `🍀 ¡Sorpresa! ${esc(holder.name)} tenía la reina de la suerte:`)) S.luck = null;
    }
    if (tw === "corazon") {
      bottomRows.filter((r) => !r.me && (S.hearts[r.q.id] || 0) >= 2).forEach((r) => {
        if (Math.random() < 0.7 && saveRow(r, "❤️ Gasta un corazón:")) S.hearts[r.q.id] -= 2;
      });
    }

    const finish = () => {
      const myPos = rows.findIndex((r) => r.me);
      const bottom = bottomRows.some((r) => r.me);
      const won = myPos === 0;
      rows.forEach((r) => {
        const k = keyOf(r.q);
        S.record[k] = (S.record[k] || 0) + (r === winner ? 3 : bottomRows.includes(r) ? 0 : 1);
        if (!r.me) S.form[r.q.id] = clamp((S.form[r.q.id] || 0) + (r === winner ? 2 : bottomRows.includes(r) ? 3 : 0) + rnd(-2, 2), -10, 10);
      });
      S.points += myScore * 10 + (won ? 500 : 0);
      if (won) S.wins++;
      if (bottom) S.bottoms++;
      S.streak = won ? S.streak + 1 : 0;
      if (S.streak >= 3) Achievements.unlock("racha");
      const b = S.lastBonus || 0;
      const bonusLine = b ? `<p class="${b > 0 ? "gold" : "muted"}">${b > 0 ? `💞 Consejos, aliadas y concentración: +${b}` : `🗡️ Tus enemigas te lo han puesto difícil: ${b}`}</p>` : "";
      const top2 = rows.slice(0, 2);
      rows.forEach((r, k) => {
        let lab;
        if (tw === "allstars" && top2.includes(r)) lab = "TOP2";
        else if (r === winner) lab = "WIN";
        else if (bottomRows.includes(r)) lab = `BTM${nb}`;
        else if (r.protected) lab = "LOW";
        else if (k <= 2 && k < n - nb - 1) lab = "HIGH";
        else if (k >= n - nb - 2) lab = "LOW";
        else lab = "SAFE";
        mark(r.q, lab);
      });
      const badge = (r) =>
        tw === "allstars" && top2.includes(r) ? `<b class="tag win">Top 2</b>` : r === winner ? `<b class="tag win">Ganadora del reto</b>` : bottomRows.includes(r) ? `<b class="tag btm">Bottom ${nb}</b>` : r.protected ? `<b class="tag safe">Salvada</b>` : `<b class="tag safe">A salvo</b>`;
      header();
      body().innerHTML = `
        <div class="story-card">
          <p class="eyebrow">${esc(titulo)} · resultados</p>
          <h3>${tw === "allstars" && top2.some((r) => r.me) ? "¡Estás en el top 2! 💄" : won ? "¡Has ganado el reto! 👑" : bottom ? `Estás en el bottom ${nb}...` : "Estás a salvo"}</h3>
          <p class="muted">Tu puntuación: <b>${myScore}</b>/100</p>
          ${bonusLine}${teamLine}${notes.map((t) => `<p class="twist-note">${t}</p>`).join("")}
          <ol class="ranking">${rows
            .map((r, k) => `<li style="--i:${k}" class="${r.me ? "me" : ""}"><i style="background-image:url('${photo(r.q)}')"></i><span>${esc(r.q.name)}${teamOf[r.q.id] ? ` <small class="team ${teamOf[r.q.id]}">${teamOf[r.q.id] === "rosa" ? "Rosa" : "Oro"}</small>` : ""}</span>${badge(r)}<em>${Math.round(r.s)}</em></li>`)
            .join("")}</ol>
          <button class="btn btn-primary" id="story-next">Continuar</button>
        </div>`;
      $("#story-next").addEventListener("click", () => {
        const crit = buildCritique(myScore, won ? "win" : bottom ? "bottom" : "safe");
        dialog(crit, { ...ctxWith(pick1(S.rivals)), tension: bottom }, () =>
          untucked({ winner, bottomRows }, () =>
            (tw === "moneda" && bottomRows.length === 3 ? coinFlip : (x, cb) => cb(x.bottomRows))({ winner, bottomRows }, (pair) =>
              elimination({ winner, bottomRows: pair, top2: rows.slice(0, 2) }),
            ),
          ),
        );
      });
    };

    // Tus comodines: decides tú
    const opts = [];
    if (tw === "suerte" && S.luck === "me") {
      bottomRows.forEach((r) => opts.push({ row: r, kind: "suerte", label: r.me ? "🍀 Usar la reina de la suerte para salvarme" : `🍀 Usarla para salvar a ${r.q.name}` }));
    }
    if (tw === "corazon" && (S.hearts.me || 0) >= 2) {
      const mine = bottomRows.find((r) => r.me);
      if (mine) opts.push({ row: mine, kind: "corazon", label: "❤️ Gastar un corazón para salvarme" });
    }
    if (!opts.length) return finish();
    body().innerHTML = `
      <div class="story-card">
        <p class="eyebrow">${bottomRows.some((r) => r.me) ? "¡Estás en el bottom!" : "Momento de decidir"}</p>
        <h3>¿Usas tu comodín?</h3>
        <p>En el bottom están: ${bottomRows.map((r) => `<b>${esc(r.me ? "tú" : r.q.name)}</b>`).join(" y ")}. Si salvas a alguien, la siguiente con peor nota ocupa su sitio. Solo se usa una vez.</p>
        <div class="choice-col">${opts.map((o, i) => `<button class="btn btn-ghost" data-o="${i}">${esc(o.label)}</button>`).join("")}
          <button class="btn btn-primary" id="keep">Guardarlo para más adelante</button></div>
      </div>`;
    body().querySelectorAll("[data-o]").forEach((b) =>
      b.addEventListener("click", () => {
        const o = opts[+b.dataset.o];
        if (saveRow(o.row, o.kind === "suerte" ? "🍀 ¡Sacas la reina de la suerte!" : "❤️ ¡Gastas un corazón!")) {
          if (o.kind === "suerte") S.luck = null;
          else S.hearts.me -= 2;
          if (!o.row.me) {
            changeRel(o.row.q, 3);
            const worstRow = bottomRows.concat([o.row]).sort((a, b) => a.s - b.s)[0];
            remember(o.row.q, "salvada", o.row !== worstRow);
          }
          Confetti.burst(1500);
        } else Toast.show("No se puede usar ahora", "No hay nadie que pueda ocupar ese sitio");
        finish();
      }),
    );
    $("#keep").addEventListener("click", finish);
  }

  // T6: la moneda. Cara: las salvadas votan a quién salvar. Cruz: a quién condenar.
  function coinFlip({ winner, bottomRows }, then) {
    const three = bottomRows.map((r) => r.q);
    const cara = Math.random() < 0.5;
    const voters = [S.queen, ...S.rivals].filter((q) => !three.includes(q));
    const meVoter = voters.includes(S.queen);
    body().innerHTML = `
      <div class="story-card">
        <p class="eyebrow">🪙 La moneda</p>
        <h3>Supreme lanza la moneda al aire...</h3>
        <div class="coin-wrap"><div class="coin ${cara ? "cara" : "cruz"}"><b>CARA</b><b>CRUZ</b></div></div>
        <p class="coin-res">¡Ha salido <b>${cara ? "CARA" : "CRUZ"}</b>!</p>
        <p>${cara ? "Las compañeras salvadas votan a la cara a qué reina del bottom quieren <b>SALVAR</b>." : "Las compañeras salvadas votan a la cara a qué reina del bottom quieren <b>CONDENAR</b> al lip sync."}</p>
        <div class="vs three">${three.map((q) => `<img src="${photo(q)}" title="${esc(q.name)}">`).join("")}</div>
        <button class="btn btn-primary" id="story-next">${meVoter ? "Votar" : "Ver la votación"}</button>
      </div>`;
    Music.play("tension");
    const tally = (myVote) => {
      const votes = new Map(three.map((q) => [q, []]));
      voters.forEach((v) => {
        let choice;
        if (v === S.queen) choice = myVote;
        else {
          // Cada rival vota según cómo le caen (y a ti según vuestra relación)
          const score = (q) => (q === S.queen ? relOf(v) * 1.5 : rnd(-1.5, 1.5)) + rnd(-1, 1);
          const sorted = three.slice().sort((a, b) => score(b) - score(a));
          choice = cara ? sorted[0] : sorted[sorted.length - 1];
        }
        votes.get(choice).push(v);
      });
      const ranked = three.slice().sort((a, b) => votes.get(b).length - votes.get(a).length || Math.random() - 0.5);
      const chosen = ranked[0];
      const scoreOf = (q) => (bottomRows.find((r) => r.q === q) || {}).s || 0;
      let pair;
      if (cara) pair = three.filter((q) => q !== chosen);
      else pair = [chosen, three.filter((q) => q !== chosen).sort((a, b) => scoreOf(a) - scoreOf(b))[0]];
      // Votar a la cara tiene consecuencias
      if (meVoter && myVote !== S.queen) {
        changeRel(myVote, cara ? 2 : -2);
        // ¿Era la peor de las tres? Se acordará
        const worst = three.slice().sort((a, b) => scoreOf(a) - scoreOf(b))[0];
        remember(myVote, cara ? "salvada" : "condenada", cara ? myVote !== worst : myVote === worst);
      }
      if (three.includes(S.queen)) voters.forEach((v) => votes.get(S.queen).includes(v) && v !== S.queen && (cara ? changeRel(v, 1) : changeRel(v, -1)));
      body().innerHTML = `
        <div class="story-card">
          <p class="eyebrow">🪙 ${cara ? "Cara: votos para salvar" : "Cruz: votos para condenar"}</p>
          <h3>${cara ? `${esc(chosen === S.queen ? "¡Te salvan a ti!" : chosen.name + " se salva")}` : `${esc(chosen === S.queen ? "Te condenan a ti al lip sync" : chosen.name + " va directa al lip sync")}`}</h3>
          <div class="votes">${three
            .map((q) => `<div class="vote-col ${q === chosen ? "top" : ""}"><i style="background-image:url('${photo(q)}')"></i><b>${esc(q === S.queen ? "Tú" : q.name)}</b><span>${votes.get(q).length} voto${votes.get(q).length === 1 ? "" : "s"}</span><div class="voters">${votes
              .get(q)
              .map((v) => `<img src="${photo(v)}" title="${esc(v.name)}">`)
              .join("")}</div></div>`)
            .join("")}</div>
          <p>Al lip sync: <b>${pair.map((q) => esc(q === S.queen ? "tú" : q.name)).join("</b> y <b>")}</b>.</p>
          <button class="btn btn-primary" id="story-next">Continuar</button>
        </div>`;
      $("#story-next").addEventListener("click", () => then(pair.map((q) => bottomRows.find((r) => r.q === q))));
    };
    $("#story-next").addEventListener("click", () => {
      if (!meVoter) return tally(null);
      body().innerHTML = `
        <div class="story-card">
          <p class="eyebrow">🪙 ${cara ? "Cara" : "Cruz"} · tu voto es público</p>
          <h3>${cara ? "¿A quién SALVAS?" : "¿A quién CONDENAS al lip sync?"}</h3>
          <p class="muted">Todas verán lo que votas.</p>
          <div class="hub-grid">${three
            .map((q, i) => `<button class="hub-q ${relOf(q) >= 2 ? "ally" : relOf(q) <= -2 ? "enemy" : ""}" style="--i:${i}" data-id="${q.id}"><i style="background-image:url('${photo(q)}')"></i><span>${esc(q.name)}</span><small>${relLabel(q)}</small></button>`)
            .join("")}</div>
        </div>`;
      body().querySelectorAll("[data-id]").forEach((b) => b.addEventListener("click", () => tally(qById(b.dataset.id))));
    });
  }

  // T4: al empezar, cada reina elige una cajita. Una esconde a la reina de la suerte
  function pickLuckBox(then) {
    const all = [S.queen, ...S.rivals];
    const winnerIdx = Math.floor(Math.random() * all.length);
    body().innerHTML = `
      <div class="story-card">
        <p class="eyebrow">🍀 La reina de la suerte</p>
        <h3>Elige tu cajita</h3>
        <p>En una de ellas está la reina de la suerte: podrás usarla una vez para salvarte, o salvar a una compañera, del lip sync.</p>
        <div class="boxes">${all.map((_, i) => `<button class="box" data-b="${i}" style="--i:${i}">🎁</button>`).join("")}</div>
      </div>`;
    body().querySelectorAll("[data-b]").forEach((b) =>
      b.addEventListener("click", () => {
        const mine = +b.dataset.b;
        // Las demás cogen las cajas que quedan
        const others = shuffle(S.rivals);
        let k = 0;
        const owner = all.map((_, i) => (i === mine ? S.queen : others[k++]));
        const lucky = owner[winnerIdx];
        S.luck = keyOf(lucky);
        // Es secreto: solo ves lo que hay en TU caja
        body().querySelectorAll(".box").forEach((x, i) => {
          x.disabled = true;
          if (i === mine) {
            x.classList.add("open", "mine");
            x.innerHTML = i === winnerIdx ? "🍀" : "✖";
          } else x.classList.add("closed");
        });
        setTimeout(() => {
          header();
          Toast.show(lucky === S.queen ? "🍀 ¡Te ha tocado a TI!" : "✖ Tu caja está vacía", lucky === S.queen ? "Nadie lo sabe. Guárdala para el momento justo" : "Alguna compañera la tiene... pero nadie dice quién");
          then();
        }, 1600);
      }),
    );
  }

  // T5: cada eliminada deja medio corazón a una compañera
  function legacyHeart(gone, then) {
    if (twistOf() !== "corazon" || !S.rivals.length) return then && then();
    const cands = S.meOut ? S.rivals : [S.queen, ...S.rivals];
    const toMe = !S.meOut && Math.random() < 0.15 + 0.25 * Math.max(0, relOf(gone) + 1);
    const to = toMe ? S.queen : pick1(S.rivals);
    const k = keyOf(to);
    S.hearts[k] = (S.hearts[k] || 0) + 1;
    header();
    Toast.show(`💔 ${gone.name} deja medio corazón`, to === S.queen ? `¡Para ti! Llevas ${(S.hearts.me || 0) / 2} corazones` : `Para ${to.name}`);
    if (then) then();
  }

  // Untucked: eliges a quién te acercas
  function untucked(res, then) {
    if (S.rivals.length < 2) return then();
    const opts = [];
    const add = (q, kind, label) => q && q !== S.queen && S.rivals.includes(q) && !opts.some((o) => o.q === q) && opts.push({ q, kind, label });
    if (!res.winner.me) add(res.winner.q, "ganadora", "👑 Felicitar a la ganadora");
    res.bottomRows.filter((r) => !r.me).forEach((r) => add(r.q, "bottom", "🫂 Animar a una del bottom"));
    const ally = allies()[0];
    if (ally) add(ally, "aliada", "💞 Hablar con tu aliada");
    const enemy = enemies()[0];
    if (enemy) add(enemy, "enemiga", "🗡️ Encararte con tu enemiga");
    body().innerHTML = `
      <div class="story-card">
        <p class="eyebrow">Untucked</p>
        <h3>Mientras el jurado delibera...</h3>
        <div class="hub-grid">${opts
          .map((o, i) => `<button class="hub-q ${o.kind === "enemiga" ? "enemy" : o.kind === "aliada" ? "ally" : ""}" style="--i:${i}" data-i="${i}"><i style="background-image:url('${photo(o.q)}')"></i><span>${esc(o.q.name)}</span><small>${o.label}</small></button>`)
          .join("")}</div>
        <button class="btn btn-ghost" id="ut-skip">🍸 Tomarme algo sola</button>
      </div>`;
    body().querySelectorAll("[data-i]").forEach((b) =>
      b.addEventListener("click", () => {
        const o = opts[+b.dataset.i];
        const ctx = ctxWith(o.q);
        if (o.kind === "enemiga") return dialog(HISTORIA.untucked.enemiga[0], ctx, then, HISTORIA.untucked.enemigaChoices);
        dialog(pickFresh(HISTORIA.untucked[o.kind]), ctx, () => {
          changeRel(o.q, o.kind === "bottom" ? 2 : 1);
          then();
        });
      }),
    );
    $("#ut-skip").addEventListener("click", then);
  }

  // Quién se va esta semana
  function elimination({ winner, bottomRows, top2 }) {
    const meBottom = bottomRows.some((r) => r.me);
    const others = bottomRows.filter((r) => !r.me).map((r) => r.q);
    if (twistOf() === "allstars") return topLipSync(top2, (dec) => allStarsDecision(dec, bottomRows));
    if (meBottom) return lipSync(others[0], false);
    const [a, b] = others;
    // Doble sashay (muy raro)
    if (!S.flags.dsashay && S.rivals.length >= 7 && Math.random() < 0.08) {
      S.flags.dsashay = true;
      eliminate(a);
      eliminate(b);
      header();
      body().innerHTML = `
        <div class="story-card">
          <p class="eyebrow">¡Momento histórico!</p>
          <h3>Doble sashay away</h3>
          <div class="vs"><img class="gone" src="${photo(a)}"><span>✖</span><img class="gone" src="${photo(b)}"></div>
          <p>Ninguna ha convencido. <b>${esc(a.name)}</b> y <b>${esc(b.name)}</b> se van las dos a casa.</p>
          <button class="btn btn-primary" id="story-next">Siguiente episodio</button>
        </div>`;
      return endEpisodeBtn();
    }
    const pa = clamp(0.5 + (skillOf(a) + (S.form[a.id] || 0) - skillOf(b) - (S.form[b.id] || 0)) / 40, 0.2, 0.8);
    const [stay, go] = Math.random() < pa ? [a, b] : [b, a];
    eliminate(go);
    header();
    body().innerHTML = `
      <div class="story-card">
        <p class="eyebrow">Lip sync for your life</p>
        <h3>${esc(stay.name)} vs ${esc(go.name)}</h3>
        <p class="muted">${esc(fill(pickFresh(HISTORIA.lipsyncOtras), { a: stay.name, b: go.name }))}</p>
        <div class="vs"><img src="${photo(stay)}"><span>VS</span><img class="gone" src="${photo(go)}"></div>
        <p><b>${esc(stay.name)}</b>, shantay you stay. <b>${esc(go.name)}</b>, sashay away.</p>
        <button class="btn btn-primary" id="story-next">Siguiente episodio</button>
      </div>`;
    endEpisodeBtn();
  }

  // All Stars: las dos del top hacen lip sync; la ganadora elige a quién mandar a casa
  function topLipSync(top2, then) {
    const [a, b] = top2;
    const meTop = top2.find((r) => r.me);
    if (meTop) {
      const rival = top2.find((r) => !r.me).q;
      body().innerHTML = `
        <div class="story-card">
          <p class="eyebrow">💄 Lip sync por el poder</p>
          <h3>${esc(S.queen.name)} vs ${esc(rival.name)}</h3>
          <div class="vs"><img src="${photo(S.queen)}"><span>VS</span><img src="${photo(rival)}"></div>
          <p>La que gane decide quién de las dos del bottom se va a casa.</p>
          <button class="btn btn-primary" id="story-ls">¡A la pasarela!</button>
        </div>`;
      Music.play("tension");
      $("#story-ls").addEventListener("click", () =>
        Curtain.run(() => {
          Music.stop();
          UI.show("game");
          Game.start(Wardrobe.boosted(S.queen), S.season, (res) => {
            UI.show("story");
            header();
            S.points += Math.round(res.score || 0);
            if (res.won) {
              S.lipsyncs++;
              S.points += 1000;
              if (S.lipsyncs >= 3) Achievements.unlock("superviviente");
              Toast.show("💄 ¡Has ganado el lip sync!", "Tienes el poder de decidir");
              mark(S.queen, "WIN");
              return then({ q: S.queen, me: true });
            }
            Toast.show(`💄 ${rival.name} gana el lip sync`, "Ella decide");
            mark(rival, "WIN");
            then({ q: rival });
          }, { rivals: [rival], story: true });
        }, "LIP SYNC POR EL PODER"),
      );
      return;
    }
    const pa = clamp(0.5 + (skillOf(a.q) + (S.form[a.q.id] || 0) - skillOf(b.q) - (S.form[b.q.id] || 0)) / 40, 0.25, 0.75);
    const [w, l] = Math.random() < pa ? [a.q, b.q] : [b.q, a.q];
    header();
    body().innerHTML = `
      <div class="story-card">
        <p class="eyebrow">💄 Lip sync por el poder</p>
        <h3>${esc(w.name)} vs ${esc(l.name)}</h3>
        <p class="muted">${esc(fill(pickFresh(HISTORIA.lipsyncOtras), { a: w.name, b: l.name }))}</p>
        <div class="vs"><img src="${photo(w)}"><span>👑</span><img src="${photo(l)}"></div>
        <p><b>${esc(w.name)}</b> gana y tiene el pintalabios: decide quién se va.</p>
        <button class="btn btn-primary" id="story-next">Continuar</button>
      </div>`;
    mark(w, "WIN");
    $("#story-next").addEventListener("click", () => then({ q: w }));
  }

  // All Stars: la ganadora del lip sync del top decide quién se va
  function allStarsDecision(winner, bottomRows) {
    const pair = bottomRows.map((r) => r.q);
    if (winner.me) {
      body().innerHTML = `
        <div class="story-card">
          <p class="eyebrow">💄 Has ganado: tú decides</p>
          <h3>¿A quién mandas a casa?</h3>
          <p>La que salves te lo agradecerá. La que se vaya... no lo olvidará.</p>
          <div class="hub-grid two">${pair
            .map((q, i) => `<button class="hub-q ${relOf(q) >= 2 ? "ally" : relOf(q) <= -2 ? "enemy" : ""}" style="--i:${i}" data-id="${q.id}"><i style="background-image:url('${photo(q)}')"></i><span>${esc(q.name)}</span><small>${relLabel(q)}</small></button>`)
            .join("")}</div>
        </div>`;
      body().querySelectorAll("[data-id]").forEach((b) =>
        b.addEventListener("click", () => {
          const go = qById(b.dataset.id), stay = pair.find((x) => x !== go);
          changeRel(stay, 2);
          S.rivals.filter((r) => relOf(r) >= 1 && Math.random() < 0.4 && r !== stay).slice(0, 1).forEach((r) => changeRel(r, -1));
          const sOf = (q) => (bottomRows.find((r) => r.q === q) || {}).s || 0;
          const goWasWorst = sOf(go) <= sOf(stay);
          remember(stay, "salvada", !goWasWorst);
          eliminate(go);
          return dialog(pickFresh(goWasWorst ? MEMORIA.despedida.justa : MEMORIA.despedida.injusta), { ...ctxWith(go), q: { r1: go }, r1: go.name, tension: true }, () => showASResult(go, stay));
        }),
      );
      return;
      function showASResult(go, stay) {
          header();
          body().innerHTML = `
            <div class="story-card">
              <p class="eyebrow">El pintalabios ha hablado</p>
              <h3>${esc(go.name)}, sashay away</h3>
              <div class="vs"><img src="${photo(stay)}"><span>💄</span><img class="gone" src="${photo(go)}"></div>
              <p>Has salvado a <b>${esc(stay.name)}</b>.</p>
              <button class="btn btn-primary" id="story-next">Siguiente episodio</button>
            </div>`;
          endEpisodeBtn();
      }
    }
    const dec = winner.q;
    const meIn = pair.includes(S.queen);
    let go;
    if (meIn) {
      const other = pair.find((x) => x !== S.queen);
      const likeMe = relOf(dec) + rnd(-1, 1), likeOther = rnd(-1.5, 1.5);
      go = likeMe >= likeOther ? other : S.queen;
    } else go = skillOf(pair[0]) + rnd(-10, 10) < skillOf(pair[1]) + rnd(-10, 10) ? pair[0] : pair[1];
    const stay = pair.find((x) => x !== go);
    const lines = [["r1", meIn ? (go === S.queen ? "Lo siento, {yo}... Es una decisión muy difícil, pero he elegido a la otra." : "{yo}, esta semana me quedo contigo. No me falles.") : "He tomado mi decisión. No es nada personal."]];
    dialog(lines, { ...ctxWith(dec), tension: true }, () => {
      if (go === S.queen) {
        if (twistOf() === "repesca" && !S.flags.repesca) return goHomeRepesca(dec);
        return theEnd(false, dec, false, "La ganadora del reto ha decidido que te vas.");
      }
      if (meIn) changeRel(dec, 1);
      eliminate(go);
      header();
      body().innerHTML = `
        <div class="story-card">
          <p class="eyebrow">${esc(dec.name)} ha decidido</p>
          <h3>${esc(go.name)}, sashay away</h3>
          <div class="vs"><img src="${photo(stay)}"><span>💄</span><img class="gone" src="${photo(go)}"></div>
          <button class="btn btn-primary" id="story-next">Siguiente episodio</button>
        </div>`;
      endEpisodeBtn();
    });
  }

  function eliminate(q) {
    if (S.track[q.id] && S.track[q.id][S.ep] && S.epNames[S.ep] !== "Final") mark(q, "ELIM");
    S.rivals = S.rivals.filter((r) => r !== q);
    S.out.unshift(q);
    legacyHeart(q);
  }

  function lipSync(rival, forCrown, onWin) {
    body().innerHTML = `
      <div class="story-card">
        <p class="eyebrow">${forCrown ? "Lip sync por la corona" : onWin ? "Lip sync de la repesca" : "Lip sync for your life"}</p>
        <h3>${esc(S.queen.name)} vs ${esc(rival.name)}</h3>
        <div class="vs"><img src="${photo(S.queen)}"><span>VS</span><img src="${photo(rival)}"></div>
        <p>${forCrown ? "Una ronda, una corona." : onWin ? "Si ganas, vuelves a la competición." : "Gana el duelo de tacones o te vas a casa."}</p>
        <button class="btn btn-primary" id="story-ls">¡A la pasarela!</button>
      </div>`;
    Music.play("tension");
    $("#story-ls").addEventListener("click", () => Curtain.run(() => {
      Music.stop();
      UI.show("game");
      Game.start(Wardrobe.boosted(S.queen), S.season, (res) => {
        UI.show("story");
        S.points += Math.round(res.score || 0);
        if (res.won) {
          S.lipsyncs++;
          S.points += forCrown ? 5000 : 1000;
          if (S.lipsyncs >= 3) Achievements.unlock("superviviente");
        }
        header();
        if (onWin) return res.won ? onWin(rival) : theEnd(false, rival, false, "La repesca no ha salido bien.");
        if (!res.won && !forCrown && !S.flags.dshantay && Math.random() < 0.15) {
          S.flags.dshantay = true;
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
          return endEpisodeBtn();
        }
        if (!res.won) {
          if (!forCrown && twistOf() === "repesca" && !S.flags.repesca) return goHomeRepesca(rival);
          return theEnd(false, rival, forCrown);
        }
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
        endEpisodeBtn();
      }, { rivals: [rival], story: true });
    }, forCrown ? "LIP SYNC POR LA CORONA" : onWin ? "LA REPESCA" : "LIP SYNC FOR YOUR LIFE"));
  }

  // ------------------------------ Repesca (T3) ------------------------------
  // Si te eliminan antes de la repesca, esperas en casa y vuelves a intentarlo
  function goHomeRepesca(by) {
    S.meOut = true;
    const log = [];
    // La temporada sigue sin ti hasta la mitad
    while (S.rivals.length > Math.ceil(S.season.cast.length / 2) - 1 && S.rivals.length > 3) {
      const sorted = S.rivals.slice().sort((a, b) => rivalScore(a) - rivalScore(b));
      const go = sorted[0];
      S.ep++;
      S.epNames[S.ep] = "Sin ti";
      sorted.forEach((q, k) => mark(q, k === sorted.length - 1 ? "WIN" : k <= 1 ? "BTM2" : "SAFE"));
      eliminate(go);
      log.push(go);
    }
    header();
    body().innerHTML = `
      <div class="story-card">
        <p class="eyebrow">Te vas a casa... de momento</p>
        <h3>Sashay away, ${esc(S.queen.name)}</h3>
        <p>Pero esta temporada tiene <b>repesca</b>. Mientras esperas, la competición sigue:</p>
        <ol class="ranking">${log.map((q, k) => `<li style="--i:${k}"><i style="background-image:url('${photo(q)}')"></i><span>${esc(q.name)}</span><b class="tag btm">Eliminada</b></li>`).join("") || "<li>Nadie más se ha ido todavía.</li>"}</ol>
        <button class="btn btn-primary" id="story-next">¡Llega la repesca!</button>
      </div>`;
    $("#story-next").addEventListener("click", () => {
      save();
      repesca(() => nextEpisode());
    });
  }
  function repesca(then) {
    S.flags.repesca = true;
    header();
    const pool = S.out.slice();
    if (S.meOut) {
      const rival = pick1(pool);
      return dialog(
        [["host", "¡Reinas eliminadas, ha llegado el momento! Solo una vuelve a la competición."], ["r1", "{yo}, no te lo voy a poner fácil."]],
        { ...ctxWith(rival), tension: true },
        () =>
          lipSync(rival, false, () => {
            S.meOut = false;
            Toast.show("🔁 ¡Has vuelto!", "Segunda oportunidad");
            header();
            body().innerHTML = `
              <div class="story-card">
                <p class="eyebrow">🔁 La repesca</p>
                <h3>¡${esc(S.queen.name)} vuelve a la competición!</h3>
                <p>Las demás no se lo esperaban. Ahora vas con todo.</p>
                <button class="btn btn-primary" id="story-next">Volver al taller</button>
              </div>`;
            endEpisodeBtn();
          }),
      );
    }
    const back = pool.sort((a, b) => skillOf(b) + rnd(-12, 12) - skillOf(a))[0];
    S.out = S.out.filter((q) => q !== back);
    S.rivals.push(back);
    header();
    dialog(
      [["host", "Reinas, antes de empezar... ¡ha llegado la repesca!"], ["host", "Las eliminadas se han batido en un lip sync y una vuelve a la competición."], ...HISTORIA.regresoVuelve],
      ctxWith(back),
      then,
      [
        { txt: "¡Bienvenida de nuevo, {r1}!", rel: { r1: 1 }, reply: ["r1", "¡Gracias, reina! Esta vez voy a por todas."] },
        { txt: "Pues ya somos una más para echar...", rel: { r1: -1 }, bonus: 80, reply: ["r1", "Tranquila, que empiezo por ti."] },
      ],
    );
  }

  // --------------------------------- Final ---------------------------------
  function finale() {
    const reto = RETOS.pasarela;
    const titulo = "La pasarela de coronación";
    dialog(pickFresh(HISTORIA.final), ctxWith(S.rivals[0]), () =>
      challengeIntro(reto, titulo, "pasarela", (score) => {
        if (S.bottoms === 0) Achievements.unlock("sin-bottom");
        S.points += score * 10;
        // Top 2: suma del historial de la temporada y la pasarela final
        const total = (q) => (S.record[keyOf(q)] || 0) * 6 + (q === S.queen ? score : rivalScore(q));
        const ranked = [S.queen, ...S.rivals].map((q) => ({ q, t: total(q) })).sort((a, b) => b.t - a.t);
        const third = ranked[2].q;
        S.epNames[S.ep] = "Final";
        ranked.forEach((r, k) => mark(r.q, k < 2 ? "FINAL" : "3ª"));
        header();
        body().innerHTML = `
          <div class="story-card">
            <p class="eyebrow">Pasarela final · ${score}/100</p>
            <h3>${third === S.queen ? "Terminas en tercer lugar" : `${esc(third.name)} termina en tercer lugar`}</h3>
            <ol class="ranking">${ranked.map((r, k) => `<li style="--i:${k}" class="${r.q === S.queen ? "me" : ""}"><i style="background-image:url('${photo(r.q)}')"></i><span>${esc(r.q.name)}</span>${k < 2 ? `<b class="tag win">Top 2</b>` : `<b class="tag safe">3ª</b>`}<em>${Math.round(r.t)}</em></li>`).join("")}</ol>
            <button class="btn btn-primary" id="story-next">${third === S.queen ? "Ver resultado" : "Lip sync por la corona"}</button>
          </div>`;
        $("#story-next").addEventListener("click", () => {
          if (third === S.queen) return theEnd(false, ranked[0].q, false, "Te has quedado a las puertas del top 2.", 3);
          eliminate(third);
          lipSync(S.rivals[0], true);
        });
      }),
    );
  }

  function theEndRebind(q, s) {
    $("#story-menu").addEventListener("click", () => { abandon(); UI.show("menu"); });
    $("#story-again").addEventListener("click", () => start(q, s));
    $("#story-scores").addEventListener("click", () => { UI.scoresTab("story"); UI.show("scores"); });
    $("#story-track").addEventListener("click", () => showTrack(() => { body().innerHTML = S.endHTML; theEndRebind(q, s); }, "Volver"));
  }
  function theEnd(won, rival, forCrown, reason, forcedPlace) {
    const place = forcedPlace || (won ? 1 : forCrown ? 2 : S.rivals.length + 1);
    S.finished = true;
    S.wonAll = won;
    if (S.epNames[S.ep] === "Final") {
      if (won) { mark(S.queen, "WINNER"); if (rival) mark(rival, "RUNNER-UP"); }
      else if (forCrown) { mark(S.queen, "RUNNER-UP"); mark(rival, "WINNER"); }
    } else if (!won && S.track.me && S.track.me[S.ep]) mark(S.queen, "ELIM");
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
          <p>${won ? "La corona es tuya. Condragulations." : reason || `${esc(rival.name)} te ha ganado el lip sync.`}</p>
          <p class="story-pts">${entry.score.toLocaleString("es-ES")} puntos · +${earned} ✨</p>
          <p class="muted">Retos ganados: ${S.wins} · Veces en el bottom: ${S.bottoms} · Lip syncs ganados: ${S.lipsyncs} · Aliadas: ${allies().length}</p>
          ${pos >= 0 ? `<label class="name-entry active story-name">Puesto ${pos + 1} del Top 10 de historia. Tu nombre:
            <input id="story-name" maxlength="12" autocomplete="off" spellcheck="false" placeholder="Tu nombre" value="${esc(entry.name)}"></label>` : ""}
          <div class="row">
            <button class="btn btn-ghost" id="story-menu">Menú</button>
            <button class="btn btn-ghost" id="story-track">📊</button>
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
    S.endHTML = body().innerHTML;
    $("#story-track").addEventListener("click", () => showTrack(() => { body().innerHTML = S.endHTML; theEndRebind(q, s); }, "Volver"));
    $("#story-scores").addEventListener("click", () => { UI.scoresTab("story"); UI.show("scores"); });
  }

  // ------------------------- Reto por equipos ------------------------------
  function runEquipos(el, done) {
    // Tu equipo: la mitad del reparto, con preferencia por tus aliadas.
    // La que se va esta semana (rivals[0]) y la otra del bottom van al equipo Oro.
    const size = Math.max(1, Math.floor((S.rivals.length + 1) / 2) - 1);
    const pool = S.rivals.slice().sort((a, b) => relOf(b) - relOf(a) || Math.random() - 0.5);
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
          <div class="sg-host"><span>🎤 Supreme pregunta</span><p id="sg-q"></p></div>
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
      function stop() { cancelAnimationFrame(raf); document.removeEventListener("keydown", onKey); }
      document.addEventListener("keydown", onKey);
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
