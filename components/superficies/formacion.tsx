"use client";

import { useConsulta, type PropsDeSuperficie } from "./consulta";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { useMigaDelObjeto } from "@/components/shell/miga-del-objeto";
import { NoSePudoCargar } from "@/components/shell/no-se-pudo-cargar";
import { Formacion } from "@/components/screens/formacion";
import { useSuperficie } from "@/lib/client/superficie";
import { PARAM_PIEZA } from "@/lib/navigation/objeto-en-pantalla";
import { nodos } from "@/lib/navigation/surfaces";
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
export function VistaDeFormacion({ consulta }: PropsDeSuperficie = {}) {
  const { respuesta, reintentar } = useSuperficie<FormacionProps>("/api/formacion");
  const router = useRouter();
  const pathname = usePathname();
  const deLaBarra = useSearchParams();

  /*
    ⚠️ **La pieza abierta vive en la URL** — ADR-088, Enmienda 7. Adentro de una
    ventana se lee de la ruta de su objeto (`consulta`), no de la barra de
    direcciones: dos ventanas de dos videos mostrarían el mismo.
  */
  const abierta = useConsulta(consulta).get(PARAM_PIEZA);
  const pieza =
    respuesta.estado === "OK" ? (respuesta.datos.piezas.find((p) => p.id === abierta) ?? null) : null;

  // `Formación › Tengo mucho para estudiar…`: la sección no se renombra, el
  // video cuelga de ella (ver `migasDe`).
  useMigaDelObjeto(pieza?.titulo ?? null);

  /**
   * Abrir o cerrar una pieza **navega**.
   *
   * ⚠️ **Se conservan los demás parámetros de la barra** —las ventanas de
   * `?abierto=`, sobre todo—: abrir un video no puede bajar el escritorio. Y
   * desde una ventana se navega la pantalla de atrás, como cualquier otra CTA de
   * adentro (Enmienda 6): se va a Formación con el video puesto.
   */
  function alAbrir(id: string | null) {
    const base = nodos.FORMACION.ruta ?? pathname;
    const params = new URLSearchParams(pathname === base ? deLaBarra.toString() : "");
    if (id === null) params.delete(PARAM_PIEZA);
    else params.set(PARAM_PIEZA, id);
    const cola = params.toString();
    router.push(cola ? `${base}?${cola}` : base);
  }

  if (respuesta.estado === "CARGANDO") return null;
  if (respuesta.estado !== "OK") {
    return (
      <NoSePudoCargar
        motivo={respuesta.estado}
        onReintentar={respuesta.estado === "SIN_PADRON" ? undefined : reintentar}
      />
    );
  }

  return <Formacion {...respuesta.datos} abierta={pieza?.id ?? null} onAbrir={alAbrir} />;
}
