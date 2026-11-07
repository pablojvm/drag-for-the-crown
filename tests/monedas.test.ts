import { describe, it, expect } from "vitest";
import { cantidad, costeMejora, puedeMejorar, conMejoras, MEJORA } from "../src/core/monedas";

describe("monedas", () => {
  it("nombra cada moneda", () => {
    expect(cantidad(12000)).toBe("12.000 rudollars");
    expect(cantidad(1, "mp")).toBe("1 lipstick");
    expect(cantidad(30, "mp")).toBe("30 lipsticks");
  });
  it("mejoras: suben de precio y tienen tope", () => {
    expect(costeMejora(1, 6)).toBeGreaterThan(costeMejora(0, 6));
    expect(puedeMejorar(MEJORA.max, 5)).toBe(false);
    expect(puedeMejorar(0, 10)).toBe(false);
    expect(conMejoras({ carisma: 9, estilo: 4 }, { carisma: 2, estilo: 1 })).toEqual({ carisma: 10, estilo: 5 });
  });
});
