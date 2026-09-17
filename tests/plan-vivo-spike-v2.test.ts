import { createHash } from "node:crypto";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, resolve } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  aplicar,
  escenarioActual,
  ESTADOS_DEMOSTRATIVOS,
  estadoDesde,
  INICIAL,
  reducir,
  type Accion,
} from "@/app/demo/plan-vivo-spike-v2/_lab/escenario";
import { COMPROMISOS, EVALUACIONES, ID, MAXIMO_DE_PASOS, TEMAS, VENTANAS, WORKITEMS, EXCEPCIONES } from "@/app/demo/plan-vivo-spike-v2/_lab/fixture";
import { enHoras, finDe, inicioDe } from "@/app/demo/plan-vivo-spike-v2/_lab/formato";
import {
  advertenciasAlSimular,
  AHORA_EN_SEMANA,
  compromisoEnVentana,
  diferencia,
  huecosParaCompromiso,
  huecosParaPropuesta,
  PLAN_REAL,
  proyectar,
  VACIO,
  workitem,
} from "@/app/demo/plan-vivo-spike-v2/_lab/proyeccion";
import type { Escenario, Proyeccion } from "@/app/demo/plan-vivo-spike-v2/_lab/tipos";

/**
 * 🧪 **Laboratorio descartable «Mi Plan vivo» V2** — cuentas, invariantes y aislamiento.
 *
 * No se prueba que el acomodador sea bueno: se prueba que **ninguna cifra contradiga
 * a los bloques**, que cada paso parta del anterior, que el plan real no cambie
 * nunca y que lo que no se mueve no se mueva.
 */

vi.mock("next/server", () => ({ connection: async () => {} }));

const RAIZ = process.cwd();
const RAIZ_V2 = resolve(RAIZ, "app/demo/plan-vivo-spike-v2");
const RAIZ_V1 = resolve(RAIZ, "app/demo/plan-vivo-spike");

const fuentes = (dir: string): string[] =>
  readdirSync(dir).flatMap((n) => {
    const abs = join(dir, n);
    return statSync(abs).isDirectory() ? fuentes(abs) : [abs];
  });
const sinComentarios = (s: string) => s.replace(/\/\*[\s\S]*?\*\//g, " ").replace(/^\s*\/\/.*$/gm, "");

const pasos = (...ids: string[]): Escenario => ({ ...VACIO, pasos: ids.map((id) => ({ id, override: true })) });
const SIMULABLES = [...WORKITEMS.map((w) => w.id), ID.COMPROMISO];

/** Un muestrario de escenarios: los demostrativos, todo paso suelto y todo par ordenado. */
const MUESTRA: [string, Escenario][] = [
  ...Object.entries(ESTADOS_DEMOSTRATIVOS).map(([k, v]): [string, Escenario] => [k, escenarioActual(estadoDesde(v.acciones))]),
  ...SIMULABLES.map((a): [string, Escenario] => [a, pasos(a)]),
  ...SIMULABLES.flatMap((a) => SIMULABLES.filter((b) => b !== a).map((b): [string, Escenario] => [`${a}+${b}`, pasos(a, b)])),
  ["cinco", pasos(ID.LIMITES, ID.TEORIA_DERIVADAS, ID.PRACTICA_DERIVADAS, ID.SIMULACRO, ID.ECONOMIA_U3)],
  ["con excepciones", { ...VACIO, agregadas: EXCEPCIONES.map((e) => e.id) }],
  ["sin sábado", { ...VACIO, quitadas: ["DSP-SYN-LAB-SAB"] }],
];

// ── Aislamiento y regresión ─────────────────────────────────────────────────────

describe("V2 vive aislada y no toca V1", () => {
  /**
   * La huella de V1 al abrir V2 (commit 067947c). Si alguien cambia V1 a
   * propósito, actualiza esta tabla **en el mismo commit y lo dice**.
   */
  const HUELLA_V1: Record<string, string> = {
    "app/demo/plan-vivo-spike/_spike/bloque.tsx": "c6af10859890c3be",
    "app/demo/plan-vivo-spike/_spike/calendario-spike.tsx": "fe3acd310df5ffc0",
    "app/demo/plan-vivo-spike/_spike/camino-temporal.tsx": "915ebd30fec7761d",
    "app/demo/plan-vivo-spike/_spike/celdas.ts": "85987ba2b69199b6",
    "app/demo/plan-vivo-spike/_spike/copy.ts": "34ad2b5c26871b47",
    "app/demo/plan-vivo-spike/_spike/fixture.ts": "d67d10e655fda1b1",
    "app/demo/plan-vivo-spike/_spike/formato.ts": "fad2e9529c31fca6",
    "app/demo/plan-vivo-spike/_spike/panel-explicativo.tsx": "1a436a39a745aafa",
    "app/demo/plan-vivo-spike/_spike/proyecciones.ts": "4829b38fe71cc203",
    "app/demo/plan-vivo-spike/_spike/spike-plan-vivo.tsx": "e3e73a77e9a39661",
    "app/demo/plan-vivo-spike/_spike/spike.module.css": "9606ca12d79aeb1a",
    "app/demo/plan-vivo-spike/_spike/tipos.ts": "e5afb02330dfd8ef",
    "app/demo/plan-vivo-spike/page.tsx": "bfe494081dfcc8dc",
    "tests/plan-vivo-spike-vista.test.tsx": "596e56a12e3067c4",
    "tests/plan-vivo-spike.test.ts": "002cb12fa3541952",
  };

  it("los archivos de V1 son exactamente los de V1", () => {
    const actuales = [...fuentes(RAIZ_V1), resolve(RAIZ, "tests/plan-vivo-spike.test.ts"), resolve(RAIZ, "tests/plan-vivo-spike-vista.test.tsx")];
    const huella = Object.fromEntries(
      actuales.map((f) => [f.slice(RAIZ.length + 1), createHash("sha256").update(readFileSync(f)).digest("hex").slice(0, 16)]),
    );
    expect(huella).toEqual(HUELLA_V1);
  });

  const codigo = fuentes(RAIZ_V2)
    .filter((f) => /\.(ts|tsx)$/.test(f))
    .map((f) => ({ f, src: sinComentarios(readFileSync(f, "utf8")) }));

  it("hay código que revisar", () => expect(codigo.length).toBeGreaterThan(10));

  it("no habla por red, no persiste y no toca la base ni un endpoint", () => {
    for (const { f, src } of codigo) {
      expect(src, f).not.toMatch(/\bfetch\s*\(|XMLHttpRequest|WebSocket|localStorage|sessionStorage|indexedDB|sendBeacon/);
      expect(src, f).not.toMatch(/supabase|@\/lib\/server|@\/lib\/client|["'`]\/api\//);
    }
  });

  it("no importa el dominio productivo, las pantallas, el shell ni V1", () => {
    for (const { f, src } of codigo) {
      expect(src, f).not.toMatch(/from\s+["']@\/(lib|components)\//);
      expect(src, f).not.toMatch(/plan-vivo-spike\/_spike|\.\.\/plan-vivo-spike\//);
    }
  });

  it("nada del producto ni de V1 importa V2", () => {
    const otros = ["app", "components", "lib"]
      .flatMap((d) => fuentes(resolve(RAIZ, d)))
      .filter((f) => /\.(ts|tsx)$/.test(f) && !f.startsWith(RAIZ_V2));
    expect(otros.length).toBeGreaterThan(50);
    for (const f of otros) expect(readFileSync(f, "utf8"), f).not.toContain("plan-vivo-spike-v2");
  });

  it("cada versión lee su propio flag", () => {
    const v1 = sinComentarios(readFileSync(resolve(RAIZ_V1, "page.tsx"), "utf8"));
    const v2 = sinComentarios(readFileSync(resolve(RAIZ_V2, "page.tsx"), "utf8"));
    expect(v1).toContain('process.env.PLAN_VIVO_SPIKE !== "1"');
    expect(v1).not.toContain("PLAN_VIVO_SPIKE_V2");
    expect(v2).toContain('process.env.PLAN_VIVO_SPIKE_V2 !== "1"');
    expect(v2).not.toMatch(/PLAN_VIVO_SPIKE\b(?!_V2)/);
  });

  it("el copy no muestra puntajes, readiness, predicciones ni culpas", () => {
    for (const archivo of ["copy.ts", "gantt.tsx", "inspector.tsx", "pila.tsx", "camino.tsx", "lab-plan-vivo.tsx"]) {
      const src = sinComentarios(readFileSync(resolve(RAIZ_V2, "_lab", archivo), "utf8"));
      expect(src, archivo).not.toMatch(
        /\bscore\b|readiness|probabilidad de aprob|la IA decidi|optimizaci[oó]n autom|productividad|\/100|puntaje|dominaste|listo para rendir|vas a aprobar|no vas a llegar|estás atrasad|no pudiste/i,
      );
      expect(src, archivo).not.toMatch(/\d+\s*%/);
    }
  });

  describe("la ruta responde 404 sin su flag", () => {
    const original = { v1: process.env.PLAN_VIVO_SPIKE, v2: process.env.PLAN_VIVO_SPIKE_V2 };
    afterEach(() => {
      process.env.PLAN_VIVO_SPIKE = original.v1;
      process.env.PLAN_VIVO_SPIKE_V2 = original.v2;
      if (original.v1 === undefined) delete process.env.PLAN_VIVO_SPIKE;
      if (original.v2 === undefined) delete process.env.PLAN_VIVO_SPIKE_V2;
    });
    const params = { searchParams: Promise.resolve({}) };
    const es404 = (e: unknown) => String((e as { digest?: string }).digest ?? "").includes("404");

    it("V2 sin ningún flag: 404", async () => {
      delete process.env.PLAN_VIVO_SPIKE;
      delete process.env.PLAN_VIVO_SPIKE_V2;
      const { default: V2 } = await import("@/app/demo/plan-vivo-spike-v2/page");
      await expect(V2(params).catch((e) => (es404(e) ? "404" : e))).resolves.toBe("404");
    });

    it("prender V1 no prende V2, y prender V2 no prende V1", async () => {
      process.env.PLAN_VIVO_SPIKE = "1";
      delete process.env.PLAN_VIVO_SPIKE_V2;
      const { default: V2 } = await import("@/app/demo/plan-vivo-spike-v2/page");
      const { default: V1 } = await import("@/app/demo/plan-vivo-spike/page");
      await expect(V2(params).catch((e) => (es404(e) ? "404" : e))).resolves.toBe("404");
      delete process.env.PLAN_VIVO_SPIKE;
      process.env.PLAN_VIVO_SPIKE_V2 = "1";
      await expect(V1(params).catch((e) => (es404(e) ? "404" : e))).resolves.toBe("404");
    });

    it("con su flag, V2 responde y los dos flags pueden convivir", async () => {
      process.env.PLAN_VIVO_SPIKE = "1";
      process.env.PLAN_VIVO_SPIKE_V2 = "1";
      const { default: V2 } = await import("@/app/demo/plan-vivo-spike-v2/page");
      const { default: V1 } = await import("@/app/demo/plan-vivo-spike/page");
      expect(await V2(params)).toBeTruthy();
      expect(await V1(params)).toBeTruthy();
    });
  });
});

// ── Cálculos ────────────────────────────────────────────────────────────────────

describe("El plan real dice lo que pidió el fixture", () => {
  const t = PLAN_REAL.totales;

  it("9 h 20 pendientes esta semana, 7 h 30 declaradas, 1 h 50 sin ubicar, sin margen", () => {
    expect([enHoras(t.pendiente), enHoras(t.declarada), enHoras(t.sinUbicar), enHoras(t.margen)]).toEqual(["9 h 20", "7 h 30", "1 h 50", "0 min"]);
    expect(t.usadaPorSimulado).toBe(0);
  });

  it("el rango del pendiente es la suma de los rangos", () => {
    const min = WORKITEMS.reduce((s, w) => s + w.duracion.min, 0) + 60;
    const max = WORKITEMS.reduce((s, w) => s + w.duracion.max, 0) + 60;
    expect([t.pendienteMin, t.pendienteMax]).toEqual([min, max]);
  });

  it("todo rango es válido, con confianza y fuente", () => {
    for (const w of WORKITEMS) {
      expect(w.duracion.min, w.id).toBeLessThanOrEqual(w.duracion.probable);
      expect(w.duracion.probable, w.id).toBeLessThanOrEqual(w.duracion.max);
      expect(w.confianza.fuente.length, w.id).toBeGreaterThan(5);
    }
  });

  it("la recomendada es Límites y la disponibilidad declarada es la de las ventanas", () => {
    expect(PLAN_REAL.recomendada).toBe(ID.LIMITES);
    expect(VENTANAS.reduce((s, v) => s + (finDe(v.franja) - inicioDe(v.franja)), 0)).toBe(450);
  });

  it("el plan real es exactamente proyectar el escenario vacío", () => {
    expect(PLAN_REAL).toEqual(proyectar(VACIO));
    expect(PLAN_REAL.esEscenario).toBe(false);
  });
});

describe.each(MUESTRA)("Las cifras salen de los bloques — %s", (_, esc) => {
  const p = proyectar(esc);
  const pendientes = p.colocados.filter((c) => c.estado === "PROPUESTA" || c.estado === "CONFIRMADO");

  it("pendiente − (declarada − usada) = sin ubicar − margen", () => {
    const t = p.totales;
    expect(t.pendiente - (t.declarada - t.usadaPorSimulado)).toBe(t.sinUbicar - t.margen);
  });

  it("el pendiente es la suma de lo que queda por hacer", () => {
    const suma = pendientes.reduce((s, c) => {
      const w = workitem(c.id);
      return s + (w ? w.duracion.probable : finDe(c.franja!) - inicioDe(c.franja!));
    }, 0);
    expect(p.totales.pendiente).toBe(suma);
  });

  it("lo ubicado cae en la disponibilidad, en el futuro, sin pisarse, con su duración probable", () => {
    const ventanas = [...VENTANAS, ...EXCEPCIONES].filter((v) => (esc.agregadas.includes(v.id) || VENTANAS.includes(v)) && !esc.quitadas.includes(v.id));
    const ocupan = p.colocados.filter((c) => c.franja && ["PROPUESTA", "CONFIRMADO", "SIMULADO", "INTENTO"].includes(c.estado));
    for (const c of ocupan) {
      const [a, b] = [inicioDe(c.franja!), finDe(c.franja!)];
      expect(a, `${c.clave} en el pasado`).toBeGreaterThanOrEqual(AHORA_EN_SEMANA);
      expect(ventanas.some((v) => inicioDe(v.franja) <= a && b <= finDe(v.franja)), `${c.clave} fuera de la disponibilidad`).toBe(true);
      const w = workitem(c.id);
      if (w) expect(b - a, c.clave).toBe(w.duracion.probable);
      for (const e of [...EVALUACIONES]) expect(a < finDe(e.franja) && inicioDe(e.franja) < b, `${c.clave} pisa el parcial`).toBe(false);
    }
    for (const x of ocupan)
      for (const y of ocupan) {
        if (x === y) continue;
        const pisa = inicioDe(x.franja!) < finDe(y.franja!) && inicioDe(y.franja!) < finDe(x.franja!);
        expect(pisa, `${x.clave} pisa ${y.clave}`).toBe(false);
      }
  });

  it("las propuestas respetan dependencias y evaluación", () => {
    for (const c of p.colocados.filter((x) => x.estado === "PROPUESTA" && x.franja && !x.reubicado)) {
      const w = workitem(c.id)!;
      for (const r of w.requiere) {
        const previo = p.colocados.find((x) => x.clave === r && x.franja);
        if (previo) expect(finDe(previo.franja!), `${c.id} antes que ${r}`).toBeLessThanOrEqual(inicioDe(c.franja!));
      }
      if (w.antesDe) expect(finDe(c.franja!), `${c.id} después del parcial`).toBeLessThanOrEqual(inicioDe(EVALUACIONES[0].franja));
    }
  });

  it("clases, evaluación, hechos e incumplidos no se mueven", () => {
    for (const c of PLAN_REAL.colocados.filter((x) => ["FIJO", "HECHO", "INCUMPLIDO"].includes(x.estado)))
      expect(p.colocados.find((x) => x.clave === c.clave)?.franja, c.clave).toEqual(c.franja);
  });

  it("una simulación nunca mueve «Vos hoy»: sólo el escenario", () => {
    for (const tema of TEMAS) {
      const e = p.temasEnEscenario[tema.id];
      if (tema.vos === "PROGRESO_REGISTRADO") expect(e, tema.id).toBe("PROGRESO_REGISTRADO");
      else if (e === "SIMULADO") {
        const produce = p.completados.some((id) => {
          const w = workitem(id) ?? COMPROMISOS.find((x) => x.id === id);
          return w?.impacto.produceProgreso && w.impacto.temas.includes(tema.id);
        });
        expect(produce, tema.id).toBe(true);
      }
    }
  });
});

// ── Simulación acumulativa ──────────────────────────────────────────────────────

describe("Cada paso parte del anterior", () => {
  it("agregar un segundo paso no mueve el primero, y el segundo empieza después", () => {
    for (const a of SIMULABLES)
      for (const b of SIMULABLES) {
        if (a === b) continue;
        const uno = proyectar(pasos(a));
        const dos = proyectar(pasos(a, b));
        expect(dos.pasos[0].franja, `${a} → ${b}`).toEqual(uno.pasos[0].franja);
        const [f1, f2] = [dos.pasos[0].franja, dos.pasos[1].franja];
        if (f1 && f2 && b !== ID.COMPROMISO && a !== ID.COMPROMISO) expect(inicioDe(f2), `${a} → ${b}`).toBeGreaterThanOrEqual(finDe(f1));
      }
  });

  it("Límites, Teoría y Práctica: los tres completados, el refuerzo retirado y el Gantt de Análisis simulado", () => {
    const p = proyectar(escenarioActual(estadoDesde(ESTADOS_DEMOSTRATIVOS["tres-pasos"].acciones)));
    expect(p.completados).toEqual([ID.LIMITES, ID.TEORIA_DERIVADAS, ID.PRACTICA_DERIVADAS]);
    expect(p.retirados).toEqual([ID.REFUERZO_LIMITES]);
    expect(p.temasEnEscenario["TEM-ANA-2"]).toBe("SIMULADO");
    expect(p.temasEnEscenario["TEM-ANA-3"]).toBe("SIMULADO");
    expect(p.recomendada).toBe(ID.SIMULACRO);
    expect(enHoras(p.totales.pendiente)).toBe("6 h 05");
  });

  it("deshacer devuelve exactamente la proyección anterior, y restablecer el plan real", () => {
    let e = INICIAL;
    const vistas: Proyeccion[] = [proyectar(escenarioActual(e))];
    for (const id of [ID.LIMITES, ID.TEORIA_DERIVADAS, ID.ECONOMIA_U3]) {
      e = reducir(e, { tipo: "SIMULAR", id, override: true });
      vistas.push(proyectar(escenarioActual(e)));
    }
    e = reducir(e, { tipo: "REUBICAR", id: ID.CACHE, franja: huecosParaPropuesta(escenarioActual(e), ID.CACHE).huecos[0] ?? { dia: "2026-09-19", desde: "10:00", hasta: "11:15" } });
    for (let i = vistas.length - 1; i >= 0; i--) {
      e = reducir(e, { tipo: "DESHACER" });
      if (escenarioActual(e).pasos.length === i) expect(proyectar(escenarioActual(e))).toEqual(vistas[i]);
    }
    const reset = reducir(estadoDesde([{ tipo: "SIMULAR", id: ID.LIMITES, override: false }]), { tipo: "RESTABLECER" });
    expect(proyectar(escenarioActual(reset))).toEqual(PLAN_REAL);
  });

  it("volver a un paso corta el historial justo después de ese paso", () => {
    const e = estadoDesde([
      { tipo: "SIMULAR", id: ID.LIMITES, override: false },
      { tipo: "SIMULAR", id: ID.TEORIA_DERIVADAS, override: false },
      { tipo: "SIMULAR", id: ID.PRACTICA_DERIVADAS, override: false },
    ]);
    const vuelta = reducir(e, { tipo: "VOLVER_A_PASO", numero: 1 });
    expect(escenarioActual(vuelta).pasos.map((x) => x.id)).toEqual([ID.LIMITES]);
    expect(escenarioActual(vuelta)).toBe(e.historial[1]);
    expect(proyectar(escenarioActual(vuelta)).completados).toEqual([ID.LIMITES]);
  });

  it("el máximo es cinco", () => {
    const acciones: Accion[] = [ID.LIMITES, ID.TEORIA_DERIVADAS, ID.PRACTICA_DERIVADAS, ID.SIMULACRO, ID.ECONOMIA_U3, ID.CACHE].map((id) => ({ tipo: "SIMULAR", id, override: true }));
    const e = estadoDesde(acciones);
    expect(escenarioActual(e).pasos).toHaveLength(MAXIMO_DE_PASOS);
    expect(escenarioActual(e).pasos.map((x) => x.id)).not.toContain(ID.CACHE);
  });

  it("el plan real no cambia por nada de lo que pase en el escenario", () => {
    const antes = JSON.stringify(PLAN_REAL);
    for (const [, esc] of MUESTRA) proyectar(esc);
    estadoDesde(Object.values(ESTADOS_DEMOSTRATIVOS).flatMap((d) => d.acciones));
    expect(JSON.stringify(PLAN_REAL)).toBe(antes);
    expect(JSON.stringify(proyectar(VACIO))).toBe(antes);
  });
});

// ── Prioridad y dependencia ─────────────────────────────────────────────────────

describe("Prioridad blanda", () => {
  it("dos workitems del mismo nivel y sin dependencia se intercambian sin advertencia", () => {
    expect(advertenciasAlSimular(PLAN_REAL, ID.TEORIA_DERIVADAS)).toEqual({ faltan: [], superiores: [] });
    const cambiado = proyectar(pasos(ID.TEORIA_DERIVADAS, ID.LIMITES));
    expect(cambiado.completados).toEqual([ID.TEORIA_DERIVADAS, ID.LIMITES]);
  });

  it("uno de nivel inferior avisa qué posterga, y no bloquea", () => {
    const { superiores, faltan } = advertenciasAlSimular(PLAN_REAL, ID.ECONOMIA_U3);
    expect(faltan).toEqual([]);
    expect(superiores).toEqual(expect.arrayContaining([ID.LIMITES, ID.PRACTICA_DERIVADAS]));
    const e = reducir(INICIAL, { tipo: "SIMULAR", id: ID.ECONOMIA_U3, override: true });
    expect(escenarioActual(e).pasos).toEqual([{ id: ID.ECONOMIA_U3, override: true }]);
  });

  it("elegir Economía después de los tres de Análisis agrega un riesgo visible", () => {
    const tres = proyectar(escenarioActual(estadoDesde(ESTADOS_DEMOSTRATIVOS["tres-pasos"].acciones)));
    const cuatro = proyectar(escenarioActual(estadoDesde(ESTADOS_DEMOSTRATIVOS["prioridad-inferior"].acciones)));
    const d = diferencia(tres, cuatro);
    expect(d.riesgosAgregados.map((r) => r.texto)).toContain("Resolver un parcial de práctica queda a 2 h del parcial.");
    expect(cuatro.pasos[3].override).toBe(true);
  });
});

describe("Dependencia académica", () => {
  const sola = proyectar(pasos(ID.PRACTICA_DERIVADAS));

  it("sin Límites, la práctica de Derivadas es un intento: usa su tiempo y no queda hecha", () => {
    expect(sola.pasos[0]).toMatchObject({ incompleto: true, faltan: [ID.LIMITES] });
    expect(sola.completados).not.toContain(ID.PRACTICA_DERIVADAS);
    expect(sola.colocados.find((c) => c.clave === `${ID.PRACTICA_DERIVADAS}#intento`)?.estado).toBe("INTENTO");
    expect(sola.colocados.find((c) => c.clave === ID.PRACTICA_DERIVADAS)?.estado).toBe("PROPUESTA");
    expect(sola.totales.pendiente).toBe(PLAN_REAL.totales.pendiente);
    expect(sola.totales.usadaPorSimulado).toBe(45);
  });

  it("no mueve el Gantt ni desbloquea lo que depende de ella, y dice qué falta", () => {
    expect(sola.temasEnEscenario["TEM-ANA-3"]).toBe("SIN_CAMBIO");
    expect(sola.recomendada).toBe(ID.LIMITES);
    expect(advertenciasAlSimular(sola, ID.SIMULACRO).faltan).toEqual([ID.PRACTICA_DERIVADAS]);
    expect(sola.riesgos.map((r) => r.id)).toContain(`INTENTO:${ID.PRACTICA_DERIVADAS}`);
  });

  it("con Límites antes, la misma práctica sí mueve el escenario", () => {
    const bien = proyectar(pasos(ID.LIMITES, ID.PRACTICA_DERIVADAS));
    expect(bien.completados).toContain(ID.PRACTICA_DERIVADAS);
    expect(bien.temasEnEscenario["TEM-ANA-3"]).toBe("SIMULADO");
  });

  it("repasar teoría reduce trabajo pendiente pero no mueve el Gantt", () => {
    const p = proyectar(pasos(ID.TEORIA_DERIVADAS));
    expect(p.totales.pendiente).toBe(PLAN_REAL.totales.pendiente - 45);
    expect(Object.values(p.temasEnEscenario)).not.toContain("SIMULADO");
  });
});

// ── Qué se puede mover ──────────────────────────────────────────────────────────

describe("Movilidad", () => {
  it("una propuesta se reubica en un lugar válido y sigue siendo propuesta", () => {
    const sabado = { dia: "2026-09-19", desde: "10:00", hasta: "11:00" };
    expect(huecosParaPropuesta(VACIO, ID.ECONOMIA_U3).huecos).toContainEqual(sabado);
    const p = proyectar(aplicar(VACIO, { tipo: "REUBICAR", id: ID.ECONOMIA_U3, franja: sabado }));
    const c = p.colocados.find((x) => x.clave === ID.ECONOMIA_U3)!;
    expect(c).toMatchObject({ estado: "PROPUESTA", reubicado: true, franja: sabado });
    expect(p.colocados.filter((x) => x.estado === "CONFIRMADO")).toHaveLength(1);
  });

  it("un lugar inválido no se acepta", () => {
    const lunes = { dia: "2026-09-14", desde: "09:00", hasta: "10:00" };
    expect(aplicar(VACIO, { tipo: "REUBICAR", id: ID.ECONOMIA_U3, franja: lunes })).toBe(VACIO);
  });

  it("el trabajo por ubicar entra cuando hay un hueco que alcanza, sin acortarlo", () => {
    expect(huecosParaPropuesta(VACIO, ID.ELASTICIDAD).huecos).toEqual([]);
    expect(huecosParaPropuesta(VACIO, ID.ELASTICIDAD).notas.join(" ")).toContain("No se acorta su duración");
    const conSabado = aplicar(VACIO, { tipo: "AGREGAR_VENTANA", id: "DSP-SYN-LAB-X-SAB" });
    const [hueco] = huecosParaPropuesta(conSabado, ID.ELASTICIDAD).huecos;
    expect(finDe(hueco) - inicioDe(hueco)).toBe(110);
    const p = proyectar(aplicar(conSabado, { tipo: "REUBICAR", id: ID.ELASTICIDAD, franja: hueco }));
    expect(p.colocados.find((x) => x.clave === ID.ELASTICIDAD)?.franja).toEqual(hueco);
  });

  it("clases, evaluaciones y hechos no se reubican", () => {
    for (const id of [ID.CLASE_ANA_LUN, ID.CLASE_ANA_MIE, ID.PARCIAL, ID.HECHO_ARQ, ID.COMPROMISO_INCUMPLIDO]) {
      expect(huecosParaPropuesta(VACIO, id).huecos, id).toEqual([]);
      expect(aplicar(VACIO, { tipo: "REUBICAR", id, franja: { dia: "2026-09-19", desde: "10:00", hasta: "11:00" } }), id).toBe(VACIO);
      expect(aplicar(VACIO, { tipo: "RENEGOCIAR", id, franja: { dia: "2026-09-19", desde: "10:00", hasta: "11:00" } }), id).toBe(VACIO);
    }
  });

  it("cambiar el horario de un compromiso conserva la promesa original y deja el plan real igual", () => {
    const jueves = { dia: "2026-09-17", desde: "19:30", hasta: "20:30" };
    expect(huecosParaCompromiso(VACIO, ID.COMPROMISO).huecos).toContainEqual(jueves);
    const p = proyectar(aplicar(VACIO, { tipo: "RENEGOCIAR", id: ID.COMPROMISO, franja: jueves }));
    const c = p.compromisos[ID.COMPROMISO];
    expect(c.franja).toEqual(jueves);
    expect(c.promesaOriginal).toEqual({ dia: "2026-09-16", desde: "17:00", hasta: "18:00" });
    expect(c.renegociaciones).toHaveLength(1);
    expect(p.colocados.find((x) => x.clave === `${ID.COMPROMISO}#promesa`)?.estado).toBe("PROMESA_ANTERIOR");
    expect(PLAN_REAL.compromisos[ID.COMPROMISO].franja).toEqual({ dia: "2026-09-16", desde: "17:00", hasta: "18:00" });
  });

  it("quitar la franja de un compromiso no lo mueve: se pide resolverlo primero", () => {
    expect(compromisoEnVentana(VACIO, "DSP-SYN-LAB-MIE")).toBe(ID.COMPROMISO);
    expect(aplicar(VACIO, { tipo: "QUITAR_VENTANA", id: "DSP-SYN-LAB-MIE" })).toBe(VACIO);
    const sinSabado = proyectar(aplicar(VACIO, { tipo: "QUITAR_VENTANA", id: "DSP-SYN-LAB-SAB" }));
    expect(sinSabado.totales.declarada).toBe(450 - 75);
    expect(sinSabado.compromisos[ID.COMPROMISO].franja).toEqual(PLAN_REAL.compromisos[ID.COMPROMISO].franja);
  });

  it("agregar disponibilidad no reduce el trabajo académico", () => {
    const p = proyectar({ ...VACIO, agregadas: EXCEPCIONES.map((e) => e.id) });
    expect(p.totales.pendiente).toBe(PLAN_REAL.totales.pendiente);
    expect(p.totales.declarada).toBe(450 + 110 + 135 + 55);
  });
});
