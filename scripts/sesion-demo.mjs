#!/usr/bin/env node
/**
 * Achieve Platform · Etapa B2.6 — alta de la sesión sintética.
 *
 * El spec tiene nueve superficies y **ninguna es un login**. Inventar una sería
 * romper la regla 1 de `AGENTS.md`, así que la identidad del estudiante
 * sintético se da de alta **fuera del producto**, acá.
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

// El `student` que siembra `scripts/db-demo.sh`.
const ESTUDIANTE = "a5000000-0000-0000-0000-000000000001";
const EMAIL = "estudiante.sintetico@achieve.local";
const PASSWORD = "achieve-demo-sintetica";

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

// Idempotente: correrlo dos veces no crea dos identidades. Si el usuario ya
// existe se reusa, porque el email es único en `auth.users`.
let { data: creado, error } = await admin.auth.admin.createUser({
  email: EMAIL,
  password: PASSWORD,
  email_confirm: true,
});

let authUserId = creado?.user?.id;
if (error) {
  const { data: lista } = await admin.auth.admin.listUsers();
  authUserId = lista?.users?.find((u) => u.email === EMAIL)?.id;
  if (!authUserId) {
    console.error(`✗ No se pudo crear ni encontrar la identidad: ${error.message}`);
    process.exit(1);
  }
  console.log("→ La identidad ya existía, se reusa");
}

const { error: ataduraFallida } = await admin
  .from("student")
  .update({ auth_user_id: authUserId })
  .eq("id", ESTUDIANTE);

if (ataduraFallida) {
  console.error(`✗ No se pudo atar la identidad al padrón: ${ataduraFallida.message}`);
  console.error("  ¿Corriste 'npm run db:demo' antes? El student sintético lo siembra ese script.");
  process.exit(1);
}

console.log("✓ Sesión sintética lista");
console.log(`   email:    ${EMAIL}`);
console.log(`   password: ${PASSWORD}`);
console.log("   Poné las dos en .env.local como NEXT_PUBLIC_DEMO_EMAIL y NEXT_PUBLIC_DEMO_PASSWORD.");
