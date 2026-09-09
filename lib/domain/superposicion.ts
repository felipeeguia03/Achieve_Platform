import { diaDeSemana, fechaEnZona, instanteEnZona } from "./zona";

/**
 * Cuándo un compromiso se superpone con una clase —
 * [ADR-064](../../docs/decisions.md#adr-064).
 *
 * La decisión del Product Owner, textual:
 *
 * > *"La restricción horaria pertenece a la propuesta y validación del
 * > `Commitment`, no al ADE."*
 * >
 * > *"El ADE continúa decidiendo qué hacer, sobre qué materia o unidad, cuántos
 * > minutos dedicar. **El flujo de `Commitment` decide cuándo hacerlo.**"*
 *
 * Por eso esto vive en el dominio y no en el motor: es una regla sobre un
 * horario propuesto, y el ADE nunca propone uno.
 *
 * ## Las dos cosas que esta función NO hace
 *
 * ⚠️ **No decide qué pasa con el conflicto.** Devuelve el bloque que se pisa, y
 * nada más. Qué se le ofrece al estudiante lo decide `UX04`, con las dos
 * salidas que el ADR nombra —elegir otro horario **o corregir el bloque de
 * clase**—, porque *"la pantalla no puede asumir que el equivocado es él"*.
 *
 * ⚠️ **No sabe de disponibilidad.** `availability` dice cuándo puede estudiar;
 * un bloque de clase dice cuándo está cursando. [ADR-063](../../docs/decisions.md#adr-063)
 * prohíbe mezclarlas, y esta función sólo mira las segundas.
 *
 * ## Sin horarios conocidos, no pasa nada
 *
 * Es la mitigación de riesgo del corte: **una lista vacía nunca da conflicto**,
 * así que un estudiante sin horarios cargados se comporta exactamente como
 * antes de que esta regla existiera. Hay test de eso.
 */

/** La versión de la regla. Cambiarla **no** reescribe compromisos viejos. */
export const REGLA_DE_SUPERPOSICION = "superposicion-v1";

/** Un bloque del horario semanal, como lo guarda `class_schedule_block`. */
export interface BloqueSemanal {
  /** `0`–`6`, domingo a sábado. La escala de `availability`. */
  dia: number;
  /** `HH:MM` o `HH:MM:SS` — Postgres entrega `TIME` con segundos. */
  desde: string;
  hasta: string;
}

export interface FranjaPropuesta {
  /** El instante acordado. */
  inicio: string;
  /** Cuánto dura. **No se estima**: viene del acuerdo. */
  minutos: number;
  /**
   * La zona de la **institución** ([ADR-049](../../docs/decisions.md#adr-049)),
   * no la del estudiante. El horario de clase es un hecho de la cátedra, y dos
   * estudiantes de la misma comisión en husos distintos cursan a la misma hora.
   */
  zonaInstitucional: string;
}

/**
 * El primer bloque que se pisa con la franja, o `null` si no se pisa ninguno.
 *
 * ## Los bordes, que son la mitad de la regla
 *
 * Los dos intervalos son **semiabiertos**: `[inicio, fin)` contra
 * `[desde, hasta)`. Terminar **justo** cuando empieza la clase **no es
 * conflicto**, y empezar justo cuando termina, tampoco. Tratarlos como
 * conflicto haría imposible lo más razonable que alguien puede hacer —estudiar
 * pegado a la clase—, y nadie entendería por qué.
 *
 * ## Por qué se prueban tres días y no uno
 *
 * Una franja puede cruzar la medianoche, y un bloque semanal vive dentro de un
 * día. Se materializa cada bloque en el día de la franja y en sus dos vecinos,
 * y se compara en **instantes absolutos**: así el cambio de hora de verano no
 * corre nada, porque el offset se le pregunta a la zona para cada día concreto.
 */
export function bloqueQueSeSuperpone(
  franja: FranjaPropuesta,
  bloques: readonly BloqueSemanal[],
): BloqueSemanal | null {
  return ocurrenciaQueSeSuperpone(franja, bloques)?.bloque ?? null;
}

/**
 * Lo mismo, pero con **cuándo** cae esa clase esta semana.
 *
 * Es lo que necesita `primerInicioSinClase` para saltarla: la regla es semanal
 * y el salto es un instante. La versión pública devuelve sólo el bloque porque
 * es lo único que se muestra, y una API que expone milisegundos invita a que
 * alguien haga aritmética de husos por su cuenta.
 */
function ocurrenciaQueSeSuperpone(
  franja: FranjaPropuesta,
  bloques: readonly BloqueSemanal[],
): { bloque: BloqueSemanal; desde: number; hasta: number } | null {
  // Sin horarios conocidos no hay contra qué comparar, y **no se bloquea
  // nada**: la ausencia no es disponibilidad, pero tampoco es un impedimento
  // (ADR-064).
  if (bloques.length === 0) return null;

  const inicio = Date.parse(franja.inicio);
  // Una franja sin instante válido o sin duración no se puede evaluar, y **no
  // se inventa una**: se deja pasar, que es lo que hacía antes de esta regla.
  // La duración positiva ya la exige la ruta.
  if (!Number.isFinite(inicio) || franja.minutos <= 0) return null;

  const fin = inicio + franja.minutos * 60_000;

  for (const dias of [-1, 0, 1]) {
    const fecha = fechaEnZona(inicio + dias * 86_400_000, franja.zonaInstitucional);
    const dia = diaDeSemana(fecha);

    for (const bloque of bloques) {
      if (bloque.dia !== dia) continue;
      const desde = instanteEnZona(fecha, bloque.desde, franja.zonaInstitucional);
      const hasta = instanteEnZona(fecha, bloque.hasta, franja.zonaInstitucional);
      if (inicio < hasta && desde < fin) return { bloque, desde, hasta };
    }
  }

  return null;
}

/**
 * El primer inicio, **desde el propuesto hacia adelante**, que no pisa ninguna
 * clase.
 *
 * Es la otra mitad de [ADR-064](../../docs/decisions.md#adr-064): *"la
 * restricción horaria pertenece a **la propuesta** y validación del
 * `Commitment`"*. Proponerle a alguien un horario que el servidor va a rechazar
 * es el defecto que [ADR-050](../../docs/decisions.md#adr-050) ya corrigió una
 * vez —*"la pantalla ofrecía algo que el backend no podía hacer"*—, y esto
 * existe para no repetirlo.
 *
 * ## Lo que NO hace
 *
 * ⚠️ **No busca el mejor horario.** Salta la clase y redondea al próximo paso;
 * elegir *bien* cuándo estudiar sería agendar, y **el ADE no agenda**. Es una
 * propuesta que el estudiante puede cambiar, no una decisión.
 *
 * El límite de vueltas no es defensivo: cada una salta **un bloque entero**, así
 * que con `n` bloques hay a lo sumo `n` saltos, más uno por el redondeo.
 */
export function primerInicioSinClase(
  franja: FranjaPropuesta,
  bloques: readonly BloqueSemanal[],
  pasoEnMinutos = 30,
): string {
  const original = Date.parse(franja.inicio);
  // Una entrada que no se puede leer se devuelve **tal cual**: normalizar una
  // fecha ilegible es inventarla.
  if (!Number.isFinite(original) || franja.minutos <= 0) return franja.inicio;

  /*
    **Devuelve siempre el instante normalizado, se haya movido o no.** Si el
    camino sin bloques devolviera el texto original y el otro un ISO en UTC, el
    que llama vería dos strings distintos para el mismo instante y creería que
    la propuesta se corrió — y se lo diría al estudiante.
  */
  if (bloques.length === 0) return new Date(original).toISOString();

  const paso = pasoEnMinutos * 60_000;
  let inicio = original;

  for (let vuelta = 0; vuelta <= bloques.length; vuelta++) {
    const candidato = new Date(inicio).toISOString();
    const pisa = ocurrenciaQueSeSuperpone({ ...franja, inicio: candidato }, bloques);
    if (!pisa) return candidato;
    // Justo al terminar la clase, redondeado hacia arriba: los bordes no son
    // conflicto, pero ofrecer «16:03» es ofrecer un horario que nadie eligió.
    inicio = Math.ceil(pisa.hasta / paso) * paso;
  }

  // No debería llegar acá con el límite de arriba. Si llegara, **se devuelve el
  // propuesto**: el servidor lo va a rechazar y va a decir por qué, que es mejor
  // que devolver un horario elegido por un bucle que se quedó sin vueltas.
  return franja.inicio;
}
