import { describe, expect, it } from "vitest";

import {
  proyectarActivacion,
  type EstadoDeActivacion,
} from "@/lib/server/servicios/proyeccion-activacion";
import {
  proyectarPreparacion,
  type EstadoDePreparacion,
} from "@/lib/server/servicios/proyeccion-preparacion";
import { proyectarPaso, type EstadoDePaso } from "@/lib/server/servicios/proyeccion-paso";

/**
 * Fase B5 — `UX07`, `UX08` y `UX09` proyectadas desde datos persistidos.
 *
 * Como en `proyeccion-materia.test.ts`, la mitad prueba **lo que las
 * superficies se niegan a decir**. Acá esa mitad importa más que en ninguna
 * otra: un "modo examen" es donde más tira la tentación de mostrar un
 * porcentaje de preparación, y ese número no existe.
 */
const ACTIVACION: EstadoDeActivacion = {
  instante: "2026-09-01T12:00:00.000Z",
  zona: "America/Argentina/Cordoba",
  cursadaId: "ce-1",
  materia: "Análisis II",
  comision: "A",
  evaluaciones: [],
};

const EVAL = {
  id: "ev-1",
  titulo: "Parcial 1",
  fechaEn: "2026-09-15",
  modalidad: "practico",
  fuente: "instructor" as const,
  verificacion: "official" as const,
  tieneProtocolo: true,
  preparacion: { id: "prep-1", status: "RECOMMENDED" },
};

describe("B5 · `UX07` no calcula elegibilidad", () => {
  it("sin señal emitida no hay recomendación, aunque la evaluación esté cerca", () => {
    // `C01-024` sigue abierto: la ventana de 14 días no se calcula acá.
    const p = proyectarActivacion({
      ...ACTIVACION,
      evaluaciones: [{ ...EVAL, preparacion: null }],
    });
    expect(p.estado).toBe("NO_DISPONIBLE");
    expect(p.ctaPrimaria).toBeNull();
    expect(p.preparacionId).toBeNull();
  });

  it("con la señal emitida, la CTA nombra su objeto", () => {
    const p = proyectarActivacion({ ...ACTIVACION, evaluaciones: [EVAL] });
    expect(p.estado).toBe("RECOMENDACION");
    expect(p.ctaPrimaria?.texto).toBe("ACTIVAR PREPARACIÓN DE ESTE EXAMEN");
    expect(p.preparacionId).toBe("prep-1");
  });

  it("ya activa: el estado reemplaza la CTA, sin botón apagado de adorno", () => {
    const p = proyectarActivacion({
      ...ACTIVACION,
      evaluaciones: [{ ...EVAL, preparacion: { id: "prep-1", status: "ACTIVE" } }],
    });
    expect(p.estado).toBe("YA_ACTIVA");
    expect(p.ctaPrimaria).toBeNull();
  });

  it("una modalidad sin protocolo no recibe el de otra", () => {
    const p = proyectarActivacion({
      ...ACTIVACION,
      evaluaciones: [{ ...EVAL, modalidad: "oral", tieneProtocolo: false }],
    });
    expect(p.estado).toBe("FUERA_DE_P0");
    expect(p.ctaPrimaria).toBeNull();
  });

  it("una fecha desconocida no se estima: la fila desaparece", () => {
    const p = proyectarActivacion({
      ...ACTIVACION,
      evaluaciones: [{ ...EVAL, fechaEn: null }],
    });
    expect(p.datos.map((d) => d.label)).not.toContain("Fecha");
    expect(p.faltantes).toContain("Fecha de la evaluación");
  });

  it("la fecha del examen no se corre un día por la zona horaria", () => {
    // `assessment_date` es un `DATE`. Formateado como instante en Córdoba
    // (UTC-3), un Parcial del 15 aparecía como del 14: `new Date("2026-09-15")`
    // es medianoche UTC. Una fecha de examen no tiene hora ni zona.
    const p = proyectarActivacion({ ...ACTIVACION, evaluaciones: [EVAL] });
    expect(p.datos.find((d) => d.label === "Fecha")?.valor).toBe("mar 15 sept");
  });

  it("la provenance no se eleva: un reporte del estudiante lo dice", () => {
    const p = proyectarActivacion({
      ...ACTIVACION,
      evaluaciones: [{ ...EVAL, fuente: "student", verificacion: "unverified" }],
    });
    expect(p.datos[0].provenance).toBe("Reportado por vos · sin verificar");
  });

  it("varias recomendaciones vivas: elige la persona, y la lista no se rankea", () => {
    const p = proyectarActivacion({
      ...ACTIVACION,
      evaluaciones: [
        EVAL,
        { ...EVAL, id: "ev-2", titulo: "Parcial 2", preparacion: { id: "prep-2", status: "RECOMMENDED" } },
      ],
    });
    expect(p.estado).toBe("SELECCION");
    expect(p.opciones?.map((o) => o.evaluacion)).toEqual(["Parcial 1", "Parcial 2"]);
    expect(p.opciones?.every((o) => !o.seleccionada)).toBe(true);
    expect(p.ctaPrimaria).toBeNull();
  });

  it("el enum técnico nunca es copy", () => {
    const p = proyectarActivacion({ ...ACTIVACION, evaluaciones: [EVAL] });
    expect(JSON.stringify(p)).not.toContain("teorico_escrito");
    expect(p.datos.find((d) => d.label === "Modalidad")?.valor).toBe("Práctico");
  });
});

const PREPARACION: EstadoDePreparacion = {
  instante: "2026-09-01T12:00:00.000Z",
  zona: "America/Argentina/Cordoba",
  preparacionId: "prep-1",
  status: "ACTIVE",
  materia: "Análisis II",
  evaluacion: "Parcial 1",
  fechaEn: "2026-09-15",
  modalidad: "practico",
  fuenteEvaluacion: "instructor",
  verificacionEvaluacion: "official",
  protocolo: { version: "EP-SPEC v0.1", alcance: "COMPLETO", contenido: "EP-SPEC" },
  pasos: [
    { id: "p1", canonicalId: "EP-01", label: "Cerrar contrato", requisito: "NO_CONFIGURADA", reentrante: false, vueltas: 1, ultimaEn: "2026-08-30T12:00:00.000Z", esActual: false },
    { id: "p2", canonicalId: "EP-06", label: "Primera prueba sin red", requisito: "NO_CONFIGURADA", reentrante: true, vueltas: 3, ultimaEn: "2026-08-31T12:00:00.000Z", esActual: false },
    { id: "p3", canonicalId: "EP-10", label: "Simulación final", requisito: "NO_CONFIGURADA", reentrante: false, vueltas: 0, ultimaEn: null, esActual: false },
  ],
  accion: null,
  compromiso: null,
  rescatePendiente: false,
  evidencia: "NONE",
  ultimoProgresoEn: null,
  readiness: null,
};

describe("B5 · `UX08` no afirma readiness", () => {
  it("no hay score, ni porcentaje, ni card de readiness", () => {
    const p = proyectarPreparacion(PREPARACION);
    const serializado = JSON.stringify(p);
    expect(serializado).not.toMatch(/READY_BY_PROTOCOL|NOT_READY|BUILDING/);
    expect(serializado).not.toMatch(/\d+\s*%/);
  });

  it("una preparación recomendada no se anuncia como activa", () => {
    // Sin objeto de precedencia, lo dominante es el estado — y decir
    // "PREPARACIÓN ACTIVA" sobre una `RECOMMENDED` afirma una activación que el
    // estudiante no hizo.
    const p = proyectarPreparacion({ ...PREPARACION, status: "RECOMMENDED" });
    expect(p.estadoDominante).toBe("PREPARACIÓN RECOMENDADA");
    expect(proyectarPreparacion(PREPARACION).estadoDominante).toBe("PREPARACIÓN ACTIVA");
  });

  it("el status recibido viaja con su descargo, no solo", () => {
    const p = proyectarPreparacion(PREPARACION);
    expect(p.statusRecibido?.valor).toBe("ACTIVE");
    expect(p.statusRecibido?.descargo).toContain("no un pronóstico");
  });

  it("nunca se dice «listo para rendir»", () => {
    for (const status of ["ACTIVE", "EXAM_TAKEN", "CLOSED"]) {
      const p = proyectarPreparacion({ ...PREPARACION, status });
      expect(JSON.stringify(p)).not.toMatch(/listo para rendir/i);
    }
  });
});

describe("B5 · `UX08` y el recorrido reentrante", () => {
  it("no se muestra «paso 2 de 3» ni una posición", () => {
    const p = proyectarPreparacion(PREPARACION);
    expect(JSON.stringify(p)).not.toMatch(/[Pp]aso\s+\d+\s+de\s+\d+/);
  });

  it("sin `current_step_id` ningún paso es el actual, y el aviso lo dice", () => {
    const p = proyectarPreparacion(PREPARACION);
    expect(p.recorrido?.some((r) => r.estado === "ACTUAL")).toBe(false);
    expect(p.aviso).toBe("Todavía no hay un paso para abrir.");
  });

  it("un paso con tres vueltas es CONFIRMADO, no una recaída", () => {
    const p = proyectarPreparacion(PREPARACION);
    const paso = p.recorrido!.find((r) => r.label === "Primera prueba sin red");
    expect(paso?.estado).toBe("CONFIRMADO");
    // Ninguna palabra de incumplimiento sobre una repetición (§8.2).
    expect(JSON.stringify(p)).not.toMatch(/retroced|recaíd|volviste atrás|incumpl/i);
  });

  it("«volviste sobre» y no «repetiste»", () => {
    const p = proyectarPreparacion(PREPARACION);
    const fila = p.pendiente.find((f) => f.label === "Volviste sobre");
    expect(fila?.valor).toBe("Primera prueba sin red");
    expect(JSON.stringify(p)).not.toMatch(/repetiste/i);
  });

  it("las vueltas no se presentan como progreso confirmado", () => {
    // Completar un paso no es un `ProgressUpdated` (`product.md` §5.6).
    expect(proyectarPreparacion(PREPARACION).cambioConfirmado).toEqual([]);
  });

  it("sin ningún paso trabajado, «todavía ninguno» y no un cero", () => {
    const p = proyectarPreparacion({
      ...PREPARACION,
      pasos: PREPARACION.pasos.map((s) => ({ ...s, vueltas: 0, ultimaEn: null })),
    });
    const fila = p.pendiente.find((f) => f.label === "Pasos trabajados");
    expect(fila?.valor).toBe("Todavía ninguno");
    expect(fila?.ausencia).toBe("CERO_REAL");
  });

  it("el contenido provisional se declara como provisional en la pantalla", () => {
    const p = proyectarPreparacion(PREPARACION);
    expect(p.secundarios.join(" ")).toContain("provisional");
  });

  it("un contenido confirmado no arrastra el descargo del provisional", () => {
    const p = proyectarPreparacion({
      ...PREPARACION,
      protocolo: { version: "HUMAN-P0-01 v1.0", alcance: "COMPLETO", contenido: "HUMAN-P0-01" },
    });
    expect(p.secundarios.join(" ")).not.toContain("provisional");
  });
});

const PASO: EstadoDePaso = {
  instante: "2026-09-01T12:00:00.000Z",
  zona: "America/Argentina/Cordoba",
  preparacionId: "prep-1",
  status: "ACTIVE",
  materia: "Análisis II",
  evaluacion: "Parcial 1",
  modalidad: "practico",
  pasoId: "p2",
  label: "Primera prueba sin red",
  objetivo: "Retirar ayudas y comprobar recuperación.",
  explicacion: null,
  entregable: "Evidencia de desempeño autónomo.",
  criterio: null,
  requisito: "NO_CONFIGURADA",
  reentrante: true,
  version: "EP-SPEC v0.1",
  contenido: "EP-SPEC",
  contenidoVersion: "v0.1",
  vueltas: [
    { occurrence: 2, completadoEn: "2026-08-31T12:00:00.000Z", tema: "Series" },
    { occurrence: 1, completadoEn: "2026-08-29T12:00:00.000Z", tema: "Series" },
  ],
  accion: null,
  compromiso: null,
  evidencia: "NONE",
};

describe("B5 · `UX09` renderiza contenido recibido", () => {
  it("un bloque sin contenido muestra su ausencia, no una versión generada", () => {
    const p = proyectarPaso(PASO);
    expect(p.explicacion.valor).toBeNull();
    expect(p.explicacion.ausencia).toBe("Este paso no tiene una explicación configurada.");
    // Cada bloque tiene su propia frase: no se colapsan en una sola.
    const frases = [p.objetivo, p.explicacion, p.entregable, p.criterio].map((b) => b.ausencia);
    expect(new Set(frases).size).toBe(4);
  });

  it("abrir el paso no lo completa, y la pantalla lo dice", () => {
    expect(proyectarPaso(PASO).avisoDeApertura).toBe("Abriste este paso. Abrirlo no lo completa.");
  });

  it("las vueltas se cuentan sin llamarlas repeticiones", () => {
    const p = proyectarPaso(PASO);
    expect(p.secundarios.join(" ")).toContain("Lo trabajaste 2 veces");
    expect(p.secundarios.join(" ")).toContain("Sobre: Series");
    expect(JSON.stringify(p)).not.toMatch(/repetiste|retroced|recaíd/i);
  });

  it("un paso reentrante dice que se puede volver a trabajar", () => {
    expect(proyectarPaso(PASO).secundarios.join(" ")).toContain("volver a trabajar");
  });

  it("un paso no reentrante no lo promete", () => {
    const p = proyectarPaso({ ...PASO, reentrante: false, vueltas: [] });
    expect(p.secundarios.join(" ")).not.toContain("volver a trabajar");
  });

  it("sin recurso configurado se dice, y no es un bloqueo", () => {
    const p = proyectarPaso(PASO);
    expect(p.recurso).toBeNull();
    expect(p.avisoRecurso).toBe("Este paso no tiene un recurso configurado.");
    expect(p.nivel).toBe(11);
  });

  it("la procedencia del contenido se declara en la pantalla", () => {
    expect(proyectarPaso(PASO).fuenteDelContenido).toContain("provisional");
    expect(
      proyectarPaso({ ...PASO, contenido: "HUMAN-P0-01", contenidoVersion: "v1.0" })
        .fuenteDelContenido,
    ).toContain("Criterio profesional confirmado");
  });

  it("no se muestra la posición del paso en el protocolo", () => {
    expect(JSON.stringify(proyectarPaso(PASO))).not.toMatch(/[Pp]aso\s+\d+\s+de\s+\d+/);
  });
});
