import { describe, it, expect } from "vitest";
import { cleanSub, type Sub } from "../src/mp/model";
import { cleanCustom } from "../src/mp/ops";

describe("lo que manda cada jugadora se limpia", () => {
  it("las notas se quedan entre 0 y 100 y lo que no es número se descarta", () => {
    expect(cleanSub({ reto: 1e9, final: -5, mini: "x" as unknown as number, walk: 72 })).toEqual({ reto: 100, final: 0, walk: 72 });
  });
  it("el lip sync, los textos y las cajas tienen tope", () => {
    const s = cleanSub({ ls: { won: 1 as unknown as boolean, score: 99999 }, jury: "a".repeat(5000), box: 3.4, ready: 1 as unknown as boolean });
    expect(s.ls).toEqual({ won: true, score: 1000 });
    expect(s.jury!.length).toBe(600);
    expect(s.box).toBe(3);
    expect(s.ready).toBe(true);
  });
  it("no se pueden colar campos que no son suyos", () => {
    const s = cleanSub({ duel: [{ tag: "x", imp: 999, msg: "" }], hack: 1 } as unknown as Sub);
    expect(s).toEqual({});
  });
  it("la partida personalizada se queda en valores razonables", () => {
    expect(cleanCustom({ pick: "trampa", size: 999, rivals: Array(100).fill(0).map((_, i) => "q" + i) })).toEqual({ pick: "azar", size: 16, rivals: expect.any(Array) });
    expect(cleanCustom({ pick: "elegidas", size: 8, rivals: Array(100).fill("a") })!.rivals).toEqual(["a"]);
    expect(cleanCustom("nada")).toBeUndefined();
  });
});

describe("firma de las partidas pausadas", () => {
  it("el texto firmado no cambia por el orden de las claves ni por los vacíos que mete la red", async () => {
    const { canon } = await import("../src/mp/ops");
    const a = { b: 1, a: { y: [1, undefined, "x"], x: undefined }, c: null };
    const b = { a: { x: null, y: [1, null, "x"] }, b: 1 };
    expect(canon(a)).toBe(canon(b));
    expect(canon({ a: 1 })).not.toBe(canon({ a: 2 }));
  });
});
