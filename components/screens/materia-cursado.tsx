"use client";

/**
 * ACHIEVE — Materia / Cursado (VI.2). Copy literal §7 (wireframe base).
 * Parametrizada en la Etapa 0.2: JSX y copy preservados, datos por props.
 */

import {
  AccionDeObjeto,
  CTAPrincipal,
  CTASecundaria,
  EstadoChip,
  EstadoGeneral,
  Eyebrow,
  Fila,
  ReglaDeNegocio,
  TituloDePanel,
} from "./design-system";
import { SUBCOPY, t } from "@/lib/content/es-AR";
import { ctaPara } from "@/lib/content/hero";
import type { ColumnaFuente, GanttProjection, MateriaProps } from "@/lib/domain/view-models";

/**
 * **El Gantt de preparación** — [ADR-072](../../docs/decisions.md#adr-072).
 *
 * Una barra por materia y una fila por unidad, **en el orden dictado** — el que
 * llega en las props, que la pantalla no reordena.
 *
 * ## Las tres cosas que este componente tiene prohibido hacer
 *
 * 1. **Tratar `barra: null` como `0`.** Sin estimación no hay barra: hay el
 *    texto del pie, que dice por qué. Una barra vacía por falta de datos y una
 *    por falta de trabajo no se ven igual.
 * 2. **Mostrar el número sin la aclaración.** Van juntos o no va ninguno: el
 *    porcentaje solo se lee como una nota, y la nota al pie es lo único que lo
 *    impide.
 * 3. **Decidir nada.** El porcentaje, el orden y el texto llegan calculados. La
 *    pantalla proyecta.
 */
const meta = { fontSize: "var(--text-meta)", color: "var(--muted-foreground)" } as const;
const celdaDeTema = { width: 230, flexShrink: 0 } as const;
const celdaDeEstado = { width: 130, flexShrink: 0 } as const;
const tarjeta = {
  border: "1px solid var(--border)",
  borderRadius: "var(--radius)",
  background: "var(--card)",
  padding: 16,
} as const;

function Gantt({ gantt }: { gantt: GanttProjection }) {
  return (
    <div data-gantt style={tarjeta}>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
        <Eyebrow>{t("MATERIA.TEMAS")}</Eyebrow>
        <span style={{ fontSize: "var(--text-meta)", color: "var(--muted-foreground)" }}>
          {gantt.pie}
        </span>
      </div>

      {/*
        ⚠️ **Sin colores de calificación.** Textual de la psicopedagoga: *"evitar
        colores propios de calificación —rojo/verde— para el porcentaje de
        actividad"*. La barra usa el color de texto, que no significa nada.

        Y el rótulo visible es **`actividad registrada`**, no `dominio`, `nivel`,
        `rendimiento` ni `avance de aprendizaje` (ADR-075 §C1).
      */}
      {gantt.barra !== null && (
        <div
          role="img"
          aria-label={gantt.pie}
          style={{
            height: 6,
            borderRadius: 3,
            background: "var(--muted)",
            overflow: "hidden",
            margin: "10px 0 4px",
          }}
        >
          <div style={{ width: `${gantt.barra}%`, height: "100%", background: "var(--foreground)" }} />
        </div>
      )}

      {/* El eje del período — el mismo que el índice de materias (ADR-078). */}
      <div style={{ display: "flex", gap: 12, alignItems: "center", padding: "10px 0 4px" }}>
        <span style={{ ...celdaDeTema, ...meta }}>{t("MATERIA.EJE_TEMA")}</span>
        <div style={{ position: "relative", flex: 1, height: 14 }}>
          {gantt.eje.marcas.map((m) => (
            <span
              key={m.etiqueta}
              style={{
                ...meta,
                position: "absolute",
                left: `${m.posicion * 100}%`,
                transform: "translateX(-50%)",
                whiteSpace: "nowrap",
                fontWeight: m.esHoy ? 600 : 400,
              }}
            >
              {m.etiqueta}
            </span>
          ))}
        </div>
        <span style={{ ...celdaDeEstado, ...meta, textAlign: "right" }}>
          {t("MATERIA.EJE_ESTADO")}
        </span>
      </div>

      {gantt.unidades.map((u, i) => (
        <FilaDeTema key={`${i}-${u.nombre}`} u={u} hoy={gantt.eje.hoy} />
      ))}

      {/*
        §C1: *"Entregas que requieren revisión: X, cuando corresponda"*. En cero
        la línea **no se dibuja**.
      */}
      {gantt.enRevision > 0 && (
        <ReglaDeNegocio>
          {t("MATERIA.GANTT.REVISION")} {gantt.enRevision}
        </ReglaDeNegocio>
      )}

      {/*
        El número y su aclaración van juntos o no va ninguno: el porcentaje solo
        se lee como una nota, y esta línea es lo único que lo impide.
      */}
      {gantt.aclaracion && <ReglaDeNegocio>{gantt.aclaracion}</ReglaDeNegocio>}
    </div>
  );
}

/**
 * Una fila del Gantt por tema — [ADR-085](../../docs/decisions.md#adr-085).
 *
 * ⚠️ **La barra no se dibuja si el tema no se puede ubicar**, y en su lugar va
 * el motivo. Las dos puntas son hechos —la primera clase que lo dictó y la
 * evaluación que declara cubrirlo— y ninguna se estima: poner un tema en «+7
 * días» porque es el séptimo de la lista sería inventar un plan de estudio.
 */
function FilaDeTema({
  u,
  hoy,
}: {
  u: GanttProjection["unidades"][number];
  hoy: number;
}) {
  const ubicado = u.desde !== null && u.hasta !== null;
  return (
    <div
      style={{
        display: "flex",
        gap: 12,
        alignItems: "center",
        padding: "8px 0",
        borderTop: "1px solid var(--border)",
      }}
    >
      <span style={celdaDeTema}>
        {u.codigo && <span style={{ ...meta, marginRight: 6 }}>{u.codigo}</span>}
        <span style={{ fontSize: "var(--text-body)" }}>{u.nombre}</span>
      </span>

      <div style={{ position: "relative", flex: 1, height: 18 }}>
        {/* La línea de hoy. Es una marca del eje, no una decoración. */}
        <div
          style={{
            position: "absolute",
            left: `${hoy * 100}%`,
            top: 0,
            bottom: 0,
            width: 1,
            background: "var(--border)",
          }}
        />
        {ubicado && (
          <div
            style={{
              position: "absolute",
              left: `${u.desde! * 100}%`,
              // Un tema dictado y evaluado el mismo día es un punto, no nada:
              // el mínimo lo hace visible sin mover ninguna de las dos puntas.
              width: `max(10px, ${(u.hasta! - u.desde!) * 100}%)`,
              top: 4,
              height: 10,
              borderRadius: 5,
              /*
                ⚠️ **Un solo color, y no significa nada.** El mockup pintaba cada
                estado de un color —verde «dominado», ámbar «leído»— y eso es
                exactamente la escala de calificación que ADR-075 §C1 descarta.
                El estado se lee en su columna, con palabras.
              */
              background: "var(--foreground)",
              opacity: u.estado === "sin_evidencia" ? 0.18 : 0.75,
            }}
          />
        )}
      </div>

      <span style={{ ...celdaDeEstado, textAlign: "right" }}>
        <span style={{ ...meta, color: "var(--muted-foreground)" }}>{u.nota ?? u.etiqueta}</span>
      </span>
    </div>
  );
}

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

/**
 * `UX02` — el cursado de una materia, con el layout que pidió el owner
 * ([ADR-085](../../docs/decisions.md#adr-085)).
 *
 * ## El orden es una decisión del owner, tomada contra el spec
 *
 * `VI.2` §1 pide *"la acción ocupa el primer viewport… no obligan al alumno a
 * analizar un tablero para descubrir qué hacer"*. **La captura invierte eso**:
 * el Gantt arriba y el próximo paso al pie. Se construyó así porque el owner lo
 * eligió con las dos opciones delante, que es como ADR-054 pidió que se tomaran
 * las decisiones de esta pantalla. Queda dicho para que no se lea como un
 * descuido.
 *
 * ## Lo único del mockup que NO se copió
 *
 * El `CURSÁS · Lun 14:00–16:00` de la tarjeta de evaluación **repetía** el panel
 * «Clases de la semana», que además lleva la procedencia de cada bloque. La
 * misma cosa en dos lugares es `C-02` roto, y es el defecto que ya se corrigió
 * una vez en `UX01` con `CTA-009`.
 */
export function MateriaCursado({
  materia,
  evaluacion,
  modoExamen,
  chip,
  ultimoAvance,
  hero,
  catedraYVos,
  gantt,
  clasesDeLaSemana,
  actividadReciente,
  verRegistro,
  dimensiones,
  aviso,
  capturaDeClase,
  onAvanzar,
  onCapturar,
  onVerRegistro,
  onModoExamen,
}: MateriaProps & {
  onAvanzar?: () => void;
  onCapturar?: () => void;
  onVerRegistro?: () => void;
  onModoExamen?: () => void;
}) {
  return (
    <div style={{ background: "var(--background)", padding: 16, borderRadius: "var(--radius)" }}>
      <TituloDePanel
        eyebrow={materia}
        titulo={t("MATERIA.TITULO")}
        subcopy={SUBCOPY.UX02}
        acciones={
          // `CTA-009` — el historial completo de **esta** materia. Va arriba a
          // la derecha, como acción del objeto (§11.9.3) y como en `UX01`: es
          // navegación de lectura y no compite con la CTA primaria.
          verRegistro ? <AccionDeObjeto onClick={onVerRegistro}>{verRegistro}</AccionDeObjeto> : undefined
        }
      />

      <EstadoGeneral>
        {/* Sin lectura de estado no se dibuja un chip: ver `MateriaProps.chip`. */}
        {chip && <EstadoChip tone={chip.tono}>{chip.texto}</EstadoChip>}
        {ultimoAvance && (
          <span style={{ marginLeft: 8, fontWeight: 400, color: "var(--muted-foreground)" }}>
            {ultimoAvance}
          </span>
        )}
      </EstadoGeneral>

      {/* Estado vacío, incompleto o de error: se dice, no se disimula. */}
      {aviso && (
        <ReglaDeNegocio>
          <span style={{ color: "var(--urgencia-texto)" }}>{aviso}</span>
        </ReglaDeNegocio>
      )}

      {/*
        Dos columnas, como la captura. **360 px es el piso móvil** (ADR-014): por
        debajo del ancho de la grilla las dos columnas se apilan solas, porque
        `minmax` no fuerza el lateral a caber donde no entra.
      */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
          gap: 16,
          alignItems: "start",
          marginTop: 12,
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 16, gridColumn: "span 2", minWidth: 0 }}>
          {/*
            ⚠️ **Sin unidades no hay Gantt, y no se dibuja uno vacío.** El mensaje
            de esa ausencia ya lo da el hero con `CONTEXTO_INCOMPLETO`; repetirlo
            con una tabla en blanco diría dos veces lo mismo.
          */}
          {gantt && <Gantt gantt={gantt} />}

          {/*
            `CLASES DE LA SEMANA` — el horario de cursado (ADR-063).

            ⚠️ **Solo muestra.** Decisión del owner, textual: *"solo mostrar, no
            agendar"*. No ofrece acción, no reserva un hueco y no le descuenta
            nada al presupuesto de estudio.

            `null` ⇒ no se sabe el horario. No saberlo no es tener la semana libre.
          */}
          {clasesDeLaSemana && (
            <div data-horario style={tarjeta}>
              <Eyebrow>{t("MATERIA.CLASES")}</Eyebrow>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 8 }}>
                {clasesDeLaSemana.map((b) => (
                  <span
                    key={b.cuando}
                    style={{
                      border: "1px solid var(--border)",
                      borderRadius: "var(--radius-pildora)",
                      padding: "5px 12px",
                      fontSize: "var(--text-label)",
                    }}
                    title={b.procedencia}
                  >
                    {b.cuando}
                    <span style={{ ...meta, marginLeft: 8 }}>{b.procedencia}</span>
                  </span>
                ))}
              </div>
            </div>
          )}

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
              gap: 16,
            }}
          >
            {/*
              `PRÓXIMO PASO SUGERIDO`. La CTA vive **acá adentro**: el owner
              eligió este orden, y una tarjeta que propone algo sin manera de
              aceptarlo sería una descripción, no una propuesta.
            */}
            <div style={tarjeta}>
              <Eyebrow>{t("MATERIA.PROXIMO_PASO")}</Eyebrow>
              {hero.contexto && <ReglaDeNegocio>{hero.contexto}</ReglaDeNegocio>}
              <p style={{ fontSize: "var(--text-body)", fontWeight: 600, margin: "6px 0" }}>
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
                    hero.evidenciaEsperada ? `${t("MATERIA.ENTREGA")} ${hero.evidenciaEsperada}` : null,
                  ]
                    .filter((p): p is string => p !== null)
                    .join(" · ")}
                </ReglaDeNegocio>
              )}
              <CTAPrincipal onClick={onAvanzar}>{ctaPara(hero.nivel, hero.variante)}</CTAPrincipal>
            </div>

            <div style={tarjeta}>
              {/*
                El mockup la titulaba «ÚLTIMA ACTIVIDAD». Se usa el nombre del
                spec —`VI.2` §8.7, *"Actividad reciente"*— porque es **el mismo
                concepto**, y dos palabras para una cosa es `C-02` roto. Hay
                guard de vocabulario y lo caza.
              */}
              <Eyebrow>{t("MATERIA.ACTIVIDAD")}</Eyebrow>
              {/*
                `null` ⇒ **no hay actividad registrada**, y se dice. «Hace 0
                días» sería inventar una que no ocurrió.
              */}
              <p style={{ fontSize: "var(--text-title-sm)", fontWeight: 600, margin: "6px 0" }}>
                {ultimoAvance ?? t("COMUN.SIN_AVANCE")}
              </p>
              {actividadReciente?.[0] && (
                <ReglaDeNegocio>{actividadReciente[0].titulo}</ReglaDeNegocio>
              )}
            </div>
          </div>

          {/*
            Captura de "pasó algo en clase". Es un reporte del alumno:
            registrarlo durante una clase NO lo convierte en voz de la cátedra, y
            ninguna capa eleva su verificación (AGENTS.md §2.6).
          */}
          {capturaDeClase && <CTASecundaria onClick={onCapturar}>{capturaDeClase}</CTASecundaria>}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 16, minWidth: 0 }}>
          {/*
            La tarjeta de evaluación. `null` ⇒ **no hay evaluación registrada** y
            no se dibuja: no se inventa una fecha ni se ofrece activar un Modo
            Examen sobre nada.
          */}
          {evaluacion && (
            <div data-evaluacion style={tarjeta}>
              <Eyebrow>{t("MATERIA.EVALUACION")}</Eyebrow>
              <p style={{ fontSize: "var(--text-title-sm)", fontWeight: 600, margin: "6px 0" }}>
                {evaluacion.titulo}
              </p>
              {evaluacion.detalle && <ReglaDeNegocio>{evaluacion.detalle}</ReglaDeNegocio>}
              {/*
                `CTA-019` — la entrada manual a Modo Examen desde la materia
                (ADR-016). **No hay readiness**: activar no afirma que esté
                listo, y no se muestra ningún score (ADR-011, `C01-029`).
              */}
              {modoExamen && (
                <CTASecundaria onClick={onModoExamen}>{modoExamen}</CTASecundaria>
              )}
            </div>
          )}

          {/*
            `REGISTRO` — la preview de la Bitácora (`VI.2` §8.7).

            **La misma verdad que `UX06`, y a propósito.** `VI.6` §8.3: *"no
            existe una segunda fuente histórica"*. Lo único que cambia es cuántas
            entradas entran, y el corte lo hace la base.
          */}
          {actividadReciente && (
            <div data-actividad style={tarjeta}>
              <Eyebrow>{t("MATERIA.REGISTRO")}</Eyebrow>
              {actividadReciente.map((e, i) => (
                <div
                  key={`${i}-${e.titulo}`}
                  style={{ padding: "8px 0", borderTop: i === 0 ? undefined : "1px solid var(--border)" }}
                >
                  <span style={{ ...meta, marginRight: 8 }}>{e.detalle}</span>
                  <span style={{ fontSize: "var(--text-body)" }}>{e.titulo}</span>
                  <p style={meta}>{e.provenance ?? t("PROVENANCE.NO_DISPONIBLE")}</p>
                </div>
              ))}
            </div>
          )}

          {/*
            Las dimensiones, separadas. Confianza no es dominio: una confianza
            alta con dominio no evaluado son dos hechos distintos, y la vista
            **no genera una Action** a partir de la brecha.
          */}
          {dimensiones.length > 0 && (
            <div style={tarjeta}>
              <Eyebrow>{t("MATERIA.DIMENSIONES")}</Eyebrow>
              {dimensiones.map((d) => (
                <Fila key={d.label} label={d.label} value={d.valor} ausencia={d.ausencia} tono={d.tono} />
              ))}
            </div>
          )}

          {/*
            `P-08`: cátedra y estudiante en columnas separadas, nunca fusionadas.
          */}
          {catedraYVos && (
            <div style={tarjeta}>
              <Eyebrow>{t("MATERIA.CATEDRA_Y_VOS")}</Eyebrow>
              <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
                <Columna fuente={catedraYVos.catedra} />
                <Columna fuente={catedraYVos.vos} />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
