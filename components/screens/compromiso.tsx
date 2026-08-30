"use client";

/**
 * ACHIEVE — Compromiso (VI.4). Copy literal §6.1 (DRAFT estándar).
 * Parametrizada en la Etapa 0.2: JSX y copy preservados, datos por props.
 *
 * El frontend NO marca el estado: confirmar solicita la creación del
 * Commitment, y el estado resultante lo confirma el owner (AGENTS.md §2.3).
 */

import {
  CTAPrincipal,
  EstadoChip,
  Eyebrow,
  Fila,
  HeroCard,
  ReglaDeNegocio,
  TituloDePanel,
} from "./design-system";
import { SUBCOPY, t } from "@/lib/content/es-AR";
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
  aviso,
  original,
  ctaPrimaria,
  onAvanzar,
}: CompromisoProps & { onAvanzar?: () => void }) {
  return (
    <div
      className="space-y-4"
      style={{ background: "var(--background)", padding: "16px", borderRadius: "var(--radius)" }}
    >
      <TituloDePanel eyebrow={contexto} titulo={titulo} escala={20} subcopy={SUBCOPY.UX04} />

      {/*
        El Commitment original, cuando esta vista es una renegociación o un
        rescate. Se muestra y NO es editable: el original se preserva y su
        incumplimiento no se maquilla (AGENTS.md §2.4).
      */}
      {original && (
        <div data-original>
          <Eyebrow>{t("COMPROMISO.ORIGINAL")}</Eyebrow>
          {original.map((f) => (
            <Fila key={f.label} label={f.label} value={f.valor} ausencia={f.ausencia} tono={f.tono} />
          ))}
          <ReglaDeNegocio>{t("COMPROMISO.ORIGINAL_NO_EDITABLE")}</ReglaDeNegocio>
        </div>
      )}

      <HeroCard>
        {fecha && <Fila label={t("COMPROMISO.FECHA")} value={fecha} />}
        {hora && <Fila label={t("COMPROMISO.HORA")} value={hora} />}
        {tiempoDeclarado && (
          <Fila label={t("COMPROMISO.TIEMPO_DECLARADO")} value={tiempoDeclarado} />
        )}
        {notaEstimacion && <ReglaDeNegocio>{notaEstimacion}</ReglaDeNegocio>}
        {aviso && (
          <ReglaDeNegocio>
            <span style={{ color: "var(--urgencia-texto)" }}>{aviso}</span>
          </ReglaDeNegocio>
        )}
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
        {/*
          Sin datos válidos no hay confirmación que ofrecer, y un estado
          terminal del lifecycle no ofrece ninguna: no se deja un botón
          deshabilitado que sugiera una operación posible.
        */}
        {ctaPrimaria && (
          <CTAPrincipal onClick={onAvanzar} disabled={!ctaPrimaria.habilitada}>
            {ctaPrimaria.texto}
          </CTAPrincipal>
        )}
      </HeroCard>
    </div>
  );
}
