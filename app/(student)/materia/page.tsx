"use client";

import { Suspense } from "react";
import { Shell } from "@/components/shell/shell";
import { useRouter, useSearchParams } from "next/navigation";
import { MateriaCursado } from "@/components/screens/materia-cursado";
import { NoSePudoCargar } from "@/components/shell/no-se-pudo-cargar";
import { escenarioDesde, getEscenario } from "@/lib/fixtures";
import { useSuperficie } from "@/lib/client/superficie";
import { rutaDeCta, siguienteUrl } from "@/lib/navigation";
import type { MateriaProps } from "@/lib/domain/view-models";

const DESTINO = rutaDeCta("CTA-002");

/**
 * Etapa B2.6 — `UX02` desde la base.
 *
 * Mismo patrón que `UX01`: con `?escenario=` proyecta el catálogo sintético;
 * sin él pide `/api/materia` con la sesión del estudiante. **Si la carga falla
 * no se dibuja el fixture**, porque un día que no es el del estudiante es
 * indistinguible de uno real.
 */
function Vista() {
  const router = useRouter();
  const params = useSearchParams();

  const escenario = params.get("escenario");
  // `?cursada=` sólo viaja si está: sin él el backend elige la de la Action viva.
  const cursada = params.get("cursada");
  const ruta = cursada ? `/api/materia?cursada=${encodeURIComponent(cursada)}` : "/api/materia";
  const { respuesta, reintentar } = useSuperficie<MateriaProps>(ruta, { omitir: !!escenario });

  if (escenario) {
    const id = escenarioDesde(escenario, "materia") ?? "FX-DAY-BASE";
    const props = getEscenario(id).materia;
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
  props: MateriaProps;
  router: ReturnType<typeof useRouter>;
  params: ReturnType<typeof useSearchParams>;
}) {
  // El recorrido de focus group manda sobre el destino genérico: en una
  // sesión, la CTA tiene que llevar a la estación siguiente.
  const destino = siguienteUrl("/materia", params.get("escenario")) ?? DESTINO;

  return (
    <MateriaCursado {...props} onAvanzar={destino ? () => router.push(destino) : undefined} />
  );
}

export default function MateriaCursadoPage() {
  return (
    <Shell nodo="UX02">
      <Suspense>
        <Vista />
      </Suspense>
    </Shell>
  );
}
