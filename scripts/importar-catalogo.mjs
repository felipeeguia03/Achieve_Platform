#!/usr/bin/env node
/**
 * Achieve Platform · Etapa B6.14.3 — importación del catálogo curricular.
 *
 * Lee los CSV administrativos de `catalogo/` y los ingiere por
 * `ingerir_plan_de_estudios()`, con `service_role`.
 *
 * **El CSV es una entrada administrativa, no la fuente de verdad en runtime.**
 * Lo que el alta lee es lo que quedó en Postgres. Es lo que el spec §26.2 pone
 * como *"Importación institucional CSV"* y lo que §1176 respalda: *"ninguna
 * integración profunda debe bloquear el primer piloto si CSV/formulario
 * resuelve el caso"*.
 *
 * **Idempotente.** Correrlo dos veces deja las mismas filas: la ingesta es
 * reemplazo por plan, y las claves (`institution_key`, `program_key`,
 * `plan_code`) resuelven a la misma fila.
 *
 * **Publicar es un paso aparte y explícito.** Todo entra `DRAFT`; sólo se
 * publica lo que este script nombra, con su motivo, y la función rechaza
 * publicar un plan que tenga requisitos con `needs_review`.
 *
 * ⚠️ **Datos sintéticos y transcripciones anonimizadas, nada más.**
 * [ADR-006](../docs/decisions.md#adr-006) sigue `PROVISIONAL` y
 * [ADR-053](../docs/decisions.md#adr-053) deja el plan de la UCC en `DRAFT`.
 */
import { createClient } from "@supabase/supabase-js";
import { createHash } from "node:crypto";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const DIRECTORIO = "catalogo";

/**
 * Los planes que se publican, con su motivo. **La lista es explícita a
 * propósito:** publicar no puede ser un efecto secundario de agregar un archivo
 * a una carpeta. Un plan que no está acá queda `DRAFT`, y eso es lo correcto
 * para todo lo que no sea sintético mientras `C01-042` siga abierta.
 */
const SE_PUBLICAN = {
  "SYN-U/SYN-ING-A/SYN-2016": "dataset sintético de autoría propia; no representa a ninguna institución real",
  "SYN-U/SYN-ING-B/SYN-2021": "dataset sintético de autoría propia; carrera sucesora, no se mezcla con SYN-2016",
  "SYN-I2/SYN2-ING/SYN2-2020": "dataset sintético de autoría propia; segunda institución para verificar aislamiento",
};

const COLUMNAS = [
  "institution_key", "institution_name", "academic_unit_key", "academic_unit_name",
  "program_key", "program_name", "plan_code", "plan_valid_from", "plan_valid_to",
  "requirement_ordinal", "subject_code", "subject_name", "requirement_type",
  "curriculum_year", "year_source", "term", "is_annual", "min_options", "max_options",
  "label_truncated", "elective_for", "needs_review", "source_type", "source_reference",
];

const TIPOS = new Set([
  "COURSE", "ELECTIVE_SLOT", "SEMINAR_SLOT", "LANGUAGE_REQUIREMENT",
  "PROFESSIONAL_PRACTICE", "CAPSTONE", "UNKNOWN",
]);

/**
 * Parser de CSV, ~30 líneas y sin dependencia nueva.
 *
 * No se agrega un paquete: `npm audit` está en 0 vulnerabilidades y la versión
 * de `next` la fija un ADR — sumar un árbol de dependencias por un `split` con
 * comillas sería el peor negocio del repositorio. Soporta lo que estos archivos
 * usan: comillas dobles, comas adentro y comillas escapadas por duplicación.
 */
function parsearCsv(texto) {
  const filas = [];
  let campo = "";
  let fila = [];
  let enComillas = false;

  for (let i = 0; i < texto.length; i++) {
    const c = texto[i];
    if (enComillas) {
      if (c === '"') {
        if (texto[i + 1] === '"') { campo += '"'; i++; } else { enComillas = false; }
      } else campo += c;
      continue;
    }
    if (c === '"') { enComillas = true; continue; }
    if (c === ",") { fila.push(campo); campo = ""; continue; }
    if (c === "\n") { fila.push(campo); filas.push(fila); fila = []; campo = ""; continue; }
    if (c === "\r") continue;
    campo += c;
  }
  if (campo.length > 0 || fila.length > 0) { fila.push(campo); filas.push(fila); }
  return filas.filter((f) => f.some((v) => v.trim().length > 0));
}

/** `""` es "la fuente no lo declara", que no es lo mismo que un string vacío. */
const vacioEsNull = (v) => (v === undefined || v.trim() === "" ? null : v.trim());
const booleano = (v) => {
  const s = vacioEsNull(v);
  return s === null ? null : s.toLowerCase() === "true";
};

function entorno() {
  const vars = {};
  try {
    for (const linea of readFileSync(".env.local", "utf8").split("\n")) {
      const limpia = linea.trim();
      if (!limpia || limpia.startsWith("#")) continue;
      const corte = limpia.indexOf("=");
      if (corte > 0) vars[limpia.slice(0, corte)] = limpia.slice(corte + 1);
    }
  } catch {
    console.error("✗ No se pudo leer .env.local. Copialo de .env.local.example");
    process.exit(1);
  }
  return vars;
}

const env = entorno();
const url = env.NEXT_PUBLIC_SUPABASE_URL;
const servicio = env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !servicio) {
  console.error("✗ Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en .env.local");
  process.exit(1);
}
const admin = createClient(url, servicio, { auth: { persistSession: false } });

const archivos = readdirSync(DIRECTORIO).filter((f) => f.endsWith(".csv")).sort();
if (archivos.length === 0) {
  console.error(`✗ No hay CSV en ${DIRECTORIO}/`);
  process.exit(1);
}

let planesTotales = 0;
let requisitosTotales = 0;

for (const archivo of archivos) {
  const crudo = readFileSync(join(DIRECTORIO, archivo), "utf8");
  const filas = parsearCsv(crudo);
  const encabezado = filas[0].map((c) => c.trim());

  const faltantes = COLUMNAS.filter((c) => !encabezado.includes(c));
  if (faltantes.length > 0) {
    console.error(`✗ ${archivo}: faltan columnas: ${faltantes.join(", ")}`);
    process.exit(1);
  }
  const col = (fila, nombre) => fila[encabezado.indexOf(nombre)];

  // Un archivo puede traer varios planes. Se agrupan por su clave natural.
  const planes = new Map();
  for (const fila of filas.slice(1)) {
    const clave = [col(fila, "institution_key"), col(fila, "program_key"), col(fila, "plan_code")].join("/");
    if (!planes.has(clave)) planes.set(clave, { cabecera: fila, requisitos: [] });

    const tipo = vacioEsNull(col(fila, "requirement_type")) ?? "UNKNOWN";
    if (!TIPOS.has(tipo)) {
      console.error(`✗ ${archivo} · fila ${col(fila, "requirement_ordinal")}: tipo desconocido "${tipo}"`);
      process.exit(1);
    }

    planes.get(clave).requisitos.push({
      ordinal: Number(col(fila, "requirement_ordinal")),
      code: vacioEsNull(col(fila, "subject_code")),
      label: vacioEsNull(col(fila, "subject_name")),
      requirement_type: tipo,
      curriculum_year: vacioEsNull(col(fila, "curriculum_year")),
      year_source: vacioEsNull(col(fila, "year_source")),
      term: vacioEsNull(col(fila, "term")),
      is_annual: booleano(col(fila, "is_annual")),
      min_options: vacioEsNull(col(fila, "min_options")),
      max_options: vacioEsNull(col(fila, "max_options")),
      label_truncated: booleano(col(fila, "label_truncated")) ?? false,
      // El código del cupo que esta materia puede satisfacer. Vacío = ninguno.
      elective_for: vacioEsNull(col(fila, "elective_for")),
      needs_review: booleano(col(fila, "needs_review")) ?? true,
    });
  }

  for (const [clave, { cabecera, requisitos }] of planes) {
    // El hash es del contenido del plan, no del archivo: dos archivos con el
    // mismo plan tienen que dar el mismo hash (spec §6.2, paso 8).
    const hash = createHash("sha256")
      .update(JSON.stringify(requisitos.slice().sort((a, b) => a.ordinal - b.ordinal)))
      .digest("hex")
      .slice(0, 16);

    const { data, error } = await admin.rpc("ingerir_plan_de_estudios", {
      p_institution_key: col(cabecera, "institution_key"),
      p_institution_name: col(cabecera, "institution_name"),
      p_academic_unit_key: vacioEsNull(col(cabecera, "academic_unit_key")),
      p_academic_unit_name: vacioEsNull(col(cabecera, "academic_unit_name")),
      p_program_key: col(cabecera, "program_key"),
      p_program_name: col(cabecera, "program_name"),
      p_plan_version: col(cabecera, "plan_code"),
      p_plan_valid_from: vacioEsNull(col(cabecera, "plan_valid_from")),
      p_plan_valid_until: vacioEsNull(col(cabecera, "plan_valid_to")),
      p_source_type: col(cabecera, "source_type"),
      p_source_ref: col(cabecera, "source_reference"),
      p_observed_at: new Date().toISOString(),
      p_confidence: col(cabecera, "source_type") === "institution" ? 1 : 0.3,
      p_content_hash: hash,
      p_requisitos: requisitos,
    });

    if (error) {
      console.error(`✗ ${archivo} · ${clave}: ${error.message}`);
      process.exit(1);
    }
    const [{ plan_id: planId, requisitos: n, materias: m, opciones: o }] = data;
    planesTotales++;
    requisitosTotales += n;

    const motivo = SE_PUBLICAN[clave];
    let estado = "DRAFT";
    if (motivo) {
      const { error: falloPublicar } = await admin.rpc("publicar_plan_de_estudios", {
        p_plan_id: planId,
        p_motivo: motivo,
      });
      if (falloPublicar) {
        console.error(`✗ ${clave}: no se pudo publicar — ${falloPublicar.message}`);
        process.exit(1);
      }
      estado = "PUBLISHED";
    }

    // `n` y `m` no son el mismo número, y ése es el punto de ADR-051.
    console.log(
      `   ${clave.padEnd(26)} ${String(n).padStart(3)} requisitos · ${String(m).padStart(3)} materias · ` +
        `${String(o).padStart(2)} opciones · ${estado}`,
    );
  }
}

console.log(`✓ ${planesTotales} planes, ${requisitosTotales} requisitos`);
console.log("   Los planes que no figuran arriba como PUBLISHED quedan DRAFT y no se le ofrecen a nadie.");
