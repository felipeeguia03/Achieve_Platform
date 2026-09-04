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
import { MOTIVO_DE_CAMBIO, t } from "@/lib/content/es-AR";
import type { CompromisoProps } from "@/lib/domain/view-models";

/** Lo que el `GET` agrega cuando todavía no hay compromiso: qué confirmar. */
type Propuesta = { accion: string; inicio: string; zona: string; minutos: number };
/** Y cuando lo que hay es un incumplimiento: qué rescatar — Etapa B6.9.1. */
type Rescate = { rescatado: string; inicio: string; zona: string; minutos: number };
/** Y cuando se puede mover: **cuál** y con qué acuerdo — ADR-050. */
type Cambio = { original: string; zona: string; minutos: number };
type ConPropuesta = CompromisoProps & {
  propuesta?: Propuesta;
  rescate?: Rescate | null;
  cambio?: Cambio | null;
};

/**
 * Lo que el servidor puede devolver y la proyección no produce — ADR-050.
 *
 * Las dos condiciones **temporales** llegan sólo por acá: la pantalla ofrece
 * horarios que ya validó, así que si el servidor las rechaza es porque el
 * tiempo corrió. Para el estudiante son la misma cosa —el horario que eligió
 * ya no sirve—, y se cuentan con la copy que ya existe.
 */
const EQUIVALENCIA: Record<string, string | undefined> = {
  ANTICIPACION_INSUFICIENTE: MOTIVO_DE_CAMBIO.SIN_HORARIO_POSIBLE,
  OTRO_DIA_CALENDARIO: MOTIVO_DE_CAMBIO.SIN_HORARIO_POSIBLE,
};

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

  /*
    «Horario actualizado» vive **acá arriba**, y no es un detalle de dónde
    poner un `useState`: confirmar el cambio vuelve a pedir el estado, y
    mientras la respuesta viaja esta función devuelve `null`. Todo lo que
    estuviera adentro de `Pantalla` se desmontaría con ella, y el mensaje
    desaparecería justo cuando hay algo que confirmar.
  */
  const [confirmacion, setConfirmacion] = useState<string | null>(null);

  const escenario = params.get("escenario");
  const { respuesta, reintentar } = useSuperficie<ConPropuesta>("/api/compromiso", { omitir: !!escenario });

  if (escenario) {
    const id = escenarioDesde(escenario, "compromiso") ?? "FX-DAY-BASE";
    const props = getEscenario(id).compromiso;
    if (!props) throw new Error(`El escenario ${id} no proyecta esta vista`);
    return <Pantalla props={props} router={router} params={params} confirmacion={confirmacion} setConfirmacion={setConfirmacion} />;
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

  return (
    <Pantalla
      props={respuesta.datos}
      router={router}
      params={params}
      recargar={reintentar}
      confirmacion={confirmacion}
      setConfirmacion={setConfirmacion}
    />
  );
}

function Pantalla({
  props,
  router,
  params,
  recargar,
  confirmacion,
  setConfirmacion,
}: {
  props: ConPropuesta;
  router: ReturnType<typeof useRouter>;
  params: ReturnType<typeof useSearchParams>;
  /** Vuelve a pedir el estado al servidor. Sin él, tras cambiar el horario la
   *  pantalla seguiría mostrando el acuerdo viejo. */
  recargar?: () => void;
  confirmacion: string | null;
  setConfirmacion: (v: string | null) => void;
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
    ── Cambiar horario — ADR-050 ──────────────────────────────────────────────

    Tres estados de pantalla, y ninguno describe al compromiso: si hay una
    llamada en curso, el «Horario actualizado» que se muestra después, y el
    bloque de no-elegible **cuando el servidor contradice lo que la pantalla
    había proyectado**. Ese último es el `409` del enunciado: no es un error
    técnico, es el producto diciendo que la elegibilidad cambió mientras tanto.
  */
  const [cambiando, setCambiando] = useState(false);
  const [cambioRechazado, setCambioRechazado] =
    useState<CompromisoProps["cambioDeHorario"]>(null);

  /*
    Una clave por horario elegido, no por clic ni por pantalla: el doble clic
    sobre el mismo horario es el mismo pedido —y el servidor devuelve la fila
    que ya creó—, mientras que elegir otro horario es un pedido distinto y
    reusar la clave lo haría chocar como `CONFLICTO_DE_CLAVE`.
  */
  const clavesDeCambio = useRef<Map<string, string>>(new Map());

  const cambio = props.cambio;

  async function cambiarHorario(inicio: string) {
    if (cambiando || !cambio) return;
    setCambiando(true);
    setConfirmacion(null);

    let clave = clavesDeCambio.current.get(inicio);
    if (!clave) {
      clave = crypto.randomUUID();
      clavesDeCambio.current.set(inicio, clave);
    }

    // `cambio` viene del servidor tal cual: la pantalla no arma el acuerdo.
    const r = await enviar<{ compromiso: string }>("/api/renegociacion", {
      ...cambio,
      inicio,
      clave,
    });

    setCambiando(false);

    if (r.estado === "OK") {
      setConfirmacion(t("COMPROMISO.HORARIO_ACTUALIZADO"));
      setCambioRechazado(null);
      // El sucesor es otra fila: sin releer, la pantalla seguiría mostrando el
      // acuerdo viejo, que ya está `RENEGOTIATED`.
      recargar?.();
      return;
    }

    if (r.estado === "RECHAZADO") {
      const codigo = r.codigo ?? "";
      setCambioRechazado({
        sePuede: false,
        motivo:
          MOTIVO_DE_CAMBIO[codigo as keyof typeof MOTIVO_DE_CAMBIO] ??
          EQUIVALENCIA[codigo] ??
          t("COMPROMISO.NO_SE_PUEDE_CAMBIAR"),
      });
      return;
    }
    setMotivo("No se pudo cambiar el horario. Probá de nuevo.");
  }

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

  /*
    Sin propuesta la vista es un compromiso ya existente: la CTA principal sólo
    navega, y **acá es donde vive el cambio de horario** (ADR-050). Es la única
    rama donde hay un acuerdo que mover: en la propuesta todavía no hay
    compromiso, y en el rescate la operación es otra.
  */
  if (!propuesta) {
    return (
      <Compromiso
        {...props}
        aviso={motivo ?? props.aviso}
        // El rechazo del servidor pisa a lo que la pantalla había proyectado:
        // es el `409` de elegibilidad, y se muestra como estado de producto.
        cambioDeHorario={cambioRechazado ?? props.cambioDeHorario}
        onAvanzar={destino ? () => router.push(destino) : undefined}
        onCambiarHorario={cambiarHorario}
        cambioEnCurso={cambiando}
        confirmacionDeCambio={confirmacion}
      />
    );
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
