# Desarrollo (versión 2)

El juego ya no se abre tal cual en el navegador: se arranca con Vite. Lo que ves sigue siendo el mismo juego, pero ahora tiene núcleo en TypeScript con tests, una máquina de estados para el episodio y, si lo configuras, un servidor en Supabase.

## Puesta en marcha

Necesitas Node 22.

```
npm install
npm run dev          # juego en http://localhost:8000 (se recarga al guardar)
npm test             # tests del núcleo (dado, cuadro de la Lalaparuza, track record, flujo del episodio)
npm run check        # comprobación de tipos de TypeScript
npm run build        # versión para publicar, en dist/
npm run preview      # sirve dist/ en http://localhost:4173
npm run e2e          # prueba de humo con Playwright (con preview arrancado; la 1ª vez: npx playwright install chromium)
```

Para probar la IA en local sin servidor, como antes: `public/js/claves.js` con `window.CLAVES = { gemini: "...", groq: "", openrouter: "" };` (no se sube a git).

## Estructura

| Carpeta | Qué hay |
|---|---|
| `src/core/` | Lógica pura en TypeScript con tests: azar con semilla, equilibrio (`balance.ts`), dado, track record y PPE, cuadro de eliminatorias, máquina de estados del episodio |
| `src/net/` | Conexión con Supabase: IA del servidor, progreso en la nube, Hall of Fame mundial, memoria larga y botón de Google |
| `js/` | El juego de siempre. Vite concatena estos archivos en un solo módulo (siguen viéndose entre sí) y les da el núcleo como `DFTC` |
| `js/historia/` | Modo historia por partes (ya no hace falta generar `historia.js`) |
| `public/` | Imágenes, audio, modelos, fuentes, estilos y el service worker: se copian tal cual |
| `supabase/` | Esquema de la base de datos (`migrations/`) y la función de la IA (`functions/ai`) |
| `tests/` | Tests de Vitest |

En la consola del navegador siguen funcionando `Story.repetirEpisodio()`, `DFTC_SIM("es1", 500)` y `IA.estado()`. Además `DFTC` expone el núcleo y `DFTC_NET` la conexión con el servidor.

## Máquina de estados del episodio

`src/core/episode.ts` define el orden del programa: inicio, minirreto, taller, reto, pasarela, llamada, críticas, Untucked, veredicto, lip sync y fin (más la maestra de ceremonias de la Segunda Oportunidrag). Cada pantalla del modo historia avisa al entrar (`flowGo("...")`) y si el paso no es legal se anota en la partida (`S.flowErr`) y sale en la consola como `[flujo] paso no válido`. Las pruebas automáticas fallan si aparece ese aviso. El siguiente paso es ir pasando pantallas a la máquina (que sea ella la que decide qué viene después) reto a reto.

## Servidor (Supabase)

Sin configurar, el juego funciona como antes (todo en el navegador). Para activarlo:

1. **Proyecto**: crea uno en supabase.com (región de la UE).
2. **Login anónimo**: Authentication > Sign In / Providers > activa *Anonymous sign-ins*. En Authentication > Settings activa *Allow manual linking* (para pasar de anónima a Google sin perder el progreso).
3. **Google**: en Google Cloud Console crea un ID de cliente OAuth (aplicación web) con la URL de redirección `https://TU-PROYECTO.supabase.co/auth/v1/callback`. Pega el ID y el secreto en Authentication > Providers > Google.
4. **URLs**: Authentication > URL Configuration. Site URL `https://pablojvm.github.io/drag-for-the-crown/` y añade `http://localhost:8000/` y `http://localhost:4173/` a las redirecciones.
5. **Base de datos y función** (desde la carpeta del juego):
   ```
   npx supabase login
   npx supabase link --project-ref TU-PROYECTO
   npx supabase db push
   npx supabase secrets set GEMINI_API_KEY=tu-clave-de-gemini
   npx supabase functions deploy ai
   ```
   Opcionales: `AI_DAILY_LIMIT` (llamadas por jugadora y día, 150 por defecto), `AI_GLOBAL_LIMIT` (tope diario total, 1400) y `GEMINI_MODELS` (lista separada por comas).
6. **Variables**: copia `.env.example` como `.env.local` con la URL y la clave *anon* (Project Settings > API). En GitHub: Settings > Secrets and variables > Actions > *Variables*, crea `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`.

Qué hace el servidor:

- **IA para todo el mundo**: el juego llama a la función `ai`, que usa tu clave de Gemini (escondida) con un límite por jugadora y día. Si se acaba, el juego sigue con sus textos de siempre.
- **Progreso en la nube**: cada jugadora es anónima al entrar; todo lo guardado (`dftc-*`) se sube solo. Con «☁️ Guardar con Google» se enlaza a su cuenta y puede seguir en otro dispositivo.
- **Hall of Fame mundial**: pestaña «🌍 Mundial» en Puntuaciones.
- **Memoria larga**: al acabar cada temporada se guarda un resumen; en las siguientes, la IA lo tiene en cuenta para que las reinas recuerden.

## Temporada en directo (multijugador)

Botón «👯 Multijugador» del menú. Una jugadora crea la sala (temporada y ritmo) y pasa el código de 5 letras; cada una elige una reina y el resto del reparto lo juega el juego. Cada fase tiene tiempo tope (ritmo normal unos 11 minutos por episodio, rápido unos 8): si alguien no entrega, sigue sin ella con la nota de «no presentó». Las eliminadas se quedan viendo la temporada.

- Reglas y estado de la sala: `src/mp/model.ts` (con tests). Red: `src/mp/bus.ts` (Supabase Realtime, o entre pestañas del mismo navegador si no hay servidor). Sala: `src/mp/room.ts`. Pantallas: `src/mp/ui.ts`.
- La anfitriona lleva el reloj y aplica las reglas; si se cae, la siguiente que entró toma el relevo con el último estado.
- En la temporada en directo no se usa IA (todas juegan con los mismos textos y al mismo ritmo) y no se toca la partida individual.
- Para probar sin servidor: abre el juego en dos pestañas, crea la sala en una y únete con el código en la otra. Con `?mpfast` en la URL los tiempos son cuatro veces más cortos.
- Con Supabase no hace falta configurar nada más: usa Realtime (activado por defecto) con la clave pública.

## Publicar

GitHub Pages ahora se publica con GitHub Actions (`.github/workflows/deploy.yml`): en cada push a `main` se pasan los tests, se compila y se sube `dist/`. Una sola vez: GitHub > Settings > Pages > Source: **GitHub Actions**.
