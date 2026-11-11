import { describe, it, expect } from "vitest";
import { lsMove, checkChance, rivalStrength, REPITE } from "../src/core/lipsync";

const attrs = { lipsync: 7, baile: 7, carisma: 6, costura: 5, moda: 5 };

describe("lip sync", () => {
  it("el truco en el clímax con éxito es lo que más conecta", () => {
    const m = lsMove({ kind: "Emote", emote: 1, clim: true, energy: 100, lastTag: "", attrs, roll: 0 });
    expect(m.ok).toBe(true);
    expect(m.imp).toBe(76);
    expect(m.energy).toBe(55);
  });
  it("sin energía el truco se queda a medias", () => {
    expect(lsMove({ kind: "Emote", emote: 0, clim: true, energy: 30, lastTag: "", attrs, roll: 0 }).imp).toBe(4);
  });
  it("repetir movimiento aburre", () => {
    const a = lsMove({ kind: "Cara", emote: 0, clim: false, energy: 100, lastTag: "", attrs, roll: 0 });
    const b = lsMove({ kind: "Cara", emote: 0, clim: false, energy: 100, lastTag: "Cara", attrs, roll: 0 });
    expect(b.imp).toBeCloseTo(a.imp * REPITE, 0);
  });
  it("probabilidad acotada y rival más fuerte con mejores atributos", () => {
    expect(checkChance(1, 90)).toBe(0.08);
    expect(checkChance(10, 10)).toBe(0.95);
    expect(rivalStrength({ lipsync: 9, baile: 9, carisma: 9, costura: 5, moda: 5 }, { noise: 0 })).toBeGreaterThan(rivalStrength({ lipsync: 3, baile: 3, carisma: 3, costura: 5, moda: 5 }, { noise: 0 }));
  });
});
