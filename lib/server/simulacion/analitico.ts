import "server-only";

import {
  comoLatin1,
  leerLineasSinteticas,
  lineasSinteticas,
  pdfSintetico,
  type ExtractorDeAnalitico,
  type FilaCruda,
} from "@/lib/domain/analitico";

/**
 * El extractor del analítico — **el único del repositorio, y es sintético**.
 * [ADR-106](../../../docs/decisions.md#adr-106) §5.
 *
 * Lee analíticos **generados por el propio repo** (`ACHIEVE-SYN-ANALITICO v1`).
 * Cualquier otro archivo termina en `EXTRACCION_NO_DISPONIBLE`, que es la
 * verdad: **no hay extractor real, y no lo habrá sin dictamen de ADR-006**.
 * No hay OCR, no hay proveedor externo y no sale un byte del servidor.
 */
export const extractorSintetico: ExtractorDeAnalitico = {
  version: "SINTETICO-v1",
  async extraer(bytes, tipo) {
    if (tipo !== "application/pdf") return { estado: "FALLO", motivo: "EXTRACCION_NO_DISPONIBLE" };
    const filas = leerLineasSinteticas(comoLatin1(bytes));
    if (filas === null) return { estado: "FALLO", motivo: "EXTRACCION_NO_DISPONIBLE" };
    if (filas.length === 0) return { estado: "FALLO", motivo: "SIN_RESULTADOS" };
    return { estado: "OK", filas };
  },
};

/** Un número estable a partir de un texto: la misma persona, el mismo analítico. */
function semilla(texto: string): number {
  let h = 2166136261;
  for (let i = 0; i < texto.length; i++) h = Math.imul(h ^ texto.charCodeAt(i), 16777619);
  return h >>> 0;
}

export interface RequisitoParaSimular {
  codigo: string | null;
  nombre: string;
  anio: number | null;
  tipo: string;
  /** La materia se cursa ahora: su intento previo dispara la pregunta de materia actual. */
  seCursaAhora: boolean;
}

/**
 * Un analítico sintético para el estudiante del modo prueba, **con los patrones
 * que el recorrido sabe preguntar**: una recuperación, una persistencia, un año
 * flojo, buenas notas, una materia actual con un intento previo, una fila
 * ilegible y una que no es del plan.
 *
 * ⚠️ **No es de nadie.** Se arma sobre el plan sintético del estudiante y sale
 * sólo con `MODO_PRUEBA=1`.
 */
export function analiticoSintetico(studentId: string, anioDeCarrera: number, requisitos: readonly RequisitoParaSimular[]): Uint8Array {
  const s = semilla(studentId);
  const materias = requisitos.filter((r) => r.tipo === "COURSE" && r.anio !== null && r.anio < anioDeCarrera);
  const filas: FilaCruda[] = [];
  const fecha = (anio: number, mes: number) => `${String(10 + (s % 18)).padStart(2, "0")}/${String(mes).padStart(2, "0")}/${anio}`;
  const base = 2026 - anioDeCarrera;
  // El año con menos aprobaciones: el segundo año cursado, si hay tres o más.
  const anioFlojo = anioDeCarrera >= 4 ? 2 : -1;

  materias.forEach((m, i) => {
    const anio = base + (m.anio ?? 1);
    const nota = String(6 + ((s >> i) % 5));
    if (m.anio === anioFlojo && i % 2 === 0) {
      filas.push({ ...m, estado: "Ausente", nota: null, fecha: fecha(anio, 7), periodo: String(anio) });
      filas.push({ ...m, estado: "Aprobado", nota, fecha: fecha(anio + 1, 3), periodo: String(anio + 1) });
      return;
    }
    if (i === 0) {
      // Recuperación: un aplazo y después la aprobación.
      filas.push({ ...m, estado: "Desaprobado", nota: "2", fecha: fecha(anio, 7), periodo: String(anio) });
      filas.push({ ...m, estado: "Aprobado", nota: "7", fecha: fecha(anio, 12), periodo: String(anio) });
      return;
    }
    if (i === 1) {
      // Persistencia: tres intentos hasta aprobar.
      filas.push({ ...m, estado: "Desaprobado", nota: "3", fecha: fecha(anio, 7), periodo: String(anio) });
      filas.push({ ...m, estado: "Desaprobado", nota: "3", fecha: fecha(anio, 12), periodo: String(anio) });
      filas.push({ ...m, estado: "Aprobado", nota: "6", fecha: fecha(anio + 1, 3), periodo: String(anio + 1) });
      return;
    }
    if (i === 2) {
      // Una fila ilegible: el estado no se reconoce y la nota no se lee.
      filas.push({ ...m, estado: "Aprob.", nota: "?", fecha: fecha(anio, 12), periodo: String(anio) });
      return;
    }
    filas.push({ ...m, estado: i % 4 === 0 ? "Promocionado" : "Aprobado", nota: i < 7 ? String(8 + (i % 3)) : nota, fecha: fecha(anio, 12), periodo: String(anio) });
  });

  // Una materia que se cursa ahora, con un intento previo sin aprobar.
  const actual = requisitos.find((r) => r.seCursaAhora);
  if (actual) filas.push({ ...actual, estado: "Libre", nota: null, fecha: fecha(2025, 12), periodo: "2025" });

  // Una fila que no es del plan: no se vincula y va a revisión.
  filas.push({ codigo: "SYN-X", nombre: "Materia de otro plan SYN", estado: "Aprobado", nota: "9", fecha: fecha(base + 1, 12), periodo: String(base + 1) });

  return pdfSintetico(lineasSinteticas(filas.map((f) => ({ nombre: f.nombre, codigo: f.codigo, estado: f.estado, nota: f.nota, fecha: f.fecha, periodo: f.periodo }))));
}
