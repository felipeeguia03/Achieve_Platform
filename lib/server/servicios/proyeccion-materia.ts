import { selectHeroLevel, type HeroInput } from "@/lib/domain/precedence";
import { t } from "@/lib/content/es-AR";
import { aEntradaVisible, type HechoPersistido } from "./hechos";
import { fechaCorta, haceCuanto } from "./tiempo";
import type { FilaDato, MateriaProps } from "@/lib/domain/view-models";

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
  codigo: string | null;
  nombre: string;
  ultimoAvanceEn: string | null;
  dominio: EstadoDimension;
  practica: EstadoDimension;
  recorrido: EstadoDimension;
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

export interface EstadoDeMateria {
  instante: string;
  zona: string;
  cursadaId: string;
  materia: string;
  examen: { titulo: string; fechaEn: string | null } | null;
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
  ultimoAvanceEn: string | null;
  unidades: UnidadPersistida[];
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
 * Las unidades declaradas. **El orden es el declarado, no uno inferido**: que la
 * Unidad 2 vaya después de la 1 no dice que la necesite (misma regla que la
 * ingesta del ADL).
 */
function unidadesDe(e: EstadoDeMateria): FilaDato[] {
  return e.unidades.map((u) => {
    const label = u.codigo ?? u.nombre;
    if (u.ultimoAvanceEn) {
      return { label, valor: haceCuanto(u.ultimoAvanceEn, e.instante, e.zona) };
    }
    // Sin registro no es "cero actividad": es que nadie anotó nada.
    return { label, valor: t("COMUN.SIN_AVANCE"), ausencia: "SIN_ASIGNAR" as const };
  });
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
    materia: e.materia,
    // Una evaluación sin fecha conserva su título: la fecha desconocida no se
    // estima, y el título sigue siendo un hecho.
    examen: e.examen
      ? e.examen.fechaEn
        ? `${e.examen.titulo} · ${fechaCorta(e.examen.fechaEn, e.zona)}`
        : e.examen.titulo
      : null,
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
    unidades: unidadesDe(e),
    dimensiones,
    // La misma traducción que la Bitácora, y por eso la misma función: si cada
    // superficie tradujera por su cuenta, la preview y el historial dirían cosas
    // distintas del mismo hecho.
    actividadReciente: actividadDe(e),
    // El aviso explica una ausencia; no la disfraza.
    aviso: e.contextoIncompleto
      ? null // el hero ya lo dice: no se repite el mismo hecho dos veces
      : dimensiones.length > 0 && dimensiones.every((f) => f.ausencia)
        ? t("MATERIA.SIN_SEMANTICA")
        : null,
    // La captura de clase escribe en `class_event_record`: misma razón que
    // `catedraYVos`. No se ofrece una acción cuyo contrato no está cerrado.
    capturaDeClase: null,
  };
}
