/**
 * Copy de interfaz, con ID estable.
 *
 * Regla `C-07` (design-system.md): **las frases de regla de negocio viven en un
 * archivo de contenido con ID**, no hardcodeadas en componentes. Con 51
 * contratos `C01` abiertos, una regla que cambia se corrige acá y no se caza
 * por seis archivos de JSX.
 *
 * Qué va acá y qué no:
 *
 *   - **Acá:** etiquetas, prefijos, textos de CTA y frases de regla de negocio
 *     que no dependen del escenario.
 *   - **En el fixture:** todo dato del dominio — el objetivo de una Action, la
 *     razón del ADE, una fecha, un nombre de materia.
 *
 * Tono: **voseo rioplatense, sin excepciones** (regla `C-01`). *"Entregá"*,
 * *"Subí"*, *"Comprometerme"*. Una etiqueta en usted dentro de un producto que
 * vosea es el anti-patrón `A-05`.
 *
 * Los enums técnicos (`official`, `unverified`, `SUBMITTED`…) **nunca**
 * aparecen como copy visible salvo donde la propia spec los muestra como
 * estado operativo del sistema.
 */

/**
 * La subcopy explicativa de cada superficie — `D-02` de
 * `design-system-capturas.md` §14.2.
 *
 * Las capturas ponen, bajo el título de cada panel, un párrafo que dice **qué
 * es esto y por qué importa** en lenguaje llano (§11.9.4). Achieve ponía el
 * título y la fecha, y nada más.
 *
 * **Escrita por el owner en la Etapa A2.6.** Las nueve frases salen del JTBD
 * de cada spec (`product-spec-source.md`, Parte VI), no de la capa visual:
 * cada una traduce a una o dos líneas la pregunta que esa pantalla ya declara
 * que debe responder en menos de 10 segundos. La cita de origen está en el
 * comentario de cada entrada, y `tests/titulos.test.tsx` verifica que sea
 * textual — una cita que deja de existir en el spec hace fallar el test.
 *
 * **Si una entrada vuelve a `null`, el panel no dibuja subcopy.** Omitir, no
 * inventar: la regla queda vigente para cualquier superficie futura.
 */
export const SUBCOPY = {
  /**
   * `UX01` Hoy — qué es "hoy" y por qué hay una sola acción.
   * VI.1 §1: *"El Hero responde “¿Qué necesita hacer el estudiante AHORA?”."*
   * ... *"No responde qué es lo más grave históricamente ni qué tiene el score
   * más alto."*
   */
  UX01: "Te mostramos una sola acción por vez: la que conviene hacer ahora, no la que acumuló más historia.",

  /**
   * `UX02` Materia / Cursado — qué son las cinco dimensiones y por qué no se suman.
   * VI.2 §1: *"inspeccionar Recorrido, Práctica, Dominio, Confianza y
   * Recencia sin colapsarlas en un % aprendido"*
   */
  UX02: "Recorrido, Práctica, Dominio, Confianza y Recencia se muestran por separado: fusionarlas en un solo número escondería en qué estás realmente.",

  /**
   * `UX03` Próxima Acción — por qué esta acción y no otra.
   * VI.3 §1.2: *"La pantalla convierte una recomendación ya priorizada en
   * una decisión binaria y comprensible"*
   */
  UX03: "Esta acción ya viene priorizada — acá entendés qué hacer, con qué y qué la cierra, sin necesidad de interpretar cómo se decidió.",

  /**
   * `UX04` Compromiso — qué cambia al comprometerse, y qué no.
   * VI.4 §1.2: *"La pantalla convierte una Action en estado ACCEPTED en un
   * Commitment confirmado... Antes del CTA final no existe un Commitment
   * confirmado ni visible"*
   */
  UX04: "Comprometerte no cambia el trabajo académico: solo acuerda cuándo y cómo vas a hacerlo. Hasta que confirmes, no queda registrado en ningún lado.",

  /**
   * `UX05` Evidencia — qué se espera adjuntar y qué pasa después de enviar.
   * VI.5 §1.1: *"presentar la producción acordada en segundos... entender
   * exactamente en qué estado queda."*
   */
  UX05: "Subís la producción que acordaste en el compromiso. Enviarla no significa que ya esté validada — eso lo confirma un paso aparte.",

  /**
   * `UX06` Progreso / Bitácora — qué registra y qué no.
   * VI.6 §3: *"pasar de “envié algo” a entender qué ocurrió realmente, qué
   * cambió o todavía no cambió... sin confundir actividad, validación y
   * aprendizaje."*
   */
  UX06: "Acá ves qué cambió de verdad después de tu evidencia, y qué todavía no tiene un cambio confirmado — sin inventar un avance que no ocurrió.",

  /**
   * `UX07` Activación Modo Examen — qué activa y qué no interrumpe.
   * VI.7 §4: *"activar un contexto específico de examen sin perder el
   * contexto persistente de la materia"*
   */
  UX07: "Activar Modo Examen agrega una preparación para este examen — no interrumpe ni reemplaza lo que ya venías haciendo en la materia.",

  /**
   * `UX08` Modo Examen / Overview — qué muestra esta preparación.
   * VI.8 §3: *"orientarse sin reconstruir el proceso... La degradación
   * honesta satisface mejor el JTBD que una etapa, recomendación o
   * porcentaje inventados."*
   */
  UX08: "Acá ves cómo viene tu preparación para este examen: qué está confirmado, qué falta y cuál es el próximo paso — sin inventar una etapa que no exista.",

  /**
   * `UX09` Paso de Protocolo — qué es un paso y cómo se cierra.
   * VI.9 §3: *"comprender inmediatamente qué producción concreta se espera
   * y cómo comenzar"*
   */
  UX09: "Un paso es un hito concreto de tu preparación: qué tenés que producir y qué lo cierra. Abrirlo no lo completa — eso lo confirma tu producción.",
} as const satisfies Record<string, string | null>;

export const copy = {
  // ── Prefijos y etiquetas compartidas ──────────────────────────────────────
  "COMUN.PORQUE": "Porque:",
  "COMUN.ENTREGA": "Entregá:",
  "COMUN.DESPUES": "Después:",
  "COMUN.CIERRE": "Cerrás cuando:",
  "COMUN.SIN_AVANCE": "Sin avance registrado",

  // ── Shell de aplicación (Fase A2) ─────────────────────────────────────────
  "SHELL.NAVEGACION": "Navegación principal",
  "SHELL.COLAPSAR": "Colapsar la navegación",
  "SHELL.EXPANDIR": "Expandir la navegación",
  "SHELL.BUSCAR": "Buscar…",
  "PALETA.TITULO": "Buscar en Achieve",
  "PALETA.PLACEHOLDER": "Buscá una pantalla o un escenario…",
  // La vía de escape de I-03 se muestra: forzar la interpretación no sirve si
  // hay que adivinar cómo se fuerza.
  "PALETA.AYUDA": "Escribí > para buscar sólo pantallas, o # para buscar sólo escenarios.",
  "PALETA.FORZADO.SUPERFICIE": "Buscando sólo pantallas.",
  "PALETA.FORZADO.ESCENARIO": "Buscando sólo escenarios.",
  "PALETA.VACIO": "No encontramos nada con eso.",
  "PALETA.VACIO_AYUDA": "Probá con el nombre de una pantalla, o con el ID de un escenario.",

  // ── UX01 · Hoy / Autogestión ──────────────────────────────────────────────
  "HOY.TITULO": "Hoy",
  "HOY.EYEBROW": "Proyección · no prioriza",
  "HOY.MATERIAS": "Materias",
  "HOY.PAGINACION": "de",
  "HOY.ULTIMO_AVANCE": "Último avance:",
  /**
   * `C-04` elevado. **Dos cláusulas, no tres:** la próxima acción la produce el
   * Academic Decision Engine, no el estudiante, así que decirle cómo hacerla
   * aparecer sería inventarle una palanca que no tiene.
   *
   * *"Hoy no hay"* y no *"todavía no hay"*: es una **ausencia confirmada** —el
   * ADE respondió que no hay recomendación—, no una carga pendiente. La salida
   * a materias se conserva: es una alternativa, no la forma de hacer aparecer
   * la acción.
   */
  "HOY.VACIO":
    "Hoy no hay una acción recomendada. Acá aparece la que conviene hacer ahora: es lo que te evita tener que decidir por dónde empezar. Mientras tanto, podés revisar tus materias.",

  // Estado general por nivel de precedencia.
  "HOY.ESTADO.ACTION_RECOMMENDED": "BAJO CONTROL",
  "HOY.ESTADO.IN_PROGRESS": "ACCIÓN EN CURSO",
  "HOY.ESTADO.EVIDENCE_PENDING": "FALTA CERRAR ESTA ACCIÓN",
  "HOY.ESTADO.RESCUE_REQUIRED": "NECESITA RECUPERACIÓN",
  "HOY.ESTADO.COMMITMENT_NEXT": "COMPROMISO ACORDADO",
  "HOY.ESTADO.COMMITMENT_MISSED": "COMPROMISO INCUMPLIDO",
  "HOY.ESTADO.CONTEXT_INCOMPLETE": "FALTA CONTEXTO DE CURSADO",
  "HOY.ESTADO.EVIDENCE_INFO": "SIN ACCIÓN PENDIENTE",
  "HOY.ESTADO.DEFECTO": "SIN ACCIONES POR AHORA",

  // ── CTAs · registro canónico en product.md §10.3 ──────────────────────────
  "CTA.COMPROMETERME": "Comprometerme",
  "CTA.ME_COMPROMETO": "Me comprometo",
  "CTA.CONTINUAR": "Continuar",
  "CTA.SUBIR_EVIDENCIA": "Subir evidencia",
  "CTA.RETOMAR": "Retomar",
  "CTA.VER_MATERIAS": "Ver materias",
  // Los verbos que ADR-017 desambiguó a partir de VI.1 §3.2.
  "CTA.VER_COMPROMISO": "Ver compromiso",
  "CTA.EMPEZAR": "Empezar",
  "CTA.EMPEZAR_RESCATE": "Empezar rescate",
  "CTA.VER_EVIDENCIA": "Ver evidencia",
  "CTA.VER_AVANCE": "Ver avance",
  "CTA.COMPLETAR_INFORMACION": "Completar información",
  "CTA.CONFIRMAR_COMPROMISO": "Confirmar compromiso",
  "CTA.ENVIAR_EVIDENCIA": "Enviar evidencia",
  "CTA.VER_SIGUIENTE_ACCION": "Ver siguiente acción",
  "CTA.NO_PUEDO": "No puedo hacerla · Corregir dato",
  "CTA.VER_RAZONES": "Ver razones y fuentes",
  "CTA.AGREGAR_REFLEXION": "Agregar reflexión (opcional)",
  "CTA.VER_BITACORA": "Ver Bitácora",

  // ── UX02 · Materia / Cursado ──────────────────────────────────────────────
  "MATERIA.TITULO": "Cursado",
  "MATERIA.AHORA": "Ahora",
  "MATERIA.CATEDRA_Y_VOS": "Cátedra y vos",
  "MATERIA.UNIDADES": "Unidades",
  "MATERIA.DIMENSIONES": "Cómo venís",
  /**
   * **Unificado en la auditoría de la Etapa 0.7.**
   *
   * `UX02` decía "Entrega:" (sustantivo) donde `UX01` dice "Entregá:"
   * (imperativo voseado), para **el mismo campo**. Las dos formas son español
   * correcto, así que no era un error: era la excepción que el checklist de
   * `design-system.md` §9 pide buscar —*"`C-01` Una sola persona gramatical.
   * Buscá la excepción: siempre hay una"*—.
   *
   * Se unificó a la forma de `UX01` por dos reglas escritas: `C-01` pide una
   * sola persona gramatical, y `C-02` pide un concepto = una palabra en menú,
   * título y copy. **Es un cambio de copy respecto del prototipo**, y por eso
   * queda anotado acá y en `docs/roadmap.md`.
   */
  "MATERIA.ENTREGA": "Entregá:",

  // ── UX03 · Próxima Acción ─────────────────────────────────────────────────
  "ACCION.DURACION": "Duración",
  "ACCION.RECURSO": "Usá",
  "ACCION.EVIDENCIA": "Evidencia",

  // ── UX04 · Compromiso ─────────────────────────────────────────────────────
  "COMPROMISO.ORIGINAL": "COMPROMISO ORIGINAL",
  "COMPROMISO.ORIGINAL_NO_EDITABLE": "El original se conserva sin cambios.",
  "COMPROMISO.FECHA": "Fecha",
  "COMPROMISO.HORA": "Hora",
  "COMPROMISO.TIEMPO_DECLARADO": "Tiempo que declarás",
  "COMPROMISO.EVIDENCIA_PREFIJO": "Evidencia esperada:",
  "COMPROMISO.CIERRE_PREFIJO": "Cierre:",
  "COMPROMISO.QUEDA": "queda",
  // Aceptar una Action NO crea un Commitment; confirmarlo sí (AGENTS.md §2.1).
  "COMPROMISO.RESULTADO": "en Hoy y Materia; podrás iniciarlo cuando corresponda.",

  // ── UX05 · Evidencia ──────────────────────────────────────────────────────
  "EVIDENCIA.ESPERADA": "Evidencia esperada",
  "EVIDENCIA.ADJUNTAR": "Adjuntar evidencia",
  "EVIDENCIA.PERMITIDO_PREFIJO": "Permitido:",
  /**
   * `C-04` elevado (§12.2). El vacío dice las tres cosas: **qué va a aparecer**,
   * **por qué importa** y **cómo hacer que aparezca**.
   *
   * No repite lo que ya está al lado —los formatos permitidos y la cadena de
   * `EVIDENCIA.ENVIAR_IMPLICA`— y no promete revisión ni suficiencia: *"la
   * acción sigue esperando"* es un hecho observable, no un veredicto (`C-06`).
   */
  "EVIDENCIA.SIN_ADJUNTO":
    "Todavía no adjuntaste la producción. Es lo que se envía como evidencia de esta acción: mientras no esté, la acción sigue esperando. Hacé clic para adjuntarla.",
  "EVIDENCIA.CARGADA_SUFIJO": "cargada",
  // Enviar no es demostrar suficiencia; suficiencia no es validación
  // (AGENTS.md §2.1). Esta frase es exactamente esa cadena de no-implicación.
  "EVIDENCIA.ENVIAR_IMPLICA":
    "Enviar: queda SUBMITTED; sigue validación. No implica suficiencia ni dominio.",

  // ── UX07 · Activación de Modo Examen ──────────────────────────────────────
  // Títulos de VI.7 §22.1 y CTAs semánticas de §22.2, literales.
  //
  // `EXAMEN.TITULO_PANTALLA` es el **título de documento** de la superficie.
  // Se llama distinto de `EXAMEN.TITULO.<estado>` —que son los banners
  // internos de cada wireframe crítico— a propósito: son dos cosas distintas
  // que comparten prefijo, y leer una como caso particular de la otra es el
  // error que `C-02` previene.
  "EXAMEN.TITULO_PANTALLA": "Activación",

  "EXAMEN.TITULO.RECOMENDACION": "RECOMENDACIÓN DE ACTIVACIÓN",
  "EXAMEN.TITULO.REVISION": "REVISÁ ESTA EVALUACIÓN",
  "EXAMEN.TITULO.NO_ACTIVO": "TODAVÍA NO ESTÁ ACTIVO",
  "EXAMEN.TITULO.ACTIVO": "MODO EXAMEN ACTIVO",
  "EXAMEN.TITULO.FALTAN_DATOS": "FALTAN DATOS PARA ACTIVAR",
  "EXAMEN.TITULO.CONTRADICTORIOS": "HAY DATOS CONTRADICTORIOS",
  "EXAMEN.TITULO.NO_DISPONIBLE": "NO PUDIMOS CARGAR LA EVALUACIÓN",
  "EXAMEN.TITULO.VERIFICANDO": "ESTAMOS VERIFICANDO LA ACTIVACIÓN",

  "CTA.EXAMEN.ACTIVAR": "ACTIVAR PREPARACIÓN DE ESTE EXAMEN",
  "CTA.EXAMEN.ACTIVAR_CON_ESTOS_DATOS": "ACTIVAR CON ESTOS DATOS",
  "CTA.EXAMEN.REVISAR": "REVISAR EVALUACIÓN",
  "CTA.EXAMEN.ABRIR": "ABRIR PREPARACIÓN",
  "CTA.EXAMEN.REINTENTAR": "REINTENTAR",
  "CTA.EXAMEN.VOLVER_CURSADO": "VOLVER A CURSADO",

  "EXAMEN.QUE_CAMBIA": "QUÉ CAMBIA",
  "EXAMEN.QUE_NO_CAMBIA": "QUÉ NO CAMBIA",
  "EXAMEN.DESPUES": "DESPUÉS",
  "EXAMEN.FALTANTES": "FALTAN ESTOS DATOS",
  "EXAMEN.ELEGI": "ELEGÍ UNA EVALUACIÓN",
  "EXAMEN.ANTES": "antes:",
  // VI.7 §16.14: "lista sin ranking local". La UI no prioriza.
  "EXAMEN.ORDEN_RECIBIDO": "La lista conserva el orden recibido. No prioriza académicamente.",
  // VI.7 §24.2: materia y comisión pertenecen al CourseEnrollment de origen.
  "EXAMEN.NO_ES_SELECTOR": "Materia y comisión no son selectores: pertenecen a esta materia.",
  "EXAMEN.VOLVER_PREFIJO": "Volver a",

  // ── UX08 · Modo Examen / Overview ─────────────────────────────────────────
  // Microcopy de VI.8 §23, literal.
  "OVERVIEW.TITULO": "Modo Examen",
  "OVERVIEW.EXAMEN": "EXAMEN",
  "OVERVIEW.RECORRIDO": "RECORRIDO VIGENTE",
  "OVERVIEW.SIN_RECORRIDO": "RECORRIDO TODAVÍA NO DISPONIBLE",
  /**
   * `C-04` elevado. **Dos cláusulas:** el recorrido lo arma el servicio
   * propietario, no el estudiante. Antes esta sección mostraba un rótulo y
   * debajo nada — el caso más puro de *"el vacío dice que no hay dato"*.
   *
   * No promete cuándo va a estar: `VI.8` §3 pide **degradación honesta**, y una
   * fecha inventada sería peor que la ausencia.
   */
  "OVERVIEW.SIN_RECORRIDO_EXPLICA":
    "Acá va a aparecer el orden de pasos de esta preparación. Es lo que te dice por dónde seguir sin tener que reconstruirlo vos.",
  "OVERVIEW.ULTIMO_CAMBIO": "ÚLTIMO CAMBIO",
  "OVERVIEW.PENDIENTE": "PENDIENTE",
  "OVERVIEW.DESPUES": "Después:",
  "OVERVIEW.SECUNDARIOS": "TAMBIÉN",
  "OVERVIEW.CURSADO": "CURSADO PERSISTENTE",

  "CTA.OVERVIEW.CONTINUAR": "CONTINUAR",
  "CTA.OVERVIEW.SUBIR_EVIDENCIA": "SUBIR EVIDENCIA",
  "CTA.OVERVIEW.VER_COMPROMISO": "VER COMPROMISO",
  "CTA.OVERVIEW.EMPEZAR": "EMPEZAR",
  "CTA.OVERVIEW.RETOMAR": "RETOMAR",
  "CTA.OVERVIEW.NUEVA_EVIDENCIA": "PREPARAR NUEVA EVIDENCIA",
  "CTA.OVERVIEW.COMPROMETERME": "COMPROMETERME",
  "CTA.OVERVIEW.ABRIR_PASO": "ABRIR PASO ACTUAL",
  "CTA.OVERVIEW.VER_EVIDENCIA": "VER EVIDENCIA",
  "CTA.OVERVIEW.VER_AVANCE": "VER AVANCE",
  "CTA.OVERVIEW.VER_BITACORA": "VER BITÁCORA",
  "CTA.OVERVIEW.VOLVER_CURSADO": "VOLVER A CURSADO",

  // ── UX09 · Paso de Protocolo ──────────────────────────────────────────────
  // Microcopy de VI.9 §24, literal.
  "PASO.TITULO": "Paso",
  "PASO.MODO_EXAMEN": "MODO EXAMEN",
  "PASO.ACTUAL": "PASO ACTUAL",
  "PASO.OBJETIVO": "OBJETIVO DEL PASO",
  "PASO.ENTREGABLE": "ENTREGABLE ESPERADO",
  "PASO.CRITERIO": "CRITERIO ESPERADO",
  "PASO.COMO_TRABAJARLO": "CÓMO TRABAJARLO",
  "PASO.RECURSO": "RECURSO CONFIGURADO",
  "PASO.CONFIGURACION": "CONFIGURACIÓN",
  "PASO.FUENTE_CONTENIDO": "Fuente del contenido:",
  // §14: el objetivo del paso NO es una Action generada por el Engine.
  "PASO.SEPARACION": "Objetivo del paso. No es una próxima acción generada por el Engine.",
  "PASO.ABRIR_NO_COMPLETA": "Abriste este paso. Abrirlo no lo completa.",
  "PASO.CIERRE_NO_CONFIRMADO": "Cierre del paso todavía no confirmado.",

  "CTA.PASO.ABRIR_RECURSO": "ABRIR RECURSO",
  "CTA.PASO.VOLVER_OVERVIEW": "VOLVER AL OVERVIEW",

  // ── UX06 · Progreso / Bitácora ────────────────────────────────────────────
  "PROGRESO.TITULO": "Progreso",
  "PROGRESO.CAMBIO_CONFIRMADO": "Cambio confirmado",
  "PROGRESO.SIN_CAMBIO": "Sin cambio confirmado",
  "PROGRESO.FUENTE_PREFIJO": "Fuente:",
  "PROGRESO.BITACORA": "Bitácora",
  "PROGRESO.QUE_SIGUE": "Qué sigue",

  /**
   * Los tres avisos de `UX06`, y por qué son tres frases y no una.
   *
   * `VI.6` §7.1 separa *"todavía sin cambio confirmado"* —espera, o resultado
   * que no llegó— de *"no cambió"*, que es una afirmación que alguien hizo. La
   * tercera es la que ni siquiera tiene con qué mirar. Colapsarlas convierte
   * una espera en un veredicto.
   */
  "PROGRESO.PENDIENTE": "Todavía no hay un cambio de progreso confirmado.",
  "PROGRESO.SIN_EVIDENCIA": "Sin evidencia registrada",
  "PROGRESO.SIN_ENTREGA": "Todavía no entregaste nada en esta unidad.",
  "PROGRESO.SIN_INFORMACION_AVANCE": "Sin información suficiente para mostrar un avance.",
  "PROGRESO.NO_CAMBIO": "El resultado confirma que ninguna dimensión cambió.",
  /** El hecho, cuando la magnitud no es mostrable. Ver `C01-019`. */
  "PROGRESO.CAMBIO_SIN_MAGNITUD": "cambió",
  "PROGRESO.CONSERVA": "conserva su estado",
  "PROGRESO.FUENTE_EVIDENCIA_VALIDADA": "Evidencia validada",

  // ── Carga · lo que NO es un vacío de dominio (Etapa B2.6) ─────────────────
  /**
   * Estos cuatro no están en la lista de `VACIOS` de `tests/vacios.test.tsx`, y
   * es a propósito: **un fallo de carga no es una ausencia de dominio**.
   *
   * `HOY.VACIO` dice *"hoy no hay una acción recomendada"* — una afirmación
   * sobre el mundo, que sólo se puede hacer cuando el ADE contestó. Usarla
   * cuando en realidad no se pudo preguntar es inventar: la pantalla estaría
   * afirmando algo que no sabe. Por eso el copy de acá dice qué pasó y qué
   * hacer, y **nunca** habla del estado académico del estudiante.
   */
  "CARGA.SIN_SESION.TITULO": "No pudimos identificarte",
  "CARGA.SIN_SESION.CUERPO":
    "Tu sesión no está activa, así que no podemos mostrarte tu día. No es que no tengas nada: es que todavía no sabemos quién sos.",
  "CARGA.SIN_PADRON.TITULO": "Tu cuenta todavía no está habilitada",
  "CARGA.SIN_PADRON.CUERPO":
    "Te reconocemos, pero tu institución todavía no te habilitó en el padrón. Cuando lo haga, acá vas a ver tu día.",
  "CARGA.ERROR.TITULO": "No pudimos cargar esto",
  "CARGA.ERROR.CUERPO":
    "Falló la conexión con el servidor, así que no sabemos en qué estado estás. Lo que veas al reintentar es lo real.",
  "CTA.CARGA.REINTENTAR": "REINTENTAR",

  // ── Las cinco dimensiones, y las tres formas de no tener dato ─────────────
  /**
   * Los nombres salen de `product.md` §6 y son **vocabulario canónico del
   * dominio**, no copy libre: renombrar una dimensión acá la renombraría en
   * todo el producto. Hasta la Etapa B2.6 vivían inline en los fixtures, que
   * es donde no se los podía reusar.
   *
   * Los tres valores de ausencia son los que `design-system.md` §4.1 declara
   * distintos entre sí: **"no evaluado" ≠ "sin información" ≠ `0`**. Se
   * escriben separados justamente para que nadie los colapse en uno.
   */
  "DIMENSION.RECORRIDO": "Recorrido",
  "DIMENSION.PRACTICA": "Práctica",
  "DIMENSION.DOMINIO": "Dominio",
  "DIMENSION.CONFIANZA": "Confianza",
  "DIMENSION.RECENCIA": "Recencia",
  /** Existe el eje y nadie lo midió. **No es "bajo".** */
  "DIMENSION.NO_EVALUADO": "no evaluado",
  /** No hay datos suficientes para decir nada. **No es `0`.** */
  "DIMENSION.SIN_INFORMACION": "sin información",

  // ── UX02 desde la base (Etapa B2.6) ───────────────────────────────────────
  /**
   * El aviso que reemplaza a la síntesis que no se puede hacer todavía.
   *
   * `VI.2` §8.6 lo autoriza con todas las letras: *"si no existe semántica
   * aprobada para mostrar una dimensión, **omite la síntesis** o muestra un
   * hecho comprensible; nunca expone un valor interno bruto"*. `topic_progress`
   * guarda `NUMERIC` sin unidad ni escala —eso es `C01-019`, gate `H`—, así que
   * el número no se muestra y la fila dice qué falta, no cuánto hay.
   */
  "MATERIA.SIN_SEMANTICA": "Todavía no podemos resumir esta dimensión.",

  // ── Provenance (`product.md` §7) ──────────────────────────────────────────
  /** Falta la fuente o falta el estado de verificación: no se afirma ninguno. */
  "PROVENANCE.NO_DISPONIBLE": "Fuente o estado de verificación no disponible",
  "PROVENANCE.DISPUTADO": "Dato en revisión · hay versiones distintas",
} as const;

export type CopyId = keyof typeof copy;

/** Devuelve el copy de un ID. El ID es tipado: un ID inexistente no compila. */
export function t(id: CopyId): string {
  return copy[id];
}
