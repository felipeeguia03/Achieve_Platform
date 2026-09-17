import { t } from "./es-AR";

/**
 * La procedencia, traducida a copy visible. **Una sola vez, para las cuatro
 * superficies que la muestran.**
 *
 * `product.md` §7 fija dos reglas que se rompen solas si cada superficie hace su
 * propia traducción:
 *
 * 1. **Los enums técnicos nunca son copy visible.** `official`, `corroborated`,
 *    `unverified` y `disputed` no se muestran: se traducen.
 * 2. **`source_type` y `verification_status` son dos datos distintos.** Un
 *    reporte del alumno registrado en clase **no** se convierte en voz de la
 *    cátedra, y ninguna capa eleva la verificación (`I9`).
 *
 * Vive en `lib/content/` y no en `lib/domain/`, aunque la primera intuición sea
 * al revés: **traducir un enum a la frase que lee el estudiante es contenido**,
 * no dominio. El guard de `lib/domain/` es puro —no importa contenido— y tenía
 * razón. La tabla es la de `product.md` §7, transcripta.
 */

export type SourceType =
  | "institution"
  | "instructor"
  | "student"
  | "community"
  | "public_web"
  | "inference";

export type VerificationStatus = "unverified" | "corroborated" | "official" | "disputed";

const FUENTE: Record<SourceType, string> = {
  institution: "Institución",
  instructor: "Cátedra",
  student: "Reportado por vos",
  community: "Comunidad",
  public_web: "Web pública",
  inference: "Estimado por Achieve",
};

/**
 * *"Cátedra · oficial"*, *"Reportado por vos · sin verificar"*, *"Dato en
 * revisión · hay versiones distintas"*.
 *
 * **Falta cualquiera de los dos ⇒ no se afirma nada** y sale la frase de dato no
 * disponible. Ésa es la fila *"sin dato"* de la tabla, y es la que más importa
 * acá: `resource` guarda `source_type` pero **no** `verification_status`, así
 * que un recurso de la cátedra no puede presentarse como *oficial* — nadie lo
 * verificó, y decirlo sería justamente elevar la verificación desde la UI.
 */
export function provenanceVisible(
  fuente: SourceType | null | undefined,
  verificacion: VerificationStatus | null | undefined,
): string {
  if (!fuente || !verificacion) return t("PROVENANCE.NO_DISPONIBLE");
  if (verificacion === "disputed") return t("PROVENANCE.DISPUTADO");

  const nombre = FUENTE[fuente] ?? null;
  if (!nombre) return t("PROVENANCE.NO_DISPONIBLE");

  if (verificacion === "official") {
    // Sólo institución y cátedra pueden ser voz oficial. Un reporte del
    // estudiante marcado `official` sería un dato mal cargado, y la UI no lo
    // blanquea: dice qué fuente es y que está corroborada.
    if (fuente === "institution" || fuente === "instructor") return `${nombre} · oficial`;
    return `${nombre} · corroborado`;
  }
  if (verificacion === "corroborated") return `${nombre} · corroborado`;
  return `${nombre} · sin verificar`;
}
