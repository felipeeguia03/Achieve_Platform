import { describe, expect, it } from "vitest";

import {
  ESTADOS_QUE_CUENTAN,
  alcanzaCriterio,
  coberturaDeMateria,
  cuentaComoTrabajado,
  estadoDeEvidencia,
  hayActividad,
  porcentajeDeHoras,
  type TemaConCobertura,
} from "@/lib/domain/cobertura";

/**
 * La cobertura — [ADR-072](../docs/decisions.md#adr-072).
 *
 * Lo que estos tests protegen es **que la barra no se convierta en una nota**.
 * Hay dos formas de que pase, y las dos parecen mejoras cuando se proponen:
 * descontar por evidencia insuficiente, y rellenar los temas sin minutos para
 * que la barra «funcione siempre».
 */

const T = (
  id: string,
  minutos: number | null,
  estado: TemaConCobertura["estado"] = "sin_evidencia",
): TemaConCobertura => ({ id, minutos, estado });

/** Atajo: «hubo actividad» sin decir de qué calidad. */
const A = (id: string, minutos: number | null) => T(id, minutos, "enviada");

describe("Qué cuenta como trabajado", () => {
  it("`EXPECTED` no cuenta: es una evidencia que se espera, no una que llegó", () => {
    expect(cuentaComoTrabajado("EXPECTED")).toBe(false);
  });

  it("`SUBMITTED` cuenta: la decisión del owner es «todo es evidencia enviada»", () => {
    expect(cuentaComoTrabajado("SUBMITTED")).toBe(true);
  });

  it("`INSUFFICIENT` CUENTA, y es la regla que más fácil se rompe", () => {
    // La barra mide que trabajaste, no que lo hayas hecho bien. Que una entrega
    // no alcance es una afirmación de suficiencia, y suficiencia no es
    // cobertura. Descontarla sería usar la barra como nota.
    expect(cuentaComoTrabajado("INSUFFICIENT")).toBe(true);
    expect(ESTADOS_QUE_CUENTAN).toContain("INSUFFICIENT");
  });

  it("todos los estados posteriores al envío cuentan", () => {
    for (const e of ESTADOS_QUE_CUENTAN) expect(cuentaComoTrabajado(e), e).toBe(true);
  });
});

describe("La cobertura es ponderada por horas", () => {
  it("un tema largo pesa más que uno corto", () => {
    // 1 de 2 temas es 50% por conteo. Por horas es 86%: es el punto de que sean
    // dos números distintos y no uno.
    const c = coberturaDeMateria([A("u1", 360), T("u2", 60)]);
    if (c.estado !== "OK") throw new Error("esperaba OK");
    expect(c.temasTrabajados).toBe(1);
    expect(c.temasContados).toBe(2);
    expect(porcentajeDeHoras(c)).toBe(86);
  });

  it("el caso del mockup: 1 de 9 temas no es 11% cuando hay horas", () => {
    const temas = [A("u1", 300), ...Array.from({ length: 8 }, (_, i) => T(`u${i + 2}`, 105))];
    const c = coberturaDeMateria(temas);
    if (c.estado !== "OK") throw new Error("esperaba OK");
    expect(c.temasTrabajados).toBe(1);
    expect(porcentajeDeHoras(c)).toBe(26);
  });
});

describe("Un tema sin minutos NO entra al denominador", () => {
  it("no se le inventa una duración, y se declara cuántos quedaron afuera", () => {
    // Si entrara con un valor inventado, cargar el libro de temas BAJARÍA la
    // cobertura sin que el estudiante hiciera nada mal.
    const c = coberturaDeMateria([A("u1", 100), T("u2", null)]);
    if (c.estado !== "OK") throw new Error("esperaba OK");
    expect(porcentajeDeHoras(c)).toBe(100);
    expect(c.temasSinMinutos).toBe(1);
    // Pero el conteo sí lo incluye: el tema existe aunque no sepamos cuánto dura.
    expect(c.temasContados).toBe(2);
  });

  it("cargar las clases de un tema no baja la cobertura de golpe", () => {
    const antes = coberturaDeMateria([A("u1", 100), T("u2", null)]);
    const despues = coberturaDeMateria([A("u1", 100), T("u2", 100)]);
    if (antes.estado !== "OK" || despues.estado !== "OK") throw new Error("esperaba OK");
    // Baja, porque ahora sabemos que falta la mitad. Lo que NO pasa es que el
    // conteo de temas trabajados cambie: eso sigue siendo 1.
    expect(porcentajeDeHoras(despues)).toBe(50);
    expect(despues.temasTrabajados).toBe(antes.temasTrabajados);
  });
});

describe("Sin datos no hay barra, y no hay cero", () => {
  it("sin temas declarados", () => {
    const c = coberturaDeMateria([]);
    expect(c).toMatchObject({ estado: "SIN_DATOS", motivo: "sin_temas_declarados" });
    expect(porcentajeDeHoras(c)).toBeNull();
  });

  it("con temas pero sin minutos: el conteo sí, la barra no", () => {
    const c = coberturaDeMateria([A("u1", null), T("u2", null)]);
    if (c.estado !== "SIN_DATOS") throw new Error("esperaba SIN_DATOS");
    expect(c.motivo).toBe("sin_minutos_conocidos");
    // El conteo se puede mostrar igual: es un hecho, no una estimación.
    expect(c.temasTrabajados).toBe(1);
    expect(c.temasDeclarados).toBe(2);
    expect(porcentajeDeHoras(c)).toBeNull();
  });

  it("nada trabajado con minutos conocidos SÍ es cero, y es distinto de SIN_DATOS", () => {
    // Una barra vacía por falta de trabajo y una por falta de datos no se
    // dibujan igual, y acá está la diferencia hecha tipo.
    const c = coberturaDeMateria([T("u1", 100), T("u2", 100)]);
    expect(c.estado).toBe("OK");
    expect(porcentajeDeHoras(c)).toBe(0);
  });
});

describe("El redondeo no miente en los extremos", () => {
  it("no muestra 100% hasta que esté completo", () => {
    const casi = coberturaDeMateria([A("u1", 999), T("u2", 1)]);
    expect(porcentajeDeHoras(casi)).toBe(99);
    const completo = coberturaDeMateria([A("u1", 999), A("u2", 1)]);
    expect(porcentajeDeHoras(completo)).toBe(100);
  });

  it("no muestra 0% si algo se empezó", () => {
    // Borrar el único trabajo que hizo alguien con un redondeo es la peor forma
    // de que un número desmotive.
    const apenas = coberturaDeMateria([A("u1", 1), T("u2", 999)]);
    expect(porcentajeDeHoras(apenas)).toBe(1);
  });
});

describe("Lo que la cobertura NO hace", () => {
  it("no conoce el dominio: no hay forma de pasárselo", () => {
    // `topic_progress.domain_value` requiere evaluación; la cobertura sólo
    // requiere que el estudiante haya producido algo. El tipo no lo admite.
    const tema: TemaConCobertura = A("u1", 100);
    expect(Object.keys(tema).sort()).toEqual(["estado", "id", "minutos"]);
  });

  it("declara con qué reglas se calculó", () => {
    const c = coberturaDeMateria([A("u1", 100)]);
    if (c.estado !== "OK") throw new Error("esperaba OK");
    expect(c.regla).toContain("cobertura-v1");
    // Y arrastra la de duración: los minutos vienen de ahí.
    expect(c.regla).toContain("duracion-v1");
  });
});

describe("Los cuatro estados de una unidad (ADR-075 §C2)", () => {
  it("`requiere_revision` cuenta como actividad y no como criterio", () => {
    expect(hayActividad("requiere_revision")).toBe(true);
    expect(alcanzaCriterio("requiere_revision")).toBe(false);
  });

  it("sólo `criterio_alcanzado` alcanza el criterio", () => {
    for (const e of ["sin_evidencia", "enviada", "requiere_revision"] as const) {
      expect(alcanzaCriterio(e), e).toBe(false);
    }
    expect(alcanzaCriterio("criterio_alcanzado")).toBe(true);
  });

  it("el mapeo desde el lifecycle de la Evidence", () => {
    expect(estadoDeEvidencia("EXPECTED")).toBe("sin_evidencia");
    expect(estadoDeEvidencia("SUBMITTED")).toBe("enviada");
    expect(estadoDeEvidencia("UNDER_REVIEW")).toBe("enviada");
    expect(estadoDeEvidencia("INSUFFICIENT")).toBe("requiere_revision");
    expect(estadoDeEvidencia("RESUBMISSION_REQUESTED")).toBe("requiere_revision");
    expect(estadoDeEvidencia("SUFFICIENT")).toBe("criterio_alcanzado");
    expect(estadoDeEvidencia("VALIDATED")).toBe("criterio_alcanzado");
  });

  it("la barra mide actividad, y el criterio se cuenta aparte", () => {
    const c = coberturaDeMateria([
      T("u1", 100, "requiere_revision"),
      T("u2", 100, "criterio_alcanzado"),
      T("u3", 100, "sin_evidencia"),
    ]);
    if (c.estado !== "OK") throw new Error("esperaba OK");
    // Dos de tres tienen actividad; sólo una alcanzó el criterio.
    expect(c.temasTrabajados).toBe(2);
    expect(c.temasConCriterio).toBe(1);
    expect(c.entregasQueRequierenRevision).toBe(1);
    expect(porcentajeDeHoras(c)).toBe(67);
  });
});
