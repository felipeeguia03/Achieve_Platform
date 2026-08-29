"use client";

/**
 * ACHIEVE — Próxima Acción (VI.3). Copy literal §5.1.
 * Parametrizada en la Etapa 0.2: JSX y copy preservados, datos por props.
 *
 * Cada fila que no tiene contrato **desaparece**; ninguna se rellena con un
 * placeholder (AGENTS.md §2.7). Si falta `estimatedMinutes` no hay línea de
 * tiempo; si falta `expectedEvidence` no se inventa el requisito.
 */

import { Eyebrow, ReglaDeNegocio, HeroCard, CTAPrincipal, CTASecundaria, Fila } from "./design-system";
import { t } from "@/lib/content/es-AR";
import type { ProximaAccionProps } from "@/lib/domain/view-models";

export function ProximaAccion({
  contexto,
  unidad,
  titulo,
  razon,
  duracion,
  recurso,
  evidenciaEsperada,
  criterioCierre,
  queSigue,
  onAvanzar,
}: ProximaAccionProps & { onAvanzar?: () => void }) {
  return (
    <div
      className="space-y-4"
      style={{ background: "var(--background)", padding: "16px", borderRadius: "var(--radius)" }}
    >
      <header>
        <Eyebrow>{contexto}</Eyebrow>
        <h2 style={{ fontSize: 22 }}>{unidad}</h2>
      </header>

      <HeroCard>
        <p
          style={{
            fontSize: "var(--text-title-sm)",
            fontWeight: 600,
            color: "var(--foreground)",
            marginTop: 0,
          }}
        >
          {titulo}
        </p>
        {razon && (
          <ReglaDeNegocio>
            {t("COMUN.PORQUE")} {razon}
          </ReglaDeNegocio>
        )}
        {duracion && <Fila label={t("ACCION.DURACION")} value={duracion} />}
        {recurso && <Fila label={t("ACCION.RECURSO")} value={recurso} />}
        {evidenciaEsperada && <Fila label={t("ACCION.EVIDENCIA")} value={evidenciaEsperada} />}
        {criterioCierre && (
          <ReglaDeNegocio>
            {t("COMUN.CIERRE")} {criterioCierre}
          </ReglaDeNegocio>
        )}
        {queSigue && (
          <ReglaDeNegocio>
            {t("COMUN.DESPUES")} {queSigue}
          </ReglaDeNegocio>
        )}
        {/* Aceptar una Action NO crea un Commitment: eso pasa en UX04. */}
        <CTAPrincipal onClick={onAvanzar}>{t("CTA.ME_COMPROMETO")}</CTAPrincipal>
        <CTASecundaria>{t("CTA.NO_PUEDO")}</CTASecundaria>
      </HeroCard>

      <CTASecundaria>{t("CTA.VER_RAZONES")}</CTASecundaria>
    </div>
  );
}
