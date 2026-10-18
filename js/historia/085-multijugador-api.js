
  // ------------------------------ Multijugador: lo que el modo en directo usa del motor ------------------------------
  // La temporada en directo (src/mp) lleva su propio flujo; aquí solo se le prestan los retos, la pasarela,
  // el lip sync, las notas y los textos del jurado. Mientras dura (S.mp) no se guarda la partida individual ni se usa IA.
  const MP_RETOS = ["snatch", "roast", "rusical", "actuacion", "diseno", "makeover", "impro"];
  const mpQ = (k) => (k === "me" ? S.queen : qById(k));
  const mpApi = {
    begin(queenId, seasonId, rivalIds) {
      runId++;
      dropKeys();
      if (cleanup) cleanup();
      cleanup = null;
      const season = seasonById(seasonId);
      S = { ...blankState(qById(queenId), season, rivalIds.map(qById).filter(Boolean)), rng: newSeed(), mp: true, ep: 1, flags: { prepped: true } };
      [mxSnatch, mxActing, mxRusical, mxGirlGroups, mxMateriales, mxMakeover, mxImpro, mxPublicidad, mxRoast].forEach((f) => (f.classic = true));
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
    retos: () => MP_RETOS.map((k) => ({ tipo: k, titulo: RETOS[k].titulo(), desc: RETOS[k].desc, noRunway: !!RETOS[k].noRunway, ctrl: RETOS[k].ctrl })),
    categorias: () => (typeof TEMAS_PASARELA !== "undefined" ? TEMAS_PASARELA.filter((t) => !t.rv).map((t) => ({ n: t.n, d: t.d })) : CATEGORIAS.map((n) => ({ n, d: "" }))),
    setEp(ep, rivalIds) {
      if (!S) return;
      S.ep = ep;
      if (rivalIds) S.rivals = rivalIds.map(qById).filter(Boolean);
    },
    play(tipo, titulo, el, cb) {
      S.curTipo = tipo; S.curEpTipo = S.ep; S.curTitulo = titulo; S.team = null; S.cGroups = null; S.curPieces = null; S.lastLook = null;
      RETOS[tipo].run(el, (raw) => { cleanup = null; cb(Math.round(raw)); });
    },
    runway(el, cat, cb) { runRunwayNew(el, cat, (walk) => { cleanup = null; cb(Math.round(walk)); }); },
    lipsync(el, rivalId, cb) { runLipsync(el, qById(rivalId), (won, score) => { cleanup = null; cb(!!won, Math.round(score || 0)); }); },
    /** Nota final de la semana de la jugadora (el dado manda, su juego lo mueve). */
    finalScore(tipo, raw, walk) {
      S.curTipo = tipo;
      const total = walk == null ? raw : raw * 0.65 + walk * 0.35;
      return myDado(clamp(total, 0, 100));
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
    queen: (id) => { const q = qById(id); return q ? { id: q.id, name: q.name, photo: lookOf(q, S && S.season && S.season.id).portrait || q.portrait, sprite: lookOf(q, S && S.season && S.season.id).sprite || q.sprite } : null; },
  };
