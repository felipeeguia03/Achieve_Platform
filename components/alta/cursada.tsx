"use client";

/**
 * *«Armemos tu semestre»* — el cuarto paso del alta,
 * [ADR-105](../../docs/decisions.md#adr-105), que construye
 * [ADR-062](../../docs/decisions.md#adr-062) y [ADR-063](../../docs/decisions.md#adr-063).
 *
 * ## Lo que esta pantalla hace cumplir
 *
 * 1. **Dos preguntas independientes por materia**: comisión y horario. Comisión
 *    desconocida con horario conocido es un camino de primera clase.
 * 2. **Nada llega elegido.** Ni la primera comisión ni el horario de la materia
 *    (ADR-062: *"nunca seleccionar automáticamente la primera comisión"*). Lo
 *    único que se precarga es **lo que el estudiante ya contestó** si vuelve.
 * 3. **«No sé» siempre deja seguir.** La acción global *No sé mis comisiones
 *    todavía* marca las que falten, y *Todavía no sé mi horario* no crea filas.
 * 4. **No es un calendario.** Días y horas de cursado recurrente, nada más: sin
 *    fechas, sin excepciones y sin agendar.
 */

import { useMemo, useState } from "react";

import { DIAS, llenarCopy, t } from "@/lib/content/es-AR";
import {
  clasesQueSeSuperponen,
  motivoDeBloqueInvalido,
  motivoDeRespuestaInvalida,
  resumenDeCursada,
  type BloqueDeCursada,
  type EstadoDeComision,
  type RespuestaDeCursada,
} from "@/lib/domain/cursada";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { CTAPrincipal, CTASecundaria, ReglaDeNegocio } from "@/components/screens/design-system";
import { CTAEsqueleto, Esqueleto, PantallaCargando, Renglon } from "@/components/screens/esqueleto";
import { ErrorDelAlta, MarcoDelAlta } from "./marco";
import { Opciones, type Opcion } from "./opciones";

/**
 * `/alta/cursada` mientras las materias no llegaron — `P-12`. El paso y el título
 * van reales; cada materia, un panel en bloques. **Ninguna opción aparece
 * elegida**: un «Comisión A» de ejemplo sugeriría una inscripción que nadie dio.
 */
export function AltaCursadaEsqueleto() {
  return (
    <MarcoDelAlta paso={4} titulo={t("ALTA.CURSADA.TITULO")} ayuda={t("ALTA.CURSADA.EXPLICACION")} ancho={760}>
      <PantallaCargando style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            aria-hidden
            style={{ display: "flex", flexDirection: "column", gap: 10, padding: 16, border: "1px solid var(--border)", borderRadius: "var(--radius)" }}
          >
            <Renglon cuerpo="title-sm" ancho={[220, 180, 260][i]} />
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {[120, 140, 160].map((w) => (
                <Esqueleto key={w} ancho={w} alto={36} radio="var(--radius-control)" />
              ))}
            </div>
          </div>
        ))}
        <CTAEsqueleto />
      </PantallaCargando>
    </MarcoDelAlta>
  );
}

export interface BloqueOfrecido extends BloqueDeCursada {
  fuente?: string;
}

export interface CursadaDelPasoProps {
  cursadaId: string;
  materia: string;
  comision: { estado: EstadoDeComision | null; ofertaId: string | null; nombre: string | null };
  horario: { estado: "KNOWN" | "UNKNOWN" | null };
  comisiones: { ofertaId: string; nombre: string; bloques: BloqueOfrecido[] }[];
  bloquesDeLaMateria: BloqueOfrecido[];
  bloquesDeclarados: BloqueOfrecido[];
}

type ModoDeHorario = "HEREDADO" | "PROPIO" | "NO_SE";

interface Borrador {
  comision: EstadoDeComision | null;
  ofertaId: string | null;
  nombre: string;
  horario: ModoDeHorario | null;
  bloques: BloqueDeCursada[];
}

const BLOQUE_VACIO: BloqueDeCursada = { dia: 1, desde: "", hasta: "", aula: "" };

/** Lo que ya contestó, para retomar. **Nunca** una respuesta que no dio. */
function borradorInicial(c: CursadaDelPasoProps): Borrador {
  const horario: ModoDeHorario | null =
    c.horario.estado === "UNKNOWN"
      ? "NO_SE"
      : c.horario.estado === "KNOWN"
        ? c.bloquesDeclarados.length > 0
          ? "PROPIO"
          : "HEREDADO"
        : null;
  return {
    comision: c.comision.estado,
    ofertaId: c.comision.ofertaId,
    nombre: c.comision.nombre ?? "",
    horario,
    bloques: c.bloquesDeclarados.map((b) => ({ dia: b.dia, desde: b.desde, hasta: b.hasta, aula: b.aula ?? "" })),
  };
}

/** El horario que se hereda con esa respuesta de comisión. `[]` ⇒ ninguno. */
function heredados(c: CursadaDelPasoProps, b: Borrador): BloqueOfrecido[] {
  if (b.comision === "CONFIRMED") return c.comisiones.find((x) => x.ofertaId === b.ofertaId)?.bloques ?? [];
  if (b.comision === "NOT_APPLICABLE") return c.bloquesDeLaMateria;
  return [];
}

function aRespuesta(c: CursadaDelPasoProps, b: Borrador): RespuestaDeCursada | null {
  if (!b.comision || !b.horario) return null;
  return {
    cursadaId: c.cursadaId,
    comision: {
      estado: b.comision,
      ...(b.comision === "CONFIRMED" && b.ofertaId ? { ofertaId: b.ofertaId } : {}),
      ...(b.comision === "NOT_LISTED" ? { nombre: b.nombre.trim() } : {}),
    },
    horario:
      b.horario === "NO_SE"
        ? { estado: "UNKNOWN" }
        : b.horario === "HEREDADO"
          ? { estado: "KNOWN" }
          : {
              estado: "KNOWN",
              bloques: b.bloques.map((x) => ({
                dia: x.dia,
                desde: x.desde,
                hasta: x.hasta,
                ...(x.aula?.trim() ? { aula: x.aula.trim() } : {}),
              })),
            },
  };
}

export function textoDeBloques(bloques: readonly BloqueOfrecido[]): string {
  return bloques.map((b) => `${DIAS[b.dia]} ${b.desde.slice(0, 5)}–${b.hasta.slice(0, 5)}`).join(" · ");
}

export function AltaCursada({
  cursadas,
  onGuardar,
}: {
  cursadas: CursadaDelPasoProps[];
  onGuardar: (respuestas: RespuestaDeCursada[]) => Promise<{ ok: boolean; motivo?: string }>;
}) {
  const [borradores, setBorradores] = useState<Record<string, Borrador>>(() =>
    Object.fromEntries(cursadas.map((c) => [c.cursadaId, borradorInicial(c)])),
  );
  const [enCurso, setEnCurso] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cambiar = (id: string, parcial: Partial<Borrador>) =>
    setBorradores((p) => ({ ...p, [id]: { ...p[id], ...parcial } }));

  const respuestas = cursadas.map((c) => aRespuesta(c, borradores[c.cursadaId]));
  const completas = respuestas.filter((r): r is RespuestaDeCursada => r !== null);
  const todasContestadas = completas.length === cursadas.length;

  const resumen = resumenDeCursada(completas, cursadas);
  const superpuestas = useMemo(
    () =>
      clasesQueSeSuperponen(
        cursadas.flatMap((c) => {
          const b = borradores[c.cursadaId];
          const efectivos =
            b.horario === "PROPIO"
              ? b.bloques.filter((x) => motivoDeBloqueInvalido(x) === null)
              : b.horario === "HEREDADO"
                ? heredados(c, b)
                : [];
          return efectivos.map((x) => ({ ...x, materia: c.materia }));
        }),
      ),
    [cursadas, borradores],
  );

  async function guardar() {
    if (enCurso) return;
    if (!todasContestadas) {
      setError(t("ALTA.CURSADA.FALTA_CONTESTAR"));
      return;
    }
    for (const r of completas) {
      const motivo = motivoDeRespuestaInvalida(r, cursadas.find((c) => c.cursadaId === r.cursadaId));
      if (motivo) {
        const materia = cursadas.find((c) => c.cursadaId === r.cursadaId)?.materia;
        setError(`${materia}: ${motivo}`);
        return;
      }
    }
    setEnCurso(true);
    setError(null);
    const r = await onGuardar(completas);
    if (!r.ok) {
      setError(r.motivo ?? t("ALTA.ERROR.RED"));
      setEnCurso(false);
    }
  }

  return (
    <MarcoDelAlta paso={4} titulo={t("ALTA.CURSADA.TITULO")} ayuda={t("ALTA.CURSADA.EXPLICACION")} ancho={760}>
      {cursadas.length === 0 && <ReglaDeNegocio>{t("ALTA.CURSADA.SIN_MATERIAS")}</ReglaDeNegocio>}

      {/* ADR-062: la acción global. Marca sólo las que falten: no pisa lo contestado. */}
      {cursadas.some((c) => borradores[c.cursadaId].comision === null) && (
        <CTASecundaria
          onClick={() =>
            setBorradores((p) =>
              Object.fromEntries(
                Object.entries(p).map(([id, b]) => [id, b.comision === null ? { ...b, comision: "UNKNOWN" } : b]),
              ),
            )
          }
        >
          {t("ALTA.CURSADA.NO_SE_COMISIONES")}
        </CTASecundaria>
      )}

      {cursadas.map((c) => (
        <TarjetaDeMateria
          key={c.cursadaId}
          cursada={c}
          borrador={borradores[c.cursadaId]}
          onCambiar={(parcial) => cambiar(c.cursadaId, parcial)}
        />
      ))}

      {superpuestas.map(([a, b]) => (
        <ReglaDeNegocio key={`${a}|${b}`}>{llenarCopy("ALTA.CURSADA.SUPERPOSICION", { a, b })}</ReglaDeNegocio>
      ))}

      {todasContestadas && cursadas.length > 0 && (
        <section aria-live="polite" style={{ display: "flex", flexDirection: "column", gap: 4 }} data-resumen-cursada>
          <p style={{ margin: 0, fontSize: "var(--text-body)", fontWeight: 500 }}>
            {llenarCopy("ALTA.CURSADA.RESUMEN", { conHorario: resumen.conHorario, materias: resumen.materias })}
          </p>
          {resumen.sinHorario > 0 && (
            <ReglaDeNegocio>
              {llenarCopy("ALTA.CURSADA.RESUMEN_PENDIENTE", { sinHorario: resumen.sinHorario })}
            </ReglaDeNegocio>
          )}
        </section>
      )}

      <ErrorDelAlta mensaje={error} />

      <CTAPrincipal disabled={enCurso} onClick={guardar}>
        {enCurso ? t("ALTA.CURSADA.GUARDANDO") : t("ALTA.CURSADA.CTA")}
      </CTAPrincipal>
    </MarcoDelAlta>
  );
}

function TarjetaDeMateria({
  cursada: c,
  borrador: b,
  onCambiar,
}: {
  cursada: CursadaDelPasoProps;
  borrador: Borrador;
  onCambiar: (parcial: Partial<Borrador>) => void;
}) {
  const valorComision = b.comision === "CONFIRMED" ? `oferta:${b.ofertaId}` : b.comision;

  const opcionesDeComision: Opcion<string>[] = [
    ...c.comisiones.map((o) => ({
      valor: `oferta:${o.ofertaId}`,
      etiqueta: `${t("ALTA.CURSADA.COMISION")} ${o.nombre}`,
      // Un horario simulado se dice en la misma línea: la comisión no puede
      // parecer publicada por la facultad si su horario no lo es.
      detalle:
        o.bloques.length > 0
          ? `${textoDeBloques(o.bloques)}${o.bloques.some((x) => x.fuente === "inference") ? ` · ${t("ALTA.CURSADA.ESTIMADO")}` : ""}`
          : undefined,
    })),
    { valor: "UNKNOWN", etiqueta: t("ALTA.CURSADA.NO_SE_COMISION") },
    { valor: "NOT_LISTED", etiqueta: t("ALTA.CURSADA.NO_APARECE") },
    { valor: "NOT_APPLICABLE", etiqueta: t("ALTA.CURSADA.SIN_COMISIONES") },
  ];

  const hereda = heredados(c, b);
  const estimado = hereda.some((x) => x.fuente === "inference");
  const opcionesDeHorario: Opcion<ModoDeHorario>[] =
    hereda.length > 0
      ? [
          { valor: "HEREDADO", etiqueta: t("ALTA.CURSADA.ES_ESTE_HORARIO"), detalle: textoDeBloques(hereda) },
          { valor: "PROPIO", etiqueta: t("ALTA.CURSADA.HORARIO_OTRO") },
          { valor: "NO_SE", etiqueta: t("ALTA.CURSADA.NO_SE_HORARIO") },
        ]
      : [
          { valor: "PROPIO", etiqueta: t("ALTA.CURSADA.HORARIO_PROPIO") },
          { valor: "NO_SE", etiqueta: t("ALTA.CURSADA.NO_SE_HORARIO") },
        ];

  return (
    <section
      aria-labelledby={`materia-${c.cursadaId}`}
      data-cursada={c.cursadaId}
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 12,
        padding: 16,
        border: "1px solid var(--border)",
        borderRadius: "var(--radius)",
        background: "var(--card)",
      }}
    >
      <h2 id={`materia-${c.cursadaId}`} style={{ margin: 0, fontSize: "var(--text-title-sm)", fontWeight: 600 }}>
        {c.materia}
      </h2>

      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <span style={{ fontSize: "var(--text-label)", fontWeight: 500 }}>{t("ALTA.CURSADA.PREGUNTA_COMISION")}</span>
        <Opciones<string>
          etiqueta={`${t("ALTA.CURSADA.PREGUNTA_COMISION")} ${c.materia}`}
          opciones={opcionesDeComision}
          valor={valorComision}
          columnas={c.comisiones.length > 0}
          onCambiar={(v) => {
            const confirmada = v.startsWith("oferta:");
            // Cambiar la comisión cambia el horario que se hereda: la respuesta de
            // horario vuelve a preguntarse en vez de quedar apuntando a otra.
            onCambiar({
              comision: confirmada ? "CONFIRMED" : (v as EstadoDeComision),
              ofertaId: confirmada ? v.slice("oferta:".length) : null,
              horario: b.horario === "HEREDADO" ? null : b.horario,
            });
          }}
        />
        {b.comision === "NOT_LISTED" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <Label htmlFor={`nombre-${c.cursadaId}`}>{t("ALTA.CURSADA.NO_APARECE_NOMBRE")}</Label>
            <Input
              id={`nombre-${c.cursadaId}`}
              value={b.nombre}
              onChange={(e) => onCambiar({ nombre: e.target.value })}
            />
            <ReglaDeNegocio>{t("ALTA.CURSADA.NO_APARECE_REGLA")}</ReglaDeNegocio>
          </div>
        )}
      </div>

      {b.comision !== null && (
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <span style={{ fontSize: "var(--text-label)", fontWeight: 500 }}>{t("ALTA.CURSADA.PREGUNTA_HORARIO")}</span>
          <Opciones<ModoDeHorario>
            etiqueta={`${t("ALTA.CURSADA.PREGUNTA_HORARIO")} ${c.materia}`}
            opciones={opcionesDeHorario}
            valor={b.horario}
            onCambiar={(v) =>
              onCambiar({ horario: v, bloques: v === "PROPIO" && b.bloques.length === 0 ? [{ ...BLOQUE_VACIO }] : b.bloques })
            }
          />
          {b.horario === "HEREDADO" && estimado && <ReglaDeNegocio>{t("COMUN.HORARIO_ESTIMADO")}</ReglaDeNegocio>}
          {b.horario === "NO_SE" && <ReglaDeNegocio>{t("ALTA.CURSADA.NO_SE_HORARIO_REGLA")}</ReglaDeNegocio>}
          {b.horario === "PROPIO" && (
            <EditorDeBloques
              id={c.cursadaId}
              bloques={b.bloques}
              onCambiar={(bloques) => onCambiar({ bloques })}
            />
          )}
        </div>
      )}
    </section>
  );
}

function EditorDeBloques({
  id,
  bloques,
  onCambiar,
}: {
  id: string;
  bloques: BloqueDeCursada[];
  onCambiar: (b: BloqueDeCursada[]) => void;
}) {
  const fijar = (i: number, parcial: Partial<BloqueDeCursada>) =>
    onCambiar(bloques.map((x, j) => (j === i ? { ...x, ...parcial } : x)));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }} data-editor-de-bloques>
      {bloques.map((bl, i) => (
        <div
          key={i}
          style={{ display: "grid", gap: 8, gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 120px), 1fr))", alignItems: "end" }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <Label htmlFor={`dia-${id}-${i}`}>{t("ALTA.CURSADA.DIA")}</Label>
            <NativeSelect id={`dia-${id}-${i}`} value={bl.dia} onChange={(e) => fijar(i, { dia: Number(e.target.value) })}>
              {/* La semana de cursado empieza el lunes; el valor sigue siendo 0–6. */}
              {[1, 2, 3, 4, 5, 6, 0].map((d) => (
                <option key={d} value={d}>
                  {DIAS[d]}
                </option>
              ))}
            </NativeSelect>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <Label htmlFor={`desde-${id}-${i}`}>{t("ALTA.CURSADA.DESDE")}</Label>
            <Input id={`desde-${id}-${i}`} type="time" value={bl.desde} onChange={(e) => fijar(i, { desde: e.target.value })} />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <Label htmlFor={`hasta-${id}-${i}`}>{t("ALTA.CURSADA.HASTA")}</Label>
            <Input id={`hasta-${id}-${i}`} type="time" value={bl.hasta} onChange={(e) => fijar(i, { hasta: e.target.value })} />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <Label htmlFor={`aula-${id}-${i}`}>{t("ALTA.CURSADA.AULA")}</Label>
            <Input id={`aula-${id}-${i}`} value={bl.aula ?? ""} onChange={(e) => fijar(i, { aula: e.target.value })} />
          </div>
          {bloques.length > 1 && (
            <CTASecundaria onClick={() => onCambiar(bloques.filter((_, j) => j !== i))}>
              {t("ALTA.CURSADA.QUITAR_DIA")}
            </CTASecundaria>
          )}
        </div>
      ))}
      <CTASecundaria onClick={() => onCambiar([...bloques, { ...BLOQUE_VACIO }])}>
        {t("ALTA.CURSADA.AGREGAR_DIA")}
      </CTASecundaria>
      <ReglaDeNegocio>{t("ALTA.CURSADA.HORARIO_DECLARADO_REGLA")}</ReglaDeNegocio>
    </div>
  );
}
