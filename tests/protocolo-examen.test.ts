import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Etapa B5.6 — el contenido del protocolo, atado a su fuente.
 *
 * El riesgo de esta etapa no es que el SQL falle: es que un agente **mejore la
 * redacción de la psicopedagoga** al transcribirla. Arreglarle un *"a
 * desarrollae"* o un *"icnorporando"* se siente como cortesía y es exactamente
 * lo que `AGENTS.md` prohíbe: la fuente es la fuente, y quien la lea dentro de
 * tres meses tiene que encontrar lo que ella escribió.
 *
 * Así que el guard no compara contra una lista escrita acá. **Compara el SQL
 * contra el documento fuente**, carácter por carácter, igual que el registro de
 * CTAs contra la tabla del spec y que el catálogo de eventos contra §16.
 */

const RAIZ = process.cwd();
const LEER = (p: string) => readFileSync(resolve(RAIZ, p), "utf8");

const FUENTE = LEER("docs/roadmap-modo-examen-source.md");
const SQL = LEER("supabase/migrations/20260901080000_protocolo_roadmap.sql");

/**
 * El documento envuelve a 100 columnas y las citas viven en blockquotes: se
 * sacan los `>` de inicio de línea y se colapsa el espacio para buscar frases.
 */
const normalizar = (s: string) => s.replace(/^\s*>\s?/gm, "").replace(/\s+/g, " ").trim();
const fuentePlana = normalizar(FUENTE);

interface PasoCargado {
  canonicalId: string;
  sequence: number;
  fase: string;
  reentrante: boolean;
  label: string;
  /** El cuerpo del paso. Va a `objective`, no a `explanation` — ver la migración. */
  cuerpo: string | null;
  source: string;
}

/**
 * Lee las filas del `VALUES` del propio SQL.
 *
 * Un regex sobre todo el archivo agarraría cualquier string suelto de un
 * comentario. Se acota al bloque del `VALUES` y se tokeniza respetando el
 * escape `''` de Postgres, que aparece de verdad: la fuente tiene apóstrofes.
 */
function pasosCargados(): PasoCargado[] {
  const desde = SQL.indexOf("CROSS JOIN (VALUES");
  const hasta = SQL.indexOf(") AS s(canonical_id");
  expect(desde, "el bloque VALUES cambió de forma").toBeGreaterThan(-1);
  const bloque = SQL.slice(desde, hasta);

  const filas: PasoCargado[] = [];
  const re = /\('(PE-PSY-\d\d)',\s*(\d+),\s*'([A-Z_]+)',\s*(TRUE|FALSE)\s*,/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(bloque)) !== null) {
    // Los tres strings que siguen, en orden: label, cuerpo, source.
    let i = re.lastIndex;
    const textos: (string | null)[] = [];
    while (textos.length < 3) {
      while (bloque[i] === " " || bloque[i] === "\n" || bloque[i] === ",") i++;
      if (bloque.startsWith("NULL", i)) {
        textos.push(null);
        i += 4;
        continue;
      }
      expect(bloque[i], `${m[1]}: se esperaba un literal`).toBe("'");
      i++;
      let acc = "";
      while (true) {
        if (bloque[i] === "'" && bloque[i + 1] === "'") {
          acc += "'";
          i += 2;
        } else if (bloque[i] === "'") {
          i++;
          break;
        } else {
          acc += bloque[i];
          i++;
        }
      }
      textos.push(acc);
    }
    filas.push({
      canonicalId: m[1],
      sequence: Number(m[2]),
      fase: m[3],
      reentrante: m[4] === "TRUE",
      label: textos[0]!,
      cuerpo: textos[1],
      source: textos[2]!,
    });
  }
  return filas;
}

const PASOS = pasosCargados();

describe("B5.6 · los veinte pasos son los del documento, sin retoques", () => {
  it("son veinte, numerados de 1 a 20", () => {
    expect(PASOS).toHaveLength(20);
    expect(PASOS.map((p) => p.sequence)).toEqual(
      Array.from({ length: 20 }, (_, i) => i + 1),
    );
    expect(PASOS.map((p) => p.canonicalId)).toEqual(
      Array.from({ length: 20 }, (_, i) => `PE-PSY-${String(i + 1).padStart(2, "0")}`),
    );
  });

  it("el texto de cada paso está, literal, en el documento fuente", () => {
    for (const p of PASOS) {
      expect(
        fuentePlana,
        `${p.canonicalId}: el texto cargado no aparece en roadmap-modo-examen-source.md`,
      ).toContain(normalizar(p.source));
    }
  });

  it("el título y la explicación reconstruyen el texto: no hay nada escrito por un agente", () => {
    for (const p of PASOS) {
      const reconstruido = p.cuerpo ? `${p.label} ${p.cuerpo}` : p.label;
      expect(reconstruido, `${p.canonicalId} no reconstruye su fuente`).toBe(p.source);
    }
  });

  it("el corte es determinista: primer punto o primeros dos puntos", () => {
    for (const p of PASOS) {
      const i = Math.min(
        ...[".", ":"].map((c) => (p.source.includes(c) ? p.source.indexOf(c) : Infinity)),
      );
      expect(p.label, `${p.canonicalId} cortó en otro lado`).toBe(
        p.source.slice(0, i + 1).trim(),
      );
    }
  });

  it("los errores tipográficos de la autora se conservan", () => {
    // Si alguien "arregla" la fuente, esto rompe. Es el punto.
    const todo = PASOS.map((p) => p.source).join(" ");
    for (const tal_cual of [
      "a desarrollae",
      "Siemrpe",
      "esdtudio",
      "ideas ppales",
      "cometi error",
      "loq ue no supe",
      "presentan vacios",
      "no seguir icnorporando",
      "no visto / leido /",
    ]) {
      expect(todo, `desapareció «${tal_cual}»: la fuente no se corrige`).toContain(tal_cual);
    }
  });
});

describe("B5.6 · lo que la fuente no define, no se completó", () => {
  it("ningún paso trae evidencia esperada ni criterio de cierre", () => {
    // El Roadmap dice qué hacer, no qué se entrega ni cuándo cierra. El cuadro
    // de problemas propone evidencias y **no está mapeado uno a uno** con estos
    // veinte, además de conservar preguntas de la propia autora.
    const insert = SQL.slice(SQL.indexOf("INSERT INTO protocol_step"));
    expect(insert).toContain("expected_artifact, criterion, requirement");
    expect(insert).toContain("NULL, NULL, 'NO_CONFIGURADA'");
  });

  it("la obligatoriedad queda sin configurar: es `C01-031`", () => {
    expect(SQL).toContain("'NO_CONFIGURADA'");
    expect(SQL).toContain("C01-031");
  });

  it("el rótulo dice que la vigencia no está confirmada", () => {
    expect(SQL).toContain("'v1.0-sin-confirmar'");
  });

  it("el cuerpo va a `objective` y no a `explanation`", () => {
    // `UX09` titula esos bloques "Objetivo" y "Por qué". El texto del Roadmap es
    // una instrucción; bajo "Por qué" se leería como una justificación que la
    // autora no escribió.
    const insert = SQL.slice(SQL.indexOf("INSERT INTO protocol_step"));
    expect(insert).toContain("label, objective, source_text");
    expect(insert).toContain("explanation, expected_artifact, criterion, requirement");
  });
});

describe("B5.6 · la reentrancia sale de `HUMAN-P0-01 v1.0`, y se puede rastrear", () => {
  it("son los pasos 9 a 18, y ninguno más", () => {
    const reentrantes = PASOS.filter((p) => p.reentrante).map((p) => p.sequence);
    expect(reentrantes).toEqual([9, 10, 11, 12, 13, 14, 15, 16, 17, 18]);
  });

  it("el tramo coincide con las fases que la profesional nombró", () => {
    // *"estudio, recuperación, revisión y práctica"* — y el simulacro (18) es el
    // último de práctica que pertenece a la etapa: el 19 son las últimas 24 h y
    // el 20 es durante el examen.
    const fases = new Set(PASOS.filter((p) => p.reentrante).map((p) => p.fase));
    expect([...fases].sort()).toEqual(["ESTUDIO_ACTIVO", "PRACTICA", "REVISION"]);
    expect(PASOS.find((p) => p.sequence === 19)!.reentrante).toBe(false);
    expect(PASOS.find((p) => p.sequence === 20)!.reentrante).toBe(false);
  });

  it("la cita que la sostiene está en la fuente que la dijo", () => {
    // Sin esto, "9 a 18" sería un número que alguien eligió. Con esto, es una
    // frase que la profesional escribió y que se puede ir a leer.
    const humanP0 = normalizar(LEER("docs/human-p0-source.md"));
    expect(
      humanP0.includes("entre los puntos 9 al 18 el recorrido no es lineal ni rígido"),
      "la cita de HUMAN-P0-01 que sostiene el tramo 9–18 ya no está en su fuente",
    ).toBe(true);
  });
});

describe("B5.6 · `EP-SPEC v0.1` se apaga, no se borra", () => {
  it("se apaga con UPDATE y no con DELETE", () => {
    expect(SQL).toContain("UPDATE exam_protocol SET is_current = FALSE");
    expect(SQL).not.toMatch(/DELETE\s+FROM\s+exam_protocol/i);
    expect(SQL).not.toMatch(/DELETE\s+FROM\s+protocol_step/i);
  });
});
