import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

import { getEscenario } from "@/lib/fixtures";
import { proyectarPaso, type EstadoDePaso } from "@/lib/server/servicios/proyeccion-paso";

const root = process.cwd();
const migration = readFileSync(
  resolve(root, "supabase/migrations/20260909000000_replanificar_y_volver.sql"),
  "utf8",
);

describe("B6.7.4 · el contrato persistido", () => {
  it("versiona dentro de la preparación y conserva I7", () => {
    expect(migration).toContain("CREATE TABLE exam_preparation_plan_version");
    expect(migration).toContain("exam_preparation_id UUID NOT NULL REFERENCES exam_preparation");
    expect(migration).not.toContain("DROP CONSTRAINT exam_preparation_student_id_assessment_id_key");
    expect(migration).toContain("UPDATE exam_preparation SET status = 'REPLANNED'");
    expect(migration).toContain("v_status NOT IN ('ACTIVE','REPLANNED')");
  });

  it("el tramo y los seis motivos confirmados son configuración versionada", () => {
    expect(migration).toContain("'v1.0-psicopedagogia', TRUE, 9, 18, 'HUMAN-P0-9.7'");
    for (const motivo of [
      "EVIDENCIA_INSUFICIENTE",
      "ERROR_REITERATIVO",
      "CAMBIO_INFORMACION_EXAMEN",
      "REPLANIFICACION",
      "PEDIDO_FUNDAMENTADO_ESTUDIANTE",
      "INDICACION_HUMANA",
    ]) {
      expect(migration).toContain(motivo);
    }
  });

  it("proponer no mueve el paso; sólo aceptar u override lo hacen", () => {
    const propuesta = migration.slice(
      migration.indexOf("FUNCTION public.proponer_reentrada"),
      migration.indexOf("FUNCTION public.responder_reentrada"),
    );
    // Lo que no puede hacer `proponer` es **escribir** el paso actual. Leerlo
    // sí, y hace falta: es lo que rechaza una propuesta cuyo origen ya dejó de
    // ser el paso actual. Prohibir la mención entera convertía una lectura
    // legítima en un falso positivo, y habría empujado a sacar esa validación.
    expect(propuesta).not.toMatch(/UPDATE\s+exam_preparation\s+SET[\s\S]*?current_step_id/);
    // Y el único que sí lo mueve es el que responde la propuesta.
    const respuesta = migration.slice(migration.indexOf("FUNCTION public.responder_reentrada"));
    expect(respuesta).toMatch(/UPDATE exam_preparation SET current_step_id/);
    expect(migration).toContain("p_decision IN ('ACCEPT','HUMAN_OVERRIDE')");
    expect(migration).toContain("'ALTERNATIVE_REQUESTED'");
  });
});

describe("B6.7.4 · explicación previa en UX09", () => {
  const estado: EstadoDePaso = {
    instante: "2026-09-02T12:00:00Z",
    zona: "UTC",
    preparacionId: "prep-SYN",
    status: "REPLANNED",
    materia: "Materia SYN",
    evaluacion: "Evaluación SYN",
    modalidad: "practico",
    pasoId: "paso-15",
    label: "Práctica autónoma",
    objetivo: null,
    explicacion: null,
    entregable: null,
    criterio: null,
    requisito: "NO_CONFIGURADA",
    reentrante: true,
    version: "HUMAN-ROADMAP v1.0",
    contenido: "HUMAN-P0-01",
    contenidoVersion: "v1.0",
    vueltas: [],
    accion: null,
    compromiso: null,
    evidencia: "NONE",
    reentrada: {
      id: "reentry-SYN",
      motivo: "La evidencia resultó insuficiente",
      justificacion: "Hace falta revisar el plan antes de otro intento.",
      actividad: "El plan de resolución.",
      evidenciaVigente: "La evidencia de los pasos anteriores sigue vigente.",
      desde: "Práctica autónoma",
      hacia: "Plan de resolución",
    },
  };

  it("la propuesta domina la CTA del paso y contiene las cuatro explicaciones", () => {
    const props = proyectarPaso(estado);
    expect(props.ctaPrimaria).toBeNull();
    expect(props.reentradaPendiente).toMatchObject({
      motivo: estado.reentrada!.motivo,
      actividad: estado.reentrada!.actividad,
      evidenciaVigente: estado.reentrada!.evidenciaVigente,
      ctaOtraOpcion: "PEDIR OTRA OPCIÓN",
    });
  });

  it("existe el fixture profesional de reentrada mínima", () => {
    const fixture = getEscenario("FX-LOCAL-PASO-REENTRADA-MINIMA").ux09;
    expect(fixture?.reentradaPendiente?.recorrido).toBe(
      "Práctica autónoma → Plan de resolución",
    );
    expect(fixture?.ctaPrimaria).toBeNull();
  });
});
