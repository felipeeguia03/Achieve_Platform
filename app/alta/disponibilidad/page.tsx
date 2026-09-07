"use client";

import { useRouter } from "next/navigation";

import { AltaDisponibilidad } from "@/components/alta/disponibilidad";
import { enviar } from "@/lib/client/api";

/**
 * `/alta/disponibilidad` — el paso 4 del alta ([ADR-073](../../../docs/decisions.md#adr-073)).
 *
 * La página proyecta y navega; **no decide nada**. Si el guardado falla, la
 * pantalla lo dice y el estudiante sigue donde estaba.
 */
export default function AltaDisponibilidadPage() {
  const router = useRouter();

  return (
    <AltaDisponibilidad
      onDeclarar={async (bloques) => {
        const r = await enviar<{ bloques: number }>("/api/alta/disponibilidad", { bloques });
        return { ok: r.estado === "OK" };
      }}
      // Es el último paso: de acá se sale al producto.
      onListo={() => router.replace("/hoy")}
    />
  );
}
