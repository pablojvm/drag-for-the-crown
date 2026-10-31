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
