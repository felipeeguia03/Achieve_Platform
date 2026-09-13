/**
 * La proyección de **Modo Clase** — [ADR-098](../../../docs/decisions.md#adr-098)
 * y [ADR-099](../../../docs/decisions.md#adr-099).
 *
 * Pura: recibe filas y contexto, devuelve props. **No decide nada**: cuenta
 * marcas, calcula la duración, formatea fechas y ubica la unidad con
 * `unidadesDeLaClase`. Lo simulado llega marcado y se rotula.
 */
import { duracionEnMinutos, enOrden, resumenDeMarcas } from "@/lib/domain/sesion-de-clase";
import { unidadesDeLaClase, type UnidadDeMateria } from "@/lib/domain/unidades-de-clase";
import type { ClaseEnLista, ClaseProps } from "@/lib/domain/view-models";
import type { ClaseFila, MarcaFila } from "./clase";
import type { ApunteFila, EtiquetaFila, GrabacionFila, MaterialFila } from "./clase-material";
import { fechaCorta } from "./tiempo";

export interface ContextoDeClase {
  materia: string;
  ofertaId: string;
  comision: string | null;
  docente: string | null;
  aula: string | null;
  /** `null` ⇒ la clase no tiene bloque, o el bloque ya no existe. */
  horarioEstimado: boolean | null;
  /** Los bloques de la semana, lunes primero. Los usa la simulación del tipo. */
  bloquesDeLaSemana: Array<{ id: string; dia: number }>;
  /** Los temas de la clase **dictada** el día de esta clase. Hecho. */
  temasDeEsaFecha: string[];
  /** Los temas de la última clase dada antes de ese día. */
  temasDeLaUltimaDada: string[];
}

export interface LoGuardadoDeLaClase {
  apuntes: readonly ApunteFila[];
  material: readonly MaterialFila[];
  grabaciones: ReadonlyArray<GrabacionFila & { etiquetas: readonly EtiquetaFila[] }>;
}

/** Lo que salió de la simulación (ADR-099 §6–§7). `null` ⇒ no hay simulación. */
export interface SimuladoDeClase {
  comision: string;
  inscriptos: number;
  aula: string;
  tipo: "TEORICA" | "PRACTICA";
}

const hhmm = (t: string) => t.slice(0, 5);

/** *"jueves 18/05"*, en la zona del estudiante. */
export function diaDeLaClase(instante: string, zona: string): string {
  const partes = new Intl.DateTimeFormat("es-AR", {
    weekday: "long",
    day: "2-digit",
    month: "2-digit",
    timeZone: zona,
  }).formatToParts(new Date(instante));
  const de = (tipo: string) => partes.find((p) => p.type === tipo)?.value ?? "";
  return `${de("weekday")} ${de("day")}/${de("month")}`;
}

export function proyectarClase(
  clase: ClaseFila,
  marcas: readonly MarcaFila[],
  contexto: ContextoDeClase,
  zona: string,
  guardado: LoGuardadoDeLaClase,
  unidades: readonly UnidadDeMateria[],
  simulado: SimuladoDeClase | null,
): ClaseProps {
  const ordenadas = enOrden(marcas);
  // Lo real gana sobre lo simulado: la simulación sólo llena huecos.
  const comision = contexto.comision ?? simulado?.comision ?? null;
  const aula = contexto.aula ?? simulado?.aula ?? null;
  return {
    id: clase.id,
    cursadaId: clase.cursadaId,
    materia: contexto.materia,
    estado: clase.estado,
    iniciadaEn: clase.iniciadaEn,
    terminadaEn: clase.terminadaEn,
    fecha: fechaCorta(clase.iniciadaEn, zona),
    dia: diaDeLaClase(clase.iniciadaEn, zona),
    tipo: simulado?.tipo ?? null,
    horario:
      clase.horarioDesde && clase.horarioHasta
        ? { desde: hhmm(clase.horarioDesde), hasta: hhmm(clase.horarioHasta) }
        : null,
    // Sin horario copiado no hay nada de qué decir si era estimado.
    horarioEstimado: clase.horarioDesde ? contexto.horarioEstimado : null,
    docente: contexto.docente,
    pie: {
      comision,
      // `simular-aulas` escribe «Aula 3.12»; la franja ya dice «Aula» arriba.
      aula: aula ? aula.replace(/^aula\s+/i, "") : null,
      inscriptos: simulado?.inscriptos ?? null,
      // Los inscriptos siempre son simulados: si hay simulación, hay rótulo.
      simulado: simulado !== null,
    },
    unidades: unidadesDeLaClase(unidades, contexto.temasDeEsaFecha, contexto.temasDeLaUltimaDada),
    apuntes: guardado.apuntes.map((a) => ({
      id: a.id,
      texto: a.texto,
      segundos: a.segundos,
      creadoEn: a.creadoEn,
      editadoEn: a.editadoEn,
    })),
    marcas: ordenadas.map((m) => ({ id: m.id, tipo: m.tipo, segundos: m.segundos, texto: m.texto, creadaEn: m.creadaEn })),
    resumen: resumenDeMarcas(marcas),
    duracionMinutos: duracionEnMinutos(clase),
    material: guardado.material.map((m) => ({
      id: m.id,
      tipo: m.tipo,
      titulo: m.titulo,
      url: m.tipo === "LINK" ? m.url : null,
      mime: m.mime,
      bytes: m.bytes,
      creadoEn: m.creadoEn,
    })),
    grabaciones: guardado.grabaciones.map((g) => ({
      id: g.id,
      duracion: g.duracion,
      inicioEnClase: g.inicioEnClase,
      bytes: g.bytes,
      mime: g.mime,
      creadaEn: g.creadaEn,
      etiquetas: [...g.etiquetas]
        .sort((a, b) => (a.segundo ?? -1) - (b.segundo ?? -1) || a.creadaEn.localeCompare(b.creadaEn))
        .map((e) => ({ id: e.id, texto: e.texto, segundo: e.segundo })),
    })),
  };
}

export function proyectarClaseEnLista(
  clase: ClaseFila,
  tipos: readonly Pick<MarcaFila, "tipo">[],
  zona: string,
): ClaseEnLista {
  return {
    id: clase.id,
    estado: clase.estado,
    fecha: fechaCorta(clase.iniciadaEn, zona),
    iniciadaEn: clase.iniciadaEn,
    duracionMinutos: duracionEnMinutos(clase),
    resumen: resumenDeMarcas(tipos),
  };
}
