#!/usr/bin/env node
/**
 * Achieve Platform — corre el ADE sobre una cursada.
 *
 * La otra mitad de la ejecución operativa del Engine, igual que
 * `scripts/reloj.mjs` para el reloj: `POST /api/recomendacion` es la que
 * llamaría un scheduler; ésta es la que se corre a mano, en la demo y en
 * desarrollo.
 *
 * Llama al endpoint en vez de importar el Service **a propósito**: lo que se
 * ejercita en la demo es exactamente el mismo camino que correría en
 * producción, autenticación incluida.
 *
 * Uso:  npm run recomendar -- <institution-id> <course-enrollment-id>
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
const cursada = process.argv[3] ?? env.DEMO_COURSE_ENROLLMENT_ID;
const base = env.RELOJ_BASE_URL ?? "http://localhost:3000";
const secreto = env.RELOJ_SHARED_SECRET;

if (!institucion || !cursada) {
  console.error("✗ Faltan argumentos.  Uso: npm run recomendar -- <institution-id> <course-enrollment-id>");
  process.exit(1);
}
if (!secreto) {
  console.error("✗ Falta RELOJ_SHARED_SECRET en .env.local. El endpoint no se abre sin él.");
  process.exit(1);
}

const url =
  `${base}/api/recomendacion?institucion=${encodeURIComponent(institucion)}` +
  `&cursada=${encodeURIComponent(cursada)}`;
const r = await fetch(url, { method: "POST", headers: { Authorization: `Bearer ${secreto}` } });
const cuerpo = await r.json().catch(() => null);

if (!r.ok && r.status !== 200) {
  console.error(`✗ ${r.status} — ${JSON.stringify(cuerpo)}`);
  process.exit(1);
}

// Cada rama se informa como lo que es. **Ninguna de las cuatro últimas es una
// falla del script**: son respuestas del contrato del Engine.
switch (cuerpo?.estado) {
  case "RECOMENDADA":
    console.log(`✓ Recomendada — Action ${cuerpo.actionId}`);
    console.log("   Abrí http://localhost:3000/hoy para verla proyectada.");
    break;
  case "SIN_RECOMENDACION":
    console.log(`· Sin recomendación (${cuerpo.motivo}) — ${cuerpo.detalle}`);
    break;
  case "CONFLICTO":
    console.log("· Otra corrida se adelantó. No se apilan dos Actions.");
    break;
  case "RECHAZADA_POR_VALIDADOR":
    console.log(`· El validador la rechazó: ${cuerpo.campo} afirma «${cuerpo.afirma}».`);
    console.log("   Lo que no se puede mostrar no se persiste. Es la rama ERROR funcionando.");
    break;
  case "PENDIENTE":
    console.log(`· Pendiente — ${cuerpo.detalle}`);
    break;
  default:
    console.log(JSON.stringify(cuerpo));
}
