"use client";

/**
 * La ruta de **Modo Clase** — [ADR-098](../../../docs/decisions.md#adr-098).
 *
 * ⚠️ **`CLASE` no es una superficie**: es un nodo sin wireframe, como
 * `/materias` y `/formacion`. Hay doce rutas bajo `app/(student)` y nueve
 * superficies, y las dos cifras se verifican por separado.
 */

import { Suspense } from "react";

import { Shell } from "@/components/shell/shell";
import { VistaDeClase } from "@/components/superficies/clase";

export default function ClasePage() {
  return (
    <Shell nodo="CLASE">
      <Suspense>
        <VistaDeClase />
      </Suspense>
    </Shell>
  );
}
