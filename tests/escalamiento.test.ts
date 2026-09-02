import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

import { sinDestino, type CasoEscalado, type DestinoDeEscalamiento } from "@/lib/server/servicios/escalamiento";
import { transicionar, type RepositorioDeSenales, type Senal } from "@/lib/server/servicios/riesgo";
import type { EventoDeProducto, PublicadorDeEventos } from "@/lib/server/servicios/eventos";
import type { EntradaDeAuditoria } from "@/lib/server/servicios/auditoria";
import type { RiskSignalStatus } from "@/lib/domain/types";

/**
 * La cola sintética de escalamiento — Etapa B6.6.3.
 *
 * ⚠️ **No es el CRM.** Lo que se prueba acá es que el dominio **no sabe adónde
 * va el caso**, que un replay no encola dos veces, y que la cola no toca el
 * lifecycle de nada.
 */
function mundo(estado: RiskSignalStatus, destino?: DestinoDeEscalamiento) {
  let fila: Senal = {
    id: "s-1",
    institutionId: "inst-A",
    state: estado,
    studentId: "est-1",
    severity: "intervencion",
    reason: "Error de procedimiento: 3 veces en esta preparación",
    // Sin contexto estructurado: **nunca reemplaza la causa legible**, y este
    // mundo prueba el transporte del caso, no lo que la persona lee.
    reviewContext: {},
  };
  const publicados: EventoDeProducto[] = [];
  const auditado: EntradaDeAuditoria[] = [];

  const repo: RepositorioDeSenales = {
    async porId() {
      return { ...fila };
    },
    async cambiarEstadoSi(_i, _id, esperado, nuevo) {
      if (fila.state !== esperado) return null;
      fila = { ...fila, state: nuevo as RiskSignalStatus };
      return { ...fila };
    },
    async registrar() {
      return { id: "s-1", duplicado: false };
    },
    async resolver() {
      return { resuelta: false, motivo: null };
    },
  };

  return {
    deps: {
      repo,
      eventos: { async publicar(e) { publicados.push(e); } } as PublicadorDeEventos,
      auditor: { async registrar(e: EntradaDeAuditoria) { auditado.push(e); } },
      destino,
    },
    senal: () => fila,
    publicados,
  };
}

function colaEnMemoria() {
  const casos: CasoEscalado[] = [];
  const destino: DestinoDeEscalamiento = {
    async escalar(caso) {
      // Idempotencia por señal, igual que el `UNIQUE` de la tabla real.
      const previo = casos.findIndex((c) => c.riskSignalId === caso.riskSignalId);
      if (previo >= 0) return { id: `e-${previo}`, duplicado: true };
      casos.push(caso);
      return { id: `e-${casos.length - 1}`, duplicado: false };
    },
  };
  return { destino, casos };
}

describe("B6.6.3 · un caso que pide una persona aterriza en algún lado", () => {
  it("entrar en `INTERVENTION_REQUIRED` genera una entrada", async () => {
    const cola = colaEnMemoria();
    const m = mundo("OPEN", cola.destino);
    await transicionar(m.deps, "inst-A", "s-1", "INTERVENTION_REQUIRED", null);

    expect(cola.casos).toHaveLength(1);
    expect(cola.casos[0]).toMatchObject({
      institutionId: "inst-A",
      riskSignalId: "s-1",
      studentId: "est-1",
    });
    // La causa que ya registró la señal, sin reescribir.
    expect(cola.casos[0].explanation).toBe(m.senal().reason);
  });

  it("una transición que NO pide una persona no encola nada", async () => {
    const cola = colaEnMemoria();
    const m = mundo("OPEN", cola.destino);
    await transicionar(m.deps, "inst-A", "s-1", "EXPIRED", null);
    expect(cola.casos).toHaveLength(0);
  });

  it("un replay no genera un segundo caso", async () => {
    const cola = colaEnMemoria();
    const m = mundo("OPEN", cola.destino);
    await transicionar(m.deps, "inst-A", "s-1", "INTERVENTION_REQUIRED", null);
    // La segunda transición ya no es válida: la señal se movió. Y aunque el
    // destino se llamara igual, es idempotente por señal.
    await transicionar(m.deps, "inst-A", "s-1", "INTERVENTION_REQUIRED", null);
    await cola.destino.escalar({
      institutionId: "inst-A",
      riskSignalId: "s-1",
      studentId: "est-1",
      explanation: "otra cosa",
      reviewContext: {},
    });
    expect(cola.casos).toHaveLength(1);
  });

  it("la cola no cambia el estado de la señal", async () => {
    const cola = colaEnMemoria();
    const m = mundo("OPEN", cola.destino);
    await transicionar(m.deps, "inst-A", "s-1", "INTERVENTION_REQUIRED", null);
    // Sigue pidiendo una persona: encolar no la resuelve, no la reconoce y no
    // la cierra. Estado de entrega y estado de dominio son cosas distintas.
    expect(m.senal().state).toBe("INTERVENTION_REQUIRED");
  });

  it("sin destino, la señal igual pide una persona", async () => {
    // Que el canal no exista no puede frenar el dominio: mismo criterio que
    // `SIN_DIRECTORIO` en ADR-032.
    const m = mundo("OPEN", sinDestino);
    const r = await transicionar(m.deps, "inst-A", "s-1", "INTERVENTION_REQUIRED", null);
    expect(r.estado).toBe("OK");
    expect(m.senal().state).toBe("INTERVENTION_REQUIRED");
  });

  it("y sin destino configurado tampoco rompe", async () => {
    const m = mundo("OPEN");
    const r = await transicionar(m.deps, "inst-A", "s-1", "INTERVENTION_REQUIRED", null);
    expect(r.estado).toBe("OK");
  });
});

describe("B6.6.3 · el dominio no sabe adónde va el caso", () => {
  const RIESGO = readFileSync(resolve(process.cwd(), "lib/server/servicios/riesgo.ts"), "utf8");
  const PUERTO = readFileSync(resolve(process.cwd(), "lib/server/servicios/escalamiento.ts"), "utf8");

  it("el Service no nombra al CRM, ni HMAC, ni el outbox", () => {
    // Si el día de mañana el destino es un webhook firmado, esto no cambia.
    for (const fuga of ["CRM", "hmac", "HMAC", "webhook", "outbox", "fetch("]) {
      expect(RIESGO, `el dominio nombra "${fuga}"`).not.toContain(fuga);
    }
  });

  it("el puerto no inventa el contrato: sin endpoint ni payload del CRM", () => {
    for (const fuga of ["http", "fetch", "Authorization", "signature", "eventId"]) {
      expect(PUERTO, `el puerto nombra "${fuga}"`).not.toContain(fuga);
    }
  });
});

describe("B6.6.3 · el endpoint de inspección está cerrado", () => {
  const RUTA = readFileSync(resolve(process.cwd(), "app/api/escalamiento/route.ts"), "utf8");

  it("está apagado por defecto, y responde 404 y no 403", () => {
    // Un `403` confirmaría que la ruta existe.
    expect(RUTA).toContain('process.env.ESCALAMIENTO_SINTETICO !== "1"');
    expect(RUTA).toMatch(/ESCALAMIENTO_SINTETICO[\s\S]{0,120}status: 404/);
  });

  it("exige secreto de servicio y nunca acepta sesión de estudiante", () => {
    expect(RUTA).toContain("esSecretoDeServicio");
    expect(RUTA).not.toMatch(/sesionDe|estudianteDe|resolverSesion/);
  });

  it("sólo lee: no expone un camino para tocar el dominio", () => {
    expect(RUTA).toContain("export async function GET");
    expect(RUTA).not.toContain("export async function POST");
    expect(RUTA).not.toContain("export async function PATCH");
    // Sobre el **código**, no sobre los comentarios: el bloque de arriba explica
    // justamente que no se puede tocar `risk_signal`, y nombrar algo para decir
    // que no se hace no es hacerlo.
    const codigo = RUTA.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
    expect(codigo).not.toMatch(/risk_signal|intervention|update\(/);
  });

  it("exige la institución: no hay lectura «de todas»", () => {
    expect(RUTA).toContain("institucion");
    expect(RUTA).toMatch(/Falta \?institucion[\s\S]{0,80}status: 400/);
  });

  it("se declara sintética en la propia respuesta", () => {
    expect(RUTA).toContain("sintetica: true");
    expect(RUTA).toContain("No es el CRM");
  });
});
