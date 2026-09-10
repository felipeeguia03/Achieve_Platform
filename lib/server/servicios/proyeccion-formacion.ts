import "server-only";

import { provenanceVisible } from "@/lib/content/provenance";
import { t } from "@/lib/content/es-AR";
import type { FormacionProps } from "@/lib/domain/view-models";
import type { BibliotecaPersistida } from "../repositorios/formacion";

/**
 * La biblioteca de Formación — [ADR-087](../../../docs/decisions.md#adr-087).
 *
 * ## Las tres reglas que esta proyección hace cumplir
 *
 * 1. **No clasifica al estudiante.** `D1` prohíbe proxies, puntajes y umbrales
 *    mientras no exista el Student Model. Esta función **no recibe** evidencias,
 *    compromisos ni tiempo de uso: la biblioteca es la misma para todos, y eso
 *    es la decisión, no una simplificación.
 * 2. **Leer no depende de nada.** `D2` y la Enmienda 2 `E2.3`: la biblioteca se
 *    lee **con cursadas o sin ellas**. V1 es de solo lectura y **no ofrece
 *    aplicar**: no hay botón, no hay selector y no hay promesa.
 * 3. **Lo que no está publicado no llega.** `D5`, y el filtro vive en la base.
 *    Acá se proyecta lo que vino; si vino vacío, se dice por qué.
 *
 * ⚠️ **No hay video, y no se anuncia uno.** La autora declara que faltan los
 * guiones: `D4` decidió omitirlos, no simularlos. Ni *«próximamente»* ni un
 * reproductor vacío — la línea no existe.
 */
export function proyectarFormacion(b: BibliotecaPersistida | null): FormacionProps {
  const piezas = (b?.piezas ?? []).map((p) => ({
    id: p.id,
    codigo: p.codigo,
    titulo: p.titulo,
    problema: p.problema,
    objetivo: p.objetivo,
    explicacion: p.explicacion,
    accionPosterior: p.accionPosterior,
    evidenciaEsperada: p.evidenciaEsperada,
    material: p.material,
    // La procedencia va **junto al dato** (`product.md` §7), y la traduce el
    // único traductor que hay. La pantalla no compone este texto.
    procedencia: provenanceVisible(p.fuente, p.verificacion),
  }));

  return {
    piezas,
    // ⚠️ **Cero piezas NO es un error.** Hasta que la psicopedagoga confirme
    // vigencia (`D5`) todo está `DRAFT`, y el vacío **dice por qué** en vez de
    // dejar una pantalla en blanco.
    aviso: piezas.length === 0 ? t("FORMACION.VACIO") : null,
  };
}
