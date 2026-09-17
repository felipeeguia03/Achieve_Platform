/**
 * La sesión de Focus para su pantalla — [ADR-104](../../../docs/decisions.md#adr-104).
 *
 * **Pura.** Recibe la fila, el contexto y el instante del servidor, y devuelve
 * lo que se dibuja. La fase y la recuperación **se deducen acá**, con el reloj
 * avanzado hasta `ahora`, sin escribir: un `GET` no muta.
 */
import {
  avanzarReloj,
  faseDe,
  posicionEnElCiclo,
  presetDe,
  resumenDe,
  segundosEntre,
  tramoAbierto,
} from "@/lib/domain/sesion-de-focus";
import type { FocusIniciable, FocusProps } from "@/lib/domain/view-models";
import type { CompromisoParaFocus, SesionFila } from "./focus";
import { horaCorta } from "./tiempo";

export interface ContextoDeFocus {
  materia: string | null;
  accion: string | null;
  unidad: string | null;
}

export function proyectarFocus(fila: SesionFila, contexto: ContextoDeFocus, zona: string, ahora: string): FocusProps {
  const s = avanzarReloj(fila.sesion, ahora);
  const fase = faseDe(s, ahora);
  const resumen = resumenDe(s, ahora);
  const abierto = fase === "RECUPERACION" || fase === "FINALIZADA" ? null : tramoAbierto(s.tramos);

  // El foco registrado **antes** del tramo abierto: la pantalla le suma lo que
  // corre desde `abierto.inicio`.
  const focoPrevioSegundos =
    abierto?.tipo === "FOCUS" ? Math.max(0, resumen.focoSegundos - segundosEntre(abierto.inicio, ahora)) : resumen.focoSegundos;

  const demora = segundosEntre(fila.horarioAcordado, s.iniciadaEn);
  return {
    id: fila.id,
    fase,
    cursadaId: fila.cursadaId,
    compromisoId: fila.compromisoId,
    materia: contexto.materia,
    accion: contexto.accion,
    unidad: contexto.unidad,
    acordado: { hora: horaCorta(fila.horarioAcordado, zona), minutos: fila.minutosAcordados },
    empezoA: horaCorta(s.iniciadaEn, zona),
    // Menos de un minuto no es demora: es el tiempo de apretar el botón.
    demoraMinutos: demora >= 60 ? Math.floor(demora / 60) : null,
    modo: s.modo,
    pomodoro: s.pomodoro,
    preset: s.pomodoro ? presetDe(s.pomodoro) : null,
    tramo: abierto
      ? {
          tipo: abierto.tipo,
          inicio: abierto.inicio,
          finPlaneado: abierto.finPlaneado,
          bloque: abierto.bloque,
          posicion: abierto.bloque !== null && s.pomodoro ? posicionEnElCiclo(abierto.bloque, s.pomodoro) : null,
          deBloques: abierto.bloque !== null && s.pomodoro ? s.pomodoro.bloquesAntesDelLargo : null,
          descanso: abierto.descanso,
        }
      : null,
    focoPrevioSegundos,
    servidorAhora: ahora,
    ultimoLatidoHora: horaCorta(s.ultimoLatido, zona),
    resumen,
    anotador: fila.anotador ?? "",
    avance: fila.avance,
    cierre: fila.cierre,
    terminadaA: s.terminadaEn ? horaCorta(s.terminadaEn, zona) : null,
  };
}

export function proyectarIniciable(c: CompromisoParaFocus, contexto: ContextoDeFocus, zona: string): FocusIniciable {
  return {
    compromisoId: c.id,
    cursadaId: c.cursadaId,
    materia: contexto.materia,
    accion: contexto.accion,
    unidad: contexto.unidad,
    hora: horaCorta(c.inicio, zona),
    minutos: c.minutos,
    esHora: c.estado === "DUE" || c.estado === "STARTED",
    yaEmpezado: c.estado === "STARTED",
  };
}
