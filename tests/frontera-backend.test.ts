import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, resolve } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Etapa B1.4 — la regla de oro de `architecture.md` §3.2, verificada:
 *
 * > Toda la lógica de negocio vive en el backend. El frontend habla por HTTP
 * > con `/api/*`; **nunca lee ni escribe tablas de negocio**.
 *
 * Es la frontera que hace barato todo lo demás, y la que se rompe con un
 * import de conveniencia un martes a la tarde.
 */
const RAIZ = process.cwd();
const SELF = "tests/frontera-backend.test.ts";

function fuentes(dir: string): string[] {
  let entradas: string[];
  try {
    entradas = readdirSync(resolve(RAIZ, dir));
  } catch {
    return [];
  }
  return entradas.flatMap((e) => {
    const full = join(dir, e);
    if (statSync(resolve(RAIZ, full)).isDirectory()) return fuentes(full);
    return /\.(ts|tsx)$/.test(e) ? [full] : [];
  });
}

const leer = (f: string) => readFileSync(resolve(RAIZ, f), "utf8");

/**
 * Los guards leen **código**, no comentarios. Sin esto, un comentario que
 * explica la regla —"el Service no lee headers"— la hace fallar: pasó en la
 * primera corrida de este archivo. Un guard que castiga documentar la regla
 * enseña a no documentarla.
 */
function sinComentarios(fuente: string): string {
  return fuente
    .replace(/\/\*[\s\S]*?\*\//g, "")
    // Hasta fin de línea, también los de cola. La primera versión sólo borraba
    // los que empezaban la línea, así que `const a = 1; // .from("x")`
    // sobrevivía — justo el falso positivo que este helper viene a evitar. Lo
    // encontró la auto-prueba de abajo, no una relectura.
    // El `(^|[^:])` evita comerse el `//` de una URL.
    .replace(/(^|[^:])\/\/.*$/gm, "$1");
}
const codigo = (f: string) => sinComentarios(leer(f));

describe("§3.2 · sólo el Repository toca la base", () => {
  it("nadie fuera de `lib/server/repositorios/` consulta tablas", () => {
    const culpables = [...fuentes("app"), ...fuentes("components"), ...fuentes("lib")]
      .filter((f) => !f.startsWith("lib/server/repositorios/"))
      .filter((f) => /\.from\(\s*["'`]/.test(codigo(f)))
      .map((f) => `${f}: usa .from("tabla") fuera del Repository`);
    expect(culpables).toEqual([]);
  });

  it("el cliente con `service_role` se construye en un solo lugar", () => {
    const culpables = [...fuentes("app"), ...fuentes("components"), ...fuentes("lib")]
      .filter((f) => f !== "lib/server/supabase.ts")
      .filter((f) => /createClient\(/.test(codigo(f)));
    expect(culpables).toEqual([]);
  });

  /**
   * `server-only` hace fallar el build si un componente de cliente importa por
   * error un módulo del servidor. Sin él la regla depende de que nadie se
   * equivoque, y eso no es una regla.
   */
  it("todo módulo que toca la base o secretos lleva `server-only`", () => {
    const debenTenerlo = ["lib/server/supabase.ts", ...fuentes("lib/server/repositorios")];
    const sinMarca = debenTenerlo.filter((f) => !leer(f).includes('import "server-only"'));
    expect(sinMarca).toEqual([]);
  });
});

describe("§3.2 · cada capa en su lugar", () => {
  /**
   * "El Service no lee headers ni conoce SQL." Un Service que importa el
   * cliente de Supabase ya conoce SQL, aunque todavía no lo escriba.
   */
  it("ningún Service importa el cliente de la base", () => {
    const culpables = fuentes("lib/server/servicios")
      .filter((f) => /from "\.\.\/supabase"|@supabase\/supabase-js/.test(codigo(f)))
      .map((f) => `${f}: el Service no conoce la persistencia`);
    expect(culpables).toEqual([]);
  });

  it("ningún Service lee headers ni objetos HTTP", () => {
    const culpables = fuentes("lib/server/servicios")
      .filter((f) => /\bheaders\b|NextRequest|NextResponse/.test(codigo(f)))
      .map((f) => `${f}: eso es del Controller`);
    expect(culpables).toEqual([]);
  });

  /**
   * "El Controller no contiene reglas de negocio ni consultas." Si un route
   * handler importa un Repository, se saltea el Service, que es donde viven
   * el scoping y las transiciones.
   */
  it("ningún Controller importa un Repository", () => {
    const culpables = fuentes("app")
      .filter((f) => /repositorios\//.test(codigo(f)))
      .map((f) => `${f}: el Controller llama a un Service, no al Repository`);
    expect(culpables).toEqual([]);
  });

  /**
   * Las implementaciones concretas se atan en un solo lugar. Si cada Controller
   * arma las suyas, cambiar de proveedor deja de ser un archivo y pasa a ser
   * una búsqueda.
   */
  it("sólo el composition root ata implementaciones concretas", () => {
    const culpables = [...fuentes("app"), ...fuentes("lib/server/servicios")]
      .filter((f) => /Real\b/.test(codigo(f)))
      .map((f) => `${f}: eso va en lib/server/composicion.ts`);
    expect(culpables).toEqual([]);
  });

  /**
   * Auto-prueba: si `sinComentarios` borrara de más, los guards pasarían
   * vacíos y nadie se enteraría.
   */
  it("`sinComentarios` borra comentarios y conserva código", () => {
    const ejemplo =
      'const a = 1; // .from("x")\n/* .from("y") */\nconst b = ".from(";\n// https://x.test\n';
    const limpio = sinComentarios(ejemplo);
    expect(limpio).toContain("const a = 1;");
    expect(limpio).toContain("const b =");
    expect(limpio).not.toContain('.from("x")');
    expect(limpio).not.toContain('.from("y")');
    // Y no rompe una URL en un comentario que sí se borra entero.
    expect(sinComentarios("const u = 1; // ver https://ejemplo.test")).toContain("const u = 1;");
  });

  it("el guard no se está mirando a sí mismo", () => {
    expect(fuentes("tests")).toContain(SELF);
    expect(leer(SELF)).toContain("service_role");
  });
});
