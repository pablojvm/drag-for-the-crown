import { describe, it, expect } from "vitest";
import { REINAS_ES, queenStats, baseAttrs, QATTRS, traitsOf, RASGO_ATTRS, RASGOS, migraAttrs, rasgoToca, HABILIDADES_REALES, type Attrs } from "../src/core/reinas";
import { talento, talentoDe, TALENTOS, newSteps, applyPick, stepsScore } from "../src/core/maxi";
import { makeRng } from "../src/core/rng";
import * as T from "../src/core/temporada";

const plano = (v: number) => Object.fromEntries(QATTRS.map((k) => [k, v])) as Attrs;

describe("habilidades de las reinas", () => {
  it("cada reina tiene las 10 habilidades, de 2 a 10", () => {
    for (const id of Object.keys(REINAS_ES)) {
      const a = baseAttrs(id, queenStats(id));
      expect(Object.keys(a).sort()).toEqual([...QATTRS].sort());
      for (const k of QATTRS) {
        expect(a[k]).toBeGreaterThanOrEqual(2);
        expect(a[k]).toBeLessThanOrEqual(10);
      }
    }
  });
  it("la especialidad sube y la flojera baja", () => {
    let up = 0, down = 0, n = 0;
    for (const id of Object.keys(REINAS_ES)) {
      const t = traitsOf(id), a = baseAttrs(id, queenStats(id));
      const media = QATTRS.reduce((x, k) => x + a[k], 0) / QATTRS.length;
      const f = RASGO_ATTRS[t.fort] || [], d = RASGO_ATTRS[RASGOS.deb[t.deb].cat || ""] || [];
      if (f.length) { n++; if (f.every((k) => a[k] >= media)) up++; }
      if (d.length && d.every((k) => a[k] <= media)) down++;
    }
    expect(up / n).toBeGreaterThan(0.8);
    expect(down).toBeGreaterThan(0);
  });
  it("lo que cada reina demostró en el programa se nota en sus habilidades", () => {
    for (const [id, real] of Object.entries(HABILIDADES_REALES)) {
      const a = baseAttrs(id, queenStats(id)), t = traitsOf(id);
      const media = QATTRS.reduce((x, k) => x + a[k], 0) / QATTRS.length;
      expect(a[real[0]]).toBeGreaterThanOrEqual(media);
      expect(rasgoToca(t.fort, [real[0]])).toBe(true);
      // Nunca flojea en lo que ha demostrado
      expect(rasgoToca(RASGOS.deb[t.deb].cat, real)).toBe(false);
    }
    expect(traitsOf("sharonne").fort).toBe("canto");
    expect(traitsOf("killer-queen").fort).toBe("comedia");
  });
  it("las mejoras guardadas pasan a las habilidades nuevas", () => {
    expect(migraAttrs({ performance: 2, estilo: 1, carisma: 1, raro: 3 })).toEqual({ baile: 2, canto: 2, moda: 1, carisma: 1 });
    expect(migraAttrs(null)).toEqual({});
  });
  it("una especialidad toca un reto si comparte habilidad", () => {
    expect(rasgoToca("canto", ["canto", "baile"])).toBe(true);
    expect(rasgoToca("costura", ["comedia"])).toBe(false);
    expect(rasgoToca(undefined, ["canto"])).toBe(false);
  });
});

describe("talent show", () => {
  it("cada reina elige lo que mejor se le da", () => {
    expect(talentoDe({ ...plano(4), canto: 10, carisma: 8 }).k).toBe("canto");
    expect(talentoDe({ ...plano(4), comedia: 10, improvisacion: 9 }).k).toBe("comedia");
  });
  it("se juega entero con cualquier talento y la nota va de 0 a 100", () => {
    const rnd = makeRng(3);
    for (let i = 0; i < 40; i++) {
      const m = talento({ attrs: plano(6), rnd, mates: [], rivales: [{ name: "Inti", tal: "canto", nivel: 7 }] });
      const st = newSteps();
      let shown = 0;
      for (const f of m.steps) {
        const s = f(st);
        if (!s) continue;
        shown++;
        applyPick(st, s.opts[Math.floor(rnd() * s.opts.length)].go(st));
      }
      expect(shown).toBe(5);
      expect(TALENTOS.some((t) => t.k === st.tal)).toBe(true);
      const sc = stepsScore(st, m);
      expect(sc).toBeGreaterThanOrEqual(0);
      expect(sc).toBeLessThanOrEqual(100);
    }
  });
  it("sorprender con algo que no es lo tuyo premia si sale bien", () => {
    const a = { ...plano(5), canto: 10, carisma: 10 };
    const m = talento({ attrs: a, rnd: () => 0, mates: [] });
    const st = newSteps();
    m.steps[0](st)!.opts.find((o) => o.t.includes("baile"))!.go(st);
    expect(st.sorpresa).toBe(true);
    expect(m.finish!(st, 90)).toBeGreaterThan(90);
    expect(m.finish!(st, 40)).toBeLessThan(40);
  });
  it("si una rival hace lo mismo y lo hace mejor, te resta", () => {
    const m = talento({ attrs: plano(6), rnd: () => 0, mates: [], rivales: [{ name: "Inti", tal: "canto", nivel: 9 }] });
    const st = newSteps();
    const r = m.steps[0](st)!.opts[0].go(st);
    expect(r.msg).toContain("Inti");
    expect(m.finish!(st, 70)).toBeLessThan(70 + 1.2 + 0.01);
  });
  it("la temporada del motor nuevo abre con el talent show", () => {
    const s = T.newSeason("es1", T.seasonById("es1")!.cast[0], 1, makeRng(1));
    expect(s.plan[0]).toBe("talento");
    expect(s.plan.filter((k) => k === "talento").length).toBe(1);
  });
});
