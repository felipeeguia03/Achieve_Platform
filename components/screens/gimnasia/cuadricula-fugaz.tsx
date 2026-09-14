"use client";

/**
 * **Cuadrícula fugaz** — [ADR-102](../../../docs/decisions.md#adr-102) §5.
 *
 * ⚠️ **La pantalla no corrige ni puntúa.** Usa `jugarCuadricula` —la misma función
 * que el servidor— sólo para saber qué ronda sigue y dar la devolución inmediata.
 * Lo que se guarda lo recalcula el servidor con las respuestas.
 *
 * ## Accesibilidad
 *
 * - Cada casilla es un botón con su fila y columna: se juega entero con teclado.
 * - La casilla encendida lleva **su número de orden** además del relleno: no
 *   depende del color.
 * - **Presentación sin tiempo:** cada casilla queda encendida hasta tocar
 *   *Siguiente*, y el lector de pantalla la anuncia. Sigue siendo el mismo
 *   ejercicio —retener un orden de posiciones— a otro ritmo.
 * - `prefers-reduced-motion` apaga las transiciones; la presentación temporizada
 *   es la mecánica y sigue, con 700 ms por casilla y sin parpadeos.
 */

import { useEffect, useMemo, useRef, useState } from "react";

import { t } from "@/lib/content/es-AR";
import { jugarCuadricula, REGLAS_CUADRICULA } from "@/lib/domain/gimnasia/cuadricula-fugaz";
import {
  BotonPrincipal,
  BotonSecundario,
  InterruptorPasoAPaso,
  Retroalimentacion,
  useMenosMovimiento,
} from "./comun";

export interface CuadriculaFugazProps {
  semilla: number;
  largoInicial: number;
  /** Manda las respuestas al servidor. `false` ⇒ no se pudo guardar. */
  onTerminar: (respuestas: number[][]) => Promise<boolean>;
}

type Fase = "INSTRUCCIONES" | "MOSTRANDO" | "RESPONDIENDO" | "DEVOLUCION" | "GUARDANDO" | "ERROR";

export function CuadriculaFugaz({ semilla, largoInicial, onTerminar }: CuadriculaFugazProps) {
  const [fase, setFase] = useState<Fase>("INSTRUCCIONES");
  const [respuestas, setRespuestas] = useState<number[][]>([]);
  const [actual, setActual] = useState<number[]>([]);
  // -1 es la pausa antes de la primera casilla.
  const [paso, setPaso] = useState(-1);
  const [pasoAPaso, setPasoAPaso] = useState(false);
  const menosMovimiento = useMenosMovimiento();
  const foco = useRef<HTMLDivElement>(null);

  // La partida se deduce de las respuestas: **no cambia en un re-render**.
  const jugada = useMemo(() => jugarCuadricula(semilla, largoInicial, respuestas), [semilla, largoInicial, respuestas]);
  const partida = jugada.estado === "OK" ? jugada.partida : null;
  // La ronda que se muestra o se responde: la que sigue, o —en la devolución— la última jugada.
  const ultimaRonda = partida?.resultado.rondas.at(-1) ?? null;
  const ronda = partida?.siguiente ?? null;

  useEffect(() => {
    if (fase !== "MOSTRANDO" || !ronda || pasoAPaso) return;
    const espera = paso === -1 ? 500 : REGLAS_CUADRICULA.milisegundosPorCasilla;
    const id = setTimeout(() => {
      if (paso + 1 >= ronda.secuencia.length) {
        setPaso(-1);
        setFase("RESPONDIENDO");
      } else setPaso(paso + 1);
    }, espera);
    return () => clearTimeout(id);
  }, [fase, paso, ronda, pasoAPaso]);

  useEffect(() => {
    if (fase !== "DEVOLUCION" || pasoAPaso) return;
    const id = setTimeout(avanzar, 1400);
    return () => clearTimeout(id);
    // `avanzar` depende de la partida, que ya está en las dependencias.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fase, pasoAPaso, partida]);

  useEffect(() => {
    foco.current?.focus();
  }, [fase]);

  async function guardar(lista: number[][]) {
    setFase("GUARDANDO");
    const ok = await onTerminar(lista);
    if (!ok) setFase("ERROR");
  }

  function avanzar() {
    if (!partida) return;
    if (partida.terminada) void guardar(respuestas);
    else {
      setPaso(pasoAPaso ? 0 : -1);
      setFase("MOSTRANDO");
    }
  }

  function tocar(casilla: number) {
    if (fase !== "RESPONDIENDO" || !ronda) return;
    const nueva = [...actual, casilla];
    if (nueva.length < ronda.largo) {
      setActual(nueva);
      return;
    }
    setActual([]);
    setRespuestas([...respuestas, nueva]);
    setFase("DEVOLUCION");
  }

  if (!partida) {
    // Sólo con una semilla o un largo que no vinieron del servidor.
    return <Retroalimentacion bien={false}>{t("GIMNASIA.JUEGO.ERROR_GUARDAR")}</Retroalimentacion>;
  }

  if (fase === "INSTRUCCIONES") {
    return (
      <div ref={foco} tabIndex={-1} style={{ display: "flex", flexDirection: "column", gap: 14, outline: "none" }}>
        <p style={{ margin: 0, fontSize: "var(--text-body)", lineHeight: 1.6, maxWidth: 560 }}>{t("GIMNASIA.CUADRICULA.INSTRUCCION")}</p>
        <InterruptorPasoAPaso activo={pasoAPaso} onCambiar={setPasoAPaso} textoPrincipal={t("GIMNASIA.JUEGO.PASO_A_PASO")} detalle={t("GIMNASIA.JUEGO.PASO_A_PASO_DETALLE")} />
        <div>
          <BotonPrincipal onClick={() => { setPaso(pasoAPaso ? 0 : -1); setFase("MOSTRANDO"); }}>{t("GIMNASIA.JUEGO.EMPEZAR")}</BotonPrincipal>
        </div>
      </div>
    );
  }

  // En la devolución se dibuja la ronda que se acaba de jugar.
  const largo = fase === "DEVOLUCION" || fase === "GUARDANDO" || fase === "ERROR" ? (ultimaRonda?.largo ?? 3) : (ronda?.largo ?? 3);
  const lado = fase === "DEVOLUCION" || fase === "GUARDANDO" || fase === "ERROR" ? (ultimaRonda?.lado ?? 3) : (ronda?.lado ?? 3);
  const numeroDeRonda = (fase === "DEVOLUCION" ? partida.resultado.rondas.length : partida.resultado.rondas.length + 1);
  const encendida = fase === "MOSTRANDO" && ronda && paso >= 0 ? ronda.secuencia[paso] : null;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14, alignItems: "flex-start" }}>
      <div style={{ display: "flex", gap: 16, flexWrap: "wrap", fontSize: "var(--text-label)", color: "var(--muted-foreground)" }}>
        <span>{t("GIMNASIA.CUADRICULA.RONDA")} {Math.min(numeroDeRonda, REGLAS_CUADRICULA.rondasMaximas)} {t("GIMNASIA.SESION.DE")} {REGLAS_CUADRICULA.rondasMaximas}</span>
        <span>{largo} {t("GIMNASIA.PROGRESO.CASILLAS")}</span>
        <span>{t("GIMNASIA.JUEGO.ERRORES")}: {partida.resultado.errores} {t("GIMNASIA.SESION.DE")} {REGLAS_CUADRICULA.erroresMaximos}</span>
      </div>

      <div ref={foco} tabIndex={-1} aria-live="polite" style={{ fontSize: "var(--text-body)", fontWeight: 600, outline: "none", minHeight: 24 }}>
        {fase === "MOSTRANDO" && (
          pasoAPaso && encendida !== null
            ? `${t("GIMNASIA.CUADRICULA.CASILLA")} ${paso + 1} ${t("GIMNASIA.SESION.DE")} ${largo}: ${t("GIMNASIA.CUADRICULA.FILA")} ${Math.floor(encendida / lado) + 1}, ${t("GIMNASIA.CUADRICULA.COLUMNA")} ${(encendida % lado) + 1}`
            : t("GIMNASIA.CUADRICULA.MIRA")
        )}
        {fase === "RESPONDIENDO" && t("GIMNASIA.CUADRICULA.TU_TURNO")}
      </div>

      <div
        role="group"
        aria-label={`${t("GIMNASIA.CUADRICULA.NOMBRE")} ${lado}×${lado}`}
        style={{ display: "grid", gridTemplateColumns: `repeat(${lado}, minmax(0, 1fr))`, gap: 8, width: "min(100%, 360px)" }}
      >
        {Array.from({ length: lado * lado }, (_, i) => {
          const orden = actual.indexOf(i);
          const luz = encendida === i;
          return (
            <button
              key={`${lado}-${i}`}
              type="button"
              data-casilla={i}
              data-encendida={luz || undefined}
              aria-label={`${t("GIMNASIA.CUADRICULA.CASILLA")} ${t("GIMNASIA.CUADRICULA.FILA")} ${Math.floor(i / lado) + 1}, ${t("GIMNASIA.CUADRICULA.COLUMNA")} ${(i % lado) + 1}`}
              aria-disabled={fase !== "RESPONDIENDO"}
              onClick={() => tocar(i)}
              style={{
                aspectRatio: "1 / 1",
                minHeight: 44,
                borderRadius: 12,
                border: luz ? "3px solid var(--foreground)" : "1px solid var(--border)",
                background: luz ? "var(--primary)" : orden >= 0 ? "var(--muted)" : "var(--card)",
                color: luz ? "var(--primary-foreground)" : "var(--muted-foreground)",
                fontSize: "var(--text-title-sm)",
                fontWeight: 600,
                cursor: fase === "RESPONDIENDO" ? "pointer" : "default",
                transition: menosMovimiento ? "none" : "background 120ms linear",
              }}
            >
              {luz ? paso + 1 : orden >= 0 ? orden + 1 : ""}
            </button>
          );
        })}
      </div>

      {fase === "MOSTRANDO" && pasoAPaso && (
        <BotonSecundario
          onClick={() => {
            if (!ronda) return;
            if (paso + 1 >= ronda.secuencia.length) {
              setPaso(-1);
              setFase("RESPONDIENDO");
            } else setPaso(paso + 1);
          }}
        >
          {t("GIMNASIA.JUEGO.SIGUIENTE")}
        </BotonSecundario>
      )}

      {fase === "RESPONDIENDO" && actual.length > 0 && (
        <BotonSecundario onClick={() => setActual(actual.slice(0, -1))}>{t("GIMNASIA.CUADRICULA.BORRAR")}</BotonSecundario>
      )}

      {fase === "DEVOLUCION" && ultimaRonda && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10, alignItems: "flex-start" }}>
          <Retroalimentacion bien={ultimaRonda.correcta}>
            {ultimaRonda.correcta ? t("GIMNASIA.CUADRICULA.BIEN") : t("GIMNASIA.CUADRICULA.MAL")}
          </Retroalimentacion>
          <BotonSecundario onClick={avanzar}>{t("GIMNASIA.JUEGO.SIGUIENTE")}</BotonSecundario>
        </div>
      )}

      {fase === "GUARDANDO" && <p role="status" style={{ margin: 0 }}>{t("GIMNASIA.JUEGO.TERMINADO")}…</p>}
      {fase === "ERROR" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10, alignItems: "flex-start" }}>
          <Retroalimentacion bien={false}>{t("GIMNASIA.JUEGO.ERROR_GUARDAR")}</Retroalimentacion>
          <BotonPrincipal onClick={() => void guardar(respuestas)}>{t("GIMNASIA.JUEGO.REINTENTAR")}</BotonPrincipal>
        </div>
      )}
    </div>
  );
}
