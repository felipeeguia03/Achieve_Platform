"use client";

/**
 * La ruta de **Gimnasia cognitiva** — [ADR-102](../../../docs/decisions.md#adr-102).
 *
 * ⚠️ **`GIMNASIA` no es una superficie**: es un nodo sin wireframe, como
 * `/formacion` y `/calendario`. Hay catorce rutas bajo `app/(student)` y nueve
 * superficies, y las dos cifras se verifican por separado.
 */

import { Suspense } from "react";

import { Shell } from "@/components/shell/shell";
import { VistaDeGimnasia } from "@/components/superficies/gimnasia";

export default function GimnasiaPage() {
  return (
    <Shell nodo="GIMNASIA">
      <Suspense>
        <VistaDeGimnasia />
      </Suspense>
    </Shell>
  );
}
