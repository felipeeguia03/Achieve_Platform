/**
 * Las unidades de una clase y *cómo venís* · [ADR-099](../docs/decisions.md#adr-099) §8.
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

import { listaDeUnidades, unidadesDeLaClase, type UnidadDeMateria } from "@/lib/domain/unidades-de-clase";
import { datosSimuladosDeClase } from "@/lib/server/simulacion/clase";
import { diaDeLaClase } from "@/lib/server/servicios/proyeccion-clase";
import { esLinkValido, esTipoDeAudio, minutero, tamanoLegible } from "@/lib/domain/sesion-de-clase";

const u = (n: number, estado: UnidadDeMateria["estado"] = "sin_evidencia"): UnidadDeMateria => ({
  id: `u${n}`,
  numero: n,
  codigo: `U${n}`,
  nombre: `Unidad ${n}`,
  estado,
  minutos: null,
});

describe("qué unidad es la de esta clase", () => {
  const cinco = [u(1), u(2), u(3), u(4), u(5)];

  it("si hay una clase dictada esa fecha, sus temas mandan: es un hecho", () => {
    const r = unidadesDeLaClase(cinco, ["u3"], ["u1"])!;
    expect(r.fuente).toBe("DICTADA");
    expect(r.unidades.filter((x) => x.posicion === "ESTA_CLASE").map((x) => x.id)).toEqual(["u3"]);
  });

  it("si no, la que sigue a la última dada, y se dice estimada", () => {
    const r = unidadesDeLaClase(cinco, [], ["u2", "u4"])!;
    expect(r.fuente).toBe("ESTIMADA");
    expect(r.unidades.map((x) => x.posicion)).toEqual(["ANTERIOR", "ANTERIOR", "ANTERIOR", "ANTERIOR", "ESTA_CLASE"]);
  });

  it("después de la última unidad no inventa una sexta", () => {
    const r = unidadesDeLaClase(cinco, [], ["u5"])!;
    expect(r.unidades.at(-1)!.posicion).toBe("ESTA_CLASE");
  });

  it("sin ninguna clase dada, es la primera", () => {
    expect(unidadesDeLaClase(cinco, [], [])!.unidades[0].posicion).toBe("ESTA_CLASE");
  });

  it("temas que no son de la materia se ignoran", () => {
    expect(unidadesDeLaClase(cinco, ["otro"], ["u1"])!.fuente).toBe("ESTIMADA");
  });

  it("sin temario, no hay nada que decir", () => {
    expect(unidadesDeLaClase([], [], [])).toBeNull();
  });
});

describe("cómo venís: *te faltan las unidades 1, 2, 3 y 4*", () => {
  it("si están dando la 5, faltan las anteriores sin criterio alcanzado", () => {
    const r = unidadesDeLaClase([u(1), u(2, "criterio_alcanzado"), u(3, "enviada"), u(4, "requiere_revision"), u(5)], [], ["u4"])!;
    expect(r.faltan.map((x) => x.numero)).toEqual([1, 3, 4]);
    expect(listaDeUnidades(r.faltan)).toBe("1, 3 y 4");
  });

  it("las posteriores y la de la clase no cuentan como faltantes", () => {
    const r = unidadesDeLaClase([u(1, "criterio_alcanzado"), u(2), u(3)], ["u2"], [])!;
    expect(r.faltan).toEqual([]);
  });

  it("una unidad sin número se nombra por su nombre", () => {
    expect(listaDeUnidades([{ numero: 1, nombre: "a" }, { numero: null, nombre: "Anexo" }])).toBe("1 y Anexo");
    expect(listaDeUnidades([{ numero: 4, nombre: "a" }])).toBe("4");
  });

  it("el estado sale del mismo Gantt que Materia, no de otra lectura", () => {
    const composicion = readFileSync(resolve(process.cwd(), "lib/server/composicion.ts"), "utf8");
    const bloque = composicion.slice(composicion.indexOf("async function unidadesDeCursada"));
    expect(bloque.slice(0, 700)).toMatch(/materiaReal\.estadoDeMateria\([\s\S]*ganttDeMateria\(estado\)/);
  });
});

describe("la simulación de la clase · §6–§7", () => {
  const semana = [{ id: "b-mar", dia: 2 }, { id: "b-vie", dia: 5 }];

  it("es determinística y alterna teórica/práctica por el orden de la semana", () => {
    const a = datosSimuladosDeClase({ ofertaId: "of", claseId: "c1", bloqueId: "b-vie", semana, diaDeLaClase: 5 });
    const b = datosSimuladosDeClase({ ofertaId: "of", claseId: "c2", bloqueId: "b-vie", semana, diaDeLaClase: 5 });
    expect(a).toEqual(b);
    expect(a.tipo).toBe("PRACTICA");
    expect(datosSimuladosDeClase({ ofertaId: "of", claseId: "c1", bloqueId: "b-mar", semana, diaDeLaClase: 2 }).tipo).toBe("TEORICA");
    expect(a.aula).toMatch(/^Aula [1-4]\.\d{2}$/);
    expect(a.inscriptos).toBeGreaterThanOrEqual(24);
  });

  it("una clase iniciada a mano toma el bloque de ese día de la semana", () => {
    expect(datosSimuladosDeClase({ ofertaId: "of", claseId: "c", bloqueId: null, semana, diaDeLaClase: 5 }).tipo).toBe("PRACTICA");
  });

  it("sólo existe con `MODO_PRUEBA=1`, y la composición lo pregunta", () => {
    const composicion = readFileSync(resolve(process.cwd(), "lib/server/composicion.ts"), "utf8");
    expect(composicion).toMatch(/simulacionDeClaseActiva\(\)\s*\?\s*datosSimuladosDeClase/);
    const sim = readFileSync(resolve(process.cwd(), "lib/server/simulacion/clase.ts"), "utf8");
    expect(sim).toContain('process.env.MODO_PRUEBA === "1"');
  });
});

describe("formatos", () => {
  it("el día de la clase: *jueves 18/05*", () => {
    expect(diaDeLaClase("2026-05-18T14:00:00Z", "America/Argentina/Cordoba")).toBe("lunes 18/05");
  });

  it("links, audio, minutero y tamaños", () => {
    expect(esLinkValido("https://a.b")).toBe(true);
    expect(esLinkValido("javascript:alert(1)")).toBe(false);
    expect(esLinkValido("ftp://a.b")).toBe(false);
    expect(esTipoDeAudio("audio/webm;codecs=opus")).toBe(true);
    expect(esTipoDeAudio("video/webm")).toBe(false);
    expect(minutero(750)).toBe("12:30");
    expect(minutero(3725)).toBe("1:02:05");
    expect(tamanoLegible(2_500_000)).toBe("2,4 MB");
    expect(tamanoLegible(800)).toBe("1 KB");
  });
});
