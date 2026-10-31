import { describe, it, expect } from "vitest";
import { startLipSync, lipSyncMove } from "../src/next/game/lipsync";
import { store } from "../src/next/store";

describe("lip sync del motor nuevo", () => {
  it("seis movimientos y se acaba; la energía baja y el público sube", () => {
    let r = 0.3;
    const rnd = () => (r = (r * 9301 + 49297) % 233280 / 233280);
    startLipSync("jimbo", rnd);
    const kinds = ["Cara", "Escenario", "Cara", "Escenario", "Emote", "Cara"] as const;
    kinds.forEach((k) => lipSyncMove(k, rnd));
    const ls = store.getState().ls!;
    expect(ls.step).toBe(6);
    expect(ls.done).toBe(true);
    expect(ls.energy).toBeLessThan(100);
    expect(ls.mine).toBeGreaterThan(0);
    // Ya terminado, no cuenta más
    lipSyncMove("Cara", rnd);
    expect(store.getState().ls!.step).toBe(6);
  });
});
