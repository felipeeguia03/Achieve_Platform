import { describe, expect, it } from "vitest";

import {
  enHoras,
  proyectarReparto,
  type InsumosDeReparto,
} from "@/lib/server/servicios/proyeccion-reparto";

/**
 * El reparto proyectado — [ADR-073](../docs/decisions.md#adr-073), corte 2.
 *
 * Encadena `duracion.ts` → `cobertura.ts` → `reparto.ts`. Lo que se protege acá
 * es el corte por **alcance declarado**: sin él, un parcial que cubre dos
 * unidades exige la materia entera y el número sale al doble.
 */

const materia = (over: Partial<InsumosDeReparto["materias"][number]> = {}) => ({
  cursadaId: "ce-1",
  nombre: "Cálculo",
  diasHastaEvaluacion: 7,
  alcance: [] as string[],
  cargaDeclarada: null as { minutos: number; texto: string } | null,
  cargaDeEstudio: null as { minutos: number; texto: string } | null,
  // ADR-077. El reparto no los mira; los lee el índice de materias.
  evaluacion: null as {
    titulo: string | null;
    tipo: string | null;
    modalidad: string | null;
    fecha: string;
  } | null,
  ultimoAvanceEn: null as string | null,
  unidades: [
    { id: "u1", peso: null, evidencia: "sin_evidencia" as const },
    { id: "u2", peso: null, evidencia: "sin_evidencia" as const },
  ],
  clases: [
    { minutos: 600, tipo: null, temas: ["u1"] },
    { minutos: 600, tipo: null, temas: ["u2"] },
  ],
  ...over,
});

describe("El alcance declarado recorta lo que hace falta", () => {
  it("sin alcance declarado, cuenta la materia entera", () => {
    // Misma salida que `contexto_del_ade()`: el alcance se declara, nunca se
    // infiere del texto de `scope`.
    const r = proyectarReparto({ minutosPorSemana: 600, calibracionActiva: true, observaciones: [], materias: [materia()] })!;
    expect(r.requerido).toBe("30 h"); // 1200 min de clase × 1,5
  });

  it("con alcance declarado, sólo lo que entra en la próxima evaluación", () => {
    const r = proyectarReparto({
      minutosPorSemana: 600,
      calibracionActiva: true,
      observaciones: [],
      materias: [materia({ alcance: ["u1"] })],
    })!;
    expect(r.requerido).toBe("15 h"); // la mitad: `u2` no entra en este parcial
  });

  it("lo ya trabajado no vuelve a pedirse", () => {
    const r = proyectarReparto({
      minutosPorSemana: 600,
      calibracionActiva: true,
      observaciones: [],
      materias: [
        materia({
          unidades: [
            { id: "u1", peso: null, evidencia: "enviada" as const },
            { id: "u2", peso: null, evidencia: "sin_evidencia" as const },
          ],
        }),
      ],
    })!;
    expect(r.requerido).toBe("15 h");
  });
});

describe("Las dos cifras, y ninguna conclusión", () => {
  it("cuando falta tiempo, `falta` es true y no hay ningún veredicto", () => {
    const r = proyectarReparto({ minutosPorSemana: 60, calibracionActiva: true, observaciones: [], materias: [materia()] })!;
    expect(r.disponible).toBe("1 h");
    expect(r.requerido).toBe("30 h");
    expect(r.falta).toBe(true);
    // El objeto no trae ninguna clave que afirme algo sobre el resultado del
    // examen. `tramo` decide jerarquía visual, no predice nada.
    expect(Object.keys(r).sort()).toEqual(
      [
        "aclaracion",
        "acciones",
        "cifras",
        "disponible",
        "falta",
        "materias",
        "regla",
        "requerido",
        "titulo",
        "tramo",
      ].sort(),
    );
  });

  it("cuando sobra, `falta` es false y tampoco hay veredicto", () => {
    const r = proyectarReparto({ minutosPorSemana: 3000, calibracionActiva: true, observaciones: [], materias: [materia()] })!;
    expect(r.falta).toBe(false);
  });

  it("sin disponibilidad declarada, no se compara nada", () => {
    const r = proyectarReparto({ minutosPorSemana: null, calibracionActiva: true, observaciones: [], materias: [materia()] })!;
    expect(r.disponible).toBeNull();
    expect(r.falta).toBeNull();
    expect(r.materias[0].asignado).toBeNull();
    expect(r.materias[0].motivo).toBe("SIN_DISPONIBILIDAD");
  });
});

describe("Cargar una materia reorganiza a las demás", () => {
  it("dos materias iguales parten el presupuesto por la mitad", () => {
    const r = proyectarReparto({
      minutosPorSemana: 600,
      calibracionActiva: true,
      observaciones: [],
      materias: [materia(), materia({ cursadaId: "ce-2", nombre: "Física" })],
    })!;
    expect(r.materias.map((m) => m.asignado)).toEqual(["5 h", "5 h"]);
  });

  it("cuando no alcanza, ninguna recibe cero", () => {
    // ⚠️ El sistema no elige cuál se sacrifica: una en cero sería proponer
    // abandonarla.
    const r = proyectarReparto({
      minutosPorSemana: 60,
      calibracionActiva: true,
      observaciones: [],
      materias: [materia(), materia({ cursadaId: "ce-2" }), materia({ cursadaId: "ce-3" })],
    })!;
    expect(r.materias.every((m) => m.asignado !== null && m.asignado !== "0 h")).toBe(true);
  });
});

describe("Sin datos no es cero", () => {
  it("una materia sin clases no pide nada, y el motivo lo dice", () => {
    const r = proyectarReparto({
      minutosPorSemana: 600,
      calibracionActiva: true,
      observaciones: [],
      materias: [materia({ clases: [] })],
    })!;
    expect(r.materias[0].motivo).toBe("SIN_ESTIMACION");
    expect(r.materias[0].asignado).toBeNull();
    expect(r.requerido).toBeNull();
  });

  it("sin materias no se dibuja la sección", () => {
    // Una sección vacía diciendo «no hay nada» es peor que no dibujarla.
    expect(proyectarReparto({ minutosPorSemana: 600, calibracionActiva: true, observaciones: [], materias: [] })).toBeNull();
  });
});

describe("El formato no finge precisión", () => {
  it("redondea a la media hora", () => {
    expect(enHoras(90)).toBe("1,5 h");
    expect(enHoras(100)).toBe("1,5 h");
    expect(enHoras(120)).toBe("2 h");
  });
});

describe("El multiplicador personal entra al reparto (ADR-074)", () => {
  /** Cinco observaciones de 75 sobre un central de 50: 1,5×. */
  const lento = Array.from({ length: 5 }, (_, i) => ({
    minutosReales: 75,
    estimadoMin: 40,
    estimadoMax: 60,
    dia: `2026-09-0${i + 1}`,
    tipo: "resolver",
  }));

  it("sin historia, el reparto no cambia", () => {
    const r = proyectarReparto({ minutosPorSemana: 600, calibracionActiva: true, observaciones: [], materias: [materia()] })!;
    // 30 h: el factor de estudio sí se aplica; el personal, no.
    expect(r.requerido).toBe("30 h");
  });

  it("con historia, pide más tiempo — nunca menos", () => {
    const r = proyectarReparto({
      minutosPorSemana: 600,
      calibracionActiva: true,
      observaciones: lento,
      materias: [materia()],
    })!;
    // 30 h de estudio × 1,5 personal. Los dos factores se aplican de a uno y
    // en su lugar: el de estudio es del material, el personal es de la persona.
    expect(r.requerido).toBe("45 h");
  });

  it("a quien tarda MENOS de lo estimado no se le promete menos", () => {
    // ADR-070: el Personal Engine puede pedir más tiempo; no puede prometer que
    // vas a necesitar menos. El piso de 1.0 lo hace cumplir.
    const rapido = Array.from({ length: 5 }, (_, i) => ({
      minutosReales: 20,
      estimadoMin: 40,
      estimadoMax: 60,
      dia: `2026-09-0${i + 1}`,
      tipo: "resolver",
    }));
    const r = proyectarReparto({
      minutosPorSemana: 600,
      calibracionActiva: true,
      observaciones: rapido,
      materias: [materia()],
    })!;
    // Queda en 30 h —el factor de estudio, sin ajuste personal a la baja—, y
    // **no** en 20: el piso de 1.0 impide que ir rápido reduzca la estimación.
    expect(r.requerido).toBe("30 h");
  });

  it("una materia sin estimación sigue sin pedir nada, multiplicador o no", () => {
    // El multiplicador escala lo que hay; no convierte un `null` en un número.
    const r = proyectarReparto({
      minutosPorSemana: 600,
      calibracionActiva: true,
      observaciones: lento,
      materias: [materia({ clases: [] })],
    })!;
    expect(r.materias[0].motivo).toBe("SIN_ESTIMACION");
    expect(r.requerido).toBeNull();
  });
});

describe("Los tres tramos del déficit (ADR-075 §A3)", () => {
  /**
   * Los umbrales son de la psicopedagoga, y ella misma los rotuló: *"umbrales
   * operativos provisionales para el MVP, no puntos de corte clínicos"*.
   */
  const conDemanda = (minutosPorSemana: number) =>
    proyectarReparto({
      minutosPorSemana,
      calibracionActiva: true,
      observaciones: [],
      // 1200 min pendientes en una semana ⇒ demanda 1200/semana.
      materias: [materia()],
    })!;

  it("`≤1` entra, y no promete resultados", () => {
    // 1200 min de clase × 1,5 = 1800 de estudio.
    const r = conDemanda(1800);
    expect(r.tramo).toBe("ENTRA");
    expect(r.titulo).toBe("Tu plan entra en el tiempo que declaraste.");
    // Nada que reorganizar: no se ofrecen acciones por ofrecer.
    expect(r.acciones).toEqual([]);
    // Y ninguna promesa sobre el examen.
    expect(r.titulo).not.toMatch(/vas a|aprob|listo/i);
  });

  it("`1–2` muestra las dos cifras en primer plano y ofrece reorganizar", () => {
    const r = conDemanda(1200); // 1800/1200 = 1,5
    expect(r.tramo).toBe("AJUSTABLE");
    expect(r.acciones).toHaveLength(3);
  });

  it("`>2` pone el mensaje primero y el número como detalle", () => {
    const r = conDemanda(300); // 1800/300 = 6
    expect(r.tramo).toBe("CRITICA");
    expect(r.titulo).toBe("Tu plan no entra completo en el tiempo disponible.");
    // El número sigue estando —no se oculta—, pero baja de jerarquía en la
    // pantalla. Acá lo que se fija es que la cifra exista igual.
    expect(r.cifras).toContain("Esta semana");
  });

  it("cero horas declaradas con trabajo pendiente es crítica", () => {
    // La división no está definida y el caso sí: es regla explícita de §A3.
    const r = conDemanda(0);
    expect(r.tramo).toBe("CRITICA");
  });

  it("sin disponibilidad NO se muestra una comparación cerrada", () => {
    // ⚠️ Textual: *"Mostrar «faltan datos para estimar» y pedir el dato
    // ausente"*. Media comparación es peor que ninguna.
    const r = proyectarReparto({
      minutosPorSemana: null,
      calibracionActiva: true,
      observaciones: [],
      materias: [materia()],
    })!;
    expect(r.tramo).toBe("SIN_DATOS");
    expect(r.cifras).toBeNull();
    // Pero sí una salida: pedirle el dato que falta.
    expect(r.acciones).toEqual(["Revisar mis horas"]);
  });

  it("sin nada estimable, tampoco", () => {
    const r = proyectarReparto({
      minutosPorSemana: 600,
      calibracionActiva: true,
      observaciones: [],
      materias: [materia({ clases: [] })],
    })!;
    expect(r.tramo).toBe("SIN_DATOS");
    expect(r.cifras).toBeNull();
  });
});

describe("Lo que el copy tiene prohibido decir (ADR-075 §A1–A2)", () => {
  const todos = [1800, 1200, 300, 0].map((d) =>
    proyectarReparto({ minutosPorSemana: d, calibracionActiva: true, observaciones: [], materias: [materia()] })!,
  );

  it("ninguna frase dice «no vas a llegar», «deberías poder» ni «estás atrasado»", () => {
    for (const r of todos) {
      const texto = `${r.titulo} ${r.cifras ?? ""} ${r.aclaracion} ${r.acciones.join(" ")}`;
      expect(texto).not.toMatch(/no vas a llegar|deberías poder|estás atrasado/i);
    }
  });

  it("las materias no «piden»: esa personificación se sacó", () => {
    // Textual: *"las materias no «piden» y esa personificación puede sonar a
    // exigencia"*. Se dice «trabajo pendiente estimado».
    for (const r of todos) {
      expect(r.cifras ?? "").not.toMatch(/piden tus materias/i);
    }
    expect(todos[2].cifras).toContain("trabajo pendiente estimado");
  });

  it("ninguna acción propone abandonar una materia", () => {
    for (const r of todos) {
      for (const a of r.acciones) expect(a).not.toMatch(/dej(á|a)|abandon|sum(á|a) \d/i);
    }
  });

  it("siempre que falta tiempo hay al menos una salida", () => {
    // Un déficit sin acción *"puede sentirse como un veredicto y favorecer
    // evitación"*.
    for (const r of todos) {
      if (r.tramo !== "ENTRA") expect(r.acciones.length).toBeGreaterThan(0);
    }
  });

  it("la aclaración no predictiva está siempre", () => {
    for (const r of todos) {
      expect(r.aclaracion).toBe("Es una estimación para organizarte; no predice tu resultado.");
    }
  });
});

describe("El interruptor de la calibración (ADR-075 §B4)", () => {
  const lento = Array.from({ length: 5 }, (_, i) => ({
    minutosReales: 75,
    estimadoMin: 40,
    estimadoMax: 60,
    dia: `2026-09-0${i + 1}`,
    tipo: "resolver",
  }));

  it("apagado, el reparto vuelve a los minutos base", () => {
    const con = proyectarReparto({
      minutosPorSemana: 600,
      calibracionActiva: true,
      observaciones: lento,
      materias: [materia()],
    })!;
    const sin = proyectarReparto({
      minutosPorSemana: 600,
      calibracionActiva: false,
      observaciones: lento,
      materias: [materia()],
    })!;
    expect(con.requerido).toBe("45 h");
    expect(sin.requerido).toBe("30 h");
  });
});

describe("El factor de estudio y su fuente (ADR-075 §D)", () => {
  it("sin declaración de la cátedra, se usa el fallback 1,5 y se rotula como tal", () => {
    // *"No encontré respaldo para afirmar que sea una constante psicopedagógica
    // universal."* El 1,5 es el último recurso, no el número.
    const r = proyectarReparto({
      minutosPorSemana: 600,
      calibracionActiva: true,
      observaciones: [],
      materias: [materia()],
    })!;
    expect(r.requerido).toBe("30 h"); // 1200 min de clase × 1,5
  });

  it("si la cátedra declara el trabajo autónomo, manda eso y no el 1,5", () => {
    // 1200 min de clase declarados y 2400 de estudio ⇒ factor 2, no 1,5.
    const r = proyectarReparto({
      minutosPorSemana: 600,
      calibracionActiva: true,
      observaciones: [],
      materias: [
        materia({
          cargaDeclarada: { minutos: 1200, texto: "20 horas" },
          cargaDeEstudio: { minutos: 2400, texto: "trabajo autónomo: 40 horas" },
        }),
      ],
    })!;
    expect(r.requerido).toBe("40 h");
  });

  it("una declaración de estudio sin carga de clase no puede producir un factor", () => {
    // No hay sobre qué dividir: se cae al fallback en vez de inventar una razón.
    const r = proyectarReparto({
      minutosPorSemana: 600,
      calibracionActiva: true,
      observaciones: [],
      materias: [materia({ cargaDeEstudio: { minutos: 2400, texto: "40 horas" } })],
    })!;
    expect(r.requerido).toBe("30 h");
  });
});
