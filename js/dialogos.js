// ---------------------------------------------------------------------------
// Diálogos del modo historia (entre retos).
// Son frases genéricas de juego, no citas reales: cámbialas como quieras.
// Marcadores: {yo} tu reina · {r1} {r2} compañeras · {fuera} última expulsada
//             {reto} reto de la semana · {temporada} nombre de la temporada
// ---------------------------------------------------------------------------
const PRESENTADORAS = {
  host: { name: "Supremme de Luxe", role: "Presentadora", img: "./images/hosts/supreme.png" },
  judge: { name: "Ana Locking", role: "Jueza", img: "./images/hosts/ana-locking.png" },
  ambrossi: { name: "Javier Ambrossi", role: "Jurado · Los Javis", img: "./images/hosts/javier-ambrossi.png" },
  calvo: { name: "Javier Calvo", role: "Jurado · Los Javis", img: "./images/hosts/javier-calvo.png", side: "right" },
};

const DIALOGOS = {
  bienvenida: [
    ["host", "¡Bienvenidas, reinas, a {temporada}! Aquí solo una se lleva la corona."],
    ["judge", "Queremos ver talento, carisma y mucha personalidad. Nada de medias tintas."],
  ],
  tallerTrasExpulsion: [
    ["r1", "Qué raro se hace el taller sin {fuera}... dejó su espejo lleno de purpurina."],
    ["r2", "Pues ya sabéis lo que toca: o espabilamos, o la siguiente es una de nosotras."],
    ["r1", "{yo}, ¿cómo lo llevas? Te vi muy tranquila en la pasarela."],
  ],
  tallerPrimerDia: [
    ["r1", "Madre mía, cuánta reina junta. ¿Tú de dónde vienes, {yo}?"],
    ["r2", "Da igual de dónde venga: aquí todas empezamos de cero."],
  ],
  // rel: cómo cambia tu relación con cada compañera (+ aliada, - rival)
  respuestas: [
    { txt: "He venido a por la corona.", reply: ["r2", "Uy, qué segura se la ve. Ya veremos en la pasarela."], bonus: 150, rel: { r2: -1 } },
    { txt: "Estoy nerviosa, pero con muchas ganas.", reply: ["r1", "Normal, reina. Los nervios se quitan con la primera pose."], bonus: 100, rel: { r1: 1 } },
    { txt: "Yo he venido a pasármelo bien.", reply: ["r2", "Eso es lo más importante... aunque ganar tampoco está mal."], bonus: 80, rel: { r1: 1, r2: 1 } },
  ],
  regreso: [
    ["host", "Reinas, antes de empezar... tengo una sorpresa."],
    ["host", "¡Os presento a una vieja conocida que vuelve a la competición!"],
    ["r1", "¡He vuelto, y esta vez vengo con todo! Preparaos, chicas."],
  ],
  // Untucked: charla tras la crítica. El tono depende de vuestra relación
  untucked: {
    tenso: {
      lines: [["r1", "{yo}, no me ha gustado nada lo que has dicho hoy en el taller."], ["r1", "Aquí todas nos jugamos lo mismo, ¿sabes?"]],
      choices: [
        { txt: "Tienes razón, lo siento. No iba a malas.", reply: ["r1", "Vale... te lo acepto. Pero que no se repita."], rel: { r1: 2 } },
        { txt: "Pues lo digo y lo mantengo, reina.", reply: ["r1", "Muy bien. Nos vemos en la pasarela."], rel: { r1: -1 }, bonus: 120 },
        { txt: "No voy a entrar en dramas hoy.", reply: ["r1", "Como quieras. Tú misma."], rel: {} },
      ],
    },
    amiga: {
      lines: [["r1", "¡{yo}! Qué bien has estado hoy, de verdad."], ["r1", "Si seguimos así, nos vemos las dos en la final."]],
      choices: [
        { txt: "¡Tú también! Somos un equipazo.", reply: ["r1", "Pues pacto de hermanas: nos cuidamos hasta el final."], rel: { r1: 1 } },
        { txt: "Gracias... pero aquí solo gana una.", reply: ["r1", "Ya... bueno, también es verdad."], rel: { r1: -1 }, bonus: 80 },
      ],
    },
    neutral: {
      lines: [["r1", "Oye, {yo}, ¿qué te han parecido las críticas de hoy?"]],
      choices: [
        { txt: "Justas. Hay que escuchar al jurado.", reply: ["r1", "Qué madura. Me caes bien."], rel: { r1: 1 } },
        { txt: "Algunas se han librado de milagro...", reply: ["r1", "¿Lo dices por mí? Ya hablaremos."], rel: { r1: -1 }, bonus: 60 },
        { txt: "Estoy agotada, mañana hablamos.", reply: ["r1", "Descansa, reina."], rel: {} },
      ],
    },
  },
  anuncio: [
    ["host", "Reinas, atención: el reto de esta semana es... ¡{reto}!"],
    ["host", "Quiero ver ideas claras y buena ejecución. Sorprendedme."],
  ],
  final: [
    ["host", "Hemos llegado a la gran final. Tres reinas, una corona."],
    ["judge", "Ha sido un camino largo. Ahora demostrad por qué estáis aquí."],
  ],
  critica: {
    win: [
      ["judge", "{yo}, esta semana lo has bordado. Concepto, acabado y actitud."],
      ["host", "¡Enhorabuena, eres la ganadora del reto!"],
    ],
    safe: [
      ["judge", "{yo}, correcto, pero me falta ese punto que te haga destacar."],
      ["host", "Estás a salvo. Puedes volver al taller."],
    ],
    bottom: [
      ["judge", "{yo}, esta semana no te he visto. Me ha faltado todo."],
      ["host", "Lo siento, estás en el bottom. Es hora de... ¡lip sync for your life!"],
    ],
  },
};

// ===========================================================================
// HISTORIA RAMIFICADA
// Frases de juego inventadas (no son citas reales). Cada banco tiene varias
// versiones y el juego elige al azar, así cada partida suena distinta.
// Marcadores extra: {r3} otra compañera · {top} ganadora del reto · {btm} otra del bottom
// ===========================================================================
const pick1 = (arr) => arr[Math.floor(Math.random() * arr.length)];

// Cómo arranca cada temporada y su giro especial
// Textos del modo historia (temporadas, taller, críticas, untucked...): viven en src/core/historia.ts
const TEMPORADAS_HISTORIA = DFTC.TEMPORADAS_HISTORIA;
const HISTORIA = DFTC.HISTORIA;

// ===========================================================================
// MEMORIA: las compañeras se acuerdan de lo que votaste o decidiste.
// gracias.justa  → la salvaste y no era la peor
// gracias.peor   → la salvaste siendo la peor (te lo agradece el doble)
// rencor.injusto → la condenaste sin ser la peor ("me echaste por miedo")
// rencor.justo   → la condenaste siendo la peor (duele, pero lo entiende)
// despedida      → All Stars: la que mandas a casa se despide
// ===========================================================================
const MEMORIA = {
  gracias: {
    justa: [
      { lines: [["r1", "{yo}, quería darte las gracias por salvarme el otro día."], ["r1", "Sé que había otras opciones. No lo olvidaré."]],
        choices: [
          { txt: "Te lo merecías, no hay nada que agradecer.", rel: { r1: 1 }, reply: ["r1", "Pues aquí tienes una amiga para lo que haga falta."] },
          { txt: "Ahora me debes una, eh.", rel: {}, bonus: 60, reply: ["r1", "Apuntado. Te la devolveré."] },
        ] },
      { lines: [["r1", "Oye, {yo}... lo de la votación. Gracias de verdad."]], after: 1 },
      { lines: [["r1", "Me salvaste delante de todas. Eso tiene mucho valor, {yo}."], ["r1", "Si algún día puedo hacer lo mismo por ti, cuenta con ello."]], after: 1 },
    ],
    peor: [
      { lines: [["r1", "{yo}... Las dos sabemos que esa semana fui la peor."], ["r1", "Y aun así me salvaste. No sé ni qué decirte."]],
        choices: [
          { txt: "Creo en ti. Sé que puedes dar mucho más.", rel: { r1: 2 }, reply: ["r1", "Te voy a demostrar que no te equivocaste. Te lo juro."] },
          { txt: "Tranquila, lo hice por estrategia.", rel: { r1: -1 }, bonus: 100, reply: ["r1", "Ah... vale. Por lo menos eres sincera."] },
        ] },
      { lines: [["r1", "Todavía no me creo que me salvaras siendo la peor, {yo}."], ["r1", "Estoy en deuda contigo. Para siempre."]], after: 2 },
      { lines: [["r1", "Me salvaste cuando nadie daba un duro por mí."], ["r1", "Hoy vengo a por todas... y parte de eso es gracias a ti."]], after: 2 },
    ],
  },
  rencor: {
    injusto: [
      { lines: [["r1", "{yo}, tenemos que hablar."], ["r1", "Yo no era la peor esa semana, y lo sabes. Me votaste porque me tienes miedo."]],
        choices: [
          { txt: "Tienes razón. Fue estrategia y lo siento.", rel: { r1: 1 }, reply: ["r1", "Por lo menos lo reconoces. Pero no se me olvida."] },
          { txt: "Pues sí, eres una amenaza. Es un cumplido.", rel: { r1: -1 }, bonus: 150, reply: ["r1", "Tomo nota. Ya hablaremos en la pasarela."] },
          { txt: "Voté lo que vi. No es nada personal.", rel: {}, reply: ["r1", "Para mí sí. Y eso no se olvida."] },
        ] },
      { lines: [["r1", "Qué valiente fuiste votándome a mí, {yo}. Con lo mal que lo hizo la otra..."], ["r1", "Que sepas que me he dado cuenta de tu jugada."]], after: -1 },
      { lines: [["r1", "Me mandaste al lip sync sin ser la peor, {yo}."], ["r1", "Lo respeto, pero no lo comparto."]],
        choices: [
          { txt: "No era miedo, era una decisión difícil.", rel: {}, reply: ["r1", "Difícil para ti. Para mí fue injusto."] },
          { txt: "Si te molesta, demuéstrame que me equivoqué.", rel: { r1: -1 }, bonus: 100, reply: ["r1", "Eso pienso hacer. Prepárate."] },
        ] },
    ],
    justo: [
      { lines: [["r1", "{yo}, lo de tu voto... me dolió."], ["r1", "Pero vale, esa semana fui la peor. Lo entiendo."]],
        choices: [
          { txt: "No fue fácil para mí, de verdad.", rel: { r1: 1 }, reply: ["r1", "Lo sé. Pelillos a la mar."] },
          { txt: "Es lo que había. No es nada personal.", rel: {}, reply: ["r1", "Ya... pero la próxima vez me toca a mí votar."] },
        ] },
      { lines: [["r1", "No te guardo rencor, {yo}. Votaste lo justo."], ["r1", "Pero que sepas que me ha dolido igual."]] },
      { lines: [["r1", "Esa semana me lo busqué yo sola, {yo}."], ["r1", "Aun así... me habría gustado que me salvaras."]], after: 0 },
    ],
  },
  despedida: {
    injusta: [
      [["r1", "¿En serio, {yo}? ¿A mí? Si la otra estaba muchísimo peor."], ["r1", "Me echas porque me tienes miedo. Que te vaya bonito."]],
      [["r1", "Todo el mundo ha visto que no era la peor. Me mandas a casa por estrategia."], ["r1", "Respeto tu decisión. No la comparto."]],
      [["r1", "Vale, {yo}. Ya he entendido quién eres de verdad."], ["r1", "Mucha suerte. De verdad."]],
    ],
    justa: [
      [["r1", "Lo entiendo, {yo}. Esta semana no he estado a la altura."], ["r1", "Gánalo todo, ¿vale? Hazlo por mí."]],
      [["r1", "Es justo. Me duele, pero es justo."], ["r1", "Ha sido un honor competir contigo, reina."]],
      [["r1", "No te preocupes, {yo}. Yo habría hecho lo mismo."], ["r1", "Nos vemos fuera. Con una copa, eso sí."]],
    ],
  },
};

// ===========================================================================
// CRÍTICAS DEL JURADO: se montan por piezas (reto + pasarela + veredicto),
// así cada crítica es distinta y habla de lo que has hecho de verdad.
// ===========================================================================
const JURADO = DFTC.JURADO;

// Snatch Game: personajes inventados (arquetipos, no personas reales)
const SNATCH_PERSONAJES = DFTC.SNATCH_PERSONAJES;
// Snatch Game en directo: celebridades para imitar (parodia cariñosa; las respuestas las escribe la jugadora)
const SNATCH_FAMOSOS = [
  { icon: "💃", name: "Lola Flores", tono: "copla, genio y taconeo" },
  { icon: "🎙️", name: "Rocío Jurado", tono: "diva de la canción española" },
  { icon: "🎶", name: "Raffaella Carrà", tono: "italiana, pop y fiesta" },
  { icon: "🌹", name: "Sara Montiel", tono: "glamour de cine antiguo" },
  { icon: "🐆", name: "Mónica Naranjo", tono: "intensa y operística" },
  { icon: "🖤", name: "Alaska", tono: "moderna, seca y con ironía" },
  { icon: "🎤", name: "Rosa López", tono: "dulce, emotiva y de Eurovisión" },
  { icon: "🔮", name: "Rappel", tono: "vidente con túnica" },
  { icon: "🥁", name: "Chiquito de la Calzada", tono: "chistes imposibles y palabras inventadas" },
  { icon: "🎤", name: "Massiel", tono: "festivalera y sin filtro" },
  { icon: "🔥", name: "Lola Índigo", tono: "pop, baile y actitud" },
  { icon: "💿", name: "Rosalía", tono: "motomami y flamenco urbano" },
  { icon: "💋", name: "Marilyn Monroe", tono: "susurrante y coqueta" },
  { icon: "🪩", name: "Cher", tono: "diva eterna" },
  { icon: "👠", name: "Paquita Salas", tono: "representante castiza (personaje de ficción)" },
  { icon: "🧜", name: "Carmen Sevilla", tono: "entrañable y despistada" },
];
const SNATCH_PREGUNTAS = DFTC.SNATCH_PREGUNTAS;
const SNATCH_PLANAS = DFTC.SNATCH_PLANAS;

// ===========================================================================
// ROLES DETRÁS DE CÁMARAS: a cada reina se le asigna uno al empezar la
// temporada. Se descubren poco a poco (escenas, confesionario, untucked).
// r1 = la reina del rol, r2 = otra compañera.
// ===========================================================================
const ROLES_HISTORIA = DFTC.ROLES_HISTORIA;
const ROLES_ORDEN = DFTC.ROLES_ORDEN;

// Aviso de la metemierdas (pasiva): va contando cosas de ti
const CIZANA_AVISOS = [
  "{r1} le ha ido con cuentos a {r2} sobre ti",
  "{r1} ha contado a {r2} algo que dijiste en el hotel",
  "{r1} le ha dicho a {r2} que la criticas a sus espaldas",
];
// Sabotaje de la villana (pasiva)
const VILLANA_AVISOS = [
  "Alguien te ha escondido el pegamento de pestañas",
  "Tu puesto aparece revuelto y te falta material",
  "Alguien ha descosido un poco tu look...",
];

// ------------------------------- Reencuentro --------------------------------
const REENCUENTRO = DFTC.REENCUENTRO;

// ------------------------------- Final ------------------------------------
const FINAL_SORTEO = DFTC.FINAL_SORTEO;

// ------------------------------- Capitanas ----------------------------------
const CAPITANAS = {
  intro: [
    [["host", "Reinas, esta semana trabajaréis en equipos. Pero antes... ¡minirreto!"], ["host", "Las dos ganadoras serán las capitanas y elegirán a su equipo."]],
    [["host", "¡Minirreto! Las dos mejores serán capitanas."], ["r1", "Por favor, que no me toque elegir, que lo paso fatal."]],
  ],
  miniTitulos: ["¡Posa con el flash!", "¡Pelucas al aire!", "¡Selfie de lujo!", "¡Rápidas como el rayo!"],
};

// ------------------------------- Nuevos retos -------------------------------
const COMEDIA = DFTC.COMEDIA;
const ROAST = DFTC.ROAST;
const GUION = [
  ["¡No puedes dejarme así, Rodolfo! ¡Llevo tu ___ en el bolso!", "anillo", ["bocadillo", "pasaporte"]],
  ["Detective, el asesino estaba en la ___ con una peluca rubia.", "biblioteca", ["piscina", "nevera"]],
  ["Este perfume se llama ___, y huele a victoria.", "Corona", ["Lunes", "Garbanzo"]],
  ["Mamá, papá: tengo algo que deciros. ¡Me voy a ___!", "París", ["dormir", "Cuenca"]],
  ["La reina del desierto nunca ___, solo brilla.", "suda", ["canta", "come"]],
  ["Si me quieres de verdad, cómprame un ___ de purpurina.", "castillo", ["pañuelo", "yogur"]],
  ["Houston, tenemos un problema: se ha acabado el ___.", "pegamento", ["oxígeno", "café"]],
  ["¡Soy la heredera de la fortuna ___ y exijo respeto!", "Von Lentejuela", ["Martínez", "del Pozo"]],
  ["En este hospital solo se cura con ___ y tacones.", "amor", ["jarabe", "pan"]],
];

// ===========================================================================
// ALIANZAS: las concursantes forman grupos de 3 o 4 que se apoyan entre ellas
// y chocan con los demás. r1 = de un grupo, r2 = del otro (o compañera).
// {g1} = nombre de su grupo, {g2} = el del otro grupo
// ===========================================================================
const GRUPOS = {
  nombres: [
    { name: "Las del Fondo", icon: "🖤" }, { name: "El Clan del Glitter", icon: "✨" }, { name: "Las Divinas", icon: "💜" },
    { name: "La Cofradía del Tacón", icon: "👠" }, { name: "Las Folclóricas", icon: "🌹" }, { name: "Team Purpurina", icon: "🌸" },
  ],
  formacion: [
    [["host", "Una semana juntas y ya se han formado bandos en el taller. Lo veo todo, reinas."], ["r1", "Esto no son bandos, Supremme. Son... afinidades."], ["r2", "Afinidades con nombre y todo, sí."]],
    [["r1", "Bueno, que quede claro: nosotras somos {g1} y nos cubrimos las espaldas."], ["r2", "Pues nosotras somos {g2}. Y no necesitamos a nadie."], ["host", "Ay, qué ilusión. Esto se pone interesante."]],
  ],
  invitacion: [
    [["r1", "{yo}, te lo digo claro: te queremos en {g1}. Juntas llegamos más lejos."]],
    [["r1", "Oye, {yo}... Hemos hablado entre nosotras y queremos que estés con {g1}. ¿Te vienes?"]],
  ],
  choque: [
    { lines: [["r1", "¿Otra vez {g2} ocupando todos los espejos? Qué casualidad."], ["r2", "Llegamos antes. Si {g1} no madruga, no es culpa nuestra."], ["r1", "Madrugar para copiar looks, eso sí sabéis."]] },
    { lines: [["r2", "He oído a {g1} criticar mi look del otro día. Que lo digan a la cara."], ["r1", "Te lo digo a la cara: parecía la cortina de un hotel de los noventa."], ["host", "Uy, uy. Esto no me lo pierdo."]] },
    { lines: [["r1", "Ayer en el Untucked {g2} votaba en bloque. Eso es jugar sucio."], ["r2", "Eso es tener amigas. Búscate unas."]] },
    { lines: [["r2", "Mira, {g1} se cree que manda en el taller."], ["r1", "No lo creemos. Lo sabemos."], ["r2", "Pues a ver cuánto os dura cuando os toque el lip sync."]] },
  ],
  apoyo: [
    [["r1", "{yo}, que no se te olvide: {g1} está contigo. Hoy vas a brillar."], ["r2", "Te he dejado mi pegamento de pestañas en tu puesto. Del bueno."]],
    [["r1", "Grupo, reunión rápida. {yo}, ¿qué necesitas esta semana?"], ["me", "Un milagro y unas pinzas."], ["r1", "Las pinzas te las dejo yo. El milagro lo pones tú."]],
    [["r2", "Hemos hablado y esta semana te ayudamos con el acabado del look, {yo}."], ["r1", "Para eso estamos. {g1} no deja a nadie atrás."]],
  ],
  roce: [
    [["r1", "{yo}, una cosa... ¿por qué no me defendiste ayer? Somos del mismo grupo."]],
    [["r1", "Me han dicho que hablabas mucho con {g2}. ¿Te estás cambiando de bando?"]],
  ],
};

// T5: grabación de la eliminada destapando a quién deja su medio corazón
// r1 = la eliminada, {dest} = quien lo recibe
const CORAZON_VIDEO = {
  intro: [
    [["host", "Reinas, antes de seguir... La semana pasada una compañera nos dejó algo grabado."], ["host", "Dale al play."]],
    [["host", "Tenemos una grabación de la semana pasada. Atentas, que aquí se decide medio corazón."]],
    [["host", "Antes de las críticas, un mensaje de alguien que ya no está entre nosotras..."]],
  ],
  "cariño": [
    [["r1", "📼 Hola, chicas. Si estáis viendo esto es que me he ido a casa..."], ["r1", "📼 Mi medio corazón se lo dejo a alguien que me ha cuidado desde el primer día: ¡{dest}!"]],
    [["r1", "📼 No os pongáis a llorar, que se os corre el rímel."], ["r1", "📼 Mi medio corazón es para {dest}. Porque te lo mereces y porque te quiero, pesada."]],
    [["r1", "📼 Me voy con pena, pero con la cabeza alta."], ["r1", "📼 Y dejo mi medio corazón a {dest}. Gana esto por las dos."]],
  ],
  estrategia: [
    [["r1", "📼 Bueno, reinas. Aquí va mi última jugada."], ["r1", "📼 Mi medio corazón se lo dejo a... {dest}. Úsalo bien, que no te lo regalo por guapa."]],
    [["r1", "📼 Lo he pensado mucho. Mucho, mucho."], ["r1", "📼 {dest}, el medio corazón es tuyo. Y las demás, que se aguanten."]],
    [["r1", "📼 Sé que esto va a levantar ampollas..."], ["r1", "📼 Mi medio corazón es para {dest}. Sorpresa."]],
  ],
};

// Improvisación: presentar un programa en directo sin cortar el ritmo
const IMPRO = [
  ["Tu compañera se queda en blanco en directo", ["¡Y aquí vemos a mi compañera haciendo un minuto de silencio por su guion!", "Eh... ¿seguimos?", "(Quedarte callada tú también)"]],
  ["Se cae un foco en mitad del plató", ["¡Señoras y señores, eso es lo que llamamos un momento estelar!", "Uy, qué susto", "¿Paramos la grabación?"]],
  ["Entra una llamada de una espectadora enfadada", ["Cariño, si llamas para quejarte de mi peluca, ponte a la cola", "Hola, ¿qué tal?", "No sé qué decirle, señora"]],
  ["Toca la sección de cocina y no hay ingredientes", ["Hoy cocinamos aire con sal. Plato de temporada", "Pues no hay nada", "Nos saltamos la sección"]],
  ["La invitada no habla español", ["Traduzco yo: dice que soy la más guapa del plató", "¿Alguien traduce?", "Sorry, no English"]],
  ["Hay que dar paso a publicidad sin avisar", ["Y ahora, publicidad... que las pelucas no se pagan solas", "Vamos a publicidad", "¿Ya?"]],
  ["El horóscopo en directo", ["Aries: hoy el universo te dice que te compres unos tacones. Todos los signos, en realidad", "Aries tendrá un buen día", "No creo en el horóscopo"]],
  ["Tu compañera te pisa una frase", ["Qué bien, un dúo. Cantadlo conmigo en casa", "Perdona, hablaba yo", "(Mirarla mal)"]],
];

// ===========================================================================
// LOS JAVIS: visitan el taller, anuncian minirretos y opinan en el jurado.
// Hablan como jurado del juego (frases inventadas, no citas reales).
// ===========================================================================
const JAVIS = {
  taller: [
    [["host", "Reinas, hoy tenemos visita en el taller..."], ["ambrossi", "¡Hola, hola! ¿Se puede? Venimos a cotillear."], ["calvo", "A cotillear y a ayudar. Sobre todo a cotillear."]],
    [["calvo", "¡Pero qué taller más bonito! Esto parece un camerino de verdad."], ["ambrossi", "Y a pegamento de pestañas. Mucho pegamento."], ["r1", "¡Los Javis! Me tiemblan las piernas."]],
    [["ambrossi", "Venimos a ver cómo lo lleváis. {yo}, cuéntame qué estás preparando."], ["me", "Algo que os va a encantar... espero."], ["calvo", "Con ese 'espero' ya me has conquistado."]],
    [["calvo", "¿Sabéis qué nos gusta más de esta temporada? Que no os parecéis a nadie."], ["ambrossi", "Así que no empecéis a copiaros ahora, ¿eh?"]],
    [["ambrossi", "{r1}, ¿eso es lo que vas a llevar?"], ["r1", "Eh... ¿sí?"], ["calvo", "No es una crítica, es curiosidad. Mucha curiosidad."], ["r2", "(Eso era una crítica)"]],
    [["calvo", "Hoy no venimos como jurado, venimos como fans."], ["ambrossi", "Bueno, un poco como jurado también. Vamos tomando nota."], ["host", "Ya lo habéis oído, reinas. Cuidadito."]],
  ],
  consejo: [
    { lines: [["ambrossi", "{yo}, te voy a dar un consejo que nadie te ha pedido."], ["calvo", "Él es así, lo hace con todas."], ["ambrossi", "No escondas lo que te hace diferente. Justo eso es lo que queremos ver."]],
      choices: [
        { txt: "Gracias, Javi. Voy a arriesgar.", adv: 4, reply: ["calvo", "¡Eso! Arriesga, que para ir a lo seguro ya hay otros programas."] },
        { txt: "Me da miedo que no se entienda.", adv: 1, reply: ["ambrossi", "Si lo haces con verdad, se entiende. Siempre."] },
      ] },
    { lines: [["calvo", "{yo}, una pregunta: ¿qué quieres que piense la gente cuando te vea salir?"], ["me", "Pues... que soy una estrella."], ["calvo", "Vale. Pues ahora hazlo, no lo digas."]],
      choices: [
        { txt: "Anotado. Menos hablar, más brillar.", adv: 3, reply: ["ambrossi", "Nos vamos a acordar de esta frase."] },
        { txt: "¿Y si no me sale?", reply: ["calvo", "Pues que te salga otra cosa, pero que sea tuya."] },
      ] },
  ],
  mini: [
    [["calvo", "Hoy el minirreto lo presentamos nosotros. ¡Qué ilusión!"], ["ambrossi", "Y el premio también lo damos nosotros, así que portaos bien."]],
    [["ambrossi", "¿Preparadas para el minirreto? Nosotros no, pero vosotras sí."]],
  ],
  critica: {
    top: [
      [["calvo", "Yo me he emocionado. Y no me emociono con cualquier cosa."], ["ambrossi", "Yo sí, pero hoy con razón."]],
      [["ambrossi", "Esto es lo que venimos a ver a este programa. Gracias, {yo}."]],
      [["calvo", "Tienes una verdad que traspasa la pantalla, {yo}."]],
    ],
    mid: [
      [["ambrossi", "Hay algo muy bonito ahí, pero todavía no lo has sacado del todo."], ["calvo", "Estás a un paso. Y ese paso es el que da miedo."]],
      [["calvo", "A mí me ha gustado, pero me he quedado con ganas de más."]],
      [["ambrossi", "Te hemos visto dudar. Y cuando dudas, se nota desde aquí."]],
    ],
    low: [
      [["ambrossi", "{yo}, te queremos mucho, pero hoy no te hemos reconocido."], ["calvo", "Y eso es lo que más nos duele."]],
      [["calvo", "No sé qué ha pasado esta semana, pero no eras tú."]],
      [["ambrossi", "Creo que te has puesto un techo tú sola. Rómpelo."]],
    ],
  },
  final: [
    [["ambrossi", "Pase lo que pase hoy, ya sois parte de la historia de este programa."], ["calvo", "Y nosotros somos muy fans. Que lo sepáis."]],
    [["calvo", "Estoy nerviosísimo. Más que vosotras, creo."], ["ambrossi", "Eso es imposible, mírales las piernas."]],
  ],
  reencuentro: [
    [["ambrossi", "¡Qué ganas teníamos de veros a todas juntas otra vez!"], ["calvo", "Y de ver los reencuentros incómodos. Esos también."]],
  ],
  untucked: [
    [["calvo", "(Entrando en el Untucked) Solo venimos a por hielo, seguid a lo vuestro."], ["ambrossi", "Pero hablad alto, que no oímos bien."]],
  ],
};
// Los Javis también pasan por el taller algunas semanas
// (Los Javis ya no abren el taller: entra Supremme tras la sirena)

// Untucked: das las gracias a quien te salvó con su corazón
const GRACIAS_CORAZON = [
  [["me", "{r1}... no sé ni qué decirte. Me has salvado."], ["r1", "No digas nada. Tú habrías hecho lo mismo. ¿Verdad? ¿VERDAD?"]],
  [["me", "Ven aquí, que te tengo que dar un abrazo."], ["r1", "Cuidado con la peluca, que es prestada."], ["me", "Gracias de verdad, {r1}."]],
  [["r1", "Bueno, bueno... ¿no tienes nada que decirme?"], ["me", "¡Gracias! Me has salvado la vida. Literalmente."], ["r1", "Eso quería oír."]],
];

// ===========================================================================
// ESTILISMO DE PASARELA: piezas para montar el look de cada categoría.
// style = estética de la pieza; tags = categorías en las que encaja de lleno.
// ===========================================================================
const ESTILO_CATS = {
  "Rojo pasión": ["glam", "clasico"], "Brilla, brilla": ["glam", "futur"], "Realeza": ["clasico", "glam"],
  "Animal print": ["street", "glam"], "Años 80": ["retro", "street"], "Futurista": ["futur"],
  "Flores y más flores": ["natural", "folk"], "Blanco y negro": ["clasico", "futur"], "Look de gala": ["clasico", "glam"],
  "Folclore reinventado": ["folk", "retro"],
};
const ESTILO_NOMBRES = { glam: "Glam", retro: "Retro", street: "Callejero", clasico: "Clásico", futur: "Futurista", folk: "Folclórico", natural: "Natural" };
const ESTILO_PIEZAS = {
  peluca: { icon: "💇", name: "Peluca", items: [
    { n: "Melena roja de fuego", c: "#e0242f", s: "glam", t: ["Rojo pasión"] },
    { n: "Cardado XXL", c: "#f2b33d", s: "retro", t: ["Años 80"] },
    { n: "Moño con peineta", c: "#2b1a14", s: "folk", t: ["Folclore reinventado"] },
    { n: "Bob plateado", c: "#c9d3e0", s: "futur", t: ["Futurista", "Brilla, brilla"] },
    { n: "Rizos rubios de reina", c: "#f5d97a", s: "clasico", t: ["Realeza", "Look de gala"] },
    { n: "Coleta de leopardo", c: "#c98b3a", s: "street", t: ["Animal print"] },
    { n: "Corona de flores", c: "#f28fb4", s: "natural", t: ["Flores y más flores"] },
    { n: "Pixie bicolor", c: "#222222", s: "clasico", t: ["Blanco y negro"] },
    { n: "Ondas al agua", c: "#8a4b2a", s: "glam", t: ["Look de gala"] },
    { n: "Tupé ochentero", c: "#ff5fa2", s: "retro", t: ["Años 80"] },
    { n: "Rastas de colores", c: "#6ad06a", s: "street", t: [] },
  ] },
  look: { icon: "👗", name: "Look", items: [
    { n: "Vestido de lentejuela roja", c: "#d8182b", s: "glam", t: ["Rojo pasión", "Brilla, brilla"] },
    { n: "Chaqueta de hombreras neón", c: "#ff3dcf", s: "retro", t: ["Años 80"] },
    { n: "Mono de látex plateado", c: "#b8c4d4", s: "futur", t: ["Futurista"] },
    { n: "Capa de terciopelo y armiño", c: "#5a1a6e", s: "clasico", t: ["Realeza"] },
    { n: "Body de leopardo", c: "#c98b3a", s: "street", t: ["Animal print"] },
    { n: "Traje de flamenca", c: "#e03a3a", s: "folk", t: ["Folclore reinventado", "Rojo pasión"] },
    { n: "Vestido de flores bordadas", c: "#ff9ec7", s: "natural", t: ["Flores y más flores"] },
    { n: "Esmoquin bicolor", c: "#111111", s: "clasico", t: ["Blanco y negro"] },
    { n: "Vestido de gala con cola", c: "#1d2b6b", s: "clasico", t: ["Look de gala"] },
    { n: "Traje de cristales", c: "#e8f4ff", s: "glam", t: ["Brilla, brilla"] },
    { n: "Chándal de pedrería", c: "#7a7a7a", s: "street", t: [] },
  ] },
  zapatos: { icon: "👠", name: "Zapatos", items: [
    { n: "Stilettos rojos", c: "#d8182b", s: "glam", t: ["Rojo pasión"] },
    { n: "Plataformas de colores", c: "#ffb800", s: "retro", t: ["Años 80"] },
    { n: "Botas de espejo", c: "#cfd8e3", s: "futur", t: ["Futurista", "Brilla, brilla"] },
    { n: "Salones de raso", c: "#f3e6d0", s: "clasico", t: ["Look de gala", "Realeza"] },
    { n: "Botas de leopardo", c: "#c98b3a", s: "street", t: ["Animal print"] },
    { n: "Zapato de flamenca", c: "#8b1a1a", s: "folk", t: ["Folclore reinventado"] },
    { n: "Sandalias con flores", c: "#ffc2d9", s: "natural", t: ["Flores y más flores"] },
    { n: "Botines blanco y negro", c: "#444444", s: "clasico", t: ["Blanco y negro"] },
    { n: "Zapatillas de deporte", c: "#ffffff", s: "street", t: [] },
  ] },
  accesorio: { icon: "💍", name: "Accesorio", items: [
    { n: "Abanico rojo", c: "#d8182b", s: "folk", t: ["Rojo pasión", "Folclore reinventado"] },
    { n: "Corona de pedrería", c: "#ffd34d", s: "clasico", t: ["Realeza"] },
    { n: "Gafas de visera láser", c: "#6ee7ff", s: "futur", t: ["Futurista"] },
    { n: "Pendientes de aro XXL", c: "#ffb800", s: "retro", t: ["Años 80"] },
    { n: "Guantes de leopardo", c: "#c98b3a", s: "street", t: ["Animal print"] },
    { n: "Ramo de flores", c: "#ff7aa8", s: "natural", t: ["Flores y más flores"] },
    { n: "Collar de perlas", c: "#f5f0e6", s: "clasico", t: ["Blanco y negro", "Look de gala"] },
    { n: "Bolso de purpurina", c: "#ff4fd8", s: "glam", t: ["Brilla, brilla"] },
    { n: "Mantón de Manila", c: "#ff6f4f", s: "folk", t: ["Folclore reinventado", "Flores y más flores"] },
    { n: "Riñonera fluorescente", c: "#b6ff3d", s: "street", t: [] },
  ] },
};
// Comentarios del jurado sobre el look ({pieza} y {cat} se rellenan)
const ESTILO_CRITICA = DFTC.ESTILO_CRITICA;

// Armario con fotos reales (images/armario/<id>.webp)
const ARMARIO = DFTC.ARMARIO;

// Colección nivel USA

// Pasarelas temáticas (fotos)
const TEMAS_PASARELA = DFTC.TEMAS_PASARELA.map((t) => ({ ...t }));

// Pelucas temáticas 2

// Reveals

// Estadísticas del armario: [impacto 1-5, movimiento 1-5]
const ARMARIO_STATS = DFTC.ARMARIO_STATS;

// ------------------------------ Fama y némesis ------------------------------
// La fama sale de cómo te comportas en el taller; la némesis, de tus choques
const FAMA = {
  kind: {
    n: "La madre del taller", icon: "🤱",
    saludo: ["{yo}, ¿tienes un minuto? Es que tú siempre sabes qué decir.", "Ay, {yo}, contigo da gusto hablar.", "Todas dicen que eres la que más cuida al grupo. Y se nota."],
    reaccion: [
      { lines: [["r1", "{yo}, necesito ayuda con el look de esta semana. Eres la única que no me va a juzgar."]], choices: [
        { txt: "Ven, que te lo arreglo yo en un momento.", rel: { r1: 1 }, persona: "kind", reply: ["r1", "Eres un sol. Te debo una."] },
        { txt: "Hoy no puedo, que también tengo lo mío.", persona: "focus", adv: 2, reply: ["r1", "Vale, vale... lo entiendo."] },
      ] },
      { lines: [["r1", "Me han dicho que tú eres la que pone paz. ¿Me ayudas a hablar con {r2}?"]], choices: [
        { txt: "Claro, vamos juntas.", rel: { r1: 1, r2: 1 }, persona: "kind", reply: ["r2", "Vale... os escucho."] },
        { txt: "No me meto en lo vuestro.", persona: "focus", reply: ["r1", "Pues pensaba que eras otra cosa."] },
      ] },
    ],
  },
  mean: {
    n: "La villana", icon: "😈",
    saludo: ["Uy, {yo}... ¿vienes en son de paz o a morder?", "Tranquila, que ya me aparto. No vaya a ser.", "Dicen que vienes muy competitiva, {yo}."],
    reaccion: [
      { lines: [["r1", "{yo}, algunas comentan que esta semana te has pasado con tus comentarios."], ["r2", "Te lo decimos para que lo sepas, sin más."]], choices: [
        { txt: "Pues que me lo digan a la cara.", rel: { r1: -1, r2: -1 }, persona: "mean", bonus: 200, reply: ["r1", "Pues eso hacemos, a la cara."] },
        { txt: "Igual me he pasado. Lo siento.", rel: { r1: 1 }, persona: "kind", reply: ["r1", "Vaya. Eso no me lo esperaba."] },
      ] },
      { lines: [["r1", "Dicen que vienes muy competitiva. ¿Es verdad?"]], choices: [
        { txt: "Voy a por la corona. Si te pillo en medio...", persona: "mean", bonus: 150, rel: { r1: -1 }, reply: ["r1", "Muy bien. Que gane la mejor."] },
        { txt: "Qué va, son cosas que se inventan.", reply: ["r1", "Ya... ya veremos."] },
      ] },
    ],
  },
  drama: {
    n: "La reina del drama", icon: "🍿",
    saludo: ["¡{yo}! Cuéntame, que tú siempre sabes lo último.", "Ya estamos... ¿qué ha pasado ahora?", "Contigo nunca se aburre una, eh."],
    reaccion: [
      { lines: [["r1", "{yo}, dicen que el cotilleo de ayer salió de ti. ¿Fuiste tú?"]], choices: [
        { txt: "Yo solo digo lo que todas piensan.", persona: "drama", bonus: 200, rel: { r1: -1 }, reply: ["r1", "Pues piénsalo un poquito más antes."] },
        { txt: "Me equivoqué. No volverá a pasar.", persona: "kind", rel: { r1: 1 }, reply: ["r1", "Vale. Te creo... por ahora."] },
      ] },
      { lines: [["r1", "Las cámaras te adoran, {yo}. Cada vez que abres la boca hay plano."]], choices: [
        { txt: "Es que alguien tiene que dar contenido.", persona: "drama", bonus: 150, reply: ["r1", "Y tú lo das a cubos."] },
        { txt: "Esta semana me centro, de verdad.", persona: "focus", adv: 2, reply: ["r1", "Eso quiero verlo."] },
      ] },
    ],
  },
  focus: {
    n: "La concentrada", icon: "🎯",
    saludo: ["{yo}, siempre con la cabeza en el reto, ¿eh?", "No te quiero molestar, que te veo a tope.", "Tú vienes a trabajar, se nota."],
    reaccion: [
      { lines: [["r1", "{yo}, eres un poco sosa fuera del escenario, ¿no? Nunca te mojas."]], choices: [
        { txt: "Me mojo en la pasarela, que es lo que cuenta.", persona: "focus", adv: 2, reply: ["r1", "Touché."] },
        { txt: "¿Sosa yo? Prepárate.", persona: "drama", bonus: 150, reply: ["r1", "¡Uy, qué despierta!"] },
      ] },
      { lines: [["r1", "Te he visto ensayar a las tantas. ¿No descansas nunca?"]], choices: [
        { txt: "Descansaré con la corona puesta.", persona: "focus", adv: 2, reply: ["r1", "Qué miedo me das."] },
        { txt: "¿Ensayamos juntas?", persona: "kind", rel: { r1: 1 }, reply: ["r1", "¡Venga! Me vendría genial."] },
      ] },
    ],
  },
};

const NEMESIS = DFTC.NEMESIS;

// ------------------------------ Sistema Némesis (memoria entre temporadas) ------------------------------
const RASGOS = DFTC.RASGOS;
// Lo que te dice una reina al reencontrarse contigo, según lo que pasó entre vosotras
const CICATRICES = {
  "elim:me": ["En {s} me mandaste a casa en un lip sync. Ya está superado... casi.", "{s}. Tú y yo en un lip sync y yo haciendo la maleta. Esta vez me lo he preparado mejor."],
  "elim:her": ["¿Te acuerdas de {s}? Aquel lip sync lo gané yo. Hoy empezamos de cero.", "La última vez que bailamos juntas, en {s}, te fuiste tú. Me alegra verte de vuelta."],
  "vote:me": ["En {s} tu decisión me mandó a casa. Lo entendí... con el tiempo.", "Lo de {s} me dolió, no te voy a mentir. Pero aquí estamos."],
  "vote:her": ["Lo de {s} no fue personal, de verdad.", "En {s} decidí que te fueras. Y mírate, aquí otra vez. Me alegro."],
  "save:me": ["En {s} me salvaste. Te debo una.", "Nunca te he dado las gracias por lo de {s}. Gracias, {yo}."],
  "save:her": ["En {s} te salvé. Espero que te acuerdes.", "Te salvé una vez, en {s}. A ver qué tal esta vez."],
  "humill:me": ["Lo que me dijiste en {s} delante de todas no estuvo bien, {yo}.", "Lo de {s} todavía lo tengo aquí. Pero bueno, nuevo programa."],
  "humill:her": ["Lo de {s}... me pasé contigo. Lo sé.", "En {s} te dije cosas feas. Si quieres, lo hablamos."],
  "betray:me": ["Pactamos en {s} y me dejaste tirada. Esta vez voy a mi aire.", "Lo de {s} me enseñó a no pactar tan rápido."],
  "betray:her": ["Sí, en {s} rompí el pacto. Era competición. ¿Lo dejamos atrás?", "Lo de {s}... hice lo que creía que tenía que hacer."],
  "pact:me": ["¡{yo}! En {s} fuimos uña y carne. ¿Repetimos?", "Mi aliada de {s}... Qué ganas tenía de verte."],
  "pact:her": ["¡{yo}! Qué alegría. Lo de {s} no se me olvida.", "Mira quién está aquí. Mi compañera de pacto de {s}."],
};
// Lo que se cuenta en el taller sobre las demás (también de otras temporadas)
const RADIO = {
  elim: ["{a} y {b} no se hablan desde que {a} la mandó a casa en {s}.", "Dicen que {b} todavía no ha perdonado a {a} por lo de {s}."],
  vote: ["{b} tiene la cruz puesta a {a} desde que la echó en {s}.", "Cuidado con juntar a {a} y {b}: lo de {s} sigue muy reciente."],
  save: ["{b} le debe una a {a} desde {s}.", "Entre {a} y {b} hay buen rollo desde que se salvaron en {s}."],
  ascenso: ["{a} está crecida: todo el taller la ve como la favorita.", "Se rumorea que {a} va a por todas esta temporada."],
  pelea: ["Tensión máxima entre {a} y {b} esta semana.", "{a} y {b} han discutido en los espejos. Nadie sabe por qué."],
  corona: ["{a} viene con corona puesta de {s}. Todas la miran de reojo.", "Ojo: {a} ya ganó en {s} y quiere repetir."],
};


// ---- Ampliación: tacones y looks drag (cuadrículas de Gemini)
