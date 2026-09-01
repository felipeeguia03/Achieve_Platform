import { describe, expect, it } from "vitest";

import {
  proyectarMateria,
  type EstadoDeMateria,
} from "@/lib/server/servicios/proyeccion-materia";

/**
 * Etapa B2.6 — `UX02` proyectada desde datos persistidos.
 *
 * La mitad de este archivo prueba **lo que la superficie se niega a decir**. No
 * es exceso de celo: las tres afirmaciones que no hace son exactamente las que
 * saldrían solas de leer el schema sin leer la spec.
 */
const base: EstadoDeMateria = {
  instante: "2026-08-31T15:00:00.000Z",
  zona: "America/Argentina/Cordoba",
  cursadaId: "ce-syn-1",
  materia: "Análisis Matemático II",
  examen: null,
  accion: null,
  compromiso: null,
  rescatePendiente: false,
  evidencia: "NONE",
  contextoIncompleto: false,
  ultimoAvanceEn: null,
  unidades: [],
  dimensiones: null,
  actividadReciente: [],
};

const conAccion: EstadoDeMateria = {
  ...base,
  accion: {
    status: "RECOMMENDED",
    objetivo: "Resolver la guía de integrales",
    unidad: "Unidad 3",
    razon: "Entra en Parcial 1.",
    minutosMin: 30,
    minutosMax: 45,
    evidenciaEsperada: "Producción de la práctica",
    criterioCierre: null,
    bloqueoRazon: null,
  },
};

const conProgreso: EstadoDeMateria = {
  ...conAccion,
  ultimoAvanceEn: "2026-08-29T12:00:00.000Z",
  unidades: [
    { codigo: "U1", nombre: "Integrales", ultimoAvanceEn: "2026-08-29T12:00:00.000Z", dominio: "not_evaluated", practica: "value", recorrido: "value" },
    { codigo: "U2", nombre: "Series", ultimoAvanceEn: null, dominio: "not_evaluated", practica: "no_information", recorrido: "no_information" },
  ],
  dimensiones: {
    unidades: 2,
    dominioMedido: 0,
    dominioNoEval: 2,
    practicaMedida: 1,
    recorridoMedido: 1,
    confianzaEn: "2026-08-30T12:00:00.000Z",
  },
};

describe("B2.6 · la materia no afirma lo que no puede sostener", () => {
  it("no muestra chip de estado: sin Risk Engine nadie la evaluó", () => {
    expect(proyectarMateria(conProgreso).chip).toBeNull();
  });

  it("ninguna dimensión medida se muestra con su número", () => {
    // `practice_value` y `exposure_value` son NUMERIC sin unidad (`C01-019`).
    // La fila se OMITE: mostrar `12` no dice nada y "12 ejercicios" inventa.
    const dims = proyectarMateria(conProgreso).dimensiones;
    const labels = dims.map((d) => d.label);
    expect(labels).not.toContain("Práctica");
    expect(labels).not.toContain("Recorrido");
    // Y ningún valor proyectado contiene una cifra suelta de progreso.
    for (const d of dims) expect(String(d.valor)).not.toMatch(/^\d+(\.\d+)?$/);
  });

  it("no deriva la brecha entre confianza y dominio", () => {
    // `VI.2` §8.4: la brecha la entrega el Student Model (`C01-043`, OPEN);
    // la vista **no compara umbrales**.
    expect(proyectarMateria(conProgreso).estado).not.toBe("CONFIANZA_VS_DOMINIO");
  });

  it("la confianza viaja con su fecha y sin su nivel", () => {
    const conf = proyectarMateria(conProgreso).dimensiones.find((d) => d.label === "Confianza");
    expect(conf?.valor).toBe("declarada ayer");
    // "alta" / "baja" serían un umbral que nadie aprobó.
    expect(String(conf?.valor)).not.toMatch(/alta|baja|media/i);
  });

  it("no ofrece captura de clase ni columnas de cátedra sin `C01-004`", () => {
    const p = proyectarMateria(conProgreso);
    expect(p.catedraYVos).toBeNull();
    expect(p.capturaDeClase).toBeNull();
  });
});

describe("B2.6 · las ausencias se distinguen entre sí", () => {
  it("«no evaluado» y «sin información» no son la misma frase", () => {
    const dims = proyectarMateria(conProgreso).dimensiones;
    const dominio = dims.find((d) => d.label === "Dominio");
    expect(dominio?.valor).toBe("no evaluado");
    expect(dominio?.ausencia).toBe("SIN_ASIGNAR");
  });

  it("sin ninguna unidad medida, las tres dimensiones aparecen como ausencia", () => {
    const dims = proyectarMateria({
      ...conAccion,
      dimensiones: { unidades: 3, dominioMedido: 0, dominioNoEval: 3, practicaMedida: 0, recorridoMedido: 0, confianzaEn: null },
    }).dimensiones;
    expect(dims.map((d) => d.label)).toEqual(["Recorrido", "Práctica", "Dominio", "Recencia"]);
    expect(dims.every((d) => d.ausencia === "SIN_ASIGNAR")).toBe(true);
  });

  it("una unidad sin registro no dice «hace 0 días»", () => {
    const u = proyectarMateria(conProgreso).unidades;
    expect(u[1].valor).toBe("Sin avance registrado");
    expect(u[1].ausencia).toBe("SIN_ASIGNAR");
  });

  it("sin unidades declaradas no se inventan dimensiones", () => {
    expect(proyectarMateria(base).dimensiones).toEqual([]);
  });
});

describe("B2.6 · lo que sí es un hecho", () => {
  it("la evaluación sin fecha conserva su título y no se le estima una", () => {
    const p = proyectarMateria({ ...base, examen: { titulo: "Parcial 1", fechaEn: null } });
    expect(p.examen).toBe("Parcial 1");
  });

  it("la evaluación con fecha la muestra sin correrla un día", () => {
    // Este test decía sólo `/.*sep/` y por eso no vio el bug durante dos fases:
    // `assessment_date` es un `DATE` y se estaba formateando como instante en
    // la zona del estudiante, así que un examen del 10 salía como del 9.
    const p = proyectarMateria({ ...base, examen: { titulo: "Parcial 1", fechaEn: "2026-09-10" } });
    expect(p.examen).toBe("Parcial 1 · jue 10 sept");
  });

  it("sin contexto de cursado, el estado lo dice y el aviso no lo repite", () => {
    const p = proyectarMateria({ ...base, contextoIncompleto: true });
    expect(p.estado).toBe("CONTEXTO_INCOMPLETO");
    expect(p.hero.nivel).toBe("CONTEXT_INCOMPLETE");
    expect(p.aviso).toBeNull();
  });

  it("sin Action viva, el estado es SIN_RECOMENDACION y no se inventa una", () => {
    const p = proyectarMateria(base);
    expect(p.estado).toBe("SIN_RECOMENDACION");
    expect(p.hero.titulo).toBeNull();
  });

  it("la precedencia es la misma de `UX01`: un rescate gana sobre la recomendación", () => {
    expect(proyectarMateria({ ...conAccion, rescatePendiente: true }).hero.nivel).toBe(
      "RESCUE_REQUIRED",
    );
  });
});

describe("B2.6 · la forma es la que la pantalla espera", () => {
  it("devuelve exactamente las claves de `MateriaProps`", () => {
    expect(Object.keys(proyectarMateria(conProgreso)).sort()).toEqual(
      [
        "actividadReciente",
        "aviso",
        "capturaDeClase",
        "catedraYVos",
        "chip",
        "dimensiones",
        "estado",
        "examen",
        "hero",
        "materia",
        "ultimoAvance",
        "unidades",
      ].sort(),
    );
  });
});
