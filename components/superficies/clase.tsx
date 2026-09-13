"use client";

import { useEffect, useRef, useState } from "react";

import { useConsulta, type PropsDeSuperficie } from "./consulta";
import {
  ModoClase,
  tituloDeClase,
  type ApuntePendiente,
  type EstadoDeGrabadora,
  type MarcaPendiente,
  type SubidaDeMaterial,
} from "@/components/screens/modo-clase";
import { ReglaDeNegocio, TituloDePanel } from "@/components/screens/design-system";
import { NoSePudoCargar } from "@/components/shell/no-se-pudo-cargar";
import { useMigaDelObjeto } from "@/components/shell/miga-del-objeto";
import { useSuperficie } from "@/lib/client/superficie";
import { enviar, pedir, subirArchivoDeClase } from "@/lib/client/api";
import { t } from "@/lib/content/es-AR";
import { nombreDeObjeto } from "@/lib/domain/nombre-de-objeto";
import { rutaDeCtaCon } from "@/lib/navigation";
import {
  duracionEnMinutos,
  enOrden,
  esTipoDeMaterial,
  MAXIMO_DE_ARCHIVO,
  segundosEntre,
  type TipoDeMarca,
} from "@/lib/domain/sesion-de-clase";
import type { ApunteDeClase, ClaseProps } from "@/lib/domain/view-models";

/**
 * **Modo Clase** desde la base — [ADR-098](../../docs/decisions.md#adr-098) y
 * [ADR-099](../../docs/decisions.md#adr-099).
 *
 * `/clase` es la clase activa; `/clase?clase=<id>`, una del estudiante. **La
 * clase vive en el servidor**: recargar o navegar no pierde nada que ya se haya
 * guardado.
 *
 * ## Lo que vive sólo en esta pestaña, y es poco a propósito
 *
 * - **Los apuntes y marcas que todavía no llegaron**, con su clave: reintentar
 *   no duplica. No van a `localStorage` (ADR-088 §4).
 * - **La grabación mientras se graba y se sube.** Si la subida falla, el audio
 *   sigue en memoria y se reintenta; si se cierra la pestaña antes, se pierde, y
 *   el navegador lo avisa.
 */
export function VistaDeClase({ consulta }: PropsDeSuperficie) {
  const params = useConsulta(consulta);
  const claseId = params.get("clase");
  const ruta = claseId ? `/api/clase?clase=${encodeURIComponent(claseId)}` : "/api/clase";
  const { respuesta, reintentar } = useSuperficie<ClaseProps | { activa: ClaseProps | null }>(ruta);

  const clase =
    respuesta.estado === "OK" ? ("activa" in respuesta.datos ? respuesta.datos.activa : respuesta.datos) : null;

  // ADR-099 §9: *Materias › Arquitectura de computadoras I › Clase práctica jueves 18/05*.
  const aLaMateria = clase ? rutaDeCtaCon("CTA-001", clase.cursadaId) : null;
  useMigaDelObjeto(
    clase ? `${tituloDeClase(clase)} ${clase.dia}` : null,
    clase && aLaMateria ? { etiqueta: nombreDeObjeto(clase.materia), href: aLaMateria } : null,
  );

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
        <TituloDePanel titulo={t("CLASE.TITULO")} />
        <p style={{ fontSize: "var(--text-body)", fontWeight: 500 }}>{t("CLASE.SIN_CLASE_ACTIVA")}</p>
        <ReglaDeNegocio>{t("CLASE.SIN_CLASE_ACTIVA_REGLA")}</ReglaDeNegocio>
      </div>
    );
  }

  // La `key` reinicia el estado local si cambia la clase: lo pendiente de una no
  // puede quedar encima de la otra.
  return <ClaseViva key={clase.id} inicial={clase} />;
}

/** Lo que devuelve la API por un apunte: la fila del Service. */
interface ApunteDeLaApi {
  id: string;
  texto: string;
  segundos: number | null;
  creadoEn: string;
  editadoEn: string | null;
}
const aApunte = (a: ApunteDeLaApi): ApunteDeClase => ({
  id: a.id,
  texto: a.texto,
  segundos: a.segundos,
  creadoEn: a.creadoEn,
  editadoEn: a.editadoEn,
});

/** El primer formato que el navegador sabe grabar. Voz: 32 kbps alcanza. */
function formatoDeGrabacion(): string {
  const candidatos = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4", "audio/ogg;codecs=opus"];
  return candidatos.find((c) => MediaRecorder.isTypeSupported(c)) ?? "";
}

interface GrabacionPorSubir {
  audio: Blob;
  mime: string;
  duracion: number;
  etiquetas: ReadonlyArray<{ texto: string; segundo: number }>;
  idempotencia: string;
}

function ClaseViva({ inicial }: { inicial: ClaseProps }) {
  const claseId = inicial.id;
  const [clase, setClase] = useState(inicial);
  const [apuntesPendientes, setApuntesPendientes] = useState<ApuntePendiente[]>([]);
  const [marcasPendientes, setMarcasPendientes] = useState<MarcaPendiente[]>([]);
  const [grabadora, setGrabadora] = useState<EstadoDeGrabadora>({ tipo: "INACTIVA" });
  const [subidas, setSubidas] = useState<SubidaDeMaterial[]>([]);
  const [finalizando, setFinalizando] = useState(false);
  const [errorAlFinalizar, setErrorAlFinalizar] = useState(false);
  const [recienGuardada, setRecienGuardada] = useState(false);

  /** Vuelve a leer la clase entera: después de algo que cambió material o audio. */
  async function recargar() {
    const r = await pedir<ClaseProps>(`/api/clase?clase=${encodeURIComponent(claseId)}`);
    if (r.estado === "OK") setClase(r.datos);
  }

  // ── Apuntes: Enter guarda ──────────────────────────────────────────────────
  // ⚠️ **En fila, de a uno.** Dos Enter seguidos mandados en paralelo pueden
  // llegar al revés, y el servidor fecha cada entrada al recibirla: el orden de
  // los apuntes sería el de la red, no el de quien escribió.
  const colaDeApuntes = useRef<Promise<void>>(Promise.resolve());
  const encolarApunte = (p: ApuntePendiente) => {
    colaDeApuntes.current = colaDeApuntes.current.then(() => enviarApunte(p));
  };

  async function enviarApunte(p: ApuntePendiente) {
    const r = await enviar<{ apunte: ApunteDeLaApi }>("/api/clase/apunte", { clase: claseId, texto: p.texto, clave: p.clave });
    if (r.estado === "OK") {
      setApuntesPendientes((ps) => ps.filter((x) => x.clave !== p.clave));
      setClase((c) =>
        c.apuntes.some((a) => a.id === r.datos.apunte.id) ? c : { ...c, apuntes: [...c.apuntes, aApunte(r.datos.apunte)] },
      );
      return;
    }
    setApuntesPendientes((ps) => ps.map((x) => (x.clave === p.clave ? { ...x, estado: "ERROR" } : x)));
  }

  const apuntes = {
    pendientes: apuntesPendientes,
    onAnotar: (texto: string) => {
      const p: ApuntePendiente = { clave: crypto.randomUUID(), texto, estado: "ENVIANDO" };
      setApuntesPendientes((ps) => [...ps, p]);
      encolarApunte(p);
    },
    onReintentar: (clave: string) => {
      const p = apuntesPendientes.find((x) => x.clave === clave);
      if (!p) return;
      setApuntesPendientes((ps) => ps.map((x) => (x.clave === clave ? { ...x, estado: "ENVIANDO" } : x)));
      encolarApunte({ ...p, estado: "ENVIANDO" });
    },
    onEditar: async (id: string, texto: string) => {
      const r = await enviar<{ apunte: ApunteDeLaApi }>("/api/clase/apunte", { apunte: id, texto }, "PATCH");
      if (r.estado === "OK") {
        setClase((c) => ({ ...c, apuntes: c.apuntes.map((a) => (a.id === id ? aApunte(r.datos.apunte) : a)) }));
      }
    },
    onBorrar: async (id: string) => {
      const r = await enviar("/api/clase/apunte", { apunte: id }, "DELETE");
      if (r.estado === "OK" || r.estado === "NO_ENCONTRADO") {
        setClase((c) => ({ ...c, apuntes: c.apuntes.filter((a) => a.id !== id) }));
      }
    },
  };

  // ── Marcas: un toque, con clave ────────────────────────────────────────────
  async function enviarMarca(pendiente: MarcaPendiente) {
    const r = await enviar<{ marca: string; segundos: number }>("/api/clase/marca", {
      clase: claseId,
      tipo: pendiente.tipo,
      clave: pendiente.clave,
    });
    if (r.estado === "OK") {
      setMarcasPendientes((ps) => ps.filter((x) => x.clave !== pendiente.clave));
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
    setMarcasPendientes((ps) => ps.map((x) => (x.clave === pendiente.clave ? { ...x, estado: "ERROR" } : x)));
  }

  const marcas = {
    pendientes: marcasPendientes,
    onMarcar: (tipo: TipoDeMarca) => {
      const pendiente: MarcaPendiente = {
        clave: crypto.randomUUID(),
        tipo,
        segundos: segundosEntre(clase.iniciadaEn, new Date().toISOString()),
        estado: "ENVIANDO",
      };
      setMarcasPendientes((ps) => [...ps, pendiente]);
      void enviarMarca(pendiente);
    },
    onReintentar: (clave: string) => {
      const pendiente = marcasPendientes.find((x) => x.clave === clave);
      if (!pendiente) return;
      setMarcasPendientes((ps) => ps.map((x) => (x.clave === clave ? { ...x, estado: "ENVIANDO" } : x)));
      void enviarMarca({ ...pendiente, estado: "ENVIANDO" });
    },
    onDetalle: async (marcaId: string, texto: string) => {
      const r = await enviar<{ marca: string; texto: string | null }>("/api/clase/marca", { marca: marcaId, texto }, "PATCH");
      if (r.estado === "OK") {
        setClase((c) => ({ ...c, marcas: c.marcas.map((m) => (m.id === marcaId ? { ...m, texto: r.datos.texto } : m)) }));
      }
    },
  };

  // ── Grabación · ADR-099 §2 ─────────────────────────────────────────────────
  // ⛔ Nunca empieza sola: sólo `empezar()` abre el micrófono, y sólo lo llaman
  // `Grabar audio` (con el aviso ya confirmado) y la confirmación del aviso.
  const avisoConfirmado = useRef(false);
  const grabador = useRef<MediaRecorder | null>(null);
  const microfono = useRef<MediaStream | null>(null);
  const pedazos = useRef<Blob[]>([]);
  const porSubir = useRef<GrabacionPorSubir | null>(null);

  const puedeGrabar = () =>
    typeof window !== "undefined" &&
    typeof MediaRecorder !== "undefined" &&
    Boolean(navigator.mediaDevices?.getUserMedia);

  const soltarMicrofono = () => {
    microfono.current?.getTracks().forEach((pista) => pista.stop());
    microfono.current = null;
  };

  async function empezar() {
    setGrabadora({ tipo: "PIDIENDO_MICROFONO" });
    try {
      microfono.current = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      setGrabadora({ tipo: "DENEGADO" });
      return;
    }
    const mimeType = formatoDeGrabacion();
    const rec = new MediaRecorder(microfono.current, { ...(mimeType ? { mimeType } : {}), audioBitsPerSecond: 32_000 });
    pedazos.current = [];
    rec.ondataavailable = (e) => {
      if (e.data.size > 0) pedazos.current.push(e.data);
    };
    grabador.current = rec;
    // Pedazos cada 10 s: si el navegador corta, se pierde lo último, no todo.
    rec.start(10_000);
    setGrabadora({ tipo: "GRABANDO", desde: Date.now(), etiquetas: [] });
  }

  async function subirGrabacion(): Promise<boolean> {
    const g = porSubir.current;
    if (!g) return true;
    setGrabadora({ tipo: "SUBIENDO" });
    const firma = await enviar<{ clave: string; url: string }>("/api/clase/grabacion/firma", {
      clase: claseId,
      mime: g.mime,
      bytes: g.audio.size,
    });
    const subida = firma.estado === "OK" && (await subirArchivoDeClase(firma.datos.url, g.audio, g.mime));
    const registro =
      firma.estado === "OK" && subida
        ? await enviar("/api/clase/grabacion", {
            clase: claseId,
            clave: firma.datos.clave,
            idempotencia: g.idempotencia,
            duracion: g.duracion,
            etiquetas: g.etiquetas,
          })
        : null;
    if (registro?.estado !== "OK") {
      setGrabadora({ tipo: "ERROR_SUBIDA" });
      return false;
    }
    porSubir.current = null;
    setGrabadora({ tipo: "INACTIVA" });
    await recargar();
    return true;
  }

  /** Detiene y sube. La promesa termina cuando la grabación quedó guardada (o falló). */
  function detener(): Promise<boolean> {
    const rec = grabador.current;
    if (!rec || rec.state === "inactive" || grabadora.tipo !== "GRABANDO") return Promise.resolve(true);
    const { desde, etiquetas } = grabadora;
    return new Promise((resolver) => {
      rec.onstop = () => {
        soltarMicrofono();
        const mime = (rec.mimeType || "audio/webm").split(";")[0];
        porSubir.current = {
          audio: new Blob(pedazos.current, { type: mime }),
          mime,
          duracion: Math.max(1, Math.round((Date.now() - desde) / 1000)),
          etiquetas,
          idempotencia: crypto.randomUUID(),
        };
        grabador.current = null;
        void subirGrabacion().then(resolver);
      };
      rec.stop();
    });
  }

  // Cerrar la pestaña con el micrófono abierto, o con audio sin subir, lo pierde:
  // el navegador pregunta antes.
  const enRiesgo = grabadora.tipo === "GRABANDO" || grabadora.tipo === "SUBIENDO" || grabadora.tipo === "ERROR_SUBIDA";
  useEffect(() => {
    if (!enRiesgo) return;
    const avisar = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", avisar);
    return () => window.removeEventListener("beforeunload", avisar);
  }, [enRiesgo]);

  // Al irse de la pantalla, el micrófono se suelta: no queda grabando de fondo.
  useEffect(() => () => soltarMicrofono(), []);

  const grabadoraProps = {
    estado: grabadora,
    onGrabar: () => {
      if (!puedeGrabar()) return setGrabadora({ tipo: "SIN_MICROFONO" });
      if (!avisoConfirmado.current) return setGrabadora({ tipo: "AVISO" });
      void empezar();
    },
    onConfirmar: () => {
      avisoConfirmado.current = true;
      void empezar();
    },
    onCancelar: () => setGrabadora({ tipo: "INACTIVA" }),
    onEtiquetarMomento: (texto: string) =>
      setGrabadora((e) =>
        e.tipo === "GRABANDO"
          ? { ...e, etiquetas: [...e.etiquetas, { texto, segundo: Math.floor((Date.now() - e.desde) / 1000) }] }
          : e,
      ),
    onDetener: () => void detener(),
    onReintentar: () => void subirGrabacion(),
    onEscuchar: async (id: string) => {
      const r = await pedir<{ url: string }>(`/api/clase/grabacion?grabacion=${encodeURIComponent(id)}`);
      return r.estado === "OK" ? r.datos.url : null;
    },
    onEtiquetar: async (id: string, texto: string, segundo: number | null) => {
      const r = await enviar("/api/clase/grabacion/etiqueta", { grabacion: id, texto, segundo });
      if (r.estado === "OK") await recargar();
    },
    onQuitarEtiqueta: async (id: string) => {
      const r = await enviar("/api/clase/grabacion/etiqueta", { etiqueta: id }, "DELETE");
      if (r.estado === "OK" || r.estado === "NO_ENCONTRADO") await recargar();
    },
    onBorrar: async (id: string) => {
      const r = await enviar("/api/clase/grabacion", { grabacion: id }, "DELETE");
      if (r.estado === "OK" || r.estado === "NO_ENCONTRADO") await recargar();
    },
  };

  // ── Material · ADR-099 §5 ──────────────────────────────────────────────────
  const marcarSubida = (clave: string, estado: SubidaDeMaterial["estado"] | null) =>
    setSubidas((ss) => (estado === null ? ss.filter((s) => s.clave !== clave) : ss.map((s) => (s.clave === clave ? { ...s, estado } : s))));

  async function subirArchivo(archivo: File) {
    const clave = crypto.randomUUID();
    const nombre = archivo.name;
    // Lo que se ve antes de pedir nada: tipo y tamaño. El servidor lo vuelve a
    // mirar contra el storage, así que esto es comodidad, no control.
    const inicialDeSubida: SubidaDeMaterial["estado"] = !esTipoDeMaterial(archivo.type)
      ? "TIPO"
      : archivo.size > MAXIMO_DE_ARCHIVO
        ? "GRANDE"
        : "SUBIENDO";
    setSubidas((ss) => [...ss, { clave, nombre, estado: inicialDeSubida }]);
    if (inicialDeSubida !== "SUBIENDO") return;

    const firma = await enviar<{ clave: string; url: string }>("/api/clase/material/firma", {
      clase: claseId,
      nombre,
      mime: archivo.type,
      bytes: archivo.size,
    });
    const subida = firma.estado === "OK" && (await subirArchivoDeClase(firma.datos.url, archivo, archivo.type));
    const registro =
      firma.estado === "OK" && subida
        ? await enviar("/api/clase/material", { clase: claseId, archivo: { clave: firma.datos.clave, nombre } })
        : null;
    if (registro?.estado !== "OK") return marcarSubida(clave, "ERROR");
    marcarSubida(clave, null);
    await recargar();
  }

  const material = {
    subidas,
    onSubir: (archivos: File[]) => archivos.forEach((a) => void subirArchivo(a)),
    onLink: async (url: string, titulo: string | null) => {
      const r = await enviar("/api/clase/material", { clase: claseId, link: { url, titulo } });
      if (r.estado === "OK") await recargar();
    },
    onAbrir: async (id: string) => {
      const m = clase.material.find((x) => x.id === id);
      if (m?.tipo === "LINK" && m.url) {
        window.open(m.url, "_blank", "noopener,noreferrer");
        return;
      }
      // La pestaña se abre en el mismo toque, antes de esperar la firma: después
      // de un `await` el navegador la bloquea como ventana emergente.
      const pestana = window.open("about:blank", "_blank");
      const r = await pedir<{ url: string }>(`/api/clase/material?material=${encodeURIComponent(id)}`);
      if (r.estado === "OK" && pestana) pestana.location.href = r.datos.url;
      else pestana?.close();
    },
    onBorrar: async (id: string) => {
      const r = await enviar("/api/clase/material", { material: id }, "DELETE");
      if (r.estado === "OK" || r.estado === "NO_ENCONTRADO") await recargar();
    },
    onDescartar: (clave: string) => marcarSubida(clave, null),
  };

  // ── Finalizar: `CTA-023` ───────────────────────────────────────────────────
  const alFinalizar = async () => {
    setFinalizando(true);
    setErrorAlFinalizar(false);
    // Una grabación en curso se detiene y se sube **antes** de cerrar la clase:
    // la firma exige la clase activa.
    if (grabadora.tipo === "GRABANDO") await detener();
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
      apuntes={{
        ...apuntes,
        onEditar: (id, texto) => void apuntes.onEditar(id, texto),
        onBorrar: (id) => void apuntes.onBorrar(id),
      }}
      marcas={{ ...marcas, onDetalle: (id, texto) => void marcas.onDetalle(id, texto) }}
      grabadora={{
        ...grabadoraProps,
        onEtiquetar: (id, texto, segundo) => void grabadoraProps.onEtiquetar(id, texto, segundo),
        onQuitarEtiqueta: (id) => void grabadoraProps.onQuitarEtiqueta(id),
        onBorrar: (id) => void grabadoraProps.onBorrar(id),
      }}
      material={{
        ...material,
        onLink: (url, titulo) => void material.onLink(url, titulo),
        onAbrir: (id) => void material.onAbrir(id),
        onBorrar: (id) => void material.onBorrar(id),
      }}
      onFinalizar={() => void alFinalizar()}
      finalizando={finalizando}
      errorAlFinalizar={errorAlFinalizar}
      recienGuardada={recienGuardada}
    />
  );
}
