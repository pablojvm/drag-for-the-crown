import { describe, it, expect } from "vitest";
import { rescueFromBottom, coinResult, lipstickKind, addHalfHearts } from "../src/core/dinamicas";

const order = ["a", "b", "c", "d", "e", "f"]; // de mejor a peor

describe("dinámicas de temporada", () => {
  it("salvar a una del bottom: entra la siguiente peor", () => {
    const r = rescueFromBottom({ order, bottom: ["e", "f"], save: "f", winner: "a" })!;
    expect(r.entered).toBe("d");
    expect(r.bottom).toEqual(["e", "d"]);
    expect(r.protectedKeys).toContain("f");
  });
  it("no entra ni la ganadora ni una ya salvada", () => {
    const r = rescueFromBottom({ order: ["a", "b", "c"], bottom: ["b", "c"], save: "c", winner: "a" });
    expect(r).toBeNull();
    const r2 = rescueFromBottom({ order, bottom: ["e", "f"], save: "e", protectedKeys: ["d"], winner: "a" })!;
    expect(r2.entered).toBe("c");
  });
  it("la moneda con cara: se salva la más votada y bailan las otras dos", () => {
    const c = coinResult({ cara: true, options: ["d", "e", "f"], picks: { a: "f", b: "f", c: "d" }, scoreOf: () => 0, breakTie: (t) => t[0] });
    expect(c.chosen).toBe("f");
    expect(c.pair).toEqual(["d", "e"]);
    expect(c.votes.f).toEqual(["a", "b"]);
  });
  it("la moneda con cruz: la condenada baila con la peor de las otras", () => {
    const sc: Record<string, number> = { d: 50, e: 40, f: 30 };
    const c = coinResult({ cara: false, options: ["d", "e", "f"], picks: { a: "d", b: "d", c: "e" }, scoreOf: (k) => sc[k], breakTie: (t) => t[0] });
    expect(c.pair).toEqual(["d", "f"]);
  });
  it("la moneda con empate: desempata quien diga breakTie", () => {
    const c = coinResult({ cara: true, options: ["d", "e", "f"], picks: { a: "d", b: "e" }, scoreOf: () => 0, breakTie: (t) => t[1] });
    expect(c.tie).toBe(true);
    expect(c.chosen).toBe("e");
  });
  it("pintalabios: semana, trayectoria o jugarreta", () => {
    const sc: Record<string, number> = { x: 40, y: 60 };
    const ppe: Record<string, number> = { x: 3, y: 2 };
    expect(lipstickKind("x", "y", (k) => sc[k], (k) => ppe[k])).toBe("semana");
    expect(lipstickKind("y", "x", (k) => sc[k], (k) => ppe[k])).toBe("trayectoria");
    expect(lipstickKind("y", "x", (k) => sc[k], () => 3)).toBe("jugarreta");
  });
  it("corazones: dos mitades hacen uno entero", () => {
    const r = addHalfHearts({ a: 1 }, [{ to: "a" }, { to: "b" }, { to: "z" }], (k) => k !== "z");
    expect(r.hearts).toEqual({ a: 2, b: 1 });
    expect(r.full).toEqual(["a"]);
  });
});
