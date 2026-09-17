import { t } from "@/lib/content/es-AR";
import { hayActividad } from "@/lib/domain/cobertura";
import { cuadroDeHoy, type HorarioDeHoy } from "@/lib/domain/cuadro-de-hoy";
import { clasesDeAhora } from "@/lib/domain/clase-en-curso";
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
} from "@/lib/domain/view-models";
import { enHoras, proyectarReparto, type InsumosDeReparto } from "./proyeccion-reparto";
import { proyectarMaterias, type BloqueDeCursada } from "./proyeccion-materias";
import { fechaDeCalendario } from "./tiempo";

/**
 * El tablero de `UX01` — [ADR-093](../../../docs/decisions.md#adr-093), con el
 * cuadro de hoy de [ADR-094](../../../docs/decisions.md#adr-094).
 *
 * ## Por qué lee los insumos del reparto
 *
 * Por el mismo motivo que el índice de materias: una tarjeta de Hoy y una fila
 * de `/materias` **no pueden decir cosas distintas** sobre la misma materia. Las
 * filas salen de `proyectarMaterias` —mismo orden, misma cobertura, misma
 * urgencia—, así que los riesgos y la píldora hablan de lo mismo que `/materias`.
 *
 * ## Lo que se suma
 *
 * El cuadro de hoy necesita lo que el reparto no trae: los bloques de clase con
 * su aula, las clases dadas con sus temas, los compromisos pendientes y las
 * franjas declaradas. Llegan en `InsumosDelDia`, de su propio repositorio.
 */

export interface InsumosDelDia {
  clases: BloqueDeCursada[];
  /** Pendientes: `CONFIRMED`, `DUE` o `STARTED`. `titulo` es el objetivo de la `Action`. */
  compromisos: Array<{ cursadaId: string; inicio: string; minutos: number; titulo: string }>;
  /** Sólo la **declarada** ([ADR-074](../../../docs/decisions.md#adr-074)). */
  disponibilidad: Array<{ dia: number | null; desde: string | null; hasta: string | null; minutos: number | null }>;
  /** Clases **dadas** —hasta hoy— con los temas que cubrieron. */
  dictadas: Array<{ cursadaId: string; fecha: string; temas: string[] }>;
  /** Código y secuencia de los temas de esas clases, para escribir `Un. N`. */
  temas: Array<{ id: string; codigo: string | null; secuencia: number | null }>;
  /**
   * La clase que el estudiante tiene abierta — ADR-098. Ausente o `null` ⇒ ninguna.
   * ⚠️ **No es una clase dictada**: es la suya.
   */
  claseActiva?: { id: string; cursadaId: string } | null;
  /**
   * La zona de la institución, que es **la del horario de cursado**
   * ([ADR-049](../../../docs/decisions.md#adr-049)). Ausente o `null` ⇒ no se
   * puede decir si una clase está en curso, y no se ofrece entrar: evaluarlo
   * con otra zona sería otra regla.
   */
  zonaInstitucional?: string | null;
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
        materia: r.nombre,
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
        materia: r.nombre,
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
        materia: r.nombre,
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
        materia: null,
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
        materia: null,
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

type FilaDeRiesgo = {
  f: ReturnType<typeof proyectarMaterias>["materias"][number];
  m: InsumosDeReparto["materias"][number];
};

function entradaDeRiesgos(filas: readonly FilaDeRiesgo[], ahora: string, zona: string): MateriaParaRiesgo[] {
  const rotulo = (e: NonNullable<InsumosDeReparto["materias"][number]["evaluacion"]>) => e.titulo ?? e.tipo;
  return filas.map(({ f, m }) => ({
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
}

/**
 * Los riesgos de Hoy, **por materia** — para el Plan vivo
 * ([ADR-110 · Enmienda 5](../../../docs/decisions.md#adr-110-enmienda-5)).
 *
 * Mismas reglas y mismo texto que *Riesgos detectados*: el plan prioriza una
 * materia en riesgo **por lo que Hoy ya dice**, no por un criterio propio. Las
 * evaluaciones encimadas marcan a cada materia del grupo; el riesgo del reparto
 * no es de ninguna.
 */
export function riesgosPorMateria(i: InsumosDeReparto, ahora: string, zona: string): Map<string, string> {
  const indice = proyectarMaterias(i, ahora, zona);
  const crudas = new Map(i.materias.map((m) => [m.cursadaId, m]));
  const filas = indice.materias.flatMap((f) => {
    const m = crudas.get(f.cursadaId);
    return m ? [{ f, m }] : [];
  });
  const reparto = proyectarReparto(i);
  const salida = new Map<string, string>();
  for (const r of riesgosDePlanificacion({ materias: entradaDeRiesgos(filas, ahora, zona), tramoDelReparto: null })) {
    const texto = redactarRiesgo(r, reparto).titulo;
    if (r.regla === "EVALUACIONES_ENCIMADAS") {
      for (const m of r.materias) if (!salida.has(m.cursadaId)) salida.set(m.cursadaId, texto);
    } else if (r.regla !== "PLAN_NO_ENTRA" && !salida.has(r.cursadaId)) {
      salida.set(r.cursadaId, texto);
    }
  }
  return salida;
}

export function proyectarTablero(
  i: InsumosDeReparto,
  s: InsumosDelDia,
  ahora: string,
  zona: string,
): TableroProps {
  // El orden, la cobertura y la urgencia **son los del índice**: no se recalculan.
  // Las mismas filas que `/materias`, **con el mismo horario**: dos lecturas del
  // mismo bloque no pueden decir cosas distintas.
  const indice = proyectarMaterias(i, ahora, zona, s.clases);
  const crudas = new Map(i.materias.map((m) => [m.cursadaId, m]));
  const filas = indice.materias.flatMap((f) => {
    const m = crudas.get(f.cursadaId);
    return m ? [{ f, m }] : [];
  });

  // ⚠️ **La única cifra de evaluaciones que queda** (ADR-096): la de la píldora.
  // Las dos formas de listarlas se descartaron; el listado vive en `/materias`.
  const dias = filas
    .map(({ m }) => m.diasHastaEvaluacion)
    .filter((d): d is number => d !== null && d >= 0);

  const reparto = proyectarReparto(i);
  const entrada = entradaDeRiesgos(filas, ahora, zona);

  return {
    proximaEvaluacion: dias.length > 0 ? { dias: Math.min(...dias) } : null,
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
    ...(c.clases.some((x) => x.estimada) ? [t("COMUN.HORARIO_ESTIMADO")] : []),
    ...(c.clases.some((x) => x.unidad !== null) ? [t("HOY.CUADRO.NOTA.UNIDAD")] : []),
    ...(c.avanzar.length > 0 ? [t("HOY.CUADRO.NOTA.AVANZAR")] : []),
  ];

  /*
    ⚠️ **ADR-098 §8, la enmienda a ADR-094 §5.** La fila de una clase en curso,
    o que empieza en 15 minutos o menos, lleva *Entrar a clase*; con una clase
    ya abierta, esa fila dice *Volver a la clase* y **las demás no ofrecen
    nada** —entrar terminaría en `409`—. Ninguna otra fila lleva botón.
  */
  const activa = s.claseActiva ?? null;
  const zonaDeCursado = s.zonaInstitucional ?? null;
  const deAhora = zonaDeCursado
    ? clasesDeAhora(
        s.clases.filter((x) => conocidas.has(x.cursadaId)).map((x) => ({ ...x, bloqueId: x.bloqueId ?? null })),
        Date.parse(ahora),
        zonaDeCursado,
      )
    : [];
  const filaDeAhora = (cursadaId: string, desde: string) =>
    deAhora.find((x) => x.cursadaId === cursadaId && x.desde === desde) ?? null;
  const nombres = new Map(materias.map((m) => [m.cursadaId, nombreDeObjeto(m.nombre)]));

  const clases = c.clases.map((x) => {
    const ahoraMismo = filaDeAhora(x.cursadaId, x.desde);
    const entrada =
      ahoraMismo === null
        ? null
        : activa === null
          ? { tipo: "ENTRAR" as const, bloqueId: ahoraMismo.bloqueId }
          : activa.cursadaId === x.cursadaId
            ? { tipo: "VOLVER" as const, bloqueId: ahoraMismo.bloqueId }
            : null;
    return {
      cursadaId: x.cursadaId,
      hora: `${x.desde}–${x.hasta}`,
      materia: x.nombre,
      detalle: [x.unidad !== null ? `Un. ${x.unidad}` : null, x.aula].filter(Boolean).join(" · ") || null,
      cuando:
        ahoraMismo === null
          ? null
          : ahoraMismo.momento === "EN_CURSO"
            ? t("HOY.CUADRO.CLASE.AHORA")
            : llenar(t("HOY.CUADRO.CLASE.EMPIEZA"), { n: ahoraMismo.minutosParaEmpezar }),
      entrada,
    };
  });

  // Una clase abierta que no es ninguna fila de hoy **igual se ve**: una clase
  // abierta y escondida no se cierra nunca.
  const claseAbierta =
    activa && !clases.some((x) => x.entrada?.tipo === "VOLVER")
      ? { cursadaId: activa.cursadaId, materia: nombres.get(activa.cursadaId) ?? null }
      : null;

  return {
    clases,
    claseAbierta,
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
