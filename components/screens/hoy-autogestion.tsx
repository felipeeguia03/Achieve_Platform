"use client";

/**
 * ACHIEVE — Hoy / Autogestión (VI.1)
 *
 * La pantalla **proyecta, no decide** (AGENTS.md §2.2). El nivel del Hero llega
 * ya resuelto por `selectHeroLevel` (`lib/domain/precedence.ts`); acá no se
 * rankea, no se prioriza y no se elige entre recomendaciones.
 *
 * Parametrizada en la Etapa 0.2: el JSX y el copy se preservan, los datos
 * llegan por props tipadas. Antes de esta etapa la función de precedencia y un
 * conmutador de demo vivían dentro de este archivo.
 */

import { useState } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import {
  AccionDeObjeto,
  Eyebrow,
  EstadoGeneral,
  ReglaDeNegocio,
  HeroCard,
  EstadoChip,
  CTAPrincipal,
  TituloDePanel,
} from "./design-system";
import { SUBCOPY, t } from "@/lib/content/es-AR";
import { ctaPara, ofreceCta } from "@/lib/content/hero";
import type {
  HeroProjection,
  HoyProps,
  MateriaResumen,
  RecuperacionProjection,
  RepartoProjection,
} from "@/lib/domain/view-models";

/**
 * Línea operativa: tiempo (o estado) · evidencia esperada.
 *
 * Si faltan las dos, **la línea desaparece**. Nunca se rellena con un
 * placeholder que parezca un dato (AGENTS.md §2.7).
 */
function lineaOperativa(hero: HeroProjection): string | null {
  const partes = [
    hero.tiempoOEstado,
    hero.evidenciaEsperada ? `${t("COMUN.ENTREGA")} ${hero.evidenciaEsperada}` : null,
  ].filter((p): p is string => p !== null);
  return partes.length > 0 ? partes.join(" · ") : null;
}

function HeroContent({ hero, onAvanzar }: { hero: HeroProjection; onAvanzar?: () => void }) {
  const operativa = lineaOperativa(hero);

  // Ausencia confirmada: el ADE dijo que no hay recomendación. No es un error
  // ni una carga pendiente — es un empty honesto, con su propia salida.
  if (hero.titulo === null) {
    return (
      <HeroCard>
        <ReglaDeNegocio>{t("HOY.VACIO")}</ReglaDeNegocio>
        <CTAPrincipal onClick={onAvanzar}>{ctaPara(hero.nivel, hero.variante)}</CTAPrincipal>
      </HeroCard>
    );
  }

  return (
    <HeroCard>
      {hero.chip && <EstadoChip tone={hero.chip.tono}>{hero.chip.texto}</EstadoChip>}
      {hero.contexto && <Eyebrow>{hero.contexto}</Eyebrow>}
      <p style={{ fontSize: "var(--text-title-sm)", fontWeight: 600, color: "var(--foreground)" }}>
        {hero.titulo}
      </p>
      {hero.razon && (
        <ReglaDeNegocio>
          {t("COMUN.PORQUE")} {hero.razon}
        </ReglaDeNegocio>
      )}
      {operativa && <ReglaDeNegocio>{operativa}</ReglaDeNegocio>}
      {hero.queSigue && (
        <ReglaDeNegocio>
          {hero.queSigue.conPrefijo ? `${t("COMUN.DESPUES")} ` : ""}
          {hero.queSigue.texto}
        </ReglaDeNegocio>
      )}
      {/*
        Hay un estado sin CTA — B6.14, ADR-042: "Estamos preparando tu
        información académica" no ofrece nada que apretar porque no hay nada que
        el estudiante pueda hacer. **No deshabilitada, no en gris: no está**
        (AGENTS.md §2.2).
      */}
      {ofreceCta(hero.nivel, hero.variante) && (
        <CTAPrincipal onClick={onAvanzar}>{ctaPara(hero.nivel, hero.variante)}</CTAPrincipal>
      )}
    </HeroCard>
  );
}

/**
 * `P-10` resuelto con tensión arbitrada (design-system.md §1.4): el patrón de
 * cola numerada se aplica **solo** a la lista de materias debajo del fold,
 * nunca al Hero. No agrega pantalla ni CTA nuevo.
 */
function MateriasQueue({
  materias,
  onVerMateria,
}: {
  materias: MateriaResumen[];
  /**
   * Recibe **la cursada de la fila visible**, no un aviso de que se tocó algo
   * ([ADR-054](../../docs/decisions.md#adr-054)). `VI.2` §5.2 exige abrir *el
   * `CourseEnrollment` seleccionado*, y sin este dato la pantalla no podía
   * decir cuál era: el destino elegía por su cuenta.
   *
   * **La pantalla sigue sin decidir nada.** Pasa el id de la fila que el
   * estudiante está mirando; a dónde lleva eso lo resuelve el registro de CTAs.
   */
  onVerMateria?: (cursadaId: string | null) => void;
}) {
  const [index, setIndex] = useState(0);
  const multiple = materias.length > 1;
  const actual = materias[index];
  if (!actual) return null;

  return (
    <div className="hairline-t pt-3 space-y-2">
      <div className="flex items-center justify-between">
        <p className="eyebrow" style={{ marginBottom: 0 }}>
          {t("HOY.MATERIAS")}
        </p>
        {multiple && (
          <div
            className="flex items-center gap-2"
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "var(--text-meta)",
              color: "var(--muted-foreground)",
            }}
          >
            <button
              aria-label="Anterior"
              onClick={() => setIndex((i) => Math.max(0, i - 1))}
              disabled={index === 0}
              style={{ opacity: index === 0 ? 0.3 : 1 }}
            >
              <ArrowLeft size={14} />
            </button>
            <span>
              {index + 1} {t("HOY.PAGINACION")} {materias.length}
            </span>
            <button
              aria-label="Siguiente"
              onClick={() => setIndex((i) => Math.min(materias.length - 1, i + 1))}
              disabled={index === materias.length - 1}
              style={{ opacity: index === materias.length - 1 ? 0.3 : 1 }}
            >
              <ArrowRight size={14} />
            </button>
          </div>
        )}
      </div>
      <button
        onClick={() => onVerMateria?.(actual.cursadaId)}
        className="flex w-full items-center justify-between text-left"
        style={{ fontSize: "var(--text-body)" }}
      >
        <span style={{ color: "var(--foreground)" }}>{actual.nombre}</span>
        {/* Sin lectura de estado la línea desaparece: ver `MateriaResumen.estado`. */}
        {actual.estado && (
          <span
            style={{
              color: actual.tono === "urgencia" ? "var(--urgencia-texto)" : "var(--muted-foreground)",
              fontSize: "var(--text-label)",
            }}
          >
            {actual.estado}
          </span>
        )}
      </button>
      {/* Sin avance no es "hace 0 días": es una ausencia, y se ve distinta. */}
      <p style={{ fontSize: "var(--text-meta)", color: "var(--muted-foreground)" }}>
        {actual.ultimoAvance ? (
          `${t("HOY.ULTIMO_AVANCE")} ${actual.ultimoAvance}`
        ) : (
          <span style={{ fontStyle: "italic" }}>{t("COMUN.SIN_AVANCE")}</span>
        )}
      </p>
    </div>
  );
}

/**
 * La explicación de la propia señal — Etapa B6.6.2.
 *
 * Va **debajo del estado general y encima del Hero**, y en ese orden a
 * propósito: el estado dice *qué pasa*, esto dice *por qué*, y el Hero dice
 * *qué hacer*. Es la secuencia que ya usa el resto de la pantalla.
 *
 * **No lleva CTA**, y no es un olvido. `VI.1` §3.3: el riesgo *"no gana
 * automáticamente el Hero"*. Un botón acá competiría con la única CTA primaria
 * de la superficie, que es `C-02` roto —un concepto, un lugar— en la pantalla
 * donde el estudiante decide.
 *
 * `null` ⇒ **no se dibuja nada**. Una sección vacía diciendo "todo bien"
 * afirmaría una lectura que nadie hizo.
 */
function Recuperacion({ r }: { r: RecuperacionProjection | null }) {
  if (!r) return null;
  return (
    <section
      aria-label={r.titulo}
      style={{
        border: "1px solid var(--border)",
        borderRadius: "var(--radius)",
        padding: "12px 14px",
        background: "var(--muted)",
      }}
    >
      <Eyebrow>{r.titulo}</Eyebrow>
      <ReglaDeNegocio>{r.explicacion}</ReglaDeNegocio>
      {/* El hecho concreto, tal como lo registró la señal. Sin esto, la
          explicación es una frase amable y nada más. */}
      <ReglaDeNegocio>{r.detalle}</ReglaDeNegocio>
      {r.queSigue ? <ReglaDeNegocio>{r.queSigue}</ReglaDeNegocio> : null}
    </section>
  );
}

/**
 * **El reparto de horas entre materias** — [ADR-073](../../docs/decisions.md#adr-073).
 *
 * ## Las dos cosas que este bloque tiene prohibido hacer
 *
 * 1. **Sacar una conclusión.** Cuando falta tiempo se muestran **las dos cifras
 *    y nada más**: ni *"no llegás"* ni *"apurate"*. Las dos son predicciones y
 *    [ADR-058](../../docs/decisions.md#adr-058) las cerró. `falta` es un
 *    booleano sobre dos números, y acá sólo elige la preposición.
 * 2. **Sugerir qué recortar.** Todas las materias se listan y ninguna se marca
 *    como sacrificable. Cuando el presupuesto no alcanza, el dominio las achica
 *    a todas en la misma proporción.
 *
 * ⚠️ **Y no es una agenda.** Declarar cuántas horas tenés no agenda nada:
 * [ADR-064](../../docs/decisions.md#adr-064) deja el *cuándo* en el
 * `Commitment`. La regla de negocio lo dice en pantalla, porque una lista de
 * materias con horas al lado se lee como un plan si nadie aclara que no lo es.
 */
function Reparto({ r }: { r: RepartoProjection }) {
  // ⚠️ En `CRITICA` el mensaje va primero y **el número pasa a detalle
  // secundario**: más allá de `2×`, según la psicopedagoga, *"el dato bruto
  // pierde capacidad de orientar por sí solo"*.
  const numeroEnSegundoPlano = r.tramo === "CRITICA";

  return (
    <div data-reparto>
      <Eyebrow>{t("HOY.REPARTO")}</Eyebrow>

      <p style={{ fontSize: "var(--text-body)", fontWeight: numeroEnSegundoPlano ? 600 : 400 }}>
        {r.titulo}
      </p>

      {/*
        Las dos cifras **con su período en las dos**. En `CRITICA` bajan a
        tamaño de detalle; en el resto son la línea principal.
      */}
      {r.cifras && (
        <p
          style={{
            fontSize: numeroEnSegundoPlano ? "var(--text-meta)" : "var(--text-body)",
            color: numeroEnSegundoPlano ? "var(--muted-foreground)" : undefined,
          }}
        >
          {r.cifras}
        </p>
      )}

      <ReglaDeNegocio>{r.aclaracion}</ReglaDeNegocio>

      {/*
        ⚠️ **Siempre al menos una salida cuando falta tiempo.** Un déficit sin
        acción *"puede sentirse como un veredicto y favorecer evitación"*. Las
        tres conservan la agencia: ninguna dice «dejá esta materia».

        Van sin `onClick` hasta que cada destino exista: una CTA que no lleva a
        ningún lado sería peor que la ausencia, y el registro canónico decide a
        dónde va cada una.
      */}
      {r.acciones.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 6 }}>
          {r.acciones.map((a) => (
            <span
              key={a}
              style={{
                fontSize: "var(--text-meta)",
                padding: "3px 8px",
                border: "1px solid var(--border)",
                borderRadius: 6,
              }}
            >
              {a}
            </span>
          ))}
        </div>
      )}

      <div style={{ marginTop: 10 }}>
        {r.materias.map((m) => (
          <div
            key={m.cursadaId}
            style={{ display: "flex", alignItems: "baseline", gap: 8, padding: "3px 0" }}
          >
            <span style={{ fontSize: "var(--text-body)", flex: 1 }}>{m.nombre}</span>
            <span style={{ fontSize: "var(--text-meta)", color: "var(--muted-foreground)" }}>
              {/*
                Sin asignación **no se escribe un cero**: cero diría que esta
                materia no necesita tiempo esta semana, y lo que pasa es que no
                sabemos cuánto.
              */}
              {m.asignado ?? t(`HOY.REPARTO.MOTIVO.${m.motivo}`)}
            </span>
          </div>
        ))}
      </div>

      <ReglaDeNegocio>{t("HOY.REPARTO.REGLA")}</ReglaDeNegocio>
    </div>
  );
}

export function HoyAutogestion({
  fecha,
  estadoGeneral,
  hero,
  materias,
  reparto,
  recuperacion,
  verProgreso,
  onAvanzar,
  onVerMateria,
  onVerProgreso,
}: HoyProps & {
  onAvanzar?: () => void;
  onVerMateria?: (cursadaId: string | null) => void;
  onVerProgreso?: () => void;
}) {
  return (
    <div
      className="space-y-4"
      style={{ background: "var(--background)", padding: "16px", borderRadius: "var(--radius)" }}
    >
      <TituloDePanel
        eyebrow={t("HOY.EYEBROW")}
        titulo={t("HOY.TITULO")}
        escala={30}
        meta={fecha}
        subcopy={SUBCOPY.UX01}
        acciones={
          // `CTA-009` es navegación de lectura: va arriba a la derecha (§11.9.3),
          // no compite con la CTA primaria del Hero.
          verProgreso ? <AccionDeObjeto onClick={onVerProgreso}>{verProgreso}</AccionDeObjeto> : undefined
        }
      />

      <EstadoGeneral>{estadoGeneral}</EstadoGeneral>

      <Recuperacion r={recuperacion} />

      <HeroContent hero={hero} onAvanzar={onAvanzar} />

      <MateriasQueue materias={materias} onVerMateria={onVerMateria} />

      {reparto && <Reparto r={reparto} />}

      {/*
        `CTA-009` ya vive arriba a la derecha, como acción del objeto (§11.9.3).
        Estaba también acá abajo: la misma acción dos veces en una pantalla es
        `C-02` roto —un concepto, un lugar— y ruido en la única superficie donde
        el estudiante decide.
      */}
    </div>
  );
}
