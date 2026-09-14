/**
 * Las preguntas del recorrido y las hipótesis de perfil —
 * [ADR-107](../../docs/decisions.md#adr-107), regla `RECORRIDO-v0.1`.
 *
 * **Puro y determinista:** las mismas filas del analítico dan las mismas
 * preguntas, en el mismo orden. Sin I/O, sin reloj, sin copy: devuelve claves y
 * valores, y el Service redacta con `lib/content/es-AR.ts`.
 *
 * ## Tres capas que no se mezclan
 *
 * | Capa | De dónde sale | Dónde vive |
 * |---|---|---|
 * | Hecho histórico | el analítico | `academic_record_entry` |
 * | Explicación declarada | la respuesta | `profile_answer`, append-only |
 * | Hipótesis | las dos anteriores | `profile_hypothesis`, aparte |
 *
 * ⚠️ **Una respuesta nunca reemplaza una nota, y una nota nunca reemplaza la
 * respuesta.** Y ninguna hipótesis afirma causalidad ni etiqueta a la persona:
 * se redacta como *lo que nos contaste* y *lo que figura en tu analítico*.
 *
 * ⚠️ **Los umbrales son provisionales del equipo** (ADR-107 §1). Cambiar uno
 * cambia `VERSION_DE_REGLA`.
 */

import { esAprobacion, type EstadoDeResultado } from "./analitico";

export const VERSION_DE_REGLA = "RECORRIDO-v0.1";

/** Nota desde la que un resultado cuenta como «de tus mejores». Escala 0–10. */
export const NOTA_ALTA = 8;
export const MINIMO_PARA_FORTALEZA = 3;
export const MINIMO_PARA_CALIBRACION = 3;
export const MINIMO_DE_ANIOS_PARA_COMPARAR = 3;
export const PREGUNTAS_OBJETIVO = 3;
export const PREGUNTAS_MAXIMAS = 5;
export const MATERIAS_EN_CALIBRACION = 5;

export type Disparador =
  | "MATERIA_ACTUAL"
  | "RECUPERACION"
  | "PERSISTENCIA"
  | "CAMBIO_DE_PERIODO"
  | "FORTALEZA"
  | "CALIBRACION";

/** Para que el set no sea sólo de dificultades (ADR-107 §1). */
export type TipoDePregunta = "DIFICULTAD" | "FORTALEZA" | "CONTEXTO" | "CALIBRACION";

export const TIPO_DE_DISPARADOR: Readonly<Record<Disparador, TipoDePregunta>> = {
  MATERIA_ACTUAL: "DIFICULTAD",
  RECUPERACION: "DIFICULTAD",
  PERSISTENCIA: "FORTALEZA",
  CAMBIO_DE_PERIODO: "CONTEXTO",
  FORTALEZA: "FORTALEZA",
  CALIBRACION: "CALIBRACION",
};

/** Vocabulario cerrado de opciones, por disparador. `OTRO` abre texto libre. */
export const OPCIONES: Readonly<Record<Disparador, readonly string[]>> = {
  MATERIA_ACTUAL: ["EMPEZAR_ANTES", "MAS_PRACTICA", "PEDIR_AYUDA_ANTES", "ORGANIZAR_TIEMPO", "OTRO"],
  RECUPERACION: ["CAMBIE_METODO", "MAS_TIEMPO", "BUSQUE_AYUDA", "OTRA_CATEDRA", "SITUACION_DISTINTA", "OTRA_MODALIDAD", "EXAMEN_FAVORABLE", "OTRO"],
  PERSISTENCIA: ["TERMINAR_LA_CARRERA", "APOYO_DE_OTROS", "CAMBIE_ESTRATEGIA", "ME_INTERESABA", "OTRO"],
  CAMBIO_DE_PERIODO: ["TRABAJO", "SALUD", "FAMILIA", "MUCHAS_MATERIAS", "CAMBIO_DE_CARRERA", "OTRO"],
  FORTALEZA: ["PRACTICA_FRECUENTE", "ME_GUSTABA", "BUENA_EXPLICACION", "ESTUDIAR_CON_OTROS", "TIEMPO_SUFICIENTE", "OTRO"],
  // Calibración ofrece las materias mismas, más «ninguna».
  CALIBRACION: ["NINGUNA"],
};

/** Un resultado del analítico que sirve para preguntar: vinculado y revisado. */
export interface ResultadoParaPreguntar {
  id: string;
  requisitoId: string;
  materia: string;
  estado: EstadoDeResultado;
  nota: number | null;
  /** `aaaa-mm-dd`, o `null` si no se leyó. */
  fecha: string | null;
}

export interface Pregunta {
  /** Estable: disparador + materias (o año). **No incluye el documento**, así una versión nueva conserva la respuesta si el patrón sigue. */
  clave: string;
  disparador: Disparador;
  tipo: TipoDePregunta;
  /** Los valores con los que se redacta: materias, año. */
  valores: { materias: string[]; anio?: number };
  requisitos: string[];
  resultados: string[];
  /** Las opciones: las de su disparador, o las materias en calibración. */
  opciones: { valor: string; materia?: string }[];
  multiple: boolean;
}

/** Los resultados que cuentan: vinculados y no descartados por el estudiante. */
export function resultadosQueCuentan<T extends { requisitoId: string | null; revision: string }>(filas: readonly T[]): (T & { requisitoId: string })[] {
  return filas.filter(
    (f): f is T & { requisitoId: string } =>
      f.requisitoId !== null && ["AUTO", "CONFIRMED", "CORRECTED"].includes(f.revision),
  );
}

const porFecha = (a: { fecha: string | null }, b: { fecha: string | null }) =>
  (a.fecha ?? "9999").localeCompare(b.fecha ?? "9999");

function intentosPorMateria(resultados: readonly ResultadoParaPreguntar[]) {
  const mapa = new Map<string, ResultadoParaPreguntar[]>();
  for (const r of resultados) mapa.set(r.requisitoId, [...(mapa.get(r.requisitoId) ?? []), r]);
  for (const lista of mapa.values()) lista.sort(porFecha);
  return mapa;
}

const noAprobado = (e: EstadoDeResultado) => e === "FAILED" || e === "ABSENT";

/**
 * Todas las preguntas que los hechos habilitan, **antes** de elegir. Una pregunta
 * sólo existe si hay filas que la sostienen: nunca se pregunta desde el aire.
 */
export function preguntasPosibles(
  resultados: readonly ResultadoParaPreguntar[],
  requisitosCursados: ReadonlySet<string>,
): Pregunta[] {
  const intentos = intentosPorMateria(resultados);
  const preguntas: Pregunta[] = [];
  const materiasOrdenadas = [...intentos.entries()].sort(([, a], [, b]) =>
    (b.at(-1)?.fecha ?? "").localeCompare(a.at(-1)?.fecha ?? "") || a[0].materia.localeCompare(b[0].materia),
  );

  const unaMateria = (disparador: Disparador, lista: ResultadoParaPreguntar[]): Pregunta => ({
    clave: `${disparador}:${lista[0].requisitoId}`,
    disparador,
    tipo: TIPO_DE_DISPARADOR[disparador],
    valores: { materias: [lista[0].materia] },
    requisitos: [lista[0].requisitoId],
    resultados: lista.map((r) => r.id),
    opciones: OPCIONES[disparador].map((valor) => ({ valor })),
    multiple: true,
  });

  for (const [requisitoId, lista] of materiasOrdenadas) {
    const tuvoTropiezo = lista.some((r) => noAprobado(r.estado));
    const aprobada = lista.some((r) => esAprobacion(r.estado));
    const ultima = lista.at(-1)!;

    if (requisitosCursados.has(requisitoId) && tuvoTropiezo) {
      preguntas.push(unaMateria("MATERIA_ACTUAL", lista));
      continue;
    }
    if (aprobada && esAprobacion(ultima.estado) && lista.length >= 3 && lista.slice(0, -1).every((r) => noAprobado(r.estado))) {
      preguntas.push(unaMateria("PERSISTENCIA", lista));
      continue;
    }
    if (lista.length === 2 && noAprobado(lista[0].estado) && esAprobacion(lista[1].estado)) {
      preguntas.push(unaMateria("RECUPERACION", lista));
    }
  }

  // Un año con la mitad o menos de aprobaciones que la mediana de los demás.
  const porAnio = new Map<number, number>();
  for (const r of resultados) {
    if (!r.fecha || !esAprobacion(r.estado)) continue;
    const anio = Number(r.fecha.slice(0, 4));
    porAnio.set(anio, (porAnio.get(anio) ?? 0) + 1);
  }
  if (porAnio.size >= MINIMO_DE_ANIOS_PARA_COMPARAR) {
    const anios = [...porAnio.keys()].sort((a, b) => a - b);
    // El año en curso de la historia no se compara: puede estar a medias.
    const comparables = anios.slice(0, -1);
    for (const anio of comparables) {
      const otros = anios.filter((a) => a !== anio).map((a) => porAnio.get(a)!).sort((a, b) => a - b);
      const mediana = otros.length % 2 ? otros[(otros.length - 1) / 2] : (otros[otros.length / 2 - 1] + otros[otros.length / 2]) / 2;
      if (porAnio.get(anio)! <= mediana / 2) {
        preguntas.push({
          clave: `CAMBIO_DE_PERIODO:${anio}`,
          disparador: "CAMBIO_DE_PERIODO",
          tipo: "CONTEXTO",
          valores: { materias: [], anio },
          requisitos: [],
          resultados: resultados.filter((r) => r.fecha?.startsWith(String(anio))).map((r) => r.id),
          opciones: OPCIONES.CAMBIO_DE_PERIODO.map((valor) => ({ valor })),
          multiple: true,
        });
        break;
      }
    }
  }

  // Última aprobación con nota de cada materia.
  const aprobadasConNota = [...intentos.values()]
    .map((lista) => [...lista].reverse().find((r) => esAprobacion(r.estado) && r.nota !== null))
    .filter((r): r is ResultadoParaPreguntar => r !== undefined);

  const altas = aprobadasConNota
    .filter((r) => (r.nota ?? 0) >= NOTA_ALTA)
    .sort((a, b) => (b.nota ?? 0) - (a.nota ?? 0) || (b.fecha ?? "").localeCompare(a.fecha ?? "") || a.materia.localeCompare(b.materia));
  if (altas.length >= MINIMO_PARA_FORTALEZA) {
    const tres = altas.slice(0, 3);
    preguntas.push({
      clave: `FORTALEZA:${tres.map((r) => r.requisitoId).sort().join(",")}`,
      disparador: "FORTALEZA",
      tipo: "FORTALEZA",
      valores: { materias: tres.map((r) => r.materia) },
      requisitos: tres.map((r) => r.requisitoId),
      resultados: tres.map((r) => r.id),
      opciones: OPCIONES.FORTALEZA.map((valor) => ({ valor })),
      multiple: true,
    });
  }

  if (aprobadasConNota.length >= MINIMO_PARA_CALIBRACION) {
    const recientes = [...aprobadasConNota]
      .sort((a, b) => (b.fecha ?? "").localeCompare(a.fecha ?? "") || a.materia.localeCompare(b.materia))
      .slice(0, MATERIAS_EN_CALIBRACION);
    preguntas.push({
      clave: `CALIBRACION:${recientes.map((r) => r.requisitoId).sort().join(",")}`,
      disparador: "CALIBRACION",
      tipo: "CALIBRACION",
      valores: { materias: recientes.map((r) => r.materia) },
      requisitos: recientes.map((r) => r.requisitoId),
      resultados: recientes.map((r) => r.id),
      opciones: [...recientes.map((r) => ({ valor: r.requisitoId, materia: r.materia })), { valor: "NINGUNA" }],
      multiple: true,
    });
  }

  return preguntas;
}

const PRIORIDAD: readonly Disparador[] = [
  "MATERIA_ACTUAL",
  "RECUPERACION",
  "PERSISTENCIA",
  "CAMBIO_DE_PERIODO",
  "FORTALEZA",
  "CALIBRACION",
];

/**
 * Las que se hacen: **objetivo 3, máximo 5** (ADR-107 §1).
 *
 * 1. Por prioridad, y dentro de cada disparador en el orden en que llegaron.
 * 2. **Una por disparador** hasta completar el objetivo: el set no puede ser tres
 *    recuperaciones seguidas.
 * 3. **Una materia no se pregunta dos veces.**
 * 4. **Si existe una de fortaleza o calibración, al menos una entra**: se
 *    reemplaza la última de dificultad.
 */
export function elegirPreguntas(posibles: readonly Pregunta[], maximo: number = PREGUNTAS_OBJETIVO): Pregunta[] {
  const tope = Math.min(Math.max(maximo, 1), PREGUNTAS_MAXIMAS);
  const ordenadas = [...posibles].sort((a, b) => PRIORIDAD.indexOf(a.disparador) - PRIORIDAD.indexOf(b.disparador));
  const elegidas: Pregunta[] = [];
  const materiasUsadas = new Set<string>();
  const pisa = (p: Pregunta) => p.disparador !== "CALIBRACION" && p.requisitos.some((r) => materiasUsadas.has(r));

  const tomar = (p: Pregunta) => {
    elegidas.push(p);
    if (p.disparador !== "CALIBRACION") p.requisitos.forEach((r) => materiasUsadas.add(r));
  };

  // Primera pasada: una por disparador.
  for (const d of PRIORIDAD) {
    if (elegidas.length >= tope) break;
    const p = ordenadas.find((x) => x.disparador === d && !pisa(x));
    if (p) tomar(p);
  }
  // Segunda pasada: el resto, si el tope lo permite.
  for (const p of ordenadas) {
    if (elegidas.length >= tope) break;
    if (!elegidas.includes(p) && !pisa(p)) tomar(p);
  }

  const esPositiva = (p: Pregunta) => p.tipo === "FORTALEZA" || p.tipo === "CALIBRACION";
  if (!elegidas.some(esPositiva)) {
    const positiva = ordenadas.find((p) => esPositiva(p) && !pisa(p));
    if (positiva) {
      if (elegidas.length >= tope) elegidas.pop();
      elegidas.push(positiva);
    }
  }
  return elegidas;
}

// ── Las respuestas y lo que se deriva ────────────────────────────────────────

export type EstadoDeRespuesta = "ANSWERED" | "UNSURE" | "PREFER_NOT_TO_SAY" | "SKIPPED";

export const LARGO_MAXIMO_DE_TEXTO = 1000;

export interface Respuesta {
  clave: string;
  estado: EstadoDeRespuesta;
  opciones: string[];
  texto: string | null;
}

/** `null` ⇒ válida. Saltear, no saber o no querer son respuestas completas. */
export function motivoDeRespuestaInvalida(pregunta: Pregunta, r: Respuesta): string | null {
  if (!["ANSWERED", "UNSURE", "PREFER_NOT_TO_SAY", "SKIPPED"].includes(r.estado)) return "estado desconocido";
  if ((r.texto ?? "").length > LARGO_MAXIMO_DE_TEXTO) return "el texto es demasiado largo";
  if (r.estado !== "ANSWERED") {
    return r.opciones.length === 0 && !r.texto ? null : "sin responder no lleva opciones ni texto";
  }
  const validas = new Set(pregunta.opciones.map((o) => o.valor));
  if (r.opciones.some((o) => !validas.has(o))) return "una opción no es de esta pregunta";
  if (r.opciones.length === 0 && !(r.texto ?? "").trim()) return "elegí al menos una opción o escribí algo";
  if (r.opciones.includes("NINGUNA") && r.opciones.length > 1) return "«ninguna» no va con otras";
  return null;
}

export type Dimension =
  | "ESTRATEGIA_QUE_FUNCIONO"
  | "ESTRATEGIA_A_PROBAR"
  | "OBSTACULO_DECLARADO"
  | "ACTIVADOR_PERSONAL"
  | "SENSIBILIDAD_A_MODALIDAD"
  | "CALIBRACION_NOTA"
  | "FORTALEZA_HISTORICA"
  | "RECUPERACION"
  | "PERSISTENCIA"
  | "CONTEXTO";

export type TipoDeEvidencia = "HISTORICO" | "DECLARADO" | "HISTORICO_Y_DECLARADO";

export interface HipotesisDerivada {
  dimension: Dimension;
  /** La clave de copy con la que se redacta, y sus valores. */
  plantilla: string;
  valores: Record<string, string | number>;
  evidencia: TipoDeEvidencia;
  /** **Nunca `ALTA` desde el onboarding** (ADR-107 §4). */
  confianza: "BAJA" | "MEDIA";
  requisitos: string[];
}

/** Qué dimensión afirma cada opción. Una opción ausente no produce hipótesis. */
const DIMENSION_DE_OPCION: Readonly<Record<Disparador, Readonly<Record<string, Dimension>>>> = {
  MATERIA_ACTUAL: { EMPEZAR_ANTES: "ESTRATEGIA_A_PROBAR", MAS_PRACTICA: "ESTRATEGIA_A_PROBAR", PEDIR_AYUDA_ANTES: "ESTRATEGIA_A_PROBAR", ORGANIZAR_TIEMPO: "ESTRATEGIA_A_PROBAR" },
  RECUPERACION: {
    CAMBIE_METODO: "ESTRATEGIA_QUE_FUNCIONO",
    MAS_TIEMPO: "ESTRATEGIA_QUE_FUNCIONO",
    BUSQUE_AYUDA: "ESTRATEGIA_QUE_FUNCIONO",
    OTRA_CATEDRA: "CONTEXTO",
    SITUACION_DISTINTA: "OBSTACULO_DECLARADO",
    OTRA_MODALIDAD: "SENSIBILIDAD_A_MODALIDAD",
    // «El segundo examen me resultó más favorable» es circunstancial: no se
    // convierte en una hipótesis sobre la persona.
  },
  PERSISTENCIA: { TERMINAR_LA_CARRERA: "ACTIVADOR_PERSONAL", APOYO_DE_OTROS: "ACTIVADOR_PERSONAL", CAMBIE_ESTRATEGIA: "ESTRATEGIA_QUE_FUNCIONO", ME_INTERESABA: "ACTIVADOR_PERSONAL" },
  CAMBIO_DE_PERIODO: { TRABAJO: "OBSTACULO_DECLARADO", SALUD: "OBSTACULO_DECLARADO", FAMILIA: "OBSTACULO_DECLARADO", MUCHAS_MATERIAS: "OBSTACULO_DECLARADO", CAMBIO_DE_CARRERA: "CONTEXTO" },
  FORTALEZA: { PRACTICA_FRECUENTE: "ESTRATEGIA_QUE_FUNCIONO", ME_GUSTABA: "ACTIVADOR_PERSONAL", BUENA_EXPLICACION: "CONTEXTO", ESTUDIAR_CON_OTROS: "ESTRATEGIA_QUE_FUNCIONO", TIEMPO_SUFICIENTE: "ESTRATEGIA_QUE_FUNCIONO" },
  CALIBRACION: {},
};

const HECHO_DE_DISPARADOR: Partial<Record<Disparador, Dimension>> = {
  RECUPERACION: "RECUPERACION",
  PERSISTENCIA: "PERSISTENCIA",
  FORTALEZA: "FORTALEZA_HISTORICA",
};

const lista = (materias: readonly string[]) =>
  materias.length <= 1 ? (materias[0] ?? "") : `${materias.slice(0, -1).join(", ")} y ${materias.at(-1)}`;

/**
 * Las hipótesis que salen de una respuesta.
 *
 * - **Respondida**: una por opción con dimensión, `HISTORICO_Y_DECLARADO`, `MEDIA`.
 *   El texto libre **no** se convierte en hipótesis: se conserva como lo escribió.
 * - **No sé o salteada**: sólo el hecho del analítico, si lo hay, `HISTORICO`, `BAJA`.
 * - **Prefiero no responder**: **ninguna**. No querer contar algo no es un dato.
 */
export function hipotesisDeRespuesta(pregunta: Pregunta, r: Respuesta): HipotesisDerivada[] {
  const base = { requisitos: pregunta.requisitos };
  const materias = lista(pregunta.valores.materias);

  if (r.estado === "PREFER_NOT_TO_SAY") return [];

  if (r.estado !== "ANSWERED") {
    const dim = HECHO_DE_DISPARADOR[pregunta.disparador];
    return dim
      ? [{ ...base, dimension: dim, plantilla: `PERFIL.HECHO.${pregunta.disparador}`, valores: { materias }, evidencia: "HISTORICO", confianza: "BAJA" }]
      : [];
  }

  if (pregunta.disparador === "CALIBRACION") {
    if (r.opciones.includes("NINGUNA")) {
      return [{ ...base, dimension: "CALIBRACION_NOTA", plantilla: "PERFIL.CALIBRACION_NINGUNA", valores: { materias }, evidencia: "HISTORICO_Y_DECLARADO", confianza: "MEDIA" }];
    }
    const elegidas = pregunta.opciones.filter((o) => o.materia && r.opciones.includes(o.valor));
    return elegidas.length === 0
      ? []
      : [{
          dimension: "CALIBRACION_NOTA",
          plantilla: "PERFIL.CALIBRACION_SI",
          valores: { materias: lista(elegidas.map((o) => o.materia!)) },
          evidencia: "HISTORICO_Y_DECLARADO",
          confianza: "MEDIA",
          requisitos: elegidas.map((o) => o.valor),
        }];
  }

  return r.opciones.flatMap<HipotesisDerivada>((opcion) => {
    const dimension = DIMENSION_DE_OPCION[pregunta.disparador][opcion];
    if (!dimension) return [];
    return [{
      ...base,
      dimension,
      plantilla: `PERFIL.${pregunta.disparador}.${opcion}`,
      valores: { materias, anio: pregunta.valores.anio ?? "" },
      evidencia: "HISTORICO_Y_DECLARADO",
      confianza: "MEDIA",
    }];
  });
}

// ── Lo que ve `/recorrido` ───────────────────────────────────────────────────

export interface PreguntaVisible {
  clave: string;
  disparador: Disparador;
  texto: string;
  multiple: boolean;
  opciones: { valor: string; etiqueta: string }[];
  /** La última respuesta, si la hay. */
  respuesta: { estado: EstadoDeRespuesta; opciones: string[]; textoLibre: string | null } | null;
}

export type EstadoDeHipotesis = "VIGENTE" | "RECHAZADA" | "SIN_VIGENCIA";

export interface HipotesisVisible {
  id: string;
  enunciado: string;
  dimension: Dimension;
  confianza: "BAJA" | "MEDIA";
  evidencia: TipoDeEvidencia;
  estado: EstadoDeHipotesis;
}

export interface PerfilVisible {
  preguntas: PreguntaVisible[];
  hipotesis: HipotesisVisible[];
}

/**
 * ADR-107 §6: una hipótesis está vigente si **no fue rechazada** y su pregunta
 * **sigue saliendo** del analítico de hoy. Se deduce; no se escribe.
 */
export function estadoDeHipotesis(
  h: { estado: "VIGENTE" | "RECHAZADA"; clave: string },
  clavesVigentes: ReadonlySet<string>,
): EstadoDeHipotesis {
  if (h.estado === "RECHAZADA") return "RECHAZADA";
  return clavesVigentes.has(h.clave) ? "VIGENTE" : "SIN_VIGENCIA";
}
