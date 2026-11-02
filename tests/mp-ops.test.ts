import { describe, it, expect } from "vitest";
import { newRoom } from "../src/mp/model";
import { applyOp, handOver } from "../src/mp/ops";
import { coreEngine, cleanContent } from "../src/mp/engine-core";

const e = coreEngine(() => ({}));
const base = () => newRoom("ABCDE", { id: "ana", name: "Ana", queen: null, joined: 1, alive: false }, "es1", "libre");
const cast = ["pupi", "carmenfarala", "killerqueen", "sagaz", "hugaceo", "dovima", "arantxa", "inti"];

describe("peticiones a la sala (ops)", () => {
  it("entra una jugadora nueva una sola vez y con nombre limpio", () => {
    let s = applyOp(base(), "bea", { t: "join", name: "Beatriz de la Sala", joined: 2 }, 10, e);
    expect(s.players.map((p) => p.id)).toEqual(["ana", "bea"]);
    expect(s.players[1].name.length).toBeLessThanOrEqual(12);
    expect(applyOp(s, "bea", { t: "join", name: "Otra" }, 10, e)).toBe(s);
  });
  it("las desconocidas no pueden pedir nada y las invitadas no llevan la sala", () => {
    const s = applyOp(base(), "bea", { t: "join", name: "Bea" }, 10, e);
    expect(applyOp(s, "zoe", { t: "pick", queen: "pupi" }, 10, e)).toBe(s);
    expect(applyOp(s, "bea", { t: "start", cast }, 10, e)).toBe(s);
    expect(applyOp(s, "bea", { t: "next" }, 10, e)).toBe(s);
    expect(applyOp(s, "ana", { t: "start", cast }, 10, e).phase).not.toBe("lobby");
  });
  it("dos jugadoras no pueden elegir la misma reina", () => {
    let s = applyOp(base(), "bea", { t: "join", name: "Bea" }, 10, e);
    s = applyOp(s, "ana", { t: "pick", queen: "pupi" }, 10, e);
    expect(applyOp(s, "bea", { t: "pick", queen: "pupi" }, 10, e)).toBe(s);
  });
  it("relevo: si se va la anfitriona, lleva la sala la siguiente que entró", () => {
    let s = applyOp(base(), "bea", { t: "join", name: "Bea", joined: 5 }, 10, e);
    s = applyOp(s, "cris", { t: "join", name: "Cris", joined: 3 }, 10, e);
    expect(handOver(s, new Set(["ana", "bea", "cris"]), 20)).toBe(s);
    expect(handOver(s, new Set(["bea", "cris"]), 20).host).toBe("cris");
  });
});

describe("motor del servidor (solo núcleo)", () => {
  it("notas de las rivales en rango, lip sync entre las dos y críticas con nombre", () => {
    for (let i = 0; i < 50; i++) {
      const v = e.rivalScore("pupi", "snatch");
      expect(v).toBeGreaterThanOrEqual(5);
      expect(v).toBeLessThanOrEqual(99);
      expect(["pupi", "sagaz"]).toContain(e.simLS("pupi", "sagaz"));
    }
    const c = e.critique("snatch", "top", "Pupi");
    expect(c[0][1]).toMatch(/^Pupi, /);
    expect(e.retos().length).toBeGreaterThan(3);
    expect(e.categorias().length).toBeGreaterThan(3);
  });
  it("limpia lo que manda el cliente", () => {
    const c = cleanContent({ retos: [{ tipo: "snatch", titulo: "x".repeat(500), desc: 1, attrs: ["comedia", "hack"] }, { nope: 1 }], categorias: "no", names: { a: "b" } });
    expect(c.retos).toHaveLength(1);
    expect(c.retos![0].titulo.length).toBe(120);
    expect(c.retos![0].attrs).toEqual(["comedia"]);
    expect(c.categorias).toBeUndefined();
  });
});

describe("Segunda Oportunidrag en el multijugador", () => {
  it("la ganadora del reto anterior es maestra de ceremonias: no compite y el lip sync es a tres bandas", async () => {
    const { advance, mcOf } = await import("../src/mp/model");
    let s = newRoom("ABCDE", { id: "ana", name: "Ana", queen: null, joined: 1, alive: false }, "es3", "libre", { fmt: "repesca" });
    s = applyOp(s, "bea", { t: "join", name: "Bea" }, 1, e);
    s = applyOp(s, "ana", { t: "pick", queen: "pupi" }, 1, e);
    s = applyOp(s, "bea", { t: "pick", queen: "sagaz" }, 1, e);
    const big = ["pupi", "sagaz", "carmenfarala", "killerqueen", "hugaceo", "dovima", "arantxa", "inti", "macarena", "drag-sethlas", "the-macarena", "onyx"];
    s = applyOp(s, "ana", { t: "start", cast: big }, 1, e);
    let seen = false, triple = false, now = 10;
    for (let i = 0; i < 400 && s.phase !== "corona"; i++) {
      // Las jugadoras sacan buena nota para seguir en competición
      for (const id of ["ana", "bea"]) s = applyOp(s, id, { t: "submit", ep: s.ep, phase: s.phase, data: { reto: 95, final: 95, ready: true, ls: { won: true, score: 90 } } }, now, e);
      if (mcOf(s)) {
        seen = true;
        const mc = mcOf(s)!;
        expect(s.rp!.pairs.some((p) => p.c === mc)).toBe(false);
        if (s.rows) expect(s.rows.some((r) => r.key === mc)).toBe(false);
        if (s.triple) triple = s.triple.length === 3;
        if (s.phase === "track") expect(s.track[mc][s.ep]).toBe("MC");
      }
      s = advance(s, (now += 1000), e);
    }
    expect(seen).toBe(true);
    expect(triple).toBe(true);
  });
});
