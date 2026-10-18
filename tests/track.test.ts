import { describe, it, expect } from "vitest";
import { ppe, storyRank, storyMetrics } from "../src/core";

describe("track record", () => {
  it("PPE es la media de puntos por episodio", () => {
    expect(ppe(["WIN", "SAFE", "BTM2"])).toBe(3);
    expect(ppe(["RTRN", "MC", "WIN"])).toBe(5);
    expect(ppe([])).toBe(0);
  });
  it("el Hall of Fame ordena por PPE, luego wins, luego corona", () => {
    const a = { ppe: 3.5, winsT: 2, score: 10 }, b = { ppe: 3.5, winsT: 3, score: 5 }, c = { ppe: 4, winsT: 0, score: 1 };
    expect([a, b, c].sort(storyRank)).toEqual([c, b, a]);
  });
  it("lee las partidas antiguas de la tabla guardada", () => {
    const track = '<tr class="me"><td>WIN</td><td>>WIN<</td><td class="ppe">4.25</td></tr>';
    expect(storyMetrics({ score: 0, track }).ppe).toBe(4.25);
  });
});
