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

import type { MotivoSinCambio } from "@/lib/domain/renegociacion";

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
  "PALETA.AYUDA":
    "Escribí el nombre de una materia, o > para buscar sólo pantallas, # para escenarios y @ para materias.",
  "PALETA.FORZADO.SUPERFICIE": "Buscando sólo pantallas.",
  "PALETA.FORZADO.ESCENARIO": "Buscando sólo escenarios.",
  "PALETA.FORZADO.MATERIA": "Buscando sólo materias.",
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
  // ── El reparto y el déficit · ADR-075 §A ───────────────────────────────────
  //
  // ⚠️ **Todo este bloque lo revisó la psicopedagoga y lo reescribió.** La
  // versión anterior decía «52,5 h es lo que piden tus materias»; ella lo
  // objetó por dos motivos: la segunda cifra **no decía sobre qué período**, y
  // «las materias no piden» —esa personificación suena a exigencia—.
  //
  // Prohibidas, textual: «no vas a llegar», «deberías poder», «estás atrasado»,
  // y como respuesta automática «sumá X horas» o «dejá esta materia».
  "HOY.REPARTO": "Tus horas esta semana",

  // Las dos cifras **con su período en las dos**. Es la corrección central.
  "HOY.REPARTO.CIFRAS": "Esta semana declaraste {disponible} disponibles. El trabajo pendiente estimado es de {requerido}.",
  "HOY.REPARTO.ESTIMACION": "Es una estimación para organizarte; no predice tu resultado.",

  // `≤1` — entra, **sin prometer resultados**.
  "HOY.REPARTO.ENTRA": "Tu plan entra en el tiempo que declaraste.",
  // `1–2` — las dos cifras en primer plano y se ofrece reorganizar.
  "HOY.REPARTO.AJUSTABLE": "Tu plan pide más tiempo del que declaraste.",
  // `>2` — el mensaje cualitativo **primero**, el número como detalle secundario.
  "HOY.REPARTO.CRITICA": "Tu plan no entra completo en el tiempo disponible.",
  // Falta un dato: no se muestra una comparación cerrada.
  "HOY.REPARTO.SIN_DATOS": "Faltan datos para estimar tus horas.",

  // Las tres acciones de §A4. Las tres conservan la agencia del estudiante: el
  // sistema no elige por él, y no ofrece «dejá esta materia».
  "HOY.REPARTO.ACCION.PRIORIZAR": "Elegir qué priorizar",
  "HOY.REPARTO.ACCION.HORAS": "Revisar mis horas",
  "HOY.REPARTO.ACCION.AYUDA": "Pedir ayuda",

  "HOY.REPARTO.MOTIVO.SIN_ESTIMACION": "sin estimar",
  "HOY.REPARTO.MOTIVO.SIN_DISPONIBILIDAD": "sin repartir",
  "HOY.REPARTO.MOTIVO.SIN_FECHA": "sin fecha",
  "HOY.REPARTO.MOTIVO.POR_URGENCIA": "—",
  "HOY.REPARTO.REGLA":
    "Es una estimación, no una agenda. Nada se agenda desde acá.",
  "HOY.VACIO":
    "Hoy no hay una acción recomendada. Acá aparece la que conviene hacer ahora: es lo que te evita tener que decidir por dónde empezar. Mientras tanto, podés revisar tus materias.",

  // Estado general por nivel de precedencia.
  "HOY.ESTADO.ACTION_RECOMMENDED": "Bajo control",
  "HOY.ESTADO.IN_PROGRESS": "Acción en curso",
  "HOY.ESTADO.EVIDENCE_PENDING": "Falta cerrar esta acción",
  "HOY.ESTADO.RESCUE_REQUIRED": "Necesita recuperación",
  "HOY.ESTADO.COMMITMENT_NEXT": "Compromiso acordado",
  "HOY.ESTADO.COMMITMENT_MISSED": "Compromiso incumplido",
  "HOY.ESTADO.CONTEXT_INCOMPLETE": "Falta contexto de cursado",
  "HOY.ESTADO.EVIDENCE_INFO": "Sin acción pendiente",
  "HOY.ESTADO.DEFECTO": "Sin acciones por ahora",

  /**
   * El estudiante recién dado de alta, todavía sin cursadas — Fase B6.14.
   *
   * **Texto aprobado por el Product Owner**, literal, en
   * [ADR-042](../../docs/decisions.md#adr-042). Fuente:
   * [`respuesta-po-flujos-crm-source.md`](../../docs/respuesta-po-flujos-crm-source.md).
   *
   * ⚠️ **No se edita para acortarlo.** Y en particular no se reemplaza por
   * `HOY.VACIO`: el owner prohibió mostrar *"no hay una acción recomendada"*
   * en este caso *"porque el sistema todavía no está en condiciones de evaluar
   * eso"*. Es la misma disciplina de *sin datos no es cero*: **no evaluado no
   * es lo mismo que evaluado y vacío.**
   */
  "HOY.ESTADO.PREPARANDO": "Preparando tu información",
  "HOY.PREPARANDO.TITULO": "Estamos preparando tu información académica.",
  "HOY.PREPARANDO.QUE_SIGUE":
    "Todavía no contamos con información suficiente para recomendarte una acción. Te avisaremos cuando tu recorrido esté listo.",

  // ── Recuperación · lo que el estudiante ve de su propia señal (B6.6.2) ────
  //
  // `VI.2` §8.6 y la matriz de visibilidad §4.1: al estudiante le corresponde
  // una **explicación útil**, no la señal. Nada de esto nombra `risk_signal`,
  // una severidad, una regla ni una versión.
  //
  // Y ninguna frase diagnostica. *"Volvimos varias veces sobre esto"* describe
  // lo que pasó; *"tenés dificultades de procedimiento"* sería una etiqueta
  // sobre la persona, que es justo lo que `P-11` prohíbe.
  "HOY.RECUPERACION.TITULO": "Volvimos varias veces sobre lo mismo",
  "HOY.RECUPERACION.EXPLICACION":
    "Lo mismo se te trabó más de una vez, así que conviene cambiar el abordaje antes de seguir.",
  "HOY.RECUPERACION.QUE_HACER":
    "Vamos a ajustar el próximo paso para que puedas destrabarlo.",

  "HOY.RECUPERACION.TITULO_ELEVADO": "Pedimos que alguien te acompañe",
  "HOY.RECUPERACION.EXPLICACION_ELEVADO":
    "Esto siguió apareciendo después de trabajarlo, así que no alcanza con seguir solo.",
  "HOY.RECUPERACION.QUE_HACER_ELEVADO": "Ya avisamos al equipo de acompañamiento.",

  "HOY.RECUPERACION.QUE_HACER_TOMADO": "Alguien del equipo ya tomó tu caso.",
  "HOY.RECUPERACION.QUE_HACER_EN_CURSO": "Alguien del equipo lo está viendo con vos.",

  // ── CTAs · registro canónico en product.md §10.3 ──────────────────────────
  "CTA.COMPROMETERME": "Comprometerme",
  "CTA.ME_COMPROMETO": "Me comprometo",
  "CTA.CONTINUAR": "Continuar",
  "CTA.SUBIR_EVIDENCIA": "Subir evidencia",
  "CTA.RETOMAR": "Retomar",
  /*
    ADR-050. **No dice «Renegociar»**: el Product Owner fue explícito en que es
    lenguaje interno, no del estudiante. Lo que el estudiante hace es cambiar
    la hora de algo que ya acordó.
  */
  "CTA.CAMBIAR_HORARIO": "Cambiar horario",
  "CTA.CONFIRMAR_NUEVO_HORARIO": "Confirmar nuevo horario",
  "CTA.CANCELAR": "Cancelar",
  // Etapa B6.9.1. El texto sale del fixture `FX-LOCAL-COM-MISSED`, que es el
  // diseño aprobado de esa pantalla: no se estrena copy acá.
  "COMPROMISO.AVISO_INCUMPLIDO": "Este compromiso no se edita. El rescate es un acuerdo nuevo.",
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
  /*
    Etapa B6.10. Cuando la reflexión **bloquea el submit**, llamarla "opcional"
    le dice al estudiante lo contrario de lo que va a pasar.

    La copy es la del fixture `FX-LOCAL-EVD-REFLECTION-REQUERIDA`, aprobada por
    el Product Owner el 4 de septiembre de 2026
    ([ADR-044](../../docs/decisions.md#adr-044)). El guard `C-01` la rechazaba
    y **la lista del guard era la equivocada**: *contanos* es voseo.
  */
  "CTA.REFLEXION_REQUERIDA": "Contanos cómo te fue (requerido)",
  /** El campo, cuando la reflexión se escribe en la misma pantalla (ADR-045). */
  "REFLEXION.CAMPO": "Contanos cómo te fue",
  "EVIDENCIA.FALTA_REFLEXION": "Contanos cómo te fue para enviar la evidencia.",
  "CTA.VER_BITACORA": "Ver Bitácora",

  // ── UX02 · Materia / Cursado ──────────────────────────────────────────────
  "MATERIA.TITULO": "Cursado",
  "MATERIA.AHORA": "Ahora",
  "MATERIA.CATEDRA_Y_VOS": "Cátedra y vos",
  // ⚠️ **El rótulo lo fijó la psicopedagoga** (ADR-075 §C1): *"si se conserva
  // una barra, su rótulo visible debe ser `actividad registrada`, no `dominio`,
  // `nivel`, `rendimiento` ni `avance de aprendizaje`"*. Decía «Preparación».
  "MATERIA.GANTT": "Actividad registrada",
  "MATERIA.GANTT.REVISION": "Entregas que requieren revisión:",
  "MATERIA.CLASES": "Clases de la semana",
  "MATERIA.TEMAS": "Temas del programa",
  "MATERIA.EJE_TEMA": "Tema",
  "MATERIA.EJE_ESTADO": "Estado",
  "MATERIA.EVALUACION": "Evaluación",
  /** `CTA-019` — la entrada manual a Modo Examen desde la materia (ADR-016). */
  "MATERIA.MODO_EXAMEN": "Activar Modo Examen",
  "MATERIA.REGISTRO": "Registro",
  "MATERIA.CURSAS": "Cursás",
  "MATERIA.PROXIMO_PASO": "Próximo paso sugerido",
  /*
    El estado de cada tema — [ADR-085](../../docs/decisions.md#adr-085).

    ⚠️ **Describen actividad, no conocimiento.** El mockup rotulaba esta columna
    `Sin empezar · Leído · Practicado · Dominado`: `Dominado` es la primera
    prohibición de ADR-072 —el dominio requiere evaluación— y `nivel`, la
    leyenda que las acompañaba, la de ADR-075 §C1.
  */
  "UNIDAD.SIN_REGISTRO": "Sin registro",
  "UNIDAD.SIN_DICTAR": "Todavía no se dictó",
  "UNIDAD.ENVIADA": "Entregado",
  "UNIDAD.REVISION": "Requiere revisión",
  "UNIDAD.CRITERIO": "Criterio alcanzado",
  "MATERIA.UNIDADES": "Unidades",
  "MATERIA.DIMENSIONES": "Cómo venís",
  /** `VI.2` §8.7. Preview de la Bitácora, no un historial aparte. */
  "MATERIA.ACTIVIDAD": "Actividad reciente",
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
  "COMPROMISO.ORIGINAL": "Compromiso original",
  "COMPROMISO.ORIGINAL_NO_EDITABLE": "El original se conserva sin cambios.",
  "COMPROMISO.FECHA": "Fecha",
  "COMPROMISO.HORA": "Hora",
  "COMPROMISO.TIEMPO_DECLARADO": "Tiempo que declarás",
  "COMPROMISO.EVIDENCIA_PREFIJO": "Evidencia esperada:",
  "COMPROMISO.CIERRE_PREFIJO": "Cierre:",
  "COMPROMISO.QUEDA": "queda",
  // Aceptar una Action NO crea un Commitment; confirmarlo sí (AGENTS.md §2.1).
  "COMPROMISO.RESULTADO": "en Hoy y Materia; podrás iniciarlo cuando corresponda.",
  // ── El cambio de horario — ADR-050 ────────────────────────────────────────
  "COMPROMISO.HORARIO_ACTUAL": "Horario actual",
  "COMPROMISO.NUEVO_HORARIO": "Nuevo horario",
  "COMPROMISO.HORARIO_ACTUALIZADO": "Horario actualizado",
  "COMPROMISO.NO_SE_PUEDE_CAMBIAR": "Este compromiso ya no se puede cambiar.",
  /*
    Los cuatro motivos son los que aprobó el Product Owner, y son distintos
    porque la salida del estudiante es distinta en cada uno: seguir, rescatar,
    o elegir otra cosa. Un único «no se puede» los borraría a los tres.
  */
  "COMPROMISO.MOTIVO_YA_CAMBIADO": "Ya cambiaste el horario de este compromiso una vez.",
  "COMPROMISO.MOTIVO_YA_EMPEZO": "Este compromiso ya empezó.",
  "COMPROMISO.MOTIVO_INCUMPLIDO": "Este compromiso se incumplió; ahora corresponde rescatarlo.",
  "COMPROMISO.MOTIVO_SIN_HORARIO": "Ya no queda un horario válido dentro del día acordado.",
  /**
   * `CONFLICTO_DE_HORARIO` — [ADR-064](../../docs/decisions.md#adr-064).
   *
   * **Es el hecho y nada más.** El ADR pide dos salidas —elegir otro horario o
   * corregir el bloque de clase— y la copy no las enuncia: donde la primera
   * existe, el selector de horarios está a la vista; la segunda **todavía no
   * tiene dónde hacerse**, y describir una puerta que no existe es peor que no
   * mencionarla.
   */
  "COMPROMISO.CONFLICTO_HORARIO": "Tenés clase",
  /**
   * Cuando la propuesta se corrió para no caer encima de una clase — ADR-064.
   *
   * **Se dice.** Un horario que aparece corrido sin explicación se lee como un
   * error de la pantalla, y el estudiante no tiene cómo saber que el sistema le
   * esquivó la cursada.
   */
  "COMPROMISO.HORARIO_CORRIDO": "Movimos la propuesta para que no te caiga encima de una clase.",

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
    "Al enviarla queda enviada, y después se valida. Enviar no implica que alcance ni que domines el tema.",

  // ── UX07 · Activación de Modo Examen ──────────────────────────────────────
  // Títulos de VI.7 §22.1 y CTAs semánticas de §22.2, literales.
  //
  // `EXAMEN.TITULO_PANTALLA` es el **título de documento** de la superficie.
  // Se llama distinto de `EXAMEN.TITULO.<estado>` —que son los banners
  // internos de cada wireframe crítico— a propósito: son dos cosas distintas
  // que comparten prefijo, y leer una como caso particular de la otra es el
  // error que `C-02` previene.
  "EXAMEN.TITULO_PANTALLA": "Activación",

  "EXAMEN.TITULO.RECOMENDACION": "Recomendación de activación",
  "EXAMEN.TITULO.REVISION": "Revisá esta evaluación",
  "EXAMEN.TITULO.NO_ACTIVO": "Todavía no está activo",
  "EXAMEN.TITULO.ACTIVO": "Modo Examen activo",
  "EXAMEN.TITULO.FALTAN_DATOS": "Faltan datos para activar",
  "EXAMEN.TITULO.CONTRADICTORIOS": "Hay datos contradictorios",
  "EXAMEN.TITULO.NO_DISPONIBLE": "No pudimos cargar la evaluación",
  "EXAMEN.TITULO.VERIFICANDO": "Estamos verificando la activación",

  "CTA.EXAMEN.ACTIVAR": "Activar preparación de este examen",
  "CTA.EXAMEN.ACTIVAR_CON_ESTOS_DATOS": "Activar con estos datos",
  "CTA.EXAMEN.REVISAR": "Revisar evaluación",
  "CTA.EXAMEN.ABRIR": "Abrir preparación",
  "CTA.EXAMEN.REINTENTAR": "Reintentar",
  "CTA.EXAMEN.VOLVER_CURSADO": "Volver a cursado",

  "EXAMEN.QUE_CAMBIA": "Qué cambia",
  "EXAMEN.QUE_NO_CAMBIA": "Qué no cambia",
  "EXAMEN.DESPUES": "Después",
  "EXAMEN.FALTANTES": "Faltan estos datos",
  "EXAMEN.ELEGI": "Elegí una evaluación",
  "EXAMEN.ANTES": "antes:",
  // VI.7 §16.14: "lista sin ranking local". La UI no prioriza.
  "EXAMEN.ORDEN_RECIBIDO": "La lista conserva el orden recibido. No prioriza académicamente.",
  // VI.7 §24.2: materia y comisión pertenecen al CourseEnrollment de origen.
  "EXAMEN.NO_ES_SELECTOR": "Materia y comisión no son selectores: pertenecen a esta materia.",
  "EXAMEN.VOLVER_PREFIJO": "Volver a",

  // ── UX08 · Modo Examen / Overview ─────────────────────────────────────────
  // Microcopy de VI.8 §23, literal.
  "OVERVIEW.TITULO": "Modo Examen",
  "OVERVIEW.EXAMEN": "Examen",
  "OVERVIEW.RECORRIDO": "Recorrido vigente",
  "OVERVIEW.SIN_RECORRIDO": "Recorrido todavía no disponible",
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
  "OVERVIEW.ULTIMO_CAMBIO": "Último cambio",
  "OVERVIEW.PENDIENTE": "Pendiente",
  "OVERVIEW.DESPUES": "Después:",
  "OVERVIEW.SECUNDARIOS": "También",
  "OVERVIEW.CURSADO": "Cursado persistente",
  "OVERVIEW.STATUS.RECOMMENDED": "Recomendada",
  "OVERVIEW.STATUS.ACTIVE": "Activa",
  "OVERVIEW.STATUS.REPLANNED": "Replanificada",
  "OVERVIEW.STATUS.BLOCKED": "Bloqueada",
  "OVERVIEW.STATUS.EXAM_TAKEN": "Examen rendido",
  "OVERVIEW.STATUS.CLOSED": "Cerrada",
  "OVERVIEW.STATUS.CANCELLED": "Cancelada",
  "OVERVIEW.STATUS.EXPLICITLY_ABANDONED": "Abandonada",

  "CTA.OVERVIEW.CONTINUAR": "Continuar",
  "CTA.OVERVIEW.SUBIR_EVIDENCIA": "Subir evidencia",
  "CTA.OVERVIEW.VER_COMPROMISO": "Ver compromiso",
  "CTA.OVERVIEW.EMPEZAR": "Empezar",
  "CTA.OVERVIEW.RETOMAR": "Retomar",
  "CTA.OVERVIEW.NUEVA_EVIDENCIA": "Preparar nueva evidencia",
  "CTA.OVERVIEW.COMPROMETERME": "Comprometerme",
  "CTA.OVERVIEW.ABRIR_PASO": "Abrir paso actual",
  "CTA.OVERVIEW.VER_EVIDENCIA": "Ver evidencia",
  "CTA.OVERVIEW.VER_AVANCE": "Ver avance",
  "CTA.OVERVIEW.VER_BITACORA": "Ver Bitácora",
  "CTA.OVERVIEW.VOLVER_CURSADO": "Volver a cursado",

  // ── UX09 · Paso de Protocolo ──────────────────────────────────────────────
  // Microcopy de VI.9 §24, literal.
  "PASO.TITULO": "Paso",
  "PASO.MODO_EXAMEN": "Modo Examen",
  "PASO.ACTUAL": "Paso actual",
  "PASO.OBJETIVO": "Objetivo del paso",
  "PASO.ENTREGABLE": "Entregable esperado",
  "PASO.CRITERIO": "Criterio esperado",
  "PASO.COMO_TRABAJARLO": "Cómo trabajarlo",
  "PASO.RECURSO": "Recurso configurado",
  "PASO.CONFIGURACION": "Configuración",
  "PASO.FUENTE_CONTENIDO": "Fuente del contenido:",
  // §14: el objetivo del paso NO es una Action generada por el Engine.
  "PASO.SEPARACION": "Objetivo del paso. No es una próxima acción generada por el Engine.",
  "PASO.ABRIR_NO_COMPLETA": "Abriste este paso. Abrirlo no lo completa.",
  "PASO.CIERRE_NO_CONFIRMADO": "Cierre del paso todavía no confirmado.",
  "PASO.REENTRADA.EYEBROW": "Propuesta de reentrada",
  "PASO.REENTRADA.MOTIVO": "Por qué:",
  "PASO.REENTRADA.RECORRIDO": "La vuelta:",
  "PASO.REENTRADA.ACTIVIDAD": "Qué volvés a trabajar:",
  "PASO.REENTRADA.EVIDENCIA": "Qué sigue vigente:",

  "CTA.PASO.ABRIR_RECURSO": "Abrir recurso",
  "CTA.PASO.VOLVER_OVERVIEW": "Volver a la preparación",

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
  /** La fuente de un no-cambio **declarado**. `ADR-020`: es un dato, no un vacío. */
  "PROGRESO.FUENTE_RESULTADO": "resultado de progreso confirmado",

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
  // ── Ingreso ────────────────────────────────────────────────────────────────
  // El spec no define esta pantalla: la autorizó el Product Owner y queda
  // registrada en ADR-039. El copy no promete nada que el producto no haga —en
  // particular, **no ofrece crear una cuenta**: el alta la decide el padrón del
  // CRM, no este formulario.
  "LOGIN.TITULO": "Entrar a Achieve",
  "LOGIN.SUBCOPY":
    "Tu cuenta la habilita tu institución. Si todavía no podés entrar, no es un error tuyo: es que tu email no está en el padrón.",
  "LOGIN.EMAIL": "Email",
  "LOGIN.PASSWORD": "Contraseña",
  "LOGIN.CTA": "Entrar",
  "LOGIN.ENTRANDO": "Entrando…",
  "LOGIN.ERROR.CREDENCIALES":
    "Ese email y esa contraseña no coinciden. Revisalos y probá de nuevo.",
  "LOGIN.ERROR.RED": "No pudimos verificar tus datos. Probá de nuevo en un momento.",
  "LOGIN.SALIR": "Salir",

  // ── El alta · Fase B6.14 (ADR-052) ───────────────────────────────────────
  //
  // Tres pantallas entre `/login` y `HOY`, en el orden que aprobó
  // [ADR-042](../../docs/decisions.md#adr-042). **Cero jerga interna:** el
  // estudiante no lee «catálogo», «versión curricular», «requisito curricular»
  // ni ningún enum. Lee *dónde estudia*, *qué carrera* y *qué materias cursa*.

  "ALTA.PASOS": "Empezar en Achieve",

  // WhatsApp. ⚠️ La confirmación **sólo puede decir lo que el estudiante hizo**
  // (ADR-042 §5-6). Nunca que el número quedó vinculado, que hay alguien
  // asignado o que van a escribirle: la Plataforma **no observa** ese estado.
  "ALTA.WHATSAPP.TITULO": "¿Querés que te acompañemos por WhatsApp?",
  "ALTA.WHATSAPP.EXPLICACION":
    "Sirve para avisarte de tus compromisos sin que tengas que entrar a mirar. Podés decir que no, y seguís igual: no perdés nada de Achieve.",
  "ALTA.WHATSAPP.CONSENTIMIENTO":
    "Sí, quiero que me acompañen por WhatsApp y autorizo que guarden mi número para eso.",
  "ALTA.WHATSAPP.REGLA": "Podés cambiar esta decisión cuando quieras.",
  "ALTA.WHATSAPP.CTA": "Continuar",
  "ALTA.WHATSAPP.OMITIR": "Ahora no",
  "ALTA.WHATSAPP.RECIBIDO": "Recibimos tu solicitud.",

  // Carrera y año.
  // El título dice de qué es la pantalla; los tres rótulos preguntan. Repetir
  // la primera pregunta arriba dejaba "¿Dónde estudiás?" dos veces seguidas.
  "ALTA.CARRERA.TITULO": "Tu carrera",
  "ALTA.CARRERA.INSTITUCION": "¿Dónde estudiás?",
  "ALTA.CARRERA.CARRERA": "¿Qué carrera estudiás?",
  "ALTA.CARRERA.ANIO": "¿Qué año estás cursando?",
  "ALTA.CARRERA.FACULTAD": "Facultad:",
  // Se muestra para confirmar, no para preguntar: si hay una sola versión
  // vigente el sistema no agrega un paso que puede contestar solo.
  "ALTA.CARRERA.PLAN_UNICO": "Plan:",
  "ALTA.CARRERA.PLAN_VARIOS": "¿Con qué plan estás cursando?",
  "ALTA.CARRERA.PLAN_AYUDA":
    "Hay más de un plan vigente para esta carrera. Elegí el tuyo: si empezaste hace unos años, seguramente sea el más viejo.",
  // ⚠️ Estado honesto: **no se inventan materias** y no se sigue.
  "ALTA.CARRERA.SIN_PLAN": "Todavía no tenemos el plan de esta carrera.",
  "ALTA.CARRERA.SIN_PLAN_QUE_SIGUE":
    "Podés elegir otra carrera por ahora. Cuando lo carguemos, vas a poder cambiarla.",
  "ALTA.CARRERA.CTA": "Continuar",

  // Materias.
  "ALTA.MATERIAS.TITULO": "Estas son las materias de ese año. Marcá cuáles cursás.",
  "ALTA.MATERIAS.REGLA": "Podés desmarcar las que no estés cursando y sumar de otros años.",
  "ALTA.MATERIAS.OTROS_ANIOS": "Agregar materias de otros años",
  "ALTA.MATERIAS.OCULTAR_OTROS": "Ocultar las de otros años",
  "ALTA.MATERIAS.ANIO": "Año",
  "ALTA.MATERIAS.ELECTIVAS": "¿Estás cursando alguna electiva?",
  "ALTA.MATERIAS.ELECTIVA_AYUDA":
    "Si todavía no elegiste, dejalo en blanco: podés completarlo después.",
  "ALTA.MATERIAS.ELECTIVA_SIN_OPCIONES": "Escribí el nombre de la materia que elegiste.",
  "ALTA.MATERIAS.ELECTIVA_NO_ENCONTRADA":
    "No encontramos esa materia en el plan. Podés agregarla y la dejaremos pendiente de verificación.",
  "ALTA.MATERIAS.ELECTIVA_NINGUNA": "Ninguna por ahora",
  "ALTA.MATERIAS.CTA": "Confirmar y empezar",
  "ALTA.MATERIAS.GUARDANDO": "Guardando…",
  // El nombre viene cortado de la fuente y **no se completa** (ADR-053).
  "ALTA.MATERIAS.NOMBRE_CORTADO": "Nombre incompleto en el plan que recibimos.",
  "ALTA.MATERIAS.SIN_SELECCION": "Marcá al menos una materia para poder empezar.",
  "ALTA.DISPONIBILIDAD.TITULO": "¿Cuánto tiempo tenés por semana?",
  "ALTA.DISPONIBILIDAD.EXPLICACION":
    "Sirve para repartir las horas entre tus materias. Es una estimación tuya: después se ajusta " +
    "sola con lo que vayas haciendo.",
  "ALTA.DISPONIBILIDAD.REGLA":
    "No es un compromiso ni una agenda. Nada se agenda desde acá.",
  "ALTA.DISPONIBILIDAD.CTA": "Guardar y terminar",
  "ALTA.DISPONIBILIDAD.OMITIR": "Todavía no sé",
  "ALTA.DISPONIBILIDAD.OMITIR_REGLA":
    "Podés seguir sin contestar. Sin esto no podemos repartir las horas entre tus materias, " +
    "y te lo vamos a decir en la pantalla.",
  "ALTA.ERROR.RED": "No pudimos guardar tu respuesta. Probá de nuevo en un momento.",
  /**
   * ⚠️ **`404` no es un error de red, y no se dicen igual.**
   *
   * *"Probá de nuevo en un momento"* sobre algo que ya no existe le pide al
   * estudiante que insista contra una pared. Este texto dice qué pasó y qué
   * hacer, que es lo único que le sirve.
   */
  "ALTA.ERROR.NO_DISPONIBLE":
    "Esa carrera ya no está disponible. Elegí otra, o volvé a entrar en un rato.",

  "CARGA.SIN_PADRON.TITULO": "Tu cuenta todavía no está habilitada",
  "CARGA.SIN_PADRON.CUERPO":
    "Te reconocemos, pero tu institución todavía no te habilitó en el padrón. Cuando lo haga, acá vas a ver tu día.",
  "CARGA.ERROR.TITULO": "No pudimos cargar esto",
  "CARGA.ERROR.CUERPO":
    "Falló la conexión con el servidor, así que no sabemos en qué estado estás. Lo que veas al reintentar es lo real.",
  "CTA.CARGA.REINTENTAR": "Reintentar",

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

  /*
   * ADR-086 · de dónde salió lo que se está mirando.
   *
   * Las dos frases dicen **quién puso el dato**, que es lo único que la pantalla
   * sabe. No dicen que esté bien ni que esté mal: `verification_status` sigue en
   * `unverified` para todo esto, y afirmarlo desde acá sería elevarlo por la UI.
   *
   * ⚠️ Y **no desactivan nada**. El estudiante puede planificar sobre esto
   * igual: el owner pidió que sirvan como válidos, y sirven — lo que no se hace
   * es callar de dónde vienen.
   */
  "ALTA.CARRERA.UCC_SISTEMAS": "UCC Sistemas",

  /*
   * ── Formación · ADR-087 ──────────────────────────────────────────────────
   *
   * ⚠️ **Ninguna de estas frases promete aprendizaje.** Formación es método:
   * enseña a estudiar, no certifica que se sepa. `ADR-072` y `ADR-075` §C1
   * valen igual acá — nada de «dominado», «nivel» ni porcentajes de avance.
   */
  "FORMACION.TITULO": "Formación",
  "FORMACION.SUBCOPY":
    "Contenido breve sobre cómo estudiar, para aplicar a las materias que estés cursando.",
  "FORMACION.PROBLEMA": "Cuándo sirve",
  "FORMACION.OBJETIVO": "Para qué",
  "FORMACION.EXPLICACION": "Por qué",
  "FORMACION.ACCION": "Qué hacés después",
  "FORMACION.EVIDENCIA": "Qué entregás",
  "FORMACION.MATERIAL": "Material",
  /*
   * El vacío de la biblioteca, y **argumenta en vez de acusar**.
   *
   * ⚠️ No lleva imperativo, y es la regla `C-04`: sólo se ofrece una palanca
   * cuando el estudiante la tiene. **No puede publicar contenido** desde acá,
   * así que decirle que haga algo sería ofrecerle una salida que no existe.
   */
  "FORMACION.VACIO":
    "Todavía no hay contenido publicado. Lo estamos preparando con la psicopedagoga del equipo y va a aparecer acá cuando esté listo.",

  /*
   * ── La vista simulada · ADR-087 Enmienda 3 ──────────────────────────────
   *
   * ⚠️ **Todo lo simulado se nombra como simulado.** La demo muestra cómo se
   * ve Formación, y el contenido habla con la voz de la psicopedagoga: si no
   * se dice qué es simulado, se confunde con lo suyo.
   */
  "FORMACION.AVISO_SIMULADA":
    "Vista simulada para la demo. Los videos, los tips y los ejemplos de entrega todavía no son contenido de la psicopedagoga. Las piezas marcadas «Borrador» son suyas y esperan su autorización para publicarse.",
  "FORMACION.ROTULO_SIMULADO": "Simulado",
  "FORMACION.ROTULO_BORRADOR": "Borrador",
  "FORMACION.ROTULO_PIEZA_SIMULADA": "Pieza simulada",
  "FORMACION.VIDEO_SIMULADO": "Video simulado · no se reproduce en esta versión",
  "FORMACION.MINUTOS": "min",
  "FORMACION.VOLVER": "Volver a Formación",
  "FORMACION.TIPS": "Tips",
  "FORMACION.EJEMPLO": "Un ejemplo de entrega",
  "FORMACION.MATERIAL_NO_DISPONIBLE": "archivo todavía no disponible",
  "FORMACION.OTRAS": "Otras piezas",
  "FORMACION.PROCEDENCIA_SIMULADA": "Pieza simulada para la demo · no es contenido de la psicopedagoga",

  /*
   * ── Gimnasia cognitiva · ADR-102 ─────────────────────────────────────────
   *
   * ⚠️ **Ninguna frase habla de la persona.** El nivel y la marca son **del
   * ejercicio**: *«Nivel 3 en Cadena inversa»*, nunca *«tu memoria es nivel 3»*.
   * Sin inteligencia, sin diagnóstico, sin «edad cerebral», sin porcentajes de
   * mejora. Y sin urgencia: nada vence en Gimnasia.
   */
  "GIMNASIA.EYEBROW": "Autogestión · Gimnasia cognitiva",
  "GIMNASIA.TITULO": "Entrená cómo estudiás",
  "GIMNASIA.SUBCOPY": "Juegos breves para practicar memoria y aplicar lo aprendido en tus materias.",
  "GIMNASIA.AVISO_RESPONSABLE":
    "Las marcas describen tu rendimiento en cada ejercicio. No miden inteligencia ni constituyen un diagnóstico.",
  "GIMNASIA.AVISO_SIMULADA":
    "Vista para la demo: las preguntas de Recuerdo real son sintéticas, de ejemplo. No son contenido de ninguna cátedra.",
  "GIMNASIA.CARGANDO": "Cargando Gimnasia…",

  "GIMNASIA.RUTINA.TITULO": "Tu rutina de hoy",
  "GIMNASIA.RUTINA.CATEGORIA": "Memoria",
  "GIMNASIA.RUTINA.EJERCICIOS": "ejercicios",
  "GIMNASIA.RUTINA.MINUTOS": "minutos",
  "GIMNASIA.RUTINA.ADAPTADA": "Adaptada a tus partidas anteriores",
  "GIMNASIA.RUTINA.PRIMERA_VEZ": "Empieza con la dificultad inicial de cada juego",
  "GIMNASIA.RUTINA.INCLUYE": "Incluye contenidos de",
  "GIMNASIA.RUTINA.GENERAL": "Incluye preguntas generales",
  "GIMNASIA.RUTINA.SIN_PREGUNTAS": "Sin preguntas de tus materias todavía: la rutina de hoy son los dos ejercicios de memoria.",
  "GIMNASIA.RUTINA.EMPEZAR": "Empezar rutina",
  "GIMNASIA.RUTINA.EN_CURSO": "Tenés una rutina sin terminar",
  "GIMNASIA.RUTINA.JUEGO_EN_CURSO": "Tenés un juego sin terminar",
  "GIMNASIA.RUTINA.CONTINUAR": "Continuar",
  "GIMNASIA.RUTINA.DESCARTAR": "Descartar",
  "GIMNASIA.RUTINA.HECHOS": "hechos",

  "GIMNASIA.PROGRESO.TITULO": "Tu práctica",
  "GIMNASIA.PROGRESO.DIAS": "Días con rutina",
  "GIMNASIA.PROGRESO.SECUENCIA": "Mejor secuencia en Cuadrícula fugaz",
  "GIMNASIA.PROGRESO.CADENA": "Mejor cadena en Cadena inversa",
  "GIMNASIA.PROGRESO.REPASOS": "Repasos de materias hechos",
  "GIMNASIA.PROGRESO.DIFERIDO": "Recordadas un día o más después",
  "GIMNASIA.PROGRESO.SIN_DATOS": "todavía sin partidas",
  "GIMNASIA.PROGRESO.CASILLAS": "casillas",
  "GIMNASIA.PROGRESO.DIGITOS": "dígitos",

  "GIMNASIA.CATEGORIA.TITULO": "Memoria",
  "GIMNASIA.CATEGORIA.DESCRIPCION": "Practicá cómo mantener, organizar y recuperar información.",

  "GIMNASIA.CUADRICULA.NOMBRE": "Cuadrícula fugaz",
  "GIMNASIA.CUADRICULA.HABILIDAD": "Memoria visuoespacial",
  "GIMNASIA.CUADRICULA.DESCRIPCION":
    "Mirá una secuencia de casillas y repetila en el mismo orden. La dificultad aumenta cuando sostenés precisión.",
  "GIMNASIA.CUADRICULA.MODALIDAD": "Arcade",
  "GIMNASIA.CUADRICULA.MEJOR": "Mejor puntuación",
  "GIMNASIA.CUADRICULA.JUGAR": "Jugar",
  "GIMNASIA.CUADRICULA.VOLVER_A_JUGAR": "Volver a jugar",
  "GIMNASIA.CUADRICULA.INSTRUCCION":
    "Se van a encender casillas de a una. Cuando se apaguen, tocalas en el mismo orden. Con dos errores termina la partida.",
  "GIMNASIA.CUADRICULA.MIRA": "Mirá la secuencia",
  "GIMNASIA.CUADRICULA.TU_TURNO": "Tu turno: tocá las casillas en el mismo orden",
  "GIMNASIA.CUADRICULA.RONDA": "Ronda",
  "GIMNASIA.CUADRICULA.CASILLA": "Casilla",
  "GIMNASIA.CUADRICULA.FILA": "fila",
  "GIMNASIA.CUADRICULA.COLUMNA": "columna",
  "GIMNASIA.CUADRICULA.BIEN": "Bien: era esa secuencia.",
  "GIMNASIA.CUADRICULA.MAL": "No era esa secuencia.",
  "GIMNASIA.CUADRICULA.BORRAR": "Borrar la última",
  "GIMNASIA.CUADRICULA.PUNTUACION": "Puntuación",
  "GIMNASIA.CUADRICULA.SECUENCIA_MAXIMA": "Secuencia más larga",

  "GIMNASIA.CADENA.NOMBRE": "Cadena inversa",
  "GIMNASIA.CADENA.HABILIDAD": "Memoria de trabajo",
  "GIMNASIA.CADENA.DESCRIPCION":
    "Memorizá una cadena de números y escribila al revés. Entrena mantenimiento y manipulación, no sólo repetición.",
  "GIMNASIA.CADENA.MODALIDAD": "Por niveles",
  "GIMNASIA.CADENA.NIVEL": "Nivel",
  "GIMNASIA.CADENA.EMPEZAR": "Empezar",
  "GIMNASIA.CADENA.CONTINUAR": "Continuar",
  "GIMNASIA.CADENA.INSTRUCCION":
    "Vas a ver una cadena de dígitos. Cuando se oculte, escribila al revés: si ves 3 8 1, escribís 1 8 3. Son cinco pruebas.",
  "GIMNASIA.CADENA.MEMORIZA": "Memorizá esta cadena",
  "GIMNASIA.CADENA.ESCRIBILA": "Escribila al revés",
  "GIMNASIA.CADENA.RESPUESTA": "Tu respuesta, al revés",
  "GIMNASIA.CADENA.CONFIRMAR": "Confirmar",
  "GIMNASIA.CADENA.BIEN": "Bien: la invertiste completa.",
  "GIMNASIA.CADENA.MAL": "No era así. La cadena al revés era",
  "GIMNASIA.CADENA.PRUEBA": "Prueba",
  "GIMNASIA.CADENA.MAS_LARGA": "La próxima cadena tiene un dígito más.",
  "GIMNASIA.CADENA.MAS_CORTA": "La próxima cadena tiene un dígito menos.",
  "GIMNASIA.CADENA.NUEVO_NIVEL": "Nuevo nivel en Cadena inversa",
  "GIMNASIA.CADENA.CADENA_MAS_LARGA": "Cadena más larga invertida",

  "GIMNASIA.RECUERDO.NOMBRE": "Recuerdo real",
  "GIMNASIA.RECUERDO.HABILIDAD": "Recuperación a largo plazo",
  "GIMNASIA.RECUERDO.DESCRIPCION":
    "Respondé sin mirar preguntas breves de tus materias. Los contenidos vuelven a aparecer según dificultad y recuerdo.",
  "GIMNASIA.RECUERDO.MODALIDAD": "Aplicado a materias",
  "GIMNASIA.RECUERDO.PARA_HOY": "repasos para hoy",
  "GIMNASIA.RECUERDO.AL_DIA": "Sin repasos pendientes",
  "GIMNASIA.RECUERDO.SIN_CONTENIDO": "Prepará tu primer set",
  "GIMNASIA.RECUERDO.SIN_CONTENIDO_DETALLE":
    "Todavía no hay preguntas validadas de tus materias. Cuando las haya, aparecen acá: Achieve no las inventa.",
  "GIMNASIA.RECUERDO.PRACTICAR": "Practicar",
  "GIMNASIA.RECUERDO.CONTINUAR": "Continuar",
  "GIMNASIA.RECUERDO.INSTRUCCION":
    "Respondé sin mirar tus apuntes. Después vas a ver la respuesta de referencia. Lo que no recordaste vuelve antes.",
  "GIMNASIA.RECUERDO.PREGUNTA": "Pregunta",
  "GIMNASIA.RECUERDO.GENERAL": "General",
  "GIMNASIA.RECUERDO.SINTETICA": "Pregunta sintética de ejemplo",
  "GIMNASIA.RECUERDO.TU_RESPUESTA": "Tu respuesta",
  "GIMNASIA.RECUERDO.CONFIRMAR": "Confirmar respuesta",
  "GIMNASIA.RECUERDO.VERDADERO": "Verdadero",
  "GIMNASIA.RECUERDO.FALSO": "Falso",
  "GIMNASIA.RECUERDO.REFERENCIA": "Respuesta de referencia",
  "GIMNASIA.RECUERDO.BIEN": "Correcta.",
  "GIMNASIA.RECUERDO.MAL": "No era esa.",
  "GIMNASIA.RECUERDO.COMO_TE_FUE": "¿Cómo la recordaste?",
  "GIMNASIA.RECUERDO.NO_LA_RECORDE": "No la recordé",
  "GIMNASIA.RECUERDO.PARCIAL": "La recordé parcialmente",
  "GIMNASIA.RECUERDO.LA_RECORDE": "La recordé",
  "GIMNASIA.RECUERDO.FACIL": "Me resultó fácil",
  "GIMNASIA.RECUERDO.VUELVE": "Vuelve a aparecer el",
  "GIMNASIA.RECUERDO.SIGUIENTE": "Siguiente",
  "GIMNASIA.RECUERDO.SALIR_GUARDANDO": "Terminar y guardar lo respondido",
  "GIMNASIA.RECUERDO.RESPONDIDAS": "Respondidas",
  "GIMNASIA.RECUERDO.RECORDADAS": "Recordadas",
  "GIMNASIA.RECUERDO.PARCIALES": "Parciales",
  "GIMNASIA.RECUERDO.NO_RECORDADAS": "No recordadas",
  "GIMNASIA.RECUERDO.PROXIMO_REPASO": "Próximo repaso",
  "GIMNASIA.RECUERDO.MATERIAS": "Materias practicadas",

  "GIMNASIA.JUEGO.EMPEZAR": "Empezar",
  "GIMNASIA.JUEGO.SIGUIENTE": "Siguiente",
  "GIMNASIA.JUEGO.LISTO": "Ya lo memoricé",
  "GIMNASIA.JUEGO.PASO_A_PASO": "Presentación sin tiempo",
  "GIMNASIA.JUEGO.PASO_A_PASO_DETALLE":
    "Cada paso queda a la vista hasta que toques «Siguiente». Sirve si usás lector de pantalla o preferís tu propio ritmo.",
  "GIMNASIA.JUEGO.TERMINADO": "Partida terminada",
  "GIMNASIA.JUEGO.ACIERTOS": "Aciertos",
  "GIMNASIA.JUEGO.ERRORES": "Errores",
  "GIMNASIA.JUEGO.PRIMERA_MARCA": "Primera marca registrada en este ejercicio",
  "GIMNASIA.JUEGO.NUEVA_MARCA": "Nueva marca personal en este ejercicio",
  "GIMNASIA.JUEGO.CONTINUAR_RUTINA": "Seguir con la rutina",
  "GIMNASIA.JUEGO.VOLVER": "Volver a Gimnasia",
  "GIMNASIA.JUEGO.ERROR_GUARDAR": "No se pudo guardar el resultado. Reintentar es seguro: no se duplica.",
  "GIMNASIA.JUEGO.REINTENTAR": "Reintentar",

  "GIMNASIA.SESION.DE": "de",
  "GIMNASIA.SESION.SALIR": "Salir",
  "GIMNASIA.SESION.SALIR_TITULO": "¿Salir de la rutina?",
  "GIMNASIA.SESION.SALIR_DETALLE":
    "Lo que ya terminaste queda guardado. Podés retomarla después desde Gimnasia, o descartarla.",
  "GIMNASIA.SESION.PAUSAR": "Salir y retomar después",
  "GIMNASIA.SESION.SEGUIR": "Seguir entrenando",
  "GIMNASIA.SESION.TERMINADA": "Rutina terminada",
  "GIMNASIA.SESION.DURACION": "Duración",
  "GIMNASIA.SESION.VOLVER_A_LA_ACCION": "Volver a mi próxima acción",
  "GIMNASIA.SESION.VER_JUEGOS": "Ver todos los juegos",
  "GIMNASIA.SESION.CANCELADA": "Descartaste la rutina. Lo que habías terminado quedó guardado.",
  "GIMNASIA.SESION.OTRA_ABIERTA": "Tenés otra sesión sin terminar. Retomala o descartala primero.",

  "MATERIA.CONTENIDO_ESTIMADO":
    "Estos temas los estimó Achieve porque la cátedra todavía no publicó su programa. " +
    "Sirven para organizarte, y conviene contrastarlos con el programa de la materia.",
  "MATERIA.CALENDARIO_ESTIMADO":
    "Los temas salen del programa oficial de la cátedra. Las fechas de clase y el tiempo " +
    "estimado de cada unidad los puso Achieve.",

  // ── Provenance (`product.md` §7) ──────────────────────────────────────────
  /** Falta la fuente o falta el estado de verificación: no se afirma ninguno. */
  "PROVENANCE.NO_DISPONIBLE": "Fuente o estado de verificación no disponible",
  "PROVENANCE.DISPUTADO": "Dato en revisión · hay versiones distintas",

  // ── `UX01` · la capa «anticipar» ([ADR-089](../../docs/decisions.md#adr-089)) ──
  "HOY.PROXIMA_EVALUACION": "Próxima evaluación",
  "HOY.PANORAMA": "Los próximos 14 días",
  /**
   * La nota que hace legible el mapa. **Sin esto las formas no dicen nada**, y
   * una barra sin significado se lee como un pronóstico.
   */
  "HOY.PANORAMA.AYUDA":
    "Cada barra es la ventana de preparación hasta la evaluación. El relleno es lo que ya cubriste.",
  "HOY.PANORAMA.SIN_VENTANA": "sin ventana de preparación",
  "HOY.PANORAMA.VACIO": "Todavía no hay materias con fechas para ubicar en el mapa.",

  // ── `UX01` · el tablero ([ADR-093](../../docs/decisions.md#adr-093)) ──────
  //
  // ⚠️ **Las claves de las evaluaciones se fueron con ADR-096**: el owner
  // descartó las dos formas de listarlas, y de las evaluaciones quedó sólo la
  // píldora. El listado vive en `/materias`, con su propio copy.
  "HOY.PILDORA.DIAS": "para la próxima evaluación",
  "HOY.PILDORA.HOY": "Hoy tenés una evaluación",
  // «avance» y no «actividad»: la segunda es la palabra vetada para `Action` (`C-02`),
  // y «Último avance» / «Sin avance registrado» ya son el vocabulario de `UX01`.

  /**
   * **Riesgos de planificación** — ADR-093. ⚠️ **No son `RiskSignal`**: miran el
   * calendario y la carga, nunca a la persona. Cada frase enuncia **el hecho**
   * que disparó la regla; ninguna dice *"estás atrasado"* ni *"no vas a
   * llegar"*, que [ADR-075](../../docs/decisions.md#adr-075) prohibió textual.
   */
  "HOY.RIESGOS": "Riesgos detectados",
  "HOY.RIESGOS.UNO": "detectado",
  "HOY.RIESGOS.VARIOS": "detectados",
  "HOY.RIESGOS.VACIO": "Ninguna regla se cumple con lo que está cargado hoy.",
  "HOY.RIESGOS.AYUDA":
    "Cinco reglas sobre tus fechas, temas, avance y horas declaradas. Son avisos para organizarte: no evalúan cómo vas ni predicen tu resultado.",
  "HOY.RIESGOS.SIN_TEMAS": "{materia}: {evaluacion} el {fecha} sin temas cargados",
  "HOY.RIESGOS.SIN_TEMAS.DETALLE":
    "Sin temas no se puede estimar cuánto falta preparar. Cargarlos desbloquea la estimación.",
  "HOY.RIESGOS.COBERTURA": "{materia}: evaluación {cuando} con {porcentaje}% de cobertura",
  "HOY.RIESGOS.COBERTURA.DETALLE":
    "Menos de la mitad del tiempo estimado tiene evidencia enviada, a una semana o menos.",
  "HOY.RIESGOS.AVANCE": "{materia}: evaluación {cuando} y {avance}",
  "HOY.RIESGOS.AVANCE.NUNCA": "ningún avance registrado",
  "HOY.RIESGOS.AVANCE.HACE": "sin avance hace {n} días",
  "HOY.RIESGOS.ENCIMADAS.MISMO_DIA": "{n} evaluaciones el mismo día ({fecha})",
  "HOY.RIESGOS.ENCIMADAS.SEGUIDAS": "{n} evaluaciones en días seguidos, desde el {fecha}",
  "HOY.RIESGOS.ENCIMADAS.DETALLE": "{materias}, sin un día libre entre medio.",
  "HOY.RIESGOS.ABRIR": "Abrir materia",

  /**
   * **El cuadro de hoy** — [ADR-094](../../docs/decisions.md#adr-094). Poca
   * información a propósito: es un vistazo, y cada renglón dice una cosa.
   */
  "HOY.CUADRO": "Tu día",
  "HOY.CUADRO.CLASES": "Clases",
  "HOY.CUADRO.CLASES.VACIO": "Hoy no tenés clases cargadas.",
  "HOY.CUADRO.AVANZAR": "Podés avanzar",
  "HOY.CUADRO.AVANZAR.SIN_CLASES": "Todavía no hay clases dadas cargadas.",
  // ⚠️ Sin la palabra «todo»: el guard `C-02` la lee como `to-do`, que es una de
  // las derivas prohibidas de `Action` (`AGENTS.md` §4).
  "HOY.CUADRO.AVANZAR.TODO": "Lo dado en clase ya tiene evidencia.",
  "HOY.CUADRO.HORARIOS": "Horarios",
  "HOY.CUADRO.HORARIOS.VACIO": "Sin compromisos ni franjas declaradas para hoy.",
  "HOY.CUADRO.COMPROMISO": "Compromiso · {titulo}",
  "HOY.CUADRO.DISPONIBLE": "Disponible para estudiar",
  "HOY.CUADRO.DISPONIBLE.MINUTOS": "Disponible para estudiar · {horas}",
  /**
   * ⚠️ **Obligatoria donde se muestre un horario estimado.** Sin esto el aula se
   * lee como dato de la facultad. La usan el cuadro de hoy y el índice de
   * materias: **una sola frase**, para que no deriven (ADR-095).
   */
  "COMUN.HORARIO_ESTIMADO": "Horarios y aulas estimados por Achieve, no publicados por la facultad.",
  /** ⚠️ `Un.` **no es la unidad de hoy**: no hay cronograma de clases futuras (ADR-094). */
  "HOY.CUADRO.NOTA.UNIDAD": "Un.: la unidad de la última clase dada.",
  "HOY.CUADRO.NOTA.AVANZAR": "Podés avanzar: unidades dadas en clase sin evidencia, por evaluación más cercana.",

  /**
   * La modalidad de una evaluación, para leer. ⚠️ **El enum nunca es copy**
   * (`AGENTS.md` §2.6): `teorico_escrito` se veía crudo en `UX01` y en el índice.
   * En minúscula porque va en medio de una línea: *"Parcial 1 · teórico escrito"*.
   * Una modalidad fuera de P0 se **nombra**, no se mapea a una de P0 (`C01-047`).
   */
  "EVALUACION.MODALIDAD.practico": "práctico",
  "EVALUACION.MODALIDAD.teorico_escrito": "teórico escrito",
  "EVALUACION.MODALIDAD.oral": "oral",
  "EVALUACION.MODALIDAD.mixta": "mixta",
  "EVALUACION.MODALIDAD.otra": "otra modalidad",

  // ── El espacio de trabajo ([ADR-088](../../docs/decisions.md#adr-088)) ────
  /**
   * ⚠️ **Ninguna de estas frases afirma nada del dominio.** El espacio de
   * trabajo no crea entidades, no evalúa y no promete: son etiquetas de
   * control. Viven acá por `C-07` y por el tono — voseo, sin excepciones.
   */
  "ESPACIO.TITULO": "Lo que tenés abierto",
  "ESPACIO.ABRIR_OTRO": "Abrir otro",
  "ESPACIO.VACIO": "Todavía no abriste nada.",
  "ESPACIO.VACIO_AYUDA": "Lo que abras desde una materia, el mapa o el buscador te queda acá para volver.",
  "ESPACIO.CERRAR": "Cerrar",
  "ESPACIO.CERRAR_OTROS": "Cerrar los otros",
  "ESPACIO.CERRAR_TODOS": "Cerrar todos",
  "ESPACIO.MOVER_IZQUIERDA": "Mover a la izquierda",
  "ESPACIO.MOVER_DERECHA": "Mover a la derecha",
  "ESPACIO.MAS": "Ver los demás",
  "ESPACIO.OPCIONES": "Opciones de este objeto",
  /** El límite duro actuando. **Se dice**: nada se cierra en silencio (ADR-088 §2). */
  "ESPACIO.DESALOJADO": "Cerramos lo que hacía más que no mirabas para hacer lugar:",

  // ── La ventana interna (ADR-088, Enmienda 1) ─────────────────────────────
  "PANEL.MINIMIZAR": "Minimizar",
  "PANEL.CERRAR": "Cerrar",
  /** El objeto existe en la barra y su superficie todavía no se puede desplegar. */
  "PANEL.SIN_VISTA": "Todavía no se puede ver este objeto acá.",
  "PANEL.SIN_VISTA_AYUDA": "Expandí la ventana para verlo completo.",
  // Enmienda 2 — el manejo de ventana.
  /**
   * ⚠️ **Expandir lleva a la pantalla del objeto** — Enmienda 7. Reemplaza a
   * *«Ver como página»*, que se retiró: eran dos controles para lo mismo.
   */
  "PANEL.EXPANDIR": "Expandir",
  "PANEL.RESTAURAR": "Restaurar el tamaño",
  "PANEL.MOVER": "Mover la ventana",
  "PANEL.CONTROLES": "Controles de esta ventana",
  "PANEL.REDIMENSIONAR": "Cambiar el tamaño",


  // ── Modo noche y cuenta (ADR-097) ────────────────────────────────────────
  /** El botón dice a dónde lleva, no dónde estás. */
  "TEMA.A_OSCURO": "Modo noche",
  "TEMA.A_CLARO": "Modo claro",
  "CUENTA.MENU": "Tu cuenta",
  /** Dónde estudia: la institución, y la carrera si ya la declaró. */
  "CUENTA.DONDE": "Dónde estudiás",
  "CUENTA.CERRAR_SESION": "Cerrar sesión",
  // ── Administrar cuenta (ADR-097 Enmienda 2) ──────────────────────────────
  "CUENTA.ADMINISTRAR": "Administrar cuenta",
  "CUENTA.TITULO": "Cuenta",
  "CUENTA.BAJADA": "Gestioná la información de tu cuenta.",
  "CUENTA.PERFIL": "Perfil",
  "CUENTA.SEGURIDAD": "Seguridad",
  "CUENTA.ACTUALIZAR_PERFIL": "Actualizar perfil",
  "CUENTA.CARGAR_IMAGEN": "Cargar imagen",
  "CUENTA.CARGAR_IMAGEN_AYUDA": "Cargá una imagen JPG, PNG, GIF o WEBP de menos de 10 MB",
  "CUENTA.IMAGEN_INVALIDA": "La imagen tiene que ser JPG, PNG, GIF o WEBP y pesar menos de 10 MB",
  "CUENTA.NOMBRE": "Nombre",
  "CUENTA.APELLIDO": "Apellido",
  "CUENTA.CORREOS": "Correos electrónicos",
  /** El único correo: no se suman otros, quién entra lo decide el padrón (ADR-039). */
  "CUENTA.PRIMARIO": "Primario",
  "CUENTA.CONTRASENA": "Contraseña",
  "CUENTA.CAMBIAR_CONTRASENA": "Cambiar contraseña",
  "CUENTA.NUEVA_CONTRASENA": "Nueva contraseña",
  "CUENTA.CONFIRMAR_CONTRASENA": "Confirmar contraseña",
  "CUENTA.CONTRASENAS_DISTINTAS": "Las contraseñas no coinciden",
  "CUENTA.CONTRASENA_CORTA": "La contraseña tiene que tener al menos 6 caracteres",
  "CUENTA.CERRAR_OTRAS": "Cerrar sesión en los otros dispositivos",
  "CUENTA.CONTRASENA_CAMBIADA": "Contraseña actualizada",
  "CUENTA.DISPOSITIVOS": "Dispositivos activos",
  "CUENTA.ESTE_DISPOSITIVO": "Este dispositivo",
  "CUENTA.OTRO_DISPOSITIVO": "Otro dispositivo",
  "CUENTA.CERRAR_EN_DISPOSITIVO": "Cerrar sesión en este dispositivo",
  "CUENTA.OPCIONES_DISPOSITIVO": "Opciones del dispositivo",
  "CUENTA.SIN_DISPOSITIVOS": "No hay otras sesiones abiertas",
  "CUENTA.HOY_A_LAS": "Hoy a las",
  "CUENTA.AYER_A_LAS": "Ayer a las",
  "CUENTA.A_LAS": "a las",
  "CUENTA.CANCELAR": "Cancelar",
  "CUENTA.GUARDAR": "Guardar",
  "CUENTA.CERRAR": "Cerrar",
  "CUENTA.NO_SE_PUDO": "No se pudo guardar. Probá de nuevo.",
  // ── La campanita, simulada (ADR-097 Enmienda 1) ──────────────────────────
  "AVISOS.TITULO": "Avisos",
  "AVISOS.MARCAR_LEIDOS": "Marcar todas como leídas",
  /** El rótulo que dice que nada de la lista ocurrió. Va siempre visible. */
  "AVISOS.SIMULADO": "Simulado",
  "AVISOS.SIN_LEER": "sin leer",

  // ── El mosaico (ADR-088, Enmienda 6) ─────────────────────────────────────
  /**
   * ⚠️ **Se dice «acomodar», no «dividir la pantalla».** Lo que se mueve es
   * **esta** ventana, a una parte de la pantalla; la pantalla no se parte en
   * nada. *"Pantalla dividida"* describiría un modo del sistema —uno donde no
   * se puede tener una tercera ventana encima— y acá no lo hay: las otras
   * ventanas siguen donde estaban y se pueden apilar arriba.
   */
  "PANEL.MOSAICO": "Acomodar en la pantalla",
  /**
   * El atajo dicho dentro del control que lo dispara (`I-04`).
   *
   * ⚠️ **Y dicho, porque mantener apretado no se ve.** Un gesto oculto que hay
   * que descubrir es `P-07` al revés; va en el `title` y en el
   * `aria-description` del mismo botón de expandir.
   */
  "PANEL.MOSAICO_AYUDA": "Mantené apretado para acomodarla en media pantalla",
  "PANEL.ZONA.IZQUIERDA": "Mitad izquierda",
  "PANEL.ZONA.DERECHA": "Mitad derecha",
  "PANEL.ZONA.ARRIBA": "Mitad de arriba",
  "PANEL.ZONA.ABAJO": "Mitad de abajo",
  "PANEL.ZONA.SUP_IZQ": "Cuarto de arriba a la izquierda",
  "PANEL.ZONA.SUP_DER": "Cuarto de arriba a la derecha",
  "PANEL.ZONA.INF_IZQ": "Cuarto de abajo a la izquierda",
  "PANEL.ZONA.INF_DER": "Cuarto de abajo a la derecha",

  // ── Modo Clase (ADR-098) ─────────────────────────────────────────────────
  /**
   * ⚠️ **«Apuntes», nunca «notas».** *Nota* es sinónimo prohibido de
   * `Reflection`, y en la facultad además es la calificación.
   */
  "CLASE.TITULO": "Clase",
  /** ADR-099 §7: el tipo es **simulado**. Sin simulación el título es «Clase». */
  "CLASE.TITULO.TEORICA": "Clase teórica",
  "CLASE.TITULO.PRACTICA": "Clase práctica",
  "CLASE.EN_CURSO": "En curso",
  "CLASE.TERMINADA": "Terminada",
  "CLASE.MANUAL": "Iniciada fuera de horario",
  /** ADR-094 §3: sin esta nota, un horario simulado se lee como de la facultad. */
  "CLASE.HORARIO_ESTIMADO": "Horario estimado por Achieve, no publicado por la facultad",
  "CLASE.RELOJ": "Tiempo en clase",

  // Apuntes · ADR-099 §4
  "CLASE.APUNTES": "Apuntes",
  "CLASE.APUNTES_PLACEHOLDER": "Escribí y apretá Enter para guardar",
  "CLASE.APUNTES_AYUDA": "Enter guarda · Shift + Enter hace un salto de línea",
  "CLASE.APUNTES_VACIO": "Todavía no escribiste nada. Cada Enter queda guardado con el momento de la clase.",
  "CLASE.APUNTES_CANTIDAD": "{n} guardados",
  "CLASE.APUNTE_GUARDANDO": "Guardando…",
  "CLASE.APUNTE_ERROR": "No se guardó. Tocá para reintentar",
  "CLASE.APUNTE_DESPUES": "Después",
  "CLASE.APUNTE_EDITAR": "Editar apunte",
  "CLASE.APUNTE_BORRAR": "Borrar apunte",
  "CLASE.APUNTE_EDITADO": "editado",
  "CLASE.GUARDAR": "Guardar",
  "CLASE.CANCELAR": "Cancelar",

  // Marcas · ADR-098 §3
  "CLASE.MARCAR": "Marcar",
  "CLASE.MARCAR_REGLA": "Un toque guarda el momento. Si querés, después contás qué pasó.",
  "CLASE.MARCA.QUESTION": "No entendí",
  "CLASE.MARCA.IMPORTANT": "Importante",
  /** `ASSESSMENT`: *"Parcial"* era falso cuando lo que viene es un final o un TP. */
  "CLASE.MARCA.ASSESSMENT": "Posible evaluación",
  "CLASE.MARCA.REVIEW": "Revisar",
  "CLASE.MARCA_ERROR": "No se guardó. Tocá para reintentar",
  "CLASE.MARCA_ENVIANDO": "Guardando…",
  "CLASE.MOMENTOS": "Momentos marcados",
  "CLASE.SIN_MOMENTOS": "Todavía no marcaste ningún momento.",
  "CLASE.DETALLE": "Contá qué pasó",
  "CLASE.DETALLE_PLACEHOLDER": "Opcional",

  // Grabaciones · ADR-099 §2–§3
  "CLASE.GRABACIONES": "Grabaciones",
  "CLASE.GRABACIONES_REGLA": "Opcional. Nunca empieza sola, no se transcribe y la podés borrar cuando quieras.",
  "CLASE.GRABACIONES_VACIO": "No grabaste esta clase.",
  "CLASE.GRABAR": "Grabar audio",
  /** ADR-099 §2: se confirma la primera vez de cada clase. Texto del ADR. */
  "CLASE.GRABAR_AVISO":
    "Vas a grabar el audio de la clase. Pedile permiso a tu docente y avisá a quienes estén cerca: la grabación puede incluir sus voces.",
  "CLASE.GRABAR_CONFIRMAR": "Entendido, grabar",
  "CLASE.GRABANDO": "Grabando",
  "CLASE.DETENER": "Detener",
  "CLASE.ETIQUETAR_MOMENTO": "Etiquetar este momento",
  "CLASE.ETIQUETA_PLACEHOLDER": "Ej.: Ejercicio 3",
  "CLASE.ETIQUETA_AGREGAR": "Agregar etiqueta",
  "CLASE.ETIQUETA_EN": "en {momento}",
  "CLASE.ETIQUETA_TODA": "toda la grabación",
  "CLASE.ETIQUETA_BORRAR": "Quitar etiqueta {texto}",
  "CLASE.SUBIENDO_GRABACION": "Subiendo la grabación…",
  "CLASE.GRABACION_ERROR": "No se pudo subir la grabación. Sigue en esta pestaña: reintentá.",
  "CLASE.REINTENTAR": "Reintentar",
  "CLASE.SIN_MICROFONO": "Este navegador no permite grabar audio. La clase sigue igual.",
  "CLASE.MICROFONO_DENEGADO": "No diste permiso para usar el micrófono. La clase sigue igual.",
  "CLASE.GRABACION": "Grabación {n}",
  "CLASE.GRABACION_META": "{duracion} · empieza en el {momento} de la clase · {tamano}",
  "CLASE.ESCUCHAR": "Escuchar",
  "CLASE.BORRAR_GRABACION": "Borrar grabación",
  "CLASE.BORRAR_CONFIRMAR": "¿Borrar? No se puede deshacer.",
  "CLASE.BORRAR_SI": "Sí, borrar",

  // Material · ADR-099 §5
  "CLASE.MATERIAL": "Material de la clase",
  "CLASE.MATERIAL_REGLA": "PDF, imágenes, documentos o links. Es tuyo: no se comparte con nadie.",
  "CLASE.MATERIAL_VACIO": "Arrastrá un archivo acá o hacé clic para elegirlo · hasta 25 MB",
  "CLASE.SUBIR_ARCHIVO": "Subir archivo",
  "CLASE.AGREGAR_LINK": "Agregar link",
  "CLASE.LINK_URL": "https://…",
  "CLASE.LINK_TITULO": "Título (opcional)",
  "CLASE.LINK_INVALIDO": "El link tiene que empezar con http:// o https://",
  "CLASE.SUBIENDO": "Subiendo {nombre}…",
  "CLASE.MATERIAL_ERROR": "No se pudo subir {nombre}.",
  "CLASE.MATERIAL_TIPO": "Ese tipo de archivo no se puede subir.",
  "CLASE.MATERIAL_GRANDE": "{nombre} supera los 25 MB.",
  "CLASE.ABRIR": "Abrir",
  "CLASE.BORRAR_MATERIAL": "Borrar {titulo}",
  "CLASE.LINK": "Link",

  // Unidades y cómo venís · ADR-099 §8
  "CLASE.UNIDADES": "Unidades de la materia",
  "CLASE.ESTA_CLASE": "Esta clase",
  "CLASE.UNIDAD_N": "Unidad {n}",
  /** ⚠️ Inferencia rotulada: ADR-094 prohíbe presentar un cronograma que nadie publicó. */
  "CLASE.UNIDAD_ESTIMADA": "Estimada por Achieve: la que sigue a la última clase dada",
  "CLASE.UNIDAD_DICTADA": "Según el libro de temas de esta fecha",
  "CLASE.TE_FALTAN_UNA": "Te falta la unidad {lista}",
  "CLASE.TE_FALTAN": "Te faltan las unidades {lista}",
  "CLASE.AL_DIA": "Venís al día con las unidades anteriores",
  /** ADR-075 §C1: dice qué mide, no sólo qué no es. */
  "CLASE.UNIDADES_REGLA": "Es el estado que ves en Materia: trabajo registrado, no comprensión.",
  "CLASE.UNIDAD.sin_evidencia": "Sin registro",
  "CLASE.UNIDAD.enviada": "Enviada",
  "CLASE.UNIDAD.requiere_revision": "En revisión",
  "CLASE.UNIDAD.criterio_alcanzado": "Criterio alcanzado",

  // La franja del pie · ADR-099 §6
  "CLASE.PIE": "Datos de la clase",
  "CLASE.PIE.COMISION": "Comisión",
  "CLASE.PIE.AULA": "Aula",
  "CLASE.PIE.INSCRIPTOS": "Inscriptos",
  "CLASE.PIE.DOCENTE": "Docente",
  "CLASE.PIE.SIMULADO": "Simulado",
  "CLASE.PIE.SIMULADO_REGLA": "Comisión e inscriptos simulados para la demo.",

  // Finalizar · CTA-023
  "CLASE.FINALIZAR": "Finalizar clase",
  "CLASE.FINALIZAR_REGLA": "Lo que escribiste, marcaste, grabaste y subiste ya quedó guardado. Después vas a poder seguir editándolo.",
  "CLASE.FINALIZAR_ERROR": "No pudimos finalizar la clase. Tus apuntes y marcas están guardados: probá de nuevo.",
  /** Acuse persistente (`design-system-capturas.md` §9.4), no un toast. */
  "CLASE.GUARDADA": "Clase guardada",
  "CLASE.DURACION": "Duración",
  "CLASE.RESUMEN": "Resumen",
  "CLASE.SIN_CLASE_ACTIVA": "No tenés una clase abierta.",
  "CLASE.SIN_CLASE_ACTIVA_REGLA": "Entrá a clase desde Hoy, cuando tengas una en curso, o desde tu materia.",
  "MATERIA.TUS_CLASES": "Tus clases",
  /** Sin esta línea se confunden con las clases de la semana o las dictadas. */
  "MATERIA.TUS_CLASES.REGLA": "Las clases que abriste en Achieve, con tus apuntes y tus marcas.",
  "MATERIA.TUS_CLASES.VACIO": "Todavía no abriste ninguna clase de esta materia.",
  "MATERIA.TUS_CLASES.INICIAR": "Iniciar clase",
  "MATERIA.TUS_CLASES.VOLVER": "Volver a la clase",
  "MATERIA.TUS_CLASES.EN_CURSO": "En curso",
  "MATERIA.TUS_CLASES.SIN_MARCAS": "sin marcas",
  "HOY.CUADRO.CLASE.AHORA": "Ahora",
  "HOY.CUADRO.CLASE.EMPIEZA": "Empieza en {n} min",
  /** `CTA-022`: tres etiquetas, una CTA. */
  "HOY.CUADRO.CLASE.ENTRAR": "Entrar a clase",
  "HOY.CUADRO.CLASE.VOLVER": "Volver a la clase",
  "HOY.CUADRO.CLASE.ABIERTA": "Tenés una clase abierta",
} as const;

export type CopyId = keyof typeof copy;

/** Devuelve el copy de un ID. El ID es tipado: un ID inexistente no compila. */
export function t(id: CopyId): string {
  return copy[id];
}

/**
 * Domingo a sábado, en el orden y la escala de `availability.day_of_week` y de
 * `class_schedule_block.day_of_week` — **`0`–`6`, y son la misma escala a
 * propósito** ([ADR-063](../../docs/decisions.md#adr-063)).
 *
 * Vive acá y no en un componente porque **la usan dos**: el paso de
 * disponibilidad del alta y el horario de cursado de `UX02`. Dos listas serían
 * dos verdades, y el día que alguien corrija «Mié» en una, la otra queda mal.
 *
 * Y porque traducir un `SMALLINT` a una palabra visible **es contenido**:
 * `AGENTS.md` §2.6, los enums nunca son copy.
 */
export const DIAS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"] as const;

/**
 * Los mismos siete, enteros. **No es una segunda lista**: es el mismo dato en
 * otro registro, y por eso viven pegados y con el mismo orden.
 *
 * La forma corta rotula una tabla —donde el ancho manda—; la larga entra en una
 * oración, y *"tenés clase el Mar de 14:00 a 16:00"* no es una oración.
 */
export const DIAS_LARGOS = [
  "domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado",
] as const;

/** `null` ⇒ el número no nombra ningún día, y **no se muestra un día cualquiera**. */
/**
 * Cómo se llama una carrera **en pantalla** · ADR-086.
 *
 * El owner decidió el 9 de septiembre de 2026 que la carrera se muestre como
 * «UCC Sistemas», y decidió también que **el cambio sea sólo de presentación**:
 * `academic_program.name` sigue diciendo `INGENIERIA DE SISTEMAS`, que es como
 * la nombra el CSV administrativo de la facultad.
 *
 * ⚠️ **Es una traducción, no un renombre.** Si mañana hay que cruzar los datos
 * con la institución, el nombre que ella usa sigue estando en la base. Por eso
 * vive acá y no en una migración.
 *
 * ⚠️ **Lo que no está en la tabla se devuelve tal cual.** Ninguna otra carrera
 * se toca, y no hay heurística que "mejore" nombres: eso terminaría inventando
 * denominaciones institucionales.
 */
const NOMBRE_VISIBLE_DE_CARRERA: Record<string, CopyId> = {
  "INGENIERIA DE SISTEMAS": "ALTA.CARRERA.UCC_SISTEMAS",
};

export function nombreVisibleDeCarrera(nombre: string): string {
  const id = NOMBRE_VISIBLE_DE_CARRERA[nombre];
  return id ? t(id) : nombre;
}

export function nombreDeDia(dia: number): string | null {
  return DIAS[dia] ?? null;
}

/**
 * *"el martes de 14:00 a 16:00"* — un bloque de clase dentro de una oración.
 *
 * Vive acá porque **traducir un bloque a una frase es contenido**, y porque la
 * usan dos rutas: `POST /api/compromiso` y `POST /api/renegociacion` explican
 * el mismo conflicto ([ADR-064](../../docs/decisions.md#adr-064)) y tienen que
 * explicarlo igual.
 *
 * `null` ⇒ el día no nombra ningún día. **No se arma la frase a medias**: sin
 * poder decir cuándo, el mensaje no agrega nada a *"no se puede"*.
 */
export function textoDeClase(bloque: { dia: number; desde: string; hasta: string }): string | null {
  const dia = DIAS_LARGOS[bloque.dia];
  if (!dia) return null;
  // Postgres entrega `TIME` con segundos y nadie los lee.
  const hhmm = (h: string) => h.slice(0, 5);
  return `el ${dia} de ${hhmm(bloque.desde)} a ${hhmm(bloque.hasta)}`;
}

/**
 * Motivo canónico → copy aprobada — [ADR-050](../../docs/decisions.md#adr-050).
 *
 * **Una sola tabla**, y por eso vive acá y no en la proyección ni en la
 * pantalla: la usan las dos. La proyección explica antes de intentar; la
 * pantalla explica cuando el servidor contradice lo que había proyectado. Dos
 * tablas serían dos verdades, y una de las dos envejecería sola.
 *
 * ⚠️ **`ESTADO_TERMINAL` y `SIN_ACUERDO_ORIGINAL` no están, y es a propósito.**
 * A alguien que mira un compromiso cumplido o cerrado no hay que explicarle que
 * no puede moverlo: el chip ya lo dice, y una línea más sería ruido. Sin copy,
 * la proyección no dibuja el bloque.
 */
export const MOTIVO_DE_CAMBIO: Partial<Record<MotivoSinCambio, string>> = {
  YA_EMPEZO: t("COMPROMISO.MOTIVO_YA_EMPEZO"),
  INCUMPLIDO: t("COMPROMISO.MOTIVO_INCUMPLIDO"),
  CADENA_YA_RENEGOCIADA: t("COMPROMISO.MOTIVO_YA_CAMBIADO"),
  SIN_HORARIO_POSIBLE: t("COMPROMISO.MOTIVO_SIN_HORARIO"),
};

/**
 * La duración de una clase, en palabras — ADR-098.
 *
 * **`0` minutos no se escribe «0 min»**: una clase de menos de un minuto duró
 * algo, y *"0 min"* se lee como que no ocurrió.
 */
export function textoDeDuracion(minutos: number): string {
  if (minutos < 1) return "menos de un minuto";
  const h = Math.floor(minutos / 60);
  const m = minutos % 60;
  if (h === 0) return `${m} min`;
  return m === 0 ? `${h} h` : `${h} h ${m} min`;
}

/** Rellena `{clave}` en una copy. Una clave sin valor queda visible: se nota. */
export function llenarCopy(id: CopyId, valores: Record<string, string | number>): string {
  return copy[id].replace(/\{(\w+)\}/g, (entera, clave: string) =>
    clave in valores ? String(valores[clave]) : entera,
  );
}
