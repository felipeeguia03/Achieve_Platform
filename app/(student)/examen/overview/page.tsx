"use client";

/**
 * La ruta de UX08.
 *
 * ⚠️ **Acá sólo está el marco.** La superficie vive en
 * `components/superficies/examen-overview.tsx` porque se dibuja en dos lugares —esta
 * pantalla y la ventana de su ficha en la barra de objetos— y tiene que ser
 * **el mismo componente** ([ADR-088](../../../../docs/decisions.md#adr-088),
 * Enmienda 6). Lo que la ruta aporta, y la ventana no, es el `Shell` con su
 * nodo: la navegación lateral, la miga y la barra.
 *
 * ⚠️ **El `Suspense` no es decorativo.** La superficie lee `useSearchParams`
 * para `?escenario=` y `?cursada=`, y Next exige una frontera de suspensión
 * alrededor de quien lo llame o el build falla.
 */

import { Suspense } from "react";

import { Shell } from "@/components/shell/shell";
import { VistaDeOverviewDeExamen } from "@/components/superficies/examen-overview";

export default function OverviewModoExamenPage() {
  return (
    <Shell nodo="UX08">
      <Suspense>
        <VistaDeOverviewDeExamen />
      </Suspense>
    </Shell>
  );
}
