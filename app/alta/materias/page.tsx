"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { AltaMaterias, AltaMateriasEsqueleto, type RequisitoElegible } from "@/components/alta/materias";
import { NoSePudoCargar } from "@/components/shell/no-se-pudo-cargar";
import { enviar } from "@/lib/client/api";
import { t } from "@/lib/content/es-AR";
import { useSuperficie } from "@/lib/client/superficie";
import { leerClaveDePeriodo } from "@/lib/domain/periodo";

/**
 * `/alta/materias` — la confirmación del Mapa Académico Mínimo.
 *
 * El plan y el año llegan por query, pero **la verdad la tiene el servidor**:
 * `POST /api/alta/materias` valida que el plan esté publicado y sea de la
 * institución del estudiante. Un query editado a mano no alcanza para
 * inscribirse en el plan de otra institución.
 */
/**
 * A dónde va el estudiante después de confirmar: comisión y horarios
 * ([ADR-105](../../../docs/decisions.md#adr-105) §1). Si ya los contestó, el
 * gate lo lleva al paso que falte.
 */
const SIGUIENTE_PASO = "/alta/cursada";

function Pantalla() {
  const router = useRouter();
  const params = useSearchParams();
  const plan = params.get("plan") ?? "";
  const anio = Number(params.get("anio") ?? "0");
  // El período que el estudiante eligió en el paso anterior. Sin él no se
  // agrupa ni se confirma: se vuelve a preguntarlo, **nunca se infiere del mes**.
  const periodo = params.get("periodo") ?? "";
  const periodoLeido = leerClaveDePeriodo(periodo);

  const { respuesta, reintentar } = useSuperficie<{ requisitos: RequisitoElegible[] }>(
    `/api/catalogo/plan?plan=${encodeURIComponent(plan)}`,
    { omitir: !plan },
  );

  /*
    Sin plan en la URL no hay nada que mostrar: se vuelve al paso anterior en
    vez de dibujar una lista vacía que parezca una carrera sin materias.

    ⚠️ **En un efecto, no en el render.** Llamar a `router.replace` mientras el
    componente se renderiza rebota a `/alta/carrera` apenas se llega acá —
    `useSearchParams()` puede devolver vacío en el primer render dentro de
    `Suspense`, y la pantalla se saltaba sola. React lo avisa: *"Cannot update a
    component (Router) while rendering a different component"*.
  */
  const faltanDatos = !plan || !anio || periodoLeido === null;
  useEffect(() => {
    if (faltanDatos) router.replace("/alta/carrera");
  }, [faltanDatos, router]);
  // Sin plan no hay esqueleto: la pantalla se va, y dibujar una que se va salta.
  if (faltanDatos || periodoLeido === null) return null;

  if (respuesta.estado === "CARGANDO") return <AltaMateriasEsqueleto />;
  if (respuesta.estado !== "OK") {
    return (
      <NoSePudoCargar
        motivo={respuesta.estado}
        onReintentar={respuesta.estado === "SIN_PADRON" ? undefined : reintentar}
      />
    );
  }

  return (
    <AltaMaterias
      anioElegido={anio}
      semestreElegido={periodoLeido.semestre}
      requisitos={respuesta.datos.requisitos}
      onConfirmar={async (selecciones) => {
        const r = await enviar<{ inscripcion: string }>("/api/alta/materias", {
          plan,
          anio,
          periodo,
          selecciones,
        });
        if (r.estado === "RECHAZADO") return { ok: false, motivo: r.motivo };
        // Un `404` no se arregla insistiendo.
        if (r.estado === "NO_ENCONTRADO") return { ok: false, motivo: t("ALTA.ERROR.NO_DISPONIBLE") };
        if (r.estado !== "OK") return { ok: false };
        /*
          `replace` y no `push`: el alta ya ocurrió, y dejarla en el historial
          haría que el botón de atrás la ofreciera de nuevo sobre algo que ya
          está confirmado.

          **No hace falta una recarga dura** —la que sí necesita `/login`—:
          `/hoy` monta desde cero y su primera lectura ya sale con el alta
          completa. Acá no hay ninguna pantalla montada que la haya resuelto
          antes.
        */
        router.replace(SIGUIENTE_PASO);
        return { ok: true };
      }}
    />
  );
}

export default function AltaMateriasPage() {
  return (
    <Suspense>
      <Pantalla />
    </Suspense>
  );
}
