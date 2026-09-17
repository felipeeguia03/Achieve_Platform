/**
 * **¿Tiene clase ahora?** — [ADR-098](../../docs/decisions.md#adr-098) §8.
 *
 * Contesta con el horario de cursado (`class_schedule_block`) y el reloj de la
 * institución, y con nada más: **sin GPS** y sin mirar si el estudiante está en
 * el aula. El horario es la señal; entrar sigue siendo una decisión suya.
 *
 * ## Las dos ventanas
 *
 * | Momento | Cuándo |
 * |---|---|
 * | `PROXIMA` | faltan `MINUTOS_ANTES_DE_CLASE` o menos para que empiece |
 * | `EN_CURSO` | empezó y todavía no terminó |
 *
 * **Intervalos semiabiertos**, como en [ADR-084](../../docs/decisions.md#adr-084):
 * a la hora exacta de fin la clase ya no está en curso, y a la hora exacta de
 * inicio ya lo está.
 *
 * ⚠️ **Se comparan instantes absolutos**, resueltos con `zona.ts`. Un `-03:00`
 * escrito a mano da un resultado plausible y corrido una hora el primer día de
 * horario de verano.
 *
 * ⚠️ **Sin bloques no hay clase**, y eso **no** significa que esté libre: es que
 * no se sabe (ADR-063). La función devuelve `[]` y Hoy no dibuja nada.
 */
import { diaDeSemana, fechaEnZona, instanteEnZona } from "./zona";

/** Cuánto antes de empezar se ofrece entrar. Si cambia, cambia acá (ADR-098 §8). */
export const MINUTOS_ANTES_DE_CLASE = 15;

export interface BloqueDeHoy {
  cursadaId: string;
  /** `null` ⇒ el bloque no tiene identidad conocida por quien llama. */
  bloqueId: string | null;
  dia: number;
  /** `HH:MM` o `HH:MM:SS`, hora de pared de la institución. */
  desde: string;
  hasta: string;
}

export interface ClaseDeAhora {
  cursadaId: string;
  bloqueId: string | null;
  momento: "PROXIMA" | "EN_CURSO";
  /** `HH:MM`. */
  desde: string;
  hasta: string;
  /** Minutos que faltan para empezar. `0` si ya empezó. */
  minutosParaEmpezar: number;
}

const hhmm = (t: string) => t.slice(0, 5);

export function clasesDeAhora(
  bloques: readonly BloqueDeHoy[],
  ahora: number,
  zona: string,
): ClaseDeAhora[] {
  const hoy = fechaEnZona(ahora, zona);
  const dia = diaDeSemana(hoy);

  return bloques
    .filter((b) => b.dia === dia)
    .flatMap((b): ClaseDeAhora[] => {
      const inicio = instanteEnZona(hoy, b.desde, zona);
      const fin = instanteEnZona(hoy, b.hasta, zona);
      if (ahora >= fin) return [];
      if (ahora >= inicio) {
        return [{ cursadaId: b.cursadaId, bloqueId: b.bloqueId, momento: "EN_CURSO", desde: hhmm(b.desde), hasta: hhmm(b.hasta), minutosParaEmpezar: 0 }];
      }
      const faltan = Math.ceil((inicio - ahora) / 60_000);
      return faltan <= MINUTOS_ANTES_DE_CLASE
        ? [{ cursadaId: b.cursadaId, bloqueId: b.bloqueId, momento: "PROXIMA", desde: hhmm(b.desde), hasta: hhmm(b.hasta), minutosParaEmpezar: faltan }]
        : [];
    })
    .sort((a, b) => a.desde.localeCompare(b.desde));
}
