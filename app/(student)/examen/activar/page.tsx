"use client";

import { Suspense, useState } from "react";
import { Shell } from "@/components/shell/shell";
import { useRouter, useSearchParams } from "next/navigation";
import { ActivacionModoExamen } from "@/components/screens/activacion-modo-examen";
import { NoSePudoCargar } from "@/components/shell/no-se-pudo-cargar";
import { getEscenario, escenarioUX07Desde } from "@/lib/fixtures";
import { useSuperficie } from "@/lib/client/superficie";
import { enviar } from "@/lib/client/api";
import { rutaDeCta, siguienteUrl } from "@/lib/navigation";
import type { ActivacionExamenProps } from "@/lib/domain/view-models";

const A_OVERVIEW = rutaDeCta("CTA-011");
const A_MATERIA = "/materia";

/**
 * Etapa B5.5 — `UX07` desde la base.
 *
 * Mismo patrón que las seis superficies de la B2.6: con `?escenario=` proyecta
 * el catálogo sintético, sin él pide `/api/examen/activacion`. **Si la carga
 * falla no se dibuja el fixture.**
 *
 * Lo que cambia respecto de aquéllas es que ésta **escribe**: `CTA-011` no
 * navega, activa. Por eso el botón hace `POST` y sólo navega cuando el servidor
 * confirmó el `ACTIVE`; navegar primero y activar después dejaría al estudiante
 * mirando un overview de una preparación que no arrancó.
 */
function Activacion() {
  const router = useRouter();
  const params = useSearchParams();
  const [rechazo, setRechazo] = useState<string | null>(null);

  const escenario = params.get("escenario");
  const cursada = params.get("cursada");
  const ruta = cursada
    ? `/api/examen/activacion?cursada=${encodeURIComponent(cursada)}`
    : "/api/examen/activacion";
  const { respuesta, reintentar } = useSuperficie<ActivacionExamenProps>(ruta, {
    omitir: !!escenario,
  });

  if (escenario) {
    const id = escenarioUX07Desde(escenario) ?? "FX-EXAM-BASE";
    const props = getEscenario(id).ux07;
    if (!props) throw new Error(`El escenario ${id} no proyecta UX07`);
    const destino = siguienteUrl("/examen/activar", escenario) ?? A_OVERVIEW;
    return (
      <ActivacionModoExamen
        {...props}
        onActivar={destino ? () => router.push(destino) : undefined}
        onVolver={() => router.push(A_MATERIA)}
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

  const props = respuesta.datos;
  const preparacion = props.preparacionId;

  async function activar() {
    setRechazo(null);
    const r = await enviar<{ preparacion: string }>("/api/examen/activacion", { preparacion });
    if (r.estado === "RECHAZADO") return setRechazo(r.motivo);
    if (r.estado !== "OK") return setRechazo("No se pudo activar la preparación.");
    router.push(`/examen/overview?preparacion=${encodeURIComponent(r.datos.preparacion)}`);
  }

  return (
    <ActivacionModoExamen
      {...props}
      aviso={rechazo ?? props.aviso}
      onActivar={props.ctaPrimaria && preparacion ? activar : undefined}
      onVolver={() => router.push(A_MATERIA)}
    />
  );
}

export default function ActivarModoExamenPage() {
  return (
    <Shell nodo="UX07">
      <Suspense>
        <Activacion />
      </Suspense>
    </Shell>
  );
}
