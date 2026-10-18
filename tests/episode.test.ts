import { describe, it, expect } from "vitest";
import { canGo, go, type Fase } from "../src/core/episode";

const run = (path: Fase[]) => {
  const h: { flow?: Fase | null; flowErr?: string[] } = {};
  path.forEach((f) => go(h, f));
  return h.flowErr || [];
};

describe("flujo del episodio", () => {
  it("episodio normal con pasarela", () => {
    expect(run(["inicio", "minirreto", "taller", "reto", "pasarela", "llamada", "criticas", "untucked", "veredicto", "lipsync", "fin"])).toEqual([]);
  });
  it("reto sin pasarela aparte (Lalaparuza, Ball...)", () => {
    expect(run(["inicio", "minirreto", "taller", "reto", "llamada", "criticas", "untucked", "veredicto", "lipsync", "fin", "inicio"])).toEqual([]);
  });
  it("maestra de ceremonias en la Segunda Oportunidrag", () => {
    expect(run(["inicio", "minirreto", "taller", "mc", "lipsync", "fin"])).toEqual([]);
  });
  it("no se puede ir al veredicto sin críticas ni Untucked", () => {
    expect(canGo("llamada", "veredicto")).toBe(false);
    expect(canGo("criticas", "veredicto")).toBe(false);
    expect(run(["inicio", "minirreto", "taller", "reto", "llamada", "veredicto"])).toEqual(["llamada → veredicto"]);
  });
  it("reencuentro y gran final van de inicio a fin", () => {
    expect(run(["inicio", "fin"])).toEqual([]);
  });
  it("no se salta el minirreto ni el taller", () => {
    expect(canGo("inicio", "reto")).toBe(false);
    expect(canGo("minirreto", "reto")).toBe(false);
  });
  it("repetir la misma fase al reanudar no cuenta como error", () => {
    expect(run(["inicio", "minirreto", "minirreto", "taller"])).toEqual([]);
  });
});
