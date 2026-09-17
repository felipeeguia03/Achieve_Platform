import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

import { correrReloj, type RepositorioDeReloj } from "@/lib/server/servicios/reloj";
import type { Compromiso, RepositorioDeCompromisos } from "@/lib/server/servicios/compromiso";
import type { EventoDeProducto, PublicadorDeEventos } from "@/lib/server/servicios/eventos";
import type { CompromisoConReloj } from "@/lib/domain/reloj-compromisos";
import type { CommitmentState } from "@/lib/domain/types";

/** El owner del lifecycle, ejecutando. */
const AHORA = "2026-08-30T20:00:00.000Z";

function mundo(iniciales: Array<CompromisoConReloj>, opciones: { pierde?: boolean } = {}) {
  const filas = new Map<string, { state: CommitmentState }>(
    iniciales.map((c) => [c.id, { state: c.state }]),
  );
  const publicados: EventoDeProducto[] = [];

  const reloj: RepositorioDeReloj = {
    async candidatosPorTiempo() {
      return iniciales.map((c) => ({ ...c, state: filas.get(c.id)!.state }));
    },
    // Modo Examen tiene su propio bloque más abajo: acá no recomienda nada,
    // para no mezclar dos disparadores en el mismo caso.
    async candidatosDeModoExamen() { return []; },
    async recomendarModoExamen() { return null; },
    async zonaInstitucional() { return "America/Argentina/Cordoba"; },
    // Las señales tienen su propio test (`tests/servicio-riesgo.test.ts`): acá
    // el doble devuelve vacío para no mezclar dos lifecycles en un mismo caso.
    async senalesVencidas() {
      return [];
    },
  };
  const compromisos = {
    async porId(_inst: string, id: string): Promise<Compromiso | null> {
      const f = filas.get(id);
      return f
        ? {
            id, institutionId: "inst-A", actionId: "a-1", state: f.state,
            rescuesCommitmentId: null, renegotiatedFromId: null, scheduledFor: null,
          }
        : null;
    },
    async cambiarEstadoSi(_i: string, id: string, esperado: CommitmentState, nuevo: CommitmentState) {
      if (opciones.pierde) return null;
      const f = filas.get(id);
      if (!f || f.state !== esperado) return null;
      f.state = nuevo;
      return { id, institutionId: "inst-A", actionId: "a-1", state: nuevo };
    },
    async renegociarAtomico() { return null; },
    async crearRescateAtomico() { return null; },
  } as RepositorioDeCompromisos;
  const eventos: PublicadorDeEventos = { async publicar(e) { publicados.push(e); } };

  const senales = {
    async porId() { return null; },
    async cambiarEstadoSi() { return null; },
    async registrar() { return { id: "s-0", duplicado: false }; },
    async resolver() { return { resuelta: false, motivo: null }; },
  };
  const auditor = { async registrar() {} };

  return { deps: { reloj, compromisos, eventos, senales, auditor }, filas, publicados };
}

const confirmado: CompromisoConReloj = {
  id: "c-1",
  state: "CONFIRMED",
  startAt: "2026-08-30T19:00:00.000Z",
  plannedMinutes: 40,
};

describe("B4 · el reloj mueve lo que el tiempo mueve", () => {
  it("vence un CONFIRMED cuya hora llegó", async () => {
    const { deps, filas } = mundo([confirmado]);
    const r = await correrReloj(deps, "inst-A", AHORA);
    expect(r).toMatchObject({ vencidos: 1, incumplidos: 0 });
    expect(filas.get("c-1")!.state).toBe("DUE");
  });

  it("incumple un DUE cuyo bloque pasó", async () => {
    const { deps, filas } = mundo([{ ...confirmado, state: "DUE" }]);
    const r = await correrReloj(deps, "inst-A", AHORA);
    expect(r).toMatchObject({ incumplidos: 1 });
    expect(filas.get("c-1")!.state).toBe("MISSED");
  });
});

describe("B4 · pasa por la misma máquina que todo lo demás", () => {
  /**
   * Un camino paralelo que escribiera directo se saltearía la máquina de
   * estados, y sería el agujero por donde un `MISSED` podría volver. El reloj
   * usa `transicionar()`, así que hereda el compare-and-swap **y el evento**.
   */
  it("cada transición deja su hecho en product_event", async () => {
    const { deps, publicados } = mundo([confirmado]);
    await correrReloj(deps, "inst-A", AHORA);
    expect(publicados).toHaveLength(1);
    expect(publicados[0]).toMatchObject({ nombre: "CommitmentDue", causa: "CONFIRMED->DUE" });
  });

  /**
   * El actor es el sistema. Poner el id del estudiante diría en la auditoría
   * que lo hizo él, y nadie apretó nada.
   */
  it("el actor del evento es el sistema, no una persona", async () => {
    const { deps, publicados } = mundo([confirmado]);
    await correrReloj(deps, "inst-A", AHORA);
    expect(publicados[0].actorId).toBeNull();
  });
});

describe("B4 · el estudiante le gana al reloj", () => {
  /**
   * Si el estudiante mueve el compromiso mientras el reloj corre, **su acción
   * gana**: el compare-and-swap no encuentra el estado esperado y la próxima
   * corrida ve el estado nuevo. No es un error.
   */
  it("un conflicto se cuenta aparte y no rompe la corrida", async () => {
    const { deps, publicados } = mundo([confirmado], { pierde: true });
    const r = await correrReloj(deps, "inst-A", AHORA);
    expect(r).toMatchObject({ vencidos: 0, conflictos: 1 });
    expect(publicados).toEqual([]);
  });

  it("una corrida con varios sigue después de un conflicto", async () => {
    const { deps } = mundo([confirmado, { ...confirmado, id: "c-2", state: "DUE" }]);
    const r = await correrReloj(deps, "inst-A", AHORA);
    expect(r.vencidos + r.incumplidos).toBe(2);
  });
});

describe("B4 · el reloj converge y no se repite", () => {
  /**
   * Correr el reloj muchas veces con el mismo instante tiene que **detenerse**.
   * Acá el bloque de las 19:00 + 40 min ya pasó a las 20:00, así que la primera
   * corrida vence y la segunda incumple —una transición por corrida, para no
   * saltear `DUE`— y de ahí en adelante no pasa nada más.
   *
   * Lo escribí al revés la primera vez y el test tenía razón: a las 20:00 ese
   * bloque efectivamente ya venció.
   */
  it("dos corridas lo llevan hasta MISSED, y la tercera no mueve nada", async () => {
    const { deps, filas, publicados } = mundo([confirmado]);

    expect(await correrReloj(deps, "inst-A", AHORA)).toMatchObject({ vencidos: 1 });
    expect(filas.get("c-1")!.state).toBe("DUE");

    expect(await correrReloj(deps, "inst-A", AHORA)).toMatchObject({ incumplidos: 1 });
    expect(filas.get("c-1")!.state).toBe("MISSED");

    // Converge: un MISSED no lo toca nadie, y menos el reloj.
    expect(await correrReloj(deps, "inst-A", AHORA)).toEqual({ examenesRecomendados: 0, vencidos: 0, incumplidos: 0, senalesExpiradas: 0, conflictos: 0 });
    expect(publicados).toHaveLength(2);
  });

  it("dentro del bloque, correrlo mil veces no lo incumple", async () => {
    const { deps, filas } = mundo([{ ...confirmado, state: "DUE" }]);
    for (let i = 0; i < 20; i++) {
      await correrReloj(deps, "inst-A", "2026-08-30T19:30:00.000Z");
    }
    expect(filas.get("c-1")!.state).toBe("DUE");
  });
});


describe("B6 · el reloj también expira las señales que dejaron de importar", () => {
  /**
   * `product.md` §5.5: *"una señal puede expirar si deja de ser relevante; se
   * guarda la causa histórica"*. **El reloj no decide cuándo deja de ser
   * relevante** — eso lo declaró quien la creó, en `valid_until`—; sólo ejecuta
   * ese vencimiento, por la misma vía que un `CONFIRMED` que pasa a `DUE`.
   */
  function conSenales(estados: Array<{ id: string; status: "OPEN" }>) {
    const filas = new Map(estados.map((s) => [s.id, s.status as string]));
    const publicados: EventoDeProducto[] = [];
    const reloj: RepositorioDeReloj = {
      async candidatosPorTiempo() { return []; },
      async senalesVencidas() { return estados; },
      async candidatosDeModoExamen() { return []; },
      async recomendarModoExamen() { return null; },
      async zonaInstitucional() { return "America/Argentina/Cordoba"; },
    };
    const senales = {
      async porId(_i: string, id: string) {
        const st = filas.get(id);
        return st
          ? { id, institutionId: "inst-A", state: st as never, studentId: "e-1", severity: "bajo" as const, reason: "x", reviewContext: {} }
          : null;
      },
      async cambiarEstadoSi(_i: string, id: string, esperado: string, nuevo: string) {
        if (filas.get(id) !== esperado) return null;
        filas.set(id, nuevo);
        return { id, institutionId: "inst-A", state: nuevo as never, studentId: "e-1", severity: "bajo" as const, reason: "x", reviewContext: {} };
      },
      async registrar() { return { id: "x", duplicado: false }; },
      async resolver() { return { resuelta: false, motivo: null }; },
    };
    const compromisos = {
      async porId() { return null; },
      async cambiarEstadoSi() { return null; },
      async renegociarAtomico() { return null; },
      async crearRescateAtomico() { return null; },
    } as unknown as RepositorioDeCompromisos;
    const eventos: PublicadorDeEventos = { async publicar(e) { publicados.push(e); } };
    const auditor = { async registrar() {} };
    return { deps: { reloj, compromisos, eventos, senales, auditor }, filas, publicados };
  }

  it("expira las vencidas y las cuenta aparte de los compromisos", async () => {
    const m = conSenales([
      { id: "s-1", status: "OPEN" },
      { id: "s-2", status: "OPEN" },
    ]);
    const r = await correrReloj(m.deps, "inst-A", AHORA);
    expect(r).toMatchObject({ vencidos: 0, incumplidos: 0, senalesExpiradas: 2 });
    expect(m.filas.get("s-1")).toBe("EXPIRED");
    expect(m.filas.get("s-2")).toBe("EXPIRED");
  });

  it("el reloj sólo levanta `OPEN`: una legacy en `ACKNOWLEDGED` no se vence sola", () => {
    // ADR-034. El filtro vive en el `WHERE` del Repository, y por eso el test
    // mira **la fuente**: un doble que devolviera lo correcto no probaría que
    // la consulta real pide lo correcto.
    const fuente = readFileSync(resolve(process.cwd(), "lib/server/repositorios/reloj.ts"), "utf8");
    const consulta = fuente.slice(fuente.indexOf("senalesVencidas"));
    expect(consulta).toContain('.eq("status", "OPEN")');
    expect(consulta, "ACKNOWLEDGED volvió al WHERE del reloj").not.toContain("ACKNOWLEDGED");
  });

  it("el actor del evento es el sistema: nadie decidió que dejara de importar", async () => {
    const m = conSenales([{ id: "s-1", status: "OPEN" }]);
    await correrReloj(m.deps, "inst-A", AHORA);
    expect(m.publicados.map((e) => e.nombre)).toEqual(["RiskSignalExpired"]);
    expect(m.publicados[0].actorId).toBeNull();
  });

  it("pasa por la máquina: una que ya pide una persona no se expira aunque venga en la lista", async () => {
    // El Repository ya la filtra, y aun así el camino pasa por `transicionar`:
    // dos defensas, porque expirarla borraría una obligación humana pendiente.
    const m = conSenales([{ id: "s-1", status: "INTERVENTION_REQUIRED" as never }]);
    const r = await correrReloj(m.deps, "inst-A", AHORA);
    expect(r.senalesExpiradas).toBe(0);
    expect(m.filas.get("s-1")).toBe("INTERVENTION_REQUIRED");
    expect(m.publicados).toEqual([]);
  });
});

/**
 * El disparador de Modo Examen — [ADR-048](../docs/decisions.md#adr-048).
 *
 * Vive en el reloj porque es exactamente lo que el reloj hace: aplicar una
 * regla que depende del paso del tiempo y que nadie apretó.
 */
describe("B6.12 · ADR-048 · el reloj recomienda Modo Examen", () => {
  const CANDIDATO = {
    assessmentId: "as-1",
    studentId: "es-1",
    courseEnrollmentId: "ce-1",
    fechaDeExamen: "2026-09-18",
  };

  function mundoDeExamen(opciones: {
    candidatos?: Array<typeof CANDIDATO>;
    yaExistia?: boolean;
    zona?: string | null;
  } = {}) {
    const publicados: EventoDeProducto[] = [];
    const creados: string[] = [];
    const reloj: RepositorioDeReloj = {
      async candidatosPorTiempo() { return []; },
      async senalesVencidas() { return []; },
      async candidatosDeModoExamen() { return opciones.candidatos ?? [CANDIDATO]; },
      async recomendarModoExamen(_i, c) {
        if (opciones.yaExistia) return null;
        creados.push(c.assessmentId);
        return { id: `prep-${c.assessmentId}` };
      },
      async zonaInstitucional() {
        return opciones.zona === undefined ? "America/Argentina/Cordoba" : opciones.zona;
      },
    };
    const deps = {
      reloj,
      compromisos: { async porId() { return null; } } as never,
      eventos: { async publicar(e: EventoDeProducto) { publicados.push(e); } },
      senales: {} as never,
      auditor: {} as never,
    };
    return { deps, publicados, creados };
  }

  /** 21:00 de Córdoba del 4 de septiembre: faltan catorce días para el 18. */
  const AHORA_EXAMEN = "2026-09-05T00:00:00.000Z";

  it("dentro de la ventana crea la preparación y publica el hecho", async () => {
    const { deps, publicados, creados } = mundoDeExamen();
    const resumen = await correrReloj(deps, "inst-A", AHORA_EXAMEN);

    expect(resumen.examenesRecomendados).toBe(1);
    expect(creados).toEqual(["as-1"]);
    expect(publicados[0].nombre).toBe("ExamPreparationRecommended");
    expect(publicados[0].sujetoTipo).toBe("exam_preparation");
    // Nadie apretó nada: lo produjo el paso del tiempo.
    expect(publicados[0].actorId).toBeNull();
    // Por qué apareció, en el hecho: sin esto la recomendación no se explica.
    expect(publicados[0].payload).toMatchObject({
      assessmentId: "as-1", fechaDeExamen: "2026-09-18", diasRestantes: 14,
    });
  });

  it("fuera de la ventana no escribe ni publica", async () => {
    const { deps, publicados, creados } = mundoDeExamen({
      candidatos: [{ ...CANDIDATO, fechaDeExamen: "2026-09-19" }],
    });
    const resumen = await correrReloj(deps, "inst-A", AHORA_EXAMEN);

    expect(resumen.examenesRecomendados).toBe(0);
    expect(creados).toEqual([]);
    expect(publicados).toEqual([]);
  });

  /**
   * La condición 3 y la 4 de ADR-048 son el mismo hecho, sostenido por
   * `UNIQUE (student_id, assessment_id)`. Que el evento NO salga es lo que
   * hace que "una sola vez por intento" sea verdad: publicar en cada corrida
   * convertiría el registro de hechos en un latido.
   */
  it("si ya había preparación no publica nada, aunque la ventana esté abierta", async () => {
    const { deps, publicados } = mundoDeExamen({ yaExistia: true });
    const resumen = await correrReloj(deps, "inst-A", AHORA_EXAMEN);

    expect(resumen.examenesRecomendados).toBe(0);
    expect(publicados).toEqual([]);
  });

  /**
   * Sin zona institucional (ADR-049) no hay día contra el cual contar los
   * catorce, y contarlos con otra zona sería aplicar otra regla. **No se
   * sustituye**: no se recomienda.
   */
  it("sin zona institucional no recomienda, y no inventa una", async () => {
    const { deps, publicados, creados } = mundoDeExamen({ zona: null });
    const resumen = await correrReloj(deps, "inst-A", AHORA_EXAMEN);

    expect(resumen.examenesRecomendados).toBe(0);
    expect(creados).toEqual([]);
    expect(publicados).toEqual([]);
  });
});
