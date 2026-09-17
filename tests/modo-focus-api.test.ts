/**
 * Modo Focus — las fronteras de la API, la migración y el anotador ·
 * [ADR-104](../docs/decisions.md#adr-104).
 *
 * El comportamiento lo prueban `servicio-focus.test.ts` (en memoria) y
 * `scripts/db-aislamiento.sh` (contra Postgres). Esto protege lo que un refactor
 * rompe sin que ningún test de comportamiento se entere: **las ausencias**.
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

import { catalogoP0, EXTENSIONES } from "@/lib/domain/product-events";
import { tituloDeHecho } from "@/lib/content/bitacora";
import { copy } from "@/lib/content/es-AR";
import { ctaRegistry } from "@/lib/navigation/cta-registry";
import { nodos, superficieIds } from "@/lib/navigation/surfaces";
import { objetoEnPantalla } from "@/lib/navigation/objeto-en-pantalla";
import { aEntradaVisible } from "@/lib/server/servicios/hechos";

const LEER = (p: string) => readFileSync(resolve(process.cwd(), p), "utf8");
const codigo = (ts: string) => ts.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
const sinComentariosSql = (sql: string) => sql.replace(/^\s*--.*$/gm, "");

const RUTAS = [
  "app/api/focus/route.ts",
  "app/api/focus/comando/route.ts",
  "app/api/focus/fin/route.ts",
  "app/api/focus/anotador/route.ts",
  "app/api/focus/preferencias/route.ts",
];
const HTTP = LEER("lib/server/focus-http.ts");
const SERVICIO = LEER("lib/server/servicios/focus.ts");
const REPO = LEER("lib/server/repositorios/focus.ts");
const MIGRACION = sinComentariosSql(LEER("supabase/migrations/20261022000000_modo_focus.sql"));

describe("cada ruta de Modo Focus", () => {
  it("la sesión, el padrón y el alta se resuelven en un solo lugar", () => {
    expect(HTTP).toContain("resolverSesion(tokenDelHeader(");
    expect(HTTP).toContain("{ status: 401 }");
    expect(HTTP).toContain("{ status: 403 }");
    expect(HTTP).toContain("altaPendiente(");
  });

  for (const ruta of RUTAS) {
    const fuente = LEER(ruta);
    it(`${ruta}: pasa por la sesión antes que nada`, () => {
      expect(fuente).toContain("estudianteDeFocus(request)");
    });
    it(`${ruta}: el estudiante sale de la sesión, nunca del pedido`, () => {
      expect(codigo(fuente)).not.toMatch(/cuerpo\??\.(estudiante|studentId|institucion|institutionId)\b/);
    });
    it(`${ruta}: no habla con la base`, () => {
      expect(fuente).not.toMatch(/supabase|clienteDeServicio/);
    });
    it(`${ruta}: ningún instante viaja desde el cliente`, () => {
      expect(codigo(fuente)).not.toMatch(/cuerpo\??\.(ahora|inicio|fin|segundos|instante|latido)\b/);
    });
  }
});

describe("ADR-104 · lo que Modo Focus no produce", () => {
  it("no escribe Evidence, progreso ni cierra el compromiso", () => {
    const c = codigo(SERVICIO + REPO);
    expect(c).not.toMatch(/from\("(evidence|progress_entry|topic_progress|reflection)"\)/);
    expect(c).not.toMatch(/registrar_progreso|ProgressUpdated|EvidenceSubmitted/);
    // Ninguna transición a `COMPLETED` sale del Service (el Repository sí
    // nombra los estados terminales, pero para **leer**).
    expect(codigo(SERVICIO)).not.toMatch(/"COMPLETED"/);
    // Ni `action` ni `commitment` se escriben desde acá: van por sus Services.
    expect(c).not.toMatch(/from\("(action|commitment)"\)\s*\.(insert|update|upsert|delete)/);
  });

  it("sólo se publican los dos eventos declarados", () => {
    const publicados = [...SERVICIO.matchAll(/nombre:\s*"([A-Za-z]+)"/g)].map((m) => m[1]);
    expect([...new Set(publicados)].sort()).toEqual(["FocusSessionEnded", "FocusSessionStarted"]);
    expect(EXTENSIONES.FocusSessionStarted).toMatchObject({ nivel: "TRANSICION", enBitacora: false });
    expect(EXTENSIONES.FocusSessionEnded).toMatchObject({ nivel: "TRANSICION", enBitacora: true });
    expect(catalogoP0.FocusSessionEnded).toBeUndefined();
  });
});

describe("ADR-104 §12 · el anotador es privado", () => {
  it("ningún evento lleva el anotador", () => {
    const publicar = codigo(SERVICIO).match(/publicar\(\{[\s\S]*?\}\)/g) ?? [];
    expect(publicar.length).toBeGreaterThan(0);
    for (const p of publicar) expect(p).not.toMatch(/anotador|scratchpad|payload/);
  });

  it("`hechos_de_cursada()` no lee `scratchpad`", () => {
    const hechos = MIGRACION.slice(MIGRACION.indexOf("CREATE FUNCTION public.hechos_de_cursada"));
    const cuerpo = hechos.slice(0, hechos.indexOf("$$;"));
    expect(cuerpo).toContain("fs.advance_text");
    expect(cuerpo).not.toMatch(/scratchpad/);
  });

  it("no va a `localStorage`", () => {
    for (const p of ["components/superficies/focus.tsx", "components/screens/modo-focus.tsx", "lib/client/focus/audio.ts", "lib/client/focus/al-irse.ts"]) {
      expect(codigo(LEER(p)), p).not.toMatch(/localStorage|sessionStorage|indexedDB/);
    }
  });

  it("la pantalla no hace red: la superficie llama a la API", () => {
    expect(codigo(LEER("components/screens/modo-focus.tsx"))).not.toMatch(/fetch\(|enviar\(|pedir\(/);
  });
});

describe("ADR-104 · la migración", () => {
  it("una sola sesión abierta y un solo tramo abierto", () => {
    expect(MIGRACION).toMatch(/CREATE UNIQUE INDEX focus_session_una_abierta\s+ON focus_session \(student_id\) WHERE status = 'OPEN'/);
    expect(MIGRACION).toMatch(/CREATE UNIQUE INDEX focus_segment_uno_abierto\s+ON focus_segment \(focus_session_id\) WHERE ended_at IS NULL/);
  });

  it("sin evidencia, sin estado de minimizado y sin recuperación persistida", () => {
    const tablas = MIGRACION.slice(MIGRACION.indexOf("CREATE TABLE focus_session"), MIGRACION.indexOf("CREATE OR REPLACE FUNCTION public.empezar_sesion_de_focus"));
    expect(tablas).not.toMatch(/evidence_id|MINIMIZED|RECOVERY/);
  });

  it("las tres tablas nuevas tienen RLS y entran a `limpiar_mundo`", () => {
    for (const t of ["focus_session", "focus_segment", "focus_preference"]) {
      expect(MIGRACION).toContain(`ALTER TABLE ${t} ENABLE ROW LEVEL SECURITY`);
      expect(LEER("scripts/db-aislamiento.sh")).toContain(`delete from ${t};`);
    }
  });

  it("los límites Pomodoro de la base son los del dominio", () => {
    expect(MIGRACION).toContain("pomodoro_focus_minutes       INTEGER CHECK (pomodoro_focus_minutes BETWEEN 5 AND 120)");
    expect(MIGRACION).toContain("pomodoro_blocks_before_long  INTEGER CHECK (pomodoro_blocks_before_long BETWEEN 2 AND 8)");
  });
});

describe("ADR-104 §5 y §10 · navegación", () => {
  it("`FOCUS` es un nodo sin wireframe: siguen nueve superficies", () => {
    expect(nodos.FOCUS).toMatchObject({ wireframe: null, ruta: "/focus" });
    expect(superficieIds).toHaveLength(9);
    expect(nodos.EJECUCION.ruta).toBeNull();
  });

  it("`CTA-026` sale de Hoy, Materia y Compromiso; `CTA-006` y `CTA-009` ganan el origen Focus", () => {
    expect(ctaRegistry["CTA-026"]).toMatchObject({ origen: ["UX01", "UX02", "UX04"], destino: "FOCUS" });
    expect(ctaRegistry["CTA-027"]).toMatchObject({ origen: ["FOCUS"], destino: null });
    expect(ctaRegistry["CTA-006"].origen).toContain("FOCUS");
    expect(ctaRegistry["CTA-009"].origen).toContain("FOCUS");
  });

  it("la pantalla es un objeto: su ficha dice *Focus · materia*", () => {
    expect(objetoEnPantalla("FOCUS", "/focus", "Análisis III")).toMatchObject({ tipo: "focus", entidadId: "FOCUS", etiqueta: "Focus · Análisis III" });
    expect(objetoEnPantalla("FOCUS", "/focus?sesion=s-1", "Análisis III")).toMatchObject({ entidadId: "s-1" });
  });
});

describe("ADR-104 §21 · la entrada de la Bitácora", () => {
  const datos = { inicio: "2026-09-13T21:07:00Z", fin: "2026-09-13T22:19:00Z", modo: "POMODORO" as const, foco: 52 * 60, descanso: 10 * 60, pausado: 10 * 60, completos: 2, parciales: 1, avance: "Resolví el 4, el 5 y el 6" };

  it("dice los minutos de Focus, el detalle y cita el avance", () => {
    const e = aEntradaVisible({ evento: "FocusSessionEnded", en: datos.fin, porElEstudiante: true, datos }, "America/Argentina/Cordoba");
    expect(e).toMatchObject({
      titulo: "Sesión de Focus · 52 min de Focus",
      detalle: "18:07–19:19 · 2 bloques completos · 1 parcial · descanso 10 min · pausado 10 min",
      cita: "Avance: «Resolví el 4, el 5 y el 6»",
    });
  });

  it("un cronómetro libre no cuenta bloques que no existieron", () => {
    const e = aEntradaVisible({ evento: "FocusSessionEnded", en: datos.fin, porElEstudiante: true, datos: { ...datos, modo: "FREE", completos: 0, parciales: 0, descanso: 0, pausado: 0, avance: null } }, "America/Argentina/Cordoba");
    expect(e?.detalle).toBe("18:07–19:19");
    expect(e && "cita" in e).toBe(false);
  });

  it("empezar no se muestra: la Bitácora registra la sesión cerrada", () => {
    expect(tituloDeHecho("FocusSessionStarted")).toBeNull();
  });
});

describe("ADR-104 · la copy no promete lo que no sabe", () => {
  const focus = Object.entries(copy).filter(([k]) => k.startsWith("FOCUS."));
  it("nunca «tiempo efectivo», «nota», «productividad» ni una duración como la correcta", () => {
    expect(focus.length).toBeGreaterThan(50);
    for (const [k, v] of focus) {
      expect(v, k).not.toMatch(/tiempo efectivo|\bnotas?\b|productiv|rendimiento|mejor duraci|científic/i);
    }
  });
});
