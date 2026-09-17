/**
 * La ruta de **Mi plan** — [ADR-110 · Enmienda 1](../../../docs/decisions.md#adr-110-enmienda-1).
 *
 * ⚠️ **`PLAN_VIVO` no es una superficie**: es un nodo sin wireframe, como
 * `/calendario`, `/materias`, `/formacion` y `/clase`. Hay **diecisiete** rutas
 * bajo `app/(student)` y **nueve** superficies, y las dos cifras se verifican
 * por separado en `tests/shell.test.tsx`.
 *
 * ⚠️ **Sin flag** — [ADR-110 · Enmienda 2](../../../docs/decisions.md#adr-110-enmienda-2).
 * Estuvo detrás de `PLAN_VIVO=1` y respondía `404` sin la variable; el owner
 * sacó la llave. La ruta existe siempre.
 *
 * ⚠️ **Antes vivía dentro de `/calendario`**, y la Enmienda 1 lo sacó de ahí: el
 * Calendario volvió a ser exactamente [ADR-100](../../../docs/decisions.md#adr-100),
 * de sólo lectura. No queda ni un rastro del plan en esa ruta.
 */

import { Suspense } from "react";

import { Shell } from "@/components/shell/shell";
import { VistaDePlanVivo } from "@/components/superficies/plan-vivo";

export default function PlanPage() {
  return (
    <Shell nodo="PLAN_VIVO">
      <Suspense>
        <VistaDePlanVivo />
      </Suspense>
    </Shell>
  );
}
