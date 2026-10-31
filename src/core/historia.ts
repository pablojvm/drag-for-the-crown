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
