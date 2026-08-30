"use client";

/**
 * ACHIEVE — Activación de Modo Examen (VI.7 · `UX07` · `WF-S09`).
 *
 * Construida desde la spec `VI.7`, **no** desde el arnés QA descartado.
 *
 * ── Lo que esta pantalla no hace ────────────────────────────────────────────
 *
 * No calcula elegibilidad ni prioridad, no convierte proximidad en hecho, no
 * elige entre fuentes que se contradicen y no crea Action, Commitment, Evidence
 * ni progreso. Activar produce una lectura autoritativa `ACTIVE`; **no existe
 * variante auto-activa** (§1, decisión congelada del spec).
 *
 * ── Layout ──────────────────────────────────────────────────────────────────
 *
 * Dos columnas ([ADR-015](../../docs/decisions.md), derivado de §21.2):
 * principal con identidad, datos, razón y decisión; secundaria con efecto real,
 * continuidad y provenance expandida. **La CTA primaria va a ancho completo al
 * final de la columna principal**, y el retorno seguro vive en la secundaria,
 * nunca estilizado como primaria.
 *
 * A 360 px las columnas se apilan conservando el orden obligatorio de §21.1:
 * materia y evaluación · fecha · modalidad · provenance · motivo · acción
 * primaria · qué ocurre después · salida.
 */

import {
  CTAPrincipal,
  CTASecundaria,
  Dato,
  EstadoGeneral,
  Eyebrow,
  HeroCard,
  ReglaDeNegocio,
  TituloDePanel,
} from "./design-system";
import { SUBCOPY, t } from "@/lib/content/es-AR";
import type { ActivacionExamenProps, OpcionDeEvaluacion } from "@/lib/domain/view-models";


/** Lista de evaluaciones del mismo CourseEnrollment. Sin ranking local. */
function Opciones({ opciones }: { opciones: readonly OpcionDeEvaluacion[] }) {
  return (
    <div>
      <Eyebrow>{t("EXAMEN.ELEGI")}</Eyebrow>
      {opciones.map((op) => (
        <div
          key={op.id}
          className="rounded-[var(--radius-control)] border p-3"
          style={{
            borderColor: op.seleccionada ? "var(--foreground)" : "var(--border)",
            background: "var(--card)",
            marginBottom: 8,
          }}
        >
          <p style={{ fontSize: "var(--text-body)", fontWeight: op.seleccionada ? 600 : 400 }}>
            {/* El estado de selección no se comunica sólo por el borde. */}
            {op.seleccionada ? "◉" : "○"} {op.evaluacion}
          </p>
          {op.datos.map((d) => (
            <Dato key={d.label} dato={d} />
          ))}
        </div>
      ))}
      <ReglaDeNegocio>{t("EXAMEN.ORDEN_RECIBIDO")}</ReglaDeNegocio>
    </div>
  );
}

export function ActivacionModoExamen({
  materia,
  comision,
  titulo,
  evaluacion,
  datos,
  razonAparicion,
  faltantes,
  aviso,
  opciones,
  queCambia,
  queNoCambia,
  despues,
  ctaPrimaria,
  ctaRetorno,
  onActivar,
  onVolver,
}: ActivacionExamenProps & { onActivar?: () => void; onVolver?: () => void }) {
  return (
    <div
      className="space-y-4"
      style={{ background: "var(--background)", padding: "16px", borderRadius: "var(--radius)" }}
    >
      <TituloDePanel
        eyebrow={
          <>
            <span aria-hidden="true">← </span>
            {materia}
            {comision ? ` · ${comision}` : ""}
          </>
        }
        titulo={t("EXAMEN.TITULO_PANTALLA")}
        subcopy={SUBCOPY.UX07}
      />

      {/*
        El banner de estado de `VI.7` §22.1 **no es el nombre de la pantalla**:
        la superficie se llama "Activación" y el banner dice en qué estado está.
        Hasta la A2.6 el banner ocupaba el `h1`, que es `C-02` roto —un
        concepto, un lugar—: un lector de pantalla anunciaba la pantalla con un
        nombre distinto en cada estado.
      */}
      <EstadoGeneral>{titulo}</EstadoGeneral>

      {/* Dos columnas en desktop; apiladas a 360 px, en el orden de §21.1. */}
      <div className="flex flex-col gap-4 md:flex-row md:items-start">
        {/* ── Columna principal: identidad, datos, razón y decisión ── */}
        <div className="md:basis-2/3 space-y-4">
          {/*
            La selección va ANTES del panel de revisión: primero se elige, y el
            panel "sólo aparece para la seleccionada" (§21.2). Poner la CTA de
            revisar encima de la lista invertía el orden de lectura.

            §24.2 dibuja lista y revisión en columnas contiguas. Acá van una
            debajo de otra dentro de la columna principal, porque la secundaria
            ya lleva el efecto real que §21.2 le asigna. Anotado como diferencia
            con el wireframe para la auditoría de la Etapa 0.7.
          */}
          {opciones && <Opciones opciones={opciones} />}

          <HeroCard>
            {evaluacion && (
              <p
                style={{
                  fontSize: "var(--text-title-sm)",
                  fontWeight: 600,
                  color: "var(--foreground)",
                }}
              >
                {evaluacion}
              </p>
            )}

            {datos.map((d) => (
              <Dato key={d.label} dato={d} />
            ))}

            {faltantes.length > 0 && (
              <div>
                <Eyebrow>{t("EXAMEN.FALTANTES")}</Eyebrow>
                {faltantes.map((f) => (
                  <ReglaDeNegocio key={f}>· {f}</ReglaDeNegocio>
                ))}
              </div>
            )}

            {/* Sólo la razón recibida. La vista no calcula por qué apareció. */}
            {razonAparicion && <ReglaDeNegocio>{razonAparicion}</ReglaDeNegocio>}

            {aviso && (
              <ReglaDeNegocio>
                <span style={{ color: "var(--urgencia-texto)" }}>{aviso}</span>
              </ReglaDeNegocio>
            )}

            {/*
              Una sola CTA primaria, a ancho completo, al final de la columna
              principal (ADR-015). Cuando no hay CTA no se deja un botón
              deshabilitado que sugiera una segunda operación (§21.3).
            */}
            {ctaPrimaria && (
              <CTAPrincipal onClick={onActivar} disabled={!ctaPrimaria.habilitada}>
                {ctaPrimaria.texto}
              </CTAPrincipal>
            )}
          </HeroCard>
        </div>

        {/* ── Columna secundaria: efecto real, continuidad y salida ── */}
        <div className="md:basis-1/3 space-y-4">
          {queCambia.length > 0 && (
            <div>
              <Eyebrow>{t("EXAMEN.QUE_CAMBIA")}</Eyebrow>
              {queCambia.map((linea) => (
                <ReglaDeNegocio key={linea}>{linea}</ReglaDeNegocio>
              ))}
            </div>
          )}

          {queNoCambia.length > 0 && (
            <div>
              <Eyebrow>{t("EXAMEN.QUE_NO_CAMBIA")}</Eyebrow>
              {queNoCambia.map((linea) => (
                <ReglaDeNegocio key={linea}>{linea}</ReglaDeNegocio>
              ))}
            </div>
          )}

          {despues && (
            <div>
              <Eyebrow>{t("EXAMEN.DESPUES")}</Eyebrow>
              <ReglaDeNegocio>{despues}</ReglaDeNegocio>
            </div>
          )}

          <ReglaDeNegocio>{t("EXAMEN.NO_ES_SELECTOR")}</ReglaDeNegocio>

          {/* El retorno seguro nunca se estiliza como primaria. */}
          <CTASecundaria onClick={onVolver}>{ctaRetorno}</CTASecundaria>
        </div>
      </div>
    </div>
  );
}
