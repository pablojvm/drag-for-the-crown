// ---------------------------------------------------------------------------
// Diálogos del modo historia (entre retos).
// Son frases genéricas de juego, no citas reales: cámbialas como quieras.
// Marcadores: {yo} tu reina · {r1} {r2} compañeras · {fuera} última expulsada
//             {reto} reto de la semana · {temporada} nombre de la temporada
// ---------------------------------------------------------------------------
const PRESENTADORAS = {
  host: { name: "Supreme Deluxe", role: "Presentadora", img: "./images/hosts/supreme.png" },
  judge: { name: "Ana Locking", role: "Jueza", img: "./images/hosts/ana-locking.png" },
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
    { txt: "He venido a por la corona, cariño.", reply: ["r2", "Uy, qué segura se la ve. Ya veremos en la pasarela."], bonus: 150, rel: { r2: -1 } },
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
    ["judge", "Quiero ver ideas claras y buena ejecución. Sorprendedme."],
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
const TEMPORADAS_HISTORIA = {
  es1: {
    lema: "La primera vez de todas",
    intro: [
      ["host", "¡Bienvenidas a la primera temporada de Drag Race España! Nadie sabe todavía lo que se va a encontrar."],
      ["judge", "Aquí no hay favoritas. Cada semana empieza de cero."],
    ],
  },
  es2: {
    lema: "Más brillo, más drama",
    intro: [
      ["host", "¡Reinas, bienvenidas a la segunda temporada! Venís avisadas: el listón está altísimo."],
      ["judge", "Quiero ver evolución semana a semana. La que se estanque, se va."],
    ],
  },
  es3: {
    twist: "repesca",
    lema: "La temporada de la repesca",
    intro: [
      ["host", "Bienvenidas a la tercera temporada. Y os aviso: esta vez, que te vayas no significa que se acabe."],
      ["host", "A mitad de temporada habrá una REPESCA. Las eliminadas se jugarán volver a la competición."],
      ["judge", "Así que ni las que se van pueden relajarse... ni las que se quedan."],
    ],
  },
  es4: {
    twist: "suerte",
    lema: "La reina de la suerte",
    intro: [
      ["host", "¡Bienvenidas a la cuarta temporada! Hoy empezamos con un regalo... o no."],
      ["host", "Cada una va a elegir una cajita. En una de ellas está LA REINA DE LA SUERTE."],
      ["judge", "Quien la tenga podrá sacarla cuando quiera para salvarse, o salvar a una compañera, del lip sync."],
    ],
  },

  es5: {
    twist: "corazon",
    lema: "La temporada de los corazones",
    intro: [
      ["host", "Bienvenidas a la temporada de los corazones."],
      ["host", "Cada reina que se vaya dejará MEDIO CORAZÓN a una compañera antes de salir del taller."],
      ["judge", "Con un corazón entero podréis libraros del bottom. Así que cuidad a las que se van... porque deciden a quién ayudar."],
    ],
  },

  es6: {
    twist: "moneda",
    lema: "La temporada de la moneda",
    intro: [
      ["host", "Bienvenidas a la sexta temporada. Esta vez, cada semana habrá TRES reinas en el bottom."],
      ["host", "Y yo lanzaré una moneda. Si sale cara, las salvadas votaréis a cuál salvar. Si sale cruz, a cuál condenar al lip sync."],
      ["judge", "Y se vota a la cara. Aquí nadie se esconde."],
    ],
  },

  esas1: {
    twist: "allstars",
    lema: "All Stars: el poder es tuyo",
    intro: [
      ["host", "¡Bienvenidas, All Stars! Todas conocéis la casa... pero las reglas han cambiado."],
      ["host", "Cada semana, las dos mejores harán un lip sync. La que gane decidirá cuál de las dos del bottom se va a casa."],
      ["judge", "Así que las alianzas valen oro. Y las enemistades, más."],
    ],
  },
};

const HISTORIA = {
  // Presentadora al abrir el taller cada semana
  tallerHost: [
    [["host", "Buenos días, reinas. Hoy el taller huele a laca y a nervios."]],
    [["host", "Reinas, un episodio más. Las que quedáis, ya sabéis que esto no es un juego."]],
    [["host", "¡Arriba ese ánimo! Hoy toca brillar."]],
    [["host", "Otra semana, otra oportunidad. Aprovechadla."]],
  ],
  tallerTrasExpulsion: [
    [["r1", "Se nota el hueco de {fuera}... su espejo sigue lleno de purpurina."], ["r2", "Ya, pero esto sigue. La próxima puede ser cualquiera."]],
    [["r1", "No me puedo creer que {fuera} se haya ido ya."], ["r2", "Yo sí. Esta semana estaba despistadísima."], ["r3", "Qué mala eres... pero tienes razón."]],
    [["r2", "Bueno, reinas, minuto de silencio por {fuera}."], ["r1", "Uno. Ya está. ¡A trabajar!"]],
    [["r3", "{fuera} me dejó una nota en el espejo: «Ganadla por mí»."], ["r1", "Qué bonito... Me lo apunto."]],
  ],
  tallerPrimerDia: [
    [["r1", "Madre mía, cuánta reina junta. ¿Tú de dónde vienes, {yo}?"], ["r2", "Da igual de dónde vengamos: aquí todas empezamos de cero."]],
    [["r1", "¡Holaaa! Soy {r1} y vengo a llevarme la corona, que lo sepáis."], ["r2", "Uy, empezamos fuertes."]],
    [["r2", "¿Habéis visto el tamaño de las maletas de {r1}?"], ["r1", "Cariño, el talento ocupa espacio."]],
  ],
  // Tipos de conversación que puedes iniciar en el taller
  enfoques: [
    { id: "pina", icon: "🤝", txt: "Hacer piña", desc: "Intentar ganarte su amistad" },
    { id: "cotilleo", icon: "🗣️", txt: "Cotillear", desc: "Hablar de otra compañera" },
    { id: "consejo", icon: "💡", txt: "Pedir consejo", desc: "Te puede ayudar en el reto" },
    { id: "pinchar", icon: "😈", txt: "Pincharla", desc: "Meterle presión (y ganar puntos de drama)" },
  ],
  pina: {
    buena: [
      [["me", "Oye, {r1}, ¿te apetece que nos cubramos las espaldas?"], ["r1", "¡Me encantaría! Aquí dentro hace falta una amiga de verdad."]],
      [["me", "{r1}, me flipa tu estilo. ¿Te echo una mano con el look?"], ["r1", "Ay, qué maja. Pues sí, y luego te ayudo yo con el maquillaje."]],
    ],
    neutra: [
      [["me", "{r1}, ¿qué tal si nos ayudamos esta semana?"], ["r1", "Bueno... vale, veamos cómo sale."]],
      [["me", "¿Comemos juntas hoy, {r1}?"], ["r1", "Venga. Pero pagas tú los chismes."]],
    ],
    mala: [
      [["me", "{r1}, podríamos hacer las paces, ¿no?"], ["r1", "¿Ahora? ¿Después de lo de la otra semana? Déjame pensarlo."]],
      [["me", "{r1}, ¿empezamos de cero?"], ["r1", "Mmm... Te lo compro, pero tengo memoria de elefanta."]],
    ],
  },
  cotilleo: [
    [["me", "{r1}, ¿has visto lo que se ha traído {r2} para el reto?"], ["r1", "¡Calla! Parece un mantel de boda. Pero no se lo digas, eh."]],
    [["me", "Entre tú y yo... {r2} va de sobrada."], ["r1", "Ya te digo. Y luego en la pasarela se le olvidan hasta los pasos."]],
    [["me", "¿Crees que {r2} llega a la final?"], ["r1", "Con esa peluca, ni al autobús."]],
  ],
  cotilleoPillada: [["r2", "Eh... ¿estáis hablando de mí? Lo he oído TODO."], ["me", "Uy... no, no, era de otra {r2}."]],
  consejo: {
    si: [
      [["me", "{r1}, ¿algún truco para el reto de hoy?"], ["r1", "Menos es más. Elige una idea y llévala hasta el final."]],
      [["me", "Estoy perdida con el reto, {r1}."], ["r1", "Respira. Piensa en lo que sabes hacer mejor que nadie y haz solo eso."]],
    ],
    no: [
      [["me", "{r1}, ¿me das un consejo?"], ["r1", "Sí: que no me pidas consejos. Suerte, reina."]],
    ],
  },
  pinchar: [
    [["me", "{r1}, qué valiente vienes con ese look."], ["r1", "Y tú qué valiente vienes hablándome así. Nos vemos en la pasarela."]],
    [["me", "Me encanta que sigas aquí, {r1}. Da esperanza a las demás."], ["r1", "Qué graciosa. Ríete ahora, que en el bottom no se ríe nadie."]],
    [["me", "¿Tú no estabas ya en el bottom la semana pasada, {r1}?"], ["r1", "Y aquí sigo. Como tu mala leche, cariño."]],
  ],
  // Eventos aleatorios del taller (varias reinas, eliges bando)
  eventos: [
    {
      lines: [["r1", "¡{r2}, me has quitado el espejo otra vez!"], ["r2", "Estaba libre, cariño. Haber madrugado."], ["r1", "{yo}, dile algo, que tú lo has visto."]],
      choices: [
        { txt: "Tiene razón {r1}, el espejo era suyo.", rel: { r1: 1, r2: -1 }, reply: ["r2", "Genial, ahora sois un equipo. Qué miedo."] },
        { txt: "Yo he visto el espejo libre, lo siento.", rel: { r1: -1, r2: 1 }, reply: ["r1", "Ah, muy bien. Me lo apunto, {yo}."] },
        { txt: "Yo no me meto, que tengo que coser.", rel: {}, reply: ["r2", "Muy suiza te veo esta temporada."] },
      ],
    },
    {
      lines: [["r1", "{yo}, ¿me dejas tu pistola de silicona? Se me ha roto la mía."]],
      choices: [
        { txt: "¡Claro! Toma, cuídala.", rel: { r1: 2 }, bonus: 0, effect: "ayuda", reply: ["r1", "¡Te debo una! No lo olvidaré."] },
        { txt: "Lo siento, la necesito todo el rato.", rel: { r1: -1 }, reply: ["r1", "Vale... gracias por nada."] },
      ],
    },
    {
      lines: [["r2", "Os lo digo: {r1} se cree que ya ha ganado."], ["r1", "Te estoy oyendo, {r2}."], ["r3", "Madre mía, que empiece el espectáculo..."]],
      choices: [
        { txt: "Venga, chicas, paz, que nos quedan semanas.", rel: { r1: 1, r2: 1, r3: 1 }, reply: ["r3", "Mira, la mamá del taller."] },
        { txt: "Pues algo de razón lleva {r2}...", rel: { r2: 1, r1: -2 }, bonus: 120, reply: ["r1", "Perfecto. Ya sé con quién no contar."] },
        { txt: "{r1}, a mí me pareces la más currante.", rel: { r1: 2, r2: -1 }, reply: ["r2", "Pelota."] },
      ],
    },
    {
      lines: [["r1", "Tengo una idea: ¿y si esta semana nos ayudamos las tres?"], ["r2", "Yo me apunto si {yo} se apunta."]],
      choices: [
        { txt: "¡Hecho! Alianza del taller.", rel: { r1: 1, r2: 1 }, reply: ["r1", "¡Esto hay que celebrarlo con purpurina!"] },
        { txt: "Yo voy por libre, chicas.", rel: { r1: -1, r2: -1 }, bonus: 100, reply: ["r2", "Pues nada, lobo solitario."] },
      ],
    },
    {
      lines: [["r1", "Estoy agotada... no sé si voy a poder con esta semana."]],
      choices: [
        { txt: "Eh, que eres de las mejores. Tú puedes.", rel: { r1: 2 }, reply: ["r1", "Gracias, {yo}. Lo necesitaba."] },
        { txt: "Pues si no puedes, mejor para mí.", rel: { r1: -2 }, bonus: 120, reply: ["r1", "Qué fría eres... apuntado."] },
      ],
    },
  ],
  // Anuncio del reto
  anuncio: [
    [["host", "Reinas, atención: el reto de esta semana es... ¡{reto}!"], ["judge", "Quiero ver ideas claras y buena ejecución. Sorprendedme."]],
    [["host", "¡Chicas! Esta semana os enfrentáis a... ¡{reto}!"], ["judge", "Nada de ir a lo seguro. Quiero riesgo."]],
    [["host", "Os traigo un reto que va a separar a las reinas de las princesas: ¡{reto}!"], ["judge", "Cuidado con los acabados. Se ve todo."]],
  ],
  // Críticas según tu resultado
  critica: {
    win: [
      [["judge", "{yo}, esta semana lo has bordado. Concepto, acabado y actitud."], ["host", "¡Enhorabuena, eres la ganadora del reto!"]],
      [["judge", "{yo}, por fin te veo de verdad. Esto es lo que quiero."], ["host", "¡{yo}, eres la ganadora de esta semana!"]],
    ],
    safe: [
      [["judge", "{yo}, correcto, pero me falta ese punto que te haga destacar."], ["host", "Estás a salvo. Puedes volver al taller."]],
      [["judge", "Bien, {yo}. Solo bien. Y aquí hace falta más."], ["host", "{yo}, estás a salvo."]],
    ],
    bottom: [
      [["judge", "{yo}, esta semana no te he visto. Me ha faltado todo."], ["host", "Lo siento, estás en el bottom."]],
      [["judge", "{yo}, me decepciona. Sé que puedes dar mucho más."], ["host", "{yo}... estás entre las dos peores."]],
    ],
  },
  // Untucked: eliges a quién te acercas tras la crítica
  untucked: {
    intro: [["host", "Reinas, podéis ir al Untucked mientras deliberamos."]],
    ganadora: [
      [["me", "¡Enhorabuena, {r1}! Te lo has currado."], ["r1", "Gracias, reina. Viniendo de ti vale doble."]],
      [["me", "{r1}, ¿cómo lo haces? Estás en otra liga."], ["r1", "Mucho café y cero dormir. No lo recomiendo."]],
    ],
    bottom: [
      [["me", "{r1}, ¿cómo estás? Ánimo con el lip sync."], ["r1", "Muerta de miedo... pero gracias por venir a verme."]],
      [["me", "Tú sales de esta, {r1}, seguro."], ["r1", "Ojalá. Si me voy, ganad por mí."]],
    ],
    aliada: [
      [["me", "{r1}, ¿seguimos juntas hasta el final?"], ["r1", "Hasta la corona, reina. Y luego ya nos peleamos."]],
    ],
    enemiga: [
      [["r1", "Vaya, {yo}, ¿vienes a pedirme perdón?"]],
    ],
    enemigaChoices: [
      { txt: "Sí. Me pasé contigo, lo siento.", rel: { r1: 2 }, reply: ["r1", "Vale... te lo acepto. Pero te vigilo."] },
      { txt: "No. Vengo a decirte que voy a por ti.", rel: { r1: -1 }, bonus: 150, reply: ["r1", "Qué miedo. Nos vemos en la final... si llegas."] },
    ],
  },
  regresoVuelve: [["r1", "¡He vuelto, reinas! Y esta vez vengo con todo."]],
  // Lip sync entre otras dos reinas (tú miras)
  lipsyncOtras: [
    "{a} y {b} lo dan todo en el escenario. Las pelucas vuelan.",
    "{a} y {b} se juegan la vida con la canción. Qué nervios.",
    "El escenario arde: {a} contra {b}.",
  ],
  // Final
  final: [
    [["host", "Hemos llegado a la gran final. Tres reinas, una corona."], ["judge", "Ha sido un camino largo. Ahora demostrad por qué estáis aquí."]],
  ],
};

// ===========================================================================
// MÁS VARIEDAD: se suman a los bancos de arriba (el juego evita repetir)
// ===========================================================================
HISTORIA.tallerHost.push(
  [["host", "¡Buenos días, mis reinas! ¿Quién ha dormido algo? Ya me imaginaba."]],
  [["host", "Hoy vengo con energía. Espero que vosotras también."], ["judge", "Y con ideas, por favor. Energía sin ideas es solo ruido."]],
  [["host", "Reinas, recordad: el taller es vuestro, pero la pasarela es de las valientes."]],
  [["host", "Mirad a vuestro alrededor. Alguna de estas caras no estará la semana que viene."]],
  [["host", "Hoy quiero ver hambre de corona. ¿Me habéis oído?"], ["r1", "¡Sí, Supreme!"], ["r2", "Alto y claro."]],
  [["host", "Os veo cansadas... y eso me encanta. Significa que os lo estáis tomando en serio."]],
  [["judge", "Antes de nada: la semana pasada vi acabados muy pobres. No quiero verlo otra vez."], ["host", "Ya la habéis oído, reinas."]],
);
HISTORIA.tallerTrasExpulsion.push(
  [["r1", "Todavía tengo los ojos hinchados por lo de {fuera}."], ["r2", "Pues ponte hielo, que hoy hay que brillar."]],
  [["r2", "¿Soy la única que se ha quedado con la purpurina de {fuera} en la peluca?"], ["r3", "Es un recuerdo, no te la quites."]],
  [["r1", "Hablemos claro: {fuera} se fue porque no arriesgó."], ["r2", "O porque tuvo mala suerte. Esto es muy injusto a veces."], ["r1", "La suerte se trabaja, cariño."]],
  [["r3", "Anoche le escribí a {fuera}. Dice que nos ve a todas en la final."], ["r1", "A todas no, que solo cabemos tres."]],
  [["r2", "Yo pensaba que {fuera} llegaba lejísimos."], ["r3", "Aquí nadie tiene nada asegurado. Nadie."]],
  [["r1", "Silencio en el taller... se nota que falta {fuera}."], ["r2", "Y su risa. Madre mía, su risa."]],
  [["r2", "{yo}, ¿tú lo viste venir lo de {fuera}?"], ["r1", "Todas lo vimos venir, cielo."]],
);
HISTORIA.tallerPrimerDia.push(
  [["r1", "¿Esto es el taller? Me lo imaginaba más grande... y con más espejos para mí."], ["r2", "Empezamos bien con la humildad."]],
  [["r2", "Hola, reinas. Vengo a ser vuestra peor pesadilla... y vuestra mejor amiga."], ["r1", "¿Las dos cosas a la vez? Qué agotador."]],
  [["r1", "Tengo tantos nervios que me he puesto las pestañas al revés."], ["r3", "Tranquila, que yo me he dejado una bota en el taxi."]],
  [["r3", "¿Alguien sabe coser? Pregunto por una amiga... que soy yo."], ["r2", "Empezamos fuerte, sí."]],
  [["r1", "Ay, {yo}, ¡qué ganas tenía de conocerte! Te sigo desde hace años."], ["r2", "Pues yo no te conocía de nada, pero me encanta tu look."]],
);
HISTORIA.pina.buena.push(
  [["me", "{r1}, esta semana vamos a por todas, ¿juntas?"], ["r1", "Juntas hasta el final. Y si hay que pelear, lo hacemos en la final."]],
  [["me", "¿Me guardas sitio en el espejo, {r1}?"], ["r1", "Siempre, reina. Para ti, el mejor."]],
  [["me", "Oye, {r1}, que sepas que eres de las que más admiro aquí."], ["r1", "¡Calla, que me vas a hacer llorar el maquillaje!"]],
);
HISTORIA.pina.neutra.push(
  [["me", "{r1}, no hemos hablado mucho, pero me caes genial."], ["r1", "¿Sí? Pues... gracias. Tú a mí también, creo."]],
  [["me", "¿Te ayudo con esas plumas, {r1}?"], ["r1", "Vale, pero no me robes la idea, eh."]],
  [["me", "¿Qué música escuchas para inspirarte, {r1}?"], ["r1", "Folclórica y techno. A la vez. No preguntes."]],
);
HISTORIA.pina.mala.push(
  [["me", "{r1}, sé que no empezamos bien... ¿tregua?"], ["r1", "Tregua hasta el viernes. Luego ya veremos."]],
  [["me", "Te he traído un café, {r1}. Sin veneno, lo prometo."], ["r1", "Déjalo ahí. Lo probaré cuando lo pruebe otra."]],
);
HISTORIA.cotilleo.push(
  [["me", "¿Tú has visto cómo mira {r2} a las del top?"], ["r1", "Como si quisiera arrancarles la peluca. Ya lo he notado."]],
  [["me", "Dicen que {r2} tenía el look hecho de casa."], ["r1", "¡Lo sabía! Ese cosido era demasiado perfecto."]],
  [["me", "{r2} me ha dicho que tú eres su mayor rival."], ["r1", "¿Ah, sí? Qué honor. Que se prepare."]],
  [["me", "¿Crees que {r2} está fingiendo que llora?"], ["r1", "Con esas lágrimas tan bien colocadas... seguro."]],
);
HISTORIA.consejo.si.push(
  [["me", "{r1}, ¿qué harías tú con este reto?"], ["r1", "Arriesgar. El jurado perdona un error, pero no perdona el aburrimiento."]],
  [["me", "Necesito un consejo, {r1}. Estoy bloqueada."], ["r1", "Vete a la pasarela vacía y camina cinco minutos. Las ideas llegan solas."]],
  [["me", "¿Cómo le gusto más al jurado, {r1}?"], ["r1", "Siendo tú al cien por cien. Nada de copiar a nadie."]],
);
HISTORIA.consejo.no.push(
  [["me", "{r1}, ¿algún truco?"], ["r1", "Sí: dormir. Ah, que no te da tiempo. Pues suerte."]],
  [["me", "¿Me echas una mano con el reto, {r1}?"], ["r1", "Tengo las dos ocupadas con el mío, lo siento."]],
);
HISTORIA.pinchar.push(
  [["me", "{r1}, ese color te queda... interesante."], ["r1", "Interesante es que sigas aquí con esa peluca."]],
  [["me", "¿Ese es tu look o todavía lo estás haciendo, {r1}?"], ["r1", "Es alta costura, cariño. Algo que tú no has visto nunca."]],
  [["me", "Tranquila, {r1}, que el jurado es comprensivo con las principiantes."], ["r1", "Qué pena que no lo sea con las pesadas."]],
);
HISTORIA.eventos.push(
  {
    lines: [["r2", "¡Alguien me ha escondido las pestañas!"], ["r1", "A mí ni me mires."], ["r3", "{yo} estaba cerca de tu sitio, ¿eh?"]],
    choices: [
      { txt: "¡Yo no he sido! Te ayudo a buscarlas.", rel: { r2: 1, r3: -1 }, reply: ["r2", "Gracias, {yo}. Ya sé en quién confiar."] },
      { txt: "Pues a lo mejor {r3} sabe algo...", rel: { r3: -2, r2: 1 }, bonus: 100, reply: ["r3", "¡Qué dices! Esto no se queda así."] },
      { txt: "Toma las mías, tengo repuesto.", rel: { r2: 2 }, reply: ["r2", "Eres un ángel. Te lo devolveré."] },
    ],
  },
  {
    lines: [["r1", "Chicas, ¿hacemos una porra de quién se va esta semana?"], ["r2", "Qué mal gusto... yo apuesto por {r3}."], ["r3", "¡Eh!"]],
    choices: [
      { txt: "Yo no apuesto contra mis compañeras.", rel: { r3: 1, r1: -1 }, reply: ["r3", "Gracias, {yo}. Al menos alguien tiene corazón."] },
      { txt: "Yo apuesto por {r1}.", rel: { r1: -2 }, bonus: 120, reply: ["r1", "Muy graciosa. Ya verás el viernes."] },
      { txt: "Apuesto a que me voy yo, así no pierdo.", rel: { r1: 1, r2: 1 }, reply: ["r2", "Jajaja, qué pesimista."] },
    ],
  },
  {
    lines: [["r1", "{yo}, necesito sinceridad: ¿está bien mi look?"], ["r1", "Dímelo sin anestesia."]],
    choices: [
      { txt: "Es precioso, vas a arrasar.", rel: { r1: 1 }, reply: ["r1", "¡Ay, gracias! Me quitas un peso de encima."] },
      { txt: "Le falta algo... ¿un cinturón?", rel: { r1: 2 }, effect: "ayuda", reply: ["r1", "¡Tienes razón! Qué ojo tienes."] },
      { txt: "Sinceramente... no.", rel: { r1: -1 }, bonus: 80, reply: ["r1", "Vale. Duele, pero gracias."] },
    ],
  },
  {
    lines: [["r2", "¿Os habéis enterado? Dicen que esta semana viene una jueza invitada muy exigente."], ["r1", "Ay, no me digas eso que me pongo mala."]],
    choices: [
      { txt: "Mejor, así demostramos lo que valemos.", rel: { r2: 1 }, reply: ["r2", "Esa es la actitud, reina."] },
      { txt: "¿Y tú cómo lo sabes, {r2}?", rel: { r2: -1 }, reply: ["r2", "Tengo mis fuentes. No preguntes."] },
    ],
  },
  {
    lines: [["r3", "Tengo que confesaros algo: nunca he hecho un lip sync en mi vida."], ["r1", "¿¡Qué!? Pues más te vale no caer en el bottom."]],
    choices: [
      { txt: "Te enseño unos trucos en el descanso.", rel: { r3: 2 }, effect: "ayuda", reply: ["r3", "¡Gracias! Eres la mejor."] },
      { txt: "Pues ya sé a quién quiero en el bottom conmigo.", rel: { r3: -2 }, bonus: 120, reply: ["r3", "Qué rastrera. No se me olvidará."] },
    ],
  },
  {
    lines: [["r1", "{r2} y yo hemos hecho una alianza. ¿Te unes, {yo}?"], ["r2", "Somos buenas, pero con tres somos imparables."]],
    choices: [
      { txt: "¡Me apunto!", rel: { r1: 1, r2: 1, r3: -1 }, reply: ["r1", "Bienvenida al club, reina."] },
      { txt: "Gracias, pero voy con {r3}.", rel: { r3: 2, r1: -1, r2: -1 }, reply: ["r3", "¡Esa es mi chica!"] },
      { txt: "Paso de alianzas, cada una lo suyo.", rel: {}, bonus: 60, reply: ["r2", "Tú misma. Luego no llores."] },
    ],
  },
);
HISTORIA.anuncio.push(
  [["host", "Os lo digo ya: esta semana alguien va a llorar. El reto es... ¡{reto}!"]],
  [["host", "Reinas, preparaos para {reto}."], ["judge", "Os estaré mirando. A todas."]],
  [["host", "¡Sorpresa! El reto de hoy es {reto}."], ["r1", "Ay, no, justo lo que peor se me da."], ["host", "Pues a trabajar, cariño."]],
  [["judge", "Esta semana subo el listón: {reto}."], ["host", "Ya la habéis oído. Y sí, lo dice en serio."]],
);
HISTORIA.critica.win.push(
  [["judge", "{yo}, has entendido el reto mejor que nadie."], ["host", "{yo}, condragulations: ganas esta semana."]],
  [["host", "{yo}, has venido a por todas y se nota."], ["judge", "Me has emocionado. Y eso no es fácil."], ["host", "¡Eres la ganadora!"]],
  [["judge", "Esto es drag de verdad, {yo}. Enhorabuena."]],
);
HISTORIA.critica.safe.push(
  [["host", "{yo}, has cumplido. Pero cumplir no gana coronas."], ["judge", "Arriesga más la semana que viene."]],
  [["judge", "{yo}, tenías una buena idea que se quedó a medias."], ["host", "Estás a salvo, reina."]],
  [["host", "{yo}, estás a salvo... por esta vez."]],
);
HISTORIA.critica.bottom.push(
  [["judge", "{yo}, no sé qué ha pasado, pero no eras tú."], ["host", "Lo siento, reina. Estás en peligro."]],
  [["host", "{yo}... esta semana no ha sido tu semana."], ["judge", "El acabado, el concepto... todo flojo."]],
  [["judge", "{yo}, parecía que tenías prisa por irte."], ["host", "Estás entre las peores. Toca demostrar que te quieres quedar."]],
);
HISTORIA.untucked.ganadora.push(
  [["me", "Te lo mereces, {r1}. De verdad."], ["r1", "Gracias... la semana que viene te toca a ti, ya verás."]],
  [["me", "Menudo look, {r1}. Me muero de envidia."], ["r1", "Envidia sana, espero. Jajaja."]],
);
HISTORIA.untucked.bottom.push(
  [["me", "{r1}, ¿necesitas algo? ¿Agua, un abrazo?"], ["r1", "Un abrazo. Y que sea largo."]],
  [["me", "Cuando salgas al escenario, olvídate de todo y disfruta."], ["r1", "Lo intentaré, {yo}. Gracias de corazón."]],
);
HISTORIA.untucked.aliada.push(
  [["me", "Estamos más cerca de la final, {r1}."], ["r1", "Lo sé. Y te quiero ahí conmigo."]],
  [["me", "¿Qué te han parecido las demás hoy?"], ["r1", "Flojas. Tú y yo estamos en otro nivel."]],
);
HISTORIA.lipsyncOtras.push(
  "{a} y {b} dejan el escenario temblando. Hay splits, giros y un zapato volando.",
  "{a} se sabe la canción al dedillo. {b} lo da todo, pero no basta.",
  "Qué lip sync. El público grita. {a} remata con una pose final brutal.",
);

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
          { txt: "Ahora me debes una, eh.", rel: {}, bonus: 60, reply: ["r1", "Jajaja, apuntado. Te la devolveré."] },
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
          { txt: "Pues sí, eres una amenaza. Es un cumplido.", rel: { r1: -1 }, bonus: 150, reply: ["r1", "Pues esta amenaza va a por ti, cariño."] },
          { txt: "Voté lo que vi. No es nada personal.", rel: {}, reply: ["r1", "Para mí sí lo es. Ya hablaremos en la pasarela."] },
        ] },
      { lines: [["r1", "Qué valiente fuiste votándome a mí, {yo}. Con lo mal que lo hizo la otra..."], ["r1", "Que sepas que me he dado cuenta de tu jugada."]], after: -1 },
      { lines: [["r1", "Me mandaste al lip sync sin ser la peor, {yo}."], ["r1", "Eso se llama miedo. Y el miedo se huele."]],
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
      [["r1", "Todo el mundo ha visto que no era la peor. Me mandas a casa por estrategia."], ["r1", "Ojalá lo pagues en la final."]],
      [["r1", "Vale, {yo}. Ya he entendido quién eres de verdad."], ["r1", "Que tengas suerte... la vas a necesitar."]],
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
const JURADO = {
  reto: {
    pasarela: {
      top: ["Cada pose estaba medida al milímetro. Parecías de revista.", "Has caminado como si la pasarela fuera tuya. Y hoy lo era.", "Esa última pose me ha dejado sin respiración."],
      mid: ["Algunas poses muy buenas y otras que se te escaparon.", "La categoría la has entendido, pero te ha faltado remate.", "Correcta, aunque te vi dudar a mitad de pasarela."],
      low: ["Llegabas tarde a cada pose. Parecía que la música iba por un lado y tú por otro.", "La categoría no se ha entendido. ¿Qué era, exactamente?", "Te he visto caminar, pero no te he visto posar."],
    },
    snatch: {
      top: ["Tu personaje estaba vivo. No he visto a {yo}, he visto a otra persona.", "Cada respuesta encajaba con el personaje. Eso es Snatch Game.", "Me he reído muchísimo, y eso en este jurado es difícil."],
      mid: ["Algunos chistes funcionaron, pero el personaje se te iba y volvía.", "Tenías una buena idea de personaje que no has sabido sostener.", "Graciosa a ratos. Te ha faltado constancia."],
      low: ["Te has salido del personaje en casi todas las respuestas.", "Silencios muy largos. En el Snatch Game el silencio mata.", "No sé ni a quién estabas imitando, y creo que tú tampoco."],
    },
    baile: {
      top: ["Limpia, precisa y con actitud. Los pasos te salían solos.", "Te has comido la coreografía. Ni un fallo.", "Has bailado como si llevaras semanas ensayando."],
      mid: ["Te perdiste un par de veces, pero te recuperaste con gracia.", "La memoria te ha fallado en el tramo final.", "Correcta, pero te faltó soltarte."],
      low: ["Ibas contando los pasos en voz alta. Se notaba muchísimo.", "Te perdiste al principio y ya no te encontraste.", "La coreografía te ha bailado a ti, no tú a ella."],
    },
    diseno: {
      top: ["Con esos materiales has hecho alta costura. Increíble.", "El acabado es impecable. Ni una costura a la vista.", "Has sabido elegir qué materiales usar y cuáles no. Eso es criterio."],
      mid: ["El concepto está bien, pero el acabado es mejorable.", "Buena idea con materiales un poco escasos.", "Se nota que te faltó tiempo en la parte de atrás del look."],
      low: ["Eso se sujeta con cinta y con fe.", "Demasiados materiales que no pegaban entre sí.", "Parece que el look se ha hecho en diez minutos. ¿Me equivoco?"],
    },
    lectura: {
      top: ["Lecturas afiladas y con cariño. Así se lee en esta casa.", "Cada lectura era un dardo al centro. Brillante.", "Has leído a todas sin pasarte de la raya. Eso es arte."],
      mid: ["Alguna lectura buena, otras se quedaron en nada.", "Te ha faltado picardía en el remate.", "Divertida, pero demasiado prudente."],
      low: ["Eso no eran lecturas, eran descripciones.", "Nadie se ha reído. Ni las leídas.", "La biblioteca estaba abierta, pero tú te has quedado en la puerta."],
    },
    rusical: {
      top: ["Voz, ritmo y presencia escénica. Una estrella del musical.", "Cada nota en su sitio. Te has comido el escenario.", "El público estaba contigo desde el primer compás."],
      mid: ["Ibas bien hasta que perdiste el ritmo a mitad del número.", "Buena energía, pero algunas notas se te escaparon.", "Correcta en el número, pero sin brillar."],
      low: ["Ibas a destiempo durante casi todo el número.", "Se te ha visto perdida en el escenario.", "Lo del ritmo no ha sido lo tuyo hoy."],
    },
    maquillaje: {
      top: ["Has clavado la carta de maquillaje. Idéntica.", "Precisión absoluta en cada zona. Tienes ojo de artista.", "Colores exactos y bien difuminados. Muy profesional."],
      mid: ["Algunas zonas perfectas y otras con colores que no tocaban.", "Tenías la carta delante y aun así te despistaste.", "Bien, pero se nota que dudaste con los labios."],
      low: ["Eso no se parece a la carta ni de lejos.", "Colores cambiados en casi todas las zonas.", "¿Estabas mirando la misma carta que yo?"],
    },
    equipos: {
      top: ["Has liderado el grupo sin comerte a tus compañeras.", "Tu parte del número ha sido la mejor, y lo sabes.", "Has hecho brillar a todo el equipo."],
      mid: ["Has cumplido en el grupo, pero sin destacar.", "Te has escondido un poco detrás de tus compañeras.", "Correcta, aunque el número pedía más de ti."],
      low: ["Se notaba que no ensayaste con el grupo.", "Has ido a tu aire mientras el resto iba a otro.", "En un grupo, si una falla, fallan todas. Y hoy fallaste tú."],
    },
  },
  pasarela: {
    top: ["Y en la pasarela, un look de otro planeta.", "El look de pasarela: diez sobre diez.", "Por cierto, ese look de pasarela es de lo mejor de la temporada."],
    mid: ["El look de pasarela, bonito pero previsible.", "En pasarela, correcta. Nada más.", "El look lo he visto otras veces, pero te sienta bien."],
    low: ["Y el look de pasarela... mejor no hablemos de la peluca.", "Ese look parecía sacado del fondo del armario.", "En pasarela me has dejado fría."],
  },
  aperturaAna: ["Voy a ser directa, {yo}.", "{yo}, empecemos por el reto.", "A ver, {yo}...", "{yo}, te he estado observando toda la semana.", "Mira, {yo}, te lo digo con cariño."],
  aperturaSupreme: ["{yo}, te toca.", "Vamos contigo, {yo}.", "{yo}, cariño, da un paso al frente.", "Turno de {yo}. Nervios, ¿eh?"],
  veredicto: {
    win: ["¡{yo}, condragulations! Eres la ganadora del reto.", "{yo}, has ganado esta semana. ¡Enhorabuena!", "La ganadora de la semana es... ¡{yo}!"],
    safe: ["{yo}, estás a salvo. Puedes volver al taller.", "{yo}, esta semana te salvas.", "Estás a salvo, {yo}. Pero no te relajes."],
    bottom: ["{yo}, lo siento, pero estás entre las peores de la semana.", "{yo}... estás en peligro.", "{yo}, esta semana te toca defenderte."],
  },
};

// Snatch Game: personajes inventados (arquetipos, no personas reales)
const SNATCH_PERSONAJES = [
  { id: "folclorica", icon: "💃", name: "La Folclórica del Tablao", tono: "dramática y de copla",
    frases: ["¡Ay, que me da algo! Esto lo arreglo yo con una copla y un abanico.", "Cariño, yo eso lo lloro en tres actos y con volantes.", "Lo que yo te diga: pena, penita, pena... y lentejuelas.", "Mira, eso me pasó en el 82 y acabé cantando en Tokio.", "¡Que me traigan el mantón, que esto es una tragedia!", "Yo a eso le pongo una peineta y se me pasa todo.", "Eso se soluciona con un taconeo y un olé bien dado.", "Mi abuela decía: si no hay drama, no hay arte."] },
  { id: "pija", icon: "👜", name: "La Pija de Club de Pádel", tono: "pija y sobrada",
    frases: ["Cariño, eso en mi club de pádel no pasa. Es que no.", "O sea, literal, eso es súper de pueblo.", "Yo eso se lo encargo a mi asistente, que para eso le pago.", "Ay, qué mono. Qué pobre, pero qué mono.", "Mira, lo hablamos en la casa de la playa, ¿vale?", "Eso con un zumo detox se soluciona, te lo juro.", "Es que yo no uso nada que no tenga apellido francés.", "Me agobia muchísimo, o sea, me agobia fatal."] },
  { id: "vidente", icon: "🔮", name: "La Vidente de Madrugada", tono: "mística y misteriosa",
    frases: ["Veo... veo... una peluca rubia en tu futuro.", "Las cartas no mienten, cariño. Y dicen que no.", "Llámame ahora y te echo el tarot con descuento.", "Tu aura está color purpurina. Eso es buena señal.", "Mercurio está retrógrado y yo también un poco.", "El más allá me dice que te maquilles mejor.", "Veo un hombre moreno... ah no, es mi reflejo.", "Las velas no se equivocan. Bueno, a veces se apagan."] },
  { id: "abuela", icon: "👵", name: "La Abuela de Pueblo", tono: "de abuela entrañable",
    frases: ["En mis tiempos esto se arreglaba con un caldito.", "Hija, come algo, que te veo muy delgada.", "Eso lo sé yo porque lo dijeron en la radio.", "Ay, qué cosas decís los jóvenes, madre mía.", "Yo a tu edad ya tenía cinco hijos y un huerto.", "Abrígate, que refresca y luego vienen los males.", "Eso con ajo y perejil se cura todo.", "Mi Paco, que en paz descanse, decía lo mismo."] },
  { id: "influencer", icon: "📱", name: "La Influencer Patrocinada", tono: "influencer con código de descuento",
    frases: ["Esto me lo han enviado, código DRAG20 para un veinte por ciento.", "Chicas, link en la bio, no os lo perdáis.", "Buenos días a todos menos a los que no me siguen.", "Esto es contenido, esto es arte, esto es colaboración pagada.", "Me he levantado así: con ring light y filtro.", "¿Lo habéis visto? Dadle like y compartid, porfa.", "Hoy os traigo mi rutina de noche en veinte pasos.", "Esto no es publi. Bueno, un poquito sí."] },
];
const SNATCH_PREGUNTAS = [
  "¿Cuál es tu secreto de belleza?", "¿Qué harías con un millón de euros?", "¿Cómo te preparas para una cita?", "¿Qué opinas del amor?",
  "¿Qué llevarías a una isla desierta?", "¿Cuál es tu plato favorito?", "¿Qué consejo le darías a las concursantes?", "¿Cómo te enfrentas a una ruptura?",
  "¿Qué opinas del gimnasio?", "¿Qué es lo primero que haces al levantarte?", "¿Cómo celebras tu cumpleaños?", "¿Qué harías si fueras presidenta del país?",
];
const SNATCH_PLANAS = ["Pues no sé, la verdad.", "Bien, supongo.", "Eso es muy personal.", "Mmm... siguiente pregunta.", "Lo normal, como todo el mundo.", "Ni idea, cariño."];
