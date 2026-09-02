"use client";

/**
 * ACHIEVE — Paso de Protocolo de Examen (VI.9 · `UX09` · `WF-S11`).
 *
 * Construida desde la spec `VI.9`. Mapeo canónico obligatorio: `WF-S11 → UX09`.
 *
 * ── Lo que esta pantalla no hace ────────────────────────────────────────────
 *
 * **Renderiza contenido recibido** (§12.1): no deriva, no resume con
 * significado nuevo, no completa y no corrige contenido pedagógico. No elige el
 * paso. No evalúa el criterio. No compara materias ni recomendaciones.
 *
 * **Abrir no completa.** Abrir el recurso es navegación, no transición: no
 * produce evento de dominio, no cambia estado y no registra progreso (§19.3).
 * Un `ProtocolStep` no crea una `Action`, y `ProtocolStepCompleted` no implica
 * progreso (AGENTS.md §2.1).
 *
 * **Nunca se muestra `Paso 5 de 12` ni un porcentaje** (§13.2): instancia,
 * orden, `current`/`next` y deduplicación siguen `SOURCE CONTRACT PENDING`. Los
 * doce pasos son provisionales.
 *
 * ── Layout ──────────────────────────────────────────────────────────────────
 *
 * Dos columnas (§26 y ADR-015): principal con identidad, contenido, estado, CTA
 * y *"Después"*; secundaria con cómo trabajarlo, recurso y configuración.
 */

import {
  Ausencia,
  CTAPrincipal,
  CTASecundaria,
  EstadoGeneral,
  Eyebrow,
  HeroCard,
  ReglaDeNegocio,
  TituloDePanel,
} from "./design-system";
import { SUBCOPY, t } from "@/lib/content/es-AR";
import type { BloqueDePaso, PasoProtocoloProps } from "@/lib/domain/view-models";

/**
 * Un bloque de contenido configurado.
 *
 * Si el contenido falta, se muestra el copy de ausencia que §27 fija —
 * *"Objetivo de este paso no disponible"*— y **no se genera** una versión
 * propia. Desde la Etapa A2.3 ese tratamiento sale de la primitiva `Ausencia`
 * y no de una copia local: era la tercera implementación del mismo estilo, y
 * tres copias de una regla visual es la que menos conviene dejar divergir.
 */
function Bloque({ bloque }: { bloque: BloqueDePaso }) {
  return (
    <div data-bloque={bloque.titulo}>
      <Eyebrow>{bloque.titulo}</Eyebrow>
      <p style={{ fontSize: "var(--text-body)", lineHeight: 1.5, color: "var(--foreground)" }}>
        {bloque.valor ?? <Ausencia tipo="SIN_ASIGNAR">{bloque.ausencia}</Ausencia>}
      </p>
    </div>
  );
}

export function PasoDeProtocolo({
  assessment,
  materia,
  modalidad,
  labelDelPaso,
  version,
  objetivo,
  explicacion,
  entregable,
  criterio,
  recurso,
  avisoRecurso,
  estadoDominante,
  avisoDeApertura,
  aviso,
  ctaPrimaria,
  despues,
  secundarios,
  reentradaPendiente,
  fuenteDelContenido,
  ctaRetorno,
  onAvanzar,
  onVolver,
  onAceptarReentrada,
  onPedirOtraOpcion,
}: PasoProtocoloProps & {
  onAvanzar?: () => void;
  onVolver?: () => void;
  onAceptarReentrada?: () => void;
  onPedirOtraOpcion?: () => void;
}) {
  return (
    <div
      className="space-y-4"
      style={{ background: "var(--background)", padding: "16px", borderRadius: "var(--radius)" }}
    >
      <TituloDePanel
        titulo={t("PASO.TITULO")}
        eyebrow={
          <>
            <span aria-hidden="true">← </span>
            {t("PASO.MODO_EXAMEN")} · {assessment}
          </>
        }
        meta={`${materia} · ${modalidad}`}
        subcopy={SUBCOPY.UX09}
      />

      <div className="flex flex-col gap-4 md:flex-row md:items-start">
        {/* ── Columna principal: identidad, contenido, estado y decisión ── */}
        <div className="md:basis-2/3 space-y-4">
          <HeroCard>
            <Eyebrow>
              {t("PASO.ACTUAL")}
              {labelDelPaso ? ` · ${labelDelPaso}` : ""}
            </Eyebrow>
            {/*
              Sin número de posición: instancia y orden siguen pendientes de
              contrato, así que "Paso 5 de 12" no existe.
            */}
            {version && <ReglaDeNegocio>{version}</ReglaDeNegocio>}

            <Bloque bloque={objetivo} />
            {/* El objetivo del paso no es una Action del Engine. */}
            <ReglaDeNegocio>{t("PASO.SEPARACION")}</ReglaDeNegocio>

            <Bloque bloque={entregable} />
            <Bloque bloque={criterio} />

            {aviso && (
              <ReglaDeNegocio>
                <span style={{ color: "var(--urgencia-texto)" }}>{aviso}</span>
              </ReglaDeNegocio>
            )}

            {reentradaPendiente && (
              <section
                aria-labelledby="reentrada-titulo"
                style={{
                  border: "1px solid var(--border)",
                  borderRadius: "var(--radius)",
                  padding: "20px",
                  background: "var(--muted)",
                }}
              >
                <Eyebrow>{t("PASO.REENTRADA.EYEBROW")}</Eyebrow>
                <h2 id="reentrada-titulo" style={{ fontSize: "var(--text-title)", fontWeight: 650 }}>
                  {reentradaPendiente.titulo}
                </h2>
                <p style={{ marginTop: "8px", lineHeight: 1.5 }}>{reentradaPendiente.justificacion}</p>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <ReglaDeNegocio>
                    <strong>{t("PASO.REENTRADA.MOTIVO")}</strong> {reentradaPendiente.motivo}
                  </ReglaDeNegocio>
                  <ReglaDeNegocio>
                    <strong>{t("PASO.REENTRADA.RECORRIDO")}</strong> {reentradaPendiente.recorrido}
                  </ReglaDeNegocio>
                  <ReglaDeNegocio>
                    <strong>{t("PASO.REENTRADA.ACTIVIDAD")}</strong> {reentradaPendiente.actividad}
                  </ReglaDeNegocio>
                  <ReglaDeNegocio>
                    <strong>{t("PASO.REENTRADA.EVIDENCIA")}</strong> {reentradaPendiente.evidenciaVigente}
                  </ReglaDeNegocio>
                </div>
                <ReglaDeNegocio>{reentradaPendiente.comoPedirOtraOpcion}</ReglaDeNegocio>
                <CTAPrincipal onClick={onAceptarReentrada}>{reentradaPendiente.ctaAceptar}</CTAPrincipal>
                <div className="mt-2">
                  <CTASecundaria onClick={onPedirOtraOpcion}>
                    {reentradaPendiente.ctaOtraOpcion}
                  </CTASecundaria>
                </div>
              </section>
            )}

            <EstadoGeneral>{estadoDominante}</EstadoGeneral>

            {avisoDeApertura && <ReglaDeNegocio>{avisoDeApertura}</ReglaDeNegocio>}
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

        {/* ── Columna secundaria: cómo trabajarlo, recurso y configuración ── */}
        <div className="md:basis-1/3 space-y-4">
          <Bloque bloque={explicacion} />

          <div>
            <Eyebrow>{t("PASO.RECURSO")}</Eyebrow>
            {recurso ? (
              <div data-recurso>
                <p style={{ fontSize: "var(--text-body)" }}>{recurso.nombre}</p>
                {recurso.tipo && <ReglaDeNegocio>{recurso.tipo}</ReglaDeNegocio>}
                {/* Provenance del recurso, sin oficializar lo desconocido. */}
                <ReglaDeNegocio>
                  {recurso.provenance ?? "Fuente o verificación no disponible"}
                </ReglaDeNegocio>
                {recurso.derechos && <ReglaDeNegocio>{recurso.derechos}</ReglaDeNegocio>}
              </div>
            ) : (
              // La falta de recurso no bloquea el paso.
              <ReglaDeNegocio>
                <span style={{ fontStyle: "italic" }}>{avisoRecurso}</span>
              </ReglaDeNegocio>
            )}
          </div>

          <div>
            <Eyebrow>{t("PASO.CONFIGURACION")}</Eyebrow>
            <ReglaDeNegocio>
              {t("PASO.FUENTE_CONTENIDO")} {fuenteDelContenido}
            </ReglaDeNegocio>
          </div>

          <CTASecundaria onClick={onVolver}>{ctaRetorno}</CTASecundaria>
        </div>
      </div>
    </div>
  );
}
