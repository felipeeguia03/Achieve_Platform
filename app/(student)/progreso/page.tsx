"use client";

import { Suspense } from "react";
import { Shell } from "@/components/shell/shell";
import { useRouter, useSearchParams } from "next/navigation";
import { ProgresoBitacora } from "@/components/screens/progreso-bitacora";
import { NoSePudoCargar } from "@/components/shell/no-se-pudo-cargar";
import { escenarioDesde, getEscenario } from "@/lib/fixtures";
import { useSuperficie } from "@/lib/client/superficie";
import { rutaDeCta, siguienteUrl } from "@/lib/navigation";
import type { ProgresoProps } from "@/lib/domain/view-models";

const DESTINO = rutaDeCta("CTA-010");

/**
 * Etapa B2.6 — `UX06` desde la base.
 *
 * Con `?escenario=` proyecta el catálogo sintético; sin él pide `/api/progreso`
 * con la sesión del estudiante. **Si la carga falla no se dibuja el fixture:**
 * un progreso que no es el del estudiante es indistinguible de uno real, y acá
 * el costo de esa confusión es el más alto de las nueve superficies — el
 * fixture muestra una dimensión que cambió.
 */
function Vista() {
  const router = useRouter();
  const params = useSearchParams();

  const escenario = params.get("escenario");
  const { respuesta, reintentar } = useSuperficie<ProgresoProps>("/api/progreso", { omitir: !!escenario });

  if (escenario) {
    const id = escenarioDesde(escenario, "progreso") ?? "FX-LOCAL-PROG-VALIDATED";
    const props = getEscenario(id).progreso;
    if (!props) throw new Error(`El escenario ${id} no proyecta esta vista`);
    return <Pantalla props={props} router={router} params={params} />;
  }

  // Mientras llega la respuesta no se dibuja nada (`P-12`: nada salta al cargar).
  if (respuesta.estado === "CARGANDO") return null;
  if (respuesta.estado !== "OK") {
    return (
      <NoSePudoCargar
        motivo={respuesta.estado}
        onReintentar={respuesta.estado === "SIN_PADRON" ? undefined : reintentar}
      />
    );
  }

  return <Pantalla props={respuesta.datos} router={router} params={params} />;
}

function Pantalla({
  props,
  router,
  params,
}: {
  props: ProgresoProps;
  router: ReturnType<typeof useRouter>;
  params: ReturnType<typeof useSearchParams>;
}) {
  // El recorrido de focus group manda sobre el destino genérico: en una
  // sesión, la CTA tiene que llevar a la estación siguiente.
  const destino = siguienteUrl("/progreso", params.get("escenario")) ?? DESTINO;

  return (
    <ProgresoBitacora {...props} onAvanzar={destino ? () => router.push(destino) : undefined} />
  );
}

export default function ProgresoBitacoraPage() {
  return (
    <Shell nodo="UX06">
      <Suspense>
        <Vista />
      </Suspense>
    </Shell>
  );
}
