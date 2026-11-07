// Recursos opcionales del lip sync: caras y «reveals» de cada reina.
// Hoy cada reina tiene una sola imagen recortada (images/queens/<id>.png). Si un día hay más (otra cara u otra
// peluca), basta con apuntarlas aquí y la escena las usa; mientras no estén, cada cara se imita con una pose.
import type { Cara } from "../../../core/montaje";
import { queenOf } from "../queens";

/** Imágenes extra de cada cara, por reina. Ejemplo: "the-macarena": { grito: "images/queens/caras/the-macarena_grito.png" } */
export const CARAS: Record<string, Partial<Record<Cara, string>>> = {};
/** Imagen del «reveal» (otro look o peluca) por reina. Ejemplo: "pupi-poisson": "images/queens/reveal/pupi-poisson.png" */
export const REVEALS: Record<string, string> = {};
/** El jurado para los cortes de reacción. */
export const JURADO = [
  { key: "jurado-supremme", src: "images/hosts/supreme.png", name: "Supremme de Luxe" },
  { key: "jurado-ana", src: "images/hosts/ana-locking.png", name: "Ana Locking" },
  { key: "jurado-ambrossi", src: "images/hosts/javier-ambrossi.png", name: "Javier Ambrossi" },
  { key: "jurado-calvo", src: "images/hosts/javier-calvo.png", name: "Javier Calvo" },
];

export const caraKey = (id: string, c: Cara) => `q-${id}-${c}`;
export const revealKey = (id: string) => `q-${id}-reveal`;

/** Carga lo que haya para estas reinas (y el jurado) en el preload de la escena. */
export function loadPlayback(scene: { load: any; textures: any }, ids: string[]) {
  const add = (key: string, src: string) => { if (!scene.textures.exists(key)) scene.load.image(key, src); };
  ids.forEach((id) => {
    Object.entries(CARAS[id] || {}).forEach(([c, src]) => src && add(caraKey(id, c as Cara), src));
    if (REVEALS[id]) add(revealKey(id), REVEALS[id]);
  });
  JURADO.forEach((j) => add(j.key, j.src));
}
export const nombreDe = (id: string) => queenOf(id).name;
