/**
 * Mapeo nivel de precedencia → copy, para `UX01`.
 *
 * El nivel y su variante los decide `selectHeroLevel` (dominio puro). Acá sólo
 * se resuelve qué frase le corresponde.
 *
 * **Cobertura completa desde la Etapa 0.7.** Hasta la 0.6 faltaban cuatro
 * niveles porque `product.md` §10.2 dejaba dos CTAs ambiguas;
 * [ADR-017](../../docs/decisions.md) mostró que no era una decisión abierta
 * sino un resumen que había perdido el discriminador, y `VI.1` §3.2 lo fija:
 * el nivel 3 se decide por **tiempo acordado** y el 8 por **lifecycle de la
 * Evidence**.
 */

import type { HeroLevel, HeroVariante } from "@/lib/domain/precedence";
import { t, type CopyId } from "./es-AR";

const estadoGeneralPorNivel: Record<HeroLevel, CopyId> = {
  IN_PROGRESS: "HOY.ESTADO.IN_PROGRESS",
  EVIDENCE_PENDING: "HOY.ESTADO.EVIDENCE_PENDING",
  COMMITMENT_NEXT: "HOY.ESTADO.COMMITMENT_NEXT",
  RESCUE_REQUIRED: "HOY.ESTADO.RESCUE_REQUIRED",
  COMMITMENT_MISSED: "HOY.ESTADO.COMMITMENT_MISSED",
  ACTION_RECOMMENDED: "HOY.ESTADO.ACTION_RECOMMENDED",
  CONTEXT_INCOMPLETE: "HOY.ESTADO.CONTEXT_INCOMPLETE",
  EVIDENCE_INFO: "HOY.ESTADO.EVIDENCE_INFO",
  NO_ACTION_AVAILABLE: "HOY.ESTADO.DEFECTO",
};

/** Los niveles cuya CTA no depende de la variante. */
const ctaPorNivel: Record<HeroLevel, CopyId> = {
  IN_PROGRESS: "CTA.CONTINUAR",
  EVIDENCE_PENDING: "CTA.SUBIR_EVIDENCIA",
  // El nivel 3 siempre trae variante; este valor no se usa en la práctica.
  COMMITMENT_NEXT: "CTA.VER_COMPROMISO",
  RESCUE_REQUIRED: "CTA.RETOMAR",
  COMMITMENT_MISSED: "CTA.RETOMAR",
  ACTION_RECOMMENDED: "CTA.COMPROMETERME",
  CONTEXT_INCOMPLETE: "CTA.COMPLETAR_INFORMACION",
  EVIDENCE_INFO: "CTA.VER_EVIDENCIA",
  NO_ACTION_AVAILABLE: "CTA.VER_MATERIAS",
};

/** Cuando hay variante, ella manda: es el discriminador que fija `VI.1` §3.2. */
const ctaPorVariante: Record<HeroVariante, CopyId> = {
  COMMITMENT_PROXIMO: "CTA.VER_COMPROMISO",
  COMMITMENT_STARTABLE: "CTA.EMPEZAR",
  RESCATE_STARTABLE: "CTA.EMPEZAR_RESCATE",
  EVIDENCIA_ENVIADA: "CTA.VER_EVIDENCIA",
  EVIDENCIA_VALIDADA: "CTA.VER_AVANCE",
};

export function estadoGeneralPara(nivel: HeroLevel): string {
  return t(estadoGeneralPorNivel[nivel]);
}

export function ctaPara(nivel: HeroLevel, variante: HeroVariante | null = null): string {
  return t(variante !== null ? ctaPorVariante[variante] : ctaPorNivel[nivel]);
}
