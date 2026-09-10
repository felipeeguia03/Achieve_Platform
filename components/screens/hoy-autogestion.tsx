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
  EjeDelPeriodo,
  HeroProjection,
  HoyProps,
  MateriaEnIndice,
  MateriaResumen,
  MateriasProps,
  RecuperacionProjection,
  RepartoProjection,
} from "@/lib/domain/view-models";
import type { HeroLevel } from "@/lib/domain/precedence";

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

/**
 * ¿La pantalla se repliega? — [ADR-089](../../docs/decisions.md#adr-089) §4.
 *
 * ⚠️ **Esto NO decide nada.** El nivel llega resuelto por `selectHeroLevel`
 * (`lib/domain/precedence.ts`), con sus nueve niveles; acá sólo se proyecta ese
 * mismo nivel **en el eje de la densidad** además de en el del texto.
 *
 * El criterio es el de la psicopedagoga y está en el ADR: **al que está atrasado
 * se le muestra menos, no más**. Un panorama de catorce días encima de un
 * compromiso incumplido es información que nadie va a leer y una razón más para
 * cerrar la pantalla.
 *
 * Si alguna vez hace falta una regla que el nivel no alcance a expresar, **es un
 * ADR nuevo y no un `if` más acá**.
 */
function seRepliega(nivel: HeroLevel): boolean {
  return nivel === "RESCUE_REQUIRED" || nivel === "COMMITMENT_MISSED";
}

/**
 * **Próxima evaluación** — la mitad derecha de la primera fila.
 *
 * Dice **cuánto falta**, y nada más. No dice si alcanza, no puntúa la
 * preparación y no ofrece un pronóstico:
 * [ADR-058](../../docs/decisions.md#adr-058) cerró las predicciones y
 * [ADR-072](../../docs/decisions.md#adr-072) prohibió leer la cobertura como
 * dominio.
 *
 * ⚠️ **No lleva CTA primaria.** `I-06`: una sola por pantalla, y es la del Hero.
 * Abrir la materia es navegación de lectura, igual que `CTA-009` arriba.
 */
function ProximaEvaluacion({
  panorama,
  onAbrirMateria,
}: {
  panorama: MateriasProps;
  onAbrirMateria?: (m: MateriaEnIndice) => void;
}) {
  // La primera con fecha. El orden ya viene por próxima evaluación desde la
  // proyección (ADR-072), así que **acá no se rankea**: se toma la primera.
  const proxima = panorama.materias.find((m) => m.evaluacion !== null && m.faltan !== null);

  return (
    <section
      aria-label={t("HOY.PROXIMA_EVALUACION")}
      style={{
        border: "1px solid var(--border)",
        borderRadius: "var(--radius)",
        padding: "14px 16px",
        background: "var(--card)",
      }}
    >
      <Eyebrow>{t("HOY.PROXIMA_EVALUACION")}</Eyebrow>

      {proxima ? (
        <>
          <p style={{ fontSize: "var(--text-title-sm)", fontWeight: 600, color: "var(--foreground)" }}>
            {proxima.faltan}
          </p>
          <p style={{ fontSize: "var(--text-body)", color: "var(--foreground)" }}>{proxima.nombre}</p>
          <ReglaDeNegocio>{proxima.evaluacion}</ReglaDeNegocio>

          {/*
            La cobertura, **con su aclaración obligatoria** (ADR-072). Sin barra
            se dice por qué: una barra vacía por falta de datos y una por falta
            de trabajo **no se dibujan igual**.
          */}
          {proxima.cobertura ? (
            <ReglaDeNegocio>{proxima.cobertura.texto}</ReglaDeNegocio>
          ) : proxima.sinCobertura ? (
            <ReglaDeNegocio>{proxima.sinCobertura}</ReglaDeNegocio>
          ) : null}

          {onAbrirMateria && (
            <div style={{ marginTop: 10 }}>
              <AccionDeObjeto onClick={() => onAbrirMateria(proxima)}>
                {proxima.etiqueta}
              </AccionDeObjeto>
            </div>
          )}
        </>
      ) : (
        /*
          ⚠️ **No es «no tenés exámenes»**: es que ninguna materia tiene la fecha
          cargada. Afirmar lo primero sería tranquilizar sobre algo que nadie
          verificó — *sin datos no es cero* (`AGENTS.md` §2.5).
        */
        <>
          <p style={{ fontSize: "var(--text-body)", color: "var(--foreground)" }}>
            {t("HOY.SIN_EVALUACIONES")}
          </p>
          <ReglaDeNegocio>{t("HOY.SIN_EVALUACIONES.AYUDA")}</ReglaDeNegocio>
        </>
      )}
    </section>
  );
}

/**
 * **El mapa de catorce días** — [ADR-089](../../docs/decisions.md#adr-089) §3.
 *
 * Es **la misma ventana** del Gantt del período de
 * [ADR-078](../../docs/decisions.md#adr-078), mirada más chica: las posiciones
 * llegan resueltas a fracciones `0`–`1` desde la proyección, y **la pantalla no
 * hace aritmética de fechas**. Calcular el recorte acá pondría la regla en dos
 * lugares, y uno de ellos sin versión.
 *
 * ## Las tres cosas que NO hace
 *
 * 1. **No agenda.** No es un calendario editable y no crea `Commitment`: el
 *    *cuándo* vive en `UX04` ([ADR-064](../../docs/decisions.md#adr-064)).
 * 2. **No inventa una punta.** Sin fecha de evaluación **no hay ventana** y la
 *    fila se dibuja punteada diciéndolo. Sin primera clase, el inicio se marca
 *    como no sabido en vez de disimularse.
 * 3. **No ordena por cobertura.** El orden es por próxima evaluación, y viene
 *    dado: *"ordenar por cobertura es un ranking de qué tan mal vas"*.
 */
function MapaDeCatorceDias({
  panorama,
  onAbrirMateria,
}: {
  panorama: MateriasProps;
  onAbrirMateria?: (m: MateriaEnIndice) => void;
}) {
  if (panorama.materias.length === 0) {
    return (
      <section aria-label={t("HOY.PANORAMA")}>
        <Eyebrow>{t("HOY.PANORAMA")}</Eyebrow>
        <ReglaDeNegocio>{t("HOY.PANORAMA.VACIO")}</ReglaDeNegocio>
      </section>
    );
  }

  return (
    <section aria-label={t("HOY.PANORAMA")} data-mapa-catorce-dias>
      <div className="flex items-baseline justify-between" style={{ gap: 12 }}>
        <Eyebrow>{t("HOY.PANORAMA")}</Eyebrow>
        {panorama.proximaEvaluacion && (
          <span style={{ fontSize: "var(--text-meta)", color: "var(--muted-foreground)" }}>
            {panorama.proximaEvaluacion}
          </span>
        )}
      </div>

      {/*
        A 360 px el eje se sale de cuadro si no puede desplazarse. El scroll vive
        **adentro de este contenedor**: el `body` nunca hace scroll horizontal.
      */}
      <div style={{ overflowX: "auto" }}>
        <div style={{ minWidth: 460 }}>
          <EjeDelMapa eje={panorama.eje} />
          <ul>
            {panorama.materias.map((m) => (
              <FilaDelMapa key={m.cursadaId} m={m} eje={panorama.eje} onAbrir={onAbrirMateria} />
            ))}
          </ul>
        </div>
      </div>

      <ReglaDeNegocio>{t("HOY.PANORAMA.AYUDA")}</ReglaDeNegocio>
      {/* La nota al pie de ADR-072, obligatoria si hay alguna barra de cobertura. */}
      {panorama.aclaracion && <ReglaDeNegocio>{panorama.aclaracion}</ReglaDeNegocio>}
    </section>
  );
}

const pct = (n: number) => `${(n * 100).toFixed(2)}%`;

function EjeDelMapa({ eje }: { eje: EjeDelPeriodo }) {
  return (
    <div
      aria-hidden
      style={{
        position: "relative",
        height: 18,
        marginLeft: 148,
        fontSize: "var(--text-meta)",
        color: "var(--muted-foreground)",
      }}
    >
      {eje.marcas.map((marca) => (
        <span
          key={marca.etiqueta}
          style={{
            position: "absolute",
            left: pct(marca.posicion),
            transform: "translateX(-50%)",
            whiteSpace: "nowrap",
            color: marca.esHoy ? "var(--foreground)" : undefined,
            fontWeight: marca.esHoy ? 600 : 400,
          }}
        >
          {marca.etiqueta}
        </span>
      ))}
    </div>
  );
}

function FilaDelMapa({
  m,
  eje,
  onAbrir,
}: {
  m: MateriaEnIndice;
  eje: EjeDelPeriodo;
  onAbrir?: (m: MateriaEnIndice) => void;
}) {
  const urgencia = m.tono === "urgencia";

  return (
    <li className="flex items-center" style={{ gap: 8, padding: "3px 0" }}>
      <button
        onClick={() => onAbrir?.(m)}
        title={m.nombre}
        className="truncate text-left"
        style={{
          width: 140,
          flexShrink: 0,
          fontSize: "var(--text-label)",
          color: "var(--foreground)",
        }}
      >
        {m.nombre}
      </button>

      <div style={{ position: "relative", flex: 1, height: 26 }}>
        {/* La línea de hoy, que es una marca del eje y no un caso especial. */}
        <div
          aria-hidden
          style={{
            position: "absolute",
            left: pct(eje.hoy),
            top: 0,
            bottom: 0,
            width: 1,
            background: "var(--foreground)",
            opacity: 0.35,
          }}
        />

        {m.ventana ? (
          <div
            style={{
              position: "absolute",
              left: pct(m.ventana.desde),
              width: pct(Math.max(0, m.ventana.hasta - m.ventana.desde)),
              top: 5,
              height: 16,
              borderRadius: 4,
              overflow: "hidden",
              background: "var(--muted)",
              border: "1px solid var(--border)",
              // ⚠️ Punteado a la izquierda ⇒ **no se sabe desde cuándo**. No es
              // lo mismo que haber empezado ahí, y por eso se ve distinto.
              borderLeftStyle: m.ventana.inicioDesconocido ? "dotted" : "solid",
            }}
          >
            {/*
              ⚠️ **El fondo es la ventana; el relleno, la cobertura.** Sin
              cobertura no se dibuja relleno: una barra vacía por falta de datos
              y una por falta de trabajo no se dibujan igual (ADR-072).
            */}
            {m.cobertura && (
              <div
                style={{
                  width: pct(m.cobertura.fraccion),
                  height: "100%",
                  background: urgencia ? "var(--urgencia-fill)" : "var(--exito-fill)",
                }}
              />
            )}
          </div>
        ) : (
          <div
            style={{
              position: "absolute",
              inset: "5px 0 auto 0",
              height: 16,
              borderRadius: 4,
              border: "1px dashed var(--border)",
              display: "flex",
              alignItems: "center",
              paddingLeft: 8,
              fontSize: "var(--text-meta)",
              color: "var(--muted-foreground)",
            }}
          >
            {t("HOY.PANORAMA.SIN_VENTANA")}
          </div>
        )}

        {/* El rombo de la evaluación, sobre el fin de la ventana. */}
        {m.ventana && (
          <span
            aria-hidden
            style={{
              position: "absolute",
              left: pct(m.ventana.hasta),
              top: 7,
              transform: "translateX(-50%) rotate(45deg)",
              width: 9,
              height: 9,
              background: urgencia ? "var(--urgencia-texto)" : "var(--foreground)",
            }}
          />
        )}
      </div>

      <span
        style={{
          width: 46,
          flexShrink: 0,
          textAlign: "right",
          fontFamily: "var(--font-mono)",
          fontSize: "var(--text-meta)",
          color: urgencia ? "var(--urgencia-texto)" : "var(--muted-foreground)",
        }}
      >
        {/* Sin fecha la columna **queda vacía**, no en cero. */}
        {m.faltan ?? ""}
      </span>
    </li>
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
  panorama,
  onAvanzar,
  onVerMateria,
  onVerProgreso,
  onAbrirMateria,
}: HoyProps & {
  onAvanzar?: () => void;
  onVerMateria?: (cursadaId: string | null) => void;
  onVerProgreso?: () => void;
  /**
   * Abre una materia **como objeto del espacio de trabajo** —
   * [ADR-088](../../docs/decisions.md#adr-088) §10.6.
   *
   * Es la misma navegación de `CTA-001`; lo que agrega es que el objeto quede
   * abierto para volver. `undefined` ⇒ no hay espacio de trabajo montado
   * (el Track A sin sesión) y **las filas siguen siendo navegación normal**.
   */
  onAbrirMateria?: (m: MateriaEnIndice) => void;
}) {
  /*
    La composición adaptativa de [ADR-089](../../docs/decisions.md#adr-089) §4.

    ⚠️ **El nivel llega decidido**; acá sólo se lo proyecta también en la
    densidad. Ver `seRepliega`.
  */
  const replegado = seRepliega(hero.nivel);
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

      {/*
        **Primera fila: foco y evaluación.** El Hero manda y ocupa dos tercios;
        la evaluación acompaña en el tercero. Por debajo de `lg` se apilan, y el
        Hero queda primero — el contrato de orden semántico de
        `design-system.md` §6.1 rige en todo ancho ([ADR-014](../../docs/decisions.md#adr-014)).

        ⚠️ **Repleg­ada, la evaluación no se dibuja.** A alguien con un
        compromiso incumplido no se le pone una cuenta regresiva al lado de la
        salida.
      */}
      <div className={panorama && !replegado ? "grid gap-4 lg:grid-cols-3" : undefined}>
        <div className={panorama && !replegado ? "lg:col-span-2" : undefined}>
          <HeroContent hero={hero} onAvanzar={onAvanzar} />
        </div>
        {panorama && !replegado && (
          <ProximaEvaluacion panorama={panorama} onAbrirMateria={onAbrirMateria} />
        )}
      </div>

      <MateriasQueue materias={materias} onVerMateria={onVerMateria} />

      {/*
        ⚠️ **El mapa va después del Hero y de las materias, nunca antes.** La
        precedencia de `UX01` es conducta primero y contexto después
        (`product.md` §10.2): un panorama arriba del Hero convierte la pantalla
        que conduce en una que informa.
      */}
      {panorama && !replegado && (
        <MapaDeCatorceDias panorama={panorama} onAbrirMateria={onAbrirMateria} />
      )}

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
