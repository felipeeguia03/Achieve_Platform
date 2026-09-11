import { describe, expect, it } from "vitest";

import { nombreDeObjeto } from "@/lib/domain/nombre-de-objeto";

/**
 * Cómo se escribe el nombre de un objeto en pantalla — ADR-088, Enmienda 5.
 *
 * ⚠️ **Los casos salen de las etiquetas reales del Plan 2016**, no de ejemplos
 * inventados: los números romanos, las abreviaturas con punto y los diez nombres
 * cortados son lo que efectivamente hay en la base, y son justo lo que un
 * `toLowerCase()` rompe.
 */
describe("nombreDeObjeto — presentación, no renombre", () => {
  it("baja las mayúsculas y deja sólo la primera", () => {
    expect(nombreDeObjeto("ARQUITECTURA COMPUTADORAS")).toBe("Arquitectura computadoras");
    expect(nombreDeObjeto("SISTEMAS OPERATIVOS")).toBe("Sistemas operativos");
    expect(nombreDeObjeto("PENSAMIENTO SOCIAL CRISTIANO")).toBe("Pensamiento social cristiano");
  });

  /**
   * ⚠️ **El ordinal es lo único que distingue una materia de la otra.** Hay tres
   * series en el plan; `Analisis matematico i` convierte el ordinal en una letra
   * suelta que se lee como un error de tipeo.
   */
  it("conserva los números romanos en mayúscula", () => {
    expect(nombreDeObjeto("ANALISIS MATEMATICO I")).toBe("Analisis matematico I");
    expect(nombreDeObjeto("ANALISIS MATEMATICO II")).toBe("Analisis matematico II");
    expect(nombreDeObjeto("ANALISIS MATEMATICO III")).toBe("Analisis matematico III");
    expect(nombreDeObjeto("BASES DE DATOS II")).toBe("Bases de datos II");
    expect(nombreDeObjeto("REDES TELEINFORMATICAS I")).toBe("Redes teleinformaticas I");
  });

  it("no toca las abreviaturas con punto: adivinar qué decían sería inventar", () => {
    expect(nombreDeObjeto("ORGANIZ. Y ADMIN. DE EMPRESAS")).toBe("Organiz. y admin. de empresas");
    expect(nombreDeObjeto("SEGUR. Y AUDITOR. INFORMATICA")).toBe("Segur. y auditor. informatica");
  });

  /** `CLAUDE.md`: *"los diez nombres cortados siguen cortados"*. */
  it("los nombres cortados siguen cortados", () => {
    expect(nombreDeObjeto("FUNDAMENTOS DE PROGRAMACIO…")).toBe("Fundamentos de programacio…");
    expect(nombreDeObjeto("LABORATORIO DE COMPUTACION (…")).toBe("Laboratorio de computacion (…");
  });

  /**
   * ⚠️ **No repone acentos, y es `omitir, no inventar`.** La fuente oficial dice
   * `ANALISIS`. Ponerle la tilde acá sería corregir el dato en la capa de dibujo,
   * donde nadie lo puede auditar; el arreglo de verdad es un backfill con su
   * procedencia.
   */
  it("no repone acentos que la fuente no tiene", () => {
    expect(nombreDeObjeto("ANTROPOLOGIA")).toBe("Antropologia");
    expect(nombreDeObjeto("ETICA Y DEONTOLOGIA PROFESION…")).toBe("Etica y deontologia profesion…");
  });

  /**
   * ⚠️ **La regla es angosta: sólo toca lo que está TODO en mayúsculas.** Romper
   * un nombre bien escrito para arreglar uno mal escrito sería un mal negocio, y
   * el mundo sintético tiene los suyos bien escritos.
   */
  it("no toca un nombre que ya está bien escrito", () => {
    expect(nombreDeObjeto("Cálculo Avanzado")).toBe("Cálculo Avanzado");
    expect(nombreDeObjeto("Arquitectura de Software")).toBe("Arquitectura de Software");
    expect(nombreDeObjeto("Unidad 2")).toBe("Unidad 2");
  });

  it("un nombre vacío se devuelve tal cual: no hay nada que capitalizar", () => {
    expect(nombreDeObjeto("")).toBe("");
  });

  /** Idempotente: aplicarlo dos veces no sigue comiéndose mayúsculas. */
  it("aplicarlo dos veces da lo mismo que una", () => {
    for (const n of ["ARQUITECTURA COMPUTADORAS", "ANALISIS MATEMATICO II", "Cálculo Avanzado"]) {
      expect(nombreDeObjeto(nombreDeObjeto(n))).toBe(nombreDeObjeto(n));
    }
  });
});
