/**
 * 🧪 **SPIKE DESCARTABLE — el copy del laboratorio.**
 *
 * ⚠️ **No va a `lib/content/es-AR.ts` a propósito.** Ese archivo es el copy del
 * producto y tiene guards que lo auditan; meter acá textos que el Product Owner
 * todavía no aprobó los volvería parte del producto antes de tiempo. Viven con
 * ID (`C-07`) pero **dentro de la carpeta que se borra**.
 *
 * Reglas que respeta, aunque ningún guard lo mire: voseo; *"trabajo pendiente
 * estimado"* y nunca *"las materias piden"* (ADR-075 §A2); ninguna predicción,
 * readiness ni puntaje; el enum técnico nunca se lee.
 *
 * ## Tres cambios respecto del copy sugerido, y por qué
 *
 * - *"Ayer no pudiste"* → *"Ayer no se empezó el compromiso…"*. «No pudiste» le
 *   atribuye la causa a la persona; el hecho es que el bloque pasó sin empezar
 *   (ADR-075: el mensaje se refiere a la tarea, no a quien la hace).
 * - *"SIMULACIÓN"* en mayúsculas → *"Simulación"*: el repo no dibuja rótulos en
 *   mayúsculas (`tests/titulos.test.tsx`).
 * - *"Progreso constatado"* → *"Progreso registrado"*: es el nombre de la
 *   operación que ya existe (`registrarProgreso`, ADR-047).
 */

import type { SpikeEstado, SpikeScenario } from "./tipos";

export const COPY = {
  "LAB.RIBETE": "Laboratorio · Datos de demostración",
  "LAB.RIBETE.DETALLE": "Nada de lo que hagas acá se guarda: al refrescar vuelve al lunes 14, 17:30.",
  "LAB.RELOJ": "Reloj del demo",

  "VISTA.PLAN": "Plan",
  "VISTA.CALENDARIO": "Calendario",

  "INDICADOR.PENDIENTE": "Trabajo pendiente estimado",
  "INDICADOR.DISPONIBLE": "Tiempo disponible",
  "INDICADOR.SIN_UBICAR": "Sin ubicar",
  "INDICADOR.MARGEN": "Margen",

  "CAMINO.TITULO": "Tu semana",
  "CAMINO.AHORA": "Ahora",
  "CAMINO.YA_PASO": "ya pasó",
  "CAMINO.CARRIL.FACULTAD": "Facultad",
  "CAMINO.CARRIL.COMPROMISOS": "Compromisos",
  "CAMINO.CARRIL.ACCIONES": "Próximas acciones",
  "CAMINO.CARRIL.MARGEN": "Disponible y margen",
  "CAMINO.POR_UBICAR": "Por ubicar",
  "CAMINO.POR_UBICAR.VACIO": "Todo el trabajo pendiente tiene lugar esta semana.",
  "CAMINO.REUBICAR": "Necesita reubicación",
  "CAMINO.DISPONIBLE": "Disponible",
  "CAMINO.DISPONIBLE_NUEVO": "Nueva",
  "CAMINO.MARGEN": "Margen",
  "CAMINO.ANTES_DEL_PARCIAL": "antes del parcial",
  "CAMINO.HUELLA": "antes acá",
  "CAMINO.REQUIERE": "después de",
  "CAMINO.DESPLAZAR": "Deslizá para ver toda la semana",

  "LEYENDA.TITULO": "Cómo se lee",
  "LEYENDA.INSTITUCIONAL": "Facultad · no se mueve",
  "LEYENDA.CONFIRMADO": "Compromiso confirmado",
  "LEYENDA.SUGERIDA": "Propuesta, sin comprometer",
  "LEYENDA.EVIDENCIA": "Evidencia enviada, sin revisar",
  "LEYENDA.PROGRESO": "Progreso registrado",
  "LEYENDA.INCUMPLIDO": "Incumplido",
  "LEYENDA.SIMULADO": "Resultado simulado",
  "LEYENDA.HUELLA": "Posición anterior",
  "LEYENDA.MARGEN": "Margen",

  "CONTROL.DISPONIBILIDAD": "Reajustar disponibilidad",
  "CONTROL.DISPONIBILIDAD.OPCION": "Esta semana tengo 5 horas más",
  "CONTROL.DISPONIBILIDAD.AYUDA": "Es el único escenario preparado: no hay un editor de horarios.",
  "CONTROL.RELOJ": "Adelantar reloj",
  "CONTROL.RELOJ.OPCION": "Jueves 17 de septiembre · 19:10",
  "CONTROL.RELOJ.AYUDA": "Salta a después del compromiso del miércoles, sin que nada se haya registrado.",
  "CONTROL.RESTABLECER": "Restablecer fixture",
  "CONTROL.SOLO_DESDE_BASE": "Restablecé el fixture para probar este escenario.",

  "ACCION.ETIQUETA": "Próxima acción",
  "ACCION.DURACION": "Duración",
  "ACCION.PROBABLE": "probable",
  "ACCION.CONFIANZA": "Confianza",
  "ACCION.FUENTE": "Fuente",
  "ACCION.EVIDENCIA": "Evidencia esperada",
  "ACCION.POR_QUE": "Por qué ésta",
  "ACCION.ALTERNATIVAS": "Frente a las otras opciones",
  "ACCION.PISTA": "Pasá el mouse o enfocá esta tarjeta para ver qué cambiaría. Clic o Enter la deja fija.",
  "ACCION.PISTA_TACTIL": "Tocá la tarjeta para ver qué cambiaría.",
  "ACCION.SIMULANDO": "Simulando",
  "ACCION.FIJADA": "Fijada",
  "ACCION.NO_DISPONIBLE": "La simulación de esta acción está preparada sobre el plan del lunes. Restablecé el fixture para verla.",

  "RAZON.LIMITES.1": "Corresponde al parcial del viernes, el más cercano.",
  "RAZON.LIMITES.2": "Límites todavía no tiene práctica constatada.",
  "RAZON.LIMITES.3": "Desbloquea Teoría y Práctica de Derivadas.",
  "RAZON.LIMITES.4": "Su duración probable entra en tu bloque de hoy, 18:00–19:00. Si se estira al máximo, pasa 5 min.",
  "RAZON.LIMITES.5": "El último registro de Límites es del martes 8 de septiembre: hace 6 días.",

  "SIM.RIBETE": "Simulación · Todavía no cambió tu plan",
  "SIM.SUPUESTO": "Si completás esta acción, la evidencia resulta suficiente y después se registra el progreso…",
  "SIM.PASO.1": "Hacés la práctica",
  "SIM.PASO.2": "Enviás la evidencia",
  "SIM.PASO.3": "La evidencia resulta suficiente",
  "SIM.PASO.4": "Se registra el progreso",
  "SIM.PASO.5": "El plan se recalcula",
  "SIM.PASOS.NOTA": "Son cinco hechos distintos: que ocurra uno no hace que ocurra el siguiente.",
  "SIM.MENSAJE": "Al constatar Límites, Derivadas puede empezar antes y recuperás margen antes del parcial.",
  "SIM.VOLVER": "Volver al plan actual",
  "SIM.SUPUESTOS": "Supuestos de la simulación",
  "SIM.SUPUESTO.A": "Hacés Límites en su bloque de hoy.",
  "SIM.SUPUESTO.B": "El repaso previo de Límites deja de hacer falta, porque Límites queda constatado.",
  "SIM.SUPUESTO.C": "Las demás duraciones quedan en su valor probable.",
  "SIM.SUPUESTO.D": "Las ubicaciones están preparadas a mano para este demo: no las calculó un motor.",

  "DIFF.CAMBIO": "Qué cambió",
  "DIFF.IGUAL": "Qué quedó igual",
  "DIFF.IGUAL.RESTRICCIONES": "Las clases, el parcial y el compromiso, en el mismo lugar.",
  "DIFF.NADA": "Nada cambió.",

  "DISP.RIBETE": "Vista previa · No guardada",
  "DISP.RIBETE_APLICADA": "Aplicado sólo en este demo · se pierde al refrescar",
  "DISP.MENSAJE": "Agregar disponibilidad no reduce el trabajo académico. Le da al plan más lugares posibles para ubicarlo.",
  "DISP.NUEVAS": "Franjas nuevas",
  "DISP.FIJO": "Qué queda fijo",
  "DISP.FIJO.DETALLE": "Clases, parcial y compromiso no se mueven. Sólo cambian propuestas, márgenes y lo que queda por ubicar.",
  "DISP.APLICAR": "Aplicar solamente en este demo",
  "DISP.DESCARTAR": "Descartar",

  "RELOJ.TITULO": "Ayer no se empezó el compromiso de Arquitectura",
  "RELOJ.BAJADA": "Reorganicemos sin cortar. El compromiso queda como incumplido, su trabajo sigue pendiente y nada se movió solo.",
  "RELOJ.CTA": "Reorganizar sin cortar",
  "RELOJ.VER": "Ver qué pasó",
  "RELOJ.HECHO": "Lo que pasó",
  "RELOJ.HECHO.DETALLE": "El compromiso del miércoles 16, 17:00–18:00 (60 min), no se empezó. Queda como incumplido y no se borra.",
  "RELOJ.TRABAJO": "Lo que sigue pendiente",
  "RELOJ.TRABAJO.DETALLE": "Resumir Unidad 4: Jerarquía de memoria. Sin hora hasta que elijas una.",
  "RELOJ.PROPUESTA": "Lo que falta decidir",
  "RELOJ.PROPUESTA.DETALLE": "Cualquier horario nuevo necesita tu confirmación. Nada se reubicó solo.",
  "RELOJ.PROPUESTAS_PASADAS": "Las propuestas de lunes a miércoles no quedan como incumplidas: no eran compromisos. Siguen pendientes.",
  "RELOJ.DISPONIBILIDAD_PASADA": "La disponibilidad de lunes a miércoles ya pasó y dejó de contar.",

  "RESCATE.RIBETE": "Vista previa · Sin confirmar",
  "RESCATE.MENSAJE": "El trabajo del compromiso podría ir el sábado a las 10:00. Para eso, Caché queda por ubicar: no hay lugar para los dos.",
  "RESCATE.NO_SE_CONFIRMA": "Confirmar un horario nuevo es otro paso, y en este demo no se hace.",
  "RESCATE.DESCARTAR": "Descartar la propuesta",

  "CAL.TITULO": "Calendario",
  "CAL.SOLO_LECTURA": "Sólo lectura · la misma información que el Plan",
  "CAL.VER": "Ver en Calendario",
  "CAL.VOLVER": "Volver al plan",
  "CAL.CAMPO.ID": "Identificador",
  "CAL.CAMPO.MATERIA": "Materia",
  "CAL.CAMPO.ACCION": "Acción",
  "CAL.CAMPO.DIA": "Día",
  "CAL.CAMPO.HORA": "Hora",
  "CAL.CAMPO.DURACION": "Duración",
  "CAL.CAMPO.ESTADO": "Estado",

  "BLOQUE.SELECCIONADO": "Bloque seleccionado",
} as const;

export type ClaveDeCopy = keyof typeof COPY;

export const t = (clave: ClaveDeCopy): string => COPY[clave];

export const ESTADO_VISIBLE: Readonly<Record<SpikeEstado, string>> = {
  INSTITUCIONAL: "Facultad",
  COMPROMISO_CONFIRMADO: "Confirmado",
  SUGERIDA: "Propuesta",
  EVIDENCIA_PENDIENTE: "Evidencia enviada",
  PROGRESO_REGISTRADO: "Progreso registrado",
  INCUMPLIDO: "Incumplido",
  NECESITA_REUBICACION: "Necesita reubicación",
  PROPUESTA_SIN_CONFIRMAR: "Sin confirmar",
};

export const CONFIANZA_VISIBLE = { baja: "baja", media: "media", alta: "alta" } as const;

/** El encabezado narrativo de cada escenario. Las cifras llegan calculadas. */
export function encabezado(
  escenario: SpikeScenario,
  c: { pendiente: string; disponible: string; sinUbicar: string; margen: string },
): { titulo: string; bajada: string } {
  switch (escenario) {
    case "BASE":
      return {
        titulo: "Tu semana todavía no entra",
        bajada: `Tenés ${c.pendiente} de trabajo pendiente estimado y ${c.disponible} disponibles. Quedan ${c.sinUbicar} por ubicar.`,
      };
    case "COMPLETION_SIMULATION":
      return {
        titulo: "Así quedaría tu semana",
        bajada: `Al constatar Límites, Derivadas puede empezar antes y recuperás ${c.margen} antes del parcial.`,
      };
    case "EXTRA_AVAILABILITY_PREVIEW":
      return {
        titulo: "Con 5 horas más, la semana entra",
        bajada: `Todo el trabajo pendiente tendría lugar y quedarían ${c.margen} de margen. El trabajo sigue siendo ${c.pendiente}.`,
      };
    case "EXTRA_AVAILABILITY_APPLIED":
      return {
        titulo: "La semana entra, en este demo",
        bajada: `Sumaste 5 horas sólo acá: se pierden al refrescar. Quedan ${c.margen} de margen.`,
      };
    case "TIME_ADVANCED_MISSED":
      return { titulo: COPY["RELOJ.TITULO"], bajada: COPY["RELOJ.BAJADA"] };
    case "RESCUE_PREVIEW":
      return { titulo: "Así podría reorganizarse, sin confirmar nada", bajada: COPY["RESCATE.MENSAJE"] };
  }
}

/** Las razones de la recomendada, en orden. */
export const RAZONES_DE_LIMITES: readonly ClaveDeCopy[] = [
  "RAZON.LIMITES.1",
  "RAZON.LIMITES.2",
  "RAZON.LIMITES.3",
  "RAZON.LIMITES.4",
  "RAZON.LIMITES.5",
];
