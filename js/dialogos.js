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
    lema: "La temporada de la Segunda Oportunidrag",
    intro: [
      ["host", "Bienvenidas a la tercera temporada. Y os aviso: esta vez, que te vayas no significa que se acabe."],
      ["host", "A mitad de temporada llegará la SEGUNDA OPORTUNIDRAG. Las eliminadas se jugarán volver a la competición."],
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

  esas2: {
    twist: "allstars",
    lema: "All Stars 2: segunda oportunidad, misma corona",
    intro: [
      ["host", "¡Bienvenidas a la segunda edición de All Stars! Nueve reinas vuelven a por lo que se les escapó."],
      ["host", "Las reglas ya las conocéis: las dos mejores hacen lip sync y la ganadora decide quién del bottom se marcha."],
      ["judge", "Aquí nadie viene a aprender. Venís a demostrar."],
    ],
  },
};

// Temporadas especiales del modo historia
Object.assign(TEMPORADAS_HISTORIA, {
  escustom: {
    twist: "allstars",
    lema: "All Stars a tu gusto",
    intro: [
      ["host", "¡Bienvenidas, All Stars! Este reparto no lo ha elegido producción... lo habéis pedido vosotras."],
      ["host", "Mismas reglas de siempre: las dos mejores harán lip sync y la ganadora decidirá quién se va de las del bottom."],
      ["judge", "Aquí nadie viene a hacer amigas. Bueno, alguna sí. Pero pocas."],
    ],
  },
  esaw: {
    twist: "winners",
    lema: "All Winners: solo ganadoras",
    intro: [
      ["host", "Bienvenidas a All Winners. Mirad a vuestro alrededor: todas las que estáis aquí ya habéis ganado una corona."],
      ["host", "Y aquí nadie se va a casa. Cada semana, las dos mejores harán lip sync por una estrella."],
      ["host", "En la gran final estaréis todas, y será a lip sync limpio: la que pierda, queda fuera. Las estrellas os darán ventaja."],
      ["judge", "Una corona ganada no garantiza nada. Aquí empezáis todas de cero."],
    ],
  },
});

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
    [["host", "Reinas, atención: el reto de esta semana es... ¡{reto}!"], ["host", "Quiero ver ideas claras y buena ejecución. Sorprendedme."]],
    [["host", "¡Chicas! Esta semana os enfrentáis a... ¡{reto}!"], ["host", "Nada de ir a lo seguro. Quiero riesgo."]],
    [["host", "Os traigo un reto que va a separar a las reinas de las princesas: ¡{reto}!"], ["host", "Cuidado con los acabados, que desde el jurado se ve todo."]],
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
    [["host", "Hemos llegado a la gran final. Cuatro reinas, una corona."], ["judge", "Ha sido un camino largo. Ahora demostrad por qué estáis aquí."]],
    [["host", "Top 4, mis reinas. Aquí ya no hay retos: solo lip syncs."], ["judge", "Y en un lip sync no hay excusas. O lo das todo o te vas."], ["r1", "Llevo toda la temporada esperando este momento."]],
    [["host", "Bienvenidas a la gran final de {temporada}."], ["r1", "Estoy temblando, pero de ganas."], ["r2", "Que gane la mejor. O sea, yo."]],
  ],
};

// ===========================================================================
// MÁS VARIEDAD: se suman a los bancos de arriba (el juego evita repetir)
// ===========================================================================
HISTORIA.tallerHost.push(
  [["host", "¡Buenos días, mis reinas! ¿Quién ha dormido algo? Ya me imaginaba."]],
  [["host", "Hoy vengo con energía. Espero que vosotras también. Y con ideas, que energía sin ideas es solo ruido."]],
  [["host", "Reinas, recordad: el taller es vuestro, pero la pasarela es de las valientes."]],
  [["host", "Mirad a vuestro alrededor. Alguna de estas caras no estará la semana que viene."]],
  [["host", "Hoy quiero ver hambre de corona. ¿Me habéis oído?"], ["r1", "¡Sí, Supremme!"], ["r2", "Alto y claro."]],
  [["host", "Os veo cansadas... y eso me encanta. Significa que os lo estáis tomando en serio."]],
  [["host", "Antes de nada: Ana se quedó la semana pasada con los acabados. No quiere verlo otra vez, y yo tampoco."]],
);
HISTORIA.tallerTrasExpulsion.push(
  [["r1", "Todavía tengo los ojos hinchados por lo de {fuera}."], ["r2", "Pues ponte hielo, que hoy hay que brillar."]],
  [["r2", "¿Soy la única que se ha quedado con la purpurina de {fuera} en la peluca?"], ["r3", "Es un recuerdo, no te la quites."]],
  [["r1", "Hablemos claro: {fuera} se fue porque no arriesgó."], ["r2", "O porque tuvo mala suerte. Esto es muy injusto a veces."], ["r1", "La suerte se trabaja, cariño."]],
  [["r3", "Anoche le escribí a {fuera}. Dice que nos ve a todas en la final."], ["r1", "A todas no, que a la final solo llegan cuatro."]],
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
  [["host", "Reinas, preparaos para {reto}."], ["host", "Os estaré mirando. A todas."]],
  [["host", "¡Sorpresa! El reto de hoy es {reto}."], ["r1", "Ay, no, justo lo que peor se me da."], ["host", "Pues a trabajar, cariño."]],
  [["host", "Esta semana subo el listón: {reto}. Y sí, lo digo en serio."]],
);
HISTORIA.critica.win.push(
  [["judge", "{yo}, has entendido el reto mejor que nadie."], ["host", "{yo}, felicidrages: ganas esta semana."]],
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
          { txt: "Pues sí, eres una amenaza. Es un cumplido.", rel: { r1: -1 }, bonus: 150, reply: ["r1", "Tomo nota. Ya hablaremos en la pasarela."] },
          { txt: "Voté lo que vi. No es nada personal.", rel: {}, reply: ["r1", "Para mí sí lo es. Ya hablaremos en la pasarela."] },
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
  aperturaAna: ["Voy a ser directa, {yo}.", "{yo}, vamos con el look.", "A ver, {yo}...", "{yo}, te he estado observando toda la semana.", "Mira, {yo}, te lo digo con cariño."],
  aperturaSupreme: ["{yo}, te toca.", "Vamos contigo, {yo}.", "{yo}, cariño, da un paso al frente.", "Turno de {yo}. Nervios, ¿eh?"],
  veredicto: {
    win: ["¡{yo}, felicidrages! Eres la ganadora del reto.", "{yo}, has ganado esta semana. ¡Enhorabuena!", "La ganadora de la semana es... ¡{yo}!"],
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
// Snatch Game en directo: celebridades para imitar (parodia cariñosa; las respuestas las escribe la jugadora)
const SNATCH_FAMOSOS = [
  { icon: "💃", name: "Lola Flores", tono: "copla, genio y taconeo" },
  { icon: "🎙️", name: "Rocío Jurado", tono: "diva de la canción española" },
  { icon: "🎶", name: "Raffaella Carrà", tono: "italiana, pop y fiesta" },
  { icon: "🌹", name: "Sara Montiel", tono: "glamour de cine antiguo" },
  { icon: "🐆", name: "Mónica Naranjo", tono: "intensa y operística" },
  { icon: "🖤", name: "Alaska", tono: "moderna, seca y con ironía" },
  { icon: "📺", name: "Belén Esteban", tono: "televisión y corazón" },
  { icon: "🔮", name: "Rappel", tono: "vidente con túnica" },
  { icon: "🥁", name: "Chiquito de la Calzada", tono: "chistes imposibles y palabras inventadas" },
  { icon: "🎤", name: "Massiel", tono: "festivalera y sin filtro" },
  { icon: "🏄", name: "Paz Padilla", tono: "gaditana y con mucha guasa" },
  { icon: "💿", name: "Rosalía", tono: "motomami y flamenco urbano" },
  { icon: "💋", name: "Marilyn Monroe", tono: "susurrante y coqueta" },
  { icon: "🪩", name: "Cher", tono: "diva eterna" },
  { icon: "👠", name: "Paquita Salas", tono: "representante castiza (personaje de ficción)" },
  { icon: "🧜", name: "Carmen Sevilla", tono: "entrañable y despistada" },
];
const SNATCH_PREGUNTAS = [
  "¿Cuál es tu secreto de belleza?", "¿Qué harías con un millón de euros?", "¿Cómo te preparas para una cita?", "¿Qué opinas del amor?",
  "¿Qué llevarías a una isla desierta?", "¿Cuál es tu plato favorito?", "¿Qué consejo le darías a las concursantes?", "¿Cómo te enfrentas a una ruptura?",
  "¿Qué opinas del gimnasio?", "¿Qué es lo primero que haces al levantarte?", "¿Cómo celebras tu cumpleaños?", "¿Qué harías si fueras presidenta del país?",
];
const SNATCH_PLANAS = ["Pues no sé, la verdad.", "Bien, supongo.", "Eso es muy personal.", "Mmm... siguiente pregunta.", "Lo normal, como todo el mundo.", "Ni idea, cariño."];

// ===========================================================================
// ROLES DETRÁS DE CÁMARAS: a cada reina se le asigna uno al empezar la
// temporada. Se descubren poco a poco (escenas, confesionario, untucked).
// r1 = la reina del rol, r2 = otra compañera.
// ===========================================================================
const ROLES_HISTORIA = {
  villana: {
    icon: "😈", name: "La villana", desc: "Juega sucio si hace falta. Vota en tu contra si puede.", voto: -1.2,
    escenas: [
      { lines: [["r2", "{yo}, ¿has visto tus pestañas? Estaban en tu puesto hace un momento..."], ["r1", "Uy, qué raro. Habrán volado. Pasa mucho aquí."]],
        choices: [
          { txt: "Sé que has sido tú, {r1}. Devuélvemelas.", rel: { r1: -1 }, bonus: 120, reply: ["r1", "Qué acusación tan fea. Toma, estaban en el suelo. Casualmente."] },
          { txt: "No pasa nada, tengo repuesto.", adv: -2, reply: ["r1", "Qué bien preparada. Me encanta. De verdad."] },
          { txt: "Supremme, alguien me está saboteando.", rel: { r1: -1 }, adv: 2, reply: ["host", "Reinas, en mi taller se compite limpio. Lo digo una vez."] },
        ] },
      { lines: [["r1", "{yo}, te lo digo como amiga: ese look de ayer no era para ti."], ["r1", "Yo que tú hoy iría a lo seguro. Algo discretito."]],
        choices: [
          { txt: "Gracias por el consejo. Voy a hacer justo lo contrario.", bonus: 150, adv: 2, reply: ["r1", "Allá tú. Luego no llores."] },
          { txt: "¿Tú crees? A lo mejor tienes razón...", adv: -3, reply: ["r1", "Claro que la tengo. Siempre la tengo."] },
          { txt: "Qué detalle preocuparte tanto por mí, {r1}.", rel: { r1: 1 }, reply: ["r1", "Ya ves. Soy un encanto."] },
        ] },
      { lines: [["r1", "¿Sabéis qué? Esta semana alguien se va a casa y no voy a ser yo."], ["r2", "Qué intensa te pones por las mañanas."], ["r1", "Intensa no. Realista. {yo}, ¿tú qué opinas?"]],
        choices: [
          { txt: "Opino que te vas a atragantar con tus palabras.", rel: { r1: -1 }, bonus: 120, reply: ["r1", "Ya veremos quién se atraganta, cariño."] },
          { txt: "Opino que hoy toca trabajar, no hablar.", adv: 2, reply: ["r2", "Amén."] },
        ] },
    ],
    confesionario: {
      bien: ["{yo} me cae bien. Es lo más peligroso que me puede pasar aquí dentro.", "No lo voy a decir dos veces: {yo} tiene nivel. Ya está, lo he dicho."],
      mal: ["{yo} va de buena, pero aquí nadie es buena. Yo por lo menos no finjo.", "Si tengo que elegir a quién mandar a casa, lo tengo clarísimo. Empieza por {yo}.", "{yo} me ha mirado mal en el espejo. Lo apunto."],
    },
    untucked: ["¿Qué? ¿Vienes a espiar o a hablar?", "Tranquila, que hoy no muerdo. Mucho."],
    reencuentro: "Yo no vine a hacer amigas. Y lo he conseguido.",
  },
  graciosa: {
    icon: "🤡", name: "La graciosa", desc: "Todo lo convierte en chiste. Te sube el ánimo.", voto: 0.3,
    escenas: [
      { lines: [["r1", "Reinas, noticia de última hora: he encontrado la dignidad de {r2}. Estaba debajo de la mesa."], ["r2", "¡Oye!"], ["r1", "Es broma, es broma. Estaba en la basura."]],
        choices: [
          { txt: "(Reírte a carcajadas)", rel: { r1: 1, r2: -1 }, adv: 2, reply: ["r1", "¡Por fin alguien con sentido del humor aquí!"] },
          { txt: "Pobre {r2}, déjala tranquila.", rel: { r2: 1 }, reply: ["r1", "Vale, vale, la defensora de las causas perdidas."] },
        ] },
      { lines: [["r1", "{yo}, te veo muy tensa. ¿Quieres que te cuente un chiste?"], ["r1", "¿Qué le dice una peluca a otra? Nos vemos en la cabeza de alguien."]],
        choices: [
          { txt: "Es malísimo. Cuéntame otro.", rel: { r1: 1 }, adv: 3, reply: ["r1", "¡Esa es mi chica! Ya estás más suelta."] },
          { txt: "Ahora no, {r1}, que me concentro.", adv: 1, reply: ["r1", "Vale, señora seria. Luego no me pidas risas."] },
        ] },
      { lines: [["r1", "He hecho un ranking de las peores pelucas del taller."], ["r2", "No te atrevas."], ["r1", "Número uno: la de {r2}. Número dos... uy, {yo}, tú mejor no mires."]],
        choices: [
          { txt: "¿Y la tuya en qué puesto va?", rel: { r1: 1 }, bonus: 100, reply: ["r1", "La mía está fuera de concurso. Es patrimonio."] },
          { txt: "Qué pesada eres a veces, {r1}.", rel: { r1: -1 }, reply: ["r1", "Pesada no, entrañable. Aprende la diferencia."] },
        ] },
    ],
    confesionario: {
      bien: ["{yo} se ríe de mis chistes. Eso ya la convierte en mi favorita.", "Si gana {yo}, pido ser su bufona oficial."],
      mal: ["{yo} tiene el sentido del humor de una silla. Una silla seria.", "A {yo} le he hecho mil chistes y ni una sonrisa. Algo le pasa."],
    },
    untucked: ["¡Brindemos! Por las que se quedan... y por las pelucas que no.", "Te veo con cara de funeral. ¿Quién ha muerto? ¿Tu look?"],
    reencuentro: "Me eliminaron, sí. Pero me fui con el mejor chiste de la temporada.",
  },
  cizanera: {
    icon: "🐍", name: "La metemierdas", desc: "Va contando cosas de unas a otras. Siembra cizaña.", voto: -0.5,
    escenas: [
      { lines: [["r1", "{yo}, ven un momento... No te lo quería decir, pero {r2} va diciendo que tu reto de ayer era de risa."], ["r1", "Yo no digo nada, eh. Solo te lo cuento."]],
        choices: [
          { txt: "Voy ahora mismo a hablar con {r2}.", rel: { r2: -1 }, reply: ["r2", "¿Yo? ¡Yo no he dicho eso! ¿Quién te lo ha contado?"] },
          { txt: "{r1}, ¿y tú por qué me lo cuentas?", rel: { r1: -1 }, adv: 2, reply: ["r1", "Por... por cariño. Qué desconfiada."] },
          { txt: "Me da igual lo que diga la gente.", adv: 1, reply: ["r1", "Vale, vale. Yo solo avisaba."] },
        ] },
      { lines: [["r1", "Oye, entre nosotras... ¿a quién mandarías tú a casa esta semana?"], ["r2", "(Desde la otra punta del taller) ¿Hablabais de mí?"]],
        choices: [
          { txt: "A nadie. No voy a entrar en ese juego.", rel: { r1: -1 }, adv: 2, reply: ["r1", "Qué sosa. Así no se gana, reina."] },
          { txt: "Pues a {r2}, la verdad.", rel: { r1: 1, r2: -2 }, bonus: 150, reply: ["r1", "¡Lo sabía! Tranquila, que no se lo digo a nadie. (Se lo dice a todas)"] },
        ] },
      { lines: [["r1", "¿Sabéis quién llora cada noche en el hotel? No lo voy a decir... Empieza por {r2}."], ["r2", "¡{r1}!"]],
        choices: [
          { txt: "Eso es muy feo, {r1}. Déjala.", rel: { r1: -1, r2: 1 }, reply: ["r2", "Gracias, {yo}. De verdad."] },
          { txt: "(Callarte y seguir cosiendo)", adv: 1, reply: ["r1", "Nadie me sigue el rollo hoy. Qué aburrimiento."] },
        ] },
    ],
    confesionario: {
      bien: ["A {yo} le cuento cosas porque es la única que me escucha. Y lo que me cuenta, bueno... circula.", "{yo} es buena gente. Pero le he oído decir cosas. Muchas cosas."],
      mal: ["¿Que si he contado lo de {yo}? Yo solo he contado la verdad. Mi versión de la verdad.", "{yo} se cree que no sé nada. Lo sé todo. Y todas lo van a saber."],
    },
    untucked: ["Ay, no sabes lo que me acaban de contar de ti...", "Siéntate, siéntate. Que tengo salseo del bueno."],
    reencuentro: "Yo nunca he metido cizaña. Yo informo. Es diferente.",
  },
  madre: {
    icon: "🫶", name: "La madre del grupo", desc: "Cuida de todas. Sus consejos siempre funcionan.", voto: 1,
    escenas: [
      { lines: [["r1", "{yo}, cariño, ¿has comido algo? Te traigo un bocadillo, que así no se cose."], ["r2", "¿Y para mí no hay?"], ["r1", "Para ti también, pesada. Aquí no se queda nadie sin comer."]],
        choices: [
          { txt: "Gracias, mamá {r1}. Te lo debo.", rel: { r1: 1 }, adv: 3, reply: ["r1", "Nada de deber. Tú gana, que me pongo muy contenta."] },
          { txt: "No tengo hambre, estoy muy nerviosa.", adv: -1, reply: ["r1", "Pues nerviosa y sin comer, peor. Te lo dejo aquí."] },
        ] },
      { lines: [["r1", "Ven, que te arreglo ese dobladillo. Llevas toda la mañana peleándote con él."], ["r1", "Así, ¿ves? Puntada pequeña y paciencia. Como en la vida."]],
        choices: [
          { txt: "No sé qué haría sin ti, {r1}.", rel: { r1: 1 }, adv: 4, reply: ["r1", "Sobrevivir, pero peor vestida."] },
          { txt: "Puedo sola, gracias.", rel: { r1: -1 }, bonus: 100, reply: ["r1", "Vale, vale. Pero si me necesitas, silba."] },
        ] },
      { lines: [["r2", "No puedo más, de verdad, no puedo..."], ["r1", "Eh, eh, mírame. Respira. Aquí estamos todas juntas."], ["r1", "{yo}, échame una mano con ella."]],
        choices: [
          { txt: "(Abrazar a {r2} con {r1})", rel: { r1: 1, r2: 1 }, adv: -1, reply: ["r2", "Gracias, chicas. Sois lo mejor de este concurso."] },
          { txt: "Lo siento, voy fatal de tiempo.", rel: { r1: -1 }, adv: 2, reply: ["r1", "Ya. Luego hablamos tú y yo."] },
        ] },
    ],
    confesionario: {
      bien: ["{yo} es como mi hija aquí dentro. Si se va, lloro más que ella.", "Me encanta ver crecer a {yo} semana a semana."],
      mal: ["Con {yo} me cuesta. No se deja cuidar. Y eso me preocupa.", "A {yo} le falta humildad. Se lo digo con cariño, pero se lo digo."],
    },
    untucked: ["Ven, siéntate aquí conmigo. ¿Cómo estás de verdad?", "Toma, bebe agua. Que el jurado te deja seca."],
    reencuentro: "Aunque me fui antes, os he seguido como una madre sigue a sus hijas.",
  },
  diva: {
    icon: "💅", name: "La diva", desc: "Se cree la ganadora desde el primer día. El espejo es suyo.", voto: -0.2,
    escenas: [
      { lines: [["r1", "Perdona, {yo}, pero ese espejo lo necesito yo. Mi cara necesita espacio."], ["r2", "Hay seis espejos más, {r1}."], ["r1", "Pero con esta luz no."]],
        choices: [
          { txt: "Todo tuyo, reina. Yo ya estoy perfecta.", bonus: 120, reply: ["r1", "Qué seguridad... Ya veremos en la pasarela."] },
          { txt: "No. Llegué yo primero.", rel: { r1: -1 }, adv: 1, reply: ["r1", "Increíble. En mi otra vida esto no pasaba."] },
          { txt: "Compartimos, ¿vale? Tú la izquierda, yo la derecha.", rel: { r1: 1 }, reply: ["r1", "Vale. Pero mi lado bueno es el izquierdo, que lo sepas."] },
        ] },
      { lines: [["r1", "Reinas, os lo digo ya para que no os llevéis sorpresas: esta corona es mía."], ["r2", "Qué humilde."], ["r1", "La humildad no gana coronas, cariño."]],
        choices: [
          { txt: "La corona se gana, no se reserva.", rel: { r1: -1 }, bonus: 150, reply: ["r1", "Qué frase tan bonita. Enmárcala."] },
          { txt: "Si te lo crees tú, algo es.", rel: { r1: 1 }, reply: ["r1", "¡Exacto! Tú lo entiendes. Por eso me caes bien."] },
        ] },
    ],
    confesionario: {
      bien: ["{yo} tiene algo. No tanto como yo, pero algo.", "Si alguien me va a quitar la corona, que sea {yo}. Pero no va a pasar."],
      mal: ["¿{yo}? ¿Quién es {yo}? Ah, sí, la de la peluca de ayer.", "{yo} está aquí para hacer bulto. Y bulto hace."],
    },
    untucked: ["Habla rápido, que el champán se calienta.", "¿Has visto mi look? Dilo. Dilo en voz alta."],
    reencuentro: "Sigo pensando que la corona era mía. Pero bueno, la vida es injusta.",
  },
  sensible: {
    icon: "😭", name: "La sensible", desc: "Lo vive todo a flor de piel. Si la hieres, se derrumba.", voto: 0.5,
    escenas: [
      { lines: [["r1", "(Llorando en un rincón) Perdón, perdón, es que me he acordado de mi abuela..."], ["r2", "Otra vez no..."]],
        choices: [
          { txt: "(Sentarte con ella) Cuéntame, te escucho.", rel: { r1: 2 }, adv: -2, reply: ["r1", "Gracias, {yo}. Nadie se había parado a escucharme."] },
          { txt: "{r2}, un poco de empatía, ¿no?", rel: { r1: 1, r2: -1 }, reply: ["r2", "Vale, vale... Perdona, {r1}."] },
          { txt: "(Seguir con lo tuyo)", adv: 2, reply: ["r1", "(Sigue llorando más bajito)"] },
        ] },
      { lines: [["r1", "{yo}, ¿tú crees que valgo para esto? Dime la verdad."]],
        choices: [
          { txt: "Claro que sí. Eres de las mejores aquí.", rel: { r1: 1 }, reply: ["r1", "¿De verdad? Me acabas de alegrar la semana."] },
          { txt: "Valdrás si dejas de dudar tanto.", bonus: 100, reply: ["r1", "Tienes razón... Lo voy a intentar."] },
        ] },
    ],
    confesionario: {
      bien: ["{yo} me ha sujetado cuando más lo necesitaba. No lo voy a olvidar nunca.", "Si me voy, lo que más voy a echar de menos es a {yo}."],
      mal: ["{yo} me hizo mucho daño con lo que dijo. Yo sonrío, pero por dentro...", "No sé qué le he hecho a {yo}. Pero me duele."],
    },
    untucked: ["Perdona, tengo el rímel hecho un desastre... ¿Qué tal estás tú?", "Me alegro mucho de que hayas venido a hablar conmigo."],
    reencuentro: "He llorado mucho viendo el programa. Pero de orgullo, ¿eh?",
  },
  estratega: {
    icon: "♟️", name: "La estratega", desc: "Lo calcula todo. Busca alianzas para llegar a la final.", voto: 0,
    escenas: [
      { lines: [["r1", "{yo}, te propongo algo. Tú y yo nos cubrimos: si una cae, la otra la salva."], ["r1", "Llegamos juntas a la final y allí, que gane la mejor."]],
        choices: [
          { txt: "Trato hecho. Juntas hasta el final.", rel: { r1: 2 }, reply: ["r1", "Sabía que eras lista. Esto queda entre nosotras."] },
          { txt: "Yo no hago pactos. Voy sola.", rel: { r1: -1 }, bonus: 150, reply: ["r1", "Respetable. Pero sola se llega menos lejos."] },
        ] },
      { lines: [["r1", "He hecho números. Si esta semana cae {r2}, mi camino a la final queda despejado."], ["r1", "Y el tuyo también, {yo}. Piénsalo."]],
        choices: [
          { txt: "Me interesa. ¿Qué propones?", rel: { r1: 1, r2: -1 }, adv: 2, reply: ["r1", "Nada ilegal. Solo... no la ayudes. Lo demás viene solo."] },
          { txt: "{r2} no me ha hecho nada. Paso.", rel: { r1: -1, r2: 1 }, reply: ["r1", "Tú verás. Yo aviso."] },
        ] },
    ],
    confesionario: {
      bien: ["{yo} es una pieza clave en mi plan. De momento.", "Con {yo} de mi lado, la final está más cerca."],
      mal: ["{yo} no entra en mis planes. Así que tendré que sacarla de ellos.", "Todas tenemos un plan. El de {yo} es malo."],
    },
    untucked: ["Siéntate. Tenemos que hablar de las próximas semanas.", "He estado pensando en quién se va. ¿Quieres saberlo?"],
    reencuentro: "Mi estrategia era perfecta. El problema fue el lip sync.",
  },
  novata: {
    icon: "🐣", name: "La novata", desc: "Llega sin experiencia y con muchas ganas. Aprende de ti.", voto: 0.6,
    escenas: [
      { lines: [["r1", "{yo}, perdona... ¿cómo haces para que no se te mueva la peluca? A mí se me cae en cada vuelta."], ["r2", "Con cinco horquillas y rezando."]],
        choices: [
          { txt: "Ven, que te enseño mi truco.", rel: { r1: 2 }, adv: -1, reply: ["r1", "¡Muchísimas gracias! Te debo una. O dos."] },
          { txt: "Eso se aprende con los años, cielo.", bonus: 80, reply: ["r1", "Ah... vale. Lo buscaré en un tutorial."] },
        ] },
      { lines: [["r1", "Es mi primera vez en un escenario tan grande. ¡Estoy muy emocionada!"], ["r2", "Ay, qué tierna. Ya se te pasará."]],
        choices: [
          { txt: "Disfrútalo, que eso se nota en la pasarela.", rel: { r1: 1 }, adv: 1, reply: ["r1", "¡Eso haré! Gracias, {yo}."] },
          { txt: "Pues aquí se viene a competir, no a emocionarse.", rel: { r1: -1 }, bonus: 120, reply: ["r1", "Vale... Tomo nota."] },
        ] },
    ],
    confesionario: {
      bien: ["{yo} es mi referente aquí dentro. Quiero ser como ella de mayor.", "Todo lo que sé de maquillaje me lo ha enseñado {yo} esta semana."],
      mal: ["{yo} me mira por encima del hombro. Pero ya aprenderé y le daré una sorpresa.", "Creía que {yo} era simpática. Me equivoqué."],
    },
    untucked: ["¡Qué fuerte todo lo que está pasando! ¿Tú cómo lo llevas?", "Me está encantando esto. ¿Es normal estar tan nerviosa?"],
    reencuentro: "Entré sin saber nada y salí sabiendo… bueno, un poco más.",
  },
};
const ROLES_ORDEN = ["villana", "cizanera", "graciosa", "madre", "diva", "sensible", "estratega", "novata"];

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
const REENCUENTRO = {
  intro: [
    [["host", "Antes de la gran final, reinas... ¡ha llegado el reencuentro!"], ["host", "Vuelven todas las eliminadas. Y vienen con cosas que decir."], ["judge", "Esto se va a poner interesante."]],
    [["host", "Top 4, estáis en la final. Pero antes toca mirar atrás."], ["host", "¡Que pasen las reinas de {temporada}!"], ["r1", "¡Hola, hola! ¿Me habéis echado de menos?"]],
  ],
  buena: [
    [["r1", "¡{yo}! Ven aquí, dame un abrazo. Estoy orgullosísima de ti."], ["me", "Te he echado mucho de menos, {r1}."], ["r1", "Ahora gana esa corona por las dos."]],
    [["r1", "Te he visto cada semana desde el sofá, gritando como una loca."], ["r1", "Ni mi madre me anima así en los partidos."]],
  ],
  neutra: [
    [["r1", "Hola, {yo}. Enhorabuena por la final. De verdad."], ["me", "Gracias, {r1}. Te lo merecías tú también."], ["r1", "Bueno... eso díselo al jurado."]],
    [["r1", "No hablamos mucho dentro, ¿verdad?"], ["me", "Pues no. Una pena."], ["r1", "Siempre hay tiempo. Después de la final, unas cañas."]],
  ],
  mala: [
    [["r1", "Ah, mira quién está en la final. Qué sorpresa."], ["r1", "Yo me acuerdo de todo, {yo}. De TODO."], ["host", "Uy, uy, uy. Esto no lo esperaba."]],
    [["r1", "Tengo una cosa que decirte delante de todas."], ["r1", "Lo que me hiciste no estuvo bien. Y viéndolo desde casa, peor."]],
  ],
  choicesMala: [
    { txt: "Tienes razón. Te pido perdón.", rel: { r1: 2 }, reply: ["r1", "Vale... Eso no me lo esperaba. Gracias."] },
    { txt: "Era una competición. No me arrepiento.", bonus: 200, reply: ["r1", "Pues que te aproveche la corona. Si la ganas."] },
  ],
  drama: [
    [["r1", "Yo solo quiero decir una cosa: aquí dentro alguien jugó sucio."], ["r2", "¿Lo dices por mí?"], ["r1", "Si te pica, ráscate."], ["host", "¡Reinas, por favor! Bueno, seguid, seguid."]],
    [["r1", "He visto el programa. Y he visto lo que decías de mí en el confesionario, {r2}."], ["r2", "Era una broma..."], ["r1", "Pues no me he reído."]],
    [["r1", "Quiero dar las gracias a todas. Menos a una. Ella sabe quién es."], ["r2", "Qué valiente sin decir nombres."]],
  ],
  missIntro: [["host", "Y ahora, el momento más bonito del reencuentro."], ["host", "Las reinas van a votar a su Miss Simpatía: la compañera más querida de la temporada."], ["judge", "El voto es sincero. Aquí no se puede fingir."]],
};

// ------------------------------- Final ------------------------------------
const FINAL_SORTEO = [
  [["host", "Reinas, así va a ser la final: cuatro reinas, dos lip syncs."], ["host", "El sorteo decide las parejas. Las ganadoras se enfrentarán por la corona."], ["judge", "Disfrutadlo. Os lo habéis ganado."]],
];

// ------------------------------- Capitanas ----------------------------------
const CAPITANAS = {
  intro: [
    [["host", "Reinas, esta semana trabajaréis en equipos. Pero antes... ¡minirreto!"], ["host", "Las dos ganadoras serán las capitanas y elegirán a su equipo."]],
    [["host", "¡Minirreto! Las dos mejores serán capitanas."], ["r1", "Por favor, que no me toque elegir, que lo paso fatal."]],
  ],
  miniTitulos: ["¡Posa con el flash!", "¡Pelucas al aire!", "¡Selfie de lujo!", "¡Rápidas como el rayo!"],
};

// ------------------------------- Nuevos retos -------------------------------
const COMEDIA = [
  ["Empieza tu monólogo hablando de tu familia", ["Mi madre me pregunta cuándo me caso. Le digo: cuando encuentre a alguien con más pelucas que yo", "Mi familia es muy graciosa, la verdad", "Tengo una familia normal"]],
  ["Cuenta algo de tu primera vez en drag", ["Salí con tacones de mi prima. Dos números menos. Aún no siento los meñiques", "Fue muy emocionante", "Me puse un vestido"]],
  ["Un chiste sobre el gimnasio", ["Me apunté al gimnasio en enero. Ya he ido tres veces: a apuntarme, a darme de baja y a por la toalla", "El gimnasio cansa mucho", "No me gusta el gimnasio"]],
  ["Habla del transporte público", ["En el metro de Madrid a las ocho estás tan pegada que sales embarazada de tres desconocidos", "El metro va lleno", "Voy en autobús"]],
  ["Remata con algo sobre el amor", ["Mi último novio me dejó por mensaje. Con faltas. Por eso lloré", "El amor es complicado", "Estoy soltera"]],
  ["Un chiste sobre tu pueblo", ["En mi pueblo hay tan poca gente que el cotilleo lo hace una sola señora. Y hace horas extra", "Mi pueblo es pequeño", "Soy de un pueblo"]],
  ["Habla de las citas por aplicación", ["Me dijo que medía uno ochenta. Con mis tacones, puede", "Las apps de citas son raras", "Uso aplicaciones"]],
  ["Cierra el monólogo por todo lo alto", ["Gracias, sois un público maravilloso. Casi tanto como mi peluca", "Gracias por venir", "Ya está, eso es todo"]],
];
const ROAST = [
  ["Asa a Supremme por lo bien que se conserva", ["Supremme no envejece: se restaura, como el Prado", "Supremme está muy guapa", "Supremme es mayor"]],
  ["Asa a Ana Locking por lo exigente que es", ["Ana es tan exigente que devolvió el sol por falta de brillo", "Ana es muy exigente", "Ana es seria"]],
  ["Asa a la reina que siempre llega la última", ["Llega tan tarde que su tarjeta de presentación pone: continuará", "Siempre llega tarde", "Es impuntual"]],
  ["Asa a la compañera más dramática", ["Hace un drama hasta para elegir la pajita del zumo", "Es muy dramática", "Le gusta el drama"]],
  ["Asa a la reina con más maquillaje", ["Si le quitas el maquillaje, pierde tres kilos y el DNI", "Lleva mucho maquillaje", "Se maquilla mucho"]],
  ["Asa a la que siempre gana", ["Gana tanto que el trofeo ya tiene su dirección en el GPS", "Gana mucho", "Es buena"]],
  ["Asa a la que peor canta", ["Cuando canta, los perros del barrio le piden silencio", "Canta regular", "No canta bien"]],
];
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
JURADO.reto.comedia = {
  top: ["Timing perfecto. Sabías cuándo parar y cuándo rematar.", "Me he reído de verdad, y no me pasa desde hace años.", "Tenías al público en la palma de la mano."],
  mid: ["Algunos chistes buenos, otros que se quedaron colgando.", "Has empezado fuerte y te has ido desinflando.", "Graciosa, pero te faltó personalidad en el texto."],
  low: ["Eso no era un monólogo, era una lista de la compra.", "El público se reía por pena. Y eso duele verlo.", "Te has quedado en blanco más de lo que has hablado."],
};
JURADO.reto.roast = {
  top: ["Afilada sin ser cruel. Eso es un roast de verdad.", "Me has asado a mí y encima me ha gustado.", "Cada remate llegaba justo a tiempo. Bravo."],
  mid: ["Tenías buenas ideas, pero no rematabas.", "Algunos golpes muy buenos, otros muy blanditos.", "Te faltó maldad. Un poquito solo."],
  low: ["Eso no era un roast, era un informe.", "No te has atrevido con nada. Y en un roast eso se paga.", "Ni se han picado las roasteadas."],
};
JURADO.reto.actuacion = {
  top: ["Te sabías el guion y encima lo has hecho tuyo.", "Has hecho que un texto absurdo pareciera de Almodóvar.", "Presencia, texto y verdad. Actriz."],
  mid: ["Te trabaste un par de veces, pero saliste bien.", "Correcta. Un poco plana en las escenas clave.", "La energía estaba, el texto no tanto."],
  low: ["No te sabías el guion y se ha notado en cada escena.", "Improvisar está bien, pero no todo el rato.", "Te he visto leer el apuntador con los ojos."],
};
JURADO.reto.ball = {
  top: ["Tres looks, tres historias. El ball es tuyo.", "Cada look superaba al anterior. Eso es saber construir.", "Has entendido las tres categorías a la perfección."],
  mid: ["Dos looks muy buenos y uno que sobraba.", "El último look no estaba a la altura de los otros.", "Buena idea general, ejecución irregular."],
  low: ["Los tres looks parecían el mismo con distinto color.", "La categoría no se entendía en ninguno.", "Un ball sin sorpresa no es un ball."],
};
JURADO.reto.makeover = {
  top: ["Parecéis familia de verdad. Qué parecido tan logrado.", "El makeover es impecable. Has sacado a una reina de donde no había.", "Esa conexión con tu pareja se ve desde aquí."],
  mid: ["El parecido está, pero los acabados fallan.", "Buena química, maquillaje mejorable.", "Vais a juego, pero no parecéis familia."],
  low: ["No sé cuál de las dos es la drag. Ni ellas tampoco.", "El makeover está a medias. Literalmente.", "Ahí no hay parecido ni con buena voluntad."],
};
JURADO.reto.fotos = {
  top: ["Cada foto es una portada. No hay ni una mala.", "Sabes dónde está la cámara siempre. Eso es un don.", "El fotógrafo me ha dicho que eres la mejor del día."],
  mid: ["Algunas fotos preciosas y otras en las que no estabas.", "Te costó arrancar, pero al final encontraste la luz.", "Buenas poses, pero demasiado repetidas."],
  low: ["En la mitad de las fotos sales parpadeando.", "Llegabas tarde a cada flash.", "No he podido elegir ninguna foto buena. Ninguna."],
};
JURADO.reto.equipos = JURADO.reto.equipos || JURADO.reto.rusical;

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
    { lines: [["r2", "He oído a {g1} criticar mi look del otro día. Que lo digan a la cara."], ["r1", "Te lo digo a la cara: parecía un mantel de boda."], ["host", "Uy, uy. Esto no me lo pierdo."]] },
    { lines: [["r1", "Ayer en el Untucked {g2} votaba en bloque. Eso es jugar sucio."], ["r2", "Eso es tener amigas, cariño. Búscate unas."]] },
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
if (typeof JURADO !== "undefined") {
  JURADO.reto.impro = {
    top: ["Qué cintura en directo. Pasara lo que pasara, tú seguías.", "Eres una presentadora nata. Contrátenla ya.", "Has salvado cada silencio con una salida brillante."],
    mid: ["Algunos momentos muy buenos, otros te quedaste en blanco.", "Buen ritmo al principio, luego se te fue el programa.", "Correcta, pero muy de guion."],
    low: ["El directo te ha comido viva.", "Cada imprevisto era un silencio. Y el silencio en la tele es muerte.", "Parecías una espectadora de tu propio programa."],
  };
}

// ===========================================================================
// LOS JAVIS: visitan el taller, anuncian minirretos y opinan en el jurado.
// Hablan como jurado del juego (frases inventadas, no citas reales).
// ===========================================================================
const JAVIS = {
  taller: [
    [["host", "Reinas, hoy tenemos visita en el taller..."], ["ambrossi", "¡Hola, hola! ¿Se puede? Venimos a cotillear."], ["calvo", "A cotillear y a ayudar. Sobre todo a cotillear."]],
    [["calvo", "¡Pero qué taller más bonito! Esto huele a laca y a nervios."], ["ambrossi", "Y a pegamento de pestañas. Mucho pegamento."], ["r1", "¡Los Javis! Me tiemblan las piernas."]],
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
HISTORIA.tallerHost.push(...JAVIS.taller);

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
const ESTILO_CRITICA = {
  top: ["Lo que llevas es exactamente «{cat}». Ni una pieza fuera de sitio.", "El estilismo es impecable: se nota que lo has pensado de arriba abajo.", "Con lo de {pieza} me has ganado antes de llegar al final de la pasarela."],
  mid: ["La idea de «{cat}» está, pero lo de {pieza} no termina de encajar.", "Hay piezas muy buenas y otras que parecen de otro armario.", "Bonito, aunque le falta coherencia al conjunto."],
  low: ["¿{pieza}, para «{cat}»? No lo entiendo, y mira que lo intento.", "Cada pieza iba por su lado. Parecía un mercadillo.", "La categoría era «{cat}». Creo que no te llegó el mensaje."],
};
if (typeof JURADO !== "undefined") {
  JURADO.reto.publicidad = {
    top: ["Me has vendido algo que no sirve para nada y lo quiero ya.", "Eslogan camp, texto clavado. Contratada por la agencia.", "Ese anuncio lo pondría en prime time."],
    mid: ["La idea es buena, pero te has trabado en lo importante.", "El producto hace gracia; el anuncio, a ratos.", "Te ha faltado un poco más de locura."],
    low: ["No sé qué vendías, y creo que tú tampoco.", "Eso no era un anuncio, era una lectura de prospecto.", "Cero camp. Y aquí el camp es obligatorio."],
  };
  JURADO.reto.lalaparuza = {
    top: ["Has arrasado en el torneo. Eres una asesina del lip sync.", "Ronda tras ronda, sin bajar el nivel. Brutal.", "Nadie ha podido contigo en ese escenario."],
    mid: ["Buen torneo, aunque te quedaste a las puertas.", "Elegiste bien las canciones, pero te faltó fuelle al final.", "Una ronda más y hablábamos de otra cosa."],
    low: ["Te has ido a la primera. Eso duele.", "Elegiste mal la canción y lo pagaste.", "Te faltó energía desde el primer segundo."],
  };
}

// Armario con fotos reales (images/armario/<id>.webp)
const ARMARIO = {"look": [{"id": "oro-plumas", "n": "Vestido de cristales dorado con plumas", "s": "glam", "t": ["Look de gala", "Brilla, brilla"]}, {"id": "tarta", "n": "Vestido tarta de fresa", "s": "retro", "t": ["Camp absoluto", "Comida basura de lujo"]}, {"id": "charol-pinchos", "n": "Corsé de charol con pinchos", "s": "street", "t": ["Cuero y tachuelas"]}, {"id": "cromo-halo", "n": "Body de cromo líquido con halo", "s": "futur", "t": ["Futurista", "Galaxia lejana"]}, {"id": "flamenca-fucsia", "n": "Flamenca de lentejuela fucsia", "s": "folk", "t": ["Folclore reinventado", "Verbena de pueblo"]}, {"id": "plumas-rojo", "n": "Vestido de plumas rojo", "s": "glam", "t": ["Rojo pasión", "Look de gala"]}, {"id": "palomitas", "n": "Vestido caja de palomitas", "s": "retro", "t": ["Comida basura de lujo", "Camp absoluto"]}, {"id": "leopardo-abrigo", "n": "Mono de leopardo con abrigo de pelo", "s": "street", "t": ["Animal print"]}, {"id": "espacial", "n": "Traje espacial holográfico con LEDs", "s": "futur", "t": ["Galaxia lejana", "Futurista"]}, {"id": "manola", "n": "Vestido de manola de encaje negro", "s": "folk", "t": ["Blanco y negro", "Folclore reinventado"]}, {"id": "manto-real", "n": "Manto real de armiño y oro", "s": "glam", "t": ["Realeza"]}, {"id": "discoball", "n": "Vestido de espejos de discoteca", "s": "glam", "t": ["Brilla, brilla", "Años 80"]}, {"id": "perlas-sirena", "n": "Sirena bordada de perlas", "s": "glam", "t": ["Look de gala"]}, {"id": "piruletas", "n": "Vestido de piruletas", "s": "retro", "t": ["Camp absoluto", "Comida basura de lujo"]}, {"id": "vedette", "n": "Vedette con cola de plumas rosa", "s": "retro", "t": ["Camp absoluto", "Años 80"]}, {"id": "latex-rojo", "n": "Gabardina de látex roja", "s": "street", "t": ["Rojo pasión", "Cuero y tachuelas"]}, {"id": "punk", "n": "Vestido punk de cuadros", "s": "street", "t": ["Cuero y tachuelas"]}, {"id": "astronauta", "n": "Mini astronauta hinchable", "s": "futur", "t": ["Futurista", "Galaxia lejana"]}, {"id": "acrilico", "n": "Armadura de acrílico iridiscente", "s": "futur", "t": ["Futurista", "Brilla, brilla"]}, {"id": "fallera", "n": "Traje de fallera de brocado dorado", "s": "folk", "t": ["Folclore reinventado", "Realeza"]}, {"id": "bata-cola", "n": "Bata de cola morada", "s": "folk", "t": ["Folclore reinventado", "Verbena de pueblo"]}, {"id": "petalos", "n": "Vestido de pétalos de rosa", "s": "glam", "t": ["Rojo pasión", "Flores y más flores"]}, {"id": "opart", "n": "Vestido op-art blanco y negro", "s": "street", "t": ["Blanco y negro"]}, {"id": "lentejuela-roja", "n": "Vestido de lentejuela roja", "s": "glam", "t": ["Rojo pasión", "Brilla, brilla"]}, {"id": "hombreras", "n": "Traje de hombreras fucsia", "s": "retro", "t": ["Años 80"]}, {"id": "latex-plata", "n": "Mono de látex plateado", "s": "futur", "t": ["Futurista"]}, {"id": "capa-armino", "n": "Capa de terciopelo y armiño", "s": "glam", "t": ["Realeza"]}, {"id": "body-leopardo", "n": "Body de leopardo", "s": "street", "t": ["Animal print"]}, {"id": "flamenca-lunares", "n": "Flamenca de lunares", "s": "folk", "t": ["Folclore reinventado", "Verbena de pueblo"]}, {"id": "flores", "n": "Vestido de flores bordadas", "s": "folk", "t": ["Flores y más flores"]}, {"id": "esmoquin", "n": "Esmoquin bicolor", "s": "street", "t": ["Blanco y negro"]}, {"id": "sirena-azul", "n": "Sirena de satén azul noche", "s": "glam", "t": ["Look de gala"]}, {"id": "mini-cristales", "n": "Mini de cristales", "s": "glam", "t": ["Brilla, brilla"]}, {"id": "chandal", "n": "Chándal de pedrería", "s": "retro", "t": ["Camp absoluto", "Años 80"]}], "peluca": [{"id": "platino", "n": "Melena platino de Hollywood", "s": "glam", "t": ["Look de gala"]}, {"id": "algodon", "n": "Colmena de algodón de azúcar", "s": "retro", "t": ["Camp absoluto", "Comida basura de lujo"]}, {"id": "cresta", "n": "Cresta negra con tachuelas", "s": "street", "t": ["Cuero y tachuelas"]}, {"id": "bob-cromo", "n": "Bob geométrico cromado", "s": "futur", "t": ["Futurista"]}, {"id": "peineta-rosas", "n": "Moño con rosas y peineta", "s": "folk", "t": ["Folclore reinventado", "Rojo pasión"]}, {"id": "disco-roja", "n": "Rizos disco pelirrojos", "s": "retro", "t": ["Años 80"]}, {"id": "unicornio", "n": "Coletas de unicornio", "s": "retro", "t": ["Camp absoluto"]}, {"id": "mullet-leopardo", "n": "Mullet de leopardo", "s": "street", "t": ["Animal print"]}, {"id": "recogido-espacial", "n": "Recogido espacial de cristales", "s": "futur", "t": ["Galaxia lejana", "Brilla, brilla"]}, {"id": "trenzas-flores", "n": "Corona de trenzas con flores", "s": "folk", "t": ["Flores y más flores", "Verbena de pueblo"]}, {"id": "trenza-real", "n": "Recogido real de trenzas doradas", "s": "glam", "t": ["Realeza"]}, {"id": "negra-lisa", "n": "Melena negra infinita", "s": "glam", "t": ["Look de gala", "Blanco y negro"]}, {"id": "cardado-rubio", "n": "Cardado rubio sesentero", "s": "retro", "t": ["Años 80"]}, {"id": "verde-neon", "n": "Rapado asimétrico verde neón", "s": "street", "t": ["Cuero y tachuelas"]}, {"id": "trenzas-cyber", "n": "Trenzas cyber plateadas", "s": "futur", "t": ["Futurista", "Galaxia lejana"]}, {"id": "rizos-claveles", "n": "Rizos negros con claveles y oro", "s": "folk", "t": ["Folclore reinventado", "Rojo pasión"]}, {"id": "ondas-cobre", "n": "Ondas de cobre de los 40", "s": "glam", "t": ["Look de gala"]}, {"id": "helado", "n": "Peluca de helado pastel", "s": "retro", "t": ["Comida basura de lujo", "Camp absoluto"]}, {"id": "bob-bicolor", "n": "Bob blanco y negro", "s": "street", "t": ["Blanco y negro"]}, {"id": "ola-azul", "n": "Ola metálica azul", "s": "futur", "t": ["Futurista"]}, {"id": "monos-lunares", "n": "Moños con lazos de lunares", "s": "folk", "t": ["Verbena de pueblo"]}, {"id": "maria-antonieta", "n": "Pouf de María Antonieta", "s": "glam", "t": ["Realeza"]}, {"id": "afro-leopardo", "n": "Afro de leopardo", "s": "street", "t": ["Animal print"]}, {"id": "melena-roja", "n": "Melena roja de fuego", "s": "glam", "t": ["Rojo pasión"]}, {"id": "cardado-xxl", "n": "Cardado XXL", "s": "retro", "t": ["Años 80"]}, {"id": "mono-peineta", "n": "Moño con peineta", "s": "folk", "t": ["Folclore reinventado"]}, {"id": "bob-plata", "n": "Bob plateado", "s": "futur", "t": ["Futurista"]}, {"id": "rizos-rubios", "n": "Rizos rubios de reina", "s": "glam", "t": ["Realeza", "Look de gala"]}, {"id": "coleta-leopardo", "n": "Coleta de leopardo", "s": "street", "t": ["Animal print"]}, {"id": "corona-flores", "n": "Corona de flores", "s": "folk", "t": ["Flores y más flores"]}, {"id": "pixie-bicolor", "n": "Pixie bicolor", "s": "street", "t": ["Blanco y negro"]}, {"id": "ondas-castanas", "n": "Ondas al agua", "s": "glam", "t": ["Look de gala"]}, {"id": "tupe-rosa", "n": "Tupé ochentero rosa", "s": "retro", "t": ["Años 80", "Camp absoluto"]}, {"id": "rastas", "n": "Rastas arcoíris", "s": "retro", "t": ["Camp absoluto"]}], "acc": [{"id": "corona-cristal", "n": "Corona de cristal", "s": "glam", "t": ["Realeza"]}, {"id": "abanico-encaje", "n": "Abanico de encaje rojo", "s": "folk", "t": ["Folclore reinventado", "Rojo pasión"]}, {"id": "gafas-led", "n": "Gafas LED", "s": "futur", "t": ["Futurista", "Galaxia lejana"]}, {"id": "gargantilla", "n": "Gargantilla de pinchos", "s": "street", "t": ["Cuero y tachuelas"]}, {"id": "aros-oro", "n": "Aros de oro gigantes", "s": "retro", "t": ["Años 80"]}, {"id": "boa", "n": "Boa de plumas fucsia", "s": "glam", "t": ["Camp absoluto"]}, {"id": "guantes-strass", "n": "Guantes de strass", "s": "glam", "t": ["Look de gala", "Brilla, brilla"]}, {"id": "bolso-burger", "n": "Bolso hamburguesa", "s": "retro", "t": ["Comida basura de lujo"]}, {"id": "manton-crema", "n": "Mantón bordado", "s": "folk", "t": ["Folclore reinventado", "Flores y más flores"]}, {"id": "brazaletes", "n": "Brazaletes cíborg", "s": "futur", "t": ["Futurista"]}, {"id": "estola", "n": "Estola de leopardo con cadenas", "s": "street", "t": ["Animal print"]}, {"id": "mk-oro", "n": "Paleta de oro", "s": "glam", "t": ["Look de gala", "Brilla, brilla"]}, {"id": "mk-payaso", "n": "Kit de payaso camp", "s": "retro", "t": ["Camp absoluto"]}, {"id": "mk-grafico", "n": "Delineado gráfico con strass", "s": "street", "t": ["Blanco y negro", "Cuero y tachuelas"]}, {"id": "mk-holo", "n": "Paleta holográfica", "s": "futur", "t": ["Galaxia lejana", "Futurista"]}, {"id": "mk-rosa", "n": "Labio rojo y rosa", "s": "folk", "t": ["Rojo pasión", "Folclore reinventado"]}, {"id": "mk-gemas", "n": "Gemas de cara", "s": "glam", "t": ["Brilla, brilla"]}, {"id": "tiara-rubies", "n": "Tiara de rubíes", "s": "glam", "t": ["Realeza", "Rojo pasión"]}, {"id": "bolso-disco", "n": "Bolso bola de discoteca", "s": "glam", "t": ["Brilla, brilla", "Años 80"]}, {"id": "cetro", "n": "Cetro de caramelo", "s": "retro", "t": ["Comida basura de lujo", "Camp absoluto"]}, {"id": "bolso-pollo", "n": "Bolso pollo de goma", "s": "retro", "t": ["Camp absoluto"]}, {"id": "candado", "n": "Cadenas con candado", "s": "street", "t": ["Cuero y tachuelas"]}, {"id": "guantes-encaje", "n": "Guantes de encaje y anillos", "s": "street", "t": ["Blanco y negro"]}, {"id": "gafas-cyber", "n": "Gafas cyber holográficas", "s": "futur", "t": ["Futurista"]}, {"id": "earcuffs", "n": "Ear cuffs de cromo", "s": "futur", "t": ["Galaxia lejana"]}, {"id": "castanuelas", "n": "Castañuelas", "s": "folk", "t": ["Folclore reinventado", "Verbena de pueblo"]}, {"id": "mantilla", "n": "Peineta y mantilla", "s": "folk", "t": ["Folclore reinventado", "Blanco y negro"]}, {"id": "abanico-plumas", "n": "Abanico de plumas rosa", "s": "glam", "t": ["Look de gala"]}, {"id": "gafas-leopardo", "n": "Gafas de leopardo", "s": "street", "t": ["Animal print"]}, {"id": "mk-contorno", "n": "Contouring oro rosa", "s": "glam", "t": ["Look de gala"]}, {"id": "mk-cartoon", "n": "Kit drag de dibujos", "s": "retro", "t": ["Camp absoluto"]}, {"id": "mk-gotico", "n": "Labio negro gótico", "s": "street", "t": ["Cuero y tachuelas", "Blanco y negro"]}, {"id": "mk-neon", "n": "Pinturas neón UV", "s": "futur", "t": ["Futurista", "Galaxia lejana"]}, {"id": "mk-flamenco", "n": "Paleta flamenca roja y oro", "s": "folk", "t": ["Folclore reinventado", "Rojo pasión"]}, {"id": "mk-perlas", "n": "Perlas de cara", "s": "glam", "t": ["Realeza"]}, {"id": "abanico-rojo", "n": "Abanico rojo clásico", "s": "folk", "t": ["Folclore reinventado"]}, {"id": "corona-fina", "n": "Corona de pedrería", "s": "glam", "t": ["Realeza"]}, {"id": "visera", "n": "Gafas de visera", "s": "futur", "t": ["Futurista"]}, {"id": "aros", "n": "Pendientes de aro", "s": "retro", "t": ["Años 80"]}, {"id": "guantes-leopardo", "n": "Guantes de leopardo", "s": "street", "t": ["Animal print"]}, {"id": "ramo", "n": "Ramo de flores", "s": "folk", "t": ["Flores y más flores"]}, {"id": "collar-perlas", "n": "Collar de perlas", "s": "glam", "t": ["Look de gala", "Blanco y negro"]}, {"id": "bolso-purpurina", "n": "Bolso de purpurina", "s": "glam", "t": ["Brilla, brilla"]}, {"id": "manton-rojo", "n": "Mantón de Manila", "s": "folk", "t": ["Folclore reinventado", "Flores y más flores"]}, {"id": "rinonera", "n": "Riñonera flúor", "s": "retro", "t": ["Años 80", "Camp absoluto"]}, {"id": "mk-dorado", "n": "Maquillaje dorado", "s": "glam", "t": ["Look de gala"]}, {"id": "mk-byn", "n": "Delineado blanco y negro", "s": "street", "t": ["Blanco y negro"]}, {"id": "mk-arcoiris", "n": "Paleta arcoíris", "s": "retro", "t": ["Camp absoluto"]}, {"id": "mk-cromo", "n": "Paleta de cromo y pestañas", "s": "futur", "t": ["Futurista"]}, {"id": "mk-clasico", "n": "Labio rojo clásico", "s": "folk", "t": ["Rojo pasión"]}, {"id": "mk-ahumado", "n": "Ahumado y piercings", "s": "street", "t": ["Cuero y tachuelas"]}]};

// Colección nivel USA
ARMARIO.look.push(...[{"id": "kimono-lila", "n": "Kimono couture lila con lazo obi", "s": "glam", "t": ["Look de gala", "Flores y más flores"]}, {"id": "muneca-menta", "n": "Vestido de muñeca de porcelana menta", "s": "retro", "t": ["Camp absoluto"]}, {"id": "pageant-fucsia", "n": "Gala pageant de pedrería fucsia", "s": "glam", "t": ["Brilla, brilla", "Look de gala"]}, {"id": "malla-oro", "n": "Sirena de malla dorada con hombreras", "s": "glam", "t": ["Brilla, brilla", "Realeza"]}, {"id": "payaso-couture", "n": "Mono de payaso couture", "s": "retro", "t": ["Camp absoluto"]}, {"id": "latex-curvas", "n": "Body de látex rojo escultórico", "s": "street", "t": ["Rojo pasión", "Cuero y tachuelas"]}, {"id": "cisne-plumas", "n": "Vestido de plumas de cisne", "s": "glam", "t": ["Look de gala", "Blanco y negro"]}, {"id": "armadura-negra", "n": "Armadura oscura con pinchos", "s": "street", "t": ["Cuero y tachuelas"]}, {"id": "aros-escultura", "n": "Vestido escultura de aros", "s": "futur", "t": ["Futurista", "Camp absoluto"]}, {"id": "dragon-rojo", "n": "Vestido dragón rojo y oro", "s": "folk", "t": ["Rojo pasión", "Realeza"]}, {"id": "tutu-dulces", "n": "Corsé y tutú de caramelos", "s": "retro", "t": ["Comida basura de lujo", "Camp absoluto"]}, {"id": "mono-diamantes", "n": "Mono de ilusión con cristales", "s": "futur", "t": ["Brilla, brilla", "Galaxia lejana"]}]);
ARMARIO.peluca.push(...[{"id": "pageant-rubia", "n": "Cardado pageant platino", "s": "glam", "t": ["Look de gala", "Realeza"]}, {"id": "recogido-kanzashi", "n": "Recogido rosa con kanzashi", "s": "folk", "t": ["Flores y más flores", "Folclore reinventado"]}, {"id": "tirabuzones-azul", "n": "Tirabuzones de muñeca azul", "s": "retro", "t": ["Camp absoluto"]}, {"id": "coleta-infinita", "n": "Coleta negra infinita", "s": "street", "t": ["Blanco y negro"]}, {"id": "payaso-rizos", "n": "Peluca de payaso", "s": "retro", "t": ["Camp absoluto"]}, {"id": "medusa", "n": "Peluca Medusa de serpientes", "s": "street", "t": ["Animal print", "Camp absoluto"]}, {"id": "cisne", "n": "Tocado de cisne", "s": "glam", "t": ["Blanco y negro", "Look de gala"]}, {"id": "colmena-lila", "n": "Colmena sesentera lila", "s": "retro", "t": ["Años 80"]}, {"id": "corazon-verde", "n": "Peluca corazón verde", "s": "retro", "t": ["Camp absoluto"]}, {"id": "hollywood-cobre", "n": "Ondas de Hollywood cobrizas", "s": "glam", "t": ["Look de gala", "Rojo pasión"]}, {"id": "arcoiris-lisa", "n": "Melena lisa arcoíris", "s": "futur", "t": ["Galaxia lejana"]}, {"id": "pinchos-cromo", "n": "Corona de pinchos cromada", "s": "futur", "t": ["Futurista"]}]);
ARMARIO.acc.push(...[{"id": "corona-pageant", "n": "Corona pageant gigante", "s": "glam", "t": ["Realeza", "Brilla, brilla"]}, {"id": "banda-strass", "n": "Banda de miss de strass", "s": "glam", "t": ["Realeza", "Look de gala"]}, {"id": "lagrimas-cristal", "n": "Pendientes lágrima de cristal", "s": "glam", "t": ["Look de gala", "Brilla, brilla"]}, {"id": "abanico-rosa", "n": "Abanico de encaje rosa", "s": "folk", "t": ["Folclore reinventado", "Flores y más flores"]}, {"id": "kanzashi", "n": "Horquillas kanzashi", "s": "folk", "t": ["Flores y más flores"]}, {"id": "guantes-opera", "n": "Guantes de ópera con cristales", "s": "glam", "t": ["Look de gala", "Blanco y negro"]}, {"id": "nariz-roja", "n": "Nariz de payaso de strass", "s": "retro", "t": ["Camp absoluto", "Rojo pasión"]}, {"id": "protesis", "n": "Prótesis de cara", "s": "retro", "t": ["Camp absoluto"]}, {"id": "arnes-strass", "n": "Arnés de cristales", "s": "street", "t": ["Cuero y tachuelas", "Brilla, brilla"]}, {"id": "choker-corazon", "n": "Choker corazón de strass", "s": "street", "t": ["Cuero y tachuelas"]}, {"id": "tacones-cristal", "n": "Plataformas de cristal", "s": "glam", "t": ["Brilla, brilla"]}, {"id": "bolso-corazon", "n": "Bolso corazón de cristal", "s": "glam", "t": ["Brilla, brilla"]}, {"id": "mk-pageant", "n": "Maquillaje pageant", "s": "glam", "t": ["Look de gala"]}, {"id": "mk-muneca", "n": "Maquillaje de muñeca", "s": "retro", "t": ["Camp absoluto"]}, {"id": "mk-clown", "n": "Pinturas de payaso", "s": "retro", "t": ["Camp absoluto"]}, {"id": "mk-cristales", "n": "Cristales de cara", "s": "glam", "t": ["Brilla, brilla"]}, {"id": "mk-uv", "n": "Delineadores UV neón", "s": "futur", "t": ["Futurista", "Galaxia lejana"]}, {"id": "mk-escenario", "n": "Kit de escenario completo", "s": "street", "t": ["Blanco y negro"]}]);

// Pasarelas temáticas (fotos)
const TEMAS_PASARELA = [{"id": "N01", "n": "Muuuy Fashion", "tag": "Camp", "d": "La moda y el mundo animal. Puede ser un estampado llevado al delirio, una criatura entera o la actitud de una fiera: tú eliges qué animal eres.", "kw": ["vaca", "leopardo", "cebra", "tigre", "jirafa", "serpiente", "guepardo", "dálmata", "animal"], "t": ["Animal print"], "from": ["P02"]}, {"id": "N02", "n": "Lunares a la Luz de las Velas", "tag": "Folclórico", "d": "Lo flamenco cuando cae la noche. Puede ser luto, misterio, procesión o una fiesta a oscuras: la luz de las velas la pones tú.", "kw": ["flamenca", "mantilla", "lunares", "terciopelo", "negr", "encaje", "mantón", "velas", "candelabro", "peineta"], "t": ["Folclore reinventado"], "from": ["P03"]}, {"id": "N03", "n": "Menos es Aburrido", "tag": "Camp", "d": "Más es más. Exceso de volumen, de color, de capas o de actitud: demuestra que lo sencillo no va contigo.", "kw": ["plumas", "flecos", "lazo", "arcoíris", "mil", "pisos", "nube", "torre", "globos", "recargad"], "t": ["Camp absoluto"], "from": ["P04"]}, {"id": "N04", "n": "De las Profundidades", "tag": "Glamour", "d": "Lo que vive bajo el agua. Una sirena, un monstruo abisal, un naufragio o la calma del fondo del mar: tu forma de mojarte.", "kw": ["sirena", "escama", "concha", "perla", "coral", "agua", "abisal", "aleta", "red", "gota", "turquesa"], "t": ["Look de gala"], "from": ["P06"]}, {"id": "N05", "n": "Low Cost, High Drama", "tag": "Edgy", "d": "Hacer mucho con poco. Reciclaje, lo barato que parece caro o la reina que no tiene un duro pero sí todo el drama.", "kw": ["bolsa", "cartón", "periódico", "rota", "lona", "rafia", "basura", "gastad", "burbuja", "rejilla"], "t": ["Cuero y tachuelas"], "from": ["P07"]}, {"id": "N06", "n": "La Boda de tu Prima", "tag": "Camp", "d": "Esa boda a la que todas hemos ido. Madrina, invitada, novia a la fuga o la tía que lía la fiesta: cuenta tu personaje.", "kw": ["madrina", "boda", "invitada", "tarta", "volantes", "velo", "tiara", "ramo", "bolero", "champán", "madre"], "t": ["Camp absoluto"], "from": ["P09"]}, {"id": "N07", "n": "Error 404: Diva no Encontrada", "tag": "Futurista", "d": "La diva del futuro... con fallos. Robots, pantallas, errores de sistema o una inteligencia artificial con peluca: interprétalo como quieras.", "kw": ["led", "cromo", "glitch", "neón", "androide", "circuito", "cyber", "cíborg", "holográfic", "metal", "fibra", "hexágono", "robot", "pixel"], "t": ["Futurista"], "from": ["P10"]}, {"id": "N08", "n": "Copla, Destape y Lentejuela", "tag": "Folclórico", "d": "Homenaje al espectáculo español de siempre. Copla, revista, destape o cine clásico: elige tu estrella y llévala a tu terreno.", "kw": ["copla", "vedette", "destape", "torera", "traje de luces", "capote", "cabaret", "estrella de cine", "satén", "grana", "flecos"], "t": ["Folclore reinventado", "Años 80"], "from": ["P11"]}, {"id": "N09", "n": "Ahora me Ves", "tag": "Glamour", "d": "Juega con lo que se ve y lo que no. Puede ser transparencia, reflejo, misterio, una diva que aparece y desaparece o un glamour que deslumbra: tú decides qué enseñas.", "kw": ["transparen", "espejo", "cristal", "ilusión", "malla", "pvc", "invisible", "gasa", "esquirla", "nude", "jaula"], "t": ["Brilla, brilla"], "from": ["P12"]}, {"id": "N10", "n": "Museo de Cera", "tag": "Futurista", "d": "La reina convertida en obra de arte. Estatua, maniquí, escultura moderna o figura de museo: posa como si fueras eterna.", "kw": ["estatua", "escultura", "mármol", "bronce", "3d", "acrílico", "resina", "esculpid", "placas", "rígid", "origami"], "t": ["Futurista"], "from": ["P13"]}, {"id": "N11", "n": "Pasión en Rojo", "tag": "Glamour", "d": "El rojo como protagonista. Pasión, peligro, fuego, amor o rabia: dinos qué significa el rojo para ti.", "kw": ["rojo", "roja", "grana", "burdeos", "fuego", "rubí", "pétalo", "rosa roja", "sangre"], "t": ["Rojo pasión"], "from": []}, {"id": "N12", "n": "Sangre Azul", "tag": "Glamour", "d": "Realeza a tu manera. Reina de cuento, emperatriz, princesa rebelde o la nobleza venida a menos: todas llevan corona, aunque no se vea.", "kw": ["corona", "armiño", "manto", "real", "tiara", "cetro", "oro", "reina", "princesa", "trono", "brocado"], "t": ["Realeza"], "from": []}, {"id": "N13", "n": "Hambre de Moda", "tag": "Camp", "d": "La moda y la comida. Dulce, salada, comida basura de lujo o un banquete entero: hazte irresistible.", "kw": ["tarta", "palomita", "piruleta", "caramelo", "helado", "hamburguesa", "fresa", "dulce", "algodón de azúcar"], "t": ["Comida basura de lujo"], "from": []}, {"id": "N14", "n": "Neón Ochentero", "tag": "Camp", "d": "Los ochenta según tú. La movida, la tele, el gimnasio, la discoteca o el exceso de laca: rebobina la cinta.", "kw": ["hombreras", "chándal", "disco", "cardado", "aros", "flúor", "riñonera", "ochenter", "tupé", "neón"], "t": ["Años 80"], "from": []}, {"id": "N15", "n": "Rock y Tachuelas", "tag": "Edgy", "d": "La reina más dura de la sala. Rock, punk, gótico, motera o rebelde sin causa: enseña los dientes.", "kw": ["cuero", "látex", "pincho", "tachuela", "punk", "cadena", "charol", "candado", "armadura", "gótic", "cresta"], "t": ["Cuero y tachuelas"], "from": []}, {"id": "N16", "n": "Ajedrez Humano", "tag": "Edgy", "d": "Contrastes extremos. Blanco y negro, bien y mal, luz y sombra o las reglas del tablero: elige tu jugada.", "kw": ["blanco y negro", "op-art", "esmoquin", "bicolor", "ajedrez", "cuadros", "negro"], "t": ["Blanco y negro"], "from": []}, {"id": "N17", "n": "Jardín Prohibido", "tag": "Folclórico", "d": "La naturaleza tiene su lado oscuro. Un jardín, una flor carnívora, un bosque encantado o la primavera con veneno.", "kw": ["flor", "flores", "pétalo", "rosa", "mariposa", "clavel", "jardín", "ramo", "primavera"], "t": ["Flores y más flores"], "from": []}, {"id": "N18", "n": "Polvo de Estrellas", "tag": "Futurista", "d": "Mira hacia arriba. El espacio, las estrellas, una alienígena o una diva que llega de otra galaxia: aterriza como quieras.", "kw": ["galaxia", "espacial", "astronauta", "holográfic", "estrella", "iridiscente", "planeta", "halo", "libélula"], "t": ["Galaxia lejana"], "from": []}, {"id": "N19", "n": "Bola de Discoteca", "tag": "Glamour", "d": "La noche y la fiesta. Brillo, pista de baile, la última en irse a casa o la reina de la discoteca: que no pare la música.", "kw": ["cristal", "lentejuela", "espejo", "purpurina", "strass", "pedrería", "diamante", "brill", "disco"], "t": ["Brilla, brilla"], "from": []}, {"id": "N20", "n": "Lo que Esconde el Abrigo", "tag": "Glamour", "d": "Llegas siendo una cosa y te vas siendo otra. La transformación en mitad de la pasarela es la protagonista: el cambio lo eliges tú.", "kw": ["reveal"], "t": ["Look de gala", "Brilla, brilla"], "from": ["P05"], "rv": true}, {"id": "N21", "n": "Verbena hasta el Amanecer", "tag": "Folclórico", "d": "Fiesta popular hasta que salga el sol. Feria, romería, fallas o la verbena de tu pueblo: lleva la fiesta puesta.", "kw": ["verbena", "flamenca", "lunares", "castañuela", "mantón", "fallera", "peineta", "volantes", "bata de cola", "manola"], "t": ["Verbena de pueblo", "Folclore reinventado"], "from": []}, {"id": "N22", "n": "Alfombra Roja de los Goya", "tag": "Glamour", "d": "La gran noche del cine. Alfombra roja, estrella de Hollywood, nominada que no gana o diva del pasado: es tu momento de gloria.", "kw": ["gala", "sirena", "satén", "perla", "guante", "pageant", "cola", "plumas", "hollywood", "noche"], "t": ["Look de gala"], "from": []}];
ARMARIO.look.push(...[{"id": "t02-c2000", "n": "Mono de látex de vaca con curvas", "s": "retro", "t": [], "th": "P02"}, {"id": "t02-c2001", "n": "Corsé rosa de vaca con falda globo", "s": "retro", "t": [], "th": "P02"}, {"id": "t02-c2002", "n": "Vestido leopardo de caderas XXL", "s": "retro", "t": [], "th": "P02"}, {"id": "t02-c2003", "n": "Body cebra con abrigo de pelo blanco", "s": "retro", "t": [], "th": "P02"}, {"id": "t02-c2004", "n": "Mini de tigre con pecho esculpido", "s": "retro", "t": [], "th": "P02"}, {"id": "t02-c2005", "n": "Vaquera de vaca con flecos y cencerros", "s": "retro", "t": [], "th": "P02"}, {"id": "t02-c2006", "n": "Corsé de serpiente con peplum", "s": "retro", "t": [], "th": "P02"}, {"id": "t02-c2007", "n": "Vestido dálmata de miriñaque", "s": "retro", "t": [], "th": "P02"}, {"id": "t02-c2008", "n": "Body de leopardo fucsia con hombreras", "s": "retro", "t": [], "th": "P02"}, {"id": "t02-c2009", "n": "Columna de jirafa de cuello alto", "s": "retro", "t": [], "th": "P02"}, {"id": "t02-c2010", "n": "Babydoll de vaca con ubres rosas", "s": "retro", "t": [], "th": "P02"}, {"id": "t02-c2011", "n": "Mono de guepardo dorado", "s": "retro", "t": [], "th": "P02"}, {"id": "t02-1a100", "n": "Vaca con cuernos y caderas de ala", "s": "retro", "t": [], "th": "P02"}, {"id": "t02-1a101", "n": "Vaca rosa con lazo gigante", "s": "retro", "t": [], "th": "P02"}, {"id": "t02-1a102", "n": "Leopardo con alas de cristal", "s": "retro", "t": [], "th": "P02"}, {"id": "t02-1a103", "n": "Cebra con tocado de plumas", "s": "retro", "t": [], "th": "P02"}, {"id": "t02-1a104", "n": "Mini de tigre con orejitas", "s": "retro", "t": [], "th": "P02"}, {"id": "t02-1a105", "n": "Vaquera rosa con sombrero de plumas", "s": "retro", "t": [], "th": "P02"}, {"id": "t02-1a106", "n": "Sirena de serpiente esculpida", "s": "retro", "t": [], "th": "P02"}, {"id": "t02-1a107", "n": "Volantes negros de strass", "s": "retro", "t": [], "th": "P02"}, {"id": "t02-1a108", "n": "Body rosa con alas de plumas", "s": "retro", "t": [], "th": "P02"}, {"id": "t02-1a109", "n": "Jirafa de cuerpo entero", "s": "retro", "t": [], "th": "P02"}, {"id": "t02-1a110", "n": "Abrigo de plumas con ubres de cristal", "s": "retro", "t": [], "th": "P02"}, {"id": "t02-1a111", "n": "Guepardo dorado con penacho", "s": "retro", "t": [], "th": "P02"}, {"id": "t03-b9d00", "n": "Flamenca negra con corona de espinas", "s": "folk", "t": [], "th": "P03"}, {"id": "t03-b9d01", "n": "Bola de lunares rojos y negros", "s": "folk", "t": [], "th": "P03"}, {"id": "t03-b9d02", "n": "Flamenca blanca con candelabros", "s": "folk", "t": [], "th": "P03"}, {"id": "t03-b9d03", "n": "Capa morada de calaveras", "s": "folk", "t": [], "th": "P03"}, {"id": "t03-b9d04", "n": "Mantilla de catedral gótica", "s": "folk", "t": [], "th": "P03"}, {"id": "t03-b9d05", "n": "Flamenca roja con cruz de plumas", "s": "folk", "t": [], "th": "P03"}, {"id": "t03-b9d06", "n": "Traje corto de terciopelo negro", "s": "folk", "t": [], "th": "P03"}, {"id": "t03-b9d07", "n": "Plumas blancas con corazones de lunares", "s": "folk", "t": [], "th": "P03"}, {"id": "t03-b9d08", "n": "Mantón negro de flecos infinitos", "s": "folk", "t": [], "th": "P03"}, {"id": "t03-b9d09", "n": "Flamenca verde con lámpara de velas", "s": "folk", "t": [], "th": "P03"}, {"id": "t03-b9d10", "n": "Traje de devoción con medallas", "s": "folk", "t": [], "th": "P03"}, {"id": "t03-b9d11", "n": "Cisne negro de plumas", "s": "folk", "t": [], "th": "P03"}, {"id": "t04-b1000", "n": "Volantes de mil estampados", "s": "retro", "t": [], "th": "P04"}, {"id": "t04-b1001", "n": "Lazo rosa con globos de lentejuela", "s": "retro", "t": [], "th": "P04"}, {"id": "t04-b1002", "n": "Torre de leopardo con plumas", "s": "retro", "t": [], "th": "P04"}, {"id": "t04-b1003", "n": "Abrigo de pelo cebra y fucsia", "s": "retro", "t": [], "th": "P04"}, {"id": "t04-b1004", "n": "Armadura dorada de pinchos", "s": "retro", "t": [], "th": "P04"}, {"id": "t04-b1005", "n": "Vestido de flecos arcoíris", "s": "retro", "t": [], "th": "P04"}, {"id": "t04-b1006", "n": "Origami de satén verde", "s": "retro", "t": [], "th": "P04"}, {"id": "t04-b1007", "n": "Pisos de ajedrez y lunares", "s": "retro", "t": [], "th": "P04"}, {"id": "t04-b1008", "n": "Body fucsia con alas y halo", "s": "retro", "t": [], "th": "P04"}, {"id": "t04-b1009", "n": "Jirafa recargada", "s": "retro", "t": [], "th": "P04"}, {"id": "t04-b1010", "n": "Nube rosa de plumas y luces", "s": "retro", "t": [], "th": "P04"}, {"id": "t04-b1011", "n": "Mono barroco con flecos de pelo", "s": "retro", "t": [], "th": "P04"}, {"id": "t06-33e00", "n": "Sirena turquesa de lentejuela", "s": "glam", "t": [], "th": "P06"}, {"id": "t06-33e01", "n": "Burbuja de PVC con perlas", "s": "glam", "t": [], "th": "P06"}, {"id": "t06-33e02", "n": "Conchas y perlas coral", "s": "glam", "t": [], "th": "P06"}, {"id": "t06-33e03", "n": "Criatura abisal de escamas", "s": "glam", "t": [], "th": "P06"}, {"id": "t06-33e04", "n": "Sirena atrapada en redes", "s": "glam", "t": [], "th": "P06"}, {"id": "t06-33e05", "n": "Vestido de gotas de cristal", "s": "glam", "t": [], "th": "P06"}, {"id": "t06-33e07", "n": "Sirena verde de escamas y gasa", "s": "glam", "t": [], "th": "P06"}, {"id": "t06-33e08", "n": "Body holográfico de aletas", "s": "glam", "t": [], "th": "P06"}, {"id": "t06-33e09", "n": "Escamas azul noche", "s": "glam", "t": [], "th": "P06"}, {"id": "t06-33e10", "n": "Coral naranja de tul", "s": "glam", "t": [], "th": "P06"}, {"id": "t06-33e11", "n": "Capa de escamas plateadas", "s": "glam", "t": [], "th": "P06"}, {"id": "t07-8f700", "n": "Vaquera rota con broche de diamantes", "s": "street", "t": [], "th": "P07"}, {"id": "t07-8f701", "n": "Bolsas de basura con perlas", "s": "street", "t": [], "th": "P07"}, {"id": "t07-8f702", "n": "Sudadera rota con cola de tul", "s": "street", "t": [], "th": "P07"}, {"id": "t07-8f703", "n": "Chándal de broches con estola", "s": "street", "t": [], "th": "P07"}, {"id": "t07-8f704", "n": "Falda de papel de periódico", "s": "street", "t": [], "th": "P07"}, {"id": "t07-8f705", "n": "Cuadros rotos con capa de terciopelo", "s": "street", "t": [], "th": "P07"}, {"id": "t07-8f706", "n": "Vestido de bolsas de rafia", "s": "street", "t": [], "th": "P07"}, {"id": "t07-8f707", "n": "Abrigo de pelo y camiseta rota", "s": "street", "t": [], "th": "P07"}, {"id": "t07-8f708", "n": "Corsé de cartón y plástico de burbujas", "s": "street", "t": [], "th": "P07"}, {"id": "t07-8f709", "n": "Rejilla con collar de perlas", "s": "street", "t": [], "th": "P07"}, {"id": "t07-8f710", "n": "Lona azul con cuerdas", "s": "street", "t": [], "th": "P07"}, {"id": "t07-8f711", "n": "Cazadora gastada y slip de satén", "s": "street", "t": [], "th": "P07"}, {"id": "t09-a1d00", "n": "Madrina turquesa con bolero", "s": "retro", "t": [], "th": "P09"}, {"id": "t09-a1d01", "n": "Traje de madre fucsia", "s": "retro", "t": [], "th": "P09"}, {"id": "t09-a1d02", "n": "Lamé dorado con peineta gigante", "s": "retro", "t": [], "th": "P09"}, {"id": "t09-a1d03", "n": "Villana de telenovela con velo", "s": "retro", "t": [], "th": "P09"}, {"id": "t09-a1d04", "n": "Pistacho con flores en los hombros", "s": "retro", "t": [], "th": "P09"}, {"id": "t09-a1d05", "n": "Encaje rojo con capa", "s": "retro", "t": [], "th": "P09"}, {"id": "t09-a1d06", "n": "Lila de volantes y perlas", "s": "retro", "t": [], "th": "P09"}, {"id": "t09-a1d07", "n": "Traje tarta de bodas", "s": "retro", "t": [], "th": "P09"}, {"id": "t09-a1d08", "n": "Lentejuela plata con plumas", "s": "retro", "t": [], "th": "P09"}, {"id": "t09-a1d09", "n": "Champán de volantes con ramo", "s": "retro", "t": [], "th": "P09"}, {"id": "t09-a1d10", "n": "Capa real azul y oro", "s": "retro", "t": [], "th": "P09"}, {"id": "t09-a1d11", "n": "Invitada de blanco con tiara", "s": "retro", "t": [], "th": "P09"}, {"id": "t10-ab300", "n": "Armadura cromada con LED", "s": "futur", "t": [], "th": "P10"}, {"id": "t10-ab301", "n": "Látex con circuitos verdes", "s": "futur", "t": [], "th": "P10"}, {"id": "t10-ab302", "n": "Vestido glitch pixelado", "s": "futur", "t": [], "th": "P10"}, {"id": "t10-ab303", "n": "Androide blanco", "s": "futur", "t": [], "th": "P10"}, {"id": "t10-ab304", "n": "Holográfico geométrico", "s": "futur", "t": [], "th": "P10"}, {"id": "t10-ab305", "n": "Cables de neón rosa", "s": "futur", "t": [], "th": "P10"}, {"id": "t10-ab306", "n": "Bola de espejos robot", "s": "futur", "t": [], "th": "P10"}, {"id": "t10-ab307", "n": "Gabardina distópica LED", "s": "futur", "t": [], "th": "P10"}, {"id": "t10-ab308", "n": "Látex rojo articulado", "s": "futur", "t": [], "th": "P10"}, {"id": "t10-ab309", "n": "Fibra óptica transparente", "s": "futur", "t": [], "th": "P10"}, {"id": "t10-ab310", "n": "Jaula geométrica de metal", "s": "futur", "t": [], "th": "P10"}, {"id": "t10-ab311", "n": "Hexágonos luminosos", "s": "futur", "t": [], "th": "P10"}, {"id": "t11-c1400", "n": "Copla roja de satén con flecos", "s": "folk", "t": [], "th": "P11"}, {"id": "t11-c1401", "n": "Vedette de plumas doradas", "s": "folk", "t": [], "th": "P11"}, {"id": "t11-c1402", "n": "Terciopelo negro con estola", "s": "folk", "t": [], "th": "P11"}, {"id": "t11-c1403", "n": "Mono de lamé del destape", "s": "folk", "t": [], "th": "P11"}, {"id": "t11-c1404", "n": "Flecos de cristal plata", "s": "folk", "t": [], "th": "P11"}, {"id": "t11-c1405", "n": "Lunares con flor gigante", "s": "folk", "t": [], "th": "P11"}, {"id": "t11-c1406", "n": "Cabaret de tul rosa", "s": "folk", "t": [], "th": "P11"}, {"id": "t11-c1407", "n": "Alas de espejos", "s": "folk", "t": [], "th": "P11"}, {"id": "t11-c1408", "n": "Diva flamenca burdeos", "s": "folk", "t": [], "th": "P11"}, {"id": "t11-c1409", "n": "Estrella de cine en satén", "s": "folk", "t": [], "th": "P11"}, {"id": "t11-c1410", "n": "Torera de oro y grana", "s": "folk", "t": [], "th": "P11"}, {"id": "t11-c1411", "n": "Encaje negro de estrellas", "s": "folk", "t": [], "th": "P11"}, {"id": "t11-8ed00", "n": "Escultura de satén rojo con flecos", "s": "folk", "t": [], "th": "P11"}, {"id": "t11-8ed01", "n": "Terciopelo negro con piel gris", "s": "folk", "t": [], "th": "P11"}, {"id": "t11-8ed05", "n": "Lunares azules con gran lazo", "s": "folk", "t": [], "th": "P11"}, {"id": "t11-8ed06", "n": "Terciopelo burdeos con mantilla", "s": "folk", "t": [], "th": "P11"}, {"id": "t11-8ed08", "n": "Capote de paseo grana y oro", "s": "folk", "t": [], "th": "P11"}, {"id": "t11-8ed10", "n": "Traje de luces grana", "s": "folk", "t": [], "th": "P11"}, {"id": "t12-34d00", "n": "Ilusión nude con cristales", "s": "glam", "t": [], "th": "P12"}, {"id": "t12-34d01", "n": "Espejos rotos", "s": "glam", "t": [], "th": "P12"}, {"id": "t12-34d02", "n": "PVC con cristales flotantes", "s": "glam", "t": [], "th": "P12"}, {"id": "t12-34d03", "n": "Corsé trampantojo", "s": "glam", "t": [], "th": "P12"}, {"id": "t12-34d04", "n": "Espiral óptica negra", "s": "glam", "t": [], "th": "P12"}, {"id": "t12-34d05", "n": "Malla de cadenas plata", "s": "glam", "t": [], "th": "P12"}, {"id": "t12-34d06", "n": "Discos de acrílico", "s": "glam", "t": [], "th": "P12"}, {"id": "t12-34d07", "n": "Mono de esquirlas de espejo", "s": "glam", "t": [], "th": "P12"}, {"id": "t12-34d08", "n": "Encaje invisible con ramas", "s": "glam", "t": [], "th": "P12"}, {"id": "t12-34d09", "n": "Gasa iridiscente", "s": "glam", "t": [], "th": "P12"}, {"id": "t12-34d10", "n": "Op-art en blanco y negro", "s": "glam", "t": [], "th": "P12"}, {"id": "t12-34d11", "n": "Jaula de cristales", "s": "glam", "t": [], "th": "P12"}, {"id": "t13-09d00", "n": "Estatua de mármol", "s": "futur", "t": [], "th": "P13"}, {"id": "t13-09d01", "n": "Encaje dorado impreso en 3D", "s": "futur", "t": [], "th": "P13"}, {"id": "t13-09d02", "n": "Acrílico de pliegues", "s": "futur", "t": [], "th": "P13"}, {"id": "t13-09d03", "n": "Concha de resina negra", "s": "futur", "t": [], "th": "P13"}, {"id": "t13-09d04", "n": "Estatua de bronce", "s": "futur", "t": [], "th": "P13"}, {"id": "t13-09d05", "n": "Ángulos de plástico rojo", "s": "futur", "t": [], "th": "P13"}, {"id": "t13-09d06", "n": "Coral blanco en 3D", "s": "futur", "t": [], "th": "P13"}, {"id": "t13-09d07", "n": "Placas de metal en ola", "s": "futur", "t": [], "th": "P13"}, {"id": "t13-09d08", "n": "Rosa esculpida", "s": "futur", "t": [], "th": "P13"}, {"id": "t13-09d09", "n": "Salpicadura de agua", "s": "futur", "t": [], "th": "P13"}, {"id": "t13-09d10", "n": "Abanico negro y oro", "s": "futur", "t": [], "th": "P13"}, {"id": "t13-09d11", "n": "Jaula con flores secas", "s": "futur", "t": [], "th": "P13"}]);
ARMARIO.peluca.push(...[{"id": "tw-a4900", "n": "Moño de bailarina con corona", "s": "glam", "t": [], "th": ["P01"]}, {"id": "tw-a4901", "n": "Rizos con nubes de tul", "s": "glam", "t": [], "th": ["P01"]}, {"id": "tw-a4902", "n": "Casco de vaca con cuernos", "s": "retro", "t": [], "th": ["P02"]}, {"id": "tw-a4903", "n": "Rizos con lazo de leopardo", "s": "retro", "t": [], "th": ["P02"]}, {"id": "tw-a4904", "n": "Moño flamenco con rosas", "s": "folk", "t": [], "th": ["P03", "P11"]}, {"id": "tw-a4905", "n": "Peluca de velas negras", "s": "folk", "t": [], "th": ["P03"]}, {"id": "tw-a4906", "n": "Recogido barroco de oro y perlas", "s": "glam", "t": [], "th": ["P04"]}, {"id": "tw-a4907", "n": "Tocado de plumas rojas", "s": "glam", "t": [], "th": ["P04", "P11"]}, {"id": "tw-a4908", "n": "Tocado de cristal y cruces", "s": "folk", "t": [], "th": ["P03", "P09"]}, {"id": "tw-a4909", "n": "Cardado con banda de leopardo", "s": "street", "t": [], "th": ["P02", "P07"]}, {"id": "tw-a4910", "n": "Fibra óptica arcoíris", "s": "futur", "t": [], "th": ["P10", "P12"]}, {"id": "tw-a4911", "n": "Moños con miniaturas", "s": "retro", "t": [], "th": ["P04", "P09"]}, {"id": "tw-a5007", "n": "Pouf rosa con jaulas", "s": "retro", "t": [], "th": ["P04", "P09"]}, {"id": "tw-a5008", "n": "Mantilla negra con cruces", "s": "folk", "t": [], "th": ["P03"]}, {"id": "tw-a5009", "n": "Rizos rojos con plumas", "s": "glam", "t": [], "th": ["P04", "P11"]}, {"id": "tw-a5010", "n": "Velo de tul con tiara", "s": "glam", "t": [], "th": ["P01", "P09"]}]);

// Pelucas temáticas 2
ARMARIO.peluca.push(...[{"id": "tw-f3d00", "n": "Recogido de madrina con encaje", "s": "retro", "t": [], "th": ["P09"]}, {"id": "tw-f3d01", "n": "Cardado con sombrerito y perlas", "s": "glam", "t": [], "th": ["P09"]}, {"id": "tw-f3d02", "n": "Casco cromado con LED", "s": "futur", "t": [], "th": ["P10"]}, {"id": "tw-f3d03", "n": "Melena turquesa con hilos de luz", "s": "futur", "t": [], "th": ["P10", "P06"]}, {"id": "tw-f3d04", "n": "Ondas negras con rosas y amapolas", "s": "folk", "t": [], "th": ["P11", "P03"]}, {"id": "tw-f3d05", "n": "Cardado dorado setentero", "s": "glam", "t": [], "th": ["P11"]}, {"id": "tw-f3d06", "n": "Ondas al agua platino con perlas", "s": "glam", "t": [], "th": ["P11", "P12"]}, {"id": "tw-f3d07", "n": "Cabeza de mármol con vetas de oro", "s": "futur", "t": [], "th": ["P13"]}, {"id": "tw-f3d08", "n": "Halo dorado con máscara", "s": "glam", "t": [], "th": ["P13", "P04"]}, {"id": "tw-f3d10", "n": "Trenzas rojas con montera", "s": "folk", "t": [], "th": ["P11"]}, {"id": "tw-f3d11", "n": "Melena lila con tocado de perlas", "s": "glam", "t": [], "th": ["P09", "P12"]}, {"id": "tw-dc700", "n": "Moño cobrizo con tocado", "s": "retro", "t": [], "th": ["P09"]}, {"id": "tw-dc701", "n": "Cardado champán con velo", "s": "glam", "t": [], "th": ["P09"]}, {"id": "tw-dc702", "n": "Casco de cromo", "s": "futur", "t": [], "th": ["P10"]}, {"id": "tw-dc703", "n": "Bob cian luminoso", "s": "futur", "t": [], "th": ["P10"]}, {"id": "tw-dc704", "n": "Ondas negras con clavel", "s": "folk", "t": [], "th": ["P11", "P03"]}, {"id": "tw-dc705", "n": "Melena dorada de los 70", "s": "glam", "t": [], "th": ["P11"]}, {"id": "tw-dc706", "n": "Ondas platino de los 30", "s": "glam", "t": [], "th": ["P11"]}, {"id": "tw-dc707", "n": "Peluca de mármol esculpido", "s": "futur", "t": [], "th": ["P13"]}, {"id": "tw-dc708", "n": "Halo de oro", "s": "glam", "t": [], "th": ["P13"]}, {"id": "tw-dc709", "n": "Bob negro lacado", "s": "futur", "t": [], "th": ["P13", "P10"]}, {"id": "tw-dc710", "n": "Pelirroja con montera", "s": "folk", "t": [], "th": ["P11"]}, {"id": "tw-dc711", "n": "Melena lila con peineta de perlas", "s": "glam", "t": [], "th": ["P09"]}, {"id": "tw-bc300", "n": "Sirena turquesa con conchas", "s": "glam", "t": [], "th": ["P06"]}, {"id": "tw-bc301", "n": "Melena mojada plateada con cristales", "s": "glam", "t": [], "th": ["P06", "P12"]}, {"id": "tw-bc302", "n": "Melena verde con corona de coral", "s": "folk", "t": [], "th": ["P06"]}, {"id": "tw-bc303", "n": "Moño alto con tiara de joyas", "s": "glam", "t": [], "th": ["P07", "P09"]}, {"id": "tw-bc304", "n": "Coleta rubia con coletero brillante", "s": "retro", "t": [], "th": ["P08"]}, {"id": "tw-bc305", "n": "Rubia con gorra de strass", "s": "street", "t": [], "th": ["P08", "P07"]}, {"id": "tw-bc306", "n": "Rosa con pinzas de mariposa", "s": "retro", "t": [], "th": ["P08"]}, {"id": "tw-bc307", "n": "Mechas a lo dos mil", "s": "retro", "t": [], "th": ["P08"]}, {"id": "tw-bc308", "n": "Capucha de pétalos", "s": "glam", "t": [], "th": []}, {"id": "tw-bc309", "n": "Cardado burdeos sesentero", "s": "glam", "t": [], "th": ["P09", "P11"]}, {"id": "tw-bc310", "n": "Bob negro con jaula de cristal", "s": "street", "t": [], "th": ["P12", "P03"]}, {"id": "tw-bc311", "n": "Lazo de periódico con perlas", "s": "street", "t": [], "th": ["P07"]}, {"id": "tw-bc312", "n": "Melena lila de medusa", "s": "futur", "t": [], "th": ["P06"]}, {"id": "tw-bc313", "n": "Rubia con diadema", "s": "retro", "t": [], "th": ["P09", "P08"]}, {"id": "tw-bc314", "n": "Coleta alta con bola de discoteca", "s": "retro", "t": [], "th": ["P08", "P04"]}]);

// Reveals
TEMAS_PASARELA.push({"id": "P05", "n": "Érase una vez… mi reveal", "tag": "Glamour", "d": "Un look que se transforma en la pasarela y cuenta una historia"});
ARMARIO.look.push(...[{"id": "tr-cf40a", "rv": "tr-cf40b", "n": "Gabardina de oficina → Sirena de lentejuela roja", "s": "glam", "t": [], "th": "P05"}, {"id": "tr-cf41a", "rv": "tr-cf41b", "n": "Capa de villana → Heroína de oro y sol", "s": "glam", "t": [], "th": "P05"}, {"id": "tr-cf42a", "rv": "tr-cf42b", "n": "Abrigo capullo → Mariposa monarca", "s": "glam", "t": [], "th": "P05"}, {"id": "tr-cf43a", "rv": "tr-cf43b", "n": "Rebeca de secretaria → Mini fucsia de cristales", "s": "glam", "t": [], "th": "P05"}, {"id": "tr-cf44a", "rv": "tr-cf44b", "n": "Abrigo de pelo blanco → Vestido de flores de primavera", "s": "glam", "t": [], "th": "P05"}, {"id": "tr-cf45a", "rv": "tr-cf45b", "n": "Hábito azul marino → Látex negro con cruz", "s": "glam", "t": [], "th": "P05"}, {"id": "tr-df10a", "rv": "tr-df10b", "n": "Volantes de tormenta → Falda arcoíris", "s": "glam", "t": [], "th": "P05"}, {"id": "tr-df11a", "rv": "tr-df11b", "n": "Caja de regalo → Mono de cristales", "s": "glam", "t": [], "th": "P05"}, {"id": "tr-df12a", "rv": "tr-df12b", "n": "Luto con velo → Novia en blanco y negro", "s": "glam", "t": [], "th": "P05"}, {"id": "tr-df13a", "rv": "tr-df13b", "n": "Uniforme de limpieza → Vedette dorada con plumas", "s": "glam", "t": [], "th": "P05"}, {"id": "tr-df14a", "rv": "tr-df14b", "n": "Terciopelo muy serio → Polisón con shorts dorados", "s": "glam", "t": [], "th": "P05"}, {"id": "tr-df15a", "rv": "tr-df15b", "n": "Chubasquero amarillo → Lluvia de cristales", "s": "glam", "t": [], "th": "P05"}, {"id": "tr-c240a", "rv": "tr-c240b", "n": "Lienzo en blanco → Cuadro pintado a mano", "s": "glam", "t": [], "th": "P05"}, {"id": "tr-c241a", "rv": "tr-c241b", "n": "Oruga acolchada → Libélula iridiscente", "s": "glam", "t": [], "th": "P05"}, {"id": "tr-c242a", "rv": "tr-c242b", "n": "Uniforme de colegio → Corsé punk de cuadros", "s": "glam", "t": [], "th": "P05"}, {"id": "tr-c243a", "rv": "tr-c243b", "n": "Gabardina gris → Terciopelo rojo con capa de cristal", "s": "glam", "t": [], "th": "P05"}, {"id": "tr-c244a", "rv": "tr-c244b", "n": "Vestido de baile rojo → Mini de flecos", "s": "glam", "t": [], "th": "P05"}, {"id": "tr-c245a", "rv": "tr-c245b", "n": "Campesina de cuento → Princesa de estrellas", "s": "glam", "t": [], "th": "P05"}]);

// Estadísticas del armario: [impacto 1-5, movimiento 1-5]
const ARMARIO_STATS = {"mini-cristales":[1,5],"perlas-sirena":[1,4],"sirena-azul":[1,2],"pageant-fucsia":[2,5],"kimono-lila":[2,4],"lentejuela-roja":[2,4],"malla-oro":[3,2],"cisne-plumas":[3,1],"discoball":[3,4],"oro-plumas":[4,2],"petalos":[4,2],"capa-armino":[4,2],"plumas-rojo":[5,1],"manto-real":[5,1],"tutu-dulces":[1,4],"chandal":[1,5],"muneca-menta":[2,1],"hombreras":[2,4],"vedette":[3,2],"piruletas":[3,4],"tarta":[4,3],"palomitas":[4,5],"payaso-couture":[5,2],"esmoquin":[1,5],"charol-pinchos":[1,5],"punk":[2,5],"body-leopardo":[2,5],"armadura-negra":[3,5],"latex-rojo":[3,4],"latex-curvas":[4,5],"leopardo-abrigo":[4,1],"opart":[5,2],"astronauta":[1,3],"mono-diamantes":[1,5],"latex-plata":[2,5],"cromo-halo":[3,5],"acrilico":[3,5],"espacial":[4,4],"aros-escultura":[5,2],"flores":[1,4],"dragon-rojo":[1,3],"manola":[2,2],"bata-cola":[3,2],"fallera":[3,2],"flamenca-fucsia":[4,2],"flamenca-lunares":[5,4],"t02-c2003":[1,5],"t02-c2001":[1,4],"t02-1a109":[1,5],"t02-1a108":[1,3],"t02-1a106":[1,3],"t02-c2006":[2,4],"t02-c2009":[2,5],"t02-1a104":[2,5],"t02-1a110":[2,1],"t02-1a102":[2,3],"t02-c2004":[3,5],"t02-c2008":[3,5],"t02-1a105":[3,2],"t02-c2011":[3,5],"t02-c2005":[3,5],"t02-c2002":[4,3],"t02-1a100":[4,3],"t02-1a111":[4,3],"t02-c2000":[4,5],"t02-c2010":[4,4],"t02-1a101":[5,1],"t02-1a103":[5,2],"t02-1a107":[5,1],"t02-c2007":[5,1],"t03-b9d06":[1,4],"t03-b9d00":[1,1],"t03-b9d05":[1,3],"t03-b9d09":[2,3],"t03-b9d01":[2,1],"t03-b9d08":[3,1],"t03-b9d04":[3,2],"t03-b9d07":[3,1],"t03-b9d11":[4,1],"t03-b9d02":[4,2],"t03-b9d10":[5,1],"t03-b9d03":[5,1],"t04-b1005":[1,5],"t04-b1006":[1,2],"t04-b1011":[1,4],"t04-b1009":[2,5],"t04-b1004":[2,3],"t04-b1008":[3,3],"t04-b1002":[3,2],"t04-b1001":[3,1],"t04-b1010":[4,1],"t04-b1003":[4,1],"t04-b1000":[5,1],"t04-b1007":[5,1],"t06-33e01":[1,3],"t06-33e08":[1,4],"t06-33e02":[1,3],"t06-33e09":[2,3],"t06-33e03":[2,3],"t06-33e00":[3,1],"t06-33e07":[3,2],"t06-33e04":[4,2],"t06-33e10":[4,1],"t06-33e05":[5,1],"t06-33e11":[5,1],"t07-8f708":[1,3],"t07-8f709":[1,5],"t07-8f711":[1,4],"t07-8f703":[2,4],"t07-8f702":[2,2],"t07-8f700":[3,2],"t07-8f704":[3,2],"t07-8f706":[3,3],"t07-8f707":[4,2],"t07-8f701":[4,1],"t07-8f710":[5,2],"t07-8f705":[5,1],"t09-a1d11":[1,2],"t09-a1d08":[1,3],"t09-a1d07":[1,3],"t09-a1d09":[2,2],"t09-a1d06":[2,3],"t09-a1d04":[3,3],"t09-a1d01":[3,4],"t09-a1d05":[3,1],"t09-a1d03":[4,1],"t09-a1d02":[4,2],"t09-a1d10":[5,1],"t09-a1d00":[5,1],"t10-ab303":[1,4],"t10-ab309":[1,2],"t10-ab311":[1,5],"t10-ab304":[2,3],"t10-ab300":[2,3],"t10-ab301":[3,4],"t10-ab307":[3,3],"t10-ab308":[3,4],"t10-ab310":[4,2],"t10-ab302":[4,3],"t10-ab305":[5,3],"t10-ab306":[5,1],"t11-c1404":[1,4],"t11-8ed06":[1,5],"t11-8ed01":[1,3],"t11-c1411":[1,2],"t11-8ed05":[2,3],"t11-c1402":[2,2],"t11-c1403":[2,3],"t11-8ed10":[2,4],"t11-c1410":[3,2],"t11-c1408":[3,2],"t11-c1405":[3,4],"t11-8ed00":[4,3],"t11-8ed08":[4,3],"t11-c1400":[4,2],"t11-c1407":[4,1],"t11-c1409":[5,1],"t11-c1401":[5,1],"t11-c1406":[5,1],"t12-34d08":[1,4],"t12-34d11":[1,5],"t12-34d03":[1,5],"t12-34d06":[2,2],"t12-34d05":[2,3],"t12-34d00":[3,2],"t12-34d04":[3,4],"t12-34d07":[3,4],"t12-34d01":[4,4],"t12-34d09":[4,1],"t12-34d02":[5,1],"t12-34d10":[5,3],"t13-09d00":[1,4],"t13-09d02":[1,4],"t13-09d03":[1,4],"t13-09d06":[2,5],"t13-09d07":[2,5],"t13-09d01":[3,5],"t13-09d08":[3,5],"t13-09d04":[3,4],"t13-09d11":[4,5],"t13-09d05":[4,5],"t13-09d09":[5,4],"t13-09d10":[5,3],"tr-c240a":[3,5],"tr-c245a":[3,5],"tr-cf44a":[3,3],"tr-cf40a":[3,5],"tr-c241a":[3,5],"tr-df15a":[3,3],"tr-c243a":[3,4],"tr-cf45a":[3,4],"tr-df13a":[3,4],"tr-c242a":[3,5],"tr-cf42a":[3,3],"tr-cf43a":[4,4],"tr-df14a":[4,4],"tr-cf41a":[4,2],"tr-df10a":[4,2],"tr-df11a":[5,3],"tr-df12a":[5,1],"tr-c244a":[5,1],"cisne":[1,4],"negra-lisa":[1,5],"maria-antonieta":[1,4],"platino":[2,3],"trenza-real":[2,5],"ondas-castanas":[3,4],"ondas-cobre":[3,3],"rizos-rubios":[4,3],"melena-roja":[4,3],"pageant-rubia":[5,1],"hollywood-cobre":[5,1],"helado":[1,5],"algodon":[1,5],"tupe-rosa":[1,5],"cardado-rubio":[2,4],"cardado-xxl":[2,3],"tirabuzones-azul":[3,2],"colmena-lila":[3,2],"corazon-verde":[3,1],"unicornio":[4,3],"disco-roja":[4,3],"rastas":[5,4],"payaso-rizos":[5,1],"pixie-bicolor":[1,5],"cresta":[1,5],"bob-bicolor":[2,4],"coleta-infinita":[2,2],"verde-neon":[3,5],"coleta-leopardo":[3,5],"mullet-leopardo":[4,4],"afro-leopardo":[4,2],"medusa":[5,2],"recogido-espacial":[1,5],"bob-plata":[1,5],"bob-cromo":[2,4],"pinchos-cromo":[3,3],"trenzas-cyber":[3,4],"arcoiris-lisa":[4,3],"ola-azul":[5,2],"mono-peineta":[1,5],"recogido-kanzashi":[1,3],"corona-flores":[2,5],"monos-lunares":[3,4],"trenzas-flores":[3,5],"peineta-rosas":[4,5],"rizos-claveles":[5,2],"tw-a4900":[1,5],"tw-bc304":[1,5],"tw-dc701":[1,4],"tw-dc706":[1,4],"tw-a4905":[1,5],"tw-dc707":[1,4],"tw-f3d01":[1,4],"tw-a4901":[1,1],"tw-bc303":[1,5],"tw-dc709":[1,3],"tw-bc313":[1,3],"tw-a4902":[2,3],"tw-dc702":[2,4],"tw-a5010":[2,1],"tw-bc314":[2,3],"tw-bc301":[2,4],"tw-f3d06":[2,2],"tw-a4909":[2,2],"tw-dc700":[2,4],"tw-dc708":[2,3],"tw-dc710":[2,2],"tw-f3d02":[2,4],"tw-bc309":[3,2],"tw-bc300":[3,3],"tw-bc305":[3,2],"tw-a4911":[3,3],"tw-a5007":[3,2],"tw-bc312":[3,3],"tw-a4910":[3,2],"tw-f3d07":[3,3],"tw-dc711":[3,2],"tw-a4904":[3,4],"tw-a5008":[3,5],"tw-bc311":[4,2],"tw-bc302":[4,1],"tw-dc703":[4,3],"tw-bc306":[4,1],"tw-f3d05":[4,1],"tw-dc705":[4,1],"tw-dc704":[4,1],"tw-bc310":[4,2],"tw-f3d11":[4,2],"tw-a4906":[4,4],"tw-bc308":[4,1],"tw-bc307":[5,1],"tw-f3d03":[5,1],"tw-f3d08":[5,2],"tw-a4903":[5,2],"tw-f3d10":[5,1],"tw-f3d00":[5,1],"tw-f3d04":[5,1],"tw-a5009":[5,1],"tw-a4907":[5,1],"tw-a4908":[5,1],"tacones-cristal":[1,5],"corona-pageant":[1,5],"mk-contorno":[1,5],"abanico-plumas":[1,3],"bolso-corazon":[1,4],"mk-cristales":[2,3],"boa":[2,5],"corona-fina":[2,1],"corona-cristal":[2,4],"collar-perlas":[3,2],"mk-oro":[3,5],"lagrimas-cristal":[3,4],"mk-dorado":[3,2],"mk-pageant":[3,3],"mk-perlas":[4,1],"banda-strass":[4,3],"guantes-strass":[4,2],"bolso-purpurina":[4,2],"guantes-opera":[5,4],"mk-gemas":[5,2],"bolso-disco":[5,1],"tiara-rubies":[5,1],"mk-flamenco":[1,5],"ramo":[1,5],"abanico-rosa":[1,3],"kanzashi":[2,4],"mk-clasico":[2,2],"mk-rosa":[3,2],"manton-crema":[3,5],"castanuelas":[3,4],"manton-rojo":[4,5],"mantilla":[4,4],"abanico-rojo":[5,1],"abanico-encaje":[5,1],"mk-holo":[1,4],"visera":[1,1],"mk-cromo":[2,2],"gafas-cyber":[2,2],"earcuffs":[3,3],"gafas-led":[3,1],"mk-uv":[4,3],"brazaletes":[4,2],"mk-neon":[5,1],"mk-gotico":[1,4],"gafas-leopardo":[1,4],"choker-corazon":[1,2],"arnes-strass":[2,3],"mk-byn":[2,2],"mk-ahumado":[2,3],"candado":[3,3],"mk-escenario":[3,3],"guantes-encaje":[4,4],"mk-grafico":[4,2],"gargantilla":[4,1],"guantes-leopardo":[5,5],"estola":[5,4],"cetro":[1,5],"bolso-pollo":[1,5],"protesis":[1,4],"mk-cartoon":[2,5],"bolso-burger":[2,5],"nariz-roja":[2,3],"aros":[3,1],"mk-muneca":[3,3],"mk-payaso":[4,4],"mk-clown":[4,3],"mk-arcoiris":[4,2],"aros-oro":[5,1],"rinonera":[5,1]};

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
        { txt: "¿Sosa yo? Prepárate.", persona: "drama", bonus: 150, reply: ["r1", "¡Uy, que despierta!"] },
      ] },
      { lines: [["r1", "Te he visto ensayar a las tantas. ¿No descansas nunca?"]], choices: [
        { txt: "Descansaré con la corona puesta.", persona: "focus", adv: 2, reply: ["r1", "Qué miedo me das."] },
        { txt: "¿Ensayamos juntas?", persona: "kind", rel: { r1: 1 }, reply: ["r1", "¡Venga! Me vendría genial."] },
      ] },
    ],
  },
};

const NEMESIS = {
  nace: {
    choque: [
      ["r1", "(Confesionario) Lo de {yo} ya no es una pelea de un día. Es personal."],
      ["r1", "(Confesionario) Ha venido a por mí. Pues que sepa que yo también voy a por ella."],
    ],
    historia: [
      ["r1", "(Confesionario) Cuando he visto entrar a {yo} se me ha revuelto todo. Lo nuestro viene de lejos."],
      ["r1", "(Confesionario) Tenemos cuentas pendientes de otra temporada. Esta vez no se me escapa."],
    ],
    traicion: [
      ["r1", "(Confesionario) Sí, le he roto el pacto a {yo}. Y ahora va a por mí. Que venga."],
    ],
    competencia: [
      ["r1", "(Confesionario) {yo} y yo siempre acabamos peleando por lo mismo. Solo puede quedar una."],
      ["r1", "(Confesionario) Cada semana mirándonos de reojo. Me pone de los nervios y me motiva a la vez."],
    ],
  },
  pullas: {
    bottoms: [
      [["r1", "¿Otra vez preparando la maleta, {yo}? Ya debes tenerla hecha."]],
      [["r1", "Yo que tú me aprendía bien las canciones de lip sync. Por si acaso."]],
    ],
    wins: [
      [["r1", "Disfruta tus victorias, {yo}. Las caídas desde arriba duelen más."]],
      [["r1", "Muy bien lo de ganar, cariño. Pero aquí la corona no se gana en una semana."]],
    ],
    mean: [
      [["r1", "Tú y yo somos iguales, {yo}. Por eso no nos soportamos."]],
      [["r1", "Vas de dura por el taller, pero conmigo no cuela."]],
    ],
    kind: [
      [["r1", "Tanto abrazo a todas... ¿eso también es estrategia, {yo}?"]],
      [["r1", "La santa del taller. Ya veremos cuánto te dura la aureola."]],
    ],
    drama: [
      [["r1", "Hoy no has montado ningún numerito, {yo}. ¿Estás enferma?"]],
      [["r1", "Más drama que talento. Te lo digo con cariño. Poco."]],
    ],
    focus: [
      [["r1", "Tanto ensayar y luego en la pasarela, nada. Qué pena me das."]],
      [["r1", "Muy concentrada tú, ¿eh? A ver si te concentras en no irte a casa."]],
    ],
    generic: [
      [["r1", "Buenos días, {yo}. Bueno, buenos para mí."]],
      [["r1", "Esta semana voy a por ti. Te aviso para que no digas."]],
      [["r1", "¿Ese es tu look de hoy? Valiente. Muy valiente."]],
    ],
  },
  untucked: {
    gloat: [["r1", "Vaya, vaya... Mira quién está en el bottom. Y yo aquí, tan tranquila."]],
    envidia: [["r1", "Enhorabuena por la victoria. Que te dure."], ["me", "Gracias... supongo."]],
    tension: [["r1", "Ni me mires, {yo}. Hoy no estoy para ti."]],
    // Antes del veredicto: nadie sabe nada, solo se imaginan cosas por las críticas
    gloatPre: [["r1", "Con esas críticas, yo de ti iría repasando canciones. Por si acaso."], ["me", "Las críticas no son el veredicto. Tranquila."]],
    envidiaPre: [["r1", "Muy contenta te veo con lo que te han dicho. No cantes victoria, que aún no han decidido nada."], ["me", "No canto nada. Espero, como todas."]],
  },
  lipsync: [
    ["host", "Esto es lo que todas estaban esperando: {yo} contra {r1}. Némesis contra némesis."],
    ["r1", "Por fin. Sin jurado de por medio. Solo tú y yo."],
  ],
  adios: [["r1", "Esto no se acaba aquí, {yo}. Nos veremos en el reencuentro."]],
  reencuentro: [
    ["host", "Y ahora... lo que todo el mundo quiere ver. {yo} y {r1}, al centro."],
    ["r1", "Lo voy a decir delante de todas: tú me hiciste la temporada imposible."],
  ],
  reencuentroChoices: [
    { txt: "Y tú a mí. Pero gracias: me hiciste mejor.", rel: { r1: 2 }, persona: "kind", reply: ["r1", "...Vale. Eso no me lo esperaba. Gracias."] },
    { txt: "No me arrepiento de nada.", persona: "mean", bonus: 300, reply: ["r1", "Ni yo. Y el público lo sabe."] },
  ],
  tregua: [["r1", "¿Sabes qué? Estoy cansada de pelear contigo. ¿Tregua?"], ["me", "Tregua."]],
};

// ------------------------------ Sistema Némesis (memoria entre temporadas) ------------------------------
const RASGOS = {
  fort: {
    lipsync: { n: "Bestia del lip sync", icon: "🔥", d: "Muy peligrosa en un lip sync" },
    comedia: { n: "Lengua afilada", icon: "🎤", d: "Brilla en Snatch, Roast e impro" },
    baile: { n: "Pies de fuego", icon: "💃", d: "Brilla en rusicales y coreografías" },
    costura: { n: "Manos de oro", icon: "🧵", d: "Brilla en costura, Ball y makeover" },
    pasarela: { n: "Imparable en pasarela", icon: "👠", d: "Siempre puntúa alto en la pasarela" },
  },
  deb: {
    pComedia: { n: "Pánico a la comedia", icon: "😰", d: "Se hunde en Snatch, Roast e impro", cat: "comedia" },
    pBaile: { n: "Dos pies izquierdos", icon: "🦶", d: "Se hunde en rusicales y coreografías", cat: "baile" },
    pCostura: { n: "No sabe enhebrar", icon: "🪡", d: "Se hunde en costura, Ball y makeover", cat: "costura" },
    lsFlojo: { n: "Lip sync flojo", icon: "🫥", d: "En un lip sync se le puede ganar", cat: "lipsync" },
    provocable: { n: "Se viene abajo si la provocas", icon: "💥", d: "Si la pinchas, se desconcentra muchísimo" },
  },
  car: {
    rencorosa: { n: "Rencorosa", icon: "🧊", d: "No olvida nada: los golpes le duelen el doble" },
    ambiciosa: { n: "Ambiciosa", icon: "📈", d: "Cada victoria la hace crecer más" },
    leal: { n: "Leal", icon: "🤞", d: "Si pacta contigo, jamás te traiciona" },
    traicionera: { n: "Traicionera", icon: "🐍", d: "Puede romper un pacto en el peor momento" },
    orgullosa: { n: "Orgullosa", icon: "👑", d: "Le cuesta muchísimo hacer las paces" },
  },
};
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

// Untucked antes del veredicto: aún no se sabe quién gana ni quién va al bottom
HISTORIA.untucked.ganadoraPre = [
  [["me", "{r1}, qué críticas te han hecho. Te veo arriba."], ["r1", "No me lo digas, que me gafas. Hasta que no lo diga Supremme, nada."]],
  [["me", "Al jurado le ha encantado lo tuyo, {r1}."], ["r1", "Eso parecía... pero aquí nunca se sabe."]],
  [["me", "¿Cómo lo llevas? Las críticas han sido muy buenas."], ["r1", "Nerviosa igual. A veces te ponen por las nubes y luego ni ganas."]],
];
HISTORIA.untucked.bottomPre = [
  [["me", "{r1}, ¿cómo estás? Las críticas han sido duras."], ["r1", "Fatal. Me veo cantando esta noche."], ["me", "Aún no han decidido nada. Respira."]],
  [["me", "No te comas la cabeza, {r1}. A otras también les han dado caña."], ["r1", "Ya, pero a mí más. Ojalá me equivoque."]],
  [["me", "{r1}, ¿quieres un poco de agua?"], ["r1", "Quiero que acabe esta espera. Gracias, de verdad."]],
];
HISTORIA.untucked.charlaPre = [
  [["me", "¿Cómo lo ves, {r1}?"], ["r1", "Yo ya no sé ni qué pensar. Hasta que no hable Supremme, nada."]],
  [["me", "Qué tensión, {r1}."], ["r1", "Ni que lo digas. Yo ya solo quiero saber quién canta esta noche."]],
];

// ---- Ampliación: tacones y looks drag (cuadrículas de Gemini)
ARMARIO.zapatos = [{"id": "zp-stiletto-rojo", "n": "Stilettos de charol rojo", "s": "glam", "t": ["Rojo pasión", "Look de gala"]}, {"id": "zp-plataforma-negra", "n": "Plataformas de charol negro", "s": "street", "t": ["Cuero y tachuelas", "Blanco y negro"]}, {"id": "zp-botas-fucsia", "n": "Botas mosqueteras de vinilo fucsia", "s": "retro", "t": ["Años 80", "Camp absoluto"]}, {"id": "zp-cristal", "n": "Sandalias transparentes de cristales", "s": "glam", "t": ["Brilla, brilla"]}, {"id": "zp-mules-plumas", "n": "Mules de satén con plumas rosas", "s": "glam", "t": ["Look de gala", "Camp absoluto"]}, {"id": "zp-flamenca", "n": "Zapatos de flamenca de lunares", "s": "folk", "t": ["Folclore reinventado", "Verbena de pueblo"]}, {"id": "zp-cyber", "n": "Botines de cromo con luz LED", "s": "futur", "t": ["Futurista", "Galaxia lejana"]}, {"id": "zp-leopardo", "n": "Salones de leopardo con tacón dorado", "s": "street", "t": ["Animal print"]}, {"id": "zp-vaca", "n": "Botines vaqueros de piel de vaca con flecos", "s": "retro", "t": ["Animal print", "Verbena de pueblo"]}, {"id": "zp-goya", "n": "Sandalias de tiras doradas con pedrería", "s": "glam", "t": ["Look de gala", "Brilla, brilla"]}, {"id": "zp-gogo", "n": "Botas gogó blancas de charol", "s": "retro", "t": ["Años 80", "Blanco y negro"]}, {"id": "zp-punk", "n": "Botas punk de plataforma con tachuelas", "s": "street", "t": ["Cuero y tachuelas"]}, {"id": "zp-stiletto-lentejuela", "n": "Stilettos de lentejuela roja con suela de luz", "s": "glam", "t": ["Rojo pasión", "Brilla, brilla"]}, {"id": "zp-plataforma-led", "n": "Plataformas de pedrería negra con suela de luz", "s": "street", "t": ["Cuero y tachuelas", "Brilla, brilla"]}, {"id": "zp-botas-holo", "n": "Botas mosqueteras holográficas fucsia", "s": "futur", "t": ["Galaxia lejana", "Camp absoluto"]}, {"id": "zp-sandalia-joyas", "n": "Sandalias de cristal con joyas tornasoladas", "s": "glam", "t": ["Brilla, brilla", "Look de gala"]}, {"id": "zp-mules-pluma-rosa", "n": "Mules de plumas de marabú tornasoladas", "s": "glam", "t": ["Camp absoluto", "Look de gala"]}, {"id": "zp-lunares-lazo", "n": "Merceditas de lunares con lazo de oro", "s": "folk", "t": ["Verbena de pueblo", "Folclore reinventado"]}, {"id": "zp-cyber-espiral", "n": "Botines de cromo con tacón espiral de neón", "s": "futur", "t": ["Futurista", "Galaxia lejana"]}, {"id": "zp-leopardo-pantera", "n": "Salones de leopardo con pantera de oro", "s": "street", "t": ["Animal print", "Realeza"]}, {"id": "zp-vaca-plata", "n": "Botines de vaca con flecos plateados", "s": "retro", "t": ["Animal print", "Verbena de pueblo"]}, {"id": "zp-cadenas-rojas", "n": "Sandalias rojas de cadenas de oro y cristales", "s": "glam", "t": ["Rojo pasión", "Brilla, brilla"]}, {"id": "zp-gogo-led", "n": "Botas gogó blancas con tacón de cristal y luz", "s": "futur", "t": ["Años 80", "Futurista"]}, {"id": "zp-punk-pinchos", "n": "Botas punk de pinchos con cordones rojos", "s": "street", "t": ["Cuero y tachuelas", "Rojo pasión"]}, {"id": "zp-columna", "n": "Salones blancos con tacón de columna de mármol", "s": "futur", "t": ["Blanco y negro", "Realeza"]}, {"id": "zp-concha", "n": "Sandalias de perlas con tacón de concha", "s": "glam", "t": ["Look de gala"]}, {"id": "zp-piruleta", "n": "Plataformas de piruleta con tacón de bastón de caramelo", "s": "retro", "t": ["Comida basura de lujo", "Camp absoluto"]}, {"id": "zp-ochenta", "n": "Salones flúor con lazo gigante", "s": "retro", "t": ["Años 80", "Camp absoluto"]}, {"id": "zp-novia", "n": "Zapatos de novia de satén con perlas", "s": "glam", "t": ["Look de gala", "Blanco y negro"]}, {"id": "zp-brocado", "n": "Zapatos de brocado dorado con joya roja", "s": "glam", "t": ["Realeza", "Folclore reinventado"]}, {"id": "zp-arcoiris", "n": "Plataformas arcoíris de purpurina con confeti", "s": "retro", "t": ["Camp absoluto", "Brilla, brilla"]}, {"id": "zp-mosquetera", "n": "Mosqueteras de terciopelo rojo con lazos", "s": "glam", "t": ["Rojo pasión", "Realeza"]}, {"id": "zp-pinchos", "n": "Plataformas de charol con pinchos", "s": "street", "t": ["Cuero y tachuelas"]}, {"id": "zp-discoball", "n": "Sandalias de bola de discoteca con plumas", "s": "glam", "t": ["Brilla, brilla", "Años 80"]}, {"id": "zp-calavera", "n": "Plataformas de llamas con tacón de calavera", "s": "street", "t": ["Cuero y tachuelas", "Rojo pasión"]}, {"id": "zp-dragon", "n": "Salones de escamas con tacón de garra de dragón", "s": "folk", "t": ["Realeza", "Rojo pasión"]}, {"id": "zp-peces", "n": "Botines de pelo rosa con plataforma de agua y peces", "s": "retro", "t": ["Camp absoluto"]}, {"id": "zp-pintalabios", "n": "Salones con tacón de pintalabios rojo", "s": "retro", "t": ["Rojo pasión", "Camp absoluto"]}, {"id": "zp-alas", "n": "Sandalias con alas de ángel de plumas", "s": "glam", "t": ["Look de gala", "Realeza"]}, {"id": "zp-leopardo-neon", "n": "Plataformas de leopardo neón con tachuelas", "s": "street", "t": ["Animal print", "Cuero y tachuelas"]}, {"id": "zp-latex-oro", "n": "Botas de látex dorado con tacón de cristal", "s": "futur", "t": ["Brilla, brilla", "Futurista"]}, {"id": "zp-espiral-oro", "n": "Sandalias de espiral dorada con diamante", "s": "glam", "t": ["Realeza", "Brilla, brilla"]}, {"id": "zp-flamenca-volantes", "n": "Plataformas de volantes de lunares con tacón de abanico", "s": "folk", "t": ["Folclore reinventado", "Verbena de pueblo"]}, {"id": "zp-espacial", "n": "Botas espaciales de cromo con plataforma de LED", "s": "futur", "t": ["Galaxia lejana", "Futurista"]}, {"id": "zp-rosas", "n": "Salones forrados de rosas rojas con espinas de cristal", "s": "folk", "t": ["Flores y más flores", "Rojo pasión"]}, {"id": "zp-tarta", "n": "Plataformas de tarta de fresa con tacón de cucurucho", "s": "retro", "t": ["Comida basura de lujo", "Camp absoluto"]}, {"id": "zp-vaquera", "n": "Botas de vaquera blancas con flecos de cristal", "s": "retro", "t": ["Verbena de pueblo", "Brilla, brilla"]}, {"id": "zp-pierna", "n": "Salones de cristal con tacón de pierna dorada", "s": "futur", "t": ["Camp absoluto", "Brilla, brilla"]}, {"id": "zp-corona", "n": "Salones de terciopelo morado con corona y cetro", "s": "glam", "t": ["Realeza"]}, {"id": "zp-pavo-real", "n": "Botines de plumas de pavo real", "s": "glam", "t": ["Look de gala", "Flores y más flores"]}];
ARMARIO.look.push(...[{"id": "ld-tul-fucsia", "n": "Corsé fucsia con nube de tul en capas", "s": "glam", "t": ["Camp absoluto", "Look de gala"]}, {"id": "ld-sirena-plumas", "n": "Sirena de lentejuela negra con cola de plumas", "s": "glam", "t": ["Look de gala", "Blanco y negro"]}, {"id": "ld-latex-petalos", "n": "Mini de látex rojo con hombreras de pétalo", "s": "street", "t": ["Rojo pasión", "Cuero y tachuelas"]}, {"id": "ld-cuello-plumas", "n": "Columna de cristales plateados con cuello de plumas", "s": "glam", "t": ["Brilla, brilla", "Look de gala"]}, {"id": "ld-terciopelo-verde", "n": "Traje de terciopelo esmeralda con hombros arquitectónicos", "s": "street", "t": ["Realeza"]}, {"id": "ld-tafetan-turquesa", "n": "Gala de tafetán turquesa con mangas abullonadas y lazo", "s": "retro", "t": ["Look de gala", "Años 80"]}, {"id": "ld-pavo-real", "n": "Body de pedrería dorada con capa de plumas de pavo real", "s": "glam", "t": ["Brilla, brilla", "Flores y más flores"]}, {"id": "ld-peplum-morado", "n": "Cóctel de charol morado con peplum", "s": "street", "t": ["Años 80", "Cuero y tachuelas"]}, {"id": "ld-corazon-negro", "n": "Noche de terciopelo negro con cola de satén rojo", "s": "glam", "t": ["Rojo pasión", "Look de gala"]}, {"id": "ld-malla-mirinaque", "n": "Mono de malla de cristales con miriñaque transparente", "s": "futur", "t": ["Brilla, brilla", "Futurista"]}, {"id": "ld-drapeado-champan", "n": "Drapeado de satén champán con flor gigante", "s": "glam", "t": ["Look de gala", "Flores y más flores"]}, {"id": "ld-globo-rosa", "n": "Corsé de encaje rosa con falda globo y lazos", "s": "retro", "t": ["Camp absoluto"]}, {"id": "ld-flamenca-alta", "n": "Flamenca de alta costura de satén rojo con mantón", "s": "folk", "t": ["Folclore reinventado", "Rojo pasión"]}, {"id": "ld-cuero-tul", "n": "Corsé de cuero con pinchos y tutú negro", "s": "street", "t": ["Cuero y tachuelas", "Blanco y negro"]}, {"id": "ld-sirena-holo", "n": "Sirena de escamas holográficas con aletas", "s": "futur", "t": ["Galaxia lejana", "Brilla, brilla"]}, {"id": "ld-baile-lazos", "n": "Baile de raso rosa con miriñaque y lazos de diamantes", "s": "retro", "t": ["Camp absoluto", "Realeza"]}, {"id": "ld-leopardo-abrigo", "n": "Abrigo de leopardo de pelo con cuello gigante", "s": "street", "t": ["Animal print"]}, {"id": "ld-origami", "n": "Vestido escultura de origami de satén blanco", "s": "futur", "t": ["Blanco y negro", "Futurista"]}, {"id": "ld-sol-dorado", "n": "Lentejuela dorada con hombreras de sol y flecos", "s": "glam", "t": ["Brilla, brilla", "Años 80"]}, {"id": "ld-cascada-burdeos", "n": "Corsé burdeos con cascada de volantes y cola", "s": "glam", "t": ["Rojo pasión", "Look de gala"]}, {"id": "ld-vinilo-azul", "n": "Vinilo azul eléctrico con caderas esculpidas", "s": "futur", "t": ["Futurista", "Años 80"]}, {"id": "ld-plumas-fuego", "n": "Plumas negras y rojas de reloj de arena", "s": "glam", "t": ["Rojo pasión", "Blanco y negro"]}, {"id": "ld-perlas-pvc", "n": "Cristales rosas con capa de PVC y perlas", "s": "glam", "t": ["Brilla, brilla", "Look de gala"]}, {"id": "ld-brocado-verde", "n": "Sirena de brocado verde y oro con mangas de murciélago", "s": "folk", "t": ["Realeza", "Folclore reinventado"]}, {"id": "lk-donut", "n": "Vestido rosquilla glaseada rosa", "s": "retro", "t": ["Comida basura de lujo", "Camp absoluto"]}, {"id": "lk-champan", "n": "Sirena dorada de copa de champán con burbujas", "s": "glam", "t": ["Brilla, brilla", "Look de gala"]}, {"id": "lk-sushi", "n": "Sirena de sushi con escamas de salmón", "s": "retro", "t": ["Comida basura de lujo"]}, {"id": "lk-cassette", "n": "Vestido de cintas de casete y bolsas recicladas", "s": "street", "t": ["Años 80", "Cuero y tachuelas"]}, {"id": "ld-pierrot", "n": "Pierrot de gorguera blanca y pantalón negro", "s": "street", "t": ["Blanco y negro", "Camp absoluto"]}, {"id": "ld-plumas-azules", "n": "Diosa de hielo con alas de plumas azules", "s": "glam", "t": ["Realeza", "Galaxia lejana"]}, {"id": "ld-gola-negra", "n": "Columna negra de volantes con gola blanca", "s": "folk", "t": ["Blanco y negro", "Folclore reinventado"]}, {"id": "ld-lima", "n": "Mini verde lima de lentejuela con peluca a juego", "s": "retro", "t": ["Camp absoluto", "Años 80"]}, {"id": "ld-globo-negro", "n": "Chaqueta globo de cuero acolchado negro", "s": "street", "t": ["Cuero y tachuelas", "Blanco y negro"]}, {"id": "ld-nube-azul", "n": "Muñeca de nube de tul azul celeste", "s": "retro", "t": ["Camp absoluto"]}, {"id": "ld-volantes-verdes", "n": "Volantes verdes de tul con máscara de hoja", "s": "folk", "t": ["Flores y más flores"]}, {"id": "ld-tul-rosa", "n": "Cascada de tul rosa con tocado de plumas", "s": "glam", "t": ["Look de gala", "Camp absoluto"]}, {"id": "ld-tulipan-fucsia", "n": "Vestido tulipán fucsia con escote de tul", "s": "glam", "t": ["Flores y más flores", "Rojo pasión"]}]);
ARMARIO.peluca.push(...[{"id": "pl-cupcake", "n": "Peluca cupcake con nata y cereza", "s": "retro", "t": ["Comida basura de lujo", "Camp absoluto"]}, {"id": "pl-cresta-roja", "n": "Cresta punk roja de pinchos", "s": "street", "t": ["Cuero y tachuelas", "Rojo pasión"]}, {"id": "pl-rulos", "n": "Peluca de trapos de cocina y rulos", "s": "retro", "t": ["Camp absoluto", "Verbena de pueblo"]}]);
ARMARIO.acc.push(...[{"id": "ac-bolso-croissant", "n": "Bolso joya de cruasán dorado", "s": "retro", "t": ["Comida basura de lujo", "Brilla, brilla"]}, {"id": "ac-tocado-azul", "n": "Tocado de cuentas azules con flecos", "s": "folk", "t": ["Realeza", "Galaxia lejana"]}]);
Object.assign(ARMARIO_STATS, {"zp-stiletto-rojo": [1, 4], "zp-plataforma-negra": [2, 3], "zp-botas-fucsia": [2, 4], "zp-cristal": [1, 4], "zp-mules-plumas": [1, 4], "zp-flamenca": [1, 5], "zp-cyber": [2, 4], "zp-leopardo": [1, 4], "zp-vaca": [2, 5], "zp-goya": [1, 4], "zp-gogo": [1, 5], "zp-punk": [2, 4], "zp-stiletto-lentejuela": [3, 3], "zp-plataforma-led": [3, 3], "zp-botas-holo": [3, 3], "zp-sandalia-joyas": [3, 3], "zp-mules-pluma-rosa": [3, 3], "zp-lunares-lazo": [3, 4], "zp-cyber-espiral": [4, 2], "zp-leopardo-pantera": [3, 3], "zp-vaca-plata": [3, 4], "zp-cadenas-rojas": [3, 3], "zp-gogo-led": [3, 4], "zp-punk-pinchos": [3, 3], "zp-columna": [3, 3], "zp-concha": [3, 3], "zp-piruleta": [4, 2], "zp-ochenta": [2, 4], "zp-novia": [2, 4], "zp-brocado": [3, 3], "zp-arcoiris": [5, 1], "zp-mosquetera": [4, 3], "zp-pinchos": [4, 2], "zp-discoball": [5, 1], "zp-calavera": [5, 1], "zp-dragon": [5, 2], "zp-peces": [5, 1], "zp-pintalabios": [4, 3], "zp-alas": [4, 2], "zp-leopardo-neon": [4, 2], "zp-latex-oro": [4, 3], "zp-espiral-oro": [5, 2], "zp-flamenca-volantes": [5, 1], "zp-espacial": [5, 2], "zp-rosas": [5, 2], "zp-tarta": [5, 1], "zp-vaquera": [4, 3], "zp-pierna": [5, 2], "zp-corona": [5, 2], "zp-pavo-real": [5, 2], "ld-tul-fucsia": [5, 2], "ld-sirena-plumas": [5, 2], "ld-latex-petalos": [4, 4], "ld-cuello-plumas": [4, 2], "ld-terciopelo-verde": [3, 4], "ld-tafetan-turquesa": [4, 2], "ld-pavo-real": [5, 2], "ld-peplum-morado": [3, 4], "ld-corazon-negro": [4, 2], "ld-malla-mirinaque": [4, 3], "ld-drapeado-champan": [3, 3], "ld-globo-rosa": [3, 4], "ld-flamenca-alta": [5, 2], "ld-cuero-tul": [3, 5], "ld-sirena-holo": [4, 2], "ld-baile-lazos": [5, 1], "ld-leopardo-abrigo": [4, 3], "ld-origami": [4, 3], "ld-sol-dorado": [5, 3], "ld-cascada-burdeos": [5, 2], "ld-vinilo-azul": [4, 4], "ld-plumas-fuego": [5, 2], "ld-perlas-pvc": [4, 3], "ld-brocado-verde": [4, 2], "lk-donut": [5, 2], "lk-champan": [4, 2], "lk-sushi": [4, 3], "lk-cassette": [4, 3], "ld-pierrot": [4, 4], "ld-plumas-azules": [5, 2], "ld-gola-negra": [3, 3], "ld-lima": [3, 4], "ld-globo-negro": [4, 3], "ld-nube-azul": [4, 3], "ld-volantes-verdes": [5, 2], "ld-tul-rosa": [4, 3], "ld-tulipan-fucsia": [3, 4], "pl-cupcake": [5, 2], "pl-cresta-roja": [4, 3], "pl-rulos": [4, 3], "ac-bolso-croissant": [4, 4], "ac-tocado-azul": [4, 3]});
