"use client";

/**
 * La ruta del **Calendario** — [ADR-100](../../../docs/decisions.md#adr-100).
 *
 * ⚠️ **`CALENDARIO` no es una superficie**: es un nodo sin wireframe, como
 * `/materias`, `/formacion` y `/clase`. Hay trece rutas bajo `app/(student)` y
 * nueve superficies, y las dos cifras se verifican por separado.
 */

import { Suspense } from "react";

import { Shell } from "@/components/shell/shell";
import { VistaDeCalendario } from "@/components/superficies/calendario";

export default function CalendarioPage() {
  return (
    <Shell nodo="CALENDARIO">
      <Suspense>
        <VistaDeCalendario />
      </Suspense>
    </Shell>
  );
}
