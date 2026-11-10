// Ayudas compartidas de las pruebas en navegador.
// - Azar con semilla: la partida es la misma en cada ejecución (SEED=n para probar otra; se imprime si falla).
// - Tope por tiempo y no por vueltas: con el ordenador cargado las vueltas van más lentas y la prueba no se queda sin margen.
export const SEED = Number(process.env.SEED || 20261110);

/** Cambia Math.random de la página por uno con semilla (mulberry32), antes de que cargue el juego. */
export async function seeded(target, seed = SEED) {
  await target.addInitScript((s) => {
    let a = s >>> 0;
    Math.random = () => {
      a = (a + 0x6d2b79f5) >>> 0;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }, seed);
}

/** ¿Queda tiempo? `deadline(min)` devuelve una función que dice si aún no se ha pasado el tope. */
export const deadline = (min) => { const end = Date.now() + min * 60000; return () => Date.now() < end; };

// Si la prueba falla, se dice con qué semilla (para repetir exactamente la misma partida)
process.on("exit", (code) => { if (code) console.log(`(semilla ${SEED}: repítela con SEED=${SEED})`); });
