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
        reviewContext: {},
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
    // El doble imita **la transacción**, no sólo la firma: cerrar resuelve la
    // señal si estaba pidiendo una persona (ADR-034 §7.4). Un doble que sólo
    // devolviera los campos nuevos probaría el tipo y nada más.
    async cerrar(entrada) {
      if (!filaInt) throw new Error("no existe");
      if (filaInt.state === "closed") {
        return { cerrada: true, yaEstaba: true, senalResuelta: false, senalId: filaInt.riskSignalId };
      }
      if (filaInt.state !== "acknowledged") throw new Error("no reconocida");
      if (entrada.registradoPor !== filaInt.ownerOperatorId) {
        throw new Error("INVALID_OWNER_ASSERTION");
      }
      outcomes.push(entrada.outcome);
      const senalId = filaInt.riskSignalId;
      filaInt = { ...filaInt, state: "closed" };
      let senalResuelta = false;
      if (senalId && filaSenal?.id === senalId && filaSenal.state === "INTERVENTION_REQUIRED") {
        filaSenal = { ...filaSenal, state: "RESOLVED" };
        senalResuelta = true;
      }
      return { cerrada: true, yaEstaba: false, senalResuelta, senalId };
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

  // ── ADR-034 §7.4 · el cierre entero, en una transacción ───────────────────

  it("cerrar la intervención resuelve la señal con el mismo `COMMIT`", async () => {
    // Antes eran dos llamadas, y entre las dos quedaba una ventana con la
    // intervención cerrada y la señal todavía pidiendo a alguien que ya la
    // había atendido. Si la segunda no llegaba, la señal pedía para siempre.
    const m = mundo({ senal: "INTERVENTION_REQUIRED", intervencion: "acknowledged" });
    const r = await cerrar(m.intervencion, {
      institutionId: "inst-A",
      intervencionId: "i-1",
      outcome: "recuperado",
      registradoPor: "op-1",
    });
    expect(r).toMatchObject({ estado: "OK", senalResuelta: true });
    expect(m.senal()!.state).toBe("RESOLVED");
    // Los dos hechos, en orden, sin una segunda llamada de por medio.
    expect(m.publicados.map((e) => e.nombre)).toEqual([
      "InterventionResolved",
      "RiskSignalResolved",
    ]);
    expect(m.auditado.map((a) => a.accion)).toEqual([
      "intervention.close",
      "risk_signal.resolve",
    ]);
  });

  it("una intervención sin señal previa cierra igual, y no resuelve nada", async () => {
    // Es un caso legítimo: el operador pudo intervenir sin una señal detrás.
    const m = mundo({ intervencion: "acknowledged" });
    const r = await cerrar(m.intervencion, {
      institutionId: "inst-A",
      intervencionId: "i-1",
      outcome: "recuperado",
      registradoPor: "op-1",
    });
    expect(r).toMatchObject({ estado: "OK", senalResuelta: false });
    expect(m.publicados.map((e) => e.nombre)).toEqual(["InterventionResolved"]);
  });

  it("y no pisa una señal que ya terminó por otro camino", async () => {
    // Otra intervención pudo resolverla, o alguien pudo escalarla. Reescribir
    // ese final desde acá borraría lo que efectivamente pasó.
    const m = mundo({ senal: "ESCALATED", intervencion: "acknowledged" });
    const r = await cerrar(m.intervencion, {
      institutionId: "inst-A",
      intervencionId: "i-1",
      outcome: "escalado",
      registradoPor: "op-1",
    });
    expect(r).toMatchObject({ estado: "OK", senalResuelta: false });
    expect(m.senal()!.state).toBe("ESCALATED");
    expect(m.publicados.map((e) => e.nombre)).toEqual(["InterventionResolved"]);
  });

  // ── ADR-034 §7.5 · el caso es de quien lo tomó ────────────────────────────

  it("no la reconoce alguien que no es su dueño", async () => {
    const m = mundo({ intervencion: "open" });
    const r = await reconocer(m.intervencion, "inst-A", "i-1", "otro-operador");
    expect(r).toMatchObject({ estado: "OWNER_DISTINTO", duenio: "op-1" });
    // No se movió, y no publicó nada: no ocurrió nada que registrar.
    expect(m.intervencionActual()!.state).toBe("open");
    expect(m.publicados).toEqual([]);
    expect(m.auditado).toEqual([]);
  });

  it("ni la cierra: la reasignación necesita un comando propio", async () => {
    // Cerrarla un tercero dejaría `owner_operator_id` diciendo una cosa y el
    // outcome diciendo que lo registró otro.
    const m = mundo({ senal: "INTERVENTION_REQUIRED", intervencion: "acknowledged" });
    const r = await cerrar(m.intervencion, {
      institutionId: "inst-A",
      intervencionId: "i-1",
      outcome: "recuperado",
      registradoPor: "otro-operador",
    });
    expect(r).toMatchObject({ estado: "OWNER_DISTINTO", duenio: "op-1" });
    expect(m.intervencionActual()!.state).toBe("acknowledged");
    // Y la señal sigue pidiendo una persona: nadie la atendió.
    expect(m.senal()!.state).toBe("INTERVENTION_REQUIRED");
    expect(m.publicados).toEqual([]);
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

  /**
   * Este guard cambió de afirmación — Etapa B6.5, [ADR-036](../docs/decisions.md#adr-036).
   *
   * Hasta acá decía *"no existe ningún evaluador"*, y rompió exactamente cuando
   * apareció uno. **Estaba bien**: existía para forzar que alguien cerrara
   * `C01-021` y `C01-036` antes de que un agente inventara el umbral. El Product
   * Owner los cerró de forma provisional y explícita.
   *
   * Dejarlo como estaba habría sido peor que borrarlo: seguiría verde afirmando
   * una ausencia que ya no es cierta. Así que **afirma lo que hay que sostener
   * ahora**, que es más difícil de cumplir por accidente: el umbral vive en
   * configuración, hay **una sola** regla que lo tiene, y dice de quién es.
   */
  it("el umbral vive en configuración, no en el código", () => {
    const dominio = readFileSync(
      resolve(process.cwd(), "lib/domain/reiteracion.ts"),
      "utf8",
    );
    // El evaluador **recibe** el umbral. Si algún día lo construye adentro, este
    // test lo ve: no puede haber un objeto de apariciones literal.
    expect(dominio).not.toMatch(/apariciones:\s*\{\s*atencion:\s*\d/);
    expect(dominio).toContain("umbral: UmbralDeReiteracion");
    // Y el Service lo saca de la configuración, no de una constante local.
    expect(FUENTE).toContain("umbralDesdeConfig(");
  });

  it("hay UNA sola regla con umbral, y ninguna más se agregó", () => {
    const dir = resolve(process.cwd(), "supabase/migrations");
    const sql = readdirSync(dir)
      .filter((f) => f.endsWith(".sql"))
      .map((f) => readFileSync(resolve(dir, f), "utf8"))
      .join("\n");
    // **Toda regla cargada en `AUTOMATICA` tiene que ser `HP0-06-1`.** Se mira
    // regla por regla y no por cantidad: `HP0-06-1` va a seguir versionándose
    // —`v2.0-po-provisional`, `v3.0-psicopedagogia`…— y un guard que cuente
    // ocurrencias habría que subirlo cada vez, que es como se apaga un guard sin
    // que nadie lo decida.
    const cargas = sql
      .split("INSERT INTO risk_rule")
      .slice(1)
      .filter((bloque) => bloque.includes("'AUTOMATICA'"));
    expect(cargas.length).toBeGreaterThan(0);
    for (const carga of cargas) {
      expect(carga).toContain("'HP0-06-1'");
    }
    // Las dos versiones que existen, nombradas. `HP0-06-2` y `HP0-06-3` siguen
    // sin umbral, porque nadie decidió las suyas.
    expect(sql).toContain("'HP0-06-1', 'v2.0-po-provisional'");
    expect(sql).toContain("'HP0-06-1', 'v3.0-psicopedagogia'");
    expect(sql).not.toContain("'HP0-06-2', 'v2");
    expect(sql).not.toContain("'HP0-06-3', 'v2");
    expect(sql).not.toContain("'HP0-06-2', 'v3");
    expect(sql).not.toContain("'HP0-06-3', 'v3");
  });

  it("la versión provisional dice de quién es, y no se la atribuye a ella", () => {
    const sql = readFileSync(
      resolve(process.cwd(), "supabase/migrations/20260904010000_regla_c01_021_provisional.sql"),
      "utf8",
    );
    // La procedencia del umbral **no** es `HUMAN-P0-06`: es del Product Owner.
    expect(sql).toContain("'PO-MVP-C01-021'");
    expect(sql).toContain("v1.0-provisional-sin-validacion-profesional");
    expect(sql).toContain("PROVISIONAL — REQUIRES POST-MVP HUMAN VALIDATION");
  });

  it("la fila de la psicopedagoga se apaga, no se reescribe", () => {
    const sql = readFileSync(
      resolve(process.cwd(), "supabase/migrations/20260904010000_regla_c01_021_provisional.sql"),
      "utf8",
    );
    // Mismo criterio que `EP-SPEC v0.1` en la B5 y `ACKNOWLEDGED` en ADR-034:
    // se apaga con un `UPDATE` de `is_current`, y su texto queda intacto.
    expect(sql).toMatch(/UPDATE risk_rule SET is_current = FALSE/);
    expect(sql).not.toMatch(/DELETE\s+FROM\s+risk_rule/i);
    // Y en particular, nadie le mete un umbral a la versión de ella.
    expect(sql).not.toMatch(/UPDATE risk_rule SET[^;]*threshold_config/i);
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
