"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { useConsulta, type PropsDeSuperficie } from "./consulta";
import {
  FocusCierre,
  FocusConcentracion,
  FocusDescanso,
  FocusFinalizada,
  FocusLista,
  FocusPausada,
  FocusRecuperacion,
  FocusSinSesion,
  ModoFocusEsqueleto,
  SelectorDePomodoro,
  type EstadoDeGuardado,
} from "@/components/screens/modo-focus";
import { NoSePudoCargar } from "@/components/shell/no-se-pudo-cargar";
import { useMigaDelObjeto } from "@/components/shell/miga-del-objeto";
import { useEspacioDeTrabajo } from "@/components/shell/espacio-de-trabajo";
import { useSuperficie } from "@/lib/client/superficie";
import { enviar, pedir, tokenDeSesion } from "@/lib/client/api";
import { MotorDeAudio } from "@/lib/client/focus/audio";
import { guardarAnotadorAlIrse } from "@/lib/client/focus/al-irse";
import { t } from "@/lib/content/es-AR";
import { LATIDO_EN_SEGUNDOS, type ConfiguracionPomodoro, type PreferenciasDeFocus, type Sonido } from "@/lib/domain/sesion-de-focus";
import { nombreDeObjeto } from "@/lib/domain/nombre-de-objeto";
import type { FocusProps, FocusVista } from "@/lib/domain/view-models";
import { rutaDeCta, rutaDeCtaCon } from "@/lib/navigation";

/**
 * **Modo Focus** desde la base — [ADR-104](../../docs/decisions.md#adr-104).
 *
 * `/focus` es la sesión abierta; `/focus?sesion=<id>`, una del estudiante. **La
 * sesión vive en el servidor**: recargar o navegar no pierde nada.
 *
 * ## Lo que decide esta superficie, y es poco a propósito
 *
 * - **Qué dibujar entre dos respuestas**: el reloj se calcula de instantes del
 *   servidor corregidos por la diferencia de relojes. No se suma de a uno.
 * - **Cuándo pedir**: un latido cada 30 s mientras corre el foco, y un pedido al
 *   llegar el fin planeado de un bloque o un descanso. **El servidor decide** si
 *   el bloque se completó.
 * - **Salir de la concentración pausa primero** (§10): `Escape`, navegar o
 *   minimizar la ventana que la contiene. Recargar o cerrar la pestaña no pausa:
 *   para eso está la recuperación.
 *
 * ⛔ **Nada va a `localStorage`** (ADR-088 §4): ni el anotador sin guardar.
 */

const A_EVIDENCIA = rutaDeCta("CTA-006");

type Cierre = { terminado: boolean } | null;

export function VistaDeFocus({ consulta }: PropsDeSuperficie) {
  const params = useConsulta(consulta);
  const sesionId = params.get("sesion");
  const ruta = sesionId ? `/api/focus?sesion=${encodeURIComponent(sesionId)}` : "/api/focus";
  const { respuesta, reintentar } = useSuperficie<FocusVista>(ruta);
  const enVentana = consulta !== undefined;

  const vista = respuesta.estado === "OK" ? respuesta.datos : null;
  // La ficha dice *Focus · Análisis III*: el prefijo lo pone la barra.
  useMigaDelObjeto(vista?.sesion ? nombreDeObjeto(vista.sesion.materia ?? vista.sesion.accion ?? t("FOCUS.TITULO")) : null);

  if (respuesta.estado === "CARGANDO") return <ModoFocusEsqueleto />;
  if (respuesta.estado !== "OK" || !vista) {
    return (
      <NoSePudoCargar
        motivo={respuesta.estado === "OK" ? "ERROR" : respuesta.estado}
        onReintentar={respuesta.estado === "SIN_PADRON" ? undefined : reintentar}
      />
    );
  }

  if (!vista.sesion) return <SinSesion vista={vista} alEmpezar={reintentar} />;
  // La `key` reinicia el estado local si cambia la sesión.
  return <SesionViva key={vista.sesion.id} inicial={vista.sesion} preferencias={vista.preferencias} enVentana={enVentana} />;
}

function SinSesion({ vista, alEmpezar }: { vista: FocusVista; alEmpezar: () => void }) {
  const router = useRouter();
  const [ocupado, setOcupado] = useState(false);
  const [aviso, setAviso] = useState<string | null>(null);
  const iniciable = vista.iniciable;

  async function empezar() {
    if (!iniciable || ocupado) return;
    setOcupado(true);
    setAviso(null);
    const r = await enviar<{ sesion: FocusProps }>("/api/focus", { compromiso: iniciable.compromisoId });
    setOcupado(false);
    if (r.estado === "OK") return alEmpezar();
    if (r.estado === "RECHAZADO") {
      setAviso(r.codigo === "YA_HAY_OTRA_ABIERTA" ? t("FOCUS.OTRA_ABIERTA") : t("FOCUS.NO_INICIABLE"));
      if (r.codigo === "YA_HAY_OTRA_ABIERTA") alEmpezar();
      return;
    }
    setAviso(t("FOCUS.ERROR"));
  }

  async function terminar() {
    if (!iniciable || ocupado) return;
    setOcupado(true);
    const r = await enviar<{ accion: string }>("/api/focus/fin", { como: "DONE", compromiso: iniciable.compromisoId });
    setOcupado(false);
    if (r.estado === "OK" && A_EVIDENCIA) return router.push(A_EVIDENCIA);
    setAviso(r.estado === "RECHAZADO" ? t("FOCUS.NO_INICIABLE") : t("FOCUS.ERROR"));
  }

  return <FocusSinSesion iniciable={iniciable} aviso={aviso} ocupado={ocupado} onEmpezar={empezar} onTerminar={terminar} />;
}

/**
 * Cuántas pantallas de Focus están montadas. Existe por `StrictMode`, que monta,
 * desmonta y vuelve a montar: sin esto, abrir la sesión la pausaba.
 */
let montadas = 0;

function SesionViva({
  inicial,
  preferencias: prefsIniciales,
  enVentana,
}: {
  inicial: FocusProps;
  preferencias: PreferenciasDeFocus;
  enVentana: boolean;
}) {
  const router = useRouter();
  const espacio = useEspacioDeTrabajo();
  const [sesion, setSesion] = useState<FocusProps>(inicial);
  const [recibidaEn, setRecibidaEn] = useState(() => Date.now());
  const [ahora, setAhora] = useState(() => Date.now());
  const [ocupado, setOcupado] = useState(false);
  const [aviso, setAviso] = useState<string | null>(null);
  const [cierre, setCierre] = useState<Cierre>(null);
  const [eligiendoPomodoro, setEligiendoPomodoro] = useState(false);
  const [prefs, setPrefs] = useState<PreferenciasDeFocus>(prefsIniciales);
  const [silenciado, setSilenciado] = useState(false);
  const [anotador, setAnotador] = useState(inicial.anotador);
  const [guardado, setGuardado] = useState<EstadoDeGuardado>(null);

  const audio = useMemo(() => new MotorDeAudio(), []);
  const token = useRef<string | null>(null);
  const pendienteDeGuardar = useRef<string | null>(null);
  const fase = sesion.fase;

  /** Diferencia entre el reloj del servidor y el de esta pestaña. */
  const desfase = Date.parse(sesion.servidorAhora) - recibidaEn;
  const instanteServidor = ahora + desfase;

  const aplicar = useCallback((nueva: FocusProps) => {
    setSesion(nueva);
    setRecibidaEn(Date.now());
  }, []);

  // ── El reloj de la pantalla ────────────────────────────────────────────────
  useEffect(() => {
    const id = window.setInterval(() => setAhora(Date.now()), 250);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    void tokenDeSesion().then((tk) => (token.current = tk));
    const id = window.setInterval(() => void tokenDeSesion().then((tk) => (token.current = tk)), 5 * 60_000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => () => audio.cerrar(), [audio]);

  // ── Comandos ───────────────────────────────────────────────────────────────
  const mandar = useCallback(
    async (comando: Record<string, unknown>, silencioso = false): Promise<boolean> => {
      if (!silencioso) {
        setOcupado(true);
        setAviso(null);
      }
      const r = await enviar<{ sesion: FocusProps }>("/api/focus/comando", { sesion: sesion.id, comando });
      if (!silencioso) setOcupado(false);
      if (r.estado === "OK") {
        aplicar(r.datos.sesion);
        return true;
      }
      if (r.estado === "RECHAZADO") {
        // La sesión cambió en otro lado: se relee y se dice.
        const releida = await pedir<FocusVista>(`/api/focus?sesion=${encodeURIComponent(sesion.id)}`);
        if (releida.estado === "OK" && releida.datos.sesion) aplicar(releida.datos.sesion);
        if (!silencioso) setAviso(t("FOCUS.CAMBIO"));
        return false;
      }
      if (!silencioso) setAviso(t("FOCUS.ERROR"));
      return false;
    },
    [sesion.id, aplicar],
  );

  const sonarSiCorresponde = useCallback(() => {
    if (prefs.sonido !== "NINGUNO") audio.sonar(prefs.sonido, prefs.volumen);
  }, [audio, prefs.sonido, prefs.volumen]);

  async function pausar() {
    audio.parar();
    audio.cancelarFin();
    await mandar({ tipo: "PAUSAR" });
  }

  async function continuar() {
    audio.despertar();
    if (await mandar({ tipo: "CONTINUAR" })) sonarSiCorresponde();
  }

  async function pasarAPomodoro(configuracion: ConfiguracionPomodoro) {
    audio.despertar();
    if (await mandar({ tipo: "POMODORO", configuracion })) {
      setEligiendoPomodoro(false);
      sonarSiCorresponde();
    }
  }

  async function volverAntes() {
    audio.despertar();
    if (await mandar({ tipo: "VOLVER_ANTES" })) sonarSiCorresponde();
  }

  async function recuperar(opcion: "REANUDAR" | "REVISAR") {
    audio.despertar();
    if ((await mandar({ tipo: "RECUPERAR", opcion })) && opcion === "REANUDAR") sonarSiCorresponde();
  }

  /** Cierra la sesión. *Terminé* además va a subir evidencia. */
  async function guardarSesion(como: "SAVED" | "DONE" | "RECUPERADA", avance: string | null) {
    audio.parar();
    audio.cancelarFin();
    setOcupado(true);
    setAviso(null);
    await guardarAnotadorAhora();
    const r = await enviar<{ sesion: FocusProps }>("/api/focus/fin", { sesion: sesion.id, como, avance });
    setOcupado(false);
    if (r.estado === "OK") {
      setCierre(null);
      if (como === "DONE" && A_EVIDENCIA) return router.push(A_EVIDENCIA);
      aplicar(r.datos.sesion);
      return;
    }
    setAviso(r.estado === "RECHAZADO" ? t("FOCUS.CAMBIO") : t("FOCUS.ERROR"));
  }

  // *Terminé* desde la concentración pausa primero: el formulario no se llena con el reloj corriendo.
  async function pedirCierre(terminado: boolean) {
    if (fase === "CONCENTRACION") await pausar();
    setCierre({ terminado });
  }

  // ── El anotador: se guarda solo ────────────────────────────────────────────
  const guardarAnotadorAhora = useCallback(async () => {
    const texto = pendienteDeGuardar.current;
    if (texto === null) return;
    pendienteDeGuardar.current = null;
    setGuardado("GUARDANDO");
    const r = await enviar<{ guardado: boolean }>("/api/focus/anotador", { sesion: sesion.id, texto });
    if (r.estado === "OK") {
      setGuardado(pendienteDeGuardar.current === null ? "GUARDADO" : "GUARDANDO");
      return;
    }
    // Se reintenta con el próximo cambio o al irse: no se pierde lo escrito.
    pendienteDeGuardar.current ??= texto;
    setGuardado("ERROR");
  }, [sesion.id]);

  useEffect(() => {
    if (pendienteDeGuardar.current === null) return;
    const id = window.setTimeout(() => void guardarAnotadorAhora(), 1500);
    return () => window.clearTimeout(id);
  }, [anotador, guardarAnotadorAhora]);

  function anotar(texto: string) {
    pendienteDeGuardar.current = texto;
    setAnotador(texto);
    setGuardado("GUARDANDO");
  }

  // ── Latido y fin planeado ──────────────────────────────────────────────────
  useEffect(() => {
    if (fase !== "CONCENTRACION") return;
    const id = window.setInterval(() => void mandar({ tipo: "LATIDO" }, true), LATIDO_EN_SEGUNDOS * 1000);
    return () => window.clearInterval(id);
  }, [fase, mandar]);

  const finPlaneado = sesion.tramo?.finPlaneado ? Date.parse(sesion.tramo.finPlaneado) : null;
  const faltanMs = finPlaneado !== null ? finPlaneado - instanteServidor : null;

  // La alarma y el fundido se agendan en el reloj de audio apenas se conocen.
  useEffect(() => {
    if (finPlaneado === null || (fase !== "CONCENTRACION" && fase !== "DESCANSO")) {
      audio.cancelarFin();
      return;
    }
    const segundos = (finPlaneado - (Date.now() + desfase)) / 1000;
    audio.programarFin(segundos, fase === "CONCENTRACION");
    return () => audio.cancelarFin();
    // `desfase` cambia con cada respuesta; el fin planeado es lo que manda.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [finPlaneado, fase, audio]);

  // Llegado el fin, **se le pregunta al servidor**: él completa el bloque o cierra el descanso.
  const pidioFin = useRef<number | null>(null);
  useEffect(() => {
    if (faltanMs === null || finPlaneado === null || faltanMs > 0) return;
    if (pidioFin.current === finPlaneado) return;
    pidioFin.current = finPlaneado;
    if (fase === "CONCENTRACION") audio.parar();
    void mandar({ tipo: "LATIDO" }, true);
  }, [faltanMs, finPlaneado, fase, audio, mandar]);

  // ── Salir de la concentración pausa primero ────────────────────────────────
  const faseActual = useRef(fase);
  const idActual = useRef(sesion.id);
  const pausarActual = useRef(pausar);
  useEffect(() => {
    faseActual.current = fase;
    idActual.current = sesion.id;
    pausarActual.current = pausar;
  });

  useEffect(() => {
    montadas++;
    return () => {
      montadas--;
      const id = idActual.current;
      const eraConcentracion = faseActual.current === "CONCENTRACION";
      const texto = pendienteDeGuardar.current;
      window.setTimeout(() => {
        if (montadas > 0) return;
        if (texto !== null) void enviar("/api/focus/anotador", { sesion: id, texto });
        if (eraConcentracion) void enviar("/api/focus/comando", { sesion: id, comando: { tipo: "PAUSAR" } });
      }, 60);
    };
  }, []);

  useEffect(() => {
    function alTeclear(e: KeyboardEvent) {
      if (e.key !== "Escape" || faseActual.current !== "CONCENTRACION") return;
      // Se come acá: sin esto, el `Escape` también minimizaría la ventana.
      e.preventDefault();
      e.stopPropagation();
      void pausarActual.current();
    }
    document.addEventListener("keydown", alTeclear, true);
    return () => document.removeEventListener("keydown", alTeclear, true);
  }, []);

  // Recargar o cerrar: el navegador pregunta con su texto; el anotador se manda como pueda.
  useEffect(() => {
    function antesDeIrse(e: BeforeUnloadEvent) {
      if (faseActual.current !== "CONCENTRACION") return;
      e.preventDefault();
    }
    function alIrse() {
      if (pendienteDeGuardar.current !== null) guardarAnotadorAlIrse(token.current, idActual.current, pendienteDeGuardar.current);
    }
    window.addEventListener("beforeunload", antesDeIrse);
    window.addEventListener("pagehide", alIrse);
    return () => {
      window.removeEventListener("beforeunload", antesDeIrse);
      window.removeEventListener("pagehide", alIrse);
    };
  }, []);

  // Volver a la pestaña: el reloj de la pantalla se corrige con el servidor.
  useEffect(() => {
    function visible() {
      if (document.visibilityState === "visible" && faseActual.current !== "FINALIZADA") void mandar({ tipo: "LATIDO" }, true);
    }
    document.addEventListener("visibilitychange", visible);
    return () => document.removeEventListener("visibilitychange", visible);
  }, [mandar]);

  // ── Preferencias ───────────────────────────────────────────────────────────
  function cambiarPreferencias(cambios: Partial<PreferenciasDeFocus>) {
    const nuevas = { ...prefs, ...cambios };
    setPrefs(nuevas);
    void enviar("/api/focus/preferencias", nuevas);
    return nuevas;
  }

  function elegirSonido(sonido: Sonido) {
    const nuevas = cambiarPreferencias({ sonido });
    audio.despertar();
    if (fase === "CONCENTRACION" && nuevas.sonido !== "NINGUNO") audio.sonar(nuevas.sonido, nuevas.volumen);
    else audio.parar();
  }

  function elegirVolumen(volumen: number) {
    cambiarPreferencias({ volumen });
    audio.cambiarVolumen(volumen);
  }

  function silenciar() {
    setSilenciado((s) => {
      audio.silenciar(!s);
      return !s;
    });
  }

  // ── Dibujo ─────────────────────────────────────────────────────────────────
  const focoSegundos =
    sesion.tramo?.tipo === "FOCUS"
      ? sesion.focoPrevioSegundos + Math.max(0, Math.floor((instanteServidor - Date.parse(sesion.tramo.inicio)) / 1000))
      : sesion.focoPrevioSegundos;
  const regresivo = sesion.tramo?.finPlaneado != null;
  const segundosDelReloj = regresivo && faltanMs !== null ? Math.max(0, Math.ceil(faltanMs / 1000)) : focoSegundos;
  const terminaA = sesion.tramo?.finPlaneado
    ? new Intl.DateTimeFormat("es-AR", { hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(new Date(Date.parse(sesion.tramo.finPlaneado) - desfase))
    : null;

  const aLaBitacora = rutaDeCtaCon("CTA-009", sesion.cursadaId);
  const minimizar = enVentana ? null : () => espacio.minimizarPantalla();

  if (cierre) {
    return (
      <FocusCierre
        sesion={sesion}
        terminado={cierre.terminado}
        ocupado={ocupado}
        aviso={aviso}
        onGuardar={(avance) => void guardarSesion(cierre.terminado ? "DONE" : "SAVED", avance)}
        onVolver={() => setCierre(null)}
      />
    );
  }

  if (eligiendoPomodoro && (fase === "PAUSADA" || fase === "LISTA")) {
    return (
      <SelectorDePomodoro
        inicial={prefs.preset}
        personalizadoInicial={prefs.personalizado}
        ocupado={ocupado}
        onElegir={(c) => void pasarAPomodoro(c)}
        onCancelar={() => setEligiendoPomodoro(false)}
      />
    );
  }

  switch (fase) {
    case "CONCENTRACION":
      return (
        <FocusConcentracion
          sesion={sesion}
          enVentana={enVentana}
          segundos={segundosDelReloj}
          regresivo={regresivo}
          terminaA={terminaA}
          anotador={anotador}
          guardado={guardado}
          sonido={prefs.sonido}
          volumen={prefs.volumen}
          silenciado={silenciado}
          ocupado={ocupado}
          onPausar={() => void pausar()}
          onTerminar={() => void pedirCierre(true)}
          onAnotar={anotar}
          onSonido={elegirSonido}
          onVolumen={elegirVolumen}
          onSilenciar={silenciar}
        />
      );
    case "DESCANSO":
      return (
        <FocusDescanso
          sesion={sesion}
          segundos={segundosDelReloj}
          ocupado={ocupado}
          onVolverAntes={() => void volverAntes()}
          onTerminarSesion={() => setCierre({ terminado: false })}
        />
      );
    case "PAUSADA":
    case "LISTA": {
      const Pantalla = fase === "PAUSADA" ? FocusPausada : FocusLista;
      return (
        <Pantalla
          sesion={sesion}
          focoSegundos={focoSegundos}
          ocupado={ocupado}
          aviso={aviso}
          anotador={anotador}
          guardado={guardado}
          onContinuar={() => void continuar()}
          onMinimizar={minimizar}
          onPomodoro={() => setEligiendoPomodoro(true)}
          onSalir={() => setCierre({ terminado: false })}
          onTerminar={() => setCierre({ terminado: true })}
          onAnotar={anotar}
        />
      );
    }
    case "RECUPERACION":
      return (
        <FocusRecuperacion
          sesion={sesion}
          ocupado={ocupado}
          onReanudar={() => void recuperar("REANUDAR")}
          onTermineAlCerrar={() => void guardarSesion("RECUPERADA", null)}
          onRevisar={() => void recuperar("REVISAR")}
        />
      );
    case "FINALIZADA":
      return (
        <FocusFinalizada
          sesion={sesion}
          anotador={anotador}
          guardado={guardado}
          onAnotar={anotar}
          onVerBitacora={aLaBitacora ? () => router.push(aLaBitacora) : null}
        />
      );
  }
}
