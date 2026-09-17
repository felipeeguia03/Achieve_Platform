"use client";

import { useRouter } from "next/navigation";

import { AltaCursada, AltaCursadaEsqueleto, type CursadaDelPasoProps } from "@/components/alta/cursada";
import { NoSePudoCargar } from "@/components/shell/no-se-pudo-cargar";
import { enviar } from "@/lib/client/api";
import { useSuperficie } from "@/lib/client/superficie";

/**
 * `/alta/cursada` — el cuarto y último paso del alta: comisión y horarios.
 * [ADR-105](../../../docs/decisions.md#adr-105).
 *
 * La página proyecta y navega; **no decide**. Qué se ofrece lo lee
 * `GET /api/alta/cursada`, y qué horario queda lo decide la base.
 */
export default function AltaCursadaPage() {
  const router = useRouter();
  const { respuesta, reintentar } = useSuperficie<{ cursadas: CursadaDelPasoProps[] }>("/api/alta/cursada");

  if (respuesta.estado === "CARGANDO") return <AltaCursadaEsqueleto />;
  if (respuesta.estado !== "OK") {
    return (
      <NoSePudoCargar
        motivo={respuesta.estado}
        onReintentar={respuesta.estado === "SIN_PADRON" ? undefined : reintentar}
      />
    );
  }

  return (
    <AltaCursada
      cursadas={respuesta.datos.cursadas}
      onGuardar={async (cursadas) => {
        const r = await enviar<{ cursadas: number }>("/api/alta/cursada", { cursadas });
        if (r.estado === "RECHAZADO") return { ok: false, motivo: r.motivo };
        if (r.estado !== "OK") return { ok: false };
        // Es el último paso: a Hoy. Si faltara alguno, el gate lo lleva ahí.
        router.replace("/hoy");
        return { ok: true };
      }}
    />
  );
}
