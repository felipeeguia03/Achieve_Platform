"use client";

import { Suspense } from "react";
import { Shell } from "@/components/shell/shell";
import { useRouter, useSearchParams } from "next/navigation";
import { HoyAutogestion } from "@/components/screens/hoy-autogestion";
import { NoSePudoCargar } from "@/components/shell/no-se-pudo-cargar";
import { escenarioDesde, getEscenario, proyectarHoy } from "@/lib/fixtures";
import { useSuperficie } from "@/lib/client/superficie";
import { rutaDeCta, rutaDeCtaCon, siguienteUrl } from "@/lib/navigation";
import { useEspacioDeTrabajo } from "@/components/shell/espacio-de-trabajo";
import type { HoyProps, TableroProps } from "@/lib/domain/view-models";

// Los tres destinos salen del registro canónico, no de un recorrido escrito a
// mano: CTA-002 a la próxima acción, CTA-001 a la materia, CTA-009 al progreso.
const A_ACCION = rutaDeCta("CTA-002");
const A_MATERIA = rutaDeCta("CTA-001");
const A_PROGRESO = rutaDeCta("CTA-009");

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
function Hoy() {
  const router = useRouter();
  const params = useSearchParams();

  const escenario = params.get("escenario");
  const { respuesta, reintentar } = useSuperficie<HoyProps>("/api/hoy", { omitir: !!escenario });

  /**
   * El tablero — [ADR-093](../../../docs/decisions.md#adr-093), que reemplaza la
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

  // Mientras llega la respuesta no se dibuja nada: mostrar un estado que no es
  // el del estudiante y reemplazarlo un segundo después es peor que esperar
  // (`P-12`: nada salta al cargar).
  if (respuesta.estado === "CARGANDO") return null;
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
      router={router}
      params={params}
    />
  );
}

function Pantalla({
  props,
  router,
  params,
}: {
  props: HoyProps;
  router: ReturnType<typeof useRouter>;
  params: ReturnType<typeof useSearchParams>;
}) {
  const destino = siguienteUrl("/hoy", params.get("escenario")) ?? A_ACCION;
  const { abrir } = useEspacioDeTrabajo();

  /**
   * Abrir una materia **como objeto del espacio de trabajo** —
   * [ADR-088](../../../docs/decisions.md#adr-088) §10.6.
   *
   * ⚠️ **No duplica la navegación.** La ruta sale del registro canónico
   * (`rutaDeCtaCon` la lee de `CTA-001`), igual que `onVerMateria`: lo único que
   * agrega es que el objeto quede abierto para volver. Dos formas de abrir la
   * misma materia sería exactamente lo que §10.6 pide evitar.
   */
  function abrirMateria(m: { cursadaId: string; nombre: string }) {
    const ruta = rutaDeCtaCon("CTA-001", m.cursadaId) ?? A_MATERIA;
    if (!ruta) return;
    abrir({
      tipo: "materia",
      entidadId: m.cursadaId,
      etiqueta: m.nombre,
      /*
        ⚠️ **La evaluación NO va acá, y se probó mirándolo.** *"Parcial 1 ·
        practico · sáb 26 sept"* como contexto empujaba el nombre de la materia a
        `ANALISI…`, que es exactamente el anti-patrón `A-07` que
        [ADR-088](../../../docs/decisions.md#adr-088) §3 se comprometió a no
        reproducir.

        El contexto de un objeto es **la materia a la que pertenece** —
        *"Unidad 2 · Economía"*—. Una materia **es** el objeto, así que no tiene
        contexto: va sola, entera y legible.
      */
      etiquetaSecundaria: null,
      ruta,
    });
  }

  return (
    <HoyAutogestion
      {...props}
      onAbrirMateria={abrirMateria}
      onAvanzar={destino ? () => router.push(destino) : undefined}
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
    />
  );
}

export default function HoyPage() {
  return (
    <Shell nodo="UX01">
      <Suspense>
        <Hoy />
      </Suspense>
    </Shell>
  );
}
