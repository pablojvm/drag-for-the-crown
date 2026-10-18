// Track record: valor de cada etiqueta y PPE (puntos por episodio)
export const PPE_VALOR: Record<string, number> = { WIN: 5, WINNER: 5, TOP2: 4.5, HIGH: 4, SAFE: 3, LOW: 2, BTM2: 1, BTM3: 1, ELIM: 0 };

export function ppe(labels: string[]): number {
  const v = labels.map((l) => PPE_VALOR[l]).filter((x): x is number => x !== undefined);
  return v.length ? Math.round((v.reduce((a, b) => a + b, 0) / v.length) * 100) / 100 : 0;
}

export interface BoardEntry { ppe?: number | null; winsT?: number | null; wins?: number; won?: boolean; score: number; track?: string }

/** Métricas de una entrada del Hall of Fame (las partidas antiguas se leen de la tabla guardada). */
export function storyMetrics(e: BoardEntry): { ppe: number; wins: number } {
  if (e.ppe != null) return { ppe: e.ppe, wins: e.winsT != null ? e.winsT : e.wins || 0 };
  const m = /<tr class="me[^"]*"[\s\S]*?<\/tr>/.exec(e.track || "");
  const row = m ? m[0] : "";
  const p = parseFloat((/<td class="ppe">([\d.]+)<\/td>/.exec(row) || [])[1]) || 0;
  const wins = (row.match(/>WIN</g) || []).length || e.wins || 0;
  return { ppe: p, wins };
}
/** Orden del Hall of Fame: PPE, luego wins, luego corona, luego puntos. */
export function storyRank(a: BoardEntry, b: BoardEntry): number {
  const A = storyMetrics(a), B = storyMetrics(b);
  return B.ppe - A.ppe || B.wins - A.wins || (b.won ? 1 : 0) - (a.won ? 1 : 0) || b.score - a.score;
}
