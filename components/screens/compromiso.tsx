"use client";

/**
 * ACHIEVE — Compromiso (VI.4). Copy literal §6.1 (DRAFT estándar).
 * Parametrizada en la Etapa 0.2: JSX y copy preservados, datos por props.
 *
 * El frontend NO marca el estado: confirmar solicita la creación del
 * Commitment, y el estado resultante lo confirma el owner (AGENTS.md §2.3).
 */

import { Eyebrow, ReglaDeNegocio, HeroCard, EstadoChip, CTAPrincipal, Fila } from "./design-system";
import { t } from "@/lib/content/es-AR";
import type { CompromisoProps } from "@/lib/domain/view-models";

export function Compromiso({
  contexto,
  titulo,
  fecha,
  hora,
  tiempoDeclarado,
  notaEstimacion,
  evidenciaEsperada,
  criterioCierre,
  estadoResultante,
  onAvanzar,
}: CompromisoProps & { onAvanzar?: () => void }) {
  return (
    <div
      className="space-y-4"
      style={{ background: "var(--background)", padding: "16px", borderRadius: "var(--radius)" }}
    >
      <header>
        <Eyebrow>{contexto}</Eyebrow>
        <h2 style={{ fontSize: 20 }}>{titulo}</h2>
      </header>

      <HeroCard>
        {fecha && <Fila label={t("COMPROMISO.FECHA")} value={fecha} />}
        {hora && <Fila label={t("COMPROMISO.HORA")} value={hora} />}
        {tiempoDeclarado && (
          <Fila label={t("COMPROMISO.TIEMPO_DECLARADO")} value={tiempoDeclarado} />
        )}
        {notaEstimacion && <ReglaDeNegocio>{notaEstimacion}</ReglaDeNegocio>}
      </HeroCard>

      <HeroCard>
        {(evidenciaEsperada || criterioCierre) && (
          <ReglaDeNegocio>
            {[
              evidenciaEsperada ? `${t("COMPROMISO.EVIDENCIA_PREFIJO")} ${evidenciaEsperada}` : null,
              criterioCierre ? `${t("COMPROMISO.CIERRE_PREFIJO")} ${criterioCierre}` : null,
            ]
              .filter((p): p is string => p !== null)
              .join(" · ")}
          </ReglaDeNegocio>
        )}
        {estadoResultante && (
          <ReglaDeNegocio>
            {t("COMUN.DESPUES")} {t("COMPROMISO.QUEDA")}{" "}
            <EstadoChip tone={estadoResultante.tono}>{estadoResultante.texto}</EstadoChip>{" "}
            {t("COMPROMISO.RESULTADO")}
          </ReglaDeNegocio>
        )}
        <CTAPrincipal onClick={onAvanzar}>{t("CTA.CONFIRMAR_COMPROMISO")}</CTAPrincipal>
      </HeroCard>
    </div>
  );
}
