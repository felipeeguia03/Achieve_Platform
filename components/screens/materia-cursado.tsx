"use client";

/**
 * ACHIEVE — Materia / Cursado (VI.2). Copy literal §7 (wireframe base).
 * Parametrizada en la Etapa 0.2: JSX y copy preservados, datos por props.
 */

import {
  CTAPrincipal,
  CTASecundaria,
  EstadoChip,
  EstadoGeneral,
  Eyebrow,
  Fila,
  HeroCard,
  ReglaDeNegocio,
  TituloDePanel,
} from "./design-system";
import { SUBCOPY, t } from "@/lib/content/es-AR";
import { ctaPara } from "@/lib/content/hero";
import type { ColumnaFuente, GanttProjection, MateriaProps } from "@/lib/domain/view-models";

/**
 * **El Gantt de preparación** — [ADR-072](../../docs/decisions.md#adr-072).
 *
 * Una barra por materia y una fila por unidad, **en el orden dictado** — el que
 * llega en las props, que la pantalla no reordena.
 *
 * ## Las tres cosas que este componente tiene prohibido hacer
 *
 * 1. **Tratar `barra: null` como `0`.** Sin estimación no hay barra: hay el
 *    texto del pie, que dice por qué. Una barra vacía por falta de datos y una
 *    por falta de trabajo no se ven igual.
 * 2. **Mostrar el número sin la aclaración.** Van juntos o no va ninguno: el
 *    porcentaje solo se lee como una nota, y la nota al pie es lo único que lo
 *    impide.
 * 3. **Decidir nada.** El porcentaje, el orden y el texto llegan calculados. La
 *    pantalla proyecta.
 */
function Gantt({ gantt }: { gantt: GanttProjection }) {
  return (
    <div data-gantt>
      <Eyebrow>{t("MATERIA.GANTT")}</Eyebrow>

      {/*
        ⚠️ **Sin colores de calificación.** Textual de la psicopedagoga: *"evitar
        colores propios de calificación —rojo/verde— para el porcentaje de
        actividad"*. La barra usa el color de texto, que no significa nada.

        Y el rótulo visible es **`actividad registrada`**, no `dominio`, `nivel`,
        `rendimiento` ni `avance de aprendizaje` (ADR-075 §C1).
      */}
      {gantt.barra !== null && (
        <div
          role="img"
          aria-label={gantt.pie}
          style={{
            height: 8,
            borderRadius: 4,
            background: "var(--muted)",
            overflow: "hidden",
            margin: "6px 0",
          }}
        >
          <div
            style={{
              width: `${gantt.barra}%`,
              height: "100%",
              background: "var(--foreground)",
            }}
          />
        </div>
      )}

      <p style={{ fontSize: "var(--text-body)" }}>{gantt.pie}</p>

      {/*
        ⚠️ La nota al pie es del Product Owner y va **textual**. Es lo único que
        separa «26% de las horas» de una nota, y sin ella el número viola
        ADR-058, que cerró la readiness sin porcentaje y sin predicción.
      */}
      {/*
        §C1: *"Entregas que requieren revisión: X, cuando corresponda"*. En cero
        **no se dibuja**: una línea que dice «0 pendientes» inventa una
        tranquilidad que nadie afirmó.
      */}
      {gantt.enRevision > 0 && (
        <p style={{ fontSize: "var(--text-body)" }}>
          {t("MATERIA.GANTT.REVISION")} {gantt.enRevision}
        </p>
      )}

      {gantt.aclaracion && <ReglaDeNegocio>{gantt.aclaracion}</ReglaDeNegocio>}

      <div style={{ marginTop: 10 }}>
        {gantt.unidades.map((u) => (
          <div
            key={u.nombre}
            style={{ display: "flex", alignItems: "baseline", gap: 8, padding: "3px 0" }}
          >
            {/*
              Cuatro estados, no dos. Una entrega insuficiente es **actividad
              registrada** y **no** criterio alcanzado: mostrarlas iguales
              *"puede producir una falsa sensación de preparación"*, y no
              mostrar la insuficiente *"invisibiliza el esfuerzo y castiga dos
              veces"* (ADR-075 §C2).
            */}
            <span aria-hidden style={{ fontSize: "var(--text-meta)" }}>
              {u.estado === "criterio_alcanzado"
                ? "●"
                : u.estado === "requiere_revision"
                  ? "◑"
                  : u.estado === "enviada"
                    ? "◔"
                    : "○"}
            </span>
            <span style={{ fontSize: "var(--text-body)", flex: 1 }}>{u.nombre}</span>
            {/*
              Sin minutos conocidos **no se escribe un cero ni un guion mudo**:
              se omite la cifra. El pie ya dice cuántos temas quedaron sin
              estimar, y repetirlo por fila sería ruido.
            */}
            {u.minutos !== null && (
              <span style={{ fontSize: "var(--text-meta)", color: "var(--muted-foreground)" }}>
                {Math.round(u.minutos / 60)} h
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * `P-08`: la cátedra y el estudiante son dos fuentes en **columnas separadas**.
 * Nunca se fusionan, y ninguna capa eleva la verificación de la otra
 * (AGENTS.md §2.6).
 */
function Columna({ fuente }: { fuente: ColumnaFuente }) {
  return (
    <div className="flex-1">
      <p
        style={{
          fontSize: "var(--text-meta)",
          color: "var(--muted-foreground)",
          textTransform: "uppercase",
          letterSpacing: ".04em",
        }}
      >
        {fuente.titulo}
      </p>
      <p style={{ fontSize: "var(--text-label)", lineHeight: 1.4 }}>
        {fuente.contenido}
        <br />
        <span
          style={{
            color: fuente.tono === "urgencia" ? "var(--urgencia-texto)" : "var(--muted-foreground)",
          }}
        >
          {fuente.detalle}
        </span>
      </p>
    </div>
  );
}

export function MateriaCursado({
  materia,
  examen,
  chip,
  ultimoAvance,
  hero,
  catedraYVos,
  unidades,
  gantt,
  actividadReciente,
  dimensiones,
  aviso,
  capturaDeClase,
  onAvanzar,
  onCapturar,
}: MateriaProps & { onAvanzar?: () => void; onCapturar?: () => void }) {
  return (
    <div
      className="space-y-4"
      style={{ background: "var(--background)", padding: "16px", borderRadius: "var(--radius)" }}
    >
      {/* Sin Assessment registrado la línea de examen desaparece; no se inventa. */}
      <TituloDePanel
        eyebrow={materia}
        titulo={t("MATERIA.TITULO")}
        meta={examen ? `Examen · ${examen}` : undefined}
        subcopy={SUBCOPY.UX02}
      />

      <EstadoGeneral>
        {/* Sin lectura de estado no se dibuja un chip: ver `MateriaProps.chip`. */}
        {chip && <EstadoChip tone={chip.tono}>{chip.texto}</EstadoChip>}
        {ultimoAvance && (
          <span style={{ marginLeft: 8, fontWeight: 400, color: "var(--muted-foreground)" }}>
            {ultimoAvance}
          </span>
        )}
      </EstadoGeneral>

      {/* Estado vacío, incompleto o de error: se dice, no se disimula. */}
      {aviso && (
        <ReglaDeNegocio>
          <span style={{ color: "var(--urgencia-texto)" }}>{aviso}</span>
        </ReglaDeNegocio>
      )}

      <HeroCard>
        {hero.contexto && (
          <Eyebrow>
            {t("MATERIA.AHORA")} · {hero.contexto}
          </Eyebrow>
        )}
        <p style={{ fontSize: "var(--text-title-sm)", fontWeight: 600, color: "var(--foreground)" }}>
          {hero.titulo}
        </p>
        {hero.razon && (
          <ReglaDeNegocio>
            {t("COMUN.PORQUE")} {hero.razon}
          </ReglaDeNegocio>
        )}
        {(hero.tiempoOEstado || hero.evidenciaEsperada) && (
          <ReglaDeNegocio>
            {[
              hero.tiempoOEstado,
              hero.evidenciaEsperada
                ? `${t("MATERIA.ENTREGA")} ${hero.evidenciaEsperada}`
                : null,
            ]
              .filter((p): p is string => p !== null)
              .join(" · ")}
          </ReglaDeNegocio>
        )}
        <CTAPrincipal onClick={onAvanzar}>{ctaPara(hero.nivel, hero.variante)}</CTAPrincipal>
      </HeroCard>

      {/*
        Captura de "pasó algo en clase". Es un reporte del alumno: registrarlo
        durante una clase NO lo convierte en voz de la cátedra, y ninguna capa
        eleva su verificación (AGENTS.md §2.6).
      */}
      {capturaDeClase && <CTASecundaria onClick={onCapturar}>{capturaDeClase}</CTASecundaria>}

      {catedraYVos && (
        <div>
          <Eyebrow>{t("MATERIA.CATEDRA_Y_VOS")}</Eyebrow>
          <div
            className="flex gap-3 rounded-[var(--radius-control)] border p-3"
            style={{ borderColor: "var(--border)", background: "var(--card)" }}
          >
            <Columna fuente={catedraYVos.catedra} />
            <Columna fuente={catedraYVos.vos} />
          </div>
        </div>
      )}

      {/*
        Las cinco dimensiones, separadas. Confianza no es dominio: una confianza
        alta con dominio no evaluado son dos hechos distintos, y la vista no
        genera una Action a partir de la brecha.
      */}
      {dimensiones.length > 0 && (
        <div>
          <Eyebrow>{t("MATERIA.DIMENSIONES")}</Eyebrow>
          {dimensiones.map((d) => (
            <Fila key={d.label} label={d.label} value={d.valor} ausencia={d.ausencia} tono={d.tono} />
          ))}
        </div>
      )}

      {gantt && <Gantt gantt={gantt} />}

      {unidades.length > 0 && (
        <div>
          <Eyebrow>{t("MATERIA.UNIDADES")}</Eyebrow>
          {unidades.map((u) => (
            <Fila key={u.label} label={u.label} value={u.valor} ausencia={u.ausencia} tono={u.tono} />
          ))}
        </div>
      )}

      {/*
        Actividad reciente (`VI.2` §8.7) — Etapa B3.3.

        **La misma forma que la Bitácora de `UX06`, y a propósito.** `VI.6` §8.3
        dice que es "una preview de la misma verdad derivada" y que no existe una
        segunda fuente histórica: si se viera distinta, parecería otra cosa. Lo
        único que cambia es cuántas entradas entran — el corte lo hace la base.

        `null` ⇒ no pasó nada todavía y la sección **no se dibuja vacía**.
      */}
      {actividadReciente && (
        <div data-actividad>
          <Eyebrow>{t("MATERIA.ACTIVIDAD")}</Eyebrow>
          {actividadReciente.map((e, i) => (
            <div key={`${i}-${e.titulo}`} style={{ padding: "4px 0" }}>
              <span style={{ fontSize: "var(--text-body)" }}>{e.titulo}</span>
              <ReglaDeNegocio>{e.detalle}</ReglaDeNegocio>
              <p style={{ fontSize: "var(--text-meta)", color: "var(--muted-foreground)" }}>
                {e.provenance ?? t("PROVENANCE.NO_DISPONIBLE")}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
