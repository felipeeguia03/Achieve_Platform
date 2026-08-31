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
 * ### Qué NO está cerrado, y por eso no se inventa
 *
 * **`C01-051` está `OPEN` con gate `H`** —lo cierra una persona—:
 * *"Obligatoriedad de `Reflection`: configurable `OPTIONAL`/`REQUIRED` por
 * Action o paso. **La configuración exacta no está cerrada.**"*
 *
 * O sea: **dónde vive el flag y quién lo pone** es la decisión abierta. Este
 * Service recibe el requisito **por parámetro** y hace cumplir la regla; no
 * hay tabla de configuración, ni default, ni lectura de nada. Elegir uno sería
 * cerrar `C01-051` desde el código.
 */
export type RequisitoDeReflexion = "OPTIONAL" | "REQUIRED";

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
  if (requisito === "OPTIONAL") {
    // Opcional y ausente: se envía. Opcional y presente pero vacía **también**
    // se rechaza: si el estudiante escribió algo, se guarda algo.
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
