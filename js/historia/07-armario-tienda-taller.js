  // ------------------------------ Armario personal y tienda ------------------------------
  // Tu armario (y tu dinero) se guarda entre temporadas
  const CLOSET_KEY = "dftc-closet";
  const PRICE = { look: [0, 60, 110, 180, 280, 420], peluca: [0, 30, 55, 90, 140, 210], acc: [0, 20, 35, 60, 90, 140] , zapatos: [0, 25, 45, 75, 115, 170] };
  const SLOT_NAMES = { look: "Looks", peluca: "Pelucas", zapatos: "Tacones", acc: "Toque final" };
  if (!ARMARIO.zapatos) ARMARIO.zapatos = [];
  const slotMap = {};
  const slotOf = (it) => {
    if (!slotMap.ok) { ["look", "peluca", "zapatos", "acc"].forEach((k) => ARMARIO[k].forEach((x) => (slotMap[x.id] = k))); slotMap.ok = 1; }
    return slotMap[it.id] || (String(it.id).startsWith("hecho-") ? "look" : "acc");
  };
  const statOf = (it) => (typeof ARMARIO_STATS !== "undefined" && ARMARIO_STATS[it.id]) || [2, 3];
  const priceOf = (it) => PRICE[slotOf(it)][statOf(it)[0]];
  const euros = (n) => `${Math.round(n).toLocaleString("es-ES")} €`;
  const Closet = {
    get() { return store.get(CLOSET_KEY, { money: 0, owned: {} }); },
    set(c) { store.set(CLOSET_KEY, c); document.querySelectorAll(".closet-money").forEach((e) => (e.textContent = euros(c.money))); },
    get money() { return this.get().money; },
    has(id) { return !!this.get().owned[id]; },
    add(n) { const c = this.get(); c.money = Math.max(0, Math.round(c.money + n)); this.set(c); },
    buy(it) {
      const c = this.get(), p = priceOf(it);
      if (c.owned[it.id] || c.money < p) return false;
      c.money -= p;
      c.owned[it.id] = 1;
      this.set(c);
      return true;
    },
  };
  function earn(n, why) {
    Closet.add(n);
    Toast.show(`💶 +${euros(n)}`, why);
  }
  const themeOf = (cat) => (typeof TEMAS_PASARELA !== "undefined" ? TEMAS_PASARELA : []).find((t) => t.n === cat) || null;
  // ¿Esta pieza encaja con esta pasarela?
  // Cuánto encaja una pieza con una pasarela (0 a 1). Es interno: al jugador no se le dice; lo valoran los jueces
  const normTxt = (x) => String(x || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  function fitScore(k, it, cat) {
    const TH = themeOf(cat);
    const main = CAT_TAG[cat] || (TH && TH.tag) || "Glamour";
    const style = TAG_OF_STYLE[it.s] === main;
    if (!TH) return !it.rv && (it.t || []).includes(cat) ? 1 : !it.rv && style ? 0.6 : 0.15;
    if (k === "look" && TH.rv) return it.rv ? 1 : 0.05;
    if (k === "look" && it.rv) return 0.2;
    let sc = 0;
    if (it.th && (TH.from || []).includes(it.th)) sc = 1;
    if ((it.t || []).some((x) => (TH.t || []).includes(x))) sc = Math.max(sc, 0.8);
    const txt = normTxt(`${it.n} ${it.desc || ""}`);
    const hits = (TH.kw || []).filter((w) => txt.includes(normTxt(w))).length;
    if (hits) sc = Math.max(sc, Math.min(1, 0.6 + 0.2 * hits));
    if (style) sc = Math.max(sc, 0.45);
    return sc || 0.1;
  }
  const fitsRunway = (k, it, cat) => fitScore(k, it, cat) >= 0.6;
  // Calendario de la temporada: cuántos episodios habrá y qué looks necesitarás en cada uno
  function seasonEpisodes() {
    // Una eliminación por episodio hasta quedar 4 (+1 si hay Segunda Oportunidrag)
    if (twistOf() === "winners") return winnersWeeks();
    return S.season.cast.length - 4;
  }
  function buildSchedule() {
    let ord = (S.order || []).filter((t) => ORDEN_RETOS.includes(t));
    if (ord.length < ORDEN_RETOS.length) ord = ORDEN_RETOS;
    const temas = (typeof TEMAS_PASARELA !== "undefined" ? TEMAS_PASARELA : []);
    // Las pasarelas cambian de una temporada a otra: primero las que menos has visto
    const seen = seenRunways();
    const fresh = (arr) => shuffle(arr).map((n) => [n, (seen[n] || 0) + Math.random() * 0.9]).sort((a, b) => a[1] - b[1]).map((x) => x[0]);
    const pool = [...fresh(temas.map((t) => t.n)), ...fresh(CATEGORIAS.filter((c) => !temas.some((t) => t.n === c)))];
    const take = () => pool.shift() || pick1(CATEGORIAS);
    const sched = [];
    for (let ep = 1; ep <= seasonEpisodes(); ep++) {
      const tipo = ord[(ep - 1) % ord.length];
      const looks = [];
      if (tipo === "ball") {
        const used = sched.filter((x) => x.ball).map((x) => x.ball);
        const B = fresh(BALLS.filter((b) => !used.includes(b.id)).map((b) => "ball:" + b.id)).map((k) => BALLS.find((b) => "ball:" + b.id === k))[0] || pick1(BALLS);
        looks.push({ cat: B.c[0][0], kind: "ball" }, { cat: B.c[1][0], kind: "ball" });
        sched.push({ ep, tipo, looks, ball: B.id });
        continue;
      }
      if (!RETOS[tipo].noRunway) looks.push({ cat: take(), kind: "runway" });
      sched.push({ ep, tipo, looks });
    }
    return sched;
  }
  function seenRunways() {
    try { return JSON.parse(localStorage.getItem("dftc-pasarelas-vistas")) || {}; } catch (e) { return {}; }
  }
  function markRunways(sched) {
    const seen = seenRunways();
    sched.forEach((e) => {
      if (e.ball) seen["ball:" + e.ball] = (seen["ball:" + e.ball] || 0) + 1;
      e.looks.filter((l) => l.kind === "runway").forEach((l) => (seen[l.cat] = (seen[l.cat] || 0) + 1));
    });
    try { localStorage.setItem("dftc-pasarelas-vistas", JSON.stringify(seen)); } catch (e) {}
  }
  function buildPlan() {
    S.schedule = buildSchedule();
    markRunways(S.schedule);
    S.ballPlan = S.schedule.flatMap((e) => e.looks.filter((l) => l.kind === "ball").map((l) => l.cat));
    return S.schedule.flatMap((e) => e.looks.filter((l) => l.kind === "runway").map((l) => l.cat));
  }
  const allPlannedLooks = () => [...(S.runwayPlan || []), ...(S.ballPlan || [])];
  // Lo mínimo para cubrir cada pasarela (look + peluca + toque final más baratos que encajan)
  // Lo que te falta para cubrir el plan: lo que ya tienes cuenta gratis y una peluca o un toque sirven para varias pasarelas
  function neededBudget(plan) {
    let total = 0;
    const usedL = new Set(), haveWA = { peluca: [], zapatos: [], acc: [] };
    plan.forEach((cat) => {
      const look = ARMARIO.look.filter((x) => fitsRunway("look", x, cat) && !usedL.has(x.id)).sort((a, b) => (Closet.has(a.id) ? 0 : priceOf(a)) - (Closet.has(b.id) ? 0 : priceOf(b)))[0];
      if (look) { usedL.add(look.id); if (!Closet.has(look.id)) total += priceOf(look); } else total += PRICE.look[1];
      ["peluca", "zapatos", "acc"].forEach((k) => {
        if (haveWA[k].some((x) => fitsRunway(k, x, cat)) || ARMARIO[k].some((x) => Closet.has(x.id) && fitsRunway(k, x, cat))) return;
        const c = ARMARIO[k].filter((x) => fitsRunway(k, x, cat)).sort((a, b) => priceOf(a) - priceOf(b))[0];
        if (c) { haveWA[k].push(c); total += priceOf(c); } else total += PRICE[k][1];
      });
    });
    return Math.max(0, Math.ceil((total * 1.15) / 50) * 50 - Closet.money);
  }
  function basicBudget(plan) {
    // Un look distinto por pasarela (no se pueden repetir) + peluca y toque final
    let total = 0;
    const usedL = new Set();
    plan.forEach((cat) => ["look", "peluca", "zapatos", "acc"].forEach((k) => {
      const c = ARMARIO[k].filter((x) => fitsRunway(k, x, cat) && !(k === "look" && usedL.has(x.id))).sort((a, b) => priceOf(a) - priceOf(b))[0];
      if (c && k === "look") usedL.add(c.id);
      total += c ? priceOf(c) : PRICE[k][1];
    }));
    return Math.ceil((total * 1.1) / 50) * 50;
  }
  // Antes de empezar: los Javis te llaman, te cuentan las pasarelas y te vas de compras
  function javisCall(then) {
    setSet("lounge");
    header();
    $("#story-ep").textContent = "Antes de empezar";
    const plan = allPlannedLooks();
    const grant = S.flags.grant ? 0 : neededBudget(plan);
    const sched = S.schedule || [];
    const nLooks = plan.length;
    const lines = [
      ["ambrossi", "¿Sí? ¿Hablo con {yo}? ¡Somos los Javis!"],
      ["calvo", S.season.special === "winners"
        ? pick1(["Te llamamos con algo muy gordo: ¡vuelves para Drag Race España All Winners! Solo ganadoras.", "Siéntate: ¡estás en All Winners! Todas las que vienen ya tienen corona."])
        : S.season.franchise && S.season.franchise.id === "esas"
          ? pick1(["Te llamamos con una noticia... ¡Vuelves a la casa para Drag Race España All Stars!", "Siéntate, que esto es fuerte: ¡eres una de las All Stars de esta edición!"])
          : pick1(["Te llamamos con una noticia... ¡Estás dentro de Drag Race España!", "Siéntate, que esto es fuerte: ¡vas a ser concursante de Drag Race España!"])],
      ["me", pick1(["¡¿QUÉ?! ¡No me lo creo!", "Ay, que me da algo. ¡Que me da algo!", "Esperad, que grito... ¡AAAH!"])],
      ["ambrossi", `Escucha bien, que esto es importante: si llegas a la final serán ${sched.length || "unos cuantos"} episodios y vas a necesitar ${nLooks} looks.`],
      ["ambrossi", "Te decimos las temáticas, pero no en qué orden. Eso es sorpresa."],
      ["calvo", "Y las temáticas son un punto de partida: cada una la interpreta a su manera. Lo que cuenta es que tu idea se entienda y la defiendas."],
      ["calvo", "Y ojo: lo que compres ahora es lo que hay. Durante la temporada no se puede ir de compras, y ningún look se repite."],
      ["calvo", "Si no te llega para lo básico, producción te echa una mano. Lo demás... te lo tendrás que ganar."],
      ["ambrossi", pick1(["Y nada de traer lo de siempre, ¿eh? Queremos verte brillar.", "Haz las maletas con cabeza. Y con lentejuelas."])],
    ];
    dialog(lines, ctxWith(pick1(S.rivals)), () => {
      if (!S.flags.grant) { S.flags.grant = 1; Closet.add(grant); save(); }
      body().innerHTML = `
        <div class="story-card call-plan">
          <p class="eyebrow">📞 Los Javis · tus pasarelas de ${esc(S.season.name)}</p>
          <h3>${sched.length} episodios · ${nLooks} looks que preparar</h3>
          <div class="sched">${shuffle(plan.slice()).map((c, i) => { const t = themeOf(c); const ball = (S.ballPlan || []).includes(c) && !(S.runwayPlan || []).includes(c); const bb = ball && BALLS.find((b) => b.c.some((x) => x[0] === c)); const bx = bb && bb.c.find((x) => x[0] === c); return `<div class="sched-ep" style="--i:${i}"><b>${ball ? `🎭 ${bb ? esc(bb.n) : "Look para el Ball"}` : "👠 Pasarela"}</b><span>${esc(c)}</span>${t ? `<small>${esc(t.d)}</small>` : bx ? `<small>${esc(bx[2])}</small>` : ""}</div>`; }).join("")}</div>
          <p class="gold">💡 Cada temática está abierta: interprétala a tu manera y defiéndela en la pasarela.</p>
          <p class="muted">El orden de los retos y las pasarelas es sorpresa: puede cambiar sobre la marcha. Luego vienen el reencuentro y la gran final. Si te eliminan antes, lo que no uses se queda en tu armario para la próxima temporada.</p>
          <p class="gold">${grant ? `💶 Producción te ingresa ${euros(grant)} para lo que te falta.` : "💶 Con tu armario y tus ahorros te llega: producción no pone nada esta vez."} Tienes <b class="closet-money">${euros(Closet.money)}</b>.</p>
          <p class="muted">🛑 Solo puedes comprar ahora. Lo que ganes en la temporada (minirretos, retos, corona) te servirá para la siguiente.</p>
          <button class="btn btn-primary" id="story-go">👗 Preparar mis looks</button>
        </div>`;
      $("#story-go").addEventListener("click", () => prepAllLooks(then));
    });
  }
  // Después de las compras: preparas en el maniquí todos los looks de la temporada, uno por pasarela
  function prepAllLooks(then) {
    setSet("lounge");
    header();
    $("#story-ep").textContent = "Antes de empezar";
    const cats = [...new Set(allPlannedLooks())];
    S.prepLooks = S.prepLooks || {};
    const ballOf = (c) => (S.ballPlan || []).includes(c) && !(S.runwayPlan || []).includes(c) ? BALLS.find((b) => b.c.some((x) => x[0] === c)) : null;
    const next = (at) => {
      const i = at != null ? at : cats.findIndex((c) => !S.prepLooks[c]);
      if (i < 0) {
        S.flags.prepped = 1;
        S.flags.shopped = 1;
        S.usedLooks = [...new Set(Object.values(S.prepLooks).map((x) => x.look && !x.look.loan && x.look.id).filter(Boolean))];
        save();
        body().innerHTML = `
          <div class="story-card intro">
            <img class="story-queen" src="${sprite(S.queen)}" alt="">
            <div>
              <p class="eyebrow">🧳 Maletas hechas</p>
              <h3>${cats.length} looks preparados</h3>
              <p>Antes de cada pasarela te enseñarán el look que preparaste y podrás cambiar lo que quieras.</p>
              <button class="btn btn-primary" id="story-go">🚪 Entrar en la casa</button>
            </div>
          </div>`;
        $("#story-go").addEventListener("click", then);
        return;
      }
      const c = cats[i], b = ballOf(c);
      $("#story-ep").textContent = `Maletas · ${i + 1}/${cats.length}`;
      lookStudio(c, i, cats, b, (plain) => { S.prepLooks[c] = plain; save(); const j = cats.findIndex((x, n) => n > i && !S.prepLooks[x]); next(j >= 0 ? j : cats.findIndex((x) => !S.prepLooks[x])); }, i > 0 ? () => next(i - 1) : null);
    };
    next();
  }
  // Estudio de looks: a la izquierda la temática y el maniquí; a la derecha la tienda y tu armario
  function lookStudio(cat, idx, cats, ball, done, back, keep) {
    const TH = themeOf(cat);
    const bx = ball && ball.c.find((x) => x[0] === cat);
    const desc = TH ? TH.d : bx ? bx[2] : "";
    const K = ["look", "peluca", "zapatos", "acc"];
    const BASE = { look: "base-maniqui", peluca: "base-cabeza", zapatos: "base-peana", acc: "base-bandeja" };
    const ICON = { look: "👗", peluca: "💇", zapatos: "👠", acc: "💄" };
    const ONE = { look: "Look", peluca: "Peluca", zapatos: "Tacones", acc: "Toque final" };
    const chosen = {};
    let tab = "look", filt = "all";
    // Looks ya reservados para otras pasarelas (no se repiten)
    const tk = new Map(Object.entries(S.prepLooks || {}).filter(([c, x]) => c !== cat && x.look && !x.look.loan).map(([c, x]) => [x.look.id, c]));
    const items = (k) => {
      let L = ARMARIO[k].filter((x) => k !== "look" || !x.rv || (TH && TH.rv));
      if (filt === "mine") L = L.filter((x) => Closet.has(x.id));
      return L.slice().sort((a, b) => (Closet.has(b.id) ? 1 : 0) - (Closet.has(a.id) ? 1 : 0) || priceOf(a) - priceOf(b));
    };
    const host = body();
    // Rejillas cacheadas por pestaña: cambiar de pestaña o elegir una pieza no redibuja las 100 tarjetas
    const grids = {};
    const btnHTML = (k, it) => {
      const own = Closet.has(it.id), p = priceOf(it);
      if (chosen[k] && chosen[k].id === it.id) return `<span class="shop-own">✔ Puesto</span>`;
      if (k === "look" && tk.get(it.id)) return `<span class="shop-busy">En «${esc(tk.get(it.id))}»</span>`;
      if (own) return `<button class="btn btn-primary shop-buy ls-put" data-id="${it.id}">Ponérmelo</button>`;
      return `<button class="btn ${Closet.money >= p ? "btn-primary" : "btn-ghost"} shop-buy ls-buy" data-id="${it.id}" ${Closet.money >= p ? "" : "disabled"}>Comprar · ${euros(p)}</button>`;
    };
    const cardHTML = (k, it) => {
      const own = Closet.has(it.id), sel = chosen[k] && chosen[k].id === it.id, busy = k === "look" && tk.get(it.id);
      return `<div class="shop-card ${own ? "own" : ""} ${sel ? "sel" : ""} ${busy ? "busy" : ""}" data-card="${it.id}">
        <div class="shop-img"><img loading="lazy" decoding="async" src="${pieceImg(it.id)}" alt="">${it.rv ? `<img loading="lazy" decoding="async" class="at-rv" src="${pieceImg(it.rv)}" alt="">` : ""}</div>
        <b>${esc(it.n)}</b>
        <small class="shop-st">👣 ${statOf(it)[1]}/5${own ? " · ✔ tuyo" : ""}</small>
        <span class="ls-slot">${btnHTML(k, it)}</span>
      </div>`;
    };
    function patchCard(k, id) {
      ["all", "mine"].forEach((fl) => patchIn(grids[k + fl], k, id));
    }
    function patchIn(g, k, id) {
      const c = g && g.querySelector(`[data-card="${CSS.escape(id)}"]`);
      const it = ARMARIO[k].find((x) => x.id === id);
      if (!c || !it) return;
      const own = Closet.has(id), sel = chosen[k] && chosen[k].id === id;
      c.classList.toggle("own", own);
      c.classList.toggle("sel", !!sel);
      c.querySelector(".ls-slot").innerHTML = btnHTML(k, it);
      const st = c.querySelector(".shop-st");
      if (st) st.textContent = `👣 ${statOf(it)[1]}/5${own ? " · ✔ tuyo" : ""}`;
    }
    // Al gastar dinero cambian los botones de compra de todas las rejillas
    const refreshMoney = () => Object.values(grids).forEach((g) => g.querySelectorAll(".ls-buy").forEach((b) => {
      const it = K.map((k) => ARMARIO[k].find((x) => x.id === b.dataset.id)).find(Boolean);
      if (!it) return;
      const ok = Closet.money >= priceOf(it);
      b.disabled = !ok;
      b.classList.toggle("btn-primary", ok);
      b.classList.toggle("btn-ghost", !ok);
    }));
    function gridFor(k) {
      const key = k + filt;
      if (!grids[key]) {
        const g = document.createElement("div");
        g.className = "shop-grid ls-grid";
        g.innerHTML = items(k).map((it) => cardHTML(k, it)).join("") || `<p class="muted">Aún no tienes nada aquí.</p>`;
        g.addEventListener("click", (e) => {
          const b = e.target.closest(".ls-put, .ls-buy");
          if (!b) return;
          const it = ARMARIO[k].find((x) => x.id === b.dataset.id);
          if (!it) return;
          if (b.classList.contains("ls-buy")) {
            if (!Closet.buy(it)) return;
            Sound.countdown && Sound.countdown(false);
            Toast.show("🛍️ ¡Comprado!", it.n);
            refreshMoney();
            // "Mi armario" se rehace la próxima vez para que salga lo nuevo
            if (filt !== "mine") delete grids[k + "mine"];
          }
          pick(k, it);
        });
        grids[key] = g;
      }
      return grids[key];
    }
    function leftHTML() {
      const img = (k) => pieceImg(chosen[k] ? chosen[k].id : BASE[k]);
      const all = K.every((k) => chosen[k]);
      return `
            <p class="eyebrow">${ball ? `🎭 ${esc(ball.n)}` : "👠 Pasarela"} · ${idx + 1} de ${cats.length}</p>
            <h3>«${esc(cat)}»</h3>
            ${desc ? `<p class="ls-desc">${esc(desc)}</p>` : ""}
            <div class="ls-room">
              <button class="ls-st ls-look ${tab === "look" ? "on" : ""}" data-k="look" aria-label="Look"><img src="${img("look")}" alt=""></button>
              <div class="ls-side">
                ${["peluca", "zapatos", "acc"].map((k) => `<button class="ls-st ls-${k} ${tab === k ? "on" : ""}" data-k="${k}" aria-label="${ONE[k]}"><img src="${img(k)}" alt=""></button>`).join("")}
              </div>
            </div>
            <ul class="ls-sel">${K.map((k) => `<li class="${chosen[k] ? "ok" : ""}" data-k="${k}">${ICON[k]} <b>${ONE[k]}:</b> ${chosen[k] ? `${esc(chosen[k].n)}${chosen[k].loan ? " <small>(prestado)</small>" : ""}` : `<i>sin elegir</i>`}</li>`).join("")}</ul>
            <div class="ls-actions">
              ${back ? `<button class="btn btn-ghost" id="ls-back">← Anterior</button>` : ""}
              <button class="btn btn-primary" id="ls-next" ${all ? "" : "disabled"}>${idx + 1 < cats.length ? "Siguiente pasarela →" : "✅ Terminar"}</button>
            </div>`;
    }
    function renderLeft() {
      const L = host.querySelector(".ls-left");
      L.innerHTML = leftHTML();
      L.querySelectorAll(".ls-st, .ls-sel li").forEach((b) => b.addEventListener("click", () => setTab(b.dataset.k)));
      if ($("#ls-back")) $("#ls-back").addEventListener("click", back);
      $("#ls-next").addEventListener("click", () => {
        if (!K.every((k) => chosen[k])) return;
        const plain = {};
        K.forEach((k) => (plain[k] = { id: chosen[k].id, loan: !!chosen[k].loan }));
        Confetti.burst(500);
        done(plain);
      });
    }
    function renderTabs() {
      host.querySelectorAll(".shop-tab").forEach((b) => b.classList.toggle("on", b.dataset.t === tab));
      host.querySelectorAll(".shop-f").forEach((b) => b.classList.toggle("on", b.dataset.f === filt));
      const slot = host.querySelector(".ls-gridslot");
      const g = gridFor(tab);
      if (slot.firstChild !== g) { slot.replaceChildren(g); g.scrollTop = 0; }
    }
    function setTab(k) { tab = k; renderTabs(); host.querySelectorAll(".ls-st").forEach((b) => b.classList.toggle("on", b.dataset.k === tab)); }
    function pick(k, it, loan) {
      const prev = chosen[k];
      chosen[k] = loan ? { ...it, loan: true } : it;
      if (prev && prev.id !== it.id) patchCard(k, prev.id);
      patchCard(k, it.id);
      const nx = K.find((x) => !chosen[x]);
      if (nx && !loan) tab = nx;
      renderLeft();
      renderTabs();
    }
    host.innerHTML = `
        <div class="ls">
          <div class="ls-left"></div>
          <div class="ls-right">
            <div class="ls-top">
              <b class="shop-money">💶 <span class="closet-money">${euros(Closet.money)}</span></b>
              <button class="btn btn-ghost small-btn" id="ls-loan">🔁 Préstamo de producción</button>
              <button class="btn btn-ghost small-btn" id="ls-taller">✂️ Taller</button>
            </div>
            <div class="shop-tabs">
              ${K.map((k) => `<button class="shop-tab" data-t="${k}">${ICON[k]} ${SLOT_NAMES[k]}</button>`).join("")}
              <span class="shop-sep"></span>
              <button class="shop-f" data-f="all">Todo</button>
              <button class="shop-f" data-f="mine">Mi armario</button>
            </div>
            <div class="ls-gridslot"></div>
            <p class="muted shop-legend">Lo que compres es tuyo para siempre. Los tacones, pelucas y toques puedes repetirlos; los looks no. 👣 ayuda a desfilar. Si encaja con la temática lo decide el jurado.</p>
          </div>
        </div>`;
    host.querySelectorAll(".shop-tab").forEach((b) => b.addEventListener("click", () => setTab(b.dataset.t)));
    host.querySelectorAll(".shop-f").forEach((b) => b.addEventListener("click", () => { filt = b.dataset.f; renderTabs(); }));
    $("#ls-loan").addEventListener("click", () => {
      const pool = ARMARIO[tab].filter((x) => !Closet.has(x.id) && !tk.has(x.id) && statOf(x)[0] <= 2 && (tab !== "look" || !x.rv));
      const it = pick1(pool.length ? pool : ARMARIO[tab].filter((x) => !Closet.has(x.id) && !tk.has(x.id)));
      if (!it) return;
      Toast.show("🔁 Préstamo de producción", `${it.n}: básico y sin gastar, pero puntúa poco`);
      pick(tab, it, true);
    });
    // El taller crea looks nuevos: al volver se rehacen las rejillas
    $("#ls-taller").addEventListener("click", () => tallerScreen(host, () => { syncHechos(); lookStudio(cat, idx, cats, ball, (plain) => done(plain), back, { ...chosen }); }));
    // Si ya estaba preparado (al volver atrás), se recupera
    const pre = (S.prepLooks || {})[cat];
    if (pre) K.forEach((k) => { const it = pre[k] && ARMARIO[k].find((x) => x.id === pre[k].id); if (it) chosen[k] = pre[k].loan ? { ...it, loan: true } : it; });
    // Al volver del taller se conserva lo que ya habías elegido sin confirmar
    if (keep) K.forEach((k) => { if (keep[k]) chosen[k] = keep[k]; });
    renderLeft();
    renderTabs();
  }
  // La tienda: todo el armario, con precio y estadísticas
  function shopScreen(el, onDone, first = false) {
    const plan = [...new Set(allPlannedLooks())];
    let tab = "look", filt = "all";
    const IMG = pieceImg;
    const fitsPlan = (k, it) => plan.filter((c) => fitsRunway(k, it, c));
    const covered = (c) => {
      // Looks: se reparten sin repetir entre todas las pasarelas del plan (un look no cuenta dos veces)
      const used = new Set(), ok = {};
      allPlannedLooks().forEach((cat, i) => {
        const l = ARMARIO.look.find((x) => Closet.has(x.id) && !used.has(x.id) && fitsRunway("look", x, cat));
        if (l) used.add(l.id);
        ok[cat] = (ok[cat] === undefined ? true : ok[cat]) && !!l;
      });
      return ok[c] !== false && ["peluca", "acc"].every((k) => ARMARIO[k].some((x) => Closet.has(x.id) && fitsRunway(k, x, c)));
    };
    function items() {
      let L = ARMARIO[tab].slice();
      if (filt === "plan") L = L.filter((x) => fitsPlan(tab, x).length);
      else if (filt === "mine") L = L.filter((x) => Closet.has(x.id));
      else if (filt !== "all") L = L.filter((x) => fitsRunway(tab, x, filt));
      return L.sort((a, b) => priceOf(a) - priceOf(b));
    }
    let host = el.querySelector(":scope > .shop-host");
    if (!host) { el.innerHTML = `<div class="shop-host"></div>`; host = el.querySelector(".shop-host"); }
    function render() {
      const L = items();
      const el = host;
      el.innerHTML = `
        <div class="shop">
          <div class="shop-top">
            <h3>🛍️ La tienda</h3>
            <b class="shop-money">💶 <span class="closet-money">${euros(Closet.money)}</span></b>
            <button class="btn btn-ghost" id="shop-taller">✂️ Taller de costura</button>
            <button class="btn btn-primary" id="shop-done">${first ? "Terminar compras: preparar los looks 👗" : "Cerrar"}</button>
          </div>
          ${plan.length ? `<div class="shop-plan"><small class="muted">Tus pasarelas:</small> ${plan.map((c) => { const t = themeOf(c); return `<span class="plan-chip" title="${esc(t ? t.d : "")}">${esc(c)}</span>`; }).join("")}</div>` : ""}
          <div class="shop-tabs">
            ${["look", "peluca", "zapatos", "acc"].map((k) => `<button class="shop-tab ${tab === k ? "on" : ""}" data-t="${k}">${SLOT_NAMES[k]}</button>`).join("")}
            <span class="shop-sep"></span>
            <button class="shop-f ${filt === "all" ? "on" : ""}" data-f="all">Todo</button>
            <button class="shop-f ${filt === "mine" ? "on" : ""}" data-f="mine">Mi armario</button>
          </div>
          <div class="shop-grid">${L.length ? L.map((it) => {
            const own = Closet.has(it.id), p = priceOf(it), [imp, mov] = statOf(it);
            return `<div class="shop-card ${own ? "own" : ""}">
              <div class="shop-img"><img loading="lazy" src="${IMG(it.id)}" alt="">${it.rv ? `<img loading="lazy" class="at-rv" src="${IMG(it.rv)}" alt="">` : ""}</div>
              <b>${esc(it.n)}</b>
              <small class="shop-st"><span title="Movimiento">👣 ${mov}/5</span></small>
              ${own ? `<span class="shop-own">✔ En tu armario</span>` : `<button class="btn ${Closet.money >= p ? "btn-primary" : "btn-ghost"} shop-buy" data-id="${it.id}" ${Closet.money >= p ? "" : "disabled"}>${euros(p)}</button>`}
            </div>`;
          }).join("") : `<p class="muted">No hay nada aquí todavía.</p>`}</div>
          <p class="muted shop-legend">👣 Movimiento: ayuda a desfilar y a que el reveal salga bien. Qué encaja con cada pasarela lo decide el jurado.</p>
        </div>`;
      el.querySelectorAll(".shop-tab").forEach((b) => b.addEventListener("click", () => { tab = b.dataset.t; render(); }));
      el.querySelectorAll(".shop-f").forEach((b) => b.addEventListener("click", () => { filt = b.dataset.f; render(); }));
      el.querySelectorAll(".shop-buy").forEach((b) => b.addEventListener("click", () => {
        const it = ARMARIO[tab].find((x) => x.id === b.dataset.id);
        const y = el.querySelector(".shop-grid") ? el.querySelector(".shop-grid").scrollTop : 0;
        if (it && Closet.buy(it)) { Sound.countdown && Sound.countdown(false); Toast.show("🛍️ ¡Comprado!", it.n); }
        render();
        if (el.querySelector(".shop-grid")) el.querySelector(".shop-grid").scrollTop = y;
      }));
      $("#shop-taller").addEventListener("click", () => tallerScreen(host, () => { syncHechos(); render(); }));
      $("#shop-done").addEventListener("click", () => {
        const nLooks = ARMARIO.look.filter((x) => Closet.has(x.id)).length;
        if (first && nLooks < plan.length && !el.dataset.warned) {
          el.dataset.warned = 1;
          return Toast.show("⚠️ ¿Terminar las compras?", `Tienes ${nLooks} looks para ${plan.length} pasarelas. Después ya no podrás comprar: producción te prestará algo básico. Pulsa otra vez para ir a preparar los looks.`);
        }
        if (first) { S.flags.shopped = 1; save(); }
        onDone();
      });
    }
    render();
  }
  // Botón de la tienda en la cabecera (fuera de las pruebas)
  function openShopModal() {
    if (S && S.flags && S.flags.shopped) return Toast.show("🛑 Tienda cerrada", "Durante la temporada no se puede comprar");
    if ($("#story-play") || document.querySelector(".shop-modal") || document.querySelector("#screen-story .shop")) return Toast.show("Ahora no", "Puedes ir de compras entre pruebas");
    const m = document.createElement("div");
    m.className = "shop-modal";
    $("#screen-story").append(m);
    shopScreen(m, () => m.remove());
  }

  // ------------------------------ Taller de costura (looks hechos por ti) ------------------------------
  // Compras la tela y los adornos, eliges silueta y color, lo coses y queda en tu armario como un look más
  const TALLER = {
    shapes: [
      { k: "gown", n: "Vestido de baile", m: 6, imp: 1.5, mov: 2, s: { glam: 1 }, dif: 0 },
      { k: "mermaid", n: "Sirena", m: 5, imp: 1.5, mov: 2, s: { glam: 1.5 }, dif: 8 },
      { k: "mini", n: "Minivestido", m: 2, imp: 0.5, mov: 5, s: { retro: 1 }, dif: -6 },
      { k: "jumpsuit", n: "Mono", m: 4, imp: 1, mov: 4, s: { futur: 1 }, dif: 0 },
      { k: "suit", n: "Traje de chaqueta", m: 4, imp: 1, mov: 4, s: { street: 1 }, dif: 10 },
      { k: "bodysuit", n: "Body", m: 1.5, imp: 0.5, mov: 5, s: { street: 0.5, futur: 0.5 }, dif: -6 },
      { k: "cape", n: "Capa de gala", m: 7, imp: 2, mov: 2, s: { glam: 1 }, dif: 4 },
      { k: "flamenca", n: "Traje de flamenca", m: 7, imp: 1.5, mov: 3, s: { folk: 2 }, dif: 8 },
    ],
    telas: [
      { k: "algodon", n: "algodón", eur: 8, imp: 0, pat: "solid", s: { folk: 1 } },
      { k: "raso", n: "raso", eur: 18, imp: 1, pat: "solid", s: { glam: 1 } },
      { k: "tul", n: "tul", eur: 14, imp: 1, pat: "solid", s: { glam: 0.5, retro: 1 } },
      { k: "encaje", n: "encaje", eur: 22, imp: 1.5, pat: "lace", s: { folk: 1, glam: 0.5 } },
      { k: "terciopelo", n: "terciopelo", eur: 24, imp: 1.5, pat: "solid", s: { glam: 2 } },
      { k: "lunares", n: "lunares", eur: 14, imp: 1, pat: "dots", s: { folk: 2 } },
      { k: "flores", n: "flores bordadas", eur: 24, imp: 1.5, pat: "flowers", s: { folk: 1.5, retro: 0.5 } },
      { k: "leopardo", n: "leopardo", eur: 18, imp: 1.5, pat: "leopard", s: { street: 1.5, retro: 0.5 } },
      { k: "rayas", n: "rayas blanco y negro", eur: 16, imp: 1, pat: "stripes", s: { street: 1.5 }, fixed: true },
      { k: "latex", n: "látex", eur: 27, imp: 2, pat: "metal", s: { street: 2 } },
      { k: "lame", n: "lamé metalizado", eur: 30, imp: 2, pat: "metal", s: { futur: 2 } },
      { k: "lentejuela", n: "lentejuela", eur: 34, imp: 2.5, pat: "sequins", s: { glam: 1.5, retro: 0.5 } },
    ],
    adornos: [
      { k: "pedreria", n: "pedrería", eur: 72, imp: 1, mov: 0, s: { glam: 1 } },
      { k: "plumas", n: "plumas", eur: 88, imp: 1.5, mov: -1, s: { glam: 0.5, retro: 1 } },
      { k: "flecos", n: "flecos", eur: 40, imp: 0.5, mov: 1, s: { folk: 0.5, retro: 0.5 } },
      { k: "volantes", n: "volantes", eur: 48, imp: 0.5, mov: 0, s: { folk: 1.5 } },
      { k: "tachuelas", n: "tachuelas", eur: 48, imp: 0.5, mov: 0, s: { street: 1.5 } },
      { k: "leds", n: "luces LED", eur: 96, imp: 1.5, mov: 0, s: { futur: 1.5 } },
      { k: "lazos", n: "lazos", eur: 32, imp: 0.5, mov: 0, s: { retro: 1.5 } },
      { k: "escamas", n: "escamas", eur: 64, imp: 1, mov: 0, s: { glam: 0.5, futur: 0.5 } },
    ],
    colores: [["negro", "#1b1b1b"], ["blanco", "#f4f1ec"], ["rojo", "#c8102e"], ["burdeos", "#7a1530"], ["fucsia", "#ff3d9a"], ["rosa", "#ff9ec7"], ["morado", "#7b3fa0"], ["azul noche", "#1f3a8a"], ["turquesa", "#18b6b0"], ["verde", "#2f9e44"], ["amarillo", "#ffd34d"], ["naranja", "#ff7a1a"], ["dorado", "#d4a93a"], ["plata", "#c0c4cc"]],
  };
  const STYLE_OF_TAG = { Glamour: "glam", Camp: "retro", Edgy: "street", Futurista: "futur", Folclórico: "folk" };
  const isHecho = (it) => !!(it && String(it.id).startsWith("hecho-"));
  // Mete en el catálogo los looks que has cosido (se guardan con tu armario)
  function syncHechos() {
    const c = Closet.get();
    (c.hechos || []).forEach((h) => {
      if (!ARMARIO.look.some((x) => x.id === h.id)) ARMARIO.look.push(h);
      if (typeof ARMARIO_STATS !== "undefined") ARMARIO_STATS[h.id] = h.st;
      slotMap[h.id] = "look";
    });
  }
  syncHechos();
  // Peluca y toque que mejor le van a un look tuyo (para verlo puesto)
  function wornSpec(look, wigIt, accIt) {
    const tag = TAG_OF_STYLE[look.s] || "Glamour";
    const pickOwn = (k) => ARMARIO[k].find((x) => Closet.has(x.id) && TAG_OF_STYLE[x.s] === tag) || ARMARIO[k].find((x) => TAG_OF_STYLE[x.s] === tag);
    const w = wigIt || pickOwn("peluca"), a = accIt || pickOwn("acc");
    return { skin: skinMe(), look: look.spec, wig: w ? Doll.visualOf(w, "peluca") : undefined, extra: a ? Doll.visualOf(a, "acc") : {} };
  }
  const svgUri = (svg) => `data:image/svg+xml;utf8,${encodeURIComponent(svg.replace(/class="doll[^"]*"/, 'class="doll"'))}`;
  const hechoImg = (it) => svgUri(Doll.svg(wornSpec(it)));
  // Imagen de una pieza del catálogo (los looks tuyos se dibujan puestos sobre tu reina)
  const pieceImg = (id) => {
    const h = String(id).startsWith("hecho-") && ARMARIO.look.find((x) => x.id === id);
    return h ? photoOf(h.id) || renderOf(h.id) || hechoImg(h) : `./images/armario/${id}.webp`;
  };

  // Tipo de cuerpo de cada reina en el taller 3D (se puede cambiar y se recuerda)
  const CUERPOS_KEY = "dftc-cuerpos";
  function bodyTypeOf(id) {
    const m = store.get(CUERPOS_KEY, {}) || {};
    if (m[id]) return m[id];
    let h = 0;
    for (const ch of String(id)) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
    return ["alta", "alta", "alta", "bajita", "grande"][h % 5];
  }
  function setBodyType(id, t) { const m = store.get(CUERPOS_KEY, {}) || {}; m[id] = t; store.set(CUERPOS_KEY, m); }
  // Datos del look para el visor 3D
  const spec3d = (look, tela, s) => ({ cuerpo: bodyTypeOf(S.queen.id), shape: look.shape, tela: tela || ({ sequins: "lentejuela", metal: "lame", dots: "lunares", lace: "encaje", flowers: "flores", leopard: "leopardo", stripes: "rayas" }[look.pat] || "raso"), color: look.color, trims: look.trims || [], skin: skinMe(), tag: TAG_OF_STYLE[s] || "Glamour" });
  const RENDERS_KEY = "dftc-render-looks";
  const renderOf = (id) => ImgDB.get(RENDERS_KEY, id);
  function saveRender(id, url) { if (url) ImgDB.set(RENDERS_KEY, id, url); }
  function tallerScreen(host, back0) {
    let v3 = null, v3busy = false;
    const kill3d = () => { if (v3) { v3.dispose(); v3 = null; } };
    const back = () => { kill3d(); cleanup = null; back0(); };
    cleanup = kill3d;
    // Monta (o reutiliza) el visor 3D dentro de un hueco
    function put3d(slot, sp) {
      if (!slot || typeof Atelier3D === "undefined") return;
      if (v3) { slot.innerHTML = ""; slot.append(v3.el); v3.set(sp); return; }
      if (v3busy) return;
      v3busy = true;
      Atelier3D.load().then((ok) => {
        v3busy = false;
        const cur = host.querySelector(slot.id ? `#${slot.id}` : ".tl-3d");
        if (!ok || !cur || v3) return;
        try { cur.innerHTML = ""; v3 = Atelier3D.mount(cur, cur.__spec || sp); } catch (e) { console.warn("3D", e); }
      });
    }
    const plan = [...new Set(allPlannedLooks())];
    const d = { shape: "gown", tela: "raso", color: "#c8102e", adornos: [], target: null, name: "" };
    const T = (k) => TALLER.telas.find((x) => x.k === k);
    const SH = (k) => TALLER.shapes.find((x) => x.k === k);
    const AD = (k) => TALLER.adornos.find((x) => x.k === k);
    const colorName = () => (TALLER.colores.find((c) => c[1] === d.color) || ["", ""])[0];
    function calc() {
      const sh = SH(d.shape), te = T(d.tela), ads = d.adornos.map(AD);
      const votes = {};
      [sh.s, te.s, ...ads.map((a) => a.s)].forEach((o) => Object.entries(o).forEach(([k, v]) => (votes[k] = (votes[k] || 0) + v)));
      const want = d.target ? STYLE_OF_TAG[CAT_TAG[d.target] || (themeOf(d.target) && themeOf(d.target).tag)] : null;
      const s = Object.entries(votes).sort((a, b) => b[1] - a[1] || (b[0] === want) - (a[0] === want))[0][0];
      const imp = sh.imp + te.imp + ads.reduce((t, a) => t + a.imp, 0);
      const mov = sh.mov + ads.reduce((t, a) => t + a.mov, 0);
      const cost = Math.round(sh.m * te.eur + ads.reduce((t, a) => t + a.eur, 0));
      const dif = 50 + sh.dif + ads.length * 6 + (te.k === "latex" || te.k === "lentejuela" ? 6 : 0);
      const auto = `${sh.n} de ${te.n}${te.fixed ? "" : ` en ${colorName()}`}${ads.length ? ` con ${ads.map((a) => a.n).join(" y ")}` : ""}`;
      return { s, tag: TAG_OF_STYLE[s], want, imp, mov, cost, dif, auto, look: { shape: sh.k, pat: te.pat, color: te.fixed ? "#1b1b1b" : d.color, trims: d.adornos.slice() } };
    }
    const starsOf = (imp) => clamp(Math.round(imp), 1, 5);
    function fitTxt(r) {
      if (!d.target) return `<span class="tl-fit">Estilo: <b>${esc(r.tag)}</b></span>`;
      const TH = themeOf(d.target);
      if (TH && TH.id === "P05") return `<span class="tl-fit ko">🎁 «${esc(d.target)}» pide un look con reveal: ese búscalo en la tienda</span>`;
      const need = CAT_TAG[d.target] || (TH && TH.tag) || "Glamour";
      return r.tag === need
        ? `<span class="tl-fit ok">🎯 Encaja con «${esc(d.target)}» (${esc(need)})</span>`
        : `<span class="tl-fit ko">😬 Te sale ${esc(r.tag)} y «${esc(d.target)}» pide ${esc(need)}</span>`;
    }
    function render() {
      const y = host.querySelector(".tl-form") ? host.querySelector(".tl-form").scrollTop : 0;
      const r = calc();
      const money = Closet.money;
      const preview = Doll.svg(wornSpec({ s: r.s, spec: r.look }));
      const sp3 = spec3d(r.look, d.tela, r.s);
      host.innerHTML = `
        <div class="shop taller">
          <div class="shop-top">
            <h3>✂️ Taller de costura</h3>
            <b class="shop-money">💶 <span class="closet-money">${euros(money)}</span></b>
            <button class="btn btn-ghost" id="tl-back">← Volver a la tienda</button>
          </div>
          <div class="tl-grid">
            <div class="tl-doll tl-boceto">
              <div class="tl-3d" id="tl-3d">${v3 ? "" : preview}</div>
              <small class="muted tl-hint">↔ Arrastra para girar</small>
              <div class="tl-body">${["alta", "bajita", "grande"].map((t) => `<button class="tl-bt ${bodyTypeOf(S.queen.id) === t ? "on" : ""}" data-bt="${t}">${{ alta: "Alta", bajita: "Bajita", grande: "Grande" }[t]}</button>`).join("")}</div>
              <b>${esc(S.queen.name)}</b>
              <small class="shop-st">👣 ${clamp(Math.round(r.mov), 1, 5)}/5</small>
            </div>
            <div class="tl-right"><div class="tl-form">
              ${plan.length ? `<div class="tl-row"><h4>👠 Tus pasarelas</h4><div class="chip-row">${plan.map((c) => `<span class="plan-chip" title="${esc((themeOf(c) || {}).d || "")}">${esc(c)}</span>`).join("")}</div></div>` : ""}
              <div class="tl-row"><h4>👗 Silueta</h4><div class="chip-row">${TALLER.shapes.map((x) => `<button class="plan-chip ${d.shape === x.k ? "on" : ""}" data-sh="${x.k}">${esc(x.n)} <small>${String(x.m).replace(".", ",")} m</small></button>`).join("")}</div></div>
              <div class="tl-row"><h4>🧵 Tela</h4><div class="chip-row">${TALLER.telas.map((x) => `<button class="plan-chip ${d.tela === x.k ? "on" : ""}" data-te="${x.k}">${esc(x.n)} <small>${x.eur} €/m</small></button>`).join("")}</div></div>
              ${T(d.tela).fixed ? "" : `<div class="tl-row"><h4>🎨 Color</h4><div class="tl-colors">${TALLER.colores.map(([n, c]) => `<button class="tl-sw ${d.color === c ? "on" : ""}" data-co="${c}" title="${esc(n)}" style="--c:${c}"></button>`).join("")}</div></div>`}
              <div class="tl-row"><h4>✨ Adornos <small class="muted">(hasta 2)</small></h4><div class="chip-row">${TALLER.adornos.map((x) => `<button class="plan-chip ${d.adornos.includes(x.k) ? "on" : ""}" data-ad="${x.k}">${esc(x.n)} <small>${x.eur} €</small></button>`).join("")}</div></div>
              <div class="tl-row"><h4>🏷️ Nombre</h4><input class="tl-name" maxlength="48" value="${esc(d.name || r.auto)}"></div>
              </div>
              <div class="tl-buy">
                <b>Materiales: ${euros(r.cost)}</b>
                <button class="btn ${money >= r.cost ? "btn-primary" : "btn-ghost"}" id="tl-sew" ${money >= r.cost ? "" : "disabled"}>✂️ Comprar y coser</button>
              </div>
            </div></div>
          </div>
        </div>`;
      host.querySelector(".tl-form").scrollTop = y;
      const slot = host.querySelector("#tl-3d"); slot.__spec = sp3; put3d(slot, sp3);
      host.querySelector("#tl-back").addEventListener("click", back);
      const nm = host.querySelector(".tl-name");
      nm.addEventListener("input", () => (d.name = nm.value.trim() === r.auto ? "" : nm.value));
      const on = (sel, f) => host.querySelectorAll(sel).forEach((b) => b.addEventListener("click", () => { f(b); render(); }));
      on("[data-bt]", (b) => setBodyType(S.queen.id, b.dataset.bt));
      on("[data-sh]", (b) => (d.shape = b.dataset.sh));
      on("[data-te]", (b) => (d.tela = b.dataset.te));
      on("[data-co]", (b) => (d.color = b.dataset.co));
      on("[data-ad]", (b) => {
        const k = b.dataset.ad;
        d.adornos = d.adornos.includes(k) ? d.adornos.filter((x) => x !== k) : [...d.adornos, k].slice(-2);
      });
      host.querySelector("#tl-sew").addEventListener("click", () => sew(calc(), (d.name || "").trim()));
    }
    function sew(r, name) {
      if (Closet.money < r.cost) return;
      kill3d();
      // Se cobra al terminar de coser: si sales a mitad, no pierdes el dinero
      sewingGame(host, r, (pul) => {
        Closet.add(-r.cost);
        const imp = r.imp + (pul - 0.5) * 2.4;
        const it = {
          id: `hecho-${Date.now().toString(36)}`, n: (name || r.auto).slice(0, 48), s: r.s, c: r.look.color, t: [], hecho: true,
          spec: r.look, st: [starsOf(imp), clamp(Math.round(r.mov), 1, 5)], ok: pul >= 0.55, pul: Math.round(pul * 100) / 100,
          desc: r.auto, tela: d.tela,
        };
        const c = Closet.get();
        c.hechos = [...(c.hechos || []), it];
        c.owned[it.id] = 1;
        Closet.set(c);
        syncHechos();
        Confetti.burst(800);
        const verdict = pul >= 0.8 ? "🪡 Acabado de alta costura: ni una puntada fuera de sitio." : pul >= 0.55 ? "🧵 Bien rematado. Aguanta la pasarela sin problema." : pul >= 0.35 ? "🧶 Se notan algunas puntadas torcidas. De lejos pasa." : "🩹 Costuras de batalla: rézale a la cinta de doble cara.";
        host.innerHTML = `
          <div class="shop taller"><div class="tl-sewing">
            <div class="tl-result">
              <div class="tl-3d big" id="tl-3d-res">${Doll.svg(wornSpec(it))}</div>
              <div class="tl-photo" id="tl-photo"><div class="ia-dots"><i></i><i></i><i></i></div><small>Sesión de fotos...</small></div>
            </div>
            <h3>«${esc(it.n)}»</h3>
            <p class="shop-st">👣 ${it.st[1]}/5</p>
            <p>${verdict}</p>
            <div class="choice-row"><button class="btn btn-ghost" id="tl-more">✂️ Coser otro</button><button class="btn btn-primary" id="tl-done">🛍️ Volver a la tienda</button></div>
          </div></div>`;
        host.querySelector("#tl-more").addEventListener("click", () => { kill3d(); d.name = ""; render(); });
        host.querySelector("#tl-done").addEventListener("click", back);
        const rs = host.querySelector("#tl-3d-res"), sp3 = spec3d(it.spec, it.tela, it.s);
        rs.__spec = sp3;
        put3d(rs, sp3);
        // Foto de catálogo del look en 3D para el armario y el probador
        const snapTry = (n) => setTimeout(() => { if (v3 && host.contains(v3.el)) saveRender(it.id, v3.snap()); else if (n > 0) snapTry(n - 1); }, 700);
        snapTry(8);
        lookPhoto(it).then((src) => {
          const box = host.querySelector("#tl-photo");
          if (!box) return;
          if (!src) return box.classList.add("ko");
          const img = new Image();
          img.alt = it.n;
          img.onload = () => box.classList.add("ok");
          img.onerror = () => box.classList.add("ko");
          img.src = src;
          box.prepend(img);
        });
      });
    }
    render();
  }

  // Minijuego de confección: cortas el patrón siguiendo la línea y luego coses la costura en la máquina.
  // Lo bien que sigas las líneas decide la pulidez del acabado.
  function sewingGame(host, r, done) {
    const W = 760, H = 440;
    const tol = 9 + A("estilo") * 1.3;
    host.innerHTML = `
      <div class="shop taller"><div class="sg">
        <div class="sg-head"><h3 id="sg-t">📐 1/2 · Corta el patrón</h3><p id="sg-sub">Mantén pulsado y repasa la línea discontinua con las tijeras. Sin prisa: lo que cuenta es la precisión.</p></div>
        <canvas id="sg-cv" width="${W}" height="${H}"></canvas>
        <div class="sg-bar"><i id="sg-prog"></i></div>
      </div></div>`;
    const cv = host.querySelector("#sg-cv"), g = cv.getContext("2d");
    const prog = host.querySelector("#sg-prog");
    const col = r.look.color || "#c8102e";
    const light = Doll.shade(col, 0.25), dark = Doll.shade(col, -0.35);
    // Fondo de tela según la tela elegida
    function fabric(off = 0) {
      g.fillStyle = "#e9dcc9"; g.fillRect(0, 0, W, H);
      g.fillStyle = col; g.fillRect(40, 20, W - 80, H - 40);
      g.save(); g.beginPath(); g.rect(40, 20, W - 80, H - 40); g.clip();
      const p = r.look.pat;
      for (let y = -40 + (off % 40); y < H + 40; y += 20) for (let x = 40; x < W; x += 20) {
        if (p === "sequins") { g.fillStyle = (x + y) % 40 ? light : "#fff"; g.beginPath(); g.arc(x, y, 3, 0, 7); g.fill(); }
        else if (p === "dots") { if ((x / 20 + y / 20) % 2 === 0) { g.fillStyle = "#fff"; g.beginPath(); g.arc(x, y, 5, 0, 7); g.fill(); } }
        else if (p === "stripes") { if ((x / 20) % 2 === 0) { g.fillStyle = "#f4f1ec"; g.fillRect(x, y, 10, 20); } }
        else if (p === "leopard") { if ((x * 7 + y * 3) % 60 < 20) { g.fillStyle = "#2a1a10"; g.beginPath(); g.ellipse(x, y, 6, 4, 0.6, 0, 7); g.fill(); } }
        else if (p === "flowers") { if ((x + y) % 60 === 0) { g.fillStyle = "#fff"; for (let k = 0; k < 4; k++) { g.beginPath(); g.arc(x + Math.cos(k * 1.57) * 4, y + Math.sin(k * 1.57) * 4, 3.4, 0, 7); g.fill(); } } }
        else if (p === "lace") { g.strokeStyle = light; g.lineWidth = 1; g.beginPath(); g.arc(x, y, 6, 0, 7); g.stroke(); }
        else if (p === "metal") { g.fillStyle = "rgba(255,255,255,.08)"; g.fillRect(x, y, 10, 2); }
        else { g.fillStyle = "rgba(255,255,255,.05)"; g.fillRect(x, y, 1, 20); }
      }
      g.restore();
    }
    // ---- Fase 1: corte del patrón (la pieza depende de la silueta)
    const PIECES = {
      gown: [[330, 60], [430, 60], [440, 150], [560, 390], [200, 390], [320, 150]],
      mermaid: [[340, 50], [420, 50], [430, 150], [420, 280], [520, 395], [240, 395], [340, 280], [330, 150]],
      mini: [[300, 70], [460, 70], [470, 190], [520, 360], [240, 360], [290, 190]],
      jumpsuit: [[310, 50], [450, 50], [455, 170], [470, 395], [395, 395], [380, 220], [365, 395], [290, 395], [305, 170]],
      suit: [[270, 70], [490, 70], [520, 120], [480, 140], [470, 370], [290, 370], [280, 140], [240, 120]],
      bodysuit: [[300, 60], [460, 60], [450, 260], [400, 380], [360, 380], [310, 260]],
      cape: [[330, 50], [430, 50], [600, 390], [160, 390]],
      flamenca: [[330, 50], [430, 50], [440, 200], [520, 260], [470, 290], [560, 340], [500, 395], [260, 395], [200, 340], [290, 290], [240, 260], [320, 200]],
    };
    const poly = (PIECES[r.look.shape] || PIECES.gown).map(([x, y]) => [x, y]);
    // Remuestrea el contorno en puntos cada 8 px
    const path = [];
    for (let i = 0; i < poly.length; i++) {
      const [x1, y1] = poly[i], [x2, y2] = poly[(i + 1) % poly.length];
      const n = Math.max(1, Math.round(Math.hypot(x2 - x1, y2 - y1) / 8));
      for (let k = 0; k < n; k++) path.push([x1 + ((x2 - x1) * k) / n, y1 + ((y2 - y1) * k) / n]);
    }
    const hit = new Array(path.length).fill(false);
    let down = false, devs = [], trail = [], phase = 1, over = false;
    const pos = (e) => { const b = cv.getBoundingClientRect(); return [((e.clientX - b.left) / b.width) * W, ((e.clientY - b.top) / b.height) * H]; };
    const nearest = (x, y) => { let m = 1e9, mi = 0; path.forEach(([px, py], i) => { const d2 = (px - x) ** 2 + (py - y) ** 2; if (d2 < m) { m = d2; mi = i; } }); return [Math.sqrt(m), mi]; };
    function drawCut() {
      fabric();
      g.setLineDash([10, 8]); g.lineWidth = 3; g.strokeStyle = "#fff"; g.beginPath(); path.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); g.closePath(); g.stroke();
      g.setLineDash([]); g.strokeStyle = "#1b1b1b"; g.lineWidth = 2;
      g.beginPath(); trail.forEach((pt, i) => { if (pt) (i && trail[i - 1] ? g.lineTo(pt[0], pt[1]) : g.moveTo(pt[0], pt[1])); }); g.stroke();
      g.font = "28px serif"; if (trail.length && trail[trail.length - 1]) { const [x, y] = trail[trail.length - 1]; g.fillText("✂️", x - 6, y + 10); }
    }
    let cutStart = Date.now();
    function cutMove(e) {
      if (!down || phase !== 1) return;
      const [x, y] = pos(e);
      const [dd, i] = nearest(x, y);
      devs.push(Math.min(dd, 60));
      trail.push([x, y]);
      if (dd < tol + 8) for (let k = -1; k <= 1; k++) hit[(i + k + path.length) % path.length] = true;
      const cov = hit.filter(Boolean).length / path.length;
      prog.style.width = `${Math.round(cov * 100)}%`;
      drawCut();
      if (cov >= 0.92 || Date.now() - cutStart > 45000) endCut();
    }
    let cutQ = 0.5;
    function endCut() {
      if (phase !== 1) return;
      phase = 0;
      const cov = hit.filter(Boolean).length / path.length;
      const mean = devs.length ? devs.reduce((a, b) => a + b, 0) / devs.length : 40;
      cutQ = clamp((1 - mean / (tol * 2.6)) * 0.8 + cov * 0.2, 0, 1);
      host.querySelector("#sg-sub").textContent = cutQ >= 0.7 ? "✂️ Corte limpio. ¡A la máquina!" : cutQ >= 0.45 ? "✂️ Algún mordisco de más, pero sirve. ¡A la máquina!" : "✂️ Uy, ese patrón ha sufrido. Vamos a salvarlo cosiendo bien.";
      setTimeout(startSew, 1300);
    }
    // ---- Fase 2: máquina de coser (la tela avanza y tú guías la aguja por la costura)
    const NY = 170, LEN = 1500, SPEED = 210;
    const seed = Math.random() * 10;
    const seamX = (y) => W / 2 + Math.sin(y / 120 + seed) * 120 + Math.sin(y / 47 + seed * 2) * 34 * (r.dif > 60 ? 1.3 : 1);
    let off = 0, nx = W / 2, sewDevs = [], stitches = [], last = 0, raf = 0;
    function startSew() {
      phase = 2;
      host.querySelector("#sg-t").textContent = "🧵 2/2 · Cose la costura";
      host.querySelector("#sg-sub").textContent = "Mantén pulsado para que la máquina cosa y mueve el ratón a los lados para seguir la línea.";
      prog.style.width = "0%";
      last = performance.now();
      raf = requestAnimationFrame(loop);
    }
    function drawSew() {
      fabric(off);
      g.save(); g.beginPath(); g.rect(40, 20, W - 80, H - 40); g.clip();
      // costura a seguir
      g.setLineDash([12, 8]); g.strokeStyle = "#fff"; g.lineWidth = 3; g.beginPath();
      for (let sy = -20; sy <= H + 20; sy += 6) { const yy = off + (sy - NY); const x = seamX(yy); sy === -20 ? g.moveTo(x, sy) : g.lineTo(x, sy); }
      g.stroke(); g.setLineDash([]);
      // puntadas hechas
      g.strokeStyle = "#ffd34d"; g.lineWidth = 2.5;
      stitches.forEach(([yy, x]) => { const sy = NY + (yy - off); if (sy <= NY && sy > -10) { g.beginPath(); g.moveTo(x, sy - 3); g.lineTo(x, sy + 3); g.stroke(); } });
      g.restore();
      // prensatelas y aguja
      const mg = g.createLinearGradient(nx - 30, 0, nx + 30, 0); mg.addColorStop(0, "#8d939c"); mg.addColorStop(0.5, "#e9edf2"); mg.addColorStop(1, "#7c828b");
      g.fillStyle = mg; g.fillRect(nx - 9, NY - 90, 18, 70); g.beginPath(); g.roundRect ? g.roundRect(nx - 32, NY - 10, 64, 14, 5) : g.rect(nx - 32, NY - 10, 64, 14); g.fill();
      g.strokeStyle = "#cfd5dc"; g.lineWidth = 2; g.beginPath(); g.moveTo(nx, NY - 20); g.lineTo(nx, NY + (down && Math.floor(performance.now() / 60) % 2 ? 8 : 2)); g.stroke();
      g.fillStyle = "rgba(255,255,255,.9)"; g.font = "bold 13px Poppins, sans-serif"; g.textAlign = "center"; g.fillText(down ? "" : "Mantén pulsado para coser", W / 2, 44); g.textAlign = "start";
    }
    function loop(t) {
      const dt = Math.min(0.05, (t - last) / 1000); last = t;
      if (down) {
        off += SPEED * dt;
        const dx = Math.abs(nx - seamX(off));
        sewDevs.push(Math.min(dx, 60));
        if (!stitches.length || off - stitches[stitches.length - 1][0] > 9) stitches.push([off, nx]);
        prog.style.width = `${Math.round((off / LEN) * 100)}%`;
      }
      drawSew();
      if (off >= LEN) return endSew();
      raf = requestAnimationFrame(loop);
    }
    function endSew() {
      cancelAnimationFrame(raf);
      over = true;
      cleanup = null;
      const mean = sewDevs.length ? sewDevs.reduce((a, b) => a + b, 0) / sewDevs.length : 40;
      const sewQ = clamp(1 - mean / (tol * 2.6), 0, 1);
      done(clamp(cutQ * 0.4 + sewQ * 0.6, 0, 1));
    }
    cv.addEventListener("pointerdown", (e) => { down = true; cv.setPointerCapture(e.pointerId); if (phase === 1) { trail.push(null); cutMove(e); } else nx = clamp(pos(e)[0], 40, W - 40); });
    cv.addEventListener("pointermove", (e) => { if (phase === 2) nx = clamp(pos(e)[0], 40, W - 40); else cutMove(e); });
    const up = () => { down = false; };
    cv.addEventListener("pointerup", up);
    cv.addEventListener("pointercancel", up);
    cleanup = () => cancelAnimationFrame(raf);
    drawCut();
  }

  // Foto realista del look terminado (se guarda para verla en el armario, el probador y la pasarela)
  const FOTOS_KEY = "dftc-fotos-looks";
  const photoOf = (id) => ImgDB.get(FOTOS_KEY, id);
  function savePhoto(id, src) {
    return ImgDB.set(FOTOS_KEY, id, src);
  }
  // Las fotos en base64 se reducen a un JPEG pequeño para que quepan en el navegador
  const shrink = (src) => new Promise((res) => {
    if (!src || !src.startsWith("data:")) return res(src);
    const im = new Image();
    im.onload = () => { const w = 384, h = Math.round((im.height / im.width) * w); const c = document.createElement("canvas"); c.width = w; c.height = h; c.getContext("2d").drawImage(im, 0, 0, w, h); try { res(c.toDataURL("image/jpeg", 0.72)); } catch (e) { res(src); } };
    im.onerror = () => res(null);
    im.src = src;
  });
  const EN = {
    shape: { gown: "voluminous floor-length ball gown", mermaid: "fitted mermaid gown with a flared hem", mini: "structured mini dress", jumpsuit: "sleek tailored jumpsuit", suit: "sharp power suit with strong shoulders", bodysuit: "high-cut bodysuit with sheer tights", cape: "bodysuit under a dramatic floor-length cape", flamenca: "Spanish flamenco dress with tiered ruffled skirt" },
    tela: { algodon: "cotton", raso: "satin", tul: "layered tulle", encaje: "lace", terciopelo: "velvet", lunares: "polka-dot fabric", flores: "floral embroidered fabric", leopardo: "leopard print fabric", rayas: "black and white striped fabric", latex: "glossy latex", lame: "metallic lamé", lentejuela: "sequined fabric" },
    adorno: { pedreria: "rhinestone embellishments", plumas: "feather trims", flecos: "fringe", volantes: "ruffles", tachuelas: "metal studs", leds: "glowing LED lights", lazos: "bows", escamas: "iridescent scale appliqués" },
    color: { negro: "black", blanco: "white", rojo: "red", burdeos: "burgundy", fucsia: "fuchsia", rosa: "pink", morado: "purple", "azul noche": "midnight blue", turquesa: "turquoise", verde: "emerald green", amarillo: "yellow", naranja: "orange", dorado: "gold", plata: "silver" },
    wig: { Glamour: "long voluminous Hollywood waves wig", Camp: "huge teased colorful wig", Edgy: "sharp asymmetric black bob wig", Futurista: "sleek platinum chrome wig", Folclórico: "dark hair in a flamenco bun with a peineta and red flowers" },
    skin: ["fair", "light", "medium", "tan", "deep brown", "light olive"],
  };
  function lookPrompt(it) {
    const sp = it.spec || {}, tela = TALLER.telas.find((t) => t.k === it.tela) || TALLER.telas.find((t) => t.pat === sp.pat);
    const colorName = (TALLER.colores.find((c) => c[1] === sp.color) || [""])[0];
    const skinIdx = ["#f6d3b3", "#e9b995", "#d39a72", "#b27650", "#8a5436", "#f3c9a8"].indexOf(skinMe());
    const finish = (it.pul || 0.5) >= 0.8 ? "impeccable couture finish" : (it.pul || 0.5) >= 0.55 ? "clean well-made finish" : (it.pul || 0.5) >= 0.35 ? "slightly uneven handmade seams" : "visibly rough handmade seams";
    return `Full-body professional fashion runway photograph of a drag queen with ${EN.skin[skinIdx] || "medium"} skin, full glamorous drag makeup and a ${EN.wig[TAG_OF_STYLE[it.s]] || EN.wig.Glamour}, wearing a ${EN.color[colorName] || ""} ${EN.shape[sp.shape] || EN.shape.gown} made of ${tela ? EN.tela[tela.k] : "satin"}${(sp.trims || []).length ? ` with ${(sp.trims || []).map((t) => EN.adorno[t]).join(" and ")}` : ""}, ${finish}. Walking on a TV talent show runway, stage lights, pink and purple background, photorealistic, high fashion editorial, head to toe in frame, no text, no logos.`;
  }
  async function lookPhoto(it) {
    const have = photoOf(it.id);
    if (have) return have;
    if (typeof IA === "undefined" || !IA.image) return null;
    const src = await shrink(await IA.image(lookPrompt(it)).catch(() => null));
    if (!src) return null;
    // Solo se guarda si la foto llega de verdad
    const ok = await new Promise((res) => { const im = new Image(); const t = setTimeout(() => res(false), 90000); im.onload = () => { clearTimeout(t); res(true); }; im.onerror = () => { clearTimeout(t); res(false); }; im.src = src; });
    if (!ok) return null;
    savePhoto(it.id, src);
    return src;
  }

