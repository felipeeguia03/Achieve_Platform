"use client";

import { useRouter } from "next/navigation";

import { AltaWhatsapp } from "@/components/alta/whatsapp";
import { enviar } from "@/lib/client/api";

/**
 * `/alta/whatsapp` — el tramo 1 del alta (ADR-042, orden aprobado).
 *
 * La página proyecta y navega; **no decide nada**. Si el registro falla, la
 * pantalla lo dice y el estudiante sigue donde estaba: no se lo manda adelante
 * fingiendo que se guardó.
 */
export default function AltaWhatsappPage() {
  const router = useRouter();

  return (
    <AltaWhatsapp
      onDecidir={async (decision) => {
        const r = await enviar<{ registrado: boolean }>("/api/alta/whatsapp", { decision });
        return { ok: r.estado === "OK" };
      }}
      onListo={() => router.replace("/alta/carrera")}
    />
  );
}
