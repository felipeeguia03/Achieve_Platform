"use client";

import { useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { useConsulta, type PropsDeSuperficie } from "./consulta";
import { useMigaDelObjeto } from "@/components/shell/miga-del-objeto";
import { NoSePudoCargar } from "@/components/shell/no-se-pudo-cargar";
import { Gimnasia, GimnasiaEsqueleto, nombreDeJuego } from "@/components/screens/gimnasia";
import { claveNueva } from "@/components/screens/gimnasia/comun";
import { SesionDeGimnasia, type AccionesDeGimnasia } from "@/components/screens/gimnasia/sesion";
import { enviar } from "@/lib/client/api";
import { useSuperficie } from "@/lib/client/superficie";
import { t } from "@/lib/content/es-AR";
import type { Juego, OrigenDeSesion } from "@/lib/domain/gimnasia/rutina";
import type {
  GimnasiaProps,
  IntentoEmpezado,
  RespuestaRegistrada,
  ResultadoDeIntento,
  SesionEnCurso,
} from "@/lib/domain/gimnasia/vista";
import { PARAM_SESION_DE_GIMNASIA } from "@/lib/navigation/objeto-en-pantalla";
import { nodos } from "@/lib/navigation/surfaces";

/**
 * **Gimnasia cognitiva** — [ADR-102](../../docs/decisions.md#adr-102).
 *
 * ⚠️ **No acepta `?escenario=`**, igual que Formación: el catálogo de fixtures es
 * el del recorrido canónico y este nodo no es parte de él.
 *
 * ⚠️ **La sesión abierta vive en la URL** (`?sesion=`). Con eso la rutina vuelve
 * después de una recarga, tiene ficha en la barra al minimizarla (*Gimnasia ·
 * Memoria*) y el botón atrás la deja. Sin el parámetro, la portada.
 *
 * ⚠️ **Nada de lo que la pantalla muestra lo decide el navegador.** La rutina,
 * la dificultad, las preguntas y los resultados vienen del servidor; acá sólo se
 * atan las llamadas.
 */
interface SesionDeLaApi {
  id: string;
  origen: OrigenDeSesion;
  juegos: Juego[];
  iniciadaEn: string;
}

export function VistaDeGimnasia({ consulta }: PropsDeSuperficie = {}) {
  const { respuesta, reintentar } = useSuperficie<GimnasiaProps>("/api/gimnasia");
  const router = useRouter();
  const pathname = usePathname();
  const deLaBarra = useSearchParams();
  const sesionId = useConsulta(consulta).get(PARAM_SESION_DE_GIMNASIA);

  // La que se empezó en esta pantalla: la proyección no se vuelve a pedir en el medio de una rutina.
  const [iniciada, setIniciada] = useState<SesionEnCurso | null>(null);
  const [ocupado, setOcupado] = useState(false);
  const [aviso, setAviso] = useState<string | null>(null);

  const datos = respuesta.estado === "OK" ? respuesta.datos : null;
  const sesion =
    sesionId === null
      ? null
      : iniciada?.id === sesionId
        ? iniciada
        : datos?.sesionEnCurso?.id === sesionId
          ? datos.sesionEnCurso
          : null;

  // `Gimnasia › Memoria`, y en la barra *Gimnasia · Memoria* (ver `objetoEnPantalla`).
  useMigaDelObjeto(sesion ? (sesion.origen === "ROUTINE" ? t("GIMNASIA.RUTINA.CATEGORIA") : nombreDeJuego(sesion.juegos[0])) : null);

  /** Navega a Gimnasia con o sin sesión, **conservando las ventanas de la barra**. */
  function navegar(id: string | null) {
    const base = nodos.GIMNASIA.ruta ?? pathname;
    const params = new URLSearchParams(pathname === base ? deLaBarra.toString() : "");
    if (id === null) params.delete(PARAM_SESION_DE_GIMNASIA);
    else params.set(PARAM_SESION_DE_GIMNASIA, id);
    const cola = params.toString();
    router.push(cola ? `${base}?${cola}` : base);
  }

  async function empezar(origen: OrigenDeSesion, juego: Juego | null) {
    setOcupado(true);
    setAviso(null);
    const r = await enviar<{ sesion: SesionDeLaApi }>("/api/gimnasia/sesion", { origen, juego, clave: claveNueva() });
    setOcupado(false);
    if (r.estado === "OK") {
      const s = r.datos.sesion;
      setIniciada({ id: s.id, origen: s.origen, juegos: s.juegos, completados: [], iniciadaEn: s.iniciadaEn });
      navegar(s.id);
      return;
    }
    if (r.estado === "RECHAZADO") {
      setAviso(r.codigo === "YA_HAY_OTRA_ABIERTA" ? t("GIMNASIA.SESION.OTRA_ABIERTA") : r.motivo);
      reintentar();
      return;
    }
    setAviso(t("GIMNASIA.JUEGO.ERROR_GUARDAR"));
  }

  const acciones = useMemo<AccionesDeGimnasia>(
    () => ({
      async iniciarIntento(sesion, juego, clave) {
        const r = await enviar<{ intento: IntentoEmpezado }>("/api/gimnasia/intento", { sesion, juego, clave });
        return r.estado === "OK" ? r.datos.intento : null;
      },
      async confirmarResultado(intento, respuestas) {
        const r = await enviar<ResultadoDeIntento>("/api/gimnasia/intento/resultado", { intento, respuestas });
        return r.estado === "OK" ? r.datos : null;
      },
      async responder(pedido) {
        const r = await enviar<RespuestaRegistrada | { respuestaCanonica: string; explicacion: string | null }>(
          "/api/gimnasia/recuerdo",
          pedido,
        );
        if (r.estado !== "OK") return { estado: "ERROR" };
        return "resultado" in r.datos
          ? { estado: "OK", registrada: r.datos }
          : { estado: "REVELADA", respuestaCanonica: r.datos.respuestaCanonica, explicacion: r.datos.explicacion };
      },
      async cancelar(sesion) {
        const r = await enviar("/api/gimnasia/sesion/cancelar", { sesion });
        return r.estado === "OK";
      },
    }),
    [],
  );

  if (respuesta.estado === "CARGANDO") return <GimnasiaEsqueleto />;
  if (respuesta.estado !== "OK" || !datos) {
    return (
      <NoSePudoCargar
        motivo={respuesta.estado === "OK" ? "ERROR" : respuesta.estado}
        onReintentar={respuesta.estado === "SIN_PADRON" ? undefined : reintentar}
      />
    );
  }

  if (sesion) {
    return (
      <SesionDeGimnasia
        key={sesion.id}
        sesion={sesion}
        acciones={acciones}
        onSalir={() => {
          setIniciada(null);
          navegar(null);
          reintentar();
        }}
        // La próxima acción la dice Hoy, con el ADE: acá no se inventa ninguna.
        onVolverAHoy={() => router.push(nodos.UX01.ruta ?? "/hoy")}
      />
    );
  }

  return (
    <Gimnasia
      {...datos}
      ocupado={ocupado}
      aviso={aviso}
      onEmpezarRutina={() => void empezar("ROUTINE", null)}
      onJugar={(juego) => void empezar("SINGLE_GAME", juego)}
      onContinuar={() => datos.sesionEnCurso && navegar(datos.sesionEnCurso.id)}
      onDescartar={async () => {
        if (!datos.sesionEnCurso) return;
        setOcupado(true);
        await acciones.cancelar(datos.sesionEnCurso.id);
        setOcupado(false);
        reintentar();
      }}
    />
  );
}
