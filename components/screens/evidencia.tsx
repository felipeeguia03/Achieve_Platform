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
import {
  CTAPrincipal,
  CTASecundaria,
  EstadoGeneral,
  Eyebrow,
  HeroCard,
  ReglaDeNegocio,
  TituloDePanel,
} from "./design-system";
import { SUBCOPY, t } from "@/lib/content/es-AR";
import type { EvidenciaProps } from "@/lib/domain/view-models";

export function Evidencia({
  contexto,
  titulo,
  unidad,
  evidenciaEsperada,
  criterioCierre,
  formatosPermitidos,
  nombreAdjuntoDemo,
  estadoVisible,
  aviso,
  reflection,
  ctaPrimaria,
  adjuntoPrevio,
  onAvanzar,
  reflexionTexto = "",
  onReflexion,
}: EvidenciaProps & {
  onAvanzar?: () => void;
  /**
   * El texto de la reflexión y quién lo recibe — [ADR-045](../../docs/decisions.md#adr-045).
   *
   * **Controlado desde arriba a propósito.** La pantalla proyecta y avisa; no
   * guarda una reflexión ni decide si alcanza. Persistirla y decidir si bloquea
   * el envío son del servidor, desde la Fase B6.10 — y esta pantalla **no sabe
   * por dónde**, que es lo que la mantiene siendo una proyección.
   */
  reflexionTexto?: string;
  onReflexion?: (texto: string) => void;
}) {
  // Estado local de sesión, no de dominio: un upload exitoso NO produce
  // SUBMITTED (AGENTS.md §2.3).
  const [adjunto, setAdjunto] = useState(false);
  const hayContenido = adjunto || adjuntoPrevio !== null;

  /*
    **Desplegada si es obligatoria, contraída si es opcional** (ADR-045). Lo
    obligatorio se ve sin tener que buscarlo; lo opcional no le ocupa la
    pantalla a quien no lo va a usar.
  */
  const [abierta, setAbierta] = useState(false);
  const desplegada = reflection?.requerida === true || abierta;

  return (
    <div
      className="space-y-4"
      style={{ background: "var(--background)", padding: "16px", borderRadius: "var(--radius)" }}
    >
      <TituloDePanel
        eyebrow={contexto}
        titulo={titulo}
        escala={20}
        meta={unidad}
        subcopy={SUBCOPY.UX05}
      />

      <HeroCard>
        {/* El lifecycle en copy de producto, nunca el enum crudo. */}
        {estadoVisible && <EstadoGeneral>{estadoVisible}</EstadoGeneral>}
        {aviso && <ReglaDeNegocio>{aviso}</ReglaDeNegocio>}

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

        {/* Con una entrega previa no se vuelve a pedir el adjunto. */}
        {adjuntoPrevio ? (
          <ReglaDeNegocio>
            <span data-adjunto-previo>{adjuntoPrevio}</span>
          </ReglaDeNegocio>
        ) : (
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
            /*
              Vacío de pantalla según §9.2: párrafo de 13 px, centrado, ancho
              máximo ~380 px. **Sin itálica** — la itálica atenuada es el
              tratamiento de `SIN_ASIGNAR` (ADR-019), y esto no es un dato que
              falta: es una explicación de qué va a aparecer acá.
            */
            <p
              style={{
                color: "var(--muted-foreground)",
                fontSize: "var(--text-label)",
                lineHeight: 1.5,
                marginTop: 8,
                maxWidth: 380,
                marginLeft: "auto",
                marginRight: "auto",
              }}
            >
              {t("EVIDENCIA.SIN_ADJUNTO")}
            </p>
          )}
          {adjunto && (
            <div
              style={{ color: "var(--exito-texto)", fontSize: "var(--text-label)", marginTop: 6 }}
            >
              {nombreAdjuntoDemo} {t("EVIDENCIA.CARGADA_SUFIJO")}
            </div>
          )}
        </button>
        )}

        {/*
          La Reflection es un objeto separado de la Evidence —se escribe acá,
          no en otra pantalla (ADR-045): *"forman parte de la misma intención
          del estudiante"*— y si es requerida su ausencia bloquea **sólo el
          submit dependiente**.
        */}
        {reflection && !desplegada && (
          <CTASecundaria onClick={() => setAbierta(true)}>{reflection.titulo}</CTASecundaria>
        )}
        {reflection && desplegada && (
          <div style={{ marginTop: 10 }}>
            <Eyebrow>{reflection.titulo}</Eyebrow>
            <textarea
              value={reflexionTexto}
              onChange={(e) => onReflexion?.(e.target.value)}
              placeholder={t("REFLEXION.CAMPO")}
              rows={3}
              style={{
                width: "100%",
                marginTop: 6,
                padding: 8,
                fontSize: "var(--text-label)",
                lineHeight: 1.5,
                color: "var(--foreground)",
                background: "var(--background)",
                border: "1px solid var(--border)",
                borderRadius: "var(--radius)",
                resize: "vertical",
              }}
            />
          </div>
        )}
        {/* Enviar no es suficiencia; suficiencia no es validación. */}
        <ReglaDeNegocio>{t("EVIDENCIA.ENVIAR_IMPLICA")}</ReglaDeNegocio>
        {ctaPrimaria && (
          <CTAPrincipal onClick={onAvanzar} disabled={!ctaPrimaria.habilitada || !hayContenido}>
            {ctaPrimaria.texto}
          </CTAPrincipal>
        )}
      </HeroCard>
    </div>
  );
}
