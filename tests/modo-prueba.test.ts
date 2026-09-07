import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, resolve } from "node:path";
import { describe, expect, it } from "vitest";

import {
  reiniciarAlta,
  type ConteoDelReinicio,
  type RepositorioDePrueba,
} from "@/lib/server/servicios/prueba";
import { nodoIds, superficieIds } from "@/lib/navigation/surfaces";
import { ctaRegistry } from "@/lib/navigation/cta-registry";

/**
 * **Modo prueba — reiniciar el alta de un estudiante sintético.**
 *
 * Lo que se prueba acá no es que borre —eso lo hace una función de base y lo
 * verifica `db:verify`— sino **que siga siendo una herramienta y no se
 * convierta en producto**: que esté apagada por defecto, que no invente
 * superficies ni CTAs, que no emita eventos de dominio y que no toque lo
 * append-only.
 */

const LEER = (p: string) => readFileSync(resolve(process.cwd(), p), "utf8");

/** Quita comentarios: el guard busca **uso**, no menciones. */
const sinComentarios = (fuente: string) =>
  fuente.replace(/\/\*[\s\S]*?\*\//g, " ").replace(/^\s*(\/\/|--).*$/gm, "");

const VACIO: ConteoDelReinicio = {
  cursadas: 0,
  declaraciones: 0,
  consentimientos: 0,
  inscripciones: 0,
  institucionId: "inst-A",
};

function repo(sobre: Partial<RepositorioDePrueba> = {}): RepositorioDePrueba {
  return {
    async instituciones() {
      return [];
    },
    async reiniciarAlta() {
      return VACIO;
    },
    ...sobre,
  };
}

/** El reconocedor de rechazos que inyecta el composition root. */
const rechazoPorNombre = (e: unknown) =>
  e instanceof Error && e.message === "INSTITUCION_SIN_PLAN" ? ("INSTITUCION_SIN_PLAN" as const) : null;

describe("El Service del reinicio", () => {
  it("manda al primer paso del alta, derivado del dominio y no escrito a mano", async () => {
    const r = await reiniciarAlta(repo(), "inst-A", "est-1", null, () => null);
    expect(r.estado).toBe("OK");
    if (r.estado !== "OK") return;
    // El orden de los pasos lo fija ADR-042. Si mañana se reordena, esto sigue
    // apuntando al primero **sin tocar este archivo** — y si alguien lo escribe
    // a mano en el cliente, el reinicio manda a un paso ya contestado.
    expect(r.siguiente).toBe("/alta/whatsapp");
  });

  it("devuelve lo que había, contado antes de borrar", async () => {
    const r = await reiniciarAlta(
      repo({ async reiniciarAlta() { return { ...VACIO, cursadas: 9, declaraciones: 9 }; } }),
      "inst-A",
      "est-1",
      null,
      () => null,
    );
    expect(r.estado).toBe("OK");
    if (r.estado !== "OK") return;
    // Todo en cero después de borrar no diría si había algo que reiniciar.
    expect(r.borrado.cursadas).toBe(9);
  });

  it("un rechazo declarado se contesta; no se disfraza de error", async () => {
    const r = await reiniciarAlta(
      repo({ async reiniciarAlta() { throw new Error("INSTITUCION_SIN_PLAN"); } }),
      "inst-A",
      "est-1",
      "inst-sin-plan",
      rechazoPorNombre,
    );
    expect(r.estado).toBe("INSTITUCION_SIN_PLAN");
  });

  it("un error que NO es un rechazo declarado sube, y no se traga", async () => {
    // Tragarse un fallo de base como si fuera un «no se puede» convertiría una
    // caída en un mensaje de producto, que es lo que ADR-052 corrigió el 5 de
    // septiembre con el `404` que se mostraba como error de red.
    await expect(
      reiniciarAlta(
        repo({ async reiniciarAlta() { throw new Error("connection refused"); } }),
        "inst-A",
        "est-1",
        null,
        rechazoPorNombre,
      ),
    ).rejects.toThrow("connection refused");
  });

  it("el id del estudiante lo pone quien llama: el Service no lo recibe del cuerpo", async () => {
    let visto: string | null = null;
    await reiniciarAlta(
      repo({ async reiniciarAlta(_i, studentId) { visto = studentId; return VACIO; } }),
      "inst-A",
      "est-1",
      null,
      () => null,
    );
    expect(visto).toBe("est-1");
  });
});

describe("El modo prueba está apagado por defecto", () => {
  const RUTA = LEER("app/api/prueba/alta/route.ts");

  it("responde 404 y no 403: un 403 confirmaría que la ruta existe", () => {
    expect(RUTA).toContain('process.env.MODO_PRUEBA !== "1"');
    // El cerrojo contesta `404`, y los `403` de la ruta son otra cosa: son el
    // padrón. Si alguien los colapsa, esto rompe.
    expect(RUTA).toMatch(/if \(apagada\(\)\) return NextResponse\.json\(NO_ENCONTRADO, \{ status: 404 \}\)/);
    expect(RUTA).toMatch(/NO_ENCONTRADO = \{ error: "No encontrado" \}/);
  });

  it("el cerrojo va antes que el token, en los dos verbos", () => {
    for (const verbo of ["GET", "POST"] as const) {
      const cuerpo = RUTA.slice(RUTA.indexOf(`export async function ${verbo}`));
      const gate = cuerpo.indexOf("apagada()");
      const token = cuerpo.indexOf("tokenDelHeader");
      expect(gate, `${verbo} no tiene el cerrojo`).toBeGreaterThan(-1);
      expect(gate, `${verbo} mira el token antes de cerrar la puerta`).toBeLessThan(token);
    }
  });

  it("va con el JWT del estudiante y nunca con secreto de servicio", () => {
    // Un secreto podría reiniciar a cualquiera. Ésta sólo puede sobre sí misma.
    expect(RUTA).toContain("resolverSesion");
    expect(RUTA).not.toContain("esSecretoDeServicio");
  });

  it("el studentId sale de la sesión y no del cuerpo", () => {
    expect(RUTA).toContain("sesion.estudiante.id");
    const cuerpo = RUTA.slice(RUTA.indexOf("const cuerpo"));
    expect(cuerpo).not.toMatch(/cuerpo\?\.(estudiante|student|alumno)/);
  });

  it("las dos superficies lo montan detrás de la variable, no con display:none", () => {
    for (const layout of ["app/(student)/layout.tsx", "app/alta/layout.tsx"]) {
      expect(LEER(layout), layout).toContain('process.env.MODO_PRUEBA === "1"');
    }
  });
});

describe("El modo prueba no se convierte en producto", () => {
  it("no agrega superficies: siguen siendo nueve y UX10 no existe", () => {
    expect(superficieIds).toHaveLength(9);
    expect(nodoIds).not.toContain("UX10");
  });

  it("no agrega CTAs al registro canónico", () => {
    // Son 20 desde el 7 de septiembre de 2026 (ADR-067, `CTA-020`). Lo que este
    // guard vigila no es el número: es que **el modo prueba** no lo mueva.
    expect(Object.keys(ctaRegistry)).toHaveLength(20);
  });

  it("el panel no entra al grafo de navegación ni al registro de CTAs", () => {
    // Sobre el **código**, no sobre los comentarios: el encabezado del panel
    // explica justamente que no entra al grafo, y nombrarlo para decir que no
    // se usa no es usarlo.
    const PANEL = sinComentarios(LEER("components/prueba/panel.tsx"));
    expect(PANEL).not.toMatch(/lib\/navigation/);
    expect(PANEL).not.toMatch(/lib\/fixtures/);
  });

  it("el panel va por lib/client, como toda la presentación", () => {
    // Que **no** hable por red ni persista en el navegador lo verifica el guard
    // de siempre: `components/prueba/` entró a su lista de directorios en el
    // mismo commit. Duplicar los patrones acá sería una segunda lista que
    // mantener — y el propio guard se dispararía contra ella.
    expect(LEER("components/prueba/panel.tsx")).toContain('from "@/lib/client/api"');
  });

  it("su texto no entra al copy del producto", () => {
    // `lib/content/es-AR.ts` pasa por la auditoría de conformidad (`C-01`,
    // `C-02`). Meter ahí el texto de una herramienta sería afirmar que alguien
    // lo va a leer fuera de una máquina de desarrollo.
    const COPY = LEER("lib/content/es-AR.ts");
    expect(COPY).not.toMatch(/modo prueba|MODO PRUEBA|Reiniciar el alta/i);
  });
});

describe("Reiniciar no es un hecho del dominio", () => {
  const SERVICE = LEER("lib/server/servicios/prueba.ts");
  const REPO = LEER("lib/server/repositorios/prueba.ts");
  const MIGRACION = LEER("supabase/migrations/20260916000000_reinicio_de_alta_de_prueba.sql");

  function codigo(fuente: string) {
    return fuente.replace(/\/\*[\s\S]*?\*\//g, " ").replace(/^\s*(\/\/|--).*$/gm, "");
  }

  it("no emite ningún product event: es deshacer una prueba, no un hecho", () => {
    // Declararlo en `lib/domain/product-events.ts` metería una herramienta de
    // laboratorio en el modelo de eventos, que tiene guard en las dos
    // direcciones.
    expect(codigo(SERVICE)).not.toMatch(/publicar|PublicadorDeEventos|product_event/);
    expect(codigo(REPO)).not.toMatch(/publicar|product_event/);
  });

  it("no toca lo append-only: ni product_event ni audit_log (I12)", () => {
    expect(codigo(MIGRACION)).not.toMatch(/DELETE\s+FROM\s+(product_event|audit_log)/i);
    expect(codigo(MIGRACION)).not.toMatch(/UPDATE\s+(product_event|audit_log)/i);
  });

  it("no toca el catálogo: sin él, el alta no tendría qué ofrecer", () => {
    const sql = codigo(MIGRACION);
    for (const tabla of [
      "institution",
      "academic_program",
      "academic_unit",
      "curriculum_plan",
      "curriculum_requirement",
      "course",
      "topic",
    ]) {
      expect(sql, `borra ${tabla}`).not.toMatch(new RegExp(`DELETE\\s+FROM\\s+${tabla}\\b`, "i"));
    }
  });

  it("no borra el student ni su atadura de identidad", () => {
    // Perderla devolvía un `403 SIN_PADRON` que no tenía nada que ver con el
    // padrón: la lección de `db:demo`.
    const sql = codigo(MIGRACION);
    expect(sql).not.toMatch(/DELETE\s+FROM\s+student\b/i);
    expect(sql).not.toMatch(/auth_user_id\s*=/i);
  });

  it("mover de institución exige un plan publicado, y falla si no lo hay", () => {
    expect(MIGRACION).toMatch(/publication_status\s*=\s*'PUBLISHED'/);
    expect(MIGRACION).toMatch(/no tiene ningún plan publicado/);
  });

  it("los dos rechazos que el repositorio reconoce son los que la migración levanta", () => {
    // Si alguien reescribe un `RAISE`, el repositorio deja de reconocerlo y el
    // rechazo se vuelve un 500. Los textos se comparan de los dos lados.
    for (const texto of ["no tiene ningún plan publicado", "no pertenece a la institución"]) {
      expect(MIGRACION, `la migración ya no dice "${texto}"`).toContain(texto);
      expect(REPO, `el repositorio ya no reconoce "${texto}"`).toContain(texto);
    }
  });

  it("las dos funciones sólo las ejecuta service_role", () => {
    for (const fn of ["reiniciar_alta_de_prueba", "instituciones_de_prueba"]) {
      expect(MIGRACION).toContain(`REVOKE ALL ON FUNCTION public.${fn} FROM PUBLIC, anon, authenticated`);
      expect(MIGRACION).toContain(`GRANT EXECUTE ON FUNCTION public.${fn} TO service_role`);
    }
  });
});

describe("El modo prueba no se puede montar sin darse cuenta", () => {
  /**
   * El riesgo real no es que alguien lo use: es que quede prendido. Estas dos
   * aserciones recorren el árbol y exigen que **todo** montaje del panel esté
   * detrás de la variable.
   */
  function tsx(dir: string): string[] {
    const abs = resolve(process.cwd(), dir);
    let entradas: string[];
    try {
      entradas = readdirSync(abs);
    } catch {
      return [];
    }
    return entradas.flatMap((e) => {
      const full = join(abs, e);
      if (statSync(full).isDirectory()) return tsx(join(dir, e));
      return /\.tsx?$/.test(e) ? [join(dir, e)] : [];
    });
  }

  const montajes = [...tsx("app"), ...tsx("components")]
    .filter((p) => !p.startsWith("components/prueba"))
    .map((p) => ({ p, code: LEER(p) }))
    .filter(({ code }) => /PanelDePrueba/.test(code));

  it("alguien lo monta", () => {
    expect(montajes.map((m) => m.p).sort()).toEqual([
      "app/(student)/layout.tsx",
      "app/alta/layout.tsx",
    ]);
  });

  it("ninguno lo monta sin el cerrojo", () => {
    const sinCerrojo = montajes
      .filter(({ code }) => !/process\.env\.MODO_PRUEBA === "1" && <PanelDePrueba/.test(code))
      .map((m) => m.p);
    expect(sinCerrojo).toEqual([]);
  });

  it("y está documentado como algo que se borra cuando ADR-006 abra", () => {
    expect(LEER("app/api/prueba/alta/route.ts")).toMatch(/ADR-006/);
    expect(LEER(".env.local.example")).toContain("MODO_PRUEBA");
  });
});
