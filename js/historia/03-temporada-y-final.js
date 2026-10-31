  // ------------------------- Capitanas y equipos ---------------------------
  // Minirreto previo: las dos mejores son capitanas y eligen equipo por turnos
  function captains(then) {
    // Desde el segundo capítulo, las capitanas son las dos mejores del capítulo anterior
    const prev = prevRank([S.queen, ...S.rivals]);
    if (prev) {
      const caps = prev.slice(0, 2), nm = (q) => (q === S.queen ? "tú" : q.name);
      return dialog([["host", "Reinas, esta semana trabajaréis en equipos."], ["host", `Las capitanas serán las mejores de la semana pasada: ${caps.map((q) => (q === S.queen ? S.queen.name : q.name)).join(" y ")}.`]], ctxWith(pick1(S.rivals)), () => {
        body().innerHTML = `
          <div class="story-card">
            <p class="eyebrow">Capitanas</p>
            <h3>${caps.includes(S.queen) ? "¡Eres capitana! 👑" : `Capitanas: ${esc(caps[0].name)} y ${esc(caps[1].name)}`}</h3>
            <p class="muted">Por cómo quedasteis el capítulo anterior. Elige primero ${esc(nm(caps[0]))}.</p>
            <ol class="ranking">${caps.map((q, k) => `<li style="--i:${k}" class="${q === S.queen ? "me" : ""}"><i style="background-image:url('${photo(q)}')"></i><span>${esc(q.name)}</span><b class="tag win">Capitana</b></li>`).join("")}</ol>
            <button class="btn btn-primary" id="story-next">Elegir equipos</button>
          </div>`;
        $("#story-next").addEventListener("click", () => draft(caps[0], caps[1], then));
      });
    }
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
  // La ganadora del lip sync se lleva una estrella y bloquea a una compañera: la semana que viene no podrá ganar estrella
  // Como en el All Stars 7: las dos del top ganan estrella (salvo la bloqueada) y la del lip sync, además, bloquea
  function winnersStar(dec, top2) {
    S.stars = S.stars || {};
    const k = dec.me ? "me" : dec.q.id;
    const decName = dec.me ? S.queen.name : dec.q.name;
    const blockedKey = S.block && S.block.ep === S.ep ? S.block.id : null;
    const blocked = blockedKey === k;
    const keys = (top2 && top2.length ? top2.map((r) => (r.me ? "me" : r.q.id)) : [k]);
    keys.forEach((x) => {
      if (x === blockedKey) { logEv(`${nameOfKey(x)} estaba en el top, pero bloqueada: se queda sin estrella`); return; }
      // Como el Talent Show del All Stars 7: la última semana antes de la final, el top 2 se lleva 3 estrellas
      const n = S.ep === winnersWeeks() ? 3 : 1;
      S.stars[x] = (S.stars[x] || 0) + n;
      logEv(`${nameOfKey(x)} gana ${n === 1 ? "una estrella" : `${n} estrellas`}`);
      if (x === "me") { Toast.show(n === 1 ? "⭐ ¡Una estrella para ti!" : `🌟 ¡${n} estrellas para ti!`, "Las 4 con más estrellas se juegan la corona"); }
    });
    const byName = blocked ? nameOfKey(S.block.by) : "";
    // No se puede bloquear dos veces seguidas a la misma reina
    const prevBlocked = S.block && S.block.ep === S.ep ? S.block.id : null;
    S.block = null;
    header();
    const starsMap = () => new Map([S.queen, ...S.rivals].map((q) => [q, (S.stars || {})[keyOf(q)] || 0]));
    const table = () => standingsHTML([S.queen, ...S.rivals], starsMap(), "Estrellas").replace(/👑/g, "⭐");
    const done = (target) => {
      S.block = { ep: S.ep + 1, id: keyOf(target), by: k };
      logEv(`${decName} bloquea a ${target === S.queen ? S.queen.name : target.name}: la semana que viene no podrá ganar estrella`);
      if (target === S.queen) Toast.show(`🚫 ${decName} te ha bloqueado`, "La semana que viene no puedes ganar estrella");
      else if (dec.me) changeRel(target, -1);
      body().innerHTML = `
        <div class="story-card">
          <p class="eyebrow">⭐ All Winners · el bloqueo</p>
          <h3>${dec.me ? `Bloqueas a ${esc(target.name)}` : (target === S.queen ? `${esc(decName)} te bloquea a ti` : `${esc(decName)} bloquea a ${esc(target.name)}`)}</h3>
          <div class="vs"><img src="${photo(dec.me ? S.queen : dec.q)}"><span>🚫</span><img class="gone" src="${photo(target)}"></div>
          <p>${target === S.queen ? "La semana que viene no podrás ganar estrella, aunque ganes el lip sync." : `La semana que viene ${esc(target.name)} no podrá ganar estrella, aunque gane el lip sync.`} Esta semana nadie se va a casa.</p>
          ${table()}
          <button class="btn btn-primary" id="story-next">Siguiente episodio</button>
        </div>`;
      endEpisodeBtn();
    };
    const others = [S.queen, ...S.rivals].filter((q) => keyOf(q) !== k && keyOf(q) !== prevBlocked);
    // La Legendary Legend Star de la semana, con las que se la llevan
    const starred = keys.filter((x) => x !== blockedKey).map((x) => (x === "me" ? S.queen : qById(x))).filter(Boolean);
    const award = starred.length ? `
      <div class="ll-award">
        <img class="ll-star" src="./images/legendary-star.png?v=2" alt="Legendary Legend Star">
        <div><p class="ll-title">Legendary Legend Star${starred.length > 1 ? "s" : ""}${S.ep === winnersWeeks() ? " ×3" : ""}</p>
        <div class="call-faces">${starred.map((q) => `<span class="${q === S.queen ? "me" : ""}"><i style="background-image:url('${photo(q)}')"></i>${esc(q === S.queen ? "Tú" : q.name)}</span>`).join("")}</div></div>
      </div>` : "";
    if (dec.me) {
      body().innerHTML = `
        <div class="story-card">
          <p class="eyebrow">⭐ All Winners</p>
          <h3>${blocked ? "Ganas el lip sync... pero estabas bloqueada" : "¡Ganas el lip sync!"}</h3>
          ${blocked ? `<p class="twist-note">🚫 ${esc(byName)} te bloqueó la semana pasada: esta vez no hay estrella. Pero el bloqueo sí es tuyo.</p>` : `<p class="muted">Las dos del top os lleváis estrella; tú, además, el bloqueo.</p>`}
          <p>Ahora te toca <b>bloquear a una compañera</b>: la semana que viene no podrá ganar estrella.${prevBlocked ? ` ${esc(nameOfKey(prevBlocked))} ya estaba bloqueada esta semana: no se puede repetir.` : ""}</p>
          <div class="hub-grid">${others.map((q, i) => `<button class="hub-q" style="--i:${i}" data-b="${q.id}"><i style="background-image:url('${photo(q)}')"></i><span>${esc(q.name)}</span><small>⭐ ${(S.stars || {})[keyOf(q)] || 0}</small></button>`).join("")}</div>
          ${table()}
        </div>`;
      body().querySelectorAll("[data-b]").forEach((b) => b.addEventListener("click", () => done(qById(b.dataset.b))));
      return;
    }
    // Las demás bloquean a la que más estrellas tiene; si te tienen manía, a ti
    const meQ = S.queen;
    const score = (q) => ((S.stars || {})[keyOf(q)] || 0) * 2 + (q === meQ ? -relOf(dec.q) * 1.5 + (S.meOut ? -99 : 0) : 0) + Math.random() * 1.5;
    const target = others.filter((q) => q !== meQ || !S.meOut).sort((a, b) => score(b) - score(a))[0];
    body().innerHTML = `
      <div class="story-card">
        <p class="eyebrow">⭐ All Winners</p>
        <h3>${blocked ? `${esc(decName)} gana... pero estaba bloqueada` : `${esc(decName)} gana el lip sync`}</h3>
        <p class="muted">Las dos del top se llevan estrella${blockedKey && keys.includes(blockedKey) ? " (menos la bloqueada)" : ""}.</p>
        ${blocked ? `<p class="twist-note">🚫 ${esc(byName)} la bloqueó la semana pasada: se queda sin estrella.</p>` : ""}
        <p>Ahora ${esc(decName)} tiene que bloquear a una compañera...</p>
        <button class="btn btn-primary" id="story-go">Ver a quién bloquea</button>
      </div>`;
    $("#story-go").addEventListener("click", () => done(target));
  }
  // Gran final de All Winners, como en el All Stars 7 real:
  // - Las 4 con más estrellas van a la final por la corona (si hay empate en el corte, decide la que más estrellas tiene).
  // - Las demás se juegan el título de "Queen of She Done Already Done Had Herses" (QoSDADHH).
  // - Las dos son eliminatorias de lip syncs. Puestos por tramos: 1º, 2º, 3º/4º y del 5º al último (con la QoSDADHH destacada).
  function winnersFinal() {
    setSet("stage");
    S.epNames[S.ep] = "Final";
    const all = [S.queen, ...S.rivals];
    const starsOf = (q) => (S.stars || {})[keyOf(q)] || 0;
    const ppeOf = (q) => DFTC.ppe(Object.values(S.track[keyOf(q)] || {}));
    const byMerit = (a, b) => starsOf(b) - starsOf(a) || ppeOf(b) - ppeOf(a);
    const ranked = all.slice().sort(byMerit);
    // Corte del top 4: regla compartida con el multijugador (src/core/finales.ts)
    const cut = DFTC.allWinnersCut(ranked.map(keyOf), (k) => (S.stars || {})[k] || 0);
    const byKey = (k) => ranked.find((q) => keyOf(q) === k);
    const TOP = cut.TOP, stars4 = cut.stars4;
    const sure = cut.sure.map(byKey), tied = cut.tied.map(byKey);
    const chooser = ranked[0];
    const tbl = (list, title) => standingsHTML(list, new Map(all.map((q) => [q, starsOf(q)])), title).replace(/👑/g, "⭐");

    // Eliminatoria genérica: la mejor sembrada descansa si sois impares. Llama a onDone({ champ, runner })
    function bracket(list, name, onDone) {
      let alive = list.slice(), round = 1, duels = [], di = 0, bye = null, next = [], runner = null;
      const setup = () => {
        bye = alive.length % 2 ? alive[0] : null;
        const pool = alive.filter((q) => q !== bye);
        duels = [];
        for (let i = 0; i < pool.length / 2; i++) duels.push([pool[i], pool[pool.length - 1 - i]]);
        di = 0;
        next = bye ? [bye] : [];
        rname = alive.length === 2 ? "la final" : `ronda ${round}`;
      };
      let rname = "";
      const rn = () => rname;
      const board = (note = "") => {
        header();
        const d = duels[di];
        body().innerHTML = `
          <div class="story-card">
            <p class="eyebrow">${name} · ${rn()}</p>
            <h3>${d ? `${esc(nmQ(d[0]))} vs ${esc(nmQ(d[1]))}` : "Ronda terminada"}</h3>
            ${note ? `<p class="twist-note">${note}</p>` : ""}
            ${bye && di === 0 ? `<p class="muted">⭐ ${esc(nmQ(bye))} descansa esta ronda.</p>` : ""}
            ${tbl(list.filter((q) => alive.includes(q)), "Siguen en pie · ⭐ estrellas")}
            <button class="btn btn-primary" id="story-next">${d ? (d.includes(S.queen) ? "💃 Mi lip sync" : "Ver el duelo") : "Continuar"}</button>
          </div>`;
        $("#story-next").addEventListener("click", () => (d ? duel() : endRound()));
      };
      const lose = (q) => { if (alive.length === 2) runner = q; alive = alive.filter((x) => x !== q); };
      const duel = () => {
        const [a, b] = duels[di++];
        if (a === S.queen || b === S.queen) {
          const rv = a === S.queen ? b : a;
          S.lsBonus = clamp(starsOf(S.queen) * 3 - starsOf(rv) * 2, -6, 12);
          return playLS(rv, { eyebrow: `${name} · ${rn()}`, text: "La que pierda se queda fuera.", curtain: alive.length === 2 ? name.toUpperCase() : "GRAN FINAL" }, (won) => {
            const w = won ? S.queen : rv, l = won ? rv : S.queen;
            next.push(w);
            lose(l);
            board(won ? `💃 Ganas a ${esc(rv.name)}.` : `${esc(rv.name)} te gana.`);
          });
        }
        const [w, l] = simLS(a, b);
        next.push(w);
        lose(l);
        board(`${esc(w.name)} gana a ${esc(l.name)}.`);
      };
      const endRound = () => {
        alive = next.slice().sort(byMerit);
        round++;
        if (alive.length <= 1) return onDone({ champ: alive[0], runner });
        setup();
        board();
      };
      if (list.length === 1) return onDone({ champ: list[0], runner: null });
      setup();
      board();
    }

    function run(top) {
      const bottom = ranked.filter((q) => !top.includes(q));
      // Semifinales como en la tele: 1ª contra 4ª y 2ª contra 3ª
      const topSeeded = top.slice().sort(byMerit);
      const bottomSeeded = bottom.slice().sort(byMerit);
      const finishAll = (qd, crown) => {
        const fp = {};
        const tierB = DFTC.allWinnersTier(TOP, bottom.length);
        top.forEach((q) => {
          const k = keyOf(q);
          if (q === crown.champ) { fp[k] = { o: 1, r: "1º" }; mark(q, "WINNER"); }
          else if (q === crown.runner) { fp[k] = { o: 2, r: "2º" }; mark(q, "RUNNER-UP"); }
          else { fp[k] = { o: 3, r: top.length > 3 ? "3º/4º" : "3º" }; mark(q, "3ª"); }
        });
        bottom.forEach((q) => {
          const k = keyOf(q);
          const isQ = qd && q === qd.champ;
          fp[k] = { o: isQ ? 5 : 6, r: tierB };
          mark(q, isQ ? "QOSD" : "ELIMF");
        });
        S.finalPlace = fp;
        const meP = fp.me;
        if (crown.champ === S.queen) return theEnd(true, crown.runner, true);
        if (crown.runner === S.queen) return theEnd(false, crown.champ, true, `${crown.champ.name} te gana la corona de All Winners.`, 2);
        const qdTxt = qd && qd.champ === S.queen ? " Pero te llevas el título de QoSDADHH: la reina que ya lo había hecho todo." : "";
        return theEnd(false, crown.champ, false, `La corona de Reina de reinas se la lleva ${crown.champ.name}.${qdTxt}`, meP ? meP.o : TOP + 1);
      };
      const intro = [
        ["host", `Estas son las cuatro con más estrellas: ${topSeeded.map(nmQ).join(", ")}. Os jugáis la corona de Reina de reinas.`],
        ...(bottom.length ? [["host", `${bottomSeeded.map(nmQ).join(", ")}: os jugáis el título de Queen of She Done Already Done Had Herses. Porque ya lo habíais hecho todo.`]] : []),
        ["judge", "Lip sync contra lip sync. La que pierda, se queda fuera."],
      ];
      dialog(intro, ctxWith(S.rivals[0]), () => {
        const crownRun = (qd) => bracket(topSeeded, "👑 Reina de reinas", (crown) => finishAll(qd, crown));
        if (bottom.length >= 2) return bracket(bottomSeeded, "💅 QoSDADHH", (qd) => {
          header();
          body().innerHTML = `
            <div class="story-card">
              <p class="eyebrow">💅 Queen of She Done Already Done Had Herses</p>
              <h3>${qd.champ === S.queen ? "¡El título es tuyo!" : `${esc(qd.champ.name)} se lleva el título`}</h3>
              <div class="vs"><img src="${photo(qd.champ)}"><span>💅</span>${qd.runner ? `<img class="gone" src="${photo(qd.runner)}">` : ""}</div>
              <p>Ahora, la final por la corona.</p>
              <button class="btn btn-primary" id="story-next">Continuar</button>
            </div>`;
          $("#story-next").addEventListener("click", () => crownRun(qd));
        });
        crownRun(bottom.length === 1 ? { champ: bottom[0], runner: null } : null);
      });
    }

    // Empate en el corte del top 4: decide la que más estrellas tiene
    if (cut.tie) {
      const need = TOP - sure.length;
      const opts = tied.filter((q) => q !== chooser);
      // Las demás eligen por PPE; si una candidata eres tú, cuenta lo bien que os lleváis
      const auto = () => {
        const sc = (q) => ppeOf(q) + (q === S.queen ? relOf(chooser) * 0.3 : 0);
        return [...(tied.includes(chooser) ? [chooser] : []), ...opts.slice().sort((a, b) => sc(b) - sc(a))].slice(0, need);
      };
      if (chooser === S.queen && !tied.includes(S.queen)) {
        header();
        body().innerHTML = `
          <div class="story-card">
            <p class="eyebrow">👑 Gran final All Winners</p>
            <h3>Empate en el corte: decides tú</h3>
            <p>Tienes más estrellas que nadie. ${tied.map((q) => esc(q.name)).join(", ")} empatan con ${stars4} ⭐: elige ${need === 1 ? "quién pasa" : `a las ${need} que pasan`} a la final por la corona.</p>
            <div class="hub-grid">${tied.map((q, i) => `<button class="hub-q" style="--i:${i}" data-t="${q.id}"><i style="background-image:url('${photo(q)}')"></i><span>${esc(q.name)}</span><small>PPE ${ppeOf(q).toFixed(2).replace(".", ",")}</small></button>`).join("")}</div>
          </div>`;
        const chosen = [];
        body().querySelectorAll("[data-t]").forEach((b) => b.addEventListener("click", () => {
          chosen.push(qById(b.dataset.t));
          b.disabled = true;
          if (chosen.length === need) run([...sure, ...chosen]);
        }));
        return;
      }
      const picked = auto();
      const top = [...sure, ...picked];
      const left = tied.filter((q) => !picked.includes(q));
      return dialog([["host", `Empate a ${stars4} ${stars4 === 1 ? "estrella" : "estrellas"} entre ${tied.map(nmQ).join(", ")}. Decide ${nmQ(chooser)}, la que más estrellas tiene.`], ["host", `${nmQ(chooser)} elige a ${picked.map(nmQ).join(" y ")}. ${left.map(nmQ).join(" y ")}, os jugáis el otro título.`]], ctxWith(chooser === S.queen ? S.rivals[0] : chooser), () => run(top));
    }
    run(ranked.slice(0, TOP));
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
      if (l === "WINNER") { Nem.addPower(q.id, 3); Nem.addTitle(q.id, S.season.name); }
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

