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

  /**
   * **Corregido en la B2.6: el guard mira la CLAVE, no la llamada.**
   *
   * La versión anterior marcaba cualquier `createClient(` fuera de
   * `lib/server/supabase.ts`, y con eso reprobó a `lib/client/supabase-navegador.ts`
   * —que construye el cliente **de Auth del navegador, con la clave `anon`**, que
   * es justamente lo que ADR-005 y `AGENTS.md` §6 mandan hacer—.
   *
   * La regla nunca fue *"nadie llama a `createClient`"*: es **`service_role` vive
   * en un solo archivo del servidor**. Es el mismo error que el guard de `setReal`
   * cometía con los identificadores: castigaba la forma en vez de la regla, y un
   * guard así enseña a esquivarlo en vez de a cumplirlo.
   */
  it("la clave `service_role` se usa en un solo lugar", () => {
    const culpables = [...fuentes("app"), ...fuentes("components"), ...fuentes("lib")]
      .filter((f) => f !== "lib/server/supabase.ts")
      .filter((f) => /SERVICE_ROLE|service_role/.test(codigo(f)))
      .map((f) => `${f}: la clave de servicio sale de lib/server/supabase.ts`);
    expect(culpables).toEqual([]);
  });

  /**
   * Lo que el guard viejo sí protegía —que los clientes no se construyan en
   * cualquier lado— se conserva, pero con la lista explícita de los dos lugares
   * legítimos. Son dos porque son dos fronteras distintas: `service_role` contra
   * la base, y `anon` contra Auth. Un tercero es un lugar más donde revisar qué
   * clave se usó.
   */
  it("un cliente de Supabase se construye en exactamente dos lugares", () => {
    const PERMITIDOS = ["lib/server/supabase.ts", "lib/client/supabase-navegador.ts"];
    const culpables = [...fuentes("app"), ...fuentes("components"), ...fuentes("lib")]
      .filter((f) => !PERMITIDOS.includes(f))
      .filter((f) => /createClient\(/.test(codigo(f)))
      .map((f) => `${f}: el cliente se pide a lib/server/ o a lib/client/, no se arma acá`);
    expect(culpables).toEqual([]);
  });

  /**
   * La otra mitad de la frontera del navegador (Etapa B2.6). `server-only` hace
   * fallar el build si un componente de cliente importa el módulo del servidor,
   * pero eso protege **una** dirección. Esto protege la otra: que en
   * `lib/client/` no aparezca una variable de entorno que sea un secreto.
   *
   * `NEXT_PUBLIC_*` viaja al navegador por definición y `NODE_ENV` lo pone el
   * framework. Cualquier otra sí es un secreto, y leerla acá la filtra en el
   * render del servidor sin que nada avise.
   */
  it("`lib/client/` sólo lee variables de entorno públicas", () => {
    const culpables = fuentes("lib/client").flatMap((f) => {
      const usadas = [...codigo(f).matchAll(/process\.env\.([A-Z0-9_]+)/g)].map((m) => m[1]);
      return usadas
        .filter((v) => !v.startsWith("NEXT_PUBLIC_") && v !== "NODE_ENV")
        .map((v) => `${f}: ${v} no es pública`);
    });
    expect(culpables).toEqual([]);
  });

  it("`lib/client/` no importa nada del servidor", () => {
    const culpables = fuentes("lib/client")
      .filter((f) => /from\s+"(@\/lib\/server|server-only)|from\s+"\.\.\/server/.test(codigo(f)))
      .map((f) => `${f}: el navegador habla por /api/*, no importa el backend`);
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
    // **Se miran los `import`, no el archivo entero.** La regla es "no importes
    // una implementación concreta fuera del composition root"; buscar `Real` en
    // cualquier lado marcaba como violación una variable local llamada
    // `setReal`. Un guard que castiga un nombre de variable enseña a nombrar mal.
    const culpables = [...fuentes("app"), ...fuentes("lib/server/servicios")]
      .filter((f) => /^import\s[^;]*\b\w+Real\b/m.test(codigo(f)))
      .map((f) => `${f}: eso va en lib/server/composicion.ts`);
    expect(culpables).toEqual([]);
  });

  it("el guard de implementaciones concretas mira imports, no identificadores", () => {
    // Auto-prueba de la corrección de arriba.
    const conImport = 'import { hoyReal } from "./repositorios/hoy";';
    const soloVariable = "const [real, setReal] = useState(null);";
    expect(/^import\s[^;]*\b\w+Real\b/m.test(conImport)).toBe(true);
    expect(/^import\s[^;]*\b\w+Real\b/m.test(soloVariable)).toBe(false);
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
