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
  respuestas: [
    { txt: "He venido a por la corona, cariño.", reply: ["r2", "Uy, qué segura se la ve. Ya veremos en la pasarela."], bonus: 150 },
    { txt: "Estoy nerviosa, pero con muchas ganas.", reply: ["r1", "Normal, reina. Los nervios se quitan con la primera pose."], bonus: 100 },
    { txt: "Yo he venido a pasármelo bien.", reply: ["r2", "Eso es lo más importante... aunque ganar tampoco está mal."], bonus: 80 },
  ],
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
