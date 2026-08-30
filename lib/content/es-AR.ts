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
 * `design-system-capturas.md` §14.2, **sin escribir**.
 *
 * Las capturas ponen, bajo el título de cada panel, un párrafo que dice **qué
 * es esto y por qué importa** en lenguaje llano (§11.9.4). Achieve pone el
 * título y la fecha, y nada más.
 *
 * **Por qué está en `null` y no escrita.** Esa frase afirma algo del dominio:
 * qué contiene la pantalla, para qué sirve y qué se espera del estudiante. Con
 * 51 contratos `C01` abiertos, escribirla desde la capa visual sería inventar
 * una regla de negocio — la regla 1 de `AGENTS.md`. `C-07` ya declara deuda de
 * contenido; esto la hace visible en vez de agrandarla en silencio.
 *
 * **Mientras valga `null`, el panel no dibuja subcopy.** Omitir, no inventar.
 *
 * **Cómo completarla:** reemplazar el `null` por la frase. Una o dos líneas,
 * voseo (`C-01`), sin veredictos (`C-06`), sin placeholders genéricos (`C-03`).
 * No hace falta tocar ningún componente: aparece sola.
 *
 * Las cuatro superficies marcadas `TÍTULO` además **no tienen título propio**:
 * hoy su `h1` es el eyebrow, promovido para no dejarlas sin título de
 * documento. Necesitan las dos cosas.
 *
 * `tests/titulos.test.tsx` falla si esta lista se vacía sin actualizarse, y
 * `npm test` imprime cuáles siguen pendientes.
 */
export const SUBCOPY_PENDIENTE = {
  /** `UX01` Hoy — qué es "hoy" y por qué hay una sola acción. */
  UX01: null,
  /** `UX02` Materia / Cursado — qué son las cinco dimensiones y por qué no se suman. */
  UX02: null,
  /** `UX03` Próxima Acción — por qué esta acción y no otra. */
  UX03: null,
  /** `UX04` Compromiso — qué cambia al comprometerse, y qué no. */
  UX04: null,
  /** `UX05` Evidencia — qué se espera adjuntar y qué pasa después de enviar. */
  UX05: null,
  /** `UX06` Progreso / Bitácora — **TÍTULO** + qué registra y qué no. */
  UX06: null,
  /** `UX07` Activación Modo Examen — **TÍTULO** + qué activa y qué no interrumpe. */
  UX07: null,
  /** `UX08` Modo Examen / Overview — **TÍTULO** + qué muestra esta preparación. */
  UX08: null,
  /** `UX09` Paso de Protocolo — **TÍTULO** + qué es un paso y cómo se cierra. */
  UX09: null,
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
  "HOY.VACIO": "No hay una próxima acción disponible. Podés revisar tus materias.",

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
  "EVIDENCIA.SIN_ADJUNTO": "Todavía no adjuntaste contenido.",
  "EVIDENCIA.CARGADA_SUFIJO": "cargada",
  // Enviar no es demostrar suficiencia; suficiencia no es validación
  // (AGENTS.md §2.1). Esta frase es exactamente esa cadena de no-implicación.
  "EVIDENCIA.ENVIAR_IMPLICA":
    "Enviar: queda SUBMITTED; sigue validación. No implica suficiencia ni dominio.",

  // ── UX07 · Activación de Modo Examen ──────────────────────────────────────
  // Títulos de VI.7 §22.1 y CTAs semánticas de §22.2, literales.
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
  "OVERVIEW.EXAMEN": "EXAMEN",
  "OVERVIEW.RECORRIDO": "RECORRIDO VIGENTE",
  "OVERVIEW.SIN_RECORRIDO": "RECORRIDO TODAVÍA NO DISPONIBLE",
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
  "PROGRESO.CAMBIO_CONFIRMADO": "Cambio confirmado",
  "PROGRESO.SIN_CAMBIO": "Sin cambio confirmado",
  "PROGRESO.FUENTE_PREFIJO": "Fuente:",
  "PROGRESO.BITACORA": "Bitácora",
  "PROGRESO.QUE_SIGUE": "Qué sigue",
} as const;

export type CopyId = keyof typeof copy;

/** Devuelve el copy de un ID. El ID es tipado: un ID inexistente no compila. */
export function t(id: CopyId): string {
  return copy[id];
}
