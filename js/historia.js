// ---------------------------------------------------------------------------
// Modo historia: juegas la temporada como concursante.
// Cada episodio = un reto (minijuego) + resultados. Si quedas entre las dos
// peores, te toca lip sync (el juego de tacones contra una sola rival).
// Las rivales se van en el orden real de expulsión de la temporada.
// ---------------------------------------------------------------------------
const Story = (() => {
  const $ = (s) => document.querySelector(s);
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
  const body = () => $("#story-body");
  const rnd = (a, b) => a + Math.random() * (b - a);
  const shuffle = (arr) => arr.map((v) => [Math.random(), v]).sort((a, b) => a[0] - b[0]).map((x) => x[1]);

  let S = null; // estado de la partida
  let cleanup = null; // quita listeners/timers del minijuego activo

  // Elige una variante evitando repetir las usadas recientemente en esta partida
  const recent = [];
  const pickFresh = (arr) => {
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
  const MATERIALES_RAROS = {
    good: [["🥔", 12], ["🧸", 10], ["🪴", 10], ["🔩", 14], ["🎈", 10], ["📰", 8], ["🧽", 10]],
    bad: [["✂️", -15], ["🩹", -10], ["💧", -8]],
  };
  // Catálogo del reto semanal (como en el programa)
  RETOS.snatch.titulo = () => "Snatch Game";
  RETOS.snatch.desc = "La prueba reina de la temporada. Imita a un personaje de la cultura popular y responde con humor e improvisación a las preguntas de Supremme. Cada respuesta tiene que sonar a TU personaje.";
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
    titulo: () => pick1(["Makeover: tu madre drag", "Makeover: el equipo técnico", "Makeover: tu hermana drag"]),
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
    const rivals = shuffle(season.cast.filter((id) => id !== queen.id).map(qById).filter(Boolean));
    S = blankState(queen, season, rivals);
    // Roles detrás de cámaras: uno por reina (se descubren jugando)
    const roles = shuffle(ROLES_ORDEN);
    shuffle(rivals).forEach((q, i) => (S.roles[q.id] = i < roles.length ? roles[i] : pick1(["graciosa", "madre", "diva", "sensible", "novata", "estratega"])));
    // Orden de retos de esta temporada: empieza en pasarela y el Snatch Game llega pronto
    const rest = shuffle(ORDEN_RETOS.filter((t) => t !== "pasarela" && t !== "snatch"));
    rest.splice(1 + Math.floor(Math.random() * 3), 0, "snatch");
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
  const PLAIN = ["stars", "memories", "track", "epNames", "ep", "wins", "bottoms", "points", "lipsyncs", "rel", "streak", "record", "form", "hearts", "luck", "flags", "meOut", "roles", "known", "order", "missC", "groups", "myGroup", "pendingHearts", "runwayBonus", "phase", "attrGrowth", "miniOrder", "runwayPlan", "runwayIdx", "persona", "nemesis", "lookTags", "pacts", "schedule", "ballPlan", "ballIdx", "usedLooks", "log", "miniWin", "aggr", "cGroups"];
  function save() {
    const d = { queen: S.queen.id, season: S.season.id, rivals: S.rivals.map((q) => q.id), out: S.out.map((q) => q.id), date: new Date().toISOString(), v: 2 };
    PLAIN.forEach((k) => (d[k] = S[k]));
    store.set(SAVE_KEY, d);
  }
  const saved = () => {
    const d = store.get(SAVE_KEY, null);
    return d && d.v === 2 && qById(d.queen) && seasonById(d.season) ? d : null;
  };
  function resume() {
    const d = saved();
    if (!d) return;
    S = blankState(qById(d.queen), seasonById(d.season), d.rivals.map(qById).filter(Boolean));
    S.out = d.out.map(qById).filter(Boolean);
    PLAIN.forEach((k) => d[k] !== undefined && (S[k] = d[k]));
    UI.show("story");
    Sound.stopAll();
    if (S.ep === 0 && !S.flags.shopped && S.runwayPlan) return javisCall(nextEpisode);
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
          <p>Vas por el episodio ${d.phase && d.phase.ep === d.ep ? `${d.ep} (${d.phase.stage === "mini" ? "después del minirreto" : "en los resultados"})` : d.ep + 1}. Quedan ${d.rivals.length + (d.meOut ? 0 : 1)} reinas en la competición.</p>
          <p class="muted">${Math.round(d.points).toLocaleString("es-ES")} puntos · ${d.wins} retos ganados</p>
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
    if (cleanup) cleanup();
    cleanup = null;
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
        Toast.show(c.adv > 0 ? "✨ Te viene bien" : "😣 Te descentra", `${c.adv > 0 ? "+" : ""}${c.adv} en el próximo reto`);
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
      if (pk && !c.rel) persona(pk, pk === c.persona ? 1 : 0.5);
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
        const rep = r && (typeof r.respuesta === "string" ? r.respuesta : "") ? IA.clean(r.respuesta) : pick1(["Mmm... vale, cariño. Me lo apunto.", "¿Y eso a qué viene ahora?", "Ya hablaremos tú y yo."]);
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
      document.removeEventListener("keydown", onKey);
    }
    Music.play(ctx.tension ? "tension" : "taller");
    scene.addEventListener("click", next);
    document.addEventListener("keydown", onKey);
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
    let k = 0;
    S.groups.forEach((g) => { const size = 3 + (Math.random() < 0.5 ? 1 : 0); g.members = pool.slice(k, k + size).map((q) => q.id); k += size; });
    S.groups = S.groups.filter((g) => g.members.length >= 2);
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
        Toast.show("🦋 Vas por libre", "+3 en el próximo reto. Nadie te debe nada");
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
        Toast.show(`${mine.icon} Tu grupo te apoya`, "+3 en el próximo reto");
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
      if (eff === "calma") { S.advice += 2; Toast.show("🕊️ Pones paz", "+2 en el próximo reto"); }
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
  const skillOf = (q) => 48 + Object.values(q.stats).reduce((a, b) => a + b, 0) * 2.2;
  // Cada temporada de la franquicia es algo más dura que la anterior
  const seasonBoost = () => Math.min(10, ((S.season && S.season.index) || 0) * 2);
  const rivalScore = (q) => clamp(skillOf(q) + seasonBoost() + clamp(S.form[q.id] || 0, -8, 8) + traitMod(q) + (isNem(q) && !S.meOut ? Math.min(5, S.nemesis.heat * 0.6) : 0) + rnd(-22, 14), 5, 99);

  function header() {
    $("#story-season").textContent = `Modo historia · ${S.season.name} · ${seasonInfo().lema || S.season.franchise.name}`;
    let chip = "";
    const tw = twistOf();
    if (tw === "moneda") chip = "🪙 Bottom de 3 y moneda al aire";
    if (tw === "corazon") { const h = (S.hearts.me || 0) / 2; chip = `❤️ Tienes ${String(h).replace(".", ",")} ${h === 1 ? "corazón" : "corazones"}`; }
    if (tw === "suerte") chip = S.luck === undefined ? "🍀 Cajitas por abrir" : S.luck === "me" ? "🍀 ¡La tienes tú! (en secreto)" : S.luck ? "🍀 ¿Quién la tendrá?" : "🍀 Ya se ha usado";
    if (tw === "repesca") chip = S.flags.repesca ? "🔁 Segunda Oportunidrag: hecha" : "🔁 Segunda Oportunidrag: pendiente";
    if (tw === "allstars") chip = "💄 Decide la ganadora";
    if (tw === "winners") chip = `⭐ Nadie se va · tus estrellas: ${(S.stars || {}).me || 0}`;
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
  function mark(q, lab) {
    const k = keyOf(q);
    (S.track[k] = S.track[k] || {})[S.ep] = lab;
  }
  const TRACK_CLASS = (l) =>
    l === "WIN" || l === "WINNER" ? "t-win" : l === "TOP2" ? "t-top2" : l === "HIGH" ? "t-high" : l === "SAFE" ? "t-safe" : l === "LOW" ? "t-low" : /^BTM/.test(l) ? "t-btm" : l === "ELIM" ? "t-elim" : l === "RUNNER-UP" ? "t-runner" : l === "FINAL" ? "t-final" : l === "FINAL-MISSC" ? "t-miss" : l === "3ª" ? "t-third" : l === "MISSC" ? "t-miss" : "t-none";
  const LAB_ES = { WIN: "WIN", HIGH: "HIGH", SAFE: "SAFE", LOW: "LOW", BTM2: "BTM2", BTM3: "BTM3", ELIM: "ELIM", TOP2: "TOP2", WINNER: "GANADORA", "RUNNER-UP": "RUNNER-UP", FINAL: "RUN", "FINAL-MISSC": "MISS CONGENIALITY", "3ª": "3ª/4ª", MISSC: "MISS CONGENIALITY" };
  function trackHTML() {
    const eps = Object.keys(S.epNames).map(Number).sort((a, b) => a - b);
    const everyone = [S.queen, ...S.rivals, ...S.out];
    const count = (k, test) => eps.filter((e) => test((S.track[k] || {})[e] || "")).length;
    // Orden de las que siguen: cómo quedaron en el último episodio con resultados
    const ORDER = { WINNER: 0, WIN: 1, "RUNNER-UP": 2, TOP2: 3, FINAL: 3, HIGH: 4, "3ª": 5, SAFE: 6, LOW: 7, BTM2: 8, BTM3: 8, ELIM: 9 };
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
          w: count(k, (l) => l === "WIN" || l === "WINNER"), h: count(k, (l) => l === "HIGH" || l === "TOP2"),
          s: count(k, (l) => l === "SAFE"), lo: count(k, (l) => l === "LOW"), b: count(k, (l) => /^BTM/.test(l)),
        };
      })
      .sort((a, b) => a.out - b.out || (a.out ? b.last - a.last : 0) || lastRank(a.k) - lastRank(b.k) || b.w - a.w || b.h - a.h || b.s - a.s || a.lo - b.lo || a.b - b.b);
    const ppe = (k) => {
      const V = { WIN: 5, WINNER: 5, TOP2: 4.5, HIGH: 4, SAFE: 3, LOW: 2, BTM2: 1, BTM3: 1, ELIM: 0 };
      const v = eps.map((e) => V[(S.track[k] || {})[e]]).filter((x) => x !== undefined);
      return v.length ? (v.reduce((a, b) => a + b, 0) / v.length).toFixed(2) : "–";
    };
    return `
      <div class="track-wrap"><table class="track">
        <thead><tr><th>#</th><th>Reina</th>${eps.map((e) => `<th>Ep. ${e}<small>${esc(S.epNames[e])}</small></th>`).join("")}${twistOf() === "corazon" ? "<th>❤️</th>" : ""}<th>PPE</th></tr></thead>
        <tbody>${rows
          .map((r, i) => `<tr class="${r.q === S.queen ? "me" : ""} ${r.out ? "out" : ""}" style="--i:${i}"><td class="rk">${i + 1}º</td>
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
    $("#track-next").addEventListener("click", then);
  }

  // Puntos de control dentro del episodio: tras el minirreto y tras reto + pasarela
  function checkpoint(stage, extra = {}) {
    S.phase = { ep: S.ep, stage, advice: S.advice, runwayBonus: S.runwayBonus || 0, captains: S.captains ? S.captains.map((q) => keyOf(q)) : null, ...extra };
    save();
  }
  function resumeMid() {
    const ph = S.phase;
    const byKey = (k) => (k === "me" ? S.queen : qById(k));
    S.advice = ph.advice || 0;
    S.runwayBonus = ph.runwayBonus || 0;
    S.captains = ph.captains ? ph.captains.map(byKey).filter(Boolean) : null;
    header();
    if (ph.stage === "mini") {
      return Curtain.run(() => hub(() => announce()), `EPISODIO ${S.ep}`);
    }
    // Reto y pasarela ya hechos: seguimos en los resultados
    S.curTipo = ph.tipo;
    S.lastParts = ph.parts;
    S.lastBonus = ph.bonus;
    S.team = ph.team ? ph.team.map(byKey).filter(Boolean) : null;
    S.cGroups = ph.cGroups || null;
    Curtain.run(() => results(ph.score, ph.titulo), `EPISODIO ${S.ep}`);
  }

  // El episodio ha terminado: se guarda YA (antes de ver el track record o salir)
  function endEpisodeBtn() {
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
    S.ep++;
    S.advice = 0;
    S.helped = false;
    header();
    const tw = twistOf();
    if (tw === "repesca" && !S.flags.repesca && S.out.length >= 2 && S.rivals.length + 1 <= Math.ceil(S.season.cast.length / 2)) {
      return repesca(() => (isFinal() ? episodeFinal() : workroom()));
    }
    if (twistOf() === "winners" && S.ep > winnersWeeks()) return winnersFinal();
    if (isFinal()) return episodeFinal();
    workroom();
  }
  // Con 4 reinas: primero el reencuentro (Miss Simpatía) y luego la gran final
  function episodeFinal() {
    header();
    if (!S.flags.reunion) return reunion();
    finale();
  }

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
    const go = () => (ensureIdentities(), historyScene(() => memoryTalk(() => pactScene(() => nemesisScene(() => fameScene(() => rolePassives(() => (S.ep >= 2 && !S.flags.groups && S.rivals.length >= 5 ? formGroups : wscene)(() => directorScene(() => miniChallenge(() => hub(() => announce())))))))))));
    if (S.ep === 1 && twistOf() === "suerte" && S.luck === undefined) {
      return dialog(seasonInfo().intro, ctx, () => pickLuckBox(() => dialog(pickFresh(HISTORIA.tallerPrimerDia), ctxWith(pick1(S.rivals)), go)));
    }
    if (S.ep === 1) lines = [...seasonInfo().intro, ...pickFresh(HISTORIA.tallerPrimerDia)];
    else lines = [...pickFresh(HISTORIA.tallerHost), ...(S.out.length ? pickFresh(HISTORIA.tallerTrasExpulsion) : [])];
    scene("workroom", lines, ctx, go);
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
      Toast.show(`😈 ${pick1(VILLANA_AVISOS)}`, "-4 en el próximo reto. ¿Quién habrá sido?");
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
      Toast.show("🎯 Concentrada", "+5 en el próximo reto");
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
        Toast.show(`🎯 ${q.name} se desconcentra`, "Te lo recordará... en esta y en otras temporadas");
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
          Toast.show("💡 Buen consejo", "+6 en el próximo reto");
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
    let ord = (S.order || []).filter((t) => ORDEN_RETOS.includes(t));
    if (ord.length < ORDEN_RETOS.length) ord = ORDEN_RETOS; // partidas guardadas con el formato antiguo
    return ord[(S.ep - 1) % ord.length];
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
    setSet("werkroom");
    S.runwayBonus = 0;
    S.captains = null;
    const maxi = pickReto();
    const team = RETOS[maxi].team && S.rivals.length >= 3;
    if (!S.miniOrder || S.miniOrder.some((k) => !MINIRETOS[k])) S.miniOrder = shuffle(ORDEN_MINI);
    const tipo = S.miniOrder[(S.ep - 1) % S.miniOrder.length];
    const mini = MINIRETOS[tipo];
    const titulo = mini.titulo();
    const premio = team ? { id: "capitana", txt: "ser capitana y elegir equipo para el reto de esta semana" } : VENTAJAS[(S.ep + S.season.cast.length) % VENTAJAS.length];
    const javis = Math.random() < 0.35;
    const intro = javis ? [...pickFresh(JAVIS.mini), ["calvo", `Hoy: ${titulo.replace("Minirreto: ", "")}. La ganadora se lleva ${premio.txt}.`]] : [["host", pick1(["¡Reinas, empezamos con un minirreto!", "Antes del gran reto... ¡minirreto!", "Quitaos las batas, que hay minirreto."])], ["host", `Hoy: ${titulo.replace("Minirreto: ", "")}. La ganadora se lleva ${premio.txt}.`]];
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
  function announce() {
    const tipo = pickReto();
    const reto = RETOS[tipo];
    const titulo = reto.titulo();
    S.epNames[S.ep] = EP_SHORT[tipo] || "Reto";
    S.curTipo = tipo;
    S.curTitulo = titulo;
    S.team = null;
    S.cGroups = null;
    const go = () => challengeIntro(reto, titulo, tipo);
    const caps = () => {
      const c = S.captains || [S.queen, ...S.rivals].sort((a, b) => (b === S.queen ? 70 : skillOf(b)) - (a === S.queen ? 70 : skillOf(a))).slice(0, 2);
      draft(c[0], c[1], go);
    };
    const grouped = reto.groups && S.rivals.length + 1 >= reto.groups * 2;
    dialog(pickFresh(HISTORIA.anuncio), ctxWith(pick1(S.rivals), { reto: titulo }), () => (grouped ? formChallengeGroups(reto.groups, go) : reto.team && S.rivals.length >= 3 ? caps() : go()));
  }

  // Parejas o grupos para el reto. Si has ganado el minirreto, eliges tú a tus compañeras; si no, las reparte Supremme
  const GROUP_NAMES = ["Rosa", "Oro", "Turquesa", "Lila", "Coral", "Esmeralda"];
  const groupWord = (size) => (size === 2 ? "Pareja" : "Grupo");
  function formChallengeGroups(size, then) {
    const all = [S.queen, ...S.rivals];
    const finish = (mine) => {
      const rest = shuffle(all.filter((q) => !mine.includes(q)));
      const groups = [mine];
      while (rest.length) groups.push(rest.splice(0, size));
      const last = groups[groups.length - 1];
      if (groups.length > 1 && last.length === 1) { groups.pop(); groups[groups.length - 1].push(last[0]); }
      const order = shuffle(groups);
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
    if (S.miniWin !== "me") return finish([S.queen, ...shuffle(S.rivals).slice(0, size - 1)]);
    // Has ganado el minirreto: eliges tú
    const mine = [S.queen];
    const pickScreen = () => {
      if (mine.length >= size) return finish(mine);
      body().innerHTML = `
        <div class="story-card">
          <p class="eyebrow">Has ganado el minirreto</p>
          <h3>${size === 2 ? "Elige a tu pareja" : `Elige a tu grupo (${mine.length}/${size})`}</h3>
          <div class="hub-grid">${S.rivals.filter((q) => !mine.includes(q)).map((q, i) => `<button class="hub-q ${relOf(q) >= 2 ? "ally" : relOf(q) <= -2 ? "enemy" : ""}" style="--i:${i}" data-id="${q.id}"><i style="background-image:url('${photo(q)}')"></i><span>${esc(q.name)}</span><small>${relLabel(q)}</small>${roleChip(q)}</button>`).join("")}</div>
        </div>`;
      body().querySelectorAll("[data-id]").forEach((b) => b.addEventListener("click", () => { const q = qById(b.dataset.id); mine.push(q); changeRel(q, 1); pickScreen(); }));
    };
    pickScreen();
  }

  function challengeIntro(reto, titulo, tipo, onScore) {
    S.curPieces = null;
    S.ballCtx = null;
    [mxSnatch, mxActing, mxRusical, mxGirlGroups, mxMateriales, mxMakeover, mxImpro, mxPublicidad, mxRoast].forEach((f) => (f.classic = false));
    body().innerHTML = `
      <div class="story-card intro">
        <img class="story-queen" src="${sprite(S.queen)}" alt="">
        <div>
          <p class="eyebrow">${S.cGroups && S.team ? `${S.team.length === 1 ? "Tu pareja" : "Tu grupo"}: ${S.team.map((q) => esc(q.name)).join(" y ")}` : S.team ? `Equipo Rosa · ${S.team.length + 1} reinas` : `Quedan ${S.rivals.length + 1} reinas`}</p>
          <h3>${esc(titulo)}</h3>
          <p>${reto.desc}</p>
          ${S.rivals.length + 1 === 5 ? `<p class="twist-note">🎟️ Último reto antes de la final: la ganadora se lleva un pase directo a la gran final y no tendrá que pasar por la Súper Lalaparuza.</p>` : ""}
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
        const close = (walk) => {
          S.lastParts = { reto: Math.round(raw), pasarela: walk === null ? null : Math.round(walk) };
          const total = walk === null ? raw : raw * 0.65 + walk * 0.35;
          const final = Math.round(clamp(total + bonus, 0, 100));
          if (!onScore) checkpoint("scored", { score: final, titulo, tipo: S.curTipo, parts: S.lastParts, bonus, team: S.team ? S.team.map((q) => q.id) : null, cGroups: S.cGroups || null });
          (onScore || results)(final, titulo);
        };
        if (reto.noRunway || onScore) return close(null);
        runway(close);
      });
    });
  }
  // La pasarela de cada semana, con su categoría
  function runway(then) {
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
          <p>Prepara el look con lo que tienes en tu armario: look, peluca y accesorios o maquillaje. Elige lo que creas que mejor cuenta la temática: el jurado decidirá si encaja. El movimiento (👣) ayuda en el desfile.</p>
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
    setSet("panel");
    let sc = {};
    if (S.phase && S.phase.ep === S.ep && S.phase.sc) sc = { ...S.phase.sc };
    S.rivals.forEach((q) => { if (sc[q.id] == null) sc[q.id] = rivalScore(q); });
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
    let rows = [{ q: S.queen, s: myScore, me: true }, ...S.rivals.map((q) => ({ q, s: sc[q.id] }))].sort((a, b) => (winTeam ? (winTeam.has(b.q) ? 1 : 0) - (winTeam.has(a.q) ? 1 : 0) : 0) || b.s - a.s);
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
    const n = rows.length;
    // Con 6 reinas o menos ya no hay salvadas: todas reciben valoración
    const allCrit = n <= 6;
    const winner = rows[0];
    const tw = twistOf();
    // T6: bottom de tres (luego decide la moneda)
    let nb = tw === "moneda" && n >= 6 ? 3 : 2;
    if (groupOf) { const lastSize = rows.filter((r) => groupOf.get(r) === nGroups - 1).length; nb = Math.max(1, Math.min(nb, lastSize)); }
    let bottomRows = rows.slice(n - nb);
    const notes = [];
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
      rows.forEach((r) => {
        const k = keyOf(r.q);
        S.record[k] = (S.record[k] || 0) + (r === winner ? 3 : bottomRows.includes(r) ? 0 : 1);
        if (!r.me) S.form[r.q.id] = clamp(Math.round((S.form[r.q.id] || 0) * 0.8) + (r === winner ? 2 : bottomRows.includes(r) ? -1 : 0) + rnd(-1, 1), -8, 8);
      });
      S.points += myScore * 10 + (won ? 500 : 0);
      // Lo que delata el resultado (premios, crónica de la temporada) espera al veredicto
      const payout = () => {
        if (S.phase && S.phase.ep === S.ep && S.phase.paid) return;
        if (S.phase && S.phase.ep === S.ep) { S.phase.paid = 1; }
        logEv(`Gana el reto ${won ? S.queen.name : winner.q.name}; en el bottom: ${bottomRows.map((r) => r.q.name).join(" y ")}`);
        if (n === 5 && !asLike(tw)) { S.flags.pase = keyOf(winner.q); logEv(`${winner.me ? S.queen.name : winner.q.name} gana el pase directo a la gran final`); }
        if (won && !asLike(tw)) { growAttr(((RETOS[S.curTipo] || {}).attrs || [])[0]); earn(300, "Ganas el reto de la semana"); }
        else if (myPos <= 2 && !bottom) earn(80, "Entre las mejores de la semana");
        if (S.streak >= 3) Achievements.unlock("racha");
        traitPeek.forEach((f) => f());
        if (S.phase && S.phase.ep === S.ep) save();
      };
      if (won && !asLike(tw)) S.wins++;
      if (bottom) S.bottoms++;
      S.streak = won ? S.streak + 1 : 0;
      const b = S.lastBonus || 0;
      const bonusLine = b ? `<p class="${b > 0 ? "gold" : "muted"}">${b > 0 ? `💞 Consejos, aliadas y concentración: +${b}` : `🗡️ Tus enemigas te lo han puesto difícil: ${b}`}</p>` : "";
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
        : `<p>${judged.map(nm).join(", ")}... <b>sois las mejores y las peores del programa de hoy</b>.</p>${faces(judged)}`;
      header();
      Music.play("tension");
      body().innerHTML = `
        <div class="story-card call">
          <p class="eyebrow">${esc(titulo)} · la pasarela ha terminado</p>
          <h3>Supremme tiene algo que deciros...</h3>
          ${teamLine}${notes.map((t) => `<p class="twist-note">${t}</p>`).join("")}
          ${allCrit ? `<p>Quedáis ${n}: a partir de ahora ya no hay salvadas.</p>` + judgedTxt : safeFirst && safe.length ? safeTxt + judgedTxt : judgedTxt + (safe.length ? `<p>Las demás, <b>estáis a salvo</b>.</p>${faces(safe, "safe")}` : "")}
          <p class="call-me">${meSafe ? "✨ Estás a salvo esta semana." : "👀 Te toca escuchar al jurado."}</p>
          <button class="btn btn-primary" id="story-next">Continuar</button>
        </div>`;
      // Valoraciones solo a las mejores y peores
      const RIVAL_TOP = ["{n}, hoy has estado a otro nivel.", "{n}, me ha encantado. Así, sí.", "{n}, eso es lo que quiero ver cada semana."];
      const RIVAL_LOW = ["{n}, hoy no te he reconocido.", "{n}, te ha faltado de todo esta semana.", "{n}, esperaba muchísimo más de ti."];
      const othersCrit = () => {
        const others = shuffle(judged.filter((r) => !r.me)).slice(0, 3);
        return others.map((r) => [pick1(["judge", "host", "ambrossi", "calvo"]), pick1(["WIN", "HIGH", "TOP2"].includes(labOf.get(r)) ? RIVAL_TOP : RIVAL_LOW).replace("{n}", r.q.name)]);
      };
      // Cada reina que recibe valoración escucha su crítica: del reto y de la pasarela (sin notas ni posiciones)
      const rivalCrit = async () => {
        const others = shuffle(judged.filter((r) => !r.me));
        if (!others.length) return [];
        const lvl = (r) => { const l = labOf.get(r); return l === "WIN" || l === "TOP2" ? "muy buena" : l === "HIGH" ? "buena" : /^BTM/.test(l) ? "muy floja" : l === "LOW" ? "floja" : "correcta"; };
        const nivel = (r) => { const l = labOf.get(r); return ["WIN", "TOP2", "HIGH"].includes(l) ? "top" : /^BTM|LOW/.test(l) ? "low" : "mid"; };
        const runwayCat = (RETOS[S.curTipo] || {}).noRunway ? null : S.lastLook && S.lastLook.cat;
        let ai = null;
        if (IA.ready()) {
          aiWait("El jurado está deliberando...");
          ai = await IA.chat(
            `Escribes las críticas del jurado de Drag Race España a cada reina. Supremme de Luxe (teatral, cariñosa pero exigente) habla sobre todo del reto, Ana Locking (moda, técnica, directa) sobre todo de la pasarela y el look, aunque las dos pueden comentar las dos cosas. Los Javis (Javier Ambrossi y Javier Calvo) también son jueces y a veces dan su valoración. Son SOLO valoraciones: nunca digas posiciones ni resultados (ni ganadora, ni mejores, ni peores, ni bottom, ni lip sync, ni a salvo). ${aiSeason()}`,
            `Reto de esta semana: ${S.curTitulo || S.epNames[S.ep] || "reto"}. ${runwayCat ? `Pasarela: «${runwayCat}».` : "Esta semana no hay pasarela aparte: habla del look con el que presentó el reto."}
Reinas (valoración global de cada una): ${others.map((r) => `${r.q.name} (${lvl(r)})`).join("; ")}.
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
      const critStep = (then) => {
        const ctx = { ...ctxWith(pick1(S.rivals)), tension: false };
        rivalCrit().then((rc) => {
          if (meSafe) return dialog([["host", "Reinas salvadas, al backstage. Jurado, es vuestro turno."], ...rc.flat()], ctx, then);
          const lab = labOf.get(meRow) || "";
          const base = buildCritique(myScore, "none", /WIN|TOP2|HIGH/.test(lab) ? "top" : /BTM|LOW/.test(lab) ? "low" : "mid");
          const k = Math.floor(rc.length / 2);
          aiCritique(base, myScore, lab === "WIN" || lab === "TOP2" ? "muy buena" : lab === "HIGH" ? "buena" : /^BTM/.test(lab) ? "muy mala" : lab === "LOW" ? "floja" : "correcta").then((lines) => dialog([...rc.slice(0, k).flat(), ...lines, ...rc.slice(k).flat()], ctx, then));
        });
      };
      // Resultados en orden: ganadora, altas, bajas y bottom
      const verdict = (then) => {
        applyMarks();
        setSet("panel");
        const byLab = (f) => rows.filter((r) => f(labOf.get(r)));
        const wins = byLab((l) => l === "WIN" || l === "TOP2");
        const highs = byLab((l) => l === "HIGH");
        const lows = byLab((l) => l === "LOW");
        const safesC = allCrit ? byLab((l) => l === "SAFE") : [];
        const btms = rows.filter((r) => bottomRows.includes(r) || /^BTM/.test(labOf.get(r) || ""));
        const myLab = labOf.get(meRow);
        header();
        body().innerHTML = `
          <div class="story-card call">
            <p class="eyebrow">Las decisiones del jurado</p>
            <h3>${myLab === "TOP2" ? "¡Estás en el top 2! 💄" : myLab === "WIN" ? "¡Has ganado el reto! 👑" : /^BTM/.test(myLab) ? (tw === "winners" ? "Semana floja... pero sigues" : "Vas al lip sync...") : myLab === "SAFE" ? "Estabas a salvo" : "Te salvas esta semana"}</h3>
            <div class="verdict">
              <div class="v-row win" style="--i:0"><b>${tw === "winners" ? "⭐ Top 2: os jugáis una estrella" : tw === "allstars" ? "💄 Top 2: os jugáis el poder" : n === 5 ? "👑 Ganadora del reto y 🎟️ pase directo a la gran final" : "👑 Felicidrages, ganadora del reto"}</b>${faces(wins)}</div>
              ${highs.length ? `<div class="v-row high" style="--i:1"><b>✨ Buen trabajo, estáis a salvo</b>${faces(highs)}</div>` : ""}
              ${safesC.length ? `<div class="v-row high" style="--i:1"><b>🙂 Estáis a salvo</b>${faces(safesC)}</div>` : ""}
              ${lows.length ? `<div class="v-row low" style="--i:2"><b>😬 A salvo... por los pelos</b>${faces(lows)}</div>` : ""}
              <div class="v-row btm" style="--i:3"><b>${tw === "winners" ? "😬 Las más flojas de la semana (aquí nadie se va)" : `💔 Lo siento: sois el bottom ${btms.length}`}</b>${faces(btms)}</div>
            </div>
            <button class="btn btn-primary" id="story-next">Continuar</button>
          </div>`;
        $("#story-next").addEventListener("click", then);
      };
      const toLipSync = () =>
        luckMoment(() =>
          (tw === "moneda" && bottomRows.length === 3 ? coinFlip : (x, cb) => cb(x.bottomRows))({ winner, bottomRows }, (pair) =>
            elimination({ winner, bottomRows: pair, top2: rows.slice(0, 2) }),
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
    if (nq) add(nq, "nemesis", "⚔️ Tu némesis te busca");
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
  function elimination({ winner, bottomRows, top2 }) {
    setSet("stage");
    const meBottom = bottomRows.some((r) => r.me);
    const others = bottomRows.filter((r) => !r.me).map((r) => r.q);
    if (twistOf() === "allstars") return topLipSync(top2, (dec) => allStarsDecision(dec, bottomRows));
    if (twistOf() === "winners") return topLipSync(top2, (dec) => winnersStar(dec));
    if (meBottom) return lipSync(others[0], false);
    const [a, b] = others;
    // Doble sashay (muy raro)
    if (!S.flags.dsashay && S.rivals.length >= 7 && Math.random() < 0.08) {
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
  function topLipSync(top2, then) {
    const [a, b] = top2;
    const meTop = top2.find((r) => r.me);
    if (meTop) {
      const rival = top2.find((r) => !r.me).q;
      body().innerHTML = `
        <div class="story-card">
          <p class="eyebrow">💄 Lip sync por el poder</p>
          <h3>${esc(S.queen.name)} vs ${esc(rival.name)}</h3>
          <div class="vs"><img src="${photo(S.queen)}"><span>VS</span><img src="${photo(rival)}"></div>
          <p>${twistOf() === "winners" ? "La que gane se lleva una estrella ⭐. Las estrellas dan ventaja en la gran final." : "La que gane decide quién de las dos del bottom se va a casa."}</p>
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
              mark(S.queen, "WIN");
              if (S.rivals.length + 1 === 5 && twistOf() !== "winners") S.flags.pase = "me";
              S.wins++;
              earn(300, "Ganas el reto de la semana");
              return then({ q: S.queen, me: true });
            }
            Toast.show(`💄 ${rival.name} gana el lip sync`, "Ella decide");
            mark(rival, "WIN");
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
        <p><b>${esc(w.name)}</b> ${twistOf() === "winners" ? "gana el lip sync y se lleva una estrella ⭐." : "gana y tiene el pintalabios: decide quién se va."}</p>
        <button class="btn btn-primary" id="story-next">Continuar</button>
      </div>`;
    mark(w, "WIN");
    $("#story-next").addEventListener("click", () => then({ q: w }));
  }

  // All Stars: la ganadora del lip sync del top decide quién se va
  function allStarsDecision(winner, bottomRows) {
    const pair = bottomRows.map((r) => r.q);
    if (winner.me) {
      body().innerHTML = `
        <div class="story-card">
          <p class="eyebrow">💄 Has ganado: tú decides</p>
          <h3>¿A quién mandas a casa?</h3>
          <p>La que salves te lo agradecerá. La que se vaya... no lo olvidará.</p>
          <div class="hub-grid two">${pair
            .map((q, i) => `<button class="hub-q ${relOf(q) >= 2 ? "ally" : relOf(q) <= -2 ? "enemy" : ""}" style="--i:${i}" data-id="${q.id}"><i style="background-image:url('${photo(q)}')"></i><span>${esc(q.name)}</span><small>${relLabel(q)}</small></button>`)
            .join("")}</div>
          ${trackBtn()}
        </div>`;
      bindTrack();
      body().querySelectorAll("[data-id]").forEach((b) =>
        b.addEventListener("click", () => {
          const go = qById(b.dataset.id), stay = pair.find((x) => x !== go);
          changeRel(stay, 2);
          S.rivals.filter((r) => relOf(r) >= 1 && Math.random() < 0.4 && r !== stay).slice(0, 1).forEach((r) => changeRel(r, -1));
          const sOf = (q) => (bottomRows.find((r) => r.q === q) || {}).s || 0;
          const goWasWorst = sOf(go) <= sOf(stay);
          remember(stay, "salvada", !goWasWorst);
          nemEvent("vote", S.queen, go);
          nemEvent("save", S.queen, stay);
          eliminate(go);
          return dialog(pickFresh(goWasWorst ? MEMORIA.despedida.justa : MEMORIA.despedida.injusta), { ...ctxWith(go), q: { r1: go }, r1: go.name, tension: true }, () => showASResult(go, stay));
        }),
      );
      return;
      function showASResult(go, stay) {
          header();
          body().innerHTML = `
            <div class="story-card">
              <p class="eyebrow">El pintalabios ha hablado</p>
              <h3>${esc(go.name)}, sashay away</h3>
              <div class="vs"><img src="${photo(stay)}"><span>💄</span><img class="gone" src="${photo(go)}"></div>
              <p>Has salvado a <b>${esc(stay.name)}</b>.</p>
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
    } else go = skillOf(pair[0]) + groupAff(dec, pair[0]) * 6 + rnd(-10, 10) < skillOf(pair[1]) + groupAff(dec, pair[1]) * 6 + rnd(-10, 10) ? pair[0] : pair[1];
    const stay = pair.find((x) => x !== go);
    const lines = [["r1", meIn ? (go === S.queen ? "Lo siento, {yo}... Es una decisión muy difícil, pero he elegido a la otra." : "{yo}, esta semana me quedo contigo. No me falles.") : "He tomado mi decisión. No es nada personal."]];
    dialog(lines, { ...ctxWith(dec), tension: true }, () => {
      nemEvent("vote", dec, go);
      if (go === S.queen && S.pacts && S.pacts[dec.id]) { delete S.pacts[dec.id]; nemEvent("betray", dec, S.queen); }
      if (go === S.queen) {
        if (twistOf() === "repesca" && !S.flags.repesca) return goHomeRepesca(dec);
        return aftermath(dec, "La ganadora del reto ha decidido que te vas.");
      }
      if (meIn) changeRel(dec, 1);
      eliminate(go);
      header();
      body().innerHTML = `
        <div class="story-card">
          <p class="eyebrow">${esc(dec.name)} ha decidido</p>
          <h3>${esc(go.name)}, sashay away</h3>
          <div class="vs"><img src="${photo(stay)}"><span>💄</span><img class="gone" src="${photo(go)}"></div>
          <button class="btn btn-primary" id="story-next">Siguiente episodio</button>
        </div>`;
      endEpisodeBtn();
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
    if (S.track.me && S.track.me[S.ep]) mark(S.queen, "ELIM");
    S.phase = null;
    save();
    header();
    body().innerHTML = `
      <div class="story-card">
        <p class="eyebrow">Te vas a casa... de momento</p>
        <h3>Sashay away, ${esc(S.queen.name)}</h3>
        ${by ? `<div class="vs"><img class="gone" src="${photo(S.queen)}"><span>💔</span><img src="${photo(by)}"></div>` : ""}
        <p>Pero esta temporada hay <b>Segunda Oportunidrag</b>. Mientras esperas en casa, la competición sigue: verás cómo cae cada reina semana a semana.</p>
        <button class="btn btn-primary" id="story-next">Ver cómo sigue</button>
      </div>`;
    $("#story-next").addEventListener("click", repescaStep);
  }
  // Semanas sin ti hasta la mitad de la temporada, y entonces llega la Segunda Oportunidrag
  function repescaStep() {
    const pending = () => S.rivals.length > Math.ceil(S.season.cast.length / 2) - 1 && S.rivals.length > 3;
    if (!pending()) {
      S.flags.waitRepesca = 0;
      save();
      return Curtain.run(() => repesca(() => nextEpisode()), "SEGUNDA OPORTUNIDRAG");
    }
    const r = simWeek();
    S.phase = null;
    save();
    const face = (q) => `<i class="tn-face" style="background-image:url('${photo(q)}')"></i>`;
    showTrack(repescaStep, pending() ? "Siguiente semana" : "¡Llega la Segunda Oportunidrag!",
      `${face(r.win)} 👑 Gana <b>${esc(r.win.name)}</b> · ${face(r.go)} 💔 <b>${esc(r.go.name)}</b> pierde el lip sync contra <b>${esc(r.stay.name)}</b> y se va a casa.`);
  }
  function repesca(then) {
    S.flags.repesca = true;
    header();
    const pool = S.out.slice();
    if (S.meOut) {
      const rival = pick1(pool);
      return dialog(
        [["host", "¡Reinas eliminadas, bienvenidas a la Segunda Oportunidrag! Solo una vuelve a la competición."], ["r1", "{yo}, no te lo voy a poner fácil."]],
        { ...ctxWith(rival), tension: true },
        () =>
          lipSync(rival, false, () => {
            S.meOut = false;
            Toast.show("🔁 ¡Has vuelto!", "Segunda oportunidad");
            header();
            body().innerHTML = `
              <div class="story-card">
                <p class="eyebrow">🔁 Segunda Oportunidrag</p>
                <h3>¡${esc(S.queen.name)} vuelve a la competición!</h3>
                <p>Las demás no se lo esperaban. Ahora vas con todo.</p>
                <button class="btn btn-primary" id="story-next">Volver al taller</button>
              </div>`;
            endEpisodeBtn();
          }),
      );
    }
    const back = pool.sort((a, b) => skillOf(b) + rnd(-12, 12) - skillOf(a))[0];
    S.out = S.out.filter((q) => q !== back);
    S.rivals.push(back);
    header();
    dialog(
      [["host", "Reinas, antes de empezar... ¡ha llegado la Segunda Oportunidrag!"], ["host", "Las eliminadas se han batido en un lip sync y una vuelve a la competición."], ...HISTORIA.regresoVuelve],
      ctxWith(back),
      then,
      [
        { txt: "¡Bienvenida de nuevo, {r1}!", rel: { r1: 1 }, reply: ["r1", "¡Gracias, reina! Esta vez voy a por todas."] },
        { txt: "Pues ya somos una más para echar...", rel: { r1: -1 }, bonus: 80, reply: ["r1", "Tranquila, que empiezo por ti."] },
      ],
    );
  }

  // ------------------------- Capitanas y equipos ---------------------------
  // Minirreto previo: las dos mejores son capitanas y eligen equipo por turnos
  function captains(then) {
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
    const v = (q) => skillOf(q) + (S.record[keyOf(q)] || 0) * 2 + (S.form[q.id] || 0) + (traitsOf(q).fort === "lipsync" ? 8 : 0) - (traitsOf(q).deb === "lsFlojo" ? 8 : 0) + Nem.power(q.id) * 0.5;
    return Math.random() < clamp(0.5 + (v(a) - v(b)) / 40, 0.2, 0.8) ? [a, b] : [b, a];
  };
  function playLS(rival, o, cb) {
    body().innerHTML = `
      <div class="story-card">
        <p class="eyebrow">${o.eyebrow}</p>
        <h3>${esc(S.queen.name)} vs ${esc(rival.name)}</h3>
        <div class="vs"><img src="${photo(S.queen)}"><span>VS</span><img src="${photo(rival)}"></div>
        <p>${o.text}</p>
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
  function winnersWeeks() { return clamp(S.season.cast.length - 1, 4, 8); }
  function winnersStar(dec) {
    S.stars = S.stars || {};
    const k = dec.me ? "me" : dec.q.id;
    S.stars[k] = (S.stars[k] || 0) + 1;
    if (dec.me) { S.wins++; Toast.show("⭐ ¡Una estrella para ti!", "Te dará ventaja en la gran final"); }
    logEv(`${dec.me ? S.queen.name : dec.q.name} gana una estrella`);
    header();
    body().innerHTML = `
      <div class="story-card">
        <p class="eyebrow">⭐ All Winners</p>
        <h3>${dec.me ? "¡Te llevas la estrella!" : `Estrella para ${esc(dec.q.name)}`}</h3>
        <p>Esta semana nadie se va a casa. Todas seguís en la competición.</p>
        ${standingsHTML([S.queen, ...S.rivals], new Map([S.queen, ...S.rivals].map((q) => [q, (S.stars || {})[keyOf(q)] || 0])), "Estrellas").replace(/👑/g, "⭐")}
        <button class="btn btn-primary" id="story-next">Siguiente episodio</button>
      </div>`;
    endEpisodeBtn();
  }
  function winnersFinal() {
    setSet("stage");
    S.epNames[S.ep] = "Final";
    const all = [S.queen, ...S.rivals];
    const starsOf = (q) => (S.stars || {})[keyOf(q)] || 0;
    // Cabezas de serie por estrellas (la que más tiene descansa si sois impares)
    let alive = shuffle(all).sort((a, b) => starsOf(b) - starsOf(a));
    let round = 1, duels = [], di = 0, bye = null, next = [];
    const tbl = () => standingsHTML(all.filter((q) => alive.includes(q)), new Map(all.map((q) => [q, starsOf(q)])), "Siguen en pie · ⭐ estrellas").replace(/👑/g, "⭐");
    function setupRound() {
      bye = alive.length % 2 ? alive[0] : null;
      const pool = alive.filter((q) => q !== bye);
      duels = [];
      for (let i = 0; i < pool.length / 2; i++) duels.push([pool[i], pool[pool.length - 1 - i]]);
      di = 0;
      next = bye ? [bye] : [];
    }
    const roundName = () => (alive.length === 2 ? "Lip sync por la corona" : `Ronda ${round}`);
    function board(note = "") {
      header();
      const d = duels[di];
      body().innerHTML = `
        <div class="story-card">
          <p class="eyebrow">👑 Gran final All Winners · ${roundName()}</p>
          <h3>${d ? `${esc(nmQ(d[0]))} vs ${esc(nmQ(d[1]))}` : "Ronda terminada"}</h3>
          ${note ? `<p class="twist-note">${note}</p>` : ""}
          ${bye && round === 1 && di === 0 ? `<p class="muted">⭐ ${esc(nmQ(bye))} tiene más estrellas y descansa esta ronda.</p>` : ""}
          ${tbl()}
          <button class="btn btn-primary" id="story-next">${d ? (d.includes(S.queen) ? "💃 Mi lip sync" : "Ver el duelo") : "Siguiente ronda"}</button>
        </div>`;
      $("#story-next").addEventListener("click", () => (d ? duel() : endRound()));
    }
    let lastRunner = null;
    function lose(q) {
      if (alive.length === 2) lastRunner = q;
      alive = alive.filter((x) => x !== q);
    }
    function duel() {
      const [a, b] = duels[di++];
      if (a === S.queen || b === S.queen) {
        const rv = a === S.queen ? b : a;
        S.lsBonus = clamp(starsOf(S.queen) * 3 - starsOf(rv) * 2, -6, 12);
        return playLS(rv, { eyebrow: `Gran final · ${roundName()}`, text: "La que pierda se queda fuera de la corona.", curtain: alive.length === 2 ? "LIP SYNC POR LA CORONA" : "GRAN FINAL" }, (won) => {
          const w = won ? S.queen : rv, l = won ? rv : S.queen;
          next.push(w);
          if (!won) return meOut(w, l);
          lose(l);
          board(`💃 Ganas a ${esc(rv.name)}.`);
        });
      }
      const [w, l] = simLS(a, b);
      next.push(w);
      lose(l);
      board(`${esc(w.name)} gana a ${esc(l.name)}.`);
    }
    function endRound() {
      alive = shuffle(next).sort((a, b) => starsOf(b) - starsOf(a));
      round++;
      if (alive.length === 1) return finish(alive[0]);
      setupRound();
      board();
    }
    // Si caes, el resto de la final se resuelve sola
    function meOut(by, me) {
      const place = alive.length;
      lose(me);
      let rest = [...next, ...duels.slice(di).map(([a, b]) => simLS(a, b)[0])];
      let runner = by;
      while (rest.length > 1) {
        const r2 = [];
        rest = shuffle(rest);
        if (rest.length % 2) r2.push(rest.pop());
        for (let i = 0; i < rest.length; i += 2) { const [w, l] = simLS(rest[i], rest[i + 1]); r2.push(w); runner = l; }
        rest = r2;
      }
      const champ = rest[0] || by;
      all.filter((q) => q !== S.queen && q !== champ && q !== runner).forEach((q) => { mark(q, "ELIM"); eliminate(q); });
      mark(champ, "WINNER");
      if (runner && runner !== champ) mark(runner, "RUNNER-UP");
      if (place === 2) return theEnd(false, champ, true, `${champ.name} te gana la corona de All Winners.`, 2);
      mark(S.queen, "ELIM");
      return theEnd(false, champ, false, `${by.name} te gana en la final. La corona se la lleva ${champ.name}.`, place);
    }
    // Solo se llega aquí si ganas tú (si caes, meOut cierra la final)
    function finish(champ) {
      all.filter((q) => q !== champ && q !== lastRunner).forEach((q) => mark(q, "ELIM"));
      return theEnd(champ === S.queen, lastRunner, true);
    }
    dialog([["host", "Reinas, llegamos a la gran final de All Winners. Aquí estáis todas: nadie se fue a casa."], ["host", "Pero solo una se lleva la corona. Lip sync contra lip sync: la que pierda, se queda fuera."], ["judge", "Las estrellas que habéis ganado cuentan: la que más tenga, más fácil lo tiene."]], ctxWith(S.rivals[0]), () => { setupRound(); board(); });
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
  function aftermath(by, reason = "") {
    S.meOut = true;
    S.flags.aftermath = 1;
    S.flags.myPlace = S.rivals.length + 1;
    S.flags.outEp = S.ep;
    if (S.track.me && S.track.me[S.ep]) mark(S.queen, "ELIM");
    S.phase = null;
    save();
    Music.stop();
    header();
    body().innerHTML = `
      <div class="story-card">
        <p class="eyebrow">Sashay away</p>
        <h3>${esc(S.queen.name)}, te vas a casa... puesto ${S.flags.myPlace}º</h3>
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
      const crowns = store.get("dftc-story-wins", []);
      if (FRANCHISES.find((f) => f.id === "es").seasons.filter((x) => !x.enEmision).every((x) => crowns.includes(x.id))) Achievements.unlock("espana");
    } else Music.stop();
    const earned = Wallet.add(S.points / 40);
    const prize = won ? 2500 : place === 2 ? 1000 : place <= 4 ? 500 : 150;
    // La corona queda en la memoria: la ganadora vuelve más fuerte en las siguientes temporadas
    const fe = Object.keys(S.epNames).map(Number).sort((a, b) => b - a)[0];
    [S.queen, ...S.rivals, ...S.out].forEach((q) => {
      const l = (S.track[keyOf(q)] || {})[fe];
      if (l === "WINNER") { Nem.addPower(q.id, 3); const d = Nem.get(); d.q[q.id] = { ...(d.q[q.id] || {}), titles: [...((d.q[q.id] || {}).titles || []), S.season.name] }; Nem.put(d); }
      if (l === "RUNNER-UP" || l === "3ª") Nem.addPower(q.id, 1);
    });
    Closet.add(prize);
    body().innerHTML = `
      <div class="story-card end ${won ? "won" : ""}">
        <img class="story-queen" src="${sprite(S.queen)}" alt="">
        <div>
          <p class="eyebrow">${esc(S.season.name)} · resultado final</p>
          <h3>${won ? `¡${esc(S.queen.name)}, eres la ganadora! 👑` : `Sashay away... puesto ${place}º`}</h3>
          <p>${won ? "La corona es tuya. Felicidrages." : reason || `${esc(rival.name)} te ha ganado el lip sync.`}</p>
          <p class="story-pts">${entry.score.toLocaleString("es-ES")} puntos · +${earned} ✨ · 💶 +${prize.toLocaleString("es-ES")} € para tu armario</p>
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
    $("#story-menu").addEventListener("click", () => { abandon(); UI.show("menu"); });
    $("#story-again").addEventListener("click", () => start(q, s));
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

  // ------------------------- Minijuego: pasarela ---------------------------
  function runPasarela(el, done, POSES = 8, label = "") {
    el.innerHTML = `
      <div class="mg pasarela">
        <p class="mg-info">${label ? `${esc(label)} · ` : ""}Pose <b id="pz-n">1</b>/${POSES} · <span id="pz-msg">¡Prepárate!</span></p>
        <img class="mg-queen" id="pz-queen" src="${sprite(S.queen)}" alt="">
        <div class="pz-track"><div class="pz-zone" id="pz-zone"></div><div class="pz-cursor" id="pz-cursor"></div></div>
        <button class="btn btn-primary big" id="pz-btn">¡POSE!</button>
      </div>`;
    const W = 900, zone = $("#pz-zone"), cursor = $("#pz-cursor");
    let pose = 0, total = 0, x = 0, dir = 1, speed = 520, zw = 150, zx = 0, raf = 0, last = performance.now(), locked = false;
    function newZone() {
      zw = 150 - pose * 11;
      zx = rnd(40, W - zw - 40);
      zone.style.left = zx + "px";
      zone.style.width = zw + "px";
      speed = 520 + pose * 70;
    }
    function tick(t) {
      const dt = Math.min(0.05, (t - last) / 1000);
      last = t;
      if (!locked) {
        x += dir * speed * dt;
        if (x < 0) (x = 0), (dir = 1);
        if (x > W) (x = W), (dir = -1);
        cursor.style.left = x + "px";
      }
      raf = requestAnimationFrame(tick);
    }
    function hit() {
      if (locked) return;
      locked = true;
      const center = zx + zw / 2;
      const d = Math.abs(x - center);
      let pts = 0, msg = "Fallo...";
      if (x >= zx && x <= zx + zw) {
        pts = Math.round(100 - (d / (zw / 2)) * 40);
        msg = pts > 90 ? "¡FIERCE! ✨" : pts > 75 ? "¡Bien!" : "Justito";
        Sound.powerup && Sound.powerup();
        const q = $("#pz-queen");
        q.classList.remove("flash");
        void q.offsetWidth;
        q.classList.add("flash");
      } else Sound.impact();
      total += pts;
      $("#pz-msg").textContent = `${msg} (+${pts})`;
      pose++;
      setTimeout(() => {
        if (pose >= POSES) return end();
        $("#pz-n").textContent = pose + 1;
        newZone();
        locked = false;
      }, 550);
    }
    const onKey = (e) => {
      if (e.code === "Space" || e.code === "Enter") {
        e.preventDefault();
        hit();
      }
    };
    function end() {
      stop();
      done(total / POSES);
    }
    function stop() {
      cancelAnimationFrame(raf);
      document.removeEventListener("keydown", onKey);
    }
    $("#pz-btn").addEventListener("click", hit);
    document.addEventListener("keydown", onKey);
    cleanup = stop;
    newZone();
    raf = requestAnimationFrame(tick);
  }

  // ------------------------- Minijuego: coreografía ------------------------
  function runBaile(el, done) {
    const DIRS = ["left", "up", "down", "right"];
    const ICON = { left: "◀", up: "▲", down: "▼", right: "▶" };
    const KEYS = { ArrowLeft: "left", ArrowUp: "up", ArrowDown: "down", ArrowRight: "right", KeyA: "left", KeyW: "up", KeyS: "down", KeyD: "right" };
    const LENS = [3, 4, 5, 6, 7];
    el.innerHTML = `
      <div class="mg baile">
        <p class="mg-info">Ronda <b id="bl-n">1</b>/${LENS.length} · <span id="bl-msg">Mira bien...</span></p>
        <div class="bl-pads">${DIRS.map((d) => `<button class="bl-pad" data-d="${d}">${ICON[d]}</button>`).join("")}</div>
        <div class="bl-steps" id="bl-steps"></div>
        <img class="mg-queen" id="bl-queen" src="${sprite(S.queen)}" alt="">
      </div>`;
    const pads = Object.fromEntries([...el.querySelectorAll(".bl-pad")].map((b) => [b.dataset.d, b]));
    let round = 0, seq = [], pos = 0, listening = false, correct = 0, totalSteps = LENS.reduce((a, b) => a + b, 0);
    const timers = [];
    const later = (fn, ms) => timers.push(setTimeout(fn, ms));
    function light(d, ms = 380) {
      pads[d].classList.add("on");
      Sound.countdown(false);
      later(() => pads[d].classList.remove("on"), ms);
    }
    function play() {
      listening = false;
      pos = 0;
      seq = Array.from({ length: LENS[round] }, () => DIRS[Math.floor(Math.random() * 4)]);
      $("#bl-n").textContent = round + 1;
      $("#bl-msg").textContent = "Mira bien...";
      $("#bl-steps").innerHTML = seq.map(() => `<i></i>`).join("");
      const gap = Math.max(420, 640 - round * 50);
      seq.forEach((d, i) => later(() => light(d, gap * 0.7), 600 + i * gap));
      later(() => {
        listening = true;
        $("#bl-msg").textContent = "¡Tu turno!";
      }, 600 + seq.length * gap);
    }
    function input(d) {
      if (!listening) return;
      light(d, 200);
      const steps = $("#bl-steps").children;
      if (d === seq[pos]) {
        steps[pos].className = "ok";
        correct++;
        const bq = $("#bl-queen");
        bq.classList.remove("bounce");
        void bq.offsetWidth;
        bq.classList.add("bounce");
        pos++;
        if (pos >= seq.length) {
          listening = false;
          $("#bl-msg").textContent = "¡Perfecto! 💃";
          later(next, 800);
        }
      } else {
        steps[pos].className = "ko";
        listening = false;
        Sound.impact();
        $("#bl-msg").textContent = "¡Te has perdido!";
        later(next, 900);
      }
    }
    function next() {
      round++;
      if (round >= LENS.length) {
        stop();
        return done((correct / totalSteps) * 100);
      }
      play();
    }
    const onKey = (e) => {
      const d = KEYS[e.code];
      if (d) {
        e.preventDefault();
        if (!e.repeat) input(d);
      }
    };
    function stop() {
      timers.forEach(clearTimeout);
      document.removeEventListener("keydown", onKey);
    }
    Object.entries(pads).forEach(([d, b]) => b.addEventListener("click", () => input(d)));
    document.addEventListener("keydown", onKey);
    cleanup = stop;
    play();
  }

  // ------------------ Minijuego: Snatch Game (con personaje) ----------------
  function runSnatchGame(el, done) {
    const N = 6;
    el.innerHTML = `
      <div class="mg snatch">
        <p class="mg-info">🎭 Elige tu personaje para el Snatch Game</p>
        <div class="sg-chars">${shuffle(SNATCH_PERSONAJES).slice(0, 4)
          .map((c) => `<button class="btn btn-ghost role sg-char" data-id="${c.id}"><b>${c.icon} ${esc(c.name)}</b><small>Tono ${esc(c.tono)}</small></button>`)
          .join("")}</div>
      </div>`;
    el.querySelectorAll(".sg-char").forEach((b) => b.addEventListener("click", () => play(SNATCH_PERSONAJES.find((c) => c.id === b.dataset.id))));
    function play(me) {
      const others = SNATCH_PERSONAJES.filter((c) => c !== me);
      const mine = shuffle(me.frases);
      const qs = shuffle(SNATCH_PREGUNTAS).slice(0, N);
      let i = 0, total = 0, streak = 0, t0 = 0, raf = 0, answered = false, opts = [], laugh = 0;
      const TIME = 8;
      el.innerHTML = `
        <div class="mg snatch">
          <p class="mg-info">${me.icon} Eres <b>${esc(me.name)}</b> · Pregunta <b id="sg-n">1</b>/${N} · Racha <b id="sg-st">0</b></p>
          <div class="sg-host"><span>🎤 Supremme pregunta</span><p id="sg-q"></p></div>
          <div class="sg-bar"><div id="sg-time"></div></div>
          <div class="sg-opts" id="sg-opts"></div>
          <div class="sg-laugh"><span>😂 Risas del público</span><div><i id="sg-lg"></i></div></div>
          <p class="mg-info" id="sg-msg">Responde como ${esc(me.name)}: ¡que se note el personaje!</p>
        </div>`;
      function ask() {
        answered = false;
        const other = pick1(others);
        opts = shuffle([
          { t: mine[i % mine.length], v: "in", },
          { t: pick1(other.frases), v: "out", from: other },
          { t: pick1(SNATCH_PLANAS), v: "flat" },
        ]);
        $("#sg-n").textContent = i + 1;
        $("#sg-q").textContent = qs[i];
        $("#sg-opts").innerHTML = opts.map((o, k) => `<button class="btn btn-ghost sg-opt" data-k="${k}"><b>${k + 1}</b> ${esc(o.t)}</button>`).join("");
        el.querySelectorAll(".sg-opt").forEach((b) => b.addEventListener("click", () => choose(+b.dataset.k)));
        t0 = performance.now();
      }
      function choose(k) {
        if (answered) return;
        answered = true;
        const o = opts[k];
        const left = Math.max(0, 1 - (performance.now() - t0) / 1000 / TIME);
        let pts = 0, msg;
        if (!o) { msg = "Te has quedado en blanco. Silencio incómodo... 😶"; streak = 0; }
        else if (o.v === "in") { streak++; pts = 70 + left * 30 + Math.min(20, (streak - 1) * 7); msg = streak >= 3 ? `¡Estás on fire! El plató se cae de risa 🔥 (racha x${streak})` : "¡Carcajada! Eso es puro personaje 😂"; }
        else if (o.v === "out") { streak = 0; pts = 35; msg = `Tiene gracia... pero eso lo diría ${o.from.name}, no tú. 😬`; }
        else { streak = 0; pts = 8; msg = "Uf. Se te ha ido el personaje. Grillos. 🦗"; }
        pts = Math.min(100, pts);
        total += pts;
        laugh = Math.min(100, laugh * 0.5 + pts * 0.7);
        $("#sg-lg").style.width = laugh + "%";
        $("#sg-st").textContent = streak;
        $("#sg-msg").textContent = msg;
        el.querySelectorAll(".sg-opt").forEach((b, j) => b.classList.add(opts[j].v === "in" ? "best" : "dim"));
        pts >= 70 ? Sound.powerup && Sound.powerup() : Sound.impact();
        setTimeout(() => {
          i++;
          if (i >= N) { stop(); return done(Math.min(100, total / N)); }
          ask();
        }, 1400);
      }
      function tick(t) {
        const left = Math.max(0, 1 - (t - t0) / 1000 / TIME);
        const bar = $("#sg-time");
        if (bar && !answered) bar.style.width = left * 100 + "%";
        if (left <= 0 && !answered) choose(-1);
        raf = requestAnimationFrame(tick);
      }
      const onKey = (e) => { const k = { Digit1: 0, Digit2: 1, Digit3: 2, Numpad1: 0, Numpad2: 1, Numpad3: 2 }[e.code]; if (k !== undefined) choose(k); };
      function stop() { cancelAnimationFrame(raf); document.removeEventListener("keydown", onKey); }
      document.addEventListener("keydown", onKey);
      cleanup = stop;
      ask();
      raf = requestAnimationFrame(tick);
    }
  }

  // ------------------------- Minijuego: Snatch Game ------------------------
  const PREGUNTAS = [
    ["¿Cuál es tu secreto de belleza?", ["Dormir ocho horas... repartidas en tres semanas", "Beber mucha agua y usar crema", "No sé, la verdad"]],
    ["¿Qué te llevarías a una isla desierta?", ["Un espejo, para tener con quién hablar de algo interesante", "Protector solar", "Comida, supongo"]],
    ["Cuéntanos algo que nadie sepa de ti", ["Mi peluca tiene más seguidores que yo", "Que me encanta cocinar", "Nada, soy muy normal"]],
    ["¿Cómo te preparas para un lip sync?", ["Rezo, estiro y le pido perdón a mis rodillas", "Ensayo mucho la canción", "Me pongo muy nerviosa"]],
    ["¿Qué harías con un millón de euros?", ["Pestañas. Un millón de euros en pestañas", "Comprarme una casa", "Ahorrarlo"]],
    ["¿Quién es tu mayor rival aquí dentro?", ["El espejo del camerino: siempre me gana en reflejos", "Todas son muy buenas", "No tengo rivales"]],
    ["Describe tu estilo en tres palabras", ["Caro, brillante y sin devolución", "Elegante y divertido", "Normal, supongo"]],
    ["¿Qué le dirías a tu yo de hace diez años?", ["Guapa, invierte en lentejuelas", "Que siga sus sueños", "Nada en especial"]],
    ["¿Cuál es tu plato favorito?", ["El de las joyas, cariño, el de la cena ya si eso", "La tortilla de patatas", "No tengo"]],
    ["¿Qué opinas del gimnasio?", ["Lo visito cada año, para ver si sigue ahí", "Voy tres veces por semana", "Está bien"]],
  ];
  function runSnatch(el, done, bank = PREGUNTAS, host = "🎤 La presentadora", label = "Pregunta", N = 5) {
    const TIME = 9;
    const qs = shuffle(bank).slice(0, N);
    let i = 0, total = 0, t0 = 0, raf = 0, answered = false, opts = [];
    el.innerHTML = `
      <div class="mg snatch">
        <p class="mg-info">${label} <b id="sg-n">1</b>/${N}</p>
        <div class="sg-host"><span>${host}</span><p id="sg-q"></p></div>
        <div class="sg-bar"><div id="sg-time"></div></div>
        <div class="sg-opts" id="sg-opts"></div>
        <p class="mg-info" id="sg-msg"></p>
      </div>`;
    function ask() {
      answered = false;
      const [q, [best, mid, flat]] = qs[i];
      opts = shuffle([[best, 100, "¡Carcajada general! 😂"], [mid, 55, "Risas tímidas..."], [flat, 15, "Silencio en el plató 😬"]]);
      $("#sg-n").textContent = i + 1;
      $("#sg-q").textContent = q;
      $("#sg-msg").textContent = "";
      $("#sg-opts").innerHTML = opts.map((o, k) => `<button class="btn btn-ghost sg-opt" data-k="${k}"><b>${k + 1}</b> ${esc(o[0])}</button>`).join("");
      el.querySelectorAll(".sg-opt").forEach((b) => b.addEventListener("click", () => choose(+b.dataset.k)));
      t0 = performance.now();
    }
    function choose(k) {
      if (answered) return;
      answered = true;
      const o = opts[k];
      const pts = o ? o[1] : 0;
      total += pts;
      $("#sg-msg").textContent = o ? o[2] : "¡Se te acabó el tiempo! 😶";
      el.querySelectorAll(".sg-opt").forEach((b, j) => b.classList.add(opts[j][1] === 100 ? "best" : "dim"));
      pts === 100 ? Sound.powerup && Sound.powerup() : Sound.impact();
      setTimeout(() => {
        i++;
        if (i >= N) {
          stop();
          return done(total / N);
        }
        ask();
      }, 1300);
    }
    function tick(t) {
      const left = Math.max(0, 1 - (t - t0) / 1000 / TIME);
      const bar = $("#sg-time");
      if (bar && !answered) bar.style.width = left * 100 + "%";
      if (left <= 0 && !answered) choose(-1);
      raf = requestAnimationFrame(tick);
    }
    const onKey = (e) => {
      const k = { Digit1: 0, Digit2: 1, Digit3: 2, Numpad1: 0, Numpad2: 1, Numpad3: 2 }[e.code];
      if (k !== undefined) choose(k);
    };
    function stop() {
      cancelAnimationFrame(raf);
      document.removeEventListener("keydown", onKey);
    }
    document.addEventListener("keydown", onKey);
    cleanup = stop;
    ask();
    raf = requestAnimationFrame(tick);
  }

  const LECTURAS = [
    ["Lee a la compañera que siempre llega tarde", ["Cariño, tú no llegas tarde: llegas en otro huso horario", "Siempre llegas tarde, eh", "Llegas tarde"]],
    ["Lee a la reina de la peluca más grande", ["Tu peluca tiene código postal propio", "Qué peluca tan grande", "Bonita peluca"]],
    ["Lee a la que se maquilla en cinco minutos", ["Se nota, reina, se nota. Pero con mucha seguridad", "Te maquillas rápido", "Vas guapa"]],
    ["Lee a la que cose fatal", ["Tu vestido tiene más grapas que costuras", "No sabes coser mucho", "Bueno, coses regular"]],
    ["Lee a la que siempre habla de sí misma", ["Tu espejo ya pidió vacaciones", "Hablas mucho de ti", "Eres muy tú"]],
    ["Lee a la más pija del grupo", ["Su bolso tiene más estudios que yo", "Eres un poco pija", "Te gusta lo caro"]],
    ["Lee a la que siempre llora en el taller", ["Trae el rímel resistente, que hoy toca episodio", "Lloras mucho", "Eres sensible"]],
    ["Lee a la que baila como un pato", ["Tu coreografía tiene fans en el estanque del Retiro", "No bailas muy bien", "Bailas distinto"]],
    ["Lee a la que se cree la favorita", ["Ya ha ensayado el discurso de la corona... de la de Burger", "Te crees favorita", "Tienes confianza"]],
  ];

  // ------------------------- Minijuego: diseño -----------------------------
  function runDiseno(el, done, theme = null, DUR = 25) {
    const W = 1000, H = 560;
    el.innerHTML = `
      <div class="mg diseno">
        <p class="mg-info">Tiempo <b id="ds-t">${DUR}</b> s · Materiales <b id="ds-p">0</b></p>
        <canvas id="ds-c" width="${W}" height="${H}"></canvas>
        <div class="ds-touch"><button class="btn btn-ghost" id="ds-l">◀</button><button class="btn btn-ghost" id="ds-r">▶</button></div>
      </div>`;
    const cv = $("#ds-c"), ctx = cv.getContext("2d");
    const img = new Image();
    img.src = sprite(S.queen);
    const GOOD = (theme && theme.good) || [["✨", 10], ["🧵", 10], ["🪶", 12], ["💎", 18], ["🎀", 10]];
    const BAD = (theme && theme.bad) || [["✂️", -15], ["🩹", -10]];
    let x = W / 2, vx = 0, keys = { l: false, r: false }, items = [], t = 0, spawn = 0, pts = 0, raf = 0, last = performance.now(), mouseX = null;
    function tick(now) {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      t += dt;
      const dir = (keys.r ? 1 : 0) - (keys.l ? 1 : 0);
      if (dir) x += dir * 620 * dt;
      else if (mouseX !== null) x += (mouseX - x) * Math.min(1, dt * 12);
      x = Math.max(60, Math.min(W - 60, x));
      spawn -= dt;
      if (spawn <= 0) {
        spawn = Math.max(0.28, 0.7 - t * 0.015);
        const bad = Math.random() < 0.25 + t * 0.006;
        const [e, v] = bad ? BAD[Math.floor(Math.random() * BAD.length)] : GOOD[Math.floor(Math.random() * GOOD.length)];
        items.push({ x: rnd(40, W - 40), y: -30, vy: rnd(200, 300) + t * 9, e, v });
      }
      ctx.clearRect(0, 0, W, H);
      ctx.font = "40px serif";
      ctx.textAlign = "center";
      items = items.filter((it) => {
        it.y += it.vy * dt;
        if (it.y > H - 150 && it.y < H - 40 && Math.abs(it.x - x) < 70) {
          pts = Math.max(0, pts + it.v);
          it.v > 0 ? Sound.powerup && Sound.powerup() : Sound.impact();
          return false;
        }
        ctx.fillText(it.e, it.x, it.y);
        return it.y < H + 40;
      });
      const h = 150, w = img.naturalWidth ? (img.naturalWidth / img.naturalHeight) * h : 70;
      if (img.complete) ctx.drawImage(img, x - w / 2, H - h - 6, w, h);
      $("#ds-t").textContent = Math.max(0, Math.ceil(DUR - t));
      $("#ds-p").textContent = pts;
      if (t >= DUR) {
        stop();
        return done(Math.min(100, (pts / ((300 * DUR) / 25)) * 100));
      }
      raf = requestAnimationFrame(tick);
    }
    const KEYS = { ArrowLeft: "l", KeyA: "l", ArrowRight: "r", KeyD: "r" };
    const kd = (e) => { const k = KEYS[e.code]; if (k) { e.preventDefault(); keys[k] = true; mouseX = null; } };
    const ku = (e) => { const k = KEYS[e.code]; if (k) keys[k] = false; };
    const mm = (e) => { const r = cv.getBoundingClientRect(); mouseX = ((e.clientX - r.left) / r.width) * W; };
    cv.addEventListener("pointermove", mm);
    const hold = (id, k) => {
      const b = $(id);
      b.addEventListener("pointerdown", () => (keys[k] = true));
      ["pointerup", "pointerleave", "pointercancel"].forEach((ev) => b.addEventListener(ev, () => (keys[k] = false)));
    };
    hold("#ds-l", "l");
    hold("#ds-r", "r");
    function stop() {
      cancelAnimationFrame(raf);
      document.removeEventListener("keydown", kd);
      document.removeEventListener("keyup", ku);
    }
    document.addEventListener("keydown", kd);
    document.addEventListener("keyup", ku);
    cleanup = stop;
    raf = requestAnimationFrame(tick);
  }

  // ------------------------- Minijuego: Rusical ----------------------------
  function runRusical(el, done) {
    const W = 760, H = 560, LANES = 4, LINE = H - 80, SPEED = 380;
    const COLORS = ["#ff4fd8", "#ffd84d", "#4fd8ff", "#9dff4f"];
    const KEYS = { KeyD: 0, KeyF: 1, KeyJ: 2, KeyK: 3, ArrowLeft: 0, ArrowDown: 1, ArrowUp: 2, ArrowRight: 3 };
    el.innerHTML = `
      <div class="mg rusical">
        <p class="mg-info"><span id="rs-msg">¡Que empiece el número!</span> · Combo <b id="rs-c">0</b></p>
        <canvas id="rs-cv" width="${W}" height="${H}"></canvas>
        <p class="muted">D · F · J · K</p>
      </div>`;
    const cv = $("#rs-cv"), ctx = cv.getContext("2d"), lw = W / LANES;
    // Partitura: ~36 notas a 120 bpm con algún acorde
    const notes = [];
    let tt = 1.5;
    while (tt < 21) {
      const lane = Math.floor(Math.random() * LANES);
      notes.push({ t: tt, lane, hit: null });
      if (Math.random() < 0.15) notes.push({ t: tt, lane: (lane + 2) % LANES, hit: null });
      tt += [0.5, 0.5, 0.25, 0.75, 1][Math.floor(Math.random() * 5)];
    }
    let t0 = performance.now(), raf = 0, combo = 0, score = 0, flash = [0, 0, 0, 0];
    const now = () => (performance.now() - t0) / 1000;
    function press(lane) {
      const t = now();
      flash[lane] = 0.15;
      let best = null;
      notes.forEach((n) => { if (n.lane === lane && n.hit === null && Math.abs(n.t - t) < 0.2 && (!best || Math.abs(n.t - t) < Math.abs(best.t - t))) best = n; });
      if (!best) return;
      const d = Math.abs(best.t - t);
      best.hit = d < 0.08 ? 1 : 0.6;
      score += best.hit;
      combo++;
      $("#rs-msg").textContent = best.hit === 1 ? "¡Perfecto!" : "¡Bien!";
      $("#rs-c").textContent = combo;
      Sound.countdown(false);
    }
    function tick() {
      const t = now();
      ctx.clearRect(0, 0, W, H);
      for (let i = 0; i < LANES; i++) {
        ctx.fillStyle = flash[i] > 0 ? "rgba(255,255,255,.12)" : i % 2 ? "rgba(255,255,255,.04)" : "rgba(255,255,255,.07)";
        ctx.fillRect(i * lw, 0, lw, H);
        flash[i] = Math.max(0, flash[i] - 1 / 60);
        ctx.strokeStyle = COLORS[i];
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(i * lw + lw / 2, LINE, 30, 0, Math.PI * 2);
        ctx.stroke();
      }
      notes.forEach((n) => {
        if (n.hit === null && t - n.t > 0.2) {
          n.hit = 0;
          combo = 0;
          $("#rs-c").textContent = 0;
          $("#rs-msg").textContent = "¡Fallo!";
        }
        if (n.hit !== null && n.hit > 0) return;
        const y = LINE - (n.t - t) * SPEED;
        if (y < -40 || y > H + 40) return;
        ctx.fillStyle = COLORS[n.lane];
        ctx.globalAlpha = n.hit === 0 ? 0.3 : 1;
        ctx.beginPath();
        ctx.arc(n.lane * lw + lw / 2, y, 26, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
      });
      if (t > notes[notes.length - 1].t + 1) {
        stop();
        return done((score / notes.length) * 100);
      }
      raf = requestAnimationFrame(tick);
    }
    const kd = (e) => { const l = KEYS[e.code]; if (l !== undefined) { e.preventDefault(); if (!e.repeat) press(l); } };
    cv.addEventListener("pointerdown", (e) => {
      const r = cv.getBoundingClientRect();
      press(Math.min(LANES - 1, Math.floor(((e.clientX - r.left) / r.width) * LANES)));
    });
    function stop() {
      cancelAnimationFrame(raf);
      document.removeEventListener("keydown", kd);
    }
    document.addEventListener("keydown", kd);
    cleanup = stop;
    raf = requestAnimationFrame(tick);
  }

  // ------------------------- Minijuego: maquillaje -------------------------
  function runMaquillaje(el, done) {
    const ZONAS = ["Sombra", "Delineado", "Colorete", "Labios"];
    const PALETA = ["#ff4fd8", "#ffd84d", "#4fd8ff", "#ff3b3b", "#9d4fff", "#1b1b1b", "#ff9a3d", "#3dff9a"];
    const ROUNDS = 4;
    el.innerHTML = `
      <div class="mg maquillaje">
        <p class="mg-info">Look <b id="mq-n">1</b>/${ROUNDS} · <span id="mq-msg"></span></p>
        <div class="mq-chart" id="mq-chart"></div>
        <div class="mq-pal" id="mq-pal"></div>
      </div>`;
    let round = 0, ok = 0, target = [], pick = [], zone = 0, timers = [];
    const later = (f, ms) => timers.push(setTimeout(f, ms));
    function chart(cols, active = -1) {
      $("#mq-chart").innerHTML = ZONAS.map((z, i) => `<div class="mq-z ${i === active ? "act" : ""}"><i style="background:${cols[i] || "transparent"}"></i><span>${z}</span></div>`).join("");
    }
    function play() {
      target = ZONAS.map(() => PALETA[Math.floor(Math.random() * PALETA.length)]);
      pick = [];
      zone = 0;
      $("#mq-n").textContent = round + 1;
      $("#mq-msg").textContent = "Memoriza la carta...";
      $("#mq-pal").innerHTML = "";
      chart(target);
      later(() => {
        $("#mq-msg").textContent = `Elige el color de: ${ZONAS[0]}`;
        chart([], 0);
        $("#mq-pal").innerHTML = PALETA.map((c) => `<button class="mq-c" style="background:${c}" data-c="${c}"></button>`).join("");
        el.querySelectorAll(".mq-c").forEach((b) => b.addEventListener("click", () => choose(b.dataset.c)));
      }, 2600 - round * 350);
    }
    function choose(c) {
      if (zone >= ZONAS.length) return;
      pick.push(c);
      if (c === target[zone]) ok++;
      zone++;
      chart(pick, zone);
      if (zone < ZONAS.length) return ($("#mq-msg").textContent = `Elige el color de: ${ZONAS[zone]}`);
      const good = pick.filter((p, i) => p === target[i]).length;
      $("#mq-msg").textContent = good === 4 ? "¡Idéntico! 💄" : `${good}/4 zonas bien`;
      good === 4 ? Sound.powerup && Sound.powerup() : Sound.impact();
      $("#mq-chart").innerHTML += `<p class="mq-sol">Carta original: ${target.map((c) => `<i style="background:${c}"></i>`).join("")}</p>`;
      later(() => {
        round++;
        if (round >= ROUNDS) {
          stop();
          return done((ok / (ROUNDS * ZONAS.length)) * 100);
        }
        play();
      }, 1500);
    }
    function stop() {
      timers.forEach(clearTimeout);
    }
    cleanup = stop;
    play();
  }

  // ------------------------- Pasarela: estilismo + desfile --------------------
  function runEstilismo(el, cat, done, poses = 3, prefix = "") {
    const SLOTS = ["peluca", "look", "zapatos", "accesorio"], TIME = 30;
    const good = ESTILO_CATS[cat] || ["glam"];
    const fitOf = (it) => (it.t.includes(cat) ? 25 : good.includes(it.s) ? 12 : 2);
    // Tres opciones por pieza: una que encaja, una a medias y otra que no pega
    const opts = SLOTS.map((k) => {
      const all = ESTILO_PIEZAS[k].items;
      const full = shuffle(all.filter((i) => i.t.includes(cat)));
      const half = shuffle(all.filter((i) => !i.t.includes(cat) && good.includes(i.s)));
      const off = shuffle(all.filter((i) => !i.t.includes(cat) && !good.includes(i.s)));
      const pickSet = [full[0] || half[1], half[0] || off[1], off[0]].filter(Boolean);
      while (pickSet.length < 3) pickSet.push(pick1(all.filter((i) => !pickSet.includes(i))));
      return shuffle(pickSet);
    });
    const chosen = [];
    let slot = 0, t0 = performance.now(), iv = 0, over = false;
    el.innerHTML = `
      <div class="mg estilo">
        <p class="mg-info">${esc(prefix)}👠 Estilismo · «${esc(cat)}» · <b id="es-t">${TIME}</b> s</p>
        <div class="es-look" id="es-look">${SLOTS.map((k) => `<span class="es-slot" data-k="${k}"><em>${ESTILO_PIEZAS[k].icon}</em><small>${ESTILO_PIEZAS[k].name}</small></span>`).join("")}</div>
        <h4 id="es-q"></h4>
        <div class="es-opts" id="es-opts"></div>
      </div>`;
    function show() {
      const k = SLOTS[slot];
      $("#es-q").textContent = `Elige ${ESTILO_PIEZAS[k].name.toLowerCase()} (${slot + 1}/4)`;
      $("#es-opts").innerHTML = opts[slot]
        .map((it, i) => `<button class="es-opt" data-i="${i}" style="--c:${it.c}"><i>${ESTILO_PIEZAS[k].icon}</i><b>${i + 1}</b><span>${esc(it.n)}</span><small>${ESTILO_NOMBRES[it.s]}</small></button>`)
        .join("");
      el.querySelectorAll(".es-opt").forEach((b) => b.addEventListener("click", () => choose(+b.dataset.i)));
    }
    function choose(i) {
      if (over) return;
      const it = opts[slot][i];
      if (!it) return;
      chosen.push(it);
      const sl = el.querySelector(`.es-slot[data-k="${SLOTS[slot]}"]`);
      sl.classList.add("on");
      sl.style.setProperty("--c", it.c);
      sl.querySelector("small").textContent = it.n;
      Sound.countdown(false);
      slot++;
      if (slot >= SLOTS.length) return finishLook();
      show();
    }
    function finishLook() {
      over = true;
      clearInterval(iv);
      document.removeEventListener("keydown", onKey);
      const left = Math.max(0, 1 - (performance.now() - t0) / 1000 / TIME);
      const fit = chosen.reduce((a, it) => a + fitOf(it), 0); // 0..100
      const counts = {};
      chosen.forEach((it) => (counts[it.s] = (counts[it.s] || 0) + 1));
      const same = Math.max(...Object.values(counts));
      const combo = same >= 4 ? 15 : same === 3 ? 10 : same === 2 ? 4 : 0;
      const styling = clamp(fit * 0.8 + combo + left * 10, 0, 100);
      const sorted = chosen.slice().sort((a, b) => fitOf(b) - fitOf(a));
      S.lastLook = { cat, best: sorted[0].n, worst: sorted[sorted.length - 1].n, pieces: chosen.map((x) => x.n) };
      const stars = (v, max) => "★".repeat(Math.round((v / max) * 4)) + "☆".repeat(4 - Math.round((v / max) * 4));
      el.querySelector("#es-q").textContent = "¡Look listo!";
      el.querySelector("#es-opts").innerHTML = `
        <div class="es-score">
          <span>Categoría <b>${stars(fit, 100)}</b></span>
          <span>Combinación <b>${stars(combo, 15)}</b></span>
          <span>Rapidez <b>${stars(left, 1)}</b></span>
        </div>`;
      styling >= 70 ? Sound.powerup && Sound.powerup() : Sound.impact();
      const tm = setTimeout(() => {
        el.innerHTML = "";
        runPasarela(el, (walk) => done(styling * 0.6 + walk * 0.4), poses, `${prefix}«${cat}»: ${chosen.map((x) => x.n).join(" · ")}`);
      }, 1800);
      cleanup = () => clearTimeout(tm);
    }
    const onKey = (e) => { const k = { Digit1: 0, Digit2: 1, Digit3: 2, Numpad1: 0, Numpad2: 1, Numpad3: 2 }[e.code]; if (k !== undefined) choose(k); };
    document.addEventListener("keydown", onKey);
    iv = setInterval(() => {
      const left = Math.max(0, TIME - (performance.now() - t0) / 1000);
      const tEl = $("#es-t");
      if (tEl) tEl.textContent = Math.ceil(left);
      // Se acaba el tiempo: lo que falte se elige al azar
      if (left <= 0 && !over) while (!over) choose(Math.floor(Math.random() * 3));
    }, 200);
    cleanup = () => { clearInterval(iv); document.removeEventListener("keydown", onKey); };
    show();
  }

  // ------------------------- Minijuego: el Ball -----------------------------
  function runBall(el, done) {
    const cats = shuffle(CATEGORIAS).slice(0, 3), scores = [];
    let timer = 0;
    function next() {
      const k = scores.length;
      if (k >= 3) return done(scores[0] * 0.3 + scores[1] * 0.3 + scores[2] * 0.4);
      const made = k === 2;
      el.innerHTML = `<div class="mg"><p class="eyebrow">Look ${k + 1} de 3 · ${made ? "hecho en el taller" : "traído de casa"}</p><h3 class="ball-cat">«${esc(cats[k])}»</h3>${made ? `<p class="muted">Primero cóselo con lo que caiga del cielo... y luego a desfilarlo.</p>` : ""}</div>`;
      cleanup = () => clearTimeout(timer);
      timer = setTimeout(() => {
        if (!made) return runEstilismo(el, cats[k], (sc) => { scores.push(sc); next(); }, 2, `Look ${k + 1}/3 · `);
        runDiseno(el, (build) => {
          el.innerHTML = "";
          runPasarela(el, (walk) => { scores.push(build * 0.6 + walk * 0.4); next(); }, 3, `Look 3/3 · ${cats[k]} (hecho aquí)`);
        }, MATERIALES_RAROS, 15);
      }, 1300);
    }
    next();
  }

  // ------------------------- Minijuego: guion (actuación) -------------------
  function runGuion(el, done) {
    ensureTeam();
    const N = 6, TIME = 7;
    const lines = shuffle(GUION).slice(0, N);
    let i = 0, total = 0, t0 = 0, raf = 0, timer = 0, answered = true, opts = [];
    el.innerHTML = `
      <div class="mg snatch guion">
        <p class="mg-info">🎬 Toma <b id="gn-n">1</b>/${N} · <span id="gn-msg">Memoriza tu frase...</span></p>
        <div class="sg-host"><span>🎞️ Guion</span><p id="gn-line"></p></div>
        <div class="sg-bar"><div id="sg-time"></div></div>
        <div class="sg-opts" id="sg-opts"></div>
      </div>`;
    function show() {
      const [txt, word] = lines[i];
      answered = true;
      $("#gn-n").textContent = i + 1;
      $("#gn-msg").textContent = "Memoriza tu frase...";
      $("#gn-line").innerHTML = esc(txt).replace("___", `<mark>${esc(word)}</mark>`);
      $("#sg-opts").innerHTML = "";
      $("#sg-time").style.width = "100%";
      timer = setTimeout(ask, 2300);
    }
    function ask() {
      const [txt, word, wrong] = lines[i];
      $("#gn-msg").textContent = "¡Acción! ¿Qué palabra era?";
      $("#gn-line").innerHTML = esc(txt).replace("___", "<mark>______</mark>");
      opts = shuffle([{ t: word, ok: true }, ...wrong.map((t) => ({ t, ok: false }))]);
      $("#sg-opts").innerHTML = opts.map((o, k) => `<button class="btn btn-ghost sg-opt" data-k="${k}"><b>${k + 1}</b> ${esc(o.t)}</button>`).join("");
      el.querySelectorAll(".sg-opt").forEach((b) => b.addEventListener("click", () => choose(+b.dataset.k)));
      answered = false;
      t0 = performance.now();
    }
    function choose(k) {
      if (answered) return;
      answered = true;
      const o = opts[k];
      const left = Math.max(0, 1 - (performance.now() - t0) / 1000 / TIME);
      const pts = !o ? 0 : o.ok ? 70 + left * 30 : 12;
      total += pts;
      $("#gn-msg").textContent = !o ? "¡Corten! Te has quedado en blanco 😶" : o.ok ? "¡Corten! Toma buena 🎬" : "¡Corten! Esa no era tu frase 😬";
      el.querySelectorAll(".sg-opt").forEach((b, j) => b.classList.add(opts[j].ok ? "best" : "dim"));
      o && o.ok ? Sound.powerup && Sound.powerup() : Sound.impact();
      timer = setTimeout(() => {
        i++;
        if (i >= N) { stop(); return done(total / N); }
        show();
      }, 1200);
    }
    function tick(t) {
      const bar = $("#sg-time");
      if (!answered) {
        const left = Math.max(0, 1 - (t - t0) / 1000 / TIME);
        if (bar) bar.style.width = left * 100 + "%";
        if (left <= 0) choose(-1);
      }
      raf = requestAnimationFrame(tick);
    }
    const onKey = (e) => { const k = { Digit1: 0, Digit2: 1, Digit3: 2, Numpad1: 0, Numpad2: 1, Numpad3: 2 }[e.code]; if (k !== undefined) choose(k); };
    function stop() { cancelAnimationFrame(raf); clearTimeout(timer); document.removeEventListener("keydown", onKey); }
    document.addEventListener("keydown", onKey);
    cleanup = stop;
    show();
    raf = requestAnimationFrame(tick);
  }

  // ------------------------- Minijuego: makeover (parejas) ------------------
  function runMemoria(el, done, ICONS = ["👠", "💄", "👛", "💍", "🪭", "🎀"], DUR = 45, hint = "Empareja los accesorios") {
    const cards = shuffle([...ICONS, ...ICONS]);
    let open = [], found = 0, misses = 0, t0 = performance.now(), iv = 0, busy = false, over = false;
    el.innerHTML = `
      <div class="mg memoria">
        <p class="mg-info">Tiempo <b id="mm-t">${DUR}</b> s · Parejas <b id="mm-p">0</b>/${ICONS.length} · <span id="mm-msg">${esc(hint)}</span></p>
        <div class="mem-grid">${cards.map((c, k) => `<button class="mem-card" data-k="${k}"><span>${c}</span></button>`).join("")}</div>
      </div>`;
    const btns = [...el.querySelectorAll(".mem-card")];
    btns.forEach((b) => b.addEventListener("click", () => flip(+b.dataset.k)));
    function flip(k) {
      const b = btns[k];
      if (busy || over || b.classList.contains("open") || b.classList.contains("done")) return;
      b.classList.add("open");
      open.push(k);
      if (open.length < 2) return;
      const [a, c] = open;
      open = [];
      if (cards[a] === cards[c]) {
        btns[a].classList.add("done");
        btns[c].classList.add("done");
        found++;
        $("#mm-p").textContent = found;
        $("#mm-msg").textContent = "¡A juego! 💖";
        Sound.powerup && Sound.powerup();
        if (found === ICONS.length) end();
      } else {
        misses++;
        busy = true;
        $("#mm-msg").textContent = "No pegan...";
        setTimeout(() => { btns[a].classList.remove("open"); btns[c].classList.remove("open"); busy = false; }, 650);
      }
    }
    function end() {
      if (over) return;
      over = true;
      stop();
      const left = Math.max(0, 1 - (performance.now() - t0) / 1000 / DUR);
      done(clamp((found / ICONS.length) * 75 + (found === ICONS.length ? 25 * left + 10 : 0) - Math.max(0, misses - 5) * 2, 0, 100));
    }
    iv = setInterval(() => {
      const left = Math.max(0, DUR - (performance.now() - t0) / 1000);
      const t = $("#mm-t");
      if (t) t.textContent = Math.ceil(left);
      if (left <= 0) end();
    }, 200);
    function stop() { clearInterval(iv); }
    cleanup = stop;
  }

  // ------------------------- Minijuego: sesión de fotos --------------------
  function runFotos(el, done, BADICON = "📸", DUR = 20, BADMSG = "¡Era el paparazzi! 😱") {
    el.innerHTML = `
      <div class="mg fotos">
        <p class="mg-info">Tiempo <b id="ft-t">${DUR}</b> s · Fotos <b id="ft-p">0</b> · <span id="ft-msg">¡Atenta al flash!</span></p>
        <div class="ft-grid">${Array.from({ length: 9 }, (_, k) => `<button class="ft-cell" data-k="${k}"></button>`).join("")}</div>
      </div>`;
    const cells = [...el.querySelectorAll(".ft-cell")];
    let t0 = performance.now(), spawnT = 0, shown = 0, hits = 0, bad = 0, timers = [], over = false;
    function spawn() {
      if (over) return;
      const t = (performance.now() - t0) / 1000;
      if (t >= DUR) return end();
      const free = cells.filter((c) => !c.classList.contains("on"));
      const c = pick1(free);
      const pap = Math.random() < 0.22;
      if (!pap) shown++;
      c.className = `ft-cell on ${pap ? "pap" : "me"}`;
      c.innerHTML = pap ? BADICON : `<i style="background-image:url('${photo(S.queen)}')"></i>`;
      const life = Math.max(620, 1050 - t * 20);
      timers.push(setTimeout(() => { if (c.classList.contains("on")) { c.className = "ft-cell"; c.innerHTML = ""; } }, life));
      timers.push(setTimeout(spawn, Math.max(420, 820 - t * 16)));
    }
    cells.forEach((c) => c.addEventListener("click", () => {
      if (!c.classList.contains("on")) return;
      if (c.classList.contains("me")) { hits++; $("#ft-msg").textContent = "¡Click! Preciosa 📷"; Sound.powerup && Sound.powerup(); }
      else { bad++; $("#ft-msg").textContent = BADMSG; Sound.impact(); }
      c.className = "ft-cell";
      c.innerHTML = "";
      $("#ft-p").textContent = hits;
    }));
    const iv = setInterval(() => { const t = $("#ft-t"); if (t) t.textContent = Math.max(0, Math.ceil(DUR - (performance.now() - t0) / 1000)); }, 250);
    function end() {
      if (over) return;
      over = true;
      stop();
      done(clamp((hits / Math.max(1, shown)) * 105 - bad * 8, 0, 100));
    }
    function stop() { timers.forEach(clearTimeout); clearInterval(iv); }
    cleanup = stop;
    timers.push(setTimeout(spawn, 700));
  }

  // ------------------------- Minirreto: flash (capitanas) --------------------
  function runMiniFlash(el, title, done) {
    const ROUNDS = 3;
    let round = 0, total = 0, state = "wait", tGo = 0, timer = 0;
    el.innerHTML = `
      <div class="mg mini">
        <p class="eyebrow">Minirreto · ${esc(title)}</p>
        <p class="mg-info">Ronda <b id="mn-n">1</b>/${ROUNDS} · <span id="mn-msg">Pulsa en cuanto salte el flash (no antes)</span></p>
        <button class="mini-btn" id="mini-btn">Espera...</button>
      </div>`;
    const btn = $("#mini-btn");
    function arm() {
      state = "wait";
      btn.className = "mini-btn";
      btn.textContent = "Espera...";
      $("#mn-n").textContent = round + 1;
      timer = setTimeout(() => {
        state = "go";
        btn.className = "mini-btn go";
        btn.textContent = "¡FLASH! 📸";
        tGo = performance.now();
      }, 900 + Math.random() * 1500);
    }
    function press() {
      if (state === "done") return;
      let pts;
      if (state === "wait") {
        clearTimeout(timer);
        pts = 0;
        $("#mn-msg").textContent = "¡Te has adelantado! 0 puntos";
        Sound.impact();
      } else {
        const ms = performance.now() - tGo;
        pts = clamp(100 - (ms - 200) / 5, 10, 100);
        $("#mn-msg").textContent = `${Math.round(ms)} ms · ${pts > 85 ? "¡Rapidísima! ⚡" : pts > 55 ? "¡Bien!" : "Un poco lenta..."}`;
        Sound.powerup && Sound.powerup();
      }
      total += pts;
      state = "done";
      btn.className = "mini-btn";
      round++;
      timer = setTimeout(() => (round >= ROUNDS ? (stop(), done(total / ROUNDS)) : arm()), 900);
    }
    const onKey = (e) => { if (e.code === "Space" || e.code === "Enter") { e.preventDefault(); if (!e.repeat) press(); } };
    function stop() { clearTimeout(timer); document.removeEventListener("keydown", onKey); }
    btn.addEventListener("click", press);
    document.addEventListener("keydown", onKey);
    cleanup = stop;
    arm();
  }

  // ===========================================================================
  //  ATRIBUTOS, MOTOR DE DECISIONES, MAXI RETOS, PASARELA Y LIP SYNC
  // ===========================================================================
  const ATTR_NAMES = { comedia: "Comedia", carisma: "Carisma", estilo: "Estilo", performance: "Performance", maquillaje: "Maquillaje" };
  const hashN = (str, k) => {
    let h = 7;
    for (const c of str + k) h = (h * 31 + c.charCodeAt(0)) >>> 0;
    return h % 4;
  };
  // Atributos (1-10): salen de las estadísticas de la reina, con su toque propio
  function baseAttrs(q, st) {
    const f = (v, k) => clamp(Math.round(v * 1.5 + hashN(q.id, k) - 0.5), 2, 10);
    return { comedia: f(st.rate, "c"), carisma: f(st.lives, "k"), estilo: f(st.power, "e"), performance: f(st.speed, "p"), maquillaje: f((st.power + st.rate) / 2, "m") };
  }
  // Ficha de modo historia para la pantalla de elegir reina
  function preview(q) {
    const t = traitsOf(q);
    return { attrs: baseAttrs(q, Wardrobe.statsOf(q)), names: ATTR_NAMES, car: RASGOS.car[t.car], fort: RASGOS.fort[t.fort], titles: Nem.titles(q.id) };
  }
  function attrsOf(q) {
    const up = q === S.queen ? Wardrobe.statsOf(q) : q.stats;
    const st = q === S.queen ? Object.fromEntries(Object.keys(q.stats).map((k) => [k, Math.min(up[k], q.stats[k] + 1)])) : q.stats;
    const a = baseAttrs(q, st);
    if (q === S.queen) Object.entries(S.attrGrowth || {}).forEach(([k, v]) => (a[k] = clamp(a[k] + v, 1, 10)));
    return a;
  }
  const A = (k) => attrsOf(S.queen)[k];
  function check(keys, diff) {
    const v = (keys.reduce((a, k) => a + A(k), 0) / keys.length) * 10;
    const p = clamp(0.5 + (v - diff) / 70, 0.08, 0.95);
    const ok = Math.random() < p;
    return { ok, txt: `🎲 ${keys.map((k) => ATTR_NAMES[k]).join(" + ")} → ${ok ? "✅ te sale" : "❌ no te sale"}` };
  }
  const attrChips = (keys) => keys.map((k) => `<span class="attr-chip">${ATTR_NAMES[k]} <b>${A(k)}</b></span>`).join("");
  function growAttr(k) {
    if (!k) return;
    S.attrGrowth = S.attrGrowth || {};
    if (A(k) >= 10) return;
    S.attrGrowth[k] = (S.attrGrowth[k] || 0) + 1;
    Toast.show(`📈 +1 en ${ATTR_NAMES[k]}`, `Ahora tienes ${A(k)}`);
  }

  // Motor genérico: una secuencia de decisiones con medidores y chequeos
  // cfg: { title, icon, meters: ["focus"|"energy"], init, steps: [(st) => step|null], finish(st, base) }
  // step: { q (html), sub, opts: [{ t, d, tag, go(st) => { pts, w, msg } }] }
  function runSteps(el, cfg, done) {
    const st = { total: 0, wsum: 0, focus: 50, energy: 100, log: [], ...(cfg.init || {}) };
    let i = 0, busy = false, timer = 0, cur = null;
    el.innerHTML = `
      <div class="mg dc">
        <p class="mg-info">${cfg.icon || "🎬"} ${esc(cfg.title)}</p>
        <div class="dc-top" id="dc-top"></div>
        <div class="dc-meters" id="dc-m"></div>
        <div class="dc-scene" id="dc-s"></div>
        <div class="dc-opts" id="dc-o"></div>
        <p class="dc-msg" id="dc-msg"></p>
      </div>`;
    const meterHTML = () =>
      (cfg.meters || [])
        .map((m) => {
          const v = clamp(Math.round(st[m]), 0, 100);
          const lab = m === "focus" ? "🔦 Foco" : m === "energy" ? "⚡ Energía" : m;
          const warn = m === "focus" ? (v > 80 ? "hot" : v < 30 ? "cold" : "") : v < 25 ? "cold" : "";
          return `<div class="dc-meter ${warn}"><span>${lab}</span><div><i style="width:${v}%"></i>${m === "focus" ? `<em style="left:30%"></em><em style="left:80%"></em>` : ""}</div></div>`;
        })
        .join("");
    function next() {
      busy = false;
      if (i >= cfg.steps.length) return end();
      const s = cfg.steps[i++](st);
      if (!s) return next();
      cur = s;
      $("#dc-m").innerHTML = meterHTML();
      $("#dc-s").innerHTML = `${s.q ? `<h4>${s.q}</h4>` : ""}${s.sub ? `<p>${s.sub}</p>` : ""}`;
      $("#dc-msg").textContent = "";
      if (cfg.top) $("#dc-top").innerHTML = cfg.top(st);
      const EMO = /^((?:\p{Extended_Pictographic}|\uFE0F|\u200D)+)\s*/u;
      $("#dc-o").innerHTML = s.opts
        .map((o, k) => {
          const m = typeof o.t === "string" && o.t.match(EMO);
          const icon = m ? m[1] : "";
          const txt = m ? o.t.slice(m[0].length) : o.t;
          return `<button class="dc-opt ${icon ? "has-ico" : ""}" data-k="${k}" style="--i:${k}"><b>${k + 1}</b>${icon ? `<i class="dc-ico">${icon}</i>` : ""}<span>${txt}</span>${o.d ? `<small>${o.d}</small>` : ""}${o.tag ? `<em>${o.tag}</em>` : ""}</button>`;
        })
        .join("");
      el.querySelectorAll(".dc-opt").forEach((b) => b.addEventListener("click", () => pick(+b.dataset.k)));
    }
    function pick(k) {
      if (busy || !cur || !cur.opts[k]) return;
      busy = true;
      const r = cur.opts[k].go(st) || {};
      if (cfg.onPick) cfg.onPick(st, cur.opts[k], r);
      if (typeof r.pts === "number") {
        const w = r.w === undefined ? 1 : r.w;
        st.total += clamp(r.pts, 0, 100) * w;
        st.wsum += w;
      }
      el.querySelectorAll(".dc-opt").forEach((b, j) => b.classList.add(j === k ? "picked" : "dim"));
      $("#dc-m").innerHTML = meterHTML();
      $("#dc-msg").innerHTML = r.msg || "";
      if (r.pts !== undefined) (r.pts >= 70 ? Sound.powerup && Sound.powerup() : r.pts < 40 ? Sound.impact() : Sound.countdown(false));
      timer = setTimeout(next, r.msg ? 1500 : 450);
    }
    const onKey = (e) => {
      const k = { Digit1: 0, Digit2: 1, Digit3: 2, Digit4: 3, Numpad1: 0, Numpad2: 1, Numpad3: 2, Numpad4: 3 }[e.code];
      if (k !== undefined) pick(k);
    };
    function stop() {
      clearTimeout(timer);
      document.removeEventListener("keydown", onKey);
    }
    function end() {
      stop();
      const base = st.wsum ? st.total / st.wsum : 50;
      done(clamp(cfg.finish ? cfg.finish(st, base) : base, 0, 100), st);
    }
    document.addEventListener("keydown", onKey);
    cleanup = stop;
    next();
  }
  // Resultado de un chequeo como paso con puntos
  const res = (c, okPts, koPts, okMsg, koMsg) => ({ pts: c.ok ? okPts : koPts, msg: `${c.txt}<br>${c.ok ? okMsg : koMsg}` });

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
    dressingRoom(el, cat, (st, spec) => {
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
        const prep = st.aiFit != null ? st.prep * 0.5 + st.aiFit * 0.5 : st.prep;
        done(prep * 0.5 + walk * 0.5);
      });
    }, prefix);
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
Devuelve JSON {"reinas":[{"id":"...","voz":"cómo habla (acento, registro, ritmo)","muletillas":["1 o 2 expresiones suyas, normales, nada de tópicos"],"drag":"su estilo drag en una frase","pasado":"de dónde viene y qué la trajo al drag (inventado)","ambicion":"qué quiere demostrar","miedo":"su inseguridad","trato":"cómo trata a las demás"}]}. Que todas suenen muy distintas entre sí y sean creíbles: de distintas partes de España, la mayoría con un habla natural, no exagerada; nada de nena ni mi arma.`,
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
    S.log = [...(S.log || []), `Ep.${S.ep}: ${t}`].slice(-30);
  }
  const memTxt = () => ((S.log || []).length ? `Lo que ha pasado hasta ahora (más reciente al final):\n${S.log.slice(-14).join("\n")}` : "");
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
  const aiSeason = () => `Temporada: ${S.season.name}. Episodio ${S.ep}. Quedan ${S.rivals.length + 1} reinas. La protagonista (la jugadora) es ${S.queen.name}. Resultados de ${S.queen.name}: ${Object.values(S.track.me || {}).join(", ") || "aún ninguno"}. ${nemStory()}`;
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
        `Escribes una conversación en grupo entre concursantes de Drag Race España en ${where}. Cada reina habla SOLO como ella misma, con su carácter, y reaccionan entre ellas: se dan la razón, se pican, cotillean, cambian de tema. Natural y creíble, nada exagerado. Nunca escribas lo que dice ${S.queen.name}. ${aiSeason()} ${memTxt()}`,
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
        `Hablas SOLO como ${q.name}, concursante de Drag Race España, en ${where}. ${aiProfile(q)} ${aiSeason()} Responde en JSON con: "respuesta" (lo que dice ${q.name}, máximo 35 palabras, en personaje), "tono" (cómo contesta ${q.name}: "amable", "neutral", "borde", "coqueto" o "amenaza"), "relacion" (número entero de -2 a 2: cuánto mejora o empeora su relación) y "jugadora" (cómo se ha comportado ${S.queen.name} en su último mensaje, teniendo en cuenta quién empezó: "amable", "neutral", "defiende" si contesta a una provocación, o "provoca" si ataca sin que la hayan provocado).`,
        `Conversación hasta ahora:\n${conv}\nResponde como ${q.name}.`,
        { json: true, max: 140 },
      );
      busy = false;
      turns++;
      if (!r || !r.respuesta) {
        hist.push({ me: false, t: pick1(["Ahora no tengo la cabeza para esto, cariño.", "Mira, luego hablamos, que tengo que acabar el look.", "Mmm... déjame pensarlo."]) });
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
      `Reto de esta semana: ${S.epNames[S.ep] || "reto"}. Nota de ${S.queen.name} en el reto: ${S.lastParts ? S.lastParts.reto : score}/100${S.lastParts && S.lastParts.pasarela != null ? `, pasarela: ${S.lastParts.pasarela}/100` : ""}. ${lk ? `Categoría de pasarela: ${lk.cat}. Su mejor pieza: ${lk.best}. Su peor pieza: ${lk.worst}.${lk.concepto ? ` Concepto que defendió: «${lk.concepto}».` : ""}${lk.critica ? ` Ya le dijeron en la pasarela: ${lk.critica}` : ""}` : ""} Su valoración global es ${label}. Devuelve JSON con "supreme", "ana" y "javis": la crítica de cada uno a ${S.queen.name}, en segunda persona, máximo 30 palabras cada una, coherentes con la nota. Supremme habla sobre todo del reto (aunque puede comentar el look), Ana sobre todo de la pasarela y el look (aunque puede comentar el reto), y los Javis (Javier Ambrossi o Javier Calvo, son jueces) dan su valoración desde la interpretación y la emoción. Son SOLO valoraciones: nunca digas posiciones ni resultados (ni ganadora, ni mejores, ni peores, ni bottom, ni lip sync, ni a salvo, ni en peligro); eso se anuncia después del Untucked. Tampoco menciones notas ni números.`,
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
      `${context}\nLo que ha dicho ${S.queen.name}: «${text}»\nDevuelve JSON con "nota" (0-100), "publico" (una de: "carcajada", "risas", "silencio", "abucheo") y "reaccion" (lo que dice Supremme justo después, máximo 20 palabras).`,
      { json: true, max: 120, temp: 0.7 },
    );
    if (!r) return null;
    return { nota: clamp(Math.round(Number.isFinite(+r.nota) ? +r.nota : 40), 0, 100), publico: String(r.publico || "risas"), reaccion: IA.clean(r.reaccion || "") };
  }
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
      if (j && j.reaccion && !cfg.inCharacter) log.push({ who: "Supremme", t: j.reaccion, cls: "host" });
      if (r.after) { const extra = await r.after(v, nota); if (extra) log.push(...[].concat(extra).filter(Boolean)); }
      round++;
      if (round < cfg.rounds.length) return draw();
      const avg = notes.reduce((a, b) => a + b, 0) / notes.length;
      const final = clamp(avg + (A(cfg.attr) - 5) * 2, 0, 100);
      el.innerHTML = `
        <div class="story-card live">
          <p class="eyebrow">${cfg.icon} ${esc(cfg.title)} · resultado</p>
          <div class="live-log">${log.map((m) => `<p class="lv ${m.cls}"><b>${esc(m.who)}</b>${esc(m.t)}</p>`).join("")}</div>
          
          <button class="btn btn-primary" id="lv-done">Continuar</button>
        </div>`;
      el.querySelector("#lv-done").addEventListener("click", () => done(final));
    }
    draw();
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
    const chars = shuffle(SNATCH_PERSONAJES).slice(0, 3);
    el.innerHTML = `
      <div class="story-card">
        <p class="eyebrow">🎭 Snatch Game en directo</p>
        <h3>¿A quién vas a interpretar?</h3>
        <p class="muted">Escribe el personaje que quieras y responderás a Supremme como si fueras esa persona.</p>
        <form class="ft-form"><input id="sn-own" maxlength="80" autocomplete="off" placeholder="Tu personaje..."><button class="btn btn-primary">¡A plató!</button></form>
        <p class="muted">o elige uno de estos:</p>
        <div class="choice-col">${chars.map((c, i) => `<button class="btn btn-ghost" data-c="${i}">${c.icon} ${esc(c.name)} <small>· ${esc(c.tono)}</small></button>`).join("")}</div>
      </div>`;
    const go = (name, tono) => start(name, tono);
    el.querySelectorAll("[data-c]").forEach((b) => b.addEventListener("click", () => { const c = chars[+b.dataset.c]; go(c.name, c.tono); }));
    el.querySelector(".ft-form").addEventListener("submit", (e) => { e.preventDefault(); const v = el.querySelector("#sn-own").value.trim(); if (v) go(v, "el de ese personaje"); });
    async function start(name, tono) {
      const rivals = shuffle(S.rivals).slice(0, 2);
      aiWait("Preparando el plató...", el);
      const plan = await IA.chat(
        `Eres la guionista del Snatch Game de Drag Race España: Supremme de Luxe hace preguntas absurdas a las concursantes, que imitan personajes. Los personajes son arquetipos y parodias inventadas, nunca personas reales. ${aiSeason()}`,
        `La protagonista ${S.queen.name} imita a: ${name} (tono ${tono}). Las rivales en el plató: ${rivals.map((q) => `${q.name} (${aiProfile(q)} ${idTxt(q)})`).join(" | ")}.
Elige un personaje-arquetipo gracioso para cada rival según su identidad, y escribe 4 preguntas de Supremme (máximo 20 palabras, absurdas y con chispa). Para cada pregunta, la respuesta de cada rival en personaje (SOLO las rivales, nunca ${S.queen.name}, que contesta la jugadora) (máximo 22 palabras; que alguna falle a veces).
Devuelve JSON {"rivales":[{"reina":"nombre","personaje":"..."}],"preguntas":[{"q":"...","respuestas":[{"reina":"nombre","t":"..."}]}]}`,
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
            `Eres la guionista del Snatch Game de Drag Race España. Supremme de Luxe presenta el concurso y las reinas están metidas en sus personajes. Nadie critica ni valora a nadie: todo es juego, chistes y pullas dentro del personaje. No pongas frases inventadas en boca de famosos reales: las reinas hablan como su versión cómica del personaje, sin citar frases reales.`,
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
    aiWait("Montando la escena...", el);
    IA.chat(
      `Eres la directora del reto de improvisación de Drag Race España: un grupo de reinas improvisa una escena cómica, cada una con un personaje. ${aiSeason()}`,
      `El grupo: ${S.queen.name} (la jugadora) y ${mates.map((q) => `${q.name} (${aiProfile(q)} ${idTxt(q)})`).join(" | ")}.
Inventa una escena cómica y concreta (lugar y conflicto), un personaje para cada rival que encaje con su identidad, y 3 personajes posibles para ${S.queen.name}. Cada personaje en una frase corta de 12 palabras como máximo.
Devuelve JSON {"escena":"premisa en 25 palabras","personajes":[{"reina":"nombre","personaje":"..."}],"opciones":["...","...","..."]}`,
      { json: true, max: 700, temp: 1 },
    ).then((plan) => {
      if (!plan || !plan.escena) return liveImproSolo(el, done);
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
            `Escena: ${scene}\nReparto: ${castTxt()}\nTranscripción:\n${transcript()}\nDevuelve JSON {"notas":[{"reina":"nombre","nota":0-100}],"supreme":"comentario de Supremme sobre la escena (máximo 30 palabras)","mejor":"nombre de la que más ha destacado"}`,
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
              ${r && r.supreme ? `<p class="lv host"><b>Supremme</b>${esc(IA.clean(str(r.supreme)))}</p>` : ""}
              <div class="impro-cast">${[{ q: S.queen, n: myN }, ...mates.map((q) => ({ q, n: notas[q.name] }))].map((x) => `<span><i style="background-image:url('${photo(x.q)}')"></i><b>${esc(x.q === S.queen ? "Tú" : x.q.name)}</b><small></small></span>`).join("")}</div>
              <button class="btn btn-primary" id="lv-done">Continuar</button>
            </div>`;
          el.querySelector("#lv-done").addEventListener("click", () => { if (final >= 80) growAttr(final > 90 ? "comedia" : "carisma"); done(final); });
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
Escribe: título, género, sinopsis, ${mates.length + 1} papeles (uno protagonista de peso grande, dos o tres de peso medio y el resto pequeño) y un guion de ${Math.max(9, mates.length * 2 + 3)} a ${Math.max(12, mates.length * 2 + 6)} líneas repartidas entre TODOS los papeles (el protagonista con 3 o 4 líneas, cada papel al menos con 1). Cada línea lleva el tono correcto según la acotación (dramatico, comico, contenido o exagerado), una acotación breve y una "clave": una palabra o expresión corta y memorable que aparece literalmente en esa línea.
Devuelve JSON {"titulo":"...","genero":"...","sinopsis":"...","papeles":[{"papel":"nombre del personaje","descripcion":"...","peso":"grande|medio|pequeño"}],"guion":[{"papel":"...","t":"texto de la línea","acotacion":"...","tono":"dramatico|comico|contenido|exagerado","clave":"..."}]}`,
      { json: true, max: 3600, temp: 1, timeout: 40000 },
    ).then((g) => {
      const roles = g && Array.isArray(g.papeles) ? g.papeles.filter((x) => x && x.papel).slice(0, mates.length + 1) : [];
      const lines = g && Array.isArray(g.guion) ? g.guion.filter((x) => x && x.papel && str(x.t).trim()) : [];
      if (roles.length < 2 || lines.length < 5) { mxActing.classic = true; return mxActing(el, (sc) => { mxActing.classic = false; done(sc); }); }
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
        el.querySelector("#lv-done").addEventListener("click", () => { if (score >= 85) growAttr("performance"); done(score); });
      }
      advance();
    }
  }
  function liveImproSolo(el, done) {
    const SEC = [["noticias", "🗞️ Noticias"], ["entrevista", "🎙️ Entrevista"], ["teletienda", "🛒 Teletienda"]];
    el.innerHTML = `<div class="story-card"><p class="eyebrow">📺 Improvisación en directo</p><h3>¿Qué sección conduces?</h3><div class="choice-col">${SEC.map(([k, t]) => `<button class="btn btn-ghost" data-s="${k}">${t}</button>`).join("")}</div></div>`;
    el.querySelectorAll("[data-s]").forEach((b) => b.addEventListener("click", async () => {
      const sec = b.dataset.s;
      const guest = pick1(S.rivals);
      aiWait("Preparando el plató...", el);
      const ev = await IA.chat("Eres la regidora de un programa de televisión improvisado en Drag Race España.", `La sección es ${sec}${sec === "entrevista" ? ` y la invitada es ${guest.name}` : ""}. Escribe 3 imprevistos o preguntas cortas (máximo 18 palabras cada una) que obliguen a la presentadora a improvisar. Devuelve JSON con "momentos": lista de 3 textos.`, { json: true, max: 200 });
      const moms = (ev && Array.isArray(ev.momentos) && ev.momentos.length >= 3 ? ev.momentos : ["El teleprompter se apaga en mitad de la frase.", "Se cae un decorado detrás de ti.", "La regidora te dice que te quedan 10 segundos."]).slice(0, 3).map(IA.clean);
      const rounds = moms.map((m) => ({
        prompt: `🔴 ${m}`,
        sub: "¡Estás en directo! ¿Qué dices?",
        ctx: `Improvisación en directo, sección ${sec}${sec === "entrevista" ? ` con la invitada ${guest.name}` : ""}. Imprevisto: ${m}`,
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
  const judgeLines = (r, a = "supreme", b = "ana", na = "Supremme", nb = "Ana Locking") =>
    `${r && r[a] ? `<p class="lv host"><b>${na}</b>${esc(IA.clean(str(r[a])))}</p>` : ""}${r && r[b] ? `<p class="lv host"><b>${nb}</b>${esc(IA.clean(str(r[b])))}</p>` : ""}`;
  function liveResult(el, eyebrow, html, score, then) {
    el.innerHTML = `<div class="story-card live"><p class="eyebrow">${eyebrow}</p>${html}<button class="btn btn-primary" id="lv-done">Continuar</button></div>`;
    el.querySelector("#lv-done").addEventListener("click", then);
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
    const fail = () => { mxRusical.classic = true; mxRusical(el, (sc) => { mxRusical.classic = false; done(sc); }); };
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
    el.querySelectorAll("[data-st]").forEach((b) => b.addEventListener("click", () => compose(inp.value.trim() || SUG[0], STY.find((s) => s[0] === b.dataset.st)[1].slice(3))));
    async function compose(band, style) {
      aiWait("La productora está montando la base...", el);
      const r = await IA.chat(
        `Eres la productora musical del reto Girl Groups de Drag Race España. Escribes letras de himno drag, pegadizas y con humor. ${aiSeason()}`,
        `Banda: «${band}», estilo ${style}. Integrantes: ${S.queen.name} (la jugadora) y ${mates.map((q) => `${q.name} (${idTxt(q) || aiProfile(q)})`).join(" | ")}.
Escribe el título del tema, el estribillo (4 versos) y una estrofa de 4 versos para cada rival, con la voz y el carácter de cada una. NO escribas la estrofa de ${S.queen.name}: la escribe la jugadora.
Devuelve JSON {"titulo":"...","estribillo":["...","...","...","..."],"estrofas":[{"reina":"nombre","versos":["...","...","...","..."]}]}`,
        { json: true, max: 1200, temp: 1 },
      );
      if (!r || !Array.isArray(r.estribillo)) { mxGirlGroups.classic = true; return mxGirlGroups(el, (sc) => { mxGirlGroups.classic = false; done(sc); }); }
      const coro = r.estribillo.slice(0, 4).map((v) => IA.clean(str(v)));
      const est = (Array.isArray(r.estrofas) ? r.estrofas : []).filter((x) => x && mates.some((q) => q.name === str(x.reina)) && Array.isArray(x.versos));
      const title = IA.clean(str(r.titulo)) || band;
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
      if (!mats) { mxMateriales.classic = true; return mxMateriales(el, (sc) => { mxMateriales.classic = false; done(sc); }); }
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
      "Creas personajes de ficción para el reto makeover de Drag Race España: personas que nunca han hecho drag y a las que una reina convierte en su familia drag.",
      `El makeover es: ${kind}. Inventa la persona que le toca a ${S.queen.name}: nombre inventado, quién es (oficio o relación), una historia breve (máximo 30 palabras), lo cómoda que está con el drag (baja, media o alta), su personalidad y lo primero que le dice a ${S.queen.name} (máximo 20 palabras).
Devuelve JSON {"nombre":"...","quien":"...","historia":"...","comodidad":"baja|media|alta","personalidad":"...","saludo":"..."}`,
      { json: true, max: 400, temp: 1 },
    ).then((m) => {
      if (!m || !m.nombre) { mxMakeover.classic = true; return mxMakeover(el, (sc) => { mxMakeover.classic = false; done(sc); }); }
      const who = IA.clean(str(m.nombre));
      const sys = `Hablas SOLO como ${who}, ${str(m.quien)}, que va a hacer un makeover drag con ${S.queen.name} en Drag Race España. Tu historia: ${str(m.historia)}. Personalidad: ${str(m.personalidad)}. Comodidad con el drag: ${str(m.comodidad)}. Contestas con naturalidad, máximo 25 palabras, y te vas abriendo si te tratan bien.`;
      const log = [{ who, t: IA.clean(str(m.saludo)) || "Hola... yo nunca he hecho esto." }];
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
      `Inventa un producto absurdo y gracioso, su marca inventada y lo que pide el cliente del anuncio (máximo 20 palabras).${mate ? ` El anuncio lo hacen en pareja ${S.queen.name} y ${mate.name}: en "idea" escribe lo que propone ${mate.name} para el anuncio, con su voz (máximo 25 palabras). ${aiProfile(mate)}` : ""}
Devuelve JSON {"producto":"...","marca":"...","descripcion":"máximo 25 palabras","cliente":"..."${mate ? ',"idea":"..."' : ""}}`,
      { json: true, max: 300, temp: 1.1 },
    ).then((p) => {
      if (!p || !p.producto) { mxPublicidad.classic = true; return mxPublicidad(el, (sc) => { mxPublicidad.classic = false; done(sc); }); }
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
        const slogan = el.querySelector("#pb-e").value.trim() || "(sin eslogan)";
        aiWait("Montando el anuncio...", el);
        const r = await IA.chat(
          "Eres el jurado de Drag Race España en el reto de publicidad: Supremme de Luxe y los Javis. Valoras el eslogan (pegadizo y camp), el guion (gracioso, claro, que venda el producto) y el humor drag. Exigentes: sin eslogan o con un guion vacío puntúa bajo.",
          `Producto: ${prod} de ${marca} (${str(p.descripcion)}). Pide el cliente: ${str(p.cliente)}.\n${mate ? `Lo graban en pareja ${S.queen.name} y ${mate.name}${p.idea ? ` (${mate.name} propuso: ${str(p.idea)})` : ""}. ` : ""}Eslogan de ${S.queen.name}: «${slogan}»\nGuion: «${g}»
Puntúa de 0 a 100. Devuelve JSON {"eslogan":0,"guion":0,"camp":0,"supreme":"comentario (máximo 25 palabras)","javis":"comentario de los Javis (máximo 25 palabras)"}`,
          { json: true, max: 350, temp: 0.6 },
        );
        const [c1, c2, c3] = nums(r, ["eslogan", "guion", "camp"]);
        const sc = clamp(Math.round(c1 * 0.3 + c2 * 0.4 + c3 * 0.3 + (A("carisma") - 5) * 1.5 + (A("comedia") - 5)), 0, 100);
        logEv(`Publicidad: ${S.queen.name} anuncia ${prod} con el eslogan «${slogan}» (nota ${sc})`);
        liveResult(el, `📺 ${esc(marca)} · el anuncio`, `<p class="rw-quote">«${esc(slogan)}»</p>${judgeLines(r, "supreme", "javis", "Supremme", "Los Javis")}`, sc, () => { if (sc >= 85) growAttr("carisma"); done(sc); });
      });
    });
  }

  // ------------------------------ Sistema Némesis ------------------------------
  // Memoria permanente entre temporadas: cada reina tiene rasgos, poder y cicatrices con las demás.
  // Lo que pasa aquí se recuerda en las siguientes temporadas (y en All Stars).
  const NEM_KEY = "dftc-nemesis";
  const Nem = {
    get() { const d = store.get(NEM_KEY, null) || {}; return { q: d.q || {}, f: d.f || {}, scars: d.scars || {}, known: d.known || [] }; },
    put(d) { store.set(NEM_KEY, d); },
    power(id) { return (this.get().q[id] || {}).power || 0; },
    titles(id) { return (this.get().q[id] || {}).titles || []; },
    addPower(id, n) {
      const d = this.get();
      const t = traitsOf(qById(id) || { id });
      if (n > 0 && t.car === "ambiciosa") n *= 2;
      d.q[id] = { ...(d.q[id] || {}), power: clamp(((d.q[id] || {}).power || 0) + n, 0, 10) };
      this.put(d);
    },
    feel(a, b) { return this.get().f[`${a}>${b}`] || 0; },
    addFeel(a, b, n) {
      const d = this.get();
      if (n < 0 && traitsOf(qById(a) || { id: a }).car === "rencorosa") n *= 2;
      const k = `${a}>${b}`;
      d.f[k] = clamp((d.f[k] || 0) + n, -5, 5);
      this.put(d);
    },
    scar(by, to, k) {
      const d = this.get();
      const key = [by, to].sort().join("|");
      d.scars[key] = [...(d.scars[key] || []), { by, to, k, s: S.season.name, sid: S.season.id, ep: S.ep }].slice(-8);
      this.put(d);
    },
    scarsOf(a, b) { return this.get().scars[[a, b].sort().join("|")] || []; },
    knows(id, slot) { return this.get().known.includes(`${id}:${slot}`); },
    learn(id, slot) {
      if (this.knows(id, slot)) return false;
      const d = this.get();
      d.known.push(`${id}:${slot}`);
      this.put(d);
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
  const RETO_CAT = { snatch: "comedia", roast: "comedia", impro: "comedia", publicidad: "comedia", rusical: "baile", equipos: "baile", lalaparuza: "baile", diseno: "costura", ball: "costura", makeover: "costura", actuacion: "comedia" };
  // Efecto de los rasgos y del poder en la nota de una reina
  function traitMod(q) {
    const t = traitsOf(q), cat = RETO_CAT[S.curTipo];
    let m = Math.min(5, Nem.power(q.id) * 0.6);
    if (cat && t.fort === cat) m += 9;
    if (cat && RASGOS.deb[t.deb].cat === cat) m -= 10;
    if (t.fort === "pasarela" && !(RETOS[S.curTipo] || {}).noRunway) m += 5;
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
            <p>Ha ido contando tus planes por el taller: <b>-5 en el próximo reto</b>. Esto no se va a olvidar, ni en esta temporada ni en las siguientes.</p>
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
        <p class="muted">Descubre sus puntos fuertes y débiles cotilleando, observando en el Untucked o gracias a tus aliadas. Todo lo que pasa se recuerda en las siguientes temporadas.</p>
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
    else if (nw >= 2 && rs >= 75) out.push(["ambrossi", `Otra semana arriba. Ya van ${nw} victorias y no aflojas.`]);
    S.lookTags = S.lookTags || [];
    const lt = S.lookTags.slice(-3);
    if (lt.length === 3 && lt.every((t) => t === lt[0])) out.push(["calvo", `Tercera semana seguida tirando de ${lt[0]}. Te queda bien, pero quiero ver otra faceta tuya.`]);
    const f = fame();
    const FAME_CRIT = {
      mean: "Fuera de este escenario das mucho que hablar. Aquí arriba también tienes que hacerlo.",
      kind: "Te veo ayudando a todas en el taller. Precioso, pero hoy necesitaba que te ayudaras a ti.",
      drama: "El drama del taller da mucho juego, pero no sube la nota. Recuérdalo.",
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
    return S.season.cast.length - 4 + (twistOf() === "repesca" ? 1 : 0);
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
          <p class="muted">El orden de los retos y las pasarelas es sorpresa: puede cambiar sobre la marcha. Luego vienen el reencuentro y la gran final. Si te eliminan antes, lo que no uses se queda en tu armario para la próxima temporada.</p>
          <p class="gold">${grant ? `💶 Producción te ingresa ${euros(grant)} para lo que te falta.` : "💶 Con tu armario y tus ahorros te llega: producción no pone nada esta vez."} Tienes <b class="closet-money">${euros(Closet.money)}</b>.</p>
          <p class="muted">🛑 Solo puedes comprar ahora. Lo que ganes en la temporada (minirretos, retos, corona) te servirá para la siguiente.</p>
          <button class="btn btn-primary" id="story-go">🛍️ Ir de compras</button>
        </div>`;
      $("#story-go").addEventListener("click", () => shopScreen(body(), then, true));
    });
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
            <button class="btn btn-primary" id="shop-done">${first ? "Cerrar maletas: ¡al taller!" : "Cerrar"}</button>
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
          return Toast.show("⚠️ ¿Cerrar maletas?", `Tienes ${nLooks} looks para ${plan.length} pasarelas. Después ya no podrás comprar: producción te prestará algo básico. Pulsa otra vez para entrar igualmente.`);
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
  const renderOf = (id) => { try { return (JSON.parse(localStorage.getItem(RENDERS_KEY)) || {})[id] || null; } catch (e) { return null; } };
  function saveRender(id, url) { if (!url) return; try { const m = JSON.parse(localStorage.getItem(RENDERS_KEY)) || {}; m[id] = url; localStorage.setItem(RENDERS_KEY, JSON.stringify(m)); } catch (e) {} }
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
      Closet.add(-r.cost);
      kill3d();
      sewingGame(host, r, (pul) => {
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
  const photoOf = (id) => { try { return (JSON.parse(localStorage.getItem(FOTOS_KEY)) || {})[id] || null; } catch (e) { return null; } };
  function savePhoto(id, src) {
    try { const m = JSON.parse(localStorage.getItem(FOTOS_KEY)) || {}; m[id] = src; localStorage.setItem(FOTOS_KEY, JSON.stringify(m)); return true; } catch (e) { return false; }
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

  // ------------------------------ Probador visual ------------------------------
  const skinMe = () => Doll.skinOf(S.queen.id);
  // El jurado (IA) valora si el look cuenta la temática; si no hay IA, se usa la valoración interna
  function judgeFit(st, cat) {
    if (typeof IA === "undefined" || !IA.ready()) return;
    const TH = themeOf(cat);
    IA.chat(
      "Eres el jurado de un concurso drag. Valoras con criterio de moda si un look encaja con la temática de la pasarela.",
      `Temática: «${cat}»${TH ? ` (${TH.d})` : ""}. Piezas del look: ${st.pieces.map((p) => p.n).join("; ")}. Devuelve JSON {"encaje": número de 0 a 100, "motivo": "una frase"}. 100 = lo clava; 50 = se entiende a medias; 0 = no tiene nada que ver.`,
      { json: true, max: 200, temp: 0.4, timeout: 12000 },
    ).then((r) => { const v = r && Number(r.encaje); if (Number.isFinite(v)) { st.aiFit = clamp(v <= 10 ? v * 10 : v, 0, 100); st.aiWhy = r.motivo || ""; } }).catch(() => {});
  }
  function dressingRoom(el, cat, done, prefix = "") {
    const TH = themeOf(cat);
    const fitsK = (k, it) => fitsRunway(k, it, cat);
    // Puntos de cada pieza: lo que encaje con la temática (interno) y lo espectacular que sea. Lo prestado puntúa poco
    const fitOf = (k, it) => { const f = fitScore(k, it, cat); return it.loan ? 4 + f * 5 : 4 + f * (10 + statOf(it)[0] * 2.6); };
    const IMG = pieceImg;
    const SL = [
      { k: "look", n: "El look", icon: "👗", items: ARMARIO.look.filter((x) => !x.rv || (TH && TH.rv)), base: "base-maniqui" },
      { k: "peluca", n: "La peluca", icon: "💇", items: ARMARIO.peluca, base: "base-cabeza" },
      { k: "zapatos", n: "Los tacones", icon: "👠", items: ARMARIO.zapatos, base: "base-peana" },
      { k: "acc", n: "El toque final", icon: "💄", items: ARMARIO.acc, base: "base-bandeja" },
    ];
    // Opciones: todo lo que tienes en tu armario (sin pistas de qué encaja) + un básico prestado por producción
    const opts = SL.map((sl) => {
      const own = sl.items.filter((x) => Closet.has(x.id) && !(sl.k === "look" && (S.usedLooks || []).includes(x.id)));
      const list = own.slice(0, 24);
      const loanPool = sl.items.filter((x) => !Closet.has(x.id) && !(S.usedLooks || []).includes(x.id) && statOf(x)[0] <= 2);
      const loan = pick1(loanPool.length ? loanPool : sl.items.filter((x) => !Closet.has(x.id)));
      if (loan) list.push({ ...loan, loan: true });
      return list;
    });
    const chosen = {}, st = { pieces: [], prepRaw: 0 };
    let slot = 0, over = false;
    const station = (k, tryIt) => {
      const sl = SL.find((x) => x.k === k);
      const it = tryIt || chosen[k];
      if (!tryIt && it && it.rv) return IMG(it.rv);
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
      const sl = SL[slot];
      el.innerHTML = `
        <div class="at">
          ${atelier()}
          <div class="at-rack">
            <div class="dr-steps">${SL.map((s2, i) => `<span class="${i < slot ? "done" : i === slot ? "on" : ""}">${s2.icon}</span>`).join("")}</div>
            <h4>${sl.icon} ${sl.n}</h4>
            <div class="at-opts ${opts[slot].length > 4 ? "many" : opts[slot].length > 3 ? "four" : ""}">${opts[slot].map((it, i) => `<button class="dr-opt at-opt ${it.rv ? "has-rv" : ""} ${it.loan ? "loan" : ""}" data-i="${i}" style="--i:${i}"><img src="${IMG(it.id)}" alt="">${it.rv ? `<img class="at-rv" src="${IMG(it.rv)}" alt="">` : ""}<span>${esc(it.n)}</span><small class="at-st">${it.loan ? "🔁 Prestado" : `👣${statOf(it)[1]}`}</small></button>`).join("")}</div>
          </div>
        </div>`;
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
      if (SL[slot].k === "look" && !it.loan) S.usedLooks = [...(S.usedLooks || []), it.id];
      st.pieces.push(it);
      st.prepRaw += fitOf(SL[slot].k, it);
      if (SL[slot].k === "look") st.onTheme = fitScore("look", it, cat) >= 0.6;
      st.revealImg = SL[slot].k === "look" && it.rv ? IMG(it.rv) : st.revealImg || null;
      if (SL[slot].k === "look" && it.rv) {
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
      finish();
    }
    function finish() {
      over = true;
      document.removeEventListener("keydown", onKey);
      st.prepRaw *= 3 / Math.max(3, st.pieces.length);
      closeHome(st);
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
      $("#dr-go").addEventListener("click", () => done(st, { pieces: { ...chosen } }));
    }
    const onKey = (e) => { const m = /^Digit([1-8])$/.exec(e.code); if (m) choose(+m[1] - 1); };
    document.addEventListener("keydown", onKey);
    cleanup = () => document.removeEventListener("keydown", onKey);
    render();
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
        "Eres el jurado de Drag Race España valorando una pasarela: Supremme de Luxe (espectáculo y actitud) y Ana Locking (moda, construcción y coherencia). Sois exigentes: un concepto genérico o que no tiene nada que ver con lo que lleva puntúa bajo.",
        `Categoría: «${cat}»${TH ? ` (${TH.d})` : ""}.${S.ballCtx ? ` ${S.ballCtx}` : ""} Lo que lleva: ${pieces.join(", ")}. Concepto que defiende: «${concept}». Su desfile: ${picks.join("; ")}.${flags.reveal ? " Hace un reveal." : ""}${anaAnswer ? ` ${anaAnswer} Tenlo en cuenta en la coherencia y en lo que dice Ana.` : ""}
Valora de 0 a 100: "concepto" (originalidad y fuerza de la idea), "coherencia" (si el concepto encaja con la categoría y con lo que lleva) y "desfile" (si los momentos elegidos cuentan esa historia). Añade "supreme" y "ana": una frase de cada una, máximo 25 palabras, dirigida a la reina.
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
    const genero = pick1([["telenovela", "sobre"], ["drama de época", "drama"], ["parodia de serie juvenil", "absurdo"], ["anuncio de teletienda", "sobre"]]);
    const partner = pick1(S.team) || pick1(S.rivals);
    const INT = [["sobre", "🎭 Sobreactuado"], ["drama", "😢 Dramático"], ["absurdo", "🤪 Absurdo"]];
    const beats = [
      "«¡Tú no eres mi madre! ¡Mi madre es la de la peluca rubia!»",
      "«Esta herencia es mía, y el cortijo también.»",
      "«No me mires así, que me derrito como un helado en agosto.»",
    ];
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
    const MODELS = [
      { n: "Tu padre", d: "Muy poco cómodo, cuerpo grande", comfort: "baja", body: "grande" },
      { n: "Un futbolista de tercera", d: "Comodidad media, espalda ancha", comfort: "media", body: "grande" },
      { n: "La técnica de sonido", d: "Encantada de la vida, cuerpo menudo", comfort: "alta", body: "menudo" },
      { n: "Tu abuela", d: "Comodidad alta, muy bajita", comfort: "alta", body: "menudo" },
    ];
    const model = pick1(MODELS);
    const steps = [
      () => ({
        q: `👥 Tu modelo: ${model.n}`,
        sub: `${model.d}. Tu Maquillaje: <b>${A("maquillaje")}</b>. ¿Cómo adaptas tu maquillaje?`,
        opts: [
          { t: "🪞 Copia exacta de mi cara", d: "Máximo parecido si se deja", go: () => (model.comfort === "alta" ? { pts: 94, msg: "¡Sois dos gotas de agua!" } : { pts: 42, msg: "Se siente disfrazado y se nota." }) },
          { t: "🎨 Mi paleta, adaptada a su cara", d: "Equilibrado", go: () => ({ pts: 78, msg: "Se ve el parecido sin forzar." }) },
          { t: "🌸 Suavizado: que brille él o ella", d: "Para modelos tímidos", go: () => (model.comfort === "baja" ? { pts: 92, msg: "Se siente cómodo y le brillan los ojos." } : { pts: 55, msg: "Queda mono, pero no parecéis familia." }) },
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
          { t: "🫶 Dejar que se luzca", d: "Carisma", go: () => res(check(["carisma"], 48), 85, 45, "El jurado se enamora de tu modelo.", "Se queda paralizado.") },
        ],
      }),
    ];
    runSteps(el, { title: `Makeover: ${model.n}`, icon: "💄", steps }, (sc) => { S.lastLook = { cat: "makeover: el look de familia", best: "el look de familia", worst: "el look de familia" }; done(sc); });
  }

  function mxImpro(el, done) {
    if (IA.ready() && !mxImpro.classic) return aiOrClassic(el, "Improvisación", "📺", () => liveImpro(el, done), () => { mxImpro.classic = true; mxImpro(el, (sc) => { mxImpro.classic = false; done(sc); }); });
    const EVENTS = [
      "El teleprompter se apaga en mitad de la noticia.",
      "Se cae un decorado detrás de ti.",
      "El invitado solo contesta con monosílabos.",
      "La regidora te hace señas de que te quedan 10 segundos.",
      "Un producto de la teletienda se rompe en directo.",
    ];
    const steps = [
      () => ({
        q: "📺 ¿Qué sección conduces?",
        opts: [
          { t: "🗞️ Noticias", d: "Seriedad con retranca", go: (s) => { s.sec = "noticias"; return {}; } },
          { t: "🎙️ Entrevista", d: "Todo depende del invitado", go: (s) => { s.sec = "entrevista"; return {}; } },
          { t: "🛒 Teletienda", d: "¡Vende, vende!", go: (s) => { s.sec = "teletienda"; return {}; } },
        ],
      }),
      ...shuffle(EVENTS).slice(0, 4).map((ev, n) => () => ({
        q: `🔴 En directo · imprevisto ${n + 1}/4`,
        sub: ev,
        opts: [
          { t: "😂 Aceptar el caos y hacer broma", d: "Comedia", go: () => { const c = check(["comedia"], 52); return res(c, 90, 35, "¡Lo conviertes en el mejor momento del programa!", "La broma no llega."); } },
          { t: "💎 Recomponerse con elegancia", d: "Carisma", go: () => { const c = check(["carisma"], 50); return res(c, 86, 40, "Profesional como una presentadora de toda la vida.", "Se te nota el apuro."); } },
        ],
      })),
    ];
    runSteps(el, { title: "Improvisación: en directo", icon: "📺", steps }, (sc, st) => { if (sc >= 80) growAttr(sc > 90 ? "comedia" : "carisma"); done(sc); });
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
  function mxLalaparuza(el, done) {
    const SONGS = [["balada", "🎹 Balada emocional", "carisma"], ["pop", "🎵 Pop up-tempo", "performance"], ["dance", "🔊 Dance / urbano", "performance"]];
    const pool = shuffle(S.rivals.slice());
    const rounds = Math.min(3, Math.max(1, Math.ceil(Math.log2(S.rivals.length + 1))));
    let r = 0;
    const profile = (q) => { const a = attrsOf(q); return a.carisma > a.performance ? "balada" : a.performance > a.carisma + 1 ? "dance" : "pop"; };
    const round = () => {
      const rival = pool[r % pool.length];
      el.innerHTML = "";
      runSteps(el, {
        title: `Lalaparuza · Ronda ${r + 1}/${rounds}`, icon: "🏆",
        steps: [() => ({
          q: `🥊 Te enfrentas a ${esc(rival.name)}`,
          sub: `Su punto fuerte parece: <b>${SONGS.find((s) => s[0] === profile(rival))[1]}</b>. Tus atributos: ${attrChips(["carisma", "performance"])}`,
          opts: SONGS.map(([k, t, at]) => ({ t, d: `Tira de ${ATTR_NAMES[at]}`, go: (s) => { s.song = t; s.bonus = (A(at) - 5) * 3 + (k === profile(rival) ? (A(at) >= 7 ? 12 : -8) : 4); return { msg: k === profile(rival) ? "Es justo su terreno... valiente." : "Buena elección: le sacas de su zona." }; } })),
        })],
        finish: () => 0,
      }, (_, st) => {
        el.innerHTML = "";
        runLipsync(el, rival, (won) => {
          if (won) {
            r++;
            Toast.show(`🏆 ¡Pasas de ronda!`, `${rival.name}, fuera del torneo`);
            if (r >= rounds) return done(90);
            return round();
          }
          done([40, 58, 76][r] || 40);
        }, st.song, st.bonus || 0);
      });
    };
    round();
  }

  // Solo para pruebas automatizadas: lanza un reto concreto
  const _test = (tipo, cb) => {
    if (cleanup) cleanup();
    body().innerHTML = `<div id="story-play"></div>`;
    RETOS[tipo].run($("#story-play"), (sc) => { cleanup = null; cb && cb(sc); window.__lastScore = sc; });
  };
  return { start, abandon, menu, exitToMenu, openShopModal, openBoard: () => S && openBoard(), preview, _test, lastEntryId: null };
})();
