  // ------------------------------ Probador visual ------------------------------
  const skinMe = () => Doll.skinOf(S.queen.id);
  // El jurado (IA) valora si el look cuenta la temática; si no hay IA, se usa la valoración interna
  function judgeFit(st, cat) {
    if (typeof IA === "undefined" || !IA.ready()) return;
    const TH = themeOf(cat);
    IA.chat(
      "Eres el jurado de un concurso drag. Valoras con criterio de moda si un look encaja con la temática de la pasarela.",
      `Temática: «${cat}»${TH ? ` (${TH.d})` : ""}. Piezas del look: ${st.pieces.map((p) => p.n).join("; ")}. La temática está abierta a interpretaciones: no busques los ejemplos de la descripción, valora si el look puede contar la temática de alguna forma reconocible. Devuelve JSON {"encaje": número de 0 a 100, "motivo": "una frase"}. 100 = una lectura clara y potente; 50 = se entiende a medias; 0 = no tiene nada que ver.`,
      { json: true, max: 200, temp: 0.4, timeout: 12000 },
    ).then((r) => { const v = r && Number(r.encaje); if (Number.isFinite(v)) { st.aiFit = clamp(v <= 10 ? v * 10 : v, 0, 100); st.aiWhy = r.motivo || ""; } }).catch(() => {});
  }
  // Probador. o.plan: preparar el look antes de la temporada · o.preset: look ya preparado (se revisa y se puede cambiar)
  function dressingRoom(el, cat, done, prefix = "", o = {}) {
    const TH = themeOf(cat);
    // Puntos de cada pieza: lo que encaje con la temática (interno) y lo espectacular que sea. Lo prestado puntúa poco
    const fitOf = (k, it) => { const f = fitScore(k, it, cat); return it.loan ? 4 + f * 5 : 4 + f * (10 + statOf(it)[0] * 2.6); };
    const IMG = pieceImg;
    const SL = [
      { k: "look", n: "El look", icon: "👗", items: ARMARIO.look.filter((x) => !x.rv || (TH && TH.rv)), base: "base-maniqui" },
      { k: "peluca", n: "La peluca", icon: "💇", items: ARMARIO.peluca, base: "base-cabeza" },
      { k: "zapatos", n: "Los tacones", icon: "👠", items: ARMARIO.zapatos, base: "base-peana" },
      { k: "acc", n: "El toque final", icon: "💄", items: ARMARIO.acc, base: "base-bandeja" },
    ];
    const pre = o.preset || {};
    const mine = pre.look && !pre.look.loan ? pre.look.id : null;
    const used = (id) => id !== mine && (S.usedLooks || []).includes(id);
    // Opciones: todo lo que tienes en tu armario (sin pistas de qué encaja) + un básico prestado por producción
    const opts = SL.map((sl) => {
      const own = sl.items.filter((x) => Closet.has(x.id) && !(sl.k === "look" && used(x.id)));
      const list = own.slice(0, 24);
      const p = pre[sl.k];
      if (p && !p.loan && Closet.has(p.id) && !list.some((x) => x.id === p.id)) list.unshift(ARMARIO[sl.k].find((x) => x.id === p.id) || p);
      let loan = p && p.loan ? ARMARIO[sl.k].find((x) => x.id === p.id) : null;
      if (!loan) {
        const loanPool = sl.items.filter((x) => !Closet.has(x.id) && !used(x.id) && statOf(x)[0] <= 2);
        loan = pick1(loanPool.length ? loanPool : sl.items.filter((x) => !Closet.has(x.id)));
      }
      if (loan) list.push({ ...loan, loan: true });
      return list;
    });
    const chosen = {};
    SL.forEach((sl, i) => { const p = pre[sl.k]; if (p) chosen[sl.k] = opts[i].find((x) => x.id === p.id && !!x.loan === !!p.loan) || null; if (!chosen[sl.k]) delete chosen[sl.k]; });
    const st = { pieces: [], prepRaw: 0 };
    let slot = 0, over = false, editing = false;
    const station = (k, tryIt) => {
      const sl = SL.find((x) => x.k === k);
      const it = tryIt || chosen[k];
      if (!tryIt && it && it.rv && !o.plan) return IMG(it.rv);
      return IMG(it ? it.id : sl.base);
    };
    function setStation(k, it) {
      const img = el.querySelector(`.at-${k} img`);
      if (img) img.src = station(k, it);
    }
    const atelier = () => `
      <div class="at-room">
        <div class="at-queen"><img src="${sprite(S.queen)}" alt=""><b>${esc(S.queen.name)}</b></div>
        <div class="at-look ${slot === 0 && !over ? "on" : ""}"><img src="${station("look")}" alt=""></div>
        <div class="at-side">
          <div class="at-peluca ${slot === 1 && !over ? "on" : ""}"><img src="${station("peluca")}" alt=""></div>
          <div class="at-zapatos ${slot === 2 && !over ? "on" : ""}"><img src="${station("zapatos")}" alt=""></div>
          <div class="at-acc ${slot === 3 && !over ? "on" : ""}"><img src="${station("acc")}" alt=""></div>
        </div>
        <div class="at-cat">${esc(prefix)}«${esc(cat)}»</div>
      </div>`;
    function render() {
      over = false;
      const sl = SL[slot];
      el.innerHTML = `
        <div class="at">
          ${atelier()}
          <div class="at-rack">
            ${editing ? `<p class="muted">Cambiando ${sl.n.toLowerCase()}</p>` : `<div class="dr-steps">${SL.map((s2, i) => `<span class="${i < slot ? "done" : i === slot ? "on" : ""}">${s2.icon}</span>`).join("")}</div>`}
            <h4>${sl.icon} ${sl.n}</h4>
            <div class="at-opts ${opts[slot].length > 4 ? "many" : opts[slot].length > 3 ? "four" : ""}">${opts[slot].map((it, i) => `<button class="dr-opt at-opt ${it.rv ? "has-rv" : ""} ${it.loan ? "loan" : ""} ${chosen[sl.k] === it ? "sel" : ""}" data-i="${i}" style="--i:${i}"><img src="${IMG(it.id)}" alt="">${it.rv ? `<img class="at-rv" src="${IMG(it.rv)}" alt="">` : ""}<span>${esc(it.n)}</span><small class="at-st">${it.loan ? "🔁 Prestado" : `👣${statOf(it)[1]}`}</small></button>`).join("")}</div>
            ${editing ? `<button class="btn btn-ghost" id="dr-keep">↩️ Dejarlo como estaba</button>` : ""}
          </div>
        </div>`;
      const keep = el.querySelector("#dr-keep");
      if (keep) keep.addEventListener("click", () => { editing = false; review(); });
      el.querySelectorAll(".at-opt").forEach((b) => {
        const it = opts[slot][+b.dataset.i];
        b.addEventListener("mouseenter", () => setStation(sl.k, it));
        b.addEventListener("mouseleave", () => setStation(sl.k));
        b.addEventListener("click", () => choose(+b.dataset.i));
      });
    }
    function choose(i) {
      if (over) return;
      const it = opts[slot][i];
      if (!it) return;
      chosen[SL[slot].k] = it;
      if (editing) { editing = false; return review(); }
      if (SL[slot].k === "look" && it.rv && !o.plan) {
        // Prueba del reveal en el maniquí: antes → después
        slot++;
        render();
        const img = el.querySelector(".at-look img");
        if (img) { img.src = IMG(it.id); setTimeout(() => { img.classList.add("rv-flip"); img.src = IMG(it.rv); Confetti.burst(700); }, 700); }
        return;
      }
      Sound.countdown(false);
      slot++;
      if (slot < SL.length) return render();
      o.preset ? review() : finish();
    }
    // Reserva el look (ningún look se repite en la temporada)
    function reserve() {
      const ids = (S.usedLooks || []).filter((x) => x !== mine);
      if (chosen.look && !chosen.look.loan) ids.push(chosen.look.id);
      S.usedLooks = ids;
    }
    const plain = () => { const r = {}; SL.forEach((sl) => { const it = chosen[sl.k]; if (it) r[sl.k] = { id: it.id, loan: !!it.loan }; }); return r; };
    function build() {
      st.pieces = SL.map((sl) => chosen[sl.k]).filter(Boolean);
      st.prepRaw = SL.reduce((t, sl) => t + (chosen[sl.k] ? fitOf(sl.k, chosen[sl.k]) : 0), 0) * (3 / Math.max(3, st.pieces.length));
      st.onTheme = chosen.look ? fitScore("look", chosen.look, cat) >= 0.6 : false;
      st.revealImg = chosen.look && chosen.look.rv ? IMG(chosen.look.rv) : null;
      closeHome(st);
      // Espectacularidad de las piezas (sin mirar si encajan con la temática)
      const own = st.pieces.filter((it) => !it.loan);
      st.impact = clamp(((own.reduce((t, it) => t + statOf(it)[0], 0) + (st.pieces.length - own.length) * 1.5) / Math.max(1, st.pieces.length)) * 16 + (st.cohesion > 1 ? 12 : 0), 0, 100);
    }
    // Look ya preparado: te lo enseñan y puedes cambiar lo que quieras
    function review() {
      over = true;
      el.innerHTML = `
        <div class="at done">
          ${atelier()}
          <div class="at-rack">
            <h4>👗 Tu look es este</h4>
            <p class="dr-msg">«${esc(cat)}»: ${SL.map((sl) => (chosen[sl.k] ? esc(chosen[sl.k].n) : "")).filter(Boolean).join(" · ")}</p>
            <p class="muted">¿Quieres cambiar algo antes de salir?</p>
            <div class="at-edit">${SL.map((sl, i) => `<button class="btn btn-ghost at-chg" data-i="${i}">${sl.icon} ${sl.n}</button>`).join("")}</div>
            <button class="btn btn-primary" id="dr-go">${o.plan ? "✅ Listo" : "👠 ¡A la pasarela!"}</button>
          </div>
        </div>`;
      el.querySelectorAll(".at-chg").forEach((b) => b.addEventListener("click", () => { slot = +b.dataset.i; editing = true; render(); }));
      $("#dr-go").addEventListener("click", () => {
        docOff("keydown", onKey);
        reserve();
        if (o.plan) return done(plain());
        build();
        judgeFit(st, cat);
        done(st, { pieces: { ...chosen } }, plain());
      });
    }
    function finish() {
      over = true;
      docOff("keydown", onKey);
      reserve();
      if (o.plan) {
        el.innerHTML = `
          <div class="at done">
            ${atelier()}
            <div class="at-rack">
              <h4>¡Look preparado!</h4>
              <p class="dr-msg">«${esc(cat)}»: ${SL.map((sl) => (chosen[sl.k] ? esc(chosen[sl.k].n) : "")).filter(Boolean).join(" · ")}</p>
              <button class="btn btn-primary" id="dr-go">${esc(o.next || "Siguiente")}</button>
            </div>
          </div>`;
        Confetti.burst(600);
        $("#dr-go").addEventListener("click", () => done(plain()));
        return;
      }
      build();
      judgeFit(st, cat);
      const msg = `«${esc(cat)}»: ${st.pieces.map((p) => esc(p.n)).join(" · ")}<br><small class="muted">Ahora le toca al jurado decidir si cuenta la temática.</small>`;
      el.innerHTML = `
        <div class="at done">
          ${atelier()}
          <div class="at-rack">
            <h4>¡Look listo!</h4>
            <p class="dr-msg">${msg}</p>
            <button class="btn btn-primary" id="dr-go">👠 ¡A la pasarela!</button>
          </div>
        </div>`;
      Confetti.burst(900);
      $("#dr-go").addEventListener("click", () => done(st, { pieces: { ...chosen } }, plain()));
    }
    const onKey = (e) => { const m = /^Digit([1-8])$/.exec(e.code); if (m) choose(+m[1] - 1); };
    docOn("keydown", onKey);
    cleanup = () => docOff("keydown", onKey);
    if (o.preset && SL.every((sl) => chosen[sl.k])) review();
    else { o.preset = null; render(); }
  }
  // Look para retos de costura (sin probador): sale de la categoría
  function sewnSpec(cat, tint) {
    S.walkMov = 3;
    const main = CAT_TAG[cat] || "Camp";
    const pick = (items) => items.find((x) => TAG_OF_STYLE[x.s] === main) || items[0];
    const sp = { skin: skinMe(), look: Doll.visualOf(pick(ESTILO_PIEZAS.look.items), "look"), wig: Doll.visualOf(pick(ESTILO_PIEZAS.peluca.items), "peluca"), extra: Doll.visualOf(pick(ESTILO_PIEZAS.accesorio.items), "acc") };
    if (tint) sp.look = { ...sp.look, color: tint.color || sp.look.color, pat: tint.pat || sp.look.pat, shape: tint.shape || sp.look.shape };
    return sp;
  }

  // ------------------------------ Pasarela visual ------------------------------
  // En la pasarela sale tu reina; si llevas un look cosido por ti, sale también la foto del look
  function rwFigure(spec) {
    const p = spec && spec.pieces;
    const card = p && isHecho(p.look) ? `<div class="rw-lookcard"><img class="${photoOf(p.look.id) || renderOf(p.look.id) ? "" : "sk"}" src="${pieceImg(p.look.id)}" alt=""><b>${esc(p.look.n)}</b></div>` : "";
    return card +  `<div class="rw-doll rw-queen pos0" id="rw-doll"><img class="doll-fig" src="${sprite(S.queen)}" alt=""></div>`;
  }
  function runwayWalk(el, cat, lookSpec, lookTag, done) {
    if (IA.ready() && !S.meOut) return conceptRunway(el, cat, lookSpec, lookTag, done);
    return classicWalk(el, cat, lookSpec, lookTag, done);
  }
  // Pasarela con concepto: escribes la idea de tu look y eliges tres momentos; el jurado valora concepto y coherencia
  function conceptRunway(el, cat, lookSpec, lookTag, done) {
    const pieces = S.curPieces && S.curPieces.length ? S.curPieces : ["un look cosido en el taller"];
    let qa = null, anaBonus = 0, anaAnswer = "";
    S.curPieces = null;
    const TH = themeOf(cat);
    const flags = {};
    const timers = [];
    const later = (f, ms) => timers.push(setTimeout(f, ms));
    cleanup = () => timers.forEach(clearTimeout);
    const stage = (inner) => `
      <div class="rw">
        <div class="rw-floor"></div>
        <div class="rw-lights">${"<i></i>".repeat(7)}</div>
        ${rwFigure(lookSpec)}
        <div class="rw-cat">«${esc(cat)}»</div>
        <div class="rw-panel">${inner}</div>
      </div>`;
    el.innerHTML = stage(`
      <h4>💭 ¿Cuál es el concepto de tu look?</h4>
      <p class="muted">${TH ? `${esc(TH.d)} · ` : ""}Llevas: ${pieces.map(esc).join(" · ")}</p>
      <form class="ft-form"><input id="rw-cp" maxlength="140" autocomplete="off" placeholder="Ej.: una sirena atrapada en una red de pesca de lujo"><button class="btn btn-primary">Salir a la pasarela</button></form>`);
    el.querySelector("#rw-cp").focus({ preventScroll: true });
    el.querySelector(".ft-form").addEventListener("submit", (e) => {
      e.preventDefault();
      const c = el.querySelector("#rw-cp").value.trim();
      if (c) moments(c);
    });
    async function moments(concept) {
      flags.concepto = concept;
      el.querySelector(".rw-panel").innerHTML = `<div class="ia-dots"><i></i><i></i><i></i></div>`;
      const r = await IA.chat(
        "Eres coreógrafa de pasarela de Drag Race España. Propones momentos de desfile concretos y visuales, coherentes con el concepto y las piezas.",
        `Categoría: «${cat}»${TH ? ` (${TH.d})` : ""}.${S.ballCtx ? ` ${S.ballCtx}` : ""} Piezas: ${pieces.join(", ")}. Concepto de la reina: «${concept}».
Propón 3 opciones para cada momento del desfile: "entrada" (cómo sale), "detalle" (qué enseña a mitad de pasarela) y "final" (cómo remata en la marca). Cada opción en máximo 10 palabras; una de las tres debe encajar mucho mejor con el concepto que las otras.
Añade "pregunta": lo que le pregunta Ana Locking sobre una pieza concreta de su look (tejido, construcción, silueta o elección), máximo 15 palabras, y "respuestas": 3 respuestas posibles de la reina (máximo 18 palabras cada una), una con argumento de moda sólido ("buena"), una emocional pero algo vaga ("regular") y una vacía o que se contradice ("mala").
Devuelve JSON {"entrada":["...","...","..."],"detalle":["...","...","..."],"final":["...","...","..."],"pregunta":"...","respuestas":[{"t":"...","calidad":"buena|regular|mala"}]}`,
        { json: true, max: 800, temp: 0.9 },
      );
      qa = r && str(r.pregunta) && Array.isArray(r.respuestas) && r.respuestas.filter((x) => x && str(x.t)).length >= 3 ? { q: ((t) => (/^¿/.test(t) ? t : `¿${t.replace(/[?.]*$/, "")}?`))(IA.clean(str(r.pregunta))), a: shuffle(r.respuestas.filter((x) => x && str(x.t)).slice(0, 3)).map((x) => ({ t: IA.clean(str(x.t)).slice(0, 140), k: str(x.calidad) })) } : null;
      const def = { entrada: ["Paso firme y mirada a cámara", "Entrada lenta y misteriosa", "Salgo bailando"], detalle: ["Giro para enseñar la espalda", "Juego con el accesorio", "Me toco la peluca con descaro"], final: ["Pose congelada", "Guiño al jurado", "Me tiro al suelo con drama"] };
      const M = ["entrada", "detalle", "final"].map((k) => ({ k, opts: (r && Array.isArray(r[k]) && r[k].length >= 2 ? r[k].map(str) : def[k]).slice(0, 3).map(IA.clean) }));
      if (S.revealImg) M[2].opts.push("🎁 ¡Hacer el reveal!");
      const picks = [];
      const NAMES = { entrada: "🚶 La entrada", detalle: "✨ A mitad de pasarela", final: "📸 En la marca" };
      const CLS = ["pos1", "pos2", "pos2"];
      const step = (i) => {
        if (i >= M.length) return qa ? askAna(concept, picks) : judge(concept, picks);
        const m = M[i];
        el.querySelector(".rw-panel").innerHTML = `<h4>${NAMES[m.k]}</h4><div class="choice-col">${m.opts.map((o, j) => `<button class="btn btn-ghost rwc" data-j="${j}">${esc(o)}</button>`).join("")}</div>`;
        el.querySelectorAll("[data-j]").forEach((b) => b.addEventListener("click", () => {
          const o = m.opts[+b.dataset.j];
          picks.push(`${m.k}: ${o}`);
          const doll = el.querySelector("#rw-doll");
          doll.className = `rw-doll rw-queen ${CLS[i]} ${i === 0 ? `walk-${WALK_OF_TAG[lookTag] || "fuerte"}` : i === 2 ? "pose" : ""}`;
          if (o.startsWith("🎁")) {
            flags.reveal = true;
            doll.classList.add("spin");
            later(() => {
              doll.classList.add("revealed");
              const card = document.createElement("div");
              card.className = "rw-rvcard";
              card.innerHTML = `<img src="${S.revealImg}" alt=""><b>¡REVEAL!</b>`;
              el.querySelector(".rw").append(card);
              Confetti.burst(1600);
            }, 600);
          }
          el.querySelector(".rw-panel").innerHTML = `<p class="rw-quote">${esc(o)}</p>`;
          later(() => step(i + 1), 1500);
        }));
      };
      step(0);
    }
    // Ana te pregunta por el look: defender bien la moda cuenta
    function askAna(concept, picks) {
      el.querySelector(".rw-panel").innerHTML = `<h4>👓 Ana Locking te pregunta</h4><p class="rw-quote">${esc(qa.q)}</p><div class="choice-col">${qa.a.map((x, j) => `<button class="btn btn-ghost rwc" data-qa="${j}">${esc(x.t)}</button>`).join("")}</div>`;
      el.querySelectorAll("[data-qa]").forEach((b) => b.addEventListener("click", () => {
        const x = qa.a[+b.dataset.qa];
        anaBonus = /buena/.test(x.k) ? 6 : /mala/.test(x.k) ? -6 : 0;
        anaAnswer = `Ana le preguntó «${qa.q}» y respondió: «${x.t}».`;
        judge(concept, picks);
      }));
    }
    async function judge(concept, picks) {
      el.querySelector(".rw-panel").innerHTML = `<h4>El jurado toma nota...</h4><div class="ia-dots"><i></i><i></i><i></i></div>`;
      const r = await IA.chat(
        "Eres el jurado de Drag Race España valorando una pasarela: Supremme de Luxe (espectáculo y actitud) y Ana Locking (moda, construcción y coherencia). Sois exigentes: un concepto genérico o que no tiene nada que ver con lo que lleva puntúa bajo. Pero la temática es un punto de partida, no una lista de requisitos: cada reina la interpreta a su manera.",
        `Categoría: «${cat}»${TH ? ` (${TH.d})` : ""}.${S.ballCtx ? ` ${S.ballCtx}` : ""} Lo que lleva: ${pieces.join(", ")}. Concepto que defiende: «${concept}». Su desfile: ${picks.join("; ")}.${flags.reveal ? " Hace un reveal." : ""}${anaAnswer ? ` ${anaAnswer} Tenlo en cuenta en la coherencia y en lo que dice Ana.` : ""}
La temática está abierta a interpretaciones: cualquier lectura vale si el concepto la justifica y el look la cuenta. No penalices por no usar los ejemplos de la descripción; premia las interpretaciones propias y bien defendidas.
Valora de 0 a 100: "concepto" (originalidad y fuerza de la idea), "coherencia" (si el concepto es una interpretación defendible de la temática y si lo que lleva lo cuenta) y "desfile" (si los momentos elegidos cuentan esa historia). Añade "supreme" y "ana": una frase de cada una, máximo 25 palabras, dirigida a la reina.
Devuelve JSON {"concepto":0,"coherencia":0,"desfile":0,"supreme":"...","ana":"..."}`,
        { json: true, max: 400, temp: 0.6 },
      );
      const n = (v, d) => clamp(Math.round(v != null && Number.isFinite(+v) ? +v : d), 0, 100);
      const c1 = n(r && r.concepto, 55), c2 = n(r && r.coherencia, 55), c3 = n(r && r.desfile, 55);
      let score = c1 * 0.35 + c2 * 0.4 + c3 * 0.25 + (A("estilo") - 5) + (A("performance") - 5) * 0.5;
      if (flags.reveal && /reveal/i.test(cat)) score += 6;
      score += anaBonus;
      score = clamp(Math.round(score), 0, 100);
      flags.critica = r ? `${str(r.supreme)} ${str(r.ana)}` : null;
      el.querySelector(".rw-panel").innerHTML = `
        <h4>⚖️ El jurado opina</h4>
        ${r && r.supreme ? `<p class="lv host"><b>Supremme</b>${esc(IA.clean(str(r.supreme)))}</p>` : ""}
        ${r && r.ana ? `<p class="lv host"><b>Ana Locking</b>${esc(IA.clean(str(r.ana)))}</p>` : ""}
        <button class="btn btn-primary" id="rw-done">Continuar</button>`;
      logEv(`Pasarela «${cat}»: ${S.queen.name} defiende el concepto «${concept}» (nota ${score})`);
      el.querySelector("#rw-done").addEventListener("click", () => { cleanup = null; done(score, flags, lookSpec); });
    }
  }
  function classicWalk(el, cat, lookSpec, lookTag, done) {
    const flags = {};
    const timers = [];
    const later = (f, ms) => timers.push(setTimeout(f, ms));
    cleanup = () => timers.forEach(clearTimeout);
    let phase = 0, tot = 0, n = 0, busy = false, spec = lookSpec;
    const WALKS = [["fuerte", "💥", "Fuerte"], ["flotado", "🕊️", "Flotado"], ["comico", "🤪", "Cómico"], ["provocador", "🔥", "Provocador"]];
    el.innerHTML = `
      <div class="rw">
        <div class="rw-floor"></div>
        <div class="rw-lights">${"<i></i>".repeat(7)}</div>
        ${rwFigure(lookSpec)}
        <div class="rw-cat">«${esc(cat)}»</div>
        <div class="rw-sub" id="rw-sub"></div>
        <div class="rw-choices" id="rw-ch"></div>
      </div>`;
    const doll = $("#rw-doll"), sub = $("#rw-sub"), ch = $("#rw-ch");
    const add = (p) => { tot += p; n++; };
    const say = (t, cls = "") => { sub.className = `rw-sub show ${cls}`; sub.innerHTML = t; };
    const ask = (q, list) => {
      busy = false;
      say(q, "q");
      ch.innerHTML = list.map((o, i) => `<button class="rw-opt ${o.wide ? "wide" : ""}" data-i="${i}" style="--i:${i}">${o.ico ? `<i>${o.ico}</i>` : ""}<span>${o.t}</span></button>`).join("");
      ch.querySelectorAll(".rw-opt").forEach((b) => b.addEventListener("click", () => { if (busy) return; busy = true; ch.innerHTML = ""; list[+b.dataset.i].go(); }));
    };
    function step0() {
      const best = WALK_OF_TAG[lookTag] || "fuerte";
      ask("¿Cómo sales a la pasarela?", WALKS.map(([k, ico, t]) => ({ ico, t, go: () => {
        doll.className = `rw-doll pos1 walk-${k}`;
        const ok = k === best;
        add((ok ? 92 : 52) + Math.round(((S.walkMov || 3) - 3) * 4));
        later(() => say(ok ? "✨ El paso y el look van de la mano" : "Bien caminado... pero no pega con lo que llevas", ok ? "good" : "meh"), 900);
        later(step1, 2600);
      } })));
    }
    function step1() {
      ask("Final de pasarela. ¡Es tu momento!", [
        { ico: "🖼️", t: "Pose", go: () => { flash(); doll.classList.add("pose"); if (/reveal/i.test(cat)) { add(35); say("📸 Pose bonita... pero esta pasarela era de REVEAL", "meh"); } else { add(["Glamour", "Edgy"].includes(lookTag) ? 82 : 68); say("📸 Pose limpia. El fotógrafo, contento.", "good"); } later(step2, 2200); } },
        { ico: "🤡", t: "Comedia", go: () => { doll.classList.add("funny"); const ok = lookTag === "Camp" && !/reveal/i.test(cat); add(ok ? 94 : /reveal/i.test(cat) ? 35 : 48); say(ok ? "😂 ¡Carcajada en el jurado!" : "El gesto no casaba con el look...", ok ? "good" : "meh"); later(step2, 2200); } },
        { ico: "🎁", t: "Reveal", go: () => {
          const c = check(["performance", "carisma"], 60);
          const rvTheme = /reveal/i.test(cat);
          if (c.ok || (rvTheme && S.revealImg && Math.random() < 0.85)) {
            doll.classList.add("spin");
            later(() => {
              doll.classList.add("revealed");
              if (S.revealImg) {
                const card = document.createElement("div");
                card.className = "rw-rvcard";
                card.innerHTML = `<img src="${S.revealImg}" alt=""><b>¡REVEAL!</b>`;
                el.querySelector(".rw").append(card);
              }
              Confetti.burst(1600);
              Sound.powerup && Sound.powerup();
            }, 600);
            add(100);
            say(`🎁 ¡REVEAL! El público se viene arriba<br><small>${c.txt}</small>`, "good");
          } else {
            flags.atascado = true;
            doll.classList.add("stuck");
            Sound.impact();
            add(15);
            say(`😱 ¡Traje atascado! El reveal no se abre...<br><small>${c.txt}</small>`, "bad");
          }
          later(step2, 2800);
        } },
      ]);
    }
    function step2() {
      doll.className = "rw-doll pos2";
      const key = CAT_TAG[cat] || lookTag;
      const good = pick1(VOICEOVERS[key] || VOICEOVERS.Glamour);
      const other = pick1(VOICEOVERS[pick1(TAGS.filter((t) => t !== key))]);
      ask("🎙️ Tu voz en off...", shuffle([
        { wide: true, t: good, go: () => { flags.voiceGood = true; add(96); caption(good, "El jurado asiente: esa frase lo resume todo", "good"); } },
        { wide: true, t: other, go: () => { add(55); caption(other, "Bonita frase... para otra categoría", "meh"); } },
        { wide: true, t: pick1(VOICE_OFF), go: () => { add(25); caption("…", "Silencio en la mesa del jurado", "bad"); } },
      ]));
    }
    function caption(t, verdict, cls) {
      say(`<span class="rw-quote">${t}</span><br><small>${verdict}</small>`, cls);
      later(() => done(tot / Math.max(1, n), flags, spec), 2600);
    }
    function flash() {
      const f = document.createElement("div");
      f.className = "rw-flash";
      el.querySelector(".rw").append(f);
      later(() => f.remove(), 500);
    }
    later(step0, 700);
  }

  // ------------------------------ Lip sync (energía) ------------------------------
  // Cada truco tira de algo distinto: la revelación del look (Estilo), la caída (Performance, difícil) y el split (Performance, más seguro)
  const EMOTES = [["revelacion", "🎁 Revelación", "estilo", 52, 66], ["caida", "💥 La caída (death drop)", "performance", 56, 76], ["split", "🤸 Split", "performance", 46, 60]];
  function runLipsync(el, rival, done, songPick, bonus = 0) {
    const ra = attrsOf(rival);
    const song = songPick || null;
    // Escala pensada para que, con atributos iguales, la jugadora gane algo más de la mitad de las veces
    let rival_ = clamp(40 + (ra.performance + ra.carisma) * 6.5 + clamp(S.form[rival.id] || 0, -6, 6) * 2 + seasonBoost() * 1.5 + rnd(-12, 12), 45, 175);
    const PH = ["Inicio", "Puente", "Clímax"];
    let cfgTop = null;
    const steps = [];
    PH.forEach((ph, pi) => {
      [0, 1].forEach((j) => steps.push((st) => {
        const clim = pi === 2;
        const opts = [
          ...EMOTES.map(([k, t, at, dif, top]) => ({
            t: `${t}`, d: `Energía −45 · ${ATTR_NAMES[at]}${clim ? " · ¡Momento perfecto!" : " · Mejor en el clímax"}`, tag: "Emote",
            go: (s) => {
              if (s.energy < 45) { s.energy = Math.max(0, s.energy - 10); s.mine += 4; return { pts: 20, msg: "Sin fuelle: el truco se queda a medias." }; }
              s.energy -= 45;
              const c = check([at], clim ? dif : dif + 8);
              const imp = c.ok ? (clim ? top : 24) : 6;
              s.mine += imp;
              return { pts: c.ok ? (clim ? 100 : 70) : 20, msg: `${c.txt}<br>${c.ok ? (clim ? "¡El público se levanta!" : "Impresiona... aunque era pronto.") : "¡Uf! Se te va el truco."}` };
            },
          })),
          { t: "💗 Conexión emocional", d: `Energía −10 · Carisma ${A("carisma")}`, tag: "Cara", go: (s) => { if (s.energy < 10) { s.mine += 2; return { pts: 20, msg: "Estás agotada: ni la cara te responde." }; } s.energy -= 10; const imp = 8 + A("carisma") * 1.6; s.mine += imp; return { pts: 55 + A("carisma") * 4, msg: "Cada palabra la sientes. Se te ve en los ojos." }; } },
          { t: "🌀 Uso del espacio", d: `Energía −15 · Performance ${A("performance")}`, tag: "Escenario", go: (s) => { if (s.energy < 15) { s.mine += 2; return { pts: 20, msg: "Sin energía para moverte." }; } s.energy -= 15; const imp = 12 + A("performance") * 2; s.mine += imp; return { pts: 55 + A("performance") * 4, msg: "Te comes el escenario de punta a punta." }; } },
        ];
        // Solo un emote al azar por turno para que haya que pensar
        const em = pick1(opts.slice(0, 3));
        return {
          q: `🎵 ${ph} de la canción · ${j + 1}/2`,
          sub: `${song ? `Canción: <b>${esc(song)}</b> · ` : ""}${rivalMove(rival, pi, j)}`,
          opts: [em, opts[3], opts[4]],
        };
      }));
    });
    runSteps(el, {
      title: `Lip sync: ${S.queen.name} vs ${rival.name}`, icon: "💋", meters: ["energy"], init: { mine: 0, songBonus: bonus, step: 0 },
      top: (cfgTop = (st) => {
        const mx = Math.max(rival_, st.mine, 120);
        const rv = rival_ * (st.step / 6);
        return `<div class="ls-stage">
          <div class="ls-q me ${st.anim || ""}"><img src="${sprite(S.queen)}" alt=""><b>Tú</b></div>
          <div class="ls-vs">VS</div>
          <div class="ls-q rival ${st.ranim || ""}"><img src="${sprite(rival)}" alt=""><b>${esc(rival.name)}</b></div>
        </div>
        <div class="ls-crowd"><span>👏 Público</span><div class="ls-bar"><i class="me" style="width:${(st.mine / mx) * 100}%"></i></div><div class="ls-bar"><i class="rv" style="width:${(rv / mx) * 100}%"></i></div></div>`;
      }),
      onPick: (st, o) => {
        st.step++;
        st.anim = o.tag === "Emote" ? "emote" : o.tag === "Cara" ? "feel" : "move";
        st.ranim = pick1(["emote", "feel", "move"]);
        const t = $("#dc-top");
        if (t) t.innerHTML = cfgTop(st);
      },
      steps,
      finish: (st, base) => {
        st.mine += st.songBonus || 0;
        st.won = st.mine >= rival_;
        return base;
      },
    }, (score, st) => done(st.won, score));
  }
  const RIVAL_MOVES = [
    ["{r} arranca muy segura, mirando a cámara.", "{r} empieza con calma, guardándose algo."],
    ["{r} se marca unas vueltas por todo el escenario.", "{r} baja al suelo y el público grita."],
    ["¡{r} se tira un death drop!", "{r} se quita la peluca y la lanza al aire."],
  ];
  const rivalMove = (r, pi, j) => (j === 0 ? pick1(RIVAL_MOVES[pi]).replace("{r}", esc(r.name)) : "¿Cuál es tu siguiente movimiento?");
  // Sustituye al juego de arcade en el modo historia: misma forma de respuesta
  function lsGame(rival, cb) {
    UI.show("story");
    setSet("stage");
    header();
    body().innerHTML = `<div id="story-play"></div>`;
    Music.play("reto");
    const lsb = S.lsBonus || 0;
    S.lsBonus = 0;
    runLipsync($("#story-play"), rival, (won, score) => {
      cleanup = null;
      Music.stop();
      if (typeof window.__forceScore === "number") won = window.__forceScore >= 50;
      cb({ won, score: Math.round(score * 10) });
    }, undefined, lsb);
  }

