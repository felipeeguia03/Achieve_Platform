import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  recorridoFocusGroup,
  siguienteEstacion,
  siguienteUrl,
  urlDe,
  INICIO_DEL_RECORRIDO,
} from "@/lib/navigation/focus-group";
import { ctaIds, ctaRegistry } from "@/lib/navigation/cta-registry";
import { nodos, superficieIds } from "@/lib/navigation/surfaces";
import { escenarios, escenarioIds } from "@/lib/fixtures";

const guionCrudo = readFileSync(resolve(process.cwd(), "docs/guion-focus-group.md"), "utf8");
/** El markdown envuelve líneas a 100 columnas: se normaliza para buscar frases. */
const guion = guionCrudo.replace(/\s+/g, " ");

describe("El recorrido cubre las nueve superficies", () => {
  it("todas las superficies aparecen como estación", () => {
    const visitadas = new Set(recorridoFocusGroup.map((e) => e.nodo));
    for (const id of superficieIds) expect(visitadas, id).toContain(id);
  });

  it("arranca en UX01", () => {
    expect(recorridoFocusGroup[0].nodo).toBe("UX01");
    expect(recorridoFocusGroup[0].ruta).toBe(INICIO_DEL_RECORRIDO);
    expect(recorridoFocusGroup[0].llegada.tipo).toBe("inicio");
  });

  it("sólo la primera estación es un inicio", () => {
    const inicios = recorridoFocusGroup.filter((e) => e.llegada.tipo === "inicio");
    expect(inicios).toHaveLength(1);
  });

  it("toda estación apunta a una ruta que existe en el grafo", () => {
    for (const e of recorridoFocusGroup) {
      expect(nodos[e.nodo].ruta, `${e.nodo}`).toBe(e.ruta);
    }
  });

  it("todo escenario declarado existe en el catálogo y proyecta su vista", () => {
    for (const e of recorridoFocusGroup) {
      if (e.escenario === null) continue;
      expect(escenarioIds, e.escenario).toContain(e.escenario);
    }
  });
});

describe("Cada paso está respaldado, o dice que no lo está", () => {
  it("toda CTA citada existe en el registro canónico", () => {
    for (const e of recorridoFocusGroup) {
      if (e.llegada.tipo !== "cta") continue;
      expect(ctaIds, `${e.nodo}`).toContain(e.llegada.cta);
    }
  });

  it("la CTA citada nace en la estación anterior", () => {
    for (let i = 1; i < recorridoFocusGroup.length; i++) {
      const e = recorridoFocusGroup[i];
      if (e.llegada.tipo !== "cta") continue;
      const anterior = recorridoFocusGroup[i - 1];
      expect(
        ctaRegistry[e.llegada.cta].origen,
        `${e.llegada.cta} debería nacer en ${anterior.nodo}`,
      ).toContain(anterior.nodo);
    }
  });

  it("un paso que atraviesa nodos sin pantalla lo declara", () => {
    // UX04 → ejecución → UX05: `ejecución` no tiene superficie, y el recorrido
    // lo dice en vez de simular una transición directa.
    const conTravesia = recorridoFocusGroup.filter(
      (e) => e.llegada.tipo === "cta" && e.llegada.atraviesa !== undefined,
    );
    expect(conTravesia).toHaveLength(1);
    const paso = conTravesia[0];
    expect(paso.nodo).toBe("UX05");
    if (paso.llegada.tipo !== "cta") throw new Error("tipo inesperado");
    for (const nodo of paso.llegada.atraviesa!) {
      expect(nodos[nodo].ruta, `${nodo} no debería tener pantalla`).toBeNull();
    }
  });

  it("un paso sin CTA que lo respalde queda marcado como del facilitador", () => {
    const delFacilitador = recorridoFocusGroup.filter((e) => e.llegada.tipo === "facilitador");
    expect(delFacilitador).toHaveLength(1);
    expect(delFacilitador[0].nodo).toBe("UX07");
  });

  it("no se inventó ninguna CTA para tapar el hueco de UX07", () => {
    // El registro canónico sigue teniendo 18, y ninguna llega a UX07.
    expect(ctaIds).toHaveLength(18);
    const lleganAUX07 = ctaIds.filter((id) => ctaRegistry[id].destino === "UX07");
    expect(lleganAUX07).toEqual([]);
  });
});

describe("La cadena se recorre entera", () => {
  it("cada estación menos la última tiene siguiente", () => {
    for (let i = 0; i < recorridoFocusGroup.length - 1; i++) {
      const e = recorridoFocusGroup[i];
      expect(siguienteEstacion(e.ruta, e.escenario), `${e.ruta}`).not.toBeNull();
    }
  });

  it("la última no tiene siguiente", () => {
    const ultima = recorridoFocusGroup[recorridoFocusGroup.length - 1];
    expect(siguienteEstacion(ultima.ruta, ultima.escenario)).toBeNull();
  });

  it("las dos paradas en /compromiso se distinguen por escenario", () => {
    const enCompromiso = recorridoFocusGroup.filter((e) => e.ruta === "/compromiso");
    expect(enCompromiso).toHaveLength(2);
    expect(enCompromiso[0].escenario).not.toBe(enCompromiso[1].escenario);
    expect(siguienteUrl("/compromiso", null)).not.toBe(
      siguienteUrl("/compromiso", "FX-LOCAL-COM-DUE"),
    );
  });

  it("una ruta fuera del recorrido no devuelve siguiente", () => {
    expect(siguienteUrl("/inexistente", null)).toBeNull();
  });

  it("ninguna CTA encadena hacia la estación del facilitador", () => {
    // Encadenarla sería crear en los hechos la CTA-019 que ADR-016 deja sin
    // decidir: el botón de UX02 llevaría a UX07 sin contrato que lo respalde.
    for (let i = 0; i < recorridoFocusGroup.length - 1; i++) {
      const actual = recorridoFocusGroup[i];
      const siguiente = recorridoFocusGroup[i + 1];
      if (siguiente.llegada.tipo !== "facilitador") continue;
      expect(
        siguienteUrl(actual.ruta, actual.escenario),
        `${actual.ruta} no debe encadenar a ${siguiente.nodo}`,
      ).toBeNull();
    }
  });

  it("la estación del facilitador sí encadena hacia adelante", () => {
    // El hueco es para llegar a UX07, no para salir de ahí: CTA-011 existe.
    const facilitador = recorridoFocusGroup.find((e) => e.llegada.tipo === "facilitador")!;
    expect(siguienteUrl(facilitador.ruta, facilitador.escenario)).not.toBeNull();
  });

  it("la URL de una estación lleva su escenario sólo cuando lo tiene", () => {
    expect(urlDe(recorridoFocusGroup[0])).toBe("/hoy");
    const conEscenario = recorridoFocusGroup.find((e) => e.escenario !== null)!;
    expect(urlDe(conEscenario)).toContain("?escenario=");
  });
});

describe("Ninguna CTA del recorrido dice una cosa y lleva a otra", () => {
  /**
   * El recorrido encadena la CTA principal de cada estación. Si el escenario
   * elegido para una estación tiene una CTA de retorno, el botón diría
   * "volver" y llevaría hacia adelante.
   */
  const verbosDeRetorno = /^(VOLVER|Ver materias|VOLVER AL OVERVIEW|VOLVER A CURSADO)/i;

  function ctaDeLaEstacion(e: (typeof recorridoFocusGroup)[number]): string | null {
    const esc = escenarios[(e.escenario ?? "") as keyof typeof escenarios];
    if (esc === undefined) return null; // usa el default de la ruta
    const vista = esc.ux08 ?? esc.ux09 ?? esc.ux07 ?? esc.compromiso ?? esc.evidencia;
    return vista?.ctaPrimaria?.texto ?? null;
  }

  it("ninguna estación que avanza usa un verbo de retorno", () => {
    for (let i = 0; i < recorridoFocusGroup.length - 1; i++) {
      const actual = recorridoFocusGroup[i];
      const siguiente = recorridoFocusGroup[i + 1];
      if (siguiente.llegada.tipo === "facilitador") continue;
      const texto = ctaDeLaEstacion(actual);
      if (texto === null) continue;
      expect(verbosDeRetorno.test(texto), `${actual.ruta} avanza con "${texto}"`).toBe(false);
    }
  });
});

describe("El guion del facilitador", () => {
  it("tiene una sección por estación del recorrido", () => {
    for (const e of recorridoFocusGroup) {
      if (e.llegada.tipo === "cta" && e.ruta === "/compromiso" && e.escenario !== null) continue;
      expect(guion, `falta ${e.nodo} en el guion`).toContain(e.nodo);
    }
  });

  it("declara el criterio de PASS de cada test", () => {
    const pass = guion.match(/\*\*PASS:\*\*/g) ?? [];
    expect(pass.length).toBeGreaterThanOrEqual(8);
  });

  it("dice de frente las dos costuras del recorrido", () => {
    expect(guion).toContain("`ejecución` no tiene pantalla");
    expect(guion).toContain("ADR-016");
    expect(guion).toContain("navegación del facilitador");
  });

  it("declara el reset y por qué es determinista", () => {
    expect(guion).toContain("Recargar `/hoy`");
    expect(guion).toContain("no persiste nada");
  });

  it("prohíbe explicar durante el test", () => {
    expect(guion).toContain("No explicar.");
  });

  it("declara qué NO cubre, en vez de dejarlo implícito", () => {
    expect(guion).toContain("Lo que este guion no cubre");
    expect(guion).toContain("lector de pantalla");
  });

  it("recuerda que ninguna recomendación de la sesión es real", () => {
    expect(guion).toContain("ninguna recomendación de esta sesión es real");
  });
});

describe("El recorrido no usa datos reales", () => {
  it("los escenarios que toca son todos sintéticos", () => {
    for (const e of recorridoFocusGroup) {
      if (e.escenario === null) continue;
      const serializado = JSON.stringify(escenarios[e.escenario as keyof typeof escenarios]);
      expect(serializado).not.toMatch(/[\w.+-]+@[\w-]+\.[a-z]{2,}/i);
      expect(serializado).not.toMatch(/https?:\/\//i);
    }
  });
});
