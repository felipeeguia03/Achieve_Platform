"use client";

import { Suspense } from "react";
import { Shell } from "@/components/shell/shell";
import { useRouter, useSearchParams } from "next/navigation";
import { PasoDeProtocolo } from "@/components/screens/paso-de-protocolo";
import { NoSePudoCargar } from "@/components/shell/no-se-pudo-cargar";
import { getEscenario, escenarioUX09Desde } from "@/lib/fixtures";
import { useSuperficie } from "@/lib/client/superficie";
import { rutaDeCta } from "@/lib/navigation";
import type { PasoProtocoloProps } from "@/lib/domain/view-models";

const AL_OVERVIEW = "/examen/overview";
const A_ACCION = rutaDeCta("CTA-013");

/**
 * Etapa B5.5 — `UX09` desde la base.
 *
 * **Abrir el paso no lo completa**, y esta pantalla no escribe nada al
 * renderizar: el aviso de apertura lo dice y no hay `POST` en el camino de
 * lectura. Completar es una operación aparte, con su propio verbo, porque
 * marcar "visto" al abrir es exactamente lo que `product.md` §5.6 prohíbe.
 */
function Paso() {
  const router = useRouter();
  const params = useSearchParams();

  const escenario = params.get("escenario");
  const preparacion = params.get("preparacion");
  const paso = params.get("paso");
  const ruta =
    preparacion && paso
      ? `/api/examen/paso?preparacion=${encodeURIComponent(preparacion)}&paso=${encodeURIComponent(paso)}`
      : "/api/examen/paso";
  const { respuesta, reintentar } = useSuperficie<PasoProtocoloProps>(ruta, {
    omitir: !!escenario,
  });

  if (escenario) {
    const id = escenarioUX09Desde(escenario) ?? "FX-LOCAL-PASO-COMPLETO";
    const props = getEscenario(id).ux09;
    if (!props) throw new Error(`El escenario ${id} no proyecta UX09`);
    const destino = props.ctaPrimaria?.texto === "COMPROMETERME" ? A_ACCION : null;
    return (
      <PasoDeProtocolo
        {...props}
        onAvanzar={destino ? () => router.push(destino) : undefined}
        onVolver={() => router.push(AL_OVERVIEW)}
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
  // Abrir el recurso es navegación, no transición (§19.3), y acá no hay recurso
  // configurado: la única CTA con destino real es la que lleva a la Action.
  const destino = props.ctaPrimaria?.texto === "COMPROMETERME" ? A_ACCION : null;

  return (
    <PasoDeProtocolo
      {...props}
      onAvanzar={destino ? () => router.push(destino) : undefined}
      onVolver={() => router.push(AL_OVERVIEW)}
    />
  );
}

export default function PasoDeProtocoloPage() {
  return (
    <Shell nodo="UX09">
      <Suspense>
        <Paso />
      </Suspense>
    </Shell>
  );
}
