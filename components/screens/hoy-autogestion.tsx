"use client";

/**
 * ACHIEVE — Hoy / Autogestión (VI.1)
 *
 * La pantalla **proyecta, no decide** (AGENTS.md §2.2). El nivel del Hero llega
 * ya resuelto por `selectHeroLevel` (`lib/domain/precedence.ts`); acá no se
 * rankea, no se prioriza y no se elige entre recomendaciones.
 *
 * Desde [ADR-093](../../docs/decisions.md#adr-093) es además un **tablero**:
 * los próximos 7 días al lado del Hero, los riesgos de planificación y las
 * evaluaciones en dos formas —las dos opciones que el owner pidió ver juntas
 * para elegir una—. Los riesgos y la semana **llegan redactados** en
 * `TableroProps`: esta pantalla no evalúa ninguna regla.
 *
 * Lo que salió de acá, por decisión del owner (ADR-093): la cola de materias
 * `1 de N`, el mapa de catorce días y el reparto de horas. **Los datos siguen en
 * `HoyProps`**; lo que se retiró es su dibujo.
 */

import { useRef, useState } from "react";
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
import { colorDeMateria } from "@/lib/domain/color-de-materia";
import { nombreDeObjeto } from "@/lib/domain/nombre-de-objeto";
import type {
  DiaDeLaSemana,
  HeroProjection,
  HoyProps,
  RecuperacionProjection,
  RiesgoProyectado,
  TableroProps,
  TarjetaDeEvaluacion,
} from "@/lib/domain/view-models";
import type { HeroLevel } from "@/lib/domain/precedence";

/** Lo mínimo para abrir una materia: su cursada y cómo se llama. */
type AbrirMateria = (m: { cursadaId: string; nombre: string }) => void;

const pct = (n: number) => `${(Math.min(1, Math.max(0, n)) * 100).toFixed(2)}%`;
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

// ── Próximos 7 días ───────────────────────────────────────────────────────────

/**
 * La columna secundaria del Hero — [ADR-015](../../docs/decisions.md#adr-015)
 * le asigna *"continuidad"*, y esto es exactamente eso.
 *
 * ⚠️ **No tiene un solo botón, y es a propósito.** No es una agenda: no propone
 * cuándo estudiar ni crea nada ([ADR-064](../../docs/decisions.md#adr-064)).
 */
function Semana({ semana }: { semana: DiaDeLaSemana[] }) {
  const vacia = semana.every((d) => d.items.length === 0);
  return (
    <section aria-label={t("HOY.SEMANA")} style={{ ...TARJETA, padding: "14px 16px" }}>
      <Eyebrow>{t("HOY.SEMANA")}</Eyebrow>
      {vacia ? (
        <ReglaDeNegocio>{t("HOY.SEMANA.VACIO")}</ReglaDeNegocio>
      ) : (
        /*
          Con clases todos los días la lista mide más que el Hero y lo deja
          flotando en un hueco. Se acota **adentro**: el scroll es de la lista,
          nunca de la página, y no se esconde ningún día.
        */
        <ul style={{ maxHeight: 360, overflowY: "auto" }}>
          {semana.map((d, i) => (
            <li
              key={d.fecha}
              style={{
                display: "grid",
                gridTemplateColumns: "76px 1fr",
                gap: 8,
                padding: "7px 0",
                borderTop: i > 0 ? "1px solid var(--border)" : undefined,
              }}
            >
              <span style={{ ...MONO, color: i === 0 ? "var(--foreground)" : "var(--muted-foreground)", paddingTop: 2 }}>
                {d.etiqueta}
              </span>
              <div className="min-w-0">
                {d.items.length === 0 ? (
                  <span style={{ color: "var(--muted-foreground)" }} aria-label="Nada cargado">
                    —
                  </span>
                ) : (
                  d.items.map((it, k) => {
                    const principal = it.tipo === "EVALUACION" || it.tipo === "COMPROMISO";
                    return (
                      <p
                        key={k}
                        data-tipo={it.tipo}
                        // Clases y franjas son contexto: una línea cada una, el texto entero en el `title`.
                        title={principal ? undefined : it.texto}
                        className={principal ? undefined : "truncate"}
                        style={{
                          fontSize: principal ? "var(--text-body)" : "var(--text-label)",
                          fontWeight: it.tipo === "EVALUACION" ? 600 : 400,
                          color: principal ? "var(--foreground)" : "var(--muted-foreground)",
                          lineHeight: 1.45,
                        }}
                      >
                        {it.tipo === "EVALUACION" && (
                          <span aria-hidden style={{ color: "var(--urgencia-texto)", marginRight: 6 }}>
                            ◆
                          </span>
                        )}
                        {it.hora && <span style={{ ...MONO, marginRight: 6 }}>{it.hora}</span>}
                        {it.texto}
                      </p>
                    );
                  })
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
      <ReglaDeNegocio>{t("HOY.SEMANA.AYUDA")}</ReglaDeNegocio>
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
function Riesgos({
  riesgos,
  nombres,
  onAbrir,
}: {
  riesgos: RiesgoProyectado[];
  nombres: ReadonlyMap<string, string>;
  onAbrir?: AbrirMateria;
}) {
  return (
    <section aria-label={t("HOY.RIESGOS")}>
      <div className="flex items-baseline gap-3">
        <Eyebrow>{t("HOY.RIESGOS")}</Eyebrow>
        {riesgos.length > 0 && (
          <span style={{ ...MONO, color: "var(--urgencia-texto)" }}>
            {riesgos.length} {riesgos.length === 1 ? t("HOY.RIESGOS.UNO") : t("HOY.RIESGOS.VARIOS")}
          </span>
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
                style={{ gap: 12, padding: "12px 16px", borderTop: i > 0 ? "1px solid var(--border)" : undefined }}
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
                {cursadaId && onAbrir && (
                  <AccionDeObjeto onClick={() => onAbrir({ cursadaId, nombre: nombres.get(cursadaId) ?? "" })}>
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

// ── Próximas evaluaciones ─────────────────────────────────────────────────────

/** *"Parcial 1 · mar 15 sept · teórico escrito"* — lo que falta se omite. */
function lineaDeEvaluacion(c: TarjetaDeEvaluacion): string {
  if (!c.evaluacion) return t("HOY.EVALUACIONES.SIN_FECHA");
  return [c.evaluacion.rotulo, c.evaluacion.fecha, c.evaluacion.modalidad].filter(Boolean).join(" · ");
}

/**
 * *"cobertura 26% · último avance hoy"*. Sin cobertura va el **por qué**, en
 * lugar de la cifra: una barra vacía por falta de datos y una por falta de
 * trabajo no se dibujan igual (ADR-072 §4).
 */
function lineaDeHechos(c: TarjetaDeEvaluacion): string {
  const cobertura = c.cobertura ? `${t("HOY.EVALUACIONES.COBERTURA")} ${c.cobertura.porcentaje}%` : c.sinCobertura;
  const actividad = c.ultimoAvance
    ? `${t("HOY.EVALUACIONES.ULTIMO_AVANCE")} ${c.ultimoAvance}`
    : t("HOY.EVALUACIONES.SIN_AVANCE");
  return [cobertura, actividad].filter(Boolean).join(" · ");
}

function Barra({ fraccion, color }: { fraccion: number; color: string }) {
  return (
    <div aria-hidden style={{ height: 6, borderRadius: 3, background: "var(--muted)", overflow: "hidden" }}>
      <div style={{ width: pct(fraccion), height: "100%", background: color }} />
    </div>
  );
}

/**
 * **Opción 1 · tarjetas** — la referencia del owner, tal cual: el color de la
 * materia arriba, los días grandes, la barra y la línea de hechos.
 *
 * El color es **identidad, no medida** (ADR-088 Enmienda 5): la misma materia
 * tiene el mismo color al 3% y al 100%. La urgencia va en la cifra de días, que
 * es un hecho del calendario, nunca en la cobertura.
 */
function Tarjeta({ c, onAbrir }: { c: TarjetaDeEvaluacion; onAbrir?: AbrirMateria }) {
  const color = colorDeMateria(c.cursadaId);
  const cuerpo = (
    <>
      <div className="flex items-start justify-between" style={{ gap: 10 }}>
        <div className="min-w-0">
          <p
            title={c.nombre}
            style={{
              fontSize: "var(--text-body)",
              fontWeight: 600,
              color: "var(--foreground)",
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {c.nombre}
          </p>
          <p style={{ fontSize: "var(--text-label)", color: "var(--muted-foreground)" }}>{lineaDeEvaluacion(c)}</p>
        </div>
        {c.faltan && (
          <span
            style={{
              fontSize: 28,
              lineHeight: 1,
              fontWeight: 300,
              letterSpacing: "-0.02em",
              whiteSpace: "nowrap",
              fontVariantNumeric: "tabular-nums",
              color: c.tono === "urgencia" ? "var(--urgencia-texto)" : "var(--foreground)",
            }}
          >
            {c.faltan}
          </span>
        )}
      </div>
      {c.cobertura && <Barra fraccion={c.cobertura.fraccion} color={color} />}
      <p style={{ fontSize: "var(--text-label)", color: "var(--muted-foreground)" }}>{lineaDeHechos(c)}</p>
    </>
  );

  const estilo = {
    ...TARJETA,
    borderTop: `3px solid ${color}`,
    padding: "14px 16px",
    display: "flex",
    flexDirection: "column" as const,
    gap: 10,
    textAlign: "left" as const,
    scrollSnapAlign: "start" as const,
    width: "100%",
  };

  return onAbrir ? (
    <button data-tarjeta={c.cursadaId} onClick={() => onAbrir(c)} style={{ ...estilo, cursor: "pointer" }}>
      {cuerpo}
    </button>
  ) : (
    <div data-tarjeta={c.cursadaId} style={estilo}>
      {cuerpo}
    </div>
  );
}

function OpcionTarjetas({ tarjetas, onAbrir }: { tarjetas: TarjetaDeEvaluacion[]; onAbrir?: AbrirMateria }) {
  const carril = useRef<HTMLDivElement>(null);
  const mover = (sentido: 1 | -1) => {
    const el = carril.current;
    if (el) el.scrollBy({ left: sentido * el.clientWidth, behavior: "smooth" });
  };

  return (
    <section aria-label={t("HOY.EVALUACIONES.OPCION_1")}>
      <div className="flex items-center justify-between" style={{ marginBottom: 6 }}>
        <span style={{ ...MONO, color: "var(--muted-foreground)" }}>{t("HOY.EVALUACIONES.OPCION_1")}</span>
        {tarjetas.length > 4 && (
          <div className="flex items-center gap-2" style={{ color: "var(--muted-foreground)" }}>
            <button aria-label="Anteriores" onClick={() => mover(-1)}>
              <ArrowLeft size={14} />
            </button>
            <span style={MONO}>{tarjetas.length}</span>
            <button aria-label="Siguientes" onClick={() => mover(1)}>
              <ArrowRight size={14} />
            </button>
          </div>
        )}
      </div>
      {/*
        Cuatro a la vista y el resto a la derecha, como pidió el owner. El scroll
        vive **adentro de este contenedor**: el `body` nunca hace scroll horizontal.
      */}
      <div
        ref={carril}
        style={{
          display: "grid",
          gridAutoFlow: "column",
          gridAutoColumns: "minmax(220px, calc((100% - 36px) / 4))",
          gap: 12,
          overflowX: "auto",
          scrollSnapType: "x mandatory",
          paddingBottom: 6,
        }}
      >
        {tarjetas.map((c) => (
          <Tarjeta key={c.cursadaId} c={c} onAbrir={onAbrir} />
        ))}
      </div>
    </section>
  );
}

/**
 * **Opción 2 · carril** — un boceto clickeable, a propósito sin terminar.
 *
 * Un solo eje de tiempo con **una marca por evaluación**: lo que las tarjetas
 * cuentan de a una, esto lo muestra junto — dónde se amontonan las fechas y
 * dónde hay aire. Tocar una marca abre su detalle abajo; el detalle es la misma
 * información que la tarjeta.
 *
 * ⚠️ **La pantalla no hace aritmética de fechas**: recibe los días que faltan y
 * el largo del eje, y divide.
 */
function OpcionCarril({
  tarjetas,
  horizonte,
  onAbrir,
}: {
  tarjetas: TarjetaDeEvaluacion[];
  horizonte: number;
  onAbrir?: AbrirMateria;
}) {
  const conFecha = tarjetas.filter((c) => c.dias !== null && c.dias >= 0);
  const sinFecha = tarjetas.filter((c) => c.dias === null || c.dias < 0);
  const [elegida, setElegida] = useState<string | null>(null);
  const actual =
    tarjetas.find((c) => c.cursadaId === elegida) ?? conFecha[0] ?? tarjetas[0] ?? null;

  // Dos marcas demasiado cerca se apilan en vez de taparse: la primera fila libre.
  const finales: number[] = [];
  const marcas = conFecha.map((c) => {
    const pos = Math.min(1, (c.dias ?? 0) / horizonte);
    let fila = finales.findIndex((p) => pos - p >= 0.04);
    if (fila === -1) {
      fila = finales.length;
      finales.push(pos);
    } else finales[fila] = pos;
    return { c, pos, fila };
  });
  const semanas = Math.floor(horizonte / 7);

  return (
    <section
      aria-label={t("HOY.EVALUACIONES.OPCION_2")}
      style={{ border: "1px dashed var(--border)", borderRadius: "var(--radius)", padding: "12px 16px" }}
    >
      <div className="flex items-baseline justify-between" style={{ gap: 12 }}>
        <span style={{ ...MONO, color: "var(--muted-foreground)" }}>{t("HOY.EVALUACIONES.OPCION_2")}</span>
        <span style={{ ...MONO, color: "var(--muted-foreground)" }}>boceto</span>
      </div>

      <div style={{ overflowX: "auto" }}>
        <div style={{ minWidth: 560, padding: "10px 12px 0" }}>
          <div aria-hidden style={{ position: "relative", height: 16, ...MONO, color: "var(--muted-foreground)" }}>
            {Array.from({ length: semanas + 1 }, (_, k) => (
              <span
                key={k}
                style={{
                  position: "absolute",
                  left: pct((k * 7) / horizonte),
                  // Las puntas se alinean hacia adentro: centradas, se salían del cuadro.
                  transform: k === 0 ? "none" : k === semanas ? "translateX(-100%)" : "translateX(-50%)",
                  whiteSpace: "nowrap",
                  color: k === 0 ? "var(--foreground)" : undefined,
                  fontWeight: k === 0 ? 600 : 400,
                }}
              >
                {k === 0 ? "hoy" : `+${k} sem`}
              </span>
            ))}
          </div>
          <div style={{ position: "relative", height: 18 + Math.max(1, finales.length) * 20 }}>
            <div aria-hidden style={{ position: "absolute", left: 0, right: 0, top: 6, height: 1, background: "var(--border)" }} />
            {Array.from({ length: semanas + 1 }, (_, k) => (
              <div
                key={k}
                aria-hidden
                style={{ position: "absolute", left: pct((k * 7) / horizonte), top: 2, width: 1, height: 9, background: "var(--border)" }}
              />
            ))}
            {marcas.map(({ c, pos, fila }) => {
              const activa = actual?.cursadaId === c.cursadaId;
              return (
                <button
                  key={c.cursadaId}
                  aria-label={`${c.nombre} · ${c.faltan ?? ""}`}
                  aria-pressed={activa}
                  title={`${c.nombre} · ${lineaDeEvaluacion(c)}`}
                  onClick={() => setElegida(c.cursadaId)}
                  style={{
                    position: "absolute",
                    left: pct(pos),
                    top: 14 + fila * 20,
                    transform: "translateX(-50%)",
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                    padding: "1px 4px",
                    borderRadius: 4,
                    background: activa ? "var(--muted)" : "transparent",
                  }}
                >
                  <span
                    aria-hidden
                    style={{
                      width: activa ? 11 : 9,
                      height: activa ? 11 : 9,
                      transform: "rotate(45deg)",
                      background: colorDeMateria(c.cursadaId),
                      outline: activa ? "2px solid var(--foreground)" : undefined,
                      outlineOffset: 1,
                    }}
                  />
                  <span style={{ ...MONO, color: "var(--muted-foreground)" }}>{c.faltan}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {sinFecha.length > 0 && (
        <p style={{ fontSize: "var(--text-label)", color: "var(--muted-foreground)", marginTop: 6 }}>
          {t("HOY.EVALUACIONES.CARRIL.SIN_FECHA")}{" "}
          {sinFecha.map((c, i) => (
            <span key={c.cursadaId}>
              {i > 0 && " · "}
              <button
                onClick={() => setElegida(c.cursadaId)}
                style={{ textDecoration: actual?.cursadaId === c.cursadaId ? "underline" : undefined }}
              >
                {c.nombre}
              </button>
            </span>
          ))}
        </p>
      )}

      {actual && (
        <div
          data-detalle={actual.cursadaId}
          style={{
            marginTop: 10,
            padding: "12px 14px",
            borderLeft: `3px solid ${colorDeMateria(actual.cursadaId)}`,
            background: "var(--muted)",
            borderRadius: 6,
            display: "grid",
            gridTemplateColumns: "1fr auto",
            gap: "6px 16px",
            alignItems: "center",
          }}
        >
          <div className="min-w-0">
            <p style={{ fontSize: "var(--text-body)", fontWeight: 600, color: "var(--foreground)" }}>{actual.nombre}</p>
            <p style={{ fontSize: "var(--text-label)", color: "var(--muted-foreground)" }}>{lineaDeEvaluacion(actual)}</p>
          </div>
          <span style={{ fontSize: 24, fontWeight: 300, fontVariantNumeric: "tabular-nums", color: "var(--foreground)" }}>
            {actual.faltan ?? ""}
          </span>
          <div style={{ gridColumn: "1 / -1" }}>
            {actual.cobertura && <Barra fraccion={actual.cobertura.fraccion} color={colorDeMateria(actual.cursadaId)} />}
            <p style={{ fontSize: "var(--text-label)", color: "var(--muted-foreground)", marginTop: 4 }}>
              {lineaDeHechos(actual)}
            </p>
          </div>
          {onAbrir && (
            <div style={{ gridColumn: "1 / -1" }}>
              <AccionDeObjeto onClick={() => onAbrir(actual)}>{t("HOY.EVALUACIONES.ABRIR")}</AccionDeObjeto>
            </div>
          )}
        </div>
      )}

      <ReglaDeNegocio>{t("HOY.EVALUACIONES.CARRIL.AYUDA")}</ReglaDeNegocio>
    </section>
  );
}

function Evaluaciones({ tablero, onAbrir }: { tablero: TableroProps; onAbrir?: AbrirMateria }) {
  // Sin materias la sección no se dibuja vacía: no hay nada que comparar.
  if (tablero.tarjetas.length === 0) return null;
  return (
    <section aria-label={t("HOY.EVALUACIONES")} className="space-y-3">
      <div>
        <Eyebrow>{t("HOY.EVALUACIONES")}</Eyebrow>
        <ReglaDeNegocio>{t("HOY.EVALUACIONES.COMPARACION")}</ReglaDeNegocio>
        {/*
          ⚠️ **No es «no tenés evaluaciones»**: es que ninguna materia tiene la
          fecha cargada — *sin datos no es cero* (`AGENTS.md` §2.5).
        */}
        {tablero.proximaEvaluacion === null && (
          <ReglaDeNegocio>
            {t("HOY.SIN_EVALUACIONES")} {t("HOY.SIN_EVALUACIONES.AYUDA")}
          </ReglaDeNegocio>
        )}
      </div>
      <OpcionTarjetas tarjetas={tablero.tarjetas} onAbrir={onAbrir} />
      {/* La nota al pie de ADR-072, obligatoria si hay alguna barra. */}
      {tablero.aclaracionDeCobertura && <ReglaDeNegocio>{tablero.aclaracionDeCobertura}</ReglaDeNegocio>}
      <OpcionCarril tarjetas={tablero.tarjetas} horizonte={tablero.horizonteEnDias} onAbrir={onAbrir} />
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
  const nombres = new Map((tablero?.tarjetas ?? []).map((c) => [c.cursadaId, c.nombre]));

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
        **Primera fila: la acción y la semana.** El Hero manda y ocupa dos
        tercios; la semana acompaña en el tercero, que ADR-015 reserva para la
        *continuidad*. Por debajo de `lg` se apilan y el Hero queda primero — el
        contrato de orden semántico de `design-system.md` §6.1 rige en todo ancho.
      */}
      <div className={conTablero ? "grid items-start gap-4 lg:grid-cols-3" : undefined}>
        <div className={conTablero ? "lg:col-span-2" : undefined}>
          <HeroContent hero={hero} onAvanzar={onAvanzar} />
        </div>
        {conTablero && <Semana semana={tablero.semana} />}
      </div>

      {/*
        ⚠️ **Todo lo de abajo va después del Hero, nunca antes.** La precedencia
        de `UX01` es conducta primero y contexto después (`product.md` §10.2).
      */}
      {conTablero && (
        <>
          <Riesgos riesgos={tablero.riesgos} nombres={nombres} onAbrir={abrir} />
          <Evaluaciones tablero={tablero} onAbrir={abrir} />
        </>
      )}
    </div>
  );
}
