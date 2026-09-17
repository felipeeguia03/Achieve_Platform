#!/usr/bin/env node
/**
 * Achieve Platform · importación de programas de asignatura (temarios).
 *
 * Lee los `.txt` extraídos de los programas oficiales y carga sus **unidades**
 * por `ingerir_materia()`, contra el Plan 2016 de la UCC que ya dejó
 * [ADR-053](../docs/decisions.md#adr-053) — los códigos entre paréntesis del
 * temario (`BASES DE DATOS I (10201)`) son los mismos que
 * `curriculum_requirement.code`. 25 de 27 matchean exacto.
 *
 * ## Qué entra y qué no
 *
 * El corpus de origen es heterogéneo: 31 temarios, 80 libros de temas y 2
 * documentos personales. **Sólo entran los temarios**, y la exclusión se hace
 * ANTES de leer el cuerpo del archivo, no después:
 *
 *   · cualquier archivo con marcadores personales (DNI, domicilio, analítico)
 *     se descarta **sin parsearse**;
 *   · cualquier `LIBRO DE TEMAS DE CLASE Y ASISTENCIA DE PERSONAL DOCENTE` se
 *     descarta **sin parsearse**: trae nombre y legajo del docente en cada
 *     fila, y este importador no tiene dónde ponerlos ni motivo para leerlos;
 *   · lo que no se reconoce como temario **no se ingiere**. No hay rama que
 *     adivine.
 *
 * Un temario no contiene datos de personas: universidad, facultad, materia,
 * año lectivo, cátedra y la lista de unidades. Nada más.
 *
 * ## Lo que este importador NO trae
 *
 * ⚠️ **Fechas.** Un programa no tiene calendario: no hay clases ni
 * evaluaciones. Las materias entran con sus unidades y **sin ubicar en el eje**.
 * Eso es fiel a la fuente — inventar fechas sería fabricar procedencia, que es
 * exactamente lo que la cadena `preparar ≠ enviar ≠ suficiencia` prohíbe.
 *
 * ⚠️ **El párrafo de contenidos.** `topic` no tiene columna de descripción, así
 * que hoy se pierde. Entra el título de la unidad, que es lo que la pantalla
 * proyecta. Darle lugar al párrafo es un cambio de esquema y necesita su ADR.
 *
 * Uso:
 *   node scripts/importar-temarios.mjs [directorio]             # simulacro
 *   node scripts/importar-temarios.mjs [directorio] --aplicar
 */
import { readdirSync, readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { join } from "node:path";

const CONTENEDOR = "supabase_db_achieve-platform";
const DIRECTORIO = process.argv.slice(2).find((a) => !a.startsWith("-")) ?? "/tmp/temas-txt";
const APLICAR = process.argv.includes("--aplicar");
const DIAGNOSTICO = process.argv.includes("--diagnostico");

/**
 * Marcadores de descarte. **Se evalúan primero y ganan siempre**: si un archivo
 * matchea acá, no se parsea aunque además parezca un temario.
 */
const PERSONAL = /D\.?N\.?I|Domicilio|Anal[ií]tico|Apellido y Nombre/i;
const LIBRO = /LIBRO DE TEMAS/i;

/**
 * Los dos códigos que el programa nombra distinto del plan · ADR-086.
 *
 * `ORGANIZACIÓN Y ADMINISTRACIÓN DE EMPRESAS` figura como `20136` en su programa
 * y como `22136` en el Plan 2016; `REDES TELEINFORMÁTICAS II` como `10210` y
 * `10212`. Son **la misma materia** y el owner decidió que manda el código del
 * plan: `curriculum_requirement` es la fuente administrativa y es la que el
 * resto del sistema referencia.
 *
 * ⚠️ **Sin este mapeo el importador crea materias nuevas**, y el índice muestra
 * dos «Redes Teleinformáticas II»: una con temario y otra sin. Se corrige acá y
 * no con un `UPDATE` posterior porque el problema es de identidad, no de datos.
 */
const CODIGO_DEL_PLAN = { 20136: "22136", 10210: "10212" };

/**
 * El período en el que vive la cursada · ADR-086.
 *
 * ⚠️ **No es el año lectivo del programa, y tiene que ser éste.**
 * `confirmar_mapa_academico()` —el paso 3 del alta— crea la cursada del
 * estudiante con `(course, term, NULL)` usando el período que él eligió. Si el
 * temario se ingiere bajo el año lectivo del PDF (`2024`, cátedra `A`), quedan
 * **dos ofertas de la misma materia**: la del contenido y la del estudiante,
 * vacía. Medido: seis materias inscriptas, cero temas y el ADE sin nada que
 * decidir.
 *
 * El año lectivo y la cátedra del programa **no se pierden**: viajan en el
 * `source_ref` de todo lo que entra. Lo que no hacen es definir la identidad de
 * la cursada.
 */
const PERIODO = "2026-2";

/** Ruido de encabezado y pie que Oracle Reports repite en cada página. */
const RUIDO = [
  /^UNIVERSIDAD CAT[OÓ]LICA/i,
  /^Universidad Cat[oó]lica/i,
  /^\s*P[aá]gina/i,
  /^\s*FACULTAD/i,
  /^\s*Unidad\s+FACULTAD/i,
  /^\s*Asignatura\s/i,
  /^\s*A[nñ]o lectivo/i,
  /^\s*CONTENIDOS?\s*$/i,
  /^\s*\d{2}-[A-Z]{3}-\d{2}/i,
  /^\s*Emitido:/i,
  /^\s*\*\s*$/,
];

const esRuido = (linea) => RUIDO.some((r) => r.test(linea));

/**
 * Las seis variantes que usa el corpus para abrir una unidad:
 *
 *     Unidad 1:        Unidad 1.        UNIDAD 1:
 *     UNIDAD 1         UNIDAD TEMÁTICA 1        UNIDAD IV:
 *
 * El separador es opcional porque varios programas dejan el título en la línea
 * siguiente, y el ordinal puede venir en arábigo o en romano.
 *
 * ⚠️ No matchea `Unidad     FACULTAD DE INGENIERÍA` —el encabezado que Oracle
 * repite en cada página— porque `FACULTAD` no es ordinal en ninguna de las dos
 * notaciones.
 */
const APERTURA_DE_UNIDAD =
  /^\s*(?:UNIDAD(?:\s+TEM[AÁ]TICA)?|M[OÓ]DULO|BOLILLA|CAP[IÍ]TULO|EJE(?:\s+TEM[AÁ]TICO)?)\s+(\d{1,2}|[IVXLC]{1,6})\b\s*[:.\-–]?\s*(.*)$/i;

const VALOR_ROMANO = { I: 1, V: 5, X: 10, L: 50, C: 100 };

/** Devuelve el entero, o `null` si no es un romano plausible para una unidad. */
function desdeRomano(s) {
  const t = s.toUpperCase();
  if (!/^[IVXLC]+$/.test(t)) return null;
  let total = 0;
  for (let i = 0; i < t.length; i++) {
    const actual = VALOR_ROMANO[t[i]];
    const siguiente = VALOR_ROMANO[t[i + 1]];
    total += siguiente > actual ? -actual : actual;
  }
  return total > 0 && total <= 40 ? total : null;
}

/**
 * Una consulta, y **su error si lo hubo**.
 *
 * ⚠️ `psql` sale con `0` aunque la sentencia falle, y manda el `ERROR:` a
 * stderr. Capturar sólo stdout dejaba un helper que **devolvía vacío en vez de
 * fallar**: un `DELETE` rechazado por una foreign key se veía exactamente igual
 * que uno que no encontró filas. Ahora el error viene en el texto, así que los
 * controles de los llamadores —«¿esto es un uuid?»— lo detectan.
 */
function sql(texto) {
  const r = spawnSync(
    "docker",
    ["exec", "-i", CONTENEDOR, "psql", "-U", "postgres", "-d", "postgres", "-tAX", "-f", "-"],
    { input: texto, encoding: "utf8" },
  );
  const err = (r.stderr ?? "").trim();
  return err ? `${err}\n${(r.stdout ?? "").trim()}`.trim() : (r.stdout ?? "").trim();
}

/**
 * La primera línea de la respuesta.
 *
 * ⚠️ `psql -tA` imprime **también el rótulo del comando** (`INSERT 0 1`) debajo
 * del valor de un `RETURNING`. Tomarlo entero daba un uuid con basura pegada y
 * el `INSERT` siguiente lo rechazaba — con el contador diciendo que había
 * salido bien.
 */
const unaFila = (texto) => texto.split("\n")[0].trim();

/** Comilla simple de Postgres: se escapa duplicándola. */
const lit = (s) => `'${String(s).replace(/'/g, "''")}'`;

const esUuid = (s) => /^[0-9a-f-]{36}$/.test(s);

// ── Parseo ───────────────────────────────────────────────────────────────────

function parsear(nombreArchivo, texto) {
  const cabecera = texto.match(/^\s*Asignatura\s+(.+?)\s*\((\d+)\)\s*$/m);
  if (!cabecera) return { fallo: "sin línea Asignatura" };
  const materia = cabecera[1].trim();
  const codigo = CODIGO_DEL_PLAN[cabecera[2]] ?? cabecera[2];

  const lectivo = texto.match(/A[nñ]o lectivo\s+(\d{4})/);
  const catedraM = texto.match(/C[aá]tedra\s+(\S+)/);
  const anio = lectivo?.[1] ?? null;
  const catedra = catedraM?.[1] ?? null;
  if (!anio) return { fallo: "sin año lectivo" };

  const lineas = texto.split("\n");
  const unidades = [];
  for (let i = 0; i < lineas.length; i++) {
    const m = lineas[i].match(APERTURA_DE_UNIDAD);
    if (!m) continue;

    const orden = /^\d+$/.test(m[1]) ? Number(m[1]) : desdeRomano(m[1]);
    if (!orden) continue;

    let titulo = m[2].trim();
    // Algunos programas dejan el título en la línea siguiente.
    for (let j = i + 1; !titulo && j < lineas.length; j++) {
      const sig = lineas[j].trim();
      if (sig && !esRuido(sig)) {
        titulo = sig;
        break;
      }
    }
    if (!titulo) continue;

    titulo = titulo.replace(/\s+/g, " ").replace(/\.\s*$/, "").trim();
    // Un programa repite su encabezado por página: la misma unidad puede
    // aparecer dos veces. Gana la primera.
    if (!unidades.some((u) => u.orden === orden)) {
      unidades.push({ codigo: `U${orden}`, nombre: titulo, orden });
    }
  }

  // ── Último recurso: el esquema decimal ─────────────────────────────────────
  //
  // Un programa numera `1.- CAPA DE RED.` sin la palabra «unidad», y anida
  // `1.1.-` y `1.1.1.-` debajo. **Sólo se intenta si no apareció ningún
  // encabezado con palabra**, para que no compita con las seis variantes de
  // arriba, y **sólo toma el primer nivel**: `1.1.-` no matchea porque exige
  // `.-` pegado al número.
  if (unidades.length === 0) {
    for (const linea of lineas) {
      const m = linea.match(/^\s*(\d{1,2})\.-\s*(.+)$/);
      if (!m) continue;
      const orden = Number(m[1]);
      const titulo = m[2].replace(/\s+/g, " ").replace(/\.\s*$/, "").trim();
      if (titulo && !unidades.some((u) => u.orden === orden)) {
        unidades.push({ codigo: `U${orden}`, nombre: titulo, orden });
      }
    }
  }

  // ⚠️ **Lo que no se reconoce no se inventa.** Un programa que no numera sus
  // unidades se informa y queda afuera: derivar la estructura de mayúsculas o
  // de saltos de línea sería fabricar procedencia.
  if (unidades.length === 0) return { fallo: `sin unidades (${materia})` };
  unidades.sort((a, b) => a.orden - b.orden);
  return { archivo: nombreArchivo, materia, codigo, anio, catedra, unidades };
}

// ── Clasificación ────────────────────────────────────────────────────────────

const archivos = readdirSync(DIRECTORIO).filter((f) => f.endsWith(".txt")).sort();
const temarios = [];
const sinReconocer = [];
const formas = new Map();
const conteo = { personal: 0, libro: 0, temario: 0, ilegible: 0 };

for (const archivo of archivos) {
  const crudo = readFileSync(join(DIRECTORIO, archivo), "utf8");
  // ⚠️ El orden importa: descarte primero, parseo después.
  if (PERSONAL.test(crudo)) {
    conteo.personal++;
    continue;
  }
  if (LIBRO.test(crudo)) {
    conteo.libro++;
    continue;
  }
  const t = parsear(archivo, crudo);
  if (t.fallo) {
    conteo.ilegible++;
    sinReconocer.push(`${archivo}: ${t.fallo}`);
    // Diagnóstico de FORMA, no de contenido: qué encabezados de sección usa un
    // archivo que no se pudo parsear, con los dígitos enmascarados.
    if (DIAGNOSTICO) {
      // Las primeras líneas útiles después del marcador de contenidos: es donde
      // vive el encabezado de sección, cualquiera sea la palabra que use.
      const lineas = crudo.split("\n");
      const desde = lineas.findIndex((l) => /^\s*CONTENIDOS?\s*$/i.test(l));
      const utiles = lineas
        .slice(desde >= 0 ? desde + 1 : 0)
        .map((l) => l.trim())
        .filter((l) => l && !esRuido(l))
        .slice(0, 6);
      for (const l of utiles) {
        const forma = `${archivo} │ ${l.replace(/\d/g, "#").slice(0, 54)}`;
        formas.set(forma, (formas.get(forma) ?? 0) + 1);
      }
    }
    continue;
  }
  conteo.temario++;
  temarios.push(t);
}

// ── Duplicados ───────────────────────────────────────────────────────────────
//
// El corpus trae el mismo programa dos veces (`45501900.txt` y
// `45501900-2.txt`). Como la identidad de una cursada es
// `código + año + cátedra`, las dos ingestas caerían en la **misma** oferta y la
// segunda pisaría a la primera. Se resuelve acá y no en la base: gana la que
// más unidades trajo, que es la copia menos truncada.
const porCursada = new Map();
for (const t of temarios) {
  // ⚠️ **La clave es sólo el código.** Como todo va al mismo período, dos
  // cátedras de la misma materia caerían en la misma cursada y la segunda
  // pisaría a la primera. Gana la que más unidades trajo.
  const clave = t.codigo;
  const previa = porCursada.get(clave);
  if (!previa || t.unidades.length > previa.unidades.length) porCursada.set(clave, t);
}
const duplicados = temarios.length - porCursada.size;
temarios.length = 0;
temarios.push(...porCursada.values());

console.log(`\n→ ${archivos.length} archivos en ${DIRECTORIO}`);
console.log(`   descartados por datos personales : ${conteo.personal}`);
console.log(`   descartados por libro de temas   : ${conteo.libro}`);
console.log(`   no reconocidos como temario      : ${conteo.ilegible}`);
console.log(`   duplicados (misma cursada)       : ${duplicados}`);
console.log(`   temarios a ingerir               : ${temarios.length}\n`);

for (const t of [...temarios].sort((a, b) => a.materia.localeCompare(b.materia))) {
  const catedra = t.catedra ? ` · cátedra ${t.catedra}` : "";
  console.log(`   ${t.codigo}  ${t.materia} (${t.anio}${catedra}) — ${t.unidades.length} unidades`);
}

if (sinReconocer.length > 0) {
  console.log(`\n   No reconocidos, con su motivo:`);
  for (const l of sinReconocer) console.log(`   · ${l}`);
}

if (DIAGNOSTICO && formas.size > 0) {
  console.log(`\n   Formas de encabezado en los no reconocidos (dígitos = #):`);
  for (const [forma, n] of [...formas].sort((a, b) => b[1] - a[1]).slice(0, 25)) {
    console.log(`   ${String(n).padStart(4)}  ${forma}`);
  }
}

if (!APLICAR) {
  console.log(`\n   Simulacro: nada se escribió. Agregá --aplicar para ingerir.\n`);
  process.exit(0);
}

// ── Ingesta ──────────────────────────────────────────────────────────────────

const PLAN = unaFila(sql(`select cp.id from curriculum_plan cp
                    join academic_program ap on ap.id = cp.program_id
                    join institution i on i.id = ap.institution_id
                   where i.key = 'UCC' and ap.key = '08' and cp.version = '2016';`));
const INST = unaFila(sql(`select id from institution where key = 'UCC';`));
if (!esUuid(PLAN) || !esUuid(INST)) {
  console.error("✗ No está el Plan 2016 de la UCC. Corré 'npm run db:catalogo' antes.");
  process.exit(1);
}

// ⚠️ **Las materias huérfanas de una corrida anterior se borran.** Antes del
// mapeo de arriba, este mismo script creó `20136` y `10210` como `course`
// nuevos del plan. Quedarse con las dos versiones dejaría dos «Redes
// Teleinformáticas II» en el índice, una con temario y otra sin.
//
// Sólo se borra lo que **ningún requisito del plan referencia** y cuyo código
// está en el mapeo: es una lista cerrada, no una limpieza por heurística.
// ⚠️ **Las cursadas van primero.** `course_offering.course_id` es `RESTRICT`, no
// `CASCADE`: borrar la materia con su cursada colgando lo rechaza la base. Y las
// unidades sí caen por `CASCADE` desde la cursada, que es lo que se quiere —
// son las duplicadas, y las buenas ya están bajo el código del plan.
const huerfanas = Object.keys(CODIGO_DEL_PLAN)
  .map((c) => lit(c))
  .join(", ");
const condicion = `c.curriculum_plan_id = ${lit(PLAN)}
     and c.code in (${huerfanas})
     and not exists (select 1 from curriculum_requirement cr
                      where cr.curriculum_plan_id = ${lit(PLAN)} and cr.code = c.code)`;

// ⚠️ En llamadas separadas **a propósito**: `psql -tA` imprime el rótulo del
// comando (`DELETE 2`) por stdout, así que un `DELETE` y un `SELECT` en la misma
// llamada dejan el conteo en la segunda línea y `unaFila` lee el rótulo.
sql(`delete from course_offering o using course c
      where o.course_id = c.id and ${condicion};`);
const borradas = unaFila(
  sql(`with fuera as (delete from course c where ${condicion} returning 1)
       select count(*) from fuera;`),
);
if (!/^\d+$/.test(borradas)) {
  console.log(`   ✗ no se pudieron limpiar las materias duplicadas: ${borradas.split("\n")[0]}`);
} else if (borradas !== "0") {
  console.log(`   (se borraron ${borradas} materias duplicadas de una corrida anterior)`);
}

console.log(`\n→ Ingiriendo contra UCC / Plan 2016\n`);
let ok = 0;
let fallos = 0;

for (const t of temarios) {
  // El año lectivo y la cátedra del programa viven acá: no se pierden, pero
  // tampoco definen la identidad de la cursada.
  const ref = `programa-oficial:${t.archivo}:${t.anio}${t.catedra ? "-" + t.catedra : ""}`;
  const off = unaFila(sql(
    `select cursada_id from public.ingerir_materia(
       ${lit(INST)}, 'institution', ${lit(ref)}, now(), 0.9,
       ${lit(t.codigo)}, ${lit(t.materia)}, ${lit(PERIODO)}, NULL,
       ${lit(JSON.stringify(t.unidades))}::jsonb, '[]'::jsonb, '[]'::jsonb, ${lit(PLAN)});`,
  ));

  // ⚠️ Mismo control que `materia_completa` en `db-demo.sh`: un error de psql
  // vuelve como texto por stdout, y sin esta comprobación el contador diría que
  // la materia entró cuando no entró.
  if (!esUuid(off)) {
    console.log(`   ✗ ${t.materia} — ${off}`);
    fallos++;
    continue;
  }

  // Sin recurso el ADE contesta `CONTEXTO_INCOMPLETO` y la materia no se puede
  // recorrer: `ingerir_materia` no crea material.
  sql(`delete from resource where offering_id = ${lit(off)};
       insert into resource (offering_id, topic_id, resource_type, title,
                             source_type, source_ref, file_ref, rights_status)
       select ${lit(off)}, t.id, 'apunte', 'Programa — ' || t.name,
              'institution', ${lit(ref)}, ${lit(t.archivo)}, 'unknown'
         from topic t
        where t.offering_id = ${lit(off)} and t.retired_at is null;`);

  console.log(`   ✓ ${t.materia} — ${t.unidades.length} unidades`);
  ok++;
}

console.log(`\n   ${ok} materias ingeridas, ${fallos} con error.\n`);
