"use client";

import { useEffect, useRef, useState } from "react";

import { useConsulta, type PropsDeSuperficie } from "./consulta";
import { ModoClase, type EstadoDeApuntes, type MarcaPendiente } from "@/components/screens/modo-clase";
import { ReglaDeNegocio, TituloDePanel } from "@/components/screens/design-system";
import { NoSePudoCargar } from "@/components/shell/no-se-pudo-cargar";
import { useMigaDelObjeto } from "@/components/shell/miga-del-objeto";
import { useSuperficie } from "@/lib/client/superficie";
import { enviar } from "@/lib/client/api";
import { llenarCopy, t } from "@/lib/content/es-AR";
import { nombreDeObjeto } from "@/lib/domain/nombre-de-objeto";
import { duracionEnMinutos, enOrden, segundosEntre, type TipoDeMarca } from "@/lib/domain/sesion-de-clase";
import type { ClaseProps } from "@/lib/domain/view-models";

/**
 * **Modo Clase** desde la base — [ADR-098](../../docs/decisions.md#adr-098).
 *
 * `/clase` es la clase activa; `/clase?clase=<id>`, una del estudiante. **La
 * clase vive en el servidor**: recargar, navegar o cerrar la pestaña no pierde
 * nada que ya se haya guardado, porque nada vive sólo en React.
 *
 * ## Lo que guarda el navegador, y es poco a propósito
 *
 * - **Los apuntes que todavía no llegaron**, mientras viajan. No van a
 *   `localStorage`: ADR-088 §4 dejó un solo módulo con ese permiso, y ADR-097
 *   lo amplió a dos con guard. Si se cae la red, la pantalla lo dice y reintenta.
 * - **Las marcas tocadas y no confirmadas**, con su clave. Reintentar con la
 *   misma clave no duplica: el servidor la reconoce.
 */
export function VistaDeClase({ consulta }: PropsDeSuperficie) {
  const params = useConsulta(consulta);
  const claseId = params.get("clase");
  const ruta = claseId ? `/api/clase?clase=${encodeURIComponent(claseId)}` : "/api/clase";
  const { respuesta, reintentar } = useSuperficie<ClaseProps | { activa: ClaseProps | null }>(ruta);

  const clase =
    respuesta.estado === "OK" ? ("activa" in respuesta.datos ? respuesta.datos.activa : respuesta.datos) : null;
  useMigaDelObjeto(clase ? llenarCopy("CLASE.EN_UNA_MATERIA", { materia: nombreDeObjeto(clase.materia) }) : null);

  if (respuesta.estado === "CARGANDO") return null;
  if (respuesta.estado !== "OK") {
    return (
      <NoSePudoCargar
        motivo={respuesta.estado}
        onReintentar={respuesta.estado === "SIN_PADRON" ? undefined : reintentar}
      />
    );
  }

  if (!clase) {
    // Sin clase abierta **no hay CTA**: desde acá no se sabe de qué materia
    // sería. Se dice dónde se entra.
    return (
      <div className="flex flex-col gap-3" data-sin-clase>
        <TituloDePanel titulo={t("CLASE.TITULO_TERMINADA")} />
        <p style={{ fontSize: "var(--text-body)", fontWeight: 500 }}>{t("CLASE.SIN_CLASE_ACTIVA")}</p>
        <ReglaDeNegocio>{t("CLASE.SIN_CLASE_ACTIVA_REGLA")}</ReglaDeNegocio>
      </div>
    );
  }

  // La `key` reinicia el estado local si cambia la clase: los apuntes de una no
  // pueden quedar escritos encima de la otra.
  return <ClaseViva key={clase.id} inicial={clase} />;
}

const ESPERA_DE_AUTOSAVE = 1000;
const ESPERA_DE_REINTENTO = 3000;

function ClaseViva({ inicial }: { inicial: ClaseProps }) {
  const [clase, setClase] = useState(inicial);
  const [apuntes, setApuntes] = useState(inicial.apuntes);
  const [estadoDeApuntes, setEstadoDeApuntes] = useState<EstadoDeApuntes>("GUARDADO");
  const [pendientes, setPendientes] = useState<MarcaPendiente[]>([]);
  const [finalizando, setFinalizando] = useState(false);
  const [errorAlFinalizar, setErrorAlFinalizar] = useState(false);
  const [recienGuardada, setRecienGuardada] = useState(false);

  const actual = useRef(inicial.apuntes);
  const guardado = useRef(inicial.apuntes);
  const temporizador = useRef<number | undefined>(undefined);

  // ── Apuntes: autosave con reintento ────────────────────────────────────────
  // ⚠️ **Funciones comunes, no `useCallback`**: el id no cambia —la `key` de
  // arriba reinicia el componente— y el reintento se llama a sí mismo.
  const claseId = inicial.id;

  async function guardar(texto: string): Promise<boolean> {
    window.clearTimeout(temporizador.current);
    setEstadoDeApuntes("GUARDANDO");
    const r = await enviar<{ guardadosEn: string }>("/api/clase", { clase: claseId, apuntes: texto }, "PATCH");
    if (r.estado === "OK") {
      guardado.current = texto;
      if (actual.current === texto) setEstadoDeApuntes("GUARDADO");
      return true;
    }
    setEstadoDeApuntes("ERROR");
    temporizador.current = window.setTimeout(() => {
      if (actual.current !== guardado.current) void guardar(actual.current);
    }, ESPERA_DE_REINTENTO);
    return false;
  }

  const alEscribir = (texto: string) => {
    setApuntes(texto);
    actual.current = texto;
    window.clearTimeout(temporizador.current);
    temporizador.current = window.setTimeout(() => void guardar(texto), ESPERA_DE_AUTOSAVE);
  };

  // Al irse de la pantalla, lo que no llegó sale igual. No se espera: la
  // navegación no se frena por un autosave.
  useEffect(() => {
    return () => {
      window.clearTimeout(temporizador.current);
      if (actual.current !== guardado.current) {
        void enviar("/api/clase", { clase: inicial.id, apuntes: actual.current }, "PATCH");
      }
    };
  }, [inicial.id]);

  // ── Marcas: un toque, con clave ────────────────────────────────────────────
  async function enviarMarca(pendiente: MarcaPendiente) {
    const r = await enviar<{ marca: string; segundos: number }>("/api/clase/marca", {
      clase: claseId,
      tipo: pendiente.tipo,
      clave: pendiente.clave,
    });
    if (r.estado === "OK") {
      setPendientes((ps) => ps.filter((x) => x.clave !== pendiente.clave));
      setClase((c) => {
        // El reintento de una marca que ya había entrado no la suma dos veces.
        if (c.marcas.some((m) => m.id === r.datos.marca)) return c;
        const marcas = enOrden([
          ...c.marcas,
          { id: r.datos.marca, tipo: pendiente.tipo, segundos: r.datos.segundos, texto: null, creadaEn: new Date().toISOString() },
        ]);
        return { ...c, marcas, resumen: { ...c.resumen, [pendiente.tipo]: c.resumen[pendiente.tipo] + 1 } };
      });
      return;
    }
    setPendientes((ps) => ps.map((x) => (x.clave === pendiente.clave ? { ...x, estado: "ERROR" } : x)));
  }

  const alMarcar = (tipo: TipoDeMarca) => {
    const pendiente: MarcaPendiente = {
      clave: crypto.randomUUID(),
      tipo,
      segundos: segundosEntre(clase.iniciadaEn, new Date().toISOString()),
      estado: "ENVIANDO",
    };
    setPendientes((ps) => [...ps, pendiente]);
    void enviarMarca(pendiente);
  };

  const alReintentarMarca = (clave: string) => {
    const pendiente = pendientes.find((x) => x.clave === clave);
    if (!pendiente) return;
    setPendientes((ps) => ps.map((x) => (x.clave === clave ? { ...x, estado: "ENVIANDO" } : x)));
    void enviarMarca({ ...pendiente, estado: "ENVIANDO" });
  };

  const alDetallar = async (marcaId: string, texto: string) => {
    const r = await enviar<{ marca: string; texto: string | null }>("/api/clase/marca", { marca: marcaId, texto }, "PATCH");
    if (r.estado === "OK") {
      setClase((c) => ({ ...c, marcas: c.marcas.map((m) => (m.id === marcaId ? { ...m, texto: r.datos.texto } : m)) }));
    }
  };

  // ── Finalizar: `CTA-023` ───────────────────────────────────────────────────
  const alFinalizar = async () => {
    setFinalizando(true);
    setErrorAlFinalizar(false);
    if (actual.current !== guardado.current) await guardar(actual.current);
    const r = await enviar<{ clase: string; terminadaEn: string }>("/api/clase/fin", { clase: claseId });
    setFinalizando(false);
    if (r.estado !== "OK") {
      setErrorAlFinalizar(true);
      return;
    }
    setClase((c) => ({
      ...c,
      estado: "ENDED",
      terminadaEn: r.datos.terminadaEn,
      duracionMinutos: duracionEnMinutos({ iniciadaEn: c.iniciadaEn, terminadaEn: r.datos.terminadaEn }),
    }));
    setRecienGuardada(true);
  };

  return (
    <ModoClase
      clase={clase}
      apuntes={apuntes}
      estadoDeApuntes={estadoDeApuntes}
      onApuntes={alEscribir}
      pendientes={pendientes}
      onMarcar={alMarcar}
      onReintentarMarca={alReintentarMarca}
      onDetalle={(id, texto) => void alDetallar(id, texto)}
      onFinalizar={() => void alFinalizar()}
      finalizando={finalizando}
      errorAlFinalizar={errorAlFinalizar}
      recienGuardada={recienGuardada}
    />
  );
}
