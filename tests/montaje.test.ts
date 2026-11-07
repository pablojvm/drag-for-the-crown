import { describe, it, expect } from "vitest";
import { MONTAJE, parteDe, hayCorte, planoDe, caraDe, domina, numeroDe, suspense } from "../src/core/montaje";

describe("montaje del lip sync", () => {
  it("la canción tiene tres partes y los cortes se aceleran hacia el clímax", () => {
    expect([0, 1, 2, 3, 4, 5].map(parteDe)).toEqual([0, 0, 1, 1, 2, 2]);
    const cortes = (p: number) => Array.from({ length: 32 }, (_, b) => b).filter((b) => hayCorte(b, p)).length;
    expect(cortes(0)).toBeLessThan(cortes(1));
    expect(cortes(1)).toBeLessThan(cortes(2));
    expect(hayCorte(0, 2)).toBe(false);
  });
  it("tras un movimiento, el corte va a quien lo ha hecho; si no, nunca repite plano", () => {
    expect(planoDe({ beat: 8, parte: 0, foco: "them", rnd: 0.9 })).toBe("them");
    let prev: ReturnType<typeof planoDe> | undefined;
    for (let b = 2; b < 80; b += 2) {
      const p = planoDe({ beat: b, parte: 2, anterior: prev, rnd: (b * 37) % 100 / 100 });
      expect(p).not.toBe(prev);
      prev = p;
    }
  });
  it("las caras cambian con la letra; tras un fallo, tensión; tras clavarlo, grito", () => {
    const caras = new Set(Array.from({ length: 16 }, (_, b) => caraDe({ beat: b, parte: 1, actor: "me" })));
    expect(caras.size).toBeGreaterThanOrEqual(3);
    expect(caraDe({ beat: 3, parte: 0, ultimo: "mal", actor: "me" })).toBe("tension");
    expect(caraDe({ beat: 3, parte: 0, ultimo: "bien", actor: "them" })).toBe("grito");
    // Las dos no ponen la misma cara a la vez todo el rato
    const iguales = Array.from({ length: 16 }, (_, b) => caraDe({ beat: b, parte: 1, actor: "me" }) === caraDe({ beat: b, parte: 1, actor: "them" })).filter(Boolean).length;
    expect(iguales).toBeLessThan(16);
  });
  it("domina quien saca ventaja clara; números solo para los buenos movimientos (el reveal, en el clímax)", () => {
    expect(domina(50, 50)).toBeNull();
    expect(domina(50 + MONTAJE.dominaPor, 50)).toBe("me");
    expect(domina(10, 30)).toBe("them");
    expect(numeroDe({ tag: "Emote", ok: false, imp: 40, parte: 2 })).toBeNull();
    expect(numeroDe({ tag: "Emote", ok: true, imp: 2, parte: 2 })).toBeNull();
    expect(numeroDe({ tag: "Emote", ok: true, imp: 40, parte: 2 })).toBe("reveal");
    expect(numeroDe({ tag: "Emote", ok: true, imp: 40, parte: 0 })).toBe("dip");
    expect(numeroDe({ tag: "Escenario", ok: true, imp: 20, parte: 1 })).toBe("giro");
  });
  it("el suspense alterna el foco cada vez más rápido y termina en la que pierde (el golpe final es para la ganadora)", () => {
    const s = suspense("me");
    expect(s.at(-1)!.foco).toBe("them");
    s.slice(1).forEach((x, i) => { expect(x.foco).not.toBe(s[i].foco); expect(x.ms).toBeLessThanOrEqual(s[i].ms); });
    expect(suspense("them").at(-1)!.foco).toBe("me");
  });
});
