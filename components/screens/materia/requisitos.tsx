"use client";

/**
 * *Requisitos* — el desplegable de la materia con lo que pide la cátedra para
 * promocionar y para regularizar, y cómo venís —
 * [ADR-108](../../../docs/decisions.md#adr-108).
 *
 * ⚠️ **Simulado, y lo dice siempre.** Los datos salen de `GET /api/requisitos`,
 * que sólo responde con `MODO_PRUEBA=1`; sin respuesta el botón **no se dibuja**.
 * Adentro, el rótulo *Simulado* y la aclaración van arriba de todo.
 *
 * ⚠️ **Proyecta, no decide.** El estado de cada fila llega calculado por
 * `lib/domain/requisitos-de-cursado.ts`; acá sólo se lo pone en palabras. Y **no
 * hay veredicto de la materia**: ni *«estás promocionando»* ni *«3 de 4»*.
 *
 * El mecanismo sale de la captura que adjuntó el owner: un botón en píldora con
 * flecha, y un panel anclado debajo con filas de título y bajada.
 */

import { useEffect, useRef, useState } from "react";
import { ChevronDown, ListChecks } from "lucide-react";

import { EstadoChip } from "../design-system";
import { llenarCopy, t, type CopyId } from "@/lib/content/es-AR";
import type {
  EstadoDeRequisito,
  FilaDeRequisito,
  RequisitosDeCursado,
} from "@/lib/domain/requisitos-de-cursado";

export interface TextosDeFila {
  titulo: string;
  piden: string;
  venis: string;
  /** `null` ⇒ la línea no se dibuja. */
  detalle: string | null;
}

const lista = (nombres: string[]) => nombres.join(", ");

/** Una fila en palabras. Pura: se prueba sin montar nada. */
export function textosDeFila(fila: FilaDeRequisito): TextosDeFila {
  switch (fila.tipo) {
    case "PARCIALES": {
      const rendidos = fila.parciales.filter((p) => p.nota !== null);
      const pendientes = fila.parciales.filter((p) => p.nota === null).map((p) => p.nombre);
      const debajo = rendidos.filter((p) => (p.nota as number) < fila.notaMinima).map((p) => p.nombre);
      return {
        titulo: t("REQUISITOS.PARCIALES"),
        piden: llenarCopy("REQUISITOS.PARCIALES.PIDEN", { n: fila.notaMinima }),
        venis:
          rendidos.length === 0
            ? t("REQUISITOS.PARCIALES.SIN_RENDIR")
            : rendidos.map((p) => `${p.nombre}: ${p.nota}`).join(" · "),
        detalle:
          [
            debajo.length > 0 ? llenarCopy("REQUISITOS.PARCIALES.DEBAJO", { n: fila.notaMinima, lista: lista(debajo) }) : null,
            pendientes.length > 0 && rendidos.length > 0
              ? llenarCopy("REQUISITOS.PARCIALES.FALTA", { lista: lista(pendientes) })
              : null,
          ]
            .filter((p): p is string => p !== null)
            .join(" · ") || null,
      };
    }
    case "TPS": {
      const quedan = fila.total - fila.vencidos;
      return {
        titulo: t("REQUISITOS.TPS"),
        piden: llenarCopy("REQUISITOS.TPS.PIDEN", { n: fila.porcentaje }),
        venis:
          fila.vencidos === 0
            ? t("REQUISITOS.TPS.SIN_VENCIDOS")
            : llenarCopy("REQUISITOS.TPS.VENIS", { aprobados: fila.aprobados, vencidos: fila.vencidos }),
        detalle: [
          quedan > 0 ? llenarCopy("REQUISITOS.TPS.QUEDAN", { n: quedan }) : null,
          llenarCopy("REQUISITOS.TPS.NECESITAS", { n: fila.requeridos, total: fila.total }),
        ]
          .filter((p): p is string => p !== null)
          .join(" · "),
      };
    }
    case "ASISTENCIA_PRACTICO":
    case "ASISTENCIA_TEORICO": {
      const quedan =
        fila.quedan === 0
          ? t("REQUISITOS.ASISTENCIA.NO_QUEDAN")
          : fila.quedan === 1
            ? t("REQUISITOS.ASISTENCIA.QUEDA_UNA")
            : llenarCopy("REQUISITOS.ASISTENCIA.QUEDAN", { n: fila.quedan });
      const margen =
        fila.faltasDisponibles < 0
          ? llenarCopy("REQUISITOS.ASISTENCIA.NO_LLEGAS", { n: fila.porcentaje })
          : fila.quedan === 0
            ? null
            : fila.faltasDisponibles === 0
              ? t("REQUISITOS.ASISTENCIA.NINGUNA_FALTA")
              : fila.faltasDisponibles === 1
                ? t("REQUISITOS.ASISTENCIA.PODES_FALTAR_UNA")
                : llenarCopy("REQUISITOS.ASISTENCIA.PODES_FALTAR", { n: fila.faltasDisponibles });
      return {
        titulo: t(fila.tipo === "ASISTENCIA_PRACTICO" ? "REQUISITOS.ASISTENCIA_PRACTICO" : "REQUISITOS.ASISTENCIA_TEORICO"),
        piden: llenarCopy("REQUISITOS.ASISTENCIA.PIDEN", { n: fila.porcentaje }),
        venis:
          fila.venis === null
            ? t("REQUISITOS.ASISTENCIA.SIN_CLASES")
            : llenarCopy("REQUISITOS.ASISTENCIA.VENIS", { n: fila.venis }),
        // Sin clases dadas no hay margen que calcular: sólo cuántas quedan.
        detalle: fila.venis === null ? quedan : [quedan, margen].filter(Boolean).join(" · "),
      };
    }
  }
}

const COPY_DE_ESTADO: Record<EstadoDeRequisito, CopyId> = {
  CUMPLE: "REQUISITOS.ESTADO.CUMPLE",
  AJUSTADO: "REQUISITOS.ESTADO.AJUSTADO",
  NO_ALCANZA: "REQUISITOS.ESTADO.NO_ALCANZA",
  SIN_DATOS: "REQUISITOS.ESTADO.SIN_DATOS",
};

const meta = { fontSize: "var(--text-meta)", color: "var(--muted-foreground)" } as const;

function Estado({ estado }: { estado: EstadoDeRequisito }) {
  const texto = t(COPY_DE_ESTADO[estado]);
  if (estado === "CUMPLE") return <EstadoChip tone="exito">{texto}</EstadoChip>;
  if (estado === "NO_ALCANZA") return <EstadoChip tone="urgencia">{texto}</EstadoChip>;
  // «Ajustado» y «Sin datos» no llevan tinte: sin datos no es un estado malo, y
  // ajustado todavía se puede. Forma y palabra, no color (`P-06`).
  return (
    <span
      data-tono={estado === "AJUSTADO" ? "ajustado" : "sin-datos"}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        fontSize: "var(--text-label)",
        fontWeight: 600,
        padding: "2px 9px",
        borderRadius: "var(--radius-pildora)",
        border: `1px ${estado === "SIN_DATOS" ? "dashed" : "solid"} var(--border)`,
        color: estado === "SIN_DATOS" ? "var(--muted-foreground)" : "var(--foreground)",
      }}
    >
      <span
        aria-hidden
        style={{
          width: 6,
          height: 6,
          borderRadius: 999,
          flexShrink: 0,
          background: estado === "SIN_DATOS" ? "transparent" : "currentColor",
          border: estado === "SIN_DATOS" ? "1px solid currentColor" : undefined,
        }}
      />
      {texto}
    </span>
  );
}

function Fila({ fila }: { fila: FilaDeRequisito }) {
  const x = textosDeFila(fila);
  return (
    <li data-requisito={fila.tipo} data-estado={fila.estado} style={{ padding: "10px 16px", borderTop: "1px solid var(--border)" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
        <span style={{ fontSize: "var(--text-body)", fontWeight: 500 }}>{x.titulo}</span>
        <Estado estado={fila.estado} />
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", columnGap: 16, rowGap: 2, marginTop: 4, fontSize: "var(--text-label)" }}>
        <span>
          <span style={{ color: "var(--muted-foreground)" }}>{t("REQUISITOS.PIDEN")} </span>
          {x.piden}
        </span>
        <span>
          <span style={{ color: "var(--muted-foreground)" }}>{t("REQUISITOS.VENIS")} </span>
          <span style={{ fontWeight: 600 }}>{x.venis}</span>
        </span>
      </div>
      {x.detalle && <p style={{ ...meta, margin: "2px 0 0" }}>{x.detalle}</p>}
    </li>
  );
}

export function RequisitosDeCursadoBoton({ requisitos }: { requisitos: RequisitosDeCursado }) {
  const [abierto, setAbierto] = useState(false);
  const caja = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!abierto) return;
    function alTeclear(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.stopPropagation();
        setAbierto(false);
      }
    }
    function afuera(e: MouseEvent) {
      if (caja.current && !caja.current.contains(e.target as Node)) setAbierto(false);
    }
    document.addEventListener("keydown", alTeclear, true);
    document.addEventListener("mousedown", afuera);
    return () => {
      document.removeEventListener("keydown", alTeclear, true);
      document.removeEventListener("mousedown", afuera);
    };
  }, [abierto]);

  return (
    <div ref={caja} style={{ position: "relative" }}>
      <button
        type="button"
        onClick={() => setAbierto((a) => !a)}
        aria-haspopup="dialog"
        aria-expanded={abierto}
        data-requisitos-boton
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          border: "1px solid var(--border)",
          borderRadius: "var(--radius-pildora)",
          padding: "5px 10px 5px 12px",
          fontSize: "var(--text-label)",
          fontWeight: 500,
          color: "var(--foreground)",
          background: "var(--card)",
        }}
      >
        <ListChecks size={14} aria-hidden />
        {t("REQUISITOS.BOTON")}
        <ChevronDown
          size={14}
          aria-hidden
          style={{ transition: "transform 120ms", transform: abierto ? "rotate(180deg)" : undefined }}
        />
      </button>

      {abierto && (
        <div
          role="dialog"
          aria-label={t("REQUISITOS.TITULO")}
          data-requisitos-panel
          style={{
            position: "absolute",
            top: "calc(100% + 8px)",
            right: 0,
            width: 440,
            maxWidth: "calc(100vw - 32px)",
            maxHeight: "min(640px, 75vh)",
            overflowY: "auto",
            background: "var(--popover)",
            color: "var(--popover-foreground)",
            border: ".5px solid var(--border)",
            borderRadius: "var(--radius)",
            boxShadow: "var(--sombra-menu)",
            zIndex: 60,
          }}
        >
          <div style={{ padding: "14px 16px 10px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: "var(--text-label)", fontWeight: 600 }}>{t("REQUISITOS.TITULO")}</span>
              <span style={{ ...meta, border: ".5px dashed var(--border)", borderRadius: 999, padding: "1px 8px" }}>
                {t("REQUISITOS.SIMULADO")}
              </span>
            </div>
            <p style={{ ...meta, margin: "4px 0 0" }}>{t("REQUISITOS.ACLARACION")}</p>
          </div>

          {requisitos.regimenes.map((r) => (
            <section key={r.regimen} data-regimen={r.regimen} aria-labelledby={`requisitos-${r.regimen}`}>
              <h3
                id={`requisitos-${r.regimen}`}
                className="titulo-de-seccion"
                style={{ margin: 0, padding: "12px 16px 8px", borderTop: "1px solid var(--border)", background: "var(--muted)" }}
              >
                {t(r.regimen === "PROMOCION" ? "REQUISITOS.PROMOCION" : "REQUISITOS.REGULAR")}
              </h3>
              {r.regimen === "REGULAR" && requisitos.sinPromocion && (
                <p data-sin-promocion style={{ ...meta, margin: 0, padding: "0 16px 8px", background: "var(--muted)" }}>
                  {t("REQUISITOS.SIN_PROMOCION")}
                </p>
              )}
              <ul style={{ margin: 0, padding: 0, listStyle: "none" }}>
                {r.filas.map((f) => (
                  <Fila key={f.tipo} fila={f} />
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
