import { describe, expect, it } from "vitest";

import {
  observarError,
  type ErrorObservado,
  type ObservacionPersistida,
  type RepositorioDeReiteracion,
} from "@/lib/server/servicios/reiteracion";
import type { EventoDeProducto, PublicadorDeEventos } from "@/lib/server/servicios/eventos";
import type { EntradaDeAuditoria } from "@/lib/server/servicios/auditoria";
import type { RepositorioDeSenales, Senal } from "@/lib/server/servicios/riesgo";
import type { RiskSignalStatus } from "@/lib/domain/types";

/**
 * El recorrido del MVP, de punta a punta — Etapa B6.5,
 * [ADR-036](../docs/decisions.md#adr-036).
 *
 * ⚠️ **PROVISIONAL — REQUIRES POST-MVP HUMAN VALIDATION.**
 *
 * El estudiante se equivoca, repite el error, recibe una acción correctiva,
 * vuelve a equivocarse — y el sistema **produce una señal que pide una
 * persona**, sin que nadie la haya mirado. Es lo que la Fase B6 dejó imposible
 * a propósito hasta que alguien cerrara el umbral.
 */
const CONFIG = {
  apariciones: { atencion: 2, intervencion: 3 },
  reincidencia_tras_correctiva: "intervencion",
  reinicia_con_resolucion_limpia: true,
  solo_corroboradas: true,
};

function mundo(opciones: { sinUmbral?: boolean } = {}) {
  const observaciones: ObservacionPersistida[] = [];
  const senales = new Map<string, Senal>();
  const publicados: EventoDeProducto[] = [];
  const auditado: EntradaDeAuditoria[] = [];
  const claves = new Map<string, string>();
  let reloj = 0;
  let n = 0;

  const repo: RepositorioDeReiteracion = {
    async registrarObservacion(e) {
      reloj++;
      observaciones.push({
        kind: e.kind,
        corroborated: e.corroborated,
        observedAt: `2026-09-0${reloj}T10:00:00.000Z`,
        trasAccionCorrectiva: (e.afterActionId ?? null) !== null,
        errorTypeId: e.errorTypeId,
        etiqueta: "Error de procedimiento",
      });
      return { id: `obs-${observaciones.length}`, duplicado: false };
    },
    async reglaVigente(canonicalId) {
      return {
        id: "regla-1",
        canonicalId,
        version: "v2.0-po-provisional",
        signalType: "error_reiterado",
        thresholdConfig: opciones.sinUmbral ? null : CONFIG,
      };
    },
    async observaciones() {
      return observaciones;
    },
    async preparacion() {
      return { studentId: "est-1", courseEnrollmentId: "ce-1" };
    },
  };

  const repoSenales: RepositorioDeSenales = {
    async porId(_i, id) {
      return senales.get(id) ?? null;
    },
    async cambiarEstadoSi(_i, id, esperado, nuevo) {
      const s = senales.get(id);
      if (!s || s.state !== esperado) return null;
      const next = { ...s, state: nuevo as RiskSignalStatus };
      senales.set(id, next);
      return next;
    },
    async registrar(e) {
      const clave = e.claveDeIdempotencia;
      if (clave && claves.has(clave)) return { id: claves.get(clave)!, duplicado: true };
      n++;
      const id = `s-${n}`;
      senales.set(id, {
        id,
        institutionId: e.institutionId,
        state: "OPEN",
        studentId: e.studentId,
        severity: e.severity,
        reason: e.reason,
      });
      if (clave) claves.set(clave, id);
      return { id, duplicado: false };
    },
    async resolver() {
      return { resuelta: false, motivo: null };
    },
  };

  const eventos: PublicadorDeEventos = { async publicar(e) { publicados.push(e); } };
  const auditor = { async registrar(e: EntradaDeAuditoria) { auditado.push(e); } };

  const base: ErrorObservado = {
    institutionId: "inst-A",
    examPreparationId: "prep-1",
    errorTypeId: "tipo-procedimiento",
    kind: "error",
    corroborated: true,
  };

  return {
    deps: { repo, senales: repoSenales, eventos, auditor },
    base,
    senales,
    publicados,
    auditado,
  };
}

describe("MVP · el recorrido completo, sin que nadie mire", () => {
  it("error → error → correctiva → error = una señal que pide una persona", async () => {
    const m = mundo();

    // 1. Se equivoca por primera vez. No pasa nada, y está bien.
    const uno = await observarError(m.deps, m.base);
    expect(uno).toMatchObject({ estado: "OK" });
    expect(uno.estado === "OK" && uno.evaluacion.estado).toBe("SIN_SENAL");

    // 2. Repite el mismo tipo de error. Aparece la primera señal, de atención.
    const dos = await observarError(m.deps, m.base);
    const evalDos = dos.estado === "OK" ? dos.evaluacion : null;
    expect(evalDos).toMatchObject({ estado: "OK", apariciones: 2, necesitaPersona: false });
    expect([...m.senales.values()][0]).toMatchObject({
      severity: "atencion",
      // Todavía nadie tiene que hacer nada: queda abierta.
      state: "OPEN",
    });

    // 3. Recibe una acción correctiva y **vuelve a fallar contra ella**.
    const tres = await observarError(m.deps, { ...m.base, afterActionId: "accion-correctiva" });
    const evalTres = tres.estado === "OK" ? tres.evaluacion : null;
    expect(evalTres).toMatchObject({ estado: "OK", necesitaPersona: true });

    // 4. La señal pide una persona, y nadie la miró: la produjo la regla.
    const ultima = [...m.senales.values()].at(-1)!;
    expect(ultima.severity).toBe("intervencion");
    expect(ultima.state).toBe("INTERVENTION_REQUIRED");
    expect(ultima.reason).toContain("volvió a aparecer después de una acción correctiva");

    // 5. Y quedó registrado como hecho del sistema, no de una persona.
    const creadas = m.publicados.filter((e) => e.nombre === "RiskSignalCreated");
    expect(creadas).toHaveLength(2);
    expect(creadas.every((e) => e.actorId === null)).toBe(true);
    expect(m.publicados.map((e) => e.nombre)).toContain("RiskSignalInterventionRequired");
    expect(m.auditado.map((a) => a.accion)).toContain("risk_signal.transition");
  });

  it("reprocesar la misma evidencia no duplica la señal", async () => {
    // "Las señales no deben duplicarse por reprocesamiento del mismo evento o
    // evidencia." La clave incluye el conteo: mismo conteo, misma señal.
    const m = mundo();
    await observarError(m.deps, m.base);
    await observarError(m.deps, m.base);
    expect(m.senales.size).toBe(1);

    // Volver a evaluar sin observación nueva devuelve la misma.
    const repetido = await observarError(m.deps, { ...m.base, corroborated: false });
    expect(repetido.estado === "OK" && repetido.evaluacion.estado).toBe("OK");
    expect(m.senales.size).toBe(1);
  });

  it("una resolución limpia apaga el camino hacia la intervención", async () => {
    const m = mundo();
    await observarError(m.deps, m.base);
    await observarError(m.deps, m.base);
    await observarError(m.deps, { ...m.base, kind: "resolucion_limpia" });
    const despues = await observarError(m.deps, m.base);
    expect(despues.estado === "OK" && despues.evaluacion).toMatchObject({
      estado: "SIN_SENAL",
      apariciones: 1,
    });
    // La señal de atención anterior **no se borra**: fue un hecho.
    expect(m.senales.size).toBe(1);
  });

  it("sin umbral configurado no se evalúa nada, y se dice", async () => {
    // `HP0-06-2` y `HP0-06-3` siguen así: nadie decidió las suyas.
    const m = mundo({ sinUmbral: true });
    const r = await observarError(m.deps, m.base);
    expect(r.estado === "OK" && r.evaluacion.estado).toBe("SIN_UMBRAL");
    expect(m.senales.size).toBe(0);
  });

  it("si la base rechaza la observación, no se evalúa nada", async () => {
    // Corroborar contra una evidencia que nadie evaluó es el error inferido que
    // `C01-036` prohíbe contar. La base lo rechaza, y acá no hay hecho nuevo.
    const m = mundo();
    m.deps.repo.registrarObservacion = async () => {
      throw new Error("la evidencia está en SUBMITTED y nadie la evaluó");
    };
    const r = await observarError(m.deps, m.base);
    expect(r.estado).toBe("RECHAZADA");
    expect(m.senales.size).toBe(0);
  });
});
