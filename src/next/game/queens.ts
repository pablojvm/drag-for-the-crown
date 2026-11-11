// Todas las reinas del motor nuevo: las del arcade y las de las temporadas (src/core/reinas.ts).
import { ARCADE_QUEENS } from "./data";
import { REINAS_ES, queenStats, baseAttrs, queenImg } from "../../core/reinas";
import { stageAttrs, type LsAttrs } from "../../core/lipsync";

export interface AnyQueen { id: string; name: string; sprite: string; ls: LsAttrs }
/** Silueta para las reinas sin foto. */
export const SILUETA = "images/drags/jimbo.png";

let seasonId: string | undefined;
/** Temporada en juego: algunas reinas tienen un look propio en ella. */
export const setLookSeason = (id?: string) => { seasonId = id; };

export function queenOf(id: string): AnyQueen {
  const a = ARCADE_QUEENS.find((q) => q.id === id);
  if (a) return { id, name: a.name, sprite: a.sprite, ls: { lipsync: a.stats.speed * 2, baile: a.stats.speed * 2, carisma: Math.min(10, a.stats.lives * 2), costura: a.stats.power * 2, moda: a.stats.power * 2 } };
  const at = baseAttrs(id, queenStats(id));
  return { id, name: REINAS_ES[id]?.name || id, sprite: queenImg(id, seasonId) || SILUETA, ls: stageAttrs(at) };
}
/** Carga en una escena las reinas que todavía no tiene. */
export function loadQueens(scene: { load: any; textures: any }, ids: (string | undefined | null)[]) {
  ids.forEach((id) => { if (id && !scene.textures.exists(`q-${id}`)) scene.load.image(`q-${id}`, queenOf(id).sprite); });
}
