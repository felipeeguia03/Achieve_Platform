"use client";

import { Suspense, useRef, useState } from "react";
import { Shell } from "@/components/shell/shell";
import { useRouter, useSearchParams } from "next/navigation";
import { Evidencia } from "@/components/screens/evidencia";
import { NoSePudoCargar } from "@/components/shell/no-se-pudo-cargar";
import { escenarioDesde, getEscenario } from "@/lib/fixtures";
import { useSuperficie } from "@/lib/client/superficie";
import { enviar, subirEvidencia } from "@/lib/client/api";
import { rutaDeCta, siguienteUrl } from "@/lib/navigation";
import type { EvidenciaProps } from "@/lib/domain/view-models";

/**
 * El compromiso al que se adjunta la entrega, y —si la entrega fue devuelta— a
 * qué evidencia sucede el reenvío. Ninguno es contenido de la pantalla.
 */
type ConCompromiso = EvidenciaProps & { compromiso?: string | null; anterior?: string | null };

const DESTINO = rutaDeCta("CTA-007");

/**
 * Etapa B2.6 — `UX05` desde la base.
 *
 * Con `?escenario=` proyecta el catálogo sintético; sin él pide `/api/evidencia` con la
 * sesión del estudiante. **Si la carga falla no se dibuja el fixture:** un
 * estado que no es el del estudiante es indistinguible de uno real.
 */
function Vista() {
  const router = useRouter();
  const params = useSearchParams();

  const escenario = params.get("escenario");
  const { respuesta, reintentar } = useSuperficie<ConCompromiso>("/api/evidencia", { omitir: !!escenario });

  if (escenario) {
    const id = escenarioDesde(escenario, "evidencia") ?? "FX-EVD-BASE";
    const props = getEscenario(id).evidencia;
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

  return <Pantalla props={respuesta.datos} router={router} params={params} recargar={reintentar} />;
}

function Pantalla({
  props,
  router,
  params,
  recargar,
}: {
  props: ConCompromiso;
  router: ReturnType<typeof useRouter>;
  params: ReturnType<typeof useSearchParams>;
  recargar?: () => void;
}) {
  /*
    `CTA-007` tiene **destino `null`** en el registro canónico: entregar no
    lleva a ninguna pantalla nueva. El estudiante se queda acá y ve que su
    entrega llegó y que todavía no fue validada — que es justamente lo que no
    debe parecer progreso. El guion del focus group sólo manda bajo
    `?escenario=`.
  */
  const escenario = params.get("escenario");
  const destino = escenario ? (siguienteUrl("/evidencia", escenario) ?? DESTINO) : null;
  const compromiso = props.compromiso;
  const anterior = props.anterior;

  // Una clave por pantalla, no por clic (D2·A): es lo que hace del doble clic
  // el mismo pedido.
  const clave = useRef<string>(undefined);
  clave.current ??= crypto.randomUUID();
  const [enCurso, setEnCurso] = useState(false);
  const [motivo, setMotivo] = useState<string | null>(null);

  /*
    **El reenvío** — `CTA-008`, Etapa B6.9.2. Mismo orden que la primera
    entrega —firmar, subir, registrar— porque la clave del objeto se deriva del
    id reservado. Lo que cambia es a dónde va: `/api/reenvio` crea una fila
    **que sucede a la anterior y la preserva** (`I4`), y eso no es lo mismo que
    entregar por primera vez.
  */
  async function reenviar() {
    if (enCurso || !anterior) return;
    setEnCurso(true);
    setMotivo(null);

    const nombre = props.nombreAdjuntoDemo;
    const firma = await enviar<{ evidenciaId: string; url: string }>(
      `/api/evidencia?firmar=${encodeURIComponent(nombre)}`,
      {},
    );
    if (firma.estado !== "OK") {
      setEnCurso(false);
      setMotivo("No se pudo preparar la subida. Probá de nuevo.");
      return;
    }

    const subida = await subirEvidencia(firma.datos.url, `Corrección sintética · ${nombre}`);
    if (!subida) {
      setEnCurso(false);
      setMotivo("No se pudo subir el archivo. Probá de nuevo.");
      return;
    }

    const r = await enviar<{ evidencia: string }>("/api/reenvio", {
      anterior,
      evidencia: firma.datos.evidenciaId,
      clave: clave.current,
    });

    setEnCurso(false);
    if (r.estado === "OK") {
      if (destino) router.push(destino);
      else recargar?.();
      return;
    }
    setMotivo(r.estado === "RECHAZADO" ? r.motivo : "No se pudo registrar el reenvío.");
  }

  if (anterior) {
    return (
      <Evidencia
        {...props}
        aviso={motivo ?? props.aviso}
        ctaPrimaria={
          props.ctaPrimaria ? { ...props.ctaPrimaria, habilitada: !enCurso } : props.ctaPrimaria
        }
        onAvanzar={reenviar}
      />
    );
  }

  // Sin compromiso vivo no hay a qué adjuntar: la CTA sólo navega.
  if (!compromiso) {
    return <Evidencia {...props} onAvanzar={destino ? () => router.push(destino) : undefined} />;
  }

  /*
    La entrega, en el orden que fijó D3·A: **primero sube el archivo, después
    nace la fila**. Si esto se corta a la mitad queda un objeto huérfano en el
    bucket y ninguna `Evidence` que afirme una entrega que no ocurrió.
  */
  async function entregar() {
    if (enCurso) return;
    setEnCurso(true);
    setMotivo(null);

    const nombre = props.nombreAdjuntoDemo;
    const firma = await enviar<{ evidenciaId: string; url: string }>(
      `/api/evidencia?firmar=${encodeURIComponent(nombre)}`,
      {},
    );
    if (firma.estado !== "OK") {
      setEnCurso(false);
      setMotivo("No se pudo preparar la subida. Probá de nuevo.");
      return;
    }

    const subida = await subirEvidencia(firma.datos.url, `Entrega sintética · ${nombre}`);

    if (!subida) {
      setEnCurso(false);
      setMotivo("No se pudo subir el archivo. Probá de nuevo.");
      return;
    }

    const r = await enviar<{ evidencia: string }>("/api/evidencia", {
      compromiso,
      evidencia: firma.datos.evidenciaId,
      clave: clave.current,
    });

    if (r.estado === "OK") {
      setEnCurso(false);
      // Sin destino, la pantalla se recarga y pasa a decir que la evidencia
      // llegó y está pendiente de validación.
      if (destino) router.push(destino);
      else recargar?.();
      return;
    }
    setEnCurso(false);
    setMotivo(r.estado === "RECHAZADO" ? r.motivo : "No se pudo registrar la entrega.");
  }

  return (
    <Evidencia
      {...props}
      aviso={motivo ?? props.aviso}
      ctaPrimaria={
        props.ctaPrimaria ? { ...props.ctaPrimaria, habilitada: !enCurso } : props.ctaPrimaria
      }
      onAvanzar={entregar}
    />
  );
}

export default function EvidenciaPage() {
  return (
    <Shell nodo="UX05">
      <Suspense>
        <Vista />
      </Suspense>
    </Shell>
  );
}
