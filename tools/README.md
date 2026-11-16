# Herramientas

- `smoke-test.mjs`: prueba de humo con Playwright. Con `npm run build && npm run preview` en otra terminal, ejecuta `npm run e2e`. Empieza una temporada, prepara los looks, llega a la primera pasarela y corre el simulador de equilibrio. Falla si hay errores en la página.
- `fuzz-historia.mjs`: busca atascos. Juega temporadas enteras del modo historia con varias semillas y, si la pantalla no cambia en 45 segundos, dice dónde se ha quedado. `SEEDS=1,2,3 FR=1 SE="por brackets" SCORE=60 npm run e2e:atascos` (`FR`: 0 temporadas, 1 All Stars; `SE`: número o nombre de la temporada; `SCORE=libre` para jugar sin nota fija).

El resto de comprobaciones están en `npm test` (núcleo en `src/core`) y `npm run check` (tipos).
