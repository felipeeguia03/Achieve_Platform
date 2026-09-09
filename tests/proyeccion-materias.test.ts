import { describe, expect, it } from "vitest";
import { proyectarMaterias } from "@/lib/server/servicios/proyeccion-materias";
import type { InsumosDeReparto } from "@/lib/server/servicios/proyeccion-reparto";

const AHORA = "2026-09-08T12:00:00.000Z";
const ZONA = "America/Argentina/Cordoba";

type Materia = InsumosDeReparto["materias"][number];

const materia = (over: Partial<Materia> = {}): Materia => ({
  cursadaId: "c1",
  nombre: "Cálculo",
  diasHastaEvaluacion: 15,
  alcance: [],
  cargaDeclarada: null,
  cargaDeEstudio: null,
  evaluacion: { titulo: "Final", tipo: "final", modalidad: "escrito", fecha: "2026-09-23" },
  ultimoAvanceEn: null,
  primeraClase: null as string | null,
  unidades: [
    { id: "u1", peso: null, evidencia: "enviada" },
    { id: "u2", peso: null, evidencia: "sin_evidencia" },
  ],
  clases: [
    { minutos: 120, tipo: null, temas: ["u1"] },
    { minutos: 120, tipo: null, temas: ["u2"] },
  ],
  ...over,
});

const insumos = (materias: Materia[]): InsumosDeReparto => ({
  minutosPorSemana: 600,
  observaciones: [],
  calibracionActiva: true,
  materias,
});

const proyectar = (materias: Materia[]) => proyectarMaterias(insumos(materias), AHORA, ZONA);

describe("ADR-072 · el orden es por evaluación, nunca por cobertura", () => {
  it("ordena por días hasta la evaluación", () => {
    const r = proyectar([
      materia({ cursadaId: "lejos", nombre: "Lejos", diasHastaEvaluacion: 20 }),
      materia({ cursadaId: "cerca", nombre: "Cerca", diasHastaEvaluacion: 5 }),
    ]);
    expect(r.materias.map((m) => m.nombre)).toEqual(["Cerca", "Lejos"]);
  });

  it("las sin fecha van al fondo, no al frente", () => {
    const r = proyectar([
      materia({ cursadaId: "sf", nombre: "Sin fecha", diasHastaEvaluacion: null, evaluacion: null }),
      materia({ cursadaId: "cf", nombre: "Con fecha", diasHastaEvaluacion: 30 }),
    ]);
    expect(r.materias.map((m) => m.nombre)).toEqual(["Con fecha", "Sin fecha"]);
  });

  /**
   * El guard central de [ADR-072](../docs/decisions.md#adr-072): *"ordenar por
   * cobertura es un ranking de qué tan mal vas"*.
   *
   * ⚠️ **Falla de verdad.** Si alguien ordenara por cobertura, la materia con
   * las dos unidades trabajadas subiría al tope — y acá tiene la evaluación más
   * lejana, así que el orden se invertiría.
   */
  it("una cobertura alta NO adelanta a una materia con la evaluación más cerca", () => {
    const r = proyectar([
      materia({
        cursadaId: "completa",
        nombre: "Completa",
        diasHastaEvaluacion: 40,
        unidades: [
          { id: "u1", peso: null, evidencia: "enviada" },
          { id: "u2", peso: null, evidencia: "enviada" },
        ],
      }),
      materia({
        cursadaId: "vacia",
        nombre: "Vacía",
        diasHastaEvaluacion: 3,
        unidades: [
          { id: "u1", peso: null, evidencia: "sin_evidencia" },
          { id: "u2", peso: null, evidencia: "sin_evidencia" },
        ],
      }),
    ]);
    expect(r.materias.map((m) => m.nombre)).toEqual(["Vacía", "Completa"]);
  });
});

describe("ADR-072 §4 · sin datos no hay barra", () => {
  it("sin clases cargadas no dibuja barra: dice por qué", () => {
    const [m] = proyectar([materia({ clases: [], cargaDeclarada: null })]).materias;
    expect(m.cobertura).toBeNull();
    expect(m.sinCobertura).toContain("sin clases cargadas");
  });

  it("sin temas declarados tampoco, y NO dice lo mismo que sin minutos", () => {
    const [sinTemas] = proyectar([materia({ unidades: [], clases: [] })]).materias;
    const [sinMinutos] = proyectar([materia({ clases: [] })]).materias;
    expect(sinTemas.sinCobertura).toBe("sin temas cargados — no puedo estimar");
    // Dos vacíos distintos **no se dicen igual**: faltar temas y faltar minutos
    // son ausencias de cosas diferentes.
    expect(sinMinutos.sinCobertura).not.toBe(sinTemas.sinCobertura);
  });

  it("la aclaración acompaña a la barra: sin ninguna barra es null", () => {
    expect(proyectar([materia({ clases: [] })]).aclaracion).toBeNull();
    expect(proyectar([materia()]).aclaracion).not.toBeNull();
  });
});

describe("Las ausencias no se convierten en ceros", () => {
  it("sin fecha de evaluación, `faltan` es null y NO «0 d»", () => {
    const [m] = proyectar([
      materia({ diasHastaEvaluacion: null, evaluacion: null }),
    ]).materias;
    expect(m.faltan).toBeNull();
    expect(m.evaluacion).toBeNull();
  });

  it("sin avance registrado, `ultimoAvance` es null y NO «hace 0 días»", () => {
    const [m] = proyectar([materia({ ultimoAvanceEn: null })]).materias;
    expect(m.ultimoAvance).toBeNull();
  });

  it("sin ninguna evaluación con fecha, no se afirma una próxima", () => {
    const r = proyectar([materia({ diasHastaEvaluacion: null, evaluacion: null })]);
    expect(r.proximaEvaluacion).toBeNull();
  });
});

describe("La cobertura mide la materia, no el alcance del parcial", () => {
  /**
   * ⚠️ **Falla de verdad.** Si la cobertura se recortara al alcance declarado
   * —como sí hace el reparto, que estima el trabajo *para esa evaluación*—,
   * declarar que el parcial cubre sólo `u1` haría subir la barra del 50% al
   * 100% **sin que el estudiante hiciera nada**.
   */
  it("declarar el alcance de un parcial no sube la barra", () => {
    const sinAlcance = proyectar([materia()]).materias[0];
    const conAlcance = proyectar([materia({ alcance: ["u1"] })]).materias[0];
    expect(conAlcance.cobertura!.fraccion).toBe(sinAlcance.cobertura!.fraccion);
    expect(sinAlcance.cobertura!.fraccion).toBe(0.5);
  });
});

describe("La etiqueta del botón dice qué le falta a la fila", () => {
  it("sin evaluación cargada ofrece agregarla", () => {
    const [m] = proyectar([materia({ evaluacion: null, diasHastaEvaluacion: null })]).materias;
    expect(m.etiqueta).toBe("Agregar examen");
  });

  it("con evaluación y sin datos para estimar, ofrece completar", () => {
    const [m] = proyectar([materia({ clases: [] })]).materias;
    expect(m.etiqueta).toBe("Completar");
  });

  it("con todo cargado, abre", () => {
    expect(proyectar([materia()]).materias[0].etiqueta).toBe("Abrir");
  });
});

describe("Sin materias no se inventa una fila", () => {
  it("devuelve la lista vacía, no una de ejemplo", () => {
    const r = proyectar([]);
    expect(r.materias).toEqual([]);
    expect(r.aclaracion).toBeNull();
  });
});

describe("El rótulo de la evaluación no repite lo que ya dijo", () => {
  it("con título, el tipo no se agrega: «Parcial 1 · parcial» diría dos veces lo mismo", () => {
    const [m] = proyectar([
      materia({
        evaluacion: { titulo: "Parcial 1", tipo: "parcial", modalidad: "practico", fecha: "2026-09-15" },
      }),
    ]).materias;
    expect(m.evaluacion).toBe("Parcial 1 · practico · mar 15 sept");
  });

  it("sin título, el tipo ocupa su lugar en vez de dejar la instancia sin nombre", () => {
    const [m] = proyectar([
      materia({ evaluacion: { titulo: null, tipo: "final", modalidad: "oral", fecha: "2026-09-15" } }),
    ]).materias;
    expect(m.evaluacion).toBe("final · oral · mar 15 sept");
  });

  it("sin modalidad declarada, se omite: no se inventa «escrito»", () => {
    const [m] = proyectar([
      materia({ evaluacion: { titulo: "Final", tipo: "final", modalidad: null, fecha: "2026-09-15" } }),
    ]).materias;
    expect(m.evaluacion).toBe("Final · mar 15 sept");
  });
});

describe("ADR-078 · el Gantt del período", () => {
  it("la ventana llega resuelta a fracciones: la pantalla no hace aritmética", () => {
    const [m] = proyectar([
      materia({ primeraClase: "2026-09-01", evaluacion: { titulo: "P", tipo: "parcial", modalidad: null, fecha: "2026-09-15" } }),
    ]).materias;
    expect(m.ventana).not.toBeNull();
    // Eje de 35 días desde el 25 de agosto: el 1 de septiembre es el día 7.
    expect(m.ventana!.desde).toBeCloseTo(7 / 35, 5);
    expect(m.ventana!.hasta).toBeCloseTo(21 / 35, 5);
    expect(m.ventana!.inicioDesconocido).toBe(false);
  });

  it("sin fecha de evaluación no hay ventana, y la fila igual existe", () => {
    const [m] = proyectar([
      materia({ evaluacion: null, diasHastaEvaluacion: null, primeraClase: "2026-09-01" }),
    ]).materias;
    expect(m.ventana).toBeNull();
    expect(m.nombre).toBe("Cálculo");
  });

  it("sin clases cargadas hay ventana, marcada como de inicio desconocido", () => {
    const [m] = proyectar([materia({ primeraClase: null })]).materias;
    expect(m.ventana!.inicioDesconocido).toBe(true);
    expect(m.ventana!.desde).toBe(0);
  });

  /**
   * ⚠️ **Falla de verdad.** Un eje por fila haría que dos barras de la misma
   * longitud representaran plazos distintos — que es exactamente lo que un Gantt
   * existe para impedir.
   */
  it("todas las materias comparten un eje: la misma fecha cae en el mismo lugar", () => {
    const r = proyectar([
      materia({ cursadaId: "a", nombre: "A", primeraClase: "2026-09-01", diasHastaEvaluacion: 7,
        evaluacion: { titulo: "P", tipo: "parcial", modalidad: null, fecha: "2026-09-15" } }),
      materia({ cursadaId: "b", nombre: "B", primeraClase: "2026-09-01", diasHastaEvaluacion: 60,
        evaluacion: { titulo: "F", tipo: "final", modalidad: null, fecha: "2026-11-07" } }),
    ]);
    const [a, b] = r.materias;
    expect(a.ventana!.desde).toBe(b.ventana!.desde);
    // Y el eje se estiró hasta el final lejano en vez de dejarlo fuera de cuadro.
    expect(b.ventana!.hasta).toBe(1);
    expect(a.ventana!.hasta).toBeLessThan(1);
  });

  it("el eje trae la marca de hoy entre las de semana", () => {
    const { eje } = proyectar([materia()]);
    const hoy = eje.marcas.find((m) => m.esHoy);
    expect(hoy?.etiqueta).toBe("hoy");
    expect(hoy?.posicion).toBeCloseTo(eje.hoy, 5);
    expect(eje.marcas.map((m) => m.etiqueta)).toEqual([
      "−2 sem", "−1 sem", "hoy", "+1 sem", "+2 sem", "+3 sem",
    ]);
  });

  it("un eje estirado gana marcas: las mismas cinco mentirían sobre la escala", () => {
    const { eje } = proyectar([
      materia({ evaluacion: { titulo: "F", tipo: "final", modalidad: null, fecha: "2026-11-07" } }),
    ]);
    expect(eje.marcas.length).toBeGreaterThan(6);
    expect(eje.marcas[eje.marcas.length - 1].etiqueta).toBe("+8 sem");
  });
});
