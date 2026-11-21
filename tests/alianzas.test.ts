import { describe, it, expect } from "vitest";
import { repartirBrackets, clasificacion, complemento, formarAlianzas, notaEnPareja, ayudaAliada, rompe, HUNDIDA, mvqDe, eligeMvq, votanMvq, type Mvq } from "../src/core/alianzas";
import { weekLabels } from "../src/core/week";
import { bracketsCast, desbloqueo, seasonById, REGULARES, ALLSTARS } from "../src/core/temporada";
import { makeRng } from "../src/core";

describe("All Stars por brackets y alianzas", () => {
  it("reparte en tres brackets casi iguales y la primera clave va al primero", () => {
    const keys = Array.from({ length: 17 }, (_, i) => "q" + i);
    const g = repartirBrackets(keys, makeRng(4), "q5");
    expect(g.map((x) => x.length)).toEqual([6, 6, 5]);
    expect(g[0][0]).toBe("q5");
    expect(new Set(g.flat()).size).toBe(17);
  });
  it("clasifica como el All Stars 10: 2 al top 2, 1 más a quien gana el lip sync y los votos MVQ", () => {
    const T: Record<string, Record<number, string>> = { a: { 1: "WIN", 2: "SAFE", 3: "SAFE" }, b: { 1: "TOP2", 2: "TOP2", 3: "SAFE" }, c: { 1: "SAFE", 2: "WIN", 3: "SAFE" } };
    // Sin votos: a 3, b 4, c 3 (a y c empatan en puntos y victorias: decide el azar)
    expect(clasificacion(["a", "b", "c"], (k) => T[k], [1, 2, 3], () => 0.5)[0]).toMatchObject({ k: "b", p: 4 });
    // Con votos MVQ: c recibe tres puntos y se pone primera
    const mvq: Mvq = { 1: { x: "c", y: "c" }, 3: { a: "c", b: "a" } };
    expect(mvqDe(mvq, "c", [1, 2, 3])).toBe(3);
    expect(clasificacion(["a", "b", "c"], (k) => T[k], [1, 2, 3], () => 0.5, mvq).map((x) => [x.k, x.p])).toEqual([["c", 6], ["a", 4], ["b", 4]]);
  });
  it("las reinas votan a su aliada o a quien aprecian, nunca a sí mismas, y no a la que va primera", () => {
    const pts: Record<string, number> = { a: 9, b: 1, c: 1, d: 1 };
    const voto = (o: object) => eligeMvq({ yo: "d", cands: ["a", "b", "c", "d"], rel: () => 0, pts: (k) => pts[k], rnd: () => 0, ...o });
    expect(voto({ aliada: "c" })).toBe("c");
    expect(voto({ aliada: null, rel: (k: string) => (k === "b" ? 3 : 0) })).toBe("b");
    expect(voto({ aliada: null })).not.toBe("a");
    expect(votanMvq(["a", "b", "c", "d"], ["a", "b"])).toEqual(["c", "d"]);
  });
  it("en la fase de grupos solo hay top 2 y a salvo", () => {
    const L = weekLabels(["a", "b", "c", "d", "e", "f"].map((key) => ({ key })), { twist: "brackets", nb: 0, bottom: [] });
    expect(L).toEqual(["TOP2", "TOP2", "SAFE", "SAFE", "SAFE", "SAFE"]);
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
    // El All Stars en parejas se abre igual: ganando un All Stars
    expect(desbloqueo("espj", ["es1"]).ok).toBe(false);
    expect(desbloqueo("espj", ["esas1"]).ok).toBe(true);
  });
  it("All Winners va la última: solo se abre al ganar todas las anteriores", () => {
    const todas = [...REGULARES().map((t) => t.id), ...ALLSTARS().map((t) => t.id), "escustom", "esbr", "espj"];
    expect(desbloqueo("esaw", todas).ok).toBe(true);
    expect(desbloqueo("esaw", todas.filter((x) => x !== "espj")).ok).toBe(false);
    expect(desbloqueo("esaw", ["es1"]).ok).toBe(false);
  });
});
