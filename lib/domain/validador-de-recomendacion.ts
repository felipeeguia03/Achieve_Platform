import type { RecomendacionDelAde } from "./ade";

/**
 * El validador determinista del ADE — Etapa B4.1.
 *
 * [ADR-004](../../docs/decisions.md#adr-004) lo pide con estas palabras: *"un
 * validador determinista […] verifica que la Action sea ejecutable, que respete
 * disponibilidad y que **no se afirma dominio, progreso ni readiness
 * inexistente**. Ese validador es la parte que no se puede saltear"*. Y agrega
 * cuál es el orden: **la v1 construye el validador y las reglas; el LLM no.**
 *
 * ## Por qué existe si la v1 no puede violarlo
 *
 * Hoy el ADE es determinista y su razón sale de plantillas de este mismo
 * repositorio, así que en condiciones normales **no debería violar nada**. Eso
 * no lo vuelve decorativo, por dos motivos:
 *
 * 1. **Es el guard de publicación, no un lint.** Lo que no pasa por acá no se
 *    materializa. El día que la razón venga de otra fuente —un LLM, una
 *    plantilla editada por alguien, contenido de la cátedra— el guard ya está
 *    puesto, y no hay que acordarse de agregarlo.
 * 2. **Hace real una rama que el contrato exige.** `ERROR` estaba en el tipo y
 *    no la producía nada. Una recomendación rechazada **es** el caso de error
 *    del ADE: se decidió algo y no se puede publicar.
 *
 * ## Qué valida, y de dónde sale cada regla
 *
 * De `product.md` §13, *Copy prohibido*, que es la lista consolidada de lo que
 * el producto no dice nunca. **No están las 22 filas**: están las que un motor
 * de recomendación puede violar al escribir el objetivo o la razón de una
 * acción. Las que hablan del protocolo de examen o de la revisión humana no las
 * puede producir esta salida, y agregarlas sería teatro.
 *
 * Cada regla cita la fila que la origina. Si alguien agrega una fila a §13 que
 * el ADE pueda violar, esto se queda corto **y hay un test que lo dice**.
 */

export interface ReglaDeCopy {
  /** Qué afirma de más. Es lo que se le muestra a quien tenga que arreglarlo. */
  afirma: string;
  /** La fila de `product.md` §13 que la origina, textual. */
  origen: string;
  patron: RegExp;
}

/**
 * Los patrones son **deliberadamente amplios**: prefieren rechazar una
 * recomendación válida a publicar una que afirme dominio. Un falso positivo
 * cuesta una recomendación; un falso negativo le dice a un estudiante que
 * aprendió algo que nadie verificó.
 */
export const REGLAS: readonly ReglaDeCopy[] = [
  {
    afirma: "dominio o aprendizaje que nadie verificó",
    origen: '"Dominaste la unidad" sin prueba aplicable — confunde actividad con dominio',
    patron: /\b(domin[aá]\w*|aprendiste|ya sab[eé]s|te lo sab[eé]s|demostraste que (?:sab|entend|domin))/i,
  },
  {
    afirma: "progreso sin un resultado autoritativo detrás",
    origen: '"Subiste tu nivel" / "Ganaste progreso" — gamificación sin hecho autoritativo',
    patron: /\b(subiste (?:tu )?nivel|ganaste (?:progreso|puntos?|una racha)|nivel \d|racha de)/i,
  },
  {
    afirma: "una magnitud de progreso que no existe",
    origen: '"La materia aumentó X%" — no existe métrica de porcentaje aprobada',
    patron: /\d+\s*%|\b\d+\s+de\s+\d+\s+(?:pasos?|unidades?|temas?)\b/i,
  },
  {
    afirma: "ausencia de avance a partir de ausencia de datos",
    origen: '"No avanzaste" por ausencia de datos — sin datos no es cero',
    patron: /\bno (?:avanzaste|progresaste|hiciste nada)\b/i,
  },
  {
    afirma: "un juicio sobre la persona o sobre su entrega",
    origen: '"Tu evidencia está mal" / "Fallaste" — INSUFFICIENT no es fracaso personal',
    patron: /\b(fallaste|fracasaste|est[aá] mal|te equivocaste|sos (?:un |una )?\w+)\b/i,
  },
  {
    afirma: "readiness o una predicción de resultado",
    origen: '"Listo para rendir" — READY_BY_PROTOCOL no predice aprobación',
    patron: /\b(list[oa] para rendir|vas a aprobar|apruebas? seguro|ten[eé]s asegurado)\b/i,
  },
  {
    afirma: "presencia humana sin assignment ni SLA",
    origen: '"Agus la revisará hoy" sin assignment ni SLA — presencia humana decorativa',
    patron: /\b(te (?:vamos a )?contactar\w*|alguien (?:te )?(?:va a )?(?:revisar|escribir)|en breve)\b/i,
  },
  {
    afirma: "actividad del sistema que nadie observó",
    origen: '"Estamos calculando" sin proceso real observado — falsa actividad del sistema',
    patron: /\b(estamos calculando|analizando tu|procesando tu)\b/i,
  },
  {
    afirma: "que repetir un tema es retroceder",
    origen:
      '"Retrocediste" / "Volviste atrás" al repetir un paso — HUMAN-P0-01: el recorrido es reentrante',
    patron: /\b(retrocediste|volviste atr[aá]s|perdiste (?:el )?(?:progreso|avance))\b/i,
  },
  {
    afirma: "que un apoyo producido demuestra aprendizaje",
    origen:
      '"Tu resumen / tu ficha / tu cronograma demuestra que aprendiste" — HUMAN-P0-05: es evidencia de trabajo',
    patron: /\b(?:resumen|ficha|mapa|cronograma)\b[^.]{0,40}\bdemuestra\b/i,
  },
];

export type ResultadoDeValidacion =
  | { estado: "OK" }
  | {
      estado: "RECHAZADA";
      /** Qué campo la violó: sirve para arreglar la plantilla, no para culpar. */
      campo: "objetivo" | "razon" | "evidenciaEsperada" | "criterioDeCierre";
      afirma: string;
      origen: string;
      texto: string;
    };

/** Los campos de la recomendación que **se le muestran al estudiante**. */
const CAMPOS_VISIBLES = ["objetivo", "razon", "evidenciaEsperada", "criterioDeCierre"] as const;

/**
 * ¿Se puede publicar esta recomendación?
 *
 * **Sólo revisa lo que el estudiante llega a leer.** `prioridad` ordena y nunca
 * se muestra; `topicId` y `recursoId` son identificadores. Validar el copy de
 * algo invisible daría una sensación de cobertura que no existe.
 */
export function validarRecomendacion(rec: RecomendacionDelAde): ResultadoDeValidacion {
  for (const campo of CAMPOS_VISIBLES) {
    const texto = rec[campo];
    if (typeof texto !== "string" || texto.length === 0) continue;

    for (const regla of REGLAS) {
      if (regla.patron.test(texto)) {
        return {
          estado: "RECHAZADA",
          campo,
          afirma: regla.afirma,
          origen: regla.origen,
          texto,
        };
      }
    }
  }

  return { estado: "OK" };
}
