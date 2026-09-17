import { readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

import {
  ESTADOS_CORROBORABLES,
  provenanceTransitions,
  puedeCorroborar,
} from "@/lib/domain/state-machines";
import {
  corroborarProcedencia,
  TABLAS_CON_PROCEDENCIA,
  type Corroboracion,
  type RepositorioDeCorroboracion,
} from "@/lib/server/servicios/corroboracion";
import type { EntradaDeAuditoria } from "@/lib/server/servicios/auditoria";
import type { VerificationStatus } from "@/lib/domain/types";

/**
 * La corroboración — Etapa B2b.2, invariante `I9`.
 *
 * > *"Ninguna capa eleva un `verification_status`. **Operación explícita del
 * > owner en Service + autorización y auditoría**; Repository no expone un
 * > update genérico del campo."* — `data-model.md` §11
 */
const BASE: Corroboracion = {
  institutionId: "inst-A",
  tabla: "learning_objective",
  sujetoId: "obj-1",
  hacia: "corroborated",
  fuente: "instructor",
  referencia: "Programa 2026, pág. 4",
  motivo: "coincide con el programa publicado por la cátedra",
  corroboradoPor: "quien-corrobora-1",
};

function mundo(estadoInicial: VerificationStatus = "unverified") {
  let estado = estadoInicial;
  const escritas: Corroboracion[] = [];
  const auditado: EntradaDeAuditoria[] = [];

  const repo: RepositorioDeCorroboracion = {
    async corroborar(entrada) {
      if (!puedeCorroborar(estado, entrada.hacia)) {
        throw new Error(`transición de procedencia inválida: ${estado} → ${entrada.hacia}`);
      }
      const desde = estado;
      estado = entrada.hacia;
      escritas.push(entrada);
      return { corroboracionId: `corr-${escritas.length}`, desde, hacia: entrada.hacia };
    },
    async historial() {
      return [];
    },
  };

  return {
    deps: { repo, auditor: { async registrar(e: EntradaDeAuditoria) { auditado.push(e); } } },
    escritas,
    auditado,
    get estado() {
      return estado;
    },
  };
}

describe("I9 · la única operación que mueve un verification_status", () => {
  it("eleva de unverified a corroborated y devuelve de dónde venía", async () => {
    const m = mundo();
    const r = await corroborarProcedencia(m.deps, BASE);
    expect(r).toMatchObject({ estado: "OK", desde: "unverified", hacia: "corroborated" });
    expect(m.estado).toBe("corroborated");
  });

  it("audita con el estado de antes y el de después", async () => {
    // Es lo que distingue auditar de loguear, y lo que `I9` pide por nombre.
    const m = mundo();
    await corroborarProcedencia(m.deps, BASE);
    expect(m.auditado).toHaveLength(1);
    expect(m.auditado[0]).toMatchObject({
      accion: "provenance.corroborate",
      targetType: "learning_objective",
      targetId: "obj-1",
      actorId: "quien-corrobora-1",
      antes: { verificationStatus: "unverified" },
    });
    // Y con **contra qué** se corroboró: sin eso la auditoría no sirve de nada.
    expect(m.auditado[0].despues).toMatchObject({
      verificationStatus: "corroborated",
      sourceRef: "Programa 2026, pág. 4",
    });
  });

  it("no audita lo que no escribió", async () => {
    const m = mundo();
    await corroborarProcedencia(m.deps, { ...BASE, hacia: "official" });
    expect(m.auditado).toHaveLength(0);
    expect(m.escritas).toHaveLength(0);
  });
});

describe("I9 · lo que una corroboración NO puede producir", () => {
  it("`official` se rechaza nombrando la decisión que falta", async () => {
    // `official` significa que **la institución lo afirma**, y la Plataforma no
    // puede autenticar a una institución hoy.
    const m = mundo();
    const r = await corroborarProcedencia(m.deps, { ...BASE, hacia: "official" });
    expect(r.estado).toBe("RECHAZADA");
    expect(r.estado === "RECHAZADA" && r.motivo).toContain("C01-030");
    expect(m.estado).toBe("unverified");
  });

  it("no se vuelve a `unverified`", async () => {
    // Bajar a "nadie lo miró" borraría que alguien lo miró.
    const m = mundo("corroborated");
    const r = await corroborarProcedencia(m.deps, { ...BASE, hacia: "unverified" });
    expect(r.estado).toBe("RECHAZADA");
    expect(m.estado).toBe("corroborated");
  });

  it("`official` no está entre los estados que una corroboración produce", () => {
    expect(ESTADOS_CORROBORABLES).toEqual(["corroborated", "disputed"]);
    expect(ESTADOS_CORROBORABLES).not.toContain("official");
    // Pero **sigue en la máquina**, con su salida: una fila que ya viniera así
    // no puede quedar varada.
    expect(provenanceTransitions.official).toContain("disputed");
  });

  it("una fuente sin referencia concreta no corrobora nada", async () => {
    // La misma regla que la B2b.1 le puso al ingestor: *"lo dijo alguien"* no se
    // puede volver a mirar, así que no se puede corroborar nunca.
    const m = mundo();
    const r = await corroborarProcedencia(m.deps, { ...BASE, referencia: "   " });
    expect(r.estado).toBe("RECHAZADA");
    expect(m.escritas).toHaveLength(0);
  });

  it("ni una sin motivo", async () => {
    const m = mundo();
    const r = await corroborarProcedencia(m.deps, { ...BASE, motivo: "" });
    expect(r.estado).toBe("RECHAZADA");
  });
});

describe("I9 · la máquina de transiciones", () => {
  it("`disputed` no es terminal: una disputa resuelta puede volver", async () => {
    // Dejarla terminal dejaría varada para siempre una fila disputada por error.
    const m = mundo("disputed");
    const r = await corroborarProcedencia(m.deps, BASE);
    expect(r).toMatchObject({ estado: "OK", desde: "disputed", hacia: "corroborated" });
  });

  it("nada apunta a `unverified`", () => {
    for (const salidas of Object.values(provenanceTransitions)) {
      expect(salidas).not.toContain("unverified");
    }
  });

  it("la máquina del dominio dice lo mismo que la base", () => {
    // Las dos existen a propósito: el dominio para leerla y testearla sin base,
    // la base para imponerla aunque alguien llame a la función sin pasar por el
    // Service. Que digan cosas distintas sería peor que tener una sola.
    const sql = readFileSync(
      resolve(process.cwd(), "supabase/migrations/20260910000000_corroboracion.sql"),
      "utf8",
    );
    for (const [desde, salidas] of Object.entries(provenanceTransitions)) {
      for (const hacia of salidas) {
        if (!ESTADOS_CORROBORABLES.includes(hacia)) continue;
        expect(sql).toContain(`v_from = '${desde}'`);
        expect(sql).toContain(`'${hacia}'`);
      }
    }
    // Y los dos rechazos con nombre propio están escritos en la base.
    expect(sql).toContain("nadie puede declarar official");
    expect(sql).toContain("no se vuelve a unverified");
  });
});

describe("I9 · el campo no se escribe en ningún otro lado", () => {
  const dirs = ["lib/server/repositorios", "lib/server/servicios", "app/api"];

  it("ningún repositorio hace un update genérico de verification_status", () => {
    // Literal de `I9`: *"Repository no expone un update genérico del campo"*.
    const archivos = readdirSync(resolve(process.cwd(), "lib/server/repositorios"))
      .filter((f) => f.endsWith(".ts") && f !== "corroboracion.ts")
      .map((f) => readFileSync(resolve(process.cwd(), "lib/server/repositorios", f), "utf8"));
    for (const contenido of archivos) {
      // Se mira la **asignación**, no la mención: el repositorio de ingesta lo
      // nombra en un comentario para explicar que no lo toca, y prohibir la
      // palabra empujaría a borrar esa explicación. Es el mismo patrón que ya
      // usa el guard de la B2b.1.
      expect(contenido).not.toMatch(/verification_status\s*[:=]/);
      expect(contenido).not.toMatch(/verificationStatus\s*[:=]/);
    }
  });

  it("y el único SQL que lo escribe es la función de corroboración", () => {
    const dir = resolve(process.cwd(), "supabase/migrations");
    for (const f of readdirSync(dir).filter((x) => x.endsWith(".sql"))) {
      const sql = readFileSync(resolve(dir, f), "utf8");
      const escrituras = sql.match(/UPDATE\s+\S+\s+SET\s+verification_status/gi) ?? [];
      if (f === "20260910000000_corroboracion.sql") continue;
      expect(escrituras, `${f} escribe verification_status`).toHaveLength(0);
    }
  });

  it("la corroboración pasa por la función, no por un UPDATE del cliente", () => {
    const repo = readFileSync(
      resolve(process.cwd(), "lib/server/repositorios/corroboracion.ts"),
      "utf8",
    );
    expect(repo).toContain('rpc("corroborar_procedencia"');
    expect(repo).not.toMatch(/\.update\(/);
    void dirs;
  });
});

describe("I9 · el borde HTTP", () => {
  const RUTA = readFileSync(resolve(process.cwd(), "app/api/corroboracion/route.ts"), "utf8");

  it("usa secreto de servicio, nunca JWT de estudiante", () => {
    // Corroborar la propia carga la vaciaría de sentido: alguien confirmando lo
    // que él mismo declaró no es verificación, es la misma afirmación dos veces.
    expect(RUTA).toContain("esSecretoDeServicio");
    expect(RUTA).not.toMatch(/sesionDe|estudianteDe|resolverSesion/);
  });

  it("valida la tabla contra la lista, no contra texto libre", () => {
    // Una tabla arbitraria en un `format()` de Postgres es una superficie que no
    // hace falta abrir.
    expect(RUTA).toContain("TABLAS_CON_PROCEDENCIA");
    expect(TABLAS_CON_PROCEDENCIA).toHaveLength(5);
  });

  it("un rechazo de dominio es 422, no 500", () => {
    expect(RUTA).toMatch(/estado === "RECHAZADA"[\s\S]{0,200}status: 422/);
  });
});
