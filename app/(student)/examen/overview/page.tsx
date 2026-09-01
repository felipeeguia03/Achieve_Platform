"use client";

import { Suspense } from "react";
import { Shell } from "@/components/shell/shell";
import { useRouter, useSearchParams } from "next/navigation";
import { OverviewModoExamen } from "@/components/screens/overview-modo-examen";
import { NoSePudoCargar } from "@/components/shell/no-se-pudo-cargar";
import { getEscenario, escenarioUX08Desde } from "@/lib/fixtures";
import { useSuperficie } from "@/lib/client/superficie";
import { rutaDeCta, siguienteUrl } from "@/lib/navigation";
import type { OverviewExamenProps } from "@/lib/domain/view-models";

const AL_PASO = rutaDeCta("CTA-012");
const A_CURSADO = "/materia";

/**
 * Etapa B5.5 — `UX08` desde la base.
 *
 * **La CTA de avance sólo navega cuando hay un paso al que ir.** Hoy nadie
 * escribe `current_step_id`, así que la superficie muestra el recorrido con lo
 * que cada paso lleva trabajado y dice *"todavía no hay un paso para abrir"*.
 * Elegir uno por posición en la lista es lo que `product.md` §8.1 prohíbe, y
 * desde `HUMAN-P0-01 v1.0` además sería falso.
 */
function Overview() {
  const router = useRouter();
  const params = useSearchParams();

  const escenario = params.get("escenario");
  const preparacion = params.get("preparacion");
  const ruta = preparacion
    ? `/api/examen?preparacion=${encodeURIComponent(preparacion)}`
    : "/api/examen";
  const { respuesta, reintentar } = useSuperficie<OverviewExamenProps>(ruta, {
    omitir: !!escenario,
  });

  if (escenario) {
    const id = escenarioUX08Desde(escenario) ?? "FX-LOCAL-OV-ACTIVA";
    const props = getEscenario(id).ux08;
    if (!props) throw new Error(`El escenario ${id} no proyecta UX08`);
    const destino = siguienteUrl("/examen/overview", escenario) ?? AL_PASO;
    return (
      <OverviewModoExamen
        {...props}
        onAvanzar={destino ? () => router.push(destino) : undefined}
        onVolver={() => router.push(A_CURSADO)}
      />
    );
  }

  if (respuesta.estado === "CARGANDO") return null;
  if (respuesta.estado !== "OK") {
    return (
      <NoSePudoCargar
        motivo={respuesta.estado}
        onReintentar={respuesta.estado === "SIN_PADRON" ? undefined : reintentar}
      />
    );
  }

  return (
    <OverviewModoExamen {...respuesta.datos} onVolver={() => router.push(A_CURSADO)} />
  );
}

export default function OverviewModoExamenPage() {
  return (
    <Shell nodo="UX08">
      <Suspense>
        <Overview />
      </Suspense>
    </Shell>
  );
}
