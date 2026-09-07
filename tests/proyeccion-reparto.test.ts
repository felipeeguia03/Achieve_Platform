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
  cargaDeclarada: null,
  unidades: [
    { id: "u1", peso: null, trabajado: false },
    { id: "u2", peso: null, trabajado: false },
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
    const r = proyectarReparto({ minutosPorSemana: 600, observaciones: [], materias: [materia()] })!;
    expect(r.requerido).toBe("20 h"); // 1200 min en una semana
  });

  it("con alcance declarado, sólo lo que entra en la próxima evaluación", () => {
    const r = proyectarReparto({
      minutosPorSemana: 600,
      observaciones: [],
      materias: [materia({ alcance: ["u1"] })],
    })!;
    expect(r.requerido).toBe("10 h"); // la mitad: `u2` no entra en este parcial
  });

  it("lo ya trabajado no vuelve a pedirse", () => {
    const r = proyectarReparto({
      minutosPorSemana: 600,
      observaciones: [],
      materias: [
        materia({
          unidades: [
            { id: "u1", peso: null, trabajado: true },
            { id: "u2", peso: null, trabajado: false },
          ],
        }),
      ],
    })!;
    expect(r.requerido).toBe("10 h");
  });
});

describe("Las dos cifras, y ninguna conclusión", () => {
  it("cuando falta tiempo, `falta` es true y no hay ningún veredicto", () => {
    const r = proyectarReparto({ minutosPorSemana: 60, observaciones: [], materias: [materia()] })!;
    expect(r.disponible).toBe("1 h");
    expect(r.requerido).toBe("20 h");
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
    const r = proyectarReparto({ minutosPorSemana: 3000, observaciones: [], materias: [materia()] })!;
    expect(r.falta).toBe(false);
  });

  it("sin disponibilidad declarada, no se compara nada", () => {
    const r = proyectarReparto({ minutosPorSemana: null, observaciones: [], materias: [materia()] })!;
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
      observaciones: [],
      materias: [materia({ clases: [] })],
    })!;
    expect(r.materias[0].motivo).toBe("SIN_ESTIMACION");
    expect(r.materias[0].asignado).toBeNull();
    expect(r.requerido).toBeNull();
  });

  it("sin materias no se dibuja la sección", () => {
    // Una sección vacía diciendo «no hay nada» es peor que no dibujarla.
    expect(proyectarReparto({ minutosPorSemana: 600, observaciones: [], materias: [] })).toBeNull();
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
  const lento = Array.from({ length: 5 }, () => ({
    minutosReales: 75,
    estimadoMin: 40,
    estimadoMax: 60,
  }));

  it("sin historia, el reparto no cambia", () => {
    const r = proyectarReparto({ minutosPorSemana: 600, observaciones: [], materias: [materia()] })!;
    expect(r.requerido).toBe("20 h");
  });

  it("con historia, pide más tiempo — nunca menos", () => {
    const r = proyectarReparto({
      minutosPorSemana: 600,
      observaciones: lento,
      materias: [materia()],
    })!;
    expect(r.requerido).toBe("30 h"); // 20 h × 1,5
  });

  it("a quien tarda MENOS de lo estimado no se le promete menos", () => {
    // ADR-070: el Personal Engine puede pedir más tiempo; no puede prometer que
    // vas a necesitar menos. El piso de 1.0 lo hace cumplir.
    const rapido = Array.from({ length: 5 }, () => ({
      minutosReales: 20,
      estimadoMin: 40,
      estimadoMax: 60,
    }));
    const r = proyectarReparto({
      minutosPorSemana: 600,
      observaciones: rapido,
      materias: [materia()],
    })!;
    expect(r.requerido).toBe("20 h");
  });

  it("una materia sin estimación sigue sin pedir nada, multiplicador o no", () => {
    // El multiplicador escala lo que hay; no convierte un `null` en un número.
    const r = proyectarReparto({
      minutosPorSemana: 600,
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
      observaciones: [],
      // 1200 min pendientes en una semana ⇒ demanda 1200/semana.
      materias: [materia()],
    })!;

  it("`≤1` entra, y no promete resultados", () => {
    const r = conDemanda(1200);
    expect(r.tramo).toBe("ENTRA");
    expect(r.titulo).toBe("Tu plan entra en el tiempo que declaraste.");
    // Nada que reorganizar: no se ofrecen acciones por ofrecer.
    expect(r.acciones).toEqual([]);
    // Y ninguna promesa sobre el examen.
    expect(r.titulo).not.toMatch(/vas a|aprob|listo/i);
  });

  it("`1–2` muestra las dos cifras en primer plano y ofrece reorganizar", () => {
    const r = conDemanda(800); // 1200/800 = 1,5
    expect(r.tramo).toBe("AJUSTABLE");
    expect(r.acciones).toHaveLength(3);
  });

  it("`>2` pone el mensaje primero y el número como detalle", () => {
    const r = conDemanda(300); // 1200/300 = 4
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
      observaciones: [],
      materias: [materia({ clases: [] })],
    })!;
    expect(r.tramo).toBe("SIN_DATOS");
    expect(r.cifras).toBeNull();
  });
});

describe("Lo que el copy tiene prohibido decir (ADR-075 §A1–A2)", () => {
  const todos = [1200, 800, 300, 0].map((d) =>
    proyectarReparto({ minutosPorSemana: d, observaciones: [], materias: [materia()] })!,
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
