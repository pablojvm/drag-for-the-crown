import { describe, it, expect } from "vitest";
import { newRoom, startSeason, advance, applySubmit, aliveKeys, FINALES, type Engine, type RoomState, type FinalFmt } from "../src/mp/model";
import { makeRng } from "../src/core";

const engine = (seed = 1): Engine => {
  const r = makeRng(seed);
  return {
    retos: () => [
      { tipo: "snatch", titulo: "Snatch Game", desc: "", noRunway: false },
      { tipo: "makeover", titulo: "Makeover", desc: "", noRunway: true },
    ],
    categorias: () => [{ n: "Pasión en Rojo", d: "" }],
    rivalScore: () => 40 + Math.floor(r() * 40),
    simLS: (a, b) => (r() < 0.5 ? a : b),
    critique: (_t, level, name) => [["Supremme", `${name}: ${level}`]],
    queenName: (id) => id.toUpperCase(),
    rnd: r,
  };
};
const room = (seed: number, n = 8): RoomState => {
  const c = Array.from({ length: n }, (_, i) => "q" + (i + 1));
  let s = newRoom("ABCDE", { id: "A", name: "Ana", queen: "q1", joined: 1, alive: true }, "custom", "rapido", { fmt: "normal" });
  s = { ...s, players: [...s.players, { id: "B", name: "Bea", queen: "q2", joined: 2, alive: true }] };
  return startSeason(s, c, 0, engine(seed));
};
/** Juega hasta el reencuentro y fuerza la forma de la final. */
const toReunion = (seed: number, fmt: FinalFmt) => {
  const e = engine(seed);
  let s = room(seed);
  let g = 0;
  while (s.phase !== "reencuentro" && g++ < 2000) s = advance(s, g * 1000, e);
  return { s: { ...s, finalFmt: fmt } as RoomState, e, g };
};

describe("gran final del multijugador", () => {
  it("antes de la final hay reencuentro (con Miss Simpatía) y se anuncia a las finalistas", () => {
    const { s: r, e } = toReunion(4, "torneo");
    expect(r.phase).toBe("reencuentro");
    expect(aliveKeys(r).length).toBeLessThanOrEqual(4);
    // En el reencuentro votan también las eliminadas
    const out = r.players.find((p) => !p.alive);
    if (out) expect(applySubmit(r, out.id, r.ep, "reencuentro", { pick: aliveKeys(r)[0] }).subs[out.id]?.pick).toBe(aliveKeys(r)[0]);
    const f = advance(r, 1, e);
    expect(f.phase).toBe("finalistas");
    expect(f.miss?.key).toBeTruthy();
  });
  for (const fmt of Object.keys(FINALES) as FinalFmt[]) {
    it(`la final «${FINALES[fmt].n}» corona a una sola ganadora`, () => {
      for (const seed of [1, 2, 3, 7, 11]) {
        const r = toReunion(seed, fmt);
        const e = r.e;
        let { s, g } = r;
        const finalists = aliveKeys(s);
        while (s.phase !== "corona" && g++ < 4000) s = advance(s, g * 1000, e);
        expect(s.phase).toBe("corona");
        expect(aliveKeys(s)).toHaveLength(1);
        expect(finalists).toContain(s.champion);
        expect(s.track[s.champion!][s.ep]).toBe("WINNER");
        expect(Object.values(s.track).filter((t) => t[s.ep] === "RUNNER-UP")).toHaveLength(1);
        if (fmt === "votan") expect(Object.values(s.vote?.tally || {}).reduce((a, b) => a + b, 0)).toBeGreaterThan(0);
      }
    });
  }
  it("votan las eliminadas: el voto de una jugadora eliminada cuenta", () => {
    const { s: r, e } = toReunion(5, "votan");
    let s = r, g = 0;
    while (s.phase !== "votacion" && g++ < 500) s = advance(s, g * 1000, e);
    expect(s.phase).toBe("votacion");
    const voter = s.players.find((p) => !p.alive);
    if (voter) {
      const s2 = applySubmit(s, voter.id, s.ep, "votacion", { pick: s.vote!.a });
      expect(s2.subs[voter.id]?.pick).toBe(s.vote!.a);
      // No se puede votar a otra
      expect(applySubmit(s, voter.id, s.ep, "votacion", { pick: "zz" }).subs[voter.id]).toBeUndefined();
    }
  });
  for (const fmt of Object.keys(FINALES) as FinalFmt[]) {
    it(`con pase directo, la final «${FINALES[fmt].n}» llega a la corona y la del pase llega al último duelo`, () => {
      for (const seed of [1, 2, 3, 7]) {
        const r = toReunion(seed, fmt);
        const e = r.e;
        let g = r.g;
        if (aliveKeys(r.s).length < 3) continue;
        const pase = aliveKeys(r.s)[0];
        let s: RoomState = { ...r.s, pase };
        while (s.phase !== "corona" && g++ < 4000) s = advance(s, g * 1000, e);
        expect(s.phase).toBe("corona");
        expect(aliveKeys(s)).toHaveLength(1);
        // La del pase acaba ganadora o subcampeona
        expect(["WINNER", "RUNNER-UP"]).toContain(s.track[pase][s.ep]);
      }
    });
  }
  it("la primera finalista no cae al bottom la semana siguiente", () => {
    const e = engine(3);
    let s = room(3);
    let g = 0;
    while (!(s.phase === "pasarela" && aliveKeys(s).length >= 5) && g++ < 2000) s = advance(s, g * 1000, e);
    const imm = aliveKeys(s)[aliveKeys(s).length - 1];
    s = { ...s, immune: { key: imm, ep: s.ep } };
    s = advance(s, g * 1000, e); // críticas
    const row = (s.rows || []).find((r) => r.key === imm);
    expect(row && /^BTM/.test(row.label)).toBe(false);
  });
});