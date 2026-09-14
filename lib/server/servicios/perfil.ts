import { llenarCopy, t, type CopyId } from "@/lib/content/es-AR";
import type { RecorridoLeido } from "@/lib/domain/analitico";
import {
  elegirPreguntas,
  estadoDeHipotesis,
  hipotesisDeRespuesta,
  motivoDeRespuestaInvalida,
  preguntasPosibles,
  resultadosQueCuentan,
  VERSION_DE_REGLA,
  type EstadoDeRespuesta,
  type HipotesisVisible,
  type PerfilVisible,
  type Pregunta,
} from "@/lib/domain/preguntas-de-recorrido";
import type { PerfilLeido } from "../repositorios/perfil";
import type { PublicadorDeEventos } from "./eventos";

/**
 * Service del perfil del recorrido — [ADR-107](../../../docs/decisions.md#adr-107).
 *
 * Arma las preguntas con la regla `RECORRIDO-v0.1`, guarda la respuesta **tal
 * como la dio** y, aparte, las hipótesis que salen de ella.
 *
 * ## Lo que este Service no hace, y hay guard
 *
 * - **No elige la próxima acción** ni la prioriza: el ADE no importa este módulo.
 * - **No clasifica ni restringe**: nada de acá decide acceso a nada (ADR-087 `D1`
 *   sigue donde vive).
 * - **No manda el texto libre a ningún lado**: ni a eventos ni a hipótesis.
 */

export interface DependenciasDelPerfil {
  recorrido: (i: string, s: string) => Promise<RecorridoLeido>;
  repo: {
    perfil(i: string, s: string): Promise<PerfilLeido>;
    responder(i: string, s: string, respuesta: Record<string, unknown>, hipotesis: readonly Record<string, unknown>[]): Promise<string>;
    rechazar(i: string, s: string, hipotesisId: string): Promise<boolean>;
  };
  eventos: PublicadorDeEventos;
}

/** Las preguntas posibles y las elegidas. Sin recorrido confirmado no hay ninguna. */
function preguntasDe(recorrido: RecorridoLeido, cursados: readonly string[]): { posibles: Pregunta[]; elegidas: Pregunta[] } {
  const doc = recorrido.documento;
  if (!doc?.confirmadoEn) return { posibles: [], elegidas: [] };
  const resultados = resultadosQueCuentan(doc.resultados).map((r) => ({
    id: r.id,
    requisitoId: r.requisitoId,
    materia: r.requisito ?? r.crudo.nombre,
    estado: r.estado,
    nota: r.nota,
    fecha: r.fecha,
  }));
  const posibles = preguntasPosibles(resultados, new Set(cursados));
  return { posibles, elegidas: elegirPreguntas(posibles) };
}

function textoDe(p: Pregunta): string {
  return llenarCopy(`PERFIL.PREGUNTA.${p.disparador}` as CopyId, {
    materias: p.valores.materias.length <= 1 ? (p.valores.materias[0] ?? "") : `${p.valores.materias.slice(0, -1).join(", ")} y ${p.valores.materias.at(-1)}`,
    anio: p.valores.anio ?? "",
  });
}

export async function perfilDelRecorrido(deps: DependenciasDelPerfil, i: string, s: string): Promise<PerfilVisible> {
  const [recorrido, perfil] = await Promise.all([deps.recorrido(i, s), deps.repo.perfil(i, s)]);
  const { posibles, elegidas } = preguntasDe(recorrido, perfil.requisitosCursados);
  const vigentes = new Set(posibles.map((p) => p.clave));
  const porClave = new Map(perfil.respuestas.map((r) => [r.clave, r]));

  return {
    preguntas: elegidas.map((p) => {
      const r = porClave.get(p.clave);
      return {
        clave: p.clave,
        disparador: p.disparador,
        texto: textoDe(p),
        multiple: p.multiple,
        opciones: p.opciones.map((o) => ({ valor: o.valor, etiqueta: o.materia ?? t(`PERFIL.OPCION.${o.valor}` as CopyId) })),
        respuesta: r ? { estado: r.estado, opciones: r.opciones, textoLibre: r.textoLibre } : null,
      };
    }),
    hipotesis: perfil.hipotesis.map<HipotesisVisible>((h) => ({
      id: h.id,
      enunciado: h.enunciado,
      dimension: h.dimension,
      confianza: h.confianza,
      evidencia: h.evidencia,
      estado: estadoDeHipotesis(h, vigentes),
    })),
  };
}

export type ResultadoDeRespuesta =
  | { estado: "OK"; hipotesis: number }
  | { estado: "NO_DISPONIBLE" }
  | { estado: "DATOS_INVALIDOS"; motivo: string };

export async function responderPregunta(
  deps: DependenciasDelPerfil,
  i: string,
  s: string,
  entrada: { clave: string; estado: EstadoDeRespuesta; opciones: string[]; textoLibre: string | null },
): Promise<ResultadoDeRespuesta> {
  const [recorrido, perfil] = await Promise.all([deps.recorrido(i, s), deps.repo.perfil(i, s)]);
  const pregunta = preguntasDe(recorrido, perfil.requisitosCursados).elegidas.find((p) => p.clave === entrada.clave);
  // Sólo se contesta una pregunta que el analítico de hoy hace: no se guarda una
  // respuesta a algo que nadie preguntó.
  if (!pregunta) return { estado: "NO_DISPONIBLE" };

  const respuesta = { clave: entrada.clave, estado: entrada.estado, opciones: entrada.opciones, texto: entrada.textoLibre };
  const motivo = motivoDeRespuestaInvalida(pregunta, respuesta);
  if (motivo) return { estado: "DATOS_INVALIDOS", motivo };

  const hipotesis = hipotesisDeRespuesta(pregunta, respuesta).map((h) => ({
    dimension: h.dimension,
    enunciado: llenarCopy(h.plantilla as CopyId, h.valores),
    evidencia: h.evidencia,
    confianza: h.confianza,
    requisitos: h.requisitos,
  }));

  const idRespuesta = await deps.repo.responder(
    i,
    s,
    {
      clave: pregunta.clave,
      disparador: pregunta.disparador,
      regla: VERSION_DE_REGLA,
      texto: textoDe(pregunta),
      requisitos: pregunta.requisitos,
      estado: entrada.estado,
      opciones: entrada.estado === "ANSWERED" ? entrada.opciones : [],
      textoLibre: entrada.estado === "ANSWERED" ? entrada.textoLibre : null,
    },
    hipotesis,
  );

  await deps.eventos.publicar({
    nombre: "ProfileQuestionAnswered",
    institutionId: i,
    actorId: null,
    sujetoTipo: "profile_answer",
    sujetoId: idRespuesta,
    causa: `recorrido:${s}`,
    // ⚠️ Ni opciones ni texto: qué contestó es privado. Sólo que contestó.
    payload: { disparador: pregunta.disparador, estado: entrada.estado, hipotesis: hipotesis.length },
  });
  return { estado: "OK", hipotesis: hipotesis.length };
}

export async function rechazarHipotesis(
  deps: DependenciasDelPerfil,
  i: string,
  s: string,
  hipotesisId: string,
): Promise<{ estado: "OK" } | { estado: "NO_ENCONTRADA" }> {
  const ok = await deps.repo.rechazar(i, s, hipotesisId);
  if (!ok) return { estado: "NO_ENCONTRADA" };
  await deps.eventos.publicar({
    nombre: "ProfileHypothesisRejected",
    institutionId: i,
    actorId: null,
    sujetoTipo: "profile_hypothesis",
    sujetoId: hipotesisId,
    causa: `recorrido:${s}`,
  });
  return { estado: "OK" };
}

/**
 * **El seam del Personal Engine** (ADR-107 §7): las hipótesis vigentes, con su
 * evidencia y su confianza. **Nadie la llama todavía**, y es a propósito: que el
 * ADE las consuma es una decisión abierta, y el comportamiento posterior
 * —compromisos, Focus, evidencias— no escribe en el perfil en este corte.
 */
export async function hipotesisVigentes(deps: DependenciasDelPerfil, i: string, s: string): Promise<HipotesisVisible[]> {
  const perfil = await perfilDelRecorrido(deps, i, s);
  return perfil.hipotesis.filter((h) => h.estado === "VIGENTE");
}
