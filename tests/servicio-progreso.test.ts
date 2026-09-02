import { readdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it, vi } from "vitest";

import type { PublicadorDeEventos } from "@/lib/server/servicios/eventos";
import {
  DIMENSIONES,
  nombreDelEvento,
  registrarProgreso,
  validar,
  type RepositorioDeProgreso,
  type ResultadoDeProgresoEntrante,
} from "@/lib/server/servicios/progreso";

/**
 * Etapa B3.1 — el resultado de progreso se escribe, y nadie lo infiere.
 *
 * Lo que más se prueba acá es lo que el Service **se niega a hacer**. La
 * tentación es fuerte y el dato está a mano: la Evidence ya dice `VALIDATED`.
 */

const BASE: ResultadoDeProgresoEntrante = {
  institutionId: "inst-A",
  courseEnrollmentId: "ce-1",
  topicId: "topic-1",
  tipo: "progress_updated",
  cambios: [{ dimension: "practice", valor: 19, texto: "19 ejercicios" }],
};

function repoFalso(duplicado = false) {
  const escrituras: ResultadoDeProgresoEntrante[] = [];
  const repo: RepositorioDeProgreso = {
    async registrar(entrada) {
      escrituras.push(entrada);
      return { entryId: "entry-1", duplicado };
    },
  };
  const publicar = vi.fn<PublicadorDeEventos["publicar"]>(async () => {});
  return { deps: { repo, eventos: { publicar } }, escrituras, publicar };
}

describe("B3.1 · una entrada tiene que afirmar algo (I10)", () => {
  it("sin cambios y sin no-cambio declarado, se rechaza", () => {
    expect(validar({ ...BASE, cambios: [] })).toEqual({ estado: "NO_AFIRMA_NADA" });
  });

  it("y no llega a tocar la base", async () => {
    const { deps, escrituras, publicar } = repoFalso();
    const r = await registrarProgreso(deps, { ...BASE, cambios: [] });
    expect(r.estado).toBe("NO_AFIRMA_NADA");
    expect(escrituras).toHaveLength(0);
    expect(publicar).not.toHaveBeenCalled();
  });

  it("cambios y no-cambio a la vez se contradicen", () => {
    expect(validar({ ...BASE, noCambioExplicito: true })).toEqual({ estado: "SE_CONTRADICE" });
  });

  it("un no-cambio declarado sí es una afirmación válida", () => {
    expect(validar({ ...BASE, cambios: [], noCambioExplicito: true })).toBeNull();
  });

  it("una razón de no-cambio sin no-cambio explica algo que no pasó", () => {
    expect(validar({ ...BASE, razonDeNoCambio: "no alcanzó" })).toEqual({
      estado: "RAZON_SIN_NO_CAMBIO",
    });
  });
});

describe("B3.1 · el vocabulario de dimensiones es cerrado", () => {
  it("son las cinco del modelo, y ninguna más", () => {
    expect([...DIMENSIONES]).toEqual(["exposure", "practice", "domain", "confidence", "recency"]);
  });

  it("una dimensión inventada se rechaza antes de la base", () => {
    const r = validar({
      ...BASE,
      // @ts-expect-error: es justamente lo que el test verifica
      cambios: [{ dimension: "motivacion", valor: 1 }],
    });
    expect(r).toEqual({ estado: "DIMENSION_DESCONOCIDA", dimension: "motivacion" });
  });
});

describe("B3.1 · el hecho se nombra por lo que es", () => {
  it("con dimensiones cambiadas, `ProgressUpdated`", () => {
    expect(nombreDelEvento(BASE)).toBe("ProgressUpdated");
  });

  it("un no-cambio NO se llama `Updated`", () => {
    const noCambio = { ...BASE, cambios: [], noCambioExplicito: true };
    expect(nombreDelEvento(noCambio)).toBe("ProgressNoChangeConfirmed");
    expect(nombreDelEvento(noCambio)).not.toContain("Updated");
  });
});

describe("B3.1 · idempotencia (I8)", () => {
  it("un reintento no vuelve a publicar el hecho", async () => {
    // La entrada ya existía: se devuelve la misma y **no** se emite otro evento.
    // Dos eventos harían que la Bitácora muestre dos avances donde hubo uno.
    const { deps, publicar } = repoFalso(true);
    const r = await registrarProgreso(deps, { ...BASE, idempotencyKey: "k-1" });
    expect(r).toEqual({ estado: "OK", entryId: "entry-1", duplicado: true });
    expect(publicar).not.toHaveBeenCalled();
  });

  it("la primera vez sí lo publica, con la causa que trajo el owner", async () => {
    const { deps, publicar } = repoFalso();
    await registrarProgreso(deps, BASE);
    expect(publicar).toHaveBeenCalledOnce();
    expect(publicar.mock.calls[0][0]).toMatchObject({
      nombre: "ProgressUpdated",
      sujetoTipo: "progress_entry",
      causa: "progress_updated",
    });
  });
});

describe("B3.1 · el Service no formatea ni infiere", () => {
  it("el texto del owner viaja tal cual, y el número también", async () => {
    const { deps, escrituras } = repoFalso();
    await registrarProgreso(deps, BASE);
    expect(escrituras[0].cambios[0]).toEqual({
      dimension: "practice",
      valor: 19,
      texto: "19 ejercicios",
    });
  });

  it("una dimensión sin texto se guarda igual: qué se muestra lo decide la proyección", async () => {
    // `C01-019` no está cerrado. El Service no inventa la unidad ni omite el
    // dato: lo guarda, y `UX06` muestra "cambió".
    const { deps, escrituras } = repoFalso();
    await registrarProgreso(deps, { ...BASE, cambios: [{ dimension: "domain", valor: 3 }] });
    expect(escrituras[0].cambios[0]).toEqual({ dimension: "domain", valor: 3 });
  });
});

describe("B3.1 · nada deriva progreso de una Evidence", () => {
  /**
   * **El invariante central del producto, con guard estático.**
   *
   * *Enviar no es suficiencia, suficiencia no es validación, validación no es
   * dominio.* `VALIDATED` no produce un `ProgressUpdated` por sí solo, y el
   * error es barato de cometer: la Evidence ya dice `VALIDATED` y escribir la
   * fila de progreso ahí mismo parece "cerrar el ciclo". Una convención en un
   * comentario no alcanza — la próxima persona que cierre el ciclo no lo va a
   * leer.
   */
  const LEER = (p: string) => readFileSync(resolve(process.cwd(), p), "utf8");

  const CAMINOS_DE_EVIDENCIA = [
    "lib/server/servicios/evidencia.ts",
    "lib/server/repositorios/evidencia-lectura.ts",
    "app/api/evidencia/route.ts",
    "supabase/migrations/20260831040000_estado_de_evidencia.sql",
  ];

  it("ningún camino de Evidence escribe progreso", () => {
    for (const archivo of CAMINOS_DE_EVIDENCIA) {
      const src = LEER(archivo);
      expect(src, `${archivo} escribe progreso`).not.toMatch(/registrarProgreso|registrar_progreso/);
      expect(src, `${archivo} toca progress_entry`).not.toContain("progress_entry");
    }
  });

  it("tampoco lo escribe la transición de estados, que es por donde pasa VALIDATED", () => {
    const src = LEER("lib/server/servicios/transiciones.ts");
    expect(src).not.toMatch(/registrarProgreso|progress_entry|topic_progress/);
  });

  it("y ningún trigger de base lo hace a espaldas del Service", () => {
    // `data-model.md` §11: no se implementan reglas de negocio con triggers ni
    // PL/pgSQL. Un trigger sobre `evidence` que escribiera progreso sería
    // invisible desde el código de aplicación.
    const dir = resolve(process.cwd(), "supabase/migrations");
    const sql = readdirSync(dir)
      .filter((f) => f.endsWith(".sql"))
      .map((f) => readFileSync(resolve(dir, f), "utf8"))
      .join("\n");
    const triggers = sql.match(/CREATE TRIGGER[\s\S]*?;/g) ?? [];
    expect(triggers.length).toBeGreaterThan(0);

    /**
     * La única excepción, y es de otra naturaleza — Fase B6.2, ADR-034.
     *
     * `senal_no_entra_a_acknowledged` **no calcula ni escribe nada**: sólo
     * levanta una excepción. La regla que prohíbe entra a `ACKNOWLEDGED` vive
     * en `state-machines.ts` y en el tipo de `transicionar`, a la vista; esto
     * es la misma regla puesta abajo, porque `service_role` puede escribir la
     * tabla directo y una regla que sólo vive en una capa se saltea desde la
     * de abajo.
     *
     * **La lista es explícita a propósito.** Agregar un trigger nuevo exige
     * anotarlo acá, que es exactamente la conversación que este guard existe
     * para forzar.
     */
    const SOLO_PROHIBEN = ["senal_no_entra_a_acknowledged"];
    for (const t of triggers) {
      const prohibitivo = SOLO_PROHIBEN.find((f) => t.includes(f));
      if (prohibitivo) {
        // Y se verifica que efectivamente sólo prohíba: si algún día escribe
        // una tabla, deja de ser una excepción y vuelve a estar prohibido.
        const cuerpo = sql.slice(sql.indexOf(`FUNCTION public.${prohibitivo}`));
        const fin = cuerpo.indexOf("$$;");
        expect(
          cuerpo.slice(0, fin),
          `${prohibitivo} dejó de ser sólo un NO: escribe en una tabla`,
        ).not.toMatch(/\b(INSERT|UPDATE|DELETE)\s+(INTO\s+)?[a-z_]+/i);
        continue;
      }
      // El criterio no es sobre qué tabla cuelga —`topic_progress` tiene el
      // suyo— sino **qué ejecuta**: el único trigger permitido es la fontanería
      // de `updated_at` de la B1.1. Cualquier otra función sería una regla de
      // negocio invisible desde el código de aplicación.
      expect(t, `un trigger ejecuta algo que no es set_updated_at: ${t}`).toMatch(
        /EXECUTE (FUNCTION|PROCEDURE) (public\.)?set_updated_at/i,
      );
    }
  });
});
