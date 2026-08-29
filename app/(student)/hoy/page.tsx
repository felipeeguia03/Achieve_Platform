"use client";

import { useRouter } from "next/navigation";
import { HoyAutogestion } from "@/components/screens/hoy-autogestion";
import { getEscenario, proyectarHoy } from "@/lib/fixtures";
import { rutaDeCta } from "@/lib/navigation";

// La CTA del Hero deriva a la próxima acción (CTA-002); la lista de materias
// abre la materia (CTA-001). Los dos destinos salen del registro canónico.
const A_ACCION = rutaDeCta("CTA-002");
const A_MATERIA = rutaDeCta("CTA-001");

export default function HoyPage() {
  const router = useRouter();
  const props = proyectarHoy(getEscenario("FX-DAY-BASE"));
  if (!props) throw new Error("El escenario FX-DAY-BASE no proyecta UX01");

  return (
    <HoyAutogestion
      {...props}
      onAvanzar={A_ACCION ? () => router.push(A_ACCION) : undefined}
      onVerMateria={A_MATERIA ? () => router.push(A_MATERIA) : undefined}
    />
  );
}
