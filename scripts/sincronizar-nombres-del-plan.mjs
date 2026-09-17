#!/usr/bin/env node
/**
 * Achieve Platform · sincroniza **los nombres** de un plan ya ingerido.
 *
 * ## Por qué existe, que es toda la justificación
 *
 * ⚠️ **`ingerir_plan()` no se puede volver a correr sobre un plan que alguien ya
 * usó en el alta.** Reemplaza los requisitos con un `DELETE` + `INSERT` —*"
 * reemplazo, no acumulación"*— y en cuanto un estudiante declaró su mapa
 * académico hay filas de `requirement_declaration` apuntando a esos requisitos.
 * El `DELETE` choca contra la foreign key y el importador aborta **el archivo
 * entero**.
 *
 * Así que corregir el nombre de una materia en el CSV —que es su fuente— arregla
 * toda base nueva y **no alcanza a la que está corriendo**. Esto cierra esa
 * brecha, y nada más.
 *
 * ## Lo que hace, y es deliberadamente poco
 *
 * Lee los CSV de `catalogo/` y, donde el nombre de la base no coincide con el
 * del CSV, **actualiza el nombre**. Tres columnas y ninguna más:
 * `curriculum_requirement.label`, `curriculum_requirement.label_truncated` y
 * `course.name`.
 *
 * ⚠️ **No inserta, no borra y no toca la procedencia.** No escribe
 * `source_type`, no escribe `source_ref` y **no toca `verification_status`** —
 * que tiene una sola escritura autorizada en todo el repositorio,
 * `corroborar_procedencia()`, y no es ésta (invariante `I9`). Tampoco toca
 * `needs_review`: corregir un nombre no es auditar la fila.
 *
 * ⚠️ **Y no es un atajo para "limpiar" nombres cortados.** Sólo propaga lo que
 * ya está decidido y versionado en el CSV. Si un nombre está cortado en el CSV,
 * acá sigue cortado.
 *
 * Uso:
 *   node scripts/sincronizar-nombres-del-plan.mjs              # simulacro
 *   node scripts/sincronizar-nombres-del-plan.mjs --aplicar
 */
import { readdirSync, readFileSync } from "node:fs";
import { parsearCsv } from "./lib/csv.mjs";
import { spawnSync } from "node:child_process";
import { join } from "node:path";

const CONTENEDOR = "supabase_db_achieve-platform";
const DIRECTORIO = "catalogo";
const APLICAR = process.argv.includes("--aplicar");

function sql(consulta) {
  const r = spawnSync("docker", ["exec", "-i", CONTENEDOR, "psql", "-U", "postgres", "-d",
    "postgres", "-tAc", consulta], { encoding: "utf8" });
  if (r.status !== 0) {
    console.error(`✗ ${(r.stderr || "").trim()}`);
    process.exit(1);
  }
  return (r.stdout || "").trim();
}

/** Literal SQL. Comilla simple duplicada: es la única forma de escapar en SQL. */
const lit = (v) => `'${String(v).replace(/'/g, "''")}'`;

/**
 * Las filas de un CSV, como objetos.
 *
 * ⚠️ **El parser es el del importador, no uno propio.** La primera versión de
 * este script traía su `split(",")` y reventó en la fila 29 de
 * `ucc-ingenieria-en-informatica.csv`, donde un `year_source` lleva una coma
 * adentro —y la fila 70 lleva un título entero entre comillas—. Dos lectores del
 * mismo formato es un lector bueno y uno que se entera tarde.
 */
function filasDe(texto) {
  const [cabecera, ...resto] = parsearCsv(texto);
  return resto.map((campos) =>
    Object.fromEntries(cabecera.map((c, j) => [c.trim(), campos[j] ?? ""])),
  );
}

let revisadas = 0;
const cambios = [];

for (const archivo of readdirSync(DIRECTORIO).filter((f) => f.endsWith(".csv")).sort()) {
  const filas = filasDe(readFileSync(join(DIRECTORIO, archivo), "utf8"));
  for (const f of filas) {
    if (f.requirement_type !== "COURSE" || !f.subject_code) continue;
    revisadas += 1;

    const actual = sql(`
      select cr.id || '|' || cr.label || '|' || cr.label_truncated::text
        from curriculum_requirement cr
        join curriculum_plan cp on cp.id = cr.curriculum_plan_id
        join academic_program p on p.id = cp.program_id
        join institution i on i.id = p.institution_id
       where i.key = ${lit(f.institution_key)}
         and p.key = ${lit(f.program_key)}
         and cp.version = ${lit(f.plan_code)}
         and cr.code = ${lit(f.subject_code)};`);
    if (actual === "") continue;

    const [id, label, truncado] = actual.split("|");
    const cortadoCsv = String(f.label_truncated).trim().toLowerCase() === "true";
    /*
      ⚠️ **`::text` sobre un booleano devuelve `true`, no `t`.** La `t` es cómo
      `psql` **imprime** una columna booleana, no cómo la castea. Comparando
      contra `"t"` este script marcaba como distintas **cuatro filas idénticas**,
      y con `--aplicar` las habría reescrito con su mismo valor: un cambio que no
      cambia nada es ruido en el diff, y esconde el que sí importa.
    */
    const cortadoBase = truncado === "true";
    if (label === f.subject_name && cortadoBase === cortadoCsv) continue;

    cambios.push({ archivo, code: f.subject_code, de: label, a: f.subject_name, id, cortadoCsv });
  }
}

console.log(`\n→ ${revisadas} materias revisadas contra ${DIRECTORIO}/`);
if (cambios.length === 0) {
  console.log("   Todo coincide: no hay nada que sincronizar.\n");
  process.exit(0);
}

for (const c of cambios) console.log(`   ${c.code}  «${c.de}» → «${c.a}»`);

if (!APLICAR) {
  console.log(`\n   Simulacro: nada se escribió. Agregá --aplicar.\n`);
  process.exit(0);
}

for (const c of cambios) {
  sql(`update curriculum_requirement
          set label = ${lit(c.a)}, label_truncated = ${c.cortadoCsv}
        where id = ${lit(c.id)};`);
  /*
    El `course` cuelga del requisito por `(plan, code)` y **se actualiza en el
    mismo paso**: si sólo cambiara el requisito, el índice y las ventanas
    seguirían mostrando el nombre viejo, que es el que el estudiante ve.
  */
  sql(`update course
          set name = ${lit(c.a)}
        where id = (select course_id from curriculum_requirement where id = ${lit(c.id)});`);
}

console.log(`\n✓ ${cambios.length} nombres sincronizados.\n`);
