"use client";

/**
 * El asistente de reportes y mejoras — [ADR-103](../../docs/decisions.md#adr-103).
 *
 * ⚠️ **Simulado, y lo dice.** El owner lo pidió *"tal cual así"*, con las
 * capturas de otro software delante, y *"por ahora simulá las respuestas"*. Lo
 * que contesta sale de `lib/client/simulacion/asistente.ts`: **sin red, sin
 * persistencia, y nada se envía**. Por eso sólo lo montan los layouts con
 * `MODO_PRUEBA=1` —sin la variable no llega al HTML— y el rótulo *Simulado* va
 * siempre a la vista en el encabezado.
 *
 * Tomado del software: el botón redondo abajo a la derecha que se vuelve cruz,
 * las dos opciones de entrada, la pregunta aclaratoria, la tarjeta *Tu
 * sugerencia* con *Confirmar y enviar* / *Corregir algo*, la píldora *Reporte
 * enviado* y *Nueva conversación*. No se copió el nombre del producto.
 *
 * ⚠️ **Botón redondo y controles en píldora, contra `V-04`.** El sistema fuerza
 * 7 px en todo `button` e `input`; acá se usa `.pill` porque el owner lo pidió
 * *"tal cual así"*. Queda dicho en ADR-103 y **no se extiende** a otras pantallas.
 *
 * ⚠️ **La conversación es estado de la visita.** Cerrar el panel la conserva;
 * recargar la pierde. Guardar reportes que no se mandaron sería guardar ficción.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowUp, Check, MessageCircle, Paperclip, X } from "lucide-react";

import { t } from "@/lib/content/es-AR";
import {
  FASE_INICIAL,
  avanzar,
  lineasDelResumen,
  ofreceOpciones,
  saludo,
  type Adjunto,
  type Borrador,
  type Entrada,
  type Fase,
  type Mensaje,
} from "@/lib/client/simulacion/asistente";

const BOTON = 56;
const MARGEN = 16;

let adjuntosCreados = 0;

export function Asistente({ demora = 700 }: { demora?: number }) {
  const [abierto, setAbierto] = useState(false);
  const [fase, setFase] = useState<Fase>(FASE_INICIAL);
  const [mensajes, setMensajes] = useState<Mensaje[]>(() => saludo());
  const [escribiendo, setEscribiendo] = useState(false);
  const [texto, setTexto] = useState("");
  const [capturas, setCapturas] = useState<Adjunto[]>([]);

  const lista = useRef<HTMLDivElement>(null);
  const campo = useRef<HTMLInputElement>(null);
  const selector = useRef<HTMLInputElement>(null);
  const temporizador = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Todas las `blob:` que se crearon, para soltarlas al empezar de nuevo.
  const urls = useRef<string[]>([]);

  useEffect(() => {
    const creadas = urls.current;
    return () => {
      if (temporizador.current) clearTimeout(temporizador.current);
      creadas.forEach((u) => URL.revokeObjectURL(u));
    };
  }, []);

  // Al abrir, el foco va a escribir; con Escape se cierra.
  useEffect(() => {
    if (!abierto) return;
    campo.current?.focus();
    function alTeclear(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.stopPropagation();
        setAbierto(false);
      }
    }
    document.addEventListener("keydown", alTeclear, true);
    return () => document.removeEventListener("keydown", alTeclear, true);
  }, [abierto]);

  // El último mensaje siempre a la vista.
  useEffect(() => {
    const el = lista.current;
    if (el && typeof el.scrollTo === "function") el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [mensajes, escribiendo, abierto]);

  const actuar = useCallback(
    (entrada: Entrada) => {
      if (escribiendo) return;
      const turno = avanzar(fase, entrada);
      if (turno.delEstudiante.length === 0 && turno.delAsistente.length === 0) return;
      setFase(turno.fase);
      setMensajes((m) => [...m, ...turno.delEstudiante]);
      setEscribiendo(true);
      temporizador.current = setTimeout(() => {
        setMensajes((m) => [...m, ...turno.delAsistente]);
        setEscribiendo(false);
        temporizador.current = null;
      }, demora);
    },
    [fase, escribiendo, demora],
  );

  function mandar() {
    if (escribiendo || (texto.trim() === "" && capturas.length === 0)) return;
    actuar({ entrada: "TEXTO", texto, adjuntos: capturas });
    setTexto("");
    setCapturas([]);
  }

  function sumarCapturas(archivos: FileList | File[]) {
    const imagenes = Array.from(archivos).filter((a) => a.type.startsWith("image/"));
    if (imagenes.length === 0) return false;
    const nuevas = imagenes.map((a) => {
      const url = URL.createObjectURL(a);
      urls.current.push(url);
      adjuntosCreados += 1;
      return { id: `adj-${adjuntosCreados}`, nombre: a.name || "captura", url };
    });
    setCapturas((c) => [...c, ...nuevas]);
    return true;
  }

  function empezarDeNuevo() {
    if (temporizador.current) clearTimeout(temporizador.current);
    temporizador.current = null;
    urls.current.forEach((u) => URL.revokeObjectURL(u));
    urls.current = [];
    setEscribiendo(false);
    setFase(FASE_INICIAL);
    setMensajes(saludo());
    setTexto("");
    setCapturas([]);
    campo.current?.focus();
  }

  const empezada = mensajes.length > 1;
  // Sólo la última tarjeta ofrece confirmar: una vieja ya no es lo que se manda.
  const ultimoResumen = [...mensajes].reverse().find((m) => m.clase === "RESUMEN")?.id ?? null;
  const puedeMandar = !escribiendo && (texto.trim() !== "" || capturas.length > 0);

  return (
    <>
      {abierto && (
        <section
          role="dialog"
          aria-label={t("ASISTENTE.TITULO")}
          data-asistente
          className="flex flex-col"
          style={{
            position: "fixed",
            right: MARGEN,
            bottom: MARGEN + BOTON + 12,
            zIndex: 55,
            width: 440,
            maxWidth: `calc(100vw - ${MARGEN * 2}px)`,
            height: 620,
            maxHeight: `calc(100vh - ${MARGEN * 2 + BOTON + 12 + 16}px)`,
            background: "var(--background)",
            color: "var(--foreground)",
            border: ".5px solid var(--border)",
            borderRadius: "calc(var(--radius) * 2)",
            boxShadow: "var(--sombra-menu)",
            overflow: "hidden",
          }}
        >
          <header
            className="flex items-start justify-between"
            style={{ gap: 12, padding: "18px 20px 14px", borderBottom: ".5px solid var(--border)" }}
          >
            <div className="min-w-0">
              <div className="flex items-center" style={{ gap: 8 }}>
                <h2 style={{ fontSize: "var(--text-body)", fontWeight: 600, margin: 0 }}>{t("ASISTENTE.TITULO")}</h2>
                <span
                  style={{
                    fontSize: "var(--text-meta)",
                    color: "var(--muted-foreground)",
                    border: ".5px dashed var(--border)",
                    borderRadius: 999,
                    padding: "1px 8px",
                  }}
                >
                  {t("ASISTENTE.SIMULADO")}
                </span>
              </div>
              <p
                style={{ fontSize: "var(--text-label)", color: "var(--muted-foreground)", margin: "2px 0 0" }}
              >
                {t("ASISTENTE.SUBTITULO")}
              </p>
            </div>
            {empezada && (
              <button
                onClick={empezarDeNuevo}
                className="hover:text-[var(--foreground)]"
                style={{
                  fontSize: "var(--text-label)",
                  color: "var(--muted-foreground)",
                  padding: "4px 2px",
                  whiteSpace: "nowrap",
                  flexShrink: 0,
                }}
              >
                {t("ASISTENTE.NUEVA")}
              </button>
            )}
          </header>

          <div
            ref={lista}
            role="log"
            aria-live="polite"
            className="flex min-h-0 flex-1 flex-col"
            style={{ gap: 12, padding: "18px 16px", overflowY: "auto" }}
          >
            {mensajes.map((m) => (
              <Burbuja
                key={m.id}
                mensaje={m}
                vigente={m.id === ultimoResumen && fase.fase === "CONFIRMAR" && !escribiendo}
                onConfirmar={() => actuar({ entrada: "CONFIRMAR" })}
                onCorregir={() => actuar({ entrada: "CORREGIR" })}
              />
            ))}

            {escribiendo && <Escribiendo />}

            {!escribiendo && ofreceOpciones(fase) && (
              <div className="flex flex-col items-start" style={{ gap: 8, paddingLeft: 4 }}>
                <Opcion onClick={() => actuar({ entrada: "ELEGIR", tipo: "PROBLEMA" })}>
                  {t("ASISTENTE.OPCION.PROBLEMA")}
                </Opcion>
                <Opcion onClick={() => actuar({ entrada: "ELEGIR", tipo: "MEJORA" })}>
                  {t("ASISTENTE.OPCION.MEJORA")}
                </Opcion>
              </div>
            )}
          </div>

          <footer style={{ borderTop: ".5px solid var(--border)", padding: "12px 14px 14px" }}>
            {capturas.length > 0 && (
              <ul className="flex flex-wrap" style={{ gap: 8, marginBottom: 10 }}>
                {capturas.map((c) => (
                  <li key={c.id} style={{ position: "relative" }}>
                    {/* eslint-disable-next-line @next/next/no-img-element -- `blob:` local, no pasa por el optimizador */}
                    <img
                      src={c.url}
                      alt={c.nombre}
                      style={{
                        width: 52,
                        height: 52,
                        objectFit: "cover",
                        borderRadius: "var(--radius-control)",
                        border: ".5px solid var(--border)",
                      }}
                    />
                    <button
                      onClick={() => setCapturas((cs) => cs.filter((x) => x.id !== c.id))}
                      aria-label={`${t("ASISTENTE.QUITAR_CAPTURA")} ${c.nombre}`}
                      className="pill flex items-center justify-center"
                      style={{
                        position: "absolute",
                        top: -6,
                        right: -6,
                        width: 18,
                        height: 18,
                        borderRadius: 999,
                        background: "var(--foreground)",
                        color: "var(--background)",
                      }}
                    >
                      <X size={11} aria-hidden />
                    </button>
                  </li>
                ))}
              </ul>
            )}

            <form
              className="flex items-center"
              style={{ gap: 8 }}
              onSubmit={(e) => {
                e.preventDefault();
                mandar();
              }}
            >
              <button
                type="button"
                onClick={() => selector.current?.click()}
                aria-label={t("ASISTENTE.ADJUNTAR")}
                className="pill flex items-center justify-center hover:bg-[var(--muted)]"
                style={{ width: 40, height: 40, borderRadius: 999, flexShrink: 0, color: "var(--foreground)" }}
              >
                <Paperclip size={20} aria-hidden />
              </button>
              <input
                ref={selector}
                type="file"
                accept="image/*"
                multiple
                hidden
                onChange={(e) => {
                  if (e.target.files) sumarCapturas(e.target.files);
                  e.target.value = "";
                }}
              />
              <input
                ref={campo}
                value={texto}
                onChange={(e) => setTexto(e.target.value)}
                onPaste={(e) => {
                  // Pegar una captura la adjunta; pegar texto sigue su curso.
                  if (e.clipboardData.files.length > 0 && sumarCapturas(e.clipboardData.files)) e.preventDefault();
                }}
                placeholder={t("ASISTENTE.ESCRIBIR")}
                aria-label={t("ASISTENTE.ESCRIBIR")}
                className="pill min-w-0 flex-1 outline-none focus-visible:border-[var(--ring)]"
                style={{
                  height: 42,
                  padding: "0 16px",
                  borderRadius: 999,
                  border: ".5px solid var(--border)",
                  background: "transparent",
                  color: "var(--foreground)",
                  fontSize: "var(--text-label)",
                }}
              />
              <button
                type="submit"
                disabled={!puedeMandar}
                aria-label={t("ASISTENTE.ENVIAR")}
                className="pill flex items-center justify-center"
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 999,
                  flexShrink: 0,
                  background: puedeMandar ? "var(--foreground)" : "var(--muted-foreground)",
                  color: "var(--background)",
                  opacity: puedeMandar ? 1 : 0.6,
                  cursor: puedeMandar ? "pointer" : "default",
                }}
              >
                <ArrowUp size={20} aria-hidden />
              </button>
            </form>
          </footer>
        </section>
      )}

      <button
        onClick={() => setAbierto((a) => !a)}
        aria-label={abierto ? t("ASISTENTE.CERRAR") : t("ASISTENTE.ABRIR")}
        aria-expanded={abierto}
        aria-haspopup="dialog"
        data-boton-asistente
        className="pill flex items-center justify-center transition-transform hover:scale-105 motion-reduce:transition-none motion-reduce:hover:scale-100"
        style={{
          position: "fixed",
          right: MARGEN,
          bottom: MARGEN,
          zIndex: 55,
          width: BOTON,
          height: BOTON,
          borderRadius: 999,
          background: "var(--foreground)",
          color: "var(--background)",
          boxShadow: "var(--sombra-flotante)",
        }}
      >
        {abierto ? <X size={24} aria-hidden /> : <MessageCircle size={24} aria-hidden />}
      </button>
    </>
  );
}

function Burbuja({
  mensaje: m,
  vigente,
  onConfirmar,
  onCorregir,
}: {
  mensaje: Mensaje;
  vigente: boolean;
  onConfirmar: () => void;
  onCorregir: () => void;
}) {
  const base = {
    maxWidth: "85%",
    padding: "12px 16px",
    fontSize: "var(--text-body)",
    lineHeight: 1.5,
    borderRadius: 22,
    whiteSpace: "pre-wrap" as const,
    overflowWrap: "anywhere" as const,
  };

  switch (m.clase) {
    case "ASISTENTE":
      return (
        <p style={{ ...base, alignSelf: "flex-start", margin: 0, background: "var(--card)", color: "var(--foreground)" }}>
          {m.texto}
        </p>
      );
    case "ESTUDIANTE":
      return (
        <div className="flex flex-col items-end" style={{ alignSelf: "flex-end", gap: 6, maxWidth: "85%" }}>
          {m.adjuntos.length > 0 && (
            <div className="flex flex-wrap justify-end" style={{ gap: 6 }}>
              {m.adjuntos.map((a) => (
                // eslint-disable-next-line @next/next/no-img-element -- `blob:` local
                <img
                  key={a.id}
                  src={a.url}
                  alt={a.nombre}
                  style={{ maxWidth: 180, maxHeight: 140, borderRadius: 14, border: ".5px solid var(--border)" }}
                />
              ))}
            </div>
          )}
          {m.texto && (
            <p
              style={{
                ...base,
                maxWidth: "100%",
                margin: 0,
                background: "var(--foreground)",
                color: "var(--background)",
              }}
            >
              {m.texto}
            </p>
          )}
        </div>
      );
    case "RESUMEN":
      return <Resumen borrador={m.borrador} vigente={vigente} onConfirmar={onConfirmar} onCorregir={onCorregir} />;
    case "ENVIADO":
      return (
        <span
          role="status"
          className="flex items-center"
          style={{
            alignSelf: "flex-start",
            gap: 6,
            marginLeft: 4,
            padding: "6px 14px",
            borderRadius: 999,
            background: "var(--exito-tinte)",
            color: "var(--exito-tinte-texto)",
            border: ".5px solid var(--exito-tinte-texto)",
            fontSize: "var(--text-label)",
            fontWeight: 500,
          }}
        >
          <Check size={15} aria-hidden />
          {t("ASISTENTE.ENVIADO")}
        </span>
      );
  }
}

function Resumen({
  borrador,
  vigente,
  onConfirmar,
  onCorregir,
}: {
  borrador: Borrador;
  vigente: boolean;
  onConfirmar: () => void;
  onCorregir: () => void;
}) {
  return (
    <article
      data-resumen
      style={{
        alignSelf: "stretch",
        background: "var(--card)",
        border: ".5px solid var(--border)",
        borderRadius: 22,
        padding: "16px 18px",
      }}
    >
      <h3
        style={{
          margin: 0,
          fontSize: "var(--text-meta)",
          fontWeight: 500,
          letterSpacing: "0.06em",
          textTransform: "uppercase",
          color: "var(--muted-foreground)",
        }}
      >
        {t(borrador.tipo === "MEJORA" ? "ASISTENTE.RESUMEN.MEJORA" : "ASISTENTE.RESUMEN.PROBLEMA")}
      </h3>
      <div style={{ marginTop: 6, fontSize: "var(--text-body)", lineHeight: 1.5, overflowWrap: "anywhere" }}>
        {lineasDelResumen(borrador).map((l, i) => (
          <p key={i} style={{ margin: i === 0 ? 0 : "4px 0 0" }}>
            {l}
          </p>
        ))}
      </div>
      {vigente && (
        <>
          <p style={{ margin: "14px 0 0", fontSize: "var(--text-label)", color: "var(--muted-foreground)" }}>
            {t("ASISTENTE.RESUMEN.PREGUNTA")}
          </p>
          <div className="flex flex-wrap items-center" style={{ gap: 8, marginTop: 10 }}>
            <button
              onClick={onConfirmar}
              className="pill"
              style={{
                padding: "9px 18px",
                borderRadius: 999,
                background: "var(--foreground)",
                color: "var(--background)",
                fontSize: "var(--text-label)",
                fontWeight: 500,
              }}
            >
              {t("ASISTENTE.CONFIRMAR")}
            </button>
            <button
              onClick={onCorregir}
              className="pill hover:bg-[var(--muted)]"
              style={{
                padding: "9px 18px",
                borderRadius: 999,
                color: "var(--foreground)",
                fontSize: "var(--text-label)",
                fontWeight: 500,
              }}
            >
              {t("ASISTENTE.CORREGIR")}
            </button>
          </div>
        </>
      )}
    </article>
  );
}

function Opcion({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className="pill hover:bg-[var(--muted)]"
      style={{
        padding: "9px 18px",
        borderRadius: 999,
        background: "var(--card)",
        border: ".5px solid var(--border)",
        color: "var(--foreground)",
        fontSize: "var(--text-body)",
      }}
    >
      {children}
    </button>
  );
}

function Escribiendo() {
  return (
    <div
      role="status"
      aria-label={t("ASISTENTE.ESCRIBIENDO")}
      className="flex items-center"
      style={{ alignSelf: "flex-start", gap: 5, padding: "16px 18px", borderRadius: 22, background: "var(--card)" }}
    >
      {[0, 150, 300].map((retraso) => (
        <span
          key={retraso}
          aria-hidden
          className="animate-pulse motion-reduce:animate-none"
          style={{
            width: 7,
            height: 7,
            borderRadius: 999,
            background: "var(--muted-foreground)",
            animationDelay: `${retraso}ms`,
          }}
        />
      ))}
    </div>
  );
}
