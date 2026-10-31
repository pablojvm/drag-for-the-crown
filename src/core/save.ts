// Partida guardada del modo historia: versión del formato y migraciones.
// Cada vez que cambie la forma de la partida, se sube SAVE_VERSION y se añade la migración de la versión anterior,
// así las partidas guardadas con versiones viejas del juego siguen cargando.
export const SAVE_VERSION = 4;

export type Save = { v: number; [k: string]: unknown };

const MIGRATIONS: Record<number, (d: Save) => Save> = {
  // v2 → v3: mismos campos; los nuevos se rellenan al cargar
  2: (d) => ({ ...d, v: 3 }),
  // v3 → v4: se asegura que existan los contenedores básicos (antes podían faltar en partidas muy viejas)
  3: (d) => ({ ...d, flags: (d.flags as object) || {}, track: (d.track as object) || {}, epNames: (d.epNames as object) || {}, log: Array.isArray(d.log) ? d.log : [], v: 4 }),
};

/** Lleva una partida guardada a la versión actual. Devuelve null si no se puede cargar. */
export function migrateSave(raw: unknown): Save | null {
  if (!raw || typeof raw !== "object") return null;
  let d = raw as Save;
  if (typeof d.v !== "number" || d.v < 2) return null;
  while (d.v < SAVE_VERSION) {
    const m = MIGRATIONS[d.v];
    if (!m) return null;
    d = m(d);
  }
  return d;
}
