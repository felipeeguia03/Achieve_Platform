"use client";

import type { PropsDeSuperficie } from "./consulta";

import { useRouter } from "next/navigation";

import { NoSePudoCargar } from "@/components/shell/no-se-pudo-cargar";
import { IndiceDeMaterias } from "@/components/screens/indice-de-materias";
import { useSuperficie } from "@/lib/client/superficie";
import { rutaDeCtaCon } from "@/lib/navigation";
import { useEspacioDeTrabajo } from "@/components/shell/espacio-de-trabajo";
import { objetoDeMateria } from "@/lib/navigation/objetos-de-superficie";
import type { MateriasProps } from "@/lib/domain/view-models";

/**
 * El área «Materias» — [ADR-077](../../docs/decisions.md#adr-077).
 *
 * ⚠️ **No acepta `?escenario=`, a diferencia de las nueve superficies.** El
 * catálogo de fixtures proyecta las superficies del recorrido canónico y este
 * nodo **no es una de ellas**: inventarle un escenario sería agregarlo al guión
 * del focus group sin que nadie lo haya decidido. Sin sesión, la pantalla dice
 * que no pudo cargar — que es la verdad.
 */
/*
  ⚠️ **Acepta la consulta aunque no la lea, y por eso el parámetro está sin
  usar.** Las once superficies tienen la misma firma para que la ventana
  pueda elegir cuál dibujar por su ruta, sin un `if` por pantalla. Ésta no
  mira la URL —no acepta `?escenario=`— y eso no la hace distinta.
*/
// eslint-disable-next-line @typescript-eslint/no-unused-vars -- ver arriba: firma común.
export function VistaDeMaterias(_props: PropsDeSuperficie = {}) {
  const router = useRouter();
  const { abrir } = useEspacioDeTrabajo();
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
      /*
        ⚠️ **La navegación es la misma que antes, y sigue saliendo del registro
        canónico.** Lo que agrega [ADR-088](../../docs/decisions.md#adr-088)
        es que la materia quede **abierta como objeto**, para volver sin pasar
        de nuevo por el índice.

        Sin espacio de trabajo montado, `abrir` es inerte y `router.push` hace
        exactamente lo que hacía: la pantalla no se entera.
      */
      onAbrirMateria={(cursadaId) => {
        const destino = rutaDeCtaCon("CTA-001", cursadaId);
        if (!destino) return;
        const materia = respuesta.datos.materias.find((m) => m.cursadaId === cursadaId);
        // El objeto lo arma `objetoDeMateria`, que es el único lugar donde se
        // decide cómo entra una materia a la barra — Enmienda 6.
        if (materia) {
          abrir(objetoDeMateria(materia.cursadaId, materia.nombre, destino));
          return;
        }
        router.push(destino);
      }}
    />
  );
}
