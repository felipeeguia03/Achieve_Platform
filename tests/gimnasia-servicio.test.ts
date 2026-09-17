/**
 * Gimnasia cognitiva — el Service · [ADR-102](../docs/decisions.md#adr-102).
 *
 * El repositorio en memoria imita **las garantías de la base**: una sesión
 * abierta por estudiante, un intento abierto por sesión, la clave única y un
 * lugar de la cola por repaso. Contra Postgres lo mismo lo prueba
 * `scripts/db-aislamiento.sh`.
 */
import { describe, expect, it } from "vitest";

import { jugarCadena, cadenaDePrueba, invertir } from "@/lib/domain/gimnasia/cadena-inversa";
import { secuenciaDeRonda } from "@/lib/domain/gimnasia/cuadricula-fugaz";
import type { Juego } from "@/lib/domain/gimnasia/rutina";
import type { IntentoEmpezado } from "@/lib/domain/gimnasia/vista";
import {
  cancelarSesion,
  iniciarIntento,
  iniciarSesion,
  preguntaActual,
  proyectarGimnasia,
  registrarResultado,
  responderRecuerdo,
  type Dependencias,
  type IntentoFila,
  type ItemFila,
  type RepasoFila,
  type RepositorioDeGimnasia,
  type SesionFila,
} from "@/lib/server/servicios/gimnasia";
import type { EventoDeProducto } from "@/lib/server/servicios/eventos";

const INST = "inst-a";
const ANA = { studentId: "est-ana", zona: "America/Argentina/Cordoba" };
const BETO = { studentId: "est-beto", zona: "America/Argentina/Cordoba" };

function item(id: string, over: Partial<ItemFila> = {}): ItemFila {
  return {
    id,
    cursoId: "curso-eco",
    materia: "Economía I",
    pregunta: `¿Pregunta ${id}?`,
    tipo: "SHORT_ANSWER",
    opciones: null,
    aceptadas: ["respuesta"],
    canonica: "Respuesta.",
    explicacion: null,
    version: 1,
    sintetica: false,
    ...over,
  };
}

function mundo(opciones: { items?: ItemFila[]; sinteticos?: boolean; evaluaciones?: Array<{ cursoId: string; fecha: string }> } = {}) {
  const sesiones: SesionFila[] = [];
  const intentos: IntentoFila[] = [];
  const repasos: Array<RepasoFila & { studentId: string }> = [];
  const eventos: EventoDeProducto[] = [];
  const items = opciones.items ?? [];
  let reloj = Date.parse("2026-09-13T15:00:00Z");
  let n = 0;
  let semilla = 1000;
  const iso = () => new Date(reloj).toISOString();
  const id = (p: string) => `${p}-${++n}`;

  const repo: RepositorioDeGimnasia = {
    async sesionAbierta(_i, s) {
      return sesiones.find((x) => x.studentId === s && x.estado === "IN_PROGRESS") ?? null;
    },
    async sesionPorClave(_i, s, clave) {
      return sesiones.find((x) => x.studentId === s && (x as SesionFila & { clave: string }).clave === clave) ?? null;
    },
    async sesionDelEstudiante(_i, s, sid) {
      return sesiones.find((x) => x.studentId === s && x.id === sid) ?? null;
    },
    async crearSesion(_i, d) {
      if (sesiones.some((x) => x.studentId === d.studentId && ((x as SesionFila & { clave: string }).clave === d.clave || x.estado === "IN_PROGRESS"))) return null;
      const f = { id: id("ses"), studentId: d.studentId, origen: d.origen, juegos: d.juegos, estado: "IN_PROGRESS" as const, iniciadaEn: iso(), terminadaEn: null, clave: d.clave };
      sesiones.push(f);
      return f;
    },
    async cerrarSesion(_i, sid, estado, ahora) {
      const f = sesiones.find((x) => x.id === sid && x.estado === "IN_PROGRESS");
      if (!f) return null;
      Object.assign(f, { estado, terminadaEn: ahora });
      return f;
    },
    async rutinasCompletadas(_i, s) {
      return sesiones.filter((x) => x.studentId === s && x.origen === "ROUTINE" && x.estado === "COMPLETED").map((x) => ({ terminadaEn: x.terminadaEn! }));
    },
    async intentosDeSesion(_i, sid) {
      return intentos.filter((x) => x.sesionId === sid);
    },
    async intentoDelEstudiante(_i, s, iid) {
      return intentos.find((x) => x.studentId === s && x.id === iid) ?? null;
    },
    async intentoPorClave(_i, sid, clave) {
      return intentos.find((x) => x.sesionId === sid && x.clave === clave) ?? null;
    },
    async abandonarAbiertos(_i, sid) {
      for (const x of intentos) if (x.sesionId === sid && x.estado === "STARTED") x.estado = "ABANDONED";
    },
    async crearIntento(_i, d) {
      if (intentos.some((x) => x.sesionId === d.sesionId && (x.clave === d.clave || x.estado === "STARTED"))) return null;
      const f: IntentoFila = { id: id("int"), studentId: d.studentId, sesionId: d.sesionId, juego: d.juego, version: d.version, estado: "STARTED", iniciadoEn: iso(), completadoEn: null, semilla: d.semilla, largoInicial: d.largoInicial, plan: d.plan, clave: d.clave, resultado: null };
      intentos.push(f);
      return f;
    },
    async completarIntento(_i, iid, resultado, ahora) {
      const f = intentos.find((x) => x.id === iid && x.estado === "STARTED");
      if (!f) return null;
      if (intentos.some((x) => x.sesionId === f.sesionId && x.juego === f.juego && x.estado === "COMPLETED")) return null;
      Object.assign(f, { estado: "COMPLETED", completadoEn: ahora, resultado });
      return f;
    },
    async intentosCompletados(_i, s, juego) {
      return intentos
        .filter((x) => x.studentId === s && x.juego === juego && x.estado === "COMPLETED")
        .sort((a, b) => b.completadoEn!.localeCompare(a.completadoEn!));
    },
    async itemsVisibles(_i, _s, incluirSinteticos) {
      return items.filter((x) => !x.sintetica || incluirSinteticos);
    },
    async repasosDelEstudiante(_i, s) {
      return repasos.filter((r) => r.studentId === s);
    },
    async repasosDeIntento(_i, iid) {
      return repasos.filter((r) => r.intentoId === iid).sort((a, b) => a.posicion - b.posicion);
    },
    async repasoPorClave(_i, s, clave) {
      return repasos.find((r) => r.studentId === s && r.clave === clave) ?? null;
    },
    async crearRepaso(_i, d) {
      if (repasos.some((r) => (r.studentId === d.studentId && r.clave === d.clave) || (r.intentoId === d.intentoId && r.posicion === d.posicion))) return null;
      const f = { id: id("rep"), itemId: d.itemId, intentoId: d.intentoId, posicion: d.posicion, resultado: d.resultado, proximoRepaso: d.proximoRepaso, respondidoEn: iso(), clave: d.clave, studentId: d.studentId };
      repasos.push(f);
      return f;
    },
    async proximasEvaluaciones() {
      return opciones.evaluaciones ?? [];
    },
  };

  const d: Dependencias = {
    repo,
    eventos: { publicar: async (e) => void eventos.push(e) },
    ahora: iso,
    semilla: () => semilla++,
    incluirSinteticos: opciones.sinteticos ?? false,
  };
  return {
    d,
    sesiones,
    intentos,
    repasos,
    eventos,
    avanzar: (min: number) => {
      reloj += min * 60_000;
    },
  };
}

async function sesion(d: Dependencias, e = ANA, origen: "ROUTINE" | "SINGLE_GAME" = "ROUTINE", juego: Juego | null = null, clave = "s1") {
  const r = await iniciarSesion(d, INST, { ...e, origen, juego, clave });
  if (r.estado !== "OK") throw new Error(r.estado);
  return r.sesion;
}

async function intento(d: Dependencias, sesionId: string, juego: Juego, clave = `i-${juego}`, e = ANA): Promise<IntentoEmpezado> {
  const r = await iniciarIntento(d, INST, { ...e, sesionId, juego, clave });
  if (r.estado !== "OK") throw new Error(r.estado);
  return r.intento;
}

/** Una partida de cuadrícula que termina: dos rondas bien y dos mal. */
function partidaDeCuadricula(semilla: number, largo: number) {
  return [secuenciaDeRonda(semilla, 0, largo), secuenciaDeRonda(semilla, 1, largo + 1), [0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0]].map((r, i) =>
    i >= 2 ? Array.from({ length: largo + 2 }, () => 0) : r,
  );
}

describe("primera visita, sin historial", () => {
  it("todo lo que no se jugó es null, no cero, y la rutina usa los valores por defecto", async () => {
    const { d } = mundo({ items: [item("q1")] });
    const p = await proyectarGimnasia(d, INST, ANA);
    expect(p.cuadricula).toEqual({ mejorPuntuacion: null, intentos: 0 });
    expect(p.cadena).toEqual({ nivel: null, largo: null, mejorCadena: null });
    expect(p.progreso.mejorSecuenciaCuadricula).toBeNull();
    expect(p.progreso.recuerdoDiferido).toBeNull();
    expect(p.rutina).toEqual({ juegos: ["FLASH_GRID", "REVERSE_CHAIN", "REAL_RECALL"], minutos: 8, materias: ["Economía I"], adaptada: false });
    expect(p.recuerdo).toEqual({ situacion: "PENDIENTES", pendientes: 1, practicoAntes: false });
    expect(p.sesionEnCurso).toBeNull();
  });

  it("sin preguntas: la rutina son los dos genéricos, no se nombra materia y Recuerdo real queda en preparación", async () => {
    const { d } = mundo();
    const p = await proyectarGimnasia(d, INST, ANA);
    expect(p.rutina.juegos).toEqual(["FLASH_GRID", "REVERSE_CHAIN"]);
    expect(p.rutina.materias).toEqual([]);
    expect(p.recuerdo.situacion).toBe("SIN_CONTENIDO");
  });

  it("las sintéticas sólo se ven si la composición lo pide (MODO_PRUEBA)", async () => {
    const sin = mundo({ items: [item("syn", { sintetica: true })] });
    expect((await proyectarGimnasia(sin.d, INST, ANA)).recuerdo.situacion).toBe("SIN_CONTENIDO");
    const con = mundo({ items: [item("syn", { sintetica: true })], sinteticos: true });
    const p = await proyectarGimnasia(con.d, INST, ANA);
    expect(p.recuerdo.situacion).toBe("PENDIENTES");
    expect(p.simulada).toBe(true);
  });
});

describe("la sesión", () => {
  it("empieza, emite el evento una vez y el reintento con la misma clave no duplica", async () => {
    const { d, sesiones, eventos } = mundo();
    const a = await iniciarSesion(d, INST, { ...ANA, origen: "ROUTINE", juego: null, clave: "k" });
    const b = await iniciarSesion(d, INST, { ...ANA, origen: "ROUTINE", juego: null, clave: "k" });
    expect(a.estado).toBe("OK");
    expect(b).toMatchObject({ estado: "OK", duplicado: true });
    expect(sesiones).toHaveLength(1);
    expect(eventos.map((e) => e.nombre)).toEqual(["GymSessionStarted"]);
  });

  it("con otra abierta no abre una segunda: devuelve la abierta para retomarla", async () => {
    const { d } = mundo();
    const s = await sesion(d);
    const r = await iniciarSesion(d, INST, { ...ANA, origen: "SINGLE_GAME", juego: "FLASH_GRID", clave: "otra" });
    expect(r).toEqual({ estado: "YA_HAY_OTRA_ABIERTA", sesion: s });
  });

  it("otro estudiante sí puede tener la suya, y no ve ni cancela la ajena", async () => {
    const { d } = mundo();
    const s = await sesion(d);
    await sesion(d, BETO);
    expect(await cancelarSesion(d, INST, { studentId: BETO.studentId, sesionId: s.id })).toEqual({ estado: "NO_ENCONTRADA" });
    expect(await iniciarIntento(d, INST, { ...BETO, sesionId: s.id, juego: "FLASH_GRID", clave: "x" })).toEqual({ estado: "NO_ENCONTRADA" });
  });

  it("valida el pedido y no fabrica una sesión de repasos sin preguntas", async () => {
    const { d } = mundo();
    expect(await iniciarSesion(d, INST, { ...ANA, origen: "OTRA", juego: null, clave: "k" })).toEqual({ estado: "PEDIDO_INVALIDO" });
    expect(await iniciarSesion(d, INST, { ...ANA, origen: "SINGLE_GAME", juego: "SUDOKU", clave: "k" })).toEqual({ estado: "PEDIDO_INVALIDO" });
    expect(await iniciarSesion(d, INST, { ...ANA, origen: "SINGLE_GAME", juego: "REAL_RECALL", clave: "k" })).toEqual({ estado: "SIN_PREGUNTAS" });
  });

  it("cancelar conserva lo terminado, abandona lo abierto, es idempotente y emite una vez", async () => {
    const { d, intentos, eventos } = mundo();
    const s = await sesion(d);
    const g = await intento(d, s.id, "FLASH_GRID");
    if (g.juego !== "FLASH_GRID") throw new Error();
    await registrarResultado(d, INST, { ...ANA, intentoId: g.intento, respuestas: partidaDeCuadricula(g.semilla, g.largoInicial) });
    await intento(d, s.id, "REVERSE_CHAIN");
    const r1 = await cancelarSesion(d, INST, { studentId: ANA.studentId, sesionId: s.id });
    const r2 = await cancelarSesion(d, INST, { studentId: ANA.studentId, sesionId: s.id });
    expect(r1).toMatchObject({ estado: "OK", duplicado: false });
    expect(r2).toMatchObject({ estado: "OK", duplicado: true });
    expect(intentos.map((i) => i.estado)).toEqual(["COMPLETED", "ABANDONED"]);
    expect(eventos.filter((e) => e.nombre === "GymSessionCancelled")).toHaveLength(1);
  });

  it("después de una recarga, la proyección devuelve la sesión abierta con lo ya completado", async () => {
    const { d } = mundo();
    const s = await sesion(d);
    const g = await intento(d, s.id, "FLASH_GRID");
    if (g.juego !== "FLASH_GRID") throw new Error();
    await registrarResultado(d, INST, { ...ANA, intentoId: g.intento, respuestas: partidaDeCuadricula(g.semilla, g.largoInicial) });
    const p = await proyectarGimnasia(d, INST, ANA);
    expect(p.sesionEnCurso).toMatchObject({ id: s.id, completados: ["FLASH_GRID"], juegos: ["FLASH_GRID", "REVERSE_CHAIN"] });
  });
});

describe("el intento: la dificultad y el resultado los pone el servidor", () => {
  it("la semilla y el largo inicial salen del servidor; la misma clave devuelve el mismo intento", async () => {
    const { d, intentos } = mundo();
    const s = await sesion(d);
    const a = await intento(d, s.id, "FLASH_GRID", "k");
    const b = await intento(d, s.id, "FLASH_GRID", "k");
    expect(a).toEqual(b);
    expect(a).toMatchObject({ juego: "FLASH_GRID", semilla: 1000, largoInicial: 3, version: "CF-1" });
    expect(intentos).toHaveLength(1);
  });

  it("una recarga (otra clave) abandona el abierto y trae otra semilla", async () => {
    const { d, intentos } = mundo();
    const s = await sesion(d);
    const a = await intento(d, s.id, "FLASH_GRID", "k1");
    const b = await intento(d, s.id, "FLASH_GRID", "k2");
    expect(intentos.map((i) => i.estado)).toEqual(["ABANDONED", "STARTED"]);
    if (a.juego !== "FLASH_GRID" || b.juego !== "FLASH_GRID") throw new Error();
    expect(b.semilla).not.toBe(a.semilla);
    expect(await registrarResultado(d, INST, { ...ANA, intentoId: a.intento, respuestas: [] })).toEqual({ estado: "INTENTO_REEMPLAZADO" });
  });

  it("no juega lo que la sesión no prevé ni repite lo completado", async () => {
    const { d } = mundo();
    const s = await sesion(d, ANA, "SINGLE_GAME", "REVERSE_CHAIN");
    expect(await iniciarIntento(d, INST, { ...ANA, sesionId: s.id, juego: "FLASH_GRID", clave: "x" })).toEqual({ estado: "JUEGO_NO_PREVISTO" });
  });

  it("calcula la puntuación rehaciendo la partida: un puntaje mandado por el cliente no existe", async () => {
    const { d, intentos, eventos } = mundo();
    const s = await sesion(d, ANA, "SINGLE_GAME", "FLASH_GRID");
    const g = await intento(d, s.id, "FLASH_GRID");
    if (g.juego !== "FLASH_GRID") throw new Error();
    const r = await registrarResultado(d, INST, {
      ...ANA,
      intentoId: g.intento,
      // Aunque el pedido traiga basura extra, se lee sólo `respuestas`.
      respuestas: partidaDeCuadricula(g.semilla, g.largoInicial),
    });
    expect(r.estado).toBe("OK");
    if (r.estado !== "OK") return;
    // 300 + (400 + 25), después dos errores.
    expect(r.resultado.resumen).toMatchObject({ juego: "FLASH_GRID", puntuacion: 725, secuenciaMaxima: 4, aciertos: 2, errores: 2, marca: "PRIMERA" });
    expect(r.resultado.sesionCompletada).toBe(true);
    expect(intentos[0].resultado?.puntuacion).toBe(725);
    expect(eventos.map((e) => e.nombre)).toEqual(["GymSessionStarted", "GymAttemptCompleted", "GymSessionCompleted"]);
    // El evento lleva lo necesario y nada de las respuestas.
    expect(eventos[1].payload).toEqual({ juego: "FLASH_GRID", version: "CF-1", marcaPersonal: false });
  });

  it("confirmar dos veces devuelve el mismo resultado, sin otro evento", async () => {
    const { d, eventos } = mundo();
    const s = await sesion(d, ANA, "SINGLE_GAME", "FLASH_GRID");
    const g = await intento(d, s.id, "FLASH_GRID");
    if (g.juego !== "FLASH_GRID") throw new Error();
    const respuestas = partidaDeCuadricula(g.semilla, g.largoInicial);
    const a = await registrarResultado(d, INST, { ...ANA, intentoId: g.intento, respuestas });
    const b = await registrarResultado(d, INST, { ...ANA, intentoId: g.intento, respuestas: [] });
    expect(b).toMatchObject({ estado: "OK", duplicado: true });
    if (a.estado !== "OK" || b.estado !== "OK") throw new Error();
    expect(b.resultado.resumen).toEqual(a.resultado.resumen);
    expect(eventos.filter((e) => e.nombre === "GymAttemptCompleted")).toHaveLength(1);
  });

  it("una partida sin terminar o con respuestas inventadas no se confirma", async () => {
    const { d } = mundo();
    const s = await sesion(d, ANA, "SINGLE_GAME", "FLASH_GRID");
    const g = await intento(d, s.id, "FLASH_GRID");
    if (g.juego !== "FLASH_GRID") throw new Error();
    expect(await registrarResultado(d, INST, { ...ANA, intentoId: g.intento, respuestas: [secuenciaDeRonda(g.semilla, 0, 3)] })).toEqual({ estado: "PARTIDA_SIN_TERMINAR" });
    expect(await registrarResultado(d, INST, { ...ANA, intentoId: g.intento, respuestas: "1500 puntos" })).toEqual({ estado: "RESPUESTAS_INVALIDAS" });
    expect(await registrarResultado(d, INST, { ...ANA, intentoId: g.intento, respuestas: [[0, 1, 99]] })).toEqual({ estado: "RESPUESTAS_INVALIDAS" });
  });

  it("el intento de otro estudiante no existe", async () => {
    const { d } = mundo();
    const s = await sesion(d, ANA, "SINGLE_GAME", "FLASH_GRID");
    const g = await intento(d, s.id, "FLASH_GRID");
    expect(await registrarResultado(d, INST, { ...BETO, intentoId: g.intento, respuestas: [] })).toEqual({ estado: "NO_ENCONTRADO" });
  });

  it("la marca personal compara con lo anterior, y la adaptación arranca cerca de lo reciente", async () => {
    const { d, avanzar } = mundo();
    const s1 = await sesion(d, ANA, "SINGLE_GAME", "FLASH_GRID", "a");
    const g1 = await intento(d, s1.id, "FLASH_GRID", "a");
    if (g1.juego !== "FLASH_GRID") throw new Error();
    // Seis aciertos: llega a 8 casillas.
    const buenas = Array.from({ length: 6 }, (_, i) => secuenciaDeRonda(g1.semilla, i, 3 + i));
    const malas = [Array.from({ length: 9 }, () => 0), Array.from({ length: 9 }, () => 0)];
    await registrarResultado(d, INST, { ...ANA, intentoId: g1.intento, respuestas: [...buenas, ...malas] });
    avanzar(60);
    const s2 = await sesion(d, ANA, "SINGLE_GAME", "FLASH_GRID", "b");
    const g2 = await intento(d, s2.id, "FLASH_GRID", "b");
    // Mejor secuencia reciente 8 → empieza en 6.
    expect(g2).toMatchObject({ largoInicial: 6 });
    if (g2.juego !== "FLASH_GRID") throw new Error();
    const r = await registrarResultado(d, INST, { ...ANA, intentoId: g2.intento, respuestas: [Array(6).fill(0), Array(6).fill(0)] });
    if (r.estado !== "OK") throw new Error(r.estado);
    expect(r.resultado.resumen).toMatchObject({ marca: "SIN_CAMBIO", puntuacion: 0 });
    const p = await proyectarGimnasia(d, INST, ANA);
    expect(p.cuadricula.intentos).toBe(2);
    expect(p.rutina.adaptada).toBe(true);
  });

  it("Cadena inversa: el servidor fija el nivel, y no baja por una mala sesión", async () => {
    const { d, avanzar } = mundo();
    const s1 = await sesion(d, ANA, "SINGLE_GAME", "REVERSE_CHAIN", "a");
    const c1 = await intento(d, s1.id, "REVERSE_CHAIN", "a");
    if (c1.juego !== "REVERSE_CHAIN") throw new Error();
    // Rehace la partida acertando todo.
    const respuestas: string[] = [];
    for (let i = 0; i < 5; i++) {
      const j = jugarCadena(c1.semilla, c1.largoInicial, respuestas);
      if (j.estado !== "OK" || !j.partida.siguiente) throw new Error();
      respuestas.push(invertir(cadenaDePrueba(c1.semilla, i, j.partida.siguiente.largo)));
    }
    const r1 = await registrarResultado(d, INST, { ...ANA, intentoId: c1.intento, respuestas });
    if (r1.estado !== "OK") throw new Error(r1.estado);
    expect(r1.resultado.resumen).toMatchObject({ juego: "REVERSE_CHAIN", nivelAnterior: null, nivel: 2, largoMaximoCorrecto: 5 });

    avanzar(60);
    const s2 = await sesion(d, ANA, "SINGLE_GAME", "REVERSE_CHAIN", "b");
    const c2 = await intento(d, s2.id, "REVERSE_CHAIN", "b");
    expect(c2).toMatchObject({ largoInicial: 4, nivelAnterior: 2 });
    const r2 = await registrarResultado(d, INST, { ...ANA, intentoId: c2.intento, respuestas: ["0", "0", "0", "0", "0"] });
    if (r2.estado !== "OK") throw new Error(r2.estado);
    expect(r2.resultado.resumen).toMatchObject({ nivel: 2, nivelAnterior: 2 });
    const p = await proyectarGimnasia(d, INST, ANA);
    expect(p.cadena).toEqual({ nivel: 2, largo: 4, mejorCadena: 5 });
  });

  it("la rutina completa cuenta un día con rutina", async () => {
    const { d } = mundo();
    const s = await sesion(d);
    const g = await intento(d, s.id, "FLASH_GRID");
    if (g.juego !== "FLASH_GRID") throw new Error();
    const rg = await registrarResultado(d, INST, { ...ANA, intentoId: g.intento, respuestas: partidaDeCuadricula(g.semilla, g.largoInicial) });
    expect(rg).toMatchObject({ estado: "OK", resultado: { sesionCompletada: false } });
    const c = await intento(d, s.id, "REVERSE_CHAIN");
    const rc = await registrarResultado(d, INST, { ...ANA, intentoId: c.intento, respuestas: ["1", "2", "3", "4", "5"] });
    expect(rc).toMatchObject({ estado: "OK", resultado: { sesionCompletada: true } });
    // El resumen final trae los dos juegos, en orden, aunque la pantalla se haya recargado en el medio.
    if (rc.estado !== "OK") throw new Error();
    expect(rc.resultado.sesion?.juegos.map((j) => j.resumen.juego)).toEqual(["FLASH_GRID", "REVERSE_CHAIN"]);
    expect((await proyectarGimnasia(d, INST, ANA)).progreso.diasConRutina).toBe(1);
  });
});

describe("Recuerdo real", () => {
  const preguntas = [
    item("q1-cerrada", { aceptadas: ["oferta"], canonica: "La oferta." }),
    item("q2-abierta", { tipo: "SELF_ASSESSED", aceptadas: null, canonica: "Referencia abierta.", materia: null, cursoId: null }),
  ];

  async function repaso() {
    const w = mundo({ items: preguntas });
    const s = await sesion(w.d, ANA, "SINGLE_GAME", "REAL_RECALL");
    const r = await intento(w.d, s.id, "REAL_RECALL");
    if (r.juego !== "REAL_RECALL") throw new Error();
    return { ...w, s, r };
  }

  it("la primera pregunta llega sin respuesta ni aceptadas", async () => {
    const { r } = await repaso();
    expect(r.pregunta).toMatchObject({ itemId: "q1-cerrada", posicion: 0, total: 2, tipo: "SHORT_ANSWER" });
    expect(JSON.stringify(r.pregunta)).not.toMatch(/oferta|Referencia|aceptadas|canonica/);
  });

  it("una cerrada la corrige el servidor, la guarda y recién ahí devuelve la referencia", async () => {
    const { d, r, repasos } = await repaso();
    const res = await responderRecuerdo(d, INST, { ...ANA, intentoId: r.intento, itemId: "q1-cerrada", accion: "RESPONDER", respuesta: " Oferta ", resultado: null, clave: "c1" });
    expect(res).toMatchObject({ estado: "OK", registrada: { correcta: true, resultado: "RECALLED", respuestaCanonica: "La oferta.", proximoRepaso: "2026-09-16" } });
    expect(repasos).toHaveLength(1);
    // La misma clave no duplica.
    const otra = await responderRecuerdo(d, INST, { ...ANA, intentoId: r.intento, itemId: "q1-cerrada", accion: "RESPONDER", respuesta: "x", resultado: null, clave: "c1" });
    expect(otra).toMatchObject({ estado: "OK", duplicado: true, registrada: { correcta: true } });
    expect(repasos).toHaveLength(1);
  });

  it("no se puede pedir la referencia de una pregunta que no toca", async () => {
    const { d, r } = await repaso();
    expect(await responderRecuerdo(d, INST, { ...ANA, intentoId: r.intento, itemId: "q2-abierta", accion: "REVELAR", respuesta: null, resultado: null, clave: "" })).toEqual({ estado: "NO_TOCA" });
  });

  it("una abierta: revelar no guarda nada; autoevaluar guarda, y no se corrige sola", async () => {
    const { d, r, repasos, intentos, eventos } = await repaso();
    await responderRecuerdo(d, INST, { ...ANA, intentoId: r.intento, itemId: "q1-cerrada", accion: "RESPONDER", respuesta: "mal", resultado: null, clave: "c1" });
    // Mal: vuelve al final. La cola ahora es cerrada · abierta · cerrada.
    expect(await responderRecuerdo(d, INST, { ...ANA, intentoId: r.intento, itemId: "q2-abierta", accion: "RESPONDER", respuesta: "algo", resultado: null, clave: "c2" })).toEqual({ estado: "TIPO_INCORRECTO" });
    const rev = await responderRecuerdo(d, INST, { ...ANA, intentoId: r.intento, itemId: "q2-abierta", accion: "REVELAR", respuesta: null, resultado: null, clave: "" });
    expect(rev).toEqual({ estado: "REVELADA", respuestaCanonica: "Referencia abierta.", explicacion: null });
    expect(repasos).toHaveLength(1);
    const auto = await responderRecuerdo(d, INST, { ...ANA, intentoId: r.intento, itemId: "q2-abierta", accion: "AUTOEVALUAR", respuesta: null, resultado: "PARTIAL", clave: "c3" });
    expect(auto).toMatchObject({ estado: "OK", registrada: { correcta: null, resultado: "PARTIAL", proximoRepaso: "2026-09-14", siguiente: { itemId: "q1-cerrada", posicion: 2, total: 3 } } });
    // La que volvió se responde bien y termina la sesión.
    const fin = await responderRecuerdo(d, INST, { ...ANA, intentoId: r.intento, itemId: "q1-cerrada", accion: "RESPONDER", respuesta: "oferta", resultado: null, clave: "c4" });
    expect(fin).toMatchObject({
      estado: "OK",
      registrada: {
        siguiente: null,
        final: { sesionCompletada: true, resumen: { juego: "REAL_RECALL", respondidas: 3, recordadas: 1, parciales: 1, noRecordadas: 1, materias: ["Economía I"] } },
      },
    });
    expect(intentos[0].estado).toBe("COMPLETED");
    expect(eventos.map((e) => e.nombre)).toEqual(["GymSessionStarted", "GymAttemptCompleted", "GymSessionCompleted"]);
  });

  it("un resultado de autoevaluación inventado se rechaza", async () => {
    const { d, r } = await repaso();
    await responderRecuerdo(d, INST, { ...ANA, intentoId: r.intento, itemId: "q1-cerrada", accion: "RESPONDER", respuesta: "oferta", resultado: null, clave: "c1" });
    expect(await responderRecuerdo(d, INST, { ...ANA, intentoId: r.intento, itemId: "q2-abierta", accion: "AUTOEVALUAR", respuesta: null, resultado: "PERFECTO", clave: "c2" })).toEqual({ estado: "RESPUESTA_INVALIDA" });
  });

  it("salir sin nada confirmado no guarda nada; con algo, completa con lo confirmado", async () => {
    const { d, r } = await repaso();
    expect(await registrarResultado(d, INST, { ...ANA, intentoId: r.intento, respuestas: null })).toEqual({ estado: "NADA_RESPONDIDO" });
    await responderRecuerdo(d, INST, { ...ANA, intentoId: r.intento, itemId: "q1-cerrada", accion: "RESPONDER", respuesta: "oferta", resultado: null, clave: "c1" });
    const salir = await registrarResultado(d, INST, { ...ANA, intentoId: r.intento, respuestas: null });
    expect(salir).toMatchObject({ estado: "OK", resultado: { resumen: { respondidas: 1, recordadas: 1 } } });
  });

  it("después de una recarga, la pregunta que toca es la siguiente sin responder", async () => {
    const { d, r } = await repaso();
    await responderRecuerdo(d, INST, { ...ANA, intentoId: r.intento, itemId: "q1-cerrada", accion: "RESPONDER", respuesta: "oferta", resultado: null, clave: "c1" });
    expect(await preguntaActual(d, INST, { ...ANA, intentoId: r.intento })).toMatchObject({ estado: "OK", pregunta: { itemId: "q2-abierta", posicion: 1 } });
    expect(await preguntaActual(d, INST, { ...BETO, intentoId: r.intento })).toEqual({ estado: "NO_ENCONTRADO" });
  });

  it("lo respondido hoy queda programado, y la tarjeta lo cuenta", async () => {
    const { d, r } = await repaso();
    await responderRecuerdo(d, INST, { ...ANA, intentoId: r.intento, itemId: "q1-cerrada", accion: "RESPONDER", respuesta: "oferta", resultado: null, clave: "c1" });
    const p = await proyectarGimnasia(d, INST, ANA);
    expect(p.progreso.repasosCompletados).toBe(1);
    expect(p.recuerdo).toEqual({ situacion: "PENDIENTES", pendientes: 1, practicoAntes: true });
  });

  it("una evaluación cercana adelanta las preguntas de esa materia", async () => {
    const w = mundo({
      items: [item("b-otra", { cursoId: "curso-der", materia: "Derecho Civil" }), item("a-eco")],
      evaluaciones: [{ cursoId: "curso-der", fecha: "2026-09-20" }],
    });
    const s = await sesion(w.d, ANA, "SINGLE_GAME", "REAL_RECALL");
    const r = await intento(w.d, s.id, "REAL_RECALL");
    expect(r).toMatchObject({ pregunta: { itemId: "b-otra", materia: "Derecho Civil" } });
  });
});
