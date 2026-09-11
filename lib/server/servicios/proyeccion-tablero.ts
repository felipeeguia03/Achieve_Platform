import { copy, t, type CopyId } from "@/lib/content/es-AR";
import { hayActividad } from "@/lib/domain/cobertura";
import { cuadroDeHoy, type HorarioDeHoy } from "@/lib/domain/cuadro-de-hoy";
import { nombreDeObjeto } from "@/lib/domain/nombre-de-objeto";
import { fechaEnZona } from "@/lib/domain/zona";
import {
  riesgosDePlanificacion,
  type MateriaParaRiesgo,
  type Riesgo,
} from "@/lib/domain/riesgos-de-planificacion";
import type {
  CuadroDeHoy,
  ItemDeHorario,
  RepartoProjection,
  RiesgoProyectado,
  TableroProps,
  TarjetaDeEvaluacion,
} from "@/lib/domain/view-models";
import { enHoras, proyectarReparto, type InsumosDeReparto } from "./proyeccion-reparto";
import { proyectarMaterias } from "./proyeccion-materias";
import { fechaDeCalendario } from "./tiempo";

/**
 * El tablero de `UX01` — [ADR-093](../../../docs/decisions.md#adr-093), con el
 * cuadro de hoy de [ADR-094](../../../docs/decisions.md#adr-094).
 *
 * ## Por qué lee los insumos del reparto
 *
 * Por el mismo motivo que el índice de materias: una tarjeta de Hoy y una fila
 * de `/materias` **no pueden decir cosas distintas** sobre la misma materia. Las
 * tarjetas salen de `proyectarMaterias` —mismo orden, misma cobertura, misma
 * urgencia— y lo único que se agrega es la evaluación **en partes**, que el
 * índice entrega pegada en una sola línea.
 *
 * ## Lo que se suma
 *
 * El cuadro de hoy necesita lo que el reparto no trae: los bloques de clase con
 * su aula, las clases dadas con sus temas, los compromisos pendientes y las
 * franjas declaradas. Llegan en `InsumosDelDia`, de su propio repositorio.
 */

export interface InsumosDelDia {
  clases: Array<{ cursadaId: string; dia: number; desde: string; hasta: string; aula: string | null; estimada: boolean }>;
  /** Pendientes: `CONFIRMED`, `DUE` o `STARTED`. `titulo` es el objetivo de la `Action`. */
  compromisos: Array<{ cursadaId: string; inicio: string; minutos: number; titulo: string }>;
  /** Sólo la **declarada** ([ADR-074](../../../docs/decisions.md#adr-074)). */
  disponibilidad: Array<{ dia: number | null; desde: string | null; hasta: string | null; minutos: number | null }>;
  /** Clases **dadas** —hasta hoy— con los temas que cubrieron. */
  dictadas: Array<{ cursadaId: string; fecha: string; temas: string[] }>;
  /** Código y secuencia de los temas de esas clases, para escribir `Un. N`. */
  temas: Array<{ id: string; codigo: string | null; secuencia: number | null }>;
}

export interface RepositorioDeTablero {
  insumosDelDia(
    institutionId: string,
    studentId: string,
    desde: string,
    hasta: string,
    hoy: string,
  ): Promise<InsumosDelDia>;
}

/**
 * La modalidad, para leer. ⚠️ **Sólo en el tablero**: el índice y `UX02` la
 * muestran como llega, por una decisión escrita en `proyeccion-materia.ts` que
 * este ADR no reabre. Un valor que el copy no conoce **se omite** — el enum
 * nunca es copy (`AGENTS.md` §2.6).
 */
export function modalidadVisible(m: string | null): string | null {
  if (!m) return null;
  const id = `EVALUACION.MODALIDAD.${m}`;
  return id in copy ? t(id as CopyId) : null;
}

/**
 * El número de una unidad: el del código (`U5` → `5`) y, si no hay, su
 * secuencia. `null` ⇒ **no se le inventa uno**, y el cuadro la omite.
 */
export function numeroDeUnidad(codigo: string | null, secuencia: number | null): number | null {
  const enCodigo = codigo ? /\d+/.exec(codigo)?.[0] : undefined;
  if (enCodigo !== undefined) return Number(enCodigo);
  return secuencia;
}

/** Rellena `{clave}` en una plantilla de `es-AR.ts`. Una clave sin valor queda visible: se nota. */
function llenar(plantilla: string, valores: Record<string, string | number>): string {
  return plantilla.replace(/\{(\w+)\}/g, (entera, clave: string) =>
    clave in valores ? String(valores[clave]) : entera,
  );
}

/** *"hoy"*, *"mañana"*, *"en 4 días"*. */
function cuando(dias: number): string {
  if (dias <= 0) return "hoy";
  if (dias === 1) return "mañana";
  return `en ${dias} días`;
}

/** Días de calendario entre dos instantes, en la zona del estudiante. */
function diasEntre(desde: string, hasta: string, zona: string): number {
  const a = Date.parse(fechaEnZona(Date.parse(desde), zona));
  const b = Date.parse(fechaEnZona(Date.parse(hasta), zona));
  return Math.max(0, Math.round((b - a) / 86_400_000));
}

function redactarRiesgo(r: Riesgo, reparto: RepartoProjection | null): RiesgoProyectado {
  switch (r.regla) {
    case "EVALUACION_SIN_TEMAS":
      return {
        regla: r.regla,
        motor: "ACADEMICO",
        titulo: llenar(t("HOY.RIESGOS.SIN_TEMAS"), {
          materia: r.nombre,
          evaluacion: r.rotulo ?? "evaluación",
          fecha: fechaDeCalendario(r.fecha),
        }),
        detalle: t("HOY.RIESGOS.SIN_TEMAS.DETALLE"),
        cursadaId: r.cursadaId,
      };
    case "COBERTURA_BAJA_CERCA":
      return {
        regla: r.regla,
        motor: "ACADEMICO",
        titulo: llenar(t("HOY.RIESGOS.COBERTURA"), {
          materia: r.nombre,
          cuando: cuando(r.dias),
          porcentaje: r.porcentaje,
        }),
        detalle: t("HOY.RIESGOS.COBERTURA.DETALLE"),
        cursadaId: r.cursadaId,
      };
    case "SIN_ACTIVIDAD_CERCA":
      return {
        regla: r.regla,
        motor: "ACADEMICO",
        titulo: llenar(t("HOY.RIESGOS.AVANCE"), {
          materia: r.nombre,
          cuando: cuando(r.dias),
          avance:
            r.diasSinActividad === null
              ? t("HOY.RIESGOS.AVANCE.NUNCA")
              : llenar(t("HOY.RIESGOS.AVANCE.HACE"), { n: r.diasSinActividad }),
        }),
        detalle: null,
        cursadaId: r.cursadaId,
      };
    case "EVALUACIONES_ENCIMADAS":
      return {
        regla: r.regla,
        motor: "ACADEMICO",
        titulo: llenar(
          t(r.mismoDia ? "HOY.RIESGOS.ENCIMADAS.MISMO_DIA" : "HOY.RIESGOS.ENCIMADAS.SEGUIDAS"),
          { n: r.materias.length, fecha: fechaDeCalendario(r.fecha) },
        ),
        detalle: llenar(t("HOY.RIESGOS.ENCIMADAS.DETALLE"), {
          materias: r.materias.map((m) => m.nombre).join(" · "),
        }),
        // Es de varias materias a la vez: abrir una sería elegir cuál importa.
        cursadaId: null,
      };
    case "PLAN_NO_ENTRA":
      // ⚠️ **El título es el de la psicopedagoga, no uno nuevo** (ADR-075 §A3).
      // La regla no inventa ni el umbral ni la frase: las dos ya existían.
      return {
        regla: r.regla,
        motor: "PERSONAL",
        titulo: t("HOY.REPARTO.CRITICA"),
        detalle: reparto?.cifras ?? null,
        cursadaId: null,
      };
  }
}

function redactarHorario(h: HorarioDeHoy): ItemDeHorario {
  switch (h.tipo) {
    case "EVALUACION":
      return { tipo: h.tipo, hora: null, texto: h.rotulo ? `${h.rotulo} · ${h.nombre}` : h.nombre, cursadaId: h.cursadaId };
    case "COMPROMISO":
      return {
        tipo: h.tipo,
        hora: h.hora,
        texto: llenar(t("HOY.CUADRO.COMPROMISO"), { titulo: h.titulo }),
        cursadaId: h.cursadaId,
      };
    case "DISPONIBLE": {
      const desde = h.desde?.slice(0, 5) ?? null;
      const hasta = h.hasta?.slice(0, 5) ?? null;
      return {
        tipo: h.tipo,
        hora: desde ? (hasta ? `${desde}–${hasta}` : desde) : null,
        // Sin horario, la franja dice cuánto; con horario, el horario ya lo dice.
        texto:
          desde === null && h.minutos !== null
            ? llenar(t("HOY.CUADRO.DISPONIBLE.MINUTOS"), { horas: enHoras(h.minutos) })
            : t("HOY.CUADRO.DISPONIBLE"),
        cursadaId: null,
      };
    }
  }
}

export function proyectarTablero(
  i: InsumosDeReparto,
  s: InsumosDelDia,
  ahora: string,
  zona: string,
): TableroProps {
  // El orden, la cobertura y la urgencia **son los del índice**: no se recalculan.
  const indice = proyectarMaterias(i, ahora, zona);
  const crudas = new Map(i.materias.map((m) => [m.cursadaId, m]));
  const filas = indice.materias.flatMap((f) => {
    const m = crudas.get(f.cursadaId);
    return m ? [{ f, m }] : [];
  });
  const rotulo = (e: NonNullable<InsumosDeReparto["materias"][number]["evaluacion"]>) => e.titulo ?? e.tipo;

  const tarjetas: TarjetaDeEvaluacion[] = filas.map(({ f, m }) => ({
    cursadaId: f.cursadaId,
    nombre: nombreDeObjeto(f.nombre),
    evaluacion: m.evaluacion
      ? {
          rotulo: rotulo(m.evaluacion),
          fecha: fechaDeCalendario(m.evaluacion.fecha),
          modalidad: modalidadVisible(m.evaluacion.modalidad),
        }
      : null,
    dias: m.diasHastaEvaluacion,
    faltan: f.faltan,
    cobertura: f.cobertura
      ? { fraccion: f.cobertura.fraccion, porcentaje: Math.round(f.cobertura.fraccion * 100) }
      : null,
    sinCobertura: f.sinCobertura,
    ultimoAvance: f.ultimoAvance,
    tono: f.tono,
  }));

  const dias = tarjetas.map((c) => c.dias).filter((d): d is number => d !== null && d >= 0);
  const lejana = dias.length > 0 ? Math.max(...dias) : 0;

  const reparto = proyectarReparto(i);
  const entrada: MateriaParaRiesgo[] = filas.map(({ f, m }) => ({
    cursadaId: m.cursadaId,
    nombre: nombreDeObjeto(m.nombre),
    evaluacion:
      m.evaluacion && m.diasHastaEvaluacion !== null
        ? { fecha: m.evaluacion.fecha, dias: m.diasHastaEvaluacion, rotulo: rotulo(m.evaluacion) }
        : null,
    temasCargados: m.unidades.length,
    cobertura: f.cobertura?.fraccion ?? null,
    diasSinActividad: m.ultimoAvanceEn ? diasEntre(m.ultimoAvanceEn, ahora, zona) : null,
  }));

  return {
    proximaEvaluacion: dias.length > 0 ? { dias: Math.min(...dias) } : null,
    tarjetas,
    aclaracionDeCobertura: tarjetas.some((c) => c.cobertura !== null) ? t("HOY.EVALUACIONES.NOTA") : null,
    // Una semana de aire después de la más lejana, para que su marca no quede en el borde.
    horizonteEnDias: Math.max(14, Math.ceil((lejana + 1) / 7) * 7),
    riesgos: riesgosDePlanificacion({ materias: entrada, tramoDelReparto: reparto?.tramo ?? null }).map(
      (r) => redactarRiesgo(r, reparto),
    ),
    hoy: proyectarCuadro(filas.map(({ m }) => m), s, ahora, zona),
  };
}

/** El cuadro de hoy, redactado — ADR-094. `materias` llega en orden de próxima evaluación. */
function proyectarCuadro(
  materias: InsumosDeReparto["materias"],
  s: InsumosDelDia,
  ahora: string,
  zona: string,
): CuadroDeHoy {
  const conocidas = new Set(materias.map((m) => m.cursadaId));
  const numeros = new Map(s.temas.map((x) => [x.id, numeroDeUnidad(x.codigo, x.secuencia)]));

  const c = cuadroDeHoy({
    hoy: fechaEnZona(Date.parse(ahora), zona),
    zona,
    materias: materias.map((m) => ({
      cursadaId: m.cursadaId,
      nombre: nombreDeObjeto(m.nombre),
      unidades: m.unidades.map((u) => ({
        id: u.id,
        numero: numeros.get(u.id) ?? null,
        conEvidencia: hayActividad(u.evidencia),
      })),
    })),
    // Un bloque de una cursada que el índice no conoce no se puede nombrar: se omite.
    clases: s.clases.filter((x) => conocidas.has(x.cursadaId)),
    dictadas: s.dictadas,
    evaluaciones: materias.flatMap((m) =>
      m.evaluacion
        ? [
            {
              cursadaId: m.cursadaId,
              nombre: nombreDeObjeto(m.nombre),
              fecha: m.evaluacion.fecha,
              rotulo: m.evaluacion.titulo ?? m.evaluacion.tipo,
            },
          ]
        : [],
    ),
    compromisos: s.compromisos.map((x) => ({ ...x, titulo: nombreDeObjeto(x.titulo) })),
    disponibilidad: s.disponibilidad,
  });

  // ⚠️ **La nota de estimado es obligatoria** si alguna clase de hoy es
  // simulada: sin ella, el aula se lee como dato de la facultad (ADR-094).
  const notas = [
    ...(c.clases.some((x) => x.estimada) ? [t("HOY.CUADRO.NOTA.ESTIMADO")] : []),
    ...(c.clases.some((x) => x.unidad !== null) ? [t("HOY.CUADRO.NOTA.UNIDAD")] : []),
    ...(c.avanzar.length > 0 ? [t("HOY.CUADRO.NOTA.AVANZAR")] : []),
  ];

  return {
    clases: c.clases.map((x) => ({
      cursadaId: x.cursadaId,
      hora: `${x.desde}–${x.hasta}`,
      materia: x.nombre,
      detalle: [x.unidad !== null ? `Un. ${x.unidad}` : null, x.aula].filter(Boolean).join(" · ") || null,
    })),
    avanzar: c.avanzar.map((a) => ({
      cursadaId: a.cursadaId,
      materia: a.nombre,
      unidades: `Un. ${a.unidades.join(" · ")}${a.resto > 0 ? ` +${a.resto}` : ""}`,
    })),
    vacioDeAvance: t(c.sinClasesDadas ? "HOY.CUADRO.AVANZAR.SIN_CLASES" : "HOY.CUADRO.AVANZAR.TODO"),
    horarios: c.horarios.map(redactarHorario),
    notas,
  };
}
