"use client";

/**
 * **Tu recorrido** — el analítico, [ADR-106](../../docs/decisions.md#adr-106).
 *
 * Después de HOY y opcional. La pantalla **proyecta** lo que devuelve
 * `GET /api/recorrido`; qué se vinculó, qué se revisa y qué quedó guardado lo
 * decide el servidor.
 *
 * ## Cuatro momentos, una CTA primaria en cada uno
 *
 * | Momento | CTA |
 * |---|---|
 * | sin consentimiento | *Aceptar y seguir* (la casilla **no llega marcada**) |
 * | con consentimiento, sin documento | *Subir analítico* |
 * | documento procesado, sin confirmar | *Confirmar mi recorrido* |
 * | confirmado | ninguna del analítico: lo que sigue es el perfil (ADR-107) |
 *
 * ⚠️ **Nada de acá crea una cursada** y la pantalla lo dice (ADR-106 §2).
 */

import { useRef, useState } from "react";

import { llenarCopy, t, type CopyId } from "@/lib/content/es-AR";
import {
  candidatos,
  ESTADOS_DE_RESULTADO,
  resumenDelAnalitico,
  type EstadoDeResultado,
  type RecorridoLeido,
  type ResultadoLeido,
} from "@/lib/domain/analitico";
import type { EstadoDeRespuesta, PerfilVisible, PreguntaVisible } from "@/lib/domain/preguntas-de-recorrido";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { CTAPrincipal, CTASecundaria, ReglaDeNegocio, TituloDePanel } from "./design-system";
import { PantallaCargando, Renglon, Esqueleto } from "./esqueleto";

export type DatosDelRecorrido = RecorridoLeido & { pruebaDisponible: boolean; perfil: PerfilVisible };

export interface AccionesDelRecorrido {
  onConsentir: () => void;
  onSinAnalitico: () => void;
  onSubir: (archivo: File) => void;
  onUsarSintetico: () => void;
  onRevisar: (resultadoId: string, decision: "CONFIRMED" | "CORRECTED" | "UNSURE" | "NOT_IN_PLAN", requisitoId: string | null, estado: EstadoDeResultado | null) => void;
  onConfirmar: (documentoId: string) => void;
  onBorrar: () => void;
  onResponder: (clave: string, estado: EstadoDeRespuesta, opciones: string[], textoLibre: string | null) => void;
  onRechazarHipotesis: (id: string) => void;
}

const tarjeta: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 12,
  padding: "16px 18px",
  background: "var(--card)",
  border: "0.5px solid var(--border)",
  borderRadius: 14,
};
const meta: React.CSSProperties = { fontSize: "var(--text-label)", color: "var(--muted-foreground)" };

export function RecorridoEsqueleto() {
  return (
    <PantallaCargando>
      <TituloDePanel titulo={t("RECORRIDO.TITULO")} subcopy={t("RECORRIDO.SUBCOPY")} />
      <div aria-hidden style={{ ...tarjeta, marginTop: 16 }}>
        <Renglon cuerpo="body" ancho="60%" />
        <Renglon cuerpo="label" ancho="80%" />
        <Esqueleto ancho="100%" alto={96} radio={12} />
      </div>
    </PantallaCargando>
  );
}

export function Recorrido({
  datos,
  ocupado,
  aviso,
  acciones,
  perfil,
}: {
  datos: DatosDelRecorrido;
  ocupado: boolean;
  aviso: string | null;
  acciones: AccionesDelRecorrido;
  /** Lo que sigue a un recorrido confirmado: preguntas y perfil (ADR-107). */
  perfil?: React.ReactNode;
}) {
  const consintio = datos.consentimiento?.decision === "GRANTED";
  const doc = datos.documento;

  return (
    <div>
      <TituloDePanel titulo={t("RECORRIDO.TITULO")} subcopy={t("RECORRIDO.SUBCOPY")} />
      <div style={{ display: "flex", flexDirection: "column", gap: 16, marginTop: 16, maxWidth: 820 }}>
        {aviso && (
          <p role="alert" style={{ margin: 0, fontSize: "var(--text-label)", color: "var(--urgencia-texto)" }}>
            {aviso}
          </p>
        )}

        {!doc && !consintio && <Consentimiento ocupado={ocupado} acciones={acciones} />}
        {!doc && consintio && <Subida datos={datos} ocupado={ocupado} acciones={acciones} />}
        {doc && !doc.confirmadoEn && <Revision datos={datos} ocupado={ocupado} acciones={acciones} />}
        {doc && doc.confirmadoEn && (
          <>
            <Resumen resultados={doc.resultados} />
            <ReglaDeNegocio>{t("RECORRIDO.NO_CREA_CURSADAS")}</ReglaDeNegocio>
            {perfil}
          </>
        )}

        {doc && <Gestion datos={datos} ocupado={ocupado} acciones={acciones} />}
        <ReglaDeNegocio>{t("RECORRIDO.PROVISIONAL")}</ReglaDeNegocio>
      </div>
    </div>
  );
}

function Consentimiento({ ocupado, acciones }: { ocupado: boolean; acciones: AccionesDelRecorrido }) {
  const [acepta, setAcepta] = useState(false);
  return (
    <section style={tarjeta} aria-labelledby="recorrido-consentimiento" data-momento="consentimiento">
      <h2 id="recorrido-consentimiento" className="titulo-de-seccion" style={{ margin: 0 }}>
        {t("RECORRIDO.SUBIR_TITULO")}
      </h2>
      <ul style={{ margin: 0, paddingLeft: 18, display: "flex", flexDirection: "column", gap: 6, fontSize: "var(--text-body)" }}>
        {(["RECORRIDO.QUE_EXTRAEMOS", "RECORRIDO.PARA_QUE", "RECORRIDO.REVISAS", "RECORRIDO.NO_DIAGNOSTICO", "RECORRIDO.PRIVADO"] as const).map((k) => (
          <li key={k}>{t(k)}</li>
        ))}
      </ul>
      <label htmlFor="recorrido-acepto" style={{ display: "flex", gap: 10, alignItems: "flex-start", cursor: "pointer" }}>
        {/* ADR-042 §1, el mismo criterio: explícito y **no premarcado**. */}
        <Checkbox id="recorrido-acepto" checked={acepta} onCheckedChange={(v) => setAcepta(v === true)} style={{ marginTop: 3 }} />
        <span style={{ fontSize: "var(--text-body)" }}>{t("RECORRIDO.CONSENTIMIENTO")}</span>
      </label>
      <CTAPrincipal disabled={!acepta || ocupado} onClick={acciones.onConsentir}>
        {t("RECORRIDO.CONSENTIR_CTA")}
      </CTAPrincipal>
      <CTASecundaria onClick={acciones.onSinAnalitico}>{t("RECORRIDO.SIN_ANALITICO")}</CTASecundaria>
      <ReglaDeNegocio>{t("RECORRIDO.SIN_ANALITICO_REGLA")}</ReglaDeNegocio>
    </section>
  );
}

function Subida({ datos, ocupado, acciones }: { datos: DatosDelRecorrido; ocupado: boolean; acciones: AccionesDelRecorrido }) {
  const [archivo, setArchivo] = useState<File | null>(null);
  const input = useRef<HTMLInputElement>(null);
  const fallo = datos.ultimoFallido?.motivo;

  return (
    <section style={tarjeta} aria-labelledby="recorrido-subir" data-momento="subida">
      <h2 id="recorrido-subir" className="titulo-de-seccion" style={{ margin: 0 }}>
        {t("RECORRIDO.SUBIR_TITULO")}
      </h2>
      {fallo && <ReglaDeNegocio>{t(`RECORRIDO.FALLO.${fallo}` as CopyId)}</ReglaDeNegocio>}
      {/* El área punteada de las capturas: soltar o elegir. */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => input.current?.click()}
        onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && input.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          const f = e.dataTransfer.files?.[0];
          if (f) setArchivo(f);
        }}
        style={{
          border: "1px dashed var(--border)",
          borderRadius: 12,
          padding: "22px 16px",
          textAlign: "center",
          cursor: "pointer",
          fontSize: "var(--text-body)",
          color: archivo ? "var(--foreground)" : "var(--muted-foreground)",
        }}
      >
        {archivo ? archivo.name : t("RECORRIDO.ELEGIR_ARCHIVO")}
      </div>
      <input
        ref={input}
        type="file"
        aria-label={t("RECORRIDO.SUBIR_TITULO")}
        accept="application/pdf,image/png,image/jpeg"
        style={{ display: "none" }}
        onChange={(e) => setArchivo(e.target.files?.[0] ?? null)}
      />
      <span style={meta}>{t("RECORRIDO.SUBIR_AYUDA")}</span>
      <CTAPrincipal disabled={!archivo || ocupado} onClick={() => archivo && acciones.onSubir(archivo)}>
        {ocupado ? t("RECORRIDO.SUBIENDO") : t("RECORRIDO.SUBIR_CTA")}
      </CTAPrincipal>
      {datos.pruebaDisponible && (
        <CTASecundaria onClick={acciones.onUsarSintetico}>{t("RECORRIDO.USAR_SINTETICO")}</CTASecundaria>
      )}
      <CTASecundaria onClick={acciones.onSinAnalitico}>{t("RECORRIDO.SIN_ANALITICO")}</CTASecundaria>
    </section>
  );
}

function Resumen({ resultados }: { resultados: ResultadoLeido[] }) {
  const r = resumenDelAnalitico(resultados.map((x) => ({ estado: x.estado, revision: x.revision })));
  return (
    <section style={tarjeta} aria-live="polite" data-resumen-analitico>
      <p style={{ margin: 0, fontSize: "var(--text-body)", fontWeight: 600 }}>
        {llenarCopy("RECORRIDO.RESUMEN", { resultados: r.resultados })}
      </p>
      <span style={meta}>
        {llenarCopy("RECORRIDO.RESUMEN_DETALLE", { aprobadas: r.aprobadas, regularizadas: r.regularizadas, vinculadas: r.vinculadas })}
      </span>
      <span style={{ fontSize: "var(--text-body)" }}>
        {r.aRevisar > 0 ? llenarCopy("RECORRIDO.A_REVISAR", { n: r.aRevisar }) : t("RECORRIDO.SIN_REVISAR")}
      </span>
    </section>
  );
}

function Revision({ datos, ocupado, acciones }: { datos: DatosDelRecorrido; ocupado: boolean; acciones: AccionesDelRecorrido }) {
  const doc = datos.documento!;
  const aRevisar = doc.resultados.filter((r) => r.revision === "NEEDS_REVIEW");
  const revisadas = doc.resultados.filter((r) => ["CONFIRMED", "CORRECTED", "UNSURE", "NOT_IN_PLAN"].includes(r.revision));
  const vinculadas = doc.resultados.filter((r) => r.revision === "AUTO");

  return (
    <>
      <Resumen resultados={doc.resultados} />

      {aRevisar.length > 0 && (
        <section style={tarjeta} aria-labelledby="recorrido-revisar" data-momento="revision">
          <h2 id="recorrido-revisar" className="titulo-de-seccion" style={{ margin: 0 }}>
            {t("RECORRIDO.REVISAR_TITULO")}
          </h2>
          {aRevisar.map((r) => (
            <FilaARevisar key={r.id} resultado={r} datos={datos} ocupado={ocupado} acciones={acciones} />
          ))}
        </section>
      )}

      {revisadas.length > 0 && (
        <ul style={{ ...tarjeta, listStyle: "none", margin: 0 }}>
          {revisadas.map((r) => (
            <li key={r.id} style={{ display: "flex", justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}>
              <span style={{ fontSize: "var(--text-body)" }}>{r.requisito ?? r.crudo.nombre}</span>
              <span style={meta}>{t(`RECORRIDO.REVISADA.${r.revision}` as CopyId)}</span>
            </li>
          ))}
        </ul>
      )}

      {vinculadas.length > 0 && (
        <details style={tarjeta}>
          <summary style={{ cursor: "pointer", fontSize: "var(--text-body)" }}>
            {llenarCopy("RECORRIDO.VER_VINCULADAS", { n: vinculadas.length })}
          </summary>
          <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 6 }}>
            {vinculadas.map((r) => (
              <li key={r.id} style={{ display: "flex", justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}>
                <span style={{ fontSize: "var(--text-body)" }}>{r.requisito}</span>
                <span style={meta}>
                  {t(`RECORRIDO.ESTADO.${r.estado}` as CopyId)}
                  {r.nota !== null ? ` · ${r.nota}` : ""}
                </span>
              </li>
            ))}
          </ul>
        </details>
      )}

      <CTAPrincipal disabled={ocupado} onClick={() => acciones.onConfirmar(doc.id)}>
        {t("RECORRIDO.CONFIRMAR_CTA")}
      </CTAPrincipal>
      <ReglaDeNegocio>{t("RECORRIDO.CONFIRMAR_REGLA")}</ReglaDeNegocio>
    </>
  );
}

function FilaARevisar({
  resultado: r,
  datos,
  ocupado,
  acciones,
}: {
  resultado: ResultadoLeido;
  datos: DatosDelRecorrido;
  ocupado: boolean;
  acciones: AccionesDelRecorrido;
}) {
  const sugeridos = candidatos(r.crudo, datos.requisitos);
  const [requisito, setRequisito] = useState<string>(r.requisitoId ?? (sugeridos.length === 1 ? "" : ""));
  const [estado, setEstado] = useState<EstadoDeResultado | "">(r.estado === "UNKNOWN" ? "" : r.estado);
  const orden = [...sugeridos, ...datos.requisitos.filter((x) => !sugeridos.includes(x))];
  const puedeConfirmar = requisito !== "" && estado !== "";

  return (
    <div
      data-resultado={r.id}
      style={{ display: "flex", flexDirection: "column", gap: 8, paddingTop: 10, borderTop: "0.5px solid var(--border)" }}
    >
      <span style={meta}>{t("RECORRIDO.COMO_VINO")}</span>
      <span style={{ fontSize: "var(--text-body)", fontWeight: 500 }}>
        {[r.crudo.codigo, r.crudo.nombre].filter(Boolean).join(" · ")}
      </span>
      <span style={meta}>
        {[r.crudo.estado, r.crudo.nota ?? t("RECORRIDO.SIN_NOTA"), r.crudo.fecha].filter(Boolean).join(" · ")}
      </span>

      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        <Label htmlFor={`req-${r.id}`}>{t("RECORRIDO.ES_LA_MATERIA")}</Label>
        {/* Ninguna materia llega elegida: ni la primera sugerida (ADR-106 §8). */}
        <NativeSelect id={`req-${r.id}`} value={requisito} onChange={(e) => setRequisito(e.target.value)}>
          <option value="" />
          {orden.map((x) => (
            <option key={x.requisitoId} value={x.requisitoId}>
              {x.nombre}
            </option>
          ))}
        </NativeSelect>
      </div>

      {r.estado === "UNKNOWN" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <Label htmlFor={`est-${r.id}`}>{t("RECORRIDO.ESTADO_ILEGIBLE")}</Label>
          <NativeSelect id={`est-${r.id}`} value={estado} onChange={(e) => setEstado(e.target.value as EstadoDeResultado)}>
            <option value="" />
            {ESTADOS_DE_RESULTADO.filter((x) => x !== "UNKNOWN").map((x) => (
              <option key={x} value={x}>
                {t(`RECORRIDO.ESTADO.${x}` as CopyId)}
              </option>
            ))}
          </NativeSelect>
        </div>
      )}

      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        <CTASecundaria
          onClick={() => {
            if (!puedeConfirmar || ocupado) return;
            const cambiaEstado = r.estado === "UNKNOWN" ? (estado as EstadoDeResultado) : null;
            const decision = requisito === r.requisitoId && cambiaEstado === null ? "CONFIRMED" : "CORRECTED";
            acciones.onRevisar(r.id, decision, requisito, cambiaEstado);
          }}
        >
          {t("RECORRIDO.CONFIRMAR_FILA")}
        </CTASecundaria>
        <CTASecundaria onClick={() => !ocupado && acciones.onRevisar(r.id, "NOT_IN_PLAN", null, null)}>
          {t("RECORRIDO.NO_ES_DE_MI_PLAN")}
        </CTASecundaria>
        <CTASecundaria onClick={() => !ocupado && acciones.onRevisar(r.id, "UNSURE", null, null)}>
          {t("RECORRIDO.NO_ESTOY_SEGURO")}
        </CTASecundaria>
      </div>
    </div>
  );
}

function Gestion({ datos, ocupado, acciones }: { datos: DatosDelRecorrido; ocupado: boolean; acciones: AccionesDelRecorrido }) {
  const [confirmando, setConfirmando] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  return (
    <section style={{ display: "flex", flexWrap: "wrap", gap: 12, alignItems: "center" }} data-gestion-analitico>
      {datos.documentosAnteriores > 0 && (
        <span style={meta}>{llenarCopy("RECORRIDO.ANTERIORES", { n: datos.documentosAnteriores })}</span>
      )}
      <CTASecundaria onClick={() => input.current?.click()}>{t("RECORRIDO.VERSION_NUEVA")}</CTASecundaria>
      <input
        ref={input}
        type="file"
        aria-label={t("RECORRIDO.VERSION_NUEVA")}
        accept="application/pdf,image/png,image/jpeg"
        style={{ display: "none" }}
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f && !ocupado) acciones.onSubir(f);
        }}
      />
      {!confirmando ? (
        <button type="button" onClick={() => setConfirmando(true)} style={{ ...meta, textDecoration: "underline" }}>
          {t("RECORRIDO.BORRAR")}
        </button>
      ) : (
        <span className="inline-flex flex-wrap items-center gap-2" role="group">
          <span style={meta}>{t("RECORRIDO.BORRAR_CONFIRMAR")}</span>
          <button
            type="button"
            disabled={ocupado}
            onClick={() => {
              setConfirmando(false);
              acciones.onBorrar();
            }}
            style={{ ...meta, color: "var(--urgencia-texto)", fontWeight: 600 }}
          >
            {t("RECORRIDO.BORRAR_SI")}
          </button>
          <button type="button" onClick={() => setConfirmando(false)} style={{ ...meta, textDecoration: "underline" }}>
            {t("RECORRIDO.CANCELAR")}
          </button>
        </span>
      )}
    </section>
  );
}

// ── El perfil del recorrido · ADR-107 ────────────────────────────────────────

/**
 * Las preguntas y *«Esto es lo que entendimos hasta ahora»*.
 *
 * ⚠️ **Todas se pueden saltear**, y saltear no cambia nada de lo que el
 * estudiante ve en Achieve. **Sin CTA primaria**: la del momento confirmado no
 * existe (ADR-107 §2), así que cada pregunta guarda con su propio botón.
 */
export function PerfilDelRecorrido({
  perfil,
  ocupado,
  acciones,
}: {
  perfil: PerfilVisible;
  ocupado: boolean;
  acciones: AccionesDelRecorrido;
}) {
  const hipotesis = perfil.hipotesis.filter((h) => h.estado !== "SIN_VIGENCIA");
  return (
    <>
      <section style={tarjeta} aria-labelledby="perfil-preguntas" data-perfil-preguntas>
        <h2 id="perfil-preguntas" className="titulo-de-seccion" style={{ margin: 0 }}>
          {t("PERFIL.TITULO")}
        </h2>
        <ReglaDeNegocio>{t("PERFIL.SUBCOPY")}</ReglaDeNegocio>
        {perfil.preguntas.length === 0 && <span style={meta}>{t("PERFIL.SIN_PREGUNTAS")}</span>}
        {perfil.preguntas.map((p) => (
          <PreguntaDelRecorrido key={p.clave} pregunta={p} ocupado={ocupado} acciones={acciones} />
        ))}
      </section>

      {hipotesis.length > 0 && (
        <section style={tarjeta} aria-labelledby="perfil-entendimos" data-perfil-hipotesis>
          <h2 id="perfil-entendimos" className="titulo-de-seccion" style={{ margin: 0 }}>
            {t("PERFIL.ENTENDIMOS")}
          </h2>
          <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 10 }}>
            {hipotesis.map((h) => (
              <li key={h.id} data-hipotesis={h.id} style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <span style={{ fontSize: "var(--text-body)", color: h.estado === "RECHAZADA" ? "var(--muted-foreground)" : "var(--foreground)", textDecoration: h.estado === "RECHAZADA" ? "line-through" : "none" }}>
                  {h.enunciado}
                </span>
                {h.estado === "RECHAZADA" ? (
                  <span style={meta}>{t("PERFIL.RECHAZADA")}</span>
                ) : (
                  <button
                    type="button"
                    disabled={ocupado}
                    onClick={() => acciones.onRechazarHipotesis(h.id)}
                    style={{ ...meta, textDecoration: "underline", alignSelf: "flex-start" }}
                  >
                    {t("PERFIL.NO_ME_REPRESENTA")}
                  </button>
                )}
              </li>
            ))}
          </ul>
          <ReglaDeNegocio>{t("PERFIL.AJUSTE")}</ReglaDeNegocio>
        </section>
      )}
    </>
  );
}

function PreguntaDelRecorrido({
  pregunta: p,
  ocupado,
  acciones,
}: {
  pregunta: PreguntaVisible;
  ocupado: boolean;
  acciones: AccionesDelRecorrido;
}) {
  const [editando, setEditando] = useState(p.respuesta === null);
  const [elegidas, setElegidas] = useState<string[]>(p.respuesta?.opciones ?? []);
  const [texto, setTexto] = useState(p.respuesta?.textoLibre ?? "");

  const alternar = (valor: string) =>
    setElegidas((e) => {
      if (e.includes(valor)) return e.filter((x) => x !== valor);
      // «Ninguna» no convive con otras.
      if (valor === "NINGUNA") return ["NINGUNA"];
      return [...e.filter((x) => x !== "NINGUNA"), valor];
    });

  const enviar = (estado: EstadoDeRespuesta) => {
    if (ocupado) return;
    setEditando(false);
    acciones.onResponder(p.clave, estado, estado === "ANSWERED" ? elegidas : [], estado === "ANSWERED" && texto.trim() ? texto : null);
  };

  return (
    <div data-pregunta={p.clave} style={{ display: "flex", flexDirection: "column", gap: 8, paddingTop: 12, borderTop: "0.5px solid var(--border)" }}>
      <span style={{ fontSize: "var(--text-body)", fontWeight: 500 }}>{p.texto}</span>

      {!editando && p.respuesta ? (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center" }}>
          <span style={meta}>{t(`PERFIL.CONTESTADA.${p.respuesta.estado}` as CopyId)}</span>
          <button type="button" onClick={() => setEditando(true)} style={{ ...meta, textDecoration: "underline" }}>
            {t("PERFIL.CAMBIAR")}
          </button>
        </div>
      ) : (
        <>
          <div role="group" aria-label={p.texto} style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {p.opciones.map((o) => {
              const activa = elegidas.includes(o.valor);
              return (
                <button
                  key={o.valor}
                  type="button"
                  aria-pressed={activa}
                  data-opcion={o.valor}
                  onClick={() => alternar(o.valor)}
                  style={{
                    padding: "6px 12px",
                    borderRadius: "var(--radius-control)",
                    border: activa ? "1px solid var(--foreground)" : "1px solid var(--border)",
                    background: activa ? "var(--foreground)" : "var(--card)",
                    color: activa ? "var(--background)" : "var(--foreground)",
                    fontSize: "var(--text-label)",
                    cursor: "pointer",
                  }}
                >
                  {o.etiqueta}
                </button>
              );
            })}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <Label htmlFor={`texto-${p.clave}`}>{t("PERFIL.TEXTO_LIBRE")}</Label>
            <Textarea id={`texto-${p.clave}`} value={texto} maxLength={1000} onChange={(e) => setTexto(e.target.value)} rows={2} />
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 12, alignItems: "center" }}>
            <CTASecundaria onClick={() => (elegidas.length > 0 || texto.trim()) && enviar("ANSWERED")}>
              {t("PERFIL.RESPONDER")}
            </CTASecundaria>
            {(["UNSURE", "PREFER_NOT_TO_SAY", "SKIPPED"] as const).map((e) => (
              <button key={e} type="button" disabled={ocupado} onClick={() => enviar(e)} style={{ ...meta, textDecoration: "underline" }}>
                {t(e === "UNSURE" ? "PERFIL.NO_ESTOY_SEGURO" : e === "PREFER_NOT_TO_SAY" ? "PERFIL.PREFIERO_NO" : "PERFIL.SALTEAR")}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
