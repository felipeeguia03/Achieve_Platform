import { describe, expect, it } from "vitest";

import {
  MINUTOS_DE_ANTICIPACION,
  elegibilidadDeRenegociacion,
  type PropuestaDeRenegociacion,
} from "@/lib/domain/renegociacion";

/**
 * Las cinco condiciones de [ADR-046](../docs/decisions.md#adr-046), una por
 * una. Es la decisión del Product Owner del 4 de septiembre de 2026, y su
 * fuente literal es `respuesta-po-decisiones-abiertas-source.md` §3.
 */

const ZONA = "America/Argentina/Cordoba";

/** 11:00 de Córdoba del 2 de septiembre; se propone las 16:00 del mismo día. */
const BASE: PropuestaDeRenegociacion = {
  estado: "CONFIRMED",
  renegociadoDeId: null,
  inicioOriginal: "2026-09-02T14:00:00.000Z",
  inicioPropuesto: "2026-09-02T19:00:00.000Z",
  ahora: "2026-09-02T12:00:00.000Z",
  zonaInstitucional: ZONA,
};

describe("ADR-046 · condiciones 1 y 2 · el estado", () => {
  it("CONFIRMED y DUE son elegibles", () => {
    expect(elegibilidadDeRenegociacion(BASE)).toEqual({ elegible: true });
    expect(elegibilidadDeRenegociacion({ ...BASE, estado: "DUE" })).toEqual({ elegible: true });
  });

  it.each(["STARTED", "MISSED", "COMPLETED", "RENEGOTIATED", "CLOSED", "DRAFT"] as const)(
    "%s no lo es",
    (estado) => {
      expect(elegibilidadDeRenegociacion({ ...BASE, estado })).toEqual({
        elegible: false, motivo: "ESTADO_NO_RENEGOCIABLE",
      });
    },
  );

  /**
   * Lo textual del Product Owner: *"no se exige una anticipación mínima
   * respecto del horario original: un compromiso en `DUE` todavía puede
   * renegociarse mientras no haya sido declarado `MISSED`"*. El límite es el
   * estado, no el reloj del acuerdo viejo.
   */
  it("un DUE cuyo horario original YA pasó sigue siendo elegible", () => {
    expect(elegibilidadDeRenegociacion({
      ...BASE,
      estado: "DUE",
      inicioOriginal: "2026-09-02T11:00:00.000Z", // ya pasó respecto de `ahora`
    })).toEqual({ elegible: true });
  });
});

describe("ADR-046 · condición 3 · una sola renegociación por cadena", () => {
  it("el sucesor de otro compromiso no se vuelve a renegociar", () => {
    expect(elegibilidadDeRenegociacion({ ...BASE, renegociadoDeId: "c-0" })).toEqual({
      elegible: false, motivo: "CADENA_YA_RENEGOCIADA",
    });
  });
});

describe("ADR-046 · condición 4 · quince minutos desde AHORA", () => {
  const desde = (minutos: number) => ({
    ...BASE,
    ahora: "2026-09-02T19:00:00.000Z",
    inicioPropuesto: new Date(Date.parse("2026-09-02T19:00:00.000Z") + minutos * 60_000).toISOString(),
  });

  it("exactamente 15 minutos alcanza: el umbral es inclusivo", () => {
    expect(elegibilidadDeRenegociacion(desde(MINUTOS_DE_ANTICIPACION))).toEqual({ elegible: true });
  });

  it("14 minutos no alcanza", () => {
    expect(elegibilidadDeRenegociacion(desde(14))).toEqual({
      elegible: false, motivo: "ANTICIPACION_INSUFICIENTE",
    });
  });

  it("un horario en el pasado tampoco", () => {
    expect(elegibilidadDeRenegociacion(desde(-60))).toEqual({
      elegible: false, motivo: "ANTICIPACION_INSUFICIENTE",
    });
  });
});

describe("ADR-046 · condición 5 · el mismo día calendario, en la zona institucional", () => {
  it("mover la hora dentro del día acordado es elegible", () => {
    expect(elegibilidadDeRenegociacion(BASE)).toEqual({ elegible: true });
  });

  it("el día siguiente no lo es", () => {
    expect(elegibilidadDeRenegociacion({
      ...BASE, inicioPropuesto: "2026-09-03T19:00:00.000Z",
    })).toEqual({ elegible: false, motivo: "OTRO_DIA_CALENDARIO" });
  });

  /**
   * **Por qué la zona no es un detalle.** Las 02:00 UTC del 3 de septiembre son
   * todavía el 2 de septiembre en Córdoba (UTC−3) y ya son el 3 en Madrid. El
   * mismo instante, dos veredictos: por eso ADR-049 le dio a la institución su
   * propia zona en vez de reusar la del estudiante.
   */
  it("el mismo instante cambia de veredicto según la zona de la institución", () => {
    const cruzando = { ...BASE, inicioPropuesto: "2026-09-03T02:00:00.000Z" };
    expect(elegibilidadDeRenegociacion(cruzando)).toEqual({ elegible: true });
    expect(elegibilidadDeRenegociacion({ ...cruzando, zonaInstitucional: "Europe/Madrid" })).toEqual({
      elegible: false, motivo: "OTRO_DIA_CALENDARIO",
    });
  });

  it("sin horario original no se adivina un día: se rechaza", () => {
    expect(elegibilidadDeRenegociacion({ ...BASE, inicioOriginal: null })).toEqual({
      elegible: false, motivo: "SIN_ACUERDO_ORIGINAL",
    });
  });
});

describe("ADR-046 · el orden del rechazo", () => {
  /**
   * Cuando fallan varias, gana la más estructural. No es estética: la pantalla
   * dice cosas distintas —«ya no puede renegociarse» frente a «elegí otro
   * horario»— y decirle a alguien que corrija la hora de algo que ya empezó
   * sería mandarlo a un callejón sin salida.
   */
  it("el estado gana sobre el horario", () => {
    expect(elegibilidadDeRenegociacion({
      ...BASE, estado: "STARTED", inicioPropuesto: "2026-09-09T19:00:00.000Z",
    })).toEqual({ elegible: false, motivo: "ESTADO_NO_RENEGOCIABLE" });
  });

  it("la cadena gana sobre el horario", () => {
    expect(elegibilidadDeRenegociacion({
      ...BASE, renegociadoDeId: "c-0", inicioPropuesto: "2026-09-09T19:00:00.000Z",
    })).toEqual({ elegible: false, motivo: "CADENA_YA_RENEGOCIADA" });
  });
});
