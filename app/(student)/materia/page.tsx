"use client";

import { useRouter } from "next/navigation";
import { MateriaCursado } from "@/components/screens/materia-cursado";
import { getEscenario } from "@/lib/fixtures";
import { rutaDeCta } from "@/lib/navigation";

// La CTA principal de esta superficie es CTA-002. Su destino sale del registro
// canónico, no de un recorrido lineal escrito a mano.
const DESTINO = rutaDeCta("CTA-002");

export default function MateriaCursadoPage() {
  const router = useRouter();
  const props = getEscenario("FX-DAY-BASE").materia;
  if (!props) throw new Error("El escenario FX-DAY-BASE no proyecta UX02");

  return (
    <MateriaCursado
      {...props}
      onAvanzar={DESTINO ? () => router.push(DESTINO) : undefined}
    />
  );
}
