/**
 * El alta académica — las reglas puras del tramo que
 * [ADR-052](../../docs/decisions.md#adr-052) construye.
 *
 * **Puro:** sin React, sin I/O, sin reloj propio. `ahora` entra por parámetro,
 * igual que en el ADE y en las matrices de precedencia.
 *
 * Lo que decide este módulo es **qué se le pregunta al estudiante y qué no**.
 * Nada de acá escribe, y nada de acá inventa una materia: el catálogo lo trae
 * el Repository y esto sólo lo ordena.
 */

/**
 * Los siete tipos de `curriculum_requirement` ([ADR-051](../../docs/decisions.md#adr-051)).
 *
 * `UNKNOWN` **no es un default**: es la fuente diciendo que no se puede
 * clasificar la fila. Colapsarlo con `COURSE` haría que el alta le preguntara
 * al estudiante si cursa algo que nadie sabe qué es.
 */
export type TipoDeRequisito =
  | "COURSE"
  | "ELECTIVE_SLOT"
  | "SEMINAR_SLOT"
  | "LANGUAGE_REQUIREMENT"
  | "PROFESSIONAL_PRACTICE"
  | "CAPSTONE"
  | "UNKNOWN";

/** Cómo aparece un requisito en la pantalla de materias. */
export type TratoEnElAlta =
  /** Materia concreta: se lista y **se preselecciona** si es del año elegido. */
  | "MATERIA"
  /** Cupo: se lista aparte, **nunca preseleccionado**, y se pregunta. */
  | "CUPO"
  /** Existe en el plan y **no se ofrece como materia**. Tiene su propio momento. */
  | "NO_SE_OFRECE";

/**
 * La pregunta del alta es *"¿qué materias estás cursando?"*, así que sólo una
 * materia concreta se ofrece como tal.
 *
 * **Acreditación de Inglés, Práctica Profesional y Trabajo Final no se
 * preseleccionan por pertenecer al año**, y no es una omisión: son requisitos
 * con su propia forma de cumplirse, y marcarlos como "materia que curso" haría
 * que el ADE les buscara unidades y recursos que no existen. Van a necesitar su
 * propia experiencia; ninguna la podrían tener entrando como materia.
 */
export function tratoEnElAlta(tipo: TipoDeRequisito): TratoEnElAlta {
  switch (tipo) {
    case "COURSE":
      return "MATERIA";
    case "ELECTIVE_SLOT":
    case "SEMINAR_SLOT":
      return "CUPO";
    case "LANGUAGE_REQUIREMENT":
    case "PROFESSIONAL_PRACTICE":
    case "CAPSTONE":
    case "UNKNOWN":
      return "NO_SE_OFRECE";
  }
}

/**
 * Una materia del año elegido llega **marcada**; una de otro año, no.
 *
 * Es la precarga que el spec pide —*"Mostrar materias probables. Alumno
 * confirma/corrige"* (`UF-S02`)— y su motivo está escrito: *"Reduce fricción:
 * **el alumno corrige en vez de cargar todo desde cero**"* (§6.4).
 *
 * ⚠️ **Preseleccionar no es dar por confirmado.** Nada se persiste hasta que el
 * estudiante confirma, y todas se pueden desmarcar.
 */
export function sePreselecciona(tipo: TipoDeRequisito, anioDelRequisito: number | null, anioElegido: number): boolean {
  return tratoEnElAlta(tipo) === "MATERIA" && anioDelRequisito === anioElegido;
}

/** Un plan publicado, con su vigencia. Lo que el Repository devuelve, ya filtrado. */
export interface PlanCandidato {
  id: string;
  version: string;
  validFrom: string | null;
  validUntil: string | null;
}

export type ResolucionDePlan =
  /** Una sola vigente: **no se pregunta**, se muestra para confirmar. */
  | { estado: "UNICA"; plan: PlanCandidato }
  /** Más de una: se pregunta. Elegir por el agente sería decidir su carrera. */
  | { estado: "AMBIGUA"; planes: readonly PlanCandidato[] }
  /** Ninguna. **No se inventan materias**: la pantalla lo dice y no sigue. */
  | { estado: "SIN_PLAN" };

/**
 * Qué versión del plan le corresponde a este estudiante.
 *
 * **No se agrega una pregunta que el sistema puede contestar solo.** Si hay una
 * sola versión vigente, se infiere y se muestra; si hay varias, se pregunta,
 * porque un estudiante legado de un plan viejo no cursa el nuevo y elegir por
 * él le cambiaría la carrera en silencio.
 *
 * La vigencia se compara contra `ahora` y **no contra el reloj del proceso**.
 */
export function resolverVersionDePlan(
  planes: readonly PlanCandidato[],
  ahora: string,
): ResolucionDePlan {
  const hoy = ahora.slice(0, 10);
  const vigentes = planes.filter(
    (p) => (p.validFrom === null || p.validFrom <= hoy) && (p.validUntil === null || p.validUntil >= hoy),
  );

  // Ninguno vigente pero alguno cargado: se ofrecen todos y decide la persona.
  // Descartar un plan por su vigencia y dejar al estudiante sin nada sería peor
  // que preguntarle: la vigencia del catálogo no es su situación académica.
  const candidatos = vigentes.length > 0 ? vigentes : planes;

  if (candidatos.length === 0) return { estado: "SIN_PLAN" };
  if (candidatos.length === 1) return { estado: "UNICA", plan: candidatos[0] };
  return { estado: "AMBIGUA", planes: candidatos };
}

/** Los años que el plan declara, ordenados y sin repetir. `null` no es un año. */
export function aniosDelPlan(requisitos: readonly { curriculumYear: number | null }[]): readonly number[] {
  const vistos = new Set<number>();
  for (const r of requisitos) {
    if (r.curriculumYear !== null) vistos.add(r.curriculumYear);
  }
  return [...vistos].sort((a, b) => a - b);
}

/** Los tres pasos del alta, en el orden que aprobó ADR-042. */
export type PasoDelAlta = "WHATSAPP" | "CARRERA" | "MATERIAS";

export const RUTA_DEL_PASO: Record<PasoDelAlta, string> = {
  WHATSAPP: "/alta/whatsapp",
  CARRERA: "/alta/carrera",
  MATERIAS: "/alta/materias",
};

/**
 * Dónde está el estudiante en el alta.
 *
 * El orden es el de ADR-042 y **no se reordena**: el consentimiento va primero
 * porque es lo primero que el owner aprobó, no porque sea lo más barato.
 *
 * ⚠️ **Rechazar WhatsApp cuenta como haber contestado.** ADR-042 §2: *"el
 * estudiante puede rechazar u omitir WhatsApp sin perder el acceso"*. Un alta
 * que se trabara en `DECLINED` sería exactamente lo que esa regla prohíbe.
 */
export function siguientePaso(estado: {
  consentimientoRespondido: boolean;
  /** Hay `enrollment` con plan y año, todavía sin confirmar. */
  carreraDeclarada: boolean;
  /** `enrollment.confirmed_at IS NOT NULL`. El alta terminó. */
  materiasConfirmadas: boolean;
}): PasoDelAlta | null {
  if (!estado.consentimientoRespondido) return "WHATSAPP";
  if (!estado.carreraDeclarada) return "CARRERA";
  if (!estado.materiasConfirmadas) return "MATERIAS";
  return null;
}
