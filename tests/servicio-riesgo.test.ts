import { readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

import {
  registrarSenal,
  resolver,
  transicionar,
  nombreDeEventoDeSenal,
  type RepositorioDeSenales,
  type Senal,
} from "@/lib/server/servicios/riesgo";
import {
  abrir,
  cerrar,
  reconocer,
  type Intervencion,
  type RepositorioDeIntervenciones,
} from "@/lib/server/servicios/intervencion";
import type { DirectorioDeOperadores, VerificacionDeOperador } from "@/lib/server/servicios/operadores";
import type { EntradaDeAuditoria } from "@/lib/server/servicios/auditoria";
import type { EventoDeProducto, PublicadorDeEventos } from "@/lib/server/servicios/eventos";
import { interventionTransitions, riskSignalTransitions } from "@/lib/domain/state-machines";
import type { InterventionStatus, RiskSignalStatus } from "@/lib/domain/types";

/**
 * Fase B6 — el circuito cerrado, con dobles.
 *
 * El Done de esta fase es *"toda señal relevante cierra su circuito causa →
 * owner → playbook → SLA → intervención → outcome; ninguna señal queda sin
 * outcome registrado"*. La mitad de este archivo prueba **que las formas de
 * romperlo no existen**, no que el camino feliz funciona.
 *
 * Y la otra mitad prueba **lo que esta fase se niega a hacer**: no hay motor
 * que produzca señales, y no lo hay porque `C01-021` y `C01-036` están
 * abiertos. Un test que verifica una ausencia parece raro hasta que alguien
 * agrega el motor sin que nadie lo decida.
 */
function mundo(
  opciones: {
    senal?: RiskSignalStatus;
    intervencion?: InterventionStatus;
    conOutcome?: boolean;
    operador?: VerificacionDeOperador;
    fallaAlAbrir?: string;
  } = {},
) {
  const publicados: EventoDeProducto[] = [];
  const auditado: EntradaDeAuditoria[] = [];
  let filaSenal: Senal | null = opciones.senal
    ? {
        id: "s-1",
        institutionId: "inst-A",
        state: opciones.senal,
        studentId: "est-1",
        severity: "riesgo",
        reason: "tres entregas seguidas con el mismo error de método",
      }
    : null;
  let filaInt: Intervencion | null = opciones.intervencion
    ? {
        id: "i-1",
        institutionId: "inst-A",
        state: opciones.intervencion,
        studentId: "est-1",
        riskSignalId: "s-1",
        ownerOperatorId: "op-1",
        ownerVerified: false,
        playbookId: null,
      }
    : null;
  const outcomes: string[] = [];

  const repoSenales: RepositorioDeSenales = {
    async porId(inst, id) {
      return filaSenal && filaSenal.institutionId === inst && filaSenal.id === id
        ? { ...filaSenal }
        : null;
    },
    async cambiarEstadoSi(inst, id, esperado, nuevo) {
      if (!filaSenal || filaSenal.institutionId !== inst || filaSenal.state !== esperado) return null;
      filaSenal = { ...filaSenal, state: nuevo };
      return { ...filaSenal };
    },
    async registrar() {
      return { id: "s-nueva", duplicado: false };
    },
    async resolver() {
      // La condición real vive en la función de base; el doble la imita.
      if (outcomes.length === 0) {
        return { resuelta: false, motivo: "ninguna intervención registró un outcome" };
      }
      if (filaSenal) filaSenal = { ...filaSenal, state: "RESOLVED" };
      return { resuelta: true, motivo: null };
    },
  };

  const repoIntervenciones: RepositorioDeIntervenciones = {
    async porId(inst, id) {
      return filaInt && filaInt.institutionId === inst && filaInt.id === id ? { ...filaInt } : null;
    },
    async cambiarEstadoSi(inst, id, esperado, nuevo) {
      if (!filaInt || filaInt.institutionId !== inst || filaInt.state !== esperado) return null;
      filaInt = { ...filaInt, state: nuevo };
      return { ...filaInt };
    },
    async abrir(entrada) {
      if (opciones.fallaAlAbrir) throw new Error(opciones.fallaAlAbrir);
      filaInt = {
        id: "i-nueva",
        institutionId: entrada.institutionId,
        state: "open",
        studentId: entrada.studentId,
        riskSignalId: entrada.riskSignalId,
        ownerOperatorId: entrada.ownerOperatorId,
        ownerVerified: entrada.ownerVerified,
        playbookId: entrada.playbookId ?? null,
      };
      return { id: "i-nueva", slaAt: entrada.slaAt ?? null, duplicado: false };
    },
    async cerrar(entrada) {
      if (!filaInt) throw new Error("no existe");
      if (filaInt.state === "closed") return { cerrada: true, yaEstaba: true };
      if (filaInt.state !== "acknowledged") throw new Error("no reconocida");
      outcomes.push(entrada.outcome);
      filaInt = { ...filaInt, state: "closed" };
      return { cerrada: true, yaEstaba: false };
    },
  };

  const eventos: PublicadorDeEventos = { async publicar(e) { publicados.push(e); } };
  const auditor = { async registrar(e: EntradaDeAuditoria) { auditado.push(e); } };
  const operadores: DirectorioDeOperadores = {
    async verificar() {
      return opciones.operador ?? "SIN_DIRECTORIO";
    },
  };

  if (opciones.conOutcome) outcomes.push("recuperado");

  return {
    riesgo: { repo: repoSenales, eventos, auditor },
    intervencion: { repo: repoIntervenciones, eventos, auditor, operadores },
    publicados,
    auditado,
    outcomes,
    senal: () => filaSenal,
    intervencionActual: () => filaInt,
  };
}

describe("B6 · una señal sin causa no es una señal", () => {
  it("se rechaza antes de tocar la base", async () => {
    const m = mundo();
    const r = await registrarSenal(m.riesgo, {
      institutionId: "inst-A",
      studentId: "est-1",
      signalType: "error_reiterado",
      severity: "riesgo",
      reason: "   ",
    });
    expect(r.estado).toBe("RECHAZADA");
    // Ni evento ni auditoría: no ocurrió nada que registrar.
    expect(m.publicados).toEqual([]);
    expect(m.auditado).toEqual([]);
  });

  it("con causa, publica el hecho y lo audita", async () => {
    const m = mundo();
    const r = await registrarSenal(m.riesgo, {
      institutionId: "inst-A",
      studentId: "est-1",
      signalType: "error_reiterado",
      severity: "riesgo",
      reason: "tres entregas seguidas con el mismo error de método",
    });
    expect(r).toMatchObject({ estado: "OK", duplicado: false });
    expect(m.publicados.map((e) => e.nombre)).toEqual(["RiskSignalCreated"]);
    // **Nadie la creó.** La produjo el owner de la señal, no una persona.
    expect(m.publicados[0].actorId).toBeNull();
    expect(m.auditado.map((a) => a.accion)).toEqual(["risk_signal.create"]);
  });
});

describe("B6 · la máquina de `RiskSignal`", () => {
  it("ninguna transición prohibida llega a escribir", async () => {
    const estados = Object.keys(riskSignalTransitions) as RiskSignalStatus[];
    for (const desde of estados) {
      for (const hacia of estados) {
        if (riskSignalTransitions[desde].includes(hacia)) continue;
        if (hacia === "RESOLVED") continue; // tiene su propia función
        // `ACKNOWLEDGED` no es expresable como destino (ADR-034): lo excluye el
        // tipo de `transicionar`, así que no hay llamada que probar acá. Que
        // nadie pueda entrar tiene su propio test, abajo.
        if (hacia === "ACKNOWLEDGED") continue;
        const m = mundo({ senal: desde });
        const r = await transicionar(m.riesgo, "inst-A", "s-1", hacia, "op-1");
        expect(r.estado, `${desde}->${hacia}`).toBe("TRANSICION_PROHIBIDA");
        expect(m.senal()!.state).toBe(desde);
      }
    }
  });

  it("`RESOLVED` sólo se alcanza desde `INTERVENTION_REQUIRED`", () => {
    // Es el Done de la fase, no una restricción de más: si `ACKNOWLEDGED →
    // RESOLVED` existiera, una señal podría cerrarse sin que nadie la trabajara.
    const quienesResuelven = (Object.keys(riskSignalTransitions) as RiskSignalStatus[]).filter(
      (d) => riskSignalTransitions[d].includes("RESOLVED"),
    );
    expect(quienesResuelven).toEqual(["INTERVENTION_REQUIRED"]);
  });

  it("una señal que ya pidió una persona no expira sola", () => {
    // Expirarla borraría una obligación humana pendiente.
    expect(riskSignalTransitions.INTERVENTION_REQUIRED).not.toContain("EXPIRED");
    expect(riskSignalTransitions.OPEN).toContain("EXPIRED");
  });

  // ── ADR-034 · el lifecycle corregido ───────────────────────────────────────

  it("`OPEN → INTERVENTION_REQUIRED` es directo: no hay peaje que nadie pueda pagar", async () => {
    // Era el bloqueo real: `abrir_intervencion()` exige `INTERVENTION_REQUIRED`,
    // y la única puerta era `ACKNOWLEDGED` —"alguien la miró"— que con el
    // operador en el CRM (ADR-033) no tenía quién la produjera.
    expect(riskSignalTransitions.OPEN).toContain("INTERVENTION_REQUIRED");

    const m = mundo({ senal: "OPEN" });
    const r = await transicionar(m.riesgo, "inst-A", "s-1", "INTERVENTION_REQUIRED", null);
    expect(r.estado).toBe("OK");
    expect(m.senal()!.state).toBe("INTERVENTION_REQUIRED");
    expect(m.publicados.map((e) => e.nombre)).toEqual(["RiskSignalInterventionRequired"]);
    // El actor es el sistema: lo declaró `risk_rule.modo`, no una persona.
    expect(m.publicados[0].actorId).toBeNull();
  });

  it("`OPEN → EXPIRED` sigue siendo la salida de las que dejaron de importar", async () => {
    const m = mundo({ senal: "OPEN" });
    const r = await transicionar(m.riesgo, "inst-A", "s-1", "EXPIRED", null);
    expect(r.estado).toBe("OK");
    expect(m.senal()!.state).toBe("EXPIRED");
    // Y la causa histórica sobrevive: expirar no borra por qué se abrió.
    expect(m.senal()!.reason).toBe("tres entregas seguidas con el mismo error de método");
  });

  it("`INTERVENTION_REQUIRED` no expira, ni por el reloj ni a mano", async () => {
    expect(riskSignalTransitions.INTERVENTION_REQUIRED).not.toContain("EXPIRED");
    const m = mundo({ senal: "INTERVENTION_REQUIRED" });
    const r = await transicionar(m.riesgo, "inst-A", "s-1", "EXPIRED", null);
    expect(r.estado).toBe("TRANSICION_PROHIBIDA");
    expect(m.senal()!.state).toBe("INTERVENTION_REQUIRED");
  });

  it("`ACKNOWLEDGED` es legacy: ningún estado vivo lo tiene como destino", () => {
    // La regla es *no entrar*, y se verifica sobre la tabla entera: si mañana
    // alguien lo agrega como destino de cualquier estado, esto rompe.
    const quienesEntran = (Object.keys(riskSignalTransitions) as RiskSignalStatus[]).filter((d) =>
      riskSignalTransitions[d].includes("ACKNOWLEDGED"),
    );
    expect(quienesEntran).toEqual([]);
  });

  it("pero la fila histórica termina su recorrido: `ACKNOWLEDGED → INTERVENTION_REQUIRED`", async () => {
    // Salir sí se puede, y es lo que hace que la corrección sea no destructiva:
    // una señal anterior a ADR-034 no queda varada.
    expect(riskSignalTransitions.ACKNOWLEDGED).toContain("INTERVENTION_REQUIRED");
    const m = mundo({ senal: "ACKNOWLEDGED" });
    const r = await transicionar(m.riesgo, "inst-A", "s-1", "INTERVENTION_REQUIRED", "op-1");
    expect(r.estado).toBe("OK");
    expect(m.senal()!.state).toBe("INTERVENTION_REQUIRED");
  });

  it("y una legacy puede llegar hasta `RESOLVED` con su outcome", async () => {
    // El recorrido completo de una fila vieja, de punta a punta.
    const m = mundo({ senal: "ACKNOWLEDGED", conOutcome: true });
    await transicionar(m.riesgo, "inst-A", "s-1", "INTERVENTION_REQUIRED", "op-1");
    const r = await resolver(m.riesgo, "inst-A", "s-1", "op-1");
    expect(r.estado).toBe("OK");
    expect(m.senal()!.state).toBe("RESOLVED");
  });

  it("`RESOLVED` y `ESCALATED` son terminales: no se reabre un cierre", () => {
    expect(riskSignalTransitions.RESOLVED).toEqual([]);
    expect(riskSignalTransitions.ESCALATED).toEqual([]);
    expect(riskSignalTransitions.EXPIRED).toEqual([]);
  });
});

describe("B6 · el circuito no se puede cerrar por la mitad", () => {
  it("una señal sin outcome no se resuelve, y no publica nada", async () => {
    const m = mundo({ senal: "INTERVENTION_REQUIRED" });
    const r = await resolver(m.riesgo, "inst-A", "s-1", "op-1");
    expect(r.estado).toBe("SIN_OUTCOME");
    expect(m.senal()!.state).toBe("INTERVENTION_REQUIRED");
    expect(m.publicados).toEqual([]);
  });

  it("con outcome registrado, se resuelve y publica su hecho", async () => {
    const m = mundo({ senal: "INTERVENTION_REQUIRED", conOutcome: true });
    const r = await resolver(m.riesgo, "inst-A", "s-1", "op-1");
    expect(r.estado).toBe("OK");
    expect(m.publicados.map((e) => e.nombre)).toEqual(["RiskSignalResolved"]);
    expect(m.auditado.map((a) => a.accion)).toEqual(["risk_signal.resolve"]);
  });

  it("una intervención sin reconocer no se puede cerrar", async () => {
    const m = mundo({ intervencion: "open" });
    const r = await cerrar(m.intervencion, {
      institutionId: "inst-A",
      intervencionId: "i-1",
      outcome: "recuperado",
      registradoPor: "op-1",
    });
    expect(r).toMatchObject({ estado: "TRANSICION_PROHIBIDA", desde: "open" });
    expect(m.outcomes).toEqual([]);
    expect(m.publicados).toEqual([]);
  });

  it("cerrar registra el outcome y publica `InterventionResolved`", async () => {
    const m = mundo({ intervencion: "acknowledged" });
    const r = await cerrar(m.intervencion, {
      institutionId: "inst-A",
      intervencionId: "i-1",
      outcome: "replanificado",
      registradoPor: "op-1",
    });
    expect(r).toMatchObject({ estado: "OK", yaEstaba: false });
    expect(m.outcomes).toEqual(["replanificado"]);
    expect(m.publicados.map((e) => e.nombre)).toEqual(["InterventionResolved"]);
    expect(m.publicados[0].payload).toMatchObject({ outcome: "replanificado" });
  });

  it("cerrar dos veces no pisa el outcome ni republica el hecho", async () => {
    const m = mundo({ intervencion: "acknowledged" });
    const entrada = {
      institutionId: "inst-A",
      intervencionId: "i-1",
      outcome: "recuperado" as const,
      registradoPor: "op-1",
    };
    await cerrar(m.intervencion, entrada);
    const segunda = await cerrar(m.intervencion, { ...entrada, outcome: "falso_positivo" });
    expect(segunda).toMatchObject({ estado: "OK", yaEstaba: true });
    // El resultado de una intervención es el registro de lo que pasó.
    expect(m.outcomes).toEqual(["recuperado"]);
    expect(m.publicados.filter((e) => e.nombre === "InterventionResolved")).toHaveLength(1);
  });

  it("`closed` es terminal y `open` no salta a `closed`", () => {
    expect(interventionTransitions.closed).toEqual([]);
    expect(interventionTransitions.open).toEqual(["acknowledged"]);
  });
});

describe("B6 · el dueño, y el directorio que todavía no existe", () => {
  it("sin directorio la intervención se abre, y queda sin verificar", async () => {
    const m = mundo();
    const r = await abrir(m.intervencion, {
      institutionId: "inst-A",
      riskSignalId: "s-1",
      studentId: "est-1",
      ownerOperatorId: "op-1",
    });
    expect(r).toMatchObject({ estado: "OK", ownerVerified: false });
    // La auditoría registra **contra qué** no se pudo verificar. Sin esto, el
    // día que exista el contrato v2 nadie distingue las verificadas de las que
    // no se pudieron consultar.
    expect(m.auditado[0].despues).toMatchObject({ verificacion: "SIN_DIRECTORIO" });
  });

  it("un operador que el CRM rechaza sí frena: no es lo mismo que no poder preguntar", async () => {
    const m = mundo({ operador: "DESCONOCIDO" });
    const r = await abrir(m.intervencion, {
      institutionId: "inst-A",
      riskSignalId: "s-1",
      studentId: "est-1",
      ownerOperatorId: "op-1",
    });
    expect(r.estado).toBe("OPERADOR_DESCONOCIDO");
    expect(m.publicados).toEqual([]);
  });

  it("con directorio real, la intervención queda verificada", async () => {
    const m = mundo({ operador: "CONOCIDO" });
    const r = await abrir(m.intervencion, {
      institutionId: "inst-A",
      riskSignalId: "s-1",
      studentId: "est-1",
      ownerOperatorId: "op-1",
    });
    expect(r).toMatchObject({ estado: "OK", ownerVerified: true });
  });

  it("un rechazo de la base viaja como resultado, no como excepción", async () => {
    const m = mundo({ fallaAlAbrir: "la señal está en OPEN y no pide intervención" });
    const r = await abrir(m.intervencion, {
      institutionId: "inst-A",
      riskSignalId: "s-1",
      studentId: "est-1",
      ownerOperatorId: "op-1",
    });
    expect(r).toMatchObject({ estado: "RECHAZADA" });
  });

  it("reconocer mueve `open → acknowledged` y publica su hecho", async () => {
    const m = mundo({ intervencion: "open" });
    const r = await reconocer(m.intervencion, "inst-A", "i-1", "op-1");
    expect(r.estado).toBe("OK");
    expect(m.publicados.map((e) => e.nombre)).toEqual(["InterventionAcknowledged"]);
  });
});

describe("B6 · lo que esta fase NO hace, y hay que poder verificarlo", () => {
  const FUENTE = readdirSync(resolve(process.cwd(), "lib/server/servicios"))
    .filter((f) => f.endsWith(".ts"))
    .map((f) => readFileSync(resolve(process.cwd(), "lib/server/servicios", f), "utf8"))
    .join("\n");

  it("ningún Service evalúa una regla de riesgo por su cuenta", () => {
    // `C01-021` está `OPEN` y `C01-036` —cuántas repeticiones hacen a un error
    // "reiterativo"— es de la psicopedagoga. Si aparece un evaluador, este test
    // rompe y obliga a que alguien cierre la decisión primero.
    expect(FUENTE).not.toMatch(/threshold_config/);
    expect(FUENTE).not.toMatch(/\bevaluarRiesgo\b|\bdetectarRiesgo\b|\bcalcularSeveridad\b/);
  });

  it("las reglas se cargan sin umbral y ninguna corre en modo automático", () => {
    const sql = readFileSync(
      resolve(process.cwd(), "supabase/migrations/20260902010000_reglas_de_riesgo.sql"),
      "utf8",
    );
    // Tres filas, y las tres con umbral y severidad en NULL: `threshold_config`
    // y `suggested_severity`. Ninguna en `AUTOMATICA`, que además el `CHECK`
    // `automatica_exige_umbral` impediría.
    expect(sql.match(/NULL, NULL, 'HUMANA'/g) ?? []).toHaveLength(3);
    expect(sql).not.toContain("'AUTOMATICA'");
  });

  it("no se inventó ningún playbook ni ningún SLA", () => {
    const dir = resolve(process.cwd(), "supabase/migrations");
    const sql = readdirSync(dir)
      .filter((f) => f.endsWith(".sql"))
      .map((f) => readFileSync(resolve(dir, f), "utf8"))
      .join("\n");
    // `C01-044`, gate `P`: "no se inventan valores".
    expect(sql).not.toMatch(/INSERT\s+INTO\s+playbook/i);
  });

  it("el nombre del evento sale del estado, no de una lista a mano", () => {
    expect(nombreDeEventoDeSenal("INTERVENTION_REQUIRED")).toBe("RiskSignalInterventionRequired");
    expect(nombreDeEventoDeSenal("EXPIRED")).toBe("RiskSignalExpired");
  });
});
