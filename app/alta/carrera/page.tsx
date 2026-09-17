"use client";

import { useRouter } from "next/navigation";

import { AltaCarrera, AltaCarreraEsqueleto, type InstitucionElegible, type PlanResuelto } from "@/components/alta/carrera";
import { NoSePudoCargar } from "@/components/shell/no-se-pudo-cargar";
import { pedir, enviar } from "@/lib/client/api";
import { claveDePeriodo } from "@/lib/domain/periodo";
import { useSuperficie } from "@/lib/client/superficie";

/**
 * `/alta/carrera` — universidad, carrera, año, año lectivo y semestre.
 *
 * ⚠️ **`GET /api/alta` es la única ruta del estudiante sin gate**: si el alta se
 * gateara a sí misma, no habría forma de completarla.
 */
interface RespuestaDelAlta {
  alta: { completa: boolean; siguiente: string | null };
  /** **La** del estudiante, no una lista: la fijó el padrón. */
  institucion: InstitucionElegible;
}

/**
 * Los años lectivos que se ofrecen: el calendario y sus dos vecinos. **Es la
 * lista, no la respuesta**: ninguno llega elegido (ADR-105 §2). Alguien que
 * completa el alta en diciembre puede estar cerrando un año o empezando el otro,
 * y eso sólo lo sabe él.
 */
function aniosLectivosOfrecidos(): number[] {
  const hoy = new Date().getFullYear();
  return [hoy - 1, hoy, hoy + 1];
}

export default function AltaCarreraPage() {
  const router = useRouter();
  const { respuesta, reintentar } = useSuperficie<RespuestaDelAlta>("/api/alta");

  if (respuesta.estado === "CARGANDO") return <AltaCarreraEsqueleto />;
  if (respuesta.estado !== "OK") {
    return (
      <NoSePudoCargar
        motivo={respuesta.estado}
        onReintentar={respuesta.estado === "SIN_PADRON" ? undefined : reintentar}
      />
    );
  }

  return (
    <AltaCarrera
      institucion={respuesta.datos.institucion}
      onResolverPlan={async (carreraId) => {
        const r = await pedir<PlanResuelto>(`/api/alta/carrera?carrera=${encodeURIComponent(carreraId)}`);
        return r.estado === "OK" ? r.datos : null;
      }}
      onAniosDelPlan={async (planId) => {
        const r = await pedir<{ requisitos: { anio: number | null }[] }>(
          `/api/catalogo/plan?plan=${encodeURIComponent(planId)}`,
        );
        if (r.estado !== "OK") return [];
        // Los años que el plan **declara**. `null` no es un año, y no se rellena
        // con un rango inventado.
        const vistos = new Set<number>();
        for (const req of r.datos.requisitos) if (req.anio !== null) vistos.add(req.anio);
        return [...vistos].sort((a, b) => a - b);
      }}
      aniosLectivos={aniosLectivosOfrecidos()}
      onContinuar={async ({ planId, anio, anioLectivo, semestre }) => {
        const periodo = claveDePeriodo(anioLectivo, semestre);
        const r = await enviar<{ inscripcion: string }>("/api/alta/carrera", {
          plan: planId,
          anio,
          periodo,
        });
        if (r.estado === "NO_ENCONTRADO") return { ok: false as const, fallo: "NO_DISPONIBLE" as const };
        if (r.estado !== "OK") return { ok: false as const, fallo: "RED" as const };
        router.replace(
          `/alta/materias?plan=${encodeURIComponent(planId)}&anio=${anio}&periodo=${encodeURIComponent(periodo)}`,
        );
        return { ok: true as const };
      }}
    />
  );
}
