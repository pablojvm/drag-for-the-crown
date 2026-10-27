  // --------------------------- Flujo principal -----------------------------
  // La historia NO sigue el orden real de expulsión: cada partida se decide
  // por cómo juegas, tus relaciones y el azar. (El orden real es solo del arcade.)
  const SAVE_KEY = "dftc-story-save";
  const qById = (id) => QUEENS.find((q) => q.id === id);
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const seasonInfo = () => TEMPORADAS_HISTORIA[S.season.id] || { lema: "", intro: [] };
  const twistOf = () => seasonInfo().twist || null;
  // All Stars y All Winners comparten el lip sync del top 2
  const asLike = (t) => t === "allstars" || t === "winners";
  const keyOf = (q) => (q === S.queen ? "me" : q.id);
  const nameOfKey = (k) => (k === "me" ? S.queen.name : (qById(k) || {}).name || "");

  function blankState(queen, season, rivals) {
    return {
      queen, season, rivals, out: [], ep: 0, wins: 0, bottoms: 0, points: 0, lipsyncs: 0, rel: {}, streak: 0,
      record: {}, form: {}, hearts: {}, memories: [], track: {}, epNames: {}, luck: undefined, flags: {}, advice: 0, helped: false, meOut: false,
      roles: {}, known: {}, order: null, missC: null, groups: null, myGroup: null,
    };
  }
  function start(queen, season) {
    runId++;
    S = { rng: newSeed() };
    const rivals = shuffle(season.cast.filter((id) => id !== queen.id).map(qById).filter(Boolean));
    S = { ...blankState(queen, season, rivals), rng: S.rng };
    // Roles detrás de cámaras: uno por reina (se descubren jugando)
    const roles = shuffle(ROLES_ORDEN);
    shuffle(rivals).forEach((q, i) => (S.roles[q.id] = i < roles.length ? roles[i] : pick1(["graciosa", "madre", "diva", "sensible", "novata", "estratega"])));
    // Orden de retos de esta temporada: empieza en pasarela y el Snatch Game llega pronto
    const rest = shuffle(ORDEN_RETOS.filter((t) => t !== "pasarela" && t !== "snatch"));
    rest.splice(1 + Math.floor(Math.random() * 3), 0, "snatch");
    // La Lalaparuza cae cuando quedan 8 (cuadro limpio, sin ronda previa). Si nunca quedan 8, se va al final del orden
    {
      const lz = rest.indexOf("lalaparuza");
      if (lz >= 0) rest.splice(lz, 1);
      const total = season.cast.length, ep8 = total - 7;
      // All Winners: nadie se va, así que cae a mitad de temporada (con ronda previa si hace falta)
      if (twistOf() === "winners") rest.splice(2 + Math.floor(Math.random() * 3), 0, "lalaparuza");
      else if (total >= 8 && ep8 >= 1 && ep8 <= rest.length) rest.splice(ep8 - 1, 0, "lalaparuza");
      else rest.push("lalaparuza");
    }
    S.order = rest;
    S.runwayPlan = buildPlan();
    // La memoria de otras temporadas: cómo te recuerdan las demás
    S.pacts = {};
    rivals.forEach((q) => { const f = Nem.feel(q.id, queen.id); if (f) S.rel[q.id] = clamp(Math.round(f * 0.6), -3, 3); });
    const hated = rivals.filter((q) => Nem.feel(q.id, queen.id) <= -3).sort((a, b) => Nem.feel(a.id, queen.id) - Nem.feel(b.id, queen.id))[0];
    if (hated && NEMESIS_ON) S.nemesis = { id: hated.id, origin: "historia", heat: 6, ep: 0, announced: false };
    S.runwayIdx = 0;
    Achievements.unlock("debut");
    UI.show("story");
    Sound.stopAll();
    javisCall(nextEpisode);
  }

  // Guardado: se guarda al empezar cada episodio (si sales a mitad de un reto, lo repites)
  // Se guarda TODO el estado salvo las reinas (van como ids) y lo que es pasajero; así no se pierde nada nuevo
  const NO_SAVE = new Set(["queen", "season", "rivals", "out", "team", "captains", "savedBy", "epPending", "curPieces", "revealImg", "trackShown"]);
  const META = new Set(["queen", "season", "rivals", "out", "date", "v"]);
  const hasQueen = (v, d = 0) => !!v && typeof v === "object" && d < 5 && ((v.stats && v.sprite && v.id) || Object.values(v).some((x) => hasQueen(x, d + 1)));
  function snapshot() {
    const d = { queen: S.queen.id, season: S.season.id, rivals: S.rivals.map((q) => q.id), out: S.out.map((q) => q.id), date: new Date().toISOString(), v: 3 };
    Object.keys(S).forEach((k) => {
      const v = S[k];
      if (NO_SAVE.has(k) || META.has(k) || v === undefined || typeof v === "function" || hasQueen(v)) return;
      d[k] = v;
    });
    return d;
  }
  let saveWarned = false;
  // Copia de la partida justo antes de cada episodio: permite repetir el capítulo desde la consola
  const EPSTART_KEY = "dftc-story-epstart";
  function repeatEpisode() {
    const cur = store.get(SAVE_KEY, null);
    if (!cur) return "No hay ninguna partida guardada.";
    const st = store.get(EPSTART_KEY, null);
    let back = null;
    if (st && st.queen === cur.queen && st.season === cur.season && st.ep === cur.ep - 1) back = st;
    else if (cur.ep === 1) {
      // Primer episodio sin copia: se vuelve al principio de la temporada con los looks ya preparados
      back = { ...cur, ep: 0, phase: null, track: {}, record: {}, form: {}, points: 0, wins: 0, bottoms: 0, streak: 0, lipsyncs: 0, epNames: {}, log: [], lalaRes: null, retoEp: null, meOut: false, rivals: [...cur.rivals, ...cur.out], out: [], usedThemes: [], runwayIdx: 0 };
    }
    if (!back) return "No puedo repetir este capítulo: solo se puede el último que empezaste.";
    store.set(SAVE_KEY, { ...back, date: new Date().toISOString() });
    abandon();
    return `Listo: recarga la página y pulsa Continuar para repetir el episodio ${cur.ep}.`;
  }
  function save() {
    if (S && S.mp) return; // la temporada en directo no pisa la partida individual
    const ok = store.set(SAVE_KEY, snapshot());
    if (ok === false && !saveWarned) {
      saveWarned = true;
      Toast.show("⚠️ No se ha podido guardar", "El almacenamiento del navegador está lleno. Libera espacio o la partida no se guardará.");
    }
  }
  const saved = () => {
    const d = store.get(SAVE_KEY, null);
    return d && d.v >= 2 && qById(d.queen) && seasonById(d.season) ? d : null;
  };
  function resume() {
    const d = saved();
    if (!d) return;
    runId++;
    S = blankState(qById(d.queen), seasonById(d.season), d.rivals.map(qById).filter(Boolean));
    S.out = d.out.map(qById).filter(Boolean);
    Object.keys(d).forEach((k) => { if (!META.has(k) && d[k] !== undefined) S[k] = d[k]; });
    if (typeof S.rng !== "number") S.rng = newSeed();
    S.epPending = false;
    UI.show("story");
    Sound.stopAll();
    if (S.ep === 0 && !S.flags.prepped && S.runwayPlan) return S.flags.grant ? prepAllLooks(nextEpisode) : javisCall(nextEpisode);
    if (S.meOut && S.flags.waitRepesca) return repescaStep();
    if (S.meOut && S.flags.aftermath) return S.flags.reunion ? afterFinal() : afterStep();
    if (S.phase && S.phase.ep === S.ep && S.ep > 0) return resumeMid();
    S.phase = null;
    nextEpisode();
  }

  // Pantalla al pulsar "Modo historia": continuar la guardada o empezar otra
  function menu(onNew) {
    const d = saved();
    if (!d) return onNew();
    const q = qById(d.queen), se = seasonById(d.season);
    UI.show("story");
    setSet("werkroom");
    $("#story-season").textContent = "Modo historia";
    $("#story-ep").textContent = "Partida guardada";
    $("#story-exit").innerHTML = "<i>←</i><span>Volver</span>";
    $("#story-shop").hidden = true;
    $("#story-board").hidden = true;
    $("#story-ia").hidden = true;
    $("#story-cast").innerHTML = "";
    body().innerHTML = `
      <div class="story-card intro">
        <img class="story-queen" src="${lookOf(q, se.id).sprite || q.sprite}" alt="">
        <div>
          <p class="eyebrow">${esc(se.franchise.name)} · ${esc(se.name)}</p>
          <h3>${esc(q.name)}</h3>
          <p>Vas por el episodio ${d.phase && d.phase.ep === d.ep ? `${d.ep} (${d.phase.stage === "mini" ? "después del minirreto" : d.phase.stage === "runway" ? "antes de la pasarela" : "en los resultados"})` : d.ep + 1}.${(se.special === "winners") ? "" : ` Quedan ${d.rivals.length + (d.meOut ? 0 : 1)} reinas en la competición.`}</p>
          ${se.special === "winners" ? (() => {
            // All Winners: nadie se va, así que se dice cómo vas en estrellas respecto al corte del top 4
            const st = d.stars || {};
            const mine = st.me || 0;
            const others = (d.rivals || []).map((id) => st[id] || 0);
            const pos = 1 + others.filter((x) => x > mine).length;
            const tied = others.filter((x) => x === mine).length;
            const total = others.length + 1;
            const cut = [mine, ...others].sort((x, y) => y - x)[Math.min(3, total - 1)];
            const txt = pos === 1 ? (tied ? "Compartes la cabeza: no te duermas." : "¡Vas en cabeza! La corona te está mirando.")
              : pos <= 4 ? (mine === cut && tied ? "Estás en el corte del top 4, empatada: cada estrella cuenta." : "Estás dentro del top 4: si sigue así, te juegas la corona.")
              : cut - mine <= 1 ? "Estás a un paso del top 4: una estrella más y entras."
              : "Tienes que espabilar: ahora mismo no entrarías en la final por la corona.";
            return `<p>Vas ${pos}ª de ${total} en estrellas${tied ? " (empatada)" : ""}. ${txt}</p>`;
          })() : ""}
          ${(() => {
            // All Winners: lo que cuenta son las estrellas
            if (se.special === "winners" || (seasonById(d.season) || {}).special === "winners") { const st = (d.stars || {}).me || 0; return `<p class="muted ll-count">${st ? `<img src="./images/legendary-star-sm.png?v=2" alt=""> ${st} ${st === 1 ? "Legendary Legend Star" : "Legendary Legend Stars"}` : "Aún sin estrellas"}</p>`; }
            const w = Object.values((d.track || {}).me || {}).filter((l) => l === "WIN" || l === "BWIN").length;
            return `<p class="muted">${w ? `${w} ${w === 1 ? "reto ganado" : "retos ganados"}` : "Aún sin victorias"}</p>`;
          })()}
          <div class="row">
            <button class="btn btn-ghost" id="story-new">Nueva historia</button>
            <button class="btn btn-primary" id="story-continue">Continuar</button>
          </div>
          <p class="muted small">Si empiezas una nueva, la partida guardada se borrará al comenzar.</p>
        </div>
      </div>`;
    $("#story-continue").addEventListener("click", resume);
    $("#story-new").addEventListener("click", onNew);
  }

  // Salir sin perder la partida (queda guardada desde el inicio del episodio)
  function abandon() {
    runId++;
    dropKeys();
    if (cleanup) cleanup();
    cleanup = null;
    // Lo que quedó a medias con la partida anterior no bloquea la siguiente
    idsBusy = null;
    [mxSnatch, mxActing, mxRusical, mxGirlGroups, mxMateriales, mxMakeover, mxImpro, mxPublicidad, mxRoast].forEach((f) => (f.classic = false));
    S = null;
  }
  function exitToMenu() {
    abandon();
    Sound.stopAll();
    UI.show("menu");
  }

  // --------------------------- Diálogos ------------------------------------
  function fill(txt, ctx) {
    return txt.replace(/\{(\w+)\}/g, (m, k) => (ctx[k] !== undefined ? ctx[k] : m));
  }
  function who(key, ctx) {
    if (PRESENTADORAS[key]) return { ...PRESENTADORAS[key], side: PRESENTADORAS[key].side || "left" };
    if (key === "me") return { name: S.queen.name, role: "Tú", img: sprite(S.queen), side: "right" };
    const q = ctx.q[key] || S.rivals[0];
    return { name: q.name, role: (roleKnown(q) ? `${roleOf(q).icon} ${roleOf(q).name} · ` : "") + relLabel(q), img: sprite(q), side: key === "r2" || key === "r3" ? "left" : "right" };
  }
  // lines: [[speaker, text]]; choices: opcional, se muestran al final
  function dialog(lines, ctx, then, choices) {
    let i = 0;
    const scene = document.createElement("div");
    scene.className = "dlg";
    body().innerHTML = "";
    body().append(scene);
    function showLine() {
      if (i >= lines.length) {
        if (choices) return showChoices();
        return finish();
      }
      const [k, t] = lines[i];
      const w = who(k, ctx);
      scene.innerHTML = `
        <img class="dlg-char ${w.side}" src="${w.img}" alt="">
        <div class="dlg-box">
          <p class="dlg-name">${esc(w.name)} <small>${esc(w.role)}</small></p>
          <p class="dlg-text"></p>
          <p class="dlg-hint">Clic, Espacio o Enter para continuar ▸</p>
          ${canSay(k) ? `<button class="btn btn-ghost dlg-say" id="dlg-say">✍️ Responder</button>` : ""}
        </div>
        <button class="btn btn-ghost dlg-skip" id="dlg-skip">Saltar</button>`;
      typeText(scene.querySelector(".dlg-text"), fill(t, ctx));
      const say = scene.querySelector("#dlg-say");
      if (say) say.addEventListener("click", (e) => { e.stopPropagation(); openSay(k, false); });
      scene.querySelector("#dlg-skip").addEventListener("click", (e) => {
        e.stopPropagation();
        i = lines.length;
        showLine();
      });
    }
    function showChoices() {
      scene.innerHTML = `
        <img class="dlg-char right" src="${sprite(S.queen)}" alt="">
        <div class="dlg-box">
          <p class="dlg-name">${esc(S.queen.name)} <small>Tú</small></p>
          <div class="dlg-choices">${choices.map((c, k) => `<button class="btn btn-ghost" data-k="${k}"><b>${k + 1}</b> ${esc(fill(c.txt, ctx))}</button>`).join("")}${sayTarget() ? `<button class="btn btn-ghost dlg-own" id="dlg-own"><b>✍️</b> Decir otra cosa...</button>` : ""}</div>
        </div>`;
      scene.querySelectorAll(".dlg-choices button[data-k]").forEach((b) => b.addEventListener("click", (e) => {
        e.stopPropagation();
        pickChoice(+b.dataset.k);
      }));
      const own = scene.querySelector("#dlg-own");
      if (own) own.addEventListener("click", (e) => { e.stopPropagation(); openSay(sayTarget(), true); });
    }
    function pickChoice(k) {
      const c = choices[k];
      if (!c) return;
      S.points += c.bonus || 0;
      if (c.adv) {
        S.advice += c.adv;
        Toast.show(c.adv > 0 ? "✨ Te viene bien" : "😣 Te descentra", c.adv > 0 ? "Llegas al próximo reto con más confianza" : "Te va a pesar en el próximo reto");
      }
      Object.entries(c.rel || {}).forEach(([key, d]) => changeRel(ctx.q[key], d));
      if (c.effect === "ayuda") S.helped = true;
      const relSum = Object.values(c.rel || {}).reduce((a, b) => a + b, 0);
      // Si te han provocado, contestar no te convierte en la villana: como mucho, das drama
      const provoked = !!(ctx.tension || (ctx.q && isNem(ctx.q.r1)));
      const pk = c.persona === "mean" && provoked ? "drama" : c.persona;
      if (pk) persona(pk, pk === c.persona ? 1 : 0.5);
      else if (relSum > 0) persona("kind");
      else if (relSum < 0) persona(provoked ? "drama" : "mean", provoked ? 0.5 : 1);
      if (relSum < 0 && ctx.q && isNem(ctx.q.r1)) nemTally("mine", provoked ? 0.5 : 1);
      if ((c.bonus || 0) > 0 && !c.persona) persona("drama");
      Object.entries(c.rel || {}).forEach(([key, d]) => { if (d < 0 && isNem(ctx.q[key])) heat(1); });
      if (c.fx) c.fx();
      if (c.after && pendingSide) { pendingSide(c.after); pendingSide = null; }
      choices = null;
      if (typeof logEv === "function" && S && S.ep) logEv(`${S.queen.name} le dice a ${(ctx.q && ctx.q.r1 && ctx.q.r1.name) || "alguien"}: «${fill(c.txt, ctx)}»`);
      lines = [["me", c.txt], ...(c.reply ? [c.reply] : [])];
      i = 0;
      showLine();
    }
    // Responder con tus propias palabras (la reina contesta en directo)
    function canSay(k) {
      return typeof IA !== "undefined" && IA.ready() && S && !S.meOut && /^r\d$/.test(k) && ctx.q && ctx.q[k] && ctx.q[k] !== S.queen && S.rivals.includes(ctx.q[k]);
    }
    function sayTarget() {
      const ks = [...new Set(lines.map((l) => l[0]))].filter(canSay);
      return ks[0] || (canSay("r1") ? "r1" : null);
    }
    function openSay(k, fromChoices) {
      if (!k) return;
      const q = ctx.q[k];
      clearInterval(typing);
      typing = null;
      const box = scene.querySelector(".dlg-box");
      box.innerHTML = `
        <p class="dlg-name">${esc(S.queen.name)} <small>Tú · a ${esc(q.name)}</small></p>
        <form class="ft-form dlg-form"><input id="dlg-in" maxlength="200" autocomplete="off" placeholder="Escribe lo que le dices a ${esc(q.name)}..."><button class="btn btn-primary">Decir</button></form>
        <button class="btn btn-ghost small-btn" id="dlg-cancel">← Volver</button>`;
      const inp = box.querySelector("#dlg-in");
      inp.focus({ preventScroll: true });
      box.addEventListener("click", (e) => e.stopPropagation());
      box.querySelector("#dlg-cancel").addEventListener("click", () => (fromChoices ? showChoices() : showLine()));
      box.querySelector(".dlg-form").addEventListener("submit", async (e) => {
        e.preventDefault();
        const v = inp.value.trim();
        if (!v) return;
        box.innerHTML = `<p class="dlg-name">${esc(q.name)}</p><div class="ia-dots"><i></i><i></i><i></i></div>`;
        const before = lines.slice(0, Math.min(i + 1, lines.length)).map(([kk, tt]) => `${who(kk, ctx).name}: ${fill(tt, ctx)}`).join("\n");
        const r = await IA.chat(
          `Hablas SOLO como ${q.name}. ${aiProfile(q)} ${aiSeason()}`,
          `Escena hasta ahora:\n${before}\n${S.queen.name} le dice a ${q.name}: «${v}»\nResponde como ${q.name}, en personaje, coherente con la escena y con lo que ha dicho (máximo 35 palabras). En "jugadora" clasifica lo que ha dicho ${S.queen.name} teniendo en cuenta quién empezó: "amable", "neutral", "defiende" (contesta a una provocación) o "provoca" (ataca sin que la hayan provocado). Devuelve JSON {"respuesta":"...","tono":"amable|neutral|borde|coqueto|amenaza","relacion":-2..2,"jugadora":"amable|neutral|defiende|provoca"}`,
          { json: true, max: 220 },
        );
        const rep = r && (typeof r.respuesta === "string" ? r.respuesta : "") ? IA.clean(r.respuesta) : pick1(["Mmm... vale. Me lo apunto.", "¿Y eso a qué viene ahora?", "Ya hablaremos tú y yo."]);
        if (r) {
          const d = clamp(Math.round(+r.relacion || 0), -2, 2);
          if (d) changeRel(q, d);
          talkFame(q, r);
        }
        if (typeof logEv === "function") logEv(`${S.queen.name} le dice a ${q.name}: «${v}»`);
        const add = [["me", v], [k, rep]];
        if (fromChoices) { choices = null; lines = add; i = 0; }
        else lines = [...lines.slice(0, i + 1), ...add, ...lines.slice(i + 1)], i++;
        showLine();
      });
    }
    function finish() {
      stop();
      then();
    }
    let typing = null;
    function typeText(el, full) {
      clearInterval(typing);
      let n = 0;
      el.innerHTML = `<span></span><i class="caret"></i>`;
      const span = el.firstChild;
      typing = setInterval(() => {
        n += 2;
        span.textContent = full.slice(0, n);
        if (n >= full.length) {
          clearInterval(typing);
          typing = null;
        }
      }, 22);
      el.dataset.full = full;
    }
    const next = () => {
      if (scene.querySelector(".dlg-form") || scene.querySelector(".ia-dots")) return;
      const tx = scene.querySelector(".dlg-text");
      if (typing && tx) {
        clearInterval(typing);
        typing = null;
        tx.firstChild.textContent = tx.dataset.full;
        return;
      }
      if (!scene.querySelector(".dlg-choices")) {
        i++;
        showLine();
      }
    };
    const onKey = (e) => {
      if (e.target && e.target.tagName === "INPUT") return;
      if (scene.querySelector(".dlg-form")) return;
      if (scene.querySelector(".dlg-choices")) {
        const k = { Digit1: 0, Digit2: 1, Digit3: 2 }[e.code];
        if (k !== undefined) pickChoice(k);
        return;
      }
      if (e.code === "Space" || e.code === "Enter") {
        e.preventDefault();
        next();
      }
    };
    function stop() {
      clearInterval(typing);
      docOff("keydown", onKey);
    }
    Music.play(ctx.tension ? "tension" : "taller");
    scene.addEventListener("click", next);
    docOn("keydown", onKey);
    cleanup = stop;
    showLine();
  }
  // Contexto con compañeras concretas (r1 principal, r2/r3 secundarias)
  function ctxWith(r1, extra = {}) {
    const others = shuffle(S.rivals.filter((q) => q !== r1));
    const r2 = extra.r2 || others[0] || r1, r3 = extra.r3 || others.find((q) => q !== r2) || r2;
    return {
      yo: S.queen.name, r1: r1 && r1.name, r2: r2 && r2.name, r3: r3 && r3.name,
      fuera: S.out[0] && S.out[0].name, temporada: S.season.name, reto: extra.reto || "", tension: extra.tension,
      q: { r1, r2, r3 },
    };
  }
  const ctxFor = (titulo) => ctxWith(pick1(S.rivals), { reto: titulo });

  const isFinal = () => !S.meOut && S.rivals.length <= 3 && twistOf() !== "winners";

  // --------------------------- Roles --------------------------------------
  const roleOf = (q) => (q && S.roles && ROLES_HISTORIA[S.roles[q.id]]) || null;
  const roleKnown = (q) => !!(q && S.known && S.known[q.id] && roleOf(q));
  function reveal(q) {
    if (!q || !roleOf(q) || roleKnown(q)) return;
    S.known[q.id] = true;
    Toast.show(`${roleOf(q).icon} ${q.name} es ${roleOf(q).name.toLowerCase()}`, roleOf(q).desc);
  }
  const withRole = (role) => S.rivals.filter((q) => S.roles[q.id] === role);
  const roleChip = (q) => (roleKnown(q) ? `<em class="role-chip">${roleOf(q).icon} ${esc(roleOf(q).name)}</em>` : `<em class="role-chip unk">❓ Rol por descubrir</em>`);

  // --------------------------- Alianzas ----------------------------------
  const groupOf = (q) => (S.groups || []).find((g) => (q === S.queen ? S.myGroup === g.id : g.members.includes(q.id))) || null;
  const sameGroup = (a, b) => { const g = groupOf(a); return !!g && g === groupOf(b); };
  // Afinidad de a hacia b por los grupos: se apoyan dentro, chocan fuera
  const groupAff = (a, b) => { const ga = groupOf(a), gb = groupOf(b); return !ga || !gb ? 0 : ga === gb ? 2.5 : -0.8; };
  // T5: corazones de cada reina (medio corazón = 1)
  const heartsTxt = (k) => { const h = (S.hearts[k] || 0) / 2; return h ? `❤️ ${String(h).replace(".", ",")}` : "🤍 0"; };
  const heartChip = (q) => (twistOf() === "corazon" ? `<em class="heart-chip">${heartsTxt(keyOf(q))}</em>` : "");
  const groupChip = (q) => { const g = groupOf(q); return g ? `<em class="group-chip">${g.icon} ${esc(g.name)}</em>` : ""; };
  const groupMembers = (g) => g.members.map(qById).filter((q) => q && S.rivals.includes(q));
  function formGroups(then) {
    S.flags.groups = true;
    const pool = shuffle(S.rivals.slice());
    const n = pool.length >= 9 ? 3 : 2;
    const names = shuffle(GRUPOS.nombres).slice(0, n);
    S.groups = names.map((nm, i) => ({ id: "g" + i, name: nm.name, icon: nm.icon, members: [] }));
    // Reparto en ronda: nunca deja un grupo con menos de 2 aunque queden pocas
    const take = Math.min(pool.length, n * 4);
    pool.slice(0, take).forEach((q, i) => S.groups[i % n].members.push(q.id));
    S.groups = S.groups.filter((g) => g.members.length >= 2);
    if (S.groups.length < 2) { S.groups = null; S.flags.groups = false; return then(); }
    const [A, B] = S.groups;
    const a = qById(A.members[0]), b = qById(B.members[0]);
    const ctx = { ...ctxWith(a, { r2: b }), q: { r1: a, r2: b, r3: b }, r1: a.name, r2: b.name, g1: A.name, g2: B.name, tension: true };
    scene("formGroups", pickFresh(GRUPOS.formacion), ctx, () => {
      header();
      body().innerHTML = `
        <div class="story-card">
          <p class="eyebrow">🤝 Alianzas en el taller</p>
          <h3>Se han formado grupos</h3>
          <div class="groups">${S.groups.map((g, i) => `<div class="group-col" style="--i:${i}"><b>${g.icon} ${esc(g.name)}</b>${groupMembers(g).map((q) => `<span><i style="background-image:url('${photo(q)}')"></i>${esc(q.name)}</span>`).join("")}</div>`).join("")}</div>
          <p class="muted">Las que no están en ningún grupo van por libre.</p>
          <button class="btn btn-primary" id="story-next">Continuar</button>
        </div>`;
      $("#story-next").addEventListener("click", () => invite(then));
    });
  }
  // Te invitan los grupos que mejor te ven (o todos, si caes bien)
  function invite(then) {
    const avg = (g) => groupMembers(g).reduce((t, q) => t + relOf(q), 0) / Math.max(1, groupMembers(g).length);
    const inv = S.groups.slice().sort((x, y) => avg(y) - avg(x)).slice(0, 2);
    const g = inv[0], lead = groupMembers(g)[0];
    const ctx = { ...ctxWith(lead), q: { r1: lead }, r1: lead.name, g1: g.name, g2: (inv[1] || g).name };
    scene("invite", pickFresh(GRUPOS.invitacion), ctx, () => {
      body().innerHTML = `
        <div class="story-card">
          <p class="eyebrow">🤝 Te quieren en su grupo</p>
          <h3>¿Con quién te alías?</h3>
          <p>Las de tu grupo te apoyarán y votarán a tu favor. Los otros grupos... no tanto.</p>
          <div class="choice-col">${inv.map((x, i) => `<button class="btn btn-ghost" data-g="${i}">${x.icon} Unirme a ${esc(x.name)} <small>(${groupMembers(x).map((q) => esc(q.name)).join(", ")})</small></button>`).join("")}
            <button class="btn btn-primary" id="solo">🦋 Ir por libre</button></div>
        </div>`;
      body().querySelectorAll("[data-g]").forEach((b) => b.addEventListener("click", () => {
        const x = inv[+b.dataset.g];
        S.myGroup = x.id;
        groupMembers(x).forEach((q) => { S.rel[q.id] = clamp(relOf(q) + 1, -3, 3); });
        S.groups.filter((o) => o !== x).forEach((o) => groupMembers(o).forEach((q) => (S.rel[q.id] = clamp(relOf(q) - 1, -3, 3))));
        Toast.show(`${x.icon} Ahora eres de ${x.name}`, "Tu grupo te cubre las espaldas");
        header();
        then();
      }));
      $("#solo").addEventListener("click", () => {
        S.advice += 3;
        Toast.show("🦋 Vas por libre", "Sin deudas con nadie y con la cabeza en el reto");
        then();
      });
    });
  }
  // Escena de grupos: choque entre bandos, apoyo del tuyo o roce interno
  function groupEvent(then) {
    const live = (S.groups || []).filter((g) => groupMembers(g).length >= 1);
    const mine = live.find((g) => g.id === S.myGroup);
    const r = Math.random();
    if (mine && groupMembers(mine).length && r < 0.3) {
      const [a, b] = shuffle(groupMembers(mine));
      const other = live.find((g) => g !== mine) || mine;
      const ctx = { ...ctxWith(a, { r2: b || a }), q: { r1: a, r2: b || a, r3: b || a }, r1: a.name, r2: (b || a).name, g1: mine.name, g2: other.name };
      return scene("groupEvent", pickFresh(GRUPOS.apoyo), ctx, () => {
        S.advice += 3;
        Toast.show(`${mine.icon} Tu grupo te apoya`, "Llegas al reto más arropada");
        then();
      });
    }
    if (mine && groupMembers(mine).length && r < 0.42) {
      const a = pick1(groupMembers(mine));
      const other = live.find((g) => g !== mine) || mine;
      const ctx = { ...ctxWith(a), q: { r1: a }, r1: a.name, g1: mine.name, g2: other.name, tension: true };
      return scene("groupEvent", pickFresh(GRUPOS.roce), ctx, then, [
        { txt: "Tienes razón. Estoy contigo, no lo dudes.", rel: { r1: 1 }, reply: ["r1", "Eso quería oír."] },
        { txt: "Yo hablo con quien quiera, {r1}.", rel: { r1: -2 }, bonus: 120, reply: ["r1", "Vale. Pues ya sé a qué atenerme."] },
      ]);
    }
    const pair = shuffle(live.filter((g) => groupMembers(g).length)).slice(0, 2);
    if (pair.length < 2) return then();
    // Si eres de uno de los dos, ese va primero
    if (mine && pair.includes(mine) && pair[0] !== mine) pair.reverse();
    const [G1, G2] = pair;
    const a = pick1(groupMembers(G1)), b = pick1(groupMembers(G2));
    const ctx = { ...ctxWith(a, { r2: b }), q: { r1: a, r2: b, r3: b }, r1: a.name, r2: b.name, g1: G1.name, g2: G2.name, tension: true };
    const sideWith = (G, d) => groupMembers(G).forEach((q) => (S.rel[q.id] = clamp(relOf(q) + d, -3, 3)));
    const ev = pickFresh(GRUPOS.choque);
    const choices = mine === G1
      ? [
          { txt: "¡Eso, {r1}! {g1} no se calla.", effect: "g1", bonus: 100, reply: ["r2", "Claro, la otra de {g1}. Qué sorpresa."] },
          { txt: "Chicas, calma, que así no ganamos nadie.", effect: "calma", reply: ["r1", "Vale... pero que conste que empezaron ellas."] },
        ]
      : [
          { txt: "Estoy con {r1} y {g1}.", effect: "g1", reply: ["r1", "¡Gracias! Por fin alguien con criterio."] },
          { txt: "Pues yo con {r2}. Tiene razón.", effect: "g2", reply: ["r2", "¿Ves? Hasta {yo} lo ve."] },
          { txt: "(Seguir a lo tuyo, que esto no va contigo)", effect: "nada", reply: ["r1", "Muy bien, Suiza. Tú sigue cosiendo."] },
        ];
    scene("groupEvent", ev.lines, ctx, then, choices.map((c) => ({ ...c, after: c.effect })));
    // Consecuencias: el choque cambia cómo te ven los dos grupos
    pendingSide = (eff) => {
      if (eff === "g1") { sideWith(G1, 1); sideWith(G2, -1); Toast.show(`${G1.icon} ${G1.name} te lo agradece`, `${G2.icon} ${G2.name} toma nota`); }
      if (eff === "g2") { sideWith(G2, 1); sideWith(G1, -1); Toast.show(`${G2.icon} ${G2.name} te lo agradece`, `${G1.icon} ${G1.name} toma nota`); }
      if (eff === "calma") { S.advice += 2; Toast.show("🕊️ Pones paz", "El taller respira y tú también"); }
      if (eff === "nada") S.advice += 1;
      header();
    };
  }
  let pendingSide = null;

  // Fondo de la escena (taller, plató, jurado...)
  const SETS = { werkroom: ["werkroom.jpg", "werkroom3.jpg"], lounge: ["werkroom2.jpg"], stage: ["stage.jpg"], panel: ["panel.jpg"] };
  function setSet(name) {
    const el = $("#story-set");
    if (!el) return;
    if (!name) { el.style.backgroundImage = ""; el.dataset.set = ""; return; }
    if (el.dataset.set === name) return;
    el.dataset.set = name;
    const list = SETS[name] || SETS.werkroom;
    el.style.backgroundImage = `url('./images/sets/${list[(S ? S.ep : 0) % list.length]}')`;
  }

  // Track record a mano en cualquier decisión
  const trackBtn = () => `<button class="btn btn-ghost small-btn track-peek">📊 Ver track record</button>`;
  function bindTrack() {
    body().querySelectorAll(".track-peek").forEach((b) => b.addEventListener("click", (e) => {
      e.stopPropagation();
      const m = document.createElement("div");
      m.className = "track-modal";
      m.innerHTML = `<div class="story-card track-card"><h3>Track record</h3>${trackHTML()}<button class="btn btn-primary" id="tm-close">Cerrar</button></div>`;
      document.body.append(m);
      const close = () => m.remove();
      m.querySelector("#tm-close").addEventListener("click", close);
      m.addEventListener("click", (ev) => ev.target === m && close());
    }));
  }

  // --------------------------- Relaciones ----------------------------------
  // -3 (enemiga) ... +3 (aliada). Aliada >= 2, enemiga <= -2
  const relOf = (q) => (q && S.rel[q.id]) || 0;
  const relLabel = (q) => { const r = relOf(q); return r >= 2 ? "💞 Aliada" : r >= 1 ? "Buena relación" : r <= -2 ? "😒 Mala relación" : r <= -1 ? "Tensión" : "Neutral"; };
  const allies = () => S.rivals.filter((q) => relOf(q) >= 2);
  const enemies = () => S.rivals.filter((q) => relOf(q) <= -2);
  function changeRel(q, d) {
    if (!q || !d || q === S.queen) return;
    const before = relOf(q);
    const after = clamp(before + d, -3, 3);
    S.rel[q.id] = after;
    if (after >= 2 && before < 2) Toast.show(`💞 ${q.name} es tu aliada`, "Te echará un cable en los retos");
    else if (after <= -2 && before > -2) Toast.show(`😒 Con ${q.name} no hay buen rollo`, "Lo vais a notar en el taller");
    else if (after > before) Toast.show(`💗 ${q.name}`, "Os lleváis un poco mejor");
    else if (after < before) Toast.show(`💢 ${q.name}`, "Se ha enfriado la cosa");
    if (allies().length >= 3) Achievements.unlock("aliadas");
    if (after <= -2) Achievements.unlock("enemiga");
    if (after <= -2 && before > -2) makeNemesis(q, "choque");
  }
  function relBonus() {
    return clamp(allies().length * 4 - enemies().length * 4, -10, 12);
  }
  // Nivel de cada rival: sale de sus estadísticas, su racha y el azar del día
  const skillOf = (q) => 40 + Object.values(q.stats).reduce((a, b) => a + b, 0) * 2;
  // Cada temporada de la franquicia es algo más dura que la anterior
  // ===================== EQUILIBRIO: todos los números de dificultad en un solo sitio =====================
  // Cambia aquí y comprueba el reparto con DFTC_SIM("es1", 500) en la consola
  // Los números viven en src/core/balance.ts (con tests)
  const BALANCE = DFTC.BALANCE;
  const seasonBoost = () => Math.min(BALANCE.temporada.subidaMax, ((S.season && S.season.index) || 0) * BALANCE.temporada.subidaPorTemporada);
  // Lo que cuenta en el reto de la semana: los atributos que pide (y el estilo si hay pasarela)
  const retoAttrOf = (q) => {
    const a = attrsOf(q), r = RETOS[S.curTipo] || {};
    const keys = r.attrs && r.attrs.length ? r.attrs : Object.keys(ATTR_NAMES);
    const v = keys.reduce((t, k) => t + (a[k] || 5), 0) / keys.length;
    return r.noRunway || !r.attrs ? v : v * 0.7 + (a.estilo || 5) * 0.3;
  };
  // Detrás de cámaras: cada semana cada reina "tira el dado". Sus atributos del reto marcan las probabilidades
  // de que le salga brillante, buena, normal, floja o un desastre; la nota sale de ese resultado.
  const DADO = BALANCE.dado;
  const DADO_NOTA = BALANCE.notas;
  // El dado vive en src/core/dado.ts; aquí se le pasa el azar con semilla de la partida
  const dadoProbs = (a) => DFTC.dadoProbs(a, DADO);
  const tirarDado = (a) => DFTC.tirarDado(a, Math.random);
  const notaDe = (cat, pos) => DFTC.notaDe(cat, pos, DADO_NOTA);
  // Rachas, rasgos, némesis y temporadas más duras mueven un poco el dado (en puntos de atributo)
  const dadoExtra = (q) => (seasonBoost() / 5) + clamp(S.form[q.id] || 0, -8, 8) / 6 + traitMod(q) / 6 + (isNem(q) && !S.meOut ? Math.min(5, S.nemesis.heat * 0.6) / 6 : 0);
  const rivalScore = (q) => clamp(notaDe(tirarDado(retoAttrOf(q) + dadoExtra(q)), Math.random()), 5, 99);
  // Tu nota: tu juego mueve tu dado (bordarlo sube escalones, hacerlo mal los baja), pero no lo asegura
  function myDado(played) {
    const steps = DFTC.pasosDeJuego(played, Math.random);
    const a = retoAttrOf(S.queen) + seasonBoost() / 10;
    const cat = clamp(tirarDado(a) - steps, 0, 4);
    return notaDe(cat, 0.35 + clamp((played - 40) / 60, 0, 1) * 0.65);
  }

  function header() {
    $("#story-season").textContent = `Modo historia · ${S.season.name} · ${seasonInfo().lema || S.season.franchise.name}`;
    let chip = "";
    const tw = twistOf();
    if (tw === "moneda") chip = "🪙 Bottom de 3 y moneda al aire";
    if (tw === "corazon") { const h = (S.hearts.me || 0) / 2; chip = `❤️ Tienes ${String(h).replace(".", ",")} ${h === 1 ? "corazón" : "corazones"}`; }
    if (tw === "suerte") chip = S.luck === undefined ? "🍀 Cajitas por abrir" : S.luck === "me" ? "🍀 ¡La tienes tú! (en secreto)" : S.luck ? "🍀 ¿Quién la tendrá?" : "🍀 Ya se ha usado";
    if (tw === "repesca") chip = S.flags.repesca ? "🔁 Segunda Oportunidrag: hecha" : "🔁 Segunda Oportunidrag: pendiente";
    if (tw === "allstars") chip = "💄 Decide la ganadora";
    if (tw === "winners") chip = `⭐ Nadie se va · tus estrellas: ${(S.stars || {}).me || 0}${S.ep === winnersWeeks() ? " · 🌟 Esta semana el top 2 gana 3 estrellas" : ""}${S.block && S.block.ep === S.ep ? ` · 🚫 Bloqueada: ${S.block.id === "me" ? "tú" : nameOfKey(S.block.id)}` : ""}`;
    $("#story-ep").textContent = S.meOut ? "Fuera de la competición" : isFinal() ? (S.flags.reunion ? "Gran final" : "El reencuentro") : `Episodio ${S.ep}`;
    if (chip) $("#story-season").innerHTML += ` <span class="twist-chip">${esc(chip)}</span>`;
    const fm = fame();
    if (fm) $("#story-season").innerHTML += ` <span class="twist-chip fame-chip">${FAMA[fm].icon} ${esc(FAMA[fm].n)}</span>`;
    const nq = nemActive();
    if (nq && S.nemesis.announced) $("#story-season").innerHTML += ` <span class="twist-chip nem-chip">⚔️ Némesis: ${esc(nq.name)}</span>`;
    $("#story-exit").innerHTML = "<i>💾</i><span>Guardar y salir</span>";
    $("#story-count").textContent = S.meOut ? "Fuera de la competición" : `${S.rivals.length + 1} en competición · ${S.out.length} fuera`;
    $("#story-shop").hidden = false;
    $("#story-board").hidden = false;
    $("#story-ia").hidden = true;
    $("#story-shop .closet-money").textContent = euros(Closet.money);
    const all = S.meOut ? S.rivals : [S.queen, ...S.rivals];
    $("#story-cast").innerHTML =
      all
        .map((q) => {
          const r = q === S.queen ? "me" : relOf(q) >= 2 ? "ally" : relOf(q) <= -2 ? "enemy" : "";
          const ht = twistOf() === "corazon" ? ` · ${heartsTxt(keyOf(q))}` : "";
          return `<i title="${esc(q.name)} · ${esc(q === S.queen ? "Tú" : relLabel(q))}${ht}" data-h="${twistOf() === "corazon" && S.hearts[keyOf(q)] ? String(S.hearts[keyOf(q)] / 2).replace(".", ",") : ""}" class="${r}" style="background-image:url('${photo(q)}')"></i>`;
        })
        .join("") +
      S.out.map((q) => `<i title="${esc(q.name)}" class="out" style="background-image:url('${photo(q)}')"></i>`).join("");
  }

  // --------------------------- Críticas del jurado --------------------------
  function buildCritique(score, verdict, forced) {
    const rs = S.lastParts ? S.lastParts.reto : score;
    const nivel = forced || (rs >= 75 ? "top" : rs >= 50 ? "mid" : "low");
    const bank = (JURADO.reto[S.curTipo] || JURADO.reto.pasarela)[nivel];
    // El look de pasarela no siempre va a la par que el reto
    const w = S.lastParts && S.lastParts.pasarela;
    const lookN = typeof w === "number" ? (w >= 75 ? "top" : w >= 50 ? "mid" : "low") : Math.random() < 0.65 ? nivel : pick1(["top", "mid", "low"]);
    const judgeFirst = Math.random() < 0.5;
    const lines = [];
    lines.push(["host", pickFresh(JURADO.aperturaSupreme)]);
    const a = ["host", pickFresh(bank)];
    const lk = S.lastLook;
    const b = ["judge", lk && Math.random() < 0.7 ? pickFresh(ESTILO_CRITICA[lookN]).replace("{pieza}", (lookN === "top" ? lk.best : lk.worst).toLowerCase()).replace("{cat}", lk.cat) : pickFresh(JURADO.pasarela[lookN])];
    lines.push(a, [b[0], `${pickFresh(JURADO.aperturaAna)} ${b[1]}`]);
    if (Math.random() < 0.55) lines.push(...pickFresh(JAVIS.critica[nivel]));
    if (score >= 90 && (verdict === "win" || verdict === "none")) lines.push(["judge", "Has subido el nivel esta semana."]);
    if (score < 30) lines.push(["host", "Hoy te he visto despistada, {yo}."]);
    if (Math.random() < 0.85) lines.push(...personalCrit());
    if (JURADO.veredicto[verdict]) lines.push(["host", pickFresh(JURADO.veredicto[verdict])]);
    return lines;
  }

  // ------------------------------ Memoria -----------------------------------
  // Las compañeras recuerdan si las salvaste o las condenaste (y si era justo)
  function remember(q, kind, fair) {
    if (!q || q === S.queen) return;
    S.memories.push({ id: q.id, kind, fair, ep: S.ep });
  }
  function memoryTalk(then) {
    const pend = S.memories.filter((m) => m.ep < S.ep);
    S.memories = S.memories.filter((m) => m.ep >= S.ep);
    const m = pend.reverse().find((x) => S.rivals.some((r) => r.id === x.id));
    if (!m) return then();
    const q = qById(m.id);
    const bank = m.kind === "salvada" ? (m.fair ? MEMORIA.gracias.justa : MEMORIA.gracias.peor) : m.fair ? MEMORIA.rencor.justo : MEMORIA.rencor.injusto;
    const v = pickFresh(bank);
    scene("memoryTalk", v.lines, { ...ctxWith(q), q: { r1: q }, r1: q.name, tension: m.kind !== "salvada" }, () => {
      if (v.after) changeRel(q, v.after);
      then();
    }, v.choices);
  }

  // ----------------------------- Track record -----------------------------
  const EP_SHORT = { pasarela: "Pasarela", snatch: "Snatch Game", baile: "Coreografía", diseno: "Diseño", lectura: "Biblioteca", rusical: "Rusical", maquillaje: "Maquillaje", equipos: "Girl Groups", comedia: "Stand-up", roast: "Roast", actuacion: "Interpretación", ball: "Ball", makeover: "Makeover", fotos: "Fotos", impro: "Improvisación" };
  EP_SHORT.diseno = "Materiales";
  EP_SHORT.publicidad = "Publicidad";
  EP_SHORT.lalaparuza = "Lalaparuza";
  EP_SHORT.equipos = "Girl Groups";
  EP_SHORT.repescaStand = "Segunda Oportunidrag";
  function mark(q, lab) {
    const k = keyOf(q);
    (S.track[k] = S.track[k] || {})[S.ep] = lab;
  }
  const TRACK_CLASS = (l) =>
    l === "WIN" || l === "WINNER" ? "t-win" : l === "BWIN" ? "t-win t-blocked" : l === "BTOP" ? "t-top2 t-blocked" : l === "TOP2" ? "t-top2" : l === "HIGH" ? "t-high" : l === "SAFE" ? "t-safe" : l === "LOW" ? "t-low" : /^BTM/.test(l) ? "t-btm" : l === "ELIM" ? "t-elim" : l === "RUNNER-UP" ? "t-runner" : l === "FINAL" ? "t-final" : l === "FINAL-MISSC" ? "t-miss" : l === "3ª" ? "t-third" : l === "MISSC" ? "t-miss" : l === "RTRN" ? "t-rtrn" : l === "MC" ? "t-mc" : l === "FINALISTA" ? "t-third" : l === "QOSD" ? "t-qosd" : l === "ELIMF" ? "t-elim" : "t-none";
  const LAB_ES = { WIN: "WIN", HIGH: "HIGH", SAFE: "SAFE", LOW: "LOW", BTM2: "BTM2", BTM3: "BTM3", ELIM: "ELIM", TOP2: "TOP2", WINNER: "GANADORA", "RUNNER-UP": "RUNNER-UP", FINAL: "RUN", "FINAL-MISSC": "MISS CONGENIALITY", "3ª": "3ª/4ª", MISSC: "MISS CONGENIALITY", RTRN: "RTRN", MC: "MC", FINALISTA: "FINALISTA", SINESTRELLA: "SIN ⭐", QOSD: "QoSDADHH", ELIMF: "ELIMINADA", BWIN: "WIN", BTOP: "TOP2" };
  // Puntuación del track record (PPE) de tu reina: media de sus resultados semana a semana
  function myPPE() {
    return DFTC.ppe(Object.values(S.track.me || {}));
  }
  function trackHTML() {
    const eps = Object.keys(S.epNames).map(Number).sort((a, b) => a - b);
    const everyone = [S.queen, ...S.rivals, ...S.out];
    const count = (k, test) => eps.filter((e) => test((S.track[k] || {})[e] || "")).length;
    // Orden de las que siguen: cómo quedaron en el último episodio con resultados
    const ORDER = { WINNER: 0, WIN: 1, BWIN: 1, "RUNNER-UP": 2, TOP2: 3, BTOP: 3, FINAL: 3, HIGH: 4, "3ª": 5, FINALISTA: 5, QOSD: 5.5, SAFE: 6, SINESTRELLA: 6.8, ELIMF: 8.5, LOW: 7, BTM2: 8, BTM3: 8, ELIM: 9, MC: 6, RTRN: 6.5 };
    const lastScored = [...eps].reverse().find((e) => everyone.some((q) => ORDER[(S.track[keyOf(q)] || {})[e]] !== undefined));
    const lastRank = (k) => { const l = lastScored && (S.track[k] || {})[lastScored]; return ORDER[l] !== undefined ? ORDER[l] : 7.5; };
    const lastEp = (k) => Math.max(0, ...eps.filter((e) => (S.track[k] || {})[e] && S.track[k][e] !== "MISSC"));
    const isOut = (q) => (q === S.queen ? S.meOut || !!S.finished && !S.wonAll : S.out.includes(q));
    const rows = everyone
      .filter((q, i, a) => a.indexOf(q) === i)
      .map((q) => {
        const k = keyOf(q);
        return {
          q, k, out: isOut(q), last: lastEp(k),
          w: count(k, (l) => l === "WIN" || l === "BWIN" || l === "WINNER"), h: count(k, (l) => l === "HIGH" || l === "TOP2" || l === "BTOP"),
          s: count(k, (l) => l === "SAFE"), lo: count(k, (l) => l === "LOW"), b: count(k, (l) => /^BTM/.test(l)),
        };
      })
      .sort((a, b) => a.out - b.out || (a.out ? b.last - a.last : 0) || lastRank(a.k) - lastRank(b.k) || b.w - a.w || b.h - a.h || b.s - a.s || a.lo - b.lo || a.b - b.b);
    const ppe = (k) => {
      const V = DFTC.PPE_VALOR;
      const v = eps.map((e) => V[(S.track[k] || {})[e]]).filter((x) => x !== undefined);
      return v.length ? (v.reduce((a, b) => a + b, 0) / v.length).toFixed(2) : "–";
    };
    // Las que se van en el mismo episodio (doble eliminación) comparten puesto: 7º/8º
    const elimAt = (r) => r.out && (S.track[r.k] || {})[r.last] === "ELIM" ? r.last : null;
    // All Winners: la final deja a cada reina en su puesto exacto
    const FP = S.finalPlace;
    const fpOk = FP && rows.every((r) => FP[r.k]);
    const fo = (k) => (typeof FP[k] === "object" ? FP[k].o : FP[k]);
    if (fpOk) rows.sort((a, b) => fo(a.k) - fo(b.k) || b.w - a.w);
    const rk = fpOk ? rows.map((r) => (typeof FP[r.k] === "object" ? FP[r.k].r : `${FP[r.k]}º`)) : rows.map((r, i) => {
      const e = elimAt(r);
      if (e == null) return `${i + 1}º`;
      let a = i, b = i;
      while (a > 0 && elimAt(rows[a - 1]) === e) a--;
      while (b < rows.length - 1 && elimAt(rows[b + 1]) === e) b++;
      return a === b ? `${i + 1}º` : `${a + 1}º/${b + 1}º`;
    });
    return `
      <div class="track-wrap"><table class="track">
        <thead><tr><th>#</th><th>Reina</th>${eps.map((e) => `<th>Ep. ${e}<small>${esc(S.epNames[e])}</small></th>`).join("")}${twistOf() === "corazon" ? "<th>❤️</th>" : ""}<th>PPE</th></tr></thead>
        <tbody>${rows
          .map((r, i) => `<tr class="${r.q === S.queen ? "me" : ""} ${r.out ? "out" : ""}" style="--i:${i}"><td class="rk">${rk[i]}</td>
            <td class="qn"><i style="background-image:url('${photo(r.q)}')"></i><span>${esc(r.q.name)}${r.q === S.queen ? " <b>(tú)</b>" : roleKnown(r.q) ? ` <small title="${esc(roleOf(r.q).name)}">${roleOf(r.q).icon}</small>` : ""}</span></td>
            ${eps.map((e) => { const l = (S.track[r.k] || {})[e]; return `<td class="${l ? TRACK_CLASS(l) : r.last && e > r.last && S.epNames[e] !== "Reencuentro" ? "t-gone" : "t-none"}">${l ? LAB_ES[l] || l : ""}</td>`; }).join("")}
            ${twistOf() === "corazon" ? `<td class="hearts">${r.out ? "–" : heartsTxt(r.k)}</td>` : ""}<td class="ppe">${ppe(r.k)}</td></tr>`)
          .join("")}</tbody>
      </table></div>`;
  }
  function showTrack(then, label = "Siguiente episodio", note = "") {
    header();
    body().innerHTML = `
      <div class="story-card track-card">
        <p class="eyebrow">Fin del episodio ${S.ep}${S.epNames[S.ep] ? ` · ${esc(S.epNames[S.ep])}` : ""}</p>
        ${note ? `<p class="track-note">${note}</p>` : ""}
        <h3>Track record</h3>
        ${trackHTML()}
        <button class="btn btn-primary" id="track-next">${label}</button>
      </div>`;
    $("#track-next").addEventListener("click", then, { once: true });
  }

  // Puntos de control dentro del episodio: tras el minirreto y tras reto + pasarela
  function checkpoint(stage, extra = {}) {
    S.phase = { ep: S.ep, stage, advice: S.advice, runwayBonus: S.runwayBonus || 0, captains: S.captains ? S.captains.map((q) => keyOf(q)) : null, ...extra };
    save();
  }
  function resumeMid() {
    const ph = S.phase;
    // Al reanudar, el flujo vuelve a la fase del punto de control
    S.flow = ph.stage === "mini" ? "minirreto" : ph.stage === "runway" ? "reto" : "pasarela";
    const byKey = (k) => (k === "me" ? S.queen : qById(k));
    S.advice = ph.advice || 0;
    S.runwayBonus = ph.runwayBonus || 0;
    S.captains = ph.captains ? ph.captains.map(byKey).filter(Boolean) : null;
    header();
    if (ph.stage === "mini") {
      setReto();
      return Curtain.run(() => afterMini(), `EPISODIO ${S.ep}`);
    }
    if (ph.stage === "runway") {
      // Reto hecho: toca la pasarela
      S.curTipo = ph.tipo;
      S.curEpTipo = S.ep;
      S.curTitulo = ph.titulo;
      S.team = ph.team ? ph.team.map(byKey).filter(Boolean) : null;
      S.cGroups = ph.cGroups || null;
      S.lastBonus = ph.bonus;
      return Curtain.run(() => runway(closeReto(ph.raw, ph.bonus, ph.titulo)), `EPISODIO ${S.ep}`);
    }
    // Reto y pasarela ya hechos: seguimos en los resultados
    S.curTipo = ph.tipo;
    S.curEpTipo = S.ep;
    S.lastParts = ph.parts;
    S.lastBonus = ph.bonus;
    S.team = ph.team ? ph.team.map(byKey).filter(Boolean) : null;
    S.cGroups = ph.cGroups || null;
    Curtain.run(() => results(ph.score, ph.titulo), `EPISODIO ${S.ep}`);
  }

  // El episodio ha terminado: se guarda YA (antes de ver el track record o salir)
  function endEpisodeBtn() {
    flowGo("fin");
    S.phase = null;
    save();
    const b = $("#story-next");
    if (b) b.addEventListener("click", nextEpisode);
  }
  function nextEpisode() {
    save();
    if (S.ep > 0 && S.trackShown !== S.ep && Object.keys(S.epNames).length) {
      S.trackShown = S.ep;
      return showTrack(nextEpisode);
    }
    save();
    // Evita que un doble clic lance dos episodios seguidos
    if (S.epPending) return;
    S.epPending = true;
    Curtain.run(() => { S.epPending = false; episode(); }, twistOf() === "winners" && S.ep >= winnersWeeks() ? "GRAN FINAL" : isFinal() ? (S.flags.reunion ? "GRAN FINAL" : "EL REENCUENTRO") : `EPISODIO ${S.ep + 1}`);
  }
  function episode() {
    setSet("werkroom");
    store.set(EPSTART_KEY, snapshot());
    S.ep++;
    flowGo("inicio");
    S.advice = 0;
    S.helped = false;
    header();
    const tw = twistOf();
    const go = () => {
      if (twistOf() === "winners" && S.ep > winnersWeeks()) return winnersFinal();
      if (isFinal()) return episodeFinal();
      workroom();
    };
    // All Stars: primero se enseña el pintalabios que había elegido la que perdió el lip sync
    if (S.asPending && S.asPending.ep === S.ep - 1) return revealPendingLipstick(go);
    if (S.asPending) S.asPending = null;
    go();
  }
  // Con 4 reinas: primero el reencuentro (Miss Simpatía) y luego la gran final
  function episodeFinal() {
    header();
    if (!S.flags.reunion) return reunion();
    finale();
  }

