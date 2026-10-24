  // ------------------------------ Taller -----------------------------------
  function workroom() {
    const ctx = ctxWith(pick1(S.rivals));
    let lines;
    const wscene = (then) => {
      const r = Math.random();
      if (r < 0.12) { const c = pickFresh(JAVIS.consejo); return dialog(c.lines, ctxWith(pick1(S.rivals)), then, c.choices); }
      if (S.groups && r < 0.4) return groupEvent(then);
      return (r < 0.72 ? roleScene : maybeEvent)(then);
    };
    // Orden del episodio: charla en el taller, suena la sirena y Supremme anuncia el maxirreto, minirreto y después el trabajo en el taller
    const go = () => (ensureIdentities(), historyScene(() => memoryTalk(() => announce(() => miniChallenge(() => afterMini())))));
    // Las reinas charlan solas en el taller hasta que suena la sirena
    if (S.ep === 1) lines = [...pickFresh(HISTORIA.tallerPrimerDia)];
    else lines = S.out.length && Math.random() < 0.7 ? [...pickFresh(HISTORIA.tallerTrasExpulsion)] : [...pickFresh(HISTORIA.tallerCharla)];
    scene("workroom", lines, ctx, go);
  }
  // Tras el minirreto: el taller ya sabe cuál es el reto de la semana
  function afterMini() {
    flowGo("taller");
    const wscene = (then) => {
      const r = Math.random();
      if (r < 0.12) { const c = pickFresh(JAVIS.consejo); return dialog(c.lines, ctxWith(pick1(S.rivals)), then, c.choices); }
      if (S.groups && r < 0.4) return groupEvent(then);
      return (r < 0.72 ? roleScene : maybeEvent)(then);
    };
    pactScene(() => nemesisScene(() => fameScene(() => rolePassives(() => (S.ep >= 2 && !S.flags.groups && S.rivals.length >= 5 ? formGroups : wscene)(() => directorScene(() => hub(() => beginChallenge())))))));
  }
  // Evento aleatorio del taller: varias reinas y tú eliges bando
  function maybeEvent(then) {
    if (S.rivals.length < 3 || Math.random() < 0.35) return then();
    const ev = pickFresh(HISTORIA.eventos);
    const ctx = ctxWith(pick1(S.rivals));
    scene("maybeEvent", ev.lines, ctx, then, ev.choices);
  }
  // Lo que hacen los roles por su cuenta cada semana
  function rolePassives(then) {
    const ciz = withRole("cizanera").find((q) => Math.random() < 0.35);
    if (ciz) {
      const target = pick1(S.rivals.filter((q) => q !== ciz));
      if (target) {
        Toast.show(`🐍 ${fill(pick1(CIZANA_AVISOS), { r1: ciz.name, r2: target.name })}`, "Algo ha cambiado entre vosotras");
        changeRel(target, -1);
        if (Math.random() < 0.5) reveal(ciz);
      }
    }
    const vil = withRole("villana").find((q) => relOf(q) <= 0 && Math.random() < 0.3);
    if (vil) {
      S.advice -= 4;
      Toast.show(`😈 ${pick1(VILLANA_AVISOS)}`, "Te va a costar en el próximo reto. ¿Quién habrá sido?");
    }
    then();
  }
  // Escena de taller según el rol de una compañera
  function roleScene(then) {
    const cands = S.rivals.filter((q) => roleOf(q) && roleOf(q).escenas);
    if (!cands.length || S.rivals.length < 2) return then();
    const q = pick1(cands);
    const role = roleOf(q);
    const sc = pickFresh(role.escenas);
    const ctx = ctxWith(q);
    reveal(q);
    scene("roleScene", sc.lines, { ...ctx, tension: S.roles[q.id] === "villana" }, then, sc.choices);
  }
  // Confesionario: una compañera habla de ti a cámara
  function confesionario(then) {
    const cands = S.rivals.filter((q) => roleOf(q));
    if (!cands.length || Math.random() < 0.55) return then();
    const q = pick1(cands);
    const role = roleOf(q);
    const line = pickFresh(relOf(q) >= 1 ? role.confesionario.bien : relOf(q) <= -1 ? role.confesionario.mal : Math.random() < 0.5 ? role.confesionario.bien : role.confesionario.mal);
    reveal(q);
    scene("confesionario", [["r1", "🎥 (Al confesionario) " + line]], { ...ctxWith(q), q: { r1: q }, r1: q.name }, then);
  }

  // Tiempo libre: eliges con quién hablar y cómo
  // Mesas del taller: por grupos (o repartidas antes de que se formen)
  function werkroomTables() {
    const tables = [];
    if (S.groups && S.groups.length) {
      S.groups.forEach((g) => {
        const m = groupMembers(g);
        if (S.myGroup === g.id) m.unshift(S.queen);
        if (m.length) tables.push({ name: `${g.icon} ${g.name}`, mine: S.myGroup === g.id, qs: m });
      });
      const loose = [...(S.myGroup ? [] : [S.queen]), ...S.rivals.filter((q) => !groupOf(q))];
      for (let i = 0; i < loose.length; i += 4) tables.push({ name: i ? "🦋 Por libre (2)" : "🦋 Por libre", mine: loose.slice(i, i + 4).includes(S.queen), qs: loose.slice(i, i + 4) });
    } else {
      const all = [S.queen, ...S.rivals];
      const per = all.length > 9 ? 4 : 3;
      for (let i = 0; i < all.length; i += per) tables.push({ name: `Mesa ${tables.length + 1}`, mine: i === 0, qs: all.slice(i, i + per) });
    }
    return tables;
  }
  const seatHTML = (q) => {
    const me = q === S.queen;
    const cls = me ? "me" : relOf(q) >= 2 ? "ally" : relOf(q) <= -2 ? "enemy" : "";
    return `<button class="wr-seat ${me ? "" : "hub-q"} ${cls}" ${me ? "disabled" : `data-id="${q.id}"`} title="${esc(q.name)}">
      <span class="wr-body"><img src="${sprite(q)}" alt=""></span>
      <span class="wr-tag"><b>${esc(me ? "Tú" : q.name)}</b>${me ? "" : `<small>${relLabel(q)}</small>`}${me ? "" : roleKnown(q) ? `<em>${roleOf(q).icon}</em>` : ""}${twistOf() === "corazon" && S.hearts[keyOf(q)] ? `<em>❤️${String(S.hearts[keyOf(q)] / 2).replace(".", ",")}</em>` : ""}</span>
    </button>`;
  };
  function hub(then) {
    header();
    setSet("werkroom");
    body().innerHTML = `
      <div class="story-card werkroom">
        <p class="eyebrow">Taller · tiempo libre</p>
        <h3>¿Con quién quieres hablar?</h3>
        <p class="muted">Solo te da tiempo a una conversación antes del reto. Pincha en una compañera.</p>
        ${(() => { const r = radioLines(); return r.length ? `<div class="radio">${r.map((t) => `<p>📻 ${esc(t)}</p>`).join("")}</div>` : ""; })()}
        <div class="wr-room">${werkroomTables()
          .map((t, i) => `<div class="wr-table ${t.mine ? "mine" : ""}" style="--i:${i}"><div class="wr-seats">${t.qs.map(seatHTML).join("")}</div><div class="wr-desk"><span>${esc(t.name)}</span>${IA.ready() && t.qs.filter((q) => q !== S.queen).length >= 2 ? `<button class="wr-join" data-t="${i}">💬 Sentarte con ellas</button>` : ""}</div></div>`)
          .join("")}</div>
        <p class="attr-row">Tus atributos: ${attrChips(Object.keys(ATTR_NAMES))}</p>
        <div class="row"><button class="btn btn-ghost" id="hub-skip">🎯 Concentrarme en mi reto</button>${trackBtn()}</div>
      </div>`;
    bindTrack();
    body().querySelectorAll(".hub-q").forEach((b) => b.addEventListener("click", () => approach(qById(b.dataset.id), then)));
    const tables = werkroomTables();
    body().querySelectorAll(".wr-join").forEach((b) => b.addEventListener("click", (e) => { e.stopPropagation(); groupTalk(tables[+b.dataset.t].qs.filter((q) => q !== S.queen), then, `el taller, en la mesa «${tables[+b.dataset.t].name}», mientras trabajan en el reto de la semana`); }));
    $("#hub-skip").addEventListener("click", () => {
      S.advice += 5;
      Toast.show("🎯 Concentrada", "Llegas al reto con la cabeza en su sitio");
      then();
    });
  }
  function approach(q, then) {
    body().innerHTML = `
      <div class="story-card intro">
        <img class="story-queen" src="${sprite(q)}" alt="">
        <div>
          <p class="eyebrow">${esc(relLabel(q))}</p>
          <h3>${esc(q.name)}</h3>
          <p>${roleChip(q)} ${groupChip(q)} ${heartChip(q)} <span class="role-chip">${rankOf(q).join(" ")}</span></p>
          <p class="trs">${["fort", "deb", "car"].filter((sl) => Nem.knows(q.id, sl)).map((sl) => `<span class="tr ${sl}">${RASGOS[sl][traitsOf(q)[sl]].icon} ${esc(RASGOS[sl][traitsOf(q)[sl]].n)}</span>`).join("")}</p>
          <p>¿Qué quieres hacer?</p>
          <div class="approach-list">${[...HISTORIA.enfoques,
            ...(Nem.knows(q.id, "deb") ? [{ id: "debil", icon: "🎯", txt: "Atacar su punto débil", desc: `${RASGOS.deb[traitsOf(q).deb].n}: la desconcentras (te la guardará)` }] : []),
            ...(IA.ready() ? [{ id: "libre", icon: "💬", txt: "Hablar libremente", desc: "Escribe lo que quieras: te contesta en directo según su carácter" }] : []),
            ...(relOf(q) >= 2 && !(S.pacts || {})[q.id] && !isNem(q) ? [{ id: "pacto", icon: "🤝", txt: "Proponer un pacto", desc: "Te ayudará y te contará secretos... si no te traiciona" }] : [])]
            .map((a) => `<button class="btn btn-ghost role" data-a="${a.id}"><b>${a.icon} ${a.txt}</b><small>${a.desc}</small></button>`)
            .join("")}</div>
          <button class="btn btn-ghost small-btn" id="ap-back">← Elegir a otra</button>
        </div>
      </div>`;
    body().querySelectorAll("[data-a]").forEach((b) => b.addEventListener("click", () => talk(q, b.dataset.a, then)));
    $("#ap-back").addEventListener("click", () => hub(then));
  }
  function talk(q, kind, then) {
    if (kind === "libre") return freeTalk(q, then);
    if (IA.ready() && !talk.ai && ["pina", "cotilleo", "consejo", "pinchar"].includes(kind)) {
      aiWait(`${q.name} te mira...`);
      return aiOpener(q, kind).then((line) => { talk.ai = line ? [["r1", line]] : null; talk.aiFlag = true; talkInner(q, kind, then); });
    }
    talkInner(q, kind, then);
  }
  function talkInner(q, kind, then) {
    const opener = talk.ai;
    talk.ai = null;
    const r = relOf(q);
    const ctx = ctxWith(q);
    const other = ctx.q.r2;
    const rl = S.roles[q.id];
    if (Math.random() < 0.6) reveal(q);
    persona({ pina: "kind", cotilleo: "drama", consejo: "focus", pacto: "kind" }[kind] || "mean");
    if (kind === "debil") {
      const t = traitsOf(q), w = RASGOS.deb[t.deb];
      return scene("talkInner", [["me", `Oye, ${q.name}... ¿qué tal llevas lo tuyo? Ya sabes: ${w.n.toLowerCase()}.`], ["r1", pick1(["¿Perdona? ¿A qué viene eso?", "Qué baja has caído, {yo}.", "...No me hables."])]], { ...ctx, tension: true }, () => {
        S.form[q.id] = clamp((S.form[q.id] || 0) - (t.deb === "provocable" ? 6 : 4), -8, 8);
        S.points += 300;
        changeRel(q, -1);
        if (isNem(q)) heat(2);
        nemEvent("humill", S.queen, q);
        Toast.show(`🎯 ${q.name} se desconcentra`, memoriaOn() ? "Te lo recordará... y no solo en esta temporada" : "Te lo recordará el resto de la temporada");
        then();
      });
    }
    if (kind === "pacto") {
      const t = traitsOf(q);
      const ok = Nem.feel(q.id, S.queen.id) >= -1 && (t.car !== "orgullosa" || Math.random() < 0.5);
      return scene("talkInner", [["me", "¿Y si vamos juntas en esto? Tú me cubres y yo te cubro."], ["r1", ok ? "Trato hecho. Pero si me la juegas, lo sabrá todo el taller." : "Mmm... no. Prefiero ir a mi aire."]], ctx, () => {
        if (ok) { S.pacts = { ...(S.pacts || {}), [q.id]: 1 }; nemEvent("pact", S.queen, q); Toast.show(`🤝 Pacto con ${q.name}`, "Te ayudará en los retos de equipo y te contará secretos"); }
        then();
      });
    }
    if (isNem(q)) heat(kind === "pina" ? -1 : kind === "pinchar" ? 2 : 0);
    let lines, after = () => {};
    if (kind === "pina") {
      const mood = r >= 1 ? "buena" : r <= -1 ? "mala" : "neutra";
      lines = pickFresh(HISTORIA.pina[mood]);
      const ok = Math.random() < (mood === "mala" ? 0.5 : 0.85);
      after = () => changeRel(q, ok ? (mood === "buena" ? 1 : 1) : 0);
    } else if (kind === "cotilleo") {
      lines = [...pickFresh(HISTORIA.cotilleo)];
      const caught = other && other !== q && Math.random() < 0.3;
      if (caught) lines.push(...HISTORIA.cotilleoPillada);
      after = () => {
        changeRel(q, 1);
        if (caught) changeRel(other, -2);
        const sl = other && other !== q ? ["deb", "fort", "car"].find((x) => !Nem.knows(other.id, x)) : null;
        if (sl) learnTrait(other, sl, `${q.name} te cuenta de ${other.name}`);
      };
    } else if (kind === "consejo") {
      const ok = rl === "madre" || (r >= 0 && Math.random() < 0.8);
      lines = pickFresh(HISTORIA.consejo[ok ? "si" : "no"]);
      after = () => {
        if (ok) {
          S.advice += 6;
          Toast.show("💡 Buen consejo", "Te lo apuntas para el reto");
        }
      };
    } else {
      lines = pickFresh(HISTORIA.pinchar);
      after = () => {
        changeRel(q, -1);
        S.points += 150;
        S.form[q.id] = clamp((S.form[q.id] || 0) - (rl === "sensible" ? 4 : 2), -8, 8); // la pone nerviosa
        if (rl === "villana") S.advice -= 2; // y ella te la devuelve
      };
    }
    const f = fame();
    if (opener) lines = [...opener, ...lines];
    else {
      if (f && !isNem(q) && Math.random() < 0.5) lines = [["r1", pickFresh(FAMA[f].saludo)], ...lines];
      if (isNem(q)) lines = [["r1", pick1(["¿Qué quieres tú ahora?", "Mira quién viene...", "Uy, la que faltaba."])], ...lines];
    }
    scene("talkInner", lines, ctx, () => {
      after();
      then();
    });
  }

  // ------------------------------- Reto ------------------------------------
  function pickReto() {
    if (twistOf() === "repesca" && !S.flags.repesca && !S.meOut && S.rivals.length + 1 <= REPESCA_AT && S.out.length) return "repescaStand";
    if (S.retoEp && S.retoEp.ep === S.ep) return S.retoEp.tipo;
    let ord = (S.order || []).filter((t) => ORDEN_RETOS.includes(t));
    if (ord.length < ORDEN_RETOS.length) ord = ORDEN_RETOS; // partidas guardadas con el formato antiguo
    // La Lalaparuza solo cae con 8 o 16 reinas (cuadro sin ronda previa): si toca antes, se aplaza; si toca ya, se adelanta
    const n = S.rivals.length + 1, p2 = n >= 8 && (n & (n - 1)) === 0;
    if (S.order && ord.length === S.order.length && twistOf() !== "winners") {
      const O = S.order, i = (S.ep - 1) % O.length, li = O.indexOf("lalaparuza");
      if (O[i] === "lalaparuza" && !p2) {
        const tgt = n > 8 ? i + (n - 8) : O.length - 1;
        const j = tgt > i && tgt < O.length ? tgt : Math.min(O.length - 1, i + 1);
        if (j !== i) [O[i], O[j]] = [O[j], O[i]];
      } else if (p2 && li > i) [O[i], O[li]] = [O[li], O[i]];
      ord = O;
    }
    const tipo = ord[(S.ep - 1) % ord.length];
    S.retoEp = { ep: S.ep, tipo };
    return tipo;
  }

  // ------------------------------ Minirreto ----------------------------------
  // Cada episodio empieza con un minirreto que da ventaja para el reto de la semana
  const VENTAJAS = [
    { id: "ventaja", txt: "una ventaja en el reto de la semana", apply: () => (S.advice += 6) },
    { id: "puntos", txt: "un premio en metálico para el armario", apply: () => { S.points += 600; earn(150, "Premio del minirreto"); } },
    { id: "pasarela", txt: "una ventaja en la pasarela", apply: () => (S.runwayBonus = 16) },
    { id: "eleccion", txt: "elegir primero en el reto y quedarse los mejores materiales", apply: () => (S.advice += 4) },
  ];
  function miniChallenge(then) {
    flowGo("minirreto");
    setSet("werkroom");
    S.runwayBonus = 0;
    S.captains = null;
    const maxi = S.curEpTipo === S.ep && S.curTipo ? S.curTipo : pickReto();
    const team = RETOS[maxi].team && S.rivals.length >= 3;
    if (!S.miniOrder || S.miniOrder.some((k) => !MINIRETOS[k])) S.miniOrder = shuffle(ORDEN_MINI);
    const tipo = S.miniOrder[(S.ep - 1) % S.miniOrder.length];
    const mini = MINIRETOS[tipo];
    const titulo = mini.titulo();
    // Premios que tengan sentido con el maxirreto anunciado
    const okV = VENTAJAS.filter((v) => (v.id !== "pasarela" || !RETOS[maxi].noRunway) && (v.id !== "eleccion" || RETO_CAT[maxi] === "costura"));
    const premio = team ? { id: "capitana", txt: "ser capitana y elegir equipo para el reto de esta semana" } : okV[(S.ep + S.season.cast.length) % okV.length];
    const javis = Math.random() < 0.35;
    const intro = javis ? [...pickFresh(JAVIS.mini), ["calvo", `Hoy: ${titulo.replace("Minirreto: ", "")}. La ganadora se lleva ${premio.txt}.`]] : [["host", pick1(["Pero antes del maxirreto... ¡minirreto!", "Antes de poneros con el reto... ¡minirreto!", "Y para calentar... ¡minirreto!"])], ["host", `Hoy: ${titulo.replace("Minirreto: ", "")}. La ganadora se lleva ${premio.txt}.`]];
    dialog(intro, ctxWith(pick1(S.rivals)), () => {
      body().innerHTML = `
        <div class="story-card intro">
          <img class="story-queen" src="${sprite(S.queen)}" alt="">
          <div>
            <p class="eyebrow">⚡ Minirreto · premio: ${esc(premio.txt)}</p>
            <h3>${esc(titulo)}</h3>
            <p>${mini.desc}</p>
            <p class="muted">🎮 ${mini.ctrl}</p>
            <button class="btn btn-primary" id="story-go">¡Empezar!</button>
          </div>
        </div>`;
      $("#story-go").addEventListener("click", () => {
        body().innerHTML = `<div id="story-play"></div>`;
        Music.play("reto");
        mini.run($("#story-play"), (raw) => {
          cleanup = null;
          if (typeof window.__forceScore === "number") raw = window.__forceScore;
          Music.stop();
          if (!team) S.team = null;
          const sc = [{ q: S.queen, s: Math.round(clamp(raw, 0, 100)), me: true }, ...S.rivals.map((q) => ({ q, s: Math.round(clamp(rivalScore(q) + rnd(-12, 8), 0, 99)) }))].sort((a, b) => b.s - a.s);
          const win = sc[0];
          S.miniWin = win.me ? "me" : win.q.id;
          S.miniRank = sc.map((r) => (r.me ? "me" : r.q.id));
          if (team) S.captains = [sc[0].q, sc[1].q];
          else if (win.me) premio.apply();
          if (win.me) earn(100, "Premio del minirreto");
          else S.form[win.q.id] = clamp((S.form[win.q.id] || 0) + 3, -10, 10);
          if (win.me) Confetti.burst(1500);
          header();
          body().innerHTML = `
            <div class="story-card">
              <p class="eyebrow">⚡ ${esc(titulo)} · resultados</p>
              <h3>${win.me ? "¡Ganas el minirreto! ⚡" : `${esc(win.q.name)} gana el minirreto`}</h3>
              <p class="${win.me ? "gold" : "muted"}">${team ? `Capitanas: <b>${esc(sc[0].me ? "tú" : sc[0].q.name)}</b> y <b>${esc(sc[1].me ? "tú" : sc[1].q.name)}</b>.` : win.me ? `Premio: ${esc(premio.txt)}.` : `Se lleva ${esc(premio.txt)}.`}</p>
              <ol class="ranking">${sc.slice(0, 5)
                .map((r, k) => `<li style="--i:${k}" class="${r.me ? "me" : ""}"><i style="background-image:url('${photo(r.q)}')"></i><span>${esc(r.q.name)}</span>${k === 0 ? `<b class="tag win">Ganadora</b>` : team && k === 1 ? `<b class="tag win">Capitana</b>` : ""}</li>`)
                .join("")}</ol>

              <button class="btn btn-primary" id="story-next">Continuar</button>
            </div>`;
          checkpoint("mini");
          $("#story-next").addEventListener("click", then);
        });
      });
    });
  }
  // El reto de la semana (se decide al empezar el episodio)
  function setReto() {
    const tipo = pickReto();
    S.epNames[S.ep] = EP_SHORT[tipo] || "Reto";
    S.curTipo = tipo;
    S.curEpTipo = S.ep;
    S.curTitulo = RETOS[tipo].titulo();
    return tipo;
  }
  // ¡Suena la sirena! Supremme entra al taller y anuncia el maxirreto
  function announce(then) {
    setReto();
    // La sirena suena con el mensaje grabado; luego las reinas reaccionan y entra Supremme
    const sirena = [
      ["r1", pick1(["¡Que viene, que viene!", "¡Todas a sus puestos!", "¡Callaos, que entra!"])],
      ["host", pick1(["¡Hola, hola, mis reinas!", "¡Buenos días, reinas!", "¡Hola, mis niñas!"])],
    ];
    const siren = (next) => {
      body().innerHTML = `
        <div class="story-card siren-card">
          <div class="siren-light">🚨</div>
          <p class="siren-msg">📢 «¡Agárrate las bragas, marichocho!»</p>
          <p class="muted">Suena la sirena del taller...</p>
          <button class="btn btn-primary" id="story-go">Continuar</button>
        </div>`;
      Sound.countdown && Sound.countdown(true);
      $("#story-go").addEventListener("click", next);
    };
    const ctx = ctxWith(pick1(S.rivals), { reto: S.curTitulo });
    const anuncio = () => S.curTipo === "repescaStand"
      ? dialog([["host", "Reinas, hoy no estáis solas. ¡Que pasen las eliminadas!"], ["r1", "¡¿QUÉ?! ¡Han vuelto!"], ["host", `Esta semana: ${S.curTitulo}. Cada una de vosotras hará un monólogo con una de ellas.`], ["host", "La eliminada de la pareja ganadora... vuelve a la competición. Y las reinas de las tres peores parejas harán un lip sync a tres bandas: solo se salva una."], ...(S.flags.immune ? [["host", `${S.flags.immune === "me" ? "{yo}" : (qById(S.flags.immune) || {}).name}, tú ganaste la semana pasada: esta semana no compites. Serás nuestra maestra de ceremonias.`]] : [])], ctx, then)
      : dialog(pickFresh(HISTORIA.anuncio), ctx, then);
    if (S.ep !== 1) return siren(() => dialog([...sirena, ...pickFresh(HISTORIA.tallerHost)], ctx, anuncio));
    // Primer día: bienvenida de la temporada (y la caja de la suerte si toca)
    siren(() => dialog([...sirena, ...seasonInfo().intro], ctx, () => (twistOf() === "suerte" && S.luck === undefined ? pickLuckBox(anuncio) : anuncio())));
  }
  // Después del taller: equipos (si toca) y a por el reto
  function beginChallenge() {
    const tipo = S.curEpTipo === S.ep && S.curTipo ? S.curTipo : setReto();
    const reto = RETOS[tipo];
    const titulo = S.curTitulo || reto.titulo();
    S.team = null;
    S.cGroups = null;
    const go = () => challengeIntro(reto, titulo, tipo);
    const caps = () => {
      const c = S.captains || [S.queen, ...S.rivals].sort((a, b) => (b === S.queen ? 70 : skillOf(b)) - (a === S.queen ? 70 : skillOf(a))).slice(0, 2);
      draft(c[0], c[1], go);
    };
    if (tipo === "repescaStand" && S.flags.immune === "me") return mcEpisode();
    if (tipo === "repescaStand") return repescaPairs(go);
    const grouped = reto.groups && S.rivals.length + 1 >= reto.groups * 2;
    if (grouped) return formChallengeGroups(reto.groups, go);
    if (reto.team && S.rivals.length >= 3) return caps();
    go();
  }

  // Parejas o grupos para el reto. Si has ganado el minirreto, eliges tú a tus compañeras; si no, las reparte Supremme
  const GROUP_NAMES = ["Rosa", "Oro", "Turquesa", "Lila", "Coral", "Esmeralda"];
  const groupWord = (size) => (size === 2 ? "Pareja" : "Grupo");
  function formChallengeGroups(size, then) {
    const all = [S.queen, ...S.rivals];
    const finishGroups = (groups, mine) => {
      const order = groups.slice();
      S.cGroups = order.map((g) => g.map(keyOf));
      S.team = mine.filter((q) => q !== S.queen);
      logEv(`Reto por ${size === 2 ? "parejas" : "grupos"}: ${S.queen.name} va con ${S.team.map((q) => q.name).join(" y ")}`);
      body().innerHTML = `
        <div class="story-card">
          <p class="eyebrow">${size === 2 ? "Reto por parejas" : "Reto por grupos"}</p>
          <h3>${size === 2 ? "Así quedan las parejas" : "Así quedan los grupos"}</h3>
          <div class="groups-grid">${order.map((g, i) => `<div class="group-col ${g.includes(S.queen) ? "mine" : ""}" style="--i:${i}"><b>${groupWord(size)} ${GROUP_NAMES[i % GROUP_NAMES.length]}</b>${g.map((q) => `<span><i style="background-image:url('${photo(q)}')"></i>${esc(q === S.queen ? "Tú" : q.name)}</span>`).join("")}</div>`).join("")}</div>
          <p class="muted">Se juzga por ${size === 2 ? "parejas" : "grupos"}: ${size === 2 ? "una pareja" : "un grupo"} queda arriba (y de ahí sale la ganadora), otro abajo (y de ahí sale el bottom) y el resto se salva.</p>
          <button class="btn btn-primary" id="story-next">¡Al reto!</button>
        </div>`;
      $("#story-next").addEventListener("click", then);
    };
    // Elección por turnos: las mejores del minirreto son capitanas y van eligiendo de una en una (ronda tras ronda)
    const byKey = (k) => (k === "me" ? S.queen : qById(k));
    const nG = Math.max(2, Math.floor(all.length / size));
    const rank = (S.miniRank || []).map(byKey).filter((q) => q && all.includes(q));
    const caps = [...rank, ...shuffle(all.filter((q) => !rank.includes(q)))].slice(0, nG);
    const groups = caps.map((c) => [c]);
    const pool = all.filter((q) => !caps.includes(q));
    const log = [];
    const nm = (q) => (q === S.queen ? "Tú" : q.name);
    // Lo que valora una capitana rival al elegir: lo buena que es para este reto y si se llevan bien
    const wantOf = (cap, q) => retoAttrOf(q) * 2 + groupAff(cap, q) * 3 + (q === S.queen ? relOf(cap) * 2 : 0) + rnd(-3, 3);
    let turn = 0;
    const full = () => groups.every((g) => g.length >= size) || !pool.length;
    const board = (myTurn) => {
      body().innerHTML = `
        <div class="story-card">
          <p class="eyebrow">${size === 2 ? "Reto por parejas" : "Reto por grupos"} · eligen las capitanas</p>
          <h3>${myTurn ? "Te toca elegir" : "Las capitanas eligen por turnos"}</h3>
          <p class="muted">Capitanas por orden del minirreto: ${caps.map((c) => `<b>${esc(nm(c))}</b>`).join(", ")}. Cada una elige a una por turno.</p>
          <div class="groups-grid">${groups.map((g, i) => `<div class="group-col ${g.includes(S.queen) ? "mine" : ""} ${i === turn % nG && !full() ? "on" : ""}" style="--i:${i}"><b>${groupWord(size)} ${GROUP_NAMES[i % GROUP_NAMES.length]}</b>${g.map((q) => `<span><i style="background-image:url('${photo(q)}')"></i>${esc(nm(q))}${q === caps[i] ? " 👑" : ""}</span>`).join("")}</div>`).join("")}</div>
          ${log.length ? `<p class="muted">${esc(log[log.length - 1])}</p>` : ""}
          ${myTurn ? `<div class="hub-grid">${pool.map((q, i) => `<button class="hub-q ${relOf(q) >= 2 ? "ally" : relOf(q) <= -2 ? "enemy" : ""}" style="--i:${i}" data-id="${q.id}"><i style="background-image:url('${photo(q)}')"></i><span>${esc(q.name)}</span><small>${relLabel(q)}</small>${roleChip(q)}</button>`).join("")}</div>` : `<div class="ia-dots"><i></i><i></i><i></i></div>`}
        </div>`;
    };
    const step = () => {
      if (full()) {
        // Las que sobren van a los grupos más pequeños
        pool.splice(0).forEach((q) => groups.slice().sort((a, b) => a.length - b.length)[0].push(q));
        const mine = groups.find((g) => g.includes(S.queen));
        return finishGroups(groups, mine);
      }
      const i = turn % nG, cap = caps[i];
      if (groups[i].length >= size) { turn++; return step(); }
      if (cap === S.queen) {
        board(true);
        body().querySelectorAll("[data-id]").forEach((b) => b.addEventListener("click", () => {
          const q = qById(b.dataset.id);
          pool.splice(pool.indexOf(q), 1);
          groups[i].push(q);
          changeRel(q, 1);
          log.push(`Eliges a ${q.name}.`);
          turn++;
          step();
        }));
        return;
      }
      const q = pool.slice().sort((a, b) => wantOf(cap, b) - wantOf(cap, a))[0];
      pool.splice(pool.indexOf(q), 1);
      groups[i].push(q);
      if (q === S.queen) changeRel(cap, 1);
      log.push(`${cap.name} elige a ${nm(q) === "Tú" ? "ti" : q.name}.`);
      turn++;
      board(false);
      setTimeout(step, 700);
    };
    step();
  }
  // Nota de la semana: reto + pasarela
  function closeReto(raw, bonus, titulo, onScore) {
    return (walk) => {
      S.lastParts = { reto: Math.round(raw), pasarela: walk === null ? null : Math.round(walk) };
      const total = walk === null ? raw : raw * 0.65 + walk * 0.35;
      const final = Math.round(clamp(total + bonus, 0, 100));
      if (!onScore) checkpoint("scored", { score: final, titulo, tipo: S.curTipo, parts: S.lastParts, bonus, team: S.team ? S.team.map((q) => q.id) : null, cGroups: S.cGroups || null });
      (onScore || results)(final, titulo);
    };
  }
  function challengeIntro(reto, titulo, tipo, onScore) {
    if (!onScore) flowGo("reto");
    S.curPieces = null;
    S.ballCtx = null;
    S.weekProd = null;
    [mxSnatch, mxActing, mxRusical, mxGirlGroups, mxMateriales, mxMakeover, mxImpro, mxPublicidad, mxRoast].forEach((f) => (f.classic = false));
    body().innerHTML = `
      <div class="story-card intro">
        <img class="story-queen" src="${sprite(S.queen)}" alt="">
        <div>
          <p class="eyebrow">${S.cGroups && S.team ? `${S.team.length === 1 ? "Tu pareja" : "Tu grupo"}: ${S.team.map((q) => esc(q.name)).join(" y ")}` : S.team ? `Equipo Rosa · ${S.team.length + 1} reinas` : `Quedan ${S.rivals.length + 1} reinas`}</p>
          <h3>${esc(titulo)}</h3>
          <p>${reto.desc}</p>
          ${S.rivals.length + 1 === 5 && !asLike(twistOf()) ? `<p class="twist-note">🎟️ Último reto antes de la final: la ganadora se lleva un pase directo a la gran final y no tendrá que pasar por la Súper Lalaparuza.</p>` : ""}
          <p class="muted">🎮 ${reto.ctrl}</p>
          ${reto.attrs ? `<p class="attr-row">Cuentan: ${attrChips(reto.attrs)}</p>` : ""}
          <button class="btn btn-primary" id="story-go">¡Empezar!</button>
        </div>
      </div>`;
    $("#story-go").addEventListener("click", () => {
      body().innerHTML = `<div id="story-play"></div>`;
      if (reto.noRunway) S.lastLook = null; // el look del reto es el de esta semana
      if (reto.noRunway && S.runwayBonus) { S.advice += 6; S.runwayBonus = 0; }
      Music.play("reto");
      reto.run($("#story-play"), (raw) => {
        cleanup = null;
        if (typeof window.__forceScore === "number") raw = window.__forceScore; // solo pruebas
        Music.stop();
        if (raw >= 95) Achievements.unlock("perfecta");
        const pactB = S.team ? S.team.filter((q) => S.pacts && S.pacts[q.id]).length * 3 : 0;
        const bonus = clamp(relBonus() + S.advice - (S.helped ? 4 : 0) + pactB, -12, 12);
        S.lastBonus = bonus;
        const close = closeReto(raw, bonus, titulo, onScore);
        if (reto.noRunway || onScore) return close(null);
        // Punto de control antes de la pasarela: se puede repetir solo la pasarela
        checkpoint("runway", { raw, bonus, titulo, tipo: S.curTipo, team: S.team ? S.team.map((q) => q.id) : null, cGroups: S.cGroups || null });
        runway(close);
      });
    });
  }
  // La pasarela de cada semana, con su categoría
  function runway(then) {
    flowGo("pasarela");
    setSet("stage");
    // Pasarela temática (si hay fotos para ella)
    const temas = (typeof TEMAS_PASARELA !== "undefined" ? TEMAS_PASARELA : []);
    S.usedThemes = S.usedThemes || [];
    let tema = null;
    const planned = S.runwayPlan && S.runwayPlan[S.runwayIdx || 0];
    if (planned && !window.__forceTheme) {
      S.runwayIdx = (S.runwayIdx || 0) + 1;
      tema = temas.find((t) => t.n === planned) || null;
      if (tema) CAT_TAG[tema.n] = tema.tag;
    } else if (temas.length) {
      const fresh = temas.filter((t) => !S.usedThemes.includes(t.id));
      tema = (window.__forceTheme && temas.find((t) => t.id === window.__forceTheme)) || pick1(fresh.length ? fresh : temas);
      S.usedThemes.push(tema.id);
      CAT_TAG[tema.n] = tema.tag;
    }
    const cat = tema ? tema.n : planned && !window.__forceTheme ? planned : pick1(CATEGORIAS);
    S.runwayCat = cat;
    body().innerHTML = `
      <div class="story-card intro">
        <img class="story-queen" src="${sprite(S.queen)}" alt="">
        <div>
          <p class="eyebrow">👠 Pasarela de la semana</p>
          <h3>${tema ? "Temática" : "Categoría"}: «${esc(cat)}»</h3>
          ${tema ? `<p><i>${esc(tema.d)}</i></p>` : ""}
          <p>${(S.prepLooks || {})[cat] ? "Tu look ya está preparado desde casa. Antes de salir podrás revisarlo y cambiar lo que quieras: el jurado decidirá si encaja." : "Prepara el look con lo que tienes en tu armario: look, peluca, tacones y toque final. Elige lo que creas que mejor cuenta la temática: el jurado decidirá si encaja."} El movimiento (👣) ayuda en el desfile.</p>
          <p class="muted">🎮 Clic o teclas 1, 2, 3 y 4 · ${attrChips(["estilo", "performance", "carisma"])}</p>
          <button class="btn btn-primary" id="story-go">¡A la pasarela!</button>
        </div>
      </div>`;
    Music.play("reto");
    $("#story-go").addEventListener("click", () => {
      body().innerHTML = `<div id="story-play"></div>`;
      runRunwayNew($("#story-play"), cat, (walk) => {
        cleanup = null;
        if (typeof window.__forceScore === "number") walk = window.__forceScore;
        Music.stop();
        then(clamp(walk + (S.runwayBonus || 0), 0, 100));
      });
    });
  }

  // Resultado de la semana: todo sale de las notas del día (nada predefinido)
  function results(myScore, titulo) {
    flowGo("llamada");
    setSet("panel");
    let sc = {};
    if (S.phase && S.phase.ep === S.ep && S.phase.sc) sc = { ...S.phase.sc };
    S.rivals.forEach((q) => { if (sc[q.id] == null) sc[q.id] = rivalScore(q); });
    if (sc.__dado == null && typeof window.__forceScore !== "number") {
      let d = myDado(myScore);
      // Si el jurado ya te valoró en directo, el dado solo matiza: no puede convertir unas críticas buenísimas en un desastre
      if (S.liveEp === S.ep) d = clamp(d, myScore - 8, myScore + 6);
      sc.__dado = d;
    }
    if (sc.__dado != null) myScore = sc.__dado;
    // Segunda Oportunidrag: la nota es de la pareja (la reina y su eliminada)
    if (S.curTipo === "repescaStand" && S.rp && S.rp.ep === S.ep && !sc.__rp) {
      sc.__rp = 1;
      S.rivals.forEach((q) => { const o = S.rp.pairs[q.id]; if (o && S.rp.ps[o] != null) sc[q.id] = Math.round(sc[q.id] * 0.6 + S.rp.ps[o] * 0.4); });
      const mo = S.rp.pairs.me;
      if (mo && S.rp.ps[mo] != null) sc.__me = Math.round(myScore * 0.65 + S.rp.ps[mo] * 0.35);
    }
    if (sc.__me != null) myScore = sc.__me;
    // Lalaparuza: la clasificación sale del cuadro del torneo (sin dado ni bonus)
    const LR = S.curTipo === "lalaparuza" && S.lalaRes && S.lalaRes.ep === S.ep && S.lalaRes.done ? S.lalaRes : null;
    if (LR) {
      S.rivals.forEach((q) => { if (LR.score[q.id] != null) sc[q.id] = LR.score[q.id]; });
      myScore = LR.score.me;
      sc.__dado = myScore;
    }
    if (S.phase && S.phase.ep === S.ep && !S.phase.sc) { S.phase.sc = { ...sc }; save(); }
    let teamLine = "";
    let winTeam = null;
    const teamOf = {};
    if (S.team && !S.cGroups && (RETOS[S.curTipo] || {}).team) {
      const A = [S.queen, ...S.team], B = S.rivals.filter((q) => !S.team.includes(q));
      const val = (q) => (q === S.queen ? myScore : sc[q.id]);
      const avg = (T) => T.reduce((a, q) => a + val(q), 0) / Math.max(1, T.length);
      const aWins = avg(A) >= avg(B);
      A.forEach((q) => (teamOf[q.id] = "rosa"));
      B.forEach((q) => (teamOf[q.id] = "oro"));
      winTeam = new Set(aWins ? A : B);
      if ((aWins ? B : A).length < 2) winTeam = null;
      (aWins ? A : B).forEach((q) => (q === S.queen ? (myScore = Math.min(100, myScore + 8)) : (sc[q.id] = Math.min(99, sc[q.id] + 8))));
      teamLine = `<p class="gold">${aWins ? "🏆 ¡Tu equipo (Rosa) gana el reto por equipos! +8" : "El equipo Oro gana el reto por equipos."}</p>`;
    }
    // Retos por equipos: el jurado salva y nomina por bloques (ganan las del equipo ganador, el bottom sale del perdedor)
    // Segunda Oportunidrag: la maestra de ceremonias no compite
    const mcQ = S.curTipo === "repescaStand" && S.flags.immune && S.flags.immune !== "me" ? qById(S.flags.immune) : null;
    if (mcQ) mark(mcQ, "MC");
    let rows = [{ q: S.queen, s: myScore, me: true }, ...S.rivals.filter((q) => q !== mcQ).map((q) => ({ q, s: sc[q.id] }))].sort((a, b) => (winTeam ? (winTeam.has(b.q) ? 1 : 0) - (winTeam.has(a.q) ? 1 : 0) : 0) || b.s - a.s);
    // Reto por grupos: se ordena por la media de cada grupo; dentro, por la nota de cada una
    let groupOf = null, nGroups = 0;
    if (S.cGroups) {
      const byK = new Map(rows.map((r) => [keyOf(r.q), r]));
      const G = S.cGroups.map((g) => g.map((k) => byK.get(k)).filter(Boolean)).filter((g) => g.length);
      if (G.length >= 2) {
        G.forEach((g) => (g.avg = g.reduce((a, r) => a + r.s, 0) / g.length));
        G.sort((a, b) => b.avg - a.avg).forEach((g) => g.sort((a, b) => b.s - a.s));
        rows = G.flat();
        groupOf = new Map();
        G.forEach((g, gi) => g.forEach((r) => groupOf.set(r, gi)));
        nGroups = G.length;
      }
    }
    // Bloques del reto en grupo: primero se valora y se anuncia cada grupo, luego a cada reina
    let blocks = null;
    if (groupOf) {
      blocks = [];
      rows.forEach((r) => { const gi = groupOf.get(r); (blocks[gi] = blocks[gi] || { rows: [], gi }).rows.push(r); });
    } else if (winTeam) {
      const W = rows.filter((r) => winTeam.has(r.q)), L = rows.filter((r) => !winTeam.has(r.q));
      const tn = (list) => (teamOf[list[0].q.id] === "rosa" ? "Equipo Rosa" : "Equipo Oro");
      if (W.length && L.length) blocks = [{ rows: W, gi: 0, name: tn(W) }, { rows: L, gi: 1, name: tn(L) }];
    }
    const blockName = (b) => b.name || b.rows.map((r) => (r.me ? S.queen.name : r.q.name)).join(", ").replace(/, ([^,]*)$/, " y $1");
    const blockTone = (b) => (b.gi === 0 ? "top" : b.gi === blocks.length - 1 ? "low" : "mid");
    const n = rows.length;
    // Con 6 reinas o menos ya no hay salvadas: todas reciben valoración
    const allCrit = n <= 6;
    const winner = rows[0];
    const tw = twistOf();
    // T6: bottom de tres (luego decide la moneda)
    let nb = tw === "moneda" && n >= 6 ? 3 : 2;
    // Segunda Oportunidrag: bottom de tres y lip sync a tres bandas
    if (S.curTipo === "repescaStand" && repescaNow() && n >= 5) nb = 3;
    if (groupOf) { const lastSize = rows.filter((r) => groupOf.get(r) === nGroups - 1).length; nb = Math.max(1, Math.min(nb, lastSize)); }
    // All Winners: no hay bottom ni críticas negativas (solo top 2, altas y salvadas)
    if (tw === "winners") nb = 0;
    let bottomRows = rows.slice(n - nb);
    const notes = [];
    // El reto anterior a la Segunda Oportunidrag da inmunidad para esa semana
    if (tw === "repesca" && !S.flags.repesca && !S.meOut && n === REPESCA_AT + 1 && S.flags.immuneEp !== S.ep) {
      S.flags.immune = winner.me ? "me" : winner.q.id;
      S.flags.immuneEp = S.ep;
    }
    // La inmunidad se anuncia en el veredicto: antes delataría a la ganadora
    const immuneNote = tw === "repesca" && S.flags.immuneEp === S.ep ? (winner.me ? "🎤 <b>Ganas la inmunidad</b>: la semana que viene no compites, serás la <b>maestra de ceremonias</b>." : `🎤 <b>${esc(winner.q.name)}</b> gana la inmunidad: la semana que viene no compite, será la <b>maestra de ceremonias</b>.`) : "";
    // Salvar a una del bottom: entra la siguiente peor que no esté ya dentro
    const saveRow = (row, how) => {
      const next = rows.slice(0, n - 1).reverse().find((r) => !bottomRows.includes(r) && r !== winner && !r.protected);
      if (!next) return false;
      row.protected = true;
      bottomRows = bottomRows.map((b) => (b === row ? next : b));
      notes.push(`${how} <b>${esc(row.q.name)}</b> se salva y <b>${esc(next.q.name)}</b> entra en el bottom.`);
      return true;
    };
    // (La reina de la suerte se saca justo antes del lip sync: ver luckMoment)
    // (Los corazones de T5 se destapan después del reparto: ver heartReveal)

    const finish = () => {
      const myPos = rows.findIndex((r) => r.me);
      const bottom = bottomRows.some((r) => r.me);
      const won = myPos === 0;
      // Al reanudar a mitad de resultados no se vuelve a sumar la semana
      const already = !!(S.phase && S.phase.ep === S.ep && S.phase.counted);
      if (!already) {
        rows.forEach((r) => {
          const k = keyOf(r.q);
          S.record[k] = (S.record[k] || 0) + (r === winner ? 3 : bottomRows.includes(r) ? 0 : 1);
          if (!r.me) S.form[r.q.id] = clamp(Math.round((S.form[r.q.id] || 0) * 0.8) + (r === winner ? 2 : bottomRows.includes(r) ? -1 : 0) + rnd(-1, 1), -8, 8);
        });
        S.points += myScore * 10 + (won ? 500 : 0);
        if (won && !asLike(tw)) S.wins++;
        if (bottom) S.bottoms++;
        S.streak = won ? S.streak + 1 : 0;
        if (S.phase && S.phase.ep === S.ep) S.phase.counted = 1;
      }
      // Lo que delata el resultado (premios, crónica de la temporada) espera al veredicto
      const payout = () => {
        if (S.phase && S.phase.ep === S.ep && S.phase.paid) return;
        if (S.phase && S.phase.ep === S.ep) { S.phase.paid = 1; }
        logEv(`Gana el reto ${won ? S.queen.name : winner.q.name}; en el bottom: ${bottomRows.map((r) => r.q.name).join(" y ")}`);
        if (n === 5 && !asLike(tw)) { S.flags.pase = keyOf(winner.q); logEv(`${winner.me ? S.queen.name : winner.q.name} gana el pase directo a la gran final`); }
        if (won && !asLike(tw)) { growAttr(((RETOS[S.curTipo] || {}).attrs || [])[0]); earn(300, "Ganas el reto de la semana"); }
        else if (myPos <= 2 && !bottom) earn(80, "Entre las mejores de la semana");
        if (won && !asLike(tw)) meWonReto();
        if (bottom) meInBottom();
        if (S.streak >= 3) Achievements.unlock("racha");
        traitPeek.forEach((f) => f());
        if (S.phase && S.phase.ep === S.ep) save();
      };
      const top2 = rows.slice(0, 2);
      const cat = RETO_CAT[S.curTipo];
      const traitPeek = [];
      if (cat) rows.forEach((r, k) => {
        if (r.me) return;
        const t = traitsOf(r.q);
        if (k <= 1 && t.fort === cat && Math.random() < 0.6) traitPeek.push(() => learnTrait(r.q, "fort", "Lo has visto en el reto"));
        if (k >= n - 3 && RASGOS.deb[t.deb].cat === cat && Math.random() < 0.6) traitPeek.push(() => learnTrait(r.q, "deb", "Lo has visto en el reto"));
      });
      // Las posiciones se deciden ya, pero no se apuntan en el track record hasta el veredicto (después del Untucked)
      const labs = new Map();
      let marked = false;
      const applyMarks = () => { if (marked) return; marked = true; rows.forEach((r) => mark(r.q, labs.get(r))); payout(); };
      rows.forEach((r, k) => {
        let lab;
        if (asLike(tw) && top2.includes(r)) lab = "TOP2";
        else if (r === winner) lab = "WIN";
        else if (bottomRows.includes(r)) lab = `BTM${nb}`;
        else if (r.protected) lab = `BTM${nb}`;
        else if (groupOf) lab = groupOf.get(r) === 0 ? (k <= (n <= 7 ? 1 : 2) ? "HIGH" : "SAFE") : groupOf.get(r) === nGroups - 1 ? "LOW" : "SAFE";
        else if (k <= (n <= 7 ? 1 : 2)) lab = "HIGH";
        else if (k >= n - nb - 1) lab = "LOW";
        else lab = "SAFE";
        if (tw === "winners") {
          if (lab === "LOW" || /^BTM/.test(lab)) lab = "SAFE";
          // Las dos siguientes al top 2 reciben críticas especialmente buenas
          if (lab === "SAFE" && k >= 2 && k <= 3 && n >= 6) lab = "HIGH";
          // La bloqueada puede quedar en el top, pero sin estrella (en rojo en el track record)
          if (lab === "TOP2" && S.block && S.block.ep === S.ep && S.block.id === keyOf(r.q)) lab = "BTOP";
        }
        labs.set(r, lab);
      });
      const labOf = labs;
      const nm = (r) => esc(r.me ? "Tú" : r.q.name);
      const faces = (list, cls = "") => `<div class="call-faces ${cls}">${list.map((r, k) => `<span class="${r.me ? "me" : ""}" style="--i:${k}"><i style="background-image:url('${photo(r.q)}')"></i>${nm(r)}</span>`).join("")}</div>`;
      // Con 6 o menos todas reciben valoración: nadie se salva antes de la crítica
      // Desordenadas: que el orden no delate quién va arriba o abajo
      const safe = allCrit ? [] : shuffle(rows.filter((r) => labOf.get(r) === "SAFE"));
      const judged = shuffle(allCrit ? rows.slice() : rows.filter((r) => labOf.get(r) !== "SAFE"));
      const meRow = rows.find((r) => r.me);
      const meSafe = !allCrit && labOf.get(meRow) === "SAFE";
      const safeFirst = Math.random() < 0.5;
      const safeTxt = `<p>${safe.length ? `${safe.map(nm).join(", ")}: <b>estáis salvadas</b>. Podéis volver al backstage.` : allCrit ? `Quedáis ${n}: a partir de ahora <b>todas recibís valoración</b>.` : "Esta semana no se salva nadie de antemano."}</p>${safe.length ? faces(safe, "safe") : ""}`;
      const judgedTxt = allCrit
        ? `<p>${judged.map(nm).join(", ")}: esta semana <b>todas recibís la valoración del jurado</b>.</p>${faces(judged)}`
        : tw === "winners" ? `<p>${judged.map(nm).join(", ")}: <b>esta semana recibís las críticas del jurado</b>.</p>${faces(judged)}` : `<p>${judged.map(nm).join(", ")}... <b>sois las mejores y las peores del programa de hoy</b>.</p>${faces(judged)}`;
      header();
      Music.play("tension");
      body().innerHTML = `
        <div class="story-card call">
          <p class="eyebrow">${esc(titulo)} · la pasarela ha terminado</p>
          <h3>Supremme tiene algo que deciros...</h3>
          ${notes.map((t) => `<p class="twist-note">${t}</p>`).join("")}
          ${allCrit ? `<p>Quedáis ${n}: a partir de ahora ya no hay salvadas.</p>` + judgedTxt : safeFirst && safe.length ? safeTxt + judgedTxt : judgedTxt + (safe.length ? `<p>Las demás, <b>estáis a salvo</b>.</p>${faces(safe, "safe")}` : "")}
          <p class="call-me">${meSafe ? "✨ Estás a salvo esta semana." : "👀 Te toca escuchar al jurado."}</p>
          <button class="btn btn-primary" id="story-next">Continuar</button>
        </div>`;
      // Valoraciones solo a las mejores y peores
      const RIVAL_TOP = ["{n}, hoy has estado a otro nivel.", "{n}, me ha encantado. Así, sí.", "{n}, eso es lo que quiero ver cada semana."];
      const RIVAL_LOW = ["{n}, hoy no te he reconocido.", "{n}, te ha faltado de todo esta semana.", "{n}, esperaba muchísimo más de ti."];
      const othersCrit = () => {
        const others = shuffle(judged.filter((r) => !r.me)).slice(0, 3);
        return others.map((r) => [pick1(["judge", "host", "ambrossi", "calvo"]), pick1(["WIN", "HIGH", "TOP2", "BTOP"].includes(labOf.get(r)) ? RIVAL_TOP : RIVAL_LOW).replace("{n}", r.q.name)]);
      };
      // Cada reina que recibe valoración escucha su crítica: del reto y de la pasarela (sin notas ni posiciones)
      const rivalCrit = async () => {
        const others = shuffle(judged.filter((r) => !r.me));
        if (!others.length) return [];
        const lvl = (r) => { const l = labOf.get(r); return l === "WIN" || l === "TOP2" || l === "BTOP" ? "muy buena" : l === "HIGH" ? "buena" : /^BTM/.test(l) ? "muy floja" : l === "LOW" ? "floja" : "correcta"; };
        const nivel = (r) => { const l = labOf.get(r); return ["WIN", "TOP2", "BTOP", "HIGH"].includes(l) ? "top" : /^BTM|LOW/.test(l) ? "low" : "mid"; };
        const runwayCat = (RETOS[S.curTipo] || {}).noRunway ? null : S.lastLook && S.lastLook.cat;
        let ai = null;
        if (IA.ready()) {
          aiWait("El jurado está deliberando...");
          ai = await IA.chat(
            `Escribes las críticas del jurado de Drag Race España a cada reina. Supremme de Luxe (teatral, cariñosa pero exigente) habla sobre todo del reto, Ana Locking (moda, técnica, directa) sobre todo de la pasarela y el look, aunque las dos pueden comentar las dos cosas. Los Javis (Javier Ambrossi y Javier Calvo) también son jueces y a veces dan su valoración. Son SOLO valoraciones: nunca digas posiciones ni resultados (ni ganadora, ni mejores, ni peores, ni bottom, ni lip sync, ni a salvo), ni felicites, ni des notas ni números. ${aiSeason()}`,
            `Reto de esta semana: ${S.curTitulo || S.epNames[S.ep] || "reto"}. ${weekTxt()} Ojo: lo que hizo ${S.queen.name} (su producto, personaje o tema) es SOLO suyo; cada una de estas reinas hizo su propia versión del reto, así que no les atribuyas lo de ${S.queen.name}. ${runwayCat ? `Pasarela: «${runwayCat}».` : "Esta semana no hay pasarela aparte: habla del look con el que presentó el reto."}
${blocks ? `Es un reto en grupo. Cómo ha quedado cada grupo, de mejor a peor (no lo digas, pero que el tono sea coherente): ${blocks.map((b) => blockName(b)).join(" > ")}. ` : ""}Reinas (valoración global de cada una): ${others.map((r) => `${r.q.name} (${lvl(r)})`).join("; ")}.
Orden real de esta semana, de mejor a peor (no lo digas, pero que el tono sea coherente: la de arriba suena claramente mejor que las de abajo): ${rows.map((r) => (r.me ? S.queen.name : r.q.name)).join(" > ")}.
Para cada una escribe "reto" (lo que le dice Supremme sobre su reto, concreto, máximo 22 palabras), "pasarela" (lo que le dice Ana sobre su look, inventa un look concreto que encaje con la categoría, máximo 22 palabras) y, solo en algunas, "javis" (un comentario de los Javis, máximo 18 palabras). Dirígete a ella por su nombre. Que cada crítica sea distinta.
Devuelve JSON {"criticas":[{"reina":"nombre","reto":"...","pasarela":"...","javis":"..."}]}`,
            { json: true, max: 1600, temp: 0.85, timeout: 30000 },
          );
        }
        const list = (ai && Array.isArray(ai.criticas) ? ai.criticas : []);
        return others.map((r) => {
          const c = list.find((x) => x && str(x.reina) === r.q.name);
          const named = (t) => (t.includes(r.q.name) ? t : `${r.q.name}, ${t.replace(/^./, (x) => x.toLowerCase())}`);
          if (c && str(c.reto) && str(c.pasarela)) return [["host", named(IA.clean(str(c.reto)))], ["judge", IA.clean(str(c.pasarela))], ...(str(c.javis) ? [[pick1(["ambrossi", "calvo"]), IA.clean(str(c.javis))]] : [])];
          const bank = (JURADO.reto[S.curTipo] || JURADO.reto.pasarela)[nivel(r)];
          const low1 = (t) => t.replace(/\{yo\}/g, r.q.name).replace(/^./, (c) => c.toLowerCase());
          return [["host", `${r.q.name}, ${low1(pickFresh(bank))}`], ["judge", `${r.q.name}, ${low1(pickFresh(JURADO.pasarela[nivel(r)]).replace(/^(y |por cierto, )/i, ""))}`], ...(Math.random() < 0.35 ? pickFresh(JAVIS.critica[nivel(r)]).map(([k, t]) => [k, t.replace(/\{yo\}/g, r.q.name)]) : [])];
        });
      };
      // Reto en grupo: el jurado valora primero cada grupo en bloque
      const GRUPO_CRIT = {
        top: [[["host", "{g}: como grupo habéis funcionado de maravilla. Se notaba que había un plan."], ["judge", "Y el conjunto tenía una idea clara. Ninguna se ha quedado atrás."]],
          [["host", "{g}: eso es un grupo. Química, ritmo y todas a la misma altura."], ["judge", "Visualmente erais una unidad. Así se presenta un reto en grupo."]]],
        mid: [[["host", "{g}: como grupo habéis cumplido, pero os faltaba algo para destacar."], ["judge", "Había cosas buenas, pero el conjunto no terminaba de cuadrar."]],
          [["host", "{g}: correcto, sin más. Esperaba un poco más de chispa de vosotras juntas."], ["judge", "Cada una ha hecho lo suyo, pero no os he visto como grupo."]]],
        low: [[["host", "{g}: como grupo no ha funcionado. Cada una iba por su lado."], ["judge", "El conjunto no se sostenía. Faltaba una idea común."]],
          [["host", "{g}: lo siento, pero como grupo ha sido de lo más flojo de la noche."], ["judge", "Se notaba que no os habíais puesto de acuerdo. Y eso en el escenario se ve."]]],
      };
      const blockCrit = () => {
        if (!blocks) return [];
        const list = blocks.filter((b) => allCrit || b.rows.some((r) => judged.includes(r)));
        if (!list.length) return [];
        return [["host", "Vamos a empezar por los grupos."], ...list.flatMap((b) => pickFresh(GRUPO_CRIT[blockTone(b)]).map(([k, t]) => [k, t.replace("{g}", blockName(b))])), ["host", "Y ahora, una a una."]];
      };
      const critStep = (then) => {
        flowGo("criticas");
        const ctx = { ...ctxWith(pick1(S.rivals)), tension: false };
        rivalCrit().then((rc) => {
          const bc = blockCrit();
          if (meSafe) return dialog([["host", "Reinas salvadas, al backstage. Jurado, es vuestro turno."], ...bc, ...rc.flat()], ctx, then);
          const lab = labOf.get(meRow) || "";
          // En grupo, tu crítica habla de lo que has hecho tú; el resultado lo pesa también el grupo
          let tier = /WIN|TOP2|HIGH/.test(lab) ? "top" : /BTM|LOW/.test(lab) ? "low" : "mid";
          let label = lab === "WIN" || lab === "TOP2" || lab === "BTOP" ? "muy buena" : lab === "HIGH" ? "buena" : /^BTM/.test(lab) ? "muy mala" : lab === "LOW" ? "floja" : "correcta";
          const extra = [];
          if (blocks) {
            const mine = blocks.find((b) => b.rows.includes(meRow));
            const pos = rows.slice().sort((a, b) => b.s - a.s).indexOf(meRow);
            const ind = pos < n * 0.34 ? "top" : pos >= n * 0.67 ? "low" : "mid";
            const gt = mine ? blockTone(mine) : "mid";
            if (ind !== tier) { tier = ind; label = ind === "top" ? "buena a título individual" : ind === "low" ? "floja a título individual" : "correcta"; }
            if (ind === "top" && gt !== "top") extra.push(["host", "{yo}, tú has estado de lo mejor de tu grupo. Pero esto era un reto en grupo, y el grupo también cuenta."]);
            else if (ind === "low" && gt === "top") extra.push(["host", "{yo}, el grupo te ha sostenido. Tú, por tu cuenta, te has quedado por debajo de tus compañeras."]);
          }
          const base = buildCritique(myScore, "none", tier);
          const k = Math.floor(rc.length / 2);
          aiCritique(base, myScore, label).then((lines) => dialog([...bc, ...rc.slice(0, k).flat(), ...lines, ...extra, ...rc.slice(k).flat()], ctx, then));
        });
      };
      // Resultados en orden: ganadora, altas, bajas y bottom
      const verdict = (then) => {
        flowGo("veredicto");
        applyMarks();
        setSet("panel");
        const byLab = (f) => rows.filter((r) => f(labOf.get(r)));
        const wins = byLab((l) => l === "WIN" || l === "TOP2" || l === "BTOP");
        const highs = byLab((l) => l === "HIGH");
        const lows = byLab((l) => l === "LOW");
        const safesC = allCrit ? byLab((l) => l === "SAFE") : [];
        const btms = rows.filter((r) => bottomRows.includes(r) || /^BTM/.test(labOf.get(r) || ""));
        const myLab = labOf.get(meRow);
        header();
        body().innerHTML = `
          <div class="story-card call">
            <p class="eyebrow">Las decisiones del jurado</p>
            <h3>${myLab === "TOP2" || myLab === "BTOP" ? "¡Estás en el top 2! 💄" : myLab === "WIN" ? "¡Has ganado el reto! 👑" : /^BTM/.test(myLab) ? (tw === "winners" ? "Semana floja... pero sigues" : "Vas al lip sync...") : myLab === "SAFE" ? "Estabas a salvo" : "Te salvas esta semana"}</h3>
            <div class="verdict">
              ${blocks ? `<div class="v-row win" style="--i:0"><b>🏆 ${blocks[0].name ? `Gana el ${esc(blocks[0].name)}` : "Grupo ganador"}</b>${faces(blocks[0].rows)}</div>` : teamLine}
              <div class="v-row win" style="--i:0"><b>${tw === "winners" ? "⭐ Top 2: os jugáis una estrella" : tw === "allstars" ? "💄 Top 2: os jugáis el poder" : n === 5 ? "👑 Ganadora del reto y 🎟️ pase directo a la gran final" : "👑 Felicidrages, ganadora del reto"}</b>${faces(wins)}</div>
              ${highs.length ? `<div class="v-row high" style="--i:1"><b>✨ Buen trabajo, estáis a salvo</b>${faces(highs)}</div>` : ""}
              ${safesC.length ? `<div class="v-row high" style="--i:1"><b>🙂 Estáis a salvo</b>${faces(safesC)}</div>` : ""}
              ${lows.length ? `<div class="v-row low" style="--i:2"><b>😬 A salvo... por los pelos</b>${faces(lows)}</div>` : ""}
              ${immuneNote ? `<p class="twist-note">${immuneNote}</p>` : ""}
              ${btms.length ? `<div class="v-row btm" style="--i:3"><b>💔 Lo siento: sois el bottom ${btms.length}</b>${faces(btms)}</div>` : ""}
            </div>
            <button class="btn btn-primary" id="story-next">Continuar</button>
          </div>`;
        $("#story-next").addEventListener("click", then);
      };
      const toLipSync = () => flowGo("lipsync") &&
        luckMoment(() =>
          (tw === "moneda" && bottomRows.length === 3 ? coinFlip : (x, cb) => cb(x.bottomRows))({ winner, bottomRows }, (pair) =>
            elimination({ winner, bottomRows: pair, top2: rows.slice(0, 2), rows }),
          ),
        );
      const ut = (then, pre) => untucked({ winner, bottomRows, savedBy: S.savedBy, pre, labOf }, then);
      // T5: veredicto → grabación del corazón → Untucked (para dar las gracias). Resto: Untucked → veredicto
      $("#story-next").addEventListener("click", () =>
        critStep(() => confesionario(() =>
          tw === "corazon" ? ut(() => verdict(() => heartReveal(toLipSync)), true) : ut(() => verdict(toLipSync), true),
        )),
      );
    };

    // Quién entraría en el bottom si se salva a alguien
    const nextIn = () => rows.slice(0, n - 1).reverse().find((r) => !bottomRows.includes(r) && r !== winner && !r.protected) || null;
    // Salvar a una del bottom después del reparto: entra la siguiente peor
    const rescue = (row) => {
      const prev = bottomRows.slice();
      if (!saveRow(row, "")) return null;
      const next = bottomRows.find((r) => !prev.includes(r));
      // La salvada mantiene su resultado (BTM): solo se libra del lip sync
      mark(next.q, `BTM${nb}`);
      header();
      return next;
    };
    const rescueCard = (eyebrow, title, icon, row, next, then, btn = "Continuar") => {
      Confetti.burst(1800);
      body().innerHTML = `
        <div class="story-card">
          <p class="eyebrow">${eyebrow}</p>
          <h3>${title}</h3>
          <div class="vs"><img src="${photo(row.q)}"><span>${icon}</span><img class="gone" src="${photo(next.q)}"></div>
          <p><b>${esc(row.q === S.queen ? "Tú" : row.q.name)}</b> ${row.q === S.queen ? "te salvas" : "se salva"} del bottom y <b>${esc(next.q === S.queen ? "tú" : next.q.name)}</b> ${next.q === S.queen ? "entras" : "entra"} en su lugar.</p>
          <button class="btn btn-primary" id="story-next">${btn}</button>
        </div>`;
      $("#story-next").addEventListener("click", then);
    };

    // T5: tras el reparto, la grabación de la eliminada destapa a quién dejó su medio corazón.
    // Si con eso completa un corazón entero, puede usarlo ahora. Si no lo usa, se pierde.
    function heartReveal(then) {
      S.savedBy = null;
      if (tw !== "corazon" || !(S.pendingHearts || []).length) return then();
      const list = S.pendingHearts.slice();
      S.pendingHearts = [];
      const btmNames = bottomRows.map((r) => (r.me ? "{yo}" : r.q.name)).join(" y ");
      let first = true;
      const step = () => {
        const p = list.shift();
        if (!p) return then();
        const from = qById(p.from);
        const to = p.to === "me" ? S.queen : qById(p.to);
        if (!from || !to || (to !== S.queen && !S.rivals.includes(to))) return step();
        const k = keyOf(to);
        const fav = to === S.queen ? relOf(from) >= 1 : Math.random() < 0.5;
        const ctx = { ...ctxWith(from), q: { r1: from }, r1: from.name, dest: to === S.queen ? S.queen.name : to.name, tension: true };
        const pre = first ? [["host", `Las valoraciones están hechas. ${btmNames}: vais al lip sync.`], ["host", "Pero antes... esta es la temporada del corazón."]] : [];
        first = false;
        dialog([...pre, ...pickFresh(CORAZON_VIDEO.intro), ...pickFresh(CORAZON_VIDEO[fav ? "cariño" : "estrategia"])], ctx, () => {
          S.hearts[k] = (S.hearts[k] || 0) + 1;
          header();
          const full = S.hearts[k] >= 2;
          Toast.show(`💔 Medio corazón para ${to === S.queen ? "ti" : to.name}`, full ? (to === S.queen ? "¡Ya tienes un corazón entero!" : "¡Ya tiene un corazón entero!") : to === S.queen ? "Te falta la otra mitad" : "Le falta la otra mitad");
          if (!full) return step();
          if (to === S.queen) return myFullHeart(step);
          rivalFullHeart(to, step);
        });
      };
      step();
    }
    function myFullHeart(next) {
      body().innerHTML = `
        <div class="story-card">
          <p class="eyebrow">❤️ ¡Tienes un corazón entero!</p>
          <h3>¿Lo usas ahora?</h3>
          <p>Solo puedes usarlo en este momento: si no lo usas, <b>se pierde</b>. En el bottom están: ${bottomRows.map((r) => `<b>${esc(r.me ? "tú" : r.q.name)}</b>`).join(" y ")}.</p>
          ${nextIn() ? `<p class="twist-note">⚠️ Si salvas a alguien, entra en el bottom <b>${esc(nextIn().me ? "tú" : nextIn().q.name)}</b>.</p>` : ""}
          <div class="choice-col">${bottomRows.map((r, i) => `<button class="btn btn-ghost" data-o="${i}">${esc(r.me ? "❤️ Usarlo para salvarme" : `❤️ Dárselo a ${r.q.name} para salvarla`)}</button>`).join("")}
            <button class="btn btn-primary" id="keep">No usarlo (se pierde)</button></div>
          ${trackBtn()}
        </div>`;
      bindTrack();
      body().querySelectorAll("[data-o]").forEach((b) => b.addEventListener("click", () => {
        const row = bottomRows[+b.dataset.o];
        S.hearts.me = 0;
        const nx = rescue(row);
        if (!nx) { header(); Toast.show("No se puede usar ahora", "No hay nadie que pueda ocupar ese sitio"); return next(); }
        if (!row.me) {
          changeRel(row.q, 3);
          nemEvent("save", S.queen, row.q);
          remember(row.q, "salvada", row !== bottomRows.concat([row]).sort((a, c) => a.s - c.s)[0]);
        }
        if (!nx.me) changeRel(nx.q, -1);
        rescueCard("❤️ El corazón", row.me ? "¡Usas tu corazón y te salvas!" : `¡Le das tu corazón a ${esc(row.q.name)}!`, "❤️", row, nx, next);
      }));
      $("#keep").addEventListener("click", () => {
        S.hearts.me = 0;
        header();
        Toast.show("💔 Corazón perdido", "No lo has usado a tiempo");
        next();
      });
    }
    function rivalFullHeart(q, next) {
      const self = bottomRows.find((r) => r.q === q);
      const mate = bottomRows.find((r) => r.q !== q && (sameGroup(q, r.q) || (r.me && relOf(q) >= 2)));
      const row = self || (mate && Math.random() < 0.6 ? mate : null);
      S.hearts[q.id] = 0;
      header();
      const ctx = { ...ctxWith(q), q: { r1: q }, r1: q.name, tension: true };
      if (!row) return dialog([["r1", pick1(["No estoy en el bottom... así que me quedo sin usarlo. Qué rabia.", "Pues nada, un corazón entero y no me hace falta. Se pierde."])], ["host", "Ese corazón se pierde. Así son las reglas."]], ctx, next);
      const nx = rescue(row);
      if (!nx) return next();
      if (row.me) { changeRel(q, 2); S.savedBy = q; Toast.show(`❤️ ${q.name} te ha salvado`, "Te ha dado su corazón"); }
      if (row.q !== q) nemEvent("save", q, row.q);
      if (nx.me) changeRel(q, -1);
      dialog([["r1", row.q === q ? "¡Tengo un corazón entero y lo uso para salvarme!" : `Tengo un corazón entero... y se lo doy a ${row.me ? "{yo}" : row.q.name}.`]], ctx, () =>
        rescueCard("❤️ El corazón", row.q === q ? `¡${esc(q.name)} se salva con su corazón!` : `¡${esc(q.name)} regala su corazón!`, "❤️", row, nx, next));
    }

    // T4: antes del lip sync Supremme pregunta por la reina de la suerte
    function luckMoment(then) {
      if (tw !== "suerte" || !S.luck || S.rivals.length < 3) return then();
      const useOn = (row, holderName) => {
        const prev = bottomRows.slice();
        if (!saveRow(row, "🍀")) return null;
        const next = bottomRows.find((r) => !prev.includes(r));
        // La salvada mantiene su resultado (BTM): solo se libra del lip sync
        mark(next.q, `BTM${nb}`);
        S.luck = null;
        header();
        return next;
      };
      const reveal2 = (holder, row, next) => {
        Confetti.burst(1800);
        body().innerHTML = `
          <div class="story-card">
            <p class="eyebrow">🍀 La reina de la suerte</p>
            <h3>¡${esc(holder === S.queen ? "Tú" : holder.name)} ${holder === S.queen ? "sacas" : "saca"} la reina de la suerte!</h3>
            <div class="vs"><img src="${photo(row.q)}"><span>🍀</span><img class="gone" src="${photo(next.q)}"></div>
            <p><b>${esc(row.q === S.queen ? "Tú" : row.q.name)}</b> ${row.q === S.queen ? "te salvas" : "se salva"} del lip sync y <b>${esc(next.q === S.queen ? "tú" : next.q.name)}</b> ${next.q === S.queen ? "entras" : "entra"} en su lugar.</p>
            <button class="btn btn-primary" id="story-next">Al lip sync</button>
          </div>`;
        $("#story-next").addEventListener("click", then);
      };
      const ask = [["host", pick1([
        "Reinas, antes de que empiece el lip sync... Si alguna tiene la reina de la suerte y quiere usarla, que la saque AHORA.",
        "Un momento. Esta es la temporada de la suerte. ¿Alguien quiere sacar a su reina de la suerte? Es ahora o nunca... esta semana.",
        "Antes de la música, la pregunta de siempre: ¿tiene alguien la reina de la suerte y quiere usarla?",
      ])]];
      const ctx = { ...ctxWith(pick1(S.rivals)), tension: true };
      if (S.luck === "me") {
        return dialog(ask, ctx, () => {
          body().innerHTML = `
            <div class="story-card">
              <p class="eyebrow">🍀 Solo tú sabes que la tienes</p>
              <h3>¿Sacas la reina de la suerte?</h3>
              <p>En el bottom están: ${bottomRows.map((r) => `<b>${esc(r.me ? "tú" : r.q.name)}</b>`).join(" y ")}. Si salvas a alguien, la siguiente con peor nota ocupa su sitio. Solo se usa una vez.</p>
              <div class="choice-col">${bottomRows.map((r, i) => `<button class="btn btn-ghost" data-o="${i}">${esc(r.me ? "🍀 Usarla para salvarme" : `🍀 Usarla para salvar a ${r.q.name}`)}</button>`).join("")}
                <button class="btn btn-primary" id="keep">Me la guardo (silencio...)</button></div>
              ${trackBtn()}
            </div>`;
          bindTrack();
          body().querySelectorAll("[data-o]").forEach((b) => b.addEventListener("click", () => {
            const row = bottomRows[+b.dataset.o];
            const next = useOn(row, S.queen.name);
            if (!next) { Toast.show("No se puede usar ahora", "No hay nadie que pueda ocupar ese sitio"); return then(); }
            if (!row.me) {
              changeRel(row.q, 3);
              remember(row.q, "salvada", row !== bottomRows.concat([row]).sort((a, c) => a.s - c.s)[0]);
            }
            if (!next.me) changeRel(next.q, -1);
            reveal2(S.queen, row, next);
          }));
          $("#keep").addEventListener("click", () => dialog([["host", "Nadie... Muy bien. Que empiece el lip sync."]], ctx, then));
        });
      }
      const holder = S.rivals.find((q) => q.id === S.luck);
      if (!holder) return then();
      // ¿La usa? Para salvarse seguro; para salvar a su grupo o a una amiga, a veces
      const late = S.rivals.length <= 6;
      const selfRow = bottomRows.find((r) => r.q === holder);
      const mateRow = bottomRows.find((r) => r.q !== holder && (sameGroup(holder, r.q) || (r.me && relOf(holder) >= 2)));
      let row = null;
      if (selfRow) row = selfRow;
      else if (mateRow && Math.random() < (late ? 0.75 : 0.45)) row = mateRow;
      else if (late && S.rivals.length <= 5 && Math.random() < 0.35) row = pick1(bottomRows.filter((r) => r.q !== holder));
      if (!row) return dialog([...ask, ["host", "Silencio... Nadie. Vale, seguimos."], ["me", "(¿Quién la tendrá?)"]], ctx, then);
      const next = useOn(row, holder.name);
      if (!next) return then();
      if (row.me) { changeRel(holder, 2); Toast.show(`🍀 ${holder.name} te ha salvado`, "Te debe haber cogido cariño"); }
      if (row.q !== holder) nemEvent("save", holder, row.q);
      if (next.me) changeRel(holder, -1);
      dialog([...ask, ["r1", row.q === holder ? "¡Yo! Yo la tengo. Y la uso para salvarme a mí." : `Yo la tengo. Y la uso para salvar a ${row.me ? "{yo}" : row.q.name}.`], ["host", "¡Sorpresa, sorpresa! La reina de la suerte ha hablado."]],
        { ...ctxWith(holder), q: { r1: holder }, r1: holder.name, tension: true }, () => reveal2(holder, row, next));
    }

    // Tus comodines: decides tú
    const opts = [];
    if (!opts.length) return finish();
    body().innerHTML = `
      <div class="story-card">
        <p class="eyebrow">${bottomRows.some((r) => r.me) ? "¡Estás en el bottom!" : "Momento de decidir"}</p>
        <h3>¿Usas tu comodín?</h3>
        <p>En el bottom están: ${bottomRows.map((r) => `<b>${esc(r.me ? "tú" : r.q.name)}</b>`).join(" y ")}. Si salvas a alguien, la siguiente con peor nota ocupa su sitio. Solo se usa una vez.</p>
        <div class="choice-col">${opts.map((o, i) => `<button class="btn btn-ghost" data-o="${i}">${esc(o.label)}</button>`).join("")}
          <button class="btn btn-primary" id="keep">Guardarlo para más adelante</button></div>
        ${trackBtn()}
      </div>`;
    bindTrack();
    body().querySelectorAll("[data-o]").forEach((b) =>
      b.addEventListener("click", () => {
        const o = opts[+b.dataset.o];
        if (saveRow(o.row, o.kind === "suerte" ? "🍀 ¡Sacas la reina de la suerte!" : "❤️ ¡Gastas un corazón!")) {
          if (o.kind === "suerte") S.luck = null;
          else S.hearts.me -= 2;
          if (!o.row.me) {
            changeRel(o.row.q, 3);
            const worstRow = bottomRows.concat([o.row]).sort((a, b) => a.s - b.s)[0];
            remember(o.row.q, "salvada", o.row !== worstRow);
          }
          Confetti.burst(1500);
        } else Toast.show("No se puede usar ahora", "No hay nadie que pueda ocupar ese sitio");
        finish();
      }),
    );
    $("#keep").addEventListener("click", finish);
  }

  // T6: la moneda. Cara: las salvadas votan a quién salvar. Cruz: a quién condenar.
  function coinFlip({ winner, bottomRows }, then) {
    setSet("panel");
    const three = bottomRows.map((r) => r.q);
    const cara = Math.random() < 0.5;
    const voters = [S.queen, ...S.rivals].filter((q) => !three.includes(q));
    const meVoter = voters.includes(S.queen);
    const scoreOf = (q) => (bottomRows.find((r) => r.q === q) || {}).s || 0;
    body().innerHTML = `
      <div class="story-card">
        <p class="eyebrow">🪙 La moneda</p>
        <h3>Supremme lanza la moneda al aire...</h3>
        <div class="coin-wrap"><div class="coin ${cara ? "cara" : "cruz"}"><b>CARA</b><b>CRUZ</b></div></div>
        <p class="coin-res">¡Ha salido <b>${cara ? "CARA" : "CRUZ"}</b>!</p>
        <p>${cara ? "Las compañeras salvadas votan a la cara a qué reina del bottom quieren <b>SALVAR</b>." : "Las compañeras salvadas votan a la cara a qué reina del bottom quieren <b>CONDENAR</b> al lip sync."}</p>
        <div class="vs three">${three.map((q) => `<img src="${photo(q)}" title="${esc(q.name)}">`).join("")}</div>
        <button class="btn btn-primary" id="story-next">${meVoter ? "Votar" : "Ver la votación"}</button>
      </div>`;
    Music.play("tension");
    const tally = (myVote) => {
      const votes = new Map(three.map((q) => [q, []]));
      voters.forEach((v) => {
        let choice;
        if (v === S.queen) choice = myVote;
        else {
          // Cada rival vota según cómo le caen (y a ti según vuestra relación)
          const bias = (ROLES_HISTORIA[S.roles[v.id]] || {}).voto || 0;
          const score = (q) => (q === S.queen ? relOf(v) * 1.5 + bias : rnd(-1.5, 1.5)) + groupAff(v, q) + rnd(-1, 1);
          const sorted = three.slice().sort((a, b) => score(b) - score(a));
          choice = cara ? sorted[0] : sorted[sorted.length - 1];
        }
        votes.get(choice).push(v);
      });
      // ¿Empate? Desempata la ganadora de la semana
      const maxV = Math.max(...three.map((q) => votes.get(q).length));
      const tied = three.filter((q) => votes.get(q).length === maxV);
      if (tied.length === 1) return resolve(tied[0], "");
      const dec = winner.q;
      const tieNote = (c) => `<p class="twist-note">⚖️ Empate a ${maxV} voto${maxV === 1 ? "" : "s"} entre ${tied.map((q) => `<b>${esc(q === S.queen ? "ti" : q.name)}</b>`).join(" y ")}. ${winner.me ? "Como ganadora de la semana, has desempatado tú" : `Desempata la ganadora de la semana, <b>${esc(dec.name)}</b>`}: ${cara ? "salva a" : "condena a"} <b>${esc(c === S.queen ? "ti" : c.name)}</b>.</p>`;
      if (winner.me) {
        body().innerHTML = `
          <div class="story-card">
            <p class="eyebrow">⚖️ ¡Empate a ${maxV} voto${maxV === 1 ? "" : "s"}!</p>
            <h3>Eres la ganadora de la semana: desempatas tú</h3>
            <p>${cara ? "¿A quién <b>SALVAS</b>?" : "¿A quién <b>CONDENAS</b> al lip sync?"} Tu decisión es pública.</p>
            <div class="hub-grid">${tied
              .map((q, i) => `<button class="hub-q ${relOf(q) >= 2 ? "ally" : relOf(q) <= -2 ? "enemy" : ""}" style="--i:${i}" data-id="${q.id}"><i style="background-image:url('${photo(q)}')"></i><span>${esc(q.name)}</span><small>${relLabel(q)}</small><small class="score-note">${votes.get(q).length} votos</small></button>`)
              .join("")}</div>
            ${trackBtn()}
          </div>`;
        bindTrack();
        body().querySelectorAll("[data-id]").forEach((bt) => bt.addEventListener("click", () => {
          const c = qById(bt.dataset.id);
          changeRel(c, cara ? 2 : -2);
          const worst = three.slice().sort((x, y) => scoreOf(x) - scoreOf(y))[0];
          remember(c, cara ? "salvada" : "condenada", cara ? c !== worst : c === worst);
          resolve(c, tieNote(c));
        }));
        return;
      }
      const pref = (q) => (q === S.queen ? relOf(dec) * 1.5 : rnd(-1.5, 1.5)) + groupAff(dec, q) + rnd(-0.8, 0.8);
      const sortedT = tied.slice().sort((x, y) => pref(y) - pref(x));
      const c = cara ? sortedT[0] : sortedT[sortedT.length - 1];
      if (c === S.queen) changeRel(dec, cara ? 1 : -1);
      resolve(c, tieNote(c));
      function resolve(chosen, tieNote) {
      let pair;
      if (cara) pair = three.filter((q) => q !== chosen);
      else pair = [chosen, three.filter((q) => q !== chosen).sort((a, b) => scoreOf(a) - scoreOf(b))[0]];
      // Votar a la cara tiene consecuencias
      if (meVoter && myVote !== S.queen) {
        changeRel(myVote, cara ? 2 : -2);
        // ¿Era la peor de las tres? Se acordará
        const worst = three.slice().sort((a, b) => scoreOf(a) - scoreOf(b))[0];
        remember(myVote, cara ? "salvada" : "condenada", cara ? myVote !== worst : myVote === worst);
      }
      if (three.includes(S.queen)) voters.forEach((v) => votes.get(S.queen).includes(v) && v !== S.queen && (cara ? changeRel(v, 1) : changeRel(v, -1)));
      body().innerHTML = `
        <div class="story-card">
          <p class="eyebrow">🪙 ${cara ? "Cara: votos para salvar" : "Cruz: votos para condenar"}</p>
          <h3>${cara ? `${esc(chosen === S.queen ? "¡Te salvan a ti!" : chosen.name + " se salva")}` : `${esc(chosen === S.queen ? "Te condenan a ti al lip sync" : chosen.name + " va directa al lip sync")}`}</h3>
          ${tieNote}
          <div class="votes">${three
            .map((q) => `<div class="vote-col ${q === chosen ? "top" : ""}"><i style="background-image:url('${photo(q)}')"></i><b>${esc(q === S.queen ? "Tú" : q.name)}</b><span>${votes.get(q).length} voto${votes.get(q).length === 1 ? "" : "s"}</span><div class="voters">${votes
              .get(q)
              .map((v) => `<img src="${photo(v)}" title="${esc(v.name)}">`)
              .join("")}</div></div>`)
            .join("")}</div>
          <p>Al lip sync: <b>${pair.map((q) => esc(q === S.queen ? "tú" : q.name)).join("</b> y <b>")}</b>.</p>
          <button class="btn btn-primary" id="story-next">Continuar</button>
        </div>`;
      $("#story-next").addEventListener("click", () => then(pair.map((q) => bottomRows.find((r) => r.q === q))));
      }
    };
    $("#story-next").addEventListener("click", () => {
      if (!meVoter) return tally(null);
      body().innerHTML = `
        <div class="story-card">
          <p class="eyebrow">🪙 ${cara ? "Cara" : "Cruz"} · tu voto es público</p>
          <h3>${cara ? "¿A quién SALVAS?" : "¿A quién CONDENAS al lip sync?"}</h3>
          <p class="muted">Todas verán lo que votas.</p>
          <div class="hub-grid">${three
            .map((q, i) => `<button class="hub-q ${relOf(q) >= 2 ? "ally" : relOf(q) <= -2 ? "enemy" : ""}" style="--i:${i}" data-id="${q.id}"><i style="background-image:url('${photo(q)}')"></i><span>${esc(q.name)}</span><small>${relLabel(q)}</small><small class="score-note"></small></button>`)
            .join("")}</div>
          ${trackBtn()}
        </div>`;
      bindTrack();
      body().querySelectorAll("[data-id]").forEach((b) => b.addEventListener("click", () => tally(qById(b.dataset.id))));
    });
  }

  // T4: al empezar, cada reina elige una cajita. Una esconde a la reina de la suerte
  function pickLuckBox(then) {
    const all = [S.queen, ...S.rivals];
    const winnerIdx = Math.floor(Math.random() * all.length);
    body().innerHTML = `
      <div class="story-card">
        <p class="eyebrow">🍀 La reina de la suerte</p>
        <h3>Elige tu cajita</h3>
        <p>En una de ellas está la reina de la suerte: podrás usarla una vez para salvarte, o salvar a una compañera, del lip sync.</p>
        <div class="boxes">${all.map((_, i) => `<button class="box" data-b="${i}" style="--i:${i}">🎁</button>`).join("")}</div>
      </div>`;
    body().querySelectorAll("[data-b]").forEach((b) =>
      b.addEventListener("click", () => {
        const mine = +b.dataset.b;
        // Las demás cogen las cajas que quedan
        const others = shuffle(S.rivals);
        let k = 0;
        const owner = all.map((_, i) => (i === mine ? S.queen : others[k++]));
        const lucky = owner[winnerIdx];
        S.luck = keyOf(lucky);
        // Es secreto: solo ves lo que hay en TU caja
        body().querySelectorAll(".box").forEach((x, i) => {
          x.disabled = true;
          if (i === mine) {
            x.classList.add("open", "mine");
            x.innerHTML = i === winnerIdx ? "🍀" : "✖";
          } else x.classList.add("closed");
        });
        setTimeout(() => {
          header();
          Toast.show(lucky === S.queen ? "🍀 ¡Te ha tocado a TI!" : "✖ Tu caja está vacía", lucky === S.queen ? "Nadie lo sabe. Guárdala para el momento justo" : "Alguna compañera la tiene... pero nadie dice quién");
          then();
        }, 1600);
      }),
    );
  }

  // T5: cada eliminada deja medio corazón a una compañera
  function legacyHeart(gone, then) {
    if (twistOf() !== "corazon" || !S.rivals.length) return then && then();
    const cands = S.meOut ? S.rivals : [S.queen, ...S.rivals];
    const toMe = !S.meOut && Math.random() < 0.15 + 0.25 * Math.max(0, relOf(gone) + 1);
    const to = toMe ? S.queen : pick1(S.rivals);
    (S.pendingHearts = S.pendingHearts || []).push({ from: gone.id, to: keyOf(to) });
    Toast.show(`💔 ${gone.name} deja su medio corazón a alguien`, "Lo sabréis la semana que viene...");
    if (then) then();
  }

  // Untucked: eliges a quién te acercas
  function untucked(res, then) {
    flowGo("untucked");
    setSet("lounge");
    if (S.rivals.length < 2) return then();
    const opts = [];
    const add = (q, kind, label) => q && q !== S.queen && S.rivals.includes(q) && !opts.some((o) => o.q === q) && opts.push({ q, kind, label });
    if (res.savedBy) add(res.savedBy, "gracias", "🙏 Darle las gracias por salvarte");
    if (res.pre) {
      // Antes del veredicto nadie sabe nada: te acercas a quien quieras a comentar las críticas
      // Lo que se habla depende de las críticas que ha escuchado cada una (eso sí lo saben todas)
      const tone = (q) => { const r = res.labOf && [...res.labOf.keys()].find((x) => x.q === q); const l = r ? res.labOf.get(r) : ""; return /WIN|TOP2|HIGH/.test(l) ? "ganadoraPre" : /BTM|LOW/.test(l) ? "bottomPre" : "charlaPre"; };
      shuffle(S.rivals).slice(0, 2).forEach((q) => add(q, tone(q), "💬 Comentar las críticas"));
    } else {
      if (!res.winner.me) add(res.winner.q, "ganadora", "👑 Felicitar a la ganadora");
      res.bottomRows.filter((r) => !r.me).forEach((r) => add(r.q, "bottom", "🫂 Animar a una del bottom"));
    }
    const ally = allies()[0];
    if (ally) add(ally, "aliada", "💞 Hablar con tu aliada");
    const nq = nemActive();
    if (nq) add(nq, "nemesis", `💬 ${nq.name} quiere hablar contigo`);
    body().innerHTML = `
      <div class="story-card">
        <p class="eyebrow">Untucked</p>
        <h3>Mientras el jurado delibera...</h3>
        <div class="hub-grid">${opts
          .map((o, i) => `<button class="hub-q ${o.kind === "enemiga" ? "enemy" : o.kind === "aliada" ? "ally" : ""}" style="--i:${i}" data-i="${i}"><i style="background-image:url('${photo(o.q)}')"></i><span>${esc(o.q.name)}</span><small>${o.label}</small>${roleChip(o.q)}</button>`)
          .join("")}</div>
        ${IA.ready() ? `<p class="muted">o habla libremente con cualquiera:</p><div class="ut-free">${S.rivals.map((q) => `<button class="ut-face" data-f="${q.id}" title="${esc(q.name)}"><i style="background-image:url('${photo(q)}')"></i><span>${esc(q.name)}</span></button>`).join("")}</div>` : ""}
        ${IA.ready() && S.rivals.length >= 2 ? `<button class="btn btn-primary" id="ut-group">💬 Sentarte con todas en el sofá</button>` : ""}
        <div class="row"><button class="btn btn-ghost" id="ut-skip">🍸 Tomarme algo sola</button><button class="btn btn-ghost" id="ut-spy">🔎 Observar a las demás</button></div>
      </div>`;
    body().querySelectorAll("[data-i]").forEach((b) =>
      b.addEventListener("click", () => {
        const o = opts[+b.dataset.i];
        const ctx = ctxWith(o.q);
        if (o.kind === "nemesis") {
          const meB = res.bottomRows.some((r) => r.me), herB = res.bottomRows.some((r) => r.q === o.q);
          const kb = meB && !herB ? "gloat" : res.winner.me ? "envidia" : "tension";
          const k = res.pre && kb !== "tension" ? kb + "Pre" : kb;
          return scene("untucked", NEMESIS.untucked[k] || NEMESIS.untucked.tension, { ...ctx, q: { r1: o.q }, r1: o.q.name, tension: true }, then, nemChoices());
        }
        if (o.kind === "gracias") {
          return scene("untucked", pickFresh(GRACIAS_CORAZON), { ...ctx, q: { r1: o.q }, r1: o.q.name }, then, [
            { txt: "Te debo una muy grande. Cuenta conmigo para lo que sea.", rel: { r1: 1 }, reply: ["r1", "Pues lo apunto, eh. Que tengo buena memoria."] },
            { txt: "¿Por qué yo? No lo entiendo...", reply: ["r1", "Porque creo en ti. Y porque quería ver tu cara. Ha merecido la pena."] },
          ]);
        }
        const rr = roleOf(o.q);
        if (rr && Math.random() < 0.5) {
          reveal(o.q);
          const base = o.kind === "enemiga" ? HISTORIA.untucked.enemiga[0] : pickFresh(HISTORIA.untucked[res.pre && HISTORIA.untucked[o.kind + "Pre"] ? o.kind + "Pre" : o.kind]);
          const lines = [["r1", pick1(rr.untucked)], ...base];
          if (o.kind === "enemiga") return scene("untucked", lines, ctx, then, HISTORIA.untucked.enemigaChoices);
          return scene("untucked", lines, ctx, () => {
            changeRel(o.q, (o.kind === "bottom" ? 2 : 1) + (S.roles[o.q.id] === "graciosa" ? 1 : 0));
            then();
          });
        }
        if (o.kind === "enemiga") return scene("untucked", HISTORIA.untucked.enemiga[0], ctx, then, HISTORIA.untucked.enemigaChoices);
        scene("untucked", pickFresh(HISTORIA.untucked[res.pre && HISTORIA.untucked[o.kind + "Pre"] ? o.kind + "Pre" : o.kind]), ctx, () => {
          changeRel(o.q, o.kind === "bottom" ? 2 : 1);
          then();
        });
      }),
    );
    body().querySelectorAll("[data-f]").forEach((b) => b.addEventListener("click", () => freeTalk(qById(b.dataset.f), then, "Untucked")));
    $("#ut-skip").addEventListener("click", () => { persona("focus"); then(); });
    const utg = $("#ut-group");
    if (utg) utg.addEventListener("click", () => groupTalk(S.rivals.slice(), then, "el Untucked, mientras el jurado delibera. Acaban de escuchar las críticas"));
    $("#ut-spy").addEventListener("click", () => {
      const cand = shuffle(S.rivals).map((q) => [q, ["deb", "fort", "car"].find((x) => !Nem.knows(q.id, x))]).find(([, sl]) => sl);
      if (cand) learnTrait(cand[0], cand[1], "Observando en el Untucked");
      else Toast.show("🔎 Nada nuevo", "Ya las tienes caladas a todas");
      then();
    });
  }

  // Quién se va esta semana
  function elimination({ winner, bottomRows, top2, rows }) {
    setSet("stage");
    const meBottom = bottomRows.some((r) => r.me);
    const others = bottomRows.filter((r) => !r.me).map((r) => r.q);
    if (twistOf() === "allstars") return topLipSync(top2, (dec) => allStarsDecision(dec, bottomRows));
    if (twistOf() === "winners") return topLipSync(top2, (dec) => winnersStar(dec, top2));
    // Segunda Oportunidrag: con siete reinas se van dos de golpe... y vuelve una por sorpresa
    if (repescaNow()) return tripleLipSync(bottomRows, winner, rows);
    if (meBottom) return lipSync(others[0], false);
    const [a, b] = others;
    // Doble sashay (muy raro)
    if (!S.flags.dsashay && twistOf() !== "repesca" && S.rivals.length >= 7 && Math.random() < 0.08) {
      S.flags.dsashay = true;
      eliminate(a);
      eliminate(b);
      header();
      body().innerHTML = `
        <div class="story-card">
          <p class="eyebrow">¡Momento histórico!</p>
          <h3>Doble sashay away</h3>
          <div class="vs"><img class="gone" src="${photo(a)}"><span>✖</span><img class="gone" src="${photo(b)}"></div>
          <p>Ninguna ha convencido. <b>${esc(a.name)}</b> y <b>${esc(b.name)}</b> se van las dos a casa.</p>
          <button class="btn btn-primary" id="story-next">Siguiente episodio</button>
        </div>`;
      return endEpisodeBtn();
    }
    const pa = clamp(0.5 + (skillOf(a) + (S.form[a.id] || 0) - skillOf(b) - (S.form[b.id] || 0)) / 40, 0.2, 0.8);
    const [stay, go] = Math.random() < pa ? [a, b] : [b, a];
    nemEvent("elim", stay, go);
    eliminate(go);
    header();
    body().innerHTML = `
      <div class="story-card">
        <p class="eyebrow">Lip sync for your life</p>
        <h3>${esc(stay.name)} vs ${esc(go.name)}</h3>
        <p class="muted">${esc(fill(pickFresh(HISTORIA.lipsyncOtras), { a: stay.name, b: go.name }))}</p>
        <div class="vs"><img src="${photo(stay)}"><span>VS</span><img class="gone" src="${photo(go)}"></div>
        <p><b>${esc(stay.name)}</b>, shantay you stay. <b>${esc(go.name)}</b>, sashay away.</p>
        <button class="btn btn-primary" id="story-next">Siguiente episodio</button>
      </div>`;
    endEpisodeBtn();
  }

  // All Stars: las dos del top hacen lip sync; la ganadora elige a quién mandar a casa
  const winLab = (q) => (twistOf() === "winners" && S.block && S.block.ep === S.ep && S.block.id === keyOf(q) ? "BWIN" : "WIN");
  function topLipSync(top2, then) {
    flowGo("lipsync");
    const [a, b] = top2;
    const meTop = top2.find((r) => r.me);
    if (meTop) {
      const rival = top2.find((r) => !r.me).q;
      body().innerHTML = `
        <div class="story-card">
          <p class="eyebrow">💄 Lip sync por el poder</p>
          <h3>${esc(S.queen.name)} vs ${esc(rival.name)}</h3>
          <div class="vs"><img src="${photo(S.queen)}"><span>VS</span><img src="${photo(rival)}"></div>
          <p>${twistOf() === "winners" ? "Las dos os lleváis una estrella ⭐ (si no estáis bloqueadas). La que gane, además, bloquea a una compañera para la semana que viene. Las 4 con más estrellas se juegan la corona." : "La que gane decide quién de las dos del bottom se va a casa."}</p>
          <button class="btn btn-primary" id="story-ls">¡A la pasarela!</button>
        </div>`;
      Music.play("tension");
      $("#story-ls").addEventListener("click", () =>
        Curtain.run(() => {
          Music.stop();
          lsGame(rival, (res) => {
            UI.show("story");
            header();
            S.points += Math.round(res.score || 0);
            if (res.won) {
              S.lipsyncs++;
              S.points += 1000;
              if (S.lipsyncs >= 3) Achievements.unlock("superviviente");
              Toast.show("💄 ¡Has ganado el lip sync!", "Tienes el poder de decidir");
              mark(S.queen, winLab(S.queen));
              meWonReto();
              if (S.rivals.length + 1 === 5 && twistOf() !== "winners") S.flags.pase = "me";
              S.wins++;
              earn(300, "Ganas el reto de la semana");
              return then({ q: S.queen, me: true });
            }
            Toast.show(`💄 ${rival.name} gana el lip sync`, "Ella decide");
            mark(rival, winLab(rival));
            if (S.rivals.length + 1 === 5 && twistOf() !== "winners") S.flags.pase = rival.id;
            then({ q: rival });
          });
        }, "LIP SYNC POR EL PODER"),
      );
      return;
    }
    const pa = clamp(0.5 + (skillOf(a.q) + (S.form[a.q.id] || 0) - skillOf(b.q) - (S.form[b.q.id] || 0)) / 40, 0.25, 0.75);
    const [w, l] = Math.random() < pa ? [a.q, b.q] : [b.q, a.q];
    header();
    body().innerHTML = `
      <div class="story-card">
        <p class="eyebrow">💄 Lip sync por el poder</p>
        <h3>${esc(w.name)} vs ${esc(l.name)}</h3>
        <p class="muted">${esc(fill(pickFresh(HISTORIA.lipsyncOtras), { a: w.name, b: l.name }))}</p>
        <div class="vs"><img src="${photo(w)}"><span>👑</span><img src="${photo(l)}"></div>
        <p><b>${esc(w.name)}</b> ${twistOf() === "winners" ? "gana el lip sync y el bloqueo. Las dos se llevan estrella ⭐ (si no están bloqueadas)." : "gana y tiene el pintalabios: decide quién se va."}</p>
        <button class="btn btn-primary" id="story-next">Continuar</button>
      </div>`;
    mark(w, winLab(w));
    $("#story-next").addEventListener("click", () => then({ q: w }));
  }

  // All Stars: la ganadora del lip sync del top decide quién se va
  // Logros de retos ganados y bottoms (los bottoms de cada reina se recuerdan entre temporadas)
  const BTM_KEY = "dftc-bottoms-retos";
  function meInBottom() {
    S.flags.lastBtmEp = S.ep;
    const d = store.get(BTM_KEY, {}) || {};
    const L = d[S.queen.id] || [];
    if (S.curTipo && !L.includes(S.curTipo)) d[S.queen.id] = [...L, S.curTipo];
    store.set(BTM_KEY, d);
  }
  function meWonReto() {
    if (S.flags.lastBtmEp === S.ep - 1) Achievements.unlock("remontada");
    if (S.curTipo === "snatch") Achievements.unlock("snatch");
    const fr = S.season.franchise && (S.season.franchise.id || S.season.franchise);
    if (fr === "esas" && ((store.get(BTM_KEY, {}) || {})[S.queen.id] || []).includes(S.curTipo)) {
      Achievements.unlock("rudencion");
      Toast.show("🔁 Ru-dención", `Antes acabaste en el bottom en ${EP_SHORT[S.curTipo] || "este reto"}... y ahora lo ganas`);
    }
  }
  // All Stars: la ganadora elige a quién manda a casa. No es solo quién lo hizo peor ese día:
  // - "semana": se va la peor de la semana (justo)
  // - "trayectoria": se va la de peor temporada aunque esta semana lo hiciera mejor; no castigas un mal día (justo)
  // - "jugarreta": se va la que lo hizo mejor esta semana Y tiene mejor (o igual) temporada: quitarse a una rival fuerte
  const asPPE = (q) => DFTC.ppe(Object.values(S.track[keyOf(q)] || {}));
  const asStrength = (q) => { const v = Object.values(S.track[keyOf(q)] || {}); return asPPE(q) * 2 + v.filter((l) => l === "WIN" || l === "TOP2").length; };
  const PPE_MARGEN = 0.25;
  const asKind = (go, stay, sOf) => (sOf(go) <= sOf(stay) ? "semana" : asPPE(go) < asPPE(stay) - PPE_MARGEN ? "trayectoria" : "jugarreta");
  const ppeTxt = (q) => asPPE(q).toFixed(2).replace(".", ",");
  // Reacciones del taller a la decisión (con IA si está disponible)
  async function asReactions(dec, go, stay, kind) {
    const fair = kind !== "jugarreta";
    const witnesses = shuffle(S.rivals.filter((q) => q !== dec && q !== stay && q !== go)).slice(0, 2);
    const decN = dec === S.queen ? S.queen.name : dec.name;
    const fallback = kind === "trayectoria"
      ? [["r1", pick1([`Ha mirado toda la temporada, no solo un día. ${stay.name} ha tenido una semana mala, nada más.`, `${go.name} lo hizo mejor hoy, vale, pero ${stay.name} lleva toda la competición dándolo todo.`, "No ha castigado un mal día. Eso también es ser justa."])], ["r2", pick1(["Ya... pero a mí me habría dolido estar en el lugar de " + go.name + ".", "Es un criterio. Discutible, pero es un criterio.", "Pues yo habría mirado solo esta semana. Aunque lo entiendo."])]]
      : fair
      ? [["r1", pick1([`Lo justo es lo justo: ${go.name} lo hizo peor esta semana.`, "Decisión limpia. Nadie puede decir nada.", "Ha mandado a casa a la que tocaba. Sin dramas."])], ["r2", pick1(["Ya, pero ojo, que ahora la que se ha quedado viene con ganas.", "Bien hecho. Aunque yo no sé si habría tenido tanta ética.", "Eso es jugar limpio."])]]
      : [["r1", pick1([`¡¿Perdona?! ¿${go.name} a casa? ¡Pero si lo hizo mejor que ${stay.name}!`, "Eso no ha sido justicia, eso ha sido estrategia pura y dura.", `Se ha quitado de en medio a ${go.name} porque le daba miedo. Así de claro.`])], ["r2", pick1(["Jugarreta de manual. Apuntado queda.", "Pues a partir de ahora, cuidado con ella: no juega limpio.", "Bueno... es un All Stars. Aquí se viene a ganar."])]];
    let lines = fallback;
    if (IA.ready() && witnesses.length) {
      aiWait("El taller comenta la decisión...");
      const r = await IA.chat(
        `Escribes reacciones de concursantes de un All Stars de Drag Race España en el taller, justo después de una eliminación. Cada reina habla SOLO como ella misma, con su carácter. ${aiSeason()}`,
        `${decN} ganó el reto y tenía que elegir a quién mandaba a casa entre las dos del bottom. Ha elegido eliminar a ${go.name} y salvar a ${stay.name}. ${kind === "semana" ? `${go.name} fue la que peor lo hizo esta semana: decisión justa.` : kind === "trayectoria" ? `Esta semana ${go.name} lo hizo algo mejor, pero ${stay.name} lleva mucha mejor temporada (PPE ${ppeTxt(stay)} frente a ${ppeTxt(go)}): ha valorado la trayectoria y no ha castigado un mal día. Es defendible, no es una jugarreta, aunque alguna pueda discutirlo.` : `${go.name} lo hizo MEJOR que ${stay.name} esta semana y además lleva igual o mejor temporada: ha sido una jugarreta estratégica para quitarse competencia.`}
Reinas que comentan: ${witnesses.map((q) => `${q.name} (${idTxt(q) || aiProfile(q)})`).join(" | ")}. Escribe 2 o 3 líneas (máximo 22 palabras cada una), reaccionando a la decisión${dec === S.queen ? ` delante de ${S.queen.name}` : ""}. Que se note si les parece justo, defendible o una jugarreta.
Devuelve JSON {"lineas":[{"reina":"nombre","t":"..."}]}`,
        { json: true, max: 400, temp: 1, timeout: 15000 },
      ).catch(() => null);
      const L = r && Array.isArray(r.lineas) ? r.lineas.filter((x) => x && witnesses.some((q) => q.name === str(x.reina)) && str(x.t).trim()).slice(0, 3) : [];
      if (L.length) lines = L.map((x) => { const q = witnesses.find((w) => w.name === str(x.reina)); return [q === witnesses[0] ? "r1" : "r2", IA.clean(str(x.t))]; });
    }
    return { lines, ctx: { ...ctxWith(witnesses[0] || pick1(S.rivals), { r2: witnesses[1] || witnesses[0] }), q: { r1: witnesses[0], r2: witnesses[1] || witnesses[0] }, tension: !fair } };
  }
  function allStarsDecision(winner, bottomRows) {
    const pair = bottomRows.map((r) => r.q);
    const sOf = (q) => (bottomRows.find((r) => r.q === q) || {}).s || 0;
    const worst = sOf(pair[0]) <= sOf(pair[1]) ? pair[0] : pair[1];
    const strong = asStrength(pair[0]) >= asStrength(pair[1]) ? pair[0] : pair[1];
    const bestPPE = asPPE(pair[0]) >= asPPE(pair[1]) ? pair[0] : pair[1];
    if (winner.me) {
      const tags = (q) => [q === worst ? `<em class="as-tag worst">📉 La peor esta semana</em>` : `<em class="as-tag ok">Mejor esta semana</em>`, `<em class="as-tag ${q === bestPPE ? "ok" : "worst"}">📈 Temporada: PPE ${ppeTxt(q)}</em>`, q === strong && strong !== worst ? `<em class="as-tag strong">⚠️ Rival fuerte</em>` : ""].join("");
      body().innerHTML = `
        <div class="story-card">
          <p class="eyebrow">💄 Has ganado: tú decides</p>
          <h3>¿A quién mandas a casa?</h3>
          <p>Puedes mirar solo esta semana, tener en cuenta toda su temporada (y no castigar a nadie por un mal día)... o hacer la jugarreta y quitarte de en medio a una rival fuerte. El taller lo va a comentar.</p>
          <div class="hub-grid two">${pair
            .map((q, i) => `<button class="hub-q ${relOf(q) >= 2 ? "ally" : relOf(q) <= -2 ? "enemy" : ""}" style="--i:${i}" data-id="${q.id}"><i style="background-image:url('${photo(q)}')"></i><span>${esc(q.name)}</span><small>${relLabel(q)}</small>${tags(q)}</button>`)
            .join("")}</div>
          ${trackBtn()}
        </div>`;
      bindTrack();
      body().querySelectorAll("[data-id]").forEach((b) =>
        b.addEventListener("click", () => {
          const go = qById(b.dataset.id), stay = pair.find((x) => x !== go);
          changeRel(stay, 2);
          S.rivals.filter((r) => relOf(r) >= 1 && Math.random() < 0.4 && r !== stay).slice(0, 1).forEach((r) => changeRel(r, -1));
          const kind = asKind(go, stay, sOf);
          const goWasWorst = kind !== "jugarreta";
          remember(stay, "salvada", kind !== "semana");
          nemEvent("vote", S.queen, go);
          nemEvent("save", S.queen, stay);
          eliminate(go);
          // Jugarreta: el taller lo nota (fama de mala y alguna se enfría contigo)
          if (!goWasWorst) Achievements.unlock("villana-as");
          else { S.flags.fairAS = (S.flags.fairAS || 0) + 1; if (S.flags.fairAS >= 3) Achievements.unlock("juez-justa"); }
          if (!goWasWorst) { persona("mean", 1); S.rivals.filter((r) => r !== stay && Math.random() < 0.35).slice(0, 2).forEach((r) => changeRel(r, -1)); }
          else persona("kind", 0.5);
          logEv(kind === "semana" ? `${S.queen.name} gana y manda a casa a ${go.name}, la peor de la semana: decisión justa` : kind === "trayectoria" ? `${S.queen.name} gana y manda a casa a ${go.name}: esta semana lo hizo algo mejor que ${stay.name}, pero ${stay.name} lleva mejor temporada. Valora la trayectoria y no castiga un mal día` : `${S.queen.name} gana y hace la jugarreta: manda a casa a ${go.name}, que lo hizo mejor que ${stay.name} y lleva igual o mejor temporada, para quitarse una rival fuerte`);
          return dialog(pickFresh(goWasWorst ? MEMORIA.despedida.justa : MEMORIA.despedida.injusta), { ...ctxWith(go), q: { r1: go }, r1: go.name, tension: true }, () =>
            asReactions(S.queen, go, stay, kind).then(({ lines, ctx }) => dialog(lines, ctx, () => showASResult(go, stay, kind))));
        }),
      );
      return;
      function showASResult(go, stay, kind) {
          header();
          body().innerHTML = `
            <div class="story-card">
              <p class="eyebrow">El pintalabios ha hablado</p>
              <h3>${esc(go.name)}, sashay away</h3>
              <div class="vs"><img src="${photo(stay)}"><span>💄</span><img class="gone" src="${photo(go)}"></div>
              <p>Has salvado a <b>${esc(stay.name)}</b>.</p>
              ${kind === "trayectoria" ? `<p class="muted">Has mirado toda la temporada: ${esc(stay.name)} (PPE ${ppeTxt(stay)}) iba mejor que ${esc(go.name)} (PPE ${ppeTxt(go)}).</p>` : kind === "jugarreta" ? `<p class="twist-note">😈 Jugarreta: ${esc(go.name)} lo hizo mejor esta semana y lleva igual o mejor temporada.</p>` : ""}
              <button class="btn btn-primary" id="story-next">Siguiente episodio</button>
            </div>`;
          endEpisodeBtn();
      }
    }
    const dec = winner.q;
    const meIn = pair.includes(S.queen);
    let go;
    if (meIn) {
      const other = pair.find((x) => x !== S.queen);
      const likeMe = relOf(dec) + groupAff(dec, S.queen) + rnd(-1, 1), likeOther = groupAff(dec, other) + rnd(-1.5, 1.5);
      go = likeMe >= likeOther ? other : S.queen;
      if (S.pacts && S.pacts[dec.id]) go = traitsOf(dec).car === "traicionera" && Math.random() < 0.4 ? S.queen : other;
    } else {
      // Cada una mira la semana y la temporada con su propio peso; las ambiciosas y traicioneras tiran más de estrategia
      const car = traitsOf(dec).car;
      const wT = 4 + Math.random() * 8; // cuánto pesa la trayectoria (puntos de nota por punto de PPE)
      const merit = (q) => sOf(q) + asPPE(q) * wT;
      const deserved = merit(pair[0]) <= merit(pair[1]) ? pair[0] : pair[1];
      const schemer = Math.random() < (car === "ambiciosa" || car === "traicionera" ? 0.45 : car === "leal" ? 0.1 : 0.22);
      go = schemer && strong !== deserved ? strong : deserved;
      if (Math.abs(groupAff(dec, pair[0]) - groupAff(dec, pair[1])) >= 2) go = groupAff(dec, pair[0]) > groupAff(dec, pair[1]) ? pair[1] : pair[0];
    }
    const stay = pair.find((x) => x !== go);
    const kind = asKind(go, stay, sOf);
    const fair = kind !== "jugarreta";
    const goN = go === S.queen ? S.queen.name : go.name, stayN = stay === S.queen ? S.queen.name : stay.name;
    const lines = [["r1", meIn
      ? go === S.queen
        ? kind === "semana" ? "Lo siento, {yo}... Esta semana lo hiciste peor. Es lo justo." : kind === "trayectoria" ? `Lo siento, {yo}. Hoy has estado mejor, pero ${stayN} lleva mejor temporada y no la voy a castigar por un mal día.` : "Lo siento, {yo}. Eres de las más fuertes y no puedo arriesgarme."
        : kind === "trayectoria" ? "{yo}, esta semana no ha sido la tuya, pero llevas una temporada muy buena. Me quedo contigo." : "{yo}, esta semana me quedo contigo. No me falles."
      : kind === "semana" ? "He mandado a casa a la que peor lo ha hecho. Es lo justo." : kind === "trayectoria" ? "He mirado toda la temporada, no solo hoy. Un mal día lo tiene cualquiera." : "No es nada personal... es estrategia."]];
    logEv(kind === "semana" ? `${dec.name} gana y manda a casa a ${goN}, la peor de la semana: decisión justa` : kind === "trayectoria" ? `${dec.name} gana y manda a casa a ${goN}: hoy lo hizo algo mejor, pero ${stayN} lleva mejor temporada. Valora la trayectoria y no castiga un mal día` : `${dec.name} gana y hace la jugarreta: manda a casa a ${goN}, que lo hizo mejor y lleva igual o mejor temporada, para quitarse una rival fuerte`);
    dialog(lines, { ...ctxWith(dec), tension: true }, () => {
      nemEvent("vote", dec, go);
      if (go === S.queen && S.pacts && S.pacts[dec.id]) { delete S.pacts[dec.id]; nemEvent("betray", dec, S.queen); }
      if (go === S.queen) {
        if (twistOf() === "repesca" && !S.flags.repesca) return goHomeRepesca(dec);
        return aftermath(dec, "La ganadora del reto ha decidido que te vas.");
      }
      if (meIn) changeRel(dec, 1);
      eliminate(go);
      asReactions(dec, go, stay, kind).then(({ lines: rl, ctx: rctx }) => dialog(rl, rctx, () => {
        header();
        body().innerHTML = `
          <div class="story-card">
            <p class="eyebrow">${esc(dec.name)} ha decidido</p>
            <h3>${esc(go.name)}, sashay away</h3>
            <div class="vs"><img src="${photo(stay)}"><span>💄</span><img class="gone" src="${photo(go)}"></div>
            <p class="${fair ? "muted" : "twist-note"}">${kind === "semana" ? "Ha mandado a casa a la peor de la semana." : kind === "trayectoria" ? `Ha mirado toda la temporada: ${esc(stay.name)} (PPE ${ppeTxt(stay)}) iba mejor que ${esc(go.name)} (PPE ${ppeTxt(go)}).` : `😈 Jugarreta: ${esc(go.name)} lo hizo mejor esta semana y lleva igual o mejor temporada.`}</p>
            <button class="btn btn-primary" id="story-next">Siguiente episodio</button>
          </div>`;
        endEpisodeBtn();
      }));
    });
  }

  function eliminate(q) {
    if (S.luck && S.luck === q.id) {
      S.luck = null;
      Toast.show(`🍀 ${q.name} tenía la reina de la suerte`, "¡Y se va a casa sin usarla!");
    }
    if (S.groups) S.groups.forEach((g) => (g.members = g.members.filter((id) => id !== q.id)));
    if (S.track[q.id] && S.track[q.id][S.ep] && S.epNames[S.ep] !== "Final") mark(q, "ELIM");
    S.rivals = S.rivals.filter((r) => r !== q);
    S.out.unshift(q);
    logEv(`${q.name} es eliminada`);
    if (isNem(q)) {
      S.nemesis.done = "fuera";
      S.nemesis.ep = S.ep;
      if (!S.meOut) Toast.show(`⚔️ ${q.name} se va a casa`, "Tu némesis está fuera... por ahora");
    }
    legacyHeart(q);
  }

  function lipSync(rival, forCrown, onWin) {
    body().innerHTML = `
      <div class="story-card">
        <p class="eyebrow">${forCrown ? "Lip sync por la corona" : onWin ? "Lip sync de la Segunda Oportunidrag" : "Lip sync for your life"}</p>
        <h3>${esc(S.queen.name)} vs ${esc(rival.name)}</h3>
        <div class="vs"><img src="${photo(S.queen)}"><span>VS</span><img src="${photo(rival)}"></div>
        <p>${forCrown ? "Una ronda, una corona." : onWin ? "Si ganas, vuelves a la competición." : "Gana el duelo de tacones o te vas a casa."}</p>
        ${isNem(rival) ? `<p class="twist-note">⚔️ Contra tu némesis. Llevabais toda la temporada esperando esto.</p>` : ""}
        ${Nem.knows(rival.id, "deb") && traitsOf(rival).deb === "lsFlojo" ? `<p class="gold">🎯 Sabes que su lip sync es flojo: empiezas con ventaja.</p>` : ""}
        ${Nem.knows(rival.id, "fort") && traitsOf(rival).fort === "lipsync" ? `<p class="twist-note">🔥 Es una bestia del lip sync, pero ibas preparada.</p>` : ""}
        <button class="btn btn-primary" id="story-ls">¡A la pasarela!</button>
      </div>`;
    Music.play("tension");
    $("#story-ls").addEventListener("click", () => Curtain.run(() => {
      Music.stop();
      const rt = traitsOf(rival);
      S.lsBonus = (rt.deb === "lsFlojo" ? (Nem.knows(rival.id, "deb") ? 12 : 4) : 0) - (rt.fort === "lipsync" ? (Nem.knows(rival.id, "fort") ? 5 : 10) : 0);
      lsGame(rival, (res) => {
        UI.show("story");
        if (rt.fort === "lipsync") learnTrait(rival, "fort", "Lo has sufrido en el lip sync");
        if (rt.deb === "lsFlojo") learnTrait(rival, "deb", "Lo has notado en el lip sync");
        if (window.__forceLose) { res.won = false; if (window.__forceLose === "once") window.__forceLose = false; } // solo pruebas
        S.points += Math.round(res.score || 0);
        if (res.won) {
          S.lipsyncs++;
          S.points += forCrown ? 5000 : 1000;
          if (S.lipsyncs >= 3) Achievements.unlock("superviviente");
        }
        header();
        if (!forCrown) nemEvent("elim", res.won ? S.queen : rival, res.won ? rival : S.queen);
        if (onWin) {
          if (res.won) return onWin(rival);
          // Si pierdes la Segunda Oportunidrag, la que gana vuelve de verdad a la competición
          if (S.out.includes(rival) && !S.rivals.includes(rival)) { S.out = S.out.filter((q) => q !== rival); S.rivals.push(rival); logEv(`${rival.name} vuelve a la competición con la Segunda Oportunidrag`); }
          return aftermath(rival, "La Segunda Oportunidrag no ha salido bien.");
        }
        if (!res.won && !forCrown && !S.flags.dshantay && Math.random() < 0.15) {
          S.flags.dshantay = true;
          Achievements.unlock("doble-shantay");
          body().innerHTML = `
          <div class="story-card">
            <p class="eyebrow">¡Momento histórico!</p>
            <h3>¡Doble shantay!</h3>
            <div class="vs"><img src="${photo(S.queen)}"><span>💖</span><img src="${photo(rival)}"></div>
            <p>Las dos lo habéis dado todo. <b>${esc(S.queen.name)}</b> y <b>${esc(rival.name)}</b>, shantay, you both stay.</p>
            <button class="btn btn-primary" id="story-next">Siguiente episodio</button>
          </div>`;
          Confetti.burst(2500);
          return endEpisodeBtn();
        }
        if (!res.won) {
          if (!forCrown && twistOf() === "repesca" && !S.flags.repesca) return goHomeRepesca(rival);
          if (!forCrown) return aftermath(rival);
          return theEnd(false, rival, forCrown);
        }
        if (forCrown) return theEnd(true, rival);
        eliminate(rival);
        header();
        body().innerHTML = `
          <div class="story-card">
            <p class="eyebrow">Shantay, you stay</p>
            <h3>¡Sigues en la competición!</h3>
            <div class="vs"><img src="${photo(S.queen)}"><span>VS</span><img class="gone" src="${photo(rival)}"></div>
            <p><b>${esc(rival.name)}</b>, sashay away.</p>
            <button class="btn btn-primary" id="story-next">Siguiente episodio</button>
          </div>`;
        endEpisodeBtn();
      });
    }, forCrown ? "LIP SYNC POR LA CORONA" : onWin ? "SEGUNDA OPORTUNIDRAG" : "LIP SYNC FOR YOUR LIFE"));
  }

  // ------------------------------ Repesca (T3) ------------------------------
  // Si te eliminan antes de la repesca, esperas en casa y vuelves a intentarlo
  function goHomeRepesca(by) {
    S.meOut = true;
    S.flags.waitRepesca = 1;
    S.flags.myPlace = S.rivals.length + 1;
    if (S.track.me && S.track.me[S.ep]) mark(S.queen, "ELIM");
    S.phase = null;
    save();
    header();
    body().innerHTML = `
      <div class="story-card">
        <p class="eyebrow">Te vas a casa... de momento</p>
        <h3>Sashay away, ${esc(S.queen.name)}</h3>
        ${by ? `<div class="vs"><img class="gone" src="${photo(S.queen)}"><span>💔</span><img src="${photo(by)}"></div>` : ""}
        <p>Pero esta temporada hay <b>Segunda Oportunidrag</b>. Mientras esperas en casa, la competición sigue. Cuando queden siete reinas, las eliminadas volveréis al taller para un stand-up en parejas: si tu pareja gana, vuelves.</p>
        <button class="btn btn-primary" id="story-next">Ver cómo sigue</button>
      </div>`;
    $("#story-next").addEventListener("click", repescaStep);
  }
  // ¿Toca la Segunda Oportunidrag? Cuando quedan siete reinas en competición
  const REPESCA_AT = BALANCE.repescaCuando;
  const repescaNow = () => twistOf() === "repesca" && !S.flags.repesca && !S.meOut && S.rivals.length + 1 <= REPESCA_AT;
  // Ranking de parejas en una sola columna, con puesto, las dos caras y su resultado
  function pairRankHTML(items) {
    // items: [{c, o, me, res: "win"|"safe"|"btm"}]
    const face = (q) => (q ? `<i style="background-image:url('${photo(q)}')"></i>` : `<i class="none"></i>`);
    const RES = { win: ["👑 Ganan", "win"], safe: ["A salvo", "safe"], btm: ["💔 Bottom", "btm"] };
    return `<ol class="rp-rank">${items.map((x, k) => `<li class="${x.me ? "me" : ""} ${RES[x.res][1]}" style="--i:${k}">
      <b class="rp-pos">${k + 1}º</b>
      <span class="rp-q">${face(x.c)}<em>${esc(x.me ? "Tú" : x.c.name)}</em></span>
      <span class="rp-plus">+</span>
      <span class="rp-q">${face(x.o)}<em>${x.o ? esc(x.o.name) : "sola"}</em></span>
      <span class="rp-res">${RES[x.res][0]}${x.back ? ` · 🔁 vuelve ${esc(x.o.name)}` : ""}</span></li>`).join("")}</ol>`;
  }
  // Lip sync a tres bandas: se salva una y se van dos (la inmune, si está en el bottom, se salva siempre)
  const immuneQ = () => (S.flags.immune === "me" ? S.queen : S.flags.immune ? qById(S.flags.immune) : null);
  function tripleVerdict(three, meWon) {
    const imm = immuneQ();
    if (imm && three.includes(imm)) return imm;
    if (meWon === true) return S.queen;
    const pool = three.filter((q) => q !== S.queen || meWon == null);
    return pool.slice(1).reduce((best, q) => simLS(best, q)[0], pool[0]);
  }
  function tripleLipSync(bottomRows, winner, rows) {
    // Vuelve la eliminada de la mejor pareja que tenga una (si la ganadora iba sola, la siguiente)
    const pairKey = (r) => (r.me ? "me" : r.q.id);
    const bestPair = (rows || [winner]).find((r) => S.rp && S.rp.ep === S.ep && S.rp.pairs[pairKey(r)]) || winner;
    const back = S.rp && S.rp.ep === S.ep && bestPair ? qById(S.rp.pairs[pairKey(bestPair)]) : null;
    if (!S.flags.rpRanked) {
      // 1) Ranking por parejas  2) vuelve la eliminada de la pareja ganadora (RTRN)  3) lip sync a tres
      S.flags.rpRanked = 1;
      const list = rows || [winner, ...bottomRows];
      const partner = (r) => { const id = S.rp && S.rp.pairs[r.me ? "me" : r.q.id]; return id ? qById(id) : null; };
      const nmR = (r) => esc(r.me ? "Tú" : r.q.name);
      header();
      body().innerHTML = `
        <div class="story-card">
          <p class="eyebrow">🔁 Segunda Oportunidrag · ranking por parejas</p>
          <h3>${winner.me ? "¡Vuestra pareja gana el reto! 👑" : partner(winner) ? `Ganan ${nmR(winner)} y ${esc(partner(winner).name)}` : `Gana ${nmR(winner)}, que iba sola`}</h3>
          ${pairRankHTML(list.map((r, k) => ({ c: r.me ? S.queen : r.q, o: partner(r), me: r.me, res: k === 0 ? "win" : bottomRows.includes(r) ? "btm" : "safe", back: r === bestPair && back })))}
          <p class="muted">Las reinas de las tres peores parejas van al lip sync a tres bandas: se salva una y se van dos.</p>
          <button class="btn btn-primary" id="story-next">Continuar</button>
        </div>`;
      return $("#story-next").addEventListener("click", () => {
        if (!back || !S.out.includes(back)) return tripleLipSync(bottomRows, winner, rows);
        S.flags.repesca = true;
        S.out = S.out.filter((q) => q !== back);
        S.rivals.push(back);
        mark(back, "RTRN");
        logEv(`${back.name} vuelve a la competición con la Segunda Oportunidrag`);
        header();
        dialog(
          [["host", `${bestPair.me ? "{yo}" : bestPair.q.name} y ${back.name}: ¡habéis ganado las dos!`], ["host", `${back.name}, te has ganado tu SEGUNDA OPORTUNIDRAG... ¡vuelves a la competición!`], ...HISTORIA.regresoVuelve],
          ctxWith(back),
          () => tripleLipSync(bottomRows, winner, rows),
          S.meOut ? undefined : [
            { txt: "¡Bienvenida de nuevo, {r1}!", rel: { r1: 1 }, reply: ["r1", "¡Gracias, reina! Esta vez voy a por todas."] },
            { txt: "Pues ya somos una más para echar...", rel: { r1: -1 }, bonus: 80, reply: ["r1", "Tranquila, que empiezo por ti."] },
          ],
        );
      });
    }
    S.flags.rpRanked = 0;
    S.flags.repesca = true;
    const three = bottomRows.map((r) => (r.me ? S.queen : r.q));
    const imm = immuneQ();
    const finish = (stay) => {
      S.flags.immune = null;
      const gone = three.filter((q) => q !== stay);
      const meGone = gone.includes(S.queen);
      gone.filter((q) => q !== S.queen).forEach((q) => { nemEvent("elim", stay, q); eliminate(q); });
      const place = S.rivals.length + 1;
      header();
      body().innerHTML = `
        <div class="story-card">
          <p class="eyebrow">💄 Lip sync a tres bandas</p>
          <h3>${esc(stay === S.queen ? "Tú" : stay.name)}, shantay you stay</h3>
          <div class="vs">${three.map((q) => `<img class="${q === stay ? "" : "gone"}" src="${photo(q)}">`).join("<span>·</span>")}</div>
          <p>${imm === stay ? `🛡️ ${esc(stay === S.queen ? "Tenías" : `${stay.name} tenía`)} la inmunidad: se salva. ` : ""}<b>${gone.map((q) => esc(q === S.queen ? "Tú" : q.name)).join("</b> y <b>")}</b>, sashay away. Se van dos de golpe.</p>
          <button class="btn btn-primary" id="story-next">Continuar</button>
        </div>`;
      if (meGone) return $("#story-next").addEventListener("click", () => aftermath(stay === S.queen ? null : stay, "El lip sync a tres bandas te ha mandado a casa.", `${place}º/${place + 1}º`));
      $("#story-next").textContent = "Siguiente episodio";
      endEpisodeBtn();
    };
    const others = three.filter((q) => q !== S.queen);
    if (!three.includes(S.queen)) {
      body().innerHTML = `
        <div class="story-card">
          <p class="eyebrow">💄 Lip sync a tres bandas</p>
          <h3>${three.map((q) => esc(q.name)).join(", ")}</h3>
          <div class="vs">${three.map((q) => `<img src="${photo(q)}">`).join("<span>·</span>")}</div>
          <p>Las tres lo dan todo. Solo una se queda${imm && three.includes(imm) ? ` (y ${esc(imm.name)} tiene la inmunidad)` : ""}.</p>
          <button class="btn btn-primary" id="story-ls">Ver el veredicto</button>
        </div>`;
      return $("#story-ls").addEventListener("click", () => finish(tripleVerdict(three)));
    }
    if (imm === S.queen) {
      Toast.show("🛡️ Tienes la inmunidad", "Haces el lip sync, pero te salvas pase lo que pase");
    }
    const strong = others.slice().sort((a, b) => skillOf(b) - skillOf(a))[0];
    playLS(strong, {
      eyebrow: "💄 Lip sync a tres bandas",
      text: `Contra ${others.map((q) => esc(q.name)).join(" y ")}. Solo se queda una: las otras dos se van.${imm && imm !== S.queen && three.includes(imm) ? ` Ojo: ${esc(imm.name)} tiene la inmunidad.` : ""}`,
      curtain: "LIP SYNC A TRES BANDAS",
    }, (won) => finish(tripleVerdict(three, won)));
  }
  // Al final del episodio, por sorpresa, vuelve una de las eliminadas
  function surpriseReturn(exclude, forced, then) {
    S.flags.repesca = true;
    const pool = S.out.filter((q) => !exclude.includes(q));
    if (!pool.length) return then();
    const back = forced && pool.includes(forced) ? forced : pool.slice().sort((a, b) => skillOf(b) + rnd(-12, 12) - skillOf(a))[0];
    S.out = S.out.filter((q) => q !== back);
    S.rivals.push(back);
    logEv(`${back.name} vuelve a la competición con la Segunda Oportunidrag`);
    header();
    dialog(
      [["host", "Un momento, reinas... que esto no ha terminado."], ["host", forced === back ? `${back.name}, tu pareja y tú habéis ganado las dos. Te has ganado tu SEGUNDA OPORTUNIDRAG... ¡y vuelves a la competición!` : "Las eliminadas se han batido en la SEGUNDA OPORTUNIDRAG. Y una de ellas... ¡vuelve a la competición!"], ...HISTORIA.regresoVuelve],
      ctxWith(back),
      then,
      S.meOut || exclude.includes(S.queen) ? undefined : [
        { txt: "¡Bienvenida de nuevo, {r1}!", rel: { r1: 1 }, reply: ["r1", "¡Gracias, reina! Esta vez voy a por todas."] },
        { txt: "Pues ya somos una más para echar...", rel: { r1: -1 }, bonus: 80, reply: ["r1", "Tranquila, que empiezo por ti."] },
      ],
    );
  }
  // Tú eres la maestra de ceremonias: presentas el show, no compites y estás a salvo
  function mcEpisode() {
    flowGo("mc");
    const comp = shuffle(S.rivals.slice());
    const outs = shuffle(S.out.slice());
    const pairs = comp.map((c) => ({ c, o: outs.shift() || null }));
    S.rp = { ep: S.ep, pairs: Object.fromEntries(pairs.filter((p) => p.o).map((p) => [p.c.id, p.o.id])), ps: {} };
    mark(S.queen, "MC");
    Achievements.unlock("mc");
    dialog(
      [["host", "{yo}, esta noche el escenario es tuyo: presenta a cada pareja y que no decaiga."], ["r1", "Nos dejas en buenas manos... o eso espero."]],
      ctxWith(pick1(S.rivals)),
      () => {
        body().innerHTML = `
          <div class="story-card intro">
            <img class="story-queen" src="${sprite(S.queen)}" alt="">
            <div>
              <p class="eyebrow">🎤 Maestra de ceremonias</p>
              <h3>Presentas la Segunda Oportunidrag</h3>
              <div class="rp-pairs">${pairs.map((p) => `<div class="rp-pair"><span><i style="background-image:url('${photo(p.c)}')"></i>${esc(p.c.name)}</span><b>+</b><span>${p.o ? `<i style="background-image:url('${photo(p.o)}')"></i>${esc(p.o.name)}` : "sola"}</span></div>`).join("")}</div>
              <p>No compites esta semana y estás a salvo. Si presentas con gracia, el jurado lo tendrá en cuenta.</p>
              <button class="btn btn-primary" id="story-go">¡Al escenario!</button>
            </div>
          </div>`;
        $("#story-go").addEventListener("click", () => {
          body().innerHTML = `<div id="story-play"></div>`;
          Music.play("reto");
          runSnatch($("#story-play"), (raw) => {
            cleanup = null;
            if (typeof window.__forceScore === "number") raw = window.__forceScore;
            Music.stop();
            S.points += Math.round(raw) * 5;
            if (raw >= 70) { S.advice += 4; Toast.show("🎤 ¡Qué maestra de ceremonias!", "Vuelves al taller con el ánimo arriba"); }
            pairs.forEach((p) => (p.s = p.o ? rivalScore(p.c) * 0.6 + rivalScore(p.o) * 0.4 + rnd(-6, 6) : rivalScore(p.c) + rnd(-6, 6)));
            pairs.sort((a, b) => b.s - a.s);
            const n = pairs.length, nb = n >= 5 ? 3 : 2;
            const top = pairs[0], btm = pairs.slice(-nb);
            const bestO = pairs.find((p) => p.o);
            const back = bestO ? bestO.o : null;
            pairs.forEach((p, k) => mark(p.c, k === 0 ? "WIN" : k >= n - nb ? `BTM${nb}` : k <= 1 ? "HIGH" : "SAFE"));
            if (back) { S.out = S.out.filter((q) => q !== back); S.rivals.push(back); mark(back, "RTRN"); logEv(`${back.name} vuelve con la Segunda Oportunidrag`); }
            const three = btm.map((p) => p.c);
            const stay = three.slice(1).reduce((b, q) => simLS(b, q)[0], three[0]);
            const gone = three.filter((q) => q !== stay);
            gone.forEach((q) => eliminate(q));
            S.flags.repesca = true;
            S.flags.immune = null;
            header();
            body().innerHTML = `
              <div class="story-card">
                <p class="eyebrow">🔁 Segunda Oportunidrag · resultados</p>
                <h3>${esc(top.c.name)} gana el reto${back ? ` y ${esc(back.name)} vuelve a la competición` : ""}</h3>
                ${pairRankHTML(pairs.map((p, k) => ({ c: p.c, o: p.o, res: k === 0 ? "win" : k >= n - nb ? "btm" : "safe", back: p.o && p.o === back })))}
                <p>💄 Lip sync a tres bandas: se salva <b>${esc(stay.name)}</b>. <b>${gone.map((q) => esc(q.name)).join("</b> y <b>")}</b> se van a casa.</p>
                <button class="btn btn-primary" id="story-next">Siguiente episodio</button>
              </div>`;
            endEpisodeBtn();
          }, PREGUNTAS, "🎤 Presentas el show", "Presentación", 4);
        });
      },
    );
  }
  // Parejas de la Segunda Oportunidrag: cada reina en competición con una eliminada
  function repescaPairs(then) {
    const comp = [S.queen, ...S.rivals];
    const pool = shuffle(S.out.slice());
    const pairs = {};
    const ps = {};
    const assign = (myPick) => {
      const rest = pool.filter((q) => q !== myPick);
      if (myPick) pairs.me = myPick.id;
      // Tú siempre vas con pareja; si faltan eliminadas, alguna rival va sola
      // (si sobra una, va sola la que tiene la inmunidad)
      const imm = S.flags.immune && S.flags.immune !== "me" ? qById(S.flags.immune) : null;
      [...(myPick ? [] : [S.queen]), ...shuffle(S.rivals.filter((q) => q !== imm))].forEach((q) => { const o = rest.shift(); if (o) pairs[q === S.queen ? "me" : q.id] = o.id; });
      Object.values(pairs).forEach((id) => { const q = qById(id); if (q) ps[id] = clamp(Math.round(rivalScore(q) + rnd(-8, 8)), 0, 99); });
      S.rp = { ep: S.ep, pairs, ps };
      const nm = (k) => (k === "me" ? "Tú" : (qById(k) || {}).name || k);
      body().innerHTML = `
        <div class="story-card">
          <p class="eyebrow">🔁 Segunda Oportunidrag · las parejas</p>
          <h3>${pairs.me ? `Tu pareja: ${esc(qById(pairs.me).name)}` : "Te toca ir sola"}</h3>
          ${imm ? `<p class="twist-note">🎤 ${esc(imm.name)} es la maestra de ceremonias: no compite esta semana.</p>` : ""}
          <div class="rp-pairs">${Object.entries(pairs).map(([k, o]) => `<div class="rp-pair ${k === "me" ? "me" : ""}"><span><i style="background-image:url('${photo(k === "me" ? S.queen : qById(k))}')"></i>${esc(nm(k))}</span><b>+</b><span><i style="background-image:url('${photo(qById(o))}')"></i>${esc(qById(o).name)}</span></div>`).join("")}</div>
          <p class="muted">Si vuestra pareja gana, ${pairs.me ? esc(qById(pairs.me).name) : "tu compañera"} vuelve a la competición. Si quedáis entre las tres peores, lip sync a tres bandas: solo se salva una.</p>
          <button class="btn btn-primary" id="story-next">¡Al escenario!</button>
        </div>`;
      $("#story-next").addEventListener("click", then);
    };
    if (S.miniWin !== "me" || pool.length < 2) return assign(null);
    body().innerHTML = `
      <div class="story-card">
        <p class="eyebrow">Has ganado el minirreto</p>
        <h3>Elige a tu pareja de comedia</h3>
        <div class="hub-grid">${pool.map((q, i) => `<button class="hub-q" style="--i:${i}" data-id="${q.id}"><i style="background-image:url('${photo(q)}')"></i><span>${esc(q.name)}</span><small>Eliminada</small></button>`).join("")}</div>
      </div>`;
    body().querySelectorAll("[data-id]").forEach((b) => b.addEventListener("click", () => assign(qById(b.dataset.id))));
  }
  // Stand-up a dúo en directo
  function liveStandPair(el, done) {
    const mate = S.rp && S.rp.pairs.me ? qById(S.rp.pairs.me) : null;
    const who = mate ? `con ${mate.name}` : "en solitario";
    const after = mate ? async (v) => {
      const rep = await IA.chat(`Hablas SOLO como ${mate.name}, ${S.meOut ? "reina en competición que hace pareja con una eliminada" : "reina eliminada que vuelve al taller"} en la Segunda Oportunidrag. ${aiProfile(mate)}`, `En el monólogo a dúo, ${S.queen.name} acaba de decir: «${v}». Sigue tú el chiste en una frase muy corta (máximo 18 palabras), con tu carácter y con gracia.`, { max: 60 }).catch(() => null);
      return rep ? { who: mate.name, t: rep, cls: "rival" } : null;
    } : undefined;
    const rounds = [
      { prompt: `🎙️ Arrancáis el monólogo ${who}`, sub: "Presenta el número y engancha al público.", ctx: `Stand-up a dúo de la Segunda Oportunidrag. ${S.queen.name} actúa ${who}. Valora la gracia y el ritmo.`, after },
      { prompt: "😂 El chiste sobre volver al taller", sub: S.meOut ? "Haz gracia con tu vuelta al taller." : mate ? `Haz gracia con la vuelta de ${mate.name} a la competición.` : "Haz gracia con la vuelta de las eliminadas.", ctx: "Chiste sobre las eliminadas que vuelven al taller de Drag Race España.", after },
      { prompt: "🎤 El remate final", sub: "Cerrad por todo lo alto.", ctx: "Remate final del monólogo a dúo.", after },
    ];
    liveRounds(el, { title: "Stand-up en parejas", icon: "🎙️", kind: "stand-up (monólogo de humor a dúo)", attr: "comedia", rounds, ph: "Tu chiste..." }, done);
  }
  // Semanas sin ti hasta que quedan siete reinas: doble eliminación y te juegas volver en un lip sync
  function repescaStep() {
    if (S.rivals.length <= REPESCA_AT) return Curtain.run(() => homeRepesca(), "SEGUNDA OPORTUNIDRAG");
    const r = simWeek();
    S.phase = null;
    save();
    const face = (q) => `<i class="tn-face" style="background-image:url('${photo(q)}')"></i>`;
    showTrack(repescaStep, S.rivals.length > REPESCA_AT ? "Siguiente semana" : "Siguiente semana: ¡quedan siete!",
      `${face(r.win)} 👑 Gana <b>${esc(r.win.name)}</b> · ${face(r.go)} 💔 <b>${esc(r.go.name)}</b> pierde el lip sync contra <b>${esc(r.stay.name)}</b> y se va a casa.`);
  }
  // Desde casa: vuelves al taller para el stand-up en parejas con una reina en competición
  function homeRepesca() {
    if (S.flags.repesca) return;
    S.ep++;
    S.epNames[S.ep] = "Segunda Oportunidrag";
    S.flags.repesca = true;
    S.flags.waitRepesca = 0;
    setSet("werkroom");
    header();
    const mcQ = S.flags.immune ? qById(S.flags.immune) : null;
    if (mcQ) mark(mcQ, "MC");
    const comp = shuffle(S.rivals.filter((q) => q !== mcQ));
    const outs = shuffle(S.out.slice());
    const mate = comp[0];
    const pairs = [{ c: mate, o: null, me: true }, ...comp.slice(1).map((c) => ({ c, o: outs.shift() || null }))];
    S.rp = { ep: S.ep, pairs: { me: mate.id }, ps: {}, home: true };
    dialog(
      [["host", "¡Reinas eliminadas, volvéis al taller! Ha llegado la SEGUNDA OPORTUNIDRAG."], ["host", "Cada una hará un monólogo a dúo con una reina en competición. La eliminada de la pareja ganadora... vuelve."], ["r1", "{yo}, me ha tocado contigo. Vamos a matarlas de risa."]],
      ctxWith(mate),
      () => {
        body().innerHTML = `
          <div class="story-card intro">
            <img class="story-queen" src="${sprite(S.queen)}" alt="">
            <div>
              <p class="eyebrow">🔁 Segunda Oportunidrag · tu pareja: ${esc(mate.name)}</p>
              <h3>${esc(RETOS.repescaStand.titulo())}</h3>
              <p>Si vuestra pareja gana, vuelves a la competición. Si quedáis entre las tres peores, ${esc(mate.name)} irá al lip sync a tres bandas.</p>
              <button class="btn btn-primary" id="story-go">¡Al escenario!</button>
            </div>
          </div>`;
        $("#story-go").addEventListener("click", () => {
          body().innerHTML = `<div id="story-play"></div>`;
          Music.play("reto");
          RETOS.repescaStand.run($("#story-play"), (raw) => {
            cleanup = null;
            if (typeof window.__forceScore === "number") raw = window.__forceScore;
            Music.stop();
            pairs.forEach((p) => (p.s = p.me ? raw * 0.6 + rivalScore(p.c) * 0.4 : p.o ? rivalScore(p.c) * 0.6 + rivalScore(p.o) * 0.4 : rivalScore(p.c)));
            pairs.sort((a, b) => b.s - a.s);
            const n = pairs.length;
            const nb = n >= 5 ? 3 : 2;
            const top = pairs[0], btm = pairs.slice(-nb);
            const three = btm.map((p) => p.c);
            const stayQ = nb === 3 ? tripleVerdict(three) : null;
            const low = btm.filter((p) => p.c !== stayQ);
            S.flags.immune = null;
            pairs.forEach((p, k) => mark(p.c, k === 0 ? "WIN" : k >= n - nb ? `BTM${nb}` : "SAFE"));
            low.forEach((p) => eliminate(p.c));
            const meBack = top.me;
            const back = meBack ? null : top.o;
            if (back) { S.out = S.out.filter((q) => q !== back); S.rivals.push(back); mark(back, "RTRN"); logEv(`${back.name} vuelve con la Segunda Oportunidrag`); }
            if (meBack) mark(S.queen, "RTRN");
            const nm = (p) => `${esc(p.c.name)} + ${p.me ? "tú" : p.o ? esc(p.o.name) : "sola"}`;
            header();
            body().innerHTML = `
              <div class="story-card">
                <p class="eyebrow">🔁 Segunda Oportunidrag · resultados</p>
                <h3>${meBack ? `¡${esc(S.queen.name)} vuelve a la competición!` : `${esc(back ? back.name : top.c.name)} ${back ? "vuelve a la competición" : "gana el reto"}`}</h3>
                ${pairRankHTML(pairs.map((p, k) => ({ c: p.c, o: p.me ? S.queen : p.o, res: k === 0 ? "win" : k >= n - nb ? "btm" : "safe", back: k === 0 && (p.me || p.o) ? true : false })))}
                <p>💄 Lip sync a tres bandas${stayQ ? `: se salva <b>${esc(stayQ.name)}</b>` : ""}. <b>${low.map((p) => esc(p.c.name)).join("</b> y <b>")}</b> se van a casa.</p>
                <button class="btn btn-primary" id="story-next">${meBack ? "Volver al taller" : "Continuar"}</button>
              </div>`;
            if (meBack) {
              Achievements.unlock("segunda");
              S.meOut = false;
              Confetti.burst(2000);
              Toast.show("🔁 ¡Has vuelto!", "Segunda oportunidad");
              return endEpisodeBtn();
            }
            $("#story-next").addEventListener("click", () => aftermath(null, "La Segunda Oportunidrag no ha salido bien.", S.flags.myPlace));
          });
        });
      },
    );
  }
