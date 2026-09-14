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
  CTAPrincipal,
  CTASecundaria,
  EstadoChip,
  TituloDeSeccion,
  Fila,
  HeroCard,
  ReglaDeNegocio,
  TituloDePanel,
} from "./design-system";
import { ChipEsqueleto, CTAEsqueleto, CTASecundariaEsqueleto, FilaEsqueleto, PantallaCargando, Renglon } from "./esqueleto";
import { SUBCOPY, t } from "@/lib/content/es-AR";
import type { ProgresoProps } from "@/lib/domain/view-models";

/**
 * `UX06` mientras carga — `P-12`. Estado de la evidencia, las filas de lo que
 * cambió, dos ciclos de bitácora y *qué sigue*.
 *
 * ⚠️ **Las filas de dimensión van sin tratamiento.** Ni itálica de ausencia ni
 * cifra: *"no evaluado"* y `0` se ven distinto (AGENTS.md §2.5), y un esqueleto
 * que se pareciera a uno de los dos afirmaría cuál es.
 */
export function ProgresoBitacoraEsqueleto() {
  return (
    <PantallaCargando className="space-y-4" style={{ background: "var(--background)" }}>
      <TituloDePanel
        titulo={t("PROGRESO.TITULO")}
        meta={<Renglon cuerpo="body" ancho={240} />}
        subcopy={SUBCOPY.UX06}
      />
      <div>
        <ChipEsqueleto />
        <Renglon cuerpo="label" ancho="70%" />
      </div>
      <div>
        <Renglon cuerpo="body" ancho={180} style={{ marginBottom: "0.35rem" }} />
        <FilaEsqueleto />
        <FilaEsqueleto />
      </div>
      <div>
        <TituloDeSeccion>{t("PROGRESO.BITACORA")}</TituloDeSeccion>
        {[0, 1].map((g) => (
          <div key={g} className="hairline-t pt-2">
            <Renglon cuerpo="label" ancho={140} />
            {[0, 1].map((e) => (
              <div key={e} style={{ padding: "4px 0" }}>
                <Renglon cuerpo="body" ancho={["60%", "45%"][e]} />
                <Renglon cuerpo="label" ancho="75%" />
                <Renglon cuerpo="meta" ancho="40%" />
              </div>
            ))}
          </div>
        ))}
      </div>
      <HeroCard>
        <TituloDeSeccion>{t("PROGRESO.QUE_SIGUE")}</TituloDeSeccion>
        <Renglon cuerpo="label" ancho="70%" />
        <CTAEsqueleto />
      </HeroCard>
      <CTASecundariaEsqueleto />
    </PantallaCargando>
  );
}

export function ProgresoBitacora({
  contexto,
  estadoEvidencia,
  detalleEvidencia,
  cambioConfirmado,
  fuenteCambio,
  sinCambioConfirmado,
  fuenteSinCambio,
  queSigue,
  aviso,
  bitacora,
  ctaPrimaria,
  onAvanzar,
}: ProgresoProps & { onAvanzar?: () => void }) {
  return (
    <div
      className="space-y-4"
      style={{ background: "var(--background)" }}
    >
      <TituloDePanel titulo={t("PROGRESO.TITULO")} meta={contexto} subcopy={SUBCOPY.UX06} />

      <div>
        <EstadoChip tone={estadoEvidencia.tono}>{estadoEvidencia.texto}</EstadoChip>
        <ReglaDeNegocio>{detalleEvidencia}</ReglaDeNegocio>
      </div>

      {/*
        Una falla de lectura NO es un no-cambio, y "sin información" no es 0
        (AGENTS.md §2.5). Los cuatro resultados posibles se ven distintos.
      */}
      {aviso && (
        <ReglaDeNegocio>
          <span style={{ color: "var(--urgencia-texto)" }}>{aviso}</span>
        </ReglaDeNegocio>
      )}

      {cambioConfirmado.length > 0 && (
        <div>
          <TituloDeSeccion>{t("PROGRESO.CAMBIO_CONFIRMADO")}</TituloDeSeccion>
          {cambioConfirmado.map((f) => (
            <Fila key={f.label} label={f.label} value={f.valor} ausencia={f.ausencia} tono={f.tono} />
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
          <TituloDeSeccion>{t("PROGRESO.SIN_CAMBIO")}</TituloDeSeccion>
          {sinCambioConfirmado.map((f) => (
            <Fila key={f.label} label={f.label} value={f.valor} ausencia={f.ausencia} tono={f.tono} />
          ))}
          {/*
            ADR-020: un no-cambio declarado es un dato, y un dato lleva su
            fuente (`P-08`). Una ausencia no tiene fuente que citar, y por eso
            esta línea sólo aparece cuando alguien efectivamente miró.
          */}
          {fuenteSinCambio && (
            <p
              style={{
                fontSize: "var(--text-meta)",
                color: "var(--muted-foreground)",
                marginTop: 6,
              }}
            >
              {t("PROGRESO.FUENTE_PREFIJO")} {fuenteSinCambio}
            </p>
          )}
        </div>
      )}

      {/*
        Bitácora agrupada por ciclo: los eventos de un mismo ciclo se muestran
        juntos y no como cuatro avances independientes.
      */}
      {bitacora && (
        <div data-bitacora>
          <TituloDeSeccion>{t("PROGRESO.BITACORA")}</TituloDeSeccion>
          {bitacora.map((grupo) => (
            <div key={grupo.ciclo} data-ciclo={grupo.ciclo} className="hairline-t pt-2">
              <p style={{ fontSize: "var(--text-label)", fontWeight: 600 }}>{grupo.ciclo}</p>
              {/*
                La key lleva la posición además del título: con datos reales, un
                mismo ciclo puede registrar dos veces el mismo hecho —una
                resubmission vuelve a emitir "Presentaste evidencia"— y dos keys
                iguales hacen que React reutilice el nodo equivocado. Con
                fixtures no pasaba: los títulos de un ciclo eran únicos.
              */}
              {grupo.entradas.map((e, i) => (
                <div key={`${i}-${e.titulo}`} style={{ padding: "4px 0" }}>
                  <span style={{ fontSize: "var(--text-body)" }}>{e.titulo}</span>
                  <ReglaDeNegocio>{e.detalle}</ReglaDeNegocio>
                  <p style={{ fontSize: "var(--text-meta)", color: "var(--muted-foreground)" }}>
                    {e.provenance ?? "Fuente o estado no disponible"}
                  </p>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      {(queSigue || ctaPrimaria) && (
        <HeroCard>
          <TituloDeSeccion>{t("PROGRESO.QUE_SIGUE")}</TituloDeSeccion>
          {queSigue && <ReglaDeNegocio>{queSigue}</ReglaDeNegocio>}
          {ctaPrimaria && (
            <CTAPrincipal onClick={onAvanzar} disabled={!ctaPrimaria.habilitada}>
              {ctaPrimaria.texto}
            </CTAPrincipal>
          )}
        </HeroCard>
      )}
      <CTASecundaria>{t("CTA.VER_BITACORA")}</CTASecundaria>
    </div>
  );
}
