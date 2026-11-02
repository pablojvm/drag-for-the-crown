// Textos del jurado y bancos de chistes: los comparten el modo historia, el multijugador y el motor nuevo.

export const JURADO = {
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
    lalaparuza: {
      top: ["Ronda tras ronda, has bailado como si te fuera la vida. Nadie ha podido contigo.", "Te has sabido cada palabra de cada canción. Eso es una asesina del lip sync.", "Has ido de menos a más y en la última ronda has arrasado."],
      mid: ["Has ganado algún duelo muy bueno, pero luego te has quedado sin gasolina.", "Buenos momentos, aunque en tu último lip sync te faltó remate.", "Has bailado bien, pero te ha tocado un cruce muy duro."],
      low: ["Te has ido en la primera ronda y casi no te hemos visto.", "La letra no te la sabías. En un lip sync eso no se perdona.", "Mucha energía al principio y luego nada. Así no se gana un torneo."],
    },
    comedia: {
      top: ["Me he reído de verdad, y eso en este jurado es difícil.", "Tienes un timing de cómica profesional. Cada remate, en su sitio.", "Has sabido reírte de ti misma sin perder el control. Brillante."],
      mid: ["Algunos chistes han funcionado y otros se han quedado en el aire.", "Buena idea, pero te ha faltado ritmo en el remate.", "Graciosa a ratos. Te ha faltado constancia."],
      low: ["Los chistes no llegaban. Se oían hasta los grillos.", "Te has quedado en blanco y se ha notado muchísimo.", "No ha habido ni una carcajada. Ni de compromiso."],
    },
    general: {
      top: ["Has entendido el reto mejor que nadie. Se notaba que disfrutabas.", "Seguridad, ideas y remate. Así se gana un reto.", "Has hecho que lo difícil pareciera fácil."],
      mid: ["Correcta, pero te ha faltado ese punto que te hace destacar.", "Tenías una buena idea que no has terminado de rematar.", "Has cumplido, aunque esperaba más de ti."],
      low: ["Te he visto perdida durante todo el reto.", "No has entendido lo que te pedíamos.", "Hoy no ha sido tu día, y se ha notado desde el principio."],
    },
    equipos: {
      top: ["Has liderado el grupo sin comerte a tus compañeras.", "Tu parte del número ha sido la mejor, y lo sabes.", "Has hecho brillar a todo el equipo."],
      mid: ["Has cumplido en el grupo, pero sin destacar.", "Te has escondido un poco detrás de tus compañeras.", "Correcta, aunque el número pedía más de ti."],
      low: ["Se notaba que no ensayaste con el grupo.", "Has ido a tu aire mientras el resto iba a otro.", "En un grupo, si una falla, fallan todas. Y hoy fallaste tú."],
    },
  },
  pasarela: {
    top: ["Y en la pasarela, un look de otro planeta.", "El look de pasarela, impecable de arriba abajo.", "Por cierto, ese look de pasarela es de lo mejor de la temporada."],
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

// Críticas de los demás retos
const R = JURADO.reto as Record<string, { top: string[]; mid: string[]; low: string[] }>;
R.comedia = {
  top: ["Timing perfecto. Sabías cuándo parar y cuándo rematar.", "Me he reído de verdad, y no me pasa desde hace años.", "Tenías al público en la palma de la mano."],
  mid: ["Algunos chistes buenos, otros que se quedaron colgando.", "Has empezado fuerte y te has ido desinflando.", "Graciosa, pero te faltó personalidad en el texto."],
  low: ["Eso no era un monólogo, era una lista de la compra.", "El público se reía por pena. Y eso duele verlo.", "Te has quedado en blanco más de lo que has hablado."],
};
R.roast = {
  top: ["Afilada sin ser cruel. Eso es un roast de verdad.", "Me has asado a mí y encima me ha gustado.", "Cada remate llegaba justo a tiempo. Bravo."],
  mid: ["Tenías buenas ideas, pero no rematabas.", "Algunos golpes muy buenos, otros muy blanditos.", "Te faltó maldad. Un poquito solo."],
  low: ["Eso no era un roast, era un informe.", "No te has atrevido con nada. Y en un roast eso se paga.", "Ni se han picado las roasteadas."],
};
R.actuacion = {
  top: ["Te sabías el guion y encima lo has hecho tuyo.", "Has hecho que un texto absurdo pareciera de Almodóvar.", "Presencia, texto y verdad. Actriz."],
  mid: ["Te trabaste un par de veces, pero saliste bien.", "Correcta. Un poco plana en las escenas clave.", "La energía estaba, el texto no tanto."],
  low: ["No te sabías el guion y se ha notado en cada escena.", "Improvisar está bien, pero no todo el rato.", "Te he visto leer el apuntador con los ojos."],
};
R.ball = {
  top: ["Tres looks, tres historias. El ball es tuyo.", "Cada look superaba al anterior. Eso es saber construir.", "Has entendido las tres categorías a la perfección."],
  mid: ["Dos looks muy buenos y uno que sobraba.", "El último look no estaba a la altura de los otros.", "Buena idea general, ejecución irregular."],
  low: ["Los tres looks parecían el mismo con distinto color.", "La categoría no se entendía en ninguno.", "Un ball sin sorpresa no es un ball."],
};
R.makeover = {
  top: ["Parecéis familia de verdad. Qué parecido tan logrado.", "El makeover es impecable. Has sacado a una reina de donde no había.", "Esa conexión con tu pareja se ve desde aquí."],
  mid: ["El parecido está, pero los acabados fallan.", "Buena química, maquillaje mejorable.", "Vais a juego, pero no parecéis familia."],
  low: ["No sé cuál de las dos es la drag. Ni ellas tampoco.", "El makeover está a medias. Literalmente.", "Ahí no hay parecido ni con buena voluntad."],
};
R.fotos = {
  top: ["Cada foto es una portada. No hay ni una mala.", "Sabes dónde está la cámara siempre. Eso es un don.", "El fotógrafo me ha dicho que eres la mejor del día."],
  mid: ["Algunas fotos preciosas y otras en las que no estabas.", "Te costó arrancar, pero al final encontraste la luz.", "Buenas poses, pero demasiado repetidas."],
  low: ["En la mitad de las fotos sales parpadeando.", "Llegabas tarde a cada flash.", "No he podido elegir ninguna foto buena. Ninguna."],
};
R.equipos = R.equipos || R.rusical;
R.impro = {
    top: ["Qué cintura en directo. Pasara lo que pasara, tú seguías.", "Eres una presentadora nata. Contrátenla ya.", "Has salvado cada silencio con una salida brillante."],
    mid: ["Algunos momentos muy buenos, otros te quedaste en blanco.", "Buen ritmo al principio, luego se te fue el programa.", "Correcta, pero muy de guion."],
    low: ["El directo te ha comido viva.", "Cada imprevisto era un silencio. Y el silencio en la tele es muerte.", "Parecías una espectadora de tu propio programa."],
  };
R.publicidad = {
    top: ["Me has vendido algo que no sirve para nada y lo quiero ya.", "Eslogan camp, texto clavado. Contratada por la agencia.", "Ese anuncio lo pondría en prime time."],
    mid: ["La idea es buena, pero te has trabado en lo importante.", "El producto hace gracia; el anuncio, a ratos.", "Te ha faltado un poco más de locura."],
    low: ["No sé qué vendías, y creo que tú tampoco.", "Eso no era un anuncio, era una lectura de prospecto.", "Cero camp. Y aquí el camp es obligatorio."],
  };
R.lalaparuza = {
    top: ["Has arrasado en el torneo. Eres una asesina del lip sync.", "Ronda tras ronda, sin bajar el nivel. Brutal.", "Nadie ha podido contigo en ese escenario."],
    mid: ["Buen torneo, aunque te quedaste a las puertas.", "Elegiste bien las canciones, pero te faltó fuelle al final.", "Una ronda más y hablábamos de otra cosa."],
    low: ["Te has ido a la primera. Eso duele.", "Elegiste mal la canción y lo pagaste.", "Te faltó energía desde el primer segundo."],
  };

export const COMEDIA: [string, [string, string, string]][] = [
  ["Empieza tu monólogo hablando de tu familia", ["Mi madre me pregunta cuándo me caso. Le digo: cuando encuentre a alguien con más pelucas que yo", "Mi familia es muy graciosa, la verdad", "Tengo una familia normal"]],
  ["Cuenta algo de tu primera vez en drag", ["Salí con tacones de mi prima. Dos números menos. Aún no siento los meñiques", "Fue muy emocionante", "Me puse un vestido"]],
  ["Un chiste sobre el gimnasio", ["Me apunté al gimnasio en enero. Ya he ido tres veces: a apuntarme, a darme de baja y a por la toalla", "El gimnasio cansa mucho", "No me gusta el gimnasio"]],
  ["Habla del transporte público", ["En el metro de Madrid a las ocho estás tan pegada que sales embarazada de tres desconocidos", "El metro va lleno", "Voy en autobús"]],
  ["Remata con algo sobre el amor", ["Mi último novio me dejó por mensaje. Con faltas. Por eso lloré", "El amor es complicado", "Estoy soltera"]],
  ["Un chiste sobre tu pueblo", ["En mi pueblo hay tan poca gente que el cotilleo lo hace una sola señora. Y hace horas extra", "Mi pueblo es pequeño", "Soy de un pueblo"]],
  ["Habla de las citas por aplicación", ["Me dijo que medía uno ochenta. Con mis tacones, puede", "Las apps de citas son raras", "Uso aplicaciones"]],
  ["Cierra el monólogo por todo lo alto", ["Gracias, sois un público maravilloso. Casi tanto como mi peluca", "Gracias por venir", "Ya está, eso es todo"]],
];

export const ROAST: [string, [string, string, string]][] = [
  ["Asa a Supremme por lo bien que se conserva", ["Supremme no envejece: se restaura, como el Prado", "Supremme está muy guapa", "Supremme es mayor"]],
  ["Asa a Ana Locking por lo exigente que es", ["Ana es tan exigente que devolvió el sol por falta de brillo", "Ana es muy exigente", "Ana es seria"]],
  ["Asa a la reina que siempre llega la última", ["Llega tan tarde que su tarjeta de presentación pone: continuará", "Siempre llega tarde", "Es impuntual"]],
  ["Asa a la compañera más dramática", ["Hace un drama hasta para elegir la pajita del zumo", "Es muy dramática", "Le gusta el drama"]],
  ["Asa a la reina con más maquillaje", ["Si le quitas el maquillaje, pierde tres kilos y el DNI", "Lleva mucho maquillaje", "Se maquilla mucho"]],
  ["Asa a la que siempre gana", ["Gana tanto que el trofeo ya tiene su dirección en el GPS", "Gana mucho", "Es buena"]],
  ["Asa a la que peor canta", ["Cuando canta, los perros del barrio le piden silencio", "Canta regular", "No canta bien"]],
];


// Snatch Game: personajes de ficción, preguntas de Supremme y respuestas planas
export const SNATCH_PERSONAJES: { id: string; icon: string; name: string; tono: string; frases: string[] }[] = [
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

export const SNATCH_PREGUNTAS: string[] = [
  "¿Cuál es tu secreto de belleza?", "¿Qué harías con un millón de euros?", "¿Cómo te preparas para una cita?", "¿Qué opinas del amor?",
  "¿Qué llevarías a una isla desierta?", "¿Cuál es tu plato favorito?", "¿Qué consejo le darías a las concursantes?", "¿Cómo te enfrentas a una ruptura?",
  "¿Qué opinas del gimnasio?", "¿Qué es lo primero que haces al levantarte?", "¿Cómo celebras tu cumpleaños?", "¿Qué harías con un programa propio en la tele?",
];

export const SNATCH_PLANAS: string[] = ["Pues no sé, la verdad.", "Bien, supongo.", "Eso es muy personal.", "Mmm... siguiente pregunta.", "Lo normal, como todo el mundo.", "Ni idea."];

/** Banco de críticas de un reto: el suyo o el de su tipo (nunca el de la pasarela si no la hay). */
const BANCO_DE: Record<string, string> = { roast: "comedia", impro: "comedia", publicidad: "comedia", actuacion: "comedia", repescaStand: "comedia", comedia: "comedia", materiales: "diseno", costura: "diseno", ball: "pasarela", makeover: "maquillaje", girlgroups: "equipos" };
export function bancoReto(tipo: string): Record<"top" | "mid" | "low", string[]> {
  const R = JURADO.reto as Record<string, Record<"top" | "mid" | "low", string[]>>;
  return R[tipo] || R[BANCO_DE[tipo]] || R.general;
}
