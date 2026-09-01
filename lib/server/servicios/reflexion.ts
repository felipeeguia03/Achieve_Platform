/**
 * Service de `Reflection` — Etapa B2.4.
 *
 * ### Qué está cerrado, y se implementa acá
 *
 * - **La Reflection es un objeto separado de la Evidence.** No se fusiona ni se
 *   infiere (`product.md` §3.4). No es un campo de la entrega: es otra cosa.
 * - **Si es requerida, su ausencia bloquea *sólo* el submit dependiente**, y
 *   nada más. `CTA-007` lo dice: *"contenido válido **+ Reflection requerida
 *   válida**"*.
 *
 * ### Dónde vive el requisito — cerrado por `ADR-026`
 *
 * `C01-051` estuvo `OPEN` con gate `H` hasta el 1 de septiembre de 2026, y
 * mientras lo estuvo este Service recibió el requisito **por parámetro**: no
 * había dónde leerlo sin inventar la decisión. Ahora vive en
 * `action.reflection_requirement`, **congelado al crear la Action** — un
 * requisito que cambia después reescribiría si una entrega vieja era válida.
 *
 * El Service sigue recibiéndolo por parámetro, y eso no es una herencia: es la
 * frontera. Quien lee la Action es el Repository; el Service **hace cumplir la
 * regla**, no busca la configuración.
 *
 * ### Son tres estados, no dos
 *
 * `OPTIONAL` **no es** *"no hay Reflection"*: es que se ofrece la `CTA-016` y
 * omitirla es válido. `NO_CONFIGURADA` es que nadie configuró nada y no se
 * ofrece. El registro canónico de CTAs ya los distinguía —`CTA-016.aparece`
 * mira `reflectionConfigurada`, no `reflectionRequerida`—; el booleano de la
 * B2.4 los había colapsado, y por eso la Reflection opcional no existía en la
 * UI.
 */
export type RequisitoDeReflexion = "NO_CONFIGURADA" | "OPTIONAL" | "REQUIRED";

/** Lo mínimo que hace válida a una Reflection. Ver `C01-051` para el resto. */
export interface ReflexionEntregada {
  /** Al menos uno: la Reflection cuelga de algo (`reflection_belongs_somewhere`). */
  actionId?: string;
  evidenceId?: string;
  protocolStepId?: string;
  actualMinutes?: number;
  difficulty?: "mas_facil" | "esperado" | "mas_dificil";
  note?: string;
}

export type ChequeoDeReflexion =
  | { estado: "OK" }
  /** Requerida y ausente. Bloquea el submit, y nada más. */
  | { estado: "FALTA_REFLEXION_REQUERIDA" }
  /** Presente pero sin contenido: una Reflection vacía no es una Reflection. */
  | { estado: "REFLEXION_VACIA" };

/**
 * ¿Se puede enviar la Evidence?
 *
 * **Sólo contesta eso.** No decide si la Evidence es suficiente, ni si el
 * dominio cambió: enviar no es suficiencia y suficiencia no es validación
 * (`AGENTS.md` §2.1).
 */
export function chequearParaEnviar(
  requisito: RequisitoDeReflexion,
  reflexion: ReflexionEntregada | null,
): ChequeoDeReflexion {
  if (requisito !== "REQUIRED") {
    // Sin obligación y ausente: se envía. Presente pero vacía **también** se
    // rechaza, y por el mismo motivo de siempre: si el estudiante escribió
    // algo, se guarda algo; si no escribió nada, no se guarda un objeto en
    // blanco que la Bitácora muestra como si hubiera reflexionado.
    if (!reflexion) return { estado: "OK" };
  } else if (!reflexion) {
    return { estado: "FALTA_REFLEXION_REQUERIDA" };
  }

  return tieneContenido(reflexion!) ? { estado: "OK" } : { estado: "REFLEXION_VACIA" };
}

/**
 * Una Reflection sin ningún dato es un registro vacío que después aparece en la
 * Bitácora como si el estudiante hubiera reflexionado. `C-04`/`P-09`: la
 * ausencia se ve como ausencia, no como un objeto con todo en blanco.
 */
function tieneContenido(r: ReflexionEntregada): boolean {
  return (
    r.actualMinutes !== undefined ||
    r.difficulty !== undefined ||
    (r.note !== undefined && r.note.trim().length > 0)
  );
}

/**
 * Una Reflection **cuelga de algo**: una Action, una Evidence o un paso. Es el
 * `CHECK reflection_belongs_somewhere` de §9, verificado antes de la base para
 * dar un error entendible.
 */
export function cuelgaDeAlgo(r: ReflexionEntregada): boolean {
  return Boolean(r.actionId || r.evidenceId || r.protocolStepId);
}
