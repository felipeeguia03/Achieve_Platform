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
  provenanceRecurso,
  aviso,
  ctaPrimaria,
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
        {recurso && (
          <Fila
            label={t("ACCION.RECURSO")}
            value={
              <span>
                {recurso}
                {/* Sin provenance conocida el recurso no se presenta como oficial. */}
                {provenanceRecurso && (
                  <span
                    style={{
                      display: "block",
                      fontSize: "var(--text-meta)",
                      color: "var(--muted-foreground)",
                    }}
                  >
                    {provenanceRecurso}
                  </span>
                )}
              </span>
            }
          />
        )}
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
        {aviso && (
          <ReglaDeNegocio>
            <span style={{ color: "var(--urgencia-texto)" }}>{aviso}</span>
          </ReglaDeNegocio>
        )}
        {/*
          Aceptar una Action NO crea un Commitment: eso pasa en UX04. Si la
          Action está bloqueada o fue reemplazada, no hay CTA que ofrecer y no
          se deja una deshabilitada.
        */}
        {ctaPrimaria && (
          <CTAPrincipal onClick={onAvanzar} disabled={!ctaPrimaria.habilitada}>
            {ctaPrimaria.texto}
          </CTAPrincipal>
        )}
        <CTASecundaria>{t("CTA.NO_PUEDO")}</CTASecundaria>
      </HeroCard>

      <CTASecundaria>{t("CTA.VER_RAZONES")}</CTASecundaria>
    </div>
  );
}
