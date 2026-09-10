#!/usr/bin/env node
/**
 * Achieve Platform · Fase B6.25 — carga el contenido de Formación.
 *
 * [ADR-087](../docs/decisions.md#adr-087). Lee
 * `docs/formacion-prioridad-maxima-source.md` —la transcripción **literal** de
 * la psicopedagoga— y carga las cinco piezas en `formative_content`.
 *
 * ## Por qué parsea la fuente en vez de traer el texto adentro
 *
 * Si el contenido viviera en dos lados **se desincronizan**, y el que queda mal
 * es el que nadie mira. La fuente es el documento; esto sólo lo pone en la base.
 * Además así los tipeos llegan **tal cual**, que es lo que ADR-031 exige y lo
 * que `tests/formacion-fuente.test.ts` vigila.
 *
 * ## Todo entra DRAFT
 *
 * ⚠️ **Ninguna pieza se publica desde acá, y no hay bandera para hacerlo.**
 * `D5` de ADR-087: el contenido queda fuera de producción hasta que la
 * psicopedagoga confirme su vigencia. Publicar es un acto suyo, no un efecto
 * secundario de correr un script.
 *
 * Uso:
 *   node scripts/cargar-formacion.mjs              # simulacro
 *   node scripts/cargar-formacion.mjs --aplicar
 */
import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { resolve } from "node:path";

const CONTENEDOR = "supabase_db_achieve-platform";
const APLICAR = process.argv.includes("--aplicar");
const FUENTE = "docs/formacion-prioridad-maxima-source.md";

/**
 * Los rótulos de cada parte, con **todas las variantes que usa la autora**.
 *
 * ⚠️ No están unificados a propósito: escribe *"Problema que resuelve"* en tres
 * piezas y *"Problema"* en dos, *"Objetivo del video"* en una y *"Objetivo"* en
 * el resto, y en la quinta deja de usar negrita. **Normalizar la fuente para
 * simplificar el parser sería corregirla.** El parser se adapta; el texto no.
 */
const PARTES = {
  problem: ["Problema que resuelve", "Problema"],
  objective: ["Objetivo del video", "Objetivo"],
  explanation: ["Explicación psicopedagógica"],
  next_action: ["Acción concreta posterior", "Acción posterior"],
  expected_evidence: ["Evidencia"],
  material: ["Material descargable", "Material", "Checklist"],
};

/** Todos los rótulos, para saber dónde termina el valor de uno. */
const TODOS = Object.values(PARTES).flat();

function sql(texto) {
  const r = spawnSync(
    "docker",
    ["exec", "-i", CONTENEDOR, "psql", "-U", "postgres", "-d", "postgres", "-tAX", "-f", "-"],
    { input: texto, encoding: "utf8" },
  );
  const err = (r.stderr ?? "").trim();
  return err ? `${err}\n${(r.stdout ?? "").trim()}`.trim() : (r.stdout ?? "").trim();
}

const unaFila = (t) => t.split("\n")[0].trim();
const lit = (s) => `'${String(s).replace(/'/g, "''")}'`;

/** Sin negritas ni cursivas: los rótulos las usan de forma inconsistente. */
const sinEnfasis = (s) => s.replace(/\*+/g, "");

/** Prosa corrida: el wrap a 100 columnas es del repositorio, no de la autora. */
const corrido = (s) => s.replace(/\s+/g, " ").trim();

function valorDe(bloque, rotulos) {
  for (const rotulo of rotulos) {
    // Hasta el próximo rótulo conocido, o el final de la pieza.
    const otros = TODOS.filter((r) => r !== rotulo)
      .map((r) => r.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
      .join("|");
    // ⚠️ **El final es `$(?![\s\S])`, no `$`.** Con la bandera `m` —que hace
    // falta para que `^` ancle en cada rótulo— `$` matchea **fin de línea**, y
    // el cuantificador perezoso corta en la primera. Medido: los seis campos
    // entraban truncados a su primer renglón y la corrida en simulacro se veía
    // bien, porque evidencia y material caben en una línea.
    const re = new RegExp(
      `^\\s*${rotulo.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*[:.]\\s*([\\s\\S]*?)(?=^\\s*(?:${otros})\\s*[:.]|$(?![\\s\\S]))`,
      "m",
    );
    const m = bloque.match(re);
    if (m && corrido(m[1])) return corrido(m[1]);
  }
  return null;
}

// ── Parseo ───────────────────────────────────────────────────────────────────

const texto = sinEnfasis(readFileSync(resolve(process.cwd(), FUENTE), "utf8"));
const bloques = texto.split(/^### \d+\.\s*/m).slice(1);

const piezas = [];
const fallos = [];

bloques.forEach((bloque, i) => {
  const titulo = corrido(bloque.split("\n")[0]).replace(/^"|"$/g, "");
  const pieza = { code: `F${String(i + 1).padStart(2, "0")}`, title: titulo, sequence: i + 1 };

  for (const [campo, rotulos] of Object.entries(PARTES)) {
    pieza[campo] = valorDe(bloque, rotulos);
  }

  // ⚠️ **Una pieza incompleta no se carga a medias.** Sin acción posterior ni
  // evidencia, Formación vuelve a ser la videoteca pasiva que el §13 prohíbe:
  // es mejor que falte y se vea, a que entre mutilada y nadie lo note.
  const faltan = ["problem", "objective", "explanation", "next_action", "expected_evidence"].filter(
    (c) => !pieza[c],
  );
  if (!titulo || faltan.length > 0) {
    fallos.push(`${pieza.code} «${titulo || "sin título"}» — falta: ${faltan.join(", ") || "título"}`);
    return;
  }
  piezas.push(pieza);
});

console.log(`\n→ ${bloques.length} piezas en ${FUENTE}`);
for (const p of piezas) {
  console.log(`   ✓ ${p.code}  ${p.title}`);
  console.log(`        evidencia: ${p.expected_evidence}`);
  console.log(`        material : ${p.material ?? "— (la pieza no declara uno)"}`);
}
for (const f of fallos) console.log(`   ✗ ${f}`);

if (fallos.length > 0) {
  console.error(`\n✗ ${fallos.length} piezas incompletas. No se carga nada.\n`);
  process.exit(1);
}

if (!APLICAR) {
  console.log(`\n   Simulacro: nada se escribió. Agregá --aplicar.\n`);
  process.exit(0);
}

// ── Escritura ────────────────────────────────────────────────────────────────

console.log(`\n→ Cargando (source_type = 'instructor', publication_status = 'DRAFT')\n`);

let ok = 0;
for (const p of piezas) {
  const campos = ["title", "problem", "objective", "explanation", "next_action", "expected_evidence"];
  const asignaciones = campos.map((c) => `${c} = EXCLUDED.${c}`).join(", ");

  // ⚠️ `publication_status` **no está en el UPSERT**: recargar la fuente no
  // puede despublicar —ni publicar— lo que la psicopedagoga ya decidió.
  const r = unaFila(
    sql(`insert into formative_content
           (code, title, problem, objective, explanation, next_action, expected_evidence,
            material, sequence, source_type, source_ref)
         values (${lit(p.code)}, ${lit(p.title)}, ${lit(p.problem)}, ${lit(p.objective)},
                 ${lit(p.explanation)}, ${lit(p.next_action)}, ${lit(p.expected_evidence)},
                 ${p.material ? lit(p.material) : "NULL"}, ${p.sequence},
                 'instructor', ${lit(FUENTE)})
         on conflict (code) do update
            set ${asignaciones}, material = EXCLUDED.material, sequence = EXCLUDED.sequence,
                source_ref = EXCLUDED.source_ref
         returning code;`),
  );
  if (r !== p.code) {
    console.log(`   ✗ ${p.code} — ${r}`);
    continue;
  }
  ok++;
}

const publicadas = unaFila(
  sql(`select count(*) from formative_content where publication_status = 'PUBLISHED';`),
);
console.log(`   ${ok} piezas cargadas · ${publicadas} publicadas`);
console.log(`\n⚠️  Todo queda DRAFT hasta que la psicopedagoga confirme vigencia (ADR-087 D5).\n`);
