import { selectHeroLevel, type HeroInput } from "@/lib/domain/precedence";
import { minutosPorTema, type SesionDeClase, type TipoDeClase } from "@/lib/domain/duracion";
import { ejeDelPeriodo, marcasDelEje, posicionEnEje } from "@/lib/domain/ventana";
import {
  coberturaDeMateria,
  porcentajeDeHoras,
  type Cobertura,
  type EstadoDeUnidad,
} from "@/lib/domain/cobertura";
import { nombreDeDia, t } from "@/lib/content/es-AR";
import {
  provenanceVisible,
  type SourceType,
  type VerificationStatus,
} from "@/lib/content/provenance";
import { aEntradaVisible, type HechoPersistido } from "./hechos";
import { fechaDeCalendario, haceCuanto } from "./tiempo";
import type { FilaDato, GanttProjection, MateriaProps } from "@/lib/domain/view-models";

/**
 * `UX02` proyectada desde datos persistidos — Etapa B2.6.
 *
 * **La pantalla no cambia.** Recibe el mismo `MateriaProps` que le daba el
 * fixture; lo único distinto es de dónde salen los datos.
 *
 * ## Lo que esta proyección se niega a decir
 *
 * Tres cosas, y las tres por el mismo motivo: existe el dato crudo y **no
 * existe la semántica aprobada** para convertirlo en una afirmación.
 *
 * 1. **Ningún número de progreso.** `topic_progress.*_value` es `NUMERIC` sin
 *    unidad ni escala (`C01-019`, gate `H`). `VI.2` §8.6 autoriza exactamente
 *    esta salida: *"si no existe semántica aprobada para mostrar una dimensión,
 *    omite la síntesis o muestra un hecho comprensible; nunca expone un valor
 *    interno bruto"*. Mostrar `12` no dice nada; escribir *"12 ejercicios"*
 *    inventa la unidad.
 * 2. **Ninguna brecha entre confianza y dominio.** `VI.2` §8.4: *"sólo aparece
 *    si Student/Risk Model entrega la brecha derivada y su explicación; **la
 *    vista no compara umbrales**"*. `C01-043` está `OPEN`. Las dos dimensiones
 *    se muestran separadas y **nadie las compara**.
 * 3. **Ningún estado de materia.** Sin Risk Engine (Fase B6) nadie la evaluó.
 *
 * El resultado es una materia que dice menos que el fixture. Es lo correcto: el
 * fixture **declara** un mundo, y acá hay uno real del que todavía sabemos poco.
 */

/** Estado de una dimensión, tal como lo guarda `topic_progress`. */
type EstadoDimension = "value" | "not_evaluated" | "no_information" | null;

export interface UnidadPersistida {
  id: string;
  codigo: string | null;
  nombre: string;
  ultimoAvanceEn: string | null;
  /**
   * Las dos puntas que ubican al tema en el calendario —
   * [ADR-085](../../../docs/decisions.md#adr-085). **Son hechos**: la primera
   * clase que lo dictó (`class_session_topic`) y la evaluación que declara
   * cubrirlo (`assessment_topic`). `null` ⇒ el dato no existe, y el tema **no
   * se ubica en el eje**.
   */
  primeraClaseEn: string | null;
  ultimaClaseEn: string | null;
  evaluaEn: string | null;
  dominio: EstadoDimension;
  practica: EstadoDimension;
  recorrido: EstadoDimension;
  /** El peso declarado. `null` = no declarado, **no `1.0`**. */
  peso: number | null;
  /**
   * En qué estado está la evidencia de este tema — cuatro valores, no un
   * booleano ([ADR-075](../../../docs/decisions.md#adr-075) §C2).
   * **Es un hecho, no una estimación.**
   */
  evidencia: EstadoDeUnidad;
}

/** Una sesión del libro de temas, cruda. El reparto lo hace `lib/domain/duracion.ts`. */
export interface ClasePersistida {
  minutos: number | null;
  tipo: TipoDeClase | null;
  temas: string[];
}

/** Conteos por dimensión. **Conteo de un hecho, nunca un promedio.** */
export interface DimensionesPersistidas {
  unidades: number;
  dominioMedido: number;
  dominioNoEval: number;
  practicaMedida: number;
  recorridoMedido: number;
  /** Cuándo se declaró la confianza más reciente. El valor no viaja. */
  confianzaEn: string | null;
}

/**
 * Un bloque del horario de cursado, tal como lo devuelve `estado_de_materia`.
 *
 * `origen` viaja **rotulado y sin fusionarse** (`P-08`): lo que publica la
 * cátedra y lo que declaró el estudiante son dos fuentes, y una no se convierte
 * en la otra (AGENTS.md §2.6).
 */
export interface BloqueDeCursado {
  /** `0`–`6`, domingo a sábado. La misma escala que `availability`. */
  dia: number;
  /** `HH:MM:SS`, como lo entrega Postgres. La proyección lo recorta. */
  desde: string;
  hasta: string;
  origen: "catedra" | "vos";
  fuente: SourceType | null;
  verificacion: VerificationStatus | null;
}

export interface EstadoDeMateria {
  instante: string;
  zona: string;
  cursadaId: string;
  /** Cuántas entregas lleva la cursada. **Un conteo de hechos**, no una medida. */
  evidenciasEnviadas: number;
  /**
   * El horario semanal de cursado — [ADR-063](../../../docs/decisions.md#adr-063).
   *
   * **No es `clases`.** `clases` son las **dictadas**, con su fecha, y alimentan
   * la duración por tema; esto es **la regla semanal**. Derivar la segunda desde
   * las primeras sería inferencia presentada como horario de la institución.
   */
  horario: readonly BloqueDeCursado[];
  materia: string;
  examen: {
    titulo: string;
    fechaEn: string | null;
    /** Como los declaró la fuente. `null` **no se completa**: una evaluación
     * sin modalidad declarada no es «escrita por defecto». */
    tipo: string | null;
    modalidad: string | null;
  } | null;
  accion: {
    status: string;
    objetivo: string;
    unidad: string | null;
    razon: string | null;
    minutosMin: number | null;
    minutosMax: number | null;
    evidenciaEsperada: string | null;
    criterioCierre: string | null;
    bloqueoRazon: string | null;
  } | null;
  compromiso: { state: string } | null;
  rescatePendiente: boolean;
  evidencia: "NONE" | "ENVIADA" | "VALIDADA";
  contextoIncompleto: boolean;
  /**
   * Qué parte del contenido la declaró la cátedra · ADR-086.
   *
   * `"estimado"` — lo generó Achieve entero, unidades incluidas.
   * `"calendario_estimado"` — las unidades salieron del programa oficial; las
   * fechas y los pesos los puso Achieve.
   * `null` — no hay nada que advertir.
   *
   * ⚠️ **`null` no significa «verificado»**, significa que ninguna fila dice
   * `inference`. La verificación es otra pregunta y otra columna.
   */
  contenido: "estimado" | "calendario_estimado" | null;
  ultimoAvanceEn: string | null;
  unidades: UnidadPersistida[];
  /** Los insumos de la duración. La función de base **no** reparte (ADR-068). */
  clases: ClasePersistida[];
  cargaDeclarada: { minutos: number; texto: string } | null;
  dimensiones: DimensionesPersistidas | null;
  /** Los últimos hechos de la cursada. Los arma `hechos_de_cursada()`. */
  actividadReciente: HechoPersistido[];
}

export interface RepositorioDeMateria {
  estadoDeMateria(
    institutionId: string,
    studentId: string,
    ahora: string,
    courseEnrollmentId?: string | null,
  ): Promise<EstadoDeMateria | null>;
}

/** Las mismas seis entradas de la matriz que usa `UX01`. Una sola precedencia. */
function aEntradaDeHero(e: EstadoDeMateria): HeroInput {
  const s = e.accion?.status;
  return {
    action:
      s === "IN_PROGRESS" ? "IN_PROGRESS" : s === "EVIDENCE_PENDING" ? "EVIDENCE_PENDING" : "NONE",
    commitment:
      e.compromiso?.state === "MISSED"
        ? "MISSED"
        : e.compromiso?.state === "DUE" || e.compromiso?.state === "STARTED"
          ? "STARTABLE"
          : e.compromiso?.state === "CONFIRMED"
            ? "PROXIMO"
            : "NONE",
    rescate: e.rescatePendiente ? "REQUIRED" : "NONE",
    actionRecommended: s === "RECOMMENDED",
    contextIncomplete: e.contextoIncompleto,
    evidenciaInformativa: e.evidencia,
  };
}

/**
 * Las cinco dimensiones, cada una como **hecho o ausencia tipada**.
 *
 * Una dimensión medida **se omite**: existe el número y no existe la unidad en
 * la que expresarlo (`C01-019`). Omitirla es la regla del repositorio —*omitir,
 * no inventar*— y deja la fila lista para cuando `C01-019` cierre.
 */
function dimensionesDe(e: EstadoDeMateria): FilaDato[] {
  const d = e.dimensiones;
  if (!d || d.unidades === 0) return [];

  const filas: FilaDato[] = [];
  const ausencia = (label: string, medidas: number, hay: number) => {
    if (medidas > 0) return; // hay dato y no hay unidad: se omite la fila
    filas.push({
      label,
      valor: hay > 0 ? t("DIMENSION.NO_EVALUADO") : t("DIMENSION.SIN_INFORMACION"),
      ausencia: "SIN_ASIGNAR",
    });
  };

  ausencia(t("DIMENSION.RECORRIDO"), d.recorridoMedido, 0);
  ausencia(t("DIMENSION.PRACTICA"), d.practicaMedida, 0);
  // Dominio distingue las dos ausencias: "no evaluado" es que existe el eje y
  // nadie lo midió; "sin información" es que ni siquiera hay con qué mirarlo.
  ausencia(t("DIMENSION.DOMINIO"), d.dominioMedido, d.dominioNoEval);

  // La confianza viaja **sólo con su fecha**, nunca con su nivel: convertir
  // `0.8` en "alta" sería fijar un umbral, que es lo que la spec prohíbe.
  if (d.confianzaEn) {
    filas.push({
      label: t("DIMENSION.CONFIANZA"),
      valor: `declarada ${haceCuanto(d.confianzaEn, e.instante, e.zona)}`,
    });
  }

  filas.push(
    e.ultimoAvanceEn
      ? { label: t("DIMENSION.RECENCIA"), valor: haceCuanto(e.ultimoAvanceEn, e.instante, e.zona) }
      : { label: t("DIMENSION.RECENCIA"), valor: t("COMUN.SIN_AVANCE"), ausencia: "SIN_ASIGNAR" },
  );

  return filas;
}


/**
 * `CLASES DE LA SEMANA` — [ADR-063](../../../docs/decisions.md#adr-063), con la
 * decisión del owner encima: **«solo mostrar, no agendar»**.
 *
 * Por eso proyecta **el hecho y su procedencia**, y nada más: ni una acción, ni
 * un hueco reservado, ni una resta al presupuesto de estudio. Un bloque de clase
 * dice cuándo está cursando; `availability` dice cuándo puede estudiar, y ADR-063
 * es explícito en que **no se mezclan**.
 *
 * `null` ⇒ **no se sabe el horario**, y la sección no se dibuja vacía. Que no se
 * sepa no es que tenga la semana libre: es que nadie lo cargó.
 */
function clasesDeLaSemanaDe(e: EstadoDeMateria): MateriaProps["clasesDeLaSemana"] {
  const bloques = e.horario
    .map((b) => {
      const dia = nombreDeDia(b.dia);
      // Un día que no nombra ningún día no se muestra como uno cualquiera.
      if (dia === null) return null;
      return {
        cuando: `${dia} ${hhmm(b.desde)}–${hhmm(b.hasta)}`,
        // La procedencia **no se eleva**: que la fuente sea la institución no
        // vuelve el dato verificado. Sin los dos campos, la frase de «no
        // disponible» — que es lo que `provenanceVisible` ya decide (`I9`).
        procedencia: provenanceVisible(b.fuente, b.verificacion),
      };
    })
    .filter((x) => x !== null);

  return bloques.length > 0 ? bloques : null;
}

/** `18:00:00` → `18:00`. Postgres entrega `TIME` con segundos; nadie los lee. */
function hhmm(hora: string): string {
  return hora.slice(0, 5);
}

/**
 * Las últimas entradas, ya traducidas. `null` ⇒ **no pasó nada todavía**, y la
 * sección no se dibuja vacía: un encabezado sobre una lista sin filas es peor
 * que no tener la sección.
 */
function actividadDe(e: EstadoDeMateria): MateriaProps["actividadReciente"] {
  const entradas = e.actividadReciente
    .map((h) => aEntradaVisible(h, e.zona))
    .filter((x) => x !== null);
  return entradas.length > 0 ? entradas : null;
}

export function proyectarMateria(e: EstadoDeMateria): MateriaProps {
  const { nivel, variante } = selectHeroLevel(aEntradaDeHero(e));
  const dimensiones = dimensionesDe(e);
  const actividad = actividadDe(e);

  const tiempoOEstado =
    e.accion?.status === "IN_PROGRESS"
      ? "En curso"
      : e.accion?.minutosMax
        ? `${e.accion.minutosMax} min`
        : null;

  return {
    // `CONFIANZA_VS_DOMINIO` no se deriva acá: la brecha la entrega el Student
    // Model (`C01-043`, `OPEN`) o no existe.
    estado: e.contextoIncompleto
      ? "CONTEXTO_INCOMPLETO"
      : e.accion
        ? "NORMAL"
        : "SIN_RECOMENDACION",
    // Qué cursada es. No se muestra: lo lleva `CTA-009` para abrir la Bitácora
    // de **esta** materia. Ver `MateriaProps.cursadaId`.
    cursadaId: e.cursadaId,
    materia: e.materia,
    // Una evaluación sin fecha conserva su título: la fecha desconocida no se
    // estima, y el título sigue siendo un hecho.
    //
    // `assessment_date` es un `DATE`, no un instante: se formatea sin zona. Con
    // `fechaCorta` mostraba el día anterior en cualquier zona al oeste de UTC —
    // un Parcial del 15 aparecía como del 14.
    evaluacion: e.examen
      ? {
          titulo: e.examen.fechaEn
            ? `${e.examen.titulo} · ${fechaDeCalendario(e.examen.fechaEn)}`
            : e.examen.titulo,
          detalle: detalleDeEvaluacion(e),
        }
      : null,
    /*
      `CTA-019` — la entrada manual a Modo Examen desde la materia (ADR-016).

      Aparece **sólo si hay una evaluación registrada**: sin `Assessment` no hay
      qué activar, y ofrecerlo llevaría a una pantalla que dice que no hay nada.
      Es la condición de aparición del registro canónico, no una invención.
    */
    modoExamen: e.examen ? t("MATERIA.MODO_EXAMEN") : null,
    // Sin Risk Engine no hay estado de materia. Ver `MateriaProps.chip`.
    chip: null,
    ultimoAvance: e.ultimoAvanceEn
      ? `avance ${haceCuanto(e.ultimoAvanceEn, e.instante, e.zona)}`
      : null,
    hero: {
      nivel,
      variante,
      contexto: e.accion?.unidad ?? null,
      titulo: e.accion?.objetivo ?? null,
      razon: e.accion?.razon ?? null,
      tiempoOEstado,
      evidenciaEsperada: e.accion?.evidenciaEsperada ?? null,
      queSigue: null,
      chip: null,
    },
    // `class_event_record` existe como tabla, pero cómo se captura, se corrige y
    // se versiona un reporte de clase es `C01-004`, `OPEN`. Sin eso, las dos
    // columnas no se pueden rotular con su provenance, y `P-08` exige que la
    // lleven. Se omite entera antes que mostrarla sin fuente.
    catedraYVos: null,
    // ⚠️ **Sin unidades no hay Gantt, y no se dibuja uno vacío.** El mensaje de
    // esa ausencia ya lo da el hero con `CONTEXTO_INCOMPLETO`; repetirlo abajo
    // con una barra en blanco diría dos veces lo mismo y una de las dos parecería
    // un error de carga.
    gantt: e.unidades.length > 0 ? aGantt(e) : null,
    dimensiones,
    // La misma traducción que la Bitácora, y por eso la misma función: si cada
    // superficie tradujera por su cuenta, la preview y el historial dirían cosas
    // distintas del mismo hecho.
    // El horario de cursado. **Solo mostrar** — ver `clasesDeLaSemanaDe`.
    clasesDeLaSemana: clasesDeLaSemanaDe(e),
    actividadReciente: actividad,
    // `CTA-009` aparece **si hay historial que abrir**. La preview y la Bitácora
    // salen del mismo `hechos_de_cursada()` y de la misma traducción: sin
    // entradas visibles acá, `UX06` tampoco tiene ninguna. Ver `verRegistro`.
    verRegistro: actividad ? t("CTA.VER_AVANCE") : null,
    // El aviso explica una ausencia; no la disfraza.
    //
    // ⚠️ **La procedencia del contenido va primero** · ADR-086. Un temario que
    // inventó el sistema, mostrado sin decirlo, es `A-01` —*dato roto
    // presentado como transparencia*—: el estudiante planifica su cursada sobre
    // unidades que su cátedra nunca publicó. Es peor que cualquiera de las
    // ausencias de abajo, así que gana el lugar.
    aviso: e.contextoIncompleto
      ? null // el hero ya lo dice: no se repite el mismo hecho dos veces
      : e.contenido === "estimado"
        ? t("MATERIA.CONTENIDO_ESTIMADO")
        : e.contenido === "calendario_estimado"
          ? t("MATERIA.CALENDARIO_ESTIMADO")
          : dimensiones.length > 0 && dimensiones.every((f) => f.ausencia)
            ? t("MATERIA.SIN_SEMANTICA")
            : null,
    // La captura de clase escribe en `class_event_record`: misma razón que
    // `catedraYVos`. No se ofrece una acción cuyo contrato no está cerrado.
    capturaDeClase: null,
  };
}

/**
 * **El Gantt de la materia** — [ADR-072](../../../docs/decisions.md#adr-072).
 *
 * Junta las dos derivaciones: `duracion.ts` dice cuánto lleva cada tema, y
 * `cobertura.ts` dice cuánto de eso tiene evidencia enviada.
 *
 * ## Por qué esto vive acá y no en SQL
 *
 * [ADR-068](../../../docs/decisions.md#adr-068): el reparto de minutos y la
 * reconciliación son reglas de producto que van a cambiar, y viajan con la
 * versión que las produjo. La función de base entrega **hechos** —cuánto duró
 * cada sesión, qué temas cubrió, si hay evidencia— y nada más.
 *
 * ## Lo que devuelve cuando no puede
 *
 * `barra: null` y `pie` con el motivo. **No devuelve cero**: una barra vacía por
 * falta de datos y una por falta de trabajo no se dibujan igual.
 */
export interface GanttDeMateria {
  /** Las unidades **en el orden dictado**, con sus minutos si se conocen. */
  unidades: Array<{
    id: string;
    nombre: string;
    minutos: number | null;
    estado: EstadoDeUnidad;
  }>;
  /** `0..100`, ya redondeado. `null` ⇒ no se dibuja barra. */
  barra: number | null;
  /** El texto de abajo de la barra. Siempre hay uno. */
  pie: string;
  /** Entregas que no alcanzaron. `0` ⇒ **la línea no se dibuja**. */
  enRevision: number;
  /** Temas que alcanzaron el criterio. Siempre `≤` los que tienen actividad. */
  criterioAlcanzado: number;
  /** La nota al pie del owner, literal. `null` cuando no hay barra que aclarar. */
  aclaracion: string | null;
  cobertura: Cobertura;
}

/** La nota al pie, textual del Product Owner. No se reescribe. */
/**
 * La aclaración, **reescrita por la psicopedagoga** (ADR-075 §C1).
 *
 * La versión anterior era del Product Owner —*"temas marcados por vos sobre el
 * total cargado. No es una nota ni una predicción"*— y ella la objetó: no
 * alcanza con negar que sea una nota, hay que decir **qué sí mide**.
 */
export const ACLARACION_DE_COBERTURA =
  "Esto muestra trabajo registrado. No mide comprensión, no es una nota y no predice el resultado.";

/**
 * El pie de la barra, **uno solo para las dos superficies** —`UX02` y el índice
 * de materias ([ADR-077](../../../docs/decisions.md#adr-077))—.
 *
 * ⚠️ **Vive acá y se importa, en vez de copiarse.** Este texto ya cambió una vez
 * por revisión clínica ([ADR-075](../../../docs/decisions.md#adr-075) §C1: *"un
 * porcentaje grande junto a una barra suele adquirir significado evaluativo
 * aunque el texto inferior lo niegue"*) y va a volver a cambiar. Dos copias
 * significan que la próxima revisión arregla una pantalla y deja la otra
 * afirmando lo que la psicopedagoga objetó.
 *
 * **El pie siempre dice algo verdadero.** Con barra, los dos números —y no
 * coinciden a propósito: la ponderación por horas es el motivo de que existan
 * los dos—. Sin barra, el conteo solo, que sigue siendo un hecho.
 */
export function textoDeCobertura(cobertura: Cobertura, totalDeTemas: number): string {
  const barra = porcentajeDeHoras(cobertura);
  const trabajados = cobertura.temasTrabajados;
  if (barra !== null) {
    return `${trabajados} de ${totalDeTemas} temas tiene alguna evidencia · ${barra}% del tiempo estimado tiene evidencia asociada`;
  }
  // ⚠️ **Los dos vacíos NO se dicen igual** ([ADR-072](../../../docs/decisions.md#adr-072) §4).
  // Sin temas no hay nada que contar; sin minutos hay temas y falta el tiempo.
  if (cobertura.estado === "SIN_DATOS" && cobertura.motivo === "sin_temas_declarados") {
    return "sin temas cargados — no puedo estimar";
  }
  return `${trabajados} de ${totalDeTemas} temas tiene alguna evidencia · sin clases cargadas, no puedo estimar el tiempo`;
}

export function ganttDeMateria(e: EstadoDeMateria): GanttDeMateria {
  const sesiones: SesionDeClase[] = e.clases.map((c) => ({
    tipo: c.tipo,
    minutos: c.minutos,
    temas: c.temas,
  }));

  const reparto = minutosPorTema(
    e.unidades.map((u) => ({ id: u.id, peso: u.peso })),
    sesiones,
    e.cargaDeclarada?.minutos ?? null,
  );

  const minutosDe = (id: string): number | null =>
    reparto.estado === "OK" ? (reparto.minutos[id] ?? null) : null;

  const unidades = e.unidades.map((u) => ({
    id: u.id,
    nombre: u.nombre,
    minutos: minutosDe(u.id),
    estado: u.evidencia,
  }));

  const cobertura = coberturaDeMateria(unidades);

  const barra = porcentajeDeHoras(cobertura);
  const total = e.unidades.length;
  const enRevision = cobertura.entregasQueRequierenRevision;

  // El texto lo arma `textoDeCobertura`, **compartido con el índice de materias**
  // (ADR-077). Vive en un solo lugar porque ya cambió una vez por revisión
  // clínica y dos copias significan que la próxima arregla una sola pantalla.
  const pie = textoDeCobertura(cobertura, total);

  return {
    unidades,
    barra,
    pie,
    // §C1: *"Entregas que requieren revisión: X, cuando corresponda"*. En cero
    // la línea **no se dibuja**: una sección que dice «0 pendientes» inventa
    // una tranquilidad que nadie afirmó.
    enRevision,
    criterioAlcanzado: cobertura.temasConCriterio,
    // La aclaración acompaña al número. Sin número no hay nada que aclarar, y
    // ponerla igual sería explicar una barra que no está.
    aclaracion: barra !== null ? ACLARACION_DE_COBERTURA : null,
    cobertura,
  };
}

/**
 * El estado de una unidad, en copy — [ADR-085](../../../docs/decisions.md#adr-085).
 *
 * ⚠️ **Describe actividad, no conocimiento.** El mockup del owner rotulaba esta
 * columna `Sin empezar · Leído · Practicado · Dominado`, con la leyenda *"el
 * relleno de cada barra es **el nivel** del tema"*. Dos de esas palabras están
 * prohibidas:
 *
 *   - **`Dominado`** es la primera prohibición de
 *     [ADR-072](../../../docs/decisions.md#adr-072) —*el dominio requiere
 *     evaluación*—, el corte que sostiene toda la cadena
 *     `preparar ≠ enviar ≠ suficiencia ≠ validación ≠ dominio`;
 *   - **`nivel`** lo prohíbe [ADR-075](../../../docs/decisions.md#adr-075) §C1,
 *     textual: *"su rótulo visible debe ser `actividad registrada`, no
 *     `dominio`, `nivel`, `rendimiento` ni `avance de aprendizaje`"*.
 *
 * Y hay una razón más honda: **la escala del mockup es la dimensión Confianza**,
 * que el estudiante autodeclara y que **todavía no tiene escritor**. Lo que sí
 * es un hecho es el estado de la evidencia, y es lo que se muestra.
 */
const ETIQUETA_DE_UNIDAD: Record<GanttProjection["unidades"][number]["estado"], string> = {
  sin_evidencia: "UNIDAD.SIN_REGISTRO",
  enviada: "UNIDAD.ENVIADA",
  requiere_revision: "UNIDAD.REVISION",
  criterio_alcanzado: "UNIDAD.CRITERIO",
};

/** El Gantt, tal como lo consume la pantalla. */
function aGantt(e: EstadoDeMateria): GanttProjection {
  const g = ganttDeMateria(e);

  const hoy = fechaDeHoy(e.instante, e.zona);
  /*
    El eje se arma con **las evaluaciones que los temas declaran**, no con la
    de la materia: es lo que decide hasta dónde se estira. Una evaluación fuera
    de cuadro es peor que un eje largo (ADR-078).
  */
  const eje = ejeDelPeriodo(
    hoy,
    // Se filtra por verdad, no por `!== null`: una clave ausente llega como
    // `undefined` y `Date.parse(undefined)` no falla — devuelve `NaN`, y el eje
    // se arma alrededor de una fecha inválida sin que nadie se entere.
    e.unidades.map((u) => u.evaluaEn).filter((f): f is string => Boolean(f)),
  );

  const porId = new Map(e.unidades.map((u) => [u.id, u]));

  return {
    barra: g.barra,
    pie: g.pie,
    aclaracion: g.aclaracion,
    // El orden llega dado por `estado_de_materia()` —el dictado, con el
    // declarado de respaldo— y la proyección **no lo toca**: reordenar acá
    // duplicaría la decisión en dos lugares.
    enRevision: g.enRevision,
    criterioAlcanzado: g.criterioAlcanzado,
    eje: marcasDelEje(hoy, eje),
    unidades: g.unidades.map((u) => {
      const p = porId.get(u.id);
      /*
        ── Dónde va la barra · ADR-085 ─────────────────────────────────────────

        **Las dos puntas son hechos y ninguna se estima.** Empieza cuando el
        tema se dictó por primera vez; termina en la evaluación que declara
        cubrirlo, o en la última clase que lo dictó si no hay evaluación.

        ⚠️ **Sin primera clase no hay barra.** Un tema que todavía no se dictó no
        se ubica: colocarlo en «+7 días» porque es el séptimo de la lista sería
        inventar un plan de estudio que nadie hizo y presentarlo como si la
        cátedra lo hubiera dictado.
      */
      const inicio = p?.primeraClaseEn ?? null;
      const fin = p?.evaluaEn ?? p?.ultimaClaseEn ?? null;

      return {
        codigo: p?.codigo ?? null,
        nombre: u.nombre,
        minutos: u.minutos,
        estado: u.estado,
        etiqueta: t(ETIQUETA_DE_UNIDAD[u.estado] as Parameters<typeof t>[0]),
        desde: inicio ? posicionEnEje(inicio, eje) : null,
        hasta: inicio ? posicionEnEje(fin ?? inicio, eje) : null,
        nota: inicio ? null : t("UNIDAD.SIN_DICTAR"),
      };
    }),
  };
}

/**
 * *"6 días · práctico · 2 evidencias enviadas"* — la segunda línea de la
 * tarjeta de evaluación.
 *
 * **Cada parte se omite si su dato falta**, y nada se completa: una evaluación
 * sin modalidad declarada no es «escrita por defecto», y sin fecha no se cuentan
 * días contra una fecha que no existe. `null` ⇒ no hay ninguna parte que decir.
 */
function detalleDeEvaluacion(e: EstadoDeMateria): string | null {
  const partes: string[] = [];

  if (e.examen?.fechaEn) {
    const dias = diasHasta(e.examen.fechaEn, e.instante, e.zona);
    // Una evaluación pasada no dice «−3 días»: no se muestra la cuenta.
    if (dias >= 0) partes.push(dias === 1 ? "1 día" : `${dias} días`);
  }
  // El enum crudo nunca es copy visible (AGENTS.md §2.6), pero éstos son
  // palabras del oficio que la cátedra declaró —`practico`, `escrito`— y viajan
  // como las declaró. Traducirlas sería reescribir lo que dijo la fuente.
  if (e.examen?.modalidad) partes.push(e.examen.modalidad);
  if (e.evidenciasEnviadas > 0) {
    partes.push(
      e.evidenciasEnviadas === 1 ? "1 evidencia enviada" : `${e.evidenciasEnviadas} evidencias enviadas`,
    );
  }

  return partes.length > 0 ? partes.join(" · ") : null;
}

/** Días entre hoy —el del estudiante— y una fecha de calendario. */
function diasHasta(fecha: string, instante: string, zona: string): number {
  const hoy = fechaDeHoy(instante, zona);
  return Math.round((Date.parse(`${fecha}T00:00:00Z`) - Date.parse(`${hoy}T00:00:00Z`)) / 86_400_000);
}

/** El día calendario del estudiante. La misma cuenta que hace el índice. */
function fechaDeHoy(instante: string, zona: string): string {
  return new Intl.DateTimeFormat("en-CA", {
    year: "numeric", month: "2-digit", day: "2-digit", timeZone: zona,
  }).format(new Date(instante));
}
