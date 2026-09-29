// ---------------------------------------------------------------------------
// Interfaz: pantallas, elección de reina, puntuaciones, pausa, sonido,
// escalado y controles táctiles
// ---------------------------------------------------------------------------
const UI = (() => {
  const $ = (s) => document.querySelector(s);
  const fmt = (n) => Math.round(n).toLocaleString("es-ES");
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
  const queenById = (id) => QUEENS.find((q) => q.id === id);

  const screens = {
    menu: $("#screen-menu"),
    franchise: $("#screen-franchise"),
    season: $("#screen-season"),
    select: $("#screen-select"),
    game: $("#screen-game"),
    scores: $("#screen-scores"),
    end: $("#screen-end"),
    story: $("#screen-story"),
  };
  let mode = "arcade"; // "arcade" | "story"
  const pauseOverlay = $("#overlay-pause");
  const btnPause = $("#btn-pause");
  const btnMute = $("#btn-mute");
  const btnStart = $("#btn-start");
  const touch = $("#touch-controls");
  let selected = null;
  let currentFranchise = null;
  let currentSeason = null;
  let current = "menu";
  let lastEntryId = null;
  let nextSeason = null;

  // Numera los hijos de las rejillas para la entrada en cascada
  function stagger(root) {
    root.querySelectorAll("#franchise-grid, #season-grid, #queen-grid, #scores-table tbody, #ach-grid, .stats, #unlock-list, .career").forEach((g) => {
      g.classList.add("stagger");
      [...g.children].forEach((c, i) => c.style.setProperty("--i", i));
    });
  }
  function show(name) {
    const prev = screens[current];
    if (prev && current !== name && prev.classList.contains("active")) {
      prev.classList.add("leaving");
      setTimeout(() => prev.classList.remove("leaving"), 300);
    }
    current = name;
    if (name !== "story") Music.stop();
    Wallet.refresh();
    Object.entries(screens).forEach(([k, el]) => el.classList.toggle("active", k === name));
    btnPause.style.visibility = name === "game" ? "visible" : "hidden";
    touch.classList.toggle("active", name === "game");
    showPause(false);
    if (name === "menu") {
      $("#menu-best").textContent = fmt(store.get("dftc-best", 0));
      $("#menu-total").textContent = fmt(Progress.total);
    }
    if (name === "franchise") renderFranchises();
    if (name === "season") renderSeasons();
    if (name === "select") renderGrid();
    if (name === "scores") renderScores();
    stagger(screens[name]);
  }

  function showPause(on) {
    pauseOverlay.classList.toggle("active", on);
  }

  // ---------------------------- Franquicias --------------------------------
  const queenById2 = (id) => QUEENS.find((q) => q.id === id);
  // Fondo con la foto y, debajo, la silueta por si la foto aún no existe
  const portraitBg = (q, sid) => `url('${lookOf(q, sid).portrait}'), url('${q.portrait}'), url('${placeholderSVG(q.name, true)}')`;

  function renderFranchises() {
    const grid = $("#franchise-grid");
    grid.innerHTML = "";
    FRANCHISES.forEach((f) => {
      const won = f.seasons.filter((s) => Progress.hasWon(s.id)).length;
      const faces = [...new Set(f.seasons.flatMap((s) => s.cast.slice(-2)))].slice(0, 6);
      const card = document.createElement("button");
      card.className = "franchise-card" + (f.comingSoon ? " soon" : "");
      card.style.setProperty("--accent", f.color);
      card.innerHTML = `
        <span class="tag">${f.tag}</span>
        <span class="f-name">${esc(f.name)}</span>
        ${
          f.comingSoon
            ? `<span class="soon-badge">Próximamente</span>`
            : `<span class="faces">${faces.map((id) => `<i style="background-image:${portraitBg(queenById2(id))}"></i>`).join("")}</span>
        <span class="f-progress"><span class="progress"><span style="width:${(won / f.seasons.length) * 100}%"></span></span>
        <small>${won}/${f.seasons.length} temporadas ganadas</small></span>`
        }`;
      card.addEventListener("click", () => {
        if (f.comingSoon) {
          Sound.countdown(false);
          return;
        }
        currentFranchise = f;
        show("season");
      });
      grid.append(card);
    });
  }

  function renderSeasons() {
    const f = currentFranchise;
    $("#season-franchise").textContent = (mode === "story" ? "Modo historia · " : "") + f.name;
    $("#season-hint").textContent =
      mode === "story"
        ? "Vive la temporada como concursante: retos, pasarela y lip syncs hasta la corona."
        : "Gana una temporada para desbloquear la siguiente. Cada una es un poco más difícil.";
    const grid = $("#season-grid");
    grid.innerHTML = "";
    allSeasons()
      .filter((s) => s.franchise.id === f.id)
      .forEach((s) => {
        const unlocked = mode === "story" || Progress.isSeasonUnlocked(s);
        const won = Progress.hasWon(s.id);
        const card = document.createElement("button");
        const cover = typeof PORTADAS !== "undefined" && PORTADAS[s.id];
        card.className = "season-card" + (unlocked ? "" : " locked") + (won ? " won" : "") + (cover ? " has-cover" : "");
        card.style.setProperty("--accent", f.color);
        if (cover) card.style.backgroundImage = `linear-gradient(180deg, rgba(20,3,31,.75) 0%, rgba(20,3,31,.15) 28%, rgba(20,3,31,.45) 60%, rgba(20,3,31,.95) 100%), url('${cover}')`;
        card.innerHTML = `
          <span class="s-top"><span class="s-name">${esc(s.name)}</span><span class="s-year">${s.year}</span></span>
          ${cover ? "" : `<span class="faces">${s.cast.slice(0, 7).map((id) => `<i style="background-image:${portraitBg(queenById2(id), s.id)}"></i>`).join("")}${s.cast.length > 7 ? `<b>+${s.cast.length - 7}</b>` : ""}</span>`}
          <span class="s-cast">${s.cast.length} reinas · ${s.enEmision ? "📺 En emisión" : won ? `Ganadora: ${esc(queenById2(s.winner).name)}` : "¿Quién se llevará la corona?"}</span>
          <span class="s-state">${won ? "👑 Ganada" : unlocked ? `Dificultad ${"★".repeat(Math.min(5, s.index + 1))}` : "🔒 Gana la anterior"}</span>`;
        card.addEventListener("click", () => {
          if (!unlocked) {
            Sound.countdown(false);
            return;
          }
          currentSeason = s;
          if (selected && !s.cast.includes(selected.id)) selected = null;
          show("select");
        });
        grid.append(card);
      });
    // Temporadas anunciadas: portada + "Próximamente", no jugables
    (typeof PROXIMAS_TEMPORADAS !== "undefined" ? PROXIMAS_TEMPORADAS : [])
      .filter((t) => t.franchise === f.id)
      .forEach((t) => {
        const cover = typeof PORTADAS !== "undefined" && PORTADAS[t.id];
        const card = document.createElement("button");
        card.className = "season-card soon-season" + (cover ? " has-cover" : "");
        card.style.setProperty("--accent", f.color);
        if (cover) card.style.backgroundImage = `linear-gradient(180deg, rgba(20,3,31,.75) 0%, rgba(20,3,31,.15) 28%, rgba(20,3,31,.45) 60%, rgba(20,3,31,.95) 100%), url('${cover}')`;
        card.innerHTML = `
          <span class="s-top"><span class="s-name">${esc(t.name)}</span><span class="s-year">${t.year}</span></span>
          <span class="soon-badge">Próximamente</span>`;
        card.addEventListener("click", () => Sound.countdown(false));
        grid.append(card);
      });
  }

  // -------------------------- Elección de reina ----------------------------
  const grid = $("#queen-grid");
  const details = $("#queen-details");

  // En arcade, la ganadora de cada temporada se desbloquea al coronarte en el modo historia
  // Arcade: en cada temporada empiezas con una reina; ganar con ella desbloquea la siguiente
  const arcadeUnlocked = (sid) => store.get("dftc-arcade-queens", {})[sid] || 1;
  const lockedArcade = (q) => mode === "arcade" && !!currentSeason && currentSeason.cast.indexOf(q.id) >= arcadeUnlocked(currentSeason.id);
  function unlockNextQueen(season, queenId) {
    const all = store.get("dftc-arcade-queens", {});
    const have = all[season.id] || 1;
    const idx = season.cast.indexOf(queenId);
    if (idx < 0 || idx + 1 !== have || have >= season.cast.length) return null;
    all[season.id] = have + 1;
    store.set("dftc-arcade-queens", all);
    return QUEENS.find((x) => x.id === season.cast[have]);
  }
  function renderGrid() {
    grid.innerHTML = "";
    $("#select-season").textContent = `${currentSeason.franchise.name} · ${currentSeason.name}`;
    const cast = currentSeason.cast.map((id) => QUEENS.find((q) => q.id === id));
    const cols = cast.length > 8 ? 5 : Math.min(cast.length, 4);
    grid.style.width = `${cols * (cast.length > 8 ? 150 : 200) + (cols - 1) * (cast.length > 8 ? 12 : 16)}px`;
    grid.classList.toggle("compact", cast.length > 8);
    cast.forEach((q) => {
      const locked = lockedArcade(q);
      const card = document.createElement("button");
      card.className = "queen-card" + (locked ? " locked" : "") + (selected && selected.id === q.id ? " selected" : "");
      card.dataset.id = q.id;
      card.innerHTML = `
        <span class="portrait" style="background-image:${portraitBg(q, currentSeason && currentSeason.id)}"></span>
        <span class="name">${esc(q.name)}</span>
        <span class="check" aria-hidden="true">✓</span>`;
      card.addEventListener("click", () => selectQueen(q));
      grid.append(card);
    });
    if (selected && !currentSeason.cast.includes(selected.id)) selected = null;
    if (!selected && cast.length === 1) selected = cast[0];
    btnStart.disabled = !selected;
    if (selected) openDetails(selected);
    else details.classList.remove("open");
  }

  function openDetails(q) {
    const locked = lockedArcade(q);
    $("#det-portrait").style.backgroundImage = portraitBg(q, currentSeason && currentSeason.id);
    $("#det-portrait").classList.toggle("locked", locked);
    $("#det-name").textContent = q.name;
    const pos = currentSeason ? currentSeason.cast.indexOf(q.id) : -1;
    const n = currentSeason ? currentSeason.cast.length : 0;
    $("#det-place").textContent =
      pos < 0 ? "" : mode === "story" ? "📖 En la historia, todo depende de ti" : currentSeason.enEmision ? "📺 Temporada en emisión" : pos === n - 1 ? "👑 Ganadora de la temporada" : `Puesto ${n - pos}º de ${n}`;
    $("#det-quote").textContent = q.quote ? `“${q.quote}”` : "";
    const st = Wardrobe.statsOf(q);
    $("#det-stats").innerHTML =
      Object.entries(STAT_LABELS)
        .map(
          ([k, label]) => `
        <div class="stat-row">
          <span>${label}</span>
          <span class="pips">${[1, 2, 3, 4, 5].map((i) => `<i class="${i <= q.stats[k] ? "on" : i <= st[k] ? "on up" : ""}"></i>`).join("")}</span>
          ${Wardrobe.canUpgrade(q, k) ? `<button class="up-btn" data-k="${k}" title="Mejorar en el armario">+ ${Wardrobe.cost(q, k)} ✨</button>` : `<span class="up-max">MAX</span>`}
        </div>`,
        )
        .join("") + `<p class="wallet-line">🧵 Armario · tienes <b class="sequins">${Wallet.balance}</b> lentejuelas ✨</p>`;
    $("#det-stats").querySelectorAll(".up-btn").forEach((b) =>
      b.addEventListener("click", (e) => {
        e.stopPropagation();
        if (Wardrobe.upgrade(q, b.dataset.k)) {
          Music.sfx("coin");
          openDetails(q);
        } else Toast.show("Te faltan lentejuelas", "Gánalas jugando partidas y retos");
      }),
    );
    $("#det-power").textContent = q.power.name;
    $("#det-power-desc").textContent = q.power.desc;
    const prevQ = locked && QUEENS.find((x) => x.id === currentSeason.cast[arcadeUnlocked(currentSeason.id) - 1]);
    $("#det-lock").innerHTML = locked ? `🔒 Gana esta temporada con <b>${esc(prevQ ? prevQ.name : "la anterior")}</b> para desbloquear a la siguiente reina.` : "";
    details.classList.add("open");
  }

  function selectQueen(q) {
    grid.querySelectorAll(".queen-card").forEach((c) => c.classList.toggle("active", c.dataset.id === q.id));
    openDetails(q);
    selected = q;
    grid.querySelectorAll(".queen-card").forEach((c) => c.classList.toggle("selected", c.dataset.id === q.id));
    btnStart.disabled = lockedArcade(q);
    Sound.stopAll();
    if (q.voice) Sound.voice(q.id);
  }

  // ------------------------------ Partida ----------------------------------
  function startGame() {
    if (!selected || !currentSeason) return;
    if (mode === "story") return Story.start(selected, currentSeason);
    if (lockedArcade(selected)) return;
    Achievements.unlock("debut");
    show("game");
    Game.start(Wardrobe.boosted(selected), currentSeason, showEnd);
  }

  function formatTime(s) {
    const m = Math.floor(s / 60);
    return `${m}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
  }

  function showEnd(stats) {
    $("#end-image").src = stats.won ? "./images/shantay.png" : "./images/sashay.png";
    $("#end-title").textContent = stats.won ? "¡La corona es tuya!" : "Sashay away...";
    $("#stat-score").textContent = fmt(stats.score);
    $("#stat-best").textContent = fmt(stats.best);
    $("#stat-rounds").textContent = `${stats.rounds}/${stats.totalRounds}`;
    $("#stat-acc").textContent = `${stats.accuracy}%`;
    $("#stat-combo").textContent = `x${stats.maxCombo}`;
    $("#stat-time").textContent = formatTime(stats.time);
    $("#new-record").classList.toggle("active", stats.isRecord && stats.score > 0);

    const unlockedMsg = $("#unlocked-msg");
    let msg = "";
    if (stats.unlockedSeason) msg = `🔓 ¡Desbloqueada ${stats.seasonObj.franchise.name} · ${stats.unlockedSeason.name}!`;
    else if (stats.won && stats.seasonObj.index === stats.seasonObj.franchise.seasons.length - 1)
      msg = `🏆 ¡Has completado ${stats.seasonObj.franchise.name}!`;
    const newQueen = stats.won ? unlockNextQueen(stats.seasonObj, stats.queen) : null;
    if (newQueen) msg = (msg ? msg + " · " : "") + `👑 ¡Desbloqueada ${newQueen.name}!`;
    const earned = Wallet.add(stats.score / 80);
    if (earned) msg = (msg ? msg + " · " : "") + `+${earned} lentejuelas ✨`;
    if (stats.won) {
      Achievements.unlock("corona-arcade");
      Confetti.burst();
    }
    if (stats.maxCombo >= 20) Achievements.unlock("combo");
    unlockedMsg.textContent = msg;
    unlockedMsg.classList.toggle("active", !!msg);
    $("#btn-change").textContent = stats.unlockedSeason ? "Siguiente temporada" : "Temporadas";
    nextSeason = stats.unlockedSeason ? seasonById(stats.unlockedSeason.id) : null;

    // Entrada en el Top 10: pedir nombre
    lastEntryId = stats.boardPos >= 0 ? stats.id : null;
    const entry = $("#name-entry");
    entry.classList.toggle("active", !!lastEntryId);
    if (lastEntryId) {
      $("#name-label").textContent = `Puesto ${stats.boardPos + 1} del Top 10. Tu nombre:`;
      const input = $("#name-input");
      input.value = store.get("dftc-name", "");
      if (!input.value) Progress.rename(lastEntryId, "Anónima");
      setTimeout(() => input.focus(), 50);
    }

    screens.end.classList.toggle("won", stats.won);
    show("end");
    // Los números suben desde cero
    const el = $("#stat-score"), target = stats.score, t0 = performance.now();
    (function up(t) {
      const k = Math.min(1, (t - t0) / 1100), e = 1 - Math.pow(1 - k, 3);
      el.textContent = fmt(target * e);
      if (k < 1) requestAnimationFrame(up);
    })(t0);
  }

  function saveName() {
    if (!lastEntryId) return;
    const name = $("#name-input").value.trim().slice(0, 12) || "Anónima";
    store.set("dftc-name", name === "Anónima" ? "" : name);
    Progress.rename(lastEntryId, name);
  }
  $("#name-input").addEventListener("input", saveName);
  $("#name-input").addEventListener("keydown", (e) => {
    e.stopPropagation(); // que escribir no active atajos del juego
    if (e.key === "Enter") e.target.blur();
  });

  // ---------------------------- Puntuaciones -------------------------------
  let scoresTab = "arcade";
  const seasonTag = (id) => {
    const s = id && seasonById(id);
    return s ? `<small class="muted">${esc(s.franchise.tag)} ${esc(s.name.replace("Temporada ", "T").replace("All Stars ", ""))}</small> ` : "";
  };
  function renderAchievements() {
    const done = Achievements.done;
    $("#ach-grid").innerHTML =
      `<p class="ach-sum">${Object.keys(done).length}/${LOGROS.length} logros · <b class="sequins">${Wallet.balance}</b> lentejuelas ✨</p>` +
      LOGROS.map((l) => `<div class="ach ${done[l.id] ? "done" : ""}"><i>${done[l.id] ? l.icon : "🔒"}</i><div><strong>${esc(l.name)}</strong><small>${esc(l.desc)}</small></div><em>+${l.reward} ✨</em></div>`).join("");
  }
  function renderScores() {
    const logros = scoresTab === "logros";
    $(".scores-layout").style.display = logros ? "none" : "";
    $("#ach-grid").style.display = logros ? "" : "none";
    document.querySelectorAll("#scores-tabs .tab").forEach((t) => t.classList.toggle("active", t.dataset.tab === scoresTab));
    if (logros) return renderAchievements();
    const story = scoresTab === "story";
    document.querySelectorAll("#scores-tabs .tab").forEach((t) => t.classList.toggle("active", t.dataset.tab === scoresTab));
    $("#th-res").textContent = story ? "Resultado" : "Rondas";
    const board = story ? StoryBoard.board : Progress.board;
    const mine = story ? Story.lastEntryId : lastEntryId;
    $("#scores-table tbody").innerHTML = board
      .map((e, i) => {
        const q = queenById(e.queen);
        const date = new Date(e.date).toLocaleDateString("es-ES", { day: "2-digit", month: "short" });
        const res = story ? (e.won ? "👑 Ganadora" : `Puesto ${e.place}º`) : e.won ? "👑" : `${e.rounds}/${e.totalRounds || "?"}`;
        const pic = q ? (story ? lookOf(q, e.season).portrait : q.portrait) : "";
        return `<tr class="${e.id === mine ? "me" : ""}">
          <td>${i < 3 ? ["🥇", "🥈", "🥉"][i] : i + 1}</td>
          <td>${esc(e.name || "Anónima")}</td>
          <td><span class="mini" style="background-image:url('${pic}')"></span>${esc(q ? q.name : e.queen)}</td>
          <td>${seasonTag(e.season)}${res}</td>
          <td class="pts">${fmt(e.score)}</td>
          <td class="muted">${date}</td>
        </tr>`;
      })
      .join("");
    $("#scores-table").style.display = board.length ? "" : "none";
    $("#scores-empty").style.display = board.length ? "none" : "";
    $("#scores-empty").textContent = story ? "Todavía no has jugado ninguna temporada en modo historia." : "Todavía no hay partidas. ¡A la pasarela!";

    const box = (label, value) => `<div><span>${label}</span><strong>${value}</strong></div>`;
    if (story) {
      const s = StoryBoard.stats;
      $("#career").innerHTML = box("Temporadas jugadas", fmt(s.games)) + box("Coronas", fmt(s.crowns)) + box("Retos ganados", fmt(s.challengeWins)) + box("Lip syncs ganados", fmt(s.lipsyncs));
    } else {
      const s = Progress.stats;
      $("#career").innerHTML = box("Partidas", fmt(s.games)) + box("Coronas", fmt(s.wins)) + box("Mejor combo", `x${s.bestCombo}`) + box("Puntos totales", fmt(Progress.total));
    }

    const crowned = story ? store.get("dftc-story-wins", []) : null;
    const hasWon = (id) => (story ? crowned.includes(id) : Progress.hasWon(id));
    $("#unlock-list").innerHTML = FRANCHISES.filter((f) => f.seasons.length).map((f) => {
      const won = f.seasons.filter((x) => hasWon(x.id)).length;
      return `<div class="unlock-item">
        <span class="tag-mini" style="background:${f.color}">${f.tag}</span>
        <div><strong>${esc(f.name)}</strong><small>${won}/${f.seasons.length}${story ? " coronas" : ""}</small>
        <span class="progress"><span style="width:${(won / f.seasons.length) * 100}%"></span></span></div>
      </div>`;
    }).join("");
  }
  document.querySelectorAll("#scores-tabs .tab").forEach((t) =>
    t.addEventListener("click", () => {
      scoresTab = t.dataset.tab;
      renderScores();
      stagger(screens.scores);
    })
  );

  // ------------------------------ Botones ----------------------------------
  $("#btn-play").addEventListener("click", () => {
    mode = "arcade";
    show("franchise");
  });
  $("#btn-story").addEventListener("click", () => {
    mode = "story";
    Story.menu(() => show("franchise"));
  });
  $("#story-exit").addEventListener("click", () => Story.exitToMenu());
  $("#btn-franchise-back").addEventListener("click", () => show("menu"));
  $("#btn-season-back").addEventListener("click", () => show("franchise"));
  $("#btn-scores").addEventListener("click", () => {
    scoresTab = mode === "story" ? "story" : "arcade";
    show("scores");
  });
  $("#btn-scores-back").addEventListener("click", () => show("menu"));
  $("#btn-back").addEventListener("click", () => show("season"));
  btnStart.addEventListener("click", startGame);
  $("#btn-again").addEventListener("click", startGame);
  $("#btn-change").addEventListener("click", () => {
    if (nextSeason) {
      currentSeason = nextSeason;
      selected = null;
      show("select");
    } else show("season");
  });
  $("#btn-end-scores").addEventListener("click", () => {
    scoresTab = "arcade";
    show("scores");
  });
  $("#btn-resume").addEventListener("click", () => {
    showPause(false);
    Game.resume();
  });
  $("#btn-quit").addEventListener("click", () => {
    Game.quit();
    if (mode === "story") Story.abandon();
    show("menu");
  });
  btnPause.addEventListener("click", togglePause);

  function togglePause() {
    if (Game.state === "paused") {
      showPause(false);
      Game.resume();
    } else if (Game.pause()) {
      showPause(true);
    }
  }

  function refreshMuteIcon() {
    btnMute.textContent = Sound.muted ? "🔇" : "🔊";
    btnMute.setAttribute("aria-label", Sound.muted ? "Activar sonido" : "Silenciar");
  }
  btnMute.addEventListener("click", () => {
    if (Sound.toggleMute()) Music.stop();
    refreshMuteIcon();
  });

  document.addEventListener("keydown", (e) => {
    if (e.target.tagName === "INPUT") return;
    if (e.code === "KeyP" || e.code === "Escape") {
      if (current === "game") togglePause();
      else if (current === "scores") show("menu");
    } else if (e.code === "KeyM") {
      Sound.toggleMute();
      refreshMuteIcon();
    } else if (e.code === "Enter") {
      if (current === "menu") show("franchise");
      else if (current === "select" && selected) startGame();
      else if (current === "end") startGame();
    }
  });

  // ------------------------- Controles táctiles ----------------------------
  touch.querySelectorAll("button").forEach((btn) => {
    const key = btn.dataset.key;
    const release = () => {
      if (key !== "special") Game.input[key] = false;
    };
    btn.addEventListener("pointerdown", (e) => {
      e.preventDefault();
      Game.input[key] = true;
    });
    ["pointerup", "pointerleave", "pointercancel"].forEach((ev) => btn.addEventListener(ev, release));
  });

  // ------------------------------ Escalado ---------------------------------
  const stage = $("#stage");
  function fit() {
    const s = Math.min(window.innerWidth / STAGE_W, window.innerHeight / STAGE_H);
    stage.style.transform = `translate(-50%, -50%) scale(${s})`;
  }
  window.addEventListener("resize", fit);
  fit();

  Sound.init();
  refreshMuteIcon();
  btnStart.disabled = true;
  $("#btn-play").disabled = true;
  $("#btn-story").disabled = true;
  $("#btn-play-label").textContent = "Cargando...";
  Game.ready.then(() => {
    $("#btn-play").disabled = false;
    $("#btn-story").disabled = false;
    $("#btn-play-label").textContent = "👠 Arcade";
  });
  show("menu");
  if ("serviceWorker" in navigator && location.protocol === "https:") navigator.serviceWorker.register("./sw.js").catch(() => {});

  return { showPause, show, scoresTab: (t) => (scoresTab = t), get mode() { return mode; } };
})();
