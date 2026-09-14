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
  TituloDeSeccion,
  Fila,
  MarcaDeMateria,
  ReglaDeNegocio,
  TituloDePanel,
} from "./design-system";
import {
  AccionDeObjetoEsqueleto,
  ChipEsqueleto,
  CTAEsqueleto,
  Esqueleto,
  FilaEsqueleto,
  PantallaCargando,
  Renglon,
} from "./esqueleto";
import { colorDeMateria } from "@/lib/domain/color-de-materia";
import { SUBCOPY, t, textoDeDuracion, type CopyId } from "@/lib/content/es-AR";
import { ctaPara } from "@/lib/content/hero";
import type { ClaseEnLista, ColumnaFuente, GanttProjection, MateriaProps, TusClases } from "@/lib/domain/view-models";
import { TIPOS_DE_MARCA } from "@/lib/domain/sesion-de-clase";
import type { RequisitosDeCursado } from "@/lib/domain/requisitos-de-cursado";
import { RequisitosDeCursadoBoton } from "./materia/requisitos";

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

function Gantt({ gantt, color }: { gantt: GanttProjection; color: string }) {
  return (
    <div data-gantt style={tarjeta}>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
        <TituloDeSeccion>{t("MATERIA.TEMAS")}</TituloDeSeccion>
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
          <div style={{ width: `${gantt.barra}%`, height: "100%", background: color }} />
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
        <FilaDeTema key={`${i}-${u.nombre}`} u={u} hoy={gantt.eje.hoy} color={color} />
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
  color,
  u,
  hoy,
}: {
  /** El de la materia — ADR-097. Uno solo para todas las barras: identidad, no estado. */
  color: string;
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

                ADR-097 le pone **el color de la materia**, y la regla sigue en
                pie: es el mismo para todas las barras de esta materia, llueva o
                truene. Lo que distingue un tema de otro sigue siendo la opacidad
                y la palabra, no el tono.
              */
              background: color,
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
          fontSize: "var(--text-label)",
          fontWeight: 500,
          color: "var(--muted-foreground)",
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
  cursadaId,
  evaluacion,
  modoExamen,
  chip,
  ultimoAvance,
  hero,
  catedraYVos,
  gantt,
  clasesDeLaSemana,
  situacionDeCursado,
  actividadReciente,
  verRegistro,
  dimensiones,
  aviso,
  capturaDeClase,
  onAvanzar,
  onCapturar,
  onVerRegistro,
  onModoExamen,
  tusClases,
  tusClasesCargando = false,
  onEntrarAClase,
  onAbrirClase,
  requisitos,
}: MateriaProps & {
  /** *Tus clases* todavía no llegó: va su esqueleto, no la sección vacía (`P-12`). */
  tusClasesCargando?: boolean;
  onAvanzar?: () => void;
  onCapturar?: () => void;
  onVerRegistro?: () => void;
  onModoExamen?: () => void;
  /**
   * *Tus clases* — [ADR-098](../../docs/decisions.md#adr-098) §9. Llega aparte
   * de `MateriaProps`, como el tablero de Hoy: si no carga, la materia se
   * dibuja igual y la sección no está.
   */
  tusClases?: TusClases | null;
  /** `CTA-022`: iniciar una clase de esta materia, o volver a la abierta. */
  onEntrarAClase?: () => void;
  /** Abrir una clase de la lista. **Navegación, no CTA**: no solicita nada al dominio. */
  onAbrirClase?: (clase: ClaseEnLista) => void;
  /**
   * *Requisitos* — [ADR-108](../../docs/decisions.md#adr-108). **Simulados**:
   * llegan aparte, sólo con `MODO_PRUEBA=1`. `null` ⇒ el botón no se dibuja.
   */
  requisitos?: RequisitosDeCursado | null;
}) {
  return (
    <div style={{ background: "var(--background)" }}>
      <TituloDePanel
        titulo={t("MATERIA.TITULO")}
        meta={
          // La marca de la materia delante de su nombre — ADR-097, el mismo
          // punto que tiene en el índice y en Hoy.
          <>
            <span style={{ display: "inline-flex", verticalAlign: "middle", marginRight: 8 }}>
              <MarcaDeMateria cursadaId={cursadaId} />
            </span>
            {materia}
          </>
        }
        subcopy={SUBCOPY.UX02}
        acciones={
          // `CTA-009` — el historial completo de **esta** materia. Va arriba a
          // la derecha, como acción del objeto (§11.9.3) y como en `UX01`: es
          // navegación de lectura y no compite con la CTA primaria.
          // *Requisitos* (ADR-108) va a su izquierda: también es lectura.
          requisitos || verRegistro ? (
            <>
              {requisitos && <RequisitosDeCursadoBoton requisitos={requisitos} />}
              {verRegistro && <AccionDeObjeto onClick={onVerRegistro}>{verRegistro}</AccionDeObjeto>}
            </>
          ) : undefined
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
          {gantt && <Gantt gantt={gantt} color={cursadaId ? colorDeMateria(cursadaId) : "var(--foreground)"} />}

          {/*
            `CLASES DE LA SEMANA` — el horario de cursado (ADR-063).

            ⚠️ **Solo muestra.** Decisión del owner, textual: *"solo mostrar, no
            agendar"*. No ofrece acción, no reserva un hueco y no le descuenta
            nada al presupuesto de estudio.

            `null` ⇒ no se sabe el horario. No saberlo no es tener la semana libre.
          */}
          {(clasesDeLaSemana || situacionDeCursado) && (
            <div data-horario style={tarjeta}>
              <TituloDeSeccion>{t("MATERIA.CLASES")}</TituloDeSeccion>
              {/* ADR-105: la comisión y «no se sabe», dichos. Omitir si no hay nada. */}
              {situacionDeCursado?.comision && (
                <p data-comision style={{ ...meta, margin: "6px 0 0" }}>{situacionDeCursado.comision}</p>
              )}
              {situacionDeCursado?.horarioDesconocido && (
                <p data-horario-desconocido style={{ ...meta, margin: "6px 0 0" }}>{t("MATERIA.HORARIO_DESCONOCIDO")}</p>
              )}
              {clasesDeLaSemana && (
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
                    {/* ADR-094. `null` ⇒ no se sabe dónde, y la parte se omite. */}
                    {b.aula && <span style={{ marginLeft: 8 }}>{b.aula}</span>}
                    <span style={{ ...meta, marginLeft: 8 }}>{b.procedencia}</span>
                  </span>
                ))}
              </div>
              )}
            </div>
          )}

          {tusClases && (
            <SeccionTusClases t={tusClases} onEntrar={onEntrarAClase} onAbrir={onAbrirClase} />
          )}
          {!tusClases && tusClasesCargando && <TusClasesEsqueleto />}

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
              <TituloDeSeccion>{t("MATERIA.PROXIMO_PASO")}</TituloDeSeccion>
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
              <TituloDeSeccion>{t("MATERIA.ACTIVIDAD")}</TituloDeSeccion>
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
              <TituloDeSeccion>{t("MATERIA.EVALUACION")}</TituloDeSeccion>
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
              <TituloDeSeccion>{t("MATERIA.REGISTRO")}</TituloDeSeccion>
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
              <TituloDeSeccion>{t("MATERIA.DIMENSIONES")}</TituloDeSeccion>
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
              <TituloDeSeccion>{t("MATERIA.CATEDRA_Y_VOS")}</TituloDeSeccion>
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

// ── Mientras carga ───────────────────────────────────────────────────────────

/** *Tus clases* mientras la lista no llegó: el título y la regla, reales. */
function TusClasesEsqueleto() {
  return (
    <section aria-hidden style={tarjeta}>
      <p className="titulo-de-seccion" style={{ margin: 0 }}>
        {t("MATERIA.TUS_CLASES")}
      </p>
      <ReglaDeNegocio>{t("MATERIA.TUS_CLASES.REGLA")}</ReglaDeNegocio>
      <ul style={{ marginTop: 8 }}>
        {[0, 1].map((i) => (
          <li key={i} className="hairline-b" style={{ padding: "8px 0" }}>
            <Renglon cuerpo="label" ancho={120} />
            <Renglon cuerpo="meta" ancho={200} />
          </li>
        ))}
      </ul>
    </section>
  );
}

/**
 * `UX02` mientras sus datos no llegaron — `P-12`.
 *
 * La misma grilla de dos columnas, con el Gantt, las clases, el próximo paso y
 * la actividad a la izquierda, y evaluación, registro y dimensiones a la
 * derecha. Los títulos de sección van reales: no dependen de la materia.
 */
export function MateriaCursadoEsqueleto() {
  return (
    <PantallaCargando style={{ background: "var(--background)" }}>
      <TituloDePanel
        titulo={t("MATERIA.TITULO")}
        meta={<Renglon cuerpo="body" ancho={220} />}
        subcopy={SUBCOPY.UX02}
        acciones={<AccionDeObjetoEsqueleto />}
      />
      <EstadoGeneral>
        <ChipEsqueleto />
      </EstadoGeneral>
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
          <div style={tarjeta}>
            <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
              <TituloDeSeccion>{t("MATERIA.TEMAS")}</TituloDeSeccion>
              <Renglon cuerpo="meta" ancho={160} />
            </div>
            <Esqueleto alto={6} radio={3} style={{ margin: "10px 0 4px" }} />
            <div style={{ display: "flex", gap: 12, alignItems: "center", padding: "10px 0 4px" }}>
              <span style={{ ...celdaDeTema, ...meta }}>{t("MATERIA.EJE_TEMA")}</span>
              <div style={{ flex: 1, height: 14 }} />
              <span style={{ ...celdaDeEstado, ...meta, textAlign: "right" }}>{t("MATERIA.EJE_ESTADO")}</span>
            </div>
            {[0, 1, 2, 3, 4].map((i) => (
              <div
                key={i}
                style={{ display: "flex", gap: 12, alignItems: "center", padding: "8px 0", borderTop: "1px solid var(--border)" }}
              >
                <span style={celdaDeTema}>
                  <Renglon cuerpo="body" ancho={[150, 120, 180, 100, 140][i]} />
                </span>
                <div style={{ position: "relative", flex: 1, height: 18 }}>
                  <Esqueleto
                    ancho={`${[30, 22, 36, 18, 26][i]}%`}
                    alto={10}
                    radio={5}
                    style={{ position: "absolute", top: 4, left: `${[4, 20, 34, 50, 62][i]}%` }}
                  />
                </div>
                <span style={{ ...celdaDeEstado, display: "flex", justifyContent: "flex-end" }}>
                  <Renglon cuerpo="meta" ancho={80} />
                </span>
              </div>
            ))}
          </div>

          <div style={tarjeta}>
            <TituloDeSeccion>{t("MATERIA.CLASES")}</TituloDeSeccion>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 8 }}>
              {[180, 160].map((ancho) => (
                <AccionDeObjetoEsqueleto key={ancho} ancho={ancho} />
              ))}
            </div>
          </div>

          <TusClasesEsqueleto />

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 16 }}>
            <div style={tarjeta}>
              <TituloDeSeccion>{t("MATERIA.PROXIMO_PASO")}</TituloDeSeccion>
              <Renglon cuerpo="label" ancho="60%" />
              <Renglon cuerpo="body" ancho="80%" style={{ margin: "6px 0" }} />
              <Renglon cuerpo="label" ancho="90%" />
              <div style={{ marginTop: 8 }}>
                <CTAEsqueleto />
              </div>
            </div>
            <div style={tarjeta}>
              <TituloDeSeccion>{t("MATERIA.ACTIVIDAD")}</TituloDeSeccion>
              <Renglon cuerpo="title-sm" ancho="55%" style={{ margin: "6px 0" }} />
              <Renglon cuerpo="label" ancho="75%" />
            </div>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 16, minWidth: 0 }}>
          <div style={tarjeta}>
            <TituloDeSeccion>{t("MATERIA.EVALUACION")}</TituloDeSeccion>
            <Renglon cuerpo="title-sm" ancho="65%" style={{ margin: "6px 0" }} />
            <Renglon cuerpo="label" ancho="85%" />
          </div>
          <div style={tarjeta}>
            <TituloDeSeccion>{t("MATERIA.REGISTRO")}</TituloDeSeccion>
            {[0, 1, 2].map((i) => (
              <div key={i} style={{ padding: "8px 0", borderTop: i === 0 ? undefined : "1px solid var(--border)" }}>
                <Renglon cuerpo="body" ancho={["80%", "65%", "72%"][i]} />
                <Renglon cuerpo="meta" ancho="50%" />
              </div>
            ))}
          </div>
          <div style={tarjeta}>
            <TituloDeSeccion>{t("MATERIA.DIMENSIONES")}</TituloDeSeccion>
            {[0, 1, 2, 3].map((i) => (
              <FilaEsqueleto key={i} />
            ))}
          </div>
        </div>
      </div>
    </PantallaCargando>
  );
}

const COPY_DE_MARCA: Record<(typeof TIPOS_DE_MARCA)[number], CopyId> = {
  QUESTION: "CLASE.MARCA.QUESTION",
  IMPORTANT: "CLASE.MARCA.IMPORTANT",
  ASSESSMENT: "CLASE.MARCA.ASSESSMENT",
  REVIEW: "CLASE.MARCA.REVIEW",
};

/**
 * *Tus clases* — [ADR-098](../../docs/decisions.md#adr-098) §9.
 *
 * ⚠️ **Distinta del panel «Clases de la semana»**, que es el horario, y de las
 * clases dictadas, que son de la cátedra. Éstas las abrió el estudiante: fecha,
 * duración y cuántas marcas de cada tipo, **derivadas**. Sin apuntes: se leen
 * adentro.
 */
function SeccionTusClases({
  t: tus,
  onEntrar,
  onAbrir,
}: {
  t: TusClases;
  onEntrar?: () => void;
  onAbrir?: (c: ClaseEnLista) => void;
}) {
  return (
    <section data-tus-clases aria-labelledby="materia-tus-clases" style={tarjeta}>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 8 }}>
        <h2 id="materia-tus-clases" className="titulo-de-seccion" style={{ margin: 0 }}>
          {t("MATERIA.TUS_CLASES")}
        </h2>
        {tus.entrada && onEntrar && (
          <AccionDeObjeto onClick={onEntrar}>
            {t(tus.entrada === "INICIAR" ? "MATERIA.TUS_CLASES.INICIAR" : "MATERIA.TUS_CLASES.VOLVER")}
          </AccionDeObjeto>
        )}
      </div>
      <ReglaDeNegocio>{t("MATERIA.TUS_CLASES.REGLA")}</ReglaDeNegocio>
      {tus.clases.length === 0 ? (
        <p style={{ ...meta, marginTop: 8 }}>{t("MATERIA.TUS_CLASES.VACIO")}</p>
      ) : (
        <ul style={{ marginTop: 8 }}>
          {tus.clases.map((c) => {
            const marcas = TIPOS_DE_MARCA.filter((tipo) => c.resumen[tipo] > 0)
              .map((tipo) => `${c.resumen[tipo]} ${t(COPY_DE_MARCA[tipo])}`)
              .join(" · ");
            const cuanto =
              c.estado === "ACTIVE"
                ? t("MATERIA.TUS_CLASES.EN_CURSO")
                : c.duracionMinutos !== null
                  ? textoDeDuracion(c.duracionMinutos)
                  : null;
            const contenido = (
              <>
                <span style={{ fontSize: "var(--text-label)", fontWeight: 500 }}>{c.fecha}</span>
                <span style={meta}>
                  {[cuanto, marcas || t("MATERIA.TUS_CLASES.SIN_MARCAS")].filter(Boolean).join(" · ")}
                </span>
              </>
            );
            return (
              <li key={c.id} className="hairline-b" data-clase-en-lista={c.estado}>
                {onAbrir ? (
                  <button
                    type="button"
                    onClick={() => onAbrir(c)}
                    style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", width: "100%", padding: "8px 0", textAlign: "left" }}
                  >
                    {contenido}
                  </button>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", padding: "8px 0" }}>{contenido}</div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
