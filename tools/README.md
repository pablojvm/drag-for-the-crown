# Herramientas

- `smoke-test.mjs`: prueba de humo con Playwright. Con `npm run build && npm run preview` en otra terminal, ejecuta `npm run e2e`. Empieza una temporada, prepara los looks, llega a la primera pasarela y corre el simulador de equilibrio. Falla si hay errores en la página.

El resto de comprobaciones están en `npm test` (núcleo en `src/core`) y `npm run check` (tipos).
