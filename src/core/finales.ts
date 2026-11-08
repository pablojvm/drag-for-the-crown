// Reglas de las finales y del torneo, compartidas por el modo historia y el multijugador.

/**
 * All Winners: a la final van las 4 con más estrellas. Si hay empate en el corte, decide la que más estrellas tiene
 * (`chooser`), que elige `need` reinas entre las empatadas (`tied`). `sure` ya están dentro.
 */
export function allWinnersCut(ranked: string[], stars: (k: string) => number, top = 4) {
  const TOP = Math.min(top, ranked.length);
  const stars4 = ranked.length > TOP ? stars(ranked[TOP - 1]) : -1;
  const sure = ranked.filter((k) => stars(k) > stars4).slice(0, TOP);
  const tied = ranked.filter((k) => stars(k) === stars4);
  const tie = stars4 >= 0 && sure.length < TOP && tied.length > TOP - sure.length;
  // Sin empate en el corte, pasan las TOP primeras
  return { TOP, stars4, sure, tied, tie, need: TOP - sure.length, chooser: ranked[0], direct: ranked.slice(0, TOP) };
}

/** Puestos por tramos de la final All Winners: las de la final por su resultado y el resto empatadas en un tramo. */
export const allWinnersTier = (top: number, bottom: number) => (bottom > 1 ? `${top + 1}º/${top + bottom}º` : `${top + 1}º`);

/**
 * Lalaparuza: nota según hasta dónde llega cada una en el cuadro (la campeona arriba, las que caen pronto abajo).
 * `reached`: 0 = cae en la ronda previa, r = cae en esa ronda, R + 1 = gana. `tweak` matiza entre -4 y 4.
 */
export function lalaScore(o: { reached: number; R: number; champ: boolean; top2: boolean; tweak?: number }): number {
  const base = o.champ ? 95 : o.top2 ? 93 : 42 + (o.reached / o.R) * 46;
  const t = Math.max(-4, Math.min(4, o.tweak || 0));
  return Math.round(Math.max(0, Math.min(99, base + t)));
}

/** Formas de la gran final (se sortea una en el reencuentro). All Winners tiene la suya. */
export type FinalFmt = "torneo" | "reto" | "track" | "votan" | "cuatro" | "cadena";
export const FINALES: Record<FinalFmt, { n: string; icon: string; d: string }> = {
  torneo: { n: "Súper Lalaparuza", icon: "🏆", d: "Un torneo de lip syncs entre las finalistas: la que sobreviva a todos se lleva la corona." },
  reto: { n: "Reto final", icon: "🎤", d: "Un último reto con su pasarela. Las dos mejores se juegan la corona en un lip sync; las demás quedan terceras." },
  track: { n: "El track record manda", icon: "📊", d: "Las dos con mejor temporada van directas al lip sync por la corona. Lo que has hecho cada semana, cuenta." },
  votan: { n: "Votan las eliminadas", icon: "🗳️", d: "Semifinales de lip sync y, entre las dos que lleguen, la corona la deciden con su voto todas las eliminadas." },
  cuatro: { n: "Lip sync a cuatro", icon: "💃", d: "Todas bailan a la vez la misma canción, y de ese lip sync sale la ganadora. El jurado decide cómo quedan las demás." },
  cadena: { n: "La reina de la pista", icon: "🔥", d: "Lip syncs en cadena: la que gana se queda en la pista y espera a la siguiente. Empieza la de peor temporada; la mejor espera al final." },
};
