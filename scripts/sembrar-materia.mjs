#!/usr/bin/env node
/**
 * Achieve Platform · **andamio** — carga contenido sintético en una cursada.
 *
 * ⚠️⚠️ **NO ES UNA CAPACIDAD DEL PRODUCTO.** Existe por un hueco concreto y
 * medido: un estudiante que completa el alta desde cero queda con
 * `course_enrollment` y **nada adentro** —sin unidades, sin clases, sin
 * evaluaciones—, así que `HOY` dice `FALTA CONTEXTO DE CURSADO`, el reparto dice
 * `SIN_DATOS` y el ADE no tiene sobre qué decidir. El producto **está diciendo
 * la verdad**; lo que falta es por dónde entra el contenido.
 *
 * El único escritor de contenido académico es `ingerir_materia`, y **ninguna
 * ruta lo alcanza** — el mundo demo funciona porque `db-demo.sh` llama al RPC
 * desde bash. Esto hace lo mismo, apuntado a la cursada que el alta ya creó.
 *
 * ## Por qué es un script y no una pantalla
 *
 * [ADR-076](../docs/decisions.md#adr-076) **no autoriza construir la superficie
 * académica**, y el informe encontró algo peor que la falta de pantalla: **no
 * hay identidad de actor**, sólo un secreto compartido. Un script de siembra no
 * necesita saber quién aprieta el botón porque **no hay botón**.
 *
 * ## Qué escribe, y con qué procedencia
 *
 * Todo entra `unverified` y con fuente declarada, igual que la ingesta del ADL:
 * nada de esto lo afirma una institución. `ingerir_materia` **reemplaza**
 * unidades, clases y evaluaciones de la cursada — **salvo las evaluaciones que
 * declaró el estudiante** ([ADR-067](../docs/decisions.md#adr-067)), que
 * sobreviven.
 *
 * ## Cuando ADR-006 abra
 *
 * **Este script se borra.** Con personas reales, cargar el programa de una
 * materia es una operación con procedencia, actor y trazabilidad — no un
 * comando.
 *
 * Uso:
 *   npm run db:materia -- <email|studentId>              → lista sus cursadas
 *   npm run db:materia -- <email|studentId> "<materia>"  → le carga contenido
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";

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

const [quien, materiaPedida] = process.argv.slice(2);
if (!quien) {
  console.error("Uso: npm run db:materia -- <email|studentId> [\"<materia>\"]");
  process.exit(1);
}

/** El estudiante, por id o por el email con el que entra a `/login`. */
async function estudiante() {
  if (/^[0-9a-f-]{36}$/i.test(quien)) {
    const { data } = await admin.from("student").select("id,institution_id").eq("id", quien).maybeSingle();
    return data;
  }
  const { data: usuarios } = await admin.auth.admin.listUsers({ perPage: 200 });
  const u = usuarios?.users.find((x) => x.email === quien);
  if (!u) return null;
  const { data } = await admin
    .from("student")
    .select("id,institution_id")
    .eq("auth_user_id", u.id)
    .maybeSingle();
  return data;
}

const est = await estudiante();
if (!est) {
  console.error(`✗ No hay ningún estudiante para «${quien}».`);
  process.exit(1);
}

// Las cursadas activas, con lo que YA tienen adentro. El conteo es el punto:
// es lo que distingue una materia lista de una que el alta dejó vacía.
const { data: cursadas, error } = await admin
  .from("course_enrollment")
  .select(
    "id, offering_id, course_offering!inner(term, commission, course!inner(code, name, curriculum_plan_id)), status",
  )
  .eq("student_id", est.id)
  .eq("status", "active");

if (error) {
  console.error(`✗ No se pudieron leer las cursadas: ${error.message}`);
  process.exit(1);
}

async function contenido(offeringId) {
  const cuenta = async (tabla) => {
    const { count } = await admin
      .from(tabla)
      .select("id", { count: "exact", head: true })
      .eq("offering_id", offeringId);
    return count ?? 0;
  };
  return {
    temas: await cuenta("topic"),
    clases: await cuenta("class_session"),
    evaluaciones: await cuenta("assessment"),
  };
}

if (!materiaPedida) {
  console.log(`\nCursadas activas de ${quien}:\n`);
  for (const c of cursadas ?? []) {
    const n = await contenido(c.offering_id);
    const vacia = n.temas === 0 ? "  ⚠️  VACÍA — el ADE no tiene sobre qué decidir" : "";
    console.log(
      `   ${c.course_offering.course.name}` +
        `\n      ${n.temas} unidades · ${n.clases} clases · ${n.evaluaciones} evaluaciones${vacia}`,
    );
  }
  console.log(`\nPara cargarle contenido:\n   npm run db:materia -- ${quien} "<nombre de la materia>"\n`);
  process.exit(0);
}

const elegida = (cursadas ?? []).find(
  (c) => c.course_offering.course.name.toLowerCase() === materiaPedida.toLowerCase(),
);
if (!elegida) {
  console.error(
    `✗ «${materiaPedida}» no está entre las cursadas activas. Corré el comando sin el nombre para verlas.`,
  );
  process.exit(1);
}

// ── El contenido sintético ───────────────────────────────────────────────────
//
// ⚠️ **Determinista a partir del nombre.** Dos corridas sobre la misma materia
// producen lo mismo: una siembra que cambia sola haría que un ajuste de UI y un
// cambio de datos se confundan.
function semilla(texto) {
  let n = 0;
  for (const c of texto) n = (n * 31 + c.charCodeAt(0)) >>> 0;
  return n;
}

const s = semilla(elegida.course_offering.course.name);
const UNIDADES = ["Fundamentos", "Métodos", "Aplicaciones", "Integración"];
const unidades = UNIDADES.map((nombre, i) => ({ codigo: `U${i + 1}`, nombre, orden: i + 1 }));
const prereqs = [
  { unidad: "Métodos", requiere: "Fundamentos" },
  { unidad: "Aplicaciones", requiere: "Métodos" },
];

const hoy = new Date();
const dia = (n) => new Date(hoy.getTime() + n * 86_400_000).toISOString().slice(0, 10);

// Ocho clases semanales hacia atrás y un parcial adelante. El parcial va **con
// `tipo: parcial` y sin temas**: un examen ocupa el aula y no dicta nada, y si
// entrara como clase el Gantt le atribuiría sus minutos a lo que evaluaba
// (ADR-069).
const clases = [];
for (let i = 8; i >= 1; i--) {
  clases.push({
    fecha: dia(-i * 7),
    hora: `${14 + (s % 5)}:00`,
    minutos: 120,
    corrida: i % 3 === 0 ? "practico" : "teorico",
    temas: [UNIDADES[Math.min(UNIDADES.length - 1, Math.floor((8 - i) / 2))]],
  });
}
const diasAlParcial = 10 + (s % 8);
clases.push({ fecha: dia(diasAlParcial), hora: "14:00", minutos: 120, tipo: "parcial", temas: [] });

const evaluaciones = [
  {
    tipo: "parcial",
    titulo: "Parcial 1",
    fecha: dia(diasAlParcial),
    modalidad: "practico",
    alcance: "U1 a U2",
  },
];

console.log(`\n⚠️  Modo andamio · datos SINTÉTICOS. No es una capacidad del producto.\n`);
console.log(`→ Cargando «${elegida.course_offering.course.name}»`);

const { data: resultado, error: fallo } = await admin.rpc("ingerir_materia", {
  p_institution_id: est.institution_id,
  p_source_type: "public_web",
  p_source_ref: `https://syn.example/programa-${s}.pdf`,
  p_observed_at: new Date().toISOString(),
  p_confidence: 0.7,
  p_course_code: elegida.course_offering.course.code,
  p_course_name: elegida.course_offering.course.name,
  p_term: elegida.course_offering.term,
  p_commission: elegida.course_offering.commission,
  p_unidades: unidades,
  p_prerequisitos: prereqs,
  p_evaluaciones: evaluaciones,
  // ⚠️ **El plan va, y no es opcional.** Sin él `ingerir_materia` resuelve el
  // `course` dentro del contenedor «Sin programa declarado» —otra fila con el
  // mismo código— y termina creando una segunda cursada, dejando la del
  // estudiante vacía. Lo encontró el guard de abajo, no una lectura del SQL.
  p_curriculum_plan_id: elegida.course_offering.course.curriculum_plan_id,
  p_clases: clases,
  p_carga_min: 3600,
  p_carga_texto: "60 horas",
});

if (fallo) {
  console.error(`✗ La ingesta falló: ${fallo.message}`);
  process.exit(1);
}

const offering = Array.isArray(resultado) ? resultado[0]?.cursada_id : resultado?.cursada_id;

// ⚠️ **Se verifica que haya caído en LA MISMA cursada**, no en una nueva.
// `ingerir_materia` busca la offering por `(course, term, commission)`; si algo
// de eso no coincidiera, crearía otra y el estudiante quedaría con la suya
// todavía vacía — y el script diría «listo».
if (offering && offering !== elegida.offering_id) {
  console.error(
    `✗ La ingesta creó OTRA cursada (${offering}) en vez de llenar la del estudiante ` +
      `(${elegida.offering_id}). No se tocó la suya.`,
  );
  process.exit(1);
}

// ── El material por unidad ───────────────────────────────────────────────────
//
// ⚠️ **`ingerir_materia` NO crea recursos, y sin recursos el ADE no recomienda.**
// Lo dice él mismo: `CONTEXTO_INCOMPLETO — «Fundamentos» no tiene material
// configurado`. Es correcto —una acción sin nada que abrir no es ejecutable— y
// es la pieza que faltaba para que la materia recién cargada sirva de algo.
await admin.from("resource").delete().eq("offering_id", elegida.offering_id);
const { data: temas } = await admin
  .from("topic")
  .select("id,name")
  .eq("offering_id", elegida.offering_id);
if (temas?.length) {
  const { error: falloRecursos } = await admin.from("resource").insert(
    temas.map((t) => ({
      offering_id: elegida.offering_id,
      topic_id: t.id,
      resource_type: "apunte",
      title: `Guía de ${t.name}`,
      source_type: "instructor",
      rights_status: "unknown",
    })),
  );
  if (falloRecursos) {
    console.error(`✗ No se pudo cargar el material: ${falloRecursos.message}`);
    process.exit(1);
  }
}

// ⚠️ **El alcance del parcial, declarado.** Sin esto el reparto exige la materia
// entera para un parcial que cubre dos unidades, y el número sale al doble
// (ADR-073). Se declara — **nunca se infiere del texto de `scope`**.
const { data: parcial } = await admin
  .from("assessment")
  .select("id")
  .eq("offering_id", elegida.offering_id)
  .eq("title", "Parcial 1")
  .maybeSingle();
if (parcial && temas?.length) {
  await admin.from("assessment_topic").insert(
    temas.slice(0, 2).map((t) => ({ assessment_id: parcial.id, topic_id: t.id })),
  );
}

const n = await contenido(elegida.offering_id);
console.log(`   ${n.temas} unidades · ${n.clases} clases · ${n.evaluaciones} evaluaciones · ${temas?.length ?? 0} recursos`);
console.log(`   parcial en ${diasAlParcial} días · 60 horas declaradas · todo unverified`);
console.log(`\n✓ Cargada. Ahora corré el ADE para que aparezca una acción:`);
console.log(`   npm run recomendar -- ${est.institution_id} ${elegida.id}`);
console.log(`   (o el botón «correr el ADE» del dock de modo prueba)\n`);
