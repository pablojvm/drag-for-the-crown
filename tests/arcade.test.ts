import { describe, it, expect } from "vitest";
import { rivalFor, moveSpeed, fireDelay, heelDamage, startLives, hitPoints, roundBonus, rivalsOf, ROUNDS } from "../src/next/game/rules";
import { ARCADE_QUEENS } from "../src/next/game/data";

describe("arcade (motor nuevo)", () => {
  it("las rondas se ponen más difíciles y la última es la jefa", () => {
    const rv = rivalsOf("jimbo");
    const r1 = rivalFor(1, rv), r5 = rivalFor(ROUNDS, rv);
    expect(r5.boss).toBe(true);
    expect(r5.hp).toBeGreaterThan(r1.hp);
    expect(r5.fireEvery).toBeLessThan(r1.fireEvery);
    expect(rv.some((q) => q.id === "jimbo")).toBe(false);
  });
  it("las estadísticas cambian cómo juegas", () => {
    const [jimbo, , , , plastique] = ARCADE_QUEENS;
    expect(moveSpeed(plastique)).toBeGreaterThan(moveSpeed(jimbo));
    expect(fireDelay(plastique)).toBeLessThan(fireDelay(jimbo));
    expect(heelDamage(ARCADE_QUEENS[5])).toBe(3);
    expect(startLives(jimbo)).toBe(4);
  });
  it("puntos con combo hasta x8", () => {
    expect(hitPoints(1)).toBe(10);
    expect(hitPoints(20)).toBe(80);
    expect(roundBonus({ round: 2, flawless: true, lives: 3 })).toBe(2600);
  });
});
