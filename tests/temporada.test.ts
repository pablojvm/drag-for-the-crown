import { describe, it, expect } from "vitest";
import * as T from "../src/core/temporada";
import { MAXI, newSteps, applyPick, stepsScore, check } from "../src/core/maxi";
import { makeRng } from "../src/core/rng";
import { queenStats, baseAttrs, TEMPORADAS_ES, REINAS_ES } from "../src/core/reinas";

/** Juega un reto eligiendo siempre la opción k (o al azar). */
function playMaxi(tipo: string, rnd: () => number, k?: number) {
  const m = MAXI[tipo].make({ attrs: baseAttrs("the-macarena", queenStats("the-macarena")), rnd, mates: [{ key: "inti", name: "Inti" }, { key: "pupi-poisson", name: "Pupi" }] });
  const st = newSteps();
  let shown = 0;
  for (const f of m.steps) {
    const s = f(st);
    if (!s) continue;
    shown++;
    expect(s.opts.length).toBeGreaterThanOrEqual(2);
    applyPick(st, s.opts[k ?? Math.floor(rnd() * s.opts.length)].go(st));
  }
  return { score: stepsScore(st), shown };
}

describe("retos por decisiones", () => {
  it("todos los retos se pueden jugar de principio a fin y dan una nota de 0 a 100", () => {
    const rnd = makeRng(7);
    for (const tipo of Object.keys(MAXI)) {
      const { score, shown } = playMaxi(tipo, rnd);
      expect(shown).toBeGreaterThanOrEqual(3);
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(100);
    }
  });
  it("el chequeo sigue la fórmula del modo historia", () => {
    const a = { comedia: 10, carisma: 5, estilo: 5, performance: 5, maquillaje: 5 };
    expect(check(a, ["comedia"], 50, 0.94).ok).toBe(true); // p = 0,5 + 50/70, con tope 0,95
    expect(check(a, ["comedia"], 50, 0.96).ok).toBe(false);
  });
});

describe("temporada", () => {
  it("los datos de las reinas: mismos puntos para todas y atributos de 2 a 10", () => {
    for (const id of Object.keys(REINAS_ES)) {
      const st = queenStats(id);
      expect(st.speed + st.rate + st.power + st.lives).toBe(14);
      Object.values(baseAttrs(id, st)).forEach((v) => expect(v).toBeGreaterThanOrEqual(2));
    }
    expect(TEMPORADAS_ES.length).toBeGreaterThan(5);
  });
  it("una temporada entera: una eliminada por semana, final a cuatro y una ganadora", () => {
    for (const seed of [1, 2, 3, 4, 5]) {
      const rnd = makeRng(seed);
      const season = T.playableSeasons()[0];
      let s = T.nextWeek(T.newSeason(season.id, season.cast[0], seed, rnd), rnd);
      let weeks = 0;
      while (s.phase !== "fin" && s.phase !== "final") {
        s.week!.reto = 80;
        s.week!.runway = 80;
        s = T.scoreWeek(s, rnd);
        const labs = Object.values(s.week!.labels!);
        expect(labs.filter((l) => l === "WIN").length).toBe(1);
        expect(s.week!.bottom!.length).toBe(2);
        const [a, b] = s.week!.bottom!;
        const [win, lose] = T.simLipSync(s, a, b, rnd);
        s = T.settleWeek(s, win, lose);
        weeks++;
        if (s.phase === "veredicto") s = T.nextWeek(s, rnd);
      }
      if (s.phase === "fin") {
        expect(s.place).toBeGreaterThan(T.FINAL_AT);
        expect(s.track[T.ME].at(-1)).toBe("ELIM");
        continue;
      }
      expect(s.alive.length).toBe(T.FINAL_AT);
      expect(weeks).toBe(season.cast.length - T.FINAL_AT);
      const f = s.final!;
      for (const [a, b] of f.pairs) s = T.settleSemi(s, T.simLipSync(s, a, b, rnd)[0]);
      const [w] = T.simLipSync(s, s.final!.semis[0], s.final!.semis[1], rnd);
      s = T.crown(s, w);
      expect(s.phase).toBe("fin");
      expect(s.final!.crown).toBe(w);
      expect(Object.values(s.track).filter((t) => t.at(-1) === "WINNER").length).toBe(1);
      expect(s.place).toBeGreaterThanOrEqual(1);
    }
  });
  it("las críticas usan el nombre de la reina y no dejan marcas sin rellenar", () => {
    const rnd = makeRng(9);
    const season = T.playableSeasons()[1];
    let s = T.nextWeek(T.newSeason(season.id, season.cast[2], 9, rnd), rnd);
    s.week!.reto = 50;
    s.week!.runway = 50;
    s = T.scoreWeek(s, rnd);
    const lines = T.critique(s, T.ME, (a) => a[0]);
    expect(lines.length).toBe(2);
    lines.forEach((l) => expect(l).not.toMatch(/\{yo\}/));
  });
});
