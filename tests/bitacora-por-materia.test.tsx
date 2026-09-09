import { readdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

import { MateriaCursado } from "@/components/screens/materia-cursado";
import { ctaRegistry } from "@/lib/navigation/cta-registry";
import { rutaDeCta, rutaDeCtaCon } from "@/lib/navigation";
import { proyectarMateria, type EstadoDeMateria } from "@/lib/server/servicios/proyeccion-materia";
import { getEscenario } from "@/lib/fixtures";

/**
 * **Fase B6.20 — la Bitácora es de una materia.**
 *
 * Dos frases del spec dicen lo mismo y ninguna se cumplía del todo:
 *
 * > `VI.2` §8.7 — *"una preview cronológica de eventos relevantes **de esta
 * > materia**"*
 * > `VI.6` §8.3 — *"Bitácora es el historial completo de la misma verdad
 * > derivada. **No existe una segunda fuente histórica**"*
 *
 * `hechos_de_cursada()` siempre fue por cursada; el que elegía mal era
 * `estado_de_progreso`, cuya CTE `cursada` tomaba **la primera activa** por
 * `created_at`. Con una materia eso era invisible. Con tres —que es lo que deja
 * el alta— mirar el registro de Álgebra abría el de Cálculo: **no una ausencia,
 * una respuesta equivocada**, el mismo defecto que ADR-054 cerró en `CTA-001`.
 */

const RAIZ = process.cwd();

/**
 * La **última** definición de cada función, no todas: una migración aplicada no
 * se edita, se reemplaza desde otra. Mismo criterio que `una-sola-historia`.
 */
function funcionesVigentes(): Map<string, string> {
  const dir = resolve(RAIZ, "supabase/migrations");
  const sql = readdirSync(dir)
    .filter((f) => f.endsWith(".sql"))
    .sort()
    .map((f) => readFileSync(resolve(dir, f), "utf8"))
    .join("\n");

  const vigentes = new Map<string, string>();
  for (const fn of sql.split(/CREATE OR REPLACE FUNCTION|CREATE FUNCTION/).slice(1)) {
    vigentes.set(fn.trim().split(/[(\s]/)[0], fn);
  }
  return vigentes;
}

const base: EstadoDeMateria = {
  instante: "2026-09-09T15:00:00.000Z",
  zona: "America/Argentina/Cordoba",
  cursadaId: "ce-algebra",
  materia: "Álgebra",
  examen: null,
  accion: null,
  compromiso: null,
  rescatePendiente: false,
  evidencia: "NONE",
  contextoIncompleto: false,
  ultimoAvanceEn: null,
  unidades: [],
  clases: [],
  cargaDeclarada: null,
  dimensiones: null,
  horario: [],
  actividadReciente: [],
};

/** Un hecho con copy aprobada. Sin copy, la entrada no se muestra y no cuenta. */
const UN_HECHO = {
  evento: "EvidenceSubmitted",
  en: "2026-09-09T12:00:00.000Z",
  porElEstudiante: true,
};

// ─────────────────────────────────────────────────────────────────────────────

describe("§1 · La lectura de `UX06` acepta de qué materia es", () => {
  it("`estado_de_progreso` recibe la cursada", () => {
    const fn = funcionesVigentes().get("public.estado_de_progreso");
    expect(fn, "la función tiene que existir en alguna migración").toBeDefined();
    expect(fn).toContain("p_course_enrollment_id");
  });

  it("y la usa para elegir la cursada, no sólo la declara", () => {
    // El defecto que esto caza es el más barato de cometer: agregar el
    // parámetro a la firma y no filtrar con él. La función seguiría compilando,
    // la ruta seguiría respondiendo 200, y devolvería la materia equivocada.
    const fn = funcionesVigentes().get("public.estado_de_progreso") ?? "";
    expect(fn).toContain("p_course_enrollment_id IS NULL OR ce.id = p_course_enrollment_id");
  });

  it("y también acota la evidencia, que es la que arrastra la cursada", () => {
    // `estado_de_progreso` deriva la cursada de la última evidencia. Filtrar una
    // punta y no la otra deja la pantalla diciendo «Álgebra» en la URL y
    // «Cálculo» en el encabezado.
    const fn = funcionesVigentes().get("public.estado_de_progreso") ?? "";
    expect(fn).toContain(
      "p_course_enrollment_id IS NULL OR a.course_enrollment_id = p_course_enrollment_id",
    );
  });

  it("la firma vieja se borra: dos overloads harían ambigua toda llamada", () => {
    // `CREATE OR REPLACE` no puede cambiar la lista de argumentos. Sin el `DROP`
    // quedan la de cuatro y la de cinco, y una llamada con cuatro deja de
    // resolver: `function is not unique`.
    const migracion = readFileSync(
      resolve(RAIZ, "supabase/migrations/20260930000000_bitacora_por_materia.sql"),
      "utf8",
    );
    expect(migracion).toContain(
      "DROP FUNCTION IF EXISTS public.estado_de_progreso(UUID, UUID, TIMESTAMPTZ, UUID)",
    );
  });

  it("el adaptador se lo pasa a la RPC", () => {
    // Sin esta línea el parámetro existe en la base y nadie lo manda nunca.
    const repo = readFileSync(resolve(RAIZ, "lib/server/repositorios/progreso-lectura.ts"), "utf8");
    expect(repo).toContain("p_course_enrollment_id: courseEnrollmentId");
  });

  it("y el Controller lo lee de la query, nunca del cuerpo ni de un header", () => {
    const ruta = readFileSync(resolve(RAIZ, "app/api/progreso/route.ts"), "utf8");
    expect(ruta).toContain('parametros.get("cursada")');
    // La identidad NO viaja en el request: sale de la sesión. Es lo que hace que
    // pedir la cursada de otro devuelva 404 y no su Bitácora.
    expect(ruta).toContain("sesion.estudiante.institutionId");
    expect(ruta).toContain("sesion.estudiante.id");
  });
});

describe("§2 · `CTA-009` transporta la cursada", () => {
  it("el nombre del parámetro vive en el registro, no en la página", () => {
    expect(ctaRegistry["CTA-009"].parametro?.nombre).toBe("cursada");
  });

  it("arma `/progreso?cursada=<id>`", () => {
    expect(rutaDeCtaCon("CTA-009", "ce-algebra")).toBe(`${rutaDeCta("CTA-009")}?cursada=ce-algebra`);
  });

  it("sin cursada devuelve la ruta pelada: es el Track A, no un caso degradado", () => {
    expect(rutaDeCtaCon("CTA-009", null)).toBe(rutaDeCta("CTA-009"));
  });

  it("escapa el valor en vez de pegarlo crudo", () => {
    expect(rutaDeCtaCon("CTA-009", "a b&c")).toBe(`${rutaDeCta("CTA-009")}?cursada=a%20b%26c`);
  });

  it("sigue siendo lectura: no produce ningún resultado autoritativo", () => {
    // Si un día esta CTA escribiera algo, la Bitácora dejaría de ser el
    // historial de lo que pasó para ser también una de las cosas que pasan.
    expect(ctaRegistry["CTA-009"].resultadoAutoritativo).toBe("ninguno; lectura");
    expect(ctaRegistry["CTA-009"].origen).toContain("UX02");
  });
});

describe("§3 · `UX02` sabe de qué cursada habla, y no la inventa", () => {
  it("la proyección deja pasar el id que la base devuelve", () => {
    expect(proyectarMateria(base).cursadaId).toBe("ce-algebra");
  });

  it("la página de la materia se lo pasa a la CTA", () => {
    const pagina = readFileSync(resolve(RAIZ, "app/(student)/materia/page.tsx"), "utf8");
    expect(pagina).toContain('rutaDeCtaCon("CTA-009", props.cursadaId)');
  });
});

describe("§4 · La puerta al historial aparece si hay historial", () => {
  it("sin actividad visible no se ofrece: no se promete un registro vacío", () => {
    const props = proyectarMateria(base);
    expect(props.actividadReciente).toBeNull();
    expect(props.verRegistro).toBeNull();
  });

  it("con actividad visible se ofrece", () => {
    const props = proyectarMateria({ ...base, actividadReciente: [UN_HECHO] });
    expect(props.actividadReciente).not.toBeNull();
    expect(props.verRegistro).toBe("Ver avance");
  });

  it("un hecho sin copy aprobada no abre la puerta", () => {
    // La preview y la Bitácora comparten `aEntradaVisible`: lo que no tiene copy
    // no se muestra en ninguna de las dos. Un hecho invisible no es historial.
    const props = proyectarMateria({
      ...base,
      actividadReciente: [{ ...UN_HECHO, evento: "EventoQueNadieAprobo" }],
    });
    expect(props.actividadReciente).toBeNull();
    expect(props.verRegistro).toBeNull();
  });

  it("los dos campos se mueven juntos, siempre", () => {
    // La invariante, dicha una vez: `verRegistro` es `null` exactamente cuando
    // `actividadReciente` lo es.
    for (const hechos of [[], [UN_HECHO], [UN_HECHO, UN_HECHO]]) {
      const props = proyectarMateria({ ...base, actividadReciente: hechos });
      expect(props.verRegistro === null).toBe(props.actividadReciente === null);
    }
  });
});

describe("§5 · La pantalla la muestra y no decide nada", () => {
  const props = getEscenario("FX-DAY-BASE").materia!;

  it("con `verRegistro` la ofrece, y avisa con el clic", () => {
    const ver = vi.fn();
    render(<MateriaCursado {...props} verRegistro="Ver avance" onVerRegistro={ver} />);
    fireEvent.click(screen.getByText("Ver avance"));
    expect(ver).toHaveBeenCalledTimes(1);
  });

  it("sin `verRegistro` no se renderiza: no se renderiza deshabilitada", () => {
    render(<MateriaCursado {...props} verRegistro={null} />);
    expect(screen.queryByText("Ver avance")).toBeNull();
  });

  it("aparece una sola vez: un concepto, un lugar", () => {
    // `C-02`. Es el defecto que ya se corrigió una vez en `UX01`, donde la misma
    // CTA quedó arriba a la derecha y al pie.
    render(<MateriaCursado {...props} verRegistro="Ver avance" />);
    expect(screen.queryAllByText("Ver avance")).toHaveLength(1);
  });
});
