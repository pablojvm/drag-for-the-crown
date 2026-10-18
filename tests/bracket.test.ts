import { describe, it, expect } from "vitest";
import { seedOrder, buildBracket } from "../src/core";

describe("cuadro de la Lalaparuza", () => {
  it("orden de cabezas de serie clásico", () => {
    expect(seedOrder(8)).toEqual([1, 8, 4, 5, 2, 7, 3, 6]);
    expect(seedOrder(4)).toEqual([1, 4, 2, 3]);
  });
  it("con 8 reinas no hay ronda previa y la 1 y la 2 van en lados distintos", () => {
    const b = buildBracket(["a", "b", "c", "d", "e", "f", "g", "h"]);
    expect(b.pre).toHaveLength(0);
    expect(b.slots.indexOf("a") < 4).not.toBe(b.slots.indexOf("b") < 4);
  });
  it("con 9 reinas, solo las dos peores del minirreto van a la previa y la ganadora se cruza con la 1", () => {
    const q = ["1", "2", "3", "4", "5", "6", "7", "8", "9"];
    const b = buildBracket(q);
    expect(b.P).toBe(8);
    expect(b.pre).toHaveLength(1);
    expect([b.pre[0].a, b.pre[0].b].sort()).toEqual(["8", "9"]);
    const pos1 = b.slots.indexOf("1");
    expect(Math.floor(pos1 / 2)).toBe(Math.floor(b.pre[0].slot / 2));
  });
  it("con 10 reinas hay dos duelos previos con las cuatro peores", () => {
    const b = buildBracket(Array.from({ length: 10 }, (_, i) => String(i + 1)));
    expect(b.pre.flatMap((m) => [m.a, m.b]).sort()).toEqual(["10", "7", "8", "9"]);
    expect(b.slots.filter((x) => x === null)).toHaveLength(2);
  });
  it("nadie se queda fuera ni sale dos veces", () => {
    for (let n = 2; n <= 16; n++) {
      const q = Array.from({ length: n }, (_, i) => i);
      const b = buildBracket(q);
      const all = [...b.slots.filter((x) => x !== null), ...b.pre.flatMap((m) => [m.a, m.b])];
      expect(all.sort((x, y) => (x as number) - (y as number))).toEqual(q);
    }
  });
});
