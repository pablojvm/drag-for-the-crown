
  // ------------------------------ Multijugador: lo que el modo en directo usa del motor ------------------------------
  // La temporada en directo (src/mp) lleva su propio flujo; aquí solo se le prestan los retos, la pasarela,
  // el lip sync, las notas, los diálogos y los textos del jurado. Mientras dura (S.mp) no se guarda la partida individual;
  // la IA solo se usa si la sala se creó con ella (S.mpIA).
  const MP_RETOS = ["snatch", "roast", "rusical", "actuacion", "diseno", "makeover", "impro", "equipos", "publicidad"];
  const mpQ = (k) => (k === "me" ? S.queen : qById(k));
  const mpApi = {
    begin(queenId, seasonId, rivalIds, opts = {}) {
      runId++;
      dropKeys();
      if (cleanup) cleanup();
      cleanup = null;
      // Partida personalizada: una temporada hecha con las reinas elegidas
      const season = seasonById(seasonId) || { id: "mpcustom", name: "Temporada personalizada", year: "", cast: [queenId, ...rivalIds], franchise: { id: "es", name: "Drag Race España" } };
      S = { ...blankState(qById(queenId), season, rivalIds.map(qById).filter(Boolean)), rng: newSeed(), mp: true, mpIA: !!opts.ia, ep: 1, flags: { prepped: true } };
      // Lo de cada una que no viaja por la sala (maletas y armario de la temporada), por si se reanuda
      if (opts.local) ["prepLooks", "mpGrant", "mpGrantDone", "usedLooks", "runwayPlan"].forEach((k) => opts.local[k] !== undefined && (S[k] = opts.local[k]));
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
      // Si estaba en la pasarela o el lip sync del motor nuevo, vuelve a la sala
      if (window.__dftcCancel) window.__dftcCancel();
    },
    /** Lo de esta jugadora que hay que guardar con la partida (maletas y armario). */
    local: () => (S ? { prepLooks: S.prepLooks || {}, mpGrant: S.mpGrant || 0, mpGrantDone: !!S.mpGrantDone, usedLooks: S.usedLooks || [], runwayPlan: S.runwayPlan || [] } : null),
    /** Presupuesto de la sala para las maletas (igual para todas: lo justo para un look por pasarela y algo más). */
    budget: (cats) => Math.ceil((basicBudget(cats) * 1.25) / 50) * 50,
    /** Maletas: los Javis llaman, producción da el presupuesto y se preparan los looks de todas las pasarelas. */
    maletas(el, cats, budget, cb) {
      S.runwayPlan = cats.slice();
      S.ballPlan = [];
      // Tu armario del multijugador se queda de una partida a otra y se paga con lipsticks;
      // si no te llega para lo básico, producción pone lo que falta solo para esta sala
      if (!S.mpGrantDone) { S.mpGrantDone = true; S.mpGrant = neededBudget(cats); }
      S.prepLooks = S.prepLooks || {};
      setSet("lounge");
      const lines = [
        ["ambrossi", "¿Sí? ¿Hablo con {yo}? ¡Somos los Javis!"],
        ["calvo", `Te llamamos porque vas a estar en ${S.season.name}... ¡y en directo con tus amigas!`],
        ["ambrossi", `Serán ${cats.length} pasarelas. Te decimos las temáticas, pero no en qué orden.`],
        ["calvo", "Lo que compres ahora es lo que hay: durante la temporada no se puede ir de compras, y ningún look se repite."],
      ];
      dialog(lines, ctxWith(S.rivals[0] || S.queen), () => {
        el = body(); // el diálogo ocupa la pantalla: la tarjeta va donde esté ahora
        el.innerHTML = `
          <div class="story-card call-plan">
            <p class="eyebrow">📞 Los Javis · tus pasarelas</p>
            <h3>${cats.length} looks que preparar</h3>
            <div class="sched">${cats.map((c, i) => { const t = themeOf(c); return `<div class="sched-ep" style="--i:${i}"><b>👠 Pasarela</b><span>${esc(c)}</span>${t ? `<small>${esc(t.d)}</small>` : ""}</div>`; }).join("")}</div>
            <p class="gold">${S.mpGrant ? `💄 Producción pone <b>${euros(S.mpGrant)}</b> para lo que te falta (solo valen en esta sala).` : "💄 Con tu armario y tus lipsticks te llega: producción no pone nada esta vez."} Tienes <b class="closet-money">${euros(Closet.money)}</b>.</p>
            <p class="muted">👗 Tu armario del multijugador es aparte del de la historia y se guarda para la próxima partida.</p>
            <button class="btn btn-primary" id="mp-maletas-go">👗 Preparar mis looks</button>
          </div>`;
        el.querySelector("#mp-maletas-go").addEventListener("click", () => prepAllLooks(() => { cleanup = null; cb(); }));
      });
    },
    /** Quién habla en una pantalla de la sala: presentadoras o una reina (q:id). */
    speaker(key) {
      if (PRESENTADORAS[key]) return { ...PRESENTADORAS[key], side: PRESENTADORAS[key].side || "left" };
      const q = qById(String(key).replace(/^q:/, ""));
      if (!q) return { name: "", role: "", img: "", side: "right" };
      return { name: q.name, role: "Reina", img: lookOf(q, S && S.season && S.season.id).sprite || q.sprite, side: "right" };
    },
    /** ¿Hay IA disponible para ofrecerla al crear la sala? */
    iaReady: () => __REAL_IA.ready(),
    /** Formato de la temporada para la sala. */
    formato: (seasonId) => {
      const t = (TEMPORADAS_HISTORIA[seasonId] || {}).twist;
      return ["allstars", "winners", "repesca", "suerte", "corazon", "moneda"].includes(t) ? t : "normal";
    },
    /** Reto de la Segunda Oportunidrag (stand-up en parejas con las eliminadas). */
    repescaReto: () => ({ tipo: "repescaStand", titulo: RETOS.repescaStand.titulo(), desc: RETOS.repescaStand.desc, noRunway: true, ctrl: RETOS.repescaStand.ctrl }),
    /** All Winners: las reinas con las que has ganado tú una temporada (y cuál), y las ganadoras de siempre. */
    myWinners: () => Object.entries(allWinnersOrigin()).filter(([, o]) => o.how === "win").map(([id, o]) => ({ id, season: o.season })),
    canonWinners: () => [...REGULAR_ES(), ...PLAYABLE_AS()].filter((t) => t.cast && t.cast.length > 1 && !t.enEmision).map((t) => t.cast[t.cast.length - 1]),
    /** Las ganadoras de siempre con su temporada (para la sala del All Winners). */
    canonWinnersOf: () => [...REGULAR_ES(), ...PLAYABLE_AS()].filter((t) => t.cast && t.cast.length > 1 && !t.enEmision).map((t) => ({ id: t.cast[t.cast.length - 1], season: t.name || t.id })),
    /** Todas las reinas de todas las temporadas (para la partida personalizada), con su temporada. */
    allQueens: () => {
      const seen = new Map();
      allSeasons().filter((se) => se.cast && !se.special).forEach((se) => se.cast.forEach((id) => { if (!seen.has(id) && qById(id)) seen.set(id, se.id); }));
      return [...seen].map(([id, season]) => ({ id, season }));
    },
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
      // Todas las dinámicas ya existen en la sala: se presentan como en el modo historia
      const intro = ep === 1 ? info.intro || [] : [];
      const hola = [["host", pick1(["¡Hola, hola, mis reinas!", "¡Buenos días, reinas!", "¡Hola, mis niñas!"])]];
      return [...(ep === 1 ? intro : hola), ...pickFresh(HISTORIA.anuncio)];
    },
    /** Pantalla del lip sync con su telón, y luego el minijuego. */
    lipsyncShow(el, rivalId, o, cb) {
      const rival = qById(rivalId);
      el.innerHTML = `
        <div class="story-card">
          <p class="eyebrow">${o.eyebrow}</p>
          ${o.rivals && o.rivals.length > 1
            ? `<h3>${esc(S.queen.name)} vs ${o.rivals.map((id) => esc((qById(id) || {}).name || "")).join(" vs ")}</h3><div class="vs three"><img src="${photo(S.queen)}">${o.rivals.map((id) => `<img src="${photo(qById(id))}">`).join("")}</div>`
            : `<h3>${esc(S.queen.name)} vs ${esc(rival.name)}</h3><div class="vs"><img src="${photo(S.queen)}"><span>VS</span><img src="${photo(rival)}"></div>`}
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
    retos: () => MP_RETOS.filter((k) => RETOS[k]).map((k) => ({ tipo: k, titulo: RETOS[k].titulo(), desc: RETOS[k].desc, noRunway: !!RETOS[k].noRunway, ctrl: RETOS[k].ctrl, ...(RETOS[k].groups ? { groups: RETOS[k].groups } : {}) })),
    /** Minirretos (los del modo historia). */
    minis: () => Object.keys(MINIRETOS).map((id) => ({ id, titulo: MINIRETOS[id].titulo(), desc: MINIRETOS[id].desc, ctrl: MINIRETOS[id].ctrl })),
    /** Juega el minirreto (nota de 0 a 100). */
    runMini(el, id, cb) {
      const m = MINIRETOS[id] || MINIRETOS.posado;
      Music.play("reto");
      m.run(el, (raw) => { cleanup = null; Music.stop(); cb(Math.round(clamp(typeof window.__forceScore === "number" ? window.__forceScore : raw, 0, 100))); });
    },
    /** Nota de una reina del juego en el minirreto (como en el modo historia). */
    miniScore: (qId) => { const q = qById(qId); return q ? Math.round(clamp(rivalScore(q) + rnd(-12, 8), 0, 99)) : 40; },
    /** El sorteo de las parejas de la Segunda Oportunidrag, a la vista (list: [{ a, b }] con ids de reina). */
    sorteo(el, list, o, cb) {
      repescaSorteo(list.map((p) => ({ a: qById(p.a), b: p.b ? qById(p.b) : null, fixed: !!p.fixed })).filter((p) => p.a), { ...o, el }, cb);
    },
    categorias: () => (typeof TEMAS_PASARELA !== "undefined" ? TEMAS_PASARELA.filter((t) => !t.rv).map((t) => ({ n: t.n, d: t.d })) : CATEGORIAS.map((n) => ({ n, d: "" }))),
    setEp(ep, rivalIds) {
      if (!S) return;
      S.ep = ep;
      if (rivalIds) S.rivals = rivalIds.map(qById).filter(Boolean);
    },
    play(tipo, titulo, el, cb, extra = {}) {
      S.curTipo = tipo; S.curEpTipo = S.ep; S.curTitulo = titulo; S.team = null; S.cGroups = null; S.curPieces = null; S.lastLook = null;
      // Reto por grupos: con quién vas (y en el Girl Groups, el nombre de vuestra banda)
      if (extra.team && extra.team.length) S.team = extra.team.map(qById).filter(Boolean);
      S.gg = extra.band ? { ep: S.ep, band: extra.band } : null;
      // Segunda Oportunidrag: con quién haces el monólogo
      S.rp = extra.partner ? { ep: S.ep, pairs: { me: extra.partner }, ps: {} } : null;
      S.meOut = !!extra.out;
      // Quien reparte papeles (Rusical): la ganadora del capítulo anterior
      S.miniWin = extra.giver || null;
      S.juryNotes = null; S.liveEp = 0;
      // Si se hizo en directo, lo que pensó el jurado viaja con la nota para las críticas
      RETOS[tipo].run(el, (raw) => { cleanup = null; cb(Math.round(raw), S.liveEp === S.ep ? juryTxt() : ""); });
    },
    runway(el, cat, cb) { const id = runId; catAnnounce(cat, () => { if (id !== runId) return; el = body(); el.innerHTML = `<div id="story-play"></div>`; runRunwayNew(el.querySelector("#story-play"), cat, (walk) => { cleanup = null; cb(Math.round(walk)); }); }); },
    lipsync(el, rivalId, cb) { runLipsync(el, qById(rivalId), (won, score) => { cleanup = null; cb(!!won, Math.round(score || 0)); }); },
    /** Temporada del corazón: la grabación de la eliminada (r1 es ella; {dest}, a quien se lo deja). */
    heartVideo(fav) { return [...pickFresh(CORAZON_VIDEO.intro), ...pickFresh(CORAZON_VIDEO[fav ? "cariño" : "estrategia"])]; },
    /** Lip sync entre dos jugadoras: las tres opciones de un paso (el truco del paso lo elige la sala, igual para las dos). */
    lsOptions(emoteIdx, clim, lastTag) {
      const [, t, at] = EMOTES[emoteIdx % EMOTES.length];
      return [
        { k: "Emote", t, d: `Energía −45 · ${ATTR_NAMES[at]}${clim ? " · ¡Momento perfecto!" : " · Mejor en el clímax"}` },
        { k: "Cara", t: "💗 Conexión emocional", d: `Energía −10 · Carisma y Lipsync ${Math.round((A("carisma") + A("lipsync")) / 2)}${lastTag === "Cara" ? " · ⚠️ ya lo has hecho" : ""}` },
        { k: "Escenario", t: "🌀 Uso del espacio", d: `Energía −15 · Baile y Lipsync ${Math.round((A("baile") + A("lipsync")) / 2)}${lastTag === "Escenario" ? " · ⚠️ ya lo has hecho" : ""}` },
      ];
    },
    /** Resultado de un movimiento del duelo con los atributos de tu reina (las mismas reglas que el lip sync de siempre). */
    lsMove(kind, emoteIdx, clim, energy, lastTag) {
      // Reglas compartidas (src/core/lipsync.ts) con los atributos de tu reina
      const m = DFTC.lsMove({ kind, emote: emoteIdx, clim, energy, lastTag, attrs: attrsOf(S.queen), roll: Math.random() });
      return { tag: m.tag, imp: m.imp, energy: m.energy, msg: m.msg };
    },
    /** Premio del multijugador: lipsticks a su monedero. */
    reward(n, why) { const got = Wallet.add(n); if (got) Toast.show(`💄 +${DFTC.cantidad(got, "mp")}`, why); return got; },
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
    /** Críticas como en el modo individual (regla compartida: src/core/criticas.ts). */
    critique(tipo, level, name, look, extra = {}) {
      return DFTC.criticaJurado({ tipo, nivel: level, look, nombre: name, noRunway: !!(RETOS[tipo] || {}).noRunway, cat: extra.cat, antes: extra.antes }).map(([k, t]) => [DFTC.NOMBRE_JURADO[k], t]);
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
