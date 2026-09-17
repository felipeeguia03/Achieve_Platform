"use client";

/**
 * Los paneles de **Modo Clase** — [ADR-099](../../../docs/decisions.md#adr-099).
 *
 * Apuntes por entrada, grabaciones con etiquetas, material y unidades. Reciben
 * props y callbacks; **no piden nada a la red** (la URL de una grabación la
 * consigue la superficie y llega por promesa).
 */

import { useEffect, useRef, useState } from "react";
import {
  ExternalLink,
  FileText,
  Image as ImagenIcono,
  Link2,
  Mic,
  Pencil,
  Play,
  Square,
  Tag,
  Trash2,
  Upload,
  X,
  type LucideIcon,
} from "lucide-react";

import { ReglaDeNegocio } from "../design-system";
import { colorDeMateria } from "@/lib/domain/color-de-materia";
import { llenarCopy, t, type CopyId } from "@/lib/content/es-AR";
import {
  ETIQUETAS_SUGERIDAS,
  MAXIMO_DE_ENTRADA,
  MAXIMO_DE_ETIQUETA,
  minutero,
  reloj,
  tamanoLegible,
} from "@/lib/domain/sesion-de-clase";
import { listaDeUnidades, type UnidadesDeClase } from "@/lib/domain/unidades-de-clase";
import type { ApunteDeClase, GrabacionDeClase, MaterialDeClase } from "@/lib/domain/view-models";

// ── Estilos compartidos ──────────────────────────────────────────────────────

export const tarjeta = {
  border: "1px solid var(--border)",
  borderRadius: "var(--radius)",
  background: "var(--card)",
  padding: 16,
} as const;
export const meta = { fontSize: "var(--text-meta)", color: "var(--muted-foreground)" } as const;
const tabular = { fontVariantNumeric: "tabular-nums" } as const;

const campo = {
  width: "100%",
  border: "1px solid var(--border)",
  borderRadius: "var(--radius-control)",
  background: "var(--background)",
  color: "var(--foreground)",
  padding: "8px 10px",
  fontSize: "var(--text-body)",
} as const;

/** La píldora de borde fino de `AccionDeObjeto`, con ícono. */
export function BotonDeObjeto({
  icono: Icono,
  children,
  onClick,
  disabled,
  etiqueta,
  destacado,
  tipo = "button",
}: {
  tipo?: "button" | "submit";
  icono?: LucideIcon;
  children?: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  /** Para botones sólo de ícono. */
  etiqueta?: string;
  destacado?: boolean;
}) {
  return (
    <button
      type={tipo}
      onClick={onClick}
      disabled={disabled}
      aria-label={etiqueta}
      title={etiqueta}
      className="focus-visible:outline-2 focus-visible:outline-offset-2"
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        border: "1px solid var(--border)",
        borderRadius: "var(--radius-pildora)",
        padding: children ? "5px 12px" : 6,
        fontSize: "var(--text-label)",
        fontWeight: 500,
        color: destacado ? "var(--primary-foreground)" : "var(--foreground)",
        background: destacado ? "var(--primary)" : "var(--card)",
        opacity: disabled ? 0.5 : 1,
        whiteSpace: "nowrap",
      }}
    >
      {Icono && <Icono aria-hidden size={14} strokeWidth={1.9} />}
      {children}
    </button>
  );
}

/** Cabecera de tarjeta: título de sección a la izquierda, lo que sea a la derecha. */
export function CabeceraDePanel({ id, titulo, children }: { id: string; titulo: string; children?: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2">
      <h2 id={id} className="titulo-de-seccion" style={{ margin: 0 }}>
        {titulo}
      </h2>
      {children && <div className="flex flex-wrap items-center gap-2">{children}</div>}
    </div>
  );
}

function Confirmar({ onSi, onNo }: { onSi: () => void; onNo: () => void }) {
  return (
    <span className="inline-flex flex-wrap items-center gap-2" role="group">
      <span style={meta}>{t("CLASE.BORRAR_CONFIRMAR")}</span>
      <button type="button" onClick={onSi} style={{ ...meta, color: "var(--urgencia-texto)", fontWeight: 600 }}>
        {t("CLASE.BORRAR_SI")}
      </button>
      <button type="button" onClick={onNo} style={{ ...meta, textDecoration: "underline" }}>
        {t("CLASE.CANCELAR")}
      </button>
    </span>
  );
}

// ── Apuntes ──────────────────────────────────────────────────────────────────

export interface ApuntePendiente {
  clave: string;
  texto: string;
  estado: "ENVIANDO" | "ERROR";
}

export interface PropsDeApuntes {
  apuntes: readonly ApunteDeClase[];
  pendientes: readonly ApuntePendiente[];
  onAnotar: (texto: string) => void;
  onEditar: (id: string, texto: string) => void;
  onBorrar: (id: string) => void;
  onReintentar: (clave: string) => void;
}

/**
 * **Enter guarda** una entrada; Shift+Enter hace un salto de línea (ADR-099 §4).
 * Cada entrada lleva el momento de la clase en que se escribió.
 */
export function PanelDeApuntes(p: PropsDeApuntes) {
  const [borrador, setBorrador] = useState("");
  const lista = useRef<HTMLOListElement>(null);
  const cantidad = p.apuntes.length;

  // Al guardar, la lista baja hasta la última: es donde se está escribiendo.
  useEffect(() => {
    const el = lista.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [cantidad, p.pendientes.length]);

  const guardar = () => {
    const texto = borrador.trim();
    if (!texto) return;
    p.onAnotar(texto);
    setBorrador("");
  };

  const vacio = cantidad === 0 && p.pendientes.length === 0;

  return (
    <section aria-labelledby="clase-apuntes" style={tarjeta} data-panel="apuntes">
      <CabeceraDePanel id="clase-apuntes" titulo={t("CLASE.APUNTES")}>
        {cantidad > 0 && <span style={meta}>{llenarCopy("CLASE.APUNTES_CANTIDAD", { n: cantidad })}</span>}
      </CabeceraDePanel>

      {vacio ? (
        <p style={{ ...meta, marginTop: 10 }}>{t("CLASE.APUNTES_VACIO")}</p>
      ) : (
        <ol ref={lista} className="mt-2 flex flex-col" data-apuntes style={{ maxHeight: 420, overflowY: "auto" }}>
          {p.apuntes.map((a) => (
            <Apunte key={a.id} apunte={a} onEditar={p.onEditar} onBorrar={p.onBorrar} />
          ))}
          {p.pendientes.map((a) => (
            <li key={a.clave} data-apunte-pendiente={a.estado} className="hairline-b flex gap-3 py-2.5">
              <span style={{ ...meta, ...tabular, width: 64, flexShrink: 0 }}>—</span>
              <div className="min-w-0 flex-1">
                <p style={{ fontSize: "var(--text-body)", whiteSpace: "pre-wrap", overflowWrap: "anywhere", opacity: 0.7 }}>
                  {a.texto}
                </p>
                {a.estado === "ENVIANDO" ? (
                  <span style={meta}>{t("CLASE.APUNTE_GUARDANDO")}</span>
                ) : (
                  <button
                    type="button"
                    onClick={() => p.onReintentar(a.clave)}
                    style={{ ...meta, color: "var(--urgencia-texto)", textDecoration: "underline" }}
                  >
                    {t("CLASE.APUNTE_ERROR")}
                  </button>
                )}
              </div>
            </li>
          ))}
        </ol>
      )}

      <div className="mt-3">
        <textarea
          aria-label={t("CLASE.APUNTES")}
          value={borrador}
          maxLength={MAXIMO_DE_ENTRADA}
          rows={2}
          placeholder={t("CLASE.APUNTES_PLACEHOLDER")}
          onChange={(e) => setBorrador(e.target.value)}
          onKeyDown={(e) => {
            // Durante una composición (acentos en algunos teclados, IME) Enter
            // confirma el carácter, no el apunte.
            if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
              e.preventDefault();
              guardar();
            }
          }}
          style={{ ...campo, resize: "vertical", lineHeight: 1.55, padding: "10px 12px" }}
        />
        <p style={{ ...meta, marginTop: 4 }}>{t("CLASE.APUNTES_AYUDA")}</p>
      </div>
    </section>
  );
}

function Apunte({
  apunte,
  onEditar,
  onBorrar,
}: {
  apunte: ApunteDeClase;
  onEditar: (id: string, texto: string) => void;
  onBorrar: (id: string) => void;
}) {
  const [editando, setEditando] = useState(false);
  const [borrando, setBorrando] = useState(false);
  const [texto, setTexto] = useState(apunte.texto);

  return (
    <li className="hairline-b flex gap-3 py-2.5" data-apunte={apunte.id}>
      <span style={{ ...meta, ...tabular, width: 64, flexShrink: 0, paddingTop: 2 }}>
        {apunte.segundos === null ? t("CLASE.APUNTE_DESPUES") : reloj(apunte.segundos)}
      </span>
      <div className="min-w-0 flex-1">
        {editando ? (
          <form
            className="flex flex-col gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              if (texto.trim()) onEditar(apunte.id, texto);
              setEditando(false);
            }}
          >
            <textarea
              aria-label={t("CLASE.APUNTE_EDITAR")}
              value={texto}
              autoFocus
              rows={2}
              maxLength={MAXIMO_DE_ENTRADA}
              onChange={(e) => setTexto(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                  e.preventDefault();
                  e.currentTarget.form?.requestSubmit();
                }
                if (e.key === "Escape") setEditando(false);
              }}
              style={{ ...campo, resize: "vertical" }}
            />
            <div className="flex gap-2">
              <BotonDeObjeto tipo="submit" destacado>
                {t("CLASE.GUARDAR")}
              </BotonDeObjeto>
              <BotonDeObjeto
                onClick={() => {
                  setTexto(apunte.texto);
                  setEditando(false);
                }}
              >
                {t("CLASE.CANCELAR")}
              </BotonDeObjeto>
            </div>
          </form>
        ) : (
          <p style={{ fontSize: "var(--text-body)", whiteSpace: "pre-wrap", overflowWrap: "anywhere", lineHeight: 1.5 }}>
            {apunte.texto}
            {apunte.editadoEn && <span style={{ ...meta, marginLeft: 6 }}>({t("CLASE.APUNTE_EDITADO")})</span>}
          </p>
        )}
        {borrando && (
          <div className="mt-1">
            <Confirmar
              onSi={() => {
                setBorrando(false);
                onBorrar(apunte.id);
              }}
              onNo={() => setBorrando(false)}
            />
          </div>
        )}
      </div>
      {!editando && !borrando && (
        <div className="flex shrink-0 items-start gap-1">
          <BotonDeObjeto icono={Pencil} etiqueta={t("CLASE.APUNTE_EDITAR")} onClick={() => setEditando(true)} />
          <BotonDeObjeto icono={Trash2} etiqueta={t("CLASE.APUNTE_BORRAR")} onClick={() => setBorrando(true)} />
        </div>
      )}
    </li>
  );
}

// ── Grabaciones ──────────────────────────────────────────────────────────────

export type EstadoDeGrabadora =
  | { tipo: "INACTIVA" }
  /** El aviso de ADR-099 §2, la primera vez de cada clase. */
  | { tipo: "AVISO" }
  | { tipo: "PIDIENDO_MICROFONO" }
  | { tipo: "GRABANDO"; desde: number; etiquetas: ReadonlyArray<{ texto: string; segundo: number }> }
  | { tipo: "SUBIENDO" }
  | { tipo: "ERROR_SUBIDA" }
  | { tipo: "SIN_MICROFONO" }
  | { tipo: "DENEGADO" };

export interface PropsDeGrabaciones {
  activa: boolean;
  grabaciones: readonly GrabacionDeClase[];
  estado: EstadoDeGrabadora;
  onGrabar: () => void;
  onConfirmar: () => void;
  onCancelar: () => void;
  onEtiquetarMomento: (texto: string) => void;
  onDetener: () => void;
  onReintentar: () => void;
  /** La URL firmada para escuchar. `null` ⇒ no se pudo. */
  onEscuchar: (id: string) => Promise<string | null>;
  onEtiquetar: (id: string, texto: string, segundo: number | null) => void;
  onQuitarEtiqueta: (id: string) => void;
  onBorrar: (id: string) => void;
}

function useAhora(activo: boolean): number {
  const [ahora, setAhora] = useState(() => Date.now());
  useEffect(() => {
    if (!activo) return;
    const id = window.setInterval(() => setAhora(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [activo]);
  return ahora;
}

function Sugerencias({ onElegir }: { onElegir: (texto: string) => void }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {ETIQUETAS_SUGERIDAS.map((s) => (
        <button
          key={s}
          type="button"
          onClick={() => onElegir(s)}
          style={{
            border: "1px solid var(--border)",
            borderRadius: "var(--radius-pildora)",
            padding: "2px 10px",
            fontSize: "var(--text-meta)",
            background: "var(--background)",
            color: "var(--foreground)",
          }}
        >
          {s}
        </button>
      ))}
    </div>
  );
}

function FormularioDeEtiqueta({
  onGuardar,
  onCerrar,
  pie,
}: {
  onGuardar: (texto: string) => void;
  onCerrar: () => void;
  pie?: React.ReactNode;
}) {
  const [texto, setTexto] = useState("");
  const confirmar = (valor: string) => {
    if (!valor.trim()) return;
    onGuardar(valor.trim());
    setTexto("");
    onCerrar();
  };
  return (
    <div className="mt-2 flex flex-col gap-2" data-formulario-etiqueta>
      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          confirmar(texto);
        }}
      >
        <input
          aria-label={t("CLASE.ETIQUETA_AGREGAR")}
          value={texto}
          autoFocus
          maxLength={MAXIMO_DE_ETIQUETA}
          placeholder={t("CLASE.ETIQUETA_PLACEHOLDER")}
          onChange={(e) => setTexto(e.target.value)}
          onKeyDown={(e) => e.key === "Escape" && onCerrar()}
          style={{ ...campo, flex: 1, minWidth: 0, padding: "6px 10px", fontSize: "var(--text-label)" }}
        />
        <button type="submit" style={{ ...meta, color: "var(--foreground)", fontWeight: 600 }}>
          {t("CLASE.GUARDAR")}
        </button>
        <button type="button" onClick={onCerrar} aria-label={t("CLASE.CANCELAR")} style={meta}>
          <X aria-hidden size={14} />
        </button>
      </form>
      <Sugerencias onElegir={confirmar} />
      {pie}
    </div>
  );
}

function ChipDeEtiqueta({
  texto,
  segundo,
  onClick,
  onQuitar,
}: {
  texto: string;
  segundo: number | null;
  onClick?: () => void;
  onQuitar?: () => void;
}) {
  return (
    <span
      data-etiqueta={texto}
      className="inline-flex items-center"
      style={{
        gap: 6,
        border: "1px solid var(--border)",
        borderRadius: "var(--radius-pildora)",
        background: "var(--background)",
        padding: "2px 4px 2px 10px",
        fontSize: "var(--text-meta)",
      }}
    >
      <button type="button" onClick={onClick} disabled={!onClick} className="inline-flex items-center" style={{ gap: 6 }}>
        <Tag aria-hidden size={11} strokeWidth={2} />
        {segundo !== null && <span style={{ ...tabular, color: "var(--muted-foreground)" }}>{minutero(segundo)}</span>}
        <span style={{ fontWeight: 500 }}>{texto}</span>
      </button>
      {onQuitar ? (
        <button
          type="button"
          onClick={onQuitar}
          aria-label={llenarCopy("CLASE.ETIQUETA_BORRAR", { texto })}
          style={{ color: "var(--muted-foreground)", padding: 2 }}
        >
          <X aria-hidden size={11} />
        </button>
      ) : (
        <span style={{ width: 4 }} />
      )}
    </span>
  );
}

export function PanelDeGrabaciones(p: PropsDeGrabaciones) {
  const { estado } = p;
  const grabando = estado.tipo === "GRABANDO";
  const ahora = useAhora(grabando);
  const [etiquetando, setEtiquetando] = useState(false);
  const segundos = grabando ? Math.max(0, Math.floor((ahora - estado.desde) / 1000)) : 0;
  const ocupada = estado.tipo !== "INACTIVA" && estado.tipo !== "SIN_MICROFONO" && estado.tipo !== "DENEGADO";

  return (
    <section aria-labelledby="clase-grabaciones" style={tarjeta} data-panel="grabaciones">
      <CabeceraDePanel id="clase-grabaciones" titulo={t("CLASE.GRABACIONES")}>
        {p.activa && !ocupada && estado.tipo !== "SIN_MICROFONO" && (
          <BotonDeObjeto icono={Mic} onClick={p.onGrabar}>
            {t("CLASE.GRABAR")}
          </BotonDeObjeto>
        )}
      </CabeceraDePanel>
      <div style={{ marginTop: 4 }}>
        <ReglaDeNegocio>{t("CLASE.GRABACIONES_REGLA")}</ReglaDeNegocio>
      </div>

      {estado.tipo === "AVISO" && (
        <div
          role="alertdialog"
          aria-labelledby="clase-aviso-grabar"
          data-aviso-grabar
          className="mt-3 flex flex-col gap-3"
          style={{ border: "1px solid var(--border)", borderRadius: "var(--radius-control)", background: "var(--background)", padding: 12 }}
        >
          <p id="clase-aviso-grabar" style={{ fontSize: "var(--text-body)", lineHeight: 1.5 }}>
            {t("CLASE.GRABAR_AVISO")}
          </p>
          <div className="flex flex-wrap gap-2">
            <BotonDeObjeto icono={Mic} onClick={p.onConfirmar} destacado>
              {t("CLASE.GRABAR_CONFIRMAR")}
            </BotonDeObjeto>
            <BotonDeObjeto onClick={p.onCancelar}>{t("CLASE.CANCELAR")}</BotonDeObjeto>
          </div>
        </div>
      )}

      {grabando && (
        <div
          data-grabando
          className="mt-3 flex flex-col gap-2"
          style={{ border: "1px solid var(--urgencia-tinte)", borderRadius: "var(--radius-control)", background: "var(--urgencia-tinte)", padding: 12 }}
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            {/* Punto quieto, sin latido: el principio de atención no se negocia por grabar. */}
            <span className="inline-flex items-center" style={{ gap: 8, color: "var(--urgencia-tinte-texto)", fontWeight: 600 }}>
              <span aria-hidden style={{ width: 8, height: 8, borderRadius: 999, background: "currentColor" }} />
              {t("CLASE.GRABANDO")}
              <span style={{ ...tabular, fontWeight: 500 }} data-reloj-grabacion>
                {reloj(segundos)}
              </span>
            </span>
            <div className="flex flex-wrap gap-2">
              <BotonDeObjeto icono={Tag} onClick={() => setEtiquetando(true)}>
                {t("CLASE.ETIQUETAR_MOMENTO")}
              </BotonDeObjeto>
              <BotonDeObjeto icono={Square} onClick={p.onDetener} destacado>
                {t("CLASE.DETENER")}
              </BotonDeObjeto>
            </div>
          </div>
          {etiquetando && (
            <FormularioDeEtiqueta
              onGuardar={p.onEtiquetarMomento}
              onCerrar={() => setEtiquetando(false)}
              pie={<span style={meta}>{llenarCopy("CLASE.ETIQUETA_EN", { momento: minutero(segundos) })}</span>}
            />
          )}
          {estado.etiquetas.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {estado.etiquetas.map((e, i) => (
                <ChipDeEtiqueta key={`${e.segundo}-${i}`} texto={e.texto} segundo={e.segundo} />
              ))}
            </div>
          )}
        </div>
      )}

      {(estado.tipo === "SUBIENDO" || estado.tipo === "PIDIENDO_MICROFONO") && (
        <p role="status" style={{ ...meta, marginTop: 10 }}>
          {estado.tipo === "SUBIENDO" ? t("CLASE.SUBIENDO_GRABACION") : "…"}
        </p>
      )}
      {estado.tipo === "ERROR_SUBIDA" && (
        <p role="alert" className="mt-3 flex flex-wrap items-center gap-2" style={{ ...meta, color: "var(--urgencia-texto)" }}>
          {t("CLASE.GRABACION_ERROR")}
          <BotonDeObjeto onClick={p.onReintentar}>{t("CLASE.REINTENTAR")}</BotonDeObjeto>
        </p>
      )}
      {(estado.tipo === "SIN_MICROFONO" || estado.tipo === "DENEGADO") && (
        <p role="status" style={{ ...meta, marginTop: 10 }}>
          {t(estado.tipo === "SIN_MICROFONO" ? "CLASE.SIN_MICROFONO" : "CLASE.MICROFONO_DENEGADO")}
        </p>
      )}

      {p.grabaciones.length === 0 ? (
        !grabando && estado.tipo !== "AVISO" && <p style={{ ...meta, marginTop: 10 }}>{t("CLASE.GRABACIONES_VACIO")}</p>
      ) : (
        <ol className="mt-3 flex flex-col gap-2" data-grabaciones>
          {p.grabaciones.map((g, i) => (
            <Grabacion key={g.id} n={i + 1} grabacion={g} {...p} />
          ))}
        </ol>
      )}
    </section>
  );
}

function Grabacion({ n, grabacion: g, onEscuchar, onEtiquetar, onQuitarEtiqueta, onBorrar }: PropsDeGrabaciones & { n: number; grabacion: GrabacionDeClase }) {
  const [url, setUrl] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);
  const [etiquetando, setEtiquetando] = useState(false);
  const [borrando, setBorrando] = useState(false);
  const [enMomento, setEnMomento] = useState(true);
  const audio = useRef<HTMLAudioElement>(null);
  const [posicion, setPosicion] = useState(0);
  const pendienteDeSalto = useRef<number | null>(null);

  const escuchar = async (desde?: number) => {
    if (!url) {
      setCargando(true);
      const firmada = await onEscuchar(g.id);
      setCargando(false);
      if (!firmada) return;
      setUrl(firmada);
      // El reproductor todavía no existe: el salto se hace cuando cargue.
      pendienteDeSalto.current = desde ?? null;
      return;
    }
    if (desde !== undefined && audio.current) {
      audio.current.currentTime = desde;
      void audio.current.play().catch(() => undefined);
    }
  };

  return (
    <li
      data-grabacion={g.id}
      style={{ border: "1px solid var(--border)", borderRadius: "var(--radius-control)", padding: 12, background: "var(--background)" }}
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <p style={{ fontSize: "var(--text-body)", fontWeight: 600 }}>{llenarCopy("CLASE.GRABACION", { n })}</p>
          <p style={meta}>
            {llenarCopy("CLASE.GRABACION_META", {
              duracion: minutero(g.duracion),
              momento: reloj(g.inicioEnClase),
              tamano: tamanoLegible(g.bytes),
            })}
          </p>
        </div>
        {borrando ? (
          <Confirmar onSi={() => onBorrar(g.id)} onNo={() => setBorrando(false)} />
        ) : (
          <div className="flex shrink-0 gap-1.5">
            {!url && (
              <BotonDeObjeto icono={Play} onClick={() => void escuchar()} disabled={cargando}>
                {t("CLASE.ESCUCHAR")}
              </BotonDeObjeto>
            )}
            <BotonDeObjeto icono={Tag} etiqueta={t("CLASE.ETIQUETA_AGREGAR")} onClick={() => setEtiquetando(true)} />
            <BotonDeObjeto icono={Trash2} etiqueta={t("CLASE.BORRAR_GRABACION")} onClick={() => setBorrando(true)} />
          </div>
        )}
      </div>

      {url && (
        <audio
          ref={audio}
          controls
          src={url}
          preload="metadata"
          className="mt-2 w-full"
          onLoadedMetadata={(e) => {
            if (pendienteDeSalto.current !== null) {
              e.currentTarget.currentTime = pendienteDeSalto.current;
              pendienteDeSalto.current = null;
              void e.currentTarget.play().catch(() => undefined);
            }
          }}
          onTimeUpdate={(e) => setPosicion(Math.floor(e.currentTarget.currentTime))}
        />
      )}

      {g.etiquetas.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {g.etiquetas.map((e) => (
            <ChipDeEtiqueta
              key={e.id}
              texto={e.texto}
              segundo={e.segundo}
              onClick={e.segundo !== null ? () => void escuchar(e.segundo as number) : undefined}
              onQuitar={() => onQuitarEtiqueta(e.id)}
            />
          ))}
        </div>
      )}

      {etiquetando && (
        <FormularioDeEtiqueta
          onGuardar={(texto) => onEtiquetar(g.id, texto, url && enMomento && posicion > 0 ? posicion : null)}
          onCerrar={() => setEtiquetando(false)}
          pie={
            url && posicion > 0 ? (
              <label className="inline-flex items-center gap-2" style={meta}>
                <input type="checkbox" checked={enMomento} onChange={(e) => setEnMomento(e.target.checked)} />
                {llenarCopy("CLASE.ETIQUETA_EN", { momento: minutero(posicion) })}
              </label>
            ) : (
              <span style={meta}>{t("CLASE.ETIQUETA_TODA")}</span>
            )
          }
        />
      )}
    </li>
  );
}

// ── Material ─────────────────────────────────────────────────────────────────

export interface SubidaDeMaterial {
  clave: string;
  nombre: string;
  estado: "SUBIENDO" | "ERROR" | "TIPO" | "GRANDE";
}

export interface PropsDeMaterial {
  material: readonly MaterialDeClase[];
  subidas: readonly SubidaDeMaterial[];
  onSubir: (archivos: File[]) => void;
  onLink: (url: string, titulo: string | null) => void;
  onAbrir: (id: string) => void;
  onBorrar: (id: string) => void;
  onDescartar: (clave: string) => void;
}

/** Un componente de ícono por tipo, declarado afuera del render. */
function IconoDeMaterial({ material: m }: { material: MaterialDeClase }) {
  if (m.tipo === "LINK") return <Link2 size={16} strokeWidth={1.75} />;
  if (m.mime?.startsWith("image/")) return <ImagenIcono size={16} strokeWidth={1.75} />;
  return <FileText size={16} strokeWidth={1.75} />;
}

function metaDeMaterial(m: MaterialDeClase): string {
  if (m.tipo === "LINK") {
    try {
      return new URL(m.url ?? "").hostname;
    } catch {
      return t("CLASE.LINK");
    }
  }
  const tipo = m.mime === "application/pdf" ? "PDF" : (m.mime?.split("/")[1]?.split(".").pop()?.toUpperCase() ?? "");
  return [tipo, m.bytes ? tamanoLegible(m.bytes) : null].filter(Boolean).join(" · ");
}

export function PanelDeMaterial(p: PropsDeMaterial) {
  const selector = useRef<HTMLInputElement>(null);
  const [arrastrando, setArrastrando] = useState(false);
  const [conLink, setConLink] = useState(false);
  const [url, setUrl] = useState("");
  const [titulo, setTitulo] = useState("");
  const [linkInvalido, setLinkInvalido] = useState(false);

  const guardarLink = () => {
    if (!/^https?:\/\/\S+$/i.test(url.trim())) {
      setLinkInvalido(true);
      return;
    }
    p.onLink(url.trim(), titulo.trim() || null);
    setUrl("");
    setTitulo("");
    setLinkInvalido(false);
    setConLink(false);
  };

  return (
    <section aria-labelledby="clase-material" style={tarjeta} data-panel="material">
      <CabeceraDePanel id="clase-material" titulo={t("CLASE.MATERIAL")}>
        <BotonDeObjeto icono={Upload} onClick={() => selector.current?.click()}>
          {t("CLASE.SUBIR_ARCHIVO")}
        </BotonDeObjeto>
        <BotonDeObjeto icono={Link2} onClick={() => setConLink((v) => !v)}>
          {t("CLASE.AGREGAR_LINK")}
        </BotonDeObjeto>
      </CabeceraDePanel>
      <div style={{ marginTop: 4 }}>
        <ReglaDeNegocio>{t("CLASE.MATERIAL_REGLA")}</ReglaDeNegocio>
      </div>

      <input
        ref={selector}
        type="file"
        multiple
        hidden
        data-selector-de-archivo
        accept=".pdf,.png,.jpg,.jpeg,.webp,.txt,.doc,.docx,.ppt,.pptx,.xls,.xlsx"
        onChange={(e) => {
          const archivos = [...(e.target.files ?? [])];
          if (archivos.length > 0) p.onSubir(archivos);
          e.target.value = "";
        }}
      />

      {conLink && (
        <form
          className="mt-3 flex flex-col gap-2 sm:flex-row"
          data-formulario-link
          onSubmit={(e) => {
            e.preventDefault();
            guardarLink();
          }}
        >
          <input
            aria-label={t("CLASE.AGREGAR_LINK")}
            value={url}
            autoFocus
            inputMode="url"
            placeholder={t("CLASE.LINK_URL")}
            onChange={(e) => setUrl(e.target.value)}
            style={{ ...campo, flex: 2, minWidth: 0 }}
          />
          <input
            aria-label={t("CLASE.LINK_TITULO")}
            value={titulo}
            maxLength={200}
            placeholder={t("CLASE.LINK_TITULO")}
            onChange={(e) => setTitulo(e.target.value)}
            style={{ ...campo, flex: 1, minWidth: 0 }}
          />
          <BotonDeObjeto tipo="submit" destacado>
            {t("CLASE.GUARDAR")}
          </BotonDeObjeto>
        </form>
      )}
      {linkInvalido && conLink && (
        <p role="alert" style={{ ...meta, color: "var(--urgencia-texto)", marginTop: 4 }}>
          {t("CLASE.LINK_INVALIDO")}
        </p>
      )}

      {(p.material.length > 0 || p.subidas.length > 0) && (
        <ul className="mt-3 flex flex-col" data-material>
          {p.material.map((m) => (
            <Material key={m.id} material={m} onAbrir={p.onAbrir} onBorrar={p.onBorrar} />
          ))}
          {p.subidas.map((s) => (
            <li key={s.clave} className="hairline-b flex items-center gap-3 py-2" data-subida={s.estado}>
              <FileText aria-hidden size={16} strokeWidth={1.75} style={{ color: "var(--muted-foreground)" }} />
              <span
                className="min-w-0 flex-1"
                style={{ ...meta, color: s.estado === "SUBIENDO" ? "var(--muted-foreground)" : "var(--urgencia-texto)" }}
              >
                {s.estado === "SUBIENDO"
                  ? llenarCopy("CLASE.SUBIENDO", { nombre: s.nombre })
                  : s.estado === "TIPO"
                    ? t("CLASE.MATERIAL_TIPO")
                    : s.estado === "GRANDE"
                      ? llenarCopy("CLASE.MATERIAL_GRANDE", { nombre: s.nombre })
                      : llenarCopy("CLASE.MATERIAL_ERROR", { nombre: s.nombre })}
              </span>
              {s.estado !== "SUBIENDO" && (
                <BotonDeObjeto icono={X} etiqueta={t("CLASE.CANCELAR")} onClick={() => p.onDescartar(s.clave)} />
              )}
            </li>
          ))}
        </ul>
      )}

      <button
        type="button"
        data-zona-de-archivos
        onClick={() => selector.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setArrastrando(true);
        }}
        onDragLeave={() => setArrastrando(false)}
        onDrop={(e) => {
          e.preventDefault();
          setArrastrando(false);
          const archivos = [...e.dataTransfer.files];
          if (archivos.length > 0) p.onSubir(archivos);
        }}
        className="mt-3 flex w-full items-center justify-center gap-2"
        style={{
          border: `1px dashed ${arrastrando ? "var(--foreground)" : "var(--border)"}`,
          borderRadius: "var(--radius-control)",
          background: arrastrando ? "var(--muted)" : "transparent",
          padding: "14px 12px",
          ...meta,
        }}
      >
        <Upload aria-hidden size={14} />
        {t("CLASE.MATERIAL_VACIO")}
      </button>
    </section>
  );
}

function Material({
  material: m,
  onAbrir,
  onBorrar,
}: {
  material: MaterialDeClase;
  onAbrir: (id: string) => void;
  onBorrar: (id: string) => void;
}) {
  const [borrando, setBorrando] = useState(false);
  return (
    <li className="hairline-b flex flex-wrap items-center gap-3 py-2" data-material-item={m.tipo}>
      <span
        aria-hidden
        className="flex shrink-0 items-center justify-center"
        style={{ width: 32, height: 32, borderRadius: "var(--radius-control)", background: "var(--muted)" }}
      >
        <IconoDeMaterial material={m} />
      </span>
      <div className="min-w-0 flex-1">
        <button
          type="button"
          onClick={() => onAbrir(m.id)}
          className="block max-w-full truncate text-left"
          style={{ fontSize: "var(--text-body)", fontWeight: 500 }}
        >
          {m.titulo}
        </button>
        <p style={meta}>{metaDeMaterial(m)}</p>
      </div>
      {borrando ? (
        <Confirmar onSi={() => onBorrar(m.id)} onNo={() => setBorrando(false)} />
      ) : (
        <div className="flex shrink-0 gap-1.5">
          <BotonDeObjeto icono={ExternalLink} etiqueta={t("CLASE.ABRIR")} onClick={() => onAbrir(m.id)} />
          <BotonDeObjeto
            icono={Trash2}
            etiqueta={llenarCopy("CLASE.BORRAR_MATERIAL", { titulo: m.titulo })}
            onClick={() => setBorrando(true)}
          />
        </div>
      )}
    </li>
  );
}

// ── Unidades y cómo venís ────────────────────────────────────────────────────

const COPY_DE_ESTADO: Record<UnidadesDeClase["unidades"][number]["estado"], CopyId> = {
  sin_evidencia: "CLASE.UNIDAD.sin_evidencia",
  enviada: "CLASE.UNIDAD.enviada",
  requiere_revision: "CLASE.UNIDAD.requiere_revision",
  criterio_alcanzado: "CLASE.UNIDAD.criterio_alcanzado",
};

/**
 * El relleno de un tramo. ⚠️ **Forma, no color por estado** (ADR-085): el color
 * es el de la materia —identidad— y lo que cambia es relleno, trama o contorno.
 */
function rellenoDeTramo(estado: UnidadesDeClase["unidades"][number]["estado"], color: string): React.CSSProperties {
  if (estado === "criterio_alcanzado") return { background: color, border: `1px solid ${color}` };
  if (estado === "sin_evidencia") return { background: "var(--muted)", border: "1px solid var(--border)" };
  return {
    background: `repeating-linear-gradient(135deg, ${color} 0 2px, transparent 2px 6px)`,
    border: `1px solid ${color}`,
  };
}

export function PanelDeUnidades({ unidades: u, cursadaId }: { unidades: UnidadesDeClase; cursadaId: string }) {
  const color = colorDeMateria(cursadaId);
  const esta = u.unidades.filter((x) => x.posicion === "ESTA_CLASE");
  const conMinutos = u.unidades.every((x) => x.minutos !== null && x.minutos > 0);
  const nombreDe = (x: { numero: number | null; nombre: string }) =>
    x.numero !== null ? llenarCopy("CLASE.UNIDAD_N", { n: x.numero }) : x.nombre;

  return (
    <section aria-labelledby="clase-unidades" style={tarjeta} data-panel="unidades" data-fuente={u.fuente}>
      <CabeceraDePanel id="clase-unidades" titulo={t("CLASE.UNIDADES")} />

      <div className="mt-3" data-esta-clase>
        <p style={{ margin: 0, fontSize: "var(--text-label)", fontWeight: 500, color: "var(--muted-foreground)" }}>
          {t("CLASE.ESTA_CLASE")}
        </p>
        <p style={{ fontSize: "var(--text-title-sm)", fontWeight: 600, lineHeight: 1.3 }}>
          {esta.map((x) => `${nombreDe(x)} · ${x.nombre}`).join(" — ")}
        </p>
        <p style={meta}>{t(u.fuente === "DICTADA" ? "CLASE.UNIDAD_DICTADA" : "CLASE.UNIDAD_ESTIMADA")}</p>
      </div>

      <p
        data-como-venis={u.faltan.length === 0 ? "AL_DIA" : "FALTAN"}
        style={{ marginTop: 12, fontSize: "var(--text-body)", fontWeight: 600 }}
      >
        {u.faltan.length === 0
          ? t("CLASE.AL_DIA")
          : llenarCopy(u.faltan.length === 1 ? "CLASE.TE_FALTAN_UNA" : "CLASE.TE_FALTAN", {
              lista: listaDeUnidades(u.faltan),
            })}
      </p>

      {/* El Gantt de contenidos: un tramo por unidad, en el orden dictado. */}
      <div className="mt-3" aria-hidden data-gantt-de-unidades>
        <div className="flex" style={{ gap: 3, height: 14 }}>
          {u.unidades.map((x) => (
            <span
              key={x.id}
              data-tramo={x.estado}
              style={{
                flex: conMinutos ? (x.minutos as number) : 1,
                minWidth: 6,
                borderRadius: 3,
                ...rellenoDeTramo(x.estado, color),
                outline: x.posicion === "ESTA_CLASE" ? "2px solid var(--foreground)" : undefined,
                outlineOffset: 1,
              }}
            />
          ))}
        </div>
        <div className="flex" style={{ gap: 3, marginTop: 4 }}>
          {u.unidades.map((x) => (
            <span
              key={x.id}
              style={{
                flex: conMinutos ? (x.minutos as number) : 1,
                minWidth: 6,
                textAlign: "center",
                ...meta,
                ...tabular,
                fontWeight: x.posicion === "ESTA_CLASE" ? 700 : 400,
                color: x.posicion === "ESTA_CLASE" ? "var(--foreground)" : "var(--muted-foreground)",
                overflow: "hidden",
              }}
            >
              {x.numero ?? "·"}
            </span>
          ))}
        </div>
      </div>

      <ol className="mt-3 flex flex-col" data-unidades>
        {u.unidades.map((x) => (
          <li
            key={x.id}
            data-unidad={x.posicion}
            className="hairline-b flex items-center gap-2 py-1.5"
            style={{ fontSize: "var(--text-label)" }}
          >
            <span
              aria-hidden
              style={{ width: 10, height: 10, borderRadius: 3, flexShrink: 0, ...rellenoDeTramo(x.estado, color) }}
            />
            <span style={{ ...meta, ...tabular, width: 22, flexShrink: 0 }}>{x.numero ?? ""}</span>
            <span
              className="min-w-0 flex-1 truncate"
              style={{ fontWeight: x.posicion === "ESTA_CLASE" ? 600 : 400 }}
            >
              {x.nombre}
            </span>
            {x.posicion === "ESTA_CLASE" ? (
              <span
                style={{
                  fontSize: "var(--text-meta)",
                  fontWeight: 600,
                  border: "1px solid var(--foreground)",
                  borderRadius: "var(--radius-pildora)",
                  padding: "0 8px",
                  whiteSpace: "nowrap",
                }}
              >
                {t("CLASE.ESTA_CLASE")}
              </span>
            ) : (
              <span style={{ ...meta, whiteSpace: "nowrap" }}>{t(COPY_DE_ESTADO[x.estado])}</span>
            )}
          </li>
        ))}
      </ol>
      <div style={{ marginTop: 8 }}>
        <ReglaDeNegocio>{t("CLASE.UNIDADES_REGLA")}</ReglaDeNegocio>
      </div>
    </section>
  );
}
