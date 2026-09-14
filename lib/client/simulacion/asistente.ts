/**
 * El guion **simulado** del asistente de reportes y mejoras —
 * [ADR-101](../../../docs/decisions.md#adr-101).
 *
 * ⚠️ **Nada de esto se envía.** El owner pidió el asistente *"tal cual así"* y
 * *"por ahora simulá las respuestas, después con el backend conectamos todo"*.
 * Las respuestas salen de este guion fijo, sin red y sin persistencia, y el
 * asistente sólo se dibuja con `MODO_PRUEBA=1`, rotulado *Simulado*.
 *
 * ⚠️ **No es el contrato del backend.** Cuando exista, la pregunta aclaratoria y
 * el resumen los escribe él; esta máquina de fases **se reemplaza**, no se
 * extiende. Por eso el resumen **no parafrasea**: cita lo que el estudiante
 * escribió. Un guion que inventara una paráfrasis estaría afirmando algo que
 * nadie dijo.
 *
 * Puro: sin React, sin timers. El componente decide cuándo aparece la respuesta.
 */

export type TipoDeReporte = "PROBLEMA" | "MEJORA";

export interface Adjunto {
  id: string;
  nombre: string;
  /** `blob:` del navegador. Vive lo que dura la conversación. */
  url: string;
}

/** Lo que el estudiante quiere mandar, tal cual lo escribió. */
export interface Borrador {
  tipo: TipoDeReporte;
  descripcion: string;
  /** La respuesta a la pregunta aclaratoria. `null` ⇒ la línea no se dibuja. */
  aclaracion: string | null;
  correcciones: string[];
  adjuntos: number;
}

export type Mensaje =
  | { id: string; clase: "ASISTENTE"; texto: string }
  | { id: string; clase: "ESTUDIANTE"; texto: string; adjuntos: Adjunto[] }
  /** La tarjeta *Tu sugerencia*. Sólo la última ofrece confirmar o corregir. */
  | { id: string; clase: "RESUMEN"; borrador: Borrador }
  | { id: string; clase: "ENVIADO" };

export type Fase =
  /** Ofrece las dos opciones. Es el saludo y también lo que sigue a un envío. */
  | { fase: "ELEGIR" }
  /** Escribió antes de elegir: se guarda el texto y se pregunta qué es. */
  | { fase: "TIPO_PENDIENTE"; descripcion: string; adjuntos: number }
  | { fase: "DESCRIBIR"; tipo: TipoDeReporte }
  | { fase: "ACLARAR"; tipo: TipoDeReporte; descripcion: string; adjuntos: number }
  | { fase: "CONFIRMAR"; borrador: Borrador }
  | { fase: "CORREGIR"; borrador: Borrador };

export type Entrada =
  | { entrada: "ELEGIR"; tipo: TipoDeReporte }
  | { entrada: "TEXTO"; texto: string; adjuntos: Adjunto[] }
  | { entrada: "CONFIRMAR" }
  | { entrada: "CORREGIR" };

export interface Turno {
  fase: Fase;
  /** Lo que se dibuja apenas el estudiante actúa. */
  delEstudiante: Mensaje[];
  /** Lo que se dibuja después del «escribiendo». */
  delAsistente: Mensaje[];
}

export const GUION = {
  SALUDO:
    "¡Hola! Soy el asistente de Achieve. Contame si encontraste un problema o se te ocurrió una mejora, y yo me encargo de que le llegue al equipo.",
  ELEGIDO: {
    PROBLEMA: "Quiero reportar un problema.",
    MEJORA: "Quiero sugerir una mejora.",
  },
  ELEGIDO_DESPUES: {
    PROBLEMA: "Es un problema.",
    MEJORA: "Es una mejora.",
  },
  PEDIR_DESCRIPCION: {
    PROBLEMA: "Gracias por avisar. Contame qué pasó y, si podés, pegá una captura.",
    MEJORA: "¡Buenísimo! Contame, ¿qué mejora tenés en mente?",
  },
  PEDIR_TIPO: "Gracias. ¿Lo mandamos como un problema o como una mejora?",
  PEDIR_ACLARACION: {
    PROBLEMA:
      "Una pregunta para entender mejor: ¿en qué pantalla estabas, y te pasa siempre o fue una sola vez?",
    MEJORA:
      "Buena idea. Una pregunta para entender mejor: ¿en qué parte de Achieve lo usarías y qué te resolvería?",
  },
  PREGUNTAR_SI_QUEDO_BIEN: "¿Te parece que quedó bien así o querés corregir algo?",
  CONFIRMO: "Confirmo el reporte.",
  QUIERO_CORREGIR: "Quiero corregir algo.",
  PEDIR_CORRECCION: "Dale, contame qué querés cambiar.",
  ALGO_MAS: "¿Hay algo más que quieras reportar?",
} as const;

export const FASE_INICIAL: Fase = { fase: "ELEGIR" };

let secuencia = 0;
function id(): string {
  secuencia += 1;
  return `m-${secuencia}`;
}

export function saludo(): Mensaje[] {
  return [{ id: id(), clase: "ASISTENTE", texto: GUION.SALUDO }];
}

const asistente = (texto: string): Mensaje => ({ id: id(), clase: "ASISTENTE", texto });
const estudiante = (texto: string, adjuntos: Adjunto[] = []): Mensaje => ({
  id: id(),
  clase: "ESTUDIANTE",
  texto,
  adjuntos,
});

/** ¿Se ofrecen *Reportar un problema* y *Sugerir una mejora* debajo del último mensaje? */
export function ofreceOpciones(fase: Fase): boolean {
  return fase.fase === "ELEGIR" || fase.fase === "TIPO_PENDIENTE";
}

function mostrarResumen(borrador: Borrador, delEstudiante: Mensaje[]): Turno {
  return {
    fase: { fase: "CONFIRMAR", borrador },
    delEstudiante,
    delAsistente: [
      { id: id(), clase: "RESUMEN", borrador },
      asistente(GUION.PREGUNTAR_SI_QUEDO_BIEN),
    ],
  };
}

/**
 * Un paso de la conversación. **Una entrada que la fase no espera no hace
 * nada** —devuelve la misma fase y ningún mensaje—: un clic viejo sobre una
 * tarjeta ya reemplazada no puede enviar un reporte.
 */
export function avanzar(fase: Fase, e: Entrada): Turno {
  const nada: Turno = { fase, delEstudiante: [], delAsistente: [] };

  if (e.entrada === "TEXTO" && e.texto.trim() === "" && e.adjuntos.length === 0) return nada;
  const texto = e.entrada === "TEXTO" ? e.texto.trim() : "";
  const suyo = e.entrada === "TEXTO" ? [estudiante(texto, e.adjuntos)] : [];
  const adjuntos = e.entrada === "TEXTO" ? e.adjuntos.length : 0;

  switch (fase.fase) {
    case "ELEGIR":
      if (e.entrada === "ELEGIR") {
        return {
          fase: { fase: "DESCRIBIR", tipo: e.tipo },
          delEstudiante: [estudiante(GUION.ELEGIDO[e.tipo])],
          delAsistente: [asistente(GUION.PEDIR_DESCRIPCION[e.tipo])],
        };
      }
      if (e.entrada === "TEXTO") {
        return {
          fase: { fase: "TIPO_PENDIENTE", descripcion: texto, adjuntos },
          delEstudiante: suyo,
          delAsistente: [asistente(GUION.PEDIR_TIPO)],
        };
      }
      return nada;

    case "TIPO_PENDIENTE":
      if (e.entrada === "ELEGIR") {
        return {
          fase: { fase: "ACLARAR", tipo: e.tipo, descripcion: fase.descripcion, adjuntos: fase.adjuntos },
          delEstudiante: [estudiante(GUION.ELEGIDO_DESPUES[e.tipo])],
          delAsistente: [asistente(GUION.PEDIR_ACLARACION[e.tipo])],
        };
      }
      if (e.entrada === "TEXTO") {
        return {
          fase: {
            fase: "TIPO_PENDIENTE",
            descripcion: [fase.descripcion, texto].filter(Boolean).join(" "),
            adjuntos: fase.adjuntos + adjuntos,
          },
          delEstudiante: suyo,
          delAsistente: [asistente(GUION.PEDIR_TIPO)],
        };
      }
      return nada;

    case "DESCRIBIR":
      if (e.entrada !== "TEXTO") return nada;
      return {
        fase: { fase: "ACLARAR", tipo: fase.tipo, descripcion: texto, adjuntos },
        delEstudiante: suyo,
        delAsistente: [asistente(GUION.PEDIR_ACLARACION[fase.tipo])],
      };

    case "ACLARAR":
      if (e.entrada !== "TEXTO") return nada;
      return mostrarResumen(
        {
          tipo: fase.tipo,
          descripcion: fase.descripcion,
          aclaracion: texto || null,
          correcciones: [],
          adjuntos: fase.adjuntos + adjuntos,
        },
        suyo,
      );

    case "CONFIRMAR":
      if (e.entrada === "CONFIRMAR") {
        return {
          fase: { fase: "ELEGIR" },
          delEstudiante: [estudiante(GUION.CONFIRMO)],
          delAsistente: [{ id: id(), clase: "ENVIADO" }, asistente(GUION.ALGO_MAS)],
        };
      }
      if (e.entrada === "CORREGIR") {
        return {
          fase: { fase: "CORREGIR", borrador: fase.borrador },
          delEstudiante: [estudiante(GUION.QUIERO_CORREGIR)],
          delAsistente: [asistente(GUION.PEDIR_CORRECCION)],
        };
      }
      // Escribir con la tarjeta a la vista es corregir sin apretar el botón.
      if (e.entrada === "TEXTO") return corregir(fase.borrador, texto, adjuntos, suyo);
      return nada;

    case "CORREGIR":
      if (e.entrada !== "TEXTO") return nada;
      return corregir(fase.borrador, texto, adjuntos, suyo);
  }
}

function corregir(borrador: Borrador, texto: string, adjuntos: number, suyo: Mensaje[]): Turno {
  return mostrarResumen(
    {
      ...borrador,
      correcciones: texto ? [...borrador.correcciones, texto] : borrador.correcciones,
      adjuntos: borrador.adjuntos + adjuntos,
    },
    suyo,
  );
}

/**
 * Las líneas de la tarjeta. **Citan, no parafrasean**: sin backend no hay quién
 * resuma, y un resumen inventado pondría en boca del estudiante algo que no dijo.
 */
export function lineasDelResumen(b: Borrador): string[] {
  const lineas: string[] = [];
  // Mandó sólo una captura: sin texto que citar, la línea no se dibuja.
  if (b.descripcion) lineas.push(`${b.tipo === "MEJORA" ? "Proponés" : "Reportás"}: ${b.descripcion}`);
  if (b.aclaracion) lineas.push(`Lo que agregaste: ${b.aclaracion}`);
  for (const c of b.correcciones) lineas.push(`Corrección: ${c}`);
  if (b.adjuntos > 0) lineas.push(b.adjuntos === 1 ? "Con 1 captura." : `Con ${b.adjuntos} capturas.`);
  return lineas;
}
