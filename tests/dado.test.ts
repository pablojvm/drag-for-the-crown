import { describe, it, expect } from "vitest";
import { dadoProbs, tirarDado, notaDe, pasosDeJuego, makeRng, BALANCE } from "../src/core";

describe("dado", () => {
  it("las probabilidades suman 100 para cualquier atributo", () => {
    for (let a = 0; a <= 10; a += 0.5) expect(dadoProbs(a).reduce((x, y) => x + y, 0)).toBeCloseTo(100, 6);
  });
  it("más atributo, más probabilidad de brillar y menos de desastre", () => {
    const lo = dadoProbs(3), hi = dadoProbs(9);
    expect(hi[0]).toBeGreaterThan(lo[0]);
    expect(hi[4]).toBeLessThan(lo[4]);
  });
  it("con la misma semilla sale la misma tirada", () => {
    const a = makeRng(42), b = makeRng(42);
    const ta = Array.from({ length: 50 }, () => tirarDado(6, a));
    const tb = Array.from({ length: 50 }, () => tirarDado(6, b));
    expect(ta).toEqual(tb);
  });
  it("las notas caen dentro de su franja", () => {
    BALANCE.notas.forEach(([lo, hi], cat) => {
      expect(notaDe(cat, 0)).toBe(lo);
      expect(notaDe(cat, 1)).toBe(hi);
    });
    expect(notaDe(9, 0.5)).toBeLessThanOrEqual(BALANCE.notas[4][1]);
  });
  it("bordarlo sube escalones y hacerlo mal los baja", () => {
    expect(pasosDeJuego(95, () => 0.9)).toBe(1);
    expect(pasosDeJuego(95, () => 0.1)).toBe(2);
    expect(pasosDeJuego(60)).toBe(0);
    expect(pasosDeJuego(10)).toBe(-2);
  });
  it("una reina floja no gana casi nunca y una fuerte casi nunca se hunde", () => {
    const rnd = makeRng(7);
    const N = 4000;
    const weak = Array.from({ length: N }, () => tirarDado(2.5, rnd));
    const strong = Array.from({ length: N }, () => tirarDado(9.5, rnd));
    expect(weak.filter((c) => c === 0).length / N).toBeLessThan(0.06);
    expect(strong.filter((c) => c === 4).length / N).toBeLessThan(0.05);
  });
});
