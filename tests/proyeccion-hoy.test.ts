import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

import { proyectarDia, type EstadoDelDia } from "@/lib/server/servicios/proyeccion-hoy";

/**
 * Etapa B2.5 — `UX01` proyectada desde datos persistidos.
 *
 * Lo que se prueba es que **la pantalla no se entera**: el `HoyProps` que sale
 * de acá tiene la misma forma que el que daba el fixture, y la precedencia la
 * decide la misma `selectHeroLevel` de siempre.
 */
const vacio: EstadoDelDia = {
  instante: "2026-08-28T15:00:00.000Z",
  zona: "America/Argentina/Cordoba",
  accion: null,
  compromiso: null,
  rescatePendiente: false,
  evidencia: "NONE",
  contextoIncompleto: false,
  materias: [],
  bitacoraDisponible: true,
};

const conAccion: EstadoDelDia = {
  ...vacio,
  accion: {
    id: "acc-1",
    status: "RECOMMENDED",
    objetivo: "Derivadas",
    contexto: "ANÁLISIS II · UNIDAD 2",
    razon: "Entra en Parcial 1.",
    minutosMin: 30,
    minutosMax: 45,
    evidenciaEsperada: "Producción de la práctica",
    queSigue: "queda definido cuándo vas a hacerla.",
  },
};

describe("B2.5 · la precedencia es la misma de siempre", () => {
  it("una Action recomendada da el nivel ACTION_RECOMMENDED", () => {
    expect(proyectarDia(conAccion).hero.nivel).toBe("ACTION_RECOMMENDED");
  });

  /**
   * El orden de la matriz manda: un rescate pendiente gana sobre una
   * recomendación, aunque las dos estén presentes. Si esto se rompiera, el
   * estudiante vería "practicá derivadas" con un compromiso incumplido encima.
   */
  it("un rescate pendiente gana sobre una recomendación", () => {
    const r = proyectarDia({ ...conAccion, rescatePendiente: true });
    expect(r.hero.nivel).toBe("RESCUE_REQUIRED");
  });

  it("un compromiso MISSED gana sobre una recomendación", () => {
    const r = proyectarDia({ ...conAccion, compromiso: { state: "MISSED" } });
    expect(r.hero.nivel).toBe("COMMITMENT_MISSED");
  });

  it("sin nada, el estado es el de defecto y no hay título", () => {
    const r = proyectarDia(vacio);
    expect(r.hero.titulo).toBeNull();
    expect(r.estadoGeneral).toBe("SIN ACCIONES POR AHORA");
  });
});

describe("B2.5 · omitir, no inventar", () => {
  it("sin estimación, la línea de tiempo no se rellena", () => {
    const r = proyectarDia({
      ...conAccion,
      accion: { ...conAccion.accion!, minutosMin: null, minutosMax: null },
    });
    expect(r.hero.tiempoOEstado).toBeNull();
  });

  it("sin evidencia esperada, no se inventa el requisito", () => {
    const r = proyectarDia({
      ...conAccion,
      accion: { ...conAccion.accion!, evidenciaEsperada: null },
    });
    expect(r.hero.evidenciaEsperada).toBeNull();
  });

  it("sin `queSigue`, la línea entera desaparece", () => {
    const r = proyectarDia({ ...conAccion, accion: { ...conAccion.accion!, queSigue: null } });
    expect(r.hero.queSigue).toBeNull();
  });

  /**
   * `null` ⇒ la CTA **no se renderiza**, en vez de renderizarse deshabilitada.
   * Aparición y habilitación son cosas distintas (ADR-015).
   */
  it("sin Bitácora disponible, la CTA de progreso no aparece", () => {
    expect(proyectarDia({ ...vacio, bitacoraDisponible: false }).verProgreso).toBeNull();
  });
});

describe("B2.5 · la línea operativa cambia con el estado", () => {
  it("una Action en curso muestra el estado, no los minutos", () => {
    const r = proyectarDia({
      ...conAccion,
      accion: { ...conAccion.accion!, status: "IN_PROGRESS" },
    });
    expect(r.hero.tiempoOEstado).toBe("En curso");
    expect(r.hero.nivel).toBe("IN_PROGRESS");
  });
});

describe("B2.5 · la fecha se formatea en la zona del estudiante", () => {
  /**
   * Un compromiso de las 23:00 en Córdoba no puede aparecer como del día
   * siguiente porque el servidor esté en UTC. La zona viaja con el estudiante.
   */
  it("usa la zona del estudiante, no la del servidor", () => {
    const nocheEnCordoba = { ...vacio, instante: "2026-08-29T02:00:00.000Z" };
    // 02:00 UTC es todavía el 28 en Córdoba (UTC-3).
    expect(proyectarDia(nocheEnCordoba).fecha).toContain("28");
    expect(proyectarDia({ ...nocheEnCordoba, zona: "UTC" }).fecha).toContain("29");
  });

  it("sale en español y sin puntos", () => {
    const f = proyectarDia(vacio).fecha;
    expect(f).toMatch(/ago/);
    expect(f).not.toContain(".");
  });

  it("sin avance registrado, la materia no dice «hace 0 días»", () => {
    const r = proyectarDia({
      ...vacio,
      materias: [{ cursadaId: "ce-" + "M", nombre: "M", estado: null, tono: "neutral", ultimoAvanceEn: null }],
    });
    expect(r.materias[0].ultimoAvance).toBeNull();
  });
});

/**
 * Etapa B2.6 — el defecto que la `B2.5` dejó, y que este test impide que vuelva.
 *
 * `estado_del_dia` devolvía `'Bajo control'` **literal en SQL** para toda
 * materia. Con fixtures eso era dato del escenario; con datos persistidos era
 * exactamente el copy que `product.md` §13 prohíbe: *«"Bajo control" sin lectura
 * confiable del Risk Engine»*. El Risk Engine es la Fase B6.
 */
describe("B2.6 · la materia no afirma un estado que nadie evaluó", () => {
  it("sin lectura de estado, la línea se omite en vez de rellenarse", () => {
    const r = proyectarDia({
      ...vacio,
      materias: [{ cursadaId: "ce-" + "Análisis II", nombre: "Análisis II", estado: null, tono: "neutral", ultimoAvanceEn: null }],
    });
    expect(r.materias[0].estado).toBeNull();
  });

  it("cuando exista una lectura real, se muestra tal cual", () => {
    // El día que el Risk Engine emita una señal, la proyección la pasa sin
    // tocarla: lo que cambia es que haya fuente, no la forma.
    const r = proyectarDia({
      ...vacio,
      materias: [{ cursadaId: "ce-" + "Análisis II", nombre: "Análisis II", estado: "Necesita atención", tono: "urgencia", ultimoAvanceEn: null }],
    });
    expect(r.materias[0].estado).toBe("Necesita atención");
    expect(r.materias[0].tono).toBe("urgencia");
  });

  it("la migración no dejó la afirmación en el SQL", () => {
    // Se mira la función vigente, que es la que corre. Un `grep` sobre todas
    // las migraciones marcaría la vieja, que quedó en la historia a propósito.
    const sql = readFileSync(
      resolve(process.cwd(), "supabase/migrations/20260831000000_estado_sin_afirmacion.sql"),
      "utf8",
    );
    const cuerpo = sql.replace(/^\s*--.*$/gm, "");
    expect(cuerpo).not.toContain("'Bajo control'");
  });
});

describe("B2.5 · la forma es la que la pantalla espera", () => {
  /**
   * El contrato con la pantalla es `HoyProps`. Si esta proyección devolviera
   * una forma distinta, la frontera de la Fase 0 no habría servido de nada.
   */
  it("devuelve exactamente las claves de `HoyProps`", () => {
    expect(Object.keys(proyectarDia(conAccion)).sort()).toEqual(
      ["estadoGeneral", "fecha", "hero", "materias", "recuperacion", "verProgreso"].sort(),
    );
  });

  it("el hero trae las claves de `HeroProjection`", () => {
    expect(Object.keys(proyectarDia(conAccion).hero).sort()).toEqual(
      ["chip", "contexto", "evidenciaEsperada", "nivel", "queSigue", "razon", "tiempoOEstado", "titulo", "variante"].sort(),
    );
  });
});


describe("B6 · el riesgo modifica el estado, y nada más", () => {
  /**
   * `VI.1` §3.3 es la fila que este bloque protege: `HIGH_RISK` es un estado
   * **modificador, no reemplazante**. *"No gana automáticamente el Hero"* y
   * *"no puede interrumpir `IN_PROGRESS` ni `EVIDENCE_PENDING` sólo por
   * severidad"*.
   *
   * Es la clase de regla que se rompe sola en la primera refactorización, y por
   * eso el riesgo ni siquiera entra a `HeroInput`.
   */
  const riesgoAlto = {
    severidad: "intervencion" as const,
    razon: "tres entregas seguidas con el mismo error de método",
    necesitaPersona: true,
  };

  it("cambia el estado general a «necesita recuperación»", () => {
    const p = proyectarDia({ ...vacio, riesgo: riesgoAlto });
    expect(p.estadoGeneral).toBe("NECESITA RECUPERACIÓN");
  });

  it("no interrumpe una Action en curso: el Hero sigue siendo el trabajo", () => {
    const enCurso: EstadoDelDia = {
      ...conAccion,
      accion: { ...conAccion.accion!, status: "IN_PROGRESS" },
      riesgo: riesgoAlto,
    };
    const p = proyectarDia(enCurso);
    expect(p.hero.nivel).toBe("IN_PROGRESS");
    expect(p.hero.titulo).toBe("Derivadas");
  });

  it("no interrumpe una evidencia pendiente", () => {
    const p = proyectarDia({
      ...conAccion,
      accion: { ...conAccion.accion!, status: "EVIDENCE_PENDING" },
      riesgo: riesgoAlto,
    });
    expect(p.hero.nivel).toBe("EVIDENCE_PENDING");
  });

  it("una señal viva que todavía no pide una persona no cambia nada", () => {
    // Qué severidad cambia el estado general es `C01-021`, abierto. Lo que la
    // proyección mira es si **la señal misma** dice que necesita una persona.
    const sinPersona = { ...riesgoAlto, necesitaPersona: false };
    expect(proyectarDia({ ...vacio, riesgo: sinPersona }).estadoGeneral).toBe(
      proyectarDia(vacio).estadoGeneral,
    );
  });

  it("no inventa una acción ni una CTA por riesgo", () => {
    // *"Riesgo alto sin Action/Commitment/Rescue → Hero = fallback honesto…
    // RiskSignal no inventa una acción"* (`VI.1` §3.4).
    const p = proyectarDia({ ...vacio, riesgo: riesgoAlto });
    expect(p.hero.titulo).toBeNull();
    expect(p.hero.razon).toBeNull();
    expect(p.materias).toEqual([]);
  });

  it("no reordena materias por riesgo", () => {
    const conMaterias: EstadoDelDia = {
      ...vacio,
      materias: [
        { cursadaId: "ce-" + "Análisis II", nombre: "Análisis II", estado: null, ultimoAvanceEn: null, tono: "neutral" },
        { cursadaId: "ce-" + "Álgebra", nombre: "Álgebra", estado: null, ultimoAvanceEn: null, tono: "neutral" },
      ],
    };
    const sin = proyectarDia(conMaterias).materias.map((m) => m.nombre);
    const con = proyectarDia({ ...conMaterias, riesgo: riesgoAlto }).materias.map((m) => m.nombre);
    expect(con).toEqual(sin);
  });

  /**
   * Regresión de ADR-034 — Fase B6.2.
   *
   * El lifecycle cambió; **lo que el estudiante ve, no**. Una señal legacy en
   * `ACKNOWLEDGED` sigue siendo una señal viva: si `estado_del_dia()` dejara de
   * considerarla, desaparecería de `UX01` sin que nadie la resolviera — que es
   * peor que el estado del que venía.
   */
  it("una señal legacy en `ACKNOWLEDGED` sigue viva para UX01", () => {
    const sql = readFileSync(
      resolve(process.cwd(), "supabase/migrations/20260902030000_riesgo_en_hoy.sql"),
      "utf8",
    );
    expect(sql).toContain("'OPEN','ACKNOWLEDGED','INTERVENTION_REQUIRED'");
  });

  it("el disparador sigue siendo pedir una persona, no una severidad", () => {
    // ADR-034 no tocó esto, y el test existe para que se note si alguien lo
    // toca de paso: elegir una severidad sería fijar el umbral de `C01-021`.
    // Sin copy hardcodeada: se compara contra los dos extremos ya proyectados.
    const alta = { ...riesgoAlto, severidad: "intervencion" as const, necesitaPersona: false };
    expect(proyectarDia({ ...vacio, riesgo: alta }).estadoGeneral).toBe(
      proyectarDia(vacio).estadoGeneral,
    );
    const baja = { ...riesgoAlto, severidad: "bajo" as const, necesitaPersona: true };
    expect(proyectarDia({ ...vacio, riesgo: baja }).estadoGeneral).toBe(
      proyectarDia({ ...vacio, riesgo: riesgoAlto }).estadoGeneral,
    );
  });

  it("los identificadores de §7.6 no llegan a la pantalla", () => {
    // ADR-034 §7.6: `estado_del_dia()` los devuelve para el flujo C del
    // contrato con el CRM. `UX01` no los necesita, y lo que la pantalla no
    // necesita no viaja: el día que alguien renderice un UUID va a ser porque
    // estaba a mano.
    const p = proyectarDia({
      ...vacio,
      accion: { ...vacio.accion!, id: "acc-1" },
      materias: [
        { cursadaId: "ce-1", nombre: "Análisis II", estado: null, ultimoAvanceEn: null, tono: "neutral" },
      ],
    });
    expect(JSON.stringify(p)).not.toContain("acc-1");
    expect(JSON.stringify(p)).not.toContain("ce-1");
  });

  it("el riesgo no entra a la matriz de precedencia", () => {
    // El guard estructural: si alguien lo mete en `HeroInput`, esto rompe.
    const fuente = readFileSync(
      resolve(process.cwd(), "lib/server/servicios/proyeccion-hoy.ts"),
      "utf8",
    );
    const entrada = fuente.slice(
      fuente.indexOf("function aEntradaDeHero"),
      fuente.indexOf("const ESTADO"),
    );
    expect(entrada).not.toContain("riesgo");
  });
});

/**
 * Lo que el estudiante ve de su propia señal — Etapa B6.6.2.
 *
 * ⚠️ La regla que produce estas señales es `PROVISIONAL` ([ADR-036](../docs/decisions.md#adr-036)).
 * Lo que estos tests fijan no es el umbral: es que la **presentación traduzca y
 * no vuelva a decidir**, y que no se le filtre al estudiante nada del mecanismo.
 */
describe("B6.6.2 · la explicación útil, y lo que nunca sale de la máquina", () => {
  const señal = {
    severidad: "riesgo" as const,
    razon: "Error de procedimiento: 2 veces en la preparación de este examen",
    necesitaPersona: false,
  };
  const elevada = { ...señal, necesitaPersona: true, severidad: "intervencion" as const };

  it("sin señal viva, la sección no existe", () => {
    // `null` y no un objeto vacío: una sección que dice "todo bien" afirma una
    // lectura que nadie hizo (`P-09`).
    expect(proyectarDia(vacio).recuperacion).toBeNull();
    expect(proyectarDia({ ...vacio, riesgo: null }).recuperacion).toBeNull();
  });

  it("una dificultad reiterada explica qué pasó y qué sigue", () => {
    const r = proyectarDia({ ...vacio, riesgo: señal }).recuperacion!;
    expect(r.estado).toBe("REITERADA");
    expect(r.titulo.length).toBeGreaterThan(0);
    expect(r.queSigue).not.toBeNull();
    // La causa canónica viaja tal cual: sin el hecho, la explicación es una
    // frase amable y nada más.
    expect(r.detalle).toBe(señal.razon);
  });

  it("cuando pide una persona, se lo dice: el caso fue elevado", () => {
    const r = proyectarDia({ ...vacio, riesgo: elevada }).recuperacion!;
    expect(r.estado).toBe("ELEVADA");
    expect(r.queSigue).toContain("acompañamiento");
  });

  it("y distingue avisado, tomado y en curso", () => {
    const de = (i: "open" | "acknowledged" | "closed" | null) =>
      proyectarDia({ ...vacio, riesgo: { ...elevada, intervencion: i } }).recuperacion!;
    expect(de(null).estado).toBe("ELEVADA");
    expect(de("open").estado).toBe("TOMADA");
    expect(de("acknowledged").estado).toBe("EN_CURSO");
    expect(de("closed").estado).toBe("RESUELTA");
    // Los seis estados salen de dos campos canónicos. No hay lifecycle paralelo.
    expect(new Set(["SIN_SENAL", "REITERADA", "ELEVADA", "TOMADA", "EN_CURSO", "RESUELTA"]).size).toBe(6);
  });

  it("una señal resuelta no se muestra como activa", () => {
    // La lectura sólo trae señales vivas: una `RESOLVED` no llega, y entonces
    // no hay sección. Es la misma ausencia que no tener ninguna.
    expect(proyectarDia({ ...vacio, riesgo: null }).recuperacion).toBeNull();
  });

  it("no se filtra una sola palabra del mecanismo", () => {
    const p = proyectarDia({ ...vacio, riesgo: { ...elevada, intervencion: "acknowledged" } });
    const texto = JSON.stringify(p.recuperacion);
    for (const interno of [
      "risk_signal", "riskSignal", "risk_rule", "rule_version", "HP0-06",
      "INTERVENTION_REQUIRED", "acknowledged", "intervencion\":", "severidad",
      "atencion", "AUTOMATICA", "threshold", "operator", "operador",
    ]) {
      expect(texto, `se filtró "${interno}"`).not.toContain(interno);
    }
  });

  it("ni la severidad ni la regla llegan a la pantalla", () => {
    // La severidad es un valor interno: `VI.2` §8.6 prohíbe exponer uno bruto.
    const p = proyectarDia({ ...vacio, riesgo: elevada });
    expect(JSON.stringify(p)).not.toContain("intervencion\"");
    expect(Object.keys(p.recuperacion!).sort()).toEqual(
      ["detalle", "estado", "explicacion", "queSigue", "titulo"].sort(),
    );
  });

  it("el Hero sigue intacto: la recuperación no lo toca", () => {
    // Regresión de `VI.1` §3.3, ya probada en la B6 y que esta etapa no puede
    // romper: el riesgo modifica el estado general, no la precedencia.
    const sin = proyectarDia(vacio);
    const con = proyectarDia({ ...vacio, riesgo: elevada });
    expect(con.hero).toEqual(sin.hero);
    expect(con.materias).toEqual(sin.materias);
    expect(con.verProgreso).toEqual(sin.verProgreso);
  });

  it("proyectar dos veces da lo mismo: la presentación no acumula nada", () => {
    const e = { ...vacio, riesgo: elevada };
    expect(proyectarDia(e)).toEqual(proyectarDia(e));
  });
});
