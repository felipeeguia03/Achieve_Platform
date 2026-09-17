import { readdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Fase B2 — el criterio de Done, verificado.
 *
 * > *Los 12 invariantes de `data-model.md` §11 tienen test.*
 *
 * El problema de ese Done es que **nadie lo puede leer de un vistazo**. Los
 * invariantes se prueban en once archivos distintos, la mitad en `npm test` y la
 * otra mitad en scripts que necesitan Docker, y la única forma de saber si
 * faltaba alguno era buscar a mano. Un criterio de cierre que se audita a mano
 * se marca cumplido sin auditar — es exactamente lo que pasó con la deuda de
 * `npm audit` en la Fase 0.
 *
 * Así que la tabla vive acá, y con tres guards encima:
 *
 *   1. **La lista no se queda vieja.** Se compara contra la tabla de §11 del
 *      propio documento: si alguien agrega un `I13` al doc y no lo prueba, esto
 *      rompe. Y si borra uno, también.
 *   2. **Lo declarado existe.** Cada archivo citado tiene que existir y contener
 *      la marca del invariante, no una promesa.
 *   3. **Lo pendiente no se queda pendiente en silencio.** Un invariante sin
 *      test sólo puede estarlo mientras **la tabla que lo sostiene no exista**.
 *      El día que se migre, este test rompe hasta que se lo pruebe.
 *
 * Es el mismo patrón con el que la Fase 0 sostuvo las 18 CTAs y su lista de
 * bloqueadas: `tests/navigation.test.ts`.
 */

const RAIZ = process.cwd();
const LEER = (p: string) => readFileSync(resolve(RAIZ, p), "utf8");

type Invariante = {
  /** Dónde se prueba. `npm test` y los scripts contra Postgres cuentan igual. */
  cubiertoEn: string[];
  /**
   * Lo que el invariante promete y **todavía no se garantiza entero**, con la
   * misma frase que lo dice `data-model.md` §11. Marcar verde un invariante a
   * medias es peor que no tener el test.
   */
  residuo?: string;
};

/**
 * Los invariantes probados, con el archivo que los prueba.
 *
 * Los `.sh` no corren en `npm test` a propósito: necesitan Postgres, y esa suite
 * corre sin Docker en cualquier máquina (`db:verify` es la otra mitad). Un
 * invariante probado sólo contra la base **está probado**: es donde vive.
 */
const CUBIERTOS: Record<string, Invariante> = {
  // La tabla de transiciones (puro) y el Service: la arista prohibida no existe
  // en la máquina, y aunque alguien la pida, no llega a tocar la base.
  I1: {
    cubiertoEn: [
      "tests/state-machines.test.ts",
      "tests/servicio-compromiso.test.ts",
      "scripts/db-aislamiento.sh",
    ],
  },
  I2: { cubiertoEn: ["tests/servicio-compromiso.test.ts", "scripts/db-aislamiento.sh"] },
  I3: { cubiertoEn: ["tests/servicio-compromiso.test.ts", "scripts/db-aislamiento.sh"] },
  I4: { cubiertoEn: ["tests/servicio-evidencia.test.ts", "scripts/db-aislamiento.sh"] },
  I5: { cubiertoEn: ["tests/servicio-evidencia.test.ts", "scripts/db-aislamiento.sh"] },
  I6: {
    cubiertoEn: ["scripts/db-aislamiento.sh"],
    // Textual de §11. El índice único parcial es real y se prueba; lo que no
    // existe es la identidad de "contexto", así que dos Actions distintas pueden
    // tener cada una su primaria y nadie sabe si son el mismo contexto.
    residuo: "el índice único parcial solo garantiza **como máximo una por `action_id`**",
  },
  I8: { cubiertoEn: ["scripts/db-aislamiento.sh"] },
  I9: {
    cubiertoEn: [
      "tests/proyeccion-superficies.test.ts",
      "tests/servicio-ingesta.test.ts",
      "scripts/db-aislamiento.sh",
    ],
  },
  // Migrada en la Fase B5. El `UNIQUE (student_id, assessment_id)` existe y se
  // prueba contra Postgres: la segunda preparación para la misma evaluación
  // choca. Estuvo pendiente exactamente mientras su tabla no existió.
  I7: { cubiertoEn: ["scripts/db-aislamiento.sh"] },
  I10: { cubiertoEn: ["scripts/db-superficies.sh"] },
  I11: { cubiertoEn: ["scripts/db-aislamiento.sh", "scripts/db-superficies.sh"] },
  I12: { cubiertoEn: ["scripts/db-verificar.sh", "scripts/db-aislamiento.sh"] },
};

/**
 * Los que **no se pueden probar todavía**, y por qué.
 *
 * **Vacío desde la Fase B5.** `I7` era el único, y lo era porque
 * `exam_preparation` no estaba migrada. El guard de abajo rompió el día que la
 * migración entró, que es exactamente para lo que se escribió: los 12
 * invariantes de `data-model.md` §11 tienen test.
 */
const PENDIENTES: Record<string, { tabla: string; fase: string }> = {};

/** Los `I<n>` que declara la tabla de `data-model.md` §11, en su orden. */
function invariantesDelDocumento(): string[] {
  const doc = LEER("docs/data-model.md");
  const seccion = doc.slice(doc.indexOf("## 11."), doc.indexOf("## 12."));
  return [...seccion.matchAll(/^\|\s*(I\d+)\s*\|/gm)].map((m) => m[1]);
}

describe("Fase B2 · el Done: los invariantes de §11 tienen test", () => {
  const declarados = invariantesDelDocumento();

  it("la lista de acá es exactamente la de `data-model.md` §11", () => {
    const nuestros = [...Object.keys(CUBIERTOS), ...Object.keys(PENDIENTES)].sort(
      (a, b) => Number(a.slice(1)) - Number(b.slice(1)),
    );
    // Si el documento gana un invariante y este test no se entera, el Done de la
    // fase pasa a ser mentira sin que nadie lo note.
    expect(nuestros).toEqual(declarados);
    expect(declarados).toHaveLength(12);
  });

  for (const [id, { cubiertoEn }] of Object.entries(CUBIERTOS)) {
    it(`${id} se prueba, y donde dice que se prueba`, () => {
      expect(cubiertoEn.length).toBeGreaterThan(0);
      for (const archivo of cubiertoEn) {
        // La marca `I<n>` tiene que estar en el archivo: sin ella, la cita es
        // una promesa y no una prueba.
        expect(LEER(archivo), `${archivo} no menciona ${id}`).toMatch(
          new RegExp(`\\b${id}\\b`),
        );
      }
    });
  }

  /**
   * El guard que impide que la brecha se quede en silencio.
   *
   * `I7` está pendiente **sólo** mientras su tabla no exista. El día que la Fase
   * B5 migre `exam_preparation`, esto rompe hasta que se lo pruebe y se lo saque
   * de la lista.
   */
  it("los 12 tienen test: no queda ninguno pendiente", () => {
    expect(Object.keys(CUBIERTOS)).toHaveLength(12);
    expect(PENDIENTES).toEqual({});
  });

  it("un invariante pendiente lo está porque su tabla NO existe todavía", () => {
    const dir = resolve(RAIZ, "supabase/migrations");
    const sql = readdirSync(dir)
      .filter((f) => f.endsWith(".sql"))
      .map((f) => readFileSync(resolve(dir, f), "utf8"))
      .join("\n");

    for (const [id, { tabla, fase }] of Object.entries(PENDIENTES)) {
      expect(
        sql,
        `${tabla} ya está migrada: ${id} dejó de estar justificado por la Fase ${fase}. Probalo y sacalo de la lista`,
      ).not.toMatch(new RegExp(`CREATE TABLE\\s+${tabla}\\b`));
    }
  });

  it("ningún invariante cubierto está de más en la lista de pendientes", () => {
    for (const id of Object.keys(CUBIERTOS)) {
      expect(Object.keys(PENDIENTES)).not.toContain(id);
    }
  });

  /**
   * Un residuo declarado acá tiene que estar declarado en el documento. Si
   * alguien lo resuelve y actualiza §11, este test lo obliga a sacarlo de acá —
   * y si lo saca del doc sin resolverlo, también rompe.
   */
  it("todo residuo dice, textual, lo que `data-model.md` §11 dice", () => {
    const doc = LEER("docs/data-model.md");
    for (const [id, { residuo }] of Object.entries(CUBIERTOS)) {
      if (!residuo) continue;
      expect(doc, `el residuo de ${id} ya no está en §11: resolvelo acá también`).toContain(residuo);
    }
  });
});
