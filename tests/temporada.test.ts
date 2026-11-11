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
    if (s.game) { applyPick(st, s.game.go(Math.round(rnd() * 100), st)); continue; }
    expect(s.opts.length).toBeGreaterThanOrEqual(2);
    applyPick(st, s.opts[k ?? Math.floor(rnd() * s.opts.length)].go(st));
  }
  return { score: stepsScore(st), shown };
}

describe("retos por decisiones", () => {
  it("todos los retos se pueden jugar de principio a fin y dan una nota de 0 a 100", () => {
    const rnd = makeRng(7);
    for (const tipo of Object.keys(MAXI).filter((k) => !MAXI[k].special)) {
      const { score, shown } = playMaxi(tipo, rnd);
      expect(shown).toBeGreaterThanOrEqual(3);
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(100);
    }
  });
  it("el chequeo sigue la fórmula del modo historia", () => {
    const a = { maquillaje: 5, baile: 5, canto: 5, costura: 5, comedia: 10, interpretacion: 5, improvisacion: 5, lipsync: 5, carisma: 5, moda: 5 };
    expect(check(a, ["comedia"], 50, 0.94).ok).toBe(true); // p = 0,5 + 50/70, con tope 0,95
    expect(check(a, ["comedia"], 50, 0.96).ok).toBe(false);
  });
});

/** Juega una temporada entera con las reglas del núcleo (tus decisiones, al azar). */
function simSeason(seasonId: string, seed: number) {
  const rnd = makeRng(seed);
  const t = T.seasonById(seasonId)!;
  let s = T.nextWeek(T.newSeason(seasonId, t.cast[seed % t.cast.length], seed, rnd), rnd);
  const seen = new Set<string>();
  for (let guard = 0; guard < 60 && s.phase !== "fin"; guard++) {
    seen.add(s.phase);
    if (s.phase === "regreso") {
      const [a, b] = T.repescaPair(s, rnd);
      s = T.repescaResult(s, T.simLipSync(s, a, b, rnd)[0]);
      if (s.meOut) s.phase = "fuera";
      if (s.phase === "veredicto") s = T.nextWeek(s, rnd);
      else s = T.nextWeek({ ...s, phase: "veredicto" }, rnd);
      continue;
    }
    if (s.phase === "reencuentro") {
      const talks = T.reunionTalks(s, rnd);
      talks.forEach((t) => t.lines.forEach(([, x]) => expect(typeof x).toBe("string")));
      s = T.startFinal(T.missSimpatia(s, rnd), rnd);
      expect(s.miss).toBeTruthy();
    }
    if (s.phase === "final") {
      for (const [a, b] of s.final!.pairs) s = T.settleSemi(s, T.simLipSync(s, a, b, rnd)[0]);
      s = T.crown(s, T.simLipSync(s, s.final!.semis[0], s.final!.semis[1], rnd)[0]);
      break;
    }
    s = T.playMini(s, Math.round(rnd() * 100), rnd);
    expect(s.phase).toBe("taller");
    const sc = T.sceneOf(s, rnd);
    sc.lines.forEach(([, t]) => expect(typeof t).toBe("string"));
    s = T.applyScene(s, sc, sc.choices.length ? Math.floor(rnd() * sc.choices.length) : -1, rnd);
    if (s.week!.lala) {
      seen.add("lalaparuza");
      for (let m = T.lalaNext(s); m; m = T.lalaNext(s)) s = T.lalaDuel(s, m.a!, m.b!, T.simLipSync(s, m.a!, m.b!, rnd)[0]);
      expect(s.week!.lala!.done).toBe(true);
      s = T.lalaFinish(s, 60, rnd);
    } else {
      s.week!.reto = Math.round(rnd() * 100);
      s.week!.runway = Math.round(rnd() * 100);
      s = T.scoreWeek(s, rnd);
    }
    s = T.rivalsDecide(s, rnd);
    const dec = T.myDecision(s);
    if (dec === "moneda") { s = T.flipCoin(s, rnd, s.week!.bottom![0]); expect(s.week!.bottom!.length).toBe(2); }
    if ((dec === "suerte" || dec === "corazon") && rnd() < 0.5) s = T.saveFromBottom(s, s.week!.bottom!.includes(T.ME) ? T.ME : s.week!.bottom![0], T.ME, dec);
    const [a, b] = s.week!.bottom!;
    const [win, lose] = T.simLipSync(s, a, b, rnd);
    s = T.lipSyncResult(s, win, lose, rnd);
    if (s.phase === "pintalabios") s = T.lipstick(s, s.week!.rows!.filter((r) => /^BTM/.test(s.week!.labels![r.key])).at(-1)!.key);
    if (s.phase === "bloqueo") s = T.block(s, s.alive.find((k) => k !== T.ME)!);
    if (s.heartFrom) s = T.giveHeart(s, s.heartFrom, null, rnd);
    Object.values(s.hearts).forEach((h) => expect(h).toBeGreaterThanOrEqual(0));
    s = T.nextWeek({ ...s, phase: s.phase === "fuera" ? "veredicto" : s.phase }, rnd);
  }
  return { s, seen };
}

describe("temporadas con dinámicas", () => {
  for (const id of ["es1", "es3", "es4", "es5", "es6", "esas1", "esaw"]) {
    it(`${id} (${T.twistOf(id)}) se juega entera y corona a una ganadora`, () => {
      for (const seed of [11, 12, 13]) {
        const { s } = simSeason(id, seed);
        expect(s.phase).toBe("fin");
        const winners = Object.entries(s.track).filter(([, t]) => t.includes("WINNER"));
        expect(winners.length).toBe(1);
        // El track record va por episodios: nadie tiene más columnas que episodios
        Object.values(s.track).forEach((t) => expect(t.length).toBeLessThanOrEqual(s.ep));
        if (s.twist === "winners") {
          expect(s.out.length).toBe(0);
          expect(Object.values(s.stars).reduce((a, b) => a + b, 0)).toBeGreaterThan(0);
        }
        if (s.twist === "repesca") expect(s.repescaDone).toBe(true);
        expect(T.logrosNow(s)).toContain("debut");
        if (s.twist === "allstars") expect(Object.values(s.track).some((t) => t.includes("TOP2"))).toBe(true);
      }
    });
  }
  it("la moneda deja un bottom de tres y manda a dos al lip sync", () => {
    const rnd = makeRng(5);
    let s = T.nextWeek(T.newSeason("es6", T.seasonById("es6")!.cast[0], 5, rnd), rnd);
    s.week!.reto = 50; s.week!.runway = 50;
    s = T.scoreWeek(s, rnd);
    expect(s.week!.bottom!.length).toBe(3);
    s = T.flipCoin(s, rnd);
    expect(s.week!.coin!.pair.length).toBe(2);
    expect(s.week!.bottom).toEqual(s.week!.coin!.pair);
  });
  it("la reina de la suerte salva a una del bottom y entra la siguiente peor", () => {
    const rnd = makeRng(8);
    let s = T.nextWeek(T.newSeason("es4", T.seasonById("es4")!.cast[0], 8, rnd), rnd);
    s.luck = T.ME;
    s.week!.reto = 50; s.week!.runway = 50;
    s = T.scoreWeek(s, rnd);
    const before = s.week!.bottom!.slice();
    s = T.saveFromBottom(s, before[0], T.ME, "suerte");
    expect(s.luck).toBeNull();
    expect(s.week!.bottom).not.toContain(before[0]);
    expect(s.week!.bottom!.length).toBe(2);
  });
  it("en el Untucked, hablar con alguien del bottom une más; la primera enemiga es tu némesis", () => {
    const rnd = makeRng(3);
    let s = T.nextWeek(T.newSeason("es1", "inti", 3, rnd), rnd);
    s.week!.reto = 50; s.week!.runway = 50;
    s = T.scoreWeek(s, rnd);
    const opts = T.untuckedOptions(s, rnd);
    expect(opts.length).toBeGreaterThan(0);
    const sc = T.untuckedScene(s, opts[0], rnd);
    sc.lines.forEach(([, t]) => expect(t).not.toMatch(/\{(r1|yo)\}/));
    s = T.changeRel(s, opts[0].key, -2);
    expect(s.nemesis).toBe(opts[0].key);
  });
  it("retos en equipo: dos equipos con todas y el equipo ganador arriba", () => {
    const rnd = makeRng(4);
    let s = T.newSeason("es2", T.seasonById("es2")!.cast[0], 4, rnd);
    s = { ...s, plan: ["equipos", ...s.plan] };
    s = T.nextWeek(s, rnd);
    expect(s.week!.teams![0]).toContain(T.ME);
    expect(s.week!.teams![0].length + s.week!.teams![1].length).toBe(s.alive.length);
    s.week!.reto = 50; s.week!.runway = 50;
    s = T.scoreWeek(s, rnd);
    const winTeam = s.week!.teams![s.week!.winTeam!];
    expect(winTeam).toContain(s.week!.rows![0].key);
    s.week!.bottom!.forEach((k) => expect(winTeam).not.toContain(k));
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
      const season = T.seasonById("es1")!;
      let s = T.nextWeek(T.newSeason(season.id, season.cast[0], seed, rnd), rnd);
      let weeks = 0;
      while (s.phase !== "fin" && s.phase !== "final") {
        if (s.phase === "reencuentro") { s = T.startFinal(s, rnd); break; }
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
        if (s.meOut) break;
        s = T.nextWeek(s, rnd);
      }
      if (s.meOut) {
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
    const season = T.seasonById("es2")!;
    let s = T.nextWeek(T.newSeason(season.id, season.cast[2], 9, rnd), rnd);
    s.week!.reto = 50;
    s.week!.runway = 50;
    s = T.scoreWeek(s, rnd);
    const lines = T.critique(s, T.ME, () => 0.9);
    // Supremme abre y critica el reto; Ana critica el look (y a veces los Javis o un recuerdo)
    expect(lines.length).toBeGreaterThanOrEqual(3);
    expect(lines[0][0]).toBe("host");
    expect(lines.some(([k]) => k === "judge")).toBe(true);
    lines.forEach(([, l]) => { expect(l).not.toMatch(/\{yo\}|\{cat\}|\{pieza\}/); expect(l.trim().length).toBeGreaterThan(5); });
  });
});

describe("armario, taller y minirretos", () => {
  it("el estilismo premia lo que encaja con la temática", async () => {
    const A = await import("../src/core/armario");
    const cat = "Pasión en Rojo";
    const best = A.SLOTS.map((k) => [k, A.bestFor(k, cat, 1)[0]?.id] as const);
    const good = Object.fromEntries(best.filter(([, id]) => id));
    expect(A.outfitScore(good, cat)).toBeGreaterThan(A.outfitScore({}, cat) + 20);
    expect(A.priceOf(A.prendaById(best[0][1]!)!)).toBeGreaterThan(0);
  });
  it("los roles se reparten entre las rivales y las escenas rellenan nombres", async () => {
    const { assignRoles, tallerScene, fillText } = await import("../src/core/taller");
    const rnd = makeRng(2);
    const roles = assignRoles(["a", "b", "c"], rnd);
    expect(Object.keys(roles).length).toBe(3);
    for (let i = 0; i < 20; i++) {
      const sc = tallerScene({ rivals: ["a", "b", "c"], roles, nemesis: "a", seenRoles: {}, rnd });
      sc.lines.forEach(([, t]) => expect(fillText(t, { yo: "Yo", r1: "Uno", r2: "Dos" })).not.toMatch(/\{(yo|r1|r2)\}/));
      sc.choices.forEach((c) => Object.keys(c.rel).forEach((k) => expect(["a", "b", "c"]).toContain(k)));
    }
  });
  it("ganar el minirreto da ventaja en el reto", () => {
    const rnd = makeRng(6);
    let s = T.nextWeek(T.newSeason("es1", "inti", 6, rnd), rnd);
    s = T.playMini(s, 100, rnd);
    expect(s.week!.mini!.winner).toBe(T.ME);
    expect(s.week!.adv).toBeGreaterThanOrEqual(4);
  });
});

describe("Lalaparuza, reencuentro y retos escritos en directo", () => {
  it("el torneo corona a una y da la mejor nota a la campeona", async () => {
    const { lalaStart, lalaPending, lalaResolve, lalaScores } = await import("../src/core/lala");
    const keys = ["a", "b", "c", "d", "e", "f", "g"];
    let L = lalaStart(keys);
    for (let p = lalaPending(L)[0]; p; p = lalaPending(L)[0]) L = lalaResolve(L, p.a!, p.b!, p.a!);
    expect(L.done).toBe(true);
    const sc = lalaScores(L, keys, () => 0);
    expect(sc[L.champ!]).toBe(Math.max(...Object.values(sc)));
  });
  it("un reto escrito en directo se monta con tres opciones por paso (o se descarta)", async () => {
    const { maxiFromAI } = await import("../src/core/maxi");
    const ctx = { attrs: baseAttrs("inti", queenStats("inti")), rnd: makeRng(1), mates: [{ key: "a", name: "A" }] };
    const base = { tipo: "roast", title: "Roast", icon: "🔥", attrs: ["comedia"] as any };
    expect(maxiFromAI(null, base, ctx, (t) => t)).toBeNull();
    const paso = { q: "Situación", opciones: [{ t: "Brillante", calidad: "buena", attr: "comedia" }, { t: "Segura", calidad: "regular" }, { t: "Mala", calidad: "mala" }] };
    const m = maxiFromAI({ pasos: [paso, paso, paso, paso] }, base, ctx, (t) => t)!;
    expect(m.steps.length).toBe(4);
    expect(m.steps[0](newSteps())!.opts.length).toBe(3);
  });
});

describe("All Stars a tu gusto y charla libre", () => {
  it("el All Stars a tu gusto se juega con el reparto que eliges", () => {
    const rnd = makeRng(21);
    const pool = T.customPool();
    expect(pool.length).toBeGreaterThan(T.CUSTOM.max);
    const cast = pool.slice(0, 9);
    const s = T.newSeason(T.CUSTOM.id, cast[0], 21, rnd, cast);
    expect(s.twist).toBe("allstars");
    expect(s.alive.length).toBe(9);
    expect(s.alive.filter((k) => k !== T.ME).every((k) => cast.includes(k))).toBe(true);
  });
  it("la charla lee la respuesta y acota el cambio de relación", async () => {
    const { parseCharla, charlaPrompt } = await import("../src/core/charla");
    expect(parseCharla({ respuesta: "Hola, guapa", relacion: 7 }, (t) => t)).toEqual({ text: "Hola, guapa", rel: 2, ok: true });
    expect(parseCharla(null, (t) => t).ok).toBe(false);
    const P = charlaPrompt({ reina: "Inti", yo: "Pupi", donde: "el taller", rel: -2, nemesis: true }, [{ me: true, t: "Hola" }]);
    expect(P.system).toContain("némesis");
    expect(P.user).toContain("Pupi: Hola");
  });
});
