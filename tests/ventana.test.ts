import { describe, expect, it } from "vitest";
import {
  ejeDelPeriodo,
  posicionEnEje,
  REGLA_DE_VENTANA,
  ventanaDe,
} from "@/lib/domain/ventana";

const HOY = "2026-09-08";
const BORDE = "2026-08-25";

describe("ADR-078 · sin fecha de evaluación no hay ventana", () => {
  /**
   * ⚠️ **Falla de verdad.** Si la ventana se completara hasta el borde del eje,
   * el estudiante vería una barra con un rombo al final: un examen en una fecha
   * que nadie declaró.
   */
  it("no se dibuja una barra hasta el borde: eso inventaría un plazo", () => {
    const v = ventanaDe({ primeraClase: "2026-08-04", fechaDeEvaluacion: null }, BORDE);
    expect(v.estado).toBe("SIN_VENTANA");
    expect(v.estado === "SIN_VENTANA" && v.motivo).toBe("sin_fecha_de_evaluacion");
  });

  it("tampoco cuando faltan las dos puntas", () => {
    expect(ventanaDe({ primeraClase: null, fechaDeEvaluacion: null }, BORDE).estado).toBe(
      "SIN_VENTANA",
    );
  });
});

describe("Sin primera clase hay plazo, y se dice que el inicio no se sabe", () => {
  it("arranca en el borde, marcado como desconocido", () => {
    const v = ventanaDe({ primeraClase: null, fechaDeEvaluacion: "2026-09-20" }, BORDE);
    expect(v).toEqual({
      estado: "OK",
      inicio: BORDE,
      fin: "2026-09-20",
      inicioDesconocido: true,
      regla: REGLA_DE_VENTANA,
    });
  });

  /**
   * ⚠️ **Falla de verdad.** Sin la marca, una materia sin clases cargadas y una
   * que empezó justo en el borde del eje se dibujarían idénticas — y son
   * ausencias distintas: una no tiene el dato, la otra sí.
   */
  it("con primera clase, el inicio NO queda marcado como desconocido", () => {
    const v = ventanaDe({ primeraClase: BORDE, fechaDeEvaluacion: "2026-09-20" }, BORDE);
    expect(v.estado === "OK" && v.inicioDesconocido).toBe(false);
  });
});

describe("El eje no deja una evaluación fuera de cuadro", () => {
  it("con todo cerca, mide las cinco semanas del mockup", () => {
    expect(ejeDelPeriodo(HOY, ["2026-09-15"]).dias).toBe(35);
  });

  /**
   * ⚠️ **Falla de verdad.** Con un techo fijo de `+3 semanas`, un final a 60
   * días quedaría fuera del cuadro: el estudiante vería la materia sin rombo y
   * sin forma de saber cuándo rinde.
   */
  it("una evaluación más lejana ESTIRA el eje en vez de quedar afuera", () => {
    const eje = ejeDelPeriodo(HOY, ["2026-09-15", "2026-11-07"]);
    expect(eje.hasta).toBe("2026-11-07");
    expect(posicionEnEje("2026-11-07", eje)).toBe(1);
  });

  it("sin ninguna evaluación con fecha, el eje sigue existiendo", () => {
    expect(ejeDelPeriodo(HOY, []).dias).toBe(35);
  });
});

describe("El recorte es de dibujo, y no toca el dato", () => {
  it("una primera clase anterior al eje se pega al borde, no se sale", () => {
    const eje = ejeDelPeriodo(HOY, ["2026-09-15"]);
    expect(posicionEnEje("2026-03-01", eje)).toBe(0);
  });

  it("hoy cae donde corresponde: dos de cinco semanas", () => {
    const eje = ejeDelPeriodo(HOY, ["2026-09-15"]);
    expect(posicionEnEje(HOY, eje)).toBeCloseTo(14 / 35, 5);
  });

  /**
   * Una primera clase posterior a la evaluación es un dato contradictorio —una
   * carga mal hecha—. **No se corrige acá**: colapsarla a un punto escondería el
   * problema, y este módulo describe hechos.
   */
  it("una ventana invertida se devuelve invertida, no arreglada", () => {
    const v = ventanaDe({ primeraClase: "2026-10-01", fechaDeEvaluacion: "2026-09-15" }, BORDE);
    expect(v.estado === "OK" && v.inicio).toBe("2026-10-01");
    expect(v.estado === "OK" && v.fin).toBe("2026-09-15");
  });
});

describe("La regla viaja con su versión", () => {
  it("toda ventana lleva `ventana-v1`", () => {
    expect(ventanaDe({ primeraClase: null, fechaDeEvaluacion: null }, BORDE).regla).toBe(
      REGLA_DE_VENTANA,
    );
    expect(ventanaDe({ primeraClase: BORDE, fechaDeEvaluacion: HOY }, BORDE).regla).toBe(
      REGLA_DE_VENTANA,
    );
  });
});
