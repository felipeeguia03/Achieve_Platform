#!/usr/bin/env node
/**
 * Achieve Platform · Fase B6.24 — contenido estimado para el resto del plan.
 *
 * [ADR-086](../docs/decisions.md#adr-086). De las 51 materias del Plan 2016, 25
 * tienen temario real —cargado por `scripts/importar-temarios.mjs` desde los
 * programas oficiales— y **26 no tienen nada**. Y ninguna de las 51 tiene
 * calendario: un programa de asignatura no trae fechas, así que el Gantt queda
 * vacío y no hay minutos por tema.
 *
 * Este script completa lo que falta, y **dice que lo completó él**.
 *
 * ## Dos casos, y no se tratan igual
 *
 * | | unidades | calendario · evaluación · pesos | `contenido` |
 * |---|---|---|---|
 * | **con temario real** | se conservan | se generan | `calendario_estimado` |
 * | **sin temario** | se generan | se generan | `estimado` |
 *
 * La diferencia se lee de `resource.source_type`: el importador de programas
 * oficiales escribe `institution`, éste escribe `inference`. Por eso **a una
 * materia real no se le tocan los recursos** — sobrescribirlos la haría pasar
 * por completamente inventada.
 *
 * ## Lo que este script NO hace
 *
 * ⚠️ **No eleva `verification_status`.** Todo entra `unverified`, que es la
 * única escritura que el invariante `I9` permite fuera de
 * `corroborar_procedencia()`.
 *
 * ⚠️ **No inventa posiciones en el eje.** Los temas se ubican porque hay
 * `class_session` con fecha real en la base, no porque sean el séptimo de la
 * lista. El guard de ADR-085 sigue valiendo tal cual.
 *
 * ⚠️ **No pisa una evaluación que declaró el estudiante.** `ingerir_materia`
 * sólo borra las que tienen `declared_by IS NULL` (ADR-067).
 *
 * ## Determinismo
 *
 * Todo sale de una semilla derivada del **código de materia**, así que dos
 * corridas producen exactamente lo mismo y volver a correrlo no mueve el mundo
 * debajo de quien lo esté mirando.
 *
 * Uso:
 *   node scripts/simular-temarios.mjs              # simulacro
 *   node scripts/simular-temarios.mjs --aplicar
 */
import { spawnSync } from "node:child_process";

const CONTENEDOR = "supabase_db_achieve-platform";
const APLICAR = process.argv.includes("--aplicar");

/** El período del alta. Ver la nota de `PERIODO` en `importar-temarios.mjs`. */
const PERIODO = "2026-2";

/** El día contra el que se arma el calendario. Se puede fijar para reproducir. */
const HOY = (process.argv.find((a) => /^\d{4}-\d{2}-\d{2}$/.test(a)) ?? new Date().toISOString().slice(0, 10));

// ── Los temarios inventados ──────────────────────────────────────────────────
//
// Escritos a mano, uno por uno, para que cada materia diga algo plausible de su
// campo. **No se generan con un algoritmo**: una lista de «Unidad 1, Unidad 2»
// sería peor que no tener nada, porque parecería contenido.
//
// El peso es cuánto de la materia ocupa esa unidad, de 1 a 3. Va acá y no en una
// fórmula por la misma razón: una introducción y un tema central no pesan igual,
// y eso lo sabe quien escribe la lista, no una función de hash.
const TEMARIOS = {
  "20094": ["La ingeniería como profesión|1", "Campos de la ingeniería en sistemas|1", "Método de resolución de problemas|2", "Representación y modelado|2", "Trabajo en equipo y comunicación técnica|2", "Ética profesional e impacto social|1"],
  "20189": ["Algoritmos y resolución de problemas|2", "Tipos de datos y expresiones|1", "Estructuras de control|3", "Funciones y modularización|3", "Arreglos y cadenas|3", "Registros y archivos|2", "Introducción a la complejidad|1"],
  "20133": ["Normalización y formatos IRAM|1", "Proyecciones y vistas|3", "Cortes y secciones|3", "Acotación|2", "Croquis y dibujo a mano alzada|2", "Modelado asistido por computadora|3"],
  "10139": ["Funciones de varias variables|3", "Derivadas parciales y gradiente|3", "Extremos y multiplicadores de Lagrange|2", "Integrales múltiples|3", "Integrales de línea y superficie|2", "Teoremas de Green, Stokes y Gauss|2"],
  "10226": ["Estadística descriptiva|2", "Probabilidad y teorema de Bayes|3", "Variables aleatorias y distribuciones|3", "Distribuciones continuas notables|2", "Muestreo y estimación|2", "Pruebas de hipótesis|3", "Regresión y correlación|2"],
  "10140": ["Electrostática|3", "Corriente y circuitos de continua|3", "Campo magnético|3", "Inducción electromagnética|2", "Circuitos de corriente alterna|2", "Ecuaciones de Maxwell|1"],
  "20097": ["Oscilaciones y ondas mecánicas|3", "Ondas sonoras|2", "Óptica geométrica|3", "Óptica física: interferencia y difracción|2", "Introducción a la física moderna|2", "Nociones de física cuántica|1"],
  "10182": ["Entorno de trabajo y control de versiones|2", "Estructuras de datos aplicadas|3", "Depuración y pruebas unitarias|3", "Persistencia y manejo de archivos|2", "Interfaces y separación de capas|2", "Proyecto integrador|3"],
  "20162": ["Repaso de organización de computadoras|1", "Jerarquía de memoria y caché|3", "Segmentación de cauce|3", "Paralelismo a nivel de instrucción|2", "Multiprocesadores y coherencia|2", "Evaluación de rendimiento|2"],
  "10184": ["Qué decide una arquitectura|2", "Atributos de calidad y escenarios|3", "Estilos y patrones arquitectónicos|3", "Vistas y documentación|2", "Arquitectura en capas y hexagonal|3", "Evaluación de arquitecturas|2"],
  "10185": ["Arquitecturas distribuidas|3", "Microservicios y sus costos|3", "Mensajería y consistencia eventual|3", "Observabilidad y resiliencia|2", "Seguridad en la arquitectura|2", "Evolución y deuda arquitectónica|2"],
  "20182": ["Procesamiento y optimización de consultas|3", "Transacciones y control de concurrencia|3", "Recuperación ante fallas|2", "Bases distribuidas y replicación|3", "Modelos NoSQL|2", "Almacenes analíticos|2"],
  "10154": ["Ecosistemas y ciclos naturales|1", "Marco legal ambiental|2", "Evaluación de impacto ambiental|3", "Gestión de residuos|2", "Eficiencia energética|2", "Desarrollo sostenible en proyectos técnicos|2"],
  "00328": ["Fe y razón|2", "La pregunta por Dios|2", "Persona, libertad y sentido|3", "Antropología cristiana|2", "El misterio del mal y el sufrimiento|2", "Fe y vida profesional|1"],
  "10202": ["Modelado de vistas del sistema|3", "Análisis y diseño orientado a objetos|3", "Patrones de diseño|3", "Arquitectura de la aplicación|2", "Pruebas de diseño|2", "Refactorización|2"],
  "00254": ["Dignidad de la persona humana|2", "Bien común y solidaridad|2", "Trabajo y economía|3", "Justicia social y desigualdad|3", "Cuidado de la casa común|2", "Compromiso profesional y ciudadano|1"],
  "20168": ["Modelos OSI y TCP/IP|2", "Capa física y medios de transmisión|2", "Capa de enlace y Ethernet|3", "Conmutación y VLAN|3", "Direccionamiento IP y subredes|3", "Introducción al ruteo|2"],
  "10211": ["Procesos e hilos|3", "Planificación de CPU|3", "Sincronización y bloqueos|3", "Gestión de memoria y memoria virtual|3", "Sistemas de archivos|2", "Entrada/salida y almacenamiento|2", "Virtualización|2"],
  "10204": ["Ciclo de vida y marcos de trabajo|2", "Alcance y estructura de desglose|3", "Estimación de esfuerzo y costos|3", "Cronograma y camino crítico|3", "Gestión de riesgos|2", "Equipos, seguimiento y cierre|2"],
  "10220": ["Calidad de producto y de proceso|2", "Métricas y medición|2", "Verificación y validación|3", "Diseño de casos de prueba|3", "Automatización de pruebas|3", "Revisiones e inspecciones|2", "Mejora continua|1"],
  "20185": ["Detección de oportunidades|2", "Modelo de negocio|3", "Validación con clientes|3", "Plan financiero básico|2", "Formas jurídicas y financiamiento|2", "Presentación del proyecto|2"],
  "00255": ["Ética general y ética aplicada|2", "Deontología profesional|3", "Códigos de ética en informática|2", "Responsabilidad por el software|3", "Privacidad y uso de datos|3", "Dilemas y toma de decisiones|2"],
  "10156": ["Nociones de derecho|2", "Contratos y responsabilidad civil|3", "Propiedad intelectual y software|3", "Protección de datos personales|3", "Derecho laboral aplicado|2", "Peritajes y ejercicio profesional|2"],
  "10098": ["Persona y proyecto de vida|2", "Comunicación y vínculos|2", "Pensamiento crítico|3", "Compromiso comunitario|2", "Integración de la experiencia|1"],
  "20071": ["Identidad y vocación|2", "Diálogo y pluralismo|2", "Responsabilidad social del profesional|3", "Trabajo con la comunidad|2", "Síntesis final|1"],
  "10216": ["Agentes y resolución de problemas|2", "Búsqueda informada|3", "Representación del conocimiento|3", "Razonamiento bajo incertidumbre|3", "Aprendizaje automático|3", "Redes neuronales|3", "Ética de los sistemas inteligentes|2"],
};

/** Cómo se llama la evaluación de cada año, para que el índice tenga variedad. */
const EVALUACION_POR_ANIO = {
  1: { tipo: "parcial", titulo: "Parcial 1", modalidad: "teorico_escrito" },
  2: { tipo: "parcial", titulo: "Parcial 1", modalidad: "practico" },
  3: { tipo: "parcial", titulo: "Parcial 2", modalidad: "teorico_escrito" },
  4: { tipo: "final", titulo: "Final", modalidad: "oral" },
  5: { tipo: "final", titulo: "Final", modalidad: "mixta" },
};

// ── Utilidades ───────────────────────────────────────────────────────────────

/**
 * Una consulta, y **su error si lo hubo**.
 *
 * ⚠️ `psql` sale con `0` aunque la sentencia falle, y manda el `ERROR:` a
 * stderr. Capturar sólo stdout deja un helper que **devuelve vacío en vez de
 * fallar**, y entonces el contador de más abajo dice que la materia entró
 * cuando no entró. Ya pasó una vez.
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

const unaFila = (t) => t.split("\n")[0].trim();
const lit = (s) => `'${String(s).replace(/'/g, "''")}'`;
const esUuid = (s) => /^[0-9a-f-]{36}$/.test(s);

/** Semilla estable desde un texto. Mismo código de materia, mismo mundo. */
function semilla(texto) {
  let h = 2166136261;
  for (let i = 0; i < texto.length; i++) {
    h ^= texto.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** Generador determinista (mulberry32). No se usa `Math.random` en ningún lado. */
function azar(s) {
  let a = s;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const dia = (base, n) => {
  const d = new Date(`${base}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
};

// ── El mundo ─────────────────────────────────────────────────────────────────

const INST = unaFila(sql(`select id from institution where key = 'UCC';`));
const PLAN = unaFila(sql(`select cp.id from curriculum_plan cp
                            join academic_program ap on ap.id = cp.program_id
                            join institution i on i.id = ap.institution_id
                           where i.key = 'UCC' and ap.key = '08' and cp.version = '2016';`));
if (!esUuid(INST) || !esUuid(PLAN)) {
  console.error("✗ No está el Plan 2016 de la UCC. Corré 'npm run db:catalogo' antes.");
  process.exit(1);
}

/**
 * Las materias del plan, con sus unidades reales si las tienen.
 *
 * ⚠️ **Se leen las unidades existentes y se vuelven a mandar.**
 * `ingerir_materia` con `p_unidades` vacío **retira todas las unidades de la
 * cursada** (ADR-081): mandar una lista vacía acá le borraría el temario real a
 * las 25 que sí lo tienen.
 */
// ⚠️ **La cursada existente se reusa; no se crea otra.** `ingerir_materia`
// resuelve la oferta por `(course, term, commission)`, así que ingerir con un
// período distinto del que ya tiene el temario real crearía una **segunda
// cursada** de la misma materia: las unidades duplicadas de un lado, y la del
// estudiante intacta y vacía del otro. Por eso el período y la cátedra salen de
// la base cuando ya hay una.
const SEPARADOR = String.fromCharCode(1);

const filas = sql(`
  with oferta as (
    select distinct on (c2.code)
           c2.code, o.term, o.commission,
           -- OJO: la materia es REAL por su PROCEDENCIA, no por tener temas.
           -- Mirar si hay unidades hacía que la segunda corrida tratara como
           -- real lo que la primera había generado, y le pisaba los pesos
           -- curados con pesos derivados de un hash. El importador de programas
           -- oficiales escribe institution; este script escribe inference.
           -- (Sin backticks: esto vive dentro de un template literal.)
           (exists (select 1 from resource r0
                     where r0.offering_id = o.id and r0.source_type = 'institution'))::text as real,
           string_agg(t.name, chr(1) order by t.sequence nulls last, t.name) as temas
      from course c2
      join course_offering o on o.course_id = c2.id
      join topic t on t.offering_id = o.id and t.retired_at is null
     where c2.curriculum_plan_id = ${lit(PLAN)}
     group by c2.code, o.id, o.term, o.commission
     order by c2.code, o.term desc
  )
  select cr.code || chr(9) || cr.label || chr(9) || coalesce(cr.curriculum_year, 3) || chr(9) ||
         coalesce(of.term, '') || chr(9) || coalesce(of.commission, '') || chr(9) ||
         coalesce(of.real, 'false') || chr(9) || coalesce(of.temas, '')
    from curriculum_requirement cr
    left join oferta of on of.code = cr.code
   where cr.curriculum_plan_id = ${lit(PLAN)} and cr.requirement_type = 'COURSE'
   order by cr.curriculum_year nulls last, cr.label;`)
  .split("\n")
  .filter(Boolean)
  .map((l) => {
    const [code, label, anio, term, commission, real, temas] = l.split("\t");
    return {
      code,
      label,
      anio: Number(anio),
      // ⚠️ **Siempre el período del alta**, venga lo que venga de la base.
      // `confirmar_mapa_academico()` crea la cursada del estudiante con
      // `(course, term, NULL)` usando el período que él eligió; ingerir en
      // otro deja el contenido en una cursada y al estudiante en otra vacía.
      term: PERIODO,
      commission: null,
      // Lo que la base tenía, sólo para el informe.
      termPrevio: term || null,
      catedraPrevia: commission || null,
      real: real === "true",
      reales: temas ? temas.split(SEPARADOR) : [],
    };
  });

// ── Armado ───────────────────────────────────────────────────────────────────

const plan = [];
const sinReceta = [];

for (const m of filas) {
  const r = azar(semilla(m.code));
  // Real = su material lo declaró la institución. Ver la nota de la consulta.
  const tieneReales = m.real;

  let unidades;
  if (tieneReales) {
    // Se conservan tal cual y **sólo se les agrega el peso**, que es estimado.
    unidades = m.reales.map((nombre, i) => ({
      codigo: `U${i + 1}`,
      nombre,
      orden: i + 1,
      peso: 1 + Math.floor(azar(semilla(m.code + nombre))() * 3),
    }));
  } else {
    const receta = TEMARIOS[m.code];
    if (!receta) {
      sinReceta.push(`${m.code}  ${m.label}`);
      continue;
    }
    unidades = receta.map((entrada, i) => {
      const [nombre, peso] = entrada.split("|");
      return { codigo: `U${i + 1}`, nombre, orden: i + 1, peso: Number(peso) };
    });
  }

  // ── El calendario ────────────────────────────────────────────────────────
  //
  // ⚠️ **Una unidad pesada ocupa más clases, y ésa es la única forma de que el
  // peso se note.** `minutosPorTema()` reparte los minutos **observados** entre
  // los temas que cada sesión cubrió; con una clase por unidad, todas salían
  // con los mismos 120 minutos y el peso no cambiaba nada — medido.
  //
  // Dándole `peso` clases a cada unidad, los minutos por tema quedan
  // proporcionales al peso **sin que nadie los declare a mano**, y de paso el
  // Gantt muestra barras más largas donde la materia realmente se demora.
  const horaBase = 8 + Math.floor(r() * 6) * 2;
  const clases = [];
  for (const u of unidades) {
    for (let k = 0; k < u.peso; k++) {
      clases.push({
        hora: `${String(horaBase).padStart(2, "0")}:00`,
        minutos: 120,
        corrida: clases.length % 3 === 2 ? "practico" : "teorico",
        temas: [u.nombre],
      });
    }
  }
  // Se fechan al final, hacia atrás desde esta semana: así la última clase cae
  // cerca de hoy y el eje del período las contiene.
  const primerDia = -7 * clases.length;
  clases.forEach((c, i) => {
    c.fecha = dia(HOY, primerDia + i * 7);
  });

  // La evaluación, entre +3 y +38 días. La variedad es a propósito: el índice
  // ordena por proximidad y con todas iguales no se vería.
  const evalDia = 3 + Math.floor(r() * 35);
  const base = EVALUACION_POR_ANIO[m.anio] ?? EVALUACION_POR_ANIO[3];
  const evaluacion = { ...base, fecha: dia(HOY, evalDia) };

  // El horario semanal publicado. Se **declara**; no se deriva de las clases,
  // aunque coincida (ADR-063).
  const diaSemana = 1 + Math.floor(r() * 5);
  const horarios = [
    { dia: diaSemana, desde: `${String(horaBase).padStart(2, "0")}:00`, hasta: `${String(horaBase + 2).padStart(2, "0")}:00` },
  ];

  // La carga del programa es la que el calendario dicta; el estudio se estima
  // en la mitad de eso. Los dos van juntos o no van (`carga_declarada_completa`).
  const cargaMin = clases.length * 120;
  const estudioMin = Math.round(cargaMin / 2);

  plan.push({ ...m, tieneReales, unidades, clases, evaluacion, horarios, cargaMin, estudioMin, evalDia });
}

console.log(`\n→ ${filas.length} materias del Plan 2016`);
console.log(`   con temario real (se les agrega calendario y pesos) : ${plan.filter((m) => m.tieneReales).length}`);
console.log(`   sin temario (se les genera todo)                    : ${plan.filter((m) => !m.tieneReales).length}`);
if (sinReceta.length > 0) {
  console.log(`\n   ⚠ sin receta escrita, quedan vacías:`);
  for (const s of sinReceta) console.log(`   · ${s}`);
}

if (!APLICAR) {
  console.log(`\n   Simulacro: nada se escribió. Agregá --aplicar.\n`);
  process.exit(0);
}

// ── Escritura ────────────────────────────────────────────────────────────────

console.log(`\n→ Ingiriendo (source_type = 'inference', todo unverified)\n`);
let ok = 0;
let fallos = 0;

for (const m of plan) {
  const ref = `estimado-por-achieve:${m.code}`;
  const off = unaFila(
    sql(`select cursada_id from public.ingerir_materia(
           ${lit(INST)}, 'inference', ${lit(ref)}, now(), 0.4,
           ${lit(m.code)}, ${lit(m.label)}, ${lit(m.term)},
           ${m.commission ? lit(m.commission) : "NULL"},
           ${lit(JSON.stringify(m.unidades))}::jsonb, '[]'::jsonb,
           ${lit(JSON.stringify([m.evaluacion]))}::jsonb, ${lit(PLAN)},
           ${lit(JSON.stringify(m.clases))}::jsonb,
           ${m.cargaMin}, 'estimado por Achieve', ${m.estudioMin}, 'estimado por Achieve',
           p_horarios => ${lit(JSON.stringify(m.horarios))}::jsonb);`),
  );
  if (!esUuid(off)) {
    console.log(`   ✗ ${m.label} — ${off}`);
    fallos++;
    continue;
  }

  // ⚠️ **A una materia con temario real NO se le tocan los recursos.** Los suyos
  // dicen `institution` porque salieron del programa oficial; pisarlos con
  // `inference` la haría pasar por completamente inventada.
  if (!m.tieneReales) {
    sql(`delete from resource where offering_id = ${lit(off)};
         insert into resource (offering_id, topic_id, resource_type, title,
                               source_type, source_ref, rights_status)
         select ${lit(off)}, t.id, 'apunte', 'Material de ' || t.name,
                'inference', ${lit(ref)}, 'unknown'
           from topic t where t.offering_id = ${lit(off)} and t.retired_at is null;`);
  }

  // El alcance de la evaluación se **declara**: no se infiere que cubre todo.
  // Las dos terceras partes del temario, que es lo que suele entrar en un parcial.
  const alcance = Math.max(1, Math.ceil((m.unidades.length * 2) / 3));
  sql(`insert into assessment_topic (assessment_id, topic_id)
       select a.id, t.id from assessment a, topic t
        where a.offering_id = ${lit(off)} and t.offering_id = ${lit(off)}
          and t.retired_at is null and t.sequence <= ${alcance}
       on conflict do nothing;`);

  const marca = m.tieneReales ? "calendario" : "todo";
  console.log(`   ✓ ${m.label.padEnd(42)} ${String(m.unidades.length).padStart(2)} unid · ${marca} · eval +${m.evalDia}d`);
  ok++;
}

console.log(`\n   ${ok} materias completadas, ${fallos} con error.\n`);

// ── Una fila de padrón, y nada más · ADR-086 ─────────────────────────────────
//
// El estudiante **no se inscribe desde acá**: se da de alta por pantalla y elige
// sus materias, que es lo que el owner pidió. Lo único que hace falta sembrar es
// lo que en producción provee el CRM — que la persona **esté habilitada**.
//
// Sin esta fila, `/login` contesta `403 SIN_PADRON`: la identidad es válida y no
// hay `student`. Con ella y sin nada más, el alta arranca en su primer paso.
//
// ⚠️ **No se le pone consentimiento, ni carrera, ni disponibilidad.** Ponérselos
// saltearía justamente el recorrido que queremos probar.
if (process.argv.includes("--padron")) {
  const ALUMNO = "a5000000-0000-0000-0000-000000000003";
  const previo = unaFila(
    sql(`select coalesce(auth_user_id::text, '') from student where id = ${lit(ALUMNO)};`),
  );
  sql(`insert into student (id, institution_id, timezone, auth_user_id)
       values (${lit(ALUMNO)}, ${lit(INST)}, 'America/Argentina/Cordoba',
               nullif(${lit(previo)}, '')::uuid)
       on conflict (id) do update set institution_id = excluded.institution_id;`);
  const hay = unaFila(sql(`select count(*) from student where id = ${lit(ALUMNO)};`));
  console.log(hay === "1"
    ? `→ Padrón: un estudiante habilitado en la UCC, con el alta por recorrer.\n`
    : `   ✗ no se pudo sembrar el padrón: ${hay}\n`);
}
