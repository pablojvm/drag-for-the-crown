import { describe, it, expect } from "vitest";
import { allWinnersCut, allWinnersTier, lalaScore } from "../src/core/finales";

describe("finales", () => {
  it("All Winners: corte limpio por estrellas", () => {
    const st: Record<string, number> = { a: 5, b: 4, c: 3, d: 2, e: 1 };
    const c = allWinnersCut(["a", "b", "c", "d", "e"], (k) => st[k]);
    expect(c.tie).toBe(false);
    expect(c.direct).toEqual(["a", "b", "c", "d"]);
  });
  it("All Winners: empate en el corte, decide la que más estrellas tiene", () => {
    const st: Record<string, number> = { a: 6, b: 3, c: 2, d: 2, e: 2 };
    const c = allWinnersCut(["a", "b", "c", "d", "e"], (k) => st[k]);
    expect(c.tie).toBe(true);
    expect(c.sure).toEqual(["a", "b"]);
    expect(c.tied).toEqual(["c", "d", "e"]);
    expect(c.need).toBe(2);
    expect(c.chooser).toBe("a");
  });
  it("tramos de puestos", () => {
    expect(allWinnersTier(4, 5)).toBe("5º/9º");
    expect(allWinnersTier(4, 1)).toBe("5º");
  });
  it("Lalaparuza: la campeona 95, la que cae en la primera ronda abajo", () => {
    expect(lalaScore({ reached: 4, R: 3, champ: true, top2: false })).toBe(95);
    expect(lalaScore({ reached: 1, R: 3, champ: false, top2: false })).toBe(57);
    expect(lalaScore({ reached: 1, R: 3, champ: false, top2: false, tweak: 10 })).toBe(61);
  });
});
