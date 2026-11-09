# Drag for the Crown

Juego de navegador inspirado en los realities de drag: compites en una temporada entera (retos, pasarela, críticas, untucked y lip syncs) hasta llevarte la corona, sola o con amigas en directo.

**Jugar:** https://juego.pablojvm.com/ (la versión clásica, con el multijugador en directo, sigue en `/clasico.html`)

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
npm run e2e:moneda # lo mismo en la temporada de la moneda (bottom de tres y votación)
npm run e2e:mp     # dos jugadoras y un duelo de lip sync
npm run e2e:next   # el motor nuevo (Phaser 4 + React): arcade con poderes, un lip sync y las dos pasarelas
npm run e2e:jurado # un capítulo con la pasarela con concepto (jurado de prueba)
npm run e2e:temporada # el modo historia del motor nuevo: temporadas enteras (normal, Segunda Oportunidrag, corazones viéndola desde casa, moneda, All Stars y All Winners)
```

Las pruebas en navegador usan Playwright (`npx playwright install chromium` la primera vez). El despliegue a GitHub Pages lo hace el workflow en cada push a `main`, y antes pasa tipos, lint, tests y pruebas en navegador.

Más detalle (servidor, claves, Supabase): [DESARROLLO.md](DESARROLLO.md).

## Servidor de salas (multijugador)

El multijugador en directo va por un servidor de [Colyseus](https://colyseus.io) (`server/`) que lleva el reloj y aplica las
reglas de `src/mp/model.ts` (las mismas peticiones que `src/mp/ops.ts`), así que nadie puede hacer trampas desde su navegador.
Si el servidor no responde, el juego sigue funcionando como antes: la anfitriona lleva la sala por Supabase Realtime.

- En local: `npm run server` (puerto 2567) y abre `clasico.html?mpserver=ws://localhost:2567`.
- Pruebas: `PORT=2599 npm run server` y `npm run e2e:mp-server` (temporadas enteras con bots y dos navegadores).
- Render (gratis), una sola vez: en render.com, New > Blueprint y elige este repo (usa `render.yaml`). El juego busca el servidor en `wss://drag-for-the-crown.onrender.com` y, si no, en Fly.io. En el plan gratuito se duerme sin jugadoras: mientras despierta, el juego juega sin servidor.
- Fly.io, una sola vez, desde la raíz del repo: `fly auth signup` (o `login`), `fly launch --no-deploy --copy-config`, `fly deploy`.
  El juego busca el servidor en `wss://dftc-salas.fly.dev`; si usas otro nombre de app, cámbialo en `fly.toml` y en la
  variable `VITE_MP_URL` del repo (Settings > Variables).
- Despliegue automático: añade el secreto `FLY_API_TOKEN` (`fly tokens create deploy -a dftc-salas`) y cada cambio en
  `server/`, `src/mp/` o `src/core/` se despliega solo.

## Estructura

| Carpeta | Qué hay |
| --- | --- |
| `src/core/` | Reglas puras en TypeScript con tests, compartidas por la historia y el multijugador: resultados de la semana, lip sync, pasarela (clásica y con concepto), temáticas, reinas y temporadas, retos por decisiones, temporada del motor nuevo, textos del jurado, voz del guion, dinámicas de temporada (suerte, corazón, moneda, pintalabios), finales, Lalaparuza, azar con semilla, dado, cuadro, track record, flujo del episodio, partidas guardadas |
| `src/mp/` | Multijugador: reglas de la sala (`model.ts`), conexión (`room.ts`, `bus.ts`) y pantallas (`ui.ts`) |
| `src/net/` | Cuentas, nube y captura de errores (Supabase) |
| `src/next/` | El juego (motor nuevo): Phaser 4 (escenas) + React (interfaz) + Zustand (estado). Es la portada (`index.html`): arcade con poderes, power-ups y sonido, lip sync, pasarela con concepto (sin conexión, la clásica) y el modo historia rehecho (minirretos, escenas del taller con los roles de cada compañera, retos por decisiones, en equipo y con minijuegos, armario y tienda, críticas, Untucked, confesionario y némesis, la Lalaparuza, el reencuentro con Miss Simpatía, retos escritos en directo, charla libre con las compañeras, el All Stars a tu gusto, logros, las dinámicas de cada temporada, lip syncs, final y track record). Las reglas están en `src/core` |
| `js/historia/` | Versión clásica (`clasico.html`): el modo historia antiguo y el multijugador en directo |
| `js/` | Arcade, menús, diálogos y datos de las reinas |
| `supabase/` | Migraciones de la base de datos y la función de IA |
| `tools/` | Pruebas en navegador y revisión del modo historia |
| `public/` | Imágenes, audio, estilos y service worker |

## Hoja de ruta

El plan de profesionalización (auditoría, nuevo motor con Phaser 4 + React + Colyseus y fases) está en el documento de auditoría del proyecto.
