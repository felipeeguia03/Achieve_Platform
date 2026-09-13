import "server-only";

import { nodos } from "@/lib/navigation/surfaces";
import { rutaDeCtaCon } from "@/lib/navigation";

/**
 * Los avisos simulados de la campanita — [ADR-097 · Enmienda 1](../../../docs/decisions.md#adr-097-enmienda-1).
 *
 * ⚠️ **Nada de esto ocurrió.** Achieve no tiene entidad de notificaciones: el
 * owner pidió *"por ahora poné avisos sintéticos en la campanita"* para ver cómo
 * se ve. Todo sale de acá, **sólo con `MODO_PRUEBA=1`**, y la campanita lo rotula
 * *Simulado*. Es el mismo patrón que la Formación simulada (ADR-087 Enm. 3).
 *
 * ⚠️ **No es el modelo de las notificaciones reales.** Qué se notifica, a quién,
 * por qué canal y cuándo caduca lo decide el owner cuando se diseñen; esta forma
 * no se migra a una tabla.
 *
 * Los seis tipos son los que se le propusieron al owner, y **cada uno nombra algo
 * que el dominio sí registra** —un compromiso por vencer, un pedido de reenvío—,
 * para que la simulación no enseñe avisos de cosas que no existen.
 */

export type TipoDeAviso =
  | "COMPROMISO_POR_VENCER"
  | "COMPROMISO_INCUMPLIDO"
  | "EVIDENCIA_VALIDADA"
  | "REENVIO_PEDIDO"
  | "ACOMPANAMIENTO_ABIERTO"
  | "RIESGO_NUEVO";

export interface AvisoSimulado {
  id: string;
  tipo: TipoDeAviso;
  texto: string;
  /** Una línea más, si hace falta. `null` ⇒ no se dibuja. */
  detalle: string | null;
  /** ISO. */
  fecha: string;
  /** A dónde lleva tocarlo. `null` ⇒ no navega. */
  ruta: string | null;
  leido: boolean;
}

export interface AvisosSimulados {
  simulados: true;
  avisos: AvisoSimulado[];
}

/** Lo mínimo de una materia para nombrarla y abrirla. */
export interface MateriaParaAviso {
  cursadaId: string;
  nombre: string;
}

const MINUTO = 60_000;
const HORA = 60 * MINUTO;
const DIA = 24 * HORA;

/**
 * Arma la lista con **las materias del estudiante**, para que se lea como la
 * suya. Sin materias —el alta a medias— los avisos no nombran ninguna, en vez de
 * inventar una.
 */
export function avisosSimulados(
  materias: readonly MateriaParaAviso[],
  ahora: Date = new Date(),
): AvisosSimulados {
  const primera = materias[0] ?? null;
  const segunda = materias[1] ?? primera;
  const de = (m: MateriaParaAviso | null) => (m ? ` de ${m.nombre}` : "");
  const en = (m: MateriaParaAviso | null) => (m ? ` en ${m.nombre}` : "");
  const hace = (ms: number) => new Date(ahora.getTime() - ms).toISOString();
  const materia = (m: MateriaParaAviso | null) => (m ? rutaDeCtaCon("CTA-001", m.cursadaId) : null);
  const registro = (m: MateriaParaAviso | null) =>
    m ? rutaDeCtaCon("CTA-009", m.cursadaId) : nodos.UX06.ruta;

  return {
    simulados: true,
    avisos: [
      {
        id: "sim-1",
        tipo: "COMPROMISO_POR_VENCER",
        texto: `Tu compromiso${de(primera)} vence hoy a las 19:00.`,
        detalle: null,
        fecha: hace(15 * MINUTO),
        ruta: nodos.UX04.ruta,
        leido: false,
      },
      {
        id: "sim-2",
        tipo: "REENVIO_PEDIDO",
        texto: `Te pidieron reenviar la entrega${de(segunda)}.`,
        detalle: "Motivo: faltan los ejercicios 12 a 14.",
        fecha: hace(2 * HORA),
        ruta: nodos.UX05.ruta,
        leido: false,
      },
      {
        id: "sim-3",
        tipo: "RIESGO_NUEVO",
        texto: `Nuevo riesgo${en(primera)}: evaluación en 5 días con 0% de cobertura.`,
        detalle: null,
        fecha: hace(5 * HORA),
        ruta: materia(primera) ?? nodos.UX01.ruta,
        leido: false,
      },
      {
        id: "sim-4",
        tipo: "EVIDENCIA_VALIDADA",
        texto: `Tu entrega${de(segunda)} fue validada.`,
        detalle: null,
        fecha: hace(DIA + 3 * HORA),
        ruta: registro(segunda),
        leido: true,
      },
      {
        id: "sim-5",
        tipo: "COMPROMISO_INCUMPLIDO",
        texto: `No llegaste con el compromiso${de(primera)}. Podés retomarlo.`,
        detalle: null,
        fecha: hace(2 * DIA),
        ruta: nodos.UX04.ruta,
        leido: true,
      },
      {
        /*
          ⚠️ **No promete contacto.** ADR-042 prohíbe decir que hay un operador
          asignado o que alguien va a escribir: la Plataforma no observa ese
          estado. Se dice el hecho —se abrió— y nada más.
        */
        id: "sim-6",
        tipo: "ACOMPANAMIENTO_ABIERTO",
        texto: `Se abrió un acompañamiento${en(segunda)}.`,
        detalle: null,
        fecha: hace(4 * DIA),
        ruta: nodos.UX01.ruta,
        leido: true,
      },
    ],
  };
}
