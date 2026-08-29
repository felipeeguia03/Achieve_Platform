"use client";

/**
 * ACHIEVE — Materia / Cursado (VI.2). Copy literal §7 (wireframe base).
 * Parametrizada en la Etapa 0.2: JSX y copy preservados, datos por props.
 */

import {
  Eyebrow,
  EstadoGeneral,
  ReglaDeNegocio,
  HeroCard,
  EstadoChip,
  CTAPrincipal,
  Fila,
} from "./design-system";
import { t } from "@/lib/content/es-AR";
import { ctaPara } from "@/lib/content/hero";
import type { ColumnaFuente, MateriaProps } from "@/lib/domain/view-models";

/**
 * `P-08`: la cátedra y el estudiante son dos fuentes en **columnas separadas**.
 * Nunca se fusionan, y ninguna capa eleva la verificación de la otra
 * (AGENTS.md §2.6).
 */
function Columna({ fuente }: { fuente: ColumnaFuente }) {
  return (
    <div className="flex-1">
      <p
        style={{
          fontSize: "var(--text-meta)",
          color: "var(--muted-foreground)",
          textTransform: "uppercase",
          letterSpacing: ".04em",
        }}
      >
        {fuente.titulo}
      </p>
      <p style={{ fontSize: "var(--text-label)", lineHeight: 1.4 }}>
        {fuente.contenido}
        <br />
        <span
          style={{
            color: fuente.tono === "urgencia" ? "var(--urgencia-texto)" : "var(--muted-foreground)",
          }}
        >
          {fuente.detalle}
        </span>
      </p>
    </div>
  );
}

export function MateriaCursado({
  materia,
  examen,
  estado,
  ultimoAvance,
  hero,
  catedraYVos,
  unidades,
  onAvanzar,
}: MateriaProps & { onAvanzar?: () => void }) {
  return (
    <div
      className="space-y-4"
      style={{ background: "var(--background)", padding: "16px", borderRadius: "var(--radius)" }}
    >
      <header>
        <Eyebrow>{materia}</Eyebrow>
        <h2 style={{ fontSize: 22 }}>{t("MATERIA.TITULO")}</h2>
        {/* Sin Assessment registrado la línea desaparece; no se inventa. */}
        {examen && (
          <p className="subcopy" style={{ marginTop: 2 }}>
            Examen · {examen}
          </p>
        )}
      </header>

      <EstadoGeneral>
        <EstadoChip tone={estado.tono}>{estado.texto}</EstadoChip>
        {ultimoAvance && (
          <span style={{ marginLeft: 8, fontWeight: 400, color: "var(--muted-foreground)" }}>
            {ultimoAvance}
          </span>
        )}
      </EstadoGeneral>

      <HeroCard>
        {hero.contexto && (
          <Eyebrow>
            {t("MATERIA.AHORA")} · {hero.contexto}
          </Eyebrow>
        )}
        <p style={{ fontSize: "var(--text-title-sm)", fontWeight: 600, color: "var(--foreground)" }}>
          {hero.titulo}
        </p>
        {hero.razon && (
          <ReglaDeNegocio>
            {t("COMUN.PORQUE")} {hero.razon}
          </ReglaDeNegocio>
        )}
        {(hero.tiempoOEstado || hero.evidenciaEsperada) && (
          <ReglaDeNegocio>
            {[
              hero.tiempoOEstado,
              hero.evidenciaEsperada
                ? `${t("MATERIA.ENTREGA")} ${hero.evidenciaEsperada}`
                : null,
            ]
              .filter((p): p is string => p !== null)
              .join(" · ")}
          </ReglaDeNegocio>
        )}
        <CTAPrincipal onClick={onAvanzar}>{ctaPara(hero.nivel)}</CTAPrincipal>
      </HeroCard>

      {catedraYVos && (
        <div>
          <Eyebrow>{t("MATERIA.CATEDRA_Y_VOS")}</Eyebrow>
          <div
            className="flex gap-3 rounded-[var(--radius-control)] border p-3"
            style={{ borderColor: "var(--border)", background: "var(--card)" }}
          >
            <Columna fuente={catedraYVos.catedra} />
            <Columna fuente={catedraYVos.vos} />
          </div>
        </div>
      )}

      {unidades.length > 0 && (
        <div>
          <Eyebrow>{t("MATERIA.UNIDADES")}</Eyebrow>
          {unidades.map((u) => (
            <Fila
              key={u.label}
              label={u.label}
              ausente={u.ausente}
              value={
                u.tono === "urgencia" ? (
                  <span style={{ color: "var(--urgencia-texto)" }}>{u.valor}</span>
                ) : (
                  u.valor
                )
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}
