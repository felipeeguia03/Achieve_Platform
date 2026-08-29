"use client";

/**
 * ACHIEVE — Progreso / Bitácora (VI.6). Copy literal §16.5 (VALIDATED con
 * cambio confirmado).
 * Parametrizada en la Etapa 0.2: JSX y copy preservados, datos por props.
 *
 * Una dimensión solo aparece como cambiada si hay un `ProgressUpdated` real
 * detrás: `VALIDATED` no produce progreso por sí solo (AGENTS.md §2.1).
 *
 * Los estados de no-cambio **no se colapsan**: "conserva su estado" ≠ "no
 * evaluado" ≠ "no disponible" ≠ `0` (AGENTS.md §2.5). Se distinguen por
 * itálica y color, y también sin color — la prueba es imprimir en blanco y
 * negro y no perder información.
 */

import {
  Eyebrow,
  ReglaDeNegocio,
  HeroCard,
  EstadoChip,
  CTAPrincipal,
  CTASecundaria,
  Fila,
} from "./design-system";
import { t } from "@/lib/content/es-AR";
import type { ProgresoProps } from "@/lib/domain/view-models";

export function ProgresoBitacora({
  contexto,
  estadoEvidencia,
  detalleEvidencia,
  cambioConfirmado,
  fuenteCambio,
  sinCambioConfirmado,
  queSigue,
  onAvanzar,
}: ProgresoProps & { onAvanzar?: () => void }) {
  return (
    <div
      className="space-y-4"
      style={{ background: "var(--background)", padding: "16px", borderRadius: "var(--radius)" }}
    >
      <header>
        <Eyebrow>{contexto}</Eyebrow>
      </header>

      <div>
        <EstadoChip tone={estadoEvidencia.tono}>{estadoEvidencia.texto}</EstadoChip>
        <ReglaDeNegocio>{detalleEvidencia}</ReglaDeNegocio>
      </div>

      {cambioConfirmado.length > 0 && (
        <div>
          <Eyebrow>{t("PROGRESO.CAMBIO_CONFIRMADO")}</Eyebrow>
          {cambioConfirmado.map((f) => (
            <Fila key={f.label} label={f.label} value={f.valor} ausente={f.ausente} />
          ))}
          {fuenteCambio && (
            <p
              style={{
                fontSize: "var(--text-meta)",
                color: "var(--muted-foreground)",
                marginTop: 6,
              }}
            >
              {t("PROGRESO.FUENTE_PREFIJO")} {fuenteCambio}
            </p>
          )}
        </div>
      )}

      {sinCambioConfirmado.length > 0 && (
        <div>
          <Eyebrow>{t("PROGRESO.SIN_CAMBIO")}</Eyebrow>
          {sinCambioConfirmado.map((f) => (
            <Fila key={f.label} label={f.label} value={f.valor} ausente={f.ausente} />
          ))}
        </div>
      )}

      {queSigue && (
        <HeroCard>
          <Eyebrow>{t("PROGRESO.QUE_SIGUE")}</Eyebrow>
          <ReglaDeNegocio>{queSigue}</ReglaDeNegocio>
          <CTAPrincipal onClick={onAvanzar}>{t("CTA.VER_SIGUIENTE_ACCION")}</CTAPrincipal>
        </HeroCard>
      )}
      <CTASecundaria>{t("CTA.VER_BITACORA")}</CTASecundaria>
    </div>
  );
}
