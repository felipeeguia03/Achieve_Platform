import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const MIGRACION = readFileSync(
  resolve(process.cwd(), "supabase/migrations/20260908000000_acelerar_y_reiniciar.sql"),
  "utf8",
);

describe("B6.7.3 · la fuente profesional quedó como configuración", () => {
  it("apaga v3, carga v4 y no borra historia", () => {
    expect(MIGRACION).toContain("version='v3.0-psicopedagogia'");
    expect(MIGRACION).toContain("'v4.0-psicopedagogia'");
    expect(MIGRACION).not.toMatch(/DELETE\s+FROM\s+risk_rule/i);
  });

  it("declara las cinco condiciones, dos aciertos y los seis disparadores", () => {
    for (const campo of [
      "correction_delivered",
      "correction_accessible",
      "learner_engaged",
      "new_independent_attempt",
      "same_error_confidence",
    ]) expect(MIGRACION).toContain(`'${campo}'`);
    expect(MIGRACION).toContain("'clean_successes_to_resolve', 2");
    for (const trigger of [
      "bloqueo_manifiesto",
      "malestar",
      "pedido_explicito_de_ayuda",
      "alto_impacto_academico",
      "barrera_de_accesibilidad",
      "baja_confianza_del_sistema",
    ]) expect(MIGRACION).toContain(`'${trigger}'`);
  });

  it("la recaída tiene episodio vinculado y la cola recibe contexto", () => {
    expect(MIGRACION).toContain("previous_episode_id UUID REFERENCES reiteration_episode");
    expect(MIGRACION).toContain("review_context JSONB NOT NULL");
    expect(MIGRACION).toContain("reiteration_episode_historia");
  });
});
