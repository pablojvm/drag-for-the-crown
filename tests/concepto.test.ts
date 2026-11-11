import { describe, it, expect } from "vitest";
import { parseMoments, parseVerdict, conceptScore, anaBonus, momentsPrompt, judgePrompt, MOMENT_DEFAULTS, REVEAL_OPT } from "../src/core/concepto";
import { cleanLine, parseJSON } from "../src/core/guion";
import { TEMAS_PASARELA, temaDe } from "../src/core/temas";
import { TAGS } from "../src/core/runway";

const id = <T,>(a: T[]) => a;

describe("pasarela con concepto (núcleo)", () => {
  it("sin respuesta: momentos de siempre, sin pregunta de Ana y nota media", () => {
    const m = parseMoments(null, { clean: cleanLine, shuffle: id });
    expect(m.qa).toBeNull();
    expect(m.moments[0].opts).toEqual(MOMENT_DEFAULTS.entrada);
    const v = parseVerdict(null);
    expect([v.concepto, v.coherencia, v.desfile, v.ok]).toEqual([55, 55, 55, false]);
  });
  it("el reveal solo se ofrece en el momento final", () => {
    const m = parseMoments({ entrada: ["a", "b", "c", "d"] }, { clean: cleanLine, shuffle: id, reveal: true });
    expect(m.moments[0].opts).toEqual(["A", "B", "C"]);
    expect(m.moments[2].opts.at(-1)).toBe(REVEAL_OPT);
  });
  it("las respuestas pueden llegar como objetos y las notas se acotan", () => {
    const v = parseVerdict({ concepto: "140", coherencia: -3, desfile: "x", supreme: { t: "Bien" } });
    expect([v.concepto, v.coherencia, v.desfile, v.supreme]).toEqual([100, 0, 55, "Bien"]);
  });
  it("la nota sigue la fórmula del modo historia", () => {
    const v = { concepto: 80, coherencia: 70, desfile: 60 };
    expect(conceptScore({ v, moda: 5, carisma: 5, cat: "x" })).toBe(71);
    expect(conceptScore({ v, moda: 5, carisma: 5, cat: "Érase una vez… mi reveal", reveal: true, ana: anaBonus("buena") })).toBe(83);
    expect(anaBonus("mala")).toBe(-6);
    expect(anaBonus("regular")).toBe(0);
  });
  it("las instrucciones llevan la categoría, el concepto y el desfile", () => {
    const c = { cat: "Sangre Azul", theme: "Realeza a tu manera.", pieces: ["corona"] };
    expect(momentsPrompt({ ...c, concept: "reina destronada" }).user).toContain("«reina destronada»");
    const j = judgePrompt({ ...c, concept: "x", picks: ["entrada: a"], reveal: true, anaAnswer: "Ana le preguntó." });
    expect(j.user).toContain("Hace un reveal.");
    expect(j.user).toContain("Ana le preguntó.");
  });
  it("limpieza de textos y JSON", () => {
    expect(cleanLine("«Supremme: hola — reina»")).toBe("Hola, reina");
    expect(parseJSON('texto {"a":1} más')).toEqual({ a: 1 });
    expect(parseJSON("nada")).toBeNull();
  });
  it("temáticas con estilo válido y una de reveal", () => {
    expect(TEMAS_PASARELA.every((t) => (TAGS as readonly string[]).includes(t.tag))).toBe(true);
    expect(TEMAS_PASARELA.filter((t) => t.rv).length).toBe(1);
    expect(temaDe("Sangre Azul")?.tag).toBe("Glamour");
  });
});
