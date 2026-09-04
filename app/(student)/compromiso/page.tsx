"use client";

import { Suspense, useRef, useState } from "react";
import { Shell } from "@/components/shell/shell";
import { useRouter, useSearchParams } from "next/navigation";
import { Compromiso } from "@/components/screens/compromiso";
import { NoSePudoCargar } from "@/components/shell/no-se-pudo-cargar";
import { escenarioDesde, getEscenario } from "@/lib/fixtures";
import { useSuperficie } from "@/lib/client/superficie";
import { enviar } from "@/lib/client/api";
import { rutaDeCta, siguienteUrl } from "@/lib/navigation";
import type { CompromisoProps } from "@/lib/domain/view-models";

/** Lo que el `GET` agrega cuando todavía no hay compromiso: qué confirmar. */
type Propuesta = { accion: string; inicio: string; zona: string; minutos: number };
/** Y cuando lo que hay es un incumplimiento: qué rescatar — Etapa B6.9.1. */
type Rescate = { rescatado: string; inicio: string; zona: string; minutos: number };
type ConPropuesta = CompromisoProps & { propuesta?: Propuesta; rescate?: Rescate | null };

const DESTINO = rutaDeCta("CTA-004");

/**
 * Etapa B2.6 — `UX04` desde la base.
 *
 * Con `?escenario=` proyecta el catálogo sintético; sin él pide `/api/compromiso` con la
 * sesión del estudiante. **Si la carga falla no se dibuja el fixture:** un
 * estado que no es el del estudiante es indistinguible de uno real.
 */
function Vista() {
  const router = useRouter();
  const params = useSearchParams();

  const escenario = params.get("escenario");
  const { respuesta, reintentar } = useSuperficie<ConPropuesta>("/api/compromiso", { omitir: !!escenario });

  if (escenario) {
    const id = escenarioDesde(escenario, "compromiso") ?? "FX-DAY-BASE";
    const props = getEscenario(id).compromiso;
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

  return <Pantalla props={respuesta.datos} router={router} params={params} />;
}

function Pantalla({
  props,
  router,
  params,
}: {
  props: ConPropuesta;
  router: ReturnType<typeof useRouter>;
  params: ReturnType<typeof useSearchParams>;
}) {
  /*
    El guion del focus group manda **sólo bajo `?escenario=`**, que es cuando
    hay una sesión guiada que recorrer. En el camino real manda el registro
    canónico: `CTA-004` lleva a `UX01` después de confirmar, y ahí el estudiante
    ve su compromiso ya tomado. Cruzarlos mandaba el recorrido real a una
    pantalla de fixture.
  */
  const escenario = params.get("escenario");
  const destino = escenario ? (siguienteUrl("/compromiso", escenario) ?? DESTINO) : DESTINO;
  const { propuesta } = props;

  /*
    La clave de idempotencia se genera **una vez por pantalla**, no por clic
    (D2·A). Es lo que hace que el doble clic sea el mismo pedido y no dos:
    con una clave nueva por clic, el segundo sería un compromiso distinto y el
    servidor no tendría con qué reconocerlo.
  */
  const clave = useRef<string>(undefined);
  clave.current ??= crypto.randomUUID();
  const [enCurso, setEnCurso] = useState(false);
  const [motivo, setMotivo] = useState<string | null>(null);
  const rescate = props.rescate;

  /*
    **La salida de un incumplimiento** — Etapa B6.9.1. `CTA-015`: «Retomar» no
    edita el compromiso incumplido, que sigue `MISSED` para siempre; crea otro
    objeto que lo rescata. Por eso va a `/api/rescate` y no a `/api/compromiso`:
    son dos cosas distintas y la ruta lo dice.
  */
  async function retomar() {
    if (enCurso || !rescate) return;
    setEnCurso(true);
    setMotivo(null);

    const r = await enviar<{ compromiso: string }>("/api/rescate", {
      ...rescate,
      clave: clave.current,
    });

    if (r.estado === "OK") {
      if (destino) router.push(destino);
      return;
    }
    setEnCurso(false);
    setMotivo(r.estado === "RECHAZADO" ? r.motivo : "No se pudo crear el rescate. Probá de nuevo.");
  }

  if (rescate) {
    return (
      <Compromiso
        {...props}
        aviso={motivo ?? props.aviso}
        ctaPrimaria={
          props.ctaPrimaria ? { ...props.ctaPrimaria, habilitada: !enCurso } : props.ctaPrimaria
        }
        onAvanzar={retomar}
      />
    );
  }

  // Sin propuesta la vista es un compromiso ya existente: la CTA sólo navega.
  if (!propuesta) {
    return <Compromiso {...props} onAvanzar={destino ? () => router.push(destino) : undefined} />;
  }

  /*
    Acá nace el `Commitment`, y sólo acá. Es la intención explícita del
    estudiante: ni abrir la pantalla ni llegar navegando escriben nada.
  */
  async function confirmar() {
    if (enCurso) return;
    setEnCurso(true);
    setMotivo(null);

    const r = await enviar<{ compromiso: string }>("/api/compromiso", {
      ...propuesta,
      clave: clave.current,
    });

    if (r.estado === "OK") {
      if (destino) router.push(destino);
      return;
    }
    setEnCurso(false);
    setMotivo(
      r.estado === "RECHAZADO" ? r.motivo : "No se pudo confirmar el compromiso. Probá de nuevo.",
    );
  }

  return (
    <Compromiso
      {...props}
      aviso={motivo ?? props.aviso}
      ctaPrimaria={
        props.ctaPrimaria ? { ...props.ctaPrimaria, habilitada: !enCurso } : props.ctaPrimaria
      }
      onAvanzar={confirmar}
    />
  );
}

export default function CompromisoPage() {
  return (
    <Shell nodo="UX04">
      <Suspense>
        <Vista />
      </Suspense>
    </Shell>
  );
}
