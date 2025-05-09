# Drag for The Crown!

# Description
Drag for the crown es un minijuego donde tendrás que superar y sobrevivir a 5 enemigos o Drags que constantemente estarán arrojando tacones. Contarás con un total de 3 vidas(representados en LipSticks) de las cuales se te restará una si eres alcanzado por un tacón enemigo. Tu tendrás que eleminar a las demás Drags tratando de darles con los tacones que tu mismo les arrojarás.

# Funciones

- Moverás a tu personaje con las flechas del teclado "Arriba", "Abajo", "Izquierda" y "Derecha".
- Lanzarás tacones al presionar la tecla "SpaceBar".
- Las Drags enemigas se moveran de forma automática y apareceran en una posicion aleatoria dentro de su cuadro de movimiento. 
- Las Drags enemigas lanzan tacones de formas automática.
- La dificultad del juego aumentará con la velocidad de las drags según elimines a la que tengas en pantalla.
- Podrás elegir a tu Drag favorita para jugar.
- Con la pérdida de los 3 Lipsticks tendrás opción de reiniciar el juego.
- Una vez consigas el Shantay You Stay!(ganes el juego), tendrás opción de reiniciar el juego.

# Tecnologías utilizadas

- HTML.
- CSS.
- JavaScript.
- Manipulación de DOM.
- Lienzo JS.
- Clases JS.
- Almacenamiento local.
- Github.
- JS Audio y JS Image.

# Pantallas del Juego

- Pantalla de Inicio.
- Pantalla de elección.
- Pantalla de Juego.
- Pantalla de Sashay(GameOver)
- Pantalla de Shantay(WIN!)

# Estructura del Proyecto

## main.js

- Declaración de variables globales del juego(para pantallas, imagenes, audios...)
- startGame()
- checkColissionEnemigosTacones() 
- checkColissionPersonajeTacones()
- gameLoop()
- taconesAppear()
- taconesEnemiesAppear()
- finishedGame()
- GameOver()
- reStartGame()
- reStartGameOver()

## personaje.js

- class Personaje

## tacones.js

- class Tacones
- taconesVolando()
- taconesDestroy()

## enemigos.js

- class enemigos
- moverEnemigos()
- checkColissionEnemigosWall()

## lipstick.js

- class vidas

## taconesEnemigos.js

- class TaconesEnemigos
- taconesEnemigosVolando()
- taconesDestroy()

# ENLACES IMPORTANTES

## DEPLOY

- https://pablojvm.github.io/drag-for-the-crown/

## DIAPOSITIVAS

- 