import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, resolve } from "node:path";
import { describe, expect, it } from "vitest";

import { AHORA_ADELANTADO, AHORA_INICIAL, CATALOGO, ESCENARIOS, ID, SEMANA } from "@/app/demo/plan-vivo-spike/_spike/fixture";
import { aMinutos, enHoras, instante } from "@/app/demo/plan-vivo-spike/_spike/formato";
import {
  diferencia,
  esPendiente,
  itemDe,
  proyectar,
  referenciaDe,
} from "@/app/demo/plan-vivo-spike/_spike/proyecciones";
import type { SpikePlanProjection, SpikeScenario } from "@/app/demo/plan-vivo-spike/_spike/tipos";

/**
 * 🧪 **Spike descartable «Mi Plan vivo»** — las cuentas y las invariantes.
 *
 * Lo que se prueba no es que el plan sea bueno —las ubicaciones están escritas a
 * mano— sino que **ninguna cifra contradiga a los bloques** y que ninguna
 * proyección rompa lo que el pedido declaró innegociable.
 */

const TODOS = Object.keys(ESCENARIOS) as SpikeScenario[];
const P = Object.fromEntries(TODOS.map((e) => [e, proyectar(e)])) as Record<SpikeScenario, SpikePlanProjection>;

const RAIZ_DEL_SPIKE = resolve(process.cwd(), "app/demo/plan-vivo-spike");

function fuentes(dir: string): string[] {
  return readdirSync(dir).flatMap((n) => {
    const abs = join(dir, n);
    return statSync(abs).isDirectory() ? fuentes(abs) : [abs];
  });
}

describe("El estado inicial dice lo que pidió el pedido", () => {
  const t = P.BASE.totales;

  it("9 h 20 pendientes, 7 h 30 disponibles, 1 h 50 sin ubicar, sin margen", () => {
    expect(enHoras(t.pendiente)).toBe("9 h 20");
    expect(enHoras(t.disponible)).toBe("7 h 30");
    expect(enHoras(t.sinUbicar)).toBe("1 h 50");
    expect(t.margen).toBe(0);
  });

  it("la recomendada es Límites, 50–65 min, confianza media, con su evidencia", () => {
    const lim = itemDe(P.BASE, P.BASE.proximaAccion!)!;
    expect(lim.titulo).toBe("Resolver Práctica 2: Límites");
    expect(lim.rango).toMatchObject({ min: 50, max: 65 });
    expect(lim.confianza?.nivel).toBe("media");
    expect(lim.evidenciaEsperada).toBe("fotografía legible de los ejercicios resueltos");
  });

  it("el parcial de Análisis es el viernes", () => {
    expect(itemDe(P.BASE, ID.PARCIAL)!.franja!.dia).toBe("2026-09-18");
  });

  it("el reloj es el fijo y la semana es del 14 al 20", () => {
    expect(P.BASE.ahora).toBe(AHORA_INICIAL);
    expect(SEMANA[0]).toBe("2026-09-14");
    expect(SEMANA[6]).toBe("2026-09-20");
  });
});

describe("La tabla de docs/experiments/plan-vivo/SPIKE.md §4", () => {
  const FILAS: [SpikeScenario, string, string, string, string][] = [
    ["BASE", "9 h 20", "7 h 30", "1 h 50", "0 min"],
    ["COMPLETION_SIMULATION", "7 h 35", "6 h 30", "1 h 50", "45 min"],
    ["EXTRA_AVAILABILITY_PREVIEW", "9 h 20", "12 h 30", "0 min", "3 h 10"],
    ["EXTRA_AVAILABILITY_APPLIED", "9 h 20", "12 h 30", "0 min", "3 h 10"],
    ["TIME_ADVANCED_MISSED", "9 h 20", "3 h 15", "6 h 20", "15 min"],
    ["RESCUE_PREVIEW", "9 h 20", "3 h 15", "6 h 35", "30 min"],
  ];
  it.each(FILAS)("%s", (e, pendiente, disponible, sinUbicar, margen) => {
    const t = P[e].totales;
    expect([enHoras(t.pendiente), enHoras(t.disponible), enHoras(t.sinUbicar), enHoras(t.margen)]).toEqual([
      pendiente,
      disponible,
      sinUbicar,
      margen,
    ]);
  });
});

describe("Las cifras salen de los bloques, en los seis escenarios", () => {
  it.each(TODOS)("%s — pendiente − disponible = sin ubicar − margen", (e) => {
    const t = P[e].totales;
    expect(t.pendiente - t.disponible).toBe(t.sinUbicar - t.margen);
  });

  it.each(TODOS)("%s — el pendiente es la suma de los bloques pendientes", (e) => {
    const suma = P[e].items.filter(esPendiente).reduce((s, i) => s + i.rango!.probable, 0);
    expect(P[e].totales.pendiente).toBe(suma);
  });

  it.each(TODOS)("%s — todo trabajo ubicado cae dentro de la disponibilidad y en el futuro", (e) => {
    const p = P[e];
    const reloj = Date.parse(p.ahora);
    for (const i of p.items.filter(esPendiente).filter((x) => x.franja)) {
      const fr = i.franja!;
      expect(instante(fr.dia, fr.desde), `${i.id} está en el pasado`).toBeGreaterThanOrEqual(reloj);
      const contiene = p.disponibilidad.some(
        (d) => d.dia === fr.dia && aMinutos(d.desde) <= aMinutos(fr.desde) && aMinutos(fr.hasta) <= aMinutos(d.hasta),
      );
      expect(contiene, `${i.id} fuera de la disponibilidad`).toBe(true);
    }
  });

  it.each(TODOS)("%s — ningún bloque pisa a otro", (e) => {
    const conFranja = P[e].items.filter((i) => i.franja && i.estado !== "INCUMPLIDO");
    for (const a of conFranja)
      for (const b of conFranja) {
        if (a === b || a.franja!.dia !== b.franja!.dia) continue;
        const pisa = aMinutos(a.franja!.desde) < aMinutos(b.franja!.hasta) && aMinutos(b.franja!.desde) < aMinutos(a.franja!.hasta);
        expect(pisa, `${a.id} pisa ${b.id}`).toBe(false);
      }
  });

  it.each(TODOS)("%s — cada bloque dura lo que dice su duración probable", (e) => {
    for (const i of P[e].items.filter((x) => x.franja && x.rango))
      expect(aMinutos(i.franja!.hasta) - aMinutos(i.franja!.desde), i.id).toBe(i.rango!.probable);
  });

  it.each(TODOS)("%s — las dependencias se respetan en el orden de la semana", (e) => {
    const p = P[e];
    for (const i of p.items.filter((x) => x.franja && esPendiente(x)))
      for (const req of i.requiere) {
        const r = itemDe(p, req);
        if (!r || !r.franja || r.estado === "PROGRESO_REGISTRADO") continue;
        expect(instante(r.franja.dia, r.franja.hasta), `${i.id} antes que ${req}`).toBeLessThanOrEqual(
          instante(i.franja!.dia, i.franja!.desde),
        );
      }
  });
});

describe("Las restricciones no se mueven", () => {
  it.each(TODOS)("%s — clases, parcial y compromiso quedan en la misma franja que en la base", (e) => {
    for (const i of P.BASE.items.filter((x) => x.carril !== "ACCIONES"))
      expect(itemDe(P[e], i.id)!.franja).toEqual(i.franja);
  });

  it("un escenario no puede ubicar lo que tiene franja fija", () => {
    const fijos = CATALOGO.filter((c) => c.franjaFija).map((c) => c.id);
    for (const e of TODOS) for (const id of fijos) expect(id in ESCENARIOS[e].ubicaciones, `${e}/${id}`).toBe(false);
  });

  it.each(TODOS.filter((e) => referenciaDe(e)))("%s — el diff declara iguales todas las restricciones", (e) => {
    const d = diferencia(P[referenciaDe(e)!], P[e]);
    const restricciones = P[e].items.filter((i) => i.carril !== "ACCIONES").map((i) => i.id);
    expect([...d.restriccionesIguales].sort()).toEqual(restricciones.sort());
  });
});

describe("Escenario 2 — simular Límites completado", () => {
  const d = diferencia(P.BASE, P.COMPLETION_SIMULATION);

  it("Límites sale del trabajo pendiente como progreso registrado, y es hipotético", () => {
    const lim = itemDe(P.COMPLETION_SIMULATION, ID.LIMITES)!;
    expect(lim.estado).toBe("PROGRESO_REGISTRADO");
    expect(lim.hipotetico).toBe(true);
    expect(d.retirados).toContain(ID.LIMITES);
  });

  it("Teoría y Práctica de Derivadas se adelantan", () => {
    const movidos = new Map(d.movidos.map((m) => [m.id, m]));
    for (const id of [ID.TEORIA_DERIVADAS, ID.PRACTICA_DERIVADAS]) {
      const m = movidos.get(id)!;
      expect(instante(m.despues!.dia, m.despues!.desde)).toBeLessThan(instante(m.antes!.dia, m.antes!.desde));
    }
  });

  it("aparece margen antes del parcial y cambia la siguiente acción", () => {
    expect(d.minutos.margen).toBeGreaterThan(0);
    expect(P.COMPLETION_SIMULATION.margenes.every((m) => m.antesDelParcial)).toBe(true);
    expect(d.siguienteAntes).toBe(ID.REPASO_LIMITES);
    expect(d.siguienteDespues).toBe(ID.TEORIA_DERIVADAS);
  });

  it("el trabajo sin ubicar no se inventa: la guía sigue sin lugar", () => {
    expect(P.COMPLETION_SIMULATION.totales.sinUbicar).toBe(P.BASE.totales.sinUbicar);
  });
});

describe("Escenario 3 — cinco horas más", () => {
  const d = diferencia(P.BASE, P.EXTRA_AVAILABILITY_PREVIEW);

  it("suma 300 minutos de disponibilidad", () => {
    expect(d.minutos.disponible).toBe(300);
  });

  it("agregar disponibilidad NO reduce el trabajo académico", () => {
    expect(d.minutos.pendiente).toBe(0);
    expect(d.retirados).toEqual([]);
  });

  it("la guía entra, dos propuestas se adelantan, queda margen y nada sin ubicar", () => {
    expect(d.ubicados).toEqual([ID.ELASTICIDAD]);
    expect(d.movidos.map((m) => m.id).sort()).toEqual([ID.CACHE, ID.ECONOMIA_U3].sort());
    expect(P.EXTRA_AVAILABILITY_PREVIEW.totales.sinUbicar).toBe(0);
    expect(P.EXTRA_AVAILABILITY_PREVIEW.margenes.some((m) => m.antesDelParcial)).toBe(true);
  });

  it("aplicada y en vista previa son la misma proyección; sólo cambia lo hipotético", () => {
    const sinMarca = (p: SpikePlanProjection) => p.items.map((i) => ({ ...i, hipotetico: false }));
    expect(sinMarca(P.EXTRA_AVAILABILITY_APPLIED)).toEqual(sinMarca(P.EXTRA_AVAILABILITY_PREVIEW));
    expect(P.EXTRA_AVAILABILITY_APPLIED.items.some((i) => i.hipotetico)).toBe(false);
  });
});

describe("Escenario 4 — el reloj pasa y el compromiso se incumple", () => {
  const p = P.TIME_ADVANCED_MISSED;
  const d = diferencia(P.BASE, p);

  it("el compromiso queda incumplido con el mismo día, hora y duración", () => {
    const antes = itemDe(P.BASE, ID.COMPROMISO)!;
    const ahora = itemDe(p, ID.COMPROMISO)!;
    expect(ahora.estado).toBe("INCUMPLIDO");
    expect(ahora.franja).toEqual(antes.franja);
    expect(ahora.rango).toEqual(antes.rango);
    expect(p.ahora).toBe(AHORA_ADELANTADO);
  });

  it("su trabajo sigue pendiente, sin hora, y no se cuenta dos veces", () => {
    const trabajo = itemDe(p, ID.TRABAJO_DEL_COMPROMISO)!;
    expect(trabajo.estado).toBe("NECESITA_REUBICACION");
    expect(trabajo.franja).toBeNull();
    expect(esPendiente(itemDe(p, ID.COMPROMISO)!)).toBe(false);
    expect(p.totales.pendiente).toBe(P.BASE.totales.pendiente);
  });

  it("la disponibilidad pasada deja de estar disponible y crece lo sin ubicar", () => {
    expect(d.minutos.disponible).toBeLessThan(0);
    expect(d.minutos.sinUbicar).toBeGreaterThan(0);
  });

  it("ningún compromiso recibe una hora nueva en silencio", () => {
    expect(p.items.filter((i) => i.estado === "PROPUESTA_SIN_CONFIRMAR")).toEqual([]);
    expect(p.items.filter((i) => i.carril === "COMPROMISOS").every((i) => i.estado !== "COMPROMISO_CONFIRMADO")).toBe(true);
  });

  it("reorganizar es una vista previa: la propuesta es hipotética y el incumplido sigue ahí", () => {
    const r = P.RESCUE_PREVIEW;
    const propuesta = itemDe(r, ID.TRABAJO_DEL_COMPROMISO)!;
    expect(propuesta.estado).toBe("PROPUESTA_SIN_CONFIRMAR");
    expect(propuesta.hipotetico).toBe(true);
    expect(itemDe(r, ID.COMPROMISO)!.estado).toBe("INCUMPLIDO");
  });
});

describe("Lo que el spike tiene prohibido", () => {
  const codigo = fuentes(RAIZ_DEL_SPIKE)
    .filter((f) => /\.(ts|tsx)$/.test(f))
    .map((f) => ({ f, src: readFileSync(f, "utf8") }));
  const sinComentarios = (s: string) => s.replace(/\/\*[\s\S]*?\*\//g, " ").replace(/^\s*\/\/.*$/gm, "");

  it("hay código que revisar", () => {
    expect(codigo.length).toBeGreaterThan(5);
  });

  it("no habla por red, no persiste y no toca la base", () => {
    for (const { f, src } of codigo) {
      const s = sinComentarios(src);
      expect(s, f).not.toMatch(/\bfetch\s*\(|XMLHttpRequest|WebSocket|localStorage|sessionStorage|indexedDB/);
      expect(s, f).not.toMatch(/supabase|@\/lib\/server|@\/lib\/client|\/api\//);
    }
  });

  it("no importa ni el dominio productivo ni los componentes de pantalla", () => {
    for (const { f, src } of codigo) expect(sinComentarios(src), f).not.toMatch(/@\/lib\/domain|@\/components\/screens|@\/components\/shell/);
  });

  it("nada del producto importa el spike", () => {
    const productivos = ["app", "components", "lib"].flatMap((d) => fuentes(resolve(process.cwd(), d)))
      .filter((f) => /\.(ts|tsx)$/.test(f) && !f.startsWith(RAIZ_DEL_SPIKE));
    for (const f of productivos) expect(readFileSync(f, "utf8"), f).not.toContain("plan-vivo-spike");
  });

  it("no muestra puntajes, readiness, dominio ni predicción de aprobación", () => {
    const copy = sinComentarios(readFileSync(resolve(RAIZ_DEL_SPIKE, "_spike/copy.ts"), "utf8"));
    expect(copy).not.toMatch(/\/100|puntaje|readiness|listo para rendir|vas a aprobar|dominaste|dominio|no vas a llegar|estás atrasad/i);
  });

  it("la ruta está apagada sin su variable", () => {
    const page = readFileSync(resolve(RAIZ_DEL_SPIKE, "page.tsx"), "utf8");
    expect(page).toContain('process.env.PLAN_VIVO_SPIKE !== "1"');
    expect(page).toContain("notFound()");
  });
});
