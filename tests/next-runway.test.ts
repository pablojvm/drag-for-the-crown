import { describe, it, expect } from "vitest";
import { startRunway, chooseLook, chooseWalk, chooseMoment, chooseVoice } from "../src/next/game/runway";
import { WALK_OF_TAG } from "../src/core/runway";
import { store } from "../src/next/store";

describe("pasarela del motor nuevo", () => {
  it("la pasarela perfecta: look de la categoría, su paso, pose y la buena voz en off", () => {
    startRunway("jimbo", () => 0.4);
    const rw = store.getState().rw!;
    chooseLook(rw.catTag);
    chooseWalk(WALK_OF_TAG[rw.catTag]);
    chooseMoment("pose");
    chooseVoice("buena");
    const end = store.getState().rw!;
    expect(end.step).toBe(4);
    expect(end.score).toBeGreaterThanOrEqual(80);
  });
  it("no se puede saltar pasos", () => {
    startRunway("jimbo", () => 0.4);
    chooseVoice("buena");
    expect(store.getState().rw!.step).toBe(0);
  });
});
