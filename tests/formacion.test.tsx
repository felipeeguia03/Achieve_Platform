import { readdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Formacion } from "@/components/screens/formacion";
import { proyectarFormacion } from "@/lib/server/servicios/proyeccion-formacion";
import { ctaRegistry } from "@/lib/navigation";
import { menu } from "@/lib/navigation/menu";
import { nodos, superficieIds } from "@/lib/navigation/surfaces";
import type { BibliotecaPersistida } from "@/lib/server/repositorios/formacion";

/**
 * La biblioteca de Formación — [ADR-087](../docs/decisions.md#adr-087).
 *
 * Cada bloque de acá corresponde a una decisión del owner, y **la rompe a
 * propósito quien quiera cambiarla**.
 */
const RAIZ = process.cwd();
const sinComentarios = (sql: string) => sql.replace(/^\s*--.*$/gm, "");

/**
 * El TypeScript sin sus comentarios: **lo que se ejecuta, no lo que explica**.
 *
 * ⚠️ Sin esto los guards se disparan solos: el comentario que dice *"esta capa
 * no clasifica al estudiante por umbrales"* contiene la palabra «umbrales», y
 * prohibirla empujaría a borrar justamente la explicación que hace falta.
 */
const sinComentariosTs = (src: string) =>
  src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");

function migraciones(): string {
  const dir = resolve(RAIZ, "supabase/migrations");
  return readdirSync(dir)
    .filter((f) => f.endsWith(".sql"))
    .sort()
    .map((f) => readFileSync(resolve(dir, f), "utf8"))
    .join("\n");
}

function funcionesVigentes(): Map<string, string> {
  const vigentes = new Map<string, string>();
  for (const fn of migraciones().split(/CREATE OR REPLACE FUNCTION|CREATE FUNCTION/).slice(1)) {
    vigentes.set(fn.trim().split(/[(\s]/)[0], fn);
  }
  return vigentes;
}

const pieza = (over: Partial<BibliotecaPersistida["piezas"][number]> = {}) => ({
  id: "f1",
  codigo: "F01",
  titulo: "No sé por dónde empezar a estudiar",
  problema: "Lo ve como una tarea demasiado grande y no logra arrancar",
  objetivo: "Transformar «tengo que estudiar» en una primera acción concreta",
  explicacion: "La dificultad para empezar no siempre es falta de capacidad",
  accionPosterior: "definir una microacción y comenzarla inmediatamente",
  evidenciaEsperada: "foto del primer paso",
  material: "plantilla breve «De obligación a acción»",
  fuente: "instructor" as const,
  verificacion: "unverified" as const,
  ...over,
});

const CON_TODO: BibliotecaPersistida = { piezas: [pieza()] };

describe("D1 · la biblioteca es la misma para todos", () => {
  /**
   * ⚠️ **Este es el guard más importante del ADR.** `D1` cerró la opción de
   * inventar un sustituto del Student Model: *"no se utilizarán proxies,
   * puntajes ni umbrales para clasificar estudiantes como autónomos"*.
   *
   * Clasificar personas con un umbral improvisado —«ya validó 3 evidencias,
   * entonces es autónomo»— es exactamente lo que `D23` y la psicopedagoga
   * protegen. Si alguien lo intenta, esto lo dice.
   */
  it("la lectura no mira evidencias, compromisos ni progreso", () => {
    const fn = sinComentarios(funcionesVigentes().get("public.biblioteca_de_formacion") ?? "");
    expect(fn).not.toMatch(/\bevidence\b/i);
    expect(fn).not.toMatch(/\bcommitment\b/i);
    expect(fn).not.toMatch(/topic_progress/i);
    expect(fn).not.toMatch(/\bscore\b|umbral|threshold/i);
  });

  it("y la proyección tampoco clasifica al estudiante", () => {
    const src = sinComentariosTs(
      readFileSync(resolve(RAIZ, "lib/server/servicios/proyeccion-formacion.ts"), "utf8"),
    );
    expect(src).not.toMatch(/autonom[oí]a|umbral|puntaje|score|nivelDe/i);
  });

  /**
   * `D1` la declaró **opcional y no obligatoria**. ADR-021 ya había fijado que
   * el único badge posible es el del trabajo que **caduca**, y en Formación no
   * caduca nada: un número acá inventaría una urgencia sobre algo que el
   * estudiante puede no abrir nunca sin consecuencia.
   */
  it("el ítem del menú no lleva contador", () => {
    const item = menu.find((m) => m.nodo === "FORMACION");
    expect(item).toBeDefined();
    expect(item!.contador).toBeNull();
  });
});

describe("Enmienda 2 · V1 es de solo lectura", () => {
  /**
   * ⚠️ **Éste es el guard de la Enmienda 2.** La biblioteca entró como V1 sin
   * escritura: registrar `CTA-021` declararía un `resultadoAutoritativo` —*"Action
   * creada sobre el CourseEnrollment elegido"*— que **ningún camino del código
   * cumple**. Vuelve con V2, junto con su escritura.
   */
  it("`CTA-021` NO está en el registro canónico", () => {
    expect(Object.keys(ctaRegistry)).not.toContain("CTA-021");
    expect(Object.keys(ctaRegistry)).toHaveLength(20);
  });

  /**
   * `E2.3`: la elegibilidad de cursadas es de la **aplicación**, nunca de la
   * lectura. Un estudiante sin ninguna cursada **ve la biblioteca entera**.
   */
  it("la lectura no mira cursadas: la función SQL ni las nombra", () => {
    const fn = sinComentarios(funcionesVigentes().get("public.biblioteca_de_formacion") ?? "");
    expect(fn).not.toMatch(/course_enrollment/i);
    // ⚠️ **La clave entre comillas, no la palabra.** El `COMMENT` de la función
    // dice *«V1 es de solo lectura: no devuelve cursadas»*, y prohibir la
    // palabra suelta obligaría a borrar justamente la explicación. Lo que no
    // puede existir es la **clave** del JSON.
    expect(fn).not.toMatch(/'cursadas'/);
  });

  it("y la proyección no las conoce", () => {
    const src = sinComentariosTs(
      readFileSync(resolve(RAIZ, "lib/server/servicios/proyeccion-formacion.ts"), "utf8"),
    );
    expect(src).not.toMatch(/cursada|empezar|aplicar/i);
  });

  /**
   * ⚠️ **V1 no toca `action`.** La columna `formative_content_id` y `origin`
   * pertenecen a V2 y entran **con** la escritura que las usa: media mitad de un
   * contrato en el esquema es lo que la Enmienda 2 prohíbe.
   */
  it("ninguna migración de Formación modifica `action`", () => {
    for (const f of ["20261005000000_contenido_de_formacion", "20261005010000_biblioteca_de_formacion"]) {
      const sql = sinComentarios(readFileSync(resolve(RAIZ, `supabase/migrations/${f}.sql`), "utf8"));
      expect(sql).not.toMatch(/ALTER TABLE action/i);
      expect(sql).not.toMatch(/formative_content_id/i);
      expect(sql).not.toMatch(/\borigin\b/i);
    }
  });

  /**
   * Sin botón no hay promesa: la pantalla no ofrece aplicar nada.
   *
   * ⚠️ **Se mide por rol, no por texto, y la primera versión de este guard
   * estaba mal.** Buscar un botón llamado `/empezar/i` matcheaba el título de
   * la pieza —*«No sé por dónde **empezar** a estudiar»*—, que es un
   * desplegable, no una CTA. Lo que hay que afirmar es estructural: **los
   * únicos botones son los desplegables de las piezas**, y ésos llevan
   * `aria-expanded`.
   */
  it("la pantalla no dibuja ninguna CTA ni selector de materia", () => {
    render(<Formacion {...proyectarFormacion(CON_TODO)} />);
    const botones = screen.getAllByRole("button");
    expect(botones).toHaveLength(CON_TODO.piezas.length);
    for (const b of botones) expect(b).toHaveAttribute("aria-expanded");
    expect(screen.queryByRole("combobox")).toBeNull();
    expect(screen.queryByText(/¿A qué materia/)).not.toBeInTheDocument();
  });

  it("la pieza se lee igual, sin ninguna cursada de por medio", () => {
    const p = proyectarFormacion(CON_TODO);
    expect(p.piezas).toHaveLength(1);
    expect(p.aviso).toBeNull();
    render(<Formacion {...p} />);
    expect(screen.getByText(/No sé por dónde empezar/)).toBeInTheDocument();
  });
});

describe("D4 · sin guion no hay video", () => {
  /**
   * La autora declara que faltan los guiones. **Omitir, no inventar**: ni
   * reproductor vacío, ni *«próximamente»*, ni una columna que espera.
   */
  it("no hay columna de video en la entidad", () => {
    const tabla = sinComentarios(migraciones());
    const creacion = tabla.slice(
      tabla.indexOf("CREATE TABLE IF NOT EXISTS formative_content"),
      tabla.indexOf("COMMENT ON TABLE formative_content"),
    );
    expect(creacion).not.toMatch(/video|reproductor|duracion_video/i);
  });

  it("y la pantalla no anuncia uno", () => {
    render(<Formacion {...proyectarFormacion(CON_TODO)} />);
    expect(document.body.textContent).not.toMatch(/video|próximamente|proximamente/i);
  });
});

describe("D5 · lo que no está publicado no llega", () => {
  it("la función filtra por publicación, y el filtro vive en la base", () => {
    const fn = sinComentarios(funcionesVigentes().get("public.biblioteca_de_formacion") ?? "");
    expect(fn).toMatch(/publication_status\s*=\s*'PUBLISHED'/);
  });

  /**
   * ⚠️ **Cero piezas NO es un error.** Hasta que la psicopedagoga confirme
   * vigencia, la biblioteca existe y está vacía — y el vacío **dice por qué**.
   */
  it("sin contenido publicado, el vacío argumenta y no acusa al estudiante", () => {
    const p = proyectarFormacion({ piezas: [] });
    expect(p.piezas).toHaveLength(0);
    expect(p.aviso).toBeTruthy();
    // `C-04`: dos oraciones, y **sin imperativo** — no puede publicar contenido.
    expect(p.aviso!.split(/\.\s/).filter((o) => o.trim()).length).toBeGreaterThanOrEqual(2);
    // ⚠️ **Anclado por delante, sin `\b` por detrás — y no es cosmético.**
    // En JavaScript `\b` se define sobre `[A-Za-z0-9_]`, así que después de una
    // vocal acentuada **no hay frontera**: `/\bprobá\b/` no matchea «Probá».
    // Como todos los imperativos del voseo terminan en acento, un guard
    // escrito así queda inerte y nadie se entera. Es el patrón que
    // `tests/vacios.test.tsx` ya usaba.
    expect(p.aviso!).not.toMatch(/(^|[\s.,])(hacé|tocá|subí|cargá|elegí|probá)/i);
  });

  /**
   * ⚠️ **El cargador no puede publicar.** Publicar es un acto de la autora, no
   * un efecto secundario de correr un script.
   */
  it("el cargador no escribe `publication_status`", () => {
    const src = sinComentariosTs(readFileSync(resolve(RAIZ, "scripts/cargar-formacion.mjs"), "utf8"));
    // ⚠️ **Se mira la ESCRITURA, no la mención.** El script **lee** cuántas hay
    // publicadas para informarlo —`where publication_status = 'PUBLISHED'`—, y
    // prohibir la palabra lo obligaría a mentir sobre lo que acaba de hacer.
    // Por eso los dos controles miran los dos únicos lugares donde se
    // escribiría: un `set`, y la lista de columnas del `insert`.
    expect(src).not.toMatch(/set\s+publication_status/i);
    // Ni la columna en la lista del `insert`: recargar la fuente no puede
    // despublicar —ni publicar— lo que la psicopedagoga ya decidió.
    const columnas = src.slice(src.indexOf("insert into formative_content"), src.indexOf("values ("));
    expect(columnas).not.toMatch(/publication_status/i);
    expect(src).not.toMatch(/--publicar/);
  });
});

describe("La superficie no es una décima", () => {
  /**
   * ⚠️ **El spec dice nueve, y siguen siendo nueve.** El nodo tiene ruta y
   * `wireframe: null`, el patrón de ADR-077. Si alguien le pone un wireframe
   * para «completarlo», esto rompe.
   */
  it("`FORMACION` tiene ruta y no es superficie", () => {
    expect(nodos.FORMACION.ruta).toBe("/formacion");
    expect(nodos.FORMACION.wireframe).toBeNull();
    expect(superficieIds).toHaveLength(9);
    expect(superficieIds).not.toContain("FORMACION");
  });
});

describe("No promete aprendizaje", () => {
  /**
   * Formación enseña **método**: no certifica que se sepa. `ADR-072` y
   * `ADR-075` §C1 valen igual acá que en el Gantt.
   */
  it("la pantalla no habla de dominio, nivel ni porcentajes", () => {
    render(<Formacion {...proyectarFormacion(CON_TODO)} />);
    const texto = document.body.textContent ?? "";
    expect(texto).not.toMatch(/\bdominad[oa]\b|\bnivel\b|rendimiento|avance de aprendizaje/i);
    expect(texto).not.toMatch(/\d+\s?%/);
  });

  /**
   * La procedencia va **junto al dato** (`product.md` §7). Con todo
   * `unverified`, tiene que verse que nadie lo verificó.
   */
  it("muestra la procedencia de cada pieza", () => {
    const p = proyectarFormacion(CON_TODO);
    expect(p.piezas[0].procedencia).toBeTruthy();
    expect(p.piezas[0].procedencia).toMatch(/sin verificar/i);
  });
});
