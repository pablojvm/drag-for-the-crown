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
    select: $("#screen-select"),
    game: $("#screen-game"),
    scores: $("#screen-scores"),
    end: $("#screen-end"),
  };
  const pauseOverlay = $("#overlay-pause");
  const btnPause = $("#btn-pause");
  const btnMute = $("#btn-mute");
  const btnStart = $("#btn-start");
  const touch = $("#touch-controls");
  let selected = null;
  let current = "menu";
  let lastEntryId = null;

  function show(name) {
    current = name;
    Object.entries(screens).forEach(([k, el]) => el.classList.toggle("active", k === name));
    btnPause.style.visibility = name === "game" ? "visible" : "hidden";
    touch.classList.toggle("active", name === "game");
    showPause(false);
    if (name === "menu") {
      $("#menu-best").textContent = fmt(store.get("dftc-best", 0));
      $("#menu-total").textContent = fmt(Progress.total);
    }
    if (name === "select") renderGrid();
    if (name === "scores") renderScores();
  }

  function showPause(on) {
    pauseOverlay.classList.toggle("active", on);
  }

  // -------------------------- Elección de reina ----------------------------
  const grid = $("#queen-grid");
  const details = $("#queen-details");

  function renderGrid() {
    grid.innerHTML = "";
    QUEENS.forEach((q) => {
      const locked = !Progress.isUnlocked(q);
      const card = document.createElement("button");
      card.className = "queen-card" + (locked ? " locked" : "") + (selected && selected.id === q.id ? " selected" : "");
      card.dataset.id = q.id;
      card.innerHTML = `
        <span class="portrait" style="background-image:url('${q.portrait}')"></span>
        <span class="name">${esc(q.name)}</span>
        ${locked ? `<span class="lock"><span>🔒</span><small>${fmt(q.unlock)} pts</small></span>` : ""}
        <span class="check" aria-hidden="true">✓</span>`;
      card.addEventListener("click", () => selectQueen(q));
      grid.append(card);
    });
    if (selected && !Progress.isUnlocked(selected)) selected = null;
    btnStart.disabled = !selected;
    if (selected) openDetails(selected);
    else details.classList.remove("open");
  }

  function openDetails(q) {
    const locked = !Progress.isUnlocked(q);
    $("#det-portrait").style.backgroundImage = `url('${q.portrait}')`;
    $("#det-portrait").classList.toggle("locked", locked);
    $("#det-name").textContent = q.name;
    $("#det-stats").innerHTML = Object.entries(STAT_LABELS)
      .map(
        ([k, label]) => `
        <div class="stat-row">
          <span>${label}</span>
          <span class="pips">${[1, 2, 3, 4, 5].map((i) => `<i class="${i <= q.stats[k] ? "on" : ""}"></i>`).join("")}</span>
        </div>`,
      )
      .join("");
    $("#det-power").textContent = q.power.name;
    $("#det-power-desc").textContent = q.power.desc;
    const lockMsg = $("#det-lock");
    if (locked) {
      const pct = Math.min(100, (Progress.total / q.unlock) * 100);
      lockMsg.innerHTML = `🔒 Se desbloquea con <strong>${fmt(q.unlock)}</strong> puntos acumulados
        <span class="progress"><span style="width:${pct}%"></span></span>
        <small>Llevas ${fmt(Progress.total)}</small>`;
    } else {
      lockMsg.innerHTML = "";
    }
    details.classList.add("open");
  }

  function selectQueen(q) {
    grid.querySelectorAll(".queen-card").forEach((c) => c.classList.toggle("active", c.dataset.id === q.id));
    openDetails(q);
    if (!Progress.isUnlocked(q)) {
      Sound.countdown(false);
      btnStart.disabled = !selected || !Progress.isUnlocked(selected);
      return;
    }
    selected = q;
    grid.querySelectorAll(".queen-card").forEach((c) => c.classList.toggle("selected", c.dataset.id === q.id));
    btnStart.disabled = false;
    Sound.stopAll();
    if (q.voice) Sound.voice(q.id);
  }

  // ------------------------------ Partida ----------------------------------
  function startGame() {
    if (!selected || !Progress.isUnlocked(selected)) return;
    show("game");
    Game.start(selected, showEnd);
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
    $("#stat-rounds").textContent = `${stats.rounds}/${ROUNDS.length}`;
    $("#stat-acc").textContent = `${stats.accuracy}%`;
    $("#stat-combo").textContent = `x${stats.maxCombo}`;
    $("#stat-time").textContent = formatTime(stats.time);
    $("#new-record").classList.toggle("active", stats.isRecord && stats.score > 0);

    const unlockedMsg = $("#unlocked-msg");
    unlockedMsg.textContent = stats.unlocked.length
      ? `🔓 ¡Nueva reina desbloqueada: ${stats.unlocked.map((q) => q.name).join(", ")}!`
      : "";
    unlockedMsg.classList.toggle("active", stats.unlocked.length > 0);

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
  function renderScores() {
    const board = Progress.board;
    const tbody = $("#scores-table tbody");
    tbody.innerHTML = board
      .map((e, i) => {
        const q = queenById(e.queen);
        const date = new Date(e.date).toLocaleDateString("es-ES", { day: "2-digit", month: "short" });
        return `<tr class="${e.id === lastEntryId ? "me" : ""}">
          <td>${i < 3 ? ["🥇", "🥈", "🥉"][i] : i + 1}</td>
          <td>${esc(e.name || "Anónima")}</td>
          <td><span class="mini" style="background-image:url('${q ? q.portrait : ""}')"></span>${esc(q ? q.name : e.queen)}</td>
          <td>${e.won ? "👑 5/5" : `${e.rounds}/${ROUNDS.length}`}</td>
          <td class="pts">${fmt(e.score)}</td>
          <td class="muted">${date}</td>
        </tr>`;
      })
      .join("");
    $("#scores-table").style.display = board.length ? "" : "none";
    $("#scores-empty").style.display = board.length ? "none" : "";

    const s = Progress.stats;
    $("#car-games").textContent = fmt(s.games);
    $("#car-wins").textContent = fmt(s.wins);
    $("#car-combo").textContent = `x${s.bestCombo}`;
    $("#car-total").textContent = fmt(Progress.total);

    const pending = QUEENS.filter((q) => !Progress.isUnlocked(q));
    $("#unlock-list").innerHTML = pending.length
      ? pending
          .map((q) => {
            const pct = Math.min(100, (Progress.total / q.unlock) * 100);
            return `<div class="unlock-item">
              <span class="mini locked" style="background-image:url('${q.portrait}')"></span>
              <div><strong>${esc(q.name)}</strong><small>${fmt(q.unlock)} pts</small>
              <span class="progress"><span style="width:${pct}%"></span></span></div>
            </div>`;
          })
          .join("")
      : `<p class="muted">¡Las tienes todas! 👑</p>`;
  }

  // ------------------------------ Botones ----------------------------------
  $("#btn-play").addEventListener("click", () => show("select"));
  $("#btn-scores").addEventListener("click", () => show("scores"));
  $("#btn-scores-back").addEventListener("click", () => show("menu"));
  $("#btn-back").addEventListener("click", () => show("menu"));
  btnStart.addEventListener("click", startGame);
  $("#btn-again").addEventListener("click", startGame);
  $("#btn-change").addEventListener("click", () => show("select"));
  $("#btn-end-scores").addEventListener("click", () => show("scores"));
  $("#btn-resume").addEventListener("click", () => {
    showPause(false);
    Game.resume();
  });
  $("#btn-quit").addEventListener("click", () => {
    Game.quit();
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
    Sound.toggleMute();
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
      if (current === "menu") show("select");
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
  $("#btn-play").textContent = "Cargando...";
  Game.ready.then(() => {
    $("#btn-play").disabled = false;
    $("#btn-play").textContent = "Jugar";
  });
  show("menu");

  return { showPause };
})();
