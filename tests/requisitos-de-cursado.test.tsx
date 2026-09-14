import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";

/**
 * **Los requisitos de cursado** — [ADR-108](../docs/decisions.md#adr-108).
 *
 * Dos cosas distintas se prueban acá. La **cuenta** —piden, venís, cuántas
 * quedan, a cuántas podés faltar— es del dominio y valdría igual con datos
 * reales. Los **insumos** son simulados, y lo que se prueba de ellos es que la
 * ficción no se escape: sólo con `MODO_PRUEBA=1`, rotulada y sobre una cursada
 * del estudiante.
 */
const LEER = (p: string) => readFileSync(resolve(process.cwd(), p), "utf8");

vi.mock("server-only", () => ({}));

const dominio = await import("@/lib/domain/requisitos-de-cursado");
const { requisitosSimulados, situacionSimulada, condicionesSimuladas } = await import(
  "@/lib/server/simulacion/requisitos"
);
const { RequisitosDeCursadoBoton, textosDeFila } = await import("@/components/screens/materia/requisitos");

const { evaluarAsistencia, evaluarParciales, evaluarTps, evaluarRequisitos, necesarias } = dominio;

describe("la cuenta de asistencia", () => {
  it("75 % de 10 clases son 8, redondeando para arriba", () => {
    expect(necesarias(10, 75)).toBe(8);
    expect(necesarias(16, 75)).toBe(12);
    expect(necesarias(20, 80)).toBe(16);
  });

  it("piden 80 %, venís 90 %, quedan 6: cuántas faltas te quedan", () => {
    // 16 clases, 10 dadas, 9 asistidas → necesitás 13; 9 + 6 − 13 = 2.
    const f = evaluarAsistencia("ASISTENCIA_PRACTICO", 80, { total: 16, dadas: 10, asistidas: 9 });
    expect(f).toMatchObject({ venis: 90, quedan: 6, faltasDisponibles: 2, estado: "CUMPLE" });
  });

  it("con una sola falta de margen está ajustado, aunque vengas por encima", () => {
    const f = evaluarAsistencia("ASISTENCIA_PRACTICO", 80, { total: 16, dadas: 10, asistidas: 8 });
    expect(f).toMatchObject({ venis: 80, faltasDisponibles: 1, estado: "AJUSTADO" });
  });

  it("por debajo del porcentaje pero todavía alcanzable es ajustado, no «no alcanza»", () => {
    const f = evaluarAsistencia("ASISTENCIA_TEORICO", 75, { total: 16, dadas: 8, asistidas: 5 });
    expect(f.estado).toBe("AJUSTADO");
  });

  it("si aunque vaya a todas no llega, no alcanza", () => {
    const f = evaluarAsistencia("ASISTENCIA_TEORICO", 75, { total: 16, dadas: 10, asistidas: 5 });
    expect(f).toMatchObject({ faltasDisponibles: -1, estado: "NO_ALCANZA" });
  });

  it("sin clases dadas no hay porcentaje: sin datos, no 0 %", () => {
    const f = evaluarAsistencia("ASISTENCIA_TEORICO", 75, { total: 16, dadas: 0, asistidas: 0 });
    expect(f).toMatchObject({ venis: null, estado: "SIN_DATOS" });
  });
});

describe("los parciales", () => {
  it("un parcial sin rendir es null, no un 0, y no baja el estado", () => {
    const f = evaluarParciales(7, [
      { nombre: "Parcial 1", nota: 8 },
      { nombre: "Parcial 2", nota: null },
    ]);
    expect(f.estado).toBe("CUMPLE");
  });

  it("uno debajo del mínimo no alcanza, y no se supone un recuperatorio", () => {
    const f = evaluarParciales(7, [{ nombre: "Parcial 1", nota: 6 }, { nombre: "Parcial 2", nota: null }]);
    expect(f.estado).toBe("NO_ALCANZA");
    expect(JSON.stringify(textosDeFila(f))).not.toMatch(/recuperatorio/i);
  });

  it("sin ninguno rendido, sin datos", () => {
    expect(evaluarParciales(4, [{ nombre: "Parcial 1", nota: null }]).estado).toBe("SIN_DATOS");
  });
});

describe("los trabajos prácticos", () => {
  it("al día si los vencidos alcanzan el porcentaje", () => {
    expect(evaluarTps(75, { total: 4, vencidos: 2, aprobados: 2 }).estado).toBe("CUMPLE");
  });

  it("atrasado pero todavía alcanzable es ajustado", () => {
    expect(evaluarTps(100, { total: 5, vencidos: 2, aprobados: 1 }).estado).toBe("NO_ALCANZA");
    expect(evaluarTps(75, { total: 4, vencidos: 2, aprobados: 1 }).estado).toBe("AJUSTADO");
  });

  it("sin vencidos, sin datos", () => {
    expect(evaluarTps(75, { total: 4, vencidos: 0, aprobados: 0 }).estado).toBe("SIN_DATOS");
  });
});

describe("los dos regímenes", () => {
  const SITUACION = {
    parciales: [{ nombre: "Parcial 1", nota: 6 }],
    tps: { total: 4, vencidos: 2, aprobados: 2 },
    teorico: { total: 16, dadas: 8, asistidas: 8 },
    practico: { total: 16, dadas: 8, asistidas: 8 },
  };
  const REGULAR = { notaMinima: 4, tpsAprobados: 75, asistenciaTeorico: 60, asistenciaPractico: 75 };

  it("la misma situación, evaluada contra lo que pide cada uno", () => {
    const r = evaluarRequisitos({ promocion: { ...REGULAR, notaMinima: 7 }, regular: REGULAR }, SITUACION);
    expect(r.regimenes.map((x) => x.regimen)).toEqual(["PROMOCION", "REGULAR"]);
    expect(r.regimenes[0].filas[0].estado).toBe("NO_ALCANZA");
    expect(r.regimenes[1].filas[0].estado).toBe("CUMPLE");
  });

  it("una materia sin promoción lo dice, en vez de omitirlo en silencio", () => {
    const r = evaluarRequisitos({ promocion: null, regular: REGULAR }, SITUACION);
    expect(r.sinPromocion).toBe(true);
    expect(r.regimenes.map((x) => x.regimen)).toEqual(["REGULAR"]);
  });

  it("no hay veredicto de la materia: ningún campo resume las filas", () => {
    const r = evaluarRequisitos({ promocion: null, regular: REGULAR }, SITUACION);
    expect(Object.keys(r).sort()).toEqual(["regimenes", "simulados", "sinPromocion"]);
  });
});

describe("la simulación", () => {
  it("es determinística y se declara simulada", () => {
    expect(requisitosSimulados("ce-1", 2)).toEqual(requisitosSimulados("ce-1", 2));
    expect(requisitosSimulados("ce-1", 2).simulados).toBe(true);
  });

  it("es coherente: nunca asiste a más clases de las dadas ni se dan más de las del período", () => {
    for (let i = 0; i < 200; i++) {
      const s = situacionSimulada(`ce-${i}`, i % 4);
      for (const a of [s.teorico, s.practico]) {
        expect(a.asistidas).toBeGreaterThanOrEqual(0);
        expect(a.asistidas).toBeLessThanOrEqual(a.dadas);
        expect(a.dadas).toBeLessThanOrEqual(a.total);
      }
      expect(s.tps.aprobados).toBeLessThanOrEqual(s.tps.vencidos);
      const c = condicionesSimuladas(`ce-${i}`);
      if (c.promocion) expect(c.promocion.notaMinima).toBeGreaterThan(c.regular.notaMinima);
    }
  });
});

describe("la ruta está apagada por defecto", () => {
  const RUTA = LEER("app/api/requisitos/route.ts");

  it("responde 404 sin MODO_PRUEBA, y el cerrojo va antes que el token", () => {
    expect(RUTA).toContain('process.env.MODO_PRUEBA !== "1"');
    expect(RUTA.indexOf("if (apagada())")).toBeLessThan(RUTA.indexOf("resolverSesion("));
  });

  it("va con la sesión del estudiante, nunca con secreto de servicio", () => {
    expect(RUTA).toContain("tokenDelHeader");
    expect(RUTA).not.toMatch(/secretoDeServicio|SERVICE_ROLE|x-service/i);
  });

  it("sólo sobre una cursada del estudiante", () => {
    const COMPOSICION = LEER("lib/server/composicion.ts");
    const cuerpo = COMPOSICION.slice(COMPOSICION.indexOf("export async function requisitosSimuladosDe"));
    expect(cuerpo.slice(0, 900)).toMatch(/materias\.some\(\(m\) => m\.cursadaId === cursadaId\)\) return null/);
  });

  it("y está escrita para borrarse cuando haya condiciones reales", () => {
    expect(RUTA).toMatch(/Esta ruta se borra/);
  });
});

describe("el panel", () => {
  const REQUISITOS = requisitosSimulados("ce-demo", 2);

  it("asistencia: piden, venís, cuántas quedan y a cuántas podés faltar", () => {
    const f = evaluarAsistencia("ASISTENCIA_PRACTICO", 80, { total: 16, dadas: 10, asistidas: 9 });
    expect(textosDeFila(f)).toEqual({
      titulo: "Asistencia al práctico",
      piden: "80%",
      venis: "90%",
      detalle: "Quedan 6 clases · podés faltar a 2 más",
    });
  });

  it("sin clases dadas no muestra un porcentaje", () => {
    const f = evaluarAsistencia("ASISTENCIA_TEORICO", 75, { total: 16, dadas: 0, asistidas: 0 });
    expect(textosDeFila(f).venis).not.toMatch(/\d/);
  });

  it("cerrado no muestra nada; abierto muestra el rótulo Simulado y los regímenes", () => {
    render(<RequisitosDeCursadoBoton requisitos={REQUISITOS} />);
    expect(screen.queryByRole("dialog")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: /Requisitos/ }));
    const panel = screen.getByRole("dialog", { name: "Requisitos de cursado" });
    expect(panel.textContent).toContain("Simulado");
    expect(panel.textContent).toContain("Regular");
    expect(panel.querySelectorAll("[data-requisito]").length).toBe(REQUISITOS.regimenes.length * 4);
    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("la materia lo pide aparte, sin useSuperficie, y no bajo ?escenario=", () => {
    const SUPERFICIE = LEER("components/superficies/materia.tsx");
    expect(SUPERFICIE).toContain("/api/requisitos?cursada=");
    expect(SUPERFICIE).toMatch(/useRequisitos\(props\.cursadaId, !!params\.get\("escenario"\)\)/);
  });
});
