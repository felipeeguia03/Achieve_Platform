"use client";

/**
 * La ruta de **Tu recorrido** — [ADR-106](../../../docs/decisions.md#adr-106).
 *
 * ⚠️ **`RECORRIDO` no es una superficie**: es un nodo sin wireframe, como
 * `/formacion`, `/gimnasia` y `/focus`. Hay dieciséis rutas bajo `app/(student)`
 * y nueve superficies, y las dos cifras se verifican por separado.
 */

import { Shell } from "@/components/shell/shell";
import { VistaDeRecorrido } from "@/components/superficies/recorrido";

export default function RecorridoPage() {
  return (
    <Shell nodo="RECORRIDO">
      <VistaDeRecorrido />
    </Shell>
  );
}
