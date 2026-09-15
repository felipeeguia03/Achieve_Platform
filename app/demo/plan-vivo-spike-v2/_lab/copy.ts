/**
 * 🧪 **LABORATORIO DESCARTABLE — el copy de V2.**
 *
 * ⚠️ **No va a `lib/content/es-AR.ts` a propósito**, igual que en V1: son textos
 * que el Product Owner todavía no aprobó. Viven con ID (`C-07`) dentro de la
 * carpeta que se borra.
 *
 * Reglas que respeta: voseo; el horizonte siempre dicho; ninguna predicción,
 * readiness, puntaje ni *"probabilidad"*; el mensaje va sobre la tarea, no sobre
 * la persona (ADR-075).
 *
 * ⚠️ **Una tensión, dicha:** el pedido fija *«Simular este workitem»*. El repo
 * prohíbe nombres del modelo en inglés en el copy del producto
 * (`tests/copy-sin-ingles.test.ts`, que mira `lib/content/`). Acá se respeta el
 * pedido porque es un laboratorio; en producto se diría *acción*.
 */

import { diaMedio, enHoras, franjaCorta } from "./formato";
import { MATERIAS } from "./fixture";
import { nombreCorto, tituloDe, workitem } from "./proyeccion";
import type { Confianza, EstadoEnPlan, PlanDiff, Prioridad, Proyeccion } from "./tipos";

export const COPY = {
  "LAB.RIBETE": "Laboratorio V2 · Datos de demostración",
  "LAB.RIBETE.DETALLE": "Nada se guarda: al refrescar vuelve a tu plan real.",
  "LAB.AHORA": "Ahora",

  "TITULO": "Tu semana, del 14 al 20 de septiembre",
  "BAJADA.REAL": "Tu plan real. Seleccioná cualquier bloque para ver qué es, y simulá trabajo para ver qué cambiaría.",
  "BAJADA.ESCENARIO": "Escenario hipotético · Tu plan real no cambió",

  "INDICADOR.PENDIENTE": "Trabajo pendiente esta semana",
  "INDICADOR.PENDIENTE.DEF":
    "Trabajo necesario dentro del horizonte actual para mantenerse o volver a estar al día con el ritmo confirmado de las cátedras y los próximos hitos.",
  "INDICADOR.PENDIENTE.FUENTE": "Suma de las duraciones probables de cada trabajo; cada una dice su fuente.",
  "INDICADOR.HORIZONTE": "Horizonte: lunes 14 a domingo 20",
  "INDICADOR.DISPONIBLE": "Disponibilidad declarada",
  "INDICADOR.DISPONIBLE.DEF":
    "Ventanas que declaraste como utilizables dentro del mismo horizonte, desde ahora y sin clases encima. Agregar disponibilidad no significa progreso.",
  "INDICADOR.SIN_UBICAR": "Trabajo sin ubicar",
  "INDICADOR.SIN_UBICAR.DEF": "Trabajo necesario que todavía no puede colocarse dentro de las ventanas declaradas sin superponer restricciones.",
  "INDICADOR.MARGEN": "Margen",
  "INDICADOR.MARGEN.DEF": "Disponibilidad que queda libre después de ubicar el trabajo necesario.",
  "INDICADOR.QUE_ES": "Qué es",
  "INDICADOR.PLAN_REAL": "plan real",

  "PLANO.REAL": "Tu plan real",
  "PLANO.ESCENARIO": "Escenario",
  "PLANO.ETIQUETA": "Qué plan ves",
  "MODO.EXPLICADO": "Modo explicado",
  "MODO.LIMPIO": "Modo limpio",
  "MODO.ETIQUETA": "Cómo se explica el cambio",
  "VISTA.PLAN": "Plan",
  "VISTA.CALENDARIO": "Calendario",
  "VISTA.ETIQUETA": "Vista",

  "ESCENARIO.RIBETE": "Escenario hipotético · Tu plan real no cambió",
  "ESCENARIO.VISTA_PREVIA": "Vista previa · Todavía no se agregó al escenario",
  "ESCENARIO.VACIO": "El escenario todavía no tiene cambios: es igual a tu plan real.",
  "REAL.RIBETE": "Tu plan real · Tu plan todavía no cambió",

  "PROXIMA.ETIQUETA": "Acción recomendada ahora",
  "PROXIMA.NINGUNA": "No queda trabajo con sus prerequisitos cumplidos.",
  "PROXIMA.VER": "Ver detalle",

  "PLAN.TITULO": "Plan semanal",
  "PLAN.CARRIL.FACULTAD": "Facultad",
  "PLAN.CARRIL.COMPROMISOS": "Compromisos",
  "PLAN.CARRIL.TRABAJO": "Trabajo académico",
  "PLAN.CARRIL.DISPONIBILIDAD": "Disponibilidad declarada",
  "PLAN.CARRIL.MARGEN": "Margen",
  "PLAN.YA_OCURRIO": "Ya ocurrió",
  "PLAN.POR_VENIR": "Por venir",
  "PLAN.HOY": "hoy",
  "PLAN.POR_UBICAR": "Por ubicar",
  "PLAN.POR_UBICAR.VACIO": "Todo el trabajo pendiente tiene lugar esta semana.",
  "PLAN.DESPLAZAR": "Deslizá para ver toda la semana",
  "PLAN.ANTES_AQUI": "antes aquí",
  "PLAN.YA_NO_HACE_FALTA": "ya no hace falta",
  "PLAN.ANTES_SIN_LUGAR": "antes sin lugar",
  "PLAN.SIN_MARGEN": "sin margen",
  "PLAN.AHORA.AYUDA": "Señala la posición temporal actual. No es un lugar para comprometerse.",

  "LEYENDA.TITULO": "Cómo se lee",
  "LEYENDA.FIJO": "Facultad · no se mueve",
  "LEYENDA.HECHO": "Ya ocurrió",
  "LEYENDA.CONFIRMADO": "Compromiso",
  "LEYENDA.PROPUESTA": "Propuesta",
  "LEYENDA.SIMULADO": "Simulado en el escenario",
  "LEYENDA.INTENTO": "Intento sin prerequisito",
  "LEYENDA.INCUMPLIDO": "Incumplido",
  "LEYENDA.HUELLA": "Posición anterior",

  "INSPECTOR.TITULO": "Inspector",
  "INSPECTOR.VACIO": "Seleccioná cualquier bloque, franja o estación para ver qué es y qué podés hacer.",
  "INSPECTOR.CERRAR": "Cerrar",
  "INSPECTOR.SALTAR": "Ir al inspector",

  "ACCION.SIMULAR": "Simular este workitem",
  "ACCION.REUBICAR": "Reubicar en el escenario",
  "ACCION.ELEGIR_CUANDO": "Elegir cuándo",
  "ACCION.EMPEZAR": "Empezar ahora",
  "ACCION.EMPEZAR.DEMO": "Demostración: acá se abriría Modo Focus. En este laboratorio no se registra nada.",
  "ACCION.CAMBIAR_HORARIO": "Cambiar horario",
  "ACCION.CONFIRMAR_ESCENARIO": "Confirmar en el escenario",
  "ACCION.CANCELAR": "Cancelar",
  "ACCION.VER_DETALLE": "Ver detalle",
  "ACCION.OCULTAR_DETALLE": "Ocultar detalle",
  "ACCION.REGISTRO_CLASE": "Abrir registro de clase",
  "ACCION.MODO_CLASE": "Abrir Modo Clase",
  "ACCION.MODO_CLASE.DEMO": "En el producto abriría Modo Clase. En este laboratorio no se navega.",
  "ACCION.MODO_EXAMEN.DEMO": "En el producto, desde acá se podría activar Modo Examen para este parcial. En el laboratorio no se activa.",
  "ACCION.VER_EN_CALENDARIO": "Ver en Calendario",
  "ACCION.VER_EN_PLAN": "Ver en el plan",

  "SIM.SUPUESTO":
    "Se supone que el workitem se realiza dentro del rango previsto, la evidencia resulta suficiente y después se registra el progreso correspondiente, si ese workitem realmente puede producir progreso académico.",
  "SIM.PASO.1": "Se ejecuta",
  "SIM.PASO.2": "Se envía la evidencia",
  "SIM.PASO.3": "La evidencia resulta suficiente",
  "SIM.PASO.4": "Se registra el progreso, sólo cuando corresponde",
  "SIM.PASO.5": "El plan se recalcula",
  "SIM.NO_ES_COMPLETAR": "Simular no es marcarlo como hecho: son cinco hechos distintos y ninguno implica el siguiente.",
  "SIM.NO_MUEVE": "No mueve el progreso académico por sí solo",
  "SIM.MAXIMO": "Llegaste a 5 workitems. El límite existe para que el escenario siga siendo comprensible: deshacé o restablecé para probar otro.",
  "SIM.YA_EN_ESCENARIO": "Ya está simulado en este escenario.",
  "SIM.INTENTO_REPETIDO": "Ya hay un intento sin su prerequisito en el escenario. Simulá primero lo que le falta para volver a probarlo.",
  "SIM.YA_NO_HACE_FALTA": "En este escenario ya no hace falta.",
  "SIM.SIN_LUGAR": "No hay un hueco libre donde simularlo sin acortarlo.",
  "SIM.NO_ES_TRABAJO": "Esto no se simula: no es trabajo por hacer.",

  "PILA.TITULO": "Pila de simulación",
  "PILA.VACIA": "Todavía no simulaste nada. Elegí un workitem y tocá «Simular este workitem».",
  "PILA.DESHACER": "Deshacer último",
  "PILA.DESHACER.AYUDA": "Deshace el último cambio del escenario.",
  "PILA.VOLVER_A_PASO": "Volver a este paso",
  "PILA.RESTABLECER": "Restablecer escenario",
  "PILA.VOLVER_REAL": "Volver al plan real",
  "PILA.EMPEZAR_PRIMERO": "Empezar el primero",
  "PILA.ELEGIR_CUANDO_PRIMERO": "Elegir cuándo para el primero",
  "PILA.CIERRE": "Nada de esto se confirmó ni cuenta como avance.",
  "PILA.OVERRIDE": "orden elegido por vos",
  "PILA.INCOMPLETO": "sin prerequisito",
  "PILA.OTROS_CAMBIOS": "Además, en el escenario:",
  "PILA.PASO": "Paso",
  "PILA.SUPUESTO": "Supuesto",
  "PILA.TEMPORAL": "Impacto temporal",
  "PILA.ACADEMICO": "Impacto académico",
  "PILA.RIESGOS": "Riesgos",
  "PILA.SIGUIENTE": "Siguiente acción resultante",
  "PILA.QUE_CAMBIO": "Qué cambió",
  "PILA.QUE_IGUAL": "Qué quedó igual",
  "PILA.VER_POR_QUE": "Ver por qué cambió",
  "PILA.OCULTAR_POR_QUE": "Ocultar por qué cambió",

  "PRIORIDAD.TITULO": "Hay trabajo más prioritario antes",
  "PRIORIDAD.BAJADA": "Podés probar este orden igualmente; el escenario mostrará qué riesgo agrega.",
  "PRIORIDAD.VOLVER": "Volver al orden recomendado",
  "PRIORIDAD.IGUAL": "Simular igual",

  "DEPENDENCIA.TITULO": "Le falta un prerequisito",
  "DEPENDENCIA.BAJADA":
    "Podés explorar el intento. El escenario va a usar su tiempo, pero no lo cuenta como hecho: no mueve el Gantt ni desbloquea lo que depende de él.",
  "DEPENDENCIA.PRIMERO": "Simular primero",
  "DEPENDENCIA.IGUAL": "Explorar el intento igual",

  "QUITAR.TITULO": "Esta franja tiene un compromiso",
  "QUITAR.BAJADA": "No lo movemos solo. Cambiale el horario primero y después quitá la franja.",
  "QUITAR.CAMBIAR": "Cambiar horario del compromiso",

  "DISP.MENU": "Disponibilidad",
  "DISP.AGREGAR": "Agregar una excepción",
  "DISP.QUITAR": "Quitar esta franja del escenario",
  "DISP.RESTABLECER": "Restablecer disponibilidad",
  "DISP.AYUDA": "Excepciones preparadas para el laboratorio: no hay un editor de horarios libre.",
  "DISP.NO_ES_PROGRESO": "Agregar disponibilidad no reduce el trabajo académico: le da más lugares posibles.",

  "CAMINO.TITULO": "Tu plan traducido",
  "CAMINO.BAJADA": "El orden en que conviene avanzar y qué depende de qué. No reemplaza al plan semanal.",
  "CAMINO.YA_OCURRIO": "Ya ocurrió",
  "CAMINO.REQUIERE": "después de",

  "GANTT.TITULO": "Gantt académico",
  "GANTT.BAJADA": "Qué parte objetiva del cursado cambiaría. Temas, no porcentajes.",
  "GANTT.CATEDRA": "Cátedra",
  "GANTT.VOS": "Vos hoy",
  "GANTT.ESCENARIO": "Si cumplís este escenario",
  "GANTT.SIN_PREDICCIONES": "Sin porcentajes de preparación ni predicciones: sólo qué temas tienen clase dada, progreso registrado o progreso simulado.",

  "CAL.TITULO": "Calendario",
  "CAL.SOLO_LECTURA": "Sólo lectura · los mismos objetos que el plan",
  "CAL.VOLVER": "Volver al plan",
} as const;

export type ClaveDeCopy = keyof typeof COPY;
export const t = (clave: ClaveDeCopy): string => COPY[clave];

export const PRIORIDAD_VISIBLE: Readonly<Record<Prioridad, string>> = {
  PRIMERO: "Primero",
  ENSEGUIDA: "Enseguida",
  DESPUES: "Después",
};

export const CONFIANZA_VISIBLE: Readonly<Record<Confianza, string>> = { baja: "baja", media: "media", alta: "alta" };

export const ESTADO_VISIBLE: Readonly<Record<EstadoEnPlan, string>> = {
  FIJO: "Facultad",
  HECHO: "Ya ocurrió",
  INCUMPLIDO: "Incumplido",
  CONFIRMADO: "Compromiso",
  PROMESA_ANTERIOR: "Promesa original",
  PROPUESTA: "Propuesta",
  SIMULADO: "Simulado",
  INTENTO: "Intento sin prerequisito",
};

export const MOTIVO_SIN_UBICAR = {
  SIN_VENTANA: "ninguna ventana libre dura lo que necesita",
  PLAZO: "sólo entraría después del parcial",
  DEPENDENCIA: "su prerequisito todavía no tiene lugar",
} as const;

export const materiaCorta = (id: keyof typeof MATERIAS) => MATERIAS[id].corto;

const listar = (xs: readonly string[]) =>
  xs.length <= 1 ? xs.join("") : `${xs.slice(0, -1).join(", ")} y ${xs[xs.length - 1]}`;

/** *"Todavía quedarían Límites y Práctica de Derivadas."* Con tres o más, los dos primeros y cuántos más. */
export function frasePostergados(ids: readonly string[]): string {
  const nombres = ids.map(nombreCorto);
  const visibles = nombres.length > 3 ? [...nombres.slice(0, 2), `${nombres.length - 2} más`] : nombres;
  return `Todavía ${ids.length === 1 ? "quedaría" : "quedarían"} ${listar(visibles)}.`;
}

/** Qué cambió, en frases. Sale del diff: la pantalla no compara por su cuenta. */
export function frasesDeCambio(antes: Proyeccion, despues: Proyeccion, d: PlanDiff): string[] {
  const frases: string[] = [];
  for (const id of d.completados) frases.push(`${tituloDe(id)}: simulado como hecho.`);
  for (const id of d.intentos) frases.push(`${tituloDe(id)}: intento sin prerequisito; sigue pendiente.`);
  for (const id of d.retirados) frases.push(`${tituloDe(id)} deja de hacer falta.`);
  for (const m of d.movidos) {
    const prefijo = m.clave.endsWith("#promesa") ? "Promesa original" : tituloDe(m.id);
    frases.push(`${prefijo}: ${franjaCorta(m.antes)} → ${franjaCorta(m.despues)}.`);
  }
  for (const id of d.ubicados) frases.push(`${tituloDe(id)} consigue lugar.`);
  for (const id of d.desubicados) frases.push(`${tituloDe(id)} queda por ubicar.`);
  if (d.minutos.pendiente !== 0)
    frases.push(`Trabajo pendiente esta semana: ${enHoras(antes.totales.pendiente)} → ${enHoras(despues.totales.pendiente)}.`);
  if (d.minutos.declarada !== 0)
    frases.push(`Disponibilidad declarada: ${enHoras(antes.totales.declarada)} → ${enHoras(despues.totales.declarada)}.`);
  if (d.minutos.sinUbicar !== 0)
    frases.push(`Trabajo sin ubicar: ${enHoras(antes.totales.sinUbicar)} → ${enHoras(despues.totales.sinUbicar)}.`);
  if (d.minutos.margen !== 0) frases.push(`Margen: ${enHoras(antes.totales.margen)} → ${enHoras(despues.totales.margen)}.`);
  return frases;
}

export function frasesDeIgual(d: PlanDiff): string[] {
  const frases = ["Las clases y el parcial, en el mismo lugar."];
  if (d.minutos.declarada === 0) frases.push("La disponibilidad declarada.");
  if (d.minutos.pendiente === 0) frases.push("El trabajo académico pendiente.");
  return frases;
}

export function frasesTemporales(antes: Proyeccion, despues: Proyeccion, d: PlanDiff): string[] {
  const frases: string[] = [];
  const paso = despues.pasos[despues.pasos.length - 1];
  if (paso?.franja) frases.push(`Se haría el ${diaMedio(paso.franja.dia)}, ${paso.franja.desde}–${paso.franja.hasta}.`);
  if (d.movidos.length > 0) frases.push(`${d.movidos.length === 1 ? "Se mueve 1 bloque" : `Se mueven ${d.movidos.length} bloques`}.`);
  else frases.push("Ningún otro bloque cambia de lugar.");
  if (d.minutos.margen !== 0) frases.push(`Margen: ${enHoras(antes.totales.margen)} → ${enHoras(despues.totales.margen)}.`);
  return frases;
}

/** La razón explícita de que haya margen y trabajo sin ubicar a la vez. `null` = no conviven. */
export function porQueConviven(p: Proyeccion): string | null {
  if (p.totales.margen === 0 || p.totales.sinUbicar === 0) return null;
  const mayorHueco = Math.max(0, ...p.margenes.map((m) => m.minutos));
  const sinLugar = p.colocados.filter((c) => c.estado === "PROPUESTA" && c.franja === null);
  const menor = Math.min(...sinLugar.map((c) => workitem(c.id)?.duracion.probable ?? Infinity));
  if (mayorHueco < menor)
    return `Hay margen y trabajo sin ubicar a la vez porque el margen está en huecos de hasta ${enHoras(mayorHueco)}, y lo que falta ubicar necesita al menos ${enHoras(menor)} seguidos. No se parten ni se acortan bloques.`;
  return "Hay margen y trabajo sin ubicar a la vez porque lo que falta ubicar no puede ir en esos huecos: depende de algo que todavía no tiene lugar o tendría que ir antes del parcial.";
}

export function textoDeRecomendada(id: string | null): string {
  return id ? tituloDe(id) : t("PROXIMA.NINGUNA");
}
