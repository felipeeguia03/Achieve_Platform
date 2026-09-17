/**
 * 🧪 **SPIKE DESCARTABLE — qué va en cada celda del camino temporal.**
 *
 * Puro: recibe una proyección (y la de referencia, para las huellas) y devuelve
 * qué se dibuja en cada carril × día, **ya ordenado**. El componente no ordena ni
 * decide nada: dibuja esto.
 *
 * El eje es de días (siete columnas iguales, siempre las mismas) y, dentro de
 * cada día, las cosas van en orden de hora. El divisor **Ahora** separa lo que
 * ya pasó de lo que viene: por eso se mueve de día cuando se adelanta el reloj,
 * y la escala no cambia nunca.
 */

import { SEMANA } from "./fixture";
import { aMinutos, relojDe } from "./formato";
import { diferencia, esPendiente } from "./proyecciones";
import type {
  SpikeCarril,
  SpikeDisponibilidad,
  SpikeFranjaHoraria,
  SpikeMargen,
  SpikePlanItem,
  SpikePlanProjection,
} from "./tipos";

export type CarrilDelCamino = SpikeCarril | "MARGEN";

export const CARRILES: readonly CarrilDelCamino[] = ["FACULTAD", "COMPROMISOS", "ACCIONES", "MARGEN"];

export type MotivoDeHuella = "MOVIDO" | "RETIRADO" | "DESUBICADO" | "UBICADO";

export type Entrada =
  | { tipo: "item"; clave: string; orden: number; item: SpikePlanItem }
  | { tipo: "huella"; clave: string; orden: number; item: SpikePlanItem; franja: SpikeFranjaHoraria | null; motivo: MotivoDeHuella }
  | { tipo: "ahora"; clave: string; orden: number; hora: string }
  | { tipo: "disponible"; clave: string; orden: number; franja: SpikeDisponibilidad }
  | { tipo: "margen"; clave: string; orden: number; margen: SpikeMargen };

export interface Camino {
  /** `${carril}|${dia}` → entradas en orden. */
  celdas: ReadonlyMap<string, readonly Entrada[]>;
  porUbicar: readonly Entrada[];
  reubicar: readonly Entrada[];
  diaDeAhora: string;
  horaDeAhora: string;
}

export const claveDeCelda = (carril: CarrilDelCamino, dia: string) => `${carril}|${dia}`;

/**
 * @param mostrarHuellas sólo en lo hipotético: una huella dice *"estaba acá"*, y
 *   eso tiene sentido mientras se compara, no cuando el cambio ya es la realidad
 *   del demo.
 */
export function armarCamino(
  p: SpikePlanProjection,
  referencia: SpikePlanProjection | null,
  mostrarHuellas: boolean,
): Camino {
  const reloj = relojDe(p.ahora);
  const minutoDeAhora = aMinutos(reloj.hora);
  const celdas = new Map<string, Entrada[]>();
  const agregar = (carril: CarrilDelCamino, dia: string, e: Entrada) => {
    const k = claveDeCelda(carril, dia);
    celdas.set(k, [...(celdas.get(k) ?? []), e]);
  };
  const porUbicar: Entrada[] = [];
  const reubicar: Entrada[] = [];

  for (const item of p.items) {
    const e: Entrada = { tipo: "item", clave: item.id, orden: item.franja ? aMinutos(item.franja.desde) : 0, item };
    if (item.franja) agregar(item.carril, item.franja.dia, e);
    else if (item.estado === "NECESITA_REUBICACION") reubicar.push(e);
    else if (esPendiente(item)) porUbicar.push(e);
  }

  for (const d of p.disponibilidad)
    agregar("MARGEN", d.dia, { tipo: "disponible", clave: `disp-${d.id}`, orden: aMinutos(d.desde), franja: d });
  for (const m of p.margenes)
    agregar("MARGEN", m.dia, { tipo: "margen", clave: `margen-${m.dia}-${m.desde}`, orden: aMinutos(m.desde) + 0.1, margen: m });

  if (referencia && mostrarHuellas) {
    const d = diferencia(referencia, p);
    const antes = new Map(referencia.items.map((i) => [i.id, i]));
    const huella = (id: string, motivo: MotivoDeHuella) => {
      const viejo = antes.get(id)!;
      const e: Entrada = {
        tipo: "huella",
        clave: `huella-${id}`,
        orden: viejo.franja ? aMinutos(viejo.franja.desde) - 0.2 : 0,
        item: viejo,
        franja: viejo.franja,
        motivo,
      };
      if (viejo.franja) agregar(viejo.carril, viejo.franja.dia, e);
      else porUbicar.push(e);
    };
    for (const m of d.movidos) huella(m.id, "MOVIDO");
    for (const id of d.desubicados) huella(id, "DESUBICADO");
    for (const id of d.ubicados) huella(id, "UBICADO");
    // Un retirado que sigue dibujado en su lugar (Límites, ahora hecho) no deja huella aparte.
    for (const id of d.retirados) if (!p.items.some((i) => i.id === id)) huella(id, "RETIRADO");
  }

  for (const carril of CARRILES)
    agregar(carril, reloj.dia, { tipo: "ahora", clave: `ahora-${carril}`, orden: minutoDeAhora - 0.5, hora: reloj.hora });

  for (const [k, v] of celdas) celdas.set(k, [...v].sort((a, b) => a.orden - b.orden));

  return { celdas, porUbicar, reubicar, diaDeAhora: reloj.dia, horaDeAhora: reloj.hora };
}

/** ¿El día quedó entero en el pasado? */
export const esDiaPasado = (dia: string, diaDeAhora: string) => dia < diaDeAhora;

/** ¿La entrada ya pasó? Sirve para atenuarla sin sacarla de su lugar. */
export function yaPaso(e: Entrada, camino: Camino, dia: string): boolean {
  if (dia < camino.diaDeAhora) return true;
  if (dia > camino.diaDeAhora) return false;
  const hasta =
    e.tipo === "item" ? e.item.franja?.hasta : e.tipo === "disponible" ? e.franja.hasta : e.tipo === "margen" ? e.margen.hasta : null;
  return hasta !== null && hasta !== undefined && aMinutos(hasta) <= aMinutos(camino.horaDeAhora);
}

/** Alto aproximado de una entrada, para que los carriles no salten entre escenarios. */
function alto(e: Entrada): number {
  if (e.tipo === "item") return e.item.requiere.length > 0 ? 92 : 72;
  if (e.tipo === "huella") return 58;
  if (e.tipo === "ahora") return 18;
  return 30;
}

/**
 * El alto mínimo de cada carril: el mayor que va a necesitar **en cualquier
 * escenario**. Así alternar escenarios no reacomoda la página.
 */
export function altosEstables(caminos: readonly Camino[]): Record<CarrilDelCamino, number> {
  const salida = { FACULTAD: 0, COMPROMISOS: 0, ACCIONES: 0, MARGEN: 0 } as Record<CarrilDelCamino, number>;
  for (const c of caminos)
    for (const carril of CARRILES)
      for (const dia of SEMANA) {
        const entradas = c.celdas.get(claveDeCelda(carril, dia)) ?? [];
        const total = entradas.reduce((t, e) => t + alto(e) + 6, 12);
        salida[carril] = Math.max(salida[carril], total);
      }
  return salida;
}
