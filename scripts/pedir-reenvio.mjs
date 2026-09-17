#!/usr/bin/env node
/**
 * Achieve Platform — pide que una entrega insuficiente se vuelva a presentar.
 *
 * Etapa B6.9.2. Es **del que evalúa**, no del estudiante, así que va con el
 * mismo secreto de servicio que `npm run validar` y llama al endpoint, no al
 * Service: lo que se ejercita en la demo es el camino real.
 *
 * El motivo es obligatorio. Sin él el estudiante recibe *"volvé a entregarla"*
 * y ninguna pista de qué corregir.
 *
 * Uso:  npm run pedir-reenvio -- <institution-id> <evidence-id> "<motivo>"
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
const [institucion, evidencia, ...resto] = process.argv.slice(2);
const motivo = resto.join(" ").trim();
const base = env.RELOJ_BASE_URL ?? "http://localhost:3000";
const secreto = env.RELOJ_SHARED_SECRET;

if (!institucion || !evidencia || !motivo) {
  console.error('✗ Uso: npm run pedir-reenvio -- <institution-id> <evidence-id> "<motivo>"');
  process.exit(1);
}
if (!secreto) {
  console.error("✗ Falta RELOJ_SHARED_SECRET en .env.local");
  process.exit(1);
}

const r = await fetch(`${base}/api/pedido-de-reenvio`, {
  method: "POST",
  headers: { Authorization: `Bearer ${secreto}`, "Content-Type": "application/json" },
  body: JSON.stringify({ institucionId: institucion, evidenciaId: evidencia, motivo }),
});

const cuerpo = await r.json().catch(() => ({}));
if (!r.ok) {
  console.error(`✗ ${r.status} — ${cuerpo.error ?? "sin detalle"}`);
  process.exit(1);
}

console.log("✓ Reenvío pedido");
console.log(`   evidencia ${cuerpo.evidencia}: ${cuerpo.estado}`);
console.log(`   motivo: ${motivo}`);
console.log("   El estudiante ya puede volver a entregar desde UX05.");
