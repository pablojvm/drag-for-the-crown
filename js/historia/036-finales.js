  // ------------------------------ Gran final: varias formas (como en el multijugador) ------------------------------
  // Se sortea en el reencuentro: Súper Lalaparuza, reto final, el track record manda, votan las eliminadas,
  // lip sync a cuatro o la reina de la pista. Con pase directo, la que lo tiene espera en el último duelo.
  // Si te han eliminado antes, la final se ve desde el público con la misma forma (y en «votan las eliminadas», votas).
  const FINALES = DFTC.FINALES;
  function finalFmtOf() {
    if (!S.flags.finalFmt) {
      const n = S.rivals.length + (S.meOut ? 0 : 1);
      S.flags.finalFmt = pick1(n >= 3 ? ["torneo", "reto", "track", "votan", "cuatro", "cadena"] : ["torneo", "reto", "track", "votan"]);
    }
    return S.flags.finalFmt;
  }
  const ppeQ = (q) => DFTC.ppe(Object.values(S.track[keyOf(q)] || {}));
  const seedsOf = (list) => list.slice().sort((a, b) => ppeQ(b) - ppeQ(a) || (S.record[keyOf(b)] || 0) - (S.record[keyOf(a)] || 0));
  const fName = (q) => (q === S.queen ? S.queen.name : q.name);
  const fNames = (list) => list.map(fName).join(", ").replace(/, ([^,]*)$/, " y $1");
  const paseOf = (list) => (S.flags.pase ? list.find((q) => keyOf(q) === S.flags.pase) || null : null);
  // Nota de lip sync de una rival (lip sync a cuatro): su temporada y un poco de suerte
  const lsNota = (q) => clamp(55 + ppeQ(q) * 6 + rnd(-17, 17) + (traitsOf(q).fort === "lipsync" ? 6 : 0), 0, 100);
  const seedsHTML = (list) => `<div class="lala-table"><b>Temporada (PPE)</b>${seedsOf(list).map((q) => `<span class="${q === S.queen ? "me" : ""}"><i style="background-image:url('${photo(q)}')"></i>${esc(nmQ(q))}<em>${ppeQ(q).toFixed(2).replace(".", ",")}</em></span>`).join("")}</div>`;
  function finalCard(eyebrow, title, html, btn, then) {
    header();
    body().innerHTML = `<div class="story-card"><p class="eyebrow">👑 ${eyebrow}</p><h3>${title}</h3>${html}${trackBtn()}<button class="btn btn-primary" id="story-next">${btn}</button></div>`;
    bindTrack();
    $("#story-next").addEventListener("click", then);
  }
  // Lip sync de la final: si estás tú, lo bailas; si no, se simula
  function lsVs(a, b, edge, eyebrow, curtain, cb) {
    if (a === S.queen || b === S.queen) {
      const rv = a === S.queen ? b : a;
      S.lsBonus = edge;
      return playLS(rv, { eyebrow, curtain }, (won) => cb(won ? S.queen : rv));
    }
    const [w] = simLS(a, b);
    cb(w);
  }
  const btnFor = (list, mine, other) => (list.includes(S.queen) ? mine : other);

  function finale() {
    const fmt = finalFmtOf();
    if (fmt === "torneo") return finaleLala();
    setSet("stage");
    if (S.bottoms === 0) Achievements.unlock("sin-bottom");
    S.epNames[S.ep] = "Final";
    startFinal(fmt, [S.queen, ...S.rivals]);
  }
  // Desde el público (te eliminaron antes)
  function afterFinal() {
    const fmt = finalFmtOf();
    if (fmt === "torneo") return afterFinalLala();
    Curtain.run(() => {
      setSet("stage");
      S.ep++;
      S.epNames[S.ep] = "Final";
      $("#story-ep").textContent = "Gran final";
      startFinal(fmt, S.rivals.slice());
    }, "GRAN FINAL");
  }
  function startFinal(fmt, four) {
    const F = FINALES[fmt];
    const pase = paseOf(four);
    const edge = clamp(S.wins * 3 - S.bottoms * 2, -6, 12);
    const intro = [
      ["host", pick1(["Reinas, bienvenidas a la gran final.", `Bienvenidas a la gran final de ${S.season.name}.`, "Hemos llegado a la gran final. Una corona, y solo una."])],
      ["host", `Y esta final es... ${F.icon} ¡${F.n}!`],
      ["host", F.d],
      ...(pase ? [["host", `${pase === S.queen ? "Tú tienes" : `${pase.name} tiene`} el pase directo: ${pase === S.queen ? "esperas" : "espera"} en el último duelo.`]] : []),
      ["judge", "La que gane se lleva la corona. Aquí no se regala nada."],
    ];
    dialog(intro, ctxWith(S.rivals[0]), () => RUN_FINAL[fmt](four, pase, edge));
  }

  // Cierre: se apunta cada una en el track record y se corona a la ganadora
  // labels: reina → { l: etiqueta del track record, p: puesto }
  function closeFinal(labels, champ, four, reason, lines = []) {
    labels.forEach((v, q) => { if (q !== S.queen) mark(q, v.l); });
    if (champ !== S.queen) mark(champ, "WINNER");
    four.filter((q) => q !== S.queen && q !== champ).forEach((q) => eliminate(q));
    const crown = [
      ["host", "Reinas, ha llegado el momento."],
      ...lines,
      ["host", `La ganadora de ${S.season.name}... la nueva reina de Drag Race España es... ¡${fName(champ)}!`],
      ["ambrossi", "¡Que le pongan la corona y el cetro!"],
      ["judge", "Larga vida a la reina."],
    ];
    dialog(crown, ctxWith(champ === S.queen ? S.rivals[0] : champ), () => {
      if (champ === S.queen) Confetti.burst(3000);
      if (S.meOut || !four.includes(S.queen)) {
        header();
        return showTrack(() => theEnd(false, champ, false, reason || `Te fuiste en el episodio ${S.flags.outEp || "?"}. La corona se la lleva ${champ.name}.`, S.flags.myPlace || S.out.length + 1), "Resultado final");
      }
      if (champ === S.queen) return theEnd(true, null, true);
      const me = labels.get(S.queen) || { l: "3ª", p: 3 };
      mark(S.queen, me.l);
      theEnd(false, champ, false, reason || `La corona se la lleva ${champ.name}.`, me.p);
    });
  }

  const RUN_FINAL = {
    // Las dos con mejor temporada (o la del pase y la mejor del resto) al lip sync por la corona
    track(four, pase, edge) {
      const sd = seedsOf(four.filter((q) => q !== pase));
      const top = pase ? [sd[0], pase] : [sd[0], sd[1]];
      const rest = four.filter((q) => !top.includes(q));
      finalCard("📊 El track record manda", `${esc(fName(top[0]))} y ${esc(fName(top[1]))} se juegan la corona`,
        `${rest.length ? `<p>${esc(fNames(rest))}: vuestra temporada no llega. Quedáis terceras.</p>` : ""}${seedsHTML(four)}`,
        btnFor(top, "👑 Lip sync por la corona", "Ver el lip sync"),
        () => lsVs(top[0], top[1], edge, "Lip sync por la corona", "LIP SYNC POR LA CORONA", (w) => {
          const labels = new Map(rest.map((q) => [q, { l: "3ª", p: 3 }]));
          labels.set(w === top[0] ? top[1] : top[0], { l: "RUNNER-UP", p: 2 });
          closeFinal(labels, w, four, "", [["host", `${fName(top[0])}, ${fName(top[1])}: las dos habéis hecho una temporada increíble.`]]);
        }));
    },
    // La reina de la pista: empieza la de peor temporada; la que gana se queda; la del pase, al final
    cadena(four, pase, edge) {
      const order = seedsOf(four.filter((q) => q !== pase)).reverse();
      if (pase) order.push(pase);
      const out = [];
      let cur = order[0], i = 1;
      const step = (note = "") => {
        if (i >= order.length) {
          const n = order.length;
          const labels = new Map(out.map((q, j) => [q, j === out.length - 1 ? { l: "RUNNER-UP", p: 2 } : { l: `P${n - j}`, p: n - j }]));
          return closeFinal(labels, cur, four, "", [["host", `${fName(cur)} ha aguantado en la pista hasta el final.`]]);
        }
        const next = order[i++];
        const wait = order.slice(i);
        finalCard(`🔥 La reina de la pista · duelo ${i - 1} de ${order.length - 1}`, `${esc(fName(cur))} vs ${esc(fName(next))}`,
          `${note ? `<p class="twist-note">${note}</p>` : ""}<p class="muted">${wait.length ? `Esperan su turno: ${esc(fNames(wait))}.` : "Último duelo: la que gane se lleva la corona."}</p>`,
          btnFor([cur, next], "💃 Mi lip sync", "Ver el duelo"),
          () => lsVs(cur, next, edge, "🔥 La reina de la pista", "LA REINA DE LA PISTA", (w) => {
            const l = w === cur ? next : cur;
            out.push(l);
            cur = w;
            step(`${esc(fName(w))} gana a ${esc(fName(l))} y sigue en la pista.`);
          }));
      };
      step();
    },
    // Votan las eliminadas: semifinales (con pase, cadena entre las demás) y la corona por votos
    votan(four, pase, edge) {
      const sd = seedsOf(four.filter((q) => q !== pase));
      const losers = [];
      if (pase) {
        const order = sd.slice().reverse();
        let cur = order[0], i = 1;
        const step = () => {
          if (i >= order.length) return voteFinal(cur, pase, losers, four);
          const nx = order[i++];
          finalCard("🗳️ Votan las eliminadas · semifinal", `${esc(fName(cur))} vs ${esc(fName(nx))}`, `<p class="muted">La que gane se enfrenta a ${esc(fName(pase))} en la votación.</p>`,
            btnFor([cur, nx], "💃 Mi lip sync", "Ver el duelo"),
            () => lsVs(cur, nx, edge, "Semifinal", "SEMIFINAL", (w) => { losers.push(w === cur ? nx : cur); cur = w; step(); }));
        };
        return step();
      }
      // Solo dos finalistas: no hay semifinales, se vota directamente
      if (sd.length <= 2) return voteFinal(sd[0], sd[1] || sd[0], losers, four);
      const pairs = sd.length >= 4 ? [[sd[0], sd[3]], [sd[1], sd[2]]] : [[sd[1], sd[2]]];
      const winners = sd.length === 3 ? [sd[0]] : [];
      let k = 0;
      const step = () => {
        if (k >= pairs.length) return voteFinal(winners[0], winners[1], losers, four);
        const [a, b] = pairs[k++];
        finalCard(`🗳️ Votan las eliminadas · semifinal ${k} de ${pairs.length}`, `${esc(fName(a))} vs ${esc(fName(b))}`,
          `${winners.length && sd.length === 3 ? `<p class="muted">${esc(fName(sd[0]))} pasa directa a la votación.</p>` : ""}`,
          btnFor([a, b], "💃 Mi lip sync", "Ver el duelo"),
          () => lsVs(a, b, edge, "Semifinal", "SEMIFINAL", (w) => { winners.push(w); losers.push(w === a ? b : a); step(); }));
      };
      step();
    },
    // Lip sync a cuatro: de un solo lip sync sale la ganadora; el jurado ordena, deja a una fuera o corona sin más
    cuatro(four, pase, edge) {
      const Q = four.filter((q) => q !== pase);
      const go = (myScore) => {
        const sc = new Map(Q.map((q) => [q, q === S.queen ? myScore : lsNota(q)]));
        const ranked = Q.slice().sort((a, b) => sc.get(b) - sc.get(a));
        if (pase) {
          const labels = new Map(ranked.slice(1).map((q) => [q, { l: "3ª", p: 3 }]));
          return finalCard("💃 Lip sync a cuatro", `${esc(fName(ranked[0]))} gana el lip sync`, `<p>Se juega la corona con ${esc(fName(pase))}, que tenía el pase directo.</p>`,
            btnFor([ranked[0], pase], "👑 Lip sync por la corona", "Ver el lip sync"),
            () => lsVs(ranked[0], pase, edge, "Lip sync por la corona", "LIP SYNC POR LA CORONA", (w) => {
              labels.set(w === pase ? ranked[0] : pase, { l: "RUNNER-UP", p: 2 });
              closeFinal(labels, w, four);
            }));
        }
        const r = Math.random();
        const mode = r < 0.45 ? "orden" : r < 0.75 ? "unaFuera" : "ganadora";
        const [win, ...rest] = ranked;
        const n = ranked.length;
        const labels = new Map();
        const lines = [["host", "Reinas, el jurado ha visto vuestro lip sync y ya ha tomado una decisión."]];
        if (mode === "orden") {
          rest.slice().reverse().forEach((q, i) => {
            const pos = n - i;
            labels.set(q, { l: pos === 2 ? "RUNNER-UP" : `P${pos}`, p: pos });
            if (pos > 2) lines.push(["host", `En ${pos === 4 ? "cuarto" : "tercer"} lugar... ${fName(q)}.`]);
          });
          lines.push(["host", `Y quedan dos. ${fName(rest[0])}, ${fName(win)}... ${fName(rest[0])}, eres la subcampeona de la temporada.`]);
        } else if (mode === "unaFuera") {
          const last = rest[rest.length - 1];
          const ru = rest.slice(0, -1);
          ru.forEach((q) => labels.set(q, { l: "RUNNER-UP", p: 2 }));
          labels.set(last, { l: "ELIM", p: n });
          lines.push(["host", `${fName(last)}, lo siento, esta noche te quedas fuera.`], ["host", ru.length > 1 ? `${fNames(ru)}: sois las subcampeonas de esta temporada.` : `${fName(ru[0])}, eres la subcampeona de esta temporada.`]);
        } else {
          rest.forEach((q) => labels.set(q, { l: "ELIM", p: 2 }));
          lines.push(["host", "Esta noche no hay puestos: solo hay una corona."]);
        }
        closeFinal(labels, win, four, "", lines);
      };
      if (Q.includes(S.queen)) {
        const rv = seedsOf(Q.filter((q) => q !== S.queen))[0];
        return finalCard("💃 Lip sync a cuatro", esc(fNames(Q)), "<p>Todas bailáis la misma canción. De este lip sync sale la ganadora.</p>", "💃 ¡A bailar!", () => {
          S.lsBonus = edge;
          playLS(rv, { eyebrow: "💃 Lip sync a cuatro", curtain: Q.length === 3 ? "LIP SYNC A TRES" : "LIP SYNC A CUATRO" }, (won, score) => go(clamp((score || 50) + (won ? 6 : 0), 0, 100)));
        });
      }
      finalCard("💃 Lip sync a cuatro", esc(fNames(Q)), "<p>Todas bailan la misma canción. De este lip sync sale la ganadora.</p>", "Ver el lip sync", () => go(0));
    },
    // Reto final: un último reto (con su pasarela); las dos mejores (o la del pase y la mejor) al lip sync por la corona
    reto(four, pase, edge) {
      const pool = ["snatch", "roast", "diseno", "rusical", "actuacion", "makeover"].filter((t) => RETOS[t] && RETOS[t].run);
      const used = Object.values(S.epNames);
      const fresh = pool.filter((t) => !used.includes(EP_SHORT[t]));
      const tipo = pick1(fresh.length ? fresh : pool);
      const R = RETOS[tipo];
      const titulo = typeof R.titulo === "function" ? R.titulo() : R.titulo;
      const desc = typeof R.desc === "function" ? R.desc() : R.desc || "";
      S.epNames[S.ep] = `Final · ${EP_SHORT[tipo] || "Reto"}`;
      const decide = (myScore) => {
        const sc = new Map(four.map((q) => [q, q === S.queen ? myScore : rivalScore(q) + rnd(-8, 8)]));
        const ranked = four.slice().sort((a, b) => sc.get(b) - sc.get(a));
        const top = pase ? [ranked.find((q) => q !== pase), pase] : ranked.slice(0, 2);
        const rest = four.filter((q) => !top.includes(q));
        finalCard("🎤 Reto final · las decisiones del jurado", `${esc(fName(top[0]))} y ${esc(fName(top[1]))} se juegan la corona`,
          `${rest.length ? `<p>${esc(fNames(rest))}: habéis llegado hasta la final, y eso ya es historia. Pero esta noche la corona no es para vosotras.</p>` : ""}`,
          btnFor(top, "👑 Lip sync por la corona", "Ver el lip sync"),
          () => lsVs(top[0], top[1], edge, "Lip sync por la corona", "LIP SYNC POR LA CORONA", (w) => {
            const labels = new Map(rest.map((q) => [q, { l: "3ª", p: 3 }]));
            labels.set(w === top[0] ? top[1] : top[0], { l: "RUNNER-UP", p: 2 });
            closeFinal(labels, w, four);
          }));
      };
      if (!four.includes(S.queen)) return finalCard("🎤 Reto final", esc(titulo), `<p>${esc(desc)}</p><p class="muted">Lo ves desde el público.</p>`, "Ver el resultado", () => decide(0));
      finalCard("🎤 Reto final", esc(titulo), `<p>${esc(desc)}</p>${R.noRunway ? "" : "<p class=\"muted\">Después, la última pasarela.</p>"}`, "¡A por la corona!", () => {
        S.curTipo = tipo; S.curEpTipo = S.ep; S.curTitulo = titulo; S.team = null; S.cGroups = null; S.curPieces = null; S.lastLook = null;
        S.gg = null; S.rp = null; S.miniWin = null; S.juryNotes = null; S.liveEp = 0;
        body().innerHTML = `<div id="story-play"></div>`;
        R.run($("#story-play"), (raw) => {
          cleanup = null;
          if (R.noRunway) return decide(clamp(raw, 0, 100));
          runway((walk) => decide(clamp(raw * 0.65 + walk * 0.35, 0, 100)));
        });
      });
    },
  };

  // Votan las eliminadas: las de antes de la final y las que han caído en las semifinales (tú también, si estás entre ellas)
  function voteFinal(a, b, losers, four) {
    const voters = [...S.out.filter((q) => !four.includes(q)), ...losers.filter((q) => q !== S.queen)];
    const meVotes = losers.includes(S.queen) || S.meOut;
    const count = (mine) => {
      const tally = new Map([[a, 0], [b, 0]]);
      if (mine) tally.set(mine, tally.get(mine) + 1);
      voters.forEach((v) => {
        const lean = (ppeQ(a) - ppeQ(b)) * 0.15;
        const c = Math.random() < clamp(0.5 + lean, 0.2, 0.8) ? a : b;
        tally.set(c, tally.get(c) + 1);
      });
      const champ = tally.get(a) !== tally.get(b) ? (tally.get(a) > tally.get(b) ? a : b) : ppeQ(a) >= ppeQ(b) ? a : b;
      const runner = champ === a ? b : a;
      const labels = new Map(losers.map((q) => [q, { l: "3ª", p: 3 }]));
      labels.set(runner, { l: "RUNNER-UP", p: 2 });
      const v = (q) => `${tally.get(q)} ${tally.get(q) === 1 ? "voto" : "votos"}`;
      closeFinal(labels, champ, four, "", [["host", `Las eliminadas han votado. ${fName(a)}: ${v(a)}. ${fName(b)}: ${v(b)}.`]]);
    };
    if (meVotes) {
      header();
      body().innerHTML = `
        <div class="story-card">
          <p class="eyebrow">🗳️ Votan las eliminadas</p>
          <h3>¿Quién se lleva la corona?</h3>
          <p class="muted">Tu voto es secreto. Elige a una de las dos.</p>
          <div class="hub-grid">${[a, b].map((q, i) => `<button class="hub-q" style="--i:${i}" data-v="${i}"><i style="background-image:url('${photo(q)}')"></i><span>${esc(fName(q))}</span></button>`).join("")}</div>
        </div>`;
      return body().querySelectorAll("[data-v]").forEach((x) => x.addEventListener("click", () => count(x.dataset.v === "0" ? a : b)));
    }
    finalCard("🗳️ Votan las eliminadas", `${esc(fName(a))} vs ${esc(fName(b))}`, `<p>Las eliminadas deciden con su voto quién se lleva la corona.</p>`, "Ver la votación", () => count(null));
  }
