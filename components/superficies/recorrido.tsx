"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { NoSePudoCargar } from "@/components/shell/no-se-pudo-cargar";
import { Recorrido, RecorridoEsqueleto, type DatosDelRecorrido } from "@/components/screens/recorrido";
import { analiticoSintetico, enviar, subirAnaliticoArchivo } from "@/lib/client/api";
import { useSuperficie } from "@/lib/client/superficie";
import { t, type CopyId } from "@/lib/content/es-AR";
import { nodos } from "@/lib/navigation/surfaces";

/**
 * **Tu recorrido** — [ADR-106](../../docs/decisions.md#adr-106) y
 * [ADR-107](../../docs/decisions.md#adr-107).
 *
 * ⚠️ **No acepta `?escenario=`**: el analítico y las respuestas son **de este
 * estudiante**, como Gimnasia y Focus.
 *
 * Ata las llamadas y nada más: qué se vincula, qué se pregunta y qué se guarda
 * lo decide el servidor.
 */
export function VistaDeRecorrido() {
  const router = useRouter();
  const { respuesta, reintentar } = useSuperficie<DatosDelRecorrido>("/api/recorrido");
  const [ocupado, setOcupado] = useState(false);
  const [aviso, setAviso] = useState<string | null>(null);

  if (respuesta.estado === "CARGANDO") return <RecorridoEsqueleto />;
  if (respuesta.estado !== "OK") {
    return <NoSePudoCargar motivo={respuesta.estado} onReintentar={respuesta.estado === "SIN_PADRON" ? undefined : reintentar} />;
  }

  async function correr(accion: () => Promise<string | null>) {
    setOcupado(true);
    setAviso(null);
    const problema = await accion();
    setAviso(problema);
    setOcupado(false);
    reintentar();
  }

  async function subir(archivo: Blob) {
    const r = await subirAnaliticoArchivo(archivo);
    if (r.estado === "RECHAZADO") return r.motivo;
    if (r.estado === "ERROR") return t("ALTA.ERROR.RED");
    // Un fallo de extracción quedó registrado: la pantalla lo dice desde los datos.
    if (r.datos.estado === "FALLIDO" && r.datos.motivo) return t(`RECORRIDO.FALLO.${r.datos.motivo}` as CopyId);
    return null;
  }

  return (
    <Recorrido
      datos={respuesta.datos}
      ocupado={ocupado}
      aviso={aviso}
      acciones={{
        onConsentir: () =>
          correr(async () => {
            const r = await enviar("/api/recorrido/consentimiento", { decision: "GRANTED" });
            return r.estado === "OK" ? null : t("ALTA.ERROR.RED");
          }),
        // No guarda nada: sin analítico, Achieve funciona igual.
        onSinAnalitico: () => router.push(nodos.UX01.ruta ?? "/hoy"),
        onSubir: (archivo) => correr(() => subir(archivo)),
        onUsarSintetico: () =>
          correr(async () => {
            const pdf = await analiticoSintetico();
            return pdf ? subir(pdf) : t("ALTA.ERROR.RED");
          }),
        onRevisar: (resultado, decision, requisito, estado) =>
          correr(async () => {
            const r = await enviar("/api/recorrido/revision", { resultado, decision, requisito, estado });
            return r.estado === "OK" ? null : t("ALTA.ERROR.RED");
          }),
        onConfirmar: (documento) =>
          correr(async () => {
            const r = await enviar("/api/recorrido/confirmar", { documento });
            return r.estado === "OK" ? null : t("ALTA.ERROR.RED");
          }),
        onBorrar: () =>
          correr(async () => {
            const r = await enviar("/api/recorrido/analitico", {}, "DELETE");
            return r.estado === "OK" ? null : t("ALTA.ERROR.RED");
          }),
      }}
    />
  );
}
