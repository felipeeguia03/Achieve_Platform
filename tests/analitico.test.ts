import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

import {
  candidatos,
  comoLatin1,
  interpretarEstado,
  interpretarFecha,
  interpretarNota,
  leerLineasSinteticas,
  lineasSinteticas,
  pdfSintetico,
  resumenDelAnalitico,
  validarArchivo,
  vincular,
  type FilaCruda,
  type RecorridoLeido,
  type RequisitoDelPlanDelEstudiante,
} from "@/lib/domain/analitico";
import {
  borrarAnalitico,
  motivoDeRevisionInvalida,
  subirAnalitico,
  type DependenciasDelAnalitico,
  type RepositorioDelAnalitico,
} from "@/lib/server/servicios/analitico";

/**
 * El analítico — [ADR-106](../docs/decisions.md#adr-106).
 *
 * Contra Postgres lo verifica `scripts/db-superficies.sh`. Acá: el dominio, el
 * Service con dobles y **las ausencias** que el ADR protege.
 */

const LEER = (p: string) => readFileSync(resolve(process.cwd(), p), "utf8");
const sinComentariosSql = (sql: string) => sql.replace(/^\s*--.*$/gm, "");
const codigo = (ts: string) => ts.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");

const fila = (x: Partial<FilaCruda>): FilaCruda => ({
  nombre: "Análisis Matemático I",
  codigo: null,
  estado: "Aprobado",
  nota: "8",
  fecha: "12/07/2024",
  periodo: "2024",
  ...x,
});

const PLAN: RequisitoDelPlanDelEstudiante[] = [
  { requisitoId: "r-am1", codigo: "AM1", nombre: "ANALISIS MATEMATICO I", nombreCortado: false },
  { requisitoId: "r-am2", codigo: "AM2", nombre: "ANALISIS MATEMATICO II", nombreCortado: false },
  { requisitoId: "r-adm", codigo: null, nombre: "ADMINISTR. PROY. DE SOFTWARE", nombreCortado: true },
];

describe("el archivo se valida por sus bytes, no por su nombre", () => {
  const pdf = pdfSintetico(lineasSinteticas([fila({})]));

  it("un PDF sintético válido pasa, con su página", () => {
    expect(validarArchivo(pdf)).toEqual({ estado: "OK", tipo: "application/pdf", paginas: 1 });
  });
  it("PNG y JPEG se reconocen por firma", () => {
    expect(validarArchivo(new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))).toMatchObject({ tipo: "image/png" });
    expect(validarArchivo(new Uint8Array([0xff, 0xd8, 0xff, 0xe0]))).toMatchObject({ tipo: "image/jpeg" });
  });
  it("vacío, de otro tipo, cortado o protegido se rechaza con su motivo", () => {
    expect(validarArchivo(new Uint8Array())).toEqual({ estado: "INVALIDO", motivo: "VACIO" });
    expect(validarArchivo(new TextEncoder().encode("hola, soy un .pdf renombrado"))).toEqual({ estado: "INVALIDO", motivo: "TIPO_NO_ADMITIDO" });
    expect(validarArchivo(pdf.slice(0, pdf.length - 8))).toEqual({ estado: "INVALIDO", motivo: "CORRUPTO" });
    const protegido = new TextEncoder().encode("%PDF-1.4\n<< /Encrypt 9 0 R >>\n%%EOF\n");
    expect(validarArchivo(protegido)).toEqual({ estado: "INVALIDO", motivo: "PROTEGIDO" });
  });
  it("más de 10 MB se rechaza sin leerlo", () => {
    expect(validarArchivo(new Uint8Array(10 * 1024 * 1024 + 1))).toEqual({ estado: "INVALIDO", motivo: "DEMASIADO_GRANDE" });
  });
  it("el formato sintético va y vuelve, con tildes", () => {
    const filas = [fila({ codigo: "AM1" }), fila({ nombre: "Física I", estado: "Ausente", nota: null })];
    expect(leerLineasSinteticas(comoLatin1(pdfSintetico(lineasSinteticas(filas))))).toEqual(filas);
  });
  it("un carácter fuera de latin1 se escribe «?», no se corrompe en otro", () => {
    const [, linea] = lineasSinteticas([fila({ estado: "Aprob…" })]);
    expect(linea).toContain("|Aprob?|");
  });
  it("un texto sin la marca no es un analítico sintético", () => {
    expect(leerLineasSinteticas("FILA|AM1|Análisis|Aprobado|8||")).toBeNull();
  });
});

describe("interpretar: sin datos no es cero", () => {
  it("una nota ilegible es null, no 0; y un 0 legible es 0", () => {
    expect(interpretarNota("?")).toBeNull();
    expect(interpretarNota("")).toBeNull();
    expect(interpretarNota("0")).toBe(0);
    expect(interpretarNota("7,50")).toBe(7.5);
    expect(interpretarNota("11")).toBeNull();
  });
  it("un estado que no se reconoce es UNKNOWN, no desaprobado", () => {
    expect(interpretarEstado("Aprob…")).toBe("UNKNOWN");
    expect(interpretarEstado("Aprob.")).toBe("UNKNOWN");
    expect(interpretarEstado(null)).toBe("UNKNOWN");
    expect(interpretarEstado("Promocionado")).toBe("PROMOTED");
    expect(interpretarEstado("Libre")).toBe("FAILED");
    expect(interpretarEstado("Ausente")).toBe("ABSENT");
    expect(interpretarEstado("Por equivalencia")).toBe("EQUIVALENCE");
    expect(interpretarEstado("Desaprobado")).toBe("FAILED");
    expect(interpretarEstado("Equivalencia")).toBe("EQUIVALENCE");
  });
  it("una fecha imposible no se completa", () => {
    expect(interpretarFecha("31/02/2024")).toBeNull();
    expect(interpretarFecha("12/07/2024")).toBe("2024-07-12");
    expect(interpretarFecha("julio 2024")).toBeNull();
  });
});

describe("ADR-106 §7 · el vínculo es sólo con el plan del estudiante", () => {
  it("código exacto y único: automático", () => {
    expect(vincular(fila({ codigo: "am1", nombre: "cualquier nombre" }), PLAN)).toEqual({ requisitoId: "r-am1", regla: "CODE", confianza: 1, revision: "AUTO" });
  });
  it("nombre normalizado exacto y único: automático, sin tildes ni mayúsculas que lo impidan", () => {
    expect(vincular(fila({ nombre: "Análisis  Matemático II" }), PLAN)).toMatchObject({ requisitoId: "r-am2", regla: "NAME_EXACT", revision: "AUTO" });
  });
  it("un parecido NO es un vínculo: Análisis I no se confunde con Análisis II", () => {
    expect(vincular(fila({ nombre: "Análisis Matemático" }), PLAN)).toMatchObject({ requisitoId: null, revision: "NEEDS_REVIEW" });
  });
  it("un nombre del plan cortado en la fuente no se completa: va a revisión", () => {
    const v = vincular(fila({ nombre: "Administración de Proyectos de Software" }), PLAN);
    expect(v).toMatchObject({ requisitoId: null, regla: "NONE", revision: "NEEDS_REVIEW" });
    expect(candidatos(fila({ nombre: "ADMINISTR. PROY. DE SOFTWARE II" }), PLAN).map((c) => c.requisitoId)).toContain("r-adm");
  });
  it("una materia de otro plan no se vincula con nada", () => {
    expect(vincular(fila({ nombre: "Materia de otro plan SYN", codigo: "SYN-X" }), PLAN)).toMatchObject({ requisitoId: null, revision: "NEEDS_REVIEW" });
  });
  it("vinculada pero con el estado ilegible, también se revisa", () => {
    expect(vincular(fila({ codigo: "AM1", estado: "Aprob…" }), PLAN)).toMatchObject({ requisitoId: "r-am1", revision: "NEEDS_REVIEW" });
  });
});

describe("resumen y revisión", () => {
  it("cuenta aprobadas, regularizadas, vinculadas y a revisar", () => {
    expect(
      resumenDelAnalitico([
        { estado: "APPROVED", revision: "AUTO" },
        { estado: "PROMOTED", revision: "CONFIRMED" },
        { estado: "REGULARIZED", revision: "NEEDS_REVIEW" },
        { estado: "FAILED", revision: "NOT_IN_PLAN" },
      ]),
    ).toEqual({ resultados: 4, aprobadas: 2, regularizadas: 1, vinculadas: 2, aRevisar: 1 });
  });
  it("«no estoy seguro» y «no es de mi plan» no llevan materia; una corrección cambia algo", () => {
    expect(motivoDeRevisionInvalida("UNSURE", "r-am1", null)).not.toBeNull();
    expect(motivoDeRevisionInvalida("CORRECTED", null, null)).not.toBeNull();
    expect(motivoDeRevisionInvalida("CONFIRMED", "r-am1", "INVENTADO")).not.toBeNull();
    expect(motivoDeRevisionInvalida("NOT_IN_PLAN", null, null)).toBeNull();
  });
});

describe("el Service del analítico", () => {
  function mundo(consentimiento: "GRANTED" | "WITHDRAWN" | null = "GRANTED") {
    const llamadas: string[] = [];
    const eventos: { nombre: string; payload?: Record<string, unknown> }[] = [];
    const recorrido: RecorridoLeido = {
      consentimiento: consentimiento ? { decision: consentimiento, version: "v", en: "2026-09-14" } : null,
      ultimoFallido: null,
      documentosAnteriores: 0,
      documento: null,
      requisitos: PLAN.map((r) => ({ ...r, anio: 1 })),
    };
    const repo: RepositorioDelAnalitico = {
      async recorrido() { return recorrido; },
      async registrarConsentimiento(_i, _s, d) { llamadas.push(`consentimiento:${d}`); },
      async subirArchivo(clave) { llamadas.push(`subir:${clave}`); },
      async borrarArchivos(claves) { llamadas.push(`borrarArchivos:${claves.length}`); },
      async registrar(_i, _s, doc, filas) {
        llamadas.push(`registrar:${doc.estado}:${filas.length}:${doc.clave ? "con-archivo" : "sin-archivo"}`);
        return { documentoId: "doc-1", repetido: false };
      },
      async revisar() {},
      async confirmar() { return true; },
      async clavesDeDocumentos() { llamadas.push("claves"); return ["k1", "k2"]; },
      async borrarDocumentos() { llamadas.push("borrarFilas"); return 2; },
      async borrarPerfil() { llamadas.push("borrarPerfil"); },
    };
    const deps: DependenciasDelAnalitico = {
      repo,
      extractor: {
        version: "DOBLE",
        async extraer(bytes) {
          const filas = leerLineasSinteticas(comoLatin1(bytes));
          return filas ? { estado: "OK", filas } : { estado: "FALLO", motivo: "EXTRACCION_NO_DISPONIBLE" };
        },
      },
      eventos: { async publicar(e) { eventos.push(e); } },
      sha256: () => "a".repeat(64),
    };
    return { deps, llamadas, eventos };
  }

  const PDF = pdfSintetico(lineasSinteticas([fila({ codigo: "AM1" }), fila({ nombre: "Materia de otro plan SYN", codigo: "SYN-X" })]));

  it("sin consentimiento no extrae, no guarda y no registra nada", async () => {
    const { deps, llamadas } = mundo(null);
    expect(await subirAnalitico(deps, "i", "s", PDF)).toEqual({ estado: "SIN_CONSENTIMIENTO" });
    expect(llamadas).toEqual([]);
  });

  it("un consentimiento retirado cuenta como no dado", async () => {
    const { deps } = mundo("WITHDRAWN");
    expect(await subirAnalitico(deps, "i", "s", PDF)).toEqual({ estado: "SIN_CONSENTIMIENTO" });
  });

  it("un archivo inválido no se guarda ni se registra", async () => {
    const { deps, llamadas } = mundo();
    expect(await subirAnalitico(deps, "i", "s", new TextEncoder().encode("no soy un pdf"))).toEqual({ estado: "ARCHIVO_INVALIDO", motivo: "TIPO_NO_ADMITIDO" });
    expect(llamadas).toEqual([]);
  });

  it("procesado: guarda el objeto ANTES que la fila, y el evento lleva conteos, no contenido", async () => {
    const { deps, llamadas, eventos } = mundo();
    expect(await subirAnalitico(deps, "i", "s", PDF)).toMatchObject({ estado: "PROCESADO" });
    expect(llamadas).toEqual([`subir:i/s/${"a".repeat(64)}`, "registrar:PROCESSED:2:con-archivo"]);
    expect(eventos).toEqual([{ nombre: "AcademicRecordUploaded", institutionId: "i", actorId: null, sujetoTipo: "academic_document", sujetoId: "doc-1", causa: "recorrido:s", payload: { resultado: "PROCESSED", resultados: 2, aRevisar: 1 } }]);
    expect(JSON.stringify(eventos)).not.toMatch(/Análisis|AM1|SYN-X/);
  });

  it("un archivo que no se puede leer registra el fallo SIN guardar el archivo", async () => {
    const { deps, llamadas } = mundo();
    const otro = pdfSintetico(["un PDF cualquiera"]);
    expect(await subirAnalitico(deps, "i", "s", otro)).toMatchObject({ estado: "FALLIDO", motivo: "EXTRACCION_NO_DISPONIBLE" });
    expect(llamadas).toEqual(["registrar:FAILED:0:sin-archivo"]);
  });

  it("borrar: objeto primero, filas después, y retira el consentimiento", async () => {
    const { deps, llamadas, eventos } = mundo();
    expect(await borrarAnalitico(deps, "i", "s")).toEqual({ documentos: 2 });
    expect(llamadas).toEqual(["claves", "borrarArchivos:2", "borrarFilas", "borrarPerfil", "consentimiento:WITHDRAWN"]);
    expect(eventos.map((e) => e.nombre)).toEqual(["AcademicRecordDeleted"]);
  });
});

describe("las ausencias que protege ADR-106", () => {
  const MIGRACION = sinComentariosSql(LEER("supabase/migrations/20261103000000_analitico.sql"));
  const DOMINIO_Y_SERVIDOR = [
    "lib/domain/analitico.ts",
    "lib/server/servicios/analitico.ts",
    "lib/server/repositorios/analitico.ts",
    "lib/server/simulacion/analitico.ts",
    "app/api/recorrido/analitico/route.ts",
  ].map((p) => [p, codigo(LEER(p))] as const);

  it("§2 · nada del analítico crea, preselecciona ni toca una cursada", () => {
    expect(MIGRACION).not.toMatch(/(INSERT INTO|UPDATE|DELETE FROM)\s+course_enrollment\b/);
    for (const [p, src] of DOMINIO_Y_SERVIDOR) expect(src, p).not.toMatch(/course_enrollment|confirmar_mapa_academico|declarar_cursada/);
  });

  it("no escribe progreso, evidencia ni acciones: aprobar hace años no es dominio hoy", () => {
    expect(MIGRACION).not.toMatch(/(INSERT INTO|UPDATE)\s+(topic_progress|progress_entry|evidence|action)\b/);
  });

  it("I9 · todo entra student / unverified, y la base no admite otra cosa", () => {
    expect(MIGRACION).toMatch(/source_type\s+TEXT NOT NULL DEFAULT 'student' CHECK \(source_type = 'student'\)/);
    expect(MIGRACION).toMatch(/verification_status TEXT NOT NULL DEFAULT 'unverified' CHECK \(verification_status = 'unverified'\)/);
  });

  it("§5 · no hay proveedor externo: ningún fetch ni SDK de IA/OCR en el camino del analítico", () => {
    for (const [p, src] of DOMINIO_Y_SERVIDOR) {
      expect(src, p).not.toMatch(/\bfetch\s*\(|\bopenai\b|\banthropic\b|\btesseract\b|\btextract\b|cloud-vision/i);
    }
  });

  it("§4 · el contenido del archivo no va a un log", () => {
    for (const [p, src] of DOMINIO_Y_SERVIDOR) expect(src, p).not.toMatch(/console\.(log|info|warn|error)/);
  });

  it("el consentimiento es append-only: el backend no tiene UPDATE", () => {
    expect(MIGRACION).toMatch(/REVOKE UPDATE ON academic_record_consent FROM service_role/);
  });

  it("el analítico sintético sólo se sirve con MODO_PRUEBA=1", () => {
    const ruta = LEER("app/api/prueba/analitico/route.ts");
    expect(ruta).toMatch(/process\.env\.MODO_PRUEBA !== "1"\) return NextResponse\.json\(\{ error: "No encontrado" \}, \{ status: 404 \}\)/);
  });
});
