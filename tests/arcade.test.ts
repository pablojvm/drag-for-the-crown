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

import { powerupType, SPECIAL_PER_HIT, POWER_MS } from "../src/next/game/rules";
describe("arcade: poderes y power-ups", () => {
  it("la barra del poder se llena con 10 aciertos", () => expect(Math.round(1 / SPECIAL_PER_HIT)).toBe(10));
  it("con las vidas al máximo solo cae el doble tacón", () => {
    expect(powerupType(5, 0.1)).toBe("double");
    expect(powerupType(2, 0.1)).toBe("life");
    expect(powerupType(2, 0.9)).toBe("double");
  });
  it("cada reina tiene su poder y los que duran tienen tiempo", () => {
    ARCADE_QUEENS.forEach((q) => expect(POWER_MS[q.power.id]).toBeDefined());
    expect(POWER_MS.shield).toBe(5000);
  });
});
