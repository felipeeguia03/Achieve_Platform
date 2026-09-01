/**
 * Los 22 estados críticos de `UX07`, de `product-spec-source.md` §VI.7 §16.
 *
 * La matriz de §16 es **obligatoria**: cada fila declara escenario,
 * representación, CTA primaria y efecto/fallback. Acá está una por una, en el
 * mismo orden, con el copy de §22 y §25 literal.
 *
 * Nomenclatura: `FX-EXAM-BASE` es del registro canónico del spec §7. Los otros
 * 21 el spec no los nombra, así que llevan prefijo `FX-LOCAL-EXAM-` — buscarlos
 * en el spec no devuelve nada, y eso tiene que ser evidente desde el nombre.
 */

import { contexto } from "@/lib/navigation/context";
import type { Escenario } from "./types";
import type { ActivacionExamenProps, DatoDeEvaluacion } from "@/lib/domain/view-models";

const MATERIA = "Análisis II";
const COMISION = "Comisión A";
const OFICIAL = "Cátedra · oficial";

const QUE_CAMBIA = ["Se crea una preparación sólo para esta evaluación."] as const;
const QUE_NO_CAMBIA = [
  "Cursado, progreso y Bitácora siguen disponibles.",
  "No crea Action ni Commitment.",
] as const;
const DESPUES =
  "Abriremos el contexto de esta preparación. Todavía no se crea una Action ni un Commitment.";
const VOLVER = `VOLVER A ${MATERIA.toUpperCase()}`;

function dato(label: string, valor: string, provenance: string | null = OFICIAL): DatoDeEvaluacion {
  return { label, valor, provenance, anterior: null };
}

const DATOS_OFICIALES: DatoDeEvaluacion[] = [
  dato("Fecha", "07 sep 2026"),
  dato("Modalidad", "Práctico"),
];

/** Base común. Cada escenario sobrescribe sólo lo que su fila de §16 declara. */
function base(over: Partial<ActivacionExamenProps>): ActivacionExamenProps {
  return {
    estado: "RECOMENDACION",
    materia: MATERIA,
    comision: COMISION,
    titulo: "RECOMENDACIÓN DE ACTIVACIÓN",
    evaluacion: "Parcial 1",
    datos: DATOS_OFICIALES,
    razonAparicion: null,
    faltantes: [],
    aviso: null,
    opciones: null,
    queCambia: QUE_CAMBIA,
    queNoCambia: QUE_NO_CAMBIA,
    despues: DESPUES,
    ctaPrimaria: null,
    ctaRetorno: VOLVER,
    ...over,
  };
}

function escenario(
  id: string,
  proposito: string,
  ux07: ActivacionExamenProps,
  opciones: { cubre?: readonly string[]; elegible?: boolean; origen?: "spec" | "local" } = {},
): Escenario {
  return {
    id,
    origen: opciones.origen ?? "local",
    proposito,
    cubre: opciones.cubre ?? ["C01-005", "SC-EX-01"],
    contextos: {
      UX07: contexto({
        assessmentElegible: opciones.elegible ?? false,
        confirmacionExplicita: opciones.elegible ?? false,
      }),
      // El mismo mundo, visto desde la materia: si hay una evaluación elegible,
      // desde `UX02` se puede entrar a prepararla (`CTA-019`, ADR-016). No es un
      // contexto nuevo — es la otra superficie del mismo hecho.
      ...(opciones.elegible
        ? { UX02: contexto({ courseVisible: true, assessmentElegible: true }) }
        : {}),
    },
    ux07,
  };
}

const RAZON_VENTANA =
  "Apareció porque esta evaluación entró en la ventana de recomendación determinada por el servicio propietario.";

// ── 1. Evaluación confirmada dentro de la ventana de recomendación ───────────
export const FX_EXAM_BASE = escenario(
  "FX-EXAM-BASE",
  "Assessment + ExamPreparation + protocolo/paso actual",
  base({
    razonAparicion: RAZON_VENTANA,
    ctaPrimaria: { texto: "ACTIVAR PREPARACIÓN DE ESTE EXAMEN", habilitada: true },
  }),
  { origen: "spec", cubre: ["C01-005", "SC-EX-01"], elegible: true },
);

// ── 2. Reportada por el alumno dentro de la ventana ──────────────────────────
// La provenance no se eleva: sigue siendo un reporte del estudiante.
export const FX_LOCAL_EXAM_REPORTADA = escenario(
  "FX-LOCAL-EXAM-REPORTADA",
  "Fecha reportada por el estudiante: la verificación no se eleva",
  base({
    datos: [
      dato("Fecha", "07 sep 2026", "Reportado por vos · sin verificar"),
      dato("Modalidad", "Práctico"),
    ],
    razonAparicion: RAZON_VENTANA,
    ctaPrimaria: { texto: "ACTIVAR CON ESTOS DATOS", habilitada: true },
  }),
  { elegible: true },
);

// ── 3. Fecha estimada / sin verificar, sin elegibilidad autoritativa ─────────
export const FX_LOCAL_EXAM_FECHA_ESTIMADA = escenario(
  "FX-LOCAL-EXAM-FECHA-ESTIMADA",
  "Fecha estimada sin elegibilidad autoritativa: no se trata como oficial",
  base({
    estado: "REVISION_MANUAL",
    titulo: "TODAVÍA NO ESTÁ ACTIVO",
    datos: [
      dato("Fecha", "07 sep 2026 · Estimada", "Estimado por Achieve · sin verificar"),
      dato("Modalidad", "Práctico"),
    ],
    // Sin elegibilidad no hay CTA de activación, y tampoco una corrección
    // pendiente que no exista.
    ctaPrimaria: null,
  }),
);

// ── 4. Manual con Assessment existente ───────────────────────────────────────
export const FX_LOCAL_EXAM_MANUAL = escenario(
  "FX-LOCAL-EXAM-MANUAL",
  "Entrada manual con Assessment existente del CourseEnrollment de origen",
  base({
    estado: "REVISION_MANUAL",
    titulo: "REVISÁ ESTA EVALUACIÓN",
    ctaPrimaria: { texto: "ACTIVAR PREPARACIÓN DE ESTE EXAMEN", habilitada: true },
  }),
  { elegible: true, cubre: ["C01-005", "SC-EX-02"] },
);

// ── 5. Manual sin Assessment registrada ──────────────────────────────────────
// Necesidad no implementable mientras SCP-09/SCP-10 sigan abiertos: se muestra
// el estado con retorno seguro y sin formulario de alta.
export const FX_LOCAL_EXAM_SIN_ASSESSMENT = escenario(
  "FX-LOCAL-EXAM-SIN-ASSESSMENT",
  "Sin Assessment registrada: necesidad no implementable, sin alta ni formulario",
  base({
    estado: "SIN_ASSESSMENT",
    titulo: "TODAVÍA NO ESTÁ ACTIVO",
    evaluacion: null,
    datos: [],
    despues: null,
    aviso: "No encontramos una evaluación registrada para esta materia.",
    ctaPrimaria: null,
  }),
);

// ── 6. Datos mínimos incompletos ─────────────────────────────────────────────
export const FX_LOCAL_EXAM_DATOS_INCOMPLETOS = escenario(
  "FX-LOCAL-EXAM-DATOS-INCOMPLETOS",
  "Datos mínimos incompletos: lista corta de faltantes, sin mutación pendiente",
  base({
    estado: "FALTAN_DATOS",
    titulo: "FALTAN DATOS PARA ACTIVAR",
    datos: [dato("Modalidad", "Práctico")],
    faltantes: ["Fecha de la evaluación", "Comisión de la cátedra"],
    despues: null,
    ctaPrimaria: null,
  }),
);

// ── 7. Fecha desconocida ─────────────────────────────────────────────────────
// Sin countdown, sin estimación y sin CTA de reporte.
export const FX_LOCAL_EXAM_FECHA_DESCONOCIDA = escenario(
  "FX-LOCAL-EXAM-FECHA-DESCONOCIDA",
  "Fecha desconocida: la proximidad no se convierte en hecho",
  base({
    estado: "FECHA_DESCONOCIDA",
    titulo: "FALTAN DATOS PARA ACTIVAR",
    datos: [dato("Fecha", "Desconocida", null), dato("Modalidad", "Práctico")],
    aviso: "La fecha todavía es desconocida.",
    despues: null,
    ctaPrimaria: null,
  }),
);

// ── 8. Modalidad desconocida ─────────────────────────────────────────────────
export const FX_LOCAL_EXAM_MODALIDAD_DESCONOCIDA = escenario(
  "FX-LOCAL-EXAM-MODALIDAD-DESCONOCIDA",
  "Modalidad desconocida: sin selector y sin elegir un default",
  base({
    estado: "MODALIDAD_DESCONOCIDA",
    titulo: "FALTAN DATOS PARA ACTIVAR",
    datos: [dato("Fecha", "07 sep 2026"), dato("Modalidad", "Desconocida", null)],
    aviso: "Todavía no sabemos la modalidad.",
    despues: null,
    ctaPrimaria: null,
  }),
);

// ── 9. Modalidad práctica ────────────────────────────────────────────────────
export const FX_LOCAL_EXAM_PRACTICO = escenario(
  "FX-LOCAL-EXAM-PRACTICO",
  "Modalidad práctica: soportada en P0, handoff sin protocolo interno",
  base({
    estado: "REVISION_MANUAL",
    titulo: "REVISÁ ESTA EVALUACIÓN",
    datos: [dato("Fecha", "07 sep 2026"), dato("Modalidad", "Práctico")],
    ctaPrimaria: { texto: "ACTIVAR PREPARACIÓN DE ESTE EXAMEN", habilitada: true },
  }),
  { elegible: true },
);

// ── 10. Modalidad teórica escrita ────────────────────────────────────────────
export const FX_LOCAL_EXAM_TEORICO = escenario(
  "FX-LOCAL-EXAM-TEORICO",
  "Modalidad teórica escrita: soportada en P0, handoff sin protocolo interno",
  base({
    estado: "REVISION_MANUAL",
    titulo: "REVISÁ ESTA EVALUACIÓN",
    evaluacion: "Recuperatorio",
    datos: [dato("Fecha", "28 sep 2026"), dato("Modalidad", "Teórico escrito")],
    ctaPrimaria: { texto: "ACTIVAR PREPARACIÓN DE ESTE EXAMEN", habilitada: true },
  }),
  { elegible: true },
);

// ── 11. Oral / fuera de P0 ───────────────────────────────────────────────────
// Se muestra la modalidad real y no se fuerza el protocolo P0.
export const FX_LOCAL_EXAM_ORAL = escenario(
  "FX-LOCAL-EXAM-ORAL",
  "Modalidad oral: fuera de P0, con la modalidad real visible y retorno seguro",
  base({
    estado: "FUERA_DE_P0",
    titulo: "TODAVÍA NO ESTÁ ACTIVO",
    datos: [dato("Fecha", "07 sep 2026"), dato("Modalidad", "Oral")],
    aviso: "Todavía no disponible en P0.",
    despues: null,
    ctaPrimaria: null,
  }),
);

// ── 12. Evaluación ya activa ─────────────────────────────────────────────────
// §21.3: el estado REEMPLAZA el CTA de activación. No se conserva un botón
// Activar deshabilitado que sugiera una segunda operación.
export const FX_LOCAL_EXAM_YA_ACTIVA = escenario(
  "FX-LOCAL-EXAM-YA-ACTIVA",
  "ExamPreparation ya ACTIVE: el estado reemplaza el CTA de activación",
  base({
    estado: "YA_ACTIVA",
    titulo: "MODO EXAMEN ACTIVO",
    queCambia: [],
    despues: null,
    ctaPrimaria: { texto: "ABRIR PREPARACIÓN", habilitada: true },
    ctaRetorno: "VOLVER A CURSADO",
  }),
  { cubre: ["C01-005", "SC-EX-05"] },
);

// ── 13. Intento duplicado ────────────────────────────────────────────────────
// No se crea otra: se abre la existente (§17.2).
export const FX_LOCAL_EXAM_DUPLICADO = escenario(
  "FX-LOCAL-EXAM-DUPLICADO",
  "Intento duplicado sobre la misma Assessment: se abre la existente, no se crea otra",
  base({
    estado: "YA_ACTIVA",
    titulo: "MODO EXAMEN ACTIVO",
    razonAparicion: "Ya existe una preparación para esta evaluación.",
    queCambia: [],
    despues: null,
    ctaPrimaria: { texto: "ABRIR PREPARACIÓN", habilitada: true },
    ctaRetorno: "VOLVER A CURSADO",
  }),
  { cubre: ["C01-005", "SC-ERR-01"] },
);

// ── 14. Varias evaluaciones de una misma materia ─────────────────────────────
export const FX_LOCAL_EXAM_VARIAS = escenario(
  "FX-LOCAL-EXAM-VARIAS",
  "Varias evaluaciones del mismo CourseEnrollment: lista sin ranking local",
  base({
    estado: "SELECCION",
    titulo: "REVISÁ ESTA EVALUACIÓN",
    opciones: [
      {
        id: "ASM-SYN-001",
        evaluacion: "Parcial 1",
        datos: [dato("Fecha", "07 sep 2026"), dato("Modalidad", "Práctico")],
        seleccionada: true,
      },
      {
        id: "ASM-SYN-002",
        evaluacion: "Recuperatorio",
        datos: [dato("Fecha", "28 sep 2026"), dato("Modalidad", "Teórico escrito")],
        seleccionada: false,
      },
    ],
    ctaPrimaria: { texto: "REVISAR EVALUACIÓN", habilitada: true },
  }),
  { elegible: true, cubre: ["C01-005", "SC-EX-03"] },
);

// ── 15. Evaluaciones de materias distintas ───────────────────────────────────
// No existe layout transversal: WF-S09 sólo representa la materia de origen.
export const FX_LOCAL_EXAM_OTRA_MATERIA = escenario(
  "FX-LOCAL-EXAM-OTRA-MATERIA",
  "Sin selector transversal: cada Assessment se abre desde su propio CourseEnrollment",
  base({
    estado: "REVISION_MANUAL",
    titulo: "REVISÁ ESTA EVALUACIÓN",
    razonAparicion:
      "Esta evaluación pertenece a Análisis II. Las de otras materias se abren desde su propia materia.",
    ctaPrimaria: { texto: "ACTIVAR PREPARACIÓN DE ESTE EXAMEN", habilitada: true },
  }),
  { elegible: true },
);

// ── 16. Fecha modificada ─────────────────────────────────────────────────────
// Invalida la cuenta previa y fuerza relectura de elegibilidad. No duplica.
export const FX_LOCAL_EXAM_FECHA_MODIFICADA = escenario(
  "FX-LOCAL-EXAM-FECHA-MODIFICADA",
  "Fecha modificada: valor vigente más el anterior, y relectura de elegibilidad",
  base({
    estado: "CAMBIO_DE_FECHA",
    titulo: "REVISÁ ESTA EVALUACIÓN",
    datos: [
      { label: "Fecha", valor: "14 sep 2026", provenance: OFICIAL, anterior: "07 sep 2026" },
      dato("Modalidad", "Práctico"),
    ],
    ctaPrimaria: { texto: "REVISAR EVALUACIÓN", habilitada: true },
  }),
  { elegible: true },
);

// ── 17. Cancelada o inexistente ──────────────────────────────────────────────
// Sólo si una lectura propietaria lo respalda. El estado no se inventa.
export const FX_LOCAL_EXAM_CANCELADA = escenario(
  "FX-LOCAL-EXAM-CANCELADA",
  "Cancelada según lectura propietaria: no se inventa enum ni status",
  base({
    estado: "CANCELADA",
    titulo: "TODAVÍA NO ESTÁ ACTIVO",
    aviso: "La cátedra informó que esta evaluación ya no se toma.",
    despues: null,
    ctaPrimaria: null,
  }),
);

// ── 18. Evaluación ya pasada ─────────────────────────────────────────────────
export const FX_LOCAL_EXAM_PASADA = escenario(
  "FX-LOCAL-EXAM-PASADA",
  "Evaluación pasada con lectura temporal confiable: no se activa desde UX07",
  base({
    estado: "PASADA",
    titulo: "TODAVÍA NO ESTÁ ACTIVO",
    datos: [dato("Fecha", "12 ago 2026"), dato("Modalidad", "Práctico")],
    aviso: "Esta evaluación ya pasó.",
    despues: null,
    ctaPrimaria: null,
  }),
);

// ── 19. Alumno y cátedra contradictorios ─────────────────────────────────────
// El owner resuelve. La UI no elige fuente ni ofrece una corrección que no
// tiene contrato.
export const FX_LOCAL_EXAM_CONTRADICTORIOS = escenario(
  "FX-LOCAL-EXAM-CONTRADICTORIOS",
  "Provenance disputada: la UI no elige entre fuentes ni ofrece corrección",
  base({
    estado: "CONTRADICTORIOS",
    titulo: "HAY DATOS CONTRADICTORIOS",
    datos: [
      {
        label: "Fecha",
        valor: "07 sep 2026",
        provenance: "Dato en revisión · hay versiones distintas",
        anterior: null,
        enRevision: true,
      },
      dato("Modalidad", "Práctico"),
    ],
    aviso: "Hay versiones distintas de este dato.",
    despues: null,
    ctaPrimaria: null,
  }),
);

// ── 20. Datos temporalmente no disponibles ───────────────────────────────────
// Error técnico, NO empty state académico. Los dos significan cosas distintas.
export const FX_LOCAL_EXAM_NO_DISPONIBLE = escenario(
  "FX-LOCAL-EXAM-NO-DISPONIBLE",
  "Lectura fallida: error técnico con retorno seguro, no un empty state",
  base({
    estado: "NO_DISPONIBLE",
    titulo: "NO PUDIMOS CARGAR LA EVALUACIÓN",
    evaluacion: null,
    datos: [],
    aviso: "No pudimos recuperar esta evaluación.",
    queCambia: [],
    queNoCambia: [],
    despues: null,
    ctaPrimaria: { texto: "REINTENTAR", habilitada: true },
  }),
  { cubre: ["C01-005", "SC-ERR-02"] },
);

// ── 21. Activación completada ────────────────────────────────────────────────
export const FX_LOCAL_EXAM_ACTIVACION_COMPLETADA = escenario(
  "FX-LOCAL-EXAM-ACTIVACION-COMPLETADA",
  "Activación completada: ACTIVE autoritativo y handoff a WF-S10",
  base({
    estado: "YA_ACTIVA",
    titulo: "MODO EXAMEN ACTIVO",
    queCambia: [],
    despues: "Abrimos el contexto de esta preparación.",
    ctaPrimaria: { texto: "ABRIR PREPARACIÓN", habilitada: true },
    ctaRetorno: "VOLVER A CURSADO",
  }),
  { cubre: ["C01-005", "SC-EX-04"] },
);

// ── 22. Handoff posterior no disponible ──────────────────────────────────────
// La activación NO se revierte ni se duplica.
export const FX_LOCAL_EXAM_HANDOFF_NO_DISPONIBLE = escenario(
  "FX-LOCAL-EXAM-HANDOFF-NO-DISPONIBLE",
  "Handoff a WF-S10 no disponible: ACTIVE se preserva y no se revierte",
  base({
    estado: "HANDOFF_NO_DISPONIBLE",
    titulo: "MODO EXAMEN ACTIVO",
    queCambia: [],
    aviso:
      "La preparación quedó activa. No pudimos abrir el destino ahora; podés volver a Cursado sin perder la activación.",
    despues: null,
    ctaPrimaria: null,
    ctaRetorno: "VOLVER A CURSADO",
  }),
  { cubre: ["C01-005", "SC-EX-05"] },
);

/** Un estado más de §15 que la matriz no numera: resultado incierto. */
export const FX_LOCAL_EXAM_VERIFICANDO = escenario(
  "FX-LOCAL-EXAM-VERIFICANDO",
  "Respuesta perdida: se reconcilia por identidad y no se reintenta a ciegas",
  base({
    estado: "VERIFICANDO",
    titulo: "ESTAMOS VERIFICANDO LA ACTIVACIÓN",
    aviso: "Estamos verificando si quedó activa.",
    queCambia: [],
    despues: null,
    // Sin reintento ciego: el CTA no se ofrece hasta reconciliar.
    ctaPrimaria: null,
  }),
  { cubre: ["C01-005", "SC-ERR-01"] },
);

export const escenariosUX07 = {
  "FX-EXAM-BASE": FX_EXAM_BASE,
  "FX-LOCAL-EXAM-REPORTADA": FX_LOCAL_EXAM_REPORTADA,
  "FX-LOCAL-EXAM-FECHA-ESTIMADA": FX_LOCAL_EXAM_FECHA_ESTIMADA,
  "FX-LOCAL-EXAM-MANUAL": FX_LOCAL_EXAM_MANUAL,
  "FX-LOCAL-EXAM-SIN-ASSESSMENT": FX_LOCAL_EXAM_SIN_ASSESSMENT,
  "FX-LOCAL-EXAM-DATOS-INCOMPLETOS": FX_LOCAL_EXAM_DATOS_INCOMPLETOS,
  "FX-LOCAL-EXAM-FECHA-DESCONOCIDA": FX_LOCAL_EXAM_FECHA_DESCONOCIDA,
  "FX-LOCAL-EXAM-MODALIDAD-DESCONOCIDA": FX_LOCAL_EXAM_MODALIDAD_DESCONOCIDA,
  "FX-LOCAL-EXAM-PRACTICO": FX_LOCAL_EXAM_PRACTICO,
  "FX-LOCAL-EXAM-TEORICO": FX_LOCAL_EXAM_TEORICO,
  "FX-LOCAL-EXAM-ORAL": FX_LOCAL_EXAM_ORAL,
  "FX-LOCAL-EXAM-YA-ACTIVA": FX_LOCAL_EXAM_YA_ACTIVA,
  "FX-LOCAL-EXAM-DUPLICADO": FX_LOCAL_EXAM_DUPLICADO,
  "FX-LOCAL-EXAM-VARIAS": FX_LOCAL_EXAM_VARIAS,
  "FX-LOCAL-EXAM-OTRA-MATERIA": FX_LOCAL_EXAM_OTRA_MATERIA,
  "FX-LOCAL-EXAM-FECHA-MODIFICADA": FX_LOCAL_EXAM_FECHA_MODIFICADA,
  "FX-LOCAL-EXAM-CANCELADA": FX_LOCAL_EXAM_CANCELADA,
  "FX-LOCAL-EXAM-PASADA": FX_LOCAL_EXAM_PASADA,
  "FX-LOCAL-EXAM-CONTRADICTORIOS": FX_LOCAL_EXAM_CONTRADICTORIOS,
  "FX-LOCAL-EXAM-NO-DISPONIBLE": FX_LOCAL_EXAM_NO_DISPONIBLE,
  "FX-LOCAL-EXAM-ACTIVACION-COMPLETADA": FX_LOCAL_EXAM_ACTIVACION_COMPLETADA,
  "FX-LOCAL-EXAM-HANDOFF-NO-DISPONIBLE": FX_LOCAL_EXAM_HANDOFF_NO_DISPONIBLE,
  "FX-LOCAL-EXAM-VERIFICANDO": FX_LOCAL_EXAM_VERIFICANDO,
} as const satisfies Record<string, Escenario>;
