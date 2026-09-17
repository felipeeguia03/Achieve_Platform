#!/usr/bin/env node
/**
 * Achieve Platform · aulas simuladas para los horarios simulados —
 * [ADR-094](../docs/decisions.md#adr-094).
 *
 * El owner pidió el aula en el cuadro de Hoy: *"como no están, simulalas"*.
 * Ningún programa de asignatura trae aula, y los horarios de las materias del
 * Plan 2016 ya son simulados (`scripts/simular-temarios.mjs` los escribe con
 * `source_type = 'inference'`). Este script les pone un aula **a esos, y a
 * ningún otro**.
 *
 * ## Las dos reglas que lo hacen honesto
 *
 * 1. **Sólo bloques `inference`.** El aula no tiene procedencia propia: hereda
 *    la del bloque. Escribir un aula inventada en un horario que publicó la
 *    institución la haría pasar por dato de la facultad.
 * 2. **No pisa un aula que ya existe.** Si alguien la cargó, se respeta. Con
 *    `--rehacer` se recalculan las simuladas, y sólo ésas.
 *
 * ## Determinismo
 *
 * El aula sale de un hash del id del bloque: la misma corrida da las mismas
 * aulas, y dos bloques de la misma materia pueden caer en aulas distintas, como
 * pasa en una facultad.
 *
 * Uso:
 *
 *   node scripts/simular-aulas.mjs              # simulacro: cuenta, no escribe
 *   node scripts/simular-aulas.mjs --aplicar
 *   node scripts/simular-aulas.mjs --aplicar --rehacer
 *
 * ⚠️ **Datos sintéticos.** [ADR-006](../docs/decisions.md#adr-006) sigue sin
 * dictamen: esto no se corre contra una base con personas reales.
 */
import { spawnSync } from "node:child_process";

const CONTENEDOR = "supabase_db_achieve-platform";
const APLICAR = process.argv.includes("--aplicar");
const REHACER = process.argv.includes("--rehacer");

/** Una consulta, y **su error si lo hubo** — `psql` sale con 0 aunque falle. */
function sql(texto) {
  const r = spawnSync(
    "docker",
    ["exec", "-i", CONTENEDOR, "psql", "-U", "postgres", "-d", "postgres", "-tAX", "-f", "-"],
    { input: texto, encoding: "utf8" },
  );
  const err = (r.stderr ?? "").trim();
  if (err) {
    console.error(`\n   ✗ ${err}\n`);
    process.exit(1);
  }
  return (r.stdout ?? "").trim();
}

// Piso 1 a 4, aula 01 a 24: «Aula 3.12».
const AULA = `'Aula ' || (1 + abs(hashtext(b.id::text)) % 4) || '.' ||
              lpad((1 + abs(hashtext(b.id::text || ':aula')) % 24)::text, 2, '0')`;

// ⚠️ **La regla 1 vive en el WHERE, no en un `if` de JavaScript**: así no hay
// forma de que una fila `institution` pase por acá.
const SOLO_SIMULADOS = `b.source_type = 'inference'`;
const CUALES = REHACER ? SOLO_SIMULADOS : `${SOLO_SIMULADOS} AND b.room IS NULL`;

const pendientes = sql(`select count(*) from class_schedule_block b where ${CUALES};`);
const ajenos = sql(`select count(*) from class_schedule_block b where b.source_type <> 'inference';`);

console.log(`\n→ Aulas simuladas (ADR-094)`);
console.log(`   ${pendientes} bloques simulados ${REHACER ? "a recalcular" : "sin aula"}`);
console.log(`   ${ajenos} bloques con otra procedencia: no se tocan`);

if (!APLICAR) {
  console.log(`\n   Simulacro: nada se escribió. Agregá --aplicar.\n`);
  process.exit(0);
}

const escritos = sql(`with u as (
  update class_schedule_block b set room = ${AULA} where ${CUALES} returning 1
) select count(*) from u;`);

console.log(`\n   ✓ ${escritos} aulas escritas.\n`);
