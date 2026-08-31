"use client";

import { Suspense } from "react";
import { Shell } from "@/components/shell/shell";
import { useRouter, useSearchParams } from "next/navigation";
import { Evidencia } from "@/components/screens/evidencia";
import { NoSePudoCargar } from "@/components/shell/no-se-pudo-cargar";
import { escenarioDesde, getEscenario } from "@/lib/fixtures";
import { useSuperficie } from "@/lib/client/superficie";
import { rutaDeCta, siguienteUrl } from "@/lib/navigation";
import type { EvidenciaProps } from "@/lib/domain/view-models";

const DESTINO = rutaDeCta("CTA-007");

/**
 * Etapa B2.6 — `UX05` desde la base.
 *
 * Con `?escenario=` proyecta el catálogo sintético; sin él pide `/api/evidencia` con la
 * sesión del estudiante. **Si la carga falla no se dibuja el fixture:** un
 * estado que no es el del estudiante es indistinguible de uno real.
 */
function Vista() {
  const router = useRouter();
  const params = useSearchParams();

  const escenario = params.get("escenario");
  const { respuesta, reintentar } = useSuperficie<EvidenciaProps>("/api/evidencia", { omitir: !!escenario });

  if (escenario) {
    const id = escenarioDesde(escenario, "evidencia") ?? "FX-EVD-BASE";
    const props = getEscenario(id).evidencia;
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
  props: EvidenciaProps;
  router: ReturnType<typeof useRouter>;
  params: ReturnType<typeof useSearchParams>;
}) {
  // El recorrido de focus group manda sobre el destino genérico: en una
  // sesión, la CTA tiene que llevar a la estación siguiente.
  const destino = siguienteUrl("/evidencia", params.get("escenario")) ?? DESTINO;

  return <Evidencia {...props} onAvanzar={destino ? () => router.push(destino) : undefined} />;
}

export default function EvidenciaPage() {
  return (
    <Shell nodo="UX05">
      <Suspense>
        <Vista />
      </Suspense>
    </Shell>
  );
}
