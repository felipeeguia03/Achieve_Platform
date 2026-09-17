/**
 * Modo Focus — el Service · [ADR-104](../docs/decisions.md#adr-104).
 *
 * El repositorio en memoria imita **las garantías de la base**: una sola sesión
 * abierta por estudiante y la versión de cada comando. Contra Postgres, lo mismo
 * lo prueba `scripts/db-aislamiento.sh`.
 */
import { describe, expect, it } from "vitest";

import { CONFIGURACION_DE_PRESET } from "@/lib/domain/sesion-de-focus";
import type { ActionStatus, CommitmentState } from "@/lib/domain/types";
import type { EventoDeProducto } from "@/lib/server/servicios/eventos";
import {
  cerrar,
  comando,
  empezar,
  guardarAnotador,
  guardarPreferencias,
  PREFERENCIAS_INICIALES,
  terminarSinSesion,
  validarPreferencias,
  type CompromisoParaFocus,
  type Dependencias,
  type Preferencias,
  type RepositorioDeFocus,
  type SesionFila,
} from "@/lib/server/servicios/focus";

const INST = "inst-a";
const ANA = "est-ana";
const BETO = "est-beto";

function mundo(opciones: { carreraDeVersion?: number } = {}) {
  let reloj = Date.parse("2026-09-13T21:00:00.000Z");
  let n = 0;
  const eventos: EventoDeProducto[] = [];
  const transiciones: string[] = [];
  const sesiones: SesionFila[] = [];
  const preferencias = new Map<string, Preferencias>();
  const compromisos: Record<string, CompromisoParaFocus> = {
    "com-analisis": { id: "com-analisis", studentId: ANA, cursadaId: "cur-analisis", accionId: "acc-analisis", estado: "DUE", estadoDeAccion: "COMMITTED", inicio: "2026-09-13T21:00:00.000Z", minutos: 40 },
    "com-fisica": { id: "com-fisica", studentId: ANA, cursadaId: "cur-fisica", accionId: "acc-fisica", estado: "CONFIRMED", estadoDeAccion: "COMMITTED", inicio: "2026-09-14T21:00:00.000Z", minutos: 30 },
    "com-incumplido": { id: "com-incumplido", studentId: ANA, cursadaId: "cur-quimica", accionId: "acc-quimica", estado: "MISSED", estadoDeAccion: "COMMITTED", inicio: "2026-09-10T21:00:00.000Z", minutos: 30 },
    "com-beto": { id: "com-beto", studentId: BETO, cursadaId: "cur-beto", accionId: "acc-beto", estado: "DUE", estadoDeAccion: "COMMITTED", inicio: "2026-09-13T21:00:00.000Z", minutos: 30 },
  };
  let carreras = opciones.carreraDeVersion ?? 0;

  const ahora = () => new Date(reloj).toISOString();

  const repo: RepositorioDeFocus = {
    async compromisoDelEstudiante(_i, studentId, id) {
      const c = compromisos[id];
      return c && c.studentId === studentId ? { ...c } : null;
    },
    async compromisoVigente(_i, studentId) {
      return Object.values(compromisos).find((c) => c.studentId === studentId && c.estado !== "MISSED") ?? null;
    },
    async abierta(_i, studentId) {
      const s = sesiones.find((x) => x.studentId === studentId && x.sesion.estado === "OPEN");
      return s ? structuredClone(s) : null;
    },
    async delEstudiante(_i, studentId, id) {
      const s = sesiones.find((x) => x.id === id && x.studentId === studentId);
      return s ? structuredClone(s) : null;
    },
    async crear(_i, c, instante) {
      if (sesiones.some((x) => x.studentId === c.studentId && x.sesion.estado === "OPEN")) return null;
      const id = `ses-${++n}`;
      sesiones.push({
        id,
        studentId: c.studentId,
        cursadaId: c.cursadaId,
        accionId: c.accionId,
        compromisoId: c.id,
        horarioAcordado: c.inicio,
        minutosAcordados: c.minutos,
        version: 1,
        cierre: null,
        avance: null,
        anotador: null,
        anotadorGuardadoEn: null,
        sesion: {
          estado: "OPEN",
          modo: "FREE",
          pomodoro: null,
          iniciadaEn: instante,
          ultimoLatido: instante,
          terminadaEn: null,
          tramos: [{ id: `tra-${++n}`, tipo: "FOCUS", modo: "FREE", bloque: null, descanso: null, inicio: instante, finPlaneado: null, fin: null, motivo: null }],
        },
      });
      return id;
    },
    async aplicar(_i, id, version, e) {
      const s = sesiones.find((x) => x.id === id);
      if (!s) return null;
      if (carreras > 0) {
        // Otro pedido ganó la versión entre la lectura y la escritura.
        carreras--;
        s.version++;
        return null;
      }
      if (s.version !== version || s.sesion.estado !== "OPEN") return null;
      const v = e.sesion;
      const tramos = s.sesion.tramos.map((t) => {
        const c = e.cerrar.find((x) => x.id === t.id);
        return c && t.fin === null ? { ...t, fin: c.ended_at, motivo: c.end_reason as typeof t.motivo } : t;
      });
      for (const a of e.abrir) {
        tramos.push({
          id: `tra-${++n}`,
          tipo: a.kind as "FOCUS",
          modo: (a.mode as "FREE" | null) ?? null,
          bloque: (a.block_number as number | null) ?? null,
          descanso: (a.break_kind as "SHORT" | null) ?? null,
          inicio: a.started_at as string,
          finPlaneado: (a.planned_end_at as string | null) ?? null,
          fin: (a.ended_at as string | null) ?? null,
          motivo: null,
        });
      }
      if (tramos.filter((t) => t.fin === null).length > 1) throw new Error("dos tramos abiertos");
      s.sesion = {
        estado: v.status as "OPEN",
        modo: v.mode as "FREE",
        pomodoro:
          v.mode === "POMODORO"
            ? { foco: v.pomodoro_focus_minutes as number, descansoCorto: v.pomodoro_short_break_minutes as number, descansoLargo: v.pomodoro_long_break_minutes as number, bloquesAntesDelLargo: v.pomodoro_blocks_before_long as number }
            : null,
        iniciadaEn: s.sesion.iniciadaEn,
        ultimoLatido: v.last_heartbeat_at as string,
        terminadaEn: (v.ended_at as string | null) ?? null,
        tramos,
      };
      s.cierre = (v.end_kind as "SAVED" | null) ?? null;
      if ("advance_text" in v) s.avance = (v.advance_text as string | null) ?? null;
      (s as SesionFila & { numeros?: unknown }).numeros = { foco: v.focus_seconds, pausas: v.pauses, completos: v.complete_blocks };
      s.version++;
      return s.version;
    },
    async guardarAnotador(_i, id, texto, instante) {
      const s = sesiones.find((x) => x.id === id)!;
      s.anotador = texto;
      s.anotadorGuardadoEn = instante;
    },
    async preferencias(_i, studentId) {
      return preferencias.get(studentId) ?? null;
    },
    async guardarPreferencias(_i, studentId, p) {
      preferencias.set(studentId, p);
    },
  };

  const d: Dependencias = {
    repo,
    eventos: { publicar: async (e) => void eventos.push(e) },
    ahora,
    async iniciarCompromiso(_i, id, actor) {
      transiciones.push(`commitment:${id}:STARTED:${actor}`);
      compromisos[id]!.estado = "STARTED" as CommitmentState;
    },
    async llevarAccion(_i, id, hacia, actor) {
      transiciones.push(`action:${id}:${hacia}:${actor}`);
      for (const c of Object.values(compromisos)) if (c.accionId === id) c.estadoDeAccion = hacia as ActionStatus;
    },
  };

  return {
    d,
    eventos,
    transiciones,
    sesiones,
    compromisos,
    preferencias,
    avanzar: (minutos: number) => {
      reloj += minutos * 60_000;
    },
  };
}

describe("ADR-104 §3 · empezar coordina el compromiso y la acción por sus máquinas", () => {
  it("DUE + COMMITTED: compromiso a STARTED, acción a IN_PROGRESS, después la sesión y su evento", async () => {
    const m = mundo();
    const r = await empezar(m.d, INST, { studentId: ANA, compromisoId: "com-analisis", cursadaId: null });
    expect(r.estado).toBe("OK");
    expect(m.transiciones).toEqual(["commitment:com-analisis:STARTED:est-ana", "action:acc-analisis:IN_PROGRESS:est-ana"]);
    expect(m.eventos).toEqual([expect.objectContaining({ nombre: "FocusSessionStarted", sujetoTipo: "focus_session", causa: "desde:DUE", actorId: ANA })]);
    if (r.estado === "OK") expect(r.sesion.sesion.tramos).toHaveLength(1);
  });

  it("se puede empezar antes de la hora (CONFIRMED)", async () => {
    const m = mundo();
    const r = await empezar(m.d, INST, { studentId: ANA, compromisoId: "com-fisica", cursadaId: null });
    expect(r.estado).toBe("OK");
  });

  it("una sesión nueva sobre un compromiso ya STARTED no reemite transiciones", async () => {
    const m = mundo();
    const primera = await empezar(m.d, INST, { studentId: ANA, compromisoId: "com-analisis", cursadaId: null });
    if (primera.estado !== "OK") throw new Error();
    await cerrar(m.d, INST, { studentId: ANA, sesionId: primera.sesion.id, como: "SAVED", avance: null });
    m.transiciones.length = 0;
    const segunda = await empezar(m.d, INST, { studentId: ANA, compromisoId: "com-analisis", cursadaId: null });
    expect(segunda).toMatchObject({ estado: "OK", duplicado: false });
    expect(m.transiciones).toEqual([]);
  });

  it("un compromiso incumplido no se empieza", async () => {
    const m = mundo();
    expect(await empezar(m.d, INST, { studentId: ANA, compromisoId: "com-incumplido", cursadaId: null })).toEqual({
      estado: "NO_INICIABLE",
      compromiso: "MISSED",
      accion: "COMMITTED",
    });
    expect(m.transiciones).toEqual([]);
  });

  it("el compromiso ajeno no existe", async () => {
    const m = mundo();
    expect((await empezar(m.d, INST, { studentId: ANA, compromisoId: "com-beto", cursadaId: null })).estado).toBe("SIN_COMPROMISO");
  });
});

describe("ADR-104 §11 · una sola sesión abierta", () => {
  it("repetir el pedido devuelve la misma; otro compromiso contesta con la abierta", async () => {
    const m = mundo();
    const a = await empezar(m.d, INST, { studentId: ANA, compromisoId: "com-analisis", cursadaId: null });
    const b = await empezar(m.d, INST, { studentId: ANA, compromisoId: "com-analisis", cursadaId: null });
    const sinCompromiso = await empezar(m.d, INST, { studentId: ANA, compromisoId: null, cursadaId: null });
    const otra = await empezar(m.d, INST, { studentId: ANA, compromisoId: "com-fisica", cursadaId: null });
    expect(a).toMatchObject({ estado: "OK", duplicado: false });
    expect(b).toMatchObject({ estado: "OK", duplicado: true });
    expect(sinCompromiso).toMatchObject({ estado: "OK", duplicado: true });
    expect(otra.estado).toBe("YA_HAY_OTRA_ABIERTA");
    expect(m.sesiones).toHaveLength(1);
    expect(m.eventos.filter((e) => e.nombre === "FocusSessionStarted")).toHaveLength(1);
  });
});

describe("ADR-104 §9 · comandos", () => {
  async function empezada() {
    const m = mundo();
    const r = await empezar(m.d, INST, { studentId: ANA, compromisoId: "com-analisis", cursadaId: null });
    if (r.estado !== "OK") throw new Error();
    return { m, id: r.sesion.id };
  }

  it("pausar cierra el foco y abre una pausa con el instante del servidor", async () => {
    const { m, id } = await empezada();
    m.avanzar(1);
    const r = await comando(m.d, INST, { studentId: ANA, sesionId: id, comando: { tipo: "PAUSAR" } });
    expect(r.estado).toBe("OK");
    const tramos = m.sesiones[0]!.sesion.tramos;
    expect(tramos.map((t) => [t.tipo, t.motivo])).toEqual([["FOCUS", "PAUSED"], ["PAUSE", null]]);
    expect(tramos[1]!.inicio).toBe("2026-09-13T21:01:00.000Z");
  });

  it("un clic viejo contesta la fase y no escribe", async () => {
    const { m, id } = await empezada();
    const r = await comando(m.d, INST, { studentId: ANA, sesionId: id, comando: { tipo: "VOLVER_ANTES" } });
    expect(r).toMatchObject({ estado: "FASE_INVALIDA", fase: "CONCENTRACION" });
    expect(m.sesiones[0]!.version).toBe(1);
  });

  it("si otro pedido gana la versión, relee y reintenta una vez", async () => {
    const m = mundo({ carreraDeVersion: 1 });
    const e = await empezar(m.d, INST, { studentId: ANA, compromisoId: "com-analisis", cursadaId: null });
    if (e.estado !== "OK") throw new Error();
    const r = await comando(m.d, INST, { studentId: ANA, sesionId: e.sesion.id, comando: { tipo: "PAUSAR" } });
    expect(r.estado).toBe("OK");
  });

  it("una configuración Pomodoro fuera de límite no se aplica", async () => {
    const { m, id } = await empezada();
    const r = await comando(m.d, INST, { studentId: ANA, sesionId: id, comando: { tipo: "POMODORO", configuracion: { foco: 500 } } });
    expect(r.estado).toBe("CONFIGURACION_INVALIDA");
  });

  it("pasar a Pomodoro recuerda el preset como preferencia", async () => {
    const { m, id } = await empezada();
    await comando(m.d, INST, { studentId: ANA, sesionId: id, comando: { tipo: "POMODORO", configuracion: CONFIGURACION_DE_PRESET.INTERMEDIO } });
    expect(m.preferencias.get(ANA)).toMatchObject({ ultimoModo: "POMODORO", preset: "INTERMEDIO" });
  });

  it("la sesión ajena no existe", async () => {
    const { m, id } = await empezada();
    expect((await comando(m.d, INST, { studentId: BETO, sesionId: id, comando: { tipo: "PAUSAR" } })).estado).toBe("NO_ENCONTRADA");
  });
});

describe("ADR-104 §14 y §15 · cerrar", () => {
  it("salir y guardar congela los números, guarda el avance y publica una sola vez", async () => {
    const m = mundo();
    const e = await empezar(m.d, INST, { studentId: ANA, compromisoId: "com-analisis", cursadaId: null });
    if (e.estado !== "OK") throw new Error();
    m.avanzar(1);
    const r = await cerrar(m.d, INST, { studentId: ANA, sesionId: e.sesion.id, como: "SAVED", avance: "  Resolví el 4 y el 5  " });
    const otra = await cerrar(m.d, INST, { studentId: ANA, sesionId: e.sesion.id, como: "SAVED", avance: null });
    expect(r.estado).toBe("OK");
    expect(otra.estado).toBe("OK");
    const fila = m.sesiones[0]! as SesionFila & { numeros: { foco: number } };
    expect(fila).toMatchObject({ cierre: "SAVED", avance: "Resolví el 4 y el 5" });
    expect(fila.numeros.foco).toBe(60);
    expect(m.eventos.filter((x) => x.nombre === "FocusSessionEnded")).toHaveLength(1);
    // Salir no es terminar: la acción sigue en curso.
    expect(m.transiciones.some((t) => t.includes("EVIDENCE_PENDING"))).toBe(false);
  });

  it("*terminé* lleva la acción a EVIDENCE_PENDING y NO cierra el compromiso", async () => {
    const m = mundo();
    const e = await empezar(m.d, INST, { studentId: ANA, compromisoId: "com-analisis", cursadaId: null });
    if (e.estado !== "OK") throw new Error();
    await cerrar(m.d, INST, { studentId: ANA, sesionId: e.sesion.id, como: "DONE", avance: null });
    expect(m.transiciones).toContain("action:acc-analisis:EVIDENCE_PENDING:est-ana");
    expect(m.transiciones.some((t) => t.includes("COMPLETED"))).toBe(false);
    expect(m.compromisos["com-analisis"]!.estado).toBe("STARTED");
  });

  it("el avance tiene un límite técnico", async () => {
    const m = mundo();
    const e = await empezar(m.d, INST, { studentId: ANA, compromisoId: "com-analisis", cursadaId: null });
    if (e.estado !== "OK") throw new Error();
    expect((await cerrar(m.d, INST, { studentId: ANA, sesionId: e.sesion.id, como: "SAVED", avance: "x".repeat(2001) })).estado).toBe("DEMASIADO_LARGO");
  });

  it("*terminé cuando se cerró* cierra en el último latido", async () => {
    const m = mundo();
    const e = await empezar(m.d, INST, { studentId: ANA, compromisoId: "com-analisis", cursadaId: null });
    if (e.estado !== "OK") throw new Error();
    m.avanzar(60);
    expect((await comando(m.d, INST, { studentId: ANA, sesionId: e.sesion.id, comando: { tipo: "LATIDO" } })).estado).toBe("FASE_INVALIDA");
    const r = await cerrar(m.d, INST, { studentId: ANA, sesionId: e.sesion.id, como: "RECUPERADA", avance: null });
    expect(r.estado).toBe("OK");
    expect(m.sesiones[0]!.sesion.terminadaEn).toBe("2026-09-13T21:00:00.000Z");
  });
});

describe("ADR-104 §15 · terminé sin sesión", () => {
  it("recorre la máquina entera: STARTED, IN_PROGRESS y EVIDENCE_PENDING", async () => {
    const m = mundo();
    const r = await terminarSinSesion(m.d, INST, { studentId: ANA, compromisoId: "com-fisica", cursadaId: null });
    expect(r).toEqual({ estado: "OK", accionId: "acc-fisica" });
    expect(m.transiciones).toEqual([
      "commitment:com-fisica:STARTED:est-ana",
      "action:acc-fisica:IN_PROGRESS:est-ana",
      "action:acc-fisica:EVIDENCE_PENDING:est-ana",
    ]);
  });

  it("con una sesión abierta, primero hay que cerrarla", async () => {
    const m = mundo();
    await empezar(m.d, INST, { studentId: ANA, compromisoId: "com-analisis", cursadaId: null });
    expect((await terminarSinSesion(m.d, INST, { studentId: ANA, compromisoId: "com-fisica", cursadaId: null })).estado).toBe("HAY_UNA_SESION_ABIERTA");
  });
});

describe("ADR-104 §12 · el anotador es privado", () => {
  it("se guarda sin publicar ningún evento, y la sesión ajena no existe", async () => {
    const m = mundo();
    const e = await empezar(m.d, INST, { studentId: ANA, compromisoId: "com-analisis", cursadaId: null });
    if (e.estado !== "OK") throw new Error();
    const antes = m.eventos.length;
    expect((await guardarAnotador(m.d, INST, { studentId: ANA, sesionId: e.sesion.id, texto: "comprar pan" })).estado).toBe("OK");
    expect(m.eventos).toHaveLength(antes);
    expect(JSON.stringify(m.eventos)).not.toContain("comprar pan");
    expect((await guardarAnotador(m.d, INST, { studentId: BETO, sesionId: e.sesion.id, texto: "x" })).estado).toBe("NO_ENCONTRADA");
    expect((await guardarAnotador(m.d, INST, { studentId: ANA, sesionId: e.sesion.id, texto: "x".repeat(20_001) })).estado).toBe("DEMASIADO_LARGO");
  });
});

describe("ADR-104 §18 y §19 · preferencias", () => {
  it("el sonido arranca apagado y se valida todo antes de guardar", async () => {
    expect(PREFERENCIAS_INICIALES.sonido).toBe("NINGUNO");
    expect(validarPreferencias({ ultimoModo: "FREE", preset: null, personalizado: null, sonido: "MARRON", volumen: 60 })).not.toBeNull();
    expect(validarPreferencias({ ultimoModo: "FREE", preset: null, personalizado: null, sonido: "CAFETERIA", volumen: 60 })).toBeNull();
    expect(validarPreferencias({ ultimoModo: "FREE", preset: null, personalizado: null, sonido: "ROSA", volumen: 101 })).toBeNull();
    const m = mundo();
    expect((await guardarPreferencias(m.d, INST, { studentId: ANA, preferencias: { sonido: "ROSA" } })).estado).toBe("INVALIDAS");
  });
});
