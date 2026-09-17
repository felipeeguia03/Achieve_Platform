"use client";

import { useConsulta, type PropsDeSuperficie } from "./consulta";

import { usePathname, useRouter } from "next/navigation";

import { Calendario } from "@/components/screens/calendario";
import { NoSePudoCargar } from "@/components/shell/no-se-pudo-cargar";
import { useSuperficie } from "@/lib/client/superficie";
import {
  desplazarVista,
  esFechaDeCalendario,
  grillaDelMes,
  type VistaDeCalendario,
} from "@/lib/domain/calendario";
import { rutaDeCtaCon } from "@/lib/navigation";
import { nodos } from "@/lib/navigation/surfaces";
import type { CalendarioProps, EventoDeCalendario } from "@/lib/domain/view-models";

/**
 * El **Calendario** — [ADR-100](../../docs/decisions.md#adr-100).
 *
 * ⚠️ **No acepta `?escenario=`**, como Materias: el catálogo de fixtures proyecta
 * el recorrido canónico y este nodo no es parte de él. Sin sesión, la pantalla
 * dice que no pudo cargar.
 *
 * ## Dónde vive el estado
 *
 * **En la URL** —`?vista=semana&fecha=2026-09-14&clases=0`—, no en `useState`
 * ni en el navegador. Volver atrás desde una clase devuelve la misma semana, y
 * un enlace copiado abre lo mismo. Nada de esto es dominio: es dónde está
 * mirando el estudiante.
 *
 * ⚠️ **Se pide siempre la grilla del mes que contiene la fecha.** Moverse entre
 * días o semanas del mismo mes no vuelve a pedir nada.
 */
export function VistaDeCalendario({ consulta }: PropsDeSuperficie) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useConsulta(consulta);

  const hoyLocal = hoyEnElNavegador();
  const vista = leerVista(params.get("vista"));
  const fechaPedida = params.get("fecha");
  const fecha = esFechaDeCalendario(fechaPedida) ? fechaPedida : hoyLocal;
  const mostrarClases = params.get("clases") !== "0";
  const mostrarCompromisos = params.get("compromisos") !== "0";

  const { desde, hasta } = grillaDelMes(fecha);
  const { respuesta, reintentar } = useSuperficie<CalendarioProps>(
    `/api/calendario?desde=${desde}&hasta=${hasta}`,
  );

  function cambiar(cambios: Record<string, string | null>) {
    const siguiente = new URLSearchParams(params.toString());
    for (const [clave, valor] of Object.entries(cambios)) {
      if (valor === null) siguiente.delete(clave);
      else siguiente.set(clave, valor);
    }
    const texto = siguiente.toString();
    router.replace(texto ? `${pathname}?${texto}` : pathname, { scroll: false });
  }

  if (respuesta.estado !== "OK" && respuesta.estado !== "CARGANDO") {
    return (
      <NoSePudoCargar
        motivo={respuesta.estado}
        onReintentar={respuesta.estado === "SIN_PADRON" ? undefined : reintentar}
      />
    );
  }

  return (
    <Calendario
      vista={vista}
      fecha={fecha}
      datos={respuesta.estado === "OK" ? respuesta.datos : null}
      hoyLocal={hoyLocal}
      mostrarClases={mostrarClases}
      mostrarCompromisos={mostrarCompromisos}
      onVista={(v) => cambiar({ vista: v === "mes" ? null : v })}
      onFecha={(f) => cambiar({ fecha: f })}
      onAnterior={() => cambiar({ fecha: desplazarVista(vista, fecha, -1) })}
      onSiguiente={() => cambiar({ fecha: desplazarVista(vista, fecha, 1) })}
      onAlternarClases={() => cambiar({ clases: mostrarClases ? "0" : null })}
      onAlternarCompromisos={() => cambiar({ compromisos: mostrarCompromisos ? "0" : null })}
      onAbrir={(e) => {
        const destino = rutaDelEvento(e);
        if (destino) router.push(destino);
      }}
    />
  );
}

function leerVista(v: string | null): VistaDeCalendario {
  return v === "dia" || v === "semana" ? v : "mes";
}

/** `YYYY-MM-DD` de hoy en la zona del navegador. El del servidor lo corrige al llegar. */
function hoyEnElNavegador(): string {
  return new Intl.DateTimeFormat("en-CA", { year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
}

/**
 * La ruta de cada evento. **Se lee del grafo**, no se escribe acá.
 *
 * - Clase que el estudiante abrió ese día → esa clase, como en *Tus clases*.
 * - Clase sin abrir y evaluación → su materia, con `CTA-001` y la cursada.
 * - Compromiso → ese compromiso.
 */
export function rutaDelEvento(e: EventoDeCalendario): string | null {
  const enlace = e.enlace;
  if (enlace.a === "materia") return rutaDeCtaCon("CTA-001", enlace.cursadaId);
  if (enlace.a === "clase") {
    const base = nodos.CLASE.ruta;
    if (!base) return null;
    // La abierta es `/clase` pelada: es la que la API devuelve sin parámetro.
    return enlace.activa ? base : `${base}?clase=${encodeURIComponent(enlace.claseId)}`;
  }
  const base = nodos.UX04.ruta;
  return base ? `${base}?compromiso=${encodeURIComponent(enlace.compromisoId)}` : null;
}
