import { describe, it, expect, afterEach } from "vitest";
import { startRunway, chooseLook, chooseWalk, chooseMoment, chooseVoice, submitConcept, chooseConceptMoment, answerAna } from "../src/next/game/runway";
import { WALK_OF_TAG } from "../src/core/runway";
import { REVEAL_OPT } from "../src/core/concepto";
import { store } from "../src/next/store";

const g = globalThis as any;
const rw = () => store.getState().rw!;
afterEach(() => { delete g.__dftcNextAsk; });

/** Jurado de prueba: momentos con la pregunta de Ana y un veredicto fijo. */
const fakeJury = (verdict: any = { concepto: 90, coherencia: 85, desfile: 80, supreme: "Supremme: Me has dejado sin palabras", ana: "La construcción está muy cuidada" }) => {
  const calls: string[] = [];
  g.__dftcNextAsk = async (system: string) => {
    calls.push(system);
    if (/coreógrafa/.test(system)) return { entrada: ["a1", "a2", "a3"], detalle: ["d1", "d2", "d3"], final: ["f1", "f2", "f3"], pregunta: "por qué ese tejido", respuestas: [{ t: "Porque pesa y cae como el agua", calidad: "buena" }, { t: "Me gusta", calidad: "regular" }, { t: "No sé", calidad: "mala" }] };
    return verdict;
  };
  return calls;
};

describe("pasarela del motor nuevo", () => {
  it("la pasarela perfecta: look de la categoría, su paso, pose y la buena voz en off", () => {
    startRunway("jimbo", () => 0.4, "clasica");
    chooseLook(rw().catTag);
    chooseWalk(WALK_OF_TAG[rw().catTag]);
    chooseMoment("pose");
    chooseVoice("buena");
    expect(rw().done).toBe(true);
    expect(rw().score).toBeGreaterThanOrEqual(80);
  });
  it("no se puede saltar pasos", () => {
    startRunway("jimbo", () => 0.4, "clasica");
    chooseVoice("buena");
    expect(rw().step).toBe(0);
  });
  it("las categorías son las temáticas del modo historia, con su descripción", () => {
    startRunway("jimbo", () => 0.1, "clasica");
    expect(rw().theme.length).toBeGreaterThan(20);
  });
});

describe("pasarela con concepto", () => {
  it("concepto, tres momentos, la pregunta de Ana y el veredicto con las frases del jurado", async () => {
    const calls = fakeJury();
    startRunway("angeria", () => 0.3, "concepto");
    chooseLook(rw().catTag);
    expect(rw().step).toBe(1);
    await submitConcept("  una sirena atrapada en una red de pesca de lujo ");
    expect(rw().concept).toBe("una sirena atrapada en una red de pesca de lujo");
    expect(rw().moments.map((m) => m.k)).toEqual(["entrada", "detalle", "final"]);
    expect(rw().moments[2].opts).toContain(REVEAL_OPT);
    chooseConceptMoment(0);
    chooseConceptMoment(1);
    chooseConceptMoment(2);
    expect(rw().step).toBe(5);
    expect(rw().qa!.q).toBe("¿Por qué ese tejido?");
    const good = rw().qa!.a.findIndex((x) => x.k === "buena");
    answerAna(good);
    await new Promise((r) => setTimeout(r, 0));
    expect(rw().done).toBe(true);
    expect(rw().picks).toEqual(["entrada: A1", "detalle: D2", "final: F3"]);
    // 90·0,35 + 85·0,4 + 80·0,25 + (moda 10 − 5) + (carisma 6 − 5)·0,5 + 6 de Ana = 97
    expect(rw().score).toBe(97);
    expect(rw().lines!.supreme).toBe("Me has dejado sin palabras");
    expect(calls.length).toBe(2);
  });
  it("una mala respuesta a Ana resta", async () => {
    fakeJury({ concepto: 60, coherencia: 60, desfile: 60, supreme: "x", ana: "y" });
    startRunway("jimbo", () => 0.3, "concepto");
    chooseLook(rw().catTag);
    await submitConcept("algo");
    [0, 0, 0].forEach((j) => chooseConceptMoment(j));
    answerAna(rw().qa!.a.findIndex((x) => x.k === "mala"));
    await new Promise((r) => setTimeout(r, 0));
    // 60 + (moda 6 − 5) + (carisma 10 − 5)·0,5 − 6 = 57,5 → 58
    expect(rw().score).toBe(58);
  });
  it("si no llegan los momentos, sale con la pasarela clásica", async () => {
    g.__dftcNextAsk = async () => null;
    startRunway("jimbo", () => 0.3, "concepto");
    chooseLook(rw().catTag);
    await submitConcept("una idea");
    expect(rw().mode).toBe("clasica");
    expect(rw().step).toBe(1);
    chooseWalk(WALK_OF_TAG[rw().catTag]);
    chooseMoment("pose");
    chooseVoice("buena");
    expect(rw().done).toBe(true);
  });
  it("sin veredicto, nota media y sin frases", async () => {
    let n = 0;
    g.__dftcNextAsk = async () => (n++ ? null : { entrada: ["a", "b"], detalle: ["c", "d"], final: ["e", "f"] });
    startRunway("jimbo", () => 0.3, "concepto");
    chooseLook(rw().catTag);
    await submitConcept("idea");
    expect(rw().qa).toBeNull();
    [0, 0, 0].forEach((j) => chooseConceptMoment(j));
    await new Promise((r) => setTimeout(r, 0));
    expect(rw().done).toBe(true);
    expect(rw().lines).toBeNull();
    expect(rw().score).toBe(59);
  });
  it("si se sale de la pasarela, la respuesta que llega tarde no la toca", async () => {
    let release: (v: any) => void = () => {};
    g.__dftcNextAsk = () => new Promise((r) => (release = r));
    startRunway("jimbo", () => 0.3, "concepto");
    chooseLook(rw().catTag);
    const p = submitConcept("idea");
    startRunway("jimbo", () => 0.3, "concepto");
    release({ entrada: ["a", "b"], detalle: ["c", "d"], final: ["e", "f"] });
    await p;
    expect(rw().step).toBe(0);
  });
});

describe("la categoría que pide el modo historia", () => {
  it("se respeta aunque no sea una temática (las del Ball)", () => {
    startRunway("jimbo", () => 0.4, "clasica", "Dulces sueños", { look: "Camp", pieces: [], catDesc: "La fantasía más dulce y exagerada", catTag: "Camp" });
    expect(rw().cat).toBe("Dulces sueños");
    expect(rw().theme).toBe("La fantasía más dulce y exagerada");
    expect(rw().catTag).toBe("Camp");
  });
  it("también las temáticas con reveal", () => {
    startRunway("jimbo", () => 0.4, "clasica", "Pesadilla", { look: "Edgy", pieces: [] });
    expect(rw().cat).toBe("Pesadilla");
  });
  it("sin categoría (pasarela suelta), sortea una temática", () => {
    startRunway("jimbo", () => 0.4, "clasica");
    expect(rw().cat).toBeTruthy();
  });
});
