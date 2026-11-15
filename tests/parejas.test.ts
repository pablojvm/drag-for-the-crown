import { describe, it, expect } from "vitest";
import { parejasAlDia, parejasSiguen, ultimoGrupoParejas, dobleToca, dobleGanadora, quimica } from "../src/core/parejas";
import { parejasCast, bracketsCast, desbloqueo, seasonById } from "../src/core/temporada";
import { makeRng } from "../src/core";

describe("All Stars por parejas", () => {
  it("forma parejas de dos y, al irse alguien, junta a las que se quedan solas", () => {
    const r = makeRng(3);
    const all = ["a", "b", "c", "d", "e", "f", "g", "h"];
    const { parejas } = parejasAlDia(undefined, all, r);
    expect(parejas).toHaveLength(4);
    expect(parejas.every((p) => p.k.length === 2)).toBe(true);
    expect(new Set(parejas.map((p) => p.name)).size).toBe(4);
    // Se van una de la primera y una de la segunda: las dos solas forman pareja nueva
    const gone = [parejas[0].k[0], parejas[1].k[0]];
    const next = parejasAlDia(parejas, all.filter((k) => !gone.includes(k)), r);
    expect(next.parejas).toHaveLength(3);
    expect(next.nuevas).toEqual([[parejas[0].k[1], parejas[1].k[1]]]);
    // Las demás no cambian
    expect(next.parejas.slice(1).map((p) => p.k)).toEqual(parejas.slice(2).map((p) => p.k));
  });
  it("con una sola en la peor «pareja», el bottom es ella y la peor de la pareja anterior; con 4 se acaban", () => {
    expect(ultimoGrupoParejas(1)).toBeUndefined();
    expect(ultimoGrupoParejas(2)).toBe(2);
    expect(parejasSiguen(5)).toBe(true);
    expect(parejasSiguen(4)).toBe(false);
  });
  it("la doble eliminación es una vez, con parejas completas, y con 7 o menos toca seguro", () => {
    const r = () => 0.99;
    expect(dobleToca({ ep: 2, n: 10, ultimas: [2, 2], rnd: () => 0 })).toBe(false);
    expect(dobleToca({ ep: 4, n: 7, ultimas: [2, 1], rnd: r })).toBe(false);
    expect(dobleToca({ ep: 4, n: 7, ultimas: [2, 2], rnd: r })).toBe(true);
    expect(dobleToca({ ep: 4, n: 7, hecha: 3, ultimas: [2, 2], rnd: r })).toBe(false);
    expect(dobleToca({ ep: 3, n: 9, hecha: 3, ultimas: [2, 1], rnd: r })).toBe(true);
  });
  it("gana la pareja con más duelos; si empatan, la que suma más", () => {
    expect(dobleGanadora(["a", "b"], ["c", "d"], [{ w: "a" }, { w: "b" }], () => 0)).toBe("a");
    expect(dobleGanadora(["a", "b"], ["c", "d"], [{ w: "a" }, { w: "d" }], (k) => (k === "c" ? 90 : 40))).toBe("b");
    expect(quimica(["x", "y"])).toBe(quimica(["y", "x"]));
  });
  it("la temporada: reparto par de finalistas sin corona, se abre ganando un All Stars", () => {
    const c = parejasCast();
    expect(c.length % 2).toBe(0);
    expect(c.length).toBeGreaterThanOrEqual(8);
    expect(seasonById("espar")?.cast).toEqual(c);
    expect(desbloqueo("espar", ["es1"]).ok).toBe(false);
    expect(desbloqueo("espar", ["esas1"]).ok).toBe(true);
  });
  it("All Stars por brackets: reparto múltiplo de tres (de 15 a 18), sin ganadoras y sin repetir", () => {
    const c = bracketsCast();
    expect(c.length % 3).toBe(0);
    expect(c.length).toBeGreaterThanOrEqual(15);
    expect(new Set(c).size).toBe(c.length);
    expect(seasonById("esbr")?.cast).toEqual(c);
    expect(desbloqueo("esbr", ["esas2"]).ok).toBe(true);
  });
});
