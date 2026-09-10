import { readdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";

import { MateriaCursado } from "@/components/screens/materia-cursado";
import { DIAS } from "@/lib/content/es-AR";
import { proyectarMateria, type EstadoDeMateria } from "@/lib/server/servicios/proyeccion-materia";
import { getEscenario } from "@/lib/fixtures";

/**
 * **Fase B6.21 — el horario de cursado.**
 *
 * [ADR-063](../docs/decisions.md#adr-063) quedó decidido el 5 de septiembre de
 * 2026 y sin construir: *"la única entidad genuinamente nueva es el bloque
 * horario"* (`plan-periodo-comision-horarios.md` §0).
 *
 * Lo que este archivo protege son **las tres cosas que el bloque horario no
 * es**, porque las tres se parecen lo suficiente como para fundirse solas:
 *
 *   - **no es `class_session`** — aquélla es una clase **dictada**, con fecha;
 *   - **no es `availability`** — aquélla dice cuándo **puede estudiar**;
 *   - **no es una agenda** — *"solo mostrar, no agendar"*, decisión del owner.
 */

const RAIZ = process.cwd();
const LEER = (p: string) => readFileSync(resolve(RAIZ, p), "utf8");

/** El SQL sin sus comentarios: lo que la base ejecuta, no lo que explica. */
const sinComentarios = (sql: string) => sql.replace(/^\s*--.*$/gm, "");

function migraciones(): string {
  const dir = resolve(RAIZ, "supabase/migrations");
  return readdirSync(dir)
    .filter((f) => f.endsWith(".sql"))
    .sort()
    .map((f) => readFileSync(resolve(dir, f), "utf8"))
    .join("\n");
}

/** La **última** definición de cada función: una migración aplicada no se edita. */
function funcionesVigentes(): Map<string, string> {
  const vigentes = new Map<string, string>();
  for (const fn of migraciones().split(/CREATE OR REPLACE FUNCTION|CREATE FUNCTION/).slice(1)) {
    vigentes.set(fn.trim().split(/[(\s]/)[0], fn);
  }
  return vigentes;
}

const base: EstadoDeMateria = {
  instante: "2026-09-09T15:00:00.000Z",
  zona: "America/Argentina/Cordoba",
  cursadaId: "ce-1",
  evidenciasEnviadas: 0,
  materia: "Cálculo Avanzado",
  examen: null,
  accion: null,
  compromiso: null,
  rescatePendiente: false,
  evidencia: "NONE",
  contextoIncompleto: false,
  // Por defecto **nada estimado**: los casos viejos miden lo que medían.
  contenido: null,
  ultimoAvanceEn: null,
  unidades: [],
  clases: [],
  cargaDeclarada: null,
  dimensiones: null,
  horario: [],
  actividadReciente: [],
};

const MARTES = {
  dia: 2,
  desde: "14:00:00",
  hasta: "16:00:00",
  origen: "catedra" as const,
  fuente: "institution" as const,
  verificacion: "unverified" as const,
};

// ─────────────────────────────────────────────────────────────────────────────

describe("§1 · Exactamente un dueño, y son FK reales", () => {
  const tabla = LEER("supabase/migrations/20261001000000_bloque_horario.sql");

  it("el CHECK de exclusividad existe", () => {
    // ADR-063: *"no crear una comisión ficticia"*. Un bloque con los dos dueños
    // o con ninguno no es un horario ambiguo: es un dato que no significa nada.
    expect(tabla).toContain("num_nonnulls(offering_id, course_enrollment_id) = 1");
  });

  it("y son dos FK, no una columna de tipo ni un JSON", () => {
    // La otra prohibición literal del ADR: *"no usar JSON opaco ni
    // identificadores fabricados"*.
    //
    // Se mira el DDL **sin comentarios**: la primera versión de este guard
    // rompía porque el propio comentario de la migración dice «no hay columna
    // `owner_type`». Un guard que se cae con lo que el autor explica es un
    // guard que se termina desactivando.
    expect(tabla).toContain("REFERENCES course_offering(id)");
    expect(tabla).toContain("REFERENCES course_enrollment(id)");
    expect(sinComentarios(tabla)).not.toMatch(/owner_type|propietario_tipo|JSONB/);
  });

  it("un bloque no puede terminar antes de empezar", () => {
    expect(tabla).toContain("CHECK (end_time > start_time)");
  });

  it("lleva procedencia desde el primer día", () => {
    expect(tabla).toContain("source_type");
    expect(tabla).toContain("verification_status");
  });

  it("y usa la misma escala de día que `availability`", () => {
    // Dos escalas de día en la misma base se descubren el día que se comparan,
    // que es exactamente lo que va a pasar con estas dos tablas.
    expect(tabla).toContain("day_of_week BETWEEN 0 AND 6");
    expect(migraciones()).toContain("day_of_week  SMALLINT CHECK (day_of_week BETWEEN 0 AND 6)");
  });

  it("y entra a `limpiar_mundo` en el mismo commit", () => {
    // La regla que dejó la B6.14: una tabla nueva que referencia al mundo
    // académico y no se agrega acá **rompe `db:verify` entero**, porque las 40
    // sentencias van en una transacción y una FK aborta todo.
    expect(LEER("scripts/db-aislamiento.sh")).toContain("delete from class_schedule_block;");
  });
});

describe("§2 · No se mezcla con la disponibilidad", () => {
  it("`insumos_de_reparto` no mira los bloques de clase", () => {
    // ADR-063, textual: *"uno expresa cuándo está cursando y el otro cuándo
    // puede estudiar"*. El presupuesto de estudio sale de `availability` y de
    // nada más: restarle las horas de cursada las contaría dos veces, porque la
    // disponibilidad **ya es** el tiempo que queda.
    const fn = funcionesVigentes().get("public.insumos_de_reparto") ?? "";
    expect(fn).not.toContain("class_schedule_block");
  });

  it("y la tabla de bloques no toca `availability`", () => {
    expect(LEER("supabase/migrations/20261001000000_bloque_horario.sql")).not.toMatch(
      /REFERENCES availability|INSERT INTO availability/,
    );
  });

  it("la regla semanal no se deriva de las clases dictadas", () => {
    // «Se dictó tres martes seguidos, entonces cursa los martes» es inferencia
    // presentada como horario de la institución. El bloque se declara.
    const fn = funcionesVigentes().get("public.estado_de_materia") ?? "";
    const horario = fn.slice(fn.indexOf("'horario'"), fn.indexOf("'clases'"));
    expect(horario).toContain("class_schedule_block");
    expect(horario).not.toContain("class_session");
  });
});

describe("§3 · La proyección dice el hecho y su procedencia", () => {
  it("arma el cuándo con el nombre del día y sin segundos", () => {
    expect(proyectarMateria({ ...base, horario: [MARTES] }).clasesDeLaSemana).toEqual([
      { cuando: "Mar 14:00–16:00", procedencia: "Institución · sin verificar" },
    ]);
  });

  it("no eleva la verificación por ser la institución la fuente", () => {
    // `I9`: elevar un `verification_status` es una operación explícita y única.
    // Que el dato venga de la institución no lo vuelve oficial.
    const p = proyectarMateria({ ...base, horario: [MARTES] });
    expect(p.clasesDeLaSemana![0].procedencia).not.toContain("oficial");
  });

  it("sin bloques la sección no existe, y eso no es «semana libre»", () => {
    expect(proyectarMateria(base).clasesDeLaSemana).toBeNull();
  });

  it("un día fuera de escala se omite, no se muestra como uno cualquiera", () => {
    const p = proyectarMateria({ ...base, horario: [{ ...MARTES, dia: 9 }] });
    expect(p.clasesDeLaSemana).toBeNull();
  });

  it("respeta el orden que la base entrega, sin reordenar", () => {
    const jueves = { ...MARTES, dia: 4, desde: "18:00:00", hasta: "21:00:00" };
    const p = proyectarMateria({ ...base, horario: [MARTES, jueves] });
    expect(p.clasesDeLaSemana!.map((b) => b.cuando)).toEqual([
      "Mar 14:00–16:00",
      "Jue 18:00–21:00",
    ]);
  });
});

describe("§4 · Una sola lista de días", () => {
  it("`DIAS` es domingo a sábado, en la escala de la base", () => {
    expect(DIAS).toEqual(["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"]);
    expect(DIAS[0]).toBe("Dom");
  });

  it("y no hay una segunda copia en ningún componente", () => {
    // La había: el paso de disponibilidad del alta tenía la suya. Dos listas son
    // dos verdades, y la que se mira menos envejece primero.
    const dirs = ["components", "app", "lib"];
    const sospechosos: string[] = [];
    const recorrer = (dir: string) => {
      for (const e of readdirSync(resolve(RAIZ, dir), { withFileTypes: true })) {
        const ruta = `${dir}/${e.name}`;
        if (e.isDirectory()) recorrer(ruta);
        else if (/\.tsx?$/.test(e.name) && ruta !== "lib/content/es-AR.ts") {
          if (/"Dom"\s*,\s*"Lun"/.test(LEER(ruta))) sospechosos.push(ruta);
        }
      }
    };
    dirs.forEach(recorrer);
    expect(sospechosos).toEqual([]);
  });
});

describe("§5 · La pantalla muestra, y no agenda", () => {
  const props = getEscenario("FX-DAY-BASE").materia!;

  it("dibuja cada bloque con su procedencia", () => {
    render(<MateriaCursado {...props} />);
    expect(screen.getByText("Clases de la semana")).toBeTruthy();
    expect(screen.getByText("Mar 18:00–20:00")).toBeTruthy();
    expect(screen.getAllByText("Institución · sin verificar")).toHaveLength(2);
  });

  it("sin horario no dibuja el encabezado sobre una lista vacía", () => {
    render(<MateriaCursado {...props} clasesDeLaSemana={null} />);
    expect(screen.queryByText("Clases de la semana")).toBeNull();
  });

  it("no ofrece ninguna acción sobre las clases", () => {
    // *"Solo mostrar, no agendar"*, textual del owner. Un botón acá convertiría
    // la sección en una agenda, y el *cuándo* de una tarea vive en el
    // `Commitment` (ADR-064).
    const { container } = render(<MateriaCursado {...props} />);
    const panel = container.querySelector("[data-horario]");
    expect(panel).toBeTruthy();
    expect(panel!.querySelectorAll("button, a, input")).toHaveLength(0);
  });
});
