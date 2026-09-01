import { tituloDeHecho } from "@/lib/content/bitacora";
import { provenanceVisible } from "@/lib/content/provenance";
import type { EntradaDeBitacora } from "@/lib/domain/view-models";
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

  return {
    titulo,
    detalle: horaCorta(h.en, zona),
    // La procedencia no se eleva: lo que declaró el estudiante viaja como suyo
    // y sin verificar; lo que hizo el sistema **no tiene fuente académica**.
    provenance: h.porElEstudiante ? provenanceVisible("student", "unverified") : null,
  };
}
