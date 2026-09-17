"use client";

import { useConsulta, type PropsDeSuperficie } from "./consulta";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { HoyAutogestion, HoyAutogestionEsqueleto } from "@/components/screens/hoy-autogestion";
import { NoSePudoCargar } from "@/components/shell/no-se-pudo-cargar";
import { escenarioDesde, getEscenario, proyectarHoy } from "@/lib/fixtures";
import { useSuperficie } from "@/lib/client/superficie";
import { enviar } from "@/lib/client/api";
import { rutaDeCta, rutaDeCtaCon, siguienteUrl } from "@/lib/navigation";
import type { HoyProps, TableroProps } from "@/lib/domain/view-models";
import { heroLlevaAFocus, irAFocus } from "./ir-a-focus";

// Los tres destinos salen del registro canónico, no de un recorrido escrito a
// mano: CTA-002 a la próxima acción, CTA-001 a la materia, CTA-009 al progreso.
const A_ACCION = rutaDeCta("CTA-002");
const A_MATERIA = rutaDeCta("CTA-001");
const A_PROGRESO = rutaDeCta("CTA-009");
// ADR-098: `CTA-022` lleva a la clase. Entrar y volver terminan en la misma pantalla.
const A_CLASE = rutaDeCta("CTA-022");

/**
 * Etapa B2.6 — de dónde salen los datos, y qué pasa cuando no salen.
 *
 * **Con `?escenario=`, del catálogo sintético; sin él, de `/api/hoy` con la
 * sesión del estudiante.** Las dos ramas dan el **mismo `HoyProps`**, así que
 * la pantalla no distingue — que es lo que la frontera de la Fase 0 venía
 * preparando.
 *
 * Lo que cambia respecto de la `B2.5`: **si la carga falla, no se dibuja el
 * fixture.** Antes el `fetch` iba sin token, respondía `401` y la ruta caía al
 * catálogo sin decirlo, así que en un navegador `UX01` nunca mostró datos
 * persistidos y parecía que sí.
 *
 * El catálogo no se retira: bajo `?escenario=` explícito sigue siendo el guion
 * del focus group y el mapa de estados críticos.
 */
export function VistaDeHoy({ consulta }: PropsDeSuperficie) {
  const router = useRouter();
  const params = useConsulta(consulta);

  const escenario = params.get("escenario");
  const { respuesta, reintentar } = useSuperficie<HoyProps>("/api/hoy", { omitir: !!escenario });

  /**
   * El tablero — [ADR-093](../../docs/decisions.md#adr-093), que reemplaza la
   * capa «anticipar» de ADR-089.
   *
   * ⚠️ **Se pide aparte, como antes el panorama.** Si falla o todavía no llegó,
   * `UX01` se dibuja **sin tablero** en vez de no dibujarse: la capa que conduce
   * no depende de la que acompaña. `estado_del_dia()` no se tocó.
   */
  const tablero = useSuperficie<TableroProps>("/api/tablero", { omitir: !!escenario });

  if (escenario) {
    const id = escenarioDesde(escenario, "hoy") ?? "FX-DAY-BASE";
    const props = proyectarHoy(getEscenario(id));
    if (!props) throw new Error(`El escenario ${id} no proyecta UX01`);
    return <Pantalla props={props} router={router} params={params} />;
  }

  // Mientras llega la respuesta va el esqueleto, **no un estado**: mostrar uno
  // que no es el del estudiante y reemplazarlo un segundo después es peor que
  // esperar. El esqueleto no afirma nada y tiene la forma de lo que viene
  // (`P-12`: nada salta al cargar).
  if (respuesta.estado === "CARGANDO") return <HoyAutogestionEsqueleto />;
  if (respuesta.estado !== "OK") {
    return (
      <NoSePudoCargar
        motivo={respuesta.estado}
        // `SIN_PADRON` no ofrece reintento: la habilitación la da la
        // institución y el estudiante no tiene con qué cambiarla.
        onReintentar={respuesta.estado === "SIN_PADRON" ? undefined : reintentar}
      />
    );
  }

  return (
    <Pantalla
      props={{
        ...respuesta.datos,
        // `OK` o nada. Un estado de carga o un error **no se dibujan como un
        // tablero vacío**: eso afirmaría que no hay evaluaciones ni riesgos.
        tablero: tablero.respuesta.estado === "OK" ? tablero.respuesta.datos : null,
      }}
      tableroCargando={tablero.respuesta.estado === "CARGANDO"}
      router={router}
      params={params}
    />
  );
}

function Pantalla({
  props,
  router,
  params,
  tableroCargando = false,
}: {
  props: HoyProps;
  router: ReturnType<typeof useRouter>;
  params: URLSearchParams;
  tableroCargando?: boolean;
}) {
  const destino = siguienteUrl("/hoy", params.get("escenario")) ?? A_ACCION;

  /**
   * Entrar a una materia — `CTA-001` con la cursada de la fila.
   *
   * ⚠️ **Entrar no la guarda en la barra** — [ADR-088](../../docs/decisions.md#adr-088),
   * Enmienda 7. La materia se abre entera, con sus controles al lado de la
   * miga; queda en la barra cuando el estudiante la minimiza o la achica.
   */
  function abrirMateria(m: { cursadaId: string; nombre: string }) {
    const ruta = rutaDeCtaCon("CTA-001", m.cursadaId) ?? A_MATERIA;
    if (ruta) router.push(ruta);
  }

  /**
   * Entrar a clase — `CTA-022`, [ADR-098](../../docs/decisions.md#adr-098).
   *
   * Pide la clase y va a ella. **Si ya había una abierta**, de esta materia o de
   * otra, el servidor la devuelve o contesta `409` con ella: en los dos casos se
   * va a `/clase`, que muestra la abierta. Lo que no se hace es abrir otra.
   *
   * ⚠️ **Sólo en el camino real.** Bajo `?escenario=` no hay backend que abra
   * nada, y la fila no ofrece entrar.
   */
  const [entrando, setEntrando] = useState(false);
  async function entrarAClase(c: { cursadaId: string; bloqueId: string | null }) {
    if (!A_CLASE || entrando) return;
    setEntrando(true);
    const r = await enviar<{ clase: string }>("/api/clase", { cursada: c.cursadaId, bloque: c.bloqueId });
    setEntrando(false);
    if (r.estado === "OK" || r.estado === "RECHAZADO") router.push(A_CLASE);
  }

  return (
    <HoyAutogestion
      {...props}
      tableroCargando={tableroCargando}
      onAbrirMateria={abrirMateria}
      onAvanzar={
        /*
          ADR-104 §4: con un compromiso iniciable o la acción en curso, la CTA
          principal es `CTA-026` y lleva a Focus. Bajo `?escenario=` manda el
          guion, que no tiene backend que empiece nada.
        */
        !params.get("escenario") && heroLlevaAFocus(props.hero.nivel, props.hero.variante)
          ? () => void irAFocus(router, {}, destino)
          : destino
            ? () => router.push(destino)
            : undefined
      }
      /*
        ADR-054, opción `B`: se abre **la cursada de la fila que se tocó**, no la
        que el backend elija. El nombre del parámetro sale del registro canónico
        —`rutaDeCtaCon` lo lee de `CTA-001`—, así que esta página no lo conoce.

        Sin cursada, la ruta queda pelada y el backend elige como antes: es el
        Track A, donde el escenario no tiene `course_enrollment` que nombrar.
      */
      onVerMateria={
        A_MATERIA ? (cursadaId) => router.push(rutaDeCtaCon("CTA-001", cursadaId) ?? A_MATERIA) : undefined
      }
      onVerProgreso={A_PROGRESO ? () => router.push(A_PROGRESO) : undefined}
      onEntrarAClase={params.get("escenario") ? undefined : (c) => void entrarAClase(c)}
    />
  );
}
