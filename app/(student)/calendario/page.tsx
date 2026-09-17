/**
 * La ruta del **Calendario** — [ADR-100](../../../docs/decisions.md#adr-100).
 *
 * ⚠️ **`CALENDARIO` no es una superficie**: es un nodo sin wireframe, como
 * `/materias`, `/formacion` y `/clase`. Hay trece rutas bajo `app/(student)` y
 * nueve superficies, y las dos cifras se verifican por separado.
 *
 * 🧪 **Plan vivo** — [ADR-110](../../../docs/decisions.md#adr-110). La página es
 * de servidor y **dinámica** (`connection()`) para leer
 * `PLAN_VIVO_CALENDAR_INTEGRATION` en cada pedido, igual que `GET /api/plan-vivo`:
 * prerenderizada, el flag quedaba fijado al compilar.
 */

import { connection } from "next/server";
import { Suspense } from "react";

import { Shell } from "@/components/shell/shell";
import { VistaDelCalendario } from "@/components/superficies/calendario-o-plan";
import { ProveedorDePlanVivo } from "@/lib/client/plan-vivo-flag";
import { planVivoEnCalendario } from "@/lib/server/plan-vivo-flag";

export default async function CalendarioPage() {
  await connection();
  return (
    <ProveedorDePlanVivo activo={planVivoEnCalendario()}>
      <Shell nodo="CALENDARIO">
        <Suspense>
          <VistaDelCalendario />
        </Suspense>
      </Shell>
    </ProveedorDePlanVivo>
  );
}
