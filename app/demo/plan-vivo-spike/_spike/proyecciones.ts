/**
 * 🧪 **SPIKE DESCARTABLE — armado de las proyecciones preparadas.**
 *
 * ⚠️ **Esto no es un planificador.** No decide dónde va nada: toma las
 * ubicaciones escritas a mano en `fixture.ts` y las convierte en algo que la
 * pantalla puede dibujar. Lo único que **calcula** son las cifras —trabajo
 * pendiente, disponible, sin ubicar y márgenes—, para que un total nunca diga
 * algo distinto de lo que muestran los bloques.
 *
 * Puro: sin React, sin reloj propio, sin red, sin escritura.
 */

import { CATALOGO, DISPONIBILIDAD_BASE, DISPONIBILIDAD_EXTRA, ESCENARIOS, ID } from "./fixture";
import { aHora, aMinutos, instante } from "./formato";
import type {
  SpikeDisponibilidad,
  SpikeEstado,
  SpikeFranjaHoraria,
  SpikeMargen,
  SpikePlanDiff,
  SpikePlanItem,
  SpikePlanProjection,
  SpikeScenario,
  SpikeTotales,
} from "./tipos";

/** Los estados que son **trabajo académico todavía por hacer**. */
const PENDIENTES: ReadonlySet<SpikeEstado> = new Set([
  "SUGERIDA",
  "COMPROMISO_CONFIRMADO",
  "NECESITA_REUBICACION",
  "PROPUESTA_SIN_CONFIRMAR",
]);

/**
 * ¿Suma al trabajo pendiente? Un compromiso **incumplido no**: su trabajo sigue
 * pendiente, pero lo lleva otro elemento, así no se cuenta dos veces. Un
 * progreso registrado tampoco, y **una evidencia enviada tampoco es progreso**:
 * es un hecho del pasado que no mueve las cuentas de la semana.
 */
export function esPendiente(item: Pick<SpikePlanItem, "estado">): boolean {
  return PENDIENTES.has(item.estado);
}

/** Los estados que no se mueven por nada que haga el estudiante en el plan. */
export function esRestriccion(item: SpikePlanItem): boolean {
  return item.carril === "FACULTAD" || item.carril === "COMPROMISOS";
}

type Intervalo = [number, number];

function intervaloDe(fr: SpikeFranjaHoraria): Intervalo {
  return [aMinutos(fr.desde), aMinutos(fr.hasta)];
}

function fusionar(intervalos: Intervalo[]): Intervalo[] {
  const orden = [...intervalos].sort((a, b) => a[0] - b[0]);
  const salida: Intervalo[] = [];
  for (const [d, h] of orden) {
    const ultimo = salida[salida.length - 1];
    if (ultimo && d <= ultimo[1]) ultimo[1] = Math.max(ultimo[1], h);
    else salida.push([d, h]);
  }
  return salida;
}

function restar(base: Intervalo[], quitar: Intervalo[]): Intervalo[] {
  let resto = base;
  for (const [qd, qh] of quitar) {
    resto = resto.flatMap(([d, h]): Intervalo[] => {
      if (qh <= d || qd >= h) return [[d, h]];
      const partes: Intervalo[] = [];
      if (qd > d) partes.push([d, qd]);
      if (qh < h) partes.push([qh, h]);
      return partes;
    });
  }
  return resto;
}

function interseccion(a: Intervalo[], b: Intervalo[]): number {
  let total = 0;
  for (const [ad, ah] of a) for (const [bd, bh] of b) total += Math.max(0, Math.min(ah, bh) - Math.max(ad, bd));
  return total;
}

const suma = (xs: Intervalo[]) => xs.reduce((t, [d, h]) => t + (h - d), 0);

/** La parte de la disponibilidad de un día que todavía no pasó. */
function disponibilidadFutura(
  disponibilidad: readonly SpikeDisponibilidad[],
  dia: string,
  ahora: string,
): Intervalo[] {
  const delDia = fusionar(disponibilidad.filter((d) => d.dia === dia).map(intervaloDe));
  const reloj = Date.parse(ahora);
  return delDia.flatMap(([d, h]): Intervalo[] => {
    if (instante(dia, aHora(h)) <= reloj) return [];
    if (instante(dia, aHora(d)) >= reloj) return [[d, h]];
    const minutoActual = aMinutos(ahora.slice(11, 16));
    return [[minutoActual, h]];
  });
}

/** Arma la proyección de un escenario. Mismo escenario, misma salida. */
export function proyectar(escenario: SpikeScenario): SpikePlanProjection {
  const e = ESCENARIOS[escenario];
  const disponibilidad = e.conDisponibilidadExtra
    ? [...DISPONIBILIDAD_BASE, ...DISPONIBILIDAD_EXTRA]
    : [...DISPONIBILIDAD_BASE];

  const items: SpikePlanItem[] = CATALOGO.flatMap((el): SpikePlanItem[] => {
    const hipotetico = e.hipoteticos.includes(el.id);
    const estado = e.estados[el.id] ?? el.estado;
    if (el.franjaFija) return [{ ...el, estado, franja: el.franjaFija, hipotetico }];
    if (!(el.id in e.ubicaciones)) return [];
    return [{ ...el, estado, franja: e.ubicaciones[el.id], hipotetico }];
  });

  const dias = [...new Set(disponibilidad.map((d) => d.dia))];
  const parcial = items.find((i) => i.id === ID.PARCIAL)!.franja!;
  const inicioDelParcial = instante(parcial.dia, parcial.desde);

  let disponible = 0;
  const margenes: SpikeMargen[] = [];
  for (const dia of dias.sort()) {
    const futura = disponibilidadFutura(disponibilidad, dia, e.ahora);
    const ocupados = items.filter((i) => i.franja?.dia === dia);
    const noPendientes = ocupados.filter((i) => !esPendiente(i)).map((i) => intervaloDe(i.franja!));
    disponible += suma(futura) - interseccion(futura, noPendientes);
    for (const [d, h] of restar(futura, ocupados.map((i) => intervaloDe(i.franja!)))) {
      if (h - d <= 0) continue;
      margenes.push({
        dia,
        desde: aHora(d),
        hasta: aHora(h),
        minutos: h - d,
        antesDelParcial: instante(dia, aHora(h)) <= inicioDelParcial,
      });
    }
  }

  const pendientes = items.filter(esPendiente);
  const probable = (i: SpikePlanItem) => i.rango?.probable ?? 0;
  const totales: SpikeTotales = {
    pendiente: pendientes.reduce((t, i) => t + probable(i), 0),
    pendienteMin: pendientes.reduce((t, i) => t + (i.rango?.min ?? 0), 0),
    pendienteMax: pendientes.reduce((t, i) => t + (i.rango?.max ?? 0), 0),
    disponible,
    sinUbicar: pendientes.filter((i) => i.franja === null).reduce((t, i) => t + probable(i), 0),
    margen: margenes.reduce((t, m) => t + m.minutos, 0),
  };

  return {
    escenario,
    ahora: e.ahora,
    items,
    disponibilidad,
    margenes,
    totales,
    proximaAccion: e.proximaAccion,
    siguienteAccion: e.siguienteAccion,
  };
}

const mismaFranja = (a: SpikeFranjaHoraria | null, b: SpikeFranjaHoraria | null) =>
  a === b || (a !== null && b !== null && a.dia === b.dia && a.desde === b.desde && a.hasta === b.hasta);

/** Qué cambió de `antes` a `despues`. Lo usa la pantalla para las huellas y el texto. */
export function diferencia(antes: SpikePlanProjection, despues: SpikePlanProjection): SpikePlanDiff {
  const previo = new Map(antes.items.map((i) => [i.id, i]));
  const posterior = new Map(despues.items.map((i) => [i.id, i]));

  const movidos = despues.items
    .filter((i) => {
      const p = previo.get(i.id);
      return p && p.franja && i.franja && !mismaFranja(p.franja, i.franja);
    })
    .map((i) => ({ id: i.id, antes: previo.get(i.id)!.franja, despues: i.franja }));

  const retirados = antes.items
    .filter(esPendiente)
    .filter((i) => {
      const d = posterior.get(i.id);
      return !d || d.estado === "PROGRESO_REGISTRADO";
    })
    .map((i) => i.id);

  const ubicados = despues.items
    .filter((i) => i.franja !== null && previo.get(i.id)?.franja === null)
    .map((i) => i.id);
  const desubicados = despues.items
    .filter((i) => i.franja === null && (previo.get(i.id)?.franja ?? null) !== null)
    .map((i) => i.id);

  const cambiosDeEstado = despues.items
    .filter((i) => previo.has(i.id) && previo.get(i.id)!.estado !== i.estado)
    .map((i) => ({ id: i.id, antes: previo.get(i.id)!.estado, despues: i.estado }));

  const restriccionesIguales = despues.items
    .filter(esRestriccion)
    .filter((i) => mismaFranja(previo.get(i.id)?.franja ?? null, i.franja))
    .map((i) => i.id);

  return {
    movidos,
    retirados,
    ubicados,
    desubicados,
    cambiosDeEstado,
    minutos: {
      pendiente: despues.totales.pendiente - antes.totales.pendiente,
      disponible: despues.totales.disponible - antes.totales.disponible,
      sinUbicar: despues.totales.sinUbicar - antes.totales.sinUbicar,
      margen: despues.totales.margen - antes.totales.margen,
    },
    siguienteAntes: antes.siguienteAccion,
    siguienteDespues: despues.siguienteAccion,
    restriccionesIguales,
  };
}

/** La proyección contra la que se compara un escenario, o `null` si es la base. */
export function referenciaDe(escenario: SpikeScenario): SpikeScenario | null {
  return ESCENARIOS[escenario].referencia;
}

/** Busca un elemento **dentro de una proyección**. Plan y Calendario leen por acá. */
export function itemDe(p: SpikePlanProjection, id: string): SpikePlanItem | null {
  return p.items.find((i) => i.id === id) ?? null;
}
