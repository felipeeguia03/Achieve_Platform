"use client";

import { Suspense } from "react";
import { Shell } from "@/components/shell/shell";
import { useRouter, useSearchParams } from "next/navigation";
import { HoyAutogestion } from "@/components/screens/hoy-autogestion";
import { NoSePudoCargar } from "@/components/shell/no-se-pudo-cargar";
import { escenarioDesde, getEscenario, proyectarHoy } from "@/lib/fixtures";
import { useSuperficie } from "@/lib/client/superficie";
import { rutaDeCta, siguienteUrl } from "@/lib/navigation";
import type { HoyProps } from "@/lib/domain/view-models";

// Los tres destinos salen del registro canónico, no de un recorrido escrito a
// mano: CTA-002 a la próxima acción, CTA-001 a la materia, CTA-009 al progreso.
const A_ACCION = rutaDeCta("CTA-002");
const A_MATERIA = rutaDeCta("CTA-001");
const A_PROGRESO = rutaDeCta("CTA-009");

/**
 * Etapa B2.6 — de dónde salen los datos, y qué pasa cuando no salen.
 *
 * **Con `?escenario=`, del catálogo sintético; sin él, de `/api/hoy` con la
 * sesión del estudiante.** Las dos ramas dan el **mismo `HoyProps`**, así que
 * la pantalla no distingue — que es lo que la frontera de la Fase 0 venía
 * preparando.
 *
 * Lo que cambia respecto de la `B2.5`: **si la carga falla, no se dibuja el
 * fixture.** Antes el `fetch` iba sin token, respondía `401` y la ruta caía al
 * catálogo sin decirlo, así que en un navegador `UX01` nunca mostró datos
 * persistidos y parecía que sí.
 *
 * El catálogo no se retira: bajo `?escenario=` explícito sigue siendo el guion
 * del focus group y el mapa de estados críticos.
 */
function Hoy() {
  const router = useRouter();
  const params = useSearchParams();

  const escenario = params.get("escenario");
  const { respuesta, reintentar } = useSuperficie<HoyProps>("/api/hoy", { omitir: !!escenario });

  if (escenario) {
    const id = escenarioDesde(escenario, "hoy") ?? "FX-DAY-BASE";
    const props = proyectarHoy(getEscenario(id));
    if (!props) throw new Error(`El escenario ${id} no proyecta UX01`);
    return <Pantalla props={props} router={router} params={params} />;
  }

  // Mientras llega la respuesta no se dibuja nada: mostrar un estado que no es
  // el del estudiante y reemplazarlo un segundo después es peor que esperar
  // (`P-12`: nada salta al cargar).
  if (respuesta.estado === "CARGANDO") return null;
  if (respuesta.estado !== "OK") {
    return (
      <NoSePudoCargar
        motivo={respuesta.estado}
        // `SIN_PADRON` no ofrece reintento: la habilitación la da la
        // institución y el estudiante no tiene con qué cambiarla.
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
  props: HoyProps;
  router: ReturnType<typeof useRouter>;
  params: ReturnType<typeof useSearchParams>;
}) {
  const destino = siguienteUrl("/hoy", params.get("escenario")) ?? A_ACCION;

  return (
    <HoyAutogestion
      {...props}
      onAvanzar={destino ? () => router.push(destino) : undefined}
      onVerMateria={A_MATERIA ? () => router.push(A_MATERIA) : undefined}
      onVerProgreso={A_PROGRESO ? () => router.push(A_PROGRESO) : undefined}
    />
  );
}

export default function HoyPage() {
  return (
    <Shell nodo="UX01">
      <Suspense>
        <Hoy />
      </Suspense>
    </Shell>
  );
}
