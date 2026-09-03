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
 * Después de cerrar la acción invoca el ADE para materializar la siguiente.
 * **Es un paso derivado y reintentable, no parte del cierre**: si el ADE falla,
 * la acción quedó completada igual y `npm run recomendar` lo repara. Acoplar la
 * validez del cierre al éxito del ADE haría que un motor caído deshiciera un
 * hecho que ya ocurrió.
 *
 * Uso:
 *   npm run validar -- <institution-id> <evidence-id> practice=19
 *   npm run validar -- <institution-id> <evidence-id> --sin-cambio "todavía no alcanza"
 *   npm run validar -- <institution-id> <evidence-id> --insuficiente
 *   npm run validar -- <institution-id> <evidence-id> practice=19 --cursada <uuid>
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
const insuficiente = resto.includes("--insuficiente");
const iCursada = resto.indexOf("--cursada");
const cursada = iCursada !== -1 ? resto[iCursada + 1] : env.DEMO_COURSE_ENROLLMENT_ID;

// `practice=19` o `practice=19:19 ejercicios` — el texto es lo que se muestra.
const cambios = resto
  .filter((a) => a.includes("=") && !a.startsWith("--"))
  .map((a) => {
    const [dimension, crudo] = a.split("=");
    const [valor, texto] = crudo.split(":");
    return { dimension, valor: Number(valor), ...(texto ? { texto } : {}) };
  });

if (!insuficiente && !sinCambio && cambios.length === 0) {
  console.error("✗ Declará al menos una dimensión (`practice=19`) o pasá `--sin-cambio \"razón\"`.");
  console.error("   I10: una entrada que no dice qué cambió ni afirma un no-cambio no dice nada.");
  process.exit(1);
}

const r = await fetch(`${base}/api/validacion`, {
  method: "POST",
  headers: { Authorization: `Bearer ${secreto}`, "Content-Type": "application/json" },
  body: JSON.stringify({
    institucion,
    evidencia,
    cambios,
    sinCambio,
    razon,
    suficiente: !insuficiente,
  }),
});
const cuerpo = await r.json().catch(() => null);

if (!r.ok) {
  console.error(`✗ ${r.status} — ${JSON.stringify(cuerpo)}`);
  process.exit(1);
}

if (cuerpo.suficiente === false) {
  console.log("· Evidencia insuficiente. La Action sigue COMMITTED, esperando otra entrega.");
  console.log("   La entrega anterior se conserva sin tocar.");
  process.exit(0);
}

console.log(cuerpo.yaEstaba ? "· Ya estaba validada. Nada que cambiar." : "✓ Evidencia validada");
console.log(`   progreso: ${cuerpo.progreso?.estado}${cuerpo.progreso?.duplicado ? " (ya registrado)" : ""}`);
console.log(`   Action ${cuerpo.accion}: ${cuerpo.accionCompletada ? "COMPLETED" : "⚠ no quedó completada"}`);

/*
  El ADE, **después** del cierre. Su resultado no cambia lo que ya pasó: si
  falla, la acción sigue completada y esto lo dice en vez de esconderlo.
*/
if (!cuerpo.accionCompletada) {
  console.log("   No se pide la siguiente acción: la anterior no cerró.");
  process.exit(0);
}
if (!cursada) {
  console.log("⚠ Cierre correcto, pero no sé sobre qué cursada pedir la siguiente acción.");
  console.log("   Pasá `--cursada <uuid>` o corré `npm run recomendar` cuando quieras.");
  process.exit(0);
}

try {
  const siguiente = await fetch(
    `${base}/api/recomendacion?institucion=${encodeURIComponent(institucion)}&cursada=${encodeURIComponent(cursada)}`,
    { method: "POST", headers: { Authorization: `Bearer ${secreto}` } },
  );
  const rec = await siguiente.json().catch(() => null);
  if (siguiente.ok && rec?.estado === "RECOMENDADA") {
    console.log(`✓ Siguiente acción materializada — ${rec.actionId}`);
  } else if (siguiente.ok) {
    console.log(`· El ADE no propuso otra: ${rec?.motivo ?? rec?.estado} ${rec?.detalle ?? ""}`.trim());
  } else {
    console.log(`⚠ Cierre correcto, pero el ADE falló (${siguiente.status}).`);
    console.log("   La acción quedó completada. Reparalo con `npm run recomendar`.");
  }
} catch (e) {
  console.log(`⚠ Cierre correcto, pero no se pudo llamar al ADE: ${e.message}`);
  console.log("   La acción quedó completada. Reparalo con `npm run recomendar`.");
}

console.log("   Abrí http://localhost:3000/hoy para ver la siguiente.");
