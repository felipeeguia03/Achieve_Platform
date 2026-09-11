/**
 * **El cuadro de hoy** — [ADR-094](../../docs/decisions.md#adr-094), que
 * reemplaza los próximos 7 días de ADR-093.
 *
 * Tres preguntas, en poco espacio:
 *
 * | Bloque | Contesta | De dónde |
 * |---|---|---|
 * | Clases | ¿qué curso hoy, a qué hora, dónde, y por qué unidad va? | `class_schedule_block` + la última clase dada |
 * | Podés avanzar | ¿qué ya se dio en clase y todavía no tiene evidencia? | `class_session_topic` + la cobertura |
 * | Horarios | ¿qué más tengo hoy? | evaluaciones, compromisos, disponibilidad declarada |
 *
 * ## ⚠️ «Un. N» es la unidad de la ÚLTIMA clase dada, no la de hoy
 *
 * No hay un cronograma de clases futuras: `class_session` son clases **dadas**,
 * con minutos **observados** ([ADR-068](../../docs/decisions.md#adr-068)).
 * Decir qué unidad se da hoy exigiría inventar el plan de la cátedra, que es lo
 * que [ADR-085](../../docs/decisions.md#adr-085) prohíbe ubicar por posición en
 * la lista. Lo que sí es un hecho es **por dónde va la materia**, y eso es lo
 * que se muestra; la pantalla lo aclara en una línea.
 *
 * ## Tampoco es una agenda
 *
 * No propone cuándo estudiar ([ADR-064](../../docs/decisions.md#adr-064)), y
 * *Podés avanzar* no es una recomendación: es un filtro sobre hechos —dado en
 * clase, sin evidencia— en el orden de próxima evaluación que ya aceptó
 * [ADR-072](../../docs/decisions.md#adr-072). La recomendación sigue siendo una
 * sola, y es el Hero.
 */
import { desplazamiento, diaDeSemana, fechaEnZona } from "./zona";

/** Cuántas materias muestra *Podés avanzar*. Poca información: es un vistazo. */
export const MATERIAS_PARA_AVANZAR = 3;
/** Cuántas unidades por materia antes del `+N`. */
export const UNIDADES_POR_MATERIA = 3;

export interface EntradaDelCuadro {
  /** `YYYY-MM-DD`, en la zona del estudiante. */
  hoy: string;
  zona: string;
  /** **En el orden de próxima evaluación**: el cuadro no reordena. */
  materias: ReadonlyArray<{
    cursadaId: string;
    nombre: string;
    unidades: ReadonlyArray<{ id: string; numero: number | null; conEvidencia: boolean }>;
  }>;
  clases: ReadonlyArray<{
    cursadaId: string;
    dia: number;
    desde: string;
    hasta: string;
    /** `null` ⇒ no se sabe dónde. **No es «sin aula».** */
    aula: string | null;
    /** `true` ⇒ horario y aula los simuló Achieve (`source_type = 'inference'`). */
    estimada: boolean;
  }>;
  /** Clases dadas y sus temas. Una con fecha posterior a hoy **no se dio**, y se ignora. */
  dictadas: ReadonlyArray<{ cursadaId: string; fecha: string; temas: readonly string[] }>;
  evaluaciones: ReadonlyArray<{ cursadaId: string; nombre: string; fecha: string; rotulo: string | null }>;
  compromisos: ReadonlyArray<{ cursadaId: string; inicio: string; minutos: number; titulo: string }>;
  disponibilidad: ReadonlyArray<{ dia: number | null; desde: string | null; hasta: string | null; minutos: number | null }>;
}

export type HorarioDeHoy =
  | { tipo: "EVALUACION"; cursadaId: string; nombre: string; rotulo: string | null }
  | { tipo: "COMPROMISO"; cursadaId: string; hora: string; titulo: string }
  | { tipo: "DISPONIBLE"; desde: string | null; hasta: string | null; minutos: number | null };

export interface Cuadro {
  clases: Array<{
    cursadaId: string;
    nombre: string;
    desde: string;
    hasta: string;
    aula: string | null;
    /** La unidad de la última clase dada. `null` ⇒ no hay ninguna con temas. */
    unidad: number | null;
    estimada: boolean;
  }>;
  avanzar: Array<{ cursadaId: string; nombre: string; unidades: number[]; resto: number }>;
  /** `true` ⇒ no hay ninguna clase dada todavía, y *Podés avanzar* vacío no significa «todo hecho». */
  sinClasesDadas: boolean;
  horarios: HorarioDeHoy[];
}

const hhmm = (t: string) => t.slice(0, 5);

function horaEnZona(instante: number, zona: string): string {
  return new Date(instante + desplazamiento(instante, zona)).toISOString().slice(11, 16);
}

function claveDeHorario(h: HorarioDeHoy): string {
  if (h.tipo === "EVALUACION") return "00:00";
  if (h.tipo === "COMPROMISO") return h.hora;
  return h.desde ? hhmm(h.desde) : "99:99";
}

export function cuadroDeHoy(e: EntradaDelCuadro): Cuadro {
  const dia = diaDeSemana(e.hoy);
  const nombres = new Map(e.materias.map((m) => [m.cursadaId, m.nombre]));
  const numero = new Map(e.materias.flatMap((m) => m.unidades.map((u) => [u.id, u.numero] as const)));

  const dadas = e.dictadas.filter((d) => d.fecha.slice(0, 10) <= e.hoy);

  /** Por dónde va la materia: la unidad más alta de su clase dada más reciente. */
  function unidadActual(cursadaId: string): number | null {
    const conTemas = dadas.filter((d) => d.cursadaId === cursadaId && d.temas.length > 0);
    if (conTemas.length === 0) return null;
    const ultima = conTemas.reduce((a, b) => (b.fecha > a.fecha ? b : a));
    const numeros = ultima.temas.map((t) => numero.get(t) ?? null).filter((n): n is number => n !== null);
    return numeros.length > 0 ? Math.max(...numeros) : null;
  }

  const clases = e.clases
    .filter((c) => c.dia === dia && nombres.has(c.cursadaId))
    .map((c) => ({
      cursadaId: c.cursadaId,
      nombre: nombres.get(c.cursadaId) as string,
      desde: hhmm(c.desde),
      hasta: hhmm(c.hasta),
      aula: c.aula,
      unidad: unidadActual(c.cursadaId),
      estimada: c.estimada,
    }))
    .sort((a, b) => a.desde.localeCompare(b.desde));

  const temasDados = new Set(dadas.flatMap((d) => d.temas));
  const avanzar = e.materias
    .map((m) => {
      const pendientes = m.unidades
        // Sin número no hay «Un. N» que escribir, y no se le inventa uno.
        .filter((u) => temasDados.has(u.id) && !u.conEvidencia && u.numero !== null)
        .map((u) => u.numero as number)
        .sort((a, b) => a - b);
      return {
        cursadaId: m.cursadaId,
        nombre: m.nombre,
        unidades: pendientes.slice(0, UNIDADES_POR_MATERIA),
        resto: Math.max(0, pendientes.length - UNIDADES_POR_MATERIA),
      };
    })
    .filter((a) => a.unidades.length > 0)
    .slice(0, MATERIAS_PARA_AVANZAR);

  const horarios: HorarioDeHoy[] = [
    ...e.evaluaciones
      .filter((ev) => ev.fecha.slice(0, 10) === e.hoy)
      .map((ev) => ({ tipo: "EVALUACION" as const, cursadaId: ev.cursadaId, nombre: ev.nombre, rotulo: ev.rotulo })),
    ...e.compromisos
      .filter((c) => fechaEnZona(Date.parse(c.inicio), e.zona) === e.hoy)
      .map((c) => ({
        tipo: "COMPROMISO" as const,
        cursadaId: c.cursadaId,
        hora: horaEnZona(Date.parse(c.inicio), e.zona),
        titulo: c.titulo,
      })),
    ...e.disponibilidad
      // Una franja sin día no se puede ubicar en ninguno.
      .filter((d) => d.dia === dia && (d.desde !== null || d.minutos !== null))
      .map((d) => ({ tipo: "DISPONIBLE" as const, desde: d.desde, hasta: d.hasta, minutos: d.minutos })),
  ].sort((a, b) => claveDeHorario(a).localeCompare(claveDeHorario(b)));

  return { clases, avanzar, sinClasesDadas: temasDados.size === 0, horarios };
}
