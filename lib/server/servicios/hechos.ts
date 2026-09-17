import { tituloDeHecho } from "@/lib/content/bitacora";
import { provenanceVisible } from "@/lib/content/provenance";
import type { EntradaDeBitacora } from "@/lib/domain/view-models";
import { duracionLegible } from "@/lib/domain/sesion-de-focus";
import { horaCorta } from "./tiempo";

/**
 * Un hecho del historial, tal como lo devuelve `hechos_de_cursada()`.
 *
 * `evento` viaja **crudo**: la base dice qué pasó y la traducción es contenido
 * (`AGENTS.md` §2.6, los enums nunca son copy visible).
 */
export interface HechoPersistido {
  evento: string;
  en: string;
  porElEstudiante: boolean | null;
  /**
   * Lo que el hecho trae para contarse — ADR-104. Hoy sólo la sesión de Focus
   * lo llena, con sus números congelados y el avance. ⛔ **Nunca el anotador**:
   * `hechos_de_cursada()` no lo lee.
   */
  datos?: DatosDeSesionDeFocus | null;
}

/** Los números congelados de una sesión cerrada, como los devuelve la base. */
export interface DatosDeSesionDeFocus {
  inicio: string;
  fin: string | null;
  modo: "FREE" | "POMODORO";
  foco: number | null;
  descanso: number | null;
  pausado: number | null;
  completos: number | null;
  parciales: number | null;
  avance: string | null;
}

/**
 * La traducción de un hecho a una entrada visible. **Una sola, para las dos
 * superficies.**
 *
 * `UX06` la usa para la Bitácora y `UX02` para su Actividad reciente, que
 * `VI.6` §8.3 define como *"preview de la misma verdad derivada"*. Si cada una
 * tradujera por su cuenta, la preview y el historial terminarían diciendo cosas
 * distintas del mismo hecho — que es exactamente lo que *"no existe una segunda
 * fuente histórica"* prohíbe.
 *
 * `null` ⇒ el hecho **no tiene copy aprobada y no se muestra**. Es el mismo
 * criterio de siempre: omitir, no inventar. Qué hechos son visibles lo declara
 * `lib/domain/product-events.ts`, y hay guard de que las dos listas coincidan.
 */
export function aEntradaVisible(h: HechoPersistido, zona: string): EntradaDeBitacora | null {
  const titulo = tituloDeHecho(h.evento);
  if (!titulo) return null;

  if (h.evento === "FocusSessionEnded" && h.datos) return entradaDeSesionDeFocus(titulo, h.datos, zona, h.porElEstudiante);

  return {
    titulo,
    detalle: horaCorta(h.en, zona),
    // La procedencia no se eleva: lo que declaró el estudiante viaja como suyo
    // y sin verificar; lo que hizo el sistema **no tiene fuente académica**.
    provenance: h.porElEstudiante ? provenanceVisible("student", "unverified") : null,
  };
}

/**
 * La entrada de una sesión de Focus — ADR-104 §21.
 *
 * **El dato principal es el tiempo registrado en Focus**, y va en el título. El
 * resto es detalle, y cada pieza **se omite si es cero o no aplica**: un
 * cronómetro libre no tiene bloques, y *«0 bloques completos»* sería contar algo
 * que no existió. El descanso y la pausa sí se nombran sólo cuando hubo.
 */
function entradaDeSesionDeFocus(
  titulo: string,
  d: DatosDeSesionDeFocus,
  zona: string,
  porElEstudiante: boolean | null,
): EntradaDeBitacora {
  const piezas: string[] = [d.fin ? `${horaCorta(d.inicio, zona)}–${horaCorta(d.fin, zona)}` : horaCorta(d.inicio, zona)];
  if (d.modo === "POMODORO" || (d.completos ?? 0) > 0 || (d.parciales ?? 0) > 0) {
    const completos = d.completos ?? 0;
    piezas.push(`${completos} ${completos === 1 ? "bloque completo" : "bloques completos"}`);
    if ((d.parciales ?? 0) > 0) piezas.push(`${d.parciales} ${d.parciales === 1 ? "parcial" : "parciales"}`);
  }
  if ((d.descanso ?? 0) >= 60) piezas.push(`descanso ${duracionLegible(d.descanso ?? 0)}`);
  if ((d.pausado ?? 0) >= 60) piezas.push(`pausado ${duracionLegible(d.pausado ?? 0)}`);

  return {
    titulo: d.foco === null ? titulo : `${titulo} · ${duracionLegible(d.foco)} de Focus`,
    detalle: piezas.join(" · "),
    provenance: porElEstudiante ? provenanceVisible("student", "unverified") : null,
    ...(d.avance ? { cita: `Avance: «${d.avance}»` } : {}),
  };
}
