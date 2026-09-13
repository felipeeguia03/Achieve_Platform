"use client";

/**
 * ACHIEVE — **Modo Clase** · [ADR-098](../../docs/decisions.md#adr-098).
 *
 * *"Cuaderno + marcas"*, no un tablero. Durante la clase la pantalla tiene que
 * **quitar carga, no agregarla**: pocos controles, grandes, quietos, y cada
 * marca en un toque. Recibe props y callbacks; no pide nada a la red.
 *
 * ## Lo que esta pantalla no hace, y cada ausencia es la decisión
 *
 * - **No graba.** No hay micrófono ni botón de grabar: el audio está fuera de
 *   ADR-098 hasta que ADR-006 lo permita.
 * - **No pregunta cómo te fue.** El checkpoint espera a la psicopedagoga.
 * - **No anima nada.** El reloj cambia un número por segundo; no hay punto que
 *   late ni barra que se llena (principio de atención).
 * - **No afirma de qué trató la clase.** La unidad es la de la **última clase
 *   dada**, dicho así (ADR-094 §2).
 */

import { useEffect, useState } from "react";
import { Bookmark, CircleHelp, ClipboardList, Star, type LucideIcon } from "lucide-react";

import { CTAPrincipal, Eyebrow, MarcaDeMateria, ReglaDeNegocio, TituloDePanel } from "./design-system";
import { llenarCopy, t, textoDeDuracion, type CopyId } from "@/lib/content/es-AR";
import { reloj, segundosEntre, TIPOS_DE_MARCA, type TipoDeMarca } from "@/lib/domain/sesion-de-clase";
import { nombreDeObjeto } from "@/lib/domain/nombre-de-objeto";
import type { ClaseProps } from "@/lib/domain/view-models";

export type EstadoDeApuntes = "GUARDADO" | "GUARDANDO" | "ERROR";

/** Una marca que el estudiante tocó y el servidor todavía no confirmó. */
export interface MarcaPendiente {
  clave: string;
  tipo: TipoDeMarca;
  /** Segundos **mostrados**: el valor que se guarda lo pone el servidor. */
  segundos: number;
  estado: "ENVIANDO" | "ERROR";
}

export interface ModoClaseProps {
  clase: ClaseProps;
  apuntes: string;
  estadoDeApuntes: EstadoDeApuntes;
  onApuntes: (texto: string) => void;
  pendientes: readonly MarcaPendiente[];
  onMarcar: (tipo: TipoDeMarca) => void;
  onReintentarMarca: (clave: string) => void;
  onDetalle: (marcaId: string, texto: string) => void;
  onFinalizar: () => void;
  finalizando: boolean;
  errorAlFinalizar: boolean;
  /** `true` sólo justo después de finalizar: el acuse no se repite al volver. */
  recienGuardada: boolean;
}

const COPY_DE_MARCA: Record<TipoDeMarca, CopyId> = {
  QUESTION: "CLASE.MARCA.QUESTION",
  IMPORTANT: "CLASE.MARCA.IMPORTANT",
  ASSESSMENT: "CLASE.MARCA.ASSESSMENT",
  REVIEW: "CLASE.MARCA.REVIEW",
};

/**
 * El ícono es **representación**, y va `aria-hidden`: el nombre lo dice la
 * palabra (`P-06`, nada sólo por forma o color). El dominio guarda el tipo.
 */
const ICONO: Record<TipoDeMarca, LucideIcon> = {
  QUESTION: CircleHelp,
  IMPORTANT: Star,
  ASSESSMENT: ClipboardList,
  REVIEW: Bookmark,
};

const tarjeta = {
  border: "1px solid var(--border)",
  borderRadius: "var(--radius)",
  background: "var(--card)",
  padding: 16,
} as const;
const meta = { fontSize: "var(--text-meta)", color: "var(--muted-foreground)" } as const;

/** El reloj de la clase. **Muestra; no escribe nada** (AGENTS.md §2.3). */
function useSegundosDesde(inicio: string, activo: boolean): number {
  const [ahora, setAhora] = useState(() => Date.now());
  useEffect(() => {
    if (!activo) return;
    const id = window.setInterval(() => setAhora(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [activo]);
  return segundosEntre(inicio, new Date(ahora).toISOString());
}

export function ModoClase(p: ModoClaseProps) {
  const { clase } = p;
  const activa = clase.estado === "ACTIVE";
  const segundos = useSegundosDesde(clase.iniciadaEn, activa);

  const lineaDeHorario = [
    clase.horario ? `${clase.horario.desde}–${clase.horario.hasta}` : t("CLASE.MANUAL"),
    clase.aula ? llenarCopy("CLASE.AULA", { aula: clase.aula }) : null,
    clase.comision ? llenarCopy("CLASE.COMISION", { comision: clase.comision }) : null,
    clase.docente,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <div className="flex flex-col gap-4" data-modo-clase data-estado={clase.estado}>
      <TituloDePanel
        eyebrow={
          <span className="inline-flex items-center" style={{ gap: 8 }}>
            <MarcaDeMateria cursadaId={clase.cursadaId} />
            {nombreDeObjeto(clase.materia)}
          </span>
        }
        titulo={activa ? t("CLASE.TITULO_ACTIVA") : `${t("CLASE.TITULO_TERMINADA")} · ${clase.fecha}`}
        meta={lineaDeHorario}
      />

      {/* Lo que se sabe de la cursada, y dicho como lo que es. Cada línea, si falta, no está. */}
      {(clase.unidadDeUltimaClase !== null || clase.horarioEstimado) && (
        <div className="flex flex-col gap-1">
          {clase.unidadDeUltimaClase !== null && (
            <p style={meta}>{llenarCopy("CLASE.UNIDAD", { n: clase.unidadDeUltimaClase })}</p>
          )}
          {clase.horarioEstimado && <p style={meta}>{t("CLASE.HORARIO_ESTIMADO")}</p>}
        </div>
      )}

      {p.recienGuardada && (
        <div role="status" data-clase-guardada style={{ ...tarjeta, borderColor: "var(--foreground)" }}>
          <p style={{ fontWeight: 600 }}>{t("CLASE.GUARDADA")}</p>
          <ReglaDeNegocio>{t("CLASE.FINALIZAR_REGLA")}</ReglaDeNegocio>
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(280px,1fr)]">
        {/*
          En móvil las marcas van **primero**: son lo que se toca durante la
          clase. En desktop, a la derecha, junto al reloj.
        */}
        <div className="order-2 flex flex-col gap-4 lg:order-1">
          <section aria-labelledby="clase-apuntes" style={tarjeta}>
            <div className="flex items-baseline justify-between gap-2">
              <h2 id="clase-apuntes" className="eyebrow" style={{ margin: 0 }}>
                {t("CLASE.APUNTES")}
              </h2>
              <span aria-live="polite" data-estado-apuntes={p.estadoDeApuntes} style={meta}>
                {p.estadoDeApuntes === "GUARDANDO"
                  ? t("CLASE.APUNTES_GUARDANDO")
                  : p.estadoDeApuntes === "ERROR"
                    ? t("CLASE.APUNTES_ERROR")
                    : p.apuntes
                      ? t("CLASE.APUNTES_GUARDADOS")
                      : ""}
              </span>
            </div>
            <textarea
              aria-labelledby="clase-apuntes"
              value={p.apuntes}
              onChange={(e) => p.onApuntes(e.target.value)}
              placeholder={t("CLASE.APUNTES_PLACEHOLDER")}
              rows={activa ? 16 : 10}
              style={{
                width: "100%",
                marginTop: 10,
                resize: "vertical",
                border: "1px solid var(--border)",
                borderRadius: "var(--radius-control)",
                background: "var(--background)",
                color: "var(--foreground)",
                padding: 12,
                fontSize: "var(--text-body)",
                lineHeight: 1.6,
              }}
            />
          </section>

          {!activa && <Resumen clase={clase} />}
        </div>

        <div className="order-1 flex flex-col gap-4 lg:order-2">
          {activa && (
            <section aria-labelledby="clase-marcar" style={tarjeta}>
              <div className="flex items-baseline justify-between gap-2">
                <h2 id="clase-marcar" className="eyebrow" style={{ margin: 0 }}>
                  {t("CLASE.MARCAR")}
                </h2>
                <span style={meta}>
                  <span className="sr-only">{t("CLASE.RELOJ")}: </span>
                  <span data-reloj style={{ fontVariantNumeric: "tabular-nums" }}>
                    {reloj(segundos)}
                  </span>
                </span>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2">
                {TIPOS_DE_MARCA.map((tipo) => {
                  const Icono = ICONO[tipo];
                  return (
                  <button
                    key={tipo}
                    type="button"
                    data-marca={tipo}
                    onClick={() => p.onMarcar(tipo)}
                    className="focus-visible:outline-2 focus-visible:outline-offset-2"
                    style={{
                      minHeight: 56,
                      border: "1px solid var(--border)",
                      borderRadius: "var(--radius-control)",
                      background: "var(--background)",
                      color: "var(--foreground)",
                      fontSize: "var(--text-body)",
                      fontWeight: 600,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 8,
                    }}
                  >
                    <Icono aria-hidden size={18} strokeWidth={1.75} />
                    {t(COPY_DE_MARCA[tipo])}
                  </button>
                  );
                })}
              </div>
              <div style={{ marginTop: 8 }}>
                <ReglaDeNegocio>{t("CLASE.MARCAR_REGLA")}</ReglaDeNegocio>
              </div>
            </section>
          )}

          <Momentos {...p} />

          {activa && (
            <div className="flex flex-col gap-2">
              {/* `CTA-023`. Una sola principal en la pantalla (`I-06`). */}
              <CTAPrincipal onClick={p.onFinalizar} disabled={p.finalizando}>
                {t("CLASE.FINALIZAR")}
              </CTAPrincipal>
              {p.errorAlFinalizar && (
                <p role="alert" style={{ ...meta, color: "var(--foreground)" }}>
                  {t("CLASE.FINALIZAR_ERROR")}
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Momentos(p: ModoClaseProps) {
  const { clase, pendientes } = p;
  const vacio = clase.marcas.length === 0 && pendientes.length === 0;

  return (
    <section aria-labelledby="clase-momentos" style={tarjeta}>
      <h2 id="clase-momentos" className="eyebrow" style={{ margin: 0 }}>
        {t("CLASE.MOMENTOS")}
      </h2>
      {/* El acuse de cada toque, para quien no mira la pantalla. */}
      <p aria-live="polite" className="sr-only">
        {pendientes.length > 0 ? t(COPY_DE_MARCA[pendientes[pendientes.length - 1].tipo]) : ""}
      </p>
      {vacio ? (
        <p style={{ ...meta, marginTop: 8 }}>{t("CLASE.SIN_MOMENTOS")}</p>
      ) : (
        <ol className="mt-2 flex flex-col" data-momentos>
          {clase.marcas.map((m) => (
            <Momento key={m.id} marca={m} onDetalle={p.onDetalle} />
          ))}
          {pendientes.map((m) => (
            <li key={m.clave} data-pendiente={m.estado} className="hairline-b flex items-center gap-3 py-2">
              <span style={{ ...meta, fontVariantNumeric: "tabular-nums" }}>{reloj(m.segundos)}</span>
              <span style={{ fontSize: "var(--text-label)", fontWeight: 500 }}>{t(COPY_DE_MARCA[m.tipo])}</span>
              {m.estado === "ENVIANDO" ? (
                <span style={meta}>{t("CLASE.MARCA_ENVIANDO")}</span>
              ) : (
                <button
                  type="button"
                  onClick={() => p.onReintentarMarca(m.clave)}
                  style={{ ...meta, color: "var(--foreground)", textDecoration: "underline" }}
                >
                  {t("CLASE.MARCA_ERROR")}
                </button>
              )}
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}

function Momento({
  marca,
  onDetalle,
}: {
  marca: ClaseProps["marcas"][number];
  onDetalle: (id: string, texto: string) => void;
}) {
  const [editando, setEditando] = useState(false);
  const [texto, setTexto] = useState(marca.texto ?? "");

  return (
    <li className="hairline-b flex flex-col gap-1 py-2" data-momento={marca.tipo}>
      <div className="flex items-center gap-3">
        <span style={{ ...meta, fontVariantNumeric: "tabular-nums" }}>{reloj(marca.segundos)}</span>
        <span style={{ fontSize: "var(--text-label)", fontWeight: 500 }}>{t(COPY_DE_MARCA[marca.tipo])}</span>
        {!editando && (
          <button
            type="button"
            onClick={() => setEditando(true)}
            style={{ ...meta, marginLeft: "auto", textDecoration: "underline" }}
          >
            {t("CLASE.DETALLE")}
          </button>
        )}
      </div>
      {marca.texto && !editando && <p style={{ fontSize: "var(--text-label)" }}>{marca.texto}</p>}
      {editando && (
        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            onDetalle(marca.id, texto);
            setEditando(false);
          }}
        >
          <input
            aria-label={`${t("CLASE.DETALLE")} · ${t(COPY_DE_MARCA[marca.tipo])} ${reloj(marca.segundos)}`}
            value={texto}
            maxLength={1000}
            autoFocus
            onChange={(e) => setTexto(e.target.value)}
            placeholder={t("CLASE.DETALLE_PLACEHOLDER")}
            style={{
              flex: 1,
              minWidth: 0,
              border: "1px solid var(--border)",
              borderRadius: "var(--radius-control)",
              background: "var(--background)",
              color: "var(--foreground)",
              padding: "6px 10px",
              fontSize: "var(--text-label)",
            }}
          />
          <button type="submit" style={{ ...meta, color: "var(--foreground)", fontWeight: 600 }}>
            {t("CLASE.DETALLE_GUARDAR")}
          </button>
        </form>
      )}
    </li>
  );
}

/** Lo **derivado** de una clase terminada: duración y cuántas marcas de cada tipo. */
function Resumen({ clase }: { clase: ClaseProps }) {
  return (
    <section aria-label={t("CLASE.DURACION")} style={tarjeta} data-resumen>
      <Eyebrow>{t("CLASE.DURACION")}</Eyebrow>
      {clase.duracionMinutos !== null && (
        <p style={{ fontSize: "var(--text-title-sm)", fontWeight: 600, margin: "6px 0" }}>
          {textoDeDuracion(clase.duracionMinutos)}
        </p>
      )}
      <ul className="flex flex-wrap gap-x-4 gap-y-1">
        {TIPOS_DE_MARCA.map((tipo) => (
          <li key={tipo} style={{ fontSize: "var(--text-label)" }}>
            <span style={{ fontVariantNumeric: "tabular-nums", fontWeight: 600 }}>{clase.resumen[tipo]}</span>{" "}
            <span style={{ color: "var(--muted-foreground)" }}>{t(COPY_DE_MARCA[tipo])}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
