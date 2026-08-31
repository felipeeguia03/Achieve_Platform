import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Etapa B2.6 — el criterio de Done, verificado.
 *
 * > *Ninguna superficie dibuja un fixture sin `?escenario=` explícito.*
 *
 * Es la regla que la `B2.5` rompió sin que nadie se enterara: `/api/hoy`
 * respondía `401`, el `catch` dejaba los datos en `null` y la ruta caía al
 * catálogo. En un navegador, `UX01` **nunca** mostró datos persistidos, y lo
 * hacía sin decirlo. Un fallback silencioso es indistinguible del éxito, y por
 * eso hace falta un guard y no una convención.
 */

const RUTA = (p: string) => readFileSync(resolve(process.cwd(), p), "utf8");

/**
 * Las superficies conectadas a la base, y las que todavía no.
 *
 * `UX06` **sí está**. Exigió crear `progress_entry`, que es la tabla que
 * `data-model.md` §10 ya declaraba y que ninguna migración había traído. No
 * adelanta la Fase B3: la B3 es el `ProgressUpdated` productivo —quién lo emite
 * y con qué causalidad (`C01-018`), qué magnitudes son mostrables (`C01-019`)—
 * y **nadie escribe esa tabla todavía**. Lo que se agregó es la estructura y su
 * invariante `I10`; la proyección se sigue negando a mostrar magnitudes.
 *
 * `UX07`–`UX09` no están: no hay tablas de examen (Fase B5).
 */
const CONECTADAS = [
  { ux: "UX01", pagina: "app/(student)/hoy/page.tsx", api: "/api/hoy" },
  { ux: "UX02", pagina: "app/(student)/materia/page.tsx", api: "/api/materia" },
  { ux: "UX03", pagina: "app/(student)/accion/page.tsx", api: "/api/accion" },
  { ux: "UX04", pagina: "app/(student)/compromiso/page.tsx", api: "/api/compromiso" },
  { ux: "UX05", pagina: "app/(student)/evidencia/page.tsx", api: "/api/evidencia" },
  { ux: "UX06", pagina: "app/(student)/progreso/page.tsx", api: "/api/progreso" },
] as const;

const SIN_CONECTAR = [
  { ux: "UX07", pagina: "app/(student)/examen/activar/page.tsx", falta: "tablas de examen · Fase B5" },
  { ux: "UX08", pagina: "app/(student)/examen/overview/page.tsx", falta: "tablas de examen · Fase B5" },
  { ux: "UX09", pagina: "app/(student)/examen/paso/page.tsx", falta: "tablas de examen · Fase B5" },
] as const;

describe("B2.6 · las superficies conectadas no caen al fixture en silencio", () => {
  for (const { ux, pagina, api } of CONECTADAS) {
    it(`${ux} pide a la API y trata el fallo como fallo`, () => {
      const src = RUTA(pagina);
      expect(src).toContain("useSuperficie");
      expect(src).toContain(api);
      // El fallo se dibuja como fallo. Sin esto vuelve el fallback silencioso.
      expect(src).toContain("NoSePudoCargar");
    });

    it(`${ux} sólo toca el catálogo dentro de la rama de \`?escenario=\``, () => {
      const src = RUTA(pagina);
      const guarda = src.indexOf("if (escenario)");
      const fixture = src.indexOf("getEscenario(");
      expect(guarda).toBeGreaterThan(-1);
      // El fixture se lee DESPUÉS de la guarda, nunca antes ni fuera de ella.
      expect(fixture).toBeGreaterThan(guarda);
    });

    it(`${ux} no dibuja nada mientras carga (P-12)`, () => {
      expect(RUTA(pagina)).toContain('respuesta.estado === "CARGANDO"');
    });
  }
});

describe("B2.6 · las que no se conectaron están declaradas, no olvidadas", () => {
  for (const { ux, pagina, falta } of SIN_CONECTAR) {
    it(`${ux} sigue en fixtures — falta ${falta}`, () => {
      const src = RUTA(pagina);
      expect(src).toContain("getEscenario(");
      // Si alguien la conecta, este test rompe y obliga a moverla de lista.
      expect(src).not.toContain("useSuperficie");
    });
  }
});

describe("B2.6 · la frontera con la pantalla", () => {
  /**
   * `components/screens/` se tocó **tres veces**, todas con autorización del
   * owner: dos guardas que permiten **no** dibujar un estado de materia que
   * nadie evaluó (`product.md` §13), y la key de la Bitácora en `UX06`, que con
   * datos reales podía repetirse dentro de un ciclo —una resubmission emite dos
   * veces el mismo hecho— y hacía que React reutilizara el nodo equivocado. El
   * criterio original de la etapa era *cero cambios*; quedó registrado en el
   * roadmap por qué se relajó.
   *
   * Este test fija el alcance de esa excepción: ninguna pantalla pide datos ni
   * conoce la API, y ninguna importa un fixture.
   */
  const PANTALLAS = [
    "components/screens/hoy-autogestion.tsx",
    "components/screens/materia-cursado.tsx",
    "components/screens/proxima-accion.tsx",
    "components/screens/compromiso.tsx",
    "components/screens/evidencia.tsx",
    "components/screens/progreso-bitacora.tsx",
  ];

  it("ninguna pantalla sabe que existe una API", () => {
    for (const p of PANTALLAS) {
      const src = RUTA(p);
      expect(src).not.toContain("useSuperficie");
      expect(src).not.toContain("/api/");
      expect(src).not.toContain("fetch(");
    }
  });

  it("ninguna pantalla importa un fixture", () => {
    for (const p of PANTALLAS) expect(RUTA(p)).not.toMatch(/from\s+"@\/lib\/fixtures/);
  });
});
