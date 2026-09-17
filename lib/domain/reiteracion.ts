import type { SeveridadDeRiesgo } from "./types";

/**
 * La regla mínima de `C01-021`, **pura** — Etapa B6.5.
 *
 * ⚠️ **PROVISIONAL — REQUIRES POST-MVP HUMAN VALIDATION.** Los números no están
 * acá: llegan en `UmbralDeReiteracion`, que sale de `risk_rule.threshold_config`
 * ([ADR-036](../../docs/decisions.md#adr-036)). Este archivo sabe **cómo se
 * cuenta**, no **cuánto hace falta** — y esa separación es lo que permite que la
 * psicopedagoga cambie el umbral cargando una fila, sin tocar código.
 *
 * ## Lo que cuenta, y lo que no
 *
 * **Cuenta el tipo de error, no el tema.** Decisión del PO, textual: el tema
 * *"es contexto explicativo"*, y dos errores del mismo tipo cuentan aunque
 * ocurran en ejercicios distintos.
 *
 * ⚠️ **Y eso es exactamente lo que la psicopedagoga objetó** — *"dos errores
 * procedimentales en contenidos no comparables **no necesariamente expresan la
 * misma dificultad**"*—. Corregido en la **B6.7.2**: el tema sigue siendo
 * contexto, pero la unidad de conteo incorporó el **objetivo de aprendizaje o
 * demanda**, y es eso lo que decide qué es comparable.
 *
 * ## Los dos números, que no son el mismo (`9.1`, B6.7.2)
 *
 * > *"Separar **'repetición detectada' de 'dificultad confirmada'**."*
 *
 * - **`repeticionDetectada`** — misma familia, sin exigir comparabilidad. Es
 *   *"una señal para explorar, no una prueba"*, y **nunca escala sola**.
 * - **`aparicionesComparables`** — misma familia **y mismo objetivo**. Es lo
 *   único que lee el umbral.
 *
 * Sin objetivo declarado **no hay comparabilidad que afirmar**, y entonces no se
 * escala. Cómo se define una *"tarea comparable"* sigue siendo de ella: está
 * entre lo que pidió evaluar antes de un piloto.
 *
 * ## Lo que deja contar (`9.6`, B6.7.2)
 *
 * Una entrega **insuficiente cuenta** si el error es identificable: excluirla
 * *"sesgaría la detección contra quienes más necesitan acompañamiento"*. Lo que
 * no cuenta es lo que no se puede leer.
 *
 * **La categoría secundaria no llega hasta acá, y es a propósito** (B6.7.1,
 * `9.5`). Ella pidió *"mantener un indicador transversal por tipo para análisis,
 * pero **sin usarlo solo para escalar**"*: la forma de que eso no dependa de la
 * disciplina de quien escriba la próxima query es que el evaluador **no reciba**
 * la secundaria.
 *
 * **No cuenta lo que nadie corroboró.** Un error inferido o ambiguo no
 * incrementa nada, y tampoco reinicia nada: una resolución limpia que nadie
 * verificó no puede borrar un contador.
 *
 * **No hay probabilidad ni score.** Es un conteo sobre una lista ordenada. El
 * mismo input da el mismo output siempre, y por eso los tests son
 * determinísticos.
 */

/** La confianza con la que alguien clasificó. **Declarada, no calculada.** */
export type ConfianzaDeClasificacion = "alta" | "media" | "baja";

/** Los tres estados de `9.6`. Otro eje que `evidence.lifecycle_state`. */
export type CalidadDeEvidencia =
  | "suficiente_de_logro"
  | "suficiente_para_identificar_error"
  | "no_interpretable";

/** Una observación, ya normalizada. El orden lo pone quien la lee. */
export interface ObservacionDeError {
  kind: "error" | "resolucion_limpia";
  /** Sin esto no cuenta ni reinicia: es el punto 6 de `C01-036`. */
  corroborated: boolean;
  observedAt: string;
  /** Ocurrió después de una acción correctiva. **Declarado, nunca inferido.** */
  trasAccionCorrectiva: boolean;
  /**
   * El objetivo de aprendizaje o demanda (`9.1`). **`null` es un estado
   * legítimo**: significa que nadie declaró contra qué comparar.
   */
  objetivoId: string | null;
  calidad: CalidadDeEvidencia | null;
  /** `9.6`: cuenta *"cuando permite identificar el error con claridad"*. */
  errorIdentificable: boolean | null;
  confianza: ConfianzaDeClasificacion | null;
  /**
   * `9.3` — las cinco condiciones que vuelven válida una corrección. Son
   * hechos declarados, no inferencias a partir de `after_action_id`.
   */
  correccionEntregada: boolean | null;
  correccionAccesible: boolean | null;
  estudianteSeInvolucro: boolean | null;
  nuevoIntentoIndependiente: boolean | null;
  confianzaMismoError: ConfianzaDeClasificacion | null;
  /**
   * `9.4` — calidad del acierto limpio. La identidad permite demostrar que los
   * dos intentos no son el mismo replay.
   */
  identidadIntento: string | null;
  tareaEquivalenteNoIdentica: boolean | null;
  espaciadaOSinModeloInmediato: boolean | null;
}

const ORDEN_DE_CONFIANZA: Record<ConfianzaDeClasificacion, number> = {
  baja: 0,
  media: 1,
  alta: 2,
};

/** Lo que sale de `threshold_config`. Ningún número está hardcodeado acá. */
export interface UmbralDeReiteracion {
  apariciones: { atencion: number; intervencion: number };
  /** Severidad de una reaparición tras una correctiva. `null` ⇒ no aplica. */
  reincidenciaTrasCorrectiva: SeveridadDeRiesgo | null;
  reiniciaConResolucionLimpia: boolean;
  soloCorroboradas: boolean;
  /** `9.1`: sin objetivo declarado no hay comparabilidad que afirmar. */
  exigeObjetivoComparable: boolean;
  /** `9.6`. */
  exigeErrorIdentificable: boolean;
  calidadExcluida: readonly CalidadDeEvidencia[];
  /** `null` ⇒ no se filtra por confianza. */
  confianzaMinima: ConfianzaDeClasificacion | null;
  /** `9.3`: `after_action_id` solo ya no acelera nada. */
  aceleraTrasCorreccionValida?: boolean;
  confianzaMismoErrorMinima?: ConfianzaDeClasificacion | null;
  /** `9.4`: cuántos desempeños independientes cierran el episodio activo. */
  aciertosLimpiosParaResolver?: number;
  exigeIntentosDistintos?: boolean;
  exigeUnoEspaciadoOSinModelo?: boolean;
}

export interface Reiteracion {
  /**
   * Apariciones **comparables** desde el último reinicio: misma familia y mismo
   * objetivo. Es lo único que lee el umbral.
   */
  apariciones: number;
  /**
   * Misma familia, sin exigir comparabilidad — `9.1`. *"Una señal para explorar,
   * no una prueba"*: puede ser mayor que `apariciones`, y **no escala sola**.
   */
  repeticionDetectada: number;
  /**
   * Observaciones que no se pudieron contar porque no se podía leer qué pasó
   * (`9.6`). Se registran igual: **descartarlas del registro sería perder el
   * hecho de que hubo una entrega**.
   */
  noInterpretables: number;
  /** Aciertos limpios válidos acumulados en el episodio todavía activo. */
  aciertosLimpios: number;
  /** Cuántos episodios se recuperaron sin borrar sus observaciones. */
  recuperaciones: number;
  /** La última observación dejó el alcance recuperado. */
  recuperada: boolean;
  /** Hubo un error nuevo después de una recuperación previa. */
  recaida: boolean;
  /** `null` ⇒ todavía no alcanza ningún umbral. **No es "bajo".** */
  severidad: SeveridadDeRiesgo | null;
  necesitaPersona: boolean;
  /**
   * Por qué, en texto. El spec lo exige dos veces: *"nunca un score opaco como
   * única salida"*. Sin esto la señal no se puede ni registrar.
   */
  motivo: string | null;
}

/**
 * ¿Esta observación se puede contar? — `9.6`, B6.7.2.
 *
 * > *"**No contar** fotos ilegibles, respuestas vacías, abandono sin producción
 * > o materiales donde no pueda distinguirse qué ocurrió."*
 *
 * **Una entrega insuficiente no está acá**, y es deliberado: ella aprobó que
 * cuente, porque excluirla *"sesgaría la detección contra quienes más necesitan
 * acompañamiento"*. Lo que se excluye es lo ilegible, no lo incompleto.
 */
function sePuedeLeer(o: ObservacionDeError, umbral: UmbralDeReiteracion): boolean {
  if (umbral.soloCorroboradas && !o.corroborated) return false;
  if (o.calidad !== null && umbral.calidadExcluida.includes(o.calidad)) return false;
  if (umbral.confianzaMinima !== null && o.confianza !== null) {
    if (ORDEN_DE_CONFIANZA[o.confianza] < ORDEN_DE_CONFIANZA[umbral.confianzaMinima]) return false;
  }
  // La identificabilidad es una condición sobre el **error**. Una resolución
  // limpia no tiene un error que identificar.
  if (umbral.exigeErrorIdentificable && o.kind === "error" && o.errorIdentificable !== true) {
    return false;
  }
  return true;
}

function confianzaAlcanza(
  actual: ConfianzaDeClasificacion | null,
  minima: ConfianzaDeClasificacion | null,
): boolean {
  if (minima === null) return true;
  return actual !== null && ORDEN_DE_CONFIANZA[actual] >= ORDEN_DE_CONFIANZA[minima];
}

/** `9.3`: las cinco condiciones son conjuntas. Una sola ausente invalida la aceleración. */
function correccionValida(o: ObservacionDeError, umbral: UmbralDeReiteracion): boolean {
  if (umbral.aceleraTrasCorreccionValida !== true) return o.trasAccionCorrectiva;
  return (
    o.trasAccionCorrectiva &&
    o.correccionEntregada === true &&
    o.correccionAccesible === true &&
    o.estudianteSeInvolucro === true &&
    o.nuevoIntentoIndependiente === true &&
    confianzaAlcanza(o.confianzaMismoError, umbral.confianzaMismoErrorMinima ?? null)
  );
}

function aciertoLimpioValido(o: ObservacionDeError, umbral: UmbralDeReiteracion): boolean {
  // Las versiones anteriores declaraban `resolucion_limpia` como correcta,
  // independiente y sin ayuda, pero no tenían columnas para demostrarlo. No se
  // reescribe su significado al estrenar el lector nuevo.
  if ((umbral.aciertosLimpiosParaResolver ?? 1) <= 1) return true;
  return (
    o.nuevoIntentoIndependiente === true &&
    o.tareaEquivalenteNoIdentica === true &&
    o.identidadIntento !== null
  );
}

/**
 * Cuenta las apariciones de una familia dentro de una preparación, **separando
 * lo comparable de lo meramente repetido**, y traduce el conteo a severidad.
 *
 * `objetivoEvaluado` es contra qué se compara. `null` ⇒ nadie lo declaró, y
 * entonces —si el umbral lo exige— **no hay apariciones comparables**: se cuenta
 * la repetición, y no se escala.
 *
 * **El reinicio respeta el mismo alcance que el conteo.** Una resolución limpia
 * de otro objetivo no puede apagar el contador de éste: sería reiniciar por algo
 * que no es comparable, el mismo error al revés.
 *
 * **La reincidencia tras una correctiva exige que ya hubiera pasado antes.** El
 * PO lo dijo como *"una **nueva** aparición después de una acción correctiva
 * fallida"*, y una primera aparición no es una reincidencia: sería castigar el
 * primer error de alguien que justo venía de otra cosa.
 */
export function evaluarReiteracion(
  observaciones: readonly ObservacionDeError[],
  umbral: UmbralDeReiteracion,
  etiquetaDelTipo: string,
  objetivoEvaluado: string | null = null,
): Reiteracion {
  const ordenadas = [...observaciones].sort((a, b) => a.observedAt.localeCompare(b.observedAt));

  let comparables = 0;
  let detectadas = 0;
  let noInterpretables = 0;
  let ultimaCorreccionValida = false;
  let aciertosLimpios = 0;
  let recuperaciones = 0;
  let recuperada = false;
  let recaida = false;
  let huboRecuperacion = false;
  let hayAciertoEspaciadoOSinModelo = false;
  const intentosLimpios = new Set<string>();

  // Sin objetivo declarado no hay nada contra qué comparar. Si el umbral **no**
  // lo exige, la familia entera vuelve a ser el alcance comparable, que es el
  // comportamiento anterior a la B6.7.2 y hay que pedirlo explícitamente.
  const hayComparabilidad = objetivoEvaluado !== null || !umbral.exigeObjetivoComparable;

  for (const o of ordenadas) {
    if (o.calidad === "no_interpretable") noInterpretables++;
    if (!sePuedeLeer(o, umbral)) continue;

    const esDelMismoObjetivo = !umbral.exigeObjetivoComparable || o.objetivoId === objetivoEvaluado;

    if (o.kind === "resolucion_limpia") {
      // Resolver exige el mismo alcance que contar. Un acierto sobre otro
      // objetivo no puede cerrar este episodio.
      if (
        umbral.reiniciaConResolucionLimpia &&
        esDelMismoObjetivo &&
        aciertoLimpioValido(o, umbral)
      ) {
        const identidad = o.identidadIntento ?? `legacy:${o.observedAt}`;
        if (!umbral.exigeIntentosDistintos || !intentosLimpios.has(identidad)) {
          intentosLimpios.add(identidad);
          aciertosLimpios++;
          hayAciertoEspaciadoOSinModelo ||= o.espaciadaOSinModeloInmediato === true;
        }

        const alcanzaCantidad = aciertosLimpios >= (umbral.aciertosLimpiosParaResolver ?? 1);
        const alcanzaCalidad =
          !umbral.exigeUnoEspaciadoOSinModelo || hayAciertoEspaciadoOSinModelo;
        if (alcanzaCantidad && alcanzaCalidad) {
          comparables = 0;
          detectadas = 0;
          ultimaCorreccionValida = false;
          recuperaciones++;
          recuperada = true;
          huboRecuperacion = true;
          aciertosLimpios = 0;
          intentosLimpios.clear();
          hayAciertoEspaciadoOSinModelo = false;
        }
      }
      continue;
    }

    detectadas++;
    if (hayComparabilidad && esDelMismoObjetivo) {
      if (huboRecuperacion) recaida = true;
      comparables++;
      recuperada = false;
      aciertosLimpios = 0;
      intentosLimpios.clear();
      hayAciertoEspaciadoOSinModelo = false;
      ultimaCorreccionValida = correccionValida(o, umbral);
    }
  }

  const vacio = {
    apariciones: comparables,
    repeticionDetectada: detectadas,
    noInterpretables,
    aciertosLimpios,
    recuperaciones,
    recuperada,
    recaida,
    severidad: null,
    necesitaPersona: false,
    motivo: null,
  } as const;

  if (comparables === 0) return { ...vacio };

  const reincide =
    umbral.reincidenciaTrasCorrectiva !== null && ultimaCorreccionValida && comparables >= 2;

  const severidad: SeveridadDeRiesgo | null = reincide
    ? umbral.reincidenciaTrasCorrectiva
    : comparables >= umbral.apariciones.intervencion
      ? "intervencion"
      : comparables >= umbral.apariciones.atencion
        ? "atencion"
        : null;

  if (severidad === null) return { ...vacio };

  const veces = `${comparables} ${comparables === 1 ? "vez" : "veces"}`;

  // ⚠️ **La causa no estrena vocabulario.** `risk_signal.reason` llega a la
  // pantalla del estudiante como el detalle de su propia señal (B6.6.2), y
  // *"tareas comparables"* es vocabulario interno que nadie revisó. Ella pidió
  // *"una revisión experta de lenguaje, accesibilidad, privacidad y no
  // estigmatización **antes de probar con personas**"*, así que este texto se
  // queda como estaba: sigue siendo cierto, porque `comparables` **son**
  // apariciones en esta preparación. Omitir no es inventar.
  //
  // La distinción entre detectado y comparable viaja en el resultado, no en la
  // frase — y llega a la persona que recibe el caso en la **B6.7.3**, que es
  // donde ella la pidió: *"con la evidencia y el historial de apoyos, no sólo
  // con un contador"*.
  const motivo = reincide
    ? `${etiquetaDelTipo}: volvió a aparecer después de una acción correctiva, ${veces} en esta preparación`
    : `${etiquetaDelTipo}: ${veces} en la preparación de este examen`;

  return {
    apariciones: comparables,
    repeticionDetectada: detectadas,
    noInterpretables,
    aciertosLimpios,
    recuperaciones,
    recuperada,
    recaida,
    severidad,
    necesitaPersona: severidad === "intervencion",
    motivo,
  };
}

/**
 * Lee el umbral desde el JSON de configuración.
 *
 * **Devuelve `null` si la regla no tiene umbral**, y eso no es un error: es una
 * regla que nadie configuró todavía, y el llamador tiene que no evaluar nada.
 * Poner defaults acá sería inventar el umbral que `C01-036` no cerró.
 */
export function umbralDesdeConfig(config: unknown): UmbralDeReiteracion | null {
  if (config === null || typeof config !== "object") return null;
  const c = config as Record<string, unknown>;
  const ap = c.apariciones as Record<string, unknown> | undefined;
  if (!ap || typeof ap.atencion !== "number" || typeof ap.intervencion !== "number") return null;

  const reincidencia = c.reincidencia_tras_correctiva;
  const confianza = c.confianza_minima;
  const excluida = Array.isArray(c.calidad_excluida)
    ? (c.calidad_excluida.filter((v) => typeof v === "string") as CalidadDeEvidencia[])
    : [];

  return {
    apariciones: { atencion: ap.atencion, intervencion: ap.intervencion },
    reincidenciaTrasCorrectiva:
      typeof reincidencia === "string" ? (reincidencia as SeveridadDeRiesgo) : null,
    reiniciaConResolucionLimpia: c.reinicia_con_resolucion_limpia === true,
    soloCorroboradas: c.solo_corroboradas === true,
    // **Los tres defaults son `false` / vacío a propósito.** Una configuración
    // vieja que no los declara se comporta como antes de la B6.7.2, en vez de
    // heredar en silencio una exigencia que su autor nunca escribió.
    exigeObjetivoComparable: c.exige_objetivo_comparable === true,
    exigeErrorIdentificable: c.exige_error_identificable === true,
    calidadExcluida: excluida,
    confianzaMinima:
      confianza === "alta" || confianza === "media" || confianza === "baja" ? confianza : null,
    aceleraTrasCorreccionValida: c.accelerate_after_valid_correction === true,
    confianzaMismoErrorMinima:
      c.same_error_confidence_minima === "alta" ||
      c.same_error_confidence_minima === "media" ||
      c.same_error_confidence_minima === "baja"
        ? c.same_error_confidence_minima
        : null,
    // Compatibilidad histórica: las versiones que sólo decían `reinicia=true`
    // conservan el significado de un acierto. La v4 declara el dos de `9.4`.
    aciertosLimpiosParaResolver:
      typeof c.clean_successes_to_resolve === "number" && c.clean_successes_to_resolve > 0
        ? c.clean_successes_to_resolve
        : c.reinicia_con_resolucion_limpia === true
          ? 1
          : Number.POSITIVE_INFINITY,
    exigeIntentosDistintos: c.clean_successes_distinct_attempts === true,
    exigeUnoEspaciadoOSinModelo: c.clean_successes_require_spacing_or_no_model === true,
  };
}
