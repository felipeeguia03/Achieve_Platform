#!/usr/bin/env node
/**
 * Achieve Platform · Etapa B4.2 — corre el reloj del lifecycle.
 *
 * La otra mitad de la ejecución operativa: `POST /api/reloj` es la que llama un
 * scheduler; ésta es la que se corre a mano, en la demo y en desarrollo.
 *
 * Llama al endpoint en vez de importar el Service **a propósito**: así lo que se
 * ejercita en la demo es exactamente el mismo camino que va a correr en
 * producción —incluida la autenticación—, y no una variante que funciona sólo
 * acá.
 *
 * Uso:  npm run reloj -- <institution-id>
 */
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
    // Sin `.env.local` el script sigue: puede venir del entorno del proceso.
  }
  return { ...vars, ...process.env };
}

const env = entorno();
const institucion = process.argv[2] ?? env.DEMO_INSTITUTION_ID;
const base = env.RELOJ_BASE_URL ?? "http://localhost:3000";
const secreto = env.RELOJ_SHARED_SECRET;

if (!institucion) {
  console.error("✗ Falta la institución.  Uso: npm run reloj -- <institution-id>");
  process.exit(1);
}
if (!secreto) {
  console.error("✗ Falta RELOJ_SHARED_SECRET en .env.local. El endpoint no se abre sin él.");
  process.exit(1);
}

const url = `${base}/api/reloj?institucion=${encodeURIComponent(institucion)}`;
const r = await fetch(url, {
  method: "POST",
  headers: { Authorization: `Bearer ${secreto}` },
});

if (!r.ok) {
  console.error(`✗ ${r.status} — ${await r.text()}`);
  process.exit(1);
}

const { vencidos, incumplidos, conflictos } = await r.json();
console.log(`✓ Reloj corrido sobre ${institucion}`);
console.log(`   ${vencidos} vencidos (→ DUE) · ${incumplidos} incumplidos (→ MISSED)`);
// Un conflicto no es un error: es que el estudiante movió su compromiso
// mientras el reloj corría, y le ganó. La próxima corrida ve el estado nuevo.
console.log(`   ${conflictos} conflictos — el estudiante le ganó al reloj, y está bien`);
