/**
 * La ruta de **Mi plan** — [ADR-110 · Enmienda 1](../../../docs/decisions.md#adr-110-enmienda-1).
 *
 * ⚠️ **`PLAN_VIVO` no es una superficie**: es un nodo sin wireframe, como
 * `/calendario`, `/materias`, `/formacion` y `/clase`. Hay **diecisiete** rutas
 * bajo `app/(student)` y **nueve** superficies, y las dos cifras se verifican
 * por separado en `tests/shell.test.tsx`.
 *
 * ⚠️ **`404` sin `PLAN_VIVO=1`.** La página es de servidor y **dinámica**
 * (`connection()`) para leer la variable en cada pedido, igual que
 * `GET /api/plan-vivo`: prerenderizada, el flag quedaba fijado al compilar y
 * prenderlo después no habría abierto la ruta.
 *
 * ⚠️ **Antes vivía dentro de `/calendario`**, y la Enmienda 1 lo sacó de ahí: el
 * Calendario volvió a ser exactamente [ADR-100](../../../docs/decisions.md#adr-100),
 * de sólo lectura. No queda ni un rastro del plan en esa ruta.
 */

import { connection } from "next/server";
import { Suspense } from "react";

import { Shell } from "@/components/shell/shell";
import { VistaDePlanVivo } from "@/components/superficies/plan-vivo";
import { planVivoActivo } from "@/lib/server/plan-vivo-flag";
import { notFound } from "next/navigation";

export default async function PlanPage() {
  await connection();
  if (!planVivoActivo()) notFound();
  return (
    <Shell nodo="PLAN_VIVO">
      <Suspense>
        <VistaDePlanVivo />
      </Suspense>
    </Shell>
  );
}
