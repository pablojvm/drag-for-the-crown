# Herramientas

- `node tools/build-historia.mjs` une las partes de `js/historia/` en `js/historia.js`, que es lo que carga el juego.
  Edita siempre las partes y vuelve a generar. `--check` comprueba que está al día.
- `node tools/smoke-test.mjs [url]` prueba de humo con Playwright: empieza una temporada, prepara los looks,
  llega a la primera pasarela sin errores y corre el simulador.
- En la consola del navegador: `DFTC_SIM("es1", 500)` simula temporadas y saca wins, bottoms y coronas por reina.
  Los números de dificultad están juntos en `BALANCE` (en js/historia/01-flujo-y-relaciones.js, busca "EQUILIBRIO").
