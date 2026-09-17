"use client";

/**
 * **Gimnasia cognitiva** — la portada · [ADR-102](../../docs/decisions.md#adr-102).
 *
 * ## Las reglas que esta pantalla hace cumplir
 *
 * 1. **No compite con el día.** No hay urgencia, ni contador, ni nada que venza.
 *    Al terminar la rutina se vuelve a Hoy, donde el ADE dice la próxima acción.
 * 2. **Una sola categoría: Memoria.** No hay pestañas de categorías futuras, ni
 *    deshabilitadas: lo que no existe no se dibuja.
 * 3. **Las cifras son del ejercicio.** *«Nivel 3 · 5 dígitos»*, nunca un nivel de
 *    la persona. Y **sin datos no es cero**: *«todavía sin partidas»*.
 * 4. **Omitir, no inventar.** Sin preguntas, Recuerdo real dice por qué y **no
 *    ofrece botón**: no hay nada que las cree. Sin materias, la rutina no nombra
 *    ninguna.
 * 5. **Una sola CTA principal por estado:** *Empezar rutina*, o *Continuar* si hay
 *    una sesión sin terminar.
 */

import { Brain, Grid3x3, Repeat2, Undo2 } from "lucide-react";

import { t } from "@/lib/content/es-AR";
import type { GimnasiaProps } from "@/lib/domain/gimnasia/vista";
import type { Juego } from "@/lib/domain/gimnasia/rutina";
import { contexto } from "@/lib/navigation/context";
import { ctaRegistry } from "@/lib/navigation/cta-registry";
import { CTAPrincipal, TituloDePanel } from "./design-system";
import { CTAEsqueleto, Esqueleto, PantallaCargando, Parrafo, Renglon } from "./esqueleto";
import { BotonSecundario, Cifra, estiloPanel } from "./gimnasia/comun";

export interface GimnasiaScreenProps extends GimnasiaProps {
  onEmpezarRutina: () => void;
  onJugar: (juego: Juego) => void;
  onContinuar: () => void;
  onDescartar: () => void;
  /** Un pedido en vuelo: los botones no se tocan dos veces. */
  ocupado?: boolean;
  /** Un rechazo del backend, dicho arriba de todo. */
  aviso?: string | null;
}

const NOMBRE: Record<Juego, string> = {
  FLASH_GRID: t("GIMNASIA.CUADRICULA.NOMBRE"),
  REVERSE_CHAIN: t("GIMNASIA.CADENA.NOMBRE"),
  REAL_RECALL: t("GIMNASIA.RECUERDO.NOMBRE"),
};

export function nombreDeJuego(juego: Juego): string {
  return NOMBRE[juego];
}

/**
 * Mientras carga — `P-12`. **Lo fijo va real** (eyebrow, título, subtítulo, títulos
 * de sección, la descripción de Memoria y el aviso); **los datos son bloques
 * mudos**: ni cifras, ni materias, ni botones antes de saber si hay sesión abierta.
 */
export function GimnasiaEsqueleto() {
  return (
    <PantallaCargando>
      <p style={{ margin: "0 0 6px", fontSize: "var(--text-label)", color: "var(--muted-foreground)" }}>{t("GIMNASIA.EYEBROW")}</p>
      <TituloDePanel titulo={t("GIMNASIA.TITULO")} subcopy={t("GIMNASIA.SUBCOPY")} />
      <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
        <section aria-hidden style={{ ...estiloPanel, display: "flex", flexWrap: "wrap", gap: 20, justifyContent: "space-between", alignItems: "flex-end" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 6, flex: "1 1 320px" }}>
            <Renglon cuerpo="label" ancho={120} />
            <Renglon cuerpo="title-sm" ancho="45%" />
            <Parrafo renglones={2} cuerpo="body" />
          </div>
          <div style={{ flex: "0 1 220px", minWidth: 180 }}>
            <CTAEsqueleto />
          </div>
        </section>

        <section>
          <h2 style={{ margin: "0 0 10px", fontSize: "var(--text-title-sm)", fontWeight: 600 }}>{t("GIMNASIA.PROGRESO.TITULO")}</h2>
          <div aria-hidden style={{ ...estiloPanel, display: "grid", gap: 16, gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 170px), 1fr))" }}>
            {[0, 1, 2, 3].map((i) => (
              <div key={i} style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <Renglon cuerpo="label" ancho="80%" />
                <Renglon cuerpo="title-sm" ancho={48} />
              </div>
            ))}
          </div>
        </section>

        <section>
          <h2 style={{ margin: 0, fontSize: "var(--text-title-sm)", fontWeight: 600 }}>{t("GIMNASIA.CATEGORIA.TITULO")}</h2>
          <p className="subcopy" style={{ margin: "2px 0 12px" }}>{t("GIMNASIA.CATEGORIA.DESCRIPCION")}</p>
          <ul aria-hidden style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: 14, gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 280px), 1fr))" }}>
            {[0, 1, 2].map((i) => (
              <li key={i} style={{ ...estiloPanel, display: "flex", flexDirection: "column", gap: 10 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <Esqueleto ancho={44} alto={44} radio={12} />
                  <div style={{ flex: 1 }}>
                    <Renglon cuerpo="body" ancho="60%" />
                    <Renglon cuerpo="label" ancho="45%" />
                  </div>
                </div>
                <Parrafo renglones={3} cuerpo="body" />
                <Renglon cuerpo="label" ancho="55%" />
                <Esqueleto ancho={120} alto={40} radio="var(--radius-control)" />
              </li>
            ))}
          </ul>
        </section>

        <p style={{ margin: 0, fontSize: "var(--text-label)", color: "var(--muted-foreground)", lineHeight: 1.5 }}>{t("GIMNASIA.AVISO_RESPONSABLE")}</p>
      </div>
    </PantallaCargando>
  );
}

export function Gimnasia(props: GimnasiaScreenProps) {
  const { rutina, sesionEnCurso, progreso, simulada, aviso } = props;
  const abierta = sesionEnCurso !== null;
  const empezarAparece = ctaRegistry["CTA-024"].aparece(contexto({ rutinaIniciable: !abierta }));

  return (
    <div>
      <p style={{ margin: "0 0 6px", fontSize: "var(--text-label)", color: "var(--muted-foreground)" }}>
        {t("GIMNASIA.EYEBROW")}
      </p>
      {/* `D-01`: el `h1` lo dibuja la primitiva, y va fuera del contenedor con `gap`. */}
      <TituloDePanel titulo={t("GIMNASIA.TITULO")} subcopy={t("GIMNASIA.SUBCOPY")} />

      <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
        {aviso && (
          <p role="alert" style={{ margin: 0, padding: "10px 14px", borderRadius: "var(--radius-control)", background: "var(--urgencia-tinte)", color: "var(--urgencia-tinte-texto)", fontSize: "var(--text-body)" }}>
            {aviso}
          </p>
        )}
        {simulada && (
          <p role="note" style={{ margin: 0, padding: "10px 14px", borderRadius: 12, border: "0.5px dashed var(--border)", background: "var(--muted)", fontSize: "var(--text-label)", color: "var(--muted-foreground)" }}>
            {t("GIMNASIA.AVISO_SIMULADA")}
          </p>
        )}

        {/* ── Rutina recomendada, o la sesión sin terminar ─────────────────── */}
        {sesionEnCurso ? (
          <section aria-labelledby="gimnasia-en-curso" style={estiloPanel}>
            <h2 id="gimnasia-en-curso" style={{ margin: 0, fontSize: "var(--text-title-sm)", fontWeight: 600 }}>
              {sesionEnCurso.origen === "ROUTINE" ? t("GIMNASIA.RUTINA.EN_CURSO") : t("GIMNASIA.RUTINA.JUEGO_EN_CURSO")}
            </h2>
            <p style={{ margin: "6px 0 14px", fontSize: "var(--text-body)", color: "var(--muted-foreground)" }}>
              {sesionEnCurso.juegos.map(nombreDeJuego).join(" · ")} — {sesionEnCurso.completados.length} {t("GIMNASIA.SESION.DE")}{" "}
              {sesionEnCurso.juegos.length} {t("GIMNASIA.RUTINA.HECHOS")}
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center" }}>
              <div style={{ minWidth: 200 }}>
                <CTAPrincipal onClick={props.onContinuar} disabled={props.ocupado}>
                  {t("GIMNASIA.RUTINA.CONTINUAR")}
                </CTAPrincipal>
              </div>
              <BotonSecundario onClick={props.onDescartar} disabled={props.ocupado}>
                {t("GIMNASIA.RUTINA.DESCARTAR")}
              </BotonSecundario>
            </div>
          </section>
        ) : (
          <section aria-labelledby="gimnasia-rutina" style={{ ...estiloPanel, display: "flex", flexWrap: "wrap", gap: 20, justifyContent: "space-between", alignItems: "flex-end" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 6, minWidth: 0, flex: "1 1 320px" }}>
              <h2 id="gimnasia-rutina" style={{ margin: 0, fontSize: "var(--text-label)", fontWeight: 600, color: "var(--muted-foreground)" }}>
                {t("GIMNASIA.RUTINA.TITULO")}
              </h2>
              <p style={{ margin: 0, fontSize: "var(--text-title-sm)", fontWeight: 600 }}>
                {t("GIMNASIA.RUTINA.CATEGORIA")} · {rutina.juegos.length} {t("GIMNASIA.RUTINA.EJERCICIOS")}
              </p>
              <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexWrap: "wrap", gap: "4px 16px", fontSize: "var(--text-body)", color: "var(--muted-foreground)" }}>
                <li>{rutina.minutos} {t("GIMNASIA.RUTINA.MINUTOS")}</li>
                <li>{rutina.adaptada ? t("GIMNASIA.RUTINA.ADAPTADA") : t("GIMNASIA.RUTINA.PRIMERA_VEZ")}</li>
                {rutina.materias.length > 0 && (
                  <li>{t("GIMNASIA.RUTINA.INCLUYE")} {rutina.materias.join(", ")}</li>
                )}
                {rutina.materias.length === 0 && rutina.juegos.includes("REAL_RECALL") && <li>{t("GIMNASIA.RUTINA.GENERAL")}</li>}
              </ul>
              {!rutina.juegos.includes("REAL_RECALL") && (
                <p style={{ margin: "4px 0 0", fontSize: "var(--text-label)", color: "var(--muted-foreground)" }}>
                  {t("GIMNASIA.RUTINA.SIN_PREGUNTAS")}
                </p>
              )}
            </div>
            {empezarAparece && (
              <div style={{ flex: "0 1 220px", minWidth: 180 }}>
                <CTAPrincipal onClick={props.onEmpezarRutina} disabled={props.ocupado}>
                  {t("GIMNASIA.RUTINA.EMPEZAR")}
                </CTAPrincipal>
              </div>
            )}
          </section>
        )}

        {/* ── Progreso breve ───────────────────────────────────────────────── */}
        <section aria-labelledby="gimnasia-progreso">
          <h2 id="gimnasia-progreso" style={{ margin: "0 0 10px", fontSize: "var(--text-title-sm)", fontWeight: 600 }}>
            {t("GIMNASIA.PROGRESO.TITULO")}
          </h2>
          <div style={{ ...estiloPanel, display: "grid", gap: 16, gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 170px), 1fr))" }}>
            <Cifra rotulo={t("GIMNASIA.PROGRESO.DIAS")} valor={progreso.diasConRutina} ausente="" />
            <Cifra rotulo={t("GIMNASIA.PROGRESO.SECUENCIA")} valor={progreso.mejorSecuenciaCuadricula} unidad={t("GIMNASIA.PROGRESO.CASILLAS")} ausente={t("GIMNASIA.PROGRESO.SIN_DATOS")} />
            <Cifra rotulo={t("GIMNASIA.PROGRESO.CADENA")} valor={progreso.mejorCadena} unidad={t("GIMNASIA.PROGRESO.DIGITOS")} ausente={t("GIMNASIA.PROGRESO.SIN_DATOS")} />
            <Cifra rotulo={t("GIMNASIA.PROGRESO.REPASOS")} valor={progreso.repasosCompletados} ausente="" />
            {/* Sin repasos separados por 24 h suficientes, **la línea desaparece**. */}
            {progreso.recuerdoDiferido && (
              <Cifra
                rotulo={t("GIMNASIA.PROGRESO.DIFERIDO")}
                valor={`${progreso.recuerdoDiferido.recordados} ${t("GIMNASIA.SESION.DE")} ${progreso.recuerdoDiferido.total}`}
                ausente=""
              />
            )}
          </div>
        </section>

        {/* ── La categoría y sus tres juegos ───────────────────────────────── */}
        <section aria-labelledby="gimnasia-memoria">
          <h2 id="gimnasia-memoria" style={{ margin: 0, fontSize: "var(--text-title-sm)", fontWeight: 600 }}>
            {t("GIMNASIA.CATEGORIA.TITULO")}
          </h2>
          <p className="subcopy" style={{ margin: "2px 0 12px" }}>{t("GIMNASIA.CATEGORIA.DESCRIPCION")}</p>
          <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: 14, gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 280px), 1fr))" }}>
            <TarjetaDeJuego
              icono={<Grid3x3 size={22} aria-hidden />}
              nombre={t("GIMNASIA.CUADRICULA.NOMBRE")}
              habilidad={t("GIMNASIA.CUADRICULA.HABILIDAD")}
              descripcion={t("GIMNASIA.CUADRICULA.DESCRIPCION")}
              modalidad={t("GIMNASIA.CUADRICULA.MODALIDAD")}
              progreso={props.cuadricula.mejorPuntuacion === null ? t("GIMNASIA.PROGRESO.SIN_DATOS") : `${t("GIMNASIA.CUADRICULA.MEJOR")}: ${props.cuadricula.mejorPuntuacion}`}
              cta={props.cuadricula.intentos > 0 ? t("GIMNASIA.CUADRICULA.VOLVER_A_JUGAR") : t("GIMNASIA.CUADRICULA.JUGAR")}
              aparece={ctaRegistry["CTA-025"].aparece(contexto({ juegoIniciable: !abierta }))}
              onJugar={() => props.onJugar("FLASH_GRID")}
              ocupado={props.ocupado}
            />
            <TarjetaDeJuego
              icono={<Undo2 size={22} aria-hidden />}
              nombre={t("GIMNASIA.CADENA.NOMBRE")}
              habilidad={t("GIMNASIA.CADENA.HABILIDAD")}
              descripcion={t("GIMNASIA.CADENA.DESCRIPCION")}
              modalidad={t("GIMNASIA.CADENA.MODALIDAD")}
              progreso={
                props.cadena.nivel === null
                  ? t("GIMNASIA.PROGRESO.SIN_DATOS")
                  : `${t("GIMNASIA.CADENA.NIVEL")} ${props.cadena.nivel} · ${props.cadena.largo} ${t("GIMNASIA.PROGRESO.DIGITOS")}`
              }
              cta={props.cadena.nivel === null ? t("GIMNASIA.CADENA.EMPEZAR") : t("GIMNASIA.CADENA.CONTINUAR")}
              aparece={ctaRegistry["CTA-025"].aparece(contexto({ juegoIniciable: !abierta }))}
              onJugar={() => props.onJugar("REVERSE_CHAIN")}
              ocupado={props.ocupado}
            />
            <TarjetaDeJuego
              icono={<Repeat2 size={22} aria-hidden />}
              nombre={t("GIMNASIA.RECUERDO.NOMBRE")}
              habilidad={t("GIMNASIA.RECUERDO.HABILIDAD")}
              descripcion={t("GIMNASIA.RECUERDO.DESCRIPCION")}
              modalidad={t("GIMNASIA.RECUERDO.MODALIDAD")}
              progreso={
                props.recuerdo.situacion === "SIN_CONTENIDO"
                  ? t("GIMNASIA.RECUERDO.SIN_CONTENIDO")
                  : props.recuerdo.situacion === "AL_DIA"
                    ? t("GIMNASIA.RECUERDO.AL_DIA")
                    : `${props.recuerdo.pendientes} ${t("GIMNASIA.RECUERDO.PARA_HOY")}`
              }
              detalle={props.recuerdo.situacion === "SIN_CONTENIDO" ? t("GIMNASIA.RECUERDO.SIN_CONTENIDO_DETALLE") : null}
              cta={props.recuerdo.practicoAntes ? t("GIMNASIA.RECUERDO.CONTINUAR") : t("GIMNASIA.RECUERDO.PRACTICAR")}
              // Sin preguntas pendientes no hay CTA: no aparece, no queda gris.
              aparece={ctaRegistry["CTA-025"].aparece(contexto({ juegoIniciable: !abierta && props.recuerdo.situacion === "PENDIENTES" }))}
              onJugar={() => props.onJugar("REAL_RECALL")}
              ocupado={props.ocupado}
            />
          </ul>
        </section>

        <p style={{ margin: 0, display: "flex", gap: 8, alignItems: "flex-start", fontSize: "var(--text-label)", color: "var(--muted-foreground)", lineHeight: 1.5 }}>
          <Brain size={16} aria-hidden style={{ flexShrink: 0, marginTop: 2 }} />
          {t("GIMNASIA.AVISO_RESPONSABLE")}
        </p>
      </div>
    </div>
  );
}

function TarjetaDeJuego(p: {
  icono: React.ReactNode;
  nombre: string;
  habilidad: string;
  descripcion: string;
  modalidad: string;
  progreso: string;
  detalle?: string | null;
  cta: string;
  aparece: boolean;
  onJugar: () => void;
  ocupado?: boolean;
}) {
  return (
    <li style={{ ...estiloPanel, display: "flex", flexDirection: "column", gap: 10 }} data-juego={p.nombre}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <span aria-hidden style={{ display: "grid", placeItems: "center", width: 44, height: 44, borderRadius: 12, background: "var(--muted)", color: "var(--foreground)", flexShrink: 0 }}>
          {p.icono}
        </span>
        <div style={{ minWidth: 0 }}>
          <h3 style={{ margin: 0, fontSize: "var(--text-body)", fontWeight: 600 }}>{p.nombre}</h3>
          <p style={{ margin: 0, fontSize: "var(--text-label)", color: "var(--muted-foreground)" }}>{p.habilidad}</p>
        </div>
      </div>
      <p style={{ margin: 0, fontSize: "var(--text-body)", lineHeight: 1.5 }}>{p.descripcion}</p>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center", fontSize: "var(--text-label)" }}>
        <span style={{ padding: "2px 10px", borderRadius: "var(--radius-pildora)", border: "1px solid var(--border)", color: "var(--muted-foreground)" }}>{p.modalidad}</span>
        <span style={{ fontWeight: 600 }}>{p.progreso}</span>
      </div>
      {p.detalle && <p style={{ margin: 0, fontSize: "var(--text-label)", color: "var(--muted-foreground)", lineHeight: 1.5 }}>{p.detalle}</p>}
      {p.aparece && (
        <div style={{ marginTop: "auto" }}>
          <BotonSecundario onClick={p.onJugar} disabled={p.ocupado}>
            {p.cta}
          </BotonSecundario>
        </div>
      )}
    </li>
  );
}
