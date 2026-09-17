import { describe, expect, it } from "vitest";

import {
  REGLA_DE_DURACION,
  dictaTema,
  minutosDeLaMateria,
  minutosPorTema,
  usaPesos,
  type SesionDeClase,
  type TemaDeclarado,
} from "@/lib/domain/duracion";

/**
 * La duración por tema — [ADR-068](../docs/decisions.md#adr-068) y
 * [ADR-069](../docs/decisions.md#adr-069).
 *
 * Lo que estos tests protegen es **que `SIN_DATOS` no se degrade a cero**. Es
 * la regresión más probable de todo el Gantt: alguien va a querer que la
 * función devuelva siempre un número para que la barra no se rompa, y ahí una
 * materia sin libro de temas pasa a mostrarse igual que una en la que el
 * estudiante no hizo nada.
 */

const U = (id: string, peso: number | null = null): TemaDeclarado => ({ id, peso });
const clase = (minutos: number | null, temas: string[]): SesionDeClase => ({
  tipo: "clase",
  minutos,
  temas,
});

describe("Qué sesión aporta minutos (ADR-069)", () => {
  it("sólo `clase` dicta tema: parcial, consulta y recuperatorio no", () => {
    expect(dictaTema({ tipo: "clase", minutos: 120, temas: [] })).toBe(true);
    expect(dictaTema({ tipo: "parcial", minutos: 120, temas: [] })).toBe(false);
    expect(dictaTema({ tipo: "consulta", minutos: 120, temas: [] })).toBe(false);
    expect(dictaTema({ tipo: "recuperatorio", minutos: 120, temas: [] })).toBe(false);
    expect(dictaTema({ tipo: "no_dictada", minutos: 120, temas: [] })).toBe(false);
  });

  it("`null` cuenta como clase, y se elige el error chico a propósito", () => {
    // El 97% de las filas del corpus son clases sin confirmar. Tratar lo
    // desconocido como no-clase dejaría el Gantt vacío; contar un parcial mal
    // clasificado suma unos minutos de más.
    expect(dictaTema({ tipo: null, minutos: 120, temas: [] })).toBe(true);
  });

  it("un parcial no le atribuye sus minutos a los temas que evaluó", () => {
    const r = minutosPorTema(
      [U("u1"), U("u2")],
      [clase(100, ["u1"]), { tipo: "parcial", minutos: 120, temas: ["u1", "u2"] }],
    );
    expect(r.estado).toBe("OK");
    if (r.estado !== "OK") return;
    expect(r.minutos).toEqual({ u1: 100 });
    // `u2` no aparece: **no es cero**, es que no hay dato sobre él.
    expect(r.minutos).not.toHaveProperty("u2");
  });
});

describe("El peso es todo-o-nada por materia (ADR-068)", () => {
  it("con todos los pesos declarados, reparte por peso", () => {
    expect(usaPesos([U("u1", 3), U("u2", 1)])).toBe(true);
    const r = minutosPorTema([U("u1", 3), U("u2", 1)], [clase(120, ["u1", "u2"])]);
    if (r.estado !== "OK") throw new Error("esperaba OK");
    expect(r.minutos.u1).toBe(90);
    expect(r.minutos.u2).toBe(30);
  });

  it("con un peso faltante, la materia entera pasa a repartir parejo", () => {
    // Un peso ausente **no es 1.0**: mezclarlo con los declarados produciría un
    // reparto que parece medido y no lo es.
    expect(usaPesos([U("u1", 3), U("u2")])).toBe(false);
    const r = minutosPorTema([U("u1", 3), U("u2")], [clase(120, ["u1", "u2"])]);
    if (r.estado !== "OK") throw new Error("esperaba OK");
    expect(r.minutos.u1).toBe(60);
    expect(r.minutos.u2).toBe(60);
  });
});

describe("Las dos fuentes y su reconciliación", () => {
  const temas = [U("u1"), U("u2")];

  it("sólo el libro: la suma observada, tal cual", () => {
    const r = minutosPorTema(temas, [clase(120, ["u1"]), clase(60, ["u2"])]);
    if (r.estado !== "OK") throw new Error("esperaba OK");
    expect(r.origen).toBe("observada");
    expect(r.minutos).toEqual({ u1: 120, u2: 60 });
  });

  it("sólo el programa: el total se reparte entre las unidades declaradas", () => {
    const r = minutosPorTema(temas, [], 600);
    if (r.estado !== "OK") throw new Error("esperaba OK");
    expect(r.origen).toBe("declarada");
    expect(r.minutos).toEqual({ u1: 300, u2: 300 });
  });

  it("las dos: el total manda y el libro reparte", () => {
    // El libro observa 180 en proporción 2:1. El programa declara 600.
    const r = minutosPorTema(temas, [clase(120, ["u1"]), clase(60, ["u2"])], 600);
    if (r.estado !== "OK") throw new Error("esperaba OK");
    expect(r.origen).toBe("reconciliada");
    expect(r.minutos.u1).toBe(400);
    expect(r.minutos.u2).toBe(200);
    expect(minutosDeLaMateria(r)).toBe(600);
  });

  it("el denominador es lo ATRIBUIBLE, no todo lo observado", () => {
    // Una clase sin temas es tiempo que no se puede atribuir. Si contara en el
    // denominador, cada tema recibiría menos de lo que le toca — una dilución
    // que nadie podría explicar mirando la pantalla.
    const r = minutosPorTema(temas, [clase(120, ["u1"]), clase(60, ["u2"]), clase(300, [])], 600);
    if (r.estado !== "OK") throw new Error("esperaba OK");
    expect(r.minutos.u1).toBe(400);
    expect(minutosDeLaMateria(r)).toBe(600);
  });

  it("una sesión que apunta a un tema de otra materia no reparte", () => {
    const r = minutosPorTema([U("u1")], [clase(120, ["u1", "ajeno"])]);
    if (r.estado !== "OK") throw new Error("esperaba OK");
    expect(r.minutos).toEqual({ u1: 120 });
  });
});

describe("Sin datos NO es cero", () => {
  it("sin ninguna fuente de duración devuelve SIN_DATOS, no un cero", () => {
    const r = minutosPorTema([U("u1")], [clase(null, ["u1"])]);
    expect(r).toEqual({ estado: "SIN_DATOS", motivo: "sin_duracion_conocida" });
    expect(minutosDeLaMateria(r)).toBeNull();
  });

  it("sin unidades declaradas, tampoco: es el otro estado degradado", () => {
    const r = minutosPorTema([], [clase(120, ["u1"])], 600);
    expect(r).toEqual({ estado: "SIN_DATOS", motivo: "sin_temas_declarados" });
  });

  it("una materia con sesiones pero todas sin duración no estima", () => {
    // Es el caso de las 12 materias del corpus sin `Horario:` ni carga horaria.
    const r = minutosPorTema([U("u1"), U("u2")], [clase(null, ["u1"]), clase(null, ["u2"])]);
    expect(r.estado).toBe("SIN_DATOS");
  });

  it("`minutosDeLaMateria` devuelve null y nunca 0 en SIN_DATOS", () => {
    // Sumar afuera invitaría a tratar el SIN_DATOS como 0; por eso existe.
    expect(minutosDeLaMateria({ estado: "SIN_DATOS", motivo: "sin_duracion_conocida" })).toBeNull();
  });
});

describe("La regla se versiona", () => {
  it("todo resultado declara con qué regla se calculó", () => {
    const r = minutosPorTema([U("u1")], [clase(120, ["u1"])]);
    if (r.estado !== "OK") throw new Error("esperaba OK");
    expect(r.regla).toBe(REGLA_DE_DURACION);
  });

  it("este módulo NO aplica el factor de estudio", () => {
    // Los minutos de acá son minutos de clase. Convertirlos a minutos de
    // estudio es el `1.5`, que sigue abierto y va versionado aparte: mezclarlos
    // haría imposible saber cuál de los dos números cambió.
    const r = minutosPorTema([U("u1")], [clase(120, ["u1"])]);
    if (r.estado !== "OK") throw new Error("esperaba OK");
    expect(r.minutos.u1).toBe(120);
  });
});
