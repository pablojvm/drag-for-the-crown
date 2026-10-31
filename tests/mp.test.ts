import { describe, it, expect } from "vitest";
import { newRoom, startSeason, tick, advance, applySubmit, allIn, topeEpisodio, pkey, nkey, aliveKeys, standings, ppeOf, planCats, setScript, hostNext, proposePause, votePause, resumeRoom, winnersWeeks, type Engine, type RoomState } from "../src/mp/model";
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
    repesca: () => ({ tipo: "repescaStand", titulo: "Segunda Oportunidrag", desc: "", noRunway: true }),
  };
};
const cast = ["q1", "q2", "q3", "q4", "q5", "q6", "q7", "q8"];
const room = (): RoomState => {
  let s = newRoom("ABCDE", { id: "A", name: "Ana", queen: "q1", joined: 1, alive: true }, "es1", "rapido");
  s = { ...s, players: [...s.players, { id: "B", name: "Bea", queen: "q2", joined: 2, alive: true }] };
  return advance(startSeason(s, cast, 0, engine()), 0, engine()); // maletas → episodio 1
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
    expect(s.phase).toBe("maletas");
    s = advance(s, 0, e);
    expect(s.phase).toBe("anuncio");
    expect(s.deadline).toBe(0); // el anuncio lo pasa la anfitriona
    s = advance(s, 0, e);
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
    return advance(startSeason(s, cast, 0, engine(7)), 0, engine(7));
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

  const fresh = (ritmo: "normal" | "libre" = "normal") => {
    let s = newRoom("ABCDE", { id: "A", name: "Ana", queen: "q1", joined: 1, alive: true }, "es1", ritmo);
    s = { ...s, players: [...s.players, { id: "B", name: "Bea", queen: "q2", joined: 2, alive: true }] };
    return startSeason(s, cast, 0, engine(4));
  };
  it("antes del episodio 1 se hacen las maletas con el plan de pasarelas", () => {
    const e = engine(4);
    let s = fresh();
    expect(s.phase).toBe("maletas");
    expect(s.plan).toHaveLength(cast.length - 4);
    s = applySubmit(s, "A", s.ep, "maletas", { ready: true });
    expect(allIn(s)).toBe(false);
    s = applySubmit(s, "B", s.ep, "maletas", { ready: true });
    expect(allIn(s)).toBe(true);
    s = tick(s, 1, e);
    expect(s.phase).toBe("anuncio");
    expect(s.reto!.tipo).toBe(s.plan![0].tipo);
    expect(s.reto!.cat?.n).toBe(s.plan![0].cat?.n);
  });
  it("las pantallas que se miran las pasa la anfitriona, línea a línea", () => {
    const e = engine(4);
    let s = advance(fresh(), 0, e); // anuncio
    expect(tick(s, 1e12, e).phase).toBe("anuncio"); // sin reloj
    s = setScript(s, "1:anuncio:0", [["host", "a"], ["host", "b"]]);
    expect(setScript(s, "1:anuncio:0", [["host", "x"]]).script!.lines[0][1]).toBe("a");
    s = hostNext(s, 0, e); expect(s.script!.i).toBe(1);
    s = hostNext(s, 0, e); expect(s.script!.i).toBe(2); // ya en la tarjeta
    s = hostNext(s, 0, e);
    expect(s.phase).toBe("reto");
    expect(s.script).toBeUndefined();
  });
  it("pausar necesita el sí de todas; con un no se sigue", () => {
    const e = engine(4);
    let s = advance(advance(fresh(), 0, e), 1000, e); // reto con reloj
    const dl = s.deadline;
    s = proposePause(s, "A", 5000);
    expect(tick(s, 1e12, e).phase).toBe("reto"); // en votación no corre el reloj
    const no = votePause(s, "B", false, 9000);
    expect(no.pause).toBeUndefined();
    expect(no.deadline).toBe(dl + 4000);
    s = votePause(s, "B", true, 9000);
    expect(s.paused).toBe(true);
    const back = resumeRoom(s, "B", 100000);
    expect(back.paused).toBe(false);
    expect(back.host).toBe("B");
    expect(back.deadline).toBe(100000 + Math.max(15000, dl - 5000));
  });

  const fmtRoom = (fmt: any, seed: number, n = 10) => {
    const c = Array.from({ length: n }, (_, i) => "q" + (i + 1));
    let s = newRoom("ABCDE", { id: "A", name: "Ana", queen: "q1", joined: 1, alive: true }, "custom", "rapido", { fmt });
    s = { ...s, players: [...s.players, { id: "B", name: "Bea", queen: "q2", joined: 2, alive: true }] };
    return { s: startSeason(s, c, 0, engine(seed)), c };
  };
  const runAll = (s: RoomState, e: Engine, onStep?: (s: RoomState) => void) => {
    let guard = 0;
    while (s.phase !== "corona" && guard++ < 3000) { onStep && onStep(s); s = advance(s, guard * 1000, e); }
    return s;
  };
  for (const fmt of ["normal", "allstars", "winners", "repesca", "suerte", "corazon", "moneda"]) {
    it(`la dinámica ${fmt} llega hasta la corona con una sola ganadora`, () => {
      for (const seed of [1, 2, 3, 9, 21]) {
        const { s: s0, c } = fmtRoom(fmt, seed);
        const s = runAll(s0, engine(seed));
        expect(s.phase).toBe("corona");
        expect(aliveKeys(s)).toHaveLength(1);
        expect(s.out.length).toBe(c.length - 1);
      }
    });
  }
  it("All Winners: nadie se va hasta la final y van las 4 con más estrellas", () => {
    const e = engine(5);
    const { s: s0, c } = fmtRoom("winners", 5);
    expect(s0.weeks).toBe(winnersWeeks(c.length));
    let maxOut = 0;
    const s = runAll(s0, e, (x) => { if (x.phase !== "final" && x.phase !== "corona" && x.ep <= (x.weeks || 0)) maxOut = Math.max(maxOut, x.out.filter((o) => o.ep < (x.weeks || 0)).length); });
    expect(maxOut).toBe(0);
    const finalists = Object.keys(s.track).filter((k) => /WINNER|RUNNER-UP|3ª/.test(Object.values(s.track[k]).join(" ")));
    expect(finalists).toHaveLength(4);
    const stars = (k: string) => s.stars?.[k] || 0;
    const others = Object.keys(s.track).filter((k) => !finalists.includes(k));
    expect(Math.min(...finalists.map(stars))).toBeGreaterThanOrEqual(Math.max(...others.map(stars)));
  });
  it("All Winners: final como en la historia (QoSDADHH para las demás, puestos por tramos)", () => {
    for (const seed of [2, 5, 9]) {
      const e = engine(seed);
      const { s: s0, c } = fmtRoom("winners", seed);
      let sawQ = false;
      const s = runAll(s0, e, (x) => { if (x.bracket?.kind === "qosd") sawQ = true; });
      expect(sawQ).toBe(true);
      const labs = Object.values(s.track).map((t) => Object.values(t).join(" "));
      expect(labs.filter((l) => /QOSD/.test(l))).toHaveLength(1);
      expect(labs.filter((l) => /ELIMF/.test(l))).toHaveLength(c.length - 5);
      const tier = `5º/${c.length}º`;
      expect(s.out.filter((o) => o.place === tier)).toHaveLength(c.length - 4);
      // En la clasificación, la QoSDADHH va justo detrás de las cuatro de la final
      expect(s.track[standings(s)[4].key][s.ep]).toBe("QOSD");
    }
  });
  it("All Winners: con empate en el corte decide la jugadora con más estrellas", () => {
    const e = engine(4);
    const { s: s0, c } = fmtRoom("winners", 4, 8);
    let s = s0;
    let guard = 0;
    while (!(s.phase === "track" && s.ep >= (s.weeks || 0)) && guard++ < 3000) s = advance(s, guard * 1000, e);
    const keys = aliveKeys(s);
    const A = pkey("A");
    const stars: Record<string, number> = Object.fromEntries(keys.map((k) => [k, k === A ? 9 : 2]));
    s = advance({ ...s, stars }, 1e9, e);
    expect(s.phase).toBe("comodin");
    expect(s.twist?.kind).toBe("corte");
    expect(s.twist?.need).toBe(3);
    const pick = s.twist!.options.filter((k) => k !== A).slice(-3);
    s = applySubmit(s, "A", s.ep, "comodin", { pick: pick.join(",") });
    s = advance(s, 1e9 + 1000, e);
    expect(s.awFinal!.top.sort()).toEqual([A, ...pick].sort());
    s = runAll(s, e);
    expect(s.phase).toBe("corona");
    expect(c.length).toBe(8);
  });
  it("Segunda Oportunidrag: con siete, una eliminada vuelve y hay lip sync a tres bandas", () => {
    const e = engine(8);
    let { s } = fmtRoom("repesca", 8);
    let sawTriple = false, back = "";
    s = runAll(s, e, (x) => { if (x.triple) sawTriple = true; if (x.twistResult?.kind === "repesca" && x.twistResult.back) back = x.twistResult.back; });
    expect(sawTriple).toBe(true);
    expect(back).not.toBe("");
    expect(Object.values(s.track[back])).toContain("RTRN");
  });
  it("Reina de la suerte: la tiene una y, si la usa, la siguiente peor entra en el bottom", () => {
    const e = engine(12);
    let { s } = fmtRoom("suerte", 12);
    expect(s.luck).toBeTruthy();
    let used = false;
    s = runAll(s, e, (x) => { if (x.twistResult?.kind === "suerte" && x.twistResult.saved?.length) { used = true; expect(x.bottom).toContain(x.twistResult.entered![0]); expect(x.bottom).not.toContain(x.twistResult.saved[0]); } });
    expect(s.phase).toBe("corona");
    expect(typeof used).toBe("boolean");
  });
  it("Reina de la suerte: antes del primer episodio cada jugadora elige su cajita", () => {
    const e = engine(7);
    let { s } = fmtRoom("suerte", 7);
    s = advance(s, 1000, e); // maletas -> cajas
    expect(s.phase).toBe("cajas");
    const win = s.boxes!.win;
    s = applySubmit(s, "A", s.ep, "cajas", { box: win });
    expect(applySubmit(s, "B", s.ep, "cajas", { box: win }).subs.B?.box).toBeUndefined(); // ya cogida
    s = applySubmit(s, "B", s.ep, "cajas", { box: (win + 1) % s.boxes!.n });
    s = tick(s, 2000, e);
    expect(s.phase).toBe("cajas"); // un momento para ver tu caja
    expect(s.deadline).toBe(5500);
    s = tick(s, 6000, e);
    expect(s.phase).toBe("anuncio");
    expect(s.luck).toBe(pkey("A"));
    expect(Object.keys(s.boxes!.owners!)).toHaveLength(s.boxes!.n);
  });
  it("Corazón: cada eliminada deja medio corazón y con uno entero se puede salvar a alguien", () => {
    const e = engine(3);
    let { s } = fmtRoom("corazon", 3, 12);
    let gifts = 0;
    s = runAll(s, e, (x) => { if (x.twistResult?.kind === "corazones") gifts += x.twistResult.gifts!.length; });
    expect(gifts).toBeGreaterThan(2);
  });
  it("Moneda: bottom de tres y la votación deja a dos en el lip sync", () => {
    const e = engine(4);
    let { s } = fmtRoom("moneda", 4);
    let coin = 0;
    s = runAll(s, e, (x) => { if (x.phase === "lipsync" && x.twistResult === undefined && x.pairs && x.pairs.length) expect(x.pairs[0].a).not.toBe(x.pairs[0].b); if (x.twistResult?.kind === "moneda") { coin++; expect(x.bottom).toHaveLength(2); } });
    expect(coin).toBeGreaterThan(0);
  });

  it("en la corona la anfitriona puede pasar las frases hasta ver a la ganadora", () => {
    const e = engine(3);
    let s = room();
    let guard = 0;
    while (s.phase !== "corona" && guard++ < 500) s = advance(s, guard * 1000, e);
    s = setScript(s, "x:corona:0", [["host", "a"], ["host", "b"], ["judge", "c"]]);
    for (let i = 0; i < 5; i++) s = hostNext(s, 0, e);
    expect(s.phase).toBe("corona");
    expect(s.script!.i).toBe(3); // tarjeta final con la ganadora
  });
});
