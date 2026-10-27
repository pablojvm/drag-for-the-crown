// ---------------------------------------------------------------------------
// Modo historia: juegas la temporada como concursante.
// Cada episodio = un reto (minijuego) + resultados. Si quedas entre las dos
// peores, te toca lip sync (el juego de tacones contra una sola rival).
// Las rivales se van en el orden real de expulsión de la temporada.
// ---------------------------------------------------------------------------
// Referencias reales (dentro del modo historia se envuelven: azar con semilla, timers y llamadas a la IA ligadas a la partida)
const __REAL_IA = IA, __REAL_MATH = Math, __realSetTimeout = setTimeout;
const Story = (() => {
  let S = null; // estado de la partida
  // Cada partida es una "ronda": al salir sube el contador y lo que quedaba pendiente (timers, respuestas de la IA) se descarta
  let runId = 0;
  const live = (fn) => { const id = runId; return (...a) => { if (id === runId) return fn(...a); }; };
  const setTimeout = (fn, ms, ...a) => __realSetTimeout(live(fn), ms, ...a);
  // Atajos de teclado de los minijuegos: se registran aquí para poder quitarlos todos al salir
  const docKeys = new Set();
  const docOn = (type, fn, opt) => { docKeys.add([type, fn, opt]); document.addEventListener(type, fn, opt); };
  const docOff = (type, fn, opt) => { docKeys.forEach((e) => { if (e[0] === type && e[1] === fn) docKeys.delete(e); }); document.removeEventListener(type, fn, opt); };
  const dropKeys = () => { docKeys.forEach(([t, f, o]) => document.removeEventListener(t, f, o)); docKeys.clear(); };
  const NEVER = new Promise(() => {});
  const guardP = (p) => { const id = runId; return Promise.resolve(p).then((r) => (id === runId ? r : NEVER)); };
  // En la temporada en directo no se usa IA: todas juegan con los mismos textos y al mismo ritmo
  const IA = { ...__REAL_IA, ready: () => !(S && S.mp && !S.mpIA) && __REAL_IA.ready(), chat: (...a) => (S && S.mp && !S.mpIA ? Promise.resolve(null) : guardP(__REAL_IA.chat(...a))), image: (...a) => guardP(__REAL_IA.image(...a)) };
  // Azar con semilla guardada en la partida: recargar no repite tiradas y cualquier fallo se puede reproducir
  const Math = Object.create(__REAL_MATH);
  Math.random = () => {
    if (!S || typeof S.rng !== "number") return __REAL_MATH.random();
    const [v, next] = DFTC.nextRandom(S.rng);
    S.rng = next;
    return v;
  };
  const newSeed = DFTC.newSeed;
  // Máquina de estados del episodio (src/core/episode.ts): cada fase avisa al entrar y se comprueba el orden
  const flowGo = (f) => { if (S && S.ep > 0 && !S.meOut) DFTC.flow.go(S, f); return true; };
  const pick1 = (arr) => arr[Math.floor(Math.random() * arr.length)];
  const $ = (s) => document.querySelector(s);
  // Anti doble clic: los botones que hacen avanzar la partida solo cuentan una pulsación (salvo en minijuegos de ritmo)
  document.addEventListener("click", (e) => {
    const b = e.target.closest && e.target.closest("#screen-story button");
    if (!b || b.closest(".mg")) return;
    const t = performance.now();
    if (b.__dftcClick && t - b.__dftcClick < 600) { e.stopImmediatePropagation(); e.preventDefault(); return; }
    b.__dftcClick = t;
  }, true);
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
  const body = () => $("#story-body");
  const rnd = (a, b) => a + Math.random() * (b - a);
  const shuffle = (arr) => arr.map((v) => [Math.random(), v]).sort((a, b) => a[0] - b[0]).map((x) => x[1]);

  let cleanup = null; // quita listeners/timers del minijuego activo

  // Elige una variante evitando repetir las usadas recientemente en esta partida
  const recent = [];
  // Frases que hablan de coser solo cuando el reto de la semana es de costura
  const SEW_RX = /\bcos(e|er|ido|iendo|amos|es)\b|costur|dobladillo|enhebr|descos|patr[oó]n/i;
  const weekOk = (x) => {
    if (!S || typeof RETO_CAT === "undefined") return true;
    if (!SEW_RX.test(JSON.stringify(x))) return true;
    return S.curEpTipo === S.ep && RETO_CAT[S.curTipo] === "costura";
  };
  const pickFresh = (arr) => {
    const okArr = arr.filter(weekOk);
    if (okArr.length) arr = okArr;
    const fresh = arr.filter((x) => !recent.includes(x));
    const v = pick1(fresh.length ? fresh : arr);
    recent.push(v);
    if (recent.length > 60) recent.shift();
    return v;
  };
  const photo = (q) => lookOf(q, S && S.season.id).portrait || q.portrait;
  const sprite = (q) => lookOf(q, S && S.season.id).sprite || q.sprite;

  // ------------------------------ Retos ------------------------------------
  const CATEGORIAS = [
    "Rojo pasión", "Brilla, brilla", "Realeza", "Animal print", "Años 80", "Futurista",
    "Flores y más flores", "Blanco y negro", "Look de gala", "Folclore reinventado",
  ];
  const RETOS = {
    pasarela: {
      titulo: () => `Reto de pasarela: «${CATEGORIAS[Math.floor(Math.random() * CATEGORIAS.length)]}»`,
      desc: "Desfila y clava cada pose justo cuando el foco pase por la zona dorada.",
      ctrl: "Espacio, clic o toca el botón ¡POSE!",
      run: runPasarela,
    },
    baile: {
      titulo: () => "Reto de coreografía",
      desc: "Mira los pasos que marca la coreógrafa y repítelos en el mismo orden.",
      ctrl: "Flechas del teclado o toca las flechas",
      run: runBaile,
    },
    snatch: {
      titulo: () => "Snatch Game",
      desc: "Elige un personaje e interprétalo en el plató. Cada respuesta tiene que sonar a TU personaje, y rápido: el público premia el ritmo.",
      ctrl: "Clic o teclas 1, 2 y 3",
      run: runSnatchGame,
    },
  };
  RETOS.diseno = {
    titulo: () => "Reto de diseño: materiales inesperados",
    desc: "Recoge lentejuelas, telas, plumas y cristales para tu look. ¡Esquiva las tijeras rotas y la cinta aislante!",
    ctrl: "Flechas ← → o A/D, arrastra el ratón o toca los lados",
    run: runDiseno,
  };
  RETOS.rusical = {
    titulo: () => "El Rusical",
    desc: "Canta y baila a ritmo: pulsa cada nota justo cuando llegue a la línea.",
    ctrl: "Teclas D F J K (o flechas ← ↓ ↑ →) o toca los carriles",
    run: runRusical,
  };
  RETOS.maquillaje = {
    titulo: () => "Reto de maquillaje: copia el look",
    desc: "Memoriza la carta de maquillaje de la jueza y reprodúcela zona por zona.",
    ctrl: "Clic o toca los colores",
    run: runMaquillaje,
  };
  RETOS.lectura = {
    titulo: () => "La biblioteca está abierta",
    desc: "Es hora de leer. Elige la lectura más afilada (y con cariño) para cada compañera.",
    ctrl: "Clic o teclas 1, 2 y 3",
    run: (el, done) => runSnatch(el, done, LECTURAS, "📚 La biblioteca", "Lectura"),
  };
  RETOS.equipos = {
    titulo: () => "Reto por equipos: girl groups",
    desc: "Formáis dos equipos. Elige tu papel en el grupo y dalo todo en la actuación: si tu equipo gana, sumas un extra.",
    ctrl: "Eliges papel y luego pulsas las notas (D F J K o toca los carriles)",
    run: runEquipos,
  };
  RETOS.comedia = {
    titulo: () => "Stand-up: el monólogo",
    desc: "Sube al escenario y elige el remate más gracioso para cada parte de tu monólogo. Rápido, que el público no espera.",
    ctrl: "Clic o teclas 1, 2 y 3",
    run: (el, done) => runSnatch(el, done, COMEDIA, "🎙️ Tu monólogo", "Chiste"),
  };
  RETOS.roast = {
    titulo: () => "El roast de Supremme",
    desc: "Toca asar a las juezas y a tus compañeras. Elige el remate más afilado sin pasarte de la raya.",
    ctrl: "Clic o teclas 1, 2 y 3",
    run: (el, done) => runSnatch(el, done, ROAST, "🔥 El roast", "Remate"),
  };
  RETOS.actuacion = {
    titulo: () => "Reto de actuación por equipos: la película",
    desc: "Rodáis una película por equipos. Memoriza cada frase del guion y elige la palabra que falta cuando llegue tu toma.",
    ctrl: "Clic o teclas 1, 2 y 3",
    team: true,
    run: (el, done) => runGuion(el, done),
  };
  RETOS.ball = {
    titulo: () => "El Ball: tres looks, tres categorías",
    desc: "Desfila tres looks seguidos. Cada categoría tiene tres poses: clávalas en la zona dorada.",
    ctrl: "Espacio, clic o toca el botón ¡POSE!",
    run: (el, done) => runBall(el, done),
  };
  RETOS.makeover = {
    titulo: () => "El makeover: parecidas de familia",
    desc: "Transforma a tu pareja en tu hermana drag. Encuentra las parejas de accesorios a juego antes de que acabe el tiempo.",
    ctrl: "Clic o toca las cartas",
    run: (el, done) => runMemoria(el, done),
  };
  RETOS.fotos = {
    titulo: () => "Sesión de fotos",
    desc: "El fotógrafo dispara sin avisar. Toca tu foto en cuanto se ilumine... ¡y nunca la del paparazzi!",
    ctrl: "Clic o toca las casillas",
    run: (el, done) => runFotos(el, done),
  };
  RETOS.equipos.team = true;
  // Segunda Oportunidrag (T3): stand-up en parejas con las eliminadas
  RETOS.repescaStand = {
    titulo: () => "Segunda Oportunidrag: stand-up en parejas",
    desc: "Las eliminadas vuelven al taller. Cada reina en competición hace un monólogo a dúo con una de ellas. La eliminada de la pareja ganadora vuelve a la competición... y las tres peores parejas van a un lip sync a tres bandas: se salva una y se van dos.",
    ctrl: "Clic o teclas 1, 2 y 3",
    attrs: ["comedia", "carisma"],
    run: (el, done) => (IA.ready() ? liveStandPair(el, done) : RETOS.comedia.run(el, done)),
  };
  const MATERIALES_RAROS = {
    good: [["🥔", 12], ["🧸", 10], ["🪴", 10], ["🔩", 14], ["🎈", 10], ["📰", 8], ["🧽", 10]],
    bad: [["✂️", -15], ["🩹", -10], ["💧", -8]],
  };
  // Catálogo del reto semanal (como en el programa)
  RETOS.snatch.titulo = () => "Snatch Game";
  RETOS.snatch.desc = "La prueba reina de la temporada. Imita a una celebridad y responde con humor e improvisación a las preguntas de Supremme. Cada respuesta tiene que sonar a TU personaje.";
  RETOS.roast = {
    titulo: () => pick1(["El Roast: el rapapolvos a Supremme", "El Roast: rapapolvos al jurado", "El Roast: homenaje con cuchillo"]),
    desc: "Monólogo de comedia afilado. Elige el remate más punzante (sin pasarte de la raya) para Supremme, el jurado y tus compañeras.",
    ctrl: "Clic o teclas 1, 2 y 3",
    run: (el, done) => runSnatch(el, done, [...ROAST, ...COMEDIA], "🔥 El rapapolvos", "Remate", 6),
  };
  RETOS.ball = {
    titulo: () => "El Ball: el baile de trajes",
    desc: "Tres conceptos, tres looks. Dos los traes de casa y los desfilas; el tercero lo coses desde cero en el taller con materiales imposibles. Después, como siempre, la pasarela de la semana.",
    ctrl: "Pasarela: Espacio o ¡POSE! · Taller: flechas o arrastra",
    run: (el, done) => runBall(el, done),
  };
  RETOS.diseno = {
    titulo: () => pick1(["Reto de materiales poco convencionales", "Reto de reciclaje: alta costura con lo que hay", "Reto de diseño: la caja sorpresa"]),
    desc: "Nada de tela: bolsas de patatas, juguetes, macetas, tornillos... Recoge lo que te sirva para un look de alta costura y esquiva las tijeras rotas y las goteras.",
    ctrl: "Flechas ← → o A/D, arrastra el ratón o toca los lados",
    run: (el, done) => runDiseno(el, done, MATERIALES_RAROS, 25),
  };
  RETOS.rusical.titulo = () => pick1(["El Rusical: homenaje a la revista", "El Rusical: la movida", "El Rusical: una diva de la copla"]);
  RETOS.rusical.desc = "Un musical paródico completo. Canta (o haz playback) y baila a ritmo: pulsa cada nota justo cuando llegue a la línea.";
  RETOS.actuacion = {
    titulo: () => pick1(["Reto de interpretación: la telenovela", "Reto de interpretación: teletienda", "Reto de interpretación: parodia de serie"]),
    desc: "Grabáis una parodia por equipos. Memoriza el guion, clava tu frase en cada toma y exagera: aquí se premia lo camp.",
    ctrl: "Clic o teclas 1, 2 y 3",
    team: true,
    run: (el, done) => runGuion(el, done),
  };
  RETOS.equipos.titulo = () => "Girl Groups: el himno de la temporada";
  RETOS.equipos.desc = "Por bandas: escribís vuestra estrofa, grabáis en el estudio, aprendéis la coreografía y lo presentáis en directo. Elige tu papel y dalo todo.";
  RETOS.makeover = {
    titulo: () => pick1(["Makeover: tu madre drag", "Makeover: tu mejor amiga drag", "Makeover: tu hermana drag"]),
    desc: "Transforma a alguien que nunca ha hecho drag en tu hermana drag. Copia tu propia carta de maquillaje en su cara: el jurado busca el parecido de familia.",
    ctrl: "Clic o toca los colores",
    run: (el, done) => runMaquillaje(el, done),
  };
  RETOS.impro = {
    titulo: () => pick1(["Improvisación: el magazine matinal", "Improvisación: el pódcast en directo", "Improvisación: el programa del corazón"]),
    desc: "Presentas un programa en directo con tus compañeras. Pasa de todo: mantén el ritmo y elige la salida más graciosa sin cortar el directo.",
    ctrl: "Clic o teclas 1, 2 y 3",
    run: (el, done) => runSnatch(el, done, IMPRO, "📺 En directo", "Momento", 6),
  };
  const DC = "Clic o teclas 1, 2, 3 y 4";
  Object.assign(RETOS.snatch, { run: (el, d) => mxSnatch(el, d), attrs: ["comedia", "carisma"], ctrl: DC,
    desc: "Imita a un personaje en el plató de Supremme. Controla la barra de Foco: si pasa de 80 interrumpes, si baja de 30 no existes. Elige entre comedia absurda, réplica a una rival o respuesta segura, y roba la atención cuando otra falle." });
  Object.assign(RETOS.ball, { run: (el, d) => mxBall(el, d), attrs: ["estilo"], ctrl: DC, noRunway: true,
    titulo: () => (S && S.season ? currentBall().n : "El Ball"),
    desc: "" });
  // La descripción del Ball depende de cuál toque: tres categorías que cuentan una historia
  Object.defineProperty(RETOS.ball, "desc", { get: () => {
    const B = S && S.season ? currentBall() : null;
    return B ? `Tres pasarelas conectadas que tienen que contar una historia: ${B.c.map((x) => `«${x[0]}»`).join(", ")}. Las dos primeras las traes de casa; la tercera la coses en el taller: ${B.c[2][2].replace(/^Cosida en el taller /, "")}. No hay más pasarela esa semana: el Ball es la pasarela.` : "Tres pasarelas conectadas por un tema. La tercera se cose en el taller.";
  } });
  Object.assign(RETOS.diseno, { run: (el, d) => mxMateriales(el, d), attrs: ["estilo"], ctrl: DC,
    desc: "Reclama un lote de materiales (flexible, rígido o absurdo). Cuanto más raro, más Audacia... pero más difícil coserlo. Si fallas, el vestido se rompe en plena pasarela." });
  Object.assign(RETOS.rusical, { run: (el, d) => mxRusical(el, d), attrs: ["performance", "comedia"], ctrl: DC,
    desc: "Elige papel (principal, cómico o secundario) y decide en directo: paso limpio o truco arriesgado, y la intención de cada estrofa." });
  Object.assign(RETOS.equipos, { run: (el, d) => mxGirlGroups(el, d), attrs: ["performance", "carisma"], ctrl: DC,
    desc: "Por grupos: cada grupo forma su banda, escribe su estrofa, graba en el estudio y la presenta en directo. Se juzga por grupos: uno arriba, uno abajo y el resto a salvo." });
  Object.assign(RETOS.actuacion, { run: (el, d) => mxActing(el, d), attrs: ["carisma", "comedia"], ctrl: DC,
    desc: "Una película con todo el reparto: los Javis reparten los papeles, os leéis el guion y se rueda. Memoriza tu texto y dale el tono que pide cada escena." });
  Object.assign(RETOS.roast, { run: (el, d) => mxRoast(el, d), attrs: ["comedia"], ctrl: DC,
    desc: "Elige la diana (jurado, compañeras o tú misma) y la agresividad de cada remate. Demasiado suave no hace gracia; demasiado salvaje sin gracia congela al público." });
  Object.assign(RETOS.makeover, { run: (el, d) => mxMakeover(el, d), attrs: ["maquillaje", "carisma"], ctrl: DC,
    desc: "Analiza a tu modelo (comodidad y cuerpo), adapta maquillaje y ropa para lograr el parecido de familia sin opacarle, y presentaos en pareja." });
  Object.assign(RETOS.impro, { run: (el, d) => mxImpro(el, d), attrs: ["comedia", "carisma"], ctrl: DC,
    desc: "Por grupos: improvisáis una escena juntas, cada una con su personaje. Se juzga por grupos: uno arriba, uno abajo y el resto a salvo." });
  RETOS.publicidad = {
    titulo: () => pick1(["Publicidad: el anuncio falso", "Branding: vende lo invendible"]),
    desc: "Por parejas: os dan un producto absurdo, escribís el eslogan y el guion y grabáis el anuncio. Se juzga por parejas: una arriba, una abajo y el resto a salvo.",
    ctrl: DC, attrs: ["carisma", "comedia"], run: (el, d) => mxPublicidad(el, d),
  };
  RETOS.lalaparuza = {
    titulo: () => "Lalaparuza: el torneo de lip syncs",
    desc: "Sin taller: eliminatorias directas de lip sync. Elige canción según tu perfil y el de tu rival, y gestiona la energía en cada duelo.",
    ctrl: DC, attrs: ["performance", "carisma"], run: (el, d) => mxLalaparuza(el, d),
  };
  // Los Balls: tres pasarelas conectadas que cuentan una historia. Las dos primeras se traen de casa;
  // la tercera (la Eleganza) se cose en el taller con los materiales que da producción.
  const BALLS = [
    { id: "elementos", n: "El Baile de los Elementos", c: [["Fuego", "Edgy", "Llamas, calor y peligro"], ["Agua", "Glamour", "Fluidez, brillo y profundidad"], ["Eleganza de Tierra", "Folclórico", "Cosida en el taller con arpillera, corcho, hojas secas y piedras"]] },
    { id: "primarios", n: "El Baile de los Colores Primarios", c: [["Rojo", "Glamour", "Todo rojo, de pies a cabeza"], ["Azul", "Edgy", "Azul en todas sus versiones"], ["Eleganza Amarilla", "Camp", "Cosida en el taller con chubasqueros, cinta de balizar y patitos de goma"]] },
    { id: "suenos", n: "El Baile de los Sueños", c: [["Dulces sueños", "Camp", "La fantasía más dulce y exagerada"], ["Pesadilla", "Edgy", "Lo que te despierta de madrugada"], ["Eleganza del Despertar", "Camp", "Cosida en el taller con pijamas, sábanas y antifaces"]] },
    { id: "tiempo", n: "El Baile del Tiempo", c: [["Pasado", "Folclórico", "Una época que ya no existe"], ["Presente", "Glamour", "El ahora, con todo su brillo"], ["Eleganza del Futuro", "Futurista", "Cosida en el taller con papel de aluminio, cables y CDs"]] },
    { id: "mar", n: "El Baile del Mar", c: [["Sirena", "Glamour", "La reina de las profundidades"], ["Marinera", "Folclórico", "Puerto, rayas y salitre"], ["Eleganza de Lonja", "Camp", "Cosida en el taller con redes, boyas y cajas de pescado"]] },
    { id: "pecados", n: "El Baile de los Pecados", c: [["Lujuria", "Glamour", "Tentación sin disimulo"], ["Envidia", "Edgy", "Verde, venenosa y con razón"], ["Eleganza de la Soberbia", "Camp", "Cosida en el taller con espejos, oro falso y coronas de cartón"]] },
    { id: "noche", n: "El Baile de la Noche Española", c: [["Tablao", "Folclórico", "Volantes, lunares y duende"], ["Discoteca", "Futurista", "Neón, sudor y bajos"], ["Eleganza de la Resaca", "Camp", "Cosida en el taller con vasos de plástico, confeti y servilletas"]] },
    { id: "cielo", n: "El Baile Celestial", c: [["Sol", "Glamour", "Luz, oro y calor"], ["Luna", "Edgy", "Plata, misterio y noche"], ["Eleganza de las Estrellas", "Futurista", "Cosida en el taller con papel de purpurina, linternas y tul"]] },
  ];
  const ballById = (id) => BALLS.find((b) => b.id === id);
  // El Ball que toca: el siguiente del calendario (o uno al azar en partidas antiguas)
  function currentBall() {
    const cat = (S.ballPlan || [])[S.ballIdx || 0];
    return BALLS.find((b) => b.c[0][0] === cat) || BALLS[hashN(S.season.id + S.ep, "b") % BALLS.length];
  }
  // Retos por parejas o grupos: se juzga por grupos (uno arriba, uno abajo, el resto a salvo)
  RETOS.equipos.team = false;
  RETOS.equipos.groups = 3;
  RETOS.impro.groups = 3;
  RETOS.publicidad.groups = 2;
  RETOS.actuacion.team = false; // la película la ruedan todas juntas
  // Como en el programa: en Materiales y Makeover el look del reto es la pasarela; la Lalaparuza tampoco tiene pasarela aparte
  RETOS.diseno.noRunway = true;
  RETOS.makeover.noRunway = true;
  RETOS.lalaparuza.noRunway = true;
  const ORDEN_RETOS = ["snatch", "roast", "ball", "diseno", "rusical", "actuacion", "equipos", "makeover", "impro", "publicidad", "lalaparuza"];

  // Minirretos: dan ventaja para el reto de la semana
  const MINIRETOS = {
    lectura: {
      titulo: () => "Minirreto: Reading is Fundamental",
      desc: "Gafas de lectura puestas. La biblioteca está abierta: suelta el chascarrillo más afilado (y con cariño) a cada compañera.",
      ctrl: "Clic o teclas 1, 2 y 3",
      run: (el, done) => runSnatch(el, done, LECTURAS, "📚 La biblioteca", "Lectura", 4),
    },
    fotocall: {
      titulo: () => pick1(["Minirreto: fotocall extremo (con viento)", "Minirreto: fotocall extremo (bajo el agua)", "Minirreto: fotocall extremo (en el barro)"]),
      desc: "Ventiladores, cubos de agua y barro. Toca tu foto cuando dispare el fotógrafo... y esquiva los chorros sin perder el tipo.",
      ctrl: "Clic o toca las casillas",
      run: (el, done) => runFotos(el, done, pick1(["💦", "🌪️", "🟤"]), 16, "¡Chorro en toda la cara! 💦"),
    },
    pitcrew: {
      titulo: () => "Minirreto: el Pit Crew",
      desc: "Los chicos del Pit Crew esconden los accesorios. Encuentra las parejas antes de que acabe el tiempo (y sin distraerte).",
      ctrl: "Clic o toca las cartas",
      run: (el, done) => runMemoria(el, done, ["💪", "🕶️", "🧢", "🩳", "🏋️", "🥤"], 35, "Encuentra las parejas del Pit Crew"),
    },
  };
  Object.assign(MINIRETOS, {
    posado: { titulo: () => "Minirreto: posado exprés", desc: "Clava cada pose cuando el foco pase por la zona dorada.", ctrl: "Espacio, clic o ¡POSE!", run: (el, d) => runPasarela(el, d, 5, "Posado exprés") },
    coreo: { titulo: () => "Minirreto: coreografía relámpago", desc: "Repite los pasos de la coreógrafa en el mismo orden.", ctrl: "Flechas o toca las flechas", run: runBaile },
    caza: { titulo: () => "Minirreto: caza de materiales", desc: "Recoge lo bueno y esquiva las tijeras.", ctrl: "Flechas ← → o arrastra", run: (el, d) => runDiseno(el, d, null, 15) },
    karaoke: { titulo: () => "Minirreto: karaoke a ritmo", desc: "Pulsa cada nota justo cuando llegue a la línea.", ctrl: "D F J K o toca los carriles", run: runRusical },
    carta: { titulo: () => "Minirreto: copia la carta de maquillaje", desc: "Memoriza la carta y reprodúcela zona por zona.", ctrl: "Clic en los colores", run: runMaquillaje },
    guion: { titulo: () => "Minirreto: memoriza el guion", desc: "Recuerda la palabra que falta en cada frase.", ctrl: "Clic o teclas 1, 2 y 3", run: (el, d) => { const t = S.team; runGuion(el, (sc) => { S.team = t; d(sc); }); } },
    flash: { titulo: () => "Minirreto: ¡flash!", desc: "Pulsa en cuanto salte el flash (ni antes ni tarde).", ctrl: "Espacio o clic", run: (el, d) => runMiniFlash(el, "¡Flash!", d) },
    preguntas: { titulo: () => "Minirreto: preguntas rápidas", desc: "La respuesta más graciosa, y rápido.", ctrl: "Clic o teclas 1, 2 y 3", run: (el, d) => runSnatch(el, d, PREGUNTAS, "🎤 Supremme", "Pregunta", 4) },
    estilismo: { titulo: () => "Minirreto: estilismo exprés", desc: "Monta un look con peluca, look, zapatos y accesorio en 30 segundos... y desfílalo.", ctrl: "Clic o teclas 1, 2 y 3", run: (el, d) => runEstilismo(el, pick1(CATEGORIAS), d, 2) },
  });
  const ORDEN_MINI = Object.keys(MINIRETOS);

