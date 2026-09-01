import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { ctaIds, ctaRegistry, ctasVisibles, type CtaId } from "@/lib/navigation/cta-registry";
import { contextoVacio } from "@/lib/navigation/context";
import {
  alcanzablesDesde,
  aristas,
  aristasCanonicas,
  goldenPath,
  salidasDe,
} from "@/lib/navigation/golden-path";
import { nodoIds, nodos, superficieIds, type NodoId } from "@/lib/navigation/surfaces";
import { escenarioIds, escenarios } from "@/lib/fixtures";

const spec = readFileSync(resolve(process.cwd(), "docs/product-spec-source.md"), "utf8");

describe("Las nueve superficies", () => {
  it("son nueve, ni una más", () => {
    expect(superficieIds).toHaveLength(9);
  });

  it("no existe UX10", () => {
    expect(nodoIds).not.toContain("UX10");
  });

  it("respeta el mapeo canónico WF-S10 → UX08 y WF-S11 → UX09", () => {
    expect(nodos.UX08.wireframe).toBe("WF-S10");
    expect(nodos.UX09.wireframe).toBe("WF-S11");
  });

  it("cada superficie tiene URL propia, o declara qué etapa la construye (I-01)", () => {
    for (const id of superficieIds) {
      const nodo = nodos[id];
      const tieneUrl = nodo.ruta !== null;
      const estaPendiente = nodo.pendienteDeEtapa !== null;
      expect(tieneUrl !== estaPendiente, `${id}: o tiene ruta o está pendiente, nunca ambas ni ninguna`).toBe(true);
    }
  });

  it("los nodos que no son superficies nunca tienen ruta ni etapa pendiente", () => {
    for (const id of ["EJECUCION", "UX04_RENEGOCIACION"] as NodoId[]) {
      expect(nodos[id].ruta).toBeNull();
      expect(nodos[id].pendienteDeEtapa).toBeNull();
    }
  });
});

describe("Registro canónico de CTAs", () => {
  it("son exactamente 19, de CTA-001 a CTA-019", () => {
    // Eran 18 hasta el 1 de septiembre de 2026. `CTA-019` es la corrección
    // aprobada por ADR-016: el spec describía la entrada manual `UX02 → UX07` y
    // el registro no la tenía.
    expect(ctaIds).toHaveLength(19);
    for (let n = 1; n <= 19; n++) {
      expect(ctaIds).toContain(`CTA-${String(n).padStart(3, "0")}` as CtaId);
    }
  });

  it("la clave del registro coincide con el id", () => {
    for (const id of ctaIds) expect(ctaRegistry[id].id).toBe(id);
  });

  it("cada CTA declara los siete campos de contrato y el de trazabilidad", () => {
    for (const id of ctaIds) {
      const cta = ctaRegistry[id];
      expect(cta.origen.length, id).toBeGreaterThan(0);
      expect(cta.condicion.length, id).toBeGreaterThan(0);
      expect(cta.accionSolicitada.length, id).toBeGreaterThan(0);
      expect(cta.resultadoAutoritativo.length, id).toBeGreaterThan(0);
      expect(cta.fallback.descripcion.length, id).toBeGreaterThan(0);
      expect(cta.estadoError.length, id).toBeGreaterThan(0);
      expect(cta.escenarios.length, id).toBeGreaterThan(0);
    }
  });

  it("todo origen y todo destino es un nodo real del grafo", () => {
    for (const id of ctaIds) {
      const cta = ctaRegistry[id];
      for (const origen of cta.origen) expect(nodoIds, `${id} origen`).toContain(origen);
      if (cta.destino !== null) expect(nodoIds, `${id} destino`).toContain(cta.destino);
      if (cta.fallback.nodo !== null) expect(nodoIds, `${id} fallback`).toContain(cta.fallback.nodo);
    }
  });

  /**
   * `CTA-019` **no está en el spec, y no puede estarlo**: es la corrección que
   * ADR-016 aprobó, y `product-spec-source.md` no se edita (`AGENTS.md` §1.1).
   * Se la excluye acá y se la verifica contra el ADR en el test siguiente, que
   * es su fuente.
   */
  const CORRECCIONES: CtaId[] = ["CTA-019"];

  it("la condición y los escenarios de aceptación son los del spec", () => {
    // El spec es explícito: ningún otro artifact mantiene copia normativa.
    // Si alguien edita una condición acá y no en el spec, esto rompe.
    for (const id of ctaIds.filter((x) => !CORRECCIONES.includes(x))) {
      const cta = ctaRegistry[id];
      expect(spec, `${id} no está en el spec`).toContain(id);
      expect(spec, `la condición de ${id} no coincide con el spec`).toContain(cta.condicion);
      for (const sc of cta.escenarios) {
        expect(spec, `${id} cita ${sc}, que no está en el spec`).toContain(sc);
      }
    }
  });

  /**
   * Una fila que no viene del spec tiene que venir de algún lado. Si mañana
   * alguien agrega otra sin ADR, este test la caza.
   */
  it("toda CTA que no está en el spec la respalda un ADR aceptado", () => {
    const adrs = readFileSync(resolve(process.cwd(), "docs/decisions.md"), "utf8");
    for (const id of CORRECCIONES) {
      expect(ctaIds).toContain(id);
      expect(adrs, `${id} no aparece en decisions.md`).toContain(id);
      // Y el ADR que la introduce tiene que estar aceptado, no pendiente.
      const adr016 = adrs.slice(adrs.indexOf("## ADR-016"), adrs.indexOf("## ADR-017"));
      expect(adr016).toContain(id);
      expect(adr016).toContain("ACCEPTED");
    }
  });

  it("con el contexto vacío no aparece ninguna CTA: deny-by-default", () => {
    for (const nodo of nodoIds) {
      expect(ctasVisibles(nodo, contextoVacio), `${nodo}`).toEqual([]);
    }
  });
});

describe("Aparición y habilitación son cosas distintas", () => {
  it("una CTA que no aparece NO se devuelve: no está oculta ni deshabilitada, no está", () => {
    // FX-ADE-NONE: el ADE confirmó ausencia. CTA-002 no existe en esa pantalla.
    const ctx = escenarios["FX-ADE-NONE"].contextos.UX01!;
    const ids = ctasVisibles("UX01", ctx).map((c) => c.id);
    expect(ids).toContain("CTA-001");
    expect(ids).not.toContain("CTA-002");
  });

  it("CTA-007 aparece sin adjunto, pero deshabilitada", () => {
    // Aparición: hay una Evidence esperada. Habilitación: falta el contenido,
    // y el estudiante lo resuelve en esa misma pantalla.
    const ctx = escenarios["FX-EVD-BASE"].contextos.UX05!;
    const cta = ctaRegistry["CTA-007"];
    expect(cta.aparece(ctx)).toBe(true);
    expect(cta.habilitada(ctx)).toBe(false);
  });

  it("CTA-007 se habilita cuando el contenido es válido", () => {
    const ctx = escenarios["FX-REFL-OPT"].contextos.UX05!;
    expect(ctaRegistry["CTA-007"].aparece(ctx)).toBe(true);
    expect(ctaRegistry["CTA-007"].habilitada(ctx)).toBe(true);
  });

  it("CTA-017 se OCULTA cuando la elegibilidad no está: no se puede resolver desde ahí", () => {
    const elegible = escenarios["FX-REN-ELIGIBLE"].contextos.UX04!;
    const noElegible = escenarios["FX-REN-INELIGIBLE"].contextos.UX04!;
    expect(ctaRegistry["CTA-017"].aparece(elegible)).toBe(true);
    expect(ctaRegistry["CTA-017"].aparece(noElegible)).toBe(false);
  });

  it("un Commitment STARTED no ofrece renegociar: no hay edición retroactiva", () => {
    const ctx = escenarios["FX-LOCAL-DAY-IN-PROGRESS"].contextos.UX04!;
    expect(ctaRegistry["CTA-017"].aparece(ctx)).toBe(false);
  });

  it("un Commitment MISSED no ofrece renegociar, ofrece rescate", () => {
    const ctx = escenarios["FX-MISSED"].contextos.UX04!;
    expect(ctaRegistry["CTA-017"].aparece(ctx)).toBe(false);
    expect(ctaRegistry["CTA-015"].aparece(ctx)).toBe(true);
  });

  it("sin operación idempotente no se ofrece reintentar", () => {
    const conError = escenarios["FX-ERROR-IDEM"].contextos.UX04!;
    const sinError = escenarios["FX-DAY-BASE"].contextos.UX04!;
    expect(ctaRegistry["CTA-014"].aparece(conError)).toBe(true);
    expect(ctaRegistry["CTA-014"].aparece(sinError)).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────────────────

/** Las CTAs cuya superficie de origen todavía no existe, con su etapa. */
/**
 * CTAs cuya **superficie de origen** todavía no existe.
 *
 * Se vació en la Etapa 0.5: `CTA-011` salió en la 0.4 (`UX07`), y `CTA-012` y
 * `CTA-013` en la 0.5 (`UX08`). Las tres nacen en superficies que ya existen.
 *
 * No confundir con tener el **destino** pendiente: `CTA-012` abre `UX09`, que
 * llega en la 0.6, pero eso no impide que aparezca ni que sea alcanzable. Ese
 * otro hueco lo cubre el test de destinos sin ruta, más abajo.
 */
const bloqueadasPorEtapa: Readonly<Record<string, string>> = {};

function alcanzaAlgunEscenario(id: CtaId): boolean {
  const cta = ctaRegistry[id];
  return escenarioIds.some((escId) =>
    cta.origen.some((nodo) => {
      const ctx = escenarios[escId].contextos[nodo];
      return ctx !== undefined && cta.aparece(ctx);
    }),
  );
}

describe("Alcance: toda CTA tiene un escenario que la alcanza", () => {
  const exigibles = ctaIds.filter((id) => !(id in bloqueadasPorEtapa));

  it("las 19 CTAs son exigibles: ninguna superficie de origen falta ya", () => {
    expect(exigibles).toHaveLength(19);
    expect(Object.keys(bloqueadasPorEtapa)).toHaveLength(0);
  });

  for (const id of ctaIds.filter((x) => !(x in bloqueadasPorEtapa))) {
    it(`${id} es alcanzable desde el catálogo`, () => {
      expect(alcanzaAlgunEscenario(id)).toBe(true);
    });
  }

  /**
   * El guard que impide que la brecha se quede en silencio.
   *
   * Una CTA está bloqueada por etapa **sólo** mientras su superficie de origen
   * no exista. En cuanto la 0.4 le dé ruta a UX07, `CTA-011` deja de estar
   * justificada y este test rompe hasta que se la cablee y se la saque de la
   * lista.
   */
  it("una CTA bloqueada por etapa lo está porque su superficie NO existe todavía", () => {
    for (const [id, etapa] of Object.entries(bloqueadasPorEtapa)) {
      const cta = ctaRegistry[id as CtaId];
      const superficiesPendientes = cta.origen.filter((n) => nodos[n].pendienteDeEtapa !== null);
      expect(superficiesPendientes.length, `${id} ya no tiene superficie pendiente: cableala y sacala de la lista`).toBeGreaterThan(0);
      expect(cta.origen.some((n) => nodos[n].pendienteDeEtapa === etapa), `${id} debía estar bloqueada por la etapa ${etapa}`).toBe(true);
    }
  });

  it("ninguna CTA exigible está de más en la lista de bloqueadas", () => {
    for (const id of exigibles) {
      expect(Object.keys(bloqueadasPorEtapa)).not.toContain(id);
    }
  });

  /**
   * Una CTA puede ser alcanzable y aun así no navegar, porque su **destino**
   * todavía no tiene pantalla. Fijar la lista hace que aparezca una nueva sin
   * que nadie lo note, y que ésta se saque cuando la 0.6 construya `UX09`.
   */
  it("las CTAs cuyo destino todavía no tiene ruta son exactamente las esperadas", () => {
    const sinRuta = ctaIds.filter((id) => {
      const destino = ctaRegistry[id].destino;
      return destino !== null && nodos[destino].pendienteDeEtapa !== null;
    });
    // Se vació en la Etapa 0.6, con UX09. Las nueve superficies existen y
    // todos los destinos del registro tienen pantalla.
    expect(sinRuta).toEqual([]);
  });
});

describe("El grafo del Golden Path", () => {
  it("toda arista canónica está respaldada por una CTA", () => {
    for (const arista of aristasCanonicas) {
      expect(arista.cta, `${arista.desde} → ${arista.hasta}`).not.toBeNull();
    }
  });

  it("toda arista va de un nodo real a un nodo real", () => {
    for (const a of aristas) {
      expect(nodoIds, `desde ${a.desde}`).toContain(a.desde);
      expect(nodoIds, `hasta ${a.hasta}`).toContain(a.hasta);
    }
  });

  it("ninguna arista es un bucle sobre sí misma", () => {
    for (const a of aristas) {
      expect(a.desde, `${a.cta ?? "transversal"}`).not.toBe(a.hasta);
    }
  });

  it("el Golden Path del loop diario es recorrible extremo a extremo", () => {
    for (let i = 0; i < goldenPath.length - 1; i++) {
      const desde = goldenPath[i];
      const hasta = goldenPath[i + 1];
      const hay = salidasDe(desde, "canonica").some((a) => a.hasta === hasta);
      expect(hay, `falta la transición canónica ${desde} → ${hasta}`).toBe(true);
    }
  });

  it("desde UX01 se alcanzan todas las superficies del loop diario", () => {
    const alcanzables = alcanzablesDesde("UX01");
    for (const nodo of goldenPath) expect(alcanzables, `${nodo}`).toContain(nodo);
  });

  it("todo nodo tiene al menos una salida: ninguno es un callejón sin salida", () => {
    for (const nodo of nodoIds) {
      expect(salidasDe(nodo).length, `${nodo} no tiene salida`).toBeGreaterThan(0);
    }
  });

  /**
   * "Retorno seguro" no significa que todo nodo tenga una arista de vuelta.
   * Significa que **nunca se queda encerrado**, y el spec admite dos formas:
   * volver a otro nodo, o permanecer donde se está.
   *
   * `EJECUCION` es el segundo caso: su único fallback declarado es *"mantener
   * ejecución"*. El spec **no define** una salida de la ejecución que no sea
   * terminarla, y agregar una acá sería inventar una transición — además de
   * chocar con que la navegación no muta estado de dominio.
   */
  it("todo nodo tiene retorno seguro, o su fallback declarado es permanecer", () => {
    for (const nodo of nodoIds) {
      if (nodo === "UX01") continue; // UX01 es el destino del retorno, no su origen

      if (salidasDe(nodo, "retornoSeguro").length > 0) continue;

      // Sin arista de retorno: entonces toda CTA que nace acá tiene que
      // declarar un fallback de permanencia. Si alguna declarara un destino
      // distinto y aun así no hubiera arista, sería un agujero real.
      const ctasDelNodo = ctaIds.map((id) => ctaRegistry[id]).filter((c) => c.origen.includes(nodo));
      expect(ctasDelNodo.length, `${nodo} no tiene retorno ni CTAs`).toBeGreaterThan(0);
      for (const cta of ctasDelNodo) {
        const permanece = cta.fallback.nodo === null || cta.fallback.nodo === nodo;
        expect(permanece, `${nodo}/${cta.id} no tiene retorno y su fallback tampoco permanece`).toBe(true);
      }
    }
  });

  it("los nodos sin arista de retorno son exactamente los que el spec deja así", () => {
    // Fijar la lista es lo que hace que aparezca uno nuevo sin que nadie lo note.
    const sinRetorno = nodoIds.filter(
      (n) => n !== "UX01" && salidasDe(n, "retornoSeguro").length === 0,
    );
    expect(sinRetorno).toEqual(["EJECUCION"]);
  });

  it("desde cualquier nodo se puede volver a UX01", () => {
    for (const nodo of nodoIds) {
      expect(alcanzablesDesde(nodo), `${nodo} no vuelve a UX01`).toContain("UX01");
    }
  });
});
