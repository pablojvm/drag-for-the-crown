# Drag for the Crown

Juego de navegador inspirado en los realities de drag: compites en una temporada entera (retos, pasarela, críticas, untucked y lip syncs) hasta llevarte la corona, sola o con amigas en directo.

**Jugar:** https://pablojvm.github.io/drag-for-the-crown/

## Modos

- **Modo historia.** Eliges temporada y reina y juegas la temporada capítulo a capítulo: minirreto, reto (snatch, roast, rusical, actuación, diseño, makeover, impro, Lalaparuza...), pasarela con tus looks, críticas, untucked, veredicto y lip sync. Relaciones con las compañeras, némesis, armario y tienda, y dinámicas especiales por temporada: All Stars (pintalabios), All Winners (estrellas y bloqueos), Segunda Oportunidrag, reina de la suerte, temporada del corazón y de la moneda.
- **Multijugador en directo.** Cada jugadora es una reina y el resto del reparto lo lleva el juego. La anfitriona lleva el ritmo de las pantallas y las demás ven lo mismo. Incluye todas las dinámicas, partida personalizada, maletas con presupuesto, pausa con acuerdo de todas y lip syncs entre jugadoras paso a paso y a la vez.
- **Arcade.** El juego original: esquiva tacones y lanza los tuyos en cinco rondas hasta el lip sync final.

Opcional: retos escritos con IA (Gemini con Groq de respaldo, con límite diario), cuenta con Google, partida en la nube y Hall of Fame mundial.

## Desarrollo

```bash
npm install
npm run dev        # http://localhost:8000
npm run check      # tipos
npm run lint       # ESLint (TypeScript estricto, código antiguo solo errores reales)
npm test           # tests de reglas (Vitest)
npm run build && npm run preview
npm run e2e        # un capítulo entero del modo historia en un navegador
npm run e2e:mp     # dos jugadoras y un duelo de lip sync
```

Las pruebas en navegador usan Playwright (`npx playwright install chromium` la primera vez). El despliegue a GitHub Pages lo hace el workflow en cada push a `main`, y antes pasa tipos, lint, tests y pruebas en navegador.

Más detalle (servidor, claves, Supabase): [DESARROLLO.md](DESARROLLO.md).

## Estructura

| Carpeta | Qué hay |
| --- | --- |
| `src/core/` | Reglas puras en TypeScript con tests, compartidas por la historia y el multijugador: resultados de la semana, finales, Lalaparuza, azar con semilla, dado, cuadro, track record, flujo del episodio, partidas guardadas |
| `src/mp/` | Multijugador: reglas de la sala (`model.ts`), conexión (`room.ts`, `bus.ts`) y pantallas (`ui.ts`) |
| `src/net/` | Cuentas, nube y captura de errores (Supabase) |
| `js/historia/` | Motor del modo historia (código antiguo, se irá pasando a `src/core`) |
| `js/` | Arcade, menús, diálogos y datos de las reinas |
| `supabase/` | Migraciones de la base de datos y la función de IA |
| `tools/` | Pruebas en navegador y revisión del modo historia |
| `public/` | Imágenes, audio, estilos y service worker |

## Hoja de ruta

El plan de profesionalización (auditoría, nuevo motor con Phaser 4 + React + Colyseus y fases) está en el documento de auditoría del proyecto.
