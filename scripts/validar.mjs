#!/usr/bin/env node
/**
 * Achieve Platform — valida una evidencia entregada, para la demo sintética.
 *
 * Autorizado por el CTO junto con D4·A: **el JWT del estudiante nunca valida su
 * propia evidencia**, así que esto usa el mismo secreto de servicio que el
 * reloj y llama al endpoint, no al Service. Lo que se ejercita en la demo es el
 * camino real, autenticación incluida.
 *
 * Sin `--sin-cambio` hay que declarar al menos una dimensión: `I10` rechaza una
 * entrada que no dice qué cambió ni afirma que no cambió nada.
 *
 * Uso:
 *   npm run validar -- <institution-id> <evidence-id> practice=19
 *   npm run validar -- <institution-id> <evidence-id> --sin-cambio "todavía no alcanza"
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
const base = env.RELOJ_BASE_URL ?? "http://localhost:3000";
const secreto = env.RELOJ_SHARED_SECRET;

if (!institucion || !evidencia) {
  console.error("✗ Uso: npm run validar -- <institution-id> <evidence-id> [dimension=valor ...] [--sin-cambio \"razón\"]");
  process.exit(1);
}
if (!secreto) {
  console.error("✗ Falta RELOJ_SHARED_SECRET en .env.local. El endpoint no se abre sin él.");
  process.exit(1);
}

const iSinCambio = resto.indexOf("--sin-cambio");
const sinCambio = iSinCambio !== -1;
const razon = sinCambio ? (resto[iSinCambio + 1] ?? null) : null;

// `practice=19` o `practice=19:19 ejercicios` — el texto es lo que se muestra.
const cambios = resto
  .filter((a) => a.includes("=") && !a.startsWith("--"))
  .map((a) => {
    const [dimension, crudo] = a.split("=");
    const [valor, texto] = crudo.split(":");
    return { dimension, valor: Number(valor), ...(texto ? { texto } : {}) };
  });

if (!sinCambio && cambios.length === 0) {
  console.error("✗ Declará al menos una dimensión (`practice=19`) o pasá `--sin-cambio \"razón\"`.");
  console.error("   I10: una entrada que no dice qué cambió ni afirma un no-cambio no dice nada.");
  process.exit(1);
}

const r = await fetch(`${base}/api/validacion`, {
  method: "POST",
  headers: { Authorization: `Bearer ${secreto}`, "Content-Type": "application/json" },
  body: JSON.stringify({ institucion, evidencia, cambios, sinCambio, razon }),
});
const cuerpo = await r.json().catch(() => null);

if (!r.ok) {
  console.error(`✗ ${r.status} — ${JSON.stringify(cuerpo)}`);
  process.exit(1);
}

console.log(cuerpo.yaEstaba ? "· Ya estaba validada. Nada que cambiar." : "✓ Evidencia validada");
console.log(`   progreso: ${cuerpo.progreso?.estado}${cuerpo.progreso?.duplicado ? " (ya registrado)" : ""}`);
console.log("   Abrí http://localhost:3000/progreso para verlo proyectado.");
