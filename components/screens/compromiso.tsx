"use client";

/**
 * ACHIEVE — Compromiso (VI.4). Copy literal §6.1 (DRAFT estándar).
 * Parametrizada en la Etapa 0.2: JSX y copy preservados, datos por props.
 *
 * El frontend NO marca el estado: confirmar solicita la creación del
 * Commitment, y el estado resultante lo confirma el owner (AGENTS.md §2.3).
 */

import { useState } from "react";
import {
  CTAPrincipal,
  CTASecundaria,
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
  cambioDeHorario,
  onAvanzar,
  onCambiarHorario,
  cambioEnCurso,
  confirmacionDeCambio,
}: CompromisoProps & {
  onAvanzar?: () => void;
  /** ADR-050. Recibe el instante ISO elegido; la pantalla no lo valida. */
  onCambiarHorario?: (inicio: string) => void;
  cambioEnCurso?: boolean;
  /** «Horario actualizado», cuando el servidor confirmó el cambio. */
  confirmacionDeCambio?: string | null;
}) {
  /*
    Abierto/cerrado y qué horario está elegido son estado **de la pantalla**:
    no describen nada del compromiso y no viajan en los props. Misma disciplina
    que el campo de reflexión de `UX05` (ADR-045).
  */
  const [abierto, setAbierto] = useState(false);
  const [elegido, setElegido] = useState<string>("");

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

        {/*
          **Cambiar horario** — ADR-050. Va DEBAJO de la principal y como
          acción secundaria: «Empezar» conserva toda la jerarquía. No abre una
          pantalla ni una ruta: el bloque se despliega acá mismo.
        */}
        {confirmacionDeCambio && (
          <ReglaDeNegocio>
            <span style={{ color: "var(--exito-texto)" }}>{confirmacionDeCambio}</span>
          </ReglaDeNegocio>
        )}

        {cambioDeHorario?.sePuede && !abierto && (
          <CTASecundaria onClick={() => setAbierto(true)}>
            {t("CTA.CAMBIAR_HORARIO")}
          </CTASecundaria>
        )}

        {cambioDeHorario?.sePuede && abierto && (
          <div data-cambio-de-horario style={{ marginTop: 10 }}>
            {/* El horario actual, de sólo lectura: es el acuerdo vigente. */}
            <Fila label={t("COMPROMISO.HORARIO_ACTUAL")} value={cambioDeHorario.horaActual} />
            <Eyebrow>{t("COMPROMISO.NUEVO_HORARIO")}</Eyebrow>
            {/*
              El selector ofrece **sólo** horarios del mismo día institucional
              y a quince minutos o más de ahora. No los calcula: llegan
              resueltos desde `lib/domain/renegociacion.ts`, y la validación
              final sigue siendo del servidor.
            */}
            <select
              aria-label={t("COMPROMISO.NUEVO_HORARIO")}
              value={elegido}
              onChange={(e) => setElegido(e.target.value)}
              style={{
                width: "100%",
                marginTop: 6,
                padding: 8,
                fontSize: "var(--text-label)",
                color: "var(--foreground)",
                background: "var(--background)",
                border: "1px solid var(--border)",
                borderRadius: "var(--radius)",
              }}
            >
              <option value="">—</option>
              {cambioDeHorario.horarios.map((h) => (
                <option key={h.valor} value={h.valor}>
                  {h.etiqueta}
                </option>
              ))}
            </select>
            <CTAPrincipal
              onClick={() => elegido && onCambiarHorario?.(elegido)}
              disabled={!elegido || !!cambioEnCurso}
            >
              {t("CTA.CONFIRMAR_NUEVO_HORARIO")}
            </CTAPrincipal>
            <CTASecundaria
              onClick={() => {
                setAbierto(false);
                setElegido("");
              }}
            >
              {t("CTA.CANCELAR")}
            </CTASecundaria>
          </div>
        )}

        {/*
          No elegible. **No es un botón apagado sin explicación**: el Product
          Owner lo descartó expresamente. Se dice que no se puede y por qué, y
          la acción que sí corresponde al estado sigue arriba, intacta.
        */}
        {cambioDeHorario && !cambioDeHorario.sePuede && (
          <div data-cambio-no-elegible>
            <ReglaDeNegocio>{t("COMPROMISO.NO_SE_PUEDE_CAMBIAR")}</ReglaDeNegocio>
            <ReglaDeNegocio>{cambioDeHorario.motivo}</ReglaDeNegocio>
          </div>
        )}
      </HeroCard>
    </div>
  );
}
