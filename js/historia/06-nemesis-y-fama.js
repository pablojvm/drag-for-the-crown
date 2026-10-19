  // ------------------------------ Sistema Némesis ------------------------------
  // Memoria entre temporadas: cada reina tiene rasgos, poder y cicatrices con las demás.
  // En una temporada normal todas entran nuevas: nadie se acuerda de nada (lo de esta temporada vive en S.nemLocal).
  // Todo se apunta también en la memoria permanente, que solo se usa en All Stars y All Winners: ahí sí vuelven con su historia.
  const NEM_KEY = "dftc-nemesis";
  const nemBlank = (d = {}) => ({ q: d.q || {}, f: d.f || {}, scars: d.scars || {}, known: d.known || [] });
  const memoriaOn = () => !S || !S.season || asLike(twistOf());
  const Nem = {
    perm() { return nemBlank(store.get(NEM_KEY, null) || {}); },
    local() { if (!S.nemLocal) S.nemLocal = nemBlank(); return S.nemLocal; },
    get() { return memoriaOn() ? this.perm() : this.local(); },
    // Cambia la memoria permanente y, si es una temporada normal, también la de esta temporada
    edit(fn) {
      const p = this.perm();
      fn(p);
      store.set(NEM_KEY, p);
      if (!memoriaOn()) fn(this.local());
    },
    power(id) { return (this.get().q[id] || {}).power || 0; },
    titles(id) { return (this.get().q[id] || {}).titles || []; },
    addPower(id, n) {
      const t = traitsOf(qById(id) || { id });
      if (n > 0 && t.car === "ambiciosa") n *= 2;
      this.edit((d) => { d.q[id] = { ...(d.q[id] || {}), power: clamp(((d.q[id] || {}).power || 0) + n, 0, 10) }; });
    },
    addTitle(id, name) { this.edit((d) => { d.q[id] = { ...(d.q[id] || {}), titles: [...((d.q[id] || {}).titles || []), name] }; }); },
    feel(a, b) { return this.get().f[`${a}>${b}`] || 0; },
    addFeel(a, b, n) {
      if (n < 0 && traitsOf(qById(a) || { id: a }).car === "rencorosa") n *= 2;
      const k = `${a}>${b}`;
      this.edit((d) => { d.f[k] = clamp((d.f[k] || 0) + n, -5, 5); });
    },
    scar(by, to, k) {
      const key = [by, to].sort().join("|");
      const e = { by, to, k, s: S.season.name, sid: S.season.id, ep: S.ep };
      this.edit((d) => { d.scars[key] = [...(d.scars[key] || []), e].slice(-8); });
    },
    scarsOf(a, b) { return this.get().scars[[a, b].sort().join("|")] || []; },
    knows(id, slot) { return this.get().known.includes(`${id}:${slot}`); },
    learn(id, slot) {
      if (this.knows(id, slot)) return false;
      this.edit((d) => { if (!d.known.includes(`${id}:${slot}`)) d.known.push(`${id}:${slot}`); });
      return true;
    },
  };
  // Rasgos fijos de cada reina (salen de su nombre: siempre los mismos)
  function traitsOf(q) {
    let h = 0;
    for (const c of String(q.id)) h = (h * 31 + c.charCodeAt(0)) >>> 0;
    const pick = (o, salt) => { const k = Object.keys(o); return k[(h >>> salt) % k.length]; };
    const fort = pick(RASGOS.fort, 0);
    let deb = pick(RASGOS.deb, 5);
    if (RASGOS.deb[deb].cat === fort) deb = "provocable";
    return { fort, deb, car: pick(RASGOS.car, 11) };
  }
  const RETO_CAT = { repescaStand: "comedia", snatch: "comedia", roast: "comedia", impro: "comedia", publicidad: "comedia", rusical: "baile", equipos: "baile", lalaparuza: "baile", diseno: "costura", ball: "costura", makeover: "costura", actuacion: "comedia" };
  // Efecto de los rasgos y del poder en la nota de una reina
  function traitMod(q) {
    const t = traitsOf(q), cat = RETO_CAT[S.curTipo];
    const B = BALANCE.rasgos;
    let m = Math.min(B.poderMax, Nem.power(q.id) * B.poderFactor);
    if (cat && t.fort === cat) m += B.fortaleza;
    if (cat && RASGOS.deb[t.deb].cat === cat) m += B.debilidad;
    if (t.fort === "pasarela" && !(RETOS[S.curTipo] || {}).noRunway) m += B.pasarela;
    return m;
  }
  function learnTrait(q, slot, how) {
    if (!q || !Nem.learn(q.id, slot)) return;
    const t = traitsOf(q), r = RASGOS[slot][t[slot]];
    Toast.show(`🔎 ${how || "Descubres algo"}: ${q.name}`, `${r.icon} ${r.n}`);
  }
  // Lo que pasa entre dos reinas queda para siempre
  function nemEvent(kind, a, b) {
    if (!a || !b || a === b) return;
    if (kind === "elim") { Nem.addFeel(b.id, a.id, -2); Nem.addPower(a.id, 1); Nem.addPower(b.id, -1); }
    if (kind === "vote") Nem.addFeel(b.id, a.id, -3);
    if (kind === "save") Nem.addFeel(b.id, a.id, 3);
    if (kind === "humill") Nem.addFeel(b.id, a.id, -2);
    if (kind === "betray") Nem.addFeel(b.id, a.id, -4);
    if (kind === "pact") { Nem.addFeel(b.id, a.id, 1); Nem.addFeel(a.id, b.id, 1); }
    Nem.scar(a.id, b.id, kind);
    logEv({ elim: `${a.name} gana el lip sync a ${b.name}`, vote: `${a.name} decide que ${b.name} se vaya`, save: `${a.name} salva a ${b.name}`, humill: `${a.name} ataca el punto débil de ${b.name}`, betray: `${a.name} traiciona a ${b.name}`, pact: `${a.name} y ${b.name} hacen un pacto` }[kind] || kind);
  }
  // Rango de cada reina en el taller (como la jerarquía de capitanes)
  function rankOf(q) {
    const eps = Object.keys(S.epNames).map(Number);
    const labs = eps.map((e) => (S.track[keyOf(q)] || {})[e]).filter(Boolean);
    const sc = labs.reduce((t, l) => t + (l === "WIN" || l === "TOP2" ? 3 : l === "HIGH" ? 1 : /^BTM/.test(l) ? -2 : l === "LOW" ? -1 : 0), 0) + Nem.power(q.id);
    return sc >= 7 ? ["👑", "Favorita"] : sc >= 3 ? ["⚔️", "Amenaza"] : sc <= -3 ? ["🪢", "En la cuerda floja"] : ["🙂", "Del montón"];
  }
  // Primer día: las reinas con historia contigo te la recuerdan
  function historyScene(then) {
    if (S.ep !== 1 || S.flags.histDone) return then();
    S.flags.histDone = 1;
    const me = S.queen.id;
    const cands = S.rivals.map((q) => ({ q, sc: Nem.scarsOf(me, q.id), f: Nem.feel(q.id, me) })).filter((x) => x.sc.length).sort((a, b) => Math.abs(b.f) - Math.abs(a.f)).slice(0, 2);
    if (!cands.length) return then();
    const lines = [["host", "Algunas de estas caras ya las conocéis... y ellas no se han olvidado de ti."]];
    cands.forEach(({ q, sc }) => {
      const last = sc[sc.length - 1];
      const bank = CICATRICES[`${last.k}:${last.by === me ? "me" : "her"}`];
      if (bank) lines.push([`r${lines.length}`, pick1(bank).replace("{s}", last.s)]);
    });
    const ctx = { ...ctxWith(cands[0].q, { r2: cands[1] && cands[1].q }), q: { r1: cands[0].q, r2: cands[1] ? cands[1].q : cands[0].q }, r1: cands[0].q.name, r2: cands[1] ? cands[1].q.name : "", tension: cands.some((c) => c.f < 0) };
    scene("historyScene", lines.map(([k, t], i) => [i === 0 ? "host" : i === 1 ? "r1" : "r2", t]), ctx, then);
  }
  // Rumores del taller: peleas, ascensos y viejas cuentas de otras temporadas
  function radioLines() {
    const out = [];
    const all = S.rivals;
    for (let i = 0; i < all.length && out.length < 1; i++) for (let j = 0; j < all.length && out.length < 1; j++) {
      if (i === j) continue;
      const sc = Nem.scarsOf(all[i].id, all[j].id).filter((x) => x.sid !== S.season.id && ["elim", "vote", "save"].includes(x.k));
      if (sc.length && Math.random() < 0.5) { const l = sc[sc.length - 1]; out.push(pick1(RADIO[l.k]).replace("{a}", qById(l.by).name).replace("{b}", qById(l.to).name).replace("{s}", l.s)); }
    }
    const crowned = all.find((q) => Nem.titles(q.id).length);
    if (crowned && Math.random() < 0.4) out.push(pick1(RADIO.corona).replace("{a}", crowned.name).replace("{s}", Nem.titles(crowned.id).slice(-1)[0]));
    const fav = all.find((q) => rankOf(q)[1] === "Favorita");
    if (fav && out.length < 2 && Math.random() < 0.5) out.push(pick1(RADIO.ascenso).replace("{a}", fav.name));
    if (out.length < 2 && all.length >= 3 && Math.random() < 0.4) { const [a, b] = shuffle(all); out.push(pick1(RADIO.pelea).replace("{a}", a.name).replace("{b}", b.name)); }
    return out.slice(0, 2);
  }
  // Pactos: una aliada te cuenta secretos de las demás... o te traiciona
  function pactScene(then) {
    const pacts = S.rivals.filter((q) => S.pacts && S.pacts[q.id]);
    if (!pacts.length) return then();
    const q = pick1(pacts), t = traitsOf(q);
    const myLast = (S.track.me || {})[S.ep - 1] || "";
    const pBetray = t.car === "leal" ? 0 : (t.car === "traicionera" ? 0.3 : 0.08) + (/^BTM|LOW/.test(myLast) ? 0.1 : 0) + (Nem.power(q.id) > Nem.power(S.queen.id) ? 0.08 : 0);
    const ctx = { ...ctxWith(q), q: { r1: q }, r1: q.name, tension: true };
    if (Math.random() < pBetray) {
      delete S.pacts[q.id];
      S.advice -= 5;
      nemEvent("betray", q, S.queen);
      learnTrait(q, "car", "Ahora lo sabes");
      return scene("pactScene", [["r1", pick1(["Lo siento, {yo}. Esto es una competición y yo he venido a ganar.", "He contado a todas lo que me dijiste. No es personal."])], ["me", "(No me lo puedo creer...)"]], ctx, () => {
        changeRel(q, -4);
        body().innerHTML = `
          <div class="story-card">
            <p class="eyebrow">🐍 ¡Traición!</p>
            <h3>${esc(q.name)} ha roto vuestro pacto</h3>
            <div class="vs"><img src="${photo(S.queen)}"><span>🗡️</span><img src="${photo(q)}"></div>
            <p>Ha ido contando tus planes por el taller: <b>te va a costar caro en el próximo reto</b>. Esto no se va a olvidar.</p>
            <button class="btn btn-primary" id="story-next">Continuar</button>
          </div>`;
        $("#story-next").addEventListener("click", then);
      });
    }
    if (Math.random() > 0.55) return then();
    const target = shuffle(S.rivals.filter((r) => r !== q)).find((r) => ["deb", "fort", "car"].some((sl) => !Nem.knows(r.id, sl)));
    if (!target) return then();
    const slot = ["deb", "fort", "car"].find((sl) => !Nem.knows(target.id, sl));
    scene("pactScene", [["r1", `Te cuento algo de ${target.name}, como buena aliada...`], ["r1", `${RASGOS[slot][traitsOf(target)[slot]].d}. Úsalo bien.`]], ctx, () => { learnTrait(target, slot, `Tu aliada te cuenta`); then(); });
  }
  // Tablero de rivales: rango, rasgos descubiertos e historia contigo
  function openBoard() {
    if (document.querySelector(".shop-modal")) return;
    const m = document.createElement("div");
    m.className = "shop-modal";
    const me = S.queen.id;
    const list = [...S.rivals, ...S.out];
    const feelTxt = (f) => (f <= -3 ? "😡 Te odia" : f <= -1 ? "😒 Te tiene ganas" : f >= 3 ? "😍 Te adora" : f >= 1 ? "🙂 Le caes bien" : "😐 Neutral");
    m.innerHTML = `
      <div class="shop board">
        <div class="shop-top"><h3>⚔️ Tus rivales</h3><button class="btn btn-primary" id="board-close">Cerrar</button></div>
        <p class="muted">Descubre sus puntos fuertes y débiles cotilleando, observando en el Untucked o gracias a tus aliadas. ${memoriaOn() ? "Vienen con su historia: se acuerdan de lo que pasó en otras temporadas." : "Aquí todas entráis nuevas. Lo que pase lo recordarán si volvéis a coincidir en un All Stars."}</p>
        <div class="board-grid">${list.map((q) => {
          const t = traitsOf(q), out = S.out.includes(q), [ri, rn] = rankOf(q);
          const sc = Nem.scarsOf(me, q.id);
          const tr = ["fort", "deb", "car"].map((sl) => Nem.knows(q.id, sl) ? `<span class="tr ${sl}">${RASGOS[sl][t[sl]].icon} ${esc(RASGOS[sl][t[sl]].n)}</span>` : `<span class="tr unk">❓ ${sl === "fort" ? "Fortaleza" : sl === "deb" ? "Debilidad" : "Carácter"}</span>`).join("");
          return `<div class="board-card ${out ? "out" : ""} ${isNem(q) ? "nem" : ""} ${S.pacts && S.pacts[q.id] ? "pact" : ""}">
            <i style="background-image:url('${photo(q)}')"></i>
            <b>${esc(q.name)}</b>
            <small>${out ? "Eliminada" : `${ri} ${rn}`}${Nem.titles(q.id).length ? " · 👑 " + Nem.titles(q.id).length : ""}${isNem(q) ? " · ⚔️ Némesis" : ""}${S.pacts && S.pacts[q.id] ? " · 🤝 Pacto" : ""}</small>
            <small>${feelTxt(Nem.feel(q.id, me))} · Poder ${"●".repeat(Math.round(Nem.power(q.id) / 2))}${"○".repeat(5 - Math.round(Nem.power(q.id) / 2))}</small>
            <div class="trs">${tr}</div>
            ${sc.length ? `<small class="scars">${sc.slice(-2).map((x) => `${x.k === "elim" ? "💔" : x.k === "save" ? "🙏" : x.k === "pact" ? "🤝" : x.k === "betray" ? "🐍" : x.k === "vote" ? "💄" : "🎯"} ${esc(x.s)}`).join(" · ")}</small>` : ""}
          </div>`;
        }).join("")}</div>
      </div>`;
    $("#screen-story").append(m);
    $("#board-close").addEventListener("click", () => m.remove());
  }

  // ------------------------------ Fama y némesis ------------------------------
  // Todo lo que haces suma a tu fama (madre, villana, drama o concentrada).
  // La némesis nace de un choque fuerte o de la competencia directa, y te persigue toda la temporada.
  const P_KEYS = ["kind", "mean", "drama", "focus"];
  function persona(k, n = 1) {
    if (!k) return;
    S.persona = S.persona || {};
    const before = fame();
    S.persona[k] = (S.persona[k] || 0) + n;
    const now = fame();
    if (now && now !== before) Toast.show(`${FAMA[now].icon} Tu fama en el taller: ${FAMA[now].n}`, "Las demás te tratarán según cómo te comportes");
  }
  // Cuenta quién ataca a quién en la rivalidad (para saber quién es la mala de verdad)
  function nemTally(k, n = 1) {
    if (!S.nemesis || S.nemesis.done) return;
    S.nemesis[k] = (S.nemesis[k] || 0) + n;
  }
  // Lo que pasa en una charla libre: tu fama depende de lo que haces tú, no de cómo te contesta ella
  function talkFame(q, r) {
    const tono = String((r && r.tono) || "").toLowerCase();
    const me = String((r && r.jugadora) || "neutral").toLowerCase();
    const hostil = /borde|amenaza/.test(tono);
    if (/amable/.test(me)) persona("kind");
    else if (/provoca/.test(me)) { persona("mean"); if (isNem(q)) { nemTally("mine"); heat(1); } }
    else if (/defiende/.test(me)) { persona("drama", 0.3); if (isNem(q)) nemTally("mine", 0.3); }
    if (hostil && !/provoca/.test(me)) {
      S.aggr = S.aggr || {};
      S.aggr[q.id] = (S.aggr[q.id] || 0) + 1;
      if (isNem(q)) { nemTally("her"); heat(1); }
    }
  }
  // Quién empezó: texto para que la IA (escenas, jurado) lo tenga claro
  function nemStory() {
    const q = nemActive();
    if (!q) return "";
    const her = S.nemesis.her || 0, mine = S.nemesis.mine || 0;
    if (her >= mine + 1.5) return `${q.name} es la que provoca a ${S.queen.name} una y otra vez; ${S.queen.name} solo se defiende, y el taller lo ve. La que se está ganando fama de mala es ${q.name}.`;
    if (mine >= her + 1.5) return `${S.queen.name} es la que no deja en paz a ${q.name}.`;
    return `${S.queen.name} y ${q.name} se pican mutuamente.`;
  }
  function fame() {
    const p = S.persona || {};
    const best = P_KEYS.slice().sort((a, b) => (p[b] || 0) - (p[a] || 0))[0];
    const second = P_KEYS.filter((k) => k !== best).reduce((m, k) => Math.max(m, p[k] || 0), 0);
    return (p[best] || 0) >= 3 && (p[best] || 0) > second ? best : null;
  }
  // La némesis está desactivada: era demasiado exagerada. Ahora pesan las conversaciones en grupo.
  const NEMESIS_ON = false;
  const nemQ = () => (NEMESIS_ON && S.nemesis && !S.nemesis.done ? qById(S.nemesis.id) : null);
  const nemActive = () => { const q = nemQ(); return q && S.rivals.includes(q) ? q : null; };
  const isNem = (q) => NEMESIS_ON && !!q && !!S.nemesis && !S.nemesis.done && S.nemesis.id === q.id;
  function makeNemesis(q, origin) {
    if (!NEMESIS_ON) return;
    if (!q || q === S.queen || !S.rivals.includes(q)) return;
    if (S.nemesis && !S.nemesis.done && S.rivals.some((r) => r.id === S.nemesis.id)) return;
    if (S.nemesis && S.nemesis.done === "tregua" && S.nemesis.id === q.id) return;
    S.nemesis = { id: q.id, origin, heat: 4, ep: S.ep, announced: false };
    if (relOf(q) > -2) S.rel[q.id] = -2;
  }
  function heat(d) {
    if (!S.nemesis || S.nemesis.done) return;
    S.nemesis.heat = clamp(S.nemesis.heat + d, 0, 10);
    const q = nemQ();
    if (S.nemesis.heat <= 0 && q) {
      S.nemesis.done = "tregua";
      S.rel[q.id] = 0;
      Toast.show(`🕊️ Tregua con ${q.name}`, "Ya no es tu némesis");
    }
  }
  // Escena semanal: nace la némesis, o te lanza una pulla según tu historia
  function nemesisScene(then) {
    if (S.rivals.length < 3) return then();
    // Si nadie ha chocado contigo, la rival más directa se convierte en némesis
    if ((!S.nemesis || (S.nemesis.done && S.nemesis.done !== "tregua" && S.ep - (S.nemesis.ep || 0) >= 2)) && S.ep >= 3) {
      const eps = Object.keys(S.track.me || {}).map(Number);
      const close = (q) => eps.reduce((t, e) => t + (["WIN", "HIGH", "TOP2"].includes((S.track[q.id] || {})[e]) && ["WIN", "HIGH", "TOP2"].includes(S.track.me[e]) ? 2 : 0), 0) - relOf(q) * 2 + rnd(0, 2);
      const cand = S.rivals.slice().sort((a, b) => close(b) - close(a))[0];
      if (cand && (S.ep >= 4 || Math.random() < 0.5)) makeNemesis(cand, "competencia");
    }
    const q = nemActive();
    if (!q) return then();
    const ctx = { ...ctxWith(q), q: { r1: q }, r1: q.name, tension: true };
    if (!S.nemesis.announced) {
      S.nemesis.announced = true;
      reveal(q);
      return scene("nemesisScene", NEMESIS.nace[S.nemesis.origin] || NEMESIS.nace.choque, ctx, () => {
        body().innerHTML = `
          <div class="story-card">
            <p class="eyebrow">⚔️ Nace una némesis</p>
            <h3>${esc(q.name)} va a por ti</h3>
            <div class="vs"><img src="${photo(S.queen)}"><span>⚔️</span><img src="${photo(q)}"></div>
            <p>${S.nemesis.origin === "competencia" ? "Semana tras semana os peleáis por lo mismo." : "Lo vuestro ya es personal."} Te buscará en el taller, en el Untucked y, si puede, en el lip sync. Puedes plantarle cara, ignorarla o intentar hacer las paces.</p>
            <button class="btn btn-primary" id="story-next">Continuar</button>
          </div>`;
        $("#story-next").addEventListener("click", then);
      });
    }
    if (Math.random() > 0.6) return then();
    const meLab = Object.values(S.track.me || {});
    const nb = meLab.filter((l) => /^BTM|ELIM/.test(l)).length, nw = meLab.filter((l) => l === "WIN").length;
    const f = fame();
    const key = nb >= 2 && Math.random() < 0.6 ? "bottoms" : nw >= 2 && Math.random() < 0.6 ? "wins" : f && Math.random() < 0.7 ? f : "generic";
    nemTally("her");
    scene("nemesisScene", pickFresh(NEMESIS.pullas[key]), ctx, then, nemChoices());
  }
  function nemChoices() {
    return [
      { txt: "¿Eso es todo lo que tienes? Qué poquito.", persona: "drama", bonus: 200, fx: () => { heat(1); nemTally("mine", 0.5); }, reply: ["r1", "Ríete ahora. Ya veremos el viernes."] },
      { txt: "(No le contestas y te centras en el reto)", persona: "focus", adv: 3, fx: () => heat(0), reply: ["r1", "Muy bien, hazte la digna."] },
      { txt: "Oye... ¿y si dejamos esto? No nos hace bien a ninguna.", persona: "kind", fx: () => {
        if (S.nemesis && S.nemesis.heat <= 4 && Math.random() < 0.6) heat(-3);
        else Toast.show("😒 No cuela", "Todavía no está lista para hacer las paces");
      }, reply: ["r1", "...Me lo pensaré."] },
    ];
  }
  // La fama: las demás reaccionan a cómo te comportas
  function fameScene(then) {
    const nq = nemActive();
    if (nq && S.rivals.length >= 3 && (S.nemesis.her || 0) >= (S.nemesis.mine || 0) + 2 && !S.nemesis.sided && Math.random() < 0.6) {
      S.nemesis.sided = S.ep;
      const ally = S.rivals.filter((r) => r !== nq).sort((a, b) => relOf(b) - relOf(a))[0];
      const ctx = ctxWith(ally, { r2: nq });
      return scene("fameScene", [
        ["r1", "Oye, {yo}, lo de {r2} contigo ya pasa de castaño oscuro. Todas lo estamos viendo."],
        ["r1", "Que conste que la que empieza siempre es ella. Tú bastante aguantas."],
      ], ctx, then, [
        { txt: "Gracias. Me alegra saber que no estoy loca.", rel: { r1: 1 }, persona: "kind", reply: ["r1", "Para nada. Aquí tienes gente de tu lado."] },
        { txt: "Paso de ella. Yo vengo a por la corona.", persona: "focus", adv: 2, reply: ["r1", "Así me gusta."] },
      ]);
    }
    const f = fame();
    if (!f || S.rivals.length < 3 || Math.random() > 0.5) return then();
    const q = pick1(S.rivals.filter((r) => !isNem(r))) || pick1(S.rivals);
    const v = pickFresh(FAMA[f].reaccion);
    // Las demás se acercan o se apartan según tu fama
    if (f === "kind") changeRel(pick1(S.rivals), 1);
    if (f === "mean" && Math.random() < 0.5) changeRel(pick1(S.rivals.filter((r) => !isNem(r))), -1);
    scene("fameScene", v.lines, { ...ctxWith(q), tension: f === "mean" }, then, v.choices);
  }
  // Valoraciones del jurado personalizadas con tu historia en la temporada
  function personalCrit() {
    const eps = Object.keys(S.track.me || {}).map(Number).filter((e) => e < S.ep).sort((a, b) => a - b);
    const labs = eps.map((e) => S.track.me[e]);
    const prev = labs[labs.length - 1];
    const nb = labs.filter((l) => /^BTM/.test(l)).length, nw = labs.filter((l) => l === "WIN").length;
    const out = [];
    const rs = S.lastParts ? S.lastParts.reto : 50;
    if (prev && /^BTM/.test(prev) && rs >= 70) out.push(["judge", "La semana pasada estabas en el bottom y hoy mírate. Eso es tener hambre de corona."]);
    else if (nb >= 2 && rs < 55) out.push(["host", `${S.queen.name}, ya van ${nb} veces abajo. Ya no es un mal día: empieza a ser una tendencia.`]);
    else if (nw >= 2 && rs < 55) out.push(["judge", `Llevas ${nw} victorias y hoy parece que te has relajado. No te lo creas tanto.`]);
    else if (nw >= 2 && rs >= 75) out.push(["ambrossi", `Ya llevas ${nw} victorias y no aflojas. Así se hace.`]);
    S.lookTags = S.lookTags || [];
    const lt = S.lookTags.slice(-3);
    if (lt.length === 3 && lt.every((t) => t === lt[0])) out.push(["calvo", `Tercera semana seguida tirando de ${lt[0]}. Te queda bien, pero quiero ver otra faceta tuya.`]);
    const f = fame();
    const FAME_CRIT = {
      mean: "Fuera de este escenario das mucho que hablar. Aquí arriba también tienes que hacerlo.",
      kind: "Te veo ayudando a todas en el taller. Precioso, pero no te olvides de ti.",
      drama: "El drama del taller da mucho juego, pero no te acerca a la corona. Recuérdalo.",
      focus: "Se nota que vienes a trabajar y no a hacer amigas. Eso el jurado lo ve.",
    };
    if (f && Math.random() < 0.6) out.push([pick1(["judge", "host"]), FAME_CRIT[f]]);
    const nq = nemActive();
    if (nq && Math.random() < 0.6) {
      const her = S.nemesis.her || 0, mine = S.nemesis.mine || 0;
      if (mine >= her + 1.5) out.push(["host", `Y te veo muy pendiente de ${nq.name}. Mira tu camino, que el suyo no te lleva a la corona.`]);
      else if (her >= mine + 1.5) out.push(["host", pick1([`Sé que ${nq.name} no te lo está poniendo fácil en el taller. Que no te saque de lo tuyo.`, `Hay quien gasta más energía en ti que en su look. Tú sigue así, que se nota quién viene a trabajar.`])]);
      else out.push(["host", `Lo tuyo con ${nq.name} da para una serie. Que no os quite la vista de la corona a ninguna de las dos.`]);
    }
    return out.slice(0, 2);
  }

