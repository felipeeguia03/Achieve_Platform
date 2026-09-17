import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import {
  validarEvidencia,
  type DependenciasDeValidacion,
  type ValidacionEntrante,
} from "@/lib/server/servicios/validacion";
import type { CadenaCausal } from "@/lib/server/repositorios/evidencia";
import type { Evidencia } from "@/lib/server/servicios/evidencia";
import type { EventoDeProducto } from "@/lib/server/servicios/eventos";
import type { EvidenceState } from "@/lib/domain/types";
import type { ResultadoDelRegistro } from "@/lib/server/servicios/progreso";

/**
 * El cierre de `C01-009`, probado donde se decide.
 *
 * ```
 * Evidence suficiente → validación registrada → progreso registrado → Action completada
 * ```
 *
 * Lo que estos tests **no** demuestran, porque un doble no puede: que las tres
 * escrituras sobrevivan a una carrera real. Eso lo garantiza el
 * compare-and-swap contra Postgres.
 */

const INST = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";
const ACCION = "ac000000-0000-0000-0000-000000000001";
const COMPROMISO = "co000000-0000-0000-0000-000000000001";
const EVIDENCIA = "ev000000-0000-0000-0000-000000000001";
const ESTUDIANTE = "es000000-0000-0000-0000-000000000001";

const CADENA: CadenaCausal = {
  actionId: ACCION,
  actionStatus: "COMMITTED",
  courseEnrollmentId: "ce000000-0000-0000-0000-000000000001",
  topicId: "to000000-0000-0000-0000-000000000001",
  estudianteDeLaAccion: ESTUDIANTE,
  commitmentId: COMPROMISO,
  accionDelCompromiso: ACCION,
  estudianteDelCompromiso: ESTUDIANTE,
};

function mundo(opciones: { estado?: EvidenceState; cadena?: CadenaCausal | null } = {}) {
  const publicados: EventoDeProducto[] = [];
  const escrituras: Array<{ id: string; desde: EvidenceState; hacia: EvidenceState }> = [];
  const progresos: Array<{ key?: string | null; noCambio?: boolean }> = [];
  const cierres: Array<{ actionId: string; commitmentId: string }> = [];
  let estado: EvidenceState = opciones.estado ?? "SUBMITTED";

  const fila = (): Evidencia => ({
    id: EVIDENCIA,
    institutionId: INST,
    actionId: ACCION,
    state: estado,
    supersededById: null,
    reviewInstanceId: null,
  });

  const deps: DependenciasDeValidacion = {
    evidencias: {
      async porId() {
        return fila();
      },
      async cambiarEstadoSi(_i, id, esperado, nuevo) {
        if (estado !== esperado) return null;
        escrituras.push({ id, desde: esperado, hacia: nuevo });
        estado = nuevo;
        return fila();
      },
      async resubmitirAtomico() {
        throw new Error("no debería resubmitir");
      },
    },
    eventos: {
      async publicar(e) {
        publicados.push(e);
      },
    },
    async contextoDeEvidencia() {
      return opciones.cadena === undefined ? CADENA : opciones.cadena;
    },
    async registrarProgreso(entrada): Promise<ResultadoDelRegistro> {
      const yaEstaba = progresos.some((p) => p.key === entrada.idempotencyKey);
      progresos.push({ key: entrada.idempotencyKey, noCambio: entrada.noCambioExplicito });
      return { estado: "OK", entryId: "pe-1", duplicado: yaEstaba };
    },
    async completarAccion(_i, actionId, commitmentId) {
      cierres.push({ actionId, commitmentId });
      return true;
    },
  };

  return { deps, publicados, escrituras, progresos, cierres, estadoFinal: () => estado };
}

const BASE: ValidacionEntrante = {
  institutionId: INST,
  evidenciaId: EVIDENCIA,
  validadaPor: "validador-sintetico",
  cambios: [{ dimension: "practice", valor: 12 }],
};

describe("evidencia suficiente", () => {
  it("recorre el lifecycle, registra progreso y **después** cierra la acción", async () => {
    const m = mundo();

    const r = await validarEvidencia(m.deps, BASE);

    expect(r).toMatchObject({ estado: "OK", accionCompletada: true, accionId: ACCION });
    expect(m.escrituras.map((e) => `${e.desde}->${e.hacia}`)).toEqual([
      "SUBMITTED->SUFFICIENT",
      "SUFFICIENT->VALIDATED",
    ]);
    // El orden es la causalidad: sin progreso registrado no se cierra nada.
    expect(m.progresos).toHaveLength(1);
    expect(m.cierres).toEqual([{ actionId: ACCION, commitmentId: COMPROMISO }]);
  });

  it("cierra el compromiso que causó el cumplimiento, no otro", async () => {
    const m = mundo();
    await validarEvidencia(m.deps, BASE);
    expect(m.cierres[0].commitmentId).toBe(CADENA.commitmentId);
  });
});

describe("evidencia insuficiente", () => {
  it("marca `INSUFFICIENT` y **no** registra progreso ni cierra la acción", async () => {
    const m = mundo();

    const r = await validarEvidencia(m.deps, { ...BASE, suficiente: false });

    expect(r).toEqual({ estado: "INSUFICIENTE", evidenciaId: EVIDENCIA, accionId: ACCION });
    expect(m.escrituras.map((e) => `${e.desde}->${e.hacia}`)).toEqual(["SUBMITTED->INSUFFICIENT"]);
    // La Action se queda en COMMITTED esperando otra entrega.
    expect(m.cierres).toEqual([]);
    expect(m.progresos).toEqual([]);
  });

  it("repetir el juicio insuficiente no vuelve a escribir ni a publicar", async () => {
    const m = mundo({ estado: "INSUFFICIENT" });

    const r = await validarEvidencia(m.deps, { ...BASE, suficiente: false });

    expect(r).toMatchObject({ estado: "INSUFICIENTE" });
    expect(m.escrituras).toEqual([]);
    expect(m.publicados).toEqual([]);
  });
});

describe("validación repetida", () => {
  it("no duplica progreso, ni transiciones, ni eventos", async () => {
    const m = mundo({ estado: "VALIDATED" });

    const r = await validarEvidencia(m.deps, BASE);

    expect(r).toMatchObject({ estado: "OK", yaEstaba: true, accionCompletada: true });
    // Ni una transición de evidencia ni un `EvidenceValidated` de más.
    expect(m.escrituras).toEqual([]);
    expect(m.publicados).toEqual([]);
    // El progreso se pide de nuevo, pero con la misma clave: el repositorio
    // resuelve por `I8` y devuelve la entrada que ya existía.
    expect(m.progresos).toHaveLength(1);
    expect(m.progresos[0].key).toBe(`validacion:${EVIDENCIA}`);
  });

  it("dos corridas seguidas dejan una sola entrada de progreso", async () => {
    const m = mundo();
    await validarEvidencia(m.deps, BASE);
    const segunda = await validarEvidencia(m.deps, BASE);

    expect(segunda).toMatchObject({ estado: "OK", yaEstaba: true });
    expect(m.progresos.filter((p) => p.key === `validacion:${EVIDENCIA}`)).toHaveLength(2);
    // La segunda llega marcada como duplicada: no es una entrada nueva.
    expect((segunda as { progreso: ResultadoDelRegistro }).progreso).toMatchObject({
      duplicado: true,
    });
  });
});

describe("la cadena causal tiene que cerrar", () => {
  it.each([
    ["el compromiso es de otra Action", { accionDelCompromiso: "ac000000-0000-0000-0000-000000000009" }],
    ["el compromiso es de otro estudiante", { estudianteDelCompromiso: "es000000-0000-0000-0000-000000000009" }],
    ["la evidencia no tiene compromiso", { commitmentId: null }],
    ["la acción no tiene dueño legible", { estudianteDeLaAccion: "" }],
  ])("rechaza cuando %s, y no escribe nada", async (_caso, roto) => {
    const m = mundo({ cadena: { ...CADENA, ...roto } });

    const r = await validarEvidencia(m.deps, BASE);

    expect(r).toEqual({ estado: "CADENA_INVALIDA" });
    expect(m.escrituras).toEqual([]);
    expect(m.progresos).toEqual([]);
    expect(m.cierres).toEqual([]);
    expect(m.publicados).toEqual([]);
  });

  it("no dice cuál de los tres falla: quien prueba con una ajena no deduce de quién es", async () => {
    const m = mundo({ cadena: { ...CADENA, estudianteDelCompromiso: "otro" } });
    const r = await validarEvidencia(m.deps, BASE);
    expect(JSON.stringify(r)).not.toContain("otro");
    expect(JSON.stringify(r)).not.toContain(COMPROMISO);
  });
});

describe("cumplir la acción y avanzar académicamente son hechos distintos", () => {
  it("con `explicit_no_change` y cero dimensiones, la acción se completa igual", async () => {
    const m = mundo();

    const r = await validarEvidencia(m.deps, {
      ...BASE,
      cambios: [],
      noCambioExplicito: true,
      razonDeNoCambio: "la entrega cumple, el dominio todavía no se movió",
    });

    expect(r).toMatchObject({ estado: "OK", accionCompletada: true });
    expect(m.progresos[0].noCambio).toBe(true);
    expect(m.cierres).toHaveLength(1);
  });
});

describe("el cierre no depende del ADE", () => {
  /*
    Guard estático, no un mock: lo que hay que garantizar es que **no exista**
    un camino por el que el motor pueda invalidar un cierre que ya ocurrió. Un
    test con un doble probaría que el doble no falla; esto prueba que la
    dependencia no está.
  */
  const fuente = readFileSync("lib/server/servicios/validacion.ts", "utf8");

  it("el Service de validación no importa ni menciona el motor", () => {
    expect(fuente).not.toMatch(/servicios\/motor|recomendarPara|repositorios\/motor/);
  });

  it("sus dependencias declaradas no incluyen ninguna recomendación", () => {
    const bloque = fuente.slice(
      fuente.indexOf("export interface DependenciasDeValidacion"),
      fuente.indexOf("const UUID"),
    );
    expect(bloque).not.toMatch(/recomend/i);
  });

  it("el comando llama al ADE **después** de informar el cierre, y avisa si falla", () => {
    const script = readFileSync("scripts/validar.mjs", "utf8");
    const cierre = script.indexOf("accionCompletada ?");
    const ade = script.indexOf("/api/recomendacion");
    expect(cierre).toBeGreaterThan(-1);
    expect(ade).toBeGreaterThan(cierre);
    expect(script).toMatch(/La acción quedó completada\. Reparalo con `npm run recomendar`/);
  });
});
