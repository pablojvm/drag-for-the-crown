  // ------------------------------ Maxi retos ------------------------------
  function mxSnatch(el, done) {
    if (IA.ready() && !mxSnatch.classic) return aiOrClassic(el, "Snatch Game", "🎭", () => liveSnatch(el, done), () => { mxSnatch.classic = true; mxSnatch(el, (sc) => { mxSnatch.classic = false; done(sc); }); });
    const chars = shuffle(SNATCH_PERSONAJES).slice(0, 3);
    const qs = shuffle(SNATCH_PREGUNTAS).slice(0, 5);
    const steps = [
      () => ({
        q: "🎭 ¿A quién imitas?",
        sub: "Elige tu personaje para el plató de Supremme.",
        opts: chars.map((c) => ({ t: `${c.icon} ${esc(c.name)}`, d: `Tono ${esc(c.tono)}`, go: (st) => { st.char = c; return {}; } })),
      }),
    ];
    qs.forEach((qq, n) => {
      if (n > 0 && Math.random() < 0.45)
        steps.push((st) => {
          const r = pick1(S.rivals);
          return {
            q: `😶 ${esc(r.name)} se queda en blanco...`,
            sub: "Hay un silencio incómodo en el plató. ¿Aprovechas?",
            opts: [
              { t: "🎯 Robar la atención y rematar el chiste", d: "Comedia + Carisma", go: (s) => { s.focus += 18; const c = check(["comedia", "carisma"], 58); if (c.ok) changeRel(r, -1); return res(c, 100, 22, "¡Remate perfecto! Te llevas la risa.", "Intentas rematar... y la pisas. Nadie se ríe."); } },
              { t: "🤫 Dejarla respirar", d: "Sin riesgo", go: (s) => { s.focus -= 6; return { pts: 55, msg: "Discreta. Nadie se fija en ti." }; } },
            ],
          };
        });
      steps.push((st) => {
        const r = pick1(S.rivals);
        const ch = st.char || chars[0];
        return {
          q: `🎤 Supremme: «${esc(qq)}»`,
          sub: `Eres <b>${esc(ch.name)}</b>. Pregunta ${n + 1}/5.`,
          opts: [
            { t: `😂 «${esc(pick1(ch.frases))}»`, d: "Comedia absurda", tag: "Comedia", go: (s) => { s.focus += 14; return res(check(["comedia"], 52), 90, 30, "¡Carcajada general!", "Nadie lo pilla. Grillos."); } },
            { t: `⚡ Replicar a ${esc(r.name)}`, d: "Carisma · sube mucho el foco y crea drama", tag: "Carisma", go: (s) => { s.focus += 24; s.drama = (s.drama || 0) + 1; changeRel(r, -1); return res(check(["carisma"], 55), 94, 34, `¡Le has dado un zasca a ${esc(r.name)} y el plató explota!`, "La réplica suena a ataque. Tensión, no risas."); } },
            { t: `🛡️ «${esc(pick1(SNATCH_PLANAS))}»`, d: "Respuesta segura", tag: "Segura", go: (s) => { s.focus -= 12; return { pts: 48, msg: "Correcta. Poco memorable." }; } },
          ],
        };
      });
      // El foco se gestiona tras cada pregunta
      steps.push((st) => {
        st.focus -= 6;
        if (st.focus > 80) { st.total += 25 * 0.5; st.wsum += 0.5; Toast.show("🔦 ¡Estás interrumpiendo!", "Demasiado foco: el jurado lo penaliza"); }
        else if (st.focus < 30) { st.total += 25 * 0.5; st.wsum += 0.5; Toast.show("🔦 Pasas desapercibida", "Nadie se acuerda de ti"); }
        st.focus = clamp(st.focus, 0, 100);
        return null;
      });
    });
    runSteps(el, { title: "Snatch Game", icon: "🎭", meters: ["focus"], steps }, (sc) => done(sc));
  }

  function mxBall(el, done) {
    const B = currentBall();
    S.ballIdx = (S.ballIdx || 0) + 2;
    const cats = B.c.map((x) => x[0]);
    S.ballCtx = `Es ${B.n}: tres pasarelas conectadas (${B.c.map((x) => `${x[0]}: ${x[2]}`).join("; ")}). Las tres tienen que contar una historia entre sí.`;
    // Presentación de cada categoría del Ball
    const intro = (k, then) => {
      el.innerHTML = `
        <div class="story-card">
          <p class="eyebrow">👑 ${esc(B.n)} · categoría ${k + 1} de 3</p>
          <div class="ball-steps">${B.c.map((x, i) => `<span class="${i === k ? "on" : i < k ? "done" : ""}">${esc(x[0])}</span>`).join("<i>→</i>")}</div>
          <h3>«${esc(B.c[k][0])}»</h3>
          <p>${esc(B.c[k][2])}.</p>
          <p class="muted">${k < 2 ? "Este look lo traes de casa." : "Este lo coses desde cero en el taller."} Que se note que los tres cuentan la misma historia.</p>
          <button class="btn btn-primary" id="ball-go">${k < 2 ? "👗 Elegir el look" : "🧵 Al taller"}</button>
        </div>`;
      el.querySelector("#ball-go").addEventListener("click", then);
    };
    const end = (sc) => { S.ballCtx = null; done(sc); };
    if (IA.ready() && !S.meOut) return liveBall(el, end, B, intro);
    const scores = [];
    const home = (k) => intro(k, () => {
      el.innerHTML = "";
      runRunwayNew(el, cats[k], (sc) => { scores.push(sc); k === 0 ? home(1) : sewn(); }, `${B.n} ${k + 1}/3 · `);
    });
    const sewn = () => intro(2, () => {
      el.innerHTML = "";
      prepSew(el, `${B.n} · «${cats[2]}» (hecho en el taller)`, 0, (sc, info) => {
        el.innerHTML = "";
        runwayWalk(el, cats[2], sewnSpec(cats[2], info.descosido ? { pat: "solid" } : { pat: "sequins" }), CAT_TAG[cats[2]] || "Glamour", (walk) => {
          S.lastLook = { cat: cats[2], best: "look hecho en el taller", worst: info.descosido ? "traje descosido" : "look hecho en el taller" };
          end(scores[0] * 0.25 + scores[1] * 0.25 + (sc * 0.6 + walk * 0.4) * 0.5);
        });
      });
    });
    home(0);
  }

  function mxMateriales(el, done) {
    if (IA.ready() && !mxMateriales.classic) return aiOrClassic(el, "Materiales imposibles", "🧰", () => liveMateriales(el, done), () => { mxMateriales.classic = true; mxMateriales(el, (sc) => { mxMateriales.classic = false; done(sc); }); });
    const LOTS = [
      { k: "flex", t: "🛍️ Lote flexible", d: "Bolsas de patatas, cortinas, globos. Fácil de coser.", diff: 0, aud: 0 },
      { k: "rig", t: "🪣 Lote rígido", d: "Tapones, tornillos, macetas. +Audacia, más difícil.", diff: 12, aud: 10 },
      { k: "abs", t: "🍝 Lote absurdo", d: "Espaguetis, peluches, esponjas. ¡Máxima Audacia!", diff: 24, aud: 22 },
    ];
    runSteps(el, {
      title: "Reto de materiales imposibles", icon: "🧰",
      steps: [() => ({ q: "📦 Reclama tu lote de materiales", sub: "Cuanto más raro, más te lo premian... si consigues que no se rompa.", opts: LOTS.map((l) => ({ t: l.t, d: l.d, go: (s) => { s.lot = l; return {}; } })) })],
      finish: () => 0,
    }, (_, st) => {
      const lot = st.lot || LOTS[0];
      prepSew(el, `Materiales imposibles · ${lot.t}`, lot.diff, (sc, info) => {
        el.innerHTML = "";
        runSteps(el, {
          title: "Desfile del look imposible", icon: "🧰",
          steps: [
            ...(lot.aud && info.descosido ? [() => ({ q: "💥 ¡El vestido se rompe a mitad de pasarela!", sub: "El material era demasiado difícil y las costuras no aguantan.", opts: [{ t: "Seguir como si nada", go: () => ({ pts: 20, w: 2, msg: "Lo das todo... con medio vestido." }) }, { t: "Convertirlo en parte del show", d: "Carisma", go: () => ({ ...res(check(["carisma"], 60), 70, 15, "¡Parece que era a propósito!", "No cuela."), w: 2 }) }] })] : []),
          ],
          finish: (st2, base) => base,
        }, (brk) => runwayWalk(el, "Materiales imposibles", sewnSpec("Camp absoluto", { color: pick1(["#ffb800", "#6ad06a", "#ff5fa2", "#6ee7ff"]), pat: lot.k === "abs" ? "flowers" : lot.k === "rig" ? "metal" : "sequins" }), "Camp", (walk0) => { const walk = info.descosido && lot.aud ? (walk0 + brk) / 2 : walk0;
          S.lastLook = { cat: "materiales imposibles", best: lot.t.slice(3).toLowerCase(), worst: info.descosido ? "traje descosido" : lot.t.slice(3).toLowerCase() };
          done(clamp(sc * 0.6 + walk * 0.4 + lot.aud * (info.descosido ? 0 : 1), 0, 100));
        }));
      });
    });
  }

  function mxRusical(el, done) {
    const tema = pick1(["la revista de los 70", "la movida madrileña", "una diva de la copla", "el destape", "las verbenas de agosto"]);
    if (IA.ready() && !mxRusical.classic) return aiOrClassic(el, "El Rusical", "🎭", () => liveRusical(el, done, (S.curTitulo || "").split(": ")[1] || tema), () => { mxRusical.classic = true; mxRusical(el, (sc) => { mxRusical.classic = false; done(sc); }); });
    const MOODS = [["dramatica", "🎭 Dramática"], ["alegre", "🌈 Alegre"], ["agresiva", "🔥 Agresiva"]];
    const STANZAS = [
      ["«Me dejaste en la estación con la maleta y el corazón…»", "dramatica"],
      ["«¡Que suenen las castañuelas, que hoy me caso con la verbena!»", "alegre"],
      ["«A mí nadie me pisa el escenario, cariño, ni aunque lleves tacones de diario»", "agresiva"],
      ["«Bajo la luna de Cádiz lloré por un marinero…»", "dramatica"],
      ["«Brilla, brilla, lentejuela, que la noche es pa' la abuela»", "alegre"],
    ];
    const st2 = shuffle(STANZAS).slice(0, 2);
    // Los papeles los reparte la ganadora del minirreto: si no eres tú, puede no darte el que pides
    const giver = S.miniWin && S.miniWin !== "me" ? qById(S.miniWin) : null;
    const askRole = (s, role, msg) => {
      if (giver && S.rivals.includes(giver) && relOf(giver) < 1 && Math.random() < 0.45) {
        s.role = pick1(["main", "comic", "sec"].filter((r) => r !== role));
        return { msg: `${giver.name} reparte y no te da ese papel. Te toca ${{ main: "el principal", comic: "el cómico", sec: "un secundario" }[s.role]}.` };
      }
      s.role = role;
      return { msg: giver ? `${giver.name} te lo da. ${msg}` : msg };
    };
    const steps = [
      () => ({
        q: `🎬 Reparto de papeles: Rusical sobre ${tema}`,
        opts: [
          { t: "👑 Pedir el principal", d: "Alto riesgo, alta recompensa", go: (s) => askRole(s, "main", "Toda la presión es tuya.") },
          { t: "🤡 Pedir el cómico", d: "Tira de Comedia", go: (s) => askRole(s, "comic", "A hacer reír.") },
          { t: "🙂 Pedir un secundario", d: "Poco riesgo, pero con techo", go: (s) => askRole(s, "sec", "Discreta, pero segura.") },
        ],
      }),
    ];
    [0, 1].forEach((n) => {
      steps.push((st) => ({
        q: `🕺 Número ${n + 1}: llega tu momento de baile`,
        opts: [
          { t: "✅ Paso limpio", d: "Seguro", go: () => ({ pts: st.role === "sec" ? 65 : 60, msg: "Limpio y a tiempo." }) },
          { t: "🌀 Truco arriesgado (split / pirueta)", d: "Performance", go: () => { const dif = st.role === "main" ? 55 : 60; const c = check([st.role === "comic" ? "comedia" : "performance"], dif); return res(c, st.role === "main" ? 100 : 88, st.role === "main" ? 10 : 25, "¡El público enloquece!", "¡Te caes de culo! (y no era parte del número)"); } },
        ],
      }));
      steps.push((st) => {
        const [line, mood] = st2[n];
        return {
          q: `🎶 Estrofa: ${line}`,
          sub: "¿Con qué intención haces el playback?",
          opts: MOODS.map(([k, t]) => ({ t, go: () => (k === mood ? { pts: st.role === "comic" ? 85 + A("comedia") : 92, msg: "Intención perfecta: se te cree cada palabra." } : { pts: 40, msg: "La cara dice una cosa y la letra otra." }) })),
        };
      });
    });
    runSteps(el, { title: `El Rusical: ${tema}`, icon: "🎭", steps, finish: (st, base) => (st.role === "sec" ? Math.min(base, 72) : st.role === "main" ? base * 1.08 : base) }, (sc) => done(sc));
  }

  function mxGirlGroups(el, done) {
    if (IA.ready() && !mxGirlGroups.classic) return aiOrClassic(el, "Girl Groups", "🎤", () => liveGirlGroups(el, done), () => { mxGirlGroups.classic = true; mxGirlGroups(el, (sc) => { mxGirlGroups.classic = false; done(sc); }); });
    ensureTeam();
    const mate = pick1(S.team) || pick1(S.rivals);
    const steps = [
      () => ({
        q: "✍️ Escribe tu estrofa del himno",
        sub: "¿Qué tono le das?",
        opts: [
          { t: "💪 Empoderada", d: "Carisma", go: () => res(check(["carisma"], 52), 90, 35, "«¡Nadie me apaga la luz!» Suena a himno.", "Suena a frase de taza.") },
          { t: "🤪 Cómica / absurda", d: "Comedia", go: () => res(check(["comedia"], 52), 92, 30, "El estudio entero se ríe.", "Nadie pilla la rima.") },
          { t: "😎 Chula (chulapa)", d: "Carisma + Comedia", go: () => res(check(["carisma", "comedia"], 58), 96, 28, "¡Con dos ovarios! Estrofa redonda.", "Se queda en chulería sin gracia.") },
        ],
      }),
      () => ({
        q: "🎧 Grabación en el estudio",
        opts: [
          { t: "🎤 Hacer voces y armonías", d: "Performance", go: () => res(check(["performance"], 55), 85, 40, "La productora aplaude.", "Desafinas un poco...") },
          { t: "🗣️ Recitado con actitud", d: "Carisma", go: () => res(check(["carisma"], 50), 80, 45, "Actitud de sobra.", "Monótono.") },
        ],
      }),
      () => ({
        q: "📍 Coreografía en directo: ¿dónde te colocas?",
        opts: [
          { t: "⭐ En el centro", d: "Robas miradas · exige Performance alta", go: () => res(check(["performance"], 64), 98, 25, "Todas las cámaras son para ti.", "En el centro... y fuera de ritmo.") },
          { t: "↔️ A los lados", d: "Más seguro", go: () => ({ pts: 64, msg: "Cumples sin riesgos." }) },
        ],
      }),
      () => ({
        q: `😱 ¡${esc(mate.name)} se equivoca de paso!`,
        opts: [
          { t: "🤝 Corregir la formación", d: "Ayudas al grupo", go: () => { changeRel(mate, 1); return { pts: 74, msg: "Lo disimuláis entre las dos. Equipo." }; } },
          { t: "💃 Aprovechar para destacar", d: "Carisma · a costa de ella", go: () => { changeRel(mate, -1); return res(check(["carisma"], 55), 95, 35, "Todo el mundo te mira a ti.", "Se nota que la has dejado tirada."); } },
        ],
      }),
    ];
    runSteps(el, { title: "Girl Groups: el himno de la temporada", icon: "🎤", steps }, (sc) => done(sc));
  }

  function mxActing(el, done) {
    if (IA.ready() && !mxActing.classic) return aiOrClassic(el, "Interpretación", "🎬", () => liveActing(el, done), () => { mxActing.classic = true; mxActing(el, (sc) => { mxActing.classic = false; done(sc); }); });
    ensureTeam();
    // El género sale del título anunciado: si Supremme dijo teletienda, se rueda una teletienda
    const GENEROS = {
      telenovela: [["telenovela", "sobre"], ["«¡Tú no eres mi madre! ¡Mi madre es la de la peluca rubia!»", "«Esta herencia es mía, y el cortijo también.»", "«No me mires así, que me derrito como un helado en agosto.»"]],
      teletienda: [["anuncio de teletienda", "sobre"], [`«¡Llame ya! ${S.weekProd ? `Solo hoy, ${S.weekProd}` : "Solo hoy, dos por uno"}!»`, "«¿Que se le corre el rímel? ¡Con esto, nunca más!»", "«Y si llama en los próximos diez minutos... ¡le regalamos otro!»"]],
      serie: [["parodia de serie juvenil", "absurdo"], ["«¿Que me has dejado por mensaje? ¿En el recreo?»", "«Esta fiesta va a ser la mejor de todo el instituto.»", "«No es lo que parece. Bueno, sí. Pero no.»"]],
    };
    const tt = (S.curTitulo || "").toLowerCase();
    const gk = /teletienda/.test(tt) ? "teletienda" : /serie/.test(tt) ? "serie" : /telenovela/.test(tt) ? "telenovela" : pick1(Object.keys(GENEROS));
    if (gk === "teletienda" && !S.weekProd) S.weekProd = nextProducto();
    if (gk === "teletienda") logEv(`En la teletienda se anuncia ${S.weekProd}`);
    const genero = GENEROS[gk][0];
    const partner = pick1(S.team) || pick1(S.rivals);
    const INT = [["sobre", "🎭 Sobreactuado"], ["drama", "😢 Dramático"], ["absurdo", "🤪 Absurdo"]];
    const beats = gk === "teletienda" ? [`«¡Llame ya! Solo hoy: ${S.weekProd}!»`, GENEROS.teletienda[1][1], GENEROS.teletienda[1][2]] : GENEROS[gk][1];
    const steps = beats.map((b, n) => () => ({
      q: `🎬 Escena ${n + 1}: ${b}`,
      sub: `Es un ${genero[0]}. ¿Con qué intención lo dices?`,
      opts: INT.map(([k, t]) => ({ t, go: () => (k === genero[1] || (n === 2 && k === "absurdo") ? { pts: 90 + A("carisma"), msg: "¡Corten! Toma buena." } : { pts: 48, msg: "La directora frunce el ceño." }) })),
    }));
    steps.splice(2, 0, () => ({
      q: `😶 ${esc(partner.name)} olvida su frase en mitad de la toma`,
      opts: [
        { t: "💡 Salvar la escena improvisando", d: "Carisma + Comedia (bonus si sale)", go: () => { const c = check(["carisma", "comedia"], 55); if (c.ok) changeRel(partner, 1); return { ...res(c, 100, 28, "¡Lo que has improvisado es mejor que el guion!", "Te lías tú también. Escena perdida."), w: 1.5 }; } },
        { t: "📜 Mantener el guion", d: "Neutro", go: () => ({ pts: 58, msg: "Esperas... y seguís. Correcto." }) },
      ],
    }));
    runSteps(el, { title: `Reto de interpretación: ${genero[0]}`, icon: "🎬", steps }, (sc) => done(sc));
  }

  function mxRoast(el, done) {
    if (IA.ready() && !mxRoast.classic) return aiOrClassic(el, "El Roast", "🔥", () => liveRoast(el, done), () => { mxRoast.classic = true; mxRoast(el, (sc) => { mxRoast.classic = false; done(sc); }); });
    const T = { jurado: { t: "⚖️ Al jurado", d: "Alto riesgo, alta recompensa", diff: 62, cap: 100 }, comp: { t: "👯 A las compañeras", d: "Crea drama", diff: 55, cap: 96 }, auto: { t: "🪞 A ti misma", d: "Autohumor: seguro, con techo", diff: 42, cap: 82 } };
    const bank = shuffle([...ROAST, ...COMEDIA]).slice(0, 4);
    const steps = [
      () => ({ q: "🎯 ¿Quién es la diana de tus chistes?", opts: Object.entries(T).map(([k, v]) => ({ t: v.t, d: v.d, go: (s) => { s.target = k; return {}; } })) }),
      ...bank.map(([setup, [best, mid, flat]], n) => (st) => {
        const tg = T[st.target || "comp"];
        return {
          q: `🎙️ Chiste ${n + 1}/4: ${esc(setup)}`,
          sub: "¿Cuánta caña le das al remate?",
          opts: [
            { t: `🍬 Suave: «${esc(flat)}»`, d: "No falla, pero no da risa", go: () => ({ pts: 52, msg: "Risas educadas." }) },
            { t: `🌶️ Picante: «${esc(mid)}»`, d: "Comedia", go: () => res(check(["comedia"], tg.diff - 8), Math.min(tg.cap, 86), 28, "¡Buena risa!", "Tibio. Se oye toser a alguien.") },
            { t: `💣 Salvaje: «${esc(best)}»`, d: "Comedia · si falla, silencio incómodo", go: (s) => { const c = check(["comedia"], tg.diff + 10); if (st.target === "comp" && c.ok) changeRel(pick1(S.rivals), -1); return res(c, tg.cap, 5, "¡El público llora de risa!", "🥶 Silencio incómodo. Se oye una tos al fondo."); } },
          ],
        };
      }),
    ];
    runSteps(el, { title: "El Roast (rapapolvos)", icon: "🔥", steps }, (sc) => done(sc));
  }

  function mxMakeover(el, done) {
    if (IA.ready() && !mxMakeover.classic) return aiOrClassic(el, "Makeover", "💄", () => liveMakeover(el, done, S.curTitulo || "Makeover: tu hermana drag"), () => { mxMakeover.classic = true; mxMakeover(el, (sc) => { mxMakeover.classic = false; done(sc); }); });
    // La invitada sale del título anunciado: familia o amigas con muchas ganas de hacer drag
    const tt = (S.curTitulo || "").toLowerCase();
    const who = /madre/.test(tt) ? "Tu madre" : /hermana/.test(tt) ? "Tu hermana" : /amiga/.test(tt) ? "Tu mejor amiga" : pick1(["Tu madre", "Tu hermana", "Tu mejor amiga"]);
    const MODELS = [
      { d: "Con muchísimas ganas, aunque delante de la cámara se corta un poco. Espalda ancha", comfort: "baja", body: "grande" },
      { d: "Ilusionadísima, pero nunca se ha subido a unos tacones. Espalda ancha", comfort: "media", body: "grande" },
      { d: "Se deja hacer de todo y lo está deseando. Cuerpo menudo", comfort: "alta", body: "menudo" },
      { d: "Viene a comerse el escenario. Muy bajita", comfort: "alta", body: "menudo" },
    ];
    const model = { ...pick1(MODELS), n: who };
    logEv(`Makeover: ${S.queen.name} transforma a ${who.toLowerCase()}`);
    const steps = [
      () => ({
        q: `👥 Tu modelo: ${model.n}`,
        sub: `${model.d}. Tu Maquillaje: <b>${A("maquillaje")}</b>. ¿Cómo adaptas tu maquillaje?`,
        opts: [
          { t: "🪞 Copia exacta de mi cara", d: "Máximo parecido", go: () => (model.comfort === "alta" ? { pts: 94, msg: "¡Sois dos gotas de agua!" } : { pts: 42, msg: "Tanta pintura le pesa y se le nota en la cara." }) },
          { t: "🎨 Mi paleta, adaptada a su cara", d: "Equilibrado", go: () => ({ pts: 78, msg: "Se ve el parecido sin forzar." }) },
          { t: "🌸 Suavizado: que brille ella", d: "Para quien se corta ante la cámara", go: () => (model.comfort === "baja" ? { pts: 92, msg: "Se siente cómoda y le brillan los ojos." } : { pts: 55, msg: "Queda mono, pero no parecéis familia." }) },
        ],
      }),
      () => ({
        q: "👗 La ropa",
        opts: [
          { t: "👯 Looks gemelos", d: "Mismo vestido para las dos", go: () => (model.body === "menudo" ? { pts: 90, msg: "Parecéis muñecas rusas. ¡Precioso!" } : { pts: 45, msg: "El vestido le queda... raro." }) },
          { t: "🎨 Misma paleta, distinto corte", d: "Adaptado a su cuerpo", go: () => ({ pts: model.body === "grande" ? 92 : 76, msg: "Familia, pero cada una con su silueta." }) },
          { t: "🙈 Que lleve algo discreto", d: "No le opacas... ni se os parece", go: () => ({ pts: 40, msg: "¿Seguro que sois familia?" }) },
        ],
      }),
      () => ({
        q: "🎤 Presentación en pareja en la pasarela",
        opts: [
          { t: "💃 Coreografía juntas", d: "Maquillaje + Carisma", go: () => res(check(["maquillaje", "carisma"], 55), 96, 35, "¡Family resemblance total!", "Os descoordináis.") },
          { t: "🫶 Dejar que se luzca", d: "Carisma", go: () => res(check(["carisma"], 48), 85, 45, "El jurado se enamora de tu invitada.", "Le pueden los nervios y se queda quieta.") },
        ],
      }),
    ];
    runSteps(el, { title: `Makeover: ${model.n}`, icon: "💄", steps }, (sc) => { S.lastLook = { cat: "makeover: el look de familia", best: "el look de familia", worst: "el look de familia" }; done(sc); });
  }

  function mxImpro(el, done) {
    if (IA.ready() && !mxImpro.classic) return aiOrClassic(el, "Improvisación", "📺", () => liveImpro(el, done), () => { mxImpro.classic = true; mxImpro(el, (sc) => { mxImpro.classic = false; done(sc); }); });
    const COMUNES = ["Se cae un decorado detrás de ti.", "La regidora te hace señas de que te quedan 10 segundos.", "Se va la luz del plató tres segundos."];
    const POR_SEC = {
      noticias: ["El teleprompter se apaga en mitad de la noticia.", "Te pasan una noticia de última hora escrita a boli."],
      entrevista: ["La invitada solo contesta con monosílabos.", "La invitada se levanta y se va del plató."],
      teletienda: ["El producto se rompe en directo.", "Entra una llamada en directo de una clienta muy enfadada."],
    };
    const prodC = nextProducto();
    const evFor = (s) => { if (!s.evs) { s.evs = shuffle([...(POR_SEC[s.sec] || []), ...COMUNES]).slice(0, 4); if (s.sec === "teletienda") logEv(`Teletienda: ${S.queen.name} vende ${prodC}`); } return s.evs; };
    const steps = [
      () => ({
        q: `📺 ¿Qué sección del programa conduces?`,
        opts: [
          { t: "🗞️ Noticias", d: "Seriedad con retranca", go: (s) => { s.sec = "noticias"; return {}; } },
          { t: "🎙️ Entrevista", d: "Todo depende del invitado", go: (s) => { s.sec = "entrevista"; return {}; } },
          { t: "🛒 Teletienda", d: `Vendes ${prodC}`, go: (s) => { s.sec = "teletienda"; return {}; } },
        ],
      }),
      ...[0, 1, 2, 3].map((n) => (s) => ({
        q: `🔴 En directo · imprevisto ${n + 1}/4`,
        sub: evFor(s)[n],
        opts: [
          { t: "😂 Aceptar el caos y hacer broma", d: "Comedia", go: () => { const c = check(["comedia"], 52); return res(c, 90, 35, "¡Lo conviertes en el mejor momento del programa!", "La broma no llega."); } },
          { t: "💎 Recomponerse con elegancia", d: "Carisma", go: () => { const c = check(["carisma"], 50); return res(c, 86, 40, "Profesional como una presentadora de toda la vida.", "Se te nota el apuro."); } },
        ],
      })),
    ];
    runSteps(el, { title: `${S.curTitulo || "Improvisación"} · en directo`, icon: "📺", steps }, (sc, st) => { if (sc >= 80) growAttr(sc > 90 ? "comedia" : "carisma"); done(sc); });
  }

  function mxPublicidad(el, done) {
    if (IA.ready() && !mxPublicidad.classic) return aiOrClassic(el, "Publicidad", "📺", () => livePublicidad(el, done), () => { mxPublicidad.classic = true; mxPublicidad(el, (sc) => { mxPublicidad.classic = false; done(sc); }); });
    const P = {
      perfume: { t: "💎 Perfume absurdamente caro", slogans: ["«Huele a dinero que no tienes»", "«Un perfume muy bueno»", "«Fragancia con notas de... cosas»"] },
      aparato: { t: "🔌 Aparato inútil", slogans: ["«Para lo que nunca te hizo falta»", "«Es un aparato que hace cosas»", "«Cómpralo, está bien»"] },
      bebida: { t: "🍹 Bebida extravagante", slogans: ["«Burbujas, purpurina y cero arrepentimiento»", "«Una bebida con sabor»", "«Se puede beber»"] },
    };
    const steps = [
      () => ({ q: "💡 Diseña tu producto", opts: Object.entries(P).map(([k, v]) => ({ t: v.t, go: (s) => { s.prod = k; return {}; } })) }),
      (st) => {
        const p = P[st.prod || "perfume"];
        return { q: "📣 Elige el eslogan", sub: "Se valora lo camp.", opts: shuffle([{ t: p.slogans[0], go: () => ({ pts: 95, msg: "¡Eso es camp puro!" }) }, { t: p.slogans[1], go: () => ({ pts: 45, msg: "Correcto. Aburrido." }) }, { t: p.slogans[2], go: () => ({ pts: 25, msg: "El director de marketing llora." }) }]) };
      },
      () => ({
        q: "🎬 Grabación del anuncio: toma 1",
        opts: [
          { t: "🧠 Decirlo de memoria", d: "Carisma", go: () => res(check(["carisma"], 55), 92, 30, "Ni una trabada. ¡Toma buena!", "Te trabas tres veces...") },
          { t: "📋 Leer el cartón", d: "Seguro", go: () => ({ pts: 60, msg: "Se nota que lees, pero sale." }) },
        ],
      }),
      () => ({
        q: "🎬 Toma 2: el remate",
        opts: [
          { t: "🌟 Guiño a cámara exagerado", d: "Camp · Carisma", go: () => res(check(["carisma"], 50), 94, 40, "¡Campísimo!", "Parece un tic.") },
          { t: "🤪 Improvisar un chiste final", d: "Comedia", go: () => res(check(["comedia"], 55), 96, 30, "¡El equipo técnico se ríe!", "Nadie lo entiende.") },
          { t: "🙂 Sonrisa y fuera", d: "Seguro", go: () => ({ pts: 55, msg: "Correcto." }) },
        ],
      }),
    ];
    runSteps(el, { title: "Publicidad: el anuncio falso", icon: "📺", steps }, (sc) => done(sc));
  }

  // Lalaparuza: torneo de lip syncs (sin taller)
  // Lalaparuza: cuadro de eliminatorias con todo el reparto. Cada duelo es un lip sync;
  // tú bailas los tuyos y el resto se resuelve en el escenario. La clasificación sale del cuadro.
  function mxLalaparuza(el, done) {
    const SONGS = [["balada", "🎹 Balada emocional", "carisma"], ["pop", "🎵 Pop up-tempo", "performance"], ["dance", "🔊 Dance / urbano", "performance"]];
    const profile = (q) => { const a = attrsOf(q); return a.carisma > a.performance ? "balada" : a.performance > a.carisma + 1 ? "dance" : "pop"; };
    const ME = S.queen;
    const all = shuffle([ME, ...S.rivals]);
    // Cuadro principal de P plazas (potencia de 2). Si sobran reinas, hay ronda previa: las que la ganan entran en el cuadro
    const P = 2 ** Math.floor(Math.log2(all.length));
    const R = Math.log2(P);
    const nPre = all.length - P;
    const pool = all.slice();
    // Plazas del cuadro que se deciden en la ronda previa, repartidas a lo largo del cuadro
    const preSlots = Array.from({ length: nPre }, (_, k) => Math.floor(((k + 0.5) * P) / nPre));
    const slots = Array.from({ length: P }, (_, i) => (preSlots.includes(i) ? null : pool.shift()));
    const pre = preSlots.map((slot) => ({ a: pool.shift(), b: pool.shift(), slot }));
    // rounds[0] = ronda previa (puede estar vacía); rounds[1..R] = cuadro principal
    const rounds = [pre];
    for (let r = 0; r < R; r++) rounds.push(Array.from({ length: P / 2 ** (r + 1) }, (_, i) => (r === 0 ? { a: slots[2 * i], b: slots[2 * i + 1] } : { a: null, b: null })));
    const reached = new Map(all.map((q) => [q, 0]));
    let champ = null;
    S.lalaRes = { ep: S.ep, done: false };
    const nm = (q) => (q === ME ? "Tú" : q.name);
    const rName = (r) => (r === 0 ? "Ronda previa" : r === R ? "Final" : r === R - 1 ? "Semifinal" : r === R - 2 ? "Cuartos" : "Octavos");
    const box = (m, r) => {
      if (!m || (!m.a && !m.b)) return `<div class="lz-m lz-r${Math.min(r, 3)} empty"><span>&nbsp;</span><span>&nbsp;</span></div>`;
      const row = (q) => (q ? `<span class="${q === ME ? "me" : ""} ${m.w ? (m.w === q ? "win" : "lose") : ""}"><i style="background-image:url('${photo(q)}')"></i>${esc(nm(q))}</span>` : `<span class="wait">por decidir</span>`);
      return `<div class="lz-m lz-r${Math.min(r, 3)} ${m.live ? "live" : ""}">${row(m.a)}${row(m.b)}</div>`;
    };
    const col = (r, ms, side) => `<div class="lz-col ${side}${r === 0 ? " pre" : ""}"><b class="lz-rn">${rName(r)}</b>${ms.map((m) => box(m, r)).join("")}</div>`;
    function bracketHTML() {
      const leftC = [], rightC = [];
      for (let r = 1; r < R; r++) {
        const ms = rounds[r], h = ms.length / 2;
        leftC.push(col(r, ms.slice(0, h), "l"));
        rightC.unshift(col(r, ms.slice(h), "r"));
      }
      // Ronda previa: cada duelo en el lado de la plaza que decide
      if (pre.length) {
        const pl = pre.filter((m) => m.slot < P / 2), pr = pre.filter((m) => m.slot >= P / 2);
        if (pl.length) leftC.unshift(col(0, pl, "l"));
        if (pr.length) rightC.push(col(0, pr, "r"));
      }
      const fin = rounds[R][0];
      const cols = [...leftC, `<div class="lz-col lz-center"><div class="lz-trophy">🏆<b>${champ ? esc(nm(champ)) : "Ganadora"}</b></div>${box(fin, R)}<b class="lz-rn">Final</b></div>`, ...rightC];
      return `<div class="lz-bracket" style="--cols:${cols.length}">${cols.join("")}</div>`;
    }
    // Siguiente duelo pendiente (por rondas)
    const nextMatch = () => { for (let r = 0; r <= R; r++) for (let i = 0; i < rounds[r].length; i++) { const m = rounds[r][i]; if (m.a && m.b && !m.w) return { r, i, m }; } return null; };
    function advance(r, i, w) {
      const m = rounds[r][i];
      m.w = w; m.live = false;
      const l = m.a === w ? m.b : m.a;
      reached.set(l, r);
      if (r === R) { champ = w; reached.set(w, R + 1); return; }
      if (r === 0) { const t = rounds[1][Math.floor(m.slot / 2)]; if (m.slot % 2 === 0) t.a = w; else t.b = w; return; }
      const nx = rounds[r + 1][Math.floor(i / 2)];
      if (i % 2 === 0) nx.a = w; else nx.b = w;
    }
    const meOut = () => rounds.some((rs) => rs.some((m) => m.w && m.w !== ME && (m.a === ME || m.b === ME)));
    function board(note = "") {
      const nx = nextMatch();
      if (nx) nx.m.live = true;
      const mine = nx && (nx.m.a === ME || nx.m.b === ME);
      el.innerHTML = `
        <div class="story-card lz-card">
          <p class="eyebrow">🏆 Lalaparuza · cuadro del torneo</p>
          <h3>${champ ? `${esc(champ === ME ? "¡Ganas la Lalaparuza!" : `${champ.name} gana la Lalaparuza`)}` : nx ? `${rName(nx.r)}: ${esc(nm(nx.m.a))} vs ${esc(nm(nx.m.b))}` : ""}</h3>
          ${note ? `<p class="twist-note">${note}</p>` : ""}
          <div class="lz-scroll">${bracketHTML()}</div>
          <div class="row"><button class="btn btn-primary" id="lz-go">${champ ? "Ver resultados" : mine ? "💃 Mi lip sync" : "Ver el duelo"}</button>${meOut() && !champ ? `<button class="btn btn-ghost" id="lz-skip">⏩ Resolver el resto</button>` : ""}</div>
        </div>`;
      el.querySelector("#lz-go").addEventListener("click", () => (champ ? finish() : play(nx)));
      const sk = el.querySelector("#lz-skip");
      if (sk) sk.addEventListener("click", () => { let x; while (!champ && (x = nextMatch())) advance(x.r, x.i, simLS(x.m.a, x.m.b)[0]); board(); });
    }
    function play({ r, i, m }) {
      if (m.a !== ME && m.b !== ME) {
        const [w, l] = simLS(m.a, m.b);
        advance(r, i, w);
        return board(`💃 ${esc(w.name)} gana a ${esc(l.name)}.`);
      }
      const rival = m.a === ME ? m.b : m.a;
      el.innerHTML = "";
      runSteps(el, {
        title: `Lalaparuza · ${rName(r)}`, icon: "🏆",
        steps: [() => ({
          q: `🥊 Te enfrentas a ${esc(rival.name)}`,
          sub: `Su punto fuerte parece: <b>${SONGS.find((x) => x[0] === profile(rival))[1]}</b>. Tus atributos: ${attrChips(["carisma", "performance"])}`,
          opts: SONGS.map(([k, t, at]) => ({ t, d: `Tira de ${ATTR_NAMES[at]}`, go: (st) => { st.song = t; st.bonus = (A(at) - 5) * 3 + (k === profile(rival) ? (A(at) >= 7 ? 12 : -8) : 4); return { msg: k === profile(rival) ? "Es justo su terreno... valiente." : "Buena elección: le sacas de su zona." }; } })),
        })],
        finish: () => 0,
      }, (_, st) => {
        el.innerHTML = "";
        runLipsync(el, rival, (won) => {
          advance(r, i, won ? ME : rival);
          board(won ? `💃 ¡Ganas a ${esc(rival.name)}! Sigues en el torneo.` : `💔 ${esc(rival.name)} te gana. Fuera del torneo... el resto se decide sin ti.`);
        }, st.song, st.bonus || 0);
      });
    }
    // Nota según hasta dónde llega cada una (la ganadora arriba, las que caen en la primera ronda abajo)
    function finish() {
      // reached: 0 = cae en la ronda previa, r = cae en esa ronda del cuadro, R+1 = campeona
      const base = (q) => (q === champ ? 95 : 42 + (reached.get(q) / R) * 46);
      const score = {};
      all.forEach((q) => { if (q !== ME) score[q.id] = Math.round(clamp(base(q) + clamp((rivalScore(q) - 55) * 0.08, -4, 4), 0, 99)); });
      score.me = Math.round(base(ME));
      S.lalaRes = { ep: S.ep, done: true, score, champ: champ === ME ? "me" : champ.id };
      logEv(`Lalaparuza: gana ${champ === ME ? S.queen.name : champ.name}; ${S.queen.name} llega a ${reached.get(ME) > R ? "la victoria" : rName(reached.get(ME)).toLowerCase()}`);
      done(score.me);
    }
    board(`Eliminatorias de lip sync con todo el reparto${nPre ? `: ${nPre === 1 ? "un duelo previo decide" : `${nPre} duelos previos deciden`} quién entra en el cuadro` : ""}. La que gane el torneo gana el reto; las que caigan pronto, al bottom.`);
  }

  // Solo para pruebas automatizadas: lanza un reto concreto
  const _test = (tipo, cb) => {
    if (cleanup) cleanup();
    body().innerHTML = `<div id="story-play"></div>`;
    RETOS[tipo].run($("#story-play"), (sc) => { cleanup = null; cb && cb(sc); window.__lastScore = sc; });
  };
  // Simulador de equilibrio (sin pantalla): juega N temporadas solo con rivales y cuenta wins, bottoms y coronas.
  // En la consola: DFTC_SIM("es1", 500)
  function simulate(seasonId, n = 300) {
    const season = seasonById(seasonId);
    if (!season) return null;
    const keep = S;
    const t = {};
    const row = (q) => (t[q.id] = t[q.id] || { reina: q.name, wins: 0, bottoms: 0, coronas: 0, final: 0, puestoMedio: 0 });
    for (let i = 0; i < n; i++) {
      const qs = season.cast.map(qById).filter(Boolean);
      S = { ...blankState({ id: "__sim" }, season, qs), rng: newSeed(), order: shuffle(ORDEN_RETOS) };
      let alive = qs.slice();
      while (alive.length > 1) {
        S.ep++;
        S.curTipo = S.order[(S.ep - 1) % S.order.length];
        S.curEpTipo = S.ep;
        const rows = alive.map((q) => ({ q, s: rivalScore(q) })).sort((a, b) => b.s - a.s);
        const k = rows.length;
        row(rows[0].q).wins++;
        if (k > 2) { row(rows[k - 1].q).bottoms++; row(rows[k - 2].q).bottoms++; }
        const [stay, go] = k > 2 ? simLS(rows[k - 2].q, rows[k - 1].q) : simLS(rows[0].q, rows[1].q);
        row(go).puestoMedio += alive.length;
        if (alive.length <= 4) row(go).final++;
        alive = alive.filter((q) => q !== go);
      }
      row(alive[0]).coronas++;
      row(alive[0]).final++;
      row(alive[0]).puestoMedio += 1;
    }
    S = keep;
    const out = Object.values(t).map((r) => ({ ...r, wins: +(r.wins / n).toFixed(2), bottoms: +(r.bottoms / n).toFixed(2), coronas: Math.round((r.coronas / n) * 100) + "%", final: Math.round((r.final / n) * 100) + "%", puestoMedio: +(r.puestoMedio / n).toFixed(1) }));
    out.sort((a, b) => a.puestoMedio - b.puestoMedio);
    return out;
  }
  window.DFTC_SIM = (sid = "es1", n = 300) => { const r = simulate(sid, n); if (r) console.table(r); return r; };
  return { start, abandon, menu, exitToMenu, openShopModal, openBoard: () => S && openBoard(), preview, _test, simulate, repetirEpisodio: repeatEpisode, lastEntryId: null };
})();
