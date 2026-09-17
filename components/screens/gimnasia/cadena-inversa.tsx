"use client";

/**
 * **Cadena inversa** — [ADR-102](../../../docs/decisions.md#adr-102) §6.
 *
 * ⚠️ **La pantalla no fija el nivel ni guarda nada.** Usa `jugarCadena` —la misma
 * función que el servidor— para saber qué cadena sigue y dar la devolución; el
 * nivel que queda lo calcula el servidor.
 *
 * ## Accesibilidad
 *
 * - Los dígitos se muestran **quietos y grandes**, separados por espacios, sin
 *   animación. *Ya lo memoricé* los oculta antes si el estudiante quiere.
 * - **Presentación sin tiempo:** la cadena queda a la vista —y la lee el lector
 *   de pantalla dígito por dígito— hasta tocar *Ya lo memoricé*.
 * - **No se puede pegar** en la respuesta: pegar la cadena anula el ejercicio.
 * - Espacios, puntos y guiones no cuentan: `1 8 3` y `1-8-3` son `183`.
 */

import { useEffect, useMemo, useRef, useState } from "react";

import { t } from "@/lib/content/es-AR";
import { jugarCadena, milisegundosDeExposicion, REGLAS_CADENA } from "@/lib/domain/gimnasia/cadena-inversa";
import { BotonPrincipal, BotonSecundario, InterruptorPasoAPaso, Retroalimentacion } from "./comun";

export interface CadenaInversaProps {
  semilla: number;
  largoInicial: number;
  onTerminar: (respuestas: string[]) => Promise<boolean>;
}

type Fase = "INSTRUCCIONES" | "MOSTRANDO" | "RESPONDIENDO" | "DEVOLUCION" | "GUARDANDO" | "ERROR";

export function CadenaInversa({ semilla, largoInicial, onTerminar }: CadenaInversaProps) {
  const [fase, setFase] = useState<Fase>("INSTRUCCIONES");
  const [respuestas, setRespuestas] = useState<string[]>([]);
  const [texto, setTexto] = useState("");
  const [pasoAPaso, setPasoAPaso] = useState(false);
  const campo = useRef<HTMLInputElement>(null);
  const foco = useRef<HTMLDivElement>(null);

  const jugada = useMemo(() => jugarCadena(semilla, largoInicial, respuestas), [semilla, largoInicial, respuestas]);
  const partida = jugada.estado === "OK" ? jugada.partida : null;
  const prueba = partida?.siguiente ?? null;
  const ultima = partida?.resultado.pruebas.at(-1) ?? null;

  useEffect(() => {
    if (fase !== "MOSTRANDO" || !prueba || pasoAPaso) return;
    const id = setTimeout(() => setFase("RESPONDIENDO"), milisegundosDeExposicion(prueba.largo));
    return () => clearTimeout(id);
  }, [fase, prueba, pasoAPaso]);

  useEffect(() => {
    if (fase === "RESPONDIENDO") campo.current?.focus();
    else foco.current?.focus();
  }, [fase]);

  async function guardar(lista: string[]) {
    setFase("GUARDANDO");
    if (!(await onTerminar(lista))) setFase("ERROR");
  }

  function confirmar(e: React.FormEvent) {
    e.preventDefault();
    if (fase !== "RESPONDIENDO" || texto.trim() === "") return;
    setRespuestas([...respuestas, texto]);
    setTexto("");
    setFase("DEVOLUCION");
  }

  function avanzar() {
    if (!partida) return;
    if (partida.terminada) void guardar(respuestas);
    else setFase("MOSTRANDO");
  }

  if (!partida) return <Retroalimentacion bien={false}>{t("GIMNASIA.JUEGO.ERROR_GUARDAR")}</Retroalimentacion>;

  if (fase === "INSTRUCCIONES") {
    return (
      <div ref={foco} tabIndex={-1} style={{ display: "flex", flexDirection: "column", gap: 14, outline: "none" }}>
        <p style={{ margin: 0, fontSize: "var(--text-body)", lineHeight: 1.6, maxWidth: 560 }}>{t("GIMNASIA.CADENA.INSTRUCCION")}</p>
        <InterruptorPasoAPaso activo={pasoAPaso} onCambiar={setPasoAPaso} textoPrincipal={t("GIMNASIA.JUEGO.PASO_A_PASO")} detalle={t("GIMNASIA.JUEGO.PASO_A_PASO_DETALLE")} />
        <div>
          <BotonPrincipal onClick={() => setFase("MOSTRANDO")}>{t("GIMNASIA.JUEGO.EMPEZAR")}</BotonPrincipal>
        </div>
      </div>
    );
  }

  const hechas = partida.resultado.pruebas.length;
  const cambio = fase === "DEVOLUCION" && ultima && prueba ? Math.sign(prueba.largo - ultima.largo) : 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14, alignItems: "flex-start" }}>
      <div style={{ display: "flex", gap: 16, flexWrap: "wrap", fontSize: "var(--text-label)", color: "var(--muted-foreground)" }}>
        <span>
          {t("GIMNASIA.CADENA.PRUEBA")} {Math.min(fase === "DEVOLUCION" ? hechas : hechas + 1, REGLAS_CADENA.pruebasPorSesion)} {t("GIMNASIA.SESION.DE")} {REGLAS_CADENA.pruebasPorSesion}
        </span>
        {prueba && fase !== "DEVOLUCION" && <span>{prueba.largo} {t("GIMNASIA.PROGRESO.DIGITOS")}</span>}
      </div>

      {fase === "MOSTRANDO" && prueba && (
        <div ref={foco} tabIndex={-1} style={{ display: "flex", flexDirection: "column", gap: 12, outline: "none" }}>
          <p style={{ margin: 0, fontSize: "var(--text-body)", fontWeight: 600 }}>{t("GIMNASIA.CADENA.MEMORIZA")}</p>
          <p
            data-cadena
            aria-live={pasoAPaso ? "polite" : "off"}
            style={{ margin: 0, fontFamily: "var(--font-mono)", fontSize: "clamp(28px, 7vw, 44px)", fontWeight: 600, letterSpacing: "0.2em", fontVariantNumeric: "tabular-nums", wordBreak: "break-all" }}
          >
            {[...prueba.cadena].join(" ")}
          </p>
          <div>
            <BotonSecundario onClick={() => setFase("RESPONDIENDO")}>{t("GIMNASIA.JUEGO.LISTO")}</BotonSecundario>
          </div>
        </div>
      )}

      {fase === "RESPONDIENDO" && (
        <form onSubmit={confirmar} style={{ display: "flex", flexDirection: "column", gap: 10, width: "min(100%, 360px)" }}>
          <label htmlFor="cadena-respuesta" style={{ fontSize: "var(--text-body)", fontWeight: 600 }}>
            {t("GIMNASIA.CADENA.RESPUESTA")}
          </label>
          <input
            id="cadena-respuesta"
            ref={campo}
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            onPaste={(e) => e.preventDefault()}
            onDrop={(e) => e.preventDefault()}
            inputMode="numeric"
            autoComplete="off"
            spellCheck={false}
            maxLength={40}
            style={{ minHeight: 48, padding: "8px 12px", borderRadius: "var(--radius-control)", border: "1px solid var(--border)", background: "var(--card)", color: "var(--foreground)", fontFamily: "var(--font-mono)", fontSize: 24, letterSpacing: "0.15em" }}
          />
          <div>
            <BotonPrincipal tipo="submit" disabled={texto.trim() === ""}>{t("GIMNASIA.CADENA.CONFIRMAR")}</BotonPrincipal>
          </div>
        </form>
      )}

      {fase === "DEVOLUCION" && ultima && (
        <div ref={foco} tabIndex={-1} style={{ display: "flex", flexDirection: "column", gap: 10, alignItems: "flex-start", outline: "none" }}>
          <Retroalimentacion bien={ultima.correcta}>
            {ultima.correcta ? t("GIMNASIA.CADENA.BIEN") : `${t("GIMNASIA.CADENA.MAL")} ${[...ultima.correctaEra].join(" ")}`}
          </Retroalimentacion>
          {cambio > 0 && <p style={{ margin: 0, fontSize: "var(--text-label)" }}>{t("GIMNASIA.CADENA.MAS_LARGA")}</p>}
          {cambio < 0 && <p style={{ margin: 0, fontSize: "var(--text-label)" }}>{t("GIMNASIA.CADENA.MAS_CORTA")}</p>}
          <BotonPrincipal onClick={avanzar}>{t("GIMNASIA.JUEGO.SIGUIENTE")}</BotonPrincipal>
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
