import { describe, it, expect } from "vitest";
import { newRoom, startSeason, tick, advance, applySubmit, allIn, topeEpisodio, pkey, nkey, aliveKeys, standings, ppeOf, type Engine, type RoomState } from "../src/mp/model";
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
const cast = ["q1", "q2", "q3", "q4", "q5", "q6", "q7", "q8"];
const room = (): RoomState => {
  let s = newRoom("ABCDE", { id: "A", name: "Ana", queen: "q1", joined: 1, alive: true }, "es1", "rapido");
  s = { ...s, players: [...s.players, { id: "B", name: "Bea", queen: "q2", joined: 2, alive: true }] };
  return startSeason(s, cast, 0, engine());
};

describe("temporada en directo", () => {
  it("las reinas que nadie coge juegan como rivales del juego", () => {
    const s = room();
    expect(s.npcs).toEqual(["q3", "q4", "q5", "q6", "q7", "q8"]);
    expect(s.phase).toBe("anuncio");
    expect(s.ep).toBe(1);
  });
  it("el tope del episodio es la suma de sus fases", () => {
    expect(topeEpisodio("rapido")).toBeLessThan(topeEpisodio("normal"));
    expect(topeEpisodio("normal")).toBeLessThanOrEqual(12 * 60);
  });
  it("si alguien no entrega, la fase acaba al llegar el tope", () => {
    const e = engine();
    let s = advance(room(), 0, e); // reto
    s = applySubmit(s, "A", s.ep, "reto", { reto: 80 });
    expect(allIn(s)).toBe(false);
    expect(tick(s, s.deadline - 1, e).phase).toBe("reto");
    expect(tick(s, s.deadline, e).phase).not.toBe("reto");
  });
  it("si entregan todas, no se espera al tope", () => {
    const e = engine();
    let s = advance(room(), 0, e);
    s = applySubmit(s, "A", s.ep, "reto", { reto: 80, final: 80 });
    s = applySubmit(s, "B", s.ep, "reto", { reto: 70, final: 70 });
    expect(allIn(s)).toBe(true);
    expect(tick(s, 1, e).phase === "pasarela" || tick(s, 1, e).phase === "resultados").toBe(true);
  });
  it("las entregas fuera de su fase no cuentan", () => {
    const s = advance(room(), 0, engine());
    expect(applySubmit(s, "A", s.ep, "pasarela", { final: 99 }).subs.A).toBeUndefined();
    expect(applySubmit(s, "A", s.ep + 1, "reto", { reto: 99 }).subs.A).toBeUndefined();
  });
  it("una temporada entera termina con una ganadora aunque nadie juegue", () => {
    const e = engine(3);
    let s = room();
    let guard = 0;
    while (s.phase !== "corona" && guard++ < 500) s = advance(s, guard * 1000, e);
    expect(s.phase).toBe("corona");
    expect(s.champion).toBeTruthy();
    expect(aliveKeys(s)).toHaveLength(1);
    expect(s.out.length).toBe(cast.length - 1);
    // quien no entrega nunca acaba fuera pronto: nota de "no presentó"
    expect(s.track[s.champion!][s.ep]).toBe("WINNER");
  });
  it("la que pierde el lip sync se va y queda como espectadora si es jugadora", () => {
    const e = engine(5);
    let s = room();
    let guard = 0;
    while (!(s.phase === "lipsync") && guard++ < 50) s = advance(s, guard, e);
    const pair = s.pairs![0];
    const inP = [pair.a, pair.b].find((k) => k.startsWith("p:"));
    if (inP) s = applySubmit(s, inP.slice(2), s.ep, "lipsync", { ls: { won: false, score: 10 } });
    s = advance(s, 1e6, e);
    const loser = s.pairs![0].winner === pair.a ? pair.b : pair.a;
    expect(aliveKeys(s)).not.toContain(loser);
    if (loser === pkey("A") || loser === pkey("B")) expect(s.players.find((p) => pkey(p.id) === loser)!.alive).toBe(false);
    expect(s.track[loser][s.ep]).toBe("ELIM");
    expect(nkey("q3")).toBe("n:q3");
  });
  it("sin límite: el reto espera a que entreguen todas, pero lo que se mira sigue solo", () => {
    const e = engine();
    let s = newRoom("ABCDE", { id: "A", name: "Ana", queen: "q1", joined: 1, alive: true }, "es1", "libre");
    s = { ...s, players: [...s.players, { id: "B", name: "Bea", queen: "q2", joined: 2, alive: true }] };
    s = startSeason(s, cast, 0, e);
    expect(s.deadline).toBeGreaterThan(0); // el anuncio tiene su tiempo
    s = tick(s, s.deadline, e);
    expect(s.phase).toBe("reto");
    expect(s.deadline).toBe(0);
    expect(tick(s, 1e12, e).phase).toBe("reto"); // no avanza por tiempo
    s = applySubmit(s, "A", s.ep, "reto", { reto: 70 });
    expect(tick(s, 1e12, e).phase).toBe("reto");
    s = applySubmit(s, "B", s.ep, "reto", { reto: 60 });
    expect(tick(s, 1e12, e).phase).not.toBe("reto");
  });

  const asRoom = (ia = false): RoomState => {
    let s = newRoom("ABCDE", { id: "A", name: "Ana", queen: "q1", joined: 1, alive: true }, "esas1", "rapido", { fmt: "allstars", ia });
    s = { ...s, players: [...s.players, { id: "B", name: "Bea", queen: "q2", joined: 2, alive: true }] };
    return startSeason(s, cast, 0, engine(7));
  };
  it("All Stars: las dos mejores eligen pintalabios antes del lip sync y la ganadora saca el suyo", () => {
    const e = engine(7);
    let s = asRoom();
    let guard = 0;
    while (s.phase !== "decision" && guard++ < 50) s = advance(s, guard, e);
    const top = (s.rows || []).filter((r) => r.label === "TOP2").map((r) => r.key);
    const btm = (s.rows || []).filter((r) => r.label === "BTM2").map((r) => r.key);
    expect(top).toEqual(s.rows!.slice(0, 2).map((r) => r.key));
    expect(s.decision!.top.slice().sort()).toEqual(top.slice().sort());
    expect(s.decision!.options.slice().sort()).toEqual(btm.slice().sort());
    // las jugadoras del top eligen; las del juego ya traen su elección
    top.filter((k) => k.startsWith("p:")).forEach((k) => (s = applySubmit(s, k.slice(2), s.ep, "decision", { elim: btm[0] })));
    s = advance(s, 1e6, e);
    expect(s.phase).toBe("lipsync");
    expect(Object.keys(s.decision!.picks).sort()).toEqual(top.slice().sort());
    top.filter((k) => k.startsWith("p:")).forEach((k) => expect(s.decision!.picks[k]).toBe(btm[0]));
    expect([s.pairs![0].a, s.pairs![0].b].sort()).toEqual(top.slice().sort());
    s = advance(s, 2e6, e);
    expect(s.phase).toBe("pintalabios");
    const d = s.decision!;
    expect(d.go).toBe(d.picks[d.by!]);
    expect(s.track[d.by!][s.ep]).toBe("WIN");
    expect(aliveKeys(s)).not.toContain(d.go);
    expect(top.every((k) => aliveKeys(s).includes(k))).toBe(true);
    // el pintalabios de la otra se guarda para el episodio siguiente
    const loser = top.find((k) => k !== d.by)!;
    expect(s.reveal).toEqual({ ep: s.ep, by: loser, go: d.picks[loser], went: d.go });
    s = advance(s, 3e6, e); // track
    s = advance(s, 4e6, e); // siguiente episodio
    expect(s.reveal?.ep).toBe(s.ep - 1);
  });
  it("All Stars entera: termina con ganadora y nunca se va nadie del top 2", () => {
    const e = engine(11);
    let s = asRoom();
    let guard = 0;
    while (s.phase !== "corona" && guard++ < 800) {
      if (s.phase === "pintalabios") { const top = s.pairs![0]; expect([top.a, top.b]).not.toContain(s.decision!.go); }
      s = advance(s, guard * 1000, e);
    }
    expect(s.phase).toBe("corona");
  });
  it("con IA el reto dura más", () => {
    const a = advance(asRoom(false), 0, engine()), b = advance(asRoom(true), 0, engine());
    expect(b.deadline).toBeGreaterThan(a.deadline);
  });
  it("el track record ordena: las que siguen por su semana y temporada; las eliminadas, de la última a la primera", () => {
    const e = engine(3);
    let s = room();
    let guard = 0;
    while (s.phase !== "corona" && guard++ < 500) s = advance(s, guard * 1000, e);
    const st = standings(s);
    expect(st[0].key).toBe(s.champion);
    expect(st[0].place).toBe("1º");
    const outs = st.filter((x) => x.out);
    const epOf = (k: string) => s.out.find((o) => o.key === k)!.ep;
    for (let i = 1; i < outs.length; i++) expect(epOf(outs[i - 1].key)).toBeGreaterThanOrEqual(epOf(outs[i].key));
    expect(outs[outs.length - 1].place).toBe(`${cast.length}º`);
    expect(ppeOf(s, s.champion!)).toBeGreaterThan(0);
  });
});
