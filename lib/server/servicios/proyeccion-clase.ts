/**
 * La proyección de **Modo Clase** — [ADR-098](../../../docs/decisions.md#adr-098).
 *
 * Pura: recibe filas y contexto, devuelve props. **No decide nada**: cuenta
 * marcas, calcula la duración y formatea la fecha. Todo lo demás es lo que la
 * base dijo, o `null` si no lo dijo.
 */
import { duracionEnMinutos, enOrden, resumenDeMarcas } from "@/lib/domain/sesion-de-clase";
import type { ClaseEnLista, ClaseProps } from "@/lib/domain/view-models";
import type { ClaseFila, MarcaFila } from "./clase";
import { fechaCorta } from "./tiempo";

export interface ContextoDeClase {
  materia: string;
  comision: string | null;
  docente: string | null;
  aula: string | null;
  /** `null` ⇒ la clase no tiene bloque, o el bloque ya no existe. */
  horarioEstimado: boolean | null;
  unidadDeUltimaClase: number | null;
}

const hhmm = (t: string) => t.slice(0, 5);

export function proyectarClase(
  clase: ClaseFila,
  marcas: readonly MarcaFila[],
  contexto: ContextoDeClase,
  zona: string,
): ClaseProps {
  const ordenadas = enOrden(marcas);
  return {
    id: clase.id,
    cursadaId: clase.cursadaId,
    materia: contexto.materia,
    estado: clase.estado,
    iniciadaEn: clase.iniciadaEn,
    terminadaEn: clase.terminadaEn,
    fecha: fechaCorta(clase.iniciadaEn, zona),
    horario:
      clase.horarioDesde && clase.horarioHasta
        ? { desde: hhmm(clase.horarioDesde), hasta: hhmm(clase.horarioHasta) }
        : null,
    // Sin horario copiado no hay nada de qué decir si era estimado.
    horarioEstimado: clase.horarioDesde ? contexto.horarioEstimado : null,
    aula: contexto.aula,
    comision: contexto.comision,
    docente: contexto.docente,
    unidadDeUltimaClase: contexto.unidadDeUltimaClase,
    apuntes: clase.apuntes ?? "",
    apuntesGuardadosEn: clase.apuntesGuardadosEn,
    marcas: ordenadas.map((m) => ({ id: m.id, tipo: m.tipo, segundos: m.segundos, texto: m.texto, creadaEn: m.creadaEn })),
    resumen: resumenDeMarcas(marcas),
    duracionMinutos: duracionEnMinutos(clase),
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
