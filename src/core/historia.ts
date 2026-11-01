// Textos del modo historia: temporadas (dinámica, lema, presentación), taller, críticas, untucked y lip syncs.
// Los comparten el modo historia y el motor nuevo.

export const TEMPORADAS_HISTORIA: Record<string, { twist?: string; lema: string; intro: [string, string][] }> = {
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
      ["host", "Esta temporada hay SEGUNDA OPORTUNIDRAG. No os digo cuándo: solo que alguna que se vaya... puede volver."],
      ["judge", "Así que ni las que se van pueden relajarse... ni las que se quedan."],
    ],
  },
  es4: {
    twist: "suerte",
    lema: "La reina de la suerte",
    intro: [
      ["host", "¡Bienvenidas a la cuarta temporada! Hoy empezamos con un regalo... o no."],
      ["host", "Cada una va a elegir una cajita. En una de ellas está LA REINA DE LA SUERTE."],
      ["host", "Quien la tenga podrá sacarla cuando quiera para salvarse, o salvar a una compañera, del lip sync."],
    ],
  },

  es5: {
    twist: "corazon",
    lema: "La temporada de los corazones",
    intro: [
      ["host", "Bienvenidas a la temporada de los corazones."],
      ["host", "Cada reina que se vaya dejará MEDIO CORAZÓN a una compañera antes de salir del taller."],
      ["host", "Con un corazón entero podréis libraros del bottom. Así que cuidad a las que se van... porque deciden a quién ayudar."],
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

export const HISTORIA: Record<string, any> = {
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
      lines: [["r1", "¡{r2}, me has quitado el espejo otra vez!"], ["r2", "Estaba libre. Haber madrugado."], ["r1", "{yo}, dile algo, que tú lo has visto."]],
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
// Charla entre reinas al empezar el día (antes de que suene la sirena)
HISTORIA.tallerCharla = [
  [["r1", "Buenos días, reinas. ¿Alguien ha dormido algo?"], ["r2", "Yo tres horas. Y se nota en las ojeras."]],
  [["r2", "¿Qué creéis que nos toca hoy?"], ["r1", "Con nuestra suerte, algo de bailar a las nueve de la mañana."], ["r3", "Calla, calla, que lo atraes."]],
  [["r1", "{yo}, ¿me prestas un pañuelo? Me he dejado el mío en el hotel."], ["r2", "Empezamos el día pidiendo, qué bonito."]],
  [["r3", "Hoy vengo con la energía a tope. Que nadie me la baje."], ["r1", "Eso dijiste la semana pasada."]],
  [["r2", "¿Habéis visto la cara de {r1}? Viene a por todas."], ["r1", "Siempre, cariño. Siempre."]],
  [["r1", "Yo hoy no hablo hasta tomarme el café."], ["r3", "Pues llevas cinco minutos hablando."]],
  [["r2", "Os juro que anoche soñé con la pasarela."], ["r1", "¿Y ganabas?"], ["r2", "No me acuerdo. Me desperté antes del veredicto."]],
  [["r3", "Silencio, que me estoy concentrando."], ["r1", "¿En qué, si no sabemos ni qué toca?"]],
];
HISTORIA.tallerTrasExpulsion.push(
  [["r1", "Todavía tengo los ojos hinchados por lo de {fuera}."], ["r2", "Pues ponte hielo, que hoy hay que brillar."]],
  [["r2", "¿Soy la única que se ha quedado con la purpurina de {fuera} en la peluca?"], ["r3", "Es un recuerdo, no te la quites."]],
  [["r1", "Hablemos claro: {fuera} se fue porque no arriesgó."], ["r2", "O porque tuvo mala suerte. Esto es muy injusto a veces."], ["r1", "La suerte se trabaja."]],
  [["r3", "Anoche le escribí a {fuera}. Dice que nos ve a todas en la final."], ["r1", "A todas no, que a la final no llegamos todas."]],
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
      { txt: "Apuesto a que me voy yo, así no pierdo.", rel: { r1: 1, r2: 1 }, reply: ["r2", "(Se ríe) Qué pesimista."] },
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
      { txt: "Gracias, pero voy con {r3}.", rel: { r3: 2, r1: -1, r2: -1 }, reply: ["r3", "¡Así me gusta!"] },
      { txt: "Paso de alianzas, cada una lo suyo.", rel: {}, bonus: 60, reply: ["r2", "Tú misma. Luego no llores."] },
    ],
  },
);
HISTORIA.anuncio.push(
  [["host", "Os lo digo ya: esta semana alguien va a llorar. El reto es... ¡{reto}!"]],
  [["host", "Reinas, preparaos para {reto}."], ["host", "Os estaré mirando. A todas."]],
  [["host", "¡Sorpresa! El reto de hoy es {reto}."], ["r1", "Ay, no, justo lo que peor se me da."], ["host", "Pues a trabajar."]],
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
  [["me", "Menudo look, {r1}. Me muero de envidia."], ["r1", "Envidia sana, espero."]],
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

// Roles detrás de cámaras (escenas del taller y confesionario), némesis y comentarios del estilismo
export const ROLES_HISTORIA: any = {
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
          { txt: "Opino que te vas a atragantar con tus palabras.", rel: { r1: -1 }, bonus: 120, reply: ["r1", "Ya veremos quién se atraganta."] },
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
          { txt: "Es malísimo. Cuéntame otro.", rel: { r1: 1 }, adv: 3, reply: ["r1", "¡Así me gusta! Ya estás más suelta."] },
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
      { lines: [["r1", "{yo}, ¿has comido algo? Te traigo un bocadillo, que así no se cose."], ["r2", "¿Y para mí no hay?"], ["r1", "Para ti también, pesada. Aquí no se queda nadie sin comer."]],
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
      { lines: [["r1", "Reinas, os lo digo ya para que no os llevéis sorpresas: esta corona es mía."], ["r2", "Qué humilde."], ["r1", "La humildad no gana coronas."]],
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

export const ROLES_ORDEN: any = ["villana", "cizanera", "graciosa", "madre", "diva", "sensible", "estratega", "novata"];

export const NEMESIS: any = {
  nace: {
    choque: [
      ["r1", "(Confesionario) Lo de {yo} ya no es una pelea de un día. Me tiene un poco cansada, la verdad."],
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
      ["r1", "(Confesionario) {yo} y yo siempre acabamos peleando por lo mismo. Ya veremos quién llega más lejos."],
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
      [["r1", "Muy bien lo de ganar. Pero aquí la corona no se gana en una semana."]],
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
    ["host", "Esto es lo que todas estaban esperando: {yo} y {r1}. Esto venía de lejos."],
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

export const ESTILO_CRITICA: any = {
  top: ["Lo que llevas es exactamente «{cat}». Ni una pieza fuera de sitio.", "El estilismo es impecable: se nota que lo has pensado de arriba abajo.", "Con lo de {pieza} me has ganado antes de llegar al final de la pasarela."],
  mid: ["La idea de «{cat}» está, pero lo de {pieza} no termina de encajar.", "Hay piezas muy buenas y otras que parecen de otro armario.", "Bonito, aunque le falta coherencia al conjunto."],
  low: ["¿{pieza}, para «{cat}»? No lo entiendo, y mira que lo intento.", "Cada pieza iba por su lado. Parecía un mercadillo.", "La categoría era «{cat}». Creo que no te llegó el mensaje."],
};


// Reencuentro (antes de la final) y sorteo de la final
export const REENCUENTRO: any = {
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

export const FINAL_SORTEO: any = [
  [["host", "Reinas, así va a ser la final: cuatro reinas, dos lip syncs."], ["host", "El sorteo decide las parejas. Las ganadoras se enfrentarán por la corona."], ["judge", "Disfrutadlo. Os lo habéis ganado."]],
];

