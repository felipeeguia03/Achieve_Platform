import { describe, expect, it } from "vitest";

import { copy } from "@/lib/content/es-AR";

/**
 * Lo que lee el estudiante no nombra el modelo en inglés — 13 sep 2026.
 *
 * Se colaban `Action`, `Commitment`, `owner`, `overview` y hasta `SUBMITTED` en
 * frases de pantalla. Son los nombres del dominio y de la spec, y en el código
 * están bien; en la interfaz se dicen *acción*, *compromiso*, *entrega*.
 *
 * Mira los **valores** del copy, no las claves.
 */
const PROHIBIDAS =
  /\b(Action|Actions|Commitment|Commitments|Evidence|Reflection|ExamPreparation|ProgressUpdated|owner|overview|readiness|SUBMITTED|UNDER_REVIEW|SUFFICIENT|INSUFFICIENT|VALIDATED|RECOMMENDED)\b/;

function valoresDelCopy(): string[] {
  return Object.values(copy).filter((v): v is string => typeof v === "string");
}

describe("el copy de pantalla está en castellano", () => {
  it("ningún texto nombra una entidad, un estado o un rol en inglés", () => {
    const valores = valoresDelCopy();
    // Que el escaneo no pase en vacío: el copy tiene cientos de textos.
    expect(valores.length).toBeGreaterThan(500);
    expect(valores).toContain("Volver a la preparación");
    const conIngles = valores.filter((v) => v.includes(" ") && PROHIBIDAS.test(v));
    expect(conIngles).toEqual([]);
  });
});
