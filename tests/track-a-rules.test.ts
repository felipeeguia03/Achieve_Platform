import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, resolve } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Test estático de las reglas del Track A (AGENTS.md §5, architecture.md §2.6).
 * Es un criterio de Done de la Fase 0; se mantiene en verde desde el primer
 * commit en vez de agregarse al final.
 *
 * `components/ui/` queda fuera: es un registro shadcn vendorizado que no se
 * edita y que no participa del dominio.
 */
const ROOT = process.cwd();
const SCANNED = ["app", "components/screens", "lib", "hooks", "tests"];
// El propio guard se excluye: contiene los patrones prohibidos como regex.
const SELF = "tests/track-a-rules.test.ts";

function sourceFiles(dir: string): string[] {
  const abs = resolve(ROOT, dir);
  let entries: string[];
  try {
    entries = readdirSync(abs);
  } catch {
    return [];
  }
  return entries.flatMap((entry) => {
    const full = join(abs, entry);
    if (statSync(full).isDirectory()) return sourceFiles(join(dir, entry));
    return /\.(ts|tsx)$/.test(entry) ? [join(dir, entry)] : [];
  });
}

/**
 * Quita comentarios antes de escanear.
 *
 * El guard busca **uso**, no menciones. Un comentario que explica *"acá no se
 * usa `localStorage`"* no es una violación, y sin este paso el guard se
 * dispara contra su propia documentación.
 *
 * El `//` sólo se trata como comentario cuando no viene pegado a `:`, para no
 * cortar una URL. Es conservador a propósito: si algo se le escapa, escanea de
 * más, nunca de menos.
 */
function sinComentarios(code: string): string {
  return code.replace(/\/\*[\s\S]*?\*\//g, " ").replace(/(^|[^:])\/\/[^\n]*/g, "$1");
}

const files = SCANNED.flatMap(sourceFiles)
  .filter((path) => path !== SELF)
  .map((path) => ({
    path,
    code: sinComentarios(readFileSync(resolve(ROOT, path), "utf8")),
  }));

function offenders(pattern: RegExp) {
  return files.filter(({ code }) => pattern.test(code)).map(({ path }) => path);
}

describe("El propio guard sigue cazando uso real", () => {
  // Quitar comentarios es una relajación del escaneo. Estas aserciones prueban
  // que la relajación no abrió un agujero.
  const casos: [string, string][] = [
    ["llamada directa", 'localStorage.setItem("k", "v");'],
    ["dentro de una función", "function f() { return sessionStorage.getItem('k'); }"],
    ["fetch a secas", 'const r = await fetch("/api/x");'],
    ["código después de un comentario", "// no usamos storage\nlocalStorage.clear();"],
    ["código antes de un comentario", "localStorage.clear(); // limpieza"],
  ];

  for (const [nombre, codigo] of casos) {
    it(`detecta ${nombre}`, () => {
      const limpio = sinComentarios(codigo);
      expect(/\b(localStorage|sessionStorage|indexedDB)\b|\bfetch\(/.test(limpio)).toBe(true);
    });
  }

  it("NO se dispara con una mención dentro de un comentario", () => {
    const soloProsa = "/* Acá no se usa localStorage ni fetch(). */";
    expect(sinComentarios(soloProsa).trim()).toBe("");
  });

  it("no corta una URL en dos", () => {
    expect(sinComentarios('const u = "https://ejemplo/x";')).toContain("https://ejemplo/x");
  });
});

describe("Track A — reglas verificables estáticamente", () => {
  it("hay archivos que escanear", () => {
    expect(files.length).toBeGreaterThan(0);
  });

  /**
   * **Reescrito en la Etapa B2.6, porque estaba mal de dos maneras a la vez —
   * y las dos se tapaban entre sí.**
   *
   * 1. **El regex no cazaba `fetch("…")`.** `fetch\(` seguido de `\b` exige que
   *    después del paréntesis venga un carácter de palabra, y `"` no lo es. Sólo
   *    detectaba `fetch(variable)`. Por eso la `B2.5` cerró "en verde" con un
   *    `fetch("/api/hoy")` dentro de `app/`: **el guard nunca lo vio.** Tampoco
   *    veía el `fetch(\`…\`)` del cliente del CRM, de la `B1.6`.
   * 2. **El alcance ya no era cierto.** Desde que existe el Track B, la red es
   *    parte del producto: `lib/client/` la usa contra `/api/*` y
   *    `lib/server/repositorios/` contra el CRM.
   *
   * Arreglar sólo el regex habría reprobado a los dos módulos que deben usar red;
   * ampliar sólo el alcance habría dejado un guard que no caza nada. Lo que sigue
   * siendo verdad es más chico y más útil: **la presentación, el dominio y las
   * rutas no hablan por red.** Una pantalla que hace `fetch` decide de dónde
   * salen sus datos, y eso es exactamente lo que la frontera de la Fase 0 existe
   * para impedir. La red vive en dos módulos y se los nombra.
   */
  const RED = /\b(fetch|XMLHttpRequest|WebSocket|EventSource)\s*\(/;
  const CON_RED_PERMITIDA = ["lib/client/", "lib/server/repositorios/"];

  it("el regex de red caza las tres formas de llamar a fetch", () => {
    // Auto-prueba de la corrección de arriba. La primera es la que se escapaba.
    expect(RED.test('fetch("/api/hoy")')).toBe(true);
    expect(RED.test("fetch(`${base}/x`)")).toBe(true);
    expect(RED.test("fetch(ruta, { headers })")).toBe(true);
    expect(RED.test("new WebSocket(url)")).toBe(true);
    // Y no se dispara con algo que sólo empieza igual.
    expect(RED.test("prefetchAlgo(x)")).toBe(false);
  });

  it("cero red: la presentación, el dominio y las rutas no hablan por red", () => {
    const culpables = offenders(RED)
      .filter((f) => !CON_RED_PERMITIDA.some((capa) => f.startsWith(capa)))
      .filter((f) => !f.startsWith("tests/"));
    expect(culpables).toEqual([]);
  });

  it("cero persistencia: sin localStorage, sessionStorage ni IndexedDB", () => {
    expect(offenders(/\b(localStorage|sessionStorage|indexedDB|IDBDatabase)\b/)).toEqual([]);
  });

  /**
   * **Relajado en la B1.6, y acotado a lo que no puede existir.**
   *
   * El contrato con el CRM tiene un campo `email`, así que sus contract tests
   * necesitan un valor con forma de email o no prueban el contrato. Se permiten
   * **sólo los dominios que RFC 2606 reserva** —`example.com/net/org` y los TLD
   * `.test`, `.invalid`, `.example`, `.localhost`—: son inasignables por
   * definición, así que un email ahí **no puede ser de una persona real**.
   *
   * Cualquier otro dominio sigue prohibido. Las auto-pruebas de abajo verifican
   * que la relajación no abrió la puerta.
   */
  const DOMINIO_RESERVADO =
    /@(example\.(com|net|org)|[\w-]+\.(test|invalid|example|localhost))$/i;

  function emailsNoReservados(fuente: string): string[] {
    return (fuente.match(/[\w.+-]+@[\w.-]+\.[a-z]{2,}/gi) ?? []).filter(
      (e) => !DOMINIO_RESERVADO.test(e),
    );
  }

  it("cero datos reales: sin emails ni teléfonos con forma de dato real", () => {
    // Reusa la lista ya cargada y sin comentarios: un segundo recorrido del
    // árbol sería otra lista que mantener sincronizada.
    const culpables = files
      .filter(({ code }) => emailsNoReservados(code).length > 0)
      .map(({ path }) => path);
    expect(culpables).toEqual([]);
  });

  it("la relajación no dejó pasar un dominio real", () => {
    // Lo que debe seguir siendo delito.
    expect(emailsNoReservados("ana@uni.edu.ar")).toEqual(["ana@uni.edu.ar"]);
    expect(emailsNoReservados("felipe@gmail.com")).toEqual(["felipe@gmail.com"]);
    expect(emailsNoReservados("a@examples.com")).toEqual(["a@examples.com"]);
    // Un dominio que sólo *empieza* como reservado no cuenta.
    expect(emailsNoReservados("x@example.com.ar")).toEqual(["x@example.com.ar"]);
    // Lo que sí se permite, porque RFC 2606 lo hace inasignable.
    expect(emailsNoReservados("sintetico@example.test")).toEqual([]);
    expect(emailsNoReservados("a@example.com")).toEqual([]);
    expect(emailsNoReservados("b@algo.invalid")).toEqual([]);
  });
});

/**
 * La frontera que hace barato el Track B (architecture.md §2.4).
 *
 * Si una pantalla importa un fixture, cambiar de fixtures a backend real toca
 * la capa de presentación — que es exactamente el costo que esta separación
 * existe para evitar.
 */
describe("La frontera de lib/fixtures/", () => {
  const pantallas = files.filter(({ path }) => path.startsWith("components/screens/"));
  const dominio = files.filter(({ path }) => path.startsWith("lib/domain/"));

  it("hay pantallas y hay dominio que revisar", () => {
    expect(pantallas.length).toBeGreaterThan(0);
    expect(dominio.length).toBeGreaterThan(0);
  });

  it("ninguna pantalla importa un fixture", () => {
    const culpables = pantallas
      .filter(({ code }) => /from\s+"@?\/?(?:\.\.\/)*lib\/fixtures/.test(code))
      .map(({ path }) => path);
    expect(culpables).toEqual([]);
  });

  it("lib/domain/ es puro: sin React", () => {
    const culpables = dominio
      .filter(({ code }) => /from\s+"react|from\s+"next\//.test(code))
      .map(({ path }) => path);
    expect(culpables).toEqual([]);
  });

  it("lib/navigation/ no depende de fixtures", () => {
    // La dirección es fixtures → navigation. El grafo y el registro describen
    // el contrato; los escenarios lo instancian, no al revés.
    const navegacion = files.filter(({ path }) => path.startsWith("lib/navigation/"));
    expect(navegacion.length).toBeGreaterThan(0);
    const culpables = navegacion
      .filter(({ code }) => /from\s+"@\/lib\/fixtures/.test(code))
      .map(({ path }) => path);
    expect(culpables).toEqual([]);
  });

  it("lib/domain/ no depende de fixtures ni de contenido", () => {
    // La dirección de la dependencia es fixtures → domain, nunca al revés.
    const culpables = dominio
      .filter(({ code }) => /from\s+"@\/lib\/(fixtures|content)/.test(code))
      .map(({ path }) => path);
    expect(culpables).toEqual([]);
  });

  it("las pantallas no traen copy de regla de negocio hardcodeado (regla C-07)", () => {
    // Los prefijos de dominio viven en lib/content/ con ID. Si aparecen como
    // literal dentro de un componente, volvieron al JSX.
    const literales = /"(Porque:|Entregá:|Después:|Cerrás cuando:)/;
    const culpables = pantallas
      .filter(({ code }) => literales.test(code))
      .map(({ path }) => path);
    expect(culpables).toEqual([]);
  });
});
