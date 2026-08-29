"use client";

/**
 * ACHIEVE — Evidencia (VI.5). Copy literal §6.1 (EXPECTED).
 * Parametrizada en la Etapa 0.2: JSX y copy preservados, datos por props.
 *
 * El adjunto es **estado local de sesión**, no estado de dominio: un upload
 * exitoso NO produce `SUBMITTED` (AGENTS.md §2.3). Los siete estados de
 * Evidence llegan en la Etapa 0.7.
 */

import { useState } from "react";
import { Eyebrow, ReglaDeNegocio, HeroCard, CTAPrincipal, CTASecundaria } from "./design-system";
import { t } from "@/lib/content/es-AR";
import type { EvidenciaProps } from "@/lib/domain/view-models";

export function Evidencia({
  contexto,
  titulo,
  unidad,
  evidenciaEsperada,
  criterioCierre,
  formatosPermitidos,
  nombreAdjuntoDemo,
  onAvanzar,
}: EvidenciaProps & { onAvanzar?: () => void }) {
  const [adjunto, setAdjunto] = useState(false);

  return (
    <div
      className="space-y-4"
      style={{ background: "var(--background)", padding: "16px", borderRadius: "var(--radius)" }}
    >
      <header>
        <Eyebrow>{contexto}</Eyebrow>
        <h2 style={{ fontSize: 20 }}>{titulo}</h2>
        {unidad && (
          <p className="subcopy" style={{ marginTop: 2 }}>
            {unidad}
          </p>
        )}
      </header>

      <HeroCard>
        <Eyebrow>{t("EVIDENCIA.ESPERADA")}</Eyebrow>
        {(evidenciaEsperada || criterioCierre) && (
          <ReglaDeNegocio>
            {[
              evidenciaEsperada,
              criterioCierre ? `${t("COMPROMISO.CIERRE_PREFIJO")} ${criterioCierre}` : null,
            ]
              .filter((p): p is string => p !== null)
              .join(" · ")}
          </ReglaDeNegocio>
        )}

        <button
          onClick={() => setAdjunto(true)}
          className="w-full text-center"
          style={{
            border: "1px dashed var(--border)",
            borderRadius: "var(--radius-control)",
            padding: 18,
            marginTop: 10,
          }}
        >
          <div style={{ fontSize: 20, marginBottom: 4 }}>+</div>
          <div style={{ fontSize: "var(--text-label)", fontWeight: 600 }}>
            {t("EVIDENCIA.ADJUNTAR")}
          </div>
          {formatosPermitidos && (
            <div
              style={{
                fontSize: "var(--text-meta)",
                color: "var(--muted-foreground)",
                marginTop: 4,
              }}
            >
              {t("EVIDENCIA.PERMITIDO_PREFIJO")} {formatosPermitidos}
            </div>
          )}
          {!adjunto && (
            <div
              style={{
                fontStyle: "italic",
                color: "var(--muted-foreground)",
                fontSize: "var(--text-label)",
                marginTop: 6,
              }}
            >
              {t("EVIDENCIA.SIN_ADJUNTO")}
            </div>
          )}
          {adjunto && (
            <div
              style={{ color: "var(--exito-texto)", fontSize: "var(--text-label)", marginTop: 6 }}
            >
              {nombreAdjuntoDemo} {t("EVIDENCIA.CARGADA_SUFIJO")}
            </div>
          )}
        </button>

        <CTASecundaria>{t("CTA.AGREGAR_REFLEXION")}</CTASecundaria>
        {/* Enviar no es suficiencia; suficiencia no es validación. */}
        <ReglaDeNegocio>{t("EVIDENCIA.ENVIAR_IMPLICA")}</ReglaDeNegocio>
        <CTAPrincipal onClick={onAvanzar} disabled={!adjunto}>
          {t("CTA.ENVIAR_EVIDENCIA")}
        </CTAPrincipal>
      </HeroCard>
    </div>
  );
}
