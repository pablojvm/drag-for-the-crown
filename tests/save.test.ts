import { describe, it, expect } from "vitest";
import { migrateSave, SAVE_VERSION } from "../src/core/save";

describe("partida guardada", () => {
  it("las partidas viejas se migran a la versión actual", () => {
    const d = migrateSave({ v: 2, queen: "q1", season: "es1" })!;
    expect(d.v).toBe(SAVE_VERSION);
    expect(d.flags).toEqual({});
    expect(d.track).toEqual({});
    expect(d.queen).toBe("q1");
  });
  it("no toca lo que ya tiene", () => {
    const d = migrateSave({ v: 3, flags: { a: 1 }, track: { me: { 1: "WIN" } } })!;
    expect(d.flags).toEqual({ a: 1 });
    expect(d.track).toEqual({ me: { 1: "WIN" } });
  });
  it("descarta lo que no es una partida", () => {
    expect(migrateSave(null)).toBeNull();
    expect(migrateSave({ v: 1 })).toBeNull();
    expect(migrateSave("hola")).toBeNull();
  });
});
