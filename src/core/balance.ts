// EQUILIBRIO: todos los números de dificultad en un solo sitio.
// Cambia aquí y comprueba el reparto con DFTC_SIM("es1", 500) en la consola o con `npm test`.
export const BALANCE = {
  temporada: { subidaPorTemporada: 2, subidaMax: 10 },
  // Dado de cada semana: % de brillante, buena, normal, floja y desastre según atributo bajo / medio / alto
  dado: { low: [3, 10, 30, 32, 25], mid: [10, 22, 38, 20, 10], high: [30, 35, 25, 8, 2] },
  notas: [[90, 99], [78, 89], [62, 77], [45, 61], [20, 44]] as [number, number][],
  // Tu juego mueve tu dado: a partir de qué nota subes o bajas escalones.
  // Y manda: tu nota final no se aleja de lo que has jugado más que estos márgenes (lo que ves es lo que sacas)
  tuJuego: { borda: 90, probDosEscalones: 0.35, bien: 75, normal: 55, mal: 35, margenAbajo: 8, margenArriba: 6 },
  // Rasgos en el reto (puntos sobre 100)
  rasgos: { fortaleza: 9, debilidad: -10, pasarela: 5, poderMax: 5, poderFactor: 0.6 },
  // Lip sync simulado entre rivales
  lipSync: { fortaleza: 4, debilidad: -6, porRecord: 1, poderFactor: 0.4, escala: 44, min: 0.25, max: 0.75 },
  repescaCuando: 7,
  // Segunda Oportunidrag desde casa: lo que suma tu pareja por las ganas de volver (las eliminadas vuelven con hambre).
  // Con 8, jugando bien (80 en el monólogo) vuelves más o menos una de cada dos veces; sin ella, una de cada seis
  repescaDesdeCasa: 8,
};
export type Balance = typeof BALANCE;
