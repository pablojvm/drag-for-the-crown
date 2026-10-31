// Dinámicas de temporada, compartidas por el modo historia y el multijugador:
// salvar a alguien del bottom (reina de la suerte, corazón), la moneda y la decisión del pintalabios.

/**
 * Salvar a una del bottom: entra la siguiente con peor nota que no sea la ganadora, no esté ya en el bottom
 * ni haya sido salvada antes. `order` va de mejor a peor. Devuelve el bottom nuevo y quién entra (o null si nadie puede).
 */
export function rescueFromBottom(o: { order: string[]; bottom: string[]; save: string; protectedKeys?: string[]; winner?: string; eligible?: (k: string) => boolean }) {
  if (!o.bottom.includes(o.save)) return null;
  const prot = new Set([...(o.protectedKeys || []), o.save]);
  const entered = o.order.slice().reverse().find((k) => !o.bottom.includes(k) && k !== o.winner && !prot.has(k) && (!o.eligible || o.eligible(k)));
  if (!entered) return null;
  return { bottom: o.bottom.map((k) => (k === o.save ? entered : k)), entered, protectedKeys: [...prot] };
}

/**
 * La moneda: con cara, las salvadas votan a quién SALVAR del bottom de tres; con cruz, a quién CONDENAR al lip sync.
 * Empate: desempata la ganadora de la semana (`breakTie`). Devuelve los votos, la elegida y las dos que van al lip sync.
 */
export function coinResult(o: { cara: boolean; options: string[]; picks: Record<string, string>; scoreOf: (k: string) => number; breakTie: (tied: string[]) => string }) {
  const votes: Record<string, string[]> = Object.fromEntries(o.options.map((k) => [k, [] as string[]]));
  Object.entries(o.picks).forEach(([voter, k]) => votes[k]?.push(voter));
  const max = Math.max(...o.options.map((k) => votes[k].length));
  const tied = o.options.filter((k) => votes[k].length === max);
  const chosen = tied.length === 1 ? tied[0] : o.breakTie(tied);
  const rest = o.options.filter((k) => k !== chosen);
  // Cara: se salva la elegida y bailan las otras dos. Cruz: la elegida baila con la peor de las otras dos
  const pair = o.cara ? rest : [chosen, rest.slice().sort((a, b) => o.scoreOf(a) - o.scoreOf(b))[0]];
  return { votes, chosen, tie: tied.length > 1, tied, pair };
}

/** Margen de PPE para considerar que una temporada es claramente mejor. */
export const PPE_MARGEN = 0.25;
/**
 * Cómo se juzga la decisión del pintalabios (All Stars): «semana» si se va la peor de esta semana; «trayectoria» si se
 * va la que lo hizo algo mejor pero lleva peor temporada; «jugarreta» si se va la mejor en todo (quitarse a una rival).
 */
export function lipstickKind<T>(go: T, stay: T, scoreOf: (k: T) => number, ppeOf: (k: T) => number): "semana" | "trayectoria" | "jugarreta" {
  if (scoreOf(go) <= scoreOf(stay)) return "semana";
  return ppeOf(go) < ppeOf(stay) - PPE_MARGEN ? "trayectoria" : "jugarreta";
}

/** Temporada del corazón: suma los medios corazones que llegan y dice quién tiene ya uno entero. */
export function addHalfHearts(hearts: Record<string, number>, gifts: { to: string }[], alive: (k: string) => boolean) {
  const out = { ...hearts };
  gifts.filter((g) => alive(g.to)).forEach((g) => (out[g.to] = (out[g.to] || 0) + 1));
  const full = Object.keys(out).filter((k) => alive(k) && out[k] >= 2);
  return { hearts: out, full };
}
