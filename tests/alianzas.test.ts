import { describe, it, expect } from "vitest";
import { repartirBrackets, clasificacion, complemento, formarAlianzas, notaEnPareja, ayudaAliada, rompe, HUNDIDA } from "../src/core/alianzas";
import { bracketsCast, desbloqueo, seasonById } from "../src/core/temporada";
import { makeRng } from "../src/core";

describe("All Stars por brackets y alianzas", () => {
  it("reparte en tres brackets casi iguales y la primera clave va al primero", () => {
    const keys = Array.from({ length: 17 }, (_, i) => "q" + i);
    const g = repartirBrackets(keys, makeRng(4), "q5");
    expect(g.map((x) => x.length)).toEqual([6, 6, 5]);
    expect(g[0][0]).toBe("q5");
    expect(new Set(g.flat()).size).toBe(17);
  });
  it("clasifica por puntos (WIN 10, TOP2 9, HIGH 8, SAFE 5, LOW 2) y desempata por victorias", () => {
    const T: Record<string, Record<number, string>> = { a: { 1: "WIN", 2: "LOW", 3: "SAFE" }, b: { 1: "TOP2", 2: "HIGH", 3: "LOW" }, c: { 1: "SAFE", 2: "SAFE", 3: "SAFE" } };
    const cl = clasificacion(["a", "b", "c"], (k) => T[k], [1, 2, 3], () => 0.5);
    expect(cl.map((x) => [x.k, x.p])).toEqual([["b", 19], ["a", 17], ["c", 15]]);
  });
  it("las alianzas buscan complementarse y se valoran en pareja, salvo que una hunda a la otra", () => {
    const at: Record<string, Record<string, number>> = { a: { x: 9, y: 2 }, b: { x: 2, y: 9 }, c: { x: 9, y: 3 }, d: { x: 3, y: 8 } };
    expect(complemento(at.a, at.b)).toBeGreaterThan(complemento(at.a, at.c));
    const al = formarAlianzas(["a", "b", "c", "d"], (p, q) => complemento(at[p], at[q]));
    expect(al).toContainEqual(["a", "b"]);
    // Se juntan las notas...
    const r = notaEnPareja(80, 70);
    expect(r.separadas).toBe(false);
    expect(Math.abs(r.a - r.b)).toBeLessThan(10);
    // ...pero si una hunde a la otra, cada una con la suya
    expect(notaEnPareja(85, 85 - HUNDIDA - 1)).toEqual({ a: 85, b: 85 - HUNDIDA - 1, separadas: true });
    expect(ayudaAliada(4, 8)).toBe(5);
    expect(ayudaAliada(8, 4)).toBe(0);
    // Las fijas se respetan; si son impares, una va sola
    expect(formarAlianzas(["a", "b", "c"], () => 0, [["a", "c"]])).toEqual([["a", "c"], ["b"]]);
  });
  it("una reina rompe más si su aliada quedó mal y ella bien", () => {
    const n = (o: object) => Array.from({ length: 2000 }, (_, i) => rompe({ suya: undefined, deEllaAntes: undefined, rel: 0, rnd: makeRng(i + 1), ...o })).filter(Boolean).length;
    expect(n({ suya: "LOW", deEllaAntes: "WIN" })).toBeGreaterThan(n({ suya: "WIN", deEllaAntes: "LOW" }) * 2);
  });
  it("la temporada: reparto múltiplo de tres (de 15 a 18), sin ganadoras, se abre ganando un All Stars", () => {
    const c = bracketsCast();
    expect(c.length % 3).toBe(0);
    expect(c.length).toBeGreaterThanOrEqual(15);
    expect(new Set(c).size).toBe(c.length);
    expect(seasonById("esbr")?.cast).toEqual(c);
    expect(desbloqueo("esbr", ["es1"]).ok).toBe(false);
    expect(desbloqueo("esbr", ["esas2"]).ok).toBe(true);
  });
});
