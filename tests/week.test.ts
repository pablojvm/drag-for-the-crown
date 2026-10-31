import { describe, it, expect } from "vitest";
import { weekLabels, bottomSize, previousRank, allCritiqued } from "../src/core/week";

const rows = (n: number) => Array.from({ length: n }, (_, i) => ({ key: "q" + i }));
const keys = (n: number) => rows(n).map((r) => r.key);

describe("resultados de la semana", () => {
  it("temporada normal con 10: ganadora, dos altas, bajas y bottom de dos", () => {
    const nb = bottomSize({ twist: "normal", n: 10 });
    const L = weekLabels(rows(10), { twist: "normal", nb, bottom: keys(10).slice(8) });
    expect(L).toEqual(["WIN", "HIGH", "HIGH", "SAFE", "SAFE", "SAFE", "SAFE", "LOW", "BTM2", "BTM2"]);
  });
  it("con 7 o menos solo una alta", () => {
    const L = weekLabels(rows(7), { twist: "normal", nb: 2, bottom: ["q5", "q6"] });
    expect(L).toEqual(["WIN", "HIGH", "SAFE", "SAFE", "LOW", "BTM2", "BTM2"]);
  });
  it("All Stars: top 2 en vez de ganadora", () => {
    const L = weekLabels(rows(8), { twist: "allstars", nb: 2, bottom: ["q6", "q7"] });
    expect(L.slice(0, 3)).toEqual(["TOP2", "TOP2", "HIGH"]);
    expect(L.slice(-2)).toEqual(["BTM2", "BTM2"]);
  });
  it("moneda: bottom de tres con seis o más", () => {
    expect(bottomSize({ twist: "moneda", n: 6 })).toBe(3);
    expect(bottomSize({ twist: "moneda", n: 5 })).toBe(2);
  });
  it("Segunda Oportunidrag: bottom de tres esa semana", () => {
    expect(bottomSize({ twist: "repesca", n: 7, repescaWeek: true })).toBe(3);
  });
  it("All Winners: sin bottom, dos altas tras el top 2 y la bloqueada sin estrella", () => {
    const nb = bottomSize({ twist: "winners", n: 8 });
    expect(nb).toBe(0);
    const L = weekLabels(rows(8), { twist: "winners", nb, bottom: [], blocked: "q1" });
    expect(L).toEqual(["TOP2", "BTOP", "HIGH", "HIGH", "SAFE", "SAFE", "SAFE", "SAFE"]);
  });
  it("por grupos: el último grupo es LOW y el bottom sale de él", () => {
    const r = rows(6).map((x, i) => ({ ...x, group: Math.floor(i / 2) }));
    const nb = bottomSize({ twist: "normal", n: 6, lastGroupSize: 2 });
    const L = weekLabels(r, { twist: "normal", nb, bottom: ["q4", "q5"], nGroups: 3 });
    expect(L).toEqual(["WIN", "HIGH", "SAFE", "SAFE", "BTM2", "BTM2"]);
  });
  it("salvada del bottom: conserva la etiqueta de bottom", () => {
    const r = rows(8).map((x) => (x.key === "q5" ? { ...x, protected: true } : x));
    const L = weekLabels(r, { twist: "suerte", nb: 2, bottom: ["q6", "q7"] });
    expect(L[5]).toBe("BTM2");
  });
  it("con seis o menos todas reciben críticas, salvo en All Winners", () => {
    expect(allCritiqued(6, "normal")).toBe(true);
    expect(allCritiqued(6, "winners")).toBe(false);
  });
  it("capitanas: la ganadora del capítulo anterior primero", () => {
    const labs: Record<string, string> = { a: "SAFE", b: "WIN", c: "BTM2", d: "HIGH" };
    expect(previousRank(["a", "b", "c", "d"], (k) => labs[k], () => 0)).toEqual(["b", "d", "a", "c"]);
    expect(previousRank(["a"], () => undefined)).toBeNull();
  });
});
