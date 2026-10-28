
  // ------------------------------ Multijugador: lo que el modo en directo usa del motor ------------------------------
  // La temporada en directo (src/mp) lleva su propio flujo; aquí solo se le prestan los retos, la pasarela,
  // el lip sync, las notas, los diálogos y los textos del jurado. Mientras dura (S.mp) no se guarda la partida individual;
  // la IA solo se usa si la sala se creó con ella (S.mpIA).
  const MP_RETOS = ["snatch", "roast", "rusical", "actuacion", "diseno", "makeover", "impro"];
  const mpQ = (k) => (k === "me" ? S.queen : qById(k));
  const mpApi = {
    begin(queenId, seasonId, rivalIds, opts = {}) {
      runId++;
      dropKeys();
      if (cleanup) cleanup();
      cleanup = null;
      const season = seasonById(seasonId);
      S = { ...blankState(qById(queenId), season, rivalIds.map(qById).filter(Boolean)), rng: newSeed(), mp: true, mpIA: !!opts.ia, ep: 1, flags: { prepped: true } };
      // Con IA cada una elige en cada reto si lo hace en directo (escribiendo) o con opciones
      [mxSnatch, mxActing, mxRusical, mxGirlGroups, mxMateriales, mxMakeover, mxImpro, mxPublicidad, mxRoast].forEach((f) => (f.classic = !opts.ia));
      return true;
    },
    end() {
      runId++;
      dropKeys();
      if (cleanup) cleanup();
      cleanup = null;
      [mxSnatch, mxActing, mxRusical, mxGirlGroups, mxMateriales, mxMakeover, mxImpro, mxPublicidad, mxRoast].forEach((f) => (f.classic = false));
      S = null;
    },
    /** Corta el minijuego en curso (se acabó el tiempo de la fase). */
    abort() {
      runId++;
      dropKeys();
      if (cleanup) cleanup();
      cleanup = null;
    },
    /** ¿Hay IA disponible para ofrecerla al crear la sala? */
    iaReady: () => __REAL_IA.ready(),
    /** Formato de la temporada para la sala. */
    formato: (seasonId) => ((TEMPORADAS_HISTORIA[seasonId] || {}).twist === "allstars" ? "allstars" : "normal"),
    /** Fondo de la escena (taller, plató, jurado, Untucked). */
    scene: (name) => setSet(name),
    /** Diálogo con las caras de siempre (Supremme, Ana, los Javis y las reinas). */
    talk(lines, then, extra = {}) {
      if (!S) return then && then();
      const r1 = (extra.r1 && qById(extra.r1)) || S.rivals[0] || S.queen;
      dialog(lines, ctxWith(r1, { reto: extra.reto || S.curTitulo || "" }), () => { cleanup = null; then && then(); });
    },
    /** Líneas del anuncio del reto (y la bienvenida de la temporada el primer día). */
    announceLines(ep, seasonId) {
      const info = TEMPORADAS_HISTORIA[seasonId] || {};
      const intro = ep === 1 && (!info.twist || info.twist === "allstars") ? info.intro || [] : [];
      const hola = [["host", pick1(["¡Hola, hola, mis reinas!", "¡Buenos días, reinas!", "¡Hola, mis niñas!"])]];
      return [...(ep === 1 ? intro : hola), ...pickFresh(HISTORIA.anuncio)];
    },
    /** Pantalla del lip sync con su telón, y luego el minijuego. */
    lipsyncShow(el, rivalId, o, cb) {
      const rival = qById(rivalId);
      el.innerHTML = `
        <div class="story-card">
          <p class="eyebrow">${o.eyebrow}</p>
          <h3>${esc(S.queen.name)} vs ${esc(rival.name)}</h3>
          <div class="vs"><img src="${photo(S.queen)}"><span>VS</span><img src="${photo(rival)}"></div>
          ${o.note ? `<p class="muted">${esc(o.note)}</p>` : ""}
          <button class="btn btn-primary" id="mp-ls-go">¡A la pasarela!</button>
        </div>`;
      Music.play("tension");
      el.querySelector("#mp-ls-go").addEventListener("click", () => Curtain.run(() => {
        Music.stop();
        setSet("stage");
        el.innerHTML = `<div id="mp-ls-play"></div>`;
        runLipsync(el.querySelector("#mp-ls-play"), rival, (won, score) => { cleanup = null; cb(!!won, Math.round(score || 0)); });
      }, o.curtain || "LIP SYNC"));
    },
    retos: () => MP_RETOS.map((k) => ({ tipo: k, titulo: RETOS[k].titulo(), desc: RETOS[k].desc, noRunway: !!RETOS[k].noRunway, ctrl: RETOS[k].ctrl })),
    categorias: () => (typeof TEMAS_PASARELA !== "undefined" ? TEMAS_PASARELA.filter((t) => !t.rv).map((t) => ({ n: t.n, d: t.d })) : CATEGORIAS.map((n) => ({ n, d: "" }))),
    setEp(ep, rivalIds) {
      if (!S) return;
      S.ep = ep;
      if (rivalIds) S.rivals = rivalIds.map(qById).filter(Boolean);
    },
    play(tipo, titulo, el, cb) {
      S.curTipo = tipo; S.curEpTipo = S.ep; S.curTitulo = titulo; S.team = null; S.cGroups = null; S.curPieces = null; S.lastLook = null;
      S.juryNotes = null; S.liveEp = 0;
      // Si se hizo en directo, lo que pensó el jurado viaja con la nota para las críticas
      RETOS[tipo].run(el, (raw) => { cleanup = null; cb(Math.round(raw), S.liveEp === S.ep ? juryTxt() : ""); });
    },
    runway(el, cat, cb) { runRunwayNew(el, cat, (walk) => { cleanup = null; cb(Math.round(walk)); }); },
    lipsync(el, rivalId, cb) { runLipsync(el, qById(rivalId), (won, score) => { cleanup = null; cb(!!won, Math.round(score || 0)); }); },
    /** Nota final de la semana de la jugadora (el dado manda, su juego lo mueve). */
    finalScore(tipo, raw, walk, live) {
      S.curTipo = tipo;
      const total = walk == null ? raw : raw * 0.65 + walk * 0.35;
      const d = myDado(clamp(total, 0, 100));
      // Como en la historia: si el jurado ya te valoró en directo, el dado solo matiza
      return live ? clamp(d, Math.round(total) - 8, Math.round(total) + 6) : d;
    },
    rivalScore(qId, tipo) { const prev = S.curTipo; S.curTipo = tipo; const v = rivalScore(qById(qId)); S.curTipo = prev; return v; },
    simLS(aId, bId) { return simLS(qById(aId), qById(bId))[0].id; },
    /** Crítica de bancos de texto según el nivel ("top", "mid" o "low"). */
    critique(tipo, level, name) {
      const low1 = (t) => t.replace(/\{yo\}/g, name).replace(/^./, (c) => c.toLowerCase());
      const bank = (JURADO.reto[tipo] || JURADO.reto.pasarela)[level];
      const out = [["Supremme", `${name}, ${low1(pickFresh(bank))}`]];
      if (!(RETOS[tipo] || {}).noRunway) out.push(["Ana Locking", `${name}, ${low1(pickFresh(JURADO.pasarela[level]).replace(/^(y |por cierto, )/i, ""))}`]);
      return out;
    },
    /** Foto y sprite de la reina con el look de esa temporada (All Stars, etc.); sin temporada, la de la partida en curso. */
    queen: (id, seasonId) => {
      const q = qById(id);
      if (!q) return null;
      const L = lookOf(q, seasonId || (S && S.season && S.season.id));
      return { id: q.id, name: q.name, photo: L.portrait || q.portrait, sprite: L.sprite || q.sprite, quote: q.quote || "" };
    },
    /** Ficha de modo historia (atributos, carácter, fortaleza) para elegir reina en la sala. */
    preview: (id) => { const q = qById(id); return q ? preview(q) : null; },
  };
