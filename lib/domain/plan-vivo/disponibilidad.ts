import { fechasEntre, sumarDias } from "../calendario";
import { diaDeSemana } from "../zona";
import { horaEnZona, instanteDelDia } from "./formato";
import { intersectar, MINUTO } from "./intervalos";
import type { Intervalo, PlanVivoBase } from "./tipos";

/**
 * De la disponibilidad de la semana a las filas que guarda el alta —
 * [ADR-110](../../../docs/decisions.md#adr-110).
 *
 * ⚠️ **`availability` es semanal.** Lo que se agregó o quitó un martes vale para
 * **todos** los martes: la pantalla lo dice antes de guardar.
 *
 * ⚠️ **Toda fila lleva hora** — [ADR-110 · Enmienda 3](../../../docs/decisions.md#adr-110-enmienda-3).
 * Las filas sin hora (*«90 minutos los martes»*) venían del paso del alta, que
 * ya no existe. Guardar desde el plan **las borra**: sólo cuenta lo dibujado.
 */
export interface BloqueParaGuardar {
  dia: number;
  desde?: string;
  hasta?: string;
  minutos: number;
}

export function filasSemanales(base: PlanVivoBase, efectiva: readonly Intervalo[]): BloqueParaGuardar[] {
  const filas: BloqueParaGuardar[] = [];
  for (const fecha of fechasEntre(base.semana, sumarDias(base.semana, 6))) {
    const dia = { ini: instanteDelDia(fecha, 0, base.zona), fin: instanteDelDia(sumarDias(fecha, 1), 0, base.zona) };
    for (const f of intersectar(efectiva, [dia])) {
      const hasta = f.fin >= dia.fin ? "23:59" : horaEnZona(f.fin, base.zona);
      filas.push({
        dia: diaDeSemana(fecha),
        desde: horaEnZona(f.ini, base.zona),
        hasta,
        minutos: Math.round((Math.min(f.fin, dia.fin) - f.ini) / MINUTO),
      });
    }
  }
  return filas;
}
