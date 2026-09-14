/**
 * El analítico — la historia académica del estudiante,
 * [ADR-106](../../docs/decisions.md#adr-106).
 *
 * **Puro:** sin I/O, sin React. Valida un archivo **por sus bytes**, interpreta
 * las filas crudas que devuelve un extractor y las vincula **sólo** con el plan
 * del estudiante. Nada de acá crea una cursada, escribe progreso ni decide qué
 * estudiar.
 *
 * ## Dos representaciones que no se mezclan
 *
 * El analítico describe **el pasado**; `course_enrollment` describe **el
 * presente**. Que una materia figure aprobada, regular o pendiente **no dice que
 * se esté cursando ahora** (ADR-106 §2).
 *
 * ## Sin datos no es cero
 *
 * Una nota ilegible es `null`, no `0`. Un estado que no se reconoce es
 * `UNKNOWN`, no «desaprobado». Una fecha que no se entiende no se completa.
 */

// ── El archivo ───────────────────────────────────────────────────────────────

export type TipoDeArchivo = "application/pdf" | "image/png" | "image/jpeg";

export const BYTES_MAXIMOS = 10 * 1024 * 1024;
export const PAGINAS_MAXIMAS = 20;

export type MotivoDeArchivoInvalido =
  | "VACIO"
  | "TIPO_NO_ADMITIDO"
  | "DEMASIADO_GRANDE"
  | "CORRUPTO"
  | "PROTEGIDO"
  | "DEMASIADAS_PAGINAS";

export type ArchivoValidado =
  | { estado: "OK"; tipo: TipoDeArchivo; paginas: number | null }
  | { estado: "INVALIDO"; motivo: MotivoDeArchivoInvalido };

/** El tipo real, **por firma de bytes**. La extensión y el MIME declarado no cuentan. */
export function tipoPorFirma(bytes: Uint8Array): TipoDeArchivo | null {
  const b = bytes;
  if (b.length >= 5 && b[0] === 0x25 && b[1] === 0x50 && b[2] === 0x44 && b[3] === 0x46 && b[4] === 0x2d) {
    return "application/pdf"; // %PDF-
  }
  if (b.length >= 8 && b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) return "image/png";
  if (b.length >= 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return "image/jpeg";
  return null;
}

/** Los bytes como texto latin1: un PDF sin comprimir se lee así, byte a byte. */
export function comoLatin1(bytes: Uint8Array): string {
  let s = "";
  const paso = 0x8000;
  for (let i = 0; i < bytes.length; i += paso) {
    s += String.fromCharCode(...bytes.subarray(i, i + paso));
  }
  return s;
}

export function validarArchivo(bytes: Uint8Array): ArchivoValidado {
  if (bytes.length === 0) return { estado: "INVALIDO", motivo: "VACIO" };
  if (bytes.length > BYTES_MAXIMOS) return { estado: "INVALIDO", motivo: "DEMASIADO_GRANDE" };
  const tipo = tipoPorFirma(bytes);
  if (!tipo) return { estado: "INVALIDO", motivo: "TIPO_NO_ADMITIDO" };
  if (tipo !== "application/pdf") return { estado: "OK", tipo, paginas: null };

  const texto = comoLatin1(bytes);
  // Un PDF sin marca de fin está cortado: no se procesa a medias.
  if (!texto.slice(-1024).includes("%%EOF")) return { estado: "INVALIDO", motivo: "CORRUPTO" };
  if (/\/Encrypt\b/.test(texto)) return { estado: "INVALIDO", motivo: "PROTEGIDO" };
  const paginas = (texto.match(/\/Type\s*\/Page(?!s)\b/g) ?? []).length;
  if (paginas > PAGINAS_MAXIMAS) return { estado: "INVALIDO", motivo: "DEMASIADAS_PAGINAS" };
  return { estado: "OK", tipo, paginas: paginas || null };
}

// ── Lo que devuelve un extractor ─────────────────────────────────────────────

/** Una fila **tal como vino**. Ningún campo se completa. */
export interface FilaCruda {
  nombre: string;
  codigo: string | null;
  estado: string | null;
  nota: string | null;
  fecha: string | null;
  periodo: string | null;
}

export type ResultadoDeExtraccion =
  | { estado: "OK"; filas: FilaCruda[] }
  | { estado: "FALLO"; motivo: "EXTRACCION_NO_DISPONIBLE" | "NO_PARECE_UN_ANALITICO" | "SIN_RESULTADOS" };

/** El puerto (ADR-106 §5). El único adaptador del repo es sintético. */
export interface ExtractorDeAnalitico {
  version: string;
  extraer(bytes: Uint8Array, tipo: TipoDeArchivo): Promise<ResultadoDeExtraccion>;
}

// ── El formato sintético ─────────────────────────────────────────────────────
//
// Un analítico **generado por el repo**: una línea marca y una fila por
// resultado. No imita el formato de ninguna universidad real, a propósito.

export const MARCA_SINTETICA = "ACHIEVE-SYN-ANALITICO v1";

export function lineasSinteticas(filas: readonly FilaCruda[]): string[] {
  // ⚠️ El PDF sintético es latin1: un carácter fuera de rango se escribe `?` en
  // vez de truncarse a otro byte —«…» se volvía «&» y parecía un dato.
  const campo = (v: string | null) =>
    (v ?? "").replace(/[|()\\\r\n]/g, " ").replace(/[^\u0000-\u00ff]/g, "?").trim();
  return [
    MARCA_SINTETICA,
    ...filas.map((f) =>
      ["FILA", campo(f.codigo), campo(f.nombre), campo(f.estado), campo(f.nota), campo(f.fecha), campo(f.periodo)].join("|"),
    ),
  ];
}

/** Lee las filas de un texto sintético. `null` ⇒ el texto no tiene la marca. */
export function leerLineasSinteticas(texto: string): FilaCruda[] | null {
  if (!texto.includes(MARCA_SINTETICA)) return null;
  const filas: FilaCruda[] = [];
  for (const m of texto.matchAll(/FILA\|([^|()\r\n]*)\|([^|()\r\n]*)\|([^|()\r\n]*)\|([^|()\r\n]*)\|([^|()\r\n]*)\|([^|()\r\n]*)/g)) {
    const v = (x: string) => (x.trim() === "" ? null : x.trim());
    const nombre = m[2].trim();
    if (!nombre) continue;
    filas.push({ codigo: v(m[1]), nombre, estado: v(m[3]), nota: v(m[4]), fecha: v(m[5]), periodo: v(m[6]) });
  }
  return filas;
}

/**
 * Un PDF mínimo y válido con esas líneas de texto. Lo usa el modo prueba para
 * generar un analítico sintético: **no es un PDF de nadie**.
 */
export function pdfSintetico(lineas: readonly string[]): Uint8Array {
  const esc = (s: string) => s.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
  const contenido = [
    "BT /F1 9 Tf 40 800 Td 12 TL",
    ...lineas.map((l) => `(${esc(l)}) Tj T*`),
    "ET",
  ].join("\n");
  const objetos = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>",
    `<< /Length ${contenido.length} >>\nstream\n${contenido}\nendstream`,
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>",
  ];
  let cuerpo = "%PDF-1.4\n";
  const desplazamientos: number[] = [];
  objetos.forEach((o, i) => {
    desplazamientos.push(cuerpo.length);
    cuerpo += `${i + 1} 0 obj\n${o}\nendobj\n`;
  });
  const xref = cuerpo.length;
  cuerpo += `xref\n0 ${objetos.length + 1}\n0000000000 65535 f \n`;
  for (const d of desplazamientos) cuerpo += `${String(d).padStart(10, "0")} 00000 n \n`;
  cuerpo += `trailer\n<< /Size ${objetos.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
  const bytes = new Uint8Array(cuerpo.length);
  for (let i = 0; i < cuerpo.length; i++) bytes[i] = cuerpo.charCodeAt(i) & 0xff;
  return bytes;
}

// ── Interpretar ──────────────────────────────────────────────────────────────

/** ADR-106 §6: vocabulario cerrado. `UNKNOWN` no es un default: es «no se reconoce». */
export type EstadoDeResultado =
  | "APPROVED"
  | "PROMOTED"
  | "REGULARIZED"
  | "FAILED"
  | "ABSENT"
  | "EQUIVALENCE"
  | "UNKNOWN";

export const ESTADOS_DE_RESULTADO: readonly EstadoDeResultado[] = [
  "APPROVED", "PROMOTED", "REGULARIZED", "FAILED", "ABSENT", "EQUIVALENCE", "UNKNOWN",
];

const sinTildes = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "");

/**
 * ⚠️ **Por palabras enteras, nunca por prefijo.** *«Aprob…»* —cortado en la
 * fuente— no es «aprobado»: completarlo sería inventar el dato que falta.
 */
const PALABRAS_DE_ESTADO: ReadonlyArray<readonly [EstadoDeResultado, readonly string[]]> = [
  ["PROMOTED", ["promocionado", "promocionada", "promocion", "promociono"]],
  ["EQUIVALENCE", ["equivalencia"]],
  ["REGULARIZED", ["regular", "regularizado", "regularizada", "regularizo"]],
  ["ABSENT", ["ausente"]],
  ["FAILED", ["desaprobado", "desaprobada", "reprobado", "reprobada", "aplazado", "aplazada", "aplazo", "insuficiente", "libre"]],
  ["APPROVED", ["aprobado", "aprobada", "aprobo"]],
];

export function interpretarEstado(crudo: string | null): EstadoDeResultado {
  const palabras = sinTildes((crudo ?? "").trim().toLowerCase())
    .split(/[^a-z]+/)
    .filter(Boolean);
  if (palabras.length === 0) return "UNKNOWN";
  for (const [estado, validas] of PALABRAS_DE_ESTADO) {
    if (palabras.some((p) => validas.includes(p))) return estado;
  }
  return "UNKNOWN";
}

/** Nota en escala 0–10. `null` ⇒ no hay nota legible, **que no es un cero**. */
export function interpretarNota(crudo: string | null): number | null {
  const s = (crudo ?? "").trim().replace(",", ".");
  if (!/^\d{1,2}(\.\d{1,2})?$/.test(s)) return null;
  const n = Number(s);
  return n >= 0 && n <= 10 ? n : null;
}

/** `dd/mm/aaaa` o `aaaa-mm-dd` a `aaaa-mm-dd`. Cualquier otra cosa es `null`. */
export function interpretarFecha(crudo: string | null): string | null {
  const s = (crudo ?? "").trim();
  let a: number, m: number, d: number;
  const dmy = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(s);
  const iso = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  if (dmy) [d, m, a] = [Number(dmy[1]), Number(dmy[2]), Number(dmy[3])];
  else if (iso) [a, m, d] = [Number(iso[1]), Number(iso[2]), Number(iso[3])];
  else return null;
  const f = new Date(Date.UTC(a, m - 1, d));
  if (f.getUTCFullYear() !== a || f.getUTCMonth() !== m - 1 || f.getUTCDate() !== d) return null;
  return `${a}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

// ── Vincular con el plan del estudiante ──────────────────────────────────────

export interface RequisitoDelPlanDelEstudiante {
  requisitoId: string;
  codigo: string | null;
  nombre: string;
  nombreCortado: boolean;
}

export type ReglaDeVinculo = "CODE" | "NAME_EXACT" | "STUDENT_CHOICE" | "NONE";
export type EstadoDeRevision = "AUTO" | "NEEDS_REVIEW" | "CONFIRMED" | "CORRECTED" | "UNSURE" | "NOT_IN_PLAN";

export interface Vinculo {
  requisitoId: string | null;
  regla: ReglaDeVinculo;
  confianza: number | null;
  revision: "AUTO" | "NEEDS_REVIEW";
}

/** Mayúsculas, sin tildes, sin puntuación, espacios simples. */
export function normalizarNombre(s: string): string {
  return sinTildes(s)
    .toUpperCase()
    .replace(/[^A-Z0-9 ]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * ADR-106 §7. **Sólo contra el plan del estudiante**, y dos reglas:
 *
 * 1. Código exacto, único → `CODE`.
 * 2. Nombre normalizado exacto, único → `NAME_EXACT`.
 *
 * Todo lo demás va a revisión: varios candidatos, ninguno, o un nombre del plan
 * **cortado en la fuente** —que no se completa, ni siquiera cuando «se ve»—.
 * Un estado ilegible también se revisa: vincular bien una fila que no se sabe
 * qué dice no la vuelve un dato.
 */
export function vincular(fila: FilaCruda, requisitos: readonly RequisitoDelPlanDelEstudiante[]): Vinculo {
  const revisar = (estadoIlegible: boolean): Vinculo["revision"] => (estadoIlegible ? "NEEDS_REVIEW" : "AUTO");
  const ilegible = interpretarEstado(fila.estado) === "UNKNOWN";

  const codigo = (fila.codigo ?? "").trim().toUpperCase();
  if (codigo) {
    const porCodigo = requisitos.filter((r) => (r.codigo ?? "").trim().toUpperCase() === codigo);
    if (porCodigo.length === 1) {
      return { requisitoId: porCodigo[0].requisitoId, regla: "CODE", confianza: 1, revision: revisar(ilegible) };
    }
  }

  const nombre = normalizarNombre(fila.nombre);
  const porNombre = requisitos.filter((r) => !r.nombreCortado && normalizarNombre(r.nombre) === nombre);
  if (porNombre.length === 1) {
    return { requisitoId: porNombre[0].requisitoId, regla: "NAME_EXACT", confianza: 0.9, revision: revisar(ilegible) };
  }
  return { requisitoId: null, regla: "NONE", confianza: null, revision: "NEEDS_REVIEW" };
}

/** Los candidatos que se le ofrecen al revisar: prefijo o coincidencia parcial, del plan. */
export function candidatos(
  fila: Pick<FilaCruda, "nombre">,
  requisitos: readonly RequisitoDelPlanDelEstudiante[],
): RequisitoDelPlanDelEstudiante[] {
  const nombre = normalizarNombre(fila.nombre);
  return requisitos.filter((r) => {
    const n = normalizarNombre(r.nombre);
    return n.length >= 4 && (nombre.startsWith(n) || n.startsWith(nombre) || nombre.includes(n));
  });
}

// ── Resumen ──────────────────────────────────────────────────────────────────

export interface ResultadoGuardado {
  estado: EstadoDeResultado;
  revision: EstadoDeRevision;
}

export interface ResumenDelAnalitico {
  resultados: number;
  aprobadas: number;
  regularizadas: number;
  vinculadas: number;
  aRevisar: number;
}

const APROBACION: readonly EstadoDeResultado[] = ["APPROVED", "PROMOTED", "EQUIVALENCE"];

export function esAprobacion(e: EstadoDeResultado): boolean {
  return APROBACION.includes(e);
}

export function resumenDelAnalitico(filas: readonly ResultadoGuardado[]): ResumenDelAnalitico {
  return {
    resultados: filas.length,
    aprobadas: filas.filter((f) => esAprobacion(f.estado)).length,
    regularizadas: filas.filter((f) => f.estado === "REGULARIZED").length,
    vinculadas: filas.filter((f) => f.revision === "AUTO" || f.revision === "CONFIRMED" || f.revision === "CORRECTED").length,
    aRevisar: filas.filter((f) => f.revision === "NEEDS_REVIEW").length,
  };
}

// ── Lo que lee `/recorrido` ──────────────────────────────────────────────────

export interface ResultadoLeido {
  id: string;
  ordinal: number;
  crudo: { nombre: string; codigo: string | null; estado: string | null; nota: string | null; fecha: string | null; periodo: string | null };
  estado: EstadoDeResultado;
  nota: number | null;
  fecha: string | null;
  requisitoId: string | null;
  requisito: string | null;
  anio: number | null;
  materiaId: string | null;
  regla: "CODE" | "NAME_EXACT" | "STUDENT_CHOICE" | "NONE";
  revision: EstadoDeRevision;
}

export interface RecorridoLeido {
  consentimiento: { decision: "GRANTED" | "WITHDRAWN"; version: string; en: string } | null;
  ultimoFallido: { motivo: string; en: string } | null;
  documentosAnteriores: number;
  documento: {
    id: string;
    subidoEn: string;
    confirmadoEn: string | null;
    tipo: TipoDeArchivo;
    paginas: number | null;
    resultados: ResultadoLeido[];
  } | null;
  requisitos: { requisitoId: string; codigo: string | null; nombre: string; nombreCortado: boolean; anio: number | null }[];
}

