#!/usr/bin/env node
/**
 * Achieve Platform · Etapa B2.6 — alta de la sesión sintética.
 *
 * La identidad del estudiante sintético se da de alta **fuera del producto**,
 * acá. Desde [ADR-039](../docs/decisions.md#adr-039) hay pantalla de ingreso,
 * pero **no ofrece crear una cuenta**: quién puede entrar lo decide el padrón
 * del CRM, y un alta desde el formulario sería el camino por el que una persona
 * real entraría sin padrón. Así que el alta sigue viviendo acá, y lo que este
 * script deja listo son **las credenciales que alguien escribe en `/login`**.
 *
 * Qué hace:
 *
 *   1. Crea (o reusa) un usuario en `auth.users` con email y contraseña.
 *   2. Lo ata al `student` sintético que dejó `db:demo`, poniendo
 *      `student.auth_user_id`.
 *
 * Sin el paso 2 el login funciona y `/api/*` devuelve `403 SIN_PADRON`: la
 * identidad es válida y no hay `student` en el padrón. Es exactamente el caso
 * que `student.auth_user_id NULL` admite a propósito.
 *
 * ⚠️ **Datos sintéticos, y sólo eso.** El estudiante no es una persona.
 * [ADR-006](../docs/decisions.md#adr-006) sigue `PENDING` y dar de alta a
 * alguien real por acá es procesar dato personal.
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";

/**
 * Los dos `student` que siembra `scripts/db-demo.sh`.
 *
 * El segundo existe desde la Fase B6.14: es el **recién habilitado**, sin
 * consentimiento, sin carrera y sin materias. Es con el que se recorre el alta
 * ([ADR-052](../docs/decisions.md#adr-052)); el primero ya la tiene completa y
 * entra directo a `HOY`.
 */
const IDENTIDADES = [
  {
    id: "a5000000-0000-0000-0000-000000000001",
    email: "estudiante.sintetico@achieve.local",
    password: "achieve-demo-sintetica",
    rotulo: "con el alta completa · entra a HOY",
  },
  {
    id: "a5000000-0000-0000-0000-000000000002",
    email: "estudiante.nuevo@achieve.local",
    password: "achieve-demo-alta",
    rotulo: "recién habilitado · recorre el alta",
  },
  // El tercero **no lo siembra `db:demo`**: lo crea
  // `scripts/importar-temarios.mjs --estudiante`, y vive en la UCC, no en
  // `SYN-U`. Si no corriste el importador, este `student` no existe y la
  // atadura se saltea sola.
  {
    id: "a5000000-0000-0000-0000-000000000003",
    email: "estudiante.ucc@achieve.local",
    password: "achieve-demo-ucc",
    rotulo: "temarios reales de la UCC · 6 materias",
    opcional: true,
  },
];

// `.env.local` a mano: este script corre fuera de Next, que es quien
// normalmente lo carga.
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

/**
 * El proveedor de auth **tarda en volver después de `db:reset`**.
 *
 * `supabase db reset` reinicia los contenedores, y durante unos segundos el
 * gateway contesta *"An invalid response was received from the upstream
 * server"*: no es que la identidad no exista, es que auth todavía no está
 * atendiendo. Sin esta espera el script fallaba y había que volver a correrlo
 * a mano — o peor, parecía un problema del padrón.
 *
 * Se reintenta con espera creciente y **se distingue del error real**: si
 * después de todos los intentos sigue sin responder, lo dice como lo que es.
 */
async function conEspera(descripcion, intentar) {
  const ESPERAS = [0, 1000, 2000, 3000, 5000, 8000];
  let ultimo;
  for (const espera of ESPERAS) {
    if (espera > 0) await new Promise((r) => setTimeout(r, espera));
    const { data, error } = await intentar();
    if (!error) return { data, error: null };
    ultimo = error;
    // Sólo se reintenta lo que parece el gateway todavía levantándose. Un
    // error de verdad —credenciales, permisos— no mejora esperando.
    if (!/upstream|fetch failed|ECONNREFUSED|502|503|504/i.test(error.message ?? "")) break;
    if (espera === 0) console.log(`   … esperando a que el proveedor de auth vuelva (${descripcion})`);
  }
  return { data: null, error: ultimo };
}

// Idempotente: correrlo dos veces no crea dos identidades. Si el usuario ya
// existe se reusa, porque el email es único en `auth.users`.
console.log("✓ Sesiones sintéticas listas\n");

for (const identidad of IDENTIDADES) {
  // ⚠️ Una identidad `opcional` cuyo `student` no está **se saltea entera**, y
  // no se crea el usuario de auth. Sin esto quedaba una cuenta que entra a
  // `/login`, pasa la contraseña y choca contra `403 SIN_PADRON`: el peor de
  // los tres estados, porque parece un problema de permisos y es una fila que
  // no existe. El `.update()` de abajo no lo detecta — cero filas no es error.
  if (identidad.opcional) {
    const { data: existe } = await admin
      .from("student")
      .select("id")
      .eq("id", identidad.id)
      .maybeSingle();
    if (!existe) {
      console.log(`   (se saltea ${identidad.email}: su student no está sembrado)\n`);
      continue;
    }
  }

  const { data: creado, error } = await conEspera(identidad.email, () =>
    admin.auth.admin.createUser({
      email: identidad.email,
      password: identidad.password,
      email_confirm: true,
    }),
  );

  let authUserId = creado?.user?.id;
  if (error) {
    // El caso normal: el usuario ya existía. El email es único en `auth.users`.
    const { data: lista } = await conEspera("listado", () => admin.auth.admin.listUsers());
    authUserId = lista?.users?.find((u) => u.email === identidad.email)?.id;
    if (!authUserId) {
      console.error(`✗ No se pudo crear ni encontrar la identidad: ${error.message}`);
      if (/upstream|fetch failed|ECONNREFUSED/i.test(error.message ?? "")) {
        console.error("  El proveedor de auth no está respondiendo. Suele pasar justo después de");
        console.error("  `db:reset`. Probá de nuevo, o:");
        console.error("  docker restart supabase_auth_achieve-platform supabase_kong_achieve-platform");
      }
      process.exit(1);
    }
  }

  const { error: ataduraFallida } = await admin
    .from("student")
    .update({ auth_user_id: authUserId })
    .eq("id", identidad.id);

  if (ataduraFallida) {
    console.error(`✗ No se pudo atar la identidad al padrón: ${ataduraFallida.message}`);
    console.error("  ¿Corriste 'npm run db:demo' antes? Los student los siembra ese script.");
    process.exit(1);
  }

  console.log(`   ${identidad.email}`);
  console.log(`   ${identidad.password}`);
  console.log(`   → ${identidad.rotulo}\n`);
}

console.log("   Se escriben en /login: desde ADR-039 el navegador ya no abre sesión solo.");
