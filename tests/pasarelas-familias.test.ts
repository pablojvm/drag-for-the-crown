import { describe, it, expect } from "vitest";
import { makePlan } from "../src/mp/model";
import { TEMAS_PASARELA, familiaPasarela } from "../src/core/temas";

describe("plan del multijugador", () => {
  it("no repite reto ni pone dos pasarelas de la misma familia", () => {
    const retos = ["a", "b", "c", "d", "e", "f", "g", "h", "i"].map((tipo) => ({ tipo, titulo: tipo, desc: "", noRunway: false }));
    const cats = TEMAS_PASARELA.filter((t) => !t.rv).map((t) => ({ n: t.n, d: t.d }));
    for (let seed = 1; seed < 200; seed++) {
      let x = seed;
      const rnd = () => ((x = (x * 9301 + 49297) % 233280) / 233280);
      const plan = makePlan(9, { retos: () => retos, categorias: () => cats, rnd });
      expect(new Set(plan.map((p) => p.tipo)).size).toBe(9);
      const fams = plan.map((p) => familiaPasarela(p.cat!.n));
      expect(new Set(fams).size).toBe(fams.length);
    }
  });
});

describe("familias de pasarelas", () => {
  it("cada pasarela está como mucho en una familia y todas existen", async () => {
    const { FAMILIAS_PASARELA } = await import("../src/core/temas");
    const all = Object.values(FAMILIAS_PASARELA).flat();
    expect(all.filter((x, i) => all.indexOf(x) !== i)).toEqual([]);
  });
  it("las pasarelas del programa tienen prendas que encajan", async () => {
    const { ARMARIO, fitScore } = await import("../src/core/armario");
    for (const t of TEMAS_PASARELA.filter((x) => x.id.startsWith("R"))) {
      const looks = ARMARIO.look.filter((it: any) => !!it.rv === !!t.rv && fitScore("look", it, t.n) >= 0.6).length;
      expect(looks, t.n).toBeGreaterThanOrEqual(8);
    }
  });
});
