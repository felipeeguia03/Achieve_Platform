"use client";

import { Suspense, useEffect, useState } from "react";
import { Shell } from "@/components/shell/shell";
import { useRouter, useSearchParams } from "next/navigation";
import { HoyAutogestion } from "@/components/screens/hoy-autogestion";
import { escenarioDesde, getEscenario, proyectarHoy } from "@/lib/fixtures";
import { rutaDeCta, siguienteUrl } from "@/lib/navigation";
import type { HoyProps } from "@/lib/domain/view-models";

// Los tres destinos salen del registro canónico, no de un recorrido escrito a
// mano: CTA-002 a la próxima acción, CTA-001 a la materia, CTA-009 al progreso.
const A_ACCION = rutaDeCta("CTA-002");
const A_MATERIA = rutaDeCta("CTA-001");
const A_PROGRESO = rutaDeCta("CTA-009");

/**
 * Etapa B2.5 — de dónde salen los datos.
 *
 * **Con `?escenario=`, del catálogo sintético; sin él, de `/api/hoy`.** Las dos
 * ramas devuelven el **mismo `HoyProps`**, así que la pantalla no distingue —
 * que es exactamente lo que la frontera de la Fase 0 venía preparando.
 *
 * El catálogo no se retira: es el guion del focus group y el mapa de estados
 * críticos, y sirve para mostrar en la demo un estado que la base todavía no
 * tiene.
 */
function useDia(escenario: string | null) {
  const [desdeApi, setDesdeApi] = useState<HoyProps | null>(null);
  const [cargando, setCargando] = useState(!escenario);

  useEffect(() => {
    if (escenario) return;
    let vigente = true;
    fetch("/api/hoy")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => vigente && setDesdeApi(d))
      .catch(() => vigente && setDesdeApi(null))
      .finally(() => vigente && setCargando(false));
    return () => {
      vigente = false;
    };
  }, [escenario]);

  return { desdeApi, cargando };
}

function Hoy() {
  const router = useRouter();
  const params = useSearchParams();

  const escenario = params.get("escenario");
  const { desdeApi, cargando } = useDia(escenario);

  const id = escenarioDesde(escenario, "hoy") ?? "FX-DAY-BASE";
  const props = desdeApi ?? proyectarHoy(getEscenario(id));
  if (!props) throw new Error(`El escenario ${id} no proyecta UX01`);
  // Mientras llega la respuesta no se dibuja el fixture: mostrar un estado que
  // no es el del estudiante y reemplazarlo un segundo después es peor que
  // esperar (P-12: nada salta al cargar).
  if (cargando && !escenario) return null;

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
