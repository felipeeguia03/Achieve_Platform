/**
 * Mapeo nivel de precedencia → copy, para UX01.
 *
 * El nivel lo decide `selectHeroLevel` (dominio puro). Acá solo se resuelve qué
 * frase le corresponde. Separado del catálogo general de copy porque es la
 * única tabla que depende de un tipo del dominio.
 *
 * ⚠️ **Cobertura parcial, a propósito.** Están los cinco niveles que UX01 sabe
 * renderizar hoy. Los cuatro restantes —`COMMITMENT_NEXT`, `COMMITMENT_MISSED`,
 * `CONTEXT_INCOMPLETE`, `EVIDENCE_INFO`— entran en la **Etapa 0.7**, que es la
 * que lleva UX01 a los nueve niveles.
 *
 * Dos de ellos además necesitan una regla que el spec no fija:
 * `product.md` §10.2 le da a `COMMITMENT_NEXT` dos verbos posibles
 * (*"Ver compromiso"* / *"Empezar"*) y a `EVIDENCE_INFO` otros dos
 * (*"Ver evidencia"* / *"Ver avance"*), sin decir cuál aplica cuándo. **No se
 * elige acá**: elegir sería inventar una regla de negocio (AGENTS.md §1.1). Se
 * pregunta antes de la 0.7.
 */

import type { HeroLevel } from "@/lib/domain/precedence";
import { t, type CopyId } from "./es-AR";

const estadoGeneralPorNivel: Partial<Record<HeroLevel, CopyId>> = {
  ACTION_RECOMMENDED: "HOY.ESTADO.ACTION_RECOMMENDED",
  IN_PROGRESS: "HOY.ESTADO.IN_PROGRESS",
  EVIDENCE_PENDING: "HOY.ESTADO.EVIDENCE_PENDING",
  RESCUE_REQUIRED: "HOY.ESTADO.RESCUE_REQUIRED",
};

const ctaPorNivel: Partial<Record<HeroLevel, CopyId>> = {
  ACTION_RECOMMENDED: "CTA.COMPROMETERME",
  IN_PROGRESS: "CTA.CONTINUAR",
  EVIDENCE_PENDING: "CTA.SUBIR_EVIDENCIA",
  RESCUE_REQUIRED: "CTA.RETOMAR",
  NO_ACTION_AVAILABLE: "CTA.VER_MATERIAS",
};

export function estadoGeneralPara(nivel: HeroLevel): string {
  const id = estadoGeneralPorNivel[nivel];
  return t(id ?? "HOY.ESTADO.DEFECTO");
}

export function ctaPara(nivel: HeroLevel): string {
  const id = ctaPorNivel[nivel];
  return t(id ?? "CTA.VER_MATERIAS");
}
