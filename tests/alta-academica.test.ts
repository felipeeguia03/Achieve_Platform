import { describe, expect, it } from "vitest";

import {
  aniosDelPlan,
  resolverVersionDePlan,
  sePreselecciona,
  siguientePaso,
  tratoEnElAlta,
  type PlanCandidato,
  type TipoDeRequisito,
} from "@/lib/domain/alta";
import {
  confirmarMapaAcademico,
  declararCarrera,
  decidirWhatsapp,
  estadoDelAlta,
  resolverPlan,
  type RepositorioDelAlta,
  type RepositorioDelCatalogo,
} from "@/lib/server/servicios/alta";
import { selectHeroLevel } from "@/lib/domain/precedence";
import { ofreceCta } from "@/lib/content/hero";
import { altaPendiente } from "@/lib/server/http";

/**
 * Fase B6.14 — el alta académica.
 *
 * [ADR-051](../docs/decisions.md#adr-051) (el catálogo),
 * [ADR-052](../docs/decisions.md#adr-052) (el tramo) y
 * [ADR-053](../docs/decisions.md#adr-053) (el Plan 2016 en `DRAFT`).
 */

const AHORA = "2026-09-05T12:00:00.000Z";

// ── El dominio puro ──────────────────────────────────────────────────────────

describe("B6.14 · qué versión del plan le toca al estudiante", () => {
  const p = (id: string, desde: string | null, hasta: string | null): PlanCandidato => ({
    id,
    version: id,
    validFrom: desde,
    validUntil: hasta,
  });

  it("una sola vigente: no se pregunta, se infiere", () => {
    const r = resolverVersionDePlan([p("2016", "2016-01-01", null)], AHORA);
    expect(r.estado).toBe("UNICA");
  });

  it("dos vigentes: se pregunta, porque elegir sería cambiarle la carrera", () => {
    const r = resolverVersionDePlan(
      [p("2016", "2016-01-01", null), p("2021", "2021-01-01", null)],
      AHORA,
    );
    expect(r.estado).toBe("AMBIGUA");
    if (r.estado === "AMBIGUA") expect(r.planes).toHaveLength(2);
  });

  it("ninguno: SIN_PLAN, y no se inventa una materia", () => {
    expect(resolverVersionDePlan([], AHORA).estado).toBe("SIN_PLAN");
  });

  it("un plan vencido no descarta al estudiante legado: se le ofrece igual", () => {
    // La vigencia del catálogo no es su situación académica. Dejarlo sin nada
    // sería peor que preguntarle.
    const r = resolverVersionDePlan([p("2016", "2016-01-01", "2020-12-31")], AHORA);
    expect(r.estado).toBe("UNICA");
  });

  it("con uno vigente y uno vencido, gana el vigente y no se pregunta", () => {
    const r = resolverVersionDePlan(
      [p("2016", "2016-01-01", "2020-12-31"), p("2021", "2021-01-01", null)],
      AHORA,
    );
    expect(r.estado).toBe("UNICA");
    if (r.estado === "UNICA") expect(r.plan.version).toBe("2021");
  });
});

describe("B6.14 · no toda fila del plan es una materia (ADR-051)", () => {
  const casos: [TipoDeRequisito, string][] = [
    ["COURSE", "MATERIA"],
    ["ELECTIVE_SLOT", "CUPO"],
    ["SEMINAR_SLOT", "CUPO"],
    ["LANGUAGE_REQUIREMENT", "NO_SE_OFRECE"],
    ["PROFESSIONAL_PRACTICE", "NO_SE_OFRECE"],
    ["CAPSTONE", "NO_SE_OFRECE"],
    ["UNKNOWN", "NO_SE_OFRECE"],
  ];

  it.each(casos)("%s se trata como %s", (tipo, trato) => {
    expect(tratoEnElAlta(tipo)).toBe(trato);
  });

  it("una obligatoria del año elegido llega preseleccionada", () => {
    expect(sePreselecciona("COURSE", 2, 2)).toBe(true);
  });

  it("una obligatoria de otro año no se preselecciona", () => {
    expect(sePreselecciona("COURSE", 3, 2)).toBe(false);
  });

  it("una electiva NUNCA se preselecciona, ni siquiera en su año", () => {
    expect(sePreselecciona("ELECTIVE_SLOT", 3, 3)).toBe(false);
  });

  it("Acreditación de Inglés y Trabajo Final no se preseleccionan por ser del año", () => {
    expect(sePreselecciona("LANGUAGE_REQUIREMENT", 5, 5)).toBe(false);
    expect(sePreselecciona("CAPSTONE", 5, 5)).toBe(false);
    expect(sePreselecciona("PROFESSIONAL_PRACTICE", 5, 5)).toBe(false);
  });

  it("un requisito sin año declarado no se preselecciona nunca", () => {
    expect(sePreselecciona("COURSE", null, 1)).toBe(false);
  });
});

describe("B6.14 · los años que el plan declara", () => {
  it("ordena, deduplica y `null` no es un año", () => {
    expect(
      aniosDelPlan([
        { curriculumYear: 3 },
        { curriculumYear: 1 },
        { curriculumYear: null },
        { curriculumYear: 3 },
      ]),
    ).toEqual([1, 3]);
  });
});

describe("B6.14 · el orden del alta es el de ADR-042", () => {
  it("sin consentimiento contestado, va a WhatsApp", () => {
    expect(
      siguientePaso({
        consentimientoRespondido: false,
        carreraDeclarada: false,
        materiasConfirmadas: false, disponibilidadRespondida: false,
      }),
    ).toBe("WHATSAPP");
  });

  it("con el consentimiento contestado, va a carrera", () => {
    expect(
      siguientePaso({
        consentimientoRespondido: true,
        carreraDeclarada: false,
        materiasConfirmadas: false, disponibilidadRespondida: false,
      }),
    ).toBe("CARRERA");
  });

  it("con carrera declarada y sin confirmar, va a materias", () => {
    expect(
      siguientePaso({
        consentimientoRespondido: true,
        carreraDeclarada: true,
        materiasConfirmadas: false, disponibilidadRespondida: false,
      }),
    ).toBe("MATERIAS");
  });

  it("confirmadas las materias, todavía falta la disponibilidad", () => {
    // ADR-073. Va **después** de las materias porque necesita saber cuántas hay
    // para que la pregunta signifique algo: antes, «¿cuántas horas tenés?» no
    // tiene contra qué compararse.
    expect(
      siguientePaso({
        consentimientoRespondido: true,
        carreraDeclarada: true,
        materiasConfirmadas: true,
        disponibilidadRespondida: false,
      }),
    ).toBe("DISPONIBILIDAD");
  });

  it("contestada la disponibilidad, el alta terminó", () => {
    expect(
      siguientePaso({
        consentimientoRespondido: true,
        carreraDeclarada: true,
        materiasConfirmadas: true,
        disponibilidadRespondida: true,
      }),
    ).toBeNull();
  });

  it("«no sé» cuenta como contestada: el alta NO se traba ahí", () => {
    // Mismo precedente que WhatsApp (ADR-042 §2): saltear la pregunta más
    // difícil del alta no puede costarle el acceso al producto. Lo que se pierde
    // es el reparto, y eso se muestra como estado degradado.
    expect(
      siguientePaso({
        consentimientoRespondido: true,
        carreraDeclarada: true,
        materiasConfirmadas: true,
        disponibilidadRespondida: true, // contestó; declaró cero bloques
      }),
    ).toBeNull();
  });
});

// ── El Service, con dobles ───────────────────────────────────────────────────

/** Una base en memoria, con los mismos `UNIQUE` que tiene Postgres. */
function baseFalsa() {
  const consentimientos: string[] = [];
  const inscripciones = new Map<string, { plan: string; anio: number; confirmadaEn: string | null }>();
  // `UNIQUE (student_id, offering_id)` y `UNIQUE (student_id, curriculum_requirement_id)`.
  const cursadas = new Set<string>();
  const declaraciones = new Map<string, string>();
  const eventosPublicados: string[] = [];

  const alta: RepositorioDelAlta = {
    async estado(_i, studentId) {
      const insc = inscripciones.get(studentId);
      return {
        consentimientoRespondido: consentimientos.includes(studentId),
        carreraDeclarada: insc !== undefined,
        materiasConfirmadas: insc?.confirmadaEn !== null && insc?.confirmadaEn !== undefined,
        // ADR-073: el paso existe y este doble no lo ejercita. `false` mantiene
        // la máquina en su último paso, que es lo que estos tests miden.
        disponibilidadRespondida: false,
        declaracion: insc
          ? {
              inscripcionId: `insc-${studentId}`,
              carreraId: "prog-1",
              planId: insc.plan,
              anio: insc.anio,
              periodo: "2026-2",
              confirmadaEn: insc.confirmadaEn,
            }
          : null,
      };
    },
    async registrarConsentimiento(_i, studentId) {
      consentimientos.push(studentId);
    },
    async declararCarrera(args) {
      const previo = inscripciones.get(args.studentId);
      inscripciones.set(args.studentId, {
        plan: args.curriculumPlanId,
        anio: args.curriculumYear,
        confirmadaEn: previo?.confirmadaEn ?? null,
      });
      return `insc-${args.studentId}`;
    },
    async confirmar(args) {
      const previo = inscripciones.get(args.studentId);
      const yaEstaba = previo?.confirmadaEn != null;
      inscripciones.set(args.studentId, {
        plan: args.curriculumPlanId,
        anio: args.curriculumYear,
        // Reconfirmar no mueve la fecha original: el alta ocurrió una vez.
        confirmadaEn: previo?.confirmadaEn ?? "2026-09-05T12:00:00.000Z",
      });
      for (const s of args.selecciones) {
        if (s.materiaId) cursadas.add(`${args.studentId}/${s.materiaId}`);
        declaraciones.set(
          `${args.studentId}/${s.requisitoId}`,
          s.materiaId ?? s.nombreEscrito ?? "",
        );
      }
      return {
        inscripcionId: `insc-${args.studentId}`,
        cursadas: cursadas.size,
        declaraciones: declaraciones.size,
        esPrimera: !yaEstaba,
      };
    },
    async cursadasActivas(_i, studentId) {
      return [...cursadas].filter((c) => c.startsWith(`${studentId}/`));
    },
  };

  const catalogo: RepositorioDelCatalogo = {
    async planesDeCarrera() {
      return [{ id: "plan-pub", version: "SYN-2016", validFrom: null, validUntil: null }];
    },
    async requisitos() {
      return { planId: "plan-pub", requisitos: [] };
    },
    async duenioDelPlan(planId) {
      // El `DRAFT` **no existe** para el Repository: devuelve `null` igual que
      // un plan inexistente, y por eso el Service no puede distinguirlos.
      if (planId === "plan-draft" || planId === "plan-inexistente") return null;
      if (planId === "plan-de-otra") return { institutionId: "inst-2", programId: "prog-9" };
      return { institutionId: "inst-1", programId: "prog-1" };
    },
  };

  const eventos = {
    async publicar(e: { nombre: string }) {
      eventosPublicados.push(e.nombre);
    },
  };

  return { alta, catalogo, eventos, consentimientos, cursadas, declaraciones, inscripciones, eventosPublicados };
}

const recomendarSiempre = async () => ({ estado: "RECOMENDADA" });

const SELECCION = [{ requisitoId: "req-1", materiaId: "mat-1" }];

describe("B6.14 · el estado del alta y el reingreso", () => {
  it("un estudiante nuevo empieza por WhatsApp", async () => {
    const { alta } = baseFalsa();
    const r = await estadoDelAlta(alta, "inst-1", "est-1");
    expect(r.completa).toBe(false);
    expect(r.siguiente).toBe("/alta/whatsapp");
  });

  it("rechazar WhatsApp no traba el alta (ADR-042 §2)", async () => {
    const { alta } = baseFalsa();
    await decidirWhatsapp(alta, "inst-1", "est-1", "DECLINED");
    const r = await estadoDelAlta(alta, "inst-1", "est-1");
    expect(r.siguiente).toBe("/alta/carrera");
  });

  it("al reingresar con el alta completa, no se repite ningún paso", async () => {
    // ⚠️ El doble de `estado()` devuelve `disponibilidadRespondida: false`, así
    // que acá el alta queda en el paso nuevo. Se declara para que el test siga
    // midiendo lo que medía: que no se repiten los pasos **ya hechos**.
    const { alta, catalogo, eventos } = baseFalsa();
    await decidirWhatsapp(alta, "inst-1", "est-1", "GRANTED");
    await confirmarMapaAcademico(
      { alta, catalogo, eventos, recomendar: recomendarSiempre },
      "inst-1",
      "est-1",
      { curriculumPlanId: "plan-pub", curriculumYear: 2, term: "2026-2", selecciones: SELECCION },
    );

    const r = await estadoDelAlta(alta, "inst-1", "est-1");
    expect(r.siguiente).toBe("/alta/disponibilidad");
    // Ni WhatsApp ni carrera ni materias vuelven a pedirse.
    expect(r.paso).toBe("DISPONIBILIDAD");

    // Y con la disponibilidad contestada, el gate deja pasar.
    const completa = { completa: true, siguiente: null };
    expect(altaPendiente(completa)).toBeNull();
  });

  it("con el alta incompleta, el gate devuelve el 409 con su salida", async () => {
    const { alta } = baseFalsa();
    const r = await estadoDelAlta(alta, "inst-1", "est-1");
    expect(altaPendiente(r)).toEqual({
      error: "ALTA_INCOMPLETA",
      siguiente: "/alta/whatsapp",
    });
  });
});

describe("B6.14 · idempotencia: el doble submit no duplica", () => {
  it("dos confirmaciones idénticas dejan las mismas filas", async () => {
    const { alta, catalogo, eventos, cursadas, declaraciones } = baseFalsa();
    const entrada = {
      curriculumPlanId: "plan-pub",
      curriculumYear: 2,
      term: "2026-2",
      selecciones: [
        { requisitoId: "req-1", materiaId: "mat-1" },
        { requisitoId: "req-2", materiaId: "mat-2" },
      ],
    };
    const deps = { alta, catalogo, eventos, recomendar: recomendarSiempre };

    const a = await confirmarMapaAcademico(deps, "inst-1", "est-1", entrada);
    const b = await confirmarMapaAcademico(deps, "inst-1", "est-1", entrada);

    expect(a.estado).toBe("OK");
    expect(b.estado).toBe("OK");
    expect(cursadas.size).toBe(2);
    expect(declaraciones.size).toBe(2);
  });

  it("reconfirmar no mueve la fecha del alta: ocurrió una sola vez", async () => {
    const { alta, catalogo, eventos, inscripciones } = baseFalsa();
    const deps = { alta, catalogo, eventos, recomendar: recomendarSiempre };
    const entrada = {
      curriculumPlanId: "plan-pub",
      curriculumYear: 2,
      term: "2026-2",
      selecciones: SELECCION,
    };
    await confirmarMapaAcademico(deps, "inst-1", "est-1", entrada);
    const primera = inscripciones.get("est-1")?.confirmadaEn;
    await confirmarMapaAcademico(deps, "inst-1", "est-1", entrada);
    expect(inscripciones.get("est-1")?.confirmadaEn).toBe(primera);
  });
});

describe("B6.14 · aislamiento entre estudiantes e instituciones", () => {
  it("lo que confirma un estudiante no aparece en el otro", async () => {
    const { alta, catalogo, eventos } = baseFalsa();
    const deps = { alta, catalogo, eventos, recomendar: recomendarSiempre };
    await confirmarMapaAcademico(deps, "inst-1", "est-1", {
      curriculumPlanId: "plan-pub",
      curriculumYear: 2,
      term: "2026-2",
      selecciones: SELECCION,
    });

    expect((await estadoDelAlta(alta, "inst-1", "est-2")).completa).toBe(false);
    expect(await alta.cursadasActivas("inst-1", "est-2")).toEqual([]);
  });

  it("un plan de otra institución no se puede declarar ni confirmar", async () => {
    const { alta, catalogo, eventos } = baseFalsa();
    const entrada = { curriculumPlanId: "plan-de-otra", curriculumYear: 1, term: "2026-2" };

    expect((await declararCarrera({ alta, catalogo }, "inst-1", "est-1", entrada)).estado).toBe(
      "OTRA_INSTITUCION",
    );
    const r = await confirmarMapaAcademico(
      { alta, catalogo, eventos, recomendar: recomendarSiempre },
      "inst-1",
      "est-1",
      { ...entrada, selecciones: SELECCION },
    );
    expect(r.estado).toBe("OTRA_INSTITUCION");
  });
});

describe("B6.14 · un plan DRAFT no se le ofrece a nadie (ADR-051)", () => {
  it("no se puede declarar contra un borrador", async () => {
    const { alta, catalogo } = baseFalsa();
    const r = await declararCarrera({ alta, catalogo }, "inst-1", "est-1", {
      curriculumPlanId: "plan-draft",
      curriculumYear: 1,
      term: "2026-2",
    });
    expect(r.estado).toBe("PLAN_NO_DISPONIBLE");
  });

  it("no se puede confirmar contra un borrador", async () => {
    const { alta, catalogo, eventos, cursadas } = baseFalsa();
    const r = await confirmarMapaAcademico(
      { alta, catalogo, eventos, recomendar: recomendarSiempre },
      "inst-1",
      "est-1",
      {
        curriculumPlanId: "plan-draft",
        curriculumYear: 1,
        term: "2026-2",
        selecciones: SELECCION,
      },
    );
    expect(r.estado).toBe("PLAN_NO_DISPONIBLE");
    // Y no escribió nada: el rechazo es antes de tocar la base.
    expect(cursadas.size).toBe(0);
  });

  it("un borrador y un plan inexistente dan la misma respuesta", async () => {
    // Distinguirlos filtraría el catálogo que todavía no se publicó.
    const { alta, catalogo } = baseFalsa();
    const draft = await declararCarrera({ alta, catalogo }, "inst-1", "est-1", {
      curriculumPlanId: "plan-draft",
      curriculumYear: 1,
      term: "2026-2",
    });
    const inexistente = await declararCarrera({ alta, catalogo }, "inst-1", "est-1", {
      curriculumPlanId: "plan-inexistente",
      curriculumYear: 1,
      term: "2026-2",
    });
    expect(draft).toEqual(inexistente);
  });
});

describe("B6.14 · la electiva informada por el estudiante no toca el catálogo", () => {
  it("un nombre escrito a mano se declara y no crea una materia", async () => {
    const { alta, catalogo, eventos, cursadas, declaraciones } = baseFalsa();
    const r = await confirmarMapaAcademico(
      { alta, catalogo, eventos, recomendar: recomendarSiempre },
      "inst-1",
      "est-1",
      {
        curriculumPlanId: "plan-pub",
        curriculumYear: 3,
        term: "2026-2",
        selecciones: [{ requisitoId: "req-electiva", nombreEscrito: "Computación Cuántica" }],
      },
    );
    expect(r.estado).toBe("OK");
    expect(declaraciones.get("est-1/req-electiva")).toBe("Computación Cuántica");
    // **Ninguna cursada**: no hay materia en el catálogo a la que inscribirse.
    expect(cursadas.size).toBe(0);
  });

  it("una opción verificada del catálogo sí crea la cursada", async () => {
    const { alta, catalogo, eventos, cursadas } = baseFalsa();
    await confirmarMapaAcademico(
      { alta, catalogo, eventos, recomendar: recomendarSiempre },
      "inst-1",
      "est-1",
      {
        curriculumPlanId: "plan-pub",
        curriculumYear: 3,
        term: "2026-2",
        selecciones: [{ requisitoId: "req-electiva", materiaId: "mat-cuantica" }],
      },
    );
    expect(cursadas.has("est-1/mat-cuantica")).toBe(true);
  });

  it("confirmar sin ninguna selección útil se rechaza", async () => {
    const { alta, catalogo, eventos } = baseFalsa();
    const r = await confirmarMapaAcademico(
      { alta, catalogo, eventos, recomendar: recomendarSiempre },
      "inst-1",
      "est-1",
      {
        curriculumPlanId: "plan-pub",
        curriculumYear: 1,
        term: "2026-2",
        selecciones: [{ requisitoId: "req-1" }],
      },
    );
    expect(r.estado).toBe("SIN_SELECCION");
  });
});

describe("B6.14 · el ADE corre después de confirmar, nunca antes", () => {
  it("se invoca una vez por cursada activa, con las cursadas ya escritas", async () => {
    const { alta, catalogo, eventos, cursadas } = baseFalsa();
    const vistas: string[] = [];

    const r = await confirmarMapaAcademico(
      {
        alta,
        catalogo,
        eventos,
        recomendar: async (_i, cursada) => {
          // Si corriera antes de escribir, acá no habría ninguna.
          expect(cursadas.size).toBeGreaterThan(0);
          vistas.push(cursada);
          return { estado: "RECOMENDADA" };
        },
      },
      "inst-1",
      "est-1",
      {
        curriculumPlanId: "plan-pub",
        curriculumYear: 2,
        term: "2026-2",
        selecciones: [
          { requisitoId: "req-1", materiaId: "mat-1" },
          { requisitoId: "req-2", materiaId: "mat-2" },
        ],
      },
    );

    expect(vistas).toHaveLength(2);
    if (r.estado === "OK") expect(r.recomendadas).toBe(2);
  });

  it("una cursada sin contexto no rompe el alta: ya ocurrió y quedó escrita", async () => {
    const { alta, catalogo, eventos } = baseFalsa();
    const r = await confirmarMapaAcademico(
      {
        alta,
        catalogo,
        eventos,
        recomendar: async () => ({ estado: "SIN_RECOMENDACION" }),
      },
      "inst-1",
      "est-1",
      {
        curriculumPlanId: "plan-pub",
        curriculumYear: 2,
        term: "2026-2",
        selecciones: SELECCION,
      },
    );
    expect(r.estado).toBe("OK");
    if (r.estado === "OK") expect(r.recomendadas).toBe(0);
  });
});

describe("B6.14 · el estudiante sin materias no recibe un veredicto (ADR-042)", () => {
  it("sin cursadas, el Hero es PREPARANDO_INFORMACION y no NO_ACTION_AVAILABLE", () => {
    const r = selectHeroLevel({
      action: "NONE",
      commitment: "NONE",
      rescate: "NONE",
      actionRecommended: false,
      contextIncomplete: false,
      sinMaterias: true,
      evidenciaInformativa: "NONE",
    });
    expect(r.nivel).toBe("CONTEXT_INCOMPLETE");
    expect(r.variante).toBe("PREPARANDO_INFORMACION");
    expect(r.nivel).not.toBe("NO_ACTION_AVAILABLE");
  });

  it("y ese estado no ofrece CTA: no hay nada que el estudiante pueda apretar", () => {
    expect(ofreceCta("CONTEXT_INCOMPLETE", "PREPARANDO_INFORMACION")).toBe(false);
    expect(ofreceCta("NO_ACTION_AVAILABLE", null)).toBe(true);
  });

  it("con cursadas sin unidades sigue siendo el contexto incompleto de siempre", () => {
    const r = selectHeroLevel({
      action: "NONE",
      commitment: "NONE",
      rescate: "NONE",
      actionRecommended: false,
      contextIncomplete: true,
      sinMaterias: false,
      evidenciaInformativa: "NONE",
    });
    expect(r.variante).toBeNull();
  });
});

describe("B6.14 · resolverPlan, del Service", () => {
  it("con un solo plan publicado devuelve OK sin preguntar", async () => {
    const { catalogo } = baseFalsa();
    const r = await resolverPlan(catalogo, "prog-1", AHORA);
    expect(r.estado).toBe("OK");
  });
});

describe("B6.14 · el hecho que el spec §7.3 define", () => {
  it("confirmar emite `AcademicMapMinimumReached`, y una sola vez por confirmación", async () => {
    const { alta, catalogo, eventos, eventosPublicados } = baseFalsa();
    await confirmarMapaAcademico(
      { alta, catalogo, eventos, recomendar: recomendarSiempre },
      "inst-1",
      "est-1",
      { curriculumPlanId: "plan-pub", curriculumYear: 2, term: "2026-2", selecciones: SELECCION },
    );
    expect(eventosPublicados).toEqual(["AcademicMapMinimumReached"]);
  });

  it("reconfirmar NO lo vuelve a emitir: el mapa mínimo se alcanza una vez", async () => {
    /*
      `product_event` es append-only, así que dos emisiones serían dos hechos
      donde ocurrió uno — y duplicarían las activaciones del piloto. Las filas
      ya no se duplicaban; el evento sí.
    */
    const { alta, catalogo, eventos, eventosPublicados } = baseFalsa();
    const deps = { alta, catalogo, eventos, recomendar: recomendarSiempre };
    const entrada = {
      curriculumPlanId: "plan-pub",
      curriculumYear: 2,
      term: "2026-2",
      selecciones: SELECCION,
    };
    await confirmarMapaAcademico(deps, "inst-1", "est-1", entrada);
    await confirmarMapaAcademico(deps, "inst-1", "est-1", entrada);
    expect(eventosPublicados).toEqual(["AcademicMapMinimumReached"]);
  });

  it("no lo emite si el plan no está publicado: no hubo mapa que alcanzar", async () => {
    const { alta, catalogo, eventos, eventosPublicados } = baseFalsa();
    await confirmarMapaAcademico(
      { alta, catalogo, eventos, recomendar: recomendarSiempre },
      "inst-1",
      "est-1",
      { curriculumPlanId: "plan-draft", curriculumYear: 2, term: "2026-2", selecciones: SELECCION },
    );
    expect(eventosPublicados).toEqual([]);
  });
});
