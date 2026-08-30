/**
 * Los niveles de precedencia de `UX01` que faltaban dibujar.
 *
 * Hasta la Etapa 0.6 el catálogo cubría cinco de los nueve niveles de
 * `VI.1` §3.2. Los otros cuatro esperaban a [ADR-017](../../docs/decisions.md),
 * que resolvió la ambigüedad de CTA que `product.md` §10.2 arrastraba.
 *
 * El nivel y su variante los calcula `selectHeroLevel`: acá sólo se declara la
 * condición del dominio.
 */

import { contexto } from "@/lib/navigation/context";
import type { Escenario } from "./types";
import type { HeroInput } from "@/lib/domain/precedence";
import type { HeroContenido } from "./types";
import type { MateriaResumen } from "@/lib/domain/view-models";

const MATERIAS: MateriaResumen[] = [
  { nombre: "Análisis Matemático II", estado: "En curso", ultimoAvance: "hoy", tono: "neutral" },
  { nombre: "Programación", estado: "Bajo control", ultimoAvance: "ayer", tono: "neutral" },
];

const nada: HeroInput = {
  action: "NONE",
  commitment: "NONE",
  rescate: "NONE",
  actionRecommended: false,
  contextIncomplete: false,
  evidenciaInformativa: "NONE",
};

function esc(
  id: string,
  proposito: string,
  heroInput: HeroInput,
  heroContenido: HeroContenido,
  cubre: readonly string[] = ["C01-010", "SC-DAY-03"],
): Escenario {
  return {
    id,
    origen: "local",
    proposito,
    cubre,
    contextos: {
      UX01: contexto({
        courseVisible: true,
        progresoDisponible: true,
        commitmentIniciable: heroInput.commitment === "STARTABLE",
        commitmentState:
          heroInput.commitment === "MISSED"
            ? "MISSED"
            : heroInput.commitment === "PROXIMO"
              ? "CONFIRMED"
              : heroInput.commitment === "STARTABLE"
                ? "DUE"
                : null,
        rescate: heroInput.rescate,
      }),
    },
    hoy: { fecha: "vie 28 ago", estadoGeneral: null, heroInput, heroContenido, materias: MATERIAS },
  };
}

// ── Nivel 3 · las tres variantes ─────────────────────────────────────────────
// El discriminador es el tiempo acordado, no la prioridad académica.

export const FX_LOCAL_DAY_COMMITMENT_PROXIMO = esc(
  "FX-LOCAL-DAY-COMMITMENT-PROXIMO",
  "Commitment acordado a futuro: se abre su detalle, no se inicia",
  { ...nada, commitment: "PROXIMO", actionRecommended: true },
  {
    contexto: "Análisis II · Unidad 3",
    titulo: "Resolver ejercicios 8–14",
    razon: "ya acordaste cuándo hacerlo.",
    tiempoOEstado: "Sáb 30 ago · 19:00",
    evidenciaEsperada: null,
    queSigue: { texto: "se abre el detalle. Verlo no lo inicia.", conPrefijo: true },
    chip: null,
  },
);

export const FX_LOCAL_DAY_COMMITMENT_STARTABLE = esc(
  "FX-LOCAL-DAY-COMMITMENT-STARTABLE",
  "Commitment iniciable ahora según el owner: nunca según un reloj local",
  { ...nada, commitment: "STARTABLE" },
  {
    contexto: "Análisis II · Unidad 3",
    titulo: "Resolver ejercicios 8–14",
    razon: "es la hora que acordaste.",
    tiempoOEstado: "Hoy · 19:00",
    evidenciaEsperada: "7 ejercicios",
    queSigue: { texto: "el owner coordina el inicio. Abrir la pantalla no lo inicia.", conPrefijo: true },
    chip: null,
  },
);

export const FX_LOCAL_DAY_RESCATE_STARTABLE = esc(
  "FX-LOCAL-DAY-RESCATE-STARTABLE",
  "Rescate materializado e iniciable: participa por su lifecycle, no por ser rescate",
  { ...nada, commitment: "STARTABLE", rescate: "MATERIALIZED" },
  {
    contexto: null,
    titulo: "Retomar los ejercicios 8–14",
    razon: "acordaste cómo recuperar el compromiso del miércoles.",
    tiempoOEstado: "Hoy · 20:00",
    evidenciaEsperada: null,
    queSigue: { texto: "el rescate pasa a ejecución. El compromiso incumplido conserva su estado.", conPrefijo: true },
    chip: { tono: "urgencia", texto: "Análisis II · Rescate acordado" },
  },
  ["C01-010", "SC-DAY-04"],
);

// ── Nivel 5 · incumplimiento sin resolución ──────────────────────────────────
// No se maquilla ni se crea contenido de rescate desde la vista.
export const FX_LOCAL_DAY_MISSED_SIN_RESOLUCION = esc(
  "FX-LOCAL-DAY-MISSED-SIN-RESOLUCION",
  "Commitment MISSED sin resolución: RETOMAR, sin inventar el rescate",
  { ...nada, commitment: "MISSED", actionRecommended: true },
  {
    contexto: null,
    titulo: "El compromiso del miércoles quedó sin resolver.",
    razon: "todavía no acordaste cómo recuperarlo.",
    tiempoOEstado: null,
    evidenciaEsperada: null,
    queSigue: { texto: "se abre la resolución del incumplimiento.", conPrefijo: true },
    chip: { tono: "urgencia", texto: "Análisis II · Compromiso incumplido" },
  },
  ["C01-010", "SC-DAY-04"],
);

// ── Nivel 7 · contexto académico incompleto ──────────────────────────────────
export const FX_LOCAL_DAY_CONTEXTO_INCOMPLETO = esc(
  "FX-LOCAL-DAY-CONTEXTO-INCOMPLETO",
  "Contexto académico incompleto que bloquea toda recomendación válida",
  { ...nada, contextIncomplete: true },
  {
    contexto: "Análisis II",
    titulo: "Falta confirmar tu cursado de esta materia.",
    razon: "sin el contexto de cursado no podemos proponerte una acción.",
    tiempoOEstado: null,
    evidenciaEsperada: null,
    // No se muestra alcance, duración ni evidencia inexistentes.
    queSigue: { texto: "se abre lo que falta completar.", conPrefijo: true },
    chip: null,
  },
  ["C01-003", "SC-DAY-05"],
);

// ── Nivel 8 · las dos variantes de Evidence informativa ──────────────────────
// El discriminador es el lifecycle. No se promete hora, revisor ni una
// recomendación que no existe.

export const FX_LOCAL_DAY_EVIDENCIA_ENVIADA = esc(
  "FX-LOCAL-DAY-EVIDENCIA-ENVIADA",
  "Evidence enviada sin acción posterior: VER EVIDENCIA, sin prometer revisor ni hora",
  { ...nada, evidenciaInformativa: "ENVIADA" },
  {
    contexto: "Análisis II · Unidad 3",
    titulo: "Tu evidencia está enviada.",
    razon: "no hay una acción pendiente en esta materia.",
    tiempoOEstado: null,
    evidenciaEsperada: null,
    queSigue: { texto: "se abre el detalle. Enviar no implica suficiencia ni validación.", conPrefijo: true },
    chip: null,
  },
  ["C01-012", "SC-EV-01"],
);

export const FX_LOCAL_DAY_EVIDENCIA_VALIDADA = esc(
  "FX-LOCAL-DAY-EVIDENCIA-VALIDADA",
  "Evidence validada sin acción posterior: VER AVANCE, sin afirmar dominio",
  { ...nada, evidenciaInformativa: "VALIDADA" },
  {
    contexto: "Análisis II · Unidad 3",
    titulo: "Tu evidencia fue validada.",
    razon: "no hay una acción pendiente en esta materia.",
    tiempoOEstado: null,
    evidenciaEsperada: null,
    queSigue: { texto: "se abre el avance confirmado. Validar no demuestra dominio.", conPrefijo: true },
    chip: null,
  },
  ["C01-018", "SC-PROG-01"],
);

export const escenariosUX01 = {
  "FX-LOCAL-DAY-COMMITMENT-PROXIMO": FX_LOCAL_DAY_COMMITMENT_PROXIMO,
  "FX-LOCAL-DAY-COMMITMENT-STARTABLE": FX_LOCAL_DAY_COMMITMENT_STARTABLE,
  "FX-LOCAL-DAY-RESCATE-STARTABLE": FX_LOCAL_DAY_RESCATE_STARTABLE,
  "FX-LOCAL-DAY-MISSED-SIN-RESOLUCION": FX_LOCAL_DAY_MISSED_SIN_RESOLUCION,
  "FX-LOCAL-DAY-CONTEXTO-INCOMPLETO": FX_LOCAL_DAY_CONTEXTO_INCOMPLETO,
  "FX-LOCAL-DAY-EVIDENCIA-ENVIADA": FX_LOCAL_DAY_EVIDENCIA_ENVIADA,
  "FX-LOCAL-DAY-EVIDENCIA-VALIDADA": FX_LOCAL_DAY_EVIDENCIA_VALIDADA,
} as const satisfies Record<string, Escenario>;
