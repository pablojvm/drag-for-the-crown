# Drag for The Crown!

# Descripción
Drag for the Crown es un minijuego arcade de navegador. Eliges a tu queen y te enfrentas a las otras cinco en 5 rondas, esquivando sus tacones y lanzando los tuyos. La última ronda es el jefe final: *Lip Sync for Your Life*.

# Cómo se juega

- Muévete con las flechas (o WASD) por la mitad inferior de la pasarela.
- Lanza tacones con Espacio (mantén pulsado para disparo continuo).
- Usa el poder especial de tu reina con `E` (o Shift) cuando la barra esté llena.
- `P` / `Esc` para pausar y `M` para silenciar.
- En móvil aparecen controles táctiles.

# Funcionalidades

- 11 reinas, cada una con sus estadísticas (velocidad, cadencia, potencia y resistencia) y un poder especial propio que se carga golpeando a la rival.
- 5 reinas bloqueadas que se desbloquean al acumular puntos entre partidas (Jujubee 10.000, Crystal Methyd 25.000, Dafne Mugler 45.000, Trixie Mattel 70.000 y Brooke Lynn Hytes 100.000).
- Al elegir reina se despliega su ficha con estadísticas y poder.
- Pantalla de puntuaciones (Hall of Fame) con el Top 10, nombre del jugador, estadísticas de carrera y progreso de desbloqueos.

- 5 rondas con dificultad creciente: cada rival tiene barra de vida, su propio movimiento (rebote, onda, embestida, figura en ocho) y su patrón de ataque (disparo recto, dirigido, abanico, ráfagas y combinación en el jefe final).
- Puntuación con combos (hasta x8), bonus por eliminar rival, ronda sin daño ("Flawless") y vidas restantes.
- Power-ups: pintalabios (+1 vida) y corona (doble tacón durante 7 s).
- Invulnerabilidad breve tras recibir un golpe.
- Récord guardado en el navegador y pantalla final con estadísticas (puntos, precisión, combo máximo, tiempo).
- Efectos: partículas de purpurina, textos flotantes, temblor de cámara, focos animados y pasarela en perspectiva.
- Pausa automática al cambiar de pestaña.
- Escalado a cualquier tamaño de pantalla y controles táctiles.

# Tecnologías

- HTML, CSS y JavaScript sin frameworks.
- Canvas 2D para el juego y bucle con `requestAnimationFrame` basado en delta time.
- Web Audio API para efectos sintetizados y `Audio` para música y voces.
- `localStorage` para el récord y la preferencia de sonido.

# Estructura

- `js/config.js`: constantes, queens, configuración de rondas y utilidades.
- `js/audio.js`: música, voces y efectos de sonido.
- `js/effects.js`: partículas, textos flotantes, temblor y fondo animado.
- `js/entities.js`: jugadora, rivales, tacones y power-ups.
- `js/game.js`: bucle, estados, colisiones, puntuación y HUD.
- `js/ui.js`: pantallas, elección de queen, pausa, sonido, escalado y controles táctiles.

# ENLACES IMPORTANTES

## DEPLOY

- https://pablojvm.github.io/drag-for-the-crown/

## DIAPOSITIVAS

- https://www.canva.com/design/DAGm8fj9BcM/hBqL4XWOZ9aIYhxzIkVhKw/edit?utm_content=DAGm8fj9BcM&utm_campaign=designshare&utm_medium=link2&utm_source=sharebutton