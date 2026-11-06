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
    expect(c[0][0]).toBe("Supremme");
    expect(c[0][1]).toContain("Pupi");
    expect(c.some(([who]) => who === "Ana Locking")).toBe(true);
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

describe("Críticas del look aparte del reto", () => {
  it("la pasarela de cada rival tiene su propia nota y no depende de la del reto", async () => {
    const { lookRival } = await import("../src/core/reinas");
    const { nivelNota } = await import("../src/core/dado");
    const vals = ["pupi", "sagaz", "carmenfarala", "killerqueen", "hugaceo", "dovima"].flatMap((q) => [1, 2, 3, 4].map((ep) => lookRival(q, ep)));
    expect(lookRival("pupi", 2)).toBe(lookRival("pupi", 2));
    expect(new Set(vals.map(nivelNota)).size).toBeGreaterThan(1);
    vals.forEach((v) => { expect(v).toBeGreaterThanOrEqual(15); expect(v).toBeLessThanOrEqual(98); });
  });
  it("en la sala, una jugadora con mal reto y gran pasarela recibe crítica buena del look", () => {
    const looks: string[] = [];
    const e2 = { ...e, critique: (t: string, l: "top" | "mid" | "low", n: string, look?: "top" | "mid" | "low") => { looks.push(`${n}:${l}:${look}`); return e.critique(t, l, n, look); } };
    let s = newRoom("ABCDE", { id: "ana", name: "Ana", queen: null, joined: 1, alive: false }, "es1", "libre");
    s = applyOp(s, "ana", { t: "pick", queen: "pupi" }, 1, e2);
    s = applyOp(s, "ana", { t: "start", cast }, 1, e2);
    return import("../src/mp/model").then(({ advance, scoreWeek }) => {
      let now = 10;
      // Un reto individual con pasarela (los hay sin ella o por grupos)
      for (let i = 0; i < 30 && s.phase !== "pasarela"; i++) {
        if (s.phase === "anuncio") s = { ...s, reto: { tipo: "rusical", titulo: "Rusical", desc: "", noRunway: false, cat: { n: "Neón ochentero", d: "" } } };
        s = applyOp(s, "ana", { t: "submit", ep: s.ep, phase: s.phase, data: { reto: 10, ready: true, mini: 10 } }, now, e2);
        s = advance(s, (now += 1000), e2);
      }
      expect(s.phase).toBe("pasarela");
      s = applyOp(s, "ana", { t: "submit", ep: s.ep, phase: s.phase, data: { final: 20, walk: 95 } }, now, e2);
      scoreWeek(s, e2);
      const mine = looks.find((x) => x.startsWith(e.queenName("pupi")));
      expect(mine).toMatch(/:top$/);
    });
  });
});

describe("Minirreto, grupos y parejas en el multijugador", () => {
  const start = (season = "es1", fmt?: "repesca") => {
    let s = newRoom("ABCDE", { id: "ana", name: "Ana", queen: null, joined: 1, alive: false }, season, "normal", fmt ? { fmt } : {});
    s = applyOp(s, "ana", { t: "pick", queen: "pupi" }, 1, e);
    return applyOp(s, "ana", { t: "start", cast }, 1, e);
  };
  it("después del anuncio hay minirreto; la ganadora lleva ventaja en el reto", async () => {
    const { advance, scoreWeek, MINI_VENTAJA } = await import("../src/mp/model");
    let s = start();
    s = advance(s, 10, e); // maletas -> anuncio
    expect(s.phase).toBe("anuncio");
    s = { ...s, reto: { tipo: "snatch", titulo: "Snatch", desc: "", noRunway: true } };
    s = advance(s, 20, e);
    expect(s.phase).toBe("mini");
    expect(s.mini?.titulo).toBeTruthy();
    s = applyOp(s, "ana", { t: "submit", ep: s.ep, phase: "mini", data: { mini: 100 } }, 30, e);
    s = advance(s, 40, e);
    expect(s.phase).toBe("reto");
    expect(s.mini?.rank?.[0]).toBe("p:ana");
    s = applyOp(s, "ana", { t: "submit", ep: s.ep, phase: "reto", data: { reto: 60, final: 60 } }, 50, e);
    const r = scoreWeek(s, e).rows!.find((x) => x.key === "p:ana")!;
    expect(r.score).toBe(60 + MINI_VENTAJA);
  });
  it("reto por grupos: las mejores del minirreto son capitanas, eligen por turnos y el jurado valora cada grupo por su nombre", async () => {
    const { advance, tick, scoreWeek, capOf, draftPool } = await import("../src/mp/model");
    let s = start();
    s = advance(s, 10, e);
    s = { ...s, reto: { tipo: "equipos", titulo: "Girl Groups", desc: "", noRunway: true, groups: 3 } };
    s = advance(s, 20, e);
    s = applyOp(s, "ana", { t: "submit", ep: s.ep, phase: "mini", data: { mini: 100 } }, 30, e);
    s = advance(s, 40, e);
    expect(s.phase).toBe("equipos");
    const g = s.groups!;
    expect(g.members.length).toBe(2); // 8 reinas, grupos de 3
    expect(g.members[0][0]).toBe("p:ana"); // la ganadora del minirreto es la primera capitana
    expect(g.names.every((n) => /^«.+»$/.test(n))).toBe(true); // Girl Groups: nombres de banda
    // Le toca a Ana: elige ella; una que no está libre no vale
    expect(capOf(s)).toBe("p:ana");
    const pick = draftPool(s)[0];
    s = applyOp(s, "ana", { t: "submit", ep: s.ep, phase: "equipos", data: { pick } }, 50, e);
    expect(s.groups!.members[0]).toContain(pick);
    expect(applyOp(s, "ana", { t: "submit", ep: s.ep, phase: "equipos", data: { pick: draftPool(s)[0] } }, 60, e)).toBe(s); // no es su turno
    // La otra capitana (del juego) elige sola; y así hasta acabar (Ana, si tarda, elige el juego por ella)
    let now = 60;
    for (let i = 0; i < 40 && !s.groups!.done; i++) s = tick(s, (now += 30000), e);
    expect(s.groups!.done).toBe(true);
    expect(s.groups!.members.flat().sort()).toEqual([...new Set(s.groups!.members.flat())].sort());
    expect(s.groups!.members.flat().length).toBe(8);
    s = tick(s, (now += 10000), e);
    expect(s.phase).toBe("reto");
    s = applyOp(s, "ana", { t: "submit", ep: s.ep, phase: "reto", data: { reto: 70, final: 70 } }, now, e);
    const w = scoreWeek(s, e);
    expect(w.gcrit!.length).toBe(2);
    expect(w.gcrit![0].lines[0][1]).toContain(w.gcrit![0].name);
    // La ganadora sale del grupo ganador y el bottom, del último
    const top = w.gcrit![0].keys, last = w.gcrit![1].keys;
    expect(top).toContain(w.rows!.find((r) => r.label === "WIN")!.key);
    w.rows!.filter((r) => /^BTM/.test(r.label)).forEach((r) => expect(last).toContain(r.key));
  });
  it("Segunda Oportunidrag: la ganadora del minirreto elige a su eliminada y el resto va a sorteo", async () => {
    const { advance } = await import("../src/mp/model");
    let s = start("es3", "repesca");
    // Ya hay tres eliminadas y es la semana de la Segunda Oportunidrag
    const outs = ["inti", "arantxa", "dovima"].map((q) => ({ key: "n:" + q, ep: 1, place: "x" }));
    s = { ...s, npcs: s.npcs.filter((q) => !["inti", "arantxa", "dovima"].includes(q)), out: outs, phase: "track", ep: 4, track: {} };
    s = advance(s, 10, e);
    expect(s.rp?.ep).toBe(s.ep);
    s = advance(s, 20, e); // anuncio -> mini
    expect(s.phase).toBe("mini");
    s = applyOp(s, "ana", { t: "submit", ep: s.ep, phase: "mini", data: { mini: 100 } }, 30, e);
    s = advance(s, 40, e);
    expect(s.phase).toBe("equipos");
    expect(s.draft!.by).toBe("p:ana");
    s = applyOp(s, "ana", { t: "submit", ep: s.ep, phase: "equipos", data: { pick: "n:dovima" } }, 50, e);
    expect(s.draft!.done).toBe(true);
    expect(s.rp!.pairs.find((p) => p.c === "p:ana")!.o).toBe("n:dovima");
    const os = s.rp!.pairs.map((p) => p.o).filter(Boolean);
    expect(new Set(os).size).toBe(os.length); // ninguna eliminada en dos parejas
    s = advance(s, 60, e);
    expect(s.phase).toBe("reto");
  });
});
