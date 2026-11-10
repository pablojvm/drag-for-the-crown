import { describe, it, expect } from "vitest";
import { coloresDe, historiaColor, bonoColor } from "../src/core/armario";

describe("historia de color del look", () => {
  it("reconoce los colores del nombre de cada prenda", () => {
    expect(coloresDe("Stilettos de charol rojo")).toEqual(["rojo"]);
    expect(coloresDe("Vestido de cristales dorado con plumas")).toEqual(["dorado"]);
    expect(coloresDe("Corsé fucsia con nube de tul")).toEqual(["rosa"]);
    expect(coloresDe("Mono de látex")).toEqual([]);
  });
  it("cuenta el color que une el look y lo premia", () => {
    const h = historiaColor(["Sirena de lentejuela roja", "Cresta punk roja de pinchos", "Stilettos de charol rojo", "Bolso negro"]);
    expect(h).toEqual({ color: "rojo", n: 3 });
    expect(bonoColor(h.n)).toBe(8);
    expect(bonoColor(1)).toBe(0);
  });
});

describe("colores con acento", () => {
  it("reconoce carmesí y limón", () => {
    expect(coloresDe("Capa carmesí")).toEqual(["rojo"]);
    expect(coloresDe("Peluca limón")).toEqual(["amarillo"]);
    expect(coloresDe("Oropel")).toEqual([]);
  });
});
