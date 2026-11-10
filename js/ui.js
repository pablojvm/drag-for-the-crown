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
    root.querySelectorAll("#franchise-grid, #season-grid, #queen-grid, #scores-table tbody, #ach-grid, #reign-grid, .stats, #unlock-list, .career").forEach((g) => {
      g.classList.add("stagger");
      [...g.children].forEach((c, i) => c.style.setProperty("--i", i));
    });
  }
  // Modo historia dentro de la versión nueva (clasico.html?historia en un marco): se entra directo a la historia
  // y, en vez de volver al menú clásico, se avisa a la versión nueva para que cierre el marco
  // (y el multijugador igual: clasico.html?mp&embed)
  const QS = new URLSearchParams(location.search);
  const EMBED = (() => { try { return window.parent !== window && (QS.has("historia") || (QS.has("mp") && QS.has("embed"))); } catch (e) { return false; } })();
  const EMBED_MP = EMBED && QS.has("mp");
  const EMBED_MODE = EMBED ? QS.get("historia") || "" : "";
  let embedOn = false;
  const toParent = (ev) => { try { window.parent.postMessage({ type: "dftc-historia", ev }, location.origin); } catch (e) {} };
  if (EMBED) {
    document.documentElement.classList.add("dftc-embed");
    // Lo que se ve detrás (el plató del motor nuevo) lo pinta la versión nueva: se le dice qué decorado y qué reina
    window.__dftcEmbed = (ev, data) => { try { window.parent.postMessage({ type: "dftc-historia", ev, ...data }, location.origin); } catch (e) {} };
    // La pasarela y los lip syncs se juegan en las escenas del motor nuevo: se piden y se espera el resultado
    const waiting = {};
    window.__dftcAwait = (kind, data, cb) => { waiting[kind] = cb; window.__dftcEmbed(kind, data); };
    // Se acabó el tiempo (multijugador): se cierra la escena sin esperar su resultado
    window.__dftcCancel = () => { if (!waiting.lipsync && !waiting.runway) return; waiting.lipsync = waiting.runway = null; window.__dftcEmbed("cancel", {}); };
    addEventListener("message", (e) => {
      if (e.origin !== location.origin || e.source !== window.parent || !e.data || e.data.type !== "dftc-historia-res") return;
      const cb = waiting[e.data.kind];
      waiting[e.data.kind] = null;
      if (cb) cb(e.data);
    });
    // Si hay alguien hablando (o una reina en grande) en la pantalla, la reina del plató se aparta
    let lastBusy = null, raf = 0;
    // También si lo que hay en pantalla llega hasta donde está la reina (a la izquierda)
    const over = () => [...document.querySelectorAll("#story-body > *, #story-body > * > *")].some((e) => { const r = e.getBoundingClientRect(); return r.width > 0 && r.left < innerWidth * 0.25 && r.bottom > innerHeight * 0.4; });
    const check = () => {
      raf = 0;
      const b = document.querySelector("#screen-story.active");
      const busy = !b || !!document.querySelector("#story-body .dlg-char, #story-body .story-queen, .modal.show, .track-modal") || over();
      if (busy !== lastBusy) { lastBusy = busy; window.__dftcEmbed("busy", { on: busy }); }
    };
    const later = (ms) => {
      // El texto que se va escribiendo en los diálogos no cambia nada: no se mira (en el iPhone eso costaba mucho)
      if (ms && ms.length && ms.every((m) => m.target && m.target.closest && m.target.closest(".dlg-text, .caret"))) return;
      // Como mucho unas pocas veces por segundo: mirar posiciones fuerza a recalcular la página (en el iPad se notaba)
      if (!raf) raf = setTimeout(() => requestAnimationFrame(check), 150);
    };
    new MutationObserver(later).observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ["class"] });
    addEventListener("resize", () => later());
  }
  function show(name) {
    if (EMBED && embedOn && name === "menu") return toParent("exit");
    const prev = screens[current];
    if (prev && current !== name && prev.classList.contains("active")) {
      prev.classList.add("leaving");
      setTimeout(() => prev.classList.remove("leaving"), 300);
    }
    current = name;
    if (name !== "story") Music.stop();
    Wallet.refresh();
    Rudollars.refresh();
    Object.entries(screens).forEach(([k, el]) => el.classList.toggle("active", k === name));
    btnPause.style.visibility = name === "game" ? "visible" : "hidden";
    touch.classList.toggle("active", name === "game");
    if (window.__fitStage) window.__fitStage();
    showPause(false);
    if (name === "menu") {
      // (El menú ya no enseña récord ni puntos; si vuelven, se rellenan aquí)
      const mb = $("#menu-best"), mt = $("#menu-total");
      if (mb) mb.textContent = fmt(store.get("dftc-best", 0));
      if (mt) mt.textContent = fmt(Progress.total);
    }
    if (name === "franchise") renderFranchises();
    if (name === "season") renderSeasons();
    if (name === "select") { screens.select.classList.remove("picked"); renderGrid(); }
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

  // Coronas según el modo: arcade y historia llevan su propia cuenta
  const wonIn = (id) => (mode === "story" ? store.get("dftc-story-wins", []).includes(id) : Progress.hasWon(id));
  function renderFranchises() {
    const grid = $("#franchise-grid");
    grid.innerHTML = "";
    FRANCHISES.forEach((f) => {
      // En historia cuentan también las especiales (All Stars a tu gusto y All Winners)
      const list = mode === "story" && typeof allSeasons === "function" ? allSeasons().filter((s) => ((s.franchise && s.franchise.id) || s.franchise) === f.id) : f.seasons;
      const total = list.length || f.seasons.length;
      const won = list.filter((s) => wonIn(s.id)).length;
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
        <span class="f-progress"><span class="progress"><span style="width:${(won / total) * 100}%"></span></span>
        <small>👑 ${won} de ${total} ${total === 1 ? "temporada ganada" : "temporadas ganadas"} ${mode === "story" ? "en historia" : "en arcade"}</small></span>`
        }`;
      // (con las especiales: el All Winners se abre con una sola temporada ganada)
      const fLock = mode === "story" && !f.comingSoon && f.seasons.length && ![...f.seasons, ...list].some((x) => storyUnlock({ ...x, franchise: f }).ok) ? storyUnlock({ ...f.seasons[0], franchise: f }).why : null;
      if (fLock) { card.classList.add("locked"); card.insertAdjacentHTML("beforeend", `<span class="soon-badge">🔒 ${esc(fLock)}</span>`); }
      card.addEventListener("click", () => {
        if (f.comingSoon || fLock) {
          Sound.countdown(false);
          if (fLock) Toast.show("🔒 Bloqueada", fLock);
          return;
        }
        currentFranchise = f;
        show("season");
      });
      grid.append(card);
    });
  }

  // All Stars a tu gusto: eliges hasta 14 reinas de cualquier temporada
  function customCastPicker() {
    const ids = ALL_QUEEN_IDS();
    let sel = (store.get("dftc-custom-cast", []) || []).filter((id) => ids.includes(id));
    const m = document.createElement("div");
    m.className = "cc-modal";
    document.body.append(m);
    const draw = () => {
      m.innerHTML = `<div class="cc-box">
        <h3>✨ All Stars a tu gusto</h3>
        <p class="muted">Elige entre 5 y 14 reinas. Luego eliges con cuál juegas tú.</p>
        <div class="cc-grid">${ids.map((id) => { const q = queenById2(id); if (!q) return ""; const on = sel.includes(id); return `<button class="cc-q ${on ? "on" : ""}" data-id="${id}"><i style="background-image:${portraitBg(q)}"></i><span>${esc(q.name)}</span>${on ? `<b>${sel.indexOf(id) + 1}</b>` : ""}</button>`; }).join("")}</div>
        <div class="cc-bar"><span>${sel.length}/14 reinas</span><button class="btn btn-ghost" id="cc-x">Cancelar</button><button class="btn btn-primary" id="cc-ok" ${sel.length >= 5 ? "" : "disabled"}>Formar el reparto</button></div>
      </div>`;
      m.querySelectorAll(".cc-q").forEach((b) => b.addEventListener("click", () => {
        const id = b.dataset.id;
        if (sel.includes(id)) sel = sel.filter((x) => x !== id);
        else if (sel.length < 14) sel.push(id);
        else return Toast.show("Máximo 14", "Quita alguna para meter otra");
        const y = m.querySelector(".cc-grid").scrollTop;
        draw();
        m.querySelector(".cc-grid").scrollTop = y;
      }));
      m.querySelector("#cc-x").addEventListener("click", () => m.remove());
      m.querySelector("#cc-ok").addEventListener("click", () => {
        store.set("dftc-custom-cast", sel);
        m.remove();
        currentSeason = seasonById("escustom");
        if (selected && !currentSeason.cast.includes(selected.id)) selected = null;
        show("select");
      });
    };
    draw();
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
      .filter((s) => s.franchise.id === f.id && (mode === "story" || !s.special))
      .forEach((s) => {
        const lock = mode === "story" ? storyUnlock(s) : { ok: Progress.isSeasonUnlocked(s), why: "Gana la anterior" };
        const unlocked = lock.ok;
        const won = wonIn(s.id);
        const card = document.createElement("button");
        const cover = typeof PORTADAS !== "undefined" && PORTADAS[s.id];
        card.className = "season-card" + (unlocked ? "" : " locked") + (won ? " won" : "") + (cover ? " has-cover" : "");
        card.style.setProperty("--accent", f.color);
        if (cover) card.style.backgroundImage = `linear-gradient(180deg, rgba(20,3,31,.35) 0%, rgba(20,3,31,0) 22%, rgba(20,3,31,0) 60%, rgba(20,3,31,.45) 100%), url('${cover}')`;
        card.innerHTML = `
          <span class="s-top"><span class="s-name">${esc(s.name)}</span></span>
          ${cover ? "" : `<span class="faces">${s.cast.slice(0, 7).map((id) => `<i style="background-image:${portraitBg(queenById2(id), s.id)}"></i>`).join("")}${s.cast.length > 7 ? `<b>+${s.cast.length - 7}</b>` : ""}</span>`}
          <span class="s-cast">${s.special === "custom" ? (s.cast.length ? `${s.cast.length} reinas elegidas por ti` : "Elige hasta 14 reinas de cualquier temporada") : s.special === "winners" ? `${s.cast.length} reinas con las que has ganado` : `${s.cast.length} reinas · ${s.enEmision ? "📺 En emisión" : won ? `Ganadora: ${esc(queenById2(s.winner).name)}` : "¿Quién se llevará la corona?"}`}</span>
          <span class="s-state">${won ? "👑 Ganada" : unlocked ? (s.special ? (s.special === "custom" ? "✨ Monta tu reparto" : "🏆 Solo ganadoras") : `Dificultad ${"★".repeat(Math.min(5, s.index + 1))}`) : `🔒 ${esc(lock.why)}`}</span>`;
        card.addEventListener("click", () => {
          if (!unlocked) {
            Sound.countdown(false);
            Toast.show("🔒 Bloqueada", lock.why);
            return;
          }
          if (s.special === "custom") return customCastPicker();
          if (s.special === "winners" && s.cast.length < 4) return Toast.show("Faltan ganadoras", "Necesitas al menos 4 reinas coronadas");
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
        if (cover) card.style.backgroundImage = `linear-gradient(180deg, rgba(20,3,31,.35) 0%, rgba(20,3,31,0) 22%, rgba(20,3,31,0) 60%, rgba(20,3,31,.45) 100%), url('${cover}')`;
        const tl = mode === "story" ? storyUnlock(t) : { ok: true };
        card.innerHTML = `
          <span class="s-top"><span class="s-name">${esc(t.name)}</span></span>
          <span class="soon-badge">${tl.ok ? "Próximamente" : `🔒 ${esc(tl.why)} · Próximamente`}</span>`;
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
  // All Winners: te presentas con una de tus ganadoras (las demás son las ganadoras de las temporadas que no has ganado)
  const lockedAW = (q) => mode === "story" && !!currentSeason && currentSeason.special === "winners" && typeof allWinnersOrigin === "function" && (allWinnersOrigin()[q.id] || {}).how !== "win";
  const lockedQueen = (q) => lockedArcade(q) || lockedAW(q);
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
    // All Winners: en cada reina, la temporada que ganó contigo
    const origin = mode === "story" && currentSeason.special === "winners" && typeof allWinnersOrigin === "function" ? allWinnersOrigin() : {};
    const originTxt = (q) => { const o = origin[q.id]; return o ? (o.how === "runner" ? `🥈 Finalista ${o.season}` : `👑 Ganadora ${o.season}`) : ""; };
    cast.forEach((q) => {
      const locked = lockedQueen(q);
      const card = document.createElement("button");
      card.className = "queen-card" + (locked ? " locked" : "") + (selected && selected.id === q.id ? " selected" : "");
      card.dataset.id = q.id;
      card.innerHTML = `
        <span class="portrait" style="background-image:${portraitBg(q, currentSeason && currentSeason.id)}"></span>
        ${originTxt(q) ? `<span class="aw-origin ${origin[q.id].how}" title="${origin[q.id].how === "win" ? "La ganaste con ella" : origin[q.id].how === "runner" ? "Fue tu finalista" : "Aún no has ganado esta temporada"}">${esc(originTxt(q))}</span>` : ""}
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
    const locked = lockedQueen(q);
    $("#det-portrait").style.backgroundImage = portraitBg(q, currentSeason && currentSeason.id);
    // La reina sin fondo (para la ficha en vertical)
    $("#det-portrait").style.setProperty("--sprite", `url('${new URL(lookOf(q, currentSeason && currentSeason.id).sprite || q.sprite || "", location.href).href}')`);
    $("#det-portrait").classList.toggle("locked", locked);
    $("#det-name").textContent = q.name;
    const pos = currentSeason ? currentSeason.cast.indexOf(q.id) : -1;
    const n = currentSeason ? currentSeason.cast.length : 0;
    $("#det-place").textContent =
      pos < 0 ? "" : mode === "story" && currentSeason.special === "winners" && typeof allWinnersOrigin === "function" && allWinnersOrigin()[q.id] ? (({ how, season }) => how === "win" ? `👑 Ganadora ${season}` : how === "runner" ? `🥈 Finalista ${season} · Solo puedes presentarte con una de tus ganadoras` : `👑 Ganadora ${season} · Gana esa temporada para presentarte con ella`)(allWinnersOrigin()[q.id]) : mode === "story" ? "📖 En la historia, todo depende de ti" : currentSeason.enEmision ? "📺 Temporada en emisión" : pos === n - 1 ? "👑 Ganadora de la temporada" : `Puesto ${n - pos}º de ${n}`;
    $("#det-quote").textContent = q.quote ? `“${q.quote}”` : "";
    $(".power-label").textContent = mode === "story" ? "🎭 Su carácter" : "✨ Poder especial";
    if (mode === "story" && Story.preview) {
      // Modo historia: sus atributos de historia (1-10), no las estadísticas del arcade
      const P = Story.preview(q);
      const up = Mejoras.of(q.id);
      // Mejoras de reina: +1 a un atributo con rudollars (hasta 2 por atributo)
      $("#det-stats").innerHTML =
        Object.entries(P.attrs)
          .map(([k, v]) => `
        <div class="stat-row story-stat">
          <span>${P.names[k]}</span>
          <span class="pips ten">${Array.from({ length: 10 }, (_, i) => `<i class="${i < v - (up[k] || 0) ? "on" : i < v ? "on up" : ""}"></i>`).join("")}</span>
          <b class="stat-n">${v}</b>
          ${locked ? "" : Mejoras.can(q.id, k, v) ? `<button class="up-btn" data-k="${k}" data-v="${v}" title="Mejorar ${esc(P.names[k])}">+1 · ${Mejoras.cost(q.id, k, v).toLocaleString("es-ES")} 💵</button>` : `<span class="up-max">${(up[k] || 0) ? "MAX" : ""}</span>`}
        </div>`)
          .join("") +
        `<p class="wallet-line">💵 Tienes <b class="rudollars">${Rudollars.balance.toLocaleString("es-ES")}</b> rudollars · cada atributo se puede mejorar dos veces</p>` +
        `<p class="wallet-line">${P.fort ? `${P.fort.icon} Fortaleza: <b>${esc(P.fort.n)}</b> · ${esc(P.fort.d)}` : ""}</p>` +
        (P.titles.length ? `<p class="wallet-line">👑 Coronas en historia: <b>${P.titles.map(esc).join(", ")}</b></p>` : "");
      $("#det-stats").querySelectorAll(".up-btn").forEach((b) =>
        b.addEventListener("click", (e) => {
          e.stopPropagation();
          if (Mejoras.buy(q.id, b.dataset.k, +b.dataset.v)) { Music.sfx("coin"); Toast.show("💪 ¡Mejorada!", `${q.name} · ${P.names[b.dataset.k]} +1`); openDetails(q); }
          else Toast.show("Te faltan rudollars", "Gánalos en la historia: retos, minirretos, logros y la final");
        }),
      );
      $("#det-power").textContent = P.car ? P.car.n : "";
      $("#det-power-desc").textContent = P.car ? P.car.d : "";
      $("#det-lock").innerHTML = "";
      details.classList.add("open");
      return;
    }
    const st = Wardrobe.statsOf(q);
    $("#det-stats").innerHTML =
      Object.entries(STAT_LABELS)
        .map(
          ([k, label]) => `
        <div class="stat-row">
          <span>${label}</span>
          <span class="pips">${[1, 2, 3, 4, 5].map((i) => `<i class="${i <= q.stats[k] ? "on" : i <= st[k] ? "on up" : ""}"></i>`).join("")}</span>
          ${Wardrobe.canUpgrade(q, k) ? `<button class="up-btn" data-k="${k}" title="Mejorar">+ ${Wardrobe.cost(q, k)} 💵</button>` : `<span class="up-max">MAX</span>`}
        </div>`,
        )
        .join("") + `<p class="wallet-line">💵 Tienes <b class="rudollars">${Rudollars.balance.toLocaleString("es-ES")}</b> rudollars</p>`;
    $("#det-stats").querySelectorAll(".up-btn").forEach((b) =>
      b.addEventListener("click", (e) => {
        e.stopPropagation();
        if (Wardrobe.upgrade(q, b.dataset.k)) {
          Music.sfx("coin");
          openDetails(q);
        } else Toast.show("Te faltan rudollars", "Gánalos jugando partidas y retos");
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
    btnStart.disabled = lockedQueen(q);
    Sound.stopAll();
    if (q.voice) Sound.voice(q.id);
    // En vertical: desaparece la cuadrícula y se queda solo la ficha con ¡Runway! y Volver
    if (document.body.classList.contains("portrait")) { screens.select.classList.add("picked"); screens.select.scrollTo(0, 0); }
  }

  // ------------------------------ Partida ----------------------------------
  function startGame() {
    if (!selected || !currentSeason) return;
    if (mode === "story") return Story.start(selected, currentSeason);
    if (lockedQueen(selected)) return;
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
    const earned = Rudollars.add(stats.score / 80);
    if (earned) msg = (msg ? msg + " · " : "") + `💵 +${DFTC.cantidad(earned)}`;
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
      `<p class="ach-sum">${Object.keys(done).length}/${LOGROS.length} logros · <b class="rudollars">${Rudollars.balance.toLocaleString("es-ES")}</b> rudollars 💵 · <b class="sequins">${Wallet.balance}</b> lipsticks 💄</p>` +
      LOGROS.map((l) => `<div class="ach ${done[l.id] ? "done" : ""}"><i>${done[l.id] ? l.icon : "🔒"}</i><div><strong>${esc(l.name)}</strong><small>${esc(l.desc)}</small></div><em>+${l.reward} ✨</em></div>`).join("");
  }
  // Reinas reinantes: la ganadora original de cada temporada, o la que ganó tu última partida
  function renderReigns() {
    const R = store.get("dftc-reinantes", {});
    const fmtD = (d) => new Date(d).toLocaleDateString("es-ES", { day: "2-digit", month: "short", year: "numeric" });
    // Arriba la Reina de reinas (All Winners), luego los All Stars y después las temporadas normales
    const card = (s, i, cls = "") => {
      const r = R[s.id];
      const orig = s.enEmision || s.special ? null : queenById(s.winner);
      const q = r ? queenById(r.queen) : orig;
      const player = r && queenById(r.player);
      const sub = r
        ? r.mine ? "Coronada en tu partida" : `Ganó en tu partida${player ? ` con ${esc(player.name)}` : ""}`
        : orig ? "Ganadora original" : s.special ? "Aún sin coronar" : "En emisión · aún sin reina";
      return `<div class="reign ${cls} ${r ? (r.mine ? "mine" : "played") : ""}" style="--i:${i}">
          <span class="tag-mini" style="background:${s.franchise.color}">${s.franchise.tag}</span>
          <i class="reign-pic" style="background-image:url('${q ? lookOf(q, s.id).portrait : PORTADAS[s.id] || ""}')"></i>
          <span class="reign-crown">${cls === "qoq" ? "👑👑" : "👑"}</span>
          <strong>${esc(q ? q.name : "¿?")}</strong>
          <small class="reign-season">${esc(s.name)}${s.year && !s.special ? ` · ${s.year}` : ""}</small>
          <small class="reign-sub">${sub}${r && r.reigns > 1 ? ` · ${r.reigns} coronas seguidas` : ""}</small>
          ${r ? `<small class="muted">${fmtD(r.date)}${orig && orig.id !== r.queen ? ` · Original: ${esc(orig.name)}` : ""}</small>` : ""}
        </div>`;
    };
    const SS = allSeasons().filter((s) => s.cast && (s.cast.length || s.special));
    const frOf = (s) => (s.franchise && s.franchise.id) || s.franchise;
    const aw = SS.find((s) => s.special === "winners");
    const as = SS.filter((s) => frOf(s) === "esas" && s.special !== "winners");
    const reg = SS.filter((s) => frOf(s) !== "esas");
    let i = 0;
    $("#reign-grid").innerHTML =
      (aw ? `<h4 class="reign-h">👑 Reina de reinas</h4>${card(aw, i++, "qoq")}` : "") +
      (as.length ? `<h4 class="reign-h">⭐ All Stars</h4>${as.map((s) => card(s, i++)).join("")}` : "") +
      (reg.length ? `<h4 class="reign-h">💄 Temporadas</h4>${reg.map((s) => card(s, i++)).join("")}` : "");
  }
  // Track record de una partida guardada en el ranking
  function openEntryTrack(e) {
    const q = queenById(e.queen), s = seasonById(e.season);
    const m = document.createElement("div");
    m.className = "track-modal";
    m.innerHTML = `<div class="story-card track-card"><p class="eyebrow">${esc(s ? s.name : "")} · ${esc(e.name || "Anónima")} con ${esc(q ? q.name : e.queen)}</p><h3>Track record</h3>${e.track}<button class="btn btn-primary" id="tm-close">Cerrar</button></div>`;
    document.body.append(m);
    const close = () => m.remove();
    m.querySelector("#tm-close").addEventListener("click", close);
    m.addEventListener("click", (ev) => ev.target === m && close());
  }
  function renderScores() {
    const logros = scoresTab === "logros";
    const reigns = scoresTab === "reinas";
    $(".scores-layout").style.display = logros || reigns ? "none" : "";
    $("#ach-grid").style.display = logros ? "" : "none";
    $("#reign-grid").style.display = reigns ? "" : "none";
    document.querySelectorAll("#scores-tabs .tab").forEach((t) => t.classList.toggle("active", t.dataset.tab === scoresTab));
    if (logros) return renderAchievements();
    if (reigns) return renderReigns();
    const mundial = scoresTab === "mundial";
    const story = scoresTab === "story" || mundial;
    const net = window.DFTC_NET;
    if ($("#tab-mundial")) $("#tab-mundial").hidden = !(net && net.enabled);
    if (mundial && net) net.loadTop().then(() => scoresTab === "mundial" && renderScoresTable());
    document.querySelectorAll("#scores-tabs .tab").forEach((t) => t.classList.toggle("active", t.dataset.tab === scoresTab));
    $("#th-res").textContent = story ? "Resultado" : "Rondas";
    $("#th-pts").textContent = story ? "Track record" : "Puntos";
    renderScoresTable();
  }
  function renderScoresTable() {
    const mundial = scoresTab === "mundial";
    const story = scoresTab === "story" || mundial;
    const board = mundial ? (window.DFTC_NET ? window.DFTC_NET.cachedTop() : []) : story ? StoryBoard.board : Progress.board;
    const mine = story ? Story.lastEntryId : lastEntryId;
    $("#scores-table tbody").innerHTML = board
      .map((e, i) => {
        const q = queenById(e.queen);
        const date = new Date(e.date).toLocaleDateString("es-ES", { day: "2-digit", month: "short" });
        const res = story ? (e.won ? "👑 Ganadora" : `Puesto ${esc(typeof e.place === "string" ? e.place : e.place + "º")}`) : e.won ? "👑" : `${e.rounds}/${e.totalRounds || "?"}`;
        const pic = q ? (story ? lookOf(q, e.season).portrait : q.portrait) : "";
        return `<tr class="${e.id === mine ? "me" : ""}${story && e.track ? " has-track" : ""}" data-n="${i}" ${story && e.track ? 'title="Ver su track record"' : ""}>
          <td>${i < 3 ? ["🥇", "🥈", "🥉"][i] : i + 1}</td>
          <td>${esc(e.name || "Anónima")}</td>
          <td><span class="mini" style="background-image:url('${pic}')"></span>${esc(q ? q.name : e.queen)}</td>
          <td>${seasonTag(e.season)}${res}${story && e.track ? ' <span class="trk-ico">📊</span>' : ""}</td>
          <td class="pts">${story ? (() => { const m = storyMetrics(e); return `<b>${m.ppe.toFixed(2)}</b> PPE · ${m.wins} ${m.wins === 1 ? "win" : "wins"}`; })() : fmt(e.score)}</td>
          <td class="muted">${date}</td>
        </tr>`;
      })
      .join("");
    if (story) $("#scores-table tbody").querySelectorAll("tr.has-track").forEach((tr) => tr.addEventListener("click", () => openEntryTrack(board[+tr.dataset.n])));
    $("#scores-table").style.display = board.length ? "" : "none";
    $("#scores-empty").style.display = board.length ? "none" : "";
    $("#scores-empty").textContent = mundial ? "Cargando el ranking mundial..." : story ? "Todavía no has jugado ninguna temporada en modo historia." : "Todavía no hay partidas. ¡A la pasarela!";

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
  $("#story-board").addEventListener("click", () => Story.openBoard());
  $("#story-ia").addEventListener("click", () => IA.toggle());
  $("#btn-franchise-back").addEventListener("click", () => show("menu"));
  $("#btn-season-back").addEventListener("click", () => show("franchise"));
  $("#btn-scores").addEventListener("click", () => {
    scoresTab = mode === "story" ? "story" : "arcade";
    show("scores");
  });
  $("#btn-scores-back").addEventListener("click", () => show("menu"));
  $("#btn-back").addEventListener("click", () => show("season"));
  // Vertical: de la ficha se vuelve a todas las reinas
  $("#btn-unpick").addEventListener("click", () => { screens.select.classList.remove("picked"); screens.select.scrollTo(0, 0); });
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
  // En móvil vertical el escenario se hace más estrecho y alto (720 px de ancho) para que el texto se lea;
  // el arcade (lienzo de 1440) sigue en horizontal
  function fit() {
    const w = window.innerWidth, h = window.innerHeight;
    const arcade = !!document.querySelector("#screen-game.active");
    const portrait = w / h < 0.85 && !arcade;
    const SW = portrait ? 720 : STAGE_W;
    const SH = portrait ? Math.max(STAGE_H, Math.round((SW * h) / w)) : STAGE_H;
    stage.style.width = SW + "px";
    stage.style.height = SH + "px";
    document.body.classList.toggle("portrait", portrait);
    const s = Math.min(w / SW, h / SH);
    stage.style.transform = `translate(-50%, -50%) scale(${s})`;
  }
  window.__fitStage = fit;
  // Accesibilidad: todo campo de texto sin etiqueta usa su placeholder como nombre accesible
  const labelFields = (root) => root.querySelectorAll("input:not([aria-label]):not([id='name-input']), textarea:not([aria-label])").forEach((el) => {
    const ph = el.getAttribute("placeholder");
    if (ph && !(el.id && document.querySelector(`label[for="${el.id}"]`))) el.setAttribute("aria-label", ph.replace(/\.\.\.$|…$/, ""));
  });
  labelFields(document);
  new MutationObserver((ms) => ms.forEach((m) => m.addedNodes.forEach((n) => n.nodeType === 1 && labelFields(n)))).observe(stage, { childList: true, subtree: true });
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
    $("#btn-play-label").textContent = "Arcade";
    if (EMBED_MP) {
      // La sala se abre sola (?mp); cuando ya se ve, se avisa a la versión nueva
      mode = "story";
      const wait = () => (document.querySelector("#screen-story.active") ? ((embedOn = true), toParent("ready")) : setTimeout(wait, 100));
      wait();
    } else if (EMBED) {
      embedOn = true;
      mode = "story";
      if (EMBED_MODE === "nueva") show("franchise");
      else {
        Story.menu(() => show("franchise"));
        const c = $("#story-continue");
        if (EMBED_MODE === "seguir" && c) c.click();
      }
      toParent("ready");
    }
  });
  show("menu");
  if ("serviceWorker" in navigator && location.protocol === "https:") navigator.serviceWorker.register(`./sw.js?v=${typeof __DFTC_VERSION__ === "string" ? encodeURIComponent(__DFTC_VERSION__) : "dev"}`).catch(() => {});

  return { showPause, show, scoresTab: (t) => (scoresTab = t), get mode() { return mode; } };
})();
