  // ------------------------- Capitanas y equipos ---------------------------
  // Minirreto previo: las dos mejores son capitanas y eligen equipo por turnos
  function captains(then) {
    dialog(pickFresh(CAPITANAS.intro), ctxWith(pick1(S.rivals)), () => {
      body().innerHTML = `<div id="story-play"></div>`;
      Music.play("reto");
      runMiniFlash($("#story-play"), pick1(CAPITANAS.miniTitulos), (raw) => {
        cleanup = null;
        if (typeof window.__forceScore === "number") raw = window.__forceScore;
        Music.stop();
        const sc = [{ q: S.queen, s: Math.round(raw), me: true }, ...S.rivals.map((q) => ({ q, s: Math.round(clamp(rivalScore(q) + rnd(-12, 8), 0, 99)) }))].sort((a, b) => b.s - a.s);
        const caps = [sc[0].q, sc[1].q];
        if (sc[0].me) {
          S.advice += 3;
          S.points += 300;
        }
        header();
        body().innerHTML = `
          <div class="story-card">
            <p class="eyebrow">Minirreto · resultados</p>
            <h3>${caps.includes(S.queen) ? "¡Eres capitana! 👑" : `Capitanas: ${esc(caps[0].name)} y ${esc(caps[1].name)}`}</h3>
            ${sc[0].me ? `<p class="gold">Ganas el minirreto: +3 en el reto y eliges primero.</p>` : ""}
            <ol class="ranking">${sc
              .map((r, k) => `<li style="--i:${k}" class="${r.me ? "me" : ""}"><i style="background-image:url('${photo(r.q)}')"></i><span>${esc(r.q.name)}</span>${k < 2 ? `<b class="tag win">Capitana</b>` : ""}</li>`)
              .join("")}</ol>
            <button class="btn btn-primary" id="story-next">Elegir equipos</button>
          </div>`;
        $("#story-next").addEventListener("click", () => draft(caps[0], caps[1], then));
      });
    });
  }
  function draft(capA, capB, then) {
    const teams = new Map([[capA, [capA]], [capB, [capB]]]);
    let pool = [S.queen, ...S.rivals].filter((q) => q !== capA && q !== capB);
    let turn = capA, timer = 0, pickN = 0;
    const sk = [S.queen, ...S.rivals].map(skillOf), lo = Math.min(...sk), hi = Math.max(...sk);
    const stars = (q) => "★".repeat(1 + Math.round((4 * (skillOf(q) - lo)) / Math.max(1, hi - lo))) + "☆".repeat(4 - Math.round((4 * (skillOf(q) - lo)) / Math.max(1, hi - lo)));
    const aiPick = (cap) => {
      const val = (q) => skillOf(q) + (S.form[q.id] || 0) + rnd(-12, 12) + (q === S.queen ? relOf(cap) * 7 + S.wins * 3 : 0);
      return pool.slice().sort((a, b) => val(b) - val(a))[0];
    };
    function take(cap, q) {
      pickN++;
      teams.get(cap).push(q);
      pool = pool.filter((x) => x !== q);
      if (cap === S.queen) {
        if (pickN <= 2) changeRel(q, 1);
      } else if (q === S.queen) Toast.show(`👑 ${cap.name} te elige`, pickN <= 2 ? "¡De las primeras!" : "Más vale tarde que nunca");
      turn = turn === capA ? capB : capA;
    }
    function render() {
      const myTurn = turn === S.queen && pool.length;
      body().innerHTML = `
        <div class="story-card">
          <p class="eyebrow">Elección de equipos</p>
          <h3>${!pool.length ? "¡Equipos hechos!" : myTurn ? "Te toca elegir" : `Elige ${esc(turn.name)}...`}</h3>
          <div class="teams2">${[capA, capB]
            .map((c) => `<div class="team-col ${teams.get(c).includes(S.queen) ? "mine" : ""}"><b>Equipo de ${esc(c === S.queen ? "ti" : c.name)}</b>${teams
              .get(c)
              .map((q) => `<span><i style="background-image:url('${photo(q)}')"></i>${esc(q === S.queen ? "Tú" : q.name)}${q === c ? " 👑" : ""}</span>`)
              .join("")}</div>`)
            .join("")}</div>
          ${myTurn ? `<div class="hub-grid">${pool
            .map((q, i) => `<button class="hub-q ${relOf(q) >= 2 ? "ally" : relOf(q) <= -2 ? "enemy" : ""}" style="--i:${i}" data-id="${q.id}"><i style="background-image:url('${photo(q)}')"></i><span>${esc(q.name)}</span><small>${stars(q)} · ${relLabel(q)}</small>${roleChip(q)}</button>`)
            .join("")}</div>${trackBtn()}` : !pool.length ? `<button class="btn btn-primary" id="story-next">¡Al reto!</button>` : `<p class="muted">Quedan ${pool.length} por elegir</p>`}
        </div>`;
      if (myTurn) {
        bindTrack();
        body().querySelectorAll("[data-id]").forEach((b) => b.addEventListener("click", () => {
          take(S.queen, qById(b.dataset.id));
          step();
        }));
      } else if (!pool.length) {
        const mine = [...teams.values()].find((t) => t.includes(S.queen));
        const last = [...teams.values()].map((t) => t[t.length - 1]).find((q) => q !== S.queen);
        if (capA === S.queen || capB === S.queen) last && pickN > 2 && changeRel(last, -1);
        S.team = mine.filter((q) => q !== S.queen);
        $("#story-next").addEventListener("click", then);
      }
    }
    function step() {
      render();
      if (!pool.length || turn === S.queen) return;
      timer = setTimeout(() => {
        take(turn, aiPick(turn));
        step();
      }, 650);
    }
    cleanup = () => clearTimeout(timer);
    step();
  }

  // ------------------------------ Reencuentro -------------------------------
  function reunion() {
    setSet("stage");
    S.epNames[S.ep] = "Reencuentro";
    // Las cuatro que siguen en competición ya son finalistas
    [...(S.meOut ? [] : [S.queen]), ...S.rivals].forEach((q) => mark(q, "FINAL"));
    header();
    $("#story-ep").textContent = "El reencuentro";
    const all = () => [...S.rivals, ...S.out];
    scene("reunion", [...pickFresh(REENCUENTRO.intro), ...pickFresh(JAVIS.reencuentro)], ctxWith(S.out[0] || S.rivals[0]), pickTalk);
    function pickTalk() {
      if (!S.out.length) return drama();
      body().innerHTML = `
        <div class="story-card">
          <p class="eyebrow">💋 El reencuentro</p>
          <h3>Vuelven las eliminadas. ¿Con quién hablas?</h3>
          <p class="muted">Se acuerdan de todo lo que pasó dentro.</p>
          <div class="hub-grid">${S.out
            .map((q, i) => `<button class="hub-q ${relOf(q) >= 2 ? "ally" : relOf(q) <= -2 ? "enemy" : ""}" style="--i:${i}" data-id="${q.id}"><i style="background-image:url('${photo(q)}')"></i><span>${esc(q.name)}</span><small>${relLabel(q)}</small>${roleChip(q)}</button>`)
            .join("")}</div>
        </div>`;
      body().querySelectorAll("[data-id]").forEach((b) => b.addEventListener("click", () => {
        const q = qById(b.dataset.id);
        const r = relOf(q);
        const lines = [...pickFresh(REENCUENTRO[r >= 1 ? "buena" : r <= -1 ? "mala" : "neutra"])];
        if (roleOf(q)) lines.push(["r1", roleOf(q).reencuentro]);
        reveal(q);
        const ctx = { ...ctxWith(q), q: { r1: q, r2: S.rivals[0], r3: S.rivals[1] }, r1: q.name, tension: r <= -1 };
        scene("reunion", lines, ctx, () => {
          if (r >= 0) changeRel(q, 1);
          drama();
        }, r <= -1 ? REENCUENTRO.choicesMala : undefined);
      }));
    }
    function drama() {
      const nq = NEMESIS_ON && S.nemesis && S.nemesis.done !== "tregua" ? qById(S.nemesis.id) : null;
      if (nq && !S.flags.nemReunion) {
        S.flags.nemReunion = 1;
        return scene("reunion", NEMESIS.reencuentro, { ...ctxWith(nq), q: { r1: nq }, r1: nq.name, tension: true }, missSimpatia, NEMESIS.reencuentroChoices);
      }
      const everyone = all();
      const a = everyone.find((q) => ["villana", "cizanera", "diva"].includes(S.roles[q.id])) || pick1(everyone);
      const b = pick1(everyone.filter((q) => q !== a)) || a;
      reveal(a);
      scene("reunion", pickFresh(REENCUENTRO.drama), { ...ctxWith(a, { r2: b }), q: { r1: a, r2: b, r3: b }, r1: a.name, r2: b.name, tension: true }, missSimpatia);
    }
  }
  function missSimpatia() {
    const everyone = [S.queen, ...S.rivals, ...S.out];
    const BONUS = { madre: 1.6, graciosa: 1.1, sensible: 0.6, novata: 0.5, estratega: -0.3, diva: -1, cizanera: -1.6, villana: -2.2 };
    const appeal = everyone.reduce((m, q) => m.set(q, (BONUS[S.roles[q.id]] || 0) + rnd(-0.6, 0.6)), new Map());
    dialog(REENCUENTRO.missIntro, ctxWith(S.rivals[0]), () => {
      body().innerHTML = `
        <div class="story-card">
          <p class="eyebrow">💐 Miss Simpatía · tu voto</p>
          <h3>¿Quién ha sido la compañera más querida?</h3>
          <p class="muted">No puedes votarte a ti misma. Todas votan a la vez.</p>
          <div class="hub-grid">${everyone.filter((q) => q !== S.queen)
            .map((q, i) => `<button class="hub-q ${relOf(q) >= 2 ? "ally" : relOf(q) <= -2 ? "enemy" : ""}" style="--i:${i}" data-id="${q.id}"><i style="background-image:url('${photo(q)}')"></i><span>${esc(q.name)}</span><small>${relLabel(q)}</small>${roleChip(q)}</button>`)
            .join("")}</div>
          ${trackBtn()}
        </div>`;
      bindTrack();
      body().querySelectorAll("[data-id]").forEach((b) => b.addEventListener("click", () => tally(qById(b.dataset.id))));
    });
    function tally(myVote) {
      const votes = new Map(everyone.map((q) => [q, []]));
      everyone.forEach((v) => {
        let c = myVote;
        if (v !== S.queen) {
          const val = (q) => (q === S.queen ? relOf(v) * 1.2 + 0.3 : 0) + appeal.get(q) + groupAff(v, q) * 0.4 + rnd(-1.4, 1.4);
          c = everyone.filter((q) => q !== v).sort((a, b) => val(b) - val(a))[0];
        }
        votes.get(c).push(v);
      });
      changeRel(myVote, 1);
      const ranked = everyone.slice().sort((a, b) => votes.get(b).length - votes.get(a).length || appeal.get(b) - appeal.get(a));
      const win = ranked[0];
      S.missC = keyOf(win);
      if (win === S.queen) earn(400, "Premio Miss Simpatía");
      mark(win, (S.track[keyOf(win)] || {})[S.ep] === "FINAL" ? "FINAL-MISSC" : "MISSC");
      if (win === S.queen) {
        S.points += 1500;
        Achievements.unlock("miss-simpatia");
        Confetti.burst(3000);
      }
      header();
      body().innerHTML = `
        <div class="story-card">
          <p class="eyebrow">💐 Miss Simpatía de ${esc(S.season.name)}</p>
          <h3>${win === S.queen ? "¡Eres Miss Simpatía! 💐" : `${esc(win.name)} es Miss Simpatía`}</h3>
          <div class="votes">${ranked.slice(0, 4)
            .map((q) => `<div class="vote-col ${q === win ? "top" : ""}"><i style="background-image:url('${photo(q)}')"></i><b>${esc(q === S.queen ? "Tú" : q.name)}</b><span>${votes.get(q).length} voto${votes.get(q).length === 1 ? "" : "s"}</span><div class="voters">${votes.get(q).map((v) => `<img src="${photo(v)}" title="${esc(v === S.queen ? "Tú" : v.name)}">`).join("")}</div></div>`)
            .join("")}</div>
          <p>Tu voto fue para <b>${esc(myVote.name)}</b>. Las cuatro finalistas pasan a la gran final.</p>
          <button class="btn btn-primary" id="story-next">¡A la gran final!</button>
        </div>`;
      S.flags.reunion = true;
      if (S.meOut) {
        S.phase = null;
        save();
        return $("#story-next").addEventListener("click", afterFinal);
      }
      endEpisodeBtn();
    }
  }

  // --------------------------------- Final ---------------------------------
  // Top 4: sorteo, dos lip syncs y las ganadoras se enfrentan por la corona
  const simLS = (a, b) => {
    const L = BALANCE.lipSync;
    const v = (q) => skillOf(q) + (S.record[keyOf(q)] || 0) * L.porRecord + (S.form[q.id] || 0) + (traitsOf(q).fort === "lipsync" ? L.fortaleza : 0) + (traitsOf(q).deb === "lsFlojo" ? L.debilidad : 0) + Nem.power(q.id) * L.poderFactor;
    return Math.random() < clamp(0.5 + (v(a) - v(b)) / L.escala, L.min, L.max) ? [a, b] : [b, a];
  };
  function playLS(rival, o, cb) {
    body().innerHTML = `
      <div class="story-card">
        <p class="eyebrow">${o.eyebrow}</p>
        <h3>${esc(S.queen.name)} vs ${esc(rival.name)}</h3>
        <div class="vs"><img src="${photo(S.queen)}"><span>VS</span><img src="${photo(rival)}"></div>
        <p>${o.text}</p>
        <button class="btn btn-primary" id="story-ls">¡A la pasarela!</button>
      </div>`;
    Music.play("tension");
    $("#story-ls").addEventListener("click", () => Curtain.run(() => {
      Music.stop();
      lsGame(rival, (res) => {
        UI.show("story");
        S.points += Math.round(res.score || 0);
        if (res.won) {
          S.lipsyncs++;
          S.points += 1500;
          if (S.lipsyncs >= 3) Achievements.unlock("superviviente");
        }
        header();
        cb(res.won);
      });
    }, o.curtain));
  }
  // Gran final: Súper Lalaparuza. Todas contra todas en lip sync; gana la que más duelos se lleve.
  // Si alguien tiene el pase directo (ganó el último reto antes de la final), espera a la ganadora y se juegan la corona.
  const pairsOf = (list) => list.flatMap((a, i) => list.slice(i + 1).map((b) => [a, b]));
  const nmQ = (q) => (q === S.queen ? "Tú" : q.name);
  function standingsHTML(list, wins, title) {
    const sorted = list.slice().sort((a, b) => (wins.get(b) || 0) - (wins.get(a) || 0));
    return `<div class="lala-table">${title ? `<b>${title}</b>` : ""}${sorted.map((q) => `<span class="${q === S.queen ? "me" : ""}"><i style="background-image:url('${photo(q)}')"></i>${esc(nmQ(q))}<em>${"👑".repeat(wins.get(q) || 0) || "·"}</em></span>`).join("")}</div>`;
  }
  // Versión simulada (cuando ves la final desde el público)
  function simSuperLala(four, pase) {
    const pool = four.filter((q) => q !== pase);
    const wins = new Map(pool.map((q) => [q, 0]));
    const log = [];
    shuffle(pairsOf(pool)).forEach(([a, b]) => { const [w] = simLS(a, b); wins.set(w, wins.get(w) + 1); log.push({ a, b, w }); });
    const order = () => pool.slice().sort((a, b) => wins.get(b) - wins.get(a));
    let lead = order();
    let tied = lead.filter((q) => wins.get(q) === wins.get(lead[0]));
    while (tied.length > 1) { const [w, l] = simLS(tied[0], tied[1]); log.push({ a: tied[0], b: tied[1], w, desempate: true }); tied = [w, ...tied.slice(2)]; }
    let champ = tied[0], runner;
    if (pase) { const [w, l] = simLS(champ, pase); log.push({ a: champ, b: pase, w, corona: true }); runner = l; champ = w; }
    else runner = order().find((q) => q !== champ);
    return { champ, runner, wins, log, pool };
  }
  // ---------------- All Winners: nadie se va; todas llegan a la final ----------------
  // Cada semana el top 2 hace lip sync por una estrella. La final es una eliminatoria de lip syncs entre todas
  function winnersWeeks() { return clamp(S.rivals.length + S.out.length + (S.meOut ? 0 : 1) - 1, 4, 8); }
  function winnersStar(dec) {
    S.stars = S.stars || {};
    const k = dec.me ? "me" : dec.q.id;
    S.stars[k] = (S.stars[k] || 0) + 1;
    if (dec.me) { S.wins++; Toast.show("⭐ ¡Una estrella para ti!", "Te dará ventaja en la gran final"); }
    logEv(`${dec.me ? S.queen.name : dec.q.name} gana una estrella`);
    header();
    body().innerHTML = `
      <div class="story-card">
        <p class="eyebrow">⭐ All Winners</p>
        <h3>${dec.me ? "¡Te llevas la estrella!" : `Estrella para ${esc(dec.q.name)}`}</h3>
        <p>Esta semana nadie se va a casa. Todas seguís en la competición.</p>
        ${standingsHTML([S.queen, ...S.rivals], new Map([S.queen, ...S.rivals].map((q) => [q, (S.stars || {})[keyOf(q)] || 0])), "Estrellas").replace(/👑/g, "⭐")}
        <button class="btn btn-primary" id="story-next">Siguiente episodio</button>
      </div>`;
    endEpisodeBtn();
  }
  function winnersFinal() {
    setSet("stage");
    S.epNames[S.ep] = "Final";
    const all = [S.queen, ...S.rivals];
    const starsOf = (q) => (S.stars || {})[keyOf(q)] || 0;
    // Cabezas de serie por estrellas (la que más tiene descansa si sois impares)
    let alive = shuffle(all).sort((a, b) => starsOf(b) - starsOf(a));
    let round = 1, duels = [], di = 0, bye = null, next = [];
    const tbl = () => standingsHTML(all.filter((q) => alive.includes(q)), new Map(all.map((q) => [q, starsOf(q)])), "Siguen en pie · ⭐ estrellas").replace(/👑/g, "⭐");
    let roundSize = 0;
    function setupRound() {
      roundSize = alive.length;
      bye = alive.length % 2 ? alive[0] : null;
      const pool = alive.filter((q) => q !== bye);
      duels = [];
      for (let i = 0; i < pool.length / 2; i++) duels.push([pool[i], pool[pool.length - 1 - i]]);
      di = 0;
      next = bye ? [bye] : [];
    }
    const roundName = () => (alive.length === 2 ? "Lip sync por la corona" : `Ronda ${round}`);
    function board(note = "") {
      header();
      const d = duels[di];
      body().innerHTML = `
        <div class="story-card">
          <p class="eyebrow">👑 Gran final All Winners · ${roundName()}</p>
          <h3>${d ? `${esc(nmQ(d[0]))} vs ${esc(nmQ(d[1]))}` : "Ronda terminada"}</h3>
          ${note ? `<p class="twist-note">${note}</p>` : ""}
          ${bye && round === 1 && di === 0 ? `<p class="muted">⭐ ${esc(nmQ(bye))} tiene más estrellas y descansa esta ronda.</p>` : ""}
          ${tbl()}
          <button class="btn btn-primary" id="story-next">${d ? (d.includes(S.queen) ? "💃 Mi lip sync" : "Ver el duelo") : "Siguiente ronda"}</button>
        </div>`;
      $("#story-next").addEventListener("click", () => (d ? duel() : endRound()));
    }
    let lastRunner = null;
    function lose(q) {
      if (alive.length === 2) lastRunner = q;
      alive = alive.filter((x) => x !== q);
    }
    function duel() {
      const [a, b] = duels[di++];
      if (a === S.queen || b === S.queen) {
        const rv = a === S.queen ? b : a;
        S.lsBonus = clamp(starsOf(S.queen) * 3 - starsOf(rv) * 2, -6, 12);
        return playLS(rv, { eyebrow: `Gran final · ${roundName()}`, text: "La que pierda se queda fuera de la corona.", curtain: alive.length === 2 ? "LIP SYNC POR LA CORONA" : "GRAN FINAL" }, (won) => {
          const w = won ? S.queen : rv, l = won ? rv : S.queen;
          next.push(w);
          if (!won) return meOut(w, l);
          lose(l);
          board(`💃 Ganas a ${esc(rv.name)}.`);
        });
      }
      const [w, l] = simLS(a, b);
      next.push(w);
      lose(l);
      board(`${esc(w.name)} gana a ${esc(l.name)}.`);
    }
    function endRound() {
      alive = shuffle(next).sort((a, b) => starsOf(b) - starsOf(a));
      round++;
      if (alive.length === 1) return finish(alive[0]);
      setupRound();
      board();
    }
    // Si caes, el resto de la final se resuelve sola
    function meOut(by, me) {
      // Las que caen en la misma ronda comparten puesto (p. ej. 5º/8º)
      const lo = Math.ceil(roundSize / 2) + 1;
      const place = roundSize <= 2 ? 2 : lo === roundSize ? lo : `${lo}º/${roundSize}º`;
      lose(me);
      let rest = [...next, ...duels.slice(di).map(([a, b]) => simLS(a, b)[0])];
      let runner = by;
      while (rest.length > 1) {
        const r2 = [];
        rest = shuffle(rest);
        if (rest.length % 2) r2.push(rest.pop());
        for (let i = 0; i < rest.length; i += 2) { const [w, l] = simLS(rest[i], rest[i + 1]); r2.push(w); runner = l; }
        rest = r2;
      }
      const champ = rest[0] || by;
      all.filter((q) => q !== S.queen && q !== champ && q !== runner).forEach((q) => { mark(q, "ELIM"); eliminate(q); });
      mark(champ, "WINNER");
      if (runner && runner !== champ) mark(runner, "RUNNER-UP");
      if (place === 2) return theEnd(false, champ, true, `${champ.name} te gana la corona de All Winners.`, 2);
      mark(S.queen, "ELIM");
      return theEnd(false, champ, false, `${by.name} te gana en la final. La corona se la lleva ${champ.name}.`, place);
    }
    // Solo se llega aquí si ganas tú (si caes, meOut cierra la final)
    function finish(champ) {
      all.filter((q) => q !== champ && q !== lastRunner).forEach((q) => mark(q, "ELIM"));
      return theEnd(champ === S.queen, lastRunner, true);
    }
    dialog([["host", "Reinas, llegamos a la gran final de All Winners. Aquí estáis todas: nadie se fue a casa."], ["host", "Pero solo una se lleva la corona. Lip sync contra lip sync: la que pierda, se queda fuera."], ["judge", "Las estrellas que habéis ganado cuentan: la que más tenga, más fácil lo tiene."]], ctxWith(S.rivals[0]), () => { setupRound(); board(); });
  }

  function finale() {
    setSet("stage");
    if (S.bottoms === 0) Achievements.unlock("sin-bottom");
    S.epNames[S.ep] = "Final";
    const four = [S.queen, ...S.rivals];
    const pase = S.flags.pase ? four.find((q) => keyOf(q) === S.flags.pase) || null : null;
    const pool = shuffle(four.filter((q) => q !== pase));
    const wins = new Map(pool.map((q) => [q, 0]));
    const duels = shuffle(pairsOf(pool));
    // Tu temporada cuenta: las victorias te dan ventaja en la final y los bottoms te la quitan
    const seasonEdge = clamp(S.wins * 3 - S.bottoms * 2, -6, 12);
    const intro = [
      ["host", "Reinas, bienvenidas a la gran final. Este año no hay sorteo: hay Súper Lalaparuza."],
      ["host", pase ? `${pase === S.queen ? "Tú tienes" : `${pase.name} tiene`} el pase directo: ${pase === S.queen ? "esperas" : "espera"} a la ganadora de la Súper Lalaparuza y os jugáis la corona en un último lip sync.` : "Todas contra todas, un lip sync por pareja. La que más duelos gane se lleva la corona."],
      ["judge", "Y si hay empate, se desempata en el escenario. Aquí no se regala nada."],
    ];
    dialog([...pickFresh(HISTORIA.final), ...pickFresh(JAVIS.final), ...intro], ctxWith(S.rivals[0]), board);
    let di = 0;
    function board(note = "") {
      header();
      body().innerHTML = `
        <div class="story-card">
          <p class="eyebrow">👑 Súper Lalaparuza · duelo ${Math.min(di + 1, duels.length)} de ${duels.length}</p>
          <h3>${di < duels.length ? `${esc(nmQ(duels[di][0]))} vs ${esc(nmQ(duels[di][1]))}` : "Se acabaron los duelos"}</h3>
          ${note ? `<p class="twist-note">${note}</p>` : ""}
          ${standingsHTML(pool, wins, "Duelos ganados")}
          ${pase ? `<p class="muted">🎟️ Pase directo: <b>${esc(nmQ(pase))}</b> espera en la final.</p>` : ""}
          ${trackBtn()}
          <button class="btn btn-primary" id="story-next">${di < duels.length ? (duels[di].includes(S.queen) ? "💃 Mi lip sync" : "Ver el duelo") : "Resultado"}</button>
        </div>`;
      bindTrack();
      $("#story-next").addEventListener("click", () => (di < duels.length ? duel() : afterRound()));
    }
    function lsMe(rival, eyebrow, text, cb) {
      S.lsBonus = seasonEdge;
      playLS(rival, { eyebrow, text, curtain: "SÚPER LALAPARUZA" }, cb);
    }
    function duel() {
      const [a, b] = duels[di++];
      if (a === S.queen || b === S.queen) {
        const rv = a === S.queen ? b : a;
        return lsMe(rv, "Súper Lalaparuza", `Cada duelo ganado te acerca a la corona.`, (won) => { const w = won ? S.queen : rv; wins.set(w, wins.get(w) + 1); board(won ? `💃 Ganas el duelo contra ${esc(rv.name)}.` : `💔 ${esc(rv.name)} se lleva el duelo.`); });
      }
      const [w, l] = simLS(a, b);
      wins.set(w, wins.get(w) + 1);
      board(`${esc(w.name)} gana a ${esc(l.name)}. ${esc(fill(pickFresh(HISTORIA.lipsyncOtras), { a: w.name, b: l.name }))}`);
    }
    // Empates: se desempata en el escenario (dos a dos)
    function afterRound() {
      const top = Math.max(...pool.map((q) => wins.get(q)));
      const tied = pool.filter((q) => wins.get(q) === top);
      tiebreak(tied, (lead) => (pase ? crown(lead, pase) : finish(lead, pool.filter((q) => q !== lead).sort((a, b) => wins.get(b) - wins.get(a))[0])));
    }
    function tiebreak(tied, then) {
      if (tied.length === 1) return then(tied[0]);
      const [a, b] = tied;
      const rest = tied.slice(2);
      const next = (w) => tiebreak([w, ...rest], then);
      if (a === S.queen || b === S.queen) {
        const rv = a === S.queen ? b : a;
        return showCard("Empate", `${esc(nmQ(a))} y ${esc(nmQ(b))} empatan`, "Se desempata con otro lip sync.", "💃 Lip sync de desempate", () => lsMe(rv, "Desempate", "Quien gane sigue adelante.", (won) => next(won ? S.queen : rv)));
      }
      const [w, l] = simLS(a, b);
      showCard("Empate", `Desempate: ${esc(a.name)} vs ${esc(b.name)}`, `Gana <b>${esc(w.name)}</b>.`, "Seguir", () => next(w));
    }
    function showCard(eyebrow, title, text, btn, then) {
      header();
      body().innerHTML = `<div class="story-card"><p class="eyebrow">👑 ${eyebrow}</p><h3>${title}</h3><p>${text}</p>${standingsHTML(pool, wins, "Duelos ganados")}<button class="btn btn-primary" id="story-next">${btn}</button></div>`;
      $("#story-next").addEventListener("click", then);
    }
    // Pase directo: la ganadora de la Súper Lalaparuza contra la que tiene el pase
    function crown(lead, holder) {
      if (lead === S.queen || holder === S.queen) {
        const rv = lead === S.queen ? holder : lead;
        return showCard("Lip sync por la corona", `${esc(nmQ(lead))} vs ${esc(nmQ(holder))}`, "Un último lip sync. Una corona.", "👑 Lip sync por la corona", () => lsMe(rv, "Lip sync por la corona", "La que gane se lleva la corona.", (won) => finish(won ? S.queen : rv, won ? rv : S.queen)));
      }
      const [w, l] = simLS(lead, holder);
      showCard("Lip sync por la corona", `${esc(lead.name)} vs ${esc(holder.name)}`, `Gana <b>${esc(w.name)}</b>.`, "Ver el resultado", () => finish(w, l));
    }
    function finish(champ, runner) {
      four.filter((q) => q !== champ && q !== runner && q !== S.queen).forEach((q) => { mark(q, "3ª"); eliminate(q); });
      if (champ === S.queen) return theEnd(true, runner, true);
      if (runner === S.queen) return theEnd(false, champ, true, `${champ.name} te gana la corona en la Súper Lalaparuza.`, 2);
      mark(S.queen, "3ª");
      mark(champ, "WINNER");
      mark(runner, "RUNNER-UP");
      return theEnd(false, champ, false, `La Súper Lalaparuza se la lleva ${champ.name}.`, 3);
    }
  }

  // ------------------- Si te eliminan: la temporada sigue sin ti -------------------
  // Se ve semana a semana en el track record, luego el reencuentro (Miss Simpatía) y la final
  const placeTxt = (p) => (typeof p === "string" ? p : `${p}º`);
  function aftermath(by, reason = "", place = null) {
    S.meOut = true;
    S.flags.aftermath = 1;
    S.flags.myPlace = place || S.rivals.length + 1;
    S.flags.outEp = S.ep;
    if (S.track.me && S.track.me[S.ep]) mark(S.queen, "ELIM");
    S.phase = null;
    save();
    Music.stop();
    header();
    body().innerHTML = `
      <div class="story-card">
        <p class="eyebrow">Sashay away</p>
        <h3>${esc(S.queen.name)}, te vas a casa... puesto ${placeTxt(S.flags.myPlace)}</h3>
        ${by ? `<div class="vs"><img class="gone" src="${photo(S.queen)}"><span>💔</span><img src="${photo(by)}"></div>` : ""}
        <p>${reason || (by ? `${esc(by.name)} se queda en la competición.` : "")}</p>
        <p class="muted">Pero la temporada sigue: verás cómo va cayendo cada reina hasta el reencuentro, donde aún puedes ganar Miss Simpatía, y la gran final.</p>
        <button class="btn btn-primary" id="story-next">Ver cómo sigue la temporada</button>
      </div>`;
    $("#story-next").addEventListener("click", afterStep);
  }
  function simWeek() {
    S.ep++;
    const tipo = pickReto();
    S.curTipo = tipo;
    S.curEpTipo = S.ep;
    S.epNames[S.ep] = EP_SHORT[tipo] || "Reto";
    const rows = S.rivals.map((q) => ({ q, s: rivalScore(q) + rnd(-10, 10) })).sort((a, b) => b.s - a.s);
    const n = rows.length;
    const allCrit = n <= 6;
    rows.forEach((r, k) => {
      const lab = k === 0 ? "WIN" : k >= n - 2 ? "BTM2" : k <= (n <= 7 ? 1 : 2) ? "HIGH" : k >= n - 3 ? "LOW" : "SAFE";
      mark(r.q, lab);
      const key = keyOf(r.q);
      S.record[key] = (S.record[key] || 0) + (k === 0 ? 3 : k >= n - 2 ? 0 : 1);
      S.form[r.q.id] = clamp((S.form[r.q.id] || 0) + (k === 0 ? 2 : k >= n - 2 ? 3 : 0) + rnd(-2, 2), -10, 10);
    });
    if (n === 5 && !asLike(twistOf())) S.flags.pase = keyOf(rows[0].q);
    if (twistOf() === "repesca" && !S.flags.repesca && S.rivals.length === REPESCA_AT + 1) S.flags.immune = rows[0].q.id;
    if (twistOf() === "repesca" && !S.flags.repesca && S.rivals.length <= REPESCA_AT) {
      const gone = [rows[n - 2].q, rows[n - 1].q];
      gone.forEach((q) => eliminate(q));
      // Si no estás esperando la repesca, vuelve una por sorpresa
      if (!S.flags.waitRepesca) {
        S.flags.repesca = true;
        const pool = S.out.filter((q) => !gone.includes(q));
        const back = pool.sort((a, b) => skillOf(b) + rnd(-12, 12) - skillOf(a))[0];
        if (back) { S.out = S.out.filter((q) => q !== back); S.rivals.push(back); logEv(`${back.name} vuelve con la Segunda Oportunidrag`); }
        return { win: rows[0].q, gone, back };
      }
      return { win: rows[0].q, gone };
    }
    const [stay, go] = simLS(rows[n - 2].q, rows[n - 1].q);
    nemEvent("elim", stay, go);
    eliminate(go);
    return { win: rows[0].q, stay, go };
  }
  function afterStep() {
    if (S.rivals.length <= 4) return afterReunion();
    const r = simWeek();
    S.phase = null;
    save();
    const face = (q) => `<i class="tn-face" style="background-image:url('${photo(q)}')"></i>`;
    if (r.gone) return showTrack(afterStep, S.rivals.length <= 4 ? "Al reencuentro" : "Siguiente semana",
      `${face(r.win)} 👑 Gana <b>${esc(r.win.name)}</b> · 💥 Doble eliminación: ${r.gone.map((q) => `<b>${esc(q.name)}</b>`).join(" y ")} se van de golpe${r.back ? ` · 🔁 Sorpresa: <b>${esc(r.back.name)}</b> vuelve con la Segunda Oportunidrag` : ""}.`);
    showTrack(afterStep, S.rivals.length <= 4 ? "Al reencuentro" : "Siguiente semana",
      `${face(r.win)} 👑 Gana <b>${esc(r.win.name)}</b> · ${face(r.go)} 💔 <b>${esc(r.go.name)}</b> pierde el lip sync contra <b>${esc(r.stay.name)}</b> y se va a casa.`);
  }
  function afterReunion() {
    Curtain.run(() => {
      S.ep++;
      reunion();
    }, "EL REENCUENTRO");
  }
  function afterFinal() {
    Curtain.run(() => {
      setSet("stage");
      S.ep++;
      S.epNames[S.ep] = "Final";
      const four = S.rivals.slice();
      const pase = S.flags.pase ? four.find((q) => keyOf(q) === S.flags.pase) || null : null;
      const r = simSuperLala(four, pase);
      four.filter((q) => q !== r.champ && q !== r.runner).forEach((q) => mark(q, "3ª"));
      mark(r.champ, "WINNER");
      mark(r.runner, "RUNNER-UP");
      header();
      $("#story-ep").textContent = "Gran final";
      body().innerHTML = `
        <div class="story-card">
          <p class="eyebrow">👑 Súper Lalaparuza · lo ves desde el público</p>
          <h3>${esc(r.champ.name)} es la ganadora de ${esc(S.season.name)}</h3>
          ${standingsHTML(r.pool, r.wins, "Duelos ganados")}
          <div class="lala-log">${r.log.map((x) => `<p>${x.corona ? "👑 Por la corona: " : x.desempate ? "⚖️ Desempate: " : ""}<b>${esc(x.w.name)}</b> gana a ${esc((x.w === x.a ? x.b : x.a).name)}</p>`).join("")}</div>
          ${pase ? `<p class="muted">🎟️ ${esc(pase.name)} llegaba con el pase directo.</p>` : ""}
          <div class="vs"><img src="${photo(r.champ)}"><span>👑</span><img class="gone" src="${photo(r.runner)}"></div>
          <button class="btn btn-primary" id="story-next">Track record final</button>
        </div>`;
      Confetti.burst(2500);
      $("#story-next").addEventListener("click", () =>
        showTrack(() => theEnd(false, r.champ, false, `Te fuiste en el episodio ${S.flags.outEp || "?"}. La corona se la lleva ${r.champ.name}.`, S.flags.myPlace || S.out.length + 1), "Resultado final"));
    }, "GRAN FINAL");
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
      track: trackHTML(),
      ppe: myPPE(),
      winsT: Object.values(S.track.me || {}).filter((l) => l === "WIN").length,
    };
    // La reina que reina ahora en esta temporada: la ganadora de tu última partida
    {
      const fe2 = Object.keys(S.epNames).map(Number).sort((a, b) => b - a)[0];
      const champ = [S.queen, ...S.rivals, ...S.out].find((x) => (S.track[keyOf(x)] || {})[fe2] === "WINNER");
      if (champ) {
        const R = store.get("dftc-reinantes", {});
        const prev = R[S.season.id] || {};
        R[S.season.id] = { queen: champ.id, mine: champ === S.queen, player: S.queen.id, date: entry.date, reigns: (prev.queen === champ.id ? prev.reigns || 1 : 0) + 1 };
        store.set("dftc-reinantes", R);
        entry.champ = champ.id;
      }
    }
    const pos = StoryBoard.record(entry);
    store.set(SAVE_KEY, null);
    Story.lastEntryId = pos >= 0 ? entry.id : null;
    if (won) {
      const w = store.get("dftc-story-wins", []);
      if (!w.includes(S.season.id)) store.set("dftc-story-wins", [...w, S.season.id]);
      // Con qué reina has ganado (y quién fue runner-up): sirve para el All Winners
      {
        const fe3 = Object.keys(S.epNames).map(Number).sort((a, b) => b - a)[0];
        const ru = rival || [...S.rivals, ...S.out].find((x) => (S.track[keyOf(x)] || {})[fe3] === "RUNNER-UP");
        const C = store.get("dftc-story-crowns", {});
        C[S.season.id] = { queen: S.queen.id, runner: ru ? ru.id : null, date: entry.date };
        store.set("dftc-story-crowns", C);
      }
      Sound.win();
      Confetti.burst(5000);
      Music.play("corona");
      Achievements.unlock("corona-historia");
      if (S.season.special === "winners") Achievements.unlock("all-winners");
      const crowns = store.get("dftc-story-wins", []);
      if (FRANCHISES.find((f) => f.id === "es").seasons.filter((x) => !x.enEmision).every((x) => crowns.includes(x.id))) Achievements.unlock("espana");
    } else Music.stop();
    const earned = Wallet.add(S.points / 40);
    const pNum = parseInt(place, 10) || 99;
    const prize = won ? 2500 : pNum === 2 ? 1000 : pNum <= 4 ? 500 : 150;
    // La corona queda en la memoria: la ganadora vuelve más fuerte en las siguientes temporadas
    const fe = Object.keys(S.epNames).map(Number).sort((a, b) => b - a)[0];
    [S.queen, ...S.rivals, ...S.out].forEach((q) => {
      const l = (S.track[keyOf(q)] || {})[fe];
      if (l === "WINNER") { Nem.addPower(q.id, 3); const d = Nem.get(); d.q[q.id] = { ...(d.q[q.id] || {}), titles: [...((d.q[q.id] || {}).titles || []), S.season.name] }; Nem.put(d); }
      if (l === "RUNNER-UP" || l === "3ª") Nem.addPower(q.id, 1);
    });
    Closet.add(prize);
    body().innerHTML = `
      <div class="story-card end ${won ? "won" : ""}">
        <img class="story-queen" src="${sprite(S.queen)}" alt="">
        <div>
          <p class="eyebrow">${esc(S.season.name)} · resultado final</p>
          <h3>${won ? `¡${esc(S.queen.name)}, eres la ganadora! 👑` : `Sashay away... puesto ${placeTxt(place)}`}</h3>
          <p>${won ? "La corona es tuya. Felicidrages." : reason || `${esc(rival.name)} te ha ganado el lip sync.`}</p>
          <p class="story-pts">Track record: ${(entry.ppe || 0).toFixed(2).replace(".", ",")} PPE · +${earned} ✨ · 💶 +${prize.toLocaleString("es-ES")} € para tu armario</p>
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
    // Hall of Fame mundial y memoria larga (solo si hay servidor)
    let sent = false;
    const sendWorld = () => {
      if (sent || !window.DFTC_NET) return;
      sent = true;
      const nm = (nameInput && nameInput.value.trim()) || store.get("dftc-name", "") || "Anónima";
      window.DFTC_NET.submitScore({ ...entry, queen: q.id, season: s.id, name: nm });
    };
    if (window.DFTC_NET) {
      const sum = (S.log || []).slice(-24).map((x) => x.replace(/^Ep\.(\d+):\s*/, "Ep.$1 ")).join(" · ");
      window.DFTC_NET.addMemory(s.name, q.name, `${won ? "Ganó la corona" : `Quedó ${placeTxt(place)}`}. ${sum}`);
      ["#story-scores", "#story-track"].forEach((id) => $(id) && $(id).addEventListener("click", sendWorld));
      addEventListener("pagehide", sendWorld, { once: true });
    }
    $("#story-menu").addEventListener("click", () => { sendWorld(); abandon(); UI.show("menu"); });
    $("#story-again").addEventListener("click", () => { sendWorld(); start(q, s); });
    S.endHTML = body().innerHTML;
    $("#story-track").addEventListener("click", () => showTrack(() => { body().innerHTML = S.endHTML; theEndRebind(q, s); }, "Volver"));
    $("#story-scores").addEventListener("click", () => { UI.scoresTab("story"); UI.show("scores"); });
  }

  // ------------------------- Reto por equipos ------------------------------
  function runEquipos(el, done) {
    // Tu equipo: la mitad del reparto, con preferencia por tus aliadas.
    // La que se va esta semana (rivals[0]) y la otra del bottom van al equipo Oro.
    ensureTeam();
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

  // Si no hubo elección de capitanas (p. ej. en pruebas), equipo por afinidad
  function ensureTeam() {
    if (S.team) return;
    const size = Math.max(1, Math.floor((S.rivals.length + 1) / 2) - 1);
    S.team = S.rivals.slice().sort((a, b) => relOf(b) - relOf(a) || Math.random() - 0.5).slice(0, size);
  }

