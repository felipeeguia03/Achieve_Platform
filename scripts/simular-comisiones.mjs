#!/usr/bin/env node
/**
 * Achieve Platform · comisiones simuladas para probar el cuarto paso del alta —
 * [ADR-105](../docs/decisions.md#adr-105).
 *
 * El catálogo sintético no tiene una sola comisión: todas las ofertas se crean
 * `(course, term, NULL)`. Sin comisiones, `/alta/cursada` sólo puede ofrecer
 * *No sé mi comisión*, *Mi comisión no aparece* y *Esta materia no tiene
 * comisiones*, y la elección de una comisión real **no se puede recorrer**.
 *
 * Este script crea, por cada materia **que ya tiene un horario simulado**, las
 * comisiones `A` y `B` del mismo período, con sus propios bloques.
 *
 * ## Las tres reglas que lo hacen honesto
 *
 * 1. **Sólo donde el horario ya es simulado** (`source_type = 'inference'`).
 *    Una materia con horario publicado por la institución no gana comisiones
 *    inventadas.
 * 2. **Todo bloque que escribe es `inference`.** La pantalla lo rotula como
 *    estimado, igual que las aulas de `simular-aulas.mjs`.
 * 3. **No pisa nada.** Una comisión que ya existe se respeta, y a una que ya
 *    tiene bloques no se le agregan.
 *
 * `A` repite el horario de la materia; `B` lo corre cuatro horas (o las resta si
 * pasaría de las 22: se compara antes de sumar, porque `time + interval` da la
 * vuelta a medianoche). Determinista: la misma corrida da lo mismo.
 *
 * Uso:
 *
 *   node scripts/simular-comisiones.mjs              # simulacro: cuenta, no escribe
 *   node scripts/simular-comisiones.mjs --aplicar
 *
 * ⚠️ **Datos sintéticos.** [ADR-006](../docs/decisions.md#adr-006) sigue sin
 * dictamen: esto no se corre contra una base con personas reales.
 */
import { spawnSync } from "node:child_process";

const CONTENEDOR = "supabase_db_achieve-platform";
const APLICAR = process.argv.includes("--aplicar");

function sql(texto) {
  const r = spawnSync(
    "docker",
    ["exec", "-i", CONTENEDOR, "psql", "-U", "postgres", "-d", "postgres", "-tAX", "-v", "ON_ERROR_STOP=1", "-f", "-"],
    { input: texto, encoding: "utf8" },
  );
  const err = (r.stderr ?? "").trim();
  if (err && r.status !== 0) {
    console.error(`\n   ✗ ${err}\n`);
    process.exit(1);
  }
  return (r.stdout ?? "").trim();
}

// ⚠️ **La regla 1 vive en el WHERE**: sólo ofertas sin comisión cuyo horario es
// entero simulado.
const BASES = `select o.id, o.course_id, o.term
                 from course_offering o
                where o.commission is null
                  and exists (select 1 from class_schedule_block b where b.offering_id = o.id)
                  and not exists (select 1 from class_schedule_block b
                                   where b.offering_id = o.id and b.source_type <> 'inference')`;

const bases = sql(`select count(*) from (${BASES}) x;`);
console.log(`\n→ Comisiones simuladas (ADR-105)`);
console.log(`   ${bases} materias con horario simulado: A y B por cada una`);

if (!APLICAR) {
  console.log(`\n   Simulacro: nada se escribió. Agregá --aplicar.\n`);
  process.exit(0);
}

const escritos = sql(`
with bases as (${BASES}),
nuevas as (
  insert into course_offering (course_id, term, commission)
  select b.course_id, b.term, c.nombre
    from bases b cross join (values ('A'), ('B')) as c(nombre)
  on conflict (course_id, term, commission) do nothing
  returning id, course_id, term, commission
),
bloques as (
  insert into class_schedule_block
    (institution_id, offering_id, day_of_week, start_time, end_time, room, source_type, source_ref)
  select bb.institution_id, n.id, bb.day_of_week,
         case when n.commission = 'A' then bb.start_time
              when bb.end_time <= time '18:00' then bb.start_time + interval '4 hours'
              else bb.start_time - interval '4 hours' end,
         case when n.commission = 'A' then bb.end_time
              when bb.end_time <= time '18:00' then bb.end_time + interval '4 hours'
              else bb.end_time - interval '4 hours' end,
         'Aula ' || (1 + abs(hashtext(n.id::text || bb.id::text)) % 4) || '.' ||
           lpad((1 + abs(hashtext(bb.id::text || n.commission)) % 24)::text, 2, '0'),
         'inference', 'simular-comisiones'
    from nuevas n
    join bases b on b.course_id = n.course_id and b.term = n.term
    join class_schedule_block bb on bb.offering_id = b.id
  returning 1
)
select (select count(*) from nuevas) || ' comisiones · ' || (select count(*) from bloques) || ' bloques';`);

console.log(`\n   ✓ ${escritos} escritos.\n`);
