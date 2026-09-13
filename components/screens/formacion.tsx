"use client";

/**
 * La biblioteca de Formación — [ADR-087](../../docs/decisions.md#adr-087).
 *
 * ## Las cinco reglas que esta pantalla hace cumplir
 *
 * 1. **Es opcional, y se nota.** `D1` la declaró *opcional y no obligatoria*:
 *    sin contador en el menú, sin nada que caduque, sin progreso de biblioteca.
 *    Un «3 de 5 vistas» convertiría en deuda algo que el estudiante puede no
 *    abrir nunca sin consecuencia.
 * 2. **V1 es de solo lectura.** ADR-087 Enmienda 2: la pieza se abre y se lee
 *    siempre, **con cursadas o sin ellas**. No hay botón de aplicar, no hay
 *    selector de materia y no hay `CTA-021`: la escritura no existe todavía, y
 *    un control que la prometiera mentiría. Los únicos botones **abren y
 *    cierran piezas**.
 * 3. **En el camino real no hay video.** La autora declara que faltan los
 *    guiones. `D4`: se omite, no se simula — ni reproductor vacío ni
 *    *«próximamente»*.
 * 4. **En la demo, lo simulado se rotula** — Enmienda 3. La portada del video
 *    **no es un control**: no hay nada que aparente reproducir. Tips, ejemplos
 *    y piezas inventadas llevan *Simulado*; las piezas de la autora sin
 *    autorizar llevan *Borrador*.
 * 5. **No promete aprendizaje.** Formación enseña método; no certifica que se
 *    sepa. Nada de «dominado», «nivel» ni porcentajes ([ADR-072](../../docs/decisions.md#adr-072),
 *    [ADR-075](../../docs/decisions.md#adr-075) §C1).
 */

import { useEffect, useRef, useState } from "react";

import { t } from "@/lib/content/es-AR";
import type { FormacionProps, GrupoDeFormacion, PiezaDeFormacion } from "@/lib/domain/view-models";
import { ReglaDeNegocio, TituloDePanel } from "./design-system";

export interface FormacionScreenProps extends FormacionProps {
  /**
   * Qué pieza está abierta, **si la decide la URL** — ADR-088, Enmienda 7.
   *
   * ⚠️ Con `onAbrir` presente la pantalla no guarda la pieza por su cuenta: el
   * video abierto vive en `?pieza=`, que es lo que le da miga, ficha en la barra
   * y botón atrás. Sin él, sigue siendo estado local, como en los tests de la
   * pantalla sola.
   */
  abierta?: string | null;
  onAbrir?: (id: string | null) => void;
}

export function Formacion({ piezas, aviso, simulada, grupos, abierta: deAfuera, onAbrir }: FormacionScreenProps) {
  // Cuál está abierta. Estado de sesión, no de dominio: no se persiste.
  const [local, setLocal] = useState<string | null>(null);
  const abierta = onAbrir ? (deAfuera ?? null) : local;
  const setAbierta = onAbrir ?? setLocal;
  const pieza = piezas.find((p) => p.id === abierta) ?? null;

  return (
    <div>
      {/*
        `D-01`: el `h1` lo dibuja la primitiva, no la pantalla. Hay guard, y es
        el que lo encontró: una superficie con su propio `h1` se sale de la
        escala tipográfica y del árbol de encabezados sin que nadie lo note.

        Va **fuera** del contenedor con `gap`: la cabecera trae su distancia al
        contenido, y adentro se sumarían las dos.
      */}
      <TituloDePanel
        titulo={t("FORMACION.TITULO")}
        subcopy={t("FORMACION.SUBCOPY")}
      />

      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

      {/*
        La demo **se anuncia arriba de todo**, antes de cualquier pieza: quien
        mire la pantalla tiene que saber qué es simulado antes de leer nada.
      */}
      {simulada && <AvisoDeSimulacion />}

      {/*
        Estado vacío o incompleto: se dice, no se disimula. Va **arriba** de
        cualquier CTA (`I-05`), y sin imperativo — el estudiante no puede
        publicar contenido ni inscribirse a una materia desde acá (`C-04`).
      */}
      {aviso && (
        <ReglaDeNegocio>
          <span style={{ color: "var(--urgencia-texto)" }}>{aviso}</span>
        </ReglaDeNegocio>
      )}

      {pieza ? (
        <PiezaAbierta pieza={pieza} onVolver={() => setAbierta(null)} />
      ) : (
        <Biblioteca piezas={piezas} grupos={grupos} abierta={abierta} onAbrir={setAbierta} />
      )}
      </div>
    </div>
  );
}

function AvisoDeSimulacion() {
  return (
    <p
      role="note"
      style={{
        margin: 0,
        padding: "12px 16px",
        borderRadius: 12,
        border: "0.5px dashed var(--border)",
        background: "var(--muted)",
        fontSize: "var(--text-label)",
        color: "var(--muted-foreground)",
        lineHeight: 1.5,
      }}
    >
      {t("FORMACION.AVISO_SIMULADA")}
    </p>
  );
}

// ── La biblioteca ───────────────────────────────────────────────────────────

function Biblioteca({
  piezas,
  grupos,
  abierta,
  onAbrir,
}: {
  piezas: readonly PiezaDeFormacion[];
  grupos: readonly GrupoDeFormacion[];
  abierta: string | null;
  onAbrir: (id: string) => void;
}) {
  if (piezas.length === 0) return null;

  const porId = new Map(piezas.map((p) => [p.id, p]));
  const agrupadas = new Set(grupos.flatMap((g) => g.piezaIds));
  // ⚠️ **Una pieza que ningún grupo nombra se muestra igual.** Sin grupos —el
  // camino real— son todas; con grupos, la simulación no puede esconder una
  // pieza de la autora por no haberla asignado a un eje.
  const sueltas = piezas.filter((p) => !agrupadas.has(p.id));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
      {grupos.map((g) => (
        <section key={g.codigo} aria-labelledby={`grupo-${g.codigo}`}>
          <h2 id={`grupo-${g.codigo}`} style={{ fontSize: "var(--text-title-sm)", fontWeight: 600, margin: 0 }}>
            {g.titulo}
          </h2>
          <p className="subcopy" style={{ margin: "2px 0 12px" }}>
            {g.pregunta}
          </p>
          <Grilla
            piezas={g.piezaIds.flatMap((id) => porId.get(id) ?? [])}
            abierta={abierta}
            onAbrir={onAbrir}
          />
        </section>
      ))}

      {sueltas.length > 0 && (
        <section aria-label={grupos.length > 0 ? t("FORMACION.OTRAS") : t("FORMACION.TITULO")}>
          {grupos.length > 0 && (
            <h2 style={{ fontSize: "var(--text-title-sm)", fontWeight: 600, margin: "0 0 12px" }}>
              {t("FORMACION.OTRAS")}
            </h2>
          )}
          <Grilla piezas={sueltas} abierta={abierta} onAbrir={onAbrir} />
        </section>
      )}
    </div>
  );
}

function Grilla({
  piezas,
  abierta,
  onAbrir,
}: {
  piezas: readonly PiezaDeFormacion[];
  abierta: string | null;
  onAbrir: (id: string) => void;
}) {
  return (
    <ul
      style={{
        listStyle: "none",
        margin: 0,
        padding: 0,
        display: "grid",
        gap: 14,
        // Sin breakpoints: la superficie también se dibuja en la ventana de su
        // ficha (ADR-088), que es angosta. La grilla se acomoda al ancho que
        // tenga, no al de la pantalla.
        gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 440px), 1fr))",
      }}
    >
      {piezas.map((p) => (
        <li key={p.id} style={{ display: "flex" }}>
          <Tarjeta pieza={p} abierta={abierta === p.id} onAbrir={() => onAbrir(p.id)} />
        </li>
      ))}
    </ul>
  );
}

function Tarjeta({ pieza, abierta, onAbrir }: { pieza: PiezaDeFormacion; abierta: boolean; onAbrir: () => void }) {
  return (
    <button
      type="button"
      onClick={onAbrir}
      aria-expanded={abierta}
      style={{
        display: "flex",
        flexWrap: "wrap",
        alignItems: "flex-start",
        gap: 14,
        width: "100%",
        textAlign: "left",
        padding: pieza.simulacion ? 10 : "14px 16px",
        background: "var(--card)",
        border: "0.5px solid var(--border)",
        borderRadius: 14,
        font: "inherit",
        color: "inherit",
        cursor: "pointer",
      }}
    >
      {/*
        Portada a la izquierda y texto a la derecha: con dos piezas por eje,
        una tarjeta vertical dejaba media superficie vacía. En una ventana
        angosta (ADR-088) el texto baja solo, sin breakpoint.
      */}
      {pieza.simulacion && (
        <span style={{ flex: "0 1 200px", minWidth: 160 }}>
          <Portada titulo={pieza.titulo} minutos={pieza.simulacion.duracionMinutos} />
        </span>
      )}
      <span style={{ flex: "1 1 200px", display: "flex", flexDirection: "column", gap: 4, padding: pieza.simulacion ? "2px 4px" : 0 }}>
        <Rotulos pieza={pieza} />
        {/*
          El título es **la frase del estudiante**, no un rótulo de catálogo. Es
          como la nombra la autora, y es lo que hace que alguien se reconozca en
          la lista antes de abrir nada.
        */}
        <span style={{ fontSize: "var(--text-body)", fontWeight: 600 }}>«{pieza.titulo}»</span>
        <span style={{ fontSize: "var(--text-label)", color: "var(--muted-foreground)", lineHeight: 1.45 }}>
          {pieza.problema}
        </span>
      </span>
    </button>
  );
}

// ── La pieza abierta ────────────────────────────────────────────────────────

function PiezaAbierta({ pieza, onVolver }: { pieza: PiezaDeFormacion; onVolver: () => void }) {
  const titulo = useRef<HTMLHeadingElement>(null);
  // Al abrir, el foco va al título de la pieza: un lector de pantalla tiene
  // que enterarse de que la vista cambió, y el scroll lo acompaña.
  useEffect(() => {
    titulo.current?.focus();
  }, [pieza.id]);

  const s = pieza.simulacion;

  return (
    <article style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <div>
        <button
          type="button"
          onClick={onVolver}
          style={{
            padding: "6px 14px",
            borderRadius: 999,
            border: "0.5px solid var(--border)",
            background: "var(--card)",
            font: "inherit",
            fontSize: "var(--text-label)",
            color: "inherit",
            cursor: "pointer",
          }}
        >
          ← {t("FORMACION.VOLVER")}
        </button>
      </div>

      <header style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <Rotulos pieza={pieza} />
        <h2
          ref={titulo}
          tabIndex={-1}
          style={{ fontSize: "var(--text-title-sm)", fontWeight: 600, margin: 0, outline: "none" }}
        >
          «{pieza.titulo}»
        </h2>
        <p style={{ fontSize: "var(--text-body)", color: "var(--muted-foreground)", margin: 0, maxWidth: 720 }}>
          {pieza.problema}
        </p>
      </header>

      <div
        style={{
          display: "grid",
          gap: 20,
          alignItems: "start",
          gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 340px), 1fr))",
        }}
      >
        {/* Columna del contenido: el video y lo que explica. */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {s && (
            <figure style={{ margin: 0, display: "flex", flexDirection: "column", gap: 8 }}>
              <Portada titulo={pieza.titulo} minutos={s.duracionMinutos} grande />
              <figcaption style={{ fontSize: "var(--text-label)", color: "var(--muted-foreground)" }}>
                {t("FORMACION.VIDEO_SIMULADO")}
              </figcaption>
            </figure>
          )}
          <Parte titulo={t("FORMACION.OBJETIVO")}>{pieza.objetivo}</Parte>
          <Parte titulo={t("FORMACION.EXPLICACION")}>{pieza.explicacion}</Parte>
        </div>

        {/* Columna del trabajo: qué hacer, qué entregar, cómo. */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <Bloque>
            <Parte titulo={t("FORMACION.ACCION")}>{pieza.accionPosterior}</Parte>
          </Bloque>

          <Bloque>
            <Parte titulo={t("FORMACION.EVIDENCIA")}>{pieza.evidenciaEsperada}</Parte>
            {s && (
              <div
                style={{
                  marginTop: 12,
                  padding: "10px 12px",
                  borderRadius: 10,
                  background: "var(--muted)",
                }}
              >
                <Subtitulo simulado>{t("FORMACION.EJEMPLO")}</Subtitulo>
                <p style={{ fontSize: "var(--text-body)", margin: "4px 0 0", lineHeight: 1.5 }}>
                  {s.ejemploDeEntregable}
                </p>
              </div>
            )}
          </Bloque>

          {s && s.tips.length > 0 && (
            <Bloque>
              <Subtitulo simulado>{t("FORMACION.TIPS")}</Subtitulo>
              <ul style={{ margin: "6px 0 0", paddingLeft: 18, listStyle: "disc", display: "flex", flexDirection: "column", gap: 6 }}>
                {s.tips.map((tip) => (
                  <li key={tip} style={{ fontSize: "var(--text-body)", lineHeight: 1.5 }}>
                    {tip}
                  </li>
                ))}
              </ul>
            </Bloque>
          )}

          {/* `null` ⇒ la pieza no declara material: la línea **desaparece**. */}
          {pieza.material && (
            <Bloque>
              <Parte titulo={t("FORMACION.MATERIAL")}>
                {pieza.material}
                {/*
                  ⚠️ **Sin enlace.** El archivo no existe: un «Descargar» que no
                  descarga es el control falso que `E3.4` prohíbe.
                */}
                {s && (
                  <span style={{ display: "block", fontSize: "var(--text-label)", color: "var(--muted-foreground)" }}>
                    {t("FORMACION.MATERIAL_NO_DISPONIBLE")}
                  </span>
                )}
              </Parte>
            </Bloque>
          )}
        </div>
      </div>

      {/*
        La procedencia va **junto al dato** (`product.md` §7), nunca sólo en
        un tooltip. La traduce `provenanceVisible()`; acá sólo se muestra.
      */}
      <p style={{ fontSize: "var(--text-label)", color: "var(--muted-foreground)", margin: 0 }}>
        {pieza.procedencia}
      </p>
    </article>
  );
}

/**
 * La portada del video simulado — Enmienda 3 `E3.4`.
 *
 * ⚠️ **Es una imagen, no un control.** `aria-hidden`, sin `tabIndex` y sin
 * `onClick`: el triángulo dice *esto sería un video*, y el pie dice que no se
 * reproduce. Un botón de play que no reproduce sería el control falso que `D4`
 * y la Enmienda 3 prohíben.
 */
function Portada({ titulo, minutos, grande = false }: { titulo: string; minutos: number; grande?: boolean }) {
  return (
    <span
      aria-hidden="true"
      style={{
        position: "relative",
        display: "block",
        width: "100%",
        aspectRatio: "16 / 9",
        borderRadius: grande ? 14 : 10,
        overflow: "hidden",
        background:
          "radial-gradient(120% 90% at 20% 10%, color-mix(in srgb, var(--foreground) 70%, transparent), var(--foreground))",
        color: "var(--card)",
      }}
    >
      <span
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: grande ? 64 : 40,
          height: grande ? 64 : 40,
          borderRadius: 999,
          background: "color-mix(in srgb, var(--card) 22%, transparent)",
          display: "grid",
          placeItems: "center",
        }}
      >
        <svg width={grande ? 22 : 14} height={grande ? 22 : 14} viewBox="0 0 10 10" fill="currentColor">
          <path d="M2.5 1.2v7.6L8.8 5z" />
        </svg>
      </span>
      {grande && (
        <span
          style={{
            position: "absolute",
            left: 16,
            bottom: 14,
            right: 90,
            fontSize: "var(--text-body)",
            fontWeight: 600,
            lineHeight: 1.3,
          }}
        >
          «{titulo}»
        </span>
      )}
      <span
        style={{
          position: "absolute",
          right: grande ? 14 : 8,
          bottom: grande ? 14 : 8,
          padding: "2px 8px",
          borderRadius: 999,
          background: "color-mix(in srgb, var(--foreground) 75%, transparent)",
          fontSize: "var(--text-label)",
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {minutos} {t("FORMACION.MINUTOS")}
      </span>
      <span
        style={{
          position: "absolute",
          left: grande ? 14 : 8,
          top: grande ? 14 : 8,
          padding: "2px 8px",
          borderRadius: 999,
          border: "0.5px solid color-mix(in srgb, var(--card) 45%, transparent)",
          fontSize: "var(--text-label)",
        }}
      >
        {t("FORMACION.ROTULO_SIMULADO")}
      </span>
    </span>
  );
}

function Rotulos({ pieza }: { pieza: PiezaDeFormacion }) {
  if (!pieza.borrador && !pieza.piezaSimulada) return null;
  return (
    <span style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
      {pieza.borrador && <Rotulo>{t("FORMACION.ROTULO_BORRADOR")}</Rotulo>}
      {pieza.piezaSimulada && <Rotulo>{t("FORMACION.ROTULO_PIEZA_SIMULADA")}</Rotulo>}
    </span>
  );
}

/** Rótulo neutro: *Borrador* y *Simulado* no son urgencia ni éxito, son procedencia. */
function Rotulo({ children }: { children: React.ReactNode }) {
  return (
    <span
      style={{
        display: "inline-block",
        padding: "1px 8px",
        borderRadius: 999,
        border: "0.5px solid var(--border)",
        background: "var(--muted)",
        fontSize: "var(--text-label)",
        color: "var(--muted-foreground)",
      }}
    >
      {children}
    </span>
  );
}

function Bloque({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ padding: "14px 16px", borderRadius: 14, background: "var(--card)", border: "0.5px solid var(--border)" }}>
      {children}
    </div>
  );
}

function Subtitulo({ children, simulado = false }: { children: React.ReactNode; simulado?: boolean }) {
  return (
    <h3
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        fontSize: "var(--text-label)",
        fontWeight: 600,
        color: "var(--muted-foreground)",
        margin: 0,
      }}
    >
      {children}
      {simulado && <Rotulo>{t("FORMACION.ROTULO_SIMULADO")}</Rotulo>}
    </h3>
  );
}

/**
 * Una de las partes de la pieza.
 *
 * ⚠️ **No usa `TituloDePanel`**, aunque la tentación era obvia: esa primitiva
 * dibuja un `h1`, y varias de ellas dejarían la superficie con varios. `D-01`
 * pide **uno solo**, y el de esta pantalla ya lo puso el encabezado.
 */
function Parte({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <div>
      <Subtitulo>{titulo}</Subtitulo>
      <p style={{ fontSize: "var(--text-body)", margin: "4px 0 0", lineHeight: 1.55 }}>{children}</p>
    </div>
  );
}
