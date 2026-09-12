"use client";

import type { PropsDeSuperficie } from "./consulta";

import { NoSePudoCargar } from "@/components/shell/no-se-pudo-cargar";
import { Formacion } from "@/components/screens/formacion";
import { useSuperficie } from "@/lib/client/superficie";
import type { FormacionProps } from "@/lib/domain/view-models";

/**
 * La biblioteca de Formación — [ADR-087](../../docs/decisions.md#adr-087).
 *
 * ⚠️ **No acepta `?escenario=`**, igual que `/materias`: el catálogo de fixtures
 * proyecta las nueve superficies del recorrido canónico y este nodo **no es una
 * de ellas**. Inventarle un escenario sería meterlo en el guion del focus group
 * sin que nadie lo haya decidido.
 *
 * ⚠️ **V1 es de solo lectura** — ADR-087 Enmienda 2. No hay botón de aplicar,
 * no hay selector de materia y `CTA-021` **no está en el registro canónico**:
 * la escritura no existe todavía, y una CTA registrada que prometiera crear una
 * `Action` sería un contrato incumplido. La vertical de aplicación es V2.
 */
/*
  ⚠️ **Acepta la consulta aunque no la lea, y por eso el parámetro está sin
  usar.** Las once superficies tienen la misma firma para que la ventana
  pueda elegir cuál dibujar por su ruta, sin un `if` por pantalla. Ésta no
  mira la URL —no acepta `?escenario=`— y eso no la hace distinta.
*/
// eslint-disable-next-line @typescript-eslint/no-unused-vars -- ver arriba: firma común.
export function VistaDeFormacion(_props: PropsDeSuperficie = {}) {
  const { respuesta, reintentar } = useSuperficie<FormacionProps>("/api/formacion");

  if (respuesta.estado === "CARGANDO") return null;
  if (respuesta.estado !== "OK") {
    return (
      <NoSePudoCargar
        motivo={respuesta.estado}
        onReintentar={respuesta.estado === "SIN_PADRON" ? undefined : reintentar}
      />
    );
  }

  return <Formacion {...respuesta.datos} />;
}
