"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { AltaMaterias, type RequisitoElegible } from "@/components/alta/materias";
import { NoSePudoCargar } from "@/components/shell/no-se-pudo-cargar";
import { enviar } from "@/lib/client/api";
import { t } from "@/lib/content/es-AR";
import { useSuperficie } from "@/lib/client/superficie";
import { periodoDeCursado } from "@/lib/domain/alta";

/**
 * `/alta/materias` — la confirmación del Mapa Académico Mínimo.
 *
 * El plan y el año llegan por query, pero **la verdad la tiene el servidor**:
 * `POST /api/alta/materias` valida que el plan esté publicado y sea de la
 * institución del estudiante. Un query editado a mano no alcanza para
 * inscribirse en el plan de otra institución.
 */
/** A dónde va el estudiante cuando el alta termina. */
const DESTINO_AL_TERMINAR = "/hoy";

function Pantalla() {
  const router = useRouter();
  const params = useSearchParams();
  const plan = params.get("plan") ?? "";
  const anio = Number(params.get("anio") ?? "0");

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
  const faltanDatos = !plan || !anio;
  useEffect(() => {
    if (faltanDatos) router.replace("/alta/carrera");
  }, [faltanDatos, router]);
  if (faltanDatos) return null;

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
    <AltaMaterias
      anioElegido={anio}
      requisitos={respuesta.datos.requisitos}
      onConfirmar={async (selecciones) => {
        const r = await enviar<{ inscripcion: string }>("/api/alta/materias", {
          plan,
          anio,
          periodo: periodoDeCursado(),
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
        router.replace(DESTINO_AL_TERMINAR);
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
