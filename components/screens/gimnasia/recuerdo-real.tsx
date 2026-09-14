"use client";

/**
 * **Recuerdo real** — [ADR-102](../../../docs/decisions.md#adr-102) §8.
 *
 * ## Lo que esta pantalla hace cumplir
 *
 * - **La referencia llega después de confirmar**, nunca antes: la pantalla no la
 *   tiene hasta que el servidor la devuelve.
 * - **Una abierta la clasifica el estudiante.** Escribe, confirma, ve la
 *   referencia y elige una de cuatro. No hay corrección automática ni «parecido».
 * - **Abrir no es responder.** Sólo cuenta lo confirmado; salir guarda eso.
 * - **El texto de una pregunta se dibuja como texto.** Nunca HTML: React lo
 *   escapa, y `pre-wrap` conserva los saltos de línea de una fórmula o una lista.
 */

import { useEffect, useRef, useState } from "react";

import { t } from "@/lib/content/es-AR";
import type { ResultadoDeRecuerdo } from "@/lib/domain/gimnasia/recuerdo-real";
import type { PreguntaDeRecuerdo, RespuestaRegistrada, ResultadoDeIntento } from "@/lib/domain/gimnasia/vista";
import { BotonPrincipal, BotonSecundario, claveNueva, fechaCorta, Retroalimentacion } from "./comun";

export type RespuestaDeRecuerdoCliente =
  | { estado: "OK"; registrada: RespuestaRegistrada }
  | { estado: "REVELADA"; respuestaCanonica: string; explicacion: string | null }
  | { estado: "ERROR" };

export interface RecuerdoRealProps {
  primera: PreguntaDeRecuerdo | null;
  onResponder: (pedido: {
    item: string;
    accion: "RESPONDER" | "REVELAR" | "AUTOEVALUAR";
    respuesta?: string;
    resultado?: ResultadoDeRecuerdo;
    /** Sin clave sólo `REVELAR`, que no guarda nada. */
    clave?: string;
  }) => Promise<RespuestaDeRecuerdoCliente>;
  onTerminado: (final: ResultadoDeIntento) => void;
  /** Terminar antes, guardando lo confirmado. `false` ⇒ no se pudo. */
  onSalirGuardando: () => Promise<boolean>;
}

type Fase = "RESPONDIENDO" | "AUTOEVALUANDO" | "REGISTRADA" | "ENVIANDO";

const RESULTADOS: readonly [ResultadoDeRecuerdo, Parameters<typeof t>[0]][] = [
  ["NOT_RECALLED", "GIMNASIA.RECUERDO.NO_LA_RECORDE"],
  ["PARTIAL", "GIMNASIA.RECUERDO.PARCIAL"],
  ["RECALLED", "GIMNASIA.RECUERDO.LA_RECORDE"],
  ["EASY", "GIMNASIA.RECUERDO.FACIL"],
];

export function RecuerdoReal({ primera, onResponder, onTerminado, onSalirGuardando }: RecuerdoRealProps) {
  const [pregunta, setPregunta] = useState<PreguntaDeRecuerdo | null>(primera);
  const [fase, setFase] = useState<Fase>("RESPONDIENDO");
  const [texto, setTexto] = useState("");
  const [revelada, setRevelada] = useState<{ respuestaCanonica: string; explicacion: string | null } | null>(null);
  const [registrada, setRegistrada] = useState<RespuestaRegistrada | null>(null);
  const [error, setError] = useState(false);
  const [confirmadas, setConfirmadas] = useState(0);
  // Una clave por pregunta presentada: el reintento del mismo toque no duplica.
  const clave = useRef(claveNueva());
  const titulo = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    titulo.current?.focus();
  }, [pregunta?.posicion, fase]);

  if (!pregunta) return null;
  const p = pregunta;
  const abierta = p.tipo === "SELF_ASSESSED";

  async function enviar(pedido: Parameters<RecuerdoRealProps["onResponder"]>[0], antes: Fase) {
    setFase("ENVIANDO");
    setError(false);
    const r = await onResponder(pedido);
    if (r.estado === "ERROR") {
      setError(true);
      setFase(antes);
      return;
    }
    if (r.estado === "REVELADA") {
      setRevelada({ respuestaCanonica: r.respuestaCanonica, explicacion: r.explicacion });
      setFase("AUTOEVALUANDO");
      return;
    }
    setRegistrada(r.registrada);
    setConfirmadas((n) => n + 1);
    setFase("REGISTRADA");
  }

  function confirmar(e: React.FormEvent) {
    e.preventDefault();
    const valor = texto.trim();
    if (valor === "") return;
    if (abierta) void enviar({ item: p.itemId, accion: "REVELAR" }, "RESPONDIENDO");
    else void enviar({ item: p.itemId, accion: "RESPONDER", respuesta: valor, clave: clave.current }, "RESPONDIENDO");
  }

  function siguiente() {
    if (!registrada) return;
    if (registrada.final) {
      onTerminado(registrada.final);
      return;
    }
    clave.current = claveNueva();
    setPregunta(registrada.siguiente);
    setRegistrada(null);
    setRevelada(null);
    setTexto("");
    setFase("RESPONDIENDO");
  }

  const referencia = registrada ?? revelada;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14, maxWidth: 680 }}>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center", fontSize: "var(--text-label)", color: "var(--muted-foreground)" }}>
        <span>{t("GIMNASIA.RECUERDO.PREGUNTA")} {p.posicion + 1} {t("GIMNASIA.SESION.DE")} {p.total}</span>
        <span style={{ padding: "2px 10px", borderRadius: "var(--radius-pildora)", border: "1px solid var(--border)" }}>{p.materia ?? t("GIMNASIA.RECUERDO.GENERAL")}</span>
        {p.sintetica && (
          <span style={{ padding: "2px 10px", borderRadius: "var(--radius-pildora)", border: "0.5px dashed var(--border)", background: "var(--muted)" }}>
            {t("GIMNASIA.RECUERDO.SINTETICA")}
          </span>
        )}
      </div>

      <h3 ref={titulo} tabIndex={-1} style={{ margin: 0, fontSize: "var(--text-title-sm)", fontWeight: 600, lineHeight: 1.4, whiteSpace: "pre-wrap", outline: "none" }}>
        {p.pregunta}
      </h3>

      {fase === "RESPONDIENDO" || (fase === "ENVIANDO" && !referencia) ? (
        <form onSubmit={confirmar} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {p.tipo === "MULTIPLE_CHOICE" && p.opciones && (
            <fieldset style={{ border: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 8 }}>
              <legend style={{ fontSize: "var(--text-label)", color: "var(--muted-foreground)", marginBottom: 6 }}>{t("GIMNASIA.RECUERDO.TU_RESPUESTA")}</legend>
              {p.opciones.map((o) => (
                <label key={o.id} style={{ display: "flex", gap: 10, alignItems: "center", padding: "10px 12px", minHeight: 44, borderRadius: "var(--radius-control)", border: `1px solid ${texto === o.id ? "var(--foreground)" : "var(--border)"}`, cursor: "pointer" }}>
                  <input type="radio" name="opcion" value={o.id} checked={texto === o.id} onChange={() => setTexto(o.id)} />
                  <span style={{ whiteSpace: "pre-wrap" }}>{o.texto}</span>
                </label>
              ))}
            </fieldset>
          )}
          {p.tipo === "TRUE_FALSE" && (
            <fieldset style={{ border: "none", margin: 0, padding: 0, display: "flex", gap: 8, flexWrap: "wrap" }}>
              <legend style={{ fontSize: "var(--text-label)", color: "var(--muted-foreground)", marginBottom: 6 }}>{t("GIMNASIA.RECUERDO.TU_RESPUESTA")}</legend>
              {(["true", "false"] as const).map((v) => (
                <label key={v} style={{ display: "flex", gap: 8, alignItems: "center", padding: "10px 16px", minHeight: 44, borderRadius: "var(--radius-control)", border: `1px solid ${texto === v ? "var(--foreground)" : "var(--border)"}`, cursor: "pointer" }}>
                  <input type="radio" name="vf" value={v} checked={texto === v} onChange={() => setTexto(v)} />
                  {v === "true" ? t("GIMNASIA.RECUERDO.VERDADERO") : t("GIMNASIA.RECUERDO.FALSO")}
                </label>
              ))}
            </fieldset>
          )}
          {(p.tipo === "SHORT_ANSWER" || abierta) && (
            <>
              <label htmlFor="recuerdo-respuesta" style={{ fontSize: "var(--text-label)", color: "var(--muted-foreground)" }}>
                {t("GIMNASIA.RECUERDO.TU_RESPUESTA")}
              </label>
              {abierta ? (
                <textarea id="recuerdo-respuesta" value={texto} onChange={(e) => setTexto(e.target.value)} rows={4} maxLength={2000} style={estiloCampo} />
              ) : (
                <input id="recuerdo-respuesta" value={texto} onChange={(e) => setTexto(e.target.value)} maxLength={200} autoComplete="off" style={estiloCampo} />
              )}
            </>
          )}
          {error && <Retroalimentacion bien={false}>{t("GIMNASIA.JUEGO.ERROR_GUARDAR")}</Retroalimentacion>}
          <div>
            <BotonPrincipal tipo="submit" disabled={texto.trim() === "" || fase === "ENVIANDO"}>{t("GIMNASIA.RECUERDO.CONFIRMAR")}</BotonPrincipal>
          </div>
        </form>
      ) : null}

      {referencia && (
        <section aria-live="polite" style={{ display: "flex", flexDirection: "column", gap: 8, padding: "14px 16px", borderRadius: "var(--radius-control)", background: "var(--muted)" }}>
          {registrada && registrada.correcta !== null && (
            <Retroalimentacion bien={registrada.correcta}>{registrada.correcta ? t("GIMNASIA.RECUERDO.BIEN") : t("GIMNASIA.RECUERDO.MAL")}</Retroalimentacion>
          )}
          <h4 style={{ margin: 0, fontSize: "var(--text-label)", color: "var(--muted-foreground)" }}>{t("GIMNASIA.RECUERDO.REFERENCIA")}</h4>
          <p style={{ margin: 0, fontSize: "var(--text-body)", whiteSpace: "pre-wrap" }}>{referencia.respuestaCanonica}</p>
          {referencia.explicacion && <p style={{ margin: 0, fontSize: "var(--text-label)", color: "var(--muted-foreground)", whiteSpace: "pre-wrap" }}>{referencia.explicacion}</p>}
        </section>
      )}

      {(fase === "AUTOEVALUANDO" || (fase === "ENVIANDO" && revelada && !registrada)) && (
        <fieldset style={{ border: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 8 }}>
          <legend style={{ fontSize: "var(--text-body)", fontWeight: 600, marginBottom: 8 }}>{t("GIMNASIA.RECUERDO.COMO_TE_FUE")}</legend>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {RESULTADOS.map(([valor, copy]) => (
              <BotonSecundario
                key={valor}
                disabled={fase === "ENVIANDO"}
                onClick={() => void enviar({ item: p.itemId, accion: "AUTOEVALUAR", resultado: valor, clave: clave.current }, "AUTOEVALUANDO")}
              >
                {t(copy)}
              </BotonSecundario>
            ))}
          </div>
          {error && <Retroalimentacion bien={false}>{t("GIMNASIA.JUEGO.ERROR_GUARDAR")}</Retroalimentacion>}
        </fieldset>
      )}

      {fase === "REGISTRADA" && registrada && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10, alignItems: "flex-start" }}>
          <p role="status" style={{ margin: 0, fontSize: "var(--text-label)" }}>
            {t("GIMNASIA.RECUERDO.VUELVE")} {fechaCorta(registrada.proximoRepaso)}
          </p>
          <BotonPrincipal onClick={siguiente}>{t("GIMNASIA.RECUERDO.SIGUIENTE")}</BotonPrincipal>
        </div>
      )}

      {confirmadas > 0 && fase !== "REGISTRADA" && (
        <div>
          <BotonSecundario
            onClick={async () => {
              setFase("ENVIANDO");
              if (!(await onSalirGuardando())) {
                setError(true);
                setFase("RESPONDIENDO");
              }
            }}
          >
            {t("GIMNASIA.RECUERDO.SALIR_GUARDANDO")}
          </BotonSecundario>
        </div>
      )}
    </div>
  );
}

const estiloCampo: React.CSSProperties = {
  minHeight: 44,
  padding: "10px 12px",
  borderRadius: "var(--radius-control)",
  border: "1px solid var(--border)",
  background: "var(--card)",
  color: "var(--foreground)",
  font: "inherit",
  fontSize: "var(--text-body)",
};
