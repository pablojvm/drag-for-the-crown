import { describe, it, expect } from "vitest";
import { walkPoints, momentPoints, voicePoints, runwayScore, revealSucceeds } from "../src/core/runway";

describe("pasarela", () => {
  it("acertar el paso con el look puntúa mucho más", () => {
    expect(walkPoints("flotado", "Glamour")).toBe(92);
    expect(walkPoints("fuerte", "Glamour")).toBe(52);
    expect(walkPoints("flotado", "Glamour", 5)).toBe(100);
  });
  it("el momento final depende de la categoría y el look", () => {
    expect(momentPoints({ moment: "pose", cat: "Realeza", look: "Glamour" })).toBe(82);
    expect(momentPoints({ moment: "pose", cat: "Reveal sorpresa", look: "Glamour" })).toBe(35);
    expect(momentPoints({ moment: "comedia", cat: "Años 80", look: "Camp" })).toBe(94);
    expect(momentPoints({ moment: "reveal", cat: "Realeza", look: "Glamour", revealOk: false })).toBe(15);
  });
  it("voz en off y nota final", () => {
    expect(voicePoints("buena")).toBe(96);
    expect(runwayScore([92, 82, 96])).toBeCloseTo(90, 0);
    expect(revealSucceeds({ performance: 10, carisma: 10, roll: 0.5 })).toBe(true);
  });
});
