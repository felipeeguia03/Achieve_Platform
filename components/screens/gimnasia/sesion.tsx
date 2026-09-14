"use client";

/**
 * La sesión de Gimnasia en curso: la rutina de tres ejercicios o un juego suelto
 * — [ADR-102](../../../docs/decisions.md#adr-102) §3.
 *
 * ## Lo que esta pantalla hace cumplir
 *
 * - **No hay reproducción infinita.** La rutina tiene tres pasos y un final.
 * - **Salir no pierde nada.** Lo terminado ya está guardado; con progreso, se
 *   pregunta si retomar después o descartar.
 * - **Al terminar se vuelve a la próxima acción, que decide Hoy.** Esta pantalla
 *   no nombra ninguna acción: lleva a donde el ADE la dice.
 * - **La pantalla no habla con la API.** Recibe `acciones`; la superficie las ata.
 */

import { useEffect, useRef, useState } from "react";

import { t } from "@/lib/content/es-AR";
import { juegoSiguiente, type Juego } from "@/lib/domain/gimnasia/rutina";
import type { ResultadoDeRecuerdo } from "@/lib/domain/gimnasia/recuerdo-real";
import type { IntentoEmpezado, ResultadoDeIntento, ResumenDeJuego, SesionEnCurso } from "@/lib/domain/gimnasia/vista";
import { CTAPrincipal, CTASecundaria } from "../design-system";
import { nombreDeJuego } from "../gimnasia";
import { CadenaInversa } from "./cadena-inversa";
import { BotonPrincipal, BotonSecundario, claveNueva, duracionLegible, estiloPanel, fechaCorta, Retroalimentacion } from "./comun";
import { CuadriculaFugaz } from "./cuadricula-fugaz";
import { RecuerdoReal, type RespuestaDeRecuerdoCliente } from "./recuerdo-real";

export interface AccionesDeGimnasia {
  iniciarIntento: (sesionId: string, juego: Juego, clave: string) => Promise<IntentoEmpezado | null>;
  confirmarResultado: (intentoId: string, respuestas: unknown) => Promise<ResultadoDeIntento | null>;
  responder: (pedido: {
    intento: string;
    item: string;
    accion: "RESPONDER" | "REVELAR" | "AUTOEVALUAR";
    respuesta?: string;
    resultado?: ResultadoDeRecuerdo;
    clave?: string;
  }) => Promise<RespuestaDeRecuerdoCliente>;
  cancelar: (sesionId: string) => Promise<boolean>;
}

export interface SesionDeGimnasiaProps {
  sesion: SesionEnCurso;
  acciones: AccionesDeGimnasia;
  /** Volver a la portada. La sesión, si sigue abierta, queda para retomar. */
  onSalir: () => void;
  onVolverAHoy: () => void;
}

type Fase = "JUGANDO" | "RESUMEN_DE_JUEGO" | "FINAL" | "CONFIRMAR_SALIDA";

export function SesionDeGimnasia({ sesion, acciones, onSalir, onVolverAHoy }: SesionDeGimnasiaProps) {
  const [completados, setCompletados] = useState<Juego[]>(sesion.completados);
  const [resultados, setResultados] = useState<Array<{ resumen: ResumenDeJuego; duracion: number }>>([]);
  // El resumen final lo arma el servidor con **todos** los juegos de la sesión,
  // también los jugados antes de una recarga.
  const [final, setFinal] = useState<ResultadoDeIntento["sesion"]>(null);
  const [fase, setFase] = useState<Fase>("JUGANDO");
  const [intento, setIntento] = useState<IntentoEmpezado | null>(null);
  const [errorDeInicio, setErrorDeInicio] = useState(false);
  const [intentos, setIntentos] = useState(0);
  const [empezado, setEmpezado] = useState(false);
  // Una clave por juego **por montaje**: el doble efecto de desarrollo pide lo
  // mismo dos veces y recibe el mismo intento; una recarga pide uno nuevo.
  const claves = useRef(new Map<Juego, string>());
  const titulo = useRef<HTMLHeadingElement>(null);

  const juego = juegoSiguiente(sesion.juegos, completados);
  const rutina = sesion.origen === "ROUTINE";
  // Confirmar la salida **no desmonta el juego**: se oculta y sigue donde estaba.
  const enJuego = fase === "JUGANDO" || fase === "CONFIRMAR_SALIDA";

  useEffect(() => {
    if (!enJuego || !juego) return;
    let vigente = true;
    if (!claves.current.has(juego)) claves.current.set(juego, claveNueva());
    acciones.iniciarIntento(sesion.id, juego, claves.current.get(juego)!).then((r) => {
      if (!vigente) return;
      if (r) setIntento(r);
      else setErrorDeInicio(true);
    });
    return () => {
      vigente = false;
    };
  }, [enJuego, juego, sesion.id, acciones, intentos]);

  useEffect(() => {
    titulo.current?.focus();
  }, [fase, juego]);

  function alTerminar(r: ResultadoDeIntento) {
    const hecho = r.resumen.juego;
    setResultados((xs) => [...xs, { resumen: r.resumen, duracion: r.duracionSegundos }]);
    setFinal(r.sesion);
    setCompletados((xs) => (xs.includes(hecho) ? xs : [...xs, hecho]));
    setIntento(null);
    setEmpezado(false);
    setFase(r.sesionCompletada ? "FINAL" : "RESUMEN_DE_JUEGO");
  }

  async function confirmar(respuestas: unknown): Promise<boolean> {
    if (!intento) return false;
    const r = await acciones.confirmarResultado(intento.intento, respuestas);
    if (!r) return false;
    alTerminar(r);
    return true;
  }

  async function salir() {
    const hayProgreso = completados.length > 0 || empezado;
    if (hayProgreso) {
      setFase("CONFIRMAR_SALIDA");
      return;
    }
    // Sin nada hecho, la sesión no le sirve a nadie: se descarta sin preguntar.
    await acciones.cancelar(sesion.id);
    onSalir();
  }

  const indice = Math.min(completados.length + 1, sesion.juegos.length);
  const encabezado = rutina ? t("GIMNASIA.RUTINA.CATEGORIA") : juego ? nombreDeJuego(juego) : nombreDeJuego(sesion.juegos[0]);

  // ── El final ───────────────────────────────────────────────────────────────
  if (fase === "FINAL") {
    const lista = final ? final.juegos.map((j) => ({ resumen: j.resumen, duracion: j.duracionSegundos })) : resultados;
    const total = final ? final.duracionSegundos : resultados.reduce((s, r) => s + r.duracion, 0);
    return (
      <section aria-labelledby="gimnasia-final" style={{ display: "flex", flexDirection: "column", gap: 18, maxWidth: 720 }}>
        <h2 id="gimnasia-final" ref={titulo} tabIndex={-1} style={{ margin: 0, fontSize: "var(--text-title-lg)", fontWeight: 600, outline: "none" }}>
          {rutina ? t("GIMNASIA.SESION.TERMINADA") : t("GIMNASIA.JUEGO.TERMINADO")}
        </h2>
        <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 10 }}>
          {lista.map((r) => (
            <li key={r.resumen.juego} style={estiloPanel}>
              <Resumen resumen={r.resumen} duracion={r.duracion} />
            </li>
          ))}
        </ul>
        {lista.length > 0 && (
          <p style={{ margin: 0, fontSize: "var(--text-label)", color: "var(--muted-foreground)" }}>
            {t("GIMNASIA.SESION.DURACION")}: {duracionLegible(total)}
          </p>
        )}
        <div style={{ maxWidth: 320 }}>
          <CTAPrincipal onClick={onVolverAHoy}>{t("GIMNASIA.SESION.VOLVER_A_LA_ACCION")}</CTAPrincipal>
          <CTASecundaria onClick={onSalir}>{t("GIMNASIA.SESION.VER_JUEGOS")}</CTASecundaria>
        </div>
      </section>
    );
  }

  return (
    <section aria-labelledby="gimnasia-sesion" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <header style={{ display: "flex", flexWrap: "wrap", gap: 12, justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 6, minWidth: 0, flex: "1 1 240px" }}>
          <h2 id="gimnasia-sesion" ref={titulo} tabIndex={-1} style={{ margin: 0, fontSize: "var(--text-title-sm)", fontWeight: 600, outline: "none" }}>
            {encabezado}
            {rutina && juego && <span style={{ fontWeight: 400, color: "var(--muted-foreground)" }}> · {nombreDeJuego(juego)}</span>}
          </h2>
          {rutina && (
            <>
              <span style={{ fontSize: "var(--text-label)", color: "var(--muted-foreground)" }}>
                {indice} {t("GIMNASIA.SESION.DE")} {sesion.juegos.length}
              </span>
              <div
                role="progressbar"
                aria-valuemin={0}
                aria-valuemax={sesion.juegos.length}
                aria-valuenow={completados.length}
                aria-label={`${completados.length} ${t("GIMNASIA.SESION.DE")} ${sesion.juegos.length} ${t("GIMNASIA.RUTINA.HECHOS")}`}
                style={{ display: "flex", gap: 4, width: "min(100%, 240px)" }}
              >
                {sesion.juegos.map((j) => (
                  <span key={j} style={{ flex: 1, height: 6, borderRadius: 999, background: completados.includes(j) ? "var(--foreground)" : "var(--border)" }} />
                ))}
              </div>
            </>
          )}
        </div>
        {fase !== "CONFIRMAR_SALIDA" && <BotonSecundario onClick={() => void salir()}>{t("GIMNASIA.SESION.SALIR")}</BotonSecundario>}
      </header>

      {fase === "CONFIRMAR_SALIDA" && (
        <div role="alertdialog" aria-labelledby="gimnasia-salir" aria-describedby="gimnasia-salir-detalle" style={{ ...estiloPanel, display: "flex", flexDirection: "column", gap: 12 }}>
          <h3 id="gimnasia-salir" ref={titulo} tabIndex={-1} style={{ margin: 0, fontSize: "var(--text-body)", fontWeight: 600, outline: "none" }}>
            {t("GIMNASIA.SESION.SALIR_TITULO")}
          </h3>
          <p id="gimnasia-salir-detalle" style={{ margin: 0, fontSize: "var(--text-body)", color: "var(--muted-foreground)" }}>
            {t("GIMNASIA.SESION.SALIR_DETALLE")}
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            <BotonPrincipal onClick={() => setFase("JUGANDO")}>{t("GIMNASIA.SESION.SEGUIR")}</BotonPrincipal>
            <BotonSecundario onClick={onSalir}>{t("GIMNASIA.SESION.PAUSAR")}</BotonSecundario>
            <BotonSecundario
              onClick={async () => {
                await acciones.cancelar(sesion.id);
                onSalir();
              }}
            >
              {t("GIMNASIA.RUTINA.DESCARTAR")}
            </BotonSecundario>
          </div>
        </div>
      )}

      {fase === "RESUMEN_DE_JUEGO" && resultados.length > 0 && (
        <div style={{ ...estiloPanel, display: "flex", flexDirection: "column", gap: 14 }}>
          <Resumen resumen={resultados[resultados.length - 1].resumen} duracion={resultados[resultados.length - 1].duracion} />
          <div>
            <BotonPrincipal onClick={() => setFase("JUGANDO")}>{t("GIMNASIA.JUEGO.CONTINUAR_RUTINA")}</BotonPrincipal>
          </div>
        </div>
      )}

      {enJuego && juego && (
        <div hidden={fase !== "JUGANDO"} style={estiloPanel} onPointerDown={() => setEmpezado(true)} onKeyDown={() => setEmpezado(true)}>
          {errorDeInicio ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 10, alignItems: "flex-start" }}>
              <Retroalimentacion bien={false}>{t("GIMNASIA.JUEGO.ERROR_GUARDAR")}</Retroalimentacion>
              <BotonPrincipal onClick={() => { setErrorDeInicio(false); setIntentos((n) => n + 1); }}>{t("GIMNASIA.JUEGO.REINTENTAR")}</BotonPrincipal>
            </div>
          ) : !intento || intento.juego !== juego ? (
            <p role="status" style={{ margin: 0, color: "var(--muted-foreground)" }}>{t("GIMNASIA.CARGANDO")}</p>
          ) : intento.juego === "FLASH_GRID" ? (
            <CuadriculaFugaz key={intento.intento} semilla={intento.semilla} largoInicial={intento.largoInicial} onTerminar={confirmar} />
          ) : intento.juego === "REVERSE_CHAIN" ? (
            <CadenaInversa key={intento.intento} semilla={intento.semilla} largoInicial={intento.largoInicial} onTerminar={confirmar} />
          ) : (
            <>
              <p style={{ margin: "0 0 12px", fontSize: "var(--text-body)", color: "var(--muted-foreground)" }}>{t("GIMNASIA.RECUERDO.INSTRUCCION")}</p>
              <RecuerdoReal
                key={intento.intento}
                primera={intento.pregunta}
                onResponder={(p) => acciones.responder({ ...p, intento: intento.intento })}
                onTerminado={alTerminar}
                onSalirGuardando={() => confirmar(null)}
              />
            </>
          )}
        </div>
      )}
    </section>
  );
}

function Resumen({ resumen, duracion }: { resumen: ResumenDeJuego; duracion: number }) {
  const nombre = nombreDeJuego(resumen.juego);
  const filas: Array<[string, string]> = [];
  let marca: string | null = null;
  if (resumen.juego === "FLASH_GRID") {
    filas.push([t("GIMNASIA.CUADRICULA.PUNTUACION"), String(resumen.puntuacion)]);
    filas.push([t("GIMNASIA.CUADRICULA.SECUENCIA_MAXIMA"), `${resumen.secuenciaMaxima} ${t("GIMNASIA.PROGRESO.CASILLAS")}`]);
    filas.push([t("GIMNASIA.JUEGO.ACIERTOS"), `${resumen.aciertos} ${t("GIMNASIA.SESION.DE")} ${resumen.rondas}`]);
    marca = resumen.marca === "NUEVA" ? t("GIMNASIA.JUEGO.NUEVA_MARCA") : resumen.marca === "PRIMERA" ? t("GIMNASIA.JUEGO.PRIMERA_MARCA") : null;
  } else if (resumen.juego === "REVERSE_CHAIN") {
    filas.push([t("GIMNASIA.JUEGO.ACIERTOS"), `${resumen.aciertos} ${t("GIMNASIA.SESION.DE")} ${resumen.aciertos + resumen.errores}`]);
    filas.push([t("GIMNASIA.CADENA.CADENA_MAS_LARGA"), `${resumen.largoMaximoCorrecto} ${t("GIMNASIA.PROGRESO.DIGITOS")}`]);
    filas.push([t("GIMNASIA.CADENA.NIVEL"), String(resumen.nivel)]);
    marca =
      resumen.nivelAnterior !== null && resumen.nivel > resumen.nivelAnterior
        ? `${t("GIMNASIA.CADENA.NUEVO_NIVEL")}: ${resumen.nivel}`
        : resumen.marca === "NUEVA"
          ? t("GIMNASIA.JUEGO.NUEVA_MARCA")
          : resumen.marca === "PRIMERA"
            ? t("GIMNASIA.JUEGO.PRIMERA_MARCA")
            : null;
  } else {
    filas.push([t("GIMNASIA.RECUERDO.RESPONDIDAS"), String(resumen.respondidas)]);
    filas.push([t("GIMNASIA.RECUERDO.RECORDADAS"), String(resumen.recordadas)]);
    filas.push([t("GIMNASIA.RECUERDO.PARCIALES"), String(resumen.parciales)]);
    filas.push([t("GIMNASIA.RECUERDO.NO_RECORDADAS"), String(resumen.noRecordadas)]);
    if (resumen.proximoRepaso) filas.push([t("GIMNASIA.RECUERDO.PROXIMO_REPASO"), fechaCorta(resumen.proximoRepaso)]);
    if (resumen.materias.length > 0) filas.push([t("GIMNASIA.RECUERDO.MATERIAS"), resumen.materias.join(", ")]);
  }
  return (
    <div data-resumen={resumen.juego} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <h3 style={{ margin: 0, fontSize: "var(--text-body)", fontWeight: 600 }}>{nombre}</h3>
      {marca && (
        <p role="status" style={{ margin: 0, fontSize: "var(--text-label)", fontWeight: 600, color: "var(--exito-tinte-texto)", background: "var(--exito-tinte)", padding: "4px 10px", borderRadius: "var(--radius-pildora)", alignSelf: "flex-start" }}>
          ★ {marca}
        </p>
      )}
      <dl style={{ margin: 0, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 150px), 1fr))", gap: 10 }}>
        {filas.map(([k, v]) => (
          <div key={k}>
            <dt style={{ fontSize: "var(--text-label)", color: "var(--muted-foreground)" }}>{k}</dt>
            <dd style={{ margin: 0, fontSize: "var(--text-body)", fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>{v}</dd>
          </div>
        ))}
        <div>
          <dt style={{ fontSize: "var(--text-label)", color: "var(--muted-foreground)" }}>{t("GIMNASIA.SESION.DURACION")}</dt>
          <dd style={{ margin: 0, fontSize: "var(--text-body)", fontWeight: 600 }}>{duracionLegible(duracion)}</dd>
        </div>
      </dl>
    </div>
  );
}
