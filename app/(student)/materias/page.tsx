"use client";

import { Suspense } from "react";
import { useRouter } from "next/navigation";

import { Shell } from "@/components/shell/shell";
import { NoSePudoCargar } from "@/components/shell/no-se-pudo-cargar";
import { IndiceDeMaterias } from "@/components/screens/indice-de-materias";
import { useSuperficie } from "@/lib/client/superficie";
import { rutaDeCtaCon } from "@/lib/navigation";
import type { MateriasProps } from "@/lib/domain/view-models";

/**
 * El área «Materias» — [ADR-077](../../../docs/decisions.md#adr-077).
 *
 * ⚠️ **No acepta `?escenario=`, a diferencia de las nueve superficies.** El
 * catálogo de fixtures proyecta las superficies del recorrido canónico y este
 * nodo **no es una de ellas**: inventarle un escenario sería agregarlo al guión
 * del focus group sin que nadie lo haya decidido. Sin sesión, la pantalla dice
 * que no pudo cargar — que es la verdad.
 */
function Vista() {
  const router = useRouter();
  const { respuesta, reintentar } = useSuperficie<MateriasProps>("/api/materias");

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
    <IndiceDeMaterias
      {...respuesta.datos}
      // `CTA-001` **con la cursada de la fila que se tocó**: es lo que ADR-054
      // opción `B` corrigió, y el índice lo hereda sin trabajo adicional. Abrir
      // la quinta fila abre la quinta materia.
      onAbrirMateria={(cursadaId) => {
        const destino = rutaDeCtaCon("CTA-001", cursadaId);
        if (destino) router.push(destino);
      }}
    />
  );
}

export default function MateriasPage() {
  return (
    <Shell nodo="UX02_INDICE">
      <Suspense>
        <Vista />
      </Suspense>
    </Shell>
  );
}
