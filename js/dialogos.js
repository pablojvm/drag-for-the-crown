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
      ["host", "Aquí la ganadora del reto decide quién de las dos del bottom se va a casa."],
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
