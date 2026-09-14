"use client";

/**
 * **Modo Focus** — las pantallas · [ADR-104](../../docs/decisions.md#adr-104).
 *
 * ## Las reglas que estas pantallas hacen cumplir
 *
 * 1. **Muestran; no escriben nada.** Los relojes reciben segundos ya calculados
 *    desde instantes del servidor. Ninguna pantalla hace red (frontera de la
 *    Fase 0): la superficie llama a la API.
 * 2. **La concentración ocupa toda la ventana, en oscuro** (§20): la materia
 *    chica, la acción, el reloj, *Pausar*, *Terminé*, el anotador y el sonido.
 *    Nada más: sin navegación, otras materias, estadísticas ni avisos.
 * 3. **Descanso, pausa y cierre son claros** y viven dentro del shell.
 * 4. **Una sola CTA principal por estado** (`I-06`).
 * 5. **«Tiempo registrado en Focus»**, nunca «tiempo efectivo de estudio»; y
 *    **«avance»**, nunca «nota».
 * 6. **Omitir, no inventar.** Sin materia, acción o unidad, la línea no está.
 */

import { useState } from "react";
import { Pause, Volume2, VolumeX } from "lucide-react";

import { llenarCopy, t, type CopyId } from "@/lib/content/es-AR";
import {
  CONFIGURACION_DE_PRESET,
  LIMITES_POMODORO,
  PRESETS,
  duracionLegible,
  relojDeFoco,
  validarPomodoro,
  type ConfiguracionPomodoro,
  type PresetOPersonalizado,
  type Sonido,
} from "@/lib/domain/sesion-de-focus";
import { nombreDeObjeto } from "@/lib/domain/nombre-de-objeto";
import type { FocusIniciable, FocusProps } from "@/lib/domain/view-models";
import { CTAPrincipal, EstadoChip, MarcaDeMateria, ReglaDeNegocio, TituloDePanel } from "./design-system";
import { CTAEsqueleto, Parrafo, PantallaCargando, Renglon } from "./esqueleto";
import { BotonSecundario, estiloPanel } from "./gimnasia/comun";

// ── Piezas ───────────────────────────────────────────────────────────────────

const meta: React.CSSProperties = { fontSize: "var(--text-label)", color: "var(--muted-foreground)" };

/** El reloj grande. `aria-live` apagado: un lector no puede leer un número por segundo. */
function RelojGrande({ segundos, etiqueta }: { segundos: number; etiqueta: string }) {
  return (
    <p
      data-reloj-de-focus
      aria-label={`${etiqueta}: ${relojDeFoco(segundos)}`}
      style={{
        margin: 0,
        fontSize: "clamp(4rem, 13vw, 8rem)",
        lineHeight: 1,
        fontWeight: 300,
        letterSpacing: "-0.03em",
        fontVariantNumeric: "tabular-nums",
      }}
    >
      {relojDeFoco(segundos)}
    </p>
  );
}

function Contexto({ materia, cursadaId, accion, unidad }: Pick<FocusProps, "materia" | "cursadaId" | "accion" | "unidad">) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4, minWidth: 0 }}>
      {materia && (
        <p style={{ ...meta, margin: 0 }}>
          {/* Texto que fluye, no columnas: a 360 px la unidad baja de renglón entera. */}
          <span style={{ display: "inline-flex", verticalAlign: "middle", marginRight: 6 }}>
            <MarcaDeMateria cursadaId={cursadaId} />
          </span>
          {nombreDeObjeto(materia)}
          {unidad && ` · ${unidad}`}
        </p>
      )}
      {accion && <p style={{ margin: 0, fontSize: "var(--text-title-sm)", fontWeight: 600, lineHeight: 1.3 }}>{accion}</p>}
    </div>
  );
}

export type EstadoDeGuardado = "GUARDADO" | "GUARDANDO" | "ERROR" | null;

/** *Para después*: privado. Se guarda solo; el estado se dice con palabras. */
export function Anotador({
  texto,
  guardado,
  onCambiar,
  filas = 6,
}: {
  texto: string;
  guardado: EstadoDeGuardado;
  onCambiar: (texto: string) => void;
  filas?: number;
}) {
  return (
    <section aria-labelledby="focus-anotador" style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8 }}>
        <label id="focus-anotador" htmlFor="focus-anotador-texto" style={{ fontSize: "var(--text-body)", fontWeight: 600 }}>
          {t("FOCUS.PARA_DESPUES")}
        </label>
        <span aria-live="polite" style={meta} data-guardado={guardado ?? undefined}>
          {guardado === "GUARDANDO" ? t("FOCUS.GUARDANDO") : guardado === "GUARDADO" ? t("FOCUS.GUARDADO") : guardado === "ERROR" ? t("FOCUS.NO_SE_GUARDO") : ""}
        </span>
      </div>
      <p style={{ ...meta, margin: 0 }}>{t("FOCUS.PARA_DESPUES_AYUDA")}</p>
      <textarea
        id="focus-anotador-texto"
        value={texto}
        rows={filas}
        maxLength={20_000}
        onChange={(e) => onCambiar(e.target.value)}
        style={{
          width: "100%",
          resize: "vertical",
          padding: "10px 12px",
          font: "inherit",
          fontSize: "var(--text-body)",
          color: "var(--foreground)",
          background: "var(--card)",
          border: "1px solid var(--border)",
        }}
      />
    </section>
  );
}

const COPY_DE_SONIDO: Record<Sonido, CopyId> = {
  NINGUNO: "FOCUS.SONIDO.NINGUNO",
  MARRON: "FOCUS.SONIDO.MARRON",
  ROSA: "FOCUS.SONIDO.ROSA",
};

export function ControlDeSonido({
  sonido,
  volumen,
  silenciado,
  onSonido,
  onVolumen,
  onSilenciar,
  onProbar,
}: {
  sonido: Sonido;
  volumen: number;
  silenciado: boolean;
  onSonido: (s: Sonido) => void;
  onVolumen: (v: number) => void;
  onSilenciar: () => void;
  onProbar?: () => void;
}) {
  return (
    <div role="group" aria-label={t("FOCUS.SONIDO")} style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 10 }}>
      <label style={{ ...meta, display: "flex", alignItems: "center", gap: 6 }}>
        {t("FOCUS.SONIDO")}
        <select
          value={sonido}
          onChange={(e) => onSonido(e.target.value as Sonido)}
          style={{ font: "inherit", fontSize: "var(--text-label)", color: "var(--foreground)", background: "var(--card)", border: "1px solid var(--border)", padding: "4px 8px" }}
        >
          {(Object.keys(COPY_DE_SONIDO) as Sonido[]).map((s) => (
            <option key={s} value={s}>
              {t(COPY_DE_SONIDO[s])}
            </option>
          ))}
        </select>
      </label>
      {sonido !== "NINGUNO" && (
        <>
          <label style={{ ...meta, display: "flex", alignItems: "center", gap: 6 }}>
            {t("FOCUS.VOLUMEN")}
            <input type="range" min={0} max={100} value={volumen} onChange={(e) => onVolumen(Number(e.target.value))} />
          </label>
          <button
            type="button"
            onClick={onSilenciar}
            aria-pressed={silenciado}
            aria-label={silenciado ? t("FOCUS.QUITAR_SILENCIO") : t("FOCUS.SILENCIAR")}
            title={silenciado ? t("FOCUS.QUITAR_SILENCIO") : t("FOCUS.SILENCIAR")}
            style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", minWidth: 36, minHeight: 36, border: "1px solid var(--border)", background: "var(--card)", color: "var(--foreground)" }}
          >
            {silenciado ? <VolumeX size={16} aria-hidden /> : <Volume2 size={16} aria-hidden />}
          </button>
          {onProbar && (
            <button type="button" onClick={onProbar} style={{ ...meta, background: "transparent", border: "none", textDecoration: "underline" }}>
              {t("FOCUS.PROBAR")}
            </button>
          )}
        </>
      )}
    </div>
  );
}

// ── Estados ──────────────────────────────────────────────────────────────────

export function ModoFocusEsqueleto() {
  return (
    <PantallaCargando>
      <TituloDePanel titulo={t("FOCUS.TITULO")} subcopy={t("FOCUS.SUBCOPY")} />
      <div aria-hidden style={{ ...estiloPanel, display: "flex", flexDirection: "column", gap: 10, maxWidth: 640 }}>
        <Renglon cuerpo="label" ancho={160} />
        <Renglon cuerpo="title-sm" ancho="60%" />
        <Parrafo renglones={2} />
        <CTAEsqueleto />
      </div>
    </PantallaCargando>
  );
}

/** Sin sesión abierta: sobre qué se puede empezar, o por qué no hay nada. */
export function FocusSinSesion({
  iniciable,
  aviso,
  ocupado,
  onEmpezar,
  onTerminar,
}: {
  iniciable: FocusIniciable | null;
  aviso: string | null;
  ocupado: boolean;
  onEmpezar: () => void;
  onTerminar: () => void;
}) {
  return (
    <div data-focus-sin-sesion>
      <TituloDePanel titulo={t("FOCUS.TITULO")} subcopy={t("FOCUS.SUBCOPY")} />
      {aviso && <p role="alert" style={{ margin: "0 0 16px", fontSize: "var(--text-body)", fontWeight: 500 }}>{aviso}</p>}
      {iniciable ? (
        <section style={{ ...estiloPanel, display: "flex", flexDirection: "column", gap: 12, maxWidth: 640 }}>
          {iniciable.esHora && (
            <span>
              <EstadoChip tone="urgencia">{t("FOCUS.ES_HORA")}</EstadoChip>
            </span>
          )}
          <Contexto materia={iniciable.materia} cursadaId={iniciable.cursadaId} accion={iniciable.accion} unidad={iniciable.unidad} />
          <p style={{ ...meta, margin: 0 }}>{llenarCopy("FOCUS.TE_COMPROMETISTE", { hora: iniciable.hora, minutos: iniciable.minutos })}</p>
          <ReglaDeNegocio>{t("FOCUS.EMPIEZA_LIBRE")}</ReglaDeNegocio>
          <CTAPrincipal onClick={onEmpezar} disabled={ocupado}>
            {iniciable.yaEmpezado ? t("FOCUS.CONTINUAR") : t("FOCUS.EMPEZAR")}
          </CTAPrincipal>
          <BotonSecundario onClick={onTerminar} disabled={ocupado}>
            {t("FOCUS.TERMINE")}
          </BotonSecundario>
        </section>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <p style={{ fontSize: "var(--text-body)", fontWeight: 500, margin: 0 }}>{t("FOCUS.SIN_COMPROMISO")}</p>
          <ReglaDeNegocio>{t("FOCUS.SIN_COMPROMISO_REGLA")}</ReglaDeNegocio>
        </div>
      )}
    </div>
  );
}

export interface PropsDeConcentracion {
  sesion: FocusProps;
  /**
   * Adentro de una ventana de la barra la concentración ocupa **la ventana**, no
   * la pantalla: un `position: fixed` bajo un marco que se arrastra se descoloca.
   */
  enVentana?: boolean;
  segundos: number;
  /** `true` ⇒ el reloj cuenta hacia abajo: un bloque Pomodoro. */
  regresivo: boolean;
  terminaA: string | null;
  anotador: string;
  guardado: EstadoDeGuardado;
  sonido: Sonido;
  volumen: number;
  silenciado: boolean;
  ocupado: boolean;
  onPausar: () => void;
  onTerminar: () => void;
  onAnotar: (texto: string) => void;
  onSonido: (s: Sonido) => void;
  onVolumen: (v: number) => void;
  onSilenciar: () => void;
}

/**
 * **La concentración** — toda la ventana, en oscuro (§20).
 *
 * `data-foco="oscuro"` toma los tokens del modo noche de `app/globals.css`: **no
 * hay colores propios**. Y no hay controles de ventana: salir de acá pausa.
 */
export function FocusConcentracion(p: PropsDeConcentracion) {
  const { sesion } = p;
  const indicador =
    sesion.modo === "POMODORO" && sesion.tramo?.posicion && sesion.tramo.deBloques
      ? llenarCopy("FOCUS.FOCO_DE", { n: sesion.tramo.posicion, total: sesion.tramo.deBloques })
      : t("FOCUS.LIBRE");

  return (
    <div
      data-foco="oscuro"
      data-fase="CONCENTRACION"
      role="region"
      aria-label={t("FOCUS.TITULO")}
      style={{
        ...(p.enVentana ? { position: "relative" as const, minHeight: "100%" } : { position: "fixed" as const, inset: 0, zIndex: 90 }),
        background: "var(--background)",
        color: "var(--foreground)",
        overflowY: "auto",
        paddingInline: 16,
      }}
    >
      <div style={{ maxWidth: 1080, margin: "0 auto", minHeight: "100%", display: "grid", gap: 32, gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 320px), 1fr))", alignContent: "center", paddingBlock: 32 }}>
        <main style={{ display: "flex", flexDirection: "column", gap: 24, justifyContent: "center", minWidth: 0 }}>
          <Contexto materia={sesion.materia} cursadaId={sesion.cursadaId} accion={sesion.accion} unidad={sesion.unidad} />
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <RelojGrande segundos={p.segundos} etiqueta={p.regresivo ? indicador : t("FOCUS.REGISTRADO")} />
            <p style={{ ...meta, margin: 0 }}>
              {indicador}
              {p.terminaA && ` · ${llenarCopy("FOCUS.TERMINA_A", { hora: p.terminaA })}`}
            </p>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center" }}>
            <button
              type="button"
              onClick={p.onPausar}
              disabled={p.ocupado}
              data-cta-primaria
              autoFocus
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                minHeight: 44,
                padding: "10px 22px",
                border: "none",
                background: "var(--primary)",
                color: "var(--primary-foreground)",
                fontSize: "var(--text-body)",
                fontWeight: 600,
              }}
            >
              <Pause size={16} aria-hidden />
              {t("FOCUS.PAUSAR")}
            </button>
            <BotonSecundario onClick={p.onTerminar} disabled={p.ocupado}>
              {t("FOCUS.TERMINE")}
            </BotonSecundario>
          </div>
          <p style={{ ...meta, margin: 0 }}>{t("FOCUS.ESC_PAUSA")}</p>
          <ControlDeSonido
            sonido={p.sonido}
            volumen={p.volumen}
            silenciado={p.silenciado}
            onSonido={p.onSonido}
            onVolumen={p.onVolumen}
            onSilenciar={p.onSilenciar}
          />
        </main>
        <aside style={{ ...estiloPanel, alignSelf: "center" }}>
          <Anotador texto={p.anotador} guardado={p.guardado} onCambiar={p.onAnotar} filas={10} />
        </aside>
      </div>
    </div>
  );
}

/** El encabezado claro de descanso, pausa y lista: el título y la acción. */
function EncabezadoClaro({ titulo, sesion }: { titulo: string; sesion: FocusProps }) {
  return (
    <>
      <TituloDePanel titulo={titulo} />
      <div style={{ marginBottom: 20 }}>
        <Contexto materia={sesion.materia} cursadaId={sesion.cursadaId} accion={sesion.accion} unidad={sesion.unidad} />
      </div>
    </>
  );
}

export function FocusDescanso({
  sesion,
  segundos,
  ocupado,
  onVolverAntes,
  onTerminarSesion,
}: {
  sesion: FocusProps;
  segundos: number;
  ocupado: boolean;
  onVolverAntes: () => void;
  onTerminarSesion: () => void;
}) {
  const largo = sesion.tramo?.descanso === "LONG";
  const ciclo = sesion.pomodoro?.bloquesAntesDelLargo ?? null;
  // El bloque que viene es el siguiente a los completos, en su ciclo.
  const despues = ciclo ? (sesion.resumen.bloquesCompletos % ciclo) + 1 : null;
  return (
    <div data-fase="DESCANSO" style={{ maxWidth: 640 }}>
      <EncabezadoClaro titulo={t("FOCUS.DESCANSO")} sesion={sesion} />
      <section style={{ ...estiloPanel, display: "flex", flexDirection: "column", gap: 14 }}>
        <p style={{ ...meta, margin: 0 }}>
          {largo ? t("FOCUS.DESCANSO_LARGO") : t("FOCUS.DESCANSO_CORTO")}
          {despues && ciclo && ` · ${llenarCopy("FOCUS.DESPUES", { n: despues, total: ciclo })}`}
        </p>
        <RelojGrande segundos={segundos} etiqueta={t("FOCUS.DESCANSO")} />
        <ReglaDeNegocio>{t("FOCUS.DESCANSO_REGLA")}</ReglaDeNegocio>
        <CTAPrincipal onClick={onVolverAntes} disabled={ocupado}>
          {t("FOCUS.VOLVER_ANTES")}
        </CTAPrincipal>
        <BotonSecundario onClick={onTerminarSesion} disabled={ocupado}>
          {t("FOCUS.TERMINAR_SESION")}
        </BotonSecundario>
      </section>
    </div>
  );
}

/** Acciones de una sesión quieta: pausada o lista. */
function AccionesQuietas({
  sesion,
  ocupado,
  onMinimizar,
  onPomodoro,
  onSalir,
  onTerminar,
}: {
  sesion: FocusProps;
  ocupado: boolean;
  onMinimizar: (() => void) | null;
  onPomodoro: () => void;
  onSalir: () => void;
  onTerminar: () => void;
}) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
      {onMinimizar && <BotonSecundario onClick={onMinimizar}>{t("FOCUS.MINIMIZAR")}</BotonSecundario>}
      {sesion.modo === "FREE" && (
        <BotonSecundario onClick={onPomodoro} disabled={ocupado}>
          {t("FOCUS.PASAR_A_POMODORO")}
        </BotonSecundario>
      )}
      <BotonSecundario onClick={onSalir} disabled={ocupado}>
        {t("FOCUS.SALIR_Y_GUARDAR")}
      </BotonSecundario>
      <BotonSecundario onClick={onTerminar} disabled={ocupado}>
        {t("FOCUS.TERMINE")}
      </BotonSecundario>
    </div>
  );
}

export interface PropsDeQuieta {
  sesion: FocusProps;
  focoSegundos: number;
  ocupado: boolean;
  aviso: string | null;
  anotador: string;
  guardado: EstadoDeGuardado;
  onContinuar: () => void;
  onMinimizar: (() => void) | null;
  onPomodoro: () => void;
  onSalir: () => void;
  onTerminar: () => void;
  onAnotar: (texto: string) => void;
}

export function FocusPausada(p: PropsDeQuieta) {
  return (
    <div data-fase="PAUSADA" style={{ display: "grid", gap: 24, gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 320px), 1fr))" }}>
      <div>
        <EncabezadoClaro titulo={t("FOCUS.PAUSADA")} sesion={p.sesion} />
        {p.aviso && <p role="alert" style={{ margin: "0 0 12px", fontWeight: 500 }}>{p.aviso}</p>}
        <section style={{ ...estiloPanel, display: "flex", flexDirection: "column", gap: 14 }}>
          <p style={{ ...meta, margin: 0 }}>{t("FOCUS.REGISTRADO")}</p>
          <p style={{ margin: 0, fontSize: "var(--text-title-lg)", fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>{relojDeFoco(p.focoSegundos)}</p>
          <ReglaDeNegocio>{t("FOCUS.PAUSADA_REGLA")}</ReglaDeNegocio>
          <CTAPrincipal onClick={p.onContinuar} disabled={p.ocupado}>
            {t("FOCUS.CONTINUAR")}
          </CTAPrincipal>
          <AccionesQuietas sesion={p.sesion} ocupado={p.ocupado} onMinimizar={p.onMinimizar} onPomodoro={p.onPomodoro} onSalir={p.onSalir} onTerminar={p.onTerminar} />
        </section>
      </div>
      <aside style={{ ...estiloPanel, alignSelf: "start" }}>
        <Anotador texto={p.anotador} guardado={p.guardado} onCambiar={p.onAnotar} />
      </aside>
    </div>
  );
}

export function FocusLista(p: PropsDeQuieta) {
  return (
    <div data-fase="LISTA" style={{ display: "grid", gap: 24, gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 320px), 1fr))" }}>
      <div>
        <EncabezadoClaro titulo={t("FOCUS.LISTA")} sesion={p.sesion} />
        {p.aviso && <p role="alert" style={{ margin: "0 0 12px", fontWeight: 500 }}>{p.aviso}</p>}
        <section style={{ ...estiloPanel, display: "flex", flexDirection: "column", gap: 14 }}>
          <p style={{ margin: 0, fontSize: "var(--text-title-sm)", fontWeight: 600 }}>{t("FOCUS.LISTA_PREGUNTA")}</p>
          <p style={{ ...meta, margin: 0 }}>
            {t("FOCUS.REGISTRADO")}: {duracionLegible(p.focoSegundos)}
          </p>
          <ReglaDeNegocio>{t("FOCUS.LISTA_REGLA")}</ReglaDeNegocio>
          <CTAPrincipal onClick={p.onContinuar} disabled={p.ocupado}>
            {t("FOCUS.CONTINUAR_ESTUDIANDO")}
          </CTAPrincipal>
          <AccionesQuietas sesion={p.sesion} ocupado={p.ocupado} onMinimizar={p.onMinimizar} onPomodoro={p.onPomodoro} onSalir={p.onSalir} onTerminar={p.onTerminar} />
        </section>
      </div>
      <aside style={{ ...estiloPanel, alignSelf: "start" }}>
        <Anotador texto={p.anotador} guardado={p.guardado} onCambiar={p.onAnotar} />
      </aside>
    </div>
  );
}

export function FocusRecuperacion({
  sesion,
  ocupado,
  onReanudar,
  onTermineAlCerrar,
  onRevisar,
}: {
  sesion: FocusProps;
  ocupado: boolean;
  onReanudar: () => void;
  onTermineAlCerrar: () => void;
  onRevisar: () => void;
}) {
  return (
    <div data-fase="RECUPERACION" style={{ maxWidth: 640 }}>
      <TituloDePanel
        titulo={t("FOCUS.RECUPERACION")}
        meta={llenarCopy("FOCUS.RECUPERACION_META", { inicio: sesion.empezoA, latido: sesion.ultimoLatidoHora })}
      />
      <section style={{ ...estiloPanel, display: "flex", flexDirection: "column", gap: 14 }}>
        <Contexto materia={sesion.materia} cursadaId={sesion.cursadaId} accion={sesion.accion} unidad={sesion.unidad} />
        <p style={{ ...meta, margin: 0 }}>
          {t("FOCUS.REGISTRADO")}: {duracionLegible(sesion.resumen.focoSegundos)}
        </p>
        <ReglaDeNegocio>{t("FOCUS.RECUPERACION_REGLA")}</ReglaDeNegocio>
        <CTAPrincipal onClick={onReanudar} disabled={ocupado}>
          {t("FOCUS.REANUDAR")}
        </CTAPrincipal>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          <BotonSecundario onClick={onTermineAlCerrar} disabled={ocupado}>
            {t("FOCUS.TERMINE_AL_CERRAR")}
          </BotonSecundario>
          <BotonSecundario onClick={onRevisar} disabled={ocupado}>
            {t("FOCUS.REVISAR")}
          </BotonSecundario>
        </div>
      </section>
    </div>
  );
}

/** *¿Qué avanzaste?* antes de guardar. Opcional: se puede guardar vacío. */
export function FocusCierre({
  sesion,
  terminado,
  ocupado,
  aviso,
  onGuardar,
  onVolver,
}: {
  sesion: FocusProps;
  /** `true` ⇒ *Terminé · Subir evidencia*; `false` ⇒ *Salir y guardar*. */
  terminado: boolean;
  ocupado: boolean;
  aviso: string | null;
  onGuardar: (avance: string) => void;
  onVolver: () => void;
}) {
  const [avance, setAvance] = useState(sesion.avance ?? "");
  return (
    <form
      data-fase="CIERRE"
      style={{ maxWidth: 640 }}
      onSubmit={(e) => {
        e.preventDefault();
        onGuardar(avance);
      }}
    >
      <TituloDePanel titulo={t("FOCUS.CIERRE_TITULO")} subcopy={t("FOCUS.CIERRE_AYUDA")} />
      {aviso && <p role="alert" style={{ margin: "0 0 12px", fontWeight: 500 }}>{aviso}</p>}
      <section style={{ ...estiloPanel, display: "flex", flexDirection: "column", gap: 14 }}>
        <Contexto materia={sesion.materia} cursadaId={sesion.cursadaId} accion={sesion.accion} unidad={sesion.unidad} />
        <label htmlFor="focus-avance" style={{ ...meta }}>
          {t("FOCUS.AVANCE")}
        </label>
        <textarea
          id="focus-avance"
          value={avance}
          rows={4}
          maxLength={2000}
          placeholder={t("FOCUS.CIERRE_PISTA")}
          onChange={(e) => setAvance(e.target.value)}
          style={{ width: "100%", resize: "vertical", padding: "10px 12px", font: "inherit", fontSize: "var(--text-body)", color: "var(--foreground)", background: "var(--card)", border: "1px solid var(--border)" }}
        />
        <ReglaDeNegocio>{t("FOCUS.NO_DICE")}</ReglaDeNegocio>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
          <div style={{ flex: "1 1 240px" }}>
            <CTAPrincipal disabled={ocupado}>{terminado ? t("FOCUS.GUARDAR_E_IR") : t("FOCUS.GUARDAR_SESION")}</CTAPrincipal>
          </div>
          <BotonSecundario onClick={onVolver} disabled={ocupado}>
            {t("FOCUS.VOLVER")}
          </BotonSecundario>
        </div>
      </section>
    </form>
  );
}

/** *«2 completos · 1 parcial»*. Sin parciales, la segunda mitad no se dice. */
function textoDeBloques(completos: number, parciales: number): string {
  const c = completos === 1 ? t("FOCUS.BLOQUE_COMPLETO") : llenarCopy("FOCUS.BLOQUES_COMPLETOS", { n: completos });
  if (parciales === 0) return c;
  return `${c} · ${parciales === 1 ? t("FOCUS.BLOQUE_PARCIAL") : llenarCopy("FOCUS.BLOQUES_PARCIALES", { n: parciales })}`;
}

function Dato({ etiqueta, valor }: { etiqueta: string; valor: React.ReactNode }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", gap: 16, padding: "8px 0", borderTop: "1px solid var(--border)" }}>
      <dt style={meta}>{etiqueta}</dt>
      <dd style={{ margin: 0, fontSize: "var(--text-body)", textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{valor}</dd>
    </div>
  );
}

/** Una sesión cerrada: sus números, el avance y el anotador privado. */
export function FocusFinalizada({
  sesion,
  anotador,
  guardado,
  onAnotar,
  onVerBitacora,
}: {
  sesion: FocusProps;
  anotador: string;
  guardado: EstadoDeGuardado;
  onAnotar: (texto: string) => void;
  onVerBitacora: (() => void) | null;
}) {
  const r = sesion.resumen;
  return (
    <div data-fase="FINALIZADA" style={{ display: "grid", gap: 24, gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 320px), 1fr))" }}>
      <div>
        <TituloDePanel titulo={llenarCopy("FOCUS.DE_FOCUS", { duracion: duracionLegible(r.focoSegundos) })} meta={t("FOCUS.GUARDADA")} />
        <section style={{ ...estiloPanel, display: "flex", flexDirection: "column", gap: 12 }}>
          <Contexto materia={sesion.materia} cursadaId={sesion.cursadaId} accion={sesion.accion} unidad={sesion.unidad} />
          <dl style={{ margin: 0 }}>
            <Dato etiqueta={t("FOCUS.HORARIO")} valor={sesion.terminadaA ? `${sesion.empezoA}–${sesion.terminadaA}` : sesion.empezoA} />
            <Dato etiqueta={t("FOCUS.ACORDADO")} valor={llenarCopy("FOCUS.ACORDADO_VALOR", { hora: sesion.acordado.hora, minutos: sesion.acordado.minutos })} />
            <Dato etiqueta={t("FOCUS.DURACION_TOTAL")} valor={duracionLegible(r.totalSegundos)} />
            <Dato etiqueta={t("FOCUS.REGISTRADO")} valor={duracionLegible(r.focoSegundos)} />
            <Dato etiqueta={t("FOCUS.DESCANSOS")} valor={duracionLegible(r.descansoSegundos)} />
            <Dato etiqueta={t("FOCUS.PAUSADO")} valor={duracionLegible(r.pausadoSegundos)} />
            <Dato etiqueta={t("FOCUS.PAUSAS")} valor={r.pausas} />
            <Dato etiqueta={t("FOCUS.MODO")} valor={sesion.modo === "POMODORO" ? t("FOCUS.POMODORO") : t("FOCUS.LIBRE")} />
            {sesion.modo === "POMODORO" && (
              <Dato etiqueta={t("FOCUS.BLOQUES")} valor={textoDeBloques(r.bloquesCompletos, r.bloquesParciales)} />
            )}
            {sesion.avance && <Dato etiqueta={t("FOCUS.AVANCE")} valor={`«${sesion.avance}»`} />}
          </dl>
          {sesion.demoraMinutos !== null && <p style={{ ...meta, margin: 0 }}>{llenarCopy("FOCUS.DEMORA", { n: sesion.demoraMinutos })}</p>}
          <ReglaDeNegocio>{t("FOCUS.NO_DICE")}</ReglaDeNegocio>
          {onVerBitacora && <BotonSecundario onClick={onVerBitacora}>{t("FOCUS.VER_BITACORA")}</BotonSecundario>}
        </section>
      </div>
      <aside style={{ ...estiloPanel, alignSelf: "start" }}>
        <Anotador texto={anotador} guardado={guardado} onCambiar={onAnotar} />
      </aside>
    </div>
  );
}

// ── Pomodoro ─────────────────────────────────────────────────────────────────

const COPY_DE_PRESET: Record<PresetOPersonalizado, CopyId> = {
  CLASICO: "FOCUS.PRESET.CLASICO",
  INTERMEDIO: "FOCUS.PRESET.INTERMEDIO",
  PROFUNDO: "FOCUS.PRESET.PROFUNDO",
  PERSONALIZADO: "FOCUS.PRESET.PERSONALIZADO",
};

const CAMPOS: ReadonlyArray<readonly [keyof ConfiguracionPomodoro, CopyId]> = [
  ["foco", "FOCUS.CAMPO.FOCO"],
  ["descansoCorto", "FOCUS.CAMPO.CORTO"],
  ["descansoLargo", "FOCUS.CAMPO.LARGO"],
  ["bloquesAntesDelLargo", "FOCUS.CAMPO.BLOQUES"],
];

/** Elegir Pomodoro: tres presets y *Personalizado*. Lo registrado se conserva. */
export function SelectorDePomodoro({
  inicial,
  personalizadoInicial,
  onElegir,
  onCancelar,
  ocupado,
}: {
  inicial: PresetOPersonalizado | null;
  personalizadoInicial: ConfiguracionPomodoro | null;
  onElegir: (c: ConfiguracionPomodoro) => void;
  onCancelar: () => void;
  ocupado?: boolean;
}) {
  const [preset, setPreset] = useState<PresetOPersonalizado>(inicial ?? "CLASICO");
  const [propio, setPropio] = useState<Record<keyof ConfiguracionPomodoro, string>>(() => {
    const base = personalizadoInicial ?? CONFIGURACION_DE_PRESET.CLASICO;
    return { foco: String(base.foco), descansoCorto: String(base.descansoCorto), descansoLargo: String(base.descansoLargo), bloquesAntesDelLargo: String(base.bloquesAntesDelLargo) };
  });
  const elegida =
    preset === "PERSONALIZADO"
      ? validarPomodoro(Object.fromEntries(Object.entries(propio).map(([k, v]) => [k, Number(v)])))
      : CONFIGURACION_DE_PRESET[preset];

  return (
    <section aria-labelledby="focus-pomodoro" style={{ ...estiloPanel, display: "flex", flexDirection: "column", gap: 14 }} data-selector-pomodoro>
      <h2 id="focus-pomodoro" style={{ margin: 0, fontSize: "var(--text-title-sm)", fontWeight: 600 }}>
        {t("FOCUS.PASAR_A_POMODORO")}
      </h2>
      <p style={{ ...meta, margin: 0 }}>{t("FOCUS.POMODORO_AYUDA")}</p>
      <div role="radiogroup" aria-label={t("FOCUS.POMODORO")} style={{ display: "grid", gap: 8, gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 150px), 1fr))" }}>
        {[...PRESETS, "PERSONALIZADO" as const].map((p) => {
          const c = p === "PERSONALIZADO" ? null : CONFIGURACION_DE_PRESET[p];
          const activo = preset === p;
          return (
            <button
              key={p}
              type="button"
              role="radio"
              aria-checked={activo}
              onClick={() => setPreset(p)}
              style={{
                textAlign: "left",
                padding: "10px 12px",
                border: activo ? "1px solid var(--foreground)" : "1px solid var(--border)",
                background: activo ? "var(--muted)" : "var(--card)",
                color: "var(--foreground)",
                display: "flex",
                flexDirection: "column",
                gap: 2,
              }}
            >
              <span style={{ fontSize: "var(--text-body)", fontWeight: 600 }}>{t(COPY_DE_PRESET[p])}</span>
              {c && <span style={meta}>{llenarCopy("FOCUS.PRESET_VALOR", { foco: c.foco, corto: c.descansoCorto, largo: c.descansoLargo })}</span>}
            </button>
          );
        })}
      </div>
      {preset === "PERSONALIZADO" && (
        <div style={{ display: "grid", gap: 10, gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 150px), 1fr))" }}>
          {CAMPOS.map(([campo, copy]) => (
            <label key={campo} style={{ ...meta, display: "flex", flexDirection: "column", gap: 4 }}>
              {t(copy)}
              <input
                type="number"
                inputMode="numeric"
                min={LIMITES_POMODORO[campo].min}
                max={LIMITES_POMODORO[campo].max}
                value={propio[campo]}
                onChange={(e) => setPropio((x) => ({ ...x, [campo]: e.target.value }))}
                style={{ font: "inherit", fontSize: "var(--text-body)", color: "var(--foreground)", background: "var(--card)", border: "1px solid var(--border)", padding: "6px 8px" }}
              />
            </label>
          ))}
        </div>
      )}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
        <div style={{ flex: "1 1 220px" }}>
          <CTAPrincipal onClick={elegida ? () => onElegir(elegida) : undefined} disabled={!elegida || ocupado}>
            {t("FOCUS.EMPEZAR_BLOQUE")}
          </CTAPrincipal>
        </div>
        <BotonSecundario onClick={onCancelar}>{t("FOCUS.VOLVER")}</BotonSecundario>
      </div>
    </section>
  );
}
