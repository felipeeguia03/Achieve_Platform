"use client";

/**
 * ACHIEVE — Modo Examen / Overview (VI.8 · `UX08` · `WF-S10`).
 *
 * Construida desde la spec `VI.8`. Mapeo canónico obligatorio: `WF-S10 → UX08`.
 *
 * ── Lo que esta pantalla no hace ────────────────────────────────────────────
 *
 * No calcula readiness, no muestra score ni porcentaje, no deriva progreso por
 * fecha, visitas, confianza, Commitments ni Evidence no validada, y **no crea
 * card de readiness** ([ADR-011](../../docs/decisions.md), §18). No elige el
 * paso del protocolo: lo provee el owner. No compara materias: sólo mira
 * objetos vinculados inequívocamente a esta preparación.
 *
 * `SUBMITTED` es recibido, no progreso. `UNDER_REVIEW` es revisión, no
 * progreso. `SUFFICIENT` es criterio mínimo, no `ProgressUpdated`. `VALIDATED`
 * es cierre, no dominio ni cambio dimensional. Sólo un `ProgressUpdated` real
 * habilita mostrar un cambio (§17).
 *
 * ── Layout ──────────────────────────────────────────────────────────────────
 *
 * Dos columnas (§22.2 y ADR-015): principal con identidad, fecha/modalidad,
 * estado, CTA y *"Después"*; secundaria con recorrido, confirmado/pendiente y
 * Cursado. Una sola CTA visual primaria. El ancho extra no agrega plan,
 * analytics ni contenido de protocolo.
 */

import {
  CTAPrincipal,
  CTASecundaria,
  Dato,
  EstadoGeneral,
  Eyebrow,
  Fila,
  HeroCard,
  ReglaDeNegocio,
  TituloDePanel,
} from "./design-system";
import { SUBCOPY, t } from "@/lib/content/es-AR";
import type { OverviewExamenProps } from "@/lib/domain/view-models";

export function OverviewModoExamen({
  materia,
  evaluacion,
  datos,
  estadoDominante,
  objeto,
  ctaPrimaria,
  despues,
  secundarios,
  aviso,
  recorrido,
  cambioConfirmado,
  pendiente,
  fuenteProgreso,
  statusRecibido,
  cursadoPersistente,
  ctaRetorno,
  onAvanzar,
  onVolver,
}: OverviewExamenProps & { onAvanzar?: () => void; onVolver?: () => void }) {
  return (
    <div
      className="space-y-4"
      style={{ background: "var(--background)", padding: "16px", borderRadius: "var(--radius)" }}
    >
      <TituloDePanel
        titulo={t("OVERVIEW.TITULO")}
        eyebrow={
          <>
            {/* La flecha es afordancia visual de retorno, no parte del nombre
                de la pantalla: fuera del nombre accesible. */}
            <span aria-hidden="true">← </span>
            {materia} · {t("OVERVIEW.EXAMEN")} · {evaluacion}
          </>
        }
        subcopy={SUBCOPY.UX08}
      />

      <div className="flex flex-col gap-4 md:flex-row md:items-start">
        {/* ── Columna principal ── */}
        <div className="md:basis-2/3 space-y-4">
          <HeroCard>
            <div>
              {datos.map((d) => (
                <Dato key={d.label} dato={d} layout="inline" />
              ))}
            </div>

            {/* El estado principal nunca queda detrás de tabs ni acordeones. */}
            <EstadoGeneral>{estadoDominante}</EstadoGeneral>

            {objeto && (
              <p
                style={{
                  fontSize: "var(--text-title-sm)",
                  fontWeight: 600,
                  color: "var(--foreground)",
                }}
              >
                {objeto}
              </p>
            )}

            {aviso && <ReglaDeNegocio>{aviso}</ReglaDeNegocio>}

            {/*
              Status recibido del owner, con su descargo. NO es una card de
              readiness: no hay score, porcentaje ni umbral, y la pantalla no
              lo calcula (ADR-011 · §18).
            */}
            {statusRecibido && (
              <div data-status-recibido>
                <ReglaDeNegocio>{statusRecibido.valor}</ReglaDeNegocio>
                <ReglaDeNegocio>{statusRecibido.descargo}</ReglaDeNegocio>
              </div>
            )}

            {ctaPrimaria && (
              <CTAPrincipal onClick={onAvanzar} disabled={!ctaPrimaria.habilitada}>
                {ctaPrimaria.texto}
              </CTAPrincipal>
            )}

            {despues && (
              <ReglaDeNegocio>
                {t("OVERVIEW.DESPUES")} {despues}
              </ReglaDeNegocio>
            )}

            {/* Lo secundario se muestra como secundario, no se esconde. */}
            {secundarios.length > 0 && (
              <div>
                <Eyebrow>{t("OVERVIEW.SECUNDARIOS")}</Eyebrow>
                {secundarios.map((linea) => (
                  <ReglaDeNegocio key={linea}>{linea}</ReglaDeNegocio>
                ))}
              </div>
            )}
          </HeroCard>
        </div>

        {/* ── Columna secundaria ── */}
        <div className="md:basis-1/3 space-y-4">
          <div>
            <Eyebrow>{recorrido ? t("OVERVIEW.RECORRIDO") : t("OVERVIEW.SIN_RECORRIDO")}</Eyebrow>
            {/* Sin porcentaje y sin lista fija: no se listan 12 pasos. */}
            {recorrido?.map((paso) => (
              <ReglaDeNegocio key={paso.label}>
                {paso.estado === "CONFIRMADO" ? "✓" : paso.estado === "ACTUAL" ? "→" : "·"}{" "}
                {paso.label}
              </ReglaDeNegocio>
            ))}
          </div>

          {cambioConfirmado.length > 0 && (
            <div>
              <Eyebrow>{t("OVERVIEW.ULTIMO_CAMBIO")}</Eyebrow>
              {cambioConfirmado.map((f) => (
                <Fila key={f.label} label={f.label} value={f.valor} ausencia={f.ausencia} tono={f.tono} />
              ))}
              {fuenteProgreso && (
                <p
                  style={{
                    fontSize: "var(--text-meta)",
                    color: "var(--muted-foreground)",
                    marginTop: 6,
                  }}
                >
                  {t("PROGRESO.FUENTE_PREFIJO")} {fuenteProgreso}
                </p>
              )}
            </div>
          )}

          {pendiente.length > 0 && (
            <div>
              <Eyebrow>{t("OVERVIEW.PENDIENTE")}</Eyebrow>
              {pendiente.map((f) => (
                <Fila key={f.label} label={f.label} value={f.valor} ausencia={f.ausencia} tono={f.tono} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Banda de continuidad: el Cursado no se interrumpe por el Modo Examen. */}
      <div className="hairline-t pt-3">
        <Eyebrow>{t("OVERVIEW.CURSADO")}</Eyebrow>
        <ReglaDeNegocio>{cursadoPersistente}</ReglaDeNegocio>
        <CTASecundaria onClick={onVolver}>{ctaRetorno}</CTASecundaria>
      </div>
    </div>
  );
}
