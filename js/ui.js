// ---------------------------------------------------------------------------
// Interfaz: pantallas, elección de queen, pausa, sonido, escalado y táctil
// ---------------------------------------------------------------------------
const UI = (() => {
  const $ = (s) => document.querySelector(s);
  const screens = {
    menu: $("#screen-menu"),
    select: $("#screen-select"),
    game: $("#screen-game"),
    end: $("#screen-end"),
  };
  const pauseOverlay = $("#overlay-pause");
  const btnPause = $("#btn-pause");
  const btnMute = $("#btn-mute");
  const btnStart = $("#btn-start");
  const touch = $("#touch-controls");
  let selected = null;
  let current = "menu";

  function show(name) {
    current = name;
    Object.entries(screens).forEach(([k, el]) => el.classList.toggle("active", k === name));
    btnPause.style.visibility = name === "game" ? "visible" : "hidden";
    touch.classList.toggle("active", name === "game");
    showPause(false);
    if (name === "menu") $("#menu-best").textContent = store.get("dftc-best", 0).toLocaleString("es-ES");
  }

  function showPause(on) {
    pauseOverlay.classList.toggle("active", on);
  }

  // ------------------------- Elección de queen ---------------------------
  const grid = $("#queen-grid");
  QUEENS.forEach((q) => {
    const card = document.createElement("button");
    card.className = "queen-card";
    card.dataset.id = q.id;
    card.innerHTML = `
      <span class="portrait" style="background-image:url('${q.portrait}')"></span>
      <span class="name">${q.name}</span>
      <span class="check" aria-hidden="true">✓</span>`;
    card.addEventListener("click", () => selectQueen(q));
    grid.append(card);
  });

  function selectQueen(q) {
    selected = q;
    grid.querySelectorAll(".queen-card").forEach((c) => c.classList.toggle("selected", c.dataset.id === q.id));
    btnStart.disabled = false;
    Sound.stopAll();
    Sound.voice(q.id);
  }

  // ------------------------------ Partida --------------------------------
  function startGame() {
    if (!selected) return;
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
    $("#stat-score").textContent = stats.score.toLocaleString("es-ES");
    $("#stat-best").textContent = stats.best.toLocaleString("es-ES");
    $("#stat-rounds").textContent = `${stats.rounds}/${ROUNDS.length}`;
    $("#stat-acc").textContent = `${stats.accuracy}%`;
    $("#stat-combo").textContent = `x${stats.maxCombo}`;
    $("#stat-time").textContent = formatTime(stats.time);
    $("#new-record").classList.toggle("active", stats.isRecord && stats.score > 0);
    screens.end.classList.toggle("won", stats.won);
    show("end");
  }

  // ------------------------------ Botones --------------------------------
  $("#btn-play").addEventListener("click", () => show("select"));
  $("#btn-back").addEventListener("click", () => show("menu"));
  btnStart.addEventListener("click", startGame);
  $("#btn-again").addEventListener("click", startGame);
  $("#btn-change").addEventListener("click", () => show("select"));
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
    if (e.code === "KeyP" || e.code === "Escape") {
      if (current === "game") togglePause();
    } else if (e.code === "KeyM") {
      Sound.toggleMute();
      refreshMuteIcon();
    } else if (e.code === "Enter") {
      if (current === "menu") show("select");
      else if (current === "select" && selected) startGame();
      else if (current === "end") startGame();
    }
  });

  // ------------------------- Controles táctiles --------------------------
  touch.querySelectorAll("button").forEach((btn) => {
    const key = btn.dataset.key;
    const release = () => (Game.input[key] = false);
    btn.addEventListener("pointerdown", (e) => {
      e.preventDefault();
      Game.input[key] = true;
    });
    ["pointerup", "pointerleave", "pointercancel"].forEach((ev) => btn.addEventListener(ev, release));
  });

  // ------------------------------ Escalado -------------------------------
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
