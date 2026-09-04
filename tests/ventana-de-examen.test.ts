import { describe, expect, it } from "vitest";

import { DIAS_DE_VENTANA, ventanaDeExamen } from "@/lib/domain/ventana-de-examen";

/**
 * [ADR-048](../docs/decisions.md#adr-048), decidido por el Product Owner el 4
 * de septiembre de 2026. Fuente literal:
 * `respuesta-po-decisiones-abiertas-source.md` §5.
 */

const ZONA = "America/Argentina/Cordoba";
/** 21:00 de Córdoba del 4 de septiembre. */
const AHORA = "2026-09-05T00:00:00.000Z";

const ventana = (fechaDeExamen: string | null, ahora = AHORA, zonaInstitucional = ZONA) =>
  ventanaDeExamen({ fechaDeExamen, ahora, zonaInstitucional });

describe("ADR-048 · los catorce días incluyen el día 14", () => {
  it("el día 14 entra", () => {
    expect(ventana("2026-09-18")).toEqual({ recomendar: true, diasRestantes: DIAS_DE_VENTANA });
  });

  it("el día 15 no", () => {
    expect(ventana("2026-09-19")).toEqual({
      recomendar: false, motivo: "TODAVIA_LEJOS", diasRestantes: 15,
    });
  });

  it("el día del examen todavía cuenta", () => {
    expect(ventana("2026-09-04")).toEqual({ recomendar: true, diasRestantes: 0 });
  });

  it("el día después ya no: conocida, pero no vigente", () => {
    expect(ventana("2026-09-03")).toEqual({
      recomendar: false, motivo: "FECHA_PASADA", diasRestantes: -1,
    });
  });
});

describe("ADR-048 · sin fecha no se emite, y no se inventa una", () => {
  it("una evaluación sin fecha no recomienda nada", () => {
    expect(ventana(null)).toEqual({ recomendar: false, motivo: "SIN_FECHA", diasRestantes: null });
  });

  /**
   * `SIN_FECHA` es un motivo propio y no se confunde con `TODAVIA_LEJOS`: uno
   * dice *no sabemos*, el otro dice *todavía no*. Colapsarlos sería el primer
   * paso hacia estimar la fecha que falta.
   */
  it("y su motivo no se confunde con el de una fecha lejana", () => {
    expect(ventana(null)).not.toMatchObject({ motivo: "TODAVIA_LEJOS" });
  });
});

describe("ADR-048 · el cálculo usa la zona institucional (ADR-049)", () => {
  /**
   * A las 02:00 UTC del 5 de septiembre todavía es 4 de septiembre en Córdoba y
   * ya es 5 en Madrid. Contra un examen del 18, eso son 14 días o 13: la
   * diferencia entre recomendar y no recomendar está en la zona.
   */
  it("el mismo instante da distinto día restante según la zona", () => {
    const instante = "2026-09-05T02:00:00.000Z";
    expect(ventana("2026-09-18", instante)).toEqual({ recomendar: true, diasRestantes: 14 });
    expect(ventana("2026-09-18", instante, "Europe/Madrid")).toEqual({
      recomendar: true, diasRestantes: 13,
    });
    // Y el borde se corre entero: contra un examen del 19, Córdoba queda afuera
    // y Madrid adentro.
    expect(ventana("2026-09-19", instante)).toMatchObject({ recomendar: false });
    expect(ventana("2026-09-19", instante, "Europe/Madrid")).toMatchObject({ recomendar: true });
  });

  /**
   * Entre el 4 de septiembre y el 18 hay un cambio de horario en Madrid
   * — no, pero sí lo hay en octubre, y el cálculo tiene que sobrevivirlo.
   * Se cuenta sobre días calendario, no sobre milisegundos.
   */
  it("un cambio de horario de verano en el medio no corre el borde", () => {
    // Madrid pasa a horario de invierno el 25 de octubre de 2026.
    const antes = "2026-10-20T10:00:00.000Z";
    expect(ventana("2026-11-03", antes, "Europe/Madrid")).toEqual({
      recomendar: true, diasRestantes: 14,
    });
    expect(ventana("2026-11-04", antes, "Europe/Madrid")).toMatchObject({
      recomendar: false, diasRestantes: 15,
    });
  });
});

describe("ADR-048 · lo que la ventana NO mira", () => {
  /**
   * *"La ventana automática no depende de `PreparationReadiness`: los umbrales
   * de readiness continúan abiertos y no deben bloquear este disparador"*.
   *
   * El guard es la firma: si algún día alguien agrega readiness a la entrada,
   * este test deja de compilar y la conversación vuelve a abrirse.
   */
  it("la entrada tiene exactamente tres campos, y ninguno es readiness", () => {
    const entrada = { fechaDeExamen: "2026-09-18", ahora: AHORA, zonaInstitucional: ZONA };
    expect(Object.keys(entrada).sort()).toEqual(["ahora", "fechaDeExamen", "zonaInstitucional"]);
    expect(ventanaDeExamen(entrada)).toMatchObject({ recomendar: true });
  });
});
