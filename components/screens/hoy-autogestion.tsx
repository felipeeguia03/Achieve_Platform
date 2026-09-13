"use client";

/**
 * ACHIEVE — Hoy / Autogestión (VI.1)
 *
 * La pantalla **proyecta, no decide** (AGENTS.md §2.2). El nivel del Hero llega
 * ya resuelto por `selectHeroLevel` (`lib/domain/precedence.ts`); acá no se
 * rankea, no se prioriza y no se elige entre recomendaciones.
 *
 * Desde [ADR-093](../../docs/decisions.md#adr-093) es además un **tablero**, y
 * desde [ADR-096](../../docs/decisions.md#adr-096) tiene exactamente tres
 * cuerpos: **el Hero**, **el cuadro de hoy** al lado
 * ([ADR-094](../../docs/decisions.md#adr-094)) y **los riesgos de
 * planificación**. Los dos últimos **llegan redactados** en `TableroProps`: esta
 * pantalla no evalúa ninguna regla.
 *
 * Lo que salió de acá, por decisión del owner: la cola de materias `1 de N`, el
 * mapa de catorce días y el reparto (ADR-093), y **las dos opciones de
 * evaluaciones —tarjetas y carril—, que se descartaron juntas** (ADR-096). Los
 * datos que siguen llegando en `HoyProps` **no se dibujan**: lo que se retiró es
 * su dibujo, no el contrato.
 */

import {
  AccionDeObjeto,
  Eyebrow,
  EstadoGeneral,
  ReglaDeNegocio,
  HeroCard,
  EstadoChip,
  CTAPrincipal,
  MarcaDeMateria,
  TituloDePanel,
} from "./design-system";
import { colorDeMateria } from "@/lib/domain/color-de-materia";
import { SUBCOPY, t } from "@/lib/content/es-AR";
import { ctaPara, ofreceCta } from "@/lib/content/hero";
import { nombreDeObjeto } from "@/lib/domain/nombre-de-objeto";
import type {
  CuadroDeHoy,
  HeroProjection,
  HoyProps,
  RecuperacionProjection,
  RiesgoProyectado,
  TableroProps,
} from "@/lib/domain/view-models";
import type { HeroLevel } from "@/lib/domain/precedence";

/** Lo mínimo para abrir una materia: su cursada y cómo se llama. */
type AbrirMateria = (m: { cursadaId: string; nombre: string }) => void;

const MONO = { fontFamily: "var(--font-mono)", fontSize: "var(--text-meta)" } as const;
const TARJETA = {
  border: "1px solid var(--border)",
  borderRadius: "var(--radius)",
  background: "var(--card)",
} as const;

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

/**
 * El contexto del Hero **sin repetir el título** — ADR-088 Enmienda 5, *"la
 * segunda vez que aparece el nombre borralo"*. Si el contexto termina en el
 * mismo tema que el título, esa última parte se va. Es presentación: el dato no
 * se toca.
 */
function contextoSinEco(contexto: string, titulo: string | null): string {
  const partes = contexto.split(" · ");
  const ultima = partes.at(-1);
  if (titulo && partes.length > 1 && ultima && ultima.toLowerCase() === titulo.toLowerCase()) {
    return partes.slice(0, -1).join(" · ");
  }
  return contexto;
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

  // Mayúscula sólo en la primera letra (ADR-088 E5): el catálogo trae los temas
  // TODO EN MAYÚSCULAS y así pesaban más que la acción. Lo bien escrito no se toca.
  const titulo = nombreDeObjeto(hero.titulo);
  const contexto = hero.contexto ? contextoSinEco(nombreDeObjeto(hero.contexto), titulo) : null;

  return (
    <HeroCard>
      {hero.chip && <EstadoChip tone={hero.chip.tono}>{hero.chip.texto}</EstadoChip>}
      {contexto && <Eyebrow>{contexto}</Eyebrow>}
      <p style={{ fontSize: 24, lineHeight: 1.2, letterSpacing: "-0.015em", fontWeight: 600, color: "var(--foreground)" }}>
        {titulo}
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
 * La explicación de la propia señal — Etapa B6.6.2.
 *
 * Va **debajo del estado general y encima del Hero**, y en ese orden a
 * propósito: el estado dice *qué pasa*, esto dice *por qué*, y el Hero dice
 * *qué hacer*.
 *
 * **No lleva CTA**, y no es un olvido. `VI.1` §3.3: el riesgo *"no gana
 * automáticamente el Hero"*.
 *
 * ⚠️ **No confundir con los riesgos de planificación** de más abajo: esto es
 * `RiskSignal`, el patrón de error; aquello mira el calendario (ADR-093).
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
      <ReglaDeNegocio>{r.detalle}</ReglaDeNegocio>
      {r.queSigue ? <ReglaDeNegocio>{r.queSigue}</ReglaDeNegocio> : null}
    </section>
  );
}

/**
 * ¿La pantalla se repliega? — [ADR-089](../../docs/decisions.md#adr-089) §4,
 * que ADR-093 conserva.
 *
 * ⚠️ **Esto NO decide nada.** El nivel llega resuelto por `selectHeroLevel`;
 * acá sólo se proyecta ese mismo nivel **en el eje de la densidad**. Al que está
 * atrasado se le muestra menos, no más: un tablero entero encima de un
 * compromiso incumplido es una razón más para cerrar la pantalla.
 */
function seRepliega(nivel: HeroLevel): boolean {
  return nivel === "RESCUE_REQUIRED" || nivel === "COMMITMENT_MISSED";
}

// ── Encabezado ────────────────────────────────────────────────────────────────

/**
 * La píldora de la referencia: la fecha y **el único número que ordena el día**.
 * Sin tablero, o sin ninguna fecha cargada, queda la fecha sola: no se dice
 * «0 días» ni «sin evaluaciones».
 */
function Pildora({ fecha, proxima }: { fecha: string; proxima: TableroProps["proximaEvaluacion"] }) {
  const cerca = proxima !== null && proxima.dias <= 7;
  return (
    <span
      className="inline-flex items-center gap-2"
      style={{
        ...TARJETA,
        borderRadius: 999,
        padding: "6px 14px",
        fontSize: "var(--text-label)",
        color: "var(--muted-foreground)",
        whiteSpace: "nowrap",
      }}
    >
      <span
        aria-hidden
        style={{
          width: 7,
          height: 7,
          borderRadius: 999,
          background: cerca ? "var(--urgencia-texto)" : "var(--muted-foreground)",
        }}
      />
      <span>{fecha}</span>
      {proxima !== null && (
        <>
          <span aria-hidden>·</span>
          {proxima.dias === 0 ? (
            <strong style={{ color: "var(--foreground)" }}>{t("HOY.PILDORA.HOY")}</strong>
          ) : (
            <span>
              <strong style={{ color: "var(--foreground)" }}>
                {proxima.dias === 1 ? "1 día" : `${proxima.dias} días`}
              </strong>{" "}
              {t("HOY.PILDORA.DIAS")}
            </span>
          )}
        </>
      )}
    </span>
  );
}

// ── Tu día ───────────────────────────────────────────────────────────────────

function Subtitulo({ children }: { children: React.ReactNode }) {
  return (
    <p style={{ ...MONO, color: "var(--muted-foreground)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 2 }}>
      {children}
    </p>
  );
}

function Vacio({ children }: { children: React.ReactNode }) {
  return <p style={{ fontSize: "var(--text-label)", color: "var(--muted-foreground)" }}>{children}</p>;
}

/**
 * **El cuadro de hoy** — [ADR-094](../../docs/decisions.md#adr-094), en la
 * columna que [ADR-015](../../docs/decisions.md#adr-015) reserva para la
 * *continuidad*. Tres bloques y poca información: las clases de hoy con su
 * unidad y su aula, lo que podés avanzar, y los horarios.
 *
 * ⚠️ **No es una agenda**: las clases y los horarios no tienen un solo botón. Lo
 * único que se toca es el nombre de una materia en *Podés avanzar*, y abre esa
 * materia (`CTA-001`) — navegación, no una acción nueva.
 */
function CuadroHoy({ c, onAbrir }: { c: CuadroDeHoy; onAbrir?: AbrirMateria }) {
  return (
    <section aria-label={t("HOY.CUADRO")} className="space-y-3" style={{ ...TARJETA, padding: "14px 16px" }}>
      <Eyebrow>{t("HOY.CUADRO")}</Eyebrow>

      <div data-bloque="clases">
        <Subtitulo>{t("HOY.CUADRO.CLASES")}</Subtitulo>
        {c.clases.length === 0 ? (
          <Vacio>{t("HOY.CUADRO.CLASES.VACIO")}</Vacio>
        ) : (
          /*
            Dos renglones, y no uno: en una sola línea el aula se cortaba
            —`Aula 3…`— y un dato que no se puede leer es lo mismo que no
            tenerlo (`A-03`: el modo compacto reduce tamaño, nunca información).
          */
          c.clases.map((cl) => (
            <div key={`${cl.cursadaId}-${cl.hora}`} style={{ marginBottom: 4 }}>
              <p className="truncate" title={cl.materia} style={{ fontSize: "var(--text-label)", lineHeight: 1.5 }}>
                <span style={{ ...MONO, color: "var(--muted-foreground)", marginRight: 6 }}>{cl.hora}</span>
                {/* El color de la materia — ADR-097: identidad, no medida. */}
                <span style={{ marginRight: 6 }}>
                  <MarcaDeMateria cursadaId={cl.cursadaId} tamano={7} />
                </span>
                <span style={{ color: "var(--foreground)" }}>{cl.materia}</span>
              </p>
              {cl.detalle && (
                <p style={{ ...MONO, color: "var(--muted-foreground)", paddingLeft: 78, lineHeight: 1.4 }}>
                  {cl.detalle}
                </p>
              )}
            </div>
          ))
        )}
      </div>

      <div data-bloque="avanzar">
        <Subtitulo>{t("HOY.CUADRO.AVANZAR")}</Subtitulo>
        {c.avanzar.length === 0 ? (
          <Vacio>{c.vacioDeAvance}</Vacio>
        ) : (
          c.avanzar.map((a) => (
            <div
              key={a.cursadaId}
              className="flex items-baseline justify-between"
              style={{ gap: 8, fontSize: "var(--text-label)", lineHeight: 1.6 }}
            >
              <span className="flex min-w-0 items-center" style={{ gap: 8 }}>
                <MarcaDeMateria cursadaId={a.cursadaId} tamano={7} />
                {onAbrir ? (
                  <button
                    className="truncate text-left"
                    onClick={() => onAbrir({ cursadaId: a.cursadaId, nombre: a.materia })}
                    style={{ color: "var(--foreground)" }}
                  >
                    {a.materia}
                  </button>
                ) : (
                  <span className="truncate" style={{ color: "var(--foreground)" }}>
                    {a.materia}
                  </span>
                )}
              </span>
              <span style={{ ...MONO, color: "var(--muted-foreground)", whiteSpace: "nowrap" }}>{a.unidades}</span>
            </div>
          ))
        )}
      </div>

      <div data-bloque="horarios">
        <Subtitulo>{t("HOY.CUADRO.HORARIOS")}</Subtitulo>
        {c.horarios.length === 0 ? (
          <Vacio>{t("HOY.CUADRO.HORARIOS.VACIO")}</Vacio>
        ) : (
          c.horarios.map((h, k) => (
            <p
              key={k}
              data-tipo={h.tipo}
              style={{
                fontSize: "var(--text-label)",
                lineHeight: 1.6,
                fontWeight: h.tipo === "EVALUACION" ? 600 : 400,
                color: h.tipo === "DISPONIBLE" ? "var(--muted-foreground)" : "var(--foreground)",
              }}
            >
              {h.tipo === "EVALUACION" && (
                <span aria-hidden style={{ color: "var(--urgencia-texto)", marginRight: 6 }}>
                  ◆
                </span>
              )}
              {h.hora && <span style={{ ...MONO, color: "var(--muted-foreground)", marginRight: 6 }}>{h.hora}</span>}
              {h.texto}
            </p>
          ))
        )}
      </div>

      {c.notas.length > 0 && (
        <div>
          {c.notas.map((n) => (
            <p key={n} style={{ fontSize: "var(--text-meta)", color: "var(--muted-foreground)" }}>
              {n}
            </p>
          ))}
        </div>
      )}
    </section>
  );
}

// ── Riesgos detectados ────────────────────────────────────────────────────────

/**
 * Los riesgos de planificación — ADR-093.
 *
 * ⚠️ **Llegan redactados y ordenados por fecha** desde el servidor; acá no se
 * evalúa ninguna regla ni se reordena por gravedad. La única acción es **abrir
 * la materia**, que es navegación (`CTA-001`): ofrecer una salida propia por
 * riesgo sería el playbook que `C01-044` dejó sin valores.
 */
function Riesgos({ riesgos, onAbrir }: { riesgos: RiesgoProyectado[]; onAbrir?: AbrirMateria }) {
  return (
    <section aria-label={t("HOY.RIESGOS")}>
      <div className="flex items-baseline gap-3">
        <Eyebrow>{t("HOY.RIESGOS")}</Eyebrow>
        {/* Chip tintado — ADR-097: la misma urgencia, en la forma de las capturas. */}
        {riesgos.length > 0 && (
          <EstadoChip tone="urgencia">
            {riesgos.length} {riesgos.length === 1 ? t("HOY.RIESGOS.UNO") : t("HOY.RIESGOS.VARIOS")}
          </EstadoChip>
        )}
      </div>
      {riesgos.length === 0 ? (
        <ReglaDeNegocio>{t("HOY.RIESGOS.VACIO")}</ReglaDeNegocio>
      ) : (
        <ul style={{ ...TARJETA, marginTop: 6 }}>
          {riesgos.map((r, i) => {
            const cursadaId = r.cursadaId;
            return (
              <li
                key={`${r.regla}-${cursadaId ?? i}`}
                data-regla={r.regla}
                className="flex items-center"
                style={{
                  gap: 12,
                  padding: "12px 16px 12px 13px",
                  borderTop: i > 0 ? "1px solid var(--border)" : undefined,
                  /*
                    ⚠️ **Dos colores con dos trabajos, y no se pisan** — ADR-097.
                    El punto es la urgencia: dice *esto es un riesgo*. El filo de
                    la izquierda es la materia: dice *de cuál*. Un riesgo del plan
                    entero no es de ninguna, y su filo va transparente para que
                    las filas sigan alineadas.
                  */
                  borderLeft: `3px solid ${cursadaId ? colorDeMateria(cursadaId) : "transparent"}`,
                }}
              >
                <span
                  aria-hidden
                  style={{ width: 8, height: 8, borderRadius: 999, background: "var(--urgencia-texto)", flexShrink: 0 }}
                />
                <div className="min-w-0 flex-1">
                  <p style={{ fontSize: "var(--text-body)", fontWeight: 500, color: "var(--foreground)" }}>{r.titulo}</p>
                  {r.detalle && (
                    <p style={{ fontSize: "var(--text-label)", color: "var(--muted-foreground)" }}>{r.detalle}</p>
                  )}
                </div>
                {/*
                  ⚠️ **El nombre viaja en el riesgo** (ADR-096). Antes salía de las
                  tarjetas de evaluación: al retirarlas, la sección habría quedado
                  dependiendo de otra que ya no existe.
                */}
                {cursadaId && onAbrir && (
                  <AccionDeObjeto onClick={() => onAbrir({ cursadaId, nombre: r.materia ?? "" })}>
                    {t("HOY.RIESGOS.ABRIR")}
                  </AccionDeObjeto>
                )}
              </li>
            );
          })}
        </ul>
      )}
      <ReglaDeNegocio>{t("HOY.RIESGOS.AYUDA")}</ReglaDeNegocio>
    </section>
  );
}

// ── La pantalla ───────────────────────────────────────────────────────────────

export function HoyAutogestion({
  fecha,
  estadoGeneral,
  hero,
  recuperacion,
  verProgreso,
  tablero,
  onAvanzar,
  onVerMateria,
  onVerProgreso,
  onAbrirMateria,
}: HoyProps & {
  onAvanzar?: () => void;
  /**
   * Navegar a una materia por `CTA-001`, **con su cursada**
   * ([ADR-054](../../docs/decisions.md#adr-054)). Es el camino cuando no hay
   * espacio de trabajo montado.
   */
  onVerMateria?: (cursadaId: string | null) => void;
  onVerProgreso?: () => void;
  /**
   * Abre una materia **como objeto del espacio de trabajo** —
   * [ADR-088](../../docs/decisions.md#adr-088) §10.6. Es la misma navegación de
   * `CTA-001`; lo que agrega es que el objeto quede abierto para volver.
   */
  onAbrirMateria?: AbrirMateria;
}) {
  const replegado = seRepliega(hero.nivel);
  const conTablero = tablero !== null && !replegado;
  // Una sola forma de abrir: el objeto si hay espacio de trabajo, la ruta si no.
  // Sin ninguna de las dos, **no se ofrece la acción** (AGENTS.md §2.2).
  const abrir: AbrirMateria | undefined =
    onAbrirMateria ?? (onVerMateria ? (m) => onVerMateria(m.cursadaId) : undefined);

  return (
    <div
      className="space-y-5"
      style={{ background: "var(--background)", padding: "16px", borderRadius: "var(--radius)" }}
    >
      {/*
        La cabecera es la primitiva (`D-01`: un `h1` por superficie, y es el de
        `TituloDePanel`). El propósito de la pantalla va de eyebrow; la fecha,
        dentro de la píldora con el único número que ordena el día.
      */}
      <TituloDePanel
        eyebrow={t("HOY.PROPOSITO")}
        titulo={t("HOY.TITULO")}
        escala={30}
        subcopy={SUBCOPY.UX01}
        acciones={
          <div className="flex flex-wrap items-center justify-end" style={{ gap: 8 }}>
            <Pildora fecha={fecha} proxima={tablero?.proximaEvaluacion ?? null} />
            {/* `CTA-009` es navegación de lectura: arriba a la derecha (§11.9.3). */}
            {verProgreso ? <AccionDeObjeto onClick={onVerProgreso}>{verProgreso}</AccionDeObjeto> : null}
          </div>
        }
      />

      <EstadoGeneral>{estadoGeneral}</EstadoGeneral>

      <Recuperacion r={recuperacion} />

      {/*
        **Primera fila: la acción y el día.** El Hero manda y ocupa dos
        tercios; el cuadro de hoy acompaña en el tercero, que ADR-015 reserva para la
        *continuidad*. Por debajo de `lg` se apilan y el Hero queda primero — el
        contrato de orden semántico de `design-system.md` §6.1 rige en todo ancho.
      */}
      <div className={conTablero ? "grid items-start gap-4 lg:grid-cols-3" : undefined}>
        <div className={conTablero ? "lg:col-span-2" : undefined}>
          <HeroContent hero={hero} onAvanzar={onAvanzar} />
        </div>
        {conTablero && <CuadroHoy c={tablero.hoy} onAbrir={abrir} />}
      </div>

      {/*
        ⚠️ **Todo lo de abajo va después del Hero, nunca antes.** La precedencia
        de `UX01` es conducta primero y contexto después (`product.md` §10.2).
      */}
      {conTablero && (
        <>
          <Riesgos riesgos={tablero.riesgos} onAbrir={abrir} />
        </>
      )}
    </div>
  );
}
