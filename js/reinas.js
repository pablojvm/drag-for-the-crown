// ---------------------------------------------------------------------------
// Reinas de Drag Race España y All Stars España
// ---------------------------------------------------------------------------
// Cada temporada lista su reparto EN ORDEN DE EXPULSIÓN: la primera es la
// primera eliminada y la última es la ganadora (jefa final de la campaña).
//
// Para completar una reina, rellena su ficha en REINAS_ES:
//   foto:    imagen de cuerpo entero SIN FONDO (PNG) -> images/queens/<id>.png
//   retrato: foto para la tarjeta (JPG)              -> images/queens/<id>_retrato.jpg
//   audio:   frase en audio (MP3)                    -> audio/queens/<id>.mp3
//   frase:   texto de su frase icónica
// Pon true en foto/retrato/audio cuando hayas añadido el archivo. Mientras
// tanto, la reina aparece con una silueta provisional.

// Los datos viven en src/core/reinas.ts (los comparten el modo historia, el multijugador y el motor nuevo)
const TEMPORADAS_ES = DFTC.TEMPORADAS_ES;
const REINAS_ES = DFTC.REINAS_ES;
const PORTADAS = DFTC.PORTADAS;
const PROXIMAS_TEMPORADAS = DFTC.PROXIMAS_TEMPORADAS;
const LOOKS = DFTC.LOOKS;
