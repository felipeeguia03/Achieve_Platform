import type {
  ActivacionExamenProps,
  DatoDeEvaluacion,
  EstadoActivacion,
  OpcionDeEvaluacion,
} from "@/lib/domain/view-models";
import { provenanceVisible, type SourceType, type VerificationStatus } from "@/lib/content/provenance";
import { fechaDeCalendario } from "./tiempo";

/**
 * `UX07` proyectada desde datos persistidos (Etapa B5.5).
 *
 * La matriz de §VI.7 §16 sigue siendo la que manda; lo que cambia es de dónde
 * salen las condiciones. Antes las declaraba un fixture, ahora las trae la
 * base — y la función resuelve el estado **sin calcular elegibilidad**.
 *
 * Eso último no es una omisión: `product.md` §9 lo fija —*"la UI no calcula la
 * ventana: consume una señal ya emitida"*— porque `C01-024` sigue abierto. La
 * señal emitida es **la preparación en `RECOMMENDED`**. Sin ella no hay nada
 * que activar, y esta proyección lo dice en vez de inventarse un umbral de días.
 */
export interface EvaluacionElegible {
  id: string;
  titulo: string;
  fechaEn: string | null;
  modalidad: string | null;
  fuente: SourceType | null;
  verificacion: VerificationStatus | null;
  tieneProtocolo: boolean;
  preparacion: { id: string; status: string } | null;
}

export interface EstadoDeActivacion {
  instante: string;
  zona: string;
  cursadaId: string;
  materia: string;
  comision: string | null;
  evaluaciones: EvaluacionElegible[];
}

export interface RepositorioDeActivacion {
  estadoDeActivacion(
    institutionId: string,
    studentId: string,
    ahora: string,
    courseEnrollmentId?: string | null,
  ): Promise<EstadoDeActivacion | null>;
}

const MODALIDADES_P0: Record<string, string> = {
  practico: "Práctico",
  teorico_escrito: "Teórico escrito",
};

const QUE_CAMBIA = ["Se crea una preparación sólo para esta evaluación."] as const;
const QUE_NO_CAMBIA = [
  "Cursado, progreso y Bitácora siguen disponibles.",
  "No crea Action ni Commitment.",
] as const;
const DESPUES =
  "Abriremos el contexto de esta preparación. Todavía no se crea una Action ni un Commitment.";

/** §22.1 — el título lo fija el estado, no la pantalla. */
const TITULO: Record<EstadoActivacion, string> = {
  RECOMENDACION: "RECOMENDACIÓN DE ACTIVACIÓN",
  REVISION_MANUAL: "REVISIÓN MANUAL",
  SELECCION: "ELEGÍ LA EVALUACIÓN",
  SIN_ASSESSMENT: "SIN EVALUACIÓN CARGADA",
  FALTAN_DATOS: "FALTAN DATOS DE LA EVALUACIÓN",
  FECHA_DESCONOCIDA: "FECHA NO DISPONIBLE",
  MODALIDAD_DESCONOCIDA: "MODALIDAD NO DISPONIBLE",
  FUERA_DE_P0: "MODALIDAD FUERA DE ESTA VERSIÓN",
  YA_ACTIVA: "PREPARACIÓN YA ACTIVA",
  CAMBIO_DE_FECHA: "LA FECHA CAMBIÓ",
  CANCELADA: "EVALUACIÓN CANCELADA",
  PASADA: "LA EVALUACIÓN YA PASÓ",
  CONTRADICTORIOS: "DATOS CONTRADICTORIOS",
  NO_DISPONIBLE: "SIN RECOMENDACIÓN DE ACTIVACIÓN",
  VERIFICANDO: "VERIFICANDO",
  HANDOFF_NO_DISPONIBLE: "NO SE PUEDE ABRIR LA PREPARACIÓN",
};

function datosDe(ev: EvaluacionElegible): DatoDeEvaluacion[] {
  const provenance = provenanceVisible(ev.fuente, ev.verificacion);
  const datos: DatoDeEvaluacion[] = [];
  // Una fecha desconocida **no se estima**: la fila desaparece.
  if (ev.fechaEn) {
    // `assessment_date` es un `DATE`: se formatea sin zona. Ver `fechaDeCalendario`.
    datos.push({ label: "Fecha", valor: fechaDeCalendario(ev.fechaEn), provenance, anterior: null });
  }
  if (ev.modalidad) {
    // El enum no es copy: `practico` no se muestra. Una modalidad fuera de P0
    // se nombra tal como vino, sin mapearla a una de las dos (`C01-047`).
    datos.push({
      label: "Modalidad",
      valor: MODALIDADES_P0[ev.modalidad] ?? ev.modalidad,
      provenance,
      anterior: null,
    });
  }
  return datos;
}

/**
 * El estado, resuelto por el primero que aplique.
 *
 * `YA_ACTIVA` va primero por §21.3: cuando ya existe `ACTIVE`, *"el estado
 * reemplaza el CTA de activación"*, y eso vale aunque a la evaluación le falten
 * datos — la preparación ya corre.
 */
function estadoDe(ev: EvaluacionElegible, ahora: string): EstadoActivacion {
  if (ev.preparacion?.status === "ACTIVE") return "YA_ACTIVA";
  if (ev.preparacion?.status === "BLOCKED") return "HANDOFF_NO_DISPONIBLE";
  if (ev.fechaEn && ev.fechaEn < ahora.slice(0, 10)) return "PASADA";
  if (!ev.fechaEn && !ev.modalidad) return "FALTAN_DATOS";
  // Sin protocolo para la modalidad no hay contra qué correr la preparación.
  // `C01-047` deja `oral` fuera de P0 y **no se la mapea** a una de las dos.
  if (ev.modalidad && !ev.tieneProtocolo) return "FUERA_DE_P0";
  if (!ev.modalidad) return "MODALIDAD_DESCONOCIDA";
  if (!ev.fechaEn) return "FECHA_DESCONOCIDA";
  return "RECOMENDACION";
}

const AVISO: Partial<Record<EstadoActivacion, string>> = {
  SIN_ASSESSMENT: "Todavía no hay una evaluación cargada para esta materia.",
  NO_DISPONIBLE: "Todavía no hay una recomendación de activación para esta materia.",
  FUERA_DE_P0: "Esta modalidad todavía no tiene protocolo en Achieve.",
  PASADA: "Esta evaluación ya pasó.",
  HANDOFF_NO_DISPONIBLE: "La preparación está bloqueada y no se puede abrir desde acá.",
};

/** Qué falta para poder activar. Lista corta, y vacía se omite (§16.6). */
function faltantesDe(ev: EvaluacionElegible): string[] {
  const faltan: string[] = [];
  if (!ev.fechaEn) faltan.push("Fecha de la evaluación");
  if (!ev.modalidad) faltan.push("Modalidad");
  return faltan;
}

export function proyectarActivacion(estado: EstadoDeActivacion): ActivacionExamenProps {
  const { materia, comision, instante } = estado;
  const volver = `VOLVER A ${materia.toUpperCase()}`;

  const base = {
    materia,
    comision,
    queCambia: QUE_CAMBIA,
    queNoCambia: QUE_NO_CAMBIA,
    despues: DESPUES,
    ctaRetorno: volver,
    opciones: null,
    razonAparicion: null as string | null,
    faltantes: [] as readonly string[],
  };

  if (estado.evaluaciones.length === 0) {
    return {
      ...base,
      estado: "SIN_ASSESSMENT",
      preparacionId: null,
      titulo: TITULO.SIN_ASSESSMENT,
      evaluacion: null,
      datos: [],
      aviso: AVISO.SIN_ASSESSMENT!,
      despues: null,
      ctaPrimaria: null,
    };
  }

  // Sólo las que traen una señal emitida compiten. Una evaluación sin
  // preparación es contexto de la materia, no una recomendación de activación.
  const conSenal = estado.evaluaciones.filter((e) => e.preparacion !== null);

  if (conSenal.length === 0) {
    return {
      ...base,
      estado: "NO_DISPONIBLE",
      preparacionId: null,
      titulo: TITULO.NO_DISPONIBLE,
      evaluacion: null,
      datos: [],
      aviso: AVISO.NO_DISPONIBLE!,
      despues: null,
      ctaPrimaria: null,
    };
  }

  // Varias recomendaciones vivas ⇒ elige la persona. **La lista conserva el
  // orden recibido y no se rankea**: decidir cuál es "la más urgente" sería
  // exactamente la elegibilidad que `C01-024` deja abierta.
  if (conSenal.filter((e) => e.preparacion!.status === "RECOMMENDED").length > 1) {
    const opciones: OpcionDeEvaluacion[] = conSenal.map((e) => ({
      id: e.preparacion!.id,
      evaluacion: e.titulo,
      datos: datosDe(e),
      seleccionada: false,
    }));
    return {
      ...base,
      estado: "SELECCION",
      // En `SELECCION` no hay objeto: lo elige la persona entre las opciones.
      preparacionId: null,
      titulo: TITULO.SELECCION,
      evaluacion: null,
      datos: [],
      aviso: null,
      opciones,
      ctaPrimaria: null,
    };
  }

  const ev = conSenal[0];
  const cual = estadoDe(ev, instante);
  const faltantes = faltantesDe(ev);
  const activable = cual === "RECOMENDACION";

  return {
    ...base,
    estado: cual,
    preparacionId: ev.preparacion!.id,
    titulo: TITULO[cual],
    evaluacion: ev.titulo,
    datos: datosDe(ev),
    // La razón **recibida**, no una calculada. Hoy la única señal es que existe
    // una preparación recomendada, y eso es lo que se dice.
    razonAparicion: activable
      ? "Apareció porque el servicio propietario emitió una recomendación de preparación para esta evaluación."
      : null,
    faltantes,
    aviso: AVISO[cual] ?? null,
    despues: activable ? DESPUES : null,
    // Sin CTA deshabilitada de adorno: §21.3 prohíbe conservar un "Activar"
    // apagado que sugiera una segunda operación.
    ctaPrimaria: activable
      ? { texto: "ACTIVAR PREPARACIÓN DE ESTE EXAMEN", habilitada: true }
      : null,
  };
}
