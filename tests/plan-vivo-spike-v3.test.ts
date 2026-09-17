import { createHash } from "node:crypto";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative, resolve } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";

import { aplicarTodas, ESTADOS_DEMOSTRATIVOS, estadoInicial, reducir, type AccionDelLab } from "@/app/demo/plan-vivo-spike-v3/_lab/estado";
import { explicarPaso } from "@/app/demo/plan-vivo-spike-v3/_lab/explicacion";
import { ACCIONES, CINCO_HORAS, EVALUACIONES, ID, MAXIMO_DE_PASOS, instanteDe } from "@/app/demo/plan-vivo-spike-v3/_lab/fixture";
import { enHoras, instante } from "@/app/demo/plan-vivo-spike-v3/_lab/formato";
import {
  accion,
  alternativas,
  bandeja,
  compromisosVivos,
  disponibilidadFutura,
  huecosLibres,
  intersectar,
  margenAntesDe,
  mundoDe,
  ocupacionesDelEstudiante,
  posiciones,
  simularPaso,
  total,
  unir,
  validarCambioDeHorario,
  validarUbicacion,
} from "@/app/demo/plan-vivo-spike-v3/_lab/motor";
import { mundoDelEscenario, proyectar } from "@/app/demo/plan-vivo-spike-v3/_lab/proyeccion";
import type { EstadoLab } from "@/app/demo/plan-vivo-spike-v3/_lab/tipos";

/**
 * 🧪 **Laboratorio descartable «Mi Plan vivo» V3** — motor, cuentas, invariantes y aislamiento.
 *
 * No se prueba que el motor sea bueno: se prueba que ninguna cifra contradiga a los
 * bloques, que lo fijo no se mueva, que comprometerse no sea avanzar, que cada paso
 * del escenario parta del anterior y que el plan real no cambie al simular.
 */

vi.mock("next/server", () => ({ connection: async () => {} }));

const RAIZ = process.cwd();
const RAIZ_V3 = resolve(RAIZ, "app/demo/plan-vivo-spike-v3");
const fuentes = (dir: string): string[] =>
  readdirSync(dir).flatMap((n) => {
    const abs = join(dir, n);
    return statSync(abs).isDirectory() ? fuentes(abs) : [abs];
  });
const sinComentarios = (s: string) => s.replace(/\/\*[\s\S]*?\*\//g, " ").replace(/^\s*\/\/.*$/gm, "");
const huella = (dir: string) => {
  const h = createHash("sha256");
  for (const f of fuentes(dir).sort()) {
    h.update(relative(dir, f));
    h.update(readFileSync(f));
  }
  return h.digest("hex");
};

const MAR = "2026-09-15";
const MIE = "2026-09-16";
const JUE = "2026-09-17";
const VIE = "2026-09-18";
const tramoDeEvaluacion = (id: string) => EVALUACIONES.find((e) => e.id === id)!.tramo;
const conAcciones = (...acciones: AccionDelLab[]) => aplicarTodas(acciones);
const BASE = estadoInicial();

// ── Aislamiento ───────────────────────────────────────────────────────────────────

describe("El laboratorio V3 está aislado", () => {
  const codigo = fuentes(RAIZ_V3)
    .filter((f) => /\.(ts|tsx)$/.test(f))
    .map((f) => ({ f, src: sinComentarios(readFileSync(f, "utf8")) }));

  it("hay código que revisar", () => expect(codigo.length).toBeGreaterThan(10));

  it("no llama a fetch, no persiste y no toca la base ni un endpoint", () => {
    for (const { f, src } of codigo) {
      expect(src, f).not.toMatch(/\bfetch\s*\(|XMLHttpRequest|WebSocket|localStorage|sessionStorage|indexedDB|sendBeacon/);
      expect(src, f).not.toMatch(/supabase|@\/lib\/server|@\/lib\/client|["'`]\/api\//);
    }
  });

  it("no importa el dominio productivo, las pantallas, el shell ni otra versión del laboratorio", () => {
    for (const { f, src } of codigo) {
      expect(src, f).not.toMatch(/from\s+["']@\/(lib|components)\//);
      expect(src, f).not.toMatch(/plan-vivo-spike\/|plan-vivo-spike-v2/);
    }
  });

  it("nada del producto, de V1 ni de V2 importa V3", () => {
    const otros = ["app", "components", "lib"].flatMap((d) => fuentes(resolve(RAIZ, d))).filter((f) => /\.(ts|tsx)$/.test(f) && !f.startsWith(RAIZ_V3));
    expect(otros.length).toBeGreaterThan(50);
    for (const f of otros) expect(readFileSync(f, "utf8"), f).not.toContain("plan-vivo-spike-v3");
  });

  it("V1 y V2 quedan byte por byte como estaban", () => {
    expect(huella(resolve(RAIZ, "app/demo/plan-vivo-spike"))).toBe("e3b11d2355d9c290e0e0a812bbbee9ef87a5f6b14b67779d68dac1ca2913be1c");
    expect(huella(resolve(RAIZ, "app/demo/plan-vivo-spike-v2"))).toBe("3c4d5a849b11e4ee365b660472565480c8a35a6466b2d0bdfaf9b49e53ee6c6a");
  });

  it("lee su propio flag y ningún otro", () => {
    const page = sinComentarios(readFileSync(resolve(RAIZ_V3, "page.tsx"), "utf8"));
    expect(page).toContain('process.env.PLAN_VIVO_SPIKE_V3 !== "1"');
    expect(page).not.toMatch(/PLAN_VIVO_SPIKE(_V2)?\b(?!_V3)/);
  });

  it("no hay selector Plan | Calendario ni una vista Plan separada", () => {
    for (const { f, src } of codigo) {
      expect(src, f).not.toMatch(/VISTA\.PLAN|vista=calendario|["']PLAN["']\s*,\s*["']CALENDARIO["']|Plan \| Calendario/);
    }
  });

  it("el copy no muestra puntajes, porcentajes, readiness, dominio afirmado ni inglés", () => {
    for (const { f, src } of codigo.filter((x) => !x.f.endsWith("tipos.ts"))) {
      expect(src, f).not.toMatch(/\bscore\b|readiness|puntaje|\/100|dominaste|listo para rendir|vas a aprobar|no vas a llegar|estás atrasad|productividad|workitem|work item/i);
      expect(src, f).not.toMatch(/\d\s*%(?!["'`])/);
    }
  });

  describe("la ruta responde 404 sin su flag", () => {
    const original = { v1: process.env.PLAN_VIVO_SPIKE, v2: process.env.PLAN_VIVO_SPIKE_V2, v3: process.env.PLAN_VIVO_SPIKE_V3 };
    afterEach(() => {
      for (const [k, v] of [
        ["PLAN_VIVO_SPIKE", original.v1],
        ["PLAN_VIVO_SPIKE_V2", original.v2],
        ["PLAN_VIVO_SPIKE_V3", original.v3],
      ] as const) {
        if (v === undefined) delete process.env[k];
        else process.env[k] = v;
      }
    });
    const params = { searchParams: Promise.resolve({}) };
    const es404 = (e: unknown) => String((e as { digest?: string }).digest ?? "").includes("404");

    it("sin ningún flag: 404", async () => {
      delete process.env.PLAN_VIVO_SPIKE;
      delete process.env.PLAN_VIVO_SPIKE_V2;
      delete process.env.PLAN_VIVO_SPIKE_V3;
      const { default: V3 } = await import("@/app/demo/plan-vivo-spike-v3/page");
      await expect(V3(params).catch((e) => (es404(e) ? "404" : e))).resolves.toBe("404");
    });

    it("prender V1 y V2 no prende V3", async () => {
      process.env.PLAN_VIVO_SPIKE = "1";
      process.env.PLAN_VIVO_SPIKE_V2 = "1";
      delete process.env.PLAN_VIVO_SPIKE_V3;
      const { default: V3 } = await import("@/app/demo/plan-vivo-spike-v3/page");
      await expect(V3(params).catch((e) => (es404(e) ? "404" : e))).resolves.toBe("404");
    });

    it("con su flag responde", async () => {
      process.env.PLAN_VIVO_SPIKE_V3 = "1";
      const { default: V3 } = await import("@/app/demo/plan-vivo-spike-v3/page");
      expect(await V3(params)).toBeTruthy();
    });
  });
});

// ── Cuentas ───────────────────────────────────────────────────────────────────────

describe("El plan real dice lo que diseñó el fixture", () => {
  const p = proyectar(BASE, "REAL");

  it("8 h 10 pendientes, 14 h disponibles, 7 h 10 sin ubicar, 1 h comprometida", () => {
    const t = p.totales;
    expect([enHoras(t.pendiente), enHoras(t.capacidad), enHoras(t.sinUbicar), enHoras(t.comprometido)]).toEqual(["8 h 10", "14 h", "7 h 10", "1 h"]);
    expect(t.simulado).toBe(0);
  });

  it("margen: 4 h antes de la entrega de Bases y 4 h 30 antes del parcial", () => {
    expect(p.margenes.map((m) => [m.evaluacionId, enHoras(m.minutos)])).toEqual([
      [ID.ENTREGA_BD, "4 h"],
      [ID.PARCIAL, "4 h 30"],
    ]);
  });

  it("la bandeja no tiene nada ya ocurrido ni comprometido, y va por prioridad", () => {
    expect(p.pendientes).not.toContain(ID.RESUMEN_U4);
    const orden = p.pendientes.map((id) => ["MUY_ALTA", "ALTA", "MEDIA", "BAJA"].indexOf(accion(id)!.prioridad));
    expect([...orden].sort((a, b) => a - b)).toEqual(orden);
    expect(p.pendientes).toHaveLength(8);
  });

  it("la historia aparece donde ocurrió, fuera de la bandeja", () => {
    const historia = p.items.filter((it) => it.tipo === "COMPLETADA" || it.tipo === "EVIDENCIA" || (it.tipo === "COMPROMISO" && it.estado === "INCUMPLIDO"));
    expect(historia.map((h) => h.clave).sort()).toEqual([ID.COMPROMISO_PIPELINE, ID.REG_CINEMATICA, ID.REG_CONSIGNA, ID.REG_LIM_TEORIA, ID.REG_PIPELINE].sort());
    for (const h of historia) {
      expect(h.fin, h.clave).toBeLessThanOrEqual(p.ahora);
      expect(h.movilidad).toBe("HISTORICO");
    }
    expect(p.items.find((x) => x.clave === ID.REG_LIM_TEORIA)!.ini).toBe(instante("2026-09-14", "10:00"));
  });

  it("todo rango es válido y con fuente", () => {
    for (const a of ACCIONES) {
      expect(a.duracion.min, a.id).toBeLessThanOrEqual(a.duracion.probable);
      expect(a.duracion.probable, a.id).toBeLessThanOrEqual(a.duracion.max);
      expect(a.confianza.fuente.length, a.id).toBeGreaterThan(5);
    }
  });
});

const MUESTRA: [string, EstadoLab][] = [
  ...Object.entries(ESTADOS_DEMOSTRATIVOS).map(([k, d]) => [k, aplicarTodas(d.acciones)] as [string, EstadoLab]),
  ["ubicadas y comprometidas", conAcciones({ tipo: "UBICAR", id: ID.LIMITES, ini: instante(MAR, "19:00"), duracion: 60 }, { tipo: "UBICAR", id: ID.CINEMATICA, ini: instante(VIE, "14:00"), duracion: 70 }, { tipo: "COMPROMETER", id: ID.LIMITES })],
  ["cinco horas más", conAcciones({ tipo: "AJUSTAR_DISPONIBILIDAD", ventanas: [...BASE.ventanas, ...CINCO_HORAS.map((v) => ({ id: v.id, ...instanteDe(v.tramo), origen: "AGREGADA" as const }))] })],
];

describe.each(MUESTRA)("Las cifras salen de los bloques — %s", (_, estado) => {
  for (const plano of ["REAL", "ESCENARIO"] as const) {
    const p = proyectar(estado, plano);
    const m = plano === "REAL" ? mundoDe(estado) : mundoDelEscenario(estado).mundo;

    it(`${plano}: pendiente = comprometido + ubicado + sin ubicar, y cada parte suma sus bloques`, () => {
      const t = p.totales;
      expect(t.pendiente).toBe(t.comprometido + t.ubicado + t.sinUbicar);
      const ubicadas = p.items.filter((x) => x.tipo === "PROPUESTA" && x.ubicacion === "ELEGIDA");
      expect(t.ubicado).toBe(ubicadas.reduce((s, x) => s + (x.fin - x.ini), 0));
      const sinUbicar = p.pendientes.filter((id) => p.posiciones[id].tipo !== "UBICADA");
      expect(t.sinUbicar).toBe(sinUbicar.reduce((s, id) => s + accion(id)!.duracion.probable, 0));
      const simuladas = p.items.filter((x) => x.tipo === "COMPLETADA" && x.estado === "SIMULADA");
      expect(t.simulado).toBe(simuladas.reduce((s, x) => s + (x.fin - x.ini), 0));
    });

    it(`${plano}: capacidad − usado dentro = libre, medido sobre los huecos`, () => {
      const t = p.totales;
      expect(t.capacidad - t.usadoDentro).toBe(t.libre);
      expect(t.libre).toBe(total(huecosLibres(m)));
      expect(t.capacidad).toBe(total(disponibilidadFutura(m)));
    });

    it(`${plano}: nada del estudiante pisa una clase, una evaluación ni otro bloque`, () => {
      const ocupan = [...ocupacionesDelEstudiante(m).filter((o) => o.fin > m.ahora), ...Object.entries(p.posiciones).flatMap(([id, x]) => (x.tipo === "SUGERIDA" ? [{ id, ini: x.ini, fin: x.fin }] : []))];
      const fijos = p.items.filter((x) => x.tipo === "CLASE" || x.tipo === "EVALUACION");
      for (const o of ocupan) {
        for (const f of fijos) expect(o.ini < f.fin && f.ini < o.fin, `${o.id} pisa ${f.clave}`).toBe(false);
        for (const q of ocupan) if (q !== o) expect(o.ini < q.fin && q.ini < o.fin, `${o.id} pisa ${q.id}`).toBe(false);
      }
    });

    it(`${plano}: las sugerencias entran completas, en la disponibilidad, con prerrequisitos y plazos`, () => {
      const disp = unir(m.ventanas);
      for (const [id, x] of Object.entries(p.posiciones)) {
        if (x.tipo !== "SUGERIDA") continue;
        const a = accion(id)!;
        expect(x.fin - x.ini, id).toBe(a.duracion.probable);
        expect(x.ini, id).toBeGreaterThanOrEqual(p.ahora);
        expect(total(intersectar([x], disp)), `${id} fuera de la disponibilidad`).toBe(x.fin - x.ini);
        if (a.antesDe) expect(x.fin).toBeLessThanOrEqual(instanteDe(tramoDeEvaluacion(a.antesDe)).ini);
        for (const r of a.requiere) {
          const pr = p.posiciones[r];
          if (pr && pr.tipo !== "SIN_LUGAR") expect(pr.fin, `${id} antes de ${r}`).toBeLessThanOrEqual(x.ini);
        }
      }
    });

    it(`${plano}: el margen del encabezado es el del motor`, () => {
      for (const mg of p.margenes) expect(mg.minutos).toBe(margenAntesDe(m, mg.evaluacionId));
    });

    it(`${plano}: calendario y Gantt leen el mismo escenario`, () => {
      for (const s of m.simuladas) {
        const tema = accion(s.accionId)!.tema;
        const fila = p.gantt[accion(s.accionId)!.materia].temas.find((x) => x.id === tema)!;
        expect(fila.piezas.some((pz) => pz.id === s.accionId && pz.estado === "SIMULADA") || !accion(s.accionId)!.recorrido).toBe(true);
        expect(fila.ultimaHecha).toBeGreaterThanOrEqual(p.items.find((x) => x.clave === `SIM-${s.accionId}`)!.fin);
      }
      for (const id of p.retiradas) expect(p.pendientes).not.toContain(id);
    });
  }
});


// ── Lo que se mueve y lo que no ──────────────────────────────────────────────────────

describe("Clases y evaluaciones son inamovibles", () => {
  const m = mundoDe(BASE);
  it("en la proyección, clases y evaluaciones son INAMOVIBLE, y ninguna acción del laboratorio las toca", () => {
    const p = proyectar(BASE, "REAL");
    for (const it of p.items.filter((x) => x.tipo === "CLASE" || x.tipo === "EVALUACION")) expect(it.movilidad).toBe("INAMOVIBLE");
    const reducer = sinComentarios(readFileSync(resolve(RAIZ_V3, "_lab/estado.ts"), "utf8"));
    expect(reducer).not.toMatch(/CLASES|EVALUACIONES/);
  });

  it("una clase o una evaluación no se ubican como propuesta", () => {
    expect(validarUbicacion(m, ID.CLASE_ANA_MIE, instante(MAR, "19:00"), 60).duros[0].tipo).toBe("INAMOVIBLE");
    expect(validarUbicacion(m, ID.PARCIAL, instante(MAR, "19:00"), 60).duros[0].tipo).toBe("INAMOVIBLE");
  });

  it("encima de una clase: conflicto duro con el motivo concreto", () => {
    const v = validarUbicacion(m, ID.LIMITES, instante(MIE, "14:00"), 60);
    expect(v.duros.map((d) => d.tipo)).toContain("CLASE");
    expect(v.duros[0].texto).toBe("Se superpone con la clase de Análisis Matemático I (miércoles 16, 14:00–16:00).");
    expect(reducir(BASE, { tipo: "UBICAR", id: ID.LIMITES, ini: instante(MIE, "14:00"), duracion: 60 })).toBe(BASE);
  });

  it("encima de una evaluación: conflicto duro", () => {
    expect(validarUbicacion(m, ID.CINEMATICA, instante(VIE, "18:30"), 60).duros.map((d) => d.tipo)).toContain("EVALUACION");
  });
});

describe("Conflictos duros", () => {
  const m = mundoDe(BASE);
  const tipos = (id: string, fecha: string, hora: string, dur: number) => validarUbicacion(m, id, instante(fecha, hora), dur).duros.map((d) => d.tipo);

  it("en el pasado", () => expect(tipos(ID.LIMITES, MAR, "10:30", 60)).toContain("PASADO"));
  it("fuera de la grilla: no entra completa", () => expect(tipos(ID.LIMITES, MIE, "22:30", 60)).toContain("FUERA_DE_GRILLA"));
  it("encima de un compromiso", () => expect(tipos(ID.CINEMATICA, JUE, "15:30", 60)).toContain("COMPROMISO"));
  it("antes de la clase que da el tema", () => expect(tipos(ID.PRACTICA_DERIVADAS, MIE, "09:00", 60)).toContain("NO_ANTES_DE"));
  it("después de su fecha límite", () => expect(tipos(ID.NORMALIZAR, VIE, "14:00", 90)).toContain("PLAZO"));
  it("antes de su prerrequisito ubicado", () => {
    const e = conAcciones({ tipo: "UBICAR", id: ID.LIMITES, ini: instante(JUE, "19:00"), duracion: 60 });
    expect(validarUbicacion(mundoDe(e), ID.PRACTICA_DERIVADAS, instante(MIE, "16:30"), 60).duros.map((d) => d.tipo)).toContain("DEPENDENCIA");
  });
  it("ofrece horarios donde sí entra, y todos son válidos", () => {
    const alt = alternativas(m, ID.LIMITES, 60);
    expect(alt.length).toBeGreaterThan(0);
    for (const ini of alt) expect(validarUbicacion(m, ID.LIMITES, ini, 60).duros).toEqual([]);
  });
});

describe("Advertencias blandas: sólo con consecuencia material, y nunca bloquean", () => {
  const m = mundoDe(BASE);

  it("Economía el martes 19:00 deja a Límites sin su último bloque antes de la clase de Derivadas", () => {
    const v = validarUbicacion(m, ID.ECONOMIA_U2, instante(MAR, "19:00"), 40);
    expect(v.duros).toEqual([]);
    expect(v.blandos).toEqual([{ tipo: "PRIORIDAD", afectada: ID.LIMITES, texto: "Si ubicás Economía el martes a las 19:00, Límites pierde el último bloque completo antes de la clase de Derivadas." }]);
  });

  it("ubicar igual se puede: el reducer no bloquea por preferencia del motor", () => {
    const e = reducir(BASE, { tipo: "UBICAR", id: ID.ECONOMIA_U2, ini: instante(MAR, "19:00"), duracion: 40 });
    expect(e.ubicaciones[ID.ECONOMIA_U2]).toEqual({ ini: instante(MAR, "19:00"), duracion: 40 });
  });

  it("misma prioridad se reordena sin aviso: el refuerzo en el lugar de la teoría, pipeline en el de Cinemática", () => {
    expect(validarUbicacion(m, ID.REFUERZO_LIMITES, instante(JUE, "19:00"), 45).blandos).toEqual([]);
    expect(validarUbicacion(m, ID.PIPELINE, instante(VIE, "14:00"), 30).blandos).toEqual([]);
  });

  it("una prioridad menor antes que una mayor, sin consecuencia, tampoco avisa", () => {
    expect(validarUbicacion(m, ID.ECONOMIA_U2, instante("2026-09-19", "10:00"), 40).blandos).toEqual([]);
  });

  it("si el máximo no entra, avisa", () => {
    const e = conAcciones({ tipo: "UBICAR", id: ID.PIPELINE, ini: instante(MAR, "20:00"), duracion: 30 });
    expect(validarUbicacion(mundoDe(e), ID.LIMITES, instante(MAR, "19:00"), 60).blandos.map((b) => b.tipo)).toContain("MAXIMO");
  });
});

describe("Propuestas y compromisos", () => {
  it("una propuesta se ubica, se mueve y vuelve a la bandeja, y sigue en la bandeja mientras está ubicada", () => {
    let e = reducir(BASE, { tipo: "UBICAR", id: ID.LIMITES, ini: instante(MAR, "19:00"), duracion: 60 });
    expect(proyectar(e, "REAL").posiciones[ID.LIMITES]).toMatchObject({ tipo: "UBICADA", ini: instante(MAR, "19:00") });
    expect(proyectar(e, "REAL").pendientes).toContain(ID.LIMITES);
    e = reducir(e, { tipo: "UBICAR", id: ID.LIMITES, ini: instante(JUE, "19:00"), duracion: 60 });
    expect(proyectar(e, "REAL").posiciones[ID.LIMITES]).toMatchObject({ tipo: "UBICADA", ini: instante(JUE, "19:00") });
    e = reducir(e, { tipo: "DEVOLVER", id: ID.LIMITES });
    expect(proyectar(e, "REAL").posiciones[ID.LIMITES].tipo).toBe("SUGERIDA");
  });

  it("ubicar o comprometerse no crea progreso, no quita pendiente y no mueve el Gantt", () => {
    const antes = proyectar(BASE, "REAL");
    const ubicada = conAcciones({ tipo: "UBICAR", id: ID.LIMITES, ini: instante(MAR, "19:00"), duracion: 60 });
    const comprometida = reducir(ubicada, { tipo: "COMPROMETER", id: ID.LIMITES });
    const movida = reducir(comprometida, { tipo: "CAMBIAR_HORARIO", compromisoId: `COM-LOCAL-${ID.LIMITES}`, ini: instante(JUE, "19:00") });
    for (const e of [ubicada, comprometida, movida]) {
      const p = proyectar(e, "REAL");
      expect(p.gantt).toEqual(antes.gantt);
      expect(p.totales.pendiente).toBe(antes.totales.pendiente);
      expect(p.simuladas).toEqual([]);
    }
    expect(proyectar(comprometida, "REAL").pendientes).not.toContain(ID.LIMITES);
  });

  it("comprometerse guarda día, hora, duración y evidencia, vinculado a la acción", () => {
    const e = conAcciones({ tipo: "UBICAR", id: ID.LIMITES, ini: instante(MAR, "19:00"), duracion: 60 }, { tipo: "COMPROMETER", id: ID.LIMITES });
    const c = e.compromisos.find((x) => x.accionId === ID.LIMITES)!;
    expect(c).toMatchObject({ estado: "CONFIRMADO", ini: instante(MAR, "19:00"), fin: instante(MAR, "20:00"), evidencia: accion(ID.LIMITES)!.evidencia, origen: "LOCAL" });
    expect(e.ubicaciones[ID.LIMITES]).toBeUndefined();
    expect(e.bitacora.at(-1)!.texto).toContain("No registra progreso");
  });

  it("un compromiso no se mueve como una propuesta: sólo con CAMBIAR_HORARIO, que conserva la promesa", () => {
    const m = mundoDe(BASE);
    expect(validarUbicacion(m, ID.RESUMEN_U4, instante(VIE, "14:00"), 60).duros[0].tipo).toBe("INAMOVIBLE");
    expect(reducir(BASE, { tipo: "UBICAR", id: ID.RESUMEN_U4, ini: instante(VIE, "14:00"), duracion: 60 })).toBe(BASE);
    const e = reducir(BASE, { tipo: "CAMBIAR_HORARIO", compromisoId: ID.COMPROMISO_U4, ini: instante(VIE, "14:00") });
    const c = e.compromisos.find((x) => x.id === ID.COMPROMISO_U4)!;
    expect([c.ini, c.promesaOriginal.ini, c.cambios.length]).toEqual([instante(VIE, "14:00"), instante(JUE, "15:00"), 1]);
    expect(e.bitacora.at(-1)!.texto).toContain("Cambiaste el horario");
  });

  it("un compromiso no se renegocia encima de una clase, ni uno incumplido ni un Focus en curso", () => {
    expect(validarCambioDeHorario(mundoDe(BASE), ID.COMPROMISO_U4, instante(JUE, "11:00")).duros.map((d) => d.tipo)).toContain("CLASE");
    expect(validarCambioDeHorario(mundoDe(BASE), ID.COMPROMISO_PIPELINE, instante(VIE, "14:00")).duros[0].tipo).toBe("INAMOVIBLE");
    const reloj = aplicarTodas(ESTADOS_DEMOSTRATIVOS.reloj.acciones);
    const focus = reloj.compromisos.find((c) => c.estado === "EN_CURSO")!;
    expect(validarCambioDeHorario(mundoDe(reloj), focus.id, instante(VIE, "14:00")).duros[0].texto).toContain("Focus en curso");
    expect(proyectar(reloj, "REAL").items.find((x) => x.clave === focus.id)).toMatchObject({ tipo: "FOCUS", movilidad: "INAMOVIBLE" });
  });
});

// ── Simulación ────────────────────────────────────────────────────────────────────────

describe("Simulación", () => {
  const cinco = [ID.LIMITES, ID.TEORIA_DERIVADAS, ID.PRACTICA_DERIVADAS, ID.CINEMATICA, ID.PIPELINE];
  const simular = (e: EstadoLab, ids: readonly string[]) => ids.reduce((x, id) => reducir(x, { tipo: "SIMULAR", id }), e);

  it("simular no escribe el plan real", () => {
    const e = simular(BASE, cinco);
    expect(proyectar(e, "REAL")).toEqual(proyectar(BASE, "REAL"));
    expect([e.ubicaciones, e.compromisos, e.ventanas]).toEqual([BASE.ubicaciones, BASE.compromisos, BASE.ventanas]);
  });

  it("se acumulan hasta cinco, y el sexto se rechaza", () => {
    const e = simular(BASE, cinco);
    expect(e.pasos).toEqual(cinco);
    expect(MAXIMO_DE_PASOS).toBe(5);
    expect(reducir(e, { tipo: "SIMULAR", id: ID.ECONOMIA_U2 })).toBe(e);
  });

  it("cada paso parte del mundo del paso anterior, no del plan real", () => {
    const e = simular(BASE, cinco);
    for (let n = 1; n <= cinco.length; n++) {
      const previo = mundoDelEscenario(e, n - 1).mundo;
      expect(mundoDelEscenario(e, n).mundo).toEqual(simularPaso(previo, cinco[n - 1]));
      expect(mundoDelEscenario(e, n).mundo.simuladas.at(-1)!.ini).toBe((posiciones(previo)[cinco[n - 1]] as { ini: number }).ini);
    }
  });

  it("Límites simulada: el refuerzo se retira y la práctica de Derivadas se adelanta al jueves 19:45", () => {
    const e = simular(BASE, [ID.LIMITES]);
    const real = proyectar(e, "REAL");
    const esc = proyectar(e, "ESCENARIO");
    expect(esc.retiradas).toEqual([ID.REFUERZO_LIMITES]);
    expect(real.posiciones[ID.PRACTICA_DERIVADAS]).toMatchObject({ ini: instante(VIE, "08:30") });
    expect(esc.posiciones[ID.PRACTICA_DERIVADAS]).toMatchObject({ ini: instante(JUE, "19:45") });
    expect(enHoras(esc.margenes.find((x) => x.evaluacionId === ID.PARCIAL)!.minutos)).toBe("5 h 15");
    const lineas = explicarPaso(real, esc, ID.LIMITES).map((l) => l.tipo);
    expect([...new Set(lineas)]).toEqual(["SIMULADA", "ANTES", "LIBERA", "ADELANTA", "MARGEN", "GANTT"]);
  });

  it("el Gantt cambia con la simulación: fila de Límites y fin de Derivadas", () => {
    const e = simular(BASE, [ID.LIMITES]);
    const antes = proyectar(e, "REAL").gantt.ANALISIS.temas;
    const despues = proyectar(e, "ESCENARIO").gantt.ANALISIS.temas;
    const fila = (xs: typeof antes, id: string) => xs.find((x) => x.id === id)!;
    expect([fila(antes, "TEM-V3-ANA-2").etiqueta, fila(despues, "TEM-V3-ANA-2").etiqueta]).toEqual(["Recorrido registrado · 1 de 2", "Simulado · 2 de 2"]);
    expect(fila(despues, "TEM-V3-ANA-3").trabajo!.fin).toBeLessThan(fila(antes, "TEM-V3-ANA-3").trabajo!.fin);
    expect(fila(antes, "TEM-V3-ANA-3").dependencia?.estado).toBe("ESPERA");
    expect(fila(despues, "TEM-V3-ANA-3").dependencia?.estado).toBe("DESBLOQUEADA");
  });

  it("no se simula una práctica sin su prerrequisito", () => {
    expect(reducir(BASE, { tipo: "SIMULAR", id: ID.PRACTICA_DERIVADAS })).toBe(BASE);
  });

  it("deshacer vuelve exactamente al escenario anterior, y reiniciar al plan real", () => {
    const cuatro = simular(BASE, cinco.slice(0, 4));
    const deshecho = reducir(simular(BASE, cinco), { tipo: "DESHACER_PASO" });
    expect(proyectar(deshecho, "ESCENARIO")).toEqual(proyectar(cuatro, "ESCENARIO"));
    const reiniciado = reducir(deshecho, { tipo: "REINICIAR_ESCENARIO" });
    expect(reiniciado.pasos).toEqual([]);
    expect(proyectar(reiniciado, "ESCENARIO")).toEqual(proyectar(BASE, "ESCENARIO"));
    expect(proyectar(reiniciado, "ESCENARIO").totales).toEqual(proyectar(BASE, "REAL").totales);
  });

  it("un repaso simulado no mueve el recorrido del Gantt", () => {
    const e = simular(BASE, [ID.ECONOMIA_U2]);
    const antes = proyectar(BASE, "REAL").gantt.ECONOMIA.temas.map((t) => t.etiqueta);
    expect(proyectar(e, "ESCENARIO").gantt.ECONOMIA.temas.map((t) => t.etiqueta)).toEqual(antes);
  });
});

// ── Reloj, rescate y disponibilidad ───────────────────────────────────────────────────

describe("El paso del tiempo", () => {
  const e = reducir(BASE, { tipo: "ADELANTAR_RELOJ", fecha: JUE, hora: "19:10" });

  it("el compromiso que no empezó queda incumplido, en su horario, y su trabajo vuelve a la bandeja", () => {
    const c = e.compromisos.find((x) => x.id === ID.COMPROMISO_U4)!;
    expect([c.estado, c.ini]).toEqual(["INCUMPLIDO", instante(JUE, "15:00")]);
    expect(proyectar(e, "REAL").pendientes).toContain(ID.RESUMEN_U4);
    expect(proyectar(e, "REAL").items.find((x) => x.clave === ID.COMPROMISO_U4)).toMatchObject({ tipo: "COMPROMISO", estado: "INCUMPLIDO", movilidad: "HISTORICO" });
  });

  it("sólo se recalculan propuestas futuras; ningún compromiso se mueve solo", () => {
    for (const [id, p] of Object.entries(proyectar(e, "REAL").posiciones)) if (p.tipo === "SUGERIDA") expect(p.ini, id).toBeGreaterThanOrEqual(e.ahora);
    expect(e.compromisos.map((c) => [c.id, c.ini])).toEqual(BASE.compromisos.map((c) => [c.id, c.ini]));
  });

  it("Reorganizar sin cortar ubica propuestas (no compromisos) con su duración entera, y el incumplido sigue incumplido", () => {
    const r = reducir(e, { tipo: "REORGANIZAR" });
    expect(Object.keys(r.ubicaciones).length).toBeGreaterThan(0);
    for (const [id, u] of Object.entries(r.ubicaciones)) expect(u.duracion, id).toBe(accion(id)!.duracion.probable);
    expect(compromisosVivos(mundoDe(r))).toEqual(compromisosVivos(mundoDe(e)));
    expect(r.compromisos.find((x) => x.id === ID.COMPROMISO_U4)!.estado).toBe("INCUMPLIDO");
  });
});

describe("Reajustar disponibilidad", () => {
  it("cinco horas más: 14 h → 19 h, y el margen antes del parcial crece", () => {
    const ventanas = [...BASE.ventanas, ...CINCO_HORAS.map((v) => ({ id: v.id, ...instanteDe(v.tramo), origen: "AGREGADA" as const }))];
    const e = reducir(BASE, { tipo: "AJUSTAR_DISPONIBILIDAD", ventanas });
    expect(enHoras(proyectar(e, "REAL").totales.capacidad)).toBe("19 h");
    expect(margenAntesDe(mundoDe(e), ID.PARCIAL)).toBeGreaterThan(margenAntesDe(mundoDe(BASE), ID.PARCIAL));
    expect(bandeja(mundoDe(e)).map((a) => a.id)).toEqual(bandeja(mundoDe(BASE)).map((a) => a.id));
  });

  it("las clases nunca se mueven para hacer lugar", () => {
    // 13:00–17:00 del miércoles: pisa la clase de 14:00 a 16:00 y se une a la franja de 16:30. Suma 60 + 30.
    const ventanas = [...BASE.ventanas, { id: "X", ini: instante(MIE, "13:00"), fin: instante(MIE, "17:00"), origen: "AGREGADA" as const }];
    const e = reducir(BASE, { tipo: "AJUSTAR_DISPONIBILIDAD", ventanas });
    const clases = (x: EstadoLab) => proyectar(x, "REAL").items.filter((i) => i.tipo === "CLASE").map((i) => [i.clave, i.ini, i.fin]);
    expect(clases(e)).toEqual(clases(BASE));
    expect(total(disponibilidadFutura(mundoDe(e)))).toBe(total(disponibilidadFutura(mundoDe(BASE))) + 90);
  });
});
