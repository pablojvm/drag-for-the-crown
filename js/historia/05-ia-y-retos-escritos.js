  // ------------------------------ Etiquetas de moda ------------------------------
  const TAGS = ["Glamour", "Camp", "Edgy", "Folclórico", "Futurista"];
  const TAG_OF_STYLE = { glam: "Glamour", clasico: "Glamour", retro: "Camp", street: "Edgy", futur: "Futurista", folk: "Folclórico", natural: "Folclórico" };
  const CAT_TAG = {
    "Rojo pasión": "Glamour", "Brilla, brilla": "Glamour", "Realeza": "Glamour", "Animal print": "Edgy", "Años 80": "Camp",
    "Futurista": "Futurista", "Flores y más flores": "Folclórico", "Blanco y negro": "Edgy", "Look de gala": "Glamour", "Folclore reinventado": "Folclórico",
    "Camp absoluto": "Camp", "Comida basura de lujo": "Camp", "Cuero y tachuelas": "Edgy", "Galaxia lejana": "Futurista", "Verbena de pueblo": "Folclórico",
  };
  CATEGORIAS.push("Camp absoluto", "Comida basura de lujo", "Cuero y tachuelas", "Galaxia lejana", "Verbena de pueblo");
  BALLS.forEach((b) => b.c.forEach(([n, tag]) => (CAT_TAG[n] = CAT_TAG[n] || tag)));
  const WALK_OF_TAG = { Glamour: "flotado", Camp: "comico", Edgy: "fuerte", Futurista: "fuerte", Folclórico: "provocador" };
  const MAQUILLAJES = [
    { n: "Maquillaje dorado de gala", c: "#d4a93a", s: "glam", t: ["Look de gala", "Brilla, brilla"] },
    { n: "Ojo gráfico en blanco y negro", c: "#222", s: "street", t: ["Blanco y negro"] },
    { n: "Cara de payaso glam", c: "#ff5fa2", s: "retro", t: ["Camp absoluto"] },
    { n: "Pestañas de neón y cromo", c: "#6ee7ff", s: "futur", t: ["Futurista", "Galaxia lejana"] },
    { n: "Lunar y labio rojo racial", c: "#b3122a", s: "folk", t: ["Folclore reinventado", "Verbena de pueblo"] },
    { n: "Piercings falsos y ojo ahumado", c: "#333", s: "street", t: ["Cuero y tachuelas", "Animal print"] },
  ];
  const VOICEOVERS = {
    Glamour: ["«Nací brillando y pienso morir brillando»", "«No es un vestido, es una declaración de intenciones»"],
    Camp: ["«Si no te ríes, es que no lo has entendido»", "«Más es más, y hoy es muchísimo más»"],
    Edgy: ["«Que me teman un poquito, que así me respetan»", "«Las normas me las como con el desayuno»"],
    Futurista: ["«Vengo de dentro de trescientos años a salvar la moda»", "«Aterrizaje confirmado: la diva ha llegado»"],
    Folclórico: ["«De mi pueblo al mundo, con volantes y a mucha honra»", "«La tradición también sabe hacer drag»"],
  };
  const VOICE_OFF = ["«Hola, soy yo y esto es un vestido»", "«Pues nada, aquí estamos»", "«Me lo he puesto porque estaba limpio»", "«¿Esto ya está grabando?»"];

  // Fase 1 (de casa): sinergia de etiquetas con 3 piezas
  function prepHome(cat) {
    const main = CAT_TAG[cat] || "Glamour";
    const slots = [
      { k: "look", n: "Outfit", icon: "👗", items: ESTILO_PIEZAS.look.items },
      { k: "peluca", n: "Peluca / pelo", icon: "💇", items: ESTILO_PIEZAS.peluca.items },
      { k: "acc", n: "Accesorios / maquillaje", icon: "💄", items: [...ESTILO_PIEZAS.accesorio.items, ...MAQUILLAJES] },
    ];
    const tagOf = (it) => TAG_OF_STYLE[it.s];
    const fit = (it) => (tagOf(it) === main || it.t.includes(cat) ? 22 : 9);
    return slots.map((sl) => (st) => {
      const all = sl.items;
      const a = shuffle(all.filter((x) => tagOf(x) === main || x.t.includes(cat)));
      const b = shuffle(all.filter((x) => !(tagOf(x) === main || x.t.includes(cat))));
      const opts = shuffle([a[0] || b[2], b[0], b[1]].filter(Boolean));
      return {
        q: `${sl.icon} Elige ${sl.n.toLowerCase()}`,
        sub: `Categoría: <b>«${esc(cat)}»</b>. Las etiquetas de cada pieza están ocultas: lee bien el nombre.`,
        opts: opts.map((it) => ({
          t: `<i class="dc-sw" style="--c:${it.c}"></i>${esc(it.n)}`,
          go: (s) => {
            (s.pieces = s.pieces || []).push(it);
            s.prepRaw = (s.prepRaw || 0) + fit(it);
            return {};
          },
        })),
      };
    });
  }
  // Cierra la preparación de casa: multiplicador por cohesión
  function closeHome(st) {
    const tags = (st.pieces || []).map((it) => TAG_OF_STYLE[it.s]);
    const cnt = {};
    tags.forEach((t) => (cnt[t] = (cnt[t] || 0) + 1));
    const top = Object.entries(cnt).sort((a, b) => b[1] - a[1])[0] || ["Glamour", 0];
    const mult = top[1] >= 3 ? 1.5 : top[1] === 2 ? 1.2 : 1;
    st.lookTag = top[0];
    st.prep = clamp((st.prepRaw || 0) * mult, 0, 100);
    st.cohesion = mult;
    return `${mult === 1.5 ? "✨ ¡Cohesión perfecta! x1,5" : mult === 1.2 ? "👍 Dos piezas comparten estilo: x1,2" : "😬 Ninguna pieza combina: x1,0"} · Estilo dominante: <b>${top[0]}</b>`;
  }
  // Fase 1 (taller): 10 PA entre materiales, patronaje y acabados
  function prepSew(el, title, diffExtra, then) {
    const pa = { mat: 3, pat: 4, fin: 3 };
    const draw = () => {
      const left = 10 - pa.mat - pa.pat - pa.fin;
      el.innerHTML = `
        <div class="mg dc">
          <p class="mg-info">🧵 ${esc(title)}</p>
          <div class="dc-scene"><h4>Reparte 10 puntos de acción</h4><p>Quedan <b>${left}</b> PA · Tu Estilo: <b>${A("estilo")}</b>${diffExtra ? " · Material difícil de coser" : ""}</p></div>
          <div class="pa-grid">${[
            ["mat", "🔎 Búsqueda de materiales", "Sube la Originalidad"],
            ["pat", "✂️ Patronaje y costura", "Más patronaje, menos riesgo de que se descosa en la pasarela"],
            ["fin", "✨ Acabados y detalle", "Sube el valor global del look"],
          ]
            .map(([k, n, d]) => `<div class="pa-row"><div><b>${n}</b><small>${d}</small></div><button class="btn btn-ghost pa-b" data-k="${k}" data-d="-1">−</button><em>${pa[k]}</em><button class="btn btn-ghost pa-b" data-k="${k}" data-d="1">+</button></div>`)
            .join("")}</div>
          <button class="btn btn-primary" id="pa-go" ${left ? "disabled" : ""}>¡A coser!</button>
        </div>`;
      el.querySelectorAll(".pa-b").forEach((b) => b.addEventListener("click", () => {
        const k = b.dataset.k, d = +b.dataset.d;
        const left2 = 10 - pa.mat - pa.pat - pa.fin;
        if (d > 0 && left2 <= 0) return;
        if (d < 0 && pa[k] <= 0) return;
        pa[k] += d;
        draw();
      }));
      $("#pa-go").addEventListener("click", sew);
    };
    function sew() {
      const c = check(["estilo"], 70 - pa.pat * 4 + diffExtra);
      const gain = (x) => 26 * (1 - Math.exp(-x / 3));
      let score = 20 + gain(pa.mat) + (c.ok ? gain(pa.pat) : 0) + gain(pa.fin);
      if (!c.ok) score *= 0.8;
      el.innerHTML = `
        <div class="mg dc">
          <p class="mg-info">🧵 ${esc(title)}</p>
          <div class="dc-scene"><h4>${c.ok ? "¡Costuras perfectas!" : "Uy... el traje está descosido"}</h4><p>${c.txt}</p>
          <p>Originalidad ${"★".repeat(Math.min(5, Math.ceil(pa.mat / 2)))} · Pulidez ${c.ok ? "★".repeat(Math.min(5, Math.ceil(pa.pat / 2))) : "✖"} · Acabados ${"★".repeat(Math.min(5, Math.ceil(pa.fin / 2)))}</p></div>
        </div>`;
      c.ok ? Sound.powerup && Sound.powerup() : Sound.impact();
      setTimeout(() => then(clamp(score, 0, 100), { descosido: !c.ok, pa }), 1700);
    }
    draw();
  }
  // Fase 2: el desfile en 3 decisiones
  function walkSteps(cat, getLookTag) {
    return [
      (st) => {
        const tag = getLookTag(st);
        const best = WALK_OF_TAG[tag] || "fuerte";
        const W = [["fuerte", "💥 Paso fuerte", "Editorial, con autoridad"], ["flotado", "🕊️ Flotado", "Elegante, como sin tocar el suelo"], ["comico", "🤪 Cómico", "Con gracia y exageración"], ["provocador", "🔥 Provocador", "Cadera y mirada"]];
        return {
          q: "👠 ¿Cómo caminas?",
          sub: `Tu look es <b>${esc(tag)}</b>. El paso tiene que ir con la ropa.`,
          opts: W.map(([k, t, d]) => ({ t, d, go: () => (k === best ? { pts: 92, msg: "¡El paso y el look van de la mano!" } : { pts: 52, msg: "Bien caminado, pero no pega mucho con lo que llevas." }) })),
        };
      },
      (st) => ({
        q: "📸 Final de pasarela: ¿qué haces?",
        opts: [
          { t: "🖼️ Pose editorial", d: "Segura y elegante", go: () => ({ pts: ["Glamour", "Edgy"].includes(getLookTag(st)) ? 82 : 68, msg: "Pose limpia. El fotógrafo, contento." }) },
          { t: "🤡 Gesto de comedia", d: "Arriesgado si el look no es Camp", go: () => (getLookTag(st) === "Camp" ? { pts: 94, msg: "¡Carcajada en el jurado!" } : { pts: 48, msg: "El gesto no casaba con el look." }) },
          {
            t: "🎁 Revelación (reveal)",
            d: "Performance + Carisma. Si sale, puntuación máxima",
            go: () => {
              const c = check(["performance", "carisma"], 60 - Math.round(((S.walkMov || 3) - 3) * 5));
              if (!c.ok) st.atascado = true;
              return res(c, 100, 15, "¡REVEAL! El público se viene arriba.", "¡Traje atascado! El reveal no se abre...");
            },
          },
        ],
      }),
      (st) => {
        const tag = getLookTag(st);
        const good = pick1(VOICEOVERS[CAT_TAG[cat] || tag] || VOICEOVERS.Glamour);
        const other = pick1(VOICEOVERS[pick1(TAGS.filter((t) => t !== (CAT_TAG[cat] || tag)))]);
        return {
          q: "🎙️ Frase de cierre (voz en off)",
          sub: `Categoría: «${esc(cat)}»`,
          opts: shuffle([
            { t: good, go: () => { st.voiceGood = true; return { pts: 96, msg: "El jurado asiente: esa frase lo resume todo." }; } },
            { t: other, go: () => ({ pts: 55, msg: "Bonita frase... para otra categoría." }) },
            { t: pick1(VOICE_OFF), go: () => ({ pts: 25, msg: "Silencio en la mesa del jurado." }) },
          ]),
        };
      },
    ];
  }
  // Pasarela completa (de casa): probador + desfile
  function runRunwayNew(el, cat, done, prefix = "") {
    const preset = (S.prepLooks || {})[cat] || null;
    dressingRoom(el, cat, (st, spec, plain) => {
      if (preset && plain) S.prepLooks[cat] = plain;
      S.revealImg = st.revealImg || null;
      // El movimiento sale de las piezas; los tacones cuentan el doble
      const wOf = (it) => (slotOf(it) === "zapatos" ? 2 : 1);
      S.walkMov = st.pieces.length ? st.pieces.reduce((t, it) => t + (it.loan ? 3 : statOf(it)[1]) * wOf(it), 0) / st.pieces.reduce((t, it) => t + wOf(it), 0) : 3;
      S.curPieces = st.pieces.map((it) => `${it.n}${it.loan ? " (prestado)" : ""}`);
      runwayWalk(el, cat, spec, st.lookTag || "Glamour", (walk, flags, finalSpec) => {
        S.lastOutfit = finalSpec;
        S.lookTags = [...(S.lookTags || []), st.lookTag || "Glamour"].slice(-6);
        S.revealImg = null;
        S.lastLook = { cat, best: st.pieces[0] ? st.pieces[0].n : "look", worst: st.pieces.slice(-1)[0] ? st.pieces.slice(-1)[0].n : "look", atascado: flags.atascado, voiceGood: flags.voiceGood, concepto: flags.concepto || null, critica: flags.critica || null };
        // Con concepto, la temática es abierta: manda la interpretación (jurado) y la espectacularidad de las piezas
        if (flags.concepto) return done(walk * 0.75 + (st.impact || 50) * 0.25);
        const prep = st.aiFit != null ? st.prep * 0.5 + st.aiFit * 0.5 : st.prep;
        done(prep * 0.5 + walk * 0.5);
      });
    }, prefix, { preset });
  }


  // ------------------------------ Director de escenas (IA) ------------------------------
  // Identidad propia de cada reina (se crea una vez y se recuerda entre temporadas)
  const ID_KEY = "dftc-identidades2";
  const idOf = (q) => (store.get(ID_KEY, {}) || {})[q.id] || null;
  let idsBusy = null;
  function ensureIdentities() {
    if (!IA.ready() || idsBusy) return idsBusy;
    const all = store.get(ID_KEY, {}) || {};
    const need = [...S.rivals, ...S.out].filter((q) => !all[q.id]);
    if (!need.length) return null;
    idsBusy = IA.chat(
      "Creas fichas de personaje para un videojuego sobre un concurso drag. Cada reina es un personaje de ficción del juego, con su nombre artístico como única referencia: inventa una personalidad rica y distinta para cada una, sin datos de su vida real.",
      `Crea una identidad para cada una de estas reinas: ${need.map((q) => `${q.id} (${q.name}${S.roles[q.id] && ROLES_HISTORIA[S.roles[q.id]] ? `, en el taller es ${ROLES_HISTORIA[S.roles[q.id]].name}` : ""})`).join("; ")}.
Devuelve JSON {"reinas":[{"id":"...","voz":"registro (tranquila, irónica, seca, intensa, tímida...) y ritmo; repártelos, no todas son exageradas","muletillas":["1 expresión suya, normal, para usar de vez en cuando, nunca en cada frase"],"drag":"su estilo drag en una frase","pasado":"de dónde viene y qué la trajo al drag (inventado)","ambicion":"qué quiere demostrar","miedo":"su inseguridad","trato":"cómo trata a las demás"}]}. Que todas suenen muy distintas entre sí y sean creíbles: de distintas partes de España, la mayoría con un habla natural, no exagerada; nada de nena ni mi arma.`,
      { json: true, max: 3500, temp: 1, timeout: 45000 },
    ).then((r) => {
      idsBusy = null;
      if (!r || !Array.isArray(r.reinas)) return;
      const cur = store.get(ID_KEY, {}) || {};
      r.reinas.forEach((x) => { if (x && x.id && qById(x.id)) cur[x.id] = x; });
      store.set(ID_KEY, cur);
    });
    return idsBusy;
  }
  const idTxt = (q) => {
    const i = idOf(q);
    return i ? `Identidad de ${q.name}: habla ${i.voz}; drag: ${i.drag}; pasado: ${i.pasado}; quiere ${i.ambicion}; teme ${i.miedo}; con las demás: ${i.trato}.` : "";
  };
  // Memoria de lo que pasa en la temporada (para que las escenas tengan continuidad)
  function logEv(t) {
    t = String(t).replace(/\s*\((?:nota|Nota)\s*\d+\)/g, "").replace(/\.?\s*Nota \d+/g, "");
    S.log = [...(S.log || []), `Ep.${S.ep}: ${t}`].slice(-60);
  }
  // Lo que ha pasado en el episodio actual (para que el jurado hable de lo que de verdad se hizo)
  const weekTxt = () => { const L = (S.log || []).filter((x) => x.startsWith(`Ep.${S.ep}:`)).map((x) => x.replace(/^Ep\.\d+:\s*/, "")); return L.length ? `Lo que ha pasado de verdad esta semana (habla de esto; no inventes otro producto, personaje, canción ni tema): ${L.join(" · ")}.` : ""; };
  const memTxt = () => {
    const now = (S.log || []).length ? `Lo que ha pasado hasta ahora (más reciente al final):\n${S.log.slice(-20).join("\n")}` : "";
    // Otras temporadas solo cuentan en All Stars: en una temporada normal todas entran nuevas
    const past = memoriaOn() && window.DFTC_NET && window.DFTC_NET.ready() ? window.DFTC_NET.pastMemories() : "";
    return [past, now].filter(Boolean).join("\n");
  };
  const str = (x) => (typeof x === "string" ? x : x && typeof x === "object" ? x.t || x.texto || x.text || "" : x == null ? "" : String(x));
  function waitDots() {
    body().innerHTML = `<div class="story-card ia-wait"><div class="ia-dots"><i></i><i></i><i></i></div></div>`;
  }
  // Reescribe una escena con la voz de cada personaje, sin cambiar lo que pasa ni sus efectos
  function scene(kind, lines, ctx, then, choices) {
    if (!IA.ready() || !lines || !lines.length || S.meOut) return dialog(lines, ctx, then, choices);
    const keys = [...new Set(lines.map((l) => l[0]))];
    const cast = keys.map((k) => {
      const w = who(k, ctx);
      const q = ctx.q && ctx.q[k];
      return `- ${k} = ${w.name}${q ? `. ${aiProfile(q)} ${idTxt(q)}` : k === "me" ? " (la protagonista, la jugadora)" : k === "host" ? " (Supremme de Luxe, presentadora)" : ""}`;
    }).join("\n");
    const orig = lines.map(([k, t]) => `${k}: ${fill(t, ctx)}`).join("\n");
    const ch = (choices || []).map((c, i) => `${i + 1}. ${fill(c.txt, ctx)}${c.reply ? ` → responde ${c.reply[0]}: ${fill(c.reply[1], ctx)}` : ""}`).join("\n");
    waitDots();
    IA.chat(
      `Eres el director de escena del juego. Reescribes escenas para que cada personaje hable con SU voz e identidad y para que haya continuidad con lo ocurrido en la temporada. ${aiSeason()}`,
      `Escena (${kind}). Personajes:\n${cast}\n${memTxt()}\n\nGuion original (mismos hablantes, mismo orden y mismo sentido; puedes cambiar las palabras, añadir detalles de su identidad y referencias a lo ocurrido):\n${orig}\n${ch ? `\nOpciones de respuesta de la protagonista (reescríbelas con el mismo sentido) y la réplica a cada una:\n${ch}` : ""}
Devuelve JSON {"lineas":[{"k":"clave del hablante","t":"texto"}],"opciones":[{"t":"lo que dice la protagonista","respuesta":"réplica"}]}. Máximo 30 palabras por línea. Usa solo estas claves: ${keys.join(", ")}.`,
      { json: true, max: 900, temp: 0.95 },
    ).then((r) => {
      const ok = r && Array.isArray(r.lineas) && r.lineas.length >= Math.max(1, lines.length - 1) && r.lineas.length <= lines.length + 2 && r.lineas.every((l) => l && keys.includes(l.k) && str(l.t).trim());
      if (!ok) return dialog(lines, ctx, then, choices);
      const nl = r.lineas.map((l) => [l.k, IA.clean(str(l.t))]);
      let nc = choices;
      if (choices && Array.isArray(r.opciones) && r.opciones.length === choices.length) {
        nc = choices.map((c, i) => { const o = r.opciones[i] || {}; const t = IA.clean(str(o.t)); const rp = IA.clean(str(o.respuesta)); return { ...c, txt: t || c.txt, reply: c.reply && rp ? [c.reply[0], rp] : c.reply }; });
      }
      dialog(nl, ctx, then, nc);
    });
  }
  // Una situación nueva cada episodio, inventada a partir de las identidades y lo que ha pasado
  function directorScene(then) {
    if (!IA.ready() || S.rivals.length < 2 || S.meOut) return then();
    // Protagonistas: tu némesis, una aliada o la reina con más historia reciente
    const nq = nemActive();
    const pool = [nq, ...allies(), ...enemies(), ...shuffle(S.rivals)].filter(Boolean);
    const a = pool[0], b = pool.find((q) => q !== a) || S.rivals.find((q) => q !== a);
    const ctx = { ...ctxWith(a, { r2: b }), q: { r1: a, r2: b, r3: b }, r1: a.name, r2: b.name };
    waitDots();
    IA.chat(
      `Eres el director de un reality drag. Inventas una situación nueva en el taller entre bastidores, coherente con la identidad de cada reina y con lo que ha pasado en la temporada. Nada repetido ni genérico. ${aiSeason()}`,
      `Personajes:\n- r1 = ${a.name}. ${aiProfile(a)} ${idTxt(a)}\n- r2 = ${b.name}. ${aiProfile(b)} ${idTxt(b)}\n- me = ${S.queen.name} (la protagonista)\n${memTxt()}\n
Escribe una escena corta (3 a 5 líneas) que acabe con una decisión de la protagonista, y 3 opciones con efectos distintos.
Devuelve JSON {"lineas":[{"k":"r1|r2|me","t":"..."}],"opciones":[{"t":"lo que dice o hace la protagonista","respuesta":{"k":"r1|r2","t":"réplica"},"efecto":{"r1":-2..2,"r2":-2..2,"fama":"kind|mean|drama|focus","foco":-3..3}}]}`,
      { json: true, max: 1000, temp: 1 },
    ).then((r) => {
      if (!r || !Array.isArray(r.lineas) || !r.lineas.length || !Array.isArray(r.opciones) || r.opciones.length < 2) return then();
      const lines = r.lineas.filter((l) => l && ["r1", "r2", "me"].includes(l.k) && str(l.t).trim()).slice(0, 6).map((l) => [l.k, IA.clean(str(l.t))]);
      if (!lines.length) return then();
      const choices = r.opciones.slice(0, 3).map((o) => {
        const e = o.efecto || {};
        const rel = {};
        ["r1", "r2"].forEach((k) => { const v = clamp(Math.round(+e[k] || 0), -2, 2); if (v) rel[k] = v; });
        const rep = o.respuesta && ["r1", "r2"].includes(o.respuesta.k) && str(o.respuesta.t).trim() ? [o.respuesta.k, IA.clean(str(o.respuesta.t))] : typeof o.respuesta === "string" && o.respuesta.trim() ? ["r1", IA.clean(o.respuesta)] : null;
        return { txt: IA.clean(str(o.t)) || "...", rel, persona: P_KEYS.includes(e.fama) ? e.fama : null, adv: clamp(Math.round(+e.foco || 0), -3, 3) || 0, reply: rep };
      });
      dialog(lines, ctx, () => { logEv(`Escena en el taller entre ${S.queen.name}, ${a.name} y ${b.name}`); then(); }, choices);
    });
  }

  // ------------------------------ IA en directo (Ollama) ------------------------------
  // Ficha de una reina para la IA: personalidad, rol, rasgos, relación e historia contigo
  function aiProfile(q) {
    const role = ROLES_HISTORIA[S.roles[q.id]];
    const t = traitsOf(q);
    const sc = Nem.scarsOf(S.queen.id, q.id).slice(-3).map((x) => `${x.by === S.queen.id ? "tú le hiciste" : "ella te hizo"} «${x.k}» en ${x.s}`).join("; ");
    const labs = Object.values(S.track[q.id] || {});
    const f = fame();
    return [
      `Reina: ${q.name}.`,
      role ? `Su rol en el taller: ${role.name} (${role.desc})` : "",
      `Carácter: ${RASGOS.car[t.car].n} (${RASGOS.car[t.car].d}). Fortaleza: ${RASGOS.fort[t.fort].n}. Debilidad secreta: ${RASGOS.deb[t.deb].n}.`,
      `Relación con ${S.queen.name}: ${relLabel(q)}.`,
      isNem(q) ? `Es la NÉMESIS de ${S.queen.name}: la odia y la provoca siempre. Si ${S.queen.name} le contesta, es porque ella ha empezado.` : "",
      S.pacts && S.pacts[q.id] ? `Tiene un pacto de alianza con ${S.queen.name}.` : "",
      sc ? `Historia entre ellas: ${sc}.` : "",
      labs.length ? `Sus resultados esta temporada: ${labs.join(", ")}.` : "",
      f ? `En el taller, ${S.queen.name} tiene fama de ser ${FAMA[f].n}.` : "",
      idTxt(q),
    ].filter(Boolean).join(" ");
  }
  const aiSeason = () => `Temporada: ${S.season.name}. Episodio ${S.ep}. Quedan ${S.rivals.length + 1} reinas. La protagonista (la jugadora) es ${S.queen.name}. Resultados de ${S.queen.name}: ${Object.values(S.track.me || {}).join(", ") || "aún ninguno"}. ${nemStory()} ${weekNote()} ${ggNote()}${twistOf() === "winners" ? " Es un All Winners: nadie se va y no hay bottom. Las críticas del jurado son siempre positivas y constructivas: nadie es la peor. Las dos del top ganan una estrella y hacen lip sync; la ganadora bloquea a una compañera, que la semana siguiente no puede ganar estrella. Las reinas hablan de estrellas y de bloqueos." : ""}${twistOf() === "allstars" ? " Es un All Stars: la ganadora de cada reto decide a quién de las dos del bottom manda a casa. Puede mirar solo la semana (se va la que peor lo hizo), tener en cuenta la trayectoria de toda la temporada (no castigar a una buena reina por un mal día, que también es justo) o hacer una jugarreta y eliminar a una rival fuerte que lo hizo mejor; las reinas hablan de esto, de quién juega limpio y de quién no." : ""}`;
  function weekNote() {
    if (S.curEpTipo !== S.ep || !S.curTipo || !RETOS[S.curTipo]) return "Todavía no se sabe cuál es el reto de esta semana: no habléis de él como si lo conocierais.";
    return `Reto de esta semana: «${S.curTitulo}» (${String(RETOS[S.curTipo].desc || "").replace(/<[^>]+>/g, "")}). Si se habla del reto, es este y no otro.`;
  }
  // Girl Groups: que nadie se invente el nombre del grupo ni de la canción
  function ggNote() {
    if (S.curTipo !== "equipos" || S.curEpTipo !== S.ep) return "";
    const g = S.gg && S.gg.ep === S.ep ? S.gg : null;
    if (!g) return "Esta semana es el reto Girl Groups: el grupo de la protagonista todavía no tiene nombre ni canción. No inventes nombres de grupos ni títulos de canciones.";
    return `Esta semana es el reto Girl Groups: el grupo de ${S.queen.name} se llama «${g.band}»${g.title ? ` y su tema es «${g.title}»` : ""}. Usa exactamente esos nombres y no inventes otros.`;
  }
  function aiWait(txt = "✍️ Escribiendo...", target = null) {
    (target || body()).innerHTML = `<div class="story-card ia-wait"><p class="eyebrow">🎬 En directo</p><h3>${esc(txt)}</h3><div class="ia-dots"><i></i><i></i><i></i></div></div>`;
  }
  // Frase de saludo con personalidad para las conversaciones del taller
  async function aiOpener(q, kind) {
    const what = { pina: `${S.queen.name} se acerca para intentar hacerse su amiga`, cotilleo: `${S.queen.name} se acerca a cotillear sobre otra compañera`, consejo: `${S.queen.name} le pide consejo para el reto`, pinchar: `${S.queen.name} se acerca a provocarla y meterle presión` }[kind];
    if (!what) return null;
    return IA.chat(`Hablas SOLO como ${q.name}. ${aiProfile(q)} ${aiSeason()}`, `${what}. Escribe la primera frase que le dice ${q.name} al verla llegar, según su carácter y su relación. Máximo 20 palabras.`, { max: 60 });
  }
  // Conversación libre: escribes tú y la reina contesta en personaje
  // Conversación en grupo: varias reinas hablan entre ellas y contigo. Puedes meterte, escuchar o irte
  // En el Untucked nadie sabe aún el veredicto
  const utRule = (where) => (/untucked/i.test(where || "") ? " El jurado aún delibera: nadie conoce los resultados. Solo especulan por las críticas que han oído. Nadie felicita ni da el pésame, y nadie da por hecho quién gana o quién va al lip sync." : "");
  function groupTalk(qs, then, where) {
    const people = shuffle(qs.filter((q) => S.rivals.includes(q))).slice(0, 5);
    if (people.length < 2) return then();
    const log = [];
    let turns = 0, busy = false;
    const MAX = 4;
    const castTxt = () => people.map((q) => `${q.name}: ${relLabel(q)} con ${S.queen.name}. ${idTxt(q) || aiProfile(q)}`).join("\n");
    const transcript = () => log.map((m) => `${m.who}: ${m.t}`).join("\n");
    const render = (wait) => {
      body().innerHTML = `
        <div class="story-card free-talk group-talk">
          <p class="eyebrow">💬 Conversación en grupo</p>
          <div class="gt-faces">${people.map((q) => `<span><i style="background-image:url('${photo(q)}')"></i>${esc(q.name)}<small>${esc(relLabel(q))}</small></span>`).join("")}</div>
          <div class="ft-log">${log.map((m) => `<p class="ft-msg ${m.me ? "me" : ""}"><b>${esc(m.me ? "Tú" : m.who)}</b>${esc(m.t)}</p>`).join("")}${wait ? `<p class="ft-msg"><span class="ia-dots"><i></i><i></i><i></i></span></p>` : ""}</div>
          ${turns < MAX ? `<form class="ft-form"><input id="ft-in" maxlength="220" autocomplete="off" placeholder="Métete en la conversación..." ${wait ? "disabled" : ""}><button class="btn btn-primary" ${wait ? "disabled" : ""}>Decir</button></form>
          <div class="row"><button class="btn btn-ghost" id="gt-listen" ${wait ? "disabled" : ""}>👂 Solo escuchar</button><button class="btn btn-ghost" id="ft-end" ${wait ? "disabled" : ""}>Irte</button></div>`
          : `<p class="muted">Os llaman: se acabó la charla.</p><button class="btn btn-primary" id="ft-end">Continuar</button>`}
        </div>`;
      const box = body().querySelector(".ft-log");
      if (box) box.scrollTop = box.scrollHeight;
      const inp = $("#ft-in");
      if (inp && !wait) inp.focus({ preventScroll: true });
      const form = body().querySelector(".ft-form");
      if (form) form.addEventListener("submit", (e) => { e.preventDefault(); const v = inp.value.trim(); if (v && !busy) step(v); });
      const li = $("#gt-listen");
      if (li) li.addEventListener("click", () => !busy && step(null));
      $("#ft-end").addEventListener("click", () => !busy && then());
    };
    async function step(v) {
      busy = true;
      if (v) log.push({ who: S.queen.name, t: v, me: true });
      turns++;
      render(true);
      const r = await IA.chat(
        `Escribes una conversación en grupo entre concursantes de Drag Race España en ${where}. Cada reina habla SOLO como ella misma, con su carácter, y reaccionan entre ellas: se dan la razón, se pican, cotillean, cambian de tema. Natural y creíble, nada exagerado.${utRule(where)} Nunca escribas lo que dice ${S.queen.name}. ${aiSeason()} ${memTxt()}`,
        `Reinas en la conversación:\n${castTxt()}\n${log.length ? `Lo que se ha dicho:\n${transcript()}` : "La conversación empieza ahora: arranca con un tema que tenga que ver con el momento."}\n${v ? `${S.queen.name} acaba de decir: «${v}». Que reaccionen a eso.` : `${S.queen.name} escucha sin decir nada; ellas siguen hablando${turns > 1 ? " y alguna puede preguntarle su opinión" : ""}.`}${turns >= MAX ? " Es el final: alguna cierra la conversación." : ""}
Devuelve JSON {"lineas":[{"reina":"nombre","t":"lo que dice (máximo 28 palabras)"}],"relaciones":[{"reina":"nombre","cambio":-1|0|1}],"jugadora":"amable|neutral|defiende|provoca"} con 2 a 4 líneas de reinas distintas. En "relaciones" solo las que cambian su opinión de ${S.queen.name} por lo que ha dicho; en "jugadora", cómo se ha portado ${S.queen.name} teniendo en cuenta quién empezó.`,
        { json: true, max: 600, temp: 1 },
      );
      busy = false;
      const lines = (r && Array.isArray(r.lineas) ? r.lineas : []).filter((x) => x && people.some((q) => q.name === str(x.reina)) && str(x.t).trim()).slice(0, 4);
      if (!lines.length) lines.push({ reina: pick1(people).name, t: pick1(["Bueno, chicas, que esto no se cose solo.", "Luego seguimos, que me llaman.", "Yo mejor me callo, que me conozco."]) });
      lines.forEach((x) => log.push({ who: str(x.reina), t: IA.clean(str(x.t)) }));
      if (r && v) {
        (Array.isArray(r.relaciones) ? r.relaciones : []).forEach((x) => { const q = people.find((p) => p.name === str(x && x.reina)); const d = clamp(Math.round(+(x && x.cambio) || 0), -1, 1); if (q && d) changeRel(q, d); });
        const me = String(r.jugadora || "neutral").toLowerCase();
        if (/amable/.test(me)) persona("kind", 0.5);
        else if (/provoca/.test(me)) persona("mean", 0.5);
        else if (/defiende/.test(me)) persona("drama", 0.3);
      } else if (!v) persona("focus", 0.2);
      if (typeof logEv === "function") logEv(`Charla en grupo en ${where.split(",")[0]} con ${people.map((q) => q.name).join(", ")}${v ? `; ${S.queen.name} dijo «${v}»` : ""}`);
      render();
    }
    step(null);
  }
  function freeTalk(q, then, where = "el taller") {
    const hist = [];
    let turns = 0, busy = false;
    const render = (wait) => {
      body().innerHTML = `
        <div class="story-card free-talk">
          <div class="ft-head"><img src="${sprite(q)}" alt=""><div><p class="eyebrow">💬 Conversación libre · ${esc(relLabel(q))}</p><h3>${esc(q.name)}</h3><p class="muted">Escribe lo que quieras. Te contestará según su carácter y lo que haya pasado entre vosotras. Lo que digas cuenta.</p></div></div>
          <div class="ft-log">${hist.map((m) => `<p class="ft-msg ${m.me ? "me" : ""}"><b>${esc(m.me ? "Tú" : q.name)}</b>${esc(m.t)}</p>`).join("") || `<p class="muted ft-empty">Empieza tú...</p>`}${wait ? `<p class="ft-msg"><b>${esc(q.name)}</b><span class="ia-dots"><i></i><i></i><i></i></span></p>` : ""}</div>
          ${turns < 4 ? `<form class="ft-form"><input id="ft-in" maxlength="200" autocomplete="off" placeholder="Escribe aquí..." ${wait ? "disabled" : ""}><button class="btn btn-primary" ${wait ? "disabled" : ""}>Decir</button></form>` : `<p class="muted">Se acaba el tiempo libre.</p>`}
          <button class="btn btn-ghost" id="ft-end">${turns ? "Terminar la conversación" : "← Volver"}</button>
        </div>`;
      const log = body().querySelector(".ft-log");
      if (log) log.scrollTop = log.scrollHeight;
      const inp = $("#ft-in");
      if (inp && !wait) inp.focus({ preventScroll: true });
      const form = body().querySelector(".ft-form");
      if (form) form.addEventListener("submit", (e) => { e.preventDefault(); send(); });
      $("#ft-end").addEventListener("click", () => (turns || where !== "el taller" ? then() : approach(q, then)));
    };
    async function send() {
      const v = ($("#ft-in").value || "").trim();
      if (!v || busy) return;
      busy = true;
      hist.push({ me: true, t: v });
      render(true);
      const conv = hist.map((m) => `${m.me ? S.queen.name : q.name}: ${m.t}`).join("\n");
      const r = await IA.chat(
        `Hablas SOLO como ${q.name}, concursante de Drag Race España, en ${where}.${utRule(where)} ${aiProfile(q)} ${aiSeason()} Responde en JSON con: "respuesta" (lo que dice ${q.name}, máximo 35 palabras, en personaje), "tono" (cómo contesta ${q.name}: "amable", "neutral", "borde", "coqueto" o "amenaza"), "relacion" (número entero de -2 a 2: cuánto mejora o empeora su relación) y "jugadora" (cómo se ha comportado ${S.queen.name} en su último mensaje, teniendo en cuenta quién empezó: "amable", "neutral", "defiende" si contesta a una provocación, o "provoca" si ataca sin que la hayan provocado).`,
        `Conversación hasta ahora:\n${conv}\nResponde como ${q.name}.`,
        { json: true, max: 140 },
      );
      busy = false;
      turns++;
      if (!r || !r.respuesta) {
        hist.push({ me: false, t: pick1(["Ahora no tengo la cabeza para esto.", "Mira, luego hablamos, que tengo que acabar el look.", "Mmm... déjame pensarlo."]) });
        return render();
      }
      hist.push({ me: false, t: IA.clean(r.respuesta) });
      const d = clamp(Math.round(+r.relacion || 0), -2, 2);
      const tono = String(r.tono || "neutral").toLowerCase();
      if (d) changeRel(q, d);
      talkFame(q, r);
      if (tono.includes("amenaza") && relOf(q) <= -2) makeNemesis(q, "choque");
      render();
    }
    render();
  }
  // Críticas del jurado escritas en directo
  async function aiCritique(lines, score, label) {
    if (!IA.ready()) return lines;
    aiWait("El jurado está deliberando...");
    const lk = S.lastLook;
    const r = await IA.chat(
      `Escribes las críticas del jurado de Drag Race España. Supremme de Luxe es la presentadora (directa, teatral, cariñosa pero exigente). Ana Locking es jurado (moda, técnica, seria y precisa). ${aiSeason()} ${(() => { const f = fame(); return f ? `En el taller, ${S.queen.name} tiene fama de ser ${FAMA[f].n}.` : ""; })()}`,
      `Reto de esta semana: ${S.curTitulo || S.epNames[S.ep] || "reto"}. ${weekTxt()} Nota de ${S.queen.name} en el reto: ${S.lastParts ? S.lastParts.reto : score}/100${S.lastParts && S.lastParts.pasarela != null ? `, pasarela: ${S.lastParts.pasarela}/100` : ""}. ${lk ? `Categoría de pasarela: ${lk.cat}. Su mejor pieza: ${lk.best}. Su peor pieza: ${lk.worst}.${lk.concepto ? ` Concepto que defendió: «${lk.concepto}».` : ""}${lk.critica ? ` Lo que pensó el jurado al verla: ${lk.critica}` : ""}` : ""}${juryTxt() ? ` Lo que pensó el jurado durante el reto (todavía no se lo ha dicho; díselo ahora, con otras palabras): ${juryTxt()}` : ""} Su valoración global es ${label}. Devuelve JSON con "supreme", "ana" y "javis": la crítica de cada uno a ${S.queen.name}, en segunda persona, máximo 30 palabras cada una, coherentes con la nota. Supremme habla sobre todo del reto (aunque puede comentar el look), Ana sobre todo de la pasarela y el look (aunque puede comentar el reto), y los Javis (Javier Ambrossi o Javier Calvo, son jueces) dan su valoración desde la interpretación y la emoción. Son SOLO valoraciones: nunca digas posiciones ni resultados (ni ganadora, ni mejores, ni peores, ni bottom, ni lip sync, ni a salvo, ni en peligro); eso se anuncia después del Untucked. Tampoco menciones notas ni números.`,
      { json: true, max: 320, temp: 0.85 },
    );
    if (!r || !r.supreme || !r.ana) return lines;
    const javi = r.javis ? [[pick1(["ambrossi", "calvo"]), IA.clean(str(r.javis))]] : [];
    const rest = lines.slice(3).filter(([k]) => !(javi.length && (k === "ambrossi" || k === "calvo")));
    return [lines[0], ["host", IA.clean(str(r.supreme))], ["judge", IA.clean(str(r.ana))], ...javi, ...rest];
  }
  // Juez de textos escritos por la jugadora (roast, impro)
  async function aiJudge(kind, context, text) {
    const r = await IA.chat(
      `Eres el jurado de Drag Race España valorando un ${kind}. Sé justa y exigente: un texto vacío, sin gracia o que no tenga que ver puntúa bajo (10-35); uno correcto, 50-65; uno ingenioso y con remate, 75-95. ${aiSeason()}`,
      `${context}\nLo que ha dicho ${S.queen.name}: «${text}»\nDevuelve JSON con "nota" (0-100), "publico" (una de: "carcajada", "risas", "silencio", "abucheo") y "reaccion" (lo que dice Supremme justo después, máximo 20 palabras, sin notas, números ni posiciones).`,
      { json: true, max: 120, temp: 0.7 },
    );
    if (!r) return null;
    return { nota: clamp(Math.round(Number.isFinite(+r.nota) ? +r.nota : 40), 0, 100), publico: String(r.publico || "risas"), reaccion: IA.clean(r.reaccion || "") };
  }
  // El jurado no comenta nada al terminar los retos ni las pasarelas: lo que piensa se guarda para las valoraciones
  function juryNote(...txt) {
    const t = txt.map((x) => str(x).trim()).filter(Boolean).map((x) => IA.clean(x));
    if (!t.length) return;
    if (!S.juryNotes || S.juryNotes.ep !== S.ep) S.juryNotes = { ep: S.ep, t: [] };
    S.juryNotes.t.push(...t);
    S.juryNotes.t = S.juryNotes.t.slice(-8);
  }
  const juryTxt = () => (S.juryNotes && S.juryNotes.ep === S.ep ? S.juryNotes.t.join(" ") : "");
  const juryWait = `<p class="muted jury-wait">⚖️ El jurado ha tomado nota. Lo sabrás en las valoraciones.</p>`;
  // Pantalla común para escribir en directo y ver la reacción
  function liveRounds(el, cfg, done) {
    let round = 0;
    const notes = [];
    const log = [];
    const draw = (wait) => {
      const r = cfg.rounds[round];
      if (r && !wait && r.pre && !r.shown) { r.shown = true; log.push(...r.pre); }
      el.innerHTML = `
        <div class="story-card live">
          <p class="eyebrow">${cfg.icon} ${esc(cfg.title)} · en directo · ${Math.min(round + 1, cfg.rounds.length)}/${cfg.rounds.length}</p>
          <div class="live-log">${log.map((m) => `<p class="lv ${m.cls}"><b>${esc(m.who)}</b>${esc(m.t)}</p>`).join("")}</div>
          ${r && !wait ? `<h3>${esc(r.prompt)}</h3>${r.sub ? `<p class="muted">${esc(r.sub)}</p>` : ""}
          <form class="ft-form"><input id="lv-in" maxlength="220" autocomplete="off" placeholder="${esc(cfg.ph || "Escribe aquí tu frase...")}"><button class="btn btn-primary">¡Al micro!</button></form>` : wait ? `<div class="ia-dots"><i></i><i></i><i></i></div>` : ""}
        </div>`;
      const box = el.querySelector(".live-log");
      if (box) box.scrollTop = box.scrollHeight;
      const inp = el.querySelector("#lv-in");
      if (inp) inp.focus({ preventScroll: true });
      const form = el.querySelector(".ft-form");
      if (form) form.addEventListener("submit", (e) => { e.preventDefault(); send(inp.value.trim()); });
    };
    async function send(v) {
      if (!v) return;
      const r = cfg.rounds[round];
      log.push({ who: "Tú", t: v, cls: "me" });
      draw(true);
      const j = await aiJudge(cfg.kind, r.ctx, v);
      const nota = j ? j.nota : 45;
      notes.push(nota);
      const pub = j ? j.publico : "risas";
      log.push({ who: "Público", t: { carcajada: "🤣 ¡Carcajada general!", risas: "😄 Risas", silencio: "😶 Silencio...", abucheo: "😬 Uuuuh..." }[pub] || "😄 Risas", cls: "pub" });
      // En el Snatch Game no hay críticas durante el juego: solo se sigue el juego dentro de los personajes
      if (j && j.reaccion && !cfg.inCharacter) juryNote(j.reaccion);
      if (r.after) { const extra = await r.after(v, nota); if (extra) log.push(...[].concat(extra).filter(Boolean)); }
      round++;
      if (round < cfg.rounds.length) return draw();
      const avg = notes.reduce((a, b) => a + b, 0) / notes.length;
      const final = clamp(avg + (A(cfg.attr) - 5) * 2, 0, 100);
      el.innerHTML = `
        <div class="story-card live">
          <p class="eyebrow">${cfg.icon} ${esc(cfg.title)} · resultado</p>
          <div class="live-log">${log.map((m) => `<p class="lv ${m.cls}"><b>${esc(m.who)}</b>${esc(m.t)}</p>`).join("")}</div>
          ${juryWait}
          <button class="btn btn-primary" id="lv-done">Continuar</button>
        </div>`;
      markLive(); el.querySelector("#lv-done").addEventListener("click", () => done(final));
    }
    draw();
  }
  // Si la versión en directo no se puede preparar, se dice y se deja elegir: reintentar o jugar con opciones
  function liveFail(el, retry, classic) {
    el.innerHTML = `
      <div class="story-card">
        <p class="eyebrow">✍️ En directo</p>
        <h3>No he podido preparar el reto en directo</h3>
        <p class="muted">El guion ha tardado demasiado en llegar. Puedes probar otra vez o jugarlo con opciones.</p>
        <div class="choice-col">
          <button class="btn btn-primary" id="lf-retry">🔁 Reintentar en directo</button>
          <button class="btn btn-ghost" id="lf-classic">🎲 Jugar con opciones</button>
        </div>
      </div>`;
    el.querySelector("#lf-retry").addEventListener("click", retry);
    el.querySelector("#lf-classic").addEventListener("click", classic);
  }
  // Elegir entre jugar en directo con IA o la versión de siempre
  function aiOrClassic(el, title, icon, live, classic) {
    if (!IA.ready()) return classic();
    el.innerHTML = `
      <div class="story-card">
        <p class="eyebrow">${icon} ${esc(title)}</p>
        <h3>¿Cómo quieres hacerlo?</h3>
        <div class="choice-col">
          <button class="btn btn-primary" id="ia-live">✍️ En directo: escribo yo mis frases</button>
          <button class="btn btn-ghost" id="ia-classic">🎲 Con opciones, como siempre</button>
        </div>
      </div>`;
    el.querySelector("#ia-live").addEventListener("click", live);
    el.querySelector("#ia-classic").addEventListener("click", classic);
  }
  function liveRoast(el, done) {
    const targets = shuffle(S.rivals).slice(0, 2);
    const rounds = [
      ...targets.map((q) => ({
        prompt: `🎯 Te toca hacerle un roast a ${q.name}`,
        sub: `${roleKnown(q) ? `Es ${roleOf(q).name.toLowerCase()}. ` : ""}${Nem.knows(q.id, "deb") ? `Sabes que tiene ${RASGOS.deb[traitsOf(q).deb].n.toLowerCase()}. ` : ""}Escribe tu chiste.`,
        ctx: `Roast a la compañera ${q.name}. ${aiProfile(q)}`,
        after: async (v, nota) => {
          if (nota >= 70) changeRel(q, -1);
          const rep = await IA.chat(`Hablas SOLO como ${q.name}. ${aiProfile(q)}`, `${S.queen.name} acaba de hacerte este chiste en el roast: «${v}». Contesta en una frase muy corta (máximo 15 palabras), con tu carácter.`, { max: 50 });
          return rep ? { who: q.name, t: rep, cls: "rival" } : null;
        },
      })),
      { prompt: "⚖️ Y ahora... ¡el jurado!", sub: "Supremme, Ana Locking y los Javis te miran. Atrévete.", ctx: "Roast al jurado de Drag Race España: Supremme de Luxe, Ana Locking y los Javis (Javier Ambrossi y Javier Calvo)." },
    ];
    liveRounds(el, { title: "El Roast", icon: "🔥", kind: "roast (chiste de humor ácido)", attr: "comedia", rounds, ph: "Tu chiste..." }, done);
  }
  // Snatch Game en directo: eliges (o inventas) personaje y contestas a Supremme escribiendo
  function liveSnatch(el, done) {
    const chars = shuffle(SNATCH_FAMOSOS).slice(0, 4);
    el.innerHTML = `
      <div class="story-card">
        <p class="eyebrow">🎭 Snatch Game en directo</p>
        <h3>¿Qué celebridad vas a imitar?</h3>
        <p class="muted">Escribe la celebridad que quieras (cantante, actriz, presentadora, icono pop...) y responderás a Supremme como si fueras ella.</p>
        <form class="ft-form"><input id="sn-own" maxlength="80" autocomplete="off" placeholder="Tu celebridad..."><button class="btn btn-primary">¡A plató!</button></form>
        <p class="muted">o elige uno de estos:</p>
        <div class="choice-col">${chars.map((c, i) => `<button class="btn btn-ghost" data-c="${i}">${c.icon} ${esc(c.name)} <small>· ${esc(c.tono)}</small></button>`).join("")}</div>
      </div>`;
    const go = (name, tono) => start(name, tono);
    el.querySelectorAll("[data-c]").forEach((b) => b.addEventListener("click", () => { const c = chars[+b.dataset.c]; go(c.name, c.tono); }));
    el.querySelector(".ft-form").addEventListener("submit", (e) => { e.preventDefault(); const v = el.querySelector("#sn-own").value.trim(); if (v) go(v, "su forma de hablar y sus manías más reconocibles"); });
    async function start(name, tono) {
      const rivals = shuffle(S.rivals).slice(0, 2);
      aiWait("Preparando el plató...", el);
      const plan = await IA.chat(
        `Eres la guionista del Snatch Game de Drag Race España: Supremme de Luxe hace preguntas absurdas a las concursantes, que imitan a celebridades famosas (cantantes, actrices, presentadoras, iconos pop o personajes de ficción muy conocidos; nunca políticos). Es una parodia cariñosa: se exagera su estilo y su forma de hablar, sin citar ni inventarle frases reales, sin inventar escándalos ni datos de su vida privada y sin nada ofensivo. ${aiSeason()}`,
        `La protagonista ${S.queen.name} imita a: ${name} (tono ${tono}). Las rivales en el plató: ${rivals.map((q) => `${q.name} (${aiProfile(q)} ${idTxt(q)})`).join(" | ")}.
Elige para cada rival una celebridad famosa distinta (española o internacional, reconocible por el público) que le pegue según su identidad, y escribe 4 preguntas de Supremme (máximo 20 palabras, absurdas y con chispa). Para cada pregunta, la respuesta de cada rival en personaje (SOLO las rivales, nunca ${S.queen.name}, que contesta la jugadora) (máximo 22 palabras; que alguna falle a veces).
Devuelve JSON {"rivales":[{"reina":"nombre","personaje":"nombre de la celebridad"}],"preguntas":[{"q":"...","respuestas":[{"reina":"nombre","t":"..."}]}]}`,
        { json: true, max: 1600, temp: 1 },
      );
      const pregs = (plan && Array.isArray(plan.preguntas) && plan.preguntas.length >= 3 ? plan.preguntas.slice(0, 4) : shuffle(SNATCH_PREGUNTAS).slice(0, 4).map((q) => ({ q, respuestas: [] }))).map((p) => (typeof p === "string" ? { q: p, respuestas: [] } : p));
      const pj = {};
      ((plan && plan.rivales) || []).forEach((x) => x && x.reina && (pj[x.reina] = str(x.personaje)));
      const rounds = pregs.map((p, i) => ({
        prompt: `🎤 Supremme: «${IA.clean(str(p.q))}»`,
        sub: `Eres ${name}. Contesta como si fueras esa persona.`,
        pre: [
          ...(i === 0 ? rivals.filter((q) => pj[q.name]).map((q) => ({ who: "Supremme", t: `${q.name} viene como ${pj[q.name]}.`, cls: "host" })) : []),
          ...((p.respuestas || []).filter((x) => x && x.t && rivals.some((q) => q.name === str(x.reina))).slice(0, 2).map((x) => ({ who: `${str(x.reina)}${pj[str(x.reina)] ? ` (${pj[str(x.reina)]})` : ""}`, t: IA.clean(str(x.t)), cls: "rival" }))),
        ],
        ctx: `Snatch Game. ${S.queen.name} interpreta a ${name}. Pregunta de Supremme: ${str(p.q)}. Valora la gracia, que se mantenga en el personaje elegido y el remate. En tu reacción no imites ni pongas frases en boca de ese personaje: solo comenta la actuación.`,
        // Tras cada respuesta: Supremme sigue el juego como presentadora y otra concursante contesta desde su personaje
        after: async (v) => {
          const others = rivals.filter((q) => pj[q.name]);
          const q2 = others.length ? pick1(others) : null;
          const r2 = await IA.chat(
            `Eres la guionista del Snatch Game de Drag Race España. Supremme de Luxe presenta el concurso y las reinas están metidas en sus personajes. Nadie critica ni valora a nadie: todo es juego, chistes y pullas dentro del personaje. Las reinas imitan a celebridades en clave de parodia cariñosa: exageran su estilo y su forma de hablar, sin citar frases reales, sin inventar escándalos de su vida privada y sin nada ofensivo.`,
            `Pregunta de Supremme: «${str(p.q)}». ${S.queen.name} (haciendo de ${name}) ha contestado: «${v}».${q2 ? ` En el panel también está ${q2.name}, que hace de ${pj[q2.name]}.` : ""}
Devuelve JSON {"supremme":"lo que dice Supremme como presentadora siguiendo el juego (máximo 18 palabras, sin valorar)"${q2 ? `,"rival":"lo que suelta ${q2.name} metida en su personaje, picando o siguiendo la broma (máximo 18 palabras)"` : ""}}`,
            { json: true, max: 220, temp: 1, timeout: 15000 },
          ).catch(() => null);
          if (!r2) return null;
          return [
            r2.supremme ? { who: "Supremme", t: IA.clean(str(r2.supremme)), cls: "host" } : null,
            q2 && r2.rival ? { who: `${q2.name} (${pj[q2.name]})`, t: IA.clean(str(r2.rival)), cls: "rival" } : null,
          ];
        },
      }));
      el.innerHTML = "";
      liveRounds(el, { title: "Snatch Game", icon: "🎭", kind: "Snatch Game (imitación cómica en personaje)", attr: "comedia", rounds, ph: `Lo que dice ${name}...`, inCharacter: true }, done);
    }
  }
  // Recorta un texto por palabras (sin dejar palabras a medias)
  function cutWords(t, n) {
    t = String(t || "").trim();
    if (t.length <= n) return t;
    const c = t.slice(0, n), i = c.lastIndexOf(" ");
    return (i > n * 0.5 ? c.slice(0, i) : c).replace(/[\s,;:.\-]+$/, "") + "…";
  }
  // Improvisación por grupos: se monta una escena, cada una tiene un personaje y todas interactúan
  function liveImpro(el, done) {
    const mates = (S.team && S.team.length ? S.team.filter((q) => S.rivals.includes(q)) : shuffle(S.rivals)).slice(0, 2);
    if (mates.length < 1) return liveImproSolo(el, done);
    const prodI = nextProducto();
    aiWait("Montando la escena...", el);
    IA.chat(
      `Eres la directora del reto de improvisación de Drag Race España: un grupo de reinas improvisa una escena cómica, cada una con un personaje. ${aiSeason()}`,
      `El grupo: ${S.queen.name} (la jugadora) y ${mates.map((q) => `${q.name} (${aiProfile(q)} ${idTxt(q)})`).join(" | ")}.
Inventa una escena cómica y concreta (lugar y conflicto). Si la escena es de teletienda o anuncio, ${prodHint(prodI)} y escríbelo en "producto" (si no, deja "producto" vacío). Un personaje para cada rival que encaje con su identidad, y 3 personajes posibles para ${S.queen.name}. Cada personaje en una frase corta de 12 palabras como máximo.
Devuelve JSON {"escena":"premisa en 25 palabras","producto":"","personajes":[{"reina":"nombre","personaje":"..."}],"opciones":["...","...","..."]}`,
      { json: true, max: 700, temp: 1 },
    ).then((plan) => {
      if (!plan || !plan.escena) return liveImproSolo(el, done);
      logEv(`Escena de la impro: ${cutWords(IA.clean(str(plan.escena)), 160)}`);
      if (str(plan.producto).trim()) logEv(`En la escena se vende: ${cutWords(IA.clean(str(plan.producto)), 80)}`);
      const pj = {};
      (Array.isArray(plan.personajes) ? plan.personajes : []).forEach((x) => x && x.reina && (pj[str(x.reina)] = cutWords(IA.clean(str(x.personaje)), 110)));
      mates.forEach((q) => (pj[q.name] = pj[q.name] || "un personaje secundario"));
      const opts = (Array.isArray(plan.opciones) ? plan.opciones : []).map((x) => cutWords(IA.clean(str(x)), 150)).filter(Boolean).slice(0, 3);
      el.innerHTML = `
        <div class="story-card live">
          <p class="eyebrow">📺 Improvisación en grupo</p>
          <h3>${esc(IA.clean(str(plan.escena)))}</h3>
          <div class="impro-cast">${mates.map((q) => `<span><i style="background-image:url('${photo(q)}')"></i><b>${esc(q.name)}</b><small>${esc(pj[q.name])}</small></span>`).join("")}</div>
          <p class="muted">¿Qué personaje eres tú?</p>
          <div class="choice-col">${opts.map((o, i) => `<button class="btn btn-ghost" data-o="${i}">${esc(o)}</button>`).join("")}</div>
          <form class="ft-form"><input id="im-own" maxlength="80" autocomplete="off" placeholder="O inventa tu personaje..."><button class="btn btn-primary">Usar</button></form>
        </div>`;
      el.querySelectorAll("[data-o]").forEach((b) => b.addEventListener("click", () => play(opts[+b.dataset.o])));
      el.querySelector(".ft-form").addEventListener("submit", (e) => { e.preventDefault(); const v = el.querySelector("#im-own").value.trim(); if (v) play(v); });
      function play(mine) {
        const scene = IA.clean(str(plan.escena));
        const log = [];
        let turn = 0, mineN = 0;
        const TURNS = 5;
        const castTxt = () => [`${S.queen.name} (jugadora) es ${mine}`, ...mates.map((q) => `${q.name} es ${pj[q.name]}. ${idTxt(q)}`)].join(". ");
        const transcript = () => log.map((m) => `${m.who}: ${m.t}`).join("\n");
        const draw = (wait) => {
          el.innerHTML = `
            <div class="story-card live">
              <p class="eyebrow">📺 Improvisación en grupo · ${Math.min(turn + 1, TURNS)}/${TURNS}</p>
              <p class="muted"><b>Escena:</b> ${esc(scene)} · <b>Tú:</b> ${esc(mine)}</p>
              <div class="live-log">${log.map((m) => `<p class="lv ${m.me ? "me" : "rival"}"><b>${esc(m.who)}${m.me ? "" : ` · ${esc(pj[m.who] || "")}`}</b>${esc(m.t)}</p>`).join("")}${wait ? `<div class="ia-dots"><i></i><i></i><i></i></div>` : ""}</div>
              ${wait ? "" : `<form class="ft-form"><input id="lv-in" maxlength="220" autocomplete="off" placeholder="Lo que dice o hace ${esc(mine)}..."><button class="btn btn-primary">¡En escena!</button></form>`}
            </div>`;
          const box = el.querySelector(".live-log");
          if (box) box.scrollTop = box.scrollHeight;
          const inp = el.querySelector("#lv-in");
          if (inp) inp.focus({ preventScroll: true });
          const f = el.querySelector(".ft-form");
          if (f) f.addEventListener("submit", (e) => { e.preventDefault(); const v = inp.value.trim(); if (v) mineLine(v); });
        };
        async function others() {
          draw(true);
          const r = await IA.chat(
            `Escribes las intervenciones de las rivales en una improvisación en grupo de Drag Race España. Cada una habla SOLO como su personaje, reaccionando a lo último que ha pasado, siguiendo la escena y dando pie a la jugadora. Nunca escribas lo que dice ${S.queen.name}.`,
            `Escena: ${scene}\nReparto: ${castTxt()}\n${log.length ? `Lo que ha pasado:\n${transcript()}` : "La escena empieza ahora."}\n${turn === TURNS - 1 ? "Es el último turno: buscad un final." : ""}
Devuelve JSON {"lineas":[{"reina":"nombre de una rival","t":"lo que dice o hace (máximo 25 palabras)"}]} con 1 o 2 intervenciones.`,
            { json: true, max: 400, temp: 1 },
          );
          const ls = (r && Array.isArray(r.lineas) ? r.lineas : []).filter((x) => x && mates.some((q) => q.name === str(x.reina)) && str(x.t).trim()).slice(0, 2);
          if (!ls.length) ls.push({ reina: mates[0].name, t: pick1(["¿Y ahora qué hacemos?", "¡Esto no estaba en el guion!", "Bueno, yo sigo, que el público espera."]) });
          ls.forEach((x) => log.push({ who: str(x.reina), t: IA.clean(str(x.t)) }));
          draw();
        }
        function mineLine(v) {
          log.push({ who: S.queen.name, t: v, me: true });
          mineN++;
          turn++;
          if (turn >= TURNS) return judge();
          others();
        }
        async function judge() {
          draw(true);
          const r = await IA.chat(
            `Eres el jurado de Drag Race España valorando una improvisación en grupo. Valora a cada reina por separado: gracia, escucha (si reacciona a las demás), personaje y si hace avanzar la escena. Un aporte vacío o que ignora la escena puntúa bajo (10-35); correcto 50-65; brillante 75-95.`,
            `Escena: ${scene}\nReparto: ${castTxt()}\nTranscripción:\n${transcript()}\nDevuelve JSON {"notas":[{"reina":"nombre","nota":0-100}],"supreme":"comentario de Supremme sobre la escena (máximo 30 palabras, sin notas, números ni posiciones)","mejor":"nombre de la que más ha destacado"}`,
            { json: true, max: 400, temp: 0.6 },
          );
          const notas = {};
          (r && Array.isArray(r.notas) ? r.notas : []).forEach((x) => x && (notas[str(x.reina)] = clamp(Math.round(+x.nota || 50), 0, 100)));
          const myN = notas[S.queen.name] != null ? notas[S.queen.name] : 50;
          mates.forEach((q) => { if (notas[q.name] != null) S.form[q.id] = clamp((S.form[q.id] || 0) + Math.round((notas[q.name] - 55) / 8), -10, 10); });
          const final = clamp(myN + (A("comedia") - 5) * 1.5 + (A("carisma") - 5) * 1.5, 0, 100);
          logEv(`Improvisación en grupo: ${S.queen.name} como ${mine}; destacó ${str(r && r.mejor) || "nadie en especial"}`);
          el.innerHTML = `
            <div class="story-card live">
              <p class="eyebrow">📺 Improvisación en grupo · resultado</p>
              <div class="live-log">${log.map((m) => `<p class="lv ${m.me ? "me" : "rival"}"><b>${esc(m.who)}</b>${esc(m.t)}</p>`).join("")}</div>
              ${(juryNote(r && r.supreme), juryWait)}
              <div class="impro-cast">${[{ q: S.queen, n: myN }, ...mates.map((q) => ({ q, n: notas[q.name] }))].map((x) => `<span><i style="background-image:url('${photo(x.q)}')"></i><b>${esc(x.q === S.queen ? "Tú" : x.q.name)}</b><small></small></span>`).join("")}</div>
              <button class="btn btn-primary" id="lv-done">Continuar</button>
            </div>`;
          markLive(); el.querySelector("#lv-done").addEventListener("click", () => { if (final >= 80) growAttr(final > 90 ? "comedia" : "carisma"); done(final); });
        }
        others();
      }
    });
  }
  // Interpretación: hay guion. Reparto, ensayo (memorizar) y rodaje (dar el tono que pide la dirección)
  const TONOS = { dramatico: "🎭 Dramático", comico: "😂 Cómico", contenido: "🤫 Contenido", exagerado: "🔥 Exagerado" };
  const norm = (t) => String(t || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9ñ ]/g, "").trim();
  function liveActing(el, done) {
    // Como en el programa: la película la ruedan todas las reinas juntas
    const mates = shuffle(S.rivals).slice(0, 8);
    aiWait("Los Javis están repartiendo los guiones...", el);
    IA.chat(
      `Eres guionista del reto de interpretación de Drag Race España, dirigido por los Javis. Escribes una escena corta con guion cerrado (no se improvisa), parodia de un género, con humor drag. ${aiSeason()}`,
      `Reparto disponible: ${S.queen.name} (la jugadora) y ${mates.map((q) => q.name).join(", ")} (${mates.length + 1} actrices).
Los papeles son personajes de ficción con nombres inventados (por ejemplo «Doña Remedios» o «la Condesa de Albacete»), NUNCA los nombres de las reinas.
${/teletienda/i.test(S.curTitulo || "") ? `Es una parodia de teletienda. ${prodHint(S.weekProd = nextProducto())} ` : ""}Escribe: título, género, sinopsis, ${mates.length + 1} papeles (uno protagonista de peso grande, dos o tres de peso medio y el resto pequeño) y un guion de ${Math.max(9, mates.length * 2 + 3)} a ${Math.max(12, mates.length * 2 + 6)} líneas repartidas entre TODOS los papeles (el protagonista con 3 o 4 líneas, cada papel al menos con 1). Cada línea lleva el tono correcto según la acotación (dramatico, comico, contenido o exagerado), una acotación breve y una "clave": una palabra o expresión corta y memorable que aparece literalmente en esa línea.
Devuelve JSON {"titulo":"...","genero":"...","sinopsis":"...","papeles":[{"papel":"nombre del personaje","descripcion":"...","peso":"grande|medio|pequeño"}],"guion":[{"papel":"...","t":"texto de la línea","acotacion":"...","tono":"dramatico|comico|contenido|exagerado","clave":"..."}]}`,
      { json: true, max: 3600, temp: 1, timeout: 40000 },
    ).then((g) => {
      const roles = g && Array.isArray(g.papeles) ? g.papeles.filter((x) => x && x.papel).slice(0, mates.length + 1) : [];
      const lines = g && Array.isArray(g.guion) ? g.guion.filter((x) => x && x.papel && str(x.t).trim()) : [];
      if (roles.length < 2 || lines.length < 5) return liveFail(el, () => liveActing(el, done), () => { mxActing.classic = true; mxActing(el, (sc) => { mxActing.classic = false; done(sc); }); });
      if (/teletienda/i.test(S.curTitulo || "") && S.weekProd) logEv(`El producto de la teletienda es ${S.weekProd}`);
      casting(g, roles, lines);
    });
    function casting(g, roles, lines) {
      const count = (r) => lines.filter((l) => str(l.papel) === str(r.papel)).length;
      el.innerHTML = `
        <div class="story-card live">
          <p class="eyebrow">🎬 Interpretación · el reparto</p>
          <h3>«${esc(IA.clean(str(g.titulo)))}»</h3>
          <p class="muted"><b>${esc(str(g.genero))}</b> · ${esc(IA.clean(str(g.sinopsis)))}</p>
          <p>¿Qué papel pides? Un papel grande luce más... y si fallas se nota más.</p>
          <div class="choice-col">${roles.map((r, i) => `<button class="btn btn-ghost role" data-r="${i}"><b>${esc(str(r.papel))} · ${esc(str(r.peso || "medio"))}</b><small>${esc(IA.clean(str(r.descripcion)))} · ${count(r)} frases</small></button>`).join("")}</div>
        </div>`;
      el.querySelectorAll("[data-r]").forEach((b) => b.addEventListener("click", () => {
        let mine = roles[+b.dataset.r];
        // Si pides el protagonista, otra reina con más carisma puede quitártelo
        const rival = mates.find((q) => (q.stats.rate || 3) + (S.form[q.id] || 0) / 4 > A("carisma") / 2 + 1 && Math.random() < 0.3);
        let note = "";
        let lead = null;
        if (str(mine.peso) === "grande" && rival) {
          const lines2 = (r) => lines.filter((l) => str(l.papel) === str(r.papel)).length;
          const alt = roles.filter((r) => r !== mine).sort((a, b) => lines2(b) - lines2(a))[0];
          note = `Los Javis le dan el protagonista a ${rival.name}. Tú haces de ${str(alt.papel)}.`;
          lead = mine;
          mine = alt;
        }
        const cast = { [str(mine.papel)]: S.queen };
        if (lead) cast[str(lead.papel)] = rival;
        const others = roles.filter((r) => !cast[str(r.papel)]);
        mates.filter((q) => q !== (lead && rival)).forEach((q, i) => others[i] && (cast[str(others[i].papel)] = q));
        rehearse(g, mine, cast, lines, note);
      }));
    }
    function rehearse(g, mine, cast, lines, note) {
      const myLines = lines.filter((l) => str(l.papel) === str(mine.papel));
      el.innerHTML = `
        <div class="story-card live">
          <p class="eyebrow">🎬 Lectura de guion</p>
          ${note ? `<p class="twist-note">${esc(note)}</p>` : ""}
          <h3>Eres ${esc(str(mine.papel))}</h3>
          <p class="muted">Léete bien tus frases (en rosa): en el rodaje tendrás que decirlas de memoria y con el tono que pide la dirección.</p>
          <div class="script">${lines.map((l) => { const me = str(l.papel) === str(mine.papel); const q = cast[str(l.papel)]; return `<p class="${me ? "me" : ""}"><b>${esc(str(l.papel))}${q && q !== S.queen ? ` (${esc(q.name)})` : me ? " (tú)" : ""}</b> <i>(${esc(IA.clean(str(l.acotacion)))})</i> ${esc(IA.clean(str(l.t)))}</p>`; }).join("")}</div>
          <button class="btn btn-primary" id="ac-go">🎬 ¡Acción!</button>
        </div>`;
      el.querySelector("#ac-go").addEventListener("click", () => shoot(g, mine, cast, lines, myLines));
    }
    function shoot(g, mine, cast, lines, myLines) {
      let idx = 0, mem = 0, tone = 0;
      const log = [];
      const results = [];
      const draw = (phase, line) => {
        const keyWord = IA.clean(str(line.clave));
        const text = IA.clean(str(line.t));
        const found = keyWord && norm(text).includes(norm(keyWord));
        if (!found) { const lw = (text.match(/([^\s.!?¡¿,;:]+)[.!?¡¿,;:]*\s*$/) || [])[1]; if (lw) line.clave = lw; }
        const blank = found ? text.replace(new RegExp(keyWord.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i"), "_____") : text.replace(/[^\s.!?¡¿,;:]+([.!?¡¿,;:]*\s*)$/, "_____$1");
        let blankT = blank;
        if (blankT === text) { const ws = text.split(" "); const k = ws.reduce((b, w, i) => (w.replace(/[^\wáéíóúñ]/gi, "").length > ws[b].replace(/[^\wáéíóúñ]/gi, "").length ? i : b), 0); line.clave = ws[k].replace(/[^\wáéíóúñ]/gi, ""); ws[k] = "_____"; blankT = ws.join(" "); }
        el.innerHTML = `
          <div class="story-card live">
            <p class="eyebrow">🎬 Rodando «${esc(IA.clean(str(g.titulo)))}» · frase ${idx + 1}/${myLines.length}</p>
            <div class="live-log">${log.map((m) => `<p class="lv ${m.me ? "me" : "rival"}"><b>${esc(m.who)}</b>${esc(m.t)}</p>`).join("")}</div>
            ${phase === "mem" ? `<h3>Te toca: ${esc(blankT)}</h3><p class="muted">¿Qué falta? (de memoria)</p>
              <form class="ft-form"><input id="ac-in" maxlength="80" autocomplete="off" placeholder="La palabra que falta..."><button class="btn btn-primary">Decirlo</button></form>`
            : `<h3>«${esc(text)}»</h3><p class="muted">Acotación: <i>${esc(IA.clean(str(line.acotacion)))}</i>. ¿Con qué tono la dices?</p>
              <div class="choice-col">${Object.entries(TONOS).map(([k, t]) => `<button class="btn btn-ghost" data-t="${k}">${t}</button>`).join("")}</div>`}
          </div>`;
        const box = el.querySelector(".live-log");
        if (box) box.scrollTop = box.scrollHeight;
        if (phase === "mem") {
          const inp = el.querySelector("#ac-in");
          inp.focus({ preventScroll: true });
          el.querySelector(".ft-form").addEventListener("submit", (e) => {
            e.preventDefault();
            const kw = IA.clean(str(line.clave));
            const ok = kw && norm(inp.value).length >= Math.min(3, norm(kw).length) && (norm(kw).includes(norm(inp.value)) || norm(inp.value).includes(norm(kw)));
            if (ok) mem++;
            Toast.show(ok ? "✅ ¡Frase clavada!" : "😬 Te has quedado en blanco", ok ? "Ni un fallo" : `Era: «${kw}»`);
            results.push({ ok });
            draw("tone", line);
          });
        } else {
          el.querySelectorAll("[data-t]").forEach((b) => b.addEventListener("click", () => {
            const right = norm(line.tono).startsWith(norm(b.dataset.t).slice(0, 5));
            if (right) tone++;
            results[results.length - 1].tone = b.dataset.t;
            results[results.length - 1].right = right;
            log.push({ who: `${str(mine.papel)} (tú) · ${TONOS[b.dataset.t]}`, t: text, me: true });
            idx++;
            advance();
          }));
        }
      };
      let li = 0;
      function advance() {
        // Las frases de las demás hasta tu siguiente frase
        while (li < lines.length && str(lines[li].papel) !== str(mine.papel)) {
          const l = lines[li];
          const q = cast[str(l.papel)];
          log.push({ who: `${str(l.papel)}${q ? ` (${q.name})` : ""}`, t: IA.clean(str(l.t)) });
          li++;
        }
        if (li >= lines.length || idx >= myLines.length) return wrap();
        const line = lines[li];
        li++;
        draw("mem", line);
      }
      async function wrap() {
        const n = Math.max(1, myLines.length);
        const memP = mem / n, toneP = tone / n;
        const peso = str(mine.peso);
        let score = 18 + memP * 40 + toneP * 34 + (A("performance") - 5) * 1.5 + (A("carisma") - 5);
        if (peso === "grande") score = 50 + (score - 50) * 1.25;
        if (peso === "pequeño") score = Math.min(score, 82);
        score = clamp(Math.round(score), 0, 100);
        // Las demás actrices: su nota sale de su nivel y de sus rasgos
        const otherNotes = Object.entries(cast).filter(([, q]) => q !== S.queen).map(([papel, q]) => ({ q, papel, n: clamp(Math.round(rivalScore(q)), 0, 100) }));
        aiWait("Los Javis revisan el montaje...", el);
        const c = await IA.chat(
          `Eres los Javis (Javier Ambrossi y Javier Calvo), directores del reto de interpretación en Drag Race España. Cariñosos pero exigentes, hablan de cine y de actuación.`,
          `Película: «${str(g.titulo)}» (${str(g.genero)}). ${S.queen.name} hizo de ${str(mine.papel)} (papel ${peso}): se supo ${mem} de ${n} frases y acertó el tono en ${tone} de ${n}. Nota: ${score}/100. Otras: ${otherNotes.map((o) => `${o.q.name} como ${o.papel}: ${o.n}`).join("; ")}.
Devuelve JSON {"ambrossi":"comentario a ${S.queen.name} (máximo 30 palabras)","calvo":"comentario sobre el reparto (máximo 30 palabras)"}. No menciones notas ni números ni posiciones.`,
          { json: true, max: 300, temp: 0.8 },
        );
        logEv(`Interpretación «${str(g.titulo)}»: ${S.queen.name} hizo de ${str(mine.papel)} (nota ${score})`);
        el.innerHTML = `
          <div class="story-card live">
            <p class="eyebrow">🎬 «${esc(IA.clean(str(g.titulo)))}» · el montaje final</p>
            <div class="impro-cast"><span><i style="background-image:url('${photo(S.queen)}')"></i><b>Tú · ${esc(str(mine.papel))}</b><small>${mem === n ? "Te sabías todo el texto" : mem ? `Te sabías ${mem} de ${n} frases` : "Te quedaste en blanco"}</small></span>${otherNotes.map((o) => `<span><i style="background-image:url('${photo(o.q)}')"></i><b>${esc(o.q.name)}</b><small>${esc(o.papel)}</small></span>`).join("")}</div>
            ${c && c.ambrossi ? `<p class="lv host"><b>Javier Ambrossi</b>${esc(IA.clean(str(c.ambrossi)))}</p>` : ""}
            ${c && c.calvo ? `<p class="lv host"><b>Javier Calvo</b>${esc(IA.clean(str(c.calvo)))}</p>` : ""}
            <button class="btn btn-primary" id="lv-done">Continuar</button>
          </div>`;
        markLive(); el.querySelector("#lv-done").addEventListener("click", () => { if (score >= 85) growAttr("performance"); done(score); });
      }
      advance();
    }
  }
  // Productos para teletienda y anuncios: van rotando (no siempre el mismo)
  const PRODUCTOS_TELE = [
    "una faja reductora con altavoz bluetooth", "unas pestañas postizas para mascotas", "un abanico con ventilador turbo", "una peluca que predice el tiempo",
    "una almohada con forma de jurado", "un tacón plegable para emergencias", "un perfume con olor a croqueta", "un espejo que solo dice cumplidos",
    "un pintalabios que cambia de color según tu humor", "unas medias antiescaleras para gatos", "un bolso que se cierra solo si gastas demasiado", "una purpurina comestible",
    "un corsé con GPS", "un kit de lágrimas falsas para realities", "unas gafas que ven la purpurina invisible", "un desmaquillante de un solo gesto",
    "una plancha de pelo con wifi", "un mantón que se dobla solo", "unos pendientes que avisan de las llamadas de tu madre", "una peineta con linterna",
    "un cojín para sentarse en tacones", "un spray anti-sombra de ojos corrida", "una crema para que no se note la resaca", "un microondas para secar pelucas",
    "una alfombra roja enrollable de bolsillo", "un despertador que te grita como una drag", "unas castañuelas con metrónomo", "un tinte de cejas para hombres de pelo en pecho",
    "un sujetador con bandeja para canapés", "una máscara de pestañas a prueba de lip sync",
  ];
  function nextProducto() {
    let seen = [];
    try { seen = JSON.parse(localStorage.getItem("dftc-productos-vistos")) || []; } catch (e) {}
    const pool = PRODUCTOS_TELE.filter((x) => !seen.includes(x));
    const p = pick1(pool.length ? pool : PRODUCTOS_TELE);
    try { localStorage.setItem("dftc-productos-vistos", JSON.stringify([...seen, p].slice(-20))); } catch (e) {}
    return p;
  }
  const prodHint = (p) => `El producto de esta vez es ${p}: usa ese producto (nada de sprays ni fijadores de cejas).`;
  function liveImproSolo(el, done) {
    const SEC = [["noticias", "🗞️ Noticias"], ["entrevista", "🎙️ Entrevista"], ["teletienda", "🛒 Teletienda"]];
    el.innerHTML = `<div class="story-card"><p class="eyebrow">📺 Improvisación en directo</p><h3>¿Qué sección conduces?</h3><div class="choice-col">${SEC.map(([k, t]) => `<button class="btn btn-ghost" data-s="${k}">${t}</button>`).join("")}</div></div>`;
    el.querySelectorAll("[data-s]").forEach((b) => b.addEventListener("click", async () => {
      const sec = b.dataset.s;
      const guest = pick1(S.rivals);
      aiWait("Preparando el plató...", el);
      const prod = sec === "teletienda" ? nextProducto() : null;
      logEv(prod ? `Teletienda: ${S.queen.name} vende ${prod}` : `Impro: ${S.queen.name} conduce la sección de ${sec}${sec === "entrevista" ? ` con ${guest.name} de invitada` : ""}`);
      const ev = await IA.chat("Eres la regidora de un programa de televisión improvisado en Drag Race España.", `La sección es ${sec}${sec === "entrevista" ? ` y la invitada es ${guest.name}` : ""}.${prod ? ` ${prodHint(prod)} La presentadora lo tiene que vender.` : ""} Escribe 3 imprevistos o preguntas cortas (máximo 18 palabras cada una) que obliguen a la presentadora a improvisar. Devuelve JSON con "momentos": lista de 3 textos.`, { json: true, max: 200 });
      const moms = (ev && Array.isArray(ev.momentos) && ev.momentos.length >= 3 ? ev.momentos : ["El teleprompter se apaga en mitad de la frase.", "Se cae un decorado detrás de ti.", "La regidora te dice que te quedan 10 segundos."]).slice(0, 3).map(IA.clean);
      const rounds = moms.map((m, i) => ({
        prompt: `${i === 0 && prod ? `🛒 Vendes ${prod}. ` : ""}🔴 ${m}`,
        sub: "¡Estás en directo! ¿Qué dices?",
        ctx: `Improvisación en directo, sección ${sec}${sec === "entrevista" ? ` con la invitada ${guest.name}` : ""}${prod ? ` vendiendo ${prod}` : ""}. Imprevisto: ${m}`,
        after: sec === "entrevista" ? async (v) => { const rep = await IA.chat(`Hablas SOLO como ${guest.name}, invitada a una entrevista en directo. ${aiProfile(guest)}`, `La presentadora ${S.queen.name} te dice: «${v}». Contesta en una frase corta y graciosa (máximo 15 palabras).`, { max: 50 }); return rep ? { who: guest.name, t: rep, cls: "rival" } : null; } : null,
      }));
      el.innerHTML = "";
      liveRounds(el, { title: "Improvisación", icon: "📺", kind: "improvisación televisiva", attr: "carisma", rounds, ph: "Lo que dices en directo..." }, (sc) => { if (sc >= 80) growAttr(sc > 90 ? "comedia" : "carisma"); done(sc); });
    }));
  }


  // ------------------------------ Maxiretos escritos con IA ------------------------------
  // Formulario con caja de texto grande
  const taForm = (id, ph, max = 400, rows = 4, btn = "Enviar") =>
    `<form class="ta-form"><textarea id="${id}" maxlength="${max}" rows="${rows}" placeholder="${esc(ph)}"></textarea><button class="btn btn-primary">${btn}</button></form>`;
  const onTa = (el, id, cb) => {
    const t = el.querySelector("#" + id);
    t.focus({ preventScroll: true });
    t.addEventListener("keydown", (e) => { if (e.key === "Enter" && !e.shiftKey && t.rows <= 2) { e.preventDefault(); t.form.requestSubmit(); } });
    el.querySelector(".ta-form").addEventListener("submit", (e) => { e.preventDefault(); const v = t.value.trim(); if (v.length >= 3) cb(v); });
  };
  // Notas de 0 a 100 (si el modelo contesta de 0 a 10, se escala)
  const nums = (r, keys, d = 50) => {
    const v = keys.map((k) => (r && r[k] != null && Number.isFinite(+r[k]) ? +r[k] : null));
    const ten = v.every((x) => x == null || x <= 10) && v.some((x) => x > 0);
    return v.map((x) => clamp(Math.round(x == null ? d : ten ? x * 10 : x), 0, 100));
  };
  // Lo que diría el jurado se guarda para las valoraciones; aquí solo se avisa
  const judgeLines = (r, a = "supreme", b = "ana") => { juryNote(r && r[a], r && r[b]); return juryWait; };
  // El jurado ya ha dado su opinión en directo: el resultado de la semana no puede contradecirla
  const markLive = () => { S.liveEp = S.ep; };
  function liveResult(el, eyebrow, html, score, then) {
    el.innerHTML = `<div class="story-card live"><p class="eyebrow">${eyebrow}</p>${html}<button class="btn btn-primary" id="lv-done">Continuar</button></div>`;
    markLive(); el.querySelector("#lv-done").addEventListener("click", then);
  }
  // Las compañeras del reto: tu equipo si lo hay, si no, al azar
  const crew = (n) => (S.team && S.team.length ? S.team.filter((q) => S.rivals.includes(q)) : shuffle(S.rivals)).slice(0, n);

  // Rusical: la IA escribe el musical, eliges papel y completas tus versos
  function liveRusical(el, done, tema) {
    // Reparte los papeles la ganadora del minirreto
    const iWin = S.miniWin === "me";
    let winQ = !iWin && S.miniWin ? S.rivals.find((q) => q.id === S.miniWin) : null;
    const mates = [...(winQ ? [winQ] : []), ...shuffle(S.rivals.filter((q) => q !== winQ))].slice(0, 7);
    if (!iWin && !winQ) winQ = mates[0];
    const fail = () => liveFail(el, () => liveRusical(el, done, tema), () => { mxRusical.classic = true; mxRusical(el, (sc) => { mxRusical.classic = false; done(sc); }); });
    aiWait("Los compositores están terminando la partitura...", el);
    IA.chat(
      `Eres la guionista y letrista del Rusical de Drag Race España: un musical paródico, cantado, con humor drag. ${aiSeason()}`,
      `Tema del Rusical: ${tema}. Reparto: ${S.queen.name} (la jugadora) y ${mates.map((q) => q.name).join(", ")} (${mates.length + 1} reinas).
Los papeles son personajes de ficción con nombres inventados (el campo "papel" es el nombre del personaje, nunca su peso), NUNCA los nombres de las reinas.
Escribe: título, sinopsis (máximo 25 palabras), ${mates.length + 1} papeles (uno protagonista de peso "grande", el resto "medio" o "pequeño") qué papel quiere cada rival (${mates.map((q) => q.name).join(", ")}) con una frase suya, natural y en su estilo (máximo 20 palabras), en la que se lo cuenta a ${S.queen.name}, y la letra: entre ${Math.max(7, mates.length + 4)} y ${Math.max(9, mates.length + 6)} estrofas en orden, repartidas entre los papeles (el protagonista con 3, cada uno de los demás con al menos 1). Cada estrofa son 2 versos cortos (máximo 10 palabras cada uno) que riman entre sí.
Devuelve JSON {"titulo":"...","sinopsis":"...","papeles":[{"papel":"...","descripcion":"...","peso":"grande|medio|pequeño"}],"deseos":[{"reina":"nombre","papel":"...","frase":"..."}],"letra":[{"papel":"...","versos":["...","..."]}]}`,
      { json: true, max: 3200, temp: 1, timeout: 40000 },
    ).then((g) => {
      const roles = g && Array.isArray(g.papeles) ? g.papeles.filter((x) => x && x.papel).slice(0, mates.length + 1) : [];
      // Si la IA da menos papeles que reinas, el resto hace de coro (nadie se queda sin papel)
      ["Corista de la izquierda", "Corista de la derecha", "La vedette secundaria", "La acomodadora", "El galán de relleno", "La portera", "La primera bailarina"].forEach((n) => { if (roles.length && roles.length < mates.length + 1) roles.push({ papel: n, descripcion: "Papel de coro, con alguna estrofa suelta", peso: "pequeño" }); });
      roles.forEach((r) => { r.papel = cutWords(IA.clean(str(r.papel)), 60); r.peso = str(r.peso || "medio").slice(0, 10); });
      // Nombres de papel raros (el peso o el nombre de una reina): se arreglan
      const BAD = /^(grande|medio|peque(ñ|n)o|protagonista|papel)$/i;
      roles.forEach((r, k) => {
        const nm = str(r.papel).trim();
        if (BAD.test(nm) || [S.queen, ...S.rivals].some((q) => q.name === nm)) {
          const fixed = (IA.clean(str(r.descripcion)).match(/^(?:la |el |una |un )?[\wáéíóúñ]+(?: [\wáéíóúñ]+)?/i) || [`Personaje ${k + 1}`])[0].replace(/^una /i, "la ").replace(/^un /i, "el ");
          (g.letra || []).forEach((l) => l && str(l.papel) === nm && (l.papel = fixed));
          r.papel = fixed.charAt(0).toUpperCase() + fixed.slice(1);
          (g.letra || []).forEach((l) => l && l.papel === fixed && (l.papel = r.papel));
        }
      });
      const letra = g && Array.isArray(g.letra) ? g.letra.filter((x) => x && x.papel && Array.isArray(x.versos) && x.versos.length >= 2) : [];
      if (roles.length < 2 || letra.length < 4) return fail();
      const count = (r) => letra.filter((l) => str(l.papel) === str(r.papel)).length;
      const P = (r) => str(r.papel);
      const want = {}, said = {};
      mates.forEach((q) => {
        const d = (Array.isArray(g.deseos) ? g.deseos : []).find((x) => x && str(x.reina) === q.name);
        want[q.id] = (d && roles.find((r) => P(r) === str(d.papel))) || pick1(roles);
        said[q.id] = (d && IA.clean(str(d.frase))) || `A mí me encantaría hacer de ${P(want[q.id])}.`;
      });
      const known = new Set();
      const head = `<h3>«${esc(IA.clean(str(g.titulo)))}»</h3><p class="muted">${esc(IA.clean(str(g.sinopsis)))}</p>
        <div class="script">${roles.map((r) => `<p><b>${esc(P(r))} · ${esc(str(r.peso || "medio"))}</b> ${esc(IA.clean(str(r.descripcion)))} <i>(${count(r)} estrofas)</i></p>`).join("")}</div>`;
      const talk = () => {
        el.innerHTML = `
          <div class="story-card live">
            <p class="eyebrow">🎭 El Rusical · los papeles</p>
            ${head}
            <p class="twist-note">Reparte los papeles ${iWin ? "<b>tú</b>, que has ganado el minirreto" : `<b>${esc(winQ.name)}</b>, que ha ganado el minirreto`}.</p>
            <p>Habla con tus compañeras para saber qué papel quiere cada una:</p>
            <div class="live-log">${mates.filter((q) => known.has(q.id)).map((q) => `<p class="lv rival"><b>${esc(q.name)} · quiere ${esc(P(want[q.id]))}</b>${esc(said[q.id])}</p>`).join("")}</div>
            <div class="choice-col">${mates.filter((q) => !known.has(q.id)).map((q) => `<button class="btn btn-ghost" data-m="${q.id}">💬 Hablar con ${esc(q.name)}${q === winQ ? " (la que reparte)" : ""}</button>`).join("")}
              <button class="btn btn-primary" id="rs-go">${iWin ? "📋 Repartir los papeles" : "🙋 Pedir mi papel"}</button></div>
          </div>`;
        el.querySelectorAll("[data-m]").forEach((b) => b.addEventListener("click", () => { known.add(b.dataset.m); talk(); }));
        el.querySelector("#rs-go").addEventListener("click", () => (iWin ? assign() : ask()));
      };
      // La gana una rival: pides papel y ella decide
      const ask = () => {
        el.innerHTML = `
          <div class="story-card live">
            <p class="eyebrow">🎭 El Rusical · tu petición</p>
            <h3>¿Qué papel le pides a ${esc(winQ.name)}?</h3>
            <div class="choice-col">${roles.map((r, i) => `<button class="btn btn-ghost role" data-r="${i}"><b>${esc(P(r))} · ${esc(str(r.peso || "medio"))}</b><small>${count(r)} estrofas${mates.filter((q) => known.has(q.id) && want[q.id] === r).map((q) => ` · lo quiere ${esc(q.name)}`).join("")}</small></button>`).join("")}</div>
          </div>`;
        el.querySelectorAll("[data-r]").forEach((b) => b.addEventListener("click", () => decide(roles[+b.dataset.r])));
      };
      const decide = (myWish) => {
        const cast = {};
        const free = () => roles.filter((r) => !cast[P(r)]);
        cast[P(want[winQ.id])] = winQ;
        // Prioridad: cuánto le gustas a quien reparte (y si has hablado con ella)
        const prio = (q) => (q === S.queen ? relOf(winQ) * 1.5 + (known.has(winQ.id) ? 1 : 0) : (S.form[q.id] || 0) / 4) + Math.random() * 2;
        const rest = [S.queen, ...mates.filter((q) => q !== winQ)].sort((a, b) => prio(b) - prio(a));
        const left = [];
        rest.forEach((q) => { const w = q === S.queen ? myWish : want[q.id]; if (!cast[P(w)]) cast[P(w)] = q; else left.push(q); });
        left.forEach((q) => { const r = free()[0]; if (r) cast[P(r)] = q; });
        const mine = roles.find((r) => cast[P(r)] === S.queen);
        const got = mine === myWish;
        if (!got) changeRel(winQ, -1);
        mates.forEach((q) => { if (q !== winQ) S.form[q.id] = clamp((S.form[q.id] || 0) + (cast[P(want[q.id])] === q ? 1 : -1), -10, 10); });
        logEv(`Rusical: ${winQ.name} reparte los papeles; ${S.queen.name} pidió ${P(myWish)} y ${got ? "se lo dio" : `le tocó ${P(mine)}`}`);
        result(cast, mine, got ? `${winQ.name} te da el papel que pedías.` : `${winQ.name} no te da ${P(myWish)}. Tú haces de ${P(mine)}.`);
      };
      // La ganadora eres tú: repartes
      const assign = () => {
        const all = [S.queen, ...mates];
        // Propuesta inicial sin repetidos: a cada una lo que pide si está libre
        const pre = new Array(all.length).fill(-1);
        all.forEach((q, i) => { if (q === S.queen) return; const j = roles.indexOf(want[q.id]); if (!pre.includes(j)) pre[i] = j; });
        all.forEach((q, i) => { if (pre[i] < 0) pre[i] = roles.findIndex((r, j) => !pre.includes(j)); });
        el.innerHTML = `
          <div class="story-card live">
            <p class="eyebrow">🎭 El Rusical · repartes tú</p>
            <h3>¿Quién hace cada papel?</h3>
            <p class="muted">Dar a cada una lo que pide te gana amigas. Quitárselo, enemigas.</p>
            <div class="cast-grid">${all.map((q, i) => `<label><span><i style="background-image:url('${photo(q)}')"></i><b>${esc(q === S.queen ? "Tú" : q.name)}</b>${q !== S.queen && known.has(q.id) ? `<small>quiere ${esc(P(want[q.id]))}</small>` : ""}</span>
              <select data-q="${i}">${roles.map((r, j) => `<option value="${j}" ${pre[i] === j ? "selected" : ""}>${esc(P(r))} · ${esc(str(r.peso || "medio"))}</option>`).join("")}</select></label>`).join("")}</div>
            <button class="btn btn-primary" id="rs-ok">✅ Este es el reparto</button>
          </div>`;
        el.querySelector("#rs-ok").addEventListener("click", () => {
          const pickd = [...el.querySelectorAll("[data-q]")].map((x) => +x.value);
          if (new Set(pickd).size !== pickd.length) return Toast.show("🎭 Hay papeles repetidos", "Cada reina tiene que hacer un papel distinto");
          const cast = {};
          all.forEach((q, i) => (cast[P(roles[pickd[i]])] = q));
          let ok = 0, no = 0;
          mates.forEach((q) => {
            const g2 = cast[P(want[q.id])] === q;
            changeRel(q, g2 ? 1 : -1);
            S.form[q.id] = clamp((S.form[q.id] || 0) + (g2 ? 1 : -1), -10, 10);
            g2 ? ok++ : no++;
          });
          const mine = roles[pickd[0]];
          logEv(`Rusical: ${S.queen.name} reparte los papeles y se queda ${P(mine)}; ${ok} contentas y ${no} molestas`);
          result(cast, mine, no ? `${no} compañera${no > 1 ? "s" : ""} no ha${no > 1 ? "n" : ""} tenido el papel que quería${no > 1 ? "n" : ""}.` : "Todas tienen el papel que pedían.");
        });
      };
      const result = (cast, mine, note) => {
        el.innerHTML = `
          <div class="story-card live">
            <p class="eyebrow">🎭 El Rusical · el reparto</p>
            <h3>«${esc(IA.clean(str(g.titulo)))}»</h3>
            <div class="impro-cast">${roles.map((r) => { const q = cast[P(r)]; return q ? `<span><i style="background-image:url('${photo(q)}')"></i><b>${esc(q === S.queen ? "Tú" : q.name)}</b><small>${esc(P(r))}</small></span>` : ""; }).join("")}</div>
            <p class="twist-note">${esc(note)}</p>
            <button class="btn btn-primary" id="rs-sing">🎶 ¡Al escenario!</button>
          </div>`;
        if (!count(mine)) { const ex = letra.find((l) => !cast[str(l.papel)]) || letra[letra.length - 1]; ex.papel = mine.papel; }
        el.querySelector("#rs-sing").addEventListener("click", () => sing(g, mine, cast, ""));
      };
      talk();
      function sing(g, mine, cast, note) {
        let li = 0;
        const log = [];
        const mineV = [];
        const draw = (line) => {
          el.innerHTML = `
            <div class="story-card live">
              <p class="eyebrow">🎭 «${esc(IA.clean(str(g.titulo)))}» · en escena</p>
              ${note ? `<p class="twist-note">${esc(note)}</p>` : ""}
              <div class="live-log">${log.map((m) => `<p class="lv ${m.me ? "me" : "rival"}"><b>${esc(m.who)}</b>${m.t.map(esc).join("<br>")}</p>`).join("")}</div>
              <h3>🎶 Te toca, ${esc(str(mine.papel))}:</h3>
              <p class="rw-quote">${esc(IA.clean(str(line.versos[0])))}<br>…</p>
              <form class="ft-form"><input id="lv-in" maxlength="90" autocomplete="off" placeholder="Tu verso (que rime y se pueda cantar)..."><button class="btn btn-primary">🎤 Cantar</button></form>
            </div>`;
          const box = el.querySelector(".live-log");
          if (box) box.scrollTop = box.scrollHeight;
          const inp = el.querySelector("#lv-in");
          inp.focus({ preventScroll: true });
          el.querySelector(".ft-form").addEventListener("submit", (e) => {
            e.preventDefault();
            const v = inp.value.trim();
            if (!v) return;
            const v1 = IA.clean(str(line.versos[0]));
            mineV.push(`${v1} / ${v}`);
            log.push({ who: `${str(mine.papel)} (tú)`, t: [v1, v], me: true });
            next();
          });
        };
        function next() {
          while (li < letra.length && str(letra[li].papel) !== str(mine.papel)) {
            const l = letra[li++];
            const q = cast[str(l.papel)];
            log.push({ who: `${str(l.papel)}${q ? ` (${q.name})` : ""}`, t: l.versos.slice(0, 2).map((v) => IA.clean(str(v))) });
          }
          if (li >= letra.length) return judge();
          draw(letra[li++]);
        }
        async function judge() {
          aiWait("El jurado comenta el número...", el);
          const r = await IA.chat(
            "Eres el jurado del Rusical en Drag Race España: Supremme de Luxe y Ana Locking. Valoras los versos que ha escrito la reina: si riman con el verso anterior, si se pueden cantar, si tienen gracia y si encajan con su personaje y con la historia. Sé exigente: vacío o sin rima 10-35; correcto 50-65; ingenioso y cantable 75-95.",
            `Rusical «${str(g.titulo)}» (${tema}). ${S.queen.name} hace de ${str(mine.papel)} (${str(mine.descripcion)}). Sus estrofas (el primer verso venía escrito; el segundo, tras la barra, es suyo):\n${mineV.join("\n")}
Puntúa de 0 a 100. Devuelve JSON {"rima":0,"gracia":0,"personaje":0,"supreme":"comentario (máximo 25 palabras)","ana":"comentario (máximo 25 palabras)"}`,
            { json: true, max: 350, temp: 0.6 },
          );
          const [c1, c2, c3] = nums(r, ["rima", "gracia", "personaje"]);
          let sc = c1 * 0.35 + c2 * 0.4 + c3 * 0.25 + (A("performance") - 5) * 1.5 + (A("comedia") - 5);
          const peso = str(mine.peso);
          if (peso === "grande") sc = 50 + (sc - 50) * 1.2;
          if (peso === "pequeño") sc = Math.min(sc, 82);
          sc = clamp(Math.round(sc), 0, 100);
          logEv(`Rusical «${str(g.titulo)}»: ${S.queen.name} hizo de ${str(mine.papel)} (nota ${sc})`);
          liveResult(el, `🎭 «${esc(IA.clean(str(g.titulo)))}» · el jurado`, `
            <div class="live-log">${log.filter((m) => m.me).map((m) => `<p class="lv me"><b>${esc(m.who)}</b>${m.t.map(esc).join("<br>")}</p>`).join("")}</div>
            ${judgeLines(r)}`, sc, () => { if (sc >= 85) growAttr("performance"); done(sc); });
        }
        next();
      }
    });
  }

  // Girl Groups: nombre y estilo de la banda, tu estrofa y la IA compone el tema con las demás
  function liveGirlGroups(el, done) {
    ensureTeam();
    const mates = crew(3);
    if (!mates.length) mates.push(pick1(S.rivals));
    const STY = [["pop", "💖 Pop de verbena"], ["rap", "🎤 Rap chulapo"], ["reggaeton", "🍑 Reguetón"], ["euro", "🪩 Eurovisión"]];
    const SUG = shuffle(["Las Lentejuelas Asesinas", "Purpurina Mecánica", "Las Tías Buenas del Barrio", "Peluca Sónica", "Las Hijas del Desamor", "Tacón y Rímel"]).slice(0, 3);
    el.innerHTML = `
      <div class="story-card live">
        <p class="eyebrow">🎤 Girl Groups · vuestra banda</p>
        <div class="impro-cast">${[S.queen, ...mates].map((q) => `<span><i style="background-image:url('${photo(q)}')"></i><b>${esc(q === S.queen ? "Tú" : q.name)}</b></span>`).join("")}</div>
        <h3>¿Cómo se llama la banda?</h3>
        <form class="ft-form"><input id="gg-n" maxlength="40" autocomplete="off" placeholder="El nombre de vuestro grupo..."></form>
        <div class="chip-row">${SUG.map((s) => `<button class="btn btn-ghost chip" data-n="${esc(s)}">${esc(s)}</button>`).join("")}</div>
        <p class="muted">Y el estilo del himno:</p>
        <div class="choice-col">${STY.map(([k, t]) => `<button class="btn btn-ghost" data-st="${k}">${t}</button>`).join("")}</div>
      </div>`;
    const inp = el.querySelector("#gg-n");
    el.querySelector(".ft-form").addEventListener("submit", (e) => e.preventDefault());
    el.querySelectorAll("[data-n]").forEach((b) => b.addEventListener("click", () => (inp.value = b.dataset.n)));
    el.querySelectorAll("[data-st]").forEach((b) => b.addEventListener("click", () => {
      const band = inp.value.trim();
      if (!band) { inp.classList.add("shake"); inp.focus(); setTimeout(() => inp.classList.remove("shake"), 500); return Toast.show("✍️ Falta el nombre", "Escribe el nombre de la banda o elige uno de los propuestos"); }
      compose(band, STY.find((s) => s[0] === b.dataset.st)[1].slice(3));
    }));
    async function compose(band, style) {
      aiWait("La productora está montando la base...", el);
      S.gg = { ep: S.ep, band };
      const r = await IA.chat(
        `Eres la productora musical del reto Girl Groups de Drag Race España. Escribes letras de himno drag, pegadizas y con humor. ${aiSeason()}`,
        `Banda: «${band}», estilo ${style}. Integrantes: ${S.queen.name} (la jugadora) y ${mates.map((q) => `${q.name} (${idTxt(q) || aiProfile(q)})`).join(" | ")}.
Si alguna letra nombra al grupo, el nombre es exactamente «${band}». Escribe el título del tema, el estribillo (4 versos) y una estrofa de 4 versos para cada rival, con la voz y el carácter de cada una. NO escribas la estrofa de ${S.queen.name}: la escribe la jugadora.
Devuelve JSON {"titulo":"...","estribillo":["...","...","...","..."],"estrofas":[{"reina":"nombre","versos":["...","...","...","..."]}]}`,
        { json: true, max: 1200, temp: 1 },
      );
      if (!r || !Array.isArray(r.estribillo)) return liveFail(el, () => liveGirlGroups(el, done), () => { mxGirlGroups.classic = true; mxGirlGroups(el, (sc) => { mxGirlGroups.classic = false; done(sc); }); });
      const coro = r.estribillo.slice(0, 4).map((v) => IA.clean(str(v)));
      const est = (Array.isArray(r.estrofas) ? r.estrofas : []).filter((x) => x && mates.some((q) => q.name === str(x.reina)) && Array.isArray(x.versos));
      const title = IA.clean(str(r.titulo)) || band;
      S.gg = { ep: S.ep, band, title };
      el.innerHTML = `
        <div class="story-card live">
          <p class="eyebrow">🎤 «${esc(title)}» · ${esc(band)}</p>
          <div class="live-log">
            <p class="lv host"><b>Estribillo</b>${coro.map(esc).join("<br>")}</p>
            ${est.map((x) => `<p class="lv rival"><b>${esc(str(x.reina))}</b>${x.versos.slice(0, 4).map((v) => esc(IA.clean(str(v)))).join("<br>")}</p>`).join("")}
          </div>
          <h3>✍️ Tu estrofa</h3>
          <p class="muted">Cuatro versos, uno por línea. Que se note tu personalidad y que pegue con el tema.</p>
          ${taForm("gg-v", "Verso 1\nVerso 2\nVerso 3\nVerso 4", 320, 4, "🎧 Grabar")}
        </div>`;
      onTa(el, "gg-v", (v) => stage(band, style, title, coro, est, v));
    }
    function stage(band, style, title, coro, est, verse) {
      el.innerHTML = `
        <div class="story-card live">
          <p class="eyebrow">🎤 «${esc(title)}» · la coreografía</p>
          <h3>Actuación en directo: ¿dónde te colocas?</h3>
          <div class="choice-col">
            <button class="btn btn-ghost" data-p="c">⭐ En el centro <small>· robas miradas, exige Performance</small></button>
            <button class="btn btn-ghost" data-p="l">↔️ A los lados <small>· más seguro</small></button>
          </div>
        </div>`;
      el.querySelectorAll("[data-p]").forEach((b) => b.addEventListener("click", () => judge(band, style, title, coro, est, verse, b.dataset.p === "c")));
    }
    async function judge(band, style, title, coro, est, verse, center) {
      aiWait("El jurado escucha el tema...", el);
      const r = await IA.chat(
        "Eres el jurado de Drag Race España valorando un Girl Group: Supremme de Luxe y los Javis. Valora a cada reina por su estrofa: gracia, ritmo, personalidad y si encaja con el tema. Un texto vacío o sin ritmo 10-35; correcto 50-65; brillante 75-95. Nunca menciones números en los comentarios.",
        `Tema «${title}» de ${band} (${style}). Estribillo: ${coro.join(" / ")}.\n${est.map((x) => `${str(x.reina)}: ${x.versos.map(str).join(" / ")}`).join("\n")}\n${S.queen.name}: ${verse.replace(/\n+/g, " / ")}
Notas de 0 a 100. Devuelve JSON {"notas":[{"reina":"nombre","nota":0}],"supreme":"comentario sobre el grupo (máximo 25 palabras)","javis":"comentario de los Javis a ${S.queen.name} (máximo 25 palabras)"}`,
        { json: true, max: 400, temp: 0.6 },
      );
      const notas = {};
      (r && Array.isArray(r.notas) ? r.notas : []).forEach((x) => x && (notas[str(x.reina)] = clamp(Math.round(+x.nota || 50), 0, 100)));
      const myN = notas[S.queen.name] != null ? notas[S.queen.name] : 50;
      mates.forEach((q) => { if (notas[q.name] != null) S.form[q.id] = clamp((S.form[q.id] || 0) + Math.round((notas[q.name] - 55) / 8), -10, 10); });
      const ok = !center || check(["performance"], 60).ok;
      const sc = clamp(Math.round(myN + (A("performance") - 5) * 1.5 + (A("carisma") - 5) + (center ? (ok ? 8 : -10) : 0)), 0, 100);
      logEv(`Girl Groups: ${S.queen.name} canta en ${band} el tema «${title}» (nota ${sc})`);
      liveResult(el, `🎤 «${esc(title)}» · el jurado`, `
        <div class="impro-cast">${[{ q: S.queen, n: myN }, ...mates.map((q) => ({ q, n: notas[q.name] }))].map((x) => `<span><i style="background-image:url('${photo(x.q)}')"></i><b>${esc(x.q === S.queen ? "Tú" : x.q.name)}</b><small></small></span>`).join("")}</div>
        ${center ? `<p class="twist-note">${ok ? "⭐ En el centro y clavando cada paso." : "😬 En el centro... y fuera de ritmo."}</p>` : ""}${judgeLines(r, "supreme", "javis", "Supremme", "Los Javis")}`, sc, () => done(sc));
    }
  }

  // Materiales imposibles: la IA te da la caja y tú describes lo que construyes
  function liveMateriales(el, done) {
    aiWait("Ana Locking está preparando las cajas...", el);
    IA.chat(
      "Eres la producción del reto de materiales poco convencionales de Drag Race España. Preparas una caja de materiales que no son tela.",
      `Prepara una caja con nombre ingenioso y 6 materiales concretos, raros y españoles (de ferretería, cocina, chino, verbena...). Añade la frase con la que Ana Locking la presenta (máximo 20 palabras).
Devuelve JSON {"caja":"...","materiales":["...","...","...","...","...","..."],"ana":"..."}`,
      { json: true, max: 400, temp: 1 },
    ).then((box) => {
      const mats = box && Array.isArray(box.materiales) && box.materiales.length >= 4 ? box.materiales.slice(0, 6).map((m) => IA.clean(str(m))) : null;
      if (!mats) return liveFail(el, () => liveMateriales(el, done), () => { mxMateriales.classic = true; mxMateriales(el, (sc) => { mxMateriales.classic = false; done(sc); }); });
      el.innerHTML = `
        <div class="story-card live">
          <p class="eyebrow">🧰 Materiales imposibles · ${esc(IA.clean(str(box.caja)))}</p>
          ${box.ana ? `<p class="lv host"><b>Ana Locking</b>${esc(IA.clean(str(box.ana)))}</p>` : ""}
          <div class="chip-row">${mats.map((m) => `<span class="chip">${esc(m)}</span>`).join("")}</div>
          <h3>¿Qué construyes con esto?</h3>
          <p class="muted">Ponle nombre en la primera línea y describe el look: qué haces con cada material, la silueta y cómo lo sujetas.</p>
          ${taForm("mt-d", "El vestido de la verbena\nCon los farolillos hago un corpiño...", 500, 5, "🧵 Al taller")}
        </div>`;
      onTa(el, "mt-d", (v) => {
        const name = v.split("\n")[0].slice(0, 60);
        el.innerHTML = "";
        prepSew(el, `Materiales imposibles · ${name}`, 12, (sew, info) => judge(box, mats, name, v, sew, info));
      });
    });
    async function judge(box, mats, name, desc, sew, info) {
      aiWait("Ana Locking examina las costuras...", el);
      const r = await IA.chat(
        "Eres el jurado de Drag Race España en el reto de materiales poco convencionales: Ana Locking (moda, construcción, si es creíble) y Supremme de Luxe (impacto). Exigentes: una descripción vaga, que no usa los materiales o imposible de llevar puntúa bajo.",
        `Materiales de la caja: ${mats.join(", ")}. Look de ${S.queen.name}: «${desc}».${info.descosido ? " En la pasarela se le descosió una parte." : ""}
Valora de 0 a 100: "credible" (si se puede construir y llevar), "moda" (si parece alta costura y no un disfraz) y "uso" (si usa bien los materiales de la caja). En "imagen" describe EN INGLÉS, para un generador de imágenes, una foto del look tal como lo ha descrito (máximo 60 palabras): full-body runway photo of a drag queen wearing..., materiales visibles, colores, silueta${info.descosido ? ", con una costura rota" : ""}.
Devuelve JSON {"credible":0,"moda":0,"uso":0,"ana":"comentario (máximo 25 palabras)","supreme":"comentario (máximo 25 palabras)","imagen":"..."}`,
        { json: true, max: 450, temp: 0.6 },
      );
      const pic = await IA.image(`${str(r && r.imagen) || `Full-body runway photo of a drag queen wearing a couture look made of ${mats.join(", ")}`}. Fashion photography, Drag Race main stage, dramatic lighting, high detail.`);
      const [c1, c2, c3] = nums(r, ["credible", "moda", "uso"]);
      const sc = clamp(Math.round((c1 * 0.35 + c2 * 0.4 + c3 * 0.25) * 0.7 + sew * 0.3 + (A("estilo") - 5)), 0, 100);
      S.lastLook = { cat: "materiales imposibles", best: name, worst: info.descosido ? "traje descosido" : name, concepto: desc.slice(0, 140), critica: r ? `${str(r.ana)} ${str(r.supreme)}` : null };
      logEv(`Materiales imposibles: ${S.queen.name} presenta «${name}» (nota ${sc})`);
      liveResult(el, `🧰 «${esc(name)}» · el jurado`, `${pic ? `<div class="look-photo"><div class="ia-dots"><i></i><i></i><i></i></div><img alt="${esc(name)}" src="${pic}" onload="this.parentNode.classList.add('ok')" onerror="this.parentNode.classList.add('ko')"><div class="look-sketch">${Doll.svg(sewnSpec("Camp absoluto", { color: pick1(["#ffb800", "#6ad06a", "#ff5fa2", "#6ee7ff"]), pat: info.descosido ? "solid" : "flowers" }))}</div><small>Revelando la foto de la pasarela...</small></div>` : ""}${info.descosido ? `<p class="twist-note">💥 Una costura no aguanta en la pasarela.</p>` : ""}${judgeLines(r, "ana", "supreme", "Ana Locking", "Supremme")}`, sc, () => { if (sc >= 85) growAttr("estilo"); done(sc); });
    }
  }

  // El Ball con concepto: cada look se defiende con su concepto y el jurado mira la coherencia de los tres
  function liveBall(el, done, B, intro) {
    const cats = B.c.map((x) => x[0]);
    const scores = [], concepts = [];
    const home = (k) => intro(k, () => {
      el.innerHTML = "";
      runRunwayNew(el, cats[k], (sc) => { scores.push(sc); concepts.push(`«${cats[k]}»: ${(S.lastLook && S.lastLook.concepto) || "sin concepto"}`); k === 0 ? home(1) : sewn(); }, `${B.n} ${k + 1}/3 · `);
    });
    const sewn = () => intro(2, () => {
      el.innerHTML = "";
      prepSew(el, `${B.n} · «${cats[2]}» (hecho en el taller)`, 0, (sc, info) => {
        el.innerHTML = "";
        S.curPieces = [`un look cosido desde cero en el taller ${B.c[2][2].replace(/^Cosida en el taller /, "")}${info.descosido ? " (con una costura floja)" : ""}`];
        runwayWalk(el, cats[2], sewnSpec(cats[2], info.descosido ? { pat: "solid" } : { pat: "sequins" }), CAT_TAG[cats[2]] || "Glamour", (walk, flags) => {
          scores.push(sc * 0.5 + walk * 0.5);
          concepts.push(`«${cats[2]}»: ${(flags && flags.concepto) || "sin concepto"}`);
          S.lastLook = { cat: cats[2], best: "look hecho en el taller", worst: info.descosido ? "traje descosido" : "look hecho en el taller", concepto: flags && flags.concepto };
          finish();
        });
      });
    });
    async function finish() {
      aiWait("El jurado repasa los tres looks...", el);
      const r = await IA.chat(
        "Eres el jurado del Ball de Drag Race España: Supremme de Luxe y Ana Locking. En un Ball las tres pasarelas están conectadas por un tema y tienen que contar una historia. Valoras si los tres looks de la reina cuentan una historia propia y conectada (que se vea la evolución de una a otra) o si son tres looks sueltos o repetidos.",
        `${B.n}. Categorías: ${B.c.map((x) => `${x[0]} (${x[2]})`).join("; ")}.\nConceptos de ${S.queen.name}:\n${concepts.join("\n")}\nPuntúa de 0 a 100. Devuelve JSON {"coherencia":0,"supreme":"comentario (máximo 25 palabras)","ana":"comentario (máximo 25 palabras)"}`,
        { json: true, max: 300, temp: 0.6 },
      );
      const [coh] = nums(r, ["coherencia"], 55);
      const avg = scores.reduce((a, b) => a + b, 0) / Math.max(1, scores.length);
      const sc = clamp(Math.round(avg * 0.75 + coh * 0.25), 0, 100);
      logEv(`${B.n}: ${S.queen.name} defiende tres looks (${concepts.join("; ")}). Nota ${sc}`);
      liveResult(el, `👑 ${esc(B.n)} · el veredicto`, `
        <div class="live-log">${concepts.map((c, i) => `<p class="lv me"><b>Look ${i + 1}</b>${esc(c)}</p>`).join("")}</div>${judgeLines(r)}`, sc, () => done(sc));
    }
    home(0);
  }

  // Makeover: tu modelo tiene historia propia; charláis y diseñas el look de familia
  function liveMakeover(el, done, kind) {
    aiWait("Están llegando las invitadas...", el);
    IA.chat(
      "Creas personajes de ficción para el reto makeover de Drag Race España: familiares y amigos de la reina que nunca han hecho drag y vienen al programa encantados, con muchas ganas de dragearse. Saben a lo que vienen y les hace ilusión: nada de excusas, prisas ni pegas (ni que se tienen que ir pronto, ni que mañana trabajan).",
      `El makeover es: ${kind}. Inventa la persona que le toca a ${S.queen.name}: un familiar o amigo suyo con nombre inventado, quién es (su relación con ${S.queen.name} y a qué se dedica), una historia breve (máximo 30 palabras), lo cómoda que se siente con el drag (puede estar nerviosa, pero viene con ilusión: media o alta), su personalidad y lo primero que le dice a ${S.queen.name} (máximo 20 palabras).
Devuelve JSON {"nombre":"...","quien":"...","historia":"...","comodidad":"baja|media|alta","personalidad":"...","saludo":"..."}`,
      { json: true, max: 400, temp: 1 },
    ).then((m) => {
      if (!m || !m.nombre) return liveFail(el, () => liveMakeover(el, done, kind), () => { mxMakeover.classic = true; mxMakeover(el, (sc) => { mxMakeover.classic = false; done(sc); }); });
      const who = IA.clean(str(m.nombre));
      const sys = `Hablas SOLO como ${who}, ${str(m.quien)}, que va a hacer un makeover drag con ${S.queen.name} en Drag Race España. Tu historia: ${str(m.historia)}. Personalidad: ${str(m.personalidad)}. Comodidad con el drag: ${str(m.comodidad)}. Has venido porque te hace muchísima ilusión dragearte con ${S.queen.name}: sabes a lo que vienes y estás entregada, aunque te den nervios. Nunca pongas excusas ni digas que te tienes que ir, que estás cansada o que mañana trabajas. Contestas con naturalidad, máximo 25 palabras.`;
      const log = [{ who, t: IA.clean(str(m.saludo)) || "¡Qué ilusión! Nunca lo he hecho, pero vengo a por todas." }];
      let turns = 0;
      const draw = (wait) => {
        el.innerHTML = `
          <div class="story-card live">
            <p class="eyebrow">💄 Makeover · conoce a tu modelo ${Math.min(turns + 1, 3)}/3</p>
            <h3>${esc(who)} <small class="muted">· ${esc(IA.clean(str(m.quien)))}</small></h3>
            <p class="muted">${esc(IA.clean(str(m.historia)))} · Comodidad: <b>${esc(str(m.comodidad))}</b></p>
            <div class="live-log">${log.map((x) => `<p class="lv ${x.me ? "me" : "rival"}"><b>${esc(x.who)}</b>${esc(x.t)}</p>`).join("")}${wait ? `<div class="ia-dots"><i></i><i></i><i></i></div>` : ""}</div>
            ${wait ? "" : `<form class="ft-form"><input id="lv-in" maxlength="200" autocomplete="off" placeholder="Lo que le dices a ${esc(who)}..."><button class="btn btn-primary">Decir</button></form>`}
          </div>`;
        const box = el.querySelector(".live-log");
        if (box) box.scrollTop = box.scrollHeight;
        const inp = el.querySelector("#lv-in");
        if (!inp) return;
        inp.focus({ preventScroll: true });
        el.querySelector(".ft-form").addEventListener("submit", async (e) => {
          e.preventDefault();
          const v = inp.value.trim();
          if (!v) return;
          log.push({ who: "Tú", t: v, me: true });
          turns++;
          draw(true);
          const rep = await IA.chat(sys, `Conversación hasta ahora:\n${log.map((x) => `${x.me ? S.queen.name : who}: ${x.t}`).join("\n")}\nContesta a lo último que te ha dicho ${S.queen.name}.`, { max: 70 });
          log.push({ who, t: rep || "Vale... me fío de ti." });
          if (turns >= 3) design();
          else draw();
        });
      };
      function design() {
        el.innerHTML = `
          <div class="story-card live">
            <p class="eyebrow">💄 Makeover · el look de familia</p>
            <div class="live-log">${log.slice(-2).map((x) => `<p class="lv ${x.me ? "me" : "rival"}"><b>${esc(x.who)}</b>${esc(x.t)}</p>`).join("")}</div>
            <h3>Diseña a tu ${esc(kind.includes("madre") ? "madre" : kind.includes("hermana") ? "hermana" : "familia")} drag</h3>
            <p class="muted">Primera línea: su nombre drag. Después: maquillaje, ropa y el detalle que os hace familia, pensando en cómo es ${esc(who)}.</p>
            ${taForm("mk-d", "Rímel Pérez\nMismo ojo ahumado que yo pero más suave...", 500, 5, "💄 ¡A maquillar!")}
          </div>`;
        onTa(el, "mk-d", judge);
      }
      async function judge(v) {
        aiWait("Salís juntas a la pasarela...", el);
        const r = await IA.chat(
          "Eres el jurado del makeover en Drag Race España: Supremme de Luxe y Ana Locking. Valoras el parecido de familia (si el look de la modelo se parece al estilo de la reina) y la conexión (si la reina ha escuchado a su modelo y ha adaptado el look a cómo es y a lo cómoda que está).",
          `Reina: ${S.queen.name} (estilo ${S.lookTags && S.lookTags.length ? S.lookTags.slice(-3).join(", ") : "propio"}). Modelo: ${who}, ${str(m.quien)}. ${str(m.historia)} Comodidad: ${str(m.comodidad)}.
Conversación:\n${log.map((x) => `${x.me ? S.queen.name : who}: ${x.t}`).join("\n")}\nDiseño: «${v}»
Puntúa de 0 a 100. Devuelve JSON {"parecido":0,"conexion":0,"supreme":"comentario (máximo 25 palabras)","ana":"comentario (máximo 25 palabras)","modelo":"lo que dice ${who} al verse en el espejo (máximo 20 palabras)"}`,
          { json: true, max: 400, temp: 0.7 },
        );
        const [c1, c2] = nums(r, ["parecido", "conexion"]);
        const sc = clamp(Math.round(c1 * 0.5 + c2 * 0.5 + (A("maquillaje") - 5) * 2 + (A("carisma") - 5)), 0, 100);
        const dn = v.split("\n")[0].slice(0, 40);
        logEv(`Makeover: ${S.queen.name} convierte a ${who} en ${dn} (nota ${sc})`);
        S.lastLook = { cat: "makeover: el look de familia", best: "el look de familia", worst: "el look de familia", concepto: v.slice(0, 140), critica: r ? `${str(r.supreme)} ${str(r.ana)}` : null };
        liveResult(el, `💄 ${esc(who)} es ahora ${esc(dn)}`, `${r && r.modelo ? `<p class="lv rival"><b>${esc(who)}</b>${esc(IA.clean(str(r.modelo)))}</p>` : ""}${judgeLines(r)}`, sc, () => { if (sc >= 85) growAttr("maquillaje"); done(sc); });
      }
      draw();
    });
  }

  // Publicidad: producto absurdo, tu eslogan y tu guion
  function livePublicidad(el, done) {
    const mate = S.cGroups && S.team && S.team[0];
    aiWait("El cliente está llegando con el producto...", el);
    IA.chat(
      "Eres la productora del reto de publicidad de Drag Race España. Inventas productos absurdos (inventados, sin marcas reales) que las reinas tienen que anunciar.",
      `Inventa un producto absurdo y gracioso, inspirado en esta idea: ${nextProducto()} (puedes darle tu toque, pero nada de sprays ni fijadores de cejas), su marca inventada y lo que pide el cliente del anuncio (máximo 20 palabras).${mate ? ` El anuncio lo hacen en pareja ${S.queen.name} y ${mate.name}: en "idea" escribe lo que propone ${mate.name} para el anuncio, con su voz (máximo 25 palabras). ${aiProfile(mate)}` : ""}
Devuelve JSON {"producto":"...","marca":"...","descripcion":"máximo 25 palabras","cliente":"..."${mate ? ',"idea":"..."' : ""}}`,
      { json: true, max: 300, temp: 1.1 },
    ).then((p) => {
      if (!p || !p.producto) return liveFail(el, () => livePublicidad(el, done), () => { mxPublicidad.classic = true; mxPublicidad(el, (sc) => { mxPublicidad.classic = false; done(sc); }); });
      const prod = IA.clean(str(p.producto)), marca = IA.clean(str(p.marca));
      el.innerHTML = `
        <div class="story-card live">
          <p class="eyebrow">📺 Publicidad · ${esc(marca)}</p>
          <h3>${esc(prod)}</h3>
          <p class="muted">${esc(IA.clean(str(p.descripcion)))}</p>
          ${p.cliente ? `<p class="lv host"><b>El cliente</b>${esc(IA.clean(str(p.cliente)))}</p>` : ""}
          ${mate && p.idea ? `<p class="lv rival"><b>${esc(mate.name)} (tu pareja)</b>${esc(IA.clean(str(p.idea)))}</p>` : ""}
          <p><b>📣 El eslogan</b></p>
          <form class="ft-form"><input id="pb-e" maxlength="90" autocomplete="off" placeholder="Tu eslogan..."></form>
          <p><b>🎬 El guion del anuncio</b> <span class="muted">(qué pasa y qué dices, 30 segundos)</span></p>
          ${taForm("pb-g", "Salgo de una bañera de purpurina y digo...", 600, 5, "🎬 ¡Grabamos!")}
        </div>`;
      el.querySelector(".ft-form").addEventListener("submit", (e) => { e.preventDefault(); el.querySelector("#pb-g").focus(); });
      onTa(el, "pb-g", async (g) => {
        const inpE = el.querySelector("#pb-e");
        const slogan = inpE.value.trim();
        if (!slogan) { inpE.classList.add("shake"); inpE.focus(); setTimeout(() => inpE.classList.remove("shake"), 500); return Toast.show("📣 Falta el eslogan", "Escribe el eslogan del anuncio antes de grabar"); }
        aiWait("Montando el anuncio...", el);
        const r = await IA.chat(
          "Eres el jurado de Drag Race España en el reto de publicidad: Supremme de Luxe y los Javis. Valoras el eslogan (pegadizo y camp), el guion (gracioso, claro, que venda el producto) y el humor drag. Exigentes: sin eslogan o con un guion vacío puntúa bajo.",
          `Producto: ${prod} de ${marca} (${str(p.descripcion)}). Pide el cliente: ${str(p.cliente)}.\n${mate ? `Lo graban en pareja ${S.queen.name} y ${mate.name}${p.idea ? ` (${mate.name} propuso: ${str(p.idea)})` : ""}. ` : ""}Eslogan de ${S.queen.name}: «${slogan}»\nGuion: «${g}»
Puntúa de 0 a 100. Devuelve JSON {"eslogan":0,"guion":0,"camp":0,"supreme":"comentario (máximo 25 palabras)","javis":"comentario de los Javis (máximo 25 palabras)"}`,
          { json: true, max: 350, temp: 0.6 },
        );
        const [c1, c2, c3] = nums(r, ["eslogan", "guion", "camp"]);
        const sc = clamp(Math.round(c1 * 0.3 + c2 * 0.4 + c3 * 0.3 + (A("carisma") - 5) * 1.5 + (A("comedia") - 5)), 0, 100);
        logEv(`Publicidad: ${S.queen.name} anuncia ${prod} de ${marca} con el eslogan «${slogan}» y este guion: «${g.slice(0, 160)}» (nota ${sc})`);
        liveResult(el, `📺 ${esc(marca)} · el anuncio`, `<p class="rw-quote">«${esc(slogan)}»</p>${judgeLines(r, "supreme", "javis", "Supremme", "Los Javis")}`, sc, () => { if (sc >= 85) growAttr("carisma"); done(sc); });
      });
    });
  }

