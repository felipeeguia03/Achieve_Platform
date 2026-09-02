import { describe, expect, it } from "vitest";

import {
  activar,
  completarPaso,
  nombreDeEventoDePreparacion,
  proponerReentrada,
  replanificar,
  responderReentrada,
  transicionar,
  type Preparacion,
  type RepositorioDePreparaciones,
} from "@/lib/server/servicios/preparacion";
import type { EventoDeProducto, PublicadorDeEventos } from "@/lib/server/servicios/eventos";
import { examPreparationTransitions } from "@/lib/domain/state-machines";
import type { ExamPreparationStatus } from "@/lib/domain/types";

/**
 * Fase B5 — Service de `ExamPreparation`, con Repository falso (§3.7).
 *
 * La mitad de este archivo prueba **lo que activar no hace**. No es exceso de
 * celo: `product.md` §5.4 lo enumera —ni Action, ni Commitment, ni Evidence, ni
 * progreso, ni readiness— porque es exactamente lo que un implementador haría
 * de más al construir un "modo examen".
 */
function falso(
  estado: ExamPreparationStatus,
  opciones: { sinProtocolo?: boolean; seLoLlevanOtro?: boolean; rechaza?: string } = {},
) {
  let fila: Preparacion | null = {
    id: "prep-1",
    institutionId: "inst-A",
    state: estado,
    assessmentId: "ev-1",
    examProtocolId: null,
  };
  const escrituras: Array<{ nuevo: ExamPreparationStatus; columnas?: object }> = [];
  const completions: unknown[] = [];
  const publicados: EventoDeProducto[] = [];
  let vuelta = 0;

  const repo: RepositorioDePreparaciones = {
    async porId(inst, id) {
      if (!fila || fila.institutionId !== inst || fila.id !== id) return null;
      return { ...fila };
    },
    async cambiarEstadoSi(inst, id, esperado, nuevo, columnas) {
      escrituras.push({ nuevo, columnas });
      if (opciones.seLoLlevanOtro) return null;
      if (!fila || fila.institutionId !== inst || fila.state !== esperado) return null;
      fila = { ...fila, state: nuevo };
      return { ...fila };
    },
    async protocoloVigente() {
      return opciones.sinProtocolo ? null : { id: "proto-1", version: "EP-SPEC v0.1" };
    },
    async completarPaso(entrada) {
      completions.push(entrada);
      if (opciones.rechaza) return { estado: "RECHAZADO", motivo: opciones.rechaza };
      vuelta += 1;
      return { estado: "OK", completionId: `c-${vuelta}`, vuelta, duplicado: false };
    },
    async replanificar() {
      return { estado: "OK", versionId: "version-2", version: 2, duplicado: false };
    },
    async proponerReentrada() {
      return { estado: "OK", propuestaId: "propuesta-1", duplicado: false };
    },
    async responderReentrada(entrada) {
      return {
        estado: "OK",
        status: entrada.decision === "PEDIR_OTRA_OPCION" ? "ALTERNATIVE_REQUESTED" : "ACCEPTED",
        pasoActualId: entrada.decision === "PEDIR_OTRA_OPCION" ? "paso-18" : "paso-12",
      };
    },
  };
  const eventos: PublicadorDeEventos = {
    async publicar(e) {
      publicados.push(e);
    },
  };
  return { deps: { repo, eventos }, escrituras, completions, publicados, actual: () => fila };
}

describe("B5 · la máquina de `ExamPreparation` después de ADR-011", () => {
  it("no queda ningún estado de readiness en el lifecycle", () => {
    const estados = Object.keys(examPreparationTransitions);
    for (const prohibido of ["BUILDING", "READY_BY_PROTOCOL", "NOT_READY"]) {
      expect(estados, `${prohibido} sigue en el lifecycle`).not.toContain(prohibido);
    }
  });

  it("ninguna transición prohibida llega a escribir", async () => {
    const estados = Object.keys(examPreparationTransitions) as ExamPreparationStatus[];
    for (const desde of estados) {
      for (const hacia of estados) {
        if (examPreparationTransitions[desde].includes(hacia)) continue;
        const { deps, escrituras } = falso(desde);
        const r = await transicionar(deps, "inst-A", "prep-1", hacia);
        expect(r.estado, `${desde}->${hacia}`).toBe("TRANSICION_PROHIBIDA");
        expect(escrituras, `${desde}->${hacia} tocó la base`).toHaveLength(0);
      }
    }
  });

  it("`BLOCKED` no tiene salida, y no se le inventa una", () => {
    // El diagrama de §5.4 no dibuja el retorno y `C01-025` sigue OPEN.
    expect(examPreparationTransitions.BLOCKED).toEqual([]);
  });

  it("abandonar conserva el historial: es un estado, no un borrado", async () => {
    const { deps, actual } = falso("ACTIVE");
    const r = await transicionar(deps, "inst-A", "prep-1", "EXPLICITLY_ABANDONED");
    expect(r.estado).toBe("OK");
    expect(actual()).not.toBeNull();
    expect(actual()!.state).toBe("EXPLICITLY_ABANDONED");
  });
});

describe("B5 · activar produce ACTIVE y nada más", () => {
  it("escribe el estado, la fecha y la versión del protocolo, y nada más", async () => {
    const { deps, escrituras } = falso("RECOMMENDED");
    const r = await activar(deps, "inst-A", "prep-1", "est-1");
    expect(r.estado).toBe("OK");
    expect(escrituras).toHaveLength(1);
    expect(escrituras[0].nuevo).toBe("ACTIVE");
    // Dos columnas: si aparece una tercera, alguien está creando algo al activar.
    expect(Object.keys(escrituras[0].columnas ?? {}).sort()).toEqual([
      "activated_at",
      "exam_protocol_id",
    ]);
  });

  it("no crea Action, Commitment, Evidence, progreso ni readiness", async () => {
    // El Service sólo conoce dos colaboradores, y ninguno de los dos puede
    // crear esas cosas. El guard real es que el Repository no expone forma de
    // hacerlo: lo que no está en la interfaz no se puede llamar por descuido.
    const { deps, completions } = falso("RECOMMENDED");
    await activar(deps, "inst-A", "prep-1", "est-1");
    expect(completions).toHaveLength(0);
    expect(Object.keys(deps.repo).sort()).toEqual([
      "cambiarEstadoSi",
      "completarPaso",
      "porId",
      "proponerReentrada",
      "protocoloVigente",
      "replanificar",
      "responderReentrada",
    ]);
  });

  it("publica `ExamPreparationActivated`, después de que la escritura ganó", async () => {
    const { deps, publicados } = falso("RECOMMENDED");
    await activar(deps, "inst-A", "prep-1", "est-1");
    expect(publicados.map((e) => e.nombre)).toEqual(["ExamPreparationActivated"]);
  });

  it("si otro se adelantó, no publica nada", async () => {
    const { deps, publicados } = falso("RECOMMENDED", { seLoLlevanOtro: true });
    const r = await activar(deps, "inst-A", "prep-1", "est-1");
    expect(r.estado).toBe("CONFLICTO");
    expect(publicados).toEqual([]);
  });

  it("sin protocolo para la modalidad no activa, y no escribe", async () => {
    const { deps, escrituras, publicados } = falso("RECOMMENDED", { sinProtocolo: true });
    const r = await activar(deps, "inst-A", "prep-1", "est-1");
    expect(r.estado).toBe("SIN_PROTOCOLO");
    expect(escrituras).toEqual([]);
    expect(publicados).toEqual([]);
  });

  it("una preparación que ya está ACTIVE no se vuelve a activar", async () => {
    const { deps, publicados } = falso("ACTIVE");
    const r = await activar(deps, "inst-A", "prep-1", "est-1");
    expect(r.estado).toBe("TRANSICION_PROHIBIDA");
    expect(publicados).toEqual([]);
  });
});

describe("B5 · completar un paso, varias veces", () => {
  it("cada vuelta publica su propio `ProtocolStepCompleted`", async () => {
    const { deps, publicados } = falso("ACTIVE");
    const entrada = {
      institutionId: "inst-A",
      preparacionId: "prep-1",
      pasoId: "paso-1",
      topicId: "tema-1",
      confirmadoPor: "est-1",
    };
    await completarPaso(deps, entrada);
    await completarPaso(deps, entrada);

    expect(publicados.map((e) => e.nombre)).toEqual([
      "ProtocolStepCompleted",
      "ProtocolStepCompleted",
    ]);
    // La vuelta viaja en el hecho: sin esto, dos completions del mismo paso son
    // indistinguibles y la repetición se vuelve trabajo invisible.
    expect(publicados.map((e) => e.causa)).toEqual(["vuelta:1", "vuelta:2"]);
  });

  it("el tema viaja en el payload: «volviste sobre Series», no «repetiste el paso»", async () => {
    const { deps, publicados } = falso("ACTIVE");
    await completarPaso(deps, {
      institutionId: "inst-A",
      preparacionId: "prep-1",
      pasoId: "paso-1",
      topicId: "tema-1",
      confirmadoPor: "est-1",
    });
    expect(publicados[0].payload).toMatchObject({ pasoId: "paso-1", temaId: "tema-1", vuelta: 1 });
  });

  it("un rechazo del dominio no publica nada", async () => {
    const { deps, publicados } = falso("ACTIVE", { rechaza: "el paso no es reentrante" });
    const r = await completarPaso(deps, {
      institutionId: "inst-A",
      preparacionId: "prep-1",
      pasoId: "paso-1",
      topicId: null,
      confirmadoPor: "est-1",
    });
    expect(r.estado).toBe("RECHAZADO");
    expect(publicados).toEqual([]);
  });
});

describe("B5 · los nombres de evento", () => {
  it("`ACTIVE` produce el nombre del P0, no uno derivado del estado", () => {
    expect(nombreDeEventoDePreparacion("ACTIVE")).toBe("ExamPreparationActivated");
  });

  it("los otros destinos llevan el nombre de su estado", () => {
    expect(nombreDeEventoDePreparacion("EXAM_TAKEN")).toBe("ExamPreparationExamTaken");
    expect(nombreDeEventoDePreparacion("EXPLICITLY_ABANDONED")).toBe(
      "ExamPreparationExplicitlyAbandoned",
    );
  });
});

describe("B6.7.4 · replanificar y volver", () => {
  it("replanificar publica una versión nueva dentro de la misma preparación", async () => {
    const { deps, publicados } = falso("ACTIVE");
    const r = await replanificar(deps, {
      institutionId: "inst-A",
      studentId: "est-1",
      preparacionId: "prep-1",
      motivo: "Cambió la fecha del mismo examen",
      nuevaFecha: "2026-10-10",
      creadoPor: "est-1",
    });
    expect(r).toMatchObject({ estado: "OK", version: 2 });
    expect(publicados[0]).toMatchObject({
      nombre: "ExamPreparationReplanned",
      sujetoTipo: "exam_preparation_plan_version",
    });
  });

  it("proponer y pedir otra opción son hechos distintos", async () => {
    const { deps, publicados } = falso("REPLANNED");
    const propuesta = await proponerReentrada(deps, {
      institutionId: "inst-A",
      preparacionId: "prep-1",
      desdePasoId: "paso-15",
      haciaPasoId: "paso-12",
      motivoCanonico: "EVIDENCIA_INSUFICIENTE",
      justificacion: "Hace falta revisar el plan.",
      actividad: "Plan de resolución",
      evidenciaVigente: "Lo anterior sigue vigente.",
      propuestaPor: null,
    });
    expect(propuesta.estado).toBe("OK");
    await responderReentrada(deps, {
      institutionId: "inst-A",
      studentId: "est-1",
      propuestaId: "propuesta-1",
      decision: "PEDIR_OTRA_OPCION",
      respondidaPor: "est-1",
    });
    expect(publicados.map((e) => e.nombre)).toEqual([
      "ProtocolReentryProposed",
      "ProtocolReentryAlternativeRequested",
    ]);
  });
});
