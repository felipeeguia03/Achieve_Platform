"use client";

/**
 * La ruta de **Modo Focus** — [ADR-104](../../../docs/decisions.md#adr-104).
 *
 * ⚠️ **`FOCUS` no es una superficie**: es un nodo sin wireframe, como `/clase` y
 * `/gimnasia`. Hay quince rutas bajo `app/(student)` y nueve superficies, y las
 * dos cifras se verifican por separado.
 */

import { Suspense } from "react";

import { Shell } from "@/components/shell/shell";
import { VistaDeFocus } from "@/components/superficies/focus";

export default function FocusPage() {
  return (
    <Shell nodo="FOCUS">
      <Suspense>
        <VistaDeFocus />
      </Suspense>
    </Shell>
  );
}
