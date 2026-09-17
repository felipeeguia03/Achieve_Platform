#!/usr/bin/env node
/**
 * Achieve Platform · Gimnasia cognitiva — siembra **sintética** para la demo.
 *
 * [ADR-102](../docs/decisions.md#adr-102) §8.
 *
 * ## Qué carga
 *
 * 1. **Preguntas de ejemplo de Recuerdo real**, todas `DRAFT`, con `code` `SYN-GIM-…`
 *    y `source_type = 'inference'`: las escribió el equipo para la demo, **no son
 *    de ninguna cátedra**. Se ven sólo con `MODO_PRUEBA=1`, y la pantalla lo dice.
 *    - Generales (`course_id NULL`): sobre método de estudio, para cualquier carrera.
 *    - De las materias **sintéticas** de la institución del estudiante sintético.
 * 2. Con `--historial`, **partidas pasadas** del estudiante sintético, para ver la
 *    pantalla con progreso (primera visita ≠ estudiante con historia).
 *
 * ## Lo que NO hace
 *
 * ⚠️ **No publica nada**, y no hay bandera para hacerlo: publicar una pregunta es
 * de quien tenga autoridad sobre ese contenido. **No toca la cuenta de la UCC**:
 * sus materias son de un plan real y no reciben preguntas inventadas.
 *
 * Uso:
 *   node scripts/sembrar-gimnasia.mjs                 # simulacro
 *   node scripts/sembrar-gimnasia.mjs --aplicar
 *   node scripts/sembrar-gimnasia.mjs --aplicar --historial
 */
import { spawnSync } from "node:child_process";

const CONTENEDOR = "supabase_db_achieve-platform";
const APLICAR = process.argv.includes("--aplicar");
const HISTORIAL = process.argv.includes("--historial");
const ESTUDIANTE = "a5000000-0000-0000-0000-000000000001"; // estudiante.sintetico@achieve.local
const FUENTE = "SYN-GIMNASIA v0.1 · preguntas sintéticas de ejemplo para la demo, escritas por el equipo";

function sql(texto) {
  const r = spawnSync("docker", ["exec", "-i", CONTENEDOR, "psql", "-U", "postgres", "-d", "postgres", "-tAX", "-v", "ON_ERROR_STOP=1", "-f", "-"], {
    input: texto,
    encoding: "utf8",
  });
  if (r.status !== 0) throw new Error((r.stderr ?? "").trim() || "psql falló");
  return (r.stdout ?? "").trim();
}

const lit = (s) => (s === null ? "NULL" : `'${String(s).replace(/'/g, "''")}'`);
const arr = (xs) => (xs === null ? "NULL" : `ARRAY[${xs.map(lit).join(",")}]::TEXT[]`);
const opciones = (xs) => (xs === null ? "NULL" : `${lit(JSON.stringify(xs.map(([id, text]) => ({ id, text }))))}::jsonb`);

/** `[code, materia|null, tipo, pregunta, aceptadas|null, opciones|null, canónica, explicación|null]` */
const PREGUNTAS = [
  // ── Generales: método, para cualquier carrera ─────────────────────────────
  ["SYN-GIM-G01", null, "SELF_ASSESSED", "Explicá con tus palabras qué es la recuperación activa.", null, null,
    "Intentar traer a la memoria lo estudiado sin mirar el material, en lugar de releerlo.",
    "Pregunta sintética de ejemplo."],
  ["SYN-GIM-G02", null, "TRUE_FALSE", "Releer un texto varias veces es la forma más eficaz de recordarlo a largo plazo.", ["false"], null,
    "Falso.", "Recordar sin mirar suele fijar más que releer. Pregunta sintética de ejemplo."],
  ["SYN-GIM-G03", null, "MULTIPLE_CHOICE", "¿Qué hace el repaso espaciado?", ["b"],
    [["a", "Repasa todo el mismo día, muchas veces"], ["b", "Distribuye los repasos en días cada vez más separados"], ["c", "Repasa sólo lo que ya sabés"]],
    "Distribuye los repasos en días cada vez más separados.", "Pregunta sintética de ejemplo."],
  ["SYN-GIM-G04", null, "SHORT_ANSWER", "¿Cómo se llama repasar sin mirar el material para comprobar qué recordás?", ["recuperación activa", "recuerdo activo"], null,
    "Recuperación activa.", "Pregunta sintética de ejemplo."],

  // ── Materias sintéticas de la demo ────────────────────────────────────────
  ["SYN-GIM-BD1", "Bases de Datos", "SHORT_ANSWER", "¿Qué sentencia SQL se usa para leer filas de una tabla?", ["select"], null,
    "SELECT.", "Pregunta sintética de ejemplo."],
  ["SYN-GIM-BD2", "Bases de Datos", "MULTIPLE_CHOICE", "¿Qué garantiza una clave primaria?", ["a"],
    [["a", "Que cada fila se identifique de forma única"], ["b", "Que la tabla esté ordenada"], ["c", "Que no haya columnas vacías"]],
    "Que cada fila se identifique de forma única.", "Pregunta sintética de ejemplo."],
  ["SYN-GIM-BD3", "Bases de Datos", "SELF_ASSESSED", "Explicá la diferencia entre una clave primaria y una clave foránea.", null, null,
    "La primaria identifica cada fila de su tabla; la foránea referencia la clave de otra tabla y relaciona las dos.",
    "Pregunta sintética de ejemplo."],
  ["SYN-GIM-CA1", "Cálculo Avanzado", "SHORT_ANSWER", "¿Cuál es la derivada de x²?", ["2x", "2*x", "2 x"], null,
    "2x.", "Pregunta sintética de ejemplo."],
  ["SYN-GIM-CA2", "Cálculo Avanzado", "TRUE_FALSE", "Toda función continua en un punto es derivable en ese punto.", ["false"], null,
    "Falso.", "|x| es continua en 0 y no es derivable ahí. Pregunta sintética de ejemplo."],
  ["SYN-GIM-AL1", "Álgebra Sintética", "SHORT_ANSWER", "¿Cuánto vale el determinante de la matriz identidad de 2×2?", ["1", "uno"], null,
    "1.", "Pregunta sintética de ejemplo."],
  ["SYN-GIM-AL2", "Álgebra Sintética", "SELF_ASSESSED", "¿Qué significa que un conjunto de vectores sea linealmente independiente?", null, null,
    "Que ninguno se puede escribir como combinación lineal de los otros.", "Pregunta sintética de ejemplo."],
  ["SYN-GIM-FI1", "Física Sintética", "MULTIPLE_CHOICE", "En el Sistema Internacional, ¿en qué unidad se mide la fuerza?", ["c"],
    [["a", "Joule"], ["b", "Watt"], ["c", "Newton"]], "Newton.", "Pregunta sintética de ejemplo."],
  ["SYN-GIM-FI2", "Física Sintética", "SHORT_ANSWER", "Completá la segunda ley de Newton: F = m · …", ["a", "aceleración", "aceleracion"], null,
    "a (la aceleración).", "Pregunta sintética de ejemplo."],
  ["SYN-GIM-AS1", "Arquitectura de Software", "SELF_ASSESSED", "Nombrá dos ventajas de separar una aplicación en capas.", null, null,
    "Por ejemplo: cada capa se cambia sin romper las otras, y cada una se prueba por separado.",
    "Pregunta sintética de ejemplo."],
  ["SYN-GIM-AS2", "Arquitectura de Software", "TRUE_FALSE", "En una arquitectura en capas, la interfaz debería leer la base de datos directamente.", ["false"], null,
    "Falso.", "La interfaz habla con la capa de servicios, no con la base. Pregunta sintética de ejemplo."],
  ["SYN-GIM-IA1", "Inteligencia Artificial", "MULTIPLE_CHOICE", "¿Qué tipo de aprendizaje usa ejemplos con la respuesta correcta ya etiquetada?", ["a"],
    [["a", "Supervisado"], ["b", "No supervisado"], ["c", "Por refuerzo"]], "Supervisado.", "Pregunta sintética de ejemplo."],
  ["SYN-GIM-IA2", "Inteligencia Artificial", "SHORT_ANSWER", "¿Cómo se llama el error de un modelo que memoriza los datos de entrenamiento y generaliza mal?", ["sobreajuste", "overfitting"], null,
    "Sobreajuste (overfitting).", "Pregunta sintética de ejemplo."],
];

function sentencias(institucion) {
  return PREGUNTAS.map(([code, materia, tipo, pregunta, aceptadas, ops, canonica, explicacion]) => {
    const curso = materia === null
      ? "NULL"
      : `(SELECT c.id FROM course c JOIN course_offering o ON o.course_id = c.id JOIN course_enrollment ce ON ce.offering_id = o.id
          WHERE ce.student_id = '${ESTUDIANTE}' AND ce.institution_id = '${institucion}' AND c.name = ${lit(materia)} LIMIT 1)`;
    return `INSERT INTO recall_item (code, course_id, prompt, answer_type, options, accepted_answers, canonical_answer, explanation, source_type, source_ref)
      SELECT ${lit(code)}, ${curso}, ${lit(pregunta)}, ${lit(tipo)}, ${opciones(ops)}, ${arr(aceptadas)}, ${lit(canonica)}, ${lit(explicacion)}, 'inference', ${lit(FUENTE)}
      WHERE ${materia === null ? "TRUE" : `${curso} IS NOT NULL`}
      ON CONFLICT (code) DO UPDATE SET prompt = EXCLUDED.prompt, options = EXCLUDED.options, accepted_answers = EXCLUDED.accepted_answers,
        canonical_answer = EXCLUDED.canonical_answer, explanation = EXCLUDED.explanation, course_id = EXCLUDED.course_id;`;
  }).join("\n");
}

/** Partidas pasadas: dos rutinas completas y una cuadrícula suelta, con resultados coherentes con las reglas. */
function historial(institucion) {
  const s = (id, dias, origen, juegos) =>
    `INSERT INTO gym_session (id, institution_id, student_id, origin, planned_games, status, started_at, ended_at, idempotency_key)
     VALUES ('${id}', '${institucion}', '${ESTUDIANTE}', '${origen}', ${arr(juegos)}, 'COMPLETED', now() - interval '${dias} days' - interval '10 minutes', now() - interval '${dias} days', 'SYN-HIST-${id.slice(-2)}')
     ON CONFLICT DO NOTHING;`;
  const grilla = (id, sesion, dias, score, span, aciertos, errores) =>
    `INSERT INTO gym_attempt (id, institution_id, student_id, gym_session_id, game, rules_version, status, started_at, completed_at, seed, start_length, idempotency_key, rounds, correct_count, error_count, max_span, score, personal_best)
     VALUES ('${id}', '${institucion}', '${ESTUDIANTE}', '${sesion}', 'FLASH_GRID', 'CF-1', 'COMPLETED', now() - interval '${dias} days' - interval '9 minutes', now() - interval '${dias} days' - interval '6 minutes', 11, 3, 'SYN-HIST-${id.slice(-2)}', ${aciertos + errores}, ${aciertos}, ${errores}, ${span}, ${score}, false)
     ON CONFLICT DO NOTHING;`;
  const cadena = (id, sesion, dias, nivelAntes, nivel, span, aciertos) =>
    `INSERT INTO gym_attempt (id, institution_id, student_id, gym_session_id, game, rules_version, status, started_at, completed_at, seed, start_length, idempotency_key, rounds, correct_count, error_count, max_span, max_attempted_span, level_before, level_after, personal_best)
     VALUES ('${id}', '${institucion}', '${ESTUDIANTE}', '${sesion}', 'REVERSE_CHAIN', 'CI-1', 'COMPLETED', now() - interval '${dias} days' - interval '5 minutes', now() - interval '${dias} days' - interval '2 minutes', 13, ${nivelAntes === null ? 3 : nivelAntes + 2}, 'SYN-HIST-${id.slice(-2)}', 5, ${aciertos}, ${5 - aciertos}, ${span}, ${span + 1}, ${nivelAntes === null ? "NULL" : nivelAntes}, ${nivel}, false)
     ON CONFLICT DO NOTHING;`;
  return [
    s("e1000000-0000-0000-0000-000000000001", 3, "ROUTINE", ["FLASH_GRID", "REVERSE_CHAIN"]),
    grilla("e2000000-0000-0000-0000-000000000001", "e1000000-0000-0000-0000-000000000001", 3, 1325, 5, 4, 2),
    cadena("e2000000-0000-0000-0000-000000000002", "e1000000-0000-0000-0000-000000000001", 3, null, 2, 4, 3),
    s("e1000000-0000-0000-0000-000000000002", 1, "ROUTINE", ["FLASH_GRID", "REVERSE_CHAIN"]),
    grilla("e2000000-0000-0000-0000-000000000003", "e1000000-0000-0000-0000-000000000002", 1, 1850, 6, 5, 2),
    cadena("e2000000-0000-0000-0000-000000000004", "e1000000-0000-0000-0000-000000000002", 1, 2, 3, 5, 4),
  ].join("\n");
}

const institucion = sql(`SELECT institution_id FROM student WHERE id = '${ESTUDIANTE}';`);
if (!institucion) {
  console.error("✗ no existe el estudiante sintético: corré primero `npm run db:demo`.");
  process.exit(1);
}

const cuerpo = `BEGIN;\n${sentencias(institucion)}\n${HISTORIAL ? historial(institucion) : ""}\nCOMMIT;`;
if (!APLICAR) {
  console.log(`Simulacro: ${PREGUNTAS.length} preguntas sintéticas${HISTORIAL ? " y partidas pasadas" : ""}. Nada escrito. Agregá --aplicar.`);
  process.exit(0);
}
sql(cuerpo);
const cuenta = sql(`SELECT count(*) || ' preguntas (' || count(course_id) || ' de materias) · ' || count(*) FILTER (WHERE publication_status = 'PUBLISHED') || ' publicadas' FROM recall_item WHERE code LIKE 'SYN-GIM-%';`);
console.log(`✓ ${cuenta}${HISTORIAL ? " · con historial" : ""}`);
